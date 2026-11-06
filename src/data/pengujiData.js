// Mock Data & Domain Models Khusus Role Dewan Penguji (Fase G)
// Berdasarkan Buku Pedoman Tugas Akhir Jurusan Manajemen FEB UTM 2026

export const PENGUJI_PROFILE_DEFAULT = {
  id: 'penguji-faidal',
  nip: '197703032003121002',
  nidn: '0003037702',
  nama: 'Dr. Faidal, S.E., M.M.',
  jabatan: 'Lektor / Penata Tingkat I (III/c)',
  keahlian: 'Manajemen Sumber Daya Manusia & Metodologi Penelitian',
  email: 'faidal@trunojoyo.ac.id',
  ruang: 'R. Dosen Manajemen Gedung R.K.B. Lantai 2'
};

// Skala Konversi Nilai Resmi Universitas Trunojoyo Madura (Buku Pedoman 2026)
export const KONVERSI_NILAI_UTM = [
  { min: 80, grade: 'A', bobot: 4.0, predikat: 'Sangat Baik' },
  { min: 75, grade: 'B+', bobot: 3.5, predikat: 'Lebih dari Baik' },
  { min: 70, grade: 'B', bobot: 3.0, predikat: 'Baik' },
  { min: 65, grade: 'C+', bobot: 2.5, predikat: 'Lebih dari Cukup' },
  { min: 56, grade: 'C', bobot: 2.0, predikat: 'Cukup' },
  { min: 45, grade: 'D', bobot: 1.0, predikat: 'Kurang' },
  { min: 0, grade: 'E', bobot: 0.0, predikat: 'Gagal' }
];

export function hitungGradeUTM(nilaiAngka) {
  if (nilaiAngka === null || nilaiAngka === undefined || isNaN(nilaiAngka)) return null;
  const num = Number(nilaiAngka);
  for (const k of KONVERSI_NILAI_UTM) {
    if (num >= k.min) return k;
  }
  return KONVERSI_NILAI_UTM[KONVERSI_NILAI_UTM.length - 1];
}

// Rubrik Penilaian Resmi Buku Pedoman 2026 Sesuai Jenjang & Jenis Ujian
export const RUBRIK_PENILAIAN_PENGUJI = {
  // 1. Program Diploma & Sarjana (D3 / S1) - Pedoman Hal 74-75
  D3_S1: {
    contextKey: 'D3_S1',
    namaRubrik: 'Rubrik Ujian Tugas Akhir / Skripsi (Program D3 & S1)',
    passingGradeMin: 56, // Nilai C
    aspek: [
      {
        id: 'asp-s1-1',
        nama: 'Tata Tulis dan Format Ilmiah',
        deskripsi: 'Kepatuhan format Buku Pedoman 2026, tata bahasa baku, kerapian tipografi, dan konsistensi sitasi APA 7th.',
        bobot: 20
      },
      {
        id: 'asp-s1-2',
        nama: 'Metodologi Penelitian',
        deskripsi: 'Ketepatan desain riset, teknik sampling, operasionalisasi variabel, validitas & reliabilitas instrumen, dan teknik analisis data.',
        bobot: 30
      },
      {
        id: 'asp-s1-3',
        nama: 'Substansi dan Kedalaman Pembahasan',
        deskripsi: 'Kekuatan latar belakang & fenomena gap, sintesis teori, ketajaman interpretasi hasil riset, serta perbandingan dengan temuan empiris terdahulu.',
        bobot: 35
      },
      {
        id: 'asp-s1-4',
        nama: 'Kemampuan Menyampaikan dan Mempertahankan Hasil',
        deskripsi: 'Kelancaran presentasi lisan, penguasaan materi, argumentasi ilmiah, dan daya nalar saat mempertahankan hasil tugas akhir.',
        bobot: 15
      }
    ],
    catatanAturan: 'Pedoman Hal 75: Rentang 0–100. Mahasiswa dinyatakan lulus dengan nilai sekurang-kurangnya C (NA ≥ 56). Selisih nilai antar penguji tidak boleh lebih dari 10 poin.'
  },

  // 2. Program Magister (S2) - Pedoman Hal 75-76
  S2: {
    contextKey: 'S2',
    namaRubrik: 'Rubrik Sidang Tesis Magister (Program S2)',
    passingGradeMin: 70, // Nilai B
    aspek: [
      {
        id: 'asp-s2-1',
        nama: 'Tata Tulis dan Kaidah Publikasi Ilmiah',
        deskripsi: 'Sistematika penulisan tesis magister, integritas referensi primer bereputasi, dan kepatuhan format naskah artikel publikasi.',
        bobot: 15
      },
      {
        id: 'asp-s2-2',
        nama: 'Metodologi Penelitian dan Rigoritas Instrumen',
        deskripsi: 'Rigoritas metodologis, kecukupan sampel, robustness test instrumen, dan justifikasi model analisis struktural.',
        bobot: 30
      },
      {
        id: 'asp-s2-3',
        nama: 'Substansi, Novelty, dan Kedalaman Pembahasan',
        deskripsi: 'Kebaruan konseptual (novelty gap), kontribusi teoretis manajemen, serta implikasi manajerial terapan.',
        bobot: 40
      },
      {
        id: 'asp-s2-4',
        nama: 'Kemampuan Presentasi dan Pertahanan Argumentasi',
        deskripsi: 'Kualitas penyajian gagasan ilmiah, ketepatan menjawab sanggahan tim penguji, dan penguasaan domain ilmu.',
        bobot: 15
      }
    ],
    catatanAturan: 'Pedoman Hal 75: Mahasiswa dinyatakan lulus penilaian tesis apabila mendapatkan nilai kesimpulan sekurang-kurangnya B (NA ≥ 70).'
  },

  // 3. Program Doktor (S3) - Ujian Kualifikasi - Pedoman Hal 63 & 70
  S3_KUALIFIKASI: {
    contextKey: 'S3_KUALIFIKASI',
    namaRubrik: 'Rubrik Ujian Kualifikasi Disertasi (Doktor)',
    passingGradeMin: 70,
    aspek: [
      {
        id: 'asp-s3k-1',
        nama: 'Penguasaan Landasan Teori & Konsep Manajemen',
        deskripsi: 'Penguasaan filsafat ilmu manajemen, teori-teori agung (grand theories), dan peta evolusi teori mutakhir.',
        bobot: 35
      },
      {
        id: 'asp-s3k-2',
        nama: 'Kelayakan & Kejelasan Topik Riset Disertasi',
        deskripsi: 'Signifikansi topik riset doktoral, novelty gagasan, dan kontribusi terhadap khazanah keilmuan.',
        bobot: 35
      },
      {
        id: 'asp-s3k-3',
        nama: 'Kesiapan Desain Metodologi & Kerangka Analisis',
        deskripsi: 'Rencana pendekatan riset, kerangka konseptual, dan kelayakan operasional pelaksanaan disertasi.',
        bobot: 30
      }
    ],
    catatanAturan: 'Pedoman Hal 63: Menguji kesiapan landasan konseptual dan kelayakan topik sebelum menyusun proposal disertasi.'
  },

  // 4. Program Doktor (S3) - Ujian Proposal Disertasi - Pedoman Hal 63-64 & 70
  S3_PROPOSAL: {
    contextKey: 'S3_PROPOSAL',
    namaRubrik: 'Rubrik Ujian Proposal Disertasi (Doktor)',
    passingGradeMin: 70,
    aspek: [
      {
        id: 'asp-s3p-1',
        nama: 'Latar Belakang, Fenomena Gap & Research Gap',
        deskripsi: 'Ketajaman identifikasi masalah empiris dan kesenjangan riset (gap analysis) dari literatur internasional bereputasi.',
        bobot: 30
      },
      {
        id: 'asp-s3p-2',
        nama: 'Sintesis Literatur & Kebaruan Konseptual (Novelty)',
        deskripsi: 'Kedalaman sintesis literatur global bereputasi dan artikulasi posisi kebaruan (novelty) model disertasi.',
        bobot: 35
      },
      {
        id: 'asp-s3p-3',
        nama: 'Ketepatan Desain Metodologi & Pengujian Model',
        deskripsi: 'Rancangan metodologi riset lanjutan, pengukuran variabel, dan instrumen validasi data empiris.',
        bobot: 35
      }
    ],
    catatanAturan: 'Pedoman Hal 64: Menetapkan kelayakan rancangan proposal disertasi untuk melanjutkan ke tahap penelitian lapangan.'
  },

  // 5. Program Doktor (S3) - Ujian Kelayakan Disertasi (Desk Review) - Pedoman Hal 64-65
  S3_KELAYAKAN: {
    contextKey: 'S3_KELAYAKAN',
    namaRubrik: 'Rubrik Ujian Kelayakan Disertasi (Desk Review)',
    passingGradeMin: 70,
    isKelayakan: true,
    aspek: [
      {
        id: 'asp-s3l-1',
        nama: 'Kelayakan Penulisan & Format Laporan Disertasi',
        deskripsi: 'Kepatuhan format naskah disertasi UTM, tata tulis ilmiah komprehensif, dan verifikasi cek Turnitin ≤ 20%.',
        bobot: 25
      },
      {
        id: 'asp-s3l-2',
        nama: 'Rigoritas Metodologi, Pengolahan Data & Analisis',
        deskripsi: 'Ketepatan pembuktian empiris, validitas prosedur analisis statistik/kualitatif tingkat lanjut, dan ketelitian interpretasi.',
        bobot: 35
      },
      {
        id: 'asp-s3l-3',
        nama: 'Kebaruan Temuan (Novelty) & Kelayakan Publikasi Scopus Q4',
        deskripsi: 'Kedalaman sintesis temuan, orisinalitas kontribusi teoretis, dan kepatuhan syarat publikasi internasional minimal Q4.',
        bobot: 40
      }
    ],
    pilihanHasilKelayakan: [
      { id: 'Layak Revisi Minor', label: 'Layak Revisi Minor', desc: 'Perubahan tidak terkait substansi penelitian (hanya tata tulis/redaksional).' },
      { id: 'Layak Revisi Mayor', label: 'Layak Revisi Mayor', desc: 'Perubahan terkait substansi penelitian (misal penyempurnaan pembahasan/literatur).' },
      { id: 'Tidak Layak', label: 'Tidak Layak', desc: 'Hasil penelitian belum memenuhi standar ilmiah program doktor UTM.' }
    ],
    catatanAturan: 'Pedoman Hal 65: Tugas akhir dinyatakan LAYAK apabila sekurang-kurangnya DUA DARI TIGA PENGUJI kelayakan menyatakan layak dan NA ≥ 70.'
  },

  // 6. Program Doktor (S3) - Ujian Tertutup - Pedoman Hal 66 & 76-77
  S3_TERTUTUP: {
    contextKey: 'S3_TERTUTUP',
    namaRubrik: 'Rubrik Ujian Disertasi Tertutup (Doktor)',
    passingGradeMin: 70,
    aspek: [
      {
        id: 'asp-s3t-1',
        nama: 'Kelayakan Laporan Disertasi & Tata Tulis',
        deskripsi: 'Kerapian draf final laporan disertasi, konsistensi istilah, dan kesesuaian dengan pedoman akademik.',
        bobot: 20
      },
      {
        id: 'asp-s3t-2',
        nama: 'Metodologi & Keabsahan Temuan Empiris',
        deskripsi: 'Kekuatan pembuktian hipotesis/model, validitas konstruk riset, dan robustness hasil uji empiris.',
        bobot: 30
      },
      {
        id: 'asp-s3t-3',
        nama: 'Substansi, Kontribusi Teori & Manajerial',
        deskripsi: 'Kebaruan teoritis (theoretical contribution), kontribusi metodologis, dan rekomendasi strategis manajerial.',
        bobot: 35
      },
      {
        id: 'asp-s3t-4',
        nama: 'Kemampuan Mempertahankan Hasil di Hadapan Penguji',
        deskripsi: 'Daya nalar kritis, ketepatan argumentasi, dan kesiapan ilmiah calon doktor di hadapan dewan penguji.',
        bobot: 15
      }
    ],
    catatanAturan: 'Pedoman Hal 76: Rentang nilai 0–100. Mahasiswa dinyatakan lulus bila NA ≥ 70.'
  },

  // 7. Program Doktor (S3) - Ujian Terbuka - Pedoman Hal 70 & 78
  S3_TERBUKA: {
    contextKey: 'S3_TERBUKA',
    namaRubrik: 'Rubrik Promosi Doktor / Ujian Terbuka',
    passingGradeMin: 70,
    aspek: [
      {
        id: 'asp-s3o-1',
        nama: 'Penguasaan Substansi Disertasi',
        deskripsi: 'Kedalaman penguasaan seluruh materi temuan disertasi secara komprehensif.',
        bobot: 30
      },
      {
        id: 'asp-s3o-2',
        nama: 'Wawasan Implementasi & Dampak Kebijakan / Manajerial',
        deskripsi: 'Keluasan perspektif dalam mengimplementasikan temuan riset pada industri, UMKM, atau kebijakan publik.',
        bobot: 25
      },
      {
        id: 'asp-s3o-3',
        nama: 'Kemampuan Mempromosikan Hasil-Hasil Penelitian Doktor',
        deskripsi: 'Kecakapan mengomunikasikan signifikansi riset kepada khalayak akademisi dan pemangku kepentingan.',
        bobot: 25
      },
      {
        id: 'asp-s3o-4',
        nama: 'Kemampuan Mempertahankan Disertasi di Hadapan Publik Akademik',
        deskripsi: 'Kewibawaan akademis dan argumentasi ilmiah saat menanggapi sanggahan promotor dan penguji eksternal.',
        bobot: 20
      }
    ],
    catatanAturan: 'Pedoman Hal 78: Rentang nilai 0–100. Mahasiswa dinyatakan lulus bila NA ≥ 70.'
  }
};

// Daftar Sidang & Ujian yang Ditugaskan kepada Dr. Faidal
export const INITIAL_DAFTAR_UJIAN_PENGUJI = [
  {
    id: 'uj-pgj-1',
    mhsId: 'mhs-s1-1',
    namaMahasiswa: 'Dinda Ayu Larasati',
    nim: '210211100142',
    jenjang: 'S1',
    programStudi: 'S-1 Manajemen',
    bentukTA: 'Skripsi',
    jenisTA: 'TAKT',
    judul: 'Pengaruh Live Commerce Interactive Features dan Emotional Value Terhadap Keputusan Pembelian Spontan Produk Batik Madura di TikTok Shop',
    jenisUjian: 'Seminar Proposal Skripsi',
    jadwal: 'Senin, 14 Oktober 2026',
    waktu: '09.00 - 10.30 WIB (90 Menit)',
    ruang: 'Ruang Sidang Jurusan Manajemen FEB Lantai 2',
    peranPenguji: 'Penguji Utama (Bukan Pembimbing)',
    posisiPengujiNomor: 2,
    pembimbing: 'Dra. Hj. S. Anugrahini Irawati, M.M. (Ketua Penguji)',
    susunanPenguji: [
      { peran: 'Ketua Penguji (Pembimbing)', nama: 'Dra. Hj. S. Anugrahini Irawati, M.M.', nip: '196203031988032001' },
      { peran: 'Penguji Utama', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002' },
      { peran: 'Anggota Penguji', nama: 'Aprilina Susandini, S.E., M.SM.', nip: '198904252019032014' }
    ],
    statusUjian: 'Menunggu Pelaksanaan & Penilaian',
    fileNaskah: 'Proposal_Skripsi_Final_Sempro_Dinda.pdf',
    ukuranNaskah: '2.1 MB',
    turnitinSim: 19,
    turnitinAI: 24,
    rubrikContext: 'D3_S1',
    penilaianSubmitted: false,
    nilaiFinal: null,
    catatanTersimpan: 1
  },
  {
    id: 'uj-pgj-2',
    mhsId: 'mhs-s2-1',
    namaMahasiswa: 'Rahmat Hidayat, S.E.',
    nim: '230221600018',
    jenjang: 'S2',
    programStudi: 'S-2 Magister Manajemen',
    bentukTA: 'Tesis',
    jenisTA: 'TAKT',
    judul: 'Pengaruh Kepemimpinan Transformasional dan Budaya Organisasi Terhadap Kinerja Karyawan Melalui Komitmen Afektif pada Perbankan Syariah di Madura',
    jenisUjian: 'Sidang Tesis Magister',
    jadwal: 'Rabu, 16 Oktober 2026',
    waktu: '13.00 - 15.00 WIB (120 Menit)',
    ruang: 'Ruang Ujian Pascasarjana Lantai 3',
    peranPenguji: 'Penguji Ahli I (Bukan Pembimbing)',
    posisiPengujiNomor: 3,
    pembimbing: 'Dr. H. Slamet Subari (Pembimbing I) & Dr. Rita Mutiarni (Pembimbing II)',
    susunanPenguji: [
      { peran: 'Pembimbing II (Pemimpin Sidang)', nama: 'Dr. Rita Mutiarni, S.E., M.M.', nip: '197903212006042001' },
      { peran: 'Pembimbing I', nama: 'Dr. H. Slamet Subari, S.E., M.Si.', nip: '196504121991031003' },
      { peran: 'Penguji Ahli I', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002' },
      { peran: 'Penguji Ahli II', nama: 'Dr. Mochammad Isa Anshori, S.E., M.Si.', nip: '197307152005011001' }
    ],
    statusUjian: 'Menunggu Pelaksanaan & Penilaian',
    fileNaskah: 'Draf_Lengkap_Tesis_Magister_Rahmat.pdf',
    ukuranNaskah: '4.2 MB',
    turnitinSim: 14,
    turnitinAI: 16,
    rubrikContext: 'S2',
    penilaianSubmitted: false,
    nilaiFinal: null,
    catatanTersimpan: 0
  },
  {
    id: 'uj-pgj-d3',
    mhsId: 'mhs-d3',
    namaMahasiswa: 'Siti Nur Haliza',
    nim: '230201100055',
    jenjang: 'D3',
    programStudi: 'D-3 Manajemen Perbankan & Keuangan',
    bentukTA: 'Laporan Tugas Akhir Terapan',
    jenisTA: 'TAKT',
    judul: 'Perancangan Sistem Pencatatan Arus Kas dan Manajemen Persediaan Berbasis Aplikasi Digital pada UMKM Jamu Tradisional Madura',
    jenisUjian: 'Sidang Tugas Akhir D-III',
    jadwal: 'Selasa, 15 Oktober 2026',
    waktu: '10.00 - 11.30 WIB (90 Menit)',
    ruang: 'Laboratorium Akuntansi & Perbankan FEB Lantai 1',
    peranPenguji: 'Penguji Ahli Terapan (Bukan Pembimbing)',
    posisiPengujiNomor: 2,
    pembimbing: 'Moh. Faizal, S.E., M.M. (Ketua Penguji / Pembimbing)',
    susunanPenguji: [
      { peran: 'Ketua Penguji (Pembimbing)', nama: 'Moh. Faizal, S.E., M.M.', nip: '198509142014041001' },
      { peran: 'Penguji Ahli Terapan', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002' },
      { peran: 'Anggota Penguji', nama: 'Aprilina Susandini, S.E., M.SM.', nip: '198904252019032014' }
    ],
    statusUjian: 'Menunggu Pelaksanaan & Penilaian',
    fileNaskah: 'Laporan_TA_Terapan_D3_Siti_Nur_Haliza.pdf',
    ukuranNaskah: '1.8 MB',
    turnitinSim: 12,
    turnitinAI: 8,
    rubrikContext: 'D3_S1',
    penilaianSubmitted: false,
    nilaiFinal: null,
    catatanTersimpan: 1
  },
  {
    id: 'uj-pgj-takk',
    mhsId: 'mhs-s1-takk',
    namaMahasiswa: 'Moh. Fikri Haikal',
    nim: '210211100219',
    jenjang: 'S1',
    programStudi: 'S-1 Manajemen (Kewirausahaan)',
    bentukTA: 'Tugas Akhir Kontributif-Kreatif (TAKK)',
    jenisTA: 'TAKK',
    judul: 'Inovasi Ekosistem Pembiayaan Klaster Petani Garam Madura dan Portofolio Prestasi Kewirausahaan Berkelanjutan',
    jenisUjian: 'Sidang Diseminasi & Portofolio Bisnis TAKK',
    jadwal: 'Kamis, 17 Oktober 2026',
    waktu: '09.30 - 11.00 WIB (90 Menit)',
    ruang: 'Ruang Inkubator Bisnis Mahasiswa FEB Lantai 1',
    peranPenguji: 'Penguji Ahli Kewirausahaan & Portofolio',
    posisiPengujiNomor: 2,
    pembimbing: 'Dr. Mochammad Isa Anshori, S.E., M.Si. (Dosen Pendamping Bisnis)',
    susunanPenguji: [
      { peran: 'Dosen Pembimbing', nama: 'Dr. Mochammad Isa Anshori, S.E., M.Si.', nip: '197307152005011001' },
      { peran: 'Penguji Ahli Kewirausahaan', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002' }
    ],
    statusUjian: 'Menunggu Pelaksanaan & Penilaian',
    fileNaskah: 'Portofolio_Bisnis_TAKK_KopiRempah_Fikri.pdf',
    ukuranNaskah: '3.4 MB',
    turnitinSim: 9,
    turnitinAI: 11,
    rubrikContext: 'D3_S1',
    penilaianSubmitted: false,
    nilaiFinal: null,
    catatanTersimpan: 1
  },
  {
    id: 'uj-pgj-3',
    mhsId: 'mhs-s3-1',
    namaMahasiswa: 'Bambang Suryo Utomo, S.E., M.M.',
    nim: '220231600004',
    jenjang: 'S3',
    programStudi: 'S-3 Ilmu Manajemen',
    bentukTA: 'Disertasi',
    jenisTA: 'TAKT',
    judul: 'Model Determinan Dynamic Capabilities Terhadap Ketahanan Usaha Berkelanjutan Berbasis Kearifan Lokal Madura: Peran Mediasi Orientasi Inovasi Digital',
    jenisUjian: 'Ujian Kelayakan Disertasi (Desk Review)',
    jadwal: '24 September 2026',
    waktu: 'Penelaahan Dokumen (Desk Review)',
    ruang: 'Desk Review Pascasarjana Gedung RKB',
    peranPenguji: 'Penilai III',
    posisiPengujiNomor: 3,
    pembimbing: 'Prof. Dr. Pribanus Wantara (Promotor) & Dr. Iriani Ismail (Kopromotor)',
    susunanPenguji: [
      { peran: 'Penilai I (Promotor)', nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.', nip: '196306231989031002', nilai: 76.50 },
      { peran: 'Penilai II (Kopromotor)', nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', nip: '196201081987032001', nilai: 75.00 },
      { peran: 'Penilai III', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002', nilai: 74.00 }
    ],
    statusUjian: 'Selesai Dinilai',
    fileNaskah: 'Draf_Disertasi_Kelayakan_Bambang.pdf',
    ukuranNaskah: '4.8 MB',
    turnitinSim: 16,
    turnitinAI: 18,
    rubrikContext: 'S3_KELAYAKAN',
    penilaianSubmitted: true,
    rekomendasiKelayakan: 'Layak Revisi Minor', // Layak Revisi Minor | Layak Revisi Mayor | Tidak Layak
    nilaiFinal: 74.00,
    catatanTersimpan: 2,
    pengujiLain: [
      { nama: 'Prof. Dr. Pribanus Wantara', peran: 'Promotor', rekomendasi: 'Layak Revisi Minor', nilai: 76.50 },
      { nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', peran: 'Kopromotor', rekomendasi: 'Layak Revisi Minor', nilai: 75.00 },
      { nama: 'Dr. Faidal, S.E., M.M.', peran: 'Penilai III (Anda)', rekomendasi: 'Layak Revisi Minor', nilai: 74.00 }
    ]
  }
];

// Data Konten Naskah Lengkap untuk Tampilan Baca Penguji (Page 4: Naskah)
export const NASKAH_CONTENT_MAP = {
  'uj-pgj-1': {
    judul: 'Pengaruh Live Commerce Interactive Features dan Emotional Value Terhadap Keputusan Pembelian Spontan Produk Batik Madura di TikTok Shop',
    mahasiswa: 'Dinda Ayu Larasati',
    nim: '210211100142',
    jenjang: 'S1',
    babList: [
      {
        id: 'bab-1',
        title: 'BAB I — PENDAHULUAN',
        halaman: 'Halaman 1–15',
        sections: [
          {
            subTitle: '1.1 Latar Belakang Masalah',
            content: `Perkembangan perdagangan elektronik (e-commerce) di Indonesia mengalami pergeseran paradigma signifikan dengan adopsi model social commerce, khususnya fitur live streaming shopping (live commerce) pada platform TikTok Shop. Produk kerajinan tradisional seperti Batik Madura yang memiliki ciri khas corak tegas dan warna berani (karakteristik budaya Madura) sebelumnya mengandalkan saluran distribusi konvensional di pasar tradisional 17 Agustus Pamekasan dan Bangkalan.

Namun, fenomena live streaming interaktif memungkinkan interaksi langsung dua arah (real-time chat, unboxing live, demo pemakaian) antara penjual UMKM batik dengan konsumen di seluruh nusantara. Berdasarkan pra-survei awal terhadap 30 konsumen di Jawa Timur, sebanyak 73% menyatakan pernah melakukan pembelian batik secara spontan (impulsive buying) ketika terpapar interaksi host live streaming dan dorongan penawaran terbatas. Kesenjangan riset terlihat pada masih minimnya integrasi teori Stimulus-Organism-Response (S-O-R) dalam menguji interaksi sosial dan nilai emosional terhadap komoditas warisan budaya lokal di platform video pendek.`
          },
          {
            subTitle: '1.2 Rumusan Masalah',
            content: `1. Apakah live commerce interactive features (interaktivitas host, interaktivitas visual, interaktivitas konsumen) berpengaruh signifikan terhadap emotional value pembeli batik Madura di TikTok Shop?
2. Apakah emotional value berpengaruh signifikan terhadap impulsive buying keputusan pembelian spontan batik Madura di TikTok Shop?
3. Apakah emotional value memediasi hubungan antara live commerce interactive features dan impulsive buying batik Madura di TikTok Shop?`
          },
          {
            subTitle: '1.3 Tujuan Penelitian',
            content: `Penelitian ini bertujuan untuk menguji dan menganalisis peran pemediasi emotional value dalam menjembatani pengaruh fitur interaktif live streaming terhadap keputusan pembelian spontan pada produk batik khas Madura.`
          }
        ]
      },
      {
        id: 'bab-2',
        title: 'BAB II — KAJIAN PUSTAKA & PENGEMBANGAN HIPOTESIS',
        halaman: 'Halaman 16–38',
        sections: [
          {
            subTitle: '2.1 Teori Stimulus-Organism-Response (S-O-R)',
            content: `Model S-O-R yang dikembangkan oleh Mehrabian dan Russell (1974) menjelaskan bahwa stimuli lingkungan eksternal (S) mempengaruhi kondisi internal emosi dan kognitif organisme (O), yang kemudian menghasilkan respons perilaku berupa penerimaan atau penolakan (R). Dalam konteks ini, live commerce interactive features bertindak sebagai Stimulus, Emotional Value bertindak sebagai Organisme, dan Impulsive Buying bertindak sebagai Respons.`
          },
          {
            subTitle: '2.2 Pengembangan Hipotesis',
            content: `H1: Live commerce interactive features berpengaruh positif dan signifikan terhadap emotional value konsumen batik Madura di TikTok Shop.
H2: Emotional value berpengaruh positif dan signifikan terhadap keputusan pembelian spontan (impulsive buying) konsumen batik Madura di TikTok Shop.
H3: Emotional value memediasi secara parsial pengaruh live commerce interactive features terhadap impulsive buying.`
          }
        ]
      },
      {
        id: 'bab-3',
        title: 'BAB III — METODE PENELITIAN',
        halaman: 'Halaman 39–54',
        sections: [
          {
            subTitle: '3.1 Desain Penelitian & Populasi',
            content: `Penelitian ini menggunakan pendekatan kuantitatif eksplanatori. Populasi dalam penelitian ini adalah seluruh konsumen di Indonesia yang pernah menonton siaran live streaming TikTok Shop dan membeli produk Batik Madura. Sampel ditentukan dengan metode purposive sampling sebanyak 120 responden.`
          },
          {
            subTitle: '3.2 Teknik Analisis Data',
            content: `Analisis data dilakukan menggunakan Partial Least Squares Structural Equation Modeling (PLS-SEM) dengan perangkat lunak SmartPLS versi 4. Tahap pengujian meliputi evaluasi Measurement Model (Outer Model) dan Structural Model (Inner Model).`
          }
        ]
      }
    ]
  },
  'uj-pgj-2': {
    judul: 'Pengaruh Kepemimpinan Transformasional dan Budaya Organisasi Terhadap Kinerja Karyawan Melalui Komitmen Afektif pada Perbankan Syariah di Madura',
    mahasiswa: 'Rahmat Hidayat, S.E.',
    nim: '230221600018',
    jenjang: 'S2',
    babList: [
      {
        id: 'bab-s2-1',
        title: 'BAB I — PENDAHULUAN',
        halaman: 'Halaman 1–20',
        sections: [
          {
            subTitle: '1.1 Latar Belakang & Research Gap',
            content: `Industri perbankan syariah di Pulau Madura menghadapi tantangan kompetisi ketat pasca konsolidasi BSI dan pertumbuhan unit usaha syariah bank daerah. Di tengah karakteristik masyarakat Madura yang religius dan menjunjung tinggi patron-klien kiai/pimpinan, gaya kepemimpinan transformasional dan budaya organisasi berbasis nilai syariah menjadi determinan krusial dalam mendorong kinerja aparatur perbankan syariah. Tesis ini menganalisis pengaruh kepemimpinan transformasional terhadap kinerja karyawan dengan komitmen afektif sebagai variabel mediasi.`
          }
        ]
      },
      {
        id: 'bab-s2-4',
        title: 'BAB IV — HASIL DAN PEMBAHASAN',
        halaman: 'Halaman 75–120',
        sections: [
          {
            subTitle: '4.3 Pengujian Hipotesis & Efek Mediasi',
            content: `Berdasarkan analisis bootstrapping PLS-SEM dengan 5.000 subsample, koefisien jalur kepemimpinan transformasional ke komitmen afektif terbukti signifikan (β = 0.428, p < 0.001). Komitmen afektif terbukti memediasi secara komplementer hubungan budaya organisasi terhadap kinerja karyawan (Specific Indirect Effect β = 0.215, t-statistic = 3.842 > 1.96).`
          }
        ]
      }
    ]
  },
  'uj-pgj-3': {
    judul: 'Model Determinan Dynamic Capabilities Terhadap Ketahanan Usaha Berkelanjutan Berbasis Kearifan Lokal Madura: Peran Mediasi Orientasi Inovasi Digital',
    mahasiswa: 'Bambang Suryo Utomo, S.E., M.M.',
    nim: '220231600004',
    jenjang: 'S3',
    babList: [
      {
        id: 'bab-s3-1',
        title: 'BAB I — PENDAHULUAN & PERUMUSAN DISERTASI',
        halaman: 'Halaman 1–32',
        sections: [
          {
            subTitle: '1.1 Konteks Makro, Fenomena Lapangan & Novelty Gap',
            content: `Ketahanan usaha berkelanjutan (sustainable business resilience) pelaku usaha mikro, kecil, dan menengah (UMKM) di wilayah Madura menghadapi dualitas tantangan: disrupsi teknologi digital di satu sisi, dan keharusan mempertahankan modal sosial kultural (kearifan lokal 'Rampa Na Pao', tradisi gotong royong dan relasi kepercayaan) di sisi lain. Literatur konvensional Teece (2007, 2018) mengenai Dynamic Capabilities (sensing, seizing, transforming) sebagian besar dirumuskan dalam konteks korporasi barat dengan institusi formal kuat, sehingga menyisakan kesenjangan konseptual ketika diterapkan pada UMKM di lingkungan komunal dengan modal sosial informal dominan.`
          }
        ]
      },
      {
        id: 'bab-s3-2',
        title: 'BAB II — SINTESIS LITERATUR & PENGEMBANGAN MODEL NOVELTY',
        halaman: 'Halaman 33–85',
        sections: [
          {
            subTitle: '2.3 Integrasi Dynamic Capabilities dengan Kearifan Lokal Madura',
            content: `Disertasi ini merekonseptualisasi sensing capabilities ke dalam 'Cultural Sensing', yaitu kepekaan pelaku usaha dalam membaca preferensi pasar melalui jejaring komunitas paguyuban etnis dan modal religius. Sintesis ini melahirkan konstruk kebaruan 'Culturally Embedded Dynamic Capabilities' (CEDC) yang diusulkan sebagai novelty disertasi ini.`
          }
        ]
      },
      {
        id: 'bab-s3-5',
        title: 'BAB V — NOVELTY DISERTASI & KONTRIBUSI MANAJERIAL',
        halaman: 'Halaman 145–182',
        sections: [
          {
            subTitle: '5.2 Kontribusi Teoretis & Validasi Publikasi Internasional',
            content: `Temuan disertasi telah dituangkan dalam artikel ilmiah berjudul 'Cultural Adaptation of Dynamic Capabilities for MSMEs Sustainable Resilience' dan telah diterbitkan (Accepted LoA) pada Jurnal Internasional Bereputasi Scopus Q1/Q2 sesuai persyaratan Pedoman 2026 Pasal 66.`
          }
        ]
      }
    ]
  },
  'uj-pgj-d3': {
    judul: 'Perancangan Sistem Pencatatan Arus Kas dan Manajemen Persediaan Berbasis Aplikasi Digital pada UMKM Jamu Tradisional Madura',
    mahasiswa: 'Siti Nur Haliza',
    nim: '230201100055',
    jenjang: 'D3',
    babList: [
      {
        id: 'bab-d3-1',
        title: 'BAB I — PENDAHULUAN & LATAR BELAKANG PROYEK TERAPAN',
        halaman: 'Halaman 1–12',
        sections: [
          {
            subTitle: '1.1 Profil Mitra & Identifikasi Masalah Pembukuan',
            content: `Mitra proyek terapan adalah UMKM Jamu Tradisional Ibu Siti di Bangkalan yang beroperasi sejak 2018. Permasalahan utama mitra adalah ketiadaan pemisahan keuangan pribadi dan kas usaha, pencatatan transaksi manual pada buku folio yang rentan hilang, serta sering terjadinya kekosongan bahan baku rempah tanpa reorder point yang terukur.`
          }
        ]
      },
      {
        id: 'bab-d3-3',
        title: 'BAB III — RANCANG BANGUN SISTEM & IMPLEMENTASI APLIKASI',
        halaman: 'Halaman 25–45',
        sections: [
          {
            subTitle: '3.2 Implementasi Buku Kas Digital & Standar SAK EMKM',
            content: `Aplikasi pembukuan digital dirancang mengacu pada Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM). Menghasilkan laporan posisi keuangan, laporan laba rugi, dan kartu persediaan otomatis yang telah diuji operasionalnya selama 3 bulan masa magang terapan.`
          }
        ]
      }
    ]
  },
  'uj-pgj-takk': {
    judul: 'Inovasi Ekosistem Pembiayaan Klaster Petani Garam Madura dan Portofolio Prestasi Kewirausahaan Berkelanjutan',
    mahasiswa: 'Moh. Fikri Haikal',
    nim: '210211100219',
    jenjang: 'S1',
    babList: [
      {
        id: 'bab-takk-1',
        title: 'BAB I — RINGKASAN EKSEKUTIF BISNIS & REKAM JEJAK PRESTASI',
        halaman: 'Halaman 1–18',
        sections: [
          {
            subTitle: '1.1 Dasar Pengajuan Bebas Skripsi Jalur TAKK (Pedoman Bab VI)',
            content: `Berdasarkan Keputusan Dekan FEB UTM dan Pedoman 2026 Bab VI, mahasiswa yang meraih Juara 1 Kompetisi Inovasi Bisnis Mahasiswa (KIBM) Tingkat Nasional Kemdikbudristek (45 Poin) dan Publikasi Artikel SINTA 5 (37 Poin) berhak mengajukan konversi Tugas Akhir Kontributif-Kreatif (Total 82 Poin > Ambang 80 Poin Nilai A).`
          }
        ]
      },
      {
        id: 'bab-takk-2',
        title: 'BAB II — PORTOFOLIO SCALE-UP & LAPORAN TRAKSI OMZET OMNICHANNEL',
        halaman: 'Halaman 19–55',
        sections: [
          {
            subTitle: '2.3 Validasi Pasar, Omzet Bulanan & Legalitas NIB/P-IRT',
            content: `Usaha Kopi Rempah Madura telah membukukan rata-rata omzet Rp 24.500.000/bulan dengan margin bersih 28%. Telah mengantongi NIB resmi, Sertifikat Halal BPJPH, dan P-IRT dari Dinas Kesehatan Kabupaten Bangkalan.`
          }
        ]
      }
    ]
  }
};

// Data Catatan & Koreksi Dewan Penguji (Lembar Koreksi Resmi Pasca Sidang)
export const INITIAL_KOREKSI_PENGUJI = [
  {
    id: 'kor-1',
    ujianId: 'uj-pgj-3',
    mhsId: 'mhs-s3-1',
    namaMahasiswa: 'Bambang Suryo Utomo, S.E., M.M.',
    nim: '220231600004',
    jenjang: 'S3',
    jenisUjian: 'Ujian Kelayakan Disertasi',
    pengujiNip: '197703032003121002',
    namaPenguji: 'Dr. Faidal, S.E., M.M.',
    kategori: 'Substansi / Teori',
    bab: 'BAB II — Kajian Pustaka',
    halaman: 'Halaman 45-52',
    catatanKoreksi: 'Perluas pembahasan perbedaan substantive antara sensing capabilities dan seizing capabilities pada konteks UMKM Madura. Rujuk Teece (2018) dan empiris lokal terkini.',
    tanggapanMahasiswa: 'Telah ditambahkan 4 paragraf pada sub-bab 2.3.2 dengan merujuk Teece (2018) dan empiris lokal (Halaman 47-50).',
    statusVerifikasi: 'Menunggu Approval Penguji',
    fileBuktiRevisi: 'Perbaikan_Bab2_Disertasi_Bambang.pdf',
    tanggal: '24 September 2026'
  },
  {
    id: 'kor-2',
    ujianId: 'uj-pgj-3',
    mhsId: 'mhs-s3-1',
    namaMahasiswa: 'Bambang Suryo Utomo, S.E., M.M.',
    nim: '220231600004',
    jenjang: 'S3',
    jenisUjian: 'Ujian Kelayakan Disertasi',
    pengujiNip: '197703032003121002',
    namaPenguji: 'Dr. Faidal, S.E., M.M.',
    kategori: 'Metodologi',
    bab: 'BAB III — Metode Penelitian',
    halaman: 'Halaman 92',
    catatanKoreksi: 'Penyajian tabel matriks sintesis literatur terdahulu perlu diringkas dan difokuskan pada novelty gap.',
    tanggapanMahasiswa: 'Tabel 3.4 telah disederhanakan menjadi 3 kolom inti (Peneliti, Metodologi, Novelty Gap).',
    statusVerifikasi: 'Telah Disetujui Penguji',
    fileBuktiRevisi: 'Perbaikan_Bab3_MatriksSintesis.pdf',
    tanggal: '24 September 2026'
  },
  {
    id: 'kor-3',
    ujianId: 'uj-pgj-1',
    mhsId: 'mhs-s1-1',
    namaMahasiswa: 'Dinda Ayu Larasati',
    nim: '210211100142',
    jenjang: 'S1',
    jenisUjian: 'Seminar Proposal Skripsi',
    pengujiNip: '197703032003121002',
    namaPenguji: 'Dr. Faidal, S.E., M.M.',
    kategori: 'Substansi',
    bab: 'BAB I — Pendahuluan',
    halaman: 'Halaman 8',
    catatanKoreksi: 'Lengkapi data pra-survei pembelian batik Madura di TikTok Shop tahun 2025-2026 untuk memperkuat justifikasi fenomena gap.',
    tanggapanMahasiswa: 'Data pra-survei terhadap 30 responden awal telah dimasukkan pada sub-bab 1.1 halaman 9.',
    statusVerifikasi: 'Menunggu Approval Penguji',
    fileBuktiRevisi: 'PraSurvei_Batik_TikTok_Dinda.pdf',
    tanggal: '28 September 2026'
  },
  {
    id: 'kor-4',
    ujianId: 'uj-pgj-d3',
    mhsId: 'mhs-d3',
    namaMahasiswa: 'Siti Nur Haliza',
    nim: '230201100055',
    jenjang: 'D3',
    jenisUjian: 'Sidang Tugas Akhir D-III',
    pengujiNip: '197703032003121002',
    namaPenguji: 'Dr. Faidal, S.E., M.M.',
    kategori: 'Metodologi / Terapan',
    bab: 'BAB III — Rancang Bangun Sistem',
    halaman: 'Halaman 34',
    catatanKoreksi: 'Pastikan format laporan posisi keuangan pada aplikasi memenuhi standar SAK EMKM Bab 4 secara presisi.',
    tanggapanMahasiswa: 'Telah disesuaikan pos-pos aset lancar dan modal usaha mengacu pedoman Ikatan Akuntan Indonesia (IAI).',
    statusVerifikasi: 'Menunggu Approval Penguji',
    fileBuktiRevisi: 'Perbaikan_Format_SAK_EMKM_Siti.pdf',
    tanggal: '10 Oktober 2026'
  },
  {
    id: 'kor-5',
    ujianId: 'uj-pgj-takk',
    mhsId: 'mhs-s1-takk',
    namaMahasiswa: 'Moh. Fikri Haikal',
    nim: '210211100219',
    jenjang: 'S1',
    jenisUjian: 'Sidang Diseminasi TAKK',
    pengujiNip: '197703032003121002',
    namaPenguji: 'Dr. Faidal, S.E., M.M.',
    kategori: 'Portofolio / Legalitas',
    bab: 'BAB II — Portofolio Bisnis',
    halaman: 'Halaman 22',
    catatanKoreksi: 'Lampirkan scan Surat Keputusan Rektor / Sertifikat Juara 1 KIBM Kemdikbudristek dengan cap basah pada lampiran B.',
    tanggapanMahasiswa: 'Sertifikat resmi KIBM bertanda tangan Direktur Belmawa Kemdikbudristek telah dilampirkan pada Lampiran B.1.',
    statusVerifikasi: 'Telah Disetujui Penguji',
    fileBuktiRevisi: 'Sertifikat_Juara1_KIBM_Fikri.pdf',
    tanggal: '08 Oktober 2026'
  }
];
