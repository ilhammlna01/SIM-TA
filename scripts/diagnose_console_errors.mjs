/**
 * Rincian error konsol & status respons API pada :5001 dan :5173.
 */

import { chromium } from 'playwright';

const PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || 'UTM-QA-2026!Lab';
const NIP = '210211100142';

const TARGETS = [
  { label: ':5001 (produksi)', base: 'http://localhost:5001' },
  { label: ':5173 (dev)', base: 'http://localhost:5173' }
];

const browser = await chromium.launch();

for (const t of TARGETS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const statuses = new Map();
  const consoleMsgs = [];
  const pageErrors = [];

  page.on('response', (r) => {
    if (!r.url().includes('/api/')) return;
    const key = `${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`;
    statuses.set(key, (statuses.get(key) || 0) + 1);
  });
  page.on('console', (m) => { if (m.type() === 'error') consoleMsgs.push(m.text().slice(0, 150)); });
  page.on('pageerror', (e) => pageErrors.push(e.message.slice(0, 150)));

  await page.goto(t.base, { waitUntil: 'load' });
  await page.waitForSelector('input#login-identifier', { timeout: 15000 });
  await page.fill('input#login-identifier', NIP);
  await page.fill('input#login-password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.shell-root', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.goto(`${t.base}/mahasiswa/dashboard`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1500);

  console.log(`\n===== ${t.label} =====`);
  console.log('  Status respons API:');
  for (const [k, v] of [...statuses.entries()].sort()) {
    console.log(`    ${v}x  ${k}`);
  }
  console.log(`  Console error (${consoleMsgs.length}):`);
  for (const m of [...new Set(consoleMsgs)].slice(0, 8)) console.log(`    - ${m}`);
  console.log(`  Page error (${pageErrors.length}): ${pageErrors.length ? pageErrors.join(' | ') : 'tidak ada'}`);

  await ctx.close();
}

await browser.close();
