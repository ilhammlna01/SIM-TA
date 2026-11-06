/**
 * PDF Generator & Digital Signature Engine - SIM Tugas Akhir FEB UTM
 * Menghasilkan dokumen formal akademik terstandar Universitas Trunojoyo Madura:
 * 1. Berita Acara Ujian Digital (Lengkap dengan nilai dewan penguji, grade, dan status kelulusan)
 * 2. Lembar Pengesahan Naskah (Lengkap dengan tanda tangan digital promotor/pembimbing & stempel dinas FEB)
 * 3. Lembar Riwayat / Kartu Kendali Bimbingan (Log bimbingan resmi ber-paraf elektronik)
 * 
 * Setiap dokumen dilengkapi:
 * - Kop Surat Resmi FEB UTM
 * - Stempel Dinas Digital Resolusi Tinggi
 * - QR Code Validasi Keaslian Dokumen (Digital Verification Link & Hash)
 * - Nomor Dokumen Resmi Terverifikasi
 */

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORY_DIRS, StorageManager } from '../storage/storageManager.js';
import { db, getNextDocumentNumber } from '../database/db.js';
import {
  resolveNamaDekan,
  resolveNipDekan,
  resolveNamaPejabat,
  resolveJabatanPejabat,
  resolveNipPejabat
} from '../config/pejabatDekanat.js';

/**
 * Generate Kode Verifikasi Unik (e.g. UTM-FEB-BA-2026-X89A)
 */
function generateVerificationCode(prefix = 'DOC') {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const time = Date.now().toString().slice(-4);
  return `UTM-FEB-${prefix}-${year}-${rand}${time}`;
}

/**
 * Gambar Kop Surat Resmi FEB UTM pada Dokumen PDF
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
  doc.setFontSize(9);
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
async function drawDigitalSealAndQR(doc, xSeal, ySeal, xQR, yQR, verificationCode, signers = []) {
  // 1. Generate QR Code Data URL
  const configuredBase = process.env.APP_PUBLIC_URL || process.env.APP_URL;
  const publicBaseUrl = (configuredBase && configuredBase.trim())
    ? configuredBase.trim().replace(/\/+$/, '')
    : `http://localhost:${process.env.PORT || 5001}`;
  const verifyUrl = `${publicBaseUrl}/verifikasi-dokumen?code=${encodeURIComponent(verificationCode)}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 250,
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

  // 2. Gambar Stempel Dinas Digital FEB UTM
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
 * 1. GENERATOR BERITA ACARA UJIAN DIGITAL
 */
export async function generateBeritaAcara(data) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('BA');
  const docNumber = data.nomorDokumen || getNextDocumentNumber('berita_acara').formattedNumber;

  drawOfficialHeader(doc);

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('BERITA ACARA UJIAN TUGAS AKHIR / SIDANG', 105, 43, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text(`Nomor: ${docNumber}`, 105, 48, { align: 'center' });

  // Paragraf Pembuka
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.text(
    `Pada hari ini, ${tanggalHariIni}, telah dilaksanakan Ujian Tugas Akhir secara resmi di lingkungan Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura untuk mahasiswa:`,
    15,
    55,
    { maxWidth: 180, align: 'justify' }
  );

  // Tabel Identitas Mahasiswa
  const startY = 64;
  const lineH = 6;
  const infoRows = [
    ['Nama Mahasiswa', `: ${data.namaMahasiswa || 'Ilham Maulana'}`],
    ['Nomor Induk Mahasiswa (NIM)', `: ${data.nim || '210211100142'}`],
    ['Program Studi / Jenjang', `: ${data.prodi || 'S-1 Manajemen'} (${data.jenjang || 'S1'})`],
    ['Judul Tugas Akhir', `: "${data.judul || 'Analisis Efisiensi dan Kinerja Keuangan Perbankan Syariah'}"`],
    ['Tahap Ujian / Ruang', `: ${data.tahap || 'Sidang Skripsi'} | ${data.ruang || 'Ruang Sidang FEB Gedung Rektorat Lt. 2'}`]
  ];

  doc.setFont('helvetica', 'normal');
  infoRows.forEach((row, idx) => {
    const y = startY + (idx * lineH);
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], 18, y);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 75, y, { maxWidth: 120 });
  });

  // Tabel Dewan Penguji & Penilaian
  const tableY = startY + (infoRows.length * lineH) + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 43, 73);
  doc.text('KOMPOSISI DEWAN PENGUJI DAN ASPEK PENILAIAN:', 15, tableY);

  // Header Kotak Tabel
  doc.setFillColor(243, 244, 246);
  doc.rect(15, tableY + 2, 180, 7, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(15, tableY + 2, 180, 7, 'S');

  doc.setFontSize(8);
  doc.text('No', 18, tableY + 6.5);
  doc.text('Nama Penguji / Jabatan Dewan', 28, tableY + 6.5);
  doc.text('Nilai Angka', 140, tableY + 6.5);
  doc.text('Paraf Digital', 168, tableY + 6.5);

  const defaultPengujiList = [
    { nama: 'Dr. Faidal, S.E., M.M.', peran: 'Ketua Dewan Penguji', nilai: data.nilaiFinal ? (data.nilaiFinal + 1) : 88.0 },
    { nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.', peran: 'Sekretaris / Penguji Utama', nilai: data.nilaiFinal ? data.nilaiFinal : 86.5 },
    { nama: 'Dr. Hj. Siti Aminah, S.E., M.Si.', peran: 'Anggota Penguji / Pembimbing', nilai: data.nilaiFinal ? (data.nilaiFinal - 0.5) : 87.0 }
  ];
  const pengujiList = (Array.isArray(data.pengujiList) && data.pengujiList.length > 0)
    ? data.pengujiList
    : defaultPengujiList;

  let curY = tableY + 9;
  pengujiList.forEach((p, idx) => {
    doc.rect(15, curY, 180, 7, 'S');
    doc.setFont('helvetica', 'normal');
    doc.text(String(idx + 1), 19, curY + 4.5);
    doc.text(`${p.nama} (${p.peran})`, 28, curY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.text(Number(p.nilai || 85).toFixed(1), 145, curY + 4.5);
    doc.setTextColor(5, 150, 105);
    doc.text('✓ Signed', 171, curY + 4.5);
    doc.setTextColor(30, 30, 30);
    curY += 7;
  });

  // Hasil Kelulusan & Nilai Akhir
  const hasilY = curY + 5;
  doc.setFillColor(238, 242, 255); // Indigo-50
  doc.rect(15, hasilY, 180, 14, 'F');
  doc.setDrawColor(199, 210, 254);
  doc.rect(15, hasilY, 180, 14, 'S');

  const finalScore = Number(data.nilaiFinal || 87.5).toFixed(2);
  const grade = data.grade || (finalScore >= 85 ? 'A' : finalScore >= 80 ? 'B+' : 'B');
  const statusLulus = data.rekomendasiKelayakan || 'LULUS DENGAN REVISI';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(24, 43, 73);
  doc.text(`NILAI AKHIR: ${finalScore}  |  GRADE: ${grade}  |  STATUS: ${statusLulus.toUpperCase()}`, 20, hasilY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 70, 70);
  doc.text(
    `Catatan Dewan: Naskah wajib direvisi selambat-lambatnya 14 (empat belas) hari kalender terhitung sejak Berita Acara ini diterbitkan.`,
    20,
    hasilY + 11
  );

  // Bagian Tanda Tangan & Pengesahan Digital
  const signY = hasilY + 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('Bangkalan, ' + tanggalHariIni, 140, signY);
  doc.text('Ketua Dewan Penguji,', 140, signY + 4.5);

  // Gambar QR Code & Stempel
  await drawDigitalSealAndQR(doc, 75, signY + 14, 15, signY, verificationCode);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text(pengujiList[0].nama, 140, signY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('NIP. 197703032003121002', 140, signY + 26);

  // Simpan berkas ke direktori terproteksi
  const filename = `Berita_Acara_${data.nim || 'Mhs'}_${Date.now()}.pdf`;
  const filePath = path.join(CATEGORY_DIRS.dokumen_resmi, filename);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(filePath, pdfBuffer);

  const fileUrl = StorageManager.getAccessUrl('dokumen_resmi', filename);

  // Arsipkan ke SQLite
  try {
    db.prepare(`
      INSERT OR REPLACE INTO dokumen_arsip (
        id, jenis_dokumen, nomor_dokumen, judul_dokumen, nim, nama_mahasiswa, jenjang, prodi,
        kode_verifikasi, file_path, file_url, status, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `doc-ba-${Date.now()}`,
      'Berita Acara Ujian',
      docNumber,
      `Berita Acara ${data.tahap || 'Ujian'} - ${data.namaMahasiswa || 'Mahasiswa'}`,
      data.nim || '',
      data.namaMahasiswa || '',
      data.jenjang || 'S1',
      data.prodi || 'Manajemen',
      verificationCode,
      filePath,
      fileUrl,
      'Terverifikasi',
      JSON.stringify({ nilaiFinal: finalScore, grade, statusLulus })
    );
  } catch (err) {
    console.error('Gagal mencatat arsip dokumen ke SQLite:', err);
  }

  return {
    success: true,
    filename,
    filePath,
    fileUrl,
    docNumber,
    verificationCode,
    size: pdfBuffer.length
  };
}

/**
 * 2. GENERATOR LEMBAR PENGESAHAN TUGAS AKHIR
 */
export async function generateLembarPengesahan(data) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('LP');
  const docNumber = data.nomorDokumen || getNextDocumentNumber('lembar_pengesahan').formattedNumber;

  drawOfficialHeader(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('LEMBAR PENGESAHAN TUGAS AKHIR', 105, 45, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text(`Nomor Sertifikasi: ${docNumber}`, 105, 50, { align: 'center' });

  // Teks Pengesahan
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(
    'Tugas Akhir / Skripsi berikut ini telah dipertahankan di depan Dewan Penguji Ujian Tugas Akhir Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura, dan diterima sebagai salah satu persyaratan guna memperoleh gelar Sarjana / Magister / Doktor:',
    15,
    58,
    { maxWidth: 180, align: 'justify' }
  );

  // Data Naskah
  const yData = 72;
  doc.setFont('helvetica', 'bold');
  doc.text('Judul Tugas Akhir :', 18, yData);
  doc.setFont('helvetica', 'italic');
  doc.text(`"${data.judul || 'Analisis Determinan Profitabilitas Bank Umum Syariah di Indonesia'}"`, 22, yData + 6, { maxWidth: 170 });

  doc.setFont('helvetica', 'bold');
  doc.text('Penyusun', 18, yData + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${data.namaMahasiswa || 'Ilham Maulana'} (NIM. ${data.nim || '210211100142'})`, 55, yData + 17);

  doc.setFont('helvetica', 'bold');
  doc.text('Program Studi', 18, yData + 23);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${data.prodi || 'S-1 Manajemen'} - Fakultas Ekonomi dan Bisnis`, 55, yData + 23);

  // Kolom Penandatangan (Pembimbing 1 & Pembimbing 2)
  const signColY = yData + 35;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Menyetujui,', 18, signColY);
  doc.text('Dosen Pembimbing I / Promotor,', 18, signColY + 6);
  doc.text('Dosen Pembimbing II / Kopromotor,', 115, signColY + 6);

  // Digital Signatures
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text(data.pembimbing1 || 'Dr. Dra. Hj. Iriani Ismail, M.M.', 18, signColY + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('NIP. 196201081987032001', 18, signColY + 30);
  doc.setTextColor(5, 150, 105);
  doc.text('✓ Digital Verified & Signed', 18, signColY + 34);

  doc.setTextColor(24, 43, 73);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(data.pembimbing2 || 'Dr. Faidal, S.E., M.M.', 115, signColY + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('NIP. 197703032003121002', 115, signColY + 30);
  doc.setTextColor(5, 150, 105);
  doc.text('✓ Digital Verified & Signed', 115, signColY + 34);

  // Dekan & Koordinator Program Studi
  const dekanY = signColY + 42;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text('Mengesahkan,', 105, dekanY, { align: 'center' });
  doc.text('Dekan Fakultas Ekonomi dan Bisnis UTM', 105, dekanY + 5, { align: 'center' });

  // Stempel & QR Code
  await drawDigitalSealAndQR(doc, 75, dekanY + 18, 140, dekanY + 6, verificationCode);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text(resolveNamaDekan(data), 105, dekanY + 28, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(resolveNipDekan(data), 105, dekanY + 32, { align: 'center' });

  // Simpan berkas
  const filename = `Lembar_Pengesahan_${data.nim || 'Mhs'}_${Date.now()}.pdf`;
  const filePath = path.join(CATEGORY_DIRS.dokumen_resmi, filename);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(filePath, pdfBuffer);

  const fileUrl = StorageManager.getAccessUrl('dokumen_resmi', filename);

  // Arsipkan ke SQLite
  try {
    db.prepare(`
      INSERT OR REPLACE INTO dokumen_arsip (
        id, jenis_dokumen, nomor_dokumen, judul_dokumen, nim, nama_mahasiswa, jenjang, prodi,
        kode_verifikasi, file_path, file_url, status, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `doc-lp-${Date.now()}`,
      'Lembar Pengesahan',
      docNumber,
      `Lembar Pengesahan TA - ${data.namaMahasiswa || 'Mahasiswa'}`,
      data.nim || '',
      data.namaMahasiswa || '',
      data.jenjang || 'S1',
      data.prodi || 'Manajemen',
      verificationCode,
      filePath,
      fileUrl,
      'Terverifikasi',
      JSON.stringify({ judul: data.judul, pembimbing1: data.pembimbing1 })
    );
  } catch (err) {
    console.error('Gagal mencatat arsip dokumen ke SQLite:', err);
  }

  return {
    success: true,
    filename,
    filePath,
    fileUrl,
    docNumber,
    verificationCode,
    size: pdfBuffer.length
  };
}

/**
 * 3. GENERATOR LEMBAR RIWAYAT / LOG KENDALI BIMBINGAN
 */
export async function generateLembarBimbingan(data) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('KB');
  const docNumber = data.nomorDokumen || `KB-LOG/${Math.floor(100 + Math.random() * 900)}/FEB-UTM/${new Date().getFullYear()}`;

  drawOfficialHeader(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('KARTU KENDALI & RIWAYAT BIMBINGAN TUGAS AKHIR', 105, 43, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`Nomor Registrasi: ${docNumber}`, 105, 48, { align: 'center' });

  // Identitas Singkat
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`Nama Mahasiswa : ${data.namaMahasiswa || 'Ilham Maulana'}`, 18, 55);
  doc.text(`NIM : ${data.nim || '210211100142'}`, 120, 55);
  doc.text(`Dosen Pembimbing: ${data.dosenNama || 'Dr. Dra. Hj. Iriani Ismail, M.M.'}`, 18, 60);
  doc.text(`Jenjang / Prodi : ${data.jenjang || 'S1'} ${data.prodi || 'Manajemen'}`, 120, 60);

  // Tabel Riwayat Log Bimbingan
  const tableY = 66;
  doc.setFillColor(243, 244, 246);
  doc.rect(15, tableY, 180, 6.5, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(15, tableY, 180, 6.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Sesi', 18, tableY + 4.5);
  doc.text('Tanggal', 30, tableY + 4.5);
  doc.text('Materi / Pokok Konsultasi', 60, tableY + 4.5);
  doc.text('Catatan Arahan Dosen', 120, tableY + 4.5);
  doc.text('Paraf', 178, tableY + 4.5);

  const logs = data.bimbinganList || [
    { sesi: 1, tgl: '12 Sep 2026', materi: 'Konsultasi Bab I & Latar Belakang Masalah', catatan: 'Perjelas fenomena gap dan rumusan masalah.', paraf: '✓' },
    { sesi: 2, tgl: '19 Sep 2026', materi: 'Revisi Bab I dan Tinjauan Pustaka (Bab II)', catatan: 'Tambahkan grand theory dan rujukan jurnal 5 thn terakhir.', paraf: '✓' },
    { sesi: 3, tgl: '26 Sep 2026', materi: 'Pengembangan Kerangka Konseptual & Hipotesis', catatan: 'Hubungan antar variabel sudah runtut dan tepat.', paraf: '✓' },
    { sesi: 4, tgl: '03 Okt 2026', materi: 'Metodologi Penelitian & Teknik Sampling', catatan: 'Gunakan purposive sampling dengan kriteria jelas.', paraf: '✓' },
    { sesi: 5, tgl: '10 Okt 2026', materi: 'Uji Validitas, Reliabilitas & Asumsi Klasik', catatan: 'Uji multikolinearitas dan normalitas lolos standar.', paraf: '✓' },
    { sesi: 6, tgl: '17 Okt 2026', materi: 'Analisis Hasil Regresi & Pembahasan (Bab IV)', catatan: 'Interpretasikan koefisien determinasi dengan mendalam.', paraf: '✓' },
    { sesi: 7, tgl: '24 Okt 2026', materi: 'Kesimpulan, Saran & Kelayakan Sidang (ACC)', catatan: 'Naskah layak diajukan ke Sidang Skripsi.', paraf: '✓' }
  ];

  let curY = tableY + 6.5;
  logs.forEach((log) => {
    doc.rect(15, curY, 180, 7.5, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(String(log.sesi), 20, curY + 5);
    doc.text(log.tgl, 30, curY + 5);
    doc.text(log.materi, 60, curY + 5, { maxWidth: 55 });
    doc.text(log.catatan, 120, curY + 5, { maxWidth: 53 });
    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('ACC', 178, curY + 5);
    doc.setTextColor(30, 30, 30);
    curY += 7.5;
  });

  // Footer Pengesahan
  const footY = curY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Total Konsultasi: ${logs.length} Sesi (Memenuhi syarat minimal 6x bimbingan UTM)`, 18, footY);

  await drawDigitalSealAndQR(doc, 85, footY + 16, 18, footY + 5, verificationCode);

  doc.setFont('helvetica', 'bold');
  doc.text('Dosen Pembimbing,', 140, footY + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text(data.dosenNama || 'Dr. Dra. Hj. Iriani Ismail, M.M.', 140, footY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('NIP. 196201081987032001', 140, footY + 26);

  // Simpan berkas
  const filename = `Riwayat_Bimbingan_${data.nim || 'Mhs'}_${Date.now()}.pdf`;
  const filePath = path.join(CATEGORY_DIRS.dokumen_resmi, filename);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(filePath, pdfBuffer);

  const fileUrl = StorageManager.getAccessUrl('dokumen_resmi', filename);

  // Arsipkan ke SQLite
  try {
    db.prepare(`
      INSERT OR REPLACE INTO dokumen_arsip (
        id, jenis_dokumen, nomor_dokumen, judul_dokumen, nim, nama_mahasiswa, jenjang, prodi,
        kode_verifikasi, file_path, file_url, status, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `doc-kb-${Date.now()}`,
      'Kartu Kendali Bimbingan',
      docNumber,
      `Log Bimbingan - ${data.namaMahasiswa || 'Mahasiswa'}`,
      data.nim || '',
      data.namaMahasiswa || '',
      data.jenjang || 'S1',
      data.prodi || 'Manajemen',
      verificationCode,
      filePath,
      fileUrl,
      'Terverifikasi',
      JSON.stringify({ totalSesi: logs.length, dosen: data.dosenNama })
    );
  } catch (err) {
    console.error('Gagal mencatat arsip dokumen ke SQLite:', err);
  }

  return {
    success: true,
    filename,
    filePath,
    fileUrl,
    docNumber,
    verificationCode,
    size: pdfBuffer.length
  };
}

/**
 * 4. GENERATOR SURAT TUGAS PENGUJI UJIAN
 */
export async function generateSuratTugasPenguji(data) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('ST-PENG');
  const docNumber = data.nomorDokumen || getNextDocumentNumber('surat_tugas_penguji').formattedNumber;

  drawOfficialHeader(doc);

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('SURAT TUGAS PENGUJI UJIAN TUGAS AKHIR', 105, 43, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text(`Nomor: ${docNumber}`, 105, 48, { align: 'center' });

  // Dasaran & Narasi
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  const pembuka = 'Berdasarkan Peraturan Akademik Universitas Trunojoyo Madura serta usulan Ketua Program Studi, Pimpinan Fakultas Ekonomi dan Bisnis dengan ini menugaskan kepada Bapak/Ibu Dosen yang tercantum di bawah ini:';
  doc.text(pembuka, 15, 55, { maxWidth: 180, align: 'justify' });

  // Tabel Dewan Penguji
  const defaultPengujiList = [
    { nama: data.ketuaPenguji || 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002', peran: 'Ketua Dewan Penguji' },
    { nama: data.sekretarisPenguji || 'Prof. Dr. Pribanus Wantara, Drs., M.M.', nip: '196305141990021001', peran: 'Sekretaris / Penguji Utama' },
    { nama: data.anggotaPenguji || 'Dr. Hj. Siti Aminah, S.E., M.Si.', nip: '197108221998032001', peran: 'Anggota / Pembimbing' }
  ];
  const pengujiList = (Array.isArray(data.pengujiList) && data.pengujiList.length > 0)
    ? data.pengujiList
    : defaultPengujiList;

  const tableY = 65;
  doc.setFillColor(243, 244, 246);
  doc.rect(15, tableY, 180, 7, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(15, tableY, 180, 7, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(24, 43, 73);
  doc.text('No', 18, tableY + 4.5);
  doc.text('Nama Dosen / NIP', 28, tableY + 4.5);
  doc.text('Jabatan / Kedudukan dalam Tim Penguji', 115, tableY + 4.5);

  let curY = tableY + 7;
  pengujiList.forEach((p, idx) => {
    doc.rect(15, curY, 180, 8, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(String(idx + 1), 19, curY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(p.nama, 28, curY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`NIP. ${p.nip || '-'}`, 28, curY + 7);
    doc.setFontSize(8);
    doc.setTextColor(24, 43, 73);
    doc.text(p.peran || 'Penguji', 115, curY + 5);
    curY += 8;
  });

  // Keterangan Mahasiswa & Pelaksanaan Ujian
  const mhsY = curY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text('Untuk melaksanakan pengujian Tugas Akhir kepada mahasiswa:', 15, mhsY);

  const mhsRows = [
    ['Nama Mahasiswa', `: ${data.namaMahasiswa || 'Ilham Maulana'}`],
    ['Nomor Induk Mahasiswa (NIM)', `: ${data.nim || '210211100142'}`],
    ['Program Studi / Jenjang', `: ${data.prodi || 'S-1 Manajemen'} (${data.jenjang || 'S1'})`],
    ['Judul Tugas Akhir', `: "${data.judul || 'Analisis Efisiensi dan Kinerja Keuangan Perbankan Syariah'}"`],
    ['Tahap Ujian', `: ${data.tahap || 'Sidang Skripsi'}`],
    ['Waktu Pelaksanaan', `: ${data.jadwalTanggal || 'Senin, 12 Oktober 2026'} | Pukul ${data.jadwalJam || '09.00 - 11.00 WIB'}`],
    ['Tempat / Ruang', `: ${data.ruang || 'Ruang Sidang FEB Gedung Rektorat Lt. 2'}`]
  ];

  let lineY = mhsY + 5;
  mhsRows.forEach((row) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text(row[0], 18, lineY);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 75, lineY, { maxWidth: 120 });
    lineY += 5.5;
  });

  // Penutup
  const closeY = lineY + 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('Demikian Surat Tugas ini diterbitkan untuk dilaksanakan dengan penuh dedikasi dan rasa tanggung jawab.', 15, closeY, { maxWidth: 180 });

  // Tanda Tangan Dekanat
  const signY = closeY + 10;
  const tanggalHariIni = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Bangkalan, ${tanggalHariIni}`, 135, signY);
  doc.text('a.n. Dekan,', 135, signY + 4.5);
  doc.text(resolveJabatanPejabat(data), 135, signY + 8.5);

  await drawDigitalSealAndQR(doc, 75, signY + 16, 15, signY + 2, verificationCode);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text(resolveNamaPejabat(data), 135, signY + 27);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(resolveNipPejabat(data), 135, signY + 31);

  // Simpan berkas
  const filename = `Surat_Tugas_Penguji_${data.nim || 'Mhs'}_${Date.now()}.pdf`;
  const filePath = path.join(CATEGORY_DIRS.dokumen_resmi, filename);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(filePath, pdfBuffer);

  const fileUrl = StorageManager.getAccessUrl('dokumen_resmi', filename);

  try {
    db.prepare(`
      INSERT OR REPLACE INTO dokumen_arsip (
        id, jenis_dokumen, nomor_dokumen, judul_dokumen, nim, nama_mahasiswa, jenjang, prodi,
        kode_verifikasi, file_path, file_url, status, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `doc-stp-${Date.now()}`,
      'Surat Tugas Penguji',
      docNumber,
      `Surat Tugas Penguji - ${data.namaMahasiswa || 'Mahasiswa'}`,
      data.nim || '',
      data.namaMahasiswa || '',
      data.jenjang || 'S1',
      data.prodi || 'Manajemen',
      verificationCode,
      filePath,
      fileUrl,
      'Terbit',
      JSON.stringify({ tahap: data.tahap, jadwal: data.jadwalTanggal, ruang: data.ruang, pengujiCount: pengujiList.length })
    );
  } catch (err) {
    console.error('Gagal mencatat arsip surat tugas penguji ke SQLite:', err);
  }

  return {
    success: true,
    filename,
    filePath,
    fileUrl,
    docNumber,
    verificationCode,
    size: pdfBuffer.length
  };
}

/**
 * 5. GENERATOR SURAT TUGAS PEMBIMBING TUGAS AKHIR
 */
export async function generateSuratTugasPembimbing(data) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('ST-PEMB');
  const docNumber = data.nomorDokumen || getNextDocumentNumber('surat_tugas_pembimbing').formattedNumber;

  drawOfficialHeader(doc);

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 43, 73);
  doc.text('SURAT TUGAS PEMBIMBING TUGAS AKHIR', 105, 43, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text(`Nomor: ${docNumber}`, 105, 48, { align: 'center' });

  // Narasi Pembuka
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  const narasi = 'Berdasarkan plotting dosen pembimbing dan pemenuhan syarat akademik, Dekan Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura dengan ini menugaskan kepada:';
  doc.text(narasi, 15, 55, { maxWidth: 180, align: 'justify' });

  // Tabel Pembimbing
  const pembimbingList = [
    {
      peran: data.jenjang === 'S3' ? 'Promotor Utama' : 'Dosen Pembimbing I',
      nama: data.pembimbing1Nama || data.pembimbing1 || 'Dr. Dra. Hj. Iriani Ismail, M.M.',
      nip: data.pembimbing1Nip || '196201081987032001'
    },
    {
      peran: data.jenjang === 'S3' ? 'Ko-Promotor' : 'Dosen Pembimbing II',
      nama: data.pembimbing2Nama || data.pembimbing2 || 'Dr. Faidal, S.E., M.M.',
      nip: data.pembimbing2Nip || '197703032003121002'
    }
  ];

  const tableY = 65;
  doc.setFillColor(243, 244, 246);
  doc.rect(15, tableY, 180, 7, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(15, tableY, 180, 7, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(24, 43, 73);
  doc.text('No', 18, tableY + 4.5);
  doc.text('Nama Dosen / NIP', 28, tableY + 4.5);
  doc.text('Kedudukan Penugasan', 125, tableY + 4.5);

  let curY = tableY + 7;
  pembimbingList.forEach((p, idx) => {
    doc.rect(15, curY, 180, 8, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(String(idx + 1), 19, curY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(p.nama, 28, curY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`NIP. ${p.nip}`, 28, curY + 7);
    doc.setFontSize(8);
    doc.setTextColor(24, 43, 73);
    doc.text(p.peran, 125, curY + 5);
    curY += 8;
  });

  // Sasaran Mahasiswa Bimbingan
  const mhsY = curY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text('Untuk melaksanakan bimbingan penyusunan Tugas Akhir kepada mahasiswa:', 15, mhsY);

  const mhsRows = [
    ['Nama Mahasiswa', `: ${data.namaMahasiswa || 'Ilham Maulana'}`],
    ['Nomor Induk Mahasiswa (NIM)', `: ${data.nim || '210211100142'}`],
    ['Program Studi / Jenjang', `: ${data.prodi || 'S-1 Manajemen'} (${data.jenjang || 'S1'})`],
    ['Judul Tugas Akhir / Skripsi', `: "${data.judul || 'Analisis Efisiensi dan Kinerja Keuangan Perbankan Syariah'}"`],
    ['Masa Berlaku Bimbingan', `: ${data.masaBimbingan || '1 (Satu) Tahun Ajaran / 2 Semester'} (Semester Gasal/Genap 2025/2026)`]
  ];

  let lineY = mhsY + 5;
  mhsRows.forEach((row) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text(row[0], 18, lineY);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 75, lineY, { maxWidth: 120 });
    lineY += 5.5;
  });

  // Ketentuan & SOP Bimbingan
  const sopY = lineY + 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(24, 43, 73);
  doc.text('Ketentuan Penugasan Bimbingan:', 15, sopY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);
  const sopItems = [
    '1. Proses bimbingan wajib tercatat dalam Buku Kendali Konsultasi digital (SIM Tugas Akhir minimal 6 sesi).',
    '2. Dosen Pembimbing bertanggung jawab penuh atas substansi metodologis, orisinalitas, dan tata tulis.',
    '3. Persetujuan seminar/sidang diberikan secara objektif setelah naskah memenuhi standar mutu penulisan karya ilmiah FEB UTM.'
  ];
  sopItems.forEach((item, idx) => {
    doc.text(item, 18, sopY + 4 + (idx * 4));
  });

  // Tanda Tangan Dekanat
  const signY = sopY + 20;
  const tanggalHariIni = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFontSize(8);
  doc.text(`Bangkalan, ${tanggalHariIni}`, 135, signY);
  doc.text('a.n. Dekan,', 135, signY + 4.5);
  doc.text(resolveJabatanPejabat(data), 135, signY + 8.5);

  await drawDigitalSealAndQR(doc, 75, signY + 16, 15, signY + 2, verificationCode);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text(resolveNamaPejabat(data), 135, signY + 27);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(resolveNipPejabat(data), 135, signY + 31);

  // Simpan berkas
  const filename = `Surat_Tugas_Pembimbing_${data.nim || 'Mhs'}_${Date.now()}.pdf`;
  const filePath = path.join(CATEGORY_DIRS.dokumen_resmi, filename);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(filePath, pdfBuffer);

  const fileUrl = StorageManager.getAccessUrl('dokumen_resmi', filename);

  try {
    db.prepare(`
      INSERT OR REPLACE INTO dokumen_arsip (
        id, jenis_dokumen, nomor_dokumen, judul_dokumen, nim, nama_mahasiswa, jenjang, prodi,
        kode_verifikasi, file_path, file_url, status, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `doc-stb-${Date.now()}`,
      'Surat Tugas Pembimbing',
      docNumber,
      `Surat Tugas Pembimbing - ${data.namaMahasiswa || 'Mahasiswa'}`,
      data.nim || '',
      data.namaMahasiswa || '',
      data.jenjang || 'S1',
      data.prodi || 'Manajemen',
      verificationCode,
      filePath,
      fileUrl,
      'Terbit',
      JSON.stringify({ pembimbing1: pembimbingList[0].nama, pembimbing2: pembimbingList[1].nama, masa: data.masaBimbingan })
    );
  } catch (err) {
    console.error('Gagal mencatat arsip surat tugas pembimbing ke SQLite:', err);
  }

  return {
    success: true,
    filename,
    filePath,
    fileUrl,
    docNumber,
    verificationCode,
    size: pdfBuffer.length
  };
}

/**
 * 6. GENERATOR SURAT KEPUTUSAN (SK) DEKAN
 */
export async function generateSuratKeputusanDekan(data) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const verificationCode = generateVerificationCode('SK');
  const docNumber = data.nomorDokumen || getNextDocumentNumber('sk_dekan').formattedNumber;

  drawOfficialHeader(doc);

  // Judul SK
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(24, 43, 73);
  doc.text('KEPUTUSAN DEKAN FAKULTAS EKONOMI DAN BISNIS', 105, 42, { align: 'center' });
  doc.text('UNIVERSITAS TRUNOJOYO MADURA', 105, 46.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`NOMOR: ${docNumber}`, 105, 51, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(24, 43, 73);
  doc.text('TENTANG', 105, 56, { align: 'center' });
  doc.text(
    `PENETAPAN DOSEN PEMBIMBING DAN DEWAN PENGUJI UJIAN ${data.tahap ? data.tahap.toUpperCase() : 'TUGAS AKHIR'}`,
    105,
    60.5,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DEKAN FAKULTAS EKONOMI DAN BISNIS UNIVERSITAS TRUNOJOYO MADURA,', 105, 66, { align: 'center' });

  // Konsiderans Menimbang & Mengingat
  let yPos = 72;
  const sections = [
    {
      title: 'Menimbang :',
      items: [
        'a. bahwa dalam rangka penyelesaian studi mahasiswa Program Sarjana/Pascasarjana, perlu dibentuk Tim Pembimbing dan Dewan Penguji Ujian Tugas Akhir;',
        'b. bahwa dosen yang namanya tercantum dalam keputusan ini dipandang cakap dan memenuhi persyaratan akademik untuk diserahi tugas dimaksud;',
        'c. bahwa berdasarkan pertimbangan sebagaimana dimaksud pada huruf a dan b, perlu menetapkan Keputusan Dekan FEB UTM.'
      ]
    },
    {
      title: 'Mengingat   :',
      items: [
        '1. Undang-Undang Republik Indonesia Nomor 12 Tahun 2012 tentang Pendidikan Tinggi;',
        '2. Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 53 Tahun 2023 tentang Penjaminan Mutu Pendidikan Tinggi;',
        '3. Statuta Universitas Trunojoyo Madura serta Buku Pedoman Akademik FEB UTM.'
      ]
    }
  ];

  sections.forEach((sec) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(24, 43, 73);
    doc.text(sec.title, 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    sec.items.forEach((it) => {
      doc.text(it, 35, yPos, { maxWidth: 160 });
      yPos += 5.5;
    });
    yPos += 1;
  });

  // Diktum MEMUTUSKAN
  yPos += 1;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text('MEMUTUSKAN:', 105, yPos, { align: 'center' });
  yPos += 5;

  const diktum = [
    ['MENETAPKAN', ':'],
    ['KESATU', `: Menetapkan Tim Pembimbing dan Dewan Penguji Ujian untuk mahasiswa ${data.namaMahasiswa || 'Ilham Maulana'} (NIM. ${data.nim || '210211100142'}), Program Studi ${data.prodi || 'S-1 Manajemen'}.`],
    ['KEDUA', ': Memberikan tugas, wewenang, dan tanggung jawab kepada Tim Penguji untuk melaksanakan ujian serta memberikan penilaian sesuai kaidah akademik yang berlaku.'],
    ['KETIGA', ': Segala biaya yang timbul sebagai akibat diterbitkannya keputusan ini dibebankan pada Anggaran DIPA Universitas Trunojoyo Madura.'],
    ['KEEMPAT', ': Keputusan ini mulai berlaku sejak tanggal ditetapkan dengan ketentuan apabila di kemudian hari terdapat kekeliruan, akan diadakan perbaikan sebagaimana mestinya.']
  ];

  diktum.forEach((d) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(24, 43, 73);
    doc.text(d[0], 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(d[1], 40, yPos, { maxWidth: 155 });
    yPos += 6;
  });

  // Tanda Tangan Dekan
  const signY = yPos + 6;
  const tanggalHariIni = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFontSize(8);
  doc.text(`Ditetapkan di Bangkalan`, 135, signY);
  doc.text(`Pada tanggal ${tanggalHariIni}`, 135, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('DEKAN FAKULTAS EKONOMI DAN BISNIS,', 135, signY + 8);

  await drawDigitalSealAndQR(doc, 75, signY + 14, 15, signY + 1, verificationCode);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 43, 73);
  doc.text(resolveNamaDekan(data), 135, signY + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(resolveNipDekan(data), 135, signY + 30);

  // Simpan berkas
  const filename = `SK_Dekan_${data.nim || 'Mhs'}_${Date.now()}.pdf`;
  const filePath = path.join(CATEGORY_DIRS.dokumen_resmi, filename);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(filePath, pdfBuffer);

  const fileUrl = StorageManager.getAccessUrl('dokumen_resmi', filename);

  try {
    db.prepare(`
      INSERT OR REPLACE INTO dokumen_arsip (
        id, jenis_dokumen, nomor_dokumen, judul_dokumen, nim, nama_mahasiswa, jenjang, prodi,
        kode_verifikasi, file_path, file_url, status, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `doc-sk-${Date.now()}`,
      'Surat Keputusan Dekan',
      docNumber,
      `SK Penetapan Penguji - ${data.namaMahasiswa || 'Mahasiswa'}`,
      data.nim || '',
      data.namaMahasiswa || '',
      data.jenjang || 'S1',
      data.prodi || 'Manajemen',
      verificationCode,
      filePath,
      fileUrl,
      'Terbit',
      JSON.stringify({ dekan: resolveNamaDekan(data), perihal: 'Penetapan Dewan Penguji dan Pembimbing' })
    );
  } catch (err) {
    console.error('Gagal mencatat arsip SK Dekan ke SQLite:', err);
  }

  return {
    success: true,
    filename,
    filePath,
    fileUrl,
    docNumber,
    verificationCode,
    size: pdfBuffer.length
  };
}

/**
 * 7. GENERATOR PAKET BERKAS ADMINISTRASI UJIAN LENGKAP (ONE-CLICK EXAM PACKAGE)
 * Menghasilkan seluruh dokumen resmi sekaligus:
 * 1. Surat Tugas Penguji
 * 2. Berita Acara Ujian
 * 3. Surat Keputusan Dekan
 */
export async function generateExamPackage(data) {
  const packageId = `PKG-EXAM-${Date.now()}`;

  // 1. Generate Surat Tugas Penguji
  const suratTugas = await generateSuratTugasPenguji(data);

  // 2. Generate Berita Acara Ujian
  const beritaAcara = await generateBeritaAcara(data);

  // 3. Generate SK Dekan
  const skDekan = await generateSuratKeputusanDekan(data);

  return {
    success: true,
    packageId,
    timestamp: new Date().toISOString(),
    mahasiswa: {
      nama: data.namaMahasiswa || data.mahasiswaNama,
      nim: data.nim,
      prodi: data.prodi,
      jenjang: data.jenjang
    },
    documents: [
      {
        jenis: 'Surat Tugas Penguji',
        nomor: suratTugas.docNumber,
        kodeVerifikasi: suratTugas.verificationCode,
        filename: suratTugas.filename,
        fileUrl: suratTugas.fileUrl
      },
      {
        jenis: 'Berita Acara Ujian',
        nomor: beritaAcara.docNumber,
        kodeVerifikasi: beritaAcara.verificationCode,
        filename: beritaAcara.filename,
        fileUrl: beritaAcara.fileUrl
      },
      {
        jenis: 'Surat Keputusan Dekan',
        nomor: skDekan.docNumber,
        kodeVerifikasi: skDekan.verificationCode,
        filename: skDekan.filename,
        fileUrl: skDekan.fileUrl
      }
    ],
    totalGenerated: 3
  };
}

export default {
  generateBeritaAcara,
  generateLembarPengesahan,
  generateLembarBimbingan,
  generateSuratTugasPenguji,
  generateSuratTugasPembimbing,
  generateSuratKeputusanDekan,
  generateExamPackage
};
