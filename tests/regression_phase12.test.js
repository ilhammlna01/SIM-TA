/**
 * Regression Test — Fase 1 & Fase 2 (SIM-TA FEB UTM)
 *
 * FASE 1: memverifikasi aksi yang dulu "frontend-only" kini benar-benar TERSIMPAN
 *         ke basis data (bimbingan, naskah, publikasi, approve tahap, plotting, kuota).
 * FASE 2: memverifikasi kontrak API — validasi masukan (400), sumber daya tak ada (404),
 *         dan konflik duplikat (409) — bukan lagi 500.
 *
 * Jalankan: node tests/regression_phase12.test.js   (server harus aktif di :5001)
 */

import { DatabaseSync } from 'node:sqlite';
import { TEST_PASSWORD, ensureTestAccounts } from './helpers/testAccounts.js';

const BASE_URL = 'http://localhost:5001/api';
const DB_PATH = 'data/sim_ta_feb_utm.db';
const MARK = `REGTEST-${Date.now()}`;

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

const H = (t, json = false) => (json ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { Authorization: `Bearer ${t}` });

async function status(url, method, token, body) {
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: H(token, !!body),
    body: body ? JSON.stringify(body) : undefined
  });
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
  console.log('REGRESSION TEST — FASE 1 (PERSISTENSI) & FASE 2 (KONTRAK API)');
  console.log('====================================================\n');

  const db = new DatabaseSync(DB_PATH);

  const mhsToken = await login('210211100142');        // Dinda (S1)
  const dosenToken = await login('196201081987032001'); // Iriani (pembimbing)
  const koorToken = await login('197802142003122001');  // Siti Aminah
  const adminToken = await login('198104122008121002'); // Ahmad Fauzi
  const superToken = await login('197405102000031001'); // Supriyanto

  // =========================================================
  // BAGIAN A — KONTRAK API (FASE 2): 400 / 404 / 409
  // =========================================================
  console.log('--- BAGIAN A: Kontrak API (validasi, not-found, konflik) ---');

  let r = await status('/superadmin/prodi', 'POST', superToken, { namaProdi: 'Tanpa Kode' });
  assert(r.status === 400, 'A1 POST /prodi tanpa kode -> 400', `HTTP ${r.status}`);

  r = await status('/superadmin/prodi', 'POST', superToken, { kodeProdi: '61201', namaProdi: 'Duplikat', jenjang: 'S1' });
  assert(r.status === 409, 'A2 POST /prodi kode duplikat (61201) -> 409', `HTTP ${r.status} | ${r.json.message}`);

  r = await status('/superadmin/prodi/prodi-tidak-ada', 'PUT', superToken, { kodeProdi: 'X', namaProdi: 'X', jenjang: 'S1' });
  assert(r.status === 404, 'A3 PUT /prodi/:id tidak ada -> 404', `HTTP ${r.status}`);

  r = await status('/superadmin/kuota/dosen-tidak-ada', 'PUT', superToken, { kuotaUtama: 5, kuotaPendamping: 5 });
  assert(r.status === 404, 'A4 PUT /kuota/:id tidak ada -> 404', `HTTP ${r.status}`);

  r = await status('/superadmin/kuota/dosen-pribanus', 'PUT', superToken, { kuotaUtama: 'abc', kuotaPendamping: 5 });
  assert(r.status === 400, 'A5 PUT /kuota non-angka -> 400', `HTTP ${r.status}`);

  r = await status('/superadmin/tahapan/S9', 'PUT', superToken, { rules: { a: 1 } });
  assert(r.status === 404, 'A6 PUT /tahapan/:jenjang tak dikenal -> 404', `HTTP ${r.status}`);

  r = await status('/superadmin/users/usr-tidak-ada', 'PUT', superToken, { nama: 'X' });
  assert(r.status === 404, 'A7 PUT /users/:id tidak ada -> 404', `HTTP ${r.status}`);

  r = await status('/superadmin/users/usr-tidak-ada', 'DELETE', superToken);
  assert(r.status === 404, 'A8 DELETE /users/:id tidak ada -> 404', `HTTP ${r.status}`);

  r = await status('/admin/sk', 'POST', adminToken, { jenisSK: 'SK Pembimbing' });
  assert(r.status === 400, 'A9 POST /admin/sk tanpa nomor -> 400', `HTTP ${r.status}`);

  r = await status('/admin/verifikasi-berkas/reg-tidak-ada', 'PUT', adminToken, { statusVerifikasi: 'Disetujui' });
  assert(r.status === 404, 'A10 PUT /admin/verifikasi-berkas/:id tidak ada -> 404', `HTTP ${r.status}`);

  r = await status('/admin/verifikasi-berkas/berkas-s3-01', 'PUT', adminToken, {});
  assert(r.status === 400, 'A11 PUT /admin/verifikasi-berkas tanpa status -> 400', `HTTP ${r.status}`);

  r = await status('/admin/jadwal-tahapan/jadwal-tidak-ada', 'PUT', adminToken, { status: 'Aktif' });
  assert(r.status === 404, 'A12 PUT /admin/jadwal-tahapan/:id tidak ada -> 404', `HTTP ${r.status}`);

  r = await status('/admin/jadwal-tahapan/jadwal-tidak-ada', 'DELETE', adminToken);
  assert(r.status === 404, 'A13 DELETE /admin/jadwal-tahapan/:id tidak ada -> 404', `HTTP ${r.status}`);

  r = await status('/superadmin/prodi', 'POST', mhsToken, { kodeProdi: 'ZZZ', namaProdi: 'X', jenjang: 'S1' });
  assert(r.status === 403, 'A14 RBAC: mahasiswa POST /prodi -> 403', `HTTP ${r.status}`);

  // =========================================================
  // BAGIAN B — PERSISTENSI (FASE 1)
  // =========================================================
  console.log('\n--- BAGIAN B: Persistensi aksi (Fase 1) ---');

  // B1. Mahasiswa mencatat sesi bimbingan -> tersimpan di bimbingan_log
  const bimBefore = db.prepare('SELECT count(*) c FROM bimbingan_log').get().c;
  r = await status('/akademik/bimbingan', 'POST', mhsToken, { topik: MARK, catatan: 'uji regresi' });
  const bimAfter = db.prepare('SELECT count(*) c FROM bimbingan_log').get().c;
  assert(r.status === 201 && bimAfter === bimBefore + 1, 'B1 Mahasiswa catat bimbingan tersimpan (bimbingan_log +1)', `HTTP ${r.status}, ${bimBefore}->${bimAfter}`);

  // B2. Dosen (pembimbing) mencatat sesi untuk mahasiswa bimbingannya -> tersimpan
  const advisee = db.prepare(`SELECT nim FROM tugas_akhir WHERE pembimbing_utama LIKE '%Iriani%' OR pembimbing_pendamping LIKE '%Iriani%' LIMIT 1`).get();
  const bimBefore2 = db.prepare('SELECT count(*) c FROM bimbingan_log').get().c;
  r = await status('/akademik/bimbingan', 'POST', dosenToken, { nim: advisee?.nim, topik: MARK, catatan: 'uji regresi dosen' });
  const bimAfter2 = db.prepare('SELECT count(*) c FROM bimbingan_log').get().c;
  assert(r.status === 201 && bimAfter2 === bimBefore2 + 1, 'B2 Dosen pembimbing catat bimbingan mahasiswa bimbingannya tersimpan', `HTTP ${r.status}, ${bimBefore2}->${bimAfter2}`);

  // B3. Dosen mencatat untuk mahasiswa BUKAN bimbingannya -> 403
  const notAdvisee = db.prepare(`SELECT nim FROM tugas_akhir WHERE (pembimbing_utama IS NULL OR pembimbing_utama NOT LIKE '%Iriani%') AND (pembimbing_pendamping IS NULL OR pembimbing_pendamping NOT LIKE '%Iriani%') LIMIT 1`).get();
  r = await status('/akademik/bimbingan', 'POST', dosenToken, { nim: notAdvisee?.nim, topik: MARK, catatan: 'x' });
  assert(r.status === 403, 'B3 Dosen dilarang mencatat untuk mahasiswa bukan bimbingannya -> 403', `HTTP ${r.status}`);

  // B4. Mahasiswa unggah naskah -> tersimpan (versi bertambah)
  const nvBefore = db.prepare('SELECT count(*) c FROM naskah_versi').get().c;
  r = await status('/akademik/naskah', 'POST', mhsToken, { fileUrl: `regtest-${Date.now()}.pdf`, keterangan: MARK });
  const nvAfter = db.prepare('SELECT count(*) c FROM naskah_versi').get().c;
  assert(r.status === 201 && nvAfter === nvBefore + 1, 'B4 Mahasiswa unggah naskah tersimpan (naskah_versi +1)', `HTTP ${r.status}, ${nvBefore}->${nvAfter}`);

  // B5. Mahasiswa unggah publikasi -> tersimpan
  const pubBefore = db.prepare('SELECT count(*) c FROM publikasi').get().c;
  r = await status('/akademik/publikasi', 'POST', mhsToken, { judul: MARK, jurnal: 'Jurnal Uji', tahun: '2026' });
  const pubAfter = db.prepare('SELECT count(*) c FROM publikasi').get().c;
  assert(r.status === 201 && pubAfter === pubBefore + 1, 'B5 Mahasiswa unggah publikasi tersimpan (publikasi +1)', `HTTP ${r.status}, ${pubBefore}->${pubAfter}`);

  // B6. Dosen menyetujui tahap mahasiswa bimbingannya -> status tahap berubah
  const taId = 'ta-220231600004';
  const stage = db.prepare('SELECT kode_tahap, status FROM tahap_status WHERE tugas_akhir_id = ? ORDER BY urutan ASC LIMIT 1').get(taId);
  const origStageStatus = stage.status;
  db.prepare(`UPDATE tahap_status SET status = 'Menunggu Persetujuan Pembimbing', pembimbing_approved = 0 WHERE tugas_akhir_id = ? AND kode_tahap = ?`).run(taId, stage.kode_tahap);
  r = await status(`/akademik/tugas-akhir/${taId}/tahap/${stage.kode_tahap}/approve`, 'POST', dosenToken, { catatan: 'uji regresi' });
  const stageAfter = db.prepare('SELECT status, pembimbing_approved FROM tahap_status WHERE tugas_akhir_id = ? AND kode_tahap = ?').get(taId, stage.kode_tahap);
  assert(r.status === 200 && stageAfter.pembimbing_approved === 1, 'B6 Dosen setujui tahap tersimpan (pembimbing_approved=1)', `HTTP ${r.status}, status=${stageAfter.status}`);
  db.prepare(`UPDATE tahap_status SET status = ?, pembimbing_approved = 0 WHERE tugas_akhir_id = ? AND kode_tahap = ?`).run(origStageStatus, taId, stage.kode_tahap);

  // B7. Koorprodi menetapkan pembimbing -> tugas_akhir berubah
  const taBefore = db.prepare('SELECT pembimbing_utama, pembimbing_pendamping FROM tugas_akhir WHERE id = ?').get(taId);
  r = await status(`/akademik/tugas-akhir/${taId}/pembimbing`, 'PUT', koorToken, { pembimbingUtama: 'Regtest Pembimbing Utama', pembimbingPendamping: 'Regtest Pendamping' });
  const taAfter = db.prepare('SELECT pembimbing_utama, pembimbing_pendamping FROM tugas_akhir WHERE id = ?').get(taId);
  assert(r.status === 200 && taAfter.pembimbing_utama === 'Regtest Pembimbing Utama', 'B7 Koorprodi tetapkan pembimbing tersimpan', `HTTP ${r.status}`);
  db.prepare('UPDATE tugas_akhir SET pembimbing_utama = ?, pembimbing_pendamping = ? WHERE id = ?').run(taBefore.pembimbing_utama, taBefore.pembimbing_pendamping, taId);

  // B8. Superadmin ubah kuota -> tersimpan
  const kuotaBefore = db.prepare('SELECT kuota_utama, kuota_pendamping FROM kuota_dosen WHERE id = ?').get('dosen-aprilina');
  r = await status('/superadmin/kuota/dosen-aprilina', 'PUT', superToken, { kuotaUtama: 7, kuotaPendamping: 9, status: 'Aman' });
  const kuotaAfter = db.prepare('SELECT kuota_utama, kuota_pendamping FROM kuota_dosen WHERE id = ?').get('dosen-aprilina');
  assert(r.status === 200 && kuotaAfter.kuota_utama === 7 && kuotaAfter.kuota_pendamping === 9, 'B8 Superadmin ubah kuota tersimpan', `HTTP ${r.status}`);
  db.prepare('UPDATE kuota_dosen SET kuota_utama = ?, kuota_pendamping = ? WHERE id = ?').run(kuotaBefore.kuota_utama, kuotaBefore.kuota_pendamping, 'dosen-aprilina');

  // =========================================================
  // PEMBERSIHAN data uji
  // =========================================================
  console.log('\n--- Pembersihan data uji ---');
  const delBim = db.prepare("DELETE FROM bimbingan_log WHERE topik = ?").run(MARK).changes;
  const delNv = db.prepare("DELETE FROM naskah_versi WHERE keterangan = ?").run(MARK).changes;
  const delPub = db.prepare("DELETE FROM publikasi WHERE judul = ?").run(MARK).changes;
  db.prepare("DELETE FROM audit_log WHERE details LIKE ?").run(`%${MARK}%`);
  console.log(`  Dibersihkan: bimbingan=${delBim}, naskah=${delNv}, publikasi=${delPub}`);

  console.log('\n====================================================');
  console.log(`TOTAL PASS: ${pass} | TOTAL FAIL: ${fail}`);
  console.log(`STATUS: ${fail === 0 ? 'FASE 1 & 2 TERVERIFIKASI' : 'ADA VERIFIKASI YANG GAGAL'}`);
  console.log('====================================================\n');

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Regression Fase 1&2 suite error:', err.message);
  process.exit(1);
});
