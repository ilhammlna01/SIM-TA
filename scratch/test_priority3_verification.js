/**
 * Verification Probe: Remediasi Prioritas 3 (Integritas Naskah & Dokumen Resmi Berbasis Relasi DB)
 * SIM Tugas Akhir FEB UTM
 */

import { db } from '../server/database/db.js';
import { TEST_PASSWORD, ensureTestAccounts, loginUser } from '../tests/helpers/testAccounts.js';

const BASE_URL = 'http://localhost:5001/api';

async function login(identifier, password = TEST_PASSWORD) {
  return loginUser(BASE_URL, identifier, password);
}

async function runPriority3Verification() {
  console.log('================================================================');
  console.log('🧪 VERIFIKASI REMEDIASI PRIORITAS 3 — INTEGRITAS NASKAH & DOKUMEN');
  console.log('================================================================\n');

  const credPrep = ensureTestAccounts();
  if (!credPrep.ok) {
    console.error('Gagal menyiapkan kredensial uji:', credPrep.message);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  function check(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      if (details) console.log(`     ↳ ${details}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (details) console.error(`     ↳ ${details}`);
      failed++;
    }
  }

  // 1. Dapatkan Token untuk Uji
  console.log('1. Autentikasi Pengguna:');
  const dindaToken = await login('210211100142'); // Mahasiswa Dinda
  const pengujiToken = await login('197703032003121002'); // Dr. Faidal (Penguji)
  const adminToken = await login('198104122008121002'); // Admin Pasca
  check(Boolean(dindaToken && pengujiToken && adminToken), 'Token pengguna uji aktif');

  // Pastikan berkas uji fisik ada di folder uploads/naskah agar uji 200/403 murni menguji otorisasi
  import('node:fs').then(fs => {
    import('node:path').then(path => {
      const naskahDir = path.resolve('uploads/naskah');
      if (!fs.existsSync(naskahDir)) fs.mkdirSync(naskahDir, { recursive: true });
      fs.writeFileSync(path.join(naskahDir, 'skripsi_andi.pdf'), '%PDF-1.4 Fake Thesis Content Andi');
      fs.writeFileSync(path.join(naskahDir, 'Proposal_Skripsi_Final_Sempro_Dinda.pdf'), '%PDF-1.4 Dinda Thesis Content');
      fs.writeFileSync(path.join(naskahDir, 'naskah_rahasia_bambang_s3.pdf'), '%PDF-1.4 Bambang S3 Secret');
    });
  });

  // Tunggu sejenak agar berkas siap
  await new Promise(r => setTimeout(r, 200));

  // ----------------------------------------------------
  // TEST 1: Proteksi Naskah Berbasis Relasi DB (FINDING-05)
  // File 'skripsi_andi.pdf' TANPA kata 'bambang'/'rahasia' milik mahasiswa lain (NIM: 210211100099)
  // ----------------------------------------------------
  console.log('\n2. Proteksi Hak Cipta Naskah Berbasis Relasi DB (Bukan Keyword Filter):');
  const dlAndiByDinda = await fetch(`${BASE_URL}/storage/files/naskah/skripsi_andi.pdf`, {
    headers: { 'Authorization': `Bearer ${dindaToken}` }
  });
  check(
    dlAndiByDinda.status === 403,
    'Mahasiswa Dinda DITOLAK (403) mengunduh skripsi_andi.pdf (Milik Andi di storage_files)',
    `HTTP Status: ${dlAndiByDinda.status}`
  );

  const dlBambangByDinda = await fetch(`${BASE_URL}/storage/files/naskah/naskah_rahasia_bambang_s3.pdf`, {
    headers: { 'Authorization': `Bearer ${dindaToken}` }
  });
  check(
    dlBambangByDinda.status === 403,
    'Mahasiswa Dinda DITOLAK (403) mengunduh naskah_rahasia_bambang_s3.pdf (Milik Bambang)',
    `HTTP Status: ${dlBambangByDinda.status}`
  );

  // ----------------------------------------------------
  // TEST 2: Mahasiswa berhak mengunduh naskahnya sendiri
  // ----------------------------------------------------
  const dlDindaSelf = await fetch(`${BASE_URL}/storage/files/naskah/Proposal_Skripsi_Final_Sempro_Dinda.pdf`, {
    headers: { 'Authorization': `Bearer ${dindaToken}` }
  });
  check(
    dlDindaSelf.status === 200,
    'Mahasiswa Dinda DIIZINKAN (200) mengunduh naskah skripsi miliknya sendiri',
    `HTTP Status: ${dlDindaSelf.status}`
  );

  // ----------------------------------------------------
  // TEST 3: Dewan Penguji sah HANYA membaca naskah mahasiswa yang ditugaskan
  //
  // Audit 21 Oktober 2026 (Least Privilege): peran 'dosen'/'penguji' TIDAK
  // lagi mendapat akses blanket ke seluruh naskah. Akses dibatasi pada
  // mahasiswa yang diampu/diangkat sebagai anggota dekwan.
  //   - Dinda (210211100142): Dr. Faidal (197703032003121002) adalah
  //     "Penguji Utama" pada ujian uj-pgj-1 -> HARUS boleh mengunduh.
  //   - Andi (210211100099): tidak ada rekam ujian/TA yang mengaitkan
  //     Dr. Faidal -> HARUS ditolak.
  // ----------------------------------------------------
  const dlDindaByPenguji = await fetch(`${BASE_URL}/storage/files/naskah/Proposal_Skripsi_Final_Sempro_Dinda.pdf`, {
    headers: { 'Authorization': `Bearer ${pengujiToken}` }
  });
  check(
    dlDindaByPenguji.status === 200,
    'Dewan Penguji yang DITUGASKAN mengunduh naskah mahasiswa yang diujinya (200)',
    `HTTP Status: ${dlDindaByPenguji.status}`
  );

  const dlAndiByPenguji = await fetch(`${BASE_URL}/storage/files/naskah/skripsi_andi.pdf`, {
    headers: { 'Authorization': `Bearer ${pengujiToken}` }
  });
  check(
    dlAndiByPenguji.status === 403,
    'Dewan Penguji yang TIDAK ditugaskan DITOLAK (403) mengunduh naskah mahasiswa lain (least privilege)',
    `HTTP Status: ${dlAndiByPenguji.status}`
  );

  const dlAndiByAdmin = await fetch(`${BASE_URL}/storage/files/naskah/skripsi_andi.pdf`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  check(
    dlAndiByAdmin.status === 200,
    'Admin Akademik berwenang penuh tetap dapat mengakses seluruh naskah (200)',
    `HTTP Status: ${dlAndiByAdmin.status}`
  );

  // ----------------------------------------------------
  // TEST 4: Pencegahan Pemalsuan Dokumen Resmi (FINDING-03)
  // Penerbitan Berita Acara untuk Mahasiswa Fiktif DITOLAK
  // ----------------------------------------------------
  console.log('\n3. Pencegahan Pemalsuan Dokumen Resmi & Integritas Nilai (FINDING-03):');
  const fakeBa = await fetch(`${BASE_URL}/documents/generate-berita-acara`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pengujiToken}`
    },
    body: JSON.stringify({
      nim: '999999999999', // NIM Fiktif
      namaMahasiswa: 'Mahasiswa Palsu Gelap',
      nilaiFinal: 100,
      grade: 'A',
      statusKelulusan: 'LULUS DENGAN PUJIAN'
    })
  });
  const fakeBaBody = await fakeBa.json();
  check(
    fakeBa.status === 404 && fakeBaBody.code === 'EXAM_RECORD_NOT_FOUND',
    'Penerbitan Berita Acara untuk mahasiswa fiktif DITOLAK 404 Not Found',
    `HTTP Status: ${fakeBa.status} | Code: ${fakeBaBody.code}`
  );

  // ----------------------------------------------------
  // TEST 5: Penerbitan Berita Acara untuk Ujian yang BELUM Difinalisasi DITOLAK
  // Siapkan data dummy ujian belum selesai
  // ----------------------------------------------------
  db.prepare(`
    INSERT OR REPLACE INTO ujian_penguji (
      id, nim, nama_mahasiswa, jenjang, program_studi, jenis_ujian,
      tanggal_ujian, jam_ujian, ruang, status_ujian, peran_dosen,
      naskah_url, penilaian_submitted, nilai_final
    ) VALUES (
      'uj-pending-1', '210211100142', 'Dinda Ayu Larasati', 'S1', 'S1 Manajemen', 'Sidang Skripsi',
      '2026-10-20', '09:00', 'Ruang 1', 'Menunggu Pelaksanaan', 'Penguji 1',
      'Proposal_Skripsi_Final_Sempro_Dinda.pdf', 0, NULL
    )
  `).run();

  const pendingBa = await fetch(`${BASE_URL}/documents/generate-berita-acara`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pengujiToken}`
    },
    body: JSON.stringify({
      ujianId: 'uj-pending-1',
      nim: '210211100142'
    })
  });
  const pendingBaBody = await pendingBa.json();
  check(
    pendingBa.status === 400 && pendingBaBody.code === 'EXAM_NOT_FINALIZED',
    'Penerbitan Berita Acara untuk ujian yang belum dinilai DITOLAK 400 Bad Request',
    `HTTP Status: ${pendingBa.status} | Code: ${pendingBaBody.code}`
  );

  // ----------------------------------------------------
  // TEST 6: Proteksi Integritas Nilai (Anti Nilai Palsu / Spoofing Nilai Klien)
  // Ujian disubmit nilai 88.0 di database. Klien mengirim nilaiFinal: 99.9.
  // Server WAJIB menggunakan nilai 88.0 dari database, mengabaikan nilai injeksi klien.
  // ----------------------------------------------------
  db.prepare(`
    UPDATE ujian_penguji
    SET penilaian_submitted = 1,
        status_ujian = 'Selesai Dinilai',
        nilai_final = 88.0,
        grade = 'A',
        rekomendasi_kelayakan = 'LULUS REVISI MINOR'
    WHERE id = 'uj-pending-1'
  `).run();

  const spoofScoreBa = await fetch(`${BASE_URL}/documents/generate-berita-acara`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pengujiToken}`
    },
    body: JSON.stringify({
      ujianId: 'uj-pending-1',
      nim: '210211100142',
      nilaiFinal: 99.9, // Injeksi nilai palsu
      grade: 'A+'
    })
  });
  const spoofScoreBody = await spoofScoreBa.json();
  
  // Cek catatan arsip di database
  const archivedDoc = db.prepare('SELECT metadata_json FROM dokumen_arsip WHERE kode_verifikasi = ?').get(spoofScoreBody.data?.verificationCode);
  const archivedMeta = archivedDoc ? JSON.parse(archivedDoc.metadata_json) : {};

  check(
    spoofScoreBa.status === 201 && archivedMeta.nilaiFinal === '88.00',
    'Server menganulir nilai palsu (99.9) dan menegakkan nilai riil database (88.00)',
    `Nilai tercatat di Berita Acara Resmi: ${archivedMeta.nilaiFinal} (Bukan 99.9)`
  );

  console.log('\n================================================================');
  console.log(`📊 REKAPITULASI HASIL VERIFIKASI PRIORITAS 3:`);
  console.log(`   Langkah Lulus : ${passed}`);
  console.log(`   Langkah Gagal : ${failed}`);
  console.log(`   Status Akhir  : ${failed === 0 ? '🏆 PRIORITAS 3 SELESAI & TERVERIFIKASI 100%' : '⚠️ TERDAPAT MASALAH'}`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runPriority3Verification().catch(err => {
  console.error('Fatal error saat uji Prioritas 3:', err);
  process.exit(1);
});
