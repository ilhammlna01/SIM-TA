/**
 * E2E Post-Login Workflow — SIM-TA FEB UTM
 * Login per peran, lalu JALANKAN aksi nyata (buka modal, isi form, submit)
 * dan verifikasi hasilnya di browser Chromium sungguhan.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:5001';
const PASSWORD = 'FEB-UTM-2026';
const DUMMY = path.resolve('scratch/e2e_dummy.pdf');
const OUT = path.resolve('scratch/e2e_workflow');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROLES = [
  {
    key: 'mahasiswa', identifier: '210211100142',
    actions: [
      { nav: 'Bimbingan', button: 'Catat Sesi Bimbingan' },
      { nav: 'Naskah', button: 'Unggah Versi Baru' },
      { nav: 'Persyaratan', button: 'Unggah Berkas Persyaratan' },
      { nav: 'Portofolio', button: 'Unggah Portofolio Baru' }
    ]
  },
  {
    key: 'dosen', identifier: '196201081987032001',
    actions: [
      { nav: 'Persetujuan', button: 'Setujui Maju Ujian' },
      { nav: 'Bimbingan', button: 'Catat Sesi Bimbingan Baru' },
      { nav: 'Review Naskah', button: 'Tambah Catatan Telaah' }
    ]
  },
  {
    key: 'koorprodi', identifier: '197802142003122001',
    actions: [
      { nav: 'Pengajuan Masuk', button: 'Sahkan & Alokasikan Penguji' },
      { nav: 'Plotting Pembimbing', button: 'Alokasikan Pembimbing Baru' },
      { nav: 'Penerbitan Dokumen Kolektif', button: 'Proses Penerbitan' }
    ]
  },
  {
    key: 'penguji', identifier: '197703032003121002',
    actions: [
      { nav: 'Dashboard', button: 'Input Nilai Sidang' },
      { nav: 'Catatan / Koreksi', button: 'Tambah Catatan Koreksi' }
    ]
  },
  {
    key: 'admin', identifier: '198104122008121002',
    actions: [
      { nav: 'Verifikasi Berkas', button: 'Periksa Berkas' },
      { nav: 'Penerbitan SK', button: 'Buat SK Baru' },
      { nav: 'Alokasi Ruang Sidang', button: 'Plotting Ruang Ujian' }
    ]
  },
  {
    key: 'superadmin', identifier: '197405102000031001',
    actions: [
      { nav: 'Manajemen Pengguna', button: 'Tambah Akun Pengguna' },
      { nav: 'Master Data Prodi', button: 'Tambah Program Studi' },
      { nav: 'Tahapan & Regulasi', button: 'Simpan Perubahan Regulasi S1' }
    ]
  }
];

async function clickNav(page, label) {
  const nav = page.locator('.sidebar-nav-btn', { hasText: label });
  await nav.first().click();
  await sleep(800);
}

async function clickButton(page, text) {
  // Cari tombol terlihat yang teksnya cocok (prioritas exact-ish, hindari nav sidebar)
  const candidates = page.locator(`button:visible:has-text("${text}")`);
  const n = await candidates.count();
  for (let i = 0; i < n; i++) {
    const el = candidates.nth(i);
    const inSidebar = await el.evaluate((e) => !!e.closest('.shell-sidebar'));
    if (inSidebar) continue;
    await el.click();
    return true;
  }
  return false;
}

async function fillModal(page) {
  const modal = page.locator('.ui-modal-dialog').last();
  if ((await modal.count()) === 0) return false;

  // File uploads
  const fileInputs = modal.locator('input[type="file"]');
  const fc = await fileInputs.count();
  for (let i = 0; i < fc; i++) {
    try { await fileInputs.nth(i).setInputFiles(DUMMY); } catch {}
  }

  // Selects -> pilih opsi pertama yang bernilai
  const selects = modal.locator('select');
  const sc = await selects.count();
  for (let i = 0; i < sc; i++) {
    const sel = selects.nth(i);
    try {
      const opts = await sel.locator('option').evaluateAll((os) =>
        os.map((o) => ({ v: o.value, d: o.disabled })).filter((o) => o.v !== '' && !o.d)
      );
      if (opts.length > 0) await sel.selectOption(opts[0].v);
    } catch {}
  }

  // Inputs
  const inputs = modal.locator('input:visible');
  const ic = await inputs.count();
  for (let i = 0; i < ic; i++) {
    const inp = inputs.nth(i);
    try {
      const type = await inp.getAttribute('type');
      if (type === 'file' || type === 'checkbox' || type === 'radio') continue;
      const cur = await inp.inputValue();
      if (cur) continue;
      if (type === 'number') await inp.fill('5');
      else if (type === 'date') await inp.fill('2026-10-20');
      else if (type === 'time') await inp.fill('09:00');
      else if (type === 'email') await inp.fill('uji.e2e@trunojoyo.ac.id');
      else await inp.fill('Uji Otomatis E2E');
    } catch {}
  }

  // Textareas
  const tas = modal.locator('textarea:visible');
  const tc = await tas.count();
  for (let i = 0; i < tc; i++) {
    try {
      const cur = await tas.nth(i).inputValue();
      if (!cur) await tas.nth(i).fill('Catatan uji otomatis E2E dari pengujian browser Playwright.');
    } catch {}
  }
  return true;
}

async function submitModal(page) {
  const modal = page.locator('.ui-modal-dialog').last();
  const SUBMIT_RE = /Simpan|Kirim|Proses|Setujui|Sahkan|Terbitkan|Unggah|Catat|Buat|Tambah|Alokasikan|Verifikasi|Ajukan|Plotting|Tetapkan|Ya,|Lanjutkan|Konfirmasi/i;

  // 1) Tombol submit native di dalam form modal
  let btn = modal.locator('button[type="submit"]').last();
  if ((await btn.count()) > 0) { await btn.click(); return true; }

  // 2) Tombol primary di footer
  btn = modal.locator('.ui-modal-footer button.ui-btn--primary').last();
  if ((await btn.count()) > 0) { await btn.click(); return true; }

  // 3) Tombol mana pun di modal yang teksnya cocok pola aksi
  btn = modal.locator('button', { hasText: SUBMIT_RE }).last();
  if ((await btn.count()) > 0) { await btn.click(); return true; }

  // 4) Fallback: tombol terakhir di footer, lalu di seluruh modal
  btn = modal.locator('.ui-modal-footer button').last();
  if ((await btn.count()) > 0) { await btn.click(); return true; }
  btn = modal.locator('.ui-modal-body button').last();
  if ((await btn.count()) > 0) { await btn.click(); return true; }
  return false;
}

async function dumpModal(page) {
  const modal = page.locator('.ui-modal-dialog').last();
  if ((await modal.count()) === 0) return null;
  return await modal.evaluate((m) => ({
    title: (m.querySelector('.ui-modal-title') || {}).innerText || '',
    errors: Array.from(m.querySelectorAll('.ui-form-error')).map((e) => e.innerText.trim()),
    alerts: Array.from(m.querySelectorAll('[role="alert"]')).map((e) => e.innerText.trim()),
    allButtons: Array.from(m.querySelectorAll('button')).map((b) => b.innerText.trim()).filter(Boolean),
    requiredEmpty: Array.from(m.querySelectorAll('input[required],select[required],textarea[required]'))
      .filter((el) => !el.value).map((el) => el.id || el.name || el.tagName)
  }));
}

async function closeAnyModal(page) {
  for (let i = 0; i < 3; i++) {
    if ((await page.locator('.ui-modal-dialog').count()) === 0) return;
    await page.keyboard.press('Escape');
    await sleep(400);
  }
}

async function handleModals(page, maxRounds = 4) {
  const toasts = [];
  let diag = null;
  for (let round = 0; round < maxRounds; round++) {
    if ((await page.locator('.ui-modal-dialog').count()) === 0) break;
    await fillModal(page);
    await submitModal(page);
    await sleep(1200);
    const msgs = await page.locator('.ui-toast-message').evaluateAll((els) => els.map((e) => e.innerText.trim()));
    msgs.forEach((m) => { if (m && !toasts.includes(m)) toasts.push(m); });
  }
  if ((await page.locator('.ui-modal-dialog').count()) > 0) {
    diag = await dumpModal(page);
    await closeAnyModal(page);
  }
  const msgs = await page.locator('.ui-toast-message').evaluateAll((els) => els.map((e) => e.innerText.trim()));
  msgs.forEach((m) => { if (m && !toasts.includes(m)) toasts.push(m); });
  return { toasts, diag };
}

const browser = await chromium.launch({ headless: true });
const report = [];

for (const role of ROLES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const dir = path.join(OUT, role.key);
  fs.mkdirSync(dir, { recursive: true });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  const entry = { key: role.key, actions: [] };

  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('input#login-identifier', { timeout: 15000 });
  await page.fill('input#login-identifier', role.identifier);
  await page.fill('input#login-password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.shell-root', { timeout: 20000 });
  await sleep(1500);

  let idx = 0;
  for (const act of role.actions) {
    idx++;
    const rec = { nav: act.nav, button: act.button, opened: false, toasts: [], note: '' };
    try {
      await closeAnyModal(page);
      await clickNav(page, act.nav);
      const opened = await clickButton(page, act.button);
      rec.opened = opened;
      if (!opened) { rec.note = 'Tombol aksi tidak ditemukan/terlihat'; }
      else {
        await sleep(900);
        const { toasts, diag } = await handleModals(page);
        rec.toasts = toasts;
        if (diag) rec.diag = diag;
        if (rec.toasts.length === 0 && !diag) rec.note = 'Tidak ada toast hasil (mungkin aksi langsung / tanpa umpan balik)';
      }
      await page.screenshot({ path: path.join(dir, `${String(idx).padStart(2, '0')}-${act.button.replace(/[^\w]+/g, '_').slice(0, 30)}.png`), fullPage: true });
    } catch (e) {
      rec.note = 'ERROR: ' + e.message;
      await closeAnyModal(page);
      await page.screenshot({ path: path.join(dir, `${String(idx).padStart(2, '0')}-error.png`) }).catch(() => {});
    }
    entry.actions.push(rec);
  }

  entry.pageErrors = pageErrors;
  report.push(entry);
  await ctx.close();
}

await browser.close();

console.log('\n============== HASIL WORKFLOW PASCA-LOGIN ==============');
for (const r of report) {
  console.log(`\n[${r.key}]`);
  for (const a of r.actions) {
    const status = a.opened ? (a.toasts.length ? 'OK' : (a.diag ? 'MODAL-TETAP-TERBUKA' : 'DIBUKA')) : 'TOMBOL-TIDAK-ADA';
    console.log(`  - ${a.nav} > "${a.button}" => ${status}`);
    if (a.toasts.length) console.log(`      toast: ${a.toasts.slice(0, 2).join(' | ')}`);
    if (a.diag) console.log(`      diag : ${JSON.stringify(a.diag)}`);
    if (a.note) console.log(`      note : ${a.note}`);
  }
  if (r.pageErrors.length) console.log(`  pageErrors: ${r.pageErrors.slice(0, 3).join(' | ')}`);
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log('\nScreenshot & report.json: scratch/e2e_workflow/');
