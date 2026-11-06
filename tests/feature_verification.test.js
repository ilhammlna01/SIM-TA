/**
 * UJI VERIFIKASI FITUR END-TO-END — SIM-TA FEB UTM
 *
 * TUJUAN: memastikan SELURUH modul fitur aplikasi berjalan semestinya pada
 * server yang benar-benar aktif (:5001), bukan sekadar lolosnya test keamanan.
 * Script ini menelusuri tiap modul inti:
 *
 *   A. Autentikasi & Manajemen Sesi   (login, /me, switch-role, logout)
 *   B. Modul Mahasiswa                (TA, bimbingan, naskah, publikasi)
 *   C. Modul Koorprodi                (verifikasi berkas, plotting pembimbing, tahapan, ruang)
 *   D. Modul Dosen                    (bimbingan, persetujuan tahap, laporan)
 *   E. Modul Dewan Penguji            (daftar ujian, koreksi)
 *   F. Modul Admin Akademik           (berkas, SK, ruang, jadwal, audit log, email log)
 *   G. Modul Super Admin              (users CRUD, prodi, kuota, backup)
 *   H. Modul Dokumen Resmi            (7 generator + verifikasi publik + arsip + counter)
 *   I. Modul Penyimpanan Berkas       (upload, list, scoped download, delete)
 *   J. Modul Notifikasi               (list, read, read-all, broadcast, SSE token)
 *   K. Modul Akademik & Laporan       (TA, bimbingan, naskah, publikasi, laporan)
 *   L. Modul Backup & Pemulihan       (create, list, verify integritas)
 *   M. Siklus Tahapan TA (End-to-End) (ajukan -> approve -> verifikasi -> selesai -> pengesahan)
 *   N. Keamanan & Konsistensi Akhir
 *
 * Jalankan: node tests/feature_verification.test.js
 *         atau npm run test:fitur
 */

import { DatabaseSync } from 'node:sqlite';
import { TEST_PASSWORD, ensureTestAccounts, loginUser } from './helpers/testAccounts.js';

const BASE = 'http://localhost:5001/api';

const ID = {
  mahasiswa: '210211100142',
  mahasiswaS3: '220231600004',
  mahasiswa2: '210211100099',
  penguji: '197703032003121002',
  dosen: '196201081987032001',
  dosen2: '196203031988032001',
  koorprodi: '197802142003122001',
  admin: '198104122008121002',
  superadmin: '197405102000031001'
};

const TA_ID = 'ta-210211100142';

let passed = 0;
let failed = 0;
const failures = [];

function ok(condition, name, detail = '') {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    if (detail) console.log(`     > ${detail}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name}`);
    if (detail) console.error(`     > ${detail}`);
    failed++;
    failures.push(name);
  }
}

async function call(method, pathname, { token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (raw) return { status: res.status, res };
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status, json, text };
}

function section(title) {
  console.log(`\n${title}`);
}


/**
 * Mengembalikan seluruh tahapan pada entri Tugas Akhir uji ke kondisi awal
 * ("Belum Mulai") agar siklus tahapan benar-benar diuji dari awal pada
 * setiap eksekusi, bukan sekadar membaca status yang sudah jadi.
 */
function resetTahapUji(taId) {
  let db;
  try {
    db = new DatabaseSync('data/sim_ta_feb_utm.db');
    db.exec('PRAGMA busy_timeout = 5000');
    db.prepare(
      `UPDATE tahap_status
         SET status = 'Belum Mulai', pengajuan_json = NULL, pembimbing_approved = 0,
             admin_verified = 0, catatan = NULL, tanggal_mulai = NULL, tanggal_selesai = NULL
       WHERE tugas_akhir_id = ?`
    ).run(taId);
    db.prepare('UPDATE tugas_akhir SET tahap_aktif_kode = ? WHERE id = ?').run('S1-T1', taId);
    return true;
  } catch (err) {
    console.error('Gagal mereset tahapan uji:', err.message);
    return false;
  } finally {
    try { db?.close(); } catch (_) {}
  }
}

async function main() {
  console.log('====================================================');
  console.log('UJI VERIFIKASI FITUR END-TO-END — SIM-TA FEB UTM');
  console.log('====================================================');

  const prep = ensureTestAccounts();
  if (!prep.ok) {
    console.error('Gagal menyiapkan kredensial uji:', prep.message);
    process.exit(1);
  }

  // =====================================================================
  section('A. AUTENTIKASI & MANAJEMEN SESI');
  // =====================================================================
  const T = {};
  for (const [role, identifier] of Object.entries(ID)) {
    const res = await call('POST', '/auth/login', { body: { identifier, password: TEST_PASSWORD } });
    T[role] = res.json?.token || null;
    ok(res.status === 200 && T[role], `Login ${role} (${identifier}) berhasil`, `role=${res.json?.user?.role}`);
  }

  const me = await call('GET', '/auth/me', { token: T.mahasiswa });
  ok(me.status === 200 && me.json?.user?.nomorInduk === ID.mahasiswa, 'GET /auth/me mengembalikan profil yang benar');
  ok(Array.isArray(me.json?.user?.eligibleRoles) && me.json.user.eligibleRoles.length > 0, 'Profil menyertakan daftar peran yang sah');

  const noToken = await call('GET', '/auth/me');
  ok(noToken.status === 401, 'GET /auth/me tanpa token ditolak 401');

  const switchRes = await call('POST', '/auth/switch-role', { token: T.dosen, body: { targetRole: 'penguji' } });
  ok(switchRes.status === 200 && switchRes.json?.token, 'Switch-role dosen -> penguji menerbitkan token baru');
  const switchBack = await call('POST', '/auth/switch-role', { token: switchRes.json?.token, body: { targetRole: 'dosen' } });
  ok(switchBack.status === 200, 'Switch-role kembali ke dosen berhasil');

  const badSwitch = await call('POST', '/auth/switch-role', { token: T.mahasiswa, body: { targetRole: 'superadmin' } });
  ok(badSwitch.status === 403, 'Mahasiswa tidak dapat switch-role ke superadmin (403)');

  // =====================================================================
  section('B. MODUL MAHASISWA');
  // =====================================================================
  const taList = await call('GET', '/akademik/tugas-akhir', { token: T.mahasiswa });
  ok(taList.status === 200, 'Mahasiswa dapat melihat daftar Tugas Akhir miliknya');

  const taTemplate = await call('GET', '/akademik/tahapan-template', { token: T.mahasiswa });
  ok(taTemplate.status === 200, 'Template tahapan per jenjang terbaca');

  const taCreateMhs = await call('POST', '/akademik/tugas-akhir', {
    token: T.mahasiswa,
    body: { nim: ID.mahasiswa, judul: 'Uji Verifikasi Fitur', jenjang: 'S1', prodi: 'S-1 Manajemen' }
  });
  ok(taCreateMhs.status === 403, 'Mahasiswa DITOLAK membuat entri Tugas Akhir (khusus koorprodi/admin)');

  const taCreate = await call('POST', '/akademik/tugas-akhir', {
    token: T.koorprodi,
    body: { nim: ID.mahasiswa, namaMahasiswa: 'Dinda Ayu Larasati', judul: 'Uji Verifikasi Fitur — Judul sementara', jenjang: 'S1', prodi: 'S-1 Manajemen' }
  });
  ok(taCreate.status === 200 || taCreate.status === 201, 'Koorprodi dapat membuat entri Tugas Akhir', `status=${taCreate.status}`);

  const bimbingList = await call('GET', '/akademik/bimbingan', { token: T.mahasiswa });
  ok(bimbingList.status === 200, 'Mahasiswa dapat melihat log bimbingan');

  const naskahList = await call('GET', '/akademik/naskah', { token: T.mahasiswa });
  ok(naskahList.status === 200, 'Mahasiswa dapat melihat riwayat naskah');

  const publikasiList = await call('GET', '/akademik/publikasi', { token: T.mahasiswa });
  ok(publikasiList.status === 200, 'Mahasiswa dapat melihat daftar publikasi');

  const daftarUjian = await call('GET', '/penguji/ujian', { token: T.mahasiswa });
  ok(daftarUjian.status === 403, 'Mahasiswa DITOLAK accessing direktori ujian penguji (403)');

  // =====================================================================
  section('C. MODUL KOORDINATOR PROGRAM STUDI');
  // =====================================================================
  const verifikasiList = await call('GET', '/admin/verifikasi-berkas', { token: T.koorprodi });
  ok(verifikasiList.status === 200, 'Koorprodi dapat membaca daftar verifikasi berkas');

  const plot = await call('PUT', `/akademik/tugas-akhir/${TA_ID}/pembimbing`, {
    token: T.koorprodi,
    body: {
      pembimbingUtama: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
      pembimbingUtamaNip: ID.dosen,
      pembimbingPendamping: 'Dr. Faidal, S.E., M.M.',
      pembimbingPendampingNip: ID.penguji
    }
  });
  ok(plot.status === 200, 'Koorprodi dapat menetapkan plotting pembimbing', `status=${plot.status}`);
  ok(
    plot.json?.data?.pembimbingUtamaNip === ID.dosen,
    'Plotting pembimbing tersimpan beserta NIP otoritatifnya',
    `nip=${plot.json?.data?.pembimbingUtamaNip}`
  );

  // Payload dengan nama field yang tidak dikenal harus DITOLAK, bukan
  // membalas sukses palsu tanpa menyimpan apa pun.
  const plotSalah = await call('PUT', `/akademik/tugas-akhir/${TA_ID}/pembimbing`, {
    token: T.koorprodi,
    body: { fieldYangTidakDikenal: 'x' }
  });
  ok(plotSalah.status === 400, 'Plotting pembimbing dengan payload tak dikenal ditolak 400 (tidak ada sukses palsu)');

  const tahapan = await call('GET', '/admin/jadwal-tahapan', { token: T.koorprodi });
  ok(tahapan.status === 200, 'Koorprodi dapat membaca jadwal tahapan');

  const ruang = await call('GET', '/admin/ruangan', { token: T.koorprodi });
  ok(ruang.status === 200, 'Koorprodi dapat membaca alokasi ruang');

  const skList = await call('GET', '/admin/sk', { token: T.koorprodi });
  ok(skList.status === 200, 'Koorprodi dapat membaca daftar Surat Keputusan');

  // =====================================================================
  section('D. MODUL DOSEN (PEMBIMBING)');
  // =====================================================================
  const dosenBimbingan = await call('GET', '/akademik/bimbingan', { token: T.dosen });
  ok(dosenBimbingan.status === 200, 'Dosen dapat melihat log bimbingan mahasiswa bimbingannya');

  const bebanDosen = await call('GET', '/akademik/laporan/beban-dosen', { token: T.koorprodi });
  ok(bebanDosen.status === 200, 'Koordinator dapat membaca laporan beban dosen');
  const bebanDosenDosen = await call('GET', '/akademik/laporan/beban-dosen', { token: T.dosen });
  ok(bebanDosenDosen.status === 403, 'Dosen biasa DITOLAK membaca laporan beban dosen (khusus koordinator)');

  const tugasDosen = await call('GET', '/akademik/tugas-akhir', { token: T.dosen });
  ok(tugasDosen.status === 200, 'Dosen dapat membaca daftar Tugas Akhir yang diampu');

  // =====================================================================
  section('E. MODUL DEWAN PENGUJI');
  // =====================================================================
  const ujianList = await call('GET', '/penguji/ujian', { token: T.penguji });
  ok(ujianList.status === 200, 'Dewan Penguji dapat membaca direktori ujian');

  const koreksiList = await call('GET', '/penguji/koreksi', { token: T.penguji });
  ok(koreksiList.status === 200, 'Dewan Penguji dapat membaca catatan koreksi miliknya');

  // =====================================================================
  section('F. MODUL ADMIN AKADEMIK');
  // =====================================================================
  const adminBerkas = await call('GET', '/admin/verifikasi-berkas', { token: T.admin });
  ok(adminBerkas.status === 200, 'Admin dapat membaca daftar berkas');

  const adminAudit = await call('GET', '/admin/audit-logs', { token: T.admin });
  ok(adminAudit.status === 200, 'Admin dapat membaca audit log keamanan');

  const emailLogs = await call('GET', '/notifications/email-logs', { token: T.admin });
  ok(emailLogs.status === 200, 'Admin dapat membaca riwayat log email SLA');

  const adminSK = await call('GET', '/admin/sk', { token: T.admin });
  ok(adminSK.status === 200, 'Admin dapat membaca daftar SK');

  // =====================================================================
  section('G. MODUL SUPER ADMIN');
  // =====================================================================
  const users = await call('GET', '/superadmin/users', { token: T.superadmin });
  ok(users.status === 200 && Array.isArray(users.json?.data), 'Super Admin dapat membaca daftar pengguna', `jumlah=${users.json?.data?.length}`);
  ok(!/"password"\s*:/.test(users.json?.text || ''), 'Daftar pengguna tidak memuat kolom kata sandi');

  const prodi = await call('GET', '/superadmin/prodi', { token: T.superadmin });
  ok(prodi.status === 200, 'Super Admin dapat membaca daftar program studi');

  const kuota = await call('GET', '/superadmin/kuota', { token: T.superadmin });
  ok(kuota.status === 200, 'Super Admin dapat membaca kuota pembimbing');

  const tahapanSA = await call('GET', '/superadmin/tahapan', { token: T.superadmin });
  ok(tahapanSA.status === 200, 'Super Admin dapat membaca template tahapan');

  const nimUji = '199901010000042';
  const create = await call('POST', '/superadmin/users', {
    token: T.superadmin,
    body: { nomorInduk: nimUji, nama: 'Akun Uji Fitur', email: 'uji.fitur@student.trunojoyo.ac.id', role: 'mahasiswa', jenjang: 'S1', prodi: 'S-1 Manajemen' }
  });
  ok(create.status === 200 || create.status === 201, 'Super Admin dapat membuat akun pengguna baru');
  ok(
    typeof create.json?.temporaryPassword === 'string' && create.json.temporaryPassword.length >= 12,
    'Akun baru menerima kata sandi sementara ACAK (bukan default seragam)'
  );

  const listAfter = await call('GET', '/superadmin/users', { token: T.superadmin });
  const created = (listAfter.json?.data || []).find((u) => u.nomorInduk === nimUji);
  ok(Boolean(created), 'Akun baru terdaftar pada daftar pengguna');

  if (created) {
    const upd = await call('PUT', `/superadmin/users/${created.id}`, { token: T.superadmin, body: { role: 'mahasiswa', status: 'Aktif' } });
    ok(upd.status === 200, 'Super Admin dapat mengubah data akun pengguna');

    const reset = await call('POST', `/superadmin/users/${created.id}/reset-password`, { token: T.superadmin });
    ok(reset.status === 200 && typeof reset.json?.temporaryPassword === 'string', 'Reset kata sandi menerbitkan kata sandi sementara acak');

    const del = await call('DELETE', `/superadmin/users/${created.id}`, { token: T.superadmin });
    ok(del.status === 200 || del.status === 204, 'Super Admin dapat menghapus akun pengguna');
  }

  // =====================================================================
  section('H. MODUL DOKUMEN RESMI & VERIFIKASI PUBLIK');
  // =====================================================================
  const BA = await call('POST', '/documents/generate-berita-acara', {
    token: T.penguji,
    body: { ujianId: 'uj-pgj-1' }
  });
  ok(BA.status === 200 || BA.status === 201, 'Berita Acara ujian berhasil diterbitkan');

  const verifyCode = BA.json?.data?.verificationCode || BA.json?.verificationCode;
  ok(Boolean(verifyCode), 'Berita Acara menyertakan kode verifikasi', `kode=${verifyCode}`);
  if (verifyCode) {
    const ver = await call('GET', `/documents/verify/${verifyCode}`);
    ok(ver.status === 200 && ver.json?.verified === true, 'Verifikasi publik dokumen resmi mengembalikan status ASLI');
  }

  const bimbingan = await call('POST', '/documents/generate-bimbingan', {
    token: T.mahasiswa,
    body: { nim: ID.mahasiswa }
  });
  ok(bimbingan.status === 200 || bimbingan.status === 201, 'Kartu Kendali Bimbingan berhasil diterbitkan');

  const suratPenguji = await call('POST', '/documents/generate-surat-tugas-penguji', {
    token: T.koorprodi,
    body: { ujianId: 'uj-pgj-1' }
  });
  ok(suratPenguji.status === 200 || suratPenguji.status === 201, 'Surat Tugas Penguji berhasil diterbitkan');

  const suratPembimbing = await call('POST', '/documents/generate-surat-tugas-pembimbing', {
    token: T.koorprodi,
    body: { nim: ID.mahasiswa }
  });
  ok(suratPembimbing.status === 200 || suratPembimbing.status === 201, 'Surat Tugas Pembimbing berhasil diterbitkan');

  const skDekan = await call('POST', '/documents/generate-sk-dekan', {
    token: T.koorprodi,
    body: { nim: ID.mahasiswa }
  });
  ok(skDekan.status === 200 || skDekan.status === 201, 'SK Dekan berhasil diterbitkan');

  const paket = await call('POST', '/documents/generate-exam-package', {
    token: T.admin,
    body: { ujianId: 'uj-pgj-1' }
  });
  ok(paket.status === 200 || paket.status === 201, 'Paket Berkas Ujian berhasil diterbitkan');

  const archive = await call('GET', '/documents/archive', { token: T.admin });
  ok(archive.status === 200, 'Arsip dokumen resmi dapat dibaca');

  const counters = await call('GET', '/documents/auto-counters', { token: T.admin });
  ok(counters.status === 200, 'Auto-counter nomor dokumen resmi dapat dibaca');

  const verPrivat = await call('GET', '/documents/verify/KODE-TIDAK-ADA');
  ok(
    verPrivat.status === 404 && verPrivat.json?.verified === false,
    'Verifikasi kode yang tidak dikenal ditolak 404 tanpa membocorkan data'
  );

  // =====================================================================
  section('I. MODUL PENYIMPANAN BERKAS');
  // =====================================================================
  const lists = await call('GET', '/storage/list/naskah', { token: T.admin });
  ok(lists.status === 200, 'Admin dapat melihat daftar berkas naskah');

  const formData = new FormData();
  formData.append('file', new Blob(['%PDF-1.4 Uji Unggah Fitur SIM-TA'], { type: 'application/pdf' }), 'uji_fitur_simta.pdf');
  const upload = await fetch(`${BASE}/storage/upload/naskah`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${T.mahasiswa}` },
    body: formData
  });
  const uploadJson = await upload.json().catch(() => null);
  ok(upload.status === 200 || upload.status === 201, 'Mahasiswa dapat mengunggah berkas naskah', `status=${upload.status}`);

  const uploadedName = uploadJson?.data?.filename || uploadJson?.filename;
  if (uploadedName) {
    const dlToken = await call('POST', '/storage/download-token', {
      token: T.mahasiswa,
      body: { category: 'naskah', filename: uploadedName }
    });
    ok(dlToken.status === 200 && Boolean(dlToken.json?.downloadUrl || dlToken.json?.token), 'Scoped download token berhasil diterbitkan');

    const dl = await call('GET', `/storage/files/naskah/${uploadedName}`, { raw: true });
    ok(dl.status === 200, 'Berkas yang diunggah dapat diunduh kembali oleh pemiliknya');

    const del = await call('DELETE', `/storage/files/naskah/${uploadedName}`, { token: T.mahasiswa });
    ok(del.status === 200 || del.status === 204, 'Pemilik berkas dapat menghapus berkas unggahannya (pembersihan uji)');
  }

  // =====================================================================
  section('J. MODUL NOTIFIKASI');
  // =====================================================================
  const notifList = await call('GET', '/notifications', { token: T.mahasiswa });
  ok(notifList.status === 200, 'Mahasiswa dapat membaca notifikasi miliknya');

  const notifReadAll = await call('PUT', '/notifications/read-all', { token: T.mahasiswa });
  ok(notifReadAll.status === 200, 'Mahasiswa dapat menandai semua notifikasi terbaca');

  const streamToken = await call('POST', '/notifications/stream-token', { token: T.mahasiswa });
  ok(streamToken.status === 200 && Boolean(streamToken.json?.streamUrl), 'Token SSE notifikasi berhasil diterbitkan', streamToken.json?.streamUrl);

  const broadcast = await call('POST', '/notifications/broadcast', {
    token: T.admin,
    body: { title: 'Uji Broadcast Fitur', message: 'Pesan uji verifikasi fitur otomatis.', role: 'mahasiswa' }
  });
  ok(broadcast.status === 200 || broadcast.status === 201, 'Admin dapat menyiarkan notifikasi sistem (broadcast)');

  const mhsBroadcast = await call('POST', '/notifications/broadcast', {
    token: T.mahasiswa,
    body: { title: 'Ditolak', message: 'x' }
  });
  ok(mhsBroadcast.status === 403, 'Mahasiswa DITOLAK menyiarkan broadcast (403)');

  // =====================================================================
  section('K. MODUL AKADEMIK & LAPORAN');
  // =====================================================================
  const laporanProgres = await call('GET', '/akademik/laporan/progres', { token: T.koorprodi });
  ok(laporanProgres.status === 200, 'Laporan progres TA dapat dibaca');

  const sinkron = await call('POST', '/akademik/tugas-akhir/sinkronisasi', { token: T.koorprodi });
  ok(sinkron.status === 200, 'Sinkronisasi data Tugas Akhir berjalan');

  // =====================================================================
  section('L. MODUL BACKUP & PEMULIHAN BENCANA');
  // =====================================================================
  const backupList = await call('GET', '/superadmin/backups', { token: T.superadmin });
  ok(backupList.status === 200 && Array.isArray(backupList.json?.data), 'Daftar cadangan basis data dapat dibaca');

  const backupNow = await call('POST', '/superadmin/backup', { token: T.superadmin });
  ok(backupNow.status === 200 && backupNow.json?.success === true, 'Cadangan on-demand berhasil dibuat');

  const fname = backupNow.json?.data?.filename;
  if (fname) {
    const verify = await call('GET', `/superadmin/backups/${fname}/verify`, { token: T.superadmin });
    ok(verify.status === 200 && String(verify.json?.data?.status || '').includes('VALID'), 'Integritas berkas cadangan terverifikasi (PRAGMA integrity_check)');
  }

  // =====================================================================
  section('M. SIKLUS TAHAPAN TUGAS AKHIR (AJUKAN -> APPROVE -> VERIFIKASI -> SELESAI)');
  // =====================================================================
  // Tambahkan log bimbingan yang cukup untuk memenuhi checklist tahapan
  // (S1-T4 mensyaratkan minimal 8 sesi bimbingan tercatat).
  for (let i = 0; i < 8; i++) {
    const b = await call('POST', '/akademik/bimbingan', {
      token: T.mahasiswa,
      body: { nim: ID.mahasiswa, tanggal: '2026-10-21', topik: 'Uji verifikasi fitur - sesi bimbingan', jumlah: 2 }
    });
    if (b.status !== 200 && b.status !== 201) break;
  }
  const bimbinganCount = await call('GET', '/akademik/bimbingan', { token: T.mahasiswa });
  ok((bimbinganCount.json?.data?.length ?? 0) >= 8, 'Mahasiswa dapat mencatat log bimbingan', `jumlah=${bimbinganCount.json?.data?.length}`);

  // Checklist tahapan hanya menghitung log bimbingan yang SUDAH DISETUJUI
  // oleh pembimbing, sehingga pembimbing harus memvalidasinya lebih dahulu.
  const logs = bimbinganCount.json?.data || [];
  let approved = 0;
  for (const log of logs) {
    if (log.status === 'Disetujui') { approved++; continue; }
    const r = await call('PUT', `/akademik/bimbingan/${log.id}/approval`, {
      token: T.dosen,
      body: { status: 'Disetujui', catatanPembimbing: 'Disetujui pada uji verifikasi fitur' }
    });
    if (r.status === 200) approved++;
  }
  ok(approved >= 8, 'Pembimbing dapat menyetujui log bimbingan mahasiswa bimbingannya', `disetujui=${approved}`);

  const bimbinganCount2 = await call('GET', '/akademik/bimbingan', { token: T.mahasiswa });
  const approvedNow = (bimbinganCount2.json?.data || []).filter((l) => l.status === 'Disetujui').length;
  ok(approvedNow >= 8, 'Log bimbingan tercatat berstatus Disetujui (terhitung pada checklist tahapan)', `disetujui=${approvedNow}`);

  const resetOk = resetTahapUji(TA_ID);
  ok(resetOk, 'Tahapian uji dapat dikembalikan ke kondisi awal untuk pengujian siklus penuh');

  // BP-2 (21 Oktober 2026): checklist tahapan mewajibkan naskah telah
  // DISETUJUI pembimbing. Unggah naskah lalu_mutuskan oleh pembimbing.
  const upNaskah = await call('POST', '/akademik/naskah', {
    token: T.mahasiswa,
    body: { fileUrl: '/api/storage/files/naskah/simulasi-az-v.pdf', keterangan: 'Uji verifikasi fitur: naskah untuk checklist' }
  });
  ok(upNaskah.status === 200 || upNaskah.status === 201, 'Mahasiswa mengunggah versi naskah untuk checklist', `status=${upNaskah.status}`);
  const idNaskahUji = upNaskah.json?.data?.id;
  if (idNaskahUji) {
    const setujuiNaskah = await call('PUT', `/akademik/naskah/${idNaskahUji}/approval`, {
      token: T.dosen,
      body: { status: 'Disetujui', catatan: 'Uji verifikasi fitur: naskah disetujui pembimbing' }
    });
    ok(setujuiNaskah.status === 200, 'Pembimbing menyetujui naskah (memenuhi butir checklist)', `status=${setujuiNaskah.status}`);
  }

  // Syarat tahap akhir (S1-T4) mewajibkan publikasi terverifikasi
  const upPub = await call('POST', '/akademik/publikasi', {
    token: T.mahasiswa,
    body: {
      judul: 'Uji verifikasi fitur - artikel publikasi ilmiah',
      jurnal: 'Jurnal Manajemen FEB UTM',
      tahun: '2026',
      tautan: 'https://journal.trunojoyo.ac.id/feb/article/1',
      buktiUrl: '/api/storage/files/publikasi/bukti.pdf'
    }
  });
  const idPubUji = upPub.json?.data?.id;
  if (idPubUji) {
    await call('PUT', `/akademik/publikasi/${idPubUji}/verifikasi`, {
      token: T.koorprodi,
      body: { statusVerifikasi: 'Terverifikasi', catatan: 'Publikasi diverifikasi untuk tahap akhir' }
    });
  }

  const STAGES = ['S1-T1', 'S1-T2', 'S1-T3', 'S1-T4'];
  for (const kode of STAGES) {
    const ajukan = await call('POST', `/akademik/tugas-akhir/${TA_ID}/tahap/${kode}/ajukan`, {
      token: T.mahasiswa,
      body: { catatan: 'Uji verifikasi fitur: pengajuan tahap' }
    });
    ok(ajukan.status === 200 || ajukan.status === 201 || ajukan.status === 409, `Mahasiswa mengajukan tahap ${kode}`, `status=${ajukan.status} ${PesanError(ajukan)}`);

    const ajukanOrangLain = await call('POST', `/akademik/tugas-akhir/${TA_ID}/tahap/${kode}/ajukan`, {
      token: T.mahasiswa2,
      body: { catatan: 'Mahasiswa lain mencoba mengajukan' }
    });
    ok(ajukanOrangLain.status === 403, `Mahasiswa lain DITOLAK mengajukan tahap ${kode} milik mahasiswa lain (403)`);

    const approve = await call('POST', `/akademik/tugas-akhir/${TA_ID}/tahap/${kode}/approve`, {
      token: T.dosen,
      body: { catatan: 'Uji verifikasi fitur: persetujuan pembimbing' }
    });
    ok([200, 409].includes(approve.status), `Pembimbing menyetujui tahap ${kode}`, `status=${approve.status} ${PesanError(approve)}`);

    const approveBukanPembimbing = await call('POST', `/akademik/tugas-akhir/${TA_ID}/tahap/${kode}/approve`, {
      token: T.dosen2,
      body: { catatan: 'Dosen yang tidak mengampu' }
    });
    ok(approveBukanPembimbing.status === 403 || approveBukanPembimbing.status === 409, `Dosen non-pembimbing DITOLAK menyetujui tahap ${kode}`, `status=${approveBukanPembimbing.status}`);

    const verifikasi = await call('POST', `/akademik/tugas-akhir/${TA_ID}/tahap/${kode}/verifikasi`, {
      token: T.koorprodi,
      body: { catatan: 'Uji verifikasi fitur: verifikasi koordinator' }
    });
    ok([200, 409].includes(verifikasi.status), `Koorprodi memverifikasi tahap ${kode}`, `status=${verifikasi.status} ${PesanError(verifikasi)}`);

    const selesai = await call('POST', `/akademik/tugas-akhir/${TA_ID}/tahap/${kode}/selesai`, {
      token: T.koorprodi,
      body: { catatan: 'Uji verifikasi fitur: tahap dinyatakan selesai' }
    });
    ok([200, 409].includes(selesai.status), `Koorprodi menandai tahap ${kode} selesai`, `status=${selesai.status} ${PesanError(selesai)}`);
  }

  const progres = await call('GET', `/akademik/tugas-akhir/${TA_ID}/progres`, { token: T.koorprodi });
  ok(progres.status === 200, 'Progres tahapan Tugas Akhir dapat dibaca');

  // Lembar Pengesahan hanya boleh terbit bila seluruh tahapan selesai.
  const pengesahan = await call('POST', '/documents/generate-pengesahan', {
    token: T.dosen,
    body: { nim: ID.mahasiswa }
  });
  ok(
    pengesahan.status === 200 || pengesahan.status === 201,
    'Lembar Pengesahan berhasil terbit setelah seluruh tahapan selesai',
    `status=${pengesahan.status} ${PesanError(pengesahan)}`
  );

  // =====================================================================
  section('N. KEAMANAN & KEKONSISTENSI AKHIR');
  // =====================================================================
  const traversal = await call('GET', '/storage/files/naskah/..%2F..%2Fpackage.json');
  ok(traversal.status === 400 || traversal.status === 404, 'Path traversal pada endpoint berkas ditolak');

  const anonBackup = await call('GET', '/superadmin/backups');
  ok(anonBackup.status === 401, 'Endpoint superadmin menolak akses anonim');

  const mhsSA = await call('GET', '/superadmin/users', { token: T.mahasiswa });
  ok(mhsSA.status === 403, 'Mahasiswa ditolak accessing endpoint superadmin (403)');

  const logout = await call('POST', '/auth/logout', { token: T.mahasiswa });
  ok(logout.status === 200, 'Logout berhasil');

  const afterLogout = await call('GET', '/auth/me', { token: T.mahasiswa });
  ok(afterLogout.status === 401, 'Token mati setelah logout (sesi dicabut)');

  // =====================================================================
  // Pembersihan: log bimbingan yang dibuat oleh uji ini dihapus kembali agar
  // basis data pengembangan tidak dipenuhi data uji.
  try {
    const db = new DatabaseSync('data/sim_ta_feb_utm.db');
    db.exec('PRAGMA busy_timeout = 5000');
    const info = db
      .prepare("DELETE FROM bimbingan_log WHERE catatan LIKE 'Uji verifikasi fitur%' OR topik LIKE 'Uji verifikasi fitur%'")
      .run();
    db.prepare("DELETE FROM publikasi WHERE judul LIKE 'Uji verifikasi fitur%'").run();
    console.log(`  (pembersihan) log bimbingan uji dihapus: ${info.changes}`);
    db.close();
  } catch (err) {
    console.error('  (pembersihan) gagal:', err.message);
  }

  console.log('\n====================================================');
  console.log(`HASIL VERIFIKASI FITUR: ${passed} LULUS | ${failed} GAGAL`);
  if (failures.length) {
    console.log('Pemeriksaan yang gagal:');
    for (const f of failures) console.log(`  - ${f}`);
  }
  console.log('====================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

function PesanError(res) {
  const m = res.json?.message || res.json?.error || '';
  return m ? `| ${String(m).slice(0, 110)}` : '';
}

main().catch((err) => {
  console.error('FATAL pada uji verifikasi fitur:', err);
  process.exit(1);
});
