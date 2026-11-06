import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import {
  Panel,
  Button,
  StatusBadge,
  Badge,
  Alert,
  Table,
  StatCard
} from '../../components/ui';

import {
  Users,
  CheckSquare,
  Calendar,
  AlertTriangle,
  FolderArchive,
  ArrowRight,
  GitBranch,
  Scale,
  Clock,
  FileText,
  UserCheck,
  Award,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Sparkles,
  BookOpen,
  PieChart,
  BarChart3,
  SlidersHorizontal,
  Printer
} from 'lucide-react';

/**
 * HALAMAN 1: DASHBOARD KOORPRODI (FASE F) — ELEVATED INSTITUTIONAL DESIGN
 * Pengelolaan terpadu tugas akhir tingkat program studi:
 * - Identitas kepemimpinan prodi & status akreditasi Unggul BAN-PT
 * - Verifikasi kelayakan berkas & pengajuan ujian masuk
 * - Monitoring kuota pembimbingan dosen (S1, S2, S3)
 * - Penetapan dewan penguji berpedoman Bab VI Buku Pedoman 2026
 * - Pemantauan masa revisi pasca ujian (14–30 hari kalender)
 */
export default function DashboardPage({
  koorprodiProfile,
  mahasiswaList = [],
  pengajuanList = [],
  penetapanPengujiList = [],
  dokumenList = [],
  revisiList = [],
  onNavigate,
  onSelectMahasiswa
}) {
  const [filterJenjang, setFilterJenjang] = useState('Semua');

  const pendingPengajuan = pengajuanList.filter(p => p.statusVerifikasi === 'Menunggu Verifikasi');
  const upcomingExams = penetapanPengujiList.filter(p => !p.statusSK.includes('Berita Acara Terbit'));

  const filteredPengajuan = pengajuanList.filter(p => {
    if (filterJenjang === 'Semua') return true;
    return p.jenjang === filterJenjang;
  });

  const countS1 = mahasiswaList.filter(m => m.jenjang === 'S1').length;
  const countS2 = mahasiswaList.filter(m => m.jenjang === 'S2').length;
  const countS3 = mahasiswaList.filter(m => m.jenjang === 'S3').length;
  const countD3 = mahasiswaList.filter(m => m.jenjang === 'D3').length;

  return (
    <div>
      {/* 1. Header Institusional Koorprodi */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Koorprodi' },
          { label: 'Dashboard Pengelolaan' }
        ]}
        title="Dashboard Pengelolaan Tugas Akhir"
        description={`${koorprodiProfile.jabatan} — ${koorprodiProfile.nama} (NIP. ${koorprodiProfile.nip})`}
        statusBadge={
          <div style={{ display: 'flex', gap: '6px' }}>
            <Badge variant="navy">Prodi: {koorprodiProfile.prodi || 'S-1 Manajemen'}</Badge>
            <Badge variant="neutral">Semester Ganjil 2026/2027</Badge>
          </div>
        }
        primaryAction={
          <Button variant="primary" icon={CheckSquare} onClick={() => onNavigate('pengajuan')}>
            Verifikasi Pengajuan ({pendingPengajuan.length})
          </Button>
        }
        secondaryAction={
          <Button variant="secondary" icon={Scale} onClick={() => onNavigate('penguji')}>
            Penetapan Dewan Penguji
          </Button>
        }
      />

      {/* 2. Hero Card: Kepemimpinan Akademik & Akreditasi Prodi */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 55%, #1D4ED8 100%)',
          borderRadius: '14px',
          padding: '24px 28px',
          color: '#FFFFFF',
          marginBottom: '24px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Watermark */}
        <div
          style={{
            position: 'absolute',
            right: '-15px',
            bottom: '-35px',
            opacity: 0.08,
            pointerEvents: 'none'
          }}
        >
          <Award size={230} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '18px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span
                style={{
                  backgroundColor: 'rgba(217, 119, 6, 0.25)',
                  border: '1px solid #D97706',
                  color: '#FDE68A',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Award size={12} /> AKREDITASI UNGGUL BAN-PT
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.25)',
                  border: '1px solid #60A5FA',
                  color: '#DBEAFE',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                PRODI: {koorprodiProfile.prodi || 'S-1 MANAJEMEN'}
              </span>
              <span style={{ fontSize: '12px', color: '#CBD5E1' }}>
                NIP. {koorprodiProfile.nip} • {koorprodiProfile.pangkat || 'Lektor Kepala / Pembina (IV/a)'}
              </span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.01em', color: '#FFFFFF' }}>
              Selamat Bertugas, {koorprodiProfile.nama}
            </h2>

            <p style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: 1.55, margin: '0 0 14px 0' }}>
              Pusat kendali penetapan dosen pembimbing, validasi kelayakan berkas ujian (SKS, TOEFL, Turnitin), 
              pengesahan dewan penguji sesuai <strong>Buku Pedoman FEB UTM 2026</strong>, dan pengawasan batas waktu revisi untuk <strong>Program Studi {koorprodiProfile.prodi || 'S-1 Manajemen'}</strong>.
            </p>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} color="#93C5FD" />
                <span>Total TA Prodi: <strong>{mahasiswaList.length} Mahasiswa</strong></span>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckSquare size={14} color="#FDE68A" />
                <span>Pengajuan Masuk: <strong>{pendingPengajuan.length} Menunggu</strong></span>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="#86EFAC" />
                <span>Sidang Terjadwal: <strong>{upcomingExams.length} Sidang</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '210px' }}>
            <button
              onClick={() => onNavigate('pengajuan')}
              style={{
                backgroundColor: '#D97706',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <CheckSquare size={16} />
              <span>Verifikasi Berkas ({pendingPengajuan.length})</span>
            </button>

            <button
              onClick={() => onNavigate('penerbitan-massal')}
              style={{
                backgroundColor: '#047857',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(4, 120, 87, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <Printer size={16} />
              <span>Penerbitan Dokumen Kolektif</span>
            </button>

            <button
              onClick={() => onNavigate('pembimbing')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <UserCheck size={16} />
              <span>Plotting Dosen Pembimbing</span>
            </button>

            <button
              onClick={() => onNavigate('penguji')}
              style={{
                backgroundColor: 'transparent',
                color: '#93C5FD',
                border: 'none',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>Penetapan Dewan Penguji ({penetapanPengujiList.length})</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Panel Ringkasan Metrik Kerja Koorprodi */}
      <div className="grid-stats-responsive" style={{ marginBottom: '24px', gap: '14px' }}>
        {/* Card 1: Total Mahasiswa TA */}
        <StatCard
          label="Total Mahasiswa TA"
          value={mahasiswaList.length}
          unit="Mahasiswa"
          caption={`Prodi ${koorprodiProfile.prodi || 'S-1 Manajemen'} • S1: ${countS1} • S2: ${countS2} • S3: ${countS3} • D3: ${countD3}`}
          icon={Users}
          tone="navy"
          onClick={() => onNavigate('mahasiswa')}
        />

        {/* Card 2: Pengajuan Masuk */}
        <StatCard
          label="Pengajuan Masuk"
          value={pendingPengajuan.length}
          unit="Menunggu"
          caption="Verifikasi prasyarat Pedoman 2026"
          icon={CheckSquare}
          tone="amber"
          onClick={() => onNavigate('pengajuan')}
        />

        {/* Card 3: Sidang & Ujian Terjadwal */}
        <StatCard
          label="Sidang & Ujian"
          value={upcomingExams.length}
          unit="Sidang"
          caption="Sempro, Skripsi, Tesis, Kelayakan S3"
          icon={Calendar}
          tone="sky"
          onClick={() => onNavigate('ujian')}
        />

        {/* Card 4: Pemantauan Revisi (30 Hari) */}
        <StatCard
          label="Monitoring Revisi"
          value={revisiList.length}
          unit="Mahasiswa"
          caption="Batas waktu 30 hari kalender"
          icon={AlertTriangle}
          tone="red"
          onClick={() => onNavigate('revisi')}
        />
      </div>

      {/* 3.1. Banner Otomasi Penerbitan Dokumen Sidang Kolektif */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #047857 60%, #059669 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          color: '#FFFFFF',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 14px rgba(4, 120, 87, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Printer size={26} color="#A7F3D0" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span
                style={{
                  backgroundColor: '#D1FAE5',
                  color: '#065F46',
                  fontSize: '10.5px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-md)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                EFISIENSI ADMINISTRASI — PEDOMAN 2026
              </span>
              <span style={{ fontSize: '11.5px', color: '#D1FAE5' }}>
                Batch Generator Berbasis Gelombang Sidang
              </span>
            </div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#FFFFFF' }}>
              Penerbitan Dokumen Sidang Kolektif (Batch Generator)
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#E6F4EA', maxWidth: '780px', lineHeight: 1.45 }}>
              Otomasi penerbitan 1 SK Dekan Induk Kolektif per periode gelombang, Berita Acara Ujian ber-QR Code Kriptografis, serta Surat Tugas Penguji Kolektif untuk seluruh mahasiswa terdaftar tanpa pembuatan manual satu per satu.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('penerbitan-massal')}
          style={{
            backgroundColor: '#FFFFFF',
            color: '#064E3B',
            fontWeight: '700',
            fontSize: '13px',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.15s ease'
          }}
        >
          <span>Buka Generator Dokumen Kolektif</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 4. Filter Jenjang Pills Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #E2E8F0',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="#1E3A8A" />
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Filter Program Studi &amp; Jenjang:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'Semua', label: `Semua Program Studi (${pengajuanList.length})` },
            { id: 'S1', label: `S-1 Manajemen (${pengajuanList.filter(p => p.jenjang === 'S1').length})` },
            { id: 'S2', label: `S-2 Magister (${pengajuanList.filter(p => p.jenjang === 'S2').length})` },
            { id: 'S3', label: `S-3 Doktor (${pengajuanList.filter(p => p.jenjang === 'S3').length})` },
            { id: 'D3', label: `D-III Diploma (${pengajuanList.filter(p => p.jenjang === 'D3').length})` }
          ].map(tab => {
            const isActive = filterJenjang === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterJenjang(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: isActive ? '700' : '500',
                  border: '1px solid',
                  borderColor: isActive ? '#1E3A8A' : '#CBD5E1',
                  backgroundColor: isActive ? '#1E3A8A' : '#F8FAFC',
                  color: isActive ? '#FFFFFF' : '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Grid Konten Terstruktur Utama */}
      <div className="grid-2col-responsive" style={{ alignItems: 'start', gap: '20px' }}>
        
        {/* Kolom Kiri: Pengajuan Masuk & Distribusi Tahapan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Panel Pengajuan Masuk (Prioritas Tindakan Koorprodi) */}
          <Panel
            title={`Pengajuan Ujian & Berkas Menunggu Verifikasi (${filteredPengajuan.length})`}
            subtitle="Pemeriksaan kelayakan administratif dan pemenuhan syarat sebelum penetapan jadwal."
            icon={CheckSquare}
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('pengajuan')}>
                Buka Halaman Verifikasi
              </Button>
            }
            noPadding
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredPengajuan.length > 0 ? (
                filteredPengajuan.map((aju) => (
                  <div
                    key={aju.id}
                    style={{
                      padding: '16px 18px',
                      borderBottom: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '14px',
                      backgroundColor: aju.statusVerifikasi === 'Menunggu Verifikasi' ? '#FFFFFF' : '#F8FAFC'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A' }}>
                          {aju.namaMahasiswa}
                        </span>
                        <Badge variant={aju.jenjang === 'S3' ? 'gold' : aju.jenjang === 'S2' ? 'purple' : 'navy'}>
                          {aju.jenjang}
                        </Badge>
                        {aju.jenisTA === 'TAKK' && (
                          <Badge variant="green">TAKK Bebas Skripsi</Badge>
                        )}
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          NIM. {aju.nim}
                        </span>
                      </div>

                      <div style={{ fontSize: '12.5px', color: '#1E3A8A', fontWeight: '700', marginBottom: '2px' }}>
                        {aju.jenisPengajuan}
                      </div>

                      <div style={{ fontSize: '11.5px', color: '#475569', fontStyle: 'italic', marginBottom: '4px', lineHeight: 1.35 }}>
                        "{aju.judul.length > 80 ? aju.judul.substring(0, 80) + '...' : aju.judul}"
                      </div>

                      <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>Pembimbing: <strong>{aju.pembimbing.split('(')[0]}</strong></span>
                        <span>•</span>
                        <span style={{ color: '#166534', fontWeight: '600' }}>
                          {aju.kelengkapanBerkas.length} Syarat Terlampir
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                      <StatusBadge status={aju.statusVerifikasi} />
                      <Button
                        variant={aju.statusVerifikasi === 'Menunggu Verifikasi' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => onNavigate('pengajuan')}
                      >
                        {aju.statusVerifikasi === 'Menunggu Verifikasi' ? 'Verifikasi Berkas' : 'Lihat Detail'}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                  Tidak ada permohonan pengajuan untuk jenjang yang dipilih.
                </div>
              )}
            </div>
          </Panel>

          {/* Distribusi Tahapan Terstruktur */}
          <Panel
            title="Distribusi Mahasiswa Menurut Tahapan Akademik Aktif"
            subtitle="Rekapitulasi posisi seluruh mahasiswa pada tahapan Tugas Akhir Buku Pedoman 2026."
            icon={GitBranch}
            noPadding
          >
            <Table
              density="compact"
              columns={[
                { key: 'tahap', label: 'Tahapan Akademik Resmi', width: '230px' },
                { key: 'jenjang', label: 'Cakupan Jenjang', width: '130px' },
                { key: 'jumlah', label: 'Jumlah Mahasiswa', width: '130px', render: (val) => <strong>{val} Mahasiswa</strong> },
                { key: 'statusUmum', label: 'Status Operasional', render: (val) => <StatusBadge status={val} /> }
              ]}
              data={[
                { id: '1', tahap: '1. Pengajuan Judul & Matriks Teori', jenjang: 'D3, S1, S2, S3', jumlah: 8, statusUmum: 'Disetujui' },
                { id: '2', tahap: '2. Seminar Proposal / Kualifikasi', jenjang: 'D3, S1, S2, S3', jumlah: 14, statusUmum: 'Diajukan' },
                { id: '3', tahap: '3. Penelitian & Logbook Bimbingan', jenjang: 'D3, S1, S2, S3', jumlah: 18, statusUmum: 'Dalam Revisi' },
                { id: '4', tahap: '4. Seminar Hasil / Ujian Kelayakan', jenjang: 'S2, S3', jumlah: 5, statusUmum: 'Menunggu Verifikasi' },
                { id: '5', tahap: '5. Sidang Akhir / Ujian Tertutup', jenjang: 'D3, S1, S2, S3', jumlah: 7, statusUmum: 'Disetujui' },
                { id: '6', tahap: '6. Yudisium & Verifikasi Naskah', jenjang: 'D3, S1, S2, S3', jumlah: 4, statusUmum: 'Selesai' }
              ]}
            />
          </Panel>

          {/* Jadwal Sidang Program Studi */}
          <Panel
            title="Jadwal Sidang & Ujian Mendatang Program Studi"
            subtitle="Ujian skripsi, tesis, dan proposal yang telah ditetapkan jadwal dan dewan pengujinya."
            icon={Calendar}
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('ujian')}>
                Buka Agenda Ujian ({penetapanPengujiList.length})
              </Button>
            }
            noPadding
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {penetapanPengujiList.map((uj) => (
                <div
                  key={uj.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                        {uj.mahasiswa}
                      </span>
                      <Badge variant={uj.jenjang === 'S3' ? 'gold' : uj.jenjang === 'S2' ? 'purple' : 'navy'}>
                        {uj.jenjang}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '12px', color: '#1E3A8A', fontWeight: '600' }}>
                      {uj.jenisUjian}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} color="#64748B" />
                        <span>{uj.jadwal}</span>
                      </span>
                      <span>•</span>
                      <span>{uj.ruang}</span>
                    </div>
                  </div>

                  <div>
                    <Badge variant="navy">{uj.statusSK}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

        </div>

        {/* Kolom Kanan: Rujukan Pedoman, Pemantauan Batas Waktu Revisi, & Beban Dosen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card Rujukan Regulasi Koorprodi (Buku Pedoman 2026) */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #E2E8F0',
              borderTop: '4px solid #1E3A8A',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldCheck size={18} color="#1E3A8A" />
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                Pedoman Koorprodi (FEB UTM 2026)
              </h4>
            </div>

            <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, margin: '0 0 12px 0' }}>
              Ketentuan operasional utama Koordinator Program Studi:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '10px 12px', backgroundColor: '#F0F9FF', borderRadius: 'var(--radius-lg)', border: '1px solid #BAE6FD' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0369A1', marginBottom: '2px' }}>
                  1. Kuota Pembimbingan Dosen
                </div>
                <div style={{ fontSize: '11.5px', color: '#0C4A6E', lineHeight: 1.4 }}>
                  Maksimal <strong>6 mahasiswa S1</strong>, <strong>4 mahasiswa S2</strong>, dan <strong>3 mahasiswa S3</strong> per dosen pembimbing aktif.
                </div>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: '#FEFCE8', borderRadius: 'var(--radius-lg)', border: '1px solid #FEF08A' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#854D0E', marginBottom: '2px' }}>
                  2. Ambang Lulus &amp; Evaluasi Rubrik
                </div>
                <div style={{ fontSize: '11.5px', color: '#713F12', lineHeight: 1.4 }}>
                  • D3 &amp; S1: Ambang lulus minimal <strong>Grade C (NA ≥ 56.00)</strong>.<br />
                  • S2 &amp; S3: Ambang lulus minimal <strong>Grade B (NA ≥ 70.00)</strong>.<br />
                  • Selisih nilai antar penguji tidak boleh &gt; 10 poin.
                </div>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: '#FDF2F8', borderRadius: 'var(--radius-lg)', border: '1px solid #FBCFE8' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#9D174D', marginBottom: '2px' }}>
                  3. Skema TAKK Bab VI (Bebas Skripsi)
                </div>
                <div style={{ fontSize: '11.5px', color: '#831843', lineHeight: 1.4 }}>
                  Prestasi nasional (Juara KIBM/PKM/SINTA) dengan akumulasi <strong>≥ 80 poin</strong> dikonversi langsung menjadi <strong>Nilai A</strong> melalui SK Dekan.
                </div>
              </div>
            </div>
          </div>

          {/* Pemantauan Masa Revisi (30 Hari) */}
          <Panel
            title="Pemantauan Batas Waktu Revisi Pasca Ujian"
            subtitle="Memastikan perbaikan diselesaikan mahasiswa dalam rentang 30 hari kalender."
            icon={AlertTriangle}
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('revisi')}>
                Semua Revisi
              </Button>
            }
            noPadding
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {revisiList.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '700', fontSize: '12.5px', color: '#0F172A' }}>
                      {rev.namaMahasiswa}
                    </span>
                    <Badge variant={rev.jenjang === 'S3' ? 'gold' : 'navy'}>{rev.jenjang}</Badge>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#1E3A8A', fontWeight: '600' }}>
                    {rev.jenisUjian}
                  </div>
                  <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} color="#DC2626" />
                    <span>Tenggat Pengesahan: {rev.batasTenggat}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic' }}>
                    "{rev.catatanPenguji.substring(0, 85)}..."
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Arsip Dokumen Program Studi */}
          <Panel
            title="Dokumen &amp; Berita Acara Terbaru"
            subtitle="Arsip penetapan SK Dekan dan Berita Acara sidang tingkat program studi."
            icon={FolderArchive}
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('dokumen')}>
                Buka Arsip ({dokumenList.length})
              </Button>
            }
            noPadding
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {dokumenList.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>
                      {doc.namaDokumen}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      {doc.kategori} • {doc.tanggal}
                    </div>
                  </div>
                  <Badge variant="neutral">{doc.status}</Badge>
                </div>
              ))}
            </div>
          </Panel>

        </div>

      </div>
    </div>
  );
}
