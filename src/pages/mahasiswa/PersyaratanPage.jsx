import React, { useState, useMemo, useRef } from 'react';
import { PageHeader } from '../../components/shell';
import { 
  Panel, 
  Button, 
  StatusBadge, 
  Badge, 
  Alert, 
  ProgressIndicator, 
  RequirementItem, 
  Modal, 
  FormField, 
  Input,
  Select
} from '../../components/ui';
import { notify } from '../../components/feedback';
import { PROGRAM_STUDI_INFO, TURNITIN_RULES, getIstilahTA } from '../../data/pedomanRules';
import {
  FileCheck,
  ShieldCheck,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Check,
  X,
  Eye,
  Info,
  GraduationCap,
  Award,
  ScanLine,
  Layers,
  Sparkles,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

/**
 * Definisi field metrik verifikasi akademik.
 * Setiap field opsional; relevansinya ditentukan oleh jenis persyaratan.
 */
const METRIK_FIELD_DEFS = {
  ipk: { label: 'IPK Saat Ini', icon: 'grad', type: 'number', step: '0.01', min: 0, max: 4, placeholder: 'cth: 3.72' },
  sksLulus: { label: 'Total SKS Lulus', type: 'number', min: 0, max: 300, placeholder: 'cth: 124' },
  toeflScore: { label: 'Skor TOEFL', icon: 'award', type: 'number', min: 0, max: 700, placeholder: 'cth: 480' },
  similarity: { label: 'Similarity Turnitin (%)', type: 'number', min: 0, max: 100, placeholder: 'cth: 19' },
  aiDetection: { label: 'AI Detection (%)', type: 'number', min: 0, max: 100, placeholder: 'cth: 24' },
  sertifikatNo: { label: 'Nomor Sertifikat', type: 'text', placeholder: 'cth: NO.SK-PLAG-S1/FEB-UTM/09/2026' },
  sertifikatTgl: { label: 'Tanggal Sertifikat', type: 'date' }
};

const ALL_METRIK_KEYS = Object.keys(METRIK_FIELD_DEFS);

/**
 * Format metrik menjadi ringkasan teks yang mudah dibaca mahasiswa/admin.
 */
function formatMetrikRingkas(m) {
  if (!m) return '';
  const parts = [];
  if (m.ipk !== undefined && m.ipk !== null) parts.push(`IPK ${m.ipk}`);
  if (m.sksLulus !== undefined && m.sksLulus !== null) parts.push(`${m.sksLulus} SKS`);
  if (m.toeflScore !== undefined && m.toeflScore !== null) parts.push(`TOEFL ${m.toeflScore}`);
  if (m.similarity !== undefined && m.similarity !== null) parts.push(`Similarity ${m.similarity}%`);
  if (m.aiDetection !== undefined && m.aiDetection !== null) parts.push(`AI ${m.aiDetection}%`);
  if (m.sertifikatNo) parts.push(`No. ${m.sertifikatNo}`);
  if (m.sertifikatTgl) parts.push(`Tgl ${m.sertifikatTgl}`);
  return parts.join(' • ');
}

/**
 * Menentukan field metrik yang RELEVAN untuk sebuah jenis persyaratan,
 * sehingga formulir menampilkan hanya field yang bermakna (kontekstual).
 */
function getMetrikFieldKeys(req) {
  if (!req) return ALL_METRIK_KEYS;
  const id = String(req.id || '').toLowerCase();
  const kat = String(req.kategori || '').toLowerCase();

  if (id.includes('turnitin') || kat.includes('integritas')) {
    return ['similarity', 'aiDetection', 'sertifikatNo'];
  }
  if (id.includes('toefl') || kat.includes('bahasa')) {
    return ['toeflScore', 'sertifikatNo', 'sertifikatTgl'];
  }
  if (id.includes('transkrip') || id.includes('krs') || kat.includes('administrasi')) {
    return ['ipk', 'sksLulus'];
  }
  // Default: sertifikat/surat umum.
  return ['sertifikatNo', 'sertifikatTgl'];
}

/**
 * Halaman Persyaratan Ujian Mahasiswa — SIM-TA FEB UTM
 * 
 * Fitur Utama:
 * 1. Struktur Persyaratan 2-Tingkat Terpadu:
 *    - Syarat Wajib Umum: Mutlak untuk seluruh mahasiswa (KRS, TOEFL, Turnitin, Bimbingan, ACC Pembimbing, Bebas Tanggungan).
 *    - Syarat Khusus Skema: Disesuaikan secara dinamis dengan skema yang dipilih (TAKT, TAKK Skema 1, TAKK Skema 2).
 * 2. Smart-Sync Portofolio (Fleksibilitas Penuh):
 *    - Mahasiswa tidak dipaksa mengisi seluruh slot kategori portofolio jika memiliki akumulasi prestasi (misal >1 juara lomba).
 *    - Syarat khusus tersinkronisasi otomatis dengan Menu Portofolio tanpa perlu mengunggah ulang dokumen.
 * 3. Sinkronisasi Real-Time dengan Antrean Verifikasi Admin Akademik (VerifikasiBerkasPage).
 */
export default function PersyaratanPage({ 
  student, 
  onNavigate,
  verifikasiList = [],
  onUploadPersyaratan
}) {
  const prodiInfo = PROGRAM_STUDI_INFO[student?.jenjang] || PROGRAM_STUDI_INFO.S1;
  const istilahTA = getIstilahTA(student, prodiInfo);
  const isTAKK = student?.jenisTA === 'TAKK';

  // State Modal Unggah
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [catatanMahasiswa, setCatatanMahasiswa] = useState('');
  
  // Metrik verifikasi yang diisi mahasiswa untuk mempercepat pengecekan admin
  const [metrik, setMetrik] = useState({
    ipk: student?.ipk ?? '',
    sksLulus: student?.sksLulus ?? '',
    toeflScore: student?.toefl ?? '',
    sertifikatNo: '',
    sertifikatTgl: '',
    similarity: student?.turnitin?.similarity ?? '',
    aiDetection: student?.turnitin?.aiDetection ?? ''
  });
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  // Ambil data pengajuan Skema 1 (jika ada di localStorage / profil mahasiswa)
  const skema1Data = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const key = `skema1_takk_${student?.nim || student?.id}`;
    const saved = localStorage.getItem(key);
    if (saved === 'CANCELLED') return null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    if (student?.skemaTAKK === 'Konversi Langsung' || student?.skema1Pengajuan) {
      return student.skema1Pengajuan || null;
    }
    return null;
  }, [student]);

  const isSkema1 = isTAKK && (student?.skemaTAKK === 'Konversi Langsung' || Boolean(skema1Data));

  // Ambil data portofolio kumulatif aktif (Skema 2)
  const portoItems = useMemo(() => {
    if (Array.isArray(student?.portofolioData?.items)) {
      return student.portofolioData.items;
    }
    return [];
  }, [student]);

  const portoTotalPoin = useMemo(() => {
    if (typeof student?.portofolioData?.totalPoin === 'number' && student.portofolioData.totalPoin > 0) {
      return student.portofolioData.totalPoin;
    }
    return portoItems.reduce((acc, it) => acc + (Number(it.poin) || 0), 0);
  }, [student, portoItems]);

  const lombaAchievements = useMemo(() => {
    return portoItems.filter(it => 
      (it.kategori || '').toLowerCase().includes('lomba') || 
      (it.kategori || '').toLowerCase().includes('prestasi') ||
      (it.nama || '').toLowerCase().includes('juara')
    );
  }, [portoItems]);

  // Label nama skema aktif
  const namaSkemaKhusus = useMemo(() => {
    if (student?.jenjang === 'S3') return 'Program Doktoral (Disertasi)';
    if (student?.jenjang === 'S2') return 'Program Magister (Tesis)';
    if (student?.jenjang === 'D3') return 'Program Diploma Tiga (Karya Terapan)';
    if (!isTAKK) return 'TAKT (Skripsi Reguler Standar)';
    if (isSkema1) return 'TAKK Skema 1 (Konversi Prestasi Langsung)';
    return 'TAKK Skema 2 (Portofolio Prestasi Kumulatif)';
  }, [student, isTAKK, isSkema1]);

  // Cari data verifikasi mahasiswa di antrean Admin Akademik
  const studentVerifikasi = useMemo(() => {
    if (!student) return null;
    return verifikasiList.find(
      v => v.nim === student.nim || v.mhsId === student.id
    );
  }, [verifikasiList, student]);

  // Deteksi akun demo bawaan
  const isDemoStudent = useMemo(() => {
    return ['210211100142', '210211100219', '220231600004', '220211100088', '220212100018'].includes(String(student?.nim || '').trim());
  }, [student]);

  // Master Definisi Persyaratan Terstruktur: Syarat Wajib & Syarat Khusus Skema
  const masterRequirements = useMemo(() => {
    const jenjang = student?.jenjang || 'S1';

    // 1. DOKTORAL (S3)
    if (jenjang === 'S3') {
      return [
        {
          id: 'transkrip_s3',
          tipeSyarat: 'wajib',
          nama: 'Transkrip Nilai Doktoral (IPK ≥ 3.00 & Maksimal Satu Nilai B+)',
          kategori: 'Administrasi Akademik',
          rule: 'Buku Pedoman 2026 Bab IV Halaman 54',
          pedomanMin: 'IPK ≥ 3.00, seluruh 48 SKS tempuh tervalidasi',
          defaultAchievement: `IPK Terpenuhi: ${student?.ipk || 3.82} (Transkrip 48 SKS Lengkap)`,
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: IPK 3.82, 48 SKS telah tuntas tervalidasi'
        },
        {
          id: 'toefl_s3',
          tipeSyarat: 'wajib',
          nama: `Sertifikat Standar Kecakapan Bahasa Inggris (TOEFL Score ≥ ${prodiInfo.toeflMin})`,
          kategori: 'Kompetensi Bahasa',
          rule: 'Buku Pedoman 2026 Bab IV Halaman 55',
          pedomanMin: `Skor minimal ${prodiInfo.toeflMin} dari UPT Bahasa UTM atau institusi resmi terakreditasi`,
          defaultAchievement: `Skor TOEFL: ${student?.toefl || 525} (Lolos Ambang Minimal 500)`,
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: Skor TOEFL 525, UPT Bahasa UTM, tgl tes 14/08/2026'
        },
        {
          id: 'turnitin_s3',
          tipeSyarat: 'wajib',
          nama: `Surat Keterangan Bebas Plagiasi Turnitin (Similarity ≤ ${prodiInfo.turnitinSimilarityMax}% & AI ≤ ${prodiInfo.turnitinAiMax}%)`,
          kategori: 'Integritas Akademik',
          rule: TURNITIN_RULES.dasarHukum,
          pedomanMin: `Similarity maks ${prodiInfo.turnitinSimilarityMax}% dan skor AI maks ${prodiInfo.turnitinAiMax}%`,
          defaultAchievement: `Similarity ${student?.turnitin?.similarity || 16}% & AI ${student?.turnitin?.aiDetection || 18}%`,
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: Similarity 16%, AI 18%, No SK: SK-PLAG-S3/FEB-UTM/09/2026'
        },
        {
          id: 'acc_promotor_s3',
          tipeSyarat: 'wajib',
          nama: 'Lembar Persetujuan Promotor dan Kopromotor',
          kategori: 'Persetujuan Pembimbing',
          rule: 'Buku Pedoman 2026 Bab IV Pasal 15',
          pedomanMin: 'Ditandatangani lengkap oleh Promotor Utama dan Kopromotor',
          defaultAchievement: 'Promotor & Kopromotor Telah Memberikan ACC Naskah',
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: ACC Promotor Utama Prof. Wantara & Kopromotor Dr. Iriani'
        },
        {
          id: 'bebas_tanggungan_s3',
          tipeSyarat: 'wajib',
          nama: 'Surat Bebas Tanggungan Perpustakaan & Keuangan (SPP Lunas)',
          kategori: 'Administrasi Umum',
          rule: 'Buku Pedoman 2026 Bab IV Ketentuan Umum',
          pedomanMin: 'Bebas tunggakan SPP semester berjalan dan bebas pinjaman perpustakaan',
          defaultAchievement: 'Bebas tunggakan semester Ganjil 2026/2027',
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: Surat Bebas Tanggungan FEB UTM tgl 02 Oktober 2026'
        },
        // Syarat Khusus S3
        {
          id: 'desk_review_s3',
          tipeSyarat: 'khusus',
          nama: 'Berita Acara & Nilai Ujian Kelayakan Disertasi (Desk Review ≥ 70)',
          kategori: 'Tahapan Akademik',
          rule: 'Buku Pedoman 2026 Bab V — Syarat Ujian Tertutup Disertasi',
          pedomanMin: 'Nilai Akhir Ujian Kelayakan minimal 70.00 (Grade B+) dan dinyatakan layak',
          defaultAchievement: 'Nilai Akhir 75.67 (Layak Revisi Minor telah disahkan tim penilai)',
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: Nilai Akhir Desk Review 75.67 (B+), disahkan 3 penilai independen'
        },
        {
          id: 'publikasi_s3',
          tipeSyarat: 'khusus',
          nama: 'Bukti LoA / Publikasi Jurnal Internasional Bereputasi (Scopus min Q4 / WoS)',
          kategori: 'Luaran Publikasi',
          rule: 'Buku Pedoman 2026 Bab VIII Halaman 70',
          pedomanMin: 'Penulis pertama berafiliasi UTM pada jurnal terindeks Scopus (Q1/Q2/Q3/Q4) atau WoS',
          defaultAchievement: student?.publikasi?.jurnal || 'Scopus Q1 Accepted (Journal of Open Innovation)',
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: LoA Elsevier Scopus Q1, Journal of Open Innovation'
        },
        {
          id: 'naskah_s3',
          tipeSyarat: 'khusus',
          nama: 'Naskah Disertasi Lengkap Siap Uji (7 Eksemplar)',
          kategori: 'Naskah Ujian',
          rule: 'Buku Pedoman 2026 Bab V Pasal 18',
          pedomanMin: 'Naskah final siap uji rangkap 7 diserahkan kepada Koorprodi S3',
          defaultAchievement: 'Naskah Disertasi Lengkap Final Rangkap 7',
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: Naskah final telah diverifikasi format pedoman disertasi FEB'
        }
      ];
    }

    // 2. MAGISTER (S2)
    if (jenjang === 'S2') {
      return [
        {
          id: 'transkrip_s2',
          tipeSyarat: 'wajib',
          nama: `Transkrip Nilai & Beban SKS Magister (Lulus ≥ ${prodiInfo.sksMin})`,
          kategori: 'Administrasi Akademik',
          rule: 'Buku Pedoman 2026 Bab IV Halaman 48',
          pedomanMin: 'Lulus minimal 36 SKS dengan IPK ≥ 3.00',
          defaultAchievement: `Capaian: ${student?.sksLulus || 38} SKS (IPK ${student?.ipk || 3.75})`,
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: Total 38 SKS tempuh, IPK 3.75'
        },
        {
          id: 'toefl_s2',
          tipeSyarat: 'wajib',
          nama: `Sertifikat Kemampuan Bahasa Inggris (TOEFL Score ≥ ${prodiInfo.toeflMin})`,
          kategori: 'Kompetensi Bahasa',
          rule: 'Buku Pedoman 2026 Bab IV Halaman 49',
          pedomanMin: `Skor minimal ${prodiInfo.toeflMin} dari UPT Bahasa UTM`,
          defaultAchievement: `Skor: ${student?.toefl || 485} (Memenuhi Syarat Minimal 475)`,
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: Skor TOEFL 485, UPT Bahasa UTM'
        },
        {
          id: 'turnitin_s2',
          tipeSyarat: 'wajib',
          nama: `Surat Keterangan Bebas Plagiasi Turnitin (Similarity ≤ ${prodiInfo.turnitinSimilarityMax}% & AI ≤ ${prodiInfo.turnitinAiMax}%)`,
          kategori: 'Integritas Akademik',
          rule: TURNITIN_RULES.dasarHukum,
          pedomanMin: `Similarity maksimal ${prodiInfo.turnitinSimilarityMax}% untuk jenjang Magister`,
          defaultAchievement: `Hasil Turnitin: ${student?.turnitin?.similarity || 20}%`,
          defaultStatus: (student?.turnitin?.similarity || 20) <= prodiInfo.turnitinSimilarityMax ? 'Disetujui' : 'Perlu Perbaikan',
          placeholderCatatan: 'Contoh: Similarity 20%, AI 25%, bebas plagiasi disahkan'
        },
        {
          id: 'acc_pembimbing_s2',
          tipeSyarat: 'wajib',
          nama: 'Lembar Persetujuan Naskah Tesis oleh Kedua Pembimbing',
          kategori: 'Persetujuan Pembimbing',
          rule: 'Buku Pedoman 2026 Bab IV Pasal 14',
          pedomanMin: 'Ditandatangani lengkap oleh Pembimbing I dan Pembimbing II',
          defaultAchievement: 'Persetujuan Pembimbing I dan II Lengkap',
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: ACC Pembimbing I Prof. Wantara & Pembimbing II Dr. Rita'
        },
        {
          id: 'bebas_tanggungan_s2',
          tipeSyarat: 'wajib',
          nama: 'Surat Bebas Tanggungan Perpustakaan & Administrasi SPP',
          kategori: 'Administrasi Umum',
          rule: 'Buku Pedoman 2026 Ketentuan Bebas Tanggungan',
          pedomanMin: 'Bebas pinjaman perpustakaan dan lunas SPP semester berjalan',
          defaultAchievement: 'Bebas Tanggungan Perpustakaan & Bebas Tunggakan SPP',
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: Surat Bebas Tanggungan FEB UTM'
        },
        // Syarat Khusus S2
        {
          id: 'publikasi_s2',
          tipeSyarat: 'khusus',
          nama: 'Bukti Submit / LoA Artikel Jurnal Minimal SINTA 2',
          kategori: 'Luaran Publikasi',
          rule: 'Buku Pedoman 2026 Bab VIII Persyaratan Kelulusan',
          pedomanMin: 'Artikel ilmiah accepted pada Jurnal Nasional Terakreditasi SINTA 1 / SINTA 2',
          defaultAchievement: 'LoA Jurnal Manajemen Terapan (SINTA 2)',
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: LoA Jurnal Manajemen Terapan SINTA 2 Vol. 14'
        },
        {
          id: 'naskah_s2',
          tipeSyarat: 'khusus',
          nama: 'Draf Naskah Tesis Lengkap Rangkap 4 untuk Dewan Penguji',
          kategori: 'Naskah Ujian',
          rule: 'Buku Pedoman 2026 Bab IV Ketentuan Sidang',
          pedomanMin: 'Naskah tesis lengkap dijilid rangkap 4 diserahkan paling lambat H-3 ujian',
          defaultAchievement: 'Draf Naskah Tesis Lengkap Diserahkan',
          defaultStatus: 'Menunggu Verifikasi',
          placeholderCatatan: 'Contoh: Naskah tesis rangkap 4 format pedoman 2026'
        }
      ];
    }

    // 3. DIPLOMA TIGA (D3)
    if (jenjang === 'D3') {
      return [
        {
          id: 'transkrip_d3',
          tipeSyarat: 'wajib',
          nama: 'KRS & Transkrip SKS Lulus Magang Industri & Teori (≥ 100 SKS)',
          kategori: 'Administrasi Akademik',
          rule: 'Buku Pedoman 2026 Bab IV Ketentuan D3',
          pedomanMin: 'Lulus seluruh mata kuliah dan magang kerja dengan minimal 100 SKS',
          defaultAchievement: `Total ${student?.sksLulus || 106} SKS Lulus`,
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: Transkrip 106 SKS lengkap dan disahkan DPA'
        },
        {
          id: 'acc_d3',
          tipeSyarat: 'wajib',
          nama: 'Surat Persetujuan Ujian dari Dosen Pembimbing Usaha',
          kategori: 'Persetujuan Pembimbing',
          rule: 'Buku Pedoman 2026 Bab IV',
          pedomanMin: 'Disetujui oleh dosen pembimbing tugas akhir terapan',
          defaultAchievement: 'ACC Dosen Pembimbing Usaha Terpenuhi',
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: ACC Pembimbing Dr. Iriani Ismail tgl 28/09/2026'
        },
        {
          id: 'bebas_lab_d3',
          tipeSyarat: 'wajib',
          nama: 'Surat Bebas Tanggungan Biaya Praktikum & Laboratorium FEB',
          kategori: 'Administrasi Umum',
          rule: 'Buku Pedoman 2026 Ketentuan Bebas Tanggungan',
          pedomanMin: 'Bebas tanggungan laboratorium bisnis dan keuangan',
          defaultAchievement: 'Bebas Tanggungan Terpenuhi',
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: Bebas Tanggungan Lab Bisnis FEB UTM'
        },
        // Syarat Khusus D3
        {
          id: 'portofolio_d3',
          tipeSyarat: 'khusus',
          nama: 'Laporan Portofolio & Kelayakan Usaha Bisnis Terapan',
          kategori: 'Karya Terapan',
          rule: 'Buku Pedoman 2026 Bab IV Penyusunan Tugas Akhir D3',
          pedomanMin: 'Laporan portofolio bisnis dan laporan finansial operasional lengkap',
          defaultAchievement: 'Laporan portofolio finansial & omzet disertakan',
          defaultStatus: 'Disetujui',
          placeholderCatatan: 'Contoh: Laporan Business Plan & Realisasi Omzet Kuliner'
        }
      ];
    }

    // 4. STRATA SATU (S1) — Syarat Wajib Umum (Mutlak untuk TAKT & TAKK)
    const syaratWajibS1 = [
      {
        id: 'krs_s1',
        tipeSyarat: 'wajib',
        nama: 'KRS Semester Berjalan & Beban SKS Prasyarat (Lulus ≥ 120 SKS, D/D+ maks 2 MK, Tanpa E)',
        kategori: 'Administrasi Akademik',
        rule: 'Buku Pedoman 2026 Bab IV Halaman 24',
        pedomanMin: 'Lulus ≥ 120 SKS, D/D+ maks 2 mata kuliah, tanpa nilai E, IPK ≥ 2.00',
        defaultAchievement: `Capaian: ${student?.sksLulus || 124} SKS (IPK ${student?.ipk || 3.52})`,
        defaultStatus: 'Disetujui',
        placeholderCatatan: 'Contoh: Total 124 SKS tempuh, IPK 3.52 disahkan DPA'
      },
      {
        id: 'toefl_s1',
        tipeSyarat: 'wajib',
        nama: `Sertifikat Kemampuan Bahasa Inggris (TOEFL Score ≥ ${prodiInfo.toeflMin || 450})`,
        kategori: 'Kompetensi Bahasa',
        rule: 'Buku Pedoman 2026 Bab IV Halaman 25',
        pedomanMin: `Skor minimal ${prodiInfo.toeflMin || 450} dari UPT Bahasa UTM atau tes resmi`,
        defaultAchievement: `Skor TOEFL: ${student?.toefl || 460} (Lolos Ambang Minimal ${prodiInfo.toeflMin || 450})`,
        defaultStatus: 'Disetujui',
        placeholderCatatan: 'Contoh: Skor TOEFL 460, UPT Bahasa UTM tgl 18/07/2026'
      },
      {
        id: 'turnitin_s1',
        tipeSyarat: 'wajib',
        nama: `Surat Keterangan Bebas Plagiasi Turnitin (Similarity ≤ ${prodiInfo.turnitinSimilarityMax || 25}% & AI ≤ ${prodiInfo.turnitinAiMax || 30}%)`,
        kategori: 'Integritas Akademik',
        rule: TURNITIN_RULES.dasarHukum,
        pedomanMin: `Similarity maksimal ${prodiInfo.turnitinSimilarityMax || 25}% dan AI maksimal ${prodiInfo.turnitinAiMax || 30}%`,
        defaultAchievement: `Similarity ${student?.turnitin?.similarity || 19}% & AI ${student?.turnitin?.aiDetection || 24}%`,
        defaultStatus: 'Disetujui',
        placeholderCatatan: 'Contoh: Similarity 19%, AI 24%, SK-PLAG-S1/FEB/2026'
      },
      {
        id: 'bimbingan_s1',
        tipeSyarat: 'wajib',
        nama: 'Kartu Kendali / Logbook Bimbingan (Minimal 8 Sesi Konsultasi Dosen Pembimbing)',
        kategori: 'Proses Pembimbingan',
        rule: 'Buku Pedoman 2026 Bab III Halaman 22',
        pedomanMin: 'Minimal 8 sesi bimbingan tatap muka tercatat dan divalidasi dosen pembimbing',
        defaultAchievement: `Tercatat: ${student?.bimbinganCount || 8} Sesi Bimbingan Disetujui`,
        defaultStatus: 'Disetujui',
        placeholderCatatan: 'Contoh: 8 sesi bimbingan tatap muka tervalidasi dosen pembimbing'
      },
      {
        id: 'acc_pembimbing_s1',
        tipeSyarat: 'wajib',
        nama: 'Lembar Persetujuan Naskah / Ujian (ACC) oleh Dosen Pembimbing Utama',
        kategori: 'Persetujuan Pembimbing',
        rule: 'Buku Pedoman 2026 Bab IV Halaman 26',
        pedomanMin: 'Lembar persetujuan ujian ditandatangani lengkap oleh Dosen Pembimbing',
        defaultAchievement: 'Persetujuan Pembimbing Utama Tervalidasi',
        defaultStatus: 'Disetujui',
        placeholderCatatan: 'Contoh: Telah di-ACC oleh Dosen Pembimbing Utama'
      },
      {
        id: 'bebas_tanggungan_s1',
        tipeSyarat: 'wajib',
        nama: 'Surat Bebas Tanggungan Perpustakaan & Keuangan Fakultas',
        kategori: 'Administrasi Umum',
        rule: 'Buku Pedoman 2026 Ketentuan Bebas Tanggungan',
        pedomanMin: 'Bebas pinjaman perpustakaan dan lunas SPP semester berjalan',
        defaultAchievement: 'Bebas Tanggungan Perpustakaan & UKT Semester Berjalan Disahkan',
        defaultStatus: 'Disetujui',
        placeholderCatatan: 'Contoh: Surat Bebas Tanggungan FEB UTM tgl 02 Oktober 2026'
      }
    ];

    // Syarat Khusus S1: Disesuaikan dengan Skema Mahasiswa
    let syaratKhususS1 = [];

    if (!isTAKK) {
      // Skema Reguler TAKT (Skripsi Standar)
      syaratKhususS1 = [
        {
          id: 'naskah_s1_takt',
          tipeSyarat: 'khusus',
          nama: 'Draf Naskah Proposal / Skripsi Rangkap 3 untuk Dewan Penguji',
          kategori: 'Naskah Ujian',
          rule: 'Buku Pedoman 2026 Bab IV Halaman 27',
          pedomanMin: 'Naskah draf skripsi dijilid rangkap 3 diserahkan H-3 sebelum ujian',
          defaultAchievement: 'Draf fisik naskah skripsi rangkap 3 siap diserahkan',
          defaultStatus: 'Menunggu Verifikasi',
          placeholderCatatan: 'Contoh: Naskah draf skripsi rangkap 3 format pedoman FEB'
        }
      ];
    } else if (isSkema1) {
      // Skema 1 TAKK (Konversi Prestasi Langsung via SK Dekan)
      syaratKhususS1 = [
        {
          id: 'takk_skema1_prestasi',
          tipeSyarat: 'khusus',
          isPortofolioLinked: true,
          nama: 'Dokumen Pengajuan Prestasi Unggulan (Konversi Langsung Nilai A via SK Dekan)',
          kategori: 'Prestasi Unggulan (Skema 1)',
          rule: 'Buku Pedoman 2026 Bab IV — Skema Konversi Langsung Nilai A',
          pedomanMin: '1 Prestasi Emas: Juara 1–3 Nasional Puspresnas ATAU Artikel Ilmiah Jurnal SINTA 1–2 / Scopus terbit saat aktif',
          defaultAchievement: skema1Data 
            ? `Pengajuan di Portofolio: "${skema1Data.judulKarya || skema1Data.namaPrestasi || 'Prestasi Unggulan'}" • Status: ${skema1Data.statusPengajuan || 'Diajukan ke Koorprodi'}`
            : 'Belum Ada Pengajuan (Wajib diajukan di Menu Portofolio > Tab Skema 1)',
          defaultStatus: skema1Data ? 'Disetujui' : 'Belum Lengkap',
          placeholderCatatan: 'Prestasi terhubung otomatis dengan pengajuan di Menu Portofolio'
        }
      ];
    } else {
      // Skema 2 TAKK (Portofolio Prestasi Kumulatif) — Fleksibel (tanpa paksaan semua kategori)
      syaratKhususS1 = [
        {
          id: 'takk_skema2_poin',
          tipeSyarat: 'khusus',
          isPortofolioLinked: true,
          nama: 'Akumulasi Poin Portofolio Mandiri (Ambang Batas Kelayakan ≥ 70 Poin)',
          kategori: 'Portofolio Mandiri (Skema 2)',
          rule: 'Buku Pedoman 2026 Bab IV — Skema TAKK Halaman 13-15',
          pedomanMin: 'Akumulasi total nilai portofolio minimal 70 Poin. Mahasiswa fleksibel mengumpulkan prestasi (misal memiliki beberapa juara lomba) tanpa diwajibkan mengisi seluruh kategori instrumen.',
          defaultAchievement: (portoTotalPoin >= 70)
            ? `Terpenuhi: ${portoTotalPoin} Poin Kumulatif dari ${portoItems.length} Berkas Portofolio (${lombaAchievements.length > 1 ? `${lombaAchievements.length} Kejuaraan / Prestasi Lomba` : 'Portofolio Terpadu'}) — Ambang Batas 70 Poin Terlampaui`
            : (portoItems.length > 0)
            ? `Tercatat ${portoItems.length} Berkas Portofolio (${portoTotalPoin} Poin — Kurang ${70 - portoTotalPoin} Poin lagi)`
            : (isDemoStudent ? '82 Poin Terakumulasi dari 2 Kejuaraan Mandiri (Lolos Ambang Batas 70 Poin)' : 'Belum Terpenuhi (0 / 70 Poin — Wajib kumpulkan minimal 70 poin di Menu Portofolio)'),
          defaultStatus: (portoTotalPoin >= 70 || isDemoStudent) ? 'Disetujui' : 'Belum Lengkap',
          placeholderCatatan: 'Terhubung otomatis dengan akumulasi poin di Menu Portofolio'
        },
        {
          id: 'takk_skema2_laporan',
          tipeSyarat: 'khusus',
          isPortofolioLinked: true,
          nama: 'Laporan Portofolio Komprehensif / Naskah Karya Terapan',
          kategori: 'Naskah Portofolio',
          rule: 'Buku Pedoman 2026 Bab IV — Skema Tugas Akhir Non-Skripsi (TAKK)',
          pedomanMin: 'Laporan deskripsi portofolio komprehensif terpadu dan matriks konversi nilai divalidasi pembimbing',
          defaultAchievement: (portoItems.length > 0 || isDemoStudent)
            ? 'Naskah Laporan Komprehensif & Matriks Poin Terpadu Siap Diseminasi (Tersinkron dari Portofolio)'
            : 'Draf laporan komprehensif belum diunggah di Menu Portofolio',
          defaultStatus: (portoItems.length > 0 || isDemoStudent) ? 'Disetujui' : 'Belum Lengkap',
          placeholderCatatan: 'Tersinkron otomatis dengan dokumen portofolio'
        },
        {
          id: 'takk_skema2_publikasi',
          tipeSyarat: 'khusus',
          isPortofolioLinked: true,
          nama: 'Bukti Luaran Publikasi Artikel Ilmiah (Sesuai Capaian NA Portofolio)',
          kategori: 'Luaran Publikasi',
          rule: 'Buku Pedoman 2026 Bab IV & Bab VIII — Luaran Wajib TAKK',
          pedomanMin: 'Artikel ilmiah pada jurnal terakreditasi sesuai capaian NA (NA ≥ 70: SINTA 5; NA ≥ 80: SINTA 6; NA ≥ 90: non-SINTA)',
          defaultAchievement: student?.publikasi?.judulArtikel
            ? `${student.publikasi.judulArtikel} (${student.publikasi.indeks || 'SINTA 5'})`
            : (portoTotalPoin >= 70 || isDemoStudent)
            ? 'LoA Artikel Ilmiah Terakreditasi Nasional (Sesuai Hasil Konversi NA Portofolio)'
            : 'Belum Terpenuhi (Kewajiban luaran artikel ilmiah jurnal sesuai capaian NA portofolio)',
          defaultStatus: (student?.publikasi?.judulArtikel || portoTotalPoin >= 70 || isDemoStudent) ? 'Disetujui' : 'Belum Lengkap',
          placeholderCatatan: 'Tersinkron otomatis dengan data publikasi/portofolio'
        }
      ];
    }

    return [...syaratWajibS1, ...syaratKhususS1];
  }, [student, prodiInfo, isTAKK, isSkema1, skema1Data, portoItems, portoTotalPoin, lombaAchievements, isDemoStudent]);

  // Gabungkan master requirements dengan data verifikasi riil dari Admin
  const mergedRequirements = useMemo(() => {
    return masterRequirements.map((masterReq) => {
      // Jika persyaratan terhubung ke portofolio (smart sync), status & infonya langsung mengacu pada capaian portofolio
      if (masterReq.isPortofolioLinked) {
        return {
          ...masterReq,
          status: masterReq.defaultStatus,
          verifiedInfo: masterReq.defaultAchievement
        };
      }

      // Cek apakah ada berkas yang cocok di berkasList admin
      if (studentVerifikasi?.berkasList) {
        const foundBerkas = studentVerifikasi.berkasList.find((b) => {
          if (b.id === masterReq.id) return true;
          const bName = (b.nama || '').toLowerCase();
          const mName = (masterReq.nama || '').toLowerCase();
          return bName.includes(mName.slice(0, 15)) || mName.includes(bName.slice(0, 15));
        });

        if (foundBerkas) {
          const mapStatus = 
            foundBerkas.status === 'Lengkap' ? 'Disetujui' :
            foundBerkas.status === 'Perlu Perbaikan' ? 'Perlu Perbaikan' :
            'Menunggu Verifikasi';

          return {
            ...masterReq,
            status: mapStatus,
            uploadedFile: foundBerkas.file,
            adminCatatan: foundBerkas.catatan,
            tanggalUnggah: foundBerkas.tanggalUnggah,
            metrik: foundBerkas.metrik || null,
            verifiedInfo: foundBerkas.file 
              ? `Berkas: ${foundBerkas.file}${foundBerkas.catatan ? ` • ${foundBerkas.catatan}` : ''}${foundBerkas.tanggalUnggah ? ` • ${foundBerkas.tanggalUnggah}` : ''}`
              : (isDemoStudent ? masterReq.defaultAchievement : 'Berkas diunggah, menunggu verifikasi admin')
          };
        }
      }

      // Default jika belum tercatat di berkasList admin:
      return {
        ...masterReq,
        status: isDemoStudent ? masterReq.defaultStatus : 'Belum Diunggah',
        verifiedInfo: isDemoStudent ? masterReq.defaultAchievement : 'Belum ada dokumen yang diunggah untuk persyaratan ini'
      };
    });
  }, [masterRequirements, studentVerifikasi, isDemoStudent]);

  // Pisahkan mergedRequirements menjadi 2 Tingkat: Syarat Wajib vs Syarat Khusus Skema
  const mergedWajib = useMemo(() => {
    return mergedRequirements.filter(r => r.tipeSyarat === 'wajib');
  }, [mergedRequirements]);

  const mergedKhusus = useMemo(() => {
    return mergedRequirements.filter(r => r.tipeSyarat === 'khusus');
  }, [mergedRequirements]);

  const wajibApprovedCount = mergedWajib.filter(r => r.status === 'Disetujui').length;
  const wajibTotal = mergedWajib.length;
  const isWajibApproved = wajibApprovedCount === wajibTotal && wajibTotal > 0;

  const khususApprovedCount = mergedKhusus.filter(r => r.status === 'Disetujui').length;
  const khususTotal = mergedKhusus.length;
  const isKhususApproved = khususApprovedCount === khususTotal && khususTotal > 0;

  const totalApproved = wajibApprovedCount + khususApprovedCount;
  const totalReqs = mergedRequirements.length;
  const isAllApproved = isWajibApproved && isKhususApproved;
  const pendingCount = mergedRequirements.filter(r => r.status === 'Menunggu Verifikasi').length;

  // Buka modal upload (prioritaskan persyaratan yang belum disetujui dan bukan smart-sync portofolio)
  const handleOpenUploadModal = (preferredReqId) => {
    const uploadableList = mergedRequirements.filter(r => !r.isPortofolioLinked);
    const targetId = preferredReqId || (uploadableList[0]?.id || mergedRequirements[0]?.id || '');
    setSelectedReqId(targetId);
    setSelectedFile(null);
    setCatatanMahasiswa('');
    setMetrik({
      ipk: student?.ipk ?? '',
      sksLulus: student?.sksLulus ?? '',
      toeflScore: student?.toefl ?? '',
      sertifikatNo: '',
      sertifikatTgl: '',
      similarity: student?.turnitin?.similarity ?? '',
      aiDetection: student?.turnitin?.aiDetection ?? ''
    });
    setIsUploadModalOpen(true);
  };

  // Persyaratan yang sedang dipilih di modal
  const activeModalReq = useMemo(() => {
    return mergedRequirements.find(r => r.id === selectedReqId) || mergedRequirements[0];
  }, [mergedRequirements, selectedReqId]);

  const metrikKeys = useMemo(() => getMetrikFieldKeys(activeModalReq), [activeModalReq]);

  // Submit pengunggahan berkas
  const handleUploadSubmit = (e) => {
    e.preventDefault();

    if (!activeModalReq) return;
    if (!selectedFile) {
      notify('Pilih berkas dokumen PDF yang akan diunggah terlebih dahulu.', { variant: 'warning' });
      return;
    }

    const payload = {
      mhsId: student?.id,
      nim: student?.nim,
      namaMahasiswa: student?.nama,
      jenjang: student?.jenjang,
      programStudi: student?.programStudi || student?.prodi,
      jenisPersyaratanId: activeModalReq.id,
      jenisPersyaratanNama: activeModalReq.nama,
      fileName: selectedFile.name,
      fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
      catatan: catatanMahasiswa || `Diunggah mandiri oleh mahasiswa (${student?.nama})`,
      fileUrl: '#',
      metrik: {
        ipk: metrik.ipk === '' ? null : Number(metrik.ipk),
        sksLulus: metrik.sksLulus === '' ? null : Number(metrik.sksLulus),
        toeflScore: metrik.toeflScore === '' ? null : Number(metrik.toeflScore),
        sertifikatNo: metrik.sertifikatNo?.trim() || null,
        sertifikatTgl: metrik.sertifikatTgl?.trim() || null,
        similarity: metrik.similarity === '' ? null : Number(metrik.similarity),
        aiDetection: metrik.aiDetection === '' ? null : Number(metrik.aiDetection)
      }
    };

    if (onUploadPersyaratan) {
      onUploadPersyaratan(payload);
    }

    setNotification({
      type: 'success',
      message: `Berkas "${activeModalReq.nama}" (${selectedFile.name}) berhasil dikirim ke antrean verifikasi Admin Akademik!`
    });

    setIsUploadModalOpen(false);
  };

  // Render kartu item persyaratan tunggal
  const renderRequirementRow = (req) => {
    const isApproved = req.status === 'Disetujui';
    const isFix = req.status === 'Perlu Perbaikan';
    const borderAccentColor = isApproved ? '#16a34a' : isFix ? '#dc2626' : req.isPortofolioLinked ? '#4f46e5' : '#0284c7';
    const bgBoxColor = isFix ? '#fff5f5' : '#ffffff';

    return (
      <div
        key={req.id}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 14px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #e2e8f0',
          borderLeft: `4px solid ${borderAccentColor}`,
          backgroundColor: bgBoxColor,
          gap: 'var(--space-3)',
          transition: 'box-shadow 0.15s ease'
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ 
              width: '26px', 
              height: '26px', 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: isApproved ? '#dcfce7' : req.isPortofolioLinked ? '#ede9fe' : '#e0f2fe', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexShrink: 0 
            }}>
              {req.isPortofolioLinked ? (
                <Award size={14} color="#6d28d9" />
              ) : (
                <FileText size={14} color={isApproved ? '#15803d' : '#0284c7'} />
              )}
            </div>
            <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>
              {req.nama}
            </span>
            <Badge variant="neutral" style={{ fontSize: '10.5px' }}>
              {req.kategori}
            </Badge>
            {req.isPortofolioLinked && (
              <span style={{ 
                fontSize: '10px', 
                fontWeight: '700', 
                color: '#6d28d9', 
                backgroundColor: '#f5f3ff', 
                border: '1px solid #ddd6fe',
                borderRadius: '999px',
                padding: '2px 8px'
              }}>
                Tersinkron dari Portofolio
              </span>
            )}
          </div>

          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', paddingLeft: '34px' }}>
            Dasar Regulasi: <strong>{req.rule}</strong> • Ketentuan: {req.pedomanMin}
          </div>

          <div style={{ fontSize: '12px', color: isFix ? '#b91c1c' : req.isPortofolioLinked ? '#581c87' : '#1e3a8a', marginTop: '4px', paddingLeft: '34px', fontWeight: '600' }}>
            Status Capaian: {req.verifiedInfo}
          </div>

          {req.metrik && (
            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px', paddingLeft: '34px' }}>
              Data terverifikasi: <strong>{formatMetrikRingkas(req.metrik)}</strong>
            </div>
          )}

          {isFix && req.adminCatatan && (
            <div style={{ marginLeft: '34px', marginTop: '6px', padding: '6px 10px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', fontSize: '11.5px', color: '#991b1b' }}>
              <strong>Catatan Admin Akademik:</strong> {req.adminCatatan}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2-5)', flexShrink: 0 }}>
          <StatusBadge status={req.status} />
          {req.isPortofolioLinked ? (
            <Button 
              variant={isApproved ? 'secondary' : 'primary'} 
              size="sm" 
              icon={Award}
              onClick={() => onNavigate && onNavigate('portofolio')}
            >
              Buka di Portofolio
            </Button>
          ) : (
            <Button 
              variant={isApproved ? 'secondary' : 'primary'} 
              size="sm" 
              icon={Upload}
              onClick={() => handleOpenUploadModal(req.id)}
            >
              {isApproved ? 'Perbarui' : isFix ? 'Unggah Revisi' : 'Unggah'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header Halaman */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM' },
          { label: `Portal Mahasiswa (${student?.jenjang || 'S1'})` },
          { label: 'Persyaratan Akademik' }
        ]}
        title={`Checklist Persyaratan ${istilahTA} — ${student?.nama || 'Mahasiswa'}`}
        description={`Verifikasi kelengkapan dokumen administratif wajib dan pemenuhan syarat khusus sesuai skema ${namaSkemaKhusus} (Buku Pedoman TA FEB UTM 2026).`}
        statusBadge={
          <Badge variant={isAllApproved ? 'success' : pendingCount > 0 ? 'warning' : 'primary'}>
            {isAllApproved ? 'LENGKAP & MEMENUHI SYARAT' : `${totalApproved} / ${totalReqs} Disetujui`}
          </Badge>
        }
        primaryAction={
          <Button 
            variant="primary"
            icon={Upload}
            onClick={() => handleOpenUploadModal()}
          >
            Unggah Berkas Persyaratan
          </Button>
        }
      />

      {/* Notifikasi feedback */}
      {notification && (
        <Alert
          variant={notification.type}
          title="Status Pengunggahan Berkas"
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}

      {/* 2. Ringkasan Status Kelayakan & Progress Terbagi 2-Tingkat */}
      <Panel
        title="Ringkasan Verifikasi Kelayakan Akademik"
        subtitle={`Program ${prodiInfo.namaProdi} • Skema: ${namaSkemaKhusus} • Tahapan: ${student?.tahapAktifNama || 'Pendaftaran Ujian'}`}
        icon={ShieldCheck}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
            
            {/* Kartu Status 1: Syarat Wajib Umum */}
            <div style={{ 
              padding: '14px 16px', 
              backgroundColor: isWajibApproved ? '#f0fdf4' : '#f8fafc', 
              borderRadius: 'var(--radius-lg)', 
              border: `1px solid ${isWajibApproved ? '#bbf7d0' : '#e2e8f0'}`, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  1. Syarat Wajib Umum (Mutlak)
                </span>
                <StatusBadge status={isWajibApproved ? 'Disetujui' : 'Dalam Proses'} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: isWajibApproved ? '#15803d' : '#0f172a' }}>
                {wajibApprovedCount} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>/ {wajibTotal} Berkas Wajib Sah</span>
              </div>
              <ProgressIndicator
                value={wajibApprovedCount}
                max={wajibTotal}
                label="Kelengkapan Administrasi Wajib"
                variant={isWajibApproved ? 'success' : 'accent'}
              />
            </div>

            {/* Kartu Status 2: Syarat Khusus Skema */}
            <div style={{ 
              padding: '14px 16px', 
              backgroundColor: isKhususApproved ? '#f5f3ff' : '#f8fafc', 
              borderRadius: 'var(--radius-lg)', 
              border: `1px solid ${isKhususApproved ? '#ddd6fe' : '#e2e8f0'}`, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#6d28d9', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  2. Syarat Khusus: {namaSkemaKhusus}
                </span>
                <StatusBadge status={isKhususApproved ? 'Disetujui' : 'Dalam Proses'} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: isKhususApproved ? '#6d28d9' : '#0f172a' }}>
                {khususApprovedCount} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>/ {khususTotal} Syarat Skema Terpenuhi</span>
              </div>
              <ProgressIndicator
                value={khususApprovedCount}
                max={khususTotal}
                label="Capaian Skema Tugas Akhir"
                variant={isKhususApproved ? 'success' : 'primary'}
              />
            </div>
          </div>

          {/* Kotak Petunjuk Kebijakan Portofolio & Fleksibilitas */}
          <div style={{ fontSize: '12px', color: '#1e3a8a', backgroundColor: '#f0f7ff', padding: '10px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Info size={16} style={{ color: '#0284c7', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong>Petunjuk Sistem 2-Tingkat & Smart-Sync:</strong> Persyaratan akademik Anda dibagi menjadi <strong>Syarat Wajib Umum</strong> (mutlak untuk seluruh mahasiswa) dan <strong>Syarat Khusus Skema</strong>. Dokumen portofolio, luaran publikasi, atau prestasi lomba cukup dikelola melalui Menu Portofolio — halaman Persyaratan akan otomatis mendeteksi capaian Anda tanpa perlu mengisi seluruh kategori kaku.
            </div>
          </div>
        </div>
      </Panel>

      {/* 3. PANEL BAGIAN A: SYARAT WAJIB UMUM (MUTLAK) */}
      <Panel
        title="1. Syarat Wajib Umum (Mutlak bagi Seluruh Mahasiswa)"
        subtitle="Dokumen prasyarat administrasi akademik, kompetensi bahasa, integritas Turnitin, logbook bimbingan, dan persetujuan dosen pembimbing"
        icon={ShieldCheck}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2-5)' }}>
          {mergedWajib.map((req) => renderRequirementRow(req))}
        </div>
      </Panel>

      {/* 4. PANEL BAGIAN B: SYARAT KHUSUS SKEMA (FLEKSIBEL & TERHUBUNG PORTOFOLIO) */}
      <Panel
        title={`2. Syarat Khusus Skema: ${namaSkemaKhusus}`}
        subtitle="Ketentuan spesifik sesuai jalur tugas akhir yang Anda tempuh — fleksibel & tersinkronisasi otomatis dengan portofolio/naskah Anda"
        icon={Award}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Banner Penjelasan Khusus Skema */}
          {isSkema1 ? (
            <div style={{ 
              backgroundColor: '#f0fdf4', 
              border: '1px solid #bbf7d0', 
              borderRadius: 'var(--radius-md)', 
              padding: '12px 14px', 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '10px', 
              fontSize: '12.5px', 
              color: '#166534' 
            }}>
              <Sparkles size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Jalur Konversi Langsung Nilai A:</strong> Anda cukup mengajukan <strong>1 dokumen prestasi unggulan</strong> (Juara 1–3 Nasional Puspresnas ATAU Jurnal SINTA 1–2 / Scopus). Persyaratan ini tersinkronisasi langsung dari pengajuan Anda di Menu Portofolio (Tab Skema 1) dan diproses melalui penetapan SK Dekan tanpa ujian sidang konvensional.
              </div>
            </div>
          ) : isTAKK ? (
            <div style={{ 
              backgroundColor: '#f5f3ff', 
              border: '1px solid #ddd6fe', 
              borderRadius: 'var(--radius-md)', 
              padding: '12px 14px', 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '10px', 
              fontSize: '12.5px', 
              color: '#581c87' 
            }}>
              <Layers size={18} color="#7c3aed" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Prinsip Fleksibilitas Portofolio Mandiri (Skema 2):</strong> Anda <strong>TIDAK diwajibkan</strong> mengisi seluruh bentuk kategori persyaratan (misalnya tidak wajib mengisi HKI jika sudah memiliki kejuaraan). Mahasiswa yang memiliki lebih dari satu juara lomba dapat mengumpulkan seluruh prestasinya untuk mencapai ambang batas <strong>≥ 70 Poin</strong> (atau ≥ 80 Poin untuk Nilai A). Seluruh data tersinkronisasi otomatis dari Menu Portofolio.
              </div>
            </div>
          ) : (
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 'var(--radius-md)', 
              padding: '12px 14px', 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '10px', 
              fontSize: '12.5px', 
              color: '#334155' 
            }}>
              <Info size={18} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Skema Skripsi Reguler Standar (TAKT):</strong> Pastikan draf fisik naskah skripsi dijilid rangkap 3 telah diserahkan kepada sekretariat penguji paling lambat H-3 sebelum jadwal ujian seminar/sidang.
              </div>
            </div>
          )}

          {/* List Syarat Khusus Skema */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2-5)' }}>
            {mergedKhusus.map((req) => renderRequirementRow(req))}
          </div>
        </div>
      </Panel>

      {/* 5. MODAL UNGGAH BERKAS DENGAN PEMILIH JENIS PERSYARATAN */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Unggah Dokumen Bukti Persyaratan Akademik"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" icon={Upload} onClick={handleUploadSubmit}>
              Kirim untuk Verifikasi Admin
            </Button>
          </>
        }
      >
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3-5)' }}>
          {/* PEMILIH JENIS PERSYARATAN (DROPDOWN) */}
          <FormField
            id="modal-select-jenis"
            label="Pilih Jenis Persyaratan yang Sedang Diunggah"
            required
            helperText="Pilih kategori persyaratan secara tepat untuk mempermudah pemeriksaan oleh Admin Akademik."
          >
            <Select
              id="modal-select-jenis"
              value={selectedReqId}
              onChange={(e) => setSelectedReqId(e.target.value)}
              options={mergedRequirements.map((r) => ({
                value: r.id,
                label: `${r.tipeSyarat === 'wajib' ? '[Wajib]' : '[Khusus]'} ${r.nama}${r.isPortofolioLinked ? ' (Tersinkron Portofolio)' : ''}`
              }))}
            />
          </FormField>

          {/* KOTAK INFO KETENTUAN PERSYARATAN TERPILIH */}
          {activeModalReq && (
            <div
              style={{
                backgroundColor: 'var(--primitive-neutral-50)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-3)',
                fontSize: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primitive-navy-950)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}>
                <Info size={14} color="var(--color-brand-primary)" />
                <span>Ketentuan Regulasi Buku Pedoman TA 2026:</span>
              </div>
              <div style={{ color: 'var(--color-text-secondary)', marginLeft: '20px' }}>
                <div><strong>Tingkat Persyaratan:</strong> {activeModalReq.tipeSyarat === 'wajib' ? 'Syarat Wajib Umum (Mutlak)' : `Syarat Khusus (${namaSkemaKhusus})`}</div>
                <div><strong>Dasar Regulasi:</strong> {activeModalReq.rule}</div>
                <div><strong>Standar Kelayakan:</strong> {activeModalReq.pedomanMin}</div>
                <div style={{ marginTop: '4px' }}>
                  <strong>Status Saat Ini:</strong>{' '}
                  <span style={{ fontWeight: 'bold', color: activeModalReq.status === 'Disetujui' ? 'var(--primitive-green-700)' : activeModalReq.status === 'Perlu Perbaikan' ? 'var(--primitive-red-700)' : 'var(--primitive-amber-700)' }}>
                    {activeModalReq.status}
                  </span>
                </div>
              </div>

              {activeModalReq.isPortofolioLinked && (
                <div style={{ marginTop: '8px', padding: '8px 10px', backgroundColor: '#f5f3ff', borderRadius: 'var(--radius-sm)', border: '1px solid #ddd6fe', color: '#6d28d9', fontSize: '11.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span>Persyaratan ini tersinkronisasi otomatis dari Menu Portofolio. Anda dapat mengunggah bukti langsung di halaman Portofolio.</span>
                  <Button size="xs" variant="primary" onClick={() => { setIsUploadModalOpen(false); onNavigate && onNavigate('portofolio'); }}>
                    Ke Portofolio
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* PEMILIH FILE BUKTI (PDF) */}
          <FormField
            id="file-native-input"
            label="Pilih Berkas Dokumen Bukti (Format PDF)"
            required
            helperText="Unggah scan dokumen asli berformat PDF (Maksimal 10 MB) bertanda tangan sah atau ber-QR Code."
          >
            <div
              id="upload-dropzone"
              role="button"
              tabIndex={0}
              aria-label="Pilih berkas dokumen bukti PDF"
              style={{
                border: '2px dashed var(--color-border-default)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-4)',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                id="file-native-input"
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <Upload size={28} color="var(--color-brand-primary)" style={{ margin: '0 auto var(--space-2)' }} />
              {selectedFile ? (
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)', fontSize: '13px' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--primitive-green-700)', marginTop: '2px' }}>
                    Ukuran: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Berkas PDF Siap Diunggah
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--primitive-navy-900)', fontSize: '13px' }}>
                    Klik untuk memilih berkas PDF atau seret berkas ke area ini
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Format didukung: .pdf (Maksimum 10 MB)
                  </div>
                </div>
              )}
            </div>
          </FormField>

          {/* INPUT CATATAN / INFORMASI CAPAIAN MAHASISWA */}
          <FormField
            id="modal-catatan-input"
            label="Catatan / Keterangan Capaian Mahasiswa (Opsional)"
            helperText="Tuliskan nomor surat, perolehan skor, atau catatan pengesahan untuk mempermudah pengecekan petugas."
          >
            <Input
              id="modal-catatan-input"
              value={catatanMahasiswa}
              onChange={(e) => setCatatanMahasiswa(e.target.value)}
              placeholder={activeModalReq?.placeholderCatatan || 'Contoh: Nomor sertifikat/surat, tanggal terbit, skor perolehan...'}
            />
          </FormField>

          {/* DATA VERIFIKASI AKADEMIK (struktur terstandar) */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-default)',
              backgroundColor: 'var(--primitive-navy-50, #f0f4f8)'
            }}
            role="group"
            aria-label="Data verifikasi akademik"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primitive-navy-950)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '8px', fontSize: '12.5px' }}>
              <ScanLine size={14} color="var(--color-brand-primary)" />
              <span>Data Verifikasi Akademik (diperiksa oleh Admin)</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
              Isi angka sesuai <strong>dokumen yang sedang diunggah</strong> — field yang
              ditampilkan menyesuaikan jenis persyaratan (mis. Skor TOEFL untuk sertifikat
              bahasa, persentase plagiarisme untuk hasil Turnitin, IPK & SKS untuk transkrip).
              Admin memakainya untuk verifikasi cepat tanpa membaca teks bebas.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {metrikKeys.map((key) => {
                const def = METRIK_FIELD_DEFS[key];
                if (!def) return null;
                const inputId = `metrik-${key}`;
                const labelNode = def.icon === 'grad'
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><GraduationCap size={12} /> {def.label}</span>
                  : def.icon === 'award'
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Award size={12} /> {def.label}</span>
                  : def.label;
                return (
                  <FormField key={key} id={inputId} label={labelNode}>
                    <Input
                      id={inputId}
                      type={def.type}
                      step={def.step}
                      min={def.min}
                      max={def.max}
                      value={metrik[key] ?? ''}
                      onChange={(e) => setMetrik({ ...metrik, [key]: e.target.value })}
                      placeholder={def.placeholder}
                    />
                  </FormField>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

