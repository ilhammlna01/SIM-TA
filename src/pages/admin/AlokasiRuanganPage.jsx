import React, { useState } from 'react';
import {
  DoorOpen,
  Calendar,
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle,
  Building2,
  Video,
  Search,
  Filter,
  Trash2,
  MapPin,
  Users,
  ShieldAlert
} from 'lucide-react';
import { Card, Badge, Button, Modal, FormField, Input, Select, Alert, Table } from '../../components/ui';
import { PageHeader } from '../../components/shell';
import { MASTER_RUANGAN } from '../../data/adminData';
import { confirmDialog, notify } from '../../components/feedback';

export default function AlokasiRuanganPage({
  ruanganList = [],
  onUpdateRuangan
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuangId, setSelectedRuangId] = useState('Semua');
  const [selectedModa, setSelectedModa] = useState('Semua');

  // State Modal Tambah
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMhsNama, setFormMhsNama] = useState('Ahmad Zaky Ramadhan');
  const [formNim, setFormNim] = useState('210211100201');
  const [formJenjang, setFormJenjang] = useState('S1');
  const [formJenisUjian, setFormJenisUjian] = useState('Sidang Skripsi');
  const [formRuangId, setFormRuangId] = useState('ruang-1');
  const [formTanggal, setFormTanggal] = useState('2026-10-15');
  const [formJamMulai, setFormJamMulai] = useState('09:00');
  const [formJamSelesai, setFormJamSelesai] = useState('11:00');
  const [formKetuaPenguji, setFormKetuaPenguji] = useState('Dr. Faidal, S.E., M.M.');
  const [formCatatan, setFormCatatan] = useState('');
  const [notification, setNotification] = useState(null);

  // Helper memeriksa bentrok jadwal
  const checkConflict = (ruangId, tanggal, mulai, selesai, ignoreId = null) => {
    return ruanganList.find((slot) => {
      if (ignoreId && slot.id === ignoreId) return false;
      if (slot.ruangId !== ruangId) return false;
      if (slot.tanggal !== tanggal) return false;

      // Pengecekan overlap jam (format HH:mm)
      const toMinutes = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };

      const startA = toMinutes(mulai);
      const endA = toMinutes(selesai);
      const startB = toMinutes(slot.jamMulai);
      const endB = toMinutes(slot.jamSelesai);

      return startA < endB && endA > startB;
    });
  };

  // Cek bentrok form secara realtime
  const activeConflict = checkConflict(formRuangId, formTanggal, formJamMulai, formJamSelesai);

  // Filter list tampilan
  const filteredList = ruanganList.filter((slot) => {
    const matchSearch =
      slot.namaMahasiswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slot.nim.includes(searchQuery) ||
      slot.jenisUjian.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRuang = selectedRuangId === 'Semua' || slot.ruangId === selectedRuangId;
    const matchModa = selectedModa === 'Semua' || slot.moda === selectedModa;
    return matchSearch && matchRuang && matchModa;
  });

  const handleSaveAlokasi = (e) => {
    e.preventDefault();
    if (activeConflict) {
      notify('Tidak dapat menyimpan: Terdapat bentrok penggunaan ruangan pada tanggal dan jam tersebut!', { variant: 'warning' });
      return;
    }

    const targetMaster = MASTER_RUANGAN.find((r) => r.id === formRuangId);

    const newPlot = {
      id: `plot-${Date.now()}`,
      namaMahasiswa: formMhsNama,
      nim: formNim,
      jenjang: formJenjang,
      jenisUjian: formJenisUjian,
      ruangId: formRuangId,
      ruangNama: targetMaster?.nama || 'Ruang Sidang FEB',
      tanggal: formTanggal,
      jamMulai: formJamMulai,
      jamSelesai: formJamSelesai,
      moda: targetMaster?.tipe || 'Luring',
      ketuaPenguji: formKetuaPenguji,
      status: 'Terkonfirmasi',
      catatan: formCatatan || 'Jadwal telah dialokasikan secara resmi oleh Subbag Pascasarjana/Akademik'
    };

    const updated = [newPlot, ...ruanganList];
    if (onUpdateRuangan) {
      onUpdateRuangan(updated);
    }

    setNotification({
      type: 'success',
      message: `Ruangan "${targetMaster?.nama}" berhasil dialokasikan untuk ${formMhsNama} pada ${formTanggal} (${formJamMulai} - ${formJamSelesai}).`
    });

    setIsModalOpen(false);
  };

  const handleDeleteSlot = async (slotId) => {
    const ok = await confirmDialog({
      title: 'Batalkan Alokasi Ruangan',
      message: 'Apakah Anda yakin ingin membatalkan dan menghapus alokasi jadwal ruangan ini?',
      confirmLabel: 'Ya, Batalkan',
      variant: 'danger'
    });
    if (ok) {
      const updated = ruanganList.filter((s) => s.id !== slotId);
      if (onUpdateRuangan) {
        onUpdateRuangan(updated);
      }
      setNotification({
        type: 'info',
        message: 'Alokasi ruangan telah dibatalkan.'
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header Institusional */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM' },
          { label: 'Admin Akademik' },
          { label: 'Alokasi Ruang Sidang' }
        ]}
        title="Pengaturan Alokasi Ruangan Ujian"
        description="Manajemen penjadwalan ruang sidang luring FEB UTM & ruangan virtual Zoom dengan deteksi pencegahan bentrok jadwal otomatis."
        statusBadge={<Badge variant="primary">{ruanganList.length} Sesi Terjadwal</Badge>}
        primaryAction={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            Plotting Ruang Ujian
          </Button>
        }
      />

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          dismissible
          onDismiss={() => setNotification(null)}
        />
      )}

      {/* 2. Ringkasan Master Ruangan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
        {MASTER_RUANGAN.map((r) => {
          const countOccupied = ruanganList.filter((s) => s.ruangId === r.id).length;
          return (
            <Card key={r.id} style={{ padding: 'var(--space-3)', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {r.tipe === 'Luring' ? <Building2 size={16} color="var(--primitive-navy-800)" /> : <Video size={16} color="var(--primitive-blue-600)" />}
                  <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '13px', color: 'var(--primitive-navy-950)' }}>
                    {r.kode}
                  </span>
                </div>
                <Badge variant={r.tipe === 'Luring' ? 'neutral' : 'info'}>{r.tipe}</Badge>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'var(--font-weight-medium)', color: 'var(--primitive-navy-900)', marginTop: '4px' }}>
                {r.nama}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Kapasitas: {r.kapasitas} orang · Fasilitas: {r.fasilitas}
              </div>
              <div style={{ marginTop: '8px', fontSize: '11.5px', color: countOccupied > 0 ? 'var(--primitive-amber-700)' : 'var(--primitive-green-700)', fontWeight: 'var(--font-weight-semibold)' }}>
                {countOccupied > 0 ? `Terjadwal ${countOccupied} sesi ujian` : 'Tersedia'}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 3. Toolbar Filter */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
              <input
                id="ruangan-search-input"
                aria-label="Cari mahasiswa, NIM, atau jenis ujian"
                type="text"
                placeholder="Cari mahasiswa, NIM, atau jenis ujian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 34px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--color-border-default)',
                  fontSize: 'var(--type-body-size)',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>

            <select
              id="ruangan-filter-ruang"
              aria-label="Filter ruangan sidang"
              value={selectedRuangId}
              onChange={(e) => setSelectedRuangId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                fontSize: 'var(--type-body-size)',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="Semua">Semua Ruangan</option>
              {MASTER_RUANGAN.map((r) => (
                <option key={r.id} value={r.id}>{r.nama}</option>
              ))}
            </select>

            <select
              id="ruangan-filter-moda"
              aria-label="Filter moda pelaksanaan ujian"
              value={selectedModa}
              onChange={(e) => setSelectedModa(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                fontSize: 'var(--type-body-size)',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="Semua">Semua Moda</option>
              <option value="Luring">Luring (Offline Kampus)</option>
              <option value="Daring">Daring (Virtual Zoom)</option>
            </select>
          </div>

          <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>
            Alokasi Terjadwal: <strong>{filteredList.length}</strong> sesi
          </div>
        </div>
      </Card>

      {/* 4. Tabel Jadwal Alokasi Ruangan (Terstandarisasi Table Component) */}
      <Table
        columns={[
          {
            key: 'waktu',
            label: 'Waktu & Tanggal',
            sortable: true,
            render: (_, slot) => (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={15} color="var(--color-brand-primary)" />
                  <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
                    {slot.jamMulai} - {slot.jamSelesai} WIB
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '23px' }}>
                  {slot.tanggal}
                </div>
              </div>
            )
          },
          {
            key: 'ruangNama',
            label: 'Ruangan Terpilih',
            sortable: true,
            render: (val, slot) => (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {slot.moda === 'Luring' ? <Building2 size={15} color="var(--primitive-navy-700)" /> : <Video size={15} color="var(--primitive-blue-600)" />}
                  <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: '13px' }}>
                    {val}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '21px' }}>
                  Moda: {slot.moda}
                </div>
              </div>
            )
          },
          {
            key: 'namaMahasiswa',
            label: 'Mahasiswa & Jenjang',
            sortable: true,
            render: (val, slot) => (
              <div>
                <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-navy-950)' }}>
                  {val}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  NIM: {slot.nim} · ({slot.jenjang})
                </div>
              </div>
            )
          },
          {
            key: 'jenisUjian',
            label: 'Jenis Ujian',
            sortable: true,
            render: (val) => (
              <Badge variant={val.includes('Disertasi') ? 'error' : val.includes('Tesis') ? 'warning' : 'info'}>
                {val}
              </Badge>
            )
          },
          {
            key: 'ketuaPenguji',
            label: 'Ketua Penguji',
            sortable: true,
            render: (val) => (
              <div style={{ fontSize: '12.5px', color: 'var(--primitive-navy-900)' }}>
                {val}
              </div>
            )
          },
          {
            key: 'aksi',
            label: 'Aksi',
            align: 'right',
            render: (_, slot) => (
              <Button
                size="sm"
                variant="danger"
                icon={Trash2}
                onClick={() => handleDeleteSlot(slot.id)}
                title="Batalkan alokasi ruangan ini"
              >
                Batalkan
              </Button>
            )
          }
        ]}
        data={filteredList}
        density="normal"
        striped
        emptyContent="Tidak ada jadwal alokasi ruangan yang sesuai kriteria."
      />

      {/* 5. Modal Plotting Ruangan Baru */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title="Plotting & Alokasi Ruang Ujian Sidang"
          size="lg"
        >
          <form onSubmit={handleSaveAlokasi} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Alert Bentrok Realtime */}
            {activeConflict && (
              <div
                style={{
                  backgroundColor: 'var(--primitive-red-50)',
                  border: '1px solid var(--primitive-red-300)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  color: 'var(--primitive-red-800)'
                }}
              >
                <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13.5px' }}>
                    PERINGATAN: BENTROK JADWAL RUANGAN!
                  </div>
                  <div style={{ fontSize: '12.5px', marginTop: '2px', lineHeight: 1.4 }}>
                    Ruangan ini pada tanggal <strong>{formTanggal}</strong> telah dialokasikan untuk ujian mahasiswa <strong>{activeConflict.namaMahasiswa}</strong> pada jam <strong>{activeConflict.jamMulai} - {activeConflict.jamSelesai} WIB</strong>.
                    <br />
                    <em>Silakan ubah jam mulai/selesai atau pilih ruangan lain yang tersedia.</em>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              <div>
                <label
                  htmlFor="plot-form-ruang-id"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
                >
                  Pilih Ruangan Sidang:
                </label>
                <select
                  id="plot-form-ruang-id"
                  value={formRuangId}
                  onChange={(e) => setFormRuangId(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px' }}
                >
                  {MASTER_RUANGAN.map((r) => (
                    <option key={r.id} value={r.id}>{r.nama} ({r.tipe} - Kapasitas {r.kapasitas})</option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="plot-form-tanggal"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
                >
                  Tanggal Pelaksanaan:
                </label>
                <input
                  id="plot-form-tanggal"
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  htmlFor="plot-form-jam-mulai"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
                >
                  Jam Mulai (WIB):
                </label>
                <input
                  id="plot-form-jam-mulai"
                  type="time"
                  value={formJamMulai}
                  onChange={(e) => setFormJamMulai(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label
                  htmlFor="plot-form-jam-selesai"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
                >
                  Jam Selesai (WIB):
                </label>
                <input
                  id="plot-form-jam-selesai"
                  type="time"
                  value={formJamSelesai}
                  onChange={(e) => setFormJamSelesai(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  htmlFor="plot-form-nim"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
                >
                  NIM Mahasiswa:
                </label>
                <input
                  id="plot-form-nim"
                  type="text"
                  value={formNim}
                  onChange={(e) => setFormNim(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label
                  htmlFor="plot-form-mhs-nama"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
                >
                  Nama Lengkap Mahasiswa:
                </label>
                <input
                  id="plot-form-mhs-nama"
                  type="text"
                  value={formMhsNama}
                  onChange={(e) => setFormMhsNama(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  htmlFor="plot-form-jenjang"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
                >
                  Jenjang:
                </label>
                <select
                  id="plot-form-jenjang"
                  value={formJenjang}
                  onChange={(e) => setFormJenjang(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px' }}
                >
                  <option value="S1">S1 Sarjana</option>
                  <option value="S2">S2 Magister</option>
                  <option value="S3">S3 Doktor</option>
                  <option value="D3">D3 Diploma</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="plot-form-jenis-ujian"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
                >
                  Jenis Ujian:
                </label>
                <input
                  id="plot-form-jenis-ujian"
                  type="text"
                  value={formJenisUjian}
                  onChange={(e) => setFormJenisUjian(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="plot-form-ketua-penguji"
                style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
              >
                Ketua Penguji / Penanggung Jawab:
              </label>
              <input
                id="plot-form-ketua-penguji"
                type="text"
                value={formKetuaPenguji}
                onChange={(e) => setFormKetuaPenguji(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label
                htmlFor="plot-form-catatan"
                style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
              >
                Catatan Fasilitas / Logistik:
              </label>
              <textarea
                id="plot-form-catatan"
                rows={2}
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
                placeholder="Contoh: Siapkan proyektor HD, 7 microphone dewan penguji, dan konsumsi sidang..."
                style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={Boolean(activeConflict)}
              >
                Konfirmasi Alokasi Ruang
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
