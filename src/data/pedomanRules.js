// Sumber Kebenaran Tunggal:
// Buku Pedoman Tugas Akhir — Program Studi Diploma, Sarjana, Magister dan Doktor
// Jurusan Manajemen FEB Universitas Trunojoyo Madura — 2026

export const PROGRAM_STUDI_INFO = {
  D3: {
    jenjang: 'Diploma (D-III)',
    namaProdi: 'D-III Entrepreneurship',
    istilahTA: 'Laporan Tugas Akhir',
    istilahDosen: 'Dosen Pembimbing',
    istilahPenguji: 'Dewan Penguji Tugas Akhir',
    ketentuanTAKK: true,
    toeflMin: 400,
    ipkMin: 2.00,
    sksMin: 'Lulus seluruh matakuliah yang ditentukan',
    turnitinSimilarityMax: 30,
    turnitinAiMax: 40,
    kelulusanMinNilai: 'C',
    revisiBatasWaktu: '3 bulan',
    alokasiWaktuUjian: '90 menit',
    pengujiCount: 3,
    tahapan: [
      { id: 'tahap-1', nama: 'Penyusunan Tugas Akhir', deskripsi: 'Penyusunan draft laporan tugas akhir bersama dosen pembimbing' },
      { id: 'tahap-2', nama: 'Bimbingan Tugas Akhir', deskripsi: 'Proses bimbingan berkala dan pencatatan log book konsultasi' },
      { id: 'tahap-3', nama: 'Sidang Tugas Akhir', deskripsi: 'Ujian lisan tugas akhir dihadapan 3 orang penguji (alokasi 90 menit)' },
      { id: 'tahap-4', nama: 'Revisi', deskripsi: 'Penyelesaian perbaikan berdasarkan catatan dewan penguji (maks 3 bulan)' },
      { id: 'tahap-5', nama: 'Pengesahan', deskripsi: 'Penandatanganan lembar pengesahan naskah final tugas akhir' }
    ],
    sistematika: [
      { no: 'BAB I', judul: 'Pendahuluan', sub: ['Latar Belakang', 'Rumusan Masalah', 'Tujuan Penelitian', 'Manfaat Penelitian'] },
      { no: 'BAB II', judul: 'Kajian Pustaka', sub: ['Landasan Teori (maks 10 tahun terakhir)', 'Penelitian Terdahulu'] },
      { no: 'BAB III', judul: 'Metode Penelitian', sub: ['Langkah Penyelesaian Masalah', 'Metode Pengambilan Data', 'Analisis Hasil'] },
      { no: 'BAB IV', judul: 'Hasil Penelitian & Pembahasan', sub: ['Deskripsi Objek', 'Hasil Pengujian', 'Pembahasan Solusi'] },
      { no: 'BAB V', judul: 'Kesimpulan dan Saran', sub: ['Kesimpulan', 'Saran Aplikatif'] },
      { no: 'AKHIR', judul: 'Daftar Pustaka & Lampiran', sub: ['Daftar Pustaka (min 5 buku & artikel)', 'Lampiran Pendukung'] }
    ]
  },
  S1: {
    jenjang: 'Sarjana (S-1)',
    namaProdi: 'S-1 Manajemen',
    istilahTA: 'Skripsi',
    istilahDosen: 'Dosen Pembimbing',
    istilahPenguji: 'Dewan Penguji Skripsi',
    ketentuanTAKK: true,
    toeflMin: 450,
    ipkMin: 2.00,
    sksMin: 'Lulus seluruh matakuliah yang ditentukan (D/D+ maks 2 MK, tanpa E)',
    turnitinSimilarityMax: 30,
    turnitinAiMax: 40,
    kelulusanMinNilai: 'C',
    revisiBatasWaktu: '3 bulan',
    alokasiWaktuUjian: '90 menit',
    pengujiCount: 3,
    tahapan: [
      { id: 'tahap-1', nama: 'Proposal Tugas Akhir', deskripsi: 'Penyusunan naskah proposal mencakup BAB I sampai BAB III laporan' },
      { id: 'tahap-2', nama: 'Seminar Proposal', deskripsi: 'Ujian seminar proposal dihadiri 3 orang penguji (Ketua/Pembimbing + 2 Penguji)' },
      { id: 'tahap-3', nama: 'Penelitian', deskripsi: 'Pelaksanaan penelitian lapangan/data setelah revisi proposal disahkan Koorprodi' },
      { id: 'tahap-4', nama: 'Bimbingan', deskripsi: 'Konsultasi berkala naskah skripsi lengkap bersama Dosen Pembimbing' },
      { id: 'tahap-5', nama: 'Sidang', deskripsi: 'Ujian lisan skripsi dihadapan Dewan Penguji (alokasi 90 menit)' },
      { id: 'tahap-6', nama: 'Revisi', deskripsi: 'Penyelesaian perbaikan naskah berdasar masukan dewan penguji (maks 3 bulan)' },
      { id: 'tahap-7', nama: 'Pengesahan', deskripsi: 'Pengesahan naskah final skripsi dan penyerahan berkas yudisium' }
    ],
    sistematika: [
      { no: 'Bagian Awal', judul: 'Kelengkapan Awal', sub: ['Halaman Sampul', 'Halaman Judul', 'Halaman Persetujuan', 'Halaman Pengesahan', 'Halaman Pernyataan Orisinalitas', 'Abstrak (Bahasa Indonesia)', 'Abstract (English)', 'Kata Pengantar', 'Daftar Isi, Tabel, Lampiran, Istilah'] },
      { no: 'BAB I', judul: 'Pendahuluan', sub: ['Latar Belakang', 'Rumusan Masalah', 'Tujuan Penelitian', 'Manfaat Penelitian'] },
      { no: 'BAB II', judul: 'Tinjauan Pustaka', sub: ['Landasan Teori', 'Penelitian Terdahulu', 'Kerangka Pemikiran Konseptual', 'Hipotesis Penelitian'] },
      { no: 'BAB III', judul: 'Metode Penelitian', sub: ['Jenis Penelitian', 'Populasi dan Sampel', 'Definisi Operasional Variabel', 'Teknik Pengumpulan Data', 'Teknik Analisis Data'] },
      { no: 'BAB IV', judul: 'Hasil Penelitian & Pembahasan', sub: ['Gambaran Umum Objek', 'Deskripsi Data', 'Hasil Pengujian Hipotesis/Analisis', 'Pembahasan Hasil Penelitian'] },
      { no: 'BAB V', judul: 'Kesimpulan dan Saran', sub: ['Kesimpulan', 'Keterbatasan Penelitian', 'Saran Manajerial & Akademik'] },
      { no: 'Bagian Akhir', judul: 'Referensi & Lampiran', sub: ['Daftar Pustaka (APA Style, Mendeley)', 'Kuesioner/Output Data/Dokumentasi'] }
    ]
  },
  S2: {
    jenjang: 'Magister (S-2)',
    namaProdi: 'S-2 Magister Manajemen',
    istilahTA: 'Tesis',
    istilahDosen: 'Dosen Pembimbing I & II',
    istilahPenguji: 'Dewan Penguji Tesis',
    ketentuanTAKK: false,
    toeflMin: 475,
    ipkMin: 3.00,
    sksMin: 'Minimal 36 SKS dengan IPK >= 3,00',
    turnitinSimilarityMax: 20,
    turnitinAiMax: 30,
    kelulusanMinNilai: 'B',
    revisiBatasWaktu: '3 bulan',
    alokasiWaktuUjian: '90 - 120 menit',
    pengujiCount: 4,
    tahapan: [
      { id: 'tahap-1', nama: 'Proposal Tesis', deskripsi: 'Penyusunan naskah proposal tesis dan pemenuhan transkrip 36 SKS IPK >= 3,00' },
      { id: 'tahap-2', nama: 'Seminar Proposal', deskripsi: 'Ujian proposal dihadapan 4 penguji (Pembimbing I, Pembimbing II/Ketua, 2 Penguji)' },
      { id: 'tahap-3', nama: 'Penelitian', deskripsi: 'Pelaksanaan penelitian tesis setelah lembar revisi proposal disahkan Koorprodi' },
      { id: 'tahap-4', nama: 'Bimbingan', deskripsi: 'Bimbingan intensif laporan tesis bersama Pembimbing I dan Pembimbing II' },
      { id: 'tahap-5', nama: 'Seminar Hasil', deskripsi: 'Pemaparan hasil penelitian tesis dan instrumen lapangan sebelum sidang' },
      { id: 'tahap-6', nama: 'Sidang Tesis', deskripsi: 'Ujian tesis dihadapan 4 orang tim penguji (draft 5 rangkap disetujui kedua pembimbing & Koorprodi)' },
      { id: 'tahap-7', nama: 'Revisi', deskripsi: 'Penyelesaian revisi sesuai berita acara ujian tesis (maksimal 3 bulan)' },
      { id: 'tahap-8', nama: 'Pengesahan', deskripsi: 'Pengesahan tesis final dan pengurusan persyaratan yudisium kelulusan' }
    ],
    sistematika: [
      { no: 'BAB I', judul: 'Pendahuluan', sub: ['Latar Belakang', 'Rumusan Masalah', 'Tujuan Penelitian', 'Manfaat Penelitian'] },
      { no: 'BAB II', judul: 'Tinjauan Pustaka', sub: ['Grand Theory & Middle Theory', 'Sintesis Penelitian Terdahulu', 'Kerangka Pemikiran', 'Pengembangan Hipotesis'] },
      { no: 'BAB III', judul: 'Metode Penelitian', sub: ['Rancangan Penelitian', 'Operasionalisasi Variabel', 'Metode Sampling', 'Pengukuran & Validitas', 'Analisis Multivariat'] },
      { no: 'BAB IV', judul: 'Hasil Penelitian & Pembahasan', sub: ['Profil Responden', 'Hasil Evaluasi Model Pengukuran & Struktural', 'Diskusi Temuan Teoretis'] },
      { no: 'BAB V', judul: 'Kesimpulan, Saran dan Implikasi', sub: ['Kesimpulan', 'Implikasi Teoretis', 'Implikasi Manajerial/Praktis', 'Keterbatasan & Agenda Mendatang'] },
      { no: 'AKHIR', judul: 'Daftar Pustaka & Lampiran', sub: ['Daftar Pustaka (min 20 intl & 10 nas, min 5 sitasi dosen UTM)', 'Lampiran Berkas & Data'] }
    ]
  },
  S3: {
    jenjang: 'Doktor (S-3)',
    namaProdi: 'S-3 Ilmu Manajemen',
    istilahTA: 'Disertasi',
    istilahDosen: 'Promotor & Kopromotor',
    istilahPenguji: 'Dewan Penguji Disertasi',
    ketentuanTAKK: false,
    toeflMin: 500,
    ipkMin: 3.00,
    sksMin: 'Lulus seluruh matakuliah, maksimal satu nilai B+, IPK >= 3,00',
    turnitinSimilarityMax: 20,
    turnitinAiMax: 30,
    kelulusanMinNilai: 'NA >= 70',
    revisiBatasWaktu: '6 bulan (Ujian Tertutup)',
    alokasiWaktuUjian: '120 - 150 menit',
    pengujiCount: 7,
    tahapan: [
      {
        id: 'tahap-1',
        nama: 'Ujian Kualifikasi',
        deskripsi: 'Ujian Kualifikasi / Internasional Kolokium (Dewan Penguji: 3 orang — Promotor memimpin, Kopromotor, 1 penguji ahli). Topik disetujui KPS & calon Promotor.',
        pengujiCount: 3
      },
      {
        id: 'tahap-2',
        nama: 'Ujian Proposal',
        deskripsi: 'Ujian Proposal Disertasi (Dewan Penguji: 4 orang — Promotor ketua, Kopromotor, 2 dosen ahli). Draft revisi kualifikasi 5 rangkap, plagiasi <= 20%.',
        pengujiCount: 4
      },
      {
        id: 'tahap-3',
        nama: 'Seminar Hasil',
        deskripsi: 'Penyajian hasil analisis data penelitian yang terbuka untuk umum. Draft disetujui Promotor & Kopromotor, instrumen dan data lengkap disiapkan.',
        pengujiCount: 4
      },
      {
        id: 'tahap-4',
        nama: 'Ujian Kelayakan',
        deskripsi: 'Penilaian naskah melalui penelaahan dokumen (desk review) oleh Dewan Pertimbangan Akademik dan para pembimbing. Dinyatakan layak jika sekurang-kurangnya 2 dari 3 penguji menyatakan layak dan NA >= 70.',
        pengujiCount: 3,
        isDeskReview: true,
        kategoriHasil: ['Layak Revisi Minor', 'Layak Revisi Mayor', 'Tidak Layak']
      },
      {
        id: 'tahap-5',
        nama: 'Ujian Tertutup',
        deskripsi: 'Ujian Disertasi tertutup (Dewan Penguji: 7 orang — 1 Pemimpin Sidang, 2 Pembimbing/Promotor/Kopromotor, 3 Penguji Dosen UTM, 1 Penguji Luar Institusi). Syarat: TOEFL 500, IPK >= 3.00, Plagiasi <= 20%, LoA/Accepted Jurnal Bereputasi min Q4 Scopus/WoS.',
        pengujiCount: 7,
        syaratLulus: 'NA >= 70'
      },
      {
        id: 'tahap-6',
        nama: 'Ujian Terbuka',
        deskripsi: 'Promosi Doktor (Dewan Penguji: 7 orang). Pengajuan setelah revisi tertutup: jeda min 1 bulan jika minor, min 3 bulan jika mayor. Dapat dibebaskan jika memiliki 2 artikel Scopus bereputasi (penilaian DPA min N=80 & NA >= 80).',
        pengujiCount: 7,
        syaratLulus: 'NA >= 70'
      }
    ],
    sistematika: [
      { no: 'BAB I', judul: 'Pendahuluan', sub: ['Latar Belakang & Gap Fenomena/Teori', 'Rumusan Masalah Penelitian', 'Tujuan Penelitian', 'Manfaat Teoretis & Praktis', 'Kebaruan Penelitian (Novelty)'] },
      { no: 'BAB II', judul: 'Kajian Pustaka, Kerangka Pemikiran dan Hipotesis', sub: ['State of the Art Literatur', 'Grand Theory & Pemetaan Paradigma', 'Kerangka Pemikiran Konseptual', 'Penalaran Hipotesis / Proposisi'] },
      { no: 'BAB III', judul: 'Metode Penelitian', sub: ['Filosofi & Desain Penelitian', 'Populasi, Sampel, & Sampling', 'Operasionalisasi Konsep & Variabel', 'Prosedur Pengumpulan Data', 'Teknik Analisis & Uji Robustness'] },
      { no: 'BAB IV', judul: 'Hasil Penelitian & Pembahasan', sub: ['Gambaran Komprehensif Data', 'Pengujian Model Empiris', 'Konfirmasi Hipotesis', 'Sintesis Kebaruan (Novelty) & Diskusi Epistemologis'] },
      { no: 'BAB V', judul: 'Kesimpulan, & Saran', sub: ['Kesimpulan Utama', 'Kontribusi pada Pengembangan Ilmu', 'Implikasi Kebijakan & Manajerial', 'Keterbatasan & Arah Riset Masa Depan'] },
      { no: 'AKHIR', judul: 'Daftar Pustaka & Lampiran', sub: ['Daftar Pustaka (min 20 intl & 10 nas, min 5 sitasi dosen UTM)', 'Validasi Instrumen & Data Mentah', 'Surat Keterangan Bebas Plagiasi <= 20%'] }
    ]
  }
};

// Ketentuan Skema TAKK (Tugas Akhir Kontributif-Kreatif) - Halaman 13-15 Buku Pedoman
export const TAKK_RULES = {
  definisi: 'Bentuk tugas akhir yang berfokus pada penciptaan karya, inovasi, atau pencapaian yang memiliki kontribusi nyata bagi masyarakat, industri, maupun dunia profesi.',
  skema1: {
    nama: 'Konversi Langsung',
    syarat: [
      'Mempublikasikan artikel ilmiah pada jurnal nasional terakreditasi minimal SINTA 2, prosiding internasional bereputasi Scopus, jurnal internasional bereputasi (Scopus) minimal Q4 atau Web of Science (WoS) sebagai penulis pertama; ATAU',
      'Memperoleh prestasi juara dalam lomba bereputasi tingkat nasional atau internasional sesuai ketentuan Lampiran 1.'
    ],
    ketentuan: [
      'Penetapan kelayakan ditetapkan melalui Surat Keputusan (SK) Dekan berdasar hasil verifikasi dokumen dan capaian yang diajukan.',
      'Mahasiswa yang telah ditetapkan memenuhi ketentuan konversi langsung TIDAK DIWAJIBKAN mengikuti ujian Tugas Akhir atau Skripsi maupun melakukan publikasi tambahan.',
      'Cukup melakukan diseminasi yang diatur oleh Koordinator Program Studi (Koorprodi).'
    ]
  },
  skema2: {
    nama: 'Konversi Tidak Langsung (Portofolio)',
    syarat: [
      'Akumulasi capaian akademik mahasiswa meliputi prestasi, publikasi ilmiah, dan/atau bentuk Tugas Akhir lainnya selama masa studi yang direpresentasikan dalam bentuk poin (Lampiran 2).',
      'Portofolio dinyatakan LAYAK sebagai pengganti Tugas Akhir apabila memperoleh Nilai Akhir (NA) paling rendah sebesar 70.'
    ],
    kewajibanPublikasi: [
      { nilaiMin: 70, targetPublikasi: 'Jurnal nasional terakreditasi minimal SINTA 5' },
      { nilaiMin: 80, targetPublikasi: 'Jurnal nasional terakreditasi minimal SINTA 6' },
      { nilaiMin: 90, targetPublikasi: 'Jurnal nasional minimal non-SINTA' }
    ],
    konversiNilai: 'Apabila kriteria NA >= 70 dan kewajiban publikasi terpenuhi, capaian dikonversi menjadi Tugas Akhir dengan Nilai A.'
  }
};

// ============================================================================
// SKEMA TAKK — Sumber Tunggal Label, Ambang Poin, Tahapan, & Kewajiban Luaran
// ============================================================================

// Label resmi TAKK (Buku Pedoman 2026 Bab II).
export const TAKK_NAMA_PANJANG = 'Tugas Akhir Kontributif-Kreatif';
export const TAKK_SINGKATAN = 'TAKK';

// Ambang batas poin portofolio skema TAKK (Buku Pedoman 2026 Bab IV Halaman 13-15).
export const TAKK_AMBANG = {
  minLayak: 70,
  minNilaiA: 80,
  maksPoin: 100
};

/**
 * Istilah Tugas Akhir yang sadar-skema.
 * Mahasiswa skema TAKK TIDAK menempuh "Skripsi", sehingga label TAKK dipakai
 * menggantikan istilahTA bawaan program studi (mis. "Skripsi" untuk S1).
 */
export function getIstilahTA(student, prodiInfo) {
  if (student?.jenisTA === 'TAKK') return TAKK_SINGKATAN;
  return prodiInfo?.istilahTA || 'Tugas Akhir';
}

// Tahapan resmi skema TAKK (menggantikan tahapan TAKT pada kurikulum S1/D3).
export const TAKK_TAHAPAN = [
  { id: 'tahap-1', nama: 'Pengajuan Skema TAKK & Unggah Portofolio', deskripsi: 'Pengajuan jalur TAKK dan pengunggahan berkas portofolio prestasi mandiri melalui menu Portofolio.' },
  { id: 'tahap-2', nama: 'Bimbingan Laporan TAKK', deskripsi: 'Konsultasi berkala laporan portofolio/karya terapan bersama Dosen Pembimbing.' },
  { id: 'tahap-3', nama: 'Pemeriksaan Turnitin TAKK', deskripsi: 'Uji orisinalitas laporan portofolio dan validasi bukti prestasi mandiri oleh tim pembimbing.' },
  { id: 'tahap-4', nama: 'Verifikasi Berkas Sidang TAKK', deskripsi: 'Verifikasi kelengkapan berkas sidang/diseminasi TAKK oleh Admin Akademik.' },
  { id: 'tahap-5', nama: 'Sidang Diseminasi TAKK', deskripsi: 'Ujian sidang/diseminasi portofolio di hadapan dewan penguji (alokasi 90 menit).' },
  { id: 'tahap-6', nama: 'Revisi & Pengesahan Laporan TAKK', deskripsi: 'Perbaikan laporan dan pengesahan naskah final portofolio TAKK.' }
];

// Daftar tahapan yang dipakai UI sesuai skema mahasiswa.
export function getTahapanSkema(student, prodiInfo) {
  if (student?.jenisTA === 'TAKK') return TAKK_TAHAPAN;
  return prodiInfo?.tahapan || [];
}

/**
 * Kewajiban publikasi pendukung TAKK berdasarkan capaian poin portofolio.
 * Mengacu TAKK_RULES.skema2.kewajibanPublikasi (70 -> SINTA 5, 80 -> SINTA 6, 90 -> non-SINTA).
 */
export function getKewajibanPublikasiTAKK(poin = 0) {
  const tiers = [...(TAKK_RULES.skema2.kewajibanPublikasi || [])].sort((a, b) => b.nilaiMin - a.nilaiMin);
  const tier = tiers.find(t => Number(poin) >= t.nilaiMin);
  return tier ? tier.targetPublikasi : 'Belum memenuhi ambang publikasi (min. NA 70)';
}

// Ketentuan Turnitin & AI Content Detection (Halaman 58 Buku Pedoman)
export const TURNITIN_RULES = {
  dasarHukum: 'Peraturan Rektor Universitas Trunojoyo Madura Nomor 46 Tahun 2025',
  ketentuan: {
    diplomaSarjana: {
      similarityMax: 30,
      aiDetectionMax: 40,
      keterangan: 'Perhitungan tidak mencakup daftar pustaka dan lampiran'
    },
    pascasarjana: {
      similarityMax: 20,
      aiDetectionMax: 30,
      keterangan: 'Perhitungan tidak mencakup daftar pustaka dan lampiran'
    }
  },
  dokumenResmi: 'Surat Keterangan Pemeriksaan Plagiasi (Lampiran 10) ditandatangani Dosen Pembimbing/Promotor dan disahkan Koorprodi'
};

// Komposisi Dewan Penguji Resmi (Halaman 68-71 Buku Pedoman)
export const KOMPOSISI_PENGUJI = {
  D3_S1_SEMPRO: [
    { peran: 'Ketua Penguji', keterangan: 'Dosen Pembimbing' },
    { peran: 'Anggota Penguji I', keterangan: 'Penguji Utama (Bukan Dosen Pembimbing)' },
    { peran: 'Anggota Penguji II', keterangan: 'Anggota Penguji (Bukan Dosen Pembimbing)' }
  ],
  D3_S1_SIDANG: [
    { peran: 'Ketua Penguji', keterangan: 'Dosen Pembimbing' },
    { peran: 'Anggota Penguji I', keterangan: 'Penguji Utama (Bukan Dosen Pembimbing)' },
    { peran: 'Anggota Penguji II', keterangan: 'Anggota Penguji (Bukan Dosen Pembimbing)' }
  ],
  S2_PROPOSAL: [
    { peran: 'Ketua Penguji', keterangan: 'Dosen Pembimbing II' },
    { peran: 'Anggota Penguji I', keterangan: 'Dosen Pembimbing I' },
    { peran: 'Anggota Penguji II', keterangan: 'Bukan Dosen Pembimbing (Keahlian Relevan)' },
    { peran: 'Anggota Penguji III', keterangan: 'Bukan Dosen Pembimbing (Keahlian Relevan)' }
  ],
  S2_TESIS: [
    { peran: 'Pembimbing I', keterangan: 'Dosen Pembimbing I' },
    { peran: 'Pembimbing II', keterangan: 'Dosen Pembimbing II (Pemimpin Sidang)' },
    { peran: 'Penguji I', keterangan: 'Dua penguji yang memiliki keahlian relevan' },
    { peran: 'Penguji II', keterangan: 'Dua penguji yang memiliki keahlian relevan' }
  ],
  S3_KUALIFIKASI: [
    { peran: 'Pemimpin Sidang', keterangan: 'Pembimbing I / Promotor' },
    { peran: 'Anggota Penguji', keterangan: 'Pembimbing II / Kopromotor' },
    { peran: 'Anggota Penguji', keterangan: 'Satu penguji yang memiliki keahlian relevan' }
  ],
  S3_PROPOSAL: [
    { peran: 'Ketua Penguji', keterangan: 'Promotor / Koorprodi' },
    { peran: 'Anggota Penguji I', keterangan: 'Kopromotor' },
    { peran: 'Anggota Penguji II', keterangan: 'Dosen yang memiliki keahlian sebidang' },
    { peran: 'Anggota Penguji III', keterangan: 'Dosen yang memiliki keahlian sebidang' }
  ],
  S3_KELAYAKAN: [
    { peran: 'Penilai I', keterangan: 'Dewan Pertimbangan Akademik (DPA)' },
    { peran: 'Penilai II', keterangan: 'Dewan Pertimbangan Akademik (DPA)' },
    { peran: 'Penilai III', keterangan: 'Pembimbing / Promotor' }
  ],
  S3_TERTUTUP: [
    { peran: 'Pemimpin Sidang', keterangan: 'Satu Pemimpin Sidang' },
    { peran: 'Promotor', keterangan: 'Pembimbing I' },
    { peran: 'Kopromotor', keterangan: 'Pembimbing II' },
    { peran: 'Penguji Internal 1', keterangan: 'Dosen UTM berkeahlian relevan topik' },
    { peran: 'Penguji Internal 2', keterangan: 'Dosen UTM berkeahlian relevan topik' },
    { peran: 'Penguji Internal 3', keterangan: 'Dosen UTM berkeahlian relevan topik' },
    { peran: 'Penguji Eksternal', keterangan: 'Penguji berasal dari luar UTM berkeahlian relevan topik' }
  ],
  S3_TERBUKA: [
    { peran: 'Ketua Sidang / Penguji', keterangan: 'Pimpinan Sidang Terbuka' },
    { peran: 'Sekretaris Sidang / Penguji', keterangan: 'Sekretaris Sidang Terbuka' },
    { peran: 'Anggota Penguji I', keterangan: 'Penguji Eksternal dari Luar Institusi' },
    { peran: 'Anggota Penguji II', keterangan: 'Penguji Eksternal / Internal' },
    { peran: 'Anggota Penguji III', keterangan: 'Penguji Internal / Promotor' },
    { peran: 'Anggota Penguji IV', keterangan: 'Penguji Internal' },
    { peran: 'Anggota Penguji V', keterangan: 'Penguji Internal' }
  ]
};

// Rubrik dan Aspek Penilaian Resmi (Halaman 74-78 Buku Pedoman)
export const RUBRIK_PENILAIAN = {
  D3_S1: [
    { id: 'tata_tulis', aspek: 'Tata Tulis dan Format Ilmiah', bobot: 20, max: 100, deskripsi: 'Kesesuaian dengan pedoman penulisan, kerapian, tata bahasa baku, konsistensi sitasi Mendeley' },
    { id: 'metodologi', aspek: 'Metodologi Penelitian', bobot: 30, max: 100, deskripsi: 'Ketepatan desain penelitian, teknik sampling, instrumen, validitas dan reliabilitas, prosedur analisis data' },
    { id: 'substansi', aspek: 'Substansi dan Kedalaman Pembahasan', bobot: 35, max: 100, deskripsi: 'Orisinalitas, ketercapaian tujuan, kekuatan argumentasi teoritis, ketajaman pembahasan hasil penelitian' },
    { id: 'presentasi', aspek: 'Kemampuan Menyampaikan & Mempertahankan Hasil', bobot: 15, max: 100, deskripsi: 'Penguasaan materi saat tanya jawab, ketepatan menjawab sanggahan penguji, etika akademik' }
  ],
  S2: [
    { id: 'tata_tulis', aspek: 'Tata Tulis & Kaidah Publikasi', bobot: 15, max: 100, deskripsi: 'Standar penulisan tesis magister, integrasi sitasi minimal 20 jurnal internasional dan 10 nasional' },
    { id: 'metodologi', aspek: 'Metodologi Penelitian Multivariat/Kualitatif Mendalam', bobot: 30, max: 100, deskripsi: 'Rancangan analisis lanjutan, kesesuaian teknik estimasi data, ketepatan interpretasi model' },
    { id: 'substansi', aspek: 'Substansi, Novelty & Implikasi Manajerial', bobot: 40, max: 100, deskripsi: 'Sintesis teori, kedalaman temuan empiris, kontribusi implikasi praktis dan teoretis' },
    { id: 'presentasi', aspek: 'Kemampuan Presentasi & Pertahanan Tesis', bobot: 15, max: 100, deskripsi: 'Penguasaan komprehensif atas bidang kajian manajemen, respon terhadap masukan kritis' }
  ],
  S3_KELAYAKAN: [
    { id: 'orisinalitas', aspek: 'Orisinalitas & Kebaruan Penelitian (Novelty)', bobot: 35, max: 100, deskripsi: 'Kekuatan proposisi/hipotesis serta nilai kebaruan ilmiah bagi literatur manajemen' },
    { id: 'rigor_metodologi', aspek: 'Rigoritas Metodologi & Desain Riset Disertasi', bobot: 35, max: 100, deskripsi: 'Keabsahan instrumen riset, ketepatan uji empiris, robustness check' },
    { id: 'kelayakan_naskah', aspek: 'Kelayakan Tata Tulis, Publikasi Q4 & Turnitin <= 20%', bobot: 30, max: 100, deskripsi: 'Kelengkapan draf 7 rangkap, bukti uji plagiasi Turnitin, LoA/Accepted Scopus/WoS' }
  ],
  S3_TERTUTUP: [
    { id: 'substansi_novelty', aspek: 'Substansi, Kebaruan Ilmiah (Novelty) & Filsafat Ilmu', bobot: 40, max: 100, deskripsi: 'Kedalaman sintesis filosofis, kontribusi epistemologis bagi rumpun keilmuan manajemen' },
    { id: 'metodologi_analisis', aspek: 'Rigor Metodologi & Ketepatan Analisis Empiris Disertasi', bobot: 30, max: 100, deskripsi: 'Validitas konstruk, kecukupan data, reliabilitas model struktural dan ketepatan estimasi' },
    { id: 'pertahanan_akademik', aspek: 'Kemampuan Menyampaikan & Mempertahankan Disertasi', bobot: 20, max: 100, deskripsi: 'Argumentasi logis dan kematangan intelektual dalam menjawab 7 orang dewan penguji' },
    { id: 'publikasi_validasi', aspek: 'Validasi Publikasi Internasional Bereputasi (Q4 Scopus/WoS)', bobot: 10, max: 100, deskripsi: 'Afiliasi UTM, mahasiswa penulis pertama, linearitas topik, status non-discontinued' }
  ],
  S3_TERBUKA: [
    { id: 'penguasaan_substansi', aspek: 'Penguasaan Substansi Disertasi', bobot: 35, max: 100, deskripsi: 'Pemahaman utuh promovendus atas seluruh kerangka kerja dan temuan penelitian disertasi' },
    { id: 'wawasan_implementasi', aspek: 'Wawasan Implementasi Hasil Tugas Akhir', bobot: 25, max: 100, deskripsi: 'Dampak strategis dan aplikasi luas bagi dunia industri, kebijakan publik, dan masyarakat' },
    { id: 'kemampuan_promosi', aspek: 'Kemampuan Mempromosikan Hasil Penelitian', bobot: 25, max: 100, deskripsi: 'Kecakapan memaparkan diseminasi temuan di hadapan publik dan civitas akademika' },
    { id: 'pertahanan_hasil', aspek: 'Kemampuan Mempertahankan Hasil Tugas Akhir', bobot: 15, max: 100, deskripsi: 'Ketenangan dan ketegasan berargumentasi secara ilmiah' }
  ]
};

// Konversi Nilai Huruf UTM
export const KONVERSI_NILAI_UTM = (nilaiAngka) => {
  if (nilaiAngka >= 80) return { huruf: 'A', bobot: 4.00, predikat: 'Sangat Baik (Lulus)' };
  if (nilaiAngka >= 75) return { huruf: 'B+', bobot: 3.50, predikat: 'Lebih dari Baik (Lulus)' };
  if (nilaiAngka >= 70) return { huruf: 'B', bobot: 3.00, predikat: 'Baik (Lulus)' };
  if (nilaiAngka >= 65) return { huruf: 'C+', bobot: 2.50, predikat: 'Lebih dari Cukup (Lulus D3/S1)' };
  if (nilaiAngka >= 56) return { huruf: 'C', bobot: 2.00, predikat: 'Cukup (Batas Minimal Kelulusan D3/S1)' };
  if (nilaiAngka >= 45) return { huruf: 'D', bobot: 1.00, predikat: 'Kurang (Tidak Lulus - Ujian Ulang)' };
  return { huruf: 'E', bobot: 0.00, predikat: 'Gagal (Tidak Lulus)' };
};
