import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import {
  Panel,
  Button,
  IconButton,
  Table,
  Badge,
  StatusBadge,
  Modal,
  DocumentItem,
  StatCard
} from '../../components/ui';

import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Eye,
  Award
} from 'lucide-react';
import { downloadUniversalDoc } from '../../utils/pdfDownloader';

/**
 * HALAMAN 9: UJIAN (FASE E)
 * Agenda Sidang & Ujian Mahasiswa Bimbingan yang Dihadiri Dosen:
 * - Jenis ujian, tanggal/waktu, ruang, susunan dewan penguji, peran dosen dalam sidang
 * - Naskah terkait dan lembar penilaian/berita acara
 */
export default function UjianPage({
  jadwalUjianList = [],
  onNavigate
}) {
  const [selectedUjian, setSelectedUjian] = useState(null);

  const columns = [
    {
      key: 'jadwal',
      label: 'Hari, Tanggal & Waktu',
      width: '200px',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
            {row.hariTanggal}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
            <Clock size={12} />
            <span>{row.waktu}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
            <MapPin size={12} />
            <span>{row.ruang}</span>
          </div>
        </div>
      )
    },
    {
      key: 'jenisUjian',
      label: 'Jenis Ujian & Jenjang',
      width: '210px',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-navy-900)' }}>
            {val}
          </div>
          <div style={{ marginTop: '3px' }}>
            <Badge variant="navy">{row.jenjang}</Badge>
          </div>
        </div>
      )
    },
    {
      key: 'mahasiswa',
      label: 'Mahasiswa Bimbingan',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
            {row.namaMahasiswa}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            NIM. {row.nim}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-brand-primary)', marginTop: '2px', fontWeight: 'var(--font-weight-medium)' }}>
            Peran Dosen: {row.peranDosenSidang}
          </div>
        </div>
      )
    },
    {
      key: 'statusJadwal',
      label: 'Status Sidang',
      width: '160px',
      render: (val) => (
        <div>
          <StatusBadge status={val.includes('Terjadwal') ? 'Disetujui' : 'Selesai'} />
          <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
            {val}
          </div>
        </div>
      )
    },
    {
      key: 'aksi',
      label: 'Rincian',
      width: '100px',
      align: 'center',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedUjian(row)}
        >
          Lihat Sidang
        </Button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Dosen Pembimbing' },
          { label: 'Jadwal Sidang & Ujian' }
        ]}
        title="Agenda Sidang & Ujian Mahasiswa Bimbingan"
        description="Jadwal resmi seminar proposal, ujian kelayakan, dan sidang akhir mahasiswa bimbingan yang dihadiri sebagai penguji, pembimbing, atau promotor."
        statusBadge={<Badge variant="navy">Total: {jadwalUjianList.length} Agenda Sidang</Badge>}
      />

      {/* Ringkasan Agenda Sidang */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard
          label="Total Agenda"
          value={jadwalUjianList.length}
          unit="Sidang"
          icon={Calendar}
          tone="navy"
        />
        <StatCard
          label="Mendatang"
          value={jadwalUjianList.filter(u => u.statusJadwal.includes('Terjadwal')).length}
          unit="Terjadwal"
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Selesai Diuji"
          value={jadwalUjianList.filter(u => !u.statusJadwal.includes('Terjadwal')).length}
          unit="Lulus Sidang"
          icon={GraduationCap}
          tone="green"
        />
      </div>

      <Panel noPadding>
        <Table
          density="normal"
          columns={columns}
          data={jadwalUjianList}
          striped
        />
      </Panel>

      {/* Modal Detail Sidang Ujian */}
      {selectedUjian && (
        <Modal
          isOpen={!!selectedUjian}
          onClose={() => setSelectedUjian(null)}
          title={`Rincian Sidang: ${selectedUjian.jenisUjian}`}
          size="md"
          footer={
            <Button variant="secondary" onClick={() => setSelectedUjian(null)}>
              Tutup
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Mahasiswa Teruji:</div>
              <div style={{ fontSize: '14px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
                {selectedUjian.namaMahasiswa} ({selectedUjian.nim})
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-brand-primary)', marginTop: '2px' }}>
                Peran Anda dalam Sidang: <strong>{selectedUjian.peranDosenSidang}</strong>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Waktu & Ruang:</span>
              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                {selectedUjian.hariTanggal} • {selectedUjian.waktu}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Lokasi: {selectedUjian.ruang}
              </div>
            </div>

            {/* Susunan Dewan Penguji */}
            <div>
              <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase' }}>
                Susunan Dewan Penguji (Pedoman 2026):
              </span>
              <div style={{ marginTop: 'var(--space-1)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {selectedUjian.susunanPenguji.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xs)', fontSize: '12px', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                    <div>
                      <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-navy-950)' }}>{p.nama}</span>
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px' }}>({p.peran})</span>
                    </div>
                    {p.nilai && <Badge variant="gold">Nilai: {p.nilai}</Badge>}
                  </div>
                ))}
              </div>
            </div>

            {/* Dokumen Naskah & Penilaian */}
            <div>
              <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase' }}>
                Dokumen Berkas Sidang:
              </span>
              <div style={{ marginTop: 'var(--space-1)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <DocumentItem
                  title={selectedUjian.naskahFile}
                  meta="Draf Naskah Sidang Lengkap"
                  status="Siap Diuji"
                  onDownload={() => downloadUniversalDoc({ namaDokumen: selectedUjian.naskahFile || 'Naskah_Sidang.pdf', jenis: 'Berkas Sidang Ujian' }, { nama: selectedUjian.mahasiswa, nim: selectedUjian.nim })}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
