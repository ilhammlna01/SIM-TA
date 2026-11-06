/**
 * Test Suite Verifikasi Independen Prioritas 5
 * Pembersihan Artefak Produksi, Eliminasi Role Switcher Backdoor, dan Relatif URL Dinamis
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateBeritaAcara } from '../server/documents/pdfGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

const API_BASE = 'http://localhost:5001';

async function runTests() {
  console.log('=== TEST SUITE PRIORITAS 5: Artefak Produksi & Dynamic Relatif URL ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  // 1. Verifikasi Kompilasi Produksi (Dist Bundle)
  console.log('--- 1. Uji Kelengkapan Bundel Produksi ---');
  assert(fs.existsSync(distDir), 'Direktori dist/ hasil kompilasi produksi ditemukan');
  assert(fs.existsSync(path.join(distDir, 'index.html')), 'Berkas dist/index.html ditemukan');
  const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  assert(indexHtml.includes('<div id="root"></div>'), 'Index HTML produksi memuat root element SPA yang valid');

  // 2. Verifikasi Eliminasi Role Switcher Dock dari Antarmuka Produksi
  console.log('\n--- 2. Uji Isolasi Role Switcher Dock & QA Testing (Tree-Shaking) ---');
  const appJsx = fs.readFileSync(path.resolve(rootDir, 'src/App.jsx'), 'utf8');
  assert(
    appJsx.includes('{import.meta.env.DEV && (') && appJsx.includes('<SimulationFloatingDock'),
    'SimulationFloatingDock dibungkus dengan guard compile-time import.meta.env.DEV di src/App.jsx'
  );
  assert(
    appJsx.includes('{import.meta.env.DEV && isQAModalOpen && ('),
    'QATestingModal dibungkus dengan guard compile-time import.meta.env.DEV di src/App.jsx'
  );

  // 3. Verifikasi Dynamic & Relatif API URL di Frontend
  console.log('\n--- 3. Uji Resolusi Relatif API URL ---');
  const apiJs = fs.readFileSync(path.resolve(rootDir, 'src/services/api.js'), 'utf8');
  assert(
    !apiJs.includes("const API_BASE_URL = 'http://localhost:5001/api';"),
    'Hardcoded API_BASE_URL localhost:5001 telah dieliminasi dari src/services/api.js'
  );
  assert(
    apiJs.includes("window.location.port === '5173' ? 'http://localhost:5001/api' : '/api'"),
    'API_BASE_URL otomatis menggunakan path relatif /api pada port produksi & reverse proxy'
  );

  // 4. Verifikasi Dynamic Verification URL di Dokumen Resmi (PDF & QR Code)
  console.log('\n--- 4. Uji Eliminasi Hardcoded Vite Port (5173) di Dokumen Resmi ---');
  const pdfGenJs = fs.readFileSync(path.resolve(rootDir, 'server/documents/pdfGenerator.js'), 'utf8');
  assert(
    !pdfGenJs.includes('http://localhost:5173/verifikasi-dokumen'),
    'Hardcoded port 5173 pada tautan verifikasi QR Code di pdfGenerator.js telah dieliminasi'
  );
  assert(
    pdfGenJs.includes('process.env.APP_PUBLIC_URL'),
    'Tautan verifikasi QR Code membaca konfigurasi APP_PUBLIC_URL atau port aktif server'
  );

  // 5. Verifikasi Dynamic URL di Email Service
  console.log('\n--- 5. Uji Eliminasi Hardcoded Vite Port (5173) di Layanan Email SLA ---');
  const emailServiceJs = fs.readFileSync(path.resolve(rootDir, 'server/notifications/emailService.js'), 'utf8');
  assert(
    !emailServiceJs.includes("url: 'http://localhost:5173/'"),
    'Seluruh tautan tombol action pada template email resmi tidak lagi menggunakan localhost:5173'
  );
  assert(
    emailServiceJs.includes('getAppBaseUrl'),
    'Layanan email menggunakan helper getAppBaseUrl() dinamis sesuai lingkungan deploy'
  );

  // 6. Uji Single-Port Production Serving via HTTP
  console.log('\n--- 6. Uji Layanan Single-Port Production Server (Port 5001) ---');
  try {
    // 6a. Health check API
    const healthRes = await fetch(`${API_BASE}/api/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && (healthJson.status === 'online' || healthJson.status === 'healthy'), 'Endpoint /api/health merespons 200 OK online');

    // 6b. SPA Static File Serving
    const spaRes = await fetch(`${API_BASE}/`);
    const spaText = await spaRes.text();
    assert(spaRes.status === 200 && spaText.includes('<div id="root"></div>'), 'Server Express melayani SPA dist/index.html pada rute root (/)');

    // 6c. SPA Client-Side Routing Fallback
    const routeRes = await fetch(`${API_BASE}/verifikasi-dokumen?code=TEST-CODE`);
    const routeText = await routeRes.text();
    assert(routeRes.status === 200 && routeText.includes('<div id="root"></div>'), 'Rute SPA /verifikasi-dokumen di-fallback dengan benar ke dist/index.html');
  } catch (err) {
    assert(false, `Gagal menghubungi server HTTP: ${err.message}`);
  }

  // 7. Uji Generate PDF dengan URL QR Code Dinamis
  console.log('\n--- 7. Uji Pembuatan Dokumen Berita Acara dengan QR Dinamis ---');
  try {
    // Catatan: sejak remediasi FINDING-03 (parsial), generator dokumen resmi
    // menerima payload TERREKONSILIASI (identitas, nilai, dan dekwan penguji
    // berasal dari SQLite), sehingga bentuk payload bersifat datar.
    const testDoc = await generateBeritaAcara({
      nomorDokumen: 'BA/999/FEB.MAN/X/2026',
      nim: '210211100142',
      namaMahasiswa: 'Dinda Ayu Larasati',
      jenjang: 'S1',
      prodi: 'S-1 Manajemen',
      judul: 'Pengaruh Brand Image terhadap Loyalitas Konsumen',
      tahap: 'Sidang Skripsi',
      ruang: 'Ruang Sidang 2 FEB',
      nilaiFinal: 88.5,
      grade: 'A',
      rekomendasiKelayakan: 'LULUS DENGAN REVISI MINOR',
      pengujiList: [
        { nama: 'Dr. Faidal, S.E., M.M.', peran: 'Ketua Penguji', nilai: 89 }
      ]
    });
    assert(testDoc.success === true, `Dokumen Berita Acara berhasil digenerate (${testDoc.verificationCode})`);
    assert(fs.existsSync(testDoc.filePath), 'Berkas PDF fisik Berita Acara tersimpan di server');
  } catch (pdfErr) {
    assert(false, `Gagal generate dokumen PDF: ${pdfErr.message}`);
  }

  console.log(`\n========================================`);
  console.log(`HASIL TEST PRIORITAS 5: ${passed} / ${total} PENGUJIAN LULUS (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
