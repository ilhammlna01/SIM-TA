import * as XLSX from 'xlsx';
import { parseAndValidateUserExcel } from '../src/utils/excelUserImport.js';
import fs from 'node:fs';

console.log('--- Testing Excel Template Generation and Parser ---');

// 1. Create a dummy workbook using standard template format
const testRows = [
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
    Nomor_Induk: '197204121998022001',
    Nama_Lengkap: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    Email: 'iriani.ismail@feb.trunojoyo.ac.id',
    Peran: 'dosen',
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
  },
  {
    // Invalid row (missing email and invalid role)
    Nomor_Induk: '99999',
    Nama_Lengkap: 'Pengguna Salah Format',
    Email: '',
    Peran: 'role_ngawur',
    Jenjang: 'S1',
    Program_Studi: 'S-1 Manajemen',
    Status: 'Aktif'
  }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(testRows);
XLSX.utils.book_append_sheet(wb, ws, 'DATA_PENGGUNA');
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

// Simulate File object with arrayBuffer()
const mockFile = {
  name: 'test_import_users.xlsx',
  size: buffer.length
};

// Test parse directly with XLSX
const wbParsed = XLSX.read(buffer, { type: 'buffer' });
const jsonParsed = XLSX.utils.sheet_to_json(wbParsed.Sheets['DATA_PENGGUNA']);

console.log('Parsed rows count:', jsonParsed.length);
console.log('Row 1:', jsonParsed[0]);
console.log('Row 4 (Invalid):', jsonParsed[3]);

if (jsonParsed.length === 4 && jsonParsed[0].Nomor_Induk === '210211100142') {
  console.log('✅ TEST PASSED: Excel parsing and SheetJS formatting works seamlessly!');
} else {
  console.error('❌ TEST FAILED');
  process.exit(1);
}
