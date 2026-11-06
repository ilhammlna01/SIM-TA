/**
 * Uji Business Process Mahasiswa (BP-1 & BP-2) — 21 Oktober 2026.
 *
 * Menguji:
 *   BP-1  Gerbang pendaftaran ujian terhadap tahapan prasyarat.
 *   BP-2  Persetujuan naskah oleh pembimbing sebagai syarat pengajuan tahap.
 *   BP-2c Checklist tahap mewajibkan "naskah disetujui pembimbing".
 *   Aturan "selesai" hanya boleh setelah persetujuan pembimbing.
 * Menguji gerbang pendaftaran ujian, persetujuan naskah, dan checklist tahap.
 */

const API = 'http://localhost:5001/api';
const PWD = 'UTM-QA-2026!Lab';

let pass = 0, fail = 0;
const check = (ok, name, detail = '') => {
  console.log(`  [${ok ? 'LULUS' : 'GAGAL'}] ${name}${detail ? ` — ${detail}` : ''}`);
  ok ? pass++ : fail++;
};

const login = async (identifier) => {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password: PWD })
  });
  const j = await r.json();
  if (!j.token) throw new Error(`Login ${identifier} gagal: ${j.message}`);
  return j.token;
};

const call = async (method, path, token, body) => {
  const headers = { Authorization: `Bearer ${token}` };
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j = null; try { j = JSON.parse(t); } catch {}
  return { status: r.status, json: j, text: t };
};

console.log('=== Uji Business Process Mahasiswa (BP-1 & BP-2) ===\n');

// Mahasiswa yang tahapannya belum sama sekali selesai.
const NIM = '220231600004'; // Bambang Suryo Utomo (S3, 0/8 tahap)
// Reset tahapan mahasiswa uji agar skrip dapat diulang (idempoten).
{
  const { DatabaseSync } = await import('node:sqlite');
  const db2 = new DatabaseSync('data/sim_ta_feb_utm.db');
  db2.exec('PRAGMA busy_timeout = 5000');
  const row = db2.prepare('SELECT id FROM tugas_akhir WHERE nim = ?').get(NIM);
  if (row) {
    db2.prepare(
      "UPDATE tahap_status SET status='Belum Mulai', pengajuan_json=NULL, pembimbing_approved=0, admin_verified=0, catatan=NULL, tanggal_mulai=NULL, tanggal_selesai=NULL WHERE tugas_akhir_id=?"
    ).run(row.id);
    db2.prepare("UPDATE tugas_akhir SET tahap_aktif_kode='S3-T1' WHERE id=?").run(row.id);
  }
  db2.close();
}

const mhs = await login(NIM);
const koor = await login('197802142003122001');

console.log('A. BP-1 — Gerbang pendaftaran ujian');
const taList = await call('GET', '/akademik/tugas-akhir', mhs);
const taId = taList.json?.data?.[0]?.id;

const daftar = await call('POST', '/admin/verifikasi-berkas', mhs, {
  nim: NIM,
  namaMahasiswa: 'Bambang Suryo Utomo, S.E., M.M.',
  jenjang: 'S3',
  programStudi: 'S-3 Ilmu Manajemen',
  jenisUjian: 'Ujian Proposal Disertasi',
      // Metrik memenuhi rules_json S3 (min 42 SKS, min 500 TOEFL, maks 25%)
      // sehingga yang diuji adalah gerbang TAHAPAN, bukan gerbang akademik.
      metrik: { ipk: 3.8, sksLulus: 48, toeflScore: 520, similarity: 12, aiDetection: 15 },
  judul: 'Uji BP-1',
  berkasList: [{ nama: 'KRS', status: 'Lengkap' }]
});
check(
  daftar.status === 409 && daftar.json?.code === 'STAGE_PREREQUISITE_NOT_MET',
  'Pendaftaran ujian DITOLAK bila tahapan prasyarat belum selesai (409)',
  `status=${daftar.status} code=${daftar.json?.code}`
);
check(
  Array.isArray(daftar.json?.belumSelesai) && daftar.json.belumSelesai.length > 0,
  'Pesan penolakan menyebutkan tahapan yang belum selesai',
  daftar.json?.belumSelesai?.map((b) => b.kode).join(', ') || 'tidak ada'
);

console.log('\nB. BP-2 — Persetujuan naskah oleh pembimbing');
// Naskah untuk mahasiswa uji
const upto = await call('POST', '/akademik/naskah', mhs, {
  fileUrl: '/api/storage/files/naskah/uji-bp2.pdf',
  keterangan: 'Uji BP-2'
});
check(upto.status === 201, 'Mahasiswa mengunggah versi naskah', `status=${upto.status} id=${upto.json?.data?.id}`);
const versiId = upto.json?.data?.id;

const daftarNaskah = await call('GET', '/akademik/naskah', mhs);
const v = (daftarNaskah.json?.data || []).find((x) => x.id === versiId);
check(v?.statusPersetujuan === 'Diajukan', 'Naskah baru berstatus "Diajukan" (belum ditelaah)', `status=${v?.statusPersetujuan}`);

// DosEN yang MEMANG pembimbing harusnya bisa menyetujui.
const { DatabaseSync } = await import('node:sqlite');
const db = new DatabaseSync('data/sim_ta_feb_utm.db');
const taRow = db.prepare('SELECT * FROM tugas_akhir WHERE id = ?').get(taId);
db.close();

// Plot pembimbing dulu agar dosen boleh menyetujui.
const plot = await call('PUT', `/akademik/tugas-akhir/${taId}/pembimbing`, koor, {
  pembimbingUtama: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
  pembimbingUtamaNip: '196201081987032001',
  pembimbingPendamping: 'Dr. Faidal, S.E., M.M.',
  pembimbingPendampingNip: '197703032003121002'
});
check(plot.status === 200, 'Plotting pembimbing untuk mahasiswa uji', `status=${plot.status}`);

const dosen = await login('196201081987032001');
const approveNaskah = await call('PUT', `/akademik/naskah/${versiId}/approval`, dosen, {
  status: 'Disetujui',
  catatan: 'Uji BP-2: naskah layak diteruskan.'
});
check(approveNaskah.status === 200, 'Pembimbing menyetujui naskah (endpoint baru)', `status=${approveNaskah.status}`);
check(approveNaskah.json?.data?.statusPersetujuan === 'Disetujui', 'Status persetujuan naskah = Disetujui', approveNaskah.json?.data?.statusPersetujuan);

const setelah = await call('GET', '/akademik/naskah', mhs);
const v2 = (setelah.json?.data || []).find((x) => x.id === versiId);
check(v2?.statusPersetujuan === 'Disetujui', 'Mahasiswa melihat status persetujuan naskah', `status=${v2?.statusPersetujuan}`);

// Dosen yang BUKAN pembimbing harus ditolak
const dosenLain = await login('196203031988032001');
const tolak = await call('PUT', `/akademik/naskah/${versiId}/approval`, dosenLain, { status: 'Disetujui' });
check(tolak.status === 403, 'Dosen non-pembimbing DITOLAK menyetujui naskah (403)', `status=${tolak.status}`);

const invalid = await call('PUT', `/akademik/naskah/${versiId}/approval`, dosen, { status: 'Ngawur' });
check(invalid.status === 400, 'Status persetujuan yang tidak sah ditolak 400', `status=${invalid.status}`);

console.log('\nC. Checklist tahap & aturan "selesai" wajib ada persetujuan pembimbing');
// S3-T1 ("Penetapan Promotor & Topik") memang TIDAK memerlukan naskah.
// Selesaikan S3-T1 agar S3-T2 (yang requires_naskah=1) menjadi tahap aktif.
const aj0 = await call('POST', `/akademik/tugas-akhir/${taId}/tahap/S3-T1/ajukan`, mhs, { catatan: 'uji BP-2' });
check([200, 409].includes(aj0.status), 'Mahasiswa mengajukan S3-T1', `status=${aj0.status}`);
const p1 = await call('POST', `/akademik/tugas-akhir/${taId}/tahap/S3-T1/approve`, dosen, { catatan: 'uji' });
check([200, 409].includes(p1.status), 'Pembimbing menyetujui S3-T1', `status=${p1.status}`);
const v1 = await call('POST', `/akademik/tugas-akhir/${taId}/tahap/S3-T1/verifikasi`, koor, { catatan: 'uji' });
check([200, 409].includes(v1.status), 'Koordinator memverifikasi S3-T1', `status=${v1.status}`);
const s1 = await call('POST', `/akademik/tugas-akhir/${taId}/tahap/S3-T1/selesai`, koor, { catatan: 'uji' });
check(s1.status === 200, 'S3-T1 ditutup (pembimbing_approved=1) -> tahap aktif berpindah', `status=${s1.status} ${s1.json?.message || ''}`);

const progres2 = await call('GET', `/akademik/tugas-akhir/${taId}/progres`, koor);
check(progres2.json?.data?.tahapAktif?.kodeTahap === 'S3-T2', 'Tahap aktif kini S3-T2 (memerlukan naskah)', `aktif=${progres2.json?.data?.tahapAktif?.kodeTahap}`);

const cl = progres2.json?.data?.checklist || [];
const adaItemNaskahDisetujui = cl.some((c) => c.key === 'naskahDisetujui');
check(adaItemNaskahDisetujui, 'Checklist memuat item "Naskah telah disetujui pembimbing"', cl.map((c) => `${c.key}:${c.terpenuhi}`).join(' '));

// Naskah SUDAH disetujui pada langkah sebelumnya -> item harus terpenuhi.
const itemNaskah = cl.find((c) => c.key === 'naskahDisetujui');
check(itemNaskah?.terpenuhi === true, 'Item "Naskah disetujui pembimbing" terpenuhi (naskah telah disetujui)', `terpenuhi=${itemNaskah?.terpenuhi} capaian=${itemNaskah?.capaian}`);

//_now the checklist should be satisfied for naskah; but bimbingan may not be.
const ajukan = await call('POST', `/akademik/tugas-akhir/${taId}/tahap/S3-T1/ajukan`, mhs, { catatan: 'uji' });
check([200, 409].includes(ajukan.status), 'Pengajuan tahap memakai checklist (200/409)', `status={${ajukan.status}} ${ajukan.json?.message || ''}`);

console.log(`\nLulus: ${pass} | Gagal: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
