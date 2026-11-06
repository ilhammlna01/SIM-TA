import React from 'react';
import {
  FileCheck2,
  FileBadge2,
  DoorOpen,
  Users,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  ExternalLink
} from 'lucide-react';
import { Card, Badge, Button, StatusBadge } from '../../components/ui';
import { PageHeader } from '../../components/shell';

export default function DashboardPage({
  adminProfile,
  verifikasiList = [],
  skList = [],
  ruanganList = [],
  jadwalList = [],
  onNavigate
}) {
  const pendingBerkas = verifikasiList.filter(v => v.statusVerifikasi === 'Menunggu Verifikasi');
  const lolosBerkas = verifikasiList.filter(v => v.statusVerifikasi === 'Terverifikasi Lolos');
  const perbaikanBerkas = verifikasiList.filter(v => v.statusVerifikasi === 'Perlu Perbaikan');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header Akademik Institusional Terstandarisasi */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate && onNavigate('dashboard') },
          { label: 'Admin Akademik' },
          { label: 'Dashboard Operasional' }
        ]}
        title={`Dashboard Operasional: ${adminProfile?.nama || 'Ahmad Fauzi, S.Kom., M.T.'}`}
        description={`${adminProfile?.jabatan || 'Kepala Subbagian Administrasi Akademik FEB UTM'}. Verifikasi berkas pendaftaran ujian, penerbitan SK formal dekan, dan alokasi ruang sidang.`}
        statusBadge={<Badge variant="warning">PORTAL ADMINISTRASI AKADEMIK</Badge>}
        primaryAction={
          <Button
            variant="primary"
            icon={FileCheck2}
            onClick={() => onNavigate && onNavigate('verifikasi')}
          >
            Verifikasi Berkas ({pendingBerkas.length})
          </Button>
        }
        secondaryAction={
          <Button
            variant="secondary"
            icon={Calendar}
            onClick={() => onNavigate && onNavigate('jadwal-tahapan')}
          >
            Jadwal Tahapan ({jadwalList.filter(j => j.status === 'Sedang Dibuka').length})
          </Button>
        }
      />

      {/* 2. Stat Cards Ringkasan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--primitive-amber-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                Berkas Menunggu Verifikasi
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-amber-700)', marginTop: 'var(--space-1)' }}>
                {pendingBerkas.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Perlu review syarat ujian
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-amber-50)', color: 'var(--primitive-amber-700)' }}>
              <Clock size={22} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--primitive-green-600)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                Terverifikasi Lolos
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-green-700)', marginTop: 'var(--space-1)' }}>
                {lolosBerkas.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Siap plotting ruang & jadwal
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-green-50)', color: 'var(--primitive-green-700)' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--primitive-blue-600)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                SK Resmi Diterbitkan
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-800)', marginTop: 'var(--space-1)' }}>
                {skList.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                SK Pembimbing & Penguji FEB
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-blue-50)', color: 'var(--primitive-blue-700)' }}>
              <FileBadge2 size={22} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--primitive-navy-600)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                Alokasi Ruang Sidang
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-800)', marginTop: 'var(--space-1)' }}>
                {ruanganList.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Jadwal terkonfirmasi aktif
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-navy-50)', color: 'var(--primitive-navy-700)' }}>
              <DoorOpen size={22} />
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Dua Kolom: Pendaftaran Ujian Masuk & Alokasi Ruang Sidang */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 'var(--space-6)' }}>
        
        {/* Kolom Kiri: Pendaftaran Ujian Masuk */}
        <Card style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--type-title-size)', margin: 0, color: 'var(--primitive-navy-950)' }}>
                Pendaftaran Ujian Masuk
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>
                Berkas mahasiswa yang memerlukan validasi persyaratan administratif
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => onNavigate && onNavigate('verifikasi')}
            >
              Lihat Semua
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {verifikasiList.slice(0, 4).map((item) => (
              <div
                key={item.id}
                style={{
                  padding: 'var(--space-3)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-surface-panel-alt)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--space-3)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '13.5px', color: 'var(--primitive-navy-950)' }}>
                      {item.namaMahasiswa}
                    </span>
                    <Badge variant={item.jenjang === 'S3' ? 'error' : item.jenjang === 'S2' ? 'warning' : 'info'}>
                      {item.jenjang}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    NIM. {item.nim} · {item.jenisUjian}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Daftar: {item.tanggalDaftar} · {item.berkasList?.length || 0} Dokumen
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-semibold)',
                      backgroundColor:
                        item.statusVerifikasi === 'Terverifikasi Lolos'
                          ? 'var(--primitive-green-50)'
                          : item.statusVerifikasi === 'Perlu Perbaikan'
                          ? 'var(--primitive-red-50)'
                          : 'var(--primitive-amber-50)',
                      color:
                        item.statusVerifikasi === 'Terverifikasi Lolos'
                          ? 'var(--primitive-green-700)'
                          : item.statusVerifikasi === 'Perlu Perbaikan'
                          ? 'var(--primitive-red-700)'
                          : 'var(--primitive-amber-800)',
                      border: '1px solid',
                      borderColor:
                        item.statusVerifikasi === 'Terverifikasi Lolos'
                          ? 'var(--primitive-green-200)'
                          : item.statusVerifikasi === 'Perlu Perbaikan'
                          ? 'var(--primitive-red-200)'
                          : 'var(--primitive-amber-200)'
                    }}
                  >
                    {item.statusVerifikasi}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate && onNavigate('verifikasi')}
                    style={{ fontSize: '11.5px', textDecoration: 'underline', padding: '2px 6px', height: 'auto' }}
                  >
                    Periksa Berkas
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Kolom Kanan: Jadwal Alokasi Ruang Sidang */}
        <Card style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--type-title-size)', margin: 0, color: 'var(--primitive-navy-950)' }}>
                Alokasi Ruang Sidang Terjadwal
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>
                Pemanfaatan ruang sidang luring & link virtual Zoom
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => onNavigate && onNavigate('ruangan')}
            >
              Kelola Ruangan
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {ruanganList.map((slot) => (
              <div
                key={slot.id}
                style={{
                  padding: 'var(--space-3)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  gap: 'var(--space-3)',
                  alignItems: 'flex-start'
                }}
              >
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: slot.moda === 'Luring' ? 'var(--primitive-navy-50)' : 'var(--primitive-blue-50)',
                    color: slot.moda === 'Luring' ? 'var(--primitive-navy-800)' : 'var(--primitive-blue-700)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}
                >
                  <Calendar size={16} />
                  <span style={{ fontSize: '11px', fontWeight: 'var(--font-weight-bold)', marginTop: '2px' }}>
                    {slot.tanggal?.split('-')[2] || '12'} Okt
                  </span>
                  <span style={{ fontSize: '10px' }}>{slot.jamMulai}</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: '13px', color: 'var(--primitive-navy-950)' }}>
                      {slot.ruangNama}
                    </span>
                    <Badge variant={slot.moda === 'Luring' ? 'neutral' : 'info'}>
                      {slot.moda}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {slot.namaMahasiswa} ({slot.nim}) — <em>{slot.jenisUjian}</em>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Ketua Penguji: {slot.ketuaPenguji} · Jam: {slot.jamMulai} - {slot.jamSelesai} WIB
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
