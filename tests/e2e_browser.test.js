/**
 * E2E Browser Test — SIM-TA FEB UTM (Playwright, Chromium)
 *
 * Menguji antarmuka produksi (dist) di browser sungguhan:
 *  1. Login form resmi untuk 6 peran (satu per satu, konteks terisolasi).
 *  2. Menelusuri seluruh menu sidebar per peran; mendeteksi halaman blank /
 *     Error Boundary / page error.
 *  3. Satu aksi tulis nyata (mahasiswa catat bimbingan) + verifikasi tersimpan.
 *  4. Tidak ada respons 401 pada panggilan API SETELAH login.
 *  5. Banner "Menyinkronkan Data Akademik" muncul saat sinkronisasi (Fase 2).
 *
 * Prasyarat: server (node server/index.js) sudah aktif di :5001 dan `dist/` terbaru.
 * Jalankan: node tests/e2e_browser.test.js
 */

import { chromium } from 'playwright';
import { TEST_PASSWORD, ensureTestAccounts } from './helpers/testAccounts.js';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:5001';
const BASE_URL_API = 'http://localhost:5001/api';
const DB_PATH = 'data/sim_ta_feb_utm.db';
const password = TEST_PASSWORD;
const MARK = `E2E-${Date.now()}`;
const REPORT_DIR = 'test-results';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROLES = [
  { key: 'mahasiswa', name: 'Mahasiswa', id: '210211100142', expectPages: 10 },
  { key: 'dosen', name: 'Dosen Pembimbing', id: '196201081987032001', expectPages: 8 },
  { key: 'koorprodi', name: 'Koorprodi', id: '197802142003122001', expectPages: 10 },
  { key: 'penguji', name: 'Dewan Penguji', id: '197703032003121002', expectPages: 6 },
  { key: 'admin', name: 'Admin Akademik', id: '198104122008121002', expectPages: 6 },
  { key: 'superadmin', name: 'Super Admin', id: '197405102000031001', expectPages: 5 }
];

let pass = 0;
let fail = 0;
const results = [];
const startedAt = new Date();

function assert(cond, name, detail = '') {
  results.push({ name, ok: !!cond, detail });
  if (cond) { console.log(`  PASS  ${name}`); if (detail) console.log(`        -> ${detail}`); pass++; }
  else { console.error(`  FAIL  ${name}`); if (detail) console.error(`        -> ${detail}`); fail++; }
}

function writeHtmlReport() {
  const finishedAt = new Date();
  const durSec = ((finishedAt - startedAt) / 1000).toFixed(1);
  const rows = results.map((r) => `
      <tr class="${r.ok ? 'ok' : 'fail'}">
        <td>${r.ok ? 'PASS' : 'FAIL'}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.detail || '')}</td>
      </tr>`).join('');
  const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<title>Laporan E2E Browser — SIM-TA FEB UTM</title>
<style>
  body{font-family:Inter,Segoe UI,Roboto,sans-serif;margin:24px;color:#0f172a}
  h1{font-size:20px;margin:0 0 4px}
  .meta{color:#64748b;font-size:12.5px;margin-bottom:16px}
  .summary{display:flex;gap:16px;margin-bottom:16px}
  .card{padding:12px 16px;border:1px solid #e2e8f0;border-radius:8px;min-width:120px}
  .card b{display:block;font-size:22px}
  .pass{color:#15803d}.failc{color:#b91c1c}
  table{border-collapse:collapse;width:100%;font-size:13px}
  th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left;vertical-align:top}
  th{background:#f1f5f9}
  tr.ok td:first-child{color:#15803d;font-weight:700}
  tr.fail td:first-child{color:#b91c1c;font-weight:700}
  tr.fail{background:#fef2f2}
</style></head><body>
  <h1>Laporan E2E Browser (Playwright/Chromium) — SIM-TA FEB UTM</h1>
  <div class="meta">Dijalankan: ${startedAt.toLocaleString('id-ID')} • Durasi: ${durSec}s</div>
  <div class="summary">
    <div class="card"><b>${pass}</b>Lulus</div>
    <div class="card"><b class="failc">${fail}</b>Gagal</div>
    <div class="card"><b>${results.length}</b>Total Asersi</div>
    <div class="card"><b class="${fail === 0 ? 'pass' : 'failc'}">${fail === 0 ? 'LULUS' : 'GAGAL'}</b>Status</div>
  </div>
  <table><thead><tr><th>Status</th><th>Asersi</th><th>Detail</th></tr></thead>
  <tbody>${rows}</tbody></table>
</body></html>`;
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const out = path.join(REPORT_DIR, 'e2e-report.html');
  fs.writeFileSync(out, html, 'utf8');
  console.log(`\nLaporan HTML: ${out}`);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function login(page, id) {
  await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('input#login-identifier', { timeout: 15000 });
  await page.fill('input#login-identifier', id);
  await page.fill('input#login-password', password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.shell-root', { timeout: 20000 });
  await sleep(1500);
}

async function main() {
  // Audit 21 Oktober 2026: siapkan kredensial uji deterministik di luar jalur HTTP.
  // (Kredensial universal institusi tidak lagi berlaku di aplikasi).
  const credPrep = ensureTestAccounts();
  if (!credPrep.ok) {
    console.error('Gagal menyiapkan kredensial uji:', credPrep.message);
    process.exit(1);
  }


  console.log('====================================================');
  console.log('E2E BROWSER TEST (Playwright) — SIM-TA FEB UTM');
  console.log('====================================================\n');

  // 0. Login page tidak memicu API terproteksi tanpa token (Fase 1)
  const browser = await chromium.launch({ headless: true });

  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const preAuthCalls = [];
    page.on('response', (r) => {
      const u = r.url();
      if (u.includes('/api/') && r.request().method() === 'GET' && u.includes('/api/admin/')) preAuthCalls.push(r.status());
    });
    await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('input#login-identifier', { timeout: 15000 });
    await sleep(1500);
    const loginFields = await page.locator('#login-identifier').count();
    assert(loginFields === 1, 'Login: id #login-identifier unik (bukan ganda)', `ditemukan ${loginFields}`);
    assert(preAuthCalls.length === 0, 'Login: tidak ada panggilan /api/admin/* sebelum login', `terdeteksi ${preAuthCalls.length}`);
    await ctx.close();
  }

  // 1-4. Per peran: login, telusuri halaman, cek 401 pasca-login
  for (const role of ROLES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const pageErrors = [];
    const postAuth401 = [];
    let loggedIn = false;
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('response', (r) => {
      if (loggedIn && r.url().includes('/api/') && r.status() === 401) postAuth401.push(r.url().replace(BASE, ''));
    });

    try {
      await login(page, role.id);
      loggedIn = true;

      const nav = page.locator('.sidebar-nav-btn');
      const count = await nav.count();
      let okPages = 0;
      const seen = new Set();
      for (let i = 0; i < count; i++) {
        const btn = nav.nth(i);
        const label = (await btn.innerText().catch(() => '')).trim().replace(/\s+/g, ' ');
        if (!label || seen.has(label)) continue;
        seen.add(label);
        try {
          await btn.click();
          await sleep(700);
          const alive = (await page.locator('.shell-root').count()) > 0;
          const errBoundary = await page.locator('text=/Terjadi Kesalahan|Something went wrong/i').count();
          if (alive && errBoundary === 0) okPages++;
        } catch { /* individual page errors counted as not ok */ }
      }

      assert(okPages === role.expectPages, `[${role.key}] Semua ${role.expectPages} halaman render tanpa crash`, `OK ${okPages}/${role.expectPages}`);
      assert(pageErrors.length === 0, `[${role.key}] Tanpa page error (ReferenceError dll)`, pageErrors.slice(0, 3).join(' | ') || 'bersih');
      assert(postAuth401.length === 0, `[${role.key}] Tanpa respons 401 setelah login`, postAuth401.slice(0, 3).join(' | ') || 'bersih');
    } catch (e) {
      assert(false, `[${role.key}] Login & penelusuran berhasil`, e.message);
    }
    await ctx.close();
  }

  // 5. Aksi tulis nyata: mahasiswa catat sesi bimbingan -> tersimpan di SQLite
  {
    const db = new DatabaseSync(DB_PATH);
    const before = db.prepare('SELECT count(*) c FROM bimbingan_log').get().c;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await login(page, '210211100142');
      await page.locator('.sidebar-nav-btn', { hasText: 'Bimbingan' }).first().click();
      await sleep(900);
      await page.locator('button:visible:has-text("Catat Sesi Bimbingan")').first().click();
      await sleep(900);
      await page.fill('#bimb-topik', MARK);
      await page.fill('#bimb-hasil', 'Uji E2E otomatis.');
      await page.locator('.ui-modal-dialog button:has-text("Kirim ke Dosen Pembimbing")').first().click();
      await sleep(2500);
      const after = db.prepare('SELECT count(*) c FROM bimbingan_log').get().c;
      const stored = db.prepare('SELECT count(*) c FROM bimbingan_log WHERE topik = ?').get(MARK).c;
      assert(after === before + 1 && stored === 1, 'E2E aksi tulis: catat bimbingan tersimpan ke SQLite', `${before}->${after}`);
    } catch (e) {
      assert(false, 'E2E aksi tulis: catat bimbingan tersimpan ke SQLite', e.message);
    }
    // Bersihkan
    db.prepare('DELETE FROM bimbingan_log WHERE topik = ?').run(MARK);
    db.prepare('DELETE FROM audit_log WHERE details LIKE ?').run(`%${MARK}%`);
    await ctx.close();
  }

  // 6. Banner sinkronisasi (Fase 2) — perlambat respons API agar state sinkronisasi
  //    cukup lama teramati, lalu verifikasi banner "Menyinkronkan Data Akademik" tampil.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    // Tunda seluruh respons /api/ agar isSyncingBackend bertahan lebih lama.
    await page.route('**/api/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1800));
      await route.continue();
    });
    try {
      await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('input#login-identifier', { timeout: 15000 });
      await page.fill('input#login-identifier', '198104122008121002');
      await page.fill('input#login-password', password);
      await page.click('button[type="submit"]');
      await page.waitForSelector('.shell-root', { timeout: 20000 });
      // Segera setelah shell muncul, sinkronisasi backend masih berjalan (API ditunda).
      const banner = page.locator('text=Menyinkronkan Data Akademik');
      let seen = false;
      for (let i = 0; i < 12; i++) {
        if (await banner.count() > 0) { seen = true; break; }
        await sleep(250);
      }
      assert(seen, 'Fase 2: banner "Menyinkronkan Data Akademik" tampil saat sinkronisasi aktif');
    } catch (e) {
      assert(false, 'Fase 2: banner "Menyinkronkan Data Akademik" tampil saat sinkronisasi aktif', e.message);
    }
    await ctx.close();
  }

  // 7. Gerbang wajib ganti kata sandi tampil di UI (Backlog Rilis)
  //    Admin dikunci ke kata sandi sementara → setelah login harus muncul dialog
  //    "Wajib Ganti Kata Sandi Sementara" yang tidak dapat ditutup.
  {
    const dbGate = new DatabaseSync(DB_PATH);
    const adminRow = dbGate.prepare("SELECT id, nomor_induk, password FROM users WHERE role='admin' LIMIT 1").get();
    const origHash = adminRow.password;

    // Superadmin reset kata sandi admin -> issuing kata sandi sementara.
    const suRes = await fetch(`${BASE_URL_API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '197405102000031001', password })
    });
    const suToken = (await suRes.json()).token;
    const resetRes = await fetch(`${BASE_URL_API}/superadmin/users/${adminRow.id}/reset-password`, {
      method: 'POST', headers: { Authorization: `Bearer ${suToken}` }
    });
    const tempPw = (await resetRes.json()).temporaryPassword;

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('input#login-identifier', { timeout: 15000 });
      await page.fill('input#login-identifier', adminRow.nomor_induk);
      await page.fill('input#login-password', tempPw);
      await page.click('button[type="submit"]');
      await page.waitForSelector('.shell-root', { timeout: 20000 });
      const gate = page.locator('text=Wajib Ganti Kata Sandi Sementara');
      const seen = (await gate.count()) > 0;
      assert(seen, 'Rilis: dialog "Wajib Ganti Kata Sandi Sementara" tampil setelah login dengan sandi sementara');
      // Tombol "Batal" harus TIDAK ada pada mode wajib.
      const batalCount = await page.locator('.ui-modal-dialog button:has-text("Batal")').count();
      assert(batalCount === 0, 'Rilis: dialog wajib tidak memiliki tombol Batal (tidak bisa dilewati)');
    } catch (e) {
      assert(false, 'Rilis: dialog wajib ganti kata sandi tampil & tidak dapat ditutup', e.message);
    }
    await ctx.close();

    // Pulihkan kata sandi admin ke kondisi awal.
    dbGate.prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?').run(origHash, adminRow.id);
  }

  // 8. Metrik verifikasi akademik (mahasiswa -> SQLite -> panel admin)
  //    Mahasiswa mengisi IPK/SKS/similarity/AI saat unggah; admin melihatnya untuk verifikasi.
  {
    const dbMetrik = new DatabaseSync(DB_PATH);
    // Bersihkan baris Dinda agar tabel admin hanya memuat satu baris (unggahan uji ini).
    dbMetrik.prepare("DELETE FROM pendaftaran_ujian WHERE nim = '210211100142'").run();

    // 8a. Mahasiswa mengunggah dengan mengisi metrik.
    const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page1 = await ctx1.newPage();
    try {
      await login(page1, '210211100142');
      await page1.locator('.sidebar-nav-btn', { hasText: 'Persyaratan' }).first().click();
      await sleep(900);
      await page1.locator('button:visible:has-text("Unggah Berkas Persyaratan")').first().click();
      await sleep(900);

      // Field metrik bersifat KONTEKSTUAL: untuk transkrip (krs) tampil IPK + SKS.
      await page1.selectOption('#modal-select-jenis', 'krs_s1');
      await sleep(500);
      assert((await page1.locator('#metrik-ipk').count()) === 1, 'Metrik: transkrip menampilkan field IPK');
      assert((await page1.locator('#metrik-sksLulus').count()) === 1, 'Metrik: transkrip menampilkan field SKS');
      assert((await page1.locator('#metrik-similarity').count()) === 0, 'Metrik: transkrip TIDAK menampilkan field similarity (kontekstual)');

      await page1.fill('#metrik-ipk', '3.74');
      await page1.fill('#metrik-sksLulus', '126');
      await page1.locator('input#file-native-input').setInputFiles({
        name: 'bukti.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF')
      });
      await sleep(300);
      await page1.locator('.ui-modal-dialog button:has-text("Kirim untuk Verifikasi Admin")').first().click();
      await sleep(2500);
      const savedRow = dbMetrik.prepare("SELECT metrik_akademik_json FROM pendaftaran_ujian WHERE nim='210211100142' ORDER BY rowid DESC LIMIT 1").get();
      assert(savedRow && savedRow.metrik_akademik_json && savedRow.metrik_akademik_json.includes('3.74') && savedRow.metrik_akademik_json.includes('126'),
        'Metrik: metrik mahasiswa tersimpan ke SQLite', savedRow?.metrik_akademik_json);

      // Field kontekstual kedua: hasil Turnitin menampilkan similarity + AI.
      await page1.locator('button:visible:has-text("Unggah Berkas Persyaratan")').first().click();
      await sleep(800);
      await page1.selectOption('#modal-select-jenis', 'turnitin_s1');
      await sleep(500);
      assert((await page1.locator('#metrik-similarity').count()) === 1, 'Metrik: Turnitin menampilkan field similarity');
      assert((await page1.locator('#metrik-aiDetection').count()) === 1, 'Metrik: Turnitin menampilkan field AI detection');
      assert((await page1.locator('#metrik-ipk').count()) === 0, 'Metrik: Turnitin TIDAK menampilkan field IPK (kontekstual)');
      await page1.keyboard.press('Escape');
      await sleep(400);
    } catch (e) {
      assert(false, 'Metrik: unggah dengan metrik berhasil', e.message);
    }
    await ctx1.close();

    // 8b. Admin melihat panel metrik saat memeriksa berkas.
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page2 = await ctx2.newPage();
    try {
      await login(page2, '198104122008121002');
      await page2.locator('.sidebar-nav-btn', { hasText: 'Verifikasi Berkas' }).first().click();
      await sleep(2500);
      const row = page2.locator('tr', { hasText: '210211100142' }).first();
      if ((await row.count()) === 0) {
        assert(false, 'Metrik: baris mahasiswa ditemukan di tabel verifikasi admin');
      } else {
        await row.locator('button:has-text("Periksa Berkas")').first().click();
        await sleep(1200);
        const panel = page2.locator('[data-testid="panel-metrik-verifikasi"]');
        const vis = await panel.count();
        assert(vis >= 1, 'Metrik: panel "Data Verifikasi Akademik" tampil untuk admin');
        if (vis) {
          const text = await panel.first().innerText();
          assert(text.includes('3.74') && text.includes('126'),
            'Metrik: admin melihat IPK/SKS yang diisikan mahasiswa');
        }
      }
    } catch (e) {
      assert(false, 'Metrik: admin melihat panel metrik', e.message);
    }
    await ctx2.close();

    // Bersihkan data uji.
    dbMetrik.prepare("DELETE FROM pendaftaran_ujian WHERE nim = '210211100142'").run();
  }

  await browser.close();

  writeHtmlReport();

  console.log('\n====================================================');
  console.log(`TOTAL PASS: ${pass} | TOTAL FAIL: ${fail}`);
  console.log(`STATUS: ${fail === 0 ? 'E2E BROWSER LULUS' : 'ADA E2E YANG GAGAL'}`);
  console.log('====================================================\n');

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('E2E browser suite error:', err.message);
  try { writeHtmlReport(); } catch (_) {}
  process.exit(1);
});

