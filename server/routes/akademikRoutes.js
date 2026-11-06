/**
 * Academic Process Router - SIM Tugas Akhir FEB UTM
 * Mengimplementasikan business process akademik end-to-end sesuai PRD:
 * tahapan per jenjang, tugas akhir, bimbingan, versioning naskah, publikasi, dan laporan.
 */

import express from 'express';
import db from '../database/db.js';
import { requireRole } from '../middleware/authGuard.js';
import { toText } from '../utils/payload.js';
import { InAppNotificationService } from '../notifications/inAppService.js';
import {
  TAHAP_STATUS,
  getTemplate,
  ensureStages,
  ensureTaForNim,
  buildChecklist
} from '../academic/academicService.js';
import { isSamePerson, resolveNipByName, resolveNameByNip } from '../academic/supervisorIdentity.js';

const router = express.Router();

const PRIVILEGED_ROLES = ['superadmin', 'admin', 'koorprodi', 'dosen', 'penguji'];
const PEMBIMBING_ROLES = ['dosen', 'penguji', 'koorprodi', 'admin', 'superadmin'];

function roleOf(req) {
  return String(req.user?.role || '').toLowerCase();
}
function nimOf(req) {
  return String(req.user?.nomorInduk || '').trim();
}
function isPrivileged(req) {
  return PRIVILEGED_ROLES.includes(roleOf(req));
}

function loadTa(idOrNim) {
  if (!idOrNim) return null;
  return (
    db.prepare('SELECT * FROM tugas_akhir WHERE id = ?').get(idOrNim) ||
    db.prepare('SELECT * FROM tugas_akhir WHERE nim = ? ORDER BY created_at DESC LIMIT 1').get(idOrNim) ||
    null
  );
}

/**
 * Cek apakah pengguna adalah pembimbing/promotor dari sebuah Tugas Akhir.
 *
 * Audit 21 Oktober 2026: sebelumnya pencocokan memakai SUBSTRING nama
 * (`stored.includes(user.nama)`) sehingga akun bernama "Ahmad" dianggap
 * pembimbing dari "Dr. Ahmad Fauzi, S.E.". Kini identitas utama adalah NIP
 * yang dibandingkan PERSIS; nama hanya fallback dengan kesamaan
 * ternormalisasi yang PERSIS (bukan substring).
 */
function isPembimbingOf(req, ta) {
  if (!ta) return false;

  const userNip = String(req.user?.nomorInduk || '').trim();
  const userNama = req.user?.nama || null;

  const supervisors = [
    { nip: ta.pembimbing_utama_nip, name: ta.pembimbing_utama },
    { nip: ta.pembimbing_pendamping_nip, name: ta.pembimbing_pendamping }
  ];

  // Bila NIP pembimbing tercatat, NIP itu yang otoritatif (tanpa fallback nama).
  const hasStoredNip = supervisors.some((s) => s.nip);
  if (hasStoredNip) {
    return supervisors.some((s) => s.nip && userNip && String(s.nip).trim() === userNip);
  }

  // Fallback: kesamaan nama TER-normalisasi secara persis.
  return supervisors.some((s) => isSamePerson({ nip: userNip, name: userNama, otherNip: null, otherName: s.name }));
}

function canAccessTa(req, ta) {
  if (!ta) return false;
  const role = roleOf(req);
  if (['superadmin', 'admin', 'koorprodi'].includes(role)) return true;
  if (role === 'mahasiswa') return ta.nim === nimOf(req);
  if (['dosen', 'penguji'].includes(role)) return isPembimbingOf(req, ta);
  return false;
}

function formatTa(ta) {
  if (!ta) return null;
  return {
    id: ta.id,
    mahasiswaId: ta.mahasiswa_id,
    nim: ta.nim,
    namaMahasiswa: ta.nama_mahasiswa,
    jenjang: ta.jenjang,
    prodi: ta.prodi,
    pembimbingUtama: ta.pembimbing_utama,
    pembimbingPendamping: ta.pembimbing_pendamping,
    judul: ta.judul,
    tahapAktifKode: ta.tahap_aktif_kode,
    status: ta.status,
    createdAt: ta.created_at,
    updatedAt: ta.updated_at
  };
}

function formatStage(s) {
  return {
    id: s.id,
    tugasAkhirId: s.tugas_akhir_id,
    kodeTahap: s.kode_tahap,
    namaTahap: s.nama_tahap,
    urutan: s.urutan,
    status: s.status,
    pembimbingApproved: Boolean(s.pembimbing_approved),
    adminVerified: Boolean(s.admin_verified),
    catatan: s.catatan,
    pengajuan: s.pengajuan_json ? JSON.parse(s.pengajuan_json) : null,
    tanggalMulai: s.tanggal_mulai,
    tanggalSelesai: s.tanggal_selesai
  };
}

function writeAudit(userId, action, details) {
  try {
    db.prepare('INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)').run(
      userId || 'system',
      action,
      details
    );
  } catch (_) {}
}

function notify(role, title, message, eventCategory, actionUrl) {
  try {
    InAppNotificationService.createNotification({ role, title, message, eventCategory, actionUrl });
  } catch (_) {}
}

// ==========================================
// 1. TEMPLATE TAHAPAN PER JENJANG
// ==========================================
router.get('/tahapan-template', requireRole(PRIVILEGED_ROLES.concat('mahasiswa')), (req, res) => {
  try {
    const { jenjang } = req.query;
    const rows = jenjang
      ? db.prepare('SELECT * FROM tahapan_template WHERE jenjang = ? ORDER BY urutan ASC').all(jenjang)
      : db.prepare('SELECT * FROM tahapan_template ORDER BY jenjang ASC, urutan ASC').all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/tahapan-template/:jenjang', requireRole(PRIVILEGED_ROLES.concat('mahasiswa')), (req, res) => {
  try {
    res.json({ success: true, data: getTemplate(req.params.jenjang) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. TUGAS AKHIR (ENTITAS INTI)
// ==========================================
router.get('/tugas-akhir', requireRole(PRIVILEGED_ROLES.concat('mahasiswa')), (req, res) => {
  try {
    const role = roleOf(req);
    let rows = db.prepare('SELECT * FROM tugas_akhir ORDER BY created_at DESC').all();

    if (role === 'mahasiswa') {
      rows = rows.filter((t) => t.nim === nimOf(req));
    } else if (role === 'dosen' || role === 'penguji') {
      rows = rows.filter((t) => isPembimbingOf(req, t));
    }

    const { jenjang, prodi, status } = req.query;
    if (jenjang) rows = rows.filter((t) => t.jenjang === jenjang);
    if (prodi) rows = rows.filter((t) => t.prodi === prodi);
    if (status) rows = rows.filter((t) => t.status === status);

    res.json({ success: true, data: rows.map(formatTa) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Sinkronisasi Tugas Akhir dari data pendaftaran ujian yang sudah ada
router.post('/tugas-akhir/sinkronisasi', requireRole(['koorprodi', 'admin', 'superadmin']), (req, res) => {
  try {
    const students = db.prepare('SELECT DISTINCT nim FROM pendaftaran_ujian').all();
    let created = 0;
    for (const s of students) {
      const before = db.prepare('SELECT COUNT(*) as c FROM tugas_akhir WHERE nim = ?').get(s.nim).c;
      ensureTaForNim(s.nim);
      const after = db.prepare('SELECT COUNT(*) as c FROM tugas_akhir WHERE nim = ?').get(s.nim).c;
      if (after > before) created += 1;
    }
    res.json({ success: true, message: `${created} entitas Tugas Akhir baru dibootstrap dari pendaftaran ujian.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/tugas-akhir', requireRole(['koorprodi', 'admin', 'superadmin']), (req, res) => {
  try {
    const { id, nim, namaMahasiswa, jenjang, prodi, pembimbingUtama, pembimbingPendamping, judul } = req.body;
    if (!nim) {
      return res.status(400).json({ success: false, message: 'NIM mahasiswa wajib diisi.' });
    }
    const user = db.prepare('SELECT * FROM users WHERE nomor_induk = ?').get(String(nim).trim());
    if (!user) {
      return res.status(404).json({ success: false, message: 'Mahasiswa dengan NIM tersebut tidak terdaftar.' });
    }

    const existing = id
      ? db.prepare('SELECT * FROM tugas_akhir WHERE id = ?').get(id)
      : db.prepare('SELECT * FROM tugas_akhir WHERE nim = ? ORDER BY created_at DESC LIMIT 1').get(String(nim).trim());

    if (existing) {
      db.prepare(`
        UPDATE tugas_akhir SET
          nama_mahasiswa = coalesce(?, nama_mahasiswa),
          jenjang = coalesce(?, jenjang),
          prodi = coalesce(?, prodi),
          pembimbing_utama = coalesce(?, pembimbing_utama),
          pembimbing_pendamping = coalesce(?, pembimbing_pendamping),
          judul = coalesce(?, judul),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        namaMahasiswa || null,
        jenjang || null,
        prodi || null,
        pembimbingUtama || null,
        pembimbingPendamping || null,
        judul || null,
        existing.id
      );
      ensureStages(db.prepare('SELECT * FROM tugas_akhir WHERE id = ?').get(existing.id));
      writeAudit(req.user?.id, 'UPDATE_TUGAS_AKHIR', `Memperbarui Tugas Akhir ${existing.nim}`);
      return res.json({ success: true, message: 'Data Tugas Akhir berhasil diperbarui.', data: { id: existing.id } });
    }

    const taId = id || `ta-${String(nim).trim()}`;
    db.prepare(`
      INSERT INTO tugas_akhir
        (id, mahasiswa_id, nim, nama_mahasiswa, jenjang, prodi, pembimbing_utama, pembimbing_pendamping, judul, tahap_aktif_kode, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'Aktif')
    `).run(
      taId,
      user.id,
      String(nim).trim(),
      namaMahasiswa || user.nama,
      jenjang || user.jenjang || 'S1',
      prodi || user.prodi || 'S-1 Manajemen',
      pembimbingUtama || null,
      pembimbingPendamping || null,
      judul || null
    );
    ensureStages(db.prepare('SELECT * FROM tugas_akhir WHERE id = ?').get(taId));
    writeAudit(req.user?.id, 'CREATE_TUGAS_AKHIR', `Menetapkan Tugas Akhir ${nim} — pembimbing: ${pembimbingUtama || '-'}`);

    res.status(201).json({ success: true, message: 'Tugas Akhir berhasil dibuat.', data: { id: taId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/tugas-akhir/:id', requireRole(PRIVILEGED_ROLES.concat('mahasiswa')), (req, res) => {
  try {
    const ta = loadTa(req.params.id);
    if (!ta) return res.status(404).json({ success: false, message: 'Tugas Akhir tidak ditemukan.' });
    if (!canAccessTa(req, ta)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak terhadap Tugas Akhir ini.' });
    }
    const stages = ensureStages(ta);
    res.json({ success: true, data: { ...formatTa(ta), tahapan: stages.map(formatStage) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/tugas-akhir/:id/pembimbing', requireRole(['koorprodi', 'admin', 'superadmin']), (req, res) => {
  try {
    const ta = loadTa(req.params.id);
    if (!ta) return res.status(404).json({ success: false, message: 'Tugas Akhir tidak ditemukan.' });

    // Audit 21 Oktober 2026: endpoint ini semula menerima HANYA nama field
    // camelCase dan SELALU membalas 200 SUCCESS meskipun tidak ada satu pun
    // pembimbing yang tersimpan (payload dengan nama field lain diabaikan
    // diam-diam). Akibatnya plotting hilang tanpa jejak — akun pembimbing
    // tidak pernah terbentuk sehingga_stage persetujuan tidak dapat dibaca.
    // Sekarang: (1) kedua konvensi nama field diterima, dan
    // (2) apabila tidak ada pembimbing yang dapat di-resolve, dibalas 400.
    const body = req.body || {};
    const pick = (...keys) => {
      for (const k of keys) {
        const v = body[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
      }
      return null;
    };

    const pembimbingUtama = pick('pembimbingUtama', 'pembimbing_utama');
    const pembimbingPendamping = pick('pembimbingPendamping', 'pembimbing_pendamping');
    const pembimbingUtamaNip = pick('pembimbingUtamaNip', 'pembimbing_utama_nip', 'nipPembimbingUtama', 'nip_pembimbing_utama');
    const pembimbingPendampingNip = pick(
      'pembimbingPendampingNip',
      'pembimbing_pendamping_nip',
      'nipPembimbingPendamping',
      'nip_pembimbing_pendamping'
    );

    // NIP adalah identitas otoritatif untuk penentuan pembimbing.
    // Bila NIP tidak dikirim, resolusi dari nama (data master dosen).
    const nipUtama = String(pembimbingUtamaNip || resolveNipByName(pembimbingUtama) || '').trim() || null;
    const nipPendamping = String(pembimbingPendampingNip || resolveNipByName(pembimbingPendamping) || '').trim() || null;

    const namaUtama = pembimbingUtama || (nipUtama ? resolveNameByNip(nipUtama) : null);
    const namaPendamping = pembimbingPendamping || (nipPendamping ? resolveNameByNip(nipPendamping) : null);

    if (!namaUtama && !nipUtama && !namaPendamping && !nipPendamping) {
      return res.status(400).json({
        success: false,
        code: 'SUPERVISOR_REQUIRED',
        message:
          'Plotting pembimbing ditolak: tidak ada data pembimbing yang dapat diproses. ' +
          'Kirim minimal salah satu dari: pembimbingUtama / pembimbing_utama (nama) atau ' +
          'pembimbingUtamaNip / pembimbing_utama_nip (NIP).'
      });
    }

    db.prepare(`
      UPDATE tugas_akhir SET
        pembimbing_utama = coalesce(?, pembimbing_utama),
        pembimbing_pendamping = coalesce(?, pembimbing_pendamping),
        pembimbing_utama_nip = coalesce(?, pembimbing_utama_nip),
        pembimbing_pendamping_nip = coalesce(?, pembimbing_pendamping_nip),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      namaUtama || null,
      namaPendamping || null,
      nipUtama,
      nipPendamping,
      ta.id
    );
    writeAudit(req.user?.id, 'PLOT_PEMBIMBING', `Plotting pembimbing TA ${ta.nim}: ${namaUtama || '-'} / ${namaPendamping || '-'}`);
    res.json({
      success: true,
      message: 'Pembimbing berhasil ditetapkan.',
      data: {
        pembimbingUtama: namaUtama || ta.pembimbing_utama || null,
        pembimbingUtamaNip: nipUtama || ta.pembimbing_utama_nip || null,
        pembimbingPendamping: namaPendamping || ta.pembimbing_pendamping || null,
        pembimbingPendampingNip: nipPendamping || ta.pembimbing_pendamping_nip || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// STATUS KELULUSAN MAHASISWA
//
// Audit 21 Oktober 2026 (temuan P0-2): backend SUDAH menghitung status
// 'Lulus Final' ketika seluruh tahapan selesai, tetapi nilai itu tidak pernah
// sampai ke dashboard mahasiswa sehingga mahasiswa yang sudah menyelesaikan
// Tugas Akhir tidak pernah melihat status kelulusannya.
//
// Tiga tingkat status yang ditampilkan:
//   - 'Proses'          : Tugas Akhir masih berjalan
//   - 'Siap Pengesahan' : seluruh tahapan selesai, tinggal penerbitan pengesahan
//   - 'Lulus'           : Lembar Pengesahan sudah terbit (arsip dokumen resmi)
// ============================================================================
router.get('/status-kelulusan', requireRole(PRIVILEGED_ROLES.concat('mahasiswa')), (req, res) => {
  try {
    const nim = String(req.user?.nomorInduk || '').trim();
    if (!nim) {
      return res.status(400).json({ success: false, message: 'Nomor induk tidak ditemukan pada sesi aktif.' });
    }

    const ta = db.prepare('SELECT id, status, judul FROM tugas_akhir WHERE nim = ?').get(nim);
    if (!ta) {
      res.json({
        success: true,
        data: {
          status: 'Belum Mulai',
          label: 'Belum Memulai Tugas Akhir',
          adaTugasAkhir: false,
          tahapSelesai: 0,
          totalTahap: 0,
          progresPersen: 0,
          pengesahanTerbit: false
        }
      });
      return;
    }

    const stages = db.prepare('SELECT status FROM tahap_status WHERE tugas_akhir_id = ?').all(ta.id);
    const totalTahap = stages.length;
    const tahapSelesai = stages.filter((s) => s.status === TAHAP_STATUS.SELESAI).length;

    // Pengesahan terbit bila arsip resmi 'Lembar Pengesahan' sudah ada.
    const arsip = db
      .prepare("SELECT id, kode_verifikasi, created_at FROM dokumen_arsip WHERE nim = ? AND jenis_dokumen = 'Lembar Pengesahan' ORDER BY created_at DESC LIMIT 1")
      .get(nim);
    const pengesahanTerbit = Boolean(arsip);

    let status = 'Proses';
    let label = 'Proses Tugas Akhir Berjalan';
    if (pengesahanTerbit) {
      status = 'Lulus';
      label = 'Lulus Tugas Akhir';
    } else if (ta.status === 'Lulus Final' || (totalTahap > 0 && tahapSelesai === totalTahap)) {
      status = 'Siap Pengesahan';
      label = 'Seluruh Tahapan Selesai — Siap Pengesahan';
    }

    res.json({
      success: true,
      data: {
        status,
        label,
        adaTugasAkhir: true,
        judulTugasAkhir: ta.judul || '',
        statusTugasAkhir: ta.status || '',
        tahapSelesai,
        totalTahap,
        progresPersen: totalTahap > 0 ? Math.round((tahapSelesai / totalTahap) * 100) : 0,
        pengesahanTerbit,
        kodePengesahan: arsip?.kode_verifikasi || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/tugas-akhir/:id/progres', requireRole(PRIVILEGED_ROLES.concat('mahasiswa')), (req, res) => {
  try {
    const ta = loadTa(req.params.id);
    if (!ta) return res.status(404).json({ success: false, message: 'Tugas Akhir tidak ditemukan.' });
    if (!canAccessTa(req, ta)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    const stages = ensureStages(ta);
    const total = stages.length;
    const done = stages.filter((s) => s.status === TAHAP_STATUS.SELESAI).length;
    const active = stages.find((s) => s.kode_tahap === ta.tahap_aktif_kode) || stages.find((s) => s.status !== TAHAP_STATUS.SELESAI) || null;
    const templateRow = active
      ? db.prepare('SELECT * FROM tahapan_template WHERE jenjang = ? AND kode_tahap = ?').get(ta.jenjang, active.kode_tahap)
      : null;

    res.json({
      success: true,
      data: {
        tugasAkhir: formatTa(ta),
        progresPersen: total > 0 ? Math.round((done / total) * 100) : 0,
        totalTahap: total,
        tahapSelesai: done,
        tahapAktif: active ? formatStage(active) : null,
        checklist: active && templateRow ? buildChecklist(ta, templateRow) : [],
        jumlahBimbinganDisetujui: db.prepare(
          "SELECT COUNT(*) as c FROM bimbingan_log WHERE tugas_akhir_id = ? AND status = 'Disetujui'"
        ).get(ta.id).c,
        jumlahNaskahVersi: db.prepare('SELECT COUNT(*) as c FROM naskah_versi WHERE tugas_akhir_id = ?').get(ta.id).c,
        jumlahPublikasi: db.prepare('SELECT COUNT(*) as c FROM publikasi WHERE tugas_akhir_id = ?').get(ta.id).c,
        tahapan: stages.map(formatStage)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. STATE MACHINE TAHAPAN
// ==========================================
router.post('/tugas-akhir/:id/tahap/:kode/ajukan', requireRole(['mahasiswa', 'admin', 'superadmin']), (req, res) => {
  try {
    const ta = loadTa(req.params.id);
    if (!ta) return res.status(404).json({ success: false, message: 'Tugas Akhir tidak ditemukan.' });
    if (roleOf(req) === 'mahasiswa' && ta.nim !== nimOf(req)) {
      return res.status(403).json({ success: false, message: 'Anda hanya dapat mengajukan tahap milik sendiri.' });
    }

    const stages = ensureStages(ta);
    const stage = stages.find((s) => s.kode_tahap === req.params.kode);
    if (!stage) return res.status(404).json({ success: false, message: 'Tahap tidak ditemukan untuk jenjang ini.' });
    if (stage.status === TAHAP_STATUS.SELESAI) {
      return res.status(409).json({ success: false, message: 'Tahap ini sudah selesai.' });
    }
    if (ta.tahap_aktif_kode && stage.kode_tahap !== ta.tahap_aktif_kode) {
      return res.status(409).json({ success: false, message: 'Tahap ini belum terbuka. Selesaikan tahap aktif terlebih dahulu.' });
    }

    const templateRow = db.prepare('SELECT * FROM tahapan_template WHERE jenjang = ? AND kode_tahap = ?').get(ta.jenjang, stage.kode_tahap);
    const checklist = buildChecklist(ta, templateRow);
    const unfulfilled = checklist.filter((c) => !c.terpenuhi);
    if (unfulfilled.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'CHECKLIST_INCOMPLETE',
        message: 'Syarat tahap belum lengkap. Lengkapi seluruh checklist terlebih dahulu.',
        data: { checklist }
      });
    }

    db.prepare(`
      UPDATE tahap_status SET
        status = ?,
        pengajuan_json = ?,
        pembimbing_approved = 0,
        admin_verified = 0,
        catatan = coalesce(?, catatan),
        tanggal_mulai = coalesce(tanggal_mulai, ?),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      TAHAP_STATUS.MENUNGGU_PEMBIMBING,
      JSON.stringify({ checklist, catatan: req.body?.catatan || '' }),
      req.body?.catatan || null,
      new Date().toISOString(),
      stage.id
    );

    writeAudit(req.user?.id, 'AJUKAN_TAHAP', `Pengajuan tahap ${stage.nama_tahap} untuk ${ta.nim}`);
    notify('dosen', `Pengajuan Tahap: ${stage.nama_tahap}`, `${ta.nama_mahasiswa} (${ta.nim}) mengajukan tahap ${stage.nama_tahap} dan menunggu persetujuan pembimbing.`, 'persetujuan_naskah', '/dosen/bimbingan');

    res.json({ success: true, message: 'Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/tugas-akhir/:id/tahap/:kode/approve', requireRole(PEMBIMBING_ROLES), (req, res) => {
  try {
    const ta = loadTa(req.params.id);
    if (!ta) return res.status(404).json({ success: false, message: 'Tugas Akhir tidak ditemukan.' });

    const role = roleOf(req);
    if (['dosen', 'penguji'].includes(role) && !isPembimbingOf(req, ta)) {
      return res.status(403).json({ success: false, message: 'Anda bukan pembimbing Tugas Akhir ini.' });
    }

    const stages = ensureStages(ta);
    const stage = stages.find((s) => s.kode_tahap === req.params.kode);
    if (!stage) return res.status(404).json({ success: false, message: 'Tahap tidak ditemukan.' });
    if (stage.status !== TAHAP_STATUS.MENUNGGU_PEMBIMBING) {
      return res.status(409).json({ success: false, message: `Tahap tidak dalam status menunggu persetujuan pembimbing (saat ini: ${stage.status}).` });
    }

    db.prepare(`
      UPDATE tahap_status SET
        pembimbing_approved = 1,
        status = ?,
        catatan = coalesce(?, catatan),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(TAHAP_STATUS.MENUNGGU_VERIFIKASI, req.body?.catatan || null, stage.id);

    writeAudit(req.user?.id, 'APPROVE_TAHAP', `Pembimbing menyetujui tahap ${stage.nama_tahap} untuk ${ta.nim}`);
    notify('admin', `Tahap Disetujui Pembimbing: ${stage.nama_tahap}`, `${ta.nama_mahasiswa} (${ta.nim}) menunggu verifikasi administrasi tahap ${stage.nama_tahap}.`, 'pendaftaran_ujian', '/admin/verifikasi-berkas');

    res.json({ success: true, message: 'Tahap disetujui pembimbing. Menunggu verifikasi admin/prodi.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/tugas-akhir/:id/tahap/:kode/verifikasi', requireRole(['koorprodi', 'admin', 'superadmin']), (req, res) => {
  try {
    const ta = loadTa(req.params.id);
    if (!ta) return res.status(404).json({ success: false, message: 'Tugas Akhir tidak ditemukan.' });

    const stages = ensureStages(ta);
    const stage = stages.find((s) => s.kode_tahap === req.params.kode);
    if (!stage) return res.status(404).json({ success: false, message: 'Tahap tidak ditemukan.' });
    if (stage.status !== TAHAP_STATUS.MENUNGGU_VERIFIKASI) {
      return res.status(409).json({ success: false, message: `Tahap belum disetujui pembimbing (saat ini: ${stage.status}).` });
    }

    db.prepare(`
      UPDATE tahap_status SET
        admin_verified = 1,
        status = ?,
        catatan = coalesce(?, catatan),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(TAHAP_STATUS.SIAP_DILAKSANAKAN, req.body?.catatan || null, stage.id);

    writeAudit(req.user?.id, 'VERIFIKASI_TAHAP', `Admin memverifikasi tahap ${stage.nama_tahap} untuk ${ta.nim}`);
    notify('mahasiswa', `Tahap Terverifikasi: ${stage.nama_tahap}`, `Tahap ${stage.nama_tahap} Anda telah diverifikasi dan siap dilaksanakan.`, 'jadwal_ujian', '/mahasiswa/dashboard');

    res.json({ success: true, message: 'Tahap terverifikasi dan siap dilaksanakan.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/tugas-akhir/:id/tahap/:kode/selesai', requireRole(['koorprodi', 'admin', 'superadmin']), (req, res) => {
  try {
    const ta = loadTa(req.params.id);
    if (!ta) return res.status(404).json({ success: false, message: 'Tugas Akhir tidak ditemukan.' });

    const stages = ensureStages(ta);
    const stage = stages.find((s) => s.kode_tahap === req.params.kode);
    if (!stage) return res.status(404).json({ success: false, message: 'Tahap tidak ditemukan.' });
    if (stage.status === TAHAP_STATUS.SELESAI) {
      return res.status(409).json({ success: false, message: 'Tahap ini sudah selesai.' });
    }
    if (ta.tahap_aktif_kode && stage.kode_tahap !== ta.tahap_aktif_kode) {
      return res.status(409).json({
        success: false,
        message: 'Hanya tahap aktif yang dapat diselesaikan. Selesaikan tahap berjalan terlebih dahulu.'
      });
    }

    // Audit 21 Oktober 2026 (Pengerasan): sebuah tahapan hanya boleh ditutup
    // setelah pembimbing menyetujuinya. Sebelumnya endpoint ini hanya memeriksa
    // bahwa tahap tersebut adalah tahap aktif, sehingga koordinator dapat
    // menutup tahap tanpa paraf pembimbing — melanggar urutan SOP.
    if (!stage.pembimbing_approved) {
      return res.status(409).json({
        success: false,
        code: 'STAGE_NOT_APPROVED',
        message:
          'Tahap belum dapat diselesaikan: persetujuan pembimbing masih diperlukan. ' +
          'Minta pembimbing menyetujui pengajuan tahap terlebih dahulu.'
      });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE tahap_status SET status = ?, tanggal_selesai = ?, admin_verified = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(TAHAP_STATUS.SELESAI, now, stage.id);

    const next = stages.find((s) => s.urutan === stage.urutan + 1);
    if (next) {
      db.prepare(`
        UPDATE tahap_status SET status = ?, tanggal_mulai = coalesce(tanggal_mulai, ?), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(TAHAP_STATUS.BERJALAN, now, next.id);
      db.prepare('UPDATE tugas_akhir SET tahap_aktif_kode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(next.kode_tahap, ta.id);
      notify('mahasiswa', `Tahap Baru Terbuka: ${next.nama_tahap}`, `Selamat! Tahap ${stage.nama_tahap} selesai. Tahap berikutnya (${next.nama_tahap}) kini terbuka.`, 'jadwal_ujian', '/mahasiswa/dashboard');
    } else {
      db.prepare("UPDATE tugas_akhir SET status = 'Lulus Final', tahap_aktif_kode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(stage.kode_tahap, ta.id);
      notify('mahasiswa', 'Seluruh Tahapan Selesai', `Selamat! Seluruh tahapan Tugas Akhir Anda telah selesai dan siap menuju pengesahan final.`, 'persetujuan_naskah', '/mahasiswa/dokumen');
    }

    writeAudit(req.user?.id, 'SELESAI_TAHAP', `Tahap ${stage.nama_tahap} dinyatakan selesai untuk ${ta.nim}`);
    res.json({ success: true, message: next ? `Tahap selesai. Tahap berikutnya (${next.nama_tahap}) dibuka.` : 'Seluruh tahapan selesai.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. LOG BIMBINGAN
// ==========================================
router.get('/bimbingan', requireRole(PRIVILEGED_ROLES.concat('mahasiswa')), (req, res) => {
  try {
    const role = roleOf(req);
    let rows = db.prepare('SELECT * FROM bimbingan_log ORDER BY created_at DESC').all();

    if (role === 'mahasiswa') {
      rows = rows.filter((b) => b.nim === nimOf(req));
    } else if (role === 'dosen' || role === 'penguji') {
      const taMap = new Map(db.prepare('SELECT * FROM tugas_akhir').all().map((t) => [t.id, t]));
      rows = rows.filter((b) => {
        const ta = taMap.get(b.tugas_akhir_id);
        return ta ? isPembimbingOf(req, ta) : false;
      });
    }

    if (req.query.tugasAkhirId) rows = rows.filter((b) => b.tugas_akhir_id === req.query.tugasAkhirId);
    if (req.query.status) rows = rows.filter((b) => b.status === req.query.status);

    res.json({
      success: true,
      data: rows.map((b) => ({
        id: b.id,
        tugasAkhirId: b.tugas_akhir_id,
        nim: b.nim,
        namaMahasiswa: b.nama_mahasiswa,
        tanggal: b.tanggal,
        topik: b.topik,
        catatan: b.catatan,
        status: b.status,
        disetujuiOleh: b.disetujui_oleh,
        catatanPembimbing: b.catatan_pembimbing,
        createdAt: b.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/bimbingan', requireRole(['mahasiswa', 'dosen', 'penguji', 'koorprodi', 'admin', 'superadmin']), (req, res) => {
  try {
    const role = roleOf(req);
    const nim = role === 'mahasiswa' ? nimOf(req) : String(req.body?.nim || '').trim();
    if (!nim) return res.status(400).json({ success: false, message: 'NIM mahasiswa wajib diisi.' });

    const ta = ensureTaForNim(nim);
    if (!ta) return res.status(404).json({ success: false, message: 'Mahasiswa tidak terdaftar.' });

    // Pembimbing (dosen/penguji) hanya boleh mencatat sesi untuk mahasiswa bimbingannya.
    if (['dosen', 'penguji'].includes(role) && !isPembimbingOf(req, ta)) {
      return res.status(403).json({ success: false, message: 'Anda bukan pembimbing mahasiswa ini.' });
    }

    const { tanggal, topik, catatan } = req.body;
    const id = `bim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    // Sesi yang dicatat langsung oleh pembimbing dianggap sudah tervalidasi.
    const status = ['dosen', 'penguji'].includes(role) ? 'Disetujui' : 'Menunggu Approval';
    db.prepare(`
      INSERT INTO bimbingan_log (id, tugas_akhir_id, nim, nama_mahasiswa, tanggal, topik, catatan, status, disetujui_oleh)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, ta.id, nim, ta.nama_mahasiswa,
      tanggal || new Date().toISOString().split('T')[0],
      topik || '', catatan || '',
      status,
      status === 'Disetujui' ? (req.user?.nama || 'Pembimbing') : null
    );

    writeAudit(req.user?.id, 'CREATE_BIMBINGAN', `Log bimbingan baru untuk ${nim}: ${topik || '-'}`);
    notify('dosen', 'Log Bimbingan Baru Menunggu Validasi', `${ta.nama_mahasiswa} (${nim}) mencatat sesi bimbingan "${topik || '-'}" dan menunggu validasi pembimbing.`, 'review_naskah', '/dosen/bimbingan');

    res.status(201).json({ success: true, message: 'Log bimbingan tersimpan dan menunggu validasi pembimbing.', data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// PERSETUJUAN NASKAH OLEH PEMBIMBING
//
// Audit 21 Oktober 2026 (temuan BP-2 dari tinjauan business process):
// sebelum ini, tabel naskah_versi tidak memiliki status persetujuan sama
// sekali. Halaman "Persetujuan" pada antarmuka sebenarnya memberi
// PERSETUJUAN TAHAP, bukan naskahnya — sehingga naskah dapat tampil seolah
// "sudah disetujui pembimbing" tanpa pernah ada keputusan atas naskahnya.
//
// Endpoint ini memisahkan dengan tegas dua hal yang tadinya tertukar:
//   - Persetujuan TAHAP  : POST /tugas-akhir/:id/tahap/:kode/approve
//   - Persetujuan NASKAH : PUT  /naskah/:versiId/approval   (endpoint ini)
// ============================================================================
router.put('/naskah/:versiId/approval', requireRole(PEMBIMBING_ROLES), (req, res) => {
  try {
    const { versiId } = req.params;
    const versi = db.prepare('SELECT * FROM naskah_versi WHERE id = ?').get(versiId);
    if (!versi) {
      return res.status(404).json({ success: false, code: 'NASKAH_NOT_FOUND', message: 'Versi naskah tidak ditemukan.' });
    }

    const ta = db.prepare('SELECT * FROM tugas_akhir WHERE id = ?').get(versi.tugas_akhir_id);
    if (ta && !isPembimbingOf(req, ta)) {
      return res.status(403).json({
        success: false,
        code: 'NOT_SUPERVISOR',
        message: 'Anda bukan pembimbing mahasiswa pemilik naskah ini.'
      });
    }

    const keputusan = String(req.body?.status || '').trim();
    if (!['Disetujui', 'Perlu Revisi', 'Ditolak'].includes(keputusan)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_APPROVAL_STATUS',
        message: "status tidak sah. Gunakan: 'Disetujui', 'Perlu Revisi', atau 'Ditolak'."
      });
    }

    const catatan = toText(req.body?.catatan, '');
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE naskah_versi
         SET status_persetujuan = ?,
             disetujui_oleh = ?,
             disetujui_oleh_nip = ?,
             tanggal_persetujuan = ?,
             catatan_persetujuan = ?
       WHERE id = ?`
    ).run(keputusan, req.user?.nama || '', req.user?.nomorInduk || '', now, catatan, versiId);

    // Beri tahu mahasiswa bahwa naskahnya telah ditelaah.
    try {
      notify(
        'mahasiswa',
        `Telaah Naskah: ${keputusan}`,
        `Naskah versi ${versi.nomor_versi} Anda telah ditelaah oleh ${req.user?.nama || 'pembimbing'}. ${catatan ? `Catatan: ${catatan}` : ''}`,
        'review_naskah',
        '/mahasiswa/naskah'
      );
    } catch (_) {}

    writeAudit(req.user?.id, 'APPROVE_NASKAH', `Naskah ${versiId} (versi ${versi.nomor_versi}) -> ${keputusan}`);

    res.json({
      success: true,
      message: `Persetujuan naskah versi ${versi.nomor_versi} tersimpan: ${keputusan}.`,
      data: {
        id: versiId,
        nomorVersi: versi.nomor_versi,
        statusPersetujuan: keputusan,
        disetujuiOleh: req.user?.nama || '',
        tanggalPersetujuan: now
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/bimbingan/:id/approval', requireRole(PEMBIMBING_ROLES), (req, res) => {
  try {
    const log = db.prepare('SELECT * FROM bimbingan_log WHERE id = ?').get(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Log bimbingan tidak ditemukan.' });

    const ta = loadTa(log.tugas_akhir_id);
    const role = roleOf(req);
    if (ta && ['dosen', 'penguji'].includes(role) && !isPembimbingOf(req, ta)) {
      return res.status(403).json({ success: false, message: 'Anda bukan pembimbing mahasiswa ini.' });
    }

    const status = req.body?.status === 'Ditolak' ? 'Ditolak' : 'Disetujui';
    db.prepare(`
      UPDATE bimbingan_log SET status = ?, disetujui_oleh = ?, catatan_pembimbing = ? WHERE id = ?
    `).run(status, req.user?.nama || req.user?.id || 'pembimbing', req.body?.catatanPembimbing || null, log.id);

    writeAudit(req.user?.id, 'APPROVE_BIMBINGAN', `Validasi bimbingan ${log.id} -> ${status}`);
    notify('mahasiswa', `Log Bimbingan ${status}`, `Log bimbingan "${log.topik || '-'}" telah ${status.toLowerCase()} oleh pembimbing.`, 'review_naskah', '/mahasiswa/bimbingan');

    res.json({ success: true, message: `Log bimbingan berhasil di-${status.toLowerCase()}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/bimbingan/:id', requireRole(['mahasiswa', 'admin', 'superadmin']), (req, res) => {
  try {
    const log = db.prepare('SELECT * FROM bimbingan_log WHERE id = ?').get(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Log bimbingan tidak ditemukan.' });

    const role = roleOf(req);
    if (role === 'mahasiswa') {
      if (log.nim !== nimOf(req)) return res.status(403).json({ success: false, message: 'Akses ditolak.' });
      if (log.status !== 'Menunggu Approval') {
        return res.status(409).json({ success: false, message: 'Log yang sudah divalidasi tidak dapat dihapus.' });
      }
    }

    db.prepare('DELETE FROM bimbingan_log WHERE id = ?').run(log.id);
    writeAudit(req.user?.id, 'DELETE_BIMBINGAN', `Menghapus log bimbingan ${log.id}`);
    res.json({ success: true, message: 'Log bimbingan berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 5. VERSIONING NASKAH & KOMENTAR
// ==========================================
router.get('/naskah', requireRole(PRIVILEGED_ROLES.concat('mahasiswa')), (req, res) => {
  try {
    const role = roleOf(req);
    let rows = db.prepare('SELECT * FROM naskah_versi ORDER BY created_at DESC').all();

    if (role === 'mahasiswa') {
      rows = rows.filter((n) => n.nim === nimOf(req));
    } else if (role === 'dosen' || role === 'penguji') {
      const taMap = new Map(db.prepare('SELECT * FROM tugas_akhir').all().map((t) => [t.id, t]));
      rows = rows.filter((n) => {
        const ta = taMap.get(n.tugas_akhir_id);
        return ta ? isPembimbingOf(req, ta) : false;
      });
    }
    if (req.query.tugasAkhirId) rows = rows.filter((n) => n.tugas_akhir_id === req.query.tugasAkhirId);
    // Audit 21 Oktober 2026 (BP-2): parameter ?nim= sempat diabaikan sehingga
    // pemanggil tidak pernah bisa meminta daftar naskah seorang mahasiswa
    // tertentu — dan halaman Review Naskah mengambil naskah milik orang lain.
    if (req.query.nim) rows = rows.filter((n) => String(n.nim).trim() === String(req.query.nim).trim());

    // Audit 21 Oktober 2026 (P2-5): identitas pemilik & pembimbing diambil
    // dengan SATU query untuk seluruh baris (JOIN), bukan satu query per
    // naskah (N+1) yang sebelumnya membuat endpoint ini melambat seiring
    // bertambahnya versi naskah.
    const idTa = [...new Set(rows.map((r) => r.tugas_akhir_id).filter(Boolean))];
    const taMap = new Map(
      (idTa.length
        ? db
            .prepare(
              `SELECT id, mahasiswa_id, nama_mahasiswa, pembimbing_utama, pembimbing_utama_nip, pembimbing_pendamping_nip
                 FROM tugas_akhir WHERE id IN (${idTa.map(() => '?').join(',')})`
            )
            .all(...idTa)
        : []
      ).map((r) => [r.id, r])
    );

    res.json({
      success: true,
      data: rows.map((n) => {
        const ta = n.tugas_akhir_id ? taMap.get(n.tugas_akhir_id) || null : null;
        return {
        id: n.id,
        tugasAkhirId: n.tugas_akhir_id,
        nim: n.nim,
        nomorVersi: n.nomor_versi,
        fileUrl: n.file_url,
        keterangan: n.keterangan,
        createdAt: n.created_at,
        mhsId: ta?.mahasiswa_id || null,
        dosenNip: ta?.pembimbing_utama_nip || ta?.pembimbing_pendamping_nip || null,
          peranDosen: ta?.pembimbing_utama || '',
          namaMahasiswa: ta?.nama_mahasiswa || '',
        // Audit 21 Oktober 2026 (BP-2): status telaah pembimbing ikut dikembalikan
        // agar antarmuka dapat membedakan "Draft" (belum ditelaah) dari
        // "Disetujui" / "Perlu Revisi".
        statusPersetujuan: n.status_persetujuan || 'Diajukan',
        disetujuiOleh: n.disetujui_oleh || '',
        tanggalPersetujuan: n.tanggal_persetujuan || '',
        catatanPersetujuan: n.catatan_persetujuan || ''
        };
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/naskah', requireRole(['mahasiswa', 'admin', 'superadmin']), (req, res) => {
  try {
    const role = roleOf(req);
    const nim = role === 'mahasiswa' ? nimOf(req) : String(req.body?.nim || '').trim();
    if (!nim) return res.status(400).json({ success: false, message: 'NIM mahasiswa wajib diisi.' });

    const ta = ensureTaForNim(nim);
    if (!ta) return res.status(404).json({ success: false, message: 'Mahasiswa tidak terdaftar.' });

    const { fileUrl, keterangan } = req.body;
    if (!fileUrl) return res.status(400).json({ success: false, message: 'URL berkas naskah wajib disertakan.' });

    const last = db.prepare('SELECT MAX(nomor_versi) as m FROM naskah_versi WHERE tugas_akhir_id = ?').get(ta.id).m;
    const nomorVersi = (last || 0) + 1;
    const id = `nv-${ta.id}-${nomorVersi}`;

    db.prepare(`
      INSERT INTO naskah_versi (id, tugas_akhir_id, nim, nomor_versi, file_url, keterangan, uploader_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, ta.id, nim, nomorVersi, fileUrl, keterangan || '', req.user?.id || null);

    writeAudit(req.user?.id, 'UPLOAD_NASKAH', `Unggah naskah versi ${nomorVersi} untuk ${nim}`);
    notify('dosen', `Naskah Versi ${nomorVersi} Baru`, `${ta.nama_mahasiswa} (${nim}) mengunggah naskah versi ${nomorVersi} untuk ditinjau.`, 'review_naskah', '/dosen/naskah');

    res.status(201).json({ success: true, message: `Naskah versi ${nomorVersi} tersimpan.`, data: { id, nomorVersi } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function authorizeVersi(req, versi) {
  const ta = loadTa(versi.tugas_akhir_id);
  if (!ta) return false;
  return canAccessTa(req, ta);
}

router.get('/naskah/:versiId/komentar', requireRole(PRIVILEGED_ROLES.concat('mahasiswa')), (req, res) => {
  try {
    const versi = db.prepare('SELECT * FROM naskah_versi WHERE id = ?').get(req.params.versiId);
    if (!versi) return res.status(404).json({ success: false, message: 'Versi naskah tidak ditemukan.' });
    if (!authorizeVersi(req, versi)) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    const rows = db.prepare('SELECT * FROM komentar_naskah WHERE naskah_versi_id = ? ORDER BY created_at ASC').all(versi.id);
    res.json({
      success: true,
      data: rows.map((k) => ({
        id: k.id,
        naskahVersiId: k.naskah_versi_id,
        pemberiId: k.pemberi_id,
        pemberiNama: k.pemberi_nama,
        pemberiRole: k.pemberi_role,
        bagian: k.bagian,
        isi: k.isi,
        status: k.status,
        createdAt: k.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/naskah/:versiId/komentar', requireRole(PEMBIMBING_ROLES), (req, res) => {
  try {
    const versi = db.prepare('SELECT * FROM naskah_versi WHERE id = ?').get(req.params.versiId);
    if (!versi) return res.status(404).json({ success: false, message: 'Versi naskah tidak ditemukan.' });

    const { isi, bagian } = req.body;
    if (!isi || !String(isi).trim()) return res.status(400).json({ success: false, message: 'Isi komentar wajib diisi.' });

    const id = `kom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO komentar_naskah (id, naskah_versi_id, pemberi_id, pemberi_nama, pemberi_role, bagian, isi, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Terbuka')
    `).run(id, versi.id, req.user?.id || null, req.user?.nama || '', roleOf(req), bagian || '', String(isi).trim());

    writeAudit(req.user?.id, 'KOMENTAR_NASKAH', `Komentar pada naskah ${versi.id}`);
    notify('mahasiswa', 'Komentar Baru pada Naskah', `${req.user?.nama || 'Pembimbing'} menambahkan komentar pada naskah Anda (${bagian || 'umum'}).`, 'review_naskah', '/mahasiswa/naskah');

    res.status(201).json({ success: true, message: 'Komentar tersimpan.', data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/komentar/:id/status', requireRole(PEMBIMBING_ROLES), (req, res) => {
  try {
    const kom = db.prepare('SELECT * FROM komentar_naskah WHERE id = ?').get(req.params.id);
    if (!kom) return res.status(404).json({ success: false, message: 'Komentar tidak ditemukan.' });

    const status = req.body?.status === 'Selesai' ? 'Selesai' : 'Terbuka';
    // Audit 21 Oktober 2026 (Simulasi Proses A–Z): pembaruan yang tidak
    // menyentuh baris mana pun tidak boleh dilaporkan sebagai berhasil.
    const result = db.prepare('UPDATE komentar_naskah SET status = ? WHERE id = ?').run(status, kom.id);
    if (!result.changes) {
      return res.status(404).json({
        success: false,
        code: 'KOMENTAR_NOT_FOUND',
        message: `Komentar dengan id "${kom.id}" tidak ditemukan.`
      });
    }
    writeAudit(req.user?.id, 'STATUS_KOMENTAR', `Komentar ${kom.id} -> ${status}`);
    res.json({ success: true, message: `Status komentar diperbarui menjadi ${status}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 6. PUBLIKASI ILMIAH
// ==========================================
router.get('/publikasi', requireRole(PRIVILEGED_ROLES.concat('mahasiswa')), (req, res) => {
  try {
    const role = roleOf(req);
    let rows = db.prepare('SELECT * FROM publikasi ORDER BY created_at DESC').all();

    if (role === 'mahasiswa') {
      rows = rows.filter((p) => p.nim === nimOf(req));
    } else if (role === 'dosen' || role === 'penguji') {
      const taMap = new Map(db.prepare('SELECT * FROM tugas_akhir').all().map((t) => [t.id, t]));
      rows = rows.filter((p) => {
        const ta = taMap.get(p.tugas_akhir_id);
        return ta ? isPembimbingOf(req, ta) : false;
      });
    }
    if (req.query.tugasAkhirId) rows = rows.filter((p) => p.tugas_akhir_id === req.query.tugasAkhirId);

    res.json({
      success: true,
      data: rows.map((p) => ({
        id: p.id,
        tugasAkhirId: p.tugas_akhir_id,
        nim: p.nim,
        namaMahasiswa: p.nama_mahasiswa,
        judul: p.judul,
        jurnal: p.jurnal,
        tahun: p.tahun,
        tautan: p.tautan,
        buktiUrl: p.bukti_url,
        status: p.status,
        statusVerifikasi: p.status_verifikasi,
        verifikator: p.verifikator,
        catatan: p.catatan,
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/publikasi', requireRole(['mahasiswa', 'admin', 'superadmin']), (req, res) => {
  try {
    const role = roleOf(req);
    const nim = role === 'mahasiswa' ? nimOf(req) : String(req.body?.nim || '').trim();
    if (!nim) return res.status(400).json({ success: false, message: 'NIM mahasiswa wajib diisi.' });

    const ta = ensureTaForNim(nim);
    if (!ta) return res.status(404).json({ success: false, message: 'Mahasiswa tidak terdaftar.' });

    const { judul, jurnal, tahun, tautan, buktiUrl } = req.body;
    if (!judul || !String(judul).trim()) return res.status(400).json({ success: false, message: 'Judul publikasi wajib diisi.' });

    const id = `pub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO publikasi (id, tugas_akhir_id, nim, nama_mahasiswa, judul, jurnal, tahun, tautan, bukti_url, status, status_verifikasi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Diajukan', 'Menunggu Verifikasi')
    `).run(id, ta.id, nim, ta.nama_mahasiswa, String(judul).trim(), jurnal || '', tahun || '', tautan || '', buktiUrl || '');

    writeAudit(req.user?.id, 'CREATE_PUBLIKASI', `Publikasi baru untuk ${nim}: ${judul}`);
    notify('koorprodi', 'Publikasi Menunggu Verifikasi', `Publikasi "${judul}" oleh ${ta.nama_mahasiswa} (${nim}) menunggu verifikasi.`, 'persetujuan_naskah', '/koorprodi/dokumen');

    res.status(201).json({ success: true, message: 'Data publikasi tersimpan dan menunggu verifikasi.', data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/publikasi/:id/verifikasi', requireRole(['dosen', 'koorprodi', 'admin', 'superadmin']), (req, res) => {
  try {
    const pub = db.prepare('SELECT * FROM publikasi WHERE id = ?').get(req.params.id);
    if (!pub) return res.status(404).json({ success: false, message: 'Data publikasi tidak ditemukan.' });

    const verified = req.body?.statusVerifikasi === 'Terverifikasi';
    const statusVerifikasi = verified ? 'Terverifikasi' : 'Ditolak';
    db.prepare(`
      UPDATE publikasi SET status_verifikasi = ?, status = ?, verifikator = ?, catatan = ? WHERE id = ?
    `).run(statusVerifikasi, verified ? 'Disetujui' : 'Ditolak', req.user?.nama || '', req.body?.catatan || '', pub.id);

    writeAudit(req.user?.id, 'VERIFIKASI_PUBLIKASI', `Publikasi ${pub.id} -> ${statusVerifikasi}`);
    notify('mahasiswa', `Publikasi ${statusVerifikasi}`, `Publikasi "${pub.judul}" telah ${statusVerifikasi.toLowerCase()} oleh ${req.user?.nama || 'verifikator'}.`, 'persetujuan_naskah', '/mahasiswa/publikasi');

    res.json({ success: true, message: `Publikasi berhasil di-${statusVerifikasi.toLowerCase()}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 7. LAPORAN & MONITORING
// ==========================================
router.get('/laporan/progres', requireRole(['koorprodi', 'admin', 'superadmin']), (req, res) => {
  try {
    const { jenjang, prodi } = req.query;
    let tas = db.prepare('SELECT * FROM tugas_akhir ORDER BY created_at DESC').all();
    if (jenjang) tas = tas.filter((t) => t.jenjang === jenjang);
    if (prodi) tas = tas.filter((t) => t.prodi === prodi);

    const perJenjang = {};
    const data = tas.map((ta) => {
      const stages = db.prepare('SELECT * FROM tahap_status WHERE tugas_akhir_id = ? ORDER BY urutan ASC').all(ta.id);
      const total = stages.length;
      const done = stages.filter((s) => s.status === TAHAP_STATUS.SELESAI).length;
      perJenjang[ta.jenjang] = (perJenjang[ta.jenjang] || 0) + 1;
      return {
        ...formatTa(ta),
        totalTahap: total,
        tahapSelesai: done,
        progresPersen: total > 0 ? Math.round((done / total) * 100) : 0,
        jumlahBimbinganDisetujui: db.prepare(
          "SELECT COUNT(*) as c FROM bimbingan_log WHERE tugas_akhir_id = ? AND status = 'Disetujui'"
        ).get(ta.id).c,
        jumlahNaskahVersi: db.prepare('SELECT COUNT(*) as c FROM naskah_versi WHERE tugas_akhir_id = ?').get(ta.id).c,
        jumlahPublikasiTerverifikasi: db.prepare(
          "SELECT COUNT(*) as c FROM publikasi WHERE tugas_akhir_id = ? AND status_verifikasi = 'Terverifikasi'"
        ).get(ta.id).c
      };
    });

    res.json({
      success: true,
      data: {
        totalTugasAkhir: tas.length,
        perJenjang,
        mahasiswa: data
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/laporan/beban-dosen', requireRole(['koorprodi', 'admin', 'superadmin']), (req, res) => {
  try {
    const tas = db.prepare('SELECT pembimbing_utama, pembimbing_pendamping FROM tugas_akhir').all();
    const counts = {};
    const bump = (nama) => {
      if (!nama) return;
      const key = String(nama).trim();
      if (!key || key === '-') return;
      counts[key] = (counts[key] || 0) + 1;
    };
    for (const t of tas) {
      bump(t.pembimbing_utama);
      bump(t.pembimbing_pendamping);
    }

    const kuota = db.prepare('SELECT * FROM kuota_dosen').all();
    const kuotaMap = new Map(kuota.map((k) => [String(k.nama).trim(), k]));

    const data = Object.entries(counts)
      .map(([nama, jumlah]) => {
        const k = kuotaMap.get(nama);
        return {
          nama,
          jumlahMahasiswaAktif: jumlah,
          kuotaUtama: k ? k.kuota_utama : null,
          kuotaPendamping: k ? k.kuota_pendamping : null,
          status: k && k.kuota_utama && jumlah > k.kuota_utama ? 'Overload' : 'Aman'
        };
      })
      .sort((a, b) => b.jumlahMahasiswaAktif - a.jumlahMahasiswaAktif);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
