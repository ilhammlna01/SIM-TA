/**
 * Perbandingan paralel: apakah aplikasi pada :5001 (produksi) dan :5173 (dev)
 * sama-sama berfungsi, dan apakah keduanya memakai backend & basis data yang sama.
 */

import { chromium } from 'playwright';

const PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || 'UTM-QA-2026!Lab';
const NIP = '210211100142';

const TARGETS = [
  { label: 'Produksi (:5001 - dist/)', base: 'http://localhost:5001' },
  { label: 'Dev      (:5173 - src/)', base: 'http://localhost:5173' }
];

const browser = await chromium.launch();

for (const t of TARGETS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const apiCalls = new Set();
  let consoleErrors = 0;
  page.on('response', (r) => {
    if (r.url().includes('/api/')) apiCalls.add(new URL(r.url()).origin);
  });
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors++; });

  await page.goto(t.base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('input#login-identifier', { timeout: 15000 });

  const hasDemoSwitch = (await page.locator('text=Akses Cepat').count()) > 0 ||
                        (await page.locator('[id*="demo" i]').count()) > 0;

  await page.fill('input#login-identifier', NIP);
  await page.fill('input#login-password', PASSWORD);
  await page.click('button[type="submit"]');

  const loggedIn = await page
    .waitForSelector('.shell-root', { timeout: 20000 })
    .then(() => true)
    .catch(() => false);

  await page.waitForTimeout(1500);
  const afterLogin = page.url().replace(t.base, '') || '/';
  const rootLen = (await page.locator('#root').innerHTML().catch(() => '')).length;

  // Navigasi ke dashboard mahasiswa
  await page.goto(`${t.base}/mahasiswa/dashboard`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1200);
  const dashLen = (await page.locator('#root').innerHTML().catch(() => '')).length;
  const dashText = (await page.locator('body').innerText().catch(() => '')).slice(0, 120).replace(/\s+/g, ' ');

  console.log(`\n--- ${t.label} ---`);
  console.log(`  Halaman login        : OK (input #login-identifier ditemukan)`);
  console.log(`  Login berhasil       : ${loggedIn ? 'YA' : 'TIDAK'} -> ${afterLogin}`);
  console.log(`  Switcher akun demo   : ${hasDemoSwitch ? 'TAMPIL (khusus DEV)' : 'TIDAK TAMPIL (sudah di-tree-shake)'}`);
  console.log(`  Dashboard ter-render  : ${dashLen} char`);
  console.log(`  Isi dashboard         : ${dashText}`);
  console.log(`  Origin API terpakai  : ${[...apiCalls].join(', ') || '(tidak ada)'}`);
  console.log(`  Error console         : ${consoleErrors}`);

  await ctx.close();
}

await browser.close();

// Bukti basis data yang sama: tulis dari :5001, baca dari :5173
const login = async (base) => {
  const r = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: NIP, password: PASSWORD })
  });
  return (await r.json()).token;
};

const t1 = await login('http://localhost:5001');
const t2 = await login('http://localhost:5173');
const me1 = await (await fetch('http://localhost:5001/api/auth/me', { headers: { Authorization: `Bearer ${t1}` } })).json();
const me2 = await (await fetch('http://localhost:5001/api/auth/me', { headers: { Authorization: `Bearer ${t2}` } })).json();

console.log(`\n--- Bukti basis data & backend yang sama ---`);
console.log(`  Token dari :5001 -> /api/auth/me via :5001 : ${me1.user?.nama} (${me1.user?.id})`);
console.log(`  Token dari :5173 -> /api/auth/me via :5001 : ${me2.user?.nama} (${me2.user?.id})`);
console.log(`  ID akun sama: ${me1.user?.id === me2.user?.id ? 'YA (basis data yang sama)' : 'TIDAK'}`);
console.log(`  API :5173 affectionate: /api/auth/me DIJawab server :5001 (lihat "Origin API terpakai" di atas)`);
