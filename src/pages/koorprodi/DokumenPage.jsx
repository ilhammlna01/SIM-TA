import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/shell';
import { notify } from '../../components/feedback';
import {
  Panel,
  Button,
  IconButton,
  Table,
  Badge,
  StatusBadge,
  Search,
  Modal,
  FormField,
  Input,
  Select,
  FileUpload
} from '../../components/ui';

import {
  FolderArchive,
  Download,
  Eye,
  Plus,
  FileText,
  Search as SearchIcon,
  ShieldCheck,
  CheckCircle,
  FileCheck,
  Award,
  Calendar,
  Building,
  Printer
} from 'lucide-react';

import { INITIAL_DOKUMEN_PRODI } from '../../data/koorprodiData';
import { 
  downloadUniversalDoc, 
  downloadLembarPengesahan, 
  downloadKartuBimbingan, 
  downloadBeritaAcara, 
  downloadSKBebasPlagiasi 
} from '../../utils/pdfDownloader';

/**
 * HALAMAN: ARSIP DOKUMEN RESMI KOORPRODI (FASE F)
 * Pengelolaan Pangkalan Data Digital Dokumen Sah Program Studi:
 * - SK Dekan Penetapan Pembimbing, SK Dewan Penguji, Berita Acara Sidang, Lembar Pengesahan
 * - Dilengkapi QR-Code Otorisasi Digital Fakultas Ekonomi dan Bisnis UTM
 */
export default function DokumenPage({
  dokumenList = INITIAL_DOKUMEN_PRODI,
  onNavigate
}) {
  const [dataDokumen, setDataDokumen] = useState(dokumenList);
  const [activeKategori, setActiveKategori] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState(null);

  useEffect(() => {
    setDataDokumen(dokumenList);
  }, [dokumenList]);

  const handleDownloadDoc = async (docItem) => {
    if (!docItem) return;
    const nameLower = (docItem.namaDokumen || '').toLowerCase();
    const mockStudent = {
      nama: 'Moh. Fikri Haikal',
      nim: '210211100219',
      jenjang: 'S1',
      programStudi: 'S-1 Manajemen',
      judul: docItem.namaDokumen
    };

    if (nameLower.includes('pengesahan')) {
      await downloadLembarPengesahan(mockStudent);
    } else if (nameLower.includes('bimbingan')) {
      await downloadKartuBimbingan(mockStudent);
    } else if (nameLower.includes('plagiasi') || nameLower.includes('turnitin')) {
      await downloadSKBebasPlagiasi(mockStudent);
    } else if (nameLower.includes('berita acara')) {
      await downloadBeritaAcara(mockStudent, { noBA: docItem.kode });
    } else {
      await downloadUniversalDoc(docItem, mockStudent);
    }
  };

  // Form State Arsip Baru
  const [newDoc, setNewDoc] = useState({
    kode: '',
    namaDokumen: '',
    kategori: 'Surat Keputusan Dekan',
    pejabat: 'Dekan FEB UTM',
    ukuran: '1.5 MB'
  });

  const filteredData = dataDokumen.filter((doc) => {
    const matchKategori = activeKategori === 'Semua' || doc.kategori.toLowerCase().includes(activeKategori.toLowerCase());
    const matchSearch =
      doc.namaDokumen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.kategori.toLowerCase().includes(searchQuery.toLowerCase());
    return matchKategori && matchSearch;
  });

  // Statistik Dokumen
  const totalDokumen = dataDokumen.length;
  const skCount = dataDokumen.filter(d => d.kategori.toLowerCase().includes('surat keputusan')).length;
  const baCount = dataDokumen.filter(d => d.kategori.toLowerCase().includes('berita acara')).length;

  const handleSimpanArsip = (e) => {
    e.preventDefault();
    if (!newDoc.kode || !newDoc.namaDokumen) {
      notify('Mohon isi Nomor/Kode Surat dan Nama Dokumen Resmi.', { variant: 'warning' });
      return;
    }

    const created = {
      id: `doc-${Date.now()}`,
      kode: newDoc.kode,
      namaDokumen: newDoc.namaDokumen.endsWith('.pdf') ? newDoc.namaDokumen : `${newDoc.namaDokumen}.pdf`,
      kategori: newDoc.kategori,
      tanggal: '12 Oktober 2026',
      ukuran: newDoc.ukuran || '1.2 MB',
      status: newDoc.kategori.includes('Dekan') ? 'Disahkan Dekan' : 'Disahkan Koorprodi'
    };

    setDataDokumen([created, ...dataDokumen]);
    setIsUploadModalOpen(false);
    notify(`Dokumen resmi ${created.kode} berhasil diarsipkan ke pangkalan data digital.`, { variant: 'success' });
  };

  const columns = [
    {
      key: 'kode',
      label: 'Nomor / Kode Surat',
      width: '190px',
      render: (val) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={14} style={{ color: 'var(--color-brand-primary)' }} />
            <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)', fontSize: '12px' }}>
              {val}
            </span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Arsip Digital FEB UTM
          </div>
        </div>
      )
    },
    {
      key: 'namaDokumen',
      label: 'Nama Dokumen Resmi & Deskripsi',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)', fontSize: '12.5px' }}>
            {val}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ backgroundColor: '#F3F4F6', padding: '1px 5px', borderRadius: '3px' }}>PDF</span>
            <span>Ukuran: {row.ukuran}</span>
            <span>•</span>
            <span>Terbit: {row.tanggal}</span>
          </div>
        </div>
      )
    },
    {
      key: 'kategori',
      label: 'Kategori Dokumen',
      width: '190px',
      render: (val) => {
        const isSK = val.toLowerCase().includes('surat keputusan');
        return (
          <Badge variant={isSK ? 'navy' : 'purple'}>
            {val}
          </Badge>
        );
      }
    },
    {
      key: 'status',
      label: 'Status Otorisasi',
      width: '180px',
      render: (val) => (
        <div>
          <StatusBadge status="Disetujui" />
          <div style={{ fontSize: '11px', color: '#166534', marginTop: '3px', fontWeight: 'bold' }}>
            {val}
          </div>
        </div>
      )
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '120px',
      align: 'center',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'center' }}>
          <IconButton
            icon={Eye}
            label="Pratinjau Dokumen Digital"
            size="sm"
            bordered
            onClick={() => setSelectedPreviewDoc(row)}
          />
          <IconButton
            icon={Download}
            label="Unduh Dokumen PDF"
            size="sm"
            bordered
            onClick={() => handleDownloadDoc(row)}
          />
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Koorprodi' },
          { label: 'Pangkalan Data Arsip Dokumen' }
        ]}
        title="Pangkalan Dokumen Resmi & Berita Acara"
        description="Pangkalan data digital Surat Keputusan (SK) Dekan, Berita Acara Ujian Sidang, dan Lembar Pengesahan Naskah Tugas Akhir Jurusan Manajemen FEB UTM."
        statusBadge={<Badge variant="navy">Total: {totalDokumen} Dokumen Sah</Badge>}
        primaryAction={
          <Button variant="primary" icon={Plus} onClick={() => setIsUploadModalOpen(true)}>
            Arsipkan Dokumen Baru
          </Button>
        }
      />

      {/* 3 Stat Cards Arsip Dokumen */}
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
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Total Arsip Terdaftar</span>
            <FolderArchive size={18} style={{ color: 'var(--color-brand-primary)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '4px' }}>
            {totalDokumen}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Seluruh berkas terverifikasi e-Signature
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Surat Keputusan (SK) Dekan</span>
            <FileCheck size={18} style={{ color: '#2563EB' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1D4ED8', marginTop: '4px' }}>
            {skCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            SK Pembimbing & SK Dewan Penguji
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Berita Acara Sidang Sah</span>
            <Award size={18} style={{ color: '#7C3AED' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6D28D9', marginTop: '4px' }}>
            {baCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Sempro, Tesis, & Kelayakan Disertasi S3
          </div>
        </div>
      </div>

      {/* Banner Legitimasi Otorisasi */}
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
        <ShieldCheck size={22} style={{ color: '#1D4ED8', flexShrink: 0 }} />
        <div style={{ fontSize: '12px', color: '#1E3A8A', lineHeight: 1.5 }}>
          <strong>Otoritas & Integritas Dokumen Digital:</strong> Seluruh Surat Keputusan (SK) Dekan dan Berita Acara Ujian Tugas Akhir yang tersimpan pada arsip prodi memiliki kekuatan hukum formal dan terhubung langsung dengan SIM-Yudisium serta Pangkalan Data Pendidikan Tinggi (PDDikti).
        </div>
      </div>

      <Panel noPadding>
        {/* Toolbar Filter & Pencarian */}
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
          {/* Tabs Filter Kategori */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)' }}>
              Kategori Arsip:
            </span>
            {[
              { id: 'Semua', label: 'Semua Dokumen' },
              { id: 'Surat Keputusan', label: 'Surat Keputusan Dekan' },
              { id: 'Berita Acara', label: 'Berita Acara Sidang' }
            ].map((kat) => (
              <button
                key={kat.id}
                type="button"
                onClick={() => setActiveKategori(kat.id)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid',
                  borderColor: activeKategori === kat.id ? 'var(--color-brand-primary)' : 'var(--color-border-default)',
                  backgroundColor: activeKategori === kat.id ? 'var(--primitive-navy-100)' : 'var(--color-surface-panel)',
                  color: activeKategori === kat.id ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                  fontWeight: activeKategori === kat.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {kat.label}
              </button>
            ))}
          </div>

          <Search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor SK atau nama dokumen..."
          />
        </div>

        {/* Tabel Dokumen */}
        <Table
          density="normal"
          columns={columns}
          data={filteredData}
          striped
        />
      </Panel>

      {/* Modal Pratinjau Dokumen Digital (E-Preview) */}
      {selectedPreviewDoc && (
        <Modal
          isOpen={!!selectedPreviewDoc}
          onClose={() => setSelectedPreviewDoc(null)}
          title={`Pratinjau Resmi: ${selectedPreviewDoc.namaDokumen}`}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Kode: {selectedPreviewDoc.kode} • Ukuran: {selectedPreviewDoc.ukuran}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="secondary" onClick={() => setSelectedPreviewDoc(null)}>
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  icon={Download}
                  onClick={() => handleDownloadDoc(selectedPreviewDoc)}
                >
                  Unduh Salinan Sah (PDF)
                </Button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Kop Surat Dokumen Resmi UTM */}
            <div 
              style={{ 
                padding: 'var(--space-4)', 
                border: '2px solid var(--primitive-navy-900)', 
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#FAFAFA',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
                KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
                UNIVERSITAS TRUNOJOYO MADURA — FAKULTAS EKONOMI DAN BISNIS
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--color-brand-primary)' }}>
                JURUSAN MANAJEMEN
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Jl. Raya Telang PO BOX 2 Kamal, Bangkalan 69162 Jawa Timur
              </div>
              <div style={{ height: '2px', backgroundColor: 'var(--primitive-navy-900)', margin: '10px 0' }} />
              
              <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {selectedPreviewDoc.kategori}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Nomor: {selectedPreviewDoc.kode}
              </div>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#FFFFFF', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Tentang / Perihal:
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '3px' }}>
                {selectedPreviewDoc.namaDokumen.replace(/_/g, ' ').replace('.pdf', '')}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                Ditetapkan pada tanggal: <strong>{selectedPreviewDoc.tanggal}</strong> di Bangkalan, Madura.
              </div>
            </div>

            {/* Panel Pengesahan & Tanda Tangan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-3)', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Mengetahui,</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>Dekan Fakultas Ekonomi dan Bisnis</div>
                <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={36} style={{ color: '#16A34A', opacity: 0.8 }} />
                </div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>Prof. Dr. Pribanus Wantara, Drs., M.M.</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>NIP. 196306231989031002</div>
              </div>

              <div style={{ padding: 'var(--space-3)', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Disahkan oleh,</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>Koordinator Program Studi S1 Manajemen</div>
                <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={36} style={{ color: '#2563EB', opacity: 0.8 }} />
                </div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>Dr. Hj. Siti Aminah, S.E., M.Si.</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>NIP. 196904121994032001</div>
              </div>
            </div>

            <div style={{ padding: '8px 12px', backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={14} />
              <span>Dokumen telah diverifikasi sah secara elektronik dan tercatat pada Pangkalan Data FEB UTM.</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Unggah Dokumen Baru */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Arsipkan Dokumen Resmi Program Studi"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSimpanArsip}>
              Simpan ke Pangkalan Data
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <FormField id="doc-kode" label="Nomor / Kode Surat Resmi" required>
            <Input
              placeholder="Contoh: SK-DEK-FEB/2026/102"
              value={newDoc.kode}
              onChange={(e) => setNewDoc({ ...newDoc, kode: e.target.value })}
            />
          </FormField>

          <FormField id="doc-nama" label="Nama Berkas / Dokumen Resmi" required>
            <Input
              placeholder="Contoh: SK_Dekan_Penetapan_Penguji_Sidang_Oktober_2026.pdf"
              value={newDoc.namaDokumen}
              onChange={(e) => setNewDoc({ ...newDoc, namaDokumen: e.target.value })}
            />
          </FormField>

          <FormField id="doc-kategori" label="Kategori Dokumen" required>
            <Select
              value={newDoc.kategori}
              onChange={(e) => setNewDoc({ ...newDoc, kategori: e.target.value })}
              options={[
                { value: 'Surat Keputusan Dekan', label: 'Surat Keputusan (SK) Dekan' },
                { value: 'Berita Acara', label: 'Berita Acara Ujian / Sidang' },
                { value: 'Lembar Pengesahan', label: 'Lembar Pengesahan Naskah Final' }
              ]}
            />
          </FormField>

          <FormField id="doc-berkas" label="Unggah Berkas PDF Dokumen" required>
            <FileUpload accept=".pdf" maxSizeMB={10} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

