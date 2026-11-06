import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/shell';
import { notify } from '../../components/feedback';
import { formatTanggal } from '../../utils/format';
import {
  Panel,
  Button,
  IconButton,
  Badge,
  StatusBadge,
  Select,
  Modal,
  FormField,
  Input,
  Textarea
} from '../../components/ui';

import {
  BookOpen,
  FileText,
  ClipboardCheck,
  CheckCircle,
  Download,
  PlusCircle,
  Clock,
  User,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Edit3,
  AlertTriangle,
  Printer,
  Search,
  Type,
  List,
  MessageSquare,
  Award,
  Calendar,
  Building,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Sparkles,
  Columns,
  Rows,
  RefreshCw,
  Eye,
  Save,
  Check,
  FileCheck,
  Layers
} from 'lucide-react';
import { downloadUniversalDoc } from '../../utils/pdfDownloader';
import { generateThesisPdfBlobUrl, downloadLembarCatatanPengujiPdf } from '../../utils/thesisPdfGenerator';
import { NASKAH_CONTENT_MAP, PENGUJI_PROFILE_DEFAULT } from '../../data/pengujiData';

const CHAPTER_DEFINITIONS = [
  {
    id: 'bab-1',
    babKey: 'BAB I',
    label: 'BAB I — PENDAHULUAN',
    subLabel: 'Latar Belakang, Fenomena Gap, Research Gap, Rumusan Masalah, Tujuan & Manfaat',
    badge: 'Bobot 20–30%',
    placeholder: 'Tuliskan catatan evaluasi Bab I di sini... (Contoh: Hal. 4 perkuat data empiris penurunan penjualan batik; Hal. 8 tajamkan rumusan masalah ke-2)',
    quickChips: ['+ Perkuat Fenomena Gap', '+ Tajamkan Rumusan Masalah', '+ Perjelas Research Gap', '+ Sinkronkan Tujuan']
  },
  {
    id: 'bab-2',
    babKey: 'BAB II',
    label: 'BAB II — KAJIAN PUSTAKA & PENGEMBANGAN HIPOTESIS',
    subLabel: 'Grand Theory, Kajian Literatur Terdahulu, Kerangka Konseptual, Formulasi Hipotesis',
    badge: 'Landasan Teori',
    placeholder: 'Tuliskan catatan evaluasi Bab II di sini... (Contoh: Hal. 22 perjelas alur logika hipotesis H1; Hal. 35 mutakhirkan referensi jurnal 5 tahun terakhir)',
    quickChips: ['+ Mutakhirkan Rujukan Jurnal', '+ Perjelas Logika Hipotesis', '+ Kuatkan Grand Theory', '+ Rapikan Kerangka Konseptual']
  },
  {
    id: 'bab-3',
    babKey: 'BAB III',
    label: 'BAB III — METODE PENELITIAN',
    subLabel: 'Desain Riset, Populasi & Sampel, Definisi Operasional Variabel, Uji Validitas & Analisis',
    badge: 'Metodologi & Alat Uji',
    placeholder: 'Tuliskan catatan evaluasi Bab III di sini... (Contoh: Hal. 42 cantumkan rumus justifikasi ukuran sampel; Hal. 48 perinci skala Likert & uji validitas)',
    quickChips: ['+ Justifikasi Ukuran Sampel', '+ Rinci Operasionalisasi Variabel', '+ Perjelas Outer Model PLS', '+ Lengkapi Uji Validitas']
  },
  {
    id: 'bab-4',
    babKey: 'BAB IV',
    label: 'BAB IV — HASIL PENELITIAN DAN PEMBAHASAN',
    subLabel: 'Analisis Olah Data (SmartPLS/SPSS), Pengujian Hipotesis, Pembahasan Temuan',
    badge: 'Bobot 35%',
    placeholder: 'Tuliskan catatan evaluasi Bab IV di sini... (Contoh: Hal. 85 bandingkan temuan dengan riset internasional; Hal. 94 perjelas efek mediasi parsial)',
    quickChips: ['+ Bandingkan dgn Riset Terdahulu', '+ Perjelas Efek Mediasi Bootstrapping', '+ Rapikan Tabel Output Statistik', '+ Perdalam Pembahasan Temuan']
  },
  {
    id: 'bab-5',
    babKey: 'BAB V',
    label: 'BAB V — KESIMPULAN DAN SARAN',
    subLabel: 'Kesimpulan Menjawab Masalah, Keterbatasan Riset, Implikasi Teoretis & Manajerial',
    badge: 'Rekomendasi',
    placeholder: 'Tuliskan catatan evaluasi Bab V di sini... (Contoh: Hal. 112 saran manajerial untuk UMKM batik perlu dibuat lebih operasional dan terukur)',
    quickChips: ['+ Tajamkan Saran Manajerial UMKM', '+ Rinci Keterbatasan Penelitian', '+ Sinkronkan dgn Rumusan Masalah', '+ Beri Rekomendasi Kebijakan']
  },
  {
    id: 'bab-umum',
    babKey: 'UMUM & FORMAT',
    label: 'CATATAN UMUM, TATA TULIS & DAFTAR PUSTAKA',
    subLabel: 'Format Margin 4-4-3-3 Pedoman FEB UTM 2026, Gaya Sitasi APA 7th, Kerapian Lampiran',
    badge: 'Format & Turnitin',
    placeholder: 'Tuliskan koreksi tata tulis di sini... (Contoh: Periksa format margin 4-4-3-3 pada bab 2, serta konsistensi sitasi APA 7th pada daftar pustaka)',
    quickChips: ['+ Kepatuhan Margin 4-4-3-3', '+ Format Daftar Pustaka APA 7th', '+ Lampirkan Output Olah Data', '+ Periksa Typo & EBI Baku']
  }
];

const INITIAL_NOTES_BY_UJIAN = {
  'uj-pgj-1': {
    'bab-1': { status: 'minor', halaman: 'Hal. 2-5', catatan: 'Perkuat fenomena gap dengan data statistik penurunan transaksi batik di pasar fisik vs lonjakan live streaming TikTok Shop.' },
    'bab-2': { status: 'sesuai', halaman: '', catatan: '' },
    'bab-3': { status: 'minor', halaman: 'Hal. 41', catatan: 'Perjelas kriteria purposive sampling dan justifikasi pemilihan 120 responden konsumen TikTok Shop.' },
    'bab-4': { status: 'sesuai', halaman: '', catatan: '' },
    'bab-5': { status: 'sesuai', halaman: '', catatan: '' },
    'bab-umum': { status: 'minor', halaman: 'Daftar Pustaka', catatan: 'Periksa kembali konsistensi penulisan referensi sesuai format APA 7th Edition.' }
  },
  'uj-pgj-2': {
    'bab-1': { status: 'sesuai', halaman: '', catatan: '' },
    'bab-2': { status: 'minor', halaman: 'Hal. 28', catatan: 'Perdalam kajian evolusi gaya kepemimpinan transformasional dalam perbankan syariah.' },
    'bab-3': { status: 'sesuai', halaman: '', catatan: '' },
    'bab-4': { status: 'mayor', halaman: 'Hal. 92', catatan: 'Perkuat argumentasi teoritis mengapa efek mediasi komitmen afektif bersifat parsial bukan penuh.' },
    'bab-5': { status: 'sesuai', halaman: '', catatan: '' },
    'bab-umum': { status: 'sesuai', halaman: '', catatan: '' }
  }
};

/**
 * HALAMAN: PENELAAHAN NASKAH UJIAN DEWAN PENGUJI (FASE G)
 * Antarmuka membaca naskah digital berstandar jurnal ilmiah dan buku pedoman FEB UTM 2026:
 * - Pembaca Naskah PDF Otentik langsung di peramban (Full Document Viewer)
 * - Lembar Catatan Telaah Terstruktur per Bab (Bab I s/d Bab V + Format & Umum)
 * - Multi-Tab: Dokumen PDF & Catatan Bab, Verifikasi Turnitin & AI, Rekap Catatan Koreksi, dan Info Sidang
 * - Sinkronisasi otomatis ke Berita Acara Ujian & Form Penilaian
 */
export default function NaskahPage({
  ujianList = [],
  selectedUjianId,
  onSelectUjian,
  onNavigate,
  onAddKoreksi
}) {
  // Pilih ujian aktif (default ke yang dipilih atau ujian pertama)
  const currentUjianId = selectedUjianId || (ujianList[0] ? ujianList[0].id : null);
  const activeUjian = ujianList.find(u => u.id === currentUjianId) || ujianList[0];

  const naskahData = activeUjian ? NASKAH_CONTENT_MAP[activeUjian.id] : null;

  // State Halaman
  const [activeTab, setActiveTab] = useState('reader'); // 'reader' | 'turnitin' | 'koreksi' | 'sidang'
  const [activeBabIndex, setActiveBabIndex] = useState(0);
  const [viewLayout, setViewLayout] = useState('stacked'); // 'stacked' | 'split'
  const [pdfSource, setPdfSource] = useState('generated'); // 'generated' | 'sample'
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(true);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Catatan Terstruktur per Bab untuk Seluruh Ujian
  const [ujianBabNotes, setUjianBabNotes] = useState(INITIAL_NOTES_BY_UJIAN);

  // Modal Tambah Koreksi (Opsional)
  const [modalKoreksiOpen, setModalKoreksiOpen] = useState(false);
  const [targetBabKoreksi, setTargetBabKoreksi] = useState('');
  const [halamanKoreksi, setHalamanKoreksi] = useState('');
  const [isiKoreksi, setIsiKoreksi] = useState('');
  const [kategoriKoreksi, setKategoriKoreksi] = useState('Substansi / Metodologi');
  const [urgensiKoreksi, setUrgensiKoreksi] = useState('Wajib Diperbaiki (Mandatory)');

  // Local Catatan Koreksi untuk Live Feedback di Reader
  const [localKoreksiList, setLocalKoreksiList] = useState([
    {
      id: 'kor-init-1',
      ujianId: activeUjian?.id,
      bab: 'BAB I — PENDAHULUAN',
      subTitle: '1.1 Latar Belakang Masalah',
      halaman: 'Halaman 2',
      kategori: 'Substansi / Metodologi',
      urgensi: 'Wajib Diperbaiki (Mandatory)',
      catatanKoreksi: 'Perkuat fenomena gap dengan data statistik penurunan transaksi batik di pasar fisik vs lonjakan live streaming TikTok Shop.',
      tanggal: '12 Oktober 2026'
    }
  ]);

  // Efek Generator PDF Otentik saat Berkas Mahasiswa Berganti
  useEffect(() => {
    let isCancelled = false;
    let createdUrl = null;

    async function loadPdf() {
      setIsGeneratingPdf(true);
      try {
        const url = await generateThesisPdfBlobUrl(activeUjian, naskahData);
        if (!isCancelled) {
          createdUrl = url;
          setPdfBlobUrl(url);
          setIsGeneratingPdf(false);
        }
      } catch (err) {
        console.error('Gagal generate naskah PDF:', err);
        if (!isCancelled) {
          setPdfBlobUrl('/sample-documents/Proposal_Disertasi_Linda_v2.1.pdf');
          setIsGeneratingPdf(false);
        }
      }
    }

    if (activeUjian) {
      loadPdf();
    }

    return () => {
      isCancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [activeUjian?.id]);

  if (!activeUjian) {
    return (
      <div>
        <PageHeader
          breadcrumbs={[
            { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
            { label: 'Dewan Penguji' },
            { label: 'Naskah Ujian' }
          ]}
          title="Penelaahan Naskah Ujian"
        />
        <Panel>
          <p>Belum ada ujian yang ditugaskan kepada Anda.</p>
        </Panel>
      </div>
    );
  }

  const activeBab = naskahData?.babList ? naskahData.babList[activeBabIndex] : null;

  // Filter Koreksi Mahasiswa Aktif
  const activeStudentKoreksi = localKoreksiList.filter(k => k.ujianId === activeUjian.id);

  const handleOpenModalKoreksi = (babTitle = '', subTitle = '') => {
    const babName = babTitle || (activeBab ? activeBab.title : 'BAB I');
    setTargetBabKoreksi(subTitle ? `${babName} (${subTitle})` : babName);
    setHalamanKoreksi(activeBab?.halaman?.split(' ')[1] || 'Halaman Relevan');
    setModalKoreksiOpen(true);
  };

  const handleSimpanKoreksi = (e) => {
    e.preventDefault();
    if (!isiKoreksi.trim()) return;

    const newKoreksiObj = {
      id: `kor-${Date.now()}`,
      ujianId: activeUjian.id,
      mhsId: activeUjian.mhsId,
      namaMahasiswa: activeUjian.namaMahasiswa,
      nim: activeUjian.nim,
      jenjang: activeUjian.jenjang,
      jenisUjian: activeUjian.jenisUjian,
      kategori: kategoriKoreksi,
      urgensi: urgensiKoreksi,
      bab: targetBabKoreksi,
      halaman: halamanKoreksi || 'Halaman Relevan',
      catatanKoreksi: isiKoreksi,
      tanggapanMahasiswa: null,
      statusVerifikasi: 'Belum Ditanggapi Mahasiswa',
      fileBuktiRevisi: null,
      tanggal: formatTanggal(new Date())
    };

    if (onAddKoreksi) {
      onAddKoreksi(newKoreksiObj);
    }

    setLocalKoreksiList([newKoreksiObj, ...localKoreksiList]);
    setIsiKoreksi('');
    setHalamanKoreksi('');
    setModalKoreksiOpen(false);
    notify('Catatan koreksi penguji berhasil dicatat ke dalam lembar evaluasi resmi sidang.', { variant: 'success' });
  };

  const currentNotes = ujianBabNotes[activeUjian?.id] || {};
  const activePdfUrl = pdfSource === 'sample' 
    ? '/sample-documents/Proposal_Disertasi_Linda_v2.1.pdf' 
    : (pdfBlobUrl || '/sample-documents/Proposal_Disertasi_Linda_v2.1.pdf');

  const handleNoteChange = (chapterId, field, value) => {
    setUjianBabNotes(prev => {
      const uNotes = prev[activeUjian.id] || {};
      const cNote = uNotes[chapterId] || { status: 'sesuai', halaman: '', catatan: '' };
      return {
        ...prev,
        [activeUjian.id]: {
          ...uNotes,
          [chapterId]: {
            ...cNote,
            [field]: value
          }
        }
      };
    });
  };

  const handleAddChip = (chapterId, chipText) => {
    const cleanChip = chipText.replace(/^\+\s*/, '');
    const cNote = currentNotes[chapterId] || { status: 'minor', halaman: '', catatan: '' };
    const existing = cNote.catatan ? cNote.catatan.trim() : '';
    const newCatatan = existing ? `${existing}. ${cleanChip}` : cleanChip;
    handleNoteChange(chapterId, 'catatan', newCatatan);
    if (cNote.status === 'sesuai') {
      handleNoteChange(chapterId, 'status', 'minor');
    }
  };

  const handleSaveAllNotes = () => {
    const uNotes = ujianBabNotes[activeUjian.id] || {};
    const newKoreksiItems = [];

    CHAPTER_DEFINITIONS.forEach(def => {
      const noteItem = uNotes[def.id];
      if (noteItem && (noteItem.catatan?.trim() || noteItem.status !== 'sesuai')) {
        const itemObj = {
          id: `kor-${activeUjian.id}-${def.id}`,
          ujianId: activeUjian.id,
          mhsId: activeUjian.mhsId,
          namaMahasiswa: activeUjian.namaMahasiswa,
          nim: activeUjian.nim,
          jenjang: activeUjian.jenjang,
          jenisUjian: activeUjian.jenisUjian,
          kategori: def.badge,
          urgensi: noteItem.status === 'mayor' ? 'Wajib Diperbaiki (Mandatory)' : 'Saran / Rekomendasi (Minor)',
          bab: def.label,
          halaman: noteItem.halaman || 'Halaman Relevan',
          catatanKoreksi: noteItem.catatan || `Terdapat catatan telaah pada ${def.label}`,
          statusVerifikasi: 'Belum Ditanggapi Mahasiswa',
          tanggal: formatTanggal(new Date())
        };
        newKoreksiItems.push(itemObj);
        if (onAddKoreksi) {
          onAddKoreksi(itemObj);
        }
      }
    });

    setLocalKoreksiList(prev => {
      const filtered = prev.filter(k => k.ujianId !== activeUjian.id);
      return [...newKoreksiItems, ...filtered];
    });

    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2500);
    notify(`Catatan telaah seluruh bab naskah ${activeUjian.namaMahasiswa} berhasil disimpan & disinkronkan ke Rekap Revisi!`, { variant: 'success' });
  };

  const handleExportReviewSheet = async () => {
    try {
      await downloadLembarCatatanPengujiPdf(activeUjian, currentNotes, PENGUJI_PROFILE_DEFAULT);
      notify('Lembar Berita Acara Catatan Penguji berhasil diunduh sebagai PDF resmi.', { variant: 'success' });
    } catch (err) {
      console.error(err);
      notify('Gagal mengunduh lembar catatan penguji.', { variant: 'error' });
    }
  };

  return (
    <div>
      {/* 1. Header Resmi Penelaahan Naskah Ujian */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Daftar Sidang', onClick: () => onNavigate('daftar-ujian') },
          { label: 'Penelaahan Naskah' }
        ]}
        title={`Penelaahan Naskah: ${activeUjian?.namaMahasiswa || 'Mahasiswa'}`}
        description={`${activeUjian?.jenisUjian} — ${activeUjian?.programStudi} (${activeUjian?.jenjang}) | Peran Penguji: ${activeUjian?.peranPenguji}`}
        statusBadge={<Badge variant={(activeUjian?.jenjang || 'S1') === 'S3' ? 'gold' : (activeUjian?.jenjang || 'S1') === 'S2' ? 'purple' : 'navy'}>Jenjang {activeUjian?.jenjang || 'S1'}</Badge>}
        primaryAction={
          <Button
            variant="primary"
            icon={ClipboardCheck}
            onClick={() => onNavigate('penilaian')}
          >
            Form Penilaian Sidang
          </Button>
        }
        secondaryAction={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              icon={Edit3}
              onClick={() => handleOpenModalKoreksi(activeBab?.title)}
            >
              Tulis Catatan Koreksi
            </Button>
            <Button
              variant="secondary"
              icon={Download}
              onClick={() => downloadUniversalDoc({ namaDokumen: activeUjian.fileNaskah || 'Naskah_Lengkap.pdf', jenis: 'Draf Naskah Tugas Akhir' }, { nama: activeUjian.mahasiswa, nim: activeUjian.nim })}
            >
              Unduh PDF ({activeUjian.ukuranNaskah})
            </Button>
          </div>
        }
      />

      {/* 2. Dossier Bar & Selector Berkas Mahasiswa */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <BookOpen size={18} style={{ color: 'var(--color-brand-primary)' }} />
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
              Pilih Berkas Ujian Mahasiswa:
            </span>
          </div>

          <div style={{ minWidth: '340px' }}>
            <select
              value={activeUjian.id}
              onChange={(e) => {
                if (onSelectUjian) onSelectUjian(e.target.value);
                setActiveBabIndex(0);
              }}
              style={{
                width: '100%',
                padding: '6px 12px',
                fontSize: '12.5px',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: '#F8FAFC',
                color: 'var(--primitive-navy-950)',
                fontWeight: '600'
              }}
            >
              {ujianList.map((u) => (
                <option key={u.id} value={u.id}>
                  [{u.jenjang}] {u.namaMahasiswa} ({u.nim}) — {u.jenisUjian}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Badges: Turnitin, Ruang, Waktu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#F0FDF4', padding: '4px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid #DCFCE7' }}>
            <ShieldCheck size={14} style={{ color: '#16A34A' }} />
            <span style={{ fontSize: '11.5px', color: '#166534', fontWeight: 'bold' }}>
              Turnitin: {activeUjian.turnitinSim}% (Lolos)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#EFF6FF', padding: '4px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid #DBEAFE' }}>
            <Building size={14} style={{ color: '#2563EB' }} />
            <span style={{ fontSize: '11.5px', color: '#1E3A8A' }}>
              {activeUjian.ruang}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#FEF3C7', padding: '4px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid #FDE68A' }}>
            <Calendar size={14} style={{ color: '#D97706' }} />
            <span style={{ fontSize: '11.5px', color: '#92400E', fontWeight: '500' }}>
              {activeUjian.jadwal} ({activeUjian.waktu})
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs Penelaahan Naskah */}
      <div 
        style={{ 
          display: 'flex', 
          gap: 'var(--space-2)', 
          borderBottom: '2px solid var(--color-border-subtle)', 
          marginBottom: 'var(--space-4)',
          backgroundColor: '#FFFFFF',
          padding: '0 var(--space-4)',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        {[
          { id: 'reader', label: '1. Pembaca Naskah Digital', icon: BookOpen, count: null },
          { id: 'turnitin', label: '2. Verifikasi Turnitin & AI', icon: ShieldCheck, count: `${activeUjian.turnitinSim}%` },
          { id: 'koreksi', label: '3. Rekap Catatan Koreksi', icon: Edit3, count: activeStudentKoreksi.length },
          { id: 'sidang', label: '4. Informasi Dewan & Sidang', icon: Award, count: null }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const IconCmp = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 14px',
                fontSize: '13px',
                fontWeight: isActive ? 'bold' : '500',
                color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                borderBottom: isActive ? '3px solid var(--color-brand-primary)' : '3px solid transparent',
                marginBottom: '-2px',
                backgroundColor: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <IconCmp size={15} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span 
                  style={{ 
                    fontSize: '11px', 
                    padding: '1px 6px', 
                    borderRadius: 'var(--radius-md)', 
                    backgroundColor: isActive ? 'var(--primitive-navy-100)' : '#F3F4F6',
                    color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                    fontWeight: 'bold'
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: PEMBACA NASKAH DIGITAL (ACADEMIC E-READER) - PDF LENGKAP & CATATAN PER BAB
          ========================================================================= */}
      {activeTab === 'reader' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          
          {/* Header Toolbar Pembaca PDF & Preferensi Layout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              padding: '10px 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xs)',
              flexWrap: 'wrap'
            }}
          >
            {/* Info Berkas Naskah Mahasiswa */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileText size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
                    {activeUjian.fileNaskah || 'Naskah_Lengkap.pdf'}
                  </span>
                  <Badge variant="navy">PDF Dokumen Asli</Badge>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    ({activeUjian.ukuranNaskah || '2.1 MB'})
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Penyusun: <strong>{activeUjian.namaMahasiswa}</strong> ({activeUjian.nim}) • {activeUjian.programStudi} ({activeUjian.jenjang})
                </div>
              </div>
            </div>

            {/* Kontrol Mode Tata Letak & Aksi Berkas */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              
              {/* Toggle Sumber Dokumen */}
              <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                <button
                  type="button"
                  onClick={() => setPdfSource('generated')}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11.5px',
                    fontWeight: pdfSource === 'generated' ? 'bold' : '500',
                    color: pdfSource === 'generated' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: pdfSource === 'generated' ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    boxShadow: pdfSource === 'generated' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                  }}
                  title="Tampilkan naskah utuh berstandar Buku Pedoman FEB UTM 2026"
                >
                  Draf Lengkap UTM 2026
                </button>
                <button
                  type="button"
                  onClick={() => setPdfSource('sample')}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11.5px',
                    fontWeight: pdfSource === 'sample' ? 'bold' : '500',
                    color: pdfSource === 'sample' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: pdfSource === 'sample' ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    boxShadow: pdfSource === 'sample' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                  }}
                  title="Tampilkan berkas salinan naskah terlampir"
                >
                  Salinan Naskah Upload
                </button>
              </div>

              {/* Toggle Mode Tata Letak (Bertumpuk vs Berdampingan) */}
              <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                <button
                  type="button"
                  onClick={() => setViewLayout('stacked')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    fontSize: '11.5px',
                    fontWeight: viewLayout === 'stacked' ? 'bold' : '500',
                    color: viewLayout === 'stacked' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: viewLayout === 'stacked' ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    boxShadow: viewLayout === 'stacked' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                  }}
                  title="Mode Bertumpuk: PDF di Atas, Catatan di Bawah"
                >
                  <Rows size={13} />
                  <span>Bertumpuk</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('split')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    fontSize: '11.5px',
                    fontWeight: viewLayout === 'split' ? 'bold' : '500',
                    color: viewLayout === 'split' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: viewLayout === 'split' ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    boxShadow: viewLayout === 'split' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                  }}
                  title="Mode Berdampingan: PDF di Kiri, Catatan di Kanan"
                >
                  <Columns size={13} />
                  <span>Split View</span>
                </button>
              </div>

              {/* Buka Tab Baru & Unduh */}
              <Button
                variant="secondary"
                size="sm"
                icon={ExternalLink}
                onClick={() => window.open(activePdfUrl, '_blank')}
                title="Buka PDF di Tab Baru Browser"
              >
                Tab Baru
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={() => downloadUniversalDoc({ namaDokumen: activeUjian.fileNaskah || 'Naskah_Lengkap.pdf', jenis: 'Draf Naskah Tugas Akhir' }, { nama: activeUjian.namaMahasiswa, nim: activeUjian.nim })}
              >
                Unduh PDF
              </Button>

            </div>
          </div>

          {/* Konten Utama: Tergantung Layout (Stacked vs Split View) */}
          {viewLayout === 'split' ? (
            /* ========================================================
               MODE BERDAMPINGAN (SPLIT VIEW): Kiri PDF (55%), Kanan Catatan (45%)
               ======================================================== */
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: 'var(--space-4)', alignItems: 'start' }}>
              
              {/* Kolom Kiri: PDF Viewer */}
              <div
                style={{
                  height: '820px',
                  backgroundColor: '#334155',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {isGeneratingPdf ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', gap: '10px' }}>
                    <RefreshCw size={28} className="animate-spin" />
                    <span style={{ fontSize: '13px' }}>Menyiapkan Naskah PDF Otentik...</span>
                  </div>
                ) : (
                  <object
                    data={activePdfUrl}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    style={{ border: 'none', display: 'block' }}
                  >
                    <iframe
                      src={activePdfUrl}
                      title={`Naskah Tugas Akhir - ${activeUjian.namaMahasiswa}`}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </object>
                )}
              </div>

              {/* Kolom Kanan: Catatan Telaah Per Bab (Scrollable) */}
              <div
                style={{
                  height: '820px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  paddingRight: '4px'
                }}
              >
                {/* Panel Catatan Telaah per Bab */}
                <Panel
                  title="Lembar Catatan Telaah Per Bab"
                  subtitle="Tulis catatan evaluasi penguji untuk tiap bab. Tersinkronisasi ke Berita Acara & Rekap Revisi."
                  icon={Edit3}
                  actions={
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Printer}
                        onClick={handleExportReviewSheet}
                        title="Ekspor Lembar Catatan Penguji sebagai PDF"
                      >
                        PDF
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={isSavedFeedback ? Check : Save}
                        onClick={handleSaveAllNotes}
                      >
                        {isSavedFeedback ? 'Tersimpan!' : 'Simpan'}
                      </Button>
                    </div>
                  }
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    
                    {/* Ringkasan Evaluasi */}
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px'
                      }}
                    >
                      <span>Evaluasi Penguji:</span>
                      <Badge variant="navy">
                        {CHAPTER_DEFINITIONS.filter(d => (currentNotes[d.id]?.catatan?.trim() || currentNotes[d.id]?.status !== 'sesuai')).length} Bab Memiliki Catatan
                      </Badge>
                    </div>

                    {/* Form Catatan per Bab */}
                    {CHAPTER_DEFINITIONS.map((def) => {
                      const noteData = currentNotes[def.id] || { status: 'sesuai', halaman: '', catatan: '' };
                      const currentStatus = noteData.status || 'sesuai';
                      const borderLeftColor = currentStatus === 'mayor' 
                        ? '#DC2626' 
                        : currentStatus === 'minor' 
                        ? '#D97706' 
                        : '#16A34A';

                      return (
                        <div
                          key={def.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid var(--color-border-subtle)',
                            borderLeft: `4px solid ${borderLeftColor}`,
                            borderRadius: 'var(--radius-sm)',
                            padding: '12px 14px',
                            boxShadow: 'var(--shadow-xs)'
                          }}
                        >
                          {/* Judul Bab & Status Buttons */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                            <div>
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
                                {def.label}
                              </span>
                              <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                                {def.subLabel}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '4px' }}>
                              {[
                                { key: 'sesuai', label: '✓ Sesuai', activeBg: '#DCFCE7', activeColor: '#15803D', activeBorder: '#86EFAC' },
                                { key: 'minor', label: '⚠ Minor', activeBg: '#FEF3C7', activeColor: '#B45309', activeBorder: '#FCD34D' },
                                { key: 'mayor', label: '⛔ Mayor', activeBg: '#FEE2E2', activeColor: '#B91C1C', activeBorder: '#FCA5A5' }
                              ].map((st) => {
                                const isSelected = currentStatus === st.key;
                                return (
                                  <button
                                    key={st.key}
                                    type="button"
                                    onClick={() => handleNoteChange(def.id, 'status', st.key)}
                                    style={{
                                      padding: '3px 8px',
                                      fontSize: '10.5px',
                                      fontWeight: isSelected ? 'bold' : '500',
                                      borderRadius: 'var(--radius-xs)',
                                      border: '1px solid',
                                      borderColor: isSelected ? st.activeBorder : 'var(--color-border-subtle)',
                                      backgroundColor: isSelected ? st.activeBg : '#FFFFFF',
                                      color: isSelected ? st.activeColor : 'var(--color-text-secondary)',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {st.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Input Halaman & Catatan */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', minWidth: '70px' }}>
                                Halaman:
                              </span>
                              <input
                                type="text"
                                value={noteData.halaman || ''}
                                onChange={(e) => handleNoteChange(def.id, 'halaman', e.target.value)}
                                placeholder="Contoh: Hal. 12-15"
                                style={{
                                  flex: 1,
                                  padding: '4px 8px',
                                  fontSize: '11.5px',
                                  borderRadius: 'var(--radius-xs)',
                                  border: '1px solid var(--color-border-default)',
                                  backgroundColor: '#F8FAFC'
                                }}
                              />
                            </div>

                            <textarea
                              rows={2}
                              value={noteData.catatan || ''}
                              onChange={(e) => handleNoteChange(def.id, 'catatan', e.target.value)}
                              placeholder={def.placeholder}
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                fontSize: '12px',
                                lineHeight: 1.4,
                                borderRadius: 'var(--radius-xs)',
                                border: '1px solid',
                                borderColor: currentStatus === 'mayor' ? '#FCA5A5' : currentStatus === 'minor' ? '#FCD34D' : 'var(--color-border-default)',
                                backgroundColor: currentStatus === 'mayor' ? '#FFF5F5' : currentStatus === 'minor' ? '#FFFDF5' : '#FFFFFF',
                                resize: 'vertical'
                              }}
                            />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Saran Cepat:</span>
                              {def.quickChips.map((chip, cIdx) => (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={() => handleAddChip(def.id, chip)}
                                  style={{
                                    fontSize: '10px',
                                    padding: '1px 6px',
                                    backgroundColor: '#F1F5F9',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 'var(--radius-xs)',
                                    color: 'var(--color-brand-primary)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {chip}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Footer Tombol Simpan */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={isSavedFeedback ? Check : Save}
                        onClick={handleSaveAllNotes}
                        style={{ width: '100%' }}
                      >
                        {isSavedFeedback ? 'Berhasil Disimpan & Disinkronkan!' : 'Simpan Seluruh Catatan Bab'}
                      </Button>
                    </div>

                  </div>
                </Panel>
              </div>

            </div>
          ) : (
            /* ========================================================
               MODE BERTUMPUK (STACKED): Atas PDF Viewer, Bawah Catatan Per Bab
               ======================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              {/* PDF Viewer Utama */}
              <div
                style={{
                  height: '700px',
                  backgroundColor: '#334155',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {isGeneratingPdf ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', gap: '10px' }}>
                    <RefreshCw size={28} className="animate-spin" />
                    <span style={{ fontSize: '13px' }}>Menyiapkan Naskah PDF Otentik...</span>
                  </div>
                ) : (
                  <object
                    data={activePdfUrl}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    style={{ border: 'none', display: 'block' }}
                  >
                    <iframe
                      src={activePdfUrl}
                      title={`Naskah Tugas Akhir - ${activeUjian.namaMahasiswa}`}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </object>
                )}
              </div>

              {/* Panel Catatan Telaah Per Bab Tepat di Bawah PDF */}
              <Panel
                title="Lembar Catatan Telaah & Revisi Per Bab (Dewan Penguji)"
                subtitle="Catatan evaluasi penguji berdasarkan Buku Pedoman FEB UTM 2026. Seluruh catatan tersimpan otomatis dan disinkronkan ke Berita Acara Ujian serta Rekap Revisi Mahasiswa."
                icon={Edit3}
                actions={
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Printer}
                      onClick={handleExportReviewSheet}
                    >
                      Ekspor Lembar Revisi (PDF)
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={isSavedFeedback ? Check : Save}
                      onClick={handleSaveAllNotes}
                    >
                      {isSavedFeedback ? 'Tersimpan!' : 'Simpan Seluruh Catatan Bab'}
                    </Button>
                  </div>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  
                  {/* Status Bar Ringkasan Catatan */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
                        Status Ringkasan Telaah:
                      </span>
                      {(() => {
                        const catCount = CHAPTER_DEFINITIONS.filter(def => {
                          const item = currentNotes[def.id];
                          return item && (item.catatan?.trim() || item.status !== 'sesuai');
                        }).length;
                        const mayCount = CHAPTER_DEFINITIONS.filter(def => {
                          const item = currentNotes[def.id];
                          return item && item.status === 'mayor';
                        }).length;

                        return (
                          <>
                            <Badge variant={catCount > 0 ? (mayCount > 0 ? 'red' : 'warning') : 'green'}>
                              {catCount > 0 ? `${catCount} Bab Memerlukan Perbaikan` : 'Seluruh Bab Sesuai / Lolos Standar'}
                            </Badge>
                            {mayCount > 0 && (
                              <span style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 'bold' }}>
                                ({mayCount} Bab Revisi Mayor)
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Tandai status: <strong>[✓ Sesuai (Lolos)]</strong>, <strong>[⚠ Revisi Minor]</strong>, atau <strong>[⛔ Revisi Mayor]</strong> pada tiap kartu bab di bawah ini.
                    </div>
                  </div>

                  {/* List Kartu Catatan Tiap Bab */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-3)' }}>
                    {CHAPTER_DEFINITIONS.map((def) => {
                      const noteData = currentNotes[def.id] || { status: 'sesuai', halaman: '', catatan: '' };
                      const currentStatus = noteData.status || 'sesuai';
                      
                      const borderLeftColor = currentStatus === 'mayor' 
                        ? '#DC2626' 
                        : currentStatus === 'minor' 
                        ? '#D97706' 
                        : '#16A34A';

                      return (
                        <div
                          key={def.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid var(--color-border-subtle)',
                            borderLeft: `4px solid ${borderLeftColor}`,
                            borderRadius: 'var(--radius-sm)',
                            padding: '14px 16px',
                            boxShadow: 'var(--shadow-xs)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '10px'
                          }}
                        >
                          {/* Header Kartu Bab & Pilihan Status */}
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                                flexWrap: 'wrap',
                                gap: '6px'
                              }}
                            >
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
                                  {def.label}
                                </span>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                  {def.subLabel}
                                </div>
                              </div>

                              {/* Status Pill Selector */}
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {[
                                  { key: 'sesuai', label: '✓ Sesuai', activeBg: '#DCFCE7', activeColor: '#15803D', activeBorder: '#86EFAC' },
                                  { key: 'minor', label: '⚠ Minor', activeBg: '#FEF3C7', activeColor: '#B45309', activeBorder: '#FCD34D' },
                                  { key: 'mayor', label: '⛔ Mayor', activeBg: '#FEE2E2', activeColor: '#B91C1C', activeBorder: '#FCA5A5' }
                                ].map((st) => {
                                  const isSelected = currentStatus === st.key;
                                  return (
                                    <button
                                      key={st.key}
                                      type="button"
                                      onClick={() => handleNoteChange(def.id, 'status', st.key)}
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        fontWeight: isSelected ? 'bold' : '500',
                                        borderRadius: 'var(--radius-xs)',
                                        border: '1px solid',
                                        borderColor: isSelected ? st.activeBorder : 'var(--color-border-subtle)',
                                        backgroundColor: isSelected ? st.activeBg : '#FFFFFF',
                                        color: isSelected ? st.activeColor : 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.12s ease'
                                      }}
                                    >
                                      {st.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Input Halaman & Form Catatan Bab */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', fontWeight: '600', minWidth: '95px' }}>
                                  Nomor Halaman:
                                </span>
                                <input
                                  type="text"
                                  value={noteData.halaman || ''}
                                  onChange={(e) => handleNoteChange(def.id, 'halaman', e.target.value)}
                                  placeholder="Contoh: Hal. 12-15"
                                  style={{
                                    flex: 1,
                                    padding: '5px 10px',
                                    fontSize: '12px',
                                    borderRadius: 'var(--radius-xs)',
                                    border: '1px solid var(--color-border-default)',
                                    backgroundColor: '#F8FAFC',
                                    color: 'var(--primitive-navy-950)'
                                  }}
                                />
                              </div>

                              <div>
                                <textarea
                                  rows={3}
                                  value={noteData.catatan || ''}
                                  onChange={(e) => handleNoteChange(def.id, 'catatan', e.target.value)}
                                  placeholder={def.placeholder}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '12.5px',
                                    lineHeight: 1.5,
                                    borderRadius: 'var(--radius-xs)',
                                    border: '1px solid',
                                    borderColor: currentStatus === 'mayor' ? '#FCA5A5' : currentStatus === 'minor' ? '#FCD34D' : 'var(--color-border-default)',
                                    backgroundColor: currentStatus === 'mayor' ? '#FFF5F5' : currentStatus === 'minor' ? '#FFFDF5' : '#FFFFFF',
                                    color: 'var(--primitive-navy-950)',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </div>

                              {/* Quick Suggestion Chips */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                                  Saran Cepat:
                                </span>
                                {def.quickChips.map((chip, cIdx) => (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    onClick={() => handleAddChip(def.id, chip)}
                                    style={{
                                      fontSize: '10.5px',
                                      padding: '2px 8px',
                                      backgroundColor: '#F1F5F9',
                                      border: '1px solid #E2E8F0',
                                      borderRadius: 'var(--radius-xs)',
                                      color: 'var(--color-brand-primary)',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {chip}
                                  </button>
                                ))}
                              </div>

                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Aksi Lembar Catatan */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      marginTop: 'var(--space-2)',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Catatan yang disimpan di sini otomatis diteruskan ke <strong>Tab 3 (Rekap Catatan Koreksi)</strong> dan formulir revisi mahasiswa.
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Printer}
                        onClick={handleExportReviewSheet}
                      >
                        Unduh Lembar Catatan (PDF)
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={isSavedFeedback ? Check : Save}
                        onClick={handleSaveAllNotes}
                      >
                        {isSavedFeedback ? 'Berhasil Disimpan!' : 'Simpan Seluruh Catatan Bab'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={ClipboardCheck}
                        onClick={() => onNavigate('penilaian')}
                      >
                        Lanjut ke Form Nilai →
                      </Button>
                    </div>
                  </div>

                </div>
              </Panel>

            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          TAB 2: VERIFIKASI PLAGIASI TURNITIN & AI
          ========================================================================= */}
      {activeTab === 'turnitin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Panel
            title="Hasil Uji Keaslian Naskah (Turnitin & Deteksi AI)"
            subtitle="Pemeriksaan integritas akademik berpedoman pada Peraturan Rektor UTM No. 46/2025."
            icon={ShieldCheck}
          >
            <div className="grid-2col-responsive" style={{ gap: 'var(--space-4)' }}>
              
              {/* Kolom 1: Skor Utama Turnitin */}
              <div style={{ padding: 'var(--space-4)', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Indeks Kesamaan (Similarity Index):
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 'bold', color: activeUjian.turnitinSim <= 20 ? '#16A34A' : '#DC2626' }}>
                    {activeUjian.turnitinSim}%
                  </span>
                  <Badge variant={activeUjian.turnitinSim <= 20 ? 'green' : 'red'}>
                    {activeUjian.turnitinSim <= 20 ? 'Lolos Ambang Batas' : 'Melebihi Toleransi'}
                  </Badge>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Batas toleransi resmi Jurusan Manajemen: <strong>Maks. {activeUjian.jenjang === 'S1' ? '30%' : '20%'}</strong>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border-subtle)', margin: '14px 0' }} />

                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Rincian Sumber Kemiripan:
                </span>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Internet Sources:</span>
                    <strong>{Math.round(activeUjian.turnitinSim * 0.45)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Publications / Jurnal Bereputasi:</span>
                    <strong>{Math.round(activeUjian.turnitinSim * 0.35)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Student Papers (Repository Lain):</span>
                    <strong>{Math.round(activeUjian.turnitinSim * 0.20)}%</strong>
                  </div>
                </div>
              </div>

              {/* Kolom 2: Skor Deteksi AI */}
              <div style={{ padding: 'var(--space-4)', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Deteksi Artificial Intelligence (AI Score):
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 'bold', color: activeUjian.turnitinAI <= 30 ? '#2563EB' : '#DC2626' }}>
                    {activeUjian.turnitinAI}%
                  </span>
                  <Badge variant={activeUjian.turnitinAI <= 30 ? 'navy' : 'red'}>
                    Toleransi Terpenuhi
                  </Badge>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Batas maksimal indikasi AI sesuai Peraturan Rektor No. 46/2025: <strong>Maks. 30%</strong>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border-subtle)', margin: '14px 0' }} />

                <div style={{ padding: '10px 12px', backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 'var(--radius-xs)', fontSize: '12px', color: '#166534' }}>
                  <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                  <strong>Kesimpulan Dewan Penguji:</strong> Naskah tugas akhir mahasiswa telah dinyatakan memenuhi seluruh kriteria orisinalitas ilmiah dan diizinkan diujikan dalam sidang terbuka/tertutup.
                </div>
              </div>

            </div>
          </Panel>
        </div>
      )}

      {/* =========================================================================
          TAB 3: REKAP CATATAN KOREKSI PENGUJI
          ========================================================================= */}
      {activeTab === 'koreksi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Panel
            title={`Lembar Catatan Koreksi Resmi: ${activeUjian.namaMahasiswa}`}
            subtitle="Seluruh poin perbaikan yang dicatat oleh Dewan Penguji untuk dipenuhi mahasiswa selambat-lambatnya 30 hari pasca sidang."
            icon={Edit3}
            actions={
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => handleOpenModalKoreksi()}
              >
                Tambah Catatan Baru
              </Button>
            }
          >
            {activeStudentKoreksi.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Belum ada catatan koreksi yang dicatat untuk mahasiswa ini. Silakan klik tombol "Tambah Catatan Baru".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {activeStudentKoreksi.map((kor, idx) => (
                  <div
                    key={kor.id || idx}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--color-border-subtle)',
                      borderLeft: kor.urgensi?.includes('Mandatory') ? '4px solid #DC2626' : '4px solid #D97706',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
                          {kor.bab}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          ({kor.halaman || 'Halaman Relevan'})
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Badge variant="navy">{kor.kategori}</Badge>
                        <Badge variant={kor.urgensi?.includes('Mandatory') ? 'red' : 'warning'}>
                          {kor.urgensi || 'Wajib Diperbaiki'}
                        </Badge>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--primitive-navy-900)', lineHeight: 1.5, marginTop: '4px' }}>
                      {kor.catatanKoreksi}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                      Dicatat pada: {kor.tanggal} • Status: {kor.statusVerifikasi || 'Menunggu Tanggapan Mahasiswa'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* =========================================================================
          TAB 4: INFORMASI DEWAN & JADWAL SIDANG
          ========================================================================= */}
      {activeTab === 'sidang' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Panel
            title="Informasi Pelaksanaan Sidang & Tim Penguji"
            subtitle="Ketentuan pelaksanaan dan susunan dewan penguji resmi sesuai Buku Pedoman 2026 Bab VI Hal 68–75."
            icon={Award}
          >
            <div className="grid-2col-responsive" style={{ gap: 'var(--space-4)' }}>
              
              <div style={{ padding: 'var(--space-3)', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Waktu & Tempat Pelaksanaan:
                </span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '4px' }}>
                  {activeUjian.jadwal}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-brand-primary)', marginTop: '2px' }}>
                  Waktu: {activeUjian.waktu} WIB • Ruangan: {activeUjian.ruang}
                </div>
              </div>

              <div style={{ padding: 'var(--space-3)', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Penugasan Dewan Penguji Anda:
                </span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '4px' }}>
                  {activeUjian.peranPenguji}
                </div>
                <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                  Status: Terdaftar Resmi dalam Surat Keputusan Dekan FEB UTM
                </div>
              </div>

            </div>
          </Panel>
        </div>
      )}

      {/* =========================================================================
          MODAL TAMBAH CATATAN KOREKSI CEPAT
          ========================================================================= */}
      <Modal
        isOpen={modalKoreksiOpen}
        onClose={() => setModalKoreksiOpen(false)}
        title="Catat Koreksi & Arahan Perbaikan Naskah"
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={() => setModalKoreksiOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSimpanKoreksi}>
              Simpan ke Lembar Koreksi
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSimpanKoreksi} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <FormField id="koreksi-mahasiswa" label="Mahasiswa Teruji" required>
            <Input 
              value={`${activeUjian.namaMahasiswa} (${activeUjian.nim}) — ${activeUjian.jenisUjian}`} 
              readOnly 
            />
          </FormField>

          <div className="grid-2col-equal">
            <FormField id="koreksi-bab" label="Bagian / Bab Naskah" required>
              <Input
                value={targetBabKoreksi}
                onChange={(e) => setTargetBabKoreksi(e.target.value)}
                placeholder="Contoh: BAB I — PENDAHULUAN (1.1 Latar Belakang)"
              />
            </FormField>

            <FormField id="koreksi-halaman" label="Nomor Halaman / Paragraf">
              <Input
                value={halamanKoreksi}
                onChange={(e) => setHalamanKoreksi(e.target.value)}
                placeholder="Contoh: Halaman 12 paragraf 2"
              />
            </FormField>
          </div>

          <div className="grid-2col-equal">
            <FormField id="koreksi-kategori" label="Kategori Aspek Evaluasi" required>
              <select
                value={kategoriKoreksi}
                onChange={(e) => setKategoriKoreksi(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--color-surface-panel)'
                }}
              >
                <option value="Substansi / Metodologi">Substansi / Metodologi Penelitian</option>
                <option value="Kajian Teori / Novelty">Kajian Teori / Kebaruan (Novelty)</option>
                <option value="Tata Tulis & Format Ilmiah">Tata Tulis & Format Ilmiah (Pedoman 2026)</option>
                <option value="Referensi & Turnitin">Referensi & Pemeriksaan Turnitin</option>
              </select>
            </FormField>

            <FormField id="koreksi-urgensi" label="Tingkat Urgensi Koreksi" required>
              <select
                value={urgensiKoreksi}
                onChange={(e) => setUrgensiKoreksi(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--color-surface-panel)'
                }}
              >
                <option value="Wajib Diperbaiki (Mandatory)">Wajib Diperbaiki (Mandatory)</option>
                <option value="Saran / Rekomendasi (Minor)">Saran / Rekomendasi (Minor)</option>
                <option value="Pertanyaan Ujian Lisan (Oral)">Pertanyaan Ujian Lisan (Oral)</option>
              </select>
            </FormField>
          </div>

          <FormField id="koreksi-uraian" label="Uraian Catatan Koreksi & Arahan Perbaikan" required>
            <Textarea
              rows={4}
              value={isiKoreksi}
              onChange={(e) => setIsiKoreksi(e.target.value)}
              placeholder="Tuliskan catatan substantif perbaikan yang harus dipenuhi mahasiswa selama masa revisi 30 hari..."
            />
          </FormField>
        </form>
      </Modal>

    </div>
  );
}

