/**
 * In-App Notification & Real-Time Communication Service - SIM Tugas Akhir FEB UTM
 * Mengelola antrean notifikasi in-app real-time (Server-Sent Events / SSE) dan persistensi basis data SQLite.
 */

import { db } from '../database/db.js';

// Kumpulan klien koneksi real-time Server-Sent Events (SSE)
const sseClients = new Set();

/**
 * Inisialisasi data notifikasi awal jika tabel masih kosong
 */
function seedInitialNotificationsIfEmpty() {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM notifications').get().count;
    if (count > 0) return;

    const initialNotifications = [
      {
        id: 'notif-1',
        user_id: 'usr-mhs-1',
        role: 'mahasiswa',
        title: 'Naskah Tugas Akhir Disetujui (ACC)',
        message: 'Dosen Pembimbing I (Dr. Dra. Hj. Iriani Ismail, M.M.) telah menyetujui naskah untuk Sidang Skripsi.',
        type: 'success',
        event_category: 'persetujuan_naskah',
        action_url: '/mahasiswa/ujian',
        is_read: 0,
        created_at: new Date(Date.now() - 3600 * 1000).toISOString()
      },
      {
        id: 'notif-2',
        user_id: 'usr-mhs-1',
        role: 'mahasiswa',
        title: 'Catatan Koreksi Dewan Penguji',
        message: 'Dr. Faidal, S.E., M.M. telah menambahkan 3 butir catatan perbaikan pasca-sidang (SLA: 14 hari).',
        type: 'action_required',
        event_category: 'revisi_penguji',
        action_url: '/mahasiswa/revisi',
        is_read: 0,
        created_at: new Date(Date.now() - 7200 * 1000).toISOString()
      },
      {
        id: 'notif-3',
        user_id: 'usr-pgj-1',
        role: 'penguji',
        title: 'Jadwal Ujian Sidang Baru',
        message: 'Anda ditugaskan sebagai Anggota Penguji Sidang Skripsi Ilham Maulana (210211100142) pada 15 Okt 2026.',
        type: 'info',
        event_category: 'jadwal_ujian',
        action_url: '/penguji/daftar-ujian',
        is_read: 0,
        created_at: new Date(Date.now() - 10800 * 1000).toISOString()
      },
      {
        id: 'notif-4',
        user_id: 'usr-dsn-1',
        role: 'dosen',
        title: 'Draf Naskah Menunggu Review',
        message: 'Mahasiswa Ahmad Zaky Ramadhan telah mengajukan pembaruan draf naskah Bab IV & V.',
        type: 'action_required',
        event_category: 'review_naskah',
        action_url: '/dosen/naskah',
        is_read: 0,
        created_at: new Date(Date.now() - 14400 * 1000).toISOString()
      },
      {
        id: 'notif-5',
        user_id: 'usr-adm-1',
        role: 'admin',
        title: 'Pendaftaran Ujian Perlu Verifikasi',
        message: 'Berkas pendaftaran sidang mahasiswa baru Siti Nurhaliza (S1 Manajemen) menunggu verifikasi (SLA: 48 jam).',
        type: 'action_required',
        event_category: 'pendaftaran_ujian',
        action_url: '/admin/verifikasi-berkas',
        is_read: 0,
        created_at: new Date(Date.now() - 18000 * 1000).toISOString()
      },
      {
        id: 'notif-6',
        user_id: 'usr-kp-1',
        role: 'koorprodi',
        title: 'Plotting Pembimbing Baru Diperlukan',
        message: 'Mahasiswa baru angkatan 2024 membutuhkan penetapan Dosen Pembimbing I & II.',
        type: 'info',
        event_category: 'plotting_dosen',
        action_url: '/koorprodi/pembimbing',
        is_read: 0,
        created_at: new Date(Date.now() - 21600 * 1000).toISOString()
      }
    ];

    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, role, title, message, type, event_category, action_url, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    initialNotifications.forEach((n) => {
      stmt.run(n.id, n.user_id, n.role, n.title, n.message, n.type, n.event_category, n.action_url, n.is_read, n.created_at);
    });

    console.log('[In-App Notifications] Berhasil men-seed notifikasi awal.');
  } catch (err) {
    console.error('Gagal seed notifikasi awal:', err);
  }
}

export const InAppNotificationService = {
  /**
   * Pendaftaran Klien Real-Time SSE
   */
  registerSSEClient(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Kirim pesan salam / heartbeat awal
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Stream SIM-TA FEB UTM Terhubung' })}\n\n`);

    sseClients.add(res);
    console.log(`[SSE] Klien terhubung. Total aktif: ${sseClients.size}`);

    req.on('close', () => {
      sseClients.delete(res);
      console.log(`[SSE] Klien terputus. Total aktif: ${sseClients.size}`);
    });
  },

  /**
   * Broadcast Notifikasi Real-Time ke Klien yang Sedang Aktif
   */
  broadcast(notificationData) {
    const payload = `data: ${JSON.stringify(notificationData)}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(payload);
      } catch (err) {
        sseClients.delete(client);
      }
    });
  },

  /**
   * Kirim dan Rekam Notifikasi Baru
   */
  createNotification({
    userId = null,
    role = 'semua',
    title,
    message,
    type = 'info',
    eventCategory = 'umum',
    actionUrl = null
  }) {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = new Date().toISOString();

    try {
      db.prepare(`
        INSERT INTO notifications (
          id, user_id, role, title, message, type, event_category, action_url, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(id, userId, role, title, message, type, eventCategory, actionUrl, createdAt);

      const notificationObj = {
        id,
        userId,
        role,
        title,
        message,
        type,
        eventCategory,
        actionUrl,
        isRead: false,
        createdAt
      };

      // Siarkan ke seluruh tab browser pengguna secara real-time!
      this.broadcast({
        type: 'NEW_NOTIFICATION',
        notification: notificationObj
      });

      return notificationObj;
    } catch (err) {
      console.error('[Notification Service] Gagal menyimpan notifikasi:', err);
      return null;
    }
  },

  /**
   * Ambil Notifikasi Berdasarkan Peran / Pengguna
   */
  getNotifications(role = 'semua', userId = null) {
    seedInitialNotificationsIfEmpty();

    try {
      let query = 'SELECT * FROM notifications';
      let params = [];

      if (role && role !== 'semua') {
        if (userId) {
          // Hanya tampilkan pengumuman umum non-personal (role = 'semua' dan user_id IS NULL)
          // ATAU notifikasi yang ditujukan khusus untuk pengguna ini (user_id = userId)
          query += " WHERE (role = 'semua' AND user_id IS NULL) OR user_id = ? OR (role = ? AND user_id = ?)";
          params.push(userId, role, userId);
        } else {
          query += " WHERE role = ? OR role = 'semua'";
          params.push(role);
        }
      }
      query += ' ORDER BY created_at DESC LIMIT 40';

      const rows = db.prepare(query).all(...params);
      const mapped = rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        role: r.role,
        title: r.title,
        message: r.message,
        type: r.type,
        eventCategory: r.event_category,
        actionUrl: r.action_url,
        isRead: Boolean(r.is_read),
        createdAt: r.created_at
      }));

      const unreadCount = mapped.filter((n) => !n.isRead).length;

      return {
        notifications: mapped,
        unreadCount
      };
    } catch (err) {
      console.error('[Notification Service] Gagal mengambil notifikasi:', err);
      return { notifications: [], unreadCount: 0 };
    }
  },

  /**
   * Tandai Satu Notifikasi Sudah Dibaca
   */
  markAsRead(id) {
    try {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
      return true;
    } catch (err) {
      console.error('Gagal markAsRead:', err);
      return false;
    }
  },

  /**
   * Tandai Seluruh Notifikasi Sudah Dibaca
   */
  markAllAsRead(role = 'semua') {
    try {
      if (role && role !== 'semua') {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE role = ? OR role = "semua"').run(role);
      } else {
        db.prepare('UPDATE notifications SET is_read = 1').run();
      }
      return true;
    } catch (err) {
      console.error('Gagal markAllAsRead:', err);
      return false;
    }
  }
};

export default InAppNotificationService;
