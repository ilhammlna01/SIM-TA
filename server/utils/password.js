/**
 * Cryptographic Password Utility - SIM Tugas Akhir FEB UTM
 * Menggunakan algoritma Node.js native scrypt dengan garam (salt) kriptografis unik.
 * Mencegah kebocoran kata sandi dalam bentuk plaintext.
 */

import crypto from 'node:crypto';

const KEY_LEN = 64;

/**
 * Hashing kata sandi menggunakan Scrypt KDF + random salt
 * @param {string} password - Kata sandi teks polos
 * @returns {string} Format: "salt:hash"
 */
export function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Kata sandi wajib berupa string non-kosong.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LEN);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Membuat kata sandi sementara yang acak & kuat.
 * Dipakai untuk bootstrap akun awal dan reset kata sandi superadmin.
 * Setiap hasil unik — TIDAK ada kata sandi bersama/seragam antar akun.
 */
export function generateTemporaryPassword() {
  // 12 karakter base64url dari 9 byte acak + sufiks agar memenuhi syarat kompleksitas.
  const random = crypto.randomBytes(9).toString('base64url');
  return `TA-${random}1A`;
}

/**
 * Verifikasi kata sandi terhadap hash tersimpan
 * Mendukung transisi aman jika data lama masih berformat plaintext.
 * @param {string} password - Kata sandi yang dimasukkan pengguna
 * @param {string} storedHash - Hash yang tersimpan di basis data (atau nilai legacy)
 * @returns {{ valid: boolean, needsRehash: boolean }}
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return { valid: false, needsRehash: false };
  }

  // Format scrypt standar: "salt:hash"
  if (storedHash.includes(':')) {
    try {
      const [salt, originalHex] = storedHash.split(':');
      if (!salt || !originalHex) {
        return { valid: false, needsRehash: false };
      }
      const testKey = crypto.scryptSync(password, salt, KEY_LEN);
      const testBuffer = Buffer.from(testKey.toString('hex'), 'hex');
      const originalBuffer = Buffer.from(originalHex, 'hex');

      if (testBuffer.length !== originalBuffer.length) {
        return { valid: false, needsRehash: false };
      }

      const valid = crypto.timingSafeEqual(testBuffer, originalBuffer);
      return { valid, needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // Fallback legacy migration: Jika kata sandi masih berformat plaintext di DB lama
  const legacyMatch = password === storedHash;
  return { valid: legacyMatch, needsRehash: legacyMatch };
}

export default {
  hashPassword,
  verifyPassword,
  generateTemporaryPassword
};
