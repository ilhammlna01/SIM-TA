/**
 * Storage Manager Abstraction - SIM Tugas Akhir FEB UTM
 * Mengelola penyimpanan berkas lokal terproteksi dengan kesiapan adapter Cloud (AWS S3 / Supabase).
 * 
 * Fitur:
 * - Driver 'local': Menyimpan di uploads/ dengan pembatasan direktori per kategori.
 * - Driver 's3' / 'supabase': Struktur siap adapter jika env cloud tersedia.
 * - Kontrol Izin Akses (Access Control): Berkas tidak disajikan publik tanpa validasi peran.
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { sanitizeFileName } from './fileValidator.js';
import { verifyToken } from '../utils/jwt.js';
import { db } from '../database/db.js';
import { isSamePerson, isExamPanelist } from '../academic/supervisorIdentity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory untuk berkas unggahan lokal
export const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');

// Subdirektori penyimpanan terstruktur
export const CATEGORY_DIRS = {
  naskah: path.join(UPLOAD_BASE_DIR, 'naskah'),
  syarat: path.join(UPLOAD_BASE_DIR, 'syarat'),
  dokumen_resmi: path.join(UPLOAD_BASE_DIR, 'dokumen_resmi'),
  temp: path.join(UPLOAD_BASE_DIR, 'temp')
};

// Pastikan semua direktori penyimpanan lokal ada
Object.values(CATEGORY_DIRS).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Konfigurasi Disk Storage Multer dengan Sanitasi Nama File
 */
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.params.category || req.body.category || 'naskah';
    const targetDir = CATEGORY_DIRS[category] || CATEGORY_DIRS.naskah;
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const safeName = sanitizeFileName(file.originalname);
    cb(null, safeName);
  }
});

export const uploadMiddleware = multer({
  storage: diskStorage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max
  }
});

/**
 * Storage Manager Service
 */
export const StorageManager = {
  /**
   * Driver aktif saat ini: 'local' | 's3' | 'supabase'
   */
  getDriver() {
    return process.env.STORAGE_DRIVER || 'local';
  },

  /**
   * Mendapatkan path absolut berkas lokal
   */
  getFilePath(category, filename) {
    const cleanFilename = path.basename(filename);
    const categoryDir = CATEGORY_DIRS[category] || CATEGORY_DIRS.naskah;
    return path.join(categoryDir, cleanFilename);
  },

  /**
   * Periksa apakah berkas ada
   */
  fileExists(category, filename) {
    const filePath = this.getFilePath(category, filename);
    return fs.existsSync(filePath);
  },

  /**
   * Dapatkan metadata berkas lokal
   */
  getFileStats(category, filename) {
    const filePath = this.getFilePath(category, filename);
    if (!fs.existsSync(filePath)) return null;
    const stats = fs.statSync(filePath);
    return {
      filename,
      category,
      size: stats.size,
      sizeFormatted: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  },

  /**
   * Mengambil metadata kepemilikan berkas dari indeks storage_files.
   * Dikembalikan terpisah agar getFileStats tetap bebas dependensi database.
   */
  getFileOwnership(category, filename) {
    try {
      const row = db
        .prepare('SELECT uploader_nim, uploader_nama, uploader_id FROM storage_files WHERE filename = ?')
        .get(filename);
      return row || null;
    } catch (_) {
      return null;
    }
  },

  /**
   * Hapus berkas lokal
   */
  deleteFile(category, filename) {
    const filePath = this.getFilePath(category, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  },

  /**
   * Daftar semua berkas dalam kategori
   */
  listFiles(category, filterFn = null) {
    const categoryDir = CATEGORY_DIRS[category];
    if (!categoryDir || !fs.existsSync(categoryDir)) return [];
    const files = fs.readdirSync(categoryDir);
    const daftar = files.map((file) => this.getFileStats(category, file)).filter(Boolean);

    // Audit 21 Oktober 2026 (AZ-A2): penyaringan berdasarkan kepemilikan
    // memungkinkan mahasiswa melihat dokumennya sendiri tanpa membuka
    // dokumen mahasiswa lain.
    if (typeof filterFn === 'function') {
      return daftar.filter((f) => filterFn(f, this.getFileOwnership(category, f.filename)));
    }
    return daftar;
  },

  /**
   * Generate URL akses aman
   * Menggunakan APP_PUBLIC_URL bila tersedia agar tautan tetap valid di produksi
   * (tidak lagi meng-hardcode host localhost).
   */
  getAccessUrl(category, filename) {
    const baseUrl = (process.env.APP_PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`).replace(/\/+$/, '');
    return `${baseUrl}/api/storage/files/${category}/${encodeURIComponent(filename)}`;
  },

  /**
   * Validasi izin akses (Access Control Authorization)
   * Memastikan pengguna memiliki wewenang untuk membuka berkas tertentu
   * Menolak mahasiswa yang mencoba mengakses naskah rahasia mahasiswa lain
   */
  authorizeAccess(req, category, filename) {
    // Token sesi sudah diverifikasi oleh middleware authenticateFileAccess.
    // Fallback di bawah hanya berlaku bila pemanggil memakai modul secara langsung.
    if (!req.user) {
      const authHeader = req.headers['authorization'] || '';
      let token = '';
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else if (req.headers['x-access-token']) {
        token = String(req.headers['x-access-token']).trim();
      }

      // CATATAN: query string TIDAK lagi menjadi sumber token sesi
      // (Audit 21 Oktober 2026 — kebocoran kredensial via URL/log proxy).
      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          req.user = decoded;
        }
      }
    }

    // Jika tanpa sesi autentikasi yang sah, tolak akses (termasuk dokumen_resmi).
    // Dokumen resmi (Berita Acara memuat nilai/grade) TIDAK boleh diunduh publik;
    // fitur verifikasi QR hanya memerlukan endpoint metadata kode verifikasi.
    if (!req.user) {
      return false;
    }

    const userRole = (req.user.role || '').toLowerCase();
    const userNim = req.user.nomorInduk || req.user.id || '';

    // Peran akademik berwenang dengan akses PENUH (seluruh kategori).
    if (['superadmin', 'admin', 'koorprodi'].includes(userRole)) {
      return true;
    }

    // Dosen & Penguji: akses ke berkas mahasiswa yang berada dalam naungan
    //ugasnya (pembimbing/anggota dekwan). Audit 21 Oktober 2026: sebelumnya
    // peran ini memperoleh akses blanket ke SELURUH naskah mahasiswa.
    if (['dosen', 'penguji'].includes(userRole)) {
      return this.isUnderSupervision(req.user, filename, category);
    }

    // Mahasiswa hanya boleh mengakses berkas miliknya sendiri.
    if (userRole === 'mahasiswa') {
      // Pemeriksaan kepemilikan generik berbasis relasi tabel storage_files,
      // berlaku untuk SEMUA kategori (naskah, syarat, lampiran) — menutup IDOR.
      try {
        const registeredFile = db.prepare('SELECT uploader_nim, uploader_id FROM storage_files WHERE filename = ?').get(filename);
        if (registeredFile) {
          if (registeredFile.uploader_nim && registeredFile.uploader_nim === userNim) {
            return true;
          }
          if (registeredFile.uploader_id && (registeredFile.uploader_id === req.user.id || registeredFile.uploader_id === userNim)) {
            return true;
          }
          // Terdaftar sebagai milik pengguna lain -> TOLAK KERAS
          return false;
        }
      } catch (_) {}

      // Pemeriksaan relasi tambahan khusus naskah (ujian sidang & pendaftaran ujian)
      if (category === 'naskah') {
        // Cek relasi kepemilikan di tabel ujian_penguji
        try {
          const examRow = db.prepare('SELECT nim FROM ujian_penguji WHERE naskah_url = ? OR naskah_url LIKE ?').get(filename, `%${filename}%`);
          if (examRow) {
            return examRow.nim === userNim;
          }
        } catch (_) {}

        // Cek relasi kepemilikan di tabel pendaftaran_ujian
        try {
          const regRow = db.prepare('SELECT nim FROM pendaftaran_ujian WHERE berkas_json LIKE ?').get(`%${filename}%`);
          if (regRow) {
            return regRow.nim === userNim;
          }
        } catch (_) {}
      }

      // Fallback jika berkas belum tercatat di DB:
      // Mahasiswa HANYA boleh mengakses berkas yang secara eksplisit memuat NIM-nya sendiri
      // (berlaku untuk semua kategori: naskah, syarat, lampiran, dokumen_resmi).
      const lowerFilename = filename.toLowerCase();
      if (userNim && lowerFilename.includes(String(userNim).toLowerCase())) {
        return true;
      }

      // Jika berkas tidak dapat dibuktikan sebagai milik mahasiswa ini, TOLAK
      return false;
    }

    // Default: Tanpa role sah ditolak
    return false;
  },

  /**
   * Apakah berkas ini milik mahasiswa yang berada dalam naungan pengguna
   * (sebagai pembimbing, promoter, atau anggota dekwan penguji)?
   */
  isUnderSupervision(user, filename, category) {
    const userNip = String(user.nomorInduk || '').trim();
    if (!userNip) return false;

    // 1. Cari mahasiswa pemilik berkas (dari registrasi penyimpanan).
    let ownerNim = null;
    try {
      const registered = db.prepare('SELECT uploader_nim FROM storage_files WHERE filename = ?').get(filename);
      if (registered?.uploader_nim) ownerNim = registered.uploader_nim;
    } catch (_) {}

    if (!ownerNim) {
      try {
        const examRow = db.prepare('SELECT nim FROM ujian_penguji WHERE naskah_url = ? OR naskah_url LIKE ?').get(filename, `%${filename}%`);
        if (examRow) ownerNim = examRow.nim;
      } catch (_) {}
    }

    if (!ownerNim) {
      try {
        const regRow = db.prepare('SELECT nim FROM pendaftaran_ujian WHERE berkas_json LIKE ?').get(`%${filename}%`);
        if (regRow) ownerNim = regRow.nim;
      } catch (_) {}
    }

    if (!ownerNim) return false;

    // 2. Apakah pengguna adalah pembimbing/penguji mahasiswa pemilik berkas?
    const ta = db.prepare('SELECT * FROM tugas_akhir WHERE nim = ? ORDER BY created_at DESC LIMIT 1').get(ownerNim);
    if (ta) {
      const supervisors = [
        { nip: ta.pembimbing_utama_nip, name: ta.pembimbing_utama },
        { nip: ta.pembimbing_pendamping_nip, name: ta.pembimbing_pendamping }
      ];
      const hasStoredNip = supervisors.some((s) => s.nip);
      if (hasStoredNip) {
        if (supervisors.some((s) => s.nip && String(s.nip).trim() === userNip)) return true;
      } else if (supervisors.some((s) => isSamePerson({ nip: userNip, name: user.nama, otherNip: null, otherName: s.name }))) {
        return true;
      }
    }

    // 3. Falls back ke keanggotaan dekwan penguji pada ujian mahasiswa tersebut.
    try {
      const exams = db.prepare('SELECT * FROM ujian_penguji WHERE nim = ?').all(ownerNim);
      if (exams.some((e) => isExamPanelist({ nomorInduk: userNip, nama: user.nama }, e))) {
        return true;
      }
    } catch (_) {}

    return false;
  }
};

export default StorageManager;
