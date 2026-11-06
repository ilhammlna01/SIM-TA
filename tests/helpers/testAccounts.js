/**
 * Helper Kredensial Uji Otomatis (Test Credentials Helper)
 *
 * Latar Belakang (Audit 21 Oktober 2026 — FINDING-01):
 * Suite pengujian lama memakai kata sandi universal institusi 'FEB-UTM-2026'
 * yang berlaku untuk seluruh akun. Remediasi menghapus kredensial universal
 * tersebut, sehingga setiap akun kini memiliki kata sandi acak individual dan
 * WAJIB menggantinya pada login pertama.
 *
 * Agar suite pengujian tetap deterministik tanpa mengembalikan kredensial
 * universal ke dalam aplikasi, helper ini menyeed kredensial uji secara
 * LANGSUNG ke basis data (di luar jalur HTTP). Helper hanya dipakai pada
 * lingkungan pengembangan/pengujian dan menolak berjalan di NODE_ENV=production.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
// Memuat .env agar skrip uji yang mengimpor modul server memakai JWT_SECRET
// yang SAMA dengan server yang sedang berjalan (token uji harus valid).
import '../../server/config/env.js';
import { hashPassword } from '../../server/utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const TEST_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || 'UTM-QA-2026!Lab';
export const DB_PATH = path.resolve(__dirname, '../../data/sim_ta_feb_utm.db');

/**
 * Akun-akun yang dipakai oleh suite pengujian.
 * NIP/NIM merujuk akun yang benar-benar di-seed aplikasi.
 */
export const TEST_ACCOUNTS = [
  { id: 'usr-02', nomorInduk: '210211100142', nama: 'Dinda Ayu Larasati', email: 'dinda.larasati@student.trunojoyo.ac.id', role: 'mahasiswa', jenjang: 'S1', prodi: 'S-1 Manajemen' },
  { id: 'usr-01', nomorInduk: '220231600004', nama: 'Bambang Suryo Utomo, S.E., M.M.', email: 'bambang.suryo@student.trunojoyo.ac.id', role: 'mahasiswa', jenjang: 'S3', prodi: 'S-3 Ilmu Manajemen' },
  { id: 'usr-05', nomorInduk: '197703032003121002', nama: 'Dr. Faidal, S.E., M.M.', email: 'faidal@trunojoyo.ac.id', role: 'penguji', jenjang: 'S2', prodi: 'S-2 Magister Manajemen' },
  { id: 'usr-03', nomorInduk: '196201081987032001', nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', email: 'iriani.ismail@trunojoyo.ac.id', role: 'dosen', jenjang: 'D3', prodi: 'D-3 Entrepreneurship' },
  { id: 'usr-mhs-210211100099', nomorInduk: '210211100099', nama: 'Andi Pratama', email: 'andi.pratama@student.trunojoyo.ac.id', role: 'mahasiswa', jenjang: 'S1', prodi: 'S-1 Manajemen' },
  { id: 'usr-04', nomorInduk: '197802142003122001', nama: 'Dr. Hj. Siti Aminah, S.E., M.Si.', email: 'siti.aminah@trunojoyo.ac.id', role: 'koorprodi', jenjang: 'S1', prodi: 'S-1 Manajemen' },
  { id: 'usr-09', nomorInduk: '196203031988032001', nama: 'Dra. Hj. S. Anugrahini Irawati, M.M.', email: 'anugrahini.irawati@trunojoyo.ac.id', role: 'dosen', jenjang: 'S1', prodi: 'S-1 Manajemen' },
  { id: 'usr-08', nomorInduk: '196306231989031002', nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.', email: 'pribanus.wantara@trunojoyo.ac.id', role: 'dosen', jenjang: 'S1', prodi: 'S-1 Manajemen' },
  { id: 'usr-06', nomorInduk: '198104122008121002', nama: 'Ahmad Fauzi, S.Kom., M.T.', email: 'ahmad.fauzi@trunojoyo.ac.id', role: 'admin', jenjang: 'Multi', prodi: 'Subbag Akademik & Tata Usaha' },
  { id: 'usr-07', nomorInduk: '197405102000031001', nama: 'Ir. Supriyanto, M.Kom.', email: 'supriyanto.admin@trunojoyo.ac.id', role: 'superadmin', jenjang: 'Multi', prodi: 'Pusat Data & Sistem FEB' }
];

/**
 * Menyiapkan kredensial uji yang seragam & dapat diprediksi untuk seluruh
 * akun uji, sehingga suite otomatis dapat login secara konsisten.
 *
 * Pengaman:
 *  - Helper DITOLAK pada NODE_ENV=production, KECUALI bila operator
 *    menyetel ALLOW_TEST_CREDENTIALS=1 secara eksplisit. Penanda ini
 *    diperlukan agar suite tetap dapat dijalankan terhadap server yang
 *    dijalankan pada mode produksi (mis. verifikasi pra-deploy), tanpa
 *    membuka pathways Reset Kata Sandi pada instance produksi sungguhan.
 *
 * @returns {{ok: boolean, message: string, accounts: number}}
 */
export function ensureTestAccounts() {
  const isProduction = process.env.NODE_ENV === 'production';
  const explicitlyAllowed = process.env.ALLOW_TEST_CREDENTIALS === '1';

  if (isProduction && !explicitlyAllowed) {
    return {
      ok: false,
      message:
        'ensureTestAccounts() DITOLAK pada NODE_ENV=production. ' +
        'Setel ALLOW_TEST_CREDENTIALS=1 HANYA bila basis data ini memang basis data uji/verifikasi.',
      accounts: 0
    };
  }

  let db;
  try {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA busy_timeout = 5000');

    const hashed = hashPassword(TEST_PASSWORD);
    const selectStmt = db.prepare('SELECT id FROM users WHERE nomor_induk = ?');
    const insertStmt = db.prepare(`
      INSERT INTO users (id, nomor_induk, nama, email, role, jenjang, prodi, password, eligible_roles, status, last_login, credential_epoch, token_version, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Aktif', 'Belum pernah login', 1, 1, 0)
      ON CONFLICT(nomor_induk) DO UPDATE SET
        password = excluded.password,
        must_change_password = 0,
        credential_epoch = 1
    `);

    let count = 0;
    for (const acc of TEST_ACCOUNTS) {
      const existing = selectStmt.get(acc.nomorInduk);
      if (!existing) {
        insertStmt.run(
          acc.id,
          acc.nomorInduk,
          acc.nama,
          acc.email,
          acc.role,
          acc.jenjang,
          acc.prodi,
          hashed,
          JSON.stringify([acc.role])
        );
      } else {
        db.prepare(`
          UPDATE users
          SET password = ?, must_change_password = 0, credential_epoch = 1
          WHERE nomor_induk = ?
        `).run(hashed, acc.nomorInduk);
      }
      count++;
    }

    return { ok: true, message: `${count} akun uji disiapkan dengan kredensial uji.`, accounts: count };
  } catch (err) {
    return { ok: false, message: `Gagal menyiapkan kredensial uji: ${err.message}`, accounts: 0 };
  } finally {
    try { db?.close(); } catch (_) {}
  }
}

/**
 * Login ke API dan mengembalikan token sesi.
 *
 * Rate limiter login berbasis IP dapat memblokir suite pengujian yang
 * menjalankan banyak login beruntun dari localhost (seluruh suite berjalan
 * pada satu IP). Bila terjadi, helper menunggu jendela lockout berakhir
 * lalu mencoba kembali, alih-alih langsung gagal.
 */
export async function loginUser(baseUrl, identifier, password = TEST_PASSWORD) {
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.token) return data.token;

    // 429 = rate limit / lockout akun. Tunggu lalu coba lagi.
    if (res.status === 429 && attempt < maxAttempts) {
      const waitMs = 5000 * attempt;
      console.warn(
        `[testAccounts] Login ${identifier} terkena rate limit (429). ` +
          `Menunggu ${waitMs / 1000} detik sebelum mencoba lagi (${attempt}/${maxAttempts}).`
      );
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    throw new Error(`Gagal login user ${identifier}: ${data.message || 'No token'}`);
  }

  throw new Error(`Gagal login user ${identifier}: rate limit tidak reda setelah ${maxAttempts} percobaan.`);
}

export default { TEST_PASSWORD, TEST_ACCOUNTS, ensureTestAccounts, loginUser };
