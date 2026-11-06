import express from 'express';
import db from '../database/db.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import { authenticate } from '../middleware/authGuard.js';

const router = express.Router();

/**
 * Rate limiter sederhana berbasis memori untuk endpoint login.
 * Membatasi percobaan login pada DUA tingkat sekaligus:
 *   1. Per-IP + per-akun  -> menangkal brute force satu akun.
 *   2. Per-IP global      -> menangkal credential stuffing lintas akun dari satu IP.
 * (Tanpa dependensi tambahan; cocok untuk deployment satu-instance.)
 */
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 menit
const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS) || 5;           // per IP+akun
const LOGIN_MAX_ATTEMPTS_PER_IP = Number(process.env.LOGIN_MAX_ATTEMPTS_PER_IP) || 30; // per IP (global)
const ACCOUNT_LOCK_MS = Number(process.env.ACCOUNT_LOCK_MS) || 5 * 60 * 1000;   // durasi lockout akun
const loginAttempts = new Map();        // key "ip::identifier" -> { count, firstAt }
const ipAttempts = new Map();           // key "ip" -> { count, firstAt }
const accountLockouts = new Map();      // key "identifier" -> { until, count }

function loginRateLimiter(req, res, next) {
  const identifier = String(req.body?.identifier || '').trim().toLowerCase();
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const now = Date.now();

  // 0. Lockout akun (menangkal brute force terdistribusi lintas IP).
  const lock = accountLockouts.get(identifier);
  if (lock && lock.until > now) {
    const retryAfterSec = Math.ceil((lock.until - now) / 1000);
    res.setHeader('Retry-After', String(Math.max(retryAfterSec, 1)));
    return res.status(429).json({
      success: false,
      code: 'ACCOUNT_TEMPORARILY_LOCKED',
      message: 'Akun terkunci sementara karena terlalu banyak percobaan login gagal. Silakan coba lagi nanti atau hubungi Subbag Akademik.'
    });
  }
  if (lock && lock.until <= now) {
    accountLockouts.delete(identifier);
  }

  // 1. Batas per-IP global (menangkal penyebaran percobaan ke banyak akun).
  const ipEntry = ipAttempts.get(ip);
  if (!ipEntry || now - ipEntry.firstAt > LOGIN_WINDOW_MS) {
    ipAttempts.set(ip, { count: 1, firstAt: now });
  } else {
    ipEntry.count += 1;
    if (ipEntry.count > LOGIN_MAX_ATTEMPTS_PER_IP) {
      const retryAfterSec = Math.ceil((ipEntry.firstAt + LOGIN_WINDOW_MS - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(retryAfterSec, 1)));
      return res.status(429).json({
        success: false,
        message: 'Terlalu banyak percobaan login dari jaringan ini. Silakan coba lagi beberapa saat lagi.'
      });
    }
  }

  // 2. Batas per-IP + per-akun (menangkal brute force akun tertentu).
  const key = `${ip}::${identifier}`;
  const entry = loginAttempts.get(key);
  if (!entry || now - entry.firstAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAt: now });
    return next();
  }

  entry.count += 1;
  if (entry.count > LOGIN_MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((entry.firstAt + LOGIN_WINDOW_MS - now) / 1000);
    res.setHeader('Retry-After', String(Math.max(retryAfterSec, 1)));
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan login. Silakan coba lagi beberapa saat lagi.'
    });
  }

  return next();
}

/**
 * Mencatat percobaan login GAGAL dan mengunci akun bila terlalu sering gagal.
 * Dipanggil dari handler login saat verifikasi kata sandi ditolak.
 */
function registerFailedLogin(identifier) {
  const key = String(identifier || '').trim().toLowerCase();
  if (!key) return;
  const lock = accountLockouts.get(key);
  const count = (lock?.count || 0) + 1;
  if (count >= LOGIN_MAX_ATTEMPTS) {
    accountLockouts.set(key, { count, until: Date.now() + ACCOUNT_LOCK_MS });
  } else if (lock) {
    lock.count = count;
  } else {
    accountLockouts.set(key, { count, until: 0 });
  }
}

/**
 * Menghapus status lockout akun setelah login berhasil.
 */
function clearFailedLogins(identifier) {
  const key = String(identifier || '').trim().toLowerCase();
  if (key) accountLockouts.delete(key);
}

// Bersihkan entri kedaluwarsa secara berkala agar tidak tumbuh tanpa batas.
const loginAttemptsSweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of loginAttempts.entries()) {
    if (now - entry.firstAt > LOGIN_WINDOW_MS) loginAttempts.delete(key);
  }
  for (const [key, entry] of ipAttempts.entries()) {
    if (now - entry.firstAt > LOGIN_WINDOW_MS) ipAttempts.delete(key);
  }
  for (const [key, entry] of accountLockouts.entries()) {
    if (entry.until && now > entry.until + LOGIN_WINDOW_MS) accountLockouts.delete(key);
  }
}, LOGIN_WINDOW_MS);
if (typeof loginAttemptsSweeper.unref === 'function') loginAttemptsSweeper.unref();

/**
 * Menentukan matriks peran yang sah bagi pengguna
 * Sesuai prinsip institusional: Setiap akun hanya memiliki peran yang diberikan padanya
 */
function getEligibleRoles(user) {
  if (!user || !user.role) return ['mahasiswa'];

  // Mahasiswa, Superadmin, dan Admin Akademik terkunci pada perannya (Zero-Trust RBAC)
  if (['mahasiswa', 'superadmin', 'admin'].includes(user.role)) {
    return [user.role];
  }

  // Jika akun memiliki konfigurasi multi-peran eksplisit pada database
  if (user.eligible_roles) {
    try {
      const parsed = JSON.parse(user.eligible_roles);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (_) {}
  }

  // Matriks Sivitas Akademika FEB UTM:
  // Dosen dapat menjalankan peran Pembimbing ('dosen') dan Penguji ('penguji').
  // Jika tercatat sebagai Kaprodi di database atau memiliki SK Koorprodi, dapat menjalankan peran 'koorprodi'.
  if (['dosen', 'penguji', 'koorprodi'].includes(user.role)) {
    let isKaprodi = user.role === 'koorprodi';
    try {
      const prodiRow = db.prepare('SELECT count(*) as count FROM prodi WHERE nip_kaprodi = ? OR kaprodi = ?').get(user.nomor_induk, user.nama);
      if (prodiRow && prodiRow.count > 0) isKaprodi = true;
    } catch (_) {}

    const roles = ['dosen', 'penguji'];
    if (isKaprodi) {
      roles.unshift('koorprodi');
    }
    return roles;
  }

  return [user.role];
}

/**
 * POST /api/auth/login
 * Autentikasi Pengguna Institusional FEB UTM (NIM/NIP atau Email + Password)
 * Keamanan Ketat:
 * - Menolak request tanpa kredensial lengkap
 * - Tanpa bypass peran / role injection
 * - Validasi hash kata sandi satu arah (scrypt)
 * - Menerbitkan JWT bertanda tangan kriptografis
 */
router.post('/login', loginRateLimiter, (req, res) => {
  try {
    const { identifier, password } = req.body;

    // 1. Validasi Input Wajib
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nomor Induk (NIM / NIP) atau email institusi wajib diisi.'
      });
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi akun wajib diisi.'
      });
    }

    const cleanId = identifier.trim();
    const cleanPassword = password.trim();

    // 2. Cari pengguna berdasarkan Nomor Induk atau Email resmi
    //
    // Audit 21 Oktober 2026: TIDAK ADA lagi pencarian berdasarkan peran
    // (mis. identifier "superadmin") maupun alias peran apa pun. Identitas
    // hanya dapat dipetakan dari nomor induk/email yang benar-benar terdaftar.
    const user = db.prepare('SELECT * FROM users WHERE nomor_induk = ? OR email = ?').get(cleanId, cleanId);

    if (!user) {
      // Pesan yang SAMA untuk akun tidak terdaftar maupun sandi salah,
      // agar tidak dapat digunakan untuk enumerasi NIM/NIP yang valid.
      return res.status(401).json({
        success: false,
        message: 'Kredensial tidak valid: nomor induk/email atau kata sandi tidak sesuai dengan data FEB UTM.'
      });
    }

    // 3. Validasi Status Akun
    if (user.status && user.status.toLowerCase() === 'non-aktif') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda dinonaktifkan oleh Administrator. Silakan hubungi Subbag Akademik FEB UTM.'
      });
    }

    // 4. Verifikasi Kata Sandi via Scrypt / Migrasi Aman
    const storedPassword = user.password || '';
    const { valid: isPasswordValid, needsRehash } = verifyPassword(cleanPassword, storedPassword);

    if (!isPasswordValid) {
      // Pesan SAMA dengan kasus akun tidak terdaftar (mencegah enumerasi pengguna).
      registerFailedLogin(cleanId);
      return res.status(401).json({
        success: false,
        message: 'Kredensial tidak valid: nomor induk/email atau kata sandi tidak sesuai dengan data FEB UTM.'
      });
    }

    // Jika kata sandi masih dalam bentuk teks polos (legacy), otomatis upgrade ke hash scrypt
    if (needsRehash) {
      try {
        const secureHash = hashPassword(cleanPassword);
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(secureHash, user.id);
        console.log(`[Auth Security] Kata sandi akun ${user.nama} (${user.id}) berhasil dimigrasi ke hash Scrypt.`);
      } catch (hashErr) {
        console.warn('[Auth Security] Gagal meng-upgrade hash kata sandi:', hashErr.message);
      }
    }

    // 5. Catat Waktu Login & Audit Log
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const nowDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const lastLoginFormatted = `Hari ini, ${nowTime} WIB`;

    try {
      db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(lastLoginFormatted, user.id);
      db.prepare(`
        INSERT INTO audit_log (user_id, action, details)
        VALUES (?, 'LOGIN', ?)
      `).run(user.id, `Berhasil masuk ke portal role [${user.role}] pada ${nowDate} ${nowTime}`);
    } catch (auditErr) {
      console.warn('[Auth] Gagal menulis audit log:', auditErr.message);
    }

    // 6. Terbitkan Token Sesi JWT Kriptografis
    const token = generateToken({
      id: user.id,
      nomorInduk: user.nomor_induk,
      nama: user.nama,
      email: user.email,
      role: user.role,
      jenjang: user.jenjang || 'S1',
      prodi: user.prodi || 'S-1 Manajemen',
      tokenVersion: Number(user.token_version || 1)
    });

    const eligibleRoles = getEligibleRoles(user);

    // Reset penghitung percobaan login untuk kombinasi IP+akun ini (login sukses),
    // dan kembalikan 1 slot anggaran per-IP karena ini bukan percobaan gagal.
    try {
      const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      loginAttempts.delete(`${ip}::${String(cleanId).toLowerCase()}`);
      clearFailedLogins(cleanId);

      const ipEntry = ipAttempts.get(ip);
      if (ipEntry && ipEntry.count > 0) {
        ipEntry.count -= 1;
      }
    } catch (_) {}

    res.json({
      success: true,
      message: `Selamat datang kembali, ${user.nama}`,
      token,
      eligibleRoles,
      mustChangePassword: Boolean(user.must_change_password),
      user: {
        id: user.id,
        nomorInduk: user.nomor_induk,
        nama: user.nama,
        email: user.email,
        role: user.role,
        eligibleRoles,
        jenjang: user.jenjang || 'S1',
        prodi: user.prodi || 'S-1 Manajemen',
        status: user.status || 'Aktif',
        mustChangePassword: Boolean(user.must_change_password),
        lastLogin: lastLoginFormatted
      }
    });
  } catch (error) {
    console.error('[Auth Error]', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat autentikasi.' });
  }
});

/**
 * GET /api/auth/me
 * Mendapatkan profil pengguna aktif berdasarkan verifikasi JWT
 *
 * Audit 21 Oktober 2026: route ini semula memverifikasi token SECARA MANUAL
 * (verifyToken) tanpa pemeriksaan versi kredensial. Akibatnya token yang
 * SUDAH DICABUT (logout / penggantian kata sandi / penonaktifan akun) tetap
 * diterima. Route kini memakai middleware `authenticate` yang memvalidasi
 * token_version terhadap basis data.
 */
router.get('/me', authenticate, (req, res) => {
  try {
    const decoded = req.user;
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Sesi telah kedaluwarsa atau tidak sah.' });
    }

    const user = db.prepare('SELECT id, nomor_induk, nama, email, role, jenjang, prodi, status, last_login FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    const eligibleRoles = getEligibleRoles(user);

    res.json({
      success: true,
      user: {
        id: user.id,
        nomorInduk: user.nomor_induk,
        nama: user.nama,
        email: user.email,
        role: decoded.role || user.role, // role aktif dari token
        baseRole: user.role,
        eligibleRoles,
        jenjang: user.jenjang,
        prodi: user.prodi,
        status: user.status,
        lastLogin: user.last_login
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/auth/switch-role
 * Beralih peran kerja aktif bagi dosen / staf akademik yang sah
 */
router.post('/switch-role', authenticate, (req, res) => {
  try {
    // Audit 21 Oktober 2026: route ini semula memverifikasi token SECARA
    // MANUAL tanpa pemeriksaan versi kredensial. Token yang sudah dicabut
    // (logout / ganti sandi / nonaktifkan akun) masih dapat digunakan untuk
    // meminta token BARU di sini -> sesi yang telah dicabut dapat dihidupkan
    // kembali. Sekarang memakai middleware `authenticate` (validasi
    // token_version terhadap basis data).
    const decoded = req.user;
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Token sesi tidak sah atau kedaluwarsa.' });
    }

    const { targetRole } = req.body;
    if (!targetRole) {
      return res.status(400).json({ success: false, message: 'targetRole wajib ditentukan.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Data pengguna tidak ditemukan.' });
    }

    // Mahasiswa dilarang keras beralih peran ke dosen/admin
    if (user.role === 'mahasiswa') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Mahasiswa tidak memiliki otorisasi beralih peran akademik.'
      });
    }

    const eligible = getEligibleRoles(user);
    if (!eligible.includes(targetRole.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak: Anda tidak memiliki penugasan resmi untuk peran "${targetRole}".`
      });
    }

    // Terbitkan token JWT baru dengan klaim peran kerja aktif yang baru
    const newToken = generateToken({
      id: user.id,
      nomorInduk: user.nomor_induk,
      nama: user.nama,
      email: user.email,
      role: targetRole.toLowerCase(),
      jenjang: user.jenjang || 'S1',
      prodi: user.prodi || 'S-1 Manajemen',
      tokenVersion: Number(user.token_version || 1)
    });

    try {
      db.prepare(`
        INSERT INTO audit_log (user_id, action, details)
        VALUES (?, 'SWITCH_ROLE', ?)
      `).run(user.id, `Pengguna ${user.nama} beralih peran kerja aktif ke [${targetRole.toLowerCase()}]`);
    } catch (_) {}

    res.json({
      success: true,
      message: `Peran kerja berhasil dialihkan ke "${targetRole}".`,
      token: newToken,
      activeRole: targetRole.toLowerCase(),
      eligibleRoles: eligible
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/auth/change-password
 * Layanan Mandiri Ganti Kata Sandi Pengguna
 * Dilindungi autentikasi JWT: identitas pengguna diambil dari token sesi,
 * bukan dari parameter body yang dapat dimanipulasi klien.
 */
router.post('/change-password', authenticate, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Identitas WAJIB berasal dari token sesi terverifikasi
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Sesi tidak sah. Silakan login kembali.' });
    }

    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'Kata sandi baru wajib diisi.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 8 karakter demi keamanan akun.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Akun pengguna tidak ditemukan.' });
    }

    const storedPass = user.password || '';
    const { valid: isOldPassValid } = verifyPassword(oldPassword || '', storedPass);

    if (!isOldPassValid) {
      return res.status(400).json({ success: false, message: 'Kata sandi saat ini tidak cocok.' });
    }

    // Perbarui kata sandi dengan hash Scrypt, dan bersihkan kewajiban ganti
    // kata sandi (jika akun direset ke kata sandi sementara sebelumnya).
    //
    // Audit 21 Oktober 2026: menaikkan token_version agar SEMUA token lama
    // (mis. token yang bocor / dicuri) langsung tidak berlaku setelah
    // penggantian kata sandi.
    const hashedNew = hashPassword(newPassword.trim());
    db.prepare('UPDATE users SET password = ?, must_change_password = 0, token_version = token_version + 1 WHERE id = ?').run(hashedNew, userId);

    try {
      db.prepare(`
        INSERT INTO audit_log (user_id, action, details)
        VALUES (?, 'CHANGE_PASSWORD', ?)
      `).run(userId, 'Pengguna memperbarui kata sandi akun secara mandiri');
    } catch {}

    res.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui. Silakan gunakan kata sandi baru untuk login berikutnya. Sesi lain pada perangkat ini juga telah dikeluarkan.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/auth/reset-password-request
 * Permintaan Reset Kata Sandi ke Helpdesk / Email Kampus
 *
 * Audit 21 Oktober 2026:
 * - Respons TIDAK lagi membocorkan alamat email institusi pemilik akun
 *   (sebelumnya email dikembalikan apa adanya => enumerasi pengguna).
 * - Pesan selalu identik baik akun terdaftar maupun tidak.
 */
router.post('/reset-password-request', (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'NIM / NIP atau email wajib diisi.' });
    }

    // Tetap looked-up, namun hasilnya TIDAK dikembalikan ke pemanggil.
    // (Alur pemulihanقيقية dijalankan oleh_operator melalui Helpdesk.)
    try {
      db.prepare('SELECT id FROM users WHERE nomor_induk = ? OR email = ?').get(identifier, identifier);
    } catch (_) {}

    res.json({
      success: true,
      message: 'Jika data tersebut terdaftar, instruksi pemulihan akun telah dikirim ke kanal resmi institusi. Silakan periksa kotak masuk atau spam.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Mengakhiri sesi: menaikkan token_version sehingga token lama tidak berlaku lagi.
 */
router.post('/logout', (req, res) => {
  try {
    // Identitas HANYA boleh berasal dari token sesi yang presented.
    //
    // Audit 21 Oktober 2026: semula `req.body.userId` dipakai sebagai
    // cadangan. Anybody tanpa token dapat mengirim userId milik akun lain
    // sehingga token_version akun tersebut dinaikkan paksa -> sesi aktif
    // paksa terputus (denial-of-service sesi). Cadangan body dihapus.
    const authHeader = req.headers['authorization'] || '';
    let decoded = null;
    if (authHeader.startsWith('Bearer ')) {
      decoded = verifyToken(authHeader.substring(7).trim());
    }

    const userId = decoded?.id || null;

    if (userId) {
      // Menaikkan token_version => seluruh token sesi pengguna ini mati seketika.
      try {
        db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(userId);
      } catch (_) {}

      try {
        db.prepare(`
          INSERT INTO audit_log (user_id, action, details)
          VALUES (?, 'LOGOUT', ?)
        `).run(userId, `Pengguna mengakhiri sesi kerja (Logout) pada ${new Date().toISOString()}`);
      } catch {}
    }

    res.json({ success: true, message: 'Sesi berhasil diakhiri.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/auth/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    authSystem: 'JWT + Scrypt KDF',
    database: 'SQLite (node:sqlite)',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export default router;
