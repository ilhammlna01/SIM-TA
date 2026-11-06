import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/shell';
import { notify } from '../../components/feedback';
import {
  Panel,
  Button,
  Badge,
  StatusBadge,
  Alert,
  FormField,
  Input,
  Textarea,
  Radio,
  RadioGroup,
  Table
} from '../../components/ui';

import {
  ClipboardCheck,
  GraduationCap,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Info,
  Save,
  Printer,
  ArrowLeft,
  FileText,
  UserCheck,
  Sparkles,
  Sliders,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

import {
  RUBRIK_PENILAIAN_PENGUJI,
  hitungGradeUTM,
  KONVERSI_NILAI_UTM
} from '../../data/pengujiData';
import { DocumentGeneratorModal } from '../../components/documents';

/**
 * HALAMAN 5: FORM PENILAIAN PENGUJI (FASE G) — ELEVATED INSTITUTIONAL DESIGN
 * - Mengikuti struktur & terminologi Pedoman FEB UTM 2026 secara ketat.
 * - Untuk D3 & S1: Aspek tata tulis, metodologi, substansi, penyampaian/pertahanan (rentang 0-100). Ambang lulus NA >= 56 (C).
 * - Untuk S2 & S3: Ambang lulus NA >= 70 (B).
 * - Untuk Ujian Kelayakan S3: Menampilkan tiga kemungkinan hasil (Layak revisi minor, Layak revisi mayor, Tidak layak)
 *   serta aturan Pedoman: sekurang-kurangnya 2 dari 3 penguji menyatakan layak dan NA >= 70.
 * - Dilengkapi Quick Student Switcher Tabs, Preset Nilai Cepat, dan Live Calculator.
 */
export default function FormPenilaianPage({
  ujianList = [],
  selectedUjianId,
  onSelectUjian,
  onNavigate,
  onSubmitNilai
}) {
  // Pilih ujian aktif (default ke yang dipilih atau ujian pertama)
  const currentUjianId = selectedUjianId || (ujianList[0] ? ujianList[0].id : null);
  const activeUjian = ujianList.find(u => u.id === currentUjianId) || ujianList[0];

  // State Modal Cetak Berita Acara Digital
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // State konteks rubrik
  const [activeRubrikKey, setActiveRubrikKey] = useState(activeUjian ? activeUjian.rubrikContext : 'D3_S1');

  useEffect(() => {
    if (activeUjian) {
      setActiveRubrikKey(activeUjian.rubrikContext || 'D3_S1');
      if (activeUjian.id === 'uj-pgj-3') {
        setNilaiAspek({
          'asp-s3l-1': 75,
          'asp-s3l-2': 74,
          'asp-s3l-3': 73.5
        });
      } else {
        setNilaiAspek({});
      }
      setIsSubmitted(activeUjian.penilaianSubmitted || false);
    }
  }, [activeUjian]);

  const rubrik = RUBRIK_PENILAIAN_PENGUJI[activeRubrikKey] || RUBRIK_PENILAIAN_PENGUJI.D3_S1;

  // State nilai masing-masing aspek (0-100)
  const [nilaiAspek, setNilaiAspek] = useState(() => {
    if (activeUjian?.id === 'uj-pgj-3') {
      return {
        'asp-s3l-1': 75,
        'asp-s3l-2': 74,
        'asp-s3l-3': 73.5
      };
    }
    return {};
  });

  // State keputusan Ujian Kelayakan S3
  const [hasilKelayakan, setHasilKelayakan] = useState(
    activeUjian?.rekomendasiKelayakan || 'Layak Revisi Minor'
  );

  // State catatan kualitatif dewan penguji
  const [catatanEvaluasi, setCatatanEvaluasi] = useState(
    activeUjian?.penilaianSubmitted
      ? 'Naskah memenuhi standar kelayakan akademik dengan revisi minor pada elaborasi sintesis teori.'
      : ''
  );

  const [isSubmitted, setIsSubmitted] = useState(activeUjian?.penilaianSubmitted || false);

  if (!activeUjian) {
    return (
      <div>
        <PageHeader
          breadcrumbs={[
            { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
            { label: 'Dewan Penguji' },
            { label: 'Form Penilaian Ujian' }
          ]}
          title="Formulir Penilaian Ujian"
        />
        <Panel>
          <p>Belum ada sidang yang ditugaskan kepada Anda.</p>
        </Panel>
      </div>
    );
  }

  // Handle perubahan nilai aspek (0-100)
  const handleScoreChange = (aspekId, val) => {
    const num = Math.min(100, Math.max(0, Number(val) || 0));
    setNilaiAspek(prev => ({
      ...prev,
      [aspekId]: num
    }));
  };

  // Quick Preset Handlers
  const handleApplyPreset = (targetScore) => {
    const newScores = {};
    rubrik.aspek.forEach((asp) => {
      newScores[asp.id] = targetScore;
    });
    setNilaiAspek(newScores);
  };

  // Template Catatan Handlers
  const handleInsertTemplate = (text) => {
    setCatatanEvaluasi(prev => prev ? `${prev} ${text}` : text);
  };

  // Hitung Nilai Akhir (NA) terbobot
  const calculateNA = () => {
    let total = 0;
    rubrik.aspek.forEach(asp => {
      const skor = nilaiAspek[asp.id] || 0;
      total += (skor * asp.bobot) / 100;
    });
    return parseFloat(total.toFixed(2));
  };

  const nilaiAkhir = calculateNA();
  const gradeInfo = hitungGradeUTM(nilaiAkhir);

  // Status kelulusan sesuai aturan Pedoman 2026
  const isPassingScore = nilaiAkhir >= rubrik.passingGradeMin;

  // Logika Kelayakan S3 Pedoman Hal 65:
  const isKelayakanContext = rubrik.isKelayakan || activeRubrikKey === 'S3_KELAYAKAN';
  
  // Simulasi voting 3 penguji kelayakan
  const mockPengujiKelayakanVotes = [
    { nama: 'Prof. Dr. Pribanus Wantara (Promotor)', vote: 'Layak Revisi Minor', skor: 76.5 },
    { nama: 'Dr. Dra. Hj. Iriani Ismail, M.M. (Kopromotor)', vote: 'Layak Revisi Minor', skor: 75.0 },
    { nama: 'Dr. Faidal, S.E., M.M. (Penguji Anda)', vote: hasilKelayakan, skor: nilaiAkhir }
  ];

  const countPengujiLayak = mockPengujiKelayakanVotes.filter(
    p => p.vote === 'Layak Revisi Minor' || p.vote === 'Layak Revisi Mayor'
  ).length;

  const isKelayakanMemenuhiSyarat = countPengujiLayak >= 2 && nilaiAkhir >= 70;

  const handleSimpanPenilaian = (e) => {
    e.preventDefault();

    if (onSubmitNilai) {
      onSubmitNilai({
        ujianId: activeUjian.id,
        nilaiFinal: nilaiAkhir,
        grade: gradeInfo?.grade,
        nilaiAspek: nilaiAspek,
        rekomendasiKelayakan: isKelayakanContext ? hasilKelayakan : null,
        catatanEvaluasi: catatanEvaluasi
      });
    }

    setIsSubmitted(true);
    notify('Penilaian ujian berhasil disimpan dan disahkan ke dalam Berita Acara Sidang SIAKAD.', { variant: 'success' });
  };

  return (
    <div>
      {/* 1. Header Resmi Form Penilaian */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Daftar Ujian', onClick: () => onNavigate('daftar-ujian') },
          { label: 'Form Penilaian Ujian' }
        ]}
        title={`Lembar Penilaian Ujian: ${activeUjian.namaMahasiswa}`}
        description={`${activeUjian.jenisUjian} — ${activeUjian.programStudi} (${activeUjian.jenjang}) | Standar Buku Pedoman FEB UTM 2026`}
        statusBadge={
          isSubmitted ? (
            <StatusBadge status="Telah Dinilai" variant="success" />
          ) : (
            <StatusBadge status="Menunggu Penilaian" variant="warning" />
          )
        }
        primaryAction={
          <Button
            variant="primary"
            icon={Save}
            onClick={handleSimpanPenilaian}
          >
            {isSubmitted ? 'Perbarui Lembar Nilai' : 'Simpan & Sahkan Nilai'}
          </Button>
        }
        secondaryAction={
          <Button
            variant="secondary"
            icon={Printer}
            onClick={() => setIsDocModalOpen(true)}
          >
            Cetak Berita Acara Digital (PDF)
          </Button>
        }
      />

      {/* 2. Interactive Multi-Jenjang Quick Switcher Tabs */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '14px 18px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #E2E8F0',
          borderTop: 'var(--border-width-medium) solid #1E3A8A',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            PILIH MAHASISWA &amp; AGENDA SIDANG YANG DIUJI:
          </span>
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            Total <strong>{ujianList.length}</strong> Mahasiswa Ditugaskan Dekan
          </span>
        </div>

        {/* Tab Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {ujianList.map((u) => {
            const isSelected = u.id === activeUjian.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  if (onSelectUjian) onSelectUjian(u.id);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid',
                  borderColor: isSelected ? '#1E3A8A' : '#CBD5E1',
                  backgroundColor: isSelected ? '#1E3A8A' : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: isSelected ? '700' : '500',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 2px 6px rgba(30, 58, 138, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                    color: isSelected ? '#FFFFFF' : '#1E293B',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10.5px',
                    fontWeight: '800'
                  }}
                >
                  {u.jenjang}
                </span>
                <span>{u.namaMahasiswa.split(' ')[0]} {u.namaMahasiswa.split(' ')[1] || ''}</span>
                {u.penilaianSubmitted && (
                  <CheckCircle size={13} color={isSelected ? '#86EFAC' : '#16A34A'} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Panel Identitas Naskah Singkat */}
      <Panel style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Mahasiswa Teruji:</span>
            <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={activeUjian.namaMahasiswa}>
              {activeUjian.namaMahasiswa}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B' }}>NIM: {activeUjian.nim}</div>
          </div>

          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Program Studi &amp; Jenjang:</span>
            <div style={{ fontWeight: '700', color: '#1E3A8A', fontSize: '13.5px', marginTop: '2px' }}>{activeUjian.programStudi} ({activeUjian.jenjang})</div>
            <div style={{ fontSize: '11.5px', color: '#64748B' }}>Bentuk TA: {activeUjian.bentukTA} {activeUjian.jenisTA === 'TAKK' ? '(Jalur TAKK)' : ''}</div>
          </div>

          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Peran Penguji:</span>
            <div style={{ marginTop: '2px' }}>
              <Badge variant="gold">
                {activeUjian.peranPenguji ? activeUjian.peranPenguji.replace(/\s*\([^)]*Dewan Pertimbangan Akademik[^)]*\)/gi, '').trim() : 'Dewan Penguji'}
              </Badge>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>Jadwal: {activeUjian.jadwal}</div>
          </div>

          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Naskah PDF &amp; Turnitin:</span>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#1E3A8A', marginTop: '2px', wordBreak: 'break-all' }}>
              {activeUjian.fileNaskah}
            </div>
            <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: '600', marginTop: '2px' }}>
              Turnitin: <strong>{activeUjian.turnitinSim}%</strong> (Lolos ambang)
            </div>
          </div>
        </div>
      </Panel>

      {/* 4. Layout Penilaian: Form Aspek Rubrik & Hasil Kalkulasi Terbobot */}
      <div className="grid-2col-responsive" style={{ alignItems: 'start', gap: '20px' }}>
        
        {/* Kolom Kiri: Form Aspek Rubrik Resmi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <Panel
            title={rubrik.namaRubrik}
            subtitle={rubrik.catatanAturan}
            icon={ClipboardCheck}
            actions={
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#64748B', alignSelf: 'center', fontWeight: '600' }}>Preset Nilai:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(85)}
                  style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid #BBF7D0', backgroundColor: '#F0FDF4', color: '#166534', cursor: 'pointer', fontWeight: '700' }}
                >
                  Grade A (85)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(78)}
                  style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid #BAE6FD', backgroundColor: '#F0F9FF', color: '#0369A1', cursor: 'pointer', fontWeight: '700' }}
                >
                  Grade B+ (78)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(72)}
                  style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid #DDD6FE', backgroundColor: '#F5F3FF', color: '#6D28D9', cursor: 'pointer', fontWeight: '700' }}
                >
                  Grade B (72)
                </button>
              </div>
            }
          >
            <form onSubmit={handleSimpanPenilaian} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Aspek Penilaian */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {rubrik.aspek.map((asp, idx) => {
                  const currentScore = nilaiAspek[asp.id] !== undefined ? nilaiAspek[asp.id] : '';
                  const numScore = Number(currentScore) || 0;
                  const contribution = (numScore * asp.bobot) / 100;

                  return (
                    <div
                      key={asp.id}
                      style={{
                        padding: '14px 16px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: 'var(--radius-lg)',
                        transition: 'border-color 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                              {idx + 1}. {asp.nama}
                            </span>
                            <Badge variant="navy">Bobot {asp.bobot}%</Badge>
                          </div>
                          <p style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: 1.45, margin: '4px 0 0 0' }}>
                            {asp.deskripsi}
                          </p>
                        </div>

                        {/* Input Skor (Rentang 0 - 100) */}
                        <div style={{ minWidth: '130px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={currentScore}
                              onChange={(e) => handleScoreChange(asp.id, e.target.value)}
                              placeholder="0–100"
                              style={{
                                width: '70px',
                                padding: '6px 8px',
                                fontSize: '14px',
                                fontWeight: '800',
                                textAlign: 'center',
                                border: '1px solid #CBD5E1',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: '#FFFFFF',
                                color: '#0F172A'
                              }}
                              required
                            />
                            <span style={{ fontSize: '12px', color: '#64748B' }}>/ 100</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#1E3A8A', marginTop: '3px', fontWeight: '700' }}>
                            Poin Terbobot: {contribution.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Slider Input Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={numScore}
                          onChange={(e) => handleScoreChange(asp.id, e.target.value)}
                          style={{
                            flex: 1,
                            accentColor: '#1E3A8A',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ fontSize: '11px', color: '#64748B', minWidth: '40px', textAlign: 'right' }}>
                          {numScore}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* KHUSUS UJIAN KELAYAKAN S3: 3 Kemungkinan Hasil & Aturan Pedoman */}
              {isKelayakanContext && (
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: '#FEFCE8',
                    border: '1px solid #FEF08A',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertTriangle size={18} color="#CA8A04" />
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#854D0E' }}>
                      Keputusan Uji Kelayakan Disertasi (Desk Review Pedoman 2026)
                    </h4>
                  </div>
                  <p style={{ fontSize: '12px', color: '#713F12', marginBottom: '12px', lineHeight: 1.45 }}>
                    Pedoman Hal 65: Tugas akhir dinyatakan LAYAK apabila 
                    sekurang-kurangnya <strong>dua dari tiga penguji</strong> menyatakan layak dan <strong>NA ≥ 70</strong>.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {rubrik.pilihanHasilKelayakan?.map((opsi) => {
                      const isSelected = hasilKelayakan === opsi.id;
                      return (
                        <label
                          key={opsi.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            padding: '10px 12px',
                            backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                            border: '1px solid',
                            borderColor: isSelected ? '#CA8A04' : '#E2E8F0',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="radio"
                            name="kelayakanResult"
                            value={opsi.id}
                            checked={isSelected}
                            onChange={() => setHasilKelayakan(opsi.id)}
                            style={{ marginTop: '3px' }}
                          />
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A' }}>
                              {opsi.label}
                            </div>
                            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                              {opsi.desc}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Catatan Kualitatif / Pertimbangan Akademik */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>
                    Catatan Evaluasi / Pertimbangan Akademik Penguji
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate('Format sitasi APA 7th perlu diperbaiki pada Bab II.')}
                      style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#475569', cursor: 'pointer' }}
                    >
                      + Sitasi APA
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate('Perkuat fenomena gap dan data pra-survei pada latar belakang.')}
                      style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#475569', cursor: 'pointer' }}
                    >
                      + Fenomena Gap
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate('Substansi naskah telah memenuhi kelayakan akademik.')}
                      style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#475569', cursor: 'pointer' }}
                    >
                      + Memenuhi Syarat
                    </button>
                  </div>
                </div>

                <Textarea
                  rows={3}
                  value={catatanEvaluasi}
                  onChange={(e) => setCatatanEvaluasi(e.target.value)}
                  placeholder="Tuliskan catatan pertimbangan kualitatif yang dilampirkan pada Berita Acara Sidang..."
                />
              </div>

              {/* Tombol Simpan Form */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                <Button
                  variant="secondary"
                  onClick={() => onNavigate('daftar-ujian')}
                >
                  Kembali ke Daftar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  icon={Save}
                >
                  {isSubmitted ? 'Perbarui Lembar Nilai' : 'Simpan & Sahkan Nilai Sidang'}
                </Button>
              </div>

            </form>
          </Panel>

        </div>

        {/* Kolom Kanan: Rekapitulasi Nilai Akhir & Konversi Nilai Resmi UTM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Card Kalkulasi Nilai Akhir */}
          <Panel title="Rekapitulasi Nilai Akhir (NA)" icon={Calculator}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', borderTop: '4px solid #1E3A8A', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Nilai Akhir Terbobot (0–100)
              </span>
              <div style={{ fontSize: '42px', fontWeight: '800', color: '#0F172A', margin: '4px 0', letterSpacing: '-0.02em' }}>
                {nilaiAkhir.toFixed(2)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: gradeInfo?.grade === 'A' ? '#15803D' : '#1E3A8A',
                    backgroundColor: gradeInfo?.grade === 'A' ? '#DCFCE7' : '#E0F2FE',
                    padding: '3px 12px',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  Grade: {gradeInfo?.grade || '-'} ({gradeInfo?.bobot ? gradeInfo.bobot.toFixed(1) : '-'})
                </span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>
                  {gradeInfo?.predikat || ''}
                </span>
              </div>
            </div>

            <div style={{ paddingTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '8px', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: '#64748B' }}>Batas Minimal Kelulusan:</span>
                <strong style={{ color: '#0F172A' }}>
                  {rubrik.passingGradeMin} ({activeUjian.jenjang === 'S1' || activeUjian.jenjang === 'D3' ? 'Nilai C' : 'Nilai B / NA 70'})
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12.5px',
                  marginBottom: '8px',
                  padding: '8px 10px',
                  backgroundColor: isPassingScore ? '#F0FDF4' : '#FEF2F2',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isPassingScore ? '#BBF7D0' : '#FECACA'}`
                }}
              >
                <span style={{ color: isPassingScore ? '#166534' : '#991B1B', fontWeight: '700' }}>Status Capaian:</span>
                <span style={{ fontWeight: '800', color: isPassingScore ? '#15803D' : '#DC2626' }}>
                  {isPassingScore ? 'Memenuhi Standar Kelulusan' : 'Di Bawah Batas Kelulusan'}
                </span>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-lg)', fontSize: '11.5px', color: '#1E40AF', border: '1px solid #BFDBFE', marginTop: '10px', lineHeight: '1.45' }}>
                <strong>Ketentuan Pedoman Hal 75:</strong> Perbedaan penilaian antara penguji satu dengan lainnya tidak boleh lebih dari <strong>10 poin</strong>.
              </div>
            </div>
          </Panel>

          {/* Panel Aturan Khusus Kelayakan S3: 2/3 Penguji & NA >= 70 */}
          {isKelayakanContext && (
            <Panel title="Status Kelayakan Disertasi (S3)" icon={UserCheck}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11.5px', color: '#475569' }}>
                  Syarat Pedoman: <strong>Sekurang-kurangnya 2 dari 3 penguji menyatakan layak</strong> dan <strong>NA ≥ 70</strong>.
                </div>

                <div style={{ padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', fontSize: '11px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: '700', marginBottom: '4px', color: '#0F172A' }}>
                    Simulasi Rekapitulasi Dewan Penguji Kelayakan:
                  </div>
                  {mockPengujiKelayakanVotes.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #E2E8F0' }}>
                      <span style={{ color: '#475569' }}>{p.nama.split('(')[0]}:</span>
                      <strong style={{ color: p.vote === 'Tidak Layak' ? '#DC2626' : '#16A34A' }}>{p.vote}</strong>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isKelayakanMemenuhiSyarat ? '#DCFCE7' : '#FEE2E2',
                    border: '1px solid',
                    borderColor: isKelayakanMemenuhiSyarat ? '#86EFAC' : '#FCA5A5',
                    marginTop: '4px'
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '800', color: isKelayakanMemenuhiSyarat ? '#166534' : '#991B1B' }}>
                    {isKelayakanMemenuhiSyarat ? <CheckCircle size={14} aria-hidden="true" /> : <AlertTriangle size={14} aria-hidden="true" />}
                    <span>{isKelayakanMemenuhiSyarat ? 'DISERTASI DINYATAKAN LAYAK' : 'DISERTASI BELUM MEMENUHI KELAYAKAN'}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: isKelayakanMemenuhiSyarat ? '#15803D' : '#B91C1C', marginTop: '2px' }}>
                    {countPengujiLayak} dari 3 penilai menyatakan layak • Nilai Akhir: {nilaiAkhir.toFixed(2)} (Syarat NA ≥ 70).
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {/* Tabel Skala Konversi UTM */}
          <Panel title="Tabel Konversi Nilai UTM (Pedoman 2026)" icon={Info}>
            <table style={{ width: '100%', fontSize: '11.5px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                  <th style={{ padding: '5px 6px' }}>Rentang Skor</th>
                  <th style={{ padding: '5px 6px' }}>Huruf</th>
                  <th style={{ padding: '5px 6px' }}>Bobot</th>
                  <th style={{ padding: '5px 6px' }}>Predikat</th>
                </tr>
              </thead>
              <tbody>
                {KONVERSI_NILAI_UTM.map((k) => (
                  <tr
                    key={k.grade}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      backgroundColor: gradeInfo?.grade === k.grade ? '#EFF6FF' : 'transparent',
                      fontWeight: gradeInfo?.grade === k.grade ? '700' : 'normal'
                    }}
                  >
                    <td style={{ padding: '5px 6px' }}>{k.min === 80 ? '80 – 100' : `${k.min} – <${k.min === 0 ? 45 : (k.min === 45 ? 56 : (k.min === 56 ? 65 : (k.min === 65 ? 70 : (k.min === 70 ? 75 : 80))))}`}</td>
                    <td style={{ padding: '5px 6px', color: gradeInfo?.grade === k.grade ? '#1E3A8A' : 'inherit' }}>{k.grade}</td>
                    <td style={{ padding: '5px 6px' }}>{k.bobot.toFixed(1)}</td>
                    <td style={{ padding: '5px 6px' }}>{k.predikat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

        </div>

      </div>

      {/* Modal Cetak Berita Acara Ujian Digital Ber-QR Code */}
      <DocumentGeneratorModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        initialDocType="berita_acara"
        prefillData={{
          namaMahasiswa: activeUjian?.namaMahasiswa,
          nim: activeUjian?.nim,
          jenjang: activeUjian?.jenjang,
          prodi: activeUjian?.programStudi,
          judul: activeUjian?.judulNaskah || activeUjian?.judul,
          tahap: activeUjian?.jenisUjian,
          ruang: activeUjian?.ruang,
          nilaiFinal: nilaiAkhir,
          grade: gradeInfo?.grade,
          rekomendasiKelayakan: activeUjian?.rekomendasiKelayakan
        }}
      />
    </div>
  );
}
