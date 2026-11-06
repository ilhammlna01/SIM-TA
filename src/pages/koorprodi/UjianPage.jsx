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
  Modal,
  FormField,
  Input,
  Select,
  DateInput
} from '../../components/ui';

import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Plus,
  Eye,
  Download,
  Award,
  BookOpen,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Printer,
  Building
} from 'lucide-react';
import { downloadBeritaAcara } from '../../utils/pdfDownloader';

import { INITIAL_PENETAPAN_PENGUJI } from '../../data/koorprodiData';

/**
 * HALAMAN: UJIAN & BERITA ACARA KOORPRODI (FASE F)
 * Pengelolaan Penjadwalan & Pelaksanaan Sidang Jurusan Manajemen FEB UTM:
 * - Seminar Proposal, Sidang Skripsi, Ujian Kelayakan S3, Sidang Tesis, Ujian Tertutup
 * - Penugasan ruangan sidang, verifikasi komposisi dewan penguji, dan penerbitan Berita Acara
 * - Berpedoman pada Buku Pedoman Tugas Akhir FEB UTM 2026 Bab VI Hal 68-75
 */
export default function UjianPage({
  ujianList = INITIAL_PENETAPAN_PENGUJI,
  onNavigate,
  currentProdi = 'S-1 Manajemen'
}) {
  const [dataUjian, setDataUjian] = useState(ujianList);
  const [activeJenjang, setActiveJenjang] = useState('Semua');
  const [activeStatusBA, setActiveStatusBA] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUjianDetail, setSelectedUjianDetail] = useState(null);

  useEffect(() => {
    setDataUjian(ujianList);
  }, [ujianList]);

  // Form State untuk Jadwalkan Sidang Baru
  const [newJadwal, setNewJadwal] = useState({
    jenjang: 'S1',
    jenisUjian: 'Seminar Proposal Skripsi',
    mahasiswaNama: '',
    nim: '',
    judul: '',
    tanggal: '',
    waktuMulai: '09:00',
    waktuSelesai: '10:30',
    ruang: 'R. Sidang Jurusan Manajemen Lantai 2'
  });

  // Filter Data
  const filteredUjian = dataUjian.filter((item) => {
    const matchJenjang = activeJenjang === 'Semua' || item.jenjang === activeJenjang;
    const matchStatus =
      activeStatusBA === 'Semua' ||
      (activeStatusBA === 'Terbit' && item.statusSK.toLowerCase().includes('berita acara')) ||
      (activeStatusBA === 'SK Ditetapkan' && item.statusSK.toLowerCase().includes('sk ditetapkan')) ||
      (activeStatusBA === 'Draf' && item.statusSK.toLowerCase().includes('draf'));
    const matchSearch =
      item.mahasiswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.jenisUjian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ruang.toLowerCase().includes(searchQuery.toLowerCase());
    return matchJenjang && matchStatus && matchSearch;
  });

  // Statistik Ringkas
  const totalAgenda = dataUjian.length;
  const s1Count = dataUjian.filter(u => u.jenjang === 'S1' || u.jenjang === 'D3').length;
  const pascaCount = dataUjian.filter(u => u.jenjang === 'S2' || u.jenjang === 'S3').length;
  const baTerbitCount = dataUjian.filter(u => u.statusSK.toLowerCase().includes('berita acara')).length;

  const handleCreateJadwal = (e) => {
    e.preventDefault();
    if (!newJadwal.mahasiswaNama || !newJadwal.judul || !newJadwal.tanggal) {
      notify('Mohon lengkapi nama mahasiswa, judul naskah, dan tanggal pelaksanaan sidang.', { variant: 'warning' });
      return;
    }

    const defaultPengujiByJenjang = {
      S1: [
        { nomor: 1, peran: 'Ketua Penguji (Pembimbing)', nama: 'Dra. Hj. S. Anugrahini Irawati, M.M.', nip: '196203031988032001', statusKonfirmasi: 'Bersedia' },
        { nomor: 2, peran: 'Penguji Utama', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002', statusKonfirmasi: 'Bersedia' },
        { nomor: 3, peran: 'Anggota Penguji', nama: 'Aprilina Susandini, S.E., M.SM.', nip: '198704162015042005', statusKonfirmasi: 'Bersedia' }
      ],
      S2: [
        { nomor: 1, peran: 'Pemimpin Sidang (Pembimbing II)', nama: 'Dr. Rita Mutiarni, S.E., M.M.', nip: '197903212006042001', statusKonfirmasi: 'Bersedia' },
        { nomor: 2, peran: 'Pembimbing I', nama: 'Dr. H. Slamet Subari, S.E., M.Si.', nip: '196504121991031003', statusKonfirmasi: 'Bersedia' },
        { nomor: 3, peran: 'Penguji Ahli I (Bukan Pembimbing)', nama: 'Dr. Faidal, S.E., M.M.', nip: '197703032003121002', statusKonfirmasi: 'Bersedia' },
        { nomor: 4, peran: 'Penguji Ahli II (Bukan Pembimbing)', nama: 'Dr. Mochammad Isa Anshori, S.E., M.Si.', nip: '197003222005011003', statusKonfirmasi: 'Bersedia' }
      ],
      S3: [
        { nomor: 1, peran: 'Pemimpin Sidang', nama: 'Dekan FEB UTM / Wakil Dekan I', nip: '196811231994031001', statusKonfirmasi: 'Bersedia' },
        { nomor: 2, peran: 'Promotor', nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.', nip: '196306231989031002', statusKonfirmasi: 'Bersedia' },
        { nomor: 3, peran: 'Kopromotor', nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', nip: '196206231988112001', statusKonfirmasi: 'Bersedia' },
        { nomor: 4, peran: 'Penguji Internal 1', nama: 'Prof. Dr. H. Muh. Syarif, Drs.Ec., M.Si.', nip: '196311302001121001', statusKonfirmasi: 'Bersedia' },
        { nomor: 5, peran: 'Penguji Internal 2', nama: 'Dr. Helmi Buyung Aulia Safrizal, ST., SE., M.M.T.', nip: '197805152006041002', statusKonfirmasi: 'Bersedia' },
        { nomor: 6, peran: 'Penguji Internal 3', nama: 'Dr. Bambang Setiyo Pambudi, S.E., M.M.', nip: '197309272003121001', statusKonfirmasi: 'Bersedia' },
        { nomor: 7, peran: 'Penguji Eksternal (Luar UTM)', nama: 'Prof. Dr. Badri Munir Sukoco, S.E., MBA., Ph.D. (UNAIR)', nip: 'Eksternal-UNAIR', statusKonfirmasi: 'Menunggu Surat Dekan' }
      ]
    };

    const newEntry = {
      id: `uji-${Date.now()}`,
      sidangId: `sdg-${newJadwal.jenjang.toLowerCase()}-${Date.now().toString().slice(-3)}`,
      jenjang: newJadwal.jenjang,
      jenisUjian: newJadwal.jenisUjian,
      mahasiswa: `${newJadwal.mahasiswaNama} (${newJadwal.nim || '210211100xxx'})`,
      judul: newJadwal.judul,
      pedomanRule: newJadwal.jenjang === 'S3' ? 'S3: 7 Penguji (Internal & Eksternal Luar UTM)' : newJadwal.jenjang === 'S2' ? 'S2: 4 Penguji (2 Pembimbing + 2 Penguji Ahli)' : 'S1: 3 Penguji (Ketua, Utama, Anggota)',
      jadwal: `${newJadwal.tanggal} (${newJadwal.waktuMulai} - ${newJadwal.waktuSelesai} WIB)`,
      ruang: newJadwal.ruang,
      susunanPenguji: defaultPengujiByJenjang[newJadwal.jenjang] || defaultPengujiByJenjang.S1,
      statusSK: 'SK Ditetapkan Koorprodi'
    };

    setDataUjian([newEntry, ...dataUjian]);
    setIsModalOpen(false);
    notify(`Jadwal sidang untuk ${newJadwal.mahasiswaNama} berhasil diterbitkan dengan nomor agenda ${newEntry.sidangId}.`, { variant: 'success' });
  };

  const columns = [
    {
      key: 'jadwal',
      label: 'Jadwal & Ruang Sidang',
      width: '230px',
      render: (_, row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} style={{ color: 'var(--color-brand-primary)' }} />
            <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)', fontSize: '12px' }}>
              {row.jadwal.split('(')[0]}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
            <Clock size={11} style={{ color: 'var(--color-text-muted)' }} />
            <span>{row.jadwal.includes('(') ? row.jadwal.substring(row.jadwal.indexOf('(')) : 'Waktu Terjadwal'}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#1E3A8A', backgroundColor: '#EFF6FF', padding: '2px 6px', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', border: '1px solid #DBEAFE' }}>
            <Building size={11} />
            <span>{row.ruang}</span>
          </div>
        </div>
      )
    },
    {
      key: 'jenisUjian',
      label: 'Jenis Ujian & Jenjang',
      width: '190px',
      render: (val, row) => {
        const badgeColor = row.jenjang === 'S3' ? 'gold' : row.jenjang === 'S2' ? 'purple' : 'navy';
        return (
          <div>
            <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-navy-900)', fontSize: '12.5px' }}>
              {val}
            </div>
            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Badge variant={badgeColor}>Jenjang {row.jenjang}</Badge>
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
              ID: {row.sidangId}
            </div>
          </div>
        );
      }
    },
    {
      key: 'mahasiswa',
      label: 'Mahasiswa & Judul Penelitian',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)', fontSize: '13px' }}>
            {row.mahasiswa}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
            {row.judul}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
            Rujukan: {row.pedomanRule}
          </div>
        </div>
      )
    },
    {
      key: 'dewan',
      label: 'Dewan Penguji',
      width: '210px',
      render: (_, row) => {
        const totalPenguji = row.susunanPenguji.length;
        const ketua = row.susunanPenguji[0]?.nama || 'Belum Ditentukan';
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={13} style={{ color: 'var(--color-brand-primary)' }} />
              <span style={{ fontSize: '12px', color: 'var(--color-brand-primary)', fontWeight: 'var(--font-weight-bold)' }}>
                {totalPenguji} Penguji Resmi
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--primitive-navy-900)', marginTop: '3px', lineHeight: 1.3 }}>
              <strong>Ketua/P1:</strong> {ketua.split(',')[0]}
            </div>
            {row.susunanPenguji[1] && (
              <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                <strong>Anggota 1:</strong> {row.susunanPenguji[1]?.nama.split(',')[0]}
              </div>
            )}
            {row.susunanPenguji.some(p => p.peran.includes('Eksternal')) && (
              <div style={{ marginTop: '3px' }}>
                <span style={{ fontSize: '10px', backgroundColor: '#FEF3C7', color: '#B45309', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                  Ada Penguji Eksternal UNAIR
                </span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'statusSK',
      label: 'Status Berita Acara',
      width: '170px',
      render: (val) => {
        const isSelesai = val.toLowerCase().includes('berita acara terbit');
        const isDraf = val.toLowerCase().includes('draf');
        return (
          <div>
            <StatusBadge status={isSelesai ? 'Selesai' : isDraf ? 'Dalam Proses' : 'Disetujui'} />
            <div style={{ fontSize: '11px', color: isSelesai ? '#166534' : 'var(--color-text-secondary)', marginTop: '3px', fontWeight: isSelesai ? 'bold' : 'normal' }}>
              {val}
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
        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'center' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedUjianDetail(row)}
          >
            Rincian & BA
          </Button>
          <IconButton
            icon={Printer}
            label="Cetak Berita Acara Resmi"
            size="sm"
            bordered
            onClick={() => downloadBeritaAcara({ nama: row.mahasiswa, nim: row.nim, judul: row.judul, prodi: 'Manajemen FEB UTM' }, row)}
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
          { label: 'Jadwal & Berita Acara Sidang' }
        ]}
        title="Pengelolaan Ujian & Berita Acara Sidang"
        description="Penetapan jadwal resmi, alokasi ruang ujian sidang, verifikasi komposisi dewan penguji, dan penerbitan Berita Acara Sidang Jurusan Manajemen FEB UTM."
        statusBadge={<Badge variant="navy">Total: {totalAgenda} Agenda Sidang</Badge>}
        primaryAction={
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Jadwalkan Sidang Baru
          </Button>
        }
      />

      {/* 4 Stat Cards Ringkasan Sidang */}
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
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Total Agenda Sidang</span>
            <Calendar size={18} style={{ color: 'var(--color-brand-primary)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '4px' }}>
            {totalAgenda}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Seluruh jenjang program studi
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Sidang S-1 / Sarjana</span>
            <GraduationCap size={18} style={{ color: '#2563EB' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1D4ED8', marginTop: '4px' }}>
            {s1Count}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Proposal & Skripsi (3 Penguji)
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Sidang Pascasarjana (S2 & S3)</span>
            <Award size={18} style={{ color: '#7C3AED' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6D28D9', marginTop: '4px' }}>
            {pascaCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Tesis (4) & Disertasi (3/7 Penguji)
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Berita Acara Terbit Sah</span>
            <CheckCircle size={18} style={{ color: '#16A34A' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#15803D', marginTop: '4px' }}>
            {baTerbitCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Nilai diakui & revisi dipantau
          </div>
        </div>
      </div>

      {/* Banner Regulasi Pedoman 2026 */}
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
        <BookOpen size={24} style={{ color: '#1D4ED8', flexShrink: 0 }} />
        <div style={{ fontSize: '12px', color: '#1E3A8A', lineHeight: 1.5 }}>
          <strong>Ketentuan Pelaksanaan Ujian (Buku Pedoman 2026 Bab VI Hal 68–75):</strong> Sidang Sarjana (S1) berdurasi 90 menit dengan 3 dewan penguji. Sidang Tesis (S2) berdurasi 120 menit dengan 4 dewan penguji. Ujian Tertutup Disertasi (S3) melibatkan 7 penguji (termasuk 1 penguji eksternal luar UTM) dengan nilai kelulusan minimal 75.00 (B+).
        </div>
      </div>

      <Panel noPadding>
        {/* Filter Toolbar */}
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
              { id: 'S1', label: 'S-1 Manajemen' },
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

          {/* Filter Status BA & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <select
              value={activeStatusBA}
              onChange={(e) => setActiveStatusBA(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '11.5px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                backgroundColor: 'var(--color-surface-panel)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="Semua">Semua Status Berita Acara</option>
              <option value="Terbit">Berita Acara Terbit</option>
              <option value="SK Ditetapkan">SK Ditetapkan</option>
              <option value="Draf">Draf Susunan Penguji</option>
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mahasiswa, judul, ruang..."
              style={{
                padding: '4px 10px',
                fontSize: '11.5px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                backgroundColor: 'var(--color-surface-panel)',
                width: '210px'
              }}
            />
          </div>
        </div>

        {/* Tabel Agenda Sidang */}
        <Table
          density="normal"
          columns={columns}
          data={filteredUjian}
          striped
        />
      </Panel>

      {/* Modal Rincian Sidang & Dokumen Berita Acara */}
      {selectedUjianDetail && (
        <Modal
          isOpen={!!selectedUjianDetail}
          onClose={() => setSelectedUjianDetail(null)}
          title={`Berita Acara & Rincian Sidang: ${selectedUjianDetail.jenisUjian}`}
          size="lg"
          footer={
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                Koorprodi: Dr. Hj. Siti Aminah, S.E., M.Si.
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="secondary" onClick={() => setSelectedUjianDetail(null)}>
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  icon={Printer}
                  onClick={() => downloadBeritaAcara({ nama: selectedUjianDetail.mahasiswa, nim: selectedUjianDetail.nim, judul: selectedUjianDetail.judul, prodi: 'Manajemen FEB UTM' }, selectedUjianDetail)}
                >
                  Cetak Berita Acara Resmi (PDF)
                </Button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Header Dokumen Resmi FEB UTM */}
            <div 
              style={{ 
                padding: 'var(--space-3)', 
                border: '2px solid var(--primitive-navy-900)', 
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#FAFAFA',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', textTransform: 'uppercase' }}>
                KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', textTransform: 'uppercase' }}>
                UNIVERSITAS TRUNOJOYO MADURA — FAKULTAS EKONOMI DAN BISNIS
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-brand-primary)', textTransform: 'uppercase' }}>
                JURUSAN MANAJEMEN — PROGRAM STUDI {selectedUjianDetail.jenjang === 'S3' ? 'DOKTOR ILMU MANAJEMEN' : selectedUjianDetail.jenjang === 'S2' ? 'MAGISTER MANAJEMEN' : 'S1 MANAJEMEN'}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Gedung Graha Utama Lt. 2, Jl. Raya Telang PO BOX 2 Kamal, Bangkalan - Madura
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--primitive-navy-900)', margin: '8px 0' }} />
              <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                BERITA ACARA {selectedUjianDetail.jenisUjian.toUpperCase()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                Nomor Register: BA/{selectedUjianDetail.sidangId}/FEB-UTM/2026
              </div>
            </div>

            {/* Informasi Pelaksanaan & Mahasiswa */}
            <div className="grid-2col-responsive" style={{ gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Identitas Mahasiswa Teruji:
                </span>
                <div style={{ fontSize: '14px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)', marginTop: '2px' }}>
                  {selectedUjianDetail.mahasiswa}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-brand-primary)', marginTop: '2px' }}>
                  Jenjang {selectedUjianDetail.jenjang} — Status: {selectedUjianDetail.statusSK}
                </div>
              </div>

              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Waktu & Tempat Pelaksanaan:
                </span>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '2px' }}>
                  {selectedUjianDetail.jadwal}
                </div>
                <div style={{ fontSize: '11.5px', color: '#1E3A8A', marginTop: '2px' }}>
                  Lokasi: {selectedUjianDetail.ruang}
                </div>
              </div>
            </div>

            {/* Judul Tugas Akhir */}
            <div style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', backgroundColor: '#FFFFFF' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Judul Tugas Akhir / Tesis / Disertasi:
              </span>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '3px', lineHeight: 1.4 }}>
                {selectedUjianDetail.judul}
              </div>
            </div>

            {/* Susunan Dewan Penguji & Nilai */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--primitive-navy-950)', fontWeight: 'bold' }}>
                  Susunan Dewan Penguji (Pedoman 2026 Bab VI Hal 68–71):
                </span>
                <Badge variant={selectedUjianDetail.jenjang === 'S3' ? 'gold' : 'navy'}>
                  {selectedUjianDetail.susunanPenguji.length} Anggota Penguji
                </Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedUjianDetail.susunanPenguji.map((p, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '8px 12px', 
                      border: '1px solid var(--color-border-subtle)', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '12px', 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: p.peran.includes('Eksternal') ? '#FFFBEB' : '#FFFFFF'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 'bold', color: 'var(--primitive-navy-900)' }}>
                        {p.nomor || idx + 1}. {p.peran}:
                      </span>{' '}
                      <span style={{ color: 'var(--primitive-navy-950)' }}>{p.nama}</span>
                      <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                        NIP/ID: {p.nip}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Badge variant={p.statusKonfirmasi.includes('Bersedia') || p.statusKonfirmasi.includes('Selesai') ? 'success' : 'warning'}>
                        {p.statusKonfirmasi}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Catatan / Keterangan Koorprodi */}
            <div style={{ padding: 'var(--space-3)', backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 'var(--radius-sm)', fontSize: '11.5px', color: '#166534' }}>
              <strong>Keterangan Pengesahan Koorprodi:</strong> Seluruh berkas prasyarat (SKS, TOEFL, Turnitin, Naskah) telah diverifikasi sah. Mahasiswa wajib menyelesaikan revisi selambat-lambatnya 30 hari kalender setelah tanggal pelaksanaan ujian.
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Jadwalkan Sidang Baru */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Jadwalkan Sidang Tugas Akhir Baru (Sesuai Pedoman 2026)"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleCreateJadwal}>
              Terbitkan Jadwal & SK Penguji
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="grid-2col-responsive" style={{ gap: 'var(--space-3)' }}>
            <FormField id="mhs-jenjang" label="Jenjang Program Studi" required>
              <Select
                value={newJadwal.jenjang}
                onChange={(e) => {
                  const val = e.target.value;
                  let defUjian = 'Seminar Proposal Skripsi';
                  let defRuang = 'R. Sidang Jurusan Manajemen Lantai 2';
                  if (val === 'S2') {
                    defUjian = 'Sidang Tesis Magister';
                    defRuang = 'R. Ujian Pascasarjana Lantai 3';
                  } else if (val === 'S3') {
                    defUjian = 'Ujian Tertutup Disertasi';
                    defRuang = 'R. Sidang Utama Rektorat / Pascasarjana';
                  }
                  setNewJadwal({ ...newJadwal, jenjang: val, jenisUjian: defUjian, ruang: defRuang });
                }}
                options={[
                  { value: 'S1', label: 'S-1 Manajemen (3 Penguji)' },
                  { value: 'S2', label: 'S-2 Magister Manajemen (4 Penguji)' },
                  { value: 'S3', label: 'S-3 Doktor Ilmu Manajemen (7 Penguji)' }
                ]}
              />
            </FormField>

            <FormField id="jenis-ujian-pilih" label="Jenis Ujian / Tahapan Sidang" required>
              <Select
                value={newJadwal.jenisUjian}
                onChange={(e) => setNewJadwal({ ...newJadwal, jenisUjian: e.target.value })}
                options={
                  newJadwal.jenjang === 'S3' ? [
                    { value: 'Ujian Kualifikasi Disertasi', label: 'Ujian Kualifikasi Disertasi' },
                    { value: 'Ujian Proposal Disertasi', label: 'Ujian Proposal Disertasi' },
                    { value: 'Ujian Kelayakan Disertasi (Desk Review)', label: 'Ujian Kelayakan Disertasi (Desk Review)' },
                    { value: 'Ujian Tertutup Disertasi', label: 'Ujian Tertutup Disertasi (7 Penguji)' },
                    { value: 'Promosi Doktor / Terbuka', label: 'Promosi Doktor / Terbuka' }
                  ] : newJadwal.jenjang === 'S2' ? [
                    { value: 'Seminar Proposal Tesis', label: 'Seminar Proposal Tesis' },
                    { value: 'Sidang Tesis Magister', label: 'Sidang Tesis Magister (4 Penguji)' }
                  ] : [
                    { value: 'Seminar Proposal Skripsi', label: 'Seminar Proposal Skripsi (3 Penguji)' },
                    { value: 'Sidang Skripsi Akhir', label: 'Sidang Skripsi Akhir (3 Penguji)' },
                    { value: 'Ujian Portofolio TAKK', label: 'Ujian Portofolio TAKK Bebas Skripsi' }
                  ]
                }
              />
            </FormField>
          </div>

          <div className="grid-2col-responsive" style={{ gap: 'var(--space-3)' }}>
            <FormField id="nama-mhs-input" label="Nama Mahasiswa Terdaftar" required>
              <Input
                placeholder="Contoh: Siti Aisyah"
                value={newJadwal.mahasiswaNama}
                onChange={(e) => setNewJadwal({ ...newJadwal, mahasiswaNama: e.target.value })}
              />
            </FormField>

            <FormField id="nim-mhs-input" label="NIM Mahasiswa" required>
              <Input
                placeholder="Contoh: 210211100155"
                value={newJadwal.nim}
                onChange={(e) => setNewJadwal({ ...newJadwal, nim: e.target.value })}
              />
            </FormField>
          </div>

          <FormField id="judul-naskah-input" label="Judul Naskah Disetujui" required>
            <Input
              placeholder="Masukkan judul tugas akhir / tesis / disertasi yang telah disahkan..."
              value={newJadwal.judul}
              onChange={(e) => setNewJadwal({ ...newJadwal, judul: e.target.value })}
            />
          </FormField>

          <div className="grid-3col-responsive" style={{ gap: 'var(--space-3)' }}>
            <FormField id="tanggal-sidang" label="Hari & Tanggal" required>
              <Input
                placeholder="Contoh: Kamis, 22 Oktober 2026"
                value={newJadwal.tanggal}
                onChange={(e) => setNewJadwal({ ...newJadwal, tanggal: e.target.value })}
              />
            </FormField>

            <FormField id="jam-mulai" label="Waktu Mulai" required>
              <Input
                type="time"
                value={newJadwal.waktuMulai}
                onChange={(e) => setNewJadwal({ ...newJadwal, waktuMulai: e.target.value })}
              />
            </FormField>

            <FormField id="jam-selesai" label="Waktu Selesai" required>
              <Input
                type="time"
                value={newJadwal.waktuSelesai}
                onChange={(e) => setNewJadwal({ ...newJadwal, waktuSelesai: e.target.value })}
              />
            </FormField>
          </div>

          <FormField id="ruang-sidang-select" label="Ruang Sidang Resmi" required>
            <Select
              value={newJadwal.ruang}
              onChange={(e) => setNewJadwal({ ...newJadwal, ruang: e.target.value })}
              options={[
                { value: 'R. Sidang Jurusan Manajemen Lantai 2', label: 'R. Sidang Jurusan Manajemen Lantai 2 (S-1 / D-3)' },
                { value: 'R. Ujian Pascasarjana Lantai 3', label: 'R. Ujian Pascasarjana Lantai 3 (S-2 Magister)' },
                { value: 'R. Sidang Utama Rektorat / Pascasarjana', label: 'R. Sidang Utama Rektorat / Pascasarjana (S-3 Doktor)' },
                { value: 'Online Zoom Meeting Hybrid FEB', label: 'Ruang Ujian Virtual / Hybrid Zoom FEB UTM' }
              ]}
            />
          </FormField>

          <div style={{ padding: 'var(--space-3)', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-sm)', fontSize: '11.5px', color: '#1E3A8A' }}>
            <strong>Komposisi Dewan Penguji Otomatis:</strong> Berdasarkan jenjang {newJadwal.jenjang}, sistem akan menetapkan {newJadwal.jenjang === 'S3' ? '7 Penguji (termasuk Promotor & Penguji Eksternal)' : newJadwal.jenjang === 'S2' ? '4 Penguji (2 Pembimbing + 2 Penguji Ahli)' : '3 Penguji (Ketua Pembimbing, Penguji Utama, Anggota)'} sesuai Buku Pedoman 2026.
          </div>
        </div>
      </Modal>
    </div>
  );
}

