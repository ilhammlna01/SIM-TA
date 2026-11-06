/**
 * Storage Service - Local Storage State Persistence
 * Menyimpan seluruh perubahan data frontend SIM Tugas Akhir FEB UTM ke localStorage browser,
 * sehingga saat halaman di-refresh data tidak hilang (tetap persisten).
 */

const STORAGE_PREFIX = 'sim_ta_feb_utm_';

export const STORAGE_KEYS = {
  // Mahasiswa
  STUDENTS: `${STORAGE_PREFIX}students`,
  BIMBINGAN_MHS: `${STORAGE_PREFIX}bimbingan_mhs`,
  REVISI_MHS: `${STORAGE_PREFIX}revisi_mhs`,
  DOKUMEN_MHS: `${STORAGE_PREFIX}dokumen_mhs`,
  ACTIVITIES_MHS: `${STORAGE_PREFIX}activities_mhs`,
  PORTOFOLIO_MHS: `${STORAGE_PREFIX}portofolio_mhs`,

  // Pembimbing
  MAHASISWA_BIMBINGAN: `${STORAGE_PREFIX}mahasiswa_bimbingan`,
  NASKAH_REVIEW: `${STORAGE_PREFIX}naskah_review`,
  APPROVAL_QUEUE: `${STORAGE_PREFIX}approval_queue`,
  REVISI_MONITORING: `${STORAGE_PREFIX}revisi_monitoring`,
  JADWAL_UJIAN_DOSEN: `${STORAGE_PREFIX}jadwal_ujian_dosen`,

  // Koorprodi
  PENGAJUAN_KOORPRODI: `${STORAGE_PREFIX}pengajuan_koorprodi`,
  PLOTTING_PEMBIMBING: `${STORAGE_PREFIX}plotting_pembimbing`,
  PENETAPAN_PENGUJI: `${STORAGE_PREFIX}penetapan_penguji`,
  DOKUMEN_PRODI: `${STORAGE_PREFIX}dokumen_prodi`,

  // Penguji
  DAFTAR_UJIAN_PENGUJI: `${STORAGE_PREFIX}daftar_ujian_penguji`,
  KOREKSI_PENGUJI: `${STORAGE_PREFIX}koreksi_penguji`,

  // Admin Akademik
  JADWAL_TAHAPAN_ADMIN: `${STORAGE_PREFIX}jadwal_tahapan_admin`,
  VERIFIKASI_BERKAS_ADMIN: `${STORAGE_PREFIX}verifikasi_berkas_admin`,
  SK_DOKUMEN_ADMIN: `${STORAGE_PREFIX}sk_dokumen_admin`,
  RUANGAN_UJIAN_ADMIN: `${STORAGE_PREFIX}ruangan_ujian_admin`,

  // Super Admin
  MASTER_PRODI: `${STORAGE_PREFIX}master_prodi`,
  TAHAPAN_JENJANG: `${STORAGE_PREFIX}tahapan_jenjang`,
  KUOTA_DOSEN: `${STORAGE_PREFIX}kuota_dosen`,
  USER_ACCOUNTS: `${STORAGE_PREFIX}user_accounts`,

  // Navigasi & Sesi Autentikasi
  AUTH_SESSION: `${STORAGE_PREFIX}auth_session`,
  AUTH_REMEMBER: `${STORAGE_PREFIX}auth_remember`,
  CURRENT_ROLE: `${STORAGE_PREFIX}current_role`,
  ACTIVE_NAV: `${STORAGE_PREFIX}active_nav`
};

/**
 * Membaca data dari localStorage dengan fallback data default.
 */
export function loadFromStorage(key, defaultValue) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[StorageService] Gagal memuat key "${key}" dari localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Menyimpan data ke localStorage secara aman.
 */
export function saveToStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[StorageService] Gagal menyimpan key "${key}" ke localStorage:`, error);
  }
}

/**
 * Menghapus satu key dari storage.
 */
export function removeFromStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[StorageService] Gagal menghapus key "${key}":`, error);
  }
}

/**
 * Membersihkan semua data demo SIM Tugas Akhir di browser dan mereset ke data awal.
 */
export function resetAllStorage() {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => {
      window.localStorage.removeItem(k);
    });
    // Juga bersihkan key lain dengan awalan yang sama
    Object.keys(window.localStorage).forEach((k) => {
      if (k.startsWith(STORAGE_PREFIX)) {
        window.localStorage.removeItem(k);
      }
    });
    return true;
  } catch (error) {
    console.error('[StorageService] Gagal mereset storage:', error);
    return false;
  }
}
