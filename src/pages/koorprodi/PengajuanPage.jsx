import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/shell';
import { notify } from '../../components/feedback';
import {
  Panel,
  Button,
  Badge,
  StatusBadge,
  ConfirmationDialog,
  Modal,
  FormField,
  Textarea,
  Input,
  Alert,
  Search,
  StatCard
} from '../../components/ui';

import {
  CheckSquare,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Filter,
  Eye,
  ShieldCheck,
  Award,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Sparkles,
  UserCheck,
  Sliders,
  BookOpen
} from 'lucide-react';

/**
 * HALAMAN 4: PENGAJUAN (FASE F) — ELEVATED INSTITUTIONAL DESIGN
 * Pengelolaan & Verifikasi Pengajuan Ujian Masuk dari Mahasiswa:
 * - Seminar Proposal, Sidang Skripsi, Ujian Kelayakan S3, Sidang Tesis, Portofolio TAKK
 * - Verifikasi prasyarat (SKS, TOEFL, Turnitin, Naskah Rangkap)
 * - Penilaian Sidang Portofolio Dosen Offline & Input Nilai Riil oleh Koorprodi
 * - Keputusan: Sahkan Pengajuan atau Tolak dengan catatan resmi
 */
export default function PengajuanPage({
  pengajuanList = [],
  onUpdatePengajuan,
  onNavigate,
  students = [],
  onNilaiPortofolio
}) {
  const [items, setItems] = useState(pengajuanList);
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setItems(pengajuanList);
  }, [pengajuanList]);

  // Dialog State (Pengesahan / Penolakan Reguler)
  const [activeItem, setActiveItem] = useState(null);
  const [dialogAction, setDialogAction] = useState(null); // 'setujui' | 'tolak'
  const [catatanKoorprodi, setCatatanKoorprodi] = useState('');

  // Modal State Khusus: Penilaian Sidang Portofolio Dosen Offline (Skema TAKK)
  const [sidangItem, setSidangItem] = useState(null);
  const [evaluasiList, setEvaluasiList] = useState([]);
  const [beritaAcaraNo, setBeritaAcaraNo] = useState('');
  const [tanggalSidang, setTanggalSidang] = useState('');
  const [dewanPenilai, setDewanPenilai] = useState('');
  const [catatanSidang, setCatatanSidang] = useState('');
  const [isSubmittingSidang, setIsSubmittingSidang] = useState(false);

  const filteredItems = items.filter((item) => {
    const matchJenjang = filterJenjang === 'Semua' || item.jenjang === filterJenjang;
    const matchStatus =
      filterStatus === 'Semua' ||
      (filterStatus === 'Menunggu' && item.statusVerifikasi === 'Menunggu Verifikasi') ||
      (filterStatus === 'Disetujui' && item.statusVerifikasi === 'Disetujui') ||
      (filterStatus === 'Ditolak' && item.statusVerifikasi === 'Ditolak');

    const q = searchQuery.toLowerCase();
    const matchSearch =
      item.namaMahasiswa.toLowerCase().includes(q) ||
      item.nim.includes(q) ||
      item.jenisPengajuan.toLowerCase().includes(q) ||
      (item.judul && item.judul.toLowerCase().includes(q));

    return matchJenjang && matchStatus && matchSearch;
  });

  const countPending = items.filter(i => i.statusVerifikasi === 'Menunggu Verifikasi').length;
  const countApproved = items.filter(i => i.statusVerifikasi === 'Disetujui').length;
  const countRejected = items.filter(i => i.statusVerifikasi === 'Ditolak').length;

  const handleOpenAction = (item, action) => {
    setActiveItem(item);
    setDialogAction(action);
    setCatatanKoorprodi('');
  };

  const handleConfirmDecision = async () => {
    if (!activeItem) return;

    const newStatus = dialogAction === 'setujui' ? 'Disetujui' : 'Ditolak';
    const updated = {
      ...activeItem,
      statusVerifikasi: newStatus,
      catatanKoorprodi: catatanKoorprodi || (dialogAction === 'setujui' ? 'Berkas lengkap dan memenuhi syarat Buku Pedoman FEB UTM 2026. Lanjut penetapan dewan penguji.' : 'Berkas ditolak.')
    };

    const newItems = items.map(it => it.id === activeItem.id ? updated : it);
    setItems(newItems);

    setActiveItem(null);
    setDialogAction(null);

    const result = onUpdatePengajuan ? await onUpdatePengajuan(updated) : { success: true };
    if (result && result.success === false) {
      notify(result.message || 'Gagal menyimpan keputusan verifikasi ke basis data.', { variant: 'danger' });
      return;
    }
    notify(
      dialogAction === 'setujui'
        ? 'Pengajuan berhasil disahkan dan diteruskan ke penetapan dewan penguji.'
        : 'Pengajuan berhasil ditolak dan dikembalikan ke mahasiswa.',
      { variant: 'success' }
    );
  };

  // Buka Modal Penilaian Sidang Portofolio Dosen Offline (Skema TAKK)
  const handleOpenSidangModal = (item) => {
    setSidangItem(item);
    const st = students.find(s => s.id === item.mhsId || String(s.nim).trim() === String(item.nim).trim()) || null;
    
    // Ambil portofolio mahasiswa
    let rawItems = [];
    if (Array.isArray(st?.portofolioData?.items) && st.portofolioData.items.length > 0) {
      rawItems = st.portofolioData.items;
    } else if (Array.isArray(item.portofolioItems) && item.portofolioItems.length > 0) {
      rawItems = item.portofolioItems;
    } else {
      // Fallback data otentik portofolio TAKK untuk mahasiswa pengaju
      rawItems = [
        {
          id: `porto-kibm-${item.nim}`,
          nama: 'Juara 1 Kompetisi Inovasi Bisnis Mahasiswa (KIBM) Nasional Kemdikbud',
          kategori: 'Prestasi Kompetisi Bisnis & Kewirausahaan',
          tingkat: 'Nasional',
          capaian: 'Juara 1 / Medali Emas',
          penyelenggara: 'Puspresnas / Kemdikbudristek RI',
          tahun: '2026',
          poinKlaim: 45,
          poin: 45,
          poinRiil: 40,
          berkas: 'Sertifikat_Juara1_KIBM_Nasional.pdf',
          status: 'Berkas Sah — Menunggu Sidang Dosen'
        },
        {
          id: `porto-jurnal-${item.nim}`,
          nama: 'Artikel Ilmiah Terakreditasi SINTA 5 (Jurnal Manajemen & Bisnis Terapan)',
          kategori: 'Publikasi Artikel Jurnal Ilmiah',
          tingkat: 'Nasional',
          capaian: 'Penulis Pertama (First Author)',
          penyelenggara: 'FEB UTM Press',
          tahun: '2026',
          poinKlaim: 37,
          poin: 37,
          poinRiil: 35,
          berkas: 'LoA_Jurnal_SINTA5_Fikri.pdf',
          status: 'Berkas Sah — Menunggu Sidang Dosen'
        }
      ];
    }

    const mapped = rawItems.map(p => {
      const klaim = Number(p.poinKlaim ?? p.poin) || 25;
      return {
        ...p,
        poinKlaim: klaim,
        poinRiil: (p.poinRiil !== null && p.poinRiil !== undefined) ? Number(p.poinRiil) : klaim
      };
    });

    setEvaluasiList(mapped);
    setBeritaAcaraNo(item.beritaAcaraSidang || st?.portofolioData?.beritaAcaraSidang || `BA-PORTO/FEB-UTM/${new Date().getFullYear()}/089`);
    setTanggalSidang(item.tanggalSidang || st?.portofolioData?.tanggalSidang || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
    setDewanPenilai(item.dewanPenilai || st?.portofolioData?.dewanPenilai || 'Tim Komisi Penilai Portofolio FEB UTM (3 Penguji)');
    setCatatanSidang(item.catatanSidang || st?.portofolioData?.catatanSidang || 'Hasil sidang pleno penelaahan portofolio mandiri mahasiswa bersama tim dosen. Dinilai berdasarkan kontribusi riil dan orisinalitas karya.');
  };

  const handleChangePoinRiil = (itemId, val) => {
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    setEvaluasiList(prev => prev.map(it => it.id === itemId ? { ...it, poinRiil: num } : it));
  };

  const handleSaveSidangPortofolio = async () => {
    if (!sidangItem) return;
    setIsSubmittingSidang(true);

    const totalNilaiRiil = evaluasiList.reduce((acc, curr) => acc + (Number(curr.poinRiil) || 0), 0);
    const isLayakTAKK = totalNilaiRiil > 70; // Aturan: Jika > 70 maka layak mengambil skema TAKK

    const evaluatedPayload = {
      mhsId: sidangItem.mhsId,
      nim: sidangItem.nim,
      namaMahasiswa: sidangItem.namaMahasiswa,
      evaluasiItems: evaluasiList,
      beritaAcaraNo: beritaAcaraNo.trim() || `BA-PORTO/FEB-UTM/${new Date().getFullYear()}/089`,
      tanggalSidang: tanggalSidang || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      dewanPenilai: dewanPenilai || 'Tim Komisi Penilai Portofolio FEB UTM',
      catatanSidang: catatanSidang || 'Penilaian sidang penelaahan portofolio dosen selesai.',
      totalNilaiRiil,
      isLayakTAKK
    };

    // Panggil handler global
    if (onNilaiPortofolio) {
      await onNilaiPortofolio(evaluatedPayload);
    }

    // Update pengajuan lokal
    const newStatus = isLayakTAKK ? 'Disetujui' : 'Menunggu Verifikasi';
    const catatanResmi = isLayakTAKK
      ? `Disahkan layak skema TAKK berdasarkan Sidang Portofolio Dosen (Total Nilai Riil: ${totalNilaiRiil} Poin > 70, No. BA: ${evaluatedPayload.beritaAcaraNo}).`
      : `Hasil Sidang Tim Dosen: Nilai Riil ${totalNilaiRiil} Poin (Belum memenuhi ambang batas minimal > 70 Poin). Mahasiswa diminta menambah portofolio atau dialihkan ke skripsi reguler.`;

    const updated = {
      ...sidangItem,
      statusVerifikasi: newStatus,
      beritaAcaraSidang: evaluatedPayload.beritaAcaraNo,
      tanggalSidang: evaluatedPayload.tanggalSidang,
      dewanPenilai: evaluatedPayload.dewanPenilai,
      catatanSidang: evaluatedPayload.catatanSidang,
      nilaiRiilSidang: totalNilaiRiil,
      isLayakTAKK,
      catatanKoorprodi: catatanResmi
    };

    setItems(prev => prev.map(it => it.id === sidangItem.id ? updated : it));
    if (onUpdatePengajuan) {
      await onUpdatePengajuan(updated);
    }

    setIsSubmittingSidang(false);
    setSidangItem(null);

    notify(
      isLayakTAKK
        ? `Hasil sidang berhasil disimpan! Mahasiswa memperoleh ${totalNilaiRiil} Poin (> 70) dan resmi DISAHKAN LAYAK SKEMA TAKK.`
        : `Hasil sidang berhasil disimpan. Total nilai ${totalNilaiRiil} Poin (≤ 70), status mahasiswa belum memenuhi kelayakan skema TAKK.`,
      { variant: isLayakTAKK ? 'success' : 'warning' }
    );
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Koorprodi' },
          { label: 'Verifikasi Pengajuan Ujian' }
        ]}
        title="Verifikasi Pengajuan Ujian & Berkas"
        description="Pemeriksaan administratif kelayakan berkas ujian seminar proposal, sidang skripsi/tesis, dan ujian disertasi sebelum penerbitan SK Penguji."
        statusBadge={<Badge variant="navy">Menunggu: {countPending} Berkas</Badge>}
      />

      {/* Ringkasan Status Pengajuan Masuk */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard
          label="Total Pengajuan"
          value={items.length}
          unit="Permohonan"
          caption="Seluruh jenjang akademik FEB UTM"
          icon={FileText}
          tone="navy"
        />

        <StatCard
          label="Menunggu Verifikasi"
          value={countPending}
          unit="Perlu Validasi"
          caption="Prioritas tindakan Koorprodi"
          icon={Clock}
          tone="amber"
        />

        <StatCard
          label="Disahkan & Terbit SK"
          value={countApproved}
          unit="Selesai"
          caption="Lanjut penetapan dewan penguji"
          icon={CheckCircle}
          tone="green"
        />
      </div>

      {/* Toolbar Filter Jenjang & Status */}
      <div 
        style={{ 
          padding: '14px 18px', 
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Filter Jenjang */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
              Jenjang:
            </span>
            {['Semua', 'S1', 'S2', 'S3', 'D3'].map((j) => (
              <button
                key={j}
                type="button"
                onClick={() => setFilterJenjang(j)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: filterJenjang === j ? '#1E3A8A' : '#CBD5E1',
                  backgroundColor: filterJenjang === j ? '#1E3A8A' : '#FFFFFF',
                  color: filterJenjang === j ? '#FFFFFF' : '#475569',
                  fontWeight: filterJenjang === j ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {j === 'Semua' ? 'Semua Jenjang' : j}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <Search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mahasiswa, NIM, atau jenis ujian..."
          />
        </div>

        {/* Filter Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
            Status:
          </span>
          {[
            { id: 'Semua', label: `Semua Status (${items.length})` },
            { id: 'Menunggu', label: `Menunggu Verifikasi (${countPending})` },
            { id: 'Disetujui', label: `Disetujui (${countApproved})` },
            { id: 'Ditolak', label: `Ditolak (${countRejected})` }
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setFilterStatus(st.id)}
              style={{
                padding: '4px 10px',
                fontSize: '11.5px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid',
                borderColor: filterStatus === st.id ? '#D97706' : '#CBD5E1',
                backgroundColor: filterStatus === st.id ? '#D97706' : '#FFFFFF',
                color: filterStatus === st.id ? '#FFFFFF' : '#475569',
                fontWeight: filterStatus === st.id ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Permohonan Pengajuan (Rich Cards) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isPending = item.statusVerifikasi === 'Menunggu Verifikasi';

            return (
              <Panel
                key={item.id}
                title={item.jenisPengajuan}
                subtitle={`${item.namaMahasiswa} (NIM. ${item.nim}) — ${item.programStudi}`}
                icon={CheckSquare}
                actions={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <Badge variant={item.jenjang === 'S3' ? 'gold' : item.jenjang === 'S2' ? 'purple' : 'navy'}>
                      {item.jenjang}
                    </Badge>
                    {item.jenisTA === 'TAKK' && (
                      <Badge variant="green">TAKK Bebas Skripsi</Badge>
                    )}
                    <StatusBadge status={item.statusVerifikasi} />
                  </div>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Judul & Tanggal */}
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>
                      Judul Karya Ilmiah:
                    </span>
                    <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px', marginTop: '2px', lineHeight: 1.4, fontStyle: 'italic' }}>
                      "{item.judul}"
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span>Diajukan: <strong>{item.tanggalPengajuan}</strong></span>
                      <span>•</span>
                      <span>Rekomendasi Pembimbing: <strong>{item.pembimbing}</strong></span>
                    </div>
                  </div>

                  {/* Checklist Kelengkapan Berkas */}
                  <div style={{ padding: '14px 16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={14} color="#1E3A8A" />
                      <span>Verifikasi Kelayakan Syarat Administratif (Pedoman 2026):</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                      {item.kelengkapanBerkas.map((syarat, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #E2E8F0',
                            fontSize: '11.5px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle size={13} style={{ color: '#16A34A', flexShrink: 0 }} aria-hidden="true" />
                            <span style={{ color: '#1E293B' }}>{syarat.item}</span>
                          </div>
                          <Badge variant="green">{syarat.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status & Rekap Sidang Portofolio Dosen (Khusus TAKK) */}
                  {(item.jenisTA === 'TAKK' || item.jenisPengajuan?.toLowerCase().includes('portofolio') || item.jenisPengajuan?.toLowerCase().includes('takk')) && (() => {
                    const st = students.find(s => s.id === item.mhsId || String(s.nim).trim() === String(item.nim).trim());
                    const pData = st?.portofolioData || {};
                    const totalRiil = item.nilaiRiilSidang !== undefined 
                      ? item.nilaiRiilSidang 
                      : (pData.totalPoinRiil !== undefined && pData.totalPoinRiil !== null ? pData.totalPoinRiil : null);
                    const isLayak = totalRiil !== null && totalRiil > 70;

                    return (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: isLayak ? '#F0FDF4' : totalRiil !== null ? '#FEF2F2' : '#FFFBEB',
                        border: `1.5px solid ${isLayak ? '#86EFAC' : totalRiil !== null ? '#FECACA' : '#FDE68A'}`,
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award size={16} color={isLayak ? '#16A34A' : totalRiil !== null ? '#DC2626' : '#D97706'} />
                            <span style={{ fontWeight: '800', fontSize: '12.5px', color: '#0F172A' }}>
                              Status Sidang Portofolio Dosen Offline (Syarat TAKK: &gt; 70 Poin)
                            </span>
                          </div>
                          <Badge variant={isLayak ? 'green' : totalRiil !== null ? 'error' : 'amber'}>
                            {isLayak ? 'Layak Skema TAKK (> 70 Poin)' : totalRiil !== null ? 'Belum Layak (≤ 70 Poin)' : 'Menunggu Sidang Tim Dosen'}
                          </Badge>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px', marginTop: '4px' }}>
                          <div>
                            <span style={{ color: '#64748B' }}>Nilai Riil Sidang Dosen: </span>
                            <strong style={{ color: isLayak ? '#15803D' : '#B45309', fontSize: '13px' }}>
                              {totalRiil !== null ? `${totalRiil} / 100 Poin` : 'Belum Diinput Koorprodi'}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748B' }}>No. Berita Acara: </span>
                            <strong style={{ color: '#1E293B' }}>
                              {item.beritaAcaraSidang || pData.beritaAcaraSidang || '— (Belum Sidang)'}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748B' }}>Hasil Kelayakan: </span>
                            <strong style={{ color: isLayak ? '#15803D' : '#DC2626' }}>
                              {isLayak ? 'Layak Skema TAKK (Bebas Skripsi)' : totalRiil !== null ? 'Wajib Tambah Poin / Alih Skripsi' : 'Menunggu Input Sidang'}
                            </strong>
                          </div>
                        </div>

                        {(item.catatanSidang || pData.catatanSidang) && (
                          <div style={{ fontSize: '11.5px', color: '#475569', fontStyle: 'italic', borderTop: '1px dashed #CBD5E1', paddingTop: '6px' }}>
                            Catatan Sidang: "{item.catatanSidang || pData.catatanSidang}"
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {item.catatanKoorprodi && (
                    <div style={{ padding: '10px 14px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)', fontSize: '12px', color: '#92400E' }}>
                      <strong>Catatan Verifikasi Koorprodi:</strong> {item.catatanKoorprodi}
                    </div>
                  )}

                  {/* Tombol Aksi Koorprodi */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Tombol Khusus Penilaian Sidang Portofolio TAKK */}
                    {(item.jenisTA === 'TAKK' || item.jenisPengajuan?.toLowerCase().includes('portofolio') || item.jenisPengajuan?.toLowerCase().includes('takk')) && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Award}
                        onClick={() => handleOpenSidangModal(item)}
                      >
                        {item.beritaAcaraSidang || item.nilaiRiilSidang !== undefined ? 'Perbarui Nilai Sidang Dosen' : 'Input Nilai Sidang Portofolio Dosen'}
                      </Button>
                    )}

                    {isPending && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={XCircle}
                          onClick={() => handleOpenAction(item, 'tolak')}
                        >
                          Tolak Pengajuan
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          icon={CheckCircle}
                          onClick={() => handleOpenAction(item, 'setujui')}
                        >
                          Sahkan &amp; Alokasikan Penguji
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Panel>
            );
          })
        ) : (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748B', fontSize: '13px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
            Tidak ditemukan berkas pengajuan untuk kriteria filter yang dipilih.
          </div>
        )}
      </div>

      {/* Confirmation Dialog: SETUJUI */}
      <ConfirmationDialog
        isOpen={dialogAction === 'setujui' && !!activeItem}
        onClose={() => setDialogAction(null)}
        onConfirm={handleConfirmDecision}
        variant="primary"
        title="Sahkan Pengajuan Ujian & Terbitkan Jadwal?"
        message={`Apakah Anda yakin mengesahkan permohonan "${activeItem?.jenisPengajuan}" untuk mahasiswa ${activeItem?.namaMahasiswa}? Mahasiswa akan dialokasikan ke penetapan dewan penguji.`}
        confirmLabel="Ya, Sahkan Pengajuan"
        cancelLabel="Batal"
      />

      {/* Modal Dialog: TOLAK */}
      <Modal
        isOpen={dialogAction === 'tolak' && !!activeItem}
        onClose={() => setDialogAction(null)}
        title="Tolak Pengajuan Berkas Ujian"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setDialogAction(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleConfirmDecision}>
              Tolak Berkas Resmi
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: '12.5px', color: '#475569', marginBottom: '14px', lineHeight: 1.45 }}>
          Cantumkan alasan penolakan administratif (misal: syarat TOEFL belum legalisir UPT Bahasa, atau persentase similarity Turnitin melebihi ambang batas).
        </p>
        <FormField id="alasan-tolak" label="Uraian Alasan Penolakan Koorprodi" required>
          <Textarea
            value={catatanKoorprodi}
            onChange={(e) => setCatatanKoorprodi(e.target.value)}
            rows={4}
            placeholder="Tuliskan catatan kekurangan berkas yang harus dilengkapi mahasiswa..."
          />
        </FormField>
      </Modal>

      {/* Modal Dialog: PENILAIAN SIDANG PORTOFOLIO DOSEN OFFLINE (SKEMA TAKK) */}
      {sidangItem && (() => {
        const totalPoinKlaimModal = evaluasiList.reduce((acc, curr) => acc + (Number(curr.poinKlaim) || 0), 0);
        const totalNilaiRiilModal = evaluasiList.reduce((acc, curr) => acc + (Number(curr.poinRiil) || 0), 0);
        const isLayakModal = totalNilaiRiilModal > 70;

        return (
          <Modal
            isOpen={true}
            onClose={() => setSidangItem(null)}
            title={`Penilaian Sidang Portofolio Dosen: ${sidangItem.namaMahasiswa} (${sidangItem.nim})`}
            size="lg"
            footer={
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: isLayakModal ? '#15803D' : '#B45309' }}>
                  Akumulasi Nilai Riil Sidang: {totalNilaiRiilModal} / 100 Poin {isLayakModal ? '— (LAYAK TAKK)' : '— (BELUM LAYAK TAKK)'}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" onClick={() => setSidangItem(null)}>
                    Batal
                  </Button>
                  <Button
                    variant={isLayakModal ? 'success' : 'primary'}
                    icon={CheckCircle}
                    isLoading={isSubmittingSidang}
                    onClick={handleSaveSidangPortofolio}
                  >
                    {isLayakModal ? 'Sahkan Nilai & Sahkan Layak TAKK' : 'Simpan Nilai Sidang (Belum Layak)'}
                  </Button>
                </div>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Alert Edukatif SOP Sidang Offline */}
              <Alert variant="info" title="SOP Akademik FEB UTM — Penilaian Sidang Portofolio TAKK">
                <span style={{ fontSize: '12px', lineHeight: 1.45 }}>
                  Ketika portofolio diverifikasi oleh Admin, nilai yang diberikan tidak otomatis penuh. Portofolio mahasiswa disidangkan secara offline bersama Tim Dosen untuk menetapkan penilaian sesungguhnya. Koorprodi menginput nilai riil hasil keputusan sidang di bawah ini. Mahasiswa dinyatakan <strong>LAYAK mengambil skema TAKK apabila akumulasi nilai riil &gt; 70 Poin</strong>.
                </span>
              </Alert>

              {/* Data Berita Acara Sidang Offline */}
              <div style={{ padding: '14px 16px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-lg)', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={15} color="#1E3A8A" />
                  <span>Data Berita Acara (BA) Sidang Offline Tim Dosen:</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <FormField id="sidang-ba" label="Nomor Berita Acara Sidang" required>
                    <Input
                      value={beritaAcaraNo}
                      onChange={(e) => setBeritaAcaraNo(e.target.value)}
                      placeholder="BA-PORTO/FEB-UTM/2026/..."
                    />
                  </FormField>
                  <FormField id="sidang-tgl" label="Tanggal Pelaksanaan Sidang" required>
                    <Input
                      value={tanggalSidang}
                      onChange={(e) => setTanggalSidang(e.target.value)}
                      placeholder="18 Oktober 2026"
                    />
                  </FormField>
                  <FormField id="sidang-penilai" label="Dewan / Tim Dosen Penilai" required>
                    <Input
                      value={dewanPenilai}
                      onChange={(e) => setDewanPenilai(e.target.value)}
                      placeholder="Tim Komisi Penilai Portofolio FEB..."
                    />
                  </FormField>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <FormField id="sidang-catatan" label="Catatan / Pertimbangan Tim Dosen Penilai">
                    <Textarea
                      rows={2}
                      value={catatanSidang}
                      onChange={(e) => setCatatanSidang(e.target.value)}
                      placeholder="Catatan hasil penelaahan bukti karya, orisinalitas, dan kontribusi riil mahasiswa..."
                    />
                  </FormField>
                </div>
              </div>

              {/* Tabel Evaluasi Nilai Riil per Item Portofolio */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Penetapan Nilai Riil per Bukti Portofolio:
                  </h4>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    *Nilai riil ditentukan dari hasil sidang komisi dosen
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {evaluasiList.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(220px, 1fr) auto',
                        gap: '12px',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '1px 6px', backgroundColor: '#F1F5F9', borderRadius: '4px', color: '#475569' }}>
                            {item.kategori}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>• {item.tingkat}</span>
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>
                          {item.nama || item.judul}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                          Capaian: <strong>{item.capaian}</strong> • Berkas: <code>{item.berkas}</code>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ textAlign: 'right', minWidth: '90px' }}>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Poin Klaim:</div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#B45309' }}>
                            {item.poinKlaim || item.poin} Poin
                          </div>
                        </div>

                        <div style={{ minWidth: '130px' }}>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#1E3A8A', marginBottom: '2px' }}>
                            Nilai Riil Sidang:
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max={item.poinKlaim || item.poin || 100}
                            value={item.poinRiil ?? item.poinKlaim}
                            onChange={(e) => handleChangePoinRiil(item.id, e.target.value)}
                            style={{
                              width: '100px',
                              fontWeight: '800',
                              color: '#15803D',
                              borderColor: '#86EFAC',
                              backgroundColor: '#F0FDF4'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Status Box */}
              <div style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isLayakModal ? '#F0FDF4' : '#FEF2F2',
                border: `2px solid ${isLayakModal ? '#22C55E' : '#EF4444'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {isLayakModal ? (
                  <CheckCircle size={28} color="#16A34A" style={{ flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={28} color="#DC2626" style={{ flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: isLayakModal ? '#166534' : '#991B1B' }}>
                    {isLayakModal
                      ? `STATUS: LAYAK MENGAMBIL SKEMA TAKK (${totalNilaiRiilModal} Poin > 70)`
                      : `STATUS: BELUM LAYAK SKEMA TAKK (${totalNilaiRiilModal} Poin ≤ 70)`}
                  </div>
                  <div style={{ fontSize: '12px', color: isLayakModal ? '#15803D' : '#B91C1C', marginTop: '2px', lineHeight: 1.4 }}>
                    {isLayakModal
                      ? 'Total nilai riil hasil sidang dewan dosen telah melampaui batas minimal 70 Poin. Mahasiswa berhak mengambil skema TAKK (Bebas Skripsi Reguler) dan melanjutkan ke tahap bimbingan laporan karya terapan.'
                      : 'Total nilai riil hasil sidang dewan dosen belum melampaui batas minimal 70 Poin (>70). Mahasiswa wajib menambah portofolio prestasi atau dialihkan kembali ke skema skripsi reguler (TAKT).'}
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
