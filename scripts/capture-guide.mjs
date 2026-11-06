/**
 * capture-guide.mjs
 * ------------------------------------------------------------------
 * Skrip otomasi Playwright untuk mengambil screenshot nyata aplikasi
 * SIM-TA FEB UTM guna menyusun "Pedoman Penggunaan (Panduan Pengguna)".
 *
 * Prasyarat:
 *   1. npm install
 *   2. npm i -D playwright && npx playwright install chromium
 *   3. Jalankan aplikasi fullstack:  npm run fullstack
 *      (frontend http://localhost:5173 dan API http://localhost:5001)
 *   4. Jalankan skrip ini:  node scripts/capture-guide.mjs
 *
 * Hasil: seluruh berkas PNG tersimpan berurutan di
 *   docs/pedoman-penggunaan/img/
 *
 * Skrip ini melakukan login NYATA (NIM/NIP + kata sandi) ke backend,
 * menavigasi setiap menu per peran, lalu menyimpan tangkapan layar.
 * ------------------------------------------------------------------
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const OUT_DIR = path.join(ROOT, 'docs', 'pedoman-penggunaan', 'img');
const BASE_URL = process.env.GUIDE_BASE_URL || 'http://localhost:5173';
const PASSWORD = 'FEB-UTM-2026';
const FRONTEND_PORT = Number(new URL(BASE_URL).port || 5173);
const API_PORT = Number(process.env.GUIDE_API_PORT || 5001);

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

fs.mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Manajemen server (backend 5001 & frontend 5173)                     */
/* ------------------------------------------------------------------ */
const spawnedServers = [];

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(1200);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

async function waitForPort(port, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) return true;
    await sleep(700);
  }
  return false;
}

function startServer(args, label) {
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    stdio: 'ignore',
    windowsHide: true
  });
  child.on('error', (e) => console.error(`[server:${label}] ${e.message}`));
  spawnedServers.push(child);
  console.log(`[server] Menjalankan ${label} (pid ${child.pid})...`);
  return child;
}

async function ensureServers() {
  if (!(await isPortOpen(API_PORT))) {
    startServer(['server/index.js'], 'backend API');
    if (!(await waitForPort(API_PORT, 90000))) {
      throw new Error(`Backend API gagal siap pada port ${API_PORT}.`);
    }
  } else {
    console.log(`[server] Backend API sudah aktif pada port ${API_PORT}.`);
  }

  if (!(await isPortOpen(FRONTEND_PORT))) {
    startServer(
      [
        path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
        '--host',
        '127.0.0.1',
        '--port',
        String(FRONTEND_PORT),
        '--strictPort'
      ],
      'frontend Vite'
    );
    if (!(await waitForPort(FRONTEND_PORT, 120000))) {
      throw new Error(`Frontend Vite gagal siap pada port ${FRONTEND_PORT}.`);
    }
  } else {
    console.log(`[server] Frontend sudah aktif pada port ${FRONTEND_PORT}.`);
  }
}

function stopServers() {
  for (const child of spawnedServers) {
    try {
      child.kill();
    } catch {}
  }
}

/* ------------------------------------------------------------------ */
/* Definisi akun demo & menu per peran (label harus persis seperti UI) */
/* ------------------------------------------------------------------ */
const ROLE_JOBS = [
  {
    role: 'mahasiswa',
    nomorInduk: '210211100142',
    nama: 'Dinda Ayu Larasati',
    menus: [
      { label: 'Dashboard', file: '03-mahasiswa-dashboard' },
      { label: 'Detail Tugas Akhir', file: '04-mahasiswa-detail-tugas-akhir' },
      { label: 'Tahapan', file: '05-mahasiswa-tahapan' },
      { label: 'Persyaratan', file: '06-mahasiswa-persyaratan' },
      { label: 'Bimbingan', file: '07-mahasiswa-bimbingan' },
      { label: 'Naskah', file: '08-mahasiswa-naskah' },
      { label: 'Ujian', file: '09-mahasiswa-ujian' },
      { label: 'Revisi', file: '10-mahasiswa-revisi' },
      { label: 'Publikasi', file: '11-mahasiswa-publikasi' },
      { label: 'Dokumen', file: '12-mahasiswa-dokumen' }
    ]
  },
  {
    role: 'dosen',
    nomorInduk: '196201081987032001',
    nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    menus: [
      { label: 'Dashboard', file: '13-dosen-dashboard' },
      { label: 'Mahasiswa Bimbingan', file: '14-dosen-mahasiswa-bimbingan' },
      { label: 'Bimbingan', file: '15-dosen-bimbingan' },
      { label: 'Naskah Masuk', file: '16-dosen-naskah-masuk' },
      { label: 'Review Naskah', file: '17-dosen-review-naskah' },
      { label: 'Persetujuan', file: '18-dosen-persetujuan' },
      { label: 'Pemantauan Revisi', file: '19-dosen-pemantauan-revisi' },
      { label: 'Jadwal Ujian', file: '20-dosen-jadwal-ujian' }
    ]
  },
  {
    role: 'penguji',
    nomorInduk: '197703032003121002',
    nama: 'Dr. Faidal, S.E., M.M.',
    menus: [
      { label: 'Dashboard', file: '21-penguji-dashboard' },
      { label: 'Daftar Ujian', file: '22-penguji-daftar-ujian' },
      { label: 'Naskah Ujian', file: '23-penguji-naskah-ujian' },
      { label: 'Form Penilaian', file: '24-penguji-form-penilaian' },
      { label: 'Catatan / Koreksi', file: '25-penguji-catatan-koreksi' },
      { label: 'Verifikasi Revisi', file: '26-penguji-verifikasi-revisi' }
    ]
  },
  {
    role: 'koorprodi',
    nomorInduk: '197802142003122001',
    nama: 'Dr. Hj. Siti Aminah, S.E., M.Si.',
    menus: [
      { label: 'Dashboard', file: '27-koorprodi-dashboard' },
      { label: 'Daftar Mahasiswa', file: '28-koorprodi-daftar-mahasiswa' },
      { label: 'Pengajuan Masuk', file: '29-koorprodi-pengajuan-masuk' },
      { label: 'Plotting Pembimbing', file: '30-koorprodi-plotting-pembimbing' },
      { label: 'Dewan Penguji', file: '31-koorprodi-dewan-penguji' },
      { label: 'Penerbitan Dokumen Kolektif', file: '32-koorprodi-penerbitan-dokumen-kolektif' },
      { label: 'Jadwal Ujian & Sidang', file: '33-koorprodi-jadwal-ujian-sidang' },
      { label: 'Matriks Persyaratan', file: '34-koorprodi-matriks-persyaratan' },
      { label: 'Pemantauan Revisi', file: '35-koorprodi-pemantauan-revisi' },
      { label: 'Arsip Dokumen Prodi', file: '36-koorprodi-arsip-dokumen-prodi' }
    ]
  },
  {
    role: 'admin',
    nomorInduk: '198104122008121002',
    nama: 'Ahmad Fauzi, S.Kom., M.T.',
    menus: [
      { label: 'Dashboard', file: '37-admin-dashboard' },
      { label: 'Jadwal Tahapan', file: '38-admin-jadwal-tahapan' },
      { label: 'Otomasi Dokumen', file: '39-admin-otomasi-dokumen' },
      { label: 'Verifikasi Berkas', file: '40-admin-verifikasi-berkas' },
      { label: 'Penerbitan SK', file: '41-admin-penerbitan-sk' },
      { label: 'Alokasi Ruang Sidang', file: '42-admin-alokasi-ruang-sidang' }
    ]
  },
  {
    role: 'superadmin',
    nomorInduk: '197405102000031001',
    nama: 'Ir. Supriyanto, M.Kom.',
    menus: [
      { label: 'Dashboard', file: '43-superadmin-dashboard' },
      { label: 'Master Data Prodi', file: '44-superadmin-master-data-prodi' },
      { label: 'Tahapan & Regulasi', file: '45-superadmin-tahapan-regulasi' },
      { label: 'Kuota Bimbingan', file: '46-superadmin-kuota-bimbingan' },
      { label: 'Manajemen Pengguna', file: '47-superadmin-manajemen-pengguna' }
    ]
  }
];

/* ------------------------------------------------------------------ */
/* Utilitas                                                            */
/* ------------------------------------------------------------------ */

/** Menyembunyikan kontrol khusus pengembangan agar tangkapan layar bersih. */
const HIDE_DEV_DOCK_CSS = `
  aside[aria-label="Panel Demonstrasi & Simulasi Peran Sistem"] { display: none !important; }
  * { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }
`;

async function newContext(browser, viewport) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta'
  });
  return context;
}

async function login(page, nomorInduk) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input#login-identifier', { timeout: 30000 });
  await page.fill('input#login-identifier', nomorInduk);
  await page.fill('input#login-password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.shell-root', { timeout: 30000 });
  await page.waitForSelector('.shell-topbar', { timeout: 30000 });
  await page.addStyleTag({ content: HIDE_DEV_DOCK_CSS });
  await sleep(500);
}

/** Menunggu konten halaman utama termuat sepenuhnya. */
async function waitForContent(page) {
  await page.waitForSelector('#main-content h1', { timeout: 20000 });
  await page
    .waitForFunction(
      () => !document.body.innerText.includes('Memuat Modul Akademik'),
      null,
      { timeout: 20000 }
    )
    .catch(() => {});
  await sleep(500);
}

/** Menutup modal/alert yang mungkin muncul sebelum tangkapan layar. */
async function dismissOverlays(page) {
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(120);
}

/** Mengklik item menu sidebar berdasarkan label persis. */
async function clickNav(page, label) {
  const selector = `.sidebar-nav-btn:has(.sidebar-nav-label:text-is(${JSON.stringify(label)}))`;
  const btn = page.locator(selector).first();
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
  // Tunggu React menandai menu ini sebagai aktif (aria-current="page").
  await page
    .waitForFunction(
      (lbl) => {
        const active = document.querySelector('.sidebar-nav-btn.active .sidebar-nav-label');
        return active && active.textContent.trim() === lbl;
      },
      label,
      { timeout: 15000 }
    )
    .catch(() => {});
  await waitForContent(page);
}

/** Menyimpan tangkapan layar dengan viewport setinggi konten (tanpa terpotong). */
async function capture(page, file) {
  // Reset ke ukuran desktop agar pengukuran tinggi konten tidak terpaku pada
  // min-height:100vh dari viewport tangkapan sebelumnya.
  await page.setViewportSize(DESKTOP);
  await sleep(250);
  const pageHeight = await page.evaluate(() =>
    Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight
    )
  );
  const target = Math.min(Math.max(pageHeight, DESKTOP.height), 5200);
  const heading = await page
    .locator('#main-content h1')
    .first()
    .textContent()
    .catch(() => '');
  await page.setViewportSize({ width: DESKTOP.width, height: target });
  await sleep(350);
  const outPath = path.join(OUT_DIR, `${file}.png`);
  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`  [OK] ${file}.png (1440x${target}) :: ${(heading || '').trim()}`);
}

/** Menggambar anotasi (kotak merah + label + panah) di atas halaman. */
async function annotate(page, specs) {
  await page.evaluate((specs) => {
    const NS = 'http://www.w3.org/2000/svg';
    const sx = window.scrollX;
    const sy = window.scrollY;
    const W = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const H = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);

    const layer = document.createElement('div');
    layer.setAttribute('data-guide-annotations', '1');
    layer.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:2147483000;`;
    document.body.appendChild(layer);

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.style.cssText = 'position:absolute;left:0;top:0;';
    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML =
      '<marker id="ga-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,3 L0,6 z" fill="#dc2626"/></marker>';
    svg.appendChild(defs);
    layer.appendChild(svg);

    const findEl = (spec) => {
      if (spec.selector) {
        const el = document.querySelector(spec.selector);
        if (el) return el;
      }
      if (spec.text) {
        const all = Array.from(
          document.querySelectorAll('button,span,div,label,p,h1,h2,h3,a,strong')
        );
        const exact = all.filter((e) => e.textContent.trim() === spec.text);
        if (exact.length) return exact[exact.length - 1];
        const partial = all.filter((e) => e.textContent.includes(spec.text));
        if (partial.length) return partial[partial.length - 1];
      }
      return null;
    };

    for (const spec of specs) {
      const el = findEl(spec);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const x = r.left + sx;
      const y = r.top + sy;
      const w = r.width;
      const h = r.height;

      const box = document.createElement('div');
      box.style.cssText = `position:absolute;left:${x - 4}px;top:${y - 4}px;width:${w + 8}px;height:${h + 8}px;border:2.5px solid #dc2626;border-radius:6px;box-sizing:border-box;`;
      layer.appendChild(box);

      if (spec.label) {
        const lx = x + w + 34;
        const ly = y + h / 2 - 13;
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', lx - 8);
        line.setAttribute('y1', ly + 13);
        line.setAttribute('x2', x + w + 3);
        line.setAttribute('y2', y + h / 2);
        line.setAttribute('stroke', '#dc2626');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#ga-arrow)');
        svg.appendChild(line);

        const tag = document.createElement('div');
        tag.textContent = spec.label;
        tag.style.cssText = `position:absolute;left:${lx}px;top:${ly}px;background:#dc2626;color:#ffffff;font:600 12.5px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;padding:4px 9px;border-radius:4px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25);`;
        layer.appendChild(tag);
      }
    }
  }, specs);
  await sleep(150);
}

async function clearAnnotations(page) {
  await page
    .evaluate(() => document.querySelector('[data-guide-annotations]')?.remove())
    .catch(() => {});
}

/** Tangkapan layar pada ukuran viewport tetap (untuk modal/dropdown overlay). */
async function captureViewport(page, file, viewport = DESKTOP) {
  await page.setViewportSize(viewport);
  await sleep(400);
  const outPath = path.join(OUT_DIR, `${file}.png`);
  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`  [OK] ${file}.png (${viewport.width}x${viewport.height})`);
}

/* ------------------------------------------------------------------ */
/* Alur utama                                                          */
/* ------------------------------------------------------------------ */
async function main() {
  await ensureServers();
  const browser = await chromium.launch({ headless: true });

  /* ---------- Bagian 1: Halaman Login & Akun Demo ---------- */
  {
    console.log('Bagian 1: Halaman Login');
    const context = await newContext(browser, DESKTOP);
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('input#login-identifier', { timeout: 30000 });
    await page.addStyleTag({ content: HIDE_DEV_DOCK_CSS });
    await sleep(500);
    await capture(page, '01-login');

    await annotate(page, [
      {
        selector: 'input#login-identifier',
        label: 'Isi Nomor Induk (NIM/NIP) atau Email'
      },
      { selector: 'input#login-password', label: 'Isi Kata Sandi akun' },
      {
        text: 'Akses Cepat Pengujian / Akun Demo:',
        label: 'Akses Cepat Pengujian / Akun Demo'
      },
      {
        selector: 'button[type="submit"]',
        label: 'Klik "Masuk ke Portal SIM-TA"'
      }
    ]);
    await capture(page, '02-login-akun-demo');
    await clearAnnotations(page);
    await context.close();
  }

  /* ---------- Bagian 2: Setiap peran & setiap menu ---------- */
  for (const job of ROLE_JOBS) {
    console.log(`Peran: ${job.role} (${job.nama})`);
    const context = await newContext(browser, DESKTOP);
    const page = await context.newPage();
    try {
      await login(page, job.nomorInduk);
      for (const menu of job.menus) {
        await dismissOverlays(page);
        await clickNav(page, menu.label);
        await capture(page, menu.file);
      }
    } catch (err) {
      console.error(`  [GAGAL] ${job.role}: ${err.message}`);
    }
    await context.close();
  }

  /* ---------- Bagian 3: Fitur lain (notifikasi, ganti sandi) ---------- */
  {
    console.log('Bagian 3: Fitur Lain');
    const context = await newContext(browser, DESKTOP);
    const page = await context.newPage();
    try {
      await login(page, '210211100142');

      // Notifikasi
      await page.click('button[aria-label^="Notifikasi sistem"]');
      await sleep(800);
      await captureViewport(page, '48-notifikasi');
      await page.keyboard.press('Escape').catch(() => {});
      await sleep(300);

      // Ganti Kata Sandi
      await page.click('button[aria-label="Menu profil akun"]');
      await sleep(400);
      await page.locator('button:has-text("Ganti Kata Sandi")').first().click();
      await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
      await sleep(600);
      await captureViewport(page, '49-ganti-kata-sandi');
    } catch (err) {
      console.error(`  [GAGAL] Fitur lain: ${err.message}`);
    }
    await context.close();
  }

  /* ---------- Bagian 4: Tampilan mobile (drawer) ---------- */
  {
    console.log('Bagian 4: Tampilan Mobile');
    const context = await newContext(browser, MOBILE);
    const page = await context.newPage();
    try {
      await login(page, '210211100142');
      const toggle = page.locator('button[aria-label="Buka menu navigasi mobile"]');
      await toggle.waitFor({ state: 'visible', timeout: 15000 });
      await toggle.click();
      await page.waitForSelector('.drawer-panel.open', { timeout: 10000 });
      await sleep(600);
      await page.screenshot({
        path: path.join(OUT_DIR, '50-menu-mobile-drawer.png'),
        fullPage: false
      });
      console.log('  [OK] 50-menu-mobile-drawer.png (390x844)');
    } catch (err) {
      console.error(`  [GAGAL] Mobile drawer: ${err.message}`);
    }
    await context.close();
  }

  await browser.close();
  stopServers();
  console.log('\nSelesai. Seluruh tangkapan layar tersimpan di:');
  console.log(OUT_DIR);
}

main().catch((err) => {
  console.error('Kesalahan fatal:', err);
  stopServers();
  process.exit(1);
});
