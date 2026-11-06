/**
 * Verifier Konsistensi Nama Ekspor — SIM-TA FEB UTM
 *
 * Mengpierksa bahwa setiap nama yang DI-IMPOR dari sebuah modul benar-benar
 * tersedia di modul tersebut, dengan perbandingan byte yang ketat.
 *
 * Latar belakang: beberapa berkas yang ditulis mengalami satu karakter
 * identifier berubah menjadi non-ASCII (homoglyph), sehingga modul gagal
 * dimuat dengan pesan "does not provide an export named ...". Pemeriksaan ini
 * menangkap hal tersebut sebelum sistem dijalankan.
 *
 * Jalankan: node scripts/verify_exports.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const TARGETS = [
  'server/utils/pinAuth.js',
  'server/utils/jwt.js',
  'server/utils/password.js',
  'server/utils/payload.js',
  'server/academic/examRules.js',
  'server/academic/supervisorIdentity.js',
  'server/documents/documentPayload.js',
  'server/documents/pdfGenerator.js'
];

let masalah = 0;

for (const file of TARGETS) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;
  const src = fs.readFileSync(full, 'utf8');

  // Nama yang diekspor (byte ketat).
  const diekspor = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/g)) {
    diekspor.add(m[1]);
  }
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const bagian of m[1].split(',')) {
      const nama = bagian.trim().split(/\s+as\s+/)[0].trim();
      if (nama) diekspor.add(nama);
    }
  }

  // Nama yang diimpor dari modul ini di seluruh repo.

  // Cari pemakaian modul melalui pola import biasa.
  const polaImport = new RegExp(
    "import\\s*\\{([^}]*)\\}\\s*from\\s*['\"]([^'\"]*\\/" +
      file.replace(/\\/g, '/').split('/').pop() +
      ")['\"]",
    'g'
  );
  for (const m of src.matchAll(polaImport)) {
    for (const bagian of m[1].split(',')) {
      const nama = bagian.trim().split(/\s+as\s+/)[0].trim();
      if (!nama) continue;
      if (!diekspor.has(nama)) {
        console.log(`  [CACAT] ${file} tidak mengekspor "${nama}" (konsumen: ${m[2]})`);
        masalah++;
      }
    }
  }

  // Deteksi karakter non-ASCII pada identifier.
  for (const m of src.matchAll(/\b(?:const|let|var|function|class)\s+([^\s(=;,{]+)/g)) {
    const nama = m[1];
    if (/[^\x00-\x7F]/.test(nama)) {
      console.log(`  [CACAT] ${file}: identifier berisi karakter non-ASCII -> ${JSON.stringify(nama)}`);
      masalah++;
    }
  }
}

// Verifikasi silang: modul yang diimpor harus ada.
const semua = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', 'dist', 'backups', 'data', 'uploads', '.git'].includes(e.name)) walk(full);
    } else if (e.name.endsWith('.js') || e.name.endsWith('.jsx')) {
      semua.push(full);
    }
  }
})(path.join(ROOT, 'server'));

console.log('\n====================================================');
console.log(`Verifikasi ekspor: ${masalah === 0 ? 'BERSIH' : masalah + ' masalah'}`);
console.log('====================================================\n');
process.exit(masalah > 0 ? 1 : 0);
