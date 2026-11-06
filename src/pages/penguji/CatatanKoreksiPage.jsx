import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import { confirmDialog, notify } from '../../components/feedback';
import { formatTanggal } from '../../utils/format';
import {
  Panel,
  Button,
  IconButton,
  Table,
  Badge,
  StatusBadge,
  Modal,
  FormField,
  Input,
  Textarea,
  Search,
  StatCard
} from '../../components/ui';

import {
  Edit3,
  PlusCircle,
  FileText,
  CheckCircle,
  AlertTriangle,
  Trash2,
  ExternalLink,
  BookOpen,
  Filter
} from 'lucide-react';

/**
 * HALAMAN 6: CATATAN / KOREKSI PENGUJI (FASE G)
 * Lembar Catatan & Koreksi Resmi Penguji (Pedoman 2026 Bab X Hal 73 & 74):
 * "Masing-masing penguji membuat catatan untuk perbaikan naskah laporan tugas akhir
 * pada lembar yang telah disediakan untuk diberikan kepada mahasiswa."
 * - Bebas dari fitur sosial/komentar berlebihan
 * - Fokus mencatat perbaikan substantif per bab & halaman
 */
export default function CatatanKoreksiPage({
  koreksiList = [],
  ujianList = [],
  onNavigate,
  onAddKoreksi,
  onDeleteKoreksi
}) {
  const [filterUjianId, setFilterUjianId] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Tambah Catatan
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUjianModal, setSelectedUjianModal] = useState(ujianList[0]?.id || '');
  const [babModal, setBabModal] = useState('BAB I — Pendahuluan');
  const [halamanModal, setHalamanModal] = useState('');
  const [kategoriModal, setKategoriModal] = useState('Substansi / Metodologi');
  const [catatanModal, setCatatanModal] = useState('');

  const filteredKoreksi = (koreksiList || []).filter((k) => {
    if (!k) return false;
    const matchUjian = filterUjianId === 'Semua' || k.ujianId === filterUjianId;
    const q = (searchQuery || '').trim().toLowerCase();
    const matchSearch =
      !q ||
      String(k.namaMahasiswa || '').toLowerCase().includes(q) ||
      String(k.nim || '').toLowerCase().includes(q) ||
      String(k.bab || '').toLowerCase().includes(q) ||
      String(k.catatanKoreksi || '').toLowerCase().includes(q);
    return matchUjian && matchSearch;
  });

  const handleSimpanCatatan = async (e) => {
    e.preventDefault();
    if (!catatanModal.trim()) return;

    // Wajib memilih sidang/ujian yang benar-benar terdaftar. Sebelumnya ada fallback
    // fiktif ('uj-fallback') yang menyebabkan galat FOREIGN KEY di backend namun
    // tetap menampilkan notifikasi sukses.
    const uj = (ujianList || []).find(u => u.id === selectedUjianModal);
    if (!uj) {
      notify('Pilih sidang mahasiswa terlebih dahulu sebelum menyimpan catatan koreksi.', { variant: 'warning' });
      return;
    }

    let result = { success: true };
    if (onAddKoreksi) {
      result = await onAddKoreksi({
        ujianId: uj.id,
        mhsId: uj.mhsId,
        namaMahasiswa: uj.namaMahasiswa || 'Mahasiswa Terdaftar',
        nim: uj.nim || '-',
        jenjang: uj.jenjang || 'S1',
        jenisUjian: uj.jenisUjian || 'Ujian Tugas Akhir',
        kategori: kategoriModal,
        bab: babModal,
        halaman: halamanModal || 'Halaman Relevan',
        catatanKoreksi: catatanModal,
        tanggapanMahasiswa: null,
        statusVerifikasi: 'Belum Ditanggapi Mahasiswa',
        fileBuktiRevisi: null,
        tanggal: formatTanggal(new Date())
      });
    }

    if (result && result.success === false) {
      notify(result.message || 'Gagal menyimpan catatan koreksi ke basis data.', { variant: 'danger' });
      return;
    }

    setCatatanModal('');
    setHalamanModal('');
    setModalOpen(false);
    notify('Catatan koreksi resmi berhasil ditambahkan ke lembar ujian mahasiswa.', { variant: 'success' });
  };

  const columns = [
    {
      key: 'mahasiswa',
      label: 'Mahasiswa & Ujian',
      width: '220px',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
            {row.namaMahasiswa}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            NIM: {row.nim} • <Badge variant="navy">{row.jenjang}</Badge>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {row.jenisUjian}
          </div>
        </div>
      )
    },
    {
      key: 'lokasi',
      label: 'Bagian & Halaman',
      width: '180px',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: '600', color: 'var(--primitive-navy-900)', fontSize: '12.5px' }}>
            {row.bab}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {row.halaman}
          </div>
          <div style={{ marginTop: '4px' }}>
            <Badge variant="gold">{row.kategori || 'Substansi'}</Badge>
          </div>
        </div>
      )
    },
    {
      key: 'catatan',
      label: 'Arahan Koreksi & Saran Perbaikan Penguji',
      render: (_, row) => (
        <div>
          <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--primitive-navy-950)' }}>
            {row.catatanKoreksi}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Dicatat tanggal: {row.tanggal}
          </div>
          {row.tanggapanMahasiswa && (
            <div
              style={{
                marginTop: '6px',
                padding: '6px 10px',
                backgroundColor: 'var(--primitive-navy-50)',
                borderLeft: '2px solid var(--color-brand-primary)',
                borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
                fontSize: '11.5px',
                color: 'var(--primitive-navy-900)'
              }}
            >
              <strong>Tanggapan Mahasiswa:</strong> {row.tanggapanMahasiswa}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status Tindak Lanjut',
      width: '170px',
      render: (_, row) => (
        <div>
          <StatusBadge
            status={row.statusVerifikasi}
            variant={
              row.statusVerifikasi === 'Telah Disetujui Penguji'
                ? 'success'
                : row.statusVerifikasi === 'Menunggu Approval Penguji'
                ? 'warning'
                : 'neutral'
            }
          />
          {row.fileBuktiRevisi && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: 'var(--primitive-green-700)', marginTop: '4px' }}>
              <CheckCircle size={11} aria-hidden="true" />
              <span>Bukti perbaikan terunggah</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '120px',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          {row.statusVerifikasi === 'Menunggu Approval Penguji' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('revisi')}
            >
              Verifikasi
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('naskah')}
            >
              Lihat Draf
            </Button>
          )}

          {onDeleteKoreksi && (
            <IconButton
              icon={Trash2}
              size="sm"
              label="Hapus Catatan Koreksi"
              onClick={async () => {
                const ok = await confirmDialog({
                  title: 'Hapus Catatan Koreksi',
                  message: 'Hapus catatan koreksi ini?',
                  confirmLabel: 'Ya, Hapus',
                  variant: 'danger'
                });
                if (ok) {
                  onDeleteKoreksi(row.id);
                }
              }}
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      {/* 1. Header Resmi */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Dewan Penguji' },
          { label: 'Lembar Catatan Koreksi Ujian' }
        ]}
        title="Lembar Catatan & Koreksi Ujian Tugas Akhir"
        description="Dokumentasi resmi catatan evaluasi, koreksi metodologis, dan saran perbaikan naskah sesuai Pedoman 2026"
        statusBadge={<Badge variant="navy">{filteredKoreksi.length} Catatan Terdaftar</Badge>}
        primaryAction={
          <Button
            variant="primary"
            icon={PlusCircle}
            onClick={() => setModalOpen(true)}
          >
            Tambah Catatan Koreksi
          </Button>
        }
        secondaryAction={
          <Button
            variant="secondary"
            icon={BookOpen}
            onClick={() => onNavigate('naskah')}
          >
            Buka Naskah Ujian
          </Button>
        }
      />

      {/* Ringkasan Catatan Koreksi */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard
          label="Total Catatan"
          value={koreksiList.length}
          unit="Arahan Koreksi"
          icon={FileText}
          tone="navy"
        />
        <StatCard
          label="Menunggu Respon"
          value={koreksiList.filter(k => k.statusVerifikasi !== 'Telah Disetujui Penguji').length}
          unit="Perlu Diselesaikan"
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Telah Di-Acc"
          value={koreksiList.filter(k => k.statusVerifikasi === 'Telah Disetujui Penguji').length}
          unit="Tuntas Disetujui"
          icon={CheckCircle}
          tone="green"
        />
      </div>

      {/* 2. Filter & Pencarian Catatan */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
          padding: '12px 16px',
          backgroundColor: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #e2e8f0',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ minWidth: '280px', flex: 1 }}>
          <Search
            placeholder="Cari berdasarkan nama mahasiswa, NIM, bab, atau materi koreksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>
            Filter Sidang:
          </span>
          <select
            value={filterUjianId}
            onChange={(e) => setFilterUjianId(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '12.5px',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--color-surface-panel)',
              color: 'var(--primitive-navy-950)'
            }}
          >
            <option value="Semua">Semua Mahasiswa Ujian</option>
            {ujianList.map((u) => (
              <option key={u.id} value={u.id}>
                [{u.jenjang}] {u.namaMahasiswa} — {u.jenisUjian}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Tabel Catatan Koreksi Resmi */}
      <Panel>
        <Table
          columns={columns}
          data={filteredKoreksi}
          emptyContent="Belum ada catatan koreksi untuk sidang ini. Klik 'Tambah Catatan Koreksi' untuk mencatat poin evaluasi Anda."
        />
      </Panel>

      {/* MODAL TAMBAH CATATAN KOREKSI RESMI */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Form Catatan Koreksi Resmi Dewan Penguji"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSimpanCatatan}>
              Simpan ke Lembar Ujian
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSimpanCatatan} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <FormField id="catatan-sidang" label="Pilih Sidang Mahasiswa" required>
            <select
              value={selectedUjianModal}
              onChange={(e) => setSelectedUjianModal(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--color-surface-panel)'
              }}
            >
              {ujianList.map((u) => (
                <option key={u.id} value={u.id}>
                  [{u.jenjang}] {u.namaMahasiswa} ({u.nim}) — {u.jenisUjian}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid-2col-equal" style={{ gap: 'var(--space-3)' }}>
            <FormField id="catatan-bab" label="Bagian / Bab Naskah" required>
              <Input
                value={babModal}
                onChange={(e) => setBabModal(e.target.value)}
                placeholder="Contoh: BAB II — Kajian Pustaka"
              />
            </FormField>

            <FormField id="catatan-halaman" label="Halaman / Paragraf">
              <Input
                value={halamanModal}
                onChange={(e) => setHalamanModal(e.target.value)}
                placeholder="Contoh: Halaman 45–48"
              />
            </FormField>
          </div>

          <FormField id="catatan-kategori" label="Kategori Aspek Evaluasi" required>
            <select
              value={kategoriModal}
              onChange={(e) => setKategoriModal(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--color-surface-panel)'
              }}
            >
              <option value="Substansi / Metodologi">Substansi / Metodologi Penelitian</option>
              <option value="Kajian Teori / Novelty">Kajian Teori & Kebaruan (Novelty)</option>
              <option value="Tata Tulis & Format Ilmiah">Tata Tulis & Format Ilmiah (Pedoman 2026)</option>
              <option value="Pengujian Hipotesis / Data">Pengujian Hipotesis & Analisis Data</option>
              <option value="Daftar Pustaka & Sitasi">Daftar Pustaka & Sitasi Ilmiah</option>
            </select>
          </FormField>

          <FormField id="catatan-uraian" label="Uraian Catatan Koreksi & Perbaikan Tertulis" required>
            <Textarea
              rows={4}
              value={catatanModal}
              onChange={(e) => setCatatanModal(e.target.value)}
              placeholder="Jelaskan secara spesifik kritik ilmiah, perbaikan metodologis, atau tambahan analisis yang wajib dipenuhi mahasiswa..."
            />
          </FormField>
        </form>
      </Modal>

    </div>
  );
}
