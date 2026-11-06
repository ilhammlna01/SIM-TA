# BUSINESS PROCESS MAHASISWA — SIM-TA FEB UTM
## Penjelasan alur, syarat, dan perbedaan istilah

> Dokumen ini menjawab pertanyaan: **"apa bedanya draft di Naskah dan draft di
> Persyaratan?"**, **"kenapa naskah bisa disetujui padahal tahapannya belum
> mulai?"**, dan **"kenapa ada mahasiswa tahapan 0 tapi sudah punya rekam?"**.
>
> Seluruh isi di bawah diverifikasi langsung terhadap basis data dan kode yang
> sedang berjalan (21 Oktober 2026).

---

## 1. Peta Istilah — Tiga "Draft" yang Saling Berbeda

Ini adalah inti kebingungan yang paling sering muncul: satu istilah "Draft" dipakai untuk tiga hal yang sama sekali berbeda.

| Istilah | Halaman |-basis Data | Arti | Siapa yang mengubah |
| :--- | :--- | :--- | :--- | :--- |
| **Naskah** (versi dokumen) | `Mahasiswa → Naskah`, `Pembimbing → Naskah` | `naskah_versi` | Dokumen kerja (proposal/naskah) yang **diunggah mahasiswa** dan **ditelaah pembimbing**; berversi (v1, v2, dst). | Mahasiswa mengunggah; Pembimbing memberi telaah & persetujuan. |
| **Persyaratan / Berkas Pendaftaran** | `Mahasiswa → Persyaratan` | `pendaftaran_ujian.berkas_json` | **Daftar periksa dokumen** yang dilampirkan saat **mendaftar ujian** (KRS, transkrip, rancangan awal Bab I–III, surat keterangan resmi). | Mahasiswa melampirkan; Admin memverifikasi kelayakannya. |
| **Penilaian Ujian** | `Penguji → Daftar Ujian` | `ujian_penguji.nilai_final` | **Nilai akhir ujian** oleh dewan penguji. | Dewan penguji. |

> **Sebelum 21 Oktober 2026** ketiganya sama-sama diberi label **"Draft"** di
> antarmuka, sehingga tidak dapat dibedakan. Sekarang:
> - Naskah → **"Belum Ditelaah"** / **"Perlu Revisi"** / **"Disetujui"**
> - Persyaratan → **"Belum Diverifikasi"** / **"Terverifikasi"**
> - Penilaian Ujian → **"Belum Dinilai"** / **"Disetujui"**

**Perbedaan inti Naskah vs Persyaratan:**

| | Naskah | Persyaratan |
| :--- | :--- | :--- |
| **Tujuannya** |рить konten agar siap dinilai | Membuktikan **kelayakan** untuk boleh ujian |
| **Sifatnya** | Versi berkala (bisa direvisi) | Satu kali lampiran pada saat pendaftaran |
| **Dievaluasi oleh** | Pembimbing (telaah substansi) | Admin Akademik (verifikasi administratif) |
| **Bisa diganti?** | Ya, naik versi | Tidak (harus daftar ulang) |
| **Dampak ke tahapan** | **Ya** — naskah wajib *disetujui pembimbing* sebelum tahap berikutnya bisa diajukan | **Ya** — pendaftaran diblokir bila tahapan prasyarat belum selesai |

---

## 2. Alur Proses Mahasiswa S1 (Program Studi Manajemen)

```
TAHAP                          PERSYARAT UNTUK MELALUI                PENDAFTARAN UJIAN
─────────────────────────────────────────────────────────────────────────────────────────
S1-T1  Pengajuan Topik          • Topic & pembimbing ditetapkan        • (belum boleh mendaftar)
        & Plotting Pembimbing   • Checklist: log bimbingan ≥ 0

S1-T2  Seminar Proposal (Sempro)• Log bimbingan disetujui ≥ 2 sesi      • PENDAFTARAN SEMIN
                                • Naskah telah diunggah                PROPOSAL (Sempro)
                                • NASKAH DISETUJUI PEMBIMING
                                   ▲ BARU

S1-T3  Penelitian & Bimbingan    • Log bimbingan disetujui ≥ 2 sesi      • PENDAFTARAN SIDANG
        Berkala                 • Naskah telah diunggah                UJIAN SKRIPSI / TAKK
                                • NASKAH DISETUJUI PEMBIMING
                                   ▲ BARU

S1-T4  Sidang Ujian Skripsi     • Log bimbingan disetujui ≥ 8 sesi      • (ujian sedang
        / TAKK Final            • Naskah telah diunggah                dilaksanakan)
                                • NASKAH DISETUJUI PEMBIMING
```

### Tahap lain

| Jenjang | Tahap |
| :--- | :--- |
| **S2 (Magister)** | S2-T1 Penetapan Pembimbing & Ujian Proposal → S2-T2 Penelitian Lapangan & Penulisan Tesis → S2-T3 Seminar Hasil Tesis → S2-T4 Ujian Tesis (Sidang Tertutup) → S2-T5 Pengesahan Naskah & Bebas Plagiasi Final |
| **S3 (Doktor)** | S3-T1 Penetapan Promotor & Topik Disertasi → S3-T2 Ujian Kualifikasi → S3-T3 Ujian Usulan Penelitian → S3-T4 Ujian Kelayakan (Desk Review) → S3-T5 Seminar Hasil → S3-T6 Ujian Tertutup → S3-T7 Ujian Terbuka / Promosi → S3-T8 Pengesahan Naskah Final & Yudisium |
| **D3 (Doktor Bisnis)** | D3-T1 Pengajuan Ide & Topik Proyek Bisnis → D3-T2 Pendampingan & Inkubasi Usaha Lapangan → D3-T3 Ujian Sidang Tugas Akhir & Gelar Produk |

### Setiap Tahap punya 4 Perpindahan Status

```
AJUKAN ──────────► MENUNGGU PERSETUJUAN PEMBIMBING ──────────► MENUNGGU VERIFIKASI ──────────► SELESAI
(mahasiswa)              (approve — pembimbing)                    (verifikasi — koordinator)      (selesai — koordinator)
                              │                                          │
                              └── sets pembimbing_approved = 1         └── sets admin_verified = 1
```

**Aturan yang ditegakkan (21 Oktober 2026):**

| Aturan | Status |
| :--- | :--- |
| `selesai` **wajib** didahului `pembimbing_approved = 1` | ✅ Ditegakkan — `409 STAGE_NOT_APPROVED` bila belum |
| Pendaftaran ujian **wajib** setelah seluruh tahapan pra-syarat `Selesai` | ✅ Ditegakkan — `409 STAGE_PREREQUISITE_NOT_MET` |
| Checklist tahapan **wajib** memuat "Naskah disetujui pembimbing" | ✅ Ditegakkan — `naskahDisetujui` pada checklist |

---

## 3. Menjawab Pertanyaan Anda Secara Langsung

### 3.1 "Ada mahasiswa yang tahapan masih nol tapi sudah ada rekam jejaknya"

**Penyebabnya (dan sudah diperbaiki):**

Sebelum 21 Oktober 2026, `POST /api/admin/verifikasi-berkas` **tidak memiliki
gerbang sama sekali** terhadap tahapan. consequence: mahasiswa bisa mendaftar
ujian (*Seminar Proposal*, *Sidang Ujian Skripsi*, dst.) dengan **0 tahap
selesai** — persis kondisi yang Anda temukan.

**Perbaikannya:** pendaftaran kini dihitung prasyaratnya dari `tahapan_template`:

| Jenis ujian yang didaftarkan | Tahap prasyarat yang wajib `Selesai` |
| :--- | :--- |
| Seminar Proposal (Skripsi) | S1-T1 |
| Sidang Laporan Tugas Akhir / Portofolio Bisnis | D3-T1, D3-T2 |
| Sidang Tesis Magister / Sidang Akhir | S2-T1 … S2-T3 |
| Ujian Kualifikasi Doktor | S3-T1 |
| Ujian Proposal Disertasi | S3-T1, S3-T2 |
| Ujian Kelayakan (Desk Review) | S3-T1 … S3-T3 |
| Ujian Tertutup Disertasi | S3-T1 … S3-T5 |
| Sidang Terbuka & Promosi Doktor | S3-T1 … S3-T6 |

Pesan penolakan yang diterima mahasiswa:

```json
{
  "success": false,
  "code": "STAGE_PREREQUISITE_NOT_MET",
  "message": "Pendaftaran Seminar Proposal Skripsi belum dapat dilakukan: tahapan prasyarat belum selesai. Selesaikan terlebih dahulu: Pengajuan Topik & Plotting Pembimbing.",
  "belumSelesai": [
    { "kode": "S1-T1", "nama": "Pengajuan Topik & Plotting Pembimbing", "status": "Belum Mulai" }
  ]
}
```

> **Catatan:** rekam pendaftaran yang sudah terlanjur ada pada data lama TIDAK
> dihapus otomatis — data historis tidak dimodifikasi sepihak. Yang berubah
> adalah **pintu masuknya**: tidak ada pendaftaran baru yang lolos tanpa
> tahapan prasyarat.

### 3.2 "Kenapa naskah sudah disetujui pembimbing padahal tahapannya belum mulai?"

**Penyebabnya:** sebelum 21 Oktober 2026, tabel `naskah_versi` **tidak memiliki
kolom status persetujuan sama sekali**. Halaman "Persetujuan" menampilkan
daftar naskah (dari data simulasi) dengan status *"Disahkan"*, namun aksi
"Setujui" pada halaman tersebut sebenarnya memanggil **persetujuan TAHAP**,
bukan keputusan atas naskahnya. Dua hal yang berbeda tampil dengan label yang
sama, dan keduanya tidak terhubung.

**Perbaikannya — naskah dan tahap kini dua entitas terpisah dengan pengunci
saling:**

```
Mahasiswa unggah naskah v2
        │
        ▼
Pembimbing menelaah & MEMUTUSKAN atas NASKAH itu
   PUT /api/akademik/naskah/:versiId/approval
        │  → naskah_versi.status_persetujuan = 'Disetujui'
        ▼
Checklist tahap membaca status tersebut:
   "Naskah telah disetujui pembimbing" → terpenuhi ✓
        │
        ▼
Mahasiswa mengajukan tahap (POST .../tahap/:kode/ajukan)
        │  → checklist WAJIB terpenuhi, termasuk naskah disetujui
        ▼
Pembimbing menyetujui tahap → approval_approved = 1
        ▼
Koordinator memverifikasi → admin_verified = 1
        ▼
Koordinator menutup tahap → (WAJIB approval_approved = 1)
```

Artinya **naskah tidak lagi bisa "disetujui" tanpa keputusan nyata**, dan
**tahapan tidak lagi bisa diajukan tanpa naskah yang benar-benar ditelaah**.

### 3.3 "Apa bedanya draft di naskah dan draft di persyaratan?"

Sudah dijelaskan pada Bagian 1. Ringkasnya:

- **Naskah** = *isi pekerjaan* yang versioning-nya & ditelaah substansi oleh pembimbing.
- **Persyaratan** = *berkas pendukung* untuk membuktikan kelayakan mendaftar ujian, yang diverifikasi administratif oleh Admin.
- Keduanya **saling mengunci**: persyaratan mengunci pendaftaran (dan pendaftaran mengunci tahapan), naskah mengunci pengajuan tahap.

---

## 4. Hak Akses & Halaman Mahasiswa

| Halaman | Isi | Sumber data | Aksi tulis |
| :--- | :--- | :--- | :---: |
| **Dashboard** | Ringkasan progres, catatan, agenda | `tugas_akhir`, `bimbingan_log`, `naskah_versi` | — |
| **Tahapan** | Status 4 tahap + checklist + tombol *Ajukan Tahap* | `GET /akademik/tugas-akhir/:id/progres` | ✅ Ajukan tahap |
| **Persyaratan** | Daftar berkas pendaftaran & status verifikasinya | `pendaftaran_ujian` | ✅ Daftar ujian |
| **Naskah** | Versi naskah + status telaah pembimbing | `naskah_versi` (+`komentar_naskah`) | ✅ Unggah versi |
| **Bimbingan** | Log sesi bimbingan | `bimbingan_log` | ✅ Catat sesi |
| **Ujian** | Jadwal ujian yang diikuti | `ujian_penguji` | — |
| **Revisi** | Catatan koreksi dari dewan penguji | `koreksi_penguji` | — |
| **Dokumen** | Berkas terunggah (naskah/dokumen resmi) | `storage_files` | — |
| **Portofolio** | Publikasi ilmiah | `publikasi` | ✅ Ajukan publikasi |

---

## 5. Checklist Praktis untuk Mahasiswa

1. **Mulai dari Tahapan, bukan Persyaratan.** Buka `Mahasiswa → Tahapan` →
  selesaikan S1-T1 (Pengajuan Topik & Plotting Pembimbing).
2. **Unggah naskah**, lalu minta pembimbing menelaah di `Pembimbing → Naskah`.
   Naskah harus **"Disetujui"** sebelum tahap berikutnya bisa diajukan.
3. **Catat bimbingan** secara rutin (`Mahasiswa → Bimbingan`) dan minta pembimbing
   menyetujuinya — jumlah sesi yang disetujui adalah syarat tiap tahap
   (2 sesi untuk S1-T2/T3, 8 sesi untuk S1-T4).
4. **Daftar ujian hanya setelah** seluruh tahapan prasyarat berstatus *Selesai*.
   Persyaratan adalah lampiran administratif, bukan pengganti proses.
5. **Pantau checklist** pada halaman Tahapan — ia menampilkan setiap syarat
   secara terukur beserta capaiannya (jumlah sesi bimbingan, jumlah versi naskah,
   jumlah publikasi).

---

*Dokumen ini dibuat sebagai hasil tinjauan business process 21 Oktober 2026 dan
memuat perbaikan yang sudah diterapkan: gerbang pendaftaran ujian, status
persetujuan naskah, checklist "naskah disetujui pembimbing", aturan `selesai`
wajib menunggu persetujuan pembimbing, serta pelabelan ulang istilah "Draft".
Diverifikasi ulang melalui `scripts/simulate_process_az.mjs` dan 11 suite pengujian.*
