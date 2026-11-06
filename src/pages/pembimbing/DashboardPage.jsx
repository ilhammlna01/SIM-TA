import React from 'react';
import { PageHeader } from '../../components/shell';
import {
  Panel,
  Button,
  StatusBadge,
  Badge,
  Alert,
  Table,
  StatCard,
  EmptyState
} from '../../components/ui';

import {
  FileText,
  CheckSquare,
  Users,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

/**
 * DASHBOARD PEMBIMBING / PROMOTOR / KOPROMOTOR (FASE E)
 * Memprioritaskan tugas-tugas substantif akademik dosen:
 * 1. Mahasiswa yang dibimbing
 * 2. Naskah yang perlu direview
 * 3. Bimbingan & logbook
 * 4. Approval / Persetujuan ujian
 * 5. Revisi pasca ujian
 * 6. Jadwal ujian
 * (Tanpa corporate analytics atau grafik fiktif)
 */
export default function DashboardPage({
  dosenProfile,
  mahasiswaList = [],
  naskahReviewList = [],
  approvalQueue = [],
  revisiList = [],
  jadwalUjianList = [],
  onNavigate,
  onSelectMahasiswa,
  onOpenReview
}) {
  const pendingReviewCount = naskahReviewList.filter(n => n.statusReview === 'Perlu Direview').length;
  const pendingApprovalCount = approvalQueue.filter(a => a.status === 'Menunggu Persetujuan').length;
  const upcomingExams = jadwalUjianList.filter(u => u.statusJadwal.includes('Terjadwal'));

  return (
    <div>
      {/* 1. Header Akademik Institusional */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Dosen Pembimbing / Promotor' },
          { label: 'Dashboard Tugas Akademik' }
        ]}
        title={`Dashboard Akademik: ${dosenProfile.nama}`}
        description={`${dosenProfile.jabatan} — NIP. ${dosenProfile.nip} | Keahlian: ${dosenProfile.keahlian}`}
        statusBadge={<Badge variant="navy">Semester Ganjil 2026/2027</Badge>}
        primaryAction={
          <Button variant="primary" icon={CheckSquare} onClick={() => onNavigate('persetujuan')}>
            Buka Antrean Approval ({pendingApprovalCount})
          </Button>
        }
        secondaryAction={
          <Button variant="secondary" icon={FileText} onClick={() => onNavigate('naskah')}>
            Review Naskah Masuk ({pendingReviewCount})
          </Button>
        }
      />

      {/* 2. Spanduk Peringatan Tugas Mendesak */}
      {(pendingReviewCount > 0 || pendingApprovalCount > 0) && (
        <Alert
          variant="warning"
          title="Tindakan Akademik Membutuhkan Respon Pembimbing"
          actions={
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" size="sm" onClick={() => onNavigate('persetujuan')}>
                Tindak Lanjuti Approval
              </Button>
            </div>
          }
        >
          Terdapat <strong>{pendingApprovalCount} berkas permohonan ujian</strong> dan <strong>{pendingReviewCount} draf naskah tugas akhir</strong> yang menunggu telaah dan persetujuan Anda sebelum batas penutupan periode sidang.
        </Alert>
      )}

      {/* 3. Panel Ringkasan Kerja — Stat Cards Premium */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}
        className="grid-stats-responsive"
      >
        {/* Stat: Mahasiswa Bimbingan */}
        <StatCard
          label="Mahasiswa Bimbingan"
          value={mahasiswaList.length}
          caption={mahasiswaList.length > 0 ? 'S3: 2 | S2: 1 | S1: 2 | D3: 1' : 'Belum ada mahasiswa plotting'}
          icon={Users}
          tone="navy"
          onClick={() => onNavigate('mahasiswa')}
        />
        <StatCard
          label="Naskah Perlu Review"
          value={pendingReviewCount}
          caption={pendingReviewCount > 0 ? 'Termasuk draf proposal S3' : 'Semua naskah telah direview'}
          icon={FileText}
          tone="amber"
          onClick={() => onNavigate('naskah')}
        />
        <StatCard
          label="Antrean Persetujuan"
          value={pendingApprovalCount}
          caption={pendingApprovalCount > 0 ? 'Maju Ujian & Validasi Nilai' : 'Tidak ada permohonan pending'}
          icon={CheckSquare}
          tone="sky"
          onClick={() => onNavigate('persetujuan')}
        />
        <StatCard
          label="Jadwal Ujian Terdekat"
          value={upcomingExams.length}
          caption={upcomingExams.length > 0 ? 'Sempro S1 & Sidang Tesis S2' : 'Belum ada agenda ujian'}
          icon={Calendar}
          tone="green"
          onClick={() => onNavigate('ujian')}
        />
      </div>

      {/* 4. Grid Konten Utama */}
      <div className="grid-2col-responsive" style={{ alignItems: 'stretch', gap: '20px' }}>

        {/* Kolom Kiri: Antrean Approval & Naskah Perlu Review */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Antrean Approval */}
          <Panel
            title="Antrean Persetujuan Ujian & Berkas"
            subtitle="Permohonan pengesahan naskah dan izin maju ujian dari mahasiswa bimbingan."
            icon={CheckSquare}
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('persetujuan')}>
                Lihat Semua ({approvalQueue.length})
              </Button>
            }
            noPadding
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {approvalQueue.length > 0 ? (
                approvalQueue.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '16px 20px',
                      borderBottom: idx < Math.min(approvalQueue.length, 3) - 1 ? '1px solid #f1f5f9' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-lg)', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <GraduationCap size={16} color="#1e3a8a" />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                          {item.namaMahasiswa}
                        </span>
                        <Badge variant="navy">{item.jenjang}</Badge>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                          Peran: <strong>{item.peranDosen}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#1e293b', fontWeight: '600', marginBottom: '3px' }}>
                        {item.jenisPermohonan}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                        Diajukan: {item.tanggalDiajukan} • {item.keterangan}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onNavigate('persetujuan')}
                    >
                      Periksa & Putuskan
                    </Button>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title="Tidak Ada Antrean"
                  description="Tidak ada permohonan persetujuan atau approval ujian yang tertunda saat ini."
                />
              )}
            </div>
          </Panel>

          {/* Naskah Masuk untuk Direview */}
          <Panel
            title="Naskah Menunggu Review Pembimbing"
            subtitle="Draf naskah tugas akhir yang diserahkan mahasiswa untuk pemeriksaan substansi."
            icon={FileText}
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('naskah')}>
                Daftar Naskah ({naskahReviewList.length})
              </Button>
            }
            noPadding
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {naskahReviewList.length > 0 ? (
                naskahReviewList.slice(0, 3).map((naskah, idx) => (
                  <div
                    key={naskah.id}
                    style={{
                      padding: '16px 20px',
                      borderBottom: idx < Math.min(naskahReviewList.length, 3) - 1 ? '1px solid #f1f5f9' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-lg)', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={16} color="#d97706" />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                          {naskah.namaMahasiswa}
                        </span>
                        <Badge variant="navy">{naskah.jenjang}</Badge>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Peran: <strong>{naskah.peranDosen}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', marginBottom: '5px', lineHeight: '1.35', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {naskah.judulNaskah}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#94a3b8' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                          Versi {naskah.versi}
                        </span>
                        <span>Turnitin: <strong style={{ color: naskah.similarity <= 25 ? '#16a34a' : '#d97706' }}>{naskah.similarity}%</strong></span>
                        <span>AI: <strong style={{ color: naskah.aiScore <= 25 ? '#0284c7' : '#d97706' }}>{naskah.aiScore}%</strong></span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><MessageSquare size={12} /> {naskah.jumlahKomentar}</span>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={BookOpen}
                      onClick={() => {
                        if (onOpenReview) onOpenReview(naskah.id);
                        else onNavigate('review');
                      }}
                    >
                      Buka Review
                    </Button>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={FileText}
                  title="Tidak Ada Naskah Baru"
                  description="Belum ada draf naskah tugas akhir yang diserahkan untuk review."
                />
              )}
            </div>
          </Panel>

          {/* Mahasiswa Bimbingan Aktif (Tabel Ringkas) */}
          <Panel
            title="Daftar Mahasiswa Bimbingan Aktif"
            subtitle="Ringkasan kemajuan tahapan bimbingan lintas jenjang S3, S2, S1, dan D3."
            icon={Users}
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('mahasiswa')}>
                Buka Direktori Lengkap
              </Button>
            }
            noPadding
          >
            <Table
              density="compact"
              columns={[
                { key: 'nim', label: 'NIM', width: '120px' },
                {
                  key: 'nama',
                  label: 'Nama Mahasiswa',
                  render: (val, row) => (
                    <div>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{val}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{row.programStudi}</div>
                    </div>
                  )
                },
                {
                  key: 'peranDosen',
                  label: 'Peran',
                  width: '120px',
                  render: (val) => (
                    <Badge variant={val.includes('motor') ? 'gold' : 'navy'}>
                      {val}
                    </Badge>
                  )
                },
                { key: 'tahapAktifNama', label: 'Tahapan Saat Ini', width: '180px' },
                {
                  key: 'sesiCount',
                  label: 'Bimbingan',
                  width: '110px',
                  render: (val, row) => {
                    const isComplete = val >= row.sesiMin;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '700', color: isComplete ? '#16a34a' : '#d97706' }}>
                          {val}/{row.sesiMin}
                        </span>
                        <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Sesi</span>
                      </div>
                    );
                  }
                },
                {
                  key: 'action',
                  label: 'Detail',
                  width: '80px',
                  align: 'center',
                  render: (_, row) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (onSelectMahasiswa) onSelectMahasiswa(row.id);
                        onNavigate('detail-mahasiswa');
                      }}
                    >
                      Buka
                    </Button>
                  )
                }
              ]}
              data={mahasiswaList}
              emptyContent={
                <EmptyState
                  icon={Users}
                  title="Belum Ada Data"
                  description="Belum ada mahasiswa bimbingan yang di-plotting oleh Koorprodi ke akun Anda."
                />
              }
            />
          </Panel>

        </div>

        {/* Kolom Kanan: Jadwal Ujian & Monitoring Revisi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Jadwal Sidang / Ujian Mendatang */}
          <Panel
            title="Jadwal Sidang & Ujian Mendatang"
            subtitle="Ujian mahasiswa bimbingan yang dihadiri sebagai penguji/pembimbing/promotor."
            icon={Calendar}
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('ujian')}>
                Semua Jadwal
              </Button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {jadwalUjianList.length > 0 ? (
                jadwalUjianList.map((ujian) => (
                  <div
                    key={ujian.id}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderLeft: '4px solid #1e3a8a',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,58,138,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Badge variant="navy">{ujian.jenjang}</Badge>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                          {ujian.jenisUjian}
                        </span>
                      </div>
                      <StatusBadge status={ujian.statusJadwal.includes('Terjadwal') ? 'Disetujui' : 'Selesai'} />
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#334155' }}>
                      Mahasiswa: <strong>{ujian.namaMahasiswa}</strong> ({ujian.nim})
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: '600' }}>
                      Peran: {ujian.peranDosenSidang}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {ujian.hariTanggal} • {ujian.waktu}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><MapPin size={12} /> {ujian.ruang}</span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="Tidak Ada Agenda"
                  description="Belum ada agenda jadwal sidang atau ujian mendatang."
                />
              )}
            </div>
          </Panel>

          {/* Monitoring Revisi Pasca Ujian */}
          <Panel
            title="Pemantauan Revisi Pasca Ujian"
            subtitle="Menjamin mahasiswa menyelesaikan perbaikan sesuai batas waktu 30 hari."
            icon={AlertTriangle}
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('revisi')}>
                Rincian
              </Button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {revisiList.length > 0 ? (
                revisiList.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${rev.statusRevisi.includes('Disetujui') ? '#16a34a' : '#d97706'}`,
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      transition: 'box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                        {rev.namaMahasiswa}
                      </span>
                      <StatusBadge status={rev.statusRevisi.includes('Disetujui') ? 'Disetujui' : 'Dalam Revisi'} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      {rev.jenisUjian}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#b45309', fontWeight: '600' }}>
                      <Clock size={12} />
                      Batas: {rev.batasTenggat}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.4', marginTop: '2px', backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
                      "{rev.catatanPenguji.substring(0, 95)}..."
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title="Semua Bersih"
                  description="Tidak ada mahasiswa yang sedang dalam pemantauan revisi pasca ujian."
                />
              )}
            </div>
          </Panel>

        </div>

      </div>
    </div>
  );
}
