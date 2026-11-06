/**
 * Menyiapkan & menampilkan kredensial demo lokal SIM-TA FEB UTM.
 *
 * Menyamakan kata sandi akun demo ke nilai uji yang seragam, lalu
 * menampilkan tabel kredensial siap pakai untuk login lokal.
 *
 * Jalankan: node scripts/setup_demo_accounts.mjs
 */

import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from '../server/utils/password.js';
import { TEST_ACCOUNTS } from '../tests/helpers/testAccounts.js';

export const DEMO_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || 'UTM-QA-2026!Lab';

const db = new DatabaseSync('data/sim_ta_feb_utm.db');
db.exec('PRAGMA busy_timeout = 5000');

const hashed = hashPassword(DEMO_PASSWORD);

for (const acc of TEST_ACCOUNTS) {
  const existing = db.prepare('SELECT id FROM users WHERE nomor_induk = ?').get(acc.nomorInduk);
  if (existing) {
    db.prepare(`
      UPDATE users SET password = ?, must_change_password = 0, credential_epoch = 1, status = 'Aktif'
      WHERE nomor_induk = ?
    `).run(hashed, acc.nomorInduk);
  } else {
    db.prepare(`
      INSERT INTO users (id, nomor_induk, nama, email, role, jenjang, prodi, password, eligible_roles, status, last_login, credential_epoch, token_version, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Aktif', 'Belum pernah login', 1, 1, 0)
    `).run(
      acc.id,
      acc.nomorInduk,
      acc.nama,
      acc.email,
      acc.role,
      acc.jenjang,
      acc.prodi,
      hashed,
      JSON.stringify([acc.role])
    );
  }
}
db.close();

const ROLE_LABEL = {
  mahasiswa: 'Mahasiswa',
  dosen: 'Dosen Pembimbing',
  penguji: 'Dewan Penguji',
  koorprodi: 'Koordinator Program Studi',
  admin: 'Admin Akademik',
  superadmin: 'Super Admin'
};

console.log('\n====================================================');
console.log('KREDENSIAL DEMO LOKAL — SIM-TA FEB UTM');
console.log('====================================================');
console.log(`URL aplikasi : http://localhost:5001`);
console.log(`Kata sandi   : ${DEMO_PASSWORD}  (seragam untuk seluruh akun demo)`);
console.log('----------------------------------------------------');
console.log('Peran              | NIP/NIM             | Nama');
console.log('-------------------+---------------------+--------------------------------');
for (const a of TEST_ACCOUNTS) {
  const label = (ROLE_LABEL[a.role] || a.role).padEnd(18);
  const nip = a.nomorInduk.padEnd(20);
  console.log(`${label} | ${nip} | ${a.nama}`);
}
console.log('====================================================\n');
