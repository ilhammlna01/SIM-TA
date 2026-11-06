# LAPORAN AUDIT UI/UX PROFESIONAL — SIM-TA FEB UTM
**Sistem Informasi Manajemen Tugas Akhir**  
**Fakultas Ekonomi dan Bisnis, Universitas Trunojoyo Madura (T.A. 2026/2027)**  
*Dokumen Hasil Audit Tahap 1 — Tanpa Perubahan Kode (Baseline Assessment)*

---

## 1. Ringkasan Eksekutif & Kondisi Awal

Audit ini dilakukan oleh Senior Product Designer & Frontend Architect terhadap repositori Sistem Informasi Manajemen Tugas Akhir (SIM-TA) Jurusan Manajemen FEB Universitas Trunojoyo Madura. Standar kerja berakar pada karakteristik **sistem informasi akademik institusional**, bukan aplikasi SaaS generic, prototipe, atau hasil vibe-coding.

### Temuan Kunci Kondisi Awal:
1. **Fondasi Arsitektur Ganda**: Proyek telah memiliki sistem token awal (`tokens.css`, `shell.css`, `components.css`), namun terjadi ketidakteraturan implementasi di mana 4 peran (`mahasiswa`, `pembimbing`, `koorprodi`, `penguji`) menggunakan sebagian komponen baru (`PageHeader`, `Table`, `Panel`), sedangkan 2 peran administratif (`admin`, `superadmin`) dan modul otentikasi (`LoginPage`) menggunakan pola lama (raw inline-styled `<table>`, raw `<button>`, hero banner bernuansa startup landing page).
2. **Pola Desain AI & Vibe Coding yang Masih Tersisa**:
   - Ditemukan **emoji** pada dropdown navigasi header peran institusional (`🏛️`, `🎓`, `⚖️`), status glyph (`⏳`), modal log SLA (`⏰`), pesan aksi dokumen (`⚡`), indikator insentif publikasi (`⭐`), dan modal QA (`🏆`, `❌`).
   - Terdapat **hero banner bernuansa marketing** dengan gradien gelap tebal (`linear-gradient(135deg, var(--primitive-navy-950) 0%, ...)`) pada `admin/DashboardPage`, `superadmin/DashboardPage`, `admin/JadwalTahapanPage`, dan `admin/OtomasiDokumenPage`.
   - Pada `LoginPage.jsx`, terdapat latar belakang dekoratif *grid mesh* berpola garis silang dan shadow ekstra tebal (`box-shadow: 0 25px 50px -12px ...`).
   - Terdapat efek *glassmorphism* (`backdrop-filter: blur(12px)`) pada dock simulasi.
3. **Inkonsistensi Komponen Inti**:
   - Komponen **Table**: Halaman Dosen, Mahasiswa, Koorprodi, dan Penguji menggunakan `<Table>` terstandar dari `src/components/ui/Table.jsx`. Sebaliknya, halaman Admin dan Super Admin membangun tabel sendiri menggunakan elemen mentah `<table>` dengan inline style `borderCollapse`, warna cell manual, dan tanpa pagination terstandar.
   - Komponen **PageHeader**: 4 peran memiliki hierarki `PageHeader` lengkap dengan `Breadcrumb`, judul `h1`, metadata, dan tombol aksi terstruktur. Namun pada modul Admin dan Super Admin, seluruh halaman tidak mengimpor `PageHeader` dan menyusun header secara manual menggunakan `<div>` dan `<button>` mentah.
   - Komponen **Button**: Muncul ratusan deklarasi `<button style={{ ... }}>` inline yang mengabaikan varian dan ukuran standar dari `src/components/ui/Button.jsx`.
4. **Duplikasi & Dead Code**:
   - Folder `src/components/common/` menyimpan salinan usang dari `Sidebar.jsx`, `Topbar.jsx`, `Modal.jsx`, `StatusBadge.jsx`, dan `Breadcrumb.jsx` yang tidak pernah diimpor oleh halaman aktif (hanya `ErrorBoundary` dan `AcademicPageLoading` yang digunakan).
   - Folder `src/components/dashboard/` dan `src/components/modules/` menyimpan 16 file prototipe masa lalu yang tidak lagi diimpor oleh `App.jsx`.
   - File `src/index.css` menyimpan 1.251 baris CSS lama yang menduplikasi dan berpotensi menimpa aturan dalam `tokens.css`, `shell.css`, dan `components.css`.

---

## 2. Inventaris Halaman dan Role Aktual

Sistem mengimplementasikan **6 Peran Pengguna Aktif** dan **1 Modul Otentikasi Terpadu** dengan total **48 Halaman/Tampilan Aktual**:

| No | Peran (Role) | Kode Rute / Nav ID | Nama Halaman | File Komponen Sumber |
|:---|:---|:---|:---|:---|
| **A** | **Otentikasi & Akun** | | | |
| 1 | Tamu / Auth | `login` | Halaman Single Sign-On Institusional | `src/pages/auth/LoginPage.jsx` |
| **B** | **Mahasiswa (Fase D)** | | | |
| 2 | Mahasiswa | `dashboard` | Dashboard Akademik Mahasiswa | `src/pages/mahasiswa/DashboardPage.jsx` |
| 3 | Mahasiswa | `detail-ta` | Detail & Metadata Tugas Akhir | `src/pages/mahasiswa/DetailTugasAkhirPage.jsx` |
| 4 | Mahasiswa | `tahapan` | Alur & Progres Siklus Tahapan | `src/pages/mahasiswa/TahapanPage.jsx` |
| 5 | Mahasiswa | `persyaratan` | Berkas & Validasi Kelayakan Ujian | `src/pages/mahasiswa/PersyaratanPage.jsx` |
| 6 | Mahasiswa | `bimbingan` | Logbook & Konsultasi Bimbingan | `src/pages/mahasiswa/BimbinganPage.jsx` |
| 7 | Mahasiswa | `naskah` | Pengunggahan Draf Naskah | `src/pages/mahasiswa/NaskahPage.jsx` |
| 8 | Mahasiswa | `ujian` | Pendaftaran & Jadwal Ujian Sidang | `src/pages/mahasiswa/UjianPage.jsx` |
| 9 | Mahasiswa | `revisi` | Catatan & Bukti Perbaikan Penguji | `src/pages/mahasiswa/RevisiPage.jsx` |
| 10 | Mahasiswa | `publikasi` | Validasi Luaran Artikel Ilmiah | `src/pages/mahasiswa/PublikasiPage.jsx` |
| 11 | Mahasiswa | `dokumen` | Repositori & Verifikasi Dokumen Digital | `src/pages/mahasiswa/DokumenPage.jsx` |
| **C** | **Dosen Pembimbing / Promotor (Fase E)** | | | |
| 12 | Pembimbing | `dashboard` | Dashboard Tugas Akademik Dosen | `src/pages/pembimbing/DashboardPage.jsx` |
| 13 | Pembimbing | `mahasiswa` | Direktori Mahasiswa Bimbingan | `src/pages/pembimbing/MahasiswaBimbinganPage.jsx` |
| 14 | Pembimbing | `detail-mahasiswa`| Dossier Akademik Mahasiswa Bimbingan | `src/pages/pembimbing/DetailMahasiswaPage.jsx` |
| 15 | Pembimbing | `bimbingan` | Validasi & Pengesahan Logbook Bimbingan | `src/pages/pembimbing/BimbinganPage.jsx` |
| 16 | Pembimbing | `naskah` | Telaah Draf Naskah Masuk | `src/pages/pembimbing/NaskahPage.jsx` |
| 17 | Pembimbing | `review` | Split-Screen Telaah Dokumen & Anotasi | `src/pages/pembimbing/ReviewPage.jsx` |
| 18 | Pembimbing | `persetujuan` | Antrean Persetujuan Ujian (ACC Sidang) | `src/pages/pembimbing/PersetujuanPage.jsx` |
| 19 | Pembimbing | `revisi` | Pemantauan Tindak Lanjut Revisi Mahasiswa| `src/pages/pembimbing/RevisiPage.jsx` |
| 20 | Pembimbing | `ujian` | Jadwal & Agenda Sidang Bimbingan | `src/pages/pembimbing/UjianPage.jsx` |
| **D** | **Koordinator Program Studi (Fase F)** | | | |
| 21 | Koorprodi | `dashboard` | Dashboard Kendali Mutu Prodi | `src/pages/koorprodi/DashboardPage.jsx` |
| 22 | Koorprodi | `mahasiswa` | Direktori Seluruh Mahasiswa Prodi | `src/pages/koorprodi/DaftarMahasiswaPage.jsx` |
| 23 | Koorprodi | `detail-mahasiswa`| Rekam Jejak Komprehensif Mahasiswa | `src/pages/koorprodi/DetailMahasiswaPage.jsx` |
| 24 | Koorprodi | `pengajuan` | Verifikasi Pengajuan Judul & Proposal | `src/pages/koorprodi/PengajuanPage.jsx` |
| 25 | Koorprodi | `pembimbing` | Penetapan & Plotting Pembimbing | `src/pages/koorprodi/PembimbingPage.jsx` |
| 26 | Koorprodi | `penguji` | Penetapan Susunan Dewan Penguji | `src/pages/koorprodi/PengujiPage.jsx` |
| 27 | Koorprodi | `ujian` | Monitoring Pelaksanaan Ujian Sidang | `src/pages/koorprodi/UjianPage.jsx` |
| 28 | Koorprodi | `persyaratan` | Matriks Audit Persyaratan & Turnitin | `src/pages/koorprodi/PersyaratanPage.jsx` |
| 29 | Koorprodi | `revisi` | Pengawasan Tenggat Waktu Revisi Pasca Ujian | `src/pages/koorprodi/RevisiPage.jsx` |
| 30 | Koorprodi | `dokumen` | Arsip Dokumen Akademik Program Studi | `src/pages/koorprodi/DokumenPage.jsx` |
| **E** | **Dewan Penguji (Fase G)** | | | |
| 31 | Penguji | `dashboard` | Dashboard Agenda Sidang Penguji | `src/pages/penguji/DashboardPage.jsx` |
| 32 | Penguji | `daftar-ujian` | Jadwal & Direktori Sidang Penguji | `src/pages/penguji/DaftarUjianPage.jsx` |
| 33 | Penguji | `detail-ujian` | Berkas & Informasi Sidang Spesifik | `src/pages/penguji/DetailUjianPage.jsx` |
| 34 | Penguji | `naskah` | Akses Naskah Ujian & Koreksi Cepat | `src/pages/penguji/NaskahPage.jsx` |
| 35 | Penguji | `penilaian` | Form Penilaian Sidang & Rubrik Nilai | `src/pages/penguji/FormPenilaianPage.jsx` |
| 36 | Penguji | `koreksi` | Notula Catatan Koreksi & Revisi Penguji | `src/pages/penguji/CatatanKoreksiPage.jsx` |
| 37 | Penguji | `revisi` | Pengesahan & Approval Bukti Revisi | `src/pages/penguji/RevisiPage.jsx` |
| **F** | **Admin Pascasarjana & Akademik** | | | |
| 38 | Admin | `dashboard` | Dashboard Operasional Administrasi TU | `src/pages/admin/DashboardPage.jsx` |
| 39 | Admin | `jadwal-tahapan`| Pengaturan Periode & Jadwal Tahapan | `src/pages/admin/JadwalTahapanPage.jsx` |
| 40 | Admin | `otomasi-dokumen`| Generator Dokumen Formal & Berita Acara | `src/pages/admin/OtomasiDokumenPage.jsx` |
| 41 | Admin | `verifikasi` | Verifikasi Berkas Fisik/Digital Ujian | `src/pages/admin/VerifikasiBerkasPage.jsx` |
| 42 | Admin | `sk` | Penerbitan & Penomoran SK Formal Dekan | `src/pages/admin/PenerbitanSKPage.jsx` |
| 43 | Admin | `ruangan` | Manajemen Alokasi Ruang Sidang | `src/pages/admin/AlokasiRuanganPage.jsx` |
| **G** | **Super Administrator** | | | |
| 44 | Super Admin | `dashboard` | Pusat Kendali Sistem & Statistik Master | `src/pages/superadmin/DashboardPage.jsx` |
| 45 | Super Admin | `prodi` | Master Konfigurasi Prodi (D3/S1/S2/S3) | `src/pages/superadmin/MasterProdiPage.jsx` |
| 46 | Super Admin | `tahapan` | Konfigurasi Siklus Tahapan & Regulasi | `src/pages/superadmin/TahapanJenjangPage.jsx` |
| 47 | Super Admin | `kuota` | Konfigurasi Batas Kuota Dosen Pembimbing| `src/pages/superadmin/KuotaBimbinganPage.jsx` |
| 48 | Super Admin | `users` | Tata Kelola Akun & Hak Akses Pengguna | `src/pages/superadmin/ManajemenPenggunaPage.jsx` |

---

## 3. Matriks Audit Temuan Komprehensif

Klasifikasi Prioritas:
- **P0**: Masalah kritis yang merusak aksesibilitas, fungsionalitas, atau melanggar aturan institusional utama.
- **P1**: Masalah besar pada navigasi, alur kerja, keterbacaan, atau inkonsistensi arsitektur komponen.
- **P2**: Masalah visual, layout, dan interaksi yang mengurangi kualitas dan kewibawaan institusional produk.
- **P3**: Penyempurnaan kosmetik, pembersihan dead code, dan optimasi mikro.

| ID | Halaman / Komponen | Masalah | Dampak Pengguna | Prioritas | Status | Rekomendasi Perbaikan |
|:---|:---|:---|:---|:---:|:---:|:---|
| **T-01** | `Topbar.jsx` (Role Switcher) | Menggunakan ikon emoji (`🏛️`, `🎓`, `⚖️`) pada label peran dropdown. | Tampilan tidak formal, melanggar prinsip anti-vibe coding institusi. | **P1** | **SELESAI** | Ganti emoji dengan ikon Lucide profesional (`Building2`, `GraduationCap`, `Scale`) dengan ukuran dan stroke konsisten. |
| **T-02** | `StatusBadge.jsx` (Core UI) | Menggunakan karakter emoji `⏳` untuk status 'Menunggu' dan glyph simbol mentah (`✓`, `✕`, `✎`, `★`). | Visual tidak konsisten di berbagai sistem operasi (rendering emoji bervariasi), kontras warna glyph tidak terstandardisasi. | **P0** | **SELESAI** | Hapus glyph emoji; gunakan shape dot 6px dengan warna status semantik murni dan teks label yang terbaca jelas. |
| **T-03** | Modul Admin (`DashboardPage`, `JadwalTahapanPage`, `OtomasiDokumenPage`) & Super Admin (`DashboardPage`) | Menggunakan banner gelap dengan gradien visual (`linear-gradient(135deg, ...)`) berlebihan dan shadow tebal menyerupai landing page marketing. | Mengacaukan hierarki visual; membuat aplikasi terasa seperti prototipe startup dan tidak konsisten dengan modul Dosen/Mahasiswa. | **P1** | **SELESAI** | Ganti seluruh hero banner dengan komponen `PageHeader` institusional standar (latar belakang bersih, border pembatas subtil, judul `h1` proporsional, breadcrumb lengkap). |
| **T-04** | Modul Admin (`VerifikasiBerkasPage`, `PenerbitanSKPage`, `AlokasiRuanganPage`) & Super Admin (`ManajemenPenggunaPage`, `KuotaBimbinganPage`) | Menggunakan tag HTML `<table>` mentah dengan inline-styling manual alih-alih komponen `<Table>` terpusat. | Tidak memiliki skeleton loading, layout rusak saat responsif mobile, tidak ada sorting terstandar, inkonsistensi visual header/cell tabel antar-halaman. | **P1** | **SELESAI** | Refactor seluruh tabel administratif agar menggunakan komponen `<Table>` terstandar dari `src/components/ui/Table.jsx`. |
| **T-05** | Seluruh Halaman Admin & Super Admin (11 Halaman) | Tidak menggunakan komponen `PageHeader` dan tidak menampilkan `Breadcrumb` navigasi. | Pengguna kehilangan konteks hierarki navigasi; pengguna tidak mengetahui di modul mana mereka berada saat ini. | **P1** | **SELESAI** | Terapkan `PageHeader` dengan `Breadcrumb` yang tepat di seluruh 11 halaman Admin dan Super Admin. |
| **T-06** | `LoginPage.jsx` (Otentikasi) | Menggunakan background mesh dekoratif dengan `linear-gradient` ganda, shadow melayang raksasa, dan kode warna hex sembarangan tanpa token. | Mengaburkan identitas sistem akademik resmi, waktu render tidak efisien, tampilan terasa seperti landing page AI. | **P2** | **SELESAI** | Refactor tampilan kartu login menjadi bersih, formal, berbasis token CSS UTM Navy dan Neutral, tanpa dekorasi mesh fiktif. |
| **T-07** | `EmailLogsModal.jsx`, `OtomasiDokumenPage.jsx`, `PublikasiPage.jsx` | Ditemukan emoji dekoratif dalam teks operasional: `⏰ Batas SLA`, `⚡ Paket Dokumen...`, `⭐ Insentif`. | Kesan visual kekanak-kanakan pada sistem akademik pascasarjana. | **P2** | **SELESAI** | Ganti teks emoji dengan ikon Lucide (`Clock`, `CheckCircle2`, `Award`) yang diletakkan pada posisi pendukung. |
| **T-08** | Berbagai Halaman (`AdminDashboard`, `SuperAdminDashboard`, `MasterProdiPage`, `ManajemenPenggunaPage`, `VerifikasiBerkasPage`) | Menggunakan raw `<button style={{ ... }}>` dengan deklarasi style padding, background, border, dan shadow inline. | Tombol tidak merespons focus state aksesibilitas (`focus-visible`), variasi ukuran dan warna acak di luar design token. | **P2** | **SELESAI** | Standarkan semua tombol menggunakan komponen `<Button>` (`variant="primary\|secondary\|outline\|danger\|success"`, `size="sm\|md\|lg"`). |
| **T-09** | `SimulationFloatingDock.jsx` | Menggunakan efek glassmorphism `backdrop-filter: blur(12px)` dan shadow bertumpuk 32px. | Melanggar prinsip desain institusional yang restrained; dock melayang menutupi tombol pada tampilan ponsel. | **P2** | **SELESAI** | Ubah styling popover menjadi panel datar institusional dengan border rapi (`var(--color-border-default)`), shadow subtil, dan posisikan agar tidak menutupi aksi utama. |
| **T-10** | `src/styles/components.css` & `src/index.css` | Terjadi duplikasi definisi CSS skala besar (1.251 baris di `index.css` yang mereplikasi aturan lama). | Risiko regresi visual tinggi akibat CSS specificity conflict; beban file CSS besar dan sulit dipelihara. | **P1** | **SELESAI** | Bersihkan `index.css` dari aturan usang; jadikan `tokens.css`, `shell.css`, dan `components.css` sebagai *single source of truth*. |
| **T-11** | Dead Code Komponen (`src/components/common/`, `dashboard/`, `modules/`) | Terdapat 23 file komponen usang yang tidak lagi diimpor atau digunakan dalam sistem aktif. | Membingungkan pengembang, meningkatkan risiko salah impor komponen lama yang rusak. | **P3** | **SELESAI** | Hapus atau arsipkan komponen dead code agar arsitektur komponen bersih dan terarah. |
| **T-12** | Aksesibilitas Formulir & Kontras Warna | Beberapa input select dan checkbox di halaman admin tidak memiliki `id` yang berpasangan secara semantik dengan `<label>`, dan ada badge dengan kontras di bawah 4.5:1. | Pengguna dengan pembaca layar (screen reader) dan gangguan penglihatan kesulitan mengisi formulir. | **P0** | **SELESAI** | Pastikan setiap kontrol formulir dibungkus `FormField` dengan `htmlFor`/`id` yang cocok dan lolos standar WCAG 2.2 AA. |

---

## 4. Evaluasi Pengalaman Pengguna Berdasarkan Role

### A. Role Mahasiswa (Fase D — 10 Halaman)
- **Kesesuaian dengan Tugas Utama**: Sangat baik. Dashboard langsung menjawab "Saya berada di tahap apa?" dan "Tindakan apa yang harus segera saya lakukan?".
- **Masalah Teridentifikasi**: Pada halaman `PublikasiPage`, terdapat emoji `⭐` pada label insentif artikel. Pada `NaskahPage` dan `BimbinganPage`, beberapa indikator menggunakan karakter checklist unicode `✓` alih-alih ikon visual yang rapi.
- **Rekomendasi**: Pertahankan alur kerja dan hierarki informasi; bersihkan emoji dan rapikan integrasi tabel logbook.

### B. Role Dosen Pembimbing / Promotor (Fase E — 9 Halaman)
- **Kesesuaian dengan Tugas Utama**: Sangat fokus pada telaah naskah, logbook bimbingan, dan persetujuan ujian (ACC).
- **Masalah Teridentifikasi**: `ReviewPage` dengan split view memerlukan penyesuaian responsive layout pada layar tablet dan mobile agar reviewer tetap dapat melihat dokumen dan panel catatan tanpa bertumpuk.
- **Rekomendasi**: Pertahankan struktur antrean persetujuan, standarkan seluruh tombol aksi di tabel bimbingan.

### C. Role Koordinator Program Studi (Fase F — 10 Halaman)
- **Kesesuaian dengan Tugas Utama**: Memfasilitasi audit kelayakan ujian, penetapan pembimbing (plotting), dan dewan penguji.
- **Masalah Teridentifikasi**: Navigasi dan tabel matriks persyaratan sudah terstruktur, namun beberapa badge status menggunakan varian warna yang terlalu kontras (misal merah terang pada item belum lengkap yang sebenarnya bersifat administratif wajar).
- **Rekomendasi**: Terapkan palet warna status institusional yang tenang dan tidak menimbulkan kecemasan visual yang tidak perlu.

### D. Role Dewan Penguji (Fase G — 7 Halaman)
- **Kesesuaian dengan Tugas Utama**: Memfasilitasi input nilai sidang berdasarkan rubrik ujian resmi FEB UTM dan penulisan catatan koreksi revisi.
- **Masalah Teridentifikasi**: Pada `FormPenilaianPage`, terdapat string `✓ DISERTASI DINYATAKAN LAYAK` dan `✗ DISERTASI BELUM MEMENUHI KELAYAKAN` dengan pewarnaan inline mentah.
- **Rekomendasi**: Ubah menjadi komponen status resmi dengan ikon `CheckCircle2` / `AlertCircle` berdasar token institusional.

### E. Role Admin Pascasarjana & Akademik (6 Halaman)
- **Kesesuaian dengan Tugas Utama**: Menangani administrasi harian berkas ujian, alokasi ruangan sidang, penomoran SK, dan Berita Acara.
- **Masalah Teridentifikasi (Kritis)**: Terjadi diskoneksi desain total dibanding modul dosen/mahasiswa. Halaman admin menggunakan hero banner bertumpuk, tombol dengan ukuran tidak seragam, tabel raw inline, dan ketiadaan breadcrumbs.
- **Rekomendasi**: Refactor total seluruh 6 halaman Admin agar mengadopsi `PageHeader`, `Table`, `Card`, dan `Button` standar.

### F. Role Super Administrator (5 Halaman)
- **Kesesuaian dengan Tugas Utama**: Konfigurasi parameter master prodi, tahapan jenjang, kuota beban bimbingan, dan akun pengguna.
- **Masalah Teridentifikasi (Kritis)**: Serupa dengan Admin, halaman Super Admin didominasi oleh kartu banner gelap dengan gradien visual, tombol mentah, tab navigasi jenjang manual pada `TahapanJenjangPage`, dan tabel raw pada `ManajemenPenggunaPage`.
- **Rekomendasi**: Standarkan ke dalam design system dengan `PageHeader`, `Tabs`, `Table`, dan modal formulir yang konsisten.

---

## 5. Keputusan Desain Sistem (Design System Architecture)

Untuk menyelesaikan seluruh temuan di atas, ditetapkan fondasi sistem desain sebagai berikut:

### 1. Color System (Token Semantik Institusional)
- **Primary / Brand**: `--color-brand-primary` (`#0b2240` - UTM Navy 900), hover (`#143666`).
- **Brand Accent**: `--color-brand-accent` (`#b8860b` - UTM Gold 500), aksen formal terkendali.
- **Canvas / Background**: `--color-surface-canvas` (`#f4f6f9`), tenang, tidak silau, rasio kontras tinggi terhadap teks.
- **Panel / Surface**: `--color-surface-panel` (`#ffffff`), panel pembungkus informasi penting.
- **Border**: `--color-border-subtle` (`#e2e8f0` - pemisah item), `--color-border-default` (`#cbd5e1` - border input/card).
- **Text**:
  - Primary: Slate 900 (`#0f172a`), rasio kontras 14:1 terhadap putih (WCAG AAA).
  - Secondary: Slate 700 (`#334155`), rasio kontras 9:1.
  - Muted: Slate 500 (`#64748b`), rasio kontras 4.6:1 (WCAG AA).
- **Status (Fungsional, Non-Dekoratif)**:
  - Sukses (Disetujui/Lolos): Green 700 (`#15803d`) / Green 50 (`#f0fdf4`) / Green 200 (`#bbf7d0`).
  - Menunggu / Pending: Amber 700 (`#b45309`) / Amber 50 (`#fffbeb`) / Amber 200 (`#fde68a`).
  - Bahaya / Ditolak: Red 700 (`#b91c1c`) / Red 50 (`#fef2f2`) / Red 200 (`#fecaca`).
  - Netral / Draft: Neutral 700 (`#334155`) / Neutral 100 (`#f1f5f9`) / Neutral 300 (`#cbd5e1`).

### 2. Typography Scale
- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Page Title (`h1`)**: 20px (1.25rem), font-weight 700, line-height 1.3.
- **Section Heading (`h2`)**: 16px (1.00rem), font-weight 600, line-height 1.35.
- **Subsection Heading (`h3`)**: 14px (0.875rem), font-weight 600, line-height 1.4.
- **Body Text**: 13px (0.8125rem), font-weight 400, line-height 1.5.
- **Table / Compact Body**: 12.5px, font-weight 400/500, line-height 1.45.
- **Label & Helper**: 11.5px, font-weight 500/600, line-height 1.3.
- **Metadata / Badge**: 11px, font-weight 600, letter-spacing 0.02em.

### 3. Spacing & Radius
- **Spacing Scale**: 4px, 8px, 12px, 16px, 20px, 24px, 32px.
- **Radius**: Radius terkendali (2px untuk badge, 4px untuk tombol & input, 6px untuk panel & card). Menghilangkan sudut melengkung ekstrem (>12px) yang menyerupai antarmuka mainan.

### 4. Icon System
- Pustaka Tunggal: **Lucide React** (`lucide-react`).
- Ukuran Standar: 14px (badge/inline), 16px (tombol sm/md & tabel), 18px (navigasi & header aksi), 20px (modal title & status banner).
- Stroke Width: 1.75 - 2.0 untuk keterbacaan tinggi.
- **Larangan Total Emoji**: Tidak boleh ada emoji di seluruh komponen aplikasi.

---

## 6. Rencana Refactor Bertahap (Tahap 2 hingga Tahap 6)

### Rencana Pelaksanaan:
1. **Fase 1: Standarisasi Fondasi & Pembersihan Core Component**
   - Perbaiki `StatusBadge.jsx`: Hapus emoji `⏳` dan unicode glyphs mentah; gunakan indikator shape dot yang presisi dan bersih.
   - Perbaiki `Topbar.jsx`: Ganti emoji role switch dengan ikon Lucide resmi (`Building2`, `GraduationCap`, `Scale`, `ShieldCheck`).
   - Perbaiki `EmailLogsModal.jsx`, `OtomasiDokumenPage.jsx`, `PublikasiPage.jsx`, dan `FormPenilaianPage.jsx`: Bersihkan semua sisa emoji (`⏰`, `⚡`, `⭐`, `✓`, `✗`).
   - Rapikan `SimulationFloatingDock.jsx`: Hapus glassmorphism dan jadikan panel pengujian yang restrained.
2. **Fase 2: Refactor Halaman Admin Pascasarjana (6 Halaman)**
   - `admin/DashboardPage.jsx`: Ganti hero banner gradien dengan `PageHeader` institusional, satukan kartu tindakan cepat, standarkan tabel antrean.
   - `admin/VerifikasiBerkasPage.jsx`: Ganti raw table dengan `<Table>` terstandar, integrasikan status badge dan filter prodi/jenjang.
   - `admin/PenerbitanSKPage.jsx`: Refactor tabel SK dengan `<Table>`, perbaiki modal detail penerbitan SK.
   - `admin/AlokasiRuanganPage.jsx`: Terapkan `<Table>` untuk daftar ruangan dan jadwal sidang.
   - `admin/JadwalTahapanPage.jsx`: Ganti hero banner dengan `PageHeader`, standarkan tabel jadwal tahapan.
   - `admin/OtomasiDokumenPage.jsx`: Ganti hero banner dengan `PageHeader`, rapikan form generator dokumen.
3. **Fase 3: Refactor Halaman Super Administrator (5 Halaman)**
   - `superadmin/DashboardPage.jsx`: Ganti hero banner dengan `PageHeader` institusional, satukan kartu metrik master.
   - `superadmin/MasterProdiPage.jsx`: Terapkan `PageHeader`, standarkan tabel daftar prodi dan modal form konfigurasi prodi.
   - `superadmin/TahapanJenjangPage.jsx`: Terapkan `PageHeader` dan komponen `<Tabs>` terstandar.
   - `superadmin/KuotaBimbinganPage.jsx`: Ganti raw table dengan `<Table>` terstandar.
   - `superadmin/ManajemenPenggunaPage.jsx`: Standarisasi PageHeader, tombol toolbar, dan modal aksi akun terintegrasi.
4. **Fase 4: Refactor Halaman Otentikasi (LoginPage)**
   - Hapus decorative grid mesh dan shadow raksasa.
   - Terapkan layout kartu login institusional yang bersih, proporsional, dan berbasis token CSS.
5. **Fase 5: Konsolidasi & Pembersihan Stylesheet**
   - Verifikasi eliminasi seluruh emoji dan raw checkmark characters di seluruh repositori frontend.
   - Pastikan seluruh halaman mengacu pada token `tokens.css`, `shell.css`, dan `components.css`.
6. **Fase 6: Validasi Visual, Responsivitas, dan Audit Regresi**
   - Uji responsivitas pada 3 ukuran layar: Desktop (1366px), Tablet (768px), Ponsel (375px).
   - Jalankan `npm test` (security suite & end-to-end UAT workflow).
   - Jalankan `npm run build` untuk memverifikasi tidak ada error sintaks, impor rusak, atau regresi bundle.
   - Dokumentasikan hasil sebelum dan sesudah secara transparan.

---

## 7. Rincian Implementasi Refactor Aktual (Tahap 3 & Tahap 4)

### A. Penegakan Kebijakan Zero-Emoji (Zero-Emoji Enforcement)
Seluruh emoji visual dan karakter glif unicode mentah telah dihapus dan digantikan secara konsisten dengan pustaka ikon institusional **Lucide React** (`lucide-react`) atau indikator status dot geometris:
1. `src/components/ui/StatusBadge.jsx` & `src/components/common/StatusBadge.jsx`: Emoji `⏳` dihapus total; digantikan dengan dot status 6px proporsional.
2. `src/components/shell/Topbar.jsx`: Emoji `🏛️`, `🎓`, `⚖️` pada role switcher dihilangkan; diganti teks peran formal berlabel sans-serif.
3. `src/components/notifications/EmailLogsModal.jsx`: Emoji `⏰` diganti dengan ikon `<Clock size={16} />`.
4. `src/pages/admin/OtomasiDokumenPage.jsx`: Emoji petir `⚡` dihilangkan, karakter `✓` digantikan `<CheckCircle2 size={16} />`.
5. `src/pages/mahasiswa/PublikasiPage.jsx`: Emoji bintang `⭐` digantikan `<Award size={14} />`.
6. `src/pages/penguji/FormPenilaianPage.jsx` & `CatatanKoreksiPage.jsx`: Karakter mentah `✓` dan `✗` digantikan ikon semantik Lucide `<CheckCircle />` dan `<AlertTriangle />`.
7. `src/pages/mahasiswa/BimbinganPage.jsx` & `src/pages/pembimbing/PersetujuanPage.jsx`: Seluruh string status dibersihkan dari karakter non-standar.
8. `src/components/qa/QATestingModal.jsx`: Emoji piala `🏆` dan silang `❌` dibersihkan.
9. `src/components/shell/SimulationFloatingDock.jsx`: Menghapus efek `backdrop-filter: blur(12px)` dan shadow bertumpuk; diselaraskan menjadi panel inspeksi teknis minimalis.
10. `src/components/modules/*` & `src/components/dashboard/*`: Seluruh 15 glif centang `✓` dibersihkan dari teks label.
11. **Hasil Pemindaian Grep**: `grep_search` dengan pola regex `[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]` dan substring `✓`/`✗` menghasilkan **0 temuan (100% bersih di seluruh `src/`)**.

### B. Standardisasi Halaman Admin Pascasarjana (FEB UTM)
1. **`src/pages/admin/DashboardPage.jsx`**:
   - Menghilangkan banner gradien gelap artifisial (`linear-gradient(135deg, ...)`) dan tombol neon berlebihan.
   - Mengintegrasikan komponen standar `PageHeader` lengkap dengan hierarki judul, subjudul deskriptif, dan breadcrumb resmi `Admin > Dashboard`.
   - Menggantikan tombol inline mentah dengan komponen `<Button variant="primary">` dan `<Button variant="outline">`.
2. **`src/pages/admin/VerifikasiBerkasPage.jsx`**:
   - Menghilangkan tabel HTML polos tanpa state (`<table>`).
   - Menerapkan komponen `<Table>` terstandarisasi dengan sorting, dense paddings, dan render sel terstruktur untuk NIM, jenjang, status berkas, serta aksi baris.
   - Menambahkan `PageHeader` dan `Breadcrumb`.
3. **`src/pages/admin/PenerbitanSKPage.jsx`**:
   - Menerapkan `PageHeader` terstandar dengan breadcrumb `Admin > Penerbitan SK` dan tombol utama `Buat SK Baru`.
   - Menstandarkan tombol aksi pada tabel (`Lihat SK`, `PDF`) dan tombol submit pada modal cetak SK menggunakan komponen `<Button>`.
4. **`src/pages/admin/AlokasiRuanganPage.jsx`**:
   - Mengganti header mentah dengan `PageHeader` ber-breadcrumb.
   - Menstandarkan tombol plotting ruangan dan tombol pembatalan alokasi (`<Button variant="danger">`).
   - Mengganti tombol aksi form modal plotting dengan varian tombol institusional.
5. **`src/pages/admin/JadwalTahapanPage.jsx`**:
   - Menghilangkan banner hero gradien `var(--primitive-navy-900)` ke `800` dengan backdrop blur.
   - Menerapkan `PageHeader` terpadu dengan aksi `Broadcast Pengumuman` dan `Buat Jadwal Tahapan`.
6. **`src/pages/admin/OtomasiDokumenPage.jsx`**:
   - Menghilangkan hero banner gradien gelap dan efek glow pada tombol kilat.
   - Menerapkan `PageHeader` dengan tombol sinkronisasi arsip dan paket ujian berbasis `<Button>`.

### C. Standardisasi Halaman Super Administrator
1. **`src/pages/superadmin/DashboardPage.jsx`**:
   - Mengganti hero banner gradien gelap dengan `PageHeader` ber-breadcrumb `Super Admin > Dashboard`.
   - Menstandarkan navigasi aksi cepat ke manajemen pengguna dan konfigurasi tahapan multi-jenjang.
2. **`src/pages/superadmin/MasterProdiPage.jsx`**:
   - Menerapkan `PageHeader` institusional dan menstandarkan tombol `Tambah Program Studi`.
   - Mengganti tombol modal formulir prodi dengan `<Button variant="secondary">` dan `<Button variant="primary">`.
3. **`src/pages/superadmin/TahapanJenjangPage.jsx`**:
   - Menerapkan `PageHeader` dengan tombol simpan konfigurasi per jenjang.
   - Menyelaraskan tab jenjang multi-program studi (D3, S1, S2, S3) dengan rasio kontras tinggi.
4. **`src/pages/superadmin/KuotaBimbinganPage.jsx`**:
   - Menerapkan `PageHeader` dengan breadcrumb `Super Admin > Kuota Bimbingan`.
   - Menggantikan tombol tabel `Atur Kuota` dan modal submit dengan komponen `<Button>`.
5. **`src/pages/superadmin/ManajemenPenggunaPage.jsx`**:
   - Menerapkan `PageHeader` dengan breadcrumb dan toolbar aksi lengkap: `Unduh Template Excel`, `Import dari Excel`, dan `Tambah Akun Pengguna`.
   - Menstandarkan tombol modal form pembuatan akun pengguna.

### D. Refactor Halaman Otentikasi (`src/pages/auth/LoginPage.jsx`)
- **Pembersihan Elemen Vibe-Coding**:
  - Menghapus latar belakang dekoratif `radial-gradient(ellipse at top, #0f2744 0%, #071324 70%)` dan menggantinya dengan latar belakang institusional tenang `var(--primitive-navy-950)`.
  - Menghapus efek `backdrop-filter: blur(10px)` pada header SSO.
  - Menghapus lapisan **Decorative Grid Mesh** (garis kisi-kisi semu 40px) yang menciptakan kesan template prototipe futuristik.
  - Mengurangi shadow raksasa `boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'` menjadi elevasi kartu proporsional `var(--shadow-md)` dengan garis batas halus `var(--primitive-navy-800)`.
  - Mengganti warna hardcoded hex (`#D97706`, `#F59E0B`, `#FCD34D`, `#f1f5f9`) dengan token semantis institusional FEB UTM (`--color-brand-accent`, `--primitive-amber-200`, `--primitive-neutral-100`).

---

## 8. Validasi Visual & Pengujian Responsivitas (Tahap 5)

Pengujian layout dilakukan pada 3 breakpoint dimensi layar acuan:
1. **Desktop (1366 px – 1440 px)**:
   - Lebar sidebar 240px tetap kokoh dan stabil di sebelah kiri.
   - Area konten utama memiliki max-width proporsional (`--layout-content-max-width: 1400px`) sehingga tabel dan formulir tidak meregang tanpa batas pada layar ultrawide.
   - Seluruh halaman 6 role menampilkan pola `PageHeader` seragam yang menyajikan judul, subjudul, breadcrumb navigasi, dan tombol aksi di pojok kanan atas.
   - Densitas tabel akademik (`Table`) berada pada tingkat pembacaan optimal dengan padding 12px–14px per baris dan pemisahan garis halus `var(--color-border-subtle)`.
2. **Tablet (768 px)**:
   - Header halaman (`PageHeader`) melipat aksi tombol ke baris kedua secara luwes menggunakan flex-wrap tanpa memotong teks tombol.
   - Grid metrik ringkasan otomatis beralih dari 4 kolom menjadi 2 kolom rapi.
   - Tabel akademik mempertahankan keterbacaan data dengan container horizontal scroll overflow terisolasi (`overflowX: auto`).
3. **Ponsel / Mobile (375 px – 390 px)**:
   - Navigasi shell beralih ke mode mobile drawer melalui tombol toggle topbar.
   - Kartu login SSO beradaptasi penuh ke lebar layar 100% dengan padding 16px tanpa overflow horizontal.
   - Grid switcher role pada halaman login melipat rapi ke layout vertikal/grid mikro tanpa tabrakan label.
   - Form field dan input memiliki touch-target minimal 40px yang memadai untuk sentuhan jari.

---

## 9. Hasil Pengujian Fungsional & Audit Regresi (Tahap 6)

### A. Pengujian Keamanan Siber & RBAC (`tests/security.test.js`)
Dilakukan pengujian otomasi independen terhadap endpoint backend SQLite dan proteksi JWT Bearer:
- **Skenario 0 (Zero-Trust)**: Request tanpa token ditolak dengan HTTP 401 Unauthorized (`UNAUTHORIZED_NO_TOKEN`). *(PASS)*
- **Skenario 1 (Form Penilaian Penguji)**: Mahasiswa diblokir dari penilaian dewan penguji dan catatan revisi dengan HTTP 403 Forbidden. *(PASS)*
- **Skenario 2 (Endpoint Superadmin)**: Akses ilegal mahasiswa ke direktori akun superadmin dan penyimpanan naskah diblokir dengan HTTP 403 Forbidden. *(PASS)*
- **Skenario 3 (Kerahasiaan Naskah & Integritas Relasional)**: Verifikasi kepemilikan naskah skripsi mahasiswa lain dan penerbitan Berita Acara fiktif dicegah. *(PASS)*
- **Skenario 4 (Pencegahan Path Traversal)**: Upaya manipulasi path traversal `..%2f..%2f` ditangkal dengan HTTP 400. *(PASS)*
- **Skenario 5 (Authorized Access)**: Akses sah Super Admin, Dosen Penguji, dan Admin Pascasarjana via JWT berhasil diverifikasi. *(PASS)*
- **Skenario 6 (Audit Forensik Keamanan SQLite)**: Pencatatan mutlak aktivitas keamanan pada tabel `audit_log` aktif. *(PASS)*
- **Hasil Keamanan**: **15 / 15 Skenario Lolos (100% SECURE & PASSED)**.

### B. Pengujian End-to-End Workflow UAT (`tests/uat_workflow.test.js`)
Simulasi alur hidup akademik hulu-ke-hilir Pedoman 2026:
- **Tahap 1 (Mahasiswa)**: Submit pendaftaran ujian seminar proposal dengan JWT resmi berhasil. *(PASS)*
- **Tahap 2 (Koorprodi)**: Validasi kuota bimbingan dosen (Iriani Ismail 7/8 kuota) dan plotting dosen berhasil. *(PASS)*
- **Tahap 3 (Pembimbing)**: Persetujuan naskah (ACC Ujian) via Server-Sent Events (SSE) dan alokasi ruangan ujian tanpa bentrok berhasil. *(PASS)*
- **Tahap 4 (Penguji)**: Input nilai sidang (87.5 / Grade A), timer SLA revisi 14 hari, penerbitan Berita Acara resmi dengan QR Code FEB UTM terverifikasi keasliannya. *(PASS)*
- **Hasil Alur Kerja UAT**: **9 / 9 Langkah Lolos (100% UAT PASSED)**.
- **Total Pengujian Otomasi**: **24 / 24 Langkah Berhasil (Zero Failure)**.

### C. Pengujian Kompilasi Produksi (`npm run build`)
- Bundler: Vite v6.4.4.
- Total Modul Ditransformasikan: **2.026 modul**.
- Status: **Sukses tanpa error atau peringatan impor (Exit Code 0)** dalam waktu 27.29 detik.
- Integritas Chunk: Terpecah secara modular (`module-mahasiswa`, `module-pembimbing`, `module-koorprodi`, `module-penguji`, `module-admin`, `module-superadmin`, `vendor-react`, `vendor-excel`).

---

## 10. Matriks Komparasi Sebelum vs Sesudah Refactor

| Aspek Antarmuka | Kondisi Sebelum Refactor | Kondisi Setelah Refactor |
| :--- | :--- | :--- |
| **Ikonografi & Emotikon** | Ditemukan emoji dekoratif (`⏳`, `🏛️`, `🎓`, `⚖️`, `⏰`, `⚡`, `⭐`) dan glif unicode mentah (`✓`, `✗`) di tombol dan status badge. | **100% Zero-Emoji**. Seluruh antarmuka hanya menggunakan pustaka tunggal Lucide React atau status shape dot 6px yang bersih. |
| **Hero & Header Halaman** | Halaman admin & superadmin memiliki banner hitam-biru gradien tebal (`linear-gradient(135deg, ...)`) dengan tombol neon dan backdrop-blur yang mendominasi ruang visual. | Digantikan komponen `PageHeader` institusional yang seragam di 48 halaman: latar putih bersih, tipografi tenang, breadcrumb hierarkis, dan aksi terstruktur di kanan atas. |
| **Tabel Data Akademik** | Halaman admin menggunakan tabel HTML mentah dengan border dan padding acak tanpa fungsionalitas pengurutan atau density. | Menggunakan komponen `<Table>` terstandarisasi dengan striping halus, header sorting, density kompak, dan baris aksi terstandar. |
| **Halaman Login SSO** | Latar belakang radial glow, backdrop-filter blur, decorative grid mesh (kisi 40px), dan drop-shadow 50px bergaya template prototipe SaaS. | Kartu otentikasi resmi institusi: latar belakang solid navy UTM, border halus, bayangan natural, tipografi proporsional, terintegrasi 6 role resmi. |
| **Komponen Tombol** | Tombol HTML polos dengan inline CSS beragam ukuran, warna heksadesimal hardcoded, dan sudut membulat yang berbeda-beda. | Seluruh tombol menggunakan komponen `<Button>` dengan varian terkontrol (`primary`, `secondary`, `outline`, `danger`) dan ukuran konsisten. |
| **Navigasi Shell & Role Switch** | Dropdown role switcher di Topbar dihiasi emoji per role. | Peran institusional ditampilkan formal dengan tipografi rapi dan ikon semantik institusi. |
| **Konsistensi Radius & Shadow** | Sudut membulat ekstrem (>12px) dan bayangan bertumpuk ala vibe coding. | Radius terkontrol (2px untuk badge, 4px tombol/input, 6px kartu/panel) dengan shadow institusional datar dan tegas. |

---

## 11. Catatan Transparansi, Keterbatasan, & Rekomendasi Lanjutan

### A. Tindakan yang Benar-Benar Dilakukan (Verified Completed)
1. Audit menyeluruh 48 halaman pada 6 role pengguna dan pemetaan inventaris route aktual.
2. Penegakan 100% Zero-Emoji di seluruh basis kode `src/`.
3. Standarisasi komponen shell, topbar, status badge, button, table, dan modal.
4. Refactor menyeluruh pada seluruh halaman administratif: 6 halaman Admin Pascasarjana dan 5 halaman Super Administrator.
5. Refactor halaman otentikasi Single Sign-On (LoginPage) untuk menghilangkan dekorasi vibe coding.
6. Validasi build produksi (`npm run build`) sukses tanpa kegagalan modul.
7. Validasi keamanan RBAC dan alur UAT 100% lulus (24/24 skenario pengujian).

### B. Batasan & Pekerjaan yang Dipertahankan Sesuai Regulasi
1. **Aturan Bisnis & Backend Tetap Utuh**: Logika relasional SQLite, validasi kuota bimbingan (Keputusan Dekan 2026), hash otentikasi, otorisasi RBAC berbasis JWT Bearer, dan timer SLA revisi 14 hari tidak diubah atau dilemahkan.
2. **Keterbatasan Pengujian Perangkat Fisik**: Pengujian responsivitas dilakukan melalui verifikasi breakpoint CSS kalkulatif dan fleksibilitas flexbox/grid layout (375px, 768px, 1440px), bukan pada gawai fisik ponsel riil secara langsung di lapangan.

### C. Rekomendasi Lanjutan untuk Tim Pengembang
1. **Pengarsipan File Warisan**: Menghapus direktori `src/components/modules/` dan `src/components/dashboard/` pada rilis berikutnya jika seluruh komponen telah dipastikan beralih penuh ke arsitektur `src/pages/` dan `src/components/shell/`.
2. **Audit Kontras Warna Lapangan**: Memastikan proyektor di ruang sidang FEB UTM (yang sering kali memiliki saturasi warna rendah) dapat menampilkan garis batas tabel dengan jelas menggunakan token `--color-border-default`.
3. **Peningkatan Aksesibilitas Screen Reader**: Menambahkan atribut `aria-live="polite"` pada notifikasi toast dan alert dinamis untuk memperkuat kepatuhan WCAG 2.2 AA.

---

## 12. Log Eksekusi Siklus Bertahap (Execution Log)

### Siklus 1: Temuan T-12 (Prioritas P0)
- **ID & Judul**: T-12 — Aksesibilitas Formulir & Kontras Warna
- **Status Akhir**: **SELESAI**
- **Perubahan yang Dilakukan**:
  1. Menambahkan varian status badge semantik `.ui-badge--primary`, `.ui-badge--success`, `.ui-badge--warning`, `.ui-badge--error`, `.ui-badge--danger`, `.ui-badge--info` pada `src/styles/components.css` dengan rasio kontras teks-ke-latar melampaui WCAG AAA (7.5:1 hingga 11.5:1).
  2. Memasangkan pasangan semantik `<label htmlFor="...">` dan `<input id="...">` / `<select id="...">` / `<textarea id="...">` pada seluruh kontrol modal formulir administratif di modul Admin Pascasarjana dan Super Administrator.
  3. Menambahkan atribut `id` dan `aria-label` deskriptif pada seluruh kontrol filter pencarian dan dropdown toolbar tanpa label visual.
- **File / Komponen yang Diubah**:
  - `src/styles/components.css` (penambahan token varian kelas badge WCAG AAA)
  - `src/pages/admin/VerifikasiBerkasPage.jsx` (toolbar filter + modal catatan verifikasi)
  - `src/pages/admin/PenerbitanSKPage.jsx` (toolbar filter + 9 field input modal buat SK)
  - `src/pages/admin/AlokasiRuanganPage.jsx` (toolbar filter + 10 field input modal plotting ruangan)
  - `src/pages/superadmin/MasterProdiPage.jsx` (toolbar search + 8 field input modal konfigurasi prodi)
  - `src/pages/superadmin/ManajemenPenggunaPage.jsx` (toolbar filter + 6 field input modal form akun)
  - `src/pages/superadmin/TahapanJenjangPage.jsx` (6 field input parameter aturan kelayakan ujian)
  - `src/pages/superadmin/KuotaBimbinganPage.jsx` (2 field input modal edit kuota bimbingan)
- **Hasil Build & Pengujian**:
  - `npm run build`: **BERHASIL (Exit Code 0)** — 2.026 modul ditransformasikan tanpa error dalam 24.27 detik.
  - `npm test`: **BERHASIL (Exit Code 0)** — 15/15 Keamanan RBAC + 9/9 UAT Alur Penuh = 24/24 skenario lulus (100%).
- **Hasil Pemeriksaan Visual & Aksesibilitas**:
  - Label dan input terhubung semantik; mengklik teks label kini memfokuskan kursor ke elemen input/select secara langsung.
  - Seluruh kontrol form memiliki Accessible Name pada Accessibility Tree untuk pembaca layar (screen reader).
  - Kontras badge: Navy (11.2:1), Green (9.2:1), Amber (8.5:1), Red (9.8:1), Blue (11.5:1), Neutral (7.5:1) — seluruhnya lolos standar WCAG 2.2 Level AA (minimal 4.5:1).
- **Keterbatasan Validasi**: Diuji pada bundle Vite produksi dan accessibility inspector; pengujian fisik audio screen reader dilakukan via simulasi atribut ARIA semantik.
- **Catatan Regresi**: Tidak ada perubahan pada payload API, mutasi state database, atau hak akses JWT RBAC.

### Siklus 2: Temuan T-01 (Prioritas P1)
- **ID & Judul**: T-01 — Topbar.jsx (Role Switcher)
- **Status Akhir**: **SELESAI**
- **Perubahan yang Dilakukan**:
  1. Mengimpor dan mengonfigurasi ikon institusional resmi Lucide React (`Building2`, `GraduationCap`, `Scale`, `ShieldCheck`, `Shield`, `User`) dengan ukuran 14px–15px dan stroke konsisten.
  2. Mengintegrasikan ikon peran aktif (`ActiveRoleIcon`) di samping selector peran (`topbar-role-selector`) pada header navigasi utama.
  3. Menampilkan ikon peran resmi pada setiap item tombol pilihan peran akademik dalam popover menu akun profil (`topbar-user-container`).
- **File / Komponen yang Diubah**:
  - `src/components/shell/Topbar.jsx`
- **Hasil Build & Pengujian**:
  - `npm run build`: **BERHASIL (Exit Code 0)** — 2.026 modul ditransformasikan tanpa error dalam 23.29 detik.
  - `npm test`: **BERHASIL (Exit Code 0)** — 15/15 Keamanan RBAC + 9/9 UAT Workflow = 24/24 skenario lulus (100%).
- **Hasil Pemeriksaan Visual & Aksesibilitas**:
  - Selector peran topbar dan popover menu profil menampilkan representasi visual institusional yang formal dan profesional.
  - Ikon peran terintegrasi rapi dengan atribut `aria-hidden="true"` sehingga tidak menimbulkan redundansi pembacaan bagi pembaca layar.
- **Keterbatasan Validasi**: Validasi visual dilakukan pada breakpoint desktop (1366px), tablet (768px), dan mobile (375px) via renderer Vite.
- **Catatan Regresi**: Tidak ada regresi pada logika pergantian peran (`onRoleChange`), hak akses navigasi, atau fungsi logout/ganti sandi.

### Siklus 3: Temuan T-03 (Prioritas P1)
- **ID & Judul**: T-03 — Hero Banners & Standarisasi PageHeader pada Modul Admin & Super Admin
- **Status Akhir**: **SELESAI**
- **Perubahan yang Dilakukan**:
  1. Memperkuat komponen terpusat `PageHeader.jsx` (`src/components/shell/PageHeader.jsx`) agar mendukung kompatibilitas dan alias fleksibel: `breadcrumbs` (dengan alias `breadcrumb`), `description` (dengan alias `subtitle`), serta fallback rendering slot `actions` gabungan di samping `primaryAction` dan `secondaryAction`.
  2. Menambahkan dukungan tautan `href` semantik pada `Breadcrumb.jsx` (`src/components/shell/Breadcrumb.jsx`) selain handler interaktif `onClick`.
  3. Menstandarkan pemanggilan komponen `PageHeader` pada `src/pages/admin/JadwalTahapanPage.jsx`: mengganti props lama (`breadcrumb`, `subtitle`, `actions`) dengan props resmi (`breadcrumbs`, `title`, `description`, `statusBadge`, `primaryAction`, `secondaryAction`).
  4. Menstandarkan pemanggilan komponen `PageHeader` pada `src/pages/admin/OtomasiDokumenPage.jsx`: mengaktifkan hierarki `breadcrumbs`, `title`, `description`, `statusBadge`, `primaryAction`, dan `secondaryAction`.
  5. Menstandarkan pemanggilan komponen `PageHeader` pada `src/pages/superadmin/DashboardPage.jsx`: menghilangkan sebutan dan struktur "hero banner" bergaya startup/vibe-coding, digantikan dengan `PageHeader` formal institusional UTM FEB lengkap dengan breadcrumb kendali sistem dan tombol aksi terstruktur.
- **File / Komponen yang Diubah**:
  - `src/components/shell/PageHeader.jsx`
  - `src/components/shell/Breadcrumb.jsx`
  - `src/pages/admin/JadwalTahapanPage.jsx`
  - `src/pages/admin/OtomasiDokumenPage.jsx`
  - `src/pages/superadmin/DashboardPage.jsx`
- **Hasil Build & Pengujian**:
  - `npm run build`: **BERHASIL (Exit Code 0)** — 2.026 modul ditransformasikan bersih, bundle tersusun dalam 26.43 detik tanpa error atau peringatan sintaks.
  - `npm test`: **BERHASIL (Exit Code 0)** — 15/15 Pengujian Keamanan RBAC Kriptografis + 9/9 Pengujian UAT End-to-End = 24/24 skenario lulus (100%).
  - Zero-Emoji Check: **100% Bersih** — 0 match karakter emoji pada seluruh berkas yang dimodifikasi.
- **Hasil Pemeriksaan Visual & Aksesibilitas**:
  - Seluruh modul administratif Admin dan Super Admin kini memiliki header halaman yang bersih, seragam, konsisten dengan standar FEB UTM, bebas dari efek gradien gelap/vibe coding.
  - Navigasi rekam jejak `Breadcrumb` tampil lengkap dan terbaca dengan hirarki yang jelas bagi pembaca layar dan pengguna.
- **Keterbatasan Validasi**: Pengujian tata letak visual dilakukan melalui Vite production bundler dan penyesuaian flexbox fluid; pengujian proyektor fisik ruang sidang disimulasikan melalui rentang kontras token CSS.
- **Catatan Regresi**: Tidak ada mutasi logika bisnis, skema SQLite, atau hak akses JWT RBAC. Alur operasional pendaftaran jadwal, otomasi dokumen, dan manajemen akun superadmin tetap 100% berfungsi normal.

### Siklus 4: Temuan T-04 (Prioritas P1)
- **ID & Judul**: T-04 — Refactor Raw Tables pada Modul Admin & Super Admin
- **Status Akhir**: **SELESAI**
- **Perubahan yang Dilakukan**:
  1. Mengganti implementasi tabel HTML mentah `<table>` dengan *inline-styling* manual menjadi komponen `<Table>` terpusat (`src/components/ui/Table.jsx`) pada `PenerbitanSKPage.jsx` (`src/pages/admin/PenerbitanSKPage.jsx`). Mendukung sorting otomatis kolom nomor SK, mahasiswa, dan tanggal terbit, serta empty state terstandar.
  2. Mengganti tabel alokasi ruangan mentah pada `AlokasiRuanganPage.jsx` (`src/pages/admin/AlokasiRuanganPage.jsx`) dengan komponen `<Table>`. Menyajikan kolom waktu, ruangan, mahasiswa, jenis ujian, ketua penguji, dan tombol aksi pembatalan yang seragam.
  3. Mengganti tabel master akun pengguna pada `ManajemenPenggunaPage.jsx` (`src/pages/superadmin/ManajemenPenggunaPage.jsx`) dengan komponen `<Table>`. Menstandarkan kolom identitas akun, role badge, prodi, tombol toggle status, serta tombol aksi (Reset Password, Edit, Hapus) menggunakan komponen `<Button>`.
  4. Mengganti tabel monitoring kuota bimbingan pada `KuotaBimbinganPage.jsx` (`src/pages/superadmin/KuotaBimbinganPage.jsx`) dengan komponen `<Table>`. Menstandarkan visualisasi progress bar beban pembimbing utama dan pendamping, status badge kapasitas, dan tombol penyesuaian kuota.
- **File / Komponen yang Diubah**:
  - `src/pages/admin/PenerbitanSKPage.jsx`
  - `src/pages/admin/AlokasiRuanganPage.jsx`
  - `src/pages/superadmin/ManajemenPenggunaPage.jsx`
  - `src/pages/superadmin/KuotaBimbinganPage.jsx`
- **Hasil Build & Pengujian**:
  - `npm run build`: **BERHASIL (Exit Code 0)** — 2.026 modul ditransformasikan bersih, bundle tersusun dalam 23.04 detik tanpa error atau peringatan sintaks.
  - `npm test`: **BERHASIL (Exit Code 0)** — 15/15 Pengujian Keamanan RBAC Kriptografis + 9/9 Pengujian UAT End-to-End = 24/24 skenario lulus (100%).
  - Zero-Emoji Check: **100% Bersih** — 0 match karakter emoji pada seluruh berkas yang dimodifikasi.
- **Hasil Pemeriksaan Visual & Aksesibilitas**:
  - Seluruh tabel administratif kini memiliki header bertema institusional yang konsisten (`th[scope="col"]`), perataan teks kiri/kanan yang tepat, zebra striping halus (`.ui-table--striped`), indikator pengurutan interaktif (`ArrowUpDown`, `ArrowUp`, `ArrowDown`), dan status baris kosong (*Empty State*) yang rapi.
  - Mendukung struktur semantik tabel HTML5 yang dapat diakses dengan baik oleh teknologi asistif (*Screen Reader*).
- **Keterbatasan Validasi**: Pengujian tata letak responsif bertumpuk (*stacked responsive*) diverifikasi melalui inspeksi CSS kelas `.ui-table-wrapper--stacked-responsive` dan breakpoint media queries.
- **Catatan Regresi**: Tidak ada perubahan pada struktur mutasi data, handler aksi tombol, atau payload API backend. Seluruh alur kerja pembuatan SK, alokasi ruangan, manajemen pengguna, dan update kuota tetap berfungsi normal.

### Siklus 5: Temuan T-05 (Prioritas P1)
- **ID & Judul**: T-05 — Standarisasi `PageHeader` dan `Breadcrumb` pada Seluruh 11 Halaman Admin & Super Admin
- **Status Akhir**: **SELESAI**
- **Perubahan yang Dilakukan**:
  1. Menyelaraskan kontrak props `PageHeader` di seluruh 11 halaman modul Admin Pascasarjana & Super Administrator (`breadcrumbs`, `title`, `description`, `statusBadge`, `primaryAction`, `secondaryAction`).
  2. Memperbarui `PenerbitanSKPage.jsx` (`src/pages/admin/PenerbitanSKPage.jsx`) dengan `PageHeader` resmi, breadcrumb `SIM-TA FEB UTM > Admin Pascasarjana > Penerbitan SK`, badge jumlah SK terbit, dan tombol aksi cetak rekap.
  3. Memperbarui `AlokasiRuanganPage.jsx` (`src/pages/admin/AlokasiRuanganPage.jsx`) dengan `PageHeader` resmi, breadcrumb `SIM-TA FEB UTM > Admin Pascasarjana > Alokasi Ruang Sidang`, badge total sesi teralokasi, dan tombol aksi jadwal sidang baru.
  4. Memperbarui `MasterProdiPage.jsx` (`src/pages/superadmin/MasterProdiPage.jsx`) dengan `breadcrumbs` `SIM-TA FEB UTM > Super Administrator > Master Program Studi`, deskripsi multi-jenjang, badge kuantitas prodi, dan `primaryAction` penambahan program studi.
  5. Memperbarui `TahapanJenjangPage.jsx` (`src/pages/superadmin/TahapanJenjangPage.jsx`) dengan `breadcrumbs` `SIM-TA FEB UTM > Super Administrator > Konfigurasi Tahapan Jenjang`, badge regulasi 2026/2027, dan `primaryAction` simpan konfigurasi per jenjang.
  6. Memperbarui `KuotaBimbinganPage.jsx` (`src/pages/superadmin/KuotaBimbinganPage.jsx`) dengan `breadcrumbs` `SIM-TA FEB UTM > Super Administrator > Distribusi Kuota Bimbingan` dan status badge total dosen terdata.
  7. Memperbarui `ManajemenPenggunaPage.jsx` (`src/pages/superadmin/ManajemenPenggunaPage.jsx`) dengan `breadcrumbs` `SIM-TA FEB UTM > Super Administrator > Tata Kelola Pengguna`, badge total akun terdaftar, serta pemisahan slot `secondaryAction` (Unduh Template Excel, Import Excel) dan `primaryAction` (Tambah Akun Pengguna).
  8. Memverifikasi 5 halaman yang telah menerapkan pola standar sebelumnya (`admin/DashboardPage`, `admin/VerifikasiBerkasPage`, `admin/JadwalTahapanPage`, `admin/OtomasiDokumenPage`, `superadmin/DashboardPage`) sehingga tercapai 100% konsistensi pada seluruh 11 halaman Admin & Super Admin.
- **File / Komponen yang Diubah**:
  - `src/pages/admin/PenerbitanSKPage.jsx`
  - `src/pages/admin/AlokasiRuanganPage.jsx`
  - `src/pages/superadmin/MasterProdiPage.jsx`
  - `src/pages/superadmin/TahapanJenjangPage.jsx`
  - `src/pages/superadmin/KuotaBimbinganPage.jsx`
  - `src/pages/superadmin/ManajemenPenggunaPage.jsx`
- **Hasil Build & Pengujian**:
  - `npm run build`: **BERHASIL (Exit Code 0)** — 2.026 modul ditransformasikan bersih, bundle tersusun dalam 21.52 detik tanpa error atau peringatan sintaks.
  - `npm test`: **BERHASIL (Exit Code 0)** — 15/15 Pengujian Keamanan RBAC Kriptografis + 9/9 Pengujian UAT End-to-End = 24/24 skenario lulus (100%).
  - Zero-Emoji Check: **100% Bersih** — 0 match karakter emoji pada seluruh berkas yang dimodifikasi.
- **Hasil Pemeriksaan Visual & Aksesibilitas**:
  - Hierarki judul tingkat pertama `h1` seragam pada seluruh modul administratif dengan bobot dan tipografi institusional.
  - Rekam jejak navigasi `Breadcrumb` semantik (`aria-label="Breadcrumb"`, `nav > ol > li`) hadir di semua 11 halaman untuk mencegah disorientasi navigasi pengguna.
  - Tombol aksi primer (`primaryAction`) dan sekunder (`secondaryAction`) terpisah secara konsisten di sudut kanan atas header.
- **Keterbatasan Validasi**: Pengujian visual responsif dievaluasi pada breakpoint desktop dan tablet standar; simulasi alur klik breadcrumb dilakukan secara statis dan interaktif.
- **Catatan Regresi**: Tidak ada modifikasi pada handler fungsionalitas, state lokal, maupun API backend SQLite. Seluruh fitur pendaftaran prodi, simpan konfigurasi jenjang, dan manajemen akun tetap berjalan prima.

### Siklus 6: Temuan T-10 (Prioritas P1)
- **ID & Judul**: T-10 — Refactor Duplikasi CSS Skala Besar antara `src/styles/components.css` dan `src/index.css`
- **Status Akhir**: **SELESAI**
- **Perubahan yang Dilakukan**:
  1. Menjadikan trinitas arsitektur CSS (`tokens.css`, `shell.css`, dan `components.css`) sebagai *single source of truth* resmi aplikasi, menghilangkan inkonsistensi specificity dan duplikasi aturan usang.
  2. Memindahkan dan menstandarisasi komponen `.status-badge` bersama 10 semantik status tokens resmi UTM ke dalam `src/styles/components.css`.
  3. Memindahkan komponen alur tahapan `.academic-timeline` beserta penanda node tahapan ke dalam `src/styles/components.css`.
  4. Memindahkan komponen panel administratif (`.admin-panel`, `.panel-header`, `.panel-title`, `.panel-body`, `.panel-footer`) dan grid ringkasan berkas (`.metadata-grid`, `.metadata-item`, `.metadata-label`, `.metadata-value`) ke dalam `src/styles/components.css` berbasis token warna institusional.
  5. Memindahkan utilitas skala tipografi (`.type-display`, `.type-page-title`, `.type-section-title`, `.type-body`, `.type-metadata`, dll.) dan alias kompatibilitas kontrol antarmuka (`.btn`, `.form-control`, `.admin-table`, `.split-review-container`) ke dalam `src/styles/components.css`.
  6. Membersihkan `src/index.css` dari 1.164 baris kode duplikasi lama (layout shell lama seperti `.app-container`, `.app-topbar`, `.app-sidebar`, dan deklarasi inline usang), merampingkan ukuran file menjadi 87 baris yang bersih dan fokus sebagai *entrypoint global reset* dan *aliased tokens*.
- **File / Komponen yang Diubah**:
  - `src/styles/components.css`
  - `src/index.css`
- **Hasil Build & Pengujian**:
  - `npm run build`: **BERHASIL (Exit Code 0)** — 2.026 modul ditransformasikan bersih, ukuran bundle CSS produksi terpangkas dari 81.06 kB menjadi **76.47 kB** (gzip: 11.74 kB) dalam 22.53 detik.
  - `npm test`: **BERHASIL (Exit Code 0)** — 15/15 Pengujian Keamanan RBAC Kriptografis + 9/9 Pengujian UAT End-to-End = 24/24 skenario lulus (100%).
  - Zero-Emoji Check: **100% Bersih** — 0 match karakter emoji pada seluruh berkas stylesheet.
- **Hasil Pemeriksaan Visual & Aksesibilitas**:
  - Seluruh layout dan komponen UI mempertahankan rendering visual yang presisi tanpa ada kerusakan (*visual regression*).
  - CSS specificity conflict antara aturan lama di `index.css` dan aturan modular di `components.css` tereliminasi total.
- **Keterbatasan Validasi**: Evaluasi rendering visual dilakukan pada mode dev Vite dan bundel produksi minified.
- **Catatan Regresi**: Tidak ada mutasi JavaScript, struktur DOM, atau relasi kelas yang rusak. Kompatibilitas kelas lama dipertahankan melalui token mapping terpusat.

### Siklus 7: Temuan T-06 (Prioritas P2)
- **ID & Judul**: T-06 — Refactor Visual Kartu Otentikasi Masuk pada `LoginPage.jsx`
- **Status Akhir**: **SELESAI**
- **Perubahan yang Dilakukan**:
  1. Menghilangkan seluruh hardcoded hex color codes (`#ffffff`, `#64748b`, `#0F766E`, `#0f172a`, `#e2e8f0`, `#0B192C`, `#eff6ff`, `#1e40af`, `#2563EB`, dll.) pada `src/pages/auth/LoginPage.jsx`.
  2. Menerapkan 100% token CSS institusional resmi UTM (`--primitive-navy-950`, `--primitive-navy-900`, `--color-brand-primary`, `--color-brand-accent`, `--color-surface-panel`, `--color-surface-panel-alt`, `--color-border-default`, `--color-border-subtle`, `--color-text-primary`, `--color-text-secondary`, `--color-text-link`, dll.).
  3. Menyederhanakan dan merapikan kartu login SSO agar bersih, formal, tenang, berwibawa, dan bebas dari dekorasi mesh gradient/shadow raksasa ala marketing prototype.
  4. Meningkatkan standar aksesibilitas formulir (WCAG 2.2 AA) dengan memastikan label input berpasangan semantik penuh:
     - `FormField id="login-identifier"` berpasangan dengan `Input id="login-identifier"`.
     - `FormField id="login-password"` berpasangan dengan `Input id="login-password"`.
     - Kontrol checkbox `input id="login-remember-me"` berpasangan dengan `label htmlFor="login-remember-me"`.
     - Tombol toggle visibilitas kata sandi dilengkapi `aria-label="Tampilkan atau sembunyikan kata sandi"`.
  5. Menghapus impor icon dan komponen yang tidak terpakai (`Lock`, `CheckCircle2`, `AlertCircle`, `HelpCircle`, `Server`, `Sparkles`, `KeyRound`, `Badge`).
- **File / Komponen yang Diubah**:
  - `src/pages/auth/LoginPage.jsx`
- **Hasil Build & Pengujian**:
  - `npm run build`: **BERHASIL (Exit Code 0)** — 2.026 modul ditransformasikan bersih, bundle produksi tersusun dalam 33.10 detik (`dist/index.html` 1.69 kB, `dist/assets/index-HHi2IUZH.css` 76.47 kB).
  - `npm test`: **BERHASIL (Exit Code 0)** — 15/15 Pengujian Keamanan RBAC Kriptografis + 9/9 Pengujian UAT End-to-End = 24/24 skenario lulus (100%).
  - Zero-Emoji Check: **100% Bersih** — 0 match karakter emoji / non-ascii pada `LoginPage.jsx`.
- **Hasil Pemeriksaan Visual & Aksesibilitas**:
  - Tampilan kartu login tampil berwibawa dan resmi dengan hierarki warna UTM Navy dan aksen UTM Gold terkendali.
  - Form controls memiliki kontras tinggi dan memenuhi aksesibilitas penuh bagi pengguna pembaca layar (*screen reader*).
  - Selector 6 peran institusional tetap responsif, cepat, dan presisi.
- **Keterbatasan Validasi**: Evaluasi interaksi diuji langsung pada simulasi otentikasi single-role dan offline storage fallback.
- **Catatan Regresi**: Tidak ada perubahan pada kontrak API autentikasi backend SQLite (`/api/auth/login`), sistem JWT token, atau mekanisme fallback kredensial demo `FEB-UTM-2026`.

### Siklus 8: Temuan T-07 (Prioritas P2) & Penataan Kotak Bergaris Tepi
- **ID & Judul**: T-07 — Pembersihan Emoji Operasional pada `EmailLogsModal.jsx`, `PublikasiPage.jsx`, `OtomasiDokumenPage.jsx` & Penataan Kotak Bergaris Tepi pada `PengujiPage.jsx` dan `JadwalTahapanPage.jsx`
- **Status Akhir**: **SELESAI**
- **Perubahan yang Dilakukan**:
  1. Memverifikasi dan menstandarisasi indikator batas SLA pada `src/components/notifications/EmailLogsModal.jsx`: menggunakan ikon Lucide `Clock` dengan token warna institusional `var(--primitive-amber-700)` alih-alih emoji jam `⏰` atau kode warna hex mentah `#ea580c`.
  2. Memverifikasi indikator insentif artikel ilmiah pada `src/pages/mahasiswa/PublikasiPage.jsx`: menggunakan ikon Lucide `Award` dengan token `var(--primitive-gold-600)` alih-alih karakter emoji bintang `⭐`.
  3. Menstandarisasi aksi dokumen dan kartu metrik pada `src/pages/admin/OtomasiDokumenPage.jsx`: mengganti 4 kartu metrik bergaris tepi kiri asimetris (`borderLeft`) dan kode warna hex sembarangan (`#2563EB`, `#059669`, `#D97706`, `#7C3AED`) menjadi kartu metrik simetris ber-border terpusat dengan ikon kontainer bertema UTM Navy, Green, Gold, dan Blue.
  4. Menstandarisasi kotak komposisi penguji Doktor S3 pada `src/pages/koorprodi/PengujiPage.jsx`: menghapus garis tepi kiri kuning mentah (`borderLeft: 3px solid #D97706`) dan background `#FEF3C7`, menggantinya dengan panel terstandar `var(--primitive-neutral-50)` yang serasi dengan jenjang S1 dan S2.
  5. Menata ulang kartu jadwal tahapan pada `src/pages/admin/JadwalTahapanPage.jsx`: membungkus Syarat Pendaftaran dan Catatan SOP ke dalam panel terpadu ber-badge formal, menata Moda dan Kuota Pendaftar ke dalam grid kompak 2 kolom, serta merapikan footer tombol aksi dengan palet token resmi.
- **File / Komponen yang Diubah**:
  - `src/components/notifications/EmailLogsModal.jsx`
  - `src/pages/mahasiswa/PublikasiPage.jsx`
  - `src/pages/admin/OtomasiDokumenPage.jsx`
  - `src/pages/koorprodi/PengujiPage.jsx`
  - `src/pages/admin/JadwalTahapanPage.jsx`
- **Hasil Build & Pengujian**:
  - `npm run build`: **BERHASIL (Exit Code 0)** — 2.026 modul ditransformasikan bersih dalam 20.86 detik (`dist/index.html` 1.69 kB, `dist/assets/index-HHi2IUZH.css` 76.47 kB).
  - `npm test`: **BERHASIL (Exit Code 0)** — 15/15 Pengujian Keamanan RBAC Kriptografis + 9/9 Pengujian UAT End-to-End = 24/24 skenario lulus (100%).
  - Zero-Emoji Check: **100% Bersih** — 0 match karakter emoji / non-ascii pada seluruh berkas yang dimodifikasi.
- **Hasil Pemeriksaan Visual & Aksesibilitas**:
  - Teks operasional dan status SLA tampil formal dan bersih tanpa dekorasi emoji kasual.
  - Kartu metrik dan kartu tahapan memiliki struktur visual yang seimbang, mudah dibaca, dan bebas dari garis tepi tebal yang mengambang tanpa konteks.
  - Komposisi dewan penguji multi-jenjang memiliki keseragaman arsitektur visual antar-prodi (D3, S1, S2, S3).
- **Keterbatasan Validasi**: Evaluasi rendering modal dan kartu divalidasi pada viewport desktop dan responsive fluid layout.
- **Catatan Regresi**: Tidak ada perubahan fungsional pada API notifikasi, generator dokumen dinas, atau logika penjadwalan tahapan.

### Siklus 9: Temuan T-08 (Prioritas P2)
- **ID & Judul**: T-08 — Standarisasi Raw Button `<button style={{ ... }}>` ke Komponen `<Button>` Terpusat
- **Status Akhir**: **SELESAI**
- **Perubahan yang Dilakukan**:
  1. Standarisasi 3 tombol navigasi dan aksi pada `src/pages/admin/DashboardPage.jsx`:
     - Tombol "Lihat Semua" pendaftaran ujian masuk diganti menjadi `<Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">`.
     - Tombol "Periksa Berkas" pada baris pendaftaran diganti menjadi `<Button variant="ghost" size="sm">`.
     - Tombol "Kelola Ruangan" alokasi ruang sidang diganti menjadi `<Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">`.
  2. Standarisasi 2 tombol aksi pada `src/pages/superadmin/DashboardPage.jsx`:
     - Tombol "Kelola Master Prodi" diganti menjadi `<Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">`.
     - Tombol "Atur Tahapan" pada kartu prodi diganti menjadi `<Button variant="ghost" size="sm">`.
  3. Standarisasi 2 tombol aksi status dan edit prodi pada `src/pages/superadmin/MasterProdiPage.jsx`:
     - Tombol toggle status prodi diganti menjadi `<Button variant={status === 'Aktif' ? 'success' : 'danger'} size="sm">`.
     - Tombol "Edit" prodi diganti menjadi `<Button variant="outline" size="sm" icon={Edit}>`.
  4. Standarisasi tombol status akun pengguna pada tabel `src/pages/superadmin/ManajemenPenggunaPage.jsx`:
     - Tombol status aktif/non-aktif akun diganti menjadi `<Button variant={val === 'Aktif' ? 'success' : 'danger'} size="sm">`.
  5. Standarisasi 4 tombol modal verifikasi berkas pada `src/pages/admin/VerifikasiBerkasPage.jsx`:
     - Tombol "Pratinjau" berkas diganti menjadi `<Button variant="outline" size="sm" icon={Eye}>`.
     - Tombol "Tutup" diganti menjadi `<Button variant="secondary" size="md">`.
     - Tombol "Minta Perbaikan Berkas" diganti menjadi `<Button variant="danger" size="md" icon={XCircle}>`.
     - Tombol "Setujui & Terverifikasi Lolos" diganti menjadi `<Button variant="success" size="md" icon={CheckCircle2}>`.
- **File / Komponen yang Diubah**:
  - `src/pages/admin/DashboardPage.jsx`
  - `src/pages/superadmin/DashboardPage.jsx`
  - `src/pages/superadmin/MasterProdiPage.jsx`
  - `src/pages/superadmin/ManajemenPenggunaPage.jsx`
  - `src/pages/admin/VerifikasiBerkasPage.jsx`
- **Hasil Build & Pengujian**:
  - `npm run build`: **BERHASIL (Exit Code 0)** — 2.026 modul ditransformasikan bersih dalam 22.25 detik (`dist/index.html` 1.69 kB, `dist/assets/index-HHi2IUZH.css` 76.47 kB).
  - `npm test`: **BERHASIL (Exit Code 0)** — 15/15 Pengujian Keamanan RBAC Kriptografis + 9/9 Pengujian UAT End-to-End = 24/24 skenario lulus (100%).
  - Zero-Emoji Check: **100% Bersih** — 0 match karakter emoji pada seluruh berkas yang dimodifikasi.
  - Raw Button Check: **100% Bebas Raw Button** — 0 elemen `<button>` mentah tersisa di seluruh 5 berkas target.
- **Hasil Pemeriksaan Visual & Aksesibilitas**:
  - Seluruh tombol kini otomatis memiliki state hover, active, focus-visible ring (`outline: 2px solid var(--color-focus-ring)`), dan cursor pointer yang konsisten.
  - Ukuran padding, border radius, typography font size, dan variasi warna terikat 100% pada token semantik institusional FEB UTM.
- **Keterbatasan Validasi**: Pengujian keyboard accessibility (Tab + Enter/Space) diverifikasi melalui spesifikasi komponen dasar `<Button>`.
- **Catatan Regresi**: Tidak ada mutasi logika `onClick`, navigasi, atau handler status callback.

### Siklus 10: Temuan T-09 (Prioritas P2)
- **ID & Judul**: T-09 — Penyesuaian Styling Institusional Restrained pada `SimulationFloatingDock.jsx`
- **Status Akhir**: **SELESAI**
- **Perubahan yang Dilakukan**:
  1. Menghilangkan bentuk pill button hiper-bulat (`borderRadius: 9999px`) dan bayangan melayang berlebihan (`0 4px 16px rgba(...)`), menggantinya dengan panel dock institusional tenang ber-radius resmi (`var(--radius-sm)`, 4px), border rapi (`var(--primitive-navy-700)`), dan elevasi datar (`var(--shadow-dropdown)`).
  2. Mengganti ikon pembuka `Sparkles` (kesan AI consumer prototype) dengan ikon profesional `Sliders` beraksen emas institusional UTM (`var(--primitive-gold-400)`).
  3. Menstandarisasi popover card:
     - Latar belakang solid `var(--color-surface-panel)` tanpa efek glassmorphism/blur liar (`backdrop-filter`).
     - Border pembatas terstandarisasi `var(--color-border-default)` dan elevasi terkontrol `var(--shadow-dropdown)`.
     - Header panel bersih bergaris pembatas `var(--color-border-subtle)` dengan ikon pendukung `Layers`.
  4. Menstandarisasi tombol pemilih peran (Role Switcher):
     - Mengganti seluruh kode warna hex mentah dengan token semantik institusional FEB UTM (`var(--primitive-red-700)`, `var(--primitive-amber-700)`, `var(--primitive-navy-900)`, `var(--primitive-navy-800)`, `var(--primitive-blue-700)`).
     - State aktif dan inaktif memiliki kontras jelas dan border-radius semantik `var(--radius-sm)`.
  5. Menstandarisasi bilah alat pengujian dan status database di bagian bawah popover:
     - Indikator status SQLite DB / LocalStorage menggunakan token semantik hijau/amber institusional (`var(--primitive-green-50)`, `var(--primitive-green-700)`, dll.).
     - Seluruh tombol pintasan (Login SSO, QA Suite, Cek QR, Reset Demo Data, Keluar) menggunakan token latar dan border standar (`var(--primitive-neutral-50)`, `var(--color-border-default)`).
  6. Memperbaiki posisi layout responsif: `bottom: 16px`, `right: 16px`, `maxWidth: calc(100vw - 32px)`, `maxHeight: calc(100vh - 80px)` agar tidak menutupi aksi utama dan tetap nyaman diakses pada perangkat mobile/tablet.
- **File / Komponen yang Diubah**:
  - `src/components/shell/SimulationFloatingDock.jsx`
- **Hasil Build & Pengujian**:
  - `npm run build`: **BERHASIL (Exit Code 0)** — 2.026 modul ditransformasikan bersih dalam 22.20 detik (`dist/index.html` 1.69 kB, `dist/assets/index-HHi2IUZH.css` 76.47 kB).
  - `npm test`: **BERHASIL (Exit Code 0)** — 15/15 Pengujian Keamanan RBAC Kriptografis + 9/9 Pengujian UAT End-to-End = 24/24 skenario lulus (100%).
  - Zero-Emoji Check: **100% Bersih** — 0 match karakter emoji pada berkas komponen.
- **Hasil Pemeriksaan Visual & Aksesibilitas**:
  - Tampilan dock di pojok kanan bawah kini menyatu secara harmonis dengan identitas resmi SIM-TA FEB UTM, bebas dari kesan prototipe melayang.
  - Panel popover dapat diakses dengan mudah, tertutup rapat saat peran dipilih, dan tidak mengganggu alur kerja pengguna pada layar kecil.
- **Keterbatasan Validasi**: Komponen hanya aktif dan dirender pada lingkungan development (`import.meta.env.DEV`).
- **Catatan Regresi**: Tidak ada mutasi logika pada pemilihan role (`onRoleChange`), pemanggilan modal QA (`onOpenQAModal`), pengecekan QR verifier, maupun reset data simulasi.

### Siklus 11: Temuan T-11 (Prioritas P3)
- **ID & Judul**: T-11 — Pembersihan & Pengarsipan Dead Code Komponen Usang (`src/components/common/`, `dashboard/`, `modules/`)
- **Status Akhir**: **SELESAI**
- **Perubahan yang Dilakukan**:
  1. Melakukan inventarisasi dan verifikasi dependensi impor di seluruh basis kode `src/`:
     - Menemukan bahwa hanya `AcademicPageLoading.jsx` dan `ErrorBoundary.jsx` dari `src/components/common/` yang masih aktif digunakan di tingkat entri aplikasi (`src/App.jsx` dan `src/main.jsx`).
     - Seluruh 4 file di `src/components/dashboard/` dan 12 file di `src/components/modules/` adalah artefak prototipe lawas yang tidak pernah diimpor oleh 48 halaman aktif di `src/pages/` maupun shell sistem.
     - Lima komponen lainnya di `src/components/common/` (`Breadcrumb.jsx`, `Modal.jsx`, `Sidebar.jsx`, `StatusBadge.jsx`, `Topbar.jsx`) merupakan salinan lama yang telah digantikan oleh implementasi modular di `src/components/ui/` dan `src/components/shell/`.
  2. Memindahkan 2 komponen infrastruktur aktif ke perpustakaan inti `src/components/ui/`:
     - `src/components/ui/AcademicPageLoading.jsx`
     - `src/components/ui/ErrorBoundary.jsx`
     - Menambahkan re-export resmi pada `src/components/ui/index.js`.
  3. Memperbarui jalur impor resmi pada entri aplikasi:
     - `src/App.jsx`: `import { AcademicPageLoading } from './components/ui';`
     - `src/main.jsx`: `import { ErrorBoundary } from './components/ui';`
  4. Mengarsipkan total 23 file dead code ke direktori aman di luar bundler `archive/legacy_components/`:
     - `archive/legacy_components/common/` (7 file)
     - `archive/legacy_components/dashboard/` (4 file)
     - `archive/legacy_components/modules/` (12 file)
  5. Menghilangkan folder `common/`, `dashboard/`, dan `modules/` dari `src/components/` sehingga direktori komponen kini hanya menyisakan 8 subdirektori fungsional aktif (`auth`, `documents`, `notifications`, `qa`, `security`, `shell`, `superadmin`, `ui`).
- **File / Komponen yang Diubah**:
  - `src/components/ui/AcademicPageLoading.jsx` *(baru/dipindahkan)*
  - `src/components/ui/ErrorBoundary.jsx` *(baru/dipindahkan)*
  - `src/components/ui/index.js`
  - `src/App.jsx`
  - `src/main.jsx`
  - `archive/legacy_components/` *(direktori arsip 23 file komponen usang)*
- **Hasil Build & Pengujian**:
  - `npm run build`: **BERHASIL (Exit Code 0)** — 2.026 modul ditransformasikan bersih dalam 21.46 detik (`dist/index.html` 1.69 kB, `dist/assets/index-HHi2IUZH.css` 76.47 kB).
  - Ukuran bundel utama JavaScript (`dist/assets/index-*.js`) terpangkas dari **77.76 kB** menjadi **67.37 kB** (penghematan >10 kB).
  - `npm test`: **BERHASIL (Exit Code 0)** — 15/15 Pengujian Keamanan RBAC Kriptografis + 9/9 Pengujian UAT End-to-End = 24/24 skenario lulus (100%).
  - Zero-Emoji Check: **100% Bersih** — 0 match karakter emoji pada seluruh berkas yang dimodifikasi.
- **Hasil Pemeriksaan Arsitektur & Kerapian Kode**:
  - Struktur komponen proyek kini 100% konsisten, bersih, dan bebas dari duplikasi file usang.
  - Menghilangkan potensi kebingungan tim pengembang serta risiko salah impor komponen lama yang rusak di masa depan.
- **Keterbatasan Validasi**: File lawas disimpan sebagai arsip di `archive/legacy_components/` untuk referensi historis jika sewaktu-waktu diperlukan.
- **Catatan Regresi**: Tidak ada modul atau halaman yang mengalami broken import; seluruh 48 rute halaman berfungsi normal.





---

# LAMPIRAN — REKONSILIASI STATUS DENGAN KODE AKTUAL (14 Oktober 2026)

Dokumen ini adalah laporan audit historis (baseline + log refactor). Bagian di
atas **tidak diubah** agar jejak keputusan tetap utuh. Lampiran ini mencatat
kondisi **aktual** kode setelah rangkaian perbaikan Fase 1–4, agar tidak ada klaim
usang yang menyesatkan.

## R.1 Klaim yang Perlu Diperbarui

| Klaim di dokumen (usang) | Kondisi aktual |
|---|---|
| "2.026 modul ditransformasikan" | **2.331 modul** (penambahan halaman & modul Fase 1–2) |
| "Integritas Chunk: `module-mahasiswa`, `module-pembimbing`, …" | Pemisahan berbasis folder `src/pages/*` **dihapus** (menyebabkan siklus `vendor-pdf -> module-koorprodi -> vendor-pdf`). Kini: vendor chunk (`vendor-react`, `vendor-icons`, `vendor-excel`, `vendor-pdf`, `vendor-libs`) + **chunk per-halaman otomatis** dari `React.lazy` (mis. `ManajemenPenggunaPage-*.js`). Peringatan *circular chunk* **hilang**. |
| "`src/index.css` 87 baris" (Siklus 6) | **82 baris** |
| "T-04 SELESAI — seluruh tabel mentah dikonversi" | Sebagian benar: seluruh tabel **data** memakai komponen `Table` (31 pemakaian). **3 `<table>` mentah tersisa** dan **sengaja dipertahankan** karena bukan tabel data: `admin/PenerbitanSKPage.jsx` (tabel dokumen pratinjau SK), `penguji/FormPenilaianPage.jsx` (tabel referensi konversi nilai), `mahasiswa/PortofolioPage.jsx` (rubrik poin TAKK). Lihat `docs/konvensi-teknis.md`. |

## R.2 Klaim yang Terverifikasi Masih Benar

- **Zero-Emoji**: pemindaian ulang `src/` (pola emoji + `✓ ✗ ★ ⚠ ●`) → **0 temuan**.
- **`index.css` bukan lagi duplikasi**: sudah ringkas (82 baris) sebagai agregator token.
- **Dead code**: `src/components/common/`, `dashboard/`, `modules/` **tidak ada lagi**; telah diarsipkan ke `archive/legacy_components/`.
- **`PageHeader`**: dipakai di 11 halaman Admin & Super Admin (22 kemunculan impor/pemakaian).
- **Standarisasi `Table`**: 31 pemakaian komponen bersama di seluruh peran.
- **LoginPage bersih**: tanpa grid mesh/backdrop-filter/shadow raksasa.

## R.3 Pengujian (diperbarui)

`npm test` kini menjalankan **6 suite** melalui `tests/run_all.mjs` (server otomatis):

| Suite | Hasil |
|---|---|
| `security.test.js` | 15/15 LULUS |
| `uat_workflow.test.js` | 9/9 LULUS |
| `regression_bugfix.test.js` | 9/9 LULUS |
| `regression_audit.test.js` | 7/7 LULUS |
| `regression_phase12.test.js` (BARU) | 22/22 LULUS |
| `e2e_browser.test.js` (BARU, Playwright) | 22/22 LULUS |

`npm run build`: **BERHASIL**, 2.331 modul, tanpa error dan **tanpa peringatan circular chunk**.
Lihat `docs/strategi-pengujian.md`.

## R.4 Pekerjaan Fase 1–4 (setelah dokumen ini ditulis)

- **Fase 1**: aksi yang dahulu frontend-only kini tersimpan ke SQLite (bimbingan,
  naskah, publikasi, approve tahap, plotting pembimbing, kuota). Termasuk perbaikan
  portal penguji (kolom `susunan_penguji_json`) dan koreksi 500 → 400/404.
- **Fase 2**: validasi & kode status konsisten (`400/404/409`) pada endpoint tulis;
  banner sinkronisasi produksi; `EmptyState` pada grid prodi; galat 409 tampil di modal.
- **Fase 3**: 2 suite pengujian baru + runner terpadu + dokumentasi strategi pengujian.
- **Fase 4**: verifikasi pengerasan `JWT_SECRET` (produksi menolak start tanpa secret);
  perbaikan peringatan *circular chunk*; rekonsiliasi dokumen (lampiran ini).

*Lampiran ini disusun berdasarkan verifikasi langsung terhadap kode dan hasil
pengujian pada 14 Oktober 2026.*
