/**
 * Pembersihan residu pengujian — naskah versi & komentar yang menumpuk
 * selama rangkaian uji. Aman untuk lingkungan verifikasi.
 */

import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/sim_ta_feb_utm.db');
db.exec('PRAGMA busy_timeout = 5000');
db.exec('PRAGMA foreign_keys = OFF');

// Naskah versi uji: keterangan yang mengandung penanda pengujian.
const{yyyy} = { yyyy: 0 };
const target = db
  .prepare(
    `SELECT id FROM naskah_versi
      WHERE keterangan LIKE '%Uji%' OR keterangan LIKE '%uji%' OR keterangan LIKE '%Diagnostik%'`
  )
  .all()
  .map((r) => r.id);

if (target.length) {
  const ph = target.map(() => '?').join(',');
  const k = db.prepare(`DELETE FROM komentar_naskah WHERE naskah_versi_id IN (${ph})`).run(...target);
  const n = db.prepare(`DELETE FROM naskah_versi WHERE id IN (${ph})`).run(...target);
  console.log(`Naskah versi uji dihapus: ${n.changes} (komentar: ${k.changes})`);
} else {
  console.log('Tidak ada naskah versi uji untuk dihapus.');
}

db.exec('PRAGMA foreign_keys = ON');
console.log(`Sisa naskah_versi: ${db.prepare('SELECT count(*) c FROM naskah_versi').get().c}`);
console.log(`Pelanggaran FK: ${db.prepare('PRAGMA foreign_key_check').all().length}`);
db.close();
