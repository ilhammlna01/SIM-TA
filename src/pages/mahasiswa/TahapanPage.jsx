import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/shell';
import { notify } from '../../components/feedback';
import { 
  Panel, 
  Button, 
  StatusBadge, 
  Badge, 
  Alert, 
  Timeline 
} from '../../components/ui';
import { PROGRAM_STUDI_INFO, getIstilahTA, getTahapanSkema } from '../../data/pedomanRules';
import { akademikApi } from '../../services/api';
import { 
  GitBranch, 
  CheckCircle2, 
  Clock, 
  Users, 
  FileText, 
  AlertCircle, 
  ArrowRight, 
  Scale, 
  Calendar,
  MapPin 
} from 'lucide-react';

/**
 * Halaman 3: Tahapan Akademik
 * 
 * Menampilkan alur perjalanan tahapan tugas akhir yang SPESIFIK per jenjang.
 * BUKAN satu workflow universal!
 * 
 * Khusus S3 memuat 6 tahapan mandatori:
 * 1. Ujian Kualifikasi
 * 2. Ujian Proposal
 * 3. Seminar Hasil
 * 4. Ujian Kelayakan (Desk Review)
 * 5. Ujian Tertutup
 * 6. Ujian Terbuka
 */
export default function TahapanPage({ 
  student, 
  onNavigate 
}) {
  const prodiInfo = PROGRAM_STUDI_INFO[student.jenjang] || PROGRAM_STUDI_INFO.S1;
  const istilahTA = getIstilahTA(student, prodiInfo);
  const tahapanList = getTahapanSkema(student, prodiInfo);

  const [selectedTahapId, setSelectedTahapId] = useState(student.tahapAktifId || tahapanList[0]?.id);
  // Audit 21 Oktober 2026 (temuan AZ-A2): status tahapan HARUS dibaca dari
  // basis data, bukan dari data statis pada props. Sebelumnya halaman ini
  // menampilkan tahap "Selesai"/"Sedang Aktif" yang berasal dari data simulasi
  // sehingga selalu sama dengan apa pun yang terjadi di server.
  const [progresDb, setProgresDb] = useState(null);
  const [backendAktif, setBackendAktif] = useState(true);
  const [isMengaju, setIsMengaju] = useState(false);
  const currentIdx = tahapanList.findIndex(t => t.id === student.tahapAktifId);
  const selectedTahap = tahapanList.find(t => t.id === selectedTahapId) || tahapanList[0];
  const selectedIdx = tahapanList.findIndex(t => t.id === selectedTahapId);

  // Muat progres tahapan nyata dari basis data.
  useEffect(() => {
    let dibatalkan = false;
    const nim = student?.nim;
    if (!nim) return;

    (async () => {
      try {
        const daftar = await akademikApi.getTugasAkhir({ nim });
        const ta = (Array.isArray(daftar) ? daftar : []).find((x) => x.nim === nim) || (Array.isArray(daftar) ? daftar[0] : null);
        if (!ta?.id) return;
        // Endpoint /progres memuat tahap aktif, checklist, dan jumlah
        // bimbingan/naskah/publikasi yang menjadi syarat tiap tahapan.
        const progres = await akademikApi.getProgresTugasAkhir(ta.id);
        if (dibatalkan) return;
        setProgresDb(progres || null);
        setBackendAktif(true);
      } catch (_) {
        if (!dibatalkan) setBackendAktif(false);
      }
    })();

    return () => { dibatalkan = true; };
  }, [student?.nim]);

  // Ajukan tahap yang sedang aktif ke server.
  const handleAjukanTahap = async () => {
    const tahapAktif = progresDb?.tahapAktif;
    if (!tahapAktif?.kode_tahap) return;
    setIsMengaju(true);
    try {
      const hasil = await akademikApi.ajukanTahap(progresDb.tugasAkhir?.id, tahapAktif.kode_tahap, {
        catatan: 'Diajukan dari halaman Tahapan Akademik'
      });
      const progresBaru = await akademikApi.getProgresTugasAkhir(progresDb.tugasAkhir?.id);
      setProgresDb(progresBaru || null);
      notify(
        hasil?.success === false
          ? `Pengajuan tahap ditolak: ${hasil.message || 'persyaratan belum terpenuhi'}`
          : 'Pengajuan tahap berhasil dikirim dan menunggu persetujuan pembimbing.',
        { variant: hasil?.success === false ? 'warning' : 'success' }
      );
    } catch (err) {
      notify(`Gagal mengajukan tahap: ${err.message}`, { variant: 'danger' });
    } finally {
      setIsMengaju(false);
    }
  };

  const getStepStatus = (idx) => {
    // Bila progres tersedia di backend, statusNyalah yang otoritatif.
    if (progresDb?.tahapan?.length) {
      const kode = tahapanList[idx]?.id || tahapanList[idx]?.kode;
      const s = progresDb.tahapan.find((x) => x.kode_tahap === kode || x.kode === kode);
      if (s) return s.status || 'Belum Dimulai';
    }
    if (idx < currentIdx) return 'Selesai';
    if (idx === currentIdx) return student.statusTahap || 'Sedang Aktif';
    return 'Belum Dimulai';
  };

  return (
    <div>
      {/* Ringkasan progres & aksi pengajuan tahap (Audit 21 Oktober 2026 — AZ-A2) */}
      {progresDb && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            marginBottom: '18px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div style={{ fontSize: '12.5px', color: '#334155' }}>
            Progres tahapan (<strong>{progresDb.tahapSelesai ?? 0}/{progresDb.totalTahap ?? 0}</strong> selesai,
            <strong>{progresDb.progresPersen ?? 0}%</strong>) &middot; Tahap aktif:
            <strong>{progresDb.tahapAktif?.nama_tahap || progresDb.tahapAktif?.kode_tahap || '-'}</strong>
            {progresDb.tahapAktif?.status ? ' (' + progresDb.tahapAktif.status + ')' : ''}
            {progresDb.tugasAkhir?.status ? ' &middot; Status: ' + progresDb.tugasAkhir.status : ''}
          </div>
          {progresDb.tahapAktif && progresDb.tahapAktif.status === 'Menunggu Pengajuan' && (
            <Button
              variant="primary"
              size="sm"
              disabled={isMengaju}
              onClick={handleAjukanTahap}
            >
              {isMengaju ? 'Mengirim...' : 'Ajukan Tahap ke Pembimbing'}
            </Button>
          )}
        </div>
      )}

      {!backendAktif && (
        <div
          style={{
            padding: '10px 14px',
            marginBottom: '16px',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: 'var(--radius-md)',
            color: '#92400E',
            fontSize: '12px'
          }}
        >
          Backend sedang tidak aktif &mdash; status tahapan yang ditampilkan berasal dari cache lokal
          dan <strong>mungkin sudah usang</strong>. Aktifkan server SIM-TA (npm start) untuk melihat
          status terbaru.
        </div>
      )}

      <PageHeader
        breadcrumbs={[
          { label: 'Portal Mahasiswa' },
          { label: `Portal ${prodiInfo.jenjang}` },
          { label: 'Tahapan Akademik' }
        ]}
        title={`Alur Tahapan ${istilahTA}`}
        description={`Perjalanan akademik resmi program ${prodiInfo.namaProdi} sesuai Buku Pedoman Tugas Akhir 2026.`}
        statusBadge={<StatusBadge status={student.statusTahap} />}
        primaryAction={
          <Button 
            variant="primary"
            onClick={() => onNavigate('persyaratan')}
          >
            Lihat Persyaratan Tahap Ini
          </Button>
        }
      />

      {/* 1. Header Ringkasan Lifecycle Jenjang */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Alert variant="info" title={`Workflow Khusus ${prodiInfo.namaProdi} (${prodiInfo.jenjang})`}>
          Setiap tahapan memiliki dewan penguji dan regulasi waktu tersendiri. Anda saat ini berada pada <strong>Tahap {currentIdx + 1}: {tahapanList[currentIdx]?.nama}</strong>. Klik salah satu tahapan di bawah untuk melihat rincian regulasi dan persyaratannya.
        </Alert>
      </div>

      {/* 2. Visual Sequential Steps Selector */}
      <Panel
        title={`Tahapan Perjalanan ${istilahTA}`}
        subtitle={`Total ${tahapanList.length} tahapan yang wajib dilalui mahasiswa ${prodiInfo.jenjang}`}
        icon={GitBranch}
      >
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`, gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          {tahapanList.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isActive = idx === currentIdx;
            const isSelected = step.id === selectedTahapId;

            const borderColor = isSelected 
              ? '#1e3a8a' 
              : isActive 
              ? '#0284c7' 
              : isCompleted 
              ? '#bbf7d0' 
              : '#e2e8f0';

            const bgColor = isSelected 
              ? '#eff6ff' 
              : isActive 
              ? '#f0f9ff' 
              : isCompleted 
              ? '#f8fafc' 
              : '#ffffff';

            return (
              <div
                key={step.id}
                role="button"
                tabIndex={0}
                aria-label={`Pilih tahapan ${step.nama}`}
                onClick={() => setSelectedTahapId(step.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedTahapId(step.id);
                  }
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: isSelected ? '2px solid #1e3a8a' : `1.5px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 6px rgba(30,58,138,0.1)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ 
                      fontSize: '10.5px', 
                      fontWeight: '700', 
                      color: isActive ? '#0369a1' : isCompleted ? '#15803d' : '#64748b',
                      backgroundColor: isActive ? '#e0f2fe' : isCompleted ? '#dcfce7' : '#f1f5f9',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      TAHAP {idx + 1}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 size={15} style={{ color: '#16a34a' }} />
                    ) : isActive ? (
                      <Badge variant="gold">Aktif</Badge>
                    ) : null}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '6px', lineHeight: '1.35' }}>
                    {step.nama}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: isActive ? '#0284c7' : isCompleted ? '#15803d' : '#94a3b8', fontWeight: '600' }}>
                  {getStepStatus(idx)}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* 3. Panel Rincian Tahap yang Dipilih */}
      {selectedTahap && (
        <Panel
          title={`Rincian Tahap: ${selectedTahap.nama}`}
          subtitle={`Ketentuan dan standar pelaksanaan berdasarkan Buku Pedoman Tugas Akhir FEB UTM 2026`}
          icon={FileText}
          actions={
            <StatusBadge status={getStepStatus(selectedIdx)} />
          }
        >
          <div className="grid-2col-responsive" style={{ gap: 'var(--space-4)', alignItems: 'stretch' }}>
            
            {/* Kolom Kiri: Deskripsi, Alur Rundown, & Checklist Prasyarat */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              
              {/* Kotak Deskripsi Resmi */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #e2e8f0',
                  borderTop: 'var(--border-width-medium) solid #1e3a8a',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Uraian &amp; Prosedur Akademik
                  </span>
                  <Badge variant={selectedIdx === currentIdx ? 'gold' : selectedIdx < currentIdx ? 'green' : 'neutral'}>
                    Tahap {selectedIdx + 1} dari {tahapanList.length}
                  </Badge>
                </div>
                <p style={{ fontSize: '13px', color: '#1e293b', lineHeight: '1.6', margin: 0 }}>
                  {selectedTahap.nama === 'Seminar Proposal' ? (
                    'Seminar Proposal (Sempro) merupakan forum sidang evaluasi akademik untuk menguji kelayakan ilmiah rancangan penelitian skripsi mahasiswa (BAB I-III). Forum ini bertujuan memastikan rumusan masalah, kerangka teoritis, dan metodologi penelitian telah memenuhi kaidah ilmiah sebelum mahasiswa melakukan pengumpulan data di lapangan.'
                  ) : (
                    selectedTahap.deskripsi
                  )}
                </p>
              </div>

              {/* Khusus Seminar Proposal: Rundown Alur Sidang 90 Menit */}
              {selectedTahap.nama === 'Seminar Proposal' && (
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Alur Pelaksanaan Sidang Sempro (90 Menit)
                    </span>
                    <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: '600', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                      Standar 4 Sesi
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' }}>
                    {[
                      { no: '1', waktu: '5 Mnt', judul: 'Pembukaan & Verifikasi Berkas', desc: 'Oleh Ketua Dewan Penguji' },
                      { no: '2', waktu: '15 Mnt', judul: 'Pemaparan Rancangan Skripsi', desc: 'Presentasi lisan mahasiswa' },
                      { no: '3', waktu: '60 Mnt', judul: 'Tanya Jawab & Telaah Kritis', desc: 'Pengujian oleh Penguji I & II' },
                      { no: '4', waktu: '10 Mnt', judul: 'Musyawarah & Hasil Kelayakan', desc: 'Penetapan Berita Acara Ujian' }
                    ].map((step, sIdx) => (
                      <div 
                        key={sIdx}
                        style={{ 
                          padding: '10px 12px', 
                          backgroundColor: '#f8fafc', 
                          borderRadius: 'var(--radius-md)', 
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#1e3a8a' }}>
                            Sesi {step.no}
                          </span>
                          <span style={{ fontSize: '10px', color: '#64748b', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '1px 6px', borderRadius: 'var(--radius-sm)', fontWeight: '600' }}>
                            {step.waktu}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', lineHeight: '1.3' }}>
                          {step.judul}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                          {step.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Khusus Seminar Proposal: Checklist Kesiapan Berkas */}
              {selectedTahap.nama === 'Seminar Proposal' && (
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Kelengkapan Berkas Prasyarat Seminar Proposal
                    </span>
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>
                      Memenuhi Syarat Sidang
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '6px' }}>
                    {[
                      { label: 'Lembar Persetujuan Pembimbing (ACC)', status: 'Lengkap' },
                      { label: 'Draf Naskah Bab I-III Lengkap', status: 'Lengkap' },
                      { label: 'Surat Bebas Plagiasi Turnitin (≤ 30%)', status: '19% Lolos' },
                      { label: 'Bebas Tanggungan SPP & KRS Aktif', status: 'Lengkap' },
                      { label: 'Draf Proposal Rangkap 3 untuk Penguji', status: 'Diserahkan' },
                      { label: 'Bahan Tayang Presentasi (Maks 15 Slide)', status: 'Siap' }
                    ].map((item, cIdx) => (
                      <div
                        key={cIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={13} style={{ color: '#16a34a', flexShrink: 0 }} />
                          <span style={{ fontSize: '11.5px', color: '#1e293b', fontWeight: '500' }}>
                            {item.label}
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#15803d', fontWeight: '700', backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ketentuan Khusus Jenjang: Desk Review */}
              {selectedTahap.isDeskReview && (
                <div style={{ padding: '14px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #d97706', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>
                    Metode Khusus: Desk Review (Penelaahan Dokumen)
                  </div>
                  <div style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.45' }}>
                    Ujian tidak diselenggarakan secara lisan, melainkan penilaian berkas oleh Dewan Pertimbangan Akademik dan para pembimbing. Dinyatakan layak jika sekurang-kurangnya 2 dari 3 penguji menyatakan layak dan Nilai Akhir ≥ 70.
                  </div>
                </div>
              )}

              {/* Ketentuan Khusus Jenjang: S3 Ujian Tertutup */}
              {student.jenjang === 'S3' && selectedTahap.nama === 'Ujian Tertutup' && (
                <div style={{ padding: '14px 16px', backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe', borderLeft: '4px solid #1e3a8a', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', marginBottom: '6px' }}>
                    Prasyarat Khusus Ujian Tertutup S3:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#0284c7" />
                      <span>TOEFL ≥ 500 &amp; IPK Kumulatif ≥ 3.00</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#0284c7" />
                      <span>Surat Keterangan Bebas Plagiasi Turnitin ≤ 20% &amp; AI ≤ 30%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#0284c7" />
                      <span>Bukti Accepted / LoA artikel Scopus min Q4 / WoS (Afiliasi UTM, Penulis Pertama)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Kolom Kanan: Jadwal Resmi, Dewan Penguji, & Standar Administratif */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              
              {/* Kartu Jadwal Resmi Seminar Proposal (Jika ada pada akun mahasiswa) */}
              {student.jadwalUjian && (selectedTahap.nama === 'Seminar Proposal' || selectedIdx === currentIdx) && (
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid #e2e8f0',
                    borderTop: 'var(--border-width-medium) solid #16a34a',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Jadwal Resmi Pelaksanaan
                    </span>
                    <Badge variant="green">
                      {student.jadwalUjian.status || 'TERJADWAL'}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
                      <Calendar size={14} style={{ color: '#16a34a' }} />
                      <strong style={{ fontSize: '13px' }}>{student.jadwalUjian.hariTanggal}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                      <Clock size={14} style={{ color: '#0284c7' }} />
                      <span>{student.jadwalUjian.waktu}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#475569', marginTop: '2px' }}>
                      <MapPin size={14} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                      <span>{student.jadwalUjian.ruang}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Kartu Dewan Penguji Resmi */}
              {student.pengujiSempro && (selectedTahap.nama === 'Seminar Proposal' || selectedIdx === currentIdx) && (
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid #e2e8f0',
                    borderTop: 'var(--border-width-medium) solid #0284c7',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Dewan Penguji Sempro
                    </span>
                    <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '600' }}>
                      {student.pengujiSempro.length} Orang Penguji
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {student.pengujiSempro.map((pj, pIdx) => (
                      <div 
                        key={pIdx}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#f8fafc',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a8a', fontSize: '10px', fontWeight: '700' }}>
                          {pIdx + 1}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pj.nama}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            {pj.peran}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Standar Administratif Ujian */}
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #e2e8f0',
                  borderTop: 'var(--border-width-medium) solid #475569',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  Standar Administratif Pedoman 2026
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Alokasi Waktu Ujian:</span>
                    <strong style={{ color: '#0f172a' }}>{prodiInfo.alokasiWaktuUjian}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Standar Kelulusan:</span>
                    <strong style={{ color: '#15803d' }}>Minimal Nilai {prodiInfo.kelulusanMinNilai}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Batas Revisi Sempro:</span>
                    <strong style={{ color: '#0f172a' }}>Maks. 14 Hari Kalender</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>Syarat Kelayakan:</span>
                    <strong style={{ color: '#0f172a' }}>Min. 2 dari 3 Penguji Setuju</strong>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Navigasi ke Ujian */}
              {selectedIdx === currentIdx && (
                <div style={{ marginTop: 'auto' }}>
                  <Button 
                    variant="primary" 
                    icon={ArrowRight}
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => onNavigate('ujian')}
                  >
                    Buka Rincian &amp; Jadwal Ujian
                  </Button>
                </div>
              )}
            </div>

          </div>
        </Panel>
      )}
    </div>
  );
}
