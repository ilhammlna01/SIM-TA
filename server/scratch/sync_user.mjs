import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scryptSync, randomBytes } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../data/sim_ta_feb_utm.db');

console.log('Connecting to:', dbPath);
const db = new DatabaseSync(dbPath);

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

const defaultHashedPassword = hashPassword('FEB-UTM-2026');

const usersToUpsert = [
  {
    id: 'usr-02-takk',
    nomorInduk: '210211100219',
    nama: 'Moh. Fikri Haikal',
    email: 'fikri.haikal@student.trunojoyo.ac.id',
    role: 'mahasiswa',
    jenjang: 'S1',
    prodi: 'S-1 Manajemen',
    status: 'Aktif',
    lastLogin: 'Hari ini, 08:20'
  },
  {
    id: 'usr-01',
    nomorInduk: '220231600004',
    nama: 'Bambang Suryo Utomo, S.E., M.M.',
    email: 'bambang.suryo@student.trunojoyo.ac.id',
    role: 'mahasiswa',
    jenjang: 'S3',
    prodi: 'S-3 Ilmu Manajemen',
    status: 'Aktif',
    lastLogin: 'Hari ini, 09:30'
  },
  {
    id: 'usr-02',
    nomorInduk: '210211100142',
    nama: 'Dinda Ayu Larasati',
    email: 'dinda.larasati@student.trunojoyo.ac.id',
    role: 'mahasiswa',
    jenjang: 'S1',
    prodi: 'S-1 Manajemen',
    status: 'Aktif',
    lastLogin: 'Kemarin, 14:15'
  }
];

const stmt = db.prepare(`
  INSERT INTO users (id, nomor_induk, nama, email, role, jenjang, prodi, password, status, last_login)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(nomor_induk) DO UPDATE SET
    nama=excluded.nama,
    email=excluded.email,
    role=excluded.role,
    jenjang=excluded.jenjang,
    prodi=excluded.prodi,
    status=excluded.status
`);

for (const u of usersToUpsert) {
  stmt.run(u.id, u.nomorInduk, u.nama, u.email, u.role, u.jenjang, u.prodi, defaultHashedPassword, u.status, u.lastLogin);
  console.log(`Upserted: ${u.nama} (${u.nomorInduk})`);
}

const allUsers = db.prepare('SELECT id, nomor_induk, nama, role, jenjang FROM users').all();
console.log('Total users in DB now:', allUsers.length);
console.log('List of users in DB:', JSON.stringify(allUsers, null, 2));
