# LAPORAN SIMULASI PROSES BISNIS A–Z
## SIM-TA FEB UNIVERSITAS TRUNOJOYO MADURA

**Tanggal:** 22/10/2026, 00.28.46 WIB  
**Target:** `http://localhost:5001` (API + SPA produksi, `NODE_ENV=production`)  
**Metode:** setiap langkah benar-benar memanggil API dan memeriksa efeknya di basis data.

## 1. Ringkasan

| Metrik | Nilai |
| :--- | ---: |
| Total langkah diuji | 291 |
| Lulus | 291 |
| Gagal | 0 |
| Catatan temuan | 0 |
| Tingkat keberhasilan | 100% |

## 2. Ringkasan per Fase

| Fase | Lulus | Gagal | Catatan |
| :--- | ---: | ---: | ---: |
| FASE A — AUTENTIKASI, IDENTITAS & MANAJEMEN SESI | 14 | 0 | 0 |
| FASE B — MASTER DATA & TATA KELOLA (SUPER ADMIN) | 17 | 0 | 0 |
| FASE C — KALENDER AKADEMIK & PEMBUKAAN GELOMBANG (ADMIN) | 5 | 0 | 0 |
| FASE D — PENDAFTARAN UJIAN & PEMENUHAN PERSYARATAN (MAHASISWA) | 11 | 0 | 0 |
| FASE E — VERIFIKASI KELAYAKAN BERKAS (ADMIN AKADEMIK) | 4 | 0 | 0 |
| FASE F — PLOTTING PEMBIMBING (KOORDINATOR PRODI) | 6 | 0 | 0 |
| FASE G — SIKLUS BIMBINGAN (MAHASISWA & PEMBIMING) | 8 | 0 | 0 |
| FASE H — UNGGAH NASKAH, REVIEW & KOMENTAR PEMBIMBING | 8 | 0 | 0 |
| FASE I — PUBLIKASI ILMIAH & VERIFIKASI | 4 | 0 | 0 |
| FASE J — STATE MACHINE TAHAPAN TUGAS AKHIR (AJUKAN → APPROVE → VERIFIKASI → SELESAI) | 27 | 0 | 0 |
| FASE K — PENJADWALAN SIDANG, ALOKASI RUANG & DEWAN PENGUJI | 8 | 0 | 0 |
| FASE L — PENILAIAN DEWAN PENGUJI (RUBRIK BERBOBOT) | 8 | 0 | 0 |
| FASE M — CATATAN KOREKSI PENGAJU & PENYELESAIAN REVISI | 5 | 0 | 0 |
| FASE N — DOKUMEN RESMI, QR VERIFIKASI & ARSIP | 12 | 0 | 0 |
| FASE O — PENYIMPANAN BERKAS (UNGGAH, UNDUH, HAPUS) | 8 | 0 | 0 |
| FASE P — NOTIFIKASI, BROADCAST & EMAIL INSTITUSIONAL | 9 | 0 | 0 |
| FASE Q — LAPORAN, PROGRESS & MONITORING | 5 | 0 | 0 |
| FASE R — PENCADANGAN & PEMULIHAN BENCANA (DISASTER RECOVERY) | 4 | 0 | 0 |
| FASE S — PERGANTIAN SEMESTER (QUOTA RECLAIM & BRIDGING) | 5 | 0 | 0 |
| FASE T — KONSISTENSI DATA, KONSISTENSI AKHIR & KEAMANAN | 7 | 0 | 0 |
| FASE U — CAKUPAN JENJANG S1 / S2 / S3 / D3 | 116 | 0 | 0 |

## 3. Rincian Langkah


### FASE A — AUTENTIKASI, IDENTITAS & MANAJEMEN SESI

- ✅ **Login akun mahasiswa (210211100142)** — `status=200`
- ✅ **Login akun dosen (196201081987032001)** — `status=200`
- ✅ **Login akun dosen2 (196203031988032001)** — `status=200`
- ✅ **Login akun dosen3 (196306231989031002)** — `status=200`
- ✅ **Login akun penguji (197703032003121002)** — `status=200`
- ✅ **Login akun koorprodi (197802142003122001)** — `status=200`
- ✅ **Login akun admin (198104122008121002)** — `status=200`
- ✅ **Login akun superadmin (197405102000031001)** — `status=200`
- ✅ **Profil /auth/me terbaca** — `role=mahasiswa`
- ✅ **Endpoint terlindungi menolak anonim** — `status=401`
- ✅ **Switch-role dosen -> penguji** — `status=200`
- ✅ **Switch-role mahasiswa -> superadmin DITOLAK** — `status=403`
- ✅ **Permintaan pemulihan kata sandi tidak membocorkan email** — `status=200`
- ✅ **Token mati setelah logout (sesi dicabut)** — `status=401`

### FASE B — MASTER DATA & TATA KELOLA (SUPER ADMIN)

- ✅ **Baca daftar program studi** — `jumlah=4`
- ✅ **Buat program studi baru** — `status=200 Program studi S-1 Manajemen (Simulasi A-Z) berhasil ditambahkan ke database.`
- ✅ **Ubah program studi** — `status=200`
- ✅ **Perubahan program studi tersimpan** — `terdaftar=true`
- ✅ **Baca pagu kuota bimbingan dosen** — `jumlah=7`
- ✅ **Ubah pagu kuota dosen** — `status=200`
- ✅ **Baca template tahapan per jenjang** — `jenjang=D3,S1,S2,S3`
- ✅ **Template S1 memiliki tahapan** — `jumlah=4`
- ✅ **Ubah template tahapan S1** — `status=200`
- ✅ **Template tahapan TIDAK dapat dihapus dengan larik kosong (400)** — `status=400`
- ✅ **Template tahapan S1 utuh setelah percobaan penghapusan** — `jumlah=4`
- ✅ **Buat akun mahasiswa simulasi** — `status=200`
- ✅ **Akun baru memperoleh kata sandi sementara ACAK (bukan default seragam)** — `pwd acak tersedia`
- ✅ **Akun simulasi terdaftar** — `id=usr-1792603714064`
- ✅ **Ubah data akun** — `status=200`
- ✅ **Reset kata sandi menerbitkan sandi sementara acak** — `status=200`
- ✅ **Daftar pengguna tidak membocorkan kata sandi/hash**

### FASE C — KALENDER AKADEMIK & PEMBUKAAN GELOMBANG (ADMIN)

- ✅ **Baca kalender tahapan** — `jumlah=22`
- ✅ **Buka gelombang pendaftaran** — `status=200 Jadwal tahapan berhasil dibuat dan disimpan di basis data.`
- ✅ **Ubah jadwal tahapan** — `status=200`
- ✅ **Perubahan jadwal tersimpan di basis data** — `target=60`
- ✅ **Hapus jadwal tahapan** — `status=200`

### FASE D — PENDAFTARAN UJIAN & PEMENUHAN PERSYARATAN (MAHASISWA)

- ✅ **Mahasiswa simulasi login dengan kata sandi sementara**
- ✅ **Entri Tugas Akhir mahasiswa simulasi dibuat sebelum pendaftaran** — `status=201 id=ta-210211990001`
- ✅ **Plotting pembimbing sebelum tahapan pertama** — `status=200`
- ✅ **Tahap 1 ajukan -> berhasil** — `status=200`
- ✅ **Tahap 1 approve -> berhasil** — `status=200`
- ✅ **Tahap 1 verifikasi -> berhasil** — `status=200`
- ✅ **Tahap 1 selesai -> berhasil** — `status=200`
- ✅ **Mahasiswa mendaftar-upload berkas persyaratan** — `status=201 Pendaftaran ujian mahasiswa berhasil diajukan dan disimpan ke database.`
- ✅ **Berkas pendaftaran masuk antrean verifikasi** — `id=berkas-sim-1792603714792`
- ✅ **Metrik akademik tersimpan bersama berkas** — `IPK 3.74 tercatat`
- ✅ **Mahasiswa tidak dapat membaca antrean verifikasi admin** — `status=403`

### FASE E — VERIFIKASI KELAYAKAN BERKAS (ADMIN AKADEMIK)

- ✅ **Admin membaca antrean berkas** — `jumlah=74`
- ✅ **Admin memverifikasi berkas** — `status=200 Status verifikasi berkas berhasil diperbarui di basis data.`
- ✅ **Status verifikasi tersimpan** — `status=Terverifikasi`
- ✅ **Admin dapat menolak berkas** — `status=200`

### FASE F — PLOTTING PEMBIMBING (KOORDINATOR PRODI)

- ✅ **Koordinator membuat entri Tugas Akhir** — `status=200`
- ✅ **Entri Tugas Akhir terdaftar** — `id=ta-210211990001`
- ✅ **Plotting pembimbing utama & pendamping** — `status=200`
- ✅ **NIP pembimbing otoritatif tersimpan** — `nip=196201081987032001`
- ✅ **Plotting dengan payload tak dikenal ditolak (tidak ada sukses palsu)** — `status=400`
- ✅ **Mahasiswa DITOLAK menetapkan pembimbing** — `status=403`

### FASE G — SIKLUS BIMBINGAN (MAHASISWA & PEMBIMING)

- ✅ **Mahasiswa mencatat sesi bimbingan** — `status=201`
- ✅ **Sesi bimbingan masuk daftar mahasiswa** — `status awal=Menunggu Approval`
- ✅ **Sesi mahasiswa berstatus "Menunggu Approval" (menunggu paraf pembimbing)** — `status=Menunggu Approval`
- ✅ **Dosen non-pembimbing DITOLAK mencatat bimbingan** — `status=403`
- ✅ **Pembimbing menyetujui sesi bimbingan** — `status=200`
- ✅ **Status bimbingan menjadi "Disetujui"** — `status=Disetujui`
- ✅ **Pembimbing dapat mencatat sesi (otomatis tervalidasi)** — `status=201`
- ✅ **Tersedia cukup sesi bimbingan disetujui untuk checklist (>=8)** — `disetujui=10`

### FASE H — UNGGAH NASKAH, REVIEW & KOMENTAR PEMBIMBING

- ✅ **Mahasiswa mengunggah versi naskah** — `status=201 Naskah versi 1 tersimpan.`
- ✅ **Nomor versi naskah otomatis** — `versi=1`
- ✅ **Daftar naskah mahasiswa terbaca** — `jumlah=1`
- ✅ **Pembimbing memberi komentar pada naskah** — `status=201`
- ✅ **Mahasiswa membaca komentar pembimbing** — `jumlah=1`
- ✅ **Pembimbing menutup komentar** — `status=200`
- ✅ **Pembimbing menyetujui naskah (memenuhi butir checklist tahapan)** — `status=200`
- ✅ **Mahasiswa lain DITOLAK mengomentari naskah milik orang lain** — `status=403`

### FASE I — PUBLIKASI ILMIAH & VERIFIKASI

- ✅ **Mahasiswa mengajukan publikasi** — `status=201`
- ✅ **Koordinator memverifikasi publikasi** — `status=200`
- ✅ **Status publikasi menjadi Terverifikasi** — `status=Terverifikasi`
- ✅ **Mahasiswa DITOLAK memverifikasi publikasi sendiri** — `status=403`

### FASE J — STATE MACHINE TAHAPAN TUGAS AKHIR (AJUKAN → APPROVE → VERIFIKASI → SELESAI)

- ✅ **Baca progres tahapan** — `status=200`
- ✅ **Empat tahapan S1 terdaftar** — `jumlah=4`
- ✅ **Mahasiswa mengajukan S1-T1** — `status=200| Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Mahasiswa lain DITOLAK mengajukan S1-T1** — `status=403`
- ✅ **Pembimbing menyetujui S1-T1** — `status=200`
- ✅ **Dosen non-pembimbing DITOLAK menyetujui S1-T1** — `status=409`
- ✅ **Koordinator memverifikasi S1-T1** — `status=200`
- ✅ **Koordinator menutup S1-T1** — `status=200`
- ✅ **Mahasiswa mengajukan S1-T2** — `status=200| Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Mahasiswa lain DITOLAK mengajukan S1-T2** — `status=403`
- ✅ **Pembimbing menyetujui S1-T2** — `status=200`
- ✅ **Dosen non-pembimbing DITOLAK menyetujui S1-T2** — `status=409`
- ✅ **Koordinator memverifikasi S1-T2** — `status=200`
- ✅ **Koordinator menutup S1-T2** — `status=200`
- ✅ **Mahasiswa mengajukan S1-T3** — `status=200| Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Mahasiswa lain DITOLAK mengajukan S1-T3** — `status=403`
- ✅ **Pembimbing menyetujui S1-T3** — `status=200`
- ✅ **Dosen non-pembimbing DITOLAK menyetujui S1-T3** — `status=409`
- ✅ **Koordinator memverifikasi S1-T3** — `status=200`
- ✅ **Koordinator menutup S1-T3** — `status=200`
- ✅ **Mahasiswa mengajukan S1-T4** — `status=200| Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Mahasiswa lain DITOLAK mengajukan S1-T4** — `status=403`
- ✅ **Pembimbing menyetujui S1-T4** — `status=200`
- ✅ **Dosen non-pembimbing DITOLAK menyetujui S1-T4** — `status=409`
- ✅ **Koordinator memverifikasi S1-T4** — `status=200`
- ✅ **Koordinator menutup S1-T4** — `status=200`
- ✅ **Seluruh tahapan S1 berstatus Selesai** — `selesai=4/4`

### FASE K — PENJADWALAN SIDANG, ALOKASI RUANG & DEWAN PENGUJI

- ✅ **Admin membuat alokasi ruang sidang** — `status=200 Alokasi ruangan berhasil dijadwalkan di database.`
- ✅ **Daftar alokasi ruang terbaca** — `jumlah=140`
- ✅ **Admin menerbitkan Surat Keputusan** — `status=200 SK Nomor 126194/UN46.1.1/SK.TA/2026 berhasil disimpan di basis data.`
- ✅ **Daftar SK terbaca** — `jumlah=43`
- ✅ **Koordinator membuat penjadwalan ujian + penetapan dekwan penguji** — `status=201 id=uj-1792603716241-4t7zs msg=Penjadwalan Seminar Proposal Skripsi untuk Mahasiswa Simulasi A-Z berhasil disimpan beserta susunan dewan penguji.`
- ✅ **Setiap anggota dekwan terikat pada NIP pengguna nyata** — `nip=197703032003121002, 196201081987032001`
- ✅ **Penetapan tanpa dekwan penguji ditolak 400** — `status=400`
- ✅ **Mahasiswa DITOLAK membuat penjadwalan ujian** — `status=403`

### FASE L — PENILAIAN DEWAN PENGUJI (RUBRIK BERBOBOT)

- ✅ **Dewan penguji membaca daftar ujian** — `status=200`
- ✅ **Ujian yang ditugaskan muncul pada daftar** — `id=uj-1792603716241-4t7zs`
- ✅ **Mahasiswa DITOLAK membaca daftar ujian** — `status=403`
- ✅ **Dewan penguji menyimpan penilaian** — `status=200 Nilai ujian berhasil disimpan secara resmi ke database.`
- ✅ **Nilai final tersimpan di basis data** — `nilai=82.55`
- ✅ **Grade tersimpan** — `grade=A`
- ✅ **Rekomendasi kelayakan tersimpan** — `rekomendasi=Layak Diteruskan dengan Perbaikan Minor`
- ✅ **Dosen non-dekwan DITOLAK menilai ujian ini** — `status=403`

### FASE M — CATATAN KOREKSI PENGAJU & PENYELESAIAN REVISI

- ✅ **Dewan penguji membuat catatan koreksi** — `status=200 Catatan koreksi penguji berhasil dicatat ke database.`
- ✅ **Catatan koreksi tersimpan & terbaca** — `jumlah=4`
- ✅ **Catatan koreksi tanpa isi ditolak 400** — `status=400`
- ✅ **Status verifikasi revisi diperbarui** — `status=200`
- ✅ **Catatan koreksi dapat dihapus** — `status=200`

### FASE N — DOKUMEN RESMI, QR VERIFIKASI & ARSIP

- ✅ **Berita Acara ujian terbit** — `status=201 Berita Acara Ujian digital berhasil dicetak dan diarsipkan dengan QR Code validasi.`
- ✅ **Lembar Pengesahan terbit (semua tahapan selesai)** — `status=201 Lembar Pengesahan Tugas Akhir berhasil dicetak dengan stempel digital resmi.`
- ✅ **Kartu Kendali Bimbingan terbit** — `status=201`
- ✅ **Surat Tugas Penguji terbit** — `status=201`
- ✅ **Surat Tugas Pembimbing terbit** — `status=201`
- ✅ **SK Dekan terbit** — `status=201`
- ✅ **Paket Berkas Ujian terbit** — `status=201`
- ✅ **Verifikasi publik dokumen resmi = ASLI** — `status=200 verified=true`
- ✅ **Verifikasi kode tak dikenal ditolak tanpa membocorkan data** — `status=404`
- ✅ **Arsip dokumen resmi terbaca** — `jumlah=50`
- ✅ **Auto-counter nomor dokumen terbaca** — `status=200`
- ✅ **Auto-counter dapat disesuaikan** — `status=200`

### FASE O — PENYIMPANAN BERKAS (UNGGAH, UNDUH, HAPUS)

- ✅ **Mahasiswa mengunggah berkas naskah** — `status=201`
- ✅ **Admin membaca daftar berkas** — `status=200`
- ✅ **Token unduhan scoped diterbitkan** — `status=200`
- ✅ **Berkas dapat diunduh oleh pemiliknya** — `status=200`
- ✅ **Berkas terproteksi TIDAK dikirim dengan Cache-Control public** — `cache-control=private, no-store, max-age=0`
- ✅ **Mahasiswa TIDAK dapat menghapus berkas unggahannya (khusus admin/superadmin)** — `status=403`
- ✅ **Admin dapat menghapus berkas** — `status=200`
- ✅ **Path traversal ditolak** — `status=400`

### FASE P — NOTIFIKASI, BROADCAST & EMAIL INSTITUSIONAL

- ✅ **Mahasiswa membaca notifikasi** — `status=200`
- ✅ **Notifikasi bersifat milik pengguna yang login** — `jumlah=40`
- ✅ **Menandai semua notifikasi terbaca** — `status=200`
- ✅ **Token SSE diterbitkan** — `status=200`
- ✅ **Admin menyiarkan broadcast** — `status=201`
- ✅ **Mahasiswa DITOLAK menyiarkan broadcast** — `status=403`
- ✅ **Admin membaca log email** — `status=200`
- ✅ **Email ke domain luar institusional DITOLAK** — `status=403`
- ✅ **Email ke domain institusional diproses (mock)** — `status=200`

### FASE Q — LAPORAN, PROGRESS & MONITORING

- ✅ **Laporan progres TA terbaca** — `status=200`
- ✅ **Laporan beban dosen terbaca** — `status=200`
- ✅ **Sinkronisasi data Tugas Akhir berjalan** — `status=200`
- ✅ **Audit log keamanan terbaca** — `status=200`
- ✅ **Audit log mencatat aktivitas simulasi** — `entri simulasi ditemukan`

### FASE R — PENCADANGAN & PEMULIHAN BENCANA (DISASTER RECOVERY)

- ✅ **Daftar cadangan terbaca** — `jumlah=104`
- ✅ **Cadangan on-demand dibuat** — `status=200`
- ✅ **Integritas cadangan terverifikasi (PRAGMA integrity_check)** — `status=200 hasil=VALID & PRODUCTION READY`
- ✅ **Path traversal pada endpoint cadangan ditolak** — `status=404`

### FASE S — PERGANTIAN SEMESTER (QUOTA RECLAIM & BRIDGING)

- ✅ **Pagu kuota dosen terbaca untuk rollover** — `dosen=Dr. Dra. Hj. Iriani Ismail, M.M.`
- ✅ **Kuota dilepas kembali (quota reclaim) saat mahasiswa lulus** — `status=200`
- ✅ **Perubahan kuota tersimpan sesuai nilai yang diminta** — `10 -> 10 (diminta 10)`
- ✅ **Mahasiswa aktif dapat melanjutkan progres TA (bridging semester)** — `status=200`
- ✅ **Kalender memuat informasi semester** — `jumlah=22`

### FASE T — KONSISTENSI DATA, KONSISTENSI AKHIR & KEAMANAN

- ✅ **Tidak ada pelanggaran foreign key di basis data** — `pelanggaran=0`
- ✅ **Tidak ada kata sandi/hash yang bocor pada daftar pengguna**
- ✅ **Mahasiswa ditolak mengakses endpoint superadmin** — `status=403`
- ✅ **Endpoint superadmin menolak anonim** — `status=401`
- ✅ **Mahasiswa ditolak membaca kuota dosen** — `status=403`
- ✅ **Token mati setelah logout** — `status=401`
- ✅ **Health check API sehat** — `status=200`

### FASE U — CAKUPAN JENJANG S1 / S2 / S3 / D3

- ✅ **Template tahapan S1 tersedia** — `jumlah=4`
- ✅ **rules_json S1 tersedia** — `minSKS=120 minToefl=450 skorMin=70`
- ✅ **Tahap akhir S1 (S1-T4) mewajibkan publikasi** — `requires_publikasi=1`
- ✅ **Akun mahasiswa uji S1 dibuat** — `nim=199937214591414261`
- ✅ **false** — `status=409 code=TA_NOT_INITIALIZED`
- ✅ **Entri Tugas Akhir S1 dibuat** — `id=ta-199937214591414261`
- ✅ **Plotting pembimbing S1 tersimpan** — `status=200`
- ✅ **Publikasi S1 dibuat & diverifikasi** — `status=200`
- ✅ **Mahasiswa mengajukan S1/S1-T1** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S1/S1-T1** — `status=200`
- ✅ **Koordinator memverifikasi S1/S1-T1** — `status=200`
- ✅ **Tahap S1/S1-T1 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S1/S1-T2** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S1/S1-T2** — `status=200`
- ✅ **Koordinator memverifikasi S1/S1-T2** — `status=200`
- ✅ **Tahap S1/S1-T2 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S1/S1-T3** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S1/S1-T3** — `status=200`
- ✅ **Koordinator memverifikasi S1/S1-T3** — `status=200`
- ✅ **Tahap S1/S1-T3 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S1/S1-T4** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S1/S1-T4** — `status=200`
- ✅ **Koordinator memverifikasi S1/S1-T4** — `status=200`
- ✅ **Tahap S1/S1-T4 ditutup** — `status=200`
- ✅ **Seluruh tahapan S1 selesai** — `4/4`
- ✅ **Template tahapan S2 tersedia** — `jumlah=5`
- ✅ **rules_json S2 tersedia** — `minSKS=36 minToefl=475 skorMin=75`
- ✅ **Tahap akhir S2 (S2-T5) mewajibkan publikasi** — `requires_publikasi=1`
- ✅ **Akun mahasiswa uji S2 dibuat** — `nim=199937214591414262`
- ✅ **false** — `status=409 code=TA_NOT_INITIALIZED`
- ✅ **Entri Tugas Akhir S2 dibuat** — `id=ta-199937214591414262`
- ✅ **Plotting pembimbing S2 tersimpan** — `status=200`
- ✅ **Publikasi S2 dibuat & diverifikasi** — `status=200`
- ✅ **Mahasiswa mengajukan S2/S2-T1** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S2/S2-T1** — `status=200`
- ✅ **Koordinator memverifikasi S2/S2-T1** — `status=200`
- ✅ **Tahap S2/S2-T1 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S2/S2-T2** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S2/S2-T2** — `status=200`
- ✅ **Koordinator memverifikasi S2/S2-T2** — `status=200`
- ✅ **Tahap S2/S2-T2 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S2/S2-T3** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S2/S2-T3** — `status=200`
- ✅ **Koordinator memverifikasi S2/S2-T3** — `status=200`
- ✅ **Tahap S2/S2-T3 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S2/S2-T4** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S2/S2-T4** — `status=200`
- ✅ **Koordinator memverifikasi S2/S2-T4** — `status=200`
- ✅ **Tahap S2/S2-T4 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S2/S2-T5** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S2/S2-T5** — `status=200`
- ✅ **Koordinator memverifikasi S2/S2-T5** — `status=200`
- ✅ **Tahap S2/S2-T5 ditutup** — `status=200`
- ✅ **Seluruh tahapan S2 selesai** — `5/5`
- ✅ **Template tahapan S3 tersedia** — `jumlah=8`
- ✅ **rules_json S3 tersedia** — `minSKS=42 minToefl=500 skorMin=75`
- ✅ **Tahap akhir S3 (S3-T8) mewajibkan publikasi** — `requires_publikasi=1`
- ✅ **Akun mahasiswa uji S3 dibuat** — `nim=199937214591414263`
- ✅ **false** — `status=409 code=TA_NOT_INITIALIZED`
- ✅ **Entri Tugas Akhir S3 dibuat** — `id=ta-199937214591414263`
- ✅ **Plotting pembimbing S3 tersimpan** — `status=200`
- ✅ **Publikasi S3 dibuat & diverifikasi** — `status=200`
- ✅ **Mahasiswa mengajukan S3/S3-T1** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S3/S3-T1** — `status=200`
- ✅ **Koordinator memverifikasi S3/S3-T1** — `status=200`
- ✅ **Tahap S3/S3-T1 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S3/S3-T2** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S3/S3-T2** — `status=200`
- ✅ **Koordinator memverifikasi S3/S3-T2** — `status=200`
- ✅ **Tahap S3/S3-T2 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S3/S3-T3** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S3/S3-T3** — `status=200`
- ✅ **Koordinator memverifikasi S3/S3-T3** — `status=200`
- ✅ **Tahap S3/S3-T3 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S3/S3-T4** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S3/S3-T4** — `status=200`
- ✅ **Koordinator memverifikasi S3/S3-T4** — `status=200`
- ✅ **Tahap S3/S3-T4 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S3/S3-T5** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S3/S3-T5** — `status=200`
- ✅ **Koordinator memverifikasi S3/S3-T5** — `status=200`
- ✅ **Tahap S3/S3-T5 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S3/S3-T6** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S3/S3-T6** — `status=200`
- ✅ **Koordinator memverifikasi S3/S3-T6** — `status=200`
- ✅ **Tahap S3/S3-T6 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S3/S3-T7** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S3/S3-T7** — `status=200`
- ✅ **Koordinator memverifikasi S3/S3-T7** — `status=200`
- ✅ **Tahap S3/S3-T7 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan S3/S3-T8** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui S3/S3-T8** — `status=200`
- ✅ **Koordinator memverifikasi S3/S3-T8** — `status=200`
- ✅ **Tahap S3/S3-T8 ditutup** — `status=200`
- ✅ **Seluruh tahapan S3 selesai** — `8/8`
- ✅ **Template tahapan D3 tersedia** — `jumlah=3`
- ✅ **rules_json D3 tersedia** — `minSKS=90 minToefl=400 skorMin=65`
- ✅ **Tahap akhir D3 (D3-T3) mewajibkan publikasi** — `requires_publikasi=1`
- ✅ **Akun mahasiswa uji D3 dibuat** — `nim=199937214591414264`
- ✅ **false** — `status=409 code=TA_NOT_INITIALIZED`
- ✅ **Entri Tugas Akhir D3 dibuat** — `id=ta-199937214591414264`
- ✅ **Plotting pembimbing D3 tersimpan** — `status=200`
- ✅ **Publikasi D3 dibuat & diverifikasi** — `status=200`
- ✅ **Mahasiswa mengajukan D3/D3-T1** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui D3/D3-T1** — `status=200`
- ✅ **Koordinator memverifikasi D3/D3-T1** — `status=200`
- ✅ **Tahap D3/D3-T1 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan D3/D3-T2** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui D3/D3-T2** — `status=200`
- ✅ **Koordinator memverifikasi D3/D3-T2** — `status=200`
- ✅ **Tahap D3/D3-T2 ditutup** — `status=200`
- ✅ **Mahasiswa mengajukan D3/D3-T3** — `status=200 Pengajuan tahap berhasil. Menunggu persetujuan pembimbing.`
- ✅ **Pembimbing menyetujui D3/D3-T3** — `status=200`
- ✅ **Koordinator memverifikasi D3/D3-T3** — `status=200`
- ✅ **Tahap D3/D3-T3 ditutup** — `status=200`
- ✅ **Seluruh tahapan D3 selesai** — `3/3`

## 5. Catatan Temuan


---
*Laporan dihasilkan otomatis oleh `scripts/simulate_process_az.mjs`.*
