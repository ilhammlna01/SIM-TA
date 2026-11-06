/**
 * Notification & Communication Router - SIM Tugas Akhir FEB UTM
 * Menyediakan endpoint untuk:
 * - Server-Sent Events (SSE) Stream Real-Time (/stream)
 * - Pengambilan & Pembaruan Status Notifikasi In-App
 * - Pemicu & Log Pengiriman Email SLA
 */

import express from 'express';
import { InAppNotificationService } from '../notifications/inAppService.js';
import { EmailService, isAllowedRecipientEmail } from '../notifications/emailService.js';
import { db } from '../database/db.js';
import { authenticate, authenticateStream, requireRole } from '../middleware/authGuard.js';
import { generateScopedToken } from '../utils/jwt.js';

const router = express.Router();

/**
 * POST /api/notifications/stream-token
 * Menerbitkan token scoped untuk koneksi SSE.
 * Audit 21 Oktober 2026: token sesi penuh tidak lagi dipassage via URL.
 */
router.post('/stream-token', authenticate, (req, res) => {
  try {
    const account = db.prepare('SELECT token_version FROM users WHERE id = ?').get(req.user?.id);
    const token = generateScopedToken(
      {
        userId: req.user?.id,
        nip: req.user?.nomorInduk,
        role: req.user?.role,
        tokenVersion: Number(account?.token_version || 1),
        purpose: 'sse-stream',
        scope: {}
      },
      '30m'
    );

    res.json({
      success: true,
      streamUrl: `/api/notifications/stream?st=${encodeURIComponent(token)}`,
      expiresInSeconds: 1800
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/notifications/stream
 * Endpoint Server-Sent Events (SSE) untuk komunikasi real-time dua arah ke browser.
 * Dilindungi token scoped (?st=) atau token sesi (header Authorization).
 */
router.get('/stream', authenticateStream, (req, res) => {
  InAppNotificationService.registerSSEClient(req, res);
});

/**
 * GET /api/notifications
 * Mengambil daftar notifikasi in-app untuk peran aktif terautentikasi
 */
router.get('/', authenticate, (req, res) => {
  // Audit 21 Oktober 2026: identitas TIDAK lagi diambil dari query string.
  // Sebelumnya `req.query.userId` didahulukan atas identitas terverifikasi,
  // sehingga pengguna mana pun dapat membaca notifikasi pribadi orang lain.
  const role = req.user?.role || 'semua';
  const userId = req.user?.nomorInduk || req.user?.id || null;
  const result = InAppNotificationService.getNotifications(role, userId);
  res.json({
    success: true,
    data: result.notifications,
    unreadCount: result.unreadCount
  });
});

/**
 * PUT /api/notifications/:id/read
 * Menandai notifikasi telah dibaca (hanya bila memang milik/tercakup pemanggil)
 */
router.put('/:id/read', authenticate, (req, res) => {
  const { id } = req.params;
  const role = String(req.user?.role || '').toLowerCase();
  const userId = req.user?.nomorInduk || req.user?.id || null;

  // Admin & Superadmin boleh menandai seluruh notifikasi; peran lain hanya
  // notifikasi miliknya sendiri atau pengumuman umum.
  if (!['admin', 'superadmin'].includes(role)) {
    const row = db.prepare('SELECT user_id, role FROM notifications WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Notifikasi tidak ditemukan.' });
    }
    const isOwn = (row.user_id && row.user_id === userId) || row.role === 'semua' || row.role === role;
    if (!isOwn) {
      return res.status(403).json({ success: false, error: 'Akses ditolak: notifikasi ini bukan milik Anda.' });
    }
  }

  const ok = InAppNotificationService.markAsRead(id);
  res.json({ success: ok });
});

/**
 * PUT /api/notifications/read-all
 * Menandai seluruh notifikasi peran telah dibaca
 */
router.put('/read-all', authenticate, (req, res) => {
  // Audit 21 Oktober 2026: role diambil HANYA dari token terverifikasi.
  // Nilai dari body tidak boleh menentukan cakupan pembatasan.
  const role = req.user?.role || 'semua';
  const ok = InAppNotificationService.markAllAsRead(role);
  res.json({ success: ok });
});

/**
 * POST /api/notifications/broadcast
 * Mengirim dan menyiarkan notifikasi baru ke semua klien secara langsung
 */
router.post('/broadcast', requireRole(['admin', 'superadmin', 'koorprodi', 'dosen', 'penguji']), (req, res) => {
  const { role, title, message, type, eventCategory, actionUrl } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, error: 'Judul dan pesan notifikasi wajib diisi.' });
  }

  const notification = InAppNotificationService.createNotification({
    role: role || 'semua',
    title,
    message,
    type: type || 'info',
    eventCategory: eventCategory || 'umum',
    actionUrl
  });

  res.status(201).json({
    success: true,
    message: 'Notifikasi berhasil disiarkan secara real-time!',
    data: notification
  });
});

/**
 * GET /api/notifications/email-logs
 * Mengambil riwayat pengiriman email dan status SLA (Khusus Admin & Superadmin)
 */
router.get('/email-logs', requireRole(['admin', 'superadmin']), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 30').all();
    const mapped = rows.map((r) => ({
      id: r.id,
      recipientEmail: r.recipient_email,
      recipientName: r.recipient_name,
      subject: r.subject,
      eventType: r.event_type,
      htmlContent: r.html_content,
      status: r.status,
      previewUrl: r.preview_url,
      slaDeadline: r.sla_deadline,
      sentAt: r.sent_at
    }));

    res.json({
      success: true,
      data: mapped
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/notifications/send-email
 * Mengirimkan email formal berdasarkan tipe event SLA
 */
router.post('/send-email', requireRole(['admin', 'superadmin', 'koorprodi', 'dosen', 'penguji']), async (req, res) => {
  const { eventType, payload } = req.body;

  // Kontrol keamanan: tolak pengiriman ke alamat di luar domain institusi resmi.
  // Mencegah penyalahgunaan endpoint email berkop FEB UTM untuk phishing ke pihak eksternal.
  if (payload && payload.recipientEmail && !isAllowedRecipientEmail(payload.recipientEmail)) {
    return res.status(403).json({
      success: false,
      error: 'Alamat email penerima tidak diizinkan. Sistem hanya mengirim ke domain institusi resmi kampus.'
    });
  }

  try {
    let result;
    if (eventType === 'PENDAFTARAN_UJIAN_BARU') {
      result = await EmailService.sendPendaftaranUjianEmail(payload || {});
    } else if (eventType === 'PROMOTOR_SETUJU_NASKAH') {
      result = await EmailService.sendPersetujuanNaskahEmail(payload || {});
    } else if (eventType === 'CATATAN_REVISI_BARU') {
      result = await EmailService.sendCatatanRevisiEmail(payload || {});
    } else if (eventType === 'SK_UJIAN_TERBIT') {
      result = await EmailService.sendSKTerbitEmail(payload || {});
    } else {
      return res.status(400).json({
        success: false,
        error: 'Tipe event email tidak valid. Pilihan: PENDAFTARAN_UJIAN_BARU, PROMOTOR_SETUJU_NASKAH, CATATAN_REVISI_BARU, SK_UJIAN_TERBIT'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email notifikasi berhasil dikirim dan dicatat pada log SLA.',
      data: result
    });
  } catch (err) {
    console.error('Gagal mengirim email:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengirim email: ' + err.message
    });
  }
});

export default router;
