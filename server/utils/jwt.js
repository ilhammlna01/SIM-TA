/**
 * JWT Authentication Utility - SIM Tugas Akhir FEB UTM
 * Mengelola penerbitan dan verifikasi JSON Web Token (JWT) kriptografis.
 */

import jwt from 'jsonwebtoken';
import { resolveJwtSecret } from '../config/jwtSecret.js';

/**
 * Kunci rahasia institusional WAJIB berasal dari variabel lingkungan (JWT_SECRET).
 * Tidak ada lagi fallback hardcoded di berkas sumber: string statis di repositori
 * memungkinkan siapa pun memalsukan token Super Admin (HS256).
 *
 * - Produksi (NODE_ENV=production): server MENOLAK berjalan tanpa JWT_SECRET yang kuat.
 * - Non-produksi (dev/test): gunakan secret acak per-proses agar tidak ada nilai tetap
 *   di dalam repositori, disertai peringatan jelas.
 *
 * Audit 21 Oktober 2026: resolusi dilakukan secara LAZY (on-demand) & di-cache,
 * bukan pada level modul. Sebelumnya secret diselesaikan saat modul dievaluasi,
 * yaitu SEBELUM `dotenv.config()` dijalankan pada titik masuk â€” sehingga nilai
 * `.env` diabaikan dan server diam-diam memakai secret acak per-proses.
 */
let cachedSecret = null;

function getJwtSecret() {
  if (cachedSecret === null) {
    cachedSecret = resolveJwtSecret(process.env.NODE_ENV);
  }
  return cachedSecret;
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Menerbitkan token JWT untuk pengguna yang terautentikasi
 * @param {Object} userPayload - Data klaim pengguna (id, nomorInduk, nama, role, dll.)
 * @returns {string} Token JWT bertanda tangan
 */
export function generateToken(userPayload) {
  if (!userPayload || typeof userPayload !== 'object') {
    throw new Error('Payload pengguna tidak valid untuk penerbitan token.');
  }

  const claims = {
    id: userPayload.id,
    nomorInduk: userPayload.nomorInduk || userPayload.nomor_induk,
    nama: userPayload.nama,
    email: userPayload.email,
    role: userPayload.role,
    jenjang: userPayload.jenjang,
    prodi: userPayload.prodi,
    // Versi kredensial: dinaikkan setiap kali peran/akun/kata sandi berubah.
    // Token yang membawa versi lama otomatis ditolak saat verifikasi.
    tv: Number(userPayload.tokenVersion ?? userPayload.token_version ?? 0)
  };

  return jwt.sign(claims, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256'
  });
}

/**
 * Menerbitkan token SINGKAT-PURPOSE (scoped token).
 *
 * Token ini TIDAK untuk otentikasi umum; hanya untuk satu aksi tertentu:
 *  - 'file-download': membuka satu berkas tertentu (category + filename), berlaku 2 menit.
 *  - 'sse-stream'   : membuka aliran notifikasi milik satu pengguna, berlaku 10 menit.
 *
 * Keuntungan: kredensial sesi (JWT 8 jam) tidak pernah muncul di URL,
 * log akses proxy, atau riwayat peramban.
 */
export function generateScopedToken({ userId, nip, role, tokenVersion = 0, purpose, scope = {} }, ttl = '2m') {
  if (!purpose) {
    throw new Error('Purpose wajib diisi untuk scoped token.');
  }
  return jwt.sign(
    {
      sub: userId,
      nip: nip || userId,
      role,
      tv: Number(tokenVersion || 0),
      purpose,
      scope
    },
    getJwtSecret(),
    { expiresIn: ttl, algorithm: 'HS256' }
  );
}

/**
 * Verifikasi scoped token: memastikan purpose cocok dan (bila ada) scope terikat.
 * @param {string} token
 * @param {string} purpose Purpose yang diharapkan
 * @param {Object} expectedScope Nilai scope yang harus dicocokkan (mis. { category, filename })
 */
export function verifyScopedToken(token, purpose, expectedScope = null) {
  if (!token || typeof token !== 'string') return null;

  let decoded = null;
  try {
    decoded = jwt.verify(token.trim(), getJwtSecret(), { algorithms: ['HS256'] });
  } catch {
    return null;
  }

  if (!decoded || decoded.purpose !== purpose) return null;

  if (expectedScope) {
    for (const key of Object.keys(expectedScope)) {
      if (decoded.scope?.[key] !== expectedScope[key]) return null;
    }
  }

  return decoded;
}

/**
 * Verifikasi integritas tanda tangan dan masa berlaku token JWT
 * @param {string} token - Token JWT dari header Authorization
 * @returns {Object|null} Payload pengguna jika sah, null jika palsu/kedaluwarsa
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    return jwt.verify(cleanToken, getJwtSecret(), { algorithms: ['HS256'] });
  } catch (err) {
    return null;
  }
}

export default {
  generateToken,
  verifyToken,
  generateScopedToken,
  verifyScopedToken
};

