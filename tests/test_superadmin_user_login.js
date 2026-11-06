/**
 * Test: Superadmin Add User & Immediate Login Verification
 * Memastikan akun yang ditambahkan superadmin dapat langsung login ke backend.
 */

const BASE_URL = 'http://localhost:5001/api';

import { TEST_PASSWORD, ensureTestAccounts } from './helpers/testAccounts.js';

async function testSuperadminAddUserAndLogin() {
  console.log('====================================================');
  console.log('🧪 VERIFIKASI LOGIN AKUN BARU DARI SUPERADMIN');
  console.log('====================================================\n');

  // Audit 21 Oktober 2026: siapkan kredensial uji deterministik di luar jalur HTTP.
  const credPrep = ensureTestAccounts();
  if (!credPrep.ok) {
    console.error('Gagal menyiapkan kredensial uji:', credPrep.message);
    process.exit(1);
  }


  // 1. Login sebagai Superadmin (Ir. Supriyanto, M.T. - NIP: 197405102000031001)
  console.log('1. Login Super Admin (NIP: 197405102000031001)...');
  const saRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '197405102000031001', password: TEST_PASSWORD })
  });
  const saData = await saRes.json();
  if (!saRes.ok || !saData.token) {
    throw new Error('Gagal login superadmin: ' + (saData.message || 'No token'));
  }
  const superadminToken = saData.token;
  console.log('   ✅ Super Admin berhasil login. Token diperoleh.\n');

  // 2. Tambah Akun Mahasiswa Baru
  const testStudent = {
    nomor_induk: '210211100888',
    nama: 'Budi Santoso Uji Coba',
    email: 'budi.santoso.uji@student.trunojoyo.ac.id',
    role: 'mahasiswa',
    prodi: 'S1 Manajemen',
    strata: 'S1',
    password: TEST_PASSWORD
  };

  console.log(`2. Super Admin menambahkan Mahasiswa Baru (NIM: ${testStudent.nomor_induk})...`);
  const createMhsRes = await fetch(`${BASE_URL}/superadmin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${superadminToken}`
    },
    body: JSON.stringify(testStudent)
  });
  const createMhsData = await createMhsRes.json();
  if (!createMhsRes.ok) {
    throw new Error('Gagal tambah user mahasiswa: ' + (createMhsData.message || 'Error'));
  }
  console.log('   ✅ Akun Mahasiswa berhasil disimpan ke SQLite backend.\n');

  // 3. Login Akun Mahasiswa Baru Menggunakan NIM
  console.log('3. Mencoba login Mahasiswa Baru menggunakan NIM...');
  const loginNimRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testStudent.nomor_induk, password: TEST_PASSWORD })
  });
  const loginNimData = await loginNimRes.json();
  if (!loginNimRes.ok || !loginNimData.token) {
    throw new Error('Gagal login via NIM: ' + (loginNimData.message || 'No token'));
  }
  console.log(`   ✅ Berhasil Login via NIM! Selamat datang, ${loginNimData.user.nama} (${loginNimData.user.role})`);
  console.log(`   ↳ Token JWT: ${loginNimData.token.substring(0, 25)}...\n`);

  // 4. Login Akun Mahasiswa Baru Menggunakan Email
  console.log('4. Mencoba login Mahasiswa Baru menggunakan Email...');
  const loginEmailRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testStudent.email, password: TEST_PASSWORD })
  });
  const loginEmailData = await loginEmailRes.json();
  if (!loginEmailRes.ok || !loginEmailData.token) {
    throw new Error('Gagal login via Email: ' + (loginEmailData.message || 'No token'));
  }
  console.log(`   ✅ Berhasil Login via Email! User ID: ${loginEmailData.user.id}\n`);

  // 5. Tambah Akun Dosen Baru
  const testDosen = {
    nomor_induk: '198801012019031888',
    nama: 'Dr. Hendra Gunawan, S.E., M.Si.',
    email: 'hendra.gunawan@trunojoyo.ac.id',
    role: 'dosen',
    prodi: 'S1 Akuntansi',
    password: TEST_PASSWORD
  };

  console.log(`5. Super Admin menambahkan Dosen Baru (NIP: ${testDosen.nomor_induk})...`);
  const createDosenRes = await fetch(`${BASE_URL}/superadmin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${superadminToken}`
    },
    body: JSON.stringify(testDosen)
  });
  const createDosenData = await createDosenRes.json();
  if (!createDosenRes.ok) {
    throw new Error('Gagal tambah user dosen: ' + (createDosenData.message || 'Error'));
  }
  console.log('   ✅ Akun Dosen berhasil disimpan ke SQLite backend.\n');

  // 6. Login Akun Dosen Baru Menggunakan NIP
  console.log('6. Mencoba login Dosen Baru menggunakan NIP...');
  const loginDosenRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testDosen.nomor_induk, password: TEST_PASSWORD })
  });
  const loginDosenData = await loginDosenRes.json();
  if (!loginDosenRes.ok || !loginDosenData.token) {
    throw new Error('Gagal login via NIP: ' + (loginDosenData.message || 'No token'));
  }
  console.log(`   ✅ Berhasil Login Dosen via NIP! Selamat datang, ${loginDosenData.user.nama} (${loginDosenData.user.role})`);
  console.log(`   ↳ Role: ${loginDosenData.user.role}\n`);

  // 7. Cleanup User Uji
  console.log('7. Membersihkan akun uji coba...');
  await fetch(`${BASE_URL}/superadmin/users/${testStudent.nomor_induk}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${superadminToken}` }
  });
  await fetch(`${BASE_URL}/superadmin/users/${testDosen.nomor_induk}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${superadminToken}` }
  });
  console.log('   ✅ Akun uji coba berhasil dibersihkan dari database.\n');

  console.log('====================================================');
  console.log('🎉 SEMUA PENGUJIAN LOGIN AKUN BARU BERHASIL 100%!');
  console.log('====================================================');
}

testSuperadminAddUserAndLogin().catch(err => {
  console.error('❌ Terjadi kesalahan pengujian:', err);
  process.exit(1);
});
