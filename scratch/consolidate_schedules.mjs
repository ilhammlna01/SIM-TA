import { db } from '../server/database/db.js';

try {
  // Hapus Test Admin
  db.prepare("DELETE FROM notifications WHERE title = 'Test Admin'").run();

  // Bersihkan jadwal duplikat, simpan hanya yang terbaru untuk setiap judul jadwal
  const jadwalNotifs = db.prepare("SELECT id, title, created_at FROM notifications WHERE title LIKE 'Jadwal Baru Diterbitkan%' ORDER BY created_at DESC").all();
  const seenTitles = new Set();
  const idsToDelete = [];

  for (const j of jadwalNotifs) {
    if (seenTitles.has(j.title)) {
      idsToDelete.push(j.id);
    } else {
      seenTitles.add(j.title);
    }
  }

  if (idsToDelete.length > 0) {
    const placeholders = idsToDelete.map(() => '?').join(',');
    db.prepare(`DELETE FROM notifications WHERE id IN (${placeholders})`).run(...idsToDelete);
    console.log(`Dihapus ${idsToDelete.length} notifikasi jadwal pengumuman duplikat.`);
  }

  // Cek kembali notifikasi Fikri Haikal
  const resFikri = db.prepare(`
    SELECT title, type, user_id, role, created_at 
    FROM notifications 
    WHERE (role = 'semua' AND user_id IS NULL) OR user_id = '210211100219'
    ORDER BY created_at DESC
  `).all();

  console.log(`\nNotifikasi Fikri Haikal (210211100219) setelah konsolidasi: ${resFikri.length}`);
  console.log(JSON.stringify(resFikri, null, 2));

} catch (err) {
  console.error(err);
}
