/**
 * Regression Test — Verifikasi Perbaikan Bug Hasil Audit Forensik
 * SIM Tugas Akhir FEB UTM
 *
 * Menguji secara langsung perbaikan atas temuan:
 * #1 JWT secret tidak lagi hardcoded (diverifikasi terpisah via env)
 * #2 IDOR kategori berkas 'syarat' (mahasiswa tidak boleh unduh milik mahasiswa lain)
 * #3 dokumen_resmi tidak lagi dapat diunduh tanpa autentikasi
 * #5 change-password memerlukan token sesi
 * #6 /penguji/koreksi tidak lagi membocorkan koreksi mahasiswa lain
 * #7 Berita Acara tidak crash saat pengujiList = []
 * #8 judul ujian tersimpan & tampil (bukan placeholder)
 * #10 penilaian ujian tidak valid (ID tidak ada / nilai di luar rentang) ditolak
 *
 * Jalankan: node tests/regression_bugfix.test.js   (server harus aktif)
 */

const BASE_URL = 'http://localhost:5001/api';

import { TEST_PASSWORD, ensureTestAccounts } from './helpers/testAccounts.js';

let pass = 0;
let fail = 0;
function assert(cond, name, detail = '') {
  if (cond) {
    console.log(`  PASS  ${name}`);
    if (detail) console.log(`        -> ${detail}`);
    pass++;
  } else {
    console.error(`  FAIL  ${name}`);
    if (detail) console.error(`        -> ${detail}`);
    fail++;
  }
}

async function login(identifier, password = TEST_PASSWORD) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  const data = await res.json();
  if (!res.ok || !data.token) throw new Error(`Login gagal (${identifier}): ${data.message || res.status}`);
  return data.token;
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
  console.log('REGRESSION TEST — PERBAIKAN BUG AUDIT FORENSIK');
  console.log('====================================================\n');

  const mhsToken = await login('210211100142');       // Dinda (S1)
  const mhs2Token = await login('210211100099');      // Andi (mahasiswa lain)
  const pengujiToken = await login('197703032003121002'); // Dr. Faidal
  const adminToken = await login('198104122008121002');
  const superToken = await login('197405102000031001');

  // #2 — IDOR kategori 'syarat': mahasiswa lain tidak boleh mengunduh transkrip milik Dinda.
  const syaratProbe = await fetch(`${BASE_URL}/storage/files/syarat/transkrip_dinda.pdf`, {
    headers: { Authorization: `Bearer ${mhs2Token}` }
  });
  assert(
    syaratProbe.status === 403 || syaratProbe.status === 404,
    '#2 IDOR syarat: mahasiswa lain ditolak mengakses berkas syarat milik mahasiswa lain',
    `HTTP ${syaratProbe.status}`
  );

  // #3 — dokumen_resmi tidak lagi publik
  const publicDoc = await fetch(`${BASE_URL}/storage/files/dokumen_resmi/Berita_Acara_uji.pdf`);
  assert(
    publicDoc.status === 401 || publicDoc.status === 403,
    '#3 Dokumen resmi tidak dapat diunduh tanpa autentikasi (bukan lagi publik)',
    `HTTP ${publicDoc.status}`
  );

  // #5 — change-password tanpa token ditolak
  const cp = await fetch(`${BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-mhs-1', oldpassword: TEST_PASSWORD, newPassword: 'RahasiaBaru123' })
  });
  assert(cp.status === 401, '#5 change-password tanpa token sesi ditolak (401)', `HTTP ${cp.status}`);

  // #6 — mahasiswa tidak boleh melihat koreksi mahasiswa lain
  const korMhs = await fetch(`${BASE_URL}/penguji/koreksi`, {
    headers: { Authorization: `Bearer ${mhs2Token}` }
  });
  const korJson = await korMhs.json();
  const korRows = Array.isArray(korJson.data) ? korJson.data : [];
  const onlyOwn = korRows.every((r) => r.mhsNim === '210211100099' || r.mhs_nim === '210211100099');
  assert(
    korMhs.status === 200 && onlyOwn,
    '#6 /penguji/koreksi hanya mengembalikan koreksi milik mahasiswa pemanggil',
    `Baris: ${korRows.length}, semua milik sendiri: ${onlyOwn}`
  );

  // #7 — Berita Acara dengan pengujiList = [] tidak crash (harus fallback, bukan 500)
  const ba = await fetch(`${BASE_URL}/documents/generate-berita-acara`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pengujiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ nim: '210211100142', pengujiList: [] })
  });
  assert(
    ba.status === 200 || ba.status === 201,
    '#7 Berita Acara dengan pengujiList kosong tidak crash (sukses, fallback dewan penguji)',
    `HTTP ${ba.status}`
  );

  // #8 — judul ujian tersimpan (bukan placeholder) untuk minimal satu rekam ujian
  const ujianRes = await fetch(`${BASE_URL}/penguji/ujian`, {
    headers: { Authorization: `Bearer ${pengujiToken}` }
  });
  const ujianJson = await ujianRes.json();
  const ujianList = Array.isArray(ujianJson.data) ? ujianJson.data : [];
  const bambangExam = ujianList.find((u) => u.id === 'uj-pgj-3') || {};
  assert(
    ujianList.length > 0 && String(bambangExam.judul || '').includes('Dynamic Capabilities'),
    '#8 Judul TA nyata tersimpan & dikembalikan (bukan placeholder hardcoded)',
    `Judul uj-pgj-3: ${bambangExam.judul || '(tidak ada)'}`
  );

  // #10 — penilaian ke ID ujian tidak ada ditolak 404; nilai di luar rentang ditolak 400
  const badId = await fetch(`${BASE_URL}/penguji/ujian/idak-ada/penilaian`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${pengujiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ nilaiFinal: 90, grade: 'A' })
  });
  const badRange = await fetch(`${BASE_URL}/penguji/ujian/uj-pgj-1/penilaian`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${pengujiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ nilaiFinal: 250, grade: 'A' })
  });
  assert(badId.status === 404, '#10a Penilaian untuk ID ujian tidak ada ditolak (404)', `HTTP ${badId.status}`);
  assert(badRange.status === 400, '#10b Nilai di luar rentang 0-100 ditolak (400)', `HTTP ${badRange.status}`);

  // Verifikasi otorisasi sah tetap berjalan (admin dapat unduh dokumen resmi dengan token)
  //
  // Audit 21 Oktober 2026: token SESI tidak lagi diterima di query string.
  // Alur resmi kini memakai TOKEN UNDUHAN berumur pendek yang terikat satu berkas.
  const dlTokenRes = await fetch(`${BASE_URL}/storage/download-token`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'dokumen_resmi', filename: 'Berita_Acara_uji.pdf' })
  });
  const dlTokenJson = await dlTokenRes.json();
  const adminDoc = await fetch(
    dlTokenJson.downloadUrl
      ? `http://localhost:5001${dlTokenJson.downloadUrl}`
      : `${BASE_URL}/storage/files/dokumen_resmi/Berita_Acara_uji.pdf`
  );
  assert(
    adminDoc.status === 404 || adminDoc.status === 200,
    'Regresi: admin dengan token tetap dapat mengakses endpoint dokumen resmi (bukan 401/403)',
    `HTTP ${adminDoc.status}`
  );

  void superToken;

  console.log('\n====================================================');
  console.log(`TOTAL PASS: ${pass} | TOTAL FAIL: ${fail}`);
  console.log(`STATUS: ${fail === 0 ? 'SEMUA PERBAIKAN BUG TERVERIFIKASI' : 'ADA PERBAIKAN YANG GAGAL'}`);
  console.log('====================================================\n');

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Regression suite error:', err.message);
  process.exit(1);
});
