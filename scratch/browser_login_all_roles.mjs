/**
 * E2E Browser Walkthrough — SIM-TA FEB UTM
 * Login satu per satu (form login resmi) untuk setiap peran, lalu menelusuri
 * seluruh menu sidebar per peran di browser Chromium sungguhan.
 *
 * Menghasilkan screenshot ke scratch/e2e_screenshots/<role>/ dan laporan ringkas.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:5001';
const PASSWORD = 'FEB-UTM-2026';
const OUT_ROOT = path.resolve('scratch/e2e_screenshots');

const ROLES = [
  { key: 'mahasiswa',  label: 'Mahasiswa',        identifier: '210211100142' },
  { key: 'dosen',      label: 'Dosen Pembimbing', identifier: '196201081987032001' },
  { key: 'koorprodi',  label: 'Koorprodi',        identifier: '197802142003122001' },
  { key: 'penguji',    label: 'Dewan Penguji',    identifier: '197703032003121002' },
  { key: 'admin',      label: 'Admin Akademik',   identifier: '198104122008121002' },
  { key: 'superadmin', label: 'Super Admin',      identifier: '197405102000031001' }
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(OUT_ROOT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = [];

  for (const role of ROLES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    const consoleErrors = [];
    const pageErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const dir = path.join(OUT_ROOT, role.key);
    fs.mkdirSync(dir, { recursive: true });

    const entry = { role: role.label, key: role.key, login: null, pages: [], consoleErrors, pageErrors };

    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

      // Form login resmi
      await page.waitForSelector('input#login-identifier', { timeout: 15000 });
      await page.fill('input#login-identifier', role.identifier);
      await page.fill('input#login-password', PASSWORD);
      await page.screenshot({ path: path.join(dir, '00-login-form.png') });

      await page.click('button[type="submit"]');

      // Tunggu shell aplikasi muncul (berhasil login)
      await page.waitForSelector('.shell-root', { timeout: 20000 });
      await sleep(1200);

      const roleShown = await page.locator('.topbar-user-role').first().innerText().catch(() => '');
      const nameShown = await page.locator('.topbar-user-name').first().innerText().catch(() => '');
      entry.login = { ok: true, roleShown, nameShown };
      await page.screenshot({ path: path.join(dir, '01-dashboard.png'), fullPage: true });

      // Telusuri semua menu sidebar per peran
      const navButtons = page.locator('.sidebar-nav-btn');
      const count = await navButtons.count();
      const seen = new Set();

      for (let i = 0; i < count; i++) {
        const btn = navButtons.nth(i);
        const label = (await btn.innerText().catch(() => '')).trim().replace(/\s+/g, ' ');
        if (!label || seen.has(label)) continue;
        seen.add(label);

        try {
          await btn.click();
          await sleep(900);
          const shellAlive = await page.locator('.shell-root').count();
          const errBoundary = await page.locator('text=/Terjadi Kesalahan|Something went wrong/i').count();
          const file = `${String(i + 1).padStart(2, '0')}-${label.replace(/[^\w]+/g, '_').slice(0, 40)}.png`;
          await page.screenshot({ path: path.join(dir, file), fullPage: true });
          entry.pages.push({ label, ok: shellAlive > 0 && errBoundary === 0 });
        } catch (e) {
          entry.pages.push({ label, ok: false, error: e.message });
        }
      }

      // Logout eksplisit di akhir agar sesi tidak tertinggal
      try {
        await page.click('.topbar-user-badge');
        await sleep(400);
        await page.click('text=Keluar (Logout)');
        await page.waitForSelector('input#login-identifier', { timeout: 10000 });
        entry.logoutOk = true;
      } catch (e) {
        entry.logoutOk = false;
      }
    } catch (e) {
      entry.login = { ok: false, error: e.message };
      await page.screenshot({ path: path.join(dir, '99-error.png') }).catch(() => {});
    }

    report.push(entry);
    await context.close();
  }

  await browser.close();

  // Ringkasan
  console.log('\n================ RINGKASAN E2E BROWSER ================');
  for (const r of report) {
    const total = r.pages.length;
    const ok = r.pages.filter((p) => p.ok).length;
    console.log(`\n[${r.key}] ${r.role}`);
    console.log(`  Login   : ${r.login?.ok ? 'OK' : 'GAGAL'}  (topbar: ${r.login?.nameShown || '-'} / ${r.login?.roleShown || '-'})`);
    console.log(`  Logout  : ${r.logoutOk ? 'OK' : '-'}`);
    console.log(`  Halaman : ${ok}/${total} OK`);
    const bad = r.pages.filter((p) => !p.ok);
    if (bad.length) console.log('  Gagal   : ' + bad.map((p) => p.label).join(', '));
    if (r.pageErrors.length) console.log('  PageErr : ' + r.pageErrors.slice(0, 5).join(' | '));
    if (r.consoleErrors.length) console.log('  ConErr  : ' + r.consoleErrors.slice(0, 5).join(' | '));
  }
  fs.writeFileSync(path.join(OUT_ROOT, 'report.json'), JSON.stringify(report, null, 2));
  console.log('\nScreenshot & report.json tersimpan di scratch/e2e_screenshots/');
}

main().catch((e) => { console.error(e); process.exit(1); });
