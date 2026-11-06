import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import { formatTanggal } from '../../utils/format';
import { 
  Panel, 
  Button, 
  IconButton, 
  StatusBadge, 
  Badge, 
  Table, 
  Pagination, 
  Search, 
  Modal, 
  FormField, 
  Input, 
  Select, 
  FileUpload,
  StatCard
} from '../../components/ui';
import { PROGRAM_STUDI_INFO, getIstilahTA } from '../../data/pedomanRules';
import { 
  FolderArchive, 
  FileText, 
  Download, 
  Eye, 
  Upload, 
  Search as SearchIcon, 
  Filter,
  Printer,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { 
  downloadUniversalDoc, 
  downloadLembarPengesahan, 
  downloadKartuBimbingan, 
  downloadBeritaAcara, 
  downloadSKBebasPlagiasi 
} from '../../utils/pdfDownloader';
import { DocumentGeneratorModal, SecureFileUploadModal } from '../../components/documents';

/**
 * Halaman 10: Pusat Dokumen & Formulir Resmi
 * 
 * Menggunakan Document List / Table:
 * - Arsip seluruh dokumen resmi akademik mahasiswa (SK Pembimbing, Berita Acara, Bukti Plagiasi, LoA)
 * - Generator Dokumen Resmi PDF Ber-QR Code (Lembar Pengesahan, Kartu Kendali Bimbingan)
 * - Pengunggah Berkas Terproteksi dengan Validasi Ukuran (25MB) dan Magic Bytes
 */
export default function DokumenPage({ 
  student, 
  dokumenList = [], 
  onAddDokumen 
}) {
  const prodiInfo = PROGRAM_STUDI_INFO[student.jenjang] || PROGRAM_STUDI_INFO.S1;
  const istilahTA = getIstilahTA(student, prodiInfo);
  const studentDokumen = dokumenList.filter(d => !d.mhsId || d.mhsId === student.id);

  const [activeKategori, setActiveKategori] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Generator Dokumen Resmi
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [generatorDocType, setGeneratorDocType] = useState('pengesahan');

  // Modal Unggah Berkas Terproteksi
  const [isSecureUploadOpen, setIsSecureUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('naskah');

  // Filter dokumen
  const filteredDocs = studentDokumen.filter(doc => {
    const matchKat = activeKategori === 'Semua' || doc.kategori === activeKategori;
    const matchSearch = doc.namaDokumen.toLowerCase().includes(searchQuery.toLowerCase());
    return matchKat && matchSearch;
  });

  const handleUploadSuccess = (uploadedData) => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      mhsId: student.id,
      namaDokumen: uploadedData.originalName,
      jenis: uploadedData.category === 'naskah' ? 'Naskah Tugas Akhir' : 'Berkas Persyaratan',
      tanggal: formatTanggal(new Date()),
      ukuran: uploadedData.sizeFormatted,
      statusVerifikasi: 'Terverifikasi Server',
      kategori: uploadedData.category === 'naskah' ? 'Naskah' : 'Persyaratan',
      fileUrl: uploadedData.accessUrl
    };
    if (onAddDokumen) onAddDokumen(newDoc);
    setIsSecureUploadOpen(false);
  };

  const handleDownloadDoc = async (row) => {
    const nameLower = (row.namaDokumen || '').toLowerCase();
    if (nameLower.includes('pengesahan')) {
      await downloadLembarPengesahan(student);
    } else if (nameLower.includes('bimbingan')) {
      await downloadKartuBimbingan(student);
    } else if (nameLower.includes('plagiasi') || nameLower.includes('turnitin')) {
      await downloadSKBebasPlagiasi(student);
    } else if (nameLower.includes('berita acara')) {
      await downloadBeritaAcara(student);
    } else {
      await downloadUniversalDoc(row, student);
    }
  };

  const columns = [
    {
      key: 'namaDokumen',
      label: 'Nama Dokumen Resmi',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <FileText size={16} style={{ color: 'var(--color-brand-primary)', flexShrink: 0 }} aria-hidden="true" />
          <div>
            <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-navy-950)' }}>
              {val}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Format PDF • {row.ukuran} • Tervalidasi Resmi
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'kategori', 
      label: 'Kategori', 
      width: '160px',
      render: (val) => <Badge variant="neutral">{val}</Badge> 
    },
    { 
      key: 'tanggal', 
      label: 'Tgl Pengesahan', 
      width: '140px' 
    },
    { 
      key: 'statusVerifikasi', 
      label: 'Status Pengesahan', 
      width: '200px',
      render: (val) => <StatusBadge status={val} /> 
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '120px',
      align: 'center',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <IconButton
            icon={Eye}
            label={`Lihat pratinjau ${row.namaDokumen}`}
            size="sm"
            bordered
            onClick={() => handleDownloadDoc(row)}
          />
          <IconButton
            icon={Download}
            label={`Unduh ${row.namaDokumen} (PDF Asli)`}
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
          { label: 'Portal Mahasiswa' },
          { label: `Portal ${prodiInfo.jenjang}` },
          { label: 'Pusat Dokumen Resmi' }
        ]}
        title={`Pusat Dokumen & Arsip ${istilahTA}`}
        description={`Arsip digital berkas resmi tugas akhir yang terverifikasi dan sah secara administratif.`}
        statusBadge={<StatusBadge status="Disetujui" />}
        primaryAction={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button 
              variant="secondary" 
              icon={Printer}
              onClick={() => {
                setGeneratorDocType('pengesahan');
                setIsGeneratorModalOpen(true);
              }}
            >
              Cetak Lembar Pengesahan
            </Button>
            <Button 
              variant="secondary" 
              icon={FileCheck}
              onClick={() => {
                setGeneratorDocType('bimbingan');
                setIsGeneratorModalOpen(true);
              }}
            >
              Cetak Kartu Bimbingan
            </Button>
            <Button 
              variant="primary" 
              icon={Upload}
              onClick={() => {
                setUploadCategory('naskah');
                setIsSecureUploadOpen(true);
              }}
            >
              Unggah Naskah / Berkas
            </Button>
          </div>
        }
        secondaryAction={null}
      />

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard
          label="Total Arsip"
          value={studentDokumen.length}
          unit="Berkas Sah"
          icon={FolderArchive}
          tone="navy"
        />
        <StatCard
          label="Draf Naskah"
          value={studentDokumen.filter(d => d.kategori === 'Naskah').length}
          unit="Versi Terunggah"
          icon={FileText}
          tone="sky"
        />
        <StatCard
          label="Turnitin &amp; Bukti"
          value={studentDokumen.filter(d => d.kategori === 'Bukti Plagiasi' || d.kategori === 'Persyaratan').length}
          unit="Tervalidasi"
          icon={ShieldCheck}
          tone="green"
        />
        <StatCard
          label="Format Cetak"
          value="PDF + QR"
          unit="Resmi UTM"
          icon={Printer}
          tone="amber"
        />
      </div>

      {/* Banner Informasi Penyimpanan & Generator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          marginBottom: '20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#f0f7ff',
          border: '1px solid #bfdbfe',
          borderLeft: '5px solid #0284c7',
          fontSize: '13px',
          color: '#1e3a8a',
          flexWrap: 'wrap',
          gap: 'var(--space-2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={22} color="#0284c7" style={{ flexShrink: 0 }} />
          <span>
            <strong>Penyimpanan Resmi Terproteksi:</strong> Mendukung upload naskah PDF &amp; Word (maksimal 25MB), validasi magic bytes anti-malware, serta penerbitan stempel digital &amp; QR code validasi.
          </span>
        </div>
      </div>

      {/* Panel Daftar Berkas Dokumen */}
      <Panel
        title="Daftar Dokumen Resmi Terverifikasi"
        subtitle={`Total ${studentDokumen.length} berkas tersimpan pada pangkalan data universitas`}
        icon={FolderArchive}
        noPadding
      >
        {/* Filter Bar */}
        <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
              Kategori:
            </span>
            {['Semua', 'Naskah', 'Bukti Plagiasi', 'Publikasi', 'Berita Acara', 'Persyaratan'].map((kat) => (
              <button
                key={kat}
                type="button"
                onClick={() => setActiveKategori(kat)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: activeKategori === kat ? '#1e3a8a' : '#cbd5e1',
                  backgroundColor: activeKategori === kat ? '#1e3a8a' : '#ffffff',
                  color: activeKategori === kat ? '#ffffff' : '#475569',
                  fontWeight: activeKategori === kat ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {kat}
              </button>
            ))}
          </div>

          <Search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama dokumen..."
          />
        </div>

        {/* Table Dokumen */}
        <Table
          columns={columns}
          data={filteredDocs}
          density="normal"
          striped
        />
      </Panel>

      {/* Modal Generator Dokumen Resmi (PDF) */}
      <DocumentGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
        initialDocType={generatorDocType}
        prefillData={{
          namaMahasiswa: student.nama,
          nim: student.nim,
          jenjang: student.jenjang,
          prodi: student.prodi || prodiInfo.namaProdi,
          judul: student.judulTA
        }}
      />

      {/* Modal Unggah Berkas Terproteksi */}
      <SecureFileUploadModal
        isOpen={isSecureUploadOpen}
        onClose={() => setIsSecureUploadOpen(false)}
        category={uploadCategory}
        title="Unggah Naskah / Dokumen Akademik Resmi"
        maxSizeMb={25}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
