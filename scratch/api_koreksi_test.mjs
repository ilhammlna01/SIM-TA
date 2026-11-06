const BASE = 'http://localhost:5001/api';

async function login(id) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: id, password: 'FEB-UTM-2026' })
  });
  return (await r.json()).token;
}

const token = await login('197703032003121002');

async function post(body, label) {
  const r = await fetch(`${BASE}/penguji/koreksi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  let j = {}; try { j = await r.json(); } catch {}
  console.log(`\n[${label}] -> HTTP ${r.status}`);
  console.log('  message:', j.message || '(none)');
}

// 1) Payload persis seperti yang mungkin dikirim frontend (ujianId dari daftar kosong)
await post({
  id: `kor-test-${Date.now()}`,
  ujianId: 'uj-pgj-1', // ada di DB
  mhsNim: '210211100142', mhsNama: 'Dinda Ayu Larasati', jenjang: 'S1',
  pengujiId: 'usr-05', namaPenguji: 'Dr. Faidal, S.E., M.M.',
  bagianNaskah: 'BAB I', halaman: 'Halaman 5',
  catatanKoreksi: 'Uji koreksi E2E', tingkatUrgensi: 'Sedang'
}, 'ujianId VALID (uj-pgj-1)');

// 2) ujianId yang tidak ada (kemungkinan yang dikirim frontend saat daftar kosong)
await post({
  id: `kor-test2-${Date.now()}`,
  ujianId: 'ujian-tidak-ada',
  mhsNim: '210211100142', mhsNama: 'Dinda Ayu Larasati', jenjang: 'S1',
  pengujiId: 'usr-05', namaPenguji: 'Dr. Faidal, S.E., M.M.',
  bagianNaskah: 'BAB I', halaman: 'Halaman 5',
  catatanKoreksi: 'Uji koreksi E2E', tingkatUrgensi: 'Sedang'
}, 'ujianId TIDAK ADA (ujian-tidak-ada)');

// 3) Tanpa ujianId (null)
await post({
  id: `kor-test3-${Date.now()}`,
  mhsNim: '210211100142', mhsNama: 'Dinda Ayu Larasati', jenjang: 'S1',
  pengujiId: 'usr-05', namaPenguji: 'Dr. Faidal, S.E., M.M.',
  bagianNaskah: 'BAB I', halaman: 'Halaman 5',
  catatanKoreksi: 'Uji koreksi E2E', tingkatUrgensi: 'Sedang'
}, 'tanpa ujianId (null)');
