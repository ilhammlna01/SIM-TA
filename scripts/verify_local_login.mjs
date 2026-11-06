/**
 * Verifikasi login lokal seluruh peran demo terhadap server yang berjalan.
 */

const BASE = 'http://localhost:5001/api';
const PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || 'UTM-QA-2026!Lab';

const ACCOUNTS = [
  ['Mahasiswa', '210211100142'],
  ['Mahasiswa S3', '220231600004'],
  ['Mahasiswa (Andi)', '210211100099'],
  ['Dewan Penguji', '197703032003121002'],
  ['Dosen Pembimbing', '196201081987032001'],
  ['Dosen Pembimbing 2', '196203031988032001'],
  ['Koordinator Prodi', '197802142003122001'],
  ['Admin Akademik', '198104122008121002'],
  ['Super Admin', '197405102000031001']
];

let okCount = 0;
let failCount = 0;

for (const [label, nip] of ACCOUNTS) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: nip, password: PASSWORD })
  });
  const body = await res.json().catch(() => ({}));

  if (res.status === 200 && body.token) {
    const me = await fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${body.token}` } });
    const meBody = await me.json().catch(() => ({}));
    const roles = (meBody?.user?.eligibleRoles || []).join(', ');
    console.log(`  [OK]   ${label.padEnd(20)} ${nip}  -> role=${body.user?.role}  [${roles}]`);
    okCount++;
  } else {
    console.log(`  [GAGAL] ${label.padEnd(20)} ${nip}  -> ${res.status} ${body.message || body.error || ''}`);
    failCount++;
  }
}

console.log(`\nLogin berhasil: ${okCount} | Gagal: ${failCount}`);
process.exit(failCount > 0 ? 1 : 0);
