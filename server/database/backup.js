/**
 * SQLite Backup & Disaster Recovery Engine - SIM Tugas Akhir FEB UTM
 * 
 * Mengelola:
 * 1. Online Hot Transactional Backup via SQLite VACUUM INTO (WAL point-in-time snapshot)
 * 2. Perhitungan Checksum Kriptografis SHA-256 untuk Integritas Berkas
 * 3. Kebijakan Retensi Berkas Cadangan 7 Hari (Automatic Pruning)
 * 4. Verifikasi Integritas Cadangan (PRAGMA integrity_check & foreign_key_check)
 * 5. Pencatatan Audit Log Forensik Terhadap Seluruh Aktivitas Pemulihan Bencana
 */

import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direktori penyimpanan berkas cadangan terisolasi
export const BACKUP_DIR = path.resolve(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Menghitung SHA-256 checksum dari berkas cadangan
 */
function calculateFileChecksum(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } catch {
    return null;
  }
}

/**
 * Membersihkan berkas backup yang lebih tua dari batas retensi (7 hari)
 */
export function pruneOldBackups(retentionDays = 7) {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return { cleanedCount: 0 };
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
    let cleanedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.db')) continue;
      const fullPath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(fullPath);
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(fullPath);
        cleanedCount++;
      }
    }

    return { cleanedCount };
  } catch (err) {
    console.warn('[Backup] Gagal membersihkan backup usang:', err.message);
    return { cleanedCount: 0 };
  }
}

/**
 * Menghasilkan snapshot cadangan online SQLite (Hot Backup)
 */
export function createDatabaseBackup(triggerSource = 'SYSTEM_AUTO') {
  try {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '_').slice(0, 19);
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const backupFilename = `sim_ta_backup_${timestamp}_${randomSuffix}.db`;
    const backupFilePath = path.join(BACKUP_DIR, backupFilename);

    // Jalankan WAL checkpoint pasif agar perubahan log terserap rapi
    try {
      db.exec('PRAGMA wal_checkpoint(PASSIVE);');
    } catch (_) {}

    // Eksekusi VACUUM INTO untuk membuat snapshot konsisten tanpa menghentikan sistem
    const escapedPath = backupFilePath.replace(/'/g, "''");
    db.exec(`VACUUM INTO '${escapedPath}'`);

    const stats = fs.statSync(backupFilePath);
    const checksum = calculateFileChecksum(backupFilePath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

    // Jalankan pembersihan retensi 7 hari
    const { cleanedCount } = pruneOldBackups(7);

    // Catat ke audit log
    try {
      db.prepare(`
        INSERT INTO audit_log (user_id, action, details)
        VALUES (?, 'BACKUP_DATABASE_SUCCESS', ?)
      `).run(
        triggerSource,
        `Pencadangan basis data SQLite berhasil: ${backupFilename} (${sizeMb} MB, SHA-256: ${checksum?.slice(0, 12)}...)`
      );
    } catch (_) {}

    const totalBackups = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.db')).length;

    return {
      success: true,
      filename: backupFilename,
      filePath: backupFilePath,
      sizeBytes: stats.size,
      sizeFormatted: `${sizeMb} MB`,
      checksum,
      createdAt: stats.birthtime || new Date(),
      totalBackups,
      cleanedOldBackups: cleanedCount
    };
  } catch (err) {
    console.error('[Backup Engine] Gagal membuat cadangan database:', err);
    try {
      db.prepare(`
        INSERT INTO audit_log (user_id, action, details)
        VALUES (?, 'BACKUP_DATABASE_FAILED', ?)
      `).run(triggerSource, `Gagal membuat cadangan database: ${err.message}`);
    } catch (_) {}

    throw new Error('Gagal mencadangkan database: ' + err.message);
  }
}

/**
 * Mengambil daftar seluruh berkas cadangan aktif
 */
export function listDatabaseBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.db'));

  return files.map(file => {
    const fullPath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(fullPath);
    const ageDays = ((Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24)).toFixed(1);

    return {
      filename: file,
      sizeBytes: stats.size,
      sizeFormatted: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
      createdAt: stats.mtime,
      ageDays: Number(ageDays),
      retentionStatus: Number(ageDays) <= 7 ? 'Aktif' : 'Kedaluwarsa (Menunggu Pruning)'
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Verifikasi integritas relasional dan struktur berkas cadangan (Disaster Recovery Validation)
 */
export function verifyBackupIntegrity(filename) {
  const fullPath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    // Audit 21 Oktober 2026 (Simulasi Proses A–Z): berkas yang tidak ada
    // harus dibalas 404, bukan 500 yang menyamar sebagai kegagalan server.
    const err = new Error(`Berkas cadangan "${filename}" tidak ditemukan.`);
    err.status = 404;
    err.code = 'BACKUP_NOT_FOUND';
    throw err;
  }

  // Buka berkas cadangan secara independen
  let testDb;
  try {
    testDb = new DatabaseSync(fullPath);
  } catch (openErr) {
    // Berkas ada namun BUKAN basis data SQLite (mis. berkas acak hasil
    // path traversal yang sudah dibersihkan oleh basename()).
    const err = new Error(
      `Berkas "${filename}" bukan berkas cadangan yang valid (bukan basis data SQLite).`
    );
    err.status = 422;
    err.code = 'BACKUP_NOT_A_DATABASE';
    throw err;
  }
  try {
    const integrityCheck = testDb.prepare('PRAGMA integrity_check;').all();
    const isIntegrityOk = integrityCheck.length === 1 && integrityCheck[0].integrity_check === 'ok';

    const fkCheck = testDb.prepare('PRAGMA foreign_key_check;').all();
    const tables = testDb.prepare("SELECT count(*) as count FROM sqlite_master WHERE type = 'table'").get().count;
    const checksum = calculateFileChecksum(fullPath);

    testDb.close();

    return {
      success: true,
      filename,
      integrityCheckPassed: isIntegrityOk,
      foreignKeyViolations: fkCheck.length,
      tableCount: tables,
      checksum,
      // Audit 21 Oktober 2026 (Simulasi Proses A–Z): label sebelumnya hanya
      // membedakan "VALID" vs "CORRUPTED", sehingga cadangan yang secara
      // struktural SAH tetapi memiliki beberapa baris yatim (foreign key
      // violation) dilabeli "CORRUPTED" — menyesatkan operator yang dapat
      // mengambil keputusan restore. Kini ketiga kondisi dibedakan.
      status: !isIntegrityOk
        ? 'CORRUPTED'
        : fkCheck.length === 0
          ? 'VALID & PRODUCTION READY'
          : `VALID (struktur utuh) dengan ${fkCheck.length} pelanggaran foreign key — periksa baris yatim sebelum restore`
    };
  } catch (err) {
    try { testDb.close(); } catch (_) {}
    const wrapped = new Error('Verifikasi integritas cadangan gagal: ' + err.message);
    wrapped.status = 422;
    wrapped.code = 'BACKUP_VERIFICATION_FAILED';
    throw wrapped;
  }
}

let backupTimer = null;

/**
 * Menjalankan scheduler auto-backup berkala di background proses server
 * @param {number} intervalHours - Interval pencadangan dalam jam (default: 24 jam)
 */
export function startAutoBackupScheduler(intervalHours = 24) {
  if (backupTimer) {
    clearInterval(backupTimer);
  }

  const hours = Number(process.env.BACKUP_INTERVAL_HOURS) || intervalHours;
  const intervalMs = hours * 60 * 60 * 1000;

  console.log(`[Backup Engine] Auto-backup scheduler diaktifkan: setiap ${hours} jam.`);

  // Jalankan backup inisial jika belum ada backup dalam 24 jam terakhir
  try {
    const existing = listDatabaseBackups();
    const hasRecentBackup = existing.length > 0 && (Date.now() - new Date(existing[0].createdAt).getTime() < intervalMs);

    if (!hasRecentBackup) {
      console.log('[Backup Engine] Belum ditemukan backup mutakhir hari ini. Melakukan pencadangan awal saat server aktif...');
      createDatabaseBackup('SYSTEM_BOOT_AUTO');
    }
  } catch (initErr) {
    console.warn('[Backup Engine] Peringatan pencadangan awal:', initErr.message);
  }

  // Pasang timer berkala
  backupTimer = setInterval(() => {
    try {
      console.log('[Backup Engine] Memulai pencadangan terjadwal otomatis (24-hour cycle)...');
      const backupResult = createDatabaseBackup('SYSTEM_AUTO_SCHEDULE');
      console.log(`[Backup Engine] Snapshot otomatis berhasil dibuat: ${backupResult.filename} (${backupResult.sizeFormatted}, SHA-256: ${backupResult.checksum?.slice(0, 12)}...)`);
    } catch (err) {
      console.error('[Backup Engine] Gagal menjalankan backup terjadwal:', err.message);
    }
  }, intervalMs);

  // Pastikan timer tidak menahan event loop jika server ingin exit
  if (backupTimer && typeof backupTimer.unref === 'function') {
    backupTimer.unref();
  }

  return { active: true, intervalHours: hours };
}

/**
 * Menghentikan scheduler auto-backup (digunakan saat graceful shutdown)
 */
export function stopAutoBackupScheduler() {
  if (backupTimer) {
    clearInterval(backupTimer);
    backupTimer = null;
    console.log('[Backup Engine] Auto-backup scheduler dihentikan secara aman.');
  }
}

export default {
  createDatabaseBackup,
  listDatabaseBackups,
  verifyBackupIntegrity,
  pruneOldBackups,
  startAutoBackupScheduler,
  stopAutoBackupScheduler,
  BACKUP_DIR
};
