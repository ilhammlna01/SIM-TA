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
  StatCard
} from '../../components/ui';

import {
  Calendar,
  Clock,
  MapPin,
  ClipboardCheck,
  Eye,
  FileText,
  BookOpen,
  LayoutGrid,
  List,
  Filter,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

/**
 * HALAMAN 2: DAFTAR UJIAN PENGUJI (FASE G)
 * Tabel & Kartu Agenda Ujian & Sidang Resmi yang Ditugaskan kepada Penguji
 * Mendukung filter multi-jenjang (D3, S1 TAKT, S1 TAKK, S2, S3) dan toggle tampilan
 */
export default function DaftarUjianPage({
  ujianList = [],
  onNavigate,
  onPilihUjian
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const filteredUjian = ujianList.filter((uj) => {
    const namaMhs = uj.namaMahasiswa || uj.nama || '';
    const nimMhs = String(uj.nim || uj.nomorInduk || '');
    const judulNaskah = uj.judul || uj.judulNaskah || uj.tema || '';
    const jenisUj = uj.jenisUjian || uj.jenis || '';

    const matchSearch =
      namaMhs.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nimMhs.includes(searchQuery) ||
      judulNaskah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jenisUj.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      filterStatus === 'Semua' ||
      (filterStatus === 'Menunggu' && !uj.penilaianSubmitted) ||
      (filterStatus === 'Selesai' && uj.penilaianSubmitted);

    const matchJenjang =
      filterJenjang === 'Semua' || uj.jenjang === filterJenjang;

    return matchSearch && matchStatus && matchJenjang;
  });

  const countPending = ujianList.filter(u => !u.penilaianSubmitted).length;
  const countDone = ujianList.filter(u => u.penilaianSubmitted).length;

  const columns = [
    {
      key: 'jadwal',
      label: 'Jadwal & Ruang Sidang',
      width: '210px',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: '700', color: '#0F172A' }}>
            {row.jadwal || 'Jadwal Ditentukan'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
            <Clock size={12} />
            <span>{row.waktu || 'Waktu Sidang'}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
            <MapPin size={12} />
            <span>{row.ruang || 'Ruang Sidang FEB'}</span>
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
          <div style={{ fontWeight: '600', color: '#1E293B' }}>
            {val || row.jenisUjian || 'Ujian Tugas Akhir'}
          </div>
          <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <Badge variant={row.jenjang === 'S3' ? 'gold' : row.jenjang === 'S2' ? 'purple' : 'navy'}>
              {row.jenjang || 'S1'}
            </Badge>
            {row.jenisTA === 'TAKK' && (
              <Badge variant="green">TAKK Bebas Skripsi</Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'mahasiswa',
      label: 'Mahasiswa & Judul Naskah',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: '700', color: '#0F172A' }}>
            {row.namaMahasiswa || 'Mahasiswa'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B' }}>
            NIM. {row.nim || '-'} • {row.programStudi || 'Program Studi'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px', lineHeight: 1.35, fontStyle: 'italic' }}>
            "{row.judul || '(Judul naskah akademik terdaftar)'}"
          </div>
        </div>
      )
    },
    {
      key: 'peranPenguji',
      label: 'Peran Penugasan',
      width: '180px',
      render: (val, row) => {
        const peran = String(val || row.peranPenguji || 'Dewan Penguji');
        return (
          <div>
            <Badge variant={peran.includes('Utama') || peran.includes('III') ? 'gold' : 'navy'}>
              {peran}
            </Badge>
            <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '3px' }}>
              Turnitin: <strong>{row.turnitinSim}%</strong>
            </div>
          </div>
        );
      }
    },
    {
      key: 'statusPenilaian',
      label: 'Status Penilaian',
      width: '150px',
      render: (_, row) => (
        <div>
          <StatusBadge status={row.penilaianSubmitted ? 'Disetujui' : 'Belum Dinilai'} />
          <div style={{ fontSize: '11px', color: row.penilaianSubmitted ? '#166534' : '#B45309', marginTop: '3px', fontWeight: '700' }}>
            {row.penilaianSubmitted ? `Nilai: ${row.nilaiFinal}` : 'Belum Dinilai'}
          </div>
        </div>
      )
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '150px',
      align: 'center',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          <Button
            variant={row.penilaianSubmitted ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => {
              if (onPilihUjian) onPilihUjian(row.id);
              onNavigate(row.penilaianSubmitted ? 'detail-ujian' : 'penilaian');
            }}
          >
            {row.penilaianSubmitted ? 'Lihat' : 'Nilai'}
          </Button>
          <IconButton
            icon={FileText}
            label="Baca Naskah Ujian"
            size="sm"
            bordered
            onClick={() => {
              if (onPilihUjian) onPilihUjian(row.id);
              onNavigate('naskah');
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
          { label: 'Dewan Penguji' },
          { label: 'Daftar Sidang Ujian' }
        ]}
        title="Daftar Agenda Sidang & Ujian Ditugaskan"
        description="Jadwal resmi seminar proposal, ujian tesis, kelayakan disertasi, dan sidang tugas akhir D3/S1 yang ditugaskan kepada Anda."
        statusBadge={<Badge variant="navy">Total: {ujianList.length} Sidang Ditugaskan</Badge>}
      />

      {/* Ringkasan Beban Sidang Penguji */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard
          label="Agenda Sidang"
          value={ujianList.length}
          unit="Mahasiswa"
          caption="D3, S1 TAKT, S1 TAKK, S2, S3"
          icon={Calendar}
          tone="navy"
        />

        <StatCard
          label="Perlu Dinilai"
          value={countPending}
          unit="Menunggu Rubrik"
          caption="Wajib dinilai pada hari ujian"
          icon={Clock}
          tone="amber"
        />

        <StatCard
          label="Selesai Dinilai"
          value={countDone}
          unit="Sidang Tuntas"
          caption="Berita Acara resmi tersimpan"
          icon={ClipboardCheck}
          tone="green"
        />
      </div>

      <Panel noPadding>
        {/* Toolbar Filter & View Switcher */}
        <div 
          style={{ 
            padding: '14px 18px', 
            borderBottom: '1px solid #E2E8F0', 
            backgroundColor: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Baris 1: Filter Jenjang & Tampilan */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
                Jenjang:
              </span>
              {['Semua', 'D3', 'S1', 'S2', 'S3'].map(j => {
                const isActive = filterJenjang === j;
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setFilterJenjang(j)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: isActive ? '#1E3A8A' : '#CBD5E1',
                      backgroundColor: isActive ? '#1E3A8A' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#475569',
                      fontWeight: isActive ? '700' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {j === 'Semua' ? 'Semua Jenjang' : j}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tampilan:
              </span>
              <div style={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  aria-label="Tampilan kartu"
                  aria-pressed={viewMode === 'cards'}
                  style={{
                    padding: '5px 8px',
                    border: 'none',
                    backgroundColor: viewMode === 'cards' ? '#1E3A8A' : '#FFFFFF',
                    color: viewMode === 'cards' ? '#FFFFFF' : '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Tampilan Kartu"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  aria-label="Tampilan tabel"
                  aria-pressed={viewMode === 'table'}
                  style={{
                    padding: '5px 8px',
                    border: 'none',
                    backgroundColor: viewMode === 'table' ? '#1E3A8A' : '#FFFFFF',
                    color: viewMode === 'table' ? '#FFFFFF' : '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Tampilan Tabel"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Baris 2: Filter Status & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
                Status Nilai:
              </span>
              {['Semua', 'Menunggu', 'Selesai'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: filterStatus === st ? '#D97706' : '#CBD5E1',
                    backgroundColor: filterStatus === st ? '#D97706' : '#FFFFFF',
                    color: filterStatus === st ? '#FFFFFF' : '#475569',
                    fontWeight: filterStatus === st ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {st === 'Semua' ? 'Semua Status' : st === 'Menunggu' ? 'Perlu Dinilai' : 'Selesai Dinilai'}
                </button>
              ))}
            </div>

            <Search
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mahasiswa, judul, atau jenis ujian..."
            />
          </div>
        </div>

        {/* Tampilan 1: Grid Kartu Responsif */}
        {viewMode === 'cards' ? (
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredUjian.length > 0 ? (
              filteredUjian.map((uj) => (
                <div
                  key={uj.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderLeft: `5px solid ${uj.penilaianSubmitted ? '#16A34A' : '#D97706'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header baris nama & badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                        {uj.namaMahasiswa}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        (NIM. {uj.nim})
                      </span>
                      <Badge variant={uj.jenjang === 'S3' ? 'gold' : uj.jenjang === 'S2' ? 'purple' : 'navy'}>
                        {uj.jenjang} • {uj.programStudi}
                      </Badge>
                      {uj.jenisTA === 'TAKK' && (
                        <Badge variant="green">TAKK Bebas Skripsi Bab VI</Badge>
                      )}
                      <StatusBadge status={uj.penilaianSubmitted ? 'Disetujui' : 'Belum Dinilai'} />
                    </div>

                    {/* Judul & Jenis Ujian */}
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E3A8A', marginBottom: '4px' }}>
                      {uj.jenisUjian} — {uj.bentukTA}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.45, fontStyle: 'italic', marginBottom: '10px' }}>
                      "{uj.judul}"
                    </div>

                    {/* Info baris bawah: Waktu, Ruang, Peran, Turnitin */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '11.5px', color: '#64748B', backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} color="#1E3A8A" />
                        <span><strong>{uj.jadwal}</strong> • {uj.waktu}</span>
                      </div>
                      <div>•</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color="#D97706" />
                        <span>{uj.ruang}</span>
                      </div>
                      <div>•</div>
                      <div>
                        Peran: <strong style={{ color: '#0F172A' }}>{uj.peranPenguji}</strong>
                      </div>
                      <div>•</div>
                      <div style={{ color: '#166534', fontWeight: '600' }}>
                        Turnitin: {uj.turnitinSim}% (Lolos)
                      </div>
                    </div>
                  </div>

                  {/* Kolom Aksi */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '130px', alignItems: 'stretch' }}>
                    <Button
                      variant={uj.penilaianSubmitted ? 'secondary' : 'primary'}
                      size="sm"
                      icon={ClipboardCheck}
                      onClick={() => {
                        if (onPilihUjian) onPilihUjian(uj.id);
                        onNavigate(uj.penilaianSubmitted ? 'detail-ujian' : 'penilaian');
                      }}
                    >
                      {uj.penilaianSubmitted ? 'Lihat Nilai' : 'Beri Nilai Rubrik'}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={FileText}
                      onClick={() => {
                        if (onPilihUjian) onPilihUjian(uj.id);
                        onNavigate('naskah');
                      }}
                    >
                      Baca Naskah PDF
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                Tidak ditemukan agenda sidang untuk kriteria filter yang dipilih.
              </div>
            )}
          </div>
        ) : (
          /* Tampilan 2: Tabel */
          <Table
            density="normal"
            columns={columns}
            data={filteredUjian}
            striped
            emptyContent={
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                Tidak ditemukan agenda ujian dengan kriteria pencarian tersebut.
              </div>
            }
          />
        )}
      </Panel>
    </div>
  );
}
