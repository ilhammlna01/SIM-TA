/**
 * Utilitas pemrosesan payload permintaan HTTP.
 *
 * Audit 21 Oktober 2026 (Simulasi Proses A–Z): beberapa endpoint admin
 * meneruskan nilai `undefined` secara langsung ke driver SQLite. Akibatnya
 * permintaan dengan nama field yang berbeda atau field yang tidak dikirim
 * berakhir sebagai HTTP 500 "Provided value cannot be bound to SQLite
 * parameter N" — pesan yang tidak membantu pengguna dan menyamar sebagai
 * kegagalan server, bukan kesalahan validasi.
 *
 * Modul ini menyediakan:
 *   - pickField()  : mengambil nilai pertama yang terisi dari beberapa alias
 *                    nama field (camelCase maupun snake_case).
 *   - requireField(): memvalidasi bahwa field wajib terisi, mengembalikan
 *                    daftar field yang kurang lengkap agar server dapat
 *                    membalas 400 dengan pesan yang jelas.
 */

/**
 * Ambil nilai pertama yang benar-benar terisi dari sekumpulan nama field.
 *
 * @param {object} body
 * @param {...string} keys nama field (urutan prioritas)
 * @returns {*} nilai pertama yang terisi, atau undefined
 */
export function pickField(body, ...keys) {
  if (!body || typeof body !== 'object') return undefined;
  for (const key of keys) {
    const v = body[key];
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    return v;
  }
  return undefined;
}

/**
 * Validasi field wajib. Mengembalikan { ok, values, missing }.
 *
 * @param {object} body
 * @param {Array<{names: string[], label: string}>} spec
 * @returns {{ok: boolean, values: object, missing: string[]}}
 */
export function requireFields(body, spec) {
  const values = {};
  const missing = [];

  for (const field of spec) {
    const value = pickField(body, ...field.names);
    if (value === undefined || value === null || value === '') {
      missing.push(field.label || field.names[0]);
    } else {
      values[field.names[0]] = value;
    }
  }

  return { ok: missing.length === 0, values, missing };
}

/**
 * Ubah nilai menjadi teks aman untuk SQLite (null bila kosong).
 */
export function toText(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  const s = String(value).trim();
  return s === '' ? fallback : s;
}

/**
 * Ubah nilai menjadi angka, atau fallback bila bukan angka valid.
 */
export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default { pickField, requireFields, toText, toNumber };
