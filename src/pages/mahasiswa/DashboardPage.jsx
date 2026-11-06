import React from 'react';
import { 
  PageHeader 
} from '../../components/shell';
import { 
  Panel, 
  Button, 
  StatusBadge, 
  Badge,
  Alert, 
  Timeline, 
  ProgressIndicator, 
  RequirementItem,
  DocumentItem,
  EmptyState,
  StatCard
} from '../../components/ui';
import { PROGRAM_STUDI_INFO, getIstilahTA, getTahapanSkema, TAKK_AMBANG, getKewajibanPublikasiTAKK } from '../../data/pedomanRules';
import { 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  BookOpen, 
  User, 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  ShieldCheck, 
  Calendar,
  MapPin,
  Check,
  Sparkles,
  Award,
  Briefcase,
  GraduationCap,
  ExternalLink,
  TrendingUp,
  FileBadge2,
  ListChecks,
  FolderArchive,
  GitBranch
} from 'lucide-react';

/**
 * Halaman 1: Dashboard Mahasiswa
 * 
 * Menjawab pertanyaan mendasar:
 * "Saya sekarang berada di mana dan apa yang perlu saya lakukan?"
 * 
 * Mendukung Kurikulum Lengkap Buku Pedoman 2026:
 * - S1 TAKT: Skripsi Reguler (Dinda Ayu Larasati)
 * - S1 TAKK: Portofolio Prestasi Bisnis (Moh. Fikri Haikal)
 * - S2: Tesis Magister Manajemen (Rahmat Hidayat)
 * - D3: Laporan Tugas Akhir Terapan (Siti Nur Haliza)
 * - S3: Disertasi Doktoral (Bambang Suryo Utomo)
 */
export default function DashboardPage({
  statusKelulusan, 
  student, 
  studentsList = [],
  onSelectStudent,
  bimbinganList = [], 
  revisiList = [], 
  dokumenList = [],
  activities = [],
  onNavigate 
}) {
  const prodiInfo = PROGRAM_STUDI_INFO[student.jenjang] || PROGRAM_STUDI_INFO.S1;
  const istilahTA = getIstilahTA(student, prodiInfo);
  const tahapanList = getTahapanSkema(student, prodiInfo);
  const currentIdx = tahapanList.findIndex(t => t.id === student.tahapAktifId);
  const activeTahap = tahapanList[currentIdx] || { nama: student.tahapAktifNama, deskripsi: student.statusTahap };
  const nextTahap = currentIdx < tahapanList.length - 1 ? tahapanList[currentIdx + 1] : null;

  // Filter data mahasiswa aktif
  const studentBimbingan = bimbinganList.filter(b => b.mhsId === student.id || (b.nim && String(b.nim).trim() === String(student.nim).trim()));
  const approvedBimbingan = studentBimbingan.filter(b => b.status === 'Disetujui').length;
  const studentRevisi = revisiList.filter(r => r.mhsId === student.id || (r.nim && String(r.nim).trim() === String(student.nim).trim()));
  const studentDokumen = dokumenList.filter(d => d.mhsId === student.id || (d.nim && String(d.nim).trim() === String(student.nim).trim()));
  const studentActivities = activities.filter(a => 
    (!a.mhsId && !a.nim) || 
    (a.mhsId && a.mhsId === student.id) || 
    (a.nim && String(a.nim).trim() === String(student.nim).trim())
  );

  // Target minimal bimbingan dari pedoman
  const minBimbingan = student.jenjang === 'S3' ? 12 : student.jenjang === 'S2' ? 10 : 8;
  const bimbinganCountActual = student.bimbinganCount || approvedBimbingan || studentBimbingan.length;
  const isBimbinganTargetAchieved = bimbinganCountActual >= minBimbingan;

  // Sintesis Rekam Jejak Aktivitas Akademik Nyata (Live Chronological Milestones)
  const dynamicActivities = React.useMemo(() => {
    const list = [];

    // 1. Tahap Aktif Sekarang (Milestone Terkini)
    if (student?.statusTahap) {
      list.push({
        id: 'act-tahap-aktif',
        title: `Tahap Berjalan: ${student.tahapAktifNama || 'Pengelolaan Tugas Akhir'}`,
        date: 'Oktober 2026',
        actor: 'Status Akademik',
        notes: student.statusTahap,
        status: 'current'
      });
    }

    // 2. Aktivitas Khusus Skema TAKK (Skema 1 atau Skema 2)
    if (student?.jenisTA === 'TAKK') {
      const savedSkema1 = typeof window !== 'undefined' ? localStorage.getItem(`skema1_takk_${student?.nim || student?.id}`) : null;
      let skema1Obj = null;
      if (savedSkema1 && savedSkema1 !== 'CANCELLED') {
        try { skema1Obj = JSON.parse(savedSkema1); } catch (e) {}
      }
      if (!skema1Obj && savedSkema1 !== 'CANCELLED' && (student?.skemaTAKK === 'Konversi Langsung' || student?.skema1Pengajuan)) {
        skema1Obj = student.skema1Pengajuan;
      }

      if (skema1Obj) {
        list.push({
          id: 'act-skema1',
          title: 'Pengajuan Konversi Prestasi Unggulan (Skema 1)',
          date: skema1Obj.tanggalPengajuan || '14 Oktober 2026',
          actor: 'Mahasiswa → Koorprodi',
          notes: `Karya diajukan: "${skema1Obj.judulKarya || skema1Obj.namaPrestasi || 'Prestasi Unggulan'}" (${skema1Obj.kategoriPrestasi || 'Jurnal / Juara Nasional'}) — Status: ${skema1Obj.statusPengajuan || 'Diajukan'}`,
          status: 'completed'
        });
      } else if (student?.portofolioData) {
        const pTotal = student.portofolioData.totalPoin || 0;
        const pItems = Array.isArray(student.portofolioData.items) ? student.portofolioData.items : [];
        if (pItems.length > 0) {
          list.push({
            id: 'act-skema2',
            title: 'Pembaruan Dokumen Portofolio Mandiri (Skema 2)',
            date: '28 September 2026',
            actor: 'Validasi Portofolio TAKK',
            notes: `Tercatat ${pItems.length} berkas portofolio terdata dengan total akumulasi ${pTotal} Poin.`,
            status: 'completed'
          });
        }
      }
    }

    // 3. Sesi Bimbingan Terbaru yang Disetujui
    if (studentBimbingan && studentBimbingan.length > 0) {
      const sortedBimbingan = [...studentBimbingan].sort((a, b) => (b.sesi || 0) - (a.sesi || 0));
      const latestBim = sortedBimbingan[0];
      list.push({
        id: `act-bim-${latestBim.id || 1}`,
        title: `Sesi Bimbingan #${latestBim.sesi || bimbinganCountActual} Disetujui`,
        date: latestBim.tanggal || student.sesiTerakhirBimbingan || '15 September 2026',
        actor: latestBim.dosen || student.pembimbing?.[0]?.nama || 'Dosen Pembimbing',
        notes: latestBim.topik ? `Topik: "${latestBim.topik}" • Catatan: ${latestBim.catatan || 'Konsultasi tervalidasi'}` : 'Sesi konsultasi bimbingan telah disahkan oleh dosen pembimbing.',
        status: 'completed'
      });
    } else if (student?.sesiTerakhirBimbingan) {
      list.push({
        id: 'act-bim-last',
        title: `Sesi Konsultasi Bimbingan #${bimbinganCountActual}`,
        date: student.sesiTerakhirBimbingan,
        actor: student.pembimbing?.[0]?.nama || 'Dosen Pembimbing Utama',
        notes: `Telah tercatat ${bimbinganCountActual} sesi bimbingan tervalidasi dalam logbook akademik.`,
        status: 'completed'
      });
    }

    // 4. Hasil Pemeriksaan Turnitin Plagiasi
    if (student?.turnitin) {
      list.push({
        id: 'act-turnitin',
        title: 'Pemeriksaan Bebas Plagiasi Turnitin',
        date: student.turnitin.tanggalPeriksa || '18 September 2026',
        actor: 'UPT Bahasa & Koorprodi',
        notes: `Similarity Index: ${student.turnitin.similarity}% (Maks ${prodiInfo.turnitinSimilarityMax}%) & AI: ${student.turnitin.aiDetection}% • No SK: ${student.turnitin.suratKeteranganNo || 'SK-PLAG/FEB-UTM/2026'}`,
        status: 'completed'
      });
    }

    // 5. Persetujuan Pembimbing Utama (ACC)
    if (student?.pembimbing && student.pembimbing.some(p => p.statusSetuju)) {
      const pSetuju = student.pembimbing.find(p => p.statusSetuju);
      list.push({
        id: 'act-acc-pembimbing',
        title: 'Persetujuan Pembimbing (ACC Naskah)',
        date: 'Awal Semester Ganjil 2026',
        actor: pSetuju.nama || 'Dosen Pembimbing Utama',
        notes: `Persetujuan resmi kemajuan naskah tugas akhir tervalidasi oleh ${pSetuju.peran || 'Pembimbing'}.`,
        status: 'completed'
      });
    }

    // 6. Penetapan Judul Tugas Akhir Resmi
    if (student?.judul) {
      list.push({
        id: 'act-judul',
        title: `Penetapan Judul ${istilahTA} Disahkan`,
        date: 'Awal Perkuliahan TA',
        actor: 'Koordinator Program Studi',
        notes: `"${student.judul}" disahkan dalam agenda pendaftaran jurusan Manajemen FEB UTM.`,
        status: 'completed'
      });
    }

    // Masukkan data aktivitas tambahan dari storage jika ada dan relevan
    if (Array.isArray(studentActivities) && studentActivities.length > 0) {
      studentActivities.forEach((act, idx) => {
        const isOutdatedFikri = student?.nim === '210211100219' && act.deskripsi?.includes('82 poin');
        if (!isOutdatedFikri && !list.some(l => l.title === act.judul)) {
          list.push({
            id: `act-custom-${idx}`,
            title: act.judul,
            date: act.tanggal,
            notes: act.deskripsi,
            actor: act.actor || 'Sistem Akademik',
            status: 'completed'
          });
        }
      });
    }

    return list;
  }, [student, studentBimbingan, studentActivities, bimbinganCountActual, prodiInfo, istilahTA]);

  return (
    <div>
      {/* 1. Page Header Terstandarisasi */}
      {/* Ringkasan Status Kelulusan (Audit 21 Oktober 2026 — P0-2) */}
      {statusKelulusan && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px 18px',
            marginBottom: '18px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid',
            borderColor:
              statusKelulusan.status === 'Lulus'
                ? '#A7F3D0'
                : statusKelulusan.status === 'Siap Pengesahan'
                  ? '#BFDBFE'
                  : '#E2E8F0',
            backgroundColor:
              statusKelulusan.status === 'Lulus'
                ? '#ECFDF5'
                : statusKelulusan.status === 'Siap Pengesahan'
                  ? '#EFF6FF'
                  : '#F8FAFC'
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              {statusKelulusan.label}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px' }}>
              {statusKelulusan.totalTahap > 0
                ? 'Progres tahapan ' + statusKelulusan.tahapSelesai + '/' + statusKelulusan.totalTahap
                : 'Tugas Akhir belum memiliki tahapan.'}
              {statusKelulusan.judulTugasAkhir ? ` — ${statusKelulusan.judulTugasAkhir}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <strong style={{ fontSize: '15px', color: '#0f172a' }}>
              {statusKelulusan.progresPersen}%
            </strong>
            {statusKelulusan.status === 'Siap Pengesahan' && (
              <Button variant="primary" size="sm" onClick={() => onNavigate && onNavigate('dokumen')}>
                Lihat Pengesahan
              </Button>
            )}
            {statusKelulusan.status === 'Lulus' && (
              <Button variant="secondary" size="sm" onClick={() => onNavigate && onNavigate('dokumen')}>
                Dokumen Lulus
              </Button>
            )}
          </div>
        </div>
      )}

      <PageHeader
        breadcrumbs={[
          { label: 'Portal Mahasiswa' },
          { label: `Portal ${prodiInfo.jenjang}` },
          { label: 'Dashboard Akademik' }
        ]}
        title={`Dashboard ${istilahTA}`}
        description={`Sistem Pengelolaan Tugas Akhir ${prodiInfo.namaProdi} — Jurusan Manajemen FEB UTM (2026).`}
        statusBadge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {statusKelulusan && (
              <StatusBadge
                status={
                  statusKelulusan.status === 'Lulus'
                    ? 'Lulus'
                    : statusKelulusan.status === 'Siap Pengesahan'
                      ? 'Siap Pengesahan'
                      : statusKelulusan.status === 'Belum Mulai'
                        ? 'Belum Dimulai'
                        : 'Proses'
                }
              />
            )}
            <StatusBadge status={student.statusTahap} />
          </div>
        }
        primaryAction={
          <Button 
            variant="primary" 
            icon={ArrowRight} 
            iconPosition="right"
            onClick={() => {
              if (student.jenjang === 'S3') onNavigate('ujian');
              else if (studentRevisi.length > 0) onNavigate('revisi');
              else onNavigate('bimbingan');
            }}
          >
            Lanjutkan Tahap Ini
          </Button>
        }
        secondaryAction={
          <Button 
            variant="secondary" 
            onClick={() => onNavigate('detail-ta')}
          >
            Detail Tugas Akhir
          </Button>
        }
      />

      {/* Simulator Switcher: Hanya aktif jika eksplisit diizinkan dan memiliki multi-data */}
      {studentsList && studentsList.length > 1 && onSelectStudent && (
        <div 
          style={{
            marginBottom: '18px',
            padding: '12px 16px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px -1px rgba(11, 27, 61, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-md)', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                Simulasi Kurikulum Mahasiswa (Buku Pedoman 2026):
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Pilih profil untuk melihat penyesuaian UI otomatis lintas jenjang & skema
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {studentsList.map(s => {
              const isSelected = s.id === student.id || s.nim === student.nim;
              const jenjangColor = 
                s.jenjang === 'S3' ? '#7e22ce' : 
                s.jenjang === 'S2' ? '#0284c7' : 
                s.jenisTA === 'TAKK' ? '#d97706' : 
                s.jenjang === 'D3' ? '#059669' : '#1e3a8a';
              
              const shortLabel = 
                s.jenisTA === 'TAKK' ? 'S1 • TAKK Portofolio' : 
                s.jenjang === 'D3' ? 'D3 • Laporan TA' : 
                s.jenjang === 'S2' ? 'S2 • Tesis Magister' : 
                s.jenjang === 'S3' ? 'S3 • Disertasi Doktor' : 'S1 • TAKT Skripsi';

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectStudent(s.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: isSelected ? '700' : '600',
                    backgroundColor: isSelected ? `${jenjangColor}15` : '#f8fafc',
                    border: isSelected ? `2px solid ${jenjangColor}` : '1px solid #e2e8f0',
                    color: isSelected ? jenjangColor : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Ganti tampilan ke ${s.nama} (${shortLabel})`}
                >
                  <span style={{
                    display: 'inline-block',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: jenjangColor
                  }} />
                  <span>{shortLabel} ({s.nama.split(' ')[0]})</span>
                  {isSelected && <Check size={12} color={jenjangColor} strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* KARTU KHUSUS SKEMA: S1 TAKK (TUGAS AKHIR KONTRIBUTIF-KREATIF / PORTOFOLIO BISNIS) */}
      {student.jenisTA === 'TAKK' && (() => {
        const pData = student.portofolioData || {};
        const currentTotalPoin = Number(pData.totalPoin) || 0;
        const portoItems = Array.isArray(pData.items) ? pData.items : [];
        const isEligible = currentTotalPoin >= TAKK_AMBANG.minLayak;
        const isDirectA = currentTotalPoin >= TAKK_AMBANG.minNilaiA;

        return (
          <div style={{ marginBottom: '18px' }}>
            <Panel
              title="Skema TAKK: Portofolio Prestasi Bisnis & Kewirausahaan"
              subtitle="Jalur konversi nilai tugas akhir non-skripsi berdasarkan capaian kejuaraan inovasi bisnis dan luaran artikel ilmiah (Buku Pedoman 2026 Bab VI)."
              icon={Award}
              actions={
                <Button variant="primary" size="sm" onClick={() => onNavigate('detail-ta')}>
                  Rincian Portofolio
                </Button>
              }
            >
              {/* 4 Metrik Kunci TAKK (Dinamis Sesuai Portofolio Nyata Mahasiswa) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <StatCard
                  label="Akumulasi Poin Prestasi"
                  value={currentTotalPoin}
                  unit={`/ ${TAKK_AMBANG.maksPoin} Poin`}
                  icon={Award}
                  tone={isDirectA ? 'green' : isEligible ? 'sky' : 'amber'}
                  caption={isEligible ? 'Memenuhi Syarat (NA ≥ 70)' : `Belum Memenuhi (Kurang ${TAKK_AMBANG.minLayak - currentTotalPoin} Poin)`}
                />
                <StatCard
                  label="Proyeksi Konversi Nilai"
                  value={isDirectA ? 'Nilai A' : isEligible ? 'Nilai B+' : 'Belum Ada'}
                  icon={TrendingUp}
                  tone={isDirectA ? 'green' : isEligible ? 'sky' : 'neutral'}
                  caption={isDirectA ? 'Konversi Nilai A Langsung via SK Dekan' : isEligible ? 'Layak Mengikuti Sidang TAKK' : `Wajib Min. ${TAKK_AMBANG.minLayak} Poin Portofolio`}
                />
                <StatCard
                  label="Status Kelayakan TAKK"
                  value={isEligible ? 'Layak Diverifikasi' : 'Belum Memenuhi'}
                  icon={ShieldCheck}
                  tone={isEligible ? 'amber' : 'red'}
                  caption={pData.statusKelayakan || (isEligible ? 'Menunggu Verifikasi & SK Dekan' : 'Diperlukan Unggahan Portofolio')}
                />
                <StatCard
                  label="Kewajiban Portofolio & Luaran"
                  value={`Min. ${TAKK_AMBANG.minLayak} Poin`}
                  icon={ListChecks}
                  tone={isEligible ? 'green' : 'red'}
                  caption={isEligible ? getKewajibanPublikasiTAKK(currentTotalPoin) : 'Belum Terpenuhi'}
                />
              </div>

                  {/* Rincian Bukti Prestasi Terverifikasi & Jalur Unggah */}
                  <div style={{ backgroundColor: '#ffffff', padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>
                        Dokumen Portofolio yang Diakui Tim Verifikator:
                      </div>
                      <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '600' }}>
                        Total: {portoItems.length} Berkas ({currentTotalPoin} Poin)
                      </span>
                    </div>

                    {portoItems.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', backgroundColor: '#fffbeb', borderRadius: 'var(--radius-md)', border: '1px dashed #fcd34d' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>
                          Belum Ada Dokumen Portofolio yang Diunggah (0 Poin)
                        </div>
                        <div style={{ fontSize: '12px', color: '#78350f', maxWidth: '560px', margin: '0 auto 14px', lineHeight: '1.5' }}>
                          Mahasiswa skema TAKK belum mengunggah berkas portofolio prestasi mandiri. Anda dapat mengunggah bukti kejuaraan lomba/kompetisi, publikasi artikel ilmiah, HKI/paten, bukti usaha wirausaha/startup, atau sertifikasi profesi untuk mengumpulkan poin kelayakan TAKK (minimal 70 Poin).
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Award}
                          onClick={() => onNavigate('portofolio')}
                        >
                          Unggah Portofolio Sekarang
                        </Button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {portoItems.map((item, idx) => (
                          <div key={item.id || idx} style={{ padding: '10px 12px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <CheckCircle2 size={16} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <div>
                                  <div style={{ fontSize: '12.5px', color: '#0f172a', fontWeight: '600' }}>
                                    {item.nama || item.judul}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span>Berkas: <strong>{item.berkas || 'Berkas_Portofolio.pdf'}</strong></span>
                                    <span>•</span>
                                    <span style={{ color: '#0369a1', fontWeight: '600' }}>Kategori: {item.kategori || 'Portofolio Mandiri'}</span>
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                <span style={{ fontWeight: '800', color: '#b45309', fontSize: '13px' }}>+{item.poin} Poin</span>
                                <Button
                                  variant="secondary"
                                  size="xs"
                                  onClick={() => onNavigate('portofolio')}
                                >
                                  Buka Portofolio
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Panduan & Navigasi Cepat Portofolio TAKK */}
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '16px 18px', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: 'var(--radius-lg)', 
                      border: '1px solid #e2e8f0',
                      borderLeft: '4px solid #1e3a8a',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: '#e0e7ff',
                            color: '#1e3a8a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Award size={16} />
                          </div>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                              Akses Cepat Pengelolaan Portofolio & Kelayakan TAKK
                            </span>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Buku Pedoman Akademik FEB UTM Bab IV (Halaman 13–15)
                            </div>
                          </div>
                        </div>

                        <Badge variant="navy">Standar Pedoman 2026</Badge>
                      </div>

                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                        gap: '10px', 
                        fontSize: '12px', 
                        color: '#334155',
                        lineHeight: '1.5',
                        marginBottom: '14px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                          <CheckCircle2 size={16} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <strong>Menu Portofolio:</strong> Unggah bukti prestasi lomba, publikasi jurnal, HKI, wirausaha mandiri, atau sertifikasi profesi untuk mencapai ambang batas minimal <strong>70 Poin</strong> (atau <strong>80 Poin</strong> untuk konversi langsung Nilai A).
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                          <ShieldCheck size={16} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <strong>Verifikasi Resmi:</strong> Seluruh berkas portofolio yang diunggah akan divalidasi oleh Tim Koorprodi S1 Manajemen dan otomatis terarsip di Pusat Dokumen.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Award}
                          onClick={() => onNavigate('portofolio')}
                        >
                          Buka Menu Portofolio
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={ListChecks}
                          onClick={() => onNavigate('persyaratan')}
                        >
                          Periksa Matriks Persyaratan
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={FolderArchive}
                          onClick={() => onNavigate('dokumen')}
                        >
                          Lihat Pusat Dokumen
                        </Button>
                      </div>
                    </div>
                  </div>
            </Panel>
          </div>
        );
      })()}

      {/* KARTU KHUSUS AGENDA UJIAN TERJADWAL (S1 Sempro, S2 Tesis, S3 Kelayakan, D3 Sidang TA) */}
      {student.jadwalUjian && (
        <div style={{ marginBottom: '18px' }}>
          <div 
            style={{ 
              padding: '16px 20px', 
              backgroundColor: '#eff6ff', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid #bfdbfe', 
              borderLeft: '5px solid #1e3a8a',
              boxShadow: '0 2px 8px rgba(30, 58, 138, 0.06)' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-lg)', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a8a', flexShrink: 0 }}>
                  <Calendar size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e3a8a', margin: 0 }}>
                      Agenda Sidang Terjadwal: {student.tahapAktifNama}
                    </h3>
                    <Badge variant="navy">Status: {student.jadwalUjian.status || 'Terjadwal'}</Badge>
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Calendar size={13} style={{ color: '#475569' }} /> <strong>{student.jadwalUjian.hariTanggal}</strong></span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={13} style={{ color: '#475569' }} /> <strong>{student.jadwalUjian.waktu}</strong></span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} style={{ color: '#475569' }} /> <strong>{student.jadwalUjian.ruang}</strong></span>
                  </div>
                </div>
              </div>

              <Button 
                variant="primary" 
                size="sm"
                onClick={() => onNavigate('ujian')}
              >
                Lihat Susunan Penguji & Berkas
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. AREA FOKUS: "Saya Sekarang Berada di Mana?" */}
      <Panel
        title="Posisi Akademik Saat Ini"
        subtitle={`Tahap ${currentIdx + 1} dari ${tahapanList.length} pada kurikulum ${prodiInfo.namaProdi}`}
        icon={Clock}
        className="dashboard-position-panel"
      >
        <div className="grid-2col-responsive" style={{ gap: 'var(--space-4)', alignItems: 'stretch' }}>
          
          {/* Kolom Kiri: Judul & Identitas TA */}
          <div 
            style={{ 
              padding: '16px', 
              backgroundColor: '#ffffff', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid #e2e8f0',
              borderTop: 'var(--border-width-medium) solid #1e3a8a',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Judul Naskah Terdaftar
                </span>
                <Badge variant="primary">
                  {student.jenisTA === 'TAKK' ? 'Tugas Akhir (TAKK)' : `${prodiInfo.istilahTA} (${student.jenisTA || 'TAKT'})`}
                </Badge>
              </div>

              <h2 style={{ fontSize: '15.5px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px', lineHeight: '1.45' }}>
                {student.judul}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: '#475569', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
                <strong>Penulis:</strong> {student.nama} ({student.nim})
              </span>
              <span style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
                <strong>Semester:</strong> {student.semester}
              </span>
              <span style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
                <strong>SKS Lulus:</strong> {student.sksLulus} SKS (IPK {student.ipk})
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Posisi Tahap & Status Resmi */}
          <div 
            style={{ 
              backgroundColor: '#ffffff', 
              padding: '16px', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid #e2e8f0', 
              borderTop: 'var(--border-width-medium) solid #0284c7',
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tahapan Akademik Aktif
                </span>
                <Badge variant="gold">
                  Tahap {currentIdx + 1} / {tahapanList.length}
                </Badge>
              </div>

              <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {activeTahap.nama}
              </div>

              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: '1.45' }}>
                {activeTahap.deskripsi}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: '8px', rowGap: '6px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', marginTop: '10px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', flexShrink: 0, whiteSpace: 'nowrap' }}>Status Tahapan:</span>
              <StatusBadge status={student.statusTahap} wrap />
            </div>
          </div>

        </div>

        {/* Stepper Visual Horizontal Tahapan */}
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Alur Perjalanan Tahapan {istilahTA}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {nextTahap ? `Berikutnya: ${nextTahap.nama}` : 'Tahapan Akhir'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tahapanList.length}, 1fr)`, gap: '6px' }}>
            {tahapanList.map((step, sIdx) => {
              const isPast = sIdx < currentIdx;
              const isCurrent = sIdx === currentIdx;

              return (
                <button
                  type="button"
                  key={step.id || sIdx}
                  onClick={() => onNavigate('tahapan')}
                  className="tahapan-step-btn"
                  aria-current={isCurrent ? 'step' : undefined}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isCurrent ? '#eff6ff' : isPast ? '#f0fdf4' : '#f8fafc',
                    border: isCurrent ? '1.5px solid #1e3a8a' : isPast ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    width: '100%',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    color: 'inherit'
                  }}
                  title={`Klik untuk melihat rincian ${step.nama}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: '700', color: isCurrent ? '#1e3a8a' : isPast ? '#16a34a' : '#64748b' }}>
                      T{sIdx + 1}
                    </span>
                    {isPast && <Check size={11} style={{ color: '#16a34a' }} />}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: isCurrent ? '700' : '600', color: isCurrent ? '#0f172a' : isPast ? '#166534' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {step.nama}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* 3. AREA TINDAKAN: "Apa yang Perlu Saya Lakukan?" (Next Action) */}
      {student.perluPerhatian && student.perluPerhatian.length > 0 && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div 
            style={{ 
              padding: '14px 16px', 
              backgroundColor: '#fffdf5', 
              border: '1px solid #fef08a', 
              borderLeft: '4px solid #d97706',
              borderRadius: 'var(--radius-lg)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <AlertCircle size={16} style={{ color: '#b45309', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', margin: 0 }}>
                  Tindakan Mandatori Mahasiswa (Perlu Segera Ditindaklanjuti)
                </h4>
                <p style={{ fontSize: '11.5px', color: '#78350f', margin: '2px 0 0' }}>
                  Agenda dan kelengkapan resmi yang memerlukan tindakan Anda sebelum batas tenggat waktu.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {student.perluPerhatian.map((act) => (
                <div 
                  key={act.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #fde68a',
                    borderRadius: 'var(--radius-md)',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d97706', flexShrink: 0 }} />
                    <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#0f172a' }}>
                      {act.deskripsi}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#92400e', backgroundColor: '#fef3c7', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontWeight: '600' }}>
                      <Calendar size={12} /> Tenggat: {act.deadline}
                    </span>
                    <Button 
                      variant="primary" 
                      size="sm"
                      icon={ArrowRight}
                      iconPosition="right"
                      onClick={() => {
                        if (act.deskripsi.toLowerCase().includes('revisi')) onNavigate('revisi');
                        else if (act.deskripsi.toLowerCase().includes('proposal') || act.deskripsi.toLowerCase().includes('ujian')) onNavigate('ujian');
                        else onNavigate('persyaratan');
                      }}
                    >
                      Tindak Lanjuti
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. GRID DUA KOLOM: PEMBIMBINGAN & PERSYARATAN / TURNITIN */}
      <div className="grid-2col-responsive" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)', alignItems: 'stretch' }}>
        
        {/* Kolom 1: Bimbingan & Pembimbing */}
        <Panel
          title="Bimbingan & Dosen Pembimbing"
          subtitle={`Minimal ${minBimbingan} sesi bimbingan sah sebelum pendaftaran ujian.`}
          icon={MessageSquare}
          actions={
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => onNavigate('bimbingan')}
            >
              Lihat Logbook
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* List Dosen Pembimbing */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                {student.jenjang === 'S3' ? 'Promotor & Kopromotor Resmi' : 'Dosen Pembimbing Terdaftar'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {student.pembimbing && student.pembimbing.length > 0 ? (
                  student.pembimbing.map((p, idx) => (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a8a', flexShrink: 0 }}>
                          <User size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
                            {p.nama}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                            {p.peran} {p.nip ? `• NIP. ${p.nip}` : ''}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={p.statusSetuju ? 'Disetujui' : 'Dalam Proses'} />
                    </div>
                  ))
                ) : (
                  <div 
                    style={{ 
                      padding: '12px', 
                      backgroundColor: '#f8fafc', 
                      border: '1px dashed #cbd5e1', 
                      borderRadius: 'var(--radius-md)', 
                      fontSize: '12px', 
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Dosen pembimbing belum ditetapkan oleh Koorprodi</span>
                    <StatusBadge status="Belum Ditetapkan" />
                  </div>
                )}
              </div>
            </div>

            {/* Metrik Akumulasi Bimbingan */}
            <div style={{ paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11.5px', color: '#475569' }}>
                  Sesi Konsultasi Sah: <strong>{bimbinganCountActual} Sesi</strong>
                </span>
                <Badge variant={isBimbinganTargetAchieved ? 'green' : 'warning'}>
                  {isBimbinganTargetAchieved ? 'Target Terpenuhi' : `Kurang ${minBimbingan - bimbinganCountActual} Sesi`}
                </Badge>
              </div>

              <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', marginBottom: '4px' }}>
                <div 
                  style={{ 
                    width: `${Math.min(100, Math.round((bimbinganCountActual / minBimbingan) * 100))}%`, 
                    height: '100%', 
                    backgroundColor: isBimbinganTargetAchieved ? '#16a34a' : '#d97706',
                    borderRadius: '999px' 
                  }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                <span>Batas Minimal: {minBimbingan} Sesi</span>
                <span>Sesi Terakhir: {student.sesiTerakhirBimbingan || 'Belum ada data'}</span>
              </div>
            </div>

          </div>
        </Panel>

        {/* Kolom 2: Persyaratan & Uji Turnitin Plagiasi */}
        <Panel
          title="Persyaratan & Integritas Ilmiah"
          subtitle="Verifikasi ambang batas plagiasi Turnitin & kelayakan berkas resmi."
          icon={ShieldCheck}
          actions={
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => onNavigate('persyaratan')}
            >
              Semua Syarat
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Status Turnitin Plagiasi */}
            {student.turnitin ? (
              <div 
                style={{ 
                  padding: '12px 14px', 
                  backgroundColor: '#f0fdf4', 
                  borderRadius: 'var(--radius-lg)', 
                  border: '1px solid #bbf7d0' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={15} style={{ color: '#16a34a' }} />
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#14532d' }}>
                      Uji Plagiasi Turnitin (SK No. 46/2025)
                    </span>
                  </div>
                  <Badge variant="green">MEMENUHI SYARAT</Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ padding: '8px 10px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600' }}>Similarity Index</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#15803d' }}>
                      {student.turnitin.similarity}%
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', margin: '3px 0 2px' }}>
                      <div style={{ width: `${Math.min(100, (student.turnitin.similarity / prodiInfo.turnitinSimilarityMax) * 100)}%`, height: '100%', backgroundColor: '#16a34a' }} />
                    </div>
                    <span style={{ fontSize: '9.5px', color: '#64748b' }}>Batas: ≤ {prodiInfo.turnitinSimilarityMax}%</span>
                  </div>

                  <div style={{ padding: '8px 10px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600' }}>AI Detection</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#0369a1' }}>
                      {student.turnitin.aiDetection}%
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', margin: '3px 0 2px' }}>
                      <div style={{ width: `${Math.min(100, (student.turnitin.aiDetection / prodiInfo.turnitinAiMax) * 100)}%`, height: '100%', backgroundColor: '#0284c7' }} />
                    </div>
                    <span style={{ fontSize: '9.5px', color: '#64748b' }}>Batas: ≤ {prodiInfo.turnitinAiMax}%</span>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                  <span>SK: <strong>{student.turnitin.suratKeteranganNo || 'SK-PLAG/FEB-UTM/2026'}</strong></span>
                  <span>{student.turnitin.tanggalPeriksa}</span>
                </div>
              </div>
            ) : (
              <div 
                style={{ 
                  padding: '12px 14px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: 'var(--radius-lg)', 
                  border: '1px solid #e2e8f0' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
                    Uji Plagiasi Turnitin (SK No. 46/2025)
                  </span>
                  <Badge variant="neutral">Belum Diuji</Badge>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                  Pemeriksaan orisinalitas naskah belum dilakukan. Hasil uji Turnitin akan terbit setelah draf diajukan ke prodi.
                </div>
              </div>
            )}

            {/* Checklist Persyaratan Ringkas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>
                    Kemampuan Bahasa Inggris (TOEFL ≥ {prodiInfo.toeflMin})
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                    Capaian: Skor {student.toefl} (Lolos Batas Minimal)
                  </div>
                </div>
                <StatusBadge status={student.toefl >= prodiInfo.toeflMin ? 'Disetujui' : 'Tidak Lulus'} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>
                    Beban Satuan Kredit Semester (SKS)
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                    Transkrip: {student.sksLulus} SKS Lulus • IPK {student.ipk}
                  </div>
                </div>
                <StatusBadge status="Disetujui" />
              </div>
            </div>

          </div>
        </Panel>

      </div>

      {/* 5. GRID DUA KOLOM: REVISI UJIAN & AKTIVITAS HISTORIS */}
      <div className="grid-2col-responsive" style={{ gap: 'var(--space-4)', alignItems: 'stretch' }}>
        
        {/* Kolom 1: Status Revisi Ujian */}
        <Panel
          title="Matriks Catatan Revisi"
          subtitle={`Maksimal perbaikan ${prodiInfo.revisiBatasWaktu} sesuai Berita Acara Ujian.`}
          icon={FileText}
          actions={
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => onNavigate('revisi')}
            >
              Matriks Lengkap
            </Button>
          }
        >
          {studentRevisi.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {studentRevisi.map((rev) => (
                <div 
                  key={rev.id} 
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderLeft: 'var(--border-width-medium) solid #1e3a8a',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
                      {rev.bagian}
                    </span>
                    <StatusBadge status={rev.status} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                    Penguji: <strong>{rev.namaPenguji}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.45', backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
                    "{rev.catatanPenguji}"
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="Tidak Ada Catatan Revisi Tertunda"
              description="Naskah Anda berada dalam status bersih dan telah memenuhi standar dewan penguji."
            />
          )}
        </Panel>

        {/* Kolom 2: Rekam Jejak Aktivitas Akademik */}
        <Panel
          title="Rekam Jejak Aktivitas Akademik"
          subtitle="Catatan riwayat verifikasi, konsultasi bimbingan, dan perkembangan tugas akhir."
          icon={Calendar}
          actions={
            <Button 
              variant="secondary" 
              size="sm"
              icon={GitBranch}
              onClick={() => onNavigate('tahapan')}
            >
              Alur Tahapan Lengkap
            </Button>
          }
        >
          {dynamicActivities.length > 0 ? (
            <Timeline
              items={dynamicActivities.slice(0, 5).map((act, i) => ({
                id: act.id || `act-${i}`,
                title: act.title,
                date: act.date,
                actor: act.actor,
                notes: act.notes,
                status: act.status || (i === 0 ? 'current' : 'completed')
              }))}
            />
          ) : (
            <EmptyState
              icon={Clock}
              title="Belum Ada Rekam Jejak Aktivitas"
              description="Aktivitas bimbingan, verifikasi berkas, dan tahapan ujian akan otomatis tercatat di sini."
            />
          )}
        </Panel>

      </div>
    </div>
  );
}
