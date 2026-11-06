/**
 * Inisialisasi Otorisasi PIN Dekanat — SIM-TA FEB UTM
 *
 * Audit 22 Oktober 2026 (butir #1): PIN Dekanat tidak boleh berupa teks polos
 * di basis data, dan tidak boleh "123456" yang Receive hardcoded di antarmuka.
 * PIN disimpan sebagai hash scrypt + salt per-PIN
 * (`server/utils/pinAuth.js`).
 *
 * Sumber PIN: variabel lingkungan `DEKAN_PIN`. Bila tidak disetel:
 *   - mode produksi  : PIN TIDAK ditetapkan (fitur menolak sampai
 *     administrator sistem mengaturnya) — konsisten dengan JWT_SECRET.
 *   - mode non-produksi: dipakai PIN pengembangan, dicetak di log dengan
 *     peringatan keras, agar fitur tetap dapat dicoba secara lokal.
 */

import { initPinTable, setPin, getPinHash, PIN_KONTEKS_DEKANAT } from '../utils/pinAuth.js';

export function initPinOtorisasi() {
  try {
    initPinTable();

    if (getPinHash(PIN_KONTEKS_DEKANAT)) {
      console.log('[Otorisasi] PIN Dekanat sudah ditetapkan (hash Scrypt).');
      return { ok: true, sudahDiatur: true };
    }

    const dariEnv = String(process.env.DEKAN_PIN || '').trim();
    if (dariEnv) {
      if (!/^\d{6,12}$/.test(dariEnv)) {
        console.warn('[Otorisasi] DEKAN_PIN harus berupa 6-12 digit angka — PIN developing tidak ditetapkan.');
        return { ok: false, sudahDiatur: false };
      }
      setPin(PIN_KONTEKS_DEKANAT, dariEnv, 'sistem');
      console.log('[Otorisasi] PIN Dekanat ditetapkan dari variabel lingkungan DEKAN_PIN.');
      return { ok: true, sudahDiatur: true };
    }

    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[Otorisasi] DEKAN_PIN belum disetel. Penerbitan SK massal dinonaktifkan sampai PIN ditetapkan (POST /api/admin/atur-pin oleh Super Admin).'
      );
      return { ok: false, sudahDiatur: false };
    }

    const pinDev = '202610';
    setPin(PIN_KONTEKS_DEKANAT, pinDev, 'sistem');
    console.warn(
      `[Otorisasi] DEKAN_PIN tidak disetel — PIN pengembangan sementara dipakai (${pinDev}). Jangan andalkan pada mode produksi.`
    );
    return { ok: true, sudahDiatur: true, pengembangan: true };
  } catch (err) {
    console.warn('[Otorisasi] Gagal menyiapkan PIN Dekanat:', err.message);
    return { ok: false, sudahDiatur: false };
  }
}
