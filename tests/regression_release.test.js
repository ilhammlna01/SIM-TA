/**
 * Regression Test — Pengerasan Rilis (Backlog Fase 4)
 *
 * 1. Gerbang WAJIB ganti kata sandi (must_change_password): reset superadmin →
 *    login kata sandi sementara → mustChangePassword=true → ganti sandi → flag bersih.
 * 2. Header keamanan HTTP (CSP, Permissions-Policy, COOP/CORP, X-Frame-Options, dll).
 * 3. Migrasi SheetJS resmi (xlsx 0.20.x) — API baca/tulis berfungsi (roundtrip).
 *
 * Jalankan: node tests/regression_release.test.js   (server harus aktif di :5001)
 */

import { DatabaseSync } from 'node:sqlite';
import { TEST_PASSWORD, ensureTestAccounts } from './helpers/testAccounts.js';
import * as XLSX from 'xlsx';

const BASE = 'http://localhost:5001/api';
const DB_PATH = 'data/sim_ta_feb_utm.db';

let pass = 0;
let fail = 0;
function assert(cond, name, detail = '') {
  if (cond) { console.log(`  PASS  ${name}`); if (detail) console.log(`        -> ${detail}`); pass++; }
  else { console.error(`  FAIL  ${name}`); if (detail) console.error(`        -> ${detail}`); fail++; }
}

async function login(identifier, password = TEST_PASSWORD) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
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
  console.log('REGRESSION TEST — PENGERASAN RILIS (BACKLOG FASE 4)');
  console.log('====================================================\n');

  const db = new DatabaseSync(DB_PATH);
  const superLogin = await login('197405102000031001');
  const superToken = superLogin.body.token;

  // ---------- 1. Gerbang wajib ganti kata sandi ----------
  console.log('--- 1. Gerbang wajib ganti kata sandi ---');
  const target = db.prepare("SELECT id, nomor_induk, password FROM users WHERE role='admin' LIMIT 1").get();
  const origPassword = target.password;

  const resetRes = await fetch(`${BASE}/superadmin/users/${target.id}/reset-password`, {
    method: 'POST', headers: { Authorization: `Bearer ${superToken}` }
  });
  const resetBody = await resetRes.json();
  assert(resetRes.status === 200 && !!resetBody.temporaryPassword, '1a. Reset superadmin menerbitkan kata sandi sementara');

  const tempPw = resetBody.temporaryPassword;
  const flagRow = db.prepare('SELECT must_change_password FROM users WHERE id = ?').get(target.id);
  assert(flagRow.must_change_password === 1, '1b. must_change_password = 1 setelah reset', `nilai=${flagRow.must_change_password}`);

  const l1 = await login(target.nomor_induk, tempPw);
  assert(l1.status === 200 && l1.body.user?.mustChangePassword === true, '1c. Login sandi sementara → mustChangePassword=true');

  const newPw = `Uji-${Date.now()}A1`;
  const chg = await fetch(`${BASE}/auth/change-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${l1.body.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: target.id, oldPassword: tempPw, newPassword: newPw })
  });
  assert(chg.status === 200, '1d. Ganti kata sandi berhasil');

  const flagAfter = db.prepare('SELECT must_change_password FROM users WHERE id = ?').get(target.id);
  assert(flagAfter.must_change_password === 0, '1e. must_change_password dibersihkan setelah ganti sandi');

  const l2 = await login(target.nomor_induk, newPw);
  assert(l2.status === 200 && l2.body.user?.mustChangePassword === false, '1f. Login sandi baru → mustChangePassword=false');

  // Pulihkan
  db.prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?').run(origPassword, target.id);

  // ---------- 2. Header keamanan ----------
  console.log('\n--- 2. Header keamanan HTTP ---');
  const hres = await fetch('http://localhost:5001/api/health');
  const h = (k) => hres.headers.get(k);
  assert((h('content-security-policy') || '').includes("form-action 'self'"), '2a. CSP memuat form-action');
  assert(h('x-content-type-options') === 'nosniff', '2b. X-Content-Type-Options: nosniff');
  assert((h('permissions-policy') || '').includes('camera=()'), '2c. Permissions-Policy membatasi fitur perangkat');
  assert(h('cross-origin-opener-policy') === 'same-origin', '2d. COOP: same-origin');
  assert(h('cross-origin-resource-policy') === 'same-origin', '2e. CORP: same-origin');
  assert(h('x-permitted-cross-domain-policies') === 'none', '2f. X-Permitted-Cross-Domain-Policies: none');
  assert(h('x-frame-options') === 'SAMEORIGIN', '2g. X-Frame-Options: SAMEORIGIN');
  assert(h('x-xss-protection') === '0', '2h. X-XSS-Protection: 0 (dimodernkan)');

  // ---------- 3. SheetJS resmi (roundtrip) ----------
  console.log('\n--- 3. SheetJS resmi (xlsx 0.20.x) ---');
  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([{ NIM: '210211100142', Nama: 'Uji' }]);
    XLSX.utils.book_append_sheet(wb, ws, 'DATA');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const rb = XLSX.read(buf, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(rb.Sheets['DATA']);
    assert(rows.length === 1 && rows[0].NIM === '210211100142', '3a. SheetJS baca/tulis roundtrip berfungsi');
  } catch (e) {
    assert(false, '3a. SheetJS baca/tulis roundtrip berfungsi', e.message);
  }

  console.log('\n====================================================');
  console.log(`TOTAL PASS: ${pass} | TOTAL FAIL: ${fail}`);
  console.log(`STATUS: ${fail === 0 ? 'PENGERASAN RILIS TERVERIFIKASI' : 'ADA VERIFIKASI YANG GAGAL'}`);
  console.log('====================================================\n');

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Regression rilis suite error:', err.message);
  process.exit(1);
});
