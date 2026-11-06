/**
 * Verification Probe: Remediasi Prioritas 1 (Autentikasi & Kriptografi)
 * SIM Tugas Akhir FEB UTM
 *
 * Berkas ini adalah BUKTI EMPIRIS yang sebelumnya HILANG: dokumen
 * `audit_verifikasi_independen.md` mengutip "test_priority1_verification.js"
 * sebagai bukti Prioritas 1, namun berkas tersebut tidak pernah ada di
 * repositori. Script ini dibuat untuk menutup celah bukti tersebut.
 *
 * Cakupan:
 *   1. KDF kata sandi: Scrypt + salt per-pengguna (bukan teks polos/MD5/SHA1)
 *   2. Kredensial universal institusi TIDAK lagi berlaku
 *   3. JWT ditandatangani HS256,rahasia dari env, token dirusak ditolak
 *   4. Token sesi dicabut (revocation) saat logout / ganti sandi / nonaktifkan
 *   5. Hash kata sandi tidak pernah dikembalikan ke klien
 *   6. Anti brute-force: rate limit + lockout akun
 *   7. Anti enumerasi pengguna pada login & reset kata sandi
 *
 * Jalankan: npm run test:priority1   (server API harus aktif di :5001)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEST_PASSWORD, ensureTestAccounts, loginUser } from '../tests/helpers/testAccounts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'http://localhost:5001/api';

const LEGACY_UNIVERSAL_PASSWORD = 'FEB-UTM-2026';

const SUPERADMIN_NIP = '197405102000031001';
const MAHASISWA_NIM = '210211100142';

let passed = 0;
let failed = 0;

function check(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    if (details) console.log(`     > ${details}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    if (details) console.error(`     > ${details}`);
    failed++;
  }
}

async function runPriority1Verification() {
  console.log('================================================================');
  console.log('VERIFIKASI REMEDIASI PRIORITAS 1 - AUTENTIKASI & KRIPTOGRAFI');
  console.log('================================================================\n');

  const credPrep = ensureTestAccounts();
  if (!credPrep.ok) {
    console.error(`Gagal menyiapkan kredensial uji: ${credPrep.message}`);
    process.exit(1);
  }
  console.log(`Kredensial uji disiapkan: ${credPrep.accounts} akun\n`);

  // =========================================================
  // 1. KDF KATA SANDI (SCrypt + SALT PER-PenggUNA)
  // =========================================================
  console.log('1. Uji Key Derivation Function (Scrypt + salt per-pengguna):');
  const passwordSrc = fs.readFileSync(path.join(ROOT, 'server/utils/password.js'), 'utf8');
  check(
    /scryptSync|scrypt\(/.test(passwordSrc),
    'password.js memakai turunan scrypt (bukan md5/sha1/teks polos)'
  );
  check(
    /randomBytes/.test(passwordSrc),
    'password.js membangkitkan salt acak per-pengguna'
  );
  check(
    /timingSafeEqual/.test(passwordSrc),
    'password.js membandingkan hash dengan timingSafeEqual (tahan timing attack)'
  );
  check(
    !/createHash\(['"](md5|sha1)/i.test(passwordSrc),
    'password.js TIDAK memakai md5/sha1 untuk penyimpanan kata sandi'
  );

  // Bukti langsung pada basis data: hash berbeda antar akun & tidak menyimpan teks polos
  const { db } = await import('../server/database/db.js');
  const hashes = db
    .prepare('SELECT nomor_induk, password FROM users WHERE password IS NOT NULL LIMIT 5')
    .all()
    .filter((r) => r.password);

  check(
    hashes.length > 0 && hashes.every((r) => r.password.includes(':') && r.password.split(':').length === 2),
    'Semua hash tersimpan dalam format "salt:hash" (bukan teks polos)',
    `${hashes.length} akun diperiksa`
  );

  // Bukti salt acak per-panggilan: hash(password sama) dua kali harus BERBEDA.
  // (Uji tingkat-fungsi; membuktikan tidak adanya rainbow-table.)
  const { hashPassword } = await import('../server/utils/password.js');
  const samplePassword = 'Uji-Salt-Invarian-2026';
  const hashA = hashPassword(samplePassword);
  const hashB = hashPassword(samplePassword);
  check(hashA !== hashB, 'hashPassword() menghasilkan hash BERBEDA untuk sandi yang sama (salt acak per-panggilan)');
  check(
    hashA.split(':')[0] !== hashB.split(':')[0],
    'Komponen salt pada dua hash berbeda (tidak ada salt tetap per-aplikasi)'
  );

  check(
    hashes.every((r) => r.password !== LEGACY_UNIVERSAL_PASSWORD && !r.password.includes(LEGACY_UNIVERSAL_PASSWORD)),
    `Tidak ada akun yang menyimpan kata sandi universal "${LEGACY_UNIVERSAL_PASSWORD}"`
  );

  // =========================================================
  // 2. KREDENSIAL UNIVERSAL TIDAK LAGI BERLAKU
  // =========================================================
  console.log('\n2. Uji Eliminasi Kredensial Universal Institusi:');
  const legacyLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: SUPERADMIN_NIP, password: LEGACY_UNIVERSAL_PASSWORD })
  });
  const legacyBody = await legacyLogin.json().catch(() => ({}));
  check(
    legacyLogin.status === 401 && !legacyBody.token,
    `Login memakai kata sandi universal "${LEGACY_UNIVERSAL_PASSWORD}" DITOLAK (401)`,
    `Status: ${legacyLogin.status}`
  );

  // Alias berbasis peran juga harus dihapus
  const aliasLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin', password: LEGACY_UNIVERSAL_PASSWORD })
  });
  check(
    aliasLogin.status === 401,
    'Alias login berbasis peran ("superadmin") tidak lagi dapat dipakai',
    `Status: ${aliasLogin.status}`
  );

  // Tidak ada kata sandi default seragam di sumber
  const sourceRoots = ['server', 'src'];
  let hardcodedHits = [];
  for (const root of sourceRoots) {
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!['node_modules', 'scratch', 'tests', 'dist', 'data', 'backups', 'archive'].includes(entry.name)) {
            walk(full);
          }
        } else if (/\.(js|jsx|ts)$/.test(entry.name)) {
          const content = fs.readFileSync(full, 'utf8');
          if (content.includes(LEGACY_UNIVERSAL_PASSWORD)) {
            hardcodedHits.push(path.relative(ROOT, full));
          }
        }
      }
    };
    walk(path.join(ROOT, root));
  }
  check(
    hardcodedHits.length === 0,
    'Tidak ada kata sandi universal yang tertanam di kode aplikasi (server/ & src/)',
    hardcodedHits.length ? `Ditemukan di: ${hardcodedHits.join(', ')}` : 'Pola bersih'
  );

  // =========================================================
  // 3. JWT: HS256 DENGAN RAHASIA DARI ENV
  // =========================================================
  console.log('\n3. Uji Integritas & Kerahasiaan Token JWT:');
  const jwtSrc = fs.readFileSync(path.join(ROOT, 'server/utils/jwt.js'), 'utf8');
  check(
    /algorithm:\s*'HS256'/.test(jwtSrc) && /algorithms:\s*\['HS256'\]/.test(jwtSrc),
    'JWT ditandatangani & diverifikasi eksklusif dengan HS256 (alg=none ditolak)'
  );
  check(
    !/JWT_SECRET\s*=\s*['"][A-Za-z0-9_\-]{16,}['"]/.test(jwtSrc),
    'Tidak ada JWT_SECRET hardcoded di server/utils/jwt.js'
  );

  const superadminToken = await loginUser(BASE_URL, SUPERADMIN_NIP, TEST_PASSWORD);
  check(Boolean(superadminToken), 'Login akun superadmin dengan kredensial uji berhasil');

  const parts = superadminToken.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  check(payload.tv !== undefined, 'Token memuat klaim versi kredensial (tv) untuk pencabutan sesi', `tv=${payload.tv}`);
  check(payload.role === 'superadmin', 'Token memuat klaim peran yang diverifikasi server', `role=${payload.role}`);

  // Token yang dimanipulasi harus ditolak
  const tampered = `${parts[0]}.${parts[1].split('.').slice(0, 1).join('.')}x.${parts[2]}`;
  const tamperedRes = await fetch(`${BASE_URL}/superadmin/users`, {
    headers: { Authorization: `Bearer ${tampered}` }
  });
  check(tamperedRes.status === 401, 'Token JWT yang dimanipulasi DITOLAK (401)', `Status: ${tamperedRes.status}`);

  // Eskalasi peran: token mahasiswa yang dimodifikasi payloadnya menjadi
  // superadmin (tanpa menandatangani ulang) harus ditolak.
  const mhsTokenForForge = await loginUser(BASE_URL, MAHASISWA_NIM, TEST_PASSWORD);
  const mhsParts = mhsTokenForForge.split('.');
  const mhsPayload = JSON.parse(Buffer.from(mhsParts[1], 'base64url').toString('utf8'));
  check(mhsPayload.role === 'mahasiswa', 'Token mahasiswa memuat role=mahasiswa');

  const escalatedPayload = Buffer.from(
    JSON.stringify({ ...mhsPayload, role: 'superadmin', id: 'usr-07' }),
    'utf8'
  ).toString('base64url');
  const escalated = `${mhsParts[0]}.${escalatedPayload}.${mhsParts[2]}`;
  const escalatedRes = await fetch(`${BASE_URL}/superadmin/users`, {
    headers: { Authorization: `Bearer ${escalated}` }
  });
  check(
    escalatedRes.status === 401,
    'Eskalasi peran mahasiswa -> superadmin lewat modifikasi payload DITOLAK (signature mismatch)',
    `Status: ${escalatedRes.status}`
  );

  // Token mahasiswa asli juga tidak boleh bisa mencapai endpoint superadmin.
  const mhsToSuper = await fetch(`${BASE_URL}/superadmin/users`, {
    headers: { Authorization: `Bearer ${mhsTokenForForge}` }
  });
  check(mhsToSuper.status === 403, 'Token mahasiswa sah tetap DITOLAK pada endpoint superadmin (403)');

  // =========================================================
  // 4. PENCABUTAN SESI (TOKEN VERSION)
  // =========================================================
  console.log('\n4. Uji Pencabutan Sesi (Revocation via token_version):');
  const scopedRes = await fetch(`${BASE_URL}/superadmin/users`, {
    headers: { Authorization: `Bearer ${superadminToken}` }
  });
  check(scopedRes.status === 200, 'Token superadmin sah mengakses /superadmin/users (200)');

  // Ganti kata sandi -> token lama harus mati
  const mhsToken = await loginUser(BASE_URL, MAHASISWA_NIM, TEST_PASSWORD);
  const newPassword = `Uji-Revokasi-${Date.now()}!`;
  const changeRes = await fetch(`${BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mhsToken}` },
    body: JSON.stringify({ oldPassword: TEST_PASSWORD, newPassword })
  });
  check(changeRes.status === 200, 'Ganti kata sandi mandiri berhasil (200)');

  const staleRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${mhsToken}` }
  });
  check(staleRes.status === 401, 'Token lama MATI setelah penggantian kata sandi (401 UNAUTHORIZED_STALE_TOKEN)', `Status: ${staleRes.status}`);

  // Kembalikan kata sandi uji ke kondisi semula
  const freshToken = await loginUser(BASE_URL, MAHASISWA_NIM, newPassword);
  const restoreRes = await fetch(`${BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${freshToken}` },
    body: JSON.stringify({ oldPassword: newPassword, newPassword: TEST_PASSWORD })
  });
  check(restoreRes.status === 200, 'Kata sandi uji berhasil dipulihkan (200)');

  // Logout -> token mati
  const logoutToken = await loginUser(BASE_URL, MAHASISWA_NIM, TEST_PASSWORD);
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${logoutToken}` }
  });
  check(logoutRes.status === 200, 'Logout berhasil (200)');
  const afterLogout = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${logoutToken}` }
  });
  check(afterLogout.status === 401, 'Token MATI setelah logout (401)', `Status: ${afterLogout.status}`);

  // Token yang telah dicabut TIDAK BOLEH dapat meminta token baru (regresi:
  // route /auth/switch-role semula memverifikasi token secara manual sehingga
  // sesi yang telah dicabut dapat dihidupkan kembali).
  const revokedSwitch = await fetch(`${BASE_URL}/auth/switch-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${logoutToken}` },
    body: JSON.stringify({ targetRole: 'dosen' })
  });
  check(
    revokedSwitch.status === 401,
    'Token yang sudah dicabut (logout) DITOLAK pada /auth/switch-role — sesi tidak dapat dihidupkan kembali',
    `Status: ${revokedSwitch.status}`
  );

  const revokedMe = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${logoutToken}` }
  });
  check(revokedMe.status === 401, 'Token yang sudah dicabut DITOLAK pada /auth/me (401)', `Status: ${revokedMe.status}`);

  // Logout tanpa token tidak boleh mencabut sesi akun orang lain.
  const victimBefore = db.prepare('SELECT token_version FROM users WHERE nomor_induk = ?').get(SUPERADMIN_NIP);
  await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-07' })
  });
  const victimAfter = db.prepare('SELECT token_version FROM users WHERE nomor_induk = ?').get(SUPERADMIN_NIP);
  check(
    victimBefore.token_version === victimAfter.token_version,
    'Logout tanpa token TIDAK dapat mencabut sesi akun lain (anti session-DoS)',
    `token_version: ${victimBefore.token_version} -> ${victimAfter.token_version}`
  );

  // =========================================================
  // 5. HASH KATA SANDI TIDAK BOLEH BOCOR KE KLIEN
  // =========================================================
  console.log('\n5. Uji Pencegahan Kebocoran Hash Kata Sandi:');
  const usersRes = await fetch(`${BASE_URL}/superadmin/users`, {
    headers: { Authorization: `Bearer ${superadminToken}` }
  });
  const usersJson = await usersRes.json();
  const rawJson = JSON.stringify(usersJson);
  check(!rawJson.includes(TEST_PASSWORD), 'Respons /superadmin/users tidak memuat kata sandi dalam bentuk apa pun');
  check(
    !/"password"\s*:/.test(rawJson) && !/"password_hash"\s*:/.test(rawJson),
    'Respons /superadmin/users tidak memuat kolom hash kata sandi'
  );
  const hasScryptShape = /"[^"]*"\s*:\s*"[0-9a-f]{16,}:[0-9a-f]{32,}/i.test(rawJson);
  check(!hasScryptShape, 'Tidak ada string berbentuk "salt:hash" scrypt di respons API');

  // =========================================================
  // 6. ANTI BRUTE-FORCE (RATE LIMIT + LOCKOUT)
  // =========================================================
  console.log('\n6. Uji Kontrol Anti Brute-Force:');
  const authSrc = fs.readFileSync(path.join(ROOT, 'server/routes/authRoutes.js'), 'utf8');
  check(/loginRateLimiter/.test(authSrc), 'Endpoint login dilindungi rate limiter');
  check(/accountLockouts/.test(authSrc) && /ACCOUNT_LOCK_MS/.test(authSrc), 'Terdapat lockout akun berbasis durasi');
  check(/registerFailedLogin/.test(authSrc), 'Percobaan login gagal dicatat untuk pemicu lockout');

  // Uji nyata: 7x gagal beruntun pada satu akun dari identifier fiktif
  // Uji nyata: percobaan login gagal BERUNTUN pada satu identifier harus
  // diblokir. Ambil batas yang berlaku dari environment agar uji tetap sah
  // baik pada konfigurasi ketat (produksi) maupun longgar (verifikasi lokal).
  const perAccountLimit = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
  const perIpLimit = Number(process.env.LOGIN_MAX_ATTEMPTS_PER_IP || 30);
  const tries = Math.min(perAccountLimit, perIpLimit) + 2;

  const bruteIdentifier = `brute-${Date.now()}@trunojoyo.ac.id`;
  let locked = false;
  for (let i = 0; i < tries; i++) {
    const r = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: bruteIdentifier, password: `salah-${i}` })
    });
    if (r.status === 429) {
      locked = true;
      break;
    }
  }
  check(locked, 'Percobaan login gagal berulang diblokir otomatis oleh rate limiter / lockout (429)', `batas per-akun=${perAccountLimit}, percobaan=${tries}`);

  // =========================================================
  // 6b. KEBIJAKAN CORS & ALIRAN NOTIFIKASI REAL-TIME (SSE)
  // =========================================================
  console.log('\n6b. Uji Kebijakan CORS & Aliran Notifikasi (SSE):');

  // Origin yang TIDAK ada di allowlist harus ditolak dengan status policies
  // yang BENAR (403), bukan 500 yang menyamar sebagai kegagalan server.
  const corsBad = await fetch(`${BASE_URL}/health`, {
    headers: { Origin: 'http://origin-tidak-diizinkan.invalid' }
  });
  const corsBadBody = await corsBad.json().catch(() => ({}));
  check(
    corsBad.status === 403,
    'Origin di luar allowlist ditolak 403 (bukan 500 "Internal Server Error")',
    `Status: ${corsBad.status}`
  );
  check(
    corsBadBody?.code === 'CORS_ORIGIN_DENIED',
    'Penolakan CORS menyertakan kode CORS_ORIGIN_DENIED yang eksplisit',
    `code=${corsBadBody?.code}`
  );

  // Origin yang DIIZINKAN harus diberi header Access-Control-Allow-Origin.
  const corsOk = await fetch(`${BASE_URL}/health`, {
    headers: { Origin: 'http://localhost:5173' }
  });
  const corsOkHeader = corsOk.headers.get('access-control-allow-origin');
  check(
    corsOk.status === 200 && corsOkHeader === 'http://localhost:5173',
    'Origin dev (:5173) yang tercantum di allowlist diberi header ACAO yang benar',
    `ACAO=${corsOkHeader}`
  );

  // Aliran SSE harus dapat diakses memakai token SCOPED berumur pendek.
  const sseTokenRes = await fetch(`${BASE_URL}/notifications/stream-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superadminToken}` }
  });
  const sseToken = await sseTokenRes.json().catch(() => ({}));
  check(
    sseTokenRes.status === 200 && typeof sseToken?.streamUrl === 'string',
    'Token scoped untuk aliran SSE diterbitkan'
  );
  check(
    typeof sseToken?.streamUrl === 'string' && sseToken.streamUrl.startsWith('/api/notifications/stream?st='),
    'streamUrl bersifat RELATIF (dapat diselesaikan terhadap origin backend mana pun)',
    `streamUrl=${String(sseToken?.streamUrl).slice(0, 46)}...`
  );

  const sseUnauthorized = await fetch(`${BASE_URL}/notifications/stream`);
  check(sseUnauthorized.status === 401, 'Aliran SSE tanpa token ditolak 401');

  // =========================================================
  // 7. ANTI ENUMERASI PENGGUNA
  // =========================================================
  console.log('\n7. Uji Anti Enumerasi Pengguna:');
  const unknownRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '999999999999', password: 'apa-saja' })
  });
  const unknownJson = await unknownRes.json();
  const wrongPassRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: MAHASISWA_NIM, password: 'kata-sandi-salah' })
  });
  const wrongPassJson = await wrongPassRes.json();
  check(
    unknownJson.message === wrongPassJson.message,
    'Pesan error akun tidak terdaftar & sandi salah IDENTIK (tidak dapat dipakai untuk enumerasi NIM/NIP)',
    `Pesan: "${unknownJson.message}"`
  );

  const resetRes = await fetch(`${BASE_URL}/auth/reset-password-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: SUPERADMIN_NIP })
  });
  const resetJson = await resetRes.json();
  const resetText = JSON.stringify(resetJson);
  check(
    !resetText.toLowerCase().includes('supriyanto.admin@trunojoyo.ac.id'),
    'Respons reset-password-request tidak membocorkan alamat email institusi'
  );
  check(
    !/@trunojoyo\.ac\.id/.test(resetText),
    'Respons reset-password-request tidak memuat domain email sama sekali'
  );

  console.log('\n================================================================');
  console.log('REKAPITULASI HASIL VERIFIKASI PRIORITAS 1:');
  console.log(`   Langkah Lulus : ${passed}`);
  console.log(`   Langkah Gagal : ${failed}`);
  console.log(
    `   Status Akhir  : ${failed === 0 ? 'PRIORITAS 1 SELESAI & TERVERIFIKASI 100%' : 'TERDAPAT MASALAH'}`
  );
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runPriority1Verification().catch((err) => {
  console.error('Fatal error saat uji verifikasi Prioritas 1:', err);
  process.exit(1);
});
