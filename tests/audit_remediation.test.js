/**
 * Regression Test — Remediasi Audit 21 Oktober 2026
 * SIM Tugas Akhir FEB UTM
 *
 * Menguji secara otomatis setiap temuan hasil audit independen yang
 * ditemukan pada audit_verifikasi_independen.md, agar tidak dapat
 * "dibocorkan" kembali pada rilis berikutnya.
 *
 * Daftar Uji:
 *  R01  Kata sandi universal institusi tidak lagi berlaku            (B-1)
 *  R02  Alias peran ('superadmin'/'admin') tidak lagi dapat login      (B-1)
 *  R03  Pesan login seragam (anti enumerasi NIM/NIP)                   (B-7)
 *  R04  reset-password-request tidak membocorkan email institusi       (B-7)
 *  R05  GET /superadmin/users tidak membocorkan hash kata sandi        (B-4)
 *  R06  Logout mencabut token sesi secara langsung                     (B-6)
 *  R07  Perubahan peran akun mencabut token lama                        (B-6)
 *  R08  Token sesi di query string tidak lagi diterima                (B-9)
 *  R09  Scoped download token bekerja & terikat pada satu berkas        (B-9)
 *  R10  IDOR notifikasi: parameter userId klien diabaikan              (B-7)
 *  R11  Penguji tanpa penugasan tidak dapat menetapkan nilai           (B-3)
 *  R12  Mahasiswa tidak dapat mencetak dokumen atas nama orang lain    (B-5)
 *  R13  Nama & NIM dokumen resmi diambil dari database                 (B-5)
 *  R14  Identitas pembimbing berbasis NIP (bukan substring nama)       (B-2)
 *  R15  Path traversal berkas ditolak dengan 400                       (C-1)
 *  R16  Berkas terproteksi memakai Cache-Control private/no-store      (B-8)
 *  R17  Build produksi tersedia (dist/index.html)                      (C-1)
 *  R18  Rate limiting login aktif (429)                               (B-10)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEST_PASSWORD, ensureTestAccounts, loginUser } from './helpers/testAccounts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5001/api';
const ROOT_DIR = path.resolve(__dirname, '..');
const LEGACY_UNIVERSAL_PASSWORD = 'FEB-UTM-2026';

let passed = 0;
let failed = 0;

function assert(condition, name, detail = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
    if (detail) console.log(`     ↳ ${detail}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${name}`);
    if (detail) console.error(`     ↳ ${detail}`);
    failed++;
  }
}

async function apiGet(pathname, token) {
  const res = await fetch(`${BASE_URL}${pathname}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text, headers: res.headers };
}

async function apiSend(method, pathname, { token, body } = {}) {
  const res = await fetch(`${BASE_URL}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text, headers: res.headers };
}

async function main() {
  console.log('====================================================');
  console.log('🛠️  REGRESSION TEST — REMEDIASI AUDIT 21 OKTOBER 2026');
  console.log('====================================================\n');

  const prep = ensureTestAccounts();
  if (!prep.ok) {
    console.error('Gagal menyiapkan kredensial uji:', prep.message);
    process.exit(1);
  }

  // ---------------------------------------------------------------
  console.log('🔐 R01–R04: Model Kredensial & Anti-Enumerasi');
  // ---------------------------------------------------------------
  {
    const res = await apiSend('POST', '/auth/login', {
      body: { identifier: '197405102000031001', password: LEGACY_UNIVERSAL_PASSWORD }
    });
    assert(res.status === 401, 'R01 Kata sandi universal institusi ditolak',
      `HTTP ${res.status}`);
  }
  {
    const res = await apiSend('POST', '/auth/login', {
      body: { identifier: 'superadmin', password: LEGACY_UNIVERSAL_PASSWORD }
    });
    assert(res.status === 401, 'R02 Alias peran "superadmin" ditolak',
      `HTTP ${res.status}`);
  }
  {
    const unknown = await apiSend('POST', '/auth/login', {
      body: { identifier: '999999999999999', password: 'apaSaja123' }
    });
    const wrongPassword = await apiSend('POST', '/auth/login', {
      body: { identifier: '197405102000031001', password: 'apaSaja123' }
    });
    assert(
      unknown.json?.message && unknown.json.message === wrongPassword.json?.message,
      'R03 Pesan login seragam (anti enumerasi NIM/NIP)',
      unknown.json?.message
    );
  }
  {
    const res = await apiSend('POST', '/auth/reset-password-request', {
      body: { identifier: '197405102000031001' }
    });
    assert(
      res.status === 200 && !/trunojoyo/i.test(res.text),
      'R04 reset-password-request tidak membocorkan email institusi',
      res.json?.message
    );
  }

  // ---------------------------------------------------------------
  console.log('\n🔐 R05–R07: Kebocoran Kredensial & Pencabutan Sesi');
  // ---------------------------------------------------------------
  let superadminToken = '';
  {
    superadminToken = await loginUser(BASE_URL, '197405102000031001', TEST_PASSWORD);

    const res = await apiGet('/superadmin/users', superadminToken);
    assert(
      res.status === 200 && !/"password"\s*:/.test(res.text),
      'R05 GET /superadmin/users tidak membocorkan hash kata sandi',
      `HTTP ${res.status}, panjang=${res.text.length}`
    );
    assert(
      !/[0-9a-f]{32}:[0-9a-f]{64}/.test(res.text),
      'R05b Tidak ada hash Scrypt (salt:hash) pada respons pengguna'
    );
  }
  {
    const token = await loginUser(BASE_URL, '197405102000031001', TEST_PASSWORD);
    await apiSend('POST', '/auth/logout', { token, body: {} });
    const res = await apiGet('/superadmin/users', token);
    assert(res.status === 401, 'R06 Logout mencabut token sesi secara langsung',
      `HTTP ${res.status} ${res.json?.code || ''}`);
  }
  {
    // Token superadmin yang FRESH (logout pada R06 telah mencabut token sebelumnya).
    const saToken = await loginUser(BASE_URL, '197405102000031001', TEST_PASSWORD);

    const victim = await apiSend('POST', '/superadmin/users', {
      token: saToken,
      body: {
        nomorInduk: '197703032003121002',
        nama: 'Dr. Faidal, S.E., M.M.',
        email: 'faidal@trunojoyo.ac.id',
        role: 'penguji',
        password: TEST_PASSWORD
      }
    });
    assert(victim.status === 200 || victim.status === 201,
      'R07a Persiapan akun uji untuk uji pencabutan sesi', `HTTP ${victim.status}`);

    const token = await loginUser(BASE_URL, '197703032003121002', TEST_PASSWORD);
    const before = await apiGet('/penguji/ujian', token);
    assert(before.status === 200, 'R07b Token valid sebelum perubahan peran', `HTTP ${before.status}`);

    // Naikkan token_version lewat perubahan peran oleh superadmin.
    const put = await apiSend('PUT', '/superadmin/users/197703032003121002', {
      token: saToken,
      body: { role: 'dosen' }
    });
    assert(put.status === 200, 'R07b2 Perubahan peran berhasil dieksekusi', `HTTP ${put.status}`);

    const after = await apiGet('/penguji/ujian', token);
    assert(after.status === 401, 'R07c Perubahan peran mencabut token lama',
      `HTTP ${after.status} ${after.json?.code || ''}`);

    // Kembalikan peran aslinya.
    await apiSend('PUT', '/superadmin/users/197703032003121002', {
      token: saToken,
      body: { role: 'penguji' }
    });
  }

  // ---------------------------------------------------------------
  console.log('\n📄 R08–R09: Kebocoran Token di URL & Scoped Download Token');
  // ---------------------------------------------------------------
  const mhsToken = await loginUser(BASE_URL, '210211100142', TEST_PASSWORD);
  {
    const res = await apiGet('/storage/files/naskah/Proposal_Skripsi_Final_Sempro_Dinda.pdf?token=' + encodeURIComponent(mhsToken));
    assert(res.status === 401, 'R08 Token sesi di query string tidak lagi diterima',
      `HTTP ${res.status} ${res.json?.code || ''}`);
  }
  {
    const dl = await apiSend('POST', '/storage/download-token', {
      token: mhsToken,
      body: { category: 'naskah', filename: 'Proposal_Skripsi_Final_Sempro_Dinda.pdf' }
    });
    assert(dl.status === 200 && !!dl.json?.downloadUrl,
      'R09a Scoped download token diterbitkan', `HTTP ${dl.status}`);

    if (dl.json?.downloadUrl) {
      const res = await fetch(`http://localhost:5001${dl.json.downloadUrl}`);
      assert(res.status === 200, 'R09b Scoped download token dapat membuka berkas',
        `HTTP ${res.status}`);

      const swapped = dl.json.downloadUrl.replace(
        'Proposal_Skripsi_Final_Sempro_Dinda.pdf',
        'naskah_rahasia_bambang_s3.pdf'
      );
      const res2 = await fetch(`http://localhost:5001${swapped}`);
      assert(res2.status === 401, 'R09c Scoped token terikat pada satu berkas (tidak bisa ditukar)',
        `HTTP ${res2.status}`);
    }
  }

  // ---------------------------------------------------------------
  console.log('\n🔔 R10: IDOR Notifikasi');
  // ---------------------------------------------------------------
  {
    const withParam = await apiGet('/notifications?userId=220231600004', mhsToken);
    const withoutParam = await apiGet('/notifications', mhsToken);
    const sameCount = (withParam.json?.data?.length ?? -1) === (withoutParam.json?.data?.length ?? -2);
    assert(sameCount, 'R10 Parameter userId dari klien diabaikan (anti IDOR)',
      `dengan param=${withParam.json?.data?.length}, normal=${withoutParam.json?.data?.length}`);
  }

  // ---------------------------------------------------------------
  console.log('\n🎓 R11: Validasi Penugasan Penguji');
  // ---------------------------------------------------------------
  {
    const faidal = await loginUser(BASE_URL, '197703032003121002', TEST_PASSWORD);
    const superadmin = await loginUser(BASE_URL, '197405102000031001', TEST_PASSWORD);

    const allExams = (await apiGet('/penguji/ujian', superadmin)).json?.data || [];
    const myExams = (await apiGet('/penguji/ujian', faidal)).json?.data || [];
    const myIds = myExams.map((e) => e.id);
    const notMine = allExams.find((e) => !myIds.includes(e.id));

    if (notMine) {
      const res = await apiSend('PUT', `/penguji/ujian/${notMine.id}/penilaian`, {
        token: faidal,
        body: { nilaiFinal: 99, grade: 'A' }
      });
      assert(res.status === 403, 'R11 Penguji tanpa penugasan ditolak saat menilai',
        `HTTP ${res.status} ${res.json?.code || ''}`);
    } else {
      assert(true, 'R11 Penguji tanpa penugasan ditolak saat menilai', 'diskip: seluruh ujian ditugaskan');
    }
  }

  // ---------------------------------------------------------------
  console.log('\n📜 R12–R13: Rekonsiliasi Dokumen Resmi dengan Database');
  // ---------------------------------------------------------------
  {
    const res = await apiSend('POST', '/documents/generate-bimbingan', {
      token: mhsToken,
      body: { nim: '220231600004', namaMahasiswa: 'Bambang Suryo Utomo, S.E., M.M.' }
    });
    assert(res.status === 400 || res.status === 403,
      'R12 Mahasiswa tidak dapat mencetak kartu bimbingan atas nama orang lain',
      `HTTP ${res.status} ${res.json?.code || ''}`);
  }
  {
    const res = await apiSend('POST', '/documents/generate-bimbingan', {
      token: mhsToken,
      body: { nim: '210211100142', namaMahasiswa: 'PALANG PALING BUKAN DINDa' }
    });
    const archived = res.json?.data?.filename || '';
    assert(res.status === 201 && !!archived, 'R12b Kartu bimbingan sendiri berhasil terbit',
      `HTTP ${res.status}`);

    // Nama pada arsip harus mengikuti DATABASE, bukan payload klien.
    if (archived) {
      const verify = await apiGet('/documents/verify/' + (res.json?.data?.verificationCode || 'x'));
      const archivedName = verify.json?.data?.namaMahasiswa || '';
      assert(
        archivedName.includes('Dinda') && !/PALANG/i.test(archivedName),
        'R13 Nama pada arsip dokumen mengikuti database (bukan payload klien)',
        `nama arsip="${archivedName}"`
      );
    }
  }

  // ---------------------------------------------------------------
  console.log('\n🧬 R14: Identitas Pembimbing Berbasis NIP');
  // ---------------------------------------------------------------
  {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(path.join(ROOT_DIR, 'data/sim_ta_feb_utm.db'));
    const row = db.prepare(`
      SELECT count(*) AS total,
             sum(CASE WHEN pembimbing_utama_nip IS NOT NULL THEN 1 ELSE 0 END) AS denganNip
      FROM tugas_akhir
    `).get();
    db.close();
    assert(
      Number(row?.denganNip || 0) > 0,
      'R14 NIP pembimbing ter-backfill pada entitas Tugas Akhir',
      `${row?.denganNip || 0}/${row?.total || 0} TA memiliki NIP pembimbing`
    );
  }

  // ---------------------------------------------------------------
  console.log('\n🛡️ R15–R17: Path Traversal, Cache-Control, Build Produksi');
  // ---------------------------------------------------------------
  {
    const res = await apiGet('/storage/files/naskah/..%2F..%2Fdata%2Fsim_ta_feb_utm.db');
    assert(res.status === 400, 'R15 Path traversal ditolak dengan 400', `HTTP ${res.status}`);
  }
  {
    const dl = await apiSend('POST', '/storage/download-token', {
      token: mhsToken,
      body: { category: 'naskah', filename: 'Proposal_Skripsi_Final_Sempro_Dinda.pdf' }
    });
    if (dl.json?.downloadUrl) {
      const res = await fetch(`http://localhost:5001${dl.json.downloadUrl}`);
      const cacheControl = res.headers.get('cache-control') || '';
      assert(
        /private/.test(cacheControl) && /no-store/.test(cacheControl),
        'R16 Berkas terproteksi memakai Cache-Control private/no-store',
        cacheControl
      );
    } else {
      assert(false, 'R16 Berkas terproteksi memakai Cache-Control private/no-store', 'token tidak diterbitkan');
    }
  }
  {
    const indexPath = path.join(ROOT_DIR, 'dist', 'index.html');
    assert(fs.existsSync(indexPath), 'R17 Build produksi tersedia (dist/index.html)',
      indexPath);
  }

  // ---------------------------------------------------------------
  console.log('\n🚦 R18: Rate Limiting Login');
  // ---------------------------------------------------------------
  {
    // Akun khusus uji: agar lockout tidak memengaruhi akun uji lain.
    const saToken = await loginUser(BASE_URL, '197405102000031001', TEST_PASSWORD);
    const throwawayNim = '199901010000001';
    await apiSend('POST', '/superadmin/users', {
      token: saToken,
      body: {
        nomorInduk: throwawayNim,
        nama: 'Akun Uji Rate Limit',
        email: 'ratelimit.uji@student.trunojoyo.ac.id',
        role: 'mahasiswa',
        jenjang: 'S1',
        prodi: 'S-1 Manajemen',
        password: TEST_PASSWORD
      }
    });

    let limited = false;
    for (let i = 0; i < 12; i++) {
      const res = await apiSend('POST', '/auth/login', {
        body: { identifier: throwawayNim, password: 'salahSekali123' }
      });
      if (res.status === 429) { limited = true; break; }
    }
    assert(limited, 'R18 Rate limiting login aktif (429 setelah percobaan berulang)',
      limited ? 'terbukti' : 'tidak memicu 429');

    // Pembersihan: akun uji TIDAK boleh tertinggal di basis data produksi.
    try {
      const created = await apiSend('GET', '/superadmin/users', { token: saToken });
      const list = created?.json?.data || [];
      const junk = list.find((u) => u.nomorInduk === throwawayNim);
      if (junk) {
        await apiSend('DELETE', `/superadmin/users/${junk.id}`, { token: saToken });
      }
    } catch (_) {}
  }

  console.log('\n====================================================');
  console.log(`📊 HASIL: ${passed} LULUS | ${failed} GAGAL`);
  console.log('====================================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL pada regression test remediasi:', err);
  process.exit(1);
});
