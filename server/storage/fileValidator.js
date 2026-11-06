/**
 * File Validator & Security Inspector - SIM Tugas Akhir FEB UTM
 * Menyediakan verifikasi ketat untuk integritas dan keamanan berkas akademik:
 * 1. Validasi Batas Ukuran File (Maksimal 25MB untuk naskah, 10MB untuk berkas syarat)
 * 2. Whitelist Ekstensi dan MIME Type (.pdf, .docx, .doc)
 * 3. Inspeksi Magic Bytes (Verifikasi struktur biner asli, mencegah file malware berkamuflase)
 * 4. Sanitasi Nama File & Pencegahan Path Traversal
 */

import fs from 'node:fs';
import path from 'node:path';

// Konfigurasi Batas Ukuran Berkas per Kategori
export const MAX_SIZES = {
  naskah: 25 * 1024 * 1024,   // 25 MB untuk naskah skripsi/tesis/disertasi
  syarat: 10 * 1024 * 1024,   // 10 MB untuk berkas syarat (KRS, Transkrip, TOEFL)
  lampiran: 5 * 1024 * 1024,  // 5 MB untuk lampiran/bukti lainnya
  default: 15 * 1024 * 1024   // 15 MB default
};

// MIME Types yang Diizinkan
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];

// Ekstensi yang Diizinkan
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

// Ekstensi Terlarang Berbahaya (Malware / Script)
const FORBIDDEN_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.php', '.phtml', '.js', '.vbs', '.scr',
  '.msi', '.com', '.ps1', '.jar', '.py', '.rb', '.cgi', '.pl'
];

/**
 * Sanitasi nama file untuk mencegah directory traversal dan karakter berbahaya
 * @param {string} originalName 
 * @returns {string} Safe sanitized filename
 */
export function sanitizeFileName(originalName) {
  if (!originalName || typeof originalName !== 'string') {
    return `doc_${Date.now()}.pdf`;
  }

  // Ambil hanya nama file dasar tanpa direktori
  const baseName = path.basename(originalName);

  // Bersihkan karakter null byte dan non-alphanumeric yang berpotensi membahayakan
  const cleaned = baseName
    .replace(/[\0\x00-\x1f\x7f]/g, '') // Null bytes & control chars
    .replace(/\.{2,}/g, '.')           // Path traversal (..)
    .replace(/[^a-zA-Z0-9._-]/g, '_'); // Karakter khusus diubah menjadi underscore

  const ext = path.extname(cleaned).toLowerCase();
  const nameWithoutExt = path.basename(cleaned, ext).substring(0, 80);

  // Bentuk nama file aman dengan timestamp & random token
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${Date.now()}_${randomSuffix}_${nameWithoutExt}${ext}`;
}

/**
 * Periksa keaslian biner file via Magic Bytes
 * @param {Buffer|string} bufferOrPath Buffer atau path file yang diuji
 * @param {string} expectedExt Ekstensi yang diharapkan (.pdf atau .docx)
 * @returns {{ valid: boolean, detectedType: string, error?: string }}
 */
export function verifyMagicBytes(bufferOrPath, expectedExt) {
  let buffer;

  try {
    if (Buffer.isBuffer(bufferOrPath)) {
      buffer = bufferOrPath;
    } else if (typeof bufferOrPath === 'string' && fs.existsSync(bufferOrPath)) {
      const fd = fs.openSync(bufferOrPath, 'r');
      buffer = Buffer.alloc(16);
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);
    } else {
      return { valid: false, detectedType: 'unknown', error: 'Buffer atau berkas tidak dapat dibaca' };
    }

    if (!buffer || buffer.length < 4) {
      return { valid: false, detectedType: 'empty', error: 'Ukuran berkas kosong atau korup' };
    }

    const ext = (expectedExt || '').toLowerCase();

    // 1. Validasi Berkas PDF: Harus diawali dengan '%PDF-' (0x25 0x50 0x44 0x46)
    const isPdfMagic = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    if (isPdfMagic) {
      if (ext === '.pdf') {
        return { valid: true, detectedType: 'application/pdf' };
      }
      return { valid: false, detectedType: 'application/pdf', error: `Header berkas adalah PDF, namun ekstensi file adalah ${ext}` };
    }

    // 2. Validasi Berkas DOCX: Adalah format ZIP yang diawali dengan 'PK\x03\x04' (0x50 0x4B 0x03 0x04)
    const isZipDocxMagic = buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
    if (isZipDocxMagic) {
      if (ext === '.docx' || ext === '.doc') {
        return { valid: true, detectedType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
      }
      return { valid: false, detectedType: 'zip_container', error: `Header berkas adalah format Word/Zip, namun ekstensi file adalah ${ext}` };
    }

    // 3. Deteksi binary executable berbahaya: 'MZ' untuk Windows EXE/DLL (0x4D 0x5A) atau ELF untuk Linux (0x7F 'ELF')
    const isWindowsExe = buffer[0] === 0x4D && buffer[1] === 0x5A;
    const isLinuxElf = buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46;
    if (isWindowsExe || isLinuxElf) {
      return {
        valid: false,
        detectedType: 'executable_binary',
        error: 'Peringatan Keamanan: Berkas terdeteksi sebagai binary executable berbahaya yang disamarkan!'
      };
    }

    // Jika ekstensi PDF/Word tapi magic bytes tidak cocok
    return {
      valid: false,
      detectedType: 'unrecognized_binary',
      error: 'Struktur biner file tidak valid untuk format dokumen resmi (.pdf / .docx).'
    };
  } catch (err) {
    return { valid: false, detectedType: 'error', error: err.message };
  }
}

/**
 * Middleware validasi berkas upload
 * @param {string} category Kategori dokumen ('naskah', 'syarat', 'lampiran')
 */
export function validateUploadRequest(category = 'default') {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Tidak ada berkas yang diunggah. Mohon pilih dokumen PDF atau DOCX.'
      });
    }

    const { originalname, size, path: filePath, mimetype } = req.file;
    const ext = path.extname(originalname).toLowerCase();
    const maxAllowedSize = MAX_SIZES[category] || MAX_SIZES.default;

    // 1. Cek Ekstensi Terlarang
    if (FORBIDDEN_EXTENSIONS.includes(ext)) {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        error: `Tipe file terlarang: Format ${ext} tidak diizinkan demi keamanan server.`
      });
    }

    // 2. Cek Ekstensi yang Diizinkan
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        error: `Format dokumen "${ext}" tidak didukung. Sistem hanya menerima file PDF (.pdf) dan Word (.docx).`
      });
    }

    // 3. Cek Ukuran File
    if (size > maxAllowedSize) {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      const limitMb = Math.round(maxAllowedSize / (1024 * 1024));
      return res.status(400).json({
        success: false,
        error: `Ukuran file (${(size / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimal yang diizinkan (${limitMb} MB).`
      });
    }

    // 4. Cek Keaslian Magic Bytes
    if (filePath && fs.existsSync(filePath)) {
      const magicCheck = verifyMagicBytes(filePath, ext);
      if (!magicCheck.valid) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          success: false,
          error: `Validasi integritas file gagal: ${magicCheck.error}`
        });
      }
    }

    // File valid! Lanjut ke handler
    next();
  };
}
