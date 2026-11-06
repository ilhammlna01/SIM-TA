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
  StatCard
} from '../../components/ui';

import {
  Users,
  Eye,
  FileText,
  MessageSquare,
  BookOpen,
  Filter,
  GraduationCap,
  CheckCircle2,
  Clock
} from 'lucide-react';

/**
 * HALAMAN 2: MAHASISWA BIMBINGAN (FASE E)
 * Menampilkan direktori seluruh mahasiswa bimbingan dosen aktif
 * Mendukung filter jenjang dan pencarian
 * Otomatis menampilkan Promotor/Kopromotor untuk S3 dan Pembimbing untuk jenjang lain
 */
export default function MahasiswaBimbinganPage({
  mahasiswaList = [],
  onNavigate,
  onSelectMahasiswa,
  onOpenReview
}) {
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Data Mahasiswa
  const filteredData = mahasiswaList.filter((mhs) => {
    const matchJenjang = filterJenjang === 'Semua' || mhs.jenjang === filterJenjang;
    const matchSearch =
      mhs.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mhs.nim.includes(searchQuery) ||
      mhs.judul.toLowerCase().includes(searchQuery.toLowerCase());
    return matchJenjang && matchSearch;
  });

  const columns = [
    {
      key: 'nim',
      label: 'NIM',
      width: '130px',
      sortable: true
    },
    {
      key: 'nama',
      label: 'Nama Mahasiswa & Judul',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
            {val}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
            {row.judul}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
            {row.programStudi} • IPK: {row.ipk} • TOEFL: {row.toefl}
          </div>
        </div>
      )
    },
    {
      key: 'jenjang',
      label: 'Jenjang & Bentuk',
      width: '140px',
      render: (val, row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <Badge variant="navy">{val}</Badge>
            {row.jenisTA && <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>({row.jenisTA})</span>}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {row.bentukTA}
          </div>
        </div>
      )
    },
    {
      key: 'peranDosen',
      label: 'Peran Penugasan',
      width: '140px',
      render: (val, row) => (
        <div>
          <Badge variant={val.includes('motor') ? 'gold' : 'navy'}>
            {val}
          </Badge>
          {row.pasanganDosen && (
            <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
              Mitra: {row.pasanganDosen.split(' ')[0]} {row.pasanganDosen.split(' ')[1]}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'tahapAktifNama',
      label: 'Tahapan Akademik',
      width: '170px',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-navy-900)', fontSize: '12px' }}>
            {val}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {row.statusTahap}
          </div>
        </div>
      )
    },
    {
      key: 'statusBimbingan',
      label: 'Logbook Bimbingan',
      width: '140px',
      render: (val, row) => {
        const isSelesai = row.sesiCount >= row.sesiMin;
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 'var(--font-weight-bold)', color: isSelesai ? '#166534' : '#B45309' }}>
                {row.sesiCount}/{row.sesiMin}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Sesi</span>
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Terakhir: {row.sesiTerakhir}
            </div>
          </div>
        );
      }
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '130px',
      align: 'center',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (onSelectMahasiswa) onSelectMahasiswa(row.id);
              onNavigate('detail-mahasiswa');
            }}
          >
            Detail
          </Button>
          <IconButton
            icon={FileText}
            label={`Review Naskah ${row.nama}`}
            size="sm"
            bordered
            onClick={() => {
              if (onOpenReview) onOpenReview(row.id);
              else onNavigate('naskah');
            }}
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
          { label: 'Mahasiswa Bimbingan' }
        ]}
        title="Daftar Mahasiswa Bimbingan"
        description="Direktori mahasiswa bimbingan aktif pada jenjang Diploma (D3), Sarjana (S1), Magister (S2), dan Doktor (S3) Jurusan Manajemen FEB UTM."
        statusBadge={<Badge variant="navy">Total: {mahasiswaList.length} Mahasiswa</Badge>}
        primaryAction={
          <Button variant="primary" icon={MessageSquare} onClick={() => onNavigate('bimbingan')}>
            Catat Konsultasi Baru
          </Button>
        }
      />

      {/* 1. Ringkasan Metrik Bimbingan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard
          label="Total Bimbingan"
          value={mahasiswaList.length}
          unit="Mahasiswa"
          icon={Users}
          tone="navy"
        />
        <StatCard
          label="Doktoral (S3)"
          value={mahasiswaList.filter(m => m.jenjang === 'S3').length}
          unit="Promovendus"
          icon={GraduationCap}
          tone="amber"
        />
        <StatCard
          label="Magister &amp; Sarjana"
          value={mahasiswaList.filter(m => m.jenjang === 'S2' || m.jenjang === 'S1').length}
          unit="Mahasiswa"
          icon={BookOpen}
          tone="sky"
        />
        <StatCard
          label="Tuntas Kuota Logbook"
          value={mahasiswaList.filter(m => m.sesiCount >= m.sesiMin).length}
          unit="Siap Sidang"
          icon={CheckCircle2}
          tone="green"
        />
      </div>

      <Panel noPadding>
        {/* Toolbar Filter & Search */}
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
            placeholder="Cari nama, NIM, atau topik..."
          />
        </div>

        {/* Tabel Data Mahasiswa */}
        <Table
          density="normal"
          columns={columns}
          data={filteredData}
          striped
          emptyContent={
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              {searchQuery || filterJenjang !== 'Semua' 
                ? 'Tidak ditemukan mahasiswa dengan kriteria pencarian tersebut.' 
                : 'Belum ada mahasiswa bimbingan yang di-plotting oleh Koorprodi ke akun Anda.'}
            </div>
          }
        />
      </Panel>
    </div>
  );
}
