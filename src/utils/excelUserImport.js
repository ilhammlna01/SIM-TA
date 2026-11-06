import * as XLSX from 'xlsx';

/**
 * Daftar Peran Resmi yang Diizinkan Sistem SIM-TA FEB UTM
 */
export const VALID_ROLES = [
  { value: 'mahasiswa', label: 'Mahasiswa Tugas Akhir' },
  { value: 'dosen', label: 'Dosen Pembimbing / Promotor' },
  { value: 'penguji', label: 'Dewan Penguji Sidang' },
  { value: 'koorprodi', label: 'Koordinator Program Studi' },
  { value: 'admin', label: 'Admin Akademik' },
  { value: 'superadmin', label: 'Super Administrator' }
];

/**
 * Daftar Jenjang Pendidikan Resmi FEB UTM
 */
export const VALID_JENJANG = ['D3', 'S1', 'S2', 'S3'];

/**
 * Daftar Program Studi Resmi FEB UTM
 */
export const VALID_PRODI = [
  'D-3 Akuntansi Perpajakan',
  'S-1 Manajemen',
  'S-1 Akuntansi',
  'S-1 Ekonomi Pembangunan',
  'S-2 Magister Manajemen',
  'S-2 Magister Akuntansi',
  'S-3 Doktor Ilmu Manajemen'
];

/**
 * Menghasilkan dan mengunduh berkas template Excel (.xlsx) resmi
 * yang siap diisi oleh Super Administrator.
 */
export function downloadUserImportTemplate() {
  // 1. Data Contoh untuk Lembar Utama
  const sampleData = [
    {
      Nomor_Induk: '210211100142',
      Nama_Lengkap: 'Dinda Ayu Larasati',
      Email: 'dinda.larasati@student.trunojoyo.ac.id',
      Peran: 'mahasiswa',
      Jenjang: 'S1',
      Program_Studi: 'S-1 Manajemen',
      Status: 'Aktif'
    },
    {
      Nomor_Induk: '220212100018',
      Nama_Lengkap: 'Rahmat Hidayat, S.E.',
      Email: 'rahmat.hidayat@student.trunojoyo.ac.id',
      Peran: 'mahasiswa',
      Jenjang: 'S2',
      Program_Studi: 'S-2 Magister Manajemen',
      Status: 'Aktif'
    },
    {
      Nomor_Induk: '197204121998022001',
      Nama_Lengkap: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
      Email: 'iriani.ismail@feb.trunojoyo.ac.id',
      Peran: 'dosen',
      Jenjang: 'S1',
      Program_Studi: 'S-1 Manajemen',
      Status: 'Aktif'
    },
    {
      Nomor_Induk: '197703032003121002',
      Nama_Lengkap: 'Dr. Faidal, S.E., M.M.',
      Email: 'faidal@feb.trunojoyo.ac.id',
      Peran: 'penguji',
      Jenjang: 'S2',
      Program_Studi: 'S-2 Magister Manajemen',
      Status: 'Aktif'
    },
    {
      Nomor_Induk: '196805151994032001',
      Nama_Lengkap: 'Dr. Hj. Siti Aminah, S.E., M.Si.',
      Email: 'siti.aminah@feb.trunojoyo.ac.id',
      Peran: 'koorprodi',
      Jenjang: 'S1',
      Program_Studi: 'S-1 Manajemen',
      Status: 'Aktif'
    },
    {
      Nomor_Induk: '198506202010121003',
      Nama_Lengkap: 'Ahmad Fauzi, S.Kom., M.T.',
      Email: 'ahmad.fauzi@feb.trunojoyo.ac.id',
      Peran: 'admin',
      Jenjang: 'S2',
      Program_Studi: 'S-2 Magister Manajemen',
      Status: 'Aktif'
    }
  ];

  // 2. Data Referensi Petunjuk
  const referenceData = [
    {
      Nama_Kolom: 'Nomor_Induk',
      Kewajiban: 'Wajib Diisi',
      Ketentuan: 'NIM (12 digit) untuk mahasiswa, NIP (18 digit) untuk dosen/tendik. Unik tidak boleh ganda.'
    },
    {
      Nama_Kolom: 'Nama_Lengkap',
      Kewajiban: 'Wajib Diisi',
      Ketentuan: 'Nama lengkap beserta gelar akademik resmi (jika ada).'
    },
    {
      Nama_Kolom: 'Email',
      Kewajiban: 'Wajib Diisi',
      Ketentuan: 'Alamat surel aktif berformat standar (@trunojoyo.ac.id / institusi).'
    },
    {
      Nama_Kolom: 'Peran',
      Kewajiban: 'Wajib Diisi',
      Ketentuan: 'Hanya pilih: mahasiswa, dosen, penguji, koorprodi, admin, superadmin'
    },
    {
      Nama_Kolom: 'Jenjang',
      Kewajiban: 'Wajib Diisi',
      Ketentuan: 'Hanya pilih: D3, S1, S2, S3'
    },
    {
      Nama_Kolom: 'Program_Studi',
      Kewajiban: 'Wajib Diisi',
      Ketentuan: 'Contoh: S-1 Manajemen, S-1 Akuntansi, S-2 Magister Manajemen, dsb.'
    },
    {
      Nama_Kolom: 'Status',
      Kewajiban: 'Opsional',
      Ketentuan: 'Pilih: Aktif atau Nonaktif (Default: Aktif)'
    }
  ];

  // Buat Worksheets
  const wsData = XLSX.utils.json_to_sheet(sampleData);
  const wsRef = XLSX.utils.json_to_sheet(referenceData);

  // Atur Lebar Kolom agar rapi saat dibuka di Microsoft Excel
  wsData['!cols'] = [
    { wch: 22 }, // Nomor_Induk
    { wch: 32 }, // Nama_Lengkap
    { wch: 38 }, // Email
    { wch: 16 }, // Peran
    { wch: 12 }, // Jenjang
    { wch: 26 }, // Program_Studi
    { wch: 14 }  // Status
  ];

  wsRef['!cols'] = [
    { wch: 18 }, // Nama_Kolom
    { wch: 16 }, // Kewajiban
    { wch: 60 }  // Ketentuan
  ];

  // Buat Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsData, 'DATA_PENGGUNA');
  XLSX.utils.book_append_sheet(wb, wsRef, 'PETUNJUK_DAN_REFERENSI');

  // Trigger unduhan langsung di browser
  const filename = `Template_Import_Akun_Pengguna_SIMTA_FEB_UTM.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Normalisasi nama header kolom agar toleran terhadap variasi spasi / huruf kapital
 */
function normalizeColumnKey(rawKey) {
  if (!rawKey) return '';
  const cleaned = rawKey.toString().trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (['nomorinduk', 'nim', 'nip', 'noinduk', 'nik', 'username'].includes(cleaned)) return 'nomorInduk';
  if (['nama', 'namalengkap', 'fullname', 'namauser'].includes(cleaned)) return 'nama';
  if (['email', 'surel', 'mail', 'alamatemail'].includes(cleaned)) return 'email';
  if (['peran', 'role', 'jabatan', 'hakakses'].includes(cleaned)) return 'role';
  if (['jenjang', 'strata', 'program'].includes(cleaned)) return 'jenjang';
  if (['programstudi', 'prodi', 'jurusan'].includes(cleaned)) return 'prodi';
  if (['status', 'statusakun', 'aktif'].includes(cleaned)) return 'status';
  return cleaned;
}

/**
 * Normalisasi role agar sesuai dengan enum sistem
 */
function normalizeRole(rawRole) {
  if (!rawRole) return '';
  const r = rawRole.toString().trim().toLowerCase();
  if (r.includes('super')) return 'superadmin';
  if (r.includes('admin') || r.includes('pasca')) return 'admin';
  if (r.includes('penguji')) return 'penguji';
  if (r.includes('koor') || r.includes('kaprodi')) return 'koorprodi';
  if (r.includes('dosen') || r.includes('pembimbing') || r.includes('promotor')) return 'dosen';
  if (r.includes('mhs') || r.includes('mahasiswa')) return 'mahasiswa';
  return r;
}

/**
 * Normalisasi jenjang
 */
function normalizeJenjang(rawJenjang) {
  if (!rawJenjang) return 'S1';
  const j = rawJenjang.toString().trim().toUpperCase();
  if (['D3', 'D-3', 'DIPLOMA'].includes(j)) return 'D3';
  if (['S1', 'S-1', 'SARJANA'].includes(j)) return 'S1';
  if (['S2', 'S-2', 'MAGISTER'].includes(j)) return 'S2';
  if (['S3', 'S-3', 'DOKTOR'].includes(j)) return 'S3';
  return j;
}

/**
 * Membaca dan memvalidasi file Excel (.xlsx / .xls / .csv)
 * 
 * @param {File} file Berkas Excel yang diupload
 * @param {Array} existingUsers Daftar pengguna yang sudah terdaftar di sistem
 * @returns {Promise<Object>} Hasil parsing dan status validasi setiap baris
 */
export async function parseAndValidateUserExcel(file, existingUsers = []) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Ambil sheet utama (DATA_PENGGUNA jika ada, atau sheet pertama)
        const sheetName = workbook.SheetNames.includes('DATA_PENGGUNA')
          ? 'DATA_PENGGUNA'
          : workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          throw new Error('Lembar kerja (sheet) tidak ditemukan di dalam berkas Excel.');
        }

        // Konversi ke format JSON mentah
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          return resolve({
            totalRows: 0,
            validRows: [],
            invalidRows: [],
            duplicateRows: [],
            summary: { total: 0, valid: 0, invalid: 0, duplicate: 0 }
          });
        }

        const validRolesList = VALID_ROLES.map(r => r.value);
        const existingNimMap = new Set(existingUsers.map(u => u.nomorInduk?.toString().trim()));
        const seenInFileMap = new Set();

        const validRows = [];
        const invalidRows = [];
        const duplicateRows = [];

        rawRows.forEach((raw, idx) => {
          const rowNumber = idx + 2; // +1 untuk header, +1 untuk 1-based index Excel

          // Petakan header kolom
          const mapped = {};
          Object.keys(raw).forEach(key => {
            const normalizedKey = normalizeColumnKey(key);
            mapped[normalizedKey] = raw[key] ? raw[key].toString().trim() : '';
          });

          // Lewati jika seluruh baris kosong
          const hasAnyValue = Object.values(mapped).some(v => v !== '');
          if (!hasAnyValue) return;

          const nomorInduk = mapped.nomorInduk || '';
          const nama = mapped.nama || '';
          const email = mapped.email || '';
          const rawRole = mapped.role || '';
          const role = normalizeRole(rawRole);
          const jenjang = normalizeJenjang(mapped.jenjang);
          const prodi = mapped.prodi || (jenjang === 'S2' ? 'S-2 Magister Manajemen' : jenjang === 'S3' ? 'S-3 Doktor Ilmu Manajemen' : 'S-1 Manajemen');
          const rawStatus = (mapped.status || 'Aktif').toLowerCase();
          const status = rawStatus.includes('non') ? 'Nonaktif' : 'Aktif';

          const errors = [];
          const warnings = [];

          // Validasi Field Wajib
          if (!nomorInduk) {
            errors.push('Nomor Induk (NIM/NIP) wajib diisi.');
          } else if (nomorInduk.length < 5) {
            errors.push('Nomor Induk terlalu pendek (min. 5 karakter).');
          }

          if (!nama) {
            errors.push('Nama Lengkap wajib diisi.');
          }

          if (!email) {
            errors.push('Email wajib diisi.');
          } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              errors.push('Format email tidak valid.');
            }
          }

          if (!role) {
            errors.push('Peran (Role) wajib diisi.');
          } else if (!validRolesList.includes(role)) {
            errors.push(`Peran "${rawRole}" tidak dikenali. Pilih: mahasiswa, dosen, penguji, koorprodi, admin, superadmin.`);
          }

          // Cek Duplikat di dalam berkas Excel yang sama
          if (nomorInduk) {
            if (seenInFileMap.has(nomorInduk)) {
              errors.push(`Duplikat di dalam file: Nomor Induk ${nomorInduk} tercatat lebih dari satu kali.`);
            } else {
              seenInFileMap.add(nomorInduk);
            }
          }

          // Cek Konflik dengan Pengguna yang Sudah Terdaftar di Sistem
          const isExisting = nomorInduk && existingNimMap.has(nomorInduk);
          if (isExisting) {
            warnings.push(`Akun dengan Nomor Induk ${nomorInduk} sudah terdaftar di sistem (akan diperbarui).`);
          }

          const parsedItem = {
            id: `usr-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            rowNumber,
            nomorInduk,
            nama,
            email,
            role,
            jenjang,
            prodi,
            status,
            lastLogin: 'Belum pernah login',
            isExisting,
            errors,
            warnings,
            isValid: errors.length === 0
          };

          if (errors.length > 0) {
            invalidRows.push(parsedItem);
          } else if (isExisting) {
            duplicateRows.push(parsedItem);
            validRows.push(parsedItem); // Tetap bisa diimpor sebagai update
          } else {
            validRows.push(parsedItem);
          }
        });

        resolve({
          totalRows: validRows.length + invalidRows.length,
          validRows,
          invalidRows,
          duplicateRows,
          summary: {
            total: validRows.length + invalidRows.length,
            valid: validRows.length - duplicateRows.length,
            duplicate: duplicateRows.length,
            invalid: invalidRows.length
          }
        });
      } catch (err) {
        reject(new Error(`Gagal memproses berkas Excel: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas dari perangkat Anda.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
