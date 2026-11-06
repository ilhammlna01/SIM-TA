import fs from 'node:fs';

const file = 'src/services/api.js';
let t = fs.readFileSync(file, 'utf8');
let n = 0;

function sub(from, to) {
  if (t.includes(from)) { t = t.split(from).join(to); n++; console.log('  OK   ' + from.slice(0, 50).replace(/\n/g, ' ')); }
  else console.log('  --   tidak cocok: ' + from.slice(0, 50).replace(/\n/g, ' '));
}

// Temukan objek adminApi.
const anchor = "export const adminApi = {";
if (!t.includes(anchor)) { console.log('adminApi tidak ditemukan'); process.exit(1); }

const baru = `export const adminApi = {
  // ---------------------------------------------------------------
  // Otorisasi PIN Dekanat & penerbitan SK massal
  // (Audit 22 Oktober 2026 — butir #1)
  // ---------------------------------------------------------------

  /** Memverifikasi PIN Dekanat; server menerbitkan token scoped berumur pendek. */
  verifikasiPin: async (pin) => {
    const res = await fetch(\`\${API_BASE_URL}/admin/verifikasi-pin\`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ pin })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || 'PIN otorisasi ditolak.');
      err.status = res.status;
      err.code = json.code;
      throw err;
    }
    return json;
  },

  /** Menerbitkan SK untuk banyak mahasiswa sekaligus (wajib token otorisasi). */
  publikasiSkMassal: async (payload) => {
    const res = await fetch(\`\${API_BASE_URL}/admin/sk/bulk\`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || 'Penerbitan SK massal gagal.');
      err.status = res.status;
      err.code = json.code;
      throw err;
    }
    return json;
  },

  /** Melaporkan apakah PIN Dekanat sudah ditetapkan. */
  statusPin: async () => {
    const res = await fetch(\`\${API_BASE_URL}/admin/status-pin\`, { headers: authHeaders() });
    const json = await res.json().catch(() => ({}));
    return json?.data || null;
  },
`;

sub(anchor, baru);

fs.writeFileSync(file, t, 'utf8');
console.log(`\n${n} perubahan diterapkan.`);
