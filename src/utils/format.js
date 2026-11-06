/**
 * Format Utilities — SIM Tugas Akhir FEB UTM
 *
 * Pemformatan tanggal, waktu, dan angka yang konsisten di seluruh aplikasi.
 * Semua menggunakan locale 'id-ID' agar penulisan seragam (mis. "5 Januari 2026").
 */

const LOCALE = 'id-ID';

/**
 * Tanggal panjang institusional: "5 Januari 2026".
 * @param {string|number|Date} value
 * @param {string} [fallback='-'] Nilai pengganti bila tanggal tidak valid.
 */
export function formatTanggal(value, fallback = '-') {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Tanggal ringkas: "05 Jan 2026".
 * @param {string|number|Date} value
 * @param {string} [fallback='-']
 */
export function formatTanggalSingkat(value, fallback = '-') {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Waktu 24 jam: "14:30".
 * @param {string|number|Date} value
 * @param {string} [fallback='-']
 */
export function formatWaktu(value, fallback = '-') {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Waktu 24 jam dengan detik: "14:30:05".
 * @param {string|number|Date} value
 * @param {string} [fallback='-']
 */
export function formatWaktuDetik(value, fallback = '-') {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
