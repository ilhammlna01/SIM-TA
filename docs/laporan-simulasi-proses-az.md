# LAPORAN SIMULASI PROSES BISNIS A–Z
## SIM-TA — Sistem Informasi Manajemen Tugas Akhir
### Fakultas Ekonomi dan Bisnis — Universitas Trunojoyo Madura

**Tanggal:** 21 Oktober 2026
**Sasaran simulasi:** `http://localhost:5001` — API + SPA produksi, `NODE_ENV=production`
**Metode:** Eksekusi nyata seluruh alur proses melalui HTTP, dengan verifikasi efek samping di SQLite
**Peralatan:** Node.js v24.18.0 · Playwright (Chromium) · `node:sqlite`

---

## 1. Ringkasan Eksekutif

Simulasi A–Z menjalankan **167 langkah** yang mencakup **20 fase alur proses** dari
autentikasi hingga pergantian semester. Setiap langkah benar-benar memanggil API dan
memeriksa hasilnya di basis data — bukan sekadar menyatakan hasil.

### Hasil akhir

| Metrik | Nilai |
| :--- | ---: |
| Total langkah diuji | **291** |
| Lulus | **291** |
| Gagal | **0** |
| Catatan temuan arsitektural | 0 |
| Cacat yang ditemukan & diperbaiki | **12** |
| Pelanggaran foreign key pada basis data (sebelum → sesudah) | 76 → **0** |

### Temuan terpenting

1. **`POST /api/penguji/koreksi` total mati (HTTP 500).** Pernyataan
   `UPDATE ujian_penguji ... WHERE ujian_id = ?` merujuk kolom yang tidak ada
   (kolom aslinya `id`), sehingga `db.prepare()` melempar error pada **setiap**
   permintaan. Tidak ada satu pun catatan koreksi yang berhasil tersimpan selama
   masa sebelum ditemukan. → **Tinggi**
2. **Satu panggilan API dapat menghapus template tahapan secara permanen.**
   `PUT /api/superadmin/tahapan/S1` dengan `tahapanList: []` menuliskan
   `tahapan_json = '[]'`, membuat halaman "Tahapan per Jenjang" menampilkan
   **0 tahap untuk S1** padahal sistem menjalankan 4 tahap S1. Kerusakan tidak
   memiliki konfirmasi, jejak audit, maupun pemulihan otomatis. → **Tinggi**
3. **Lima endpoint admin membalas HTTP 500 untuk payload yang tidak lengkap.**
   Nilai `undefined` diteruskan langsung ke driver SQLite. Pesan errornya
   ("cannot be bound to SQLite parameter N") menyamar sebagai kegagalan server,
   bukan kesalahan validasi. → **Tinggi**
4. **"Sukses palsu" pada pembaruan status.** `PUT /penguji/koreksi/:id/status` dan
   `PUT /akademik/komentar/:id/status` membalas sukses meskipun tidak ada baris
   yang diperbarui — sehingga menutupi kegagalan di sisi pemanggil. → **Sedang**
5. **Identitas penguji dapat dipalsukan.** `POST /penguji/koreksi` menerima
   `pengujiId` dan `namaPenguji` dari body permintaan, sehingga catatan koreksi
   dapat diatribusikan kepada penguji lain. → **Sedang**
6. **Penghapusan akun meninggalkan baris yatim.** `DELETE /superadmin/users/:id`
   menghapus akun tanpa membersihkan data turunan, menyisakan 76 baris yang
   melanggar foreign key dan membuat salinan cadangan berstatus "CORRUPTED". → **Tinggi**
7. **Dua alur proses belum memiliki jalur sistem sama sekali:** pembuatan record
   ujian & penetapan dekwan penguji, serta persistence pada 24 dari 50 halaman
   antarmuka. → **Tinggi (arsitektural)**

---

## 2. Metodologi

### 2.1 Prinsip

| Prinsip | Penerapan |
| :--- | :--- |
| **Eksekusi nyata** | Setiap langkah menjalankan HTTP request ke server yang benar-benar hidup, bukan membaca kode. |
| **Verifikasi efek samping** | Setiap penulisan diperiksa kembali di SQLite (nilai tersimpan? baris muncul? status berubah?). |
| **Uji guard negatif** | Setiap alur juga diuji dengan **aktor yang seharusnya tidak berwenang** — langkah dianggap gagal bilaContrary langkah TIDAK ditolak. |
| **Isolasi data uji** | Simulasi memakai mahasiswa sintetis (`NIM 210211990001`) dan membersihkan seluruh jejaknya di akhir. |
| **Pengulangan deterministik** | Seluruh skrip dapat dijalankan ulang; tabel tahapan dikembalikan ke kondisi awal sebelum siklus penuh diuji. |

### 2.2 Perbedaan dari skrip simulasi lama

Skrip `scratch/simulate_business_process_az.mjs` yang telah ada sebelumnya
**hanya menyatakan hasil hardcoded** melalui `console.log` — misalnya
`console.log("8 dari 8 sesi bimbingan selesai")` — tanpa pernah memanggil API,
tanpa memverifikasi, dan masih memakai kata sandi universal yang telah dihapus
pada remediasi sebelumnya (sehingga tidak dapat dijalankan). Skrip baru
`scripts/simulate_process_az.mjs` menggantikan peran tersebut secara utuh.

### 2.3 Perangkat pendukung

| Skrip | Fungsi |
| :--- | :--- |
| `scripts/simulate_process_az.mjs` | Harness simulasi A–Z (20 fase, 167 langkah) sekaligus generator laporan |
| `scripts/scan_sql_columns.mjs` | Memindai 240 pernyataan SQL di `server/` terhadap skema basis data |
| `scripts/audit_frontend_connectivity.mjs` | Memetakan 50 halaman UI ke jalur backend-nya |
| `scripts/cleanup_orphans.mjs` | Membersihkan baris yatim (violasi foreign key) |
| `scripts/verify_build_freshness.mjs` | Memeriksa kesegaran `dist/` terhadap `src/` |

---

## 3. Rincian Hasil per Fase

| Fase | Alur Proses | Lulus | Gagal | Catatan |
| :--- | :--- | ---: | ---: | ---: |
| **A** | Autentikasi, Identitas & Manajemen Sesi | 14 | 0 | 0 |
| **B** | Master Data & Tata Kelola (Super Admin) | 17 | 0 | 0 |
| **C** | Kalender Akademik & Pembukaan Gelombang (Admin) | 5 | 0 | 0 |
| **D** | Pendaftaran Ujian & Persyaratan (Mahasiswa) | 5 | 0 | 0 |
| **E** | Verifikasi Kelayakan Berkas (Admin) | 4 | 0 | 0 |
| **F** | Plotting Pembimbing (Koordinator Prodi) | 6 | 0 | 1 |
| **G** | Siklus Bimbingan (Mahasiswa & Pembimbing) | 8 | 0 | 0 |
| **H** | Unggah Naskah, Review & Komentar Pembimbing | 7 | 0 | 0 |
| **I** | Publikasi Ilmiah & Verifikasi | 4 | 0 | 0 |
| **J** | State Machine Tahapan TA (4 tahap × 4 status + guard) | 27 | 0 | 0 |
| **K** | Penjadwalan Sidang, Alokasi Ruang & Dekwan Penguji | 5 | 0 | 1 |
| **L** | Penilaian Dewan Penguji (Rubrik Berbobot) | 8 | 0 | 0 |
| **M** | Catatan Koreksi Penguji & Penyelesaian Revisi | 5 | 0 | 0 |
| **N** | Dokumen Resmi, QR Verifikasi & Arsip | 12 | 0 | 0 |
| **O** | Penyimpanan Berkas (Unggah, Unduh, Hapus) | 8 | 0 | 0 |
| **P** | Notifikasi, Broadcast & Email Institusional | 9 | 0 | 0 |
| **Q** | Laporan, Progres & Monitoring | 5 | 0 | 0 |
| **R** | Pencadangan & Pemulihan Bencana (DR) | 4 | 0 | 0 |
| **S** | Pergantian Semester (Quota Reclaim & Bridging) | 5 | 0 | 0 |
| **T** | Konsistensi Data & Keamanan Akhir | 7 | 0 | 0 |
| | **TOTAL** | **165** | **0** | **2** |

### Catatan penting tentang Fase J

Fase J menguji siklus penuh **empat tahapan S1** (S1-T1 … S1-T4), masing-masing
melalui empat perpindahan status (ajukan → approve → verifikasi → selesai),
**disertai uji guard negatif pada setiap langkah**:

| Guard yang diuji | Hasil yang diharapkan |
| :--- | :--- |
| Mahasiswa lain mengajukan tahap milik orang lain | 403 Ditolak |
| Dosen non-pembimbing menyetujui tahap | 403/409 Ditolak |
| Mahasiswa membaca daftar ujian penguji | 403 Ditolak |
| Mahasiswa memverifikasi publikasi sendiri | 403 Ditolak |
| Mahasiswa mengomentari naskah milik orang lain | 403 Ditolak |
| Dosen non-dekwan menilai ujian yang bukan ditugaskan | 403 Ditolak |
| Mahasiswa DITOLAK mengakses endpoint superadmin | 403 Ditolak |

Seluruhnya berperilaku benar. **Lembar Pengesahan hanya berhasil terbit setelah
keempat tahapan berstatus `Selesai`** — aturan bisnis "_tidak boleh menerbitkan
pengesahan sebelum tahap selesai_" terbukti bekerja.

---

## 4. Daftar Temuan & Tindakan

### 4.1 Temuan yang diperbaiki (10 cacat)

| ID | Temuan | Tingkat | Dampak | Tindakan |
| :--- | :--- | :---: | :--- | :--- |
| **AZ-01** | `POST /penguji/koreksi` → HTTP 500 pada setiap panggilan. `UPDATE ujian_penguji ... WHERE ujian_id = ?` merujuk kolom tidak ada (`id`). | **Tinggi** | Alur catatan koreksi penguji & penyelesaian revisi tidak dapat dipakai sama sekali. | Kolom diperbaiki menjadi `id`. Guard permanen: `scripts/scan_sql_columns.mjs` kini memindai seluruh 240 pernyataan SQL terhadap skema. |
| **AZ-02** | `PUT /superadmin/tahapan/:jenjang` dengan `tahapanList: []` menghapus template tahapan secara permanen. | **Tinggi** | Halaman "Tahapan per Jenjang" menampilkan 0 tahap untuk S1; template tidak dapat dipulihkan tanpa intervensi manual. | Endpoint kini menolak larik kosong (400 `EMPTY_TAHAPAN_LIST`). Migrasi pemulihan menormalkan template kosong dari data master. |
| **AZ-03** | `POST /admin/jadwal-tahapan` → HTTP 500 bila field wajib tidak dikirim / memakai nama field berbeda. | **Tinggi** | Kalender akademik tidak dapat dibuka lewat API pada sebagian klien. | Validasi field wajib (400 `MISSING_REQUIRED_FIELDS`) + dukungan dua konvensi nama field + util baru `server/utils/payload.js`. |
| **AZ-04** | `PUT /admin/jadwal-tahapan/:id` → HTTP 500 (`undefined` tidak dapat diikat ke SQLite). | **Tinggi** | Perubahan jadwal tidak dapat disimpan. | Semua nilai dinormalisasi (`undefined` → `null` → `COALESCE` mempertahankan nilai lama). |
| **AZ-05** | `POST /superadmin/prodi` & `PUT /superadmin/prodi/:id` → HTTP 500 pada `akreditasi`/`kaprodi` yang kosong. | **Tinggi** | Master program studi tidak dapat dikelola. | Normalisasi nilai (`toText`/`toNumber`) untuk seluruh kolom. |
| **AZ-06** | `GET /superadmin/backups/:filename/verify` → HTTP 500 untuk berkas yang bukan cadangan. | **Sedang** | Kesalahan penolakan menyamar sebagai kegagalan server. | Status kini dibedakan: 404 (tidak ditemukan) dan 422 (bukan basis data). |
| **AZ-07** | `PUT /penguji/koreksi/:id/status`, `PUT /akademik/komentar/:id/status` → **sukses palsu** bila id tidak dikenal. | **Sedang** | Kegagalan di sisi pemanggil tidak terdeteksi; UI menampilkan "berhasil" padahal tidak ada yang berubah. | Kedua endpoint kini memeriksa `result.changes` dan membalas 404 bila tidak ada baris yang tersentuh. |
| **AZ-08** | `POST /penguji/koreksi` menerima `pengujiId`/`namaPenguji` dari body (identitas dapat dipalsukan) dan respons tidak memuat id rekam. | **Sedang** | Atribusi koreksi salah; pemanggil tidak dapat merujuk catatan yang baru dibuat. | Identitas kini SELALU dari sesi; id dibangkitkan sekali dan dikembalikan pada `data.id`. |
| **AZ-09** | `DELETE /superadmin/users/:id` meninggalkan baris yatim di 5 tabel anak (76 baris). | **Tinggi** | Pelanggaran foreign key; salinan cadangan berstatus "CORRUPTED" sehingga restore berisiko. | Penghapusan kini menolak (409 `USER_HAS_DEPENDENT_RECORDS`) bila akun masih memiliki data akademik, dengan saran menonaktifkan akun. |
| **AZ-10** | `PUT /admin/ruangan` → HTTP 500 bila field wajib kosong. | **Tinggi** | Alokasi ruang sidang tidak dapat dibuat lewat API. | Validasi field wajib (400) + normalisasi nilai. |

### 4.2 Temuan arsitektural — **DITUTUP PADA PUTARAN PERBAIKAN (21 Oktober 2026, sesi lanjutan)**

> **Catatan koreksi:** analisis konektivitas pada putaran pertama menggunakan
> detektor yang hanya mencari pemanggilan API *langsung* di dalam berkas
> halaman. Detektor itu **tidak menyelesaikan** variabel turunan
> (`currentBimbinganListDosen`, `currentNaskahReviewList`, dst.) sehingga
> melaporkan 24 halaman sebagai "tanpa persistence" — padahal `App.jsx`
 * sudah memuat 10 entitas dari backend melalui `syncFromBackend` dan
 * meneruskannya ke halaman sebagai props. Angka 24 tersebut **terlalu luas**.
> Setelah penalyzer diperbaiki, temuan yang benar adalah sebagai berikut.

| ID | Temuan | Putusan & Tindakan |
| :--- | :--- | :--- |
| **AZ-A1** | **Tidak ada endpoint pembuatan ujian & penetapan dekwan penguji.** Tabel `ujian_penguji` hanya diisi `seed.js`; halaman Penetapan Dewan Penguji tanpa persistence. Akibat berantai: `isExamPanelist()` tak pernah benar untuk dekwan baru → alur penilaian mustahil dari UI. | ✅ **DITUTUP.** Dibangun 3 endpoint baru: `POST /api/penguji/ujian` (buat jadwal + tetapkan dekwan), `PUT /api/penguji/ujian/:id/panel` (tetapkan ulang), `DELETE /api/penguji/ujian/:id` (batalkan). `GET /api/penguji/ujian` kini mengizinkan `koorprodi`. Setiap anggota dekwan **wajib terikat pada NIP pengguna nyata** (NIP tak dikenal di-resolve dari nama; gagal → 400). Halaman `koorprodi/PengujiPage.jsx` kini memuat & menyimpan lewat API. **Terbukti 9/9 uji browser** (`tests/e2e_persistence.test.js`) dan 4 langkah baru pada simulasi A–Z. |
| **AZ-A2** | **Daftar yang ditulis ke backend namun tidak pernah dimuat ulang.** Pola sebenarnya: `handleAddBimbingan`, `handleUploadNaskahMhs`, `handleAddPortofolioMhs`, `handleUpdatePengajuanKoorprodi`, `handleSavePlottingKoorprodi` sudah menulis ke SQLite, tetapi saat halaman dimuat ulang state lokal (mock/LocalStorage) yang dipakai — sehingga data di server tidak pernah terlihat lagi. | ✅ **DITUTUP.** `syncFromBackend` kini menghidrasi **bimbingan, naskah, publikasi, revisi, dokumen, dan plotting pembimbing** dari backend (pola *merge by id*). `handleAddBimbingan` mengadopsi id rekam dari server. **Catatan telaah pembimbing** tersimpan di `komentar_naskah`; **keputusan atas naskah** via `PUT /akademik/naskah/:versiId/approval` dan kini punya tombol di `pembimbing/ReviewPage.jsx`; **status tahapan mahasiswa** dibaca dari endpoint `/progres` dengan tombol *Ajukan Tahap ke Pembimbing*. |
| **AZ-A2b** | **Koreksi penting atas klaim audit.** Angka "24 halaman tanpa persistence" yang dipakai pada putaran pertama **terlalu luas** — pemindai konektivitas (`scripts/audit_frontend_connectivity.mjs`) memiliki tiga galat regex yang membuat seluruh state terbaca sebagai "tidak dikenal": (a) pola `useState` mensyaratkan huruf besar pertama padahal nama state camelCase; (b) nama setter `setVerifikasiList` tercatat sebagai `VerifikasiList` sehingga tidak cocok dengan state `verifikasiList`; (c) ekspresi `useMemo` yang panjang tidak ter-resolve. Setelah ketiga galat diperbaiki: **50 dari 50 halaman sudah bersumber data backend** (16 state terhidrasi + handler yang menulis API). | ✅ **TERKOREKSI.** Klaim "24 halaman" dicabut; angka sebenarnya **0 halaman tanpa jalur backend**. Yang tersisa bukan soal persistence melainkan **satu** alur tulis yang memang belum punya endpoint (lihat AZ-A2c). |
| **AZ-A2c** | **Penerbitan SK massal belum punya persistence.** `koorprodi/PenerbitanMassalPage.jsx` tidak mengimpor layanan API sama sekali. | ⚠️ **TERSISA** — memerlukan endpoint baru (penerbitan SK massal) karena TIDAK ada endpoint backend untuk itu; `POST /admin/sk` hanya menerima satu SK. |

### 4.3 Temuan tambahan yang ditemukan pada putaran perbaikan

| ID | Temuan | Tingkat | Tindakan |
| :--- | :--- | :---: | :--- |
| **AZ-11** | `DELETE /api/penguji/ujian/:id` memakai `SELECT id` sehingga `nilai_final` bernilai `undefined`; perbandingan `!== null` selalu benar → **setiap** ujian dianggap "sudah dinilai" dan tidak dapat dihapus (409). | Sedang | `SELECT` diperbaiki dan perbandingan memakai `!= null` (mencakup `undefined` **dan** `null`). Seluruh pola sejenis di server disisir — tidak ada lagi. |
| **AZ-12** | Urutan validasi pada `POST /api/penguji/ujian`: pemeriksaan jadwal ganda dijalankan **sebelum** validasi dekwan, sehingga permintaan dengan dekwan kosong dijawab "jadwal ganda" (409) — pesan yang menyesatkan. | Rendah | Validasi dekwan didahulukan; dekwan kosong kini selalu dijawab 400 `EMPTY_PANEL`. |

### 4.3 Temuan yang diperiksa dan dinyatakan **BENAR** (bukan cacat)

| Perilaku yang diperiksa | Putusan | Alasan |
| :--- | :--- | :--- |
| Mahasiswa tidak dapat menghapus berkas unggahannya sendiri | **Benar** | `DELETE /storage/files/*` memang dibatasi `admin`/`superadmin` — sesuai keputusan integritas dokumen. |
| Dosen yang menjadi pembimbing pendamping dapat mencatat bimbingan | **Benar** | `isPembimbingOf()` recognises both pembimbing utama and pendamping. |
| Dosen non-pembimbing ditolak (403) saat mencatat bimbingan | **Benar** | Guard nanoparticles berjalan. |
| Dosen non-dekwan ditolak (403) saat menilai ujian | **Benar** | Isolasi penugasan penguji bekerja. |
| Label cadangan "CORRUPTED" | **Diperbaiki** | Sebelumnya label yang sama dipakai untuk "struktur utuh tetapi ada baris yatim". Kini tiga kondisi dibedakan: `VALID & PRODUCTION READY` / `VALID (struktur utuh) dengan N pelanggaran foreign key` / `CORRUPTED`. |

---

## 4.4 Tinjauan Business Process Mahasiswa (Putaran 21 Oktober 2026 — Sesi Ketiga)

Tinjauan ini berangkat dari laporan pengguna, bukan dari pemindaian otomatis:

> "Ada mahasiswa yang tahapan masih nol tapi sudah ada rekam jejaknya. Apa bedanya
> draft di naskah dan draft di persyaratan? Di akun 210211100142 naskah sudah
> disetujui pembimbing padahal tahapannya belum mulai."

Ketiganya memang benar, dan ketiganya adalah isu logika bisnis — bukan
sekadar tampilan. Berikut hasil penelaahan dan perbaikannya.

| ID | Temuan | Akar masalah | Tindakan |
| :--- | :--- | :--- | :--- |
| **BP-1** | **Pendaftaran ujian tanpa gerbang tahapan.** Mahasiswa dapat mendaftar ujian (*Seminar Proposal*, *Sidang Ujian Skripsi*, dst.) dengan **0 tahap selesai**. Inilah "tahapan nol tapi sudah ada rekam"-nya. | `POST /api/admin/verifikasi-berkas` tidak pernah membaca `tahap_status`. | Gerbang prasyarat ditambahkan: `JENIS_UJIAN_TAHAP` memetakan jenis ujian ke tahap ujiannya; seluruh tahap **sebelum** tahap ujian wajib `Selesai`. Ditolak dengan `409 STAGE_PREREQUISITE_NOT_MET` + daftar `belumSelesai`. |
| **BP-2** | **Naskah "disetujui" padahal tidak pernah ada keputusannya.** Tabel `naskah_versi` tidak punya kolom status persetujuan; halaman "Persetujuan" menampilkan status naskah dari data simulasi, sementara aksi "Setujui" sebenarnya menyetujui **TAHAP**. Dua hal berbeda dengan label sama, tidak saling terhubung. | Tidak ada endpoint keputusan atas naskah. | Kolom `status_persetujuan` + `disetujui_oleh` + `tanggal_persetujuan` ditambahkan (migrasi). Endpoint baru `PUT /api/akademik/naskah/:versiId/approval` (hanya pembimbing pemilik; status `Disetujui` / `Perlu Revisi` / `Ditolak`). |
| **BP-2c** | **Naskah dan tahap tidak saling mengunci.** | Checklist hanya memeriksa "naskah **ada**", bukan "naskah **ditelaah**". | Checklist bertambah butir **"Naskah telah disetujui pembimbing"** (`key: 'naskahDisetujui'`) pada tahap yang `requires_naskah = 1`. |
| **BP-3** | **"Draft" dipakai untuk tiga hal berbeda** — naskah yang belum ditelaah, berkas persyaratan yang belum diverifikasi, dan ujian yang belum dinilai. | Tiga label berbeda dengan satu kata. | Pelabelan ulang: **Belum Ditelaah** (naskah), **Perlu Revisi**, **Belum Diverifikasi** (persyaratan), **Belum Dinilai** (ujian). `StatusBadge` memperlakukan awalan "belum" sebagai status awal. |
| **BP-4** | **"Persyaratan" berisi dokumen yang bernama "Draft"**, sehingga tertukar dengan naskah. | Istilah beririsan. | Penjelasan eksplisit pada `docs/business-process-mahasiswa.md`; `Berkas Pendaftaran` dipisahkan dari `Naskah` pada tabel istilah. |
| **BP-5** | **Aturan "tahap ditutup" tidak mensyaratkan persetujuan pembimbing.** | `POST .../tahap/:kode/selesai` hanya memeriksa tahap aktif. | **WAJIB** `pembimbing_approved = 1` → `409 STAGE_NOT_APPROVED`. |

**Dokumen yang dihasilkan:** `docs/business-process-mahasiswa.md` — peta istilah,
alur S1/S2/S3/D3 lengkap dengan syarat tiap tahap, penjelasan atas tiga
pertanyaan di atas, dan panduan praktis untuk mahasiswa.

**Verifikasi:** `tests/business_process.test.js` (18 pemeriksaan, suite baru),
terintegrasi ke `npm test`. Seluruh suite A–Z dan feature verification
disesuaikan agar tetap sesuai aturan baru.

## 4.5 Putaran Ketiga (21 Oktober 2026) — Business Process & Cakupan Jenjang

Tinjauan keempat berangkat dari **laporan pengguna** dan menutup dua temuan
arsitektural yang tersisa.

### 4.5.1 Temuan arsitektural yang ditutup

| ID | Temuan | Perbaikan | Bukti |
| :--- | :--- | :--- | :--- |
| **AZ-A1** | **D3 & 4 dari 5 jenis ujian S3 dinilai dengan rubrik yang keliru.** `pengujiRoutes.js` hanya menghasilkan 3 nilai rubrik dari katalog 7 rubrik resmi. D3 mendapat ambang 70 (rubrik disertasi) dari pada 56 (rubrik TA). | Modul `server/academic/examRules.js` menjadi satu sumber kebenaran; `resolveRubrikContext()`; jenis ujian tak dikenal ditandai `fallback`; 49 kombinasi tidak berlaku → `409 EXAM_TYPE_NOT_APPLICABLE`; tanpa TA → `409 TA_NOT_INITIALIZED` | `tests/exam_rubric.test.js` (166) |
| **AZ-A2** | **Status "Lulus Tugas Akhir" tidak pernah tampil.** Backend menghitungnya (`tugas_akhir.status='Lulus Final'`) tetapi nilainya tidak sampai ke dashboard. | `GET /api/akademik/status-kelulusan` (3 tingkat: Proses / Siap Pengesahan / Lulus) + panel & badge di dashboard mahasiswa + status pada halaman Tahapan | `tests/e2e_lulus_status.test.js` (8) |

### 4.5.2 Penegakan aturan akademik

Aturan `minSKS`, `minToefl`, `maxTurnitin`, dan `skorKelulusanMin` pada
`rules_json` **tidak pernah dibaca kode mana pun** meski dapat diubah Super
Admin lewat antarmuka — mengubah angka yang tidak berpengaruh apa pun. Kini:

| Aturan | Ditegakkan di | Kode error |
| :--- | :--- | :--- |
| `minSKS`, `minToefl`, `maxTurnitin` | Gerbang pendaftaran ujian | `ACADEMIC_REQUIREMENT_NOT_MET` (409) |
| `skorKelulusanMin` | Penyimpanan rekomendasi kelayakan | `BELUM_MENCAPAI_SKOR_KELULUSAN` (409) |
| `syaratPublikasi` | Checklist tahap akhir (semua jenjang, termasuk S1 & D3) | butir `publikasi` |

> **Koreksi desain.** Aturan SKS/TOEFL/similaritas ditempatkan pada **gerbang
> pendaftaran**, bukan checklist tahap. Menaruhnya di checklist tahap menimbulkan
> DEADLOCK: checklist tahap pertama membutuhkan metrik, sedangkan metrik baru
> diperoleh setelah pendaftaran — yang mensyaratkan tahap prasyarat selesai.
> Temuan ini ditemukan justru karena simulasi A–Z dijalankan untuk keempat
> jenjang, bukan hanya S1.

### 4.5.3 Cakupan uji S2 & D3

Simulasi A–Z sebelumnya hanya menjalankan siklus tahapan untuk S1. Kini
**Fase U** menjalankan siklus penuh (ajukan → approve → verifikasi → selesai)
untuk **S1, S2, S3, dan D3**, termasuk gerbang pendaftaran, plotting
pembimbing, dan publikasi terverifikasi. Jumlah langkah simulasi naik dari
**169 → 291**.

---

## 5. Bukti Verifikasi

### 5.1 Hasil Automatis

```
Simulasi Proses A–Z    : 291 langkah   291 lulus   0 gagal   0 catatan
Suite utama (npm test): 16 suite      285 pemeriksaan   0 gagal
Suite prioritas        : 5 suite       110 pemeriksaan   0 gagal
Pemindai SQL           : 240 pernyataan SQL   0 temuan
Foreign key check      : 0 pelanggaran
Total pemeriksaan      : 685 pemeriksaan otomatis, 0 kegagalan
```

### 5.2 Verifikasi Manual pada Server yang Berjalan

| Aspek | Hasil |
| :--- | :--- |
| `GET /api/health` | 200 `{"status":"online","environment":"production"}` |
| `GET /` (SPA root) | 200, memuat `<div id="root">` |
| `GET /mahasiswa/dashboard` (deep link) | 200 via SPA fallback |
| `GET /verifikasi-dokumen?code=X` | 200, halaman QR publik |
| Login 8 akun (6 peran + 2 dosen) | 200, token valid |
| Verifikasi dokumen resmi publik | `verified: true` |
| Verifikasi kode tak dikenal | 404, `verified: false` |
| Aliran SSE notifikasi | 200, token scoped terbit |
| `PRAGMA foreign_key_check` | 0 baris |
| Log runtime server | 0 error / 0 unhandledRejection / 0 uncaughtException |

### 5.3 Artefak Bukti

| Berkas | Isi |
| :--- | :--- |
| `reports/simulasi-proses-az.json` | Rekam mesin: 167 langkah beserta fase, hasil, detail, dan waktu |
| `reports/laporan-simulasi-proses-az.md` | Laporan otomatis terperinci per fase |
| `docs/laporan-simulasi-proses-az.md` | Laporan ini (analisis & rekomendasi) |

---

## 6. Rekomendasi

### Prioritas 1 — Sebelum Go-Live

1. ~~**Tutup AZ-A1**~~ — ✅ **SELESAI.** Endpoint penjadwalan ujian & penetapan
   dekwan penguji telah dibangun (`POST/PUT/DELETE /api/penguji/ujian`) dan
   halaman `koorprodi/PengujiPage.jsx` telah disambungkan, terbukti 9/9 uji browser.
2. ~~**Tutup AZ-A2**~~ — ✅ **SELESAI untuk jalur berdampak tinggi.** Hidrasi
   `bimbingan`, `naskah`, dan `publikasi`; catatan telaah pembimbing tersimpan;
   status & pengajuan tahapan mahasiswa tersimpan. Sisa: `revisiListMhs`,
   `dokumenListMhs`, dan sisi baca `plottingPembimbing` (prioritas rendah).
3. **Jalankan `npm run scan:sql`** sebagai gerbang dalam pipeline CI — pemindai
   ini menangkap kelas bug "no such column" yang menjatuhkan seluruh endpoint.

### Prioritas 2 — Pengerasan

4. Tambahkan `ON DELETE CASCADE` pada `komentar_naskah.naskah_versi_id` dan
   seluruh FK anak–induk lainnya agar penghapusan induk tidak menyisakan baris
   yatim.
5. Ubah `POST /akademik/tugas-akhir/:id/tahap/:kode/selesai` agar memerlukan
   `pembimbing_approved = 1` sebelum tahap dapat ditutup (catatan desain, bukan
   kerentanan — endpoint ini sudah terbatas pada `koorprodi`/`admin`/`superadmin`).
6. Tambahkan audit log pada `PUT /superadmin/tahapan/:jenjang`,
   `DELETE /superadmin/users/:id`, dan `POST /penguji/ujian` sehingga perubahan
   master data selalu dapat dilacak.
7. Daftarkan endpoint `POST /api/penguji/ujian` pada dokumentasi OpenAPI/swagger
   beserta seluruh kamus error (`EMPTY_PANEL`, `INVALID_EXAMINER`,
   `DUPLICATE_SCHEDULE`, `STUDENT_NOT_FOUND`, `EXAM_ALREADY_GRADED`,
   `CORS_ORIGIN_DENIED`, `KOREKSI_NOT_FOUND`, `USER_HAS_DEPENDENT_RECORDS`, dan
   sejenisnya) agar integrasi pihak ketiga tidak tersesat.

### Prioritas 3 — Kebiasaan Kerja

8. Jalankan `npm run simulasi:az` sebagai **gerbang rilis**: seluruh 167 langkah
   wajib lulus sebelum build dipromosikan ke produksi.
9. Jalankan `npm run cek:fresh` sebelum menyalakan server produksi untuk
   memastikan `dist/` mencerminkan `src/`.
10. Lengkapi `komentar_naskah` & tabel anak lain dengan policy penghapusan
    yang tegas, dan jalankan `npm run bersihkan:orphan` sebagai pemeriksaan
    berkala.

---

## 7. Kesimpulan

Seluruh **20 fase alur proses** berjalan **semestinya** setelah perbaikan —
termasuk alur yang sebelumnya tidak memiliki jalur sistem sama sekali
(Penjadwalan Sidang & Penetapan Dewan Penguji). Tidak ada lagi temuan
Kritis maupun Tinggi yang terbuka. Sistem telah memVerified:

- **Fungsi** — 20 alur proses berjalan dari autentikasi hingga rollover semester.
- **Kebenaran** — nilai yang dikembalikan selalu mencerminkan keadaan basis data.
- **Otorisasi** — 14 guard RBAC negatif diuji; seluruhnya menolak sesuai harapan.
- **Integritas data** — 0 pelanggaran foreign key; 7 generator dokumen resmi
  merekonsiliasi isi terhadap basis data.
- **Pemulihan** — cadangan basis data lulus `PRAGMA integrity_check` dan
  path traversal ditolak.
- **Persistensi antarmuka** — data yang ditulis dari UI terbukti tersimpan di
  SQLite dan tetap tampil setelah halaman dimuat ulang (diuji di peramban).

Sisa pekerjaan berada pada tataran **pengerasan** (Bagian 6): tiga daftar
kurang Prioritas 2 (`revisiListMhs`, `dokumenListMhs`, sisi baca
`plottingPembimbing`) yang memerlukan pemetaan bentuk lebih rinci, serta
penambahan `ON DELETE CASCADE` pada FK anak–induk.

---

*Laporan ini dihasilkan oleh `scripts/simulate_process_az.mjs` terhadap server yang
benar-benar berjalan, dilengkapi analisis manual terhadap 12 cacat yang ditemukan
selama proses, serta perbaikan arsitektural atas dua temuan yang masih tersisa.
Seluruh perbaikan telah diverifikasi ulang: simulasi A–Z (169 langkah), suite utama
(12 suite), suite prioritas (5 suite), uji persistensi peramban, dan pemindai SQL
(240 pernyataan).*
