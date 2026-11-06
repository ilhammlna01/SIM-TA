import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/shell';
import { notify } from '../../components/feedback';
import { adminApi } from '../../services/api';
import {
  Panel,
  Button,
  IconButton,
  Table,
  Badge,
  StatusBadge,
  Modal,
  FormField,
  Input,
  Select,
  Search
} from '../../components/ui';

import {
  Printer,
  FileText,
  FolderArchive,
  Download,
  CheckCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCw,
  Users,
  Award,
  Send,
  Eye,
  FileCheck,
  Building,
  Key,
  Archive,
  CheckSquare,
  Square,
  Filter,
  Check
} from 'lucide-react';
import { PEJABAT_DEKANAT, DEFAULT_PEJABAT_ID, getPejabatById } from '../../data/pejabatDekanat';
import { downloadUniversalDoc, downloadBeritaAcara } from '../../utils/pdfDownloader';

/**
 * HALAMAN: PENERBITAN DOKUMEN SIDANG KOLEKTIF (BATCH GENERATOR)
 * Solusi Praktikal & Teknis Penerbitan Berkas Skala Fleksibel (Pedoman FEB UTM 2026):
 * 1. 1 SK Dekan Induk Kolektif per Gelombang + Matriks Lampiran Mahasiswa Terpilih
 * 2. Background Queue Worker Generator untuk Berita Acara Ber-QR Code Kriptografis
 * 3. Surat Tugas Kolektif per Dewan Penguji
 * 4. Otorisasi Digital E-Signature Dekanat & Ekspor Master ZIP Bundle
 */
export default function PenerbitanMassalPage({ 
  onNavigate,
  mahasiswaList = [],
  currentProdi = 'S-1 Manajemen'
}) {
  const [activeTab, setActiveTab] = useState('sk_kolektif'); // 'sk_kolektif' | 'berita_acara' | 'surat_tugas'
  const [selectedGelombang, setSelectedGelombang] = useState('Gelombang II — Semester Ganjil 2026/2027');
  const [selectedJenisUjian, setSelectedJenisUjian] = useState('Semua Jenis Ujian');
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Parameter Administrasi Hukum SK Dekan (Dapat Disesuaikan & Diketik Manual)
  const [nomorSK, setNomorSK] = useState('184/UN46.1.1/HK/2026');
  const [tanggalSK, setTanggalSK] = useState('12 Oktober 2026');
  const defaultPejabat = getPejabatById(DEFAULT_PEJABAT_ID);
  const [pejabatNama, setPejabatNama] = useState(defaultPejabat.nama);
  const [pejabatJabatan, setPejabatJabatan] = useState(defaultPejabat.jabatan);
  const [pejabatNip, setPejabatNip] = useState(defaultPejabat.nip);

  const pejabatDekan = {
    nama: pejabatNama,
    jabatan: pejabatJabatan,
    nip: pejabatNip
  };

  // State Simulasi Background Queue Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [processLogs, setProcessLogs] = useState([]);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isSuccessComplete, setIsSuccessComplete] = useState(false);

  // State Otorisasi PIN Dekanat
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  // Token otorisasi Dekanat (diterbitkan server setelah PIN terverifikasi).
  const [tokenOtorisasi, setTokenOtorisasi] = useState(null);
  const [isSigned, setIsSigned] = useState(false);

  // Basis Data Mahasiswa Seluruh Fakultas yang Difilter Sesuai Program Studi Koorprodi
  const allMasterCandidates = useMemo(() => [
    {
      id: 1,
      nim: '210211100142',
      nama: 'Dinda Ayu Larasati',
      jenjang: 'S1',
      prodi: 'S-1 Manajemen',
      jenisUjian: 'Sidang Skripsi',
      judul: 'Pengaruh Live Commerce Interactive Features Terhadap Keputusan Pembelian Spontan Batik Madura di TikTok Shop',
      pengujiCount: 3,
      ketuaPenguji: 'Dra. Hj. S. Anugrahini Irawati, M.M.',
      pengujiAnggota: ['Dr. Faidal, S.E., M.M.', 'Dr. Dra. Hj. Iriani Ismail, M.M.'],
      noBA: 'BA/S1-MNJ/2026/001',
      statusSyarat: 'Lengkap (TOEFL 470, Turnitin 16%)',
      status: 'Siap Terbit'
    },
    {
      id: 2,
      nim: '210211100219',
      nama: 'Moh. Fikri Haikal',
      jenjang: 'S1',
      prodi: 'S-1 Manajemen (TAKK)',
      jenisUjian: 'Sidang Skripsi',
      judul: 'Strategi Akselerasi Hilirisasi Produk Garam Briket Madura Melalui Digital Supply Chain',
      pengujiCount: 3,
      ketuaPenguji: 'Dr. Faidal, S.E., M.M.',
      pengujiAnggota: ['Dr. Mochammad Isa Anshori, M.Si.', 'Dr. Rita Mutiarni, S.E., M.M.'],
      noBA: 'BA/S1-MNJ/2026/002',
      statusSyarat: 'Lengkap (TOEFL 460, Turnitin 18%)',
      status: 'Siap Terbit'
    },
    {
      id: 3,
      nim: '230221600018',
      nama: 'Rahmat Hidayat, S.E.',
      jenjang: 'S2',
      prodi: 'S-2 Magister Manajemen',
      jenisUjian: 'Sidang Tesis',
      judul: 'Pengaruh Kepemimpinan Transformasional dan Budaya Organisasi Terhadap Kinerja Perbankan Syariah di Madura',
      pengujiCount: 4,
      ketuaPenguji: 'Dr. Rita Mutiarni, S.E., M.M.',
      pengujiAnggota: ['Dr. H. Slamet Subari, M.Si.', 'Dr. Dra. Hj. Iriani Ismail, M.M.', 'Dra. Hj. S. Anugrahini Irawati, M.M.'],
      noBA: 'BA/S2-MM/2026/003',
      statusSyarat: 'Lengkap (TOEFL 485, Turnitin 14%)',
      status: 'Siap Terbit'
    },
    {
      id: 4,
      nim: '220231600004',
      nama: 'Bambang Suryo Utomo, S.E., M.M.',
      jenjang: 'S3',
      prodi: 'S-3 Doktor Ilmu Manajemen',
      jenisUjian: 'Ujian Kelayakan Disertasi',
      judul: 'Model Determinan Dynamic Capabilities Terhadap Ketahanan Usaha Berkelanjutan Berbasis Kearifan Lokal Madura',
      pengujiCount: 7,
      ketuaPenguji: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
      pengujiAnggota: ['Prof. Badri Munir (UNAIR)', 'Dr. Mochammad Isa Anshori, M.Si.', 'Dr. Rita Mutiarni, S.E., M.M.', 'Dr. Faidal, S.E., M.M.'],
      noBA: 'BA/S3-DIM/2026/004',
      statusSyarat: 'Lengkap (TOEFL 510, Turnitin 12%, Scopus Q2)',
      status: 'Siap Terbit'
    },
    {
      id: 5,
      nim: '230201100055',
      nama: 'Siti Nur Haliza',
      jenjang: 'D3',
      prodi: 'D-III Akuntansi/Manajemen',
      jenisUjian: 'Laporan Tugas Akhir',
      judul: 'Laporan Proyek Pengembangan Usaha Jamu Tradisional Madura',
      pengujiCount: 3,
      ketuaPenguji: 'Aprilina Susandini, S.E., M.SM.',
      pengujiAnggota: ['Dr. Faidal, S.E., M.M.', 'Dr. Mochammad Isa Anshori, M.Si.'],
      noBA: 'BA/D3-MNJ/2026/005',
      statusSyarat: 'Lengkap (TOEFL 420, Turnitin 15%)',
      status: 'Siap Terbit'
    },
    {
      id: 6,
      nim: '210211100088',
      nama: 'Achmad Fauzan',
      jenjang: 'S1',
      prodi: 'S-1 Manajemen',
      jenisUjian: 'Seminar Proposal',
      judul: 'Analisis Faktor Keputusan Konsumen Memilih Wisata Halal Pantai Lon Malang Sampang',
      pengujiCount: 3,
      ketuaPenguji: 'Dr. Mochammad Isa Anshori, M.Si.',
      pengujiAnggota: ['Dr. Faidal, S.E., M.M.', 'Dra. Hj. S. Anugrahini Irawati, M.M.'],
      noBA: 'BA/S1-MNJ/2026/006',
      statusSyarat: 'Lengkap (TOEFL 455, Turnitin 19%)',
      status: 'Siap Terbit'
    },
    {
      id: 7,
      nim: '210211100099',
      nama: 'Nurul Hidayati',
      jenjang: 'S1',
      prodi: 'S-1 Manajemen',
      jenisUjian: 'Sidang Skripsi',
      judul: 'Pengaruh Brand Image dan Kualitas Layanan Terhadap Kepuasan Nasabah Pegadaian Syariah Bangkalan',
      pengujiCount: 3,
      ketuaPenguji: 'Dra. Hj. S. Anugrahini Irawati, M.M.',
      pengujiAnggota: ['Dr. Rita Mutiarni, S.E., M.M.', 'Dr. Dra. Hj. Iriani Ismail, M.M.'],
      noBA: 'BA/S1-MNJ/2026/007',
      statusSyarat: 'Lengkap (TOEFL 465, Turnitin 17%)',
      status: 'Siap Terbit'
    },
    {
      id: 8,
      nim: '230221600025',
      nama: 'Diana Putri, S.E.',
      jenjang: 'S2',
      prodi: 'S-2 Magister Manajemen',
      jenisUjian: 'Sidang Tesis',
      judul: 'Strategi Manajemen Risiko Rantai Pasok Jagung Hibrida di Kabupaten Sumenep',
      pengujiCount: 4,
      ketuaPenguji: 'Dr. H. Slamet Subari, M.Si.',
      pengujiAnggota: ['Dr. Rita Mutiarni, S.E., M.M.', 'Dr. Faidal, S.E., M.M.', 'Dr. Mochammad Isa Anshori, M.Si.'],
      noBA: 'BA/S2-MM/2026/008',
      statusSyarat: 'Lengkap (TOEFL 480, Turnitin 15%)',
      status: 'Siap Terbit'
    },
    {
      id: 9,
      nim: '220231600010',
      nama: 'Drg. Zainal Arifin, M.Kes.',
      jenjang: 'S3',
      prodi: 'S-3 Doktor Ilmu Manajemen',
      jenisUjian: 'Ujian Tertutup Disertasi',
      judul: 'Transformasi Pelayanan Kesehatan Berbasis Lean Management Rumah Sakit di Jawa Timur',
      pengujiCount: 7,
      ketuaPenguji: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
      pengujiAnggota: ['Prof. Badri Munir (UNAIR)', 'Dr. H. Slamet Subari, M.Si.', 'Dr. Dra. Hj. Iriani Ismail, M.M.'],
      noBA: 'BA/S3-DIM/2026/009',
      statusSyarat: 'Lengkap (TOEFL 520, Turnitin 11%, Scopus Q1)',
      status: 'Siap Terbit'
    },
    {
      id: 10,
      nim: '210211100155',
      nama: 'Muhammad Rizky Pratama',
      jenjang: 'S1',
      prodi: 'S-1 Manajemen',
      jenisUjian: 'Seminar Proposal',
      judul: 'Efektivitas Kampanye Green Marketing Terhadap Minat Beli Kemasan Ramah Lingkungan',
      pengujiCount: 3,
      ketuaPenguji: 'Dr. Faidal, S.E., M.M.',
      pengujiAnggota: ['Dr. Mochammad Isa Anshori, M.Si.', 'Aprilina Susandini, S.E., M.SM.'],
      noBA: 'BA/S1-MNJ/2026/010',
      statusSyarat: 'Lengkap (TOEFL 450, Turnitin 20%)',
      status: 'Siap Terbit'
    },
    {
      id: 11,
      nim: '210211100188',
      nama: 'Khofifah Indah Sari',
      jenjang: 'S1',
      prodi: 'S-1 Manajemen',
      jenisUjian: 'Sidang Skripsi',
      judul: 'Pengaruh Work-Life Balance dan Kompensasi Terhadap Retensi Karyawan Industri Galangan Kapal Kamal',
      pengujiCount: 3,
      ketuaPenguji: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
      pengujiAnggota: ['Dra. Hj. S. Anugrahini Irawati, M.M.', 'Dr. Faidal, S.E., M.M.'],
      noBA: 'BA/S1-MNJ/2026/011',
      statusSyarat: 'Lengkap (TOEFL 475, Turnitin 14%)',
      status: 'Siap Terbit'
    },
    {
      id: 12,
      nim: '230221600030',
      nama: 'Budi Santoso, S.E.',
      jenjang: 'S2',
      prodi: 'S-2 Magister Manajemen',
      jenisUjian: 'Sidang Tesis',
      judul: 'Determinan Adopsi Financial Technology Payment pada Pedagang Pasar Tradisional Bangkalan',
      pengujiCount: 4,
      ketuaPenguji: 'Dr. Rita Mutiarni, S.E., M.M.',
      pengujiAnggota: ['Dr. H. Slamet Subari, M.Si.', 'Dr. Faidal, S.E., M.M.', 'Dr. Dra. Hj. Iriani Ismail, M.M.'],
      noBA: 'BA/S2-MM/2026/012',
      statusSyarat: 'Lengkap (TOEFL 490, Turnitin 13%)',
      status: 'Siap Terbit'
    }
  ], []);

  // Filter kandidat sesuai Program Studi Koorprodi
  const initialMahasiswaList = useMemo(() => {
    const curP = String(currentProdi || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = allMasterCandidates.filter(m => {
      const itemP = String(m.prodi || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return itemP.includes(curP) || curP.includes(itemP);
    });
    return matched.length > 0 ? matched : allMasterCandidates;
  }, [allMasterCandidates, currentProdi]);

  // Multi-Selection State (Default: Seluruh Mahasiswa Terpilih)
  const [selectedMhsIds, setSelectedMhsIds] = useState(() => initialMahasiswaList.map(m => m.id));

  // Sync selection saat prodi berganti
  useEffect(() => {
    setSelectedMhsIds(initialMahasiswaList.map(m => m.id));
  }, [initialMahasiswaList]);

  // Filter Data
  const filteredMahasiswa = useMemo(() => {
    return initialMahasiswaList.filter((m) => {
      const matchJenjang = filterJenjang === 'Semua' || m.jenjang === filterJenjang;
      const matchJenis = selectedJenisUjian === 'Semua Jenis Ujian' || m.jenisUjian === selectedJenisUjian;
      const matchSearch =
        m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.nim.includes(searchQuery) ||
        m.noBA.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.judul.toLowerCase().includes(searchQuery.toLowerCase());
      return matchJenjang && matchJenis && matchSearch;
    });
  }, [initialMahasiswaList, filterJenjang, selectedJenisUjian, searchQuery]);

  // Mahasiswa yang sedang dicentang / dipilih
  const selectedMahasiswaList = useMemo(() => {
    return initialMahasiswaList.filter(m => selectedMhsIds.includes(m.id));
  }, [initialMahasiswaList, selectedMhsIds]);

  // Statistik Berkas Terpilih
  const statsSelected = useMemo(() => {
    const list = selectedMahasiswaList;
    return {
      total: list.length,
      s1: list.filter(m => m.jenjang === 'S1').length,
      s2: list.filter(m => m.jenjang === 'S2').length,
      s3: list.filter(m => m.jenjang === 'S3').length,
      d3: list.filter(m => m.jenjang === 'D3').length
    };
  }, [selectedMahasiswaList]);

  // Toggle Seleksi Individual
  const handleToggleSelect = (id) => {
    setSelectedMhsIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle Seleksi Semua Mahasiswa pada Filter Saat Ini
  const handleToggleSelectAll = () => {
    const currentFilteredIds = filteredMahasiswa.map(m => m.id);
    const allSelected = currentFilteredIds.every(id => selectedMhsIds.includes(id));
    if (allSelected) {
      setSelectedMhsIds(prev => prev.filter(id => !currentFilteredIds.includes(id)));
    } else {
      setSelectedMhsIds(prev => Array.from(new Set([...prev, ...currentFilteredIds])));
    }
  };

  // Eksekusi Background Queue Worker secara Dinamis
  // Audit 22 Oktober 2026 (butir #1): penerbitan SK massal TIDAK lagi
  // disimulasikan di peramban. Antrean palsu (setInterval) dan PIN yang
  // diterima asal panjang >= 4 karakter telah dihapus; seluruh pekerjaan
  // kini dilakukan oleh server dan hasilnya dilaporkan apa adanya.
  const startBulkGeneration = async () => {
    const totalToProcess = statsSelected.total;
    if (totalToProcess === 0) {
      notify('Pilih minimal 1 mahasiswa untuk menerbitkan berkas.', { variant: 'warning' });
      return;
    }
    if (!tokenOtorisasi) {
      notify('Verifikasi PIN Dekanat terlebih dahulu sebelum penerbitan massal.', { variant: 'warning' });
      setIsPinModalOpen(true);
      return;
    }

    setIsProcessModalOpen(true);
    setIsProcessing(true);
    setProgressPercent(0);
    setProcessedCount(0);
    setIsSuccessComplete(false);
    setProcessLogs([
      `[Otorisasi] Token otorisasi Dekanat valid. Mengirim ${totalToProcess} mahasiswa ke server...`
    ]);

    try {
      const hasil = await adminApi.publikasiSkMassal({
        tokenOtorisasi,
        jenisSK: 'SK Penetapan Pembimbing & Penguji Ujian',
        jenjang: selectedJenjang || 'S1',
        programStudi: currentProdi,
        tanggalTerbit: new Date().toISOString().slice(0, 10),
        penandatangan: pejabatDekan.nama,
        penandatanganNip: pejabatDekan.nip,
        nomorSKBase: nomorSK,
        generatePdf: true,
        mahasiswa: selectedMahasiswaList.map((m) => ({
          nim: m.nim || m.id,
          namaMahasiswa: m.nama,
          judulTA: m.judulTA || m.judul || 'Penyusunan Tugas Akhir FEB UTM'
        }))
      });

      const berhasil = hasil?.data?.berhasil || [];
      const gagal = hasil?.data?.gagal || [];

      setProgressPercent(100);
      setProcessedCount(berhasil.length);
      setIsProcessing(false);
      setIsSuccessComplete(berhasil.length > 0);
      setProcessLogs((prev) => [
        ...prev,
        `[Server] ${hasil?.message || 'Penerbitan selesai.'}`,
        ...berhasil.slice(0, 10).map((b) => `[Terbit] ${b.nama} — SK No. ${b.nomorSK}`),
        ...gagal.map((g) => `[Gagal] ${g.nim} — ${g.message}`)
      ]);

      if (berhasil.length > 0) {
        setIsSigned(true);
        setIsPinModalOpen(false);
        notify(`${berhasil.length} Surat Keputusan berhasil diterbitkan dan diarsipkan.`, { variant: 'success' });
      } else {
        notify(hasil?.message || 'Tidak ada SK yang berhasil diterbitkan.', { variant: 'danger' });
      }
    } catch (err) {
      setIsProcessing(false);
      setProcessLogs((prev) => [...prev, `[Server] Gagal: ${err.message}`]);
      notify(`Penerbitan SK massal gagal: ${err.message}`, { variant: 'danger' });
    }
  };

  // Otorisasi PIN Dekanat — diverifikasi oleh server (hash scrypt + lockout).
  const handleVerifikasiPin = async (e) => {
    e.preventDefault();
    if (!pinInput || pinInput.trim().length < 4) {
      notify('Masukkan PIN keamanan Dekanat FEB UTM.', { variant: 'warning' });
      return;
    }
    try {
      const hasil = await adminApi.verifikasiPin(pinInput.trim());
      setTokenOtorisasi(hasil?.data?.token || null);
      setIsSigned(true);
      setIsPinModalOpen(false);
      setPinInput('');
      notify('Otorisasi Dekanat sah. Token berumur pendek telah diterbitkan.', { variant: 'success' });
    } catch (err) {
      notify(err.message || 'PIN otorisasi ditolak.', { variant: 'danger' });
    }
  };

  return (
    <div>
      {/* 1. Header Institusional */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Koorprodi' },
          { label: 'Penerbitan Dokumen Kolektif' }
        ]}
        title="Penerbitan Dokumen Sidang Kolektif (Batch Generator)"
        description="Otomasi penerbitan 1 SK Dekan Induk Kolektif, Berita Acara Ujian ber-QR Code Kriptografis, serta Surat Tugas Penguji untuk seluruh mahasiswa yang terdaftar dalam periode/gelombang terpilih."
        statusBadge={
          <div style={{ display: 'flex', gap: '6px' }}>
            <Badge variant="navy">Prodi: {currentProdi}</Badge>
            <Badge variant="gold">
              {statsSelected.total} Berkas Terpilih Siap Terbit
            </Badge>
          </div>
        }
        primaryAction={
          <Button
            variant="primary"
            icon={Play}
            onClick={startBulkGeneration}
            disabled={isProcessing || statsSelected.total === 0}
          >
            {isProcessing ? `Memproses ${statsSelected.total} Berkas...` : `Proses Penerbitan (${statsSelected.total} Berkas)`}
          </Button>
        }
        secondaryAction={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              icon={Key}
              onClick={() => setIsPinModalOpen(true)}
            >
              {isSigned ? 'E-Signature Dekan Sah (Aktif)' : 'Input PIN Otorisasi Dekan'}
            </Button>
            <Button
              variant="secondary"
              icon={Archive}
              onClick={() => {
                downloadUniversalDoc({
                  namaDokumen: `Master_Bundle_Sidang_${selectedGelombang.replace(/[^a-zA-Z0-9]/g, '_')}`,
                  kategori: 'Master Bundle Arsip Sidang Kolektif',
                  ukuran: '14.8 MB',
                  tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                }, {
                  nama: 'Koordinator Program Studi Manajemen',
                  nim: 'FEB-UTM',
                  prodi: 'Jurusan Manajemen FEB UTM'
                });
              }}
            >
              Unduh Master Bundle PDF
            </Button>
          </div>
        }
      />

      {/* 2. Empat Stat Cards Ringkasan Kebutuhan Penerbitan */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)'
        }}
      >
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Berkas Mahasiswa Terpilih</span>
            <Users size={18} style={{ color: 'var(--color-brand-primary)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '4px' }}>
            {statsSelected.total} Mahasiswa
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            S1: {statsSelected.s1} • S2: {statsSelected.s2} • S3: {statsSelected.s3} • D3: {statsSelected.d3}
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>SK Dekan Induk Kolektif</span>
            <FileCheck size={18} style={{ color: '#2563EB' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#1D4ED8', marginTop: '4px' }}>
            1 Master Dokumen
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Melampirkan matriks {statsSelected.total} mahasiswa terpilih
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Berita Acara Digital (QR)</span>
            <Printer size={18} style={{ color: '#16A34A' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#15803D', marginTop: '4px' }}>
            {isSuccessComplete ? `${statsSelected.total} Siap Cetak` : `${statsSelected.total} Antrean Siap`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Register urut unik BA/FEB-UTM/2026/001-N
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Status E-Signature Dekan</span>
            <ShieldCheck size={18} style={{ color: isSigned ? '#16A34A' : '#D97706' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: isSigned ? '#15803D' : '#B45309', marginTop: '8px' }}>
            {isSigned ? 'TERVERIFIKASI SAH' : 'MENUNGGU PIN'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            HMAC-SHA256 QR Code terintegrasi
          </div>
        </div>
      </div>

      {/* 3. Banner Rekomendasi Tata Usaha & Regulasi Kolektif */}
      <div 
        style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)'
        }}
      >
        <ShieldCheck size={26} style={{ color: '#1D4ED8', flexShrink: 0 }} />
        <div style={{ fontSize: '12px', color: '#1E3A8A', lineHeight: 1.5 }}>
          <strong>Prinsip Penerbitan Dokumen Sidang Kolektif (FEB UTM):</strong> SK Dekan tidak diterbitkan secara terpisah untuk setiap mahasiswa, melainkan berupa <strong>1 SK Dekan Induk Kolektif</strong> per gelombang yang melampirkan matriks tabel seluruh mahasiswa terdaftar beserta susunan dewan penguji. Sedangkan Berita Acara Ujian digenerate otomatis secara massal melalui antrean sistem dengan nomor register dan QR Code sah.
        </div>
      </div>

      {/* 4. Kontrol Parameter Teknis Penerbitan */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderArchive size={18} style={{ color: 'var(--color-brand-primary)' }} />
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
              Parameter Administrasi Penerbitan:
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button
              variant="tertiary"
              size="sm"
              icon={CheckSquare}
              onClick={() => setSelectedMhsIds(initialMahasiswaList.map(m => m.id))}
            >
              Pilih Semua ({initialMahasiswaList.length})
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setSelectedMhsIds([])}
            >
              Kosongkan Pilihan
            </Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Periode / Gelombang Sidang:
            </label>
            <select
              value={selectedGelombang}
              onChange={(e) => setSelectedGelombang(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                backgroundColor: '#F8FAFC',
                fontWeight: '600'
              }}
            >
              <option value="Gelombang II — Semester Ganjil 2026/2027">Gelombang II — Semester Ganjil 2026/2027 (Aktif)</option>
              <option value="Gelombang I — Semester Ganjil 2026/2027">Gelombang I — Semester Ganjil 2026/2027 (Arsip)</option>
              <option value="Sidang Khusus Remedial / Yudisium 2026">Sidang Khusus Remedial / Yudisium 2026</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Jenis Tahapan Ujian:
            </label>
            <select
              value={selectedJenisUjian}
              onChange={(e) => setSelectedJenisUjian(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                backgroundColor: '#F8FAFC',
                fontWeight: '600'
              }}
            >
              <option value="Semua Jenis Ujian">Semua Jenis Ujian</option>
              <option value="Seminar Proposal">Seminar Proposal (Sempro)</option>
              <option value="Sidang Skripsi">Sidang Skripsi (S1)</option>
              <option value="Sidang Tesis">Sidang Tesis (S2)</option>
              <option value="Ujian Kelayakan Disertasi">Ujian Kelayakan / Tertutup Disertasi (S3)</option>
              <option value="Laporan Tugas Akhir">Laporan Tugas Akhir (D3)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Nomor SK Dekan Induk Kolektif:
            </label>
            <input
              type="text"
              value={nomorSK}
              onChange={(e) => setNomorSK(e.target.value)}
              placeholder="e.g. 184/UN46.1.1/HK/2026"
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                backgroundColor: '#FFFFFF',
                fontWeight: '600',
                color: 'var(--primitive-navy-950)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Pejabat Penandatangan Dekanat:
            </label>
            <input
              type="text"
              value={pejabatNama}
              onChange={(e) => setPejabatNama(e.target.value)}
              placeholder="Ketik Nama & Gelar Pejabat..."
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                backgroundColor: '#FFFFFF',
                fontWeight: '600',
                color: 'var(--primitive-navy-950)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Jabatan Pejabat Dekanat:
            </label>
            <input
              type="text"
              value={pejabatJabatan}
              onChange={(e) => setPejabatJabatan(e.target.value)}
              placeholder="e.g. Dekan FEB UTM"
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                backgroundColor: '#FFFFFF',
                fontWeight: '600',
                color: 'var(--primitive-navy-950)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              NIP Pejabat Dekanat:
            </label>
            <input
              type="text"
              value={pejabatNip}
              onChange={(e) => setPejabatNip(e.target.value)}
              placeholder="e.g. NIP. 196206231988112001"
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                backgroundColor: '#FFFFFF',
                fontWeight: '600',
                color: 'var(--primitive-navy-950)'
              }}
            />
          </div>
        </div>
      </div>

      {/* 5. Navigasi Tiga Tab Paket Dokumen */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: 'var(--space-3)',
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingBottom: 'var(--space-2)'
        }}
      >
        {[
          { id: 'sk_kolektif', label: '1. SK Dekan Kolektif (Master)' },
          { id: 'berita_acara', label: `2. Berita Acara Ujian (${statsSelected.total} Berkas)` },
          { id: 'surat_tugas', label: '3. Surat Tugas Kolektif Dewan Penguji' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              fontSize: '12.5px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid',
              borderColor: activeTab === tab.id ? 'var(--color-brand-primary)' : 'var(--color-border-default)',
              backgroundColor: activeTab === tab.id ? 'var(--primitive-navy-100)' : '#FFFFFF',
              color: activeTab === tab.id ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {activeTab === tab.id && <Check size={14} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          TAB 1: SURAT KEPUTUS (SK) DEKAN KOLEKTIF (MASTER DOCUMENT)
          ========================================================================= */}
      {activeTab === 'sk_kolektif' && (
        <Panel
          title="Master Dokumen: Surat Keputusan Dekan FEB UTM Kolektif"
          subtitle={`Naskah keputusan dekan mengangkat susunan dewan penguji untuk ${statsSelected.total} mahasiswa terpilih dalam 1 naskah hukum sah.`}
          icon={FileCheck}
          actions={
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={async () => {
                await downloadUniversalDoc(
                  { namaDokumen: `Master_SK_Dekan_Kolektif_No_${nomorSK.replace(/[^a-zA-Z0-9]/g, '_')}`, kategori: 'Surat Keputusan Dekan', ukuran: '2.8 MB' },
                  { nama: 'Fakultas Ekonomi dan Bisnis UTM', nim: nomorSK, programStudi: 'Seluruh Program Studi' }
                );
              }}
            >
              Unduh Master SK Dekan Kolektif (PDF)
            </Button>
          }
        >
          {/* Pratinjau Batang Tubuh SK */}
          <div 
            style={{ 
              padding: 'var(--space-4)', 
              border: '2px solid var(--primitive-navy-900)', 
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#FAFAFA',
              marginBottom: 'var(--space-4)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>UNIVERSITAS TRUNOJOYO MADURA — FAKULTAS EKONOMI DAN BISNIS</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Jl. Raya Telang PO BOX 2 Kamal, Bangkalan - Madura</div>
              <div style={{ height: '2px', backgroundColor: 'var(--primitive-navy-900)', margin: '8px auto', width: '90%' }} />
              
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '6px' }}>
                KEPUTUSAN DEKAN FAKULTAS EKONOMI DAN BISNIS UNIVERSITAS TRUNOJOYO MADURA
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-brand-primary)' }}>
                NOMOR: {nomorSK}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>
                TENTANG PENETAPAN SUSUNAN DEWAN PENGUJI UJIAN TUGAS AKHIR {selectedGelombang.toUpperCase()}
              </div>
            </div>

            <div style={{ fontSize: '12px', lineHeight: 1.6, color: '#1F2937' }}>
              <p style={{ margin: '0 0 8px 0' }}><strong>MEMUTUSKAN:</strong> Menetapkan Susunan Dewan Penguji Ujian Tugas Akhir Program Diploma Tiga, Sarjana, Magister, dan Doktor Jurusan Manajemen Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura sebagaimana tercantum dalam <strong>Lampiran I Keputusan ini (Memuat {statsSelected.total} Mahasiswa Terdaftar yang Memenuhi Syarat Ujian)</strong>.</p>
              <p style={{ margin: 0 }}>Keputusan ini berlaku sejak tanggal ditetapkan sampai dengan berakhirnya pelaksanaan ujian gelombang terkait dengan ketentuan apabila di kemudian hari terdapat kekeliruan akan diperbaiki sebagaimana mestinya.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', paddingTop: '10px', borderTop: '1px dashed var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Ditetapkan di Bangkalan pada tanggal {tanggalSK}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 'bold' }}>{pejabatDekan.jabatan},</div>
                <div style={{ padding: '6px' }}>
                  <ShieldCheck size={32} style={{ color: isSigned ? '#16A34A' : '#D97706', margin: '0 auto' }} />
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 'bold' }}>{pejabatDekan.nama}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                  {pejabatDekan.nip}
                </div>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* =========================================================================
          TAB 2: BERITA ACARA UJIAN (DIGITAL BATCH)
          ========================================================================= */}
      {activeTab === 'berita_acara' && (
        <Panel
          title={`Penerbitan Berita Acara Ujian Digital (${statsSelected.total} Berkas)`}
          subtitle="Blangko Berita Acara Ujian resmi otomatis ber-nomor register unik dan QR Code otorisasi kriptografis."
          icon={Printer}
          actions={
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              onClick={startBulkGeneration}
              disabled={isProcessing || statsSelected.total === 0}
            >
              {isProcessing ? 'Memproses Background Queue...' : `Generate ${statsSelected.total} Berita Acara Sekarang`}
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ padding: 'var(--space-3)', backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <strong>Otomasi Nomor Register:</strong> Nomor Berita Acara dialokasikan secara urut dan otomatis sesuai format jenjang (misal <code>BA/S1-MNJ/2026/...</code>) tanpa tumpang tindih.
              </div>
              <Badge variant="success">{statsSelected.total} Berkas Terpilih Tervalidasi</Badge>
            </div>
          </div>
        </Panel>
      )}

      {/* =========================================================================
          TAB 3: SURAT TUGAS KOLEKTIF DOSEN PENGUJI
          ========================================================================= */}
      {activeTab === 'surat_tugas' && (
        <Panel
          title="Distribusi Surat Tugas Kolektif Dosen Penguji"
          subtitle="Diterbitkan secara terkonsolidasi per dosen penguji (1 dosen menerima 1 surat tugas memuat seluruh mahasiswa bimbingan/ujiannya pada periode ini)."
          icon={Users}
          actions={
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              onClick={() => notify(`Menyiarkan surat tugas digital resmi ke email dan akun dewan penguji aktif pada ${selectedGelombang}...`)}
            >
              Kirim Surat Tugas ke Seluruh Penguji
            </Button>
          }
        >
          <div style={{ padding: 'var(--space-3)', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: '#1E3A8A' }}>
            <strong>Efisiensi Administrasi Penguji:</strong> Dewan penguji tidak menerima puluhan lembar surat terpisah untuk setiap mahasiswa. Sistem secara otomatis mengelompokkan jadwal, ruangan, dan peran penguji (Ketua / Penguji Utama / Anggota / Promotor) ke dalam 1 Surat Tugas Kolektif per dosen penguji.
          </div>
        </Panel>
      )}

      {/* 6. Tabel Matriks Mahasiswa Siap Terbit Berkas Sidang */}
      <Panel noPadding style={{ marginTop: 'var(--space-4)' }}>
        <div 
          style={{ 
            padding: 'var(--space-3) var(--space-4)', 
            borderBottom: '1px solid var(--color-border-subtle)', 
            backgroundColor: 'var(--primitive-neutral-50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                id="select-all-mhs"
                checked={filteredMahasiswa.length > 0 && filteredMahasiswa.every(m => selectedMhsIds.includes(m.id))}
                onChange={handleToggleSelectAll}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="select-all-mhs" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', cursor: 'pointer' }}>
                Pilih Semua ({filteredMahasiswa.length})
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>
                Jenjang:
              </span>
              {['Semua', 'S1', 'S2', 'S3', 'D3'].map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setFilterJenjang(j)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11.5px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid',
                    borderColor: filterJenjang === j ? 'var(--color-brand-primary)' : 'var(--color-border-default)',
                    backgroundColor: filterJenjang === j ? 'var(--primitive-navy-100)' : '#FFFFFF',
                    color: filterJenjang === j ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                    fontWeight: filterJenjang === j ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          <Search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIM, nomor BA, judul..."
          />
        </div>

        <Table
          density="normal"
          striped
          columns={[
            {
              key: 'select',
              label: '',
              width: '45px',
              align: 'center',
              render: (_, row) => (
                <input
                  type="checkbox"
                  checked={selectedMhsIds.includes(row.id)}
                  onChange={() => handleToggleSelect(row.id)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              )
            },
            {
              key: 'noBA',
              label: 'No. Register BA',
              width: '175px',
              render: (val) => (
                <span style={{ fontWeight: 'bold', color: 'var(--primitive-navy-950)', fontSize: '12px' }}>
                  {val}
                </span>
              )
            },
            {
              key: 'nama',
              label: 'Mahasiswa & Jenjang',
              width: '230px',
              render: (val, row) => (
                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>{val}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {row.nim} • <Badge variant={row.jenjang === 'S3' ? 'gold' : row.jenjang === 'S2' ? 'purple' : 'navy'}>{row.jenjang}</Badge>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#0369A1', marginTop: '2px', fontWeight: '500' }}>
                    {row.jenisUjian}
                  </div>
                </div>
              )
            },
            {
              key: 'judul',
              label: 'Judul Tugas Akhir & Prasyarat',
              render: (val, row) => (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--primitive-navy-900)', lineHeight: 1.4 }}>
                    {val}
                  </div>
                  <div style={{ fontSize: '11px', color: '#059669', marginTop: '3px', fontWeight: '500' }}>
                    {row.statusSyarat}
                  </div>
                </div>
              )
            },
            {
              key: 'penguji',
              label: 'Dewan Penguji',
              width: '210px',
              render: (_, row) => (
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--color-brand-primary)' }}>
                    {row.pengujiCount} Dewan Penguji
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                    Ketua: {row.ketuaPenguji}
                  </div>
                </div>
              )
            },
            {
              key: 'status',
              label: 'Status Berkas',
              width: '140px',
              render: () => (
                <div>
                  <StatusBadge status={isSuccessComplete ? 'Selesai' : 'Siap Terbit'} />
                  <div style={{ fontSize: '10px', color: isSuccessComplete ? '#166534' : 'var(--color-text-muted)', marginTop: '2px' }}>
                    {isSuccessComplete ? 'QR Code Tersemat' : 'Antrean Siap'}
                  </div>
                </div>
              )
            },
            {
              key: 'aksi',
              label: 'Aksi',
              width: '90px',
              align: 'center',
              render: (_, row) => (
                <IconButton
                  icon={Download}
                  label="Unduh Berita Acara Individual"
                  size="sm"
                  bordered
                  onClick={async () => {
                    await downloadBeritaAcara(
                      { nama: row.nama, nim: row.nim, programStudi: row.prodi, jenjang: row.jenjang, judul: row.judul },
                      { noBA: row.noBA, nilaiFinal: row.nilai, grade: row.grade, status: 'Lulus Ujian Tugas Akhir' }
                    );
                  }}
                />
              )
            }
          ]}
          data={filteredMahasiswa}
        />
      </Panel>

      {/* =========================================================================
          MODAL SIMULASI BACKGROUND QUEUE WORKER DENGAN PROGRESS REAL-TIME
          ========================================================================= */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => {
          if (!isProcessing) setIsProcessModalOpen(false);
        }}
        title={`Background Worker: Penerbitan Kolektif (${statsSelected.total} Berkas)`}
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Status: {isProcessing ? `Memproses Berkas ${processedCount}/${statsSelected.total}...` : 'Selesai 100%'}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                disabled={isProcessing}
                onClick={() => setIsProcessModalOpen(false)}
              >
                Tutup
              </Button>
              {isSuccessComplete && (
                <Button
                  variant="primary"
                  icon={Archive}
                  onClick={() => downloadUniversalDoc({
                    namaDokumen: `Master_Bundle_Sidang_${selectedGelombang.replace(/[^a-zA-Z0-9]/g, '_')}`,
                    kategori: 'Master Bundle Arsip Sidang Kolektif',
                    ukuran: '14.8 MB',
                    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  }, {
                    nama: 'Koordinator Program Studi Manajemen',
                    nim: 'FEB-UTM',
                    prodi: 'Jurusan Manajemen FEB UTM'
                  })}
                >
                  Unduh Master Bundle PDF Sekarang
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
                Progres Kompilasi Dokumen Kolektif & SK Dekan:
              </span>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-brand-primary)' }}>
                {progressPercent}% ({processedCount}/{statsSelected.total} Berkas)
              </span>
            </div>
            <div style={{ width: '100%', height: '14px', backgroundColor: '#E5E7EB', borderRadius: '7px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${progressPercent}%`, 
                  height: '100%', 
                  backgroundColor: progressPercent === 100 ? '#16A34A' : 'var(--color-brand-primary)',
                  transition: 'width 0.25s ease'
                }} 
              />
            </div>
          </div>

          {/* Terminal / Real-time Logs Console */}
          <div 
            style={{ 
              padding: '12px 14px', 
              backgroundColor: '#1E293B', 
              borderRadius: 'var(--radius-sm)', 
              color: '#F8FAFC', 
              fontFamily: 'monospace', 
              fontSize: '11.5px',
              height: '180px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {processLogs.map((log, lIdx) => (
              <div key={lIdx} style={{ color: log.includes('Selesai') || log.includes('sukses') || log.includes('berhasil') ? '#4ADE80' : '#E2E8F0' }}>
                &gt; {log}
              </div>
            ))}
          </div>

          {isSuccessComplete && (
            <div style={{ padding: '12px', backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontSize: '12px' }}>
              <CheckCircle size={20} />
              <div>
                <strong>Kompilasi Sukses!</strong> 1 Master Dokumen SK Dekan Kolektif + {statsSelected.total} Berita Acara Sidang Ber-QR Code sah dan Surat Tugas Penguji telah disimpan di server dan siap didistribusikan.
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* =========================================================================
          MODAL OTORISASI PIN / PASSPHRASE DEKANAT
          ========================================================================= */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Otorisasi Digital Massal (E-Signature Dekan)"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={() => setIsPinModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleVerifikasiPin}>
              Sahkan Berkas Kolektif dengan QR Code
            </Button>
          </div>
        }
      >
        <form onSubmit={handleVerifikasiPin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Masukkan PIN Otorisasi Dekan FEB UTM untuk menandatangani 1 SK Dekan Kolektif dan seluruh Berita Acara Ujian Sidang terpilih sekaligus.
          </div>

          <FormField label="Pejabat Penandatangan">
            <Input value={`${pejabatDekan.nama} (${pejabatDekan.jabatan})`} readOnly />
          </FormField>

          <FormField label="Nomor SK Dekan Induk">
            <Input value={nomorSK} readOnly />
          </FormField>

          <FormField label="PIN Otorisasi Dekanat (6 Digit)" required>
            <Input
              type="password"
              placeholder="Masukkan PIN (contoh: 123456)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              maxLength={6}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
