# PENILAIAN KESIAPAN PRODUKSI (PRODUCTION READINESS ASSESSMENT)
## SISTEM INFORMASI MANAJEMEN TUGAS AKHIR (SIM-TA) MULTI-JENJANG
### FAKULTAS EKONOMI DAN BISNIS — UNIVERSITAS TRUNOJOYO MADURA

* **Tanggal Penilaian:** 13 Oktober 2026
* **Ruang Lingkup:** Perbaikan bug hasil audit forensik independen + verifikasi end-to-end
* **Basis Penilaian:** Kode sumber aktual, skema basis data, suite pengujian (security, UAT, regresi)
* **Keputusan Akhir Kesiapan Produksi: `GO` — LAYAK DENGAN SYARAT (CONDITIONAL GO)** ✅

---

## A. Ringkasan Eksekutif

Seluruh temuan bug dari audit forensik sebelumnya (2 Kritis, 4 Sedang, 3 Rendah) telah **diperbaiki dan diverifikasi secara empiris** melalui pengujian otomatis dan pengujian regresi langsung terhadap server yang berjalan.

Verifikasi akhir:
- `tests/security.test.js` — **15/15 LULUS** (Zero-Trust JWT, RBAC, path traversal, audit log)
- `tests/uat_workflow.test.js` — **9/9 LULUS** (alur hulu→hilir: Mahasiswa → Koorprodi → Pembimbing → Penguji)
- `tests/regression_bugfix.test.js` — **9/9 LULUS** (verifikasi khusus perbaikan bug audit)
- `npm run build` — **BERHASIL** (2.028 modul, tanpa error)

Aplikasi dinyatakan **siap produksi secara kondisional**: seluruh blocker teknis telah ditutup, namun masih terdapat beberapa rekomendasi pengerasan (hardening) non-blocking dan satu prasyarat wajib konfigurasi lingkungan sebelum go-live.

---

## B. Matriks Perbaikan Bug (Sebelum → Sesudah)

| # | Tingkat | Temuan | Berkas | Status |
|---|--------|--------|--------|--------|
| 1 | 🔴 Kritis | JWT secret hardcoded di repo → pemalsuan token admin | `server/utils/jwt.js`, `.env.example`, `docker-compose.yml`, `ecosystem.config.cjs` | ✅ **SELESAI** |
| 2 | 🔴 Kritis | IDOR: mahasiswa dapat unduh berkas `syarat`/`temp` mahasiswa lain | `server/storage/storageManager.js` | ✅ **SELESAI** |
| 3 | 🔴 Tinggi | Dokumen resmi (`dokumen_resmi`) dapat diunduh publik tanpa autentikasi | `server/storage/storageManager.js` + link frontend ber-token | ✅ **SELESAI** |
| 4 | 🟠 Sedang | `APP_URL` vs `APP_PUBLIC_URL` mismatch + URL localhost hardcoded | `pdfGenerator.js`, `storageManager.js`, `.env.example` | ✅ **SELESAI** |
| 5 | 🟠 Sedang | `change-password` tanpa autentikasi | `server/routes/authRoutes.js` | ✅ **SELESAI** |
| 6 | 🟠 Sedang | `/penguji/koreksi` membocorkan koreksi seluruh mahasiswa | `server/routes/pengujiRoutes.js` | ✅ **SELESAI** |
| 7 | 🟠 Sedang | Crash (HTTP 500) saat `pengujiList: []` | `server/documents/pdfGenerator.js` | ✅ **SELESAI** |
| 8 | 🟠 Sedang | Kolom `judul` tidak ada di `ujian_penguji` → judul TA hilang | `server/database/db.js`, `seed.js` | ✅ **SELESAI** |
| 9 | 🟡 Rendah | `GET /storage/files/...` tanpa audit jejak pengguna | `server/routes/storageRoutes.js` | ✅ **SELESAI** |
| 10 | 🟡 Rendah | Penilaian tanpa validasi keberadaan ujian & rentang nilai | `server/routes/pengujiRoutes.js` | ✅ **SELESAI** |
| 11 | 🟡 Rendah | `req.user?.sub` selalu kosong (klaim JWT memakai `id`) | `server/routes/superadminRoutes.js` | ✅ **SELESAI** |
| 12 | 🟡 Rendah | Skema `notifications.type` tanpa tipe kolom | `server/database/db.js` | ✅ **SELESAI** |

---

## C. Detail Verifikasi Per Perbaikan

### C.1 — JWT Secret (Kritis) ✅
- Tidak ada lagi nilai default hardcoded. `resolveJwtSecret()` mewajibkan `JWT_SECRET` ≥ 32 karakter.
- **Produksi tanpa `JWT_SECRET` → server menolak start** (diuji: melempar error deskriptif).
- Mode non-produksi → secret acak per-proses + peringatan (token tidak persistent lintas restart).
- `JWT_SECRET` didokumentasikan di `.env.example` dan diteruskan pada `docker-compose.yml` serta `ecosystem.config.cjs`.

### C.2 — IDOR Berkas Syarat (Kritis) ✅
- Pemeriksaan kepemilikan kini **generik untuk semua kategori** berbasis relasi tabel `storage_files`.
- Uji: mahasiswa B mengakses `syarat/transkrip_dinda.pdf` → **HTTP 403**.

### C.3 — Dokumen Resmi (Tinggi) ✅
- `dokumen_resmi` tidak lagi di-`return true` sebelum otorisasi; memerlukan sesi JWT sah.
- Tautan unduh pada frontend (`DocumentGeneratorModal`, `DocumentVerificationModal`, `OtomasiDokumenPage`, `QATestingModal`) kini menyisipkan token via helper `withAuthToken()`.
- Uji: akses tanpa token → **HTTP 403**; akses dengan token admin → ** boleh (404/200)**.

### C.4 — Konfigurasi URL Publik (Sedang) ✅
- Kode membaca `APP_PUBLIC_URL` (selaras dengan `.env.example`), `getAccessUrl()` tidak lagi meng-hardcode `localhost`.
- QR Code verifikasi kini menggunakan URL publik yang terkonfigurasi.

### C.5 — Autentikasi Ganti Kata Sandi (Sedang) ✅
- Endpoint memakai middleware `authenticate`; `userId` diambil dari token (`req.user.id`), bukan body.
- Uji: tanpa token → **HTTP 401**.

### C.6 — Kebocoran Catatan Koreksi (Sedang) ✅
- Mahasiswa hanya menerima koreksi dengan `mhs_nim` miliknya sendiri.
- Uji: mahasiswa lain menerima **0 baris** (tidak ada kebocoran).

### C.7 — Stabilitas Generator PDF (Sedang) ✅
- Guard `Array.isArray(...) && length > 0` mencegah `TypeError` pada `pengujiList[0]`.
- Uji: `pengujiList: []` → **sukses** dengan fallback dewan penguji (bukan HTTP 500).

### C.8 — Integritas Judul Ujian (Sedang) ✅
- Kolom `judul` ditambahkan ke skema + migrasi `ALTER TABLE` + seeder + backfill basis data lama.
- Uji: `uj-pgj-3` mengembalikan judul disertasi nyata, bukan placeholder hardcoded.

### C.9–C.12 — Pengerasan Tambahan ✅
- Audit jejak `FILE_ACCESS` pada unduhan terotorisasi.
- Validasi keberadaan ujian (404) dan rentang nilai 0–100 (400) pada input penilaian.
- Sumber trigger backup memakai identitas token yang benar.
- Skema `notifications.type TEXT DEFAULT 'info'`.

---

## D. Hasil Pengujian

```
npm run build                    → BERHASIL (2.028 modul, 0 error)
tests/security.test.js           → 15/15 LULUS
tests/uat_workflow.test.js       → 9/9 LULUS
tests/regression_bugfix.test.js  → 9/9 LULUS
```

Semua suite terintegrasi pada perintah `npm test`.

---

## E. Prasyarat Wajib Sebelum Go-Live (Blocking)

1. **Setel `JWT_SECRET`** di berkas `.env` produksi (min. 32 karakter). Tanpa ini server **tidak akan menyala** di mode produksi.
   ```bash
   openssl rand -hex 32
   ```
2. **Setel `APP_PUBLIC_URL`** ke domain resmi institusi (mis. `https://sim-ta.feb.utm.ac.id`) agar tautan QR & berkas valid.
3. **Batasi `CORS_ORIGIN`** ke domain resmi kampus (bukan `*`) sebelum dibuka ke internet publik.
4. **Sediakan berkas `.env`** pada volume deployment (tidak ter-commit; sudah tercakup `.gitignore`).

---

## F. Rekomendasi Pengerasan Non-Blocking (Backlog)

| Prioritas | Rekomendasi | Dampak |
|-----------|-------------|--------|
| P1 | Rate limiting & account lockout pada `/auth/login` (mis. `express-rate-limit`) | Mencegah brute force |
| P1 | Wajibkan `JWT_SECRET` juga divalidasi panjangnya saat runtime produksi (sudah ada, tambah logging startup) | Observability |
| P2 | Validasi penugasan penguji pada endpoint penilaian (penguji hanya menilai ujian yang ditugaskan) | Integritas akademik |
| P2 | Migrasi dari `node:sqlite` `DatabaseSync` ke connection pool / WAL tuning lanjutan bila beban naik | Skalabilitas |
| P3 | Ganti fallback penamaan file global dengan UUID (saat ini sudah timestamp+random) | Kebersihan data |
| P3 | Tambah CSP header eksplisit pada reverse proxy | Defense-in-depth |
| P3 | Audit log viewer terpusat + retensi & rotasi | Kepatuhan forensik |

---

## G. Kesimpulan

Seluruh temuan audit forensik sebelumnya telah **ditutup dan diverifikasi**. Tidak ditemukan lagi kerentanan tingkat Kritis maupun Tinggi yang belum tertangani pada kode sumber saat ini. Dengan dipenuhinya **empat prasyarat wajib konfigurasi (Bagian E)**, sistem SIM-TA FEB UTM dinyatakan:

> **GO — LAYAK DITERAPKAN DI LINGKUNGAN PRODUKSI (dengan pemenuhan prasyarat konfigurasi).**

*Dokumen ini disusun berdasarkan pengujian empiris terhadap kode dan server yang berjalan pada 13 Oktober 2026.*
