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
  GraduationCap,
  Calendar,
  Clock,
  FileText,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  UserCheck,
  Award,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Eye,
  Filter
} from 'lucide-react';

/**
 * HALAMAN 1: DASHBOARD PENGUJI (FASE G) — ELEVATED INSTITUTIONAL DESIGN
 * Pengelolaan jadwal ujian, evaluasi rubrik penilaian, dan pemantauan revisi naskah akademik
 * Sesuai Buku Pedoman Tugas Akhir Jurusan Manajemen FEB UTM 2026
 */
export default function DashboardPage({
  pengujiProfile,
  ujianList = [],
  koreksiList = [],
  onNavigate,
  onPilihUjian
}) {
  const [filterJenjang, setFilterJenjang] = useState('Semua');

  const pendingPenilaian = ujianList.filter(u => !u.penilaianSubmitted);
  const pendingRevisiApproval = koreksiList.filter(k => k.statusVerifikasi === 'Menunggu Approval Penguji');

  const filteredUjianList = ujianList.filter(u => {
    if (filterJenjang === 'Semua') return true;
    if (filterJenjang === 'D3') return u.jenjang === 'D3';
    if (filterJenjang === 'S1') return u.jenjang === 'S1';
    if (filterJenjang === 'S2') return u.jenjang === 'S2';
    if (filterJenjang === 'S3') return u.jenjang === 'S3';
    return true;
  });

  const countD3 = ujianList.filter(u => u.jenjang === 'D3').length;
  const countS1 = ujianList.filter(u => u.jenjang === 'S1').length;
  const countS2 = ujianList.filter(u => u.jenjang === 'S2').length;
  const countS3 = ujianList.filter(u => u.jenjang === 'S3').length;

  return (
    <div>
      {/* 1. Header Resmi Penguji */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Dewan Penguji' },
          { label: 'Dashboard' }
        ]}
        title="Dashboard Sidang Dewan Penguji"
        description="Portal operasional penetapan jadwal ujian, evaluasi rubrik penilaian berbobot, dan persetujuan revisi naskah ilmiah."
        statusBadge={<Badge variant="navy">Semester Ganjil 2026/2027</Badge>}
      />

      {/* 2. Hero Card: Identitas Dewan Penguji & Standar Operasional SLA 2026 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1E40AF 100%)',
          borderRadius: '14px',
          padding: '24px 28px',
          color: '#FFFFFF',
          marginBottom: '24px',
          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative watermark */}
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            bottom: '-30px',
            opacity: 0.08,
            pointerEvents: 'none'
          }}
        >
          <GraduationCap size={220} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
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
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Award size={12} /> SK DEKAN FEB UTM TERBIT
              </span>
              <span style={{ fontSize: '12px', color: '#CBD5E1' }}>
                NIP. {pengujiProfile?.nip || '197703032003121002'} • NIDN. {pengujiProfile?.nidn || '0003037702'}
              </span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.01em', color: '#FFFFFF' }}>
              Selamat Bertugas, {pengujiProfile?.nama || 'Dr. Faidal, S.E., M.M.'}
            </h2>

            <p style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: 1.55, margin: '0 0 14px 0' }}>
              Anda terdaftar aktif sebagai <strong>Dewan Penguji Ujian Tugas Akhir / Skripsi / Tesis / Disertasi</strong> Jurusan Manajemen Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura.
            </p>

            {/* SLA Alert Strip */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(4px)',
                borderLeft: '4px solid #F59E0B',
                borderRadius: 'var(--radius-lg)',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Clock size={16} color="#FBBF24" style={{ flexShrink: 0 }} />
              <span>
                <strong>SLA Buku Pedoman 2026 Bab X:</strong> Nilai ujian wajib disahkan maksimal pada hari sidang, dan verifikasi lembar koreksi revisi mahasiswa diselesaikan maksimal <strong>14 hari kalender</strong>.
              </span>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
            <button
              onClick={() => onNavigate('penilaian')}
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
              <ClipboardCheck size={16} />
              <span>Input Nilai Sidang ({pendingPenilaian.length})</span>
            </button>

            <button
              onClick={() => onNavigate('revisi')}
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
              <CheckCircle2 size={16} />
              <span>Approval Revisi ({pendingRevisiApproval.length})</span>
            </button>

            <button
              onClick={() => onNavigate('daftar-ujian')}
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
              <span>Lihat Semua {ujianList.length} Sidang</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Kartu Ringkasan Metrik Kerja */}
      <div className="grid-stats-responsive" style={{ marginBottom: '24px', gap: '14px' }}>
        {/* Card 1: Agenda Sidang */}
        <StatCard
          label="Sidang Ditugaskan"
          value={ujianList.length}
          unit="Sidang"
          caption="Terdiri dari D3, S1 (TAKT & TAKK), S2, dan S3"
          icon={Calendar}
          tone="navy"
          onClick={() => onNavigate('daftar-ujian')}
        />

        {/* Card 2: Perlu Dinilai Segera */}
        <StatCard
          label="Perlu Dinilai"
          value={pendingPenilaian.length}
          unit="Formulir"
          caption="Buka rubrik & simpan nilai"
          icon={ClipboardCheck}
          tone={pendingPenilaian.length > 0 ? 'amber' : 'neutral'}
          onClick={() => onNavigate('penilaian')}
        />

        {/* Card 3: Naskah Siap Diuji */}
        <StatCard
          label="Naskah & Turnitin"
          value={ujianList.length}
          unit="Naskah PDF"
          caption="Seluruh naskah lolos ambang Turnitin"
          icon={FileText}
          tone="sky"
          onClick={() => onNavigate('naskah')}
        />

        {/* Card 4: Approval Revisi */}
        <StatCard
          label="Approval Revisi"
          value={pendingRevisiApproval.length}
          unit="Menunggu"
          caption={`${koreksiList.length} total catatan lembar koreksi`}
          icon={CheckCircle2}
          tone={pendingRevisiApproval.length > 0 ? 'green' : 'neutral'}
          onClick={() => onNavigate('revisi')}
        />
      </div>

      {/* 4. Filter Jenjang Pills (Semua, D3, S1, S2, S3) */}
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
            Filter Jenjang Sidang:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'Semua', label: `Semua Jenjang (${ujianList.length})` },
            { id: 'D3', label: `Diploma D-III (${countD3})` },
            { id: 'S1', label: `Sarjana S-1 (${countS1})` },
            { id: 'S2', label: `Magister S-2 (${countS2})` },
            { id: 'S3', label: `Doktor S-3 (${countS3})` }
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

      {/* 5. Grid Konten Utama Ujian */}
      <div className="grid-2col-responsive" style={{ alignItems: 'start', gap: '20px' }}>
        
        {/* Kolom Kiri: Agenda Sidang & Naskah */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <Panel
            title={`Agenda Sidang Ditugaskan (${filteredUjianList.length})`}
            subtitle="Jadwal seminar proposal, ujian tesis, dan kelayakan disertasi yang wajib dihadiri."
            icon={GraduationCap}
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('daftar-ujian')}>
                Buka Tabel Lengkap
              </Button>
            }
            noPadding
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredUjianList.length > 0 ? (
                filteredUjianList.map((uj) => (
                  <div
                    key={uj.id}
                    style={{
                      padding: '16px 18px',
                      borderBottom: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '14px',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* Avatar Initials */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: uj.jenjang === 'S3' ? '#FEF3C7' : uj.jenjang === 'S2' ? '#E0E7FF' : '#E0F2FE',
                        color: uj.jenjang === 'S3' ? '#B45309' : uj.jenjang === 'S2' ? '#3730A3' : '#0369A1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '14px',
                        flexShrink: 0
                      }}
                    >
                      {uj.namaMahasiswa ? uj.namaMahasiswa.split(' ').map(n => n[0]).slice(0, 2).join('') : 'MH'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>
                          {uj.namaMahasiswa}
                        </span>
                        <Badge variant={uj.jenjang === 'S3' ? 'gold' : uj.jenjang === 'S2' ? 'purple' : 'navy'}>
                          {uj.jenjang}
                        </Badge>
                        {uj.jenisTA === 'TAKK' && (
                          <Badge variant="green">TAKK Bebas Skripsi</Badge>
                        )}
                        <span style={{ fontSize: '11px', color: '#1E3A8A', fontWeight: '600', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                          {uj.peranPenguji}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#1E293B', marginBottom: '3px' }}>
                        {uj.jenisUjian}
                      </div>

                      <div style={{ fontSize: '11.5px', color: '#64748B', lineHeight: 1.35, marginBottom: '6px', fontStyle: 'italic' }}>
                        "{uj.judul.length > 85 ? uj.judul.substring(0, 85) + '...' : uj.judul}"
                      </div>

                      <div style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={12} color="#64748B" />
                          <span>{uj.jadwal} • {uj.waktu}</span>
                        </span>
                        <span>•</span>
                        <span>Ruang: <strong>{uj.ruang}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                      <Button
                        variant={uj.penilaianSubmitted ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => {
                          if (onPilihUjian) onPilihUjian(uj.id);
                          onNavigate(uj.penilaianSubmitted ? 'detail-ujian' : 'penilaian');
                        }}
                      >
                        {uj.penilaianSubmitted ? 'Lihat Nilai' : 'Beri Nilai Rubrik'}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        icon={BookOpen}
                        onClick={() => {
                          if (onPilihUjian) onPilihUjian(uj.id);
                          onNavigate('naskah');
                        }}
                      >
                        Baca Naskah
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                  Tidak ada agenda sidang untuk jenjang yang dipilih.
                </div>
              )}
            </div>
          </Panel>

          {/* Panel Naskah Terkait Ujian */}
          <Panel
            title="Naskah Akademik & Verifikasi Turnitin"
            subtitle="Naskah lengkap yang diujikan beserta laporan resmi similarity Turnitin."
            icon={FileText}
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('naskah')}>
                Semua Berkas
              </Button>
            }
            noPadding
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ujianList.map((uj) => (
                <div
                  key={uj.id}
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} color="#1E3A8A" />
                      <span>{uj.fileNaskah}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      {uj.namaMahasiswa} ({uj.nim}) • {uj.programStudi} ({uj.jenjang}) • {uj.ukuranNaskah}
                    </div>
                    <div style={{ fontSize: '11px', color: '#166534', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={12} color="#166534" />
                      <span>Turnitin Similarity: <strong>{uj.turnitinSim}%</strong> (Lolos Ambang Maksimal)</span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={BookOpen}
                    onClick={() => {
                      if (onPilihUjian) onPilihUjian(uj.id);
                      onNavigate('naskah');
                    }}
                  >
                    Buka Naskah
                  </Button>
                </div>
              ))}
            </div>
          </Panel>

        </div>

        {/* Kolom Kanan: Panduan Rubrik & Standar Nilai Kelulusan FEB UTM 2026 + Approval Revisi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card Rujukan Standar Penilaian Buku Pedoman 2026 */}
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
                Standar Ambang Lulus &amp; Rubrik 2026
              </h4>
            </div>

            <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              Ketentuan resmi kelulusan sidang berdasarkan Buku Pedoman Tugas Akhir FEB UTM 2026 Bab X:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '10px 12px', backgroundColor: '#F0F9FF', borderRadius: 'var(--radius-lg)', border: '1px solid #BAE6FD' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0369A1', marginBottom: '2px' }}>
                  1. Jenjang Diploma D-III &amp; Sarjana S-1
                </div>
                <div style={{ fontSize: '11.5px', color: '#0C4A6E', lineHeight: 1.4 }}>
                  Ambang lulus minimal <strong>Grade C (NA ≥ 56.00)</strong>. Aspek: Tata Tulis (20%), Metodologi (30%), Substansi (35%), Presentasi (15%).
                </div>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: '#F5F3FF', borderRadius: 'var(--radius-lg)', border: '1px solid #DDD6FE' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#6D28D9', marginBottom: '2px' }}>
                  2. Jenjang Magister S-2 &amp; Doktor S-3
                </div>
                <div style={{ fontSize: '11.5px', color: '#4C1D95', lineHeight: 1.4 }}>
                  Ambang lulus minimal <strong>Grade B (NA ≥ 70.00)</strong>. Bobot substansi &amp; novelty mencapai 40%.
                </div>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: '#FEFCE8', borderRadius: 'var(--radius-lg)', border: '1px solid #FEF08A' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#854D0E', marginBottom: '2px' }}>
                  3. Aturan Selisih Nilai &amp; Kuorum S3
                </div>
                <div style={{ fontSize: '11.5px', color: '#713F12', lineHeight: 1.4 }}>
                  • Selisih nilai antar anggota tim penguji <strong>tidak boleh melebihi 10 poin</strong>.<br />
                  • Uji Kelayakan S3: Sekurang-kurangnya <strong>2 dari 3 penguji</strong> menyatakan layak dan NA ≥ 70.
                </div>
              </div>
            </div>
          </div>

          {/* Panel Verifikasi Revisi Mahasiswa (Approval) */}
          <Panel
            title={`Verifikasi Revisi Mahasiswa (${koreksiList.length})`}
            subtitle="Pemeriksaan perbaikan naskah pasca sidang berdasarkan lembar koreksi penguji."
            icon={ClipboardCheck}
            actions={
              <div style={{ display: 'flex', gap: '4px' }}>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('koreksi')}>
                  Catatan
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('revisi')}>
                  Semua ({pendingRevisiApproval.length})
                </Button>
              </div>
            }
            noPadding
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {koreksiList.length > 0 ? (
                koreksiList.map((kor) => (
                  <div
                    key={kor.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '12.5px', color: '#0F172A' }}>
                        {kor.namaMahasiswa}
                      </span>
                      <Badge variant={kor.statusVerifikasi.includes('Disetujui') ? 'green' : 'gold'}>
                        {kor.statusVerifikasi}
                      </Badge>
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {kor.jenisUjian} • {kor.bab} ({kor.halaman})
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#334155', fontStyle: 'italic', lineHeight: 1.35 }}>
                      "{kor.catatanKoreksi}"
                    </div>

                    {kor.tanggapanMahasiswa && (
                      <div style={{ fontSize: '11px', color: '#166534', backgroundColor: '#F0FDF4', padding: '6px 8px', borderRadius: 'var(--radius-sm)', marginTop: '3px' }}>
                        <strong>Respons Mahasiswa:</strong> {kor.tanggapanMahasiswa}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                  Belum ada catatan revisi mahasiswa yang perlu diverifikasi.
                </div>
              )}
            </div>
          </Panel>

        </div>

      </div>
    </div>
  );
}
