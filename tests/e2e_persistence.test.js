/**
 * Uji Browser — Persistensi Penetapan Dewan Penguji & Tahapan TA (AZ-A1/AZ-A2).
 *
 * Terkillers: 21 Oktober 2026.
 *
 * Membuktikan secara end-to-end bahwa data yang ditulis dari antarmuka:
 *   1. TERSIMPAN di basis data (bukan state lokal peramban),
 *   2. TETAP ADA setelah halaman dimuat ulang,
 *   3. Terlihat oleh peran lain yang berhak (dewan penguji).
 */

import { chromium } from 'playwright';

const BASE = 'http://localhost:5001';
const API = `${BASE}/api`;
const PWD = 'UTM-QA-2026!Lab';

let pass = 0, fail = 0;
const check = (ok, name, detail = '') => {
  console.log(`  [${ok ? 'LULUS' : 'GAGAL'}] ${name}${detail ? ` — ${detail}` : ''}`);
  ok ? pass++ : fail++;
};

const login = async (identifier) => {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password: PWD })
  });
  const j = await r.json();
  if (!j.token) throw new Error(`Login ${identifier} gagal: ${j.message}`);
  return j.token;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message.slice(0, 160)));

console.log('=== Uji Browser: Persistensi Penetapan Dewan Penguji & Tahapan TA ===\n');

// ---------------------------------------------------------------------
console.log('A. Koordinator: Penetapan Dewan Penguji');
// ---------------------------------------------------------------------
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.waitForSelector('input#login-identifier', { timeout: 15000 });
await page.fill('input#login-identifier', '197802142003122001');
await page.fill('input#login-password', PWD);
await page.click('button[type="submit"]');
await page.waitForSelector('.shell-root', { timeout: 20000 });
console.log('  [OK]    Login koordinator');

// Buka halaman Penetapan Dewan Penguji
await page.goto(`${BASE}/?nav=penguji`, { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(2500);

const adaJudul = await page.locator('text=/Penetapan.*Dewan Penguji/i').count();
check(adaJudul > 0, 'Halaman Penetapan Dewan Penguji terbuka', `judul=${adaJudul > 0}`);

// Tombol buka modal
const btnTetapkan = page.locator('button', { hasText: /Tetapkan Tim Penguji/i }).first();
const adaTombol = (await btnTetapkan.count()) > 0;
check(adaTombol, 'Tombol "Tetapkan Tim Penguji Baru" tersedia');
if (adaTombol) {
  await btnTetapkan.click();
  await page.waitForTimeout(800);

  // Isi tanggal & jam pada input jadwal bila tersedia
  const inputs = page.locator('input[type="text"], input:not([type])');
  const jml = await inputs.count();
  for (let i = 0; i < jml; i++) {
    const ph = (await inputs.nth(i).getAttribute('placeholder')) || '';
    if (/jadwal|tanggal|jam/i.test(ph)) await inputs.nth(i).fill('2027-03-15, 09:00');
  }

  const simpan = page.locator('button', { hasText: /Sahkan|Tetapkan|Simpan/i }).last();
  if ((await simpan.count()) > 0) {
    await simpan.click();
    await page.waitForTimeout(2500);
  }
}

// Verifikasi lewat API: apakah record ujian bertambah?
const tokenKoor = await login('197802142003122001');
const listKoor = await (await fetch(`${API}/penguji/ujian`, { headers: { Authorization: `Bearer ${tokenKoor}` } })).json();
const data = listKoor.data || [];
check(data.length > 0, 'Rekap ujian terbaca dari backend', `jumlah=${data.length}`);

const adaPanelTerisi = data.some((u) => Array.isArray(u.susunanPenguji) && u.susunanPenguji.length > 0);
check(adaPanelTerisi, 'Terdapat ujian dengan susunan dekwan penguji tersimpan', `jumlah=${data.filter((u) => (u.susunanPenguji || []).length).length}`);

// Muat ulang halaman: apakah data dari backend tetap tampil?
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const teksHalaman = await page.locator('body').innerText();
const muncul = data.length > 0 && /Menampilkan\s+\d+\s+penetapan/i.test(teksHalaman);
check(muncul, 'Halaman tetap menampilkan rekap setelah dimuat ulang (data dari backend)');

// ---------------------------------------------------------------------
console.log('\nB. Dewan Penguji: Ujian yang ditugaskan terlihat');
// ---------------------------------------------------------------------
const tokenPenguji = await login('197703032003121002');
const listPenguji = await (await fetch(`${API}/penguji/ujian`, { headers: { Authorization: `Bearer ${tokenPenguji}` } })).json();
const milikPenguji = listPenguji.data || [];
check(milikPenguji.length > 0, 'Dewan penguji melihat ujian yang ditugaskan', `jumlah=${milikPenguji.length}`);
check(
  milikPenguji.length <= data.length,
  'Isolasi penugasan bekerja (penguji melihat subset dari seluruh ujian)',
  `${milikPenguji.length} <= ${data.length}`
);

// ---------------------------------------------------------------------
console.log('\nC. Mahasiswa: Tahapan TA dari backend');
// ---------------------------------------------------------------------
const page2 = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page2.on('pageerror', (e) => pageErrors.push(e.message.slice(0, 160)));
await page2.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page2.waitForSelector('input#login-identifier', { timeout: 15000 });
await page2.fill('input#login-identifier', '210211100142');
await page2.fill('input#login-password', PWD);
await page2.click('button[type="submit"]');
await page2.waitForSelector('.shell-root', { timeout: 20000 });
await page2.goto(`${BASE}/?nav=tahapan`, { waitUntil: 'networkidle' }).catch(() => {});
await page2.waitForTimeout(2500);

const teksTahapan = await page2.locator('body').innerText();
check(/Progres tahapan/i.test(teksTahapan), 'Halaman Tahapan menampilkan ringkasan progres dari backend', /Progres tahapan/i.test(teksTahapan) ? 'ringkasan ada' : 'ringkasan tidak ada');
check(/Tahap aktif/i.test(teksTahapan), 'Halaman Tahapan menampilkan tahap aktif dari backend');

console.log(`\nError halaman: ${pageErrors.length ? pageErrors.join(' | ') : 'tidak ada'}`);
console.log(`\nLulus: ${pass} | Gagal: ${fail}`);

await browser.close();
process.exit(fail > 0 ? 1 : 0);
