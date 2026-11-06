// Mock Data & State Khusus Role Koordinator Program Studi (Koorprodi)
// Berdasarkan Buku Pedoman Tugas Akhir Jurusan Manajemen FEB UTM 2026

export const KOORPRODI_PROFILE_DEFAULT = {
  id: 'koorprodi-siti-aminah',
  nip: '197802142003122001',
  nidn: '0014027803',
  nama: 'Dr. Hj. Siti Aminah, S.E., M.Si.',
  jabatan: 'Koordinator Program Studi S1 Manajemen / Jurusan Manajemen FEB UTM',
  pangkat: 'Lektor Kepala / Pembina (IV/a)',
  email: 'siti.aminah@trunojoyo.ac.id',
  ruang: 'R. Koorprodi Manajemen Gedung R.K.B. Lantai 2',
  prodi: 'S-1 Manajemen',
  jenjang: 'S1'
};

// Pengajuan Ujian & Berkas yang Menunggu Verifikasi Koorprodi
export const INITIAL_PENGAJUAN_KOORPRODI = [
  {
    id: 'aju-1',
    mhsId: 'mhs-s1-1',
    nim: '210211100142',
    namaMahasiswa: 'Dinda Ayu Larasati',
    jenjang: 'S1',
    programStudi: 'S-1 Manajemen',
    jenisTA: 'TAKT',
    bentukTA: 'Skripsi',
    judul: 'Pengaruh Live Commerce Interactive Features dan Emotional Value Terhadap Keputusan Pembelian Spontan Produk Batik Madura di TikTok Shop',
    jenisPengajuan: 'Pendaftaran Seminar Proposal Skripsi',
    tanggalPengajuan: '30 September 2026',
    statusVerifikasi: 'Menunggu Verifikasi',
    pembimbing: 'Dra. Hj. S. Anugrahini Irawati, M.M. (Setuju Maju Sempro)',
    kelengkapanBerkas: [
      { item: 'KRS Lulus 138 SKS (Syarat >= 120 SKS)', status: 'Lolos' },
      { item: 'Sertifikat TOEFL Skor 480 (Syarat >= 450)', status: 'Lolos' },
      { item: 'Turnitin Similarity 19% (Syarat <= 30%)', status: 'Lolos' },
      { item: 'Logbook Bimbingan 8 Sesi Terpenuhi', status: 'Lengkap' },
      { item: 'Naskah Proposal Rangkap 3', status: 'Lengkap' }
    ],
    catatanKoorprodi: ''
  },
  {
    id: 'aju-2',
    mhsId: 'mhs-s3-1',
    nim: '220231600004',
    namaMahasiswa: 'Bambang Suryo Utomo, S.E., M.M.',
    jenjang: 'S3',
    programStudi: 'S-3 Ilmu Manajemen',
    jenisTA: 'TAKT',
    bentukTA: 'Disertasi',
    judul: 'Model Determinan Dynamic Capabilities Terhadap Ketahanan Usaha Berkelanjutan Berbasis Kearifan Lokal Madura: Peran Mediasi Orientasi Inovasi Digital',
    jenisPengajuan: 'Pendaftaran Ujian Tertutup Disertasi (Pasca Ujian Kelayakan)',
    tanggalPengajuan: '02 Oktober 2026',
    statusVerifikasi: 'Menunggu Verifikasi',
    pembimbing: 'Prof. Pribanus Wantara (Promotor) & Dr. Iriani Ismail (Kopromotor)',
    kelengkapanBerkas: [
      { item: 'Berita Acara Ujian Kelayakan (Desk Review NA 75.67)', status: 'Lolos' },
      { item: 'Bukti Revisi Minor Disetujui 3 Penilai', status: 'Lolos' },
      { item: 'LoA Jurnal Terindeks Scopus Q1 Elsevier', status: 'Valid' },
      { item: 'Turnitin Similarity 16% (Syarat <= 20%)', status: 'Lolos' },
      { item: 'Naskah Disertasi 7 Rangkap', status: 'Lengkap' }
    ],
    catatanKoorprodi: ''
  },
  {
    id: 'aju-3',
    mhsId: 'mhs-s1-2',
    nim: '210211100219',
    namaMahasiswa: 'Moh. Fikri Haikal',
    jenjang: 'S1',
    programStudi: 'S-1 Manajemen',
    jenisTA: 'TAKK',
    bentukTA: 'Tugas Akhir Kontributif-Kreatif',
    judul: 'Inovasi Ekosistem Pembiayaan Klaster Petani Garam Madura dan Portofolio Prestasi Kewirausahaan Berkelanjutan',
    jenisPengajuan: 'Pengesahan Konversi Portofolio TAKK & Penerbitan SK Nilai A',
    tanggalPengajuan: '28 September 2026',
    statusVerifikasi: 'Menunggu Verifikasi',
    pembimbing: 'Dr. Mochammad Isa Anshori, S.E., M.Si.',
    kelengkapanBerkas: [
      { item: 'Akumulasi Poin Portofolio 82 (Syarat >= 70)', status: 'Lolos' },
      { item: 'Sertifikat Juara 1 KIBM Nasional', status: 'Sah' },
      { item: 'LoA Artikel Jurnal Terakreditasi SINTA 5', status: 'Valid' },
      { item: 'Laporan Komprehensif Karya Mandiri', status: 'Lengkap' }
    ],
    catatanKoorprodi: ''
  },
  {
    id: 'aju-4',
    mhsId: 'mhs-s2-1',
    nim: '230221600018',
    namaMahasiswa: 'Rahmat Hidayat, S.E.',
    jenjang: 'S2',
    programStudi: 'S-2 Magister Manajemen',
    jenisTA: 'TAKT',
    bentukTA: 'Tesis',
    judul: 'Pengaruh Kepemimpinan Transformasional dan Budaya Organisasi Terhadap Kinerja Karyawan Melalui Komitmen Afektif pada Perbankan Syariah di Madura',
    jenisPengajuan: 'Penetapan Jadwal & Tim Penguji Sidang Tesis',
    tanggalPengajuan: '25 September 2026',
    statusVerifikasi: 'Disetujui',
    pembimbing: 'Dr. H. Slamet Subari (Pembimbing I) & Dr. Rita Mutiarni (Pembimbing II)',
    kelengkapanBerkas: [
      { item: 'Transkrip Nilai 38 SKS (Syarat >= 36 SKS)', status: 'Lolos' },
      { item: 'TOEFL 510 (Syarat >= 475)', status: 'Lolos' },
      { item: 'Artikel Terbit Jurnal SINTA 2', status: 'Valid' },
      { item: 'Turnitin Similarity 14% (Syarat <= 20%)', status: 'Lolos' }
    ],
    catatanKoorprodi: 'Jadwal telah ditetapkan pada Rabu, 16 Oktober 2026.'
  }
];

// Data Plotting Beban Pembimbing Seluruh FEB UTM (Dapat dipilih Lintas Prodi)
export const INITIAL_PLOTTING_PEMBIMBING = [
  {
    id: 'dos-1',
    nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    nip: '196306231989031002',
    jabatan: 'Guru Besar / IV-e',
    prodiHomebase: 'S-3 Doktor Ilmu Manajemen',
    keahlian: 'Manajemen Pemasaran & Strategik',
    kuotaS1: 6,
    aktifS1: 4,
    kuotaS2: 4,
    aktifS2: 2,
    kuotaS3: 3,
    aktifS3: 2,
    statusSK: 'SK Dekan Berlaku 2026'
  },
  {
    id: 'dos-2',
    nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    nip: '196206231988112001',
    jabatan: 'Lektor Kepala / IV-a',
    prodiHomebase: 'D-3 Entrepreneurship',
    keahlian: 'Manajemen Sumber Daya Manusia (MSDM)',
    kuotaS1: 6,
    aktifS1: 5,
    kuotaS2: 4,
    aktifS2: 3,
    kuotaS3: 3,
    aktifS3: 2,
    statusSK: 'SK Dekan Berlaku 2026'
  },
  {
    id: 'dos-3',
    nama: 'Dr. Faidal, S.E., M.M.',
    nip: '197703032003121002',
    jabatan: 'Lektor / III-c',
    prodiHomebase: 'S-2 Magister Manajemen',
    keahlian: 'Manajemen Sumber Daya Manusia',
    kuotaS1: 6,
    aktifS1: 6, // Penuh
    kuotaS2: 3,
    aktifS2: 2,
    kuotaS3: 0,
    aktifS3: 0,
    statusSK: 'SK Dekan Berlaku 2026'
  },
  {
    id: 'dos-4',
    nama: 'Dr. Mochammad Isa Anshori, S.E., M.Si.',
    nip: '197003222005011003',
    jabatan: 'Lektor / III-c',
    prodiHomebase: 'S-1 Manajemen',
    keahlian: 'Manajemen Sumber Daya Manusia',
    kuotaS1: 6,
    aktifS1: 3,
    kuotaS2: 3,
    aktifS2: 1,
    kuotaS3: 0,
    aktifS3: 0,
    statusSK: 'SK Dekan Berlaku 2026'
  },
  {
    id: 'dos-5',
    nama: 'Aprilina Susandini, S.E., M.SM.',
    nip: '198704162015042005',
    jabatan: 'Lektor / III-b',
    prodiHomebase: 'S-1 Manajemen',
    keahlian: 'Manajemen Keuangan',
    kuotaS1: 6,
    aktifS1: 4,
    kuotaS2: 0,
    aktifS2: 0,
    kuotaS3: 0,
    aktifS3: 0,
    statusSK: 'SK Dekan Berlaku 2026'
  },
  {
    id: 'dos-aminah',
    nama: 'Dr. Hj. Siti Aminah, S.E., M.Si.',
    nip: '197802142003122001',
    jabatan: 'Lektor Kepala / IV-a',
    prodiHomebase: 'S-1 Manajemen',
    keahlian: 'Manajemen Operasional & Strategik',
    kuotaS1: 6,
    aktifS1: 3,
    kuotaS2: 3,
    aktifS2: 1,
    kuotaS3: 0,
    aktifS3: 0,
    statusSK: 'SK Dekan Berlaku 2026'
  },
  {
    id: 'dos-slamet',
    nama: 'Dr. H. Slamet Subari, S.E., M.Si.',
    nip: '196504121991031003',
    jabatan: 'Lektor Kepala / IV-b',
    prodiHomebase: 'S-1 Ekonomi Pembangunan',
    keahlian: 'Ekonomi Manajerial & Kelembagaan',
    kuotaS1: 6,
    aktifS1: 2,
    kuotaS2: 4,
    aktifS2: 2,
    kuotaS3: 0,
    aktifS3: 0,
    statusSK: 'SK Dekan Berlaku 2026'
  },
  {
    id: 'dos-rita',
    nama: 'Dr. Rita Mutiarni, S.E., M.M.',
    nip: '197903212006042001',
    jabatan: 'Lektor / III-d',
    prodiHomebase: 'S-1 Akuntansi',
    keahlian: 'Akuntansi Manajemen & Pengendalian Keuangan',
    kuotaS1: 6,
    aktifS1: 4,
    kuotaS2: 3,
    aktifS2: 1,
    kuotaS3: 0,
    aktifS3: 0,
    statusSK: 'SK Dekan Berlaku 2026'
  },
  {
    id: 'dos-alan',
    nama: 'alan',
    nip: '22',
    jabatan: 'Lektor / Dosen Manajemen',
    prodiHomebase: 'S-1 Manajemen',
    keahlian: 'Manajemen Bisnis & Kewirausahaan',
    kuotaS1: 6,
    aktifS1: 0,
    kuotaS2: 4,
    aktifS2: 0,
    kuotaS3: 3,
    aktifS3: 0,
    statusSK: 'SK Dekan Berlaku 2026'
  }
];

// Data Penetapan Dewan Penguji Resmi Sesuai Komposisi Pedoman (Halaman 68-71)
export const INITIAL_PENETAPAN_PENGUJI = [
  {
    id: 'uji-tetap-1',
    sidangId: 'sdg-s1-1',
    jenjang: 'S1',
    programStudi: 'S-1 Manajemen',
    prodi: 'S-1 Manajemen',
    jenisUjian: 'Seminar Proposal Skripsi',
    mahasiswa: 'Dinda Ayu Larasati (210211100142)',
    judul: 'Pengaruh Live Commerce Interactive Features dan Emotional Value Terhadap Keputusan Pembelian Spontan Produk Batik Madura di TikTok Shop',
    pedomanRule: 'D3/S1 Sempro: 3 Penguji (Ketua Pembimbing, Penguji Utama, Anggota)',
    jadwal: 'Senin, 14 Oktober 2026 (09.00 - 10.30 WIB)',
    ruang: 'R. Sidang Jurusan Manajemen Lantai 2',
    susunanPenguji: [
      { nomor: 1, peran: 'Ketua Penguji', nama: 'Dra. Hj. S. Anugrahini Irawati, M.M.', nip: '196203031988032001', homebase: 'S-1 Manajemen', statusKonfirmasi: 'Bersedia' },
      { nomor: 2, peran: 'Anggota Penguji I (Penguji Utama)', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002', homebase: 'S-2 Magister Manajemen (Lintas Prodi)', statusKonfirmasi: 'Bersedia' },
      { nomor: 3, peran: 'Anggota Penguji II', nama: 'Aprilina Susandini, S.E., M.SM.', nip: '198704162015042005', homebase: 'S-1 Manajemen', statusKonfirmasi: 'Bersedia' }
    ],
    statusSK: 'SK Ditetapkan Koorprodi'
  },
  {
    id: 'uji-tetap-2',
    sidangId: 'sdg-s2-1',
    jenjang: 'S2',
    programStudi: 'S-2 Magister Manajemen',
    prodi: 'S-2 Magister Manajemen',
    jenisUjian: 'Sidang Tesis Magister',
    mahasiswa: 'Rahmat Hidayat, S.E. (230221600018)',
    judul: 'Pengaruh Kepemimpinan Transformasional dan Budaya Organisasi Terhadap Kinerja Karyawan Melalui Komitmen Afektif pada Perbankan Syariah di Madura',
    pedomanRule: 'S2 Tesis: 4 Penguji (Pembimbing I, Pembimbing II sebagai Pemimpin Sidang, 2 Penguji Ahli bukan pembimbing)',
    jadwal: 'Rabu, 16 Oktober 2026 (13.00 - 15.00 WIB)',
    ruang: 'R. Ujian Pascasarjana Lantai 3',
    susunanPenguji: [
      { nomor: 1, peran: 'Pembimbing II (Pemimpin Sidang)', nama: 'Dr. Rita Mutiarni, S.E., M.M.', nip: '197903212006042001', homebase: 'S-1 Akuntansi (Lintas Prodi)', statusKonfirmasi: 'Bersedia' },
      { nomor: 2, peran: 'Pembimbing I (Anggota Penguji)', nama: 'Dr. H. Slamet Subari, S.E., M.Si.', nip: '196504121991031003', homebase: 'S-1 Ekonomi Pembangunan (Lintas Prodi)', statusKonfirmasi: 'Bersedia' },
      { nomor: 3, peran: 'Penguji Ahli I (Bukan Pembimbing)', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002', homebase: 'S-2 Magister Manajemen', statusKonfirmasi: 'Bersedia' },
      { nomor: 4, peran: 'Penguji Ahli II (Bukan Pembimbing)', nama: 'Dr. Mochammad Isa Anshori, S.E., M.Si.', nip: '197003222005011003', homebase: 'S-1 Manajemen (Lintas Prodi)', statusKonfirmasi: 'Bersedia' }
    ],
    statusSK: 'SK Ditetapkan Koorprodi'
  },
  {
    id: 'uji-tetap-3',
    sidangId: 'sdg-s3-1',
    jenjang: 'S3',
    programStudi: 'S-3 Doktor Ilmu Manajemen',
    prodi: 'S-3 Doktor Ilmu Manajemen',
    jenisUjian: 'Ujian Kelayakan Disertasi (Desk Review)',
    mahasiswa: 'Bambang Suryo Utomo, S.E., M.M. (220231600004)',
    judul: 'Model Determinan Dynamic Capabilities Terhadap Ketahanan Usaha Berkelanjutan Berbasis Kearifan Lokal Madura',
    pedomanRule: 'S3 Kelayakan: 3 Penilai (DPA I, DPA II, Promotor)',
    jadwal: '24 September 2026 (Desk Review)',
    ruang: 'Desk Review Pascasarjana',
    susunanPenguji: [
      { nomor: 1, peran: 'Penilai I (Promotor)', nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.', nip: '196306231989031002', homebase: 'S-3 Doktor Ilmu Manajemen', statusKonfirmasi: 'Selesai Menilai' },
      { nomor: 2, peran: 'Penilai II (Kopromotor/DPA)', nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', nip: '196206231988112001', homebase: 'D-3 Entrepreneurship (Lintas Prodi)', statusKonfirmasi: 'Selesai Menilai' },
      { nomor: 3, peran: 'Penilai III', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002', homebase: 'S-2 Magister Manajemen (Lintas Prodi)', statusKonfirmasi: 'Selesai Menilai' }
    ],
    statusSK: 'Berita Acara Terbit (NA 75.67)'
  },
  {
    id: 'uji-tetap-4',
    sidangId: 'sdg-s3-2',
    jenjang: 'S3',
    programStudi: 'S-3 Doktor Ilmu Manajemen',
    prodi: 'S-3 Doktor Ilmu Manajemen',
    jenisUjian: 'Ujian Tertutup Disertasi',
    mahasiswa: 'Bambang Suryo Utomo, S.E., M.M. (220231600004)',
    judul: 'Model Determinan Dynamic Capabilities Terhadap Ketahanan Usaha Berkelanjutan Berbasis Kearifan Lokal Madura: Peran Mediasi Orientasi Inovasi Digital',
    pedomanRule: 'S3 Tertutup: 7 Penguji (1 Pemimpin Sidang, 1 Promotor, 1 Kopromotor, 3 Penguji Internal UTM, 1 Penguji Eksternal Luar UTM)',
    jadwal: 'Diusulkan: Awal November 2026',
    ruang: 'R. Sidang Utama Rektorat / Pascasarjana',
    susunanPenguji: [
      { nomor: 1, peran: 'Pemimpin Sidang', nama: 'Dekan FEB UTM / Wakil Dekan I', nip: '196811231994031001', homebase: 'Dekanat FEB UTM', statusKonfirmasi: 'Menunggu Pengesahan' },
      { nomor: 2, peran: 'Promotor', nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.', nip: '196306231989031002', homebase: 'S-3 Doktor Ilmu Manajemen', statusKonfirmasi: 'Bersedia' },
      { nomor: 3, peran: 'Kopromotor', nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', nip: '196206231988112001', homebase: 'D-3 Entrepreneurship (Lintas Prodi)', statusKonfirmasi: 'Bersedia' },
      { nomor: 4, peran: 'Penguji Internal 1', nama: 'Prof. Dr. H. Muh. Syarif, Drs.Ec., M.Si.', nip: '196311302001121001', homebase: 'FEB UTM', statusKonfirmasi: 'Bersedia' },
      { nomor: 5, peran: 'Penguji Internal 2', nama: 'Dr. Helmi Buyung Aulia Safrizal, ST., SE., M.M.T.', nip: '197805152006041002', homebase: 'FEB UTM', statusKonfirmasi: 'Bersedia' },
      { nomor: 6, peran: 'Penguji Internal 3', nama: 'Dr. Bambang Setiyo Pambudi, S.E., M.M.', nip: '197309272003121001', homebase: 'FEB UTM', statusKonfirmasi: 'Bersedia' },
      { nomor: 7, peran: 'Penguji Eksternal (Luar UTM)', nama: 'Prof. Dr. Badri Munir Sukoco, S.E., MBA., Ph.D. (Universitas Airlangga)', nip: 'Eksternal-UNAIR', homebase: 'UNAIR (Eksternal Luar UTM)', statusKonfirmasi: 'Menunggu Surat Dekan' }
    ],
    statusSK: 'Draf Susunan Dewan Penguji'
  }
];

// Data Arsip Dokumen Program Studi
export const INITIAL_DOKUMEN_PRODI = [
  {
    id: 'doc-prd-1',
    kode: 'SK-PEMB-2026-01',
    namaDokumen: 'SK_Dekan_Penetapan_Dosen_Pembimbing_Semester_Ganjil_2026.pdf',
    kategori: 'Surat Keputusan Dekan',
    programStudi: 'S-1 Manajemen',
    prodi: 'S-1 Manajemen',
    jenjang: 'S1',
    tanggal: '15 Januari 2026',
    ukuran: '2.4 MB',
    status: 'Disahkan Dekan'
  },
  {
    id: 'doc-prd-2',
    kode: 'BA-SEMPRO-2026-44',
    namaDokumen: 'Berita_Acara_Kompilasi_Seminar_Proposal_Periode_September_2026.pdf',
    kategori: 'Berita Acara',
    programStudi: 'S-1 Manajemen',
    prodi: 'S-1 Manajemen',
    jenjang: 'S1',
    tanggal: '29 September 2026',
    ukuran: '1.8 MB',
    status: 'Disahkan Koorprodi'
  },
  {
    id: 'doc-prd-3',
    kode: 'SK-PENG-2026-12',
    namaDokumen: 'SK_Dewan_Penguji_Sidang_Tesis_Magister_Oktober_2026.pdf',
    kategori: 'Surat Keputusan Dekan',
    programStudi: 'S-2 Magister Manajemen',
    prodi: 'S-2 Magister Manajemen',
    jenjang: 'S2',
    tanggal: '01 Oktober 2026',
    ukuran: '1.2 MB',
    status: 'Disahkan Dekan'
  },
  {
    id: 'doc-prd-4',
    kode: 'BA-KELAYAKAN-S3-03',
    namaDokumen: 'Berita_Acara_Desk_Review_Ujian_Kelayakan_Bambang_Suryo_S3.pdf',
    kategori: 'Berita Acara',
    programStudi: 'S-3 Doktor Ilmu Manajemen',
    prodi: 'S-3 Doktor Ilmu Manajemen',
    jenjang: 'S3',
    tanggal: '25 September 2026',
    ukuran: '950 KB',
    status: 'Disahkan DPA & Koorprodi'
  }
];
