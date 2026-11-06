/**
 * Identitas Pembimbing & Penguji — berbasis NIP (bukan pencocokan nama bebas).
 *
 * Latar Belakang (Audit 21 Oktober 2026 — turunan FINDING-05):
 * Otorisasi kepemilikan berkas berbasis pencocokan SUBSTRING nama berkas
 * ("bambang", "rahasia") sudah digantikan relasi DB. Namun pola yang sama —
 * pencocokan SUBSTRING nama — muncul kembali pada pengecekan pembimbing:
 *   stored.includes(user.nama)
 * sehingga akun bernama "Ahmad" dianggap pembimbing dari "Dr. Ahmad Fauzi, S.E.".
 *
 * Solusi: identitas pembimbing/penguji disimpan sebagai NIP (unik, milik
 * institusi) dan dicocokkan dengan kesamaan PERSIS. Pencocokan nama hanya
 * dipakai sebagai fallback dengan kesamaan NORMALISED YANG PERSIS (bukan
 * substring) apabila NIP belum tersedia.
 */

import { INITIAL_KUOTA_DOSEN, INITIAL_USER_ACCOUNTS } from '../../src/data/superadminData.js';

/**
 * Normalisasi nama orang: buang anotasi peran, tanda baca bounce, dan spasi ganda.
 * "Dr. Faidal, S.E., M.M. (Pembimbing I)" -> "dr faidal s e m m"
 * "Dra. Hj. S. Anugrahini Irawati, M.M."   -> "dra hj s anugrahini irawati m m"
 */
export function normalizePersonName(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/\([^)]*\)/g, ' ')   // buang anotasi peran "(Pembimbing I)", dll
    .replace(/[^a-zA-Z0-9\s]/g, ' ') // buang tanda baca
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Indeks NIP <- nama dosen, dibangun dari data master internal.
 * Sumber: INITIAL_KUOTA_DOSEN (daftar dosen resmi) + INITIAL_USER_ACCOUNTS.
 */
const DOSEN_NIP_INDEX = (() => {
  const index = new Map();

  const register = (nama, nip) => {
    const key = normalizePersonName(nama);
    if (!key || !nip) return;
    // NIP wins over an empty/invalid entry; the first NIP registered is kept.
    if (!index.has(key)) index.set(key, String(nip).trim());
  };

  for (const d of INITIAL_KUOTA_DOSEN || []) register(d.nama, d.nip);
  for (const u of INITIAL_USER_ACCOUNTS || []) {
    if (u.role === 'mahasiswa') continue;
    register(u.nama, u.nomorInduk);
  }

  return index;
})();

/**
 * Indeks kebalikan NIP -> nama kanonik, dibangun dari data master yang sama.
 */
const DOSEN_NAME_INDEX = (() => {
  const index = new Map();

  const register = (nama, nip) => {
    if (!nama || !nip) return;
    const key = String(nip).trim();
    if (!key || index.has(key)) return;
    index.set(key, String(nama).trim());
  };

  for (const d of INITIAL_KUOTA_DOSEN || []) register(d.nama, d.nip);
  for (const u of INITIAL_USER_ACCOUNTS || []) {
    if (u.role === 'mahasiswa') continue;
    register(u.nama, u.nomorInduk);
  }

  return index;
})();

/**
 * Resolusi NIP dari nama dosen. Mengembalikan string NIP atau null.
 */
export function resolveNipByName(name) {
  const key = normalizePersonName(name);
  if (!key) return null;
  return DOSEN_NIP_INDEX.get(key) || null;
}

/**
 * Resolusi nama dari NIP (indeks kebalikan). Mengembalikan nama kanonik
 * yang terdaftar pada data master dosen, atau null bila NIP tidak dikenal.
 *
 * Audit 21 Oktober 2026: diperlukan oleh endpoint plotting pembimbing agar
 * NIP yang dikirim clients tetap dapat ditampilkan sebagai nama resmi.
 */
export function resolveNameByNip(nip) {
  if (!nip) return null;
  const key = String(nip).trim();
  if (!key) return null;
  return DOSEN_NAME_INDEX.get(key) || null;
}

/**
 * Apakah dua identitas orang merujuk pada orang yang sama?
 * - Jika kedua NIP tersedia: bandingkan PERSIS.
 * - Jika hanya satu NIP tersedia: bandingkan dengan NIP hasil resolusi nama.
 * - Fallback: kesamaan nama yang dinormalisasi secara PERSIS (bukan substring).
 */
export function isSamePerson({ nip, name, otherNip, otherName }) {
  const aNip = nip ? String(nip).trim() : null;
  const bNip = otherNip ? String(otherNip).trim() : (resolveNipByName(otherName) || null);

  // NIP adalah identitas primer yang otoritatif.
  if (aNip && bNip) return aNip === bNip;

  // Tanpa NIP satu sisi, coba resolusi nama sisi yang belum punya NIP.
  if (aNip && !bNip) {
    const resolved = resolveNipByName(otherName);
    if (resolved) return resolved === aNip;
  }
  if (!aNip && bNip) {
    const resolved = resolveNipByName(name);
    if (resolved) return resolved === bNip;
  }

  // Tanpa NIP sama sekali: kesamaan nama TER-NORMALISASI secara persis.
  // Sengaja TIDAK memakai `includes` untuk mencegah false positive
  // ("Ahmad" vs "Dr. Ahmad Fauzi, S.E.").
  const aName = normalizePersonName(name);
  const bName = normalizePersonName(otherName);
  if (!aName || !bName) return false;
  return aName === bName;
}

/**
 * Daftar NIP anggota dekwan penguji untuk suatu rekam ujian.
 * Sumber: kolom susunan_penguji_json (JSON array: { peran, nama, nip }).
 */
export function getExamPanelNips(examRow) {
  const nips = new Set();
  if (!examRow) return nips;

  let susunan = [];
  try {
    const parsed = JSON.parse(examRow.susunan_penguji_json || '[]');
    if (Array.isArray(parsed)) susunan = parsed;
  } catch {
    susunan = [];
  }

  for (const anggota of susunan) {
    if (!anggota) continue;
    if (anggota.nip) nips.add(String(anggota.nip).trim());
    else if (anggota.nama) {
      const resolved = resolveNipByName(anggota.nama);
      if (resolved) nips.add(resolved);
    }
  }

  return nips;
}

/**
 * Apakah pengguna tertentu termasuk anggota dekwan penguji pada rekam ujian?
 */
export function isExamPanelist(user, examRow) {
  if (!user || !examRow) return false;

  const userNip = user.nomorInduk || user.nip || null;
  const panelNips = getExamPanelNips(examRow);
  if (panelNips.size === 0) return false;

  if (userNip && panelNips.has(String(userNip).trim())) return true;

  // Fallback nama: kesamaan PERSIS yang dinormalisasi (bukan substring).
  const userName = user.nama || null;
  if (!userName) return false;

  let susunan = [];
  try {
    const parsed = JSON.parse(examRow.susunan_penguji_json || '[]');
    if (Array.isArray(parsed)) susunan = parsed;
  } catch {
    susunan = [];
  }

  return susunan.some((anggota) => isSamePerson({ nip: userNip, name: userName, otherName: anggota.nama }));
}

export default {
  normalizePersonName,
  resolveNipByName,
  isSamePerson,
  getExamPanelNips,
  isExamPanelist
};
