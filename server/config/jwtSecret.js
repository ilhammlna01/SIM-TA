/**
 * Resolusi & Validasi Kunci Rahasia JWT (Pusat Tunggal).
 *
 * Dipisah dari `server/utils/jwt.js` agar:
 *   1. Pemeriksaan produksi (fail-closed) dapat dijalankan di titik masuk
 *      aplikasi SETELAH `.env` termuat.
 *   2. `jwt.js` dapat menyelesaikan secret secara LAMBAT (lazily) sehingga
 *      tidak lagi bergantung pada urutan evaluasi modul ESM.
 */

import crypto from 'node:crypto';

// Pola nilai contoh/placeholder yang sering disalin dari .env.example.
// Nilai-nilai ini DILARANG dipakai karena diketahui publik di repositori.
const PLACEHOLDER_PATTERNS = [
  'ubah_dengan',
  'ganti_dengan',
  'changeme',
  'change_me',
  'placeholder',
  'example',
  'contoh',
  'rahasia_minimal',
  'your_secret',
  'secret_key_here'
];

export function looksLikePlaceholder(value) {
  const lower = String(value).toLowerCase();
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p));
}

// Nilai berulang sederhana (mis. "aaaa...", "1234...") berentropi sangat rendah.
export function isLowEntropy(value) {
  return /^(.)\1+$/.test(value) || /^(0123456789|abcdefghijklmnopqrstuvwxyz)+$/i.test(value);
}

/**
 * Menyelesaikan kunci rahasia JWT.
 * - Produksi: WAJIB tersedia di environment, min. 32 karakter, bukan placeholder,
 *   dan bukan entropi rendah. Jika tidak -> error (fail-closed).
 * - Non-produksi: secret acak per-proses + peringatan.
 *
 * @param {string} [nodeEnv] Nilai NODE_ENV (default: process.env.NODE_ENV)
 * @returns {string} Kunci rahasia JWT
 */
export function resolveJwtSecret(nodeEnv = process.env.NODE_ENV) {
  const fromEnv = process.env.JWT_SECRET;

  if (fromEnv && fromEnv.trim().length > 0) {
    const candidate = fromEnv.trim();

    if (candidate.length < 32) {
      throw new Error(
        '[Security] JWT_SECRET terlalu lemah (minimal 32 karakter). Setel ulang di berkas .env.'
      );
    }

    if (looksLikePlaceholder(candidate)) {
      throw new Error(
        '[Security] JWT_SECRET masih memakai nilai contoh/placeholder dari .env.example. ' +
        'Ganti dengan nilai acak rahasia (mis. hasil `openssl rand -hex 32`).'
      );
    }

    if (isLowEntropy(candidate)) {
      throw new Error(
        '[Security] JWT_SECRET memiliki entropi terlalu rendah. Gunakan nilai acak (mis. `openssl rand -hex 32`).'
      );
    }

    return candidate;
  }

  if (nodeEnv === 'production') {
    throw new Error(
      '[Security] JWT_SECRET tidak disetel. Aplikasi DILARANG berjalan di produksi tanpa ' +
      'JWT_SECRET yang kuat (min. 32 karakter). Contoh: JWT_SECRET="<hasil `openssl rand -hex 32`>".'
    );
  }

  // Lingkungan pengembangan/pengujian: secret acak per-proses (bukan nilai statis repo).
  console.warn(
    '[Security Warning] JWT_SECRET tidak disetel. Menggunakan secret acak sementara untuk mode non-produksi. ' +
    'Token akan tidak valid setelah server dimulai ulang.'
  );
  return crypto.randomBytes(48).toString('hex');
}

/**
 * Fail-closed startup check untuk mode produksi.
 * Dipanggil dari titik masuk aplikasi SESUDAH `.env` dimuat.
 */
export function assertProductionJwtSecret() {
  if (process.env.NODE_ENV === 'production') {
    // Melempar error bila tidak valid (tidak ditangkap).
    resolveJwtSecret('production');
  }
}

export default {
  looksLikePlaceholder,
  isLowEntropy,
  resolveJwtSecret,
  assertProductionJwtSecret
};
