# Strategi Pengujian — SIM-TA FEB UTM

Dokumen ini menjelaskan rangkaian pengujian otomatis, cara menjalankannya, dan
apa yang divalidasi setiap suite.

## 1. Menjalankan seluruh pengujian

```bash
npm test
```

`npm test` memanggil `tests/run_all.mjs` yang:
1. Memeriksa apakah server API (`:5001`) sudah aktif.
2. Bila belum, menjalankan `node server/index.js` sementara, menunggu siap, lalu
   **menghentikannya kembali** setelah selesai.
3. Menjalankan 7 suite berurutan dan mencetak ringkasan lulus/gagal.

> Prasyarat: `dist/` sudah terbaru (`npm run build`) karena suite E2E menguji
> antarmuka produksi yang disajikan server pada `:5001`.

Per-suite:

| Perintah | Suite |
|---|---|
| `npm run test:security` | `tests/security.test.js` |
| `npm run test:uat` | `tests/uat_workflow.test.js` |
| `npm run test:regression` | `tests/regression_bugfix.test.js` |
| `npm run test:audit` | `tests/regression_audit.test.js` |
| `npm run test:phase12` | `tests/regression_phase12.test.js` |
| `npm run test:release` | `tests/regression_release.test.js` |
| `npm run test:e2e` | `tests/e2e_browser.test.js` |

## 2. Cakupan setiap suite

| Suite | Jenis | Fokus |
|---|---|---|
| `security.test.js` | API | RBAC, JWT, path traversal, IDOR, isolasi data |
| `uat_workflow.test.js` | API | Alur bisnis ujung-ke-ujung lintas peran |
| `regression_bugfix.test.js` | API | Regresi bug audit forensik (#2, #3, #6, #8, #10, …) |
| `regression_audit.test.js` | API | Regresi audit lanjutan |
| `regression_phase12.test.js` | API + DB | **Fase 1** persistensi aksi; **Fase 2** kontrak status API |
| `regression_release.test.js` | API + DB | Pengerasan rilis: gerbang wajib ganti kata sandi, header keamanan, SheetJS resmi |
| `e2e_browser.test.js` | Browser | Login 6 peran, penelusuran seluruh halaman, aksi tulis nyata |

### Detail `regression_phase12.test.js`
- **Bagian A (Kontrak API):** memastikan validasi `400`, not-found `404`, konflik
  duplikat `409`, dan RBAC `403` — bukan `500`.
- **Bagian B (Persistensi):** memastikan aksi yang dahulu frontend-only benar-benar
  menulis ke SQLite: bimbingan (mahasiswa & dosen), unggah naskah, unggah publikasi,
  persetujuan tahap oleh pembimbing, penetapan pembimbing oleh koorprodi, dan
  perubahan kuota oleh superadmin. Termasuk uji otorisasi: dosen **tidak boleh**
  mencatat bimbingan untuk mahasiswa bukan bimbingannya (`403`).
- Seluruh data uji dibersihkan otomatis di akhir (baris `bimbingan_log`,
  `naskah_versi`, `publikasi`, dan `audit_log` bertanda `REGTEST-`).

### Detail `e2e_browser.test.js` (Playwright/Chromium)
1. **Login page:** id `#login-identifier` unik (bukan ganda) dan tidak ada
   panggilan `/api/admin/*` sebelum login.
2. **Per peran (6):** login via form resmi → menelusuri semua menu sidebar →
   memastikan jumlah halaman yang dirender sesuai harapan, tanpa page error
   (`ReferenceError`), dan **tanpa respons `401` setelah login**.
3. **Aksi tulis nyata:** mahasiswa mencatat sesi bimbingan dari UI → diverifikasi
   bertambah di SQLite, lalu dibersihkan.
4. **Banner sinkronisasi (Fase 2):** dengan respons API diperlambat, banner
   "Menyinkronkan Data Akademik" harus tampil saat sinkronisasi aktif.
5. **Gerbang ganti kata sandi (rilis):** setelah admin dikunci ke kata sandi
   sementara, dialog "Wajib Ganti Kata Sandi Sementara" harus tampil dan tidak
   memiliki tombol Batal (tidak dapat dilewati).
6. **Laporan HTML:** setiap asersi dicatat dan ditulis ke
   `test-results/e2e-report.html` (diunggah sebagai artefak di CI).

## 3. Integrasi Berkesinambungan (CI)

Workflow `.github/workflows/ci.yml` berjalan pada setiap push/PR:
1. Checkout + setup Node.js + `npm ci`.
2. `npx playwright install --with-deps chromium`.
3. `npm run build`.
4. `npm test` (runner menyalakan/mematikan server otomatis).
5. Unggah `test-results/e2e-report.html` sebagai artefak (retensi 14 hari).

## 3. Prinsip penulisan uji

- **Mandiri & bersih:** setiap suite membuat datanya sendiri dan membersihkannya;
  tidak bergantung pada urutan eksekusi atau sisa data suite lain.
- **Bukti langsung:** verifikasi dilakukan pada sumber kebenaran (HTTP status,
  atau baris SQLite), bukan sekadar pesan UI.
- **Gagal = kode keluar ≠ 0:** suite mengembalikan exit code 1 bila ada kegagalan,
  sehingga `run_all.mjs` (dan CI) dapat mendeteksi kegagalan.
- **Idempoten:** perubahan status (mis. tahap, kuota, pembimbing) dikembalikan ke
  nilai semula setelah pengujian.

## 4. Di luar cakupan otomatis (diverifikasi manual)

- Tata letak visual & responsivitas (diperiksa via screenshot, mis.
  `scratch/table_screenshots/`).
- Alur yang bergantung layanan eksternal (email SMTP) — diuji dengan mode simulasi.
- Konkurensi beban tinggi (hanya diuji fungsional via `uat_workflow.test.js`).

---

*Dokumen ini bagian dari Fase 3 (jaminan mutu) pada rencana pengembangan
SIM-TA FEB UTM.*
