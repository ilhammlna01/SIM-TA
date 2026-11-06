/**
 * Data Autentik & State Awal: Modul Super Admin FEB UTM
 * Mengelola:
 * 1. Master Data Program Studi (D3, S1, S2, S3)
 * 2. Konfigurasi Tahapan & Aturan Multi-Jenjang
 * 3. Kuota Bimbingan Dosen per Jabatan Akademik
 * 4. Manajemen Akun Pengguna Multi-Role
 */

export const SUPERADMIN_PROFILE_DEFAULT = {
  id: 'superadmin-supriyanto',
  nip: '197405102000031001',
  nama: 'Ir. Supriyanto, M.Kom.',
  jabatan: 'Super Administrator Sistem Informasi Akademik FEB UTM',
  pangkat: 'Pembina / IV a',
  email: 'supriyanto.admin@trunojoyo.ac.id',
  unit: 'Pusat Data dan Teknologi Informasi FEB Universitas Trunojoyo Madura'
};

// 1. Master Data Program Studi Jurusan Manajemen FEB UTM
export const INITIAL_MASTER_PRODI = [
  {
    id: 'prodi-d3-ent',
    kodeProdi: '61401',
    namaProdi: 'D-3 Entrepreneurship',
    jenjang: 'D3',
    akreditasi: 'Baik Sekali',
    noSkAkreditasi: 'SK BAN-PT No. 4921/SK/BAN-PT/Ak-PPJ/Dipl-III/VIII/2024',
    kaprodi: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    nipKaprodi: '196201081987032001',
    kuotaMahasiswa: 120,
    mahasiswaAktif: 94,
    status: 'Aktif',
    deskripsi: 'Program Diploma 3 berbasis praktik wirausaha mandiri dan inkubasi bisnis lokal Madura.'
  },
  {
    id: 'prodi-s1-man',
    kodeProdi: '61201',
    namaProdi: 'S-1 Manajemen',
    jenjang: 'S1',
    akreditasi: 'Unggul',
    noSkAkreditasi: 'SK LAMEMBA No. 341/DE/A.5/AR.10/XI/2023',
    kaprodi: 'Dr. Hj. Siti Aminah, S.E., M.Si.',
    nipKaprodi: '197802142003122001',
    kuotaMahasiswa: 850,
    mahasiswaAktif: 780,
    status: 'Aktif',
    deskripsi: 'Program Sarjana Manajemen dengan konsentrasi Keuangan, Pemasaran, MSDM, dan Operasional.'
  },
  {
    id: 'prodi-s2-mm',
    kodeProdi: '61101',
    namaProdi: 'S-2 Magister Manajemen',
    jenjang: 'S2',
    akreditasi: 'Unggul',
    noSkAkreditasi: 'SK LAMEMBA No. 215/DE/A.5/AR.10/VII/2023',
    kaprodi: 'Dr. Faidal, S.E., M.M.',
    nipKaprodi: '197703032003121002',
    kuotaMahasiswa: 180,
    mahasiswaAktif: 145,
    status: 'Aktif',
    deskripsi: 'Program Pascasarjana berorientasi kepemimpinan manajerial strategis dan riset terapan terindeks.'
  },
  {
    id: 'prodi-s3-dim',
    kodeProdi: '61001',
    namaProdi: 'S-3 Doktor Ilmu Manajemen',
    jenjang: 'S3',
    akreditasi: 'Baik Sekali',
    noSkAkreditasi: 'SK Mendikbudristek No. 512/E/O/2022',
    kaprodi: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    nipKaprodi: '196306231989031002',
    kuotaMahasiswa: 65,
    mahasiswaAktif: 42,
    status: 'Aktif',
    deskripsi: 'Program Doktoral berfokus pada penciptaan kebaruan ilmiah (novelty) dan publikasi internasional bereputasi.'
  }
];

// 2. Konfigurasi Aturan Tahapan Akademik per Jenjang
export const INITIAL_TAHAPAN_JENJANG = {
  D3: {
    jenjangLabel: 'Diploma 3 (D3 Entrepreneurship)',
    totalTahap: 3,
    tahapanList: [
      { nomor: 1, kode: 'D3-T1', nama: 'Pengajuan Ide & Topik Proyek Bisnis', deskripsi: 'Persetujuan kelayakan ide usaha oleh Koorprodi' },
      { nomor: 2, kode: 'D3-T2', nama: 'Pendampingan & Inkubasi Usaha Lapangan', deskripsi: 'Bimbingan berkala realisasi portofolio usaha' },
      { nomor: 3, kode: 'D3-T3', nama: 'Ujian Sidang Tugas Akhir & Gelar Produk', deskripsi: 'Presentasi hasil dan evaluasi kelayakan bisnis' }
    ],
    rules: {
      minBimbingan: 6,
      minSKS: 90,
      minToefl: 400,
      maxTurnitin: 30,
      syaratPublikasi: 'Laporan Portofolio Kelayakan Bisnis',
      skorKelulusanMin: 65
    }
  },
  S1: {
    jenjangLabel: 'Sarjana (S1 Manajemen)',
    totalTahap: 4,
    tahapanList: [
      { nomor: 1, kode: 'S1-T1', nama: 'Pengajuan Topik & Plotting Pembimbing', deskripsi: 'Penetapan Dosen Pembimbing Utama & ACC Judul' },
      { nomor: 2, kode: 'S1-T2', nama: 'Seminar Proposal (Sempro)', deskripsi: 'Ujian proposal BAB I-III di hadapan 3 penguji' },
      { nomor: 3, kode: 'S1-T3', nama: 'Penelitian & Bimbingan Berkala', deskripsi: 'Pengambilan data lapangan & penyusunan naskah lengkap' },
      { nomor: 4, kode: 'S1-T4', nama: 'Sidang Ujian Skripsi / TAKK Final', deskripsi: 'Ujian komprehensif kelulusan gelar Sarjana Manajemen' }
    ],
    rules: {
      minBimbingan: 8,
      minSKS: 120,
      minToefl: 450,
      maxTurnitin: 25,
      syaratPublikasi: 'Draft Artikel Jurnal Nasional / Prosiding',
      skorKelulusanMin: 70
    }
  },
  S2: {
    jenjangLabel: 'Magister (S2 Manajemen)',
    totalTahap: 5,
    tahapanList: [
      { nomor: 1, kode: 'S2-T1', nama: 'Penetapan Pembimbing & Ujian Proposal', deskripsi: 'Sidang usulan tesis di hadapan pembimbing dan penguji' },
      { nomor: 2, kode: 'S2-T2', nama: 'Penelitian Lapangan & Penulisan Tesis', deskripsi: 'Proses bimbingan intensif tesis dan penulisan artikel' },
      { nomor: 3, kode: 'S2-T3', nama: 'Seminar Hasil Tesis (Semhas)', deskripsi: 'Pemaparan temuan riset dan pengujian empiris' },
      { nomor: 4, kode: 'S2-T4', nama: 'Ujian Tesis (Sidang Tertutup Magister)', deskripsi: 'Sidang akhir pertanggungjawaban tesis magister' },
      { nomor: 5, kode: 'S2-T5', nama: 'Pengesahan Naskah & Bebas Plagiasi Final', deskripsi: 'Penyerahan naskah final & bukti publikasi artikel' }
    ],
    rules: {
      minBimbingan: 10,
      minSKS: 36,
      minToefl: 475,
      maxTurnitin: 25,
      syaratPublikasi: 'Accepted (LoA) Jurnal Terakreditasi Sinta 2 / Prosiding Internasional',
      skorKelulusanMin: 75
    }
  },
  S3: {
    jenjangLabel: 'Doktor (S3 Ilmu Manajemen)',
    totalTahap: 8,
    tahapanList: [
      { nomor: 1, kode: 'S3-T1', nama: 'Penetapan Promotor & Topik Disertasi', deskripsi: 'Penerbitan SK Promotor dan Kopromotor' },
      { nomor: 2, kode: 'S3-T2', nama: 'Ujian Kualifikasi Doktoral', deskripsi: 'Pengujian penguasaan teori fundamental manajemen' },
      { nomor: 3, kode: 'S3-T3', nama: 'Ujian Usulan Penelitian (Proposal Disertasi)', deskripsi: 'Sidang rancangan disertasi dan novelty riset' },
      { nomor: 4, kode: 'S3-T4', nama: 'Ujian Kelayakan (Desk Review Naskah Disertasi)', deskripsi: 'Telaah mendalam oleh tim 3 penilai independen' },
      { nomor: 5, kode: 'S3-T5', nama: 'Seminar Hasil Disertasi', deskripsi: 'Pemaparan temuan novelty dan kontribusi teoritis' },
      { nomor: 6, kode: 'S3-T6', nama: 'Ujian Tertutup Disertasi (Sidang Tertutup)', deskripsi: 'Sidang formal disertasi di hadapan 7 penguji' },
      { nomor: 7, kode: 'S3-T7', nama: 'Ujian Terbuka / Promosi Doktoral', deskripsi: 'Sidang senat terbuka pengukuhan gelar Doktor' },
      { nomor: 8, kode: 'S3-T8', nama: 'Pengesahan Naskah Final & Yudisium', deskripsi: 'Penerbitan lembar pengesahan & ijazah' }
    ],
    rules: {
      minBimbingan: 16,
      minSKS: 42,
      minToefl: 500,
      maxTurnitin: 20,
      syaratPublikasi: 'Wajib Minimal 1 Artikel Accepted (LoA) Jurnal Scopus Q1/Q2',
      skorKelulusanMin: 75
    }
  }
};

// 3. Batas Kuota Standar Berdasarkan Jabatan Fungsional Dosen
export const KUOTA_RULE_DEFAULTS = {
  'Guru Besar / Profesor': { maxUtama: 10, maxPendamping: 12 },
  'Lektor Kepala': { maxUtama: 8, maxPendamping: 10 },
  'Lektor': { maxUtama: 6, maxPendamping: 8 },
  'Asisten Ahli': { maxUtama: 2, maxPendamping: 4 }
};

// Data Kuota Dosen Aktual FEB UTM
export const INITIAL_KUOTA_DOSEN = [
  {
    id: 'dosen-pribanus',
    nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    nip: '196306231989031002',
    jabatan: 'Guru Besar / Profesor',
    prodi: 'S-3 & S-2 Manajemen',
    kuotaUtama: 10,
    terisiUtama: 8,
    kuotaPendamping: 12,
    terisiPendamping: 6,
    status: 'Aman'
  },
  {
    id: 'dosen-siti-aminah',
    nama: 'Dr. Hj. Siti Aminah, S.E., M.Si.',
    nip: '197802142003122001',
    jabatan: 'Lektor Kepala',
    prodi: 'S-1 & S-2 Manajemen',
    kuotaUtama: 8,
    terisiUtama: 6,
    kuotaPendamping: 10,
    terisiPendamping: 5,
    status: 'Aman'
  },
  {
    id: 'dosen-iriani',
    nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    nip: '196201081987032001',
    jabatan: 'Lektor Kepala',
    prodi: 'D-3, S-1, S-2 & S-3',
    kuotaUtama: 8,
    terisiUtama: 7,
    kuotaPendamping: 10,
    terisiPendamping: 9,
    status: 'Hampir Penuh'
  },
  {
    id: 'dosen-faidal',
    nama: 'Dr. Faidal, S.E., M.M.',
    nip: '197703032003121002',
    jabatan: 'Lektor',
    prodi: 'S-1 & S-2 Manajemen',
    kuotaUtama: 6,
    terisiUtama: 5,
    kuotaPendamping: 8,
    terisiPendamping: 4,
    status: 'Aman'
  },
  {
    id: 'dosen-anugrahini',
    nama: 'Dra. Hj. S. Anugrahini Irawati, M.M.',
    nip: '196203031988032001',
    jabatan: 'Lektor Kepala',
    prodi: 'S-1 Manajemen',
    kuotaUtama: 8,
    terisiUtama: 5,
    kuotaPendamping: 10,
    terisiPendamping: 4,
    status: 'Aman'
  },
  {
    id: 'dosen-aprilina',
    nama: 'Aprilina Susandini, S.E., M.SM.',
    nip: '198704162015042005',
    jabatan: 'Lektor',
    prodi: 'S-1 Manajemen',
    kuotaUtama: 6,
    terisiUtama: 4,
    kuotaPendamping: 8,
    terisiPendamping: 3,
    status: 'Aman'
  },
  {
    id: 'dosen-arie',
    nama: 'Arie Setyo Dwi Purnomo, S.Pd., M.Sc.',
    nip: '199203182019031006',
    jabatan: 'Asisten Ahli',
    prodi: 'S-1 Manajemen',
    kuotaUtama: 2,
    terisiUtama: 1,
    kuotaPendamping: 4,
    terisiPendamping: 3,
    status: 'Aman'
  },
  {
    id: 'dosen-alan',
    nama: 'alan',
    nip: '22',
    jabatan: 'Lektor',
    prodi: 'Jurusan Manajemen',
    kuotaUtama: 6,
    terisiUtama: 0,
    kuotaPendamping: 8,
    terisiPendamping: 0,
    status: 'Aman'
  }
];

// 4. Master Akun Pengguna Multi-Role
export const INITIAL_USER_ACCOUNTS = [
  {
    id: 'usr-01',
    nomorInduk: '220231600004',
    nama: 'Bambang Suryo Utomo, S.E., M.M.',
    email: 'bambang.suryo@student.trunojoyo.ac.id',
    role: 'mahasiswa',
    jenjang: 'S3',
    prodi: 'S-3 Ilmu Manajemen',
    status: 'Aktif',
    lastLogin: 'Hari ini, 09:30'
  },
  {
    id: 'usr-02',
    nomorInduk: '210211100142',
    nama: 'Dinda Ayu Larasati',
    email: 'dinda.larasati@student.trunojoyo.ac.id',
    role: 'mahasiswa',
    jenjang: 'S1',
    prodi: 'S-1 Manajemen',
    status: 'Aktif',
    lastLogin: 'Kemarin, 14:15'
  },
  {
    id: 'usr-02-takk',
    nomorInduk: '210211100219',
    nama: 'Moh. Fikri Haikal',
    email: 'fikri.haikal@student.trunojoyo.ac.id',
    role: 'mahasiswa',
    jenjang: 'S1',
    prodi: 'S-1 Manajemen',
    status: 'Aktif',
    lastLogin: 'Hari ini, 08:20'
  },
  {
    id: 'usr-02-s2',
    nomorInduk: '230221600018',
    nama: 'Rahmat Hidayat, S.E.',
    email: 'rahmat.hidayat@student.trunojoyo.ac.id',
    role: 'mahasiswa',
    jenjang: 'S2',
    prodi: 'S-2 Magister Manajemen',
    status: 'Aktif',
    lastLogin: 'Kemarin, 11:20'
  },
  {
    id: 'usr-02-d3',
    nomorInduk: '230201100055',
    nama: 'Siti Nur Haliza',
    email: 'siti.nurhaliza@student.trunojoyo.ac.id',
    role: 'mahasiswa',
    jenjang: 'D3',
    prodi: 'D-III Entrepreneurship',
    status: 'Aktif',
    lastLogin: 'Kemarin, 09:45'
  },
  {
    id: 'usr-03',
    nomorInduk: '196201081987032001',
    nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    email: 'iriani.ismail@trunojoyo.ac.id',
    role: 'dosen',
    eligibleRoles: ['dosen', 'penguji', 'koorprodi'],
    jenjang: 'D3',
    prodi: 'D-3 Entrepreneurship',
    status: 'Aktif',
    lastLogin: 'Hari ini, 10:12'
  },
  {
    id: 'usr-04',
    nomorInduk: '197802142003122001',
    nama: 'Dr. Hj. Siti Aminah, S.E., M.Si.',
    email: 'siti.aminah@trunojoyo.ac.id',
    role: 'koorprodi',
    eligibleRoles: ['koorprodi', 'dosen', 'penguji'],
    jenjang: 'S1',
    prodi: 'S-1 Manajemen',
    status: 'Aktif',
    lastLogin: 'Hari ini, 08:45'
  },
  {
    id: 'usr-05',
    nomorInduk: '197703032003121002',
    nama: 'Dr. Faidal, S.E., M.M.',
    email: 'faidal@trunojoyo.ac.id',
    role: 'penguji',
    eligibleRoles: ['penguji', 'dosen', 'koorprodi'],
    jenjang: 'S2',
    prodi: 'S-2 Magister Manajemen',
    status: 'Aktif',
    lastLogin: 'Hari ini, 10:55'
  },
  {
    id: 'usr-08',
    nomorInduk: '196306231989031002',
    nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    email: 'pribanus.wantara@trunojoyo.ac.id',
    role: 'dosen',
    eligibleRoles: ['koorprodi', 'dosen', 'penguji'],
    jenjang: 'S3',
    prodi: 'S-3 Doktor Ilmu Manajemen',
    status: 'Aktif',
    lastLogin: 'Hari ini, 08:30'
  },
  {
    id: 'usr-06',
    nomorInduk: '198104122008121002',
    nama: 'Ahmad Fauzi, S.Kom., M.T.',
    email: 'ahmad.fauzi@trunojoyo.ac.id',
    role: 'admin',
    eligibleRoles: ['admin'],
    jenjang: 'Multi',
    prodi: 'Subbag Akademik & Tata Usaha',
    status: 'Aktif',
    lastLogin: 'Hari ini, 07:40'
  },
  {
    id: 'usr-07',
    nomorInduk: '197405102000031001',
    nama: 'Ir. Supriyanto, M.Kom.',
    email: 'supriyanto.admin@trunojoyo.ac.id',
    role: 'superadmin',
    eligibleRoles: ['superadmin', 'admin'],
    jenjang: 'Multi',
    prodi: 'Pusat Data & Sistem FEB',
    status: 'Aktif',
    lastLogin: 'Hari ini, 11:00'
  },
  {
    id: 'usr-09',
    nomorInduk: '196203031988032001',
    nama: 'Dra. Hj. S. Anugrahini Irawati, M.M.',
    email: 'anugrahini.irawati@trunojoyo.ac.id',
    role: 'dosen',
    eligibleRoles: ['dosen', 'penguji'],
    jenjang: 'S1',
    prodi: 'S-1 Manajemen',
    status: 'Aktif',
    lastLogin: 'Belum pernah login'
  }
];
