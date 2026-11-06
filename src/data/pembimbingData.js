// Mock Data & State Khusus Role Dosen Pembimbing / Promotor / Kopromotor
// Berdasarkan Buku Pedoman Tugas Akhir Jurusan Manajemen FEB UTM 2026

export const DOSEN_PROFILE_DEFAULT = {
  id: 'dosen-iriani',
  nip: '196206231988112001',
  nidn: '0023066205',
  nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
  jabatan: 'Lektor Kepala / Pembina (IV/a)',
  keahlian: 'Manajemen Sumber Daya Manusia (MSDM)',
  email: 'iriani.ismail@trunojoyo.ac.id',
  ruang: 'R. Dosen Manajemen Gedung R.K.B. Lantai 2'
};

// Daftar Mahasiswa yang Terdistribusi per Dosen Pembimbing Resmi (Sesuai Buku Pedoman FEB UTM 2026)
export const INITIAL_MAHASISWA_BIMBINGAN = [
  {
    id: 'mhs-s3-1',
    nim: '220231600004',
    nama: 'Bambang Suryo Utomo, S.E., M.M.',
    jenjang: 'S3',
    programStudi: 'S-3 Ilmu Manajemen',
    jenisTA: 'TAKT',
    bentukTA: 'Disertasi',
    peranDosen: 'Kopromotor',
    pasanganDosen: 'Prof. Dr. Pribanus Wantara, Drs., M.M. (Promotor)',
    pembimbingUtama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    pembimbingUtamaNip: '196306231989031002',
    kopromotor: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    kopromotorNip: '196201081987032001',
    pembimbing: [
      { peran: 'Promotor', nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.', nip: '196306231989031002' },
      { peran: 'Kopromotor', nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', nip: '196201081987032001' }
    ],
    judul: 'Model Determinan Dynamic Capabilities Terhadap Ketahanan Usaha Berkelanjutan Berbasis Kearifan Lokal Madura: Peran Mediasi Orientasi Inovasi Digital',
    tahapAktifId: 'tahap-4',
    tahapAktifNama: 'Ujian Kelayakan (Desk Review)',
    statusTahap: 'Menunggu Hasil Penelaahan Desk Review',
    statusBimbingan: '14 Sesi Selesai (Target 12 Tercapai)',
    sesiCount: 14,
    sesiMin: 12,
    sesiTerakhir: '22 September 2026',
    ipk: 3.88,
    toefl: 525,
    sks: 48,
    turnitinSimilarity: 16,
    turnitinAI: 18,
    statusNaskah: 'Draft Disertasi Bab I–V Final',
    statusApproval: 'Menunggu Persetujuan Maju Ujian Tertutup',
    statusRevisi: 'Revisi Kelayakan Sedang Berlangsung'
  },
  {
    id: 'mhs-s3-2',
    nim: '230231600008',
    nama: 'Linda Permatasari, S.E., M.SM.',
    jenjang: 'S3',
    programStudi: 'S-3 Ilmu Manajemen',
    jenisTA: 'TAKT',
    bentukTA: 'Disertasi',
    peranDosen: 'Promotor',
    pasanganDosen: 'Dr. Faidal, S.E., M.M. (Kopromotor)',
    pembimbingUtama: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    pembimbingUtamaNip: '196201081987032001',
    kopromotor: 'Dr. Faidal, S.E., M.M.',
    kopromotorNip: '197703032003121002',
    pembimbing: [
      { peran: 'Promotor', nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', nip: '196201081987032001' },
      { peran: 'Kopromotor', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002' }
    ],
    judul: 'Konstruksi Kepemimpinan Spiritual dan Budaya Kerja Madura dalam Mendorong Ambidexterity Organisasi Sektor Publik',
    tahapAktifId: 'tahap-2',
    tahapAktifNama: 'Ujian Proposal Disertasi',
    statusTahap: 'Naskah Proposal Siap Direview',
    statusBimbingan: '7 Sesi Selesai (Target 12)',
    sesiCount: 7,
    sesiMin: 12,
    sesiTerakhir: '29 September 2026',
    ipk: 3.92,
    toefl: 540,
    sks: 36,
    turnitinSimilarity: 18,
    turnitinAI: 21,
    statusNaskah: 'Proposal Disertasi v2.1',
    statusApproval: 'Menunggu Review Naskah Bab III',
    statusRevisi: 'Tidak Ada Revisi Aktif'
  },
  {
    id: 'mhs-s2-1',
    nim: '230221600018',
    nama: 'Rahmat Hidayat, S.E.',
    jenjang: 'S2',
    programStudi: 'S-2 Magister Manajemen',
    jenisTA: 'TAKT',
    bentukTA: 'Tesis',
    peranDosen: 'Pembimbing I',
    pasanganDosen: 'Dr. Rita Mutiarni, S.E., M.M. (Pembimbing II)',
    pembimbingUtama: 'Dr. H. Slamet Subari, S.E., M.Si.',
    pembimbingUtamaNip: '196504121991031003',
    pembimbingPendamping: 'Dr. Rita Mutiarni, S.E., M.M.',
    pembimbingPendampingNip: '197903212006042001',
    pembimbing: [
      { peran: 'Pembimbing I', nama: 'Dr. H. Slamet Subari, S.E., M.Si.', nip: '196504121991031003' },
      { peran: 'Pembimbing II', nama: 'Dr. Rita Mutiarni, S.E., M.M.', nip: '197903212006042001' }
    ],
    judul: 'Pengaruh Kepemimpinan Transformasional dan Budaya Organisasi Terhadap Kinerja Karyawan Melalui Komitmen Afektif pada Perbankan Syariah di Madura',
    tahapAktifId: 'tahap-6',
    tahapAktifNama: 'Sidang Tesis',
    statusTahap: 'Pendaftaran Sidang Tesis Disetujui',
    statusBimbingan: '12 Sesi Selesai (Target 10 Tercapai)',
    sesiCount: 12,
    sesiMin: 10,
    sesiTerakhir: '20 September 2026',
    ipk: 3.82,
    toefl: 510,
    sks: 38,
    turnitinSimilarity: 14,
    turnitinAI: 16,
    statusNaskah: 'Draf Lengkap Tesis Final',
    statusApproval: 'Telah Disetujui Maju Sidang',
    statusRevisi: 'Telah Dituntaskan'
  },
  {
    id: 'mhs-s1-1',
    nim: '210211100142',
    nama: 'Dinda Ayu Larasati',
    jenjang: 'S1',
    programStudi: 'S-1 Manajemen',
    jenisTA: 'TAKT',
    bentukTA: 'Skripsi',
    peranDosen: 'Dosen Pembimbing',
    pasanganDosen: null,
    pembimbingUtama: 'Dra. Hj. S. Anugrahini Irawati, M.M.',
    pembimbingUtamaNip: '196203031988032001',
    pembimbing: [
      { peran: 'Dosen Pembimbing', nama: 'Dra. Hj. S. Anugrahini Irawati, M.M.', nip: '196203031988032001' }
    ],
    judul: 'Pengaruh Live Commerce Interactive Features dan Emotional Value Terhadap Keputusan Pembelian Spontan Produk Batik Madura di TikTok Shop',
    tahapAktifId: 'tahap-2',
    tahapAktifNama: 'Seminar Proposal Skripsi',
    statusTahap: 'Jadwal Ditetapkan (14 Oktober 2026)',
    statusBimbingan: '8 Sesi Selesai (Target 8 Tercapai)',
    sesiCount: 8,
    sesiMin: 8,
    sesiTerakhir: '28 September 2026',
    ipk: 3.65,
    toefl: 480,
    sks: 138,
    turnitinSimilarity: 19,
    turnitinAI: 24,
    statusNaskah: 'Proposal Skripsi BAB I–III Final',
    statusApproval: 'Telah Disetujui Maju Seminar',
    statusRevisi: 'Menunggu Pelaksanaan Seminar'
  },
  {
    id: 'mhs-s1-2',
    nim: '210211100219',
    nama: 'Moh. Fikri Haikal',
    jenjang: 'S1',
    programStudi: 'S-1 Manajemen',
    jenisTA: 'TAKK',
    bentukTA: 'Tugas Akhir Kontributif-Kreatif',
    peranDosen: 'Dosen Pembimbing',
    pasanganDosen: null,
    pembimbingUtama: 'Dr. Mochammad Isa Anshori, S.E., M.Si.',
    pembimbingUtamaNip: '197307152005011001',
    pembimbing: [
      { peran: 'Dosen Pembimbing', nama: 'Dr. Mochammad Isa Anshori, S.E., M.Si.', nip: '197307152005011001' }
    ],
    judul: 'Inovasi Ekosistem Pembiayaan Klaster Petani Garam Madura dan Portofolio Prestasi Kewirausahaan Berkelanjutan',
    tahapAktifId: 'tahap-3',
    tahapAktifNama: 'Verifikasi Portofolio & Publikasi Jurnal',
    statusTahap: 'Menunggu Verifikasi Koorprodi',
    statusBimbingan: '6 Sesi Selesai (Target 8)',
    sesiCount: 6,
    sesiMin: 8,
    sesiTerakhir: '15 September 2026',
    ipk: 3.52,
    toefl: 460,
    sks: 140,
    turnitinSimilarity: 15,
    turnitinAI: 20,
    statusNaskah: 'Laporan Komprehensif Portofolio TAKK',
    statusApproval: 'Menunggu Pengesahan Berkas Portofolio',
    statusRevisi: 'Tidak Ada Revisi'
  },
  {
    id: 'mhs-d3-1',
    nim: '230201100055',
    nama: 'Siti Nur Haliza',
    jenjang: 'D3',
    programStudi: 'D-III Entrepreneurship',
    jenisTA: 'TAKT',
    bentukTA: 'Laporan Tugas Akhir',
    peranDosen: 'Dosen Pembimbing',
    pasanganDosen: null,
    pembimbingUtama: 'Moh. Faizal, S.E., M.M.',
    pembimbingUtamaNip: '198509142014041001',
    pembimbing: [
      { peran: 'Dosen Pembimbing', nama: 'Moh. Faizal, S.E., M.M.', nip: '198509142014041001' }
    ],
    judul: 'Rancang Bangun Strategi Pemasaran Digital dan Pengelolaan Arus Kas Usaha Mikro Olahan Jamu Madura "Sari Barokah"',
    tahapAktifId: 'tahap-3',
    tahapAktifNama: 'Sidang Tugas Akhir',
    statusTahap: 'Menunggu Persetujuan Berkas Sidang',
    statusBimbingan: '9 Sesi Selesai (Target 8 Tercapai)',
    sesiCount: 9,
    sesiMin: 8,
    sesiTerakhir: '25 September 2026',
    ipk: 3.45,
    toefl: 420,
    sks: 112,
    turnitinSimilarity: 21,
    turnitinAI: 19,
    statusNaskah: 'Laporan Tugas Akhir Vokasi Final',
    statusApproval: 'Menunggu Persetujuan Maju Sidang Akhir',
    statusRevisi: 'Tidak Ada Revisi'
  }
];

// Daftar Naskah yang Memerlukan Review Akademik
export const INITIAL_NASKAH_REVIEW = [
  {
    id: 'nsk-1',
    mhsId: 'mhs-s3-2',
    nim: '230231600008',
    namaMahasiswa: 'Linda Permatasari, S.E., M.SM.',
    jenjang: 'S3',
    peranDosen: 'Promotor',
    dosenNip: '196201081987032001',
    judulNaskah: 'Proposal Disertasi: Bab I–III (Konstruksi Kepemimpinan Spiritual dan Budaya Kerja Madura)',
    versi: 'v2.1',
    tanggalKirim: '01 Oktober 2026',
    statusReview: 'Perlu Direview',
    urgensi: 'Tinggi (Rencana Ujian Proposal 25 Okt)',
    similarity: 18,
    aiScore: 21,
    fileNaskah: 'Proposal_Disertasi_Linda_v2.1.pdf',
    ukuran: '3.4 MB',
    jumlahKomentar: 4
  },
  {
    id: 'nsk-2',
    mhsId: 'mhs-s3-1',
    nim: '220231600004',
    namaMahasiswa: 'Bambang Suryo Utomo, S.E., M.M.',
    jenjang: 'S3',
    peranDosen: 'Kopromotor',
    dosenNip: '196201081987032001',
    judulNaskah: 'Draf Disertasi Pasca Ujian Kelayakan: Perbaikan Bab IV & V',
    versi: 'v3.2',
    tanggalKirim: '28 September 2026',
    statusReview: 'Dalam Proses Telaah',
    urgensi: 'Mendesak (Tenggat Revisi Kelayakan 22 Okt)',
    similarity: 16,
    aiScore: 18,
    fileNaskah: 'Draf_Disertasi_Revisi_Kelayakan_Bambang.pdf',
    ukuran: '5.1 MB',
    jumlahKomentar: 3
  },
  {
    id: 'nsk-3',
    mhsId: 'mhs-s1-2',
    nim: '210211100219',
    namaMahasiswa: 'Moh. Fikri Haikal',
    jenjang: 'S1',
    peranDosen: 'Dosen Pembimbing',
    dosenNip: '197307152005011001',
    judulNaskah: 'Laporan Portofolio TAKK & Matriks Konversi Prestasi KIBM',
    versi: 'v1.4',
    tanggalKirim: '26 September 2026',
    statusReview: 'Perlu Direview',
    urgensi: 'Normal',
    similarity: 15,
    aiScore: 20,
    fileNaskah: 'Laporan_Portofolio_TAKK_Fikri.pdf',
    ukuran: '2.8 MB',
    jumlahKomentar: 1
  }
];

// Data Catatan Telaah / Review Substantif Naskah (Interface Serius Membaca Dokumen)
export const INITIAL_REVIEW_ITEMS = [
  {
    id: 'rev-item-1',
    naskahId: 'nsk-1',
    bab: 'BAB I — Pendahuluan',
    halaman: 'Halaman 12-14',
    kategori: 'Kajian Teoretis & Fenomena Gap',
    kutipanTeks: '"...kepemimpinan spiritual diyakini mampu meningkatkan ambidexterity tanpa memperhatikan hambatan sosiokultural lokal..."',
    catatanDosen: 'Penegasan research gap masih terlalu normatif. Kaitkan lebih spesifik dengan paradoks birokrasi pemerintahan daerah di Madura sesuai grand theory contingency perspective.',
    status: 'Terbuka',
    tanggal: '02 Oktober 2026',
    tanggapanMahasiswa: null
  },
  {
    id: 'rev-item-2',
    naskahId: 'nsk-1',
    bab: 'BAB II — Kajian Pustaka',
    halaman: 'Halaman 35',
    kategori: 'State of the Art & Sintesis Rujukan',
    kutipanTeks: '"...rujukan artikel tentang organizational ambidexterity merujuk pada Gibson & Birkinshaw (2004)..."',
    catatanDosen: 'Perbarui rujukan utama dengan literatur 5 tahun terakhir (2021–2026) dari jurnal bereputasi Q1/Q2 (Leadership Quarterly atau Journal of Management).',
    status: 'Terbuka',
    tanggal: '02 Oktober 2026',
    tanggapanMahasiswa: null
  },
  {
    id: 'rev-item-3',
    naskahId: 'nsk-1',
    bab: 'BAB III — Metode Penelitian',
    halaman: 'Halaman 58-61',
    kategori: 'Metodologi & Teknik Sampling',
    kutipanTeks: '"...teknik penentuan sampel menggunakan accidental sampling sebanyak 60 pegawai..."',
    catatanDosen: 'TIDAK SESUAI KETENTUAN DISERTASI! Untuk S3 wajib probability sampling atau purposive sampling dengan kriteria inklusi ketat serta perhitungan G*Power minimal 150 responden.',
    status: 'Terbuka',
    tanggal: '02 Oktober 2026',
    tanggapanMahasiswa: null
  },
  {
    id: 'rev-item-4',
    naskahId: 'nsk-2',
    bab: 'BAB IV — Hasil Penelitian dan Pembahasan',
    halaman: 'Halaman 142',
    kategori: 'Analisis Mediasi & Robustness Check',
    kutipanTeks: '"...tabel 4.18 koefisien indirect effect kearifan lokal terhadap ketahanan usaha..."',
    catatanDosen: 'Pengujian mediasi inovasi digital sudah baik, namun tambahkan pembahasan mendalam mengenai nilai koefisien f-square effect size.',
    status: 'Selesai',
    tanggal: '29 September 2026',
    tanggapanMahasiswa: 'Telah disempurnakan pada sub-bab 4.4.3 dengan tabel effect size Cohen (1988).'
  }
];

// Antrean Persetujuan / Approval yang Menunggu Keputusan Dosen
export const INITIAL_APPROVAL_QUEUE = [
  {
    id: 'app-1',
    mhsId: 'mhs-s3-1',
    namaMahasiswa: 'Bambang Suryo Utomo, S.E., M.M.',
    nim: '220231600004',
    jenjang: 'S3',
    peranDosen: 'Kopromotor', // Otomatis Kopromotor
    dosenNip: '196201081987032001',
    jenisPermohonan: 'Persetujuan Maju Ujian Tertutup Disertasi',
    keterangan: 'Mahasiswa telah menyelesaikan masa perbaikan Ujian Kelayakan (Desk Review) dan melampirkan LoA Scopus Q1 Elsevier.',
    tanggalDiajukan: '02 Oktober 2026',
    kelengkapan: [
      { item: 'Naskah Disertasi 7 Rangkap', status: 'Lengkap' },
      { item: 'LoA Scopus Q1 Terverifikasi', status: 'Sah' },
      { item: 'Turnitin Similarity 16% (Maks 20%)', status: 'Lolos' },
      { item: 'Berita Acara Ujian Kelayakan NA 75.67', status: 'Sah' }
    ],
    status: 'Menunggu Persetujuan'
  },
  {
    id: 'app-2',
    mhsId: 'mhs-s3-2',
    namaMahasiswa: 'Linda Permatasari, S.E., M.SM.',
    nim: '230231600008',
    jenjang: 'S3',
    peranDosen: 'Promotor', // Otomatis Promotor
    dosenNip: '196201081987032001',
    jenisPermohonan: 'Persetujuan Naskah Ujian Proposal Disertasi',
    keterangan: 'Permohonan persetujuan kelayakan substansi proposal disertasi untuk dijadwalkan seminar oleh Koorprodi S3.',
    tanggalDiajukan: '30 September 2026',
    kelengkapan: [
      { item: 'Draf Proposal Disertasi v2.1', status: 'Lengkap' },
      { item: 'Turnitin Similarity 18% (Maks 20%)', status: 'Lolos' },
      { item: 'Logbook Bimbingan 7 Sesi', status: 'Terverifikasi' }
    ],
    status: 'Menunggu Persetujuan'
  },
  {
    id: 'app-3',
    mhsId: 'mhs-d3-1',
    namaMahasiswa: 'Siti Nur Haliza',
    nim: '230201100055',
    jenjang: 'D3',
    peranDosen: 'Dosen Pembimbing',
    dosenNip: '198509142014041001',
    jenisPermohonan: 'Pengesahan Maju Sidang Tugas Akhir Vokasi',
    keterangan: 'Mahasiswa telah menyelesaikan laporan magang/proyek kewirausahaan jamu herbal Madura dan memenuhi target 9 sesi bimbingan.',
    tanggalDiajukan: '29 September 2026',
    kelengkapan: [
      { item: 'Laporan Tugas Akhir Lengkap', status: 'Lengkap' },
      { item: 'Bukti Turnitin 21% (Maks 30%)', status: 'Lolos' },
      { item: 'Surat Keterangan Mitra Usaha', status: 'Sah' }
    ],
    status: 'Menunggu Persetujuan'
  },
  {
    id: 'app-4',
    mhsId: 'mhs-s1-2',
    namaMahasiswa: 'Moh. Fikri Haikal',
    nim: '210211100219',
    jenjang: 'S1',
    peranDosen: 'Dosen Pembimbing',
    dosenNip: '197307152005011001',
    jenisPermohonan: 'Persetujuan Matriks Portofolio TAKK & Konversi Nilai A',
    keterangan: 'Permohonan pengesahan perhitungan poin capaian 82 (NA >= 70) dan artikel terakreditasi SINTA 5.',
    tanggalDiajukan: '25 September 2026',
    kelengkapan: [
      { item: 'Sertifikat Juara 1 KIBM Nasional', status: 'Valid' },
      { item: 'LoA Jurnal SINTA 5', status: 'Valid' }
    ],
    status: 'Menunggu Persetujuan'
  }
];

// Data Catatan Revisi Pasca Ujian yang Dipantau Pembimbing
export const INITIAL_REVISI_MONITORING = [
  {
    id: 'rev-mon-1',
    mhsId: 'mhs-s3-1',
    namaMahasiswa: 'Bambang Suryo Utomo, S.E., M.M.',
    nim: '220231600004',
    jenjang: 'S3',
    peranDosen: 'Kopromotor',
    dosenNip: '196201081987032001',
    pengujiNip: '197703032003121002',
    jenisUjian: 'Ujian Kelayakan Disertasi (Desk Review)',
    tanggalUjian: '24 September 2026',
    batasTenggat: '24 Oktober 2026 (Tersisa 17 Hari)',
    catatanPenguji: 'Dr. Faidal, S.E., M.M. (Penilai III): Perluas pembahasan perbedaan substantive antara sensing capabilities dan seizing capabilities pada konteks UMKM Madura di Bab II.',
    responsMahasiswa: 'Telah ditambahkan 4 paragraf pada sub-bab 2.3.2 dengan merujuk Teece (2018) dan empiris lokal terkini (Halaman 47-50).',
    statusRevisi: 'Menunggu Approval Penguji',
    fileBukti: 'Perbaikan_Bab2_Disertasi.pdf'
  },
  {
    id: 'rev-mon-2',
    mhsId: 'mhs-s3-1',
    namaMahasiswa: 'Bambang Suryo Utomo, S.E., M.M.',
    nim: '220231600004',
    jenjang: 'S3',
    peranDosen: 'Kopromotor',
    dosenNip: '196201081987032001',
    pengujiNip: '196306231989031002',
    jenisUjian: 'Ujian Kelayakan Disertasi (Desk Review)',
    tanggalUjian: '24 September 2026',
    batasTenggat: '24 Oktober 2026 (Tersisa 17 Hari)',
    catatanPenguji: 'Prof. Dr. Pribanus Wantara, Drs., M.M. (Penilai I / Promotor): Perjelas keterkaitan proposisi 3 dengan grand theory resource-based view.',
    responsMahasiswa: 'Telah disempurnakan narasi keterkaitan RBV dengan keunggulan kompetitif lokal di Bab II (Halaman 52-54).',
    statusRevisi: 'Telah Disetujui Penguji',
    fileBukti: 'Perbaikan_Proposisi3_RBV.pdf'
  },
  {
    id: 'rev-mon-3',
    mhsId: 'mhs-s1-1',
    nim: '210211100142',
    namaMahasiswa: 'Dinda Ayu Larasati',
    nimMahasiswa: '210211100142',
    jenjang: 'S1',
    peranDosen: 'Dosen Pembimbing',
    dosenNip: '196203031988032001',
    jenisUjian: 'Seminar Proposal Skripsi',
    tanggalUjian: '14 Oktober 2026 (Akan Datang)',
    batasTenggat: '14 November 2026 (30 Hari Pasca Sidang)',
    catatanPenguji: 'Jadwal ujian belum berlangsung. Menunggu catatan dewan penguji pada sidang 14 Oktober.',
    responsMahasiswa: '-',
    statusRevisi: 'Belum Ada Revisi',
    fileBukti: null
  }
];

// Jadwal Ujian Mahasiswa Bimbingan yang Dihadiri Dosen
export const INITIAL_JADWAL_UJIAN_DOSEN = [
  {
    id: 'uj-1',
    mhsId: 'mhs-s1-1',
    namaMahasiswa: 'Dinda Ayu Larasati',
    nim: '210211100142',
    jenjang: 'S1',
    jenisUjian: 'Seminar Proposal Skripsi S1',
    peranDosenSidang: 'Ketua Penguji (Dosen Pembimbing)',
    hariTanggal: 'Senin, 14 Oktober 2026',
    waktu: '09.00 - 10.30 WIB (90 Menit)',
    ruang: 'Ruang Sidang Jurusan Manajemen FEB Lantai 2',
    susunanPenguji: [
      { peran: 'Ketua Penguji (Pembimbing)', nama: 'Dra. Hj. S. Anugrahini Irawati, M.M.', nip: '196203031988032001' },
      { peran: 'Penguji Utama', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002' },
      { peran: 'Anggota Penguji', nama: 'Aprilina Susandini, S.E., M.SM.', nip: '198904252019032014' }
    ],
    naskahFile: 'Proposal_Skripsi_Final_Dinda.pdf',
    statusJadwal: 'Terjadwal'
  },
  {
    id: 'uj-2',
    mhsId: 'mhs-s2-1',
    namaMahasiswa: 'Rahmat Hidayat, S.E.',
    nim: '230221600018',
    jenjang: 'S2',
    jenisUjian: 'Sidang Tesis S2',
    peranDosenSidang: 'Pembimbing I (Anggota Penguji)',
    hariTanggal: 'Rabu, 16 Oktober 2026',
    waktu: '13.00 - 15.00 WIB (120 Menit)',
    ruang: 'Ruang Ujian Pascasarjana Lantai 3',
    susunanPenguji: [
      { peran: 'Pembimbing II (Pemimpin Sidang)', nama: 'Dr. Rita Mutiarni, S.E., M.M.', nip: '197903212006042001' },
      { peran: 'Pembimbing I', nama: 'Dr. H. Slamet Subari, S.E., M.Si.', nip: '196504121991031003' },
      { peran: 'Penguji Ahli I', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002' },
      { peran: 'Penguji Ahli II', nama: 'Dr. Mochammad Isa Anshori, S.E., M.Si.', nip: '197307152005011001' }
    ],
    naskahFile: 'Draf_Lengkap_Tesis_Rahmat.pdf',
    statusJadwal: 'Terjadwal'
  },
  {
    id: 'uj-3',
    mhsId: 'mhs-s3-1',
    namaMahasiswa: 'Bambang Suryo Utomo, S.E., M.M.',
    nim: '220231600004',
    jenjang: 'S3',
    jenisUjian: 'Ujian Kelayakan Disertasi (Desk Review)',
    peranDosenSidang: 'Penilai II (Kopromotor)',
    hariTanggal: '24 September 2026',
    waktu: 'Penelaahan Dokumen (Desk Review Mandiri)',
    ruang: 'Desk Review DPA Pascasarjana',
    susunanPenguji: [
      { peran: 'Penilai I (Promotor)', nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.', nip: '196306231989031002', nilai: 78 },
      { peran: 'Penilai II (Kopromotor)', nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', nip: '196201081987032001', nilai: 75 },
      { peran: 'Penilai III (Penilai Independen)', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002', nilai: 74 }
    ],
    naskahFile: 'Draf_Disertasi_Kelayakan_Bambang.pdf',
    statusJadwal: 'Selesai (Nilai Akhir: 75.67 — Layak Revisi Minor)'
  }
];
