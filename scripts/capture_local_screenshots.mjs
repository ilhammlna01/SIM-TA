/**
 * Tangkapan layar aplikasi lokal untuk verifikasi visual.
 * Menghasilkan: screenshot/sesi-<peran>.png
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = 'http://localhost:5001';
const PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || 'UTM-QA-2026!Lab';
const OUT = path.resolve('screenshot');

const ROLES = [
  { label: 'mahasiswa', nip: '210211100142', halaman: '/mahasiswa/dashboard' },
  { label: 'dosen', nip: '196201081987032001', halaman: '/dosen/bimbingan' },
  { label: 'penguji', nip: '197703032003121002', halaman: '/penguji/ujian' },
  { label: 'koorprodi', nip: '197802142003122001', halaman: '/koorprodi/pembimbing' },
  { label: 'admin', nip: '198104122008121002', halaman: '/admin/verifikasi-berkas' },
  { label: 'superadmin', nip: '197405102000031001', halaman: '/superadmin/pengguna' }
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];

for (const r of ROLES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  page.on('pageerror', (e) => errors.push(`[${r.label}] pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${r.label}] console: ${m.text().slice(0, 160)}`);
  });

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input#login-identifier', { timeout: 15000 });
  await page.screenshot({ path: path.join(OUT, '00-halaman-login.png'), fullPage: false });

  // Login (selector sama dengan suite E2E resmi)
  await page.fill('input#login-identifier', r.nip);
  await page.fill('input#login-password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.shell-root', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const url = page.url();
  await page.goto(`${BASE}${r.halaman}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, `sesi-${r.label}.png`), fullPage: false });

  const rootHtml = await page.locator('#root').innerHTML().catch(() => '');
  const isBlank = rootHtml.trim().length < 100;
  console.log(
    `  ${isBlank ? '[KOSONG]' : '[OK]    '} ${r.label.padEnd(12)} login->${url.replace(BASE, '')} | ${r.halaman} | root ${rootHtml.length} char`
  );

  await ctx.close();
}

await browser.close();

if (errors.length) {
  console.log('\nError browser yang terdeteksi:');
  for (const e of [...new Set(errors)].slice(0, 20)) console.log('  - ' + e);
} else {
  console.log('\nTidak ada error console/pageerror pada seluruh peran.');
}
console.log(`\nScreenshot tersimpan di: ${OUT}`);
