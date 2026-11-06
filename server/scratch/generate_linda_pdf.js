import fs from 'node:fs';
import path from 'node:path';
import { jsPDF } from 'jspdf';

// Inisialisasi dokumen A4
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

// Warna institusi
const NAVY = [11, 34, 64]; // #0B2240
const SLATE_DARK = [30, 41, 59]; // #1E293B
const SLATE_MUTED = [100, 116, 139]; // #64748B
const AMBER = [217, 119, 6]; // #D97706

// HALAMAN 1: COVER DRAF NASKAH AKADEMIK
doc.setFillColor(...NAVY);
doc.rect(0, 0, 210, 18, 'F');

doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.text('KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI', 105, 8, { align: 'center' });
doc.setFontSize(9);
doc.setFont('helvetica', 'normal');
doc.text('UNIVERSITAS TRUNOJOYO MADURA — FAKULTAS EKONOMI DAN BISNIS', 105, 13, { align: 'center' });

// Kotak Status Dokumen
doc.setDrawColor(...AMBER);
doc.setFillColor(254, 243, 199);
doc.roundedRect(20, 26, 170, 12, 2, 2, 'FD');
doc.setTextColor(...AMBER);
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.text('DRAF NASKAH AKADEMIK RESMI — DALAM PROSES TELAAH PROMOTOR (SIM-TA FEB UTM)', 105, 33.5, { align: 'center' });

// Judul
doc.setTextColor(...NAVY);
doc.setFont('helvetica', 'bold');
doc.setFontSize(16);
const titleLines = doc.splitTextToSize('PROPOSAL DISERTASI', 160);
doc.text(titleLines, 105, 60, { align: 'center' });

doc.setFontSize(13);
doc.setTextColor(...SLATE_DARK);
const subTitle = doc.splitTextToSize(
  'KONSTRUKSI KEPEMIMPINAN SPIRITUAL DAN BUDAYA KERJA MADURA DALAM MEWUJUDKAN ORGANIZATIONAL AMBIDEXTERITY PADA SEKTOR PUBLIK',
  150
);
doc.text(subTitle, 105, 75, { align: 'center' });

// Garis Pembatas
doc.setDrawColor(203, 213, 225);
doc.line(30, 105, 180, 105);

// Identitas Peneliti
doc.setFontSize(10);
doc.setTextColor(...SLATE_MUTED);
doc.text('Disusun Oleh:', 105, 118, { align: 'center' });

doc.setFontSize(13);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...NAVY);
doc.text('LINDA PERMATASARI, S.E., M.SM.', 105, 126, { align: 'center' });

doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...SLATE_DARK);
doc.text('NIM. 230231600008', 105, 133, { align: 'center' });
doc.text('Program Studi S-3 Doktor Ilmu Manajemen', 105, 140, { align: 'center' });

// Komisi Promotor
doc.setDrawColor(226, 232, 240);
doc.setFillColor(248, 250, 252);
doc.roundedRect(25, 160, 160, 48, 2, 2, 'FD');

doc.setFontSize(10);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...NAVY);
doc.text('KOMISI TIM PROMOTOR:', 105, 170, { align: 'center' });

doc.setFontSize(9);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...SLATE_DARK);
doc.text('Promotor Utama: Prof. Dr. Pribanus Wantara, Drs., M.M. (NIP. 196305141990021001)', 32, 180);
doc.text('Ko-Promotor I  : Dr. Dra. Hj. Iriani Ismail, M.M. (NIP. 196201081987032001)', 32, 188);
doc.text('Ko-Promotor II : Dr. Faidal, S.E., M.M. (NIP. 197703032003121002)', 32, 196);

// Catatan Kaki Metadata
doc.setFontSize(8.5);
doc.setTextColor(...SLATE_MUTED);
doc.text('Status Uji Plagiasi: 18% Similarity (Turnitin Lolos) | Deteksi AI: 21% (Lolos Batas Maks 30%)', 105, 260, { align: 'center' });
doc.text('BANGKALAN — TAHUN AKADEMIK 2026/2027', 105, 270, { align: 'center' });

// ==========================================
// HALAMAN 2: BAB I PENDAHULUAN
// ==========================================
doc.addPage();

// Header Halaman
doc.setDrawColor(226, 232, 240);
doc.line(20, 15, 190, 15);
doc.setFontSize(8);
doc.setTextColor(...SLATE_MUTED);
doc.text('Proposal Disertasi — Linda Permatasari (NIM. 230231600008) | SIM-TA FEB UTM', 20, 12);
doc.text('Halaman 1', 190, 12, { align: 'right' });

doc.setFont('helvetica', 'bold');
doc.setFontSize(12);
doc.setTextColor(...NAVY);
doc.text('BAB I', 105, 28, { align: 'center' });
doc.text('PENDAHULUAN', 105, 34, { align: 'center' });

// 1.1 Latar Belakang
doc.setFontSize(10);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...SLATE_DARK);
doc.text('1.1 Latar Belakang Masalah', 20, 46);

doc.setFont('times', 'normal');
doc.setFontSize(10.5);
doc.setTextColor(30, 41, 59);

const p1 = 'Tuntutan adaptasi sektor publik di era disrupsi menuntut organisasi birokrasi memiliki kelincahan strategis (organizational ambidexterity) untuk mampu menyeimbangkan eksploitasi kapabilitas yang ada dan eksplorasi peluang baru secara simultan. Namun demikian, kepemimpinan spiritual diyakini mampu meningkatkan ambidexterity tanpa memperhatikan hambatan sosiokultural lokal yang melekat erat pada aparatur sipil negara di lingkungan Pemerintah Daerah Madura.';
const p1Lines = doc.splitTextToSize(p1, 170);
doc.text(p1Lines, 20, 53, { lineHeightFactor: 1.5 });

// Box Catatan Promotor Terintegrasi
doc.setDrawColor(217, 119, 6);
doc.setFillColor(254, 243, 199);
doc.roundedRect(20, 78, 170, 14, 1.5, 1.5, 'FD');
doc.setFont('helvetica', 'italic');
doc.setFontSize(8.5);
doc.setTextColor(180, 83, 9);
doc.text('[Catatan Telaah Promotor Prof. Pribanus Wantara]:', 24, 83);
doc.text('Fenomena gap keterkaitan birokrasi Madura dengan contingency perspective perlu diperkuat dengan data empiris indeks reformasi birokrasi 4 kabupaten.', 24, 88);

doc.setFont('times', 'normal');
doc.setFontSize(10.5);
doc.setTextColor(30, 41, 59);

const p2 = 'Dalam konteks pemerintahan daerah di wilayah Madura (Bangkalan, Sampang, Pamekasan, dan Sumenep), keberadaan nilai kultural religiusitas memiliki pengaruh ganda. Di satu sisi, kepemimpinan spiritual memberikan landasan integritas moral yang kokoh. Di sisi lain, resistensi terhadap perubahan struktur kerja birokrasi tradisional menjadi tantangan berat bagi pencapaian kinerja pelayanan publik yang inovatif.';
const p2Lines = doc.splitTextToSize(p2, 170);
doc.text(p2Lines, 20, 100, { lineHeightFactor: 1.5 });

// 1.2 Rumusan Masalah
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(...SLATE_DARK);
doc.text('1.2 Rumusan Masalah', 20, 130);

doc.setFont('times', 'normal');
doc.setFontSize(10.5);
doc.setTextColor(30, 41, 59);

const p3 = 'Berdasarkan pemaparan fenomena empiris dan kesenjangan teoretis terdahulu, maka rumusan masalah penelitian ini dirumuskan sebagai berikut:';
doc.text(p3, 20, 137);

doc.text('1. Bagaimana pengaruh kepemimpinan spiritual terhadap organizational ambidexterity pada pemerintah daerah di wilayah Madura?', 25, 146, { maxWidth: 165 });
doc.text('2. Apakah nilai budaya kerja Madura memoderasi pengaruh kepemimpinan spiritual terhadap pencapaian organizational ambidexterity?', 25, 156, { maxWidth: 165 });
doc.text('3. Bagaimana model konstruk baru (novelty) kepemimpinan spiritual berbasis kearifan lokal Madura dalam mengakselerasi adaptabilitas birokrasi?', 25, 166, { maxWidth: 165 });

// 1.3 Tujuan Penelitian
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(...SLATE_DARK);
doc.text('1.3 Tujuan Penelitian', 20, 184);

doc.setFont('times', 'normal');
doc.setFontSize(10.5);
doc.setTextColor(30, 41, 59);
doc.text('Penelitian ini bertujuan untuk menguji, menganalisis, serta mengonstruksi model integratif antara nilai kepemimpinan spiritual, moderasi budaya kerja lokal Madura, dan kapabilitas ambidexterity birokrasi dalam mewujudkan tata kelola pemerintahan publik yang berdaya saing.', 20, 191, { maxWidth: 170, lineHeightFactor: 1.5 });

// ==========================================
// HALAMAN 3: BAB II KAJIAN PUSTAKA
// ==========================================
doc.addPage();

// Header Halaman
doc.setDrawColor(226, 232, 240);
doc.line(20, 15, 190, 15);
doc.setFontSize(8);
doc.setTextColor(...SLATE_MUTED);
doc.text('Proposal Disertasi — Linda Permatasari (NIM. 230231600008) | SIM-TA FEB UTM', 20, 12);
doc.text('Halaman 2', 190, 12, { align: 'right' });

doc.setFont('helvetica', 'bold');
doc.setFontSize(12);
doc.setTextColor(...NAVY);
doc.text('BAB II', 105, 28, { align: 'center' });
doc.text('KAJIAN PUSTAKA & PENGEMBANGAN HIPOTESIS', 105, 34, { align: 'center' });

doc.setFontSize(10);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...SLATE_DARK);
doc.text('2.1 Landasan Teori (Grand Theory & Supporting Theory)', 20, 46);

doc.setFont('times', 'normal');
doc.setFontSize(10.5);
doc.setTextColor(30, 41, 59);
const bab2Text = 'Penelitian ini mengadopsi Resource-Based View (RBV) dan Contingency Theory sebagai landasan teoretis utama. Konsep organizational ambidexterity pertama kali diintroduksi oleh Duncan (1976) dan kemudian dielaborasi secara komprehensif oleh Gibson & Birkinshaw (2004) sebagai kapabilitas kontekstual organisasi untuk menyelaraskan eksploitasi dan eksplorasi secara simultan.';
doc.text(doc.splitTextToSize(bab2Text, 170), 20, 53, { lineHeightFactor: 1.5 });

// Box Catatan Promotor
doc.setDrawColor(217, 119, 6);
doc.setFillColor(254, 243, 199);
doc.roundedRect(20, 78, 170, 14, 1.5, 1.5, 'FD');
doc.setFont('helvetica', 'italic');
doc.setFontSize(8.5);
doc.setTextColor(180, 83, 9);
doc.text('[Catatan Telaah Ko-Promotor Dr. Iriani Ismail]:', 24, 83);
doc.text('Perbarui rujukan pustaka 5 tahun terakhir (2021-2026) dari jurnal internasional bereputasi tinggi (Scopus Q1/Q2).', 24, 88);

doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(...SLATE_DARK);
doc.text('2.2 Pengembangan Hipotesis', 20, 102);

doc.setFont('times', 'normal');
doc.setFontSize(10.5);
doc.setTextColor(30, 41, 59);
doc.text('H1 : Kepemimpinan spiritual berpengaruh positif dan signifikan terhadap organizational ambidexterity sektor publik di Madura.', 25, 110, { maxWidth: 165 });
doc.text('H2 : Budaya kerja Madura memoderasi secara signifikan pengaruh kepemimpinan spiritual terhadap organizational ambidexterity.', 25, 120, { maxWidth: 165 });

// Footer Dokumen
doc.setFontSize(8.5);
doc.setFont('helvetica', 'italic');
doc.setTextColor(...SLATE_MUTED);
doc.text('Dokumen digenerate otomatis oleh Sistem Informasi Manajemen Tugas Akhir (SIM-TA) FEB UTM 2026/2027', 105, 280, { align: 'center' });

// Simpan ke public/sample-documents/
const outputDir = path.resolve(process.cwd(), 'public/sample-documents');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'Proposal_Disertasi_Linda_v2.1.pdf');
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(outputPath, pdfBuffer);

console.log(`Berhasil membuat PDF asli: ${outputPath} (${pdfBuffer.length} bytes)`);
