/**
 * Academic Process Service - SIM Tugas Akhir FEB UTM
 * Inti business process akademik: template tahapan per jenjang, entitas Tugas Akhir,
 * state machine tahapan, checklist syarat, log bimbingan, versioning naskah, dan publikasi.
 */

import { db } from '../database/db.js';
import { INITIAL_TAHAPAN_JENJANG } from '../../src/data/superadminData.js';
import { resolveNipByName } from './supervisorIdentity.js';

// Status tahapan yang dipakai konsisten di seluruh alur
export const TAHAP_STATUS = {
  BELUM_MULAI: 'Belum Mulai',
  BERJALAN: 'Berjalan',
  MENUNGGU_PEMBIMBING: 'Menunggu Persetujuan Pembimbing',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  SIAP_DILAKSANAKAN: 'Siap Dilaksanakan',
  SELESAI: 'Selesai'
};

/**
 * Menentukan kebutuhan dokumen resmi yang terkait dengan sebuah tahap.
 */
function deriveDokumenTerkait(namaTahap) {
  const nama = String(namaTahap || '').toLowerCase();
  if (nama.includes('proposal')) return 'Berita Acara & Form Penilaian Ujian Proposal';
  if (nama.includes('hasil')) return 'Berita Acara & Form Penilaian Seminar Hasil';
  if (nama.includes('tertutup')) return 'Berita Acara Ujian Tertutup & Lembar Revisi';
  if (nama.includes('terbuka') || nama.includes('promosi')) return 'Berita Acara Ujian Terbuka & Lembar Pengesahan';
  if (nama.includes('kualifikasi')) return 'Berita Acara Ujian Kualifikasi';
  if (nama.includes('kelayakan')) return 'Berita Acara Desk Review Kelayakan';
  if (nama.includes('sidang') || nama.includes('ujian akhir') || nama.includes('takk')) return 'Berita Acara Sidang & Form Penilaian';
  if (nama.includes('pengesahan') || nama.includes('yudisium')) return 'Lembar Pengesahan Naskah Final';
  if (nama.includes('penetapan') || nama.includes('pengajuan') || nama.includes('plotting')) return 'Form Usulan Topik & SK Penetapan Pembimbing';
  if (nama.includes('publikasi') || nama.includes('bebas plagiasi')) return 'Bukti Publikasi & Surat Bebas Plagiasi';
  return 'Dokumen Administrasi Tahapan';
}

/**
 * Aturan syarat minimal per tahap (dapat disesuaikan lewat konfigurasi template).
 */
function stageRequirements(jenjang, urutan, totalTahap, rules) {
  const isFirst = urutan === 1;
  const isLast = urutan === totalTahap;
  const minBimbingan = isFirst ? 0 : (isLast ? (rules?.minBimbingan || 6) : 2);
  const requiresNaskah = isFirst ? 0 : 1;
  // Audit 21 Oktober 2026 (P1-3): rules_json menyatakan syarat publikasi untuk
  // S1 ("Draft Artikel Jurnal Nasional / Prosiding") maupun D3 ("Laporan
  // Portofolio Kelayakan Bisnis"), tetapi hanya S2 & S3 yang menjadikannya
  // syarat. Kini SEMUA jenjang mewajibkan publikasi pada tahap akhir.
  const requiresPublikasi = isLast ? 1 : 0;
  return { minBimbingan, requiresNaskah, requiresPublikasi };
}

/**
 * Seeding idempotent template tahapan untuk seluruh jenjang (D3, S1, S2, S3).
 */
export function seedTahapanTemplate() {
  const count = db.prepare('SELECT COUNT(*) as count FROM tahapan_template').get().count;
  if (count > 0) return;

  console.log('[Academic] Seeding template tahapan per jenjang...');
  const insert = db.prepare(`
    INSERT OR IGNORE INTO tahapan_template
      (id, jenjang, urutan, kode_tahap, nama_tahap, deskripsi, jenis_dokumen_terkait, min_bimbingan, requires_naskah, requires_publikasi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const [jenjang, val] of Object.entries(INITIAL_TAHAPAN_JENJANG)) {
    const totalTahap = val.totalTahap || (val.tahapanList || []).length;
    for (const t of val.tahapanList || []) {
      const req = stageRequirements(jenjang, t.nomor, totalTahap, val.rules);
      insert.run(
        `tpl-${jenjang}-${t.nomor}`,
        jenjang,
        t.nomor,
        t.kode,
        t.nama,
        t.deskripsi || '',
        deriveDokumenTerkait(t.nama),
        req.minBimbingan,
        req.requiresNaskah,
        req.requiresPublikasi
      );
    }
  }
}

/**
 * Daftar template tahapan sebuah jenjang, terurut.
 */
export function getTemplate(jenjang) {
  return db.prepare('SELECT * FROM tahapan_template WHERE jenjang = ? ORDER BY urutan ASC').all(jenjang);
}

/**
 * Memastikan seluruh baris tahap_status untuk sebuah Tugas Akhir telah dibuat.
 * Tahap pertama otomatis berstatus "Berjalan", sisanya "Belum Mulai".
 */
export function ensureStages(ta) {
  if (!ta) return [];
  const template = getTemplate(ta.jenjang);
  const existing = db.prepare('SELECT kode_tahap FROM tahap_status WHERE tugas_akhir_id = ?')
    .all(ta.id)
    .map((r) => r.kode_tahap);
  const insert = db.prepare(`
    INSERT OR IGNORE INTO tahap_status
      (id, tugas_akhir_id, kode_tahap, nama_tahap, urutan, status, tanggal_mulai)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();

  template.forEach((t, index) => {
    if (!existing.includes(t.kode_tahap)) {
      const isFirst = index === 0;
      insert.run(
        `ts-${ta.id}-${t.kode_tahap}`,
        ta.id,
        t.kode_tahap,
        t.nama_tahap,
        t.urutan,
        isFirst ? TAHAP_STATUS.BERJALAN : TAHAP_STATUS.BELUM_MULAI,
        isFirst ? now : null
      );
    }
  });

  if (!ta.tahap_aktif_kode && template.length > 0) {
    db.prepare('UPDATE tugas_akhir SET tahap_aktif_kode = ? WHERE id = ?').run(template[0].kode_tahap, ta.id);
  }

  return db.prepare('SELECT * FROM tahap_status WHERE tugas_akhir_id = ? ORDER BY urutan ASC').all(ta.id);
}

/**
 * Mengambil Tugas Akhir aktif milik NIM, atau membuatkannya otomatis bila belum ada.
 */
export function ensureTaForNim(nim) {
  const cleanNim = String(nim || '').trim();
  if (!cleanNim) return null;

  let ta = db.prepare('SELECT * FROM tugas_akhir WHERE nim = ? ORDER BY created_at DESC LIMIT 1').get(cleanNim);
  if (ta) {
    ensureStages(ta);
    return ta;
  }

  const user = db.prepare('SELECT * FROM users WHERE nomor_induk = ?').get(cleanNim);
  if (!user) return null;

  const reg = db.prepare('SELECT * FROM pendaftaran_ujian WHERE nim = ? ORDER BY tanggal_daftar DESC LIMIT 1').get(cleanNim);
  const taId = `ta-${cleanNim}`;

  db.prepare(`
    INSERT INTO tugas_akhir
      (id, mahasiswa_id, nim, nama_mahasiswa, jenjang, prodi, pembimbing_utama, pembimbing_pendamping, pembimbing_utama_nip, pembimbing_pendamping_nip, judul, tahap_aktif_kode, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'Aktif')
  `).run(
    taId,
    user.id,
    cleanNim,
    user.nama,
    user.jenjang || 'S1',
    user.prodi || reg?.program_studi || 'S-1 Manajemen',
    reg?.pembimbing_utama || null,
    reg?.kopromotor || null,
    reg?.pembimbing_utama_nip || resolveNipByName(reg?.pembimbing_utama) || null,
    reg?.pembimbing_pendamping_nip || resolveNipByName(reg?.kopromotor) || null,
    reg?.judul || null
  );

  ta = db.prepare('SELECT * FROM tugas_akhir WHERE id = ?').get(taId);
  ensureStages(ta);
  return db.prepare('SELECT * FROM tugas_akhir WHERE id = ?').get(taId);
}

/**
 * Menghitung checklist kelengkapan syarat sebuah tahap berdasarkan relasi database.
 */
export function buildChecklist(ta, templateRow) {
  const items = [];

  const minBimbingan = templateRow?.min_bimbingan || 0;
  const approvedBimbingan = db.prepare(
    "SELECT COUNT(*) as c FROM bimbingan_log WHERE tugas_akhir_id = ? AND status = 'Disetujui'"
  ).get(ta.id).c;
  items.push({
    key: 'bimbingan',
    label: `Log bimbingan disetujui minimal ${minBimbingan} sesi`,
    terpenuhi: approvedBimbingan >= minBimbingan,
    capaian: approvedBimbingan
  });

  if (templateRow?.requires_naskah) {
    const naskahCount = db.prepare('SELECT COUNT(*) as c FROM naskah_versi WHERE tugas_akhir_id = ?').get(ta.id).c;
    items.push({
      key: 'naskah',
      label: 'Naskah telah diunggah ke sistem',
      terpenuhi: naskahCount > 0,
      capaian: naskahCount
    });

    // Audit 21 Oktober 2026 (temuan BP-2): Keberadaan naskah BELUM cukup.
    // Naskah harus TELAH DITELAAH dan DISETUJUI pembimbing sebelum tahap
    // dapat diajukan — inilah yang hilang sebelumnya sehingga naskah dan
    // tahap tidak pernah saling mengunci.
    const naskahDisetujui = db
      .prepare("SELECT COUNT(*) as c FROM naskah_versi WHERE tugas_akhir_id = ? AND status_persetujuan = 'Disetujui'")
      .get(ta.id).c;
    items.push({
      key: 'naskahDisetujui',
      label: 'Naskah telah disetujui pembimbing',
      terpenuhi: naskahDisetujui > 0,
      capaian: naskahDisetujui
    });
  }

  // -----------------------------------------------------------------
  // Catatan (P1-3): aturan minSKS / minToefl / maxTurnitin TIDAK berada di
  // sini. Aturan tersebut adalah SYARAT PENDAFTARAN UJIAN dan ditegakkan di
  // gerbang pendaftaran (POST /api/admin/verifikasi-berkas). Menaruhnya di
  // checklist tahap menimbulkan DEADLOCK: checklist tahap pertama membutuhkan
  // metrik, sedangkan metrik baru diperoleh setelah pendaftaran — yang
  // sendiri mensyaratkan tahap prasyarat selesai.
  //
  // Yang ditegakkan di checklist tahap: jumlah bimbingan, naskah, persetujuan
  // naskah oleh pembimbing, dan publikasi (syaratPublikasi).

  if (templateRow?.requires_publikasi) {
    const pubCount = db.prepare(
      "SELECT COUNT(*) as c FROM publikasi WHERE tugas_akhir_id = ? AND status_verifikasi = 'Terverifikasi'"
    ).get(ta.id).c;
    items.push({
      key: 'publikasi',
      label: 'Publikasi ilmiah terverifikasi',
      terpenuhi: pubCount > 0,
      capaian: pubCount
    });
  }

  return items;
}

export default {
  TAHAP_STATUS,
  seedTahapanTemplate,
  getTemplate,
  ensureStages,
  ensureTaForNim,
  buildChecklist
};
