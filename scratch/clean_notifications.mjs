import { db } from '../server/database/db.js';

try {
  // 1. Hapus notifikasi spam hasil UAT test yang duplikat 64x
  const del = db.prepare("DELETE FROM notifications WHERE title = 'ACC Naskah Ujian Diberikan Dosen Pembimbing' AND user_id IS NULL").run();
  console.log(`Dihapus ${del.changes} notifikasi duplikat ACC Ujian hasil simulasi UAT.`);

  // 2. Cek apakah 210211100219 sudah punya notifikasi spesifik
  const existing = db.prepare("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = '210211100219'").get();
  if (existing.cnt === 0) {
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, role, title, message, type, event_category, action_url, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      'notif-takk-1',
      '210211100219',
      'mahasiswa',
      'Verifikasi Portofolio TAKK Disetujui',
      'Akumulasi 82 poin portofolio prestasi (Juara 1 KIBM + Jurnal SINTA 5) telah diverifikasi Koorprodi S1 Manajemen.',
      'success',
      'verifikasi_takk',
      '/persyaratan',
      0,
      new Date(Date.now() - 86400 * 1000).toISOString()
    );

    stmt.run(
      'notif-takk-2',
      '210211100219',
      'mahasiswa',
      'Luaran Wajib Jurnal SINTA 5 Terkonfirmasi',
      'Letter of Acceptance (LoA) Jurnal Aplikasi Manajemen telah divalidasi memenuhi syarat kelulusan Skema 2.',
      'info',
      'publikasi_takk',
      '/publikasi',
      0,
      new Date(Date.now() - 43200 * 1000).toISOString()
    );
    console.log('Menambahkan 2 notifikasi autentik relevan untuk Fikri Haikal (210211100219).');
  }

  // 3. Tampilkan rangkuman akhir tabel
  const summary = db.prepare('SELECT title, role, user_id, COUNT(*) as cnt FROM notifications GROUP BY title, role, user_id').all();
  console.log('\nRangkuman notifikasi saat ini:');
  console.log(JSON.stringify(summary, null, 2));

} catch (err) {
  console.error('Error:', err);
}
