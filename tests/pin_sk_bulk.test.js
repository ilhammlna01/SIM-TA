/**
 * Uji Endpoint Otorisasi PIN Dekanat & Penerbitan SK Massal (butir #1).
 */

import { DatabaseSync } from 'node:sqlite';

const API = 'http://localhost:5001/api';
const PWD = 'UTM-QA-2026!Lab';

let pass = 0;
let fail = 0;
const failures = [];
function check(cond, name, detail = '') {
  console.log(`  [${cond ? 'LULUS' : 'GAGAL'}] ${name}${detail ? ` — ${detail}` : ''}`);
  cond ? pass++ : fail++;
  if (!cond) failures.push(name);
}

async function login(identifier, password = PWD) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  const j = await r.json().catch(() => ({}));
  if (!j.token) throw new Error(`Login ${identifier} gagal: ${j.message}`);
  return j.token;
}

async function call(method, path, token, body) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await r.text();
  let j = null;
  try { j = JSON.parse(text); } catch {}
  return { status: r.status, json: j, text };
}

const koor = await login('197802142003122001');
const sa = await login('197405102000031001');
const mhs = await login('210211100142');

console.log('=== Uji Otorisasi PIN Dekanat & SK Massal ===\n');

// 1. Status PIN
const status = await call('GET', '/admin/status-pin', koor);
check(status.status === 200, 'GET /admin/status-pin merespons', `sudahDiatur=${status.json?.data?.sudahDiatur}`);

// 2. Verifikasi PIN salah -> 401
const salah = await call('POST', '/admin/verifikasi-pin', koor, { pin: '000000' });
check(salah.status === 401 && salah.json?.code === 'PIN_INVALID', 'PIN salah DITOLAK (401 PIN_INVALID)', `status=${salah.status} code=${salah.json?.code}`);

// 3. Verifikasi PIN benar -> token
const benar = await call('POST', '/admin/verifikasi-pin', koor, { pin: '202610' });
check(benar.status === 200 && !!benar.json?.data?.token, 'PIN benar menerbitkan token otorisasi', `status=${benar.status}`);
const tokenPin = benar.json?.data?.token;

// 4. Penerbitan SK massal TANPA token -> ditolak
const tanpaToken = await call('POST', '/admin/sk/bulk', koor, {
  jenisSK: 'SK Uji',
  mahasiswa: [{ nim: '210211100142', namaMahasiswa: 'Dinda Ayu Larasati' }]
});
check(
  tanpaToken.status === 401 && tanpaToken.json?.code === 'PIN_TOKEN_REQUIRED',
  'Penerbitan SK massal TANPA token otorisasi DITOLAK',
  `status=${tanpaToken.status} code=${tanpaToken.json?.code}`
);

// 5. Penerbitan SK massal dengan token -> berhasil & tersimpan
const db = new DatabaseSync('data/sim_ta_feb_utm.db');
const sebelum = db.prepare('SELECT count(*) c FROM sk_dokumen').get().c;

const bulk = await call('POST', '/admin/sk/bulk', koor, {
  tokenOtorisasi: tokenPin,
  jenisSK: 'SK Uji Otoritasi Massal',
  jenjang: 'S1',
  programStudi: 'S-1 Manajemen',
  tanggalTerbit: '2026-10-22',
  penandatangan: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
  nomorSKBase: '999/UN46.1.1/SK.UJI',
  generatePdf: false,
  mahasiswa: [
    { nim: '210211100142', namaMahasiswa: 'Dinda Ayu Larasati', judulTA: 'Uji SK Massal 1' },
    { nim: '210211100099', namaMahasiswa: 'Andi Prasetyo', judulTA: 'Uji SK Massal 2' }
  ]
});
check(bulk.status === 201, 'Penerbitan SK massal DITERIMA (201)', `status=${bulk.status} ${bulk.json?.message || ''}`);
check(bulk.json?.data?.berhasil?.length === 2, 'Dua SK berhasil diterbitkan', `berhasil=${bulk.json?.data?.berhasil?.length} gagal=${bulk.json?.data?.gagal?.length}`);

const sesudah = db.prepare('SELECT count(*) c FROM sk_dokumen').get().c;
check(sesudah === sebelum + 2, 'Dua baris SK baru tersimpan di basis data', `${sebelum} -> ${sesudah}`);

const skBaru = db.prepare("SELECT * FROM sk_dokumen WHERE jenis_sk = 'SK Uji Otoritasi Massal'").all();
check(skBaru.length === 2, 'SK baru tercatat di sk_dokumen', `jumlah=${skBaru.length}`);
check(
  skBaru.every((s) => /^999\/UN46\.1\.1\/SK\.UJI\/\d{4}\/\d{4}$/.test(s.nomor_sk)),
  'Nomor SK mengikuti format berurutan & unik',
  skBaru.map((s) => s.nomor_sk).join(' | ')
);
check(skBaru.every((s) => s.status === 'Diterbitkan'), 'Status SK = Diterbitkan');

// 6. Jejak audit
const audit = db
  .prepare("SELECT details FROM audit_log WHERE action = 'PUBLISH_SK_BULK' ORDER BY id DESC LIMIT 1")
  .get();
check(Boolean(audit), 'Penerbitan SK massal tercatat di audit_log', audit?.details?.slice(0, 80));

// 7. Percobaan PIN salah tercatat di audit
const auditPin = db
  .prepare("SELECT details FROM audit_log WHERE action = 'PIN_FAILED' ORDER BY id DESC LIMIT 1")
  .get();
check(Boolean(auditPin), 'Percobaan PIN salah tercatat di audit_log');

// 8. Token otorisasi tidak bisa dipakai ulang setelah kedaluwarsa/untuk endpoint lain
const tokenSalah = await call('POST', '/admin/sk/bulk', koor, {
  tokenOtorisasi: 'token-palsu',
  mahasiswa: [{ nim: '210211100142' }]
});
check(tokenSalah.status === 401, 'Token otorisasi palsu ditolak', `code=${tokenSalah.json?.code}`);

// 9. Mahasiswa tidak boleh memakai endpoint ini
const mhsBulk = await call('POST', '/admin/sk/bulk', mhs, {
  tokenOtorisasi: tokenPin,
  mahasiswa: [{ nim: '210211100142' }]
});
check(mhsBulk.status === 403, 'Mahasiswa DITOLAK memakai endpoint penerbitan SK massal', `status=${mhsBulk.status}`);

// 10. Pengaturan PIN oleh Super Admin
const atur = await call('POST', '/admin/atur-pin', sa, { pin: '987654' });
check(atur.status === 200, 'Super Admin dapat menetapkan PIN Dekanat', atur.json?.message || '');
const pinBaru = await call('POST', '/admin/verifikasi-pin', koor, { pin: '987654' });
check(pinBaru.status === 200, 'PIN baru berlaku segera', `status=${pinBaru.status}`);

// Kembalikan PIN pengembangan
await call('POST', '/admin/atur-pin', sa, { pin: '202610' });

// Bersihkan SK uji
db.prepare("DELETE FROM sk_dokumen WHERE jenis_sk LIKE 'SK Uji%'").run();
db.prepare("DELETE FROM audit_log WHERE action IN ('PUBLISH_SK_BULK','PIN_FAILED','PIN_GRANTED')").run();
db.close();

console.log(`\n====================================================`);
console.log(`HASIL UJI PIN & SK MASSAL: ${pass} LULUS | ${fail} GAGAL`);
if (failures.length) {
  console.log('Pemeriksaan yang gagal:');
  for (const f of failures) console.log(`  - ${f}`);
}
console.log('====================================================\n');
process.exit(fail > 0 ? 1 : 0);
