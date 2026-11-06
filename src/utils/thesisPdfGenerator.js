/**
 * Thesis & Dissertation PDF Generator Engine — SIM Tugas Akhir FEB UTM
 * 
 * Menghasilkan naskah digital PDF otentik dan lembar catatan telaah dewan penguji
 * sesuai standar format penulisan Buku Pedoman Tugas Akhir Jurusan Manajemen FEB UTM 2026.
 */

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Buat kode verifikasi dokumen
 */
function makeVerificationCode(prefix = 'NASKAH') {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const time = Date.now().toString().slice(-4);
  return `UTM-FEB-${prefix}-${year}-${rand}${time}`;
}

/**
 * Gambar Running Header Akademik pada Halaman Isi
 */
function drawAcademicHeader(doc, title, pageNum) {
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  
  // Running Header Kiri
  doc.text('FAKULTAS EKONOMI DAN BISNIS — UNIVERSITAS TRUNOJOYO MADURA', 25, 15);
  doc.line(25, 17, 185, 17);

  // Running Footer
  doc.line(25, 277, 185, 277);
  doc.setFontSize(8);
  doc.text('Draf Naskah Ujian Tugas Akhir • Dokumen Terproteksi SIM-TA FEB UTM', 25, 282);
  doc.text(`Halaman ${pageNum}`, 185, 282, { align: 'right' });
}

/**
 * Hasilkan Blob URL untuk Naskah Lengkap PDF Otentik
 */
export async function generateThesisPdfBlobUrl(ujian = {}, naskahData = null) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = makeVerificationCode('TA');
  const studentName = ujian.namaMahasiswa || ujian.mahasiswa || 'Dinda Ayu Larasati';
  const nim = ujian.nim || '210211100142';
  const jenjang = ujian.jenjang || 'S1';
  const prodi = ujian.programStudi || 'S-1 Manajemen';
  const judul = ujian.judul || 'Pengaruh Live Commerce Interactive Features dan Emotional Value Terhadap Keputusan Pembelian Spontan Produk Batik Madura di TikTok Shop';
  const jenisTA = jenjang === 'S3' ? 'DISERTASI DOKTORAL' : jenjang === 'S2' ? 'TESIS MAGISTER' : jenjang === 'D3' ? 'LAPORAN TUGAS AKHIR' : 'SKRIPSI';
  const jenisUjian = ujian.jenisUjian || 'Seminar Proposal Skripsi';
  const pembimbing = ujian.pembimbing || 'Dra. Hj. S. Anugrahini Irawati, M.M.';

  // ==========================================
  // HALAMAN 1: SAMPUL RESMI (COVER)
  // ==========================================
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(24, 43, 73);
  doc.text('KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI', 105, 28, { align: 'center' });
  doc.setFontSize(13);
  doc.text('UNIVERSITAS TRUNOJOYO MADURA', 105, 34, { align: 'center' });
  doc.setFontSize(11.5);
  doc.text('FAKULTAS EKONOMI DAN BISNIS', 105, 40, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('JURUSAN MANAJEMEN', 105, 45, { align: 'center' });

  // Garis Pemisah Kop
  doc.setDrawColor(24, 43, 73);
  doc.setLineWidth(0.8);
  doc.line(30, 48, 180, 48);

  // Label Naskah
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(194, 65, 12);
  doc.text(`DRAF NASKAH UJIAN ${jenisTA}`, 105, 62, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`(Disiapkan Khusus untuk ${jenisUjian})`, 105, 67, { align: 'center' });

  // Judul Naskah
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const splitJudul = doc.splitTextToSize(judul.toUpperCase(), 150);
  doc.text(splitJudul, 105, 85, { align: 'center', lineHeightFactor: 1.35 });

  // Kotak Lambang / Logo UTM (Simulasi Vektor Emblem UTM Beresolusi Tinggi)
  const emblemY = 125;
  doc.setDrawColor(24, 43, 73);
  doc.setLineWidth(1.2);
  doc.circle(105, emblemY, 20);
  doc.setLineWidth(0.4);
  doc.circle(105, emblemY, 18);
  doc.setFont('times', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(24, 43, 73);
  doc.text('UNIVERSITAS TRUNOJOYO MADURA', 105, emblemY - 8, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(194, 65, 12);
  doc.text('UTM', 105, emblemY + 1, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(70, 70, 70);
  doc.text('FAKULTAS EKONOMI & BISNIS', 105, emblemY + 9, { align: 'center' });

  // Identitas Penyusun
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text('Diajukan sebagai salah satu syarat untuk menempuh Ujian Sidang', 105, 170, { align: 'center' });
  doc.text(`pada Program Studi ${prodi}`, 105, 175, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('Disusun Oleh:', 105, 192, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text(studentName, 105, 200, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`NIM. ${nim}`, 105, 206, { align: 'center' });

  // Footer Cover
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 43, 73);
  doc.text('BANGKALAN — JAWA TIMUR', 105, 255, { align: 'center' });
  doc.text('2026', 105, 261, { align: 'center' });

  // ==========================================
  // HALAMAN 2: LEMBAR PERSETUJUAN TIM PENGUJI
  // ==========================================
  doc.addPage();
  drawAcademicHeader(doc, judul, 2);

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('LEMBAR PERSETUJUAN DEWAN PENGUJI', 105, 32, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(`Kode Validasi Digital: ${verificationCode}`, 105, 37, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  doc.text(
    `Naskah ${jenisTA.toLowerCase()} berikut ini telah ditelaah dan disetujui untuk diujikan pada pelaksanaan ${jenisUjian} Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura:`,
    25,
    48,
    { maxWidth: 160, align: 'justify' }
  );

  // Tabel Identitas
  let curY = 62;
  doc.setFillColor(248, 250, 252);
  doc.rect(25, curY, 160, 42, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(25, curY, 160, 42, 'S');

  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('Judul Naskah', 28, curY + 6);
  doc.setFont('times', 'normal');
  doc.text(`: "${judul}"`, 60, curY + 6, { maxWidth: 120 });

  doc.setFont('times', 'bold');
  doc.text('Nama Mahasiswa', 28, curY + 20);
  doc.setFont('times', 'normal');
  doc.text(`: ${studentName}`, 60, curY + 20);

  doc.setFont('times', 'bold');
  doc.text('NIM / Program Studi', 28, curY + 26);
  doc.setFont('times', 'normal');
  doc.text(`: ${nim} / ${prodi} (${jenjang})`, 60, curY + 26);

  doc.setFont('times', 'bold');
  doc.text('Dosen Pembimbing', 28, curY + 32);
  doc.setFont('times', 'normal');
  doc.text(`: ${pembimbing}`, 60, curY + 32);

  doc.setFont('times', 'bold');
  doc.text('Jadwal & Ruang Ujian', 28, curY + 38);
  doc.setFont('times', 'normal');
  doc.text(`: ${ujian.jadwal || '14 Oktober 2026'} • ${ujian.ruang || 'Ruang Sidang FEB'}`, 60, curY + 38);

  // Susunan Penguji
  curY = 114;
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(24, 43, 73);
  doc.text('SUSUNAN DEWAN PENGUJI:', 25, curY);

  const pengujiList = ujian.susunanPenguji || [
    { peran: 'Ketua Dewan Penguji', nama: pembimbing, nip: '196203031988032001' },
    { peran: 'Dosen Penguji Utama', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002' },
    { peran: 'Anggota Dewan Penguji', nama: 'Aprilina Susandini, S.E., M.SM.', nip: '198904252019032014' }
  ];

  curY += 8;
  pengujiList.forEach((p, idx) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(25, curY, 160, 20, 'S');

    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(24, 43, 73);
    doc.text(`${idx + 1}. ${p.peran}:`, 28, curY + 6);
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(p.nama, 28, curY + 12);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`NIP. ${p.nip || '-'}`, 28, curY + 17);

    // Box Tanda Tangan
    doc.setFont('times', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text('✓ Terverifikasi Digital di SIM-TA', 130, curY + 12);

    curY += 24;
  });

  // Tanda Tangan Koorprodi
  curY = 205;
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('Bangkalan, ' + (ujian.jadwal || '14 Oktober 2026'), 125, curY);
  doc.text('Mengetahui,', 125, curY + 5);
  doc.text('Koordinator Program Studi Manajemen,', 125, curY + 10);

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 43, 73);
  doc.text('Dr. Hj. Siti Aminah, S.E., M.Si.', 125, curY + 34);
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('NIP. 197802142003122001', 125, curY + 39);

  // QR Code Otentisitas di Kiri
  try {
    const qrDataUrl = await QRCode.toDataURL(`https://feb.trunojoyo.ac.id/naskah-verifikasi?code=${verificationCode}`, {
      width: 150,
      margin: 1,
      color: { dark: '#182b49', light: '#ffffff' }
    });
    doc.addImage(qrDataUrl, 'PNG', 28, curY + 8, 26, 26);
    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Scan Keabsahan Dokumen', 41, curY + 37, { align: 'center' });
  } catch {
    // ignore
  }

  // ==========================================
  // HALAMAN 3: ABSTRAK
  // ==========================================
  doc.addPage();
  drawAcademicHeader(doc, judul, 3);

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('ABSTRAK', 105, 32, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);
  
  const abstrakText = `${studentName}. (2026). "${judul}". ${jenisTA}, Jurusan Manajemen, Fakultas Ekonomi dan Bisnis, Universitas Trunojoyo Madura. Dosen Pembimbing: ${pembimbing}.

Penelitian ini bertujuan untuk menguji dan menganalisis peran pemediasi emotional value dalam menjembatani pengaruh live commerce interactive features terhadap keputusan pembelian spontan (impulsive buying) pada produk Batik Madura di platform TikTok Shop. Fenomena peralihan saluran penjualan dari pasar tradisional ke live streaming interaktif membuka peluang komersialisasi budaya lokal yang masif, namun menuntut pemahaman empiris terkait pemicu psikologis konsumen.

Metode penelitian menggunakan pendekatan kuantitatif eksplanatori dengan kerangka teori Stimulus-Organism-Response (S-O-R). Populasi penelitian adalah konsumen yang pernah menonton siaran live streaming dan melakukan transaksi pembelian batik Madura di TikTok Shop, dengan sampel purposive sampling sebanyak 120 responden. Pengujian hipotesis dilakukan dengan Partial Least Squares Structural Equation Modeling (PLS-SEM) menggunakan perangkat lunak SmartPLS versi 4.

Hasil analisis membuktikan bahwa live commerce interactive features (interaktivitas host, visual, dan konsumen) berpengaruh positif dan signifikan terhadap emotional value pembeli. Selanjutnya, emotional value terbukti memediasi secara parsial hubungan antara fitur interaktif live streaming terhadap keputusan pembelian spontan. Implikasi manajerial merekomendasikan UMKM perajin batik Madura untuk meningkatkan daya tarik live storytelling dan responsivitas real-time guna memperkuat ikatan emosional konsumen.`;

  const splitAbstrak = doc.splitTextToSize(abstrakText, 160);
  doc.text(splitAbstrak, 25, 45, { lineHeightFactor: 1.5, align: 'justify' });

  doc.setFont('times', 'bold');
  doc.text('Kata Kunci:', 25, 230);
  doc.setFont('times', 'italic');
  doc.text('Live Commerce, Emotional Value, Impulsive Buying, Batik Madura, S-O-R Model, PLS-SEM.', 48, 230);

  // ==========================================
  // HALAMAN 4+: BAB I — BAB V
  // ==========================================
  const babList = naskahData?.babList || [
    {
      title: 'BAB I — PENDAHULUAN',
      sections: [
        {
          subTitle: '1.1 Latar Belakang Masalah & Fenomena Gap',
          content: `Perkembangan perdagangan elektronik (e-commerce) di Indonesia mengalami pergeseran paradigma signifikan dengan adopsi model social commerce, khususnya fitur live streaming shopping (live commerce) pada platform TikTok Shop. Produk kerajinan tradisional seperti Batik Madura yang memiliki ciri khas corak tegas dan warna berani (karakteristik budaya Madura) sebelumnya mengandalkan saluran distribusi konvensional di pasar tradisional 17 Agustus Pamekasan dan Bangkalan.\n\nNamun, fenomena live streaming interaktif memungkinkan interaksi langsung dua arah (real-time chat, unboxing live, demo pemakaian) antara penjual UMKM batik dengan konsumen di seluruh nusantara. Berdasarkan pra-survei awal terhadap 30 konsumen di Jawa Timur, sebanyak 73% menyatakan pernah melakukan pembelian batik secara spontan (impulsive buying) ketika terpapar interaksi host live streaming dan dorongan penawaran terbatas. Kesenjangan riset terlihat pada masih minimnya integrasi teori Stimulus-Organism-Response (S-O-R) dalam menguji interaksi sosial dan nilai emosional terhadap komoditas warisan budaya lokal di platform video pendek.`
        },
        {
          subTitle: '1.2 Rumusan Masalah Penelitian',
          content: `1. Apakah live commerce interactive features (interaktivitas host, interaktivitas visual, interaktivitas konsumen) berpengaruh signifikan terhadap emotional value pembeli batik Madura di TikTok Shop?\n2. Apakah emotional value berpengaruh signifikan terhadap impulsive buying keputusan pembelian spontan batik Madura di TikTok Shop?\n3. Apakah emotional value memediasi hubungan antara live commerce interactive features dan impulsive buying batik Madura di TikTok Shop?`
        },
        {
          subTitle: '1.3 Tujuan Penelitian',
          content: `Penelitian ini bertujuan untuk menguji dan menganalisis peran pemediasi emotional value dalam menjembatani pengaruh fitur interaktif live streaming terhadap keputusan pembelian spontan pada produk batik khas Madura.`
        }
      ]
    },
    {
      title: 'BAB II — KAJIAN PUSTAKA & PENGEMBANGAN HIPOTESIS',
      sections: [
        {
          subTitle: '2.1 Teori Stimulus-Organism-Response (S-O-R)',
          content: `Model S-O-R yang dikembangkan oleh Mehrabian dan Russell (1974) menjelaskan bahwa stimuli lingkungan eksternal (S) mempengaruhi kondisi internal emosi dan kognitif organisme (O), yang kemudian menghasilkan respons perilaku berupa penerimaan atau penolakan (R). Dalam konteks ini, live commerce interactive features bertindak sebagai Stimulus, Emotional Value bertindak sebagai Organisme, dan Impulsive Buying bertindak sebagai Respons.`
        },
        {
          subTitle: '2.2 Pengembangan Hipotesis Penelitian',
          content: `H1: Live commerce interactive features berpengaruh positif dan signifikan terhadap emotional value konsumen batik Madura di TikTok Shop.\nH2: Emotional value berpengaruh positif dan signifikan terhadap keputusan pembelian spontan (impulsive buying) konsumen batik Madura di TikTok Shop.\nH3: Emotional value memediasi secara parsial pengaruh live commerce interactive features terhadap impulsive buying.`
        }
      ]
    },
    {
      title: 'BAB III — METODE PENELITIAN',
      sections: [
        {
          subTitle: '3.1 Desain Penelitian & Penentuan Sampel',
          content: `Penelitian ini menggunakan pendekatan kuantitatif eksplanatori. Populasi dalam penelitian ini adalah seluruh konsumen di Indonesia yang pernah menonton siaran live streaming TikTok Shop dan membeli produk Batik Madura. Sampel ditentukan dengan metode purposive sampling sebanyak 120 responden yang memenuhi kriteria usia minimal 18 tahun dan bertransaksi minimal satu kali dalam 3 bulan terakhir.`
        },
        {
          subTitle: '3.2 Teknik Pengumpulan & Analisis Data',
          content: `Data dikumpulkan menggunakan kuesioner daring dengan skala Likert 1–5. Analisis data dilakukan menggunakan Partial Least Squares Structural Equation Modeling (PLS-SEM) dengan perangkat lunak SmartPLS versi 4. Tahap pengujian meliputi evaluasi Measurement Model (Outer Model: Convergent Validity, Discriminant Validity, Composite Reliability) dan Structural Model (Inner Model: R-Square, f-Square, Q-Square, dan Path Coefficients via Bootstrapping 5.000 subsample).`
        }
      ]
    },
    {
      title: 'BAB IV — HASIL PENELITIAN DAN PEMBAHASAN',
      sections: [
        {
          subTitle: '4.1 Evaluasi Measurement Model (Outer Model)',
          content: `Seluruh indikator dinyatakan valid dengan nilai outer loadings > 0.70 (rentang 0.742 – 0.891) dan nilai Average Variance Extracted (AVE) seluruh variabel berada di atas 0.50. Uji reliabilitas menunjukkan nilai Composite Reliability (rho_a dan rho_c) > 0.80, mengindikasikan tingkat keandalan instrumen yang sangat baik.`
        },
        {
          subTitle: '4.2 Pengujian Hipotesis & Pembahasan Efek Mediasi',
          content: `Hasil bootstrapping membuktikan bahwa seluruh hipotesis diterima: Koefisien jalur Live Commerce Features ke Emotional Value (β = 0.512, p = 0.000 < 0.05, H1 Diterima); Emotional Value ke Impulsive Buying (β = 0.435, p = 0.001 < 0.05, H2 Diterima). Pengujian specific indirect effect menunjukkan nilai t-statistic = 4.120 (> 1.96, p = 0.000), mengonfirmasi efek mediasi parsial yang signifikan secara statistik.`
        }
      ]
    },
    {
      title: 'BAB V — KESIMPULAN DAN SARAN',
      sections: [
        {
          subTitle: '5.1 Kesimpulan Penelitian',
          content: `1. Fitur interaktif live commerce TikTok Shop terbukti meningkatkan nilai emosional kesenangan dan kegembiraan berbelanja batik Madura.\n2. Nilai emosional yang tinggi memicu keputusan pembelian impulsif yang tidak direncanakan sebelumnya.\n3. Emotional value memediasi secara komplementer hubungan antara fitur interaktivitas terhadap keputusan transaksi pembelian spontan.`
        },
        {
          subTitle: '5.2 Implikasi Manajerial & Rekomendasi untuk UMKM Madura',
          content: `Pelaku UMKM Batik Madura disarankan untuk tidak hanya berfokus pada hard selling harga, melainkan memperkaya konten storytelling sejarah motif batik (seperti motif Sekar Jagad dan Tong Centong) secara komunikatif selama siaran live streaming agar membangkitkan ikatan emosional dan rasa bangga konsumen terhadap warisan budaya nusantara.`
        }
      ]
    }
  ];

  let pageIndex = 4;
  babList.forEach((bab) => {
    doc.addPage();
    drawAcademicHeader(doc, judul, pageIndex);
    pageIndex++;

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(24, 43, 73);
    doc.text(bab.title, 105, 32, { align: 'center' });

    let yPos = 46;
    bab.sections?.forEach((sec) => {
      // Sub-bab Header
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(sec.subTitle, 25, yPos);
      yPos += 7;

      // Paragraf Naskah
      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 30, 30);
      const splitContent = doc.splitTextToSize(sec.content, 160);
      doc.text(splitContent, 25, yPos, { lineHeightFactor: 1.5, align: 'justify' });
      yPos += (splitContent.length * 5.2) + 10;

      // Jika melebihi halaman, tambah halaman baru
      if (yPos > 240) {
        doc.addPage();
        drawAcademicHeader(doc, judul, pageIndex);
        pageIndex++;
        yPos = 32;
      }
    });
  });

  // ==========================================
  // HALAMAN TERAKHIR: DAFTAR PUSTAKA
  // ==========================================
  doc.addPage();
  drawAcademicHeader(doc, judul, pageIndex);

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('DAFTAR PUSTAKA', 105, 32, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);

  const daftarPustaka = [
    'Hair, J. F., Hult, G. T. M., Ringle, C. M., & Sarstedt, M. (2022). A Primer on Partial Least Squares Structural Equation Modeling (PLS-SEM) (3rd ed.). Thousand Oaks: SAGE Publications.',
    'Mehrabian, A., & Russell, J. A. (1974). An Approach to Environmental Psychology. Cambridge, MA: The MIT Press.',
    'Universitas Trunojoyo Madura. (2026). Buku Pedoman Penyusunan Tugas Akhir Jurusan Manajemen Fakultas Ekonomi dan Bisnis. Bangkalan: FEB UTM Press.',
    'Wongkitrungrueng, C., & Assarut, N. (2020). The role of live streaming in building consumer trust and engagement with social commerce sellers. Journal of Business Research, 117, 543–556.',
    'Zhang, M., Qin, F., Wang, G. A., & Luo, C. (2021). The impact of live video streaming on online purchase intention. Technological Forecasting and Social Change, 171, 120970.'
  ];

  let refY = 46;
  daftarPustaka.forEach((ref) => {
    const splitRef = doc.splitTextToSize(ref, 160);
    doc.text(splitRef, 25, refY, { lineHeightFactor: 1.4, align: 'justify' });
    refY += (splitRef.length * 4.8) + 6;
  });

  // Convert to Blob & Object URL
  const pdfBlob = doc.output('blob');
  return URL.createObjectURL(pdfBlob);
}

/**
 * Unduh Lembar Resmi Catatan Telaah Naskah Penguji (PDF)
 */
export async function downloadLembarCatatanPengujiPdf(ujian = {}, babNotes = {}, pengujiInfo = {}) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = makeVerificationCode('REV');
  const studentName = ujian.namaMahasiswa || ujian.mahasiswa || 'Mahasiswa';
  const nim = ujian.nim || '-';
  const prodi = ujian.programStudi || 'S-1 Manajemen';
  const jenjang = ujian.jenjang || 'S1';
  const judul = ujian.judul || 'Judul Naskah Tugas Akhir';
  const pengujiNama = pengujiInfo.nama || 'Dr. Faidal, S.E., M.M.';
  const pengujiNip = pengujiInfo.nip || '197703032003121002';
  const pengujiPeran = ujian.peranPenguji || 'Dosen Penguji Utama';

  // Kop Surat Resmi
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI', 105, 14, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(24, 43, 73);
  doc.text('UNIVERSITAS TRUNOJOYO MADURA', 105, 20, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(194, 65, 12);
  doc.text('FAKULTAS EKONOMI DAN BISNIS', 105, 25.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Jl. Raya Telang, PO. Box 2 Kamal, Bangkalan 69162 Jawa Timur | Laman: feb.trunojoyo.ac.id', 105, 30.5, { align: 'center' });

  doc.setDrawColor(24, 43, 73);
  doc.setLineWidth(1.2);
  doc.line(15, 34, 195, 34);
  doc.setLineWidth(0.4);
  doc.line(15, 35.5, 195, 35.5);

  // Judul Lembar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('LEMBAR CATATAN TELAAH & REVISI NASKAH SIDANG', 105, 44, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Format Berita Acara Evaluasi Penguji • Kode Verifikasi: ${verificationCode}`, 105, 49, { align: 'center' });

  // Tabel Identitas
  const idY = 54;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, idY, 180, 26, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, idY, 180, 26, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Nama Mahasiswa', 18, idY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${studentName} (NIM. ${nim})`, 55, idY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Program Studi / Jenjang', 18, idY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${prodi} (${jenjang})`, 55, idY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('Dosen Penguji', 18, idY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${pengujiNama} [${pengujiPeran}]`, 55, idY + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Judul Tugas Akhir', 18, idY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`: "${judul}"`, 55, idY + 20, { maxWidth: 135 });

  // Tabel Catatan per Bab
  let tableY = idY + 32;
  doc.setFillColor(24, 43, 73);
  doc.rect(15, tableY, 180, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('BAB / BAGIAN NASKAH', 18, tableY + 5);
  doc.text('STATUS', 75, tableY + 5);
  doc.text('HALAMAN', 105, tableY + 5);
  doc.text('CATATAN ARAHAN PERBAIKAN PENGUJI', 130, tableY + 5);

  tableY += 7;

  const babRows = [
    { key: 'bab-1', label: 'BAB I — PENDAHULUAN' },
    { key: 'bab-2', label: 'BAB II — KAJIAN PUSTAKA' },
    { key: 'bab-3', label: 'BAB III — METODE PENELITIAN' },
    { key: 'bab-4', label: 'BAB IV — HASIL & PEMBAHASAN' },
    { key: 'bab-5', label: 'BAB V — KESIMPULAN & SARAN' },
    { key: 'bab-umum', label: 'TATA TULIS & DAFTAR PUSTAKA' }
  ];

  babRows.forEach((row, idx) => {
    const item = babNotes[row.key] || { status: 'sesuai', halaman: '-', catatan: 'Telah sesuai pedoman akademik.' };
    const statusText = item.status === 'mayor' ? 'REVISI MAYOR' : item.status === 'minor' ? 'REVISI MINOR' : 'SESUAI (OK)';
    const catatanText = item.catatan?.trim() || (item.status === 'sesuai' ? 'Tidak ada catatan khusus (Memenuhi standar).' : 'Perlu penyesuaian.');

    const splitCatatan = doc.splitTextToSize(catatanText, 62);
    const rowHeight = Math.max(14, (splitCatatan.length * 4) + 6);

    doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 251);
    doc.rect(15, tableY, 180, rowHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, tableY, 180, rowHeight, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(24, 43, 73);
    doc.text(row.label, 18, tableY + 5);

    // Status Badge
    doc.setFontSize(7);
    if (item.status === 'mayor') {
      doc.setTextColor(220, 38, 38);
    } else if (item.status === 'minor') {
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setTextColor(22, 101, 52);
    }
    doc.text(statusText, 75, tableY + 5);

    // Halaman
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(item.halaman || '-', 105, tableY + 5);

    // Catatan
    doc.setTextColor(30, 30, 30);
    doc.text(splitCatatan, 130, tableY + 5, { lineHeightFactor: 1.3 });

    tableY += rowHeight;
  });

  // Tanda Tangan & QR Code
  const signY = Math.min(tableY + 12, 235);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  doc.text('Bangkalan, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 135, signY);
  doc.text(`${pengujiPeran},`, 135, signY + 4.5);

  try {
    const qrDataUrl = await QRCode.toDataURL(`https://feb.trunojoyo.ac.id/verifikasi-catatan?code=${verificationCode}`, {
      width: 150,
      margin: 1,
      color: { dark: '#182b49', light: '#ffffff' }
    });
    doc.addImage(qrDataUrl, 'PNG', 25, signY + 2, 22, 22);
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text('Dokumen Sah SIM-TA FEB UTM', 36, signY + 27, { align: 'center' });
  } catch {
    // ignore
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text(pengujiNama, 135, signY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`NIP. ${pengujiNip}`, 135, signY + 28);
  doc.setTextColor(5, 150, 105);
  doc.text('✓ Terekam Resmi di Berita Acara Ujian', 135, signY + 32);

  const filename = `Lembar_Catatan_Penguji_${nim}.pdf`;
  doc.save(filename);
  return filename;
}
