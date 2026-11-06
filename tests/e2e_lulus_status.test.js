/**
 * Uji Browser — Status Kelulusan pada Dashboard Mahasiswa (P0-2)
 * Audit 21 Oktober 2026 (Putaran Business Process).
 *
 * Membuktikan bahwa status kelulusan yang SUDAH dihitung backend
 * (Proses / Siap Pengesahan / Lulus) benar-benar SAMPAI ke layar mahasiswa,
 * dan bahwa label pada dashboard selalu identik dengan nilai API.
 *
 * Jalankan: node tests/e2e_lulus_status.test.js  (atau npm run test:lulus)
 */

import { chromium } from 'playwright';

const BASE = 'http://localhost:5001';
const API = `${BASE}/api`;
const PWD = 'UTM-QA-2026!Lab';

let pass = 0;
let fail = 0;
const failures = [];

function check(cond, name, detail = '') {
  console.log(`  [${cond ? 'LULUS' : 'GAGAL'}] ${name}${detail ? ` — ${detail}` : ''}`);
  cond ? pass++ : fail++;
  if (!cond) failures.push(name);
}

const login = async (identifier, password = PWD) => {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  const j = await r.json().catch(() => ({}));
  if (!j.token) throw new Error(`Login ${identifier} gagal: ${j.message}`);
  return j.token;
};

const statusApi = async (token) => {
  const r = await fetch(`${API}/akademik/status-kelulusan`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return (await r.json().catch(() => ({})))?.data || null;
};

console.log('=== Uji Browser: Status Kelulusan di Dashboard Mahasiswa (P0-2) ===\n');

const browser = await chromium.launch();

/**
 * Membuka dashboard mahasiswa dan mengembalikan teks yang tampil.
 */
async function bukaDashboard(nim, password = PWD) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input#login-identifier', { timeout: 15000 });
  await page.fill('input#login-identifier', nim);
  await page.fill('input#login-password', password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.shell-root', { timeout: 20000 });
  await page.goto(`${BASE}/?nav=dashboard`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(3500);

  const teks = await page.locator('body').innerText().catch(() => '');
  return { ctx, page, teks, errors };
}

// ---------------------------------------------------------------------------
// A. Mahasiswa dengan Tugas Akhir yang sudah selesai tahap
// ---------------------------------------------------------------------------
console.log('A. Mahasiswa dengan Tugas Akhir berjalan/selesai');
{
  const nim = '210211100142';
  const token = await login(nim);
  const api = await statusApi(token);
  check(Boolean(api), 'Endpoint status-kelulusan merespons', `status=${api?.status}`);

  const { ctx, page, teks, errors } = await bukaDashboard(nim);
  check(errors.length === 0, 'Dashboard mahasiswa tanpa error halaman', errors.join(' | ') || 'bersih');

  if (api?.label) {
    check(
      teks.includes(api.label),
      `Dashboard menampilkan label status dari API ("${api.label}")`,
      api.label
    );
  }
  check(
    /Lulus Tugas Akhir|Siap Pengesahan|Proses Tugas Akhir Berjalan/.test(teks),
    'Dashboard menampilkan salah satu dari tiga status kelulusan yang dikenal'
  );

  // Badge harus memakai teks yang jelas, bukan "Draft"/"Belum Ditelaah".
  check(
    !/Status\s*:\s*Draft/.test(teks),
    'Dashboard tidak lagi memakai label ambigu "Draft" untuk status TA'
  );

  await ctx.close();
}

// ---------------------------------------------------------------------------
// B. Mahasiswa tanpa Tugas Akhir sama sekali
// ---------------------------------------------------------------------------
console.log('\nB. Mahasiswa tanpa entri Tugas Akhir');
{
  const tokenSA = await login('197405102000031001');
  const stamp = String(Date.now()).slice(-9);
  const nim = `1998${stamp}7`;

  const create = await fetch(`${API}/superadmin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenSA}` },
    body: JSON.stringify({
      nomorInduk: nim,
      nama: 'Mahasiswa Tanpa TA',
      email: `${nim}@student.trunojoyo.ac.id`,
      role: 'mahasiswa',
      jenjang: 'S1',
      prodi: 'S-1 Manajemen'
    })
  });
  const created = await create.json().catch(() => ({}));
  const sandi = created?.temporaryPassword;
  check(Boolean(sandi), 'Akun mahasiswa tanpa TA dibuat', `nim=${nim}`);

  if (sandi) {
    const token = await login(nim, sandi);
    const api = await statusApi(token);
    check(api?.status === 'Belum Mulai', 'API melaporkan "Belum Mulai" untuk mahasiswa tanpa TA', `status=${api?.status}`);

    const { ctx, page, teks } = await bukaDashboard(nim, sandi);
    check(
      /Belum Memulai Tugas Akhir|Proses Tugas Akhir Berjalan/.test(teks),
      'Dashboard menampilkan status yang sesuai untuk mahasiswa tanpa TA',
      api?.label || ''
    );
    await ctx.close();
  }

  // Bersihkan
  const list = await (await fetch(`${API}/superadmin/users`, { headers: { Authorization: `Bearer ${tokenSA}` } })).json();
  const u = (list.data || []).find((x) => x.nomorInduk === nim);
  if (u) {
    await fetch(`${API}/superadmin/users/${u.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenSA}` }
    });
  }
}

await browser.close();

console.log(`\n====================================================`);
console.log(`HASIL UJI STATUS LULUS: ${pass} LULUS | ${fail} GAGAL`);
if (failures.length) {
  console.log('Pemeriksaan yang gagal:');
  for (const f of failures) console.log(`  - ${f}`);
}
console.log('====================================================\n');
process.exit(fail > 0 ? 1 : 0);
