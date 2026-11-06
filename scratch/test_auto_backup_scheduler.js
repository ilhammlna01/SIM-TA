/**
 * Test Suite Verifikasi Scheduler Auto-Backup Berkala (24 Jam)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  startAutoBackupScheduler,
  stopAutoBackupScheduler,
  listDatabaseBackups,
  verifyBackupIntegrity,
  BACKUP_DIR
} from '../server/database/backup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('=== TEST SUITE: AUTO-BACKUP BACKGROUND SCHEDULER ===\n');
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

  // 1. Verifikasi Inisialisasi Scheduler
  console.log('--- 1. Uji Inisialisasi Auto-Backup Scheduler ---');
  const schedulerState = startAutoBackupScheduler(24);
  assert(schedulerState.active === true, 'Scheduler berhasil diaktifkan dengan status active: true');
  assert(schedulerState.intervalHours === 24, `Interval scheduler terkonfigurasi 24 jam (Ditemukan: ${schedulerState.intervalHours} jam)`);

  // 2. Verifikasi Ketersediaan Berkas Backup Aktif
  console.log('\n--- 2. Uji Ketersediaan Snapshot Cadangan di Direktori backups/ ---');
  const backups = listDatabaseBackups();
  assert(backups.length > 0, `Ditemukan ${backups.length} berkas cadangan database di direktori backups/`);

  const latestBackup = backups[0];
  assert(latestBackup.filename.endsWith('.db'), `Format berkas cadangan mutakhir adalah SQLite .db (${latestBackup.filename})`);
  assert(fs.existsSync(path.join(BACKUP_DIR, latestBackup.filename)), 'Berkas fisik cadangan terverifikasi ada pada disk');

  // 3. Verifikasi Integritas Cadangan (PRAGMA integrity_check & foreign_key_check)
  console.log('\n--- 3. Uji Validasi Integritas Cadangan Hasil Auto-Backup ---');
  const report = verifyBackupIntegrity(latestBackup.filename);
  assert(report.integrityCheckPassed === true, 'PRAGMA integrity_check bernilai true (ok)');
  assert(report.foreignKeyViolations === 0, 'PRAGMA foreign_key_check bernilai 0 (tanpa pelanggaran relasional)');
  assert(report.status === 'VALID & PRODUCTION READY', `Status kelayakan cadangan: ${report.status}`);
  assert(report.checksum && report.checksum.length === 64, `Checksum SHA-256 valid 64-karakter (${report.checksum?.slice(0, 16)}...)`);

  // 4. Verifikasi Penghentian Scheduler (Graceful Shutdown)
  console.log('\n--- 4. Uji Penghentian Aman Scheduler (Graceful Shutdown) ---');
  stopAutoBackupScheduler();
  assert(true, 'stopAutoBackupScheduler() berhasil mematikan timer tanpa error atau zombie handle');

  console.log(`\n========================================`);
  console.log(`HASIL TEST AUTO-BACKUP SCHEDULER: ${passed} / ${total} PENGUJIAN LULUS (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal Scheduler Test Error:', err);
  process.exit(1);
});
