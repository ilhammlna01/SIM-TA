/**
 * Formal Document Generator & Verification Router - SIM Tugas Akhir FEB UTM
 * Endpoint untuk mencetak dokumen resmi PDF ber-QR code dan memverifikasi keabsahannya.
 * Dilengkapi validasi integritas relasional basis data: mencegah pemalsuan dokumen fiktif.
 */

import express from 'express';
import {
  generateBeritaAcara,
  generateLembarPengesahan,
  generateLembarBimbingan,
  generateSuratTugasPenguji,
  generateSuratTugasPembimbing,
  generateSuratKeputusanDekan,
  generateExamPackage
} from '../documents/pdfGenerator.js';
import { db, getAllDocumentCounters, updateDocumentCounter } from '../database/db.js';
import { requireRole } from '../middleware/authGuard.js';
import {
  buildVerifiedPayload,
  resolveExamPanel,
  resolveBimbinganLog
} from '../documents/documentPayload.js';

const router = express.Router();

/**
 * Guard bersama: NIM pada request body WAJIB milik pemanggil yang sedang login
 * bila pemanggil berperan mahasiswa. Preventif terhadap penerbitan dokumen
 * atas nama mahasiswa lain oleh akun ber-peran terendah.
 */
function resolveTargetNim(req, payload) {
  const requestedNim = String(payload.nim || payload.mahasiswaNIM || '').trim();
  const role = String(req.user?.role || '').toLowerCase();
  const callerNim = String(req.user?.nomorInduk || '').trim();

  if (role === 'mahasiswa') {
    if (!requestedNim) return callerNim;
    if (requestedNim !== callerNim) return null;
    return callerNim;
  }

  return requestedNim || callerNim;
}

/**
 * POST /api/documents/generate-berita-acara
 * Menghasilkan Berita Acara Ujian digital setelah penguji submit nilai
 * Validasi Relasional: Nilai dan status kelulusan wajib sesuai dengan rekam database ujian_penguji
 */
router.post('/generate-berita-acara', requireRole(['penguji', 'admin', 'superadmin'], {
  customMessage: 'Hanya dewan penguji atau admin akademik yang berwenang menerbitkan Berita Acara Ujian resmi.'
}), async (req, res) => {
  try {
    const payload = req.body || {};
    const nim = resolveTargetNim(req, payload);
    const ujianId = payload.ujianId || payload.id;

    // 1. Validasi Keberadaan Data Ujian / Mahasiswa di SQLite
    let examRecord = null;
    if (ujianId) {
      examRecord = db.prepare('SELECT * FROM ujian_penguji WHERE id = ?').get(ujianId);
    }
    if (!examRecord && nim) {
      examRecord = db.prepare('SELECT * FROM ujian_penguji WHERE nim = ? ORDER BY tanggal_ujian DESC LIMIT 1').get(nim);
    }

    let regRecord = null;
    if (nim) {
      regRecord = db.prepare('SELECT * FROM pendaftaran_ujian WHERE nim = ? ORDER BY tanggal_daftar DESC LIMIT 1').get(nim);
    }

    if (!examRecord && !regRecord) {
      return res.status(404).json({
        success: false,
        code: 'EXAM_RECORD_NOT_FOUND',
        error: 'Penerbitan Berita Acara Ditolak: Rekam data ujian atau mahasiswa tidak ditemukan dalam basis data akademik FEB UTM.'
      });
    }

    // 2. Integritas Nilai: Jika rekam ujian ada, pastikan nilai telah disubmit oleh penguji
    if (examRecord && !examRecord.penilaian_submitted && examRecord.status_ujian !== 'Selesai Dinilai') {
      return res.status(400).json({
        success: false,
        code: 'EXAM_NOT_FINALIZED',
        error: 'Penerbitan Berita Acara Ditolak: Nilai sidang belum disubmit atau belum difinalisasi oleh dewan penguji di sistem.'
      });
    }

    // 3. Rekonsiliasi Payload: Selalu ambil nilai dan status resmi dari database relasional
    const verifiedPayload = buildVerifiedPayload({
      nim: examRecord?.nim || regRecord?.nim || nim,
      payload,
      lockedFields: {
        nilaiFinal: examRecord?.nilai_final,
        grade: examRecord?.grade,
        rekomendasiKelayakan: examRecord?.rekomendasi_kelayakan,
        catatanEvaluasi: examRecord?.catatan_evaluasi
      },
      examOverrides: {
        tahap: examRecord?.jenis_ujian,
        ruang: examRecord?.ruang
      },
      panel: resolveExamPanel(nim, ujianId)
    });

    if (!verifiedPayload) {
      return res.status(404).json({
        success: false,
        code: 'EXAM_RECORD_NOT_FOUND',
        error: 'Penerbitan Berita Acara Ditolak: Data mahasiswa tidak ditemukan dalam basis data akademik FEB UTM.'
      });
    }

    const result = await generateBeritaAcara(verifiedPayload);

    res.status(201).json({
      success: true,
      message: 'Berita Acara Ujian digital berhasil dicetak dan diarsipkan dengan QR Code validasi.',
      data: result
    });
  } catch (err) {
    console.error('Error generating Berita Acara:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat dokumen Berita Acara: ' + err.message
    });
  }
});

/**
 * POST /api/documents/generate-pengesahan
 * Menghasilkan Lembar Pengesahan Tugas Akhir berstempel dinas FEB UTM
 */
router.post('/generate-pengesahan', requireRole(['dosen', 'admin', 'superadmin', 'koorprodi']), async (req, res) => {
  try {
    const payload = req.body || {};
    const nim = resolveTargetNim(req, payload);

    // Validasi keberadaan mahasiswa di database
    const student = nim
      ? db.prepare("SELECT * FROM users WHERE nomor_induk = ?").get(nim) ||
        db.prepare('SELECT * FROM pendaftaran_ujian WHERE nim = ?').get(nim)
      : null;
    if (!student) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        error: 'Penerbitan Lembar Pengesahan Ditolak: Mahasiswa dengan NIM tersebut tidak terdaftar di FEB UTM.'
      });
    }

    // Gate business process: Lembar Pengesahan hanya boleh terbit bila seluruh tahapan
    // Tugas Akhir telah selesai (mencegah penerbitan pengesahan sebelum waktunya).
    const ta = db.prepare('SELECT * FROM tugas_akhir WHERE nim = ? ORDER BY created_at DESC LIMIT 1').get(nim);
    if (ta) {
      const stages = db.prepare('SELECT status FROM tahap_status WHERE tugas_akhir_id = ?').all(ta.id);
      const allDone = stages.length > 0 && stages.every((s) => s.status === 'Selesai');
      if (!allDone) {
        return res.status(403).json({
          success: false,
          code: 'STAGE_NOT_COMPLETE',
          error: 'Penerbitan Lembar Pengesahan Ditolak: Seluruh tahapan Tugas Akhir belum dinyatakan selesai oleh pembimbing dan admin/prodi.'
        });
      }
    }

    // Rekonsiliasi: identitas, judul, dan pembimbing SELALU dari database.
    const verifiedPayload = buildVerifiedPayload({ nim, payload });
    if (!verifiedPayload) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        error: 'Penerbitan Lembar Pengesahan Ditolak: Data mahasiswa tidak ditemukan dalam basis data.'
      });
    }

    const result = await generateLembarPengesahan(verifiedPayload);

    res.status(201).json({
      success: true,
      message: 'Lembar Pengesahan Tugas Akhir berhasil dicetak dengan stempel digital resmi.',
      data: result
    });
  } catch (err) {
    console.error('Error generating Lembar Pengesahan:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat Lembar Pengesahan: ' + err.message
    });
  }
});

/**
 * POST /api/documents/generate-bimbingan
 * Menghasilkan Kartu Kendali / Lembar Riwayat Bimbingan digital
 */
router.post('/generate-bimbingan', requireRole(['mahasiswa', 'dosen', 'admin', 'superadmin']), async (req, res) => {
  try {
    const payload = req.body || {};
    // Mahasiswa hanya boleh mencetak kartu bimbingan atas nama DINYA SENDIRI.
    const nim = resolveTargetNim(req, payload);
    if (!nim) {
      return res.status(400).json({
        success: false,
        code: 'NIM_REQUIRED',
        error: 'Penerbitan Kartu Bimbingan Ditolak: NIM mahasiswa wajib diisi.'
      });
    }

    const student = db.prepare("SELECT * FROM users WHERE nomor_induk = ?").get(nim) || db.prepare('SELECT * FROM pendaftaran_ujian WHERE nim = ?').get(nim);
    if (!student) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        error: 'Penerbitan Kartu Bimbingan Ditolak: Mahasiswa tidak terdaftar dalam database.'
      });
    }

    // Rekonsiliasi: identitas & pembimbing dari database; riwayat bimbingan
    // diambil dari tabel bimbingan_log (bukan dari payload klien).
    const verifiedPayload = buildVerifiedPayload({ nim, payload });
    if (!verifiedPayload) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        error: 'Penerbitan Kartu Bimbingan Ditolak: Data mahasiswa tidak ditemukan dalam database.'
      });
    }
    const bimbinganLog = resolveBimbinganLog(nim);
    if (bimbinganLog.length > 0) {
      verifiedPayload.bimbinganList = bimbinganLog;
    }

    const result = await generateLembarBimbingan(verifiedPayload);

    res.status(201).json({
      success: true,
      message: 'Kartu Kendali Riwayat Bimbingan berhasil dicetak dengan QR Code autentikasi.',
      data: result
    });
  } catch (err) {
    console.error('Error generating Lembar Bimbingan:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat Lembar Bimbingan: ' + err.message
    });
  }
});

/**
 * POST /api/documents/generate-surat-tugas-penguji
 * Menghasilkan Surat Tugas Penguji resmi berstempel dan QR Code
 */
router.post('/generate-surat-tugas-penguji', requireRole(['admin', 'superadmin', 'koorprodi']), async (req, res) => {
  try {
    const payload = req.body || {};
    const nim = resolveTargetNim(req, payload);
    if (!nim) {
      return res.status(400).json({
        success: false,
        code: 'NIM_REQUIRED',
        error: 'Penerbitan Surat Tugas Penguji Ditolak: NIM mahasiswa wajib diisi.'
      });
    }

    const student = db.prepare("SELECT * FROM users WHERE nomor_induk = ?").get(nim) || db.prepare('SELECT * FROM pendaftaran_ujian WHERE nim = ?').get(nim);
    if (!student) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        error: 'Penerbitan Surat Tugas Penguji Ditolak: Mahasiswa tidak ditemukan dalam basis data.'
      });
    }

    // Identitas, judul, dan komposisi dekwan penguji SELALU dari database.
    const verifiedPayload = buildVerifiedPayload({
      nim,
      payload,
      panel: resolveExamPanel(nim, payload.ujianId || payload.id)
    });
    if (!verifiedPayload) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        error: 'Penerbitan Surat Tugas Penguji Ditolak: Data mahasiswa tidak ditemukan dalam basis data.'
      });
    }

    const result = await generateSuratTugasPenguji(verifiedPayload);

    res.status(201).json({
      success: true,
      message: 'Surat Tugas Penguji berhasil diterbitkan dan diarsipkan secara resmi.',
      data: result
    });
  } catch (err) {
    console.error('Error generating Surat Tugas Penguji:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat Surat Tugas Penguji: ' + err.message
    });
  }
});

/**
 * POST /api/documents/generate-surat-tugas-pembimbing
 * Menghasilkan Surat Tugas Pembimbing resmi berstempel dan QR Code
 */
router.post('/generate-surat-tugas-pembimbing', requireRole(['admin', 'superadmin', 'koorprodi']), async (req, res) => {
  try {
    const payload = req.body || {};
    const nim = resolveTargetNim(req, payload);
    if (!nim) {
      return res.status(400).json({
        success: false,
        code: 'NIM_REQUIRED',
        error: 'Penerbitan Surat Tugas Pembimbing Ditolak: NIM mahasiswa wajib diisi.'
      });
    }

    const student = db.prepare("SELECT * FROM users WHERE nomor_induk = ?").get(nim) || db.prepare('SELECT * FROM pendaftaran_ujian WHERE nim = ?').get(nim);
    if (!student) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        error: 'Penerbitan Surat Tugas Pembimbing Ditolak: Mahasiswa tidak ditemukan dalam basis data.'
      });
    }

    // Identitas, judul, dan pembimbing SELALU dari database.
    const verifiedPayload = buildVerifiedPayload({
      nim,
      payload,
      panel: resolveExamPanel(nim, payload.ujianId || payload.id)
    });
    if (!verifiedPayload) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        error: 'Penerbitan Surat Tugas Pembimbing Ditolak: Data mahasiswa tidak ditemukan dalam basis data.'
      });
    }

    const result = await generateSuratTugasPembimbing(verifiedPayload);

    res.status(201).json({
      success: true,
      message: 'Surat Tugas Pembimbing berhasil diterbitkan dan diarsipkan secara resmi.',
      data: result
    });
  } catch (err) {
    console.error('Error generating Surat Tugas Pembimbing:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat Surat Tugas Pembimbing: ' + err.message
    });
  }
});

/**
 * POST /api/documents/generate-sk-dekan
 * Menghasilkan SK Dekan tentang Penetapan Pembimbing & Penguji Ujian
 */
router.post('/generate-sk-dekan', requireRole(['admin', 'superadmin', 'koorprodi']), async (req, res) => {
  try {
    const payload = req.body || {};
    const nim = resolveTargetNim(req, payload);
    if (!nim) {
      return res.status(400).json({
        success: false,
        code: 'NIM_REQUIRED',
        error: 'Penerbitan SK Dekan Ditolak: NIM mahasiswa wajib diisi.'
      });
    }

    const student = db.prepare("SELECT * FROM users WHERE nomor_induk = ?").get(nim) || db.prepare('SELECT * FROM pendaftaran_ujian WHERE nim = ?').get(nim);
    if (!student) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        error: 'Penerbitan SK Dekan Ditolak: Mahasiswa tidak ditemukan dalam basis data fakultas.'
      });
    }

    // Identitas, judul, dan komposisi dekwan penguji SELALU dari database.
    const verifiedPayload = buildVerifiedPayload({
      nim,
      payload,
      panel: resolveExamPanel(nim, payload.ujianId || payload.id)
    });
    if (!verifiedPayload) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        error: 'Penerbitan SK Dekan Ditolak: Data mahasiswa tidak ditemukan dalam basis data fakultas.'
      });
    }

    const result = await generateSuratKeputusanDekan(verifiedPayload);

    res.status(201).json({
      success: true,
      message: 'Surat Keputusan (SK) Dekan berhasil diterbitkan dan diarsipkan secara resmi.',
      data: result
    });
  } catch (err) {
    console.error('Error generating SK Dekan:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat SK Dekan: ' + err.message
    });
  }
});

/**
 * POST /api/documents/generate-exam-package
 * ONE-CLICK EXAM PACKAGE: Menghasilkan paket dokumen ujian lengkap sekaligus (ST Penguji + Berita Acara + SK Dekan)
 */
router.post('/generate-exam-package', requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const payload = req.body || {};
    const nim = resolveTargetNim(req, payload);
    if (!nim) {
      return res.status(400).json({
        success: false,
        code: 'NIM_REQUIRED',
        error: 'Penerbitan Paket Dokumen Ditolak: NIM mahasiswa wajib diisi.'
      });
    }

    const student = db.prepare("SELECT * FROM users WHERE nomor_induk = ?").get(nim) || db.prepare('SELECT * FROM pendaftaran_ujian WHERE nim = ?').get(nim);
    if (!student) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        error: 'Penerbitan Paket Dokumen Ditolak: Mahasiswa tidak ditemukan dalam basis data.'
      });
    }

    // Semua dokumen dalam paket memakai payload yang sama, hasil rekonsiliasi DB.
    const verifiedPayload = buildVerifiedPayload({
      nim,
      payload,
      lockedFields: (() => {
        const exam = db.prepare('SELECT * FROM ujian_penguji WHERE nim = ? ORDER BY tanggal_ujian DESC LIMIT 1').get(nim);
        return exam
          ? {
              nilaiFinal: exam.nilai_final,
              grade: exam.grade,
              rekomendasiKelayakan: exam.rekomendasi_kelayakan,
              catatanEvaluasi: exam.catatan_evaluasi
            }
          : {};
      })(),
      panel: resolveExamPanel(nim, payload.ujianId || payload.id)
    });
    if (!verifiedPayload) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        error: 'Penerbitan Paket Dokumen Ditolak: Data mahasiswa tidak ditemukan dalam basis data.'
      });
    }

    const result = await generateExamPackage(verifiedPayload);

    res.status(201).json({
      success: true,
      message: 'Paket Dokumen Administrasi Ujian Lengkap (Surat Tugas, Berita Acara, SK Dekan) berhasil digenerate sekaligus.',
      data: result
    });
  } catch (err) {
    console.error('Error generating Exam Package:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat Paket Dokumen Ujian: ' + err.message
    });
  }
});

/**
 * GET /api/documents/auto-counters
 * Mendapatkan daftar nomor urut dokumen terkini untuk seluruh jenis dokumen
 */
router.get('/auto-counters', requireRole(['admin', 'superadmin']), (req, res) => {
  try {
    const counters = getAllDocumentCounters();
    res.json({
      success: true,
      data: counters
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/documents/auto-counters/:docType
 * Mengupdate pengaturan counter nomor surat dinas
 */
router.put('/auto-counters/:docType', requireRole(['admin', 'superadmin']), (req, res) => {
  try {
    const { docType } = req.params;
    const { lastNumber, formatTemplate } = req.body;
    const updated = updateDocumentCounter(docType, Number(lastNumber), formatTemplate);
    res.json({
      success: true,
      message: `Counter ${docType} berhasil diperbarui.`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/documents/verify/:code
 * Endpoint publik verifikasi keabsahan dokumen digital melalui QR Code / Kode Hash
 * Terbuka untuk umum agar pihak luar (auditor/verifikator) dapat mengecek validitas dokumen
 */
router.get('/verify/:code', (req, res) => {
  try {
    const { code } = req.params;
    const row = db.prepare('SELECT * FROM dokumen_arsip WHERE kode_verifikasi = ?').get(code);

    if (!row) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Dokumen tidak ditemukan dalam arsip resmi SIM Tugas Akhir FEB UTM. Pastikan kode verifikasi benar.'
      });
    }

    let meta = {};
    try {
      meta = JSON.parse(row.metadata_json || '{}');
    } catch {}

    res.json({
      success: true,
      verified: true,
      message: 'Dokumen Resmi Sah & Terverifikasi oleh Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura.',
      data: {
        kodeVerifikasi: row.kode_verifikasi,
        nomorDokumen: row.nomor_dokumen,
        jenisDokumen: row.jenis_dokumen,
        judulDokumen: row.judul_dokumen,
        nim: row.nim,
        namaMahasiswa: row.nama_mahasiswa,
        jenjang: row.jenjang,
        prodi: row.prodi,
        tanggalTerbit: row.created_at,
        fileUrl: row.file_url,
        status: row.status,
        stempelDigital: true,
        metadata: meta
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/documents/archive
 * Daftar seluruh arsip dokumen resmi di database SQLite
 */
router.get('/archive', requireRole(['admin', 'superadmin', 'koorprodi']), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM dokumen_arsip ORDER BY created_at DESC LIMIT 50').all();
    const mapped = rows.map((r) => ({
      id: r.id,
      jenisDokumen: r.jenis_dokumen,
      nomorDokumen: r.nomor_dokumen,
      judulDokumen: r.judul_dokumen,
      nim: r.nim,
      namaMahasiswa: r.nama_mahasiswa,
      jenjang: r.jenjang,
      prodi: r.prodi,
      kodeVerifikasi: r.kode_verifikasi,
      fileUrl: r.file_url,
      status: r.status,
      createdAt: r.created_at
    }));

    res.json({
      success: true,
      data: mapped
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
