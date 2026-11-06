/**
 * Automated User Acceptance Testing (UAT) Suite
 * SIM Tugas Akhir FEB UTM (Fase 5: QA / Testing)
 * 
 * Menguji Alur Hulu-ke-Hilir dengan Autentikasi Kriptografis (JWT RBAC):
 * 1. Mahasiswa Login & Daftar Ujian
 * 2. Koorprodi Login, Validasi Kuota Dosen, & Verifikasi Kelayakan
 * 3. Dosen/Admin Siarkan ACC & Alokasikan Ruangan Ujian Tanpa Bentrok
 * 4. Penguji Login, Input Nilai, Catat Koreksi, & Terbitkan Berita Acara Digital
 * 5. Verifikasi Publik Integritas Dokumen via QR Code Hash
 */

const BASE_URL = 'http://localhost:5001/api';

import { TEST_PASSWORD, ensureTestAccounts } from './helpers/testAccounts.js';

async function loginUser(identifier, password = TEST_PASSWORD) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(`Gagal login user ${identifier}: ${data.message || 'No token'}`);
  }
  return data.token;
}

async function runUATWorkflow() {
  // Audit 21 Oktober 2026: siapkan kredensial uji deterministik di luar jalur HTTP.
  // (Kredensial universal institusi tidak lagi berlaku di aplikasi).
  const credPrep = ensureTestAccounts();
  if (!credPrep.ok) {
    console.error('Gagal menyiapkan kredensial uji:', credPrep.message);
    process.exit(1);
  }


  console.log('====================================================');
  console.log('🎓 SIM-TA FEB UTM — END-TO-END UAT WORKFLOW TEST');
  console.log('   Alur: Mahasiswa -> Koorprodi -> Pembimbing -> Penguji');
  console.log('====================================================\n');

  let passedSteps = 0;
  let failedSteps = 0;

  function assert(condition, stepName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${stepName}`);
      if (details) console.log(`     ↳ ${details}`);
      passedSteps++;
    } else {
      console.error(`  ❌ [FAIL] ${stepName}`);
      if (details) console.error(`     ↳ ${details}`);
      failedSteps++;
    }
  }

  const testId = `uat-mhs-${Date.now()}`;

  // ----------------------------------------------------
  // TAHAP 1: Mahasiswa Daftar Ujian
  // ----------------------------------------------------
  console.log('📝 TAHAP 1: Mahasiswa Mendaftar Ujian (Hulu Alur)');
  try {
    const mhsToken = await loginUser('210211100142');

    const res = await fetch(`${BASE_URL}/admin/verifikasi-berkas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mhsToken}`
      },
      body: JSON.stringify({
        id: testId,
        nim: '210211100142',
        namaMahasiswa: 'Ilham Maulana',
        jenjang: 'S1',
        programStudi: 'S1 Manajemen',
        jenisUjian: 'Seminar Proposal Skripsi',
        judul: 'Analisis Pengaruh Green Marketing dan Brand Image terhadap Keputusan Pembelian Produk UMKM di Madura',
        berkasList: [
          { nama: 'Transkrip_Akademik_110SKS.pdf', status: 'Lengkap' },
          { nama: 'Sertifikat_TOEFL_475.pdf', status: 'Lengkap' },
          { nama: 'Naskah_Proposal_Bab1_3.pdf', status: 'Lengkap' }
        ],
          // Audit 21 Oktober 2026 (P1-3): metrik akademik menjadi SYARAT
          // PENDAFTARAN yang ditegakkan dari rules_json (S1: min 120 SKS,
          // min 450 TOEFL, maks 25% similaritas).,
          metrik: { ipk: 3.64, sksLulus: 132, toeflScore: 480, similarity: 18, aiDetection: 21, sertifikatNo: 'TOEFL-2026-UJI' }
      })
    });

    const body = await res.json();
    assert(
      res.status === 201 && body.success === true,
      'Mahasiswa sukses mengirim pendaftaran ujian ke sistem dengan JWT resmi',
      `ID Pendaftaran: ${body.data ? body.data.id : 'N/A'}`
    );
  } catch (err) {
    assert(false, 'Tahap 1 gagal', err.message);
  }

  // ----------------------------------------------------
  // TAHAP 2: Koorprodi Plot Pembimbing & Verifikasi Kelayakan
  // ----------------------------------------------------
  console.log('\n👥 TAHAP 2: Koorprodi Verifikasi Berkas & Plotting Dosen Pembimbing');
  try {
    const koorprodiToken = await loginUser('197802142003122001');

    // 2.1 Cek Kuota Dosen dengan Token Koorprodi
    const kuotaRes = await fetch(`${BASE_URL}/superadmin/kuota`, {
      headers: { 'Authorization': `Bearer ${koorprodiToken}` }
    });
    const kuotaData = await kuotaRes.json();
    const dosenIriani = kuotaData.data?.find(d => d.nama.includes('Iriani'));
    assert(
      kuotaRes.status === 200 && dosenIriani,
      'Koorprodi memvalidasi kuota bimbingan dosen (Pedoman 2026)',
      `Dosen: ${dosenIriani ? dosenIriani.nama : 'N/A'} | Kuota: ${dosenIriani ? dosenIriani.terisiUtama : 0}/${dosenIriani ? dosenIriani.kuotaUtama : 0}`
    );

    // 2.2 Update status verifikasi & penetapan pembimbing
    const verifRes = await fetch(`${BASE_URL}/admin/verifikasi-berkas/${testId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${koorprodiToken}`
      },
      body: JSON.stringify({
        statusVerifikasi: 'Disetujui Koorprodi',
        catatanAdmin: 'Berkas lengkap memenuhi syarat Buku Pedoman 2026. Diplot Dosen Pembimbing: Dr. Dra. Hj. Iriani Ismail, M.M.'
      })
    });

    const verifBody = await verifRes.json();
    assert(
      verifRes.status === 200 && verifBody.success === true,
      'Koorprodi berhasil memverifikasi dan menetapkan plotting dosen'
    );
  } catch (err) {
    assert(false, 'Tahap 2 gagal', err.message);
  }

  // ----------------------------------------------------
  // TAHAP 3: Admin & Dosen Memberikan Persetujuan (ACC) & Alokasi Ruang
  // ----------------------------------------------------
  console.log('\n✍️ TAHAP 3: Dosen Pembimbing Menyetujui Naskah (ACC Ujian) & Alokasi Ruang');
  try {
    const adminToken = await loginUser('198104122008121002'); // Admin Akademik

    // 3.1 Kirim notifikasi real-time ACC Pembimbing
    const notifRes = await fetch(`${BASE_URL}/notifications/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        role: 'mahasiswa',
        title: 'ACC Naskah Ujian Diberikan Dosen Pembimbing',
        message: 'Naskah seminar proposal Anda telah disetujui untuk maju ujian sidang.',
        eventCategory: 'PROMOTOR_SETUJU_NASKAH',
        type: 'success'
      })
    });

    const notifBody = await notifRes.json();
    assert(
      notifRes.status === 201 && notifBody.success === true,
      'Notifikasi real-time persetujuan pembimbing berhasil disiarkan (SSE)'
    );

    // 3.2 Alokasi Ruang Ujian oleh Admin
    const jamUnik = (10 + (Math.floor(Date.now() / 1000) % 6)).toString().padStart(2, '0');
    const ruangRes = await fetch(`${BASE_URL}/admin/ruangan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        id: `plot-${Date.now()}`,
        namaMahasiswa: 'Ilham Maulana',
        nim: '210211100142',
        jenjang: 'S1',
        jenisUjian: 'Seminar Proposal Skripsi',
        ruangId: `R-FEB-${Date.now() % 10000}`,
        ruangNama: 'Ruang Sidang Jurusan Manajemen Lt. 2',
        tanggal: `2026-12-${(Date.now() % 28 + 1).toString().padStart(2, '0')}`,
        jamMulai: `${jamUnik}:00`,
        jamSelesai: `${jamUnik}:45`,
        moda: 'Luring (Tatap Muka)',
        ketuaPenguji: 'Dr. Faidal, S.E., M.M.'
      })
    });

    const ruangBody = await ruangRes.json();
    assert(
      ruangRes.status === 200 && ruangBody.success === true,
      'Admin berhasil mengalokasikan ruang ujian tanpa bentrok jadwal'
    );
  } catch (err) {
    assert(false, 'Tahap 3 gagal', err.message);
  }

  // ----------------------------------------------------
  // TAHAP 4: Dewan Penguji Mengisi Nilai, Revisi, & Terbitkan Berita Acara
  // ----------------------------------------------------
  console.log('\n🎓 TAHAP 4: Dewan Penguji Menginput Nilai & Mengesahkan Berita Acara (Hilir Alur)');
  try {
    // 4.0 Login Penguji untuk memperoleh Bearer Token resmi
    const pengujiToken = await loginUser('197703032003121002'); // Dr. Faidal

    // 4.1 Penguji Submit Nilai Sidang
    const nilaiRes = await fetch(`${BASE_URL}/penguji/ujian/uj-pgj-1/penilaian`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pengujiToken}`
      },
      body: JSON.stringify({
        nilaiFinal: 87.5,
        grade: 'A',
        rekomendasiKelayakan: 'Layak Revisi Minor',
        catatanEvaluasi: 'Kemampuan argumentasi dan metodologi penelitian sangat baik. Perbaiki Bab IV sebelum final.'
      })
    });

    const nilaiBody = await nilaiRes.json();
    assert(
      nilaiRes.status === 200 && nilaiBody.success === true,
      'Dewan Penguji sah menginput nilai ujian sidang (Nilai Akhir: 87.5 | Grade: A)'
    );

    // 4.2 Penguji Mencatat Catatan Revisi dengan SLA 14 Hari
    const koreksiRes = await fetch(`${BASE_URL}/penguji/koreksi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pengujiToken}`
      },
      body: JSON.stringify({
        id: 'kor-uat-test',
        ujianId: 'uj-pgj-1',
        mhsNim: '210211100142',
        mhsNama: 'Ilham Maulana',
        jenjang: 'S1',
        pengujiId: 'dosen-faidal',
        namaPenguji: 'Dr. Faidal, S.E., M.M.',
        bagianNaskah: 'BAB IV - Analisis Data',
        halaman: 'Halaman 65 - 72',
        catatanKoreksi: 'Tambahkan pengujian multikolinearitas dengan nilai VIF < 10.',
        tingkatUrgensi: 'Sedang'
      })
    });

    const koreksiBody = await koreksiRes.json();
    assert(
      koreksiRes.status === 200 && koreksiBody.success === true,
      'Catatan revisi ujian penguji berhasil dicatat (Timer SLA 14 Hari Aktif)'
    );

    // Teardown catatan pengujian UAT agar tidak mengotori data operasional
    await fetch(`${BASE_URL}/penguji/koreksi/kor-uat-test`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${pengujiToken}` }
    });

    // 4.3 Penerbitan Berita Acara Ujian Resmi dengan QR Code Validasi oleh Penguji
    const baRes = await fetch(`${BASE_URL}/documents/generate-berita-acara`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pengujiToken}`
      },
      body: JSON.stringify({
        nim: '210211100142',
        namaMahasiswa: 'Ilham Maulana',
        jenjang: 'S1',
        prodi: 'S1 Manajemen',
        judul: 'Analisis Pengaruh Green Marketing dan Brand Image terhadap Keputusan Pembelian Produk UMKM di Madura',
        nilaiAkhir: 87.5,
        grade: 'A',
        statusKelulusan: 'LULUS DENGAN REVISI MINOR',
        penguji: [
          { nama: 'Dr. Faidal, S.E., M.M.', peran: 'Ketua Penguji', nilai: 88 },
          { nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', peran: 'Sekretaris / Pembimbing', nilai: 87 }
        ]
      })
    });

    const baBody = await baRes.json();
    assert(
      (baRes.status === 200 || baRes.status === 201) && baBody.success === true,
      'Dokumen Berita Acara Ujian resmi berhasil digenerate dengan QR Code FEB UTM',
      `Kode Verifikasi Digital: ${baBody.data ? baBody.data.verificationCode : 'N/A'}`
    );

    // 4.4 Verifikasi Dokumen Publik Berita Acara via Kode Digital (Tanpa Token)
    const verifDocRes = await fetch(`${BASE_URL}/documents/verify/${baBody.data.verificationCode}`);
    const verifDocBody = await verifDocRes.json();
    assert(
      verifDocRes.status === 200 && verifDocBody.success === true,
      'Integritas verifikasi publik QR Code dokumen Berita Acara terkonfirmasi ASLI',
      `Judul Dokumen: ${verifDocBody.data ? verifDocBody.data.judulDokumen : 'N/A'}`
    );

  } catch (err) {
    assert(false, 'Tahap 4 gagal', err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 HASIL PENGUJIAN UAT (HULU KE HILIR):`);
  console.log(`   Total Langkah Sukses : ${passedSteps}`);
  console.log(`   Total Langkah Gagal  : ${failedSteps}`);
  console.log(`   Status Keseluruhan   : ${failedSteps === 0 ? '🏆 100% UAT ALUR PENUH BERHASIL (PASSED)' : '⚠️ TERDAPAT KENDALA'}`);
  console.log('====================================================\n');

  if (failedSteps > 0) {
    process.exit(1);
  }
}

runUATWorkflow();
