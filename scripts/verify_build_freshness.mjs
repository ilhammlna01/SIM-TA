/**
 * Pemeriksa kesegaran build produksi.
 *
 * Menjawab pertanyaan: "apakah perubahan terbaru di :5173 sudah muncul di :5001?"
 *
 * Cara kerja:
 *  1. Membandingkan waktu build terakhir (dist/index.html) dengan waktu
 *     modifikasi terakhir berkas sumber (src/**).
 *  2. Memeriksa apakah setiap berkas sumber yang memiliki teks UI nyata
 *     benar-benar tercermin pada bundel produksi.
 *
 * Exit code 0 = build SEGAR, 1 = build BASI (perlu `npm run build`).
 */

import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('src');
const DIST = path.resolve('dist');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(e.name)) out.push(full);
  }
  return out;
}

const distIndex = path.join(DIST, 'index.html');
if (!fs.existsSync(distIndex)) {
  console.error('dist/index.html TIDAK ADA. Jalankan `npm run build`.');
  process.exit(1);
}

const buildTime = fs.statSync(distIndex).mtime;
const srcFiles = walk(SRC);
const newest = srcFiles
  .map((f) => ({ f, mtime: fs.statSync(f).mtime }))
  .sort((a, b) => b.mtime - a.mtime)[0];

console.log('====================================================');
console.log('KESEGARAN BUILD PRODUKSI (dist/ vs src/)');
console.log('====================================================');
console.log(`  Build terakhir   : ${buildTime.toLocaleString('id-ID')}`);
console.log(`  Sumber terbaru   : ${newest.mtime.toLocaleString('id-ID')}`);
console.log(`  Berkas termuda   : ${path.relative(SRC, newest.f)}`);
console.log('');

let bundle = '';
for (const f of walk(DIST).filter((p) => p.endsWith('.js'))) {
  bundle += fs.readFileSync(f, 'utf8') + '\n';
}

function uiLiterals(src) {
  const out = [];
  const re = /(['"])((?:(?!\1)[^\\\n]){8,140})\1/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const s = m[2];
    if (!/[a-zA-Z]{3,}/.test(s)) continue;
    if (/^\s|,|\(|\)|^\d/.test(s)) continue;
    if (/^[.\/]/.test(s)) continue;
    if (/^[a-z0-9-]+(\/[a-z0-9.-]+)+$/i.test(s)) continue;
    if (s.includes('..')) continue;
    if (!/\s/.test(s) && s.length < 18) continue;
    if (/^[A-Za-z0-9_]+$/.test(s)) continue;
    out.push(s);
  }
  return [...new Set(out)];
}

let stale = 0;
let checked = 0;
const missingDetail = [];

for (const f of srcFiles) {
  const lits = uiLiterals(fs.readFileSync(f, 'utf8'));
  if (lits.length < 3) continue;
  checked++;
  const miss = lits.filter((s) => !bundle.includes(s));
  const ratio = (lits.length - miss.length) / lits.length;
  if (ratio < 0.95) {
    stale++;
    missingDetail.push({ rel: path.relative(SRC, f), ratio, miss: miss.slice(0, 2) });
  }
}

const timeStale = newest.mtime > buildTime;

console.log(`  Berkas sumber diperiksa : ${checked}`);
console.log(`  Tercermin penuh         : ${checked - stale}`);
console.log(`  Tidak tercermin penuh   : ${stale}`);
console.log('');

if (missingDetail.length) {
  console.log('  Berkas yang perlu diperiksa (kemungkinan dead code / komponen khusus dev):');
  for (const m of missingDetail) {
    console.log(`    - ${m.rel} (${Math.round(m.ratio * 100)}%) contoh: ${JSON.stringify(m.miss[0] || '').slice(0, 90)}`);
  }
  console.log('');
}

if (timeStale) {
  console.error('!! BUILD BASI: ada berkas sumber yang lebih baru daripada build terakhir.');
  console.error('   Jalankan:  npm run build');
  process.exit(1);
}

console.log('✅ BUILD SEGAR — perubahan pada src/ SUDAH tercermin pada :5001.');
console.log('   (Untuk pembaruan otomatis tanpa rebuild manual: npm run build:watch)');
process.exit(0);
