import { DatabaseSync } from 'node:sqlite';
import { hashPassword, generateTemporaryPassword } from '../server/utils/password.js';

const db = new DatabaseSync('data/sim_ta_feb_utm.db');

db.exec('PRAGMA foreign_keys = OFF;'); // Turn off temporarily during schema recreation

console.log('1. Sinkronisasi akun mahasiswa yang belum terdaftar di users...');
// Akun placeholder memakai kata sandi acak individual (bukan kata sandi
// universal institusi) dan DIHARUSKAN untuk mengganti sandi pada login pertama.
const defaultHash = hashPassword(generateTemporaryPassword());
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, nomor_induk, nama, email, role, jenjang, prodi, password, status, last_login)
  VALUES (?, ?, ?, ?, 'mahasiswa', ?, ?, ?, 'Aktif', 'Belum pernah login')
`);

const missingInReg = db.prepare(`
  SELECT DISTINCT nim, nama_mahasiswa, jenjang, program_studi 
  FROM pendaftaran_ujian 
  WHERE nim NOT IN (SELECT nomor_induk FROM users)
`).all();

for (const m of missingInReg) {
  insertUser.run(
    `usr-mhs-${m.nim}`,
    m.nim,
    m.nama_mahasiswa,
    `${m.nim}@student.trunojoyo.ac.id`,
    m.jenjang || 'S1',
    m.program_studi || 'S1 Manajemen',
    defaultHash
  );
}

const missingInUjian = db.prepare(`
  SELECT DISTINCT nim, nama_mahasiswa, jenjang, program_studi 
  FROM ujian_penguji 
  WHERE nim NOT IN (SELECT nomor_induk FROM users)
`).all();

for (const m of missingInUjian) {
  insertUser.run(
    `usr-mhs-${m.nim}`,
    m.nim,
    m.nama_mahasiswa,
    `${m.nim}@student.trunojoyo.ac.id`,
    m.jenjang || 'S1',
    m.program_studi || 'S1 Manajemen',
    defaultHash
  );
}

console.log('Akun mahasiswa tersinkronkan. Sisa missing:', db.prepare('SELECT count(*) as c FROM pendaftaran_ujian WHERE nim NOT IN (SELECT nomor_induk FROM users)').get().c);

console.log('2. Migrasi skema tabel untuk menambahkan FOREIGN KEY constraints...');

// 2a. ujian_penguji
db.exec(`
  CREATE TABLE IF NOT EXISTS new_ujian_penguji (
    id TEXT PRIMARY KEY,
    nim TEXT NOT NULL,
    nama_mahasiswa TEXT NOT NULL,
    jenjang TEXT NOT NULL,
    program_studi TEXT NOT NULL,
    jenis_ujian TEXT NOT NULL,
    tanggal_ujian TEXT NOT NULL,
    jam_ujian TEXT NOT NULL,
    ruang TEXT NOT NULL,
    status_ujian TEXT NOT NULL,
    peran_dosen TEXT NOT NULL,
    naskah_url TEXT,
    penilaian_submitted INTEGER DEFAULT 0,
    nilai_final REAL,
    grade TEXT,
    rekomendasi_kelayakan TEXT,
    catatan_evaluasi TEXT,
    catatan_tersimpan INTEGER DEFAULT 0,
    FOREIGN KEY (nim) REFERENCES users(nomor_induk) ON UPDATE CASCADE ON DELETE CASCADE
  );
  INSERT OR IGNORE INTO new_ujian_penguji SELECT * FROM ujian_penguji;
  DROP TABLE ujian_penguji;
  ALTER TABLE new_ujian_penguji RENAME TO ujian_penguji;
`);

// 2b. koreksi_penguji
db.exec(`
  CREATE TABLE IF NOT EXISTS new_koreksi_penguji (
    id TEXT PRIMARY KEY,
    ujian_id TEXT NOT NULL,
    mhs_nim TEXT NOT NULL,
    mhs_nama TEXT NOT NULL,
    jenjang TEXT NOT NULL,
    penguji_id TEXT NOT NULL,
    nama_penguji TEXT NOT NULL,
    bagian_naskah TEXT NOT NULL,
    halaman TEXT,
    catatan_koreksi TEXT NOT NULL,
    tingkat_urgensi TEXT NOT NULL,
    status_verifikasi TEXT DEFAULT 'Menunggu Approval Penguji',
    created_at TEXT,
    FOREIGN KEY (ujian_id) REFERENCES ujian_penguji(id) ON UPDATE CASCADE ON DELETE CASCADE
  );
  INSERT OR IGNORE INTO new_koreksi_penguji SELECT * FROM koreksi_penguji;
  DROP TABLE koreksi_penguji;
  ALTER TABLE new_koreksi_penguji RENAME TO koreksi_penguji;
`);

// 2c. pendaftaran_ujian
db.exec(`
  CREATE TABLE IF NOT EXISTS new_pendaftaran_ujian (
    id TEXT PRIMARY KEY,
    mhs_id TEXT,
    nim TEXT NOT NULL,
    nama_mahasiswa TEXT NOT NULL,
    jenjang TEXT NOT NULL,
    program_studi TEXT NOT NULL,
    jenis_ujian TEXT NOT NULL,
    tanggal_daftar TEXT NOT NULL,
    status_verifikasi TEXT DEFAULT 'Menunggu Verifikasi',
    pembimbing_utama TEXT,
    kopromotor TEXT,
    judul TEXT NOT NULL,
    berkas_json TEXT NOT NULL,
    catatan_admin TEXT,
    FOREIGN KEY (nim) REFERENCES users(nomor_induk) ON UPDATE CASCADE ON DELETE CASCADE
  );
  INSERT OR IGNORE INTO new_pendaftaran_ujian SELECT * FROM pendaftaran_ujian;
  DROP TABLE pendaftaran_ujian;
  ALTER TABLE new_pendaftaran_ujian RENAME TO pendaftaran_ujian;
`);

// 2d. alokasi_ruangan
db.exec(`
  CREATE TABLE IF NOT EXISTS new_alokasi_ruangan (
    id TEXT PRIMARY KEY,
    nama_mahasiswa TEXT NOT NULL,
    nim TEXT NOT NULL,
    jenjang TEXT NOT NULL,
    jenis_ujian TEXT NOT NULL,
    ruang_id TEXT NOT NULL,
    ruang_nama TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    jam_mulai TEXT NOT NULL,
    jam_selesai TEXT NOT NULL,
    moda TEXT NOT NULL,
    ketua_penguji TEXT NOT NULL,
    status TEXT DEFAULT 'Terkonfirmasi',
    catatan TEXT,
    FOREIGN KEY (nim) REFERENCES users(nomor_induk) ON UPDATE CASCADE ON DELETE CASCADE
  );
  INSERT OR IGNORE INTO new_alokasi_ruangan SELECT * FROM alokasi_ruangan;
  DROP TABLE alokasi_ruangan;
  ALTER TABLE new_alokasi_ruangan RENAME TO alokasi_ruangan;
`);

db.exec('PRAGMA foreign_keys = ON;');
const fkCheck = db.prepare('PRAGMA foreign_key_check;').all();
console.log('3. PRAGMA foreign_key_check hasil:', fkCheck);
console.log('4. Foreign keys list pada koreksi_penguji:', db.prepare('PRAGMA foreign_key_list(koreksi_penguji)').all());
console.log('5. Foreign keys list pada ujian_penguji:', db.prepare('PRAGMA foreign_key_list(ujian_penguji)').all());
db.close();
