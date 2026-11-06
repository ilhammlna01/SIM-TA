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
  Select,
  Search,
  StatCard
} from '../../components/ui';

import {
  Users,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  Eye,
  CheckCircle,
  BookOpen,
  Filter,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  Network
} from 'lucide-react';

import { INITIAL_PLOTTING_PEMBIMBING } from '../../data/koorprodiData';

/**
 * HALAMAN 5: PEMBIMBING (FASE F) — ELEVATED INSTITUTIONAL DESIGN
 * Pengelolaan Plotting & Pemantauan Beban Dosen Pembimbing / Promotor:
 * - Data mahasiswa terisolasi pada Program Studi Koorprodi
 * - Dosen pembimbing dapat dipilih dari seluruh fakultas (FEB UTM lintas prodi)
 * - Rasio beban dosen-mahasiswa (Pedoman FEB UTM 2026)
 * - Visual progress bars keterisian kuota per jenjang (S1, S2, S3)
 * - Pengusulan Surat Keputusan (SK) Dekan
 */
export default function PembimbingPage({
  dosenList = INITIAL_PLOTTING_PEMBIMBING,
  mahasiswaList = [],
  onSavePlotting,
  onNavigate,
  currentProdi = 'S-1 Manajemen'
}) {
  const [dataDosen, setDataDosen] = useState(dosenList);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKeahlian, setFilterKeahlian] = useState('Semua');
  const [filterProdiOrigin, setFilterProdiOrigin] = useState('Semua'); // 'Semua' | 'Homebase' | 'LintasProdi'
  const [isPlottingModalOpen, setIsPlottingModalOpen] = useState(false);

  // Sync state when props change
  useEffect(() => {
    setDataDosen(dosenList);
  }, [dosenList]);

  // Form State Plotting
  const [selectedMhs, setSelectedMhs] = useState(mahasiswaList[0]?.id || '');
  const [selectedPembimbing1, setSelectedPembimbing1] = useState(dosenList[0]?.id || '');
  const [selectedPembimbing2, setSelectedPembimbing2] = useState('');

  // Update selectedMhs fallback when mahasiswaList updates
  useEffect(() => {
    if (mahasiswaList.length > 0 && !mahasiswaList.some(m => m.id === selectedMhs)) {
      setSelectedMhs(mahasiswaList[0]?.id || '');
    }
  }, [mahasiswaList, selectedMhs]);

  const isDosenHomebase = (d) => {
    const hb = String(d.prodiHomebase || '').toLowerCase();
    const cur = String(currentProdi || '').toLowerCase();
    return hb.includes(cur) || cur.includes(hb);
  };

  const filteredDosen = dataDosen.filter(d => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      d.nama.toLowerCase().includes(q) ||
      d.nip.includes(q) ||
      d.keahlian.toLowerCase().includes(q) ||
      (d.prodiHomebase && d.prodiHomebase.toLowerCase().includes(q));

    const matchKeahlian =
      filterKeahlian === 'Semua' || d.keahlian.toLowerCase().includes(filterKeahlian.toLowerCase());

    const isHb = isDosenHomebase(d);
    const matchOrigin =
      filterProdiOrigin === 'Semua' ||
      (filterProdiOrigin === 'Homebase' && isHb) ||
      (filterProdiOrigin === 'LintasProdi' && !isHb);

    return matchSearch && matchKeahlian && matchOrigin;
  });

  const totalDosen = dataDosen.length;
  const countHomebase = dataDosen.filter(isDosenHomebase).length;
  const countLintasProdi = totalDosen - countHomebase;
  const countPenuhS1 = dataDosen.filter(d => d.aktifS1 >= d.kuotaS1).length;
  const totalBimbinganS1 = dataDosen.reduce((acc, d) => acc + (d.aktifS1 || 0), 0);
  const totalKapasitasS1 = dataDosen.reduce((acc, d) => acc + (d.kuotaS1 || 0), 0);
  const utilitasS1Percent = Math.round((totalBimbinganS1 / totalKapasitasS1) * 100) || 0;

  const handleSavePlotting = async () => {
    const mhs = mahasiswaList.find(m => m.id === selectedMhs);
    const p1 = dosenList.find(d => d.id === selectedPembimbing1);
    const p2 = dosenList.find(d => d.id === selectedPembimbing2);

    const result = onSavePlotting
      ? await onSavePlotting({
          nim: mhs?.nim,
          namaMahasiswa: mhs?.nama,
          pembimbingUtama: p1?.nama,
          pembimbingPendamping: p2?.nama
        })
      : { success: true };

    if (result && result.success === false) {
      notify(result.message || 'Gagal menyimpan plotting pembimbing ke basis data.', { variant: 'danger' });
      return;
    }

    notify('Penetapan pembimbing berhasil disimpan dan diajukan ke dalam draf SK Dekan FEB UTM.', { variant: 'success' });
    setIsPlottingModalOpen(false);
  };

  const renderProgressBar = (aktif, kuota, label = '') => {
    if (!kuota || kuota === 0) {
      return <span style={{ fontSize: '11px', color: '#94A3B8' }}>Tidak Mengampu</span>;
    }

    const percent = Math.min(100, Math.round((aktif / kuota) * 100));
    const isFull = aktif >= kuota;
    const barColor = isFull ? '#DC2626' : percent >= 75 ? '#D97706' : '#16A34A';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '120px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
          <span style={{ fontWeight: '700', color: isFull ? '#DC2626' : '#0F172A' }}>
            {aktif} / {kuota} Mhs
          </span>
          <span style={{ fontSize: '10.5px', color: barColor, fontWeight: '700' }}>
            {isFull ? 'PENUH' : `${percent}%`}
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, height: '100%', backgroundColor: barColor, borderRadius: '999px', transition: 'width 0.3s ease' }} />
        </div>
      </div>
    );
  };

  const columns = [
    {
      key: 'nama',
      label: 'Nama Dosen & Keahlian',
      width: '300px',
      sortable: true,
      render: (val, row) => {
        const isHb = isDosenHomebase(row);
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px' }}>
                {val}
              </span>
              <Badge variant={isHb ? 'navy' : 'purple'}>
                {row.prodiHomebase || 'FEB UTM'} {isHb ? '(Homebase)' : '(Lintas Prodi)'}
              </Badge>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              NIP. {row.nip} • {row.jabatan}
            </div>
            <div style={{ fontSize: '11.5px', color: '#1E3A8A', marginTop: '3px', fontWeight: '600' }}>
              Bidang: {row.keahlian}
            </div>
          </div>
        );
      }
    },
    {
      key: 'bebanS1',
      label: 'Beban Sarjana S1 (Max 6)',
      width: '160px',
      render: (_, row) => renderProgressBar(row.aktifS1, row.kuotaS1, 'S1')
    },
    {
      key: 'bebanS2',
      label: 'Beban Magister S2 (Max 4)',
      width: '160px',
      render: (_, row) => renderProgressBar(row.aktifS2, row.kuotaS2, 'S2')
    },
    {
      key: 'bebanS3',
      label: 'Beban Doktor S3 (Max 3)',
      width: '160px',
      render: (_, row) => renderProgressBar(row.aktifS3, row.kuotaS3, 'S3')
    },
    {
      key: 'statusSK',
      label: 'Status SK Dekan',
      width: '150px',
      render: (val) => <Badge variant="navy">{val}</Badge>
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '110px',
      align: 'center',
      render: () => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsPlottingModalOpen(true)}
        >
          Plotting
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
          { label: 'Plotting Pembimbing' }
        ]}
        title="Plotting & Beban Dosen Pembimbing"
        description="Pengalokasian dosen pembimbing skripsi, tesis, dan promotor disertasi dengan kepatuhan batas kuota rasio dosen-mahasiswa (Buku Pedoman FEB UTM 2026)."
        statusBadge={
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Badge variant="navy">Prodi: {currentProdi}</Badge>
            <Badge variant="purple">Pool: Seluruh FEB UTM (Lintas Prodi Diizinkan)</Badge>
          </div>
        }
        primaryAction={
          <Button variant="primary" icon={UserPlus} onClick={() => setIsPlottingModalOpen(true)}>
            Alokasikan Pembimbing Baru
          </Button>
        }
      />

      {/* Callout Kebijakan Pembimbingan Lintas Prodi */}
      <div
        style={{
          padding: '12px 18px',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <Network size={22} color="#1E40AF" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '12.5px', color: '#1E3A8A', lineHeight: 1.5 }}>
          <strong>Kewenangan Penugasan Pembimbing Lintas Prodi FEB UTM:</strong> Sebagai Koorprodi <strong>{currentProdi}</strong>, Anda berwenang menetapkan Pembimbing Utama maupun Pembimbing Pendamping / Kopromotor dari program studi lain di lingkungan Fakultas Ekonomi dan Bisnis (S1, S2, S3, D3, Akuntansi, Ekonomi Pembangunan) sesuai kesesuaian kepakaran dan kepatuhan kuota.
        </div>
      </div>

      {/* Ringkasan Beban & Utilisasi Kuota Bimbingan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard
          label="Pool Dosen FEB UTM"
          value={totalDosen}
          unit="Dosen Aktif"
          caption={`${countHomebase} Homebase • ${countLintasProdi} Lintas Prodi`}
          icon={Users}
          tone="navy"
        />

        <StatCard
          label="Kapasitas Terpakai S1"
          value={`${totalBimbinganS1} / ${totalKapasitasS1}`}
          unit={`(${utilitasS1Percent}%)`}
          caption="Kapasitas bimbingan fakultas"
          icon={BarChart2}
          tone="green"
        />

        <StatCard
          label="Dosen Kuota Penuh"
          value={countPenuhS1}
          unit="Dosen (6/6 Mhs)"
          caption="Terkunci untuk plotting S1 baru"
          icon={AlertTriangle}
          tone="red"
        />
      </div>

      <Panel noPadding>
        {/* Toolbar Pencarian & Filter Keahlian & Filter Asal Prodi */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Filter Asal Prodi */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
                Asal Dosen:
              </span>
              {[
                { id: 'Semua', label: 'Semua FEB UTM' },
                { id: 'Homebase', label: `Homebase (${currentProdi})` },
                { id: 'LintasProdi', label: 'Lintas Prodi Lain' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterProdiOrigin(tab.id)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: filterProdiOrigin === tab.id ? '#1E3A8A' : '#CBD5E1',
                    backgroundColor: filterProdiOrigin === tab.id ? '#1E3A8A' : '#FFFFFF',
                    color: filterProdiOrigin === tab.id ? '#FFFFFF' : '#475569',
                    fontWeight: filterProdiOrigin === tab.id ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter Keahlian */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
                Keahlian:
              </span>
              {['Semua', 'Pemasaran', 'Sumber Daya Manusia', 'Keuangan'].map((bidang) => (
                <button
                  key={bidang}
                  type="button"
                  onClick={() => setFilterKeahlian(bidang)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: filterKeahlian === bidang ? '#1E3A8A' : '#CBD5E1',
                    backgroundColor: filterKeahlian === bidang ? '#1E3A8A' : '#FFFFFF',
                    color: filterKeahlian === bidang ? '#FFFFFF' : '#475569',
                    fontWeight: filterKeahlian === bidang ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {bidang}
                </button>
              ))}
            </div>
          </div>

          <Search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dosen, NIP, prodi, atau keahlian..."
          />
        </div>

        {/* Tabel Data Dosen & Kuota */}
        <Table
          density="normal"
          columns={columns}
          data={filteredDosen}
          striped
          emptyContent={
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              Tidak ditemukan dosen pembimbing dengan kriteria filter tersebut.
            </div>
          }
        />
      </Panel>

      {/* Modal Alokasi / Plotting Pembimbing Baru */}
      <Modal
        isOpen={isPlottingModalOpen}
        onClose={() => setIsPlottingModalOpen(false)}
        title="Alokasi Pembimbing / Promotor Tugas Akhir"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setIsPlottingModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSavePlotting}>
              Simpan &amp; Usulkan ke Dekan
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '10px 14px', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-lg)', border: '1px solid #BFDBFE', fontSize: '11.5px', color: '#1E40AF', lineHeight: 1.45 }}>
            <strong>Ketentuan Pedoman 2026:</strong> Rasio pembimbingan maksimal 6 mahasiswa per dosen S1, 4 untuk S2, dan 3 untuk S3. Dosen dengan kuota penuh dilarang dialokasikan. Dosen pembimbing pendamping atau kopromotor dapat dipilih dari dosen lintas program studi di lingkungan FEB UTM.
          </div>

          <FormField 
            id="mhs-plot" 
            label="Pilih Mahasiswa" 
            required 
            helperText={`Mahasiswa terdaftar di Program Studi ${currentProdi}.`}
          >
            <Select
              value={selectedMhs}
              onChange={(e) => setSelectedMhs(e.target.value)}
              options={
                mahasiswaList.length > 0
                  ? mahasiswaList.map(m => ({
                      value: m.id,
                      label: `${m.nama} — ${m.nim} (${m.jenjang} ${m.programStudi})`
                    }))
                  : [{ value: '', label: `-- Tidak ada mahasiswa terdaftar di ${currentProdi} --` }]
              }
            />
          </FormField>

          <FormField 
            id="pemb-1" 
            label="Dosen Pembimbing Utama / Promotor (S3)" 
            required 
            helperText="Dapat dipilih dari dosen homebase maupun lintas prodi FEB UTM yang memenuhi kualifikasi fungsional."
          >
            <Select
              value={selectedPembimbing1}
              onChange={(e) => setSelectedPembimbing1(e.target.value)}
              options={dosenList.map(d => {
                const isHb = isDosenHomebase(d);
                const tagProdi = d.prodiHomebase ? (isHb ? `[${d.prodiHomebase}]` : `[${d.prodiHomebase} - Lintas Prodi]`) : '';
                return {
                  value: d.id,
                  label: `${d.nama} ${tagProdi} (${d.keahlian} — S1: ${d.aktifS1}/${d.kuotaS1}${d.aktifS1 >= d.kuotaS1 ? ' [PENUH]' : ''})`
                };
              })}
            />
          </FormField>

          <FormField 
            id="pemb-2" 
            label="Dosen Pembimbing II / Kopromotor (Lintas Prodi Diizinkan)" 
            optional
            helperText="Dosen dari program studi lain di FEB UTM dapat ditugaskan sebagai pembimbing pendamping."
          >
            <Select
              value={selectedPembimbing2}
              onChange={(e) => setSelectedPembimbing2(e.target.value)}
              options={[
                { value: '', label: '-- Tanpa Pembimbing Pendamping (Tunggal) --' },
                ...dosenList.map(d => {
                  const isHb = isDosenHomebase(d);
                  const tagProdi = d.prodiHomebase ? (isHb ? `[${d.prodiHomebase}]` : `[${d.prodiHomebase} - Lintas Prodi]`) : '';
                  return {
                    value: d.id,
                    label: `${d.nama} ${tagProdi} (${d.keahlian})`
                  };
                })
              ]}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
