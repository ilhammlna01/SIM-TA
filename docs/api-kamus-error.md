# KAMUS ERROR & KODE STATUS API
## SIM-TA — Sistem Informasi Manajemen Tugas Akhir FEB UTM

Dokumen ini menjadi rujukan bagi integrator (pengembang aplikasi pihak ketiga,
integrasi dengan sistem Informasi Akademik, dsb.) ketika mengintegrasikan
layanan REST API SIM-TA.

> **Dasar URL:** `https://<host>/api`
> **Autentikasi:** `Authorization: Bearer <token JWT>`
> **Format respons:** `{ "success": boolean, "message": string, "code"?: string, "data"?: any }`

---

## 1. Kode Status HTTP

| Kode | Arti | Tindakan integrator |
| :---: | :--- | :--- |
| 200 OK | Permintaan berhasil | — |
| 201 Created | Sumber daya berhasil dibuat | — |
| 204 No Content | Berhasil, tanpa badan respons | — |
| 400 Bad Request | Field wajib tidak lengkap / nilai tidak valid | Periksa `missing` atau `invalid` pada respons |
| 401 Unauthorized | Token tidak ada, kedaluwarsa, atau telah dicabut | Login ulang; token lama tidak dapat dipakai |
| 403 Forbidden | Peran/ownership tidak memenuhi | Periksa peran akun dan kepemilikan data |
| 404 Not Found | Sumber daya tidak ada | — |
| 409 Conflict | Bentrok dengan data yang ada | Baca `code` untuk jenis konfliknya |
| 413 Payload Too Large | Berkas melebihi batas ukuran | Kompres berkas, lihat `fileValidator.js` |
| 422 Unprocessable Entity | Berkas ada namun formatnya tidak dapat diproses | Berkas bukan basis data SQLite yang sah (untuk endpoint cadangan) |
| 429 Too Many Requests | Rate limit / lockout akun | Tunggu jendela lockout berakhir, jangan mencoba berulang |
| 500 Internal Server Error | Kesalahan tak terduga di server | Laporkan beserta `correlationId`/waktu kejadian |

---

## 2. Kamus `code` Error

### 2.1 Autentikasi & Sesi (`/api/auth/*`)

| `code` | HTTP | Arti |
| :--- | :---: | :--- |
| `UNAUTHORIZED_NO_TOKEN` | 401 | Header `Authorization` tidak disertakan |
| `UNAUTHORIZED_INVALID_TOKEN` | 401 | Signature token tidak cocok / kadaluarsa |
| `UNAUTHORIZED_STALE_TOKEN` | 401 | Token sah secara kriptografi tetapi **sudah dicabut** (logout, ganti sandi, ubah role, nonaktifkan akun) |
| `FORBIDDEN_ROLE` | 403 | Peran akun tidak diizinkan untuk endpoint tersebut |
| `CORS_ORIGIN_DENIED` | 403 | Origin tidak ada di allowlist `CORS_ORIGIN` |

### 2.2 Validasi Payload (umum)

| `code` | HTTP | Arti | Field tambahan |
| :--- | :---: | :--- | :--- |
| `MISSING_REQUIRED_FIELDS` | 400 | Field wajib belum diisi | `missing: string[]` |
| `EMPTY_TAHAPAN_LIST` | 400 | Mengirim `tahapanList: []` akan menghapus template tahapan secara permanen — ditolak | — |
| `EMPTY_PANEL` | 400 | Susunan dewan penguji kosong | — |
| `INVALID_EXAMINER` | 400 | NIP/Nama dekwan tidak dikenali sebagai pengguna aktif | `invalid: {nama, nip}[]` |
| `DUPLICATE_SCHEDULE` | 409 | Mahasiswa sudah punya jadwal sejenis pada tanggal yang sama | — |
| `STUDENT_NOT_FOUND` | 404 | NIM tidak terdaftar dalam basis data | — |
| `EXAM_NOT_FOUND` | 404 | Rekam ujian tidak ditemukan | — |
| `EXAM_ALREADY_GRADED` | 409 | Ujian yang sudah dinilai tidak dapat dibatalkan | — |
| `STAGE_NOT_APPROVED` | 409 | Tahap belum dapat ditutup — persetujuan pembimbing masih diperlukan | — |
| `KOREKSI_NOT_FOUND` | 404 | Catatan koreksi tidak ada | — |
| `KOMENTAR_NOT_FOUND` | 404 | Komentar naskah tidak ada | — |
| `USER_HAS_DEPENDENT_RECORDS` | 409 | Akun masih memiliki data akademik sehingga tidak dapat dihapus | `dependensi: string[]` |
| `INVALID_EXAMINER` | 400 | (lihat 2.2) | — |
| `BACKUP_NOT_FOUND` | 404 | Berkas cadangan tidak ada | — |
| `BACKUP_NOT_A_DATABASE` | 422 | Berkas bukan basis data SQLite yang sah | — |
| `BACKUP_VERIFICATION_FAILED` | 422 | Pemeriksaan integritas cadangan gagal | — |
| `STAGE_PREREQUISITE_NOT_MET` | 409 | Pendaftaran ujian ditolak: tahapan pra-syarat belum selesai | `belumSelesai: {kode, nama, status}[]` |
| `STAGE_NOT_APPROVED` | 409 | Tahap belum dapat ditutup: persetujuan pembimbing masih diperlukan | — |
| `INVALID_APPROVAL_STATUS` | 400 | Status persetujuan naskah tidak sah | — |
| `NASKAH_NOT_FOUND` | 404 | Versi naskah tidak ditemukan | — |
| `NOT_SUPERVISOR` | 403 | Pengguna bukan pembimbing pemilik naskah | — |

### 2.3 Penyimpanan Berkas (`/api/storage/*`)

| `code` | HTTP | Arti |
| :--- | :---: | :--- |
| `INVALID_FILE_TYPE` | 400 | Ekstensi berkas tidak diizinkan |
| `INVALID_FILE_SIGNATURE` | 400 | Magic bytes berkas tidak cocok dengan format yang diklaim |
| `FILE_TOO_LARGE` | 413 | Ukuran berkas melebihi batas kategori |
| `INVALID_CATEGORY` | 400 | Kategori penyimpanan tidak dikenal |
| `INVALID_FILENAME` | 400 | Nama berkas tidak aman (path traversal) |

---

## 3. Endpoint Baru (Putaran 21 Oktober 2026)

### 3.1 `POST /api/penguji/ujian`

Menjadwalkan ujian sekaligus menetapkan dewan penguji.

**Peran:** `koorprodi`, `admin`, `superadmin`

```json
{
  "nim": "210211100142",
  "namaMahasiswa": "Dinda Ayu Larasati",
  "jenjang": "S1",
  "programStudi": "S-1 Manajemen",
  "jenisUjian": "Seminar Proposal Skripsi",
  "judul": "Pengaruh Transformasi Digital terhadap Kinerja UMKM Madura",
  "tanggalUjian": "2026-11-05",
  "jamUjian": "09:00",
  "ruang": "Ruang Sidang Jurusan Manajemen FEB Lt. 2",
  "susunanPenguji": [
    { "peran": "Ketua Penguji", "nama": "Dr. Faidal, S.E., M.M.", "nip": "197703032003121002" }
  ]
}
```

**Respons sukses (201):**

```json
{
  "success": true,
  "message": "Penjadwalan Seminar Proposal Skripsi untuk Dinda Ayu Larasati berhasil disimpan beserta susunan dewan penguji.",
  "data": {
    "id": "uj-1759...-a2hht",
    "susunanPenguji": [
      { "peran": "Ketua Penguji", "nama": "Dr. Faidal, S.E., M.M.", "nip": "197703032003121002", "homebase": "FEB UTM" }
    ]
  }
}
```

**Catatan integrasi:**

- Setiap anggota `susunanPenguji` **wajib terikat pada NIP pengguna nyata**. Bila `nip` tidak
  dikenal, sistem mencoba meresolvinya dari `nama` (data master dosen). Bila keduanya tidak
  dikenali → `400 INVALID_EXAMINER`.
- Penyimpanan NIP yang otoritatif inilah yang membuat **validasi penugasan penguji**
  (`isExamPanelist`) bekerja — penguji hanya dapat menilai ujian yang memang ditugaskan
  kepadanya.
- `GET /api/penguji/ujian` kini juga mengizinkan peran `koorprodi` (Coordinator) agar dapat
  membaca rekap ujian yang ia buat sendiri.

### 3.2 `PUT /api/penguji/ujian/:id/panel`

Menetapkan ulang susunan dewan penguji pada ujian yang belum dinilai.
Badan: `{ "susunanPenguji": [ ... ] }` — bentuknya sama seperti 3.1.

### 3.3 `DELETE /api/penguji/ujian/:id`

Membatalkan penjadwalan ujian. **Ditolak `409 EXAM_ALREADY_GRADED`** bila ujian sudah dinilai.

### 3.4 `GET /api/storage/list/:category`

Menampilkan daftar berkas dalam sebuah kategori.

- Peran `admin`, `superadmin`, `koorprodi` → seluruh berkas.
- Peran `mahasiswa`, `dosen`, `penguji` → **hanya berkas milik sendiri** (`uploaderNim`).

Setiap item kini menyertakan `uploaderNim` dan `uploaderNama`.

### 3.5 `PUT /api/akademik/naskah/:versiId/approval` — Persetujuan Naskah

Menetapkan keputusan pembimbing atas sebuah versi naskah. **Terpisah tegas dari
persetujuan TAHAP** (`POST /akademik/tugas-akhir/:id/tahap/:kode/approve`).

**Peran:** `dosen`, `penguji`, `koorprodi`, `admin`, `superadmin`
(hanya pembimbing mahasiswa yang memiliki naskah tersebut).

```json
{ "status": "Disetujui", "catatan": "Naskah layak diteruskan ke tahap berikutnya." }
```

`status`: `Disetujui` | `Perlu Revisi` | `Ditolak`

**Kenapa endpoint ini ada (21 Oktober 2026):** sebelumnya tabel `naskah_versi`
tidak memiliki status persetujuan sama sekali, sehingga halaman "Persetujuan"
menampilkan naskah seolah *sudah disetujui* sementara aksi yang dijalankan
justru menyetujui **tahap**. Kedua hal yang berbeda bertumpu pada label yang sama.
Sekarang:

- keputusan atas **naskah** → endpoint ini (disimpan di `naskah_versi.status_persetujuan`)
- keputusan atas **tahap** → `.../tahap/:kode/approve`

 Selain itu, butir checklist **"Naskah telah disetujui pembimbing"** menjadikan
keduanya saling mengunci: tahap hanya bisa diajukan bila ada versi naskah yang
benar-benar berstatus `Disetujui`.

### 3.6 `GET /api/penguji/koreksi` (untuk mahasiswa)

Mahasiswa diizinkan, namun **hanya** melihat catatan koreksi atas naskahnya sendiri.

---

## 4. Urutan Submit Tahapan Tugas Akhir

```
Mahasiswa: POST /api/akademik/tugas-akhir/:id/tahap/:kode/ajukan
        │  (checklist satisfied)
        ▼  status → MENUNGGU_PEMBIMBING
Pembimbing: POST /api/akademik/tugas-akhir/:id/tahap/:kode/approve
        │  pembimbing_approved = 1
        ▼  status → MENUNGGU_VERIFIKASI
Koordinator: POST /api/akademik/tugas-akhir/:id/tahap/:kode/verifikasi
        │  admin_verified = 1
        ▼
Koordinator: POST /api/akademik/tugas-akhir/:id/tahap/:kode/selesai
           (menolak 409 STAGE_NOT_APPROVED bila pembimbing_approved belum = 1)
        ▼  status → SELESAI, tahap berikutnya menjadi aktif
```

> **Perubahan 21 Oktober 2026:** endpoint `selesai` kini **wajib** didahului oleh
> persetujuan pembimbing (`pembimbing_approved = 1`). Sebelumnya tahap dapat ditutup
> tanpa paraf pembimbing.

---

## 5. Pola Integrasi yang Direkomendasikan

1. **Terapkan `ALLOW_TEST_CREDENTIALS`** hanya pada lingkungan uji — helper pengujian
   akan menolak menyemai kredensial uji pada `NODE_ENV=production` tanpa penanda ini.
2. **Simpan `code` (bukan hanya `message`)** — pesan bersifat bahasa manusia dan dapat
   berubah; `code` bersifat stabil untuk logika program.
3. **Tangani `401 UNAUTHORIZED_STALE_TOKEN` secara eksplisit** — token dicabut saat
   logout/ganti sandi/perubahan peran; aplikasi harus mengarahkan pengguna untuk login ulang,
   bukan mencoba ulang dengan token yang sama.
4. **Tangani `429` dengan backoff**, bukan retry langsung.
5. **Gunakan `POST /api/penguji/ujian` untuk penjadwalan** — jangan menyisipkan langsung ke
   basis data, karena hanya jalur ini yang menjalankan validasi dekwan, deteksi jadwal ganda,
   penerbitan notifikasi, dan pencatatan audit.

---

*Dokumen ini diperbarui sebagai bagian dari Putaran Remediasi 21 Oktober 2026 dan diverifikasi
melalui `scripts/simulate_process_az.mjs` (168 langkah) serta suite `tests/` (11 suite).*
