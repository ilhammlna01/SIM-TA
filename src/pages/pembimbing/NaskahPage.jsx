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
  Select,
  DocumentItem,
  StatCard
} from '../../components/ui';

import {
  FileText,
  BookOpen,
  Download,
  Eye,
  CheckSquare,
  Clock,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { downloadUniversalDoc } from '../../utils/pdfDownloader';

/**
 * HALAMAN 5: NASKAH (FASE E)
 * Direktori draf naskah tugas akhir mahasiswa bimbingan yang masuk
 * Menampilkan versi naskah, batas Turnitin & AI detection resmi, serta aksi review
 */
export default function NaskahPage({
  naskahList = [],
  onNavigate,
  onOpenReview
}) {
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNaskah = naskahList.filter((n) => {
    const matchJenjang = filterJenjang === 'Semua' || n.jenjang === filterJenjang;
    const matchSearch =
      String(n.namaMahasiswa || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(n.judulNaskah || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(n.nim || '').includes(searchQuery);
    return matchJenjang && matchSearch;
  });

  const columns = [
    {
      key: 'nim',
      label: 'NIM',
      width: '120px'
    },
    {
      key: 'namaMahasiswa',
      label: 'Mahasiswa & Judul Naskah',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
            {val}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {row.judulNaskah}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Versi: <strong>{row.versi}</strong> • Berkas: {row.fileNaskah} ({row.ukuran})
          </div>
        </div>
      )
    },
    {
      key: 'jenjang',
      label: 'Jenjang & Peran',
      width: '140px',
      render: (val, row) => (
        <div>
          <Badge variant={String(row.peranDosen || '').toLowerCase().includes('motor') ? 'gold' : 'navy'}>
            {val} ({row.peranDosen})
          </Badge>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
            Kirim: {row.tanggalKirim}
          </div>
        </div>
      )
    },
    {
      key: 'plagiasi',
      label: 'Turnitin & AI Detection',
      width: '180px',
      render: (_, row) => {
        const isS3orS2 = row.jenjang === 'S3' || row.jenjang === 'S2';
        const maxSim = isS3orS2 ? 20 : 30;
        const maxAI = isS3orS2 ? 30 : 40;
        const isSimLolos = row.similarity <= maxSim;

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 'var(--font-weight-bold)', color: isSimLolos ? '#166534' : '#DC2626' }}>
                Sim: {row.similarity}%
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>(Maks {maxSim}%)</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              AI: <strong>{row.aiScore}%</strong> (Maks {maxAI}%)
            </div>
          </div>
        );
      }
    },
    {
      key: 'statusReview',
      label: 'Status Telaah',
      width: '150px',
      render: (val, row) => (
        <div>
          <StatusBadge status={val === 'Perlu Direview' ? 'Belum Ditelaah' : 'Perlu Revisi'} />
          <div style={{ fontSize: '10.5px', color: '#B45309', marginTop: '3px', fontWeight: 'var(--font-weight-medium)' }}>
            {row.urgensi}
          </div>
        </div>
      )
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '140px',
      align: 'center',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'center' }}>
          <Button
            variant="primary"
            size="sm"
            icon={BookOpen}
            onClick={() => {
              if (onOpenReview) onOpenReview(row.id);
              else onNavigate('review');
            }}
          >
            Review
          </Button>
          <IconButton
            icon={Download}
            label="Unduh Naskah"
            size="sm"
            bordered
            onClick={() => downloadUniversalDoc({ namaDokumen: row.fileNaskah || 'Draf_Naskah.pdf', jenis: 'Draf Naskah Tugas Akhir' }, { nama: row.mahasiswa, nim: row.nim })}
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
          { label: 'Dosen Pembimbing' },
          { label: 'Naskah Mahasiswa' }
        ]}
        title="Daftar Naskah Tugas Akhir Masuk"
        description="Pemeriksaan substantif draf proposal, skripsi, tesis, dan disertasi mahasiswa bimbingan sebelum persetujuan maju seminar atau ujian."
        statusBadge={<Badge variant="navy">Total: {naskahList.length} Draf Masuk</Badge>}
        primaryAction={
          <Button variant="primary" icon={CheckSquare} onClick={() => onNavigate('persetujuan')}>
            Buka Lembar Persetujuan (Approval)
          </Button>
        }
      />

      {/* Ringkasan Status Naskah Masuk */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard
          label="Total Naskah"
          value={naskahList.length}
          unit="Draf Masuk"
          icon={FileText}
          tone="navy"
        />
        <StatCard
          label="Perlu Telaah Segera"
          value={naskahList.filter(n => n.statusReview === 'Perlu Direview').length}
          unit="Menunggu"
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Lolos Turnitin"
          value={naskahList.filter(n => n.similarity <= 25).length}
          unit="Sim Safe"
          icon={ShieldCheck}
          tone="green"
        />
        <StatCard
          label="AI Detection Safe"
          value={naskahList.filter(n => n.aiScore <= 30).length}
          unit="Naskah"
          icon={BookOpen}
          tone="sky"
        />
      </div>

      <Panel noPadding>
        {/* Toolbar Filter */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
              Jenjang:
            </span>
            {['Semua', 'S3', 'S2', 'S1', 'D3'].map((jenjang) => (
              <button
                key={jenjang}
                type="button"
                onClick={() => setFilterJenjang(jenjang)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: filterJenjang === jenjang ? '#1e3a8a' : '#cbd5e1',
                  backgroundColor: filterJenjang === jenjang ? '#1e3a8a' : '#ffffff',
                  color: filterJenjang === jenjang ? '#ffffff' : '#475569',
                  fontWeight: filterJenjang === jenjang ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {jenjang === 'Semua' ? 'Semua Jenjang' : jenjang}
              </button>
            ))}
          </div>

          <Search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul naskah atau nama mahasiswa..."
          />
        </div>

        {/* Tabel Naskah Masuk */}
        <Table
          density="normal"
          columns={columns}
          data={filteredNaskah}
          striped
        />
      </Panel>
    </div>
  );
}
