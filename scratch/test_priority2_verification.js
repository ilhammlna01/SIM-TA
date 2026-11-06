/**
 * Verification Probe: Remediasi Prioritas 2 (RBAC Menyeluruh & Eliminasi Client Header Spoofing)
 * SIM Tugas Akhir FEB UTM
 */

import { TEST_PASSWORD, ensureTestAccounts, loginUser } from '../tests/helpers/testAccounts.js';

const BASE_URL = 'http://localhost:5001/api';

async function login(identifier, password = TEST_PASSWORD) {
  return loginUser(BASE_URL, identifier, password);
}

async function runPriority2Verification() {
  console.log('================================================================');
  console.log('🧪 VERIFIKASI REMEDIASI PRIORITAS 2 — RBAC & ELIMINASI SPOOFING');
  console.log('================================================================\n');

  // Kredensial uji deterministik disiapkan di luar jalur HTTP.
  const credPrep = ensureTestAccounts();
  if (!credPrep.ok) {
    console.error('Gagal menyiapkan kredensial uji:', credPrep.message);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  function check(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      if (details) console.log(`     ↳ ${details}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (details) console.error(`     ↳ ${details}`);
      failed++;
    }
  }

  // 1. Dapatkan Token untuk Tiap Peran
  console.log('1. Autentikasi Pengguna & Pengambilan Bearer Token:');
  const mhsToken = await login('210211100142');
  const pengujiToken = await login('197703032003121002');
  const adminToken = await login('198104122008121002');
  const superadminToken = await login('197405102000031001');
  check(Boolean(mhsToken && pengujiToken && adminToken && superadminToken), 'Semua token JWT terbit dengan sah');

  // 2. Eliminasi Client Header Spoofing (x-user-role)
  console.log('\n2. Pengujian Eliminasi Header Spoofing (x-user-role / ?role=...):');
  
  // 2a. Request tanpa token tetapi mengirim x-user-role: superadmin
  const spoof1 = await fetch(`${BASE_URL}/superadmin/users`, {
    headers: { 'x-user-role': 'superadmin', 'x-user-id': 'hacker' }
  });
  const spoof1Body = await spoof1.json().catch(() => ({}));
  check(
    spoof1.status === 401 && spoof1Body.code === 'UNAUTHORIZED_NO_TOKEN',
    'Penyerang mengirim x-user-role: superadmin tanpa JWT DITOLAK 401 Unauthorized',
    `Status: ${spoof1.status} | Code: ${spoof1Body.code}`
  );

  // 2b. Mahasiswa login sah tetapi menyisipkan x-user-role: superadmin di header
  const spoof2 = await fetch(`${BASE_URL}/superadmin/users`, {
    headers: {
      'Authorization': `Bearer ${mhsToken}`,
      'x-user-role': 'superadmin'
    }
  });
  const spoof2Body = await spoof2.json().catch(() => ({}));
  check(
    spoof2.status === 403,
    'Mahasiswa ber-JWT mengirim x-user-role: superadmin DITOLAK 403 (Server abaikan header klien)',
    `Status: ${spoof2.status} | Code: ${spoof2Body.code}`
  );

  // 3. Superadmin Endpoint RBAC
  console.log('\n3. Pengujian Proteksi Endpoint Superadmin (/api/superadmin/*):');
  const superMhs = await fetch(`${BASE_URL}/superadmin/prodi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mhsToken}`
    },
    body: JSON.stringify({ kodeProdi: 'TEST', namaProdi: 'Test Prodi' })
  });
  check(superMhs.status === 403, 'Mahasiswa dilarang POST /superadmin/prodi (403)');

  const superOk = await fetch(`${BASE_URL}/superadmin/users`, {
    headers: { 'Authorization': `Bearer ${superadminToken}` }
  });
  check(superOk.status === 200, 'Superadmin sah mengakses GET /superadmin/users (200)');

  // 4. Admin Endpoint RBAC
  console.log('\n4. Pengujian Proteksi Endpoint Admin (/api/admin/*):');
  const verifAnon = await fetch(`${BASE_URL}/admin/verifikasi-berkas`);
  check(verifAnon.status === 401, 'Request anonim ke GET /admin/verifikasi-berkas ditolak 401');

  const verifAdmin = await fetch(`${BASE_URL}/admin/verifikasi-berkas`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  check(verifAdmin.status === 200, 'Admin sah mengakses GET /admin/verifikasi-berkas (200)');

  // 5. Document Routes RBAC
  console.log('\n5. Pengujian Proteksi Dokumen Resmi (/api/documents/*):');
  const genBaAnon = await fetch(`${BASE_URL}/documents/generate-berita-acara`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nim: '210211100142', namaMahasiswa: 'Ilham' })
  });
  check(genBaAnon.status === 401, 'Request anonim ke POST /documents/generate-berita-acara ditolak 401');

  const genBaMhs = await fetch(`${BASE_URL}/documents/generate-berita-acara`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mhsToken}`
    },
    body: JSON.stringify({ nim: '210211100142', namaMahasiswa: 'Ilham' })
  });
  check(genBaMhs.status === 403, 'Mahasiswa dilarang POST /documents/generate-berita-acara (403)');

  const genBaPenguji = await fetch(`${BASE_URL}/documents/generate-berita-acara`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pengujiToken}`
    },
    body: JSON.stringify({
      nim: '210211100142',
      namaMahasiswa: 'Ilham Maulana',
      jenjang: 'S1',
      prodi: 'S1 Manajemen',
      judul: 'Uji Verifikasi Prioritas 2',
      nilaiAkhir: 88,
      grade: 'A',
      statusKelulusan: 'LULUS',
      penguji: [{ nama: 'Dr. Faidal', peran: 'Penguji', nilai: 88 }]
    })
  });
  const genBaPengujiBody = await genBaPenguji.json();
  check(genBaPenguji.status === 201 && genBaPengujiBody.success, 'Penguji sah menerbitkan Berita Acara (201)');

  // 5b. Verifikasi QR Code Dokumen tetap publik
  const qrCode = genBaPengujiBody.data?.verificationCode;
  if (qrCode) {
    const verifyPub = await fetch(`${BASE_URL}/documents/verify/${qrCode}`);
    const verifyPubBody = await verifyPub.json();
    check(verifyPub.status === 200 && verifyPubBody.verified, 'Verifikasi QR Code tetap terbuka untuk publik (200 OK)');
  }

  // 6. Storage Routes RBAC
  console.log('\n6. Pengujian Proteksi Penyimpanan Berkas (/api/storage/*):');
  const listAnon = await fetch(`${BASE_URL}/storage/list/naskah`);
  check(listAnon.status === 401, 'Request anonim GET /storage/list/naskah ditolak 401');

  const listMhs = await fetch(`${BASE_URL}/storage/list/naskah`, {
    headers: { 'Authorization': `Bearer ${mhsToken}` }
  });
  check(listMhs.status === 403, 'Mahasiswa dilarang GET /storage/list/naskah (403)');

  const listAdmin = await fetch(`${BASE_URL}/storage/list/naskah`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  check(listAdmin.status === 200, 'Admin sah mengakses GET /storage/list/naskah (200)');

  const delMhs = await fetch(`${BASE_URL}/storage/files/naskah/sample_file.pdf`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${mhsToken}` }
  });
  check(delMhs.status === 403, 'Mahasiswa dilarang DELETE /storage/files/... (403)');

  // 7. Notification Routes RBAC
  console.log('\n7. Pengujian Proteksi Notifikasi (/api/notifications/*):');
  const bcastMhs = await fetch(`${BASE_URL}/notifications/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mhsToken}`
    },
    body: JSON.stringify({ title: 'Test', message: 'Test message' })
  });
  check(bcastMhs.status === 403, 'Mahasiswa dilarang broadcast notifikasi sistem (403)');

  const bcastAdmin = await fetch(`${BASE_URL}/notifications/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ title: 'Test Admin', message: 'Test broadcast message' })
  });
  check(bcastAdmin.status === 201, 'Admin sah menyiarkan notifikasi sistem (201)');

  console.log('\n================================================================');
  console.log(`📊 REKAPITULASI HASIL VERIFIKASI PRIORITAS 2:`);
  console.log(`   Langkah Lulus : ${passed}`);
  console.log(`   Langkah Gagal : ${failed}`);
  console.log(`   Status Akhir  : ${failed === 0 ? '🏆 PRIORITAS 2 SELESAI & TERVERIFIKASI 100%' : '⚠️ TERDAPAT MASALAH'}`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runPriority2Verification().catch(err => {
  console.error('Fatal error saat uji verifikasi Prioritas 2:', err);
  process.exit(1);
});
