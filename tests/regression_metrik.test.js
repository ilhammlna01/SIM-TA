/**
 * Regression Test — Fitur Metrik Verifikasi Akademik
 *
 * Memverifikasi bahwa data verifikasi yang diisikan mahasiswa saat mengunggah
 * berkas persyaratan (IPK, SKS lulus, TOEFL, similarity Turnitin, AI detection,
 * nomor & tanggal sertifikat) tersimpan dengan benar, tervalidasi (sanitasi),
 * dan dapat dibaca kembali oleh Admin Akademik untuk verifikasi.
 *
 * Jalankan: node tests/regression_metrik.test.js   (server harus aktif di :5001)
 */

import { DatabaseSync } from 'node:sqlite';
import { TEST_PASSWORD, ensureTestAccounts } from './helpers/testAccounts.js';

const BASE_URL = 'http://localhost:5001/api';
const DB_PATH = 'data/sim_ta_feb_utm.db';
const MARK = `METRIKTEST-${Date.now()}`;

let pass = 0;
let fail = 0;
function assert(cond, name, detail = '') {
  if (cond) { console.log(`  PASS  ${name}`); if (detail) console.log(`        -> ${detail}`); pass++; }
  else { console.error(`  FAIL  ${name}`); if (detail) console.error(`        -> ${detail}`); fail++; }
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

const H = (t) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

async function post(url, token, body) {
  const res = await fetch(`${BASE_URL}${url}`, { method: 'POST', headers: H(token), body: JSON.stringify(body) });
  let json = {};
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
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
  console.log('REGRESSION TEST — METRIK VERIFIKASI AKADEMIK');
  console.log('====================================================\n');

  const db = new DatabaseSync(DB_PATH);
  const mhsToken = await login('210211100142');       // Dinda (S1)
  const adminToken = await login('198104122008121002'); // Admin Akademik

  const createdIds = [];

  // ---------- 1. Simpan metrik lengkap & valid ----------
  console.log('--- 1. Simpan metrik (semua field valid) ---');
  const metrikLengkap = {
    ipk: 3.74, sksLulus: 126, toeflScore: 487,
    similarity: 18, aiDetection: 22,
    sertifikatNo: 'NO.SK-PLAG-S1/FEB-UTM/10/2026', sertifikatTgl: '2026-10-10'
  };
  let r = await post('/admin/verifikasi-berkas', mhsToken, {
    nim: '210211100142',
    namaMahasiswa: 'Dinda Ayu Larasati',
    jenjang: 'S1',
    programStudi: 'S1 Manajemen',
    jenisUjian: MARK,
    judul: 'Uji Metrik',
    berkasList: [{ id: 'krs_s1_takt', nama: 'Transkrip', file: 'tr.pdf', status: 'Menunggu Verifikasi' }],
    metrik: metrikLengkap
  });
  assert(r.status === 201 && r.json.success === true, '1a. POST verifikasi-berkas dengan metrik -> 201', `HTTP ${r.status}`);
  const newId = r.json.data?.id;
  if (newId) createdIds.push(newId);

  const row = db.prepare('SELECT metrik_akademik_json FROM pendaftaran_ujian WHERE id = ?').get(newId);
  const saved = row ? JSON.parse(row.metrik_akademik_json) : null;
  assert(!!saved, '1b. metrik_akademik_json tersimpan di basis data');
  assert(saved && saved.ipk === 3.74 && saved.sksLulus === 126 && saved.toeflScore === 487, '1c. IPK/SKS/TOEFL tersimpan sesuai', JSON.stringify(saved));
  assert(saved && saved.similarity === 18 && saved.aiDetection === 22, '1d. Similarity & AI detection tersimpan');
  assert(saved && saved.sertifikatNo === 'NO.SK-PLAG-S1/FEB-UTM/10/2026' && saved.sertifikatTgl === '2026-10-10', '1e. Nomor & tanggal sertifikat tersimpan');

  // Metrik juga disisipkan ke item berkas terkait
  const berkasRow = db.prepare('SELECT berkas_json FROM pendaftaran_ujian WHERE id = ?').get(newId);
  const berkasList = JSON.parse(berkasRow.berkas_json || '[]');
  assert(berkasList[0]?.metrik?.ipk === 3.74, '1f. Metrik tersisip pada item berkas (berkasList[0].metrik)');

  // ---------- 2. Sanitasi nilai di luar rentang ----------
  console.log('\n--- 2. Sanitasi nilai tidak valid (di luar rentang) ---');
  r = await post('/admin/verifikasi-berkas', mhsToken, {
    nim: '210211100142',
    namaMahasiswa: 'Dinda Ayu Larasati',
    jenisUjian: MARK,
    berkasList: [{ id: 'turnitin_s1_takt', nama: 'Turnitin', file: 'tt.pdf' }],
    metrik: { ipk: 9.9, sksLulus: 9999, similarity: 150, aiDetection: -5, toeflScore: 900, sertifikatNo: '' }
  });
  assert(r.status === 409, '2a. POST dengan metrik tidak valid DITOLAK (ACADEMIC_REQUIREMENT_NOT_MET)', `status=${r.status} code=${r.json?.code}`);
  const badId = r.json.data?.id;
  if (badId) createdIds.push(badId);
    const badRow = badId ? db.prepare('SELECT metrik_akademik_json FROM pendaftaran_ujian WHERE id = ?').get(badId) : null;
  assert(!db.prepare('SELECT 1 FROM pendaftaran_ujian WHERE nim = ? AND id = ?').get('210211100142', badId || 'x'), '2b. Tidak ada baris pendaftaran tersimpan untuk metrik tidak valid', 'penyimpanan ditolak');

  // Metrik sebagian valid: hanya yang valid disimpan
  r = await post('/admin/verifikasi-berkas', mhsToken, {
    nim: '210211100142',
    namaMahasiswa: 'Dinda Ayu Larasati',
    jenisUjian: MARK,
    berkasList: [{ id: 'x', nama: 'X', file: 'x.pdf' }],
      metrik: { ipk: 3.5, sksLulus: 126, toeflScore: 480, similarity: 15, aiDetection: 200 }
  });
  const partialId = r.json.data?.id;
  if (partialId) createdIds.push(partialId);
    const partialRow = partialId ? db.prepare('SELECT metrik_akademik_json FROM pendaftaran_ujian WHERE id = ?').get(partialId) : null;
    const partial = partialRow ? JSON.parse(partialRow.metrik_akademik_json || '{}') : {};
    assert(r.status === 201 && partial.ipk === 3.5 && partial.similarity === 15 && partial.aiDetection === undefined, '2c. Hanya field valid yang disimpan (ipk & similarity ada; aiDetection di luar rentang dibuang)', 'status=' + r.status);

  // ---------- 3. Admin membaca kembali metrik ----------
  console.log('\n--- 3. Admin membaca kembali metrik untuk verifikasi ---');
  const listRes = await fetch(`${BASE_URL}/admin/verifikasi-berkas`, { headers: { Authorization: `Bearer ${adminToken}` } });
  const listJson = await listRes.json();
  assert(listRes.status === 200 && Array.isArray(listJson.data), '3a. GET verifikasi-berkas -> 200 array');
  const found = (listJson.data || []).find((v) => v.id === newId);
  assert(!!found, '3b. Rekam dengan metrik ditemukan di daftar admin');
  assert(found && found.metrikAkademik && found.metrikAkademik.ipk === 3.74, '3c. Admin menerima metrikAkademik (IPK 3.74)', JSON.stringify(found?.metrikAkademik));

  // ---------- 4. Mahasiswa tidak berwenang mengakses daftar admin ----------
  console.log('\n--- 4. Kontrol akses ---');
  const forbidden = await fetch(`${BASE_URL}/admin/verifikasi-berkas`, { headers: { Authorization: `Bearer ${mhsToken}` } });
  assert(forbidden.status === 403, '4a. Mahasiswa GET daftar verifikasi admin -> 403', `HTTP ${forbidden.status}`);

  // ---------- Pembersihan ----------
  console.log('\n--- Pembersihan data uji ---');
  let cleaned = 0;
  for (const id of createdIds) {
    cleaned += db.prepare('DELETE FROM pendaftaran_ujian WHERE id = ?').run(id).changes;
  }
  console.log(`  Dibersihkan: ${cleaned} baris pendaftaran_ujian`);

  console.log('\n====================================================');
  console.log(`TOTAL PASS: ${pass} | TOTAL FAIL: ${fail}`);
  console.log(`STATUS: ${fail === 0 ? 'FITUR METRIK TERVERIFIKASI' : 'ADA VERIFIKASI YANG GAGAL'}`);
  console.log('====================================================\n');

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Regression metrik suite error:', err.message);
  process.exit(1);
});
