# Konvensi Teknis — SIM-TA FEB UTM

Dokumen ini menetapkan konvensi teknis yang wajib diikuti saat mengembangkan
antarmuka (React) dan API (Express + SQLite) SIM-TA FEB UTM.

Dua topik:
1. **Kontrak Penamaan Field (camelCase)** — konvensi lapisan API ↔ antarmuka.
2. **Kebijakan Tabel** — kapan memakai komponen `Table` bersama vs `<table>` mentah.

---

## 1. Kontrak Penamaan Field: camelCase di Batas API

### 1.1 Aturan inti
- **Basis data (SQLite)** memakai `snake_case` (`nama_mahasiswa`, `kuota_utama`,
  `tanggal_ujian`). Ini adalah detail internal dan **tidak boleh** bocor ke antarmuka.
- **Respons JSON API** dan **payload permintaan** memakai `camelCase`
  (`namaMahasiswa`, `kuotaUtama`, `tanggalUjian`).
- **State & komponen React** memakai `camelCase`.

### 1.2 Tanggung jawab konversi
Konversi `snake_case` → `camelCase` dilakukan **di route handler** saat memetakan
baris basis data ke respons. Contoh (`server/routes/superadminRoutes.js`):

```js
const formatted = rows.map((r) => ({
  ...r,
  kodeProdi: r.kode_prodi,
  namaProdi: r.nama_prodi,
  noSkAkreditasi: r.no_sk_akreditasi,
  nipKaprodi: r.nip_kaprodi,
  kuotaMahasiswa: r.kuota_mahasiswa,
  mahasiswaAktif: r.mahasiswa_aktif
}));
```

Konversi balik (`camelCase` payload → `snake_case` kolom) dilakukan saat
menjalankan `INSERT`/`UPDATE`:

```js
stmt.run(id, kodeProdi, namaProdi, jenjang, akreditasi, noSkAkreditasi || '', /* ... */);
//   kolom: id, kode_prodi, nama_prodi, jenjang, akreditasi, no_sk_akreditasi, ...
```

### 1.3 Alias masukan yang ditoleransi
Agar tahan terhadap klien lama, endpoint tulis menerima alias umum dan
menormalkannya di server (bukan di klien):

| Kanonik (camelCase) | Alias yang diterima |
|---|---|
| `nomorInduk` | `nomor_induk` |
| `jenjang` | `strata` |
| `nim` / `mhsNim` | `mhs_nim` |
| `namaMahasiswa` | `mhsNama`, `mhs_nama` |
| `bagianNaskah` | `bab`, `bagian_naskah` |
| `catatanKoreksi` | `catatan_koreksi` |

Contoh (`server/routes/pengujiRoutes.js`):

```js
const mhsNim = body.mhsNim || body.nim || body.mhs_nim;
const mhsNama = body.mhsNama || body.namaMahasiswa || body.mhs_nama || '';
const bagianNaskah = body.bagianNaskah || body.bab || body.bagian_naskah;
```

> **Aturan:** jika field baru ditambahkan, pilih nama `camelCase` kanonik dan
> petakan eksplisit di route. Jangan mengekspos nama kolom `snake_case` ke UI.

### 1.4 Bentuk respons standar
Semua endpoint mengembalikan objek dengan bentuk konsisten:

```jsonc
// Sukses
{ "success": true, "message": "…", "data": /* opsional */ }

// Gagal
{ "success": false, "message": "Pesan galat yang dapat ditampilkan ke pengguna" }
```

### 1.5 Kode status HTTP
| Kode | Kapan dipakai |
|---|---|
| `200` | Operasi tulis/ambil berhasil (dipakai konsisten untuk kompatibilitas klien). |
| `201` | Pembuatan sumber daya baru pada endpoint akademik (`naskah`, `publikasi`, `komentar`). |
| `400` | Validasi masukan gagal (field wajib kosong, tipe salah). |
| `401` | Tidak ada token / token tidak sah. |
| `403` | Peran tidak berwenang (RBAC). |
| `404` | Sumber daya yang dituju tidak ditemukan. |
| `409` | Konflik (duplikat: kode prodi, nomor SK; bentrok jadwal ruangan; state tidak valid). |
| `500` | Galat tak terduga di server. |

Setiap endpoint tulis **wajib** memvalidasi masukan (`400`), memeriksa keberadaan
sumber daya (`404`), dan memeriksa duplikasi/konflik (`409`) sebelum menulis.

---

## 2. Kebijakan Tabel: Komponen `Table` vs `<table>` Mentah

### 2.1 Aturan
- **Data aplikasi** (daftar record dari state/API: pengguna, SK, ujian, koreksi,
  prodi, kuota, jadwal, dsb.) **WAJIB** memakai komponen bersama `Table`
  (`src/components/ui/Table.jsx`).
- **Tabel referensi/statis & tabel dokumen** boleh memakai `<table>` mentah.

Komponen `Table` sudah menyediakan: sorting, skeleton loading (`isLoading`),
empty state (`emptyContent`), mode kartu responsif (< 768px), dan semantik
aksesibilitas (`th[scope="col"]`).

### 2.2 Kapan `<table>` mentah masih diizinkan
1. **Tabel dokumen/cetak** — tabel di dalam pratinjau SK/berita acara yang meniru
   tata letak dokumen resmi (garis hitam, siap cetak/PDF). Contoh:
   `src/pages/admin/PenerbitanSKPage.jsx` (pratinjau susunan tim SK).
2. **Tabel referensi/regulasi statis** — konten tetap yang tidak berasal dari data
   pengguna. Contoh: tabel konversi nilai (`FormPenilaianPage.jsx`) dan rubrik
   poin TAKK (`PortofolioPage.jsx`).

Tabel kategori ini **tidak** dikonversi karena struktur/estetika cetak dan sifat
statisnya berbeda dari tabel data interaktif.

### 2.3 Hasil audit tabel (basis kode saat ini)
| Kategori | Jumlah | Contoh |
|---|---|---|
| Komponen bersama `Table` | 31 | `ManajemenPenggunaPage`, `PenerbitanSKPage`, `DaftarUjianPage`, `KuotaBimbinganPage` |
| `<table>` mentah — dokumen | 1 | `admin/PenerbitanSKPage.jsx` (pratinjau SK) |
| `<table>` mentah — referensi statis | 2 | `penguji/FormPenilaianPage.jsx` (konversi nilai), `mahasiswa/PortofolioPage.jsx` (rubrik TAKK) |

**Kesimpulan:** tidak ada lagi tabel **data** yang memakai `<table>` mentah; seluruh
daftar data sudah memakai komponen `Table`. Tiga `<table>` tersisa adalah
dokumen/referensi dan sengaja dipertahankan.

### 2.4 Checklist saat menambah daftar data baru
- [ ] Gunakan `<Table columns={…} data={…} />`, bukan `<table>`.
- [ ] Sertakan `emptyContent` (pesan kosong yang informatif).
- [ ] Sertakan `isLoading` bila data berasal dari API asinkron.
- [ ] Pastikan kolom memakai `camelCase` dan render nilai yang sudah diformat.
- [ ] Verifikasi tampilan pada lebar 375px (mode kartu) dan 1440px.

---

*Dokumen ini bagian dari Fase 2 (integritas & konsistensi data) pada rencana
pengembangan SIM-TA FEB UTM.*
