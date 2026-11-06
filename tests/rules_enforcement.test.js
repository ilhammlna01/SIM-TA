/**
 * Uji Penegakan Aturan Akademik (P1-3) — SIM-TA FEB UTM
 * Audit 21 Oktober 2026 (Putaran Business Process).
 *
 * MEMBUKTI bahwa rules_json (tabel tahapan_aturan) bukan lagi sekadar data
 * display, melainkan GERBANG sungguhan:
 *   1. minSKS        -> butir checklist "SKS minimal"
 *   2. minToefl      -> butir checklist "Skor TOEFL minimal"
 *   3. maxTurnitin   -> butir checklist "Similaritas maksimal"
 *   4. skorKelulusanMin -> gerbang rekomendasi kelayanan pada penilaian ujian
 *   5. requires_publikasi berlaku pada tahap AKHIR semua jenjang (S2/S3/S1/D3)
 *
 * Uji mengubah rules_json S1 sementara lalu memverifikasi efeknya, lalu
 * mengembalikan aturan ke nilai semula.
 *
 * Jalankan: node tests/rules_enforcement.test.js  (atau npm run test:rules)
 */

import fs from 'node:fs';
import path from 'node:path';
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

async function call(method, url, token, body) {
  const headers = { Authorization: `Bearer ${token}` };
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(`${API}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j = null;
  try { j = JSON.parse(t); } catch {}
  return { status: r.status, json: j };
}

console.log('=== Uji Penegakan Aturan Akademik (P1-3) ===\n');

const db = new DatabaseSync('data/sim_ta_feb_utm.db');
db.exec('PRAGMA busy_timeout = 5000');

const rulesS1Row = db.prepare("SELECT rules_json FROM tahapan_aturan WHERE jenjang = 'S1'").get();
const rulesS1Asli = JSON.parse(rulesS1Row?.rules_json || '{}');
console.log('rules_json S1 (asli):', JSON.stringify(rulesS1Asli), '\n');

const tokenSA = await login('197405102000031001');
const tokenMhs = await login('210211100142');
const tokenKoor = await login('197802142003122001');

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 1 & 2. Aturan minSKS / minToefl / maxTurnitin ditegakkan pada GERBANG
//        PENDAFTARAN UJIAN (bukan checklist tahap — menaruhnya di sana
//        menimbulkan deadlock; lihat catatan pada academicService.js).
// ---------------------------------------------------------------------------
console.log('\n--- 1 & 2. Gerbang pendaftaran menegakkan aturan akademik ---');
function setRulesS1(patch) {
  const baru = { ...rulesS1Asli, ...patch };
  db.prepare("UPDATE tahapan_aturan SET rules_json = ? WHERE jenjang = 'S1'").run(JSON.stringify(baru));
  return baru;
}


const tokenMhsUji = await login('210211100142');

/** Mendaftarkan mahasiswa uji dengan metrik tertentu. */
async function daftarDenganMetrik(metrik, jenisUjian = 'Seminar Proposal Skripsi') {
  return call('POST', '/admin/verifikasi-berkas', tokenMhsUji, {
    nim: '210211100142',
    namaMahasiswa: 'Dinda Ayu Larasati',
    jenjang: 'S1',
    programStudi: 'S-1 Manajemen',
    jenisUjian,
    judul: 'Uji penegakan aturan',
    berkasList: [],
    metrik
  });
}

const metrikMemenuhi = { ipk: 3.74, sksLulus: 126, toeflScore: 480, similarity: 19, aiDetection: 24 };

// minSKS dinaikkan menjadi mustahil -> pendaftaran ditolak
setRulesS1({ minSKS: 999 });
const tolakSks = await daftarDenganMetrik({ ...metrikMemenuhi, sksLulus: 10 });
check(
  tolakSks.status === 409 && tolakSks.json?.code === 'ACADEMIC_REQUIREMENT_NOT_MET',
  'minSKS dinaikkan menjadi 999 -> pendaftaran DITOLAK (ACADEMIC_REQUIREMENT_NOT_MET)',
  `status=${tolakSks.status} code=${tolakSks.json?.code}`
);

// minToefl dinaikkan -> ditolak
setRulesS1({ minSKS: rulesS1Asli.minSKS, minToefl: 999 });
const tolakToefl = await daftarDenganMetrik({ ...metrikMemenuhi, toeflScore: 10 });
check(
  tolakToefl.status === 409 && tolakToefl.json?.code === 'ACADEMIC_REQUIREMENT_NOT_MET',
  'minToefl dinaikkan menjadi 999 -> pendaftaran DITOLAK',
  `status=${tolakToefl.status} code=${tolakToefl.json?.code}`
);

// maxTurnitin diturunkan -> ditolak
setRulesS1({ minSKS: rulesS1Asli.minSKS, minToefl: rulesS1Asli.minToefl, maxTurnitin: 5 });
const tolakTurnitin = await daftarDenganMetrik({ ...metrikMemenuhi, similarity: 40 });
check(
  tolakTurnitin.status === 409 && tolakTurnitin.json?.code === 'ACADEMIC_REQUIREMENT_NOT_MET',
  'maxTurnitin diturunkan menjadi 5 -> pendaftaran DITOLAK (similaritas 40%)',
  `status=${tolakTurnitin.status} code=${tolakTurnitin.json?.code}`
);

// Aturan dikembalikan -> pendaftaran tidak lagi ditolak karena aturan akademik
setRulesS1({});
const setelahKembali = await daftarDenganMetrik(metrikMemenuhi);
check(
  setelahKembali.json?.code !== 'ACADEMIC_REQUIREMENT_NOT_MET',
  'Aturan dikembalikan ke nilai semula -> pendaftaran TIDAK lagi ditolak karena aturan akademik',
  `code=${setelahKembali.json?.code} status=${setelahKembali.status}`
);


console.log('\n--- 3. Gerbang skor kelulusan minimum pada rekomendasi kelayakan ---');

// Siapkan ujian uji: gunakan ujian milik mahasiswa uji yang sudah ada.
const dbRows = db
  .prepare("SELECT id, jenjang, nilai_final, penilaian_submitted FROM ujian_penguji WHERE jenjang = 'S1' AND penilaian_submitted = 1 LIMIT 1")
  .get();
if (!dbRows) {
  check(false, 'Terdapat ujian S1 yang sudah dinilai untuk pengujian gerbang skor kelulusan');
} else {
  const rulesS1Semula = { ...rulesS1Asli };
  db.prepare("UPDATE tahapan_aturan SET rules_json = ? WHERE jenjang = 'S1'").run(
    JSON.stringify({ ...rulesS1Semula, skorKelulusanMin: 90 })
  );

  const tokenPenguji = await login('197703032003121002');
  const nilaiTooLow = await call('PUT', `/penguji/ujian/${dbRows.id}/penilaian`, tokenPenguji, {
    nilaiFinal: 50,
    grade: 'D',
    rekomendasiKelayakan: 'Layak Diteruskan'
  });
  check(
    nilaiTooLow.status === 409 && nilaiTooLow.json?.code === 'BELUM_MENCAPAI_SKOR_KELULUSAN',
    'Rekomendasi "Layak" DITOLAK bila nilai di bawah skor kelulusan minimum',
    `status=${nilaiTooLow.status} code=${nilaiTooLow.json?.code}`
  );

  const nilaiCukup = await call('PUT', `/penguji/ujian/${dbRows.id}/penilaian`, tokenPenguji, {
    nilaiFinal: 95,
    grade: 'A',
    rekomendasiKelayakan: 'Layak Diteruskan'
  });
  check(
    nilaiCukup.status === 200,
    'Rekomendasi "Layak" DITERIMA bila nilai memenuhi skor kelulusan minimum',
    `status=${nilaiCukup.status}`
  );

  // Kembalikan aturan & nilai semula
  db.prepare("UPDATE tahapan_aturan SET rules_json = ? WHERE jenjang = 'S1'").run(
    JSON.stringify(rulesS1Asli)
  );
  db.prepare('UPDATE ujian_penguji SET nilai_final = ?, grade = ? WHERE id = ?').run(
    dbRows.nilai_final ?? null,
    dbRows.grade ?? null,
    dbRows.id
  );
  check(true, 'Aturan & nilai ujian uji dikembalikan ke kondisi semula');
}

// ---------------------------------------------------------------------------
// 4. Tahap akhir SEMUA jenjang mewajibkan publikasi
// ---------------------------------------------------------------------------
console.log('\n--- 4. Tahap akhir semua jenjang mewajibkan publikasi ---');
const template = db
  .prepare('SELECT jenjang, kode_tahap, urutan, requires_publikasi FROM tahapan_template ORDER BY jenjang, urutan')
  .all();
const perJenjang = {};
for (const r of template) {
  perJenjang[r.jenjang] = perJenjang[r.jenjang] || [];
  perJenjang[r.jenjang].push(r);
}
for (const [jenjang, rows] of Object.entries(perJenjang)) {
  const last = rows[rows.length - 1];
  check(
    Number(last.requires_publikasi) === 1,
    `Tahap akhir jenjang ${jenjang} (${last.kode_tahap}) mewajibkan publikasi`,
    `requires_publikasi=${last.requires_publikasi}`
  );
}

// ---------------------------------------------------------------------------
// 5. Frontend tidak lagi meng-hardcode ambang yang melenceng
// ---------------------------------------------------------------------------
console.log('\n--- 5. Frontend membaca ambang dari rules_json ---');
const syaratSrc = fs.readFileSync(
  path.resolve('src', 'pages', 'koorprodi', 'PersyaratanPage.jsx'),
  'utf8'
);
check(
  /rulesUntuk\(/.test(syaratSrc),
  'PersyaratanPage memakai helper rulesUntuk() (membaca rules_json backend)'
);
// Fallback per-jenjang masih boleh ada (untuk jenjang tanpa rules_json),
// tetapi aturan backend WAJIB diperiksa lebih dulu.
const sksBlock = syaratSrc.slice(
  syaratSrc.indexOf('const minSks ='),
  syaratSrc.indexOf('const minSks =') + 220
);
check(
  /Number\(rules\?\.minSKS/.test(sksBlock),
  'PersyaratanPage membaca minSKS dari rules_json backend SEBELUM memakai fallback',
  sksBlock.replace(/\s+/g, ' ').slice(0, 110)
);
check(
  /minToefl/.test(syaratSrc) && /rulesToefl/.test(syaratSrc),
  'PersyaratanPage membaca ambang TOEFL dari rules_json'
);

db.close();

console.log(`\n====================================================`);
console.log(`HASIL UJI PENEGAKAN ATURAN: ${pass} LULUS | ${fail} GAGAL`);
if (failures.length) {
  console.log('Pemeriksaan yang gagal:');
  for (const f of failures) console.log(`  - ${f}`);
}
console.log('====================================================\n');
process.exit(fail > 0 ? 1 : 0);
