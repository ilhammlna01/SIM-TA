/**
 * Perbaikan Konsistensi Nama Ekspor — SIM-TA FEB UTM
 *
 * Audit 22 Oktober 2026: saat menambah modul otorisasi PIN, nama konstanta
 * ekspor di server/utils/pinAuth.js tertukar huruf ("KONSTEKS" alih-alih
 * "KONTEKS"), sehingga modul gagal dimuat dengan pesan:
 *   "The requested module '../utils/pinAuth.js' does not provide an export
 *    named 'PIN_KONTEKS_DEKANAT'"
 *
 * Skrip ini menormalkan nama tersebut di seluruh repo TANPA menulis ulang
 * identifier secara manual (yang berisiko_typos berulang), lalu memverifikasi
 * bahwa setiap nama yang diimpor benar-benar tersedia di modul sumbernya.
 *
 * Jalankan: node scripts/fix_export_names.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const BENAR = 'PIN_KON' + 'TEKS_DEKANAT'; // disusun dari potongan agar tidak salah ketik
const SALAH = 'PIN_KON' + 'STEKS_DEKANAT';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', 'dist', 'backups', 'data', 'uploads', '.git'].includes(e.name)) walk(full, out);
    } else if (/\.(js|jsx|mjs)$/.test(e.name)) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
let diperbaiki = 0;

for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  if (!t.includes(SALAH)) continue;
  fs.writeFileSync(f, t.split(SALAH).join(BENAR), 'utf8');
  console.log(`  diperbaiki: ${path.relative(ROOT, f)}`);
  diperbaiki++;
}
console.log(`\nBerkas diperbaiki: ${diperbaiki}`);

// ---------------------------------------------------------------------------
// Verifikasi: setiap nama yang diimpor harus tersedia di modul sumber.
// ---------------------------------------------------------------------------
const petaModul = new Map();
for (const f of files) {
  if (!f.includes(`${path.sep}server${path.sep}`)) continue;
  const src = fs.readFileSync(f, 'utf8');
  const diekspor = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/g)) {
    diekspor.add(m[1]);
  }
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const b of m[1].split(',')) {
      const n = b.trim().split(/\s+as\s+/)[0].trim();
      if (n) diekspor.add(n);
    }
  }
  petaModul.set(path.resolve(f), diekspor);
}

let masalah = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const target = path.resolve(path.dirname(f), m[2]);
    const diekspor = petaModul.get(target);
    if (!diekspor) continue;
    for (const b of m[1].split(',')) {
      const n = b.trim().split(/\s+as\s+/)[0].trim();
      if (!n) continue;
      if (!diekspor.has(n)) {
        console.log(`  [CACAT] ${path.relative(ROOT, f)} mengimpor "${n}" yang tidak diekspor oleh ${m[2]}`);
        masalah++;
      }
    }
  }
}

console.log(`\nVerifikasi nama ekspor: ${masalah === 0 ? 'BERSIH' : masalah + ' masalah'}`);
process.exit(masalah > 0 ? 1 : 0);
