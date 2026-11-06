/**
 * Uji Pemilihan Rubrik & Gerbang Jenis Ujian — SIM-TA FEB UTM
 * Audit 21 Oktober 2026 (temuan P0-1, Putaran Business Process).
 *
 * Memeriksa:
 *   1. Setiap jenis ujian pada data PERSISTENAN terpetakan ke rubrik yang sah
 *      dan ke tahap prasyarat pendaftaran (tidak ada jenis tanpa aturan).
 *   2. D3 memakai rubrik D3_S1 (bukan rubrik kelayakan disertasi).
 *   3. S3 memakai lima rubrik berbeda sesuai jenis ujiannya.
 *   4. Jenis ujian tak dikenal DITANDA sebagai fallback (tidak diam-diam).
 *   5. Kombinasi jenis ujian x jenjang yang tidak berlaku DITOLAK API.
 *
 * Jalankan: node tests/exam_rubric.test.js  (atau npm run test:rubrik)
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  JENIS_UJIAN_TAHAP,
  JENIS_UJIAN_RUBRIK,
  RUBRIK_JENJANG_DEFAULT,
  resolveRubrikContext,
  getTahapPrasyaratUjian,
  normJenisUjian
} from '../server/academic/examRules.js';

const ROOT = path.resolve('.');
const API = 'http://localhost:5001/api';
const PWD = 'UTM-QA-2026!Lab';

let pass = 0;
let fail = 0;
const failures = [];

function check(cond, name, detail = '') {
  if (cond) {
    console.log(`  [LULUS] ${name}${detail ? ` — ${detail}` : ''}`);
    pass++;
  } else {
    console.error(`  [GAGAL] ${name}${detail ? ` — ${detail}` : ''}`);
    fail++;
    failures.push(name);
  }
}

async function loginApi(identifier, password = PWD) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  const j = await r.json().catch(() => ({}));
  return j.token || null;
}

console.log('=== Uji Pemilihan Rubrik & Gerbang Jenis Ujian (P0-1) ===\n');

// ---------------------------------------------------------------------------
// Katalog rubrik resmi di frontend
// ---------------------------------------------------------------------------
const pengujiDataSrc = fs.readFileSync(path.join(ROOT, 'src', 'data', 'pengujiData.js'), 'utf8');
const katalogRubrik = new Set(
  [...pengujiDataSrc.matchAll(/^  ([A-Z0-9_]+): \{\s*$/gm)].map((m) => m[1])
);
console.log(`Katalog rubrik di frontend: ${[...katalogRubrik].join(', ')}\n`);

check(katalogRubrik.size >= 7, 'Katalog rubrik memuat minimal 7 rubrik', `jumlah=${katalogRubrik.size}`);
for (const key of Object.values(RUBRIK_JENJANG_DEFAULT)) {
  check(katalogRubrik.has(key), `Rubrik bawaan "${key}" ada di katalog frontend`);
}

// ---------------------------------------------------------------------------
const db = new DatabaseSync('data/sim_ta_feb_utm.db');
db.exec('PRAGMA busy_timeout = 5000');

const jenisPendaftaran = db
  .prepare('SELECT DISTINCT jenis_ujian FROM pendaftaran_ujian')
  .all()
  .map((r) => r.jenis_ujian);
const jenisUjianExam = db
  .prepare('SELECT DISTINCT jenis_ujian FROM ujian_penguji')
  .all()
  .map((r) => r.jenis_ujian);
const semuaJenis = [...new Set([...jenisPendaftaran, ...jenisUjianExam])].sort();

const templatePerJenjang = {};
for (const j of ['S1', 'S2', 'S3', 'D3']) {
  templatePerJenjang[j] = new Set(
    db.prepare('SELECT kode_tahap FROM tahapan_template WHERE jenjang = ?').all(j).map((r) => r.kode_tahap)
  );
}

console.log(`Jenis ujian pada data: ${semuaJenis.length} (pendaftaran ${jenisPendaftaran.length}, ujian ${jenisUjianExam.length})\n`);

const kombinasiTidakBerlaku = [];

for (const jenis of semuaJenis) {
  const tahapUmum = getTahapPrasyaratUjian(jenis);
  check(tahapUmum !== null, `Jenis ujian "${jenis}" punya gerbang tahap prasyarat`, `tahap=${tahapUmum}`);

  for (const j of ['S1', 'S2', 'S3', 'D3']) {
    const kode = getTahapPrasyaratUjian(jenis, j);
    check(kode !== null, `Jenis ujian "${jenis}" punya aturan pada jenjang ${j}`, `tahap=${kode}`);
    if (kode !== null && !templatePerJenjang[j].has(kode)) {
      kombinasiTidakBerlaku.push(`${jenis} @ ${j}`);
    }
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- Pemeriksaan D3 & S3 ---');
const rubrikD3 = resolveRubrikContext('D3', 'Sidang Tugas Akhir');
check(rubrikD3.rubrikContext === 'D3_S1', 'D3 memakai rubrik D3_S1 (bukan rubrik kelayakan disertasi)', `rubrik=${rubrikD3.rubrikContext}`);
check(rubrikD3.fallback === false, 'D3 tidak ditandai sebagai fallback');

const rubrikS1 = resolveRubrikContext('S1', 'Seminar Proposal Skripsi');
check(rubrikS1.rubrikContext === 'D3_S1', 'S1 memakai rubrik D3_S1', `rubrik=${rubrikS1.rubrikContext}`);

const rubrikS2 = resolveRubrikContext('S2', 'Sidang Tesis Magister');
check(rubrikS2.rubrikContext === 'S2', 'S2 memakai rubrik S2', `rubrik=${rubrikS2.rubrikContext}`);

console.log('\n--- Lima rubrik S3 ---');
const petaS3 = [
  ['Ujian Kualifikasi Doktor', 'S3_KUALIFIKASI'],
  ['Ujian Proposal Disertasi', 'S3_PROPOSAL'],
  ['Ujian Kelayakan (Desk Review)', 'S3_KELAYAKAN'],
  ['Ujian Tertutup Disertasi', 'S3_TERTUTUP'],
  ['Sidang Terbuka & Promosi Doktor', 'S3_TERBUKA']
];
for (const [jenis, harap] of petaS3) {
  const r = resolveRubrikContext('S3', jenis);
  check(r.rubrikContext === harap, `S3 "${jenis}" memakai rubrik ${harap}`, `hasil=${r.rubrikContext} fallback=${r.fallback}`);
  check(r.fallback === false, `S3 "${jenis}" bukan fallback`);
}

console.log('\n--- Perilaku untuk jenis ujian tak dikenal ---');
const takDikenal = resolveRubrikContext('S3', 'Ujian Imajinatif Yang Tidak Ada');
check(takDikenal.fallback === true, 'Jenis ujian tak dikenal DITANDA sebagai fallback (tidak diam-diam)');
check(takDikenal.rubrikContext === 'S3_KELAYAKAN', 'Fallback S3 memakai rubrik bawaan jenjang', `rubrik=${takDikenal.rubrikContext}`);
const takDikenalS1 = resolveRubrikContext('S1', 'Ujian Imajinatif');
check(takDikenalS1.fallback === false, 'S1/D3/S2 tidak memerlukan jenis ujian untuk memilih rubrik', `sumber=${takDikenalS1.sumber}`);

console.log('\n--- Ketahanan input ---');
for (const varian of ['seminar proposal skripsi', 'SEMINAR PROPOSAL SKRIPSI', '  Seminar Proposal Skripsi  ']) {
  const r = resolveRubrikContext('S1', varian);
  check(r.rubrikContext === 'D3_S1', `Varian "${varian}" menghasilkan rubrik yang sama`);
}
check(normJenisUjian('  Seminar   Proposal  ') === 'seminar proposal', 'normalisasi jenis ujian menormalkan spasi ganda');

console.log('\n--- Konsistensi dengan katalog frontend ---');
for (const [jenis, rubrik] of Object.entries(JENIS_UJIAN_RUBRIK)) {
  check(katalogRubrik.has(rubrik), `Rubrik "${rubrik}" (untuk "${jenis}") ada di katalog`);
}

console.log('\n--- Keberadaan tahap prasyarat pada template ---');
const tahapAda = new Set(
  db.prepare('SELECT DISTINCT kode_tahap FROM tahapan_template').all().map((r) => r.kode_tahap)
);
for (const [jenis, kode] of Object.entries(JENIS_UJIAN_TAHAP)) {
  check(tahapAda.has(kode), `Tahap prasyarat "${kode}" (untuk "${jenis}") ada di template tahapan`);
}

// ---------------------------------------------------------------------------
// Uji API: kombinasi jenis ujian yang tidak berlaku untuk jenjang mahasiswa
// WAJIB ditolak (bukan lolos tanpa gerbang).
// ---------------------------------------------------------------------------
console.log('\n--- Uji API: jenis ujian tidak berlaku untuk program studi ---');

const tokenSA = await loginApi('197405102000031001');
check(Boolean(tokenSA), 'Login superadmin untuk menyiapkan akun uji');

const tokenKoor = await loginApi('197802142003122001');
check(Boolean(tokenKoor), 'Login koordinator program studi untuk menyiapkan Tugas Akhir akun uji');

/** Membuat entri Tugas Akhir (agar tahapan jenjang terbentuk untuk akun uji). */
async function buatTugasAkhir(nim, nama, jenjang, prodi) {
  const res = await fetch(`${API}/akademik/tugas-akhir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenKoor}` },
    body: JSON.stringify({ nim, namaMahasiswa: nama, jenjang, prodi, judul: 'Uji gerbang jenis ujian' })
  });
  const body = await res.json().catch(() => ({}));
  return body?.data?.id || null;
}

const dibuat = [];

async function buatAkunUji(nim, jenjang, prodi) {
  const res = await fetch(`${API}/superadmin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenSA}` },
    body: JSON.stringify({
      nomorInduk: nim,
      nama: `Uji Rubrik ${jenjang}`,
      email: `${nim}@student.trunojoyo.ac.id`,
      role: 'mahasiswa',
      jenjang,
      prodi
    })
  });
  const body = await res.json().catch(() => ({}));
  dibuat.push(body?.data?.id);
  return body?.temporaryPassword || null;
}

const STAMP = String(Date.now()).slice(-9);
const NIM_D3 = `1999${STAMP}1`;
const NIM_S2 = `1999${STAMP}2`;

for (const [label, nim, jenjang, prodi, jenisUjian] of [
  ['D3', NIM_D3, 'D3', 'D-3 Manajemen Perbankan & Keuangan', 'Sidang Tesis Magister'],
  ['S2', NIM_S2, 'S2', 'S-2 Magister Manajemen', 'Seminar Proposal Skripsi']
]) {
  const sandi = await buatAkunUji(nim, jenjang, prodi);
  check(Boolean(sandi), `Akun uji ${label} dibuat (kata sandi sementara terbit)`);
  if (!sandi) continue;

  const tokenMhs = await loginApi(nim, sandi);
  check(Boolean(tokenMhs), `Mahasiswa uji ${label} dapat login`, `nim=${nim}`);
  if (!tokenMhs) continue;

  // Entri Tugas Akhir wajib ada agar gerbang jenis ujian ikut terperiksa.
  const taId = await buatTugasAkhir(nim, `Uji Rubrik ${label}`, label, prodi);
  check(Boolean(taId), `Entri Tugas Akhir untuk mahasiswa uji ${label} dibuat`, `id=${taId}`);
  if (!taId) continue;

  const res = await fetch(`${API}/admin/verifikasi-berkas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenMhs}` },
    body: JSON.stringify({
      nim,
      namaMahasiswa: `Uji Rubrik ${label}`,
      jenjang,
      programStudi: prodi,
      jenisUjian,
      judul: 'Uji jenis ujian tidak berlaku',
      berkasList: []
    })
  });
  const body = await res.json().catch(() => ({}));
  check(
    res.status === 409 && body.code === 'EXAM_TYPE_NOT_APPLICABLE',
    `Mahasiswa ${label} DITOLAK mendaftar "${jenisUjian}" (tidak berlaku untuk program studinya)`,
    `status=${res.status} code=${body.code}`
  );

  // Pendaftaran yang SESUAI untuk jenjangnya boleh lewat ke gerbang tahapan
  // (tolak karena tahapan, bukan karena jenis ujian).
  const jenisSesuai = label === 'D3' ? 'Sidang Portofolio Bisnis' : 'Sidang Tesis Magister';
  const res2 = await fetch(`${API}/admin/verifikasi-berkas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenMhs}` },
    body: JSON.stringify({
      nim,
      namaMahasiswa: `Uji Rubrik ${label}`,
      jenjang,
      programStudi: prodi,
      jenisUjian: jenisSesuai,
      judul: 'Uji jenis ujian sesuai',
      berkasList: []
    })
  });
  const body2 = await res2.json().catch(() => ({}));
  check(
    body2.code !== 'EXAM_TYPE_NOT_APPLICABLE',
    `Mahasiswa ${label} TIDAK ditolak karena jenis ujian untuk "${jenisSesuai}"`,
    `code=${body2.code} status=${res2.status}`
  );
}

// Uji: upsert akun yang sudah ada tidak boleh melaporkan kata sandi
// sementara yang TIDAK berlaku.
console.log('\n--- Uji upsert akun yang sudah ada ---');
{
  const nimUji = `1999${STAMP}3`;
  const sandiAwal = 'Uji-Awal-2026!';
  const buat1 = await fetch(`${API}/superadmin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenSA}` },
    body: JSON.stringify({
      nomorInduk: nimUji,
      nama: 'Uji Upsert',
      email: `${nimUji}@student.trunojoyo.ac.id`,
      role: 'mahasiswa',
      jenjang: 'S1',
      prodi: 'S-1 Manajemen',
      password: sandiAwal
    })
  });
  const b1 = await buat1.json().catch(() => ({}));
  dibuat.push(b1?.data?.id);
  check(buat1.status === 200 || buat1.status === 201, 'Akun uji upsert pertama dibuat', `status=${buat1.status}`);

  const buat2 = await fetch(`${API}/superadmin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenSA}` },
    body: JSON.stringify({
      nomorInduk: nimUji,
      nama: 'Uji Upsert (Diperbarui)',
      email: `${nimUji}@student.trunojoyo.ac.id`,
      role: 'mahasiswa',
      jenjang: 'S1',
      prodi: 'S-1 Manajemen'
    })
  });
  const b2 = await buat2.json().catch(() => ({}));
  check(
    b2.temporaryPassword === undefined,
    'Upsert akun yang sudah ada TIDAK melaporkan temporaryPassword yang tidak berlaku',
    `temporaryPassword=${b2.temporaryPassword === undefined ? 'undefined' : 'ADA (bermasalah)'}`
  );
  check(
    typeof b2.message === 'string' && b2.message.includes('Reset Kata Sandi'),
    'Pesan mengarahkan administrator memakai Reset Kata Sandi',
    b2.message ? b2.message.slice(0, 80) : '(tidak ada pesan)'
  );

  const tokenLama = await loginApi(nimUji, sandiAwal);
  check(Boolean(tokenLama), 'Kata sandi lama tetap berlaku setelah upsert (tidak diam-diam diganti)');
}

// Bersihkan akun uji
for (const id of dibuat) {
  if (!id) continue;
  await fetch(`${API}/superadmin/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenSA}` }
  });
}

db.close();

console.log(`\nKombinasi jenis-ujian x jenjang yang TIDAK berlaku (harus ditolak route): ${kombinasiTidakBerlaku.length}`);
for (const k of kombinasiTidakBerlaku) console.log(`  - ${k}`);

console.log(`\n====================================================`);
console.log(`HASIL UJI RUBRIK: ${pass} LULUS | ${fail} GAGAL`);
if (failures.length) {
  console.log('Pemeriksaan yang gagal:');
  for (const f of failures) console.log(`  - ${f}`);
}
console.log('====================================================\n');
process.exit(fail > 0 ? 1 : 0);
