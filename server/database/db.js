import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { hashPassword, generateTemporaryPassword } from '../utils/password.js';
import { INITIAL_TAHAPAN_JENJANG } from '../../src/data/superadminData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direktori penyimpanan basis data SQLite lokal
const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'sim_ta_feb_utm.db');
console.log(`[Database] Menghubungkan basis data SQLite pada: ${dbPath}`);

export const db = new DatabaseSync(dbPath);

// Konfigurasi performa tinggi dan integritas relasional SQLite
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);

/**
 * Inisialisasi Skema Tabel Relasional
 */
export function initSchema() {
  db.exec(`
    -- 1. Tabel Pengguna (Users)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nomor_induk TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      jenjang TEXT,
      prodi TEXT,
      password TEXT,
      eligible_roles TEXT,
      status TEXT DEFAULT 'Aktif',
      last_login TEXT,
      -- 0 = kredensial belum dimigrasikan (akan di-reset paksa saat migrasi)
      -- 1 = kredensial sudah memakai kata sandi acak individual
      credential_epoch INTEGER NOT NULL DEFAULT 0,
      -- Dinaikkan setiap kali peran/status/kata sandi berubah => token lama otomatis mati
      token_version INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Tabel Master Program Studi
    CREATE TABLE IF NOT EXISTS prodi (
      id TEXT PRIMARY KEY,
      kode_prodi TEXT UNIQUE NOT NULL,
      nama_prodi TEXT NOT NULL,
      jenjang TEXT NOT NULL,
      akreditasi TEXT NOT NULL,
      no_sk_akreditasi TEXT,
      kaprodi TEXT NOT NULL,
      nip_kaprodi TEXT,
      kuota_mahasiswa INTEGER DEFAULT 100,
      mahasiswa_aktif INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Aktif',
      deskripsi TEXT
    );

    -- 3. Tabel Konfigurasi Tahapan & Aturan Multi-Jenjang
    CREATE TABLE IF NOT EXISTS tahapan_aturan (
      jenjang TEXT PRIMARY KEY,
      jenjang_label TEXT NOT NULL,
      total_tahap INTEGER NOT NULL,
      tahapan_json TEXT NOT NULL,
      rules_json TEXT NOT NULL
    );

    -- 4. Tabel Kuota Bimbingan Dosen
    CREATE TABLE IF NOT EXISTS kuota_dosen (
      id TEXT PRIMARY KEY,
      nama TEXT NOT NULL,
      nip TEXT UNIQUE NOT NULL,
      jabatan TEXT NOT NULL,
      prodi TEXT NOT NULL,
      kuota_utama INTEGER NOT NULL,
      terisi_utama INTEGER DEFAULT 0,
      kuota_pendamping INTEGER NOT NULL,
      terisi_pendamping INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Aman'
    );

    -- 5. Tabel Pendaftaran Ujian & Verifikasi Berkas (Admin)
    CREATE TABLE IF NOT EXISTS pendaftaran_ujian (
      id TEXT PRIMARY KEY,
      mhs_id TEXT,
      nim TEXT NOT NULL,
      nama_mahasiswa TEXT NOT NULL,
      jenjang TEXT NOT NULL,
      program_studi TEXT NOT NULL,
      jenis_ujian TEXT NOT NULL,
      tanggal_daftar TEXT NOT NULL,
      status_verifikasi TEXT DEFAULT 'Menunggu Verifikasi',
      pembimbing_utama TEXT,
      kopromotor TEXT,
      pembimbing_utama_nip TEXT,
      pembimbing_pendamping_nip TEXT,
      judul TEXT NOT NULL,
      berkas_json TEXT NOT NULL,
      catatan_admin TEXT,
      FOREIGN KEY (nim) REFERENCES users(nomor_induk) ON UPDATE CASCADE ON DELETE CASCADE
    );

    -- 6. Tabel Surat Keputusan (SK) Resmi
    CREATE TABLE IF NOT EXISTS sk_dokumen (
      id TEXT PRIMARY KEY,
      nomor_sk TEXT UNIQUE NOT NULL,
      jenis_sk TEXT NOT NULL,
      jenjang TEXT NOT NULL,
      program_studi TEXT NOT NULL,
      mahasiswa_nim TEXT NOT NULL,
      mahasiswa_nama TEXT NOT NULL,
      judul_ta TEXT NOT NULL,
      dosen_terkait_json TEXT NOT NULL,
      tanggal_terbit TEXT NOT NULL,
      penandatangan TEXT NOT NULL,
      status TEXT DEFAULT 'Diterbitkan',
      file_pdf TEXT
    );

    -- 7. Tabel Alokasi Ruangan Ujian (Admin)
    CREATE TABLE IF NOT EXISTS alokasi_ruangan (
      id TEXT PRIMARY KEY,
      nama_mahasiswa TEXT NOT NULL,
      nim TEXT NOT NULL,
      jenjang TEXT NOT NULL,
      jenis_ujian TEXT NOT NULL,
      ruang_id TEXT NOT NULL,
      ruang_nama TEXT NOT NULL,
      tanggal TEXT NOT NULL,
      jam_mulai TEXT NOT NULL,
      jam_selesai TEXT NOT NULL,
      moda TEXT NOT NULL,
      ketua_penguji TEXT NOT NULL,
      status TEXT DEFAULT 'Terkonfirmasi',
      catatan TEXT,
      FOREIGN KEY (nim) REFERENCES users(nomor_induk) ON UPDATE CASCADE ON DELETE CASCADE
    );

    -- 8. Tabel Ujian Sidang Penguji
    CREATE TABLE IF NOT EXISTS ujian_penguji (
      id TEXT PRIMARY KEY,
      nim TEXT NOT NULL,
      nama_mahasiswa TEXT NOT NULL,
      jenjang TEXT NOT NULL,
      program_studi TEXT NOT NULL,
      jenis_ujian TEXT NOT NULL,
      judul TEXT,
      tanggal_ujian TEXT NOT NULL,
      jam_ujian TEXT NOT NULL,
      ruang TEXT NOT NULL,
      status_ujian TEXT NOT NULL,
      peran_dosen TEXT NOT NULL,
      susunan_penguji_json TEXT,
      naskah_url TEXT,
      penilaian_submitted INTEGER DEFAULT 0,
      nilai_final REAL,
      grade TEXT,
      rekomendasi_kelayakan TEXT,
      catatan_evaluasi TEXT,
      catatan_tersimpan INTEGER DEFAULT 0,
      FOREIGN KEY (nim) REFERENCES users(nomor_induk) ON UPDATE CASCADE ON DELETE CASCADE
    );

    -- 9. Tabel Catatan Koreksi Penguji & Revisi
    CREATE TABLE IF NOT EXISTS koreksi_penguji (
      id TEXT PRIMARY KEY,
      ujian_id TEXT NOT NULL,
      mhs_nim TEXT NOT NULL,
      mhs_nama TEXT NOT NULL,
      jenjang TEXT NOT NULL,
      penguji_id TEXT NOT NULL,
      nama_penguji TEXT NOT NULL,
      bagian_naskah TEXT NOT NULL,
      halaman TEXT,
      catatan_koreksi TEXT NOT NULL,
      tingkat_urgensi TEXT NOT NULL,
      status_verifikasi TEXT DEFAULT 'Menunggu Approval Penguji',
      created_at TEXT,
      FOREIGN KEY (ujian_id) REFERENCES ujian_penguji(id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (mhs_nim) REFERENCES users(nomor_induk) ON UPDATE CASCADE ON DELETE CASCADE
    );

    -- 10. Audit Log
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. Tabel Dokumen Arsip & Surat Resmi Digital
    CREATE TABLE IF NOT EXISTS dokumen_arsip (
      id TEXT PRIMARY KEY,
      jenis_dokumen TEXT NOT NULL,
      nomor_dokumen TEXT NOT NULL,
      judul_dokumen TEXT NOT NULL,
      nim TEXT,
      nama_mahasiswa TEXT,
      jenjang TEXT,
      prodi TEXT,
      kode_verifikasi TEXT UNIQUE NOT NULL,
      file_path TEXT,
      file_url TEXT,
      stempel_digital INTEGER DEFAULT 1,
      penandatangan_json TEXT,
      status TEXT DEFAULT 'Terverifikasi',
      metadata_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 12. Tabel Notifikasi In-App Real-Time
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      role TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      event_category TEXT NOT NULL,
      action_url TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 13. Tabel Riwayat Email & Komunikasi SLA
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      event_type TEXT NOT NULL,
      html_content TEXT NOT NULL,
      status TEXT DEFAULT 'Terkirim',
      preview_url TEXT,
      sla_deadline TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 14. Tabel Jadwal & Linimasa Tahapan Akademik (Admin Akademik)
    CREATE TABLE IF NOT EXISTS jadwal_tahapan (
      id TEXT PRIMARY KEY,
      jenjang TEXT NOT NULL,
      prodi TEXT NOT NULL,
      tahap_kode TEXT NOT NULL,
      tahap_nama TEXT NOT NULL,
      semester TEXT NOT NULL,
      tanggal_mulai TEXT NOT NULL,
      tanggal_selesai TEXT NOT NULL,
      jam_deadline TEXT DEFAULT '23:59',
      status TEXT DEFAULT 'Akan Datang',
      moda TEXT DEFAULT 'Daring via SIM-TA',
      target_mahasiswa INTEGER DEFAULT 100,
      terdaftar_mahasiswa INTEGER DEFAULT 0,
      persyaratan_ringkas TEXT,
      catatan_sop TEXT,
      penanggung_jawab TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 15. Tabel Nomor Urut Surat & Dokumen Resmi (Auto-Numbering Counter)
    CREATE TABLE IF NOT EXISTS document_counters (
      doc_type TEXT PRIMARY KEY,
      prefix TEXT NOT NULL,
      last_number INTEGER DEFAULT 100,
      format_template TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 16. Tabel Registrasi Berkas Penyimpanan (Storage Files & Hak Milik Intelektual)
    CREATE TABLE IF NOT EXISTS storage_files (
      id TEXT PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      original_name TEXT,
      category TEXT NOT NULL,
      uploader_id TEXT NOT NULL,
      uploader_nim TEXT,
      uploader_role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploader_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    -- 17. Tabel Template Tahapan Akademik per Jenjang (PRD §16.4)
    CREATE TABLE IF NOT EXISTS tahapan_template (
      id TEXT PRIMARY KEY,
      jenjang TEXT NOT NULL,
      urutan INTEGER NOT NULL,
      kode_tahap TEXT NOT NULL,
      nama_tahap TEXT NOT NULL,
      deskripsi TEXT,
      jenis_dokumen_terkait TEXT,
      min_bimbingan INTEGER DEFAULT 0,
      requires_naskah INTEGER DEFAULT 0,
      requires_publikasi INTEGER DEFAULT 0,
      UNIQUE(jenjang, urutan)
    );

    -- 18. Tabel Tugas Akhir (Entitas Inti Proses Akademik - PRD §13)
    CREATE TABLE IF NOT EXISTS tugas_akhir (
      id TEXT PRIMARY KEY,
      mahasiswa_id TEXT,
      nim TEXT NOT NULL,
      nama_mahasiswa TEXT NOT NULL,
      jenjang TEXT NOT NULL,
      prodi TEXT,
      pembimbing_utama TEXT,
      pembimbing_pendamping TEXT,
      pembimbing_utama_nip TEXT,
      pembimbing_pendamping_nip TEXT,
      judul TEXT,
      tahap_aktif_kode TEXT,
      status TEXT DEFAULT 'Aktif',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (nim) REFERENCES users(nomor_induk) ON UPDATE CASCADE ON DELETE CASCADE
    );

    -- 19. Tabel Status Tahapan per Tugas Akhir (Workflow State Machine - PRD §13)
    CREATE TABLE IF NOT EXISTS tahap_status (
      id TEXT PRIMARY KEY,
      tugas_akhir_id TEXT NOT NULL,
      kode_tahap TEXT NOT NULL,
      nama_tahap TEXT NOT NULL,
      urutan INTEGER NOT NULL,
      status TEXT DEFAULT 'Belum Mulai',
      pengajuan_json TEXT,
      pembimbing_approved INTEGER DEFAULT 0,
      admin_verified INTEGER DEFAULT 0,
      catatan TEXT,
      tanggal_mulai TEXT,
      tanggal_selesai TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tugas_akhir_id, kode_tahap),
      FOREIGN KEY (tugas_akhir_id) REFERENCES tugas_akhir(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    -- 20. Tabel Log Bimbingan Digital (PRD §5.2)
    CREATE TABLE IF NOT EXISTS bimbingan_log (
      id TEXT PRIMARY KEY,
      tugas_akhir_id TEXT,
      nim TEXT NOT NULL,
      nama_mahasiswa TEXT,
      tanggal TEXT NOT NULL,
      topik TEXT,
      catatan TEXT,
      status TEXT DEFAULT 'Menunggu Approval',
      disetujui_oleh TEXT,
      catatan_pembimbing TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tugas_akhir_id) REFERENCES tugas_akhir(id) ON UPDATE CASCADE ON DELETE SET NULL,
      FOREIGN KEY (nim) REFERENCES users(nomor_induk) ON UPDATE CASCADE ON DELETE CASCADE
    );

    -- 21. Tabel Versi Naskah (Version Control - PRD §5.3)
    CREATE TABLE IF NOT EXISTS naskah_versi (
      id TEXT PRIMARY KEY,
      tugas_akhir_id TEXT NOT NULL,
      nim TEXT NOT NULL,
      nomor_versi INTEGER NOT NULL,
      file_url TEXT,
      keterangan TEXT,
      uploader_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tugas_akhir_id, nomor_versi),
      FOREIGN KEY (tugas_akhir_id) REFERENCES tugas_akhir(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    -- 22. Tabel Komentar / Anotasi Naskah (PRD §5.3)
    CREATE TABLE IF NOT EXISTS komentar_naskah (
      id TEXT PRIMARY KEY,
      naskah_versi_id TEXT NOT NULL,
      pemberi_id TEXT,
      pemberi_nama TEXT,
      pemberi_role TEXT,
      bagian TEXT,
      isi TEXT NOT NULL,
      status TEXT DEFAULT 'Terbuka',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (naskah_versi_id) REFERENCES naskah_versi(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    -- 23. Tabel Pencatatan Publikasi Ilmiah (PRD §5.6)
    CREATE TABLE IF NOT EXISTS publikasi (
      id TEXT PRIMARY KEY,
      tugas_akhir_id TEXT,
      nim TEXT NOT NULL,
      nama_mahasiswa TEXT,
      judul TEXT NOT NULL,
      jurnal TEXT,
      tahun TEXT,
      tautan TEXT,
      bukti_url TEXT,
      status TEXT DEFAULT 'Diajukan',
      status_verifikasi TEXT DEFAULT 'Menunggu Verifikasi',
      verifikator TEXT,
      catatan TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tugas_akhir_id) REFERENCES tugas_akhir(id) ON UPDATE CASCADE ON DELETE SET NULL,
      FOREIGN KEY (nim) REFERENCES users(nomor_induk) ON UPDATE CASCADE ON DELETE CASCADE
    );
  `);
  try {
    db.exec("ALTER TABLE users ADD COLUMN password TEXT");
  } catch {
    // Column already exists
  }
  try {
    db.exec("ALTER TABLE users ADD COLUMN eligible_roles TEXT");
  } catch {
    // Column already exists
  }
  try {
    // Menandai akun yang WAJIB mengganti kata sandi saat login berikutnya
    // (mis. setelah direset superadmin dengan kata sandi sementara).
    db.exec("ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0");
  } catch {
    // Column already exists
  }
  try {
    db.exec("ALTER TABLE users ADD COLUMN credential_epoch INTEGER NOT NULL DEFAULT 0");
  } catch {
    // Column already exists
  }
  try {
    db.exec("ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 1");
  } catch {
    // Column already exists
  }
  try {
    db.exec("ALTER TABLE pendaftaran_ujian ADD COLUMN pembimbing_utama_nip TEXT");
  } catch {
    // Column already exists
  }
  try {
    db.exec("ALTER TABLE pendaftaran_ujian ADD COLUMN pembimbing_pendamping_nip TEXT");
  } catch {
    // Column already exists
  }
  try {
    db.exec("ALTER TABLE tugas_akhir ADD COLUMN pembimbing_utama_nip TEXT");
  } catch {
    // Column already exists
  }
  try {
    db.exec("ALTER TABLE tugas_akhir ADD COLUMN pembimbing_pendamping_nip TEXT");
  } catch {
    // Column already exists
  }
  try {
    // Migrasi: kolom `judul` pada ujian_penguji (judul TA mahasiswa) untuk basis data lama
    db.exec("ALTER TABLE ujian_penguji ADD COLUMN judul TEXT");
  } catch {
    // Column already exists
  }
  try {
    // Migrasi: kolom `susunan_penguji_json` pada ujian_penguji (identitas dewan penguji).
    // Diperlukan agar portal Dewan Penguji dapat memfilter sidang yang ditugaskan
    // kepadanya berdasarkan NIP; sebelumnya kolom ini tidak ada sehingga daftar kosong.
    db.exec("ALTER TABLE ujian_penguji ADD COLUMN susunan_penguji_json TEXT");
  } catch {
    // Column already exists
  }
  try {
    // Metrik akademik agregat (IPK, SKS lulus, TOEFL) yang diisikan mahasiswa saat
    // unggah berkas; admin memakainya untuk verifikasi cepat.
    db.exec("ALTER TABLE pendaftaran_ujian ADD COLUMN metrik_akademik_json TEXT");
  } catch {
    // Column already exists
  }

  // Inisialisasi template counter resmi FEB UTM
  const initCounter = db.prepare(`
    INSERT OR IGNORE INTO document_counters (doc_type, prefix, last_number, format_template)
    VALUES (?, ?, ?, ?)
  `);
  initCounter.run('sk_dekan', 'SK', 185, 'B/{NUM}/UN46.1.1/HK.04.01/{YEAR}');
  initCounter.run('surat_tugas_penguji', 'ST-PENG', 248, 'B/{NUM}/UN46.1.1/KP.01.04/{YEAR}');
  initCounter.run('surat_tugas_pembimbing', 'ST-PEMB', 312, 'B/{NUM}/UN46.1.1/KP.01.04/{YEAR}');
  initCounter.run('berita_acara', 'BA', 142, 'BA/{NUM}/FEB.MAN/{ROMAN_MONTH}/{YEAR}');
  initCounter.run('lembar_pengesahan', 'PENG', 108, 'PENG/{NUM}/FEB.MAN/{YEAR}');

  // Sinkronisasi data mahasiswa orphan agar constraint foreign key terpenuhi
  try {
    const insertMissingUser = db.prepare(`
      INSERT OR IGNORE INTO users (id, nomor_induk, nama, email, role, jenjang, prodi, password, status, last_login, credential_epoch, token_version, must_change_password)
      VALUES (?, ?, ?, ?, 'mahasiswa', ?, ?, ?, 'Aktif', 'Belum pernah login', 1, 1, 1)
    `);

    const missingInReg = db.prepare(`
      SELECT DISTINCT nim, nama_mahasiswa, jenjang, program_studi
      FROM pendaftaran_ujian
      WHERE nim NOT IN (SELECT nomor_induk FROM users)
    `).all();

    for (const m of missingInReg) {
      insertMissingUser.run(
        `usr-mhs-${m.nim}`,
        m.nim,
        m.nama_mahasiswa,
        `${m.nim}@student.trunojoyo.ac.id`,
        m.jenjang || 'S1',
        m.program_studi || 'S1 Manajemen',
        hashPassword(generateTemporaryPassword())
      );
    }

    const missingInUjian = db.prepare(`
      SELECT DISTINCT nim, nama_mahasiswa, jenjang, program_studi
      FROM ujian_penguji
      WHERE nim NOT IN (SELECT nomor_induk FROM users)
    `).all();

    for (const m of missingInUjian) {
      insertMissingUser.run(
        `usr-mhs-${m.nim}`,
        m.nim,
        m.nama_mahasiswa,
        `${m.nim}@student.trunojoyo.ac.id`,
        m.jenjang || 'S1',
        m.program_studi || 'S1 Manajemen',
        hashPassword(generateTemporaryPassword())
      );
    }
  } catch (syncErr) {
    console.warn('[Database Migration Warning - User Sync]:', syncErr.message);
  }

  // Migrasi Keamanan Kredensial: Menonaktifkan kata sandi universal lama.
  //
  // SEBELUMNYA seluruh akun memakai kata sandi institusional seragam yang
  // diketahui publik. Hash Scrypt tidak melindungi kredensial yang nilainya
  // sudah bocor: siapa pun yang tahu nilainya tetap bisa login. Karena itu
  // setiap akun pada epoch 0 (belum pernah dimigrasikan) HARUS menerima kata
  // sandi acak individual dan diwajibkan menggantinya.
  try {
    const legacyUsers = db.prepare('SELECT id, nama, nomor_induk FROM users WHERE credential_epoch = 0').all();
    if (legacyUsers && legacyUsers.length > 0) {
      console.log(`[Database Migration] ${legacyUsers.length} akun memakai kredensial lama. Menerbitkan kata sandi acak individual...`);
      const updateCred = db.prepare(`
        UPDATE users
        SET password = ?, must_change_password = 1, credential_epoch = 1, token_version = token_version + 1
        WHERE id = ?
      `);
      for (const u of legacyUsers) {
        updateCred.run(hashPassword(generateTemporaryPassword()), u.id);
      }
      console.log('[Database Migration] Kredensial lama dinonaktifkan. Administrator wajib mereset kata sandi tiap akun lewat menu reset superadmin.');
    }
  } catch (migErr) {
    console.warn('[Database Migration Warning - Credential Reset]:', migErr.message);
  }

  // Pemulihan Template Tahapan yang Kosong.
  //
  // Audit 21 Oktober 2026 (Simulasi Proses A–Z): ditemukan jenjang S1 dengan
  // `total_tahap = 4` tetapi `tahapan_json = '[]'` — template tahapan hilang
  // sehingga halaman "Tahapan per Jenjang" menampilkan 0 tahap untuk S1
  // meskipun sistem menjalankan 4 tahap S1. Penyebabnya: satu panggilan
  // `PUT /api/superadmin/tahapan/S1` dengan `tahapanList: []` yang menghapus
  // template secara permanen. Endpoint kini menolak larik kosong; migrasi
  // berikut memulihkan template yang sudah kosong dari data master.
  try {
    const rusak = db
      .prepare("SELECT jenjang FROM tahapan_aturan WHERE total_tahap > 0 AND (tahapan_json IS NULL OR json_array_length(tahapan_json) = 0)")
      .all();
    for (const r of rusak) {
      const master = INITIAL_TAHAPAN_JENJANG?.[r.jenjang];
      if (!master || !Array.isArray(master.tahapanList) || master.tahapanList.length === 0) continue;
      db.prepare('UPDATE tahapan_aturan SET tahapan_json = ? WHERE jenjang = ?')
        .run(JSON.stringify(master.tahapanList), r.jenjang);
      console.log(`[Database Migration] Template tahapan jenjang ${r.jenjang} dipulihkan (${master.tahapanList.length} tahap).`);
    }
  } catch (migErr) {
    console.warn('[Database Migration Warning - Template Tahapan]:', migErr.message);
  }

  // Migrasi Syarat Publikasi Tahap Akhir.
  //
  // Audit 21 Oktober 2026 (P1-3): rules_json menyatakan syarat publikasi untuk
  // S1 ("Draft Artikel Jurnal Nasional / Prosiding") maupun D3 ("Laporan
  // Portofolio Kelayakan Bisnis"), tetapi template tahapan hanya mewajibkan
  // publikasi pada S2 & S3. Migrasi ini menyamakan seluruh jenjang.
  try {
    const jenjangAda = db.prepare('SELECT DISTINCT jenjang FROM tahapan_template').all();
    for (const j of jenjangAda) {
      const tahapTerakhir = db
        .prepare('SELECT id, kode_tahap, requires_publikasi FROM tahapan_template WHERE jenjang = ? ORDER BY urutan DESC LIMIT 1')
        .get(j.jenjang);
      if (tahapTerakhir && Number(tahapTerakhir.requires_publikasi) !== 1) {
        db.prepare('UPDATE tahapan_template SET requires_publikasi = 1 WHERE id = ?').run(tahapTerakhir.id);
        console.log(`[Database Migration] Tahap akhir ${j.jenjang} (${tahapTerakhir.kode_tahap}) kini mewajibkan publikasi.`);
      }
    }
  } catch (migErr) {
    console.warn('[Database Migration Warning - Syarat Publikasi]:', migErr.message);
  }

  // Migrasi Status Persetujuan Naskah.
  //
  // Audit 21 Oktober 2026 (temuan BP-2 dari tinjauan business process):
  // tabel naskah_versi tidak memiliki status persetujuan sama sekali.
  // Akibatnya "Persetujuan Naskah" pada antarmuka sebenarnya MEMBERI
  // PERSETUJUAN TAHAP, bukan naskahnya — sehingga naskah bisa ditampilkan
  // seolah-olah "sudah disetujui pembimbing" tanpa pernah ada keputusan atas
  // naskahnya, dan checklist tahapan tidak dapat memverifikasi bahwa naskah
  // telah ditelaah pembimbing.
  try {
    const kolom = new Set(db.prepare('PRAGMA table_info(naskah_versi)').all().map((c) => c.name));
    const tambah = [
      ['status_persetujuan', "TEXT DEFAULT 'Diajukan'"],
      ['disetujui_oleh', 'TEXT'],
      ['disetujui_oleh_nip', 'TEXT'],
      ['tanggal_persetujuan', 'TEXT'],
      ['catatan_persetujuan', 'TEXT']
    ];
    for (const [nama, definisi] of tambah) {
      if (!kolom.has(nama)) {
        db.exec(`ALTER TABLE naskah_versi ADD COLUMN ${nama} ${definisi}`);
        console.log(`[Database Migration] Kolom naskah_versi.${nama} ditambahkan.`);
      }
    }
  } catch (migErr) {
    console.warn('[Database Migration Warning - Status Persetujuan Naskah]:', migErr.message);
  }

  // Validasi Integritas Relasional
  try {
    const fkIssues = db.prepare('PRAGMA foreign_key_check;').all();
    if (fkIssues.length > 0) {
      console.warn('[Database] Peringatan: Ditemukan pelanggaran foreign keys:', fkIssues);
    } else {
      console.log('[Database] Integritas Foreign Keys 100% Valid & Aktif.');
    }
  } catch (_) {}

  console.log('[Database] Skema tabel SQLite berhasil diinisialisasi.');
}

/**
 * Helper Auto-Numbering Engine Anti-Bentrok
 */
export function getNextDocumentNumber(docType) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const ROMAN_MONTHS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  db.prepare(`
    UPDATE document_counters
    SET last_number = last_number + 1, updated_at = CURRENT_TIMESTAMP
    WHERE doc_type = ?
  `).run(docType);

  const row = db.prepare('SELECT * FROM document_counters WHERE doc_type = ?').get(docType);
  if (!row) {
    return {
      rawNumber: 101,
      formattedNumber: `B/101/UN46.1.1/DOC/${currentYear}`
    };
  }

  const numStr = String(row.last_number).padStart(3, '0');
  const formatted = row.format_template
    .replace('{NUM}', numStr)
    .replace('{YEAR}', currentYear)
    .replace('{ROMAN_MONTH}', ROMAN_MONTHS[currentMonth] || 'X');

  return {
    rawNumber: row.last_number,
    formattedNumber: formatted
  };
}

/**
 * Mendapatkan seluruh status counter nomor surat dinas
 */
export function getAllDocumentCounters() {
  return db.prepare('SELECT * FROM document_counters ORDER BY doc_type ASC').all();
}

/**
 * Mengubah atau mengatur ulang counter nomor surat dinas
 */
export function updateDocumentCounter(docType, nextNumber, formatTemplate) {
  if (formatTemplate) {
    db.prepare(`
      UPDATE document_counters
      SET last_number = ?, format_template = ?, updated_at = CURRENT_TIMESTAMP
      WHERE doc_type = ?
    `).run(nextNumber, formatTemplate, docType);
  } else {
    db.prepare(`
      UPDATE document_counters
      SET last_number = ?, updated_at = CURRENT_TIMESTAMP
      WHERE doc_type = ?
    `).run(nextNumber, docType);
  }
  return db.prepare('SELECT * FROM document_counters WHERE doc_type = ?').get(docType);
}

export default db;
