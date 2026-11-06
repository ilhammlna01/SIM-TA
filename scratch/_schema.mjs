import fs from 'node:fs';

const pinSeed = fs.readFileSync('server/database/pinSeed.js', 'utf8');
const pinAuth = fs.readFileSync('server/utils/pinAuth.js', 'utf8');

const ambil = (teks, pola) => {
  const m = teks.match(pola);
  return m ? m[0] : null;
};

const imp = ambil(pinSeed, /import\s*\{[^}]*\}\s*from\s*'[^']*pinAuth[^']*';/);
const exp = ambil(pinAuth, /export\s+const\s+[A-Za-z_$][\w$]*\s*=\s*KONTEKS_DEFAULT;/);

console.log('IMPORT :', JSON.stringify(imp));
console.log('EKSPOR :', JSON.stringify(exp));

// Bandingkan nama identifier di kedua tempat.
const namaImport = (imp.match(/PIN_\w+/) || [])[0];
const namaEkspor = (exp.match(/PIN_\w+/) || [])[0];
console.log('\nnama import:', JSON.stringify(namaImport), 'len', namaImport?.length);
console.log('nama ekspor:', JSON.stringify(namaEkspor), 'len', namaEkspor?.length);
console.log('sama persis:', namaImport === namaEkspor);

const kode = (s) => [...s].map((c) => c.codePointAt(0));
const ka = kode(namaImport || '');
const kb = kode(namaEkspor || '');
for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
  if (ka[i] !== kb[i]) {
    console.log(`  beda di posisi ${i}: import U+${(ka[i] || 0).toString(16)} vs ekspor U+${(kb[i] || 0).toString(16)}`);
  }
}
