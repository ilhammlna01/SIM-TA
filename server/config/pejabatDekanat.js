/**
 * Sumber Tunggal Data Pejabat Penandatangan Dekanat FEB UTM (Server-side)
 * =======================================================================
 * Dipakai sebagai nilai fallback saat PDF digenerate tetapi payload dari
 * frontend tidak menyertakan nama/NIP/jabatan pejabat.
 *
 * Ganti pejabat di sini bila terjadi pergantian Dekan / Wakil Dekan I.
 * Jaga agar tetap sinkron dengan src/data/pejabatDekanat.js di sisi frontend.
 *
 * Catatan: bila frontend mengirim `data.dekanNama` / `data.pejabatNama` /
 * `data.pejabatJabatan` / NIP, nilai dari payload inilah yang dipakai.
 */

export const PEJABAT_DEKANAT = {
  // Pejabat default untuk penandatangan SK Dekan
  dekan: {
    nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    nip: 'NIP. 196306231989031002',
    jabatan: 'Dekan Fakultas Ekonomi dan Bisnis UTM'
  },
  // Pejabat default untuk penandatangan "a.n. Dekan" (Surat Tugas / Lembar Pengesahan)
  wadek1: {
    nama: 'Dr. H. Slamet Subari, M.Si.',
    nip: 'NIP. 196504121991031003',
    jabatan: 'Wakil Dekan I Bidang Akademik'
  }
};

/** Nama default Dekan FEB UTM. */
export const DEKAN_DEFAULT = PEJABAT_DEKANAT.dekan;

/** Pejabat default penandatangan "a.n. Dekan". */
export const PEJABAT_DEFAULT = PEJABAT_DEKANAT.wadek1;

/** Ambil nama Dekan: dari payload, atau fallback default. */
export function resolveNamaDekan(data = {}) {
  return data.dekanNama || DEKAN_DEFAULT.nama;
}

/** Ambil NIP Dekan: dari payload, atau fallback default. */
export function resolveNipDekan(data = {}) {
  return data.dekanNip || DEKAN_DEFAULT.nip;
}

/** Ambil nama pejabat "a.n. Dekan": dari payload, atau fallback default. */
export function resolveNamaPejabat(data = {}) {
  return data.pejabatNama || PEJABAT_DEFAULT.nama;
}

/** Ambil jabatan pejabat "a.n. Dekan": dari payload, atau fallback default. */
export function resolveJabatanPejabat(data = {}) {
  return data.pejabatJabatan || PEJABAT_DEFAULT.jabatan;
}

/** Ambil NIP pejabat "a.n. Dekan": dari payload, atau fallback default. */
export function resolveNipPejabat(data = {}) {
  return data.pejabatNip || PEJABAT_DEFAULT.nip;
}
