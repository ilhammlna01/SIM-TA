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
  Pagination,
  Select,
  StatCard
} from '../../components/ui';

import {
  Users,
  Eye,
  Filter,
  Download,
  ArrowUpDown,
  BookOpen,
  GraduationCap,
  Award,
  CheckCircle2
} from 'lucide-react';

/**
 * HALAMAN 2: DAFTAR MAHASISWA KOORPRODI (FASE F) — ELEVATED INSTITUTIONAL DESIGN
 * Primary Interface: Table Administratif Mahasiswa Tugas Akhir
 * Menampilkan: Nama, NIM, Prodi, Jenjang, Judul, Tahap, Status, dan Pembimbing
 * Dilengkapi: Search, Filter Jenjang, Filter Status, Sorting, dan Pagination
 */
export default function DaftarMahasiswaPage({
  mahasiswaList = [],
  onNavigate,
  onSelectMahasiswa
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  // Sorting
  const [sortColumn, setSortColumn] = useState('nama');
  const [sortDirection, setSortDirection] = useState('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtering Logic
  const filteredData = mahasiswaList.filter((mhs) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      mhs.nama.toLowerCase().includes(q) ||
      mhs.nim.includes(q) ||
      mhs.judul.toLowerCase().includes(q) ||
      mhs.programStudi.toLowerCase().includes(q);

    const matchJenjang = filterJenjang === 'Semua' || mhs.jenjang === filterJenjang;
    const matchStatus = filterStatus === 'Semua' || mhs.statusTahap.includes(filterStatus);

    return matchSearch && matchJenjang && matchStatus;
  });

  // Sorting Logic
  const sortedData = [...filteredData].sort((a, b) => {
    let aVal = a[sortColumn] || '';
    let bVal = b[sortColumn] || '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Slice
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (columnKey, direction) => {
    setSortColumn(columnKey);
    setSortDirection(direction);
  };

  const countS1 = mahasiswaList.filter(m => m.jenjang === 'S1').length;
  const countS2 = mahasiswaList.filter(m => m.jenjang === 'S2').length;
  const countS3 = mahasiswaList.filter(m => m.jenjang === 'S3').length;
  const countD3 = mahasiswaList.filter(m => m.jenjang === 'D3').length;

  const handleExportExcel = () => {
    import('xlsx').then(XLSX => {
      const dataToExport = sortedData.map((m, idx) => ({
        'No': idx + 1,
        'NIM': m.nim,
        'Nama Mahasiswa': m.nama,
        'Jenjang': m.jenjang,
        'Program Studi': m.programStudi,
        'Jalur Tugas Akhir': m.jenisTA || 'TAKT',
        'Judul Naskah': m.judul,
        'Tahap Aktif': m.tahapAktifNama || m.tahap,
        'Status Tahap': m.statusTahap,
        'Turnitin (%)': m.turnitinSimilarity || 0,
        'Dosen Pembimbing': Array.isArray(m.pembimbing) ? m.pembimbing.map(p => p.nama).join(', ') : (m.pembimbing || '-')
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Mahasiswa TA');
      XLSX.writeFile(workbook, `Data_Mahasiswa_Tugas_Akhir_FEB_UTM_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }).catch(err => {
      console.error('Gagal ekspor excel:', err);
    });
  };

  const columns = [
    {
      key: 'nim',
      label: 'NIM',
      width: '130px',
      sortable: true,
      render: (val) => <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '12px' }}>{val}</span>
    },
    {
      key: 'nama',
      label: 'Nama Mahasiswa & Akademik',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px' }}>
            {val}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            IPK: <strong>{row.ipk}</strong> • SKS Lulus: <strong>{row.sks || row.sksLulus}</strong> • TOEFL: <strong>{row.toefl}</strong>
          </div>
        </div>
      )
    },
    {
      key: 'programStudi',
      label: 'Program Studi & Jenjang',
      width: '190px',
      render: (val, row) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1E293B' }}>
            {val}
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
            <Badge variant={row.jenjang === 'S3' ? 'gold' : row.jenjang === 'S2' ? 'purple' : 'navy'}>
              {row.jenjang}
            </Badge>
            {row.jenisTA === 'TAKK' && (
              <Badge variant="green">TAKK Portofolio</Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'judul',
      label: 'Judul Tugas Akhir & Bentuk',
      render: (val, row) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: '500', color: '#0F172A', lineHeight: 1.35, fontStyle: 'italic' }}>
            "{val}"
          </div>
          <div style={{ fontSize: '11px', color: '#1E3A8A', marginTop: '3px', fontWeight: '600' }}>
            Bentuk: {row.bentukTA} {row.skemaTAKK ? `(${row.skemaTAKK})` : ''}
          </div>
        </div>
      )
    },
    {
      key: 'tahapAktifNama',
      label: 'Tahapan Akademik Saat Ini',
      width: '180px',
      render: (val) => (
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E3A8A' }}>
          {val}
        </div>
      )
    },
    {
      key: 'statusTahap',
      label: 'Status Administratif',
      width: '170px',
      render: (val) => (
        <div>
          <StatusBadge status={val.includes('Disetujui') ? 'Disetujui' : val.includes('Revisi') ? 'Dalam Revisi' : 'Menunggu Verifikasi'} />
          <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '3px' }}>
            {val}
          </div>
        </div>
      )
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '90px',
      align: 'center',
      render: (_, row) => (
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
      )
    }
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Koorprodi' },
          { label: 'Daftar Mahasiswa TA' }
        ]}
        title="Daftar Mahasiswa Tugas Akhir"
        description="Pangkalan data mahasiswa aktif penyusun tugas akhir program studi D3, S1, S2, dan S3 Jurusan Manajemen FEB UTM."
        statusBadge={<Badge variant="navy">Total: {sortedData.length} Mahasiswa</Badge>}
        primaryAction={
          <Button variant="secondary" icon={Download} onClick={handleExportExcel}>
            Ekspor Data (XLSX)
          </Button>
        }
      />

      {/* Ringkasan Distribusi Jenjang */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard
          label="Sarjana (S1)"
          value={countS1}
          unit="Mhs"
          caption="TAKT & TAKK Portofolio"
          tone="navy"
        />

        <StatCard
          label="Magister (S2)"
          value={countS2}
          unit="Mhs"
          caption="Tesis Magister Manajemen"
          tone="violet"
        />

        <StatCard
          label="Doktor (S3)"
          value={countS3}
          unit="Mhs"
          caption="Disertasi Doktor Manajemen"
          tone="amber"
        />

        <StatCard
          label="Diploma (D3)"
          value={countD3}
          unit="Mhs"
          caption="Tugas Akhir Terapan"
          tone="sky"
        />
      </div>

      <Panel noPadding>
        {/* Toolbar: Search & Filters */}
        <div 
          style={{ 
            padding: '14px 18px', 
            borderBottom: '1px solid #E2E8F0', 
            backgroundColor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
              Jenjang:
            </span>
            {['Semua', 'S1', 'S2', 'S3', 'D3'].map((j) => (
              <button
                key={j}
                type="button"
                onClick={() => {
                  setFilterJenjang(j);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: filterJenjang === j ? '#1E3A8A' : '#CBD5E1',
                  backgroundColor: filterJenjang === j ? '#1E3A8A' : '#FFFFFF',
                  color: filterJenjang === j ? '#FFFFFF' : '#475569',
                  fontWeight: filterJenjang === j ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {j === 'Semua' ? 'Semua Jenjang' : j}
              </button>
            ))}

            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginLeft: '8px' }}>
              Status:
            </span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#0F172A'
              }}
            >
              <option value="Semua">Semua Status</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Sedang">Sedang Berlangsung</option>
              <option value="Menunggu">Menunggu Verifikasi</option>
              <option value="Revisi">Dalam Revisi</option>
            </select>
          </div>

          <Search
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama, NIM, prodi, atau judul..."
          />
        </div>

        {/* Tabel Data Mahasiswa */}
        <Table
          density="normal"
          columns={columns}
          data={paginatedData}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          striped
          emptyContent={
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              Tidak ditemukan mahasiswa untuk kriteria pencarian tersebut.
            </div>
          }
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={sortedData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </Panel>
    </div>
  );
}
