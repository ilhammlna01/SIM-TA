import { chromium } from 'playwright';
import path from 'node:path';

const BASE_URL = 'http://localhost:5001';
const PASSWORD = 'FEB-UTM-2026';
const DUMMY = path.resolve('scratch/e2e_dummy.pdf');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROLES = [
  { key: 'mahasiswa', id: '210211100142', actions: [
    { nav: 'Bimbingan', button: 'Catat Sesi Bimbingan' },
    { nav: 'Naskah', button: 'Unggah Versi Baru' },
    { nav: 'Persyaratan', button: 'Unggah Berkas Persyaratan' },
    { nav: 'Portofolio', button: 'Unggah Portofolio Baru' }
  ]},
  { key: 'dosen', id: '196201081987032001', actions: [
    { nav: 'Persetujuan', button: 'Setujui Maju Ujian' },
    { nav: 'Bimbingan', button: 'Catat Sesi Bimbingan Baru' }
  ]},
  { key: 'koorprodi', id: '197802142003122001', actions: [
    { nav: 'Pengajuan Masuk', button: 'Sahkan & Alokasikan Penguji' },
    { nav: 'Plotting Pembimbing', button: 'Alokasikan Pembimbing Baru' }
  ]},
  { key: 'penguji', id: '197703032003121002', actions: [
    { nav: 'Catatan / Koreksi', button: 'Tambah Catatan Koreksi' }
  ]},
  { key: 'admin', id: '198104122008121002', actions: [
    { nav: 'Verifikasi Berkas', button: 'Periksa Berkas' },
    { nav: 'Penerbitan SK', button: 'Buat SK Baru' },
    { nav: 'Alokasi Ruang Sidang', button: 'Plotting Ruang Ujian' }
  ]},
  { key: 'superadmin', id: '197405102000031001', actions: [
    { nav: 'Manajemen Pengguna', button: 'Tambah Akun Pengguna' },
    { nav: 'Tahapan & Regulasi', button: 'Simpan Perubahan Regulasi S1' }
  ]}
];

const SUBMIT_RE = /Simpan|Kirim|Proses|Setujui|Sahkan|Terbitkan|Unggah|Catat|Buat|Tambah|Alokasikan|Verifikasi|Ajukan|Plotting|Tetapkan|Ya,|Lanjutkan/i;

async function fillModal(page) {
  const modal = page.locator('.ui-modal-dialog').last();
  if ((await modal.count()) === 0) return;
  const files = modal.locator('input[type="file"]');
  for (let i = 0; i < await files.count(); i++) { try { await files.nth(i).setInputFiles(DUMMY); } catch {} }
  const selects = modal.locator('select');
  for (let i = 0; i < await selects.count(); i++) {
    try {
      const opts = await selects.nth(i).locator('option').evaluateAll((os) => os.map((o) => o.value).filter((v) => v));
      if (opts.length) await selects.nth(i).selectOption(opts[0]);
    } catch {}
  }
  const inputs = modal.locator('input:visible');
  for (let i = 0; i < await inputs.count(); i++) {
    const inp = inputs.nth(i);
    try {
      const type = await inp.getAttribute('type');
      if (['file', 'checkbox', 'radio'].includes(type)) continue;
      if (await inp.inputValue()) continue;
      if (type === 'number') await inp.fill('5');
      else if (type === 'date') await inp.fill('2026-10-20');
      else if (type === 'time') await inp.fill('09:00');
      else await inp.fill('Uji Otomatis E2E');
    } catch {}
  }
  const tas = modal.locator('textarea:visible');
  for (let i = 0; i < await tas.count(); i++) { try { if (!(await tas.nth(i).inputValue())) await tas.nth(i).fill('Catatan uji E2E.'); } catch {} }
}
async function submitModal(page) {
  const modal = page.locator('.ui-modal-dialog').last();
  for (const sel of ['button[type="submit"]', '.ui-modal-footer button.ui-btn--primary']) {
    const b = modal.locator(sel).last();
    if (await b.count()) { await b.click(); return; }
  }
  const b = modal.locator('button', { hasText: SUBMIT_RE }).last();
  if (await b.count()) { await b.click(); return; }
}
async function closeModals(page) { for (let i = 0; i < 3; i++) { if (!(await page.locator('.ui-modal-dialog').count())) return; await page.keyboard.press('Escape'); await sleep(300); } }

const browser = await chromium.launch({ headless: true });
const rows = [];

for (const role of ROLES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  let calls = [];
  page.on('response', async (res) => {
    const u = res.url();
    if (!u.includes('/api/') || res.request().method() === 'GET') return;
    if (u.includes('/api/auth/login')) return;
    calls.push(`${res.request().method()} ${u.replace(BASE_URL, '')} -> ${res.status()}`);
  });
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('input#login-identifier', { timeout: 15000 });
  await page.fill('input#login-identifier', role.id);
  await page.fill('input#login-password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.shell-root', { timeout: 20000 });
  await sleep(1200);

  for (const act of role.actions) {
    calls = [];
    await closeModals(page);
    try {
      await page.locator('.sidebar-nav-btn', { hasText: act.nav }).first().click();
      await sleep(700);
      const btn = page.locator(`button:visible:has-text("${act.button}")`).first();
      if (!(await btn.count())) { rows.push({ role: role.key, action: act.button, backend: 'TOMBOL-TIDAK-ADA' }); continue; }
      await btn.click();
      await sleep(900);
      for (let r = 0; r < 4 && (await page.locator('.ui-modal-dialog').count()); r++) { await fillModal(page); await submitModal(page); await sleep(1200); }
      const toast = (await page.locator('.ui-toast-message').allInnerTexts()).slice(0, 1).join('');
      await closeModals(page);
      rows.push({ role: role.key, action: act.button, backend: calls.length ? calls.join(' ; ') : 'TIDAK ADA (frontend-only)', toast });
    } catch (e) {
      rows.push({ role: role.key, action: act.button, backend: 'ERROR ' + e.message.slice(0, 60) });
      await closeModals(page);
    }
  }
  await ctx.close();
}
await browser.close();

console.log('\n===== PETA FLOW PASCA-LOGIN: BACKEND vs FRONTEND-ONLY =====');
for (const r of rows) {
  console.log(`\n[${r.role}] ${r.action}`);
  console.log(`   backend: ${r.backend}`);
  if (r.toast) console.log(`   toast  : ${r.toast}`);
}
