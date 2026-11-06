import express from 'express';
import db from '../database/db.js';
import { requireRole } from '../middleware/authGuard.js';
import { requireFields, pickField, toText, toNumber } from '../utils/payload.js';
import { getTahapPrasyaratUjian } from '../academic/examRules.js';
import { verifikasiPinDenganToken, verifikasiTokenPenerbitan, setPin, getPinHash, PIN_KONTEKS_DEKANAT } from '../utils/pinAuth.js';
import { buildVerifiedPayload, resolveExamPanel } from '../documents/documentPayload.js';
import { generateSuratKeputusanDekan } from '../documents/pdfGenerator.js';

const router = express.Router();

// 1. Verifikasi Berkas Pendaftaran Ujian
// Admin & Koorprodi berwenang meninjau berkas pendaftaran mahasiswa
router.get('/verifikasi-berkas', requireRole(['admin', 'koorprodi', 'superadmin']), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM pendaftaran_ujian ORDER BY tanggal_daftar DESC').all();
    const formatted = rows.map((r) => ({
      ...r,
      namaMahasiswa: r.nama_mahasiswa,
      programStudi: r.program_studi,
      jenisUjian: r.jenis_ujian,
      tanggalDaftar: r.tanggal_daftar,
      statusVerifikasi: r.status_verifikasi,
      pembimbingUtama: r.pembimbing_utama,
      berkasList: JSON.parse(r.berkas_json || '[]'),
      catatanAdmin: r.catatan_admin,
      metrikAkademik: (() => { try { return JSON.parse(r.metrik_akademik_json || 'null'); } catch { return null; } })()
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin, Koorprodi, Superadmin berwenang mengesahkan verifikasi berkas
router.put('/verifikasi-berkas/:id', requireRole(['admin', 'koorprodi', 'superadmin']), (req, res) => {
  try {
    const { id } = req.params;
    const { statusVerifikasi, catatanAdmin } = req.body;

    if (!statusVerifikasi || !String(statusVerifikasi).trim()) {
      return res.status(400).json({ success: false, message: 'Status verifikasi wajib diisi.' });
    }

    const existing = db.prepare('SELECT id FROM pendaftaran_ujian WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Rekam pendaftaran berkas tidak ditemukan.' });
    }

    const stmt = db.prepare(`
      UPDATE pendaftaran_ujian 
      SET status_verifikasi = ?, catatan_admin = ?
      WHERE id = ?
    `);
    stmt.run(statusVerifikasi, catatanAdmin || '', id);

    res.json({ success: true, message: 'Status verifikasi berkas berhasil diperbarui di basis data.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mahasiswa, Admin, Superadmin berwenang mengajukan pendaftaran berkas
/**
 * Pemetaan jenis ujian ke tahap ujian yang corresponds.
 * Audit 21 Oktober 2026 (temuan BP-1): pendaftaran ujian semula TIDAK
 * memiliki gerbang sama sekali terhadap tahapan — mahasiswa bisa mendaftar
 * ujian (Seminar Proposal, Sidang Ujian Skripsi, dst.) tanpa menyelesaikan
 * satu pun tahapan, sehingga muncul mahasiswa "tahapan 0 tapi sudah punya
 * rekam pendaftaran".
 */
// Peta jenis ujian -> tahap prasyarat kini berada di modul bersama
// (server/academic/examRules.js) agar gerbang pendaftaran dan pemilihan
// rubrik memakai satu sumber kebenaran.

/**
 * Menghitung tahapan prasyarat yang WAJIB selesai sebelum mahasiswa boleh
 * mendaftar ujian tertentu.
 *
 * @returns {{ok: boolean, kodeTahapUjian: string|null, belum: Array}}
 */
function getPrasyaratPendaftaran(ta, jenisUjian) {
  const kode = getTahapPrasyaratUjian(jenisUjian, ta?.jenjang);
  if (!kode) return { ok: true, kodeTahapUjian: null, belum: [] };

  const semua = db
    .prepare('SELECT kode_tahap, nama_tahap, urutan, status FROM tahap_status WHERE tugas_akhir_id = ? ORDER BY urutan ASC')
    .all(ta.id);

  const target = semua.find((s) => s.kode_tahap === kode);
  if (!target) {
    // Audit 21 Oktober 2026 (P0-1): jenis ujian ini tidak ada dalam template
    // tahapan jenjang mahasiswa. Semula hal ini dianggap "tanpa gerbang" sehingga
    // mahasiswa tetap boleh mendaftar ujian yang tidak berlaku untuk program
    // studinya. Sekarang pendaftaran DITOLAK.
    return {
      ok: false,
      kodeTahapUjian: kode,
      belum: [],
      tidakBerlaku: true,
      jenjang: ta?.jenjang || '-'
    };
  }

  // Semua tahap SEBELUM tahap ujian harus berstatus Selesai.
  const belum = semua.filter((s) => s.urutan < target.urutan && s.status !== 'Selesai');
  return { ok: belum.length === 0, kodeTahapUjian: kode, belum };
}

router.post('/verifikasi-berkas', requireRole(['mahasiswa', 'admin', 'superadmin']), (req, res) => {
  try {
    const {
      id, mhsId, nim, namaMahasiswa, jenjang, programStudi,
      jenisUjian, tanggalDaftar, pembimbingUtama, kopromotor,
      judul, berkasList, catatanAdmin, metrik
    } = req.body;

    // Audit 21 Oktober 2026 (temuan BP-1): pendaftaran ujian digerbang oleh
    // tahapan. Mahasiswa hanya boleh mendaftar ujian bila seluruh tahapan
    // PRA-SYARAT (tahap-tahap sebelum tahap ujian) telah berstatus Selesai.
    {
      const nimPendaftaran = String(req.user?.nomorInduk || nim || '').trim();
      const taPendaftaran = nimPendaftaran
        ? db.prepare('SELECT * FROM tugas_akhir WHERE nim = ?').get(nimPendaftaran)
        : null;

      // Audit 21 Oktober 2026 (P0-1): tanpa entri Tugas Akhir, mahasiswa TIDAK
      // boleh mendaftar ujian sama sekali. Semula seluruh blok gerbang dilewati
      // bila tugas_akhir belum ada, sehingga mahasiswa baru bisa langsung
      // mendaftar ujian tanpa pernah melalui tahapan apa pun.
      if (!taPendaftaran) {
        return res.status(409).json({
          success: false,
          code: 'TA_NOT_INITIALIZED',
          message:
            'Pendaftaran ujian belum dapat dilakukan: Anda belum memiliki entri Tugas Akhir. ' +
            'Hubungi Koordinator Program Studi untuk inisialisasi Tugas Akhir terlebih dahulu.'
        });
      }

      {
        const prasyarat = getPrasyaratPendaftaran(taPendaftaran, jenisUjian);
        if (prasyarat.tidakBerlaku) {
          return res.status(409).json({
            success: false,
            code: 'EXAM_TYPE_NOT_APPLICABLE',
            message:
              `Jenis ujian "${jenisUjian}" tidak berlaku untuk jenjang ${prasyarat.jenjang}. ` +
              'Pilih jenis ujian yang sesuai dengan program studi Anda.',
            jenjang: prasyarat.jenjang
          });
        }
        // Aturan akademik dari rules_json jenjang (P1-3): beban SKS tempuh
        // minimal, skor TOEFL minimal, dan batas similaritas adalah SYARAT
        // PENDAFTARAN. Sebelumnya angka-angka ini tidak dibaca kode mana pun.
        const rulesRow = db
          .prepare('SELECT rules_json FROM tahapan_aturan WHERE jenjang = ?')
          .get(taPendaftaran.jenjang);
        let rules = {};
        try {
          rules = rulesRow?.rules_json ? JSON.parse(rulesRow.rules_json) : {};
        } catch (_) {
          rules = {};
        }

        const m = metrik || {};
        const minSKS = Number(rules.minSKS || 0);
        if (minSKS > 0 && Number(m.sksLulus || 0) < minSKS) {
          return res.status(409).json({
            success: false,
            code: 'ACADEMIC_REQUIREMENT_NOT_MET',
            message: `SKS belum memenuhi syarat:requires ${minSKS} SKS, tercatat ${Number(m.sksLulus || 0)} SKS.`,
            field: 'sksLulus',
            minimum: minSKS,
            current: Number(m.sksLulus || 0)
          });
        }

        const minToefl = Number(rules.minToefl || 0);
        if (minToefl > 0 && Number(m.toeflScore || 0) < minToefl) {
          return res.status(409).json({
            success: false,
            code: 'ACADEMIC_REQUIREMENT_NOT_MET',
            message: `Skor TOEFL belum memenuhi syarat: requires ${minToefl}, tercatat ${Number(m.toeflScore || 0)}.`,
            field: 'toeflScore',
            minimum: minToefl,
            current: Number(m.toeflScore || 0)
          });
        }

        const maxTurnitin = Number(rules.maxTurnitin || 0);
        if (maxTurnitin > 0 && Number(m.similarity || 0) > maxTurnitin) {
          return res.status(409).json({
            success: false,
            code: 'ACADEMIC_REQUIREMENT_NOT_MET',
            message: `Similaritas naskah melebihi batas: maksimum ${maxTurnitin}%, tercatat ${Number(m.similarity || 0)}%.`,
            field: 'similarity',
            maximum: maxTurnitin,
            current: Number(m.similarity || 0)
          });
        }

        if (!prasyarat.ok) {
          return res.status(409).json({
            success: false,
            code: 'STAGE_PREREQUISITE_NOT_MET',
            message:
              `Pendaftaran ${jenisUjian} belum dapat dilakukan: tahapan prasyarat belum selesai. ` +
              `Selesaikan terlebih dahulu: ${prasyarat.belum.map((b) => b.nama_tahap || b.kode_tahap).join(', ')}.`,
            belumSelesai: prasyarat.belum.map((b) => ({ kode: b.kode_tahap, nama: b.nama_tahap, status: b.status }))
          });
        }
      }
    }

    // Ambil identitas terverifikasi dari token jika ada
    const callerNim = req.user?.nomorInduk || nim;
    const callerNama = req.user?.nama || namaMahasiswa;

    if (!callerNim || !String(callerNim).trim()) {
      return res.status(400).json({ success: false, message: 'NIM mahasiswa wajib diisi.' });
    }

    // Sanitasi metrik: hanya simpan field yang relevan dan bertipe benar.
    const metrikSanitized = (() => {
      if (!metrik || typeof metrik !== 'object') return null;
      const m = {};
      const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
      const ipk = num(metrik.ipk); if (Number.isFinite(ipk) && ipk >= 0 && ipk <= 4) m.ipk = ipk;
      const sks = num(metrik.sksLulus); if (Number.isFinite(sks) && sks >= 0 && sks <= 300) m.sksLulus = sks;
      const toefl = num(metrik.toeflScore); if (Number.isFinite(toefl) && toefl >= 0 && toefl <= 700) m.toeflScore = toefl;
      if (typeof metrik.sertifikatNo === 'string' && metrik.sertifikatNo.trim()) m.sertifikatNo = metrik.sertifikatNo.trim().slice(0, 200);
      if (typeof metrik.sertifikatTgl === 'string' && metrik.sertifikatTgl.trim()) m.sertifikatTgl = metrik.sertifikatTgl.trim().slice(0, 20);
      const sim = num(metrik.similarity); if (Number.isFinite(sim) && sim >= 0 && sim <= 100) m.similarity = sim;
      const ai = num(metrik.aiDetection); if (Number.isFinite(ai) && ai >= 0 && ai <= 100) m.aiDetection = ai;
      return Object.keys(m).length > 0 ? m : null;
    })();

    // Sisipkan metrik ke item berkas (jika ada) agar admin melihatnya per-berkas.
    const finalBerkasList = (() => {
      const list = Array.isArray(berkasList) ? [...berkasList] : [];
      if (metrikSanitized && list.length > 0) {
        list[list.length - 1] = { ...list[list.length - 1], metrik: metrikSanitized };
      }
      return list;
    })();

    const newId = id || `reg-${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO pendaftaran_ujian (
        id, mhs_id, nim, nama_mahasiswa, jenjang, program_studi,
        jenis_ujian, tanggal_daftar, status_verifikasi, pembimbing_utama,
        kopromotor, judul, berkas_json, catatan_admin, metrik_akademik_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu Verifikasi', ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newId,
      mhsId || req.user?.id || 'mhs-1',
      callerNim || '210211100142',
      callerNama || 'Mahasiswa FEB UTM',
      jenjang || req.user?.jenjang || 'S1',
      programStudi || req.user?.prodi || 'S1 Manajemen',
      jenisUjian || 'Seminar Proposal Skripsi',
      tanggalDaftar || new Date().toISOString().split('T')[0],
      pembimbingUtama || null,
      kopromotor || null,
      judul || 'Judul Tugas Akhir FEB UTM',
      JSON.stringify(finalBerkasList),
      catatanAdmin || null,
      metrikSanitized ? JSON.stringify(metrikSanitized) : null
    );

    res.status(201).json({
      success: true,
      message: 'Pendaftaran ujian mahasiswa berhasil diajukan dan disimpan ke database.',
      data: { id: newId, metrik: metrikSanitized }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// 1b. OTORISASI PIN DEKANAT & PENERBITAN SK MASSAL
//
// Audit 22 Oktober 2026 (butir #1): penerbitan SK massal sebelumnya HANYA
// BERHANTAR di sisi peramban — PIN apa pun >= 4 karakter diterima sebagai
// otorisasi Dekan dan tidak ada dokumen yang pernah disimpan, padahal
// antarmuka menampilkan notifikasi "berhasil".
//
// Alur baru (sepenuhnya di server):
//   1. POST /api/admin/verifikasi-pin  -> hash PIN dicocokkan (scrypt +
//      timingSafeEqual), percobaan dibatasi & dikunci, dan token scoped
//      berumur pendek diterbitkan bila PIN benar.
//   2. POST /api/admin/sk/bulk         -> mewajibkan token tersebut; tanpa
//      token, penerbitan MASAL DITOLAK. Setiap SK yang terbit dicatat ke
//      sk_dokumen, diarsipkan, dan tercatat di audit_log.
// ---------------------------------------------------------------------------

/**
 * POST /api/admin/verifikasi-pin
 * Memverifikasi PIN Dekanat dan menerbitkan token otorisasi berumur pendek.
 */
router.post('/verifikasi-pin', requireRole(['koorprodi', 'admin', 'superadmin']), (req, res) => {
  try {
    const pin = String(req.body?.pin || '');
    const hasil = verifikasiPinDenganToken(pin, {
      konteks: PIN_KONTEKS_DEKANAT,
      oleh: req.user?.nomorInduk || req.user?.id || 'unknown',
      ip: req.ip || '-'
    });

    if (!hasil.ok) {
      return res.status(hasil.kode === 'PIN_LOCKED' ? 429 : 401).json({
        success: false,
        code: hasil.kode,
        message: hasil.message
      });
    }

    res.json({
      success: true,
      message: hasil.message,
      data: { token: hasil.token, expiresIn: hasil.expiresIn, konteks: PIN_KONTEKS_DEKANAT }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/atur-pin
 * Menetapkan (mengganti) PIN Dekanat. Hanya Super Admin.
 * PIN disimpan sebagai hash scrypt + salt, tidak pernah sebagai teks polos.
 */
router.post('/atur-pin', requireRole(['superadmin']), (req, res) => {
  try {
    const pin = String(req.body?.pin || '');
    if (!/^\d{6,12}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PIN_FORMAT',
        message: 'PIN Dekanat harus berupa 6-12 digit angka.'
      });
    }
    setPin(PIN_KONTEKS_DEKANAT, pin, req.user?.nomorInduk || req.user?.id || null);
    res.json({ success: true, message: 'PIN Dekanat berhasil ditetapkan (disimpan sebagai hash).' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/admin/status-pin
 * Melaporkan apakah PIN Dekanat sudah ditetapkan (tanpa membocorkan nilainya).
 */
router.get('/status-pin', requireRole(['koorprodi', 'admin', 'superadmin']), (req, res) => {
  res.json({
    success: true,
    data: { sudahDiatur: Boolean(getPinHash(PIN_KONTEKS_DEKANAT)) }
  });
});

/**
 * POST /api/admin/sk/bulk
 * Menerbitkan SK untuk BANYAK mahasiswa sekaligus.
 * Memerlukan token otorisasi Dekanat (hasil POST /verifikasi-pin).
 */
router.post('/sk/bulk', requireRole(['koorprodi', 'admin', 'superadmin']), async (req, res) => {
  try {
    // 1. Token otorisasi wajib
    const otorisasi = verifikasiTokenPenerbitan(req.body?.tokenOtorisasi, PIN_KONTEKS_DEKANAT);
    if (!otorisasi.ok) {
      return res.status(401).json({
        success: false,
        code: otorisasi.kode,
        message: otorisasi.message
      });
    }

    // 2. Payload
    const {
      jenisSK = 'SK Penetapan Pembimbing & Penguji Ujian',
      jenjang = 'S1',
      programStudi = 'S-1 Manajemen',
      tanggalTerbit = new Date().toISOString().slice(0, 10),
      penandatangan = '',
      penandatanganNip = '',
      nomorSKBase = '',
      mahasiswa = [],
      generatePdf = true
    } = req.body || {};

    if (!Array.isArray(mahasiswa) || mahasiswa.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'NO_STUDENTS',
        message: 'Daftar mahasiswa yang akan diterbitkan SK-nya tidak boleh kosong.'
      });
    }
    if (mahasiswa.length > 200) {
      return res.status(400).json({
        success: false,
        code: 'TOO_MANY_STUDENTS',
        message: 'Penerbitan massal dibatasi 200 mahasiswa per permintaan.'
      });
    }

    // 3. Nomor SK berurutan
    const base = String(nomorSKBase || '').trim();
    const prefix = base ? base.replace(/\/$/, '') + '/' : '';
    const tahun = String(tanggalTerbit).slice(0, 4);

    const hasil = [];
    const gagal = [];

    for (let i = 0; i < mahasiswa.length; i++) {
      const m = mahasiswa[i] || {};
      const nim = String(m.nim || '').trim();
      if (!nim) {
        gagal.push({ nim: '-', message: 'NIM kosong.' });
        continue;
      }

      const student = db
        .prepare('SELECT * FROM users WHERE nomor_induk = ?')
        .get(nim);
      if (!student) {
        gagal.push({ nim, message: 'Mahasiswa tidak ditemukan dalam basis data.' });
        continue;
      }

      // Nomor SK: basis + urutan, dijamin unik.
      let nomorSK = '';
      for (let attempt = 0; attempt < 50; attempt++) {
        const candidate = `${prefix}${tahun}/${String(i + 1).padStart(4, '0')}`;
        const bentrok = db.prepare('SELECT id FROM sk_dokumen WHERE nomor_sk = ?').get(candidate);
        if (!bentrok) { nomorSK = candidate; break; }
      }
      if (!nomorSK) {
        gagal.push({ nim, message: 'Tidak dapat menentukan nomor SK yang unik.' });
        continue;
      }

      // Tanda tangan: dari payload atau identitas penandatangan.
      const penandatanganFinal = penandatangan || student.nama || '';
      const penandatanganNipFinal = penandatanganNip || '';

      // Dosen terkait dari TA bila tersedia.
      let dosenTerkait = Array.isArray(m.dosenTerkait) ? m.dosenTerkait : [];
      if (!dosenTerkait.length) {
        const ta = db.prepare('SELECT pembimbing_utama, pembimbing_pendamping FROM tugas_akhir WHERE nim = ?').get(nim);
        if (ta?.pembimbing_utama) {
          dosenTerkait = [{ nama: ta.pembimbing_utama, peran: 'Pembimbing Utama' }];
        }
      }

      const idSK = `sk-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;

      try {
        db.prepare(
          `INSERT INTO sk_dokumen (
             id, nomor_sk, jenis_sk, jenjang, program_studi, mahasiswa_nim,
             mahasiswa_nama, judul_ta, dosen_terkait_json, tanggal_terbit,
             penandatangan, status, file_pdf
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          idSK,
          nomorSK,
          jenisSK,
          jenjang,
          programStudi,
          nim,
          m.namaMahasiswa || student.nama || '',
          m.judulTA || '',
          JSON.stringify(dosenTerkait),
          tanggalTerbit,
          penandatanganFinal,
          'Diterbitkan',
          null
        );

        // Berkas PDF resmi (opsional, dapat dilewati untuk penerbitan massal
        // yang sangat banyak).
        let filePdf = null;
        let kodeVerifikasi = null;
        if (generatePdf) {
          try {
            const verified = buildVerifiedPayload({
              nim,
              payload: { nomorDokumen: nomorSK, judul: m.judulTA || '' },
              panel: resolveExamPanel(nim, m.ujianId || m.id)
            });
            if (verified) {
              const result = await generateSuratKeputusanDekan({
                ...verified,
                nomorDokumen: nomorSK,
                penandatangan: penandatanganFinal,
                penandatanganNip: penandatanganNipFinal
              });
              filePdf = result?.fileUrl || result?.filePath || null;
              kodeVerifikasi = result?.verificationCode || null;
              if (filePdf) {
                db.prepare('UPDATE sk_dokumen SET file_pdf = ? WHERE id = ?').run(filePdf, idSK);
              }
            }
          } catch (_) {
            // failures generating the PDF do not cancel the SK record itself
          }
        }

        hasil.push({ nim, nama: m.namaMahasiswa || student.nama, nomorSK, idSK, filePdf, kodeVerifikasi });
      } catch (rowErr) {
        gagal.push({ nim, message: rowErr.message });
      }
    }

    // 4. Jejak audit
    try {
      db.prepare('INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)').run(
        req.user?.id || req.user?.nomorInduk || 'unknown',
        'PUBLISH_SK_BULK',
        `Penerbitan SK massal: ${hasil.length} berhasil, ${gagal.length} gagal. Jenis: ${jenisSK}; Jenjang: ${jenjang}; Nomor dasar: ${base || '(otomatis)'}`
      );
    } catch (_) {}

    res.status(hasil.length > 0 ? 201 : 500).json({
      success: hasil.length > 0,
      message:
        hasil.length > 0
          ? `${hasil.length} Surat Keputusan berhasil diterbitkan dan diarsipkan.${gagal.length ? ` ${gagal.length} gagal.` : ''}`
          : 'Tidak ada SK yang berhasil diterbitkan.',
      data: { berhasil: hasil, gagal, total: mahasiswa.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Surat Keputusan (SK) Resmi
router.get('/sk', requireRole(['admin', 'superadmin', 'koorprodi', 'dosen']), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM sk_dokumen ORDER BY tanggal_terbit DESC').all();
    const formatted = rows.map((r) => ({
      ...r,
      nomorSK: r.nomor_sk,
      jenisSK: r.jenis_sk,
      programStudi: r.program_studi,
      mahasiswaNIM: r.mahasiswa_nim,
      mahasiswaNama: r.mahasiswa_nama,
      judulTA: r.judul_ta,
      dosenTerkait: JSON.parse(r.dosen_terkait_json || '[]'),
      tanggalTerbit: r.tanggal_terbit,
      filePdf: r.file_pdf
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sk', requireRole(['admin', 'superadmin']), (req, res) => {
  try {
    const {
      id, nomorSK, jenisSK, jenjang, programStudi, mahasiswaNIM,
      mahasiswaNama, judulTA, dosenTerkait, tanggalTerbit, penandatangan,
      status, filePdf
    } = req.body;

    if (!nomorSK || !String(nomorSK).trim()) {
      return res.status(400).json({ success: false, message: 'Nomor SK wajib diisi.' });
    }
    if (!jenisSK || !String(jenisSK).trim()) {
      return res.status(400).json({ success: false, message: 'Jenis SK wajib diisi.' });
    }

    const duplicate = db.prepare('SELECT id FROM sk_dokumen WHERE nomor_sk = ?').get(String(nomorSK).trim());
    if (duplicate) {
      return res.status(409).json({ success: false, message: `Nomor SK ${nomorSK} sudah pernah diterbitkan.` });
    }

    const stmt = db.prepare(`
      INSERT INTO sk_dokumen (
        id, nomor_sk, jenis_sk, jenjang, program_studi, mahasiswa_nim,
        mahasiswa_nama, judul_ta, dosen_terkait_json, tanggal_terbit,
        penandatangan, status, file_pdf
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id || `sk-${Date.now()}`,
      String(nomorSK).trim(),
      jenisSK,
      jenjang,
      programStudi,
      mahasiswaNIM,
      mahasiswaNama,
      judulTA,
      JSON.stringify(dosenTerkait || []),
      tanggalTerbit,
      penandatangan,
      status || 'Diterbitkan',
      filePdf || ''
    );

    res.json({ success: true, message: `SK Nomor ${nomorSK} berhasil disimpan di basis data.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Alokasi Ruangan Ujian (dengan validasi bentrok jadwal di server)
router.get('/ruangan', requireRole(['admin', 'superadmin', 'koorprodi', 'dosen', 'penguji', 'mahasiswa']), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM alokasi_ruangan ORDER BY tanggal ASC, jam_mulai ASC').all();
    const formatted = rows.map((r) => ({
      ...r,
      namaMahasiswa: r.nama_mahasiswa,
      jenisUjian: r.jenis_ujian,
      ruangId: r.ruang_id,
      ruangNama: r.ruang_nama,
      jamMulai: r.jam_mulai,
      jamSelesai: r.jam_selesai,
      ketuaPenguji: r.ketua_penguji
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/ruangan', requireRole(['admin', 'superadmin']), (req, res) => {
  try {
    // Audit 21 Oktober 2026 (Simulasi Proses A–Z): validasi field wajib
    // ditambahkan agar field kosong tidak diteruskan ke SQLite (HTTP 500).
    const { ok, values, missing } = requireFields(req.body, [
      { names: ['namaMahasiswa', 'nama_mahasiswa'], label: 'namaMahasiswa' },
      { names: ['nim'], label: 'nim' },
      { names: ['ruangId', 'ruang_id'], label: 'ruangId' },
      { names: ['ruangNama', 'ruang_nama'], label: 'ruangNama' },
      { names: ['tanggal'], label: 'tanggal' },
      { names: ['jamMulai', 'jam_mulai'], label: 'jamMulai' },
      { names: ['jamSelesai', 'jam_selesai'], label: 'jamSelesai' }
    ]);

    if (!ok) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_REQUIRED_FIELDS',
        message: `Data alokasi ruangan belum lengkap. Field wajib yang belum diisi: ${missing.join(', ')}.`,
        missing
      });
    }

    const id = pickField(req.body, 'id');
    const namaMahasiswa = values.namaMahasiswa;
    const nim = values.nim;
    const jenjang = pickField(req.body, 'jenjang') || 'S1';
    const jenisUjian = pickField(req.body, 'jenisUjian', 'jenis_ujian') || 'Sidang Tugas Akhir';
    const ruangId = values.ruangId;
    const ruangNama = values.ruangNama;
    const tanggal = values.tanggal;
    const jamMulai = values.jamMulai;
    const jamSelesai = values.jamSelesai;
    const moda = pickField(req.body, 'moda') || 'Tatap Muka (Luring)';
    const ketuaPenguji = toText(pickField(req.body, 'ketuaPenguji', 'ketua_penguji'), '');
    const status = pickField(req.body, 'status') || 'Terkonfirmasi';
    const catatan = toText(pickField(req.body, 'catatan'), '');

    // Deteksi bentrok jadwal di database
    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const existingSlots = db.prepare('SELECT * FROM alokasi_ruangan WHERE ruang_id = ? AND tanggal = ?').all(ruangId, tanggal);
    const startA = toMinutes(jamMulai);
    const endA = toMinutes(jamSelesai);

    const conflict = existingSlots.find((s) => {
      const startB = toMinutes(s.jam_mulai);
      const endB = toMinutes(s.jam_selesai);
      return startA < endB && endA > startB;
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Bentrok Jadwal: Ruangan telah terpakai oleh ${conflict.nama_mahasiswa} pada ${conflict.jam_mulai} - ${conflict.jam_selesai} WIB.`
      });
    }

    const stmt = db.prepare(`
      INSERT INTO alokasi_ruangan (
        id, nama_mahasiswa, nim, jenjang, jenis_ujian, ruang_id,
        ruang_nama, tanggal, jam_mulai, jam_selesai, moda, ketua_penguji, status, catatan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id || `plot-${Date.now()}`,
      namaMahasiswa,
      nim,
      jenjang,
      jenisUjian,
      ruangId,
      ruangNama,
      tanggal,
      jamMulai,
      jamSelesai,
      moda,
      ketuaPenguji,
      status || 'Terkonfirmasi',
      catatan || ''
    );

    res.json({ success: true, message: 'Alokasi ruangan berhasil dijadwalkan di database.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/ruangan/:id', requireRole(['admin', 'superadmin']), (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM alokasi_ruangan WHERE id = ?').run(id);
    res.json({ success: true, message: 'Alokasi ruangan berhasil dibatalkan.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Audit Log Keamanan & Forensik Sistem
router.get('/audit-logs', requireRole(['admin', 'superadmin']), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 50').all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Manajemen Jadwal & Linimasa Tahapan Akademik (Admin Akademik)
router.get('/jadwal-tahapan', requireRole(['admin', 'superadmin', 'koorprodi', 'dosen', 'penguji', 'mahasiswa']), (req, res) => {
  try {
    const { jenjang, status } = req.query;
    let query = 'SELECT * FROM jadwal_tahapan';
    const params = [];
    const conditions = [];

    if (jenjang && jenjang !== 'Semua') {
      conditions.push('jenjang = ?');
      params.push(jenjang);
    }
    if (status && status !== 'Semua') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY tanggal_mulai ASC';

    const rows = db.prepare(query).all(...params);
    const formatted = rows.map((r) => ({
      id: r.id,
      jenjang: r.jenjang,
      prodi: r.prodi,
      tahapKode: r.tahap_kode,
      tahapNama: r.tahap_nama,
      semester: r.semester,
      tanggalMulai: r.tanggal_mulai,
      tanggalSelesai: r.tanggal_selesai,
      jamDeadline: r.jam_deadline,
      status: r.status,
      moda: r.moda,
      targetMahasiswa: r.target_mahasiswa,
      terdaftarMahasiswa: r.terdaftar_mahasiswa,
      persyaratanRingkas: r.persyaratan_ringkas,
      catatanSOP: r.catatan_sop,
      penanggungJawab: r.penanggung_jawab
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/jadwal-tahapan', requireRole(['admin', 'superadmin']), (req, res) => {
  try {
    // Audit 21 Oktober 2026 (Simulasi Proses A–Z): field yang kosong diteruskan
    // apa adanya ke driver SQLite sehingga permintaan berakhir HTTP 500
    // "Provided value cannot be bound to SQLite parameter N" — menyamar sebagai
    // kegagalan server. Sekarang field wajib divalidasi lebih dulu (400) dan
    // kedua konvensi nama field (camelCase / snake_case) diterima.
    const { ok, values, missing } = requireFields(req.body, [
      { names: ['jenjang'], label: 'jenjang' },
      { names: ['tahapKode', 'tahap_kode'], label: 'tahapKode' },
      { names: ['tahapNama', 'tahap_nama'], label: 'tahapNama' },
      { names: ['tanggalMulai', 'tanggal_mulai'], label: 'tanggalMulai' },
      { names: ['tanggalSelesai', 'tanggal_selesai'], label: 'tanggalSelesai' }
    ]);

    if (!ok) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_REQUIRED_FIELDS',
        message: `Data jadwal tahapan belum lengkap. Field wajib yang belum diisi: ${missing.join(', ')}.`,
        missing
      });
    }

    const id = pickField(req.body, 'id');
    const jenjang = values.jenjang;
    const tahapKode = values.tahapKode;
    const tahapNama = values.tahapNama;
    const tanggalMulai = values.tanggalMulai;
    const tanggalSelesai = values.tanggalSelesai;
    const prodi = pickField(req.body, 'prodi') || 'Program Studi Manajemen';
    const semester = pickField(req.body, 'semester') || 'Ganjil 2026/2027';
    const jamDeadline = pickField(req.body, 'jamDeadline', 'jam_deadline') || '23:59';
    const status = pickField(req.body, 'status') || 'Akan Datang';
    const moda = pickField(req.body, 'moda') || 'Daring via SIM-TA';
    const targetMahasiswa = toNumber(pickField(req.body, 'targetMahasiswa', 'target_mahasiswa'), 0);
    const terdaftarMahasiswa = toNumber(pickField(req.body, 'terdaftarMahasiswa', 'terdaftar_mahasiswa'), 0);
    const persyaratanRingkas = toText(pickField(req.body, 'persyaratanRingkas', 'persyaratan_ringkas'), '');
    const catatanSOP = toText(pickField(req.body, 'catatanSOP', 'catatan_sop'), '');
    const penanggungJawab = toText(
      pickField(req.body, 'penanggungJawab', 'penanggung_jawab'),
      'Subbag Akademik & Pascasarjana'
    );

    const newId = id || `jadwal-${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO jadwal_tahapan (
        id, jenjang, prodi, tahap_kode, tahap_nama, semester,
        tanggal_mulai, tanggal_selesai, jam_deadline, status,
        moda, target_mahasiswa, terdaftar_mahasiswa, persyaratan_ringkas,
        catatan_sop, penanggung_jawab
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newId,
      jenjang,
      prodi,
      tahapKode,
      tahapNama,
      semester,
      tanggalMulai,
      tanggalSelesai,
      jamDeadline,
      status,
      moda,
      targetMahasiswa,
      terdaftarMahasiswa,
      persyaratanRingkas,
      catatanSOP,
      penanggungJawab
    );

    // Kirim notifikasi sistem broadcast
    try {
      const notifStmt = db.prepare(`
        INSERT INTO notifications (id, user_id, role, title, message, type, event_category)
        VALUES (?, NULL, 'semua', ?, ?, 'info', 'jadwal')
      `);
      notifStmt.run(
        `notif-jadwal-${Date.now()}`,
        `Jadwal Baru Diterbitkan: ${tahapNama} (${jenjang})`,
        `Admin Akademik telah merilis jadwal tahapan ${tahapNama} periode ${tanggalMulai} s/d ${tanggalSelesai}. Silakan persiapkan berkas Anda.`
      );
    } catch {
      // ignore notification error
    }

    res.json({
      success: true,
      message: 'Jadwal tahapan berhasil dibuat dan disimpan di basis data.',
      id: newId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/jadwal-tahapan/:id', requireRole(['admin', 'superadmin']), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM jadwal_tahapan WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Jadwal tahapan tidak ditemukan.' });
    }

    // Audit 21 Oktober 2026 (Simulasi Proses A–Z): nilai `undefined` tidak
    // dapat diikat ke parameter SQLite, sehingga permintaan pembaruan dengan
    // sebagian field kosong berakhir HTTP 500. Semua nilai dinormalisasi lebih
    // dulu: undefined -> null (artinya "biarkan nilai lama" karena memakai
    // COALESCE), dan angka yang tidak valid -> null.
    const body = req.body || {};
    const upd = {
      jenjang: pickField(body, 'jenjang') ?? null,
      prodi: pickField(body, 'prodi') ?? null,
      tahapKode: pickField(body, 'tahapKode', 'tahap_kode') ?? null,
      tahapNama: pickField(body, 'tahapNama', 'tahap_nama') ?? null,
      semester: pickField(body, 'semester') ?? null,
      tanggalMulai: pickField(body, 'tanggalMulai', 'tanggal_mulai') ?? null,
      tanggalSelesai: pickField(body, 'tanggalSelesai', 'tanggal_selesai') ?? null,
      jamDeadline: pickField(body, 'jamDeadline', 'jam_deadline') ?? null,
      status: pickField(body, 'status') ?? null,
      moda: pickField(body, 'moda') ?? null,
      targetMahasiswa: pickField(body, 'targetMahasiswa', 'target_mahasiswa') ?? null,
      terdaftarMahasiswa: pickField(body, 'terdaftarMahasiswa', 'terdaftar_mahasiswa') ?? null,
      persyaratanRingkas: pickField(body, 'persyaratanRingkas', 'persyaratan_ringkas') ?? null,
      catatanSOP: pickField(body, 'catatanSOP', 'catatan_sop') ?? null,
      penanggungJawab: pickField(body, 'penanggungJawab', 'penanggung_jawab') ?? null
    };
    for (const key of ['targetMahasiswa', 'terdaftarMahasiswa']) {
      if (upd[key] !== null) upd[key] = Number.isFinite(Number(upd[key])) ? Number(upd[key]) : null;
    }

    const stmt = db.prepare(`
      UPDATE jadwal_tahapan SET
        jenjang = COALESCE(?, jenjang),
        prodi = COALESCE(?, prodi),
        tahap_kode = COALESCE(?, tahap_kode),
        tahap_nama = COALESCE(?, tahap_nama),
        semester = COALESCE(?, semester),
        tanggal_mulai = COALESCE(?, tanggal_mulai),
        tanggal_selesai = COALESCE(?, tanggal_selesai),
        jam_deadline = COALESCE(?, jam_deadline),
        status = COALESCE(?, status),
        moda = COALESCE(?, moda),
        target_mahasiswa = COALESCE(?, target_mahasiswa),
        terdaftar_mahasiswa = COALESCE(?, terdaftar_mahasiswa),
        persyaratan_ringkas = COALESCE(?, persyaratan_ringkas),
        catatan_sop = COALESCE(?, catatan_sop),
        penanggung_jawab = COALESCE(?, penanggung_jawab),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      upd.jenjang, upd.prodi, upd.tahapKode, upd.tahapNama, upd.semester,
      upd.tanggalMulai, upd.tanggalSelesai, upd.jamDeadline, upd.status,
      upd.moda, upd.targetMahasiswa, upd.terdaftarMahasiswa, upd.persyaratanRingkas,
      upd.catatanSOP, upd.penanggungJawab, id
    );

    res.json({ success: true, message: 'Jadwal tahapan berhasil diperbarui.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/jadwal-tahapan/:id', requireRole(['admin', 'superadmin']), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM jadwal_tahapan WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Jadwal tahapan tidak ditemukan.' });
    }
    db.prepare('DELETE FROM jadwal_tahapan WHERE id = ?').run(id);
    res.json({ success: true, message: 'Jadwal tahapan berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
