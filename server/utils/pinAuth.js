/**
 * Otorisasi PIN Dekanat — SIM-TA FEB UTM
 *
 * Audit 22 Oktober 2026 (temuan AZ-A2c / butir #1):
 * Halaman Penerbitan Massal sebelumnya HANYA BERHANTAR di sisi peramban:
 * `if (pinInput === '123456' || pinInput.length >= 4)` — PIN apa pun sepanjang
 * empat karakter atau lebih DITERIMA sebagai otorisasi Dekan, dan "background
 * queue" yang ditampilkan hanyalah simulasi setTimeout. Tidak ada satu pun
 * dokumen yang pernah disimpan, namun antarmuka menampilkan notifikasi
 * "berhasil" sehingga administrator salah believing bahwa SK sudah terbit.
 *
 * Modul ini menyediakan otorisasi yang SESUNGGUHNYA:
 *   1. PIN Dekan disimpan sebagai HASH (scrypt + salt per-pin), bukan teks polos.
 *   2. Verifikasi memakai perbandingan waktu-tetap (timingSafeEqual).
 *   3. Percobaan gagal dibatasi dan memicu LOCKOUT akun sementara.
 *   4. Setiap percobaan (berhasil maupun gagal) dicatat ke audit_log.
 *   5. Verifikasi yang berhasil menerbitkan TOKEN BERLAMBAT (scope 'sk-bulk')
 *      yang harus disertakan pada permintaan penerbitan massal. Dengan begitu PIN
 *      tidak pernah perlu dikirim ulang, dan peramban tidak dapat memalsukan
 *      penerbitan.
 */

import crypto from 'node:crypto';
import db from '../database/db.js';
import { hashPassword } from './password.js';
import { generateScopedToken, verifyScopedToken } from './jwt.js';

const KONTEKS_DEFAULT = 'dekanat';
const MAX_ATTEMPT = Number(process.env.PIN_MAX_ATTEMPT || 5);
const LOCK_MS = Number(process.env.PIN_LOCK_MS || 10 * 60 * 1000);
const TOKEN_TTL = process.env.PIN_TOKEN_TTL || '10m';

const PIN_HASH_SALT_ROUNDS = 16;

/**
 * Menyiapkan tabel penyimpanan hash PIN (idempoten).
 */
export function initPinTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pin_otorisasi (
      konteks TEXT PRIMARY KEY,
      pin_hash TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    )
  `);
  initPinAttemptTable();
}

/**
 * Menyimpan hash PIN untuk sebuah konteks (mis. 'dekanat').
 * @param {string} konteks
 * @param {string} pin  PIN teks polos (hanya dibaca pada saat penetapan)
 * @param {string} oleh  NIPAdmin yang menetapkan
 */
export function setPin(konteks, pin, oleh = null) {
  initPinTable();
  const clean = String(pin || '').trim();
  if (!clean) throw new Error('PIN tidak boleh kosong.');

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(clean, salt, 64, { N: PIN_HASH_SALT_ROUNDS }).toString('hex');
  const stored = `${salt}:${hash}`;

  db.prepare(
    `INSERT INTO pin_otorisasi (konteks, pin_hash, updated_at, updated_by)
     VALUES (?, ?, CURRENT_TIMESTAMP, ?)
     ON CONFLICT(konteks) DO UPDATE SET
       pin_hash = excluded.pin_hash,
       updated_at = CURRENT_TIMESTAMP,
       updated_by = excluded.updated_by`
  ).run(konteks, stored, oleh);

  return true;
}

/**
 * Membaca hash PIN yang tersimpan.
 */
export function getPinHash(konteks = KONTEKS_DEFAULT) {
  initPinTable();
  const row = db.prepare('SELECT pin_hash FROM pin_otorisasi WHERE konteks = ?').get(konteks);
  return row?.pin_hash || null;
}

/**
 * Verifikasi PIN secara waktu-tetap.
 * @returns {boolean}
 */
export function verifyPin(pin, konteks = KONTEKS_DEFAULT) {
  const stored = getPinHash(konteks);
  if (!stored) return false;

  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;

  let candidate;
  try {
    candidate = crypto.scryptSync(String(pin || ''), salt, 64, { N: PIN_HASH_SALT_ROUNDS }).toString('hex');
  } catch (_) {
    return false;
  }

  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Melakukan verifikasi lengkap: cek lockout -> cek PIN -> catat audit ->
 * terbitkan token scoped bila benar.
 *
 * @returns {{ok: boolean, message: string, token?: string, expiresIn?: number, kode?: string}}
 */
export function verifikasiPinDenganToken(pin, { konteks = KONTEKS_DEFAULT, oleh = null, ip = '-' } = {}) {
  initPinTable();

  // 1. Lockout
  const attempts = db.prepare('SELECT jumlah, terakhir_at FROM percobaan_pin WHERE konteks = ?').get(konteks);
  if (attempts?.jumlah >= MAX_ATTEMPT) {
    const sejak = attempts.terakhir_at ? new Date(attempts.terakhir_at).getTime() : 0;
    const sisaMs = LOCK_MS - (Date.now() - sejak);
    if (sisaMs > 0) {
      catatOtorisasi('PIN_LOCKOUT', `Otorisasi ditolak: akun terkunci (sisa ${Math.ceil(sisaMs / 1000)} dtk)`, oleh, ip, konteks);
      return {
        ok: false,
        kode: 'PIN_LOCKED',
        message: `PIN terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(sisaMs / 1000)} detik.`
      };
    }
  }

  // 2. Verifikasi
  const benar = verifyPin(pin, konteks);
  const maks = getPinHash(konteks);

  if (!maks) {
    catatOtorisasi('PIN_NOT_CONFIGURED', 'Otorisasi ditolak: PIN belum ditetapkan oleh administrator sistem', oleh, ip, konteks);
    return {
      ok: false,
      kode: 'PIN_NOT_CONFIGURED',
      message: 'PIN Dekanat belum ditetapkan. Administrator sistem harus mengaturnya terlebih dahulu.'
    };
  }

  if (!benar) {
    db.prepare(
      `INSERT INTO percobaan_pin (konteks, jumlah, terakhir_at) VALUES (?, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(konteks) DO UPDATE SET jumlah = jumlah + 1, terakhir_at = CURRENT_TIMESTAMP`
    ).run(konteks);
    catatOtorisasi('PIN_FAILED', 'Otorisasi ditolak: PIN Dekanat salah', oleh, ip, konteks);
    return { ok: false, kode: 'PIN_INVALID', message: 'PIN otorisasi Dekanat tidak cocok.' };
  }

  // 3. Berhasil -> reset penghitung & terbitkan token scoped
  db.prepare('DELETE FROM percobaan_pin WHERE konteks = ?').run(konteks);
  catatOtorisasi('PIN_GRANTED', 'Otorisasi Dekanat berhasil diverifikasi', oleh, ip, konteks);

  const token = generateScopedToken(
    {
      userId: oleh || 'unknown',
      nip: oleh || 'unknown',
      role: 'koorprodi',
      purpose: 'sk-bulk',
      scope: { konteks }
    },
    TOKEN_TTL
  );

  return { ok: true, token, expiresIn: TOKEN_TTL, message: 'Otorisasi Dekanat sah.' };
}

/**
 * Memastikan token scoped untuk penerbitan massal masih valid.
 * @returns {{ok: boolean, kode?: string, message?: string}}
 */
export function verifikasiTokenPenerbitan(token, konteks = KONTEKS_DEFAULT) {
  if (!token) {
    return { ok: false, kode: 'PIN_TOKEN_REQUIRED', message: 'Token otorisasi Dekanat wajib disertakan.' };
  }
  const decoded = verifyScopedToken(token, 'sk-bulk', { konteks });
  if (!decoded) {
    return {
      ok: false,
      kode: 'PIN_TOKEN_INVALID',
      message: 'Token otorisasi Dekanat tidak valid atau sudah kedaluwarsa. Silakan verifikasi ulang PIN.'
    };
  }
  return { ok: true, decoded };
}

/**
 * Mencatat percobaan otorisasi ke audit_log.
 */
function catatOtorisasi(aksi, detail, oleh, ip, konteks) {
  try {
    db.prepare(
      'INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)'
    ).run(oleh || 'unknown', aksi, `[konteks=${konteks}] [ip=${ip}] ${detail}`);
  } catch (_) {
    // ignore
  }
}

/**
 * Menyiapkan tabel penghitung percobaan PIN (idempoten).
 */
function initPinAttemptTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS percobaan_pin (
      konteks TEXT PRIMARY KEY,
      jumlah INTEGER DEFAULT 0,
      terakhir_at TEXT
    )
  `);
}

export const PIN_KONTEKS_DEKANAT = KONTEKS_DEFAULT;
export const PIN_TOKEN_TTL_DEFAULT = TOKEN_TTL;
