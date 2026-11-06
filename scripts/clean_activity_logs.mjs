/**
 * Skrip Pembersihan Riwayat Kegiatan & Log Aktivitas — SIM-TA FEB UTM
 *
 * Membersihkan:
 *  - audit_log (jejak forensik & aktivitas sistem)
 *  - notifications (seluruh notifikasi in-app semua akun)
 *  - email_logs (riwayat pengiriman email sistem)
 *  - users.last_login (direset ke 'Belum pernah login')
 *
 * Disertai pencadangan otomatis (safety backup) sebelum penghapusan.
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.resolve('data/sim_ta_feb_utm.db');
const BACKUP_DIR = path.resolve('backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 1. Buat salinan cadangan sebelum operasi
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `sim_ta_pre_activity_cleanup_${timestamp}.db`);
fs.copyFileSync(DB_PATH, backupPath);
console.log(`[Safety Backup] Cadangan basis data dibuat di: ${backupPath}`);

// 2. Buka basis data
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA busy_timeout = 5000');
db.exec('PRAGMA foreign_keys = ON');

// 3. Hitung jumlah record sebelum dibersihkan
const countAudit = db.prepare('SELECT COUNT(*) as c FROM audit_log').get().c;
const countNotif = db.prepare('SELECT COUNT(*) as c FROM notifications').get().c;
const countEmail = db.prepare('SELECT COUNT(*) as c FROM email_logs').get().c;
const countUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

console.log('\n--- DATA SEBELUM PEMBERSIHAN ---');
console.log(`- audit_log     : ${countAudit} baris`);
console.log(`- notifications : ${countNotif} baris`);
console.log(`- email_logs    : ${countEmail} baris`);
console.log(`- total users   : ${countUsers} akun`);

// 4. Lakukan pembersihan dalam transaksi tunggal
db.exec('BEGIN TRANSACTION');
try {
  const resAudit = db.prepare('DELETE FROM audit_log').run();
  try {
    db.prepare("DELETE FROM sqlite_sequence WHERE name = 'audit_log'").run();
  } catch (_) {
    // sqlite_sequence mungkin tidak ada bila tidak memakai auto-increment internal
  }

  const resNotif = db.prepare('DELETE FROM notifications').run();
  const resEmail = db.prepare('DELETE FROM email_logs').run();
  const resUsers = db.prepare("UPDATE users SET last_login = 'Belum pernah login'").run();

  db.exec('COMMIT');
  console.log('\n--- HASIL PEMBERSIHAN ---');
  console.log(`✅ audit_log     : ${resAudit.changes} baris dihapus`);
  console.log(`✅ notifications : ${resNotif.changes} baris dihapus`);
  console.log(`✅ email_logs    : ${resEmail.changes} baris dihapus`);
  console.log(`✅ last_login    : ${resUsers.changes} akun di-reset ke 'Belum pernah login'`);
} catch (err) {
  db.exec('ROLLBACK');
  console.error('[Error] Transaksi gagal dan di-rollback:', err.message);
  process.exit(1);
}

// 5. Verifikasi Integritas Relasional
const fkViolations = db.prepare('PRAGMA foreign_key_check').all();
console.log(`\nIntegritas Relasional (Foreign Key Check): ${fkViolations.length === 0 ? '100% AMAN (0 pelanggaran)' : fkViolations.length + ' pelanggaran'}`);

// 6. Optimasi Penyimpanan Basis Data (VACUUM)
db.exec('VACUUM');
console.log('✅ Basis data berhasil di-VACUUM (ruang disk dioptimalkan).');

db.close();
console.log('\nPembersihan riwayat kegiatan selesai dengan sukses!\n');

