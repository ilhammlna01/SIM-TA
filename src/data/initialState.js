// Initial State & Realistic Academic Mock Data for SIM Tugas Akhir FEB UTM
import { DOSEN_FEB_UTM } from './dosenData.js';
import { PROGRAM_STUDI_INFO, TAKK_RULES, TURNITIN_RULES, KOMPOSISI_PENGUJI, RUBRIK_PENILAIAN } from './pedomanRules.js';
import { SAMPLE_SCAN_KARTU_BIMBINGAN } from '../utils/bimbinganScanSample.js';

import { ALL_50_STUDENTS } from './all50StudentsData.js';

export const INITIAL_STUDENTS = ALL_50_STUDENTS;

// Data Riwayat Bimbingan Terstruktur (Mendukung Moda Daring & Tatap Muka Luring)
export const INITIAL_BIMBINGAN = [
  {
    id: 'bim-1',
    mhsId: 'mhs-s3',
    nim: '220231600004',
    dosenNama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    dosenNip: '196306231989031002',
    peranDosen: 'Promotor',
    tanggal: '22 September 2026',
    moda: 'Luring',
    lokasi: 'Ruang Sidang Graha Pascasarjana Lt. 3',
    topik: 'Pembahasan Masukan Ujian Kelayakan dan Perbaikan Matriks Hipotesis',
    hasil: 'Promotor menyetujui arah perbaikan pengaitan dynamic capabilities dengan kearifan lokal. Lanjutkan ke penyempurnaan BAB IV.',
    catatan: 'Perhatikan batas revisi kelayakan minor sebelum mengajukan Ujian Tertutup.',
    dokumen: 'Draf_Revisi_Kelayakan_Bab4.pdf',
    buktiScan: 'Scan_Kartu_Bimbingan_Bambang_Sesi1.jpg',
    buktiScanUrl: SAMPLE_SCAN_KARTU_BIMBINGAN,
    status: 'Disetujui'
  },
  {
    id: 'bim-2',
    mhsId: 'mhs-s3',
    nim: '220231600004',
    dosenNama: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    dosenNip: '196201081987032001',
    peranDosen: 'Kopromotor',
    tanggal: '15 September 2026',
    moda: 'Daring',
    lokasi: 'Daring via SIM-TA FEB UTM',
    topik: 'Pemeriksaan Hasil Olah Data PLS-SEM dan Robustness Check',
    hasil: 'Uji mediasi inovasi digital telah valid. Dosen menyarankan penambahan uji heterogenitas sampel.',
    catatan: 'Hasil telah memenuhi standar kelayakan metodologis disertasi.',
    dokumen: 'Output_SmartPLS4_Robustness.pdf',
    status: 'Disetujui'
  },
  {
    id: 'bim-3',
    mhsId: 'mhs-s1-takt',
    nim: '210211100142',
    dosenNama: 'Dra. Hj. S. Anugrahini Irawati, M.M.',
    dosenNip: '196203031988032001',
    peranDosen: 'Dosen Pembimbing',
    tanggal: '28 September 2026',
    moda: 'Luring',
    lokasi: 'Ruang Dosen Jurusan Manajemen FEB Lantai 2',
    topik: 'Finalisasi Naskah Proposal Skripsi BAB I sampai BAB III',
    hasil: 'Penyelarasan rumusan masalah dengan hipotesis di BAB II telah selesai. Dosen menyetujui naskah untuk diajukan ke Seminar Proposal.',
    catatan: 'Siapkan slide presentasi 15 menit dengan fokus pada novelty gap fenomena batik Madura.',
    dokumen: 'Proposal_Skripsi_Final_Sempro.pdf',
    buktiScan: 'Scan_Kartu_Bimbingan_Sempro_Dinda.jpg',
    buktiScanUrl: SAMPLE_SCAN_KARTU_BIMBINGAN,
    status: 'Disetujui'
  },
  {
    id: 'bim-4',
    mhsId: 'mhs-s2',
    nim: '230221600018',
    dosenNama: 'Dr. H. Slamet Subari, S.E., M.Si.',
    dosenNip: '196504121991031003',
    peranDosen: 'Pembimbing I',
    tanggal: '20 September 2026',
    moda: 'Luring',
    lokasi: 'Ruang Dosen Pascasarjana FEB',
    topik: 'Review Draf Lengkap Tesis dan Kelengkapan 20 Jurnal Internasional',
    hasil: 'Dosen menyetujui draf tesis 5 rangkap untuk diajukan ke Sidang Tesis. Publikasi SINTA 2 telah terverifikasi.',
    catatan: 'Pastikan transkrip 38 SKS dan TOEFL 510 terlampir dalam map pengajuan.',
    dokumen: 'Draf_Lengkap_Tesis_Magister.pdf',
    buktiScan: 'Scan_Kartu_Bimbingan_Rahmat.jpg',
    buktiScanUrl: SAMPLE_SCAN_KARTU_BIMBINGAN,
    status: 'Disetujui'
  },
  {
    id: 'bim-5',
    mhsId: 'mhs-s1-takt',
    nim: '210211100142',
    dosenNama: 'Dra. Hj. S. Anugrahini Irawati, M.M.',
    dosenNip: '196203031988032001',
    peranDosen: 'Dosen Pembimbing',
    tanggal: '05 Oktober 2026',
    moda: 'Luring',
    lokasi: 'Ruang Dosen Jurusan Manajemen FEB Lantai 2',
    topik: 'Konsultasi Luring Pembahasan Bab IV Hasil Analisis & Kuesioner',
    hasil: 'Uji reliabilitas butir skala likert sudah memenuhi syarat Cronbach Alpha > 0.70. Pembimbing memberikan paraf pada lembar kendali.',
    catatan: 'Menunggu pengesahan resmi dosen pembimbing di sistem.',
    dokumen: 'Draf_Bab4_Analisis_Data.pdf',
    buktiScan: 'Scan_Lembar_Kendali_TatapMuka_Bab4.jpg',
    buktiScanUrl: SAMPLE_SCAN_KARTU_BIMBINGAN,
    status: 'Menunggu Persetujuan'
  },
  {
    id: 'bim-6',
    mhsId: 'mhs-s1-takk',
    nim: '210211100219',
    dosenNama: 'Dr. Mochammad Isa Anshori, S.E., M.Si.',
    dosenNip: '197307152005011001',
    peranDosen: 'Dosen Pembimbing',
    tanggal: '15 September 2026',
    moda: 'Luring',
    lokasi: 'Ruang Inkubator Bisnis FEB Lantai 1',
    topik: 'Konsultasi Perhitungan Poin Portofolio TAKK & Kelayakan Prestasi KIBM',
    hasil: 'Dosen pembimbing menyetujui akumulasi poin 82 dan draf laporan komprehensif karya portofolio mandiri.',
    catatan: 'Siapkan berkas pengesahan konversi nilai A untuk diajukan ke Koorprodi.',
    dokumen: 'Matriks_Poin_Portofolio_TAKK.pdf',
    status: 'Disetujui'
  },
  {
    id: 'bim-7',
    mhsId: 'mhs-d3',
    nim: '230201100055',
    dosenNama: 'Moh. Faizal, S.E., M.M.',
    dosenNip: '198509142014041001',
    peranDosen: 'Dosen Pembimbing',
    tanggal: '25 September 2026',
    moda: 'Luring',
    lokasi: 'Laboratorium Kewirausahaan Vokasi FEB',
    topik: 'Pembahasan Laporan Proyek Usaha Olahan Jamu Madura Bab I–IV',
    hasil: 'Format laporan tugas akhir vokasi telah memenuhi pedoman. Telah menyelesaikan 9 sesi bimbingan praktik lapangan.',
    catatan: 'Segera ajukan berkas pendaftaran sidang tugas akhir diploma.',
    dokumen: 'Laporan_TA_Vokasi_Siti.pdf',
    status: 'Disetujui'
  }
];

// Data Matriks Revisi Resmi Pasca Ujian (Mengikuti Pedoman)
export const INITIAL_REVISI = [
  {
    id: 'rev-1',
    mhsId: 'mhs-s3',
    nim: '220231600004',
    no: 1,
    bagian: 'BAB II Kajian Pustaka (Halaman 45-52)',
    sumberRevisi: 'Dewan Pertimbangan Akademik / Penguji',
    namaPenguji: 'Dr. Faidal, S.E., M.M.',
    catatanPenguji: 'Perluas pembahasan perbedaan substantive antara sensing capabilities dan seizing capabilities pada konteks UMKM Madura.',
    tindakLanjut: 'Telah ditambahkan 4 paragraf pada sub-bab 2.3.2 dengan merujuk Teece (2018) dan empiris lokal terkini.',
    halamanPerbaikan: 'Halaman 47-50',
    status: 'Menunggu Approval Penguji',
    fileBukti: 'Perbaikan_Bab2_Disertasi.pdf'
  },
  {
    id: 'rev-2',
    mhsId: 'mhs-s3',
    nim: '220231600004',
    no: 2,
    bagian: 'BAB III Metode Penelitian (Halaman 88)',
    sumberRevisi: 'Kopromotor',
    namaPenguji: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    catatanPenguji: 'Tabel 3.2 mengenai operasionalisasi variabel orientasi inovasi digital agar disesuaikan dengan skala Likert 5 poin yang digunakan.',
    tindakLanjut: 'Tabel 3.2 telah direvisi dan diselaraskan secara penuh dengan instrumen kuesioner final.',
    halamanPerbaikan: 'Halaman 89-91',
    status: 'Disetujui',
    fileBukti: 'Perbaikan_Bab3_TabelOperasionalisasi.pdf'
  },
  {
    id: 'rev-3',
    mhsId: 'mhs-s1-takt',
    nim: '210211100142',
    no: 1,
    bagian: 'BAB I Latar Belakang (Halaman 8)',
    sumberRevisi: 'Penguji Utama',
    namaPenguji: 'Dr. Faidal, S.E., M.M.',
    catatanPenguji: 'Lengkapi data pra-survei pembelian batik Madura di TikTok Shop tahun 2025-2026.',
    tindakLanjut: 'Telah disisipkan data pra-survei terhadap 30 responden awal pada sub-bab latar belakang.',
    halamanPerbaikan: 'Halaman 9',
    status: 'Telah Ditindaklanjuti',
    fileBukti: 'PraSurvei_Batik_TikTok.pdf'
  },
  {
    id: 'rev-4',
    mhsId: 'mhs-s2',
    nim: '230221600018',
    no: 1,
    bagian: 'BAB IV Hasil Pembahasan (Halaman 112)',
    sumberRevisi: 'Penguji Ahli I',
    namaPenguji: 'Dr. Faidal, S.E., M.M.',
    catatanPenguji: 'Pertegas interpretasi nilai mediasi komitmen afektif pada perbankan syariah Madura.',
    tindakLanjut: 'Telah ditambahkan penjelasan empiris perbandingan dengan bank konvensional di Madura.',
    halamanPerbaikan: 'Halaman 114-116',
    status: 'Disetujui',
    fileBukti: 'Revisi_Bab4_Tesis_Rahmat.pdf'
  }
];

// Data Dokumen Resmi Tugas Akhir
export const INITIAL_DOKUMEN = [
  {
    id: 'doc-1',
    mhsId: 'mhs-s3',
    nim: '220231600004',
    namaDokumen: 'Draf Disertasi Lengkap (7 Rangkap Ujian Kelayakan)',
    jenis: 'Naskah Disertasi',
    tanggal: '10 September 2026',
    ukuran: '4.8 MB',
    statusVerifikasi: 'Terverifikasi Koorprodi',
    kategori: 'Naskah'
  },
  {
    id: 'doc-2',
    mhsId: 'mhs-s3',
    nim: '220231600004',
    namaDokumen: 'Surat Keterangan Pemeriksaan Plagiasi (Turnitin Similarity 16%, AI 18%)',
    jenis: 'Bukti Plagiasi',
    tanggal: '18 September 2026',
    ukuran: '850 KB',
    statusVerifikasi: 'Disahkan Koorprodi & Promotor',
    kategori: 'Bukti Plagiasi'
  },
  {
    id: 'doc-3',
    mhsId: 'mhs-s3',
    nim: '220231600004',
    namaDokumen: 'Letter of Acceptance (LoA) Scopus Q1 Elsevier',
    jenis: 'Bukti Publikasi',
    tanggal: '05 September 2026',
    ukuran: '620 KB',
    statusVerifikasi: 'Terverifikasi Tim Validasi',
    kategori: 'Publikasi'
  },
  {
    id: 'doc-4',
    mhsId: 'mhs-s3',
    nim: '220231600004',
    namaDokumen: 'Berita Acara & Lembar Penilaian Ujian Kelayakan Disertasi',
    jenis: 'Berita Acara',
    tanggal: '24 September 2026',
    ukuran: '1.2 MB',
    statusVerifikasi: 'Ditetapkan DPA & Koorprodi',
    kategori: 'Berita Acara'
  },
  {
    id: 'doc-5',
    mhsId: 'mhs-s1-takt',
    nim: '210211100142',
    namaDokumen: 'Proposal Skripsi BAB I–III Lengkap',
    jenis: 'Proposal',
    tanggal: '28 September 2026',
    ukuran: '2.1 MB',
    statusVerifikasi: 'Disetujui Dosen Pembimbing',
    kategori: 'Proposal'
  },
  {
    id: 'doc-6',
    mhsId: 'mhs-s1-takt',
    nim: '210211100142',
    namaDokumen: 'Surat Bebas Plagiasi Turnitin (Similarity 19%, AI 24%)',
    jenis: 'Bukti Plagiasi',
    tanggal: '25 September 2026',
    ukuran: '710 KB',
    statusVerifikasi: 'Disahkan Koorprodi',
    kategori: 'Bukti Plagiasi'
  },
  {
    id: 'doc-8',
    mhsId: 'mhs-s2',
    nim: '230221600018',
    namaDokumen: 'Draf Lengkap Tesis Magister Manajemen (5 Rangkap)',
    jenis: 'Naskah Tesis',
    tanggal: '22 September 2026',
    ukuran: '4.2 MB',
    statusVerifikasi: 'Disahkan Tim Pembimbing',
    kategori: 'Naskah'
  },
  {
    id: 'doc-9',
    mhsId: 'mhs-d3',
    nim: '230201100055',
    namaDokumen: 'Laporan Tugas Akhir Praktik Inkubasi Jamu Madura Bab I–IV',
    jenis: 'Laporan Tugas Akhir',
    tanggal: '26 September 2026',
    ukuran: '1.9 MB',
    statusVerifikasi: 'Disetujui Dosen Pembimbing',
    kategori: 'Naskah'
  }
];

// Activity Feed Historis (Berdasarkan Buku Pedoman)
export const INITIAL_ACTIVITIES = [
  { tanggal: '24 September 2026', judul: 'Desk Review Ujian Kelayakan Disertasi Selesai', deskripsi: 'Tiga penilai telah memasukkan rekomendasi kelayakan. Hasil akhir: Layak Revisi Minor (NA = 75.67).', mhsId: 'mhs-s3', nim: '220231600004' },
  { tanggal: '18 September 2026', judul: 'Surat Keterangan Turnitin Plagiasi Terbit', deskripsi: 'Pemeriksaan similarity index 16% (maks 20%) dan AI 18% (maks 30%) disahkan Koorprodi S3.', mhsId: 'mhs-s3', nim: '220231600004' },
  { tanggal: '10 September 2026', judul: 'Pendaftaran Ujian Kelayakan Disertasi Diajukan', deskripsi: 'Mahasiswa menyerahkan 7 rangkap draf disertasi lengkap ke Koorprodi.', mhsId: 'mhs-s3', nim: '220231600004' },
  { tanggal: '28 September 2026', judul: 'Persetujuan Proposal Skripsi oleh Pembimbing', deskripsi: 'Dra. Hj. S. Anugrahini Irawati, M.M. memberikan persetujuan maju Seminar Proposal.', mhsId: 'mhs-s1-takt', nim: '210211100142' },
  { tanggal: '29 September 2026', judul: 'Penetapan Jadwal & Dewan Penguji Seminar Proposal', deskripsi: 'Koorprodi S1 menetapkan jadwal seminar proposal pada Senin, 14 Oktober 2026.', mhsId: 'mhs-s1-takt', nim: '210211100142' },
  { tanggal: '25 September 2026', judul: 'Pendaftaran Sidang Tesis Disetujui', deskripsi: 'Koorprodi S2 menetapkan jadwal sidang tesis pada Rabu, 16 Oktober 2026.', mhsId: 'mhs-s2', nim: '230221600018' },
  { tanggal: '20 September 2026', judul: 'Pengajuan Jalur TAKK Terdaftar', deskripsi: 'Pendaftaran skema Tugas Akhir Kontributif-Kreatif disahkan oleh Koordinator Program Studi S1 Manajemen.', mhsId: 'mhs-s1-takk', nim: '210211100219' },
  { tanggal: '26 September 2026', judul: 'Penyelesaian 9 Sesi Bimbingan Vokasi D3', deskripsi: 'Dosen Pembimbing mengesahkan seluruh logbook bimbingan praktik lapangan.', mhsId: 'mhs-d3', nim: '230201100055' }
];
