/**
 * Skrip Pembersihan Proses Mahasiswa & Dosen — SIM-TA FEB UTM
 *
 * Mengembalikan seluruh alur proses akademik mahasiswa dan dosen ke kondisi
 * awal yang bersih (pristine/fresh initial state):
 *
 * 1. Log Bimbingan: mengosongkan log bimbingan (bimbingan_log)
 * 2. Naskah: mengosongkan riwayat naskah versi & komentar (naskah_versi, komentar_naskah)
 * 3. Publikasi: mengosongkan data publikasi ilmiah (publikasi)
 * 4. Dokumen Resmi: mengosongkan arsip dokumen resmi uji (dokumen_arsip) & reset counter
 * 5. Berkas Storage: menghapus berkas upload uji (menyisakan berkas default sistem)
 * 6. Pendaftaran Ujian: mereset pendaftaran ujian kembali ke 5 data awal terverifikasi
 * 7. Dewan Penguji: mereset form penilaian & evaluasi ke status awal (belum dinilai)
 * 8. Catatan Koreksi: mereset catatan revisi penguji ke 5 catatan awal
 * 9. Tahapan & Entitas TA: mereset status TA ke 'Aktif' dan tahapan mahasiswa ke titik awal
 * 10. Akun Uji: menghapus akun-akun tiruan/uji dari suite pengujian
 * 11. Riwayat: mengosongkan audit_log, notifications, email_logs, reset last_login
 * 12. Kredensial Demo: memastikan seluruh akun resmi aktif dengan kata sandi demo yang konsisten
 *
 * Disertai pencadangan otomatis (safety backup) sebelum penghapusan.
 *
 * Jalankan: node scripts/reset_academic_processes.mjs
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { hashPassword } from '../server/utils/password.js';
import { TEST_ACCOUNTS } from '../tests/helpers/testAccounts.js';
import { INITIAL_VERIFIKASI_BERKAS } from '../src/data/adminData.js';
import { INITIAL_DAFTAR_UJIAN_PENGUJI, INITIAL_KOREKSI_PENGUJI } from '../src/data/pengujiData.js';
import { resolveNipByName } from '../server/academic/supervisorIdentity.js';

const ROOT = path.resolve('.');
const DB_PATH = path.join(ROOT, 'data', 'sim_ta_feb_utm.db');
const BACKUP_DIR = path.join(ROOT, 'backups');
const DEMO_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || 'UTM-QA-2026!Lab';

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 1. Buat safety backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `sim_ta_pre_reset_proses_${timestamp}.db`);
fs.copyFileSync(DB_PATH, backupPath);
console.log(`[Safety Backup] Salinan basis data disimpan di:\n  -> ${backupPath}\n`);

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA busy_timeout = 5000');
db.exec('PRAGMA foreign_keys = OFF');

console.log('====================================================');
console.log('🧹 PEMBERSIHAN PROSES MAHASISWA & DOSEN (SIM-TA)');
console.log('====================================================\n');

// 2. Hapus akun uji tiruan beserta data turunannya
const akunUji = db.prepare(`
  SELECT id, nomor_induk FROM users
  WHERE nomor_induk LIKE '1999%' OR nomor_induk LIKE '1998%' OR nama LIKE 'Uji %' OR nama LIKE 'Simulasi %'
`).all();

if (akunUji.length > 0) {
  const ids = akunUji.map((a) => a.id);
  const nims = akunUji.map((a) => a.nomor_induk).filter(Boolean);
  const phId = ids.map(() => '?').join(',');
  const phNim = nims.length ? nims.map(() => '?').join(',') : "''";

  if (nims.length) {
    db.prepare(`DELETE FROM tahap_status WHERE tugas_akhir_id IN (SELECT id FROM tugas_akhir WHERE nim IN (${phNim}))`).run(...nims);
    db.prepare(`DELETE FROM tugas_akhir WHERE nim IN (${phNim})`).run(...nims);
    db.prepare(`DELETE FROM pendaftaran_ujian WHERE nim IN (${phNim})`).run(...nims);
    db.prepare(`DELETE FROM storage_files WHERE uploader_nim IN (${phNim})`).run(...nims);
  }
  db.prepare(`DELETE FROM users WHERE id IN (${phId})`).run(...ids);
  console.log(`✅ Akun uji coba terhapus: ${akunUji.length} akun`);
}

// 3. Bersihkan Bimbingan, Naskah, dan Publikasi
const delBimbingan = db.prepare('DELETE FROM bimbingan_log').run();
const delKomentar = db.prepare('DELETE FROM komentar_naskah').run();
const delNaskah = db.prepare('DELETE FROM naskah_versi').run();
const delPublikasi = db.prepare('DELETE FROM publikasi').run();
console.log(`✅ Log Bimbingan dibersihkan       : ${delBimbingan.changes} baris`);
console.log(`✅ Naskah & Komentar dibersihkan    : ${delNaskah.changes} naskah, ${delKomentar.changes} komentar`);
console.log(`✅ Publikasi Ilmiah dibersihkan     : ${delPublikasi.changes} baris`);

// 4. Bersihkan Dokumen Resmi yang Diterbitkan (Berita Acara, Lembar Pengesahan, Kartu Kendali)
const delDokumen = db.prepare('DELETE FROM dokumen_arsip').run();
db.prepare('DELETE FROM document_counters').run();
console.log(`✅ Dokumen Resmi / Arsip dibersihkan: ${delDokumen.changes} dokumen`);

// 5. Bersihkan Berkas Storage yang Diunggah (selain 5 default file)
const defaultFileIds = ['f-1', 'f-2', 'f-3', 'f-4', 'f-5'];
const phDef = defaultFileIds.map(() => '?').join(',');
const delFiles = db.prepare(`DELETE FROM storage_files WHERE id NOT IN (${phDef})`).run(...defaultFileIds);
console.log(`✅ Berkas Storage uji dibersihkan   : ${delFiles.changes} berkas`);

// 6. Reset Pendaftaran Ujian ke Data Awal Otoritatif
db.prepare('DELETE FROM pendaftaran_ujian').run();
const insertBerkas = db.prepare(`
  INSERT INTO pendaftaran_ujian (id, mhs_id, nim, nama_mahasiswa, jenjang, program_studi, jenis_ujian, tanggal_daftar, status_verifikasi, pembimbing_utama, kopromotor, pembimbing_utama_nip, pembimbing_pendamping_nip, judul, berkas_json, catatan_admin)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const b of INITIAL_VERIFIKASI_BERKAS) {
  insertBerkas.run(
    b.id,
    b.mhsId || `mhs-${b.nim}`,
    b.nim,
    b.namaMahasiswa,
    b.jenjang,
    b.programStudi,
    b.jenisUjian,
    b.tanggalDaftar || '',
    b.statusVerifikasi || 'Menunggu Verifikasi',
    b.pembimbingUtama || '',
    b.kopromotor || '',
    resolveNipByName(b.pembimbingUtama) || null,
    resolveNipByName(b.kopromotor) || null,
    b.judul || '',
    JSON.stringify(b.berkasList || []),
    b.catatanAdmin || ''
  );
}
console.log(`✅ Pendaftaran Ujian di-reset       : ${INITIAL_VERIFIKASI_BERKAS.length} berkas awal terpulihkan`);

// 7. Reset Form Penilaian Dewan Penguji ke Status Awal
db.prepare('DELETE FROM ujian_penguji').run();
const insertUjian = db.prepare(`
  INSERT INTO ujian_penguji (id, nim, nama_mahasiswa, jenjang, program_studi, jenis_ujian, judul, tanggal_ujian, jam_ujian, ruang, status_ujian, peran_dosen, susunan_penguji_json, naskah_url, penilaian_submitted, nilai_final, grade, rekomendasi_kelayakan, catatan_evaluasi, catatan_tersimpan)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const u of INITIAL_DAFTAR_UJIAN_PENGUJI) {
  insertUjian.run(
    u.id,
    u.nim,
    u.namaMahasiswa,
    u.jenjang,
    u.programStudi,
    u.jenisUjian,
    u.judul || null,
    u.jadwal || '',
    u.waktu || '',
    u.ruang || '',
    u.statusUjian || 'Menunggu Pelaksanaan',
    u.peranPenguji || 'Penguji',
    Array.isArray(u.susunanPenguji) ? JSON.stringify(u.susunanPenguji) : null,
    u.fileNaskah || '',
    u.penilaianSubmitted ? 1 : 0,
    u.nilaiFinal !== undefined && u.nilaiFinal !== null ? u.nilaiFinal : null,
    u.grade || null,
    u.rekomendasiKelayakan || null,
    u.catatanEvaluasi || null,
    u.catatanTersimpan || 0
  );
}
console.log(`✅ Penilaian Dewan Penguji di-reset : ${INITIAL_DAFTAR_UJIAN_PENGUJI.length} jadwal ujian dikembalikan ke status awal`);

// 8. Reset Catatan Koreksi Penguji ke Data Awal
db.prepare('DELETE FROM koreksi_penguji').run();
const insertKoreksi = db.prepare(`
  INSERT INTO koreksi_penguji (id, ujian_id, mhs_nim, mhs_nama, jenjang, penguji_id, nama_penguji, bagian_naskah, halaman, catatan_koreksi, tingkat_urgensi, status_verifikasi, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const k of INITIAL_KOREKSI_PENGUJI) {
  insertKoreksi.run(
    k.id,
    k.ujianId,
    k.nim || '',
    k.namaMahasiswa || '',
    k.jenjang || 'S1',
    k.pengujiId || 'penguji-faidal',
    k.namaPenguji || 'Dr. Faidal, S.E., M.M.',
    k.bab || k.kategori || 'Revisi',
    k.halaman || '',
    k.catatanKoreksi || '',
    k.tingkatUrgensi || 'Sedang',
    k.statusRevisi || k.statusVerifikasi || 'Menunggu Approval Penguji',
    k.tanggal || '24 September 2026'
  );
}
console.log(`✅ Catatan Koreksi Penguji di-reset : ${INITIAL_KOREKSI_PENGUJI.length} koreksi awal terpulihkan`);

// 9. Reset Status Entitas Tugas Akhir & Tahapan Mahasiswa ke Awal
const realStudents = [
  { nim: '210211100142', aktifKode: 'S1-T2', dindaDoneStage: 'S1-T1' },
  { nim: '220231600004', aktifKode: 'S3-T1' },
  { nim: '230221600018', aktifKode: 'S2-T1' },
  { nim: '230201100055', aktifKode: 'D3-T1' },
  { nim: '210211100219', aktifKode: 'S1-T1' }
];

for (const s of realStudents) {
  const ta = db.prepare('SELECT id FROM tugas_akhir WHERE nim = ?').get(s.nim);
  if (!ta) continue;

  // Kembalikan status TA ke 'Aktif'
  db.prepare(`
    UPDATE tugas_akhir
    SET status = 'Aktif', tahap_aktif_kode = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(s.aktifKode, ta.id);

  // Reset seluruh tahap mahasiswa tersebut
  db.prepare(`
    UPDATE tahap_status
    SET status = 'Belum Mulai',
        pembimbing_approved = 0,
        admin_verified = 0,
        pengajuan_json = null,
        catatan = null,
        tanggal_mulai = null,
        tanggal_selesai = null,
        updated_at = CURRENT_TIMESTAMP
    WHERE tugas_akhir_id = ?
  `).run(ta.id);

  if (s.dindaDoneStage) {
    // Untuk Dinda: S1-T1 sudah selesai (karena sudah Sempro), S1-T2 siap/menunggu
    db.prepare(`
      UPDATE tahap_status
      SET status = 'Selesai', updated_at = CURRENT_TIMESTAMP
      WHERE tugas_akhir_id = ? AND kode_tahap = ?
    `).run(ta.id, s.dindaDoneStage);

    db.prepare(`
      UPDATE tahap_status
      SET status = 'Menunggu Persetujuan Pembimbing', updated_at = CURRENT_TIMESTAMP
      WHERE tugas_akhir_id = ? AND kode_tahap = ?
    `).run(ta.id, s.aktifKode);
  } else {
    // Untuk mahasiswa lain: tahap pertama berstatus 'Berjalan'
    db.prepare(`
      UPDATE tahap_status
      SET status = 'Berjalan', updated_at = CURRENT_TIMESTAMP
      WHERE tugas_akhir_id = ? AND kode_tahap = ?
    `).run(ta.id, s.aktifKode);
  }
}
console.log(`✅ Status & Tahapan Tugas Akhir     : 5 mahasiswa dikembalikan ke titik awal`);

// 10. Bersihkan Log Riwayat Kegiatan
const resAudit = db.prepare('DELETE FROM audit_log').run();
const resNotif = db.prepare('DELETE FROM notifications').run();
const resEmail = db.prepare('DELETE FROM email_logs').run();
db.prepare("UPDATE users SET last_login = 'Belum pernah login'").run();
console.log(`✅ Log Riwayat Aktivitas            : ${resAudit.changes} audit log, ${resNotif.changes} notifikasi dibersihkan`);

// 11. Samakan Kredensial Akun Demo
const hashed = hashPassword(DEMO_PASSWORD);
for (const acc of TEST_ACCOUNTS) {
  db.prepare(`
    UPDATE users SET password = ?, must_change_password = 0, credential_epoch = 1, status = 'Aktif'
    WHERE nomor_induk = ?
  `).run(hashed, acc.nomorInduk);
}
console.log(`✅ Kredensial Akun Demo disiapkan   : password='${DEMO_PASSWORD}'`);

// 12. Verifikasi Integritas
db.exec('PRAGMA foreign_keys = ON');
const fkViolations = db.prepare('PRAGMA foreign_key_check').all();
console.log(`\nIntegritas Relasional Database     : ${fkViolations.length === 0 ? '100% AMAN (0 pelanggaran)' : fkViolations.length + ' pelanggaran'}`);

// 13. Optimasi Penyimpanan
db.exec('VACUUM');
console.log('✅ Basis data berhasil di-VACUUM.');

db.close();
console.log('\n====================================================');
console.log('🎉 SELURUH PROSES MAHASISWA & DOSEN BERHASIL DIBERSIHKAN!');
console.log('Sistem kini berada pada kondisi awal yang segar & siap pakai.');
console.log('====================================================\n');
