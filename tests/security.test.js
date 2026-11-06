/**
 * Automated Security & Penetration Testing Suite
 * SIM Tugas Akhir FEB UTM (Fase 5: QA / Testing)
 * 
 * Menguji:
 * 1. Zero-Trust JWT: Request tanpa Bearer token ditolak dengan HTTP 401 Unauthorized
 * 2. Role-Based Access Control (RBAC):
 *    - Mahasiswa dilarang keras memanipulasi form penilaian penguji (403 Forbidden)
 *    - Mahasiswa dilarang keras menambah koreksi penguji (403 Forbidden)
 *    - Mahasiswa dilarang keras mengakses daftar seluruh ujian penguji (403 Forbidden)
 *    - Mahasiswa dilarang keras mengakses manajemen pengguna superadmin (403 Forbidden)
 *    - Mahasiswa dilarang keras menerbitkan Berita Acara resmi (403 Forbidden)
 *    - Mahasiswa dilarang keras menghapus berkas penyimpanan (403 Forbidden)
 * 3. Hak Akses Berwenang (Authorized):
 *    - Superadmin sah mengakses manajemen pengguna (200 OK)
 *    - Penguji sah mengakses direktori ujian sidang (200 OK)
 *    - Admin sah mengakses log email SLA & audit log keamanan (200 OK)
 * 4. Proteksi Kerahasiaan Naskah Intelektual Mahasiswa Lain (403/404)
 * 5. Ketahanan Serangan Siber Path Traversal (400 Bad Request)
 * 6. Integritas Pencatatan Insiden Pelanggaran Keamanan pada SQLite audit_log
 */

const BASE_URL = 'http://localhost:5001/api';

import { TEST_PASSWORD, ensureTestAccounts } from './helpers/testAccounts.js';

async function loginUser(identifier, password = TEST_PASSWORD) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(`Gagal login user ${identifier}: ${data.message || 'No token'}`);
  }
  return data.token;
}

async function runSecurityTests() {
  // Audit 21 Oktober 2026: siapkan kredensial uji deterministik di luar jalur HTTP.
  // (Kredensial universal institusi tidak lagi berlaku di aplikasi).
  const credPrep = ensureTestAccounts();
  if (!credPrep.ok) {
    console.error('Gagal menyiapkan kredensial uji:', credPrep.message);
    process.exit(1);
  }


  console.log('====================================================');
  console.log('🛡️  SIM-TA FEB UTM — COMPREHENSIVE RBAC & SECURITY SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      if (details) console.log(`     ↳ ${details}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (details) console.error(`     ↳ ${details}`);
      failedCount++;
    }
  }

  // Persiapan Token JWT Resmi via Login
  let mhsToken = '';
  let pengujiToken = '';
  let superadminToken = '';
  let adminToken = '';

  try {
    mhsToken = await loginUser('210211100142'); // Dinda Ayu Larasati (Mahasiswa)
    pengujiToken = await loginUser('197703032003121002'); // Dr. Faidal (Penguji)
    superadminToken = await loginUser('197405102000031001'); // Ir. Supriyanto (Superadmin)
    adminToken = await loginUser('198104122008121002'); // Ahmad Fauzi (Admin Akademik)
  } catch (err) {
    console.error('Gagal melakukan login persiapan token:', err.message);
  }

  // ----------------------------------------------------
  // TEST 0: Request tanpa token ditolak dengan HTTP 401
  // ----------------------------------------------------
  console.log('🔒 Skenario 0: Penolakan Akses Tanpa Token Kriptografis (Zero-Trust)');
  try {
    const res = await fetch(`${BASE_URL}/penguji/ujian/uj-pgj-1/penilaian`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nilaiFinal: 99.5, grade: 'A' })
    });
    const body = await res.json().catch(() => ({}));
    assert(
      res.status === 401 && body.code === 'UNAUTHORIZED_NO_TOKEN',
      'Request tanpa Bearer token ditolak dengan HTTP 401 Unauthorized',
      `HTTP Status: ${res.status} | Code: ${body.code}`
    );
  } catch (err) {
    assert(false, 'Request tanpa token gagal', err.message);
  }

  // ----------------------------------------------------
  // TEST 1: Mahasiswa mencoba manipulasi Form Penilaian Penguji
  // ----------------------------------------------------
  console.log('\n🔒 Skenario 1: Proteksi Form Penilaian Dewan Penguji (RBAC)');
  try {
    const res = await fetch(`${BASE_URL}/penguji/ujian/uj-pgj-1/penilaian`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mhsToken}`
      },
      body: JSON.stringify({
        nilaiFinal: 99.5,
        grade: 'A',
        rekomendasiKelayakan: 'Layak Tanpa Revisi',
        catatanEvaluasi: 'Upaya injeksi nilai ilegal oleh akun mahasiswa'
      })
    });

    const body = await res.json();
    assert(
      res.status === 403 && body.code === 'FORBIDDEN_MAHASISWA_ACCESS',
      'Mahasiswa dilarang keras submit nilai ke form dewan penguji (403 Forbidden)',
      `HTTP Status: ${res.status} | Code: ${body.code}`
    );
  } catch (err) {
    assert(false, 'Request ke endpoint penguji gagal', err.message);
  }

  // ----------------------------------------------------
  // TEST 2: Mahasiswa mencoba input Catatan Koreksi Penguji
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/penguji/koreksi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mhsToken}`
      },
      body: JSON.stringify({
        ujianId: 'uj-pgj-1',
        catatanKoreksi: 'Mencoba membuat koreksi palsu'
      })
    });

    const body = await res.json();
    assert(
      res.status === 403,
      'Mahasiswa dilarang keras menambah catatan koreksi penguji (403 Forbidden)',
      `HTTP Status: ${res.status} | Pesan: ${body.error}`
    );
  } catch (err) {
    assert(false, 'Request POST /koreksi gagal', err.message);
  }

  // ----------------------------------------------------
  // TEST 3: Mahasiswa mencoba mengakses direktori ujian penguji
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/penguji/ujian`, {
      headers: {
        'Authorization': `Bearer ${mhsToken}`
      }
    });

    const body = await res.json();
    assert(
      res.status === 403,
      'Mahasiswa dilarang melihat daftar seluruh ujian penguji (403 Forbidden)',
      `HTTP Status: ${res.status} | Pesan: ${body.error}`
    );
  } catch (err) {
    assert(false, 'Request GET /penguji/ujian gagal', err.message);
  }

  // ----------------------------------------------------
  // TEST 4: Proteksi Endpoint Superadmin & Admin dari Mahasiswa
  // ----------------------------------------------------
  console.log('\n🔒 Skenario 2: Proteksi Endpoint Administratif & Superadmin (RBAC)');
  try {
    const resUsers = await fetch(`${BASE_URL}/superadmin/users`, {
      headers: { 'Authorization': `Bearer ${mhsToken}` }
    });
    const bodyUsers = await resUsers.json();
    assert(
      resUsers.status === 403,
      'Mahasiswa dilarang mengakses daftar seluruh pengguna (/superadmin/users)',
      `HTTP Status: ${resUsers.status} | Code: ${bodyUsers.code}`
    );

    const resDeleteFile = await fetch(`${BASE_URL}/storage/files/naskah/sample_file.pdf`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${mhsToken}` }
    });
    const bodyDel = await resDeleteFile.json();
    assert(
      resDeleteFile.status === 403,
      'Mahasiswa dilarang menghapus berkas penyimpanan (/storage/files/...)',
      `HTTP Status: ${resDeleteFile.status} | Code: ${bodyDel.code}`
    );

    const resGenBA = await fetch(`${BASE_URL}/documents/generate-berita-acara`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mhsToken}`
      },
      body: JSON.stringify({
        nim: '210211100142',
        namaMahasiswa: 'Ilham Maulana',
        statusKelulusan: 'LULUS DENGAN PUJIAN'
      })
    });
    const bodyGenBA = await resGenBA.json();
    assert(
      resGenBA.status === 403,
      'Mahasiswa dilarang mencetak Berita Acara resmi mandiri',
      `HTTP Status: ${resGenBA.status} | Code: ${bodyGenBA.code}`
    );
  } catch (err) {
    assert(false, 'Uji proteksi admin gagal', err.message);
  }

  // ----------------------------------------------------
  // TEST 5: Proteksi Kerahasiaan Naskah Mahasiswa Lain (Relasi DB & Anti-Bypass)
  // ----------------------------------------------------
  console.log('\n🔒 Skenario 3: Proteksi Kerahasiaan Naskah & Integritas Dokumen Resmi (Relasi DB)');
  try {
    // 5.1 Naskah Bambang S3
    const resBambang = await fetch(`${BASE_URL}/storage/files/naskah/naskah_rahasia_bambang_s3.pdf`, {
      headers: { 'Authorization': `Bearer ${mhsToken}` }
    });
    assert(
      resBambang.status === 403 || resBambang.status === 404,
      'Mahasiswa dilarang mengunduh naskah rahasia mahasiswa lain (Bambang)',
      `HTTP Status: ${resBambang.status}`
    );

    // 5.2 Naskah Andi (Nama file biasa tanpa keyword 'bambang'/'rahasia', terdaftar milik mahasiswa lain di SQLite)
    const resAndi = await fetch(`${BASE_URL}/storage/files/naskah/skripsi_andi.pdf`, {
      headers: { 'Authorization': `Bearer ${mhsToken}` }
    });
    assert(
      resAndi.status === 403 || resAndi.status === 404,
      'Mahasiswa dilarang mengunduh skripsi_andi.pdf (Verifikasi Relasional Hak Cipta SQLite)',
      `HTTP Status: ${resAndi.status}`
    );

    // 5.3 Upaya Pemalsuan Berita Acara untuk Mahasiswa Fiktif Ditolak
    const fakeBa = await fetch(`${BASE_URL}/documents/generate-berita-acara`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pengujiToken}`
      },
      body: JSON.stringify({
        nim: '999999999999',
        namaMahasiswa: 'Fulan Palsu',
        nilaiFinal: 100
      })
    });
    const fakeBaBody = await fakeBa.json();
    assert(
      fakeBa.status === 404 && fakeBaBody.code === 'EXAM_RECORD_NOT_FOUND',
      'Penerbitan Berita Acara fiktif ditolak karena tidak terdaftar di database',
      `HTTP Status: ${fakeBa.status} | Code: ${fakeBaBody.code}`
    );
  } catch (err) {
    assert(false, 'Request ke naskah rahasia / dokumen gagal', err.message);
  }

  // ----------------------------------------------------
  // TEST 6: Percobaan Serangan Path Traversal
  // ----------------------------------------------------
  console.log('\n🔒 Skenario 4: Uji Ketahanan Serangan Siber (Path Traversal)');
  try {
    const res = await fetch(`${BASE_URL}/storage/files/naskah/..%2f..%2fdata%2fsim_ta_feb_utm.db`);
    const body = await res.json().catch(() => ({}));

    assert(
      res.status === 400 || res.status === 403,
      'Percobaan Path Traversal "..%2f..%2f" berhasil ditangkal server',
      `HTTP Status: ${res.status} | Pesan: ${body.error || 'Blocked'}`
    );
  } catch (err) {
    assert(false, 'Uji path traversal gagal', err.message);
  }

  // ----------------------------------------------------
  // TEST 7: Verifikasi Hak Akses yang Sah (Authorized Access)
  // ----------------------------------------------------
  console.log('\n🔒 Skenario 5: Verifikasi Hak Akses yang Sah (Authorized Access)');
  try {
    // 7.1 Superadmin sah mengakses manajemen user
    const resSuper = await fetch(`${BASE_URL}/superadmin/users`, {
      headers: { 'Authorization': `Bearer ${superadminToken}` }
    });
    const bodySuper = await resSuper.json();
    assert(
      resSuper.status === 200 && bodySuper.success === true,
      'Super Admin sah mengakses manajemen akun pengguna (/superadmin/users)',
      `Total akun: ${bodySuper.data ? bodySuper.data.length : 0}`
    );

    // 7.2 Penguji sah mengakses direktori ujian sidang
    const resPenguji = await fetch(`${BASE_URL}/penguji/ujian`, {
      headers: { 'Authorization': `Bearer ${pengujiToken}` }
    });
    const bodyPenguji = await resPenguji.json();
    assert(
      resPenguji.status === 200 && bodyPenguji.success === true,
      'Dosen Penguji sah mengakses direktori ujian sidang via JWT',
      `Total data ujian: ${bodyPenguji.data ? bodyPenguji.data.length : 0}`
    );

    // 7.3 Admin sah mengakses log email SLA
    const resAdmin = await fetch(`${BASE_URL}/notifications/email-logs`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const bodyAdmin = await resAdmin.json();
    assert(
      resAdmin.status === 200 && bodyAdmin.success === true,
      'Admin Akademik sah mengakses riwayat log email SLA sistem',
      `Total log: ${bodyAdmin.data ? bodyAdmin.data.length : 0}`
    );
  } catch (err) {
    assert(false, 'Akses pengguna sah gagal', err.message);
  }

  // ----------------------------------------------------
  // TEST 8: Integritas Audit Log Keamanan di SQLite
  // ----------------------------------------------------
  console.log('\n🔒 Skenario 6: Integritas Audit Log Forensik Keamanan SQLite');
  try {
    const resAudit = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const bodyAudit = await resAudit.json();
    const hasLogs = bodyAudit.data && bodyAudit.data.length > 0;
    assert(
      resAudit.status === 200 && hasLogs,
      'Pencatatan insiden keamanan terverifikasi aktif di tabel audit_log SQLite',
      `Total rekaman forensik terbaru: ${bodyAudit.data ? bodyAudit.data.length : 0}`
    );
  } catch (err) {
    assert(false, 'Pengecekan audit_log gagal', err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 HASIL PENGUJIAN KEAMANAN:`);
  console.log(`   Total Berhasil: ${passedCount}`);
  console.log(`   Total Gagal   : ${failedCount}`);
  console.log(`   Status Akhir  : ${failedCount === 0 ? '🏆 100% SECURE & PASSED (JWT ENFORCED)' : '⚠️ PERLU PERBAIKAN'}`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSecurityTests();
