/**
 * Aturan Ujian & Rubrik — SIM-TA FEB UTM (Fakultas Ekonomi dan Bisnis)
 *
 * Audit 21 Oktober 2026 (temuan P0-1, Putaran Business Process):
 * pemilihan rubrik penilaian di `pengujiRoutes.js` semula hanya menghasilkan
 * TIGA nilai ('D3_S1', 'S2', 'S3_KELAYAKAN') padahal katalog rubrik
 * berisi Tujuh rubrik resmi. Akibatnya:
 *   - Program D3 dinilai dengan rubrik Ujian Kelayakan Disertasi
 *     (ambang lulus 70, bobot orisinalitas/rigor metodologi) padahal
 *     seharusnya memakai rubrik Ujian TA/Skripsi D3 & S1 (ambang 56);
 *   - Empat dari lima jenis ujian S3 (Kualifikasi, Proposal, Tertutup,
 *     Terbuka) dinilai dengan rubrik yang kelayakan.
 *
 * Modul ini menjadi SATU-SATUNYA sumber kebenaran pemetaan:
 *   - jenis ujian  -> tahap prasyarat pendaftaran (gerbang BP-1)
 *   - jenis ujian  -> rubrik penilaian yang sah
 *   - jenjang      -> rubrik bawaan bila jenis ujian tidak dikenali
 */

/**
 * Peta jenis ujian -> kode tahap ujian.
 *
 * Nilai di bawah ini adalah TAHAP UJIAN itu sendiri; seluruh tahap yang
 * berada SEBELUMNYA wajib berstatus 'Selesai' sebelum mahasiswa boleh
 * mendaftar ujian tersebut.
 */
export const JENIS_UJIAN_TAHAP = {
  // ---- Program Studi (S1) ----
  'seminar proposal': 'S1-T2',
  'seminar proposal skripsi': 'S1-T2',
  'sidang skripsi': 'S1-T4',
  'sidang tugas akhir': 'S1-T4',
  'ujian tugas akhir': 'S1-T4',
  'sidang diseminasi & portofolio bisnis takk': 'S1-T4',
  'ujian sidang komprehensif (takk)': 'S1-T4',

  // ---- Program Magister (S2) ----
  'sidang tesis magister': 'S2-T4',
  'ujian tesis (sidang akhir)': 'S2-T4',
  'pelaksanaan sidang tertutup': 'S2-T4',

  // ---- Program Doktor (S3) ----
  'ujian kualifikasi doktor': 'S3-T2',
  'ujian proposal disertasi': 'S3-T3',
  'ujian kelayakan (desk review)': 'S3-T4',
  'ujian kelayakan disertasi (desk review)': 'S3-T4',
  'ujian tertutup disertasi': 'S3-T6',
  'sidang terbuka & promosi doktor': 'S3-T7',

  // ---- Program Doktor Bisnis (D3) ----
  'sidang laporan tugas akhir': 'D3-T3',
  'sidang portofolio bisnis': 'D3-T3',
  'ujian sidang tugas akhir bisnis': 'D3-T3',
  'sidang tugas akhir d-iii': 'D3-T3',
  'sidang tugas akhir d3': 'D3-T3'
};

/**
 * Peta jenis ujian -> tahap prasyarat, KHUSUS per jenjang.
 *
 * Sebagian nama jenis ujian ambigu antar jenjang: "Sidang Tugas Akhir"
 * merupakan tahap akhir S1 (S1-T4) sekaligus tahap akhir D3 (D3-T3).
 * Karena itu override per jenjang diperiksa lebih dulu.
 */
export const JENIS_UJIAN_TAHAP_JENJANG = {
  S1: {
    'sidang tugas akhir': 'S1-T4',
    'ujian tugas akhir': 'S1-T4',
    'sidang skripsi': 'S1-T4',
    'sidang diseminasi & portofolio bisnis takk': 'S1-T4',
    'ujian sidang komprehensif (takk)': 'S1-T4',
    'seminar proposal': 'S1-T2',
    'seminar proposal skripsi': 'S1-T2'
  },
  D3: {
    'sidang tugas akhir': 'D3-T3',
    'ujian tugas akhir': 'D3-T3',
    'sidang tugas akhir d-iii': 'D3-T3',
    'sidang laporan tugas akhir': 'D3-T3',
    'sidang portofolio bisnis': 'D3-T3',
    'ujian sidang tugas akhir bisnis': 'D3-T3'
  },
  S2: {
    'sidang tesis magister': 'S2-T4',
    'ujian tesis (sidang akhir)': 'S2-T4',
    'pelaksanaan sidang tertutup': 'S2-T4'
  },
  S3: {
    'ujian kualifikasi doktor': 'S3-T2',
    'ujian proposal disertasi': 'S3-T3',
    'ujian kelayakan (desk review)': 'S3-T4',
    'ujian kelayakan disertasi (desk review)': 'S3-T4',
    'ujian tertutup disertasi': 'S3-T6',
    'sidang terbuka & promosi doktor': 'S3-T7'
  }
};

/**
 * Peta jenis ujian -> rubrik penilaian resmi.
 *
 * Kunci rubrik harus cocok dengan katalog `RUBRIK_PENILAIAN_PENGUJI`
 * pada `src/data/pengujiData.js`:
 *   D3_S1 · S2 · S3_KUALIFIKASI · S3_PROPOSAL · S3_KELAYAKAN ·
 *   S3_TERTUTUP · S3_TERBUKA
 */
export const JENIS_UJIAN_RUBRIK = {
  // ---- S1 & D3: Rubrik Ujian Tugas Akhir / Skripsi (D3_S1) ----
  'seminar proposal': 'D3_S1',
  'seminar proposal skripsi': 'D3_S1',
  'sidang skripsi': 'D3_S1',
  'ujian tugas akhir': 'D3_S1',
  'sidang laporan tugas akhir': 'D3_S1',
  'sidang portofolio bisnis': 'D3_S1',
  'ujian sidang tugas akhir bisnis': 'D3_S1',
  'sidang tugas akhir d-iii': 'D3_S1',
  'sidang tugas akhir d3': 'D3_S1',
  'sidang diseminasi & portofolio bisnis takk': 'D3_S1',
  'ujian sidang komprehensif (takk)': 'D3_S1',

  // ---- S2: Rubrik Sidang Tesis Magister ----
  'sidang tesis magister': 'S2',
  'ujian tesis (sidang akhir)': 'S2',
  'pelaksanaan sidang tertutup': 'S2',

  // ---- S3: lima rubrik berbeda sesuai jenis ujiannya ----
  'ujian kualifikasi doktor': 'S3_KUALIFIKASI',
  'ujian proposal disertasi': 'S3_PROPOSAL',
  'ujian kelayakan (desk review)': 'S3_KELAYAKAN',
  'ujian kelayakan disertasi (desk review)': 'S3_KELAYAKAN',
  'ujian tertutup disertasi': 'S3_TERTUTUP',
  'sidang terbuka & promosi doktor': 'S3_TERBUKA'
};

/**
 * Rubrik bawaan per jenjang — dipakai bila jenis ujian tidak dikenali.
 */
export const RUBRIK_JENJANG_DEFAULT = {
  S1: 'D3_S1',
  D3: 'D3_S1',
  S2: 'S2',
  S3: 'S3_KELAYAKAN'
};

/** Normalisasi nama jenis ujian agar pencocokan tahan terhadap spasi/kapital. */
export function normJenisUjian(jenisUjian) {
  return String(jenisUjian || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Menentukan rubrik penilaian yang sah untuk sebuah ujian.
 *
 * @param {string} jenjang  Jenjang program studi (S1/S2/S3/D3)
 * @param {string} jenisUjian
 * @returns {{rubrikContext: string, fallback: boolean, sumber: string}}
 *   `fallback: true` berarti jenis ujian tidak dikenali dan rubrik bawaan
 *   jenjang yang dipakai — pemanggil WAJIB menandai hal ini agar pengguna
 *   tidak menyangka rubrik yang dipakai adalah yang benar.
 */
export function resolveRubrikContext(jenjang, jenisUjian) {
  const key = normJenisUjian(jenisUjian);
  const j = String(jenjang || '').trim().toUpperCase();

  // Bila jenis ujian dikenali secara eksplisit, itu yang dipakai.
  if (key && Object.prototype.hasOwnProperty.call(JENIS_UJIAN_RUBRIK, key)) {
    return { rubrikContext: JENIS_UJIAN_RUBRIK[key], fallback: false, sumber: 'jenis-ujian' };
  }

  // Bila jenjang punya rubrik tunggal (S1 & D3 berbagi D3_S1; S2 memakai S2),
  // itu adalah jawaban yang benar tanpa perlu bergantung pada jenis ujian.
  if (j === 'S1' || j === 'D3') {
    return { rubrikContext: RUBRIK_JENJANG_DEFAULT.S1, fallback: false, sumber: 'jenjang' };
  }
  if (j === 'S2') {
    return { rubrikContext: RUBRIK_JENJANG_DEFAULT.S2, fallback: false, sumber: 'jenjang' };
  }

  // S3: jenis ujian WAJIB dikenali karena ada lima rubrik berbeda.
  if (j === 'S3') {
    return { rubrikContext: RUBRIK_JENJANG_DEFAULT.S3, fallback: true, sumber: 'bawaan-jenjang' };
  }

  return { rubrikContext: RUBRIK_JENJANG_DEFAULT.S1, fallback: true, sumber: 'bawaan' };
}

/**
 * Tahap prasyarat untuk pendaftaran ujian (null bila jenis ujian tidak dikenal
 * sehingga tidak ada gerbang — pemanggil wajib menandai hal ini).
 */
export function getTahapPrasyaratUjian(jenisUjian, jenjang = null) {
  const key = normJenisUjian(jenisUjian);
  if (!key) return null;

  // 1) Override per jenjang (menangani nama yang ambigu lintas jenjang).
  const j = String(jenjang || '').trim().toUpperCase();
  const perJenjang = JENIS_UJIAN_TAHAP_JENJANG[j];
  if (perJenjang && Object.prototype.hasOwnProperty.call(perJenjang, key)) {
    return perJenjang[key];
  }

  // 2) Peta global.
  if (Object.prototype.hasOwnProperty.call(JENIS_UJIAN_TAHAP, key)) {
    return JENIS_UJIAN_TAHAP[key];
  }

  return null;
}

/**
 * Daftar semua jenis ujian yang dikenali — dipakai oleh pengujian untuk
 * memastikan tidak ada jenis ujian pada data yang lolos tanpa aturan.
 */
export function daftarJenisUjianDikenal() {
  return Object.keys(JENIS_UJIAN_TAHAP);
}
