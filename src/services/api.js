/**
 * Frontend API Service - SIM Tugas Akhir FEB UTM
 * Menghubungkan antarmuka pengguna dengan Backend REST API & Database SQLite (Port 5001).
 * Dirancang dengan mode *graceful fallback*: jika backend aktif, data diambil langsung dari SQLite;
 * jika backend belum dinyalakan, sistem otomatis menggunakan cache LocalStorage.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:5001/api' : '/api');

/**
 * Token Session Management (JWT)
 */
export function getAuthToken() {
  try {
    return localStorage.getItem('utm_auth_token') || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem('utm_auth_token', token);
    } else {
      localStorage.removeItem('utm_auth_token');
    }
  } catch {}
}

export function authHeaders(customHeaders = {}) {
  const token = getAuthToken();
  const headers = { ...customHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * DEPRECATED (Audit 21 Oktober 2026): menyisipkan token JWT sesi ke dalam URL
 * berkas membuat kredensial bocor ke riwayat peramban, header Referer, dan log
 * akses reverse proxy. Gunakan `openProtectedFile(url)` yang memperoleh TOKEN
 * UNDUHAN berumur pendek & terikat satu berkas.
 *
 * Fungsi ini dipertahankan hanya sebagai fallback kompatibilitas dan TIDAK
 * lagi menyisipkan token sesi ke URL.
 */
export function withAuthToken(url) {
  return url;
}

/**
 * Membuka berkas terproteksi di tab/jendela baru.
 *
 * Audit 21 Oktober 2026: token SESI tidak lagi disisipkan ke query string
 * (kredensial bocor ke history peramban, header Referer, dan log proxy).
 * Server kini menerbitkan TOKEN UNDUHAN berumur pendek (2 menit) yang
 * terikat pada satu berkas tertentu.
 */
export async function openProtectedFile(url) {
  if (!url || typeof url !== 'string') return false;

  const parsed = parseProtectedFileUrl(url);
  if (!parsed) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/storage/download-token`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(parsed)
    });
    const data = await res.json();
    if (!res.ok || !data.downloadUrl) {
      throw new Error(data.error || 'Gagal memperoleh izin unduhan berkas.');
    }
    const target = new URL(data.downloadUrl, window.location.origin);
    window.open(target.toString(), '_blank', 'noopener,noreferrer');
    return true;
  } catch (err) {
    console.error('Gagal membuka berkas terproteksi:', err);
    return false;
  }
}

/**
 * Mengurai URL berkas terproteksi menjadi { category, filename }.
 */
export function parseProtectedFileUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const marker = '/api/storage/files/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  const rest = url.slice(idx + marker.length).split('?')[0];
  const parts = rest.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const category = decodeURIComponent(parts[0]);
  const filename = decodeURIComponent(parts.slice(1).join('/'));
  if (!category || !filename) return null;
  return { category, filename };
}

/**
 * Cek status kesehatan koneksi backend
 */
export async function checkBackendOnline() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'online';
  } catch {
    return false;
  }
}

// ==========================================
// 1. ADMIN AKADEMIK API
// ==========================================
export const adminApi = {
  // ---------------------------------------------------------------
  // Otorisasi PIN Dekanat & penerbitan SK massal
  // (Audit 22 Oktober 2026 — butir #1)
  // ---------------------------------------------------------------

  /** Memverifikasi PIN Dekanat; server menerbitkan token scoped berumur pendek. */
  verifikasiPin: async (pin) => {
    const res = await fetch(`${API_BASE_URL}/admin/verifikasi-pin`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/sk/bulk`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/status-pin`, { headers: authHeaders() });
    const json = await res.json().catch(() => ({}));
    return json?.data || null;
  },

  getVerifikasi: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/verifikasi-berkas`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  updateVerifikasi: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/admin/verifikasi-berkas/${id}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  createVerifikasi: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/admin/verifikasi-berkas`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getSK: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/sk`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  createSK: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/admin/sk`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getRuangan: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/ruangan`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  alokasiRuangan: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/admin/ruangan`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  deleteRuangan: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/ruangan/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return res.json();
  },
  getJadwalTahapan: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE_URL}/admin/jadwal-tahapan?${query}` : `${API_BASE_URL}/admin/jadwal-tahapan`;
    const res = await fetch(url, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  createJadwalTahapan: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/admin/jadwal-tahapan`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  updateJadwalTahapan: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/admin/jadwal-tahapan/${id}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  deleteJadwalTahapan: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/jadwal-tahapan/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return res.json();
  }
};

// ==========================================
// 2. SUPER ADMIN API
// ==========================================
export const superadminApi = {
  getProdi: async () => {
    const res = await fetch(`${API_BASE_URL}/superadmin/prodi`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  createProdi: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/superadmin/prodi`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  updateProdi: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/superadmin/prodi/${id}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getTahapan: async () => {
    const res = await fetch(`${API_BASE_URL}/superadmin/tahapan`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  updateTahapan: async (jenjang, payload) => {
    const res = await fetch(`${API_BASE_URL}/superadmin/tahapan/${jenjang}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getKuota: async () => {
    const res = await fetch(`${API_BASE_URL}/superadmin/kuota`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  updateKuota: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/superadmin/kuota/${id}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getUsers: async () => {
    const res = await fetch(`${API_BASE_URL}/superadmin/users`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  createUser: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/superadmin/users`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  importUsersBulk: async (usersList) => {
    const res = await fetch(`${API_BASE_URL}/superadmin/users/bulk`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ users: usersList })
    });
    return res.json();
  },
  updateUser: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/superadmin/users/${id}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  deleteUser: async (id) => {
    const res = await fetch(`${API_BASE_URL}/superadmin/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return res.json();
  },
  resetPassword: async (id) => {
    const res = await fetch(`${API_BASE_URL}/superadmin/users/${id}/reset-password`, {
      method: 'POST',
      headers: authHeaders()
    });
    return res.json();
  }
};

// ==========================================
// 3. DEWAN PENGUJI API
// ==========================================
export const pengujiApi = {
  getUjian: async () => {
    const res = await fetch(`${API_BASE_URL}/penguji/ujian`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  submitNilai: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/penguji/ujian/${id}/penilaian`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getKoreksi: async () => {
    const res = await fetch(`${API_BASE_URL}/penguji/koreksi`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  createKoreksi: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/penguji/koreksi`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  updateStatusKoreksi: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/penguji/koreksi/${id}/status`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  deleteKoreksi: async (id) => {
    const res = await fetch(`${API_BASE_URL}/penguji/koreksi/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return res.json();
  },

  // ---------------------------------------------------------------
  // Penjadwalan Ujian & Penetapan Dewan Penguji (Audit 21 Okt 2026,
  // temuan AZ-A1). Sebelumnya tidak ada endpoint sama sekali sehingga
  // alur ini hanya hidup di state lokal peramban.
  // ---------------------------------------------------------------
  createUjian: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/penguji/ujian`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || 'Gagal menyimpan penjadwalan ujian.');
      err.status = res.status;
      err.code = json.code;
      err.invalid = json.invalid;
      throw err;
    }
    return json;
  },

  updatePanel: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/penguji/ujian/${id}/panel`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || 'Gagal memperbarui susunan dewan penguji.');
      err.status = res.status;
      err.code = json.code;
      throw err;
    }
    return json;
  },

  deleteUjian: async (id) => {
    const res = await fetch(`${API_BASE_URL}/penguji/ujian/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || 'Gagal membatalkan penjadwalan ujian.');
      err.status = res.status;
      err.code = json.code;
      throw err;
    }
    return json;
  }
};

// ==========================================
// 4. PROSES AKADEMIK (BIMBINGAN, NASKAH, PUBLIKASI, TAHAPAN)
// ==========================================
export const akademikApi = {
  // --- Bimbingan ---
  getBimbingan: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/akademik/bimbingan${qs ? `?${qs}` : ''}`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  createBimbingan: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/akademik/bimbingan`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  approveBimbingan: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/akademik/bimbingan/${id}/approval`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  deleteBimbingan: async (id) => {
    const res = await fetch(`${API_BASE_URL}/akademik/bimbingan/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return res.json();
  },

  // --- Naskah (Versioning) ---
  getNaskah: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/akademik/naskah${qs ? `?${qs}` : ''}`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  createNaskah: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/akademik/naskah`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getKomentarNaskah: async (versiId) => {
    const res = await fetch(`${API_BASE_URL}/akademik/naskah/${versiId}/komentar`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  addKomentarNaskah: async (versiId, payload) => {
    const res = await fetch(`${API_BASE_URL}/akademik/naskah/${versiId}/komentar`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || 'Gagal menyimpan catatan telaah.');
      err.status = res.status;
      throw err;
    }
    return json;
  },

  // Audit 21 Oktober 2026 (temuan AZ-A2): diperlukan untuk menutup/ MENYELESAIKAN
  // catatan telaah dari antarmuka Review Naskah.
  updateKomentarStatus: async (komentarId, status) => {
    const res = await fetch(`${API_BASE_URL}/akademik/komentar/${komentarId}/status`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || 'Gagal memperbarui status catatan telaah.');
      err.status = res.status;
      throw err;
    }
    return json;
  },

  // Audit 21 Oktober 2026 (BP-2): persetujuan naskah oleh pembimbing.
  // Terpisah tegas dari persetujuan TAHAP, yang memakai approveTahap.
  approveNaskah: async (versiId, payload) => {
    const res = await fetch(`${API_BASE_URL}/akademik/naskah/${encodeURIComponent(versiId)}/approval`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || 'Gagal menyimpan persetujuan naskah.');
      err.status = res.status;
      err.code = json.code;
      throw err;
    }
    return json;
  },

  // --- Publikasi / Portofolio ---
  getPublikasi: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/akademik/publikasi${qs ? `?${qs}` : ''}`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  createPublikasi: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/akademik/publikasi`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  verifikasiPublikasi: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/akademik/publikasi/${id}/verifikasi`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // --- Tugas Akhir & Tahapan ---
  // --- State Machine Tahapan Tugas Akhir (Audit 21 Okt 2026 — AZ-A2) ---
  ajukanTahap: async (taId, kodeTahap, payload = {}) => {
    const res = await fetch(`${API_BASE_URL}/akademik/tugas-akhir/${encodeURIComponent(taId)}/tahap/${encodeURIComponent(kodeTahap)}/ajukan`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || 'Gagal mengajukan tahap.');
      err.status = res.status;
      err.code = json.code;
      throw err;
    }
    return json;
  },

  getProgresTugasAkhir: async (taId) => {
    const res = await fetch(`${API_BASE_URL}/akademik/tugas-akhir/${encodeURIComponent(taId)}/progres`, {
      headers: authHeaders()
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || 'Gagal memuat progres tugas akhir.');
      err.status = res.status;
      throw err;
    }
    return json.data;
  },

  // Audit 21 Oktober 2026 (P0-2): status kelulusan mahasiswa
  // (Proses / Siap Pengesahan / Lulus).
  getStatusKelulusan: async () => {
    const res = await fetch(`${API_BASE_URL}/akademik/status-kelulusan`, {
      headers: authHeaders()
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || 'Gagal memuat status kelulusan.');
      err.status = res.status;
      throw err;
    }
    return json.data;
  },

  getTugasAkhir: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/akademik/tugas-akhir${qs ? `?${qs}` : ''}`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  getTugasAkhirDetail: async (idOrNim) => {
    const res = await fetch(`${API_BASE_URL}/akademik/tugas-akhir/${encodeURIComponent(idOrNim)}`, {
      headers: authHeaders()
    });
    const json = await res.json();
    return json.data;
  },
  updatePembimbing: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/akademik/tugas-akhir/${id}/pembimbing`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  ajukanTahap: async (id, kode, payload = {}) => {
    const res = await fetch(`${API_BASE_URL}/akademik/tugas-akhir/${id}/tahap/${kode}/ajukan`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  approveTahap: async (id, kode, payload = {}) => {
    const res = await fetch(`${API_BASE_URL}/akademik/tugas-akhir/${id}/tahap/${kode}/approve`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  verifikasiTahap: async (id, kode, payload = {}) => {
    const res = await fetch(`${API_BASE_URL}/akademik/tugas-akhir/${id}/tahap/${kode}/verifikasi`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  selesaikanTahap: async (id, kode, payload = {}) => {
    const res = await fetch(`${API_BASE_URL}/akademik/tugas-akhir/${id}/tahap/${kode}/selesai`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};

// ==========================================
// 5. STORAGE & FILE MANAGEMENT API
// ==========================================
export const storageApi = {
  upload: async (file, category = 'naskah') => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/storage/upload/${category}`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData
    });
    return res.json();
  },
  listFiles: async (category) => {
    const res = await fetch(`${API_BASE_URL}/storage/list/${category}`, {
      headers: authHeaders()
    });
    return res.json();
  },
  deleteFile: async (category, filename) => {
    const res = await fetch(`${API_BASE_URL}/storage/files/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return res.json();
  },
  // Audit 21 Oktober 2026: token unduhan berumur pendek & terikat satu berkas.
  getDownloadToken: async (category, filename) => {
    const res = await fetch(`${API_BASE_URL}/storage/download-token`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ category, filename })
    });
    return res.json();
  }
};

// ==========================================
// 6. GENERATOR DOKUMEN & VERIFIKASI QR API
// ==========================================
export const documentApi = {
  generateBeritaAcara: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/documents/generate-berita-acara`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  generatePengesahan: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/documents/generate-pengesahan`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  generateBimbingan: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/documents/generate-bimbingan`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  generateSuratTugasPenguji: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/documents/generate-surat-tugas-penguji`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  generateSuratTugasPembimbing: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/documents/generate-surat-tugas-pembimbing`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  generateSKDekan: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/documents/generate-sk-dekan`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  generateExamPackage: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/documents/generate-exam-package`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getAutoCounters: async () => {
    const res = await fetch(`${API_BASE_URL}/documents/auto-counters`, {
      headers: authHeaders()
    });
    return res.json();
  },
  updateAutoCounter: async (docType, payload) => {
    const res = await fetch(`${API_BASE_URL}/documents/auto-counters/${encodeURIComponent(docType)}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  verify: async (code) => {
    const res = await fetch(`${API_BASE_URL}/documents/verify/${encodeURIComponent(code)}`);
    return res.json();
  },
  getArchive: async () => {
    const res = await fetch(`${API_BASE_URL}/documents/archive`, {
      headers: authHeaders()
    });
    return res.json();
  }
};

// ==========================================
// 7. NOTIFIKASI REAL-TIME & EMAIL SERVICE API
// ==========================================
export const notificationApi = {
  getNotifications: async (role = 'semua', userId = '') => {
    let url = `${API_BASE_URL}/notifications?role=${encodeURIComponent(role)}`;
    if (userId) {
      url += `&userId=${encodeURIComponent(userId)}`;
    }
    const res = await fetch(url, {
      headers: authHeaders()
    });
    return res.json();
  },
  markAsRead: async (id) => {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: authHeaders()
    });
    return res.json();
  },
  markAllAsRead: async (role = 'semua') => {
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ role })
    });
    return res.json();
  },
  broadcast: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/notifications/broadcast`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getEmailLogs: async () => {
    const res = await fetch(`${API_BASE_URL}/notifications/email-logs`, {
      headers: authHeaders()
    });
    return res.json();
  },
  sendEmail: async (eventType, payload) => {
    const res = await fetch(`${API_BASE_URL}/notifications/send-email`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ eventType, payload })
    });
    return res.json();
  },
  // Audit 21 Oktober 2026: token unscoped (sesi penuh) tidak lagi dipakai di
  // URL. Server menerbitkan token scoped berumur pendek khusus aliran SSE.
  getStreamUrl: async () => {
    const res = await fetch(`${API_BASE_URL}/notifications/stream-token`, {
      method: 'POST',
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.streamUrl) {
      return null;
    }

    // Audit 21 Oktober 2026: streamUrl yang dikembalikan server bersifat
    // RELATIF ("/api/notifications/stream?st=..."). URL tersebut HARUS
    // diselesaikan terhadap ORIGIN BACKEND, bukan origin halaman. Sebelumnya
    // diselesaikan terhadap window.location.origin sehingga pada mode
    // pengembangan (Vite :5173) EventSource menembak ke :5173/api/... yang
    // tidak memiliki proxy -> 404 dan aliran notifikasi real-time MATI.
    const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin;
    return new URL(data.streamUrl, apiOrigin).toString();
  }
};

// ==========================================
// 8. SISTEM AUTENTIKASI INSTITUSIONAL (AUTH API)
// ==========================================
export const authApi = {
  login: async ({ identifier, password }) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal melakukan autentikasi.');
    }
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Sesi telah kedaluwarsa.');
    }
    return data;
  },

  changePassword: async ({ userId, oldPassword, newPassword }) => {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ userId, oldPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal mengubah kata sandi.');
    }
    return data;
  },

  requestPasswordReset: async (identifier) => {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal memproses permintaan reset sandi.');
    }
    return data;
  },

  switchRole: async (targetRole) => {
    const res = await fetch(`${API_BASE_URL}/auth/switch-role`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ targetRole })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal mengalihkan peran kerja.');
    }
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  logout: async (userId) => {
    try {
      setAuthToken(null);
      const res = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ userId })
      });
      return await res.json();
    } catch {
      return { success: true };
    }
  }
};
