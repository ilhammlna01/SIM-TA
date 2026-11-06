import React from 'react';
import {
  ShieldCheck,
  Building2,
  GitBranch,
  Users2,
  Settings,
  ArrowRight,
  Database,
  Activity,
  CheckCircle2,
  FileText,
  UserCheck
} from 'lucide-react';
import { Card, Badge, Button } from '../../components/ui';
import { PageHeader } from '../../components/shell';

export default function DashboardPage({
  superadminProfile,
  masterProdi = [],
  tahapanJenjang = {},
  kuotaDosen = [],
  userAccounts = [],
  onNavigate
}) {
  const activeProdi = masterProdi.filter(p => p.status === 'Aktif');
  const activeUsers = userAccounts.filter(u => u.status === 'Aktif');

  // Hitung rata-rata keterisian kuota dosen
  const totalKuota = kuotaDosen.reduce((acc, d) => acc + d.kuotaUtama + d.kuotaPendamping, 0);
  const totalTerisi = kuotaDosen.reduce((acc, d) => acc + d.terisiUtama + d.terisiPendamping, 0);
  const persentaseKeterisian = totalKuota > 0 ? Math.round((totalTerisi / totalKuota) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header Institusional Super Admin */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate && onNavigate('dashboard') },
          { label: 'Super Administrator' },
          { label: 'Dashboard Kendali Sistem' }
        ]}
        title={`Portal Super Administrator: ${superadminProfile?.nama || 'Ir. Supriyanto, M.Kom.'}`}
        description="Pengelolaan sentral konfigurasi master program studi multi-jenjang, regulasi tahapan kelulusan, kuota beban bimbingan dosen, serta manajemen akun otentikasi seluruh stakeholder."
        statusBadge={<Badge variant="primary">KENDALI SISTEM MASTER</Badge>}
        primaryAction={
          <Button
            variant="primary"
            icon={Users2}
            onClick={() => onNavigate && onNavigate('users')}
          >
            Kelola Akun ({userAccounts.length})
          </Button>
        }
        secondaryAction={
          <Button
            variant="secondary"
            icon={GitBranch}
            onClick={() => onNavigate && onNavigate('tahapan')}
          >
            Konfigurasi Jenjang
          </Button>
        }
      />

      {/* 2. Stat Cards Metrik Sistem */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--primitive-navy-700)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                Master Program Studi
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)', marginTop: 'var(--space-1)' }}>
                {activeProdi.length} / {masterProdi.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                D3, S1, S2, S3 Manajemen Aktif
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-navy-50)', color: 'var(--primitive-navy-700)' }}>
              <Building2 size={22} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--primitive-blue-600)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                Akun Pengguna Sistem
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-blue-700)', marginTop: 'var(--space-1)' }}>
                {activeUsers.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Dari 6 entitas peran berbeda
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-blue-50)', color: 'var(--primitive-blue-700)' }}>
              <Users2 size={22} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--primitive-amber-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                Beban Kuota Bimbingan
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-amber-700)', marginTop: 'var(--space-1)' }}>
                {persentaseKeterisian}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {totalTerisi} dari {totalKuota} slot terisi
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-amber-50)', color: 'var(--primitive-amber-700)' }}>
              <Activity size={22} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--primitive-green-600)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                Integritas Konfigurasi
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-green-700)', marginTop: 'var(--space-1)' }}>
                100%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Aturan 4 jenjang tervalidasi
              </div>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-green-50)', color: 'var(--primitive-green-700)' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Ringkasan 4 Program Studi Multi-Jenjang */}
      <Card style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--type-title-size)', margin: 0, color: 'var(--primitive-navy-950)' }}>
              Status Program Studi Multi-Jenjang Terdaftar
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>
              Akreditasi resmi, penanggung jawab prodi, dan alokasi tahapan tugas akhir
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => onNavigate && onNavigate('prodi')}
          >
            Kelola Master Prodi
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          {masterProdi.map((p) => {
            const jenjangTahap = tahapanJenjang[p.jenjang];
            return (
              <div
                key={p.id}
                style={{
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--color-surface-panel-alt)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-brand-primary)', textTransform: 'uppercase' }}>
                      KODE: {p.kodeProdi}
                    </span>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 'bold', margin: '2px 0 0 0', color: 'var(--primitive-navy-950)' }}>
                      {p.namaProdi}
                    </h3>
                  </div>
                  <Badge variant={p.akreditasi === 'Unggul' ? 'success' : 'info'}>
                    {p.akreditasi}
                  </Badge>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  <strong>Kaprodi:</strong> {p.kaprodi}
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                  Alur: <strong>{jenjangTahap?.totalTahap || 4} Tahapan Akademik</strong> · Mahasiswa Aktif: {p.mahasiswaAktif}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--primitive-green-700)', fontWeight: 'bold' }}>
                    Status: {p.status}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate && onNavigate('tahapan')}
                    style={{ fontSize: '11.5px', textDecoration: 'underline', padding: '2px 6px', height: 'auto' }}
                  >
                    Atur Tahapan
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 4. Audit Log & Pengaturan Akses Cepat */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Kolom Kiri: Pintasan Konfigurasi Utama */}
        <Card style={{ padding: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--type-title-size)', margin: '0 0 var(--space-3) 0', color: 'var(--primitive-navy-950)' }}>
            Akses Cepat Pengaturan Sistem
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div
              role="button"
              tabIndex={0}
              aria-label="Master Data Program Studi"
              onClick={() => onNavigate && onNavigate('prodi')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate && onNavigate('prodi');
                }
              }}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-subtle)',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={18} color="var(--primitive-navy-800)" />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--primitive-navy-950)' }}>Master Data Program Studi</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>Tambah, edit, dan perbarui izin SK operasional & akreditasi</div>
                </div>
              </div>
              <ArrowRight size={15} color="var(--color-text-muted)" />
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label="Aturan Tahapan per Jenjang"
              onClick={() => onNavigate && onNavigate('tahapan')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate && onNavigate('tahapan');
                }
              }}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-subtle)',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GitBranch size={18} color="var(--primitive-blue-700)" />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--primitive-navy-950)' }}>Aturan Tahapan per Jenjang</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>Set syarat SKS minimal, skor TOEFL, ambang batas Turnitin</div>
                </div>
              </div>
              <ArrowRight size={15} color="var(--color-text-muted)" />
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label="Batas Kuota Bimbingan Dosen"
              onClick={() => onNavigate && onNavigate('kuota')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate && onNavigate('kuota');
                }
              }}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-subtle)',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} color="var(--primitive-amber-700)" />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--primitive-navy-950)' }}>Batas Kuota Bimbingan Dosen</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>Konfigurasi kuota per jabatan fungsional & pantau kelebihan beban</div>
                </div>
              </div>
              <ArrowRight size={15} color="var(--color-text-muted)" />
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label="Manajemen Akun Pengguna"
              onClick={() => onNavigate && onNavigate('users')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate && onNavigate('users');
                }
              }}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-subtle)',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users2 size={18} color="var(--primitive-green-700)" />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--primitive-navy-950)' }}>Manajemen Akun Pengguna</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>Tambah akun, reset password, dan kontrol hak akses multi-role</div>
                </div>
              </div>
              <ArrowRight size={15} color="var(--color-text-muted)" />
            </div>
          </div>
        </Card>

        {/* Kolom Kanan: Log Aktivitas Sistem (Audit Trail) */}
        <Card style={{ padding: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--type-title-size)', margin: '0 0 var(--space-3) 0', color: 'var(--primitive-navy-950)' }}>
            Log Audit & Keamanan Sistem
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface-panel-alt)', borderLeft: 'var(--border-width-medium) solid var(--primitive-green-600)' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>Pembaruan Kuota Bimbingan</div>
              <div style={{ color: 'var(--color-text-secondary)' }}>Superadmin menyesuaikan batas kuota Dosen Guru Besar menjadi maksimal 10 utama.</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Hari ini, 08:30 WIB</div>
            </div>

            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface-panel-alt)', borderLeft: 'var(--border-width-medium) solid var(--primitive-blue-600)' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>Penambahan Akun Pengguna Baru</div>
              <div style={{ color: 'var(--color-text-secondary)' }}>Akun Dosen baru atas nama Dra. Hj. S. Anugrahini Irawati diaktifkan.</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Kemarin, 16:15 WIB</div>
            </div>

            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface-panel-alt)', borderLeft: 'var(--border-width-medium) solid var(--primitive-amber-500)' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>Sinkronisasi Aturan Turnitin S3</div>
              <div style={{ color: 'var(--color-text-secondary)' }}>Batas toleransi similarity S3 diperketat menjadi maksimal 20% (Pedoman Disertasi 2026).</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>02 Oktober 2026</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
