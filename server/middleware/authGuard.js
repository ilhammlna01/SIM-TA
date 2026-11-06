/**
 * Role-Based Access Control (RBAC) & Cryptographic Security Middleware
 * SIM Tugas Akhir FEB UTM
 * 
 * Melindungi seluruh endpoint backend dengan verifikasi tanda tangan JWT server-side.
 * Mencegah manipulasi peran via header HTTP (x-user-role) atau parameter URL (?role=...).
 */

import { db } from '../database/db.js';
import { verifyToken, verifyScopedToken } from '../utils/jwt.js';

/**
 * Redaksi kredensial dari URL sebelum dicatat ke log/audit.
 * Mencegah JWT (yang mungkin dikirim via ?token=...) bocor ke audit_log, log akses, atau riwayat.
 */
export function sanitizeUrlForLog(url) {
  if (!url || typeof url !== 'string') return url;
  return url
    .replace(/([?&](?:token|access_token|x-access-token)=)[^&#]*/gi, '$1[REDACTED]')
    .replace(/([?&]dl=)[^&#]*/gi, '$1[REDACTED]');
}

/**
 * Ambil token sesi dari header Authorization.
 *
 * Audit 21 Oktober 2026: token SESI TIDAK lagi diterima dari query string
 * (?token=...). Kredensial di URL bocor ke riwayat peramban, header Referer,
 * dan log akses reverse proxy. Untuk kebutuhan unduhan berkas & SSE, digunakan
 * SCOPED TOKEN berumur pendek (lihat generateScopedToken).
 */
function extractSessionToken(req) {
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const legacy = req.headers['x-access-token'];
  if (legacy) {
    return String(legacy).trim();
  }
  return '';
}

/**
 * Middleware untuk mengekstrak dan memverifikasi token JWT sesi aktif
 */
export function authenticate(req, res, next) {
  const token = extractSessionToken(req);

  // 1. Verifikasi apakah token sesi disediakan
  if (!token) {
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    logSecurityViolation('anonymous', 'UNAUTHORIZED_NO_TOKEN', `Percobaan akses tanpa token ke ${req.method} ${sanitizeUrlForLog(req.originalUrl)} dari IP ${clientIp}`);
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED_NO_TOKEN',
      error: 'Autentikasi Diperlukan: Token sesi resmi (Bearer Token) tidak ditemukan dalam request.'
    });
  }

  // 2. Verifikasi tanda tangan kriptografis token JWT
  const decoded = verifyToken(token);
  if (!decoded) {
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    logSecurityViolation('anonymous', 'UNAUTHORIZED_INVALID_TOKEN', `Token palsu atau kedaluwarsa terdeteksi pada ${req.method} ${sanitizeUrlForLog(req.originalUrl)} dari IP ${clientIp}`);
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED_INVALID_TOKEN',
      error: 'Sesi Tidak Sah: Token autentikasi tidak valid atau telah kedaluwarsa. Silakan login kembali.'
    });
  }

  // 3. Verifikasi versi kredensial terhadap database.
  //    token_version dinaikkan saat logout, ganti kata sandi, perubahan peran,
  //    atau penonaktifan akun => token lama otomatis ditolak (revocation).
  try {
    const account = db.prepare('SELECT id, role, status, token_version FROM users WHERE id = ?').get(decoded.id);
    if (!account) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED_INVALID_TOKEN',
        error: 'Sesi Tidak Sah: akun tidak ditemukan. Silakan login kembali.'
      });
    }
    if (account.status && account.status.toLowerCase() === 'non-aktif') {
      logSecurityViolation(decoded.id, 'UNAUTHORIZED_ACCOUNT_DISABLED', `Akses ditolak untuk akun non-aktif pada ${req.method} ${sanitizeUrlForLog(req.originalUrl)}`);
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_DISABLED',
        error: 'Akun Anda dinonaktifkan. Silakan hubungi Subbag Akademik FEB UTM.'
      });
    }
    const tokenVersion = Number(decoded.tv || 0);
    if (Number(account.token_version || 0) !== tokenVersion) {
      logSecurityViolation(decoded.id, 'UNAUTHORIZED_STALE_TOKEN', `Token versi lama ditolak pada ${req.method} ${sanitizeUrlForLog(req.originalUrl)}`);
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED_STALE_TOKEN',
        error: 'Sesi Tidak Sah: sesi ini sudah dicabut (logout, penggantian kata sandi, atau perubahan hak akses). Silakan login kembali.'
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Gagal memverifikasi status akun.' });
  }

  // Simpan data identitas pengguna yang terverifikasi ke object request
  req.user = decoded;
  next();
}

/**
 * Autentikasi untuk ENDPOINT UNDUHAN BERKAS.
 * Menerima dua bentuk kredensial:
 *  1. Token sesi penuh via header Authorization (dipakai API/polik).
 *  2. Scoped token unduhan via query `?dl=` — berumur pendek (2 menit) dan
 *     terikat pada satu berkas tertentu, sehingga tidak dapat disalahgunakan
 *     sebagai kredensial umum.
 */
export function authenticateFileAccess(req, res, next) {
  const downloadToken = req.query?.dl ? String(req.query.dl).trim() : '';

  if (downloadToken) {
    const { category, filename } = req.params || {};
    const scoped = verifyScopedToken(downloadToken, 'file-download', { category, filename });
    if (!scoped) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_DOWNLOAD_TOKEN',
        error: 'Tautan unduhan tidak sah atau kedaluwarsa. Silakan muat ulang halaman.'
      });
    }
    req.user = {
      id: scoped.sub,
      nomorInduk: scoped.nip || scoped.sub,
      role: scoped.role,
      __scoped: true
    };
    return next();
  }

  return authenticate(req, res, next);
}

/**
 * Autentikasi untuk ENDPOINT ALIRAN NOTIFIKASI (SSE).
 * EventSource tidak dapat menyertakan header Authorization, sehingga digunakan
 * SCOPED TOKEN berumur pendek (?st=) — bukan token sesi penuh.
 */
export function authenticateStream(req, res, next) {
  const streamToken = req.query?.st ? String(req.query.st).trim() : '';

  if (streamToken) {
    const scoped = verifyScopedToken(streamToken, 'sse-stream');
    if (!scoped) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_STREAM_TOKEN',
        error: 'Token aliran notifikasi tidak sah atau kedaluwarsa.'
      });
    }
    req.user = {
      id: scoped.sub,
      nomorInduk: scoped.nip || scoped.sub,
      role: scoped.role,
      __scoped: true
    };
    return next();
  }

  return authenticate(req, res, next);
}

/**
 * Middleware untuk memvalidasi otorisasi peran (Role Guard)
 * @param {string[]} allowedRoles - Daftar peran yang diizinkan (e.g. ['penguji', 'admin', 'superadmin'])
 * @param {Object} options - Konfigurasi tambahan
 */
export function requireRole(allowedRoles = [], options = {}) {
  return (req, res, next) => {
    // 1. Jalankan autentikasi JWT terlebih dahulu
    authenticate(req, res, () => {
      const userRole = (req.user?.role || '').toLowerCase();
      const userId = req.user?.id || req.user?.nomorInduk || 'anonymous';
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      // 2. Proteksi Khusus Akademik: Mahasiswa dilarang mengisi form penguji / manipulasi nilai
      if (userRole === 'mahasiswa' && allowedRoles.every(r => r !== 'mahasiswa')) {
        const reason = options.customMessage || 'Mahasiswa dilarang keras mengakses atau menginput nilai sidang pada form dewan penguji.';
        logSecurityViolation(
          userId,
          'SECURITY_VIOLATION_PENILAIAN',
          `[BLOCKED] Mahasiswa (ID: ${userId}, IP: ${clientIp}) mencoba mengakses endpoint penguji: ${req.method} ${sanitizeUrlForLog(req.originalUrl)}`
        );

        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN_MAHASISWA_ACCESS',
          error: `Akses Ditolak [403 Forbidden]: ${reason}`,
          securityNotice: 'Insiden ini telah dicatat dalam Audit Log Keamanan Akademik FEB UTM untuk pencegahan kecurangan akademik.'
        });
      }

      // 3. Verifikasi apakah peran yang terverifikasi ada dalam daftar izin
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        logSecurityViolation(
          userId,
          'SECURITY_VIOLATION_ROLE_MISMATCH',
          `Peran "${userRole}" (User: ${userId}) ditolak mengakses ${req.method} ${sanitizeUrlForLog(req.originalUrl)}`
        );

        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN_ROLE_MISMATCH',
          error: `Akses Ditolak: Peran "${userRole}" tidak memiliki wewenang untuk tindakan ini.`
        });
      }

      // Otorisasi berhasil
      next();
    });
  };
}

/**
 * Catat insiden keamanan ke tabel SQLite audit_log
 */
export function logSecurityViolation(userId, action, details) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_log (user_id, action, details)
      VALUES (?, ?, ?)
    `);
    stmt.run(userId || 'anonymous', action, details);
  } catch (err) {
    console.error('[Security Audit Log Error]:', err.message);
  }
}

export default {
  authenticate,
  authenticateFileAccess,
  authenticateStream,
  requireRole,
  logSecurityViolation
};
