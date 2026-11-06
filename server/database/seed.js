import db from './db.js';
import { hashPassword, generateTemporaryPassword } from '../utils/password.js';
import { resolveNipByName } from '../academic/supervisorIdentity.js';
import { seedTahapanTemplate, ensureTaForNim } from '../academic/academicService.js';
import {
  INITIAL_USER_ACCOUNTS,
  INITIAL_MASTER_PRODI,
  INITIAL_TAHAPAN_JENJANG,
  INITIAL_KUOTA_DOSEN
} from '../../src/data/superadminData.js';
import {
  INITIAL_VERIFIKASI_BERKAS,
  INITIAL_SK_DOKUMEN,
  INITIAL_RUANGAN_UJIAN,
  INITIAL_JADWAL_TAHAPAN
} from '../../src/data/adminData.js';
import {
  INITIAL_DAFTAR_UJIAN_PENGUJI,
  INITIAL_KOREKSI_PENGUJI
} from '../../src/data/pengujiData.js';
import { INITIAL_APPROVAL_QUEUE } from '../../src/data/pembimbingData.js';

export function seedInitialData() {
  console.log('[Database Seeder] Memeriksa data awal database...');

  // 1. Seed Users
  //
  // Catatan Keamanan (Audit 21 Oktober 2026 — FINDING-01):
  // Setiap akun awal memperoleh kata sandi ACAK INDIVIDUAL, bukan kata sandi
  // universal institusional. Akun ditandai `must_change_password = 1` sehingga
  // pengguna wajib menggantinya pada login pertama. Administrator-issue kata
  // sandi awal melalui menu "Reset Kata Sandi" (superadmin), yang menampilkan
  // kata sandi sementara satu kali.
  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('[Database Seeder] Melakukan seeding data akun pengguna dengan kata sandi acak individual...');
    const insertUser = db.prepare(`
      INSERT INTO users (id, nomor_induk, nama, email, role, jenjang, prodi, password, eligible_roles, status, last_login, credential_epoch, token_version, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1)
    `);
    for (const u of INITIAL_USER_ACCOUNTS) {
      insertUser.run(
        u.id,
        u.nomorInduk,
        u.nama,
        u.email,
        u.role,
        u.jenjang,
        u.prodi,
        hashPassword(generateTemporaryPassword()),
        u.eligibleRoles ? JSON.stringify(u.eligibleRoles) : JSON.stringify([u.role]),
        u.status,
        u.lastLogin
      );
    }
    console.log('[Database Seeder] Akun awal ter-seed. Gunakan superadmin > Reset Kata Sandi untuk mendistribusikan kata sandi awal.');
  } else {
    // Sinkronkan akun bawaan dari INITIAL_USER_ACCOUNTS yang belum ada di database
    try {
      const insertUserOrIgnore = db.prepare(`
        INSERT OR IGNORE INTO users (id, nomor_induk, nama, email, role, jenjang, prodi, password, eligible_roles, status, last_login, credential_epoch, token_version, must_change_password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1)
      `);
      const updateEligible = db.prepare('UPDATE users SET eligible_roles = ? WHERE nomor_induk = ?');
      for (const u of INITIAL_USER_ACCOUNTS) {
        insertUserOrIgnore.run(
          u.id,
          u.nomorInduk,
          u.nama,
          u.email,
          u.role,
          u.jenjang,
          u.prodi,
          hashPassword(generateTemporaryPassword()),
          u.eligibleRoles ? JSON.stringify(u.eligibleRoles) : JSON.stringify([u.role]),
          u.status,
          u.lastLogin
        );
        if (u.eligibleRoles) {
          updateEligible.run(JSON.stringify(u.eligibleRoles), u.nomorInduk);
        }
      }
    } catch (e) {
      console.warn('[Database Seeder] Warning updating accounts:', e.message);
    }
  }

  // 2. Seed Prodi
  const prodiCount = db.prepare('SELECT count(*) as count FROM prodi').get().count;
  if (prodiCount === 0) {
    console.log('[Database Seeder] Melakukan seeding master prodi...');
    const insertProdi = db.prepare(`
      INSERT INTO prodi (id, kode_prodi, nama_prodi, jenjang, akreditasi, no_sk_akreditasi, kaprodi, nip_kaprodi, kuota_mahasiswa, mahasiswa_aktif, status, deskripsi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of INITIAL_MASTER_PRODI) {
      insertProdi.run(
        p.id, p.kodeProdi, p.namaProdi, p.jenjang, p.akreditasi, p.noSkAkreditasi || '',
        p.kaprodi, p.nipKaprodi || '', p.kuotaMahasiswa, p.mahasiswaAktif, p.status, p.deskripsi || ''
      );
    }
  }

  // 3. Seed Tahapan Aturan
  const tahapanCount = db.prepare('SELECT count(*) as count FROM tahapan_aturan').get().count;
  if (tahapanCount === 0) {
    console.log('[Database Seeder] Melakukan seeding konfigurasi aturan jenjang...');
    const insertTahapan = db.prepare(`
      INSERT INTO tahapan_aturan (jenjang, jenjang_label, total_tahap, tahapan_json, rules_json)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const [jenjang, val] of Object.entries(INITIAL_TAHAPAN_JENJANG)) {
      insertTahapan.run(
        jenjang,
        val.jenjangLabel,
        val.totalTahap,
        JSON.stringify(val.tahapanList),
        JSON.stringify(val.rules)
      );
    }
  }

  // 4. Seed Kuota Dosen
  const kuotaCount = db.prepare('SELECT count(*) as count FROM kuota_dosen').get().count;
  if (kuotaCount === 0) {
    console.log('[Database Seeder] Melakukan seeding kuota bimbingan dosen...');
    const insertKuota = db.prepare(`
      INSERT INTO kuota_dosen (id, nama, nip, jabatan, prodi, kuota_utama, terisi_utama, kuota_pendamping, terisi_pendamping, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const k of INITIAL_KUOTA_DOSEN) {
      insertKuota.run(
        k.id, k.nama, k.nip, k.jabatan, k.prodi,
        k.kuotaUtama, k.terisiUtama, k.kuotaPendamping, k.terisiPendamping, k.status
      );
    }
  }

  // 5. Seed Verifikasi Berkas Ujian (Admin)
  const berkasCount = db.prepare('SELECT count(*) as count FROM pendaftaran_ujian').get().count;
  if (berkasCount === 0) {
    console.log('[Database Seeder] Melakukan seeding pendaftaran ujian & berkas...');
    const insertBerkas = db.prepare(`
      INSERT INTO pendaftaran_ujian (id, mhs_id, nim, nama_mahasiswa, jenjang, program_studi, jenis_ujian, tanggal_daftar, status_verifikasi, pembimbing_utama, kopromotor, judul, berkas_json, catatan_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const b of INITIAL_VERIFIKASI_BERKAS) {
      insertBerkas.run(
        b.id, b.mhsId, b.nim, b.namaMahasiswa, b.jenjang, b.programStudi,
        b.jenisUjian, b.tanggalDaftar, b.statusVerifikasi, b.pembimbingUtama || '',
        b.kopromotor || '', b.judul, JSON.stringify(b.berkasList || []), b.catatanAdmin || ''
      );
    }
  }

  // 5b. Backfill NIP Pembimbing/Kopromotor pada pendaftaran ujian
  //
  // Audit 21 Oktober 2026: identitas pembimbing WAJIB berbasis NIP, bukan
  // pencocokan nama bebas. Kolom NIP diisi dari master data dosen.
  try {
    const rows = db.prepare(`
      SELECT id, pembimbing_utama, kopromotor, pembimbing_utama_nip, pembimbing_pendamping_nip
      FROM pendaftaran_ujian
    `).all();
    const upd = db.prepare(`
      UPDATE pendaftaran_ujian
      SET pembimbing_utama_nip = ?, pembimbing_pendamping_nip = ?
      WHERE id = ?
    `);
    let updated = 0;
    for (const r of rows) {
      const nipUtama = r.pembimbing_utama_nip || resolveNipByName(r.pembimbing_utama) || null;
      const nipPendamping = r.pembimbing_pendamping_nip || resolveNipByName(r.kopromotor) || null;
      if (nipUtama !== r.pembimbing_utama_nip || nipPendamping !== r.pembimbing_pendamping_nip) {
        upd.run(nipUtama, nipPendamping, r.id);
        updated += 1;
      }
    }
    if (updated > 0) {
      console.log(`[Database Seeder] NIP pembimbing ter-backfill pada ${updated} record pendaftaran ujian.`);
    }
  } catch (nipErr) {
    console.warn('[Database Seeder] Warning backfill NIP pembimbing:', nipErr.message);
  }

  // 6. Seed SK Dokumen
  const skCount = db.prepare('SELECT count(*) as count FROM sk_dokumen').get().count;
  if (skCount === 0) {
    console.log('[Database Seeder] Melakukan seeding arsip SK resmi...');
    const insertSK = db.prepare(`
      INSERT INTO sk_dokumen (id, nomor_sk, jenis_sk, jenjang, program_studi, mahasiswa_nim, mahasiswa_nama, judul_ta, dosen_terkait_json, tanggal_terbit, penandatangan, status, file_pdf)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const sk of INITIAL_SK_DOKUMEN) {
      insertSK.run(
        sk.id, sk.nomorSK, sk.jenisSK, sk.jenjang, sk.programStudi,
        sk.mahasiswaNIM, sk.mahasiswaNama, sk.judulTA, JSON.stringify(sk.dosenTerkait || []),
        sk.tanggalTerbit, sk.penandatangan, sk.status, sk.filePdf || ''
      );
    }
  }

  // 7. Seed Alokasi Ruangan
  const ruangCount = db.prepare('SELECT count(*) as count FROM alokasi_ruangan').get().count;
  if (ruangCount === 0) {
    console.log('[Database Seeder] Melakukan seeding alokasi ruangan ujian...');
    const insertRuang = db.prepare(`
      INSERT INTO alokasi_ruangan (id, nama_mahasiswa, nim, jenjang, jenis_ujian, ruang_id, ruang_nama, tanggal, jam_mulai, jam_selesai, moda, ketua_penguji, status, catatan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of INITIAL_RUANGAN_UJIAN) {
      insertRuang.run(
        r.id, r.namaMahasiswa, r.nim, r.jenjang, r.jenisUjian,
        r.ruangId, r.ruangNama, r.tanggal, r.jamMulai, r.jamSelesai,
        r.moda, r.ketuaPenguji, r.status, r.catatan || ''
      );
    }
  }

  // 8. Seed Ujian Sidang Penguji
  const ujianPengujiCount = db.prepare('SELECT count(*) as count FROM ujian_penguji').get().count;
  if (ujianPengujiCount === 0) {
    console.log('[Database Seeder] Melakukan seeding daftar ujian dewan penguji...');
    const insertUjian = db.prepare(`
      INSERT INTO ujian_penguji (id, nim, nama_mahasiswa, jenjang, program_studi, jenis_ujian, judul, tanggal_ujian, jam_ujian, ruang, status_ujian, peran_dosen, susunan_penguji_json, naskah_url, penilaian_submitted, nilai_final, grade, rekomendasi_kelayakan, catatan_evaluasi, catatan_tersimpan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of INITIAL_DAFTAR_UJIAN_PENGUJI) {
      insertUjian.run(
        u.id,
        u.nim,
        u.namaMahasiswa,
        u.jenjang,
        u.programStudi,
        u.jenisUjian,
        u.judul || null,
        u.jadwal || '',
        u.waktu || '',
        u.ruang || '',
        u.statusUjian || 'Menunggu Pelaksanaan',
        u.peranPenguji || 'Penguji',
        Array.isArray(u.susunanPenguji) ? JSON.stringify(u.susunanPenguji) : null,
        u.fileNaskah || '',
        u.penilaianSubmitted ? 1 : 0,
        u.nilaiFinal !== undefined && u.nilaiFinal !== null ? u.nilaiFinal : null,
        u.grade || null,
        u.rekomendasiKelayakan || null,
        u.catatanEvaluasi || null,
        u.catatanTersimpan || 0
      );
    }
  } else {
    // Backfill judul untuk basis data lama yang belum memiliki kolom judul terisi.
    try {
      const updateJudul = db.prepare('UPDATE ujian_penguji SET judul = ? WHERE id = ? AND (judul IS NULL OR judul = \'\')');
      for (const u of INITIAL_DAFTAR_UJIAN_PENGUJI) {
        if (u.judul) updateJudul.run(u.judul, u.id);
      }
    } catch (_) {}

    // Backfill susunan dewan penguji untuk basis data lama (agar portal penguji terisi).
    try {
      const updateSusunan = db.prepare('UPDATE ujian_penguji SET susunan_penguji_json = ? WHERE id = ? AND (susunan_penguji_json IS NULL OR susunan_penguji_json = \'\')');
      for (const u of INITIAL_DAFTAR_UJIAN_PENGUJI) {
        if (Array.isArray(u.susunanPenguji) && u.susunanPenguji.length > 0) {
          updateSusunan.run(JSON.stringify(u.susunanPenguji), u.id);
        }
      }
    } catch (_) {}
  }

  // 9. Seed Koreksi Penguji
  const koreksiCount = db.prepare('SELECT count(*) as count FROM koreksi_penguji').get().count;
  if (koreksiCount === 0) {
    console.log('[Database Seeder] Melakukan seeding catatan koreksi penguji...');
    const insertKoreksi = db.prepare(`
      INSERT INTO koreksi_penguji (id, ujian_id, mhs_nim, mhs_nama, jenjang, penguji_id, nama_penguji, bagian_naskah, halaman, catatan_koreksi, tingkat_urgensi, status_verifikasi, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const k of INITIAL_KOREKSI_PENGUJI) {
      insertKoreksi.run(
        k.id,
        k.ujianId,
        k.nim || '',
        k.namaMahasiswa || '',
        k.jenjang || 'S1',
        k.pengujiId || 'penguji-faidal',
        k.namaPenguji || 'Dr. Faidal, S.E., M.M.',
        k.bab || k.kategori || 'Revisi',
        k.halaman || '',
        k.catatanKoreksi || '',
        k.tingkatUrgensi || 'Sedang',
        k.statusVerifikasi || 'Menunggu Approval Penguji',
        k.tanggal || '24 September 2026'
      );
    }
  }

  // 10. Seed Jadwal & Linimasa Tahapan Akademik (Admin Akademik)
  const jadwalCount = db.prepare('SELECT count(*) as count FROM jadwal_tahapan').get().count;
  if (jadwalCount === 0) {
    console.log('[Database Seeder] Melakukan seeding jadwal tahapan akademik...');
    const insertJadwal = db.prepare(`
      INSERT INTO jadwal_tahapan (
        id, jenjang, prodi, tahap_kode, tahap_nama, semester,
        tanggal_mulai, tanggal_selesai, jam_deadline, status,
        moda, target_mahasiswa, terdaftar_mahasiswa, persyaratan_ringkas,
        catatan_sop, penanggung_jawab
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const j of INITIAL_JADWAL_TAHAPAN) {
      insertJadwal.run(
        j.id,
        j.jenjang,
        j.prodi,
        j.tahapKode,
        j.tahapNama,
        j.semester,
        j.tanggalMulai,
        j.tanggalSelesai,
        j.jamDeadline || '23:59',
        j.status || 'Akan Datang',
        j.moda || 'Daring via SIM-TA',
        j.targetMahasiswa || 100,
        j.terdaftarMahasiswa || 0,
        j.persyaratanRingkas || '',
        j.catatanSOP || '',
        j.penanggungJawab || 'Subbag Akademik & Pascasarjana'
      );
    }
  }

  // 11. Seed Registrasi Berkas Penyimpanan (Storage Files)
  const filesCount = db.prepare('SELECT count(*) as count FROM storage_files').get().count;
  if (filesCount === 0) {
    console.log('[Database Seeder] Melakukan seeding registrasi berkas penyimpanan...');
    const insertFile = db.prepare(`
      INSERT OR IGNORE INTO storage_files (id, filename, original_name, category, uploader_id, uploader_nim, uploader_role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const defaultFiles = [
      { id: 'f-1', filename: 'Proposal_Skripsi_Final_Sempro_Dinda.pdf', originalName: 'Proposal_Skripsi_Final_Sempro_Dinda.pdf', category: 'naskah', uploaderId: 'usr-02', uploaderNim: '210211100142', uploaderRole: 'mahasiswa' },
      { id: 'f-2', filename: 'Draf_Lengkap_Tesis_Magister_Rahmat.pdf', originalName: 'Draf_Lengkap_Tesis_Magister_Rahmat.pdf', category: 'naskah', uploaderId: 'usr-mhs-230211200015', uploaderNim: '230211200015', uploaderRole: 'mahasiswa' },
      { id: 'f-3', filename: 'Draf_Disertasi_Kelayakan_Bambang.pdf', originalName: 'Draf_Disertasi_Kelayakan_Bambang.pdf', category: 'naskah', uploaderId: 'usr-mhs-210211300001', uploaderNim: '210211300001', uploaderRole: 'mahasiswa' },
      { id: 'f-4', filename: 'naskah_rahasia_bambang_s3.pdf', originalName: 'naskah_rahasia_bambang_s3.pdf', category: 'naskah', uploaderId: 'usr-mhs-210211300001', uploaderNim: '210211300001', uploaderRole: 'mahasiswa' },
      { id: 'f-5', filename: 'skripsi_andi.pdf', originalName: 'skripsi_andi.pdf', category: 'naskah', uploaderId: 'usr-mhs-210211100099', uploaderNim: '210211100099', uploaderRole: 'mahasiswa' }
    ];
    for (const f of defaultFiles) {
      insertFile.run(f.id, f.filename, f.originalName, f.category, f.uploaderId, f.uploaderNim, f.uploaderRole);
    }
  }

  // 12. Seed Template Tahapan per Jenjang & Bootstrap Entitas Tugas Akhir
  try {
    seedTahapanTemplate();
    const registeredStudents = db.prepare('SELECT DISTINCT nim FROM pendaftaran_ujian').all();
    for (const s of registeredStudents) {
      ensureTaForNim(s.nim);
    }
    console.log('[Database Seeder] Template tahapan per jenjang & entitas Tugas Akhir tersinkronisasi.');
  } catch (academicErr) {
    console.warn('[Database Seeder] Warning academic seeding:', academicErr.message);
  }

  // 12b. Backfill NIP Pembimbing pada entitas Tugas Akhir
  try {
    const tas = db.prepare(`
      SELECT id, nim, pembimbing_utama, pembimbing_pendamping, pembimbing_utama_nip, pembimbing_pendamping_nip
      FROM tugas_akhir
    `).all();
    const updTa = db.prepare(`
      UPDATE tugas_akhir
      SET pembimbing_utama_nip = ?, pembimbing_pendamping_nip = ?
      WHERE id = ?
    `);
    for (const t of tas) {
      const reg = db.prepare('SELECT pembimbing_utama_nip, pembimbing_pendamping_nip FROM pendaftaran_ujian WHERE nim = ? ORDER BY tanggal_daftar DESC LIMIT 1').get(t.nim);
      const nipUtama = t.pembimbing_utama_nip || reg?.pembimbing_utama_nip || resolveNipByName(t.pembimbing_utama) || null;
      const nipPendamping = t.pembimbing_pendamping_nip || reg?.pembimbing_pendamping_nip || resolveNipByName(t.pembimbing_pendamping) || null;
      if (nipUtama !== t.pembimbing_utama_nip || nipPendamping !== t.pembimbing_pendamping_nip) {
        updTa.run(nipUtama, nipPendamping, t.id);
      }
    }
  } catch (taNipErr) {
    console.warn('[Database Seeder] Warning backfill NIP pembimbing (Tugas Akhir):', taNipErr.message);
  }

  // 13. Sinkronisasi Antrean Persetujuan Pembimbing ke tahap_status (bootstrap satu kali).
  // Tahap aktif mahasiswa yang masih "Belum Mulai"/"Berjalan" diatur ke status
  // "Menunggu Persetujuan Pembimbing" agar alur persetujuan oleh Dosen Pembimbing
  // benar-benar tersimpan. Kondisi ini TIDAK menyentuh tahap yang sudah
  // diproses (Menunggu Verifikasi/Siap Dilaksanakan/Selesai), sehingga
  // keputusan pembimbing tidak ter-reset saat server dinyalakan ulang.
  try {
    for (const app of INITIAL_APPROVAL_QUEUE) {
      if (!app.nim) continue;
      const ta = ensureTaForNim(app.nim);
      if (!ta) continue;
      const activeKode = ta.tahap_aktif_kode;
      if (!activeKode) continue;
      db.prepare(`
        UPDATE tahap_status
        SET status = 'Menunggu Persetujuan Pembimbing', updated_at = CURRENT_TIMESTAMP
        WHERE tugas_akhir_id = ? AND kode_tahap = ?
          AND status IN ('Belum Mulai', 'Berjalan')
      `).run(ta.id, activeKode);
    }
  } catch (approvalErr) {
    console.warn('[Database Seeder] Warning approval-queue seeding:', approvalErr.message);
  }

  console.log('[Database Seeder] Data awal SQLite berhasil terverifikasi/diseed!');
}
