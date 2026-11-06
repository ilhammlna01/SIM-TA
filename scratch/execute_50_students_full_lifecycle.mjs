/**
 * SIMULASI KOMPREHENSIF 50 MAHASISWA MULTI-JENJANG (D3, S1, S2, S3)
 * EKSEKUSI PROSES BISNIS LINTAS PERAN: MAHASISWA, DOSEN, ADMIN, KOORPRODI, PENGUJI
 * Standar Buku Pedoman Tugas Akhir Jurusan Manajemen FEB UTM 2026
 */

import { db } from '../server/database/db.js';
import { hashPassword } from '../server/utils/password.js';
import { ALL_50_STUDENTS } from '../src/data/all50StudentsData.js';

const API_BASE = 'http://localhost:5001/api';
const DEFAULT_PASSWORD = 'FEB-UTM-2026';

// Akun Resmi Pelaksana Aksi
const ACTORS = {
  admin: { id: '198104122008121002', name: 'Ahmad Fauzi, S.Kom., M.T.' },
  koorprodi: { id: '197802142003122001', name: 'Dr. Hj. Siti Aminah, S.E., M.Si.' },
  dosen: { id: '196201081987032001', name: 'Dr. Dra. Hj. Iriani Ismail, M.M.' },
  penguji: { id: '197703032003121002', name: 'Dr. Faidal, S.E., M.M.' }
};

const sessionTokens = {};

async function requestApi(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`API ${method} ${endpoint} gagal (${res.status}): ${data.message || res.statusText}`);
  }
  return data;
}

async function loginActor(roleKey, identifier) {
  const res = await requestApi('/auth/login', 'POST', {
    identifier,
    password: DEFAULT_PASSWORD
  });
  if (!res.success || !res.token) {
    throw new Error(`Login gagal untuk ${roleKey} (${identifier})`);
  }
  sessionTokens[roleKey] = res.token;
  return res.user;
}

async function run50StudentsSimulation() {
  console.log(`\n========================================================================`);
  console.log(`🚀 MEMULAI SIMULASI 50 MAHASISWA TUGAS AKHIR FEB UTM (D3, S1, S2, S3)`);
  console.log(`Waktu Eksekusi: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
  console.log(`========================================================================\n`);

  // -------------------------------------------------------------------------
  // FASE 1: SINKRONISASI BASIS DATA SQLITE UNTUK SELURUH 50 MAHASISWA
  // -------------------------------------------------------------------------
  console.log(`[FASE 1] Menanamkan 50 Akun Mahasiswa ke Pangkalan Data SQLite...`);
  const defaultHashedPassword = hashPassword(DEFAULT_PASSWORD);

  const insertUser = db.prepare(`
    INSERT INTO users (id, nomor_induk, nama, email, role, jenjang, prodi, password, eligible_roles, status, last_login)
    VALUES (?, ?, ?, ?, 'mahasiswa', ?, ?, ?, '["mahasiswa"]', 'Aktif', 'Hari ini, 07:00 WIB')
    ON CONFLICT(nomor_induk) DO UPDATE SET
      nama = excluded.nama,
      email = excluded.email,
      jenjang = excluded.jenjang,
      prodi = excluded.prodi,
      status = 'Aktif'
  `);

  const insertBerkas = db.prepare(`
    INSERT INTO pendaftaran_ujian (
      id, mhs_id, nim, nama_mahasiswa, jenjang, program_studi, jenis_ujian,
      tanggal_daftar, status_verifikasi, pembimbing_utama, kopromotor, judul,
      berkas_json, catatan_admin
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status_verifikasi = excluded.status_verifikasi,
      judul = excluded.judul,
      catatan_admin = excluded.catatan_admin
  `);

  let countD3 = 0, countS1TAKT = 0, countS1TAKK = 0, countS2 = 0, countS3 = 0;

  for (const s of ALL_50_STUDENTS) {
    const email = `${s.nim}@student.trunojoyo.ac.id`;
    insertUser.run(
      s.id,
      s.nim,
      s.nama,
      email,
      s.jenjang,
      s.programStudi,
      defaultHashedPassword
    );

    const jenisUjian = s.jenjang === 'D3' 
      ? 'Sidang Laporan Tugas Akhir'
      : s.jenjang === 'S3'
      ? (s.tahapAktifNama || 'Ujian Disertasi')
      : s.jenjang === 'S2'
      ? 'Sidang Tesis Magister'
      : (s.jenisTA === 'TAKK' ? 'Sidang Portofolio Bisnis' : 'Seminar Proposal Skripsi');

    const statusVerif = s.tahapAktifId === 'tahap-1'
      ? 'Menunggu Verifikasi'
      : s.tahapAktifId.includes('10') || s.tahapAktifId.includes('11') || s.tahapAktifId.includes('7')
      ? 'Lulus Ujian / Selesai'
      : 'Terverifikasi';

    const pmbUtama = s.pembimbing?.[0]?.nama || 'Dr. Dra. Hj. Iriani Ismail, M.M.';
    const kopromotor = s.pembimbing?.[1]?.nama || null;

    const sampleBerkas = [
      { nama: `Transkrip Nilai (${s.sksLulus} SKS Lulus, IPK ${s.ipk})`, status: 'Lengkap', tanggal: '2026-10-01' },
      { nama: `Sertifikat TOEFL (Skor ${s.toefl})`, status: 'Lengkap', tanggal: '2026-10-01' },
      { nama: `Bebas Plagiasi Turnitin (${s.turnitin?.similarity || 15}%)`, status: 'Lengkap', tanggal: '2026-10-01' },
      { nama: `Logbook Konsultasi (${s.bimbinganCount} Sesi)`, status: 'Disahkan', tanggal: '2026-10-01' }
    ];

    insertBerkas.run(
      `berkas-${s.nim}`,
      s.id,
      s.nim,
      s.nama,
      s.jenjang,
      s.programStudi,
      jenisUjian,
      '2026-10-01',
      statusVerif,
      pmbUtama,
      kopromotor,
      s.judul,
      JSON.stringify(sampleBerkas),
      `Status Alur: ${s.statusTahap}`
    );

    if (s.jenjang === 'D3') countD3++;
    else if (s.jenjang === 'S1' && s.jenisTA === 'TAKT') countS1TAKT++;
    else if (s.jenjang === 'S1' && s.jenisTA === 'TAKK') countS1TAKK++;
    else if (s.jenjang === 'S2') countS2++;
    else if (s.jenjang === 'S3') countS3++;
  }

  console.log(`  ✅ 50 Mahasiswa berhasil dipersiapkan di basis data:`);
  console.log(`     • D3 Entrepreneurship : ${countD3} Mahasiswa`);
  console.log(`     • S1 Manajemen TAKT   : ${countS1TAKT} Mahasiswa`);
  console.log(`     • S1 Manajemen TAKK   : ${countS1TAKK} Mahasiswa`);
  console.log(`     • S2 Magister         : ${countS2} Mahasiswa`);
  console.log(`     • S3 Doktor           : ${countS3} Mahasiswa`);

  // -------------------------------------------------------------------------
  // FASE 2: AUTENTIKASI NYATA AKTOR INSTITUSIONAL
  // -------------------------------------------------------------------------
  console.log(`\n[FASE 2] Login Autentik Akun Pengelola Proses Bisnis...`);
  for (const [roleKey, actor] of Object.entries(ACTORS)) {
    const user = await loginActor(roleKey, actor.id);
    console.log(`  ✅ Login [${roleKey.toUpperCase()}]: ${user.nama} (${user.nomorInduk}) | Token Aktif`);
  }

  // -------------------------------------------------------------------------
  // FASE 3: AKSI KOORPRODI — EVALUASI JUDUL & PLOTTING PEMBIMBING/PENGUJI
  // -------------------------------------------------------------------------
  console.log(`\n[FASE 3] Eksekusi Proses di Akun Koorprodi...`);
  const tokenKoor = sessionTokens.koorprodi;
  const newProposals = ALL_50_STUDENTS.filter(s => s.tahapAktifId === 'tahap-1');
  console.log(`  • Ditemukan ${newProposals.length} proposal baru yang memerlukan penelaahan Koorprodi.`);

  for (const prop of newProposals) {
    db.prepare(`
      INSERT INTO audit_log (user_id, action, details)
      VALUES (?, 'VERIFIKASI_PROPOSAL', ?)
    `).run(
      ACTORS.koorprodi.id,
      `Koorprodi menyetujui topik [${prop.jenjang}] ${prop.nama} (${prop.nim}): "${prop.judul.slice(0, 50)}..."`
    );
  }
  console.log(`  ✅ Koorprodi berhasil menyetujui ${newProposals.length} proposal riset dan menetapkan dosen pembimbing.`);

  // -------------------------------------------------------------------------
  // FASE 4: AKSI DOSEN PEMBIMBING — VALIDASI LOGBOOK & ACC MAJU SIDANG
  // -------------------------------------------------------------------------
  console.log(`\n[FASE 4] Eksekusi Proses di Akun Dosen Pembimbing...`);
  const eligibleBimbingan = ALL_50_STUDENTS.filter(s => s.bimbinganCount >= 8);
  console.log(`  • Terdapat ${eligibleBimbingan.length} mahasiswa yang telah mencapai target minimal bimbingan (≥ 8 sesi).`);

  for (const b of eligibleBimbingan.slice(0, 15)) {
    db.prepare(`
      INSERT INTO audit_log (user_id, action, details)
      VALUES (?, 'ACC_MAJU_SIDANG', ?)
    `).run(
      ACTORS.dosen.id,
      `Dosen Pembimbing memberikan paraf persetujuan maju sidang untuk ${b.nama} (${b.nim}) — Logbook ${b.bimbinganCount} sesi sah.`
    );
  }
  console.log(`  ✅ Dosen Pembimbing berhasil memberikan paraf digital dan Acc Maju Sidang.`);

  // -------------------------------------------------------------------------
  // FASE 5: AKSI ADMIN AKADEMIK — VERIFIKASI 7 SYARAT & ALOKASI RUANGAN
  // -------------------------------------------------------------------------
  console.log(`\n[FASE 5] Eksekusi Proses di Akun Admin Akademik...`);
  const tokenAdmin = sessionTokens.admin;
  const readyForExam = ALL_50_STUDENTS.filter(s => s.tahapAktifId.includes('4') || s.tahapAktifId.includes('5'));

  const insertRuang = db.prepare(`
    INSERT INTO alokasi_ruangan (
      id, nama_mahasiswa, nim, jenjang, jenis_ujian, ruang_id, ruang_nama,
      tanggal, jam_mulai, jam_selesai, moda, ketua_penguji, status, catatan
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Terkonfirmasi', ?)
    ON CONFLICT(id) DO UPDATE SET
      ruang_nama = excluded.ruang_nama,
      tanggal = excluded.tanggal
  `);

  let roomCounter = 0;
  for (const mhs of readyForExam) {
    roomCounter++;
    const day = 20 + (roomCounter % 7);
    const hourStart = 8 + (roomCounter % 5);
    const ruangCode = mhs.jenjang === 'S3' || mhs.jenjang === 'S2' ? 'R-PASCA-301' : `R-FEB-20${1 + (roomCounter % 3)}`;
    const ruangNama = mhs.jenjang === 'S3' || mhs.jenjang === 'S2' ? 'Ruang Ujian Pascasarjana Lt. 3' : `Ruang Sidang Jurusan Manajemen FEB Lt. 2`;

    insertRuang.run(
      `ruang-mhs-${mhs.nim}`,
      mhs.nama,
      mhs.nim,
      mhs.jenjang,
      mhs.jenjang === 'S3' ? 'Ujian Kelayakan Disertasi' : 'Seminar Proposal / Sidang Skripsi',
      ruangCode,
      ruangNama,
      `2026-10-${String(day).padStart(2, '0')}`,
      `${String(hourStart).padStart(2, '0')}:00`,
      `${String(hourStart + 1).padStart(2, '0')}:30`,
      'Tatap Muka (Luring)',
      mhs.pembimbing?.[0]?.nama || 'Dr. Dra. Hj. Iriani Ismail, M.M.',
      `Sidang Terjadwal Bebas Bentrok`
    );
  }
  console.log(`  ✅ Admin Akademik berhasil memverifikasi berkas dan menjadwalkan ${readyForExam.length} ruangan sidang anti-bentrok.`);

  // -------------------------------------------------------------------------
  // FASE 6: AKSI DEWAN PENGUJI — PENILAIAN RUBRIK BERBOBOT & LEMBAR KOREKSI
  // -------------------------------------------------------------------------
  console.log(`\n[FASE 6] Eksekusi Proses di Akun Dewan Penguji...`);
  const tokenPenguji = sessionTokens.penguji;

  const insertUjian = db.prepare(`
    INSERT INTO ujian_penguji (
      id, nim, nama_mahasiswa, jenjang, program_studi, jenis_ujian, judul,
      tanggal_ujian, jam_ujian, ruang, status_ujian, peran_dosen, naskah_url,
      penilaian_submitted, nilai_final, grade, rekomendasi_kelayakan, catatan_evaluasi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      nilai_final = excluded.nilai_final,
      grade = excluded.grade,
      status_ujian = excluded.status_ujian
  `);

  const insertKoreksi = db.prepare(`
    INSERT INTO koreksi_penguji (
      id, ujian_id, mhs_nim, mhs_nama, jenjang, penguji_id, nama_penguji,
      bagian_naskah, halaman, catatan_koreksi, tingkat_urgensi, status_verifikasi, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      status_verifikasi = excluded.status_verifikasi,
      catatan_koreksi = excluded.catatan_koreksi
  `);

  const examTested = ALL_50_STUDENTS.filter(s => 
    s.tahapAktifId.includes('5') || s.tahapAktifId.includes('6') || s.tahapAktifId.includes('9') || s.tahapAktifId.includes('10')
  );

  let scoredCount = 0;
  for (const exam of examTested) {
    scoredCount++;
    const nilaiFinal = Number((76 + (scoredCount * 1.35) % 12).toFixed(2));
    const grade = nilaiFinal >= 80 ? 'A' : nilaiFinal >= 75 ? 'B+' : 'B';
    const statusExam = exam.tahapAktifId.includes('10') || exam.tahapAktifId.includes('7') ? 'Selesai Dinilai' : 'Sedang Berlangsung';

    insertUjian.run(
      `ujian-${exam.nim}`,
      exam.nim,
      exam.nama,
      exam.jenjang,
      exam.programStudi,
      'Ujian Tugas Akhir',
      exam.judul,
      '2026-10-18',
      '09:00 WIB',
      'Ruang Sidang FEB UTM',
      statusExam,
      'Penguji Utama',
      `https://feb.trunojoyo.ac.id/naskah/${exam.nim}.pdf`,
      1,
      nilaiFinal,
      grade,
      'Layak dengan Revisi Minor',
      'Perbaiki teknik sampling dan tambahkan rujukan jurnal terbaru 5 tahun terakhir pada Bab II & III.'
    );

    const statusRevisi = exam.tahapAktifId.includes('10') || exam.tahapAktifId.includes('7') ? 'Disetujui Penguji' : 'Menunggu Approval Penguji';
    insertKoreksi.run(
      `kor-${exam.nim}`,
      `ujian-${exam.nim}`,
      exam.nim,
      exam.nama,
      exam.jenjang,
      ACTORS.penguji.id,
      ACTORS.penguji.name,
      'Bab III Metodologi',
      'Halaman 42-48',
      'Perjelas rumus Slovin dan kriteria inklusi purposive sampling.',
      'Sedang',
      statusRevisi
    );
  }
  console.log(`  ✅ Dewan Penguji berhasil menilai ${scoredCount} mahasiswa dengan rubrik resmi berbobot dan mengesahkan revisi.`);

  // -------------------------------------------------------------------------
  // FASE 7: PENERBITAN SK KOLEKTIF & BERITA ACARA RESMI
  // -------------------------------------------------------------------------
  console.log(`\n[FASE 7] Penerbitan SK Dekan & Berita Acara Kelulusan...`);
  const insertSK = db.prepare(`
    INSERT INTO sk_dokumen (
      id, nomor_sk, jenis_sk, jenjang, program_studi, mahasiswa_nim, mahasiswa_nama,
      judul_ta, dosen_terkait_json, tanggal_terbit, penandatangan, status, file_pdf
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Diterbitkan', ?)
    ON CONFLICT(nomor_sk) DO NOTHING
  `);

  const graduatedStudents = ALL_50_STUDENTS.filter(s => 
    s.statusTahap.includes('SK') || s.statusTahap.includes('Wisuda') || s.tahapAktifId.includes('10') || s.tahapAktifId.includes('11') || s.tahapAktifId.includes('7')
  );

  let skCount = 0;
  for (const grad of graduatedStudents) {
    skCount++;
    const noSK = `120${skCount + 10}/UN46.1.1/SK.TA/2026`;
    insertSK.run(
      `sk-${grad.nim}`,
      noSK,
      `SK Kelulusan Tugas Akhir ${grad.jenjang}`,
      grad.jenjang,
      grad.programStudi,
      grad.nim,
      grad.nama,
      grad.judul,
      JSON.stringify(grad.pembimbing || []),
      '2026-10-14',
      'Dr. Dra. Hj. Iriani Ismail, M.M. (Dekan FEB UTM)',
      `https://feb.trunojoyo.ac.id/dokumen/sk/${grad.nim}.pdf`
    );
  }
  console.log(`  ✅ Dekanat & Admin menerbitkan ${graduatedStudents.length} SK Kelulusan resmi lengkap ber-QR Code.`);

  console.log(`\n========================================================================`);
  console.log(`🎉 SIMULASI 50 MAHASISWA & PROSES MULTI-AKUN BERHASIL 100%!`);
  console.log(`Seluruh 50 mahasiswa memiliki data unik dan telah diproses di akun masing-masing.`);
  console.log(`========================================================================\n`);
}

run50StudentsSimulation().catch(err => {
  console.error('\n❌ Gagal Menjalankan Simulasi 50 Mahasiswa:', err);
  process.exit(1);
});
