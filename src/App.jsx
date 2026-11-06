import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { AppShell } from './components/shell';
import LoginPage from './pages/auth/LoginPage';
import { AcademicPageLoading } from './components/ui';

// ==========================================
// CODE-SPLITTING & REACT LAZY (FASE 2)
// Seluruh halaman dipecah menjadi modul mandiri
// hanya diunduh saat peran pengguna diakses.
// ==========================================

// 1. Halaman Koorprodi (Fase F) - Lazy Loaded
const KoorprodiDashboardPage = lazy(() => import('./pages/koorprodi/DashboardPage'));
const KoorprodiDaftarMahasiswaPage = lazy(() => import('./pages/koorprodi/DaftarMahasiswaPage'));
const KoorprodiDetailMahasiswaPage = lazy(() => import('./pages/koorprodi/DetailMahasiswaPage'));
const KoorprodiPengajuanPage = lazy(() => import('./pages/koorprodi/PengajuanPage'));
const KoorprodiPembimbingPage = lazy(() => import('./pages/koorprodi/PembimbingPage'));
const KoorprodiPengujiPage = lazy(() => import('./pages/koorprodi/PengujiPage'));
const KoorprodiUjianPage = lazy(() => import('./pages/koorprodi/UjianPage'));
const KoorprodiPersyaratanPage = lazy(() => import('./pages/koorprodi/PersyaratanPage'));
const KoorprodiRevisiPage = lazy(() => import('./pages/koorprodi/RevisiPage'));
const KoorprodiDokumenPage = lazy(() => import('./pages/koorprodi/DokumenPage'));
const KoorprodiPenerbitanMassalPage = lazy(() => import('./pages/koorprodi/PenerbitanMassalPage'));

// 2. Halaman Pembimbing / Promotor (Fase E) - Lazy Loaded
const DosenDashboardPage = lazy(() => import('./pages/pembimbing/DashboardPage'));
const MahasiswaBimbinganPage = lazy(() => import('./pages/pembimbing/MahasiswaBimbinganPage'));
const DosenDetailMahasiswaPage = lazy(() => import('./pages/pembimbing/DetailMahasiswaPage'));
const DosenBimbinganPage = lazy(() => import('./pages/pembimbing/BimbinganPage'));
const DosenNaskahPage = lazy(() => import('./pages/pembimbing/NaskahPage'));
const ReviewPage = lazy(() => import('./pages/pembimbing/ReviewPage'));
const PersetujuanPage = lazy(() => import('./pages/pembimbing/PersetujuanPage'));
const DosenRevisiPage = lazy(() => import('./pages/pembimbing/RevisiPage'));
const DosenUjianPage = lazy(() => import('./pages/pembimbing/UjianPage'));

// 3. Halaman Mahasiswa (Fase D) - Lazy Loaded
const MhsDashboardPage = lazy(() => import('./pages/mahasiswa/DashboardPage'));
const DetailTugasAkhirPage = lazy(() => import('./pages/mahasiswa/DetailTugasAkhirPage'));
const TahapanPage = lazy(() => import('./pages/mahasiswa/TahapanPage'));
const MhsPersyaratanPage = lazy(() => import('./pages/mahasiswa/PersyaratanPage'));
const MhsBimbinganPage = lazy(() => import('./pages/mahasiswa/BimbinganPage'));
const MhsNaskahPage = lazy(() => import('./pages/mahasiswa/NaskahPage'));
const MhsUjianPage = lazy(() => import('./pages/mahasiswa/UjianPage'));
const MhsRevisiPage = lazy(() => import('./pages/mahasiswa/RevisiPage'));
const PublikasiPage = lazy(() => import('./pages/mahasiswa/PublikasiPage'));
const PortofolioPage = lazy(() => import('./pages/mahasiswa/PortofolioPage'));
const MhsDokumenPage = lazy(() => import('./pages/mahasiswa/DokumenPage'));

// 4. Halaman Dewan Penguji (Fase G) - Lazy Loaded
const PengujiDashboardPage = lazy(() => import('./pages/penguji/DashboardPage'));
const PengujiDaftarUjianPage = lazy(() => import('./pages/penguji/DaftarUjianPage'));
const PengujiDetailUjianPage = lazy(() => import('./pages/penguji/DetailUjianPage'));
const PengujiNaskahPage = lazy(() => import('./pages/penguji/NaskahPage'));
const PengujiFormPenilaianPage = lazy(() => import('./pages/penguji/FormPenilaianPage'));
const PengujiCatatanKoreksiPage = lazy(() => import('./pages/penguji/CatatanKoreksiPage'));
const PengujiRevisiPage = lazy(() => import('./pages/penguji/RevisiPage'));

// 5. Halaman Admin Akademik - Lazy Loaded
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const AdminJadwalTahapanPage = lazy(() => import('./pages/admin/JadwalTahapanPage'));
const AdminVerifikasiBerkasPage = lazy(() => import('./pages/admin/VerifikasiBerkasPage'));
const AdminPenerbitanSKPage = lazy(() => import('./pages/admin/PenerbitanSKPage'));
const AdminAlokasiRuanganPage = lazy(() => import('./pages/admin/AlokasiRuanganPage'));
const AdminOtomasiDokumenPage = lazy(() => import('./pages/admin/OtomasiDokumenPage'));

// 6. Halaman Super Admin - Lazy Loaded
const SuperAdminDashboardPage = lazy(() => import('./pages/superadmin/DashboardPage'));
const SuperAdminMasterProdiPage = lazy(() => import('./pages/superadmin/MasterProdiPage'));
const SuperAdminTahapanJenjangPage = lazy(() => import('./pages/superadmin/TahapanJenjangPage'));
const SuperAdminKuotaBimbinganPage = lazy(() => import('./pages/superadmin/KuotaBimbinganPage'));
const SuperAdminManajemenPenggunaPage = lazy(() => import('./pages/superadmin/ManajemenPenggunaPage'));

// Data Autentik Penguji (Fase G)
import {
  PENGUJI_PROFILE_DEFAULT,
  INITIAL_DAFTAR_UJIAN_PENGUJI,
  INITIAL_KOREKSI_PENGUJI
} from './data/pengujiData';

// Data Autentik Koorprodi (Fase F)
import {
  KOORPRODI_PROFILE_DEFAULT,
  INITIAL_PENGAJUAN_KOORPRODI,
  INITIAL_PLOTTING_PEMBIMBING,
  INITIAL_PENETAPAN_PENGUJI,
  INITIAL_DOKUMEN_PRODI
} from './data/koorprodiData';

// Data Autentik Pembimbing (Fase E)
import {
  DOSEN_PROFILE_DEFAULT,
  INITIAL_MAHASISWA_BIMBINGAN,
  INITIAL_NASKAH_REVIEW,
  INITIAL_APPROVAL_QUEUE,
  INITIAL_REVISI_MONITORING,
  INITIAL_JADWAL_UJIAN_DOSEN
} from './data/pembimbingData';

// Data Mahasiswa (Fase D)
import {
  INITIAL_STUDENTS,
  INITIAL_BIMBINGAN,
  INITIAL_REVISI,
  INITIAL_DOKUMEN,
  INITIAL_ACTIVITIES
} from './data/initialState';

// Data Admin & Super Admin
import {
  ADMIN_PROFILE_DEFAULT,
  INITIAL_VERIFIKASI_BERKAS,
  INITIAL_SK_DOKUMEN,
  INITIAL_RUANGAN_UJIAN,
  INITIAL_JADWAL_TAHAPAN
} from './data/adminData';

import {
  SUPERADMIN_PROFILE_DEFAULT,
  INITIAL_MASTER_PRODI,
  INITIAL_TAHAPAN_JENJANG,
  INITIAL_KUOTA_DOSEN,
  INITIAL_USER_ACCOUNTS
} from './data/superadminData';

// Service Persistensi LocalStorage
import {
  loadFromStorage,
  saveToStorage,
  removeFromStorage,
  resetAllStorage,
  STORAGE_KEYS
} from './utils/storage';
import { formatTanggal, formatWaktu, formatWaktuDetik } from './utils/format';

import { UserCheck, RotateCcw, Database, RefreshCw, Server, QrCode } from 'lucide-react';

// Service Koneksi Backend REST API & Database SQLite (Node 24 Native)
import {
  checkBackendOnline,
  adminApi,
  superadminApi,
  pengujiApi,
  akademikApi,
  storageApi,
  notificationApi,
  authApi
} from './services/api';

// Floating Demo Dock (Kontrol Demonstrasi, Role Switcher & QA Center) — hanya dimuat di mode pengembangan.
// eslint-disable-next-line no-unused-vars
const SimulationFloatingDock = import.meta.env.DEV
  ? lazy(() => import('./components/shell/SimulationFloatingDock'))
  : null;

// Modal Verifikasi Dokumen & QR Code Digital (Lazy Loaded)
const DocumentVerificationModal = lazy(() => import('./components/documents/DocumentVerificationModal'));

// Modal Autentikasi Pengguna & Ganti Kata Sandi
import { ChangePasswordModal } from './components/auth';

// QA & Testing Suite (Lazy Loaded) — hanya direferensikan pada mode pengembangan,
// sehingga Vite dapat men-eliminasi chunk ini sepenuhnya dari bundle produksi.
// eslint-disable-next-line no-unused-vars
const QATestingModal = import.meta.env.DEV
  ? lazy(() => import('./components/qa/QATestingModal'))
  : null;
import { SecurityGuard } from './components/security';
import { FeedbackHost, confirmDialog } from './components/feedback';
import { ShieldAlert } from 'lucide-react';

/**
 * SIM TUGAS AKHIR FEB UTM — MASTER APPLICATION ORCHESTRATOR
 * Mendukung pengujian:
 * - PORTAL SUPER ADMIN: Konfigurasi Prodi, Tahapan, Kuota, Manajemen Akun
 * - PORTAL ADMIN AKADEMIK: Verifikasi Berkas, Penerbitan SK, Alokasi Ruang
 * - FASE G: FRONTEND DEWAN PENGUJI
 * - FASE F: FRONTEND KOORPRODI
 * - FASE E: FRONTEND PEMBIMBING / PROMOTOR
 * - FASE D: FRONTEND MAHASISWA
 */
export default function App() {
  // ==========================================
  // AUTENTIKASI RESMI INSTITUSIONAL & SESI LOGIN
  // ==========================================
  const [authSession, setAuthSession] = useState(() => {
    try {
      // Deep-link peran via URL HANYA diizinkan pada mode pengembangan.
      // Pada produksi, sesi hanya boleh berasal dari login resmi (JWT terverifikasi),
      // bukan dari parameter ?role= yang dapat dimanipulasi klien.
      if (import.meta.env.DEV) {
        const urlParams = new URLSearchParams(window.location.search);
        const roleParam = urlParams.get('role');
        if (roleParam) {
          const matched = INITIAL_USER_ACCOUNTS.find(x => x.role === roleParam);
          if (matched) return matched;
        }
      }
    } catch {}
    return loadFromStorage(STORAGE_KEYS.AUTH_SESSION, null);
  });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  // Gerbang wajib ganti kata sandi (kata sandi sementara dari reset superadmin).
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Current Role & Active Nav Persisten (Default: Dewan Penguji - Daftar Ujian)
  const [currentRole, setCurrentRole] = useState(() => {
    try {
      if (import.meta.env.DEV) {
        const urlParams = new URLSearchParams(window.location.search);
        const roleParam = urlParams.get('role');
        if (roleParam) return roleParam;
      }
    } catch {}
    return loadFromStorage(STORAGE_KEYS.CURRENT_ROLE, 'penguji');
  });
  const [activeNavId, setActiveNavId] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const navParam = urlParams.get('nav');
      if (navParam) return navParam;
      if (import.meta.env.DEV) {
        const roleParam = urlParams.get('role');
        if (roleParam === 'admin') return 'jadwal-tahapan';
      }
    } catch {}
    return loadFromStorage(STORAGE_KEYS.ACTIVE_NAV, 'daftar-ujian');
  });

  // ==========================================
  // STATE FASE G (DEWAN PENGUJI) + PERSISTENSI
  // ==========================================
  const [pengujiProfile] = useState(PENGUJI_PROFILE_DEFAULT);
  const [daftarUjianPenguji, setDaftarUjianPenguji] = useState(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.DAFTAR_UJIAN_PENGUJI, INITIAL_DAFTAR_UJIAN_PENGUJI);
    if (Array.isArray(loaded)) {
      const sanitized = loaded.map(u => ({
        ...u,
        peranPenguji: u.peranPenguji?.includes('Dewan Pertimbangan Akademik') ? 'Penilai III' : u.peranPenguji
      }));
      const existingIds = new Set(sanitized.map(u => u.id));
      const missing = INITIAL_DAFTAR_UJIAN_PENGUJI.filter(u => !existingIds.has(u.id));
      const merged = missing.length > 0 ? [...sanitized, ...missing] : sanitized;
      saveToStorage(STORAGE_KEYS.DAFTAR_UJIAN_PENGUJI, merged);
      return merged;
    }
    return loaded;
  });
  const [koreksiListPenguji, setKoreksiListPenguji] = useState(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.KOREKSI_PENGUJI, INITIAL_KOREKSI_PENGUJI);
    if (Array.isArray(loaded)) {
      const sanitized = loaded.filter(k => !k.id?.startsWith('kor-179'));
      const existingIds = new Set(sanitized.map(k => k.id));
      const missing = INITIAL_KOREKSI_PENGUJI.filter(k => !existingIds.has(k.id));
      if (missing.length > 0 || sanitized.length !== loaded.length) {
        const merged = [...sanitized, ...missing];
        saveToStorage(STORAGE_KEYS.KOREKSI_PENGUJI, merged);
        return merged;
      }
      return sanitized;
    }
    return loaded;
  });
  const [selectedUjianPengujiId, setSelectedUjianPengujiId] = useState(
    daftarUjianPenguji[0]?.id || null
  );

  // ==========================================
  // STATE FASE F (KOORPRODI) + PERSISTENSI
  // ==========================================
  const [koorprodiProfile] = useState(KOORPRODI_PROFILE_DEFAULT);
  const [pengajuanKoorprodi, setPengajuanKoorprodi] = useState(() =>
    loadFromStorage(STORAGE_KEYS.PENGAJUAN_KOORPRODI, INITIAL_PENGAJUAN_KOORPRODI)
  );
  const [plottingPembimbing, setPlottingPembimbing] = useState(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.PLOTTING_PEMBIMBING, INITIAL_PLOTTING_PEMBIMBING);
    if (Array.isArray(loaded)) {
      const existingIds = new Set(loaded.map(p => p.id));
      const missing = INITIAL_PLOTTING_PEMBIMBING.filter(p => !existingIds.has(p.id));
      if (missing.length > 0) {
        const merged = [...loaded, ...missing];
        saveToStorage(STORAGE_KEYS.PLOTTING_PEMBIMBING, merged);
        return merged;
      }
    }
    return loaded;
  });
  const [penetapanPenguji, setPenetapanPenguji] = useState(() =>
    loadFromStorage(STORAGE_KEYS.PENETAPAN_PENGUJI, INITIAL_PENETAPAN_PENGUJI)
  );
  const [dokumenProdi, setDokumenProdi] = useState(() =>
    loadFromStorage(STORAGE_KEYS.DOKUMEN_PRODI, INITIAL_DOKUMEN_PRODI)
  );
  const [selectedMhsKoorprodiId, setSelectedMhsKoorprodiId] = useState(INITIAL_MAHASISWA_BIMBINGAN[0].id);

  // ==========================================
  // STATE FASE E (PEMBIMBING / PROMOTOR) + PERSISTENSI
  // ==========================================
  const [dosenProfile] = useState(DOSEN_PROFILE_DEFAULT);
  const [mahasiswaBimbingan, setMahasiswaBimbingan] = useState(() =>
    loadFromStorage(STORAGE_KEYS.MAHASISWA_BIMBINGAN, INITIAL_MAHASISWA_BIMBINGAN)
  );
  const [naskahReviewList, setNaskahReviewList] = useState(() =>
    loadFromStorage(STORAGE_KEYS.NASKAH_REVIEW, INITIAL_NASKAH_REVIEW)
  );
  const [approvalQueue, setApprovalQueue] = useState(() =>
    loadFromStorage(STORAGE_KEYS.APPROVAL_QUEUE, INITIAL_APPROVAL_QUEUE)
  );
  const [revisiMonitoring, setRevisiMonitoring] = useState(() =>
    loadFromStorage(STORAGE_KEYS.REVISI_MONITORING, INITIAL_REVISI_MONITORING)
  );
  const [jadwalUjianDosen, setJadwalUjianDosen] = useState(() =>
    loadFromStorage(STORAGE_KEYS.JADWAL_UJIAN_DOSEN, INITIAL_JADWAL_UJIAN_DOSEN)
  );
  const [selectedMhsDosenId, setSelectedMhsDosenId] = useState(INITIAL_MAHASISWA_BIMBINGAN[0].id);
  const [selectedNaskahId, setSelectedNaskahId] = useState(INITIAL_NASKAH_REVIEW[0].id);

  // ==========================================
  // STATE FASE D (MAHASISWA) + PERSISTENSI
  // ==========================================
  const [selectedStudentId, setSelectedStudentId] = useState('mhs-s1-takt');
  const [students, setStudents] = useState(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    if (Array.isArray(loaded)) {
      // Pastikan data 210211100219 tidak membawa cache lama 82 poin/2 item jika belum diunggah user
      const fikri = loaded.find(s => String(s.nim).trim() === '210211100219');
      if (fikri && (fikri.portofolioData?.totalPoin === 82 || (fikri.portofolioData?.items && fikri.portofolioData.items.some(it => it.nama?.includes('KIBM'))))) {
        const cleanFikri = INITIAL_STUDENTS.find(s => String(s.nim).trim() === '210211100219');
        if (cleanFikri) {
          const sanitized = loaded.map(s => String(s.nim).trim() === '210211100219' ? cleanFikri : s);
          saveToStorage(STORAGE_KEYS.STUDENTS, sanitized);
          return sanitized;
        }
      }
      return loaded;
    }
    return INITIAL_STUDENTS;
  });
  const [bimbinganListMhs, setBimbinganListMhs] = useState(() =>
    loadFromStorage(STORAGE_KEYS.BIMBINGAN_MHS, INITIAL_BIMBINGAN)
  );
  const [revisiListMhs, setRevisiListMhs] = useState(() =>
    loadFromStorage(STORAGE_KEYS.REVISI_MHS, INITIAL_REVISI)
  );
  const [dokumenListMhs, setDokumenListMhs] = useState(() =>
    loadFromStorage(STORAGE_KEYS.DOKUMEN_MHS, INITIAL_DOKUMEN)
  );
  const [activitiesMhs, setActivitiesMhs] = useState(() =>
    loadFromStorage(STORAGE_KEYS.ACTIVITIES_MHS, INITIAL_ACTIVITIES)
  );
  const [portofolioListMhs, setPortofolioListMhs] = useState(() =>
    loadFromStorage(STORAGE_KEYS.PORTOFOLIO_MHS, [])
  );

  // ==========================================
  // STATE MODUL ADMIN AKADEMIK + PERSISTENSI
  // ==========================================
  const [adminProfile] = useState(ADMIN_PROFILE_DEFAULT);
  const [verifikasiList, setVerifikasiList] = useState(() =>
    loadFromStorage(STORAGE_KEYS.VERIFIKASI_BERKAS_ADMIN, INITIAL_VERIFIKASI_BERKAS)
  );
  const [skList, setSkList] = useState(() =>
    loadFromStorage(STORAGE_KEYS.SK_DOKUMEN_ADMIN, INITIAL_SK_DOKUMEN)
  );
  const [ruanganList, setRuanganList] = useState(() =>
    loadFromStorage(STORAGE_KEYS.RUANGAN_UJIAN_ADMIN, INITIAL_RUANGAN_UJIAN)
  );
  const [jadwalTahapanList, setJadwalTahapanList] = useState(() =>
    loadFromStorage(STORAGE_KEYS.JADWAL_TAHAPAN_ADMIN, INITIAL_JADWAL_TAHAPAN)
  );

  // ==========================================
  // STATE MODUL SUPER ADMIN + PERSISTENSI
  // ==========================================
  const [superadminProfile] = useState(SUPERADMIN_PROFILE_DEFAULT);
  const [masterProdi, setMasterProdi] = useState(() =>
    loadFromStorage(STORAGE_KEYS.MASTER_PRODI, INITIAL_MASTER_PRODI)
  );
  const [tahapanJenjang, setTahapanJenjang] = useState(() =>
    loadFromStorage(STORAGE_KEYS.TAHAPAN_JENJANG, INITIAL_TAHAPAN_JENJANG)
  );
  const [kuotaDosen, setKuotaDosen] = useState(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.KUOTA_DOSEN, INITIAL_KUOTA_DOSEN);
    if (Array.isArray(loaded)) {
      const existingIds = new Set(loaded.map(k => k.id || k.nip));
      const missing = INITIAL_KUOTA_DOSEN.filter(k => !existingIds.has(k.id || k.nip));
      if (missing.length > 0) {
        const merged = [...loaded, ...missing];
        saveToStorage(STORAGE_KEYS.KUOTA_DOSEN, merged);
        return merged;
      }
    }
    return loaded;
  });
  const [userAccounts, setUserAccounts] = useState(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.USER_ACCOUNTS, INITIAL_USER_ACCOUNTS);
    if (Array.isArray(loaded)) {
      const existingNips = new Set(loaded.map(u => u.nomorInduk?.toString().trim()));
      const missing = INITIAL_USER_ACCOUNTS.filter(u => !existingNips.has(u.nomorInduk?.toString().trim()));
      if (missing.length > 0) {
        const merged = [...loaded, ...missing];
        saveToStorage(STORAGE_KEYS.USER_ACCOUNTS, merged);
        return merged;
      }
    }
    return loaded;
  });

  // ==========================================
  // AUTO-SAVE EFFECT KE LOCALSTORAGE
  // ==========================================
  useEffect(() => { saveToStorage(STORAGE_KEYS.DAFTAR_UJIAN_PENGUJI, daftarUjianPenguji); }, [daftarUjianPenguji]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.KOREKSI_PENGUJI, koreksiListPenguji); }, [koreksiListPenguji]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PENGAJUAN_KOORPRODI, pengajuanKoorprodi); }, [pengajuanKoorprodi]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PLOTTING_PEMBIMBING, plottingPembimbing); }, [plottingPembimbing]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PENETAPAN_PENGUJI, penetapanPenguji); }, [penetapanPenguji]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.DOKUMEN_PRODI, dokumenProdi); }, [dokumenProdi]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.MAHASISWA_BIMBINGAN, mahasiswaBimbingan); }, [mahasiswaBimbingan]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.NASKAH_REVIEW, naskahReviewList); }, [naskahReviewList]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.APPROVAL_QUEUE, approvalQueue); }, [approvalQueue]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.REVISI_MONITORING, revisiMonitoring); }, [revisiMonitoring]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.JADWAL_UJIAN_DOSEN, jadwalUjianDosen); }, [jadwalUjianDosen]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.STUDENTS, students); }, [students]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.BIMBINGAN_MHS, bimbinganListMhs); }, [bimbinganListMhs]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.REVISI_MHS, revisiListMhs); }, [revisiListMhs]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.DOKUMEN_MHS, dokumenListMhs); }, [dokumenListMhs]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.ACTIVITIES_MHS, activitiesMhs); }, [activitiesMhs]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PORTOFOLIO_MHS, portofolioListMhs); }, [portofolioListMhs]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.VERIFIKASI_BERKAS_ADMIN, verifikasiList); }, [verifikasiList]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.SK_DOKUMEN_ADMIN, skList); }, [skList]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.RUANGAN_UJIAN_ADMIN, ruanganList); }, [ruanganList]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.JADWAL_TAHAPAN_ADMIN, jadwalTahapanList); }, [jadwalTahapanList]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.MASTER_PRODI, masterProdi); }, [masterProdi]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.TAHAPAN_JENJANG, tahapanJenjang); }, [tahapanJenjang]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.KUOTA_DOSEN, kuotaDosen); }, [kuotaDosen]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.USER_ACCOUNTS, userAccounts); }, [userAccounts]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.CURRENT_ROLE, currentRole); }, [currentRole]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.ACTIVE_NAV, activeNavId); }, [activeNavId]);
  useEffect(() => {
    if (authSession) {
      saveToStorage(STORAGE_KEYS.AUTH_SESSION, authSession);
    } else {
      removeFromStorage(STORAGE_KEYS.AUTH_SESSION);
    }
  }, [authSession]);

  // ==========================================
  // SINKRONISASI DUA ARAH: BACKEND REST API & SQLITE
  // ==========================================
  // Tri-state: null = belum diperiksa, true = terhubung, false = tidak terhubung.
  // Nilai awal null mencegah banner "Mode Data Lokal" berkedip saat startup
  // sebelum pemeriksaan konektivitas backend selesai.
  const [isBackendOnline, setIsBackendOnline] = useState(null);
  const [isSyncingBackend, setIsSyncingBackend] = useState(false);
  const [backendSyncTime, setBackendSyncTime] = useState(null);
  // Audit 21 Oktober 2026 (P0-2): status kelulusan mahasiswa
  // (Proses / Siap Pengesahan / Lulus) — bersumber dari backend.
  const [statusKelulusan, setStatusKelulusan] = useState(null);

  const syncFromBackend = async () => {
    setIsSyncingBackend(true);
    try {
      const online = await checkBackendOnline();
      setIsBackendOnline(online);
      if (online) {
        console.log('[SIM-TA FEB UTM] Sinkronisasi data dari Database SQLite Port 5001...');
        const [
          dbVerifikasi,
          dbSK,
          dbRuangan,
          dbJadwal,
          dbProdi,
          dbTahapan,
          dbKuota,
          dbUsers,
          dbUjian,
          dbKoreksi,
          // Audit 21 Oktober 2026: kelima variabel berikut HARUS ikut
          // didestruksikan. Sebelumnya Promise.all mengembalikan 15 hasil
          // tetapi hanya 10 yang diambil, sehingga seluruh hidrasi baru
          // (bimbingan, naskah, publikasi, dokumen) diam-diam tidak pernah
          // dijalankan.
          dbBimbingan,
          dbNaskah,
          dbPublikasi,
          dbStorageNaskah,
          dbStorageDokumen,
          dbStatusKelulusan
        ] = await Promise.all([
          adminApi.getVerifikasi().catch(() => null),
          adminApi.getSK().catch(() => null),
          adminApi.getRuangan().catch(() => null),
          adminApi.getJadwalTahapan().catch(() => null),
          superadminApi.getProdi().catch(() => null),
          superadminApi.getTahapan().catch(() => null),
          superadminApi.getKuota().catch(() => null),
          superadminApi.getUsers().catch(() => null),
          pengujiApi.getUjian().catch(() => null),
          pengujiApi.getKoreksi().catch(() => null),
          akademikApi.getBimbingan({}).catch(() => null),
          akademikApi.getNaskah({}).catch(() => null),
          akademikApi.getPublikasi({}).catch(() => null),
          storageApi.listFiles('naskah').then((r) => r?.data || null).catch(() => null),
          storageApi.listFiles('dokumen_resmi').then((r) => r?.data || null).catch(() => null),
          // Audit 21 Oktober 2026 (P0-2): status kelulusan mahasiswa.
          akademikApi.getStatusKelulusan().catch(() => null)
        ]);

        if (dbVerifikasi && dbVerifikasi.length > 0) setVerifikasiList(dbVerifikasi);
        if (dbSK && dbSK.length > 0) setSkList(dbSK);
        if (dbRuangan && dbRuangan.length > 0) setRuanganList(dbRuangan);
        if (dbJadwal && dbJadwal.length > 0) setJadwalTahapanList(dbJadwal);
        if (dbProdi && dbProdi.length > 0) setMasterProdi(dbProdi);
        if (dbTahapan && Object.keys(dbTahapan).length > 0) setTahapanJenjang(dbTahapan);
        if (dbKuota && dbKuota.length > 0) setKuotaDosen(dbKuota);
        if (dbUsers && dbUsers.length > 0) {
          setUserAccounts(prev => {
            const map = new Map(dbUsers.map(u => [u.nomorInduk?.toString().trim(), u]));
            (Array.isArray(prev) ? prev : []).forEach(u => {
              const key = u.nomorInduk?.toString().trim();
              if (key && !map.has(key)) {
                map.set(key, u);
              }
            });
            const merged = Array.from(map.values());
            saveToStorage(STORAGE_KEYS.USER_ACCOUNTS, merged);
            return merged;
          });
        }
        if (dbUjian && dbUjian.length > 0) setDaftarUjianPenguji(dbUjian);
        if (dbKoreksi && dbKoreksi.length > 0) setKoreksiListPenguji(dbKoreksi);

        // ---------------------------------------------------------------
        // Audit 21 Oktober 2026 (temuan AZ-A2): daftar berikut tadinya
        // HANYA ditulis ke backend (melalui handler) tetapi TIDAK PERNAH
        // dimuat ulang dari backend. Akibatnya data yang sudah tersimpan
        // di SQLite tidak tampil setelah halaman dimuat ulang atau dibuka
        // dari perangkat lain — dan pada akhirnya_create state lokal
        // menjadi sumber kebenaran yang bertentangan dengan basis data.
        //
        // Pola: gabungkan (merge) baris backend ke dalam daftar lokal
        // berdasarkan id, sehingga field antarmuka tetap utuh sementara
        // nilai yang bersumber dari database menjadi yang otoritatif.
        // ---------------------------------------------------------------
        const mergeDb = (prev, rows, mapFn, keyFn = (r) => r.id) => {
          const list = Array.isArray(prev) ? prev : [];
          if (!Array.isArray(rows) || rows.length === 0) return list;
          const byKey = new Map(list.map((x) => [String(keyFn(x)), x]));
          const hasil = [];
          const terpakai = new Set();
          for (const row of rows) {
            const key = String(keyFn(row));
            const lama = byKey.get(key);
            if (lama) terpakai.add(key);
            hasil.push(lama ? { ...lama, ...mapFn(row) } : mapFn(row));
          }
          // Sisakan entri lokal yang tidak ada pasangannya (data simulasi).
          for (const x of list) {
            const key = String(keyFn(x));
            if (!terpakai.has(key) && !hasil.some((y) => String(keyFn(y)) === key)) hasil.push(x);
          }
          return hasil;
        };

        if (dbBimbingan && dbBimbingan.length > 0) {
          setBimbinganListMhs(prev => mergeDb(prev, dbBimbingan, (r) => ({
            id: r.id,
            nim: r.nim,
            nama: r.nama_mahasiswa || '',
            tanggal: r.tanggal,
            topik: r.topik || '',
            catatan: r.catatan || '',
            jumlah: r.jumlah ?? 1,
            status: r.status,
            dosenNama: r.disetujui_oleh || '',
            mode: 'Luring'
          })));
        }

        if (dbNaskah && dbNaskah.length > 0) {
          setNaskahReviewList(prev => mergeDb(prev, dbNaskah, (r) => ({
            id: r.id,
            nim: r.nim,
            // Audit 21 Oktober 2026 (BP-2): identitas pembimbing & mahasiswa
            // diperlukan agar filter "Review Naskah" milik dosen terisi —
            // tanpa ini daftar telaah kosong dan halaman jatuh ke data contoh.
            mhsId: r.mhsId || null,
            dosenNip: r.dosenNip || null,
            namaMahasiswa: r.namaMahasiswa || '',
            peranDosen: r.peranDosen || 'Pembimbing',
            judulNaskah: r.keterangan || '',
            versi: `v${r.nomor_versi || 1}`,
            tanggalKirim: r.created_at || '',
            statusReview: r.statusPersetujuan === 'Disetujui'
              ? 'Disetujui'
              : r.statusPersetujuan === 'Perlu Revisi'
                ? 'Perlu Direview'
                : 'Perlu Direview',
            fileNaskah: r.file_url || '',
            similarity: 0,
            aiScore: 0
          })));

          // Pilih naskah backend terbaru sebagai yang aktif (bukan data contoh).
          const terbaru = (Array.isArray(dbNaskah) ? dbNaskah : [])
            .filter(r => !String(r.id || '').startsWith('nsk-'));
          if (terbaru.length) {
            setSelectedNaskahId(terbaru[0].id);
          }
        }

        // Matriks revisi mahasiswa disumberkan dari koreksi penguji
        // (endpoint yang sama dipakai untuk daftar koreksi).
        if (dbKoreksi && dbKoreksi.length > 0) {
          setRevisiListMhs(prev => mergeDb(prev, dbKoreksi, (r) => ({
            id: r.id,
            nim: r.mhsNim || r.mhs_nim || '',
            no: 0,
            bagian: r.bagianNaskah || r.bagian_naskah || 'Catatan Koreksi',
            sumberRevisi: 'Dewan Penguji',
            namaPenguji: r.namaPenguji || r.nama_penguji || '',
            catatanPenguji: r.catatanKoreksi || r.catatan_koreksi || '',
            tindakLanjut: '',
            halamanPerbaikan: r.halaman || '-',
            status: r.statusVerifikasi || r.status_verifikasi || 'Menunggu Approval Penguji',
            fileBukti: ''
          })));
        }

        // Dokumen mahasiswa: berkas yang benar-benar diunggah (storage_files)
        // digabungkan ke daftar dokumen statis.
        if (dbStorageNaskah || dbStorageDokumen) {
          const allDokumen = [...(dbStorageNaskah || []), ...(dbStorageDokumen || [])];
          if (allDokumen.length > 0) {
            setDokumenListMhs(prev => mergeDb(prev, allDokumen, (f) => ({
              id: `file-${f.filename}`,
              nim: f.uploaderNim || '',
              namaDokumen: f.filename,
              jenis: f.category === 'naskah' ? 'Naskah Tugas Akhir' : 'Dokumen Resmi',
              tanggal: f.createdAt ? new Date(f.createdAt).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-',
              ukuran: f.sizeFormatted || '-',
              statusVerifikasi: 'Terverifikasi',
              kategori: f.category
            }), (x) => x.id));
          }
        }

        // Daftar dosen pembimbing: sisi baca disinkronkan dengan pagu kuota
        // resmi (tabel kuota_dosen) yang telah dihidrasi lebih dahulu.
        if (dbKuota && dbKuota.length > 0) {
          setPlottingPembimbing(prev => mergeDb(prev, dbKuota, (r) => ({
            id: r.id,
            nama: r.nama,
            nip: r.nip,
            jabatan: r.jabatan || '-',
            prodiHomebase: r.prodi || 'FEB UTM',
            keahlian: '-',
            kuotaS1: r.kuotaUtama ?? r.kuota_utama ?? 0,
            aktifS1: r.terisiUtama ?? r.terisi_utama ?? 0,
            kuotaS2: r.kuotaPendamping ?? r.kuota_pendamping ?? 0,
            aktifS2: r.terisiPendamping ?? r.terisi_pendamping ?? 0,
            kuotaS3: 0,
            aktifS3: 0,
            statusSK: r.status || 'Aman'
          }), (x) => x.nip || x.id));
        }

        // Status kelulusan (Proses / Siap Pengesahan / Lulus) untuk mahasiswa.
        if (dbStatusKelulusan && dbStatusKelulusan.status) {
          setStatusKelulusan(dbStatusKelulusan);
        }

        if (dbPublikasi && dbPublikasi.length > 0) {
          setPortofolioListMhs(prev => mergeDb(prev, dbPublikasi, (r) => ({
            id: r.id,
            nim: r.nim,
            judul: r.judul || '',
            jurnal: r.jurnal || '',
            tahun: r.tahun || '',
            tautan: r.tautan || '',
            statusVerifikasi: r.status_verifikasi || 'Menunggu Verifikasi',
            kategori: 'Publikasi Ilmiah'
          })));
        }
        setBackendSyncTime(formatWaktuDetik(new Date()));
      }
    } catch (err) {
      console.warn('[SIM-TA FEB UTM] Gagal sinkronisasi data backend:', err);
    } finally {
      setIsSyncingBackend(false);
    }
  };

  // Modal Verifikasi Dokumen & QR Code
  const [isVerifierOpen, setIsVerifierOpen] = useState(false);
  const [verifierCode, setVerifierCode] = useState('');

  // Modal QA & Testing Suite (Fase 5: UAT, Security, Responsiveness)
  const [isQAModalOpen, setIsQAModalOpen] = useState(false);

  useEffect(() => {
    // Deteksi jika pengguna membuka tautan QR code verifikasi langsung: ?code=...
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam) {
      setVerifierCode(codeParam);
      setIsVerifierOpen(true);
    }

    // Dukungan parameter URL untuk pengujian / deep-linking (HANYA MODE PENGEMBANGAN).
    // PENTING: pada produksi, peran sesi HANYA boleh berasal dari token JWT terverifikasi
    // melalui halaman login resmi — tidak boleh dari parameter URL yang dapat dimanipulasi.
    const roleParam = urlParams.get('role');
    const navParam = urlParams.get('nav');
    if (import.meta.env.DEV && roleParam) {
      setCurrentRole(roleParam);
      const matchedUser = INITIAL_USER_ACCOUNTS.find(x => x.role === roleParam);
      if (matchedUser) {
        setAuthSession(matchedUser);
        saveToStorage(STORAGE_KEYS.AUTH_SESSION, matchedUser);
      }
      setActiveNavId(navParam || (roleParam === 'admin' ? 'jadwal-tahapan' : 'dashboard'));
    } else if (navParam) {
      setActiveNavId(navParam);
    }
  }, []);

  // Sinkronisasi data backend HANYA dijalankan bila sudah ada sesi login (token tersedia).
  // Tanpa gerbang ini, halaman login akan memanggil endpoint terproteksi tanpa token
  // dan memicu banyak respons 401 (Unauthorized) yang tidak perlu.
  useEffect(() => {
    if (authSession) {
      syncFromBackend();
    }
  }, [authSession]);

  // Handlers Dewan Penguji (Fase G)
  const handleSelectUjianPenguji = (ujianId) => {
    setSelectedUjianPengujiId(ujianId);
    setActiveNavId('detail-ujian');
  };

  const handleOpenPenilaianPenguji = (ujianId) => {
    if (ujianId) setSelectedUjianPengujiId(ujianId);
    setActiveNavId('penilaian');
  };

  const handleOpenNaskahPenguji = (ujianId) => {
    if (ujianId) setSelectedUjianPengujiId(ujianId);
    setActiveNavId('naskah');
  };

  const handleSubmitNilaiPenguji = async ({ ujianId, nilaiFinal, grade, nilaiAspek, rekomendasiKelayakan, catatanEvaluasi }) => {
    setDaftarUjianPenguji(prev => prev.map(u => {
      if (u.id === ujianId) {
        return {
          ...u,
          penilaianSubmitted: true,
          nilaiFinal,
          grade,
          rekomendasiKelayakan: rekomendasiKelayakan || u.rekomendasiKelayakan,
          statusUjian: 'Selesai Dinilai'
        };
      }
      return u;
    }));

    if (isBackendOnline) {
      try {
        await pengujiApi.submitNilai(ujianId, {
          nilaiFinal,
          grade,
          rekomendasiKelayakan,
          catatanEvaluasi,
          nilaiAspek
        });

        // 1. Broadcast Notifikasi Real-Time In-App
        await notificationApi.broadcast({
          role: 'mahasiswa',
          title: 'Penilaian Ujian Sidang Selesai',
          message: `Dewan Penguji telah mengesahkan Nilai Akhir: ${Number(nilaiFinal).toFixed(2)} (${grade}) - Status: ${rekomendasiKelayakan || 'Lulus dengan Revisi'}.`,
          type: 'success',
          eventCategory: 'penilaian_ujian',
          actionUrl: '/mahasiswa/ujian'
        });

        // 2. Kirim Email Resmi SLA (Catatan Koreksi / Kelulusan)
        await notificationApi.sendEmail('CATATAN_REVISI_BARU', {
          recipientEmail: 'ilham.maulana@student.trunojoyo.ac.id',
          recipientName: 'Ilham Maulana',
          pengujiNama: 'Dr. Faidal, S.E., M.M.',
          daftarKoreksi: catatanEvaluasi || 'Perbaikan naskah sesuai catatan masukan dewan penguji pada lembar berita acara.',
          tenggatHari: 14
        });
      } catch (err) {
        console.warn('Gagal menyimpan penilaian / mengirim notifikasi:', err);
      }
    }
  };

  const handleAddKoreksiPenguji = async (newKoreksi) => {
    const item = {
      ...newKoreksi,
      id: newKoreksi.id || `kor-${Date.now()}`
    };
    setKoreksiListPenguji(prev => [item, ...prev]);
    setDaftarUjianPenguji(prev => prev.map(u => {
      if (u.id === newKoreksi.ujianId) {
        return { ...u, catatanTersimpan: (u.catatanTersimpan || 0) + 1 };
      }
      return u;
    }));

    if (isBackendOnline) {
      try {
        const res = await pengujiApi.createKoreksi(item);
        if (!res || res.success === false) {
          // Gulung balik perubahan optimistis agar UI tidak menampilkan catatan hantu.
          setKoreksiListPenguji(prev => prev.filter(k => k.id !== item.id));
          setDaftarUjianPenguji(prev => prev.map(u => (
            u.id === newKoreksi.ujianId
              ? { ...u, catatanTersimpan: Math.max((u.catatanTersimpan || 1) - 1, 0) }
              : u
          )));
          return { success: false, message: res?.message || 'Gagal menyimpan catatan koreksi ke basis data.' };
        }
      } catch (err) {
        console.warn('Gagal menyimpan catatan koreksi ke backend:', err);
        setKoreksiListPenguji(prev => prev.filter(k => k.id !== item.id));
        setDaftarUjianPenguji(prev => prev.map(u => (
          u.id === newKoreksi.ujianId
            ? { ...u, catatanTersimpan: Math.max((u.catatanTersimpan || 1) - 1, 0) }
            : u
        )));
        return { success: false, message: 'Gagal menyimpan catatan koreksi ke basis data.' };
      }
    }
    return { success: true };
  };

  const handleDeleteKoreksiPenguji = async (koreksiId) => {
    setKoreksiListPenguji(prev => prev.filter(k => k.id !== koreksiId));
    if (isBackendOnline) {
      try {
        await pengujiApi.deleteKoreksi(koreksiId);
      } catch (err) {
        console.warn('Gagal menghapus catatan koreksi di backend:', err);
      }
    }
  };

  const handleApproveRevisiPenguji = async (koreksiId) => {
    setKoreksiListPenguji(prev => prev.map(k => {
      if (k.id === koreksiId) {
        return { ...k, statusVerifikasi: 'Telah Disetujui Penguji' };
      }
      return k;
    }));

    if (isBackendOnline) {
      try {
        await pengujiApi.updateStatusKoreksi(koreksiId, { statusVerifikasi: 'Telah Disetujui Penguji' });
      } catch (err) {
        console.warn('Gagal approve status revisi di backend:', err);
      }
    }
  };

  const handleRejectRevisiPenguji = async (koreksiId, feedback) => {
    setKoreksiListPenguji(prev => prev.map(k => {
      if (k.id === koreksiId) {
        return {
          ...k,
          statusVerifikasi: 'Perlu Perbaikan Lanjutan',
          catatanKoreksi: `${k.catatanKoreksi} [Catatan Lanjutan Penguji: ${feedback}]`
        };
      }
      return k;
    }));

    if (isBackendOnline) {
      try {
        await pengujiApi.updateStatusKoreksi(koreksiId, {
          statusVerifikasi: 'Perlu Perbaikan Lanjutan',
          catatanLanjutan: feedback
        });
      } catch (err) {
        console.warn('Gagal reject status revisi di backend:', err);
      }
    }
  };

  // Handlers Koorprodi
  const handleSelectMahasiswaKoorprodi = (mhsId) => {
    setSelectedMhsKoorprodiId(mhsId);
    setActiveNavId('detail-mahasiswa');
  };

  const handleUpdatePengajuanKoorprodi = async (updatedItem) => {
    setPengajuanKoorprodi(prev => prev.map(p => p.id === updatedItem.id ? updatedItem : p));

    if (isBackendOnline && updatedItem?.nim) {
      try {
        // Pengajuan koorprodi dipetakan ke rekam pendaftaran_ujian mahasiswa (berdasarkan NIM),
        // karena berkas pendaftaran adalah entitas backend yang sebenarnya.
        const list = await adminApi.getVerifikasi();
        const owned = Array.isArray(list)
          ? list.filter(v => String(v.nim).trim() === String(updatedItem.nim).trim())
          : [];
        // Utamakan berkas yang masih menunggu verifikasi; jika tidak ada, pakai yang terbaru.
        const match = owned.find(v => /menunggu/i.test(String(v.statusVerifikasi || ''))) || owned[0] || null;
        if (!match) {
          return { success: false, message: 'Berkas pendaftaran mahasiswa ini belum terdaftar di basis data.' };
        }
        const res = await adminApi.updateVerifikasi(match.id, {
          statusVerifikasi: updatedItem.statusVerifikasi,
          catatanAdmin: updatedItem.catatanKoorprodi || ''
        });
        if (res && res.success === false) {
          return { success: false, message: res.message || 'Gagal menyimpan keputusan verifikasi ke basis data.' };
        }
      } catch (err) {
        console.warn('Gagal menyinkronkan keputusan koorprodi ke backend:', err);
        return { success: false, message: 'Gagal menyinkronkan keputusan ke basis data.' };
      }
    }
    return { success: true };
  };

  // Handler Penginputan Nilai Riil Hasil Sidang Portofolio Dosen Offline oleh Koorprodi
  // Aturan Akademik: Mahasiswa layak mengambil skema TAKK jika akumulasi Nilai Riil Sidang > 70 Poin
  const handleNilaiPortofolioKoorprodi = async (payload) => {
    const {
      mhsId,
      nim,
      namaMahasiswa,
      evaluasiItems = [],
      beritaAcaraNo,
      tanggalSidang,
      dewanPenilai,
      catatanSidang,
      totalNilaiRiil,
      isLayakTAKK
    } = payload;

    const today = formatTanggal(new Date(), '');
    const calculatedPoinRiil = totalNilaiRiil !== undefined 
      ? Number(totalNilaiRiil) 
      : evaluasiItems.reduce((acc, it) => acc + (Number(it.poinRiil) || 0), 0);
    const isEligible = isLayakTAKK !== undefined ? isLayakTAKK : calculatedPoinRiil > 70;
    const isDirectA = calculatedPoinRiil >= 80;

    // 1. Perbarui state students (Mahasiswa)
    setStudents(prev => prev.map(s => {
      const match = s.id === mhsId || (nim && String(s.nim).trim() === String(nim).trim());
      if (!match) return s;

      const currentItems = Array.isArray(s.portofolioData?.items) ? [...s.portofolioData.items] : [];
      let updatedItems = [];

      if (evaluasiItems.length > 0) {
        updatedItems = currentItems.map(it => {
          const evalItem = evaluasiItems.find(e => e.id === it.id || (e.nama && it.nama && e.nama.trim() === it.nama.trim()));
          if (evalItem) {
            return {
              ...it,
              poinRiil: Number(evalItem.poinRiil) || 0,
              catatanSidang: catatanSidang || it.catatanSidang || '',
              beritaAcaraSidang: beritaAcaraNo,
              tanggalSidang: tanggalSidang || today,
              dewanPenilai: dewanPenilai || it.dewanPenilai,
              status: 'Disetujui — Telah Disidangkan'
            };
          }
          return it;
        });

        // Tambahkan item evaluasi yang baru jika belum tercatat di data mahasiswa
        evaluasiItems.forEach(e => {
          if (!updatedItems.some(it => it.id === e.id || (e.nama && it.nama && e.nama.trim() === it.nama.trim()))) {
            updatedItems.push({
              ...e,
              poinRiil: Number(e.poinRiil) || 0,
              catatanSidang: catatanSidang || '',
              beritaAcaraSidang: beritaAcaraNo,
              tanggalSidang: tanggalSidang || today,
              dewanPenilai: dewanPenilai,
              status: 'Disetujui — Telah Disidangkan'
            });
          }
        });
      } else {
        updatedItems = currentItems;
      }

      const totalKlaim = updatedItems.reduce((acc, it) => acc + (Number(it.poinKlaim ?? it.poin) || 0), 0);

      return {
        ...s,
        statusTahap: isDirectA
          ? 'Memenuhi Syarat Konversi Nilai A Langsung (Bebas Ujian Sidang TAKK)'
          : isEligible
          ? 'Portofolio Disahkan Dewan Dosen — Layak Mengambil Skema TAKK (>70 Poin)'
          : `Hasil Sidang Dosen: Belum Memenuhi Syarat TAKK (${calculatedPoinRiil} / >70 Poin)`,
        portofolioData: {
          ...s.portofolioData,
          totalPoin: calculatedPoinRiil,
          totalPoinRiil: calculatedPoinRiil,
          totalPoinKlaim: totalKlaim,
          isEligibleTAKK: isEligible,
          beritaAcaraSidang: beritaAcaraNo,
          tanggalSidang: tanggalSidang || today,
          dewanPenilai,
          catatanSidang,
          items: updatedItems,
          nilaiAkhir: isDirectA 
            ? 'Nilai A (Konversi Langsung)' 
            : isEligible 
            ? 'Nilai B+/A- (Layak Ujian Sidang TAKK)' 
            : 'Belum Memenuhi Syarat TAKK',
          statusKelayakan: isDirectA 
            ? 'Memenuhi Syarat Konversi Nilai A Langsung (Bebas Ujian Sidang TAKK)' 
            : isEligible 
            ? 'Memenuhi Syarat Skema TAKK (Layak Ujian/Sidang Diseminasi)' 
            : `Belum Memenuhi Syarat Portofolio TAKK (${calculatedPoinRiil} / >70 Poin Riil Sidang)`
        }
      };
    }));

    // 2. Perbarui state portofolioListMhs
    setPortofolioListMhs(prev => {
      const updated = prev.map(p => {
        const matchStudent = p.mhsId === mhsId || (nim && String(p.nim).trim() === String(nim).trim());
        if (!matchStudent) return p;

        const evalItem = evaluasiItems.find(e => e.id === p.id || (e.nama && p.nama && e.nama.trim() === p.nama.trim()));
        if (evalItem) {
          return {
            ...p,
            poinRiil: Number(evalItem.poinRiil) || 0,
            catatanSidang: catatanSidang || p.catatanSidang || '',
            beritaAcaraSidang: beritaAcaraNo,
            tanggalSidang: tanggalSidang || today,
            dewanPenilai: dewanPenilai || p.dewanPenilai,
            status: 'Disetujui — Telah Disidangkan'
          };
        }
        return p;
      });

      evaluasiItems.forEach(e => {
        if (!updated.some(p => p.id === e.id || ((p.mhsId === mhsId || String(p.nim).trim() === String(nim).trim()) && p.nama === e.nama))) {
          updated.push({
            ...e,
            mhsId: mhsId,
            nim: nim,
            namaMahasiswa: namaMahasiswa,
            poinRiil: Number(e.poinRiil) || 0,
            catatanSidang: catatanSidang || '',
            beritaAcaraSidang: beritaAcaraNo,
            tanggalSidang: tanggalSidang || today,
            dewanPenilai: dewanPenilai,
            status: 'Disetujui — Telah Disidangkan'
          });
        }
      });

      return updated;
    });

    // 3. Perbarui antrean pengajuan Koorprodi
    setPengajuanKoorprodi(prev => prev.map(p => {
      const match = (nim && String(p.nim).trim() === String(nim).trim()) || p.mhsId === mhsId;
      if (match) {
        return {
          ...p,
          statusVerifikasi: isEligible ? 'Disetujui' : 'Menunggu Verifikasi',
          beritaAcaraSidang: beritaAcaraNo,
          tanggalSidang: tanggalSidang || today,
          dewanPenilai: dewanPenilai,
          catatanSidang: catatanSidang,
          nilaiRiilSidang: calculatedPoinRiil,
          isLayakTAKK: isEligible,
          catatanKoorprodi: isEligible
            ? `Disahkan layak skema TAKK berdasarkan Sidang Portofolio Dosen (Total Nilai Riil: ${calculatedPoinRiil} Poin > 70, No. BA: ${beritaAcaraNo}).`
            : `Hasil Sidang Tim Dosen: Nilai Riil ${calculatedPoinRiil} Poin (Belum memenuhi ambang batas minimal > 70 Poin). Mahasiswa diminta menambah portofolio atau dialihkan ke skripsi reguler.`
        };
      }
      return p;
    }));

    // 4. Kirim notifikasi broadcast in-app
    try {
      await notificationApi.broadcast({
        role: 'mahasiswa',
        title: 'Hasil Sidang Portofolio Diterbitkan Koorprodi',
        message: `Nilai riil portofolio hasil sidang dewan dosen: ${calculatedPoinRiil} Poin. Status: ${isEligible ? 'LAYAK SKEMA TAKK (> 70 Poin)' : 'BELUM LAYAK TAKK (≤ 70 Poin)'}. No. BA: ${beritaAcaraNo}.`,
        type: isEligible ? 'success' : 'warning',
        eventCategory: 'portofolio_sidang',
        actionUrl: '/mahasiswa/portofolio'
      });
    } catch (err) {
      console.warn('Gagal kirim notifikasi penilaian portofolio:', err);
    }

    return { success: true, calculatedPoinRiil, isEligible };
  };

  // Handler Plotting Pembimbing oleh Koorprodi (tersambung ke entitas Tugas Akhir & State Lokal)
  const handleSavePlottingKoorprodi = async ({ nim, namaMahasiswa, pembimbingUtama, pembimbingPendamping }) => {
    if (!nim && !namaMahasiswa) return { success: false, message: 'Mahasiswa belum dipilih.' };

    const targetNim = nim ? String(nim).trim() : null;
    const targetName = namaMahasiswa ? namaMahasiswa.trim().toLowerCase() : null;

    // Perbarui state mahasiswa bimbingan & master students secara reaktif
    setStudents(prev => (Array.isArray(prev) ? prev.map(s => {
      const match = (targetNim && String(s.nim).trim() === targetNim) || (targetName && s.nama && s.nama.toLowerCase().includes(targetName));
      if (!match) return s;

      const pembList = [];
      if (pembimbingUtama) pembList.push({ peran: s.jenjang === 'S3' ? 'Promotor' : 'Pembimbing Utama', nama: pembimbingUtama });
      if (pembimbingPendamping) pembList.push({ peran: s.jenjang === 'S3' ? 'Kopromotor' : 'Pembimbing Pendamping', nama: pembimbingPendamping });

      return {
        ...s,
        pembimbingUtama: pembimbingUtama || s.pembimbingUtama,
        pembimbingPendamping: pembimbingPendamping || null,
        pembimbing: pembList.length > 0 ? pembList : s.pembimbing
      };
    }) : []));

    setMahasiswaBimbingan(prev => (Array.isArray(prev) ? prev.map(m => {
      const match = (targetNim && String(m.nim).trim() === targetNim) || (targetName && m.nama && m.nama.toLowerCase().includes(targetName));
      if (!match) return m;

      const pembList = [];
      if (pembimbingUtama) pembList.push({ peran: m.jenjang === 'S3' ? 'Promotor' : 'Pembimbing Utama', nama: pembimbingUtama });
      if (pembimbingPendamping) pembList.push({ peran: m.jenjang === 'S3' ? 'Kopromotor' : 'Pembimbing Pendamping', nama: pembimbingPendamping });

      return {
        ...m,
        pembimbingUtama: pembimbingUtama || m.pembimbingUtama,
        pembimbingPendamping: pembimbingPendamping || null,
        pembimbing: pembList.length > 0 ? pembList : m.pembimbing
      };
    }) : []));

    if (!isBackendOnline || !targetNim) return { success: true };
    try {
      const res = await akademikApi.updatePembimbing(targetNim, { pembimbingUtama, pembimbingPendamping });
      if (res && res.success === false) {
        return { success: false, message: res.message || 'Gagal menetapkan pembimbing di basis data.' };
      }
      return { success: true };
    } catch (err) {
      console.warn('Gagal menetapkan pembimbing di backend:', err);
      return { success: false, message: 'Gagal menetapkan pembimbing di basis data.' };
    }
  };

  // Handlers Dosen
  const handleSelectMahasiswaDosen = (mhsId) => {
    setSelectedMhsDosenId(mhsId);
    setActiveNavId('detail-mahasiswa');
  };

  const handleOpenReview = (naskahId) => {
    setSelectedNaskahId(naskahId);
    setActiveNavId('review');
  };

  // ==========================================
  // LOGIKA AKUN BERSIH (CLEAN ISOLATION PER SESI PENGGUNA)
  // ==========================================

  // 1. Identifikasi Mahasiswa Aktif
  const isStudentSession = authSession?.role === 'mahasiswa';
  const isDemoStudent = Boolean(
    activeNavId && ['210211100142', '210211100219', '230221600018', '230201100055', '220231600004', '220211100088', '220212100018'].includes(String(authSession?.nomorInduk || '').trim())
  );

  const handleSelectStudent = (studentId) => {
    setSelectedStudentId(studentId);
    const targetStudent = Array.isArray(students) && students.find(s => s.id === studentId);
    if (targetStudent && authSession && authSession.role === 'mahasiswa') {
      const updatedSession = {
        ...authSession,
        nomorInduk: targetStudent.nim,
        nama: targetStudent.nama,
        jenjang: targetStudent.jenjang,
        prodi: targetStudent.programStudi
      };
      setAuthSession(updatedSession);
      saveToStorage(STORAGE_KEYS.AUTH_SESSION, updatedSession);
    }
  };

  let activeStudent = null;
  if (isStudentSession) {
    const foundStudent = Array.isArray(students) && students.find(s => String(s.nim).trim() === String(authSession.nomorInduk).trim());
    if (foundStudent) {
      activeStudent = foundStudent;
    } else {
      // Akun Mahasiswa Baru Bersih (Belum Ada Riwayat Bimbingan/Ujian/Turnitin)
      activeStudent = {
        id: authSession.id || `mhs-${authSession.nomorInduk}`,
        nim: authSession.nomorInduk,
        nama: authSession.nama,
        jenjang: authSession.jenjang || 'S1',
        programStudi: authSession.prodi || 'S-1 Manajemen',
        jenisTA: 'TAKT',
        bentukTA: authSession.jenjang === 'S3' ? 'Disertasi' : authSession.jenjang === 'S2' ? 'Tesis' : authSession.jenjang === 'D3' ? 'Laporan Tugas Akhir' : 'Skripsi',
        judul: 'Penyusunan Tugas Akhir Mahasiswa',
        tahapAktifId: 'tahap-1',
        tahapAktifNama: 'Penyusunan Proposal',
        statusTahap: 'Pendaftaran Awal',
        semester: 'Ganjil 2026/2027',
        ipk: 0,
        sksLulus: 0,
        toefl: 0,
        bimbinganCount: 0,
        pembimbing: [],
        turnitin: null, // Bersih, belum uji
        publikasi: null, // Bersih, belum ada publikasi
        jadwalUjian: null, // Bersih, belum ada jadwal
        isNewStudent: true
      };
    }
  } else {
    activeStudent = (Array.isArray(students) && students.find(s => s.id === selectedStudentId)) || (Array.isArray(students) && students[0]) || {
      id: 'mhs-default',
      nim: '210211100142',
      nama: 'Dinda Ayu Larasati',
      jenjang: 'S1',
      programStudi: 'S-1 Manajemen'
    };
  }

  // Data Terkait Mahasiswa Spesifik (Isolasi Ketat Per Mahasiswa)
  const currentBimbinganListMhs = isStudentSession
    ? (Array.isArray(bimbinganListMhs) ? bimbinganListMhs.filter(b => (b.nim && String(b.nim).trim() === String(activeStudent.nim).trim()) || (b.mhsId && b.mhsId === activeStudent.id)) : [])
    : bimbinganListMhs;

  const currentRevisiListMhs = isStudentSession
    ? (Array.isArray(revisiListMhs) ? revisiListMhs.filter(r => (r.nim && String(r.nim).trim() === String(activeStudent.nim).trim()) || (r.mhsId && r.mhsId === activeStudent.id)) : [])
    : revisiListMhs;

  const currentDokumenListMhs = isStudentSession
    ? (Array.isArray(dokumenListMhs) ? dokumenListMhs.filter(d => (d.nim && String(d.nim).trim() === String(activeStudent.nim).trim()) || (d.mhsId && d.mhsId === activeStudent.id)) : [])
    : dokumenListMhs;

  const currentActivitiesMhs = isStudentSession
    ? (Array.isArray(activitiesMhs) ? activitiesMhs.filter(a => (a.nim && String(a.nim).trim() === String(activeStudent.nim).trim()) || (a.mhsId && a.mhsId === activeStudent.id)) : [])
    : activitiesMhs;

  const currentPortofolioListMhs = useMemo(() => {
    const mhsItems = isStudentSession
      ? (Array.isArray(portofolioListMhs) ? portofolioListMhs.filter(p => (p.nim && String(p.nim).trim() === String(activeStudent?.nim).trim()) || (p.mhsId && p.mhsId === activeStudent?.id)) : [])
      : portofolioListMhs;
    if (mhsItems && mhsItems.length > 0) return mhsItems;
    if (Array.isArray(activeStudent?.portofolioData?.items)) return activeStudent.portofolioData.items;
    return [];
  }, [portofolioListMhs, activeStudent, isStudentSession]);

  const handleAddPortofolioMhs = async (newItem) => {
    const itemWithStudent = {
      ...newItem,
      mhsId: activeStudent?.id,
      nim: activeStudent?.nim,
      namaMahasiswa: activeStudent?.nama,
      poinKlaim: Number(newItem.poinKlaim ?? newItem.poin) || 0,
      poinRiil: null, // Poin riil ditetapkan melalui Sidang Komisi Dosen Offline yang diinput Koorprodi
      status: 'Menunggu Verifikasi Berkas Fisik'
    };
    setPortofolioListMhs(prev => [itemWithStudent, ...prev]);

    setStudents(prev => prev.map(s => {
      if (s.id === activeStudent?.id || String(s.nim).trim() === String(activeStudent?.nim).trim()) {
        const existingItems = Array.isArray(s.portofolioData?.items) ? s.portofolioData.items : [];
        const updatedItems = [itemWithStudent, ...existingItems.filter(x => x.id !== itemWithStudent.id)];
        const totalPoinKlaim = updatedItems.reduce((acc, it) => acc + (Number(it.poinKlaim ?? it.poin) || 0), 0);
        const itemsWithRiil = updatedItems.filter(it => it.poinRiil !== null && it.poinRiil !== undefined);
        const totalPoinRiil = itemsWithRiil.reduce((acc, it) => acc + (Number(it.poinRiil) || 0), 0);
        const hasHearingScores = itemsWithRiil.length > 0;
        const isEligible = hasHearingScores && totalPoinRiil > 70; // Aturan resmi: > 70 Poin
        const isDirectA = hasHearingScores && totalPoinRiil >= 80;

        return {
          ...s,
          portofolioData: {
            ...s.portofolioData,
            totalPoin: hasHearingScores ? totalPoinRiil : totalPoinKlaim,
            totalPoinRiil,
            totalPoinKlaim,
            items: updatedItems,
            nilaiAkhir: isDirectA 
              ? 'Nilai A (Konversi Langsung)' 
              : isEligible 
              ? 'Nilai B+/A- (Layak Ujian Sidang TAKK)' 
              : hasHearingScores 
              ? 'Belum Memenuhi Syarat TAKK' 
              : 'Menunggu Sidang Penilaian Dosen',
            statusKelayakan: isDirectA 
              ? 'Memenuhi Syarat Konversi Nilai A Langsung (Bebas Ujian Sidang TAKK)' 
              : isEligible 
              ? 'Memenuhi Syarat Skema TAKK (Layak Ujian/Sidang Diseminasi)' 
              : hasHearingScores 
              ? `Belum Memenuhi Syarat Portofolio TAKK (${totalPoinRiil} / >70 Poin Riil Sidang)`
              : `Menunggu Verifikasi Berkas & Sidang Dosen (Estimasi Klaim: ${totalPoinKlaim} Poin, Syarat Kelayakan: >70 Poin Riil)`
          }
        };
      }
      return s;
    }));

    setDokumenListMhs(prev => {
      const newDoc = {
        id: `doc-${Date.now()}`,
        mhsId: activeStudent?.id,
        nim: activeStudent?.nim,
        namaDokumen: `Bukti Portofolio: ${newItem.nama} (${newItem.berkas || 'Berkas.pdf'})`,
        jenis: `Portofolio (${newItem.kategori})`,
        kategori: 'Portofolio',
        tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        ukuran: '1.8 MB',
        statusVerifikasi: 'Menunggu Verifikasi Berkas Fisik',
        fileUrl: '#'
      };
      return [newDoc, ...prev];
    });

    // Persist ke basis data: publikasi/portofolio mahasiswa.
    if (isBackendOnline) {
      try {
        const res = await akademikApi.createPublikasi({
          nim: activeStudent?.nim,
          judul: newItem.nama || newItem.judul || 'Portofolio TAKK',
          jurnal: newItem.kategori || '',
          tahun: String(new Date().getFullYear()),
          tautan: newItem.tautan || '',
          buktiUrl: newItem.berkas || ''
        });
        if (res && res.success === false) {
          setPortofolioListMhs(prev => prev.filter(x => x.id !== itemWithStudent.id));
          return { success: false, message: res.message || 'Gagal menyimpan portofolio ke basis data.' };
        }
      } catch (err) {
        console.warn('Gagal menyimpan portofolio ke backend:', err);
        setPortofolioListMhs(prev => prev.filter(x => x.id !== itemWithStudent.id));
        return { success: false, message: 'Gagal menyimpan portofolio ke basis data.' };
      }
    }
    return { success: true };
  };

  const handleDeletePortofolioMhs = (itemId) => {
    setPortofolioListMhs(prev => prev.filter(x => x.id !== itemId));
    setStudents(prev => prev.map(s => {
      if (s.id === activeStudent?.id || String(s.nim).trim() === String(activeStudent?.nim).trim()) {
        const existingItems = Array.isArray(s.portofolioData?.items) ? s.portofolioData.items : [];
        const updatedItems = existingItems.filter(x => x.id !== itemId);
        const totalPoinKlaim = updatedItems.reduce((acc, it) => acc + (Number(it.poinKlaim ?? it.poin) || 0), 0);
        const itemsWithRiil = updatedItems.filter(it => it.poinRiil !== null && it.poinRiil !== undefined);
        const totalPoinRiil = itemsWithRiil.reduce((acc, it) => acc + (Number(it.poinRiil) || 0), 0);
        const hasHearingScores = itemsWithRiil.length > 0;
        const isEligible = hasHearingScores && totalPoinRiil > 70;
        const isDirectA = hasHearingScores && totalPoinRiil >= 80;

        return {
          ...s,
          portofolioData: {
            ...s.portofolioData,
            totalPoin: hasHearingScores ? totalPoinRiil : totalPoinKlaim,
            totalPoinRiil,
            totalPoinKlaim,
            items: updatedItems,
            nilaiAkhir: isDirectA 
              ? 'Nilai A (Konversi Langsung)' 
              : isEligible 
              ? 'Nilai B+/A- (Layak Ujian Sidang TAKK)' 
              : hasHearingScores 
              ? 'Belum Memenuhi Syarat TAKK' 
              : 'Menunggu Sidang Penilaian Dosen',
            statusKelayakan: isDirectA 
              ? 'Memenuhi Syarat Konversi Nilai A Langsung (Bebas Ujian Sidang TAKK)' 
              : isEligible 
              ? 'Memenuhi Syarat Skema TAKK (Layak Ujian/Sidang Diseminasi)' 
              : hasHearingScores 
              ? `Belum Memenuhi Syarat Portofolio TAKK (${totalPoinRiil} / >70 Poin Riil Sidang)`
              : updatedItems.length > 0
              ? `Menunggu Verifikasi Berkas & Sidang Dosen (Estimasi Klaim: ${totalPoinKlaim} Poin, Syarat Kelayakan: >70 Poin Riil)`
              : 'Belum Memenuhi Syarat Portofolio TAKK (0 / >70 Poin)'
          }
        };
      }
      return s;
    }));
  };

  // 2. Profil & Data Operasional Dosen Aktif (Isolasi Ketat Per Dosen)
  const isDosenRole = Boolean(authSession && (authSession.role === 'dosen' || authSession.eligibleRoles?.includes('dosen')));

  const currentMahasiswaBimbinganDosen = isDosenRole
    ? (Array.isArray(mahasiswaBimbingan) ? mahasiswaBimbingan.filter(m => {
        const dNip = String(authSession?.nomorInduk || '').trim().toLowerCase();
        const dName = String(authSession?.nama || '').trim().toLowerCase();
        if (!dNip && !dName) return false;

        // Cek kecocokan NIP
        const matchNip = (
          (m.pembimbingUtamaNip && String(m.pembimbingUtamaNip).trim().toLowerCase() === dNip) ||
          (m.kopromotorNip && String(m.kopromotorNip).trim().toLowerCase() === dNip) ||
          (m.pembimbingPendampingNip && String(m.pembimbingPendampingNip).trim().toLowerCase() === dNip) ||
          (Array.isArray(m.pembimbing) && m.pembimbing.some(p => p.nip && String(p.nip).trim().toLowerCase() === dNip))
        );
        if (matchNip) return true;

        // Cek kecocokan Nama (bersihkan gelar untuk pencocokan fleksibel)
        const cleanDName = dName.replace(/dr\.|dra\.|hj\.|prof\.|s\.e\.|m\.m\.|m\.si\.|m\.sm\.|,/gi, '').trim();
        if (!cleanDName) return false;
        const matchName = (
          (m.pembimbingUtama && m.pembimbingUtama.toLowerCase().includes(cleanDName)) ||
          (m.kopromotor && m.kopromotor.toLowerCase().includes(cleanDName)) ||
          (m.pembimbingPendamping && m.pembimbingPendamping.toLowerCase().includes(cleanDName)) ||
          (Array.isArray(m.pembimbing) && m.pembimbing.some(p => p.nama && p.nama.toLowerCase().includes(cleanDName)))
        );
        return Boolean(matchName);
      }) : [])
    : mahasiswaBimbingan;

  const adviseeNims = Array.isArray(currentMahasiswaBimbinganDosen) ? currentMahasiswaBimbinganDosen.map(m => String(m.nim).trim()) : [];
  const adviseeIds = Array.isArray(currentMahasiswaBimbinganDosen) ? currentMahasiswaBimbinganDosen.map(m => m.id) : [];

  const activeDosenProfile = isDosenRole
    ? {
        ...dosenProfile,
        nama: authSession.nama || dosenProfile.nama,
        nip: authSession.nomorInduk || dosenProfile.nip,
        email: authSession.email || dosenProfile.email,
        prodi: authSession.prodi || 'Jurusan Manajemen',
        jenjang: authSession.jenjang || 'Multi',
        jabatan: 'Dosen Pembimbing / Promotor',
        kuotaMaks: 10,
        kuotaTerpakai: currentMahasiswaBimbinganDosen.length,
        sisaKuota: Math.max(0, 10 - currentMahasiswaBimbinganDosen.length)
      }
    : dosenProfile;

  const currentBimbinganListDosen = isDosenRole
    ? (Array.isArray(bimbinganListMhs) ? bimbinganListMhs.filter(b => {
        return adviseeNims.includes(String(b.nim).trim()) || adviseeIds.includes(b.mhsId);
      }) : [])
    : bimbinganListMhs;

  const currentNaskahReviewList = isDosenRole
    ? (Array.isArray(naskahReviewList) ? naskahReviewList.filter(n => {
        const dNip = String(authSession?.nomorInduk || '').trim().toLowerCase();
        return (
          (n.dosenNip && String(n.dosenNip).trim().toLowerCase() === dNip) ||
          adviseeNims.includes(String(n.nim).trim()) ||
          adviseeIds.includes(n.mhsId)
        );
      }) : [])
    : naskahReviewList;

  const currentApprovalQueue = isDosenRole
    ? (Array.isArray(approvalQueue) ? approvalQueue.filter(a => {
        const dNip = String(authSession?.nomorInduk || '').trim().toLowerCase();
        return (
          (a.dosenNip && String(a.dosenNip).trim().toLowerCase() === dNip) ||
          adviseeNims.includes(String(a.nim).trim()) ||
          adviseeIds.includes(a.mhsId)
        );
      }) : [])
    : approvalQueue;

  const currentRevisiMonitoring = isDosenRole
    ? (Array.isArray(revisiMonitoring) ? revisiMonitoring.filter(r => {
        const dNip = String(authSession?.nomorInduk || '').trim().toLowerCase();
        return (
          (r.dosenNip && String(r.dosenNip).trim().toLowerCase() === dNip) ||
          adviseeNims.includes(String(r.nim).trim()) ||
          adviseeIds.includes(r.mhsId)
        );
      }) : [])
    : revisiMonitoring;

  const currentJadwalUjianDosen = isDosenRole
    ? (Array.isArray(jadwalUjianDosen) ? jadwalUjianDosen.filter(j => {
        const dNip = String(authSession?.nomorInduk || '').trim().toLowerCase();
        const dName = String(authSession?.nama || '').trim().toLowerCase();
        const isAdvisee = adviseeNims.includes(String(j.nim).trim()) || adviseeIds.includes(j.mhsId);
        const isInPenguji = Array.isArray(j.susunanPenguji) && j.susunanPenguji.some(p => {
          return (p.nip && String(p.nip).trim().toLowerCase() === dNip) || (p.nama && p.nama.toLowerCase().includes(dName));
        });
        return isAdvisee || isInPenguji;
      }) : [])
    : jadwalUjianDosen;

  // 3. Profil & Data Operasional Penguji Aktif (Isolasi Ketat Per Penguji)
  const isPengujiRole = Boolean(authSession && (authSession.role === 'penguji' || authSession.eligibleRoles?.includes('penguji')));

  const activePengujiProfile = isPengujiRole
    ? {
        ...pengujiProfile,
        nama: authSession.nama || pengujiProfile.nama,
        nip: authSession.nomorInduk || pengujiProfile.nip,
        email: authSession.email || pengujiProfile.email,
        prodi: authSession.prodi || 'Jurusan Manajemen',
        jenjang: authSession.jenjang || 'Multi',
        jabatan: 'Dewan Penguji Sidang'
      }
    : pengujiProfile;

  const currentDaftarUjianPenguji = isPengujiRole
    ? (Array.isArray(daftarUjianPenguji) ? daftarUjianPenguji.filter(u => {
        const pNip = String(authSession?.nomorInduk || '').trim().toLowerCase();
        const pName = String(authSession?.nama || '').trim().toLowerCase();
        if (!pNip && !pName) return false;

        // Cek NIP di susunanPenguji
        const inSusunanNip = Array.isArray(u.susunanPenguji) && u.susunanPenguji.some(p => {
          return p.nip && String(p.nip).trim().toLowerCase() === pNip;
        });
        if (inSusunanNip) return true;

        // Cek NIP di pengujiList atau penguji
        const inPengujiListNip = (
          (Array.isArray(u.pengujiList) && u.pengujiList.some(p => p.nip && String(p.nip).trim().toLowerCase() === pNip)) ||
          (Array.isArray(u.penguji) && u.penguji.some(p => p.nip && String(p.nip).trim().toLowerCase() === pNip))
        );
        if (inPengujiListNip) return true;

        // Cek Nama di susunanPenguji atau pengujiLain
        const cleanPName = pName.replace(/dr\.|dra\.|hj\.|prof\.|s\.e\.|m\.m\.|m\.si\.|m\.sm\.|,/gi, '').trim();
        if (!cleanPName) return false;

        const inSusunanName = Array.isArray(u.susunanPenguji) && u.susunanPenguji.some(p => {
          return p.nama && p.nama.toLowerCase().includes(cleanPName);
        });
        if (inSusunanName) return true;

        const inPengujiLain = Array.isArray(u.pengujiLain) && u.pengujiLain.some(p => {
          return (p.nip && String(p.nip).trim().toLowerCase() === pNip) || (p.nama && p.nama.toLowerCase().includes(cleanPName));
        });
        return Boolean(inPengujiLain);
      }) : [])
    : daftarUjianPenguji;

  const assignedUjianIds = Array.isArray(currentDaftarUjianPenguji) ? currentDaftarUjianPenguji.map(u => u.id) : [];

  const currentKoreksiListPenguji = isPengujiRole
    ? (Array.isArray(koreksiListPenguji) ? koreksiListPenguji.filter(k => {
        const pNip = String(authSession?.nomorInduk || '').trim().toLowerCase();
        const pName = String(authSession?.nama || '').trim().toLowerCase();
        const cleanPName = pName.replace(/dr\.|dra\.|hj\.|prof\.|s\.e\.|m\.m\.|m\.si\.|m\.sm\.|,/gi, '').trim();
        const matchNip = k.pengujiNip && String(k.pengujiNip).trim().toLowerCase() === pNip;
        const matchName = k.namaPenguji && k.namaPenguji.toLowerCase().includes(cleanPName);
        return assignedUjianIds.includes(k.ujianId) && (matchNip || matchName || !k.pengujiNip);
      }) : [])
    : koreksiListPenguji;

  // Entitas Terpilih (Dengan Fallback Objek Aman)
  const activeKoorprodiProfile = (authSession && (authSession.role === 'koorprodi' || (authSession.eligibleRoles && authSession.eligibleRoles.includes('koorprodi'))))
    ? {
        ...koorprodiProfile,
        nama: authSession.nama || koorprodiProfile.nama,
        nip: authSession.nomorInduk || koorprodiProfile.nip,
        email: authSession.email || koorprodiProfile.email,
        prodi: authSession.prodi || koorprodiProfile.prodi || 'S-1 Manajemen',
        jenjang: authSession.jenjang || koorprodiProfile.jenjang || 'S1',
        jabatan: `Koordinator Program Studi ${authSession.prodi || koorprodiProfile.prodi || 'S-1 Manajemen'} FEB UTM`
      }
    : {
        ...koorprodiProfile,
        prodi: koorprodiProfile?.prodi || 'S-1 Manajemen',
        jenjang: koorprodiProfile?.jenjang || 'S1',
        jabatan: koorprodiProfile?.jabatan || 'Koordinator Program Studi S-1 Manajemen FEB UTM'
      };

  // 4. Data Operasional Koorprodi (Isolasi Ketat Per Program Studi)
  // Menjamin Koorprodi HANYA mengakses data mahasiswa, pengajuan, ujian, dan berkas di prodi miliknya.
  const isKoorprodiProdiMatch = (item) => {
    if (!item) return false;
    const targetProdi = String(activeKoorprodiProfile?.prodi || '').trim().toLowerCase();
    const targetJenjang = String(activeKoorprodiProfile?.jenjang || '').trim().toLowerCase();

    const itemProdi = String(item.programStudi || item.prodi || '').trim().toLowerCase();
    const itemJenjang = String(item.jenjang || '').trim().toLowerCase();

    // 1. Cek Jenjang (S1, S2, S3, D3)
    if (targetJenjang && itemJenjang) {
      const normTargetJ = targetJenjang.replace(/[^a-z0-9]/g, '');
      const normItemJ = itemJenjang.replace(/[^a-z0-9]/g, '');
      if (normTargetJ !== normItemJ) return false;
    }

    // 2. Cek Nama Program Studi
    if (targetProdi && itemProdi) {
      const cleanTarget = targetProdi.replace(/[^a-z0-9]/g, '');
      const cleanItem = itemProdi.replace(/[^a-z0-9]/g, '');
      if (cleanItem.includes(cleanTarget) || cleanTarget.includes(cleanItem)) return true;
    }

    // 3. Fallback jika jenjang sama
    if (targetJenjang && itemJenjang && targetJenjang === itemJenjang) return true;

    return false;
  };

  const currentMahasiswaKoorprodi = (Array.isArray(mahasiswaBimbingan) ? mahasiswaBimbingan : [])
    .filter(isKoorprodiProdiMatch);

  const koorprodiAdviseeNims = new Set(currentMahasiswaKoorprodi.map(m => String(m.nim).trim()));
  const koorprodiAdviseeIds = new Set(currentMahasiswaKoorprodi.map(m => m.id));

  const isItemBelongingToKoorprodi = (item) => {
    if (!item) return false;
    if (isKoorprodiProdiMatch(item)) return true;
    if (item.nim && koorprodiAdviseeNims.has(String(item.nim).trim())) return true;
    if (item.nimMahasiswa && koorprodiAdviseeNims.has(String(item.nimMahasiswa).trim())) return true;
    if (item.mhsId && koorprodiAdviseeIds.has(item.mhsId)) return true;
    if (item.mahasiswa && typeof item.mahasiswa === 'string') {
      const foundInName = currentMahasiswaKoorprodi.some(m => item.mahasiswa.includes(m.nama) || (m.nim && item.mahasiswa.includes(m.nim)));
      if (foundInName) return true;
    }
    return false;
  };

  const currentPengajuanKoorprodi = (Array.isArray(pengajuanKoorprodi) ? pengajuanKoorprodi : [])
    .filter(isItemBelongingToKoorprodi);

  const currentPenetapanPengujiKoorprodi = (Array.isArray(penetapanPenguji) ? penetapanPenguji : [])
    .filter(isItemBelongingToKoorprodi);

  const currentRevisiKoorprodi = (Array.isArray(revisiMonitoring) ? revisiMonitoring : [])
    .filter(isItemBelongingToKoorprodi);

  const currentDokumenKoorprodi = (Array.isArray(dokumenProdi) ? dokumenProdi : [])
    .filter(isItemBelongingToKoorprodi);

  const currentStudentsKoorprodi = (Array.isArray(students) ? students : [])
    .filter(isKoorprodiProdiMatch);

  const activeMhsKoorprodi = (Array.isArray(currentMahasiswaKoorprodi) && currentMahasiswaKoorprodi.find(m => m.id === selectedMhsKoorprodiId)) 
    || (Array.isArray(currentMahasiswaKoorprodi) && currentMahasiswaKoorprodi[0]) 
    || { id: 'mhs-default', nama: 'Mahasiswa FEB' };

  const activeAdminProfile = (authSession && (authSession.role === 'admin' || (authSession.eligibleRoles && authSession.eligibleRoles.includes('admin'))))
    ? {
        ...adminProfile,
        nama: authSession.nama || adminProfile.nama,
        nip: authSession.nomorInduk || adminProfile.nip,
        email: authSession.email || adminProfile.email
      }
    : adminProfile;

  const activeMhsDosen = (Array.isArray(currentMahasiswaBimbinganDosen) && currentMahasiswaBimbinganDosen.find(m => m.id === selectedMhsDosenId)) || (Array.isArray(currentMahasiswaBimbinganDosen) && currentMahasiswaBimbinganDosen[0]) || null;
  // Audit 21 Oktober 2026 (BP-2): entri contoh dari data simulasi (id 'nsk-*')
  // TIDAK boleh dipilih lebih dulu daripada naskah nyata dari basis data —
  // akibatnya halaman Review Naskah menampilkan data contoh, dan keputusan
  // persetujuan terkirim ke id yang tidak ada (404).
  const naskahBackend = (Array.isArray(currentNaskahReviewList) ? currentNaskahReviewList : [])
    .filter(n => !String(n.id || '').startsWith('nsk-'));
  const activeNaskahDetail =
    (naskahBackend.find(n => n.id === selectedNaskahId)) ||
    naskahBackend[0] ||
    (Array.isArray(currentNaskahReviewList) && currentNaskahReviewList[0]) ||
    null;

  // Handlers Admin Akademik
  const handleUpdateVerifikasiAdmin = async (updatedItem) => {
    setVerifikasiList(prev => {
      const nextList = prev.map(v => v.id === updatedItem.id ? updatedItem : v);
      saveToStorage(STORAGE_KEYS.VERIFIKASI_BERKAS_ADMIN, nextList);
      return nextList;
    });

    // Ketika berkas diverifikasi sah oleh Admin, berkas portofolio berstatus 'Berkas Sah — Menunggu Sidang Dosen'
    // (Bukan otomatis nilai penuh, karena nilai riil ditentukan di sidang dosen offline dan diinput Koorprodi)
    if (updatedItem.statusVerifikasi === 'Terverifikasi' || updatedItem.statusVerifikasi === 'Terverifikasi Lolos') {
      const targetNim = updatedItem.nim;
      const targetMhsId = updatedItem.mhsId;

      setPortofolioListMhs(prev => prev.map(p => {
        const match = (targetNim && String(p.nim).trim() === String(targetNim).trim()) || (targetMhsId && p.mhsId === targetMhsId);
        if (match && (!p.status || p.status.includes('Menunggu Verifikasi'))) {
          return { ...p, status: 'Berkas Sah — Menunggu Sidang Dosen' };
        }
        return p;
      }));

      setStudents(prev => prev.map(s => {
        const match = (targetNim && String(s.nim).trim() === String(targetNim).trim()) || (targetMhsId && s.id === targetMhsId);
        if (match && s.portofolioData?.items) {
          const updatedItems = s.portofolioData.items.map(it => {
            if (!it.status || it.status.includes('Menunggu Verifikasi')) {
              return { ...it, status: 'Berkas Sah — Menunggu Sidang Dosen' };
            }
            return it;
          });
          return {
            ...s,
            portofolioData: {
              ...s.portofolioData,
              items: updatedItems,
              statusKelayakan: s.portofolioData.isEligibleTAKK 
                ? s.portofolioData.statusKelayakan 
                : 'Berkas Portofolio Sah Secara Administratif — Menunggu Pelaksanaan Sidang Penilaian Tim Dosen'
            }
          };
        }
        return s;
      }));
    }

    if (isBackendOnline) {
      try {
        await adminApi.updateVerifikasi(updatedItem.id, updatedItem);
        if (updatedItem.statusVerifikasi === 'Terverifikasi' || updatedItem.statusVerifikasi === 'Terverifikasi Lolos') {
          await notificationApi.broadcast({
            role: 'mahasiswa',
            title: 'Berkas Pendaftaran Ujian Disetujui',
            message: `Berkas persyaratan ujian (${updatedItem.namaMahasiswa || 'Tugas Akhir'}) telah diverifikasi sah oleh Subbag Akademik.`,
            type: 'success',
            eventCategory: 'pendaftaran_ujian',
            actionUrl: '/mahasiswa/persyaratan'
          });
        }
      } catch (err) {
        console.warn('Gagal memperbarui verifikasi di backend:', err);
      }
    }
  };

  // Handler Pengunggahan Berkas Persyaratan Mahasiswa (Tersinkronisasi ke Admin & Dokumen)
  const handleUploadPersyaratanMhs = async ({
    mhsId,
    nim,
    namaMahasiswa,
    jenjang,
    programStudi,
    jenisPersyaratanId,
    jenisPersyaratanNama,
    fileName,
    fileSize,
    catatan,
    fileUrl,
    metrik
  }) => {
    const today = formatTanggal(new Date(), '');

    // Filter metrik: hanya field yang bertipe benar dan layak
    const metrikSanitized = (() => {
      if (!metrik || typeof metrik !== 'object') return null;
      const m = {};
      const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
      const ipk = num(metrik.ipk); if (Number.isFinite(ipk) && ipk >= 0 && ipk <= 4) m.ipk = ipk;
      const sks = num(metrik.sksLulus); if (Number.isFinite(sks) && sks >= 0 && sks <= 300) m.sksLulus = sks;
      const toefl = num(metrik.toeflScore); if (Number.isFinite(toefl) && toefl >= 0 && toefl <= 700) m.toeflScore = toefl;
      const sim = num(metrik.similarity); if (Number.isFinite(sim) && sim >= 0 && sim <= 100) m.similarity = sim;
      const ai = num(metrik.aiDetection); if (Number.isFinite(ai) && ai >= 0 && ai <= 100) m.aiDetection = ai;
      if (typeof metrik.sertifikatNo === 'string' && metrik.sertifikatNo.trim()) m.sertifikatNo = metrik.sertifikatNo.trim().slice(0, 200);
      if (typeof metrik.sertifikatTgl === 'string' && metrik.sertifikatTgl.trim()) m.sertifikatTgl = metrik.sertifikatTgl.trim().slice(0, 20);
      return Object.keys(m).length > 0 ? m : null;
    })();

    // 1. Sinkronkan ke Antrean Verifikasi Admin Akademik
    setVerifikasiList(prev => {
      const existingIdx = prev.findIndex(v => v.nim === nim || v.mhsId === mhsId);
      let nextList;
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const berkasList = existing.berkasList ? [...existing.berkasList] : [];
        const matchBerkasIdx = berkasList.findIndex(
          b => b.id === jenisPersyaratanId ||
               b.nama?.toLowerCase().includes(jenisPersyaratanNama?.toLowerCase()) ||
               jenisPersyaratanNama?.toLowerCase().includes(b.nama?.toLowerCase())
        );
        const itemPayload = {
          id: jenisPersyaratanId || `b-${Date.now()}`,
          nama: jenisPersyaratanNama,
          file: fileName,
          status: 'Menunggu Verifikasi',
          catatan: catatan || 'Diunggah oleh mahasiswa',
          tanggalUnggah: today,
          ...(metrikSanitized ? { metrik: metrikSanitized } : {})
        };
        if (matchBerkasIdx >= 0) {
          berkasList[matchBerkasIdx] = { ...berkasList[matchBerkasIdx], ...itemPayload };
        } else {
          berkasList.push(itemPayload);
        }
        const updatedItem = {
          ...existing,
          statusVerifikasi: 'Menunggu Verifikasi',
          berkasList
        };
        nextList = prev.map((item, idx) => idx === existingIdx ? updatedItem : item);
      } else {
        const newItem = {
          id: `berkas-${mhsId || Date.now()}`,
          mhsId: mhsId || 'mhs-s1-1',
          nim: nim || '210211100142',
          namaMahasiswa: namaMahasiswa || 'Dinda Ayu Larasati',
          jenjang: jenjang || 'S1',
          programStudi: programStudi || 'S-1 Manajemen',
          jenisUjian: 'Pendaftaran Berkas Persyaratan Ujian',
          tanggalDaftar: today,
          statusVerifikasi: 'Menunggu Verifikasi',
          pembimbingUtama: 'Dra. Hj. S. Anugrahini Irawati, M.M.',
          kopromotor: '-',
          judul: 'Pendaftaran Dokumen Persyaratan Mahasiswa',
          berkasList: [
            {
              id: jenisPersyaratanId || `b-${Date.now()}`,
              nama: jenisPersyaratanNama,
              file: fileName,
              status: 'Menunggu Verifikasi',
              catatan: catatan || 'Diunggah oleh mahasiswa',
              tanggalUnggah: today,
              ...(metrikSanitized ? { metrik: metrikSanitized } : {})
            }
          ],
          catatanAdmin: '',
          ...(metrikSanitized ? { metrikAkademik: metrikSanitized } : {})
        };
        nextList = [newItem, ...prev];
      }
      saveToStorage(STORAGE_KEYS.VERIFIKASI_BERKAS_ADMIN, nextList);
      return nextList;
    });

    // 2. Arsipkan ke Dokumen Resmi Mahasiswa
    setDokumenListMhs(prev => {
      const newDoc = {
        id: `doc-${Date.now()}`,
        mhsId: mhsId,
        namaDokumen: `${jenisPersyaratanNama} (${fileName})`,
        jenis: 'Berkas Persyaratan',
        kategori: 'Persyaratan',
        tanggal: today,
        ukuran: fileSize || '1.5 MB',
        statusVerifikasi: 'Menunggu Verifikasi',
        fileUrl: fileUrl || '#'
      };
      const nextDocs = [newDoc, ...prev];
      saveToStorage(STORAGE_KEYS.DOKUMEN_MHS, nextDocs);
      return nextDocs;
    });

    // Persist ke basis data: pendaftaran berkas persyaratan ujian mahasiswa.
    if (isBackendOnline) {
      try {
        const res = await adminApi.createVerifikasi({
          mhsId,
          nim,
          namaMahasiswa,
          jenjang,
          programStudi,
          jenisUjian: 'Pendaftaran Berkas Persyaratan Ujian',
          tanggalDaftar: today,
          judul: 'Pendaftaran Dokumen Persyaratan Mahasiswa',
          berkasList: [{
            id: jenisPersyaratanId || `b-${Date.now()}`,
            nama: jenisPersyaratanNama,
            file: fileName,
            status: 'Menunggu Verifikasi',
            catatan: catatan || 'Diunggah oleh mahasiswa',
            tanggalUnggah: today,
            ...(metrikSanitized ? { metrik: metrikSanitized } : {})
          }],
          catatanAdmin: '',
          metrik: metrikSanitized || undefined
        });
        if (res && res.success === false) {
          return { success: false, message: res.message || 'Gagal menyimpan berkas persyaratan ke basis data.' };
        }
      } catch (err) {
        console.warn('Gagal menyimpan berkas persyaratan ke backend:', err);
        return { success: false, message: 'Gagal menyimpan berkas persyaratan ke basis data.' };
      }
    }
    return { success: true };
  };

  // Handler Pencatatan Sesi Bimbingan (Mahasiswa & Dosen Pembimbing)
  const handleAddBimbingan = async (entry) => {
    const nim = entry.nim || activeStudent?.nim || (isDosenRole ? activeMhsDosen?.nim : null) || authSession?.nomorInduk;
    const item = { ...entry, id: entry.id || `bim-${Date.now()}`, nim };
    setBimbinganListMhs(prev => [item, ...prev]);

    if (isBackendOnline) {
      try {
        const res = await akademikApi.createBimbingan({
          nim,
          tanggal: entry.tanggal || new Date().toISOString().split('T')[0],
          topik: entry.topik || '',
          catatan: entry.hasil || entry.catatan || ''
        });
        if (res && res.success === false) {
          setBimbinganListMhs(prev => prev.filter(b => b.id !== item.id));
          return { success: false, message: res.message || 'Gagal menyimpan sesi bimbingan ke basis data.' };
        }
        // Audit 21 Oktober 2026 (AZ-A2): adopsi id rekam dari backend agar
        // item lokal dan baris database tidak menjadi dua entri ganda
        // setelah halaman dimuat ulang.
        const idBaru = res?.data?.id;
        if (idBaru) {
          setBimbinganListMhs(prev => prev.map(b => (b.id === item.id ? { ...b, id: idBaru } : b)));
        }
      } catch (err) {
        console.warn('Gagal menyimpan sesi bimbingan ke backend:', err);
        setBimbinganListMhs(prev => prev.filter(b => b.id !== item.id));
        return { success: false, message: 'Gagal menyimpan sesi bimbingan ke basis data.' };
      }
    }
    return { success: true };
  };

  // Handler Persetujuan Sesi Bimbingan oleh Dosen Pembimbing
  const handleApproveBimbingan = async (id, status = 'Disetujui') => {
    setBimbinganListMhs(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (isBackendOnline) {
      try {
        await akademikApi.approveBimbingan(id, { status });
      } catch (err) {
        console.warn('Gagal menyetujui sesi bimbingan di backend:', err);
      }
    }
  };

  // Handler Persetujuan Tahapan oleh Dosen Pembimbing (Setujui/Tolak Maju Ujian)
  const handleUpdateApprovalDosen = async (updatedItem) => {
    setApprovalQueue(prev => prev.map(a => a.id === updatedItem.id ? updatedItem : a));

    if (!isBackendOnline || !updatedItem?.nim) return { success: true };

    // Resolusi tahap: temukan tahap yang menunggu persetujuan pembimbing.
    try {
      const ta = await akademikApi.getTugasAkhirDetail(updatedItem.nim);
      const stages = Array.isArray(ta?.tahapan) ? ta.tahapan : [];
      const pending = stages.find(s => s.status === 'Menunggu Persetujuan Pembimbing')
        || stages.find(s => s.kodeTahap === ta?.tahapAktifKode);

      if (!pending) {
        return { success: false, message: 'Tidak ada tahap yang menunggu persetujuan pembimbing untuk mahasiswa ini.' };
      }

      if (updatedItem.status === 'Disetujui') {
        const res = await akademikApi.approveTahap(ta.id || updatedItem.nim, pending.kodeTahap, {
          catatan: updatedItem.catatanKeputusan || ''
        });
        if (res && res.success === false) {
          return { success: false, message: res.message || 'Gagal menyetujui tahap di basis data.' };
        }
      }
      return { success: true };
    } catch (err) {
      console.warn('Gagal menyinkronkan keputusan persetujuan ke backend:', err);
      return { success: false, message: 'Gagal menyinkronkan keputusan persetujuan ke basis data.' };
    }
  };

  // Handler Unggah Versi Naskah Mahasiswa (Versioning ke basis data)
  // Audit 21 Oktober 2026 (BP-2): pembimbing MEMUTUSKAN atas naskahnya.
  // Keputusan ini tersimpan pada naskah_versi.status_persetujuan dan
  // memenuhi butir checklist "Naskah telah disetujui pembimbing".
  const handleNaskahDecision = async (versiId, status, catatan) => {
    try {
      const hasil = await akademikApi.approveNaskah(versiId, { status, catatan: catatan || '' });

      // Perbarui state lokal agar antarmuka langsung mencerminkan keputusan.
      setNaskahReviewList(prev => (Array.isArray(prev) ? prev : []).map((n) => (
        n.id === versiId
          ? {
              ...n,
              statusPersetujuan: status,
              statusReview: status === 'Disetujui' ? 'Disetujui' : status === 'Perlu Revisi' ? 'Perlu Direview' : 'Ditolak',
              disetujuiOleh: authSession?.nama || '',
              tanggalPersetujuan: new Date().toISOString(),
              catatanPersetujuan: catatan || ''
            }
          : n
      )));

      return hasil;
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const handleUploadNaskahMhs = async ({ keterangan, fileUrl }) => {
    const nim = activeStudent?.nim || authSession?.nomorInduk;
    if (isBackendOnline) {
      try {
        const res = await akademikApi.createNaskah({ nim, keterangan, fileUrl });
        if (res && res.success === false) {
          return { success: false, message: res.message || 'Gagal mengunggah naskah ke basis data.' };
        }
      } catch (err) {
        console.warn('Gagal mengunggah naskah ke backend:', err);
        return { success: false, message: 'Gagal mengunggah naskah ke basis data.' };
      }
    }
    return { success: true };
  };

  const handleCreateSKAdmin = async (newSK) => {
    setSkList(prev => [newSK, ...prev]);
    if (isBackendOnline) {
      try {
        await adminApi.createSK(newSK);
        await notificationApi.broadcast({
          role: 'dosen',
          title: 'SK Dekan Resmi Diterbitkan',
          message: `Surat Keputusan Dekan FEB UTM ${newSK.nomorSK || newSK.noSK} telah terbit: ${newSK.perihal || 'Penetapan Pembimbing/Penguji'}.`,
          type: 'info',
          eventCategory: 'sk_terbit',
          actionUrl: '/dosen/ujian'
        });
        await notificationApi.sendEmail('SK_UJIAN_TERBIT', {
          recipientEmail: 'dosen.pembimbing@feb.trunojoyo.ac.id',
          recipientName: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
          nomorSK: newSK.nomorSK || newSK.noSK,
          perihal: newSK.perihal || 'Penetapan Dosen Pembimbing Skripsi Semester Gasal',
          namaMahasiswa: 'Ilham Maulana'
        });
      } catch (err) {
        console.warn('Gagal menerbitkan SK di backend:', err);
      }
    }
  };

  const handleUpdateRuanganAdmin = (updatedList) => {
    setRuanganList(updatedList);
  };

  const handleUpdateJadwalTahapanList = async (updatedList, targetItem, actionType) => {
    setJadwalTahapanList(updatedList);
    if (isBackendOnline && targetItem) {
      try {
        if (actionType === 'create') {
          await adminApi.createJadwalTahapan(targetItem);
        } else if (actionType === 'edit') {
          await adminApi.updateJadwalTahapan(targetItem.id, targetItem);
        } else if (actionType === 'delete') {
          await adminApi.deleteJadwalTahapan(targetItem.id);
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi jadwal tahapan ke backend:', err);
      }
    }
  };

  const handleBroadcastJadwal = async (payload) => {
    try {
      await notificationApi.broadcast({
        role: payload.target || 'semua',
        title: payload.title,
        message: payload.message,
        type: 'info',
        eventCategory: 'jadwal_tahapan',
        actionUrl: '/mahasiswa/tahapan'
      });
      await notificationApi.sendEmail('PENGUMUMAN_JADWAL_AKADEMIK', {
        recipientEmail: 'civitas.feb@trunojoyo.ac.id',
        recipientName: 'Seluruh Mahasiswa & Dosen FEB UTM',
        judul: payload.title,
        pesan: payload.message
      });
    } catch (err) {
      console.warn('Gagal kirim broadcast jadwal:', err);
    }
  };

  // Handlers Super Admin (persist ke basis data SQLite bila backend aktif)
  const handleUpdateProdi = async (updated, meta) => {
    setMasterProdi(updated);
    if (isBackendOnline && meta && meta.prodi) {
      try {
        const res = meta.action === 'create'
          ? await superadminApi.createProdi(meta.prodi)
          : await superadminApi.updateProdi(meta.prodi.id, meta.prodi);
        if (res && res.success === false) {
          return { success: false, message: res.message || 'Gagal menyimpan data program studi.' };
        }
      } catch (err) {
        console.warn('Gagal menyimpan data prodi ke backend:', err);
        return { success: false, message: 'Gagal menyimpan data program studi ke basis data.' };
      }
    }
    return { success: true };
  };

  const handleUpdateTahapan = async (updated, jenjang) => {
    setTahapanJenjang(updated);
    if (isBackendOnline && jenjang && updated && updated[jenjang]) {
      try {
        const cfg = updated[jenjang];
        const res = await superadminApi.updateTahapan(jenjang, {
          rules: cfg.rules,
          tahapanList: cfg.tahapanList
        });
        if (res && res.success === false) {
          return { success: false, message: res.message || 'Gagal menyimpan konfigurasi tahapan.' };
        }
      } catch (err) {
        console.warn('Gagal menyimpan konfigurasi tahapan ke backend:', err);
        return { success: false, message: 'Gagal menyimpan konfigurasi tahapan ke basis data.' };
      }
    }
    return { success: true };
  };

  const handleUpdateKuota = async (updated, changedItem) => {
    setKuotaDosen(updated);
    if (isBackendOnline && changedItem && changedItem.id) {
      try {
        const res = await superadminApi.updateKuota(changedItem.id, {
          kuotaUtama: changedItem.kuotaUtama,
          kuotaPendamping: changedItem.kuotaPendamping,
          status: changedItem.status
        });
        if (res && res.success === false) {
          return { success: false, message: res.message || 'Gagal menyimpan batas kuota ke basis data.' };
        }
      } catch (err) {
        console.warn('Gagal menyimpan batas kuota ke backend:', err);
        return { success: false, message: 'Gagal menyimpan batas kuota ke basis data.' };
      }
    }
    return { success: true };
  };
  const handleUpdateUsers = (updated) => {
    setUserAccounts(updated);
    saveToStorage(STORAGE_KEYS.USER_ACCOUNTS, updated);
  };

  // Shell Profile (Dengan Parsing Inisial & Default Aman)
  const getShellUserProfile = () => {
    if (authSession && authSession.nama) {
      const sanitizedName = String(authSession.nama || '').replace(/Dr\.|Dra\.|Hj\.|H\.|Ir\.|S\.[A-Za-z]+|M\.[A-Za-z]+|Kom\.|Si\.|Pd\.|Sc\.|MM/gi, '').trim();
      const words = sanitizedName ? sanitizedName.split(/\s+/).filter(Boolean) : [];
      let computedInitials = 'UT';
      if (words.length >= 2 && words[0]?.[0] && words[1]?.[0]) {
        computedInitials = `${words[0][0]}${words[1][0]}`.toUpperCase();
      } else if (words.length === 1 && words[0]?.[0]) {
        computedInitials = words[0].slice(0, 2).toUpperCase();
      } else if (authSession.nama) {
        computedInitials = String(authSession.nama).slice(0, 2).toUpperCase();
      }

      const roleDisplay =
        authSession.role === 'superadmin' ? 'Super Administrator' :
        authSession.role === 'admin' ? 'Admin Akademik' :
        authSession.role === 'penguji' ? 'Dewan Penguji' :
        authSession.role === 'koorprodi' ? `Koorprodi ${authSession.prodi || 'Manajemen'}` :
        authSession.role === 'dosen' ? 'Dosen Pembimbing / Promotor' :
        `Mahasiswa (${authSession.jenjang || 'S1'})`;

      return {
        roleLabel: roleDisplay,
        name: authSession.nama,
        subtext: `${authSession.nomorInduk ? 'NIP/NIM. ' + authSession.nomorInduk : ''} — ${authSession.prodi || 'FEB UTM'}`,
        initials: computedInitials
      };
    }

    if (currentRole === 'superadmin') {
      return {
        roleLabel: 'Super Administrator',
        name: superadminProfile?.nama || 'Super Administrator',
        subtext: `NIP. ${superadminProfile?.nip || '-'} — ${superadminProfile?.unit || 'FEB UTM'}`,
        initials: 'SP'
      };
    }
    if (currentRole === 'admin') {
      return {
        roleLabel: 'Admin Akademik',
        name: adminProfile?.nama || 'Ahmad Fauzi, S.Kom., M.T.',
        subtext: `NIP. ${adminProfile?.nip || '-'} — ${adminProfile?.kantor || 'Subbag Akademik'}`,
        initials: 'AF'
      };
    }
    if (currentRole === 'penguji') {
      return {
        roleLabel: 'Dewan Penguji',
        name: pengujiProfile?.nama || 'Dr. Faidal, S.E., M.M.',
        subtext: `NIP. ${pengujiProfile?.nip || '-'} — ${String(pengujiProfile?.jabatan || 'Dewan Penguji').split('/')[0]}`,
        initials: 'FD'
      };
    }
    if (currentRole === 'koorprodi') {
      return {
        roleLabel: `Koorprodi ${activeKoorprodiProfile?.prodi || 'Manajemen'}`,
        name: activeKoorprodiProfile?.nama || 'Dr. Hj. Siti Aminah, S.E., M.Si.',
        subtext: `NIP. ${activeKoorprodiProfile?.nip || '-'} — ${activeKoorprodiProfile?.prodi || 'S-1 Manajemen'}`,
        initials: 'SA'
      };
    }
    if (currentRole === 'dosen') {
      return {
        roleLabel: 'Dosen Pembimbing / Promotor',
        name: dosenProfile?.nama || 'Dr. Dra. Hj. Iriani Ismail, M.M.',
        subtext: `NIP. ${dosenProfile?.nip || '-'}`,
        initials: 'II'
      };
    }
    return {
      roleLabel: `Mahasiswa ${activeStudent?.jenjang || 'S1'}`,
      name: activeStudent?.nama || 'Mahasiswa FEB UTM',
      subtext: `NIM. ${activeStudent?.nim || '-'}`,
      initials: 'IM'
    };
  };

  // ==========================================
  // RENDER ROUTER: KOORPRODI (FASE F — 10 HALAMAN)
  // Data Terisolasi Sesuai Program Studi Koorprodi Aktif
  // Penetapan Dosen Pembimbing & Penguji Tetap Terbuka Seluruh FEB UTM (Lintas Prodi)
  // ==========================================
  const renderKoorprodiContent = () => {
    switch (activeNavId) {
      case 'dashboard':
        return (
          <KoorprodiDashboardPage
            koorprodiProfile={activeKoorprodiProfile}
            mahasiswaList={currentMahasiswaKoorprodi}
            pengajuanList={currentPengajuanKoorprodi}
            penetapanPengujiList={currentPenetapanPengujiKoorprodi}
            dokumenList={currentDokumenKoorprodi}
            revisiList={currentRevisiKoorprodi}
            onNavigate={setActiveNavId}
            onSelectMahasiswa={handleSelectMahasiswaKoorprodi}
          />
        );

      case 'mahasiswa':
        return (
          <KoorprodiDaftarMahasiswaPage
            mahasiswaList={currentMahasiswaKoorprodi}
            onNavigate={setActiveNavId}
            onSelectMahasiswa={handleSelectMahasiswaKoorprodi}
          />
        );

      case 'detail-mahasiswa':
        return (
          <KoorprodiDetailMahasiswaPage
            mahasiswa={activeMhsKoorprodi}
            bimbinganList={bimbinganListMhs}
            revisiList={currentRevisiKoorprodi}
            naskahList={naskahReviewList}
            ujianList={currentPenetapanPengujiKoorprodi}
            dokumenList={currentDokumenKoorprodi}
            onNavigate={setActiveNavId}
          />
        );

      case 'pengajuan':
        return (
          <KoorprodiPengajuanPage
            pengajuanList={currentPengajuanKoorprodi}
            onUpdatePengajuan={handleUpdatePengajuanKoorprodi}
            onNavigate={setActiveNavId}
            students={currentStudentsKoorprodi}
            onNilaiPortofolio={handleNilaiPortofolioKoorprodi}
          />
        );

      case 'pembimbing':
        return (
          <KoorprodiPembimbingPage
            dosenList={plottingPembimbing}
            mahasiswaList={currentMahasiswaKoorprodi}
            onSavePlotting={handleSavePlottingKoorprodi}
            onNavigate={setActiveNavId}
            currentProdi={activeKoorprodiProfile?.prodi || 'S-1 Manajemen'}
          />
        );

      case 'penguji':
        return (
          <KoorprodiPengujiPage
            penetapanList={currentPenetapanPengujiKoorprodi}
            mahasiswaList={currentMahasiswaKoorprodi}
            dosenList={plottingPembimbing}
            onNavigate={setActiveNavId}
            currentProdi={activeKoorprodiProfile?.prodi || 'S-1 Manajemen'}
          />
        );

      case 'penerbitan-massal':
        return (
          <KoorprodiPenerbitanMassalPage
            onNavigate={setActiveNavId}
            mahasiswaList={currentMahasiswaKoorprodi}
            currentProdi={activeKoorprodiProfile?.prodi || 'S-1 Manajemen'}
          />
        );

      case 'ujian':
      case 'daftar-ujian':
        return (
          <KoorprodiUjianPage
            ujianList={currentPenetapanPengujiKoorprodi}
            mahasiswaList={currentMahasiswaKoorprodi}
            dosenList={plottingPembimbing}
            onNavigate={setActiveNavId}
            currentProdi={activeKoorprodiProfile?.prodi || 'S-1 Manajemen'}
          />
        );

      case 'persyaratan':
        return (
          <KoorprodiPersyaratanPage
            mahasiswaList={currentMahasiswaKoorprodi}
            aturanJenjang={tahapanJenjang}
            onNavigate={setActiveNavId}
          />
        );

      case 'revisi':
        return (
          <KoorprodiRevisiPage
            revisiList={currentRevisiKoorprodi}
            onNavigate={setActiveNavId}
          />
        );

      case 'dokumen':
        return (
          <KoorprodiDokumenPage
            dokumenList={currentDokumenKoorprodi}
            onNavigate={setActiveNavId}
          />
        );

      default:
        return (
          <KoorprodiDashboardPage
            koorprodiProfile={activeKoorprodiProfile}
            mahasiswaList={currentMahasiswaKoorprodi}
            pengajuanList={currentPengajuanKoorprodi}
            penetapanPengujiList={currentPenetapanPengujiKoorprodi}
            dokumenList={currentDokumenKoorprodi}
            revisiList={currentRevisiKoorprodi}
            onNavigate={setActiveNavId}
            onSelectMahasiswa={handleSelectMahasiswaKoorprodi}
          />
        );
    }
  };

  // ==========================================
  // RENDER ROUTER: PEMBIMBING (FASE E — 9 HALAMAN)
  // ==========================================
  const renderDosenContent = () => {
    switch (activeNavId) {
      case 'dashboard':
        return (
          <DosenDashboardPage
            dosenProfile={activeDosenProfile}
            mahasiswaList={currentMahasiswaBimbinganDosen}
            naskahReviewList={currentNaskahReviewList}
            approvalQueue={currentApprovalQueue}
            revisiList={currentRevisiMonitoring}
            jadwalUjianList={currentJadwalUjianDosen}
            onNavigate={setActiveNavId}
            onSelectMahasiswa={handleSelectMahasiswaDosen}
            onOpenReview={handleOpenReview}
          />
        );

      case 'mahasiswa':
        return (
          <MahasiswaBimbinganPage
            mahasiswaList={currentMahasiswaBimbinganDosen}
            onNavigate={setActiveNavId}
            onSelectMahasiswa={handleSelectMahasiswaDosen}
            onOpenReview={handleOpenReview}
          />
        );

      case 'detail-mahasiswa':
        return (
          <DosenDetailMahasiswaPage
            mahasiswa={activeMhsDosen}
            bimbinganList={currentBimbinganListDosen}
            revisiList={currentRevisiMonitoring}
            naskahList={currentNaskahReviewList}
            ujianList={currentJadwalUjianDosen}
            dokumenList={dokumenListMhs}
            onNavigate={setActiveNavId}
            onOpenReview={handleOpenReview}
          />
        );

      case 'bimbingan':
        return (
          <DosenBimbinganPage
            dosenProfile={activeDosenProfile}
            mahasiswaList={currentMahasiswaBimbinganDosen}
            bimbinganList={currentBimbinganListDosen}
            onAddBimbingan={handleAddBimbingan}
            onApproveBimbingan={handleApproveBimbingan}
            onNavigate={setActiveNavId}
          />
        );

      case 'naskah':
        return (
          <DosenNaskahPage
            naskahList={currentNaskahReviewList}
            onNavigate={setActiveNavId}
            onOpenReview={handleOpenReview}
          />
        );

      case 'review':
        return (
          <ReviewPage
            naskah={activeNaskahDetail}
            onNavigate={setActiveNavId}
            onNaskahDecision={handleNaskahDecision}
            onOpenApproval={() => setActiveNavId('persetujuan')}
          />
        );

      case 'persetujuan':
        return (
          <PersetujuanPage
            approvalQueue={currentApprovalQueue}
            onUpdateApproval={handleUpdateApprovalDosen}
            onNavigate={setActiveNavId}
          />
        );

      case 'revisi':
        return (
          <DosenRevisiPage
            revisiList={currentRevisiMonitoring}
            onNavigate={setActiveNavId}
          />
        );

      case 'ujian':
      case 'daftar-ujian':
        return (
          <DosenUjianPage
            jadwalUjianList={currentJadwalUjianDosen}
            onNavigate={setActiveNavId}
          />
        );

      default:
        return (
          <DosenDashboardPage
            dosenProfile={activeDosenProfile}
            mahasiswaList={currentMahasiswaBimbinganDosen}
            naskahReviewList={currentNaskahReviewList}
            approvalQueue={currentApprovalQueue}
            revisiList={currentRevisiMonitoring}
            jadwalUjianList={currentJadwalUjianDosen}
            onNavigate={setActiveNavId}
            onSelectMahasiswa={handleSelectMahasiswaDosen}
            onOpenReview={handleOpenReview}
          />
        );
    }
  };

  // ==========================================
  // RENDER ROUTER: MAHASISWA (FASE D — 10 HALAMAN)
  // ==========================================
  const renderMahasiswaContent = () => {
    switch (activeNavId) {
      case 'dashboard':
        return (
          <MhsDashboardPage
            student={activeStudent}
            statusKelulusan={statusKelulusan}
            studentsList={[]}
            onSelectStudent={null}
            bimbinganList={currentBimbinganListMhs}
            revisiList={currentRevisiListMhs}
            dokumenList={currentDokumenListMhs}
            activities={currentActivitiesMhs}
            onNavigate={setActiveNavId}
          />
        );

      case 'detail-ta':
        return (
          <DetailTugasAkhirPage
            student={activeStudent}
            onUpdateStudent={(up) => setStudents(prev => prev.map(s => s.id === up.id ? up : s))}
            onNavigate={setActiveNavId}
          />
        );

      case 'tahapan':
        return <TahapanPage student={activeStudent} onNavigate={setActiveNavId} />;
      case 'persyaratan':
        return (
          <MhsPersyaratanPage
            student={activeStudent}
            onNavigate={setActiveNavId}
            verifikasiList={verifikasiList}
            onUploadPersyaratan={handleUploadPersyaratanMhs}
          />
        );
      case 'bimbingan':
        return <MhsBimbinganPage student={activeStudent} bimbinganList={currentBimbinganListMhs} onAddBimbingan={handleAddBimbingan} />;
      case 'naskah':
        return <MhsNaskahPage student={activeStudent} onUploadNaskah={handleUploadNaskahMhs} onNavigate={setActiveNavId} />;
      case 'ujian':
      case 'daftar-ujian':
        return (
          <MhsUjianPage 
            student={activeStudent} 
            onNavigate={setActiveNavId} 
            onUpdateStudent={(up) => setStudents(prev => prev.map(s => s.id === up.id ? up : s))}
          />
        );
      case 'revisi':
        return <MhsRevisiPage student={activeStudent} revisiList={currentRevisiListMhs} onUpdateRevisi={(r) => setRevisiListMhs(prev => prev.map(x => x.id === r.id ? r : x))} />;
      case 'portofolio':
      case 'publikasi':
        return (
          <PortofolioPage
            student={activeStudent}
            portofolioList={currentPortofolioListMhs}
            onAddPortofolio={handleAddPortofolioMhs}
            onDeletePortofolio={handleDeletePortofolioMhs}
            onNavigate={setActiveNavId}
          />
        );
      case 'dokumen':
        return <MhsDokumenPage student={activeStudent} dokumenList={currentDokumenListMhs} onAddDokumen={(d) => setDokumenListMhs(prev => [d, ...prev])} />;
      default:
        return (
          <MhsDashboardPage
            student={activeStudent}
            statusKelulusan={statusKelulusan}
            studentsList={[]}
            onSelectStudent={null}
            bimbinganList={currentBimbinganListMhs}
            revisiList={currentRevisiListMhs}
            dokumenList={currentDokumenListMhs}
            activities={currentActivitiesMhs}
            onNavigate={setActiveNavId}
          />
        );
    }
  };

  // ==========================================
  // RENDER ROUTER: DEWAN PENGUJI (FASE G — 7 HALAMAN)
  // ==========================================
  const renderPengujiContent = () => {
    // Security Guard: Mahasiswa dilarang keras mengakses form penilaian dewan penguji
    if (currentRole === 'mahasiswa') {
      return (
        <SecurityGuard
          currentRole={currentRole}
          requiredRoles={['penguji', 'admin', 'superadmin']}
          resourceName="Form Penilaian & Direktori Sidang Dewan Penguji"
          onReturnDashboard={() => {
            setCurrentRole('mahasiswa');
            setActiveNavId('dashboard');
          }}
        />
      );
    }

    const activeUjian = currentDaftarUjianPenguji.find(u => u.id === selectedUjianPengujiId) || currentDaftarUjianPenguji[0] || null;

    switch (activeNavId) {
      case 'dashboard':
        return (
          <PengujiDashboardPage
            pengujiProfile={activePengujiProfile}
            ujianList={currentDaftarUjianPenguji}
            koreksiList={currentKoreksiListPenguji}
            onNavigate={setActiveNavId}
            onPilihUjian={handleSelectUjianPenguji}
          />
        );

      case 'daftar-ujian':
      case 'ujian':
        return (
          <PengujiDaftarUjianPage
            ujianList={currentDaftarUjianPenguji}
            onNavigate={setActiveNavId}
            onPilihUjian={handleSelectUjianPenguji}
          />
        );

      case 'detail-ujian':
        return (
          <PengujiDetailUjianPage
            ujian={activeUjian}
            onNavigate={setActiveNavId}
            onOpenPenilaian={handleOpenPenilaianPenguji}
            onOpenNaskah={handleOpenNaskahPenguji}
          />
        );

      case 'naskah':
        return (
          <PengujiNaskahPage
            ujianList={currentDaftarUjianPenguji}
            selectedUjianId={selectedUjianPengujiId}
            onSelectUjian={setSelectedUjianPengujiId}
            onNavigate={setActiveNavId}
            onAddKoreksi={handleAddKoreksiPenguji}
          />
        );

      case 'penilaian':
        return (
          <PengujiFormPenilaianPage
            ujianList={currentDaftarUjianPenguji}
            selectedUjianId={selectedUjianPengujiId}
            onSelectUjian={setSelectedUjianPengujiId}
            onNavigate={setActiveNavId}
            onSubmitNilai={handleSubmitNilaiPenguji}
          />
        );

      case 'koreksi':
        return (
          <PengujiCatatanKoreksiPage
            koreksiList={currentKoreksiListPenguji}
            ujianList={currentDaftarUjianPenguji}
            onNavigate={setActiveNavId}
            onAddKoreksi={handleAddKoreksiPenguji}
            onDeleteKoreksi={handleDeleteKoreksiPenguji}
          />
        );

      case 'revisi':
        return (
          <PengujiRevisiPage
            koreksiList={currentKoreksiListPenguji}
            onNavigate={setActiveNavId}
            onApproveRevisi={handleApproveRevisiPenguji}
            onRejectRevisi={handleRejectRevisiPenguji}
          />
        );

      default:
        return (
          <PengujiDashboardPage
            pengujiProfile={activePengujiProfile}
            ujianList={currentDaftarUjianPenguji}
            koreksiList={currentKoreksiListPenguji}
            onNavigate={setActiveNavId}
            onPilihUjian={handleSelectUjianPenguji}
          />
        );
    }
  };

  // ==========================================
  // RENDER ROUTER: ADMIN AKADEMIK (5 HALAMAN)
  // ==========================================
  const renderAdminContent = () => {
    switch (activeNavId) {
      case 'dashboard':
        return (
          <AdminDashboardPage
            adminProfile={adminProfile}
            verifikasiList={verifikasiList}
            skList={skList}
            ruanganList={ruanganList}
            jadwalList={jadwalTahapanList}
            onNavigate={setActiveNavId}
          />
        );

      case 'jadwal-tahapan':
        return (
          <AdminJadwalTahapanPage
            jadwalList={jadwalTahapanList}
            onUpdateJadwalList={handleUpdateJadwalTahapanList}
            onBroadcastJadwal={handleBroadcastJadwal}
          />
        );

      case 'otomasi-dokumen':
        return <AdminOtomasiDokumenPage onNavigate={setActiveNavId} />;

      case 'verifikasi':
        return (
          <AdminVerifikasiBerkasPage
            verifikasiList={verifikasiList}
            onUpdateVerifikasi={handleUpdateVerifikasiAdmin}
            onSync={(data) => setVerifikasiList(data)}
          />
        );

      case 'sk':
        return (
          <AdminPenerbitanSKPage
            skList={skList}
            onCreateSK={handleCreateSKAdmin}
          />
        );

      case 'ruangan':
      case 'ujian':
      case 'daftar-ujian':
        return (
          <AdminAlokasiRuanganPage
            ruanganList={ruanganList}
            onUpdateRuangan={handleUpdateRuanganAdmin}
          />
        );

      default:
        return (
          <AdminDashboardPage
            adminProfile={activeAdminProfile}
            verifikasiList={verifikasiList}
            skList={skList}
            ruanganList={ruanganList}
            jadwalList={jadwalTahapanList}
            onNavigate={setActiveNavId}
          />
        );
    }
  };

  // ==========================================
  // RENDER ROUTER: SUPER ADMIN (5 HALAMAN)
  // ==========================================
  const renderSuperAdminContent = () => {
    switch (activeNavId) {
      case 'dashboard':
        return (
          <SuperAdminDashboardPage
            superadminProfile={superadminProfile}
            masterProdi={masterProdi}
            tahapanJenjang={tahapanJenjang}
            kuotaDosen={kuotaDosen}
            userAccounts={userAccounts}
            onNavigate={setActiveNavId}
          />
        );

      case 'prodi':
        return (
          <SuperAdminMasterProdiPage
            masterProdi={masterProdi}
            onUpdateProdi={handleUpdateProdi}
          />
        );

      case 'tahapan':
      case 'ujian':
      case 'daftar-ujian':
        return (
          <SuperAdminTahapanJenjangPage
            tahapanJenjang={tahapanJenjang}
            onUpdateTahapan={handleUpdateTahapan}
          />
        );

      case 'kuota':
        return (
          <SuperAdminKuotaBimbinganPage
            kuotaDosen={kuotaDosen}
            onUpdateKuota={handleUpdateKuota}
          />
        );

      case 'users':
        return (
          <SuperAdminManajemenPenggunaPage
            userAccounts={userAccounts}
            onUpdateUsers={handleUpdateUsers}
          />
        );

      default:
        return (
          <SuperAdminDashboardPage
            superadminProfile={superadminProfile}
            masterProdi={masterProdi}
            tahapanJenjang={tahapanJenjang}
            kuotaDosen={kuotaDosen}
            userAccounts={userAccounts}
            onNavigate={setActiveNavId}
          />
        );
    }
  };

  const handleResetDemoData = async () => {
    const ok = await confirmDialog({
      title: 'Reset Data Simulasi',
      message: 'PERINGATAN: Apakah Anda yakin ingin mereset semua data simulasi di Local Storage dan memuat ulang data awal FEB UTM?',
      confirmLabel: 'Ya, Reset Data',
      variant: 'danger'
    });
    if (ok) {
      resetAllStorage();
      window.location.reload();
    }
  };

  const handleLoginSuccess = (user) => {
    setAuthSession(user);
    saveToStorage(STORAGE_KEYS.AUTH_SESSION, user);
    // Jika akun memakai kata sandi sementara (mis. hasil reset superadmin),
    // paksa pengguna mengganti kata sandi sebelum dapat menggunakan aplikasi.
    if (user?.mustChangePassword) {
      setMustChangePassword(true);
    }
    if (user.role) {
      setCurrentRole(user.role);
      setActiveNavId(user.role === 'penguji' ? 'daftar-ujian' : 'dashboard');
    }
    if (user.role === 'mahasiswa') {
      const match = (Array.isArray(students) ? students : []).find(
        s => s.nim === user.nomorInduk || s.id === user.id
      );
      if (match) {
        setSelectedStudentId(match.id);
      } else {
        const newStudentObj = {
          id: user.id || `mhs-${user.nomorInduk}`,
          nim: user.nomorInduk,
          nama: user.nama,
          jenjang: user.jenjang || 'S1',
          programStudi: user.prodi || 'S-1 Manajemen',
          jenisTA: 'TAKT',
          bentukTA: user.jenjang === 'S3' ? 'Disertasi' : user.jenjang === 'S2' ? 'Tesis' : user.jenjang === 'D3' ? 'Laporan Tugas Akhir' : 'Skripsi',
          judul: 'Penyusunan Tugas Akhir Mahasiswa',
          tahapAktifId: 'tahap-1',
          tahapAktifNama: 'Penyusunan Judul & Proposal',
          statusTahap: 'Pendaftaran Awal',
          semester: 'Ganjil 2026/2027',
          ipk: 3.50,
          sksLulus: user.jenjang === 'S1' ? 124 : 36,
          toefl: 460,
          bimbinganCount: 0,
          pembimbing: [],
          turnitin: { similarity: 18, aiDetection: 20 }
        };
        setStudents(prev => [newStudentObj, ...(Array.isArray(prev) ? prev : [])]);
        setSelectedStudentId(newStudentObj.id);
      }
    }
  };

  const handleLogout = async () => {
    if (authSession?.id) {
      try {
        await authApi.logout(authSession.id);
      } catch (err) {
        console.warn('Logout notification error:', err);
      }
    }
    setAuthSession(null);
    removeFromStorage(STORAGE_KEYS.AUTH_SESSION);
    setCurrentRole('login');
  };

  const handleRoleChange = async (newRole) => {
    setCurrentRole(newRole);
    setActiveNavId(newRole === 'penguji' ? 'daftar-ujian' : 'dashboard');

    // Jika pengguna terautentikasi (dosen multi-peran), sinkronkan token & role aktif
    if (authSession) {
      if (isBackendOnline) {
        try {
          await authApi.switchRole(newRole);
        } catch (err) {
          console.warn('Switch role token synchronization warning:', err.message);
        }
      }
      let userProdi = authSession.prodi;
      let userJenjang = authSession.jenjang;
      if (newRole === 'koorprodi') {
        const foundMaster = (userAccounts || []).find(u => u.nomorInduk === authSession.nomorInduk && (u.role === 'koorprodi' || u.eligibleRoles?.includes('koorprodi')));
        if (foundMaster?.prodi) userProdi = foundMaster.prodi;
        if (foundMaster?.jenjang) userJenjang = foundMaster.jenjang;
        if (!userProdi) userProdi = 'S-1 Manajemen';
        if (!userJenjang) userJenjang = 'S1';
      }
      const updatedUser = {
        ...authSession,
        role: newRole,
        prodi: userProdi,
        jenjang: userJenjang
      };
      setAuthSession(updatedUser);
      saveToStorage(STORAGE_KEYS.AUTH_SESSION, updatedUser);
    } else {
      // Fallback simulasi lingkungan dev
      const targetUser = userAccounts.find(u => u.role === newRole) || INITIAL_USER_ACCOUNTS.find(u => u.role === newRole);
      if (targetUser) {
        const syncedUser = {
          id: targetUser.id,
          nomorInduk: targetUser.nomorInduk,
          nama: targetUser.nama,
          email: targetUser.email,
          role: targetUser.role,
          jenjang: targetUser.jenjang || 'S1',
          prodi: targetUser.prodi || 'S-1 Manajemen',
          status: targetUser.status || 'Aktif',
          lastLogin: `Hari ini, ${formatWaktu(new Date())} WIB`
        };
        setAuthSession(syncedUser);
        saveToStorage(STORAGE_KEYS.AUTH_SESSION, syncedUser);
      }
    }
  };

  // Tampilkan Halaman Login Resmi jika belum terotentikasi atau role adalah 'login'
  if (!authSession || currentRole === 'login') {
    return (
      <>
        <LoginPage
          onLogin={handleLoginSuccess}
          initialRole={currentRole === 'login' ? 'penguji' : (currentRole || 'penguji')}
          userAccounts={userAccounts}
        />
        <FeedbackHost />
      </>
    );
  }

  return (
    <AppShell
      currentRole={currentRole}
      onRoleChange={handleRoleChange}
      activeNavId={activeNavId}
      onNavSelect={setActiveNavId}
      userProfile={getShellUserProfile()}
      currentUser={authSession}
      onLogout={handleLogout}
      onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      isBackendOnline={isBackendOnline}
      isSyncingBackend={isSyncingBackend}
      badgeCounts={{
        mahasiswaTotal: currentRole === 'koorprodi'
          ? (Array.isArray(currentMahasiswaKoorprodi) ? currentMahasiswaKoorprodi.length : 0)
          : (Array.isArray(currentMahasiswaBimbinganDosen) ? currentMahasiswaBimbinganDosen.length : 0),
        bimbinganCount: currentRole === 'dosen'
          ? (Array.isArray(currentMahasiswaBimbinganDosen) ? currentMahasiswaBimbinganDosen.filter(m => m.bimbinganCount > 0).length : 0)
          : 0,
        pengajuanPending: currentRole === 'koorprodi'
          ? (Array.isArray(currentPengajuanKoorprodi) ? currentPengajuanKoorprodi.filter(p => p.statusVerifikasi === 'Menunggu Verifikasi').length : 0)
          : (Array.isArray(pengajuanKoorprodi) ? pengajuanKoorprodi.filter(p => p.statusVerifikasi === 'Menunggu Verifikasi').length : 0),
        ujianMendatang: currentRole === 'penguji'
          ? (Array.isArray(currentDaftarUjianPenguji) ? currentDaftarUjianPenguji.length : 0)
          : currentRole === 'dosen'
          ? (Array.isArray(currentJadwalUjianDosen) ? currentJadwalUjianDosen.length : 0)
          : currentRole === 'koorprodi'
          ? (Array.isArray(currentPenetapanPengujiKoorprodi) ? currentPenetapanPengujiKoorprodi.length : 0)
          : (Array.isArray(penetapanPenguji) ? penetapanPenguji.length : 0),
        naskahPending: Array.isArray(currentNaskahReviewList) ? currentNaskahReviewList.filter(n => n.statusReview === 'Perlu Direview').length : 0,
        approvalPending: Array.isArray(currentApprovalQueue) ? currentApprovalQueue.filter(a => a.status === 'Menunggu Persetujuan').length : 0,
        penilaianPending: Array.isArray(currentDaftarUjianPenguji) ? currentDaftarUjianPenguji.filter(u => !u.penilaianSubmitted).length : 0,
        revisiPending: Array.isArray(currentKoreksiListPenguji) ? currentKoreksiListPenguji.filter(k => k.statusVerifikasi === 'Menunggu Approval Penguji').length : 0,
        berkasPending: Array.isArray(verifikasiList) ? verifikasiList.filter(v => v.statusVerifikasi === 'Menunggu Verifikasi').length : 0,
        jadwalAktif: Array.isArray(jadwalTahapanList) ? jadwalTahapanList.filter(j => j.status === 'Sedang Dibuka').length : 0,
        totalUsers: Array.isArray(userAccounts) ? userAccounts.length : 0
      }}
    >
      {/* Area Konten Utama (Bebas dari Header Bloat) */}

      {/* Render Konten Sesuai Peran Aktif (Terproteksi Suspense untuk Code-Splitting) */}
      <Suspense fallback={<AcademicPageLoading />}>
        {currentRole === 'superadmin'
          ? renderSuperAdminContent()
          : currentRole === 'admin'
          ? renderAdminContent()
          : currentRole === 'penguji'
          ? renderPengujiContent()
          : currentRole === 'koorprodi' 
          ? renderKoorprodiContent() 
          : currentRole === 'dosen' 
          ? renderDosenContent() 
          : renderMahasiswaContent()}
      </Suspense>

      {/* Modal Eksternal Terproteksi Suspense (Hanya Dimuat Saat Dibuka) */}
      <Suspense fallback={null}>
        {isVerifierOpen && (
          <DocumentVerificationModal
            isOpen={isVerifierOpen}
            onClose={() => setIsVerifierOpen(false)}
            initialCode={verifierCode}
          />
        )}

        {import.meta.env.DEV && isQAModalOpen && (
          <QATestingModal
            isOpen={isQAModalOpen}
            onClose={() => setIsQAModalOpen(false)}
            currentRole={currentRole}
            onSwitchRole={handleRoleChange}
            onNavigate={setActiveNavId}
          />
        )}

        {/* Floating Pill Dock: Kontrol Demonstrasi, Role Switcher, & QA Center (Khusus Lingkungan Development) */}
        {import.meta.env.DEV && (
          <SimulationFloatingDock
            currentRole={currentRole}
            currentUser={authSession}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            students={students}
            onRoleChange={handleRoleChange}
            isBackendOnline={isBackendOnline}
            isSyncingBackend={isSyncingBackend}
            backendSyncTime={backendSyncTime}
            onSyncBackend={syncFromBackend}
            onOpenQAModal={() => setIsQAModalOpen(true)}
            onOpenVerifier={() => {
              setVerifierCode('');
              setIsVerifierOpen(true);
            }}
            onResetDemoData={handleResetDemoData}
            onLogout={handleLogout}
          />
        )}
      </Suspense>

      {/* Modal Ganti Kata Sandi Pengguna Mandiri */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={authSession}
        onPasswordChanged={(newPassword) => {
          setUserAccounts(prev => prev.map(u => u.id === authSession?.id ? { ...u, password: newPassword } : u));
        }}
      />

      {/* Gerbang WAJIB ganti kata sandi (kata sandi sementara hasil reset). */}
      <ChangePasswordModal
        isOpen={mustChangePassword}
        forced={true}
        onClose={() => {
          // Setelah berhasil ganti, bersihkan flag pada sesi & akun lokal.
          setMustChangePassword(false);
          setAuthSession(prev => prev ? { ...prev, mustChangePassword: false } : prev);
        }}
        currentUser={authSession}
        onPasswordChanged={(newPassword) => {
          setUserAccounts(prev => prev.map(u => u.id === authSession?.id ? { ...u, password: newPassword, mustChangePassword: false } : u));
        }}
      />

      {/* Host Notifikasi (Toast) & Dialog Konfirmasi Global */}
      <FeedbackHost />
    </AppShell>
  );
}
