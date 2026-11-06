/**
 * Pembersihan Akun & Data Uji — SIM-TA FEB UTM
 *
 * Menghapus akun-akun uji yang dibuat oleh skrip pengujian (simulasi A–Z,
 * uji rubrik, uji business process) beserta seluruh data turunannya, sehingga
 * basis data tidak menumpuk dan pelanggaran foreign key tetap bersih.
 *
 * Jalankan: node scripts/cleanup_test_accounts.mjs
 */

import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/sim_ta_feb_utm.db');
db.exec('PRAGMA busy_timeout = 5000');
db.exec('PRAGMA foreign_keys = OFF');

// Pola akun uji: NIM berawalan 1999 (khusus uji) atau nama berawalan
// "Simulasi"/"Uji " yang dibuat skrip pengujian.
const akunUji = db
  .prepare(
    `SELECT id, nomor_induk, nama FROM users
      WHERE nomor_induk LIKE '1999%' OR nama LIKE 'Simulasi %' OR nama LIKE 'Uji %'`
  )
  .all();

console.log(`Akun uji ditemukan: ${akunUji.length}`);

const ids = akunUji.map((a) => a.id);
const nims = akunUji.map((a) => a.nomor_induk).filter(Boolean);

if (ids.length) {
  const phId = ids.map(() => '?').join(',');
  const phNim = nims.length ? nims.map(() => '?').join(',') : "''";

  const langkah = [
    ['komentar_naskah', `naskah_versi_id IN (SELECT id FROM naskah_versi WHERE nim IN (${phNim}))`, nims],
    ['naskah_versi', `nim IN (${phNim})`, nims],
    ['publikasi', `nim IN (${phNim})`, nims],
    ['bimbingan_log', `nim IN (${phNim})`, nims],
    ['koreksi_penguji', `mhs_nim IN (${phNim})`, nims],
    ['tahap_status', `tugas_akhir_id IN (SELECT id FROM tugas_akhir WHERE nim IN (${phNim}))`, nims],
    ['tugas_akhir', `nim IN (${phNim})`, nims],
    ['pendaftaran_ujian', `nim IN (${phNim})`, nims],
    ['storage_files', `uploader_nim IN (${phNim})`, nims],
    ['notifications', `user_id IN (${phId})`, ids],
    ['audit_log', `user_id IN (${phId})`, ids],
    ['users', `id IN (${phId})`, ids]
  ];

  for (const [tabel, where, params] of langkah) {
    try {
      const info = db.prepare(`DELETE FROM ${tabel} WHERE ${where}`).run(...params);
      if (info.changes > 0) console.log(`  ${tabel}: ${info.changes} baris dihapus`);
    } catch (e) {
      console.log(`  ${tabel}: dilewati (${e.message.slice(0, 60)})`);
    }
  }
}

db.exec('PRAGMA foreign_keys = ON');
const fk = db.prepare('PRAGMA foreign_key_check').all();
console.log(`\nPelanggaran foreign key: ${fk.length}`);
console.log(`Sisa akun uji: ${db.prepare("SELECT count(*) c FROM users WHERE nomor_induk LIKE '1999%'").get().c}`);
db.close();
