# TODO — Pengerjaan Business Process & Cakupan Jenjang
**SIM-TA FEB UTM** · disusun 21 Oktober 2026 · diperbarui setelah Putaran Remediasi

> Legenda status: ✅ Selesai · 🔄 Sedang dikerjakan · ⏳ Tertunda · ❓ Perlu keputusan produk
>
> Gerbang regresi wajib: `npm test` · `npm run test:priority` · `npm run simulasi:az` ·
> `npm run scan:sql` · `npm run scan:konektivitas` · `npm run cek:fresh`

---

## Ringkasan Status

| Blok | Item | Status |
| :--- | :--- | :--- |
| P0-1 | Pemilihan rubrik D3 & S3 | ✅ Selesai |
| P0-2 | Status "Lulus Tugas Akhir" di dashboard | ✅ Selesai |
| P1-3 | Penegakan `rules_json` sebagai gerbang | ✅ Selesai |
| P1-4 | Cakupan uji S2 & D3 | ✅ Selesai |
| P2-5 | N+1 query & konsistensi `?nim=` | ✅ Selesai |
| P2-6 | Pemindahan token ke cookie `HttpOnly` | ⏳ Tertunda |
| P2-7 | Pencabutan selektif per perangkat (`jti`) | ⏳ Tertunda |
| P2-8 | Rate limiter ke store bersama | ⏳ Tertunda |
| P2-9 | Audit log viewer + retensi | ⏳ Tertunda |
| P3-10 | Hapus komponen khusus dev dari repo | ⏳ Tertunda |
| P3-11 | CSP `nonce` | ⏳ Tertunda |
| AZ-A2c | Endpoint penerbitan SK massal | ⏳ Tertunda (butuh desain) |
| B-1 | Makna status "Lulus" | ✅ Selesai (3 tingkat) |

---

## ✅ P0-1 — Pemilihan Rubrik D3 & S3

**Masalah.** `pengujiRoutes.js` hanya menghasilkan tiga nilai rubrik
(`D3_S1`, `S2`, `S3_KELAYAKAN`) padahal katalog berisi tujuh rubrik resmi.
D3 dinilai dengan rubrik Ujian Kelayakan Disertasi (ambang 70, bukan 56), dan
empat dari lima jenis ujian S3 memakai rubrik yang kelayakan.

**Bukti.** `src/data/pengujiData.js` — `D3_S1` ("Rubrik Ujian TA/Skripsi,
Program D3 & S1"), `S2`, `S3_KUALIFIKASI`, `S3_PROPOSAL`, `S3_KELAYAKAN`,
`S3_TERTUTUP`, `S3_TERBUKA`.

**Pengerjaan.**
- [x] Modul baru `server/academic/examRules.js` — satu sumber kebenaran untuk
      peta jenis-ujian→tahap, jenis-ujian→rubrik, dan rubrik bawaan per jenjang.
- [x] `resolveRubrikContext(jenjang, jenisUjian)` dengan penanda `fallback`
      untuk jenis ujian tak dikenal (tidak diam-diam memakai rubrik bawaan).
- [x] `GET /api/penguji/ujian` memakai modul tersebut.
- [x] Peta `JENIS_UJIAN_TAHAP` dipindahkan dari `adminRoutes.js` ke modul bersama.
- [x] 49 kombinasi jenis-ujian × jenjang yang tidak berlaku → `409
      EXAM_TYPE_NOT_APPLICABLE` (sebelumnya lolos tanpa gerbang).
- [x] Tanpa entri Tugas Akhir → `409 TA_NOT_INITIALIZED`.
- [x] `POST /superadmin/users` tidak lagi melaporkan `temporaryPassword` yang
      tidak berlaku pada akun yang sudah ada.
- [x] Uji: `tests/exam_rubric.test.js` (166 pemeriksaan).

## ✅ P0-2 — Status "Lulus Tugas Akhir" di Dashboard

**Masalah.** Backend sudah menghitung `tugas_akhir.status = 'Lulus Final'`
(`akademikRoutes.js:570`) dan mengeksposnya lewat `formatTa()`, tetapi nilainya
tidak pernah sampai ke dashboard mahasiswa — halaman memakai data statis.

**Pengerjaan.**
- [x] `GET /api/akademik/status-kelulusan` → tiga tingkat status:
      `Proses` / `Siap Pengesahan` / `Lulus` (Lulus diturunkan dari arsip
      **Lembar Pengesahan**), plus `Belum Mulai` bila belum ada TA.
- [x] `App.jsx` memuat status tersebut saat sinkronisasi backend.
- [x] `mahasiswa/DashboardPage.jsx` — panel ringkasan + badge status.
- [x] `mahasiswa/TahapanPage.jsx` — status TA pada ringkasan progres.
- [x] Uji: `tests/e2e_lulus_status.test.js` (8 pemeriksaan).

## ✅ P1-3 — `rules_json` sebagai Gerbang Sungguhan

**Masalah.** `minSKS`, `minToefl`, `maxTurnitin`, `skorKelulusanMin` tidak
dibaca kode mana pun, meski dapat diubah Super Admin lewat antarmuka —
mengubah angka yang tidak berpengaruh apa pun. `requires_publikasi` hanya aktif
untuk S2 & S3, padahal `rules_json` S1 & D3 juga menyebut syarat publikasi.

**Pengerjaan.**
- [x] Gerbang pendaftaran (`POST /api/admin/verifikasi-berkas`) menegakkan
      `minSKS`, `minToefl`, `maxTurnitin` dari `rules_json` → `409
      ACADEMIC_REQUIREMENT_NOT_MET` beserta field yang bermasalah.
- [x] `skorKelulusanMin` menjadi gerbang rekomendasi kelayakan → `409
      BELUM_MENCAPAI_SKOR_KELULUSAN`.
- [x] Migrasi: tahap akhir **semua** jenjang mewajibkan publikasi.
- [x] `koorprodi/PersyaratanPage.jsx` membaca ambang dari `rules_json`
      (bukan hardcode yang melenceng: S3 48 vs 42, D3 120 vs 90).
- [x] Form Super Admin diberi keterangan "aturan ini ditegakkan sistem".
- [x] Uji: `tests/rules_enforcement.test.js` (14 pemeriksaan).

> **Catatan desain.** Aturan SKS/TOEFL/similaritas ditempatkan pada **gerbang
> pendaftaran**, bukan checklist tahap. Menaruhnya di checklist tahap menimbulkan
> DEADLOCK: checklist tahap pertama membutuhkan metrik, sedangkan metrik baru
> diperoleh setelah pendaftaran — yang mensyaratkan tahap prasyarat selesai.

## ✅ P1-4 — Cakupan Uji S2 & D3

- [x] `scripts/simulate_process_az.mjs` — Fase U menjalankan siklus penuh
      (ajukan → approve → verifikasi → selesai) untuk **S1, S2, S3, D3**,
      termasuk gerbang pendaftaran, plotting pembimbing, dan publikasi
      terverifikasi (syarat tahap akhir).
- [x] Simulasi kini **291 langkah** (dari 169).

## ✅ P2-5 — Teknis

- [x] N+1 query pada `GET /api/akademik/naskah` → satu query `IN (...)`.
- [x] Parameter `?nim=` dihormati pada `/akademik/naskah` dan
      `/akademik/tugas-akhir`.
- [x] Skrip `scripts/cleanup_test_accounts.mjs` membersihkan akun & data uji.

---

## ⏳ Sisa Pekerjaan

### AZ-A2c — Endpoint Penerbitan SK Massal
`koorprodi/PenerbitanMassalPage.jsx` tidak punya persistence. `POST /api/admin/sk`
hanya menerima satu SK, sehingga penerbitan massal perlu endpoint baru
(mis. `POST /api/admin/sk/bulk`). **Butuh keputusan desain** (format SK, nomor
otomatis, arsip per SK).

### P2-6 — Token Sesi di Cookie `HttpOnly`
Token kini disimpan di `localStorage` → XSS apa pun = pengambilalihan akun penuh.
Pindahkan ke cookie `HttpOnly; SameSite=Strict; Secure` + CSRF token pada
permintaan bermutasi. Butuh penyesuaian `authHeaders()` di seluruh klien.

### P2-7 — Pencabutan Selektif per Perangkat
`token_version` mencabut **seluruh** sesi akun. Ganti dengan daftar `jti`
agar logout hanya mematikan perangkat terkait.

### P2-8 — Rate Limiter ke Store Bersama
 limiter masih in-memory: hilang saat restart, dan tidak dibagi antar-instance. Siap bila sistem mulai berjalan multi-instance.

### P2-9 — Audit Log Viewer + Retensi
`audit_log` sudah terisi (jumlah event pada tiap alur), tetapi belum ada
antarmuka pencarian, filter, ekspor, maupun kebijakan retensi.

### P3-10 — Hapus Komponen Khusus Dev
`SimulationFloatingDock` & `QATestingModal` masih ada di repo (di-*tree-shake*
saat produksi). Memindahkan ke branch terpisah atau menghapusnya.

### P3-11 — CSP `nonce`
`style-src 'unsafe-inline'` masih dipakai. Ganti dengan `nonce` per respons.

---

## ❓ Keputusan Produk yang Masih Dibutuhkan

| ID | Pertanyaan | Status |
| :--- | :--- | :--- |
| **B-1** | Makna status "Lulus" | ✅ Selesai — tiga tingkat: Proses / Siap Pengesahan / Lulus (Lulus = pengesahan terbit) |
| **B-2** | Siapa berwenang mengubah `rules_json` | Super Admin; perubahannya **langsung ditegakkan** (P1-3) |
| **B-3** | Format & alur penerbitan SK massal | ❓ Belum diputuskan (AZ-A2c) |

---

## Riwayat Temuan yang Diperbaiki pada Putaran Ini

| Temuan | Lokasi | Perbaikan |
| :--- | :--- | :--- |
| Rubrik D3 salah | `pengujiRoutes.js` | Modul `examRules.js` |
| Jenis ujian tidak berlaku lolos | `adminRoutes.js` | `EXAM_TYPE_NOT_APPLICABLE` |
| Pendaftaran tanpa TA | `adminRoutes.js` | `TA_NOT_INITIALIZED` |
| `temporaryPassword` tidak berlaku | `superadminRoutes.js` | Pesan eksplisit + arahkan ke Reset Kata Sandi |
| `rules_json` tidak ditegakkan | `academicService.js`, `adminRoutes.js`, `pengujiRoutes.js` | Gerbang pendaftaran + rekomendasi kelayakan |
| Syarat publikasi mati di S1 & D3 | `academicService.js`, `db.js` | Migrasi + `requires_publikasi` semua jenjang |
| Status lulus tak tampil | `akademikRoutes.js`, `App.jsx`, `DashboardPage.jsx`, `TahapanPage.jsx` | Endpoint + panel + badge |
| N+1 query naskah | `akademikRoutes.js` | Satu query `IN (...)` |
| Checklist butuh metrik (deadlock) | `academicService.js` | Aturan dipindah ke gerbang pendaftaran |

---

*Dokumen ini adalah daftar kerja hidup. Perbarui setiap kali sebuah item selesai
atau keputusannya berubah.*
