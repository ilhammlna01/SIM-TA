/**
 * Test Runner Terpadu — SIM-TA FEB UTM
 *
 * Menjalankan seluruh rangkaian uji:
 *   1. security.test.js            (keamanan & RBAC)
 *   2. uat_workflow.test.js        (alur bisnis ujung-ke-ujung API)
 *   3. regression_bugfix.test.js   (regresi bug audit)
 *   4. regression_audit.test.js    (regresi audit lanjutan)
 *   5. regression_phase12.test.js  (Fase 1 persistensi & Fase 2 kontrak API)
 *   6. regression_release.test.js  (pengerasan rilis: header keamanan, XLSX)
 *   7. regression_metrik.test.js   (fitur metrik akademik)
 *   8. audit_remediation.test.js   (regresi remediasi audit 21 Oktober 2026)
 *   9. feature_verification.test.js (uji verifikasi fitur end-to-end seluruh modul)
 *  10. e2e_browser.test.js         (E2E browser Playwright, 6 peran)
 *  11. e2e_persistence.test.js     (persistensi Penetapan Dewan Penguji & Tahapan TA)
 *  12. business_process.test.js    (gerbang business process mahasiswa)
 *  13. e2e_naskah_approval.test.js (persetujuan naskah oleh pembimbing di UI)
 *  14. exam_rubric.test.js          (pemilihan rubrik & gerbang jenis ujian per jenjang)
 *  15. e2e_lulus_status.test.js      (status kelulusan tampil di dashboard mahasiswa)
 *  16. rules_enforcement.test.js      (rules_json ditegakkan sebagai gerbang)
 *
 * Server API (:5001) dijalankan otomatis bila belum aktif, dan dihentikan kembali
 * setelah seluruh rangkaian selesai (kecuali server memang sudah aktif sebelumnya).
 *
 * Jalankan: npm test   atau   node tests/run_all.mjs
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve('.');
const PORT = 5001;

const SUITES = [
  'tests/security.test.js',
  'tests/uat_workflow.test.js',
  'tests/regression_bugfix.test.js',
  'tests/regression_audit.test.js',
  'tests/regression_phase12.test.js',
  'tests/regression_release.test.js',
  'tests/regression_metrik.test.js',
  'tests/audit_remediation.test.js',
  'tests/feature_verification.test.js',
  'tests/e2e_browser.test.js',
  'tests/e2e_persistence.test.js',
  'tests/business_process.test.js',
  'tests/e2e_naskah_approval.test.js',
  'tests/exam_rubric.test.js',
  'tests/e2e_lulus_status.test.js',
  'tests/rules_enforcement.test.js'
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function isServerUp() {
  try {
    const res = await fetch(`http://localhost:${PORT}/api/health`, { signal: AbortSignal.timeout(2500) });
    return res.ok || res.status === 404; // 404 tetap berarti port melayani
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerUp()) return true;
    await sleep(600);
  }
  return false;
}

function runSuite(file) {
  return new Promise((resolve) => {
    console.log(`\n>>> Menjalankan ${file}`);
    const child = spawn(process.execPath, [file], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, ALLOW_TEST_CREDENTIALS: '1' }
    });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

async function main() {
  let serverProc = null;
  const alreadyUp = await isServerUp();

  if (!alreadyUp) {
    console.log('[runner] Server API belum aktif — menjalankan server sementara...');
    serverProc = spawn(process.execPath, ['server/index.js'], {
      cwd: ROOT,
      stdio: 'ignore',
      env: { ...process.env, ALLOW_TEST_CREDENTIALS: '1' }
    });
    const up = await waitForServer();
    if (!up) {
      console.error('[runner] GAGAL: server tidak siap dalam batas waktu.');
      if (serverProc) serverProc.kill();
      process.exit(1);
    }
    console.log('[runner] Server API siap di :' + PORT);
  } else {
    console.log('[runner] Server API sudah aktif — memakai server yang berjalan.');
  }

  const results = [];
  for (const suite of SUITES) {
    const code = await runSuite(suite);
    results.push({ suite, code, ok: code === 0 });
  }

  if (serverProc) {
    console.log('\n[runner] Menghentikan server sementara...');
    serverProc.kill();
  }

  console.log('\n====================================================');
  console.log('RINGKASAN RANGKAIAN UJI');
  console.log('====================================================');
  for (const r of results) {
    console.log(`  ${r.ok ? 'LULUS' : 'GAGAL'}  ${r.suite}`);
  }
  const failed = results.filter((r) => !r.ok);
  console.log('----------------------------------------------------');
  console.log(`Total suite: ${results.length} | Lulus: ${results.length - failed.length} | Gagal: ${failed.length}`);
  console.log(`STATUS AKHIR: ${failed.length === 0 ? 'SEMUA UJI LULUS' : 'ADA UJI YANG GAGAL'}`);
  console.log('====================================================\n');

  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('[runner] error:', err.message);
  process.exit(1);
});
