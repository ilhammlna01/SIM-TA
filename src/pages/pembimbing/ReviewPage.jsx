import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/shell';
import { notify } from '../../components/feedback';
import {
  Panel,
  Button,
  Badge,
  StatusBadge,
  FormField,
  Input,
  Textarea,
  Select,
  Alert
} from '../../components/ui';

import {
  BookOpen,
  FileText,
  MessageSquare,
  CheckCircle,
  Clock,
  ArrowLeft,
  Send,
  Plus,
  AlertTriangle,
  Bookmark,
  ExternalLink,
  Download
} from 'lucide-react';

import { INITIAL_REVIEW_ITEMS } from '../../data/pembimbingData';
import { akademikApi } from '../../services/api';

/**
 * HALAMAN 6: REVIEW NASKAH (FASE E)
 * Interface membaca dokumen yang serius (Manuscript Critique & Review Desk):
 * - Utamakan: naskah terstruktur, komentar substantif, status komentar, dan riwayat
 * - Bebas dari UI aplikasi chat
 */
export default function ReviewPage({
  naskah,
  onNavigate,
  onOpenApproval,
  onNaskahDecision
}) {
  // Mock Naskah default jika tidak dikirim dari luar
  const activeNaskah = naskah || {
    id: 'nsk-1',
    namaMahasiswa: 'Linda Permatasari, S.E., M.SM.',
    nim: '230231600008',
    jenjang: 'S3',
    peranDosen: 'Promotor', // Otomatis Promotor untuk S3
    judulNaskah: 'Proposal Disertasi: Bab I-III (Konstruksi Kepemimpinan Spiritual dan Budaya Kerja Madura)',
    versi: 'v2.1',
    similarity: 18,
    aiScore: 21,
    fileNaskah: 'Proposal_Disertasi_Linda_v2.1.pdf'
  };

  // PENTING (Rules of Hooks): seluruh hook wajib dipanggil tanpa syarat
  // sebelum early return apa pun, agar jumlah hook tidak berubah saat
  // `naskah` bertransisi null <-> nilai.
  const [activeBab, setActiveBab] = useState('bab1');
  const [viewMode, setViewMode] = useState('pdf'); // 'pdf' | 'text'
  const pdfPath = '/sample-documents/Proposal_Disertasi_Linda_v2.1.pdf';
  const [reviewItems, setReviewItems] = useState(INITIAL_REVIEW_ITEMS.filter(r => r.naskahId === activeNaskah.id));
  // Audit 21 Oktober 2026 (temuan AZ-A2): catatan telaah pembimbing WAJIB
  // tersimpan di basis data. Sebelumnya seluruh catatan berasal dari data
  // statis sehingga setiap catatan telaah baru hilang begitu halaman dimuat
  // ulang. Versi naskah dicari berdasarkan NIM mahasiswa, lalu catatan
  // disimpan pada tabel komentar_naskah.
  const [versiNaskahId, setVersiNaskahId] = useState(null);
  const [sinkronTersimpan, setSinkronTersimpan] = useState(false);
  const [catatanTersimpan, setCatatanTersimpan] = useState(false);

  // ------------------------------------------------------------------
  // KEPUTUSAN ATAS NASKAH (Audit 21 Oktober 2026 — BP-2)
  //
  // Sebelum ini, "Persetujuan" pada antarmuka sebenarnya menyetujui TAHAP,
  // bukan naskahnya, sehingga naskah dapat tampil seolah sudah disetujui
  // tanpa pernah ada keputusan atas naskahnya. Kini kedua hal terpisah:
  //   - keputusan atas NASKAH : halaman ini (tombol di bawah)
  //   - keputusan atas TAHAP  : halaman "Persetujuan"
  // ------------------------------------------------------------------
  const [keputusanNaskah, setKeputusanNaskah] = useState(null);
  const [memprosesKeputusan, setMemprosesKeputusan] = useState(false);
  const [catatanKeputusan, setCatatanKeputusan] = useState('');

  const handlePutuskanNaskah = async (keputusan) => {
    const versiId = activeNaskah?.id;
    if (!versiId) {
      notify('Naskah ini belum berasal dari basis data sehingga tidak dapat diputuskan.', { variant: 'warning' });
      return;
    }
    setMemprosesKeputusan(true);
    try {
      const hasil = onNaskahDecision
        ? await onNaskahDecision(versiId, keputusan, catatanKeputusan)
        : await akademikApi.approveNaskah(versiId, {
            status: keputusan,
            catatan: catatanKeputusan || ''
          });

      if (hasil && hasil.success === false) {
        notify(hasil.message || 'Gagal menyimpan keputusan atas naskah.', { variant: 'danger' });
        return;
      }
      setKeputusanNaskah(keputusan);
      setCatatanKeputusan('');
      notify(
        hasil?.message || `Keputusan atas naskah tersimpan: ${keputusan}.`,
        { variant: keputusan === 'Disetujui' ? 'success' : 'warning' }
      );
    } catch (err) {
      notify(`Gagal menyimpan keputusan atas naskah: ${err.message}`, { variant: 'danger' });
    } finally {
      setMemprosesKeputusan(false);
    }
  };

  // Muat versi naskah & catatan telaah dari backend.
  useEffect(() => {
    let dibatalkan = false;

    (async () => {
      const nim = activeNaskah?.nim;
      if (!nim) return;
      try {
        const versi = await akademikApi.getNaskah({ nim });
        const daftar = Array.isArray(versi) ? versi : [];
        if (!daftar.length) return;
        const terbaru = daftar.reduce((a, b) => ((b.nomorVersi || 0) > (a.nomorVersi || 0) ? b : a), daftar[0]);
        if (dibatalkan) return;
        setVersiNaskahId(terbaru.id);

        const komentar = await akademikApi.getKomentarNaskah(terbaru.id);
        if (dibatalkan) return;
        const dariBackend = (Array.isArray(komentar) ? komentar : []).map((k) => ({
          id: k.id,
          naskahId: terbaru.id,
          bab: k.bagian || 'Bab',
          halaman: '-',
          kategori: '-',
          kutipanTeks: '',
          catatanDosen: k.isi || '',
          status: k.status === 'Selesai' ? 'Selesai' : 'Terbuka',
          tanggal: k.tanggalKomentar || k.tanggal_komentar || '',
          tanggapanMahasiswa: null,
          backend: true
        }));
        if (dariBackend.length) {
          setReviewItems(dariBackend);
          setSinkronTersimpan(true);
        }
      } catch (_) {
        // Backend tidak aktif -> tetap memakai data lokal.
      }
    })();

    return () => { dibatalkan = true; };
  }, [activeNaskah?.nim]);

  // Status persetujuan naskah disinkronkan dari data backend.
  useEffect(() => {
    if (activeNaskah?.statusPersetujuan) {
      setKeputusanNaskah(activeNaskah.statusPersetujuan);
    }
  }, [activeNaskah?.id, activeNaskah?.statusPersetujuan]);

  // Form Tambah Catatan Telaah
  const [newBabInput, setNewBabInput] = useState('BAB I — Pendahuluan');
  const [newHalamanInput, setNewHalamanInput] = useState('Halaman 18');
  const [newKategoriInput, setNewKategoriInput] = useState('Metodologi & Teknik Sampling');
  const [newKutipanInput, setNewKutipanInput] = useState('');
  const [newCatatanInput, setNewCatatanInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (naskah === null) {
    return (
      <div>
        <PageHeader
          breadcrumbs={[
            { label: 'SIM-TA FEB UTM', onClick: () => onNavigate && onNavigate('dashboard') },
            { label: 'Dosen Pembimbing' },
            { label: 'Review Naskah' }
          ]}
          title="Review Substantif Naskah"
          description="Pemeriksaan dan telaah bab per bab draf naskah tugas akhir mahasiswa bimbingan."
        />
        <Panel noPadding>
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#64748b' }}>
              <FileText size={26} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>
              Belum Ada Naskah Masuk untuk Ditelaah
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '460px', margin: '0 auto 20px', lineHeight: '1.55' }}>
              Saat ini belum ada draf naskah tugas akhir dari mahasiswa bimbingan Anda yang masuk ke dalam antrean telaah. Naskah yang dikirimkan mahasiswa bimbingan akan otomatis muncul di sini.
            </p>
            <Button variant="secondary" onClick={() => onNavigate && onNavigate('dashboard')}>
              Kembali ke Dashboard
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  const handleAddReview = () => {
    if (!newCatatanInput.trim()) {
      notify('Catatan substantif wajib diisi.', { variant: 'warning' });
      return;
    }

    const newItem = {
      id: `rev-item-${Date.now()}`,
      naskahId: activeNaskah.id,
      bab: newBabInput,
      halaman: newHalamanInput,
      kategori: newKategoriInput,
      kutipanTeks: newKutipanInput ? `"${newKutipanInput}"` : 'Teks bagian umum',
      catatanDosen: newCatatanInput,
      status: 'Terbuka',
      tanggal: '07 Oktober 2026',
      tanggapanMahasiswa: null
    };

    setReviewItems([newItem, ...reviewItems]);
    setNewCatatanInput('');
    setNewKutipanInput('');
    setShowAddForm(false);

    // Persistensi ke backend (tabel komentar_naskah).
    if (versiNaskahId) {
      (async () => {
        try {
          const hasil = await akademikApi.addKomentarNaskah(versiNaskahId, {
            isi: newKategoriInput && newKategoriInput !== '-'
              ? `[${newKategoriInput}] ${newCatatanInput}`
              : newCatatanInput,
            bagian: newBabInput
          });
          setCatatanTersimpan(true);
          const idBaru = hasil?.data?.id;
          if (idBaru) {
            setReviewItems(prev => prev.map((r) => (
              r.id === newItem.id ? { ...r, id: idBaru, backend: true } : r
            )));
          }
        } catch (err) {
          notify(
            `Catatan telaah tersimpan di layar namun GAGAL disimpan ke basis data: ${err.message}`,
            { variant: 'warning' }
          );
        }
      })();
    }
  };

  const handleToggleStatus = (id) => {
    let statusBaru = null;
    setReviewItems(prev => prev.map(item => {
      if (item.id === id) {
        statusBaru = item.status === 'Terbuka' ? 'Selesai' : 'Terbuka';
        return { ...item, status: statusBaru };
      }
      return item;
    }));

    // Persistensi perubahan status ke backend.
    if (versiNaskahId && statusBaru) {
      (async () => {
        try {
          await akademikApi.updateKomentarStatus(id, statusBaru);
          setCatatanTersimpan(true);
        } catch (err) {
          notify(`Status catatan telaah gagal disimpan: ${err.message}`, { variant: 'warning' });
        }
      })();
    }
  };

  return (
    <div>
      {/* Banner status persistensi (Audit 21 Oktober 2026 — AZ-A2) */}
      {catatanTersimpan && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: 'var(--radius-md)',
            color: '#065F46',
            fontSize: '12px',
            marginBottom: '16px'
          }}
        >
          Catatan telaah dan statusnya <strong>tersimpan di basis data</strong> dan tetap tersedia
          setelah halaman dimuat ulang.
        </div>
      )}

      {/* 1. Header Resmi Dokumen Review */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Daftar Naskah', onClick: () => onNavigate('naskah') },
          { label: 'Telaah Dokumen Naskah' }
        ]}
        title={`Telaah Naskah: ${activeNaskah.namaMahasiswa}`}
        description={`${activeNaskah.judulNaskah || 'Naskah Tugas Akhir'} — Versi: ${activeNaskah.versi || '-'} | Peran: ${activeNaskah.peranDosen || 'Pembimbing'}`}
        statusBadge={
          <Badge variant={String(activeNaskah.peranDosen || '').toLowerCase().includes('motor') ? 'gold' : 'navy'}>
            {activeNaskah.peranDosen || 'Pembimbing'}
          </Badge>
        }
        primaryAction={
          <Button variant="primary" icon={CheckCircle} onClick={() => onNavigate('persetujuan')}>
            Lanjut ke Persetujuan (Approval)
          </Button>
        }
        secondaryAction={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => onNavigate('naskah')}>
            Kembali ke Daftar Naskah
          </Button>
        }
      />

      {/* 2. Banner Informasi Plagiasi & Metadata Naskah */}
      <div 
        style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--primitive-neutral-50)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-4)',
          gap: 'var(--space-3)',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--font-weight-semibold)' }}>
              Uji Turnitin Similarity:
            </span>
            <div style={{ fontSize: '13px', fontWeight: 'var(--font-weight-bold)', color: '#166534' }}>
              {activeNaskah.similarity}% (Lolos Batas Maks {activeNaskah.jenjang === 'S3' || activeNaskah.jenjang === 'S2' ? '20%' : '30%'})
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--font-weight-semibold)' }}>
              Deteksi Kecerdasan Buatan (AI):
            </span>
            <div style={{ fontSize: '13px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
              {activeNaskah.aiScore}% (Batas Maks {activeNaskah.jenjang === 'S3' || activeNaskah.jenjang === 'S2' ? '30%' : '40%'})
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--font-weight-semibold)' }}>
              Status Telaah:
            </span>
            <div style={{ fontSize: '13px', fontWeight: 'var(--font-weight-bold)', color: '#B45309' }}>
              {reviewItems.filter(r => r.status === 'Terbuka').length} Catatan Substantif Terbuka
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Tutup Form Catatan' : 'Tambah Catatan Telaah'}
        </Button>
      </div>

      {/* 3. Split-Screen Document & Critique Workspace */}
      <div className="grid-2col-responsive" style={{ alignItems: 'start' }}>
        
        {/* Kolom Kiri: Document Reading Pane & PDF Viewer */}
        <Panel
          title={viewMode === 'pdf' ? "Penampil Draf Asli (PDF Reader)" : "Tampilan Naskah Terstruktur (Document Pane)"}
          subtitle={viewMode === 'pdf' ? `Menampilkan dokumen resmi ${activeNaskah.fileNaskah} via Integrated PDF Engine` : `Membaca draf ${activeNaskah.fileNaskah} per bab.`}
          icon={viewMode === 'pdf' ? FileText : BookOpen}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {/* Toggle Mode: PDF Reader vs Teks Bab */}
              <div style={{ display: 'inline-flex', padding: '2px', backgroundColor: 'var(--primitive-neutral-100)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('pdf')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    backgroundColor: viewMode === 'pdf' ? 'var(--color-brand-primary)' : 'transparent',
                    color: viewMode === 'pdf' ? '#FFFFFF' : 'var(--color-text-secondary)',
                    fontWeight: viewMode === 'pdf' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <FileText size={12} /> Mode PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('text')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    backgroundColor: viewMode === 'text' ? 'var(--color-brand-primary)' : 'transparent',
                    color: viewMode === 'text' ? '#FFFFFF' : 'var(--color-text-secondary)',
                    fontWeight: viewMode === 'text' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <BookOpen size={12} /> Teks Bab
                </button>
              </div>

              {/* Sub-actions untuk mode teks */}
              {viewMode === 'text' && (
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  {['bab1', 'bab2', 'bab3'].map((babKey) => (
                    <button
                      key={babKey}
                      type="button"
                      onClick={() => setActiveBab(babKey)}
                      style={{
                        padding: '3px 7px',
                        fontSize: '11px',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid',
                        borderColor: activeBab === babKey ? 'var(--color-brand-primary)' : 'var(--color-border-default)',
                        backgroundColor: activeBab === babKey ? 'var(--primitive-navy-100)' : 'var(--color-surface-panel)',
                        color: activeBab === babKey ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                        fontWeight: activeBab === babKey ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                        cursor: 'pointer'
                      }}
                    >
                      {babKey === 'bab1' ? 'Bab I' : babKey === 'bab2' ? 'Bab II' : 'Bab III'}
                    </button>
                  ))}
                </div>
              )}

              {/* Tombol aksi cepat PDF */}
              <a
                href={pdfPath}
                target="_blank"
                rel="noreferrer"
                title="Buka dokumen di tab baru / layar penuh"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 7px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--color-border-default)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-text-primary)',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                <ExternalLink size={12} /> Tab Baru
              </a>
              <a
                href={pdfPath}
                download={activeNaskah.fileNaskah}
                title="Unduh berkas PDF draf tugas akhir"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 7px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--primitive-green-300)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--primitive-green-700)',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                <Download size={12} /> Unduh
              </a>
            </div>
          }
        >
          {viewMode === 'pdf' ? (
            /* Mode 1: PDF Reader Terintegrasi */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  backgroundColor: 'var(--primitive-navy-50)',
                  border: '1px solid var(--primitive-navy-100)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '11.5px',
                  color: 'var(--primitive-navy-900)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--primitive-green-600)' }} />
                  <strong>Draf Naskah Terhubung:</strong> {activeNaskah.fileNaskah} (A4 Resmi FEB UTM)
                </div>
                <span style={{ color: 'var(--color-text-muted)' }}>Gunakan scroll / zoom pada panel reader untuk menelaah</span>
              </div>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '640px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border-default)',
                  backgroundColor: '#525659'
                }}
              >
                <iframe
                  src={`${pdfPath}#toolbar=1&navpanes=1&statusbar=1`}
                  title={`PDF Reader: ${activeNaskah.fileNaskah}`}
                  width="100%"
                  height="100%"
                  style={{ border: 'none', display: 'block' }}
                />
              </div>
            </div>
          ) : (
            /* Mode 2: Teks Bab Terstruktur */
            <div 
              style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid var(--color-border-subtle)', 
                borderRadius: 'var(--radius-sm)', 
                padding: 'var(--space-5)',
                minHeight: '480px',
                fontFamily: 'serif',
                lineHeight: 1.7,
                fontSize: '13.5px',
                color: '#1E293B'
              }}
            >
              {activeBab === 'bab1' && (
                <div>
                  <h4 style={{ textAlign: 'center', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
                    BAB I — PENDAHULUAN
                  </h4>
                  <p style={{ textAlign: 'justify', marginBottom: '14px' }}>
                    <strong>1.1 Latar Belakang Masalah</strong><br />
                    Tuntutan adaptasi sektor publik di era disrupsi menuntut organisasi birokrasi memiliki kelincahan strategis (organizational ambidexterity) untuk mampu menyeimbangkan eksploitasi kapabilitas yang ada dan eksplorasi peluang baru secara simultan. Namun demikian, kepemimpinan spiritual diyakini mampu meningkatkan ambidexterity tanpa memperhatikan hambatan sosiokultural lokal yang melekat erat pada aparatur sipil negara di lingkungan Pemerintah Daerah Madura.
                  </p>
                  <div style={{ padding: '8px 12px', backgroundColor: '#FEF3C7', borderLeft: 'var(--border-width-medium) solid #D97706', marginBottom: '14px', fontStyle: 'italic', fontSize: '12px' }}>
                    [Terkait Catatan Promotor: Fenomena gap keterkaitan birokrasi Madura dengan contingency perspective perlu diperkuat]
                  </div>
                  <p style={{ textAlign: 'justify', marginBottom: '14px' }}>
                    <strong>1.2 Rumusan Masalah</strong><br />
                    Berdasarkan pemaparan fenomena empiris dan kesenjangan teoretis terdahulu, maka rumusan masalah penelitian ini dirumuskan sebagai berikut: (1) Bagaimana pengaruh kepemimpinan spiritual terhadap organizational ambidexterity pada pemerintah daerah di Madura? (2) Apakah budaya kerja Madura memoderasi pengaruh kepemimpinan spiritual terhadap ambidexterity?
                  </p>
                </div>
              )}

              {activeBab === 'bab2' && (
                <div>
                  <h4 style={{ textAlign: 'center', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
                    BAB II — KAJIAN PUSTAKA & PENGEMBANGAN HIPOTESIS
                  </h4>
                  <p style={{ textAlign: 'justify', marginBottom: '14px' }}>
                    <strong>2.1 Landasan Teori (Grand Theory)</strong><br />
                    Penelitian ini mengadopsi Resource-Based View (RBV) dan Contingency Theory. Konsep organizational ambidexterity pertama kali diintroduksi oleh Duncan (1976) dan kemudian dipopulerkan oleh rujukan artikel tentang organizational ambidexterity merujuk pada Gibson & Birkinshaw (2004).
                  </p>
                  <div style={{ padding: '8px 12px', backgroundColor: '#FEF3C7', borderLeft: 'var(--border-width-medium) solid #D97706', marginBottom: '14px', fontStyle: 'italic', fontSize: '12px' }}>
                    [Terkait Catatan Promotor: Perbarui rujukan 5 tahun terakhir 2021-2026 dari jurnal bereputasi Q1/Q2]
                  </div>
                </div>
              )}

              {activeBab === 'bab3' && (
                <div>
                  <h4 style={{ textAlign: 'center', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
                    BAB III — METODE PENELITIAN
                  </h4>
                  <p style={{ textAlign: 'justify', marginBottom: '14px' }}>
                    <strong>3.3 Populasi dan Penentuan Sampel</strong><br />
                    Populasi dalam penelitian ini adalah seluruh pejabat struktural eselon III dan IV di 4 kabupaten di Pulau Madura. Dalam penarikan data awal, teknik penentuan sampel menggunakan accidental sampling sebanyak 60 pegawai.
                  </p>
                  <div style={{ padding: '8px 12px', backgroundColor: '#FEE2E2', borderLeft: 'var(--border-width-medium) solid #DC2626', marginBottom: '14px', fontStyle: 'italic', fontSize: '12px', color: '#991B1B' }}>
                    [KRITIS - Catatan Promotor: Untuk Disertasi S3 dilarang accidental sampling! Gunakan probability/purposive sampling minimal G*Power 150 sampel]
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* Keputusan atas Naskah (Audit 21 Oktober 2026 — BP-2) */}
        <Panel
          title="Keputusan atas Naskah"
          subtitle="Keputusan ini yang memenuhi butir checklist 'Naskah telah disetujui pembimbing' pada pengajuan tahap."
          icon={CheckCircle}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <StatusBadge status={keputusanNaskah || 'Belum Ditelaah'} />
              {activeNaskah?.disetujuiOleh && (
                <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                  oleh {activeNaskah.disetujuiOleh}
                  {activeNaskah.tanggalPersetujuan
                    ? ` — ${new Date(activeNaskah.tanggalPersetujuan).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
                    : ''}
                </span>
              )}
            </div>

            <Input
              value={catatanKeputusan}
              onChange={(e) => setCatatanKeputusan(e.target.value)}
              placeholder="Catatan keputusan (opsional)"
            />

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="sm"
                disabled={memprosesKeputusan}
                onClick={() => handlePutuskanNaskah('Disetujui')}
              >
                {memprosesKeputusan ? 'Menyimpan...' : 'Setujui Naskah'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={memprosesKeputusan}
                onClick={() => handlePutuskanNaskah('Perlu Revisi')}
              >
                Kembalikan untuk Revisi
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={memprosesKeputusan}
                onClick={() => handlePutuskanNaskah('Ditolak')}
              >
                Tolak Naskah
              </Button>
            </div>

            {keputusanNaskah === 'Disetujui' && (
              <div style={{ fontSize: '11.5px', color: '#166534', lineHeight: 1.5 }}>
                Naskah ini telah disetujui. Mahasiswa dapat mengajukan tahap berikutnya
                (butir checklist &quot;Naskah telah disetujui pembimbing&quot; kini terpenuhi).
              </div>
            )}
          </div>
        </Panel>

        {/* Kolom Kanan: Catatan Telaah Substantif Pembimbing */}
        <Panel
          title="Catatan Telaah Substantif Pembimbing"
          subtitle="Daftar arahan perbaikan ilmiah terstruktur per bab dan status tindak lanjut."
          icon={MessageSquare}
        >
          {/* Form Tambah Catatan */}
          {showAddForm && (
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
              <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '13px', color: 'var(--primitive-navy-950)', marginBottom: 'var(--space-2)' }}>
                Formulir Catatan Telaah Baru:
              </div>
              <div className="grid-2col-equal" style={{ marginBottom: 'var(--space-2)' }}>
                <FormField id="bab-sel" label="Bagian / Bab" required>
                  <Select
                    value={newBabInput}
                    onChange={(e) => setNewBabInput(e.target.value)}
                    options={[
                      { value: 'BAB I — Pendahuluan', label: 'Bab I — Pendahuluan' },
                      { value: 'BAB II — Kajian Pustaka', label: 'Bab II — Kajian Pustaka' },
                      { value: 'BAB III — Metode Penelitian', label: 'Bab III — Metode Penelitian' }
                    ]}
                  />
                </FormField>
                <FormField id="hal-input" label="Halaman Referensi" required>
                  <Input
                    value={newHalamanInput}
                    onChange={(e) => setNewHalamanInput(e.target.value)}
                    placeholder="Contoh: Halaman 24-26"
                  />
                </FormField>
              </div>

              <FormField id="kat-sel" label="Kategori Telaah" required>
                <Select
                  value={newKategoriInput}
                  onChange={(e) => setNewKategoriInput(e.target.value)}
                  options={[
                    { value: 'Kajian Teoretis & Fenomena Gap', label: 'Kajian Teoretis & Fenomena Gap' },
                    { value: 'State of the Art & Sintesis Rujukan', label: 'State of the Art & Sintesis Rujukan' },
                    { value: 'Metodologi & Teknik Sampling', label: 'Metodologi & Teknik Sampling' },
                    { value: 'Tata Tulis & Format Buku Pedoman', label: 'Tata Tulis & Format Buku Pedoman' }
                  ]}
                />
              </FormField>

              <FormField id="teks-kutipan" label="Kutipan Teks yang Ditelaah" optional>
                <Input
                  value={newKutipanInput}
                  onChange={(e) => setNewKutipanInput(e.target.value)}
                  placeholder="Kutipan teks atau kata kunci..."
                />
              </FormField>

              <FormField id="catatan-kritis" label="Uraian Arahan Kritis Pembimbing" required>
                <Textarea
                  value={newCatatanInput}
                  onChange={(e) => setNewCatatanInput(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan arahan perbaikan substantif..."
                />
              </FormField>

              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                <Button variant="secondary" size="sm" onClick={() => setShowAddForm(false)}>
                  Batal
                </Button>
                <Button variant="primary" size="sm" onClick={handleAddReview}>
                  Simpan Catatan Telaah
                </Button>
              </div>
            </div>
          )}

          {/* List Catatan Telaah Terstruktur */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {reviewItems.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3)',
                  backgroundColor: item.status === 'Selesai' ? 'var(--primitive-neutral-50)' : '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '12px', color: 'var(--primitive-navy-950)' }}>
                      {item.bab}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      ({item.halaman})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item.id)}
                    style={{
                      padding: '2px 6px',
                      fontSize: '11px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid',
                      borderColor: item.status === 'Selesai' ? '#166534' : '#D97706',
                      backgroundColor: item.status === 'Selesai' ? '#DCFCE7' : '#FEF3C7',
                      color: item.status === 'Selesai' ? '#166534' : '#B45309',
                      cursor: 'pointer'
                    }}
                  >
                    {item.status === 'Selesai' ? 'Selesai Ditindaklanjuti' : 'Status Terbuka'}
                  </button>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--color-brand-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                  Kategori: {item.kategori}
                </div>

                {item.kutipanTeks && (
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--primitive-neutral-50)', padding: '4px 8px', borderRadius: 'var(--radius-xs)' }}>
                    Kutipan: {item.kutipanTeks}
                  </div>
                )}

                <div style={{ fontSize: '12.5px', color: 'var(--primitive-navy-950)', lineHeight: 1.4 }}>
                  <strong>Arahan Pembimbing:</strong> {item.catatanDosen}
                </div>

                {item.tanggapanMahasiswa && (
                  <div style={{ fontSize: '11.5px', color: '#166534', backgroundColor: '#F0FDF4', padding: '6px 8px', borderRadius: 'var(--radius-xs)', marginTop: '2px' }}>
                    <strong>Respons Mahasiswa:</strong> {item.tanggapanMahasiswa}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>

      </div>
    </div>
  );
}
