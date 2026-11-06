/**
 * Pembersihan Baris Yatim (Orphan) — SIM-TA FEB UTM
 *
 * Menghapus baris pada tabel anak yang induknya sudah tidak ada, sehingga
 * `PRAGMA foreign_key_check` kembali bersih dan salinan cadangan tidak lagi
 * berstatus "pelanggaran foreign key".
 *
 * Jalankan: node scripts/cleanup_orphans.mjs
 */

import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/sim_ta_feb_utm.db');
db.exec('PRAGMA busy_timeout = 5000');
db.exec('PRAGMA foreign_keys = OFF');

const sebelum = db.prepare('PRAGMA foreign_key_check').all();
console.log(`Pelanggaran FK sebelum: ${sebelum.length}`);

const pairs = [
  ['komentar_naskah', 'naskah_versi', 'id'],
  ['tahap_status', 'tugas_akhir', 'id'],
  ['bimbingan_log', 'tugas_akhir', 'id'],
  ['naskah_versi', 'tugas_akhir', 'id'],
  ['publikasi', 'tugas_akhir', 'id'],
  ['koreksi_penguji', 'ujian_penguji', 'id']
];

// Pemetaan kolom FK per tabel anak (tidak boleh menebak, kolom berbeda).
const FK_COL = {
  komentar_naskah: 'naskah_versi_id',
  tahap_status: 'tugas_akhir_id',
  bimbingan_log: 'tugas_akhir_id',
  naskah_versi: 'tugas_akhir_id',
  publikasi: 'tugas_akhir_id',
  koreksi_penguji: 'ujian_id'
};

let total = 0;
for (const [child, parent, pk] of pairs) {
  try {
    const cols = new Set(db.prepare(`PRAGMA table_info("${child}")`).all().map((c) => c.name));
    const fkCol = FK_COL[child];
    if (!fkCol || !cols.has(fkCol)) continue;
    const colsParent = new Set(db.prepare(`PRAGMA table_info("${parent}")`).all().map((c) => c.name));
    const parentCol = colsParent.has('id') ? 'id' : 'nomor_induk';
    const info = db
      .prepare(
        `DELETE FROM "${child}" WHERE ${fkCol} IS NOT NULL AND ${fkCol} NOT IN (SELECT ${parentCol} FROM "${parent}")`
      )
      .run();
    if (info.changes > 0) {
      console.log(`  ${child}: ${info.changes} baris yatim dihapus (induk ${parent}.${parentCol})`);
      total += info.changes;
    }
  } catch (e) {
    console.log(`  ${child}: dilewati (${e.message})`);
  }
}

// Orfan pada tabel yang induknya adalah users
for (const [child, col] of [
  ['storage_files', 'uploader_id'],
  ['naskah_versi', 'uploader_id'],
  ['bimbingan_log', 'mahasiswa_id'],
  ['publikasi', 'mahasiswa_id'],
  ['tugas_akhir', 'mahasiswa_id']
]) {
  try {
    const cols = new Set(db.prepare(`PRAGMA table_info("${child}")`).all().map((c) => c.name));
    if (!cols.has(col)) continue;
    const info = db
      .prepare(`DELETE FROM "${child}" WHERE ${col} IS NOT NULL AND ${col} NOT IN (SELECT id FROM users)`)
      .run();
    if (info.changes > 0) {
      console.log(`  ${child}: ${info.changes} baris yatim dihapus (induk users.id via ${col})`);
      total += info.changes;
    }
  } catch (e) {
    console.log(`  ${child}: dilewati (${e.message})`);
  }
}

db.exec('PRAGMA foreign_keys = ON');
const sesudah = db.prepare('PRAGMA foreign_key_check').all();
console.log(`\nBaris yatim dihapus: ${total}`);
console.log(`Pelanggaran FK sesudah: ${sesudah.length}`);
db.close();
