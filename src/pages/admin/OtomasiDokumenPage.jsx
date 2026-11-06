import React, { useState, useEffect } from 'react';
import { formatTanggal, formatTanggalSingkat } from '../../utils/format';
import {
  FileText,
  FileBadge2,
  FileCheck2,
  FileSpreadsheet,
  Download,
  ExternalLink,
  QrCode,
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
  Search,
  Copy,
  Settings,
  Layers,
  Award,
  Users,
  ShieldCheck,
  AlertTriangle,
  Printer,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Card, Badge, Button, IconButton, Modal, FormField, Input, Select, Textarea, Alert, Table, EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/shell';
import { documentApi, openProtectedFile } from '../../services/api';
import { PEJABAT_DEKANAT, DEFAULT_PEJABAT_ID, getPejabatById } from '../../data/pejabatDekanat';

// Pejabat penandatangan default (sumber tunggal: src/data/pejabatDekanat.js)
const PEJABAT_DEFAULT = getPejabatById(DEFAULT_PEJABAT_ID);
const DEKAN_DEFAULT = PEJABAT_DEKANAT.find((p) => p.jabatan.includes('Dekan FEB')) || PEJABAT_DEFAULT;

// Preset Pengujian Cepat untuk Admin / Pasca
const MOCK_PRESET_STUDENTS = [
  {
    nama: 'Ilham Maulana',
    nim: '210211100142',
    prodi: 'S-1 Manajemen',
    jenjang: 'S1',
    judul: 'Analisis Pengaruh Financial Technology dan Literasi Keuangan Terhadap Kinerja UMKM di Madura',
    tahap: 'Sidang Skripsi',
    jadwalHari: 'Senin',
    jadwalTanggal: '19 Oktober 2026',
    jadwalJam: '09.00 - 11.00 WIB',
    ruang: 'Ruang Sidang Utama FEB Gedung Rektorat Lt. 2',
    ketua: 'Dr. Faidal, S.E., M.M.',
    ketuaNip: '197703032003121002',
    sekretaris: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    sekretarisNip: '196305141990021001',
    anggota: 'Dr. Hj. Siti Aminah, S.E., M.Si.',
    anggotaNip: '197108221998032001',
    pembimbing1: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    pembimbing1Nip: '196201081987032001',
    pembimbing2: 'Dr. Faidal, S.E., M.M.',
    pembimbing2Nip: '197703032003121002'
  },
  {
    nama: 'Nurul Hidayati',
    nim: '220221100085',
    prodi: 'S-1 Akuntansi',
    jenjang: 'S1',
    judul: 'Determinan Pencegahan Fraud pada Pengelolaan Alokasi Dana Desa (ADD) Menggunakan Fraud Diamond Theory',
    tahap: 'Seminar Proposal',
    jadwalHari: 'Rabu',
    jadwalTanggal: '21 Oktober 2026',
    jadwalJam: '10.30 - 12.30 WIB',
    ruang: 'Ruang Sidang Jurusan Akuntansi RKB Lt. 3',
    ketua: 'Dr. Bambang Sudarsono, S.E., M.Ak.',
    ketuaNip: '197508112002121003',
    sekretaris: 'Prof. Dr. Sutrisno, S.E., M.Si.',
    sekretarisNip: '196102141989031002',
    anggota: 'Dra. Endang Sri Rahayu, M.Si., Ak.',
    anggotaNip: '196803211994032001',
    pembimbing1: 'Prof. Dr. Sutrisno, S.E., M.Si.',
    pembimbing1Nip: '196102141989031002',
    pembimbing2: 'Dr. Bambang Sudarsono, S.E., M.Ak.',
    pembimbing2Nip: '197508112002121003'
  },
  {
    nama: 'Bambang Eko Santoso',
    nim: '230231200015',
    prodi: 'S-2 Magister Manajemen',
    jenjang: 'S2',
    judul: 'Strategi Akselerasi Transformasi Digital Perbankan Syariah dan Daya Saing Pasar Global di Indonesia',
    tahap: 'Ujian Tesis',
    jadwalHari: 'Kamis',
    jadwalTanggal: '22 Oktober 2026',
    jadwalJam: '13.00 - 15.30 WIB',
    ruang: 'Ruang Graha Pascasarjana Gedung Pasca Lt. 3',
    ketua: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    ketuaNip: '196305141990021001',
    sekretaris: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    sekretarisNip: '196201081987032001',
    anggota: 'Dr. Prasetyo Nugroho, S.E., M.M.',
    anggotaNip: '197405122001121001',
    pembimbing1: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    pembimbing1Nip: '196305141990021001',
    pembimbing2: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    pembimbing2Nip: '196201081987032001'
  },
  {
    nama: 'Dr. Hendra Gunawan, S.E., M.M.',
    nim: '230241300004',
    prodi: 'S-3 Doktor Ilmu Manajemen',
    jenjang: 'S3',
    judul: 'Konstruksi Model Resiliensi Bisnis UMKM Berkelanjutan Berbasis Kearifan Lokal Madura: Pendekatan Pentahelix',
    tahap: 'Ujian Terbuka / Promosi Doktoral',
    jadwalHari: 'Sabtu',
    jadwalTanggal: '24 Oktober 2026',
    jadwalJam: '08.30 - 12.00 WIB',
    ruang: 'Aula Utama Graha Utama UTM',
    ketua: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    ketuaNip: '196201081987032001',
    sekretaris: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    sekretarisNip: '196305141990021001',
    anggota: 'Prof. Dr. Moeljadi, S.E., SU.',
    anggotaNip: '195908121986011001',
    pembimbing1: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    pembimbing1Nip: '196305141990021001',
    pembimbing2: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    pembimbing2Nip: '196201081987032001'
  }
];

export default function OtomasiDokumenPage() {
  const [activeTab, setActiveTab] = useState('paket'); // 'paket' | 'mandiri' | 'arsip' | 'counters'
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);

  // Data Counters & Arsip
  const [counters, setCounters] = useState([]);
  const [archives, setArchives] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('Semua');

  // Modal Detail & Hasil Generator
  const [examPackageResult, setExamPackageResult] = useState(null);
  const [singleDocResult, setSingleDocResult] = useState(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState(null);

  // Form State: Paket Ujian Lengkap
  const [packageForm, setPackageForm] = useState({
    presetIdx: '0',
    namaMahasiswa: MOCK_PRESET_STUDENTS[0].nama,
    nim: MOCK_PRESET_STUDENTS[0].nim,
    prodi: MOCK_PRESET_STUDENTS[0].prodi,
    jenjang: MOCK_PRESET_STUDENTS[0].jenjang,
    judul: MOCK_PRESET_STUDENTS[0].judul,
    tahap: MOCK_PRESET_STUDENTS[0].tahap,
    jadwalTanggal: MOCK_PRESET_STUDENTS[0].jadwalTanggal,
    jadwalJam: MOCK_PRESET_STUDENTS[0].jadwalJam,
    ruang: MOCK_PRESET_STUDENTS[0].ruang,
    ketuaPenguji: MOCK_PRESET_STUDENTS[0].ketua,
    sekretarisPenguji: MOCK_PRESET_STUDENTS[0].sekretaris,
    anggotaPenguji: MOCK_PRESET_STUDENTS[0].anggota,
    dekanNama: DEKAN_DEFAULT.nama,
    dekanNip: DEKAN_DEFAULT.nip,
    pejabatJabatan: PEJABAT_DEFAULT.jabatan,
    pejabatNama: PEJABAT_DEFAULT.nama,
    pejabatNip: PEJABAT_DEFAULT.nip
  });

  // Form State: Generator Mandiri
  const [mandiriType, setMandiriType] = useState('surat_tugas_penguji');
  const [mandiriForm, setMandiriForm] = useState({
    namaMahasiswa: 'Ilham Maulana',
    nim: '210211100142',
    prodi: 'S-1 Manajemen',
    jenjang: 'S1',
    judul: 'Analisis Pengaruh Financial Technology dan Literasi Keuangan Terhadap Kinerja UMKM di Madura',
    tahap: 'Sidang Skripsi',
    jadwalTanggal: '19 Oktober 2026',
    jadwalJam: '09.00 - 11.00 WIB',
    ruang: 'Ruang Sidang Utama FEB Gedung Rektorat Lt. 2',
    ketuaPenguji: 'Dr. Faidal, S.E., M.M.',
    sekretarisPenguji: 'Prof. Dr. Pribanus Wantara, Drs., M.M.',
    anggotaPenguji: 'Dr. Hj. Siti Aminah, S.E., M.Si.',
    pembimbing1: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    pembimbing2: 'Dr. Faidal, S.E., M.M.',
    masaBimbingan: 'Semester Gasal T.A. 2025/2026',
    nilaiFinal: 88.5,
    grade: 'A',
    rekomendasiKelayakan: 'LULUS DENGAN REVISI'
  });

  // Load Data Awal
  const loadInitialData = async () => {
    try {
      const [resCounters, resArchive] = await Promise.all([
        documentApi.getAutoCounters(),
        documentApi.getArchive()
      ]);

      if (resCounters?.data) setCounters(resCounters.data);
      if (resArchive?.data) setArchives(resArchive.data);
    } catch (err) {
      console.warn('Gagal memuat data dari server, menggunakan fallback:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handler Pilih Preset Mahasiswa
  const handleSelectPreset = (e) => {
    const idx = parseInt(e.target.value, 10);
    const p = MOCK_PRESET_STUDENTS[idx];
    if (!p) return;

    setPackageForm({
      presetIdx: String(idx),
      namaMahasiswa: p.nama,
      nim: p.nim,
      prodi: p.prodi,
      jenjang: p.jenjang,
      judul: p.judul,
      tahap: p.tahap,
      jadwalTanggal: p.jadwalTanggal,
      jadwalJam: p.jadwalJam,
      ruang: p.ruang,
      ketuaPenguji: p.ketua,
      sekretarisPenguji: p.sekretaris,
      anggotaPenguji: p.anggota,
      dekanNama: DEKAN_DEFAULT.nama,
      dekanNip: DEKAN_DEFAULT.nip,
      pejabatJabatan: PEJABAT_DEFAULT.jabatan,
      pejabatNama: PEJABAT_DEFAULT.nama,
      pejabatNip: PEJABAT_DEFAULT.nip
    });
  };

  // 1. Eksekusi One-Click Exam Package Generator
  const handleGenerateExamPackage = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertInfo(null);

    try {
      const res = await documentApi.generateExamPackage(packageForm);
      if (res.success) {
        setExamPackageResult(res.data);
        setAlertInfo({
          type: 'success',
          text: `Paket Dokumen Ujian Berhasil Digenerate. 3 berkas formal (Surat Tugas, Berita Acara, SK Dekan) untuk ${packageForm.namaMahasiswa} telah dibuat dan diarsipkan dengan nomor resmi anti-bentrok.`
        });
        loadInitialData();
      } else {
        throw new Error(res.error || 'Gagal generate paket berkas');
      }
    } catch (err) {
      setAlertInfo({
        type: 'danger',
        text: 'Terjadi kesalahan saat memproses paket ujian: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Eksekusi Generator Mandiri
  const handleGenerateSingleDoc = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertInfo(null);

    try {
      let res;
      if (mandiriType === 'surat_tugas_penguji') {
        res = await documentApi.generateSuratTugasPenguji(mandiriForm);
      } else if (mandiriType === 'surat_tugas_pembimbing') {
        res = await documentApi.generateSuratTugasPembimbing(mandiriForm);
      } else if (mandiriType === 'sk_dekan') {
        res = await documentApi.generateSKDekan(mandiriForm);
      } else if (mandiriType === 'berita_acara') {
        res = await documentApi.generateBeritaAcara(mandiriForm);
      } else if (mandiriType === 'lembar_pengesahan') {
        res = await documentApi.generatePengesahan(mandiriForm);
      }

      if (res?.success) {
        setSingleDocResult(res.data);
        setAlertInfo({
          type: 'success',
          text: `Dokumen ${res.data.docNumber || 'Resmi'} berhasil diterbitkan dengan Kode Verifikasi: ${res.data.verificationCode}`
        });
        loadInitialData();
      } else {
        throw new Error(res?.error || 'Gagal memproses dokumen');
      }
    } catch (err) {
      setAlertInfo({
        type: 'danger',
        text: 'Gagal membuat dokumen: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Simpan Update Counter Format / Nomor Urut
  const handleSaveCounterConfig = async (e) => {
    e.preventDefault();
    if (!selectedCounter) return;

    try {
      const res = await documentApi.updateAutoCounter(selectedCounter.doc_type, {
        lastNumber: selectedCounter.last_number,
        formatTemplate: selectedCounter.format_template
      });

      if (res?.success) {
        setAlertInfo({
          type: 'success',
          text: `Format & Counter untuk ${selectedCounter.doc_type} berhasil diperbarui di database SQLite.`
        });
        setConfigModalOpen(false);
        loadInitialData();
      }
    } catch (err) {
      setAlertInfo({
        type: 'danger',
        text: 'Gagal memperbarui counter: ' + err.message
      });
    }
  };

  // Helper Salin Teks
  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Filter Arsip Dokumen
  const filteredArchives = archives.filter((item) => {
    const matchesSearch =
      (item.namaMahasiswa || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nim || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nomorDokumen || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.judulDokumen || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === 'Semua' ||
      (item.jenisDokumen || '').toLowerCase().includes(filterType.toLowerCase());

    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header Institusional */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM' },
          { label: 'Admin Akademik' },
          { label: 'Otomasi Dokumen & SK' }
        ]}
        title="Pusat Otomasi Dokumen Tahapan & SK"
        description="Penerbitan otomatis Surat Tugas Pembimbing & Penguji, SK Dekan, Berita Acara Ujian, dan Lembar Pengesahan dengan stempel dinas digital, nomor urut anti-bentrok, dan verifikasi QR Code terintegrasi."
        statusBadge={<Badge variant="primary">{archives.length || 24} Dokumen Terarsip</Badge>}
        primaryAction={
          <Button
            variant="primary"
            icon={Zap}
            onClick={() => setActiveTab('paket')}
          >
            Paket Ujian Kilat
          </Button>
        }
        secondaryAction={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={loadInitialData}
          >
            Sinkron Arsip
          </Button>
        }
      />

      {/* Alert Notifikasi */}
      {alertInfo && (
        <Alert
          type={alertInfo.type}
          message={alertInfo.text}
          onClose={() => setAlertInfo(null)}
        />
      )}

      {/* 2. Summary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)'
        }}
      >
        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-navy-50)', color: 'var(--primitive-navy-900)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCheck2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase' }}>
              Dokumen Terbit
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              {archives.length || 24}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-link)', fontWeight: 'var(--font-weight-medium)' }}>
              Terindeks SQLite & Cloud
            </div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-green-50)', color: 'var(--primitive-green-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase' }}>
              Paket Ujian 1-Klik
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              3 Berkas / Ujian
            </div>
            <div style={{ fontSize: '12px', color: 'var(--primitive-green-700)', fontWeight: 'var(--font-weight-medium)' }}>
              ST + Berita Acara + SK
            </div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-gold-50)', color: 'var(--primitive-gold-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileBadge2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase' }}>
              Nomor Surat Urut
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              {counters.find(c => c.doc_type === 'surat_tugas_penguji')?.last_number ? `No. ${counters.find(c => c.doc_type === 'surat_tugas_penguji').last_number}` : 'No. 249'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--primitive-gold-700)', fontWeight: 'var(--font-weight-medium)' }}>
              Anti-Bentrok Otomatis
            </div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-blue-50)', color: 'var(--primitive-blue-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QrCode size={24} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase' }}>
              QR Verifikasi Publik
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              100% Sah
            </div>
            <div style={{ fontSize: '12px', color: 'var(--primitive-blue-700)', fontWeight: 'var(--font-weight-medium)' }}>
              Digital Seal FEB UTM
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Tab Navigasi */}
      <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', gap: 'var(--space-2)', overflowX: 'auto' }}>
        {[
          { id: 'paket', label: '1-Click Exam Package Generator', icon: Zap, color: '#D97706' },
          { id: 'mandiri', label: 'Generator Dokumen Mandiri', icon: FileText, color: '#2563EB' },
          { id: 'arsip', label: `Arsip Dokumen Resmi Terbit (${archives.length})`, icon: FileSpreadsheet, color: '#059669' },
          { id: 'counters', label: `Format & Nomor Urut Dinas (${counters.length})`, icon: Settings, color: '#475569' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: isActive ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                color: isActive ? 'var(--primitive-navy-900, #182B49)' : '#64748B',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--primitive-navy-900, #182B49)' : '3px solid transparent',
                marginBottom: '-2px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} color={isActive ? tab.color : '#94A3B8'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ONE-CLICK EXAM PACKAGE GENERATOR                        */}
      {/* ============================================================== */}
      {activeTab === 'paket' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 'var(--space-6)' }}>
          {/* Kolom Kiri: Form Input & Presets */}
          <div>
            <Card style={{ padding: 'var(--space-6)', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'var(--font-weight-bold)', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={20} color="#D97706" />
                    Parameter Penerbitan Paket Berkas Ujian
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                    Mencetak sekaligus: 1x Surat Tugas Penguji, 1x Berita Acara Ujian, dan 1x SK Dekan.
                  </p>
                </div>
                <Badge variant="warning">One-Click Engine</Badge>
              </div>

              <form onSubmit={handleGenerateExamPackage} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Preset Cepat */}
                <FormField label="Pilih Calon Peserta Ujian / Preset Sampel">
                  <Select
                    value={packageForm.presetIdx}
                    onChange={handleSelectPreset}
                    style={{ width: '100%', backgroundColor: '#FFFBEB', borderColor: '#FDE68A', fontWeight: 'var(--font-weight-semibold)' }}
                  >
                    {MOCK_PRESET_STUDENTS.map((st, idx) => (
                      <option key={idx} value={idx}>
                        [{st.jenjang}] {st.nama} — {st.tahap} ({st.prodi})
                      </option>
                    ))}
                  </Select>
                </FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormField label="Nama Mahasiswa *">
                    <Input
                      value={packageForm.namaMahasiswa}
                      onChange={(e) => setPackageForm({ ...packageForm, namaMahasiswa: e.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Nomor Induk Mahasiswa (NIM) *">
                    <Input
                      value={packageForm.nim}
                      onChange={(e) => setPackageForm({ ...packageForm, nim: e.target.value })}
                      required
                    />
                  </FormField>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormField label="Program Studi *">
                    <Input
                      value={packageForm.prodi}
                      onChange={(e) => setPackageForm({ ...packageForm, prodi: e.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Tahap Ujian Akademik *">
                    <Input
                      value={packageForm.tahap}
                      onChange={(e) => setPackageForm({ ...packageForm, tahap: e.target.value })}
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Judul Karya Ilmiah / Tugas Akhir *">
                  <Textarea
                    rows={2}
                    value={packageForm.judul}
                    onChange={(e) => setPackageForm({ ...packageForm, judul: e.target.value })}
                    required
                  />
                </FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <FormField label="Hari & Tanggal *">
                    <Input
                      value={packageForm.jadwalTanggal}
                      onChange={(e) => setPackageForm({ ...packageForm, jadwalTanggal: e.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Jam Pelaksanaan *">
                    <Input
                      value={packageForm.jadwalJam}
                      onChange={(e) => setPackageForm({ ...packageForm, jadwalJam: e.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Ruang Ujian *">
                    <Input
                      value={packageForm.ruang}
                      onChange={(e) => setPackageForm({ ...packageForm, ruang: e.target.value })}
                      required
                    />
                  </FormField>
                </div>

                <div style={{ paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'var(--font-weight-bold)', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Susunan Dewan Penguji:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 'var(--font-weight-semibold)' }}>Ketua Penguji:</span>
                      <Input
                        value={packageForm.ketuaPenguji}
                        onChange={(e) => setPackageForm({ ...packageForm, ketuaPenguji: e.target.value })}
                        required
                        style={{ fontSize: '13px' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 'var(--font-weight-semibold)' }}>Sekretaris Penguji:</span>
                      <Input
                        value={packageForm.sekretarisPenguji}
                        onChange={(e) => setPackageForm({ ...packageForm, sekretarisPenguji: e.target.value })}
                        required
                        style={{ fontSize: '13px' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 'var(--font-weight-semibold)' }}>Anggota Penguji:</span>
                      <Input
                        value={packageForm.anggotaPenguji}
                        onChange={(e) => setPackageForm({ ...packageForm, anggotaPenguji: e.target.value })}
                        required
                        style={{ fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'var(--primitive-navy-900, #182B49)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 'var(--font-weight-bold)',
                      fontSize: '14px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Sedang Menggenerate 3 Dokumen...
                      </>
                    ) : (
                      <>
                        <Zap size={16} color="#F59E0B" /> Generate Paket Dokumen Lengkap (3 Berkas Sekaligus)
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Card>
          </div>

          {/* Kolom Kanan: Hasil Generasi Terkini / Status Paket */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {examPackageResult ? (
              <Card style={{ padding: 'var(--space-6)', backgroundColor: '#ECFDF5', border: '2px solid #34D399', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #A7F3D0', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={18} aria-hidden="true" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 'var(--font-weight-bold)', fontSize: '16px', color: '#064E3B' }}>Paket Dokumen Berhasil Dibuat!</h3>
                      <p style={{ margin: 0, fontSize: '12px', color: '#047857' }}>ID Paket: {examPackageResult.packageId}</p>
                    </div>
                  </div>
                  <Badge variant="success">3 File PDF Sah</Badge>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid #A7F3D0', marginBottom: '16px', fontSize: '13px' }}>
                  <div style={{ fontWeight: 'var(--font-weight-bold)', color: '#1E293B' }}>{examPackageResult.mahasiswa?.nama}</div>
                  <div style={{ color: '#64748B' }}>NIM: {examPackageResult.mahasiswa?.nim} | {examPackageResult.mahasiswa?.prodi}</div>
                  <div style={{ color: '#94A3B8', fontSize: '12px' }}>Diterbitkan: {formatTanggal(examPackageResult.timestamp)}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {examPackageResult.documents?.map((doc, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px',
                        backgroundColor: '#ffffff',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #CBD5E1',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <Badge variant="neutral">Berkas #{idx + 1}</Badge>
                          <h4 style={{ margin: '6px 0 2px 0', fontSize: '14px', fontWeight: 'var(--font-weight-bold)', color: '#1E293B' }}>{doc.jenis}</h4>
                          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px', color: '#475569' }}>{doc.nomor}</p>
                          <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#059669', fontWeight: 'var(--font-weight-semibold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <QrCode size={14} /> {doc.kodeVerifikasi}
                          </p>
                        </div>
                      </div>

                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyText(doc.kodeVerifikasi, `hash-${idx}`)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            color: '#475569',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Copy size={13} /> {copyFeedback === `hash-${idx}` ? 'Tersalin!' : 'Salin Kode'}
                        </button>

                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); openProtectedFile(doc.fileUrl); }}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '6px 14px',
                            backgroundColor: 'var(--primitive-navy-900, #182B49)',
                            color: '#ffffff',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-semibold)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Download size={14} /> Unduh PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '16px', padding: '10px', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-sm)', border: '1px solid #BFDBFE', fontSize: '12px', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#2563EB" />
                  <span>Semua berkas otomatis tersimpan di SQLite & folder dokumen resmi ber-QR verifikasi publik.</span>
                </div>
              </Card>
            ) : (
              <Card style={{ padding: '32px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px dashed #CBD5E1', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <Zap size={28} />
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'var(--font-weight-bold)', color: '#1E293B' }}>Belum Ada Paket Ujian Terpilih</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
                  Gunakan formulir di samping untuk memilih peserta ujian atau gunakan preset sampel untuk mencoba
                  generasi instan 3 berkas administrasi sekaligus.
                </p>
                <div style={{ marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPackageForm({
                        ...packageForm,
                        presetIdx: '0',
                        namaMahasiswa: MOCK_PRESET_STUDENTS[0].nama,
                        nim: MOCK_PRESET_STUDENTS[0].nim,
                        judul: MOCK_PRESET_STUDENTS[0].judul
                      });
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      color: '#475569',
                      fontWeight: 'var(--font-weight-semibold)',
                      cursor: 'pointer'
                    }}
                  >
                    Muat Data Ilham Maulana (S-1)
                  </button>
                </div>
              </Card>
            )}

            {/* Standar Legalitas FEB UTM */}
            <Card style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'var(--font-weight-bold)', textTransform: 'uppercase', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#2563EB" />
                Standar Penjaminan Mutu & Legalitas FEB UTM
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.5 }}>
                <li>
                  <strong>Penomoran Anti-Bentrok:</strong> Berbasis table `document_counters` dengan increment atomik SQLite.
                </li>
                <li>
                  <strong>Tanda Tangan & Stempel Digital:</strong> Embed stempel dinas resolusi tinggi dengan segel keabsahan Dekan FEB.
                </li>
                <li>
                  <strong>Validasi QR Code Real-Time:</strong> Terhubung langsung dengan portal verifikasi `/verifikasi-dokumen?code=...`
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: GENERATOR DOKUMEN MANDIRI                               */}
      {/* ============================================================== */}
      {activeTab === 'mandiri' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 'var(--space-6)' }}>
          <div>
            <Card style={{ padding: 'var(--space-6)', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #F1F5F9', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'var(--font-weight-bold)', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="#2563EB" />
                  Generator Dokumen Individual
                </h2>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                  Penerbitan dokumen resmi mandiri (Surat Tugas Penguji, Surat Tugas Pembimbing, SK Dekan, Berita Acara, Lembar Pengesahan).
                </p>
              </div>

              {/* Pilihan Jenis Dokumen */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-bold)', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Pilih Jenis Dokumen Resmi:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {[
                    { id: 'surat_tugas_penguji', label: 'Surat Tugas Penguji', icon: Users },
                    { id: 'surat_tugas_pembimbing', label: 'Surat Tugas Pembimbing', icon: Award },
                    { id: 'sk_dekan', label: 'SK Dekan', icon: FileBadge2 },
                    { id: 'berita_acara', label: 'Berita Acara Ujian', icon: FileCheck2 },
                    { id: 'lembar_pengesahan', label: 'Lembar Pengesahan', icon: ShieldCheck }
                  ].map((docType) => {
                    const Icon = docType.icon;
                    const isSelected = mandiriType === docType.id;
                    return (
                      <button
                        key={docType.id}
                        type="button"
                        onClick={() => setMandiriType(docType.id)}
                        style={{
                          padding: '12px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '2px solid var(--primitive-navy-900)' : '1px solid #E2E8F0',
                          backgroundColor: isSelected ? 'var(--primitive-navy-900)' : '#F8FAFC',
                          color: isSelected ? '#ffffff' : '#334155',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          textAlign: 'left'
                        }}
                      >
                        <Icon size={18} color={isSelected ? '#F59E0B' : '#64748B'} />
                        <span style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', lineHeight: 1.2 }}>{docType.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleGenerateSingleDoc} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormField label="Nama Mahasiswa *">
                    <Input
                      value={mandiriForm.namaMahasiswa}
                      onChange={(e) => setMandiriForm({ ...mandiriForm, namaMahasiswa: e.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Nomor Induk Mahasiswa (NIM) *">
                    <Input
                      value={mandiriForm.nim}
                      onChange={(e) => setMandiriForm({ ...mandiriForm, nim: e.target.value })}
                      required
                    />
                  </FormField>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormField label="Program Studi *">
                    <Input
                      value={mandiriForm.prodi}
                      onChange={(e) => setMandiriForm({ ...mandiriForm, prodi: e.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Jenjang Pendidikan">
                    <Select
                      value={mandiriForm.jenjang}
                      onChange={(e) => setMandiriForm({ ...mandiriForm, jenjang: e.target.value })}
                    >
                      <option value="D3">D-3 Diploma</option>
                      <option value="S1">S-1 Sarjana</option>
                      <option value="S2">S-2 Magister</option>
                      <option value="S3">S-3 Doktoral</option>
                    </Select>
                  </FormField>
                </div>

                <FormField label="Judul Tugas Akhir / Skripsi / Tesis / Disertasi *">
                  <Textarea
                    rows={2}
                    value={mandiriForm.judul}
                    onChange={(e) => setMandiriForm({ ...mandiriForm, judul: e.target.value })}
                    required
                  />
                </FormField>

                {mandiriType === 'surat_tugas_pembimbing' && (
                  <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'var(--font-weight-bold)', color: '#334155', textTransform: 'uppercase' }}>
                      Penetapan Dosen Pembimbing:
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <FormField label="Pembimbing I / Promotor">
                        <Input
                          value={mandiriForm.pembimbing1}
                          onChange={(e) => setMandiriForm({ ...mandiriForm, pembimbing1: e.target.value })}
                          required
                        />
                      </FormField>
                      <FormField label="Pembimbing II / Ko-Promotor">
                        <Input
                          value={mandiriForm.pembimbing2}
                          onChange={(e) => setMandiriForm({ ...mandiriForm, pembimbing2: e.target.value })}
                          required
                        />
                      </FormField>
                    </div>
                    <FormField label="Masa Berlaku Bimbingan">
                      <Input
                        value={mandiriForm.masaBimbingan}
                        onChange={(e) => setMandiriForm({ ...mandiriForm, masaBimbingan: e.target.value })}
                        required
                      />
                    </FormField>
                  </div>
                )}

                {(mandiriType === 'surat_tugas_penguji' || mandiriType === 'berita_acara' || mandiriType === 'sk_dekan') && (
                  <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'var(--font-weight-bold)', color: '#334155', textTransform: 'uppercase' }}>
                      Jadwal & Komposisi Dewan Penguji:
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <FormField label="Tanggal Ujian">
                        <Input
                          value={mandiriForm.jadwalTanggal}
                          onChange={(e) => setMandiriForm({ ...mandiriForm, jadwalTanggal: e.target.value })}
                          required
                        />
                      </FormField>
                      <FormField label="Jam Pelaksanaan">
                        <Input
                          value={mandiriForm.jadwalJam}
                          onChange={(e) => setMandiriForm({ ...mandiriForm, jadwalJam: e.target.value })}
                          required
                        />
                      </FormField>
                      <FormField label="Ruang Ujian">
                        <Input
                          value={mandiriForm.ruang}
                          onChange={(e) => setMandiriForm({ ...mandiriForm, ruang: e.target.value })}
                          required
                        />
                      </FormField>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <FormField label="Ketua Penguji">
                        <Input
                          value={mandiriForm.ketuaPenguji}
                          onChange={(e) => setMandiriForm({ ...mandiriForm, ketuaPenguji: e.target.value })}
                          required
                        />
                      </FormField>
                      <FormField label="Sekretaris Penguji">
                        <Input
                          value={mandiriForm.sekretarisPenguji}
                          onChange={(e) => setMandiriForm({ ...mandiriForm, sekretarisPenguji: e.target.value })}
                          required
                        />
                      </FormField>
                      <FormField label="Anggota Penguji">
                        <Input
                          value={mandiriForm.anggotaPenguji}
                          onChange={(e) => setMandiriForm({ ...mandiriForm, anggotaPenguji: e.target.value })}
                          required
                        />
                      </FormField>
                    </div>
                  </div>
                )}

                <div style={{ paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'var(--primitive-navy-900, #182B49)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 'var(--font-weight-bold)',
                      fontSize: '14px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Sedang Menerbitkan...
                      </>
                    ) : (
                      <>
                        <Printer size={16} /> Cetak & Terbitkan Dokumen PDF Resmi
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Card>
          </div>

          <div>
            {singleDocResult ? (
              <Card style={{ padding: '24px', backgroundColor: '#ffffff', border: '2px solid #3B82F6', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1D4ED8', fontWeight: 'var(--font-weight-bold)', marginBottom: '16px' }}>
                  <CheckCircle2 size={20} color="#059669" />
                  Dokumen Berhasil Diterbitkan!
                </div>

                <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'var(--font-weight-bold)', color: '#1E293B', fontSize: '14px' }}>{singleDocResult.docNumber}</div>
                  <div style={{ fontFamily: 'monospace', color: '#64748B', fontSize: '12px' }}>{singleDocResult.filename}</div>
                  <div style={{ color: '#059669', fontWeight: 'var(--font-weight-semibold)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <QrCode size={14} /> {singleDocResult.verificationCode}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); openProtectedFile(singleDocResult.fileUrl); }}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'var(--primitive-navy-900, #182B49)',
                      color: '#ffffff',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: '13px',
                      textAlign: 'center',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Download size={16} /> Unduh Dokumen PDF
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyText(singleDocResult.verificationCode, 'single-hash')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #CBD5E1',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Copy size={14} /> {copyFeedback === 'single-hash' ? 'Tersalin ke Clipboard!' : 'Salin Kode Hash Verifikasi'}
                  </button>
                </div>
              </Card>
            ) : (
              <Card style={{ padding: '32px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-md)' }}>
                <FileBadge2 size={40} color="#94A3B8" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 'var(--font-weight-bold)', color: '#334155' }}>Pratinjau Dokumen</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
                  Pilih tipe dokumen dan lengkapi formulir di samping. Dokumen PDF lengkap dengan kop, stempel, dan QR
                  verifikasi akan langsung muncul di sini.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ARSIP DOKUMEN RESMI TERBIT                              */}
      {/* ============================================================== */}
      {activeTab === 'arsip' && (
        <Card style={{ padding: 'var(--space-6)', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'var(--font-weight-bold)', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={20} color="#059669" />
                Buku Induk Arsip Dokumen Digital Terbit
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                Daftar seluruh berkas resmi yang telah memiliki nomor dinas, stempel, dan hash verifikasi SQLite.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <Input
                  placeholder="Cari Mahasiswa / No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '32px', fontSize: '12px' }}
                />
              </div>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ fontSize: '12px', width: '170px' }}
              >
                <option value="Semua">Semua Jenis</option>
                <option value="Surat Tugas Penguji">Surat Tugas Penguji</option>
                <option value="Surat Tugas Pembimbing">Surat Tugas Pembimbing</option>
                <option value="Surat Keputusan Dekan">SK Dekan</option>
                <option value="Berita Acara">Berita Acara</option>
                <option value="Lembar Pengesahan">Lembar Pengesahan</option>
              </Select>
            </div>
          </div>

          {filteredArchives.length === 0 ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="Tidak Ada Arsip"
              description="Tidak ada arsip dokumen yang sesuai dengan pencarian."
            />
          ) : (
            <Table
              density="compact"
              keyField="id"
              data={filteredArchives.map((doc, idx) => ({ ...doc, id: doc.id || `arsip-${idx}` }))}
              columns={[
                {
                  key: 'nomorDokumen',
                  label: 'No. Dokumen & Jenis',
                  render: (_, doc) => (
                    <div>
                      <div style={{ fontWeight: 'var(--font-weight-bold)', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>{doc.nomorDokumen || '-'}</div>
                      <Badge variant="neutral">{doc.jenisDokumen}</Badge>
                    </div>
                  )
                },
                {
                  key: 'namaMahasiswa',
                  label: 'Mahasiswa (NIM)',
                  render: (_, doc) => (
                    <div>
                      <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>{doc.namaMahasiswa || 'Ilham Maulana'}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--type-caption-size)' }}>{doc.nim || '210211100142'} ({doc.jenjang || 'S1'})</div>
                    </div>
                  )
                },
                {
                  key: 'judulDokumen',
                  label: 'Judul Berkas',
                  render: (val) => (
                    <span style={{ display: 'inline-block', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={val}>
                      {val || '-'}
                    </span>
                  )
                },
                {
                  key: 'kodeVerifikasi',
                  label: 'Kode Verifikasi QR',
                  render: (val, doc) => (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
                        <QrCode size={14} color="var(--color-state-success-text)" />
                        <span style={{ color: 'var(--color-state-success-text)', fontWeight: 'var(--font-weight-semibold)' }}>{val || '-'}</span>
                        <IconButton
                          icon={Copy}
                          size="sm"
                          label="Salin Kode Verifikasi"
                          onClick={() => handleCopyText(val, `copy-${doc.id}`)}
                        />
                      </div>
                      {copyFeedback === `copy-${doc.id}` && (
                        <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-link)', display: 'block', marginTop: '2px' }}>Tersalin!</span>
                      )}
                    </div>
                  )
                },
                {
                  key: 'createdAt',
                  label: 'Waktu Terbit',
                  render: (val) => (val ? formatTanggalSingkat(val) : 'Hari Ini')
                },
                {
                  key: 'aksi',
                  label: 'Aksi',
                  align: 'right',
                  render: (_, doc) => (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1-5)' }}>
                      {doc.fileUrl && (
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); openProtectedFile(doc.fileUrl); }}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '6px 8px',
                            backgroundColor: 'var(--color-state-info-subtle)',
                            color: 'var(--color-text-link)',
                            borderRadius: 'var(--radius-sm)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                          title="Unduh Berkas PDF"
                        >
                          <Download size={14} />
                        </a>
                      )}
                      <a
                        href={`/verifikasi-dokumen?code=${encodeURIComponent(doc.kodeVerifikasi || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '6px 8px',
                          backgroundColor: 'var(--color-state-success-subtle)',
                          color: 'var(--color-state-success-text)',
                          borderRadius: 'var(--radius-sm)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title="Buka Verifikasi Publik"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )
                }
              ]}
            />
          )}
        </Card>
      )}

      {/* ============================================================== */}
      {/* TAB 4: FORMAT & NOMOR URUT DINAS (ANTI-COLLISION ENGINE)       */}
      {/* ============================================================== */}
      {activeTab === 'counters' && (
        <Card style={{ padding: 'var(--space-6)', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
          <div style={{ paddingBottom: '16px', borderBottom: '1px solid #F1F5F9', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'var(--font-weight-bold)', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} color="#475569" />
              Pengaturan Format & Nomor Urut Dinas Institusi
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
              Konfigurasi template penomoran otomatis dan angka urut berjalan anti-bentrok berbasis SQLite.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {counters.map((c) => (
              <div
                key={c.doc_type}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Badge variant="neutral">{c.prefix}</Badge>
                    <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>
                      No. Terakhir: <strong style={{ color: '#1E293B' }}>{c.last_number}</strong>
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 'var(--font-weight-bold)', color: '#1E293B', textTransform: 'capitalize' }}>
                    {c.doc_type.replace(/_/g, ' ')}
                  </h4>
                  <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#ffffff', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0', wordBreak: 'break-all', color: '#334155' }}>
                    {c.format_template}
                  </div>
                </div>

                <div style={{ paddingTop: '8px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Update: {c.updated_at ? formatTanggal(c.updated_at) : '-'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCounter(c);
                      setConfigModalOpen(true);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #CBD5E1',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--primitive-navy-900, #182B49)',
                      cursor: 'pointer'
                    }}
                  >
                    Ubah Format / No
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '14px', backgroundColor: '#FFFBEB', borderRadius: 'var(--radius-sm)', border: '1px solid #FDE68A', fontSize: '12px', color: '#92400E', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ margin: '0 0 4px 0', fontWeight: 'var(--font-weight-bold)' }}>Ketentuan Variabel Template Penomoran FEB UTM:</p>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li><code>{'{NUM}'}</code> : Digantikan nomor urut 3 digit (contoh: 001, 142, 249).</li>
                <li><code>{'{YEAR}'}</code> : Digantikan tahun berjalan 4 digit (contoh: 2026).</li>
                <li><code>{'{ROMAN_MONTH}'}</code> : Digantikan bulan romawi (contoh: I, II, ..., X, XII).</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Modal Edit Format Counter */}
      {configModalOpen && selectedCounter && (
        <Modal
          isOpen={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
          title={`Ubah Pengaturan Counter: ${selectedCounter.doc_type}`}
        >
          <form onSubmit={handleSaveCounterConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormField label="Nomor Urut Terakhir (Last Number)">
              <Input
                type="number"
                value={selectedCounter.last_number}
                onChange={(e) =>
                  setSelectedCounter({
                    ...selectedCounter,
                    last_number: parseInt(e.target.value, 10) || 0
                  })
                }
                required
              />
              <span style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                Dokumen berikutnya akan otomatis menggunakan nomor <strong>{selectedCounter.last_number + 1}</strong>.
              </span>
            </FormField>

            <FormField label="Template Format Nomor Surat">
              <Input
                value={selectedCounter.format_template}
                onChange={(e) =>
                  setSelectedCounter({
                    ...selectedCounter,
                    format_template: e.target.value
                  })
                }
                required
              />
            </FormField>

            <div style={{ paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #F1F5F9' }}>
              <button
                type="button"
                onClick={() => setConfigModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#F1F5F9',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--primitive-navy-900, #182B49)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer'
                }}
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
