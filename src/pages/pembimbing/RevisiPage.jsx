import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import {
  Panel,
  Button,
  IconButton,
  Table,
  Badge,
  StatusBadge,
  Search,
  Modal,
  StatCard
} from '../../components/ui';

import {
  ClipboardCheck,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';

/**
 * HALAMAN 8: REVISI (FASE E)
 * Pemantauan Revisi Pasca Ujian oleh Pembimbing / Promotor:
 * - Catatan penguji
 * - Respons mahasiswa (tindak lanjut perbaikan & halaman)
 * - Status revisi & batas waktu resmi (maks 30 hari / Pedoman 2026)
 */
export default function RevisiPage({
  revisiList = [],
  onNavigate
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRevisi, setSelectedRevisi] = useState(null);

  const filteredRevisi = revisiList.filter((r) => {
    return (
      r.namaMahasiswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.catatanPenguji.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.responsMahasiswa.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const columns = [
    {
      key: 'mahasiswa',
      label: 'Mahasiswa & Ujian',
      width: '240px',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
            {row.namaMahasiswa}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            NIM. {row.nim} • <Badge variant={row.peranDosen.includes('motor') ? 'gold' : 'navy'}>{row.jenjang}</Badge>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-brand-primary)', marginTop: '2px' }}>
            {row.jenisUjian}
          </div>
        </div>
      )
    },
    {
      key: 'catatanPenguji',
      label: 'Catatan Dewan Penguji',
      render: (val) => (
        <div style={{ fontSize: '12px', color: 'var(--primitive-navy-900)', lineHeight: 1.4 }}>
          {val}
        </div>
      )
    },
    {
      key: 'responsMahasiswa',
      label: 'Tindak Lanjut & Halaman Revisi Mahasiswa',
      render: (val, row) => (
        <div>
          <div style={{ fontSize: '12px', color: '#166534', backgroundColor: '#F0FDF4', padding: '6px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid #DCFCE7' }}>
            {val}
          </div>
          {row.fileBukti && (
            <div style={{ fontSize: '11px', color: 'var(--color-brand-primary)', marginTop: '3px' }}>
              Bukti Berkas: {row.fileBukti}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'batasTenggat',
      label: 'Batas Waktu',
      width: '180px',
      render: (val) => (
        <div>
          <div style={{ fontSize: '11.5px', fontWeight: 'var(--font-weight-semibold)', color: '#B45309' }}>
            {val}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Ketentuan: Maks. 30 Hari
          </div>
        </div>
      )
    },
    {
      key: 'statusRevisi',
      label: 'Status Revisi',
      width: '160px',
      render: (val) => <StatusBadge status={val.includes('Disetujui') ? 'Disetujui' : 'Dalam Revisi'} />
    },
    {
      key: 'aksi',
      label: 'Detail',
      width: '80px',
      align: 'center',
      render: (_, row) => (
        <IconButton
          icon={Eye}
          label="Lihat Rincian Revisi"
          size="sm"
          bordered
          onClick={() => setSelectedRevisi(row)}
        />
      )
    }
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Dosen Pembimbing' },
          { label: 'Pemantauan Revisi Pasca Ujian' }
        ]}
        title="Pemantauan Catatan Revisi Pasca Ujian"
        description="Monitoring respon perbaikan naskah mahasiswa bimbingan terhadap masukan dewan penguji untuk memastikan kelulusan tepat waktu."
        statusBadge={<Badge variant="navy">Total: {filteredRevisi.length} Item Revisi</Badge>}
      />

      {/* Ringkasan Status Revisi */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard
          label="Total Catatan"
          value={revisiList.length}
          unit="Masukan Penguji"
          icon={ClipboardCheck}
          tone="navy"
        />
        <StatCard
          label="Dalam Proses Revisi"
          value={revisiList.filter(r => !r.statusRevisi.includes('Disetujui')).length}
          unit="Mhs Bimbingan"
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Telah Disetujui (Acc)"
          value={revisiList.filter(r => r.statusRevisi.includes('Disetujui')).length}
          unit="Selesai"
          icon={CheckCircle}
          tone="green"
        />
      </div>

      <Panel noPadding>
        {/* Toolbar Pencarian */}
        <div 
          style={{ 
            padding: '12px 16px', 
            borderBottom: '1px solid #e2e8f0', 
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
            Menampilkan catatan dewan penguji, respons tindak lanjut mahasiswa, dan batas tenggat 30 hari.
          </span>

          <Search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari catatan penguji atau nama mahasiswa..."
          />
        </div>

        {/* Tabel Revisi */}
        <Table
          density="normal"
          columns={columns}
          data={filteredRevisi}
          striped
        />
      </Panel>

      {/* Modal Detail Item Revisi */}
      {selectedRevisi && (
        <Modal
          isOpen={!!selectedRevisi}
          onClose={() => setSelectedRevisi(null)}
          title="Rincian Matriks Perbaikan Ujian"
          size="md"
          footer={
            <Button variant="secondary" onClick={() => setSelectedRevisi(null)}>
              Tutup
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Mahasiswa:</span>
              <div style={{ fontWeight: 'var(--font-weight-bold)' }}>{selectedRevisi.namaMahasiswa} ({selectedRevisi.nim})</div>
            </div>
            <div>
              <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Ujian & Tanggal:</span>
              <div>{selectedRevisi.jenisUjian} • {selectedRevisi.tanggalUjian}</div>
            </div>
            <div>
              <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Catatan Resmi Dewan Penguji:</span>
              <div style={{ padding: 'var(--space-2)', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 'var(--radius-xs)', fontSize: '12px' }}>
                {selectedRevisi.catatanPenguji}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Tindak Lanjut & Halaman:</span>
              <div style={{ padding: 'var(--space-2)', backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 'var(--radius-xs)', fontSize: '12px', color: '#166534' }}>
                {selectedRevisi.responsMahasiswa}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Batas Waktu Revisi:</span>
              <div style={{ fontWeight: 'var(--font-weight-semibold)', color: '#B45309' }}>
                {selectedRevisi.batasTenggat}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Status:</span>
              <div style={{ marginTop: '2px' }}>
                <StatusBadge status={selectedRevisi.statusRevisi.includes('Disetujui') ? 'Disetujui' : 'Dalam Revisi'} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
