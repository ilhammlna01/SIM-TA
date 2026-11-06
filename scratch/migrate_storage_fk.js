import { DatabaseSync } from 'node:sqlite';
import { hashPassword, generateTemporaryPassword } from '../server/utils/password.js';

const db = new DatabaseSync('data/sim_ta_feb_utm.db');

db.exec('PRAGMA foreign_keys = OFF;');

console.log('1. Sinkronisasi akun uploader storage_files...');
// Akun placeholder memakai kata sandi acak individual (bukan kata sandi
// universal institusi) dan DIHARUSKAN untuk mengganti sandi pada login pertama.
const defaultHash = hashPassword(generateTemporaryPassword());

// Bersihkan row uji coba jika ada
db.prepare("DELETE FROM storage_files WHERE id = 'test-fk-storage'").run();

// Pastikan user-user mahasiswa uploader terdaftar
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, nomor_induk, nama, email, role, jenjang, prodi, password, status, last_login)
  VALUES (?, ?, ?, ?, 'mahasiswa', ?, ?, ?, 'Aktif', 'Belum pernah login')
`);

insertUser.run('usr-mhs-230211200015', '230211200015', 'Rahmat Hidayat', 'rahmat@student.trunojoyo.ac.id', 'S2', 'S-2 Magister Manajemen', defaultHash);
insertUser.run('usr-mhs-210211300001', '210211300001', 'Bambang Suryo', 'bambang@student.trunojoyo.ac.id', 'S3', 'S-3 Ilmu Manajemen', defaultHash);
insertUser.run('usr-mhs-210211100099', '210211100099', 'Andi Pratama', 'andi@student.trunojoyo.ac.id', 'S1', 'S-1 Manajemen', defaultHash);

// Perbarui uploader_id di storage_files agar sesuai dengan users
db.prepare("UPDATE storage_files SET uploader_id = 'usr-02' WHERE uploader_nim = '210211100142'").run();
db.prepare("UPDATE storage_files SET uploader_id = 'usr-mhs-230211200015' WHERE uploader_nim = '230211200015'").run();
db.prepare("UPDATE storage_files SET uploader_id = 'usr-mhs-210211300001' WHERE uploader_nim = '210211300001'").run();
db.prepare("UPDATE storage_files SET uploader_id = 'usr-mhs-210211100099' WHERE uploader_nim = '210211100099'").run();

console.log('2. Recreate tabel storage_files dengan FOREIGN KEY constraint...');
db.exec(`
  CREATE TABLE IF NOT EXISTS new_storage_files (
    id TEXT PRIMARY KEY,
    filename TEXT UNIQUE NOT NULL,
    original_name TEXT,
    category TEXT NOT NULL,
    uploader_id TEXT NOT NULL,
    uploader_nim TEXT,
    uploader_role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
  );
  INSERT OR IGNORE INTO new_storage_files SELECT * FROM storage_files;
  DROP TABLE storage_files;
  ALTER TABLE new_storage_files RENAME TO storage_files;
`);

db.exec('PRAGMA foreign_keys = ON;');
const fkCheck = db.prepare('PRAGMA foreign_key_check;').all();
console.log('3. PRAGMA foreign_key_check:', fkCheck);
console.log('4. Foreign keys list storage_files:', db.prepare('PRAGMA foreign_key_list(storage_files)').all());

db.close();
