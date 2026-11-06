import express from 'express';
import db from '../database/db.js';
import { requireRole } from '../middleware/authGuard.js';
import { isExamPanelist, resolveNipByName } from '../academic/supervisorIdentity.js';
import { resolveRubrikContext } from '../academic/examRules.js';
import { pickField, toText } from '../utils/payload.js';

const router = express.Router();

// 1. Daftar Ujian Penguji
// Hanya penguji, dosen, koorprodi, admin, superadmin yang berhak melihat daftar
// & rubrik ujian lengkap.
// Audit 21 Oktober 2026 (Simulasi A-Z): 'koorprodi' ditambahkan karena
// Koordinator Program Studi adalah pihak yang menetapkan dewan penguji namun
// sebelumnya tidak dapat membaca rekap ujian yang ia buat sendiri.
router.get('/ujian', requireRole(['penguji', 'dosen', 'koorprodi', 'admin', 'superadmin'], {
  customMessage: 'Mahasiswa tidak diizinkan mengakses direktori penilaian dewan penguji.'
}), (req, res) => {
  try {
    const allRows = db.prepare('SELECT * FROM ujian_penguji ORDER BY tanggal_ujian ASC').all();
    const role = String(req.user?.role || '').toLowerCase();

    // Isolasi data: penguji/dosen hanya melihat ujian yang ditugaskan kepadanya.
    // Admin & Superadmin tetap melihat seluruh direktori.
    const scoped = ['penguji', 'dosen'].includes(role)
      ? allRows.filter((r) => isExamPanelist(req.user, r))
      : allRows;

    const rows = scoped;
    const formatted = rows.map((r) => {
      // Susunan dewan penguji disimpan sebagai JSON; diurai dengan aman.
      let susunanPenguji = [];
      try {
        const parsed = JSON.parse(r.susunan_penguji_json || '[]');
        if (Array.isArray(parsed)) susunanPenguji = parsed;
      } catch (_) {}

      // NIP penguji utama = entri yang perannya cocok dengan peran_dosen, atau
      // anggota pertama yang bukan pembimbing (agar isolasi data tetap benar).
      const peranLower = String(r.peran_dosen || '').toLowerCase();
      const primary =
        susunanPenguji.find((p) => p.peran && p.peran.toLowerCase() === peranLower) ||
        susunanPenguji.find((p) => p.peran && !/pembimbing|promotor/i.test(p.peran)) ||
        susunanPenguji[0] ||
        null;

      return {
        ...r,
        namaMahasiswa: r.nama_mahasiswa,
        programStudi: r.program_studi,
        jenisUjian: r.jenis_ujian,
        tanggalUjian: r.tanggal_ujian,
        jamUjian: r.jam_ujian,
        jadwal: r.tanggal_ujian,
        waktu: r.jam_ujian,
        statusUjian: r.status_ujian,
        peranDosen: r.peran_dosen,
        peranPenguji: r.peran_dosen,
        susunanPenguji,
        pengujiNip: primary?.nip || null,
        namaPenguji: primary?.nama || null,
        pengujiNips: susunanPenguji.map((p) => p.nip).filter(Boolean),
        judul: r.judul || '',
        naskahUrl: r.naskah_url,
        fileNaskah: r.naskah_url || '',
        ukuranNaskah: '2.1 MB',
        turnitinSim: 19,
        turnitinAI: 24,
        // Audit 21 Oktober 2026 (P0-1): pemilihan rubrik memakai modul aturan
        // bersama. Semula hanya ada tiga nilai ('D3_S1', 'S2', 'S3_KELAYAKAN')
        // sehingga D3 dan empat dari lima jenis ujian S3 dinilai dengan
        // rubrik yang kelayakan.
        ...(() => {
          const rubrik = resolveRubrikContext(r.jenjang, r.jenis_ujian);
          return {
            rubrikContext: rubrik.rubrikContext,
            rubrikContextFallback: rubrik.fallback,
            rubrikContextSumber: rubrik.sumber
          };
        })(),
        penilaianSubmitted: Boolean(r.penilaian_submitted),
        nilaiFinal: r.nilai_final,
        rekomendasiKelayakan: r.rekomendasi_kelayakan,
        catatanEvaluasi: r.catatan_evaluasi,
        catatanTersimpan: r.catatan_tersimpan
      };
    });

// ============================================================================
// 1b. PENJADWALAN UJIAN & PENETAPAN DEWAN PENGUJI (Koordinator Program Studi)
//
// Audit 21 Oktober 2026 (Simulasi Proses A-Z — temuan AZ-A1):
// Tabel `ujian_penguji` HANYA dapat diisi oleh seed.js atau langsung ke SQLite;
// tidak ada endpoint API untuk membuat jadwal ujian maupun menetapkan dewan
// penguji. Akibatnya:
//   - alur bisnis "Penjadwalan Sidang & Penetapan Dewan Penguji" tidak memiliki
//     jalur sistem sama sekali;
//   - `isExamPanelist()` (dasar validasi penugasan penguji) tidak pernah dapat
//     menjadi benar untuk dekwan yang baru ditetapkan, sehingga alur penilaian
//     tidak dapat dijalankan dari antarmuka.
//
// Endpoint di bawah menutup jalur tersebut.
// ============================================================================

/**
 * Menyusun susunan dewan penguji yang valid.
 * Setiap anggota WAJIB terikat pada NIP pengguna yang benar-benar ada di
 * basis data, karena pencocokan penugasan (isExamPanelist) dilakukan
 * berdasarkan NIP. Bila klien mengirim NIP yang tidak dikenal (mis. NIP
 * simulasi antarmuka), sistem mencoba resolusinya dari NAMA.
 *
 * @returns {{ok: true, anggota: Array}|{ok: false, status: number, message: string, invalid?: Array}}
 */
function susunDewanPenguji(susunanInput) {
  const susunan = Array.isArray(susunanInput) ? susunanInput : [];

  const anggota = [];
  const invalid = [];

  for (const item of susunan) {
    if (!item) continue;
    const nama = toText(pickField(item, 'nama'));
    const nipDiminta = toText(pickField(item, 'nip'));
    if (!nama && !nipDiminta) continue;

    let nip = nipDiminta;
    let pengguna = nip ? db.prepare('SELECT id, nama, role FROM users WHERE nomor_induk = ?').get(nip) : null;

    // NIP tidak dikenal -> coba resolusi berdasarkan nama (data master dosen).
    if (!pengguna) {
      const terselesaikan = resolveNipByName(nama);
      if (terselesaikan) {
        nip = terselesaikan;
        pengguna = db.prepare('SELECT id, nama, role FROM users WHERE nomor_induk = ?').get(nip);
      }
    }

    if (!pengguna) {
      invalid.push({ nama: nama || '(tanpa nama)', nip: nipDiminta || '-' });
      continue;
    }

    anggota.push({
      peran: toText(pickField(item, 'peran'), 'Anggota Penguji'),
      nama: pengguna.nama || nama,
      nip,
      homebase: toText(pickField(item, 'homebase'), 'FEB UTM'),
      id: pengguna.id
    });
  }

  if (invalid.length) {
    return {
      ok: false,
      status: 400,
      message:
        'NIP/Nama dekwan penguji tidak dapat dikenali sebagai pengguna aktif. ' +
        `Anggota bermasalah: ${invalid.map((x) => `${x.nama} (${x.nip})`).join('; ')}.`,
      invalid
    };
  }

  if (anggota.length === 0) {
    return {
      ok: false,
      status: 400,
      message: 'Susunan dewan penguji wajib memuat minimal satu anggota yang valid.'
    };
  }

  // Cegah NIP ganda.
  const nipTerpakai = new Set();
  for (const a of anggota) {
    if (nipTerpakai.has(a.nip)) {
      return {
        ok: false,
        status: 400,
        message: `NIP ${a.nip} (${a.nama}) tercatat lebih dari sekali pada susunan dekwan penguji.`
      };
    }
    nipTerpakai.add(a.nip);
  }

  return { ok: true, anggota };
}

/**
 * Menentukan peran "ketua" dekwan agar pencocokan primary (ketua) deterministik.
 */
function peranKetua(anggota) {
  const ketua = anggota.find((a) => /ketua|pembimbing\s*(utama|i)\b/i.test(a.peran));
  return ketua ? ketua.peran : anggota[0].peran;
}

// POST /api/penguji/ujian — membuat jadwal ujian + menetapkan dewan penguji
router.post('/ujian', requireRole(['koorprodi', 'admin', 'superadmin'], {
  customMessage: 'Hanya Koordinator Program Studi, Admin Akademik, dan Super Admin yang dapat menjadwalkan ujian dan menetapkan dewan penguji.'
}), (req, res) => {
  try {
    const body = req.body || {};

    const nim = toText(pickField(body, 'nim'));
    const namaMahasiswa = toText(pickField(body, 'namaMahasiswa', 'nama_mahasiswa'));
    const jenjang = toText(pickField(body, 'jenjang'), 'S1');
    const programStudi = toText(pickField(body, 'programStudi', 'program_studi'), 'S-1 Manajemen');
    const jenisUjian = toText(pickField(body, 'jenisUjian', 'jenis_ujian'), 'Seminar Proposal Skripsi');
    const judul = toText(pickField(body, 'judul'), '');
    const tanggalUjian = toText(pickField(body, 'tanggalUjian', 'tanggal_ujian'));
    const jamUjian = toText(pickField(body, 'jamUjian', 'jam_ujian'));
    const ruang = toText(pickField(body, 'ruang'), 'Ruang Sidang FEB UTM');
    const modus = toText(pickField(body, 'modus', 'mode'), 'Tatap Muka (Luring)');

    const wajib = [];
    if (!nim) wajib.push('nim');
    if (!namaMahasiswa) wajib.push('namaMahasiswa');
    if (!tanggalUjian) wajib.push('tanggalUjian');
    if (!jamUjian) wajib.push('jamUjian');
    if (!ruang) wajib.push('ruang');
    if (wajib.length) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_REQUIRED_FIELDS',
        message: `Data penjadwalan ujian belum lengkap. Field wajib yang belum diisi: ${wajib.join(', ')}.`,
        missing: wajib
      });
    }

    // Mahasiswa harus terdaftar sebagai pengguna (FK ujian_penguji.nim).
    const mhs = db.prepare('SELECT nomor_induk, nama, jenjang, prodi FROM users WHERE nomor_induk = ?').get(nim);
    if (!mhs) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        message: `Mahasiswa dengan NIM ${nim} tidak terdaftar dalam basis data.`
      });
    }

    const susunan = susunDewanPenguji(pickField(body, 'susunanPenguji', 'susunan_penguji', 'dewanPenguji'));
    if (!susunan.ok) {
      return res.status(susunan.status).json({
        success: false,
        code: susunan.invalid ? 'INVALID_EXAMINER' : 'EMPTY_PANEL',
        message: susunan.message,
        invalid: susunan.invalid
      });
    }

    // Cegah penjadwalan ganda untuk mahasiswa + jenis ujian + tanggal yang sama.
    const bentrok = db
      .prepare('SELECT id FROM ujian_penguji WHERE nim = ? AND jenis_ujian = ? AND tanggal_ujian = ?')
      .get(nim, jenisUjian, tanggalUjian);
    if (bentrok) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_SCHEDULE',
        message: `Mahasiswa ${nim} sudah memiliki jadwal ${jenisUjian} pada tanggal ${tanggalUjian}.`
      });
    }

    const id = toText(pickField(body, 'id'), `uj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

    db.prepare(`
      INSERT INTO ujian_penguji (
        id, nim, nama_mahasiswa, jenjang, program_studi, jenis_ujian, judul,
        tanggal_ujian, jam_ujian, ruang, status_ujian, peran_dosen,
        susunan_penguji_json, penilaian_submitted, catatan_tersimpan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
    `).run(
      id,
      nim,
      namaMahasiswa || mhs.nama,
      jenjang,
      programStudi,
      jenisUjian,
      judul,
      tanggalUjian,
      jamUjian,
      ruang,
      'Terjadwal',
      peranKetua(susunan.anggota),
      JSON.stringify(susunan.anggota)
    );

    // Notifikasi sistem untuk koordinator & penguji yang ditugaskan.
    try {
      const stmts = db.prepare(`
        INSERT INTO notifications (id, user_id, role, title, message, type, event_category)
        VALUES (?, NULL, ?, ?, ?, 'info', 'ujian')
      `);
      stmts.run(
        `notif-ujian-${Date.now()}-koorprodi`,
        'koorprodi',
        `Penjadwalan Ujian: ${jenisUjian}`,
        `Penjadwalan ${jenisUjian} untuk ${namaMahasiswa} (${nim}) telah ditetapkan pada ${tanggalUjian} ${jamUjian} di ${ruang}.`
      );
      for (const a of susunan.anggota) {
        stmts.run(
          `notif-ujian-${Date.now()}-${a.nip}`,
          a.nip,
          'Anda Ditugaskan sebagai Dewan Penguji',
          `Anda ditugaskan sebagai ${a.peran} pada ${jenisUjian} mahasiswa ${namaMahasiswa} (${nim}), ${tanggalUjian} ${jamUjian}, ruang ${ruang}.`
        );
      }
    } catch (_) {
      // ignore
    }

    // Audit 21 Oktober 2026: penetapan dewan penguji wajib dapat dilacak.
    try {
      db.prepare('INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)').run(
        req.user?.id || 'system',
        'CREATE_UJIAN',
        `Penjadwalan ${jenisUjian} untuk ${namaMahasiswa} (${nim}) pada ${tanggalUjian} ${jamUjian} ditetapkan oleh ${req.user?.id || 'system'} dengan dekwan: ${susunan.anggota.map((a) => a.nama).join(', ')}`
      );
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: `Penjadwalan ${jenisUjian} untuk ${namaMahasiswa} berhasil disimpan beserta susunan dewan penguji.`,
      data: {
        id,
        nim,
        namaMahasiswa: namaMahasiswa || mhs.nama,
        jenjang,
        programStudi,
        jenisUjian,
        judul,
        tanggalUjian,
        jamUjian,
        ruang,
        modus,
        statusUjian: 'Terjadwal',
        peranDosen: peranKetua(susunan.anggota),
        susunanPenguji: susunan.anggota
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/penguji/ujian/:id/panel — menetapkan ulang dekwan penguji
router.put('/ujian/:id/panel', requireRole(['koorprodi', 'admin', 'superadmin'], {
  customMessage: 'Hanya Koordinator Program Studi, Admin Akademik, dan Super Admin yang dapat menetapkan ulang dewan penguji.'
}), (req, res) => {
  try {
    const { id } = req.params;
    const exam = db.prepare('SELECT * FROM ujian_penguji WHERE id = ?').get(id);
    if (!exam) {
      return res.status(404).json({ success: false, code: 'EXAM_NOT_FOUND', message: 'Rekam ujian tidak ditemukan di basis data.' });
    }

    const susunan = susunDewanPenguji(pickField(req.body || {}, 'susunanPenguji', 'susunan_penguji', 'dewanPenguji'));
    if (!susunan.ok) {
      return res.status(susunan.status).json({
        success: false,
        code: susunan.invalid ? 'INVALID_EXAMINER' : 'EMPTY_PANEL',
        message: susunan.message,
        invalid: susunan.invalid
      });
    }

    db.prepare('UPDATE ujian_penguji SET susunan_penguji_json = ?, peran_dosen = ? WHERE id = ?')
      .run(JSON.stringify(susunan.anggota), peranKetua(susunan.anggota), id);

    res.json({
      success: true,
      message: 'Susunan dewan penguji berhasil diperbarui.',
      data: { id, peranDosen: peranKetua(susunan.anggota), susunanPenguji: susunan.anggota }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/penguji/ujian/:id — membatalkan penjadwalan ujian
router.delete('/ujian/:id', requireRole(['koorprodi', 'admin', 'superadmin'], {
  customMessage: 'Hanya Koordinator Program Studi, Admin Akademik, dan Super Admin yang dapat membatalkan penjadwalan ujian.'
}), (req, res) => {
  try {
    const { id } = req.params;
    const exam = db
      .prepare('SELECT id, penilaian_submitted, nilai_final FROM ujian_penguji WHERE id = ?')
      .get(id);
    if (!exam) {
      return res.status(404).json({ success: false, code: 'EXAM_NOT_FOUND', message: 'Rekam ujian tidak ditemukan di basis data.' });
    }

    // Ujian yang sudah dinilai tidak boleh dihapus (menjaga integritas nilai).
    // Perbandingan memakai `!= null` (longgar) agar mencakup `undefined`
    // sekaligus `null` — memakai `!== null` membuat kolom yang tidak
    // ter-select dianggap "sudah dinilai" dan memblokir penghapusan.
    if (Number(exam.penilaian_submitted || 0) === 1 || exam.nilai_final != null) {
      return res.status(409).json({
        success: false,
        code: 'EXAM_ALREADY_GRADED',
        message: 'Penjadwalan ujian yang sudah dinilai tidak dapat dibatalkan. Gunakan koreksi/revisi untuk memperbaiki hasil.'
      });
    }

    db.prepare('DELETE FROM ujian_penguji WHERE id = ?').run(id);

    try {
      db.prepare('INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)').run(
        req.user?.id || 'system',
        'DELETE_UJIAN',
        `Penjadwalan ujian ${id} (${exam.nim}) dibatalkan oleh ${req.user?.id || 'system'}`
      );
    } catch (_) {}

    res.json({ success: true, message: 'Penjadwalan ujian berhasil dibatalkan.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Penilaian Penguji: Wajib peran 'penguji', 'admin', atau 'superadmin'
// Ditolak keras jika mahasiswa mencoba memanipulasi nilai
router.put('/ujian/:id/penilaian', requireRole(['penguji', 'admin', 'superadmin'], {
  customMessage: 'Mahasiswa dilarang keras mengakses atau menginput nilai sidang pada form dewan penguji.'
}), (req, res) => {
  try {
    const { id } = req.params;
    const { nilaiFinal, grade, rekomendasiKelayakan, catatanEvaluasi } = req.body;

    // Validasi keberadaan rekam ujian: mencegah penulisan nilai ke ID ujian yang tidak ada.
    const exam = db.prepare('SELECT * FROM ujian_penguji WHERE id = ?').get(id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Rekam ujian tidak ditemukan di basis data.' });
    }

    // Audit 21 Oktober 2026: penguji HANYA boleh menilai ujian yang ditugaskan
    // kepadanya. Sebelumnya endpoint ini hanya memeriksa peran, sehingga setiap
    // akun ber-peran "penguji" dapat menetapkan nilai akhir ujian mana pun.
    const role = String(req.user?.role || '').toLowerCase();
    if (role === 'penguji' && !isExamPanelist(req.user, exam)) {
      try {
        db.prepare(`
          INSERT INTO audit_log (user_id, action, details)
          VALUES (?, 'SECURITY_VIOLATION_UNASSIGNED_EXAMINER', ?)
        `).run(
          req.user?.id || req.user?.nomorInduk || 'unknown',
          `[BLOCKED] Penguji (${req.user?.nama || '-'} / NIP ${req.user?.nomorInduk || '-'}) mencoba menilai ujian ${id} yang tidak ditugaskan kepadanya`
        );
      } catch (_) {}

      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_NOT_ASSIGNED_EXAMINER',
        error: 'Akses Ditolak [403 Forbidden]: Anda tidak tercatat sebagai anggota dewan penguji pada ujian ini. Penilaian hanya dapat dilakukan oleh penguji yang ditugaskan.'
      });
    }

    // Validasi rentang nilai agar tidak terjadi injeksi nilai di luar skala akademik.
    const numericNilai = Number(nilaiFinal);
    if (!Number.isFinite(numericNilai) || numericNilai < 0 || numericNilai > 100) {
      return res.status(400).json({ success: false, message: 'Nilai final wajib berupa angka pada rentang 0 - 100.' });
    }

    // Audit 21 Oktober 2026 (P1-3): skorKelulusanMin pada rules_json
    // (56 S1/D3, 70 S2/S3) TIDAK PERNAH dibaca kode mana pun. Kini menjadi
    // gerbang: rekomendasi "Layak" tidak boleh diberikan bila nilai di bawah
    // ambang kelulusan jenjang.
    const rulesRow = db.prepare('SELECT rules_json FROM tahapan_aturan WHERE jenjang = ?').get(exam.jenjang);
    let rules = {};
    try {
      rules = rulesRow?.rules_json ? JSON.parse(rulesRow.rules_json) : {};
    } catch (_) {
      rules = {};
    }
    const skorKelulusanMin = Number(rules.skorKelulusanMin || 0);
    const rekomendasi = String(rekomendasiKelayakan || '').trim();
    const menyatakanLayak = /layak/i.test(rekomendasi) && !/tidak layak/i.test(rekomendasi);

    if (skorKelulusanMin > 0 && menyatakanLayak && numericNilai < skorKelulusanMin) {
      return res.status(409).json({
        success: false,
        code: 'BELUM_MENCAPAI_SKOR_KELULUSAN',
        message:
          `Rekomendasi kelayakan tidak dapat disimpan: nilai ${numericNilai} di bawah skor kelulusan minimal ${skorKelulusanMin} untuk jenjang ${exam.jenjang}.`,
        nilaiFinal: numericNilai,
        skorKelulusanMin
      });
    }

    const stmt = db.prepare(`
      UPDATE ujian_penguji
      SET penilaian_submitted = 1,
          nilai_final = ?,
          grade = ?,
          rekomendasi_kelayakan = ?,
          catatan_evaluasi = ?,
          status_ujian = 'Selesai Dinilai'
      WHERE id = ?
    `);
    stmt.run(numericNilai, grade, rekomendasiKelayakan || null, catatanEvaluasi || null, id);

    // Audit log identitas penguji yang menilai (dari token terverifikasi)
    try {
      db.prepare(`
        INSERT INTO audit_log (user_id, action, details)
        VALUES (?, 'PENILAIAN_UJIAN', ?)
      `).run(
        req.user?.id || req.user?.nomorInduk || 'unknown',
        `Penguji (${req.user?.nama || req.user?.nomorInduk || 'unknown'}) menyimpan nilai ujian ${id}: ${numericNilai} (${grade || '-'})`
      );
    } catch (_) {}

    res.json({ success: true, message: 'Nilai ujian berhasil disimpan secara resmi ke database.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Catatan Koreksi & Revisi
router.get('/koreksi', requireRole(['penguji', 'dosen', 'admin', 'superadmin', 'mahasiswa']), (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    let rows;
    // Mahasiswa HANYA boleh melihat catatan koreksi atas naskahnya sendiri (cegah kebocoran data).
    if (userRole === 'mahasiswa') {
      const userNim = req.user?.nomorInduk || '';
      rows = db.prepare('SELECT * FROM koreksi_penguji WHERE mhs_nim = ? ORDER BY created_at DESC').all(userNim);
    } else if (['penguji', 'dosen'].includes(userRole)) {
      // Isolasi data: hanya catatan koreksi atas ujian yang ditugaskan kepada pemanggil.
      const myExamIds = new Set(
        db.prepare('SELECT * FROM ujian_penguji').all()
          .filter((r) => isExamPanelist(req.user, r))
          .map((r) => r.id)
      );
      rows = db.prepare('SELECT * FROM koreksi_penguji ORDER BY created_at DESC').all()
        .filter((r) => myExamIds.has(r.ujian_id));
    } else {
      rows = db.prepare('SELECT * FROM koreksi_penguji ORDER BY created_at DESC').all();
    }
    const formatted = rows.map((r) => ({
      ...r,
      ujianId: r.ujian_id,
      mhsNim: r.mhs_nim,
      mhsNama: r.mhs_nama,
      // Alias yang dipakai antarmuka (CatatanKoreksiPage / DashboardPage penguji).
      nim: r.mhs_nim,
      namaMahasiswa: r.mhs_nama,
      pengujiId: r.penguji_id,
      namaPenguji: r.nama_penguji,
      bagianNaskah: r.bagian_naskah,
      bab: r.bagian_naskah,
      catatanKoreksi: r.catatan_koreksi,
      tingkatUrgensi: r.tingkat_urgensi,
      statusVerifikasi: r.status_verifikasi,
      createdAt: r.created_at
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/koreksi', requireRole(['penguji', 'admin', 'superadmin'], {
  customMessage: 'Hanya dewan penguji atau admin yang berhak mencatat revisi penguji.'
}), (req, res) => {
  try {
    const body = req.body || {};
    // Terima nama field dari antarmuka (nim/namaMahasiswa/bab) maupun nama kanonik.
    const id = body.id;
    const ujianId = body.ujianId || body.ujian_id;
    const mhsNim = body.mhsNim || body.nim || body.mhs_nim;
    const mhsNama = body.mhsNama || body.namaMahasiswa || body.mhs_nama || '';
    const jenjang = body.jenjang;
    const pengujiId = body.pengujiId || body.penguji_id;
    const namaPenguji = body.namaPenguji || body.nama_penguji;
    const bagianNaskah = body.bagianNaskah || body.bab || body.bagian_naskah;
    const halaman = body.halaman;
    const catatanKoreksi = body.catatanKoreksi || body.catatan_koreksi;
    const tingkatUrgensi = body.tingkatUrgensi || body.tingkat_urgensi;

    // Validasi input wajib: mencegah 500 dari binding parameter NULL dan
    // memastikan pesan galat yang jelas bagi penguji.
    if (!ujianId || !String(ujianId).trim()) {
      return res.status(400).json({ success: false, message: 'Sidang/ujian wajib dipilih sebelum menyimpan catatan koreksi.' });
    }
    if (!mhsNim || !String(mhsNim).trim()) {
      return res.status(400).json({ success: false, message: 'NIM mahasiswa wajib diisi.' });
    }
    if (!catatanKoreksi || !String(catatanKoreksi).trim()) {
      return res.status(400).json({ success: false, message: 'Uraian catatan koreksi wajib diisi.' });
    }

    // Validasi relasional: ujian harus terdaftar (mencegah FOREIGN KEY constraint failed).
    const exam = db.prepare('SELECT * FROM ujian_penguji WHERE id = ?').get(ujianId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Rekam sidang/ujian tidak ditemukan di basis data.' });
    }

    // Isolasi data: penguji hanya boleh mencatat koreksi atas ujian yang ditugaskan kepadanya.
    const role = String(req.user?.role || '').toLowerCase();
    if (role === 'penguji' && !isExamPanelist(req.user, exam)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_NOT_ASSIGNED_EXAMINER',
        error: 'Akses Ditolak [403 Forbidden]: Anda tidak ditugaskan sebagai penguji pada ujian ini.'
      });
    }

    // Audit 21 Oktober 2026: id rekam dibangkitkan SEKALI agar id yang
    // dikembalikan ke pemanggil sama persis dengan id yang tersimpan.
    const koreksiId = id || `kor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const stmt = db.prepare(`
      INSERT INTO koreksi_penguji (id, ujian_id, mhs_nim, mhs_nama, jenjang, penguji_id, nama_penguji, bagian_naskah, halaman, catatan_koreksi, tingkat_urgensi, status_verifikasi, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu Approval Penguji', ?)
    `);
    stmt.run(
      koreksiId,
      ujianId,
      String(mhsNim).trim(),
      mhsNama || '',
      jenjang || 'S1',
      // Audit 21 Oktober 2026 (Simulasi Proses A–Z): identitas penguji WAJIB
      // berasal dari sesi, bukan dari body permintaan. Jika body boleh
      // menentukan penguji_id, seorang penguji dapat mencatat koreksi atas
      // nama penguji lain sehingga atribusinya salah dan catatan tersebut
      // tidak muncul pada daftar miliknya sendiri.
      req.user?.id || '',
      req.user?.nama || '',
      bagianNaskah || 'Umum',
      halaman || '',
      String(catatanKoreksi).trim(),
      tingkatUrgensi || 'Sedang',
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    );

    // Update counter catatan di ujian_penguji
    // Audit 21 Oktober 2026 (Simulasi Proses A–Z): kolom utama tabel
    // ujian_penguji adalah `id`, BUKAN `ujian_id`. Pernyataan lama memakai
    // `WHERE ujian_id = ?` sehingga db.prepare() GAGAL dengan "no such column"
    // dan SELURUH permintaan pembuatan catatan koreksi berakhir HTTP 500.
    db.prepare('UPDATE ujian_penguji SET catatan_tersimpan = catatan_tersimpan + 1 WHERE id = ?').run(ujianId);

    // Audit 21 Oktober 2026: id rekam dikembalikan agar pemanggil dapat
    // melakukan pembaruan/penghapusan atas catatan yang baru dibuat.
    res.json({
      success: true,
      message: 'Catatan koreksi penguji berhasil dicatat ke database.',
      data: { id: koreksiId, ujianId, pengujiId: req.user?.id || '' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/koreksi/:id/status', requireRole(['penguji', 'admin', 'superadmin']), (req, res) => {
  try {
    const { id } = req.params;
    const { statusVerifikasi, feedback } = req.body;

    let catatanTambahan = '';
    if (feedback) {
      const existing = db.prepare('SELECT catatan_koreksi FROM koreksi_penguji WHERE id = ?').get(id);
      catatanTambahan = `${existing ? existing.catatan_koreksi : ''} [Catatan Lanjutan Penguji: ${feedback}]`;
    }

    const stmt = db.prepare(`
      UPDATE koreksi_penguji
      SET status_verifikasi = ?,
          catatan_koreksi = CASE WHEN ? != '' THEN ? ELSE catatan_koreksi END
      WHERE id = ?
    `);
    const result = stmt.run(statusVerifikasi, catatanTambahan, catatanTambahan, id);

    // Audit 21 Oktober 2026 (Simulasi Proses A–Z): pembaruan yang tidak
    // menyentuh baris mana pun (id tidak dikenal) TIDAK boleh dilaporkan
    // sebagai keberhasilan — itu adalah "sukses palsu" yang menutupi bug
    // pada sisi pemanggil.
    if (!result.changes) {
      return res.status(404).json({
        success: false,
        code: 'KOREKSI_NOT_FOUND',
        message: `Catatan koreksi dengan id "${id}" tidak ditemukan.`
      });
    }

    res.json({ success: true, message: 'Status verifikasi revisi berhasil diperbarui.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/koreksi/:id', requireRole(['penguji', 'admin', 'superadmin']), (req, res) => {
  try {
    const { id } = req.params;
    // Audit 21 Oktober 2026 (Simulasi Proses A–Z): penghapusan yang tidak
    // menyentuh baris mana pun tidak boleh dilaporkan sebagai berhasil.
    const result = db.prepare('DELETE FROM koreksi_penguji WHERE id = ?').run(id);
    if (!result.changes) {
      return res.status(404).json({
        success: false,
        code: 'KOREKSI_NOT_FOUND',
        message: `Catatan koreksi dengan id "${id}" tidak ditemukan.`
      });
    }
    res.json({ success: true, message: 'Catatan koreksi berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
