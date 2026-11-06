import React, { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Send,
  Bell,
  Users,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Layers,
  Megaphone,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Card, Badge, Button, Modal, FormField, Textarea, Input, Select, Alert, StatusBadge, EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/shell';
import { confirmDialog, notify } from '../../components/feedback';

// Referensi Master Rekomendasi Tahap per Jenjang
const PRESET_TAHAPAN = {
  D3: [
    { kode: 'D3-T1', nama: 'Pengajuan Ide & Topik Proyek Bisnis', prodi: 'D-3 Entrepreneurship', defaultModa: 'Daring via SIM-TA', target: 90 },
    { kode: 'D3-T2', nama: 'Pendampingan & Inkubasi Usaha Lapangan', prodi: 'D-3 Entrepreneurship', defaultModa: 'Hybrid', target: 90 },
    { kode: 'D3-T3', nama: 'Ujian Sidang Tugas Akhir & Gelar Produk', prodi: 'D-3 Entrepreneurship', defaultModa: 'Luring Gedung RKB Lt. 2', target: 85 }
  ],
  S1: [
    { kode: 'S1-T1', nama: 'Pengajuan Topik & Plotting Pembimbing', prodi: 'S-1 Manajemen', defaultModa: 'Daring via SIM-TA', target: 250 },
    { kode: 'S1-T2', nama: 'Seminar Proposal (Sempro)', prodi: 'S-1 Manajemen', defaultModa: 'Luring Gedung RKB Lt. 2 & 3', target: 200 },
    { kode: 'S1-T3', nama: 'Penelitian & Bimbingan Berkala', prodi: 'S-1 Manajemen', defaultModa: 'Hybrid', target: 220 },
    { kode: 'S1-T4', nama: 'Sidang Ujian Skripsi / TAKK Final', prodi: 'S-1 Manajemen', defaultModa: 'Luring Gedung RKB', target: 180 }
  ],
  S2: [
    { kode: 'S2-T1', nama: 'Penetapan Pembimbing & Ujian Proposal Tesis', prodi: 'S-2 Magister Manajemen', defaultModa: 'Daring via SIM-TA', target: 50 },
    { kode: 'S2-T2', nama: 'Penelitian Lapangan & Penulisan Tesis', prodi: 'S-2 Magister Manajemen', defaultModa: 'Hybrid', target: 50 },
    { kode: 'S2-T3', nama: 'Seminar Hasil Tesis (Semhas)', prodi: 'S-2 Magister Manajemen', defaultModa: 'Hybrid (Graha Lt. 3 / Zoom)', target: 45 },
    { kode: 'S2-T4', nama: 'Ujian Tesis (Sidang Tertutup Magister)', prodi: 'S-2 Magister Manajemen', defaultModa: 'Luring Ruang Graha Pascasarjana', target: 40 },
    { kode: 'S2-T5', nama: 'Pengesahan Naskah & Bebas Plagiasi Final', prodi: 'S-2 Magister Manajemen', defaultModa: 'Daring via SIM-TA', target: 40 }
  ],
  S3: [
    { kode: 'S3-T1', nama: 'Penetapan Promotor & Topik Disertasi', prodi: 'S-3 Doktor Ilmu Manajemen', defaultModa: 'Daring via SIM-TA', target: 15 },
    { kode: 'S3-T2', nama: 'Ujian Kualifikasi Doktoral', prodi: 'S-3 Doktor Ilmu Manajemen', defaultModa: 'Luring Ruang Sidang Pascasarjana', target: 15 },
    { kode: 'S3-T3', nama: 'Ujian Usulan Penelitian (Proposal Disertasi)', prodi: 'S-3 Doktor Ilmu Manajemen', defaultModa: 'Luring Ruang Sidang Pascasarjana', target: 12 },
    { kode: 'S3-T4', nama: 'Ujian Kelayakan (Desk Review Naskah Disertasi)', prodi: 'S-3 Doktor Ilmu Manajemen', defaultModa: 'Daring via SIM-TA (Reviewer Independen)', target: 12 },
    { kode: 'S3-T5', nama: 'Seminar Hasil Disertasi', prodi: 'S-3 Doktor Ilmu Manajemen', defaultModa: 'Hybrid (Graha Lt. 3 / Zoom)', target: 10 },
    { kode: 'S3-T6', nama: 'Ujian Tertutup Disertasi (Sidang Tertutup)', prodi: 'S-3 Doktor Ilmu Manajemen', defaultModa: 'Luring Ruang Sidang Graha Lt. 3', target: 10 },
    { kode: 'S3-T7', nama: 'Ujian Terbuka / Promosi Doktoral', prodi: 'S-3 Doktor Ilmu Manajemen', defaultModa: 'Luring Aula Graha Utama UTM', target: 8 },
    { kode: 'S3-T8', nama: 'Pengesahan Naskah Final & Yudisium', prodi: 'S-3 Doktor Ilmu Manajemen', defaultModa: 'Luring Rapat Senat FEB', target: 8 }
  ]
};

const DEFAULT_FORM = {
  id: '',
  jenjang: 'S1',
  prodi: 'S-1 Manajemen',
  tahapKode: 'S1-T2',
  tahapNama: 'Seminar Proposal (Sempro)',
  semester: 'Ganjil 2026/2027',
  tanggalMulai: new Date().toISOString().split('T')[0],
  tanggalSelesai: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  jamDeadline: '23:59',
  status: 'Sedang Dibuka',
  moda: 'Luring Gedung RKB Lt. 2 & 3',
  targetMahasiswa: 200,
  terdaftarMahasiswa: 0,
  persyaratanRingkas: 'Proposal Bab I-III disetujui Dosen Pembimbing, Bebas Tanggungan SPP',
  catatanSOP: 'Pendaftaran berkas verifikasi dibuka setiap hari kerja pukul 08:00 - 15:00 WIB.',
  penanggungJawab: 'Subbag Akademik & Pascasarjana FEB UTM'
};

export default function JadwalTahapanPage({
  jadwalList = [],
  onUpdateJadwalList,
  onBroadcastJadwal
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState(DEFAULT_FORM);

  // Broadcast Modal State
  const [broadcastItem, setBroadcastItem] = useState(null);
  const [broadcastTarget, setBroadcastTarget] = useState('semua');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Banner Notification
  const [notification, setNotification] = useState(null);

  // Filter Data (Dengan Pengecekan Aman & Defensive Guards)
  const safeJadwalList = Array.isArray(jadwalList) ? jadwalList : [];
  const safeQuery = (searchQuery || '').toLowerCase();

  const filteredJadwal = safeJadwalList.filter((item) => {
    if (!item) return false;
    const matchSearch =
      (item.tahapNama || '').toLowerCase().includes(safeQuery) ||
      (item.tahapKode || '').toLowerCase().includes(safeQuery) ||
      (item.catatanSOP && item.catatanSOP.toLowerCase().includes(safeQuery)) ||
      (item.prodi && item.prodi.toLowerCase().includes(safeQuery));
    const matchJenjang = selectedJenjang === 'Semua' || item.jenjang === selectedJenjang;
    const matchStatus = selectedStatus === 'Semua' || item.status === selectedStatus;
    return matchSearch && matchJenjang && matchStatus;
  });

  // Statistik Ringkas
  const totalTahapan = safeJadwalList.length;
  const aktifDibuka = safeJadwalList.filter((j) => j?.status === 'Sedang Dibuka').length;
  const akanDatang = safeJadwalList.filter((j) => j?.status === 'Akan Datang').length;
  const ditutup = safeJadwalList.filter((j) => j?.status === 'Ditutup').length;

  // Handler: Buka Modal Tambah
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({
      ...DEFAULT_FORM,
      id: `jadwal-${Date.now()}`
    });
    setIsModalOpen(true);
  };

  // Handler: Buka Modal Edit
  const handleOpenEditModal = (item) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      jenjang: item.jenjang || 'S1',
      prodi: item.prodi || 'S-1 Manajemen',
      tahapKode: item.tahapKode || '',
      tahapNama: item.tahapNama || '',
      semester: item.semester || 'Ganjil 2026/2027',
      tanggalMulai: item.tanggalMulai || '',
      tanggalSelesai: item.tanggalSelesai || '',
      jamDeadline: item.jamDeadline || '23:59',
      status: item.status || 'Sedang Dibuka',
      moda: item.moda || 'Daring via SIM-TA',
      targetMahasiswa: item.targetMahasiswa || 100,
      terdaftarMahasiswa: item.terdaftarMahasiswa || 0,
      persyaratanRingkas: item.persyaratanRingkas || '',
      catatanSOP: item.catatanSOP || '',
      penanggungJawab: item.penanggungJawab || 'Subbag Akademik & Pascasarjana FEB UTM'
    });
    setIsModalOpen(true);
  };

  // Handler: Ganti Jenjang pada Form (Mengisi preset tahap otomatis)
  const handleJenjangFormChange = (newJenjang) => {
    const presets = PRESET_TAHAPAN[newJenjang] || [];
    const firstPreset = presets[0] || {};
    setFormData((prev) => ({
      ...prev,
      jenjang: newJenjang,
      prodi: firstPreset.prodi || (newJenjang === 'S1' ? 'S-1 Manajemen' : newJenjang === 'S2' ? 'S-2 Magister Manajemen' : newJenjang === 'S3' ? 'S-3 Doktor Ilmu Manajemen' : 'D-3 Entrepreneurship'),
      tahapKode: firstPreset.kode || `${newJenjang}-T1`,
      tahapNama: firstPreset.nama || 'Tahap 1',
      moda: firstPreset.defaultModa || prev.moda,
      targetMahasiswa: firstPreset.target || prev.targetMahasiswa
    }));
  };

  // Handler: Pilih Preset Tahap pada Form
  const handlePresetSelect = (presetKode) => {
    const currentPresets = PRESET_TAHAPAN[formData.jenjang] || [];
    const found = currentPresets.find((p) => p.kode === presetKode);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        tahapKode: found.kode,
        tahapNama: found.nama,
        prodi: found.prodi || prev.prodi,
        moda: found.defaultModa || prev.moda,
        targetMahasiswa: found.target || prev.targetMahasiswa
      }));
    }
  };

  // Handler: Submit Simpan Jadwal (Tambah/Edit)
  const handleSaveJadwal = (e) => {
    e.preventDefault();

    if (!formData.tahapNama || !formData.tanggalMulai || !formData.tanggalSelesai) {
      notify('Mohon lengkapi Nama Tahapan, Tanggal Mulai, dan Tanggal Selesai.', { variant: 'warning' });
      return;
    }

    let updatedList;
    if (modalMode === 'create') {
      const newItem = {
        ...formData,
        id: formData.id || `jadwal-${Date.now()}`
      };
      updatedList = [newItem, ...jadwalList];
      setNotification({
        type: 'success',
        title: 'Jadwal Tahapan Dibuat',
        message: `Jadwal "${newItem.tahapNama}" (${newItem.jenjang}) berhasil dipublikasikan ke kalender akademik.`
      });
    } else {
      updatedList = jadwalList.map((item) => (item.id === formData.id ? { ...formData } : item));
      setNotification({
        type: 'success',
        title: 'Jadwal Tahapan Diperbarui',
        message: `Perubahan jadwal "${formData.tahapNama}" berhasil disimpan.`
      });
    }

    if (onUpdateJadwalList) {
      onUpdateJadwalList(updatedList, formData, modalMode);
    }

    setIsModalOpen(false);
  };

  // Handler: Quick Status Toggle (Buka / Tutup / Akan Datang)
  const handleQuickStatusToggle = (item, newStatus) => {
    const updatedItem = { ...item, status: newStatus };
    const updatedList = jadwalList.map((j) => (j.id === item.id ? updatedItem : j));

    if (onUpdateJadwalList) {
      onUpdateJadwalList(updatedList, updatedItem, 'edit');
    }

    setNotification({
      type: 'info',
      title: 'Status Periode Berubah',
      message: `Tahapan "${item.tahapNama}" (${item.jenjang}) kini berstatus: ${newStatus}.`
    });
  };

  // Handler: Hapus Jadwal
  const handleDeleteJadwal = async (item) => {
    const ok = await confirmDialog({
      title: 'Hapus Jadwal Tahapan',
      message: `Apakah Anda yakin ingin menghapus jadwal "${item.tahapNama}" (${item.jenjang}) dari kalender tahapan?`,
      confirmLabel: 'Ya, Hapus',
      variant: 'danger'
    });
    if (ok) {
      const updatedList = jadwalList.filter((j) => j.id !== item.id);
      if (onUpdateJadwalList) {
        onUpdateJadwalList(updatedList, item, 'delete');
      }
      setNotification({
        type: 'warning',
        title: 'Jadwal Dihapus',
        message: `Jadwal "${item.tahapNama}" telah dihapus dari sistem.`
      });
    }
  };

  // Handler: Buka Modal Broadcast
  const handleOpenBroadcastModal = (item = null) => {
    setBroadcastItem(item);
    if (item) {
      setBroadcastTitle(`[PENGUMUMAN TAHAPAN] ${item.tahapNama} (${item.jenjang}) Periode ${item.semester}`);
      setBroadcastMessage(
        `Diberitahukan kepada mahasiswa dan dosen pembimbing prodi ${item.prodi}, bahwa periode pendaftaran ${item.tahapNama} telah dibuka mulai tanggal ${item.tanggalMulai} hingga ${item.tanggalSelesai} pukul ${item.jamDeadline} WIB. Harap melengkapi berkas administrasi dan naskah sesuai SOP.`
      );
      setBroadcastTarget(item.jenjang);
    } else {
      setBroadcastTitle(`[PENGUMUMAN AKADEMIK] Pembaruan Linimasa & Batas Akhir Tahapan Semester Ganjil 2026/2027`);
      setBroadcastMessage(
        `Subbagian Administrasi Akademik & Pascasarjana FEB UTM telah merilis jadwal tahapan akademik terbaru. Silakan periksa linimasa tahapan di akun masing-masing dan pastikan tidak melewati batas deadline.`
      );
      setBroadcastTarget('semua');
    }
    setIsSendingBroadcast(false);
  };

  // Handler: Kirim Broadcast
  const handleSendBroadcast = () => {
    if (!broadcastTitle || !broadcastMessage) {
      notify('Mohon isi judul dan pesan pengumuman.', { variant: 'warning' });
      return;
    }

    setIsSendingBroadcast(true);

    const payload = {
      title: broadcastTitle,
      message: broadcastMessage,
      target: broadcastTarget,
      tahapKode: broadcastItem?.tahapKode || null,
      jenjang: broadcastItem?.jenjang || broadcastTarget
    };

    if (onBroadcastJadwal) {
      onBroadcastJadwal(payload);
    }

    setTimeout(() => {
      setIsSendingBroadcast(false);
      setBroadcastItem(null);
      setNotification({
        type: 'success',
        title: 'Broadcast Berhasil Dikirim',
        message: `Pengumuman jadwal telah disiarkan ke lonceng notifikasi dan antrean email seluruh ${broadcastTarget === 'semua' ? 'pengguna' : 'mahasiswa & dosen ' + broadcastTarget}.`
      });
    }, 600);
  };

  // Helper Badge Jenjang
  const getJenjangBadgeStyle = (jenjang) => {
    switch (jenjang) {
      case 'D3':
        return { backgroundColor: '#E6FFFA', color: '#047857', border: '1px solid #A7F3D0' };
      case 'S1':
        return { backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' };
      case 'S2':
        return { backgroundColor: '#F3E8FF', color: '#7E22CE', border: '1px solid #DDD6FE' };
      case 'S3':
        return { backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' };
      default:
        return { backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' };
    }
  };

  // Helper Badge Status Periode
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Sedang Dibuka':
        return 'success';
      case 'Akan Datang':
        return 'warning';
      case 'Ditutup':
        return 'error';
      default:
        return 'neutral';
    }
  };

  // Helper Days Remaining
  const getRemainingDays = (tanggalSelesai) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(tanggalSelesai);
      end.setHours(0, 0, 0, 0);
      const diffTime = end - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return 'Telah Berakhir';
      if (diffDays === 0) return 'Hari Terakhir (Hari Ini)';
      return `Sisa ${diffDays} hari lagi`;
    } catch {
      return '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header Institusional */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM' },
          { label: 'Admin Akademik' },
          { label: 'Jadwal & Linimasa Tahapan' }
        ]}
        title="Jadwal & Linimasa Periode Tahapan"
        description="Pengaturan periode pembukaan, tenggat waktu unggah berkas, kuota pendaftaran, dan regulasi SOP tahapan tugas akhir/tesis/disertasi bagi seluruh jenjang (D3, S1, S2, S3)."
        statusBadge={<Badge variant="primary">{aktifDibuka} Periode Aktif</Badge>}
        primaryAction={
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleOpenCreateModal}
          >
            Buat Jadwal Tahapan
          </Button>
        }
        secondaryAction={
          <Button
            variant="secondary"
            icon={Megaphone}
            onClick={() => handleOpenBroadcastModal(null)}
          >
            Broadcast Pengumuman
          </Button>
        }
      />

      {/* 2. Banner Notifikasi Interaktif */}
      {notification && (
        <Alert
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* 3. Summary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)'
        }}
      >
        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-brand-surface)',
              color: 'var(--color-brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)' }}>
              Total Tahapan Terjadwal
            </div>
            <div style={{ fontSize: 'var(--type-title-size)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-main)' }}>
              {totalTahapan} Periode
            </div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-state-success-subtle)',
              color: 'var(--color-state-success-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)' }}>
              Sedang Dibuka (Aktif)
            </div>
            <div style={{ fontSize: 'var(--type-title-size)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-state-success-text)' }}>
              {aktifDibuka} Tahapan
            </div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-state-warning-subtle)',
              color: 'var(--color-state-warning-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)' }}>
              Akan Datang (Segera)
            </div>
            <div style={{ fontSize: 'var(--type-title-size)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-state-warning-text)' }}>
              {akanDatang} Tahapan
            </div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-state-error-subtle)',
              color: 'var(--color-state-error-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CalendarDays size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)' }}>
              Ditutup / Selesai
            </div>
            <div style={{ fontSize: 'var(--type-title-size)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-state-error-text)' }}>
              {ditutup} Tahapan
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Filter Bar & Pencarian */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Filter Jenjang Pills */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--type-caption-size)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)', marginRight: 'var(--space-1)' }}>
              Jenjang:
            </span>
            {['Semua', 'D3', 'S1', 'S2', 'S3'].map((j) => (
              <button
                key={j}
                type="button"
                onClick={() => setSelectedJenjang(j)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: selectedJenjang === j ? 'var(--color-brand-primary)' : 'var(--color-border-subtle)',
                  backgroundColor: selectedJenjang === j ? 'var(--color-brand-primary)' : 'var(--color-surface-card)',
                  color: selectedJenjang === j ? '#ffffff' : 'var(--color-text-main)',
                  fontWeight: selectedJenjang === j ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
                  fontSize: 'var(--type-caption-size)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {j === 'Semua' ? 'Semua Jenjang' : j}
              </button>
            ))}
          </div>

          {/* Filter Status & Search */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
                backgroundColor: 'var(--color-surface-card)',
                color: 'var(--color-text-main)',
                fontSize: 'var(--type-caption-size)'
              }}
            >
              <option value="Semua">Semua Status</option>
              <option value="Sedang Dibuka">Sedang Dibuka (Aktif)</option>
              <option value="Akan Datang">Akan Datang</option>
              <option value="Ditutup">Ditutup</option>
            </select>

            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)'
                }}
              />
              <input
                type="text"
                placeholder="Cari kode atau nama tahapan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'var(--color-surface-card)',
                  color: 'var(--color-text-main)',
                  fontSize: 'var(--type-caption-size)'
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Daftar Card Tahapan */}
      {filteredJadwal.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Tidak ada jadwal tahapan yang cocok dengan filter"
          description="Silakan sesuaikan filter jenjang atau buat jadwal tahapan baru untuk periode ini."
          action={
            <Button variant="primary" onClick={handleOpenCreateModal}>
              <Plus size={16} style={{ marginRight: '6px' }} /> Buat Jadwal Tahapan Baru
            </Button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
          {filteredJadwal.map((item) => {
            const isAktif = item.status === 'Sedang Dibuka';
            const remaining = isAktif ? getRemainingDays(item.tanggalSelesai) : null;
            const jenjangStyle = getJenjangBadgeStyle(item.jenjang);
            const terdaftar = Number(item.terdaftarMahasiswa) || 0;
            const target = Number(item.targetMahasiswa) || 100;
            const percentage = Math.min(Math.round((terdaftar / target) * 100), 100);

            return (
              <Card
                key={item.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: isAktif ? '3px solid var(--color-brand-primary)' : '1px solid var(--color-border-subtle)',
                  boxShadow: isAktif ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  {/* Card Header: Jenjang, Kode, Status */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 'var(--space-3)',
                      gap: 'var(--space-2)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '11px',
                          fontWeight: 'var(--font-weight-bold)',
                          ...jenjangStyle
                        }}
                      >
                        {item.jenjang}
                      </span>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '11px',
                          fontWeight: 'var(--font-weight-semibold)',
                          backgroundColor: 'var(--color-surface-subtle)',
                          color: 'var(--color-text-main)'
                        }}
                      >
                        {item.tahapKode}
                      </span>
                    </div>

                    <StatusBadge variant={getStatusBadgeVariant(item.status)}>
                      {item.status}
                    </StatusBadge>
                  </div>

                  {/* Title & Prodi */}
                  <h3
                    style={{
                      margin: '0 0 4px 0',
                      fontSize: 'var(--type-subhead-size)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--color-text-main)',
                      lineHeight: 1.3
                    }}
                  >
                    {item.tahapNama}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                    {item.prodi || `Program Studi ${item.jenjang}`} • Semester {item.semester}
                  </div>

                  {/* Rentang Waktu & Batas Akhir */}
                  <div
                    style={{
                      backgroundColor: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 'var(--space-3)',
                      marginBottom: 'var(--space-3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-main)' }}>
                      <Calendar size={14} style={{ color: 'var(--color-brand-primary)', flexShrink: 0 }} />
                      <span>
                        <strong>Periode:</strong> {item.tanggalMulai} s/d {item.tanggalSelesai}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} style={{ color: 'var(--color-text-muted)' }} />
                        <span>Deadline: Pukul {item.jamDeadline || '23:59'} WIB</span>
                      </div>
                      {remaining && (
                        <span style={{ color: isAktif ? 'var(--color-brand-primary)' : 'inherit', fontWeight: 'var(--font-weight-semibold)' }}>
                          {remaining}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Moda & Kuota */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-2)',
                      fontSize: '11.5px',
                      marginBottom: 'var(--space-3)',
                      backgroundColor: 'var(--primitive-neutral-50)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '10.5px' }}>Moda / Tempat</div>
                      <div style={{ fontWeight: '600', color: 'var(--color-text-main)', marginTop: '2px' }}>
                        {item.moda || 'Daring via SIM-TA'}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                        <span>Pendaftar Masuk</span>
                        <span style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{percentage}%</span>
                      </div>
                      <div style={{ fontWeight: '600', color: 'var(--color-text-main)', marginTop: '2px', fontSize: '11px' }}>
                        {terdaftar} / {target} Mahasiswa
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '5px',
                          backgroundColor: 'var(--color-border-subtle)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                          marginTop: '4px'
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            backgroundColor: percentage >= 90 ? 'var(--color-state-error-text)' : 'var(--color-brand-primary)',
                            borderRadius: 'var(--radius-full)'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Panel Ketentuan Syarat & Catatan SOP */}
                  {(item.persyaratanRingkas || item.catatanSOP) && (
                    <div
                      style={{
                        backgroundColor: 'var(--color-surface-panel-alt, #f8fafc)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 12px',
                        marginBottom: 'var(--space-3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      {item.persyaratanRingkas && (
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                          <span style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>Syarat Pendaftaran:</span>{' '}
                          {item.persyaratanRingkas}
                        </div>
                      )}

                      {item.catatanSOP && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--color-text-muted)',
                            borderTop: item.persyaratanRingkas ? '1px dashed var(--color-border-subtle)' : 'none',
                            paddingTop: item.persyaratanRingkas ? '6px' : '0',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px',
                            lineHeight: 1.35
                          }}
                        >
                          <span
                            style={{
                              fontWeight: '600',
                              color: 'var(--primitive-gold-700)',
                              backgroundColor: 'var(--primitive-gold-50)',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              flexShrink: 0
                            }}
                          >
                            Catatan SOP
                          </span>
                          <span>{item.catatanSOP}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div
                  style={{
                    borderTop: '1px solid var(--color-border-subtle)',
                    paddingTop: 'var(--space-3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)'
                  }}
                >
                  {/* Status Toggle Quick Buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {item.status !== 'Sedang Dibuka' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusToggle(item, 'Sedang Dibuka')}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          backgroundColor: 'var(--primitive-green-50)',
                          color: 'var(--primitive-green-900)',
                          border: '1px solid var(--primitive-green-200)',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        title="Buka periode pendaftaran sekarang"
                      >
                        <Check size={12} /> Buka Periode
                      </button>
                    )}

                    {item.status !== 'Ditutup' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusToggle(item, 'Ditutup')}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          backgroundColor: 'var(--primitive-red-50)',
                          color: 'var(--primitive-red-900)',
                          border: '1px solid var(--primitive-red-200)',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        title="Tutup pendaftaran tahapan ini"
                      >
                        <X size={12} /> Tutup Periode
                      </button>
                    )}

                    {item.status !== 'Akan Datang' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusToggle(item, 'Akan Datang')}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          backgroundColor: 'var(--primitive-amber-50)',
                          color: 'var(--primitive-amber-900)',
                          border: '1px solid var(--primitive-amber-200)',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        title="Jadikan jadwal akan datang"
                      >
                        <Clock size={12} /> Jadwalkan
                      </button>
                    )}
                  </div>

                  {/* Action Group: Broadcast, Edit, Delete */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenBroadcastModal(item)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'var(--primitive-navy-50)',
                        color: 'var(--primitive-navy-900)',
                        border: '1px solid var(--primitive-navy-200)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '11.5px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Bell size={13} /> Siarkan Pengumuman
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'var(--color-surface-panel-alt)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-border-default)',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '11.5px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit3 size={13} /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteJadwal(item)}
                        aria-label={`Hapus jadwal ${item.nama || item.jenjang || ''}`.trim()}
                        style={{
                          padding: '6px 8px',
                          backgroundColor: 'var(--color-surface-panel-alt)',
                          color: 'var(--primitive-red-700)',
                          border: '1px solid var(--color-border-default)',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title="Hapus Jadwal"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. Modal Buat / Edit Jadwal Tahapan */}
      {/* ======================================================== */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalMode === 'create' ? 'Buat Jadwal & Linimasa Tahapan Baru' : `Edit Jadwal: ${formData.tahapNama}`}
          size="lg"
        >
          <form onSubmit={handleSaveJadwal} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Baris 1: Jenjang & Preset Tahap */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-3)' }}>
              <FormField id="jadwal-jenjang" label="Jenjang Pendidikan" required>
                <select
                  value={formData.jenjang}
                  onChange={(e) => handleJenjangFormChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    backgroundColor: 'var(--color-surface-card)',
                    color: 'var(--color-text-main)'
                  }}
                >
                  <option value="D3">Diploma 3 (D3 Entrepreneurship)</option>
                  <option value="S1">Sarjana (S1 Manajemen)</option>
                  <option value="S2">Magister (S2 Magister Manajemen)</option>
                  <option value="S3">Doktor (S3 Doktor Ilmu Manajemen)</option>
                </select>
              </FormField>

              <FormField id="jadwal-preset" label="Pilih Rekomendasi Tahap dari Regulasi" hint="Otomatis mengisi kode & nama">
                <select
                  value={formData.tahapKode}
                  onChange={(e) => handlePresetSelect(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    backgroundColor: 'var(--color-surface-card)',
                    color: 'var(--color-text-main)'
                  }}
                >
                  {(PRESET_TAHAPAN[formData.jenjang] || []).map((p) => (
                    <option key={p.kode} value={p.kode}>
                      {p.kode} - {p.nama}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Baris 2: Nama Tahap & Kode Custom */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 'var(--space-3)' }}>
              <FormField id="jadwal-kode" label="Kode Tahap" required>
                <Input
                  value={formData.tahapKode}
                  onChange={(e) => setFormData({ ...formData, tahapKode: e.target.value })}
                  placeholder="Contoh: S1-T2"
                />
              </FormField>
              <FormField id="jadwal-nama" label="Nama Lengkap Tahapan" required>
                <Input
                  value={formData.tahapNama}
                  onChange={(e) => setFormData({ ...formData, tahapNama: e.target.value })}
                  placeholder="Contoh: Seminar Proposal (Sempro)"
                />
              </FormField>
            </div>

            {/* Baris 3: Semester & Program Studi */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <FormField id="jadwal-semester" label="Semester Akademik" required>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    backgroundColor: 'var(--color-surface-card)',
                    color: 'var(--color-text-main)'
                  }}
                >
                  <option value="Ganjil 2026/2027">Semester Ganjil 2026/2027</option>
                  <option value="Genap 2026/2027">Semester Genap 2026/2027</option>
                  <option value="Antara 2026/2027">Semester Antara 2026/2027</option>
                </select>
              </FormField>

              <FormField id="jadwal-prodi" label="Program Studi Naungan">
                <Input
                  value={formData.prodi}
                  onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                  placeholder="Program Studi"
                />
              </FormField>
            </div>

            {/* Baris 4: Tanggal Mulai, Tanggal Selesai, Jam Deadline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <FormField id="jadwal-mulai" label="Tanggal Mulai Periode" required>
                <input
                  type="date"
                  value={formData.tanggalMulai}
                  onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    backgroundColor: 'var(--color-surface-card)',
                    color: 'var(--color-text-main)'
                  }}
                  required
                />
              </FormField>

              <FormField id="jadwal-selesai" label="Tanggal Selesai (Batas Akhir)" required>
                <input
                  type="date"
                  value={formData.tanggalSelesai}
                  onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    backgroundColor: 'var(--color-surface-card)',
                    color: 'var(--color-text-main)'
                  }}
                  required
                />
              </FormField>

              <FormField id="jadwal-jam" label="Jam Batas Waktu / Deadline" hint="Format 24 jam">
                <input
                  type="time"
                  value={formData.jamDeadline}
                  onChange={(e) => setFormData({ ...formData, jamDeadline: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    backgroundColor: 'var(--color-surface-card)',
                    color: 'var(--color-text-main)'
                  }}
                />
              </FormField>
            </div>

            {/* Baris 5: Status, Moda, Target Kuota */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <FormField id="jadwal-status" label="Status Periode" required>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    backgroundColor: 'var(--color-surface-card)',
                    color: 'var(--color-text-main)'
                  }}
                >
                  <option value="Sedang Dibuka">Sedang Dibuka (Pendaftaran Aktif)</option>
                  <option value="Akan Datang">Akan Datang (Belum Dibuka)</option>
                  <option value="Ditutup">Ditutup (Pendaftaran Berakhir)</option>
                </select>
              </FormField>

              <FormField id="jadwal-moda" label="Moda / Tempat Pelaksanaan">
                <Input
                  value={formData.moda}
                  onChange={(e) => setFormData({ ...formData, moda: e.target.value })}
                  placeholder="Contoh: Luring Gedung RKB Lt. 2 / Hybrid"
                />
              </FormField>

              <FormField id="jadwal-kuota" label="Target Kuota Mahasiswa">
                <Input
                  type="number"
                  value={formData.targetMahasiswa}
                  onChange={(e) => setFormData({ ...formData, targetMahasiswa: e.target.value })}
                  placeholder="Contoh: 150"
                />
              </FormField>
            </div>

            {/* Baris 6: Ringkasan Syarat & SOP */}
            <FormField id="jadwal-syarat" label="Ringkasan Persyaratan Dokumen & Akademik" hint="Ditampilkan di portal mahasiswa">
              <Input
                value={formData.persyaratanRingkas}
                onChange={(e) => setFormData({ ...formData, persyaratanRingkas: e.target.value })}
                placeholder="Contoh: Lunas SPP, Lulus >= 120 SKS, ACC Pembimbing, Turnitin <= 25%"
              />
            </FormField>

            <FormField id="jadwal-sop" label="Catatan SOP & Instruksi Prosedur Administrasi" hint="Catatan arahan untuk mahasiswa dan dosen">
              <Textarea
                rows={3}
                value={formData.catatanSOP}
                onChange={(e) => setFormData({ ...formData, catatanSOP: e.target.value })}
                placeholder="Contoh: Pendaftaran berkas diverifikasi tim subbag akademik maksimal 3 hari kerja setelah berkas masuk."
              />
            </FormField>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                <CheckCircle2 size={16} style={{ marginRight: '6px' }} />
                {modalMode === 'create' ? 'Terbitkan Jadwal' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 7. Modal Broadcast Pengumuman Jadwal */}
      {/* ======================================================== */}
      {broadcastItem !== null && (
        <Modal
          isOpen={broadcastItem !== null}
          onClose={() => setBroadcastItem(null)}
          title="Broadcast Pengumuman Jadwal Akademik"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div
              style={{
                backgroundColor: 'var(--color-surface-subtle)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                color: 'var(--color-text-muted)'
              }}
            >
              Pengumuman ini akan langsung dikirimkan ke <strong>lonceng notifikasi in-app</strong> seluruh akun sasaran serta dicatat dalam <strong>antrean pengiriman email</strong> SIM-TA FEB UTM.
            </div>

            <FormField id="broadcast-target" label="Target Penerima Notifikasi" required>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'var(--color-surface-card)',
                  color: 'var(--color-text-main)'
                }}
              >
                <option value="semua">Semua Pengguna (Seluruh Mahasiswa & Dosen)</option>
                <option value="D3">Khusus Mahasiswa & Dosen D3 Entrepreneurship</option>
                <option value="S1">Khusus Mahasiswa & Dosen S1 Manajemen</option>
                <option value="S2">Khusus Mahasiswa & Dosen S2 Magister Manajemen</option>
                <option value="S3">Khusus Mahasiswa & Dosen S3 Doktor Ilmu Manajemen</option>
              </select>
            </FormField>

            <FormField id="broadcast-judul" label="Judul Pengumuman" required>
              <Input
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Judul notifikasi..."
              />
            </FormField>

            <FormField id="broadcast-pesan" label="Isi Pesan Siaran" required>
              <Textarea
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Tulis pesan pengumuman lengkap..."
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setBroadcastItem(null)}>
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSendBroadcast}
                disabled={isSendingBroadcast}
              >
                <Send size={16} style={{ marginRight: '6px' }} />
                {isSendingBroadcast ? 'Mengirim...' : 'Kirim Siaran Sekarang'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
