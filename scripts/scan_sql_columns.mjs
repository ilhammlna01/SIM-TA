/**
 * Pemindai SQL Statis — mendeteksi pernyataan SQL yang merujuk kolom
 * yang tidak ada pada skema basis data.
 *
 * Audit 21 Oktober 2026 (Simulasi Proses A–Z): ditemukan pernyataan
 * `UPDATE ujian_penguji ... WHERE ujian_id = ?` yang merujuk kolom yang tidak
 * ada, sehingga db.prepare() melempar error dan seluruh endpoint berakhir
 * HTTP 500. Pemindai ini menyisir seluruh pernyataan SQL di server/ agar kelas
 * bug yang sama tidak tersisa di tempat lain.
 *
 * Jalankan: node scripts/scan_sql_columns.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const ROOT = path.resolve('server');
const DB = 'data/sim_ta_feb_utm.db';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.js')) out.push(full);
  }
  return out;
}

// Kumpulkan skema
const db = new DatabaseSync(DB);
const schema = {};
for (const t of db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()) {
  schema[t.name] = new Set(db.prepare(`PRAGMA table_info("${t.name}")`).all().map((c) => c.name));
}
db.close();

const files = walk(ROOT);
const temuan = [];
let totalStatement = 0;

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(path.resolve('.'), f);

  // Ambil setiap db.prepare('...') / db.prepare(`...`)
  const re = /db\.prepare\(\s*(`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*')\s*\)/gs;
  let m;
  while ((m = re.exec(src)) !== null) {
    const raw = m[1];
    let sql = raw.slice(1, -1);

    // Abaikan template literal yang menyisipkan variabel (query dinamis).
    if (raw.startsWith('`') && /\$\{/.test(sql)) {
      // Coba substitusi variabel dengan nama kolom generik yang pasti ada.
      sql = sql.replace(/\$\{[^}]+\}/g, 'x');
    }
    sql = sql.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!sql) continue;

    totalStatement++;

    // Deteksi SEMUA tabel yang dirujuk (termasuk subquery) — sebuah kolom
    // dianggap valid bila ada pada salah satu tabel yang dirujuk.
    const tabelSet = new Set();
    for (const tm of sql.matchAll(/\b(?:FROM|INTO|UPDATE|JOIN)\s+([a-z_][a-z0-9_]*)/gi)) {
      const tn = tm[1].toLowerCase();
      if (schema[tn]) tabelSet.add(tn);
    }
    if (tabelSet.size === 0) continue;
    const tabel = [...tabelSet][0];
    const schemaGabungan = new Set();
    for (const tn of tabelSet) for (const c of schema[tn]) schemaGabungan.add(c);

    // Kumpulkan nama kolom yang dirujuk
    const kolomDisediakan = new Set(
      [...sql.matchAll(/\b([a-z_][a-z0-9_]*)\s*(?:=|<>|!=|>=|<=|\+|-|\*|\/)\s*(?:\?|\d|')/gi)]
        .map((x) => x[1].toLowerCase())
    );
    // SELECT kolom:-between
    for (const sm of sql.matchAll(/\bSELECT\s+([\s\S]*?)\s+FROM/gi)) {
      for (const k of sm[1].split(',')) {
        const nama = k.trim().split(/\s+as\s+/i)[0].replace(/["'`]/g, '').trim().toLowerCase();
        if (/^[a-z_][a-z0-9_]*$/.test(nama) && nama !== 'distinct') kolomDisediakan.add(nama);
      }
    }
    // Kolom pada klausa SET
    for (const sm of sql.matchAll(/\bSET\s+([\s\S]*?)\s+WHERE/gi)) {
      for (const k of sm[1].split(',')) {
        const nama = k.trim().split('=')[0].trim().toLowerCase();
        if (/^[a-z_][a-z0-9_]*$/.test(nama)) kolomDisediakan.add(nama);
      }
    }
    // Kolom pada WHERE
    for (const sm of sql.matchAll(/\bWHERE\s+([\s\S]*?)(?:\bORDER BY|\bGROUP BY|\bLIMIT|$)/gi)) {
      for (const k of sm[1].split(/\s+AND\s+|\s+OR\s+/i)) {
        const nama = k.trim().split(/[<>=!+\-*/]/)[0].trim().replace(/["'`]/g, '').toLowerCase();
        if (/^[a-z_][a-z0-9_]*$/.test(nama) && nama !== 'not') kolomDisediakan.add(nama);
      }
    }

    const salah = [...kolomDisediakan].filter((k) => !schemaGabungan.has(k));
    if (salah.length) {
      const lineNo = src.slice(0, m.index).split('\n').length;
      temuan.push({ file: rel, line: lineNo, tabel, salah, sql: sql.slice(0, 150) });
    }
  }
}

console.log('====================================================');
console.log('PEMINDAI KOLOM SQL — server/ vs skema basis data');
console.log('====================================================');
console.log(`Tabel diperiksa : ${Object.keys(schema).length}`);
console.log(`Pernyataan SQL   : ${totalStatement}`);
console.log(`Temuan          : ${temuan.length}\n`);

if (temuan.length) {
  for (const t of temuan) {
    console.log(`  [CACAT] ${t.file}:${t.line}`);
    console.log(`          tabel ${t.tabel} -> kolom tidak dikenal: ${t.salah.join(', ')}`);
    console.log(`          SQL: ${t.sql}`);
  }
} else {
  console.log('  ✅ Tidak ada pernyataan SQL yang merujuk kolom tidak dikenal.');
}
console.log('');
process.exit(temuan.length ? 1 : 0);
