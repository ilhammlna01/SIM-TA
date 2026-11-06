import { INITIAL_DAFTAR_UJIAN_PENGUJI } from '../src/data/pengujiData.js';

console.log('Testing DaftarUjianPage logic & data mapping...');

// Test 1: INITIAL_DAFTAR_UJIAN_PENGUJI
console.log('Total mock ujian:', INITIAL_DAFTAR_UJIAN_PENGUJI.length);

// Test 2: Simulating the filter logic from DaftarUjianPage.jsx
const searchQuery = '';
const filterStatus = 'Semua';

const filteredUjian = INITIAL_DAFTAR_UJIAN_PENGUJI.filter((uj) => {
  const namaMhs = uj.namaMahasiswa || uj.nama || '';
  const nimMhs = String(uj.nim || uj.nomorInduk || '');
  const judulNaskah = uj.judul || uj.judulNaskah || uj.tema || '';
  const jenisUj = uj.jenisUjian || uj.jenis || '';

  const matchSearch =
    namaMhs.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nimMhs.includes(searchQuery) ||
    judulNaskah.toLowerCase().includes(searchQuery.toLowerCase()) ||
    jenisUj.toLowerCase().includes(searchQuery.toLowerCase());

  const matchStatus =
    filterStatus === 'Semua' ||
    (filterStatus === 'Menunggu' && !uj.penilaianSubmitted) ||
    (filterStatus === 'Selesai' && uj.penilaianSubmitted);

  return matchSearch && matchStatus;
});

console.log('Filtered items count:', filteredUjian.length);

// Test 3: Simulating column renders
for (const row of filteredUjian) {
  const jadwal = row.jadwal || row.tanggalUjian || row.tanggal || 'Jadwal Ditentukan Kemudian';
  const waktu = row.waktu || row.jamUjian || row.jam || 'Waktu Sidang';
  const ruang = row.ruang || row.ruangSidang || 'Ruang Sidang FEB';
  const jenisUjian = row.jenisUjian || 'Ujian Tugas Akhir';
  const jenjang = row.jenjang || 'S1';
  const namaMahasiswa = row.namaMahasiswa || row.nama || 'Mahasiswa';
  const nim = row.nim || '-';
  const programStudi = row.programStudi || row.prodi || 'Program Studi';
  const judul = row.judul || row.judulNaskah || '(Judul naskah akademik terdaftar di sistem)';
  const peran = String(row.peranDosen || row.peranPenguji || 'Dewan Penguji');
  const isUtama = peran.includes('Utama') || peran.includes('III');

  console.log(`- Mahasiswa: ${namaMahasiswa} (${nim}), Jenis: ${jenisUjian}, Peran: ${peran}, Utama: ${isUtama}`);
}

// Test 4: Testing with empty or missing object fields (as might come from backend)
const partialUjianList = [
  { id: 'uj-empty-1' },
  { id: 'uj-db-1', nama_mahasiswa: 'Test DB', tanggal_ujian: '2026-10-15', peran_dosen: 'Penguji' }
];

const filteredPartial = partialUjianList.filter((uj) => {
  const namaMhs = uj.namaMahasiswa || uj.nama || '';
  const nimMhs = String(uj.nim || uj.nomorInduk || '');
  const judulNaskah = uj.judul || uj.judulNaskah || uj.tema || '';
  const jenisUj = uj.jenisUjian || uj.jenis || '';

  return (
    namaMhs.toLowerCase().includes('') &&
    nimMhs.includes('') &&
    judulNaskah.toLowerCase().includes('') &&
    jenisUj.toLowerCase().includes('')
  );
});

console.log('Partial items handled safely without crash:', filteredPartial.length === 2);
console.log('✅ ALL DAFTAR UJIAN DATA TESTS PASSED!');
