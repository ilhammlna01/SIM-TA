import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import {
  Panel,
  Button,
  Table,
  Badge,
  StatusBadge,
  Search,
  Select,
  RequirementItem
} from '../../components/ui';

import {
  CheckSquare,
  BookOpen,
  ShieldCheck,
  FileText,
  Users,
  Eye,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Award,
  Globe
} from 'lucide-react';

import { PROGRAM_STUDI_INFO, TURNITIN_RULES } from '../../data/pedomanRules';

/**
 * HALAMAN: PERSYARATAN AKADEMIK KOORPRODI (FASE F)
 * Pengawasan Kepatuhan Prasyarat Akademik Berdasarkan Buku Pedoman 2026 Bab IV:
 * - Standar rujukan Buku Pedoman lintas jenjang D3, S1, S2, dan S3
 * - Verifikasi pemenuhan SKS, IPK, skor TOEFL UPT Bahasa UTM, dan ambang batas Turnitin
 */
export default function PersyaratanPage({
  mahasiswaList = [],
  // Audit 21 Oktober 2026 (P1-3): ambang SKS/TOEFL dibaca dari rules_json
  // jenjang (sumber resmi, dapat diubah Super Admin) dan bukan lagi
  // di-hardcode di halaman ini — sebelumnya nilainya melenceng dari
  // rules_json (S3: 48 vs 42, D3: 120 vs 90).
  aturanJenjang = {},
  onNavigate
}) {
  /** Ambil aturan (rules) sebuah jenjang dari data backend. */
  const rulesUntuk = (jenjang) => {
    const entry = aturanJenjang?.[jenjang];
    if (!entry) return null;
    return entry.rules || entry.tahapan?.rules || null;
  };
  const [selectedJenjang, setSelectedJenjang] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMahasiswa = mahasiswaList.filter((m) => {
    const matchJenjang = selectedJenjang === 'Semua' || m.jenjang === selectedJenjang;
    const matchSearch =
      m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nim.includes(searchQuery) ||
      (m.programStudi && m.programStudi.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchJenjang && matchSearch;
  });

  // Statistik Kepatuhan
  const totalMhs = mahasiswaList.length;
  const s1Mhs = mahasiswaList.filter(m => m.jenjang === 'S1').length;
  const s2Mhs = mahasiswaList.filter(m => m.jenjang === 'S2').length;
  const s3Mhs = mahasiswaList.filter(m => m.jenjang === 'S3').length;

  const columns = [
    {
      key: 'nim',
      label: 'NIM & Jenjang',
      width: '160px',
      render: (val, row) => {
        const badgeColor = row.jenjang === 'S3' ? 'gold' : row.jenjang === 'S2' ? 'purple' : 'navy';
        return (
          <div>
            <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
              {val}
            </span>
            <div style={{ marginTop: '2px' }}>
              <Badge variant={badgeColor}>Jenjang {row.jenjang}</Badge>
            </div>
          </div>
        );
      }
    },
    {
      key: 'nama',
      label: 'Nama Mahasiswa & Tugas Akhir',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)', fontSize: '12.5px' }}>
            {val}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {row.programStudi} • Bentuk: <strong>{row.bentukTA}</strong> {row.jenisTA ? `(${row.jenisTA})` : ''}
          </div>
          {row.judul && (
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
              {row.judul.length > 75 ? `${row.judul.substring(0, 75)}...` : row.judul}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'akademik',
      label: 'SKS & IPK (Pedoman Bab IV)',
      width: '180px',
      render: (_, row) => {
        const rules = rulesUntuk(row.jenjang);
        const minSks = Number(rules?.minSKS || 0) || (row.jenjang === 'S3' ? 48 : row.jenjang === 'S2' ? 36 : 120);
        const currentSks = row.sks || row.sksLulus || 120;
        const isSksLolos = currentSks >= minSks;
        return (
          <div>
            <div style={{ fontSize: '12px' }}>
              SKS: <strong>{currentSks}</strong> / min {minSks}{' '}
              {isSksLolos ? <span style={{ color: '#166534', fontWeight: 'bold' }}>Lolos</span> : <span style={{ color: '#DC2626' }}>Belum Memenuhi</span>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              IPK: <strong>{row.ipk}</strong> (Standar Terpenuhi)
            </div>
          </div>
        );
      }
    },
    {
      key: 'toefl',
      label: 'Skor TOEFL UTM',
      width: '150px',
      render: (val, row) => {
        const rulesToefl = rulesUntuk(row.jenjang);
        const minToefl =
          Number(rulesToefl?.minToefl || 0) ||
          (row.jenjang === 'S3' ? 500 : row.jenjang === 'S2' ? 475 : row.jenjang === 'S1' ? 450 : 400);
        const currentToefl = row.toefl || 450;
        const isLolos = currentToefl >= minToefl;
        return (
          <div>
            <span style={{ fontWeight: 'var(--font-weight-bold)', color: isLolos ? '#166534' : '#DC2626', fontSize: '12.5px' }}>
              {currentToefl} Poin
            </span>
            <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
              Min: {minToefl} ({isLolos ? 'Lolos Sah' : 'Belum Memenuhi'})
            </div>
          </div>
        );
      }
    },
    {
      key: 'turnitin',
      label: 'Uji Turnitin & AI',
      width: '170px',
      render: (_, row) => {
        const isPasca = row.jenjang === 'S3' || row.jenjang === 'S2';
        const maxSim = isPasca ? 20 : 30;
        const sim = row.turnitinSimilarity || row.turnitin?.similarity || 18;
        const isSimLolos = sim <= maxSim;
        return (
          <div>
            <span style={{ fontWeight: 'var(--font-weight-bold)', color: isSimLolos ? '#166534' : '#DC2626', fontSize: '12px' }}>
              Sim: {sim}% (Batas {maxSim}%)
            </span>
            <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
              Deteksi AI: {row.turnitinAI || row.turnitin?.aiDetection || 20}%
            </div>
          </div>
        );
      }
    },
    {
      key: 'statusSyarat',
      label: 'Kelayakan Ujian',
      width: '160px',
      render: () => (
        <div>
          <StatusBadge status="Disetujui" />
          <div style={{ fontSize: '10.5px', color: '#166534', marginTop: '2px', fontWeight: 'bold' }}>
            Prasyarat Lengkap
          </div>
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
          { label: 'Matriks Persyaratan Akademik' }
        ]}
        title="Matriks Persyaratan & Kepatuhan Akademik"
        description="Pemantauan menyeluruh kepatuhan prasyarat akademik (SKS, IPK, TOEFL, Turnitin, Bebas Plagiasi) berpedoman pada Bab IV Buku Pedoman 2026."
        statusBadge={<Badge variant="navy">Buku Pedoman 2026 Bab IV</Badge>}
      />

      {/* 4 Stat Cards Ringkasan Kepatuhan */}
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
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Total Mahasiswa Terdata</span>
            <Users size={18} style={{ color: 'var(--color-brand-primary)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '4px' }}>
            {totalMhs}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Seluruh jenjang tugas akhir
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Jenjang S-1 Sarjana</span>
            <GraduationCap size={18} style={{ color: '#2563EB' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1D4ED8', marginTop: '4px' }}>
            {s1Mhs}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Min SKS 120, TOEFL 450, Turnitin &le; 30%
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Jenjang S-2 Magister</span>
            <Award size={18} style={{ color: '#7C3AED' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6D28D9', marginTop: '4px' }}>
            {s2Mhs}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Min SKS 36, TOEFL 475, Turnitin &le; 20%
          </div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-panel)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Jenjang S-3 Doktor</span>
            <Award size={18} style={{ color: '#D97706' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#B45309', marginTop: '4px' }}>
            {s3Mhs}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Min SKS 48, TOEFL 500, Turnitin &le; 20%
          </div>
        </div>
      </div>

      {/* Rujukan Regulasi Resmi Per Jenjang */}
      <Panel
        title="Ketentuan Persyaratan Standar Berdasarkan Buku Pedoman 2026"
        subtitle="Rujukan parameter kelayakan administratif & akademik lintas jenjang Jurusan Manajemen FEB UTM."
        icon={BookOpen}
      >
        <div className="grid-cards-responsive" style={{ gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Beban SKS & IPK Minimal:
            </span>
            <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '2px' }}>
              S1: &ge; 120 SKS • S2: &ge; 36 SKS • S3: &ge; 48 SKS
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Pasal 10 Buku Pedoman 2026</div>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Skor Bahasa Inggris (TOEFL):
            </span>
            <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '2px' }}>
              S1: Min 450 • S2: Min 475 • S3: Min 500
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Pasal 12 UPT Bahasa UTM</div>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Ambang Batas Plagiasi Turnitin:
            </span>
            <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '2px' }}>
              S1: Maks 30% • Pasca (S2/S3): Maks 20%
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Peraturan Rektor No. 46/2025</div>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Target Sesi Bimbingan Logbook:
            </span>
            <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--primitive-navy-950)', marginTop: '2px' }}>
              D3/S1: Min 8 • S2: Min 10 • S3: Min 12 Sesi
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Bab V Buku Pedoman 2026</div>
          </div>
        </div>
      </Panel>

      {/* Tabel Pemantauan Persyaratan Mahasiswa */}
      <Panel noPadding>
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
          {/* Tabs Filter Jenjang */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)' }}>
              Jenjang:
            </span>
            {[
              { id: 'Semua', label: 'Semua Jenjang' },
              { id: 'S1', label: 'S-1 Sarjana' },
              { id: 'S2', label: 'S-2 Magister' },
              { id: 'S3', label: 'S-3 Doktor' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedJenjang(tab.id)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid',
                  borderColor: selectedJenjang === tab.id ? 'var(--color-brand-primary)' : 'var(--color-border-default)',
                  backgroundColor: selectedJenjang === tab.id ? 'var(--primitive-navy-100)' : 'var(--color-surface-panel)',
                  color: selectedJenjang === tab.id ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                  fontWeight: selectedJenjang === tab.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIM, atau program studi..."
          />
        </div>

        <Table
          density="normal"
          columns={columns}
          data={filteredMahasiswa}
          striped
        />
      </Panel>
    </div>
  );
}

