/**
 * Bimbingan Scan Sample Generator & Image Utilities
 * Menyediakan representasi visual scan dokumen otentik Kartu Kendali Bimbingan FEB UTM
 * untuk pengujian dan pratinjau bukti fisik konsultasi tatap muka (luring).
 */

export const SAMPLE_SCAN_KARTU_BIMBINGAN = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="100%" height="100%">
  <!-- Paper Background with subtle warm scanned tone -->
  <rect width="800" height="1100" fill="#fdfdfb" />
  <rect x="25" y="25" width="750" height="1050" fill="none" stroke="#e2e8f0" stroke-width="1.5" />

  <!-- Header Institusional / Kop Surat -->
  <g transform="translate(50, 45)">
    <!-- Logo placeholder or emblem circle -->
    <circle cx="45" cy="45" r="38" fill="#1E3A8A" />
    <circle cx="45" cy="45" r="32" fill="#D97706" />
    <circle cx="45" cy="45" r="26" fill="#ffffff" />
    <text x="45" y="52" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="#1E3A8A" text-anchor="middle">UTM</text>

    <!-- Kop Text -->
    <text x="375" y="24" font-family="'Times New Roman', serif" font-weight="bold" font-size="16" fill="#0f172a" text-anchor="middle" letter-spacing="0.5">KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</text>
    <text x="375" y="44" font-family="'Times New Roman', serif" font-weight="bold" font-size="18" fill="#0f172a" text-anchor="middle" letter-spacing="1">UNIVERSITAS TRUNOJOYO MADURA</text>
    <text x="375" y="64" font-family="'Times New Roman', serif" font-weight="bold" font-size="16" fill="#1E3A8A" text-anchor="middle">FAKULTAS EKONOMI DAN BISNIS</text>
    <text x="375" y="80" font-family="Arial, sans-serif" font-size="11" fill="#475569" text-anchor="middle">Jl. Raya Telang PO BOX 2 Kamal, Bangkalan - Madura | Telp. (031) 3011146</text>
    <text x="375" y="94" font-family="Arial, sans-serif" font-size="11" fill="#475569" text-anchor="middle">Laman: feb.trunojoyo.ac.id | Pos-el: feb@trunojoyo.ac.id</text>

    <!-- Double Border Lines -->
    <line x1="0" y1="106" x2="700" y2="106" stroke="#0f172a" stroke-width="2.5" />
    <line x1="0" y1="110" x2="700" y2="110" stroke="#0f172a" stroke-width="1" />
  </g>

  <!-- Document Title -->
  <g transform="translate(50, 185)">
    <text x="350" y="20" font-family="'Times New Roman', serif" font-weight="bold" font-size="16" fill="#0f172a" text-anchor="middle" text-decoration="underline">KARTU KENDALI BIMBINGAN TUGAS AKHIR / SKRIPSI</text>
    <text x="350" y="38" font-family="Arial, sans-serif" font-size="11.5" fill="#475569" text-anchor="middle">Bukti Fisik Konsultasi Tatap Muka (Luring) — Semester Ganjil 2026/2027</text>
  </g>

  <!-- Student & Supervisor Biodata Box -->
  <g transform="translate(50, 240)">
    <rect x="0" y="0" width="700" height="95" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    
    <text x="20" y="24" font-family="Arial, sans-serif" font-size="12" fill="#334155" font-weight="bold">Nama Mahasiswa</text>
    <text x="160" y="24" font-family="Arial, sans-serif" font-size="12" fill="#0f172a">: Dinda Ayu Larasati</text>
    <text x="430" y="24" font-family="Arial, sans-serif" font-size="12" fill="#334155" font-weight="bold">NIM</text>
    <text x="480" y="24" font-family="Arial, sans-serif" font-size="12" fill="#0f172a">: 210211100142</text>

    <text x="20" y="46" font-family="Arial, sans-serif" font-size="12" fill="#334155" font-weight="bold">Program Studi</text>
    <text x="160" y="46" font-family="Arial, sans-serif" font-size="12" fill="#0f172a">: S-1 Manajemen (Jenjang S1)</text>
    <text x="430" y="46" font-family="Arial, sans-serif" font-size="12" fill="#334155" font-weight="bold">T.A. / Smtr</text>
    <text x="480" y="46" font-family="Arial, sans-serif" font-size="12" fill="#0f172a">: 2026/2027 (VII)</text>

    <text x="20" y="68" font-family="Arial, sans-serif" font-size="12" fill="#334155" font-weight="bold">Dosen Pembimbing</text>
    <text x="160" y="68" font-family="Arial, sans-serif" font-size="12" fill="#0f172a">: Dra. Hj. S. Anugrahini Irawati, M.M.</text>

    <text x="20" y="86" font-family="Arial, sans-serif" font-size="11" fill="#334155" font-weight="bold">Judul Tugas Akhir</text>
    <text x="160" y="86" font-family="Arial, sans-serif" font-size="11" fill="#1e293b" font-style="italic">: Pengaruh Live Commerce dan Emotional Value terhadap Pembelian Batik Madura</text>
  </g>

  <!-- Logbook Table Header -->
  <g transform="translate(50, 360)">
    <rect x="0" y="0" width="700" height="32" fill="#e2e8f0" stroke="#475569" stroke-width="1.2" />
    <text x="25" y="21" font-family="Arial, sans-serif" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle">No</text>
    <line x1="50" y1="0" x2="50" y2="32" stroke="#475569" />

    <text x="115" y="21" font-family="Arial, sans-serif" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Hari / Tgl</text>
    <line x1="180" y1="0" x2="180" y2="32" stroke="#475569" />

    <text x="310" y="21" font-family="Arial, sans-serif" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Materi Substantif &amp; Bab</text>
    <line x1="440" y1="0" x2="440" y2="32" stroke="#475569" />

    <text x="545" y="21" font-family="Arial, sans-serif" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Catatan / Arahan Pembimbing</text>
    <line x1="640" y1="0" x2="640" y2="32" stroke="#475569" />

    <text x="670" y="21" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Paraf</text>
  </g>

  <!-- Row 1 (Handwritten notes simulation) -->
  <g transform="translate(50, 392)">
    <rect x="0" y="0" width="700" height="95" fill="#ffffff" stroke="#475569" stroke-width="1" />
    <line x1="50" y1="0" x2="50" y2="95" stroke="#475569" />
    <line x1="180" y1="0" x2="180" y2="95" stroke="#475569" />
    <line x1="440" y1="0" x2="440" y2="95" stroke="#475569" />
    <line x1="640" y1="0" x2="640" y2="95" stroke="#475569" />

    <text x="25" y="45" font-family="'Courier New', monospace" font-size="14" fill="#1e293b" text-anchor="middle">1.</text>
    <text x="115" y="40" font-family="'Comic Sans MS', cursive, sans-serif" font-size="12" fill="#1e3a8a" text-anchor="middle">Senin, 08/09/2026</text>
    <text x="115" y="58" font-family="'Comic Sans MS', cursive, sans-serif" font-size="10" fill="#64748b" text-anchor="middle">(Ruang Dosen FEB)</text>

    <!-- Handwritten Topic -->
    <text x="195" y="35" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="13" fill="#0f172a">Pengajuan Judul &amp; Latar Belakang</text>
    <text x="195" y="55" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12" fill="#0f172a">Perumusan research gap fenomena TikTok</text>
    <text x="195" y="75" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12" fill="#0f172a">Shop pada pengrajin batik Tanjungbumi.</text>

    <!-- Handwritten Dosen Feedback -->
    <text x="452" y="32" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12.5" fill="#1e40af">- Perjelas data pra-survei batik.</text>
    <text x="452" y="52" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12.5" fill="#1e40af">- Tambah rujukan jurnal Q2/Q1 terkini.</text>
    <text x="452" y="72" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12.5" fill="#1e40af">- ACC Latar Belakang lanjut ke BAB II.</text>

    <!-- Blue Pen Signature / Paraf Dosen -->
    <path d="M 655 45 C 665 25, 675 65, 685 30 C 690 50, 670 70, 680 75" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" />
  </g>

  <!-- Row 2 -->
  <g transform="translate(50, 487)">
    <rect x="0" y="0" width="700" height="95" fill="#ffffff" stroke="#475569" stroke-width="1" />
    <line x1="50" y1="0" x2="50" y2="95" stroke="#475569" />
    <line x1="180" y1="0" x2="180" y2="95" stroke="#475569" />
    <line x1="440" y1="0" x2="440" y2="95" stroke="#475569" />
    <line x1="640" y1="0" x2="640" y2="95" stroke="#475569" />

    <text x="25" y="45" font-family="'Courier New', monospace" font-size="14" fill="#1e293b" text-anchor="middle">2.</text>
    <text x="115" y="40" font-family="'Comic Sans MS', cursive, sans-serif" font-size="12" fill="#1e3a8a" text-anchor="middle">Kamis, 18/09/2026</text>
    <text x="115" y="58" font-family="'Comic Sans MS', cursive, sans-serif" font-size="10" fill="#64748b" text-anchor="middle">(Ruang Dosen FEB)</text>

    <!-- Handwritten Topic -->
    <text x="195" y="35" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="13" fill="#0f172a">BAB II Kajian Pustaka &amp; Hipotesis</text>
    <text x="195" y="55" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12" fill="#0f172a">Kerangka konseptual S-O-R Model dan</text>
    <text x="195" y="75" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12" fill="#0f172a">pengembangan 4 hipotesis penelitian.</text>

    <!-- Handwritten Dosen Feedback -->
    <text x="452" y="32" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12.5" fill="#1e40af">- Hipotesis 3 perlu landasan teori mediasi.</text>
    <text x="452" y="52" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12.5" fill="#1e40af">- Matriks penelitian terdahulu diringkas.</text>
    <text x="452" y="72" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12.5" fill="#1e40af">- Perbaiki sitasi gaya APA 7th.</text>

    <!-- Blue Pen Signature / Paraf Dosen -->
    <path d="M 652 48 C 668 20, 670 60, 686 35 C 692 55, 665 68, 682 72" fill="none" stroke="#2563EB" stroke-width="2.3" stroke-linecap="round" />
  </g>

  <!-- Row 3 -->
  <g transform="translate(50, 582)">
    <rect x="0" y="0" width="700" height="95" fill="#ffffff" stroke="#475569" stroke-width="1" />
    <line x1="50" y1="0" x2="50" y2="95" stroke="#475569" />
    <line x1="180" y1="0" x2="180" y2="95" stroke="#475569" />
    <line x1="440" y1="0" x2="440" y2="95" stroke="#475569" />
    <line x1="640" y1="0" x2="640" y2="95" stroke="#475569" />

    <text x="25" y="45" font-family="'Courier New', monospace" font-size="14" fill="#1e293b" text-anchor="middle">3.</text>
    <text x="115" y="40" font-family="'Comic Sans MS', cursive, sans-serif" font-size="12" fill="#1e3a8a" text-anchor="middle">Senin, 28/09/2026</text>
    <text x="115" y="58" font-family="'Comic Sans MS', cursive, sans-serif" font-size="10" fill="#64748b" text-anchor="middle">(Ruang Dosen FEB)</text>

    <!-- Handwritten Topic -->
    <text x="195" y="35" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="13" fill="#0f172a">BAB III Metode &amp; Kuesioner</text>
    <text x="195" y="55" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12" fill="#0f172a">Uji validitas &amp; reliabilitas butir skala likert.</text>
    <text x="195" y="75" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12" fill="#0f172a">ACC Naskah Pendaftaran Sempro.</text>

    <!-- Handwritten Dosen Feedback -->
    <text x="452" y="32" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12.5" fill="#1e40af">- Populasi &amp; sampling purposive sudah oke.</text>
    <text x="452" y="52" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12.5" fill="#1e40af">- Turnitin &lt; 20% terpenuhi (19%).</text>
    <text x="452" y="72" font-family="'Segoe Script', 'Brush Script MT', cursive" font-size="12.5" fill="#1e40af">- ACC MAJU SEMPRO. Segera daftar!</text>

    <!-- Blue Pen Signature / Paraf Dosen -->
    <path d="M 650 42 C 662 18, 674 58, 688 28 C 696 48, 668 64, 684 76" fill="none" stroke="#2563EB" stroke-width="2.6" stroke-linecap="round" />
  </g>

  <!-- Empty rows lines to simulate realistic physical paper form -->
  <g transform="translate(50, 677)">
    <rect x="0" y="0" width="700" height="95" fill="#ffffff" stroke="#475569" stroke-width="1" />
    <line x1="50" y1="0" x2="50" y2="95" stroke="#475569" />
    <line x1="180" y1="0" x2="180" y2="95" stroke="#475569" />
    <line x1="440" y1="0" x2="440" y2="95" stroke="#475569" />
    <line x1="640" y1="0" x2="640" y2="95" stroke="#475569" />
    <text x="25" y="45" font-family="'Courier New', monospace" font-size="14" fill="#94a3b8" text-anchor="middle">4.</text>
    <text x="310" y="52" font-family="Arial, sans-serif" font-size="11" fill="#cbd5e1" font-style="italic" text-anchor="middle">-- Kolom Sesi Bimbingan Berikutnya --</text>
  </g>

  <!-- Footer Catatan & Tanda Tangan Pengesahan Dosen -->
  <g transform="translate(50, 800)">
    <rect x="0" y="0" width="700" height="240" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
    <text x="20" y="24" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">KETENTUAN AKADEMIK BIMBINGAN LURING FEB UTM:</text>
    <text x="20" y="42" font-family="Arial, sans-serif" font-size="10.5" fill="#475569">1. Mahasiswa jenjang S1 wajib memenuhi minimal 8 (delapan) kali konsultasi substantif sebelum mendaftar sidang.</text>
    <text x="20" y="58" font-family="Arial, sans-serif" font-size="10.5" fill="#475569">2. Lembar kendali fisik ini diparaf langsung oleh Dosen Pembimbing pada setiap akhir sesi tatap muka.</text>
    <text x="20" y="74" font-family="Arial, sans-serif" font-size="10.5" fill="#475569">3. Hasil pindai (scan) PDF/JPG kartu ini diunggah ke SIM-TA FEB UTM sebagai bukti pemenuhan syarat berkas ujian.</text>

    <!-- Signatures -->
    <g transform="translate(450, 95)">
      <text x="110" y="16" font-family="Arial, sans-serif" font-size="11" fill="#334155" text-anchor="middle">Bangkalan, 28 September 2026</text>
      <text x="110" y="32" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Dosen Pembimbing Skripsi,</text>
      
      <!-- Signature graphic -->
      <path d="M 40 70 C 80 40, 95 100, 130 50 C 160 85, 140 100, 185 80" fill="none" stroke="#1E40AF" stroke-width="2.5" stroke-linecap="round" />
      
      <text x="110" y="115" font-family="Arial, sans-serif" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle" text-decoration="underline">Dra. Hj. S. Anugrahini Irawati, M.M.</text>
      <text x="110" y="130" font-family="Arial, sans-serif" font-size="10.5" fill="#475569" text-anchor="middle">NIP. 196203031988032001</text>
    </g>
  </g>
</svg>
`)}`;

/**
 * Membaca berkas file dari <input type="file"> dan menghasilkan Data URL
 */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
