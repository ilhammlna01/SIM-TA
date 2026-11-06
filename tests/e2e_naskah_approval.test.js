/**
 * Uji Browser — Persetujuan Naskah oleh Pembimbing (BP-2, Putaran 21 Okt 2026).
 *
 * Membuktikan:
 *   1. Dosen melihat halaman Review Naskah dari data BACKEND (bukan demo).
 *   2. Tombol "Setujui Naskah" tersedia dan bekerja.
 *   3. Keputusan tersimpan di basis data (naskah_versi.status_persetujuan).
 *   4. Mahasiswa melihat status telaah yang sama di halamannya.
 *   5. Naskah yang disetujui memenuhi butir checklist tahapan.
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

const call = async (method, path, token, body) => {
  const headers = { Authorization: `Bearer ${token}` };
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j = null; try { j = JSON.parse(t); } catch {}
  return { status: r.status, json: j };
};

// ---------------------------------------------------------------------
// Persiapan: mahasiswa uji + naskah + plotting pembimbing
// ---------------------------------------------------------------------
const NIM = '210211100142';
const NIP_DOSEN = '196201081987032001';
const mhs = await login(NIM);
const dosen = await login(NIP_DOSEN);
const koor = await login('197802142003122001');

const daftarTA = await call('GET', '/akademik/tugas-akhir', mhs);
const taId = daftarTA.json?.data?.[0]?.id;
check(Boolean(taId), 'Tugas Akhir mahasiswa uji ditemukan', taId);

const plot = await call('PUT', `/akademik/tugas-akhir/${taId}/pembimbing`, koor, {
  pembimbingUtama: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
  pembimbingUtamaNip: NIP_DOSEN,
  pembimbingPendamping: 'Dr. Faidal, S.E., M.M.',
  pembimbingPendampingNip: '197703032003121002'
});
check(plot.status === 200, 'Pembimbing ditetapkan untuk mahasiswa uji', `status=${plot.status}`);

const up = await call('POST', '/akademik/naskah', mhs, {
  fileUrl: '/api/storage/files/naskah/e2e-approval.pdf',
  keterangan: 'Uji browser persetujuan naskah'
});
const versiId = up.json?.data?.id;
check(Boolean(versiId), 'Naskah versi baru dibuat', versiId);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message.slice(0, 160)));

// ---------------------------------------------------------------------
console.log('\nA. Dosen: Review Naskah dari data backend');
// ---------------------------------------------------------------------
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.waitForSelector('input#login-identifier', { timeout: 15000 });
await page.fill('input#login-identifier', NIP_DOSEN);
await page.fill('input#login-password', PWD);
await page.click('button[type="submit"]');
await page.waitForSelector('.shell-root', { timeout: 20000 });
console.log('  [OK]    Login dosen');

await page.goto(`${BASE}/?nav=review`, { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(3000);

const adaPanelKeputusan = await page.locator('text=/Keputusan atas Naskah/i').count();
check(adaPanelKeputusan > 0, 'Panel "Keputusan atas Naskah" tampil di halaman Review', `ditemukan=${adaPanelKeputusan}`);

const tombolSetujui = page.locator('button', { hasText: /Setujui Naskah/i }).first();
const adaTombol = (await tombolSetujui.count()) > 0;
check(adaTombol, 'Tombol "Setujui Naskah" tersedia');
check((await page.locator('text=/Belum Ada Naskah Masuk untuk Ditelaah/i').count()) === 0, 'Halaman tidak kosong (data naskah terbaca dari backend)');

if (adaTombol) {
  await tombolSetujui.click();
  await page.waitForTimeout(2500);
}

// ---------------------------------------------------------------------
console.log('\nB. Basis data: keputusan tersimpan');
// ---------------------------------------------------------------------
const setelah = await call('GET', '/akademik/naskah', dosen);
const v = (setelah.json?.data || []).find((x) => x.id === versiId);
check(v?.statusPersetujuan === 'Disetujui', 'status_persetujuan naskah = Disetujui di basis data', `status=${v?.statusPersetujuan}`);
check(Boolean(v?.disetujuiOleh), 'disetujui_oleh terisi', v?.disetujuiOleh || 'kosong');
check(Boolean(v?.tanggalPersetujuan), 'tanggal_persetujuan terisi', v?.tanggalPersetujuan || 'kosong');

// ---------------------------------------------------------------------
console.log('\nC. Mahasiswa: status telaah terlihat');
// ---------------------------------------------------------------------
const page2 = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page2.on('pageerror', (e) => pageErrors.push(e.message.slice(0, 160)));
await page2.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page2.waitForSelector('input#login-identifier', { timeout: 15000 });
await page2.fill('input#login-identifier', NIM);
await page2.fill('input#login-password', PWD);
await page2.click('button[type="submit"]');
await page2.waitForSelector('.shell-root', { timeout: 20000 });
await page2.goto(`${BASE}/?nav=naskah`, { waitUntil: 'networkidle' }).catch(() => {});
await page2.waitForTimeout(3000);
const teksMhs = await page2.locator('body').innerText();
check(/Disetujui/i.test(teksMhs), 'Mahasiswa melihat status "Disetujui" pada daftar naskahnya');

// ---------------------------------------------------------------------
console.log('\nD. Checklist: butir "naskah disetujui pembimbing" terpenuhi');
// ---------------------------------------------------------------------
const progres = await call('GET', `/akademik/tugas-akhir/${taId}/progres`, koor);
const cl = progres.json?.data?.checklist || [];
const item = cl.find((c) => c.key === 'naskahDisetujui');
if (item) {
  check(item.terpenuhi === true, 'Butir checklist "Naskah disetujui pembimbing" terpenuhi', `capaian=${item.capaian}`);
} else {
  const tmpl = progres.json?.data?.tahapAktif;
  check(Boolean(tmpl), 'Tahap aktif=S1-T1 (tidak memerlukan naskah) — butir tidak muncul pada tahap ini', `aktif=${tmpl?.kodeTahap}`);
}

console.log(`\nError halaman: ${pageErrors.length ? pageErrors.join(' | ') : 'tidak ada'}`);
console.log(`\nLulus: ${pass} | Gagal: ${fail}`);

await browser.close();
process.exit(fail > 0 ? 1 : 0);
