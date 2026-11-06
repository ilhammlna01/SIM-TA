/**
 * Storage & File Management Router - SIM Tugas Akhir FEB UTM
 * Endpoint untuk upload, validasi keamanan, dan unduh berkas naskah/dokumen resmi.
 */

import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { StorageManager, uploadMiddleware, CATEGORY_DIRS } from '../storage/storageManager.js';
import { validateUploadRequest, MAX_SIZES } from '../storage/fileValidator.js';
import { db } from '../database/db.js';
import { authenticate, authenticateFileAccess, requireRole } from '../middleware/authGuard.js';
import { generateScopedToken } from '../utils/jwt.js';

const router = express.Router();

/**
 * POST /api/storage/upload/:category
 * Unggah berkas dengan validasi ukuran, ekstensi, magic bytes, dan sanitasi nama file.
 * Dilindungi autentikasi sesi aktif (JWT).
 */
router.post('/upload/:category', authenticate, (req, res, next) => {
  const category = req.params.category;
  if (!CATEGORY_DIRS[category]) {
    return res.status(400).json({
      success: false,
      error: `Kategori penyimpanan tidak valid. Pilihan: ${Object.keys(CATEGORY_DIRS).filter(k => k !== 'temp').join(', ')}`
    });
  }

  // Jalankan multer middleware
  uploadMiddleware.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const limitMb = Math.round((MAX_SIZES[category] || MAX_SIZES.default) / (1024 * 1024));
        return res.status(400).json({
          success: false,
          error: `Ukuran file melebihi batas maksimal server (${limitMb} MB).`
        });
      }
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Berkas tidak ditemukan dalam form data upload.' });
    }

    // Jalankan validator magic bytes & ekstensi
    validateUploadRequest(category)(req, res, () => {
      const file = req.file;
      const accessUrl = StorageManager.getAccessUrl(category, file.filename);

      // Catat registrasi berkas ke tabel storage_files untuk kontrol kepemilikan relasional
      try {
        db.prepare(`
          INSERT OR REPLACE INTO storage_files (id, filename, original_name, category, uploader_id, uploader_nim, uploader_role)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file.filename,
          file.originalname,
          category,
          req.user?.id || 'unknown',
          req.user?.nomorInduk || null,
          req.user?.role || 'unknown'
        );
      } catch (regErr) {
        console.warn('Storage file registration error:', regErr);
      }

      // Audit log ke SQLite dengan identitas terverifikasi
      try {
        db.prepare(`
          INSERT INTO audit_log (user_id, action, details)
          VALUES (?, ?, ?)
        `).run(
          req.user?.id || req.user?.nomorInduk || 'authenticated_user',
          'UPLOAD_FILE',
          `Unggah berkas ${file.originalname} ke kategori ${category} (${(file.size / 1024).toFixed(1)} KB)`
        );
      } catch (logErr) {
        console.warn('Audit log error:', logErr);
      }

      res.status(201).json({
        success: true,
        message: `Berkas "${file.originalname}" berhasil diunggah dan terverifikasi aman.`,
        data: {
          originalName: file.originalname,
          storedName: file.filename,
          category,
          size: file.size,
          sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          mimetype: file.mimetype,
          accessUrl
        }
      });
    });
  });
});

/**
 * POST /api/storage/download-token
 * Menerbitkan TOKEN UNDUHAN berumur pendek (2 menit) yang terikat pada satu
 * berkas tertentu.
 *
 * Audit 21 Oktober 2026: sebelumnya token sesi penuh (umur 8 jam) disisipkan
 * ke query string URL unduhan. Akibatnya kredensial bocor ke riwayat peramban,
 * header Referer, dan log akses reverse proxy. Token unduhan yang terikat
 * scope tidak dapat disalahgunakan sebagai kredensial umum.
 */
router.post('/download-token', authenticate, (req, res) => {
  try {
    const { category, filename } = req.body || {};

    if (!category || !CATEGORY_DIRS[category]) {
      return res.status(400).json({ success: false, error: 'Kategori penyimpanan tidak valid.' });
    }
    if (!filename || String(filename).includes('..') || String(filename).includes('/') || String(filename).includes('\\')) {
      return res.status(400).json({ success: false, error: 'Nama berkas tidak sah.' });
    }

    // OtorisasiChecked lebih dulu: token hanya terbit bila akses memang berwenang.
    if (!StorageManager.authorizeAccess(req, category, filename)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_CONFIDENTIAL_MANUSCRIPT',
        error: 'Akses Ditolak [403 Forbidden]: Anda tidak memiliki wewenang membuka berkas ini.'
      });
    }

    const account = db.prepare('SELECT token_version FROM users WHERE id = ?').get(req.user?.id);
    const token = generateScopedToken(
      {
        userId: req.user?.id,
        nip: req.user?.nomorInduk,
        role: req.user?.role,
        tokenVersion: Number(account?.token_version || 1),
        purpose: 'file-download',
        scope: { category, filename: String(filename) }
      },
      '2m'
    );

    res.json({
      success: true,
      downloadUrl: `/api/storage/files/${encodeURIComponent(category)}/${encodeURIComponent(filename)}?dl=${encodeURIComponent(token)}`,
      expiresInSeconds: 120
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Middleware proteksi path traversal.
 * Dijalankan SEBELUM autentikasi agar percobaan traversal langsung ditolak
 * dengan 400 (bukan 401), dan agar tidak pernah menyentuh sistem berkas.
 */
function rejectPathTraversal(req, res, next) {
  const { filename } = req.params || {};
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\') || filename.includes('\0')) {
    try {
      db.prepare(`
        INSERT INTO audit_log (user_id, action, details)
        VALUES (?, 'SECURITY_PATH_TRAVERSAL_ATTEMPT', ?)
      `).run(
        req.user?.id || 'anonymous',
        `[BLOCKED] Percobaan path traversal pada berkas: ${filename}`
      );
    } catch (_) {}

    return res.status(400).json({
      success: false,
      code: 'BAD_REQUEST_PATH_TRAVERSAL',
      error: 'Akses Ditolak: Nama berkas tidak sah (terdeteksi percobaan path traversal).'
    });
  }
  next();
}

/**
 * GET /api/storage/files/:category/:filename
 * Streaming dan unduh berkas terproteksi dengan kontrol otorisasi akses.
 * Menerima token sesi (Authorization) atau token unduhan berumur pendek (?dl=).
 */
router.get('/files/:category/:filename', rejectPathTraversal, authenticateFileAccess, (req, res) => {
  const { category, filename } = req.params;

  // 1. Kontrol Otorisasi Izin Akses (Jalankan sebelum cek file untuk mencegah probe existence)
  if (!StorageManager.authorizeAccess(req, category, filename)) {
    const userRole = req.user?.role || 'guest';
    const userId = req.user?.id || req.user?.nomorInduk || 'anonymous';
    
    try {
      db.prepare(`
        INSERT INTO audit_log (user_id, action, details)
        VALUES (?, 'SECURITY_VIOLATION_CONFIDENTIAL_FILE_ACCESS', ?)
      `).run(
        userId,
        `[BLOCKED] Pengguna (Role: ${userRole}, ID: ${userId}) mencoba mengakses dokumen rahasia tanpa izin: /${category}/${filename}`
      );
    } catch (_) {}

    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN_CONFIDENTIAL_MANUSCRIPT',
      error: 'Akses Ditolak [403 Forbidden]: Dokumen naskah ini bersifat rahasia dan bukan milik Anda atau Anda tidak memiliki wewenang akademik untuk membukanya.',
      securityNotice: 'Insiden akses terlarang telah dicatat ke dalam Audit Log Keamanan Akademik FEB UTM.'
    });
  }

  // 2. Cek keberadaan berkas fisik
  if (!StorageManager.fileExists(category, filename)) {
    return res.status(404).json({
      success: false,
      error: 'Berkas tidak ditemukan atau telah dipindahkan oleh sistem.'
    });
  }

  const filePath = StorageManager.getFilePath(category, filename);
  const ext = path.extname(filename).toLowerCase();

  // Tentukan Content-Type
  const mimeMap = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.png': 'image/png',
    '.jpg': 'image/jpeg'
  };
  const contentType = mimeMap[ext] || 'application/octet-stream';

  // Catat akses berkas terotorisasi ke audit log (identitas dari token terverifikasi).
  try {
    const userId = req.user?.id || req.user?.nomorInduk || 'anonymous';
    const userRole = req.user?.role || 'guest';
    db.prepare(`
      INSERT INTO audit_log (user_id, action, details)
      VALUES (?, 'FILE_ACCESS', ?)
    `).run(
      userId,
      `Pengguna (Role: ${userRole}, ID: ${userId}) mengunduh berkas: /${category}/${filename}`
    );
  } catch (_) {}

  res.setHeader('Content-Type', contentType);
  // Set inline untuk PDF agar dapat langsung dipratinjau di browser/iframe
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
  // Audit 21 Oktober 2026: berkas akademik bersifat rahasia. Wajib private &
  // no-store agar tidak tertahan pada shared proxy cache maupun disk cache browser.
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

/**
 * GET /api/storage/list/:category
 * Mendapatkan daftar berkas dalam kategori penyimpanan (Staff & Koorprodi)
 */
router.get('/list/:category', requireRole(['admin', 'superadmin', 'koorprodi', 'mahasiswa', 'dosen', 'penguji']), (req, res) => {
  const { category } = req.params;
  const role = String(req.user?.role || '').toLowerCase();

  // Audit 21 Oktober 2026 (temuan AZ-A2): mahasiswa DIBERIKAN melihat
  // daftar berkas MILIKNYA SENDIRI (dokumen yang they've unggah). Ahor,
  // halaman "Dokumen" mahasiswa hanya menampilkan data simulasi sehingga
  // berkas yang benar-benar diunggah tidak pernah terlihat. Berkas milik
  // mahasiswa lain TIDAK boleh terlihat oleh mahasiswa.
  const sessionNim = String(req.user?.nomorInduk || '').trim();

  const filterFn =
    role === 'admin' || role === 'superadmin'
      ? null
      : (file, owner) => {
          if (!owner) return false;
          return String(owner.uploader_nim || '').trim() === sessionNim;
        };

  const files = StorageManager.listFiles(category, filterFn).map((f) => {
    const owner = StorageManager.getFileOwnership(category, f.filename);
    return {
      ...f,
      uploaderNim: owner?.uploader_nim || null,
      uploaderNama: owner?.uploader_nama || null
    };
  });

  res.json({
    success: true,
    data: files
  });
});

/**
 * DELETE /api/storage/files/:category/:filename
 * Hapus berkas dari penyimpanan lokal (Hanya Admin & Super Admin)
 */
router.delete('/files/:category/:filename', requireRole(['admin', 'superadmin']), (req, res) => {
  const { category, filename } = req.params;
  const deleted = StorageManager.deleteFile(category, filename);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: 'Berkas tidak ditemukan untuk dihapus.'
    });
  }

  // Hapus dari indeks storage_files
  try {
    db.prepare('DELETE FROM storage_files WHERE filename = ?').run(filename);
  } catch (_) {}

  res.json({
    success: true,
    message: `Berkas "${filename}" berhasil dihapus dari server.`
  });
});

export default router;
