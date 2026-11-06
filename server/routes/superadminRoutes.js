import express from 'express';
import path from 'node:path';
import db from '../database/db.js';
import { hashPassword, generateTemporaryPassword } from '../utils/password.js';
import { requireRole } from '../middleware/authGuard.js';
import { toText, toNumber } from '../utils/payload.js';
import { createDatabaseBackup, listDatabaseBackups, verifyBackupIntegrity } from '../database/backup.js';

const router = express.Router();

// ==========================================
// 1. MASTER PROGRAM STUDI
// ==========================================
router.get('/prodi', requireRole(['superadmin', 'admin', 'koorprodi']), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM prodi ORDER BY kode_prodi ASC').all();
    const formatted = rows.map((r) => ({
      ...r,
      kodeProdi: r.kode_prodi,
      namaProdi: r.nama_prodi,
      noSkAkreditasi: r.no_sk_akreditasi,
      nipKaprodi: r.nip_kaprodi,
      kuotaMahasiswa: r.kuota_mahasiswa,
      mahasiswaAktif: r.mahasiswa_aktif
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/prodi', requireRole(['superadmin']), (req, res) => {
  try {
    const { id, kodeProdi, namaProdi, jenjang, akreditasi, noSkAkreditasi, kaprodi, nipKaprodi, kuotaMahasiswa, deskripsi } = req.body;

    if (!kodeProdi || !String(kodeProdi).trim()) {
      return res.status(400).json({ success: false, message: 'Kode program studi wajib diisi.' });
    }
    if (!namaProdi || !String(namaProdi).trim()) {
      return res.status(400).json({ success: false, message: 'Nama program studi wajib diisi.' });
    }
    if (!jenjang || !String(jenjang).trim()) {
      return res.status(400).json({ success: false, message: 'Jenjang program studi wajib diisi.' });
    }

    const duplicate = db.prepare('SELECT id FROM prodi WHERE kode_prodi = ?').get(String(kodeProdi).trim());
    if (duplicate) {
      return res.status(409).json({ success: false, message: `Kode program studi ${kodeProdi} sudah terdaftar.` });
    }

    // Audit 21 Oktober 2026 (Simulasi Proses A–Z): `akreditasi` dan
    // `kaprodi` diteruskan apa adanya sehingga `undefined` tidak dapat
    // diikat ke parameter SQLite -> HTTP 500. Semua nilai kini dinormalisasi.
    const stmt = db.prepare(`
      INSERT INTO prodi (id, kode_prodi, nama_prodi, jenjang, akreditasi, no_sk_akreditasi, kaprodi, nip_kaprodi, kuota_mahasiswa, mahasiswa_aktif, status, deskripsi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'Aktif', ?)
    `);
    stmt.run(
      id || `prodi-${Date.now()}`,
      String(kodeProdi).trim(),
      String(namaProdi).trim(),
      jenjang,
      toText(akreditasi, '-'),
      toText(noSkAkreditasi),
      toText(kaprodi),
      toText(nipKaprodi),
      toNumber(kuotaMahasiswa, 100),
      toText(deskripsi)
    );
    res.json({ success: true, message: `Program studi ${namaProdi} berhasil ditambahkan ke database.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/prodi/:id', requireRole(['superadmin']), (req, res) => {
  try {
    const { id } = req.params;
    const { kodeProdi, namaProdi, jenjang, akreditasi, noSkAkreditasi, kaprodi, nipKaprodi, kuotaMahasiswa, status, deskripsi } = req.body;

    const existing = db.prepare('SELECT id FROM prodi WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Program studi tidak ditemukan.' });
    }
    if (!kodeProdi || !String(kodeProdi).trim() || !namaProdi || !String(namaProdi).trim()) {
      return res.status(400).json({ success: false, message: 'Kode dan nama program studi wajib diisi.' });
    }
    if (!jenjang || !String(jenjang).trim()) {
      return res.status(400).json({ success: false, message: 'Jenjang program studi wajib diisi.' });
    }

    const duplicate = db.prepare('SELECT id FROM prodi WHERE kode_prodi = ? AND id <> ?').get(String(kodeProdi).trim(), id);
    if (duplicate) {
      return res.status(409).json({ success: false, message: `Kode program studi ${kodeProdi} sudah dipakai program studi lain.` });
    }

    const stmt = db.prepare(`
      UPDATE prodi
      SET kode_prodi = ?, nama_prodi = ?, jenjang = ?, akreditasi = ?, no_sk_akreditasi = ?, kaprodi = ?, nip_kaprodi = ?, kuota_mahasiswa = ?, status = coalesce(?, status), deskripsi = ?
      WHERE id = ?
    `);
    // Audit 21 Oktober 2026 (Simulasi Proses A–Z): normalisasi nilai agar
    // `undefined` tidak menyebabkan HTTP 500 saat pengikatan parameter SQLite.
    stmt.run(
      String(kodeProdi).trim(),
      String(namaProdi).trim(),
      jenjang,
      toText(akreditasi, '-'),
      toText(noSkAkreditasi),
      toText(kaprodi),
      toText(nipKaprodi),
      toNumber(kuotaMahasiswa, 100),
      status ? String(status) : null,
      toText(deskripsi),
      id
    );
    res.json({ success: true, message: 'Data program studi berhasil diperbarui di database.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. KONFIGURASI TAHAPAN & REGULASI JENJANG
// ==========================================
router.get('/tahapan', requireRole(['superadmin', 'admin', 'koorprodi']), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM tahapan_aturan').all();
    const result = {};
    for (const r of rows) {
      result[r.jenjang] = {
        jenjangLabel: r.jenjang_label,
        totalTahap: r.total_tahap,
        tahapanList: JSON.parse(r.tahapan_json || '[]'),
        rules: JSON.parse(r.rules_json || '{}')
      };
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/tahapan/:jenjang', requireRole(['superadmin']), (req, res) => {
  try {
    const { jenjang } = req.params;
    const { rules, tahapanList } = req.body;

    const existing = db.prepare('SELECT * FROM tahapan_aturan WHERE jenjang = ?').get(jenjang);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Konfigurasi jenjang ${jenjang} tidak ditemukan.` });
    }
    if (!rules || typeof rules !== 'object') {
      return res.status(400).json({ success: false, message: 'Objek `rules` wajib dikirim.' });
    }

    // Audit 21 Oktober 2026 (Simulasi Proses A–Z): `tahapanList: []` yang
    // lolos ke UPDATE akan MENGHAPUS seluruh template tahapan jenjang
    // tersebut secara permanen (tahapan_json = '[]') tanpa konfirmasi,
    // tanpa jejak audit, dan tanpa możliność pemulihan otomatis. Templates
    //-empty ditolak; `coalesce(?, tahapan_json)` tetap mempertahankan nilai
    // lama bila tahapanList tidak dikirim sama sekali.
    let tahapanJson = null;
    if (tahapanList !== undefined && tahapanList !== null) {
      if (!Array.isArray(tahapanList)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_TAHAPAN_LIST',
          message: '`tahapanList` harus berupa larik (array) berisi daftar tahapan.'
        });
      }
      if (tahapanList.length === 0) {
        return res.status(400).json({
          success: false,
          code: 'EMPTY_TAHAPAN_LIST',
          message:
            'Daftar tahapan kosong ditolak. Mengirim `tahapanList: []` akan menghapus ' +
            'seluruh template tahapan jenjang ini secara permanen. Jangan kirim field ini bila template saat ini ingin dipertahankan.'
        });
      }
      tahapanJson = JSON.stringify(tahapanList);
    }

    const stmt = db.prepare(`
      UPDATE tahapan_aturan
      SET rules_json = ?, tahapan_json = coalesce(?, tahapan_json)
      WHERE jenjang = ?
    `);
    stmt.run(JSON.stringify(rules), tahapanJson, jenjang);

    // Audit 21 Oktober 2026: perubahan master data harus dapat dilacak.
    try {
      db.prepare('INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)').run(
        req.user?.id || 'system',
        'UPDATE_TAHAPAN_JENJANG',
        `Konfigurasi tahapan jenjang ${jenjang} diperbarui (rules: ${Object.keys(rules).length} aturan, tahapan: ${tahapanJson ? JSON.parse(tahapanJson).length : 'dipertahankan'})`
      );
    } catch (_) {}

    res.json({ success: true, message: `Konfigurasi tahapan jenjang ${jenjang} berhasil disimpan ke database.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. KUOTA BIMBINGAN DOSEN
// ==========================================
router.get('/kuota', requireRole(['superadmin', 'admin', 'koorprodi']), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM kuota_dosen ORDER BY nama ASC').all();
    const formatted = rows.map((r) => ({
      ...r,
      kuotaUtama: r.kuota_utama,
      terisiUtama: r.terisi_utama,
      kuotaPendamping: r.kuota_pendamping,
      terisiPendamping: r.terisi_pendamping
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/kuota/:id', requireRole(['superadmin']), (req, res) => {
  try {
    const { id } = req.params;
    const { kuotaUtama, kuotaPendamping, status } = req.body;

    const existing = db.prepare('SELECT id FROM kuota_dosen WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data kuota dosen tidak ditemukan.' });
    }
    if (kuotaUtama === undefined || kuotaPendamping === undefined || Number.isNaN(Number(kuotaUtama)) || Number.isNaN(Number(kuotaPendamping))) {
      return res.status(400).json({ success: false, message: 'Kuota utama dan kuota pendamping wajib berupa angka.' });
    }

    const stmt = db.prepare(`
      UPDATE kuota_dosen
      SET kuota_utama = ?, kuota_pendamping = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(Number(kuotaUtama), Number(kuotaPendamping), status || 'Aman', id);
    res.json({ success: true, message: 'Batas kuota dosen berhasil diperbarui di database.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. MANAJEMEN AKUN PENGGUNA (USERS)
// ==========================================
router.get('/users', requireRole(['superadmin']), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    const formatted = rows.map((r) => {
      let parsedRoles = [r.role];
      if (r.eligible_roles) {
        try {
          const parsed = JSON.parse(r.eligible_roles);
          if (Array.isArray(parsed) && parsed.length > 0) parsedRoles = parsed;
        } catch (_) {}
      }
      // Audit 21 Oktober 2026: hash kata sandi TIDAK BOLEH diserialisasi ke klien.
      // Kolom `password` (salt:hash scrypt) sengaja dihapus dari respons.
      const { password, ...safeRow } = r;
      return {
        ...safeRow,
        nomorInduk: r.nomor_induk,
        lastLogin: r.last_login,
        eligibleRoles: parsedRoles,
        mustChangePassword: Boolean(r.must_change_password)
      };
    });
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk Import Akun Pengguna (Excel Batch Upsert)
router.post('/users/bulk', requireRole(['superadmin']), (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ success: false, message: 'Daftar pengguna untuk impor tidak boleh kosong.' });
    }

    // Audit 21 Oktober 2026: TIDAK ADA lagi kata sandi default seragam.
    // Setiap akun memperoleh kata sandi acak individual; akun yang menyertakan
    // `password` eksplisit memakai nilai tersebut.
    const insertStmt = db.prepare(`
      INSERT INTO users (id, nomor_induk, nama, email, role, jenjang, prodi, password, eligible_roles, status, last_login, credential_epoch, token_version, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, coalesce(?, 'Aktif'), 'Belum pernah login', 1, 1, ?)
      ON CONFLICT(nomor_induk) DO UPDATE SET
        nama = excluded.nama,
        email = excluded.email,
        role = excluded.role,
        jenjang = excluded.jenjang,
        prodi = excluded.prodi,
        eligible_roles = excluded.eligible_roles,
        status = excluded.status,
        token_version = users.token_version + 1
    `);

    let importedCount = 0;
    const generatedPasswords = [];
    for (const u of users) {
      const eligibleJson = JSON.stringify(u.eligibleRoles || [u.role]);
      const explicitPassword = typeof u.password === 'string' && u.password.trim() ? u.password.trim() : null;
      const plainPassword = explicitPassword || generateTemporaryPassword();
      if (!explicitPassword) {
        generatedPasswords.push({ nomorInduk: u.nomorInduk, nama: u.nama, temporaryPassword: plainPassword });
      }
      insertStmt.run(
        u.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        u.nomorInduk,
        u.nama,
        u.email,
        u.role,
        u.jenjang || 'S1',
        u.prodi || 'S-1 Manajemen',
        hashPassword(plainPassword),
        eligibleJson,
        u.status || 'Aktif',
        explicitPassword ? 0 : 1
      );
      importedCount++;
    }

    res.json({
      success: true,
      count: importedCount,
      message: `${importedCount} akun pengguna berhasil diimpor & disinkronkan ke basis data SQLite.`,
      // Kata sandi sementara hanya dikembalikan SATU KALI kepada superadmin.
      temporaryCredentials: generatedPasswords.length > 0 ? generatedPasswords : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/users', requireRole(['superadmin']), (req, res) => {
  try {
    const targetNoInduk = req.body.nomorInduk || req.body.nomor_induk;
    const targetNama = req.body.nama;
    const targetEmail = req.body.email;
    const targetRole = req.body.role;
    const targetJenjang = req.body.jenjang || req.body.strata || 'S1';
    const targetProdi = req.body.prodi || 'S-1 Manajemen';
    const targetId = req.body.id || `usr-${Date.now()}`;

    // Audit 21 Oktober 2026: kata sandi acak individual bila tidak ditentukan.
    // TIDAK ada lagi kata sandi default seragam yang berlaku untuk semua akun.
    const explicitPassword = typeof req.body.password === 'string' && req.body.password.trim() ? req.body.password.trim() : null;
    const plainPassword = explicitPassword || generateTemporaryPassword();

    if (!targetNoInduk || !targetNama || !targetEmail || !targetRole) {
      return res.status(400).json({ success: false, message: 'Nomor induk, nama, email, dan peran wajib diisi.' });
    }

    let eligibleRolesList = req.body.eligibleRoles;
    if (!Array.isArray(eligibleRolesList) || eligibleRolesList.length === 0) {
      eligibleRolesList = [targetRole];
    }
    if (!eligibleRolesList.includes(targetRole)) {
      eligibleRolesList.unshift(targetRole);
    }
    const eligibleRolesJson = JSON.stringify(eligibleRolesList);

    // Audit 21 Oktober 2026 (P0-1): akun yang SUDAH ADA tidak boleh
    // diam-diam mendapat kata sandi acak baru yang dikembalikan sebagai
    // "temporaryPassword" — karena kolom password TIDAK di-update oleh
    // klausa ON CONFLICT, sehingga sandi yang dilaporkan itu TIDAK berlaku
    // dan administrator mendapat informasi yang salah.
    // Akun yang sudah ada: profil diperbarui, kata sandi TIDAK diubah, dan
    // administrator diarahkan memakai endpoint "Reset Kata Sandi".
    const akunTersedia = db
      .prepare('SELECT id FROM users WHERE nomor_induk = ?')
      .get(String(targetNoInduk).trim());

    const defaultHashed = hashPassword(plainPassword);
    const stmt = db.prepare(`
      INSERT INTO users (id, nomor_induk, nama, email, role, jenjang, prodi, password, eligible_roles, status, last_login, credential_epoch, token_version, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Aktif', 'Belum pernah login', 1, 1, ?)
      ON CONFLICT(nomor_induk) DO UPDATE SET
        nama = excluded.nama,
        email = excluded.email,
        role = excluded.role,
        jenjang = excluded.jenjang,
        prodi = excluded.prodi,
        eligible_roles = excluded.eligible_roles,
        status = 'Aktif',
        token_version = users.token_version + 1
    `);
    stmt.run(
      String(targetId),
      String(targetNoInduk).trim(),
      String(targetNama).trim(),
      String(targetEmail).trim(),
      String(targetRole).trim(),
      String(targetJenjang).trim(),
      String(targetProdi).trim(),
      String(defaultHashed),
      eligibleRolesJson,
      explicitPassword ? 0 : 1
    );
    res.json({
      success: true,
      message: akunTersedia
        ? `Data akun ${targetNama} (${targetNoInduk}) berhasil diperbarui. Kata sandi TIDAK diubah — gunakan "Reset Kata Sandi" untuk menerbitkan kata sandi sementara baru.`
        : `Akun baru ${targetNama} berhasil disimpan ke database SQLite.`,
      // Kata sandi sementara dikembalikan satu kali HANYA bila akun benar-benar
      // baru dibuat (atau bila sistem yang menetapkannya).
      temporaryPassword: akunTersedia ? undefined : (explicitPassword ? undefined : plainPassword),
      mustChangePassword: akunTersedia ? undefined : (explicitPassword ? 0 : 1),
      akunBaru: !akunTersedia
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/users/:id', requireRole(['superadmin']), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM users WHERE id = ? OR nomor_induk = ?').get(id, id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Akun pengguna tidak ditemukan.' });
    }
    const nomorInduk = req.body.nomorInduk || req.body.nomor_induk || null;
    const nama = req.body.nama || null;
    const email = req.body.email || null;
    const role = req.body.role || null;
    const jenjang = req.body.jenjang || req.body.strata || null;
    const prodi = req.body.prodi || null;
    const status = req.body.status || null;
    const eligibleRoles = req.body.eligibleRoles ? JSON.stringify(req.body.eligibleRoles) : null;

    // Audit 21 Oktober 2026: bila peran atau status berubah, token_version
    // dinaikkan sehingga seluruh token sesi lama (dengan peran lama) langsung
    // ditolak pada request berikutnya.
    const privilegeChanged =
      (role && role !== existing.role) ||
      (status && String(status).toLowerCase() !== String(existing.status || '').toLowerCase());

    const stmt = db.prepare(`
      UPDATE users
      SET nomor_induk = coalesce(?, nomor_induk),
          nama = coalesce(?, nama),
          email = coalesce(?, email),
          role = coalesce(?, role),
          jenjang = coalesce(?, jenjang),
          prodi = coalesce(?, prodi),
          eligible_roles = coalesce(?, eligible_roles),
          status = coalesce(?, status),
          token_version = token_version + ${privilegeChanged ? 1 : 0}
      WHERE id = ? OR nomor_induk = ?
    `);
    stmt.run(nomorInduk, nama, email, role, jenjang, prodi, eligibleRoles, status, id, id);

    if (privilegeChanged) {
      try {
        db.prepare(`
          INSERT INTO audit_log (user_id, action, details)
          VALUES (?, 'USER_PRIVILEGE_CHANGED', ?)
        `).run(
          req.user?.id || 'superadmin',
          `Hak akses akun ${existing.id} diubah (peran: ${existing.role} -> ${role || existing.role}, status: ${existing.status} -> ${status || existing.status}). Seluruh sesi lama dicabut.`
        );
      } catch (_) {}
    }

    res.json({
      success: true,
      message: privilegeChanged
        ? 'Data akun berhasil diperbarui. Seluruh sesi aktif akun ini telah dicabut.'
        : 'Data akun pengguna berhasil diperbarui di database.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/users/:id', requireRole(['superadmin']), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM users WHERE id = ? OR nomor_induk = ?').get(id, id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Akun pengguna tidak ditemukan.' });
    }

    // Audit 21 Oktober 2026 (Simulasi Proses A–Z): menghapus akun tanpa
    // membersihkan data turunan menyisakan baris yatim (orphan) yang
    // melanggar foreign key (storage_files.uploader_id, bimbingan_log,
    // publikasi, naskah_versi, tugas_akhir.mahasiswa_id, tahap_status).
    // Akun yang masih memiliki data akademik TIDAK boleh dihapus; Operator
    // dapat menonaktifkan akun (status = 'Non-Aktif') sebagai gantinya.
    const userId = existing.id;
    const dependensi = [
      ['storage_files', userId, 'uploader_id'],
      ['bimbingan_log', userId, 'mahasiswa_id'],
      ['publikasi', userId, 'mahasiswa_id'],
      ['naskah_versi', userId, 'uploader_id'],
      ['tugas_akhir', userId, 'mahasiswa_id']
    ];
    const rincian = [];
    for (const [tabel, nilai, kolom] of dependensi) {
      try {
        const n = db.prepare(`SELECT count(*) AS c FROM ${tabel} WHERE ${kolom} = ?`).get(nilai).c;
        if (n > 0) rincian.push(`${n} baris ${tabel}`);
      } catch (_) {
        // Kolom/kolm tabel tidak tersedia — abaikan.
      }
    }
    if (rincian.length) {
      return res.status(409).json({
        success: false,
        code: 'USER_HAS_DEPENDENT_RECORDS',
        message:
          `Akun masih memiliki data akademik (${rincian.join(', ')}) dan tidak dapat dihapus. ` +
          'Nonaktifkan akun (status = Non-Aktif) bila akun Simply sudah tidak digunakan.',
        dependensi: rincian
      });
    }

    db.prepare('DELETE FROM users WHERE id = ? OR nomor_induk = ?').run(id, id);

    // Audit 21 Oktober 2026: penghapusan akun wajib tercatat.
    try {
      db.prepare('INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)').run(
        req.user?.id || 'system',
        'DELETE_USER',
        `Akun pengguna ${existing.id} (${id}) dihapus oleh ${req.user?.id || 'system'}`
      );
    } catch (_) {}

    res.json({ success: true, message: 'Akun pengguna berhasil dihapus dari database.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/users/:id/reset-password', requireRole(['superadmin']), (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT nama FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Akun pengguna tidak ditemukan.' });
    }

    // Terbitkan kata sandi sementara acak yang kuat (bukan kata sandi default seragam),
    // sehingga tidak ada kata sandi yang dapat diprediksi/berulang antar akun.
    const tempPassword = generateTemporaryPassword();
    // Setel kata sandi sementara DAN wajibkan penggantian pada login berikutnya.
    // token_version dinaikkan => seluruh sesi lama akun ini ikut mati.
    db.prepare('UPDATE users SET password = ?, must_change_password = 1, token_version = token_version + 1 WHERE id = ?').run(hashPassword(tempPassword), id);

    try {
      db.prepare(`
        INSERT INTO audit_log (user_id, action, details)
        VALUES (?, 'RESET_PASSWORD', ?)
      `).run(req.user?.id || 'superadmin', `Reset kata sandi akun ${user.nama} (${id}) oleh superadmin`);
    } catch (_) {}

    // Kata sandi sementara dikembalikan SEKALI kepada superadmin yang melakukan reset.
    res.json({
      success: true,
      temporaryPassword: tempPassword,
      message: `Kata sandi akun ${user.nama} berhasil direset. Sampaikan kata sandi sementara kepada pengguna dan minta segera menggantinya.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 6. MANAJEMEN CADANGAN BASIS DATA (DISASTER RECOVERY)
// ==========================================
router.get('/backups', requireRole(['superadmin']), (req, res) => {
  try {
    const backups = listDatabaseBackups();
    res.json({ success: true, data: backups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/backup', requireRole(['superadmin']), (req, res) => {
  try {
    const triggerSource = `SUPERADMIN_${req.user?.id || req.user?.nomorInduk || 'MANUAL'}`;
    const result = createDatabaseBackup(triggerSource);
    res.json({
      success: true,
      data: result,
      message: `Snapshot cadangan ${result.filename} (${result.sizeFormatted}) berhasil dibuat.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/backups/:filename/verify', requireRole(['superadmin']), (req, res) => {
  try {
    // Audit 21 Oktober 2026: basename() mencegah path traversal pada nama berkas.
    const filename = path.basename(String(req.params.filename || ''));
    const report = verifyBackupIntegrity(filename);
    res.json({ success: true, data: report });
  } catch (error) {
    // Simulasi Proses A–Z: berkas yang tidak ada / bukan basis data harus
    // dibalas dengan status yang benar (404 / 422), bukan 500.
    const status = Number(error.status || 500);
    res.status(status).json({
      success: false,
      code: error.code || undefined,
      message: error.message
    });
  }
});

export default router;
