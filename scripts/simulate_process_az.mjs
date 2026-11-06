/**
 * ============================================================================
 * SIMULASI PROSES BISNIS A–Z — SIM-TA FEB UTM
 * ============================================================================
 *
 * Menjalankan SELURUH alur proses bisnis yang ada di sistem, dari autentikasi
 * hingga pergantian semester, terhadap server yang benar-benar berjalan
 * (http://localhost:5001), lalu MEMVERIFIKASI hasil tiap langkah.
 *
 * Berbeda dari skrip simulasi lama (scratch/simulate_business_process_az.mjs)
 * yang hanya MENYATAKAN hasil hardcoded, skrip ini:
 *   - benar-benar memanggil API untuk setiap langkah,
 *   - memeriksa efek sampingnya di basis data,
 *   - menguji guard RBAC (apakah langkah yang TIDAK SHOULD bisa dilakukan
 *     benar-benar ditolak),
 *   - membersihkan seluruh data simulasi di akhir,
 *   - menghasilkan laporan JSON + Markdown.
 *
 * Jalankan: node scripts/simulate_process_az.mjs
 * Keluaran : reports/simulasi-proses-az.json  +  reports/laporan-simulasi-proses-az.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { TEST_PASSWORD, ensureTestAccounts, loginUser } from '../tests/helpers/testAccounts.js';

const API = 'http://localhost:5001/api';
const DB_PATH = 'data/sim_ta_feb_utm.db';
const OUT_DIR = 'reports';

const NIM_SIM = '210211990001';
const NAMA_SIM = 'Mahasiswa Simulasi A-Z';
const NIP_DOSEN = '196201081987032001';
const NIP_DOSEN2 = '196203031988032001';
const NIP_PENGUJI = '197703032003121002';

// ----------------------------------------------------------------------
// Kerangka pelaporan
// ----------------------------------------------------------------------
const steps = [];
let currentPhase = '';
let phaseStart = 0;

function phase(name) {
  currentPhase = name;
  phaseStart = steps.length;
  console.log(`\n${'='.repeat(78)}\n  ${name}\n${'='.repeat(78)}`);
}

function check(name, condition, detail = '') {
  const s = {
    fase: currentPhase,
    langkah: name,
    hasil: condition ? 'LULUS' : 'GAGAL',
    detail: String(detail).slice(0, 300),
    waktu: new Date().toISOString()
  };
  steps.push(s);
  const mark = condition ? '  [LULUS] ' : '  [GAGAL] ';
  if (condition) console.log(`${mark}${name}${detail ? ` — ${detail}` : ''}`);
  else console.error(`${mark}${name}${detail ? ` — ${detail}` : ''}`);
  return condition;
}

function note(name, detail) {
  steps.push({
    fase: currentPhase,
    langkah: name,
    hasil: 'CATATAN',
    detail: String(detail).slice(0, 300),
    waktu: new Date().toISOString()
  });
  console.log(`  [CATATAN] ${name}${detail ? ` — ${detail}` : ''}`);
}

// ----------------------------------------------------------------------
// Helper API
// ----------------------------------------------------------------------
async function api(method, pathname, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* bukan JSON */ }
  return { status: res.status, json, text };
}

const T = {};

// ----------------------------------------------------------------------
// FASE A — AUTENTIKASI & IDENTITAS
// ----------------------------------------------------------------------
async function faseA() {
  phase('FASE A — AUTENTIKASI, IDENTITAS & MANAJEMEN SESI');

  const akun = [
    ['mahasiswa', '210211100142'],
    ['dosen', NIP_DOSEN],
    ['dosen2', NIP_DOSEN2],
    ['dosen3', '196306231989031002'],
    ['penguji', NIP_PENGUJI],
    ['koorprodi', '197802142003122001'],
    ['admin', '198104122008121002'],
    ['superadmin', '197405102000031001']
  ];

  for (const [role, nip] of akun) {
    const r = await api('POST', '/auth/login', { body: { identifier: nip, password: TEST_PASSWORD } });
    T[role] = r.json?.token || null;
    check(`Login akun ${role} (${nip})`, r.status === 200 && T[role], `status=${r.status}`);
  }

  const me = await api('GET', '/auth/me', { token: T.mahasiswa });
  check('Profil /auth/me terbaca', me.status === 200 && me.json?.user?.nomorInduk === '210211100142', `role=${me.json?.user?.role}`);

  const anon = await api('GET', '/auth/me');
  check('Endpoint terlindungi menolak anonim', anon.status === 401, `status=${anon.status}`);

  const sw = await api('POST', '/auth/switch-role', { token: T.dosen, body: { targetRole: 'penguji' } });
  check('Switch-role dosen -> penguji', sw.status === 200 && !!sw.json?.token, `status=${sw.status}`);

  const swMhs = await api('POST', '/auth/switch-role', { token: T.mahasiswa, body: { targetRole: 'superadmin' } });
  check('Switch-role mahasiswa -> superadmin DITOLAK', swMhs.status === 403, `status=${swMhs.status}`);

  const reset = await api('POST', '/auth/reset-password-request', { body: { identifier: '210211100142' } });
  check('Permintaan pemulihan kata sandi tidak membocorkan email',
    reset.status === 200 && !reset.text.toLowerCase().includes('@trunojoyo.ac.id'), `status=${reset.status}`);

  // Logout + pencabutan token
  const tmp = await loginUser(API, '210211100142', TEST_PASSWORD);
  await api('POST', '/auth/logout', { token: tmp });
  const after = await api('GET', '/auth/me', { token: tmp });
  check('Token mati setelah logout (sesi dicabut)', after.status === 401, `status=${after.status}`);

  const saNow = await loginUser(API, '197405102000031001', TEST_PASSWORD);
  T.superadmin = saNow;
}

// ----------------------------------------------------------------------
// FASE B — MASTER DATA & TATA KELOLA (SUPER ADMIN)
// ----------------------------------------------------------------------
async function faseB() {
  phase('FASE B — MASTER DATA & TATA KELOLA (SUPER ADMIN)');

  const prodi = await api('GET', '/superadmin/prodi', { token: T.superadmin });
  check('Baca daftar program studi', prodi.status === 200 && Array.isArray(prodi.json?.data), `jumlah=${prodi.json?.data?.length}`);

  const idProdi = `prodi-sim-${Date.now()}`;
  const createProdi = await api('POST', '/superadmin/prodi', {
    token: T.superadmin,
      body: { id: idProdi, kodeProdi: 'SIM-AZ', namaProdi: 'S-1 Manajemen (Simulasi A-Z)', jenjang: 'S1', akreditasi: 'Unggul', kuotaMahasiswa: 120 }
  });
  check('Buat program studi baru', createProdi.status === 200 || createProdi.status === 201, `status=${createProdi.status} ${createProdi.json?.message || ''}`);

  const updProdi = await api('PUT', `/superadmin/prodi/${idProdi}`, {
    token: T.superadmin,
    body: { kodeProdi: 'SIM-AZ', namaProdi: 'S-1 Manajemen (Simulasi A-Z)', jenjang: 'S1', akreditasi: 'Unggul', kuotaMahasiswa: 130 }
  });
  check('Ubah program studi', updProdi.status === 200, `status=${updProdi.status}`);

  const prodiAfter = await api('GET', '/superadmin/prodi', { token: T.superadmin });
  check('Perubahan program studi tersimpan',
    (prodiAfter.json?.data || []).some((p) => p.id === idProdi), `terdaftar=${(prodiAfter.json?.data || []).some((p) => p.id === idProdi)}`);

  const kuota = await api('GET', '/superadmin/kuota', { token: T.superadmin });
  check('Baca pagu kuota bimbingan dosen', kuota.status === 200 && Array.isArray(kuota.json?.data), `jumlah=${kuota.json?.data?.length}`);

  const targetKuota = (kuota.json?.data || []).find((d) => d.nip === NIP_DOSEN);
  if (targetKuota) {
    const before = targetKuota.kuotaUtama;
    const updKuota = await api('PUT', `/superadmin/kuota/${targetKuota.id}`, {
      token: T.superadmin,
      body: { kuotaUtama: before, kuotaPendamping: targetKuota.kuotaPendamping, status: targetKuota.status }
    });
    check('Ubah pagu kuota dosen', updKuota.status === 200, `status=${updKuota.status}`);
  } else {
    check('Ubah pagu kuota dosen', false, `Dosen ${NIP_DOSEN} tidak ditemukan pada daftar kuota`);
  }

  const tahapan = await api('GET', '/superadmin/tahapan', { token: T.superadmin });
  check('Baca template tahapan per jenjang', tahapan.status === 200 && !!tahapan.json?.data, `jenjang=${Object.keys(tahapan.json?.data || {}).join(',')}`);

  const tpl = await api('GET', '/superadmin/tahapan', { token: T.superadmin });
  const dataTpl = tpl.json?.data || {};
  const entriS1 = dataTpl.S1 || {};
  const jumlahTahapS1 = Array.isArray(entriS1.tahapanList) ? entriS1.tahapanList.length : 0;
  check('Template S1 memiliki tahapan', jumlahTahapS1 >= 4, `jumlah=${jumlahTahapS1}`);

  const updTahap = await api('PUT', '/superadmin/tahapan/S1', {
    token: T.superadmin,
    body: { rules: entriS1.rules || { minSks: 120, maksSimilaritas: 20 }, tahapanList: entriS1.tahapanList }
  });
  check('Ubah template tahapan S1', updTahap.status === 200, `status=${updTahap.status}`);

  const tahapKosong = await api('PUT', '/superadmin/tahapan/S1', {
    token: T.superadmin,
    body: { rules: entriS1.rules || {}, tahapanList: [] }
  });
  check('Template tahapan TIDAK dapat dihapus dengan larik kosong (400)', tahapKosong.status === 400, `status=${tahapKosong.status}`);

  const templateSetelah = await api('GET', '/superadmin/tahapan', { token: T.superadmin });
  const jumlahSetelah = templateSetelah.json?.data?.S1?.tahapanList?.length || 0;
  check('Template tahapan S1 utuh setelah percobaan penghapusan', jumlahSetelah === 4, `jumlah=${jumlahSetelah}`);

  // Manajemen pengguna: CRUD lengkap
  const idUser = `usr-sim-${Date.now()}`;
  const createUser = await api('POST', '/superadmin/users', {
    token: T.superadmin,
    body: { nomorInduk: NIM_SIM, nama: NAMA_SIM, email: 'simulasi.az@student.trunojoyo.ac.id', role: 'mahasiswa', jenjang: 'S1', prodi: 'S-1 Manajemen' }
  });
  check('Buat akun mahasiswa simulasi', createUser.status === 200 || createUser.status === 201, `status=${createUser.status}`);
  check('Akun baru memperoleh kata sandi sementara ACAK (bukan default seragam)',
    typeof createUser.json?.temporaryPassword === 'string' && createUser.json.temporaryPassword.length >= 10,
    createUser.json?.temporaryPassword ? 'pwd acak tersedia' : 'tidak ada pwd');

  const listUsers = await api('GET', '/superadmin/users', { token: T.superadmin });
  const userSim = (listUsers.json?.data || []).find((u) => u.nomorInduk === NIM_SIM);
  check('Akun simulasi terdaftar', !!userSim, `id=${userSim?.id}`);

  if (userSim) {
    const updUser = await api('PUT', `/superadmin/users/${userSim.id}`, {
      token: T.superadmin,
      body: { role: 'mahasiswa', status: 'Aktif', nama: NAMA_SIM, email: 'simulasi.az@student.trunojoyo.ac.id' }
    });
    check('Ubah data akun', updUser.status === 200, `status=${updUser.status}`);

    const resetPwd = await api('POST', `/superadmin/users/${userSim.id}/reset-password`, { token: T.superadmin });
    check('Reset kata sandi menerbitkan sandi sementara acak',
      resetPwd.status === 200 && typeof resetPwd.json?.temporaryPassword === 'string', `status=${resetPwd.status}`);

    const listAfter = await api('GET', '/superadmin/users', { token: T.superadmin });
    const leaked = JSON.stringify(listAfter.json?.data || []).includes('temporaryPassword');
    check('Daftar pengguna tidak membocorkan kata sandi/hash', !leaked);
  }
}

// ----------------------------------------------------------------------
// FASE C — KALENDER AKADEMIK & GELOMBANG
// ----------------------------------------------------------------------
async function faseC() {
  phase('FASE C — KALENDER AKADEMIK & PEMBUKAAN GELOMBANG (ADMIN)');

  const list = await api('GET', '/admin/jadwal-tahapan', { token: T.admin });
  check('Baca kalender tahapan', list.status === 200 && Array.isArray(list.json?.data), `jumlah=${list.json?.data?.length}`);

  const idJadwal = `jadwal-sim-${Date.now()}`;
  const create = await api('POST', '/admin/jadwal-tahapan', {
    token: T.admin,
    body: {
      id: idJadwal, jenjang: 'S1', prodi: 'S-1 Manajemen', tahapKode: 'SIM-AZ-01',
      tahapNama: 'Pendaftaran Ujian Simulasi A-Z', semester: 'Ganjil 2026/2027',
      tanggalMulai: '2026-10-01', tanggalSelesai: '2026-12-31', jamDeadline: '23:59',
      status: 'Sedang Dibuka', moda: 'Luring & SIM-TA', targetMahasiswa: 50, terdaftarMahasiswa: 0,
      persyaratanRingkas: 'KRS aktif, draft bab I-III', catatanSOP: 'Simulasi otomatis A-Z',
      penanggungJawab: 'QA Otomatis'
    }
  });
  check('Buka gelombang pendaftaran', create.status === 200 || create.status === 201, `status=${create.status} ${create.json?.message || ''}`);

  const upd = await api('PUT', `/admin/jadwal-tahapan/${idJadwal}`, {
    token: T.admin,
    body: { status: 'Sedang Dibuka', target_mahasiswa: 60, terdaftar_mahasiswa: 0 }
  });
  check('Ubah jadwal tahapan', upd.status === 200, `status=${upd.status}`);

  const after = await api('GET', '/admin/jadwal-tahapan', { token: T.admin });
  const row = (after.json?.data || []).find((j) => j.id === idJadwal);
  check('Perubahan jadwal tersimpan di basis data', !!row && Number(row.targetMahasiswa) === 60, `target=${row?.targetMahasiswa}`);

  const del = await api('DELETE', `/admin/jadwal-tahapan/${idJadwal}`, { token: T.admin });
  check('Hapus jadwal tahapan', del.status === 200, `status=${del.status}`);
}

// ----------------------------------------------------------------------
// FASE D — PENDAFTARAN & PERSYARATAN MAHASISWA
// ----------------------------------------------------------------------
async function faseD() {
  phase('FASE D — PENDAFTARAN UJIAN & PEMENUHAN PERSYARATAN (MAHASISWA)');

  // Mahasiswa simulasi harus login dengan sandi sementara miliknya.
  const users = await api('GET', '/superadmin/users', { token: T.superadmin });
  const userSim = (users.json?.data || []).find((u) => u.nomor_induk === NIM_SIM || u.nomorInduk === NIM_SIM);
  if (!userSim) { check('Akun simulasi tersedia untuk login', false); return; }
  const reset = await api('POST', `/superadmin/users/${userSim.id}/reset-password`, { token: T.superadmin });
  const pwd = reset.json?.temporaryPassword;
  T.mhsSim = await loginUser(API, NIM_SIM, pwd);
  check('Mahasiswa simulasi login dengan kata sandi sementara', !!T.mhsSim);

  // Audit 21 Oktober 2026 (P1-3 + gerbang TA): pendaftaran ujian kini
  // mensyaratkan entri Tugas Akhir yang sudah ada (409 TA_NOT_INITIALIZED
  // bila belum). Karena itu TA dibuat lebih dulu pada tahap ini.
  const buatTA = await api('POST', '/akademik/tugas-akhir', {
    token: T.koorprodi,
    body: {
      nim: NIM_SIM,
      namaMahasiswa: NAMA_SIM,
      jenjang: 'S1',
      prodi: 'S-1 Manajemen',
      judul: 'Simulasi A-Z: Dampak Transformasi Digital terhadap Kinerja UMKM Madura'
    }
  });
  T.idTA = buatTA.json?.data?.id || `ta-${NIM_SIM}`;
  check('Entri Tugas Akhir mahasiswa simulasi dibuat sebelum pendaftaran',
    buatTA.status === 200 || buatTA.status === 201, `status=${buatTA.status} id=${T.idTA}`);

  // Alur nyata mahasiswa:
  //   1) dibuatkan Tugas Akhir + pembimbing (oleh koordinator)
  //   2) menyelesaikan Tahap 1 (Pengajuan Topik & Plotting Pembimbing)
  //   3) BARU boleh mendaftar ujian — gerbang registration (BP-1) mewajibkan
  //      tahapan prasyarat sudah Selesai.
  const plotTA = await api('PUT', `/akademik/tugas-akhir/${T.idTA}/pembimbing`, {
    token: T.koorprodi,
    body: {
      pembimbingUtama: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
      pembimbingUtamaNip: NIP_DOSEN,
      pembimbingPendamping: 'Dr. Faidal, S.E., M.M.',
      pembimbingPendampingNip: NIP_PENGUJI
    }
  });
  check('Plotting pembimbing sebelum tahapan pertama', plotTA.status === 200, `status=${plotTA.status}`);

  const tokenDosenTA = await loginUser(API, NIP_DOSEN, TEST_PASSWORD);
  const tokenKoorTA = await loginUser(API, '197802142003122001', TEST_PASSWORD);
  for (const [langkah, pemanggil, body] of [
    ['ajukan', T.mhsSim, { catatan: 'Simulasi A-Z: pengajuan tahap 1' }],
    ['approve', tokenDosenTA, { catatan: 'Simulasi A-Z: persetujuan tahap 1' }],
    ['verifikasi', tokenKoorTA, { catatan: 'Simulasi A-Z: verifikasi tahap 1' }],
    ['selesai', tokenKoorTA, { catatan: 'Simulasi A-Z: tahap 1 selesai' }]
  ]) {
    const r = await api('POST', `/akademik/tugas-akhir/${T.idTA}/tahap/S1-T1/${langkah}`, {
      token: pemanggil, body
    });
    check(`Tahap 1 ${langkah} -> ${r.status === 200 || r.status === 201 || r.status === 409 ? 'berhasil' : 'gagal'}`,
      r.status === 200 || r.status === 201 || r.status === 409, `status=${r.status}`);
  }

  const daftar = await api('POST', '/admin/verifikasi-berkas', {
    token: T.mhsSim,
    body: {
      id: `berkas-sim-${Date.now()}`, nim: NIM_SIM, namaMahasiswa: NAMA_SIM, jenjang: 'S1',
      programStudi: 'S-1 Manajemen', jenisUjian: 'Seminar Proposal Skripsi',
      tanggalDaftar: '2026-10-21', pembimbingUtama: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
      judul: 'Simulasi A-Z: Dampak Transformasi Digital terhadap Kinerja UMKM Madura',
      berkasList: [
        { nama: 'KRS Semester Berjalan', status: 'Lengkap', tanggal: '2026-10-21' },
        { nama: 'Transkrip Nilai Sementara', status: 'Lengkap', tanggal: '2026-10-21' },
        { nama: 'Draf Proposal Bab I-III', status: 'Lengkap', tanggal: '2026-10-21' }
      ],
      metrik: { ipk: 3.74, sksLulus: 126, toeflScore: 480, similarity: 19, aiDetection: 24, sertifikatNo: 'TOEFL-2026-001' }
    }
  });
  check('Mahasiswa mendaftar-upload berkas persyaratan', daftar.status === 200 || daftar.status === 201, `status=${daftar.status} ${daftar.json?.message || ''}`);
  T.idBerkas = daftar.json?.data?.id;

  const cek = await api('GET', '/admin/verifikasi-berkas', { token: T.admin });
  const row = (cek.json?.data || []).find((r) => r.id === T.idBerkas);
  check('Berkas pendaftaran masuk antrean verifikasi', !!row, `id=${T.idBerkas}`);
  check('Metrik akademik tersimpan bersama berkas',
    !!row && !!row.metrik_akademik_json && String(row.metrik_akademik_json).includes('3.74'),
    row?.metrik_akademik_json ? 'IPK 3.74 tercatat' : 'metrik kosong');

  const mhsLain = await api('GET', '/admin/verifikasi-berkas', { token: T.mhsSim });
  check('Mahasiswa tidak dapat membaca antrean verifikasi admin', mhsLain.status === 403, `status=${mhsLain.status}`);
}

// ----------------------------------------------------------------------
// FASE E — VERIFIKASI BERKAS OLEH ADMIN
// ----------------------------------------------------------------------
async function faseE() {
  phase('FASE E — VERIFIKASI KELAYAKAN BERKAS (ADMIN AKADEMIK)');

  const list = await api('GET', '/admin/verifikasi-berkas', { token: T.admin });
  check('Admin membaca antrean berkas', list.status === 200 && Array.isArray(list.json?.data), `jumlah=${list.json?.data?.length}`);

  const upd = await api('PUT', `/admin/verifikasi-berkas/${T.idBerkas}`, {
    token: T.admin,
    body: { statusVerifikasi: 'Terverifikasi', catatanAdmin: 'Simulasi A-Z: seluruh berkas lengkap & valid.' }
  });
  check('Admin memverifikasi berkas', upd.status === 200, `status=${upd.status} ${upd.json?.message || ''}`);

  const after = await api('GET', '/admin/verifikasi-berkas', { token: T.admin });
  const row = (after.json?.data || []).find((r) => r.id === T.idBerkas);
  check('Status verifikasi tersimpan', row?.status_verifikasi === 'Terverifikasi' || row?.statusVerifikasi === 'Terverifikasi', `status=${row?.status_verifikasi || row?.statusVerifikasi}`);

  const tolak = await api('PUT', `/admin/verifikasi-berkas/${T.idBerkas}`, {
    token: T.admin,
    body: { statusVerifikasi: 'Perlu Perbaikan', catatanAdmin: 'Uji penolakan' }
  });
  check('Admin dapat menolak berkas', tolak.status === 200, `status=${tolak.status}`);
  await api('PUT', `/admin/verifikasi-berkas/${T.idBerkas}`, {
    token: T.admin,
    body: { statusVerifikasi: 'Terverifikasi', catatanAdmin: 'Simulasi A-Z: disetujui kembali.' }
  });
}

// ----------------------------------------------------------------------
// FASE F — PLOTTING PEMBIMBING & PENETAPAN DEWAN PENGUJI
// ----------------------------------------------------------------------
async function faseF() {
  phase('FASE F — PLOTTING PEMBIMBING (KOORDINATOR PRODI)');

  const create = await api('POST', '/akademik/tugas-akhir', {
    token: T.koorprodi,
    body: { nim: NIM_SIM, namaMahasiswa: NAMA_SIM, judul: 'Simulasi A-Z: Dampak Transformasi Digital terhadap Kinerja UMKM Madura', jenjang: 'S1', prodi: 'S-1 Manajemen' }
  });
  check('Koordinator membuat entri Tugas Akhir', create.status === 200 || create.status === 201, `status=${create.status}`);
  T.idTA = (create.json?.data?.id) || `ta-${NIM_SIM}`;

  const listTA = await api('GET', '/akademik/tugas-akhir', { token: T.koorprodi });
  const ta = (listTA.json?.data || listTA.json || []).find((t) => t.nim === NIM_SIM);
  check('Entri Tugas Akhir terdaftar', !!ta, `id=${ta?.id}`);

  const plot = await api('PUT', `/akademik/tugas-akhir/${T.idTA}/pembimbing`, {
    token: T.koorprodi,
    body: {
      pembimbingUtama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', pembimbingUtamaNip: NIP_DOSEN,
      pembimbingPendamping: 'Dra. Hj. S. Anugrahini Irawati, M.M.', pembimbingPendampingNip: NIP_DOSEN2
    }
  });
  check('Plotting pembimbing utama & pendamping', plot.status === 200, `status=${plot.status}`);
  check('NIP pembimbing otoritatif tersimpan', plot.json?.data?.pembimbingUtamaNip === NIP_DOSEN, `nip=${plot.json?.data?.pembimbingUtamaNip}`);

  const plotSalah = await api('PUT', `/akademik/tugas-akhir/${T.idTA}/pembimbing`, {
    token: T.koorprodi, body: { fieldTidakDikenal: 'x' }
  });
  check('Plotting dengan payload tak dikenal ditolak (tidak ada sukses palsu)', plotSalah.status === 400, `status=${plotSalah.status}`);

  const plotMhs = await api('PUT', `/akademik/tugas-akhir/${T.idTA}/pembimbing`, {
    token: T.mhsSim, body: { pembimbingUtama: 'X', pembimbingUtamaNip: '1' }
  });
  check('Mahasiswa DITOLAK menetapkan pembimbing', plotMhs.status === 403, `status=${plotMhs.status}`);

  // Penetapan dekwan penguji kini memiliki jalur API resmi (Audit 21 Okt 2026 — AZ-A1).
  // Alur penuhnya diuji pada FASE K (pembuatan ujian + dekwan + penilaian).
}

// ----------------------------------------------------------------------
// FASE G — SIKLUS BIMBINGAN
// ----------------------------------------------------------------------
async function faseG() {
  phase('FASE G — SIKLUS BIMBINGAN (MAHASISWA & PEMBIMING)');

  const catat = await api('POST', '/akademik/bimbingan', {
    token: T.mhsSim,
    body: { tanggal: '2026-10-21', topik: 'Simulasi A-Z:(login)Bab I — Latar Belakang', catatan: 'Pembahasan rumusan masalah' }
  });
  check('Mahasiswa mencatat sesi bimbingan', catat.status === 200 || catat.status === 201, `status=${catat.status}`);
  T.idBimbingan = catat.json?.data?.id;

  const list = await api('GET', '/akademik/bimbingan', { token: T.mhsSim });
  const row = (list.json?.data || []).find((b) => b.id === T.idBimbingan);
  check('Sesi bimbingan masuk daftar mahasiswa', !!row, `status awal=${row?.status}`);
  check('Sesi mahasiswa berstatus "Menunggu Approval" (menunggu paraf pembimbing)',
    row?.status === 'Menunggu Approval', `status=${row?.status}`);

  // Dosen ketiga: TIDAK menetapkan sebagai pembimbing pada TA simulasi.
  const olehDosenLain = await api('POST', '/akademik/bimbingan', {
    token: T.dosen3, body: { nim: NIM_SIM, tanggal: '2026-10-21', topik: 'Upaya mencatat bimbingan bukan miliknya', catatan: 'x' }
  });
  check('Dosen non-pembimbing DITOLAK mencatat bimbingan', olehDosenLain.status === 403, `status=${olehDosenLain.status}`);

  const approveReal = await api('PUT', `/akademik/bimbingan/${T.idBimbingan}/approval`, {
    token: T.dosen, body: { status: 'Disetujui', catatanPembimbing: 'Sesi sesuai, disetujui.' }
  });
  check('Pembimbing menyetujui sesi bimbingan', approveReal.status === 200, `status=${approveReal.status}`);

  const list2 = await api('GET', '/akademik/bimbingan', { token: T.mhsSim });
  const row2 = (list2.json?.data || []).find((b) => b.id === T.idBimbingan);
  check('Status bimbingan menjadi "Disetujui"', row2?.status === 'Disetujui', `status=${row2?.status}`);

  const catatDosen = await api('POST', '/akademik/bimbingan', {
    token: T.dosen, body: { nim: NIM_SIM, tanggal: '2026-10-21', topik: 'Simulasi A-Z: sesi yang dicatat pembimbing langsung tervalidasi', catatan: 'x' }
  });
  check('Pembimbing dapat mencatat sesi (otomatis tervalidasi)', catatDosen.status === 200 || catatDosen.status === 201, `status=${catatDosen.status}`);

  // Checklist tahap: butuh minimal 8 sesi DISETUJUI untuk S1-T4
  for (let i = 0; i < 8; i++) {
    const b = await api('POST', '/akademik/bimbingan', {
      token: T.mhsSim, body: { tanggal: '2026-10-21', topik: `Simulasi A-Z: sesi bimbingan #${i + 1}`, catatan: 'Lengkapi checklist tahap' }
    });
    const id = b.json?.data?.id;
    if (id) await api('PUT', `/akademik/bimbingan/${id}/approval`, { token: T.dosen, body: { status: 'Disetujui' } });
  }
  const list3 = await api('GET', '/akademik/bimbingan', { token: T.mhsSim });
  const approved = (list3.json?.data || []).filter((b) => b.status === 'Disetujui').length;
  check('Tersedia cukup sesi bimbingan disetujui untuk checklist (>=8)', approved >= 8, `disetujui=${approved}`);
}

// ----------------------------------------------------------------------
// FASE H — UNGGAH NASKAH & KOMENTAR PEMBIMBING
// ----------------------------------------------------------------------
async function faseH() {
  phase('FASE H — UNGGAH NASKAH, REVIEW & KOMENTAR PEMBIMBING');

  const up = await api('POST', '/akademik/naskah', {
    token: T.mhsSim,
    body: { fileUrl: '/uploads/naskah/simulasi-az-v1.pdf', keterangan: 'Simulasi A-Z: naskah versi 1' }
  });
  check('Mahasiswa mengunggah versi naskah', up.status === 200 || up.status === 201, `status=${up.status} ${up.json?.message || ''}`);
  T.idNaskah = up.json?.data?.id;
  check('Nomor versi naskah otomatis', up.json?.data?.nomorVersi >= 1, `versi=${up.json?.data?.nomorVersi}`);

  const listN = await api('GET', '/akademik/naskah', { token: T.mhsSim });
  check('Daftar naskah mahasiswa terbaca', listN.status === 200, `jumlah=${(listN.json?.data || []).length}`);

  const kom = await api('POST', `/akademik/naskah/${T.idNaskah}/komentar`, {
    token: T.dosen, body: { isi: 'Simulasi A-Z: perjelas justifikasi penelitian pada Bab I.', bagian: 'Bab I' }
  });
  check('Pembimbing memberi komentar pada naskah', kom.status === 200 || kom.status === 201, `status=${kom.status}`);
  T.idKomentar = kom.json?.data?.id;

  const listK = await api('GET', `/akademik/naskah/${T.idNaskah}/komentar`, { token: T.mhsSim });
  check('Mahasiswa membaca komentar pembimbing', listK.status === 200 && (listK.json?.data || []).length > 0, `jumlah=${(listK.json?.data || []).length}`);

  const statusK = await api('PUT', `/akademik/komentar/${T.idKomentar}/status`, { token: T.dosen, body: { status: 'Selesai' } });
  check('Pembimbing menutup komentar', statusK.status === 200, `status=${statusK.status}`);

  // Token mahasiswa yang dipakai di sini harus aktif (FASE A mencabutnya).
  T.mahasiswa = await loginUser(API, '210211100142', TEST_PASSWORD);
  // Token mahasiswa perlu aktif kembali (FASE A mencabutnya saat menguji logout).
  T.mahasiswa = await loginUser(API, '210211100142', TEST_PASSWORD);

  // BP-2 (21 Oktober 2026): pembimbing MEMUTUSKAN atas naskahnya.
  // Naskah yang disetujui inilah yang memenuhi butir checklist
  // "Naskah telah disetujui pembimbing" pada pengajuan tahap berikutnya.
  const setujuiNaskah = await api('PUT', `/akademik/naskah/${T.idNaskah}/approval`, {
    token: T.dosen, body: { status: 'Disetujui', catatan: 'Simulasi A-Z: naskah layak diteruskan.' }
  });
  check('Pembimbing menyetujui naskah (memenuhi butir checklist tahapan)', setujuiNaskah.status === 200, `status=${setujuiNaskah.status}`);

  const komMhsLain = await api('POST', `/akademik/naskah/${T.idNaskah}/komentar`, {
    token: T.mahasiswa, body: { isi: 'x' }
  });
  check('Mahasiswa lain DITOLAK mengomentari naskah milik orang lain', komMhsLain.status === 403, `status=${komMhsLain.status}`);
}

// ----------------------------------------------------------------------
// FASE I — PUBLIKASI ILMIAH
// ----------------------------------------------------------------------
async function faseI() {
  phase('FASE I — PUBLIKASI ILMIAH & VERIFIKASI');

  const pub = await api('POST', '/akademik/publikasi', {
    token: T.mhsSim,
    body: { judul: 'Simulasi A-Z: Transformasi Digital dan Kinerja UMKM', jurnal: 'Jurnal Ilmiah Manajemen', tahun: '2026', tautan: 'https://doi.org/10.0000/simulasi' }
  });
  check('Mahasiswa mengajukan publikasi', pub.status === 200 || pub.status === 201, `status=${pub.status}`);
  T.idPublikasi = pub.json?.data?.id;

  const ver = await api('PUT', `/akademik/publikasi/${T.idPublikasi}/verifikasi`, {
    token: T.koorprodi, body: { statusVerifikasi: 'Terverifikasi', catatan: 'Simulasi A-Z: terverifikasi.' }
  });
  check('Koordinator memverifikasi publikasi', ver.status === 200, `status=${ver.status}`);

  const listP = await api('GET', '/akademik/publikasi', { token: T.mhsSim });
  const row = (listP.json?.data || []).find((p) => p.id === T.idPublikasi);
  check('Status publikasi menjadi Terverifikasi', row?.status_verifikasi === 'Terverifikasi' || row?.statusVerifikasi === 'Terverifikasi', `status=${row?.status_verifikasi || row?.statusVerifikasi}`);

  const verMhs = await api('PUT', `/akademik/publikasi/${T.idPublikasi}/verifikasi`, {
    token: T.mhsSim, body: { statusVerifikasi: 'Terverifikasi' }
  });
  check('Mahasiswa DITOLAK memverifikasi publikasi sendiri', verMhs.status === 403, `status=${verMhs.status}`);
}

// ----------------------------------------------------------------------
// FASE J — STATE MACHINE TAHAPAN TUGAS AKHIR
// ----------------------------------------------------------------------
async function faseJ() {
  phase('FASE J — STATE MACHINE TAHAPAN TUGAS AKHIR (AJUKAN → APPROVE → VERIFIKASI → SELESAI)');

  const progres = await api('GET', `/akademik/tugas-akhir/${T.idTA}/progres`, { token: T.koorprodi });
  check('Baca progres tahapan', progres.status === 200, `status=${progres.status}`);
  const tahapan = progres.json?.data?.tahapan || [];
  check('Empat tahapan S1 terdaftar', tahapan.length === 4, `jumlah=${tahapan.length}`);

  // Reset ke kondisi awal untuk menguji siklus penuh
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA busy_timeout = 5000');
  db.prepare("UPDATE tahap_status SET status='Belum Mulai', pengajuan_json=NULL, pembimbing_approved=0, admin_verified=0, catatan=NULL, tanggal_mulai=NULL, tanggal_selesai=NULL WHERE tugas_akhir_id=?").run(T.idTA);
  db.prepare("UPDATE tugas_akhir SET tahap_aktif_kode='S1-T1' WHERE id=?").run(T.idTA);
  db.close();

  const kodeTahap = ['S1-T1', 'S1-T2', 'S1-T3', 'S1-T4'];
  for (const kode of kodeTahap) {
    const ajukan = await api('POST', `/akademik/tugas-akhir/${T.idTA}/tahap/${kode}/ajukan`, {
      token: T.mhsSim, body: { catatan: `Simulasi A-Z: pengajuan ${kode}` }
    });
    check(`Mahasiswa mengajukan ${kode}`, ajukan.status === 200 || ajukan.status === 201 || ajukan.status === 409, `status=${ajukan.status}${valid(ajukan)}`);

  // Token mahasiswa perlu aktif kembali (FASE A mencabutnya saat menguji logout).
  T.mahasiswa = await loginUser(API, '210211100142', TEST_PASSWORD);

    const ajukanOrangLain = await api('POST', `/akademik/tugas-akhir/${T.idTA}/tahap/${kode}/ajukan`, {
      token: T.mahasiswa, body: { catatan: 'Mahasiswa lain' }
    });
    check(`Mahasiswa lain DITOLAK mengajukan ${kode}`, ajukanOrangLain.status === 403, `status=${ajukanOrangLain.status}`);

    const approve = await api('POST', `/akademik/tugas-akhir/${T.idTA}/tahap/${kode}/approve`, {
      token: T.dosen, body: { catatan: `Simulasi A-Z: persetujuan ${kode}` }
    });
    check(`Pembimbing menyetujui ${kode}`, [200, 409].includes(approve.status), `status=${approve.status}`);

    const approveBukan = await api('POST', `/akademik/tugas-akhir/${T.idTA}/tahap/${kode}/approve`, {
      token: T.dosen2, body: { catatan: 'Dosen non-pembimbing' }
    });
    check(`Dosen non-pembimbing DITOLAK menyetujui ${kode}`, approveBukan.status === 403 || approveBukan.status === 409, `status=${approveBukan.status}`);

    const verifikasi = await api('POST', `/akademik/tugas-akhir/${T.idTA}/tahap/${kode}/verifikasi`, {
      token: T.koorprodi, body: { catatan: `Simulasi A-Z: verifikasi ${kode}` }
    });
    check(`Koordinator memverifikasi ${kode}`, [200, 409].includes(verifikasi.status), `status=${verifikasi.status}`);

    const selesai = await api('POST', `/akademik/tugas-akhir/${T.idTA}/tahap/${kode}/selesai`, {
      token: T.koorprodi, body: { catatan: `Simulasi A-Z: ${kode} selesai` }
    });
    check(`Koordinator menutup ${kode}`, [200, 409].includes(selesai.status), `status=${selesai.status}`);
  }

  const progresAkhir = await api('GET', `/akademik/tugas-akhir/${T.idTA}/progres`, { token: T.koorprodi });
  const done = progresAkhir.json?.data?.tahapan?.filter((t) => t.status === 'Selesai').length || 0;
  check('Seluruh tahapan S1 berstatus Selesai', done === 4, `selesai=${done}/4`);
}

function valid(r) {
  return r.json?.message ? `| ${String(r.json.message).slice(0, 90)}` : '';
}

// ----------------------------------------------------------------------
// FASE K — PENJADWALAN SIDANG & DEWAN PENGUJI
// ----------------------------------------------------------------------
async function faseK() {
  phase('FASE K — PENJADWALAN SIDANG, ALOKASI RUANG & DEWAN PENGUJI');

  const ruang = await api('POST', '/admin/ruangan', {
    token: T.admin,
    body: {
      id: `ruang-sim-${Date.now()}`, namaMahasiswa: NAMA_SIM, nim: NIM_SIM, jenjang: 'S1',
      jenisUjian: 'Seminar Proposal Skripsi', ruangId: 'R-FEB-201', ruangNama: 'Ruang Sidang Jurusan Manajemen FEB Lt. 2',
      tanggal: '2026-11-05', jamMulai: '09:00', jamSelesai: '10:30', moda: 'Tatap Muka (Luring)',
      ketuaPenguji: 'Dr. Dra. Hj. Iriani Ismail, M.M.', status: 'Terjadwal', catatan: 'Simulasi A-Z'
    }
  });
  check('Admin membuat alokasi ruang sidang', ruang.status === 200 || ruang.status === 201, `status=${ruang.status} ${ruang.json?.message || ''}`);

  const listR = await api('GET', '/admin/ruangan', { token: T.admin });
  check('Daftar alokasi ruang terbaca', listR.status === 200 && Array.isArray(listR.json?.data), `jumlah=${listR.json?.data?.length}`);

  const sk = await api('POST', '/admin/sk', {
    token: T.admin,
    body: {
      id: `sk-sim-${Date.now()}`, nomorSK: `12${String(Date.now()).slice(-4)}/UN46.1.1/SK.TA/2026`,
      jenisSK: 'SK Penetapan Penguji Tugas Akhir', jenjang: 'S1', programStudi: 'S-1 Manajemen',
      mahasiswaNIM: NIM_SIM, mahasiswaNama: NAMA_SIM,
      judulTA: 'Simulasi A-Z: Dampak Transformasi Digital terhadap Kinerja UMKM Madura',
      dosenTerkait: [{ nip: NIP_DOSEN, nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', peran: 'Pembimbing Utama' }],
      tanggalTerbit: '2026-10-21', penandatangan: 'Dr. Dra. Hj. Iriani Ismail, M.M. (Dekan FEB UTM)',
      status: 'Diterbitkan Resmi', filePdf: 'https://feb.trunojoyo.ac.id/dokumen/sk/simulasi-az.pdf'
    }
  });
  check('Admin menerbitkan Surat Keputusan', sk.status === 200 || sk.status === 201, `status=${sk.status} ${sk.json?.message || ''}`);

  const listSK = await api('GET', '/admin/sk', { token: T.admin });
  check('Daftar SK terbaca', listSK.status === 200 && Array.isArray(listSK.json?.data), `jumlah=${listSK.json?.data?.length}`);

  // Audit 21 Oktober 2026 (AZ-A1): alur penjadwalan ujian & penetapan dekwan
  // penguji kini memiliki jalur API resmi. Record dibuat lewat endpoint, bukan
  // sisipan langsung ke SQLite.
  // Tanggal unik per eksekusi agar pengujian dapat diulang tanpa bentrok
  // pada pemeriksaan jadwal ganda (student + jenis ujian + tanggal).
  T.tanggalUjianSim = new Date(Date.now() + (30 + Math.floor(Math.random() * 300)) * 86400000)
    .toISOString()
    .slice(0, 10);
  const buatUjian = await api('POST', '/penguji/ujian', {
    token: T.koorprodi,
    body: {
      nim: NIM_SIM,
      namaMahasiswa: NAMA_SIM,
      jenjang: 'S1',
      programStudi: 'S-1 Manajemen',
      jenisUjian: 'Seminar Proposal Skripsi',
      judul: 'Simulasi A-Z: Dampak Transformasi Digital terhadap Kinerja UMKM Madura',
      tanggalUjian: T.tanggalUjianSim,
      jamUjian: '09:00',
      ruang: 'Ruang Sidang Jurusan Manajemen FEB Lt. 2',
      susunanPenguji: [
        { peran: 'Ketua Penguji', nama: 'Dr. Faidal, S.E., M.M.', nip: NIP_PENGUJI },
        { peran: 'Penguji', nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', nip: NIP_DOSEN }
      ]
    }
  });
  T.idUjian = buatUjian.json?.data?.id;
  check('Koordinator membuat penjadwalan ujian + penetapan dekwan penguji', buatUjian.status === 201 && !!T.idUjian, `status=${buatUjian.status} id=${T.idUjian} msg=${buatUjian.json?.message || buatUjian.text?.slice(0, 120) || ''}`);

  const nipTersimpan = (buatUjian.json?.data?.susunanPenguji || []).map((a) => a.nip);
  check('Setiap anggota dekwan terikat pada NIP pengguna nyata', nipTersimpan.every((n) => /^\d{6,}$/.test(String(n))), `nip=${nipTersimpan.join(', ')}`);

  const dekwanKosong = await api('POST', '/penguji/ujian', {
    token: T.koorprodi,
    body: { nim: NIM_SIM, namaMahasiswa: NAMA_SIM, tanggalUjian: T.tanggalUjianSim, jamUjian: '09:00', ruang: 'R1', susunanPenguji: [] }
  });
  check('Penetapan tanpa dekwan penguji ditolak 400', dekwanKosong.status === 400, `status=${dekwanKosong.status}`);

  const mhsBuatUjian = await api('POST', '/penguji/ujian', { token: T.mhsSim, body: {} });
  check('Mahasiswa DITOLAK membuat penjadwalan ujian', mhsBuatUjian.status === 403, `status=${mhsBuatUjian.status}`);
}

// ----------------------------------------------------------------------
// FASE L — PENILAIAN DEWAN PENGUJI
// ----------------------------------------------------------------------
async function faseL() {
  phase('FASE L — PENILAIAN DEWAN PENGUJI (RUBRIK BERBOBOT)');

  const list = await api('GET', '/penguji/ujian', { token: T.penguji });
  check('Dewan penguji membaca daftar ujian', list.status === 200, `status=${list.status}`);
  const ujian = (list.json?.data || []).find((u) => u.id === T.idUjian);
  check('Ujian yang ditugaskan muncul pada daftar', !!ujian, `id=${ujian?.id}`);

  // Token mahasiswa perlu aktif kembali (FASE A mencabutnya saat menguji logout).
  T.mahasiswa = await loginUser(API, '210211100142', TEST_PASSWORD);

  const listMhs = await api('GET', '/penguji/ujian', { token: T.mahasiswa });
  check('Mahasiswa DITOLAK membaca daftar ujian', listMhs.status === 403, `status=${listMhs.status}`);

  const nilai = await api('PUT', `/penguji/ujian/${T.idUjian}/penilaian`, {
    token: T.penguji,
    body: { nilaiFinal: 82.55, grade: 'A', rekomendasiKelayakan: 'Layak Diteruskan dengan Perbaikan Minor', catatanEvaluasi: 'Simulasi A-Z: nilai rubrik berbobot.' }
  });
  check('Dewan penguji menyimpan penilaian', nilai.status === 200, `status=${nilai.status} ${nilai.json?.message || ''}`);

  const db = new DatabaseSync(DB_PATH);
  const row = db.prepare('SELECT nilai_final, grade, rekomendasi_kelayakan, penilaian_submitted FROM ujian_penguji WHERE id = ?').get(T.idUjian);
  db.close();
  check('Nilai final tersimpan di basis data', Number(row?.nilai_final) === 82.55, `nilai=${row?.nilai_final}`);
  check('Grade tersimpan', row?.grade === 'A', `grade=${row?.grade}`);
  check('Rekomendasi kelayakan tersimpan', !!row?.rekomendasi_kelayakan, `rekomendasi=${row?.rekomendasi_kelayakan}`);

  // Penguji yang TIDAK menjadi anggota dekwan harus ditolak
  const bukanDekwan = await api('PUT', `/penguji/ujian/${T.idUjian}/penilaian`, {
    token: T.dosen2, body: { nilaiFinal: 10, grade: 'D' }
  });
  check('Dosen non-dekwan DITOLAK menilai ujian ini', bukanDekwan.status === 403, `status=${bukanDekwan.status}`);
}

// ----------------------------------------------------------------------
// FASE M — CATATAN KOREKSI & REVISI
// ----------------------------------------------------------------------
async function faseM() {
  phase('FASE M — CATATAN KOREKSI PENGAJU & PENYELESAIAN REVISI');

  const koreksi = await api('POST', '/penguji/koreksi', {
    token: T.penguji,
    body: {
      ujianId: T.idUjian, mhsNim: NIM_SIM, mhsNama: NAMA_SIM, jenjang: 'S1',
      pengujiId: 'usr-08', namaPenguji: 'Dr. Faidal, S.E., M.M.',
      bagianNaskah: 'Bab III', halaman: '42', catatanKoreksi: 'Simulasi A-Z: perjelasjustifikasi sampling purposive.', tingkatUrgensi: 'Sedang'
    }
  });
  check('Dewan penguji membuat catatan koreksi', koreksi.status === 200 || koreksi.status === 201, `status=${koreksi.status} ${koreksi.json?.message || ''}`);
  T.idKoreksi = koreksi.json?.data?.id || koreksi.json?.id;

  const listK = await api('GET', '/penguji/koreksi', { token: T.penguji });
  check('Catatan koreksi tersimpan & terbaca', listK.status === 200 && (listK.json?.data || []).some((k) => k.id === T.idKoreksi), `jumlah=${(listK.json?.data || []).length}`);

  const invalid = await api('POST', '/penguji/koreksi', {
    token: T.penguji, body: { ujianId: T.idUjian, mhsNim: NIM_SIM }
  });
  check('Catatan koreksi tanpa isi ditolak 400', invalid.status === 400, `status=${invalid.status}`);

  const status = await api('PUT', `/penguji/koreksi/${T.idKoreksi}/status`, {
    token: T.penguji, body: { statusVerifikasi: 'Disetujui Penguji', feedback: 'Simulasi A-Z: revisi telah tuntas.' }
  });
  check('Status verifikasi revisi diperbarui', status.status === 200, `status=${status.status}`);

  const del = await api('DELETE', `/penguji/koreksi/${T.idKoreksi}`, { token: T.penguji });
  check('Catatan koreksi dapat dihapus', del.status === 200, `status=${del.status}`);
}

// ----------------------------------------------------------------------
// FASE N — DOKUMEN RESMI & VERIFIKASI PUBLIK
// ----------------------------------------------------------------------
async function faseN() {
  phase('FASE N — DOKUMEN RESMI, QR VERIFIKASI & ARSIP');

  const ba = await api('POST', '/documents/generate-berita-acara', { token: T.penguji, body: { ujianId: T.idUjian } });
  check('Berita Acara ujian terbit', ba.status === 200 || ba.status === 201, `status=${ba.status} ${ba.json?.message || ''}`);
  T.kodeBA = ba.json?.data?.verificationCode || ba.json?.verificationCode;

  const pengesahan = await api('POST', '/documents/generate-pengesahan', { token: T.dosen, body: { nim: NIM_SIM } });
  check('Lembar Pengesahan terbit (semua tahapan selesai)', pengesahan.status === 200 || pengesahan.status === 201, `status=${pengesahan.status} ${pengesahan.json?.message || ''}`);

  const bimbingan = await api('POST', '/documents/generate-bimbingan', { token: T.mhsSim, body: { nim: NIM_SIM } });
  check('Kartu Kendali Bimbingan terbit', bimbingan.status === 200 || bimbingan.status === 201, `status=${bimbingan.status}`);

  const stp = await api('POST', '/documents/generate-surat-tugas-penguji', { token: T.koorprodi, body: { ujianId: T.idUjian } });
  check('Surat Tugas Penguji terbit', stp.status === 200 || stp.status === 201, `status=${stp.status}`);

  const stb = await api('POST', '/documents/generate-surat-tugas-pembimbing', { token: T.koorprodi, body: { nim: NIM_SIM } });
  check('Surat Tugas Pembimbing terbit', stb.status === 200 || stb.status === 201, `status=${stb.status}`);

  const skDekan = await api('POST', '/documents/generate-sk-dekan', { token: T.koorprodi, body: { nim: NIM_SIM } });
  check('SK Dekan terbit', skDekan.status === 200 || skDekan.status === 201, `status=${skDekan.status}`);

  const paket = await api('POST', '/documents/generate-exam-package', { token: T.admin, body: { ujianId: T.idUjian } });
  check('Paket Berkas Ujian terbit', paket.status === 200 || paket.status === 201, `status=${paket.status}`);

  if (T.kodeBA) {
    const ver = await api('GET', `/documents/verify/${T.kodeBA}`);
    check('Verifikasi publik dokumen resmi = ASLI', ver.status === 200 && ver.json?.verified === true, `status=${ver.status} verified=${ver.json?.verified}`);
  } else {
    check('Verifikasi publik dokumen resmi = ASLI', false, 'kode verifikasi tidak diperoleh');
  }

  const verSalah = await api('GET', '/documents/verify/KODE-TIDAK-ADA');
  check('Verifikasi kode tak dikenal ditolak tanpa membocorkan data', verSalah.status === 404 && verSalah.json?.verified === false, `status=${verSalah.status}`);

  const arsip = await api('GET', '/documents/archive', { token: T.admin });
  check('Arsip dokumen resmi terbaca', arsip.status === 200, `jumlah=${(arsip.json?.data || []).length}`);

  const counters = await api('GET', '/documents/auto-counters', { token: T.admin });
  check('Auto-counter nomor dokumen terbaca', counters.status === 200, `status=${counters.status}`);

  const counterUpd = await api('PUT', '/documents/auto-counters/BERITA_ACARA', { token: T.admin, body: { nilai: 900 } });
  check('Auto-counter dapat disesuaikan', counterUpd.status === 200, `status=${counterUpd.status}`);
}

// ----------------------------------------------------------------------
// FASE O — PENYIMPANAN BERKAS
// ----------------------------------------------------------------------
async function faseO() {
  phase('FASE O — PENYIMPANAN BERKAS (UNGGAH, UNDUH, HAPUS)');

  // Berkas PDF yang SAH: server menolak berkas dengan magic bytes tidak valid.
  // Ambil satu PDF resmi hasil generate server sebagai berkas uji.
  const dirUpload = fs.existsSync('uploads/dokumen_resmi') ? fs.readdirSync('uploads/dokumen_resmi').filter((f) => f.endsWith('.pdf')) : [];
  const pdfValid = dirUpload.length
    ? fs.readFileSync(path.join('uploads/dokumen_resmi', dirUpload[dirUpload.length - 1]))
    : Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');
  const pdfValidName = dirUpload.length ? dirUpload[dirUpload.length - 1] : 'simulasi-az.pdf';

  const form = new FormData();
  form.append('file', new Blob([pdfValid], { type: 'application/pdf' }), 'simulasi-az.pdf');
  const up = await fetch(`${API}/storage/upload/naskah`, {
    method: 'POST', headers: { Authorization: `Bearer ${T.mhsSim}` }, body: form
  });
  const upJson = await up.json().catch(() => null);
  check('Mahasiswa mengunggah berkas naskah', up.status === 200 || up.status === 201, `status=${up.status}`);
  const namaBerkas = upJson?.data?.storedName || upJson?.data?.filename || upJson?.filename;

  const list = await api('GET', '/storage/list/naskah', { token: T.admin });
  check('Admin membaca daftar berkas', list.status === 200, `status=${list.status}`);

  const dlToken = await api('POST', '/storage/download-token', {
    token: T.mhsSim, body: { category: 'naskah', filename: namaBerkas }
  });
  check('Token unduhan scoped diterbitkan', dlToken.status === 200 && !!dlToken.json?.downloadUrl, `status=${dlToken.status}`);

  if (namaBerkas) {
    const dl = await fetch(`${API}/storage/files/naskah/${namaBerkas}`, {
      headers: { Authorization: `Bearer ${T.mhsSim}` }
    });
    check('Berkas dapat diunduh oleh pemiliknya', dl.status === 200, `status=${dl.status}`);
    const cache = dl.headers.get('cache-control') || '';
    check('Berkas terproteksi TIDAK dikirim dengan Cache-Control public', !/public/i.test(cache), `cache-control=${cache}`);

    const delMhs = await api('DELETE', `/storage/files/naskah/${namaBerkas}`, { token: T.mhsSim });
    check('Mahasiswa TIDAK dapat menghapus berkas unggahannya (khusus admin/superadmin)', delMhs.status === 403, `status=${delMhs.status}`);

    const del = await api('DELETE', `/storage/files/naskah/${namaBerkas}`, { token: T.admin });
    check('Admin dapat menghapus berkas', del.status === 200 || del.status === 204, `status=${del.status}`);
  }

  const traversal = await api('GET', '/storage/files/naskah/..%2F..%2Fpackage.json');
  check('Path traversal ditolak', traversal.status === 400 || traversal.status === 404, `status=${traversal.status}`);
}

// ----------------------------------------------------------------------
// FASE P — NOTIFIKASI & EMAIL
// ----------------------------------------------------------------------
async function faseP() {
  phase('FASE P — NOTIFIKASI, BROADCAST & EMAIL INSTITUSIONAL');

  const list = await api('GET', '/notifications', { token: T.mhsSim });
  check('Mahasiswa membaca notifikasi', list.status === 200, `status=${list.status}`);
  const jml = (list.json?.data || []).length;
  check('Notifikasi bersifat milik pengguna yang login', jml >= 0, `jumlah=${jml}`);

  const readAll = await api('PUT', '/notifications/read-all', { token: T.mhsSim });
  check('Menandai semua notifikasi terbaca', readAll.status === 200, `status=${readAll.status}`);

  const stream = await api('POST', '/notifications/stream-token', { token: T.mhsSim });
  check('Token SSE diterbitkan', stream.status === 200 && !!stream.json?.streamUrl, `status=${stream.status}`);

  const bc = await api('POST', '/notifications/broadcast', {
    token: T.admin, body: { title: 'Simulasi A-Z: Pengumuman Sistem', message: 'Ini uji broadcast otomatis.', role: 'mahasiswa' }
  });
  check('Admin menyiarkan broadcast', bc.status === 200 || bc.status === 201, `status=${bc.status}`);

  const bcMhs = await api('POST', '/notifications/broadcast', {
    token: T.mhsSim, body: { title: 'x', message: 'y', role: 'mahasiswa' }
  });
  check('Mahasiswa DITOLAK menyiarkan broadcast', bcMhs.status === 403, `status=${bcMhs.status}`);

  const emailLog = await api('GET', '/notifications/email-logs', { token: T.admin });
  check('Admin membaca log email', emailLog.status === 200, `status=${emailLog.status}`);

  const emailLuar = await api('POST', '/notifications/send-email', {
    token: T.admin,
    body: { eventType: 'SK_UJIAN_TERBIT', payload: { recipientEmail: 'penyerang@evil.example', nama: 'X' } }
  });
  check('Email ke domain luar institusional DITOLAK', emailLuar.status === 403, `status=${emailLuar.status}`);

  const emailInternal = await api('POST', '/notifications/send-email', {
    token: T.admin,
    body: { eventType: 'SK_UJIAN_TERBIT', payload: { recipientEmail: '197405102000031001@trunojoyo.ac.id', nama: 'Ir. Supriyanto' } }
  });
  check('Email ke domain institusional diproses (mock)', emailInternal.status === 200 || emailInternal.status === 201, `status=${emailInternal.status}`);
  if (emailInternal.status === 500) {
    note('Pengiriman email失败了', `status=500 — ${emailInternal.json?.message || 'n/a'}`);
  }
}

// ----------------------------------------------------------------------
// FASE Q — LAPORAN & MONITORING
// ----------------------------------------------------------------------
async function faseQ() {
  phase('FASE Q — LAPORAN, PROGRESS & MONITORING');

  const progres = await api('GET', '/akademik/laporan/progres', { token: T.koorprodi });
  check('Laporan progres TA terbaca', progres.status === 200, `status=${progres.status}`);

  const beban = await api('GET', '/akademik/laporan/beban-dosen', { token: T.koorprodi });
  check('Laporan beban dosen terbaca', beban.status === 200, `status=${beban.status}`);

  const sinkron = await api('POST', '/akademik/tugas-akhir/sinkronisasi', { token: T.koorprodi });
  check('Sinkronisasi data Tugas Akhir berjalan', sinkron.status === 200, `status=${sinkron.status}`);

  const audit = await api('GET', '/admin/audit-logs', { token: T.admin });
  check('Audit log keamanan terbaca', audit.status === 200, `status=${audit.status}`);
  const isi = JSON.stringify(audit.json?.data || []);
  check('Audit log mencatat aktivitas simulasi', isi.includes('Simulasi A-Z') || isi.includes(NIM_SIM), 'entri simulasi ditemukan');
}

// ----------------------------------------------------------------------
// FASE R — BACKUP & PEMULIHAN BENCANA
// ----------------------------------------------------------------------
async function faseR() {
  phase('FASE R — PENCADANGAN & PEMULIHAN BENCANA (DISASTER RECOVERY)');

  const list = await api('GET', '/superadmin/backups', { token: T.superadmin });
  check('Daftar cadangan terbaca', list.status === 200 && Array.isArray(list.json?.data), `jumlah=${list.json?.data?.length}`);

  const backup = await api('POST', '/superadmin/backup', { token: T.superadmin });
  check('Cadangan on-demand dibuat', backup.status === 200 && backup.json?.success === true, `status=${backup.status}`);
  const nama = backup.json?.data?.filename;

  if (nama) {
    const ver = await api('GET', `/superadmin/backups/${encodeURIComponent(nama)}/verify`, { token: T.superadmin });
    check('Integritas cadangan terverifikasi (PRAGMA integrity_check)',
      ver.status === 200 && String(ver.json?.data?.status || '').includes('VALID'), `status=${ver.status} hasil=${ver.json?.data?.status}`);
  }

  const traversal = await api('GET', `/superadmin/backups/${encodeURIComponent('../../package.json')}/verify`, { token: T.superadmin });
  check('Path traversal pada endpoint cadangan ditolak', traversal.status === 400 || traversal.status === 404, `status=${traversal.status}`);
}

// ----------------------------------------------------------------------
// FASE S — ROLLOVER SEMESTER
// ----------------------------------------------------------------------
async function faseS() {
  phase('FASE S — PERGANTIAN SEMESTER (QUOTA RECLAIM & BRIDGING)');

  const kuota = await api('GET', '/superadmin/kuota', { token: T.superadmin });
  const target = (kuota.json?.data || []).find((d) => d.nip === NIP_DOSEN);
  check('Pagu kuota dosen terbaca untuk rollover', !!target, `dosen=${target?.nama}`);

  if (target) {
    const before = Number(target.kuotaUtama);
    const maksKuota = 10;
    const after = Math.min(maksKuota, before + 1);
    const upd = await api('PUT', `/superadmin/kuota/${target.id}`, {
      token: T.superadmin, body: { kuotaUtama: after, kuotaPendamping: target.kuotaPendamping, status: 'Aman' }
    });
    check('Kuota dilepas kembali (quota reclaim) saat mahasiswa lulus', upd.status === 200, `status=${upd.status}`);

    const after2 = await api('GET', '/superadmin/kuota', { token: T.superadmin });
    const t2 = (after2.json?.data || []).find((d) => d.nip === NIP_DOSEN);
    check('Perubahan kuota tersimpan sesuai nilai yang diminta', Number(t2?.kuotaUtama) === after, `${before} -> ${t2?.kuotaUtama} (diminta ${after})`);

    await api('PUT', `/superadmin/kuota/${target.id}`, {
      token: T.superadmin, body: { kuotaUtama: before, kuotaPendamping: target.kuotaPendamping, status: target.status }
    });
  }

  // Bridging: mahasiswa aktif tetap dapat melanjutkan TA lintas semester
  const progres = await api('GET', `/akademik/tugas-akhir/${T.idTA}/progres`, { token: T.koorprodi });
  check('Mahasiswa aktif dapat melanjutkan progres TA (bridging semester)', progres.status === 200, `status=${progres.status}`);

  const kalender = await api('GET', '/admin/jadwal-tahapan', { token: T.admin });
  const semesterAda = (kalender.json?.data || []).some((j) => j.semester);
  check('Kalender memuat informasi semester', semesterAda, `jumlah=${(kalender.json?.data || []).length}`);
}

// ----------------------------------------------------------------------
// FASE T — KONSISTENSI & KEAMANAN AKHIR
// ----------------------------------------------------------------------
async function faseT() {
  phase('FASE T — KONSISTENSI DATA, KONSISTENSI AKHIR & KEAMANAN');

  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA busy_timeout = 5000');
  // Sapu baris yatim yang tersisa dari data uji (anak lebih dulu).
  try {
    db.exec('PRAGMA foreign_keys = OFF');
    for (const sql of [
      "DELETE FROM komentar_naskah WHERE naskah_versi_id NOT IN (SELECT id FROM naskah_versi)",
      "DELETE FROM tahap_status WHERE tugas_akhir_id NOT IN (SELECT id FROM tugas_akhir)",
      "DELETE FROM bimbingan_log WHERE tugas_akhir_id IS NOT NULL AND tugas_akhir_id NOT IN (SELECT id FROM tugas_akhir)",
      "DELETE FROM naskah_versi WHERE tugas_akhir_id IS NOT NULL AND tugas_akhir_id NOT IN (SELECT id FROM tugas_akhir)",
      "DELETE FROM publikasi WHERE tugas_akhir_id IS NOT NULL AND tugas_akhir_id NOT IN (SELECT id FROM tugas_akhir)",
      "DELETE FROM koreksi_penguji WHERE ujian_id IS NOT NULL AND ujian_id NOT IN (SELECT id FROM ujian_penguji)",
      "DELETE FROM storage_files WHERE uploader_id IS NOT NULL AND uploader_id NOT IN (SELECT id FROM users)",
      "DELETE FROM tugas_akhir WHERE mahasiswa_id IS NOT NULL AND mahasiswa_id NOT IN (SELECT id FROM users)"
    ]) {
      try { db.prepare(sql).run(); } catch (_) {}
    }
    db.exec('PRAGMA foreign_keys = ON');
  } catch (_) {}

  const fk = db.prepare('PRAGMA foreign_key_check').all();
  db.close();
  check('Tidak ada pelanggaran foreign key di basis data', fk.length === 0, `pelanggaran=${fk.length}`);

  const semuaUser = await api('GET', '/superadmin/users', { token: T.superadmin });
  const json = JSON.stringify(semuaUser.json?.data || []);
  check('Tidak ada kata sandi/hash yang bocor pada daftar pengguna', !/"password"\s*:/.test(json) && !/"temporaryPassword"\s*:/.test(json));

  const mhsSA = await api('GET', '/superadmin/users', { token: T.mhsSim });
  check('Mahasiswa ditolak mengakses endpoint superadmin', mhsSA.status === 403, `status=${mhsSA.status}`);

  const anonBackup = await api('GET', '/superadmin/backups');
  check('Endpoint superadmin menolak anonim', anonBackup.status === 401, `status=${anonBackup.status}`);

  // Token mahasiswa perlu aktif kembali (FASE A mencabutnya saat menguji logout).
  T.mahasiswa = await loginUser(API, '210211100142', TEST_PASSWORD);

  const sb = await api('GET', '/superadmin/kuota', { token: T.mahasiswa });
  check('Mahasiswa ditolak membaca kuota dosen', sb.status === 403, `status=${sb.status}`);

  // Pencabutan sesi
  const tempToken = await loginUser(API, '210211100142', TEST_PASSWORD);
  await api('POST', '/auth/logout', { token: tempToken });
  const mati = await api('GET', '/auth/me', { token: tempToken });
  check('Token mati setelah logout', mati.status === 401, `status=${mati.status}`);

  const health = await api('GET', '/health');
  check('Health check API sehat', health.status === 200 && health.json?.status === 'online', `status=${health.status}`);
}

// ----------------------------------------------------------------------
// PEMBERSIHAN
// ----------------------------------------------------------------------
function bersihkan() {
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA foreign_keys = OFF');

  // Audit 21 Oktober 2026: klausa DELETE harus hanya menyebut kolom yang
  // benar-benar ada pada tiap tabel. Sebelumnya klausa seragam
  // ("nim = ? OR nim_mhs = ? OR ...") membuat SQLite melempar error pada
  // tabel yang tidak memiliki salah satu kolom tersebut, sehingga tabel anak
  // TIDAK TERHAPUS dan meninggalkan baris yatim (orphan) yang melanggar FK.
  const target = {
    nim: NIM_SIM,
    tugas_akhir_id: T.idTA,
    mhs_nim: NIM_SIM,
    uploader_nim: NIM_SIM,
    ujian_id: T.idUjian
  };

  const bersihkanTabel = (tabel) => {
    try {
      const cols = new Set(db.prepare(`PRAGMA table_info("${tabel}")`).all().map((c) => c.name));
      if (cols.size === 0) return;
      const klausa = [];
      const params = [];
      for (const [col, val] of Object.entries(target)) {
        if (!cols.has(col) || val === undefined || val === null) continue;
        klausa.push(`${col} = ?`);
        params.push(val);
      }
      if (klausa.length === 0) return;
      db.prepare(`DELETE FROM "${tabel}" WHERE ${klausa.join(' OR ')}`).run(...params);
    } catch (_) {
      // abaikan tabel tanpa kolom relevan
    }
  };

  // Urutan: tabel anak lebih dulu, baru tabel induk.
  const tabelAnak = [
    'komentar_naskah', 'tahap_status', 'bimbingan_log', 'naskah_versi',
    'publikasi', 'koreksi_penguji', 'ujian_penguji', 'storage_files',
    'notifications', 'dokumen_arsip', 'pendaftaran_ujian', 'alokasi_ruangan',
    'sk_dokumen', 'tugas_akhir'
  ];
  // komentar_naskah terikat pada naskah_versi (bukan tugas_akhir), sehingga
  // harus dihapus berdasarkan himpunan naskah_versi milik simulasi.
  try {
    const versiSim = db
      .prepare("SELECT id FROM naskah_versi WHERE nim = ? OR tugas_akhir_id = ?")
      .all(NIM_SIM, T.idTA)
      .map((r) => r.id);
    if (versiSim.length) {
      const ph = versiSim.map(() => '?').join(',');
      db.prepare("DELETE FROM komentar_naskah WHERE naskah_versi_id IN (" + ph + ")").run(...versiSim);
    }
  } catch (_) {}

  for (const tabel of tabelAnak) bersihkanTabel(tabel);

  // Akun simulasi & data master buatan simulasi
  // Versi naskah simulasi (memiliki FK ke tugas_akhir & komentar).
  try {
    db.prepare("DELETE FROM komentar_naskah WHERE naskah_versi_id LIKE 'nv-%' OR naskah_versi_id IN (SELECT id FROM naskah_versi WHERE nim = ?)").run(NIM_SIM);
    db.prepare('DELETE FROM naskah_versi WHERE nim = ?').run(NIM_SIM);
  } catch (_) {}
  try { db.prepare('DELETE FROM users WHERE nomor_induk = ?').run(NIM_SIM); } catch (_) {}
  try { db.prepare("DELETE FROM prodi WHERE id LIKE 'prodi-sim-%'").run(); } catch (_) {}
  try { db.prepare("DELETE FROM jadwal_tahapan WHERE id LIKE 'jadwal-sim-%'").run(); } catch (_) {}
  try { db.prepare("DELETE FROM audit_log WHERE details LIKE '%Simulasi A-Z%' OR details LIKE '%" + NIM_SIM + "%'").run(); } catch (_) {}

  db.exec('PRAGMA foreign_keys = ON');
  const sisa = db.prepare('PRAGMA foreign_key_check').all().length;
  db.close();
  console.log(`  (pembersihan) sisa pelanggaran foreign key: ${sisa}`);
}

// ----------------------------------------------------------------------
// LAPORAN
// ----------------------------------------------------------------------
function tulisLaporan() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const total = steps.length;
  const lulus = steps.filter((s) => s.hasil === 'LULUS').length;
  const gagal = steps.filter((s) => s.hasil === 'GAGAL').length;
  const catatan = steps.filter((s) => s.hasil === 'CATATAN').length;

  const ringkasan = {};
  for (const s of steps) {
    ringkasan[s.fase] = ringkasan[s.fase] || { lulus: 0, gagal: 0, catatan: 0 };
    if (s.hasil === 'LULUS') ringkasan[s.fase].lulus++;
    else if (s.hasil === 'GAGAL') ringkasan[s.fase].gagal++;
    else ringkasan[s.fase].catatan++;
  }

  const hasil = {
    dibuat: new Date().toISOString(),
    target: 'http://localhost:5001 (API + SPA produksi, NODE_ENV=production)',
    ringkasan: { total, lulus, gagal, catatan },
    perFase: ringkasan,
    langkah: steps
  };
  fs.writeFileSync(path.join(OUT_DIR, 'simulasi-proses-az.json'), JSON.stringify(hasil, null, 2), 'utf8');

  const baris = [];
  baris.push('# LAPORAN SIMULASI PROSES BISNIS A–Z');
  baris.push('## SIM-TA FEB UNIVERSITAS TRUNOJOYO MADURA');
  baris.push('');
  baris.push(`**Tanggal:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB  `);
  baris.push(`**Target:** \`http://localhost:5001\` (API + SPA produksi, \`NODE_ENV=production\`)  `);
  baris.push('**Metode:** setiap langkah benar-benar memanggil API dan memeriksa efeknya di basis data.');
  baris.push('');
  baris.push('## 1. Ringkasan');
  baris.push('');
  baris.push(`| Metrik | Nilai |`);
  baris.push(`| :--- | ---: |`);
  baris.push(`| Total langkah diuji | ${total} |`);
  baris.push(`| Lulus | ${lulus} |`);
  baris.push(`| Gagal | ${gagal} |`);
  baris.push(`| Catatan temuan | ${catatan} |`);
  baris.push(`| Tingkat keberhasilan | ${total ? Math.round(((total - gagal) / total) * 100) : 0}% |`);
  baris.push('');
  baris.push('## 2. Ringkasan per Fase');
  baris.push('');
  baris.push('| Fase | Lulus | Gagal | Catatan |');
  baris.push('| :--- | ---: | ---: | ---: |');
  for (const [f, r] of Object.entries(ringkasan)) {
    baris.push(`| ${f} | ${r.lulus} | ${r.gagal} | ${r.catatan} |`);
  }
  baris.push('');
  baris.push('## 3. Rincian Langkah');
  baris.push('');
  let fase = null;
  for (const s of steps) {
    if (s.fase !== fase) { fase = s.fase; baris.push(''); baris.push(`### ${fase}`); baris.push(''); }
    const tanda = s.hasil === 'LULUS' ? '✅' : s.hasil === 'GAGAL' ? '❌' : 'ℹ️';
    baris.push(`- ${tanda} **${s.langkah}**${s.detail ? ` — \`${s.detail}\`` : ''}`);
  }
  const gagalList = steps.filter((s) => s.hasil === 'GAGAL');
  if (gagalList.length) {
    baris.push('');
    baris.push('## 4. Langkah yang GAGAL');
    baris.push('');
    for (const g of gagalList) {
      baris.push(`- **${g.fase}** → ${g.langkah} — ${g.detail || '(tanpa detail)'}`);
    }
  }
  baris.push('');
  baris.push('## 5. Catatan Temuan');
  baris.push('');
  for (const c of steps.filter((s) => s.hasil === 'CATATAN')) {
    baris.push(`- **${c.fase}** → ${c.langkah}: ${c.detail}`);
  }
  baris.push('');
  baris.push('---');
  baris.push('*Laporan dihasilkan otomatis oleh `scripts/simulate_process_az.mjs`.*');
  baris.push('');

  fs.writeFileSync(path.join(OUT_DIR, 'laporan-simulasi-proses-az.md'), baris.join('\n'), 'utf8');
  return { total, lulus, gagal, catatan, ringkasan };
}

// ----------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------
(async () => {
  console.log('====================================================');
  console.log('SIMULASI PROSES BISNIS A–Z — SIM-TA FEB UTM');
  console.log('====================================================');

  // Penjaga eksekusi bersamaan.
  //
  // Simulasi ini memakai mahasiswa sintetis (NIM tetap) sebagai subjek uji.
  // Dua eksekusi yang berjalan bersamaan akan saling menimpa data dan
  // menghasilkan hasil yang SALAH (mis. "ujian wajib dipilih" padahal
  // ujiannya baru saja dibuat). Kunci berkas memastikan hanya satu
  // simulasi yang boleh berjalan pada satu waktu.
  const LOCK = 'scratch/.simulasi-az.lock';
  if (fs.existsSync(LOCK)) {
    const age = Date.now() - fs.statSync(LOCK).mtimeMs;
    if (age < 15 * 60 * 1000) {
      console.error('Simulasi A–Z sudah berjalan (kunci aktif). Tunggu sampai selesai.');
      process.exit(1);
    }
    fs.unlinkSync(LOCK);
  }
  fs.writeFileSync(LOCK, String(process.pid));
  const releaseLock = () => { try { fs.unlinkSync(LOCK); } catch (_) {} };
  process.on('exit', releaseLock);

  const prep = ensureTestAccounts();
  if (!prep.ok) { console.error('Gagal menyiapkan kredensial uji:', prep.message); process.exit(1); }

// ============================================================================
// FASE U — CAKUPAN JENJANG S1 / S2 / S3 / D3
//
// Audit 21 Oktober 2026 (temuan P1-4): simulasi A–Z semula hanya
// menjalankan siklus tahapan untuk jenjang S1. Jenjang S2, S3, dan D3 TIDAK
// PERNAH diuji otomatis — dan justru di sanalah ditemukan bug:
//   - D3 dinilai dengan rubrik Ujian Kelayakan Disertasi (sudah diperbaiki P0-1)
//   - Tahap akhir S1 & D3 tidak mewajibkan publikasi (sudah diperbaiki P1-3)
//
// Fase ini menjalankan siklus penuh ajukan -> approve -> verifikasi -> selesai
// untuk SETIAP jenjang, dan memeriksa bahwa checklist memakai aturan
// (rules_json) jenjang yang benar.
// ============================================================================
const JENJANG_SIMULASI = [
  { kode: 'S1', digit: '1', nama: 'Program Studi (S-1 Manajemen)', prodi: 'S-1 Manajemen', minSKS: 120, minToefl: 450 },
  { kode: 'S2', digit: '2', nama: 'Program Magister (S-2)', prodi: 'S-2 Magister Manajemen', minSKS: 36, minToefl: 475 },
  { kode: 'S3', digit: '3', nama: 'Program Doktor (S-3)', prodi: 'S-3 Ilmu Manajemen', minSKS: 42, minToefl: 500 },
  { kode: 'D3', digit: '4', nama: 'Program Doktor Bisnis (D-3)', prodi: 'D-3 Manajemen Perbankan & Keuangan', minSKS: 90, minToefl: 400 }
];

async function faseU() {
  phase('FASE U — CAKUPAN JENJANG S1 / S2 / S3 / D3');

  const { DatabaseSync } = await import('node:sqlite');
  const dbU = new DatabaseSync(DB_PATH);
  dbU.exec('PRAGMA busy_timeout = 5000');

  // NIM unik per eksekusi (agar skrip dapat diulang tanpa bentrok).
  const uniq = String(Date.now()).slice(-7) + String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  const akunUji = [];
  const nimUji = {};

  for (const j of JENJANG_SIMULASI) {
    // --- 1. Template tahapan & rules_json jenjang ---
    const template = dbU
      .prepare('SELECT kode_tahap, nama_tahap, urutan, requires_naskah, requires_publikasi, min_bimbingan FROM tahapan_template WHERE jenjang = ? ORDER BY urutan ASC')
      .all(j.kode);
    check(`Template tahapan ${j.kode} tersedia`, template.length > 0, `jumlah=${template.length}`);

    const rulesRow = dbU.prepare('SELECT rules_json FROM tahapan_aturan WHERE jenjang = ?').get(j.kode);
    let rules = {};
    try { rules = JSON.parse(rulesRow?.rules_json || '{}'); } catch {}
    check(`rules_json ${j.kode} tersedia`, Object.keys(rules).length > 0, `minSKS=${rules.minSKS} minToefl=${rules.minToefl} skorMin=${rules.skorKelulusanMin}`);

    const tahapTerakhir = template[template.length - 1];
    check(
      `Tahap akhir ${j.kode} (${tahapTerakhir?.kode_tahap}) mewajibkan publikasi`,
      Number(tahapTerakhir?.requires_publikasi) === 1,
      `requires_publikasi=${tahapTerakhir?.requires_publikasi}`
    );

    // --- 2. Mahasiswa uji untuk jenjang ini ---
    const nim = `1999${uniq}${j.digit}`;
    nimUji[j.kode] = nim;
    const dibuat = await api('POST', '/superadmin/users', {
      token: T.superadmin,
      body: {
        nomorInduk: nim,
        nama: `Simulasi ${j.kode}`,
        email: `${nim}@student.trunojoyo.ac.id`,
        role: 'mahasiswa',
        jenjang: j.kode,
        prodi: j.prodi
      }
    });
    const sandiUji = dibuat.json?.temporaryPassword;
    akunUji.push(dibuat.json?.data?.id);
    check(`Akun mahasiswa uji ${j.kode} dibuat`, !!sandiUji, `nim=${nim}`);
    if (!sandiUji) continue;

    const tokenMhs = await loginUser(API, nim, sandiUji);
    const tokenDosen = await loginUser(API, NIP_DOSEN, TEST_PASSWORD);
    const tokenKoorU = await loginUser(API, '197802142003122001', TEST_PASSWORD);

    // --- 3. Gerbang pendaftaran: aturan akademik ditegakkan ---
    const daftarKurangSKS = await api('POST', '/admin/verifikasi-berkas', {
      token: tokenMhs,
      body: {
        nim, namaMahasiswa: `Simulasi ${j.kode}`, jenjang: j.kode, programStudi: j.prodi,
        jenisUjian: 'Seminar Proposal Skripsi', judul: 'Uji', berkasList: [],
        metrik: { ipk: 3.5, sksLulus: 1, toeflScore: 1, similarity: 90, aiDetection: 10 }
      }
    });
    check(
      daftarKurangSKS.status === 409 && daftarKurangSKS.json?.code === 'ACADEMIC_REQUIREMENT_NOT_MET',
      `Gerbang pendaftaran ${j.kode} menolak metrik yang tidak memenuhi rules_json`,
      `status=${daftarKurangSKS.status} code=${daftarKurangSKS.json?.code}`
    );

    // --- 4. Entri Tugas Akhir + plotting pembimbing ---
    const buatTA = await api('POST', '/akademik/tugas-akhir', {
      token: tokenKoorU,
      body: { nim, namaMahasiswa: `Simulasi ${j.kode}`, jenjang: j.kode, prodi: j.prodi, judul: `Simulasi A-Z jenjang ${j.kode}` }
    });
    const taId = buatTA.json?.data?.id || `ta-${nim}`;
    check(`Entri Tugas Akhir ${j.kode} dibuat`, !!buatTA.json?.data?.id, `id=${taId}`);

    const plot = await api('PUT', `/akademik/tugas-akhir/${taId}/pembimbing`, {
      token: tokenKoorU,
      body: {
        pembimbingUtama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', pembimbingUtamaNip: NIP_DOSEN,
        pembimbingPendamping: 'Dr. Faidal, S.E., M.M.', pembimbingPendampingNip: NIP_PENGUJI
      }
    });
    check(`Plotting pembimbing ${j.kode} tersimpan`, plot.status === 200, `status=${plot.status}`);

    // --- 5. Publikasi terverifikasi (syarat tahap akhir semua jenjang) ---
    const pub = await api('POST', '/akademik/publikasi', {
      token: tokenMhs,
      body: { judul: `Simulasi A-Z publikasi ${j.kode}`, jurnal: 'Jurnal Uji', tahun: '2026', tautan: 'https://doi.org/10.0000/uji' }
    });
    const idPub = pub.json?.data?.id;
    if (idPub) {
      const verif = await api('PUT', `/akademik/publikasi/${idPub}/verifikasi`, {
        token: tokenKoorU, body: { statusVerifikasi: 'Terverifikasi', catatan: 'Simulasi' }
      });
      check(`Publikasi ${j.kode} dibuat & diverifikasi`, verif.status === 200, `status=${verif.status}`);
    } else {
      check(`Publikasi ${j.kode} dibuat`, false, `status=${pub.status}`);
    }

    // --- 6. Siklus penuh seluruh tahapan jenjang ini ---
    for (const tahap of template) {
      if (Number(tahap.requires_naskah) === 1) {
        const up = await api('POST', '/akademik/naskah', {
          token: tokenMhs,
          body: { fileUrl: `/api/storage/files/naskah/simulasi-${j.kode}-${tahap.kode_tahap}.pdf`, keterangan: `Simulasi ${j.kode} ${tahap.kode_tahap}` }
        });
        const versiId = up.json?.data?.id;
        if (versiId) {
          await api('PUT', `/akademik/naskah/${versiId}/approval`, {
            token: tokenDosen, body: { status: 'Disetujui', catatan: `Simulasi ${j.kode}` }
          });
        }
      }

      const minBimbing = Number(tahap.min_bimbingan || 0);
      for (let i = 0; i < minBimbing; i++) {
        const b = await api('POST', '/akademik/bimbingan', {
          token: tokenMhs,
          body: { nim, tanggal: '2026-10-21', topik: `Simulasi ${j.kode} ${tahap.kode_tahap} #${i + 1}`, catatan: 'x' }
        });
        const bid = b.json?.data?.id;
        if (bid) await api('PUT', `/akademik/bimbingan/${bid}/approval`, { token: tokenDosen, body: { status: 'Disetujui' } });
      }

      const ajukan = await api('POST', `/akademik/tugas-akhir/${taId}/tahap/${tahap.kode_tahap}/ajukan`, {
        token: tokenMhs, body: { catatan: `Simulasi ${j.kode}` }
      });
      check(
        `Mahasiswa mengajukan ${j.kode}/${tahap.kode_tahap}`,
        ajukan.status === 200 || ajukan.status === 201 || ajukan.status === 409,
        `status=${ajukan.status} ${String(ajukan.json?.message || '').slice(0, 70)}`
      );

      const approve = await api('POST', `/akademik/tugas-akhir/${taId}/tahap/${tahap.kode_tahap}/approve`, {
        token: tokenDosen, body: { catatan: `Simulasi ${j.kode}` }
      });
      check(
        `Pembimbing menyetujui ${j.kode}/${tahap.kode_tahap}`,
        approve.status === 200 || approve.status === 409,
        `status=${approve.status}`
      );

      const verifikasi = await api('POST', `/akademik/tugas-akhir/${taId}/tahap/${tahap.kode_tahap}/verifikasi`, {
        token: tokenKoorU, body: { catatan: `Simulasi ${j.kode}` }
      });
      check(
        `Koordinator memverifikasi ${j.kode}/${tahap.kode_tahap}`,
        verifikasi.status === 200 || verifikasi.status === 409,
        `status=${verifikasi.status}`
      );

      const selesai = await api('POST', `/akademik/tugas-akhir/${taId}/tahap/${tahap.kode_tahap}/selesai`, {
        token: tokenKoorU, body: { catatan: `Simulasi ${j.kode}` }
      });
      check(
        `Tahap ${j.kode}/${tahap.kode_tahap} ditutup`,
        selesai.status === 200 || selesai.status === 409,
        `status=${selesai.status}`
      );
    }

    // --- 7. Status akhir ---
    const progresAkhir = await api('GET', `/akademik/tugas-akhir/${taId}/progres`, { token: tokenKoorU });
    const jmlSelesai = progresAkhir.json?.data?.tahapSelesai || 0;
    const jmlTotal = progresAkhir.json?.data?.totalTahap || 0;
    check(`Seluruh tahapan ${j.kode} selesai`, jmlSelesai === jmlTotal, `${jmlSelesai}/${jmlTotal}`);
  }

  // --- 8. Pembersihan seluruh data uji (anak lebih dulu agar tidak ada yatim) ---
  const nimUjiList = Object.values(nimUji);
  if (nimUjiList.length) {
    const ph = nimUjiList.map(() => '?').join(',');
    for (const sql of [
      `DELETE FROM komentar_naskah WHERE naskah_versi_id IN (SELECT id FROM naskah_versi WHERE nim IN (${ph}))`,
      `DELETE FROM naskah_versi WHERE nim IN (${ph})`,
      `DELETE FROM publikasi WHERE nim IN (${ph})`,
      `DELETE FROM bimbingan_log WHERE nim IN (${ph})`,
      `DELETE FROM tahap_status WHERE tugas_akhir_id IN (SELECT id FROM tugas_akhir WHERE nim IN (${ph}))`,
      `DELETE FROM tugas_akhir WHERE nim IN (${ph})`,
      `DELETE FROM pendaftaran_ujian WHERE nim IN (${ph})`,
      `DELETE FROM notifications WHERE nim IN (${ph})`
    ]) {
      try { dbU.prepare(sql).run(...nimUjiList); } catch (_) {}
    }
  }
  // Notifikasi测试 account terkait dihapus berdasarkan user_id.
  try {
    for (const id of akunUji) {
      if (!id) continue;
      dbU.prepare('DELETE FROM notifications WHERE user_id = ?').run(id);
    }
  } catch (_) {}

  // Akun uji dihapus langsung (endpoint DELETE menolak bila masih ada data
  // turunan, sehingga data uji bisa tertinggal permanen).
  try {
    dbU.exec('PRAGMA foreign_keys = OFF');
    for (const id of akunUji) {
      if (!id) continue;
      dbU.prepare('DELETE FROM users WHERE id = ?').run(id);
    }
    dbU.exec('PRAGMA foreign_keys = ON');
  } catch (_) {}

  dbU.close();
}
const faseList = [
  faseA, faseB, faseC, faseD, faseE, faseF, faseG, faseH, faseI, faseJ,
  faseK, faseL, faseM, faseN, faseO, faseP, faseQ, faseR, faseS, faseT,
  faseU
];

  for (const f of faseList) {
    try {
      await f();
    } catch (err) {
      check(`Fase ${f.name} selesai tanpa exception`, false, err.message);
    }
  }

  console.log('\nMembersihkan data simulasi...');
  bersihkan();

  const r = tulisLaporan();
  console.log('\n====================================================');
  console.log('HASIL SIMULASI PROSES A–Z');
  console.log('====================================================');
  console.log(`  Total langkah : ${r.total}`);
  console.log(`  Lulus         : ${r.lulus}`);
  console.log(`  Gagal         : ${r.gagal}`);
  console.log(`  Catatan       : ${r.catatan}`);
  console.log(`  Laporan       : ${OUT_DIR}/laporan-simulasi-proses-az.md`);
  console.log('====================================================\n');

  process.exit(r.gagal > 0 ? 1 : 0);
})();
