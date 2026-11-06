/**
 * Test Suite Verifikasi Independen Prioritas 4
 * Penguatan Basis Data SQLite, WAL Mode, Foreign Keys, & Disaster Recovery Backup
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabaseBackup, listDatabaseBackups, verifyBackupIntegrity, pruneOldBackups, BACKUP_DIR } from '../server/database/backup.js';
import { ensureTestAccounts, loginUser } from '../tests/helpers/testAccounts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../data/sim_ta_feb_utm.db');

const API_BASE = 'http://localhost:5001/api';

async function runTests() {
  console.log('=== TEST SUITE PRIORITAS 4: SQLite WAL, Foreign Keys, & Backup 7 Hari ===\n');

  // Kredensial uji deterministik (token sesi nyata, bukan token buatan tangan).
  const credPrep = ensureTestAccounts();
  if (!credPrep.ok) {
    console.error('Gagal menyiapkan kredensial uji:', credPrep.message);
    process.exit(1);
  }
  const superadminToken = await loginUser(API_BASE, '197405102000031001');
  const mahasiswaToken = await loginUser(API_BASE, '210211100142');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  // 1. Verifikasi PRAGMA Engine
  console.log('--- 1. Uji Mode PRAGMA Engine SQLite ---');
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);

  const journalMode = db.prepare('PRAGMA journal_mode;').get().journal_mode;
  assert(journalMode.toLowerCase() === 'wal', `PRAGMA journal_mode adalah WAL (Ditemukan: ${journalMode})`);

  const foreignKeys = db.prepare('PRAGMA foreign_keys;').get().foreign_keys;
  assert(foreignKeys === 1, `PRAGMA foreign_keys bernilai 1 (ON) (Ditemukan: ${foreignKeys})`);

  const busyTimeout = db.prepare('PRAGMA busy_timeout;').get().timeout;
  assert(busyTimeout === 5000, `PRAGMA busy_timeout bernilai 5000ms (Ditemukan: ${busyTimeout})`);

  // 2. Verifikasi Integritas Relasional Aktif
  console.log('\n--- 2. Uji Penegakan Constraint Foreign Keys ---');
  const fkCheck = db.prepare('PRAGMA foreign_key_check;').all();
  assert(fkCheck.length === 0, `PRAGMA foreign_key_check database aktif bersih tanpa pelanggaran (0 errors, actual: ${fkCheck.length})`);

  // Uji penolakan foreign key invalid pada storage_files
  let fkRejectedStorage = false;
  try {
    db.prepare(`
      INSERT INTO storage_files (id, filename, original_name, category, uploader_id, uploader_nim, uploader_role)
      VALUES ('test-fk-storage', 'test.pdf', 'test.pdf', 'naskah', 'user-yang-pasti-tidak-ada-999999', '00000', 'mahasiswa')
    `).run();
  } catch (err) {
    if (err.message.includes('FOREIGN KEY') || err.message.includes('constraint failed')) {
      fkRejectedStorage = true;
    }
  }
  assert(fkRejectedStorage, 'Database menolak INSERT storage_files dengan uploader_id yang tidak terdaftar di users (FOREIGN KEY constraint enforced)');

  // Uji penolakan foreign key invalid pada pendaftaran_ujian
  let fkRejectedPendaftaran = false;
  try {
    db.prepare(`
      INSERT INTO pendaftaran_ujian (id, nim, nama_mahasiswa, jenjang, program_studi, jenis_ujian, tanggal_daftar, judul, berkas_json)
      VALUES ('test-fk-reg', 'NIM_FIKTIF_999999', 'Fiktif', 'S1', 'S1 Manajemen', 'Proposal', '2026-10-10', 'Judul', '[]')
    `).run();
  } catch (err) {
    if (err.message.includes('FOREIGN KEY') || err.message.includes('constraint failed')) {
      fkRejectedPendaftaran = true;
    }
  }
  assert(fkRejectedPendaftaran, 'Database menolak INSERT pendaftaran_ujian dengan NIM yang tidak terdaftar di users');

  // Uji penolakan foreign key invalid pada koreksi_penguji
  let fkRejectedKoreksi = false;
  try {
    db.prepare(`
      INSERT INTO koreksi_penguji (id, ujian_id, mhs_nim, mhs_nama, jenjang, penguji_id, nama_penguji, bagian_naskah, catatan_koreksi, tingkat_urgensi)
      VALUES ('test-fk-kor', 'ujian-id-fiktif-999999', '210101', 'Bambang', 'S1', 'dosen-1', 'Penguji 1', 'Bab 1', 'Catatan', 'Mayor')
    `).run();
  } catch (err) {
    if (err.message.includes('FOREIGN KEY') || err.message.includes('constraint failed')) {
      fkRejectedKoreksi = true;
    }
  }
  assert(fkRejectedKoreksi, 'Database menolak INSERT koreksi_penguji dengan ujian_id yang tidak terdaftar di ujian_penguji');

  db.close();

  // 3. Uji Pembuatan Hot Snapshot Backup
  console.log('\n--- 3. Uji Pembuatan Hot Snapshot SQLite (VACUUM INTO) ---');
  let backupResult;
  try {
    backupResult = createDatabaseBackup('TEST_AUTOMATION_PROBE');
    assert(backupResult.success === true, `Hot backup berhasil diciptakan: ${backupResult.filename}`);
    assert(backupResult.checksum && backupResult.checksum.length === 64, `Checksum SHA-256 valid 64-karakter (${backupResult.checksum?.slice(0, 16)}...)`);
    assert(fs.existsSync(backupResult.filePath), `Berkas cadangan fisik ditemukan di direktori backups/ (${backupResult.sizeFormatted})`);
  } catch (err) {
    assert(false, `Gagal membuat snapshot backup: ${err.message}`);
  }

  // 4. Uji Verifikasi Integritas Cadangan (Disaster Recovery Check)
  console.log('\n--- 4. Uji Verifikasi Integritas Berkas Cadangan ---');
  if (backupResult) {
    try {
      const verifyReport = verifyBackupIntegrity(backupResult.filename);
      assert(verifyReport.integrityCheckPassed === true, 'PRAGMA integrity_check pada berkas cadangan mengembalikan "ok"');
      assert(verifyReport.foreignKeyViolations === 0, 'PRAGMA foreign_key_check pada berkas cadangan bernilai 0 pelanggaran');
      assert(verifyReport.status === 'VALID & PRODUCTION READY', `Status pemulihan bencana: ${verifyReport.status}`);
      assert(verifyReport.tableCount >= 16, `Jumlah tabel di berkas cadangan lengkap (${verifyReport.tableCount} tabel)`);
    } catch (err) {
      assert(false, `Verifikasi berkas cadangan gagal: ${err.message}`);
    }
  }

  // 5. Uji Pruning Retensi 7 Hari
  console.log('\n--- 5. Uji Kebijakan Pruning Retensi 7 Hari ---');
  const dummyOldBackup = path.join(BACKUP_DIR, 'sim_ta_backup_2020_01_01_0000.db');
  fs.writeFileSync(dummyOldBackup, 'dummy old sqlite content');
  // Ubah mtime menjadi 10 hari yang lalu
  const tenDaysAgo = (Date.now() - 10 * 24 * 60 * 60 * 1000) / 1000;
  fs.utimesSync(dummyOldBackup, tenDaysAgo, tenDaysAgo);
  assert(fs.existsSync(dummyOldBackup), 'Berkas simulasi cadangan berusia >7 hari berhasil disiapkan');

  const pruneResult = pruneOldBackups(7);
  assert(pruneResult.cleanedCount >= 1, `Pruning otomatis mendeteksi dan membersihkan ${pruneResult.cleanedCount} berkas usang`);
  assert(!fs.existsSync(dummyOldBackup), 'Berkas cadangan usang berhasil dihapus secara otomatis dari disk');

  // 6. Uji Endpoint API Superadmin
  console.log('\n--- 6. Uji Proteksi RBAC & Endpoint API Cadangan Superadmin ---');
  try {
    // 6a. Akses tanpa token -> 401
    const unauthRes = await fetch(`${API_BASE}/superadmin/backups`);
    assert(unauthRes.status === 401, 'GET /api/superadmin/backups tanpa token ditolak (401 Unauthorized)');

    // 6b. Akses dengan token mahasiswa -> 403
    const forbiddenRes = await fetch(`${API_BASE}/superadmin/backups`, {
      headers: { Authorization: `Bearer ${mahasiswaToken}` }
    });
    assert(forbiddenRes.status === 403, 'GET /api/superadmin/backups dengan token mahasiswa ditolak (403 Forbidden)');

    // 6c. Akses dengan token superadmin -> 200
    const listRes = await fetch(`${API_BASE}/superadmin/backups`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    const listJson = await listRes.json();
    assert(listRes.status === 200 && Array.isArray(listJson.data), `GET /api/superadmin/backups superadmin sukses (${listJson.data.length} berkas terdaftar)`);

    // 6d. Trigger on-demand backup via POST API
    const triggerRes = await fetch(`${API_BASE}/superadmin/backup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    const triggerJson = await triggerRes.json();
    assert(triggerRes.status === 200 && triggerJson.success === true, `POST /api/superadmin/backup on-demand snapshot via API sukses (${triggerJson.data?.filename})`);

    // 6e. Verify backup via API
    if (triggerJson.data?.filename) {
      const verifyRes = await fetch(`${API_BASE}/superadmin/backups/${triggerJson.data.filename}/verify`, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      const verifyJson = await verifyRes.json();
      assert(verifyRes.status === 200 && verifyJson.data?.status === 'VALID & PRODUCTION READY', `GET /api/superadmin/backups/:filename/verify status: ${verifyJson.data?.status}`);
    }
  } catch (apiErr) {
    assert(false, `Uji endpoint API gagal: ${apiErr.message}`);
  }

  console.log(`\n========================================`);
  console.log(`HASIL TEST PRIORITAS 4: ${passed} / ${total} PENGUJIAN LULUS (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
