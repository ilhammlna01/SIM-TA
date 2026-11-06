/**
 * Pemuat Konfigurasi Lingkungan (Environment Loader) — HARUS DI-IMPOR PERTAMA.
 *
 * Latar Belakang (Audit 21 Oktober 2026 — Temuan Operasional P0):
 * Pada ES Module, seluruh `import` statis dievaluasi SEBELUM badan modul
 * dijalankan. `server/index.js` semula memanggil `dotenv.config()` di badan
 * modul, padahal `server/utils/jwt.js` (yang dievaluasi lebih awal melalui
 * rantai import) membaca `process.env.JWT_SECRET` dan `process.env.NODE_ENV`
 * pada level modul.
 *
 * Akibatnya:
 *   - Nilai JWT_SECRET pada berkas `.env` DIABAIKAN; server memakai secret
 *     acak per-proses => seluruh token mati setiap restart.
 *   - Pemeriksaan "produksi tanpa JWT_SECRET => server menolak start" tidak
 *     pernah aktif, karena NODE_ENV belum terbaca saat modul jwt.js dimuat.
 *
 * Modul ini memuat `.env` ke `process.env` sebagai EFEK SISI, dan HARUS
 * menjadi import pertama pada setiap titik masuk (entry point) aplikasi.
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Mode operasi default.
 *
 * Audit 21 Oktober 2026: `NODE_ENV=production` TIDAK lagi ditulis di berkas
 * `.env` karena Vite menolaknya ("NODE_ENV=production is not supported in the
 * .env file") sehingga `vite dev` complained. Aplikasi ini adalah sistem
 * self-hosted yang secara default dideploy sebagai mode produksi, sehingga bila
 * `NODE_ENV` tidak disetel, nilainya ditetapkan ke `production` di sini.
 *
 * Konsekuensi: `npm start` tanpa `JWT_SECRET` tetap berhenti (fail-closed),
 * sementara `vite dev` tidak lagi menampilkan peringatan.
 */
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

/**
 * Mode produksi dibaca SETELAH .env termuat, sehingga selalu akurat.
 */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Mengambil URL publik aplikasi (dipakai tautan QR dokumen resmi & email).
 */
export function getAppBaseUrl() {
  const explicit = process.env.APP_PUBLIC_URL;
  if (explicit && explicit.trim()) return explicit.trim().replace(/\/+$/, '');
  const port = process.env.PORT || 5001;
  return `http://localhost:${port}`;
}

export default { IS_PRODUCTION, getAppBaseUrl };
