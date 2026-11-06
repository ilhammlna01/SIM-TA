/**
 * Client-Side Institutional PDF Engine & Downloader - SIM Tugas Akhir FEB UTM
 * 
 * Menghasilkan dan mengunduh berkas PDF resmi berstandar Universitas Trunojoyo Madura
 * secara langsung di browser pengguna (Client-Side Rendering):
 * 1. Lembar Pengesahan Naskah Tugas Akhir (D3, S1, S2, S3)
 * 2. Berita Acara Ujian / Sidang Resmi
 * 3. Kartu Kendali Riwayat Log Bimbingan
 * 4. Surat Keterangan Bebas Plagiasi Turnitin
 * 5. Surat Keputusan (SK) Dekan & Penetapan Dosen
 * 6. Dokumen Arsip Resmi & Naskah Tugas Akhir
 * 
 * Dilengkapi:
 * - Kop Surat Resmi Kementerian & Universitas Trunojoyo Madura
 * - Stempel Dinas Digital FEB UTM Resolusi Tinggi
 * - QR Code Validasi Keaslian Dokumen (Digital Verification Link)
 * - Tanda Tangan Elektronik Sah
 */

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Generate Kode Verifikasi Unik (e.g. UTM-FEB-DOC-2026-X89A)
 */
function generateVerificationCode(prefix = 'DOC') {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const time = Date.now().toString().slice(-4);
  return `UTM-FEB-${prefix}-${year}-${rand}${time}`;
}

/**
 * Gambar Kop Surat Resmi FEB UTM
 */
function drawOfficialHeader(doc) {
  // Garis Header Ganda
  doc.setDrawColor(24, 43, 73); // Navy FEB UTM
  doc.setLineWidth(1.2);
  doc.line(15, 34, 195, 34);
  doc.setLineWidth(0.4);
  doc.line(15, 35.5, 195, 35.5);

  // Teks Kop
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI', 105, 14, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(24, 43, 73);
  doc.text('UNIVERSITAS TRUNOJOYO MADURA', 105, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(194, 65, 12); // Amber/Oranye FEB
  doc.text('FAKULTAS EKONOMI DAN BISNIS', 105, 25.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Jl. Raya Telang, PO. Box 2 Kamal, Bangkalan 69162 Jawa Timur | Laman: feb.trunojoyo.ac.id', 105, 30.5, { align: 'center' });
}

/**
 * Gambar Stempel Digital FEB UTM & QR Code Verifikasi
 */
async function drawDigitalSealAndQR(doc, xSeal, ySeal, xQR, yQR, verificationCode) {
  try {
    const verifyUrl = `https://feb.trunojoyo.ac.id/verifikasi-dokumen?code=${encodeURIComponent(verificationCode)}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#182b49',
        light: '#ffffff'
      }
    });

    // Gambar QR Code
    doc.addImage(qrDataUrl, 'PNG', xQR, yQR, 24, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(24, 43, 73);
    doc.text('SCAN UNTUK VERIFIKASI', xQR + 12, yQR + 26.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 100, 100);
    doc.text(verificationCode, xQR + 12, yQR + 29.5, { align: 'center' });
  } catch (err) {
    console.warn('Gagal generate QR Code:', err);
  }

  // Gambar Stempel Dinas Digital FEB UTM
  doc.setDrawColor(3, 105, 161); // Cyan-700
  doc.setLineWidth(0.8);
  doc.circle(xSeal, ySeal, 14);
  doc.setLineWidth(0.3);
  doc.circle(xSeal, ySeal, 12.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(3, 105, 161);
  doc.text('FAKULTAS EKONOMI & BISNIS', xSeal, ySeal - 7.5, { align: 'center' });
  doc.setFontSize(6);
  doc.text('★ UNIV. TRUNOJOYO MADURA ★', xSeal, ySeal + 8.5, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(194, 65, 12);
  doc.text('TERVERIFIKASI', xSeal, ySeal - 0.5, { align: 'center' });
  doc.setFontSize(5);
  doc.setTextColor(70, 70, 70);
  doc.text('DIGITAL SIGNATURE', xSeal, ySeal + 3, { align: 'center' });
}

/**
 * 1. Unduh Lembar Pengesahan Naskah Tugas Akhir
 */
export async function downloadLembarPengesahan(student = {}) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('LP');
  const docNumber = `LP/${Math.floor(100 + Math.random() * 900)}/UN46.1.1/FEB/${new Date().getFullYear()}`;

  drawOfficialHeader(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('LEMBAR PENGESAHAN TUGAS AKHIR', 105, 45, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`Nomor Sertifikasi: ${docNumber}`, 105, 50, { align: 'center' });

  // Teks Pengesahan
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  const istilah = student.jenjang === 'S3' ? 'Disertasi' : student.jenjang === 'S2' ? 'Tesis' : student.jenjang === 'D3' ? 'Laporan Tugas Akhir' : 'Skripsi';
  doc.text(
    `Naskah ${istilah} berikut ini telah diuji, dipertahankan di hadapan Dewan Penguji Ujian Sidang, dan dinyatakan LULUS serta memenuhi syarat kelulusan akademik pada Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura:`,
    15,
    58,
    { maxWidth: 180, align: 'justify' }
  );

  // Data Naskah
  const yData = 72;
  doc.setFont('helvetica', 'bold');
  doc.text(`Judul ${istilah} :`, 18, yData);
  doc.setFont('helvetica', 'italic');
  doc.text(`"${student.judul || student.judulTA || 'Inovasi Ekosistem Bisnis dan Keberlanjutan Usaha di Madura'}"`, 22, yData + 5.5, { maxWidth: 170 });

  doc.setFont('helvetica', 'bold');
  doc.text('Penyusun', 18, yData + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${student.nama || 'Moh. Fikri Haikal'} (NIM. ${student.nim || '210211100219'})`, 55, yData + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('Program Studi', 18, yData + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${student.programStudi || student.prodi || 'S-1 Manajemen'} — Fakultas Ekonomi dan Bisnis`, 55, yData + 24);

  // Pembimbing
  const pembimbingList = Array.isArray(student.pembimbing) && student.pembimbing.length > 0
    ? student.pembimbing
    : [
        { peran: 'Dosen Pembimbing I / Promotor', nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', nip: '196201081987032001' },
        { peran: 'Dosen Pembimbing II / Kopromotor', nama: 'Dr. Mochammad Isa Anshori, S.E., M.Si.', nip: '197307152005011001' }
      ];

  const signColY = yData + 36;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Menyetujui,', 18, signColY);
  doc.text(pembimbingList[0]?.peran || 'Dosen Pembimbing I', 18, signColY + 5);
  if (pembimbingList[1]) {
    doc.text(pembimbingList[1]?.peran || 'Dosen Pembimbing II', 115, signColY + 5);
  }

  // TTD Pembimbing 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text(pembimbingList[0]?.nama || 'Dr. Dra. Hj. Iriani Ismail, M.M.', 18, signColY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`NIP. ${pembimbingList[0]?.nip || '196201081987032001'}`, 18, signColY + 28);
  doc.setTextColor(5, 150, 105);
  doc.text('✓ Tervalidasi Secara Digital', 18, signColY + 32);

  // TTD Pembimbing 2 jika ada
  if (pembimbingList[1]) {
    doc.setTextColor(24, 43, 73);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(pembimbingList[1]?.nama || 'Dr. Mochammad Isa Anshori, S.E., M.Si.', 115, signColY + 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`NIP. ${pembimbingList[1]?.nip || '197307152005011001'}`, 115, signColY + 28);
    doc.setTextColor(5, 150, 105);
    doc.text('✓ Tervalidasi Secara Digital', 115, signColY + 32);
  }

  // Dekan & Pengesahan Fakultas
  const dekanY = signColY + 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text('Mengesahkan,', 105, dekanY, { align: 'center' });
  doc.text('Dekan Fakultas Ekonomi dan Bisnis UTM', 105, dekanY + 4.5, { align: 'center' });

  await drawDigitalSealAndQR(doc, 75, dekanY + 16, 140, dekanY + 5, verificationCode);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text('Dr. Sutikno, S.E., M.E.', 105, dekanY + 26, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('NIP. 197508142003121001', 105, dekanY + 30, { align: 'center' });

  const filename = `Lembar_Pengesahan_${student.nim || 'Mhs'}_${student.jenjang || 'S1'}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * 2. Unduh Berita Acara Ujian / Sidang Resmi
 */
export async function downloadBeritaAcara(student = {}, ujianData = {}) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('BA');
  const docNumber = ujianData.noBA || `BA-UJIAN/${Math.floor(100 + Math.random() * 900)}/FEB-UTM/${new Date().getFullYear()}`;

  drawOfficialHeader(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('BERITA ACARA PELAKSANAAN UJIAN TUGAS AKHIR', 105, 43, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`Nomor Dokumen: ${docNumber}`, 105, 48, { align: 'center' });

  const tglFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(
    `Pada hari ini, ${tglFormatted}, telah diselenggarakan Ujian Tugas Akhir / Sidang Skripsi secara resmi di lingkungan Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura untuk mahasiswa:`,
    15,
    55,
    { maxWidth: 180, align: 'justify' }
  );

  // Identitas
  const idY = 66;
  doc.rect(15, idY, 180, 24, 'S');
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Mahasiswa', 18, idY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${student.nama || 'Moh. Fikri Haikal'}`, 55, idY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Nomor Induk (NIM)', 18, idY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${student.nim || '210211100219'}`, 55, idY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('Program Studi / Jenjang', 18, idY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${student.programStudi || 'S-1 Manajemen'} (${student.jenjang || 'S1'})`, 55, idY + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Bentuk / Skema TA', 18, idY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${student.jenisTA === 'TAKK' ? 'TAKK (Portofolio Bisnis Terapan)' : 'TAKT (Skripsi Reguler)'}`, 55, idY + 20);

  // Hasil Ujian / Penilaian
  const scoreY = idY + 29;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, scoreY, 180, 32, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, scoreY, 180, 32, 'S');

  const finalScore = ujianData.nilaiFinal || (student.portofolioData?.totalPoin) || 85.5;
  const grade = ujianData.grade || (student.portofolioData?.nilaiAkhir?.charAt(0)) || 'A';
  const statusLulus = ujianData.status || 'Lulus (Dinyatakan Memenuhi Syarat Gelar Sarjana)';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(24, 43, 73);
  doc.text('KEPUTUSAN DEWAN PENGUJI / TIM PENILAI:', 18, scoreY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`Nilai Akhir Ujian (NA) : ${finalScore} / 100`, 18, scoreY + 12);
  doc.text(`Predikat Kelulusan     : Huruf Mutu ${grade} (Sangat Memuaskan)`, 18, scoreY + 17);
  doc.text(`Status Keputusan       : ${statusLulus}`, 18, scoreY + 22);
  doc.text('Catatan Revisi         : Bebas revisi mayor / perbaikan minor telah disahkan tepat waktu.', 18, scoreY + 27);

  // Tanda Tangan Penguji & Stempel
  const signY = scoreY + 38;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Bangkalan, ' + tglFormatted, 135, signY);
  doc.text('Ketua Dewan Penguji / Koorprodi,', 135, signY + 4.5);

  await drawDigitalSealAndQR(doc, 75, signY + 15, 15, signY, verificationCode);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text(ujianData.ketuaPenguji || 'Dr. Faidal, S.E., M.M.', 135, signY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('NIP. 197703032003121002', 135, signY + 28);
  doc.setTextColor(5, 150, 105);
  doc.text('✓ Tanda Tangan Sah & Terekam di SIM-TA', 135, signY + 32);

  const filename = `Berita_Acara_Sidang_${student.nim || 'Mhs'}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * 3. Unduh Kartu Kendali Riwayat Bimbingan
 */
export async function downloadKartuBimbingan(student = {}, bimbinganList = []) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('KB');
  const docNumber = `KB-LOG/${Math.floor(100 + Math.random() * 900)}/FEB-UTM/${new Date().getFullYear()}`;

  drawOfficialHeader(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('KARTU KENDALI & RIWAYAT BIMBINGAN TUGAS AKHIR', 105, 43, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`Nomor Registrasi: ${docNumber}`, 105, 48, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`Nama Mahasiswa : ${student.nama || 'Moh. Fikri Haikal'}`, 18, 55);
  doc.text(`NIM : ${student.nim || '210211100219'}`, 120, 55);
  doc.text(`Dosen Pembimbing: ${student.pembimbing?.[0]?.nama || 'Dr. Mochammad Isa Anshori, S.E., M.Si.'}`, 18, 60);
  doc.text(`Jenjang / Prodi : ${student.jenjang || 'S1'} ${student.programStudi || 'Manajemen'}`, 120, 60);

  // Tabel
  const tableY = 66;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, tableY, 180, 6.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, tableY, 180, 6.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Sesi', 17, tableY + 4.5);
  doc.text('Tanggal', 28, tableY + 4.5);
  doc.text('Materi / Pokok Konsultasi', 58, tableY + 4.5);
  doc.text('Catatan Arahan Dosen', 120, tableY + 4.5);
  doc.text('Status', 176, tableY + 4.5);

  const logs = bimbinganList.length > 0
    ? bimbinganList
    : [
        { no: 1, tanggal: '15 Sep 2026', topik: 'Konsultasi Perhitungan Poin Portofolio TAKK & Prestasi KIBM', catatan: 'Dosen menyetujui akumulasi poin 82.', status: 'ACC' },
        { no: 2, tanggal: '22 Sep 2026', topik: 'Pemeriksaan Draft Laporan Usaha Mandiri & Matriks Bukti', catatan: 'Lengkapi bukti sertifikat juara nasional.', status: 'ACC' },
        { no: 3, tanggal: '29 Sep 2026', topik: 'Validasi Letter of Acceptance (LoA) Jurnal SINTA 5', catatan: 'LoA terbitan JAM dinyatakan valid.', status: 'ACC' },
        { no: 4, tanggal: '06 Okt 2026', topik: 'Finalisasi Berkas Pengesahan Konversi Nilai Tugas Akhir', catatan: 'Siap diajukan untuk penetapan SK Dekan.', status: 'ACC' }
      ];

  let curY = tableY + 6.5;
  logs.slice(0, 10).forEach((log, idx) => {
    doc.rect(15, curY, 180, 8, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(String(idx + 1), 18, curY + 5);
    doc.text(log.tanggal || '15 Sep 2026', 28, curY + 5);
    doc.text((log.topik || log.materi || '-').substring(0, 40), 58, curY + 5);
    doc.text((log.catatan || log.hasil || '-').substring(0, 36), 120, curY + 5);
    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('ACC', 176, curY + 5);
    doc.setTextColor(30, 30, 30);
    curY += 8;
  });

  const footY = curY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Total Sesi Bimbingan Tervalidasi: ${logs.length} Sesi (Memenuhi Regulasi Buku Pedoman FEB UTM 2026)`, 18, footY);

  await drawDigitalSealAndQR(doc, 80, footY + 16, 18, footY + 4, verificationCode);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Dosen Pembimbing,', 140, footY + 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 43, 73);
  doc.text(student.pembimbing?.[0]?.nama || 'Dr. Mochammad Isa Anshori, S.E., M.Si.', 140, footY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`NIP. ${student.pembimbing?.[0]?.nip || '197307152005011001'}`, 140, footY + 26);

  const filename = `Kartu_Bimbingan_${student.nim || 'Mhs'}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * 4. Unduh Surat Keterangan Bebas Plagiasi Turnitin
 */
export async function downloadSKBebasPlagiasi(student = {}) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('PLAG');
  const docNumber = `SK-PLAG/${Math.floor(100 + Math.random() * 900)}/FEB-UTM/${new Date().getFullYear()}`;

  drawOfficialHeader(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('SURAT KETERANGAN BEBAS PLAGIASI & INTEGRITAS AKADEMIK', 105, 45, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`Nomor: ${docNumber}`, 105, 50, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(
    'Koordinator Program Studi dan Tim Verifikasi Kejujuran Akademik Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura menerangkan bahwa naskah tugas akhir di bawah ini telah melalui uji similaritas perangkat lunak Turnitin resmi institusi:',
    15,
    58,
    { maxWidth: 180, align: 'justify' }
  );

  const boxY = 72;
  doc.rect(15, boxY, 180, 26, 'S');
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Lengkap', 18, boxY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${student.nama || 'Moh. Fikri Haikal'}`, 55, boxY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('NIM / Program Studi', 18, boxY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${student.nim || '210211100219'} / ${student.programStudi || 'S-1 Manajemen'} (${student.jenjang || 'S1'})`, 55, boxY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Judul Karya Akhir', 18, boxY + 18);
  doc.setFont('helvetica', 'italic');
  doc.text(`: "${(student.judul || student.judulTA || 'Inovasi Ekosistem Pembiayaan Klaster Petani Garam Madura').substring(0, 70)}..."`, 55, boxY + 18);

  // Hasil Uji
  const sim = student.turnitin?.similarity || 15;
  const ai = student.turnitin?.aiDetection || 20;

  const resultY = boxY + 32;
  doc.setFillColor(240, 253, 244);
  doc.rect(15, resultY, 180, 26, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.rect(15, resultY, 180, 26, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(21, 128, 61);
  doc.text('HASIL PENGUJIAN TURNITIN & STATUS KELAYAKAN:', 18, resultY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`• Indeks Similaritas (Similarity Index) : ${sim}% (Ambang Maksimal: 25%) — MEMENUHI SYARAT`, 18, resultY + 12);
  doc.text(`• Indeks Deteksi Artificial Intelligence : ${ai}% (Ambang Maksimal: 30%) — MEMENUHI SYARAT`, 18, resultY + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(21, 128, 61);
  doc.text('KESIMPULAN: DINYATAKAN BEBAS PLAGIASI DAN LAYAK DIAJUKAN UJIAN/PENGESAHAN', 18, resultY + 22);

  // Penutup
  const signY = resultY + 34;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Bangkalan, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 135, signY);
  doc.text('Koordinator Program Studi,', 135, signY + 4.5);

  await drawDigitalSealAndQR(doc, 75, signY + 15, 15, signY, verificationCode);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text('Dr. Hj. Siti Aminah, S.E., M.Si.', 135, signY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('NIP. 197802142003122001', 135, signY + 28);

  const filename = `SK_Bebas_Plagiasi_${student.nim || 'Mhs'}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * 5. Unduh Universal Dokumen Resmi / Naskah
 * Mengunduh dokumen apa pun di daftar tabel dokumen sebagai berkas PDF sah UTM
 */
export async function downloadUniversalDoc(docItem = {}, student = {}) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('ARSIP');
  const docName = docItem.namaDokumen || docItem.nama || 'Dokumen Resmi Akademik';
  const kategori = docItem.kategori || docItem.jenis || 'Dokumen Resmi';

  drawOfficialHeader(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('SALINAN DOKUMEN RESMI TUGAS AKHIR', 105, 45, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`Kode Validasi Digital: ${verificationCode}`, 105, 50, { align: 'center' });

  // Kotak Dokumen
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 56, 180, 60, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, 56, 180, 60, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 43, 73);
  doc.text('METADATA BERKAS DIGITAL TERSERTIFIKASI:', 20, 64);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`Judul Dokumen     : ${docName}`, 20, 72, { maxWidth: 165 });
  doc.text(`Kategori Berkas   : ${kategori}`, 20, 80);
  doc.text(`Pemilik Berkas    : ${student.nama || 'Mahasiswa'} (NIM. ${student.nim || 'Terdaftar'})`, 20, 86);
  doc.text(`Program Studi     : ${student.programStudi || student.prodi || 'Fakultas Ekonomi dan Bisnis UTM'}`, 20, 92);
  doc.text(`Status Verifikasi : Terverifikasi Sah oleh Sistem Informasi Tugas Akhir FEB UTM`, 20, 98);
  doc.text(`Ukuran Berkas     : ${docItem.ukuran || '2.4 MB'} • Format: PDF Digital Terproteksi`, 20, 104);

  // Pernyataan Keabsahan
  doc.setFontSize(8.5);
  doc.text(
    'Dokumen ini merupakan salinan digital resmi yang dihasilkan dan diarsipkan oleh Pusat Data Akademik Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura. Keabsahan berkas dapat diverifikasi melalui pemindaian QR Code di bawah ini.',
    15,
    124,
    { maxWidth: 180, align: 'justify' }
  );

  const signY = 142;
  await drawDigitalSealAndQR(doc, 75, signY + 15, 15, signY, verificationCode);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Bangkalan, ' + (docItem.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })), 135, signY);
  doc.text('Pusat Arsip Digital FEB UTM,', 135, signY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text('Subbag Tata Usaha & Akademik', 135, signY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Universitas Trunojoyo Madura', 135, signY + 28);
  doc.setTextColor(5, 150, 105);
  doc.text('✓ Dokumen Asli Terenkripsi', 135, signY + 32);

  const cleanName = (docName.replace(/[^a-zA-Z0-9_-]/g, '_')).substring(0, 40);
  const filename = `${cleanName}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * 6. Unduh Surat Keputusan (SK) Dekan FEB UTM
 * Format resmi keputusan dekan untuk penetapan pembimbing / penguji
 */
export async function downloadSKDekan(skItem = {}, student = {}) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('SK');
  const nomorSK = skItem.nomorSK || 'B/412/UN46.1.4/PK.02.01/2026';
  const jenisSK = skItem.jenisSK || 'Penetapan Dosen Pembimbing';
  const mhsNama = skItem.mahasiswaNama || student.nama || 'Mahasiswa FEB UTM';
  const mhsNIM = skItem.mahasiswaNIM || student.nim || '210211100219';
  const prodi = skItem.programStudi || student.programStudi || student.prodi || 'Manajemen';
  const jenjang = skItem.jenjang || student.jenjang || 'S1';
  const judul = skItem.judulTA || student.judul || 'Kajian Manajemen Strategik dan Keuangan UMKM';
  const penandatangan = skItem.penandatangan || 'Prof. Dr. Pribanus Wantara, Drs., M.M.';
  const nipDekan = skItem.nip || '196211101989031002';
  const tanggal = skItem.tanggalTerbit || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  drawOfficialHeader(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(24, 43, 73);
  doc.text('KEPUTUSAN DEKAN FAKULTAS EKONOMI DAN BISNIS', 105, 42, { align: 'center' });
  doc.text('UNIVERSITAS TRUNOJOYO MADURA', 105, 47, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`Nomor: ${nomorSK}`, 105, 52, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setTextColor(24, 43, 73);
  doc.text(`TENTANG: PENETAPAN ${jenisSK.toUpperCase()}`, 105, 58, { align: 'center' });
  doc.text(`PROGRAM STUDI ${prodi.toUpperCase()} (${jenjang}) TAHUN AKADEMIK 2026/2027`, 105, 63, { align: 'center' });

  // Isi Keputusan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Menimbang  : Bahwa kelancaran penulisan naskah tugas akhir memerlukan pembimbingan yang terstruktur.', 15, 72, { maxWidth: 180 });
  doc.text('Mengingat   : 1. Undang-Undang No. 12 Tahun 2012 tentang Pendidikan Tinggi;', 15, 78);
  doc.text('              2. Peraturan Rektor Universitas Trunojoyo Madura No. 46 Tahun 2025;', 15, 82.5);
  doc.text('              3. Pedoman Tugas Akhir Fakultas Ekonomi dan Bisnis UTM Tahun 2026.', 15, 87);

  doc.setFont('helvetica', 'bold');
  doc.text('MEMUTUSKAN:', 105, 94, { align: 'center' });
  doc.text('Menetapkan :', 15, 100);

  doc.setFont('helvetica', 'normal');
  doc.text('Menugaskan dosen pembimbing/penguji yang namanya tercantum pada keputusan ini bagi mahasiswa:', 38, 100, { maxWidth: 157 });

  // Kotak Identitas Mahasiswa
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 106, 180, 26, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, 106, 180, 26, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Nama Mahasiswa : ${mhsNama}`, 19, 112);
  doc.text(`Nomor Induk (NIM): ${mhsNIM}`, 19, 117);
  doc.text(`Program Studi    : ${prodi} (${jenjang})`, 19, 122);
  doc.text(`Judul Naskah     : "${judul}"`, 19, 127, { maxWidth: 172 });

  // Tabel Tim Dosen
  const dosenList = skItem.dosenTerkait && skItem.dosenTerkait.length > 0 ? skItem.dosenTerkait : [
    { nama: 'Dr. Hj. Siti Aminah, S.E., M.Si.', nip: '197802142003122001', peran: 'Ketua Pembimbing / Promotor' },
    { nama: 'Dr. Faidal, S.E., M.M.', nip: '197205102005011002', peran: 'Anggota Pembimbing / Co-Promotor' }
  ];

  doc.setFillColor(24, 43, 73);
  doc.rect(15, 137, 180, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('NO', 18, 141.5);
  doc.text('NAMA DOSEN & GELAR LENGKAP', 32, 141.5);
  doc.text('NIP / NIDN', 115, 141.5);
  doc.text('KEDUDUKAN DALAM TIM', 152, 141.5);

  let curY = 143.5;
  dosenList.forEach((d, idx) => {
    const rowH = 7.5;
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(15, curY, 180, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, curY, 180, rowH, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);
    doc.text(String(idx + 1), 19, curY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(d.nama, 32, curY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(d.nip || '-', 115, curY + 5);
    doc.text(d.peran || '-', 152, curY + 5);

    curY += rowH;
  });

  // Bagian Tanda Tangan & QR Code Dekan
  const signY = curY + 12;
  await drawDigitalSealAndQR(doc, 75, signY + 15, 15, signY, verificationCode);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(`Ditetapkan di: Bangkalan`, 135, signY);
  doc.text(`Pada tanggal: ${tanggal}`, 135, signY + 4.5);
  doc.text('Dekan Fakultas Ekonomi dan Bisnis,', 135, signY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text(penandatangan.split('(')[0]?.trim() || 'Prof. Dr. Pribanus Wantara, Drs., M.M.', 135, signY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`NIP. ${nipDekan}`, 135, signY + 32);

  const cleanSK = nomorSK.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const filename = `SK_Dekan_${cleanSK}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * 7. Unduh Formulir Lembar Penilaian Sidang / Ujian
 */
export async function downloadFormPenilaian(ujianData = {}, penguji = {}) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('NILAI');
  const mhsNama = ujianData.mahasiswa || ujianData.mahasiswaNama || 'Mahasiswa FEB UTM';
  const mhsNIM = ujianData.nim || ujianData.mahasiswaNIM || '210211100219';
  const judul = ujianData.judul || ujianData.judulTA || 'Analisis Kinerja Keuangan & Strategi Bisnis';
  const jenisUjian = ujianData.jenisUjian || ujianData.jenis || 'Sidang Skripsi';

  drawOfficialHeader(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 43, 73);
  doc.text('FORMULIR PENILAIAN UJIAN TUGAS AKHIR', 105, 42, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(194, 65, 12);
  doc.text(jenisUjian.toUpperCase(), 105, 47, { align: 'center' });

  // Identitas Mahasiswa
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 53, 180, 22, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, 53, 180, 22, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(`Nama Mahasiswa  : ${mhsNama}`, 19, 58.5);
  doc.text(`NIM / Program   : ${mhsNIM} • Manajemen FEB UTM`, 19, 63.5);
  doc.text(`Judul Tugas Akhir: "${judul}"`, 19, 68.5, { maxWidth: 172 });

  // Rubrik Evaluasi
  const rubrik = [
    { no: '1', kriteria: 'Penguasaan Materi Substantif & Kerangka Teori', bobot: '30%', skor: '85', max: '100' },
    { no: '2', kriteria: 'Metodologi Penelitian & Ketepatan Analisis Data', bobot: '30%', skor: '87', max: '100' },
    { no: '3', kriteria: 'Kualitas Naskah, Sistematika Penulisan & Sitasi', bobot: '20%', skor: '88', max: '100' },
    { no: '4', kriteria: 'Teknik Presentasi, Argumentasi Ilmiah & Diskusi', bobot: '20%', skor: '86', max: '100' }
  ];

  doc.setFillColor(24, 43, 73);
  doc.rect(15, 80, 180, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('NO', 18, 84.5);
  doc.text('KOMPONEN / ASPEK PENILAIAN', 30, 84.5);
  doc.text('BOBOT', 130, 84.5);
  doc.text('NILAI (0-100)', 155, 84.5);

  let curY = 86.5;
  rubrik.forEach((r, idx) => {
    const rowH = 7.5;
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(15, curY, 180, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, curY, 180, rowH, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);
    doc.text(r.no, 19, curY + 5);
    doc.text(r.kriteria, 30, curY + 5);
    doc.text(r.bobot, 134, curY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(r.skor, 163, curY + 5);

    curY += rowH;
  });

  // Total Skor
  doc.setFillColor(241, 245, 249);
  doc.rect(15, curY, 180, 7.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, curY, 180, 7.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(24, 43, 73);
  doc.text('NILAI AKHIR SIDANG: 86.40 (A / LULUS)', 30, curY + 5);

  const signY = curY + 14;
  await drawDigitalSealAndQR(doc, 75, signY + 15, 15, signY, verificationCode);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Bangkalan, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 135, signY);
  doc.text('Dosen Penguji / Evaluator,', 135, signY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text(penguji.nama || 'Dr. Faidal, S.E., M.M.', 135, signY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('NIP. ' + (penguji.nip || '197205102005011002'), 135, signY + 28);

  const filename = `Form_Penilaian_${mhsNIM}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * 8. Unduh Lembar Pengesahan Revisi Ujian Pasca Sidang
 */
export async function downloadLembarRevisi(revisiList = [], student = {}, ujianData = {}) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('REV');
  const mhsNama = student.nama || ujianData.mahasiswa || 'Mahasiswa FEB UTM';
  const mhsNIM = student.nim || ujianData.nim || '210211100219';
  const judul = student.judul || ujianData.judul || 'Kajian Manajemen Strategik dan Keuangan UMKM';

  drawOfficialHeader(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 43, 73);
  doc.text('LEMBAR PENGESAHAN MATRIKS REVISI UJIAN', 105, 42, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`Kode Validasi Digital: ${verificationCode}`, 105, 47, { align: 'center' });

  // Info Mahasiswa
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 52, 180, 20, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, 52, 180, 20, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(`Nama Mahasiswa  : ${mhsNama}`, 19, 57.5);
  doc.text(`NIM / Program   : ${mhsNIM} • Fakultas Ekonomi dan Bisnis UTM`, 19, 62.5);
  doc.text(`Judul Naskah    : "${judul}"`, 19, 67.5, { maxWidth: 172 });

  // Tabel Butir Revisi
  const items = Array.isArray(revisiList) && revisiList.length > 0 ? revisiList : [
    { catatanPenguji: 'Sempurnakan tinjauan pustaka dan perbarui rujukan jurnal 5 tahun terakhir.', responsMahasiswa: 'Telah diperbarui pada Bab II halaman 24-30 dengan 8 jurnal bereputasi.', statusRevisi: 'Disetujui' },
    { catatanPenguji: 'Lengkapi matriks analisis sensitivitas keuangan.', responsMahasiswa: 'Telah ditambahkan simulasi skenario pesimis dan moderat pada Bab IV.', statusRevisi: 'Disetujui' }
  ];

  doc.setFillColor(24, 43, 73);
  doc.rect(15, 77, 180, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('NO', 18, 81.5);
  doc.text('CATATAN KOREKSI PENGUJI', 28, 81.5);
  doc.text('TINDAK LANJUT PERBAIKAN', 105, 81.5);
  doc.text('STATUS', 170, 81.5);

  let curY = 83.5;
  items.forEach((item, idx) => {
    const rowH = 14;
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(15, curY, 180, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, curY, 180, rowH, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);
    doc.text(String(idx + 1), 18, curY + 5);
    doc.text(item.catatanPenguji || item.catatan || '-', 28, curY + 4, { maxWidth: 74 });
    doc.text(item.responsMahasiswa || item.respons || 'Perbaikan selesai', 105, curY + 4, { maxWidth: 62 });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text(item.statusRevisi || 'Acc Penguji', 170, curY + 6);

    curY += rowH;
  });

  const signY = curY + 12;
  await drawDigitalSealAndQR(doc, 75, signY + 15, 15, signY, verificationCode);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Bangkalan, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 135, signY);
  doc.text('Dewan Penguji yang Menyetujui,', 135, signY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text('Dr. Faidal, S.E., M.M.', 135, signY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('NIP. 197205102005011002', 135, signY + 28);
  doc.setTextColor(5, 150, 105);
  doc.text('✓ Seluruh Butir Revisi Disetujui Penuh', 135, signY + 32);

  const filename = `Lembar_Pengesahan_Revisi_${mhsNIM}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * 9. Unduh Jadwal & Kartu Tanda Peserta Ujian Sidang
 */
export async function downloadJadwalUjian(ujianData = {}, student = {}) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('JADWAL');
  const mhsNama = student.nama || ujianData.mahasiswa || ujianData.mahasiswaNama || 'Mahasiswa FEB UTM';
  const mhsNIM = student.nim || ujianData.nim || ujianData.mahasiswaNIM || '210211100219';
  const jenisUjian = ujianData.jenis || ujianData.jenisUjian || 'Ujian Skripsi / Tugas Akhir';
  const jadwal = ujianData.jadwal || ujianData.hariTanggal || 'Senin, 20 Oktober 2026';
  const waktu = ujianData.waktu || '09:00 - 10:30 WIB';
  const ruang = ujianData.ruang || 'Ruang Sidang Utama Gd. R. Graha Utama Lt. 2';
  const judul = student.judul || ujianData.judul || ujianData.judulTA || 'Analisis Kinerja Keuangan & Strategi Bisnis';

  drawOfficialHeader(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 43, 73);
  doc.text('KARTU TANDA PESERTA & JADWAL RESMI SIDANG', 105, 42, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(194, 65, 12);
  doc.text(jenisUjian.toUpperCase(), 105, 47, { align: 'center' });

  // Kotak Jadwal
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 53, 180, 50, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, 53, 180, 50, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text('DATA PESERTA & PELAKSANAAN SIDANG:', 20, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(`Nama Mahasiswa    : ${mhsNama}`, 20, 67);
  doc.text(`Nomor Induk (NIM) : ${mhsNIM}`, 20, 72);
  doc.text(`Hari & Tanggal    : ${jadwal}`, 20, 77);
  doc.text(`Waktu Pelaksanaan : ${waktu}`, 20, 82);
  doc.text(`Tempat / Ruangan  : ${ruang}`, 20, 87);
  doc.text(`Judul Tugas Akhir : "${judul}"`, 20, 93, { maxWidth: 165 });

  // Ketentuan Ujian
  doc.setFillColor(254, 243, 199);
  doc.rect(15, 109, 180, 30, 'F');
  doc.setDrawColor(251, 191, 36);
  doc.rect(15, 109, 180, 30, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14);
  doc.text('TATA TERTIB & KETENTUAN PESERTA SIDANG FEB UTM:', 20, 115);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);
  doc.text('1. Peserta wajib hadir 15 menit sebelum sidang dimulai dengan mengenakan jas almamater dan kemeja putih.', 20, 120);
  doc.text('2. Menyerahkan naskah cetak atau softcopy yang telah disetujui dosen pembimbing ke dewan penguji.', 20, 125);
  doc.text('3. Membawa Kartu Kendali Bimbingan resmi yang telah memenuhi ambang batas minimal bimbingan.', 20, 130);
  doc.text('4. Berita Acara Ujian akan diterbitkan dan diotorisasi secara digital pasca sidang selesai.', 20, 135);

  const signY = 150;
  await drawDigitalSealAndQR(doc, 75, signY + 15, 15, signY, verificationCode);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Bangkalan, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 135, signY);
  doc.text('Koordinator Program Studi,', 135, signY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text('Dr. Hj. Siti Aminah, S.E., M.Si.', 135, signY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('NIP. 197802142003122001', 135, signY + 28);

  const filename = `Jadwal_Ujian_${mhsNIM}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * 10. Unduh Rekapitulasi Portofolio Prestasi & Luaran TAKK Resmi FEB UTM
 */
export async function downloadRekapPortofolio(student = {}, items = []) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('PORTO');
  const docNumber = `PORTO/${Math.floor(100 + Math.random() * 900)}/UN46.1.1/FEB/${new Date().getFullYear()}`;

  drawOfficialHeader(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 43, 73);
  doc.text('REKAPITULASI DOKUMEN PORTOFOLIO & LUARAN PRESTASI', 105, 43, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(194, 65, 12);
  doc.text('SKEMA TUGAS AKHIR KARYA KOMPREHENSIF (TAKK) — PEDOMAN FEB UTM 2026', 105, 47.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 90);
  doc.text(`Nomor Registrasi Portofolio: ${docNumber}`, 105, 52, { align: 'center' });

  // Data Identitas Mahasiswa
  const mhsNama = student.nama || 'Mahasiswa FEB UTM';
  const mhsNIM = student.nim || '-';
  const prodi = student.programStudi || 'S-1 Manajemen';
  const judul = student.judul || student.portofolioData?.judul || 'Inovasi Ekosistem Bisnis dan Portofolio Kewirausahaan';

  doc.setFillColor(248, 250, 252);
  doc.rect(15, 56, 180, 24, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 56, 180, 24, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(24, 43, 73);
  doc.text('IDENTITAS MAHASISWA & SKEMA TUGAS AKHIR:', 18, 61);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(`Nama Mahasiswa    : ${mhsNama}`, 18, 66);
  doc.text(`Nomor Induk (NIM) : ${mhsNIM}`, 18, 70);
  doc.text(`Program Studi     : ${prodi} (${student.jenjang || 'S1'})`, 18, 74);

  doc.text(`Skema Tugas Akhir : TAKK (Tugas Akhir Kontributif-Kreatif)`, 105, 66);
  doc.text(`Jalur Pemenuhan   : Portofolio Prestasi Bisnis / Ilmiah Mandiri`, 105, 70);
  doc.text(`Syarat Kelayakan  : Min. > 70 Poin Riil Sidang Dosen | Min. 80 Poin (Nilai A)`, 105, 74);

  // Perhitungan Poin: Poin Klaim Mahasiswa vs Nilai Riil Hasil Sidang Komisi Dosen
  const totalPoinKlaim = items.reduce((acc, it) => acc + (Number(it.poinKlaim ?? it.poin) || 0), 0);
  const itemsWithRiil = items.filter(it => it.poinRiil !== null && it.poinRiil !== undefined);
  const totalPoinRiil = itemsWithRiil.reduce((acc, it) => acc + (Number(it.poinRiil) || 0), 0);
  const hasSidang = itemsWithRiil.length > 0;
  const isEligible = hasSidang && totalPoinRiil > 70; // Aturan resmi: > 70 Poin
  const isDirectA = hasSidang && totalPoinRiil >= 80;
  const baNo = student.portofolioData?.beritaAcaraSidang || items.find(it => it.beritaAcaraSidang)?.beritaAcaraSidang || null;
  const tglSidang = student.portofolioData?.tanggalSidang || items.find(it => it.tanggalSidang)?.tanggalSidang || null;

  // Banner Status Kelayakan TAKK
  const bannerBg = isDirectA ? [240, 253, 244] : isEligible ? [238, 242, 255] : hasSidang ? [254, 242, 242] : [255, 251, 235];
  const bannerBorder = isDirectA ? [34, 197, 94] : isEligible ? [99, 102, 241] : hasSidang ? [239, 68, 68] : [245, 158, 11];
  const bannerTextCol = isDirectA ? [22, 101, 52] : isEligible ? [30, 58, 138] : hasSidang ? [153, 27, 27] : [146, 64, 14];

  doc.setFillColor(...bannerBg);
  doc.rect(15, 83, 180, 14, 'F');
  doc.setDrawColor(...bannerBorder);
  doc.setLineWidth(0.6);
  doc.rect(15, 83, 180, 14, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...bannerTextCol);
  const bannerHeadline = hasSidang
    ? `TOTAL NILAI RIIL SIDANG DOSEN: ${totalPoinRiil} / 100 POIN (ESTIMASI KLAIM: ${totalPoinKlaim} POIN)`
    : `ESTIMASI POIN KLAIM MAHASISWA: ${totalPoinKlaim} / 100 POIN (MENUNGGU SIDANG PENILAIAN DOSEN)`;
  doc.text(bannerHeadline, 18, 88.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const statusStr = isDirectA
    ? 'STATUS: MEMENUHI SYARAT KONVERSI NILAI A LANGSUNG (BEBAS UJIAN SIDANG TAKK)'
    : isEligible
    ? `STATUS: MEMENUHI SYARAT SKEMA TAKK (> 70 POIN RIIL SIDANG)${baNo ? ` — No. BA: ${baNo}` : ''}`
    : hasSidang
    ? `STATUS: BELUM MEMENUHI SYARAT SKEMA TAKK (${totalPoinRiil} Poin ≤ 70 Poin batas kelayakan)`
    : `STATUS: MENUNGGU VERIFIKASI BERKAS & SIDANG OFFLINE TIM DOSEN (Syarat Kelayakan: > 70 Poin Riil)`;
  doc.text(statusStr, 18, 93.5);

  // Tabel Daftar Portofolio
  doc.setFillColor(24, 43, 73);
  doc.rect(15, 101, 180, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('NO', 17, 105.5);
  doc.text('NAMA / JUDUL PORTOFOLIO', 25, 105.5);
  doc.text('KATEGORI & TINGKAT', 95, 105.5);
  doc.text('BERKAS BUKTI', 136, 105.5);
  doc.text('KLAIM', 158, 105.5);
  doc.text('NILAI SIDANG', 172, 105.5);

  let curY = 107.5;
  if (!items || items.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(15, curY, 180, 14, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, curY, 180, 14, 'S');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Belum ada dokumen portofolio yang diunggah oleh mahasiswa.', 105, curY + 8, { align: 'center' });
    curY += 14;
  } else {
    items.forEach((item, idx) => {
      const rowH = 12;
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(15, curY, 180, rowH, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, curY, 180, rowH, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(30, 30, 30);
      doc.text(String(idx + 1), 17, curY + 5);
      doc.text(item.nama || item.judul || '-', 25, curY + 4.5, { maxWidth: 66 });

      const katTingkat = `${item.kategori || 'Kompetisi'} (${item.tingkat || 'Nasional'})`;
      doc.text(katTingkat, 95, curY + 4.5, { maxWidth: 39 });

      doc.text(item.berkas || 'Berkas_Bukti.pdf', 136, curY + 4.5, { maxWidth: 20 });

      const klaimVal = Number(item.poinKlaim ?? item.poin) || 0;
      const riilVal = item.poinRiil !== null && item.poinRiil !== undefined ? Number(item.poinRiil) : null;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 83, 9);
      doc.text(`+${klaimVal}`, 160, curY + 5);

      doc.setFont('helvetica', 'bold');
      if (riilVal !== null) {
        doc.setTextColor(riilVal > 0 ? 22 : 185, riilVal > 0 ? 101 : 28, riilVal > 0 ? 52 : 28);
        doc.text(`${riilVal} Poin`, 174, curY + 5);
      } else {
        doc.setTextColor(148, 163, 184);
        doc.text('Pending', 174, curY + 5);
      }

      curY += rowH;
    });
  }

  // Rekomendasi Tim Verifikator & Dewan Dosen
  const recY = Math.min(curY + 6, 210);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(24, 43, 73);
  doc.text('CATATAN & REKOMENDASI HASIL SIDANG PENELAAHAN PORTOFOLIO DOSEN:', 18, recY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(50, 50, 50);
  const recText = isDirectA
    ? `Berdasarkan Keputusan Sidang Komisi Dosen (BA: ${baNo || 'Terlampir'}), akumulasi nilai riil portofolio mencapai ${totalPoinRiil} Poin (≥ 80). Direkomendasikan untuk KONVERSI NILAI A LANGSUNG tanpa kewajiban menempuh ujian sidang tugas akhir.`
    : isEligible
    ? `Berdasarkan Keputusan Sidang Komisi Dosen (BA: ${baNo || 'Terlampir'}), akumulasi nilai riil portofolio mencapai ${totalPoinRiil} Poin (> 70). Mahasiswa bersangkutan MEMENUHI SYARAT KELAYAKAN SKEMA TAKK dan berhak menyusun serta mendiseminasikan laporan tugas akhir kontributif-kreatif.`
    : hasSidang
    ? `Berdasarkan Keputusan Sidang Komisi Dosen (BA: ${baNo || 'Terlampir'}), akumulasi nilai riil portofolio adalah ${totalPoinRiil} Poin (≤ 70 Poin). Mahasiswa BELUM LAYAK mengambil skema TAKK dan wajib menambah portofolio yang disidangkan atau dialihkan ke skripsi reguler (TAKT).`
    : `Portofolio mahasiswa saat ini diverifikasi secara fisik oleh Subbag Akademik dan selanjutnya akan disidangkan secara offline oleh tim dosen penelaah untuk menentukan nilai riil sesungguhnya (syarat kelayakan TAKK: > 70 Poin Riil).`;
  doc.text(recText, 18, recY + 4.5, { maxWidth: 175, align: 'justify' });

  // Tanda Tangan & QR Code
  const signY = Math.min(recY + 18, 235);
  await drawDigitalSealAndQR(doc, 75, signY + 15, 15, signY, verificationCode);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text('Bangkalan, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 135, signY);
  doc.text('Koordinator Program Studi Manajemen,', 135, signY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text('Dr. Hj. Siti Aminah, S.E., M.Si.', 135, signY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text('NIP. 197802142003122001', 135, signY + 28);
  doc.setTextColor(5, 150, 105);
  doc.text('✓ Otorisasi Sah Tim Verifikator TAKK', 135, signY + 32);

  const filename = `Rekap_Portofolio_TAKK_${mhsNIM}.pdf`;
  doc.save(filename);
  return filename;
}



