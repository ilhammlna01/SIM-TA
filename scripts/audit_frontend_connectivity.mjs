/**
 * Analisis konektivitas Frontend <-> Backend yang AKURAT (versi 2).
 *
 * Versi sebelumnya hanya mendeteksi pemanggilan API LANGSUNG di berkas
 * halaman. Hal itu menghasilkan false negative besar: App.jsx действует
 * sebagai orkestrator yang memuat data dari backend lalu meneruskannya
 * sebagai props (lihat syncFromBackend). Halaman yang hanya membaca props
 * tersebut TETAP bersumber dari backend.
 *
 * Versi ini menelusuri:
 *   (1) state App.jsx yang dihidrasi dari backend (sinkronFromBackend),
 *   (2) state App.jsx yang ditulis melalui handler yang memanggil API,
 *   (3) state App.jsx yang HANYA berasal dari data statis/mock,
 *   (4) setiap halaman: props yang diterimanya dan asal-usulnya.
 */

import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('src');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(e.name)) out.push(full);
  }
  return out;
}

const appSrc = fs.readFileSync(path.join(SRC, 'App.jsx'), 'utf8');

// ---------------------------------------------------------------------------
// (1) State yang dihidrasi dari backend
// ---------------------------------------------------------------------------
const syncStart = appSrc.indexOf('const syncFromBackend = async () => {');
const syncEnd = appSrc.indexOf('\n  };', syncStart);
const syncBody = syncStart >= 0 ? appSrc.slice(syncStart, syncEnd) : '';

const hydrated = new Set();

for (const m of syncBody.matchAll(/set([A-Z]\w+)\(/g)) {
  hydrated.add(m[1].charAt(0).toLowerCase() + m[1].slice(1));
}

// ---------------------------------------------------------------------------
// (2) State yang ditulis handler yang memanggil API
// ---------------------------------------------------------------------------
const handlerBlocks = [];
for (const m of appSrc.matchAll(/const (handle[A-Z]\w+) = (?:async )?\([^)]*\) => \{([\s\S]*?)\n  \};/g)) {
  handlerBlocks.push({ name: m[1], body: m[2] });
}

const writtenByApi = new Set();
for (const h of handlerBlocks) {
  if (!/\b\w+Api\.\w+\s*\(/.test(h.body)) continue;
  for (const m of h.body.matchAll(/set([A-Z]\w+)\(/g)) {
    writtenByApi.add(m[1].charAt(0).toLowerCase() + m[1].slice(1));
  }
}

// ---------------------------------------------------------------------------
// (3) Semua state App.jsx
// ---------------------------------------------------------------------------
const allStates = new Set();
// Audit 21 Oktober 2026: nama state pada App.jsx memakai camelCase
// (huruf KECIL di awal), sehingga pola [A-Z] tidak pernah cocok dan SELURUH
// state dianggap tidak dikenal — inilah penyebab angka 43 halaman "tidak
// terhubung" yang jauh melebihi kenyataan.
for (const m of appSrc.matchAll(/const \[([A-Za-z]\w+), set[A-Z]\w+\] = useState/g)) {
  allStates.add(m[1]);
}

// ---------------------------------------------------------------------------
// (3b) Variabel turunan -> state asal.
//
// Setiap konstanta turunan di App.jsx (mis. currentBimbinganListDosen =
// bimbinganListMhs.filter(...)) dipetakan ke variabel yang dirujuknya,
// lalu diresolusi rekursif hingga mencapai state useState.
//
// Tanpa resolusi ini, halaman yang datanya bersumber dari backend namun
// diteruskan lewat variabel turunan akan salah dilaporkan sebagai "tidak
// terhubung" — kekeliruan yang pernah terjadi pada audit ini.
// ---------------------------------------------------------------------------

/** Mengambil blok ekspresi sebuah konstanta di App.jsx. */
function getExprBody(name) {
  const re = new RegExp('(?:const|let)\\s+' + name + '\\s*=');
  const m = re.exec(appSrc);
  if (!m) return null;
  const rest = appSrc.slice(m.index + m[0].length);
  // Berhenti pada statement berikutnya.
  const stop = rest.search(/\n\s{2}(?:const|let|useEffect|useMemo|useCallback|return|\/\/|\})/);
  return stop === -1 ? rest.slice(0, 1500) : rest.slice(0, stop);
}

const derived = new Map();
for (const m of appSrc.matchAll(/(?:^|\n)\s{2}const ([a-zA-Z_]\w*)\s*=/g)) {
  const name = m[1];
  if (allStates.has(name) || derived.has(name)) continue;
  const body = getExprBody(name);
  if (!body) continue;
  const deps = new Set();
  for (const d of body.matchAll(/\b([a-z][a-zA-Z0-9_]*)\b/g)) {
    if (d[1] !== name) deps.add(d[1]);
  }
  derived.set(name, deps);
}

/**
 * Resolusi rekursif: akar ekspresi -> himpunan state asal.
 */
// Alias eksplisit untuk identitas turunan yang tidak dapat diresolusi statis
// (ekspresiuseMemo-nya panjang & memuat blok bersarang).
const ALIAS_TURUNAN = {
  activeStudent: ['students', 'userAccounts'],
  activeUjian: ['daftarUjianPenguji'],
  activeKoorprodiProfile: ['userAccounts'],
  activeDosenProfile: ['userAccounts'],
  activeAdminProfile: ['userAccounts'],
  activeSuperadminProfile: ['userAccounts']
};

function resolveAsal(nama, depth = 0) {
  if (depth > 8) return new Set();
  if (allStates.has(nama)) return new Set([nama]);
  if (ALIAS_TURUNAN[nama]) {
    const hasil = new Set();
    for (const a of ALIAS_TURUNAN[nama]) for (const s of resolveAsal(a, depth + 1)) hasil.add(s);
    return hasil;
  }
  const deps = derived.get(nama);
  if (!deps) return new Set();
  const hasil = new Set();
  for (const d of deps) {
    for (const s of resolveAsal(d, depth + 1)) hasil.add(s);
  }
  return hasil;
}

// ---------------------------------------------------------------------------
// (4) Peta prop -> state asal untuk setiap halaman
// ---------------------------------------------------------------------------
const pages = walk(path.join(SRC, 'pages')).filter((f) => !f.endsWith('index.js'));

const rows = [];

for (const f of pages) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(SRC, f);

  // Ambil nama-nama prop yang didestructure pada parameter fungsi komponen.
  const props = new Set();
  const sig = src.match(/export default function \w+\(\s*\{([\s\S]*?)\}\s*\)/);
  if (sig) {
    for (const m of sig[1].matchAll(/(\w+)\s*(?:=|\n|,)/g)) {
      if (m[1] && !['props'].includes(m[1])) props.add(m[1]);
    }
  }

  // Cek apakah halaman memakai API secara langsung.
  const direct = [...new Set([...src.matchAll(/\b([a-zA-Z]+Api)\.([a-zA-Z0-9_]+)\s*\(/g)].map((m) => `${m[1]}.${m[2]}`))];

  // Untuk setiap prop, tentukan asalnya: apakah berasal dari state yang
  // terhidrasi/ditulis backend, atau dari state statis.
  const dariBackend = [];
  const dariStatis = [];
  const takTerlacak = [];

  for (const p of props) {
    // Cari penyebutan prop di App.jsx pada JSX: prop={stateVar}
    const rx = new RegExp(`\\b${p}=\\{([A-Za-z0-9_.]+)\\}`, 'g');
    let found = false;
    for (const m of appSrc.matchAll(rx)) {
      const expr = m[1];
      const root = expr.split(/[.[]/)[0];
      found = true;
      const asal = resolveAsal(root);
      const keBackend = [...asal].filter((s) => hydrated.has(s) || writtenByApi.has(s));
      const keStatis = [...asal].filter((s) => !hydrated.has(s) && !writtenByApi.has(s));
      if (keBackend.length) dariBackend.push(`${p}<-${[...new Set(keBackend)].join('+')}`);
      else if (keStatis.length) dariStatis.push(`${p}<-${[...new Set(keStatis)].join('+')}`);
      else takTerlacak.push(`${p}<-${expr}`);
    }
    if (!found) {
      // Prop mungkin diteruskan utuh (mis. { ...someState })
      const rx2 = new RegExp(`\\b${p}\\b\\s*[,}]`, 'g');
      if (rx2.test(appSrc)) takTerlacak.push(`${p}`);
    }
  }

  const terhubungBackend = direct.length > 0 || dariBackend.length > 0;
  rows.push({ rel, props: [...props], direct, dariBackend, dariStatis, takTerlacak, terhubungBackend });
}

// State yang bukan data (status sinkronisasi, penanda UI) tidak boleh
// dihitung sebagai bukti koneksi ke backend.
for (const bukan of ['isSyncingBackend', 'isBackendOnline', 'backendSyncTime', 'selectedNaskahId', 'isChangePasswordOpen', 'mustChangePassword', 'currentRole']) {
  hydrated.delete(bukan);
  writtenByApi.delete(bukan);
}

const terhubung = rows.filter((r) => r.terhubungBackend);
const murniLokal = rows.filter((r) => !r.terhubungBackend);

console.log('====================================================');
console.log('KONEKTIVITAS FRONTEND -> BACKEND (analisis akurát)');
console.log('====================================================');
console.log(`Halaman total                    : ${rows.length}`);
console.log(`Terhubung ke backend             : ${terhubung.length}`);
console.log(`Tanpa jalur backend sama sekali  : ${murniLokal.length}`);
console.log(`\n  State terhidrasi dari backend  : ${hydrated.size} (${[...hydrated].join(', ')})`);
console.log(`  State ditulis lewat API handler: ${writtenByApi.size} (${[...writtenByApi].join(', ')})\n`);

console.log('--- HALAMAN YANG TIDAK TERHUBUNG KE BACKEND ---');
for (const r of murniLokal) {
  console.log(`  ${r.rel}`);
  if (r.dariStatis.length) console.log(`      hanya dari state statis: ${r.dariStatis.join(', ')}`);
  if (r.takTerlacak.length) console.log(`      tidak terlacak: ${r.takTerlacak.join(', ')}`);
}
console.log('');
