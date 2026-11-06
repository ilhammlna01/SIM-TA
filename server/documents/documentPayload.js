/**
 * Rekonsiliasi Payload Dokumen Resmi — sumber kebenaran SINGKUL: basis data.
 *
 * Latar Belakang (Audit 21 Oktober 2026 — FINDING-03 parsial):
 * Remediasi awal hanya applying rekonsiliasi DB pada Berita Acara Ujian.
 * Empat generator lain (Lembar Pengesahan, Kartu Kendali Bimbingan, Surat
 * Tugas Penguji, Surat Tugas Pembimbing) masih menerima SELURUH isi dokumen
 * dari request body klien, termasuk nama/NIM/judul/panitia. Akibatnya akun
 * ber-peran terendah (mahasiswa) dapat mencetak dokumen resmi atas nama
 * mahasiswa lain, dan dokumen tersebut diarsipkan sebagai "Terverifikasi"
 * sehingga lolos pada endpoint verifikasi publik.
 *
 * Modul ini menyediakan resolver yang mengambil identitas, data akademik, dan
 * komposisi penguji SELALU dari SQLite. Nilai dari klien hanya dipakai bila
 * tidak ada padanan di database (mis. field kosmetik).
 */

import { db } from '../database/db.js';
import { resolveNipByName } from '../academic/supervisorIdentity.js';

function firstRow(rows) {
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/**
 * Mengambil konteks akademik lengkap seorang mahasiswa.
 * Sumber: users, pendaftaran_ujian, tugas_akhir, ujian_penguji.
 */
export function resolveStudentContext(nim) {
  const cleanNim = String(nim || '').trim();
  if (!cleanNim) return null;

  const user = firstRow(db.prepare('SELECT * FROM users WHERE nomor_induk = ?').all(cleanNim));
  const registration = firstRow(
    db.prepare('SELECT * FROM pendaftaran_ujian WHERE nim = ? ORDER BY tanggal_daftar DESC LIMIT 1').all(cleanNim)
  );
  const ta = firstRow(
    db.prepare('SELECT * FROM tugas_akhir WHERE nim = ? ORDER BY created_at DESC LIMIT 1').all(cleanNim)
  );
  const exam = firstRow(
    db.prepare('SELECT * FROM ujian_penguji WHERE nim = ? ORDER BY tanggal_ujian DESC LIMIT 1').all(cleanNim)
  );

  if (!user && !registration && !ta && !exam) return null;

  // Identitas mahasiswa: prioritaskan data users, lalu pendaftaran, lalu TA.
  const namaMahasiswa =
    user?.nama || registration?.nama_mahasiswa || ta?.nama_mahasiswa || exam?.nama_mahasiswa || '';
  const jenjang =
    user?.jenjang || registration?.jenjang || ta?.jenjang || exam?.jenjang || 'S1';
  const prodi =
    user?.prodi || registration?.program_studi || ta?.prodi || exam?.program_studi || 'S-1 Manajemen';
  const judul = ta?.judul || registration?.judul || exam?.judul || '';

  // Pembimbing: dari tugas_akhir (relasi terbaru), lalu pendaftaran.
  const pembimbingUtama = ta?.pembimbing_utama || registration?.pembimbing_utama || '';
  const pembimbingPendamping = ta?.pembimbing_pendamping || registration?.kopromotor || '';
  const pembimbing1Nip =
    ta?.pembimbing_utama_nip || registration?.pembimbing_utama_nip || resolveNipByName(pembimbingUtama) || '';
  const pembimbing2Nip =
    ta?.pembimbing_pendamping_nip || registration?.pembimbing_pendamping_nip || resolveNipByName(pembimbingPendamping) || '';

  return {
    nim: cleanNim,
    namaMahasiswa,
    jenjang,
    prodi,
    judul,
    pembimbingUtama,
    pembimbingPendamping,
    pembimbing1: pembimbingUtama,
    pembimbing2: pembimbingPendamping,
    pembimbing1Nip,
    pembimbing2Nip,
    tahap: exam?.jenis_ujian || registration?.jenis_ujian || 'Sidang Skripsi',
    ruang: exam?.ruang || 'Ruang Sidang FEB Gedung Rektorat Lt. 2',
    jadwalTanggal: exam?.tanggal_ujian || registration?.tanggal_daftar || '',
    jadwalJam: exam?.jam_ujian || '',
    registration,
    ta,
    exam
  };
}

/**
 * Mengambil komposisi dewan penguji dari susunan_penguji_json.
 * @returns {Array<{nama, nip, peran}>}
 */
export function resolveExamPanel(nim, ujianId) {
  let exam = null;
  if (ujianId) {
    exam = firstRow(db.prepare('SELECT * FROM ujian_penguji WHERE id = ?').all(String(ujianId).trim()));
  }
  if (!exam && nim) {
    exam = firstRow(
      db.prepare('SELECT * FROM ujian_penguji WHERE nim = ? ORDER BY tanggal_ujian DESC LIMIT 1').all(String(nim).trim())
    );
  }
  if (!exam) return [];

  let susunan = [];
  try {
    const parsed = JSON.parse(exam.susunan_penguji_json || '[]');
    if (Array.isArray(parsed)) susunan = parsed;
  } catch {
    susunan = [];
  }

  return susunan
    .filter((a) => a && (a.nama || a.nip))
    .map((a) => ({
      nama: a.nama || '-',
      nip: a.nip || resolveNipByName(a.nama) || '-',
      peran: a.peran || 'Penguji'
    }));
}

/**
 * Mengambil riwayat bimbingan nyata dari tabel bimbingan_log.
 * @returns {Array<{sesi, tgl, materi, catatan, paraf}>}
 */
export function resolveBimbinganLog(nim) {
  const cleanNim = String(nim || '').trim();
  if (!cleanNim) return [];

  const rows = db.prepare(`
    SELECT tanggal, topik, catatan, status, disetujui_oleh
    FROM bimbingan_log
    WHERE nim = ?
    ORDER BY tanggal ASC
  `).all(cleanNim);

  return rows.map((r, idx) => ({
    sesi: idx + 1,
    tgl: r.tanggal || '-',
    materi: r.topik || '-',
    catatan: r.catatan || '-',
    paraf: r.status === 'Disetujui' ? '✓' : '○'
  }));
}

/**
 * Menyusun payload terverifikasi untuk generator dokumen.
 *
 * @param {Object} options
 * @param {string} options.nim NIM mahasiswa target
 * @param {Object} options.payload Payload dari klien
 * @param {string[]} [options.lockedFields] Field yang WAJIB berasal dari DB
 *        (nilai/grade/status kelulusan). Field ini tidak dapat di-override klien.
 * @param {Object} [options.examOverrides] Nilai terverifikasi dari ujian_penguji
 * @param {Array} [options.panel] Daftar dewan penguji dari DB
 * @returns {Object} payload terverifikasi
 */
export function buildVerifiedPayload({ nim, payload = {}, lockedFields = {}, examOverrides = {}, panel = null }) {
  const context = resolveStudentContext(nim);
  if (!context) return null;

  const verified = { ...payload };

  // Identitas wajib: SELALU dari database, tidak dapat di-override klien.
  verified.nim = context.nim;
  verified.namaMahasiswa = context.namaMahasiswa;
  verified.jenjang = context.jenjang;
  verified.prodi = context.prodi;
  verified.judul = context.judul || payload.judul || '';
  verified.pembimbing1 = context.pembimbing1;
  verified.pembimbing2 = context.pembimbing2;
  verified.pembimbing1Nip = context.pembimbing1Nip;
  verified.pembimbing2Nip = context.pembimbing2Nip;
  verified.pembimbing = context.pembimbingUtama;
  verified.dosenNama = context.pembimbingUtama;
  verified.tahap = context.tahap;
  verified.ruang = context.ruang;
  verified.jadwalTanggal = context.jadwalTanggal;
  verified.jadwalJam = context.jadwalJam;

  // Komposisi penguji: identitas (nama/NIP/peran) dari susunan_penguji_json.
  // Nilai per anggota dipertahankan dari klien bila ada (nilai per penguji),
  // namun identitasnya TIDAK dapat dipalsukan klien.
  if (Array.isArray(panel) && panel.length > 0) {
    const clientScores = Array.isArray(payload.pengujiList) ? payload.pengujiList : [];
    verified.pengujiList = panel.map((p, idx) => ({
      ...p,
      nilai: clientScores[idx]?.nilai !== undefined ? clientScores[idx].nilai : p.nilai
    }));
    const ketua = panel.find((p) => /ketua/i.test(p.peran || '')) || panel[0];
    verified.ketuaPenguji = ketua?.nama || '';
    verified.sekretarisPenguji = panel.find((p) => /sekretaris/i.test(p.peran || ''))?.nama || '';
    verified.anggotaPenguji = panel.find((p) => !/ketua|sekretaris/i.test(p.peran || ''))?.nama || '';
  }

  // Field yang dikunci ke database (nilai, grade, status kelulusan).
  for (const [key, value] of Object.entries(lockedFields)) {
    if (value !== null && value !== undefined && value !== '') {
      verified[key] = value;
    }
  }

  // Nilai terverifikasi dari rekam ujian (jika ada).
  for (const [key, value] of Object.entries(examOverrides || {})) {
    if (value !== null && value !== undefined && value !== '') {
      verified[key] = value;
    }
  }

  verified.__context = context;
  return verified;
}

export default {
  resolveStudentContext,
  resolveExamPanel,
  resolveBimbinganLog,
  buildVerifiedPayload
};
