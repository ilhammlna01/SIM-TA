/**
 * Sumber Tunggal Data Pejabat Penandatangan Dekanat FEB UTM
 * ==========================================================
 * Ganti pejabat penandatangan (Dekan / Wakil Dekan) HANYA di file ini.
 * Seluruh halaman (Admin → Penerbitan SK, Koorprodi → Penerbitan Massal)
 * merender dropdown dari daftar ini, sehingga tidak ada lagi nama yang
 * berbeda-beda antar halaman.
 *
 * Cara menambah/mengganti pejabat:
 * 1. Tambahkan/ubah entri pada array PEJABAT_DEKANAT di bawah.
 * 2. Untuk menjadikan pejabat default di seluruh halaman, ubah DEFAULT_PEJABAT_ID.
 * 3. Sinkronkan juga nilai fallback di server/config/pejabatDekanat.js
 *    (dipakai saat PDF digenerate bila payload tidak menyertakan nama pejabat).
 */

export const PEJABAT_DEKANAT = [
  {
    id: 'dekan-pribanus',
    nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    nip: '196306231989031002',
    jabatan: 'Dekan FEB UTM'
  },
  {
    id: 'dekan-slamet-riyadi',
    nama: 'Prof. Dr. Slamet Riyadi, S.E., M.Si.',
    nip: '196811231994031001',
    jabatan: 'Dekan FEB UTM'
  },
  {
    id: 'wadek1-subari',
    nama: 'Dr. H. Slamet Subari, M.Si.',
    nip: '196504121991031003',
    jabatan: 'Wakil Dekan I Bidang Akademik'
  },
  {
    id: 'wadek1-zainuddin',
    nama: 'Dr. Moh. Zainuddin, S.E., M.E.',
    nip: '197405122001121001',
    jabatan: 'Wakil Dekan I Bidang Akademik'
  }
];

/** ID pejabat yang dipilih secara default (lihat PEJABAT_DEKANAT). */
export const DEFAULT_PEJABAT_ID = 'dekan-pribanus';

/** Ambil objek pejabat berdasarkan id. */
export function getPejabatById(id) {
  return PEJABAT_DEKANAT.find((p) => p.id === id) || PEJABAT_DEKANAT[0];
}

/** Label tampilan: "Nama Lengkap (Jabatan)". */
export function pejabatLabel(pejabat) {
  return `${pejabat.nama} (${pejabat.jabatan})`;
}

/** Daftar pejabat default Dekan FEB. */
export function getDekanList() {
  return PEJABAT_DEKANAT.filter((p) => p.jabatan === 'Dekan FEB UTM');
}

/** Daftar pejabat default Wakil Dekan I. */
export function getWadek1List() {
  return PEJABAT_DEKANAT.filter((p) => p.jabatan === 'Wakil Dekan I Bidang Akademik');
}
