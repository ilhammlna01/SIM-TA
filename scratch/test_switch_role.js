/**
 * Test Suite Verifikasi Multi-Role Switcher Dosen & Staf Akademik
 */

import { TEST_PASSWORD, ensureTestAccounts } from '../tests/helpers/testAccounts.js';

const API_BASE = 'http://localhost:5001/api';

async function runTests() {
  console.log('=== TEST SUITE: MULTI-ROLE SWITCHER DOSEN (FEB UTM) ===\n');

  const credPrep = ensureTestAccounts();
  if (!credPrep.ok) {
    console.error('Gagal menyiapkan kredensial uji:', credPrep.message);
    process.exit(1);
  }

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  // 1. Login sebagai Dosen (Dr. Faidal - NIP: 197703032003121002)
  console.log('--- 1. Login Akun Dosen / Koorprodi (Dr. Faidal) ---');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '197703032003121002',
      password: TEST_PASSWORD
    })
  });
  const loginJson = await loginRes.json();
  assert(loginRes.status === 200 && loginJson.token, `Login Dr. Faidal berhasil (Token terbit)`);
  assert(
    Array.isArray(loginJson.eligibleRoles) &&
    loginJson.eligibleRoles.includes('dosen') &&
    loginJson.eligibleRoles.includes('penguji') &&
    loginJson.eligibleRoles.includes('koorprodi'),
    `Dr. Faidal memiliki multi-peran sah: [${loginJson.eligibleRoles?.join(', ')}]`
  );

  let currentToken = loginJson.token;

  // 2. Dosen beralih ke peran 'penguji'
  console.log('\n--- 2. Switch Role ke Dewan Penguji ---');
  const switchPengujiRes = await fetch(`${API_BASE}/auth/switch-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${currentToken}`
    },
    body: JSON.stringify({ targetRole: 'penguji' })
  });
  const switchPengujiJson = await switchPengujiRes.json();
  assert(switchPengujiRes.status === 200 && switchPengujiJson.activeRole === 'penguji', 'Beralih ke peran Dewan Penguji sukses (200 OK)');
  assert(switchPengujiJson.token, 'Token sesi baru untuk peran Penguji berhasil diterbitkan');

  // Akses endpoint penguji dengan token peran penguji
  const testPengujiAccess = await fetch(`${API_BASE}/penguji/ujian`, {
    headers: { Authorization: `Bearer ${switchPengujiJson.token}` }
  });
  assert(testPengujiAccess.status === 200, 'Token peran Penguji sah mengakses direktori ujian penguji (200 OK)');

  currentToken = switchPengujiJson.token;

  // 3. Dosen beralih ke peran 'koorprodi'
  console.log('\n--- 3. Switch Role ke Koordinator Program Studi ---');
  const switchKoorRes = await fetch(`${API_BASE}/auth/switch-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${currentToken}`
    },
    body: JSON.stringify({ targetRole: 'koorprodi' })
  });
  const switchKoorJson = await switchKoorRes.json();
  assert(switchKoorRes.status === 200 && switchKoorJson.activeRole === 'koorprodi', 'Beralih ke peran Koorprodi sukses (200 OK)');

  // 4. Dosen beralih kembali ke peran 'dosen' (Pembimbing)
  console.log('\n--- 4. Switch Role ke Dosen Pembimbing ---');
  const switchDosenRes = await fetch(`${API_BASE}/auth/switch-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${switchKoorJson.token}`
    },
    body: JSON.stringify({ targetRole: 'dosen' })
  });
  const switchDosenJson = await switchDosenRes.json();
  assert(switchDosenRes.status === 200 && switchDosenJson.activeRole === 'dosen', 'Beralih kembali ke Dosen Pembimbing sukses (200 OK)');

  // 5. Proteksi Keamanan: Mahasiswa dilarang switch role
  console.log('\n--- 5. Proteksi Keamanan (Anti-Privilege Escalation) ---');
  const mhsLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '210211100142', // Dinda Ayu (Mahasiswa)
      password: TEST_PASSWORD
    })
  });
  const mhsLoginJson = await mhsLoginRes.json();
  assert(mhsLoginRes.status === 200, 'Login Mahasiswa berhasil');
  assert(
    mhsLoginJson.eligibleRoles?.length === 1 && mhsLoginJson.eligibleRoles[0] === 'mahasiswa',
    'Mahasiswa hanya memiliki tepat 1 peran eligible: [mahasiswa]'
  );

  const mhsSwitchAttempt = await fetch(`${API_BASE}/auth/switch-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mhsLoginJson.token}`
    },
    body: JSON.stringify({ targetRole: 'dosen' })
  });
  assert(mhsSwitchAttempt.status === 403, 'Percobaan Mahasiswa beralih peran ke Dosen DITOLAK KERAS server (403 Forbidden)');

  console.log(`\n========================================`);
  console.log(`HASIL TEST SWITCH ROLE: ${passed} / ${total} PENGUJIAN LULUS (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
