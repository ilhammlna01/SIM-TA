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
  Modal
} from '../../components/ui';

import {
  ClipboardCheck,
  Eye,
  AlertTriangle,
  Clock,
  Send,
  CheckCircle,
  FileText,
  BookOpen,
  Calendar,
  AlertCircle,
  Download,
  Bell
} from 'lucide-react';
import { downloadUniversalDoc } from '../../utils/pdfDownloader';

import { INITIAL_REVISI_MONITORING } from '../../data/pembimbingData';

/**
 * HALAMAN: PEMANTAUAN REVISI PASCA UJIAN KOORPRODI (FASE F)
 * Pengawasan Kepatuhan Batas Waktu Revisi Pasca Sidang Seluruh Mahasiswa Program Studi:
 * - Menjamin kepatuhan batas maksimal 30 hari kalender (Buku Pedoman 2026 Bab VI Hal 75)
 * - Monitoring matriks perbaikan mahasiswa, tindak lanjut arahan dewan penguji, dan pengesahan
 * - Pencegahan keterlambatan yudisium dan penjadwalan sidang ulang bagi yang melampaui batas
 */
export default function RevisiPage({
  revisiList = INITIAL_REVISI_MONITORING,
  onNavigate
}) {
  const [dataRevisi, setDataRevisi] = useState(revisiList);
  const [activeJenjang, setActiveJenjang] = useState('Semua');
  const [activeStatus, setActiveStatus] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    setDataRevisi(revisiList);
  }, [revisiList]);

  // Filter Data
  const filteredData = dataRevisi.filter((r) => {
    const matchJenjang = activeJenjang === 'Semua' || r.jenjang === activeJenjang;
    const matchStatus =
      activeStatus === 'Semua' ||
      (activeStatus === 'Disetujui' && r.statusRevisi.toLowerCase().includes('disetujui')) ||
      (activeStatus === 'Menunggu' && r.statusRevisi.toLowerCase().includes('menunggu')) ||
      (activeStatus === 'Belum' && r.statusRevisi.toLowerCase().includes('belum'));
    const matchSearch =
      r.namaMahasiswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.nim.includes(searchQuery) ||
      r.catatanPenguji.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.jenisUjian.toLowerCase().includes(searchQuery.toLowerCase());
    return matchJenjang && matchStatus && matchSearch;
  });

  // Statistik Ringkas
  const totalBerkas = dataRevisi.length;
  const selesaiCount = dataRevisi.filter(r => r.statusRevisi.toLowerCase().includes('disetujui')).length;
  const menungguCount = dataRevisi.filter(r => r.statusRevisi.toLowerCase().includes('menunggu')).length;
  const belumCount = dataRevisi.filter(r => r.statusRevisi.toLowerCase().includes('belum')).length;

  const handleKirimPeringatan = (row) => {
    notify(
      `Surat Peringatan Resmi Tenggat 30 Hari berhasil dikirimkan ke email mahasiswa ${row.namaMahasiswa} (${row.nim}) dan Dosen Pembimbing terkait.`,
      { variant: 'success' }
    );
  };

  const columns = [
    {
      key: 'mahasiswa',
      label: 'Mahasiswa & Ujian',
      width: '230px',
      render: (_, row) => {
        const badgeColor = row.jenjang === 'S3' ? 'gold' : row.jenjang === 'S2' ? 'purple' : 'navy';
        return (
          <div>
            <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)', fontSize: '12.5px' }}>
              {row.namaMahasiswa}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>NIM: {row.nim}</span> • <Badge variant={badgeColor}>Jenjang {row.jenjang}</Badge>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-brand-primary)', marginTop: '3px', fontWeight: 'var(--font-weight-medium)' }}>
              {row.jenisUjian}
            </div>
          </div>
        );
      }
    },
    {
      key: 'catatanPenguji',
      label: 'Catatan Dewan Penguji',
      render: (val) => (
        <div style={{ fontSize: '12px', color: 'var(--primitive-navy-900)', lineHeight: 1.45, backgroundColor: '#FFFBEB', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid #FEF3C7' }}>
          {val}
        </div>
      )
    },
    {
      key: 'responsMahasiswa',
      label: 'Tindak Lanjut & Matriks Perbaikan',
      render: (val, row) => {
        if (!val || val === '-') {
          return (
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Belum mengunggah perbaikan naskah
            </div>
          );
        }
        return (
          <div>
            <div style={{ fontSize: '11.5px', color: '#166534', backgroundColor: '#F0FDF4', padding: '6px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid #DCFCE7', lineHeight: 1.4 }}>
              {val}
            </div>
            {row.fileBukti && (
              <div style={{ fontSize: '10.5px', color: 'var(--color-brand-primary)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <FileText size={11} />
                <span>Berkas: {row.fileBukti}</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'batasTenggat',
      label: 'SLA Batas Waktu (30 Hari)',
      width: '190px',
      render: (val, row) => {
        const isSelesai = row.statusRevisi.toLowerCase().includes('disetujui');
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} style={{ color: isSelesai ? '#16A34A' : '#D97706' }} />
              <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: isSelesai ? '#166534' : '#B45309' }}>
                {val}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
              {isSelesai ? 'Tuntas Sebelum Tenggat' : 'Pedoman Bab VI: Maks. 30 Hari'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'statusRevisi',
      label: 'Status Pengesahan',
      width: '160px',
      render: (val) => {
        const isDisetujui = val.toLowerCase().includes('disetujui');
        const isMenunggu = val.toLowerCase().includes('menunggu');
        return (
          <div>
            <StatusBadge status={isDisetujui ? 'Disetujui' : isMenunggu ? 'Menunggu Verifikasi' : 'Dalam Proses'} />
            <div style={{ fontSize: '10.5px', color: isDisetujui ? '#166534' : 'var(--color-text-secondary)', marginTop: '3px', fontWeight: isDisetujui ? 'bold' : 'normal' }}>
              {val}
            </div>
          </div>
        );
      }
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '120px',
      align: 'center',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'center' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedItem(row)}
          >
            Matriks
          </Button>
          <IconButton
            icon={Bell}
            label="Kirim Notifikasi Peringatan Tenggat"
            size="sm"
            bordered
            onClick={() => handleKirimPeringatan(row)}
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
          { label: 'Pemantauan Revisi Pasca Sidang' }
        ]}
        title="Pemantauan Batas Revisi Pasca Ujian"
        description="Pengawasan ketat tenggat waktu 30 hari kalender penyelesaian revisi naskah pasca sidang untuk percepatan masa studi (Buku Pedoman 2026 Bab VI Hal 75)."
        statusBadge={<Badge variant="navy">Total: {totalBerkas} Mahasiswa</Badge>}
      />

      {/* 4 Stat Cards SLA Pemantauan Revisi */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)'
        }}
      >
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Total Berkas Revisi</span>
            <ClipboardCheck size={18} style={{ color: 'var(--color-brand-primary)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '4px' }}>
            {totalBerkas}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Pasca Sempro, Tesis, & Kelayakan
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Tuntas Disahkan Penguji</span>
            <CheckCircle size={18} style={{ color: '#16A34A' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#15803D', marginTop: '4px' }}>
            {selesaiCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Siap terbitkan lembar pengesahan
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Menunggu Review Penguji</span>
            <Clock size={18} style={{ color: '#D97706' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#B45309', marginTop: '4px' }}>
            {menungguCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Draf perbaikan telah diunggah
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Agenda Ujian / Belum Revisi</span>
            <AlertCircle size={18} style={{ color: '#2563EB' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1D4ED8', marginTop: '4px' }}>
            {belumCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Sidang baru berlangsung
          </div>
        </div>
      </div>

      {/* Banner Regulasi Pedoman 2026 */}
      <div 
        style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)'
        }}
      >
        <AlertTriangle size={22} style={{ color: '#D97706', flexShrink: 0 }} />
        <div style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.5 }}>
          <strong>Peringatan Kepatuhan Pedoman 2026 Bab VI Hal 75:</strong> Mahasiswa memiliki batas waktu revisi maksimal <strong>30 (tiga puluh) hari kalender</strong> sejak ujian dilaksanakan. Keterlambatan tanpa dispensasi resmi dari Dekan berakibat pembatalan kelulusan dan kewajiban menempuh ujian ulang.
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
          {/* Filter Jenjang Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)' }}>
              Jenjang:
            </span>
            {[
              { id: 'Semua', label: 'Semua Jenjang' },
              { id: 'S1', label: 'S-1 Sarjana' },
              { id: 'S2', label: 'S-2 Magister' },
              { id: 'S3', label: 'S-3 Doktor' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveJenjang(tab.id)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid',
                  borderColor: activeJenjang === tab.id ? 'var(--color-brand-primary)' : 'var(--color-border-default)',
                  backgroundColor: activeJenjang === tab.id ? 'var(--primitive-navy-100)' : 'var(--color-surface-panel)',
                  color: activeJenjang === tab.id ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                  fontWeight: activeJenjang === tab.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter Status & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <select
              value={activeStatus}
              onChange={(e) => setActiveStatus(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '11.5px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                backgroundColor: 'var(--color-surface-panel)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="Semua">Semua Status Pengesahan</option>
              <option value="Disetujui">Telah Disetujui Penguji</option>
              <option value="Menunggu">Menunggu Approval Penguji</option>
              <option value="Belum">Belum Ada Revisi</option>
            </select>

            <Search
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIM, atau catatan..."
            />
          </div>
        </div>

        {/* Tabel Pemantauan Revisi */}
        <Table
          density="normal"
          columns={columns}
          data={filteredData}
          striped
        />
      </Panel>

      {/* Modal Rincian Matriks Revisi */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title="Matriks Verifikasi Revisi Pasca Sidang (Pedoman 2026)"
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Tenggat: {selectedItem.batasTenggat}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="secondary" onClick={() => setSelectedItem(null)}>
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  icon={Bell}
                  onClick={() => {
                    handleKirimPeringatan(selectedItem);
                    setSelectedItem(null);
                  }}
                >
                  Kirim Pengingat Resmi
                </Button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="grid-2col-responsive" style={{ gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Mahasiswa:</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '2px' }}>
                  {selectedItem.namaMahasiswa} ({selectedItem.nim})
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-brand-primary)', marginTop: '2px' }}>
                  Jenjang {selectedItem.jenjang} — Ujian: {selectedItem.jenisUjian}
                </div>
              </div>

              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Status SLA & Tenggat:</span>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#B45309', marginTop: '2px' }}>
                  {selectedItem.batasTenggat}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={selectedItem.statusRevisi.includes('Disetujui') ? 'Disetujui' : 'Menunggu Verifikasi'} />
                </div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--primitive-navy-950)', fontWeight: 'bold' }}>
                Catatan Substantif Dewan Penguji:
              </span>
              <div style={{ padding: '10px 12px', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', marginTop: '4px', lineHeight: 1.5, color: '#78350F' }}>
                {selectedItem.catatanPenguji}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--primitive-navy-950)', fontWeight: 'bold' }}>
                Respons & Penjelasan Perbaikan Mahasiswa:
              </span>
              <div style={{ padding: '10px 12px', backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', color: '#166534', marginTop: '4px', lineHeight: 1.5 }}>
                {selectedItem.responsMahasiswa || 'Belum ada penjelasan perbaikan yang diunggah oleh mahasiswa.'}
              </div>
            </div>

            {selectedItem.fileBukti && (
              <div style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} style={{ color: 'var(--color-brand-primary)' }} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
                      {selectedItem.fileBukti}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Berkas Draf Revisi Naskah Lengkap (PDF)
                    </div>
                  </div>
                </div>
                <Button variant="secondary" size="sm" icon={Download} onClick={() => downloadUniversalDoc({ namaDokumen: selectedItem.fileBukti || 'Berkas_Revisi_Naskah.pdf', jenis: 'Berkas Revisi Ujian' }, { nama: selectedItem.mahasiswa, nim: selectedItem.nim })}>
                  Unduh Berkas
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

