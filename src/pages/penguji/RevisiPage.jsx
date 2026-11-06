import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import { notify } from '../../components/feedback';
import {
  Panel,
  Button,
  IconButton,
  Table,
  Badge,
  StatusBadge,
  Alert,
  Modal,
  FormField,
  Textarea,
  StatCard
} from '../../components/ui';

import {
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  Clock,
  ExternalLink,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { downloadUniversalDoc } from '../../utils/pdfDownloader';

/**
 * HALAMAN 7: REVISI PENGUJI (FASE G)
 * Pemantauan & Verifikasi Revisi Pasca Ujian yang Berkaitan dengan Penguji:
 * - Penguji melihat catatan revisi dan tindak lanjut perbaikan mahasiswa
 * - Bukti draf perbaikan dokumen
 * - Aksi keputusan: "Setujui Perbaikan" (Acc) atau "Kembalikan untuk Perbaikan Ulang"
 * - Bebas dari UI sosial/komentar berlebihan
 */
export default function RevisiPage({
  koreksiList = [],
  onNavigate,
  onApproveRevisi,
  onRejectRevisi
}) {
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [modalFeedbackOpen, setModalFeedbackOpen] = useState(false);
  const [selectedKoreksi, setSelectedKoreksi] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const filteredRevisi = koreksiList.filter((k) => {
    if (filterStatus === 'Menunggu') return k.statusVerifikasi === 'Menunggu Approval Penguji';
    if (filterStatus === 'Disetujui') return k.statusVerifikasi === 'Telah Disetujui Penguji';
    return true;
  });

  const pendingApprovalCount = koreksiList.filter(k => k.statusVerifikasi === 'Menunggu Approval Penguji').length;

  const handleOpenFeedbackModal = (row) => {
    setSelectedKoreksi(row);
    setFeedbackText('');
    setModalFeedbackOpen(true);
  };

  const handleKirimFeedbackRevisi = (e) => {
    e.preventDefault();
    if (!selectedKoreksi) return;

    if (onRejectRevisi) {
      onRejectRevisi(selectedKoreksi.id, feedbackText);
    }
    setModalFeedbackOpen(false);
    notify('Catatan perbaikan lanjutan telah dikirimkan ke mahasiswa.', { variant: 'success' });
  };

  const columns = [
    {
      key: 'mahasiswa',
      label: 'Mahasiswa & Sidang',
      width: '210px',
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
      key: 'koreksiAsal',
      label: 'Catatan Penguji & Lokasi',
      width: '240px',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: '600', color: 'var(--primitive-navy-900)', fontSize: '12px' }}>
            {row.bab} ({row.halaman})
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
            "{row.catatanKoreksi}"
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Kategori: {row.kategori || 'Substansi'}
          </div>
        </div>
      )
    },
    {
      key: 'tindakLanjut',
      label: 'Tanggapan & Berkas Revisi Mahasiswa',
      render: (_, row) => (
        <div>
          {row.tanggapanMahasiswa ? (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--primitive-neutral-50)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '12px',
                color: 'var(--primitive-navy-950)',
                lineHeight: 1.5
              }}
            >
              <strong style={{ color: 'var(--color-brand-primary)' }}>Uraian Perbaikan Mahasiswa:</strong>
              <div style={{ marginTop: '2px' }}>{row.tanggapanMahasiswa}</div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Mahasiswa belum mengunggah tanggapan perbaikan.
            </div>
          )}

          {row.fileBuktiRevisi && (
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={() => downloadUniversalDoc({ namaDokumen: row.fileBuktiRevisi || 'Berkas_Revisi.pdf', jenis: 'Berkas Revisi Naskah' }, { nama: row.mahasiswa, nim: row.nim })}
              >
                Unduh: {row.fileBuktiRevisi}
              </Button>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status Persetujuan',
      width: '160px',
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
          <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Batas: 3 Bulan Pasca Sidang
          </div>
        </div>
      )
    },
    {
      key: 'aksi',
      label: 'Keputusan Penguji',
      width: '180px',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {row.statusVerifikasi === 'Menunggu Approval Penguji' ? (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                onClick={() => {
                  if (onApproveRevisi) {
                    onApproveRevisi(row.id);
                  }
                  notify('Perbaikan naskah mahasiswa telah disetujui (Acc).', { variant: 'success' });
                }}
              >
                Setujui (Acc)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={AlertTriangle}
                onClick={() => handleOpenFeedbackModal(row)}
              >
                Minta Perbaikan Ulang
              </Button>
            </>
          ) : (
            <span style={{ fontSize: '11px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
              <CheckCircle size={14} /> Terverifikasi Sah
            </span>
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
          { label: 'Verifikasi Revisi Mahasiswa' }
        ]}
        title="Verifikasi & Persetujuan Revisi Naskah Ujian"
        description="Pemeriksaan tindak lanjut perbaikan draf tugas akhir pasca ujian sesuai catatan dewan penguji (Batas maksimal 3 bulan sesuai Pedoman 2026)"
        statusBadge={
          pendingApprovalCount > 0 ? (
            <StatusBadge status={`${pendingApprovalCount} Perlu Verifikasi`} variant="warning" />
          ) : (
            <StatusBadge status="Semua Revisi Selesai" variant="success" />
          )
        }
        primaryAction={
          <Button
            variant="secondary"
            icon={BookOpen}
            onClick={() => onNavigate('naskah')}
          >
            Baca Naskah Ujian
          </Button>
        }
      />

      {/* Ringkasan Status Verifikasi Revisi */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard
          label="Total Revisi"
          value={koreksiList.length}
          unit="Berkas Masuk"
          icon={FileText}
          tone="navy"
        />
        <StatCard
          label="Perlu Persetujuan (Acc)"
          value={pendingApprovalCount}
          unit="Mahasiswa"
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Telah Disetujui"
          value={koreksiList.filter(k => k.statusVerifikasi === 'Telah Disetujui Penguji').length}
          unit="Selesai"
          icon={CheckCircle}
          tone="green"
        />
      </div>

      {/* 2. Informasi Kepatuhan Pedoman 2026 */}
      <div style={{ marginBottom: '20px' }}>
        <Alert
          variant="info"
          title="Ketentuan Revisi Ujian Tugas Akhir (Buku Pedoman 2026 Bab X)"
        >
          Mahasiswa yang dinyatakan lulus ujian dengan revisi wajib menyelesaikan perbaikan maksimal <strong>3 (tiga) bulan</strong> setelah tanggal ujian untuk jenjang D3/S1/S2 dan Ujian Kelayakan S3 (atau 6 bulan untuk Ujian Tertutup S3). Kelulusan dinyatakan batal/gugur jika melewati tenggang waktu tersebut.
        </Alert>
      </div>

      {/* 3. Filter Status Verifikasi */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
            Filter Status:
          </span>
          <button
            type="button"
            onClick={() => setFilterStatus('Semua')}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid',
              borderColor: filterStatus === 'Semua' ? 'var(--color-brand-primary)' : 'var(--color-border-default)',
              backgroundColor: filterStatus === 'Semua' ? 'var(--color-brand-primary)' : 'var(--color-surface-panel)',
              color: filterStatus === 'Semua' ? '#ffffff' : 'var(--color-text-primary)',
              cursor: 'pointer'
            }}
          >
            Semua ({koreksiList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Menunggu')}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid',
              borderColor: filterStatus === 'Menunggu' ? '#CA8A04' : 'var(--color-border-default)',
              backgroundColor: filterStatus === 'Menunggu' ? '#FEFCE8' : 'var(--color-surface-panel)',
              color: filterStatus === 'Menunggu' ? '#854D0E' : 'var(--color-text-primary)',
              fontWeight: filterStatus === 'Menunggu' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            Menunggu Verifikasi ({pendingApprovalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Disetujui')}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid',
              borderColor: filterStatus === 'Disetujui' ? '#16A34A' : 'var(--color-border-default)',
              backgroundColor: filterStatus === 'Disetujui' ? '#F0FDF4' : 'var(--color-surface-panel)',
              color: filterStatus === 'Disetujui' ? '#166534' : 'var(--color-text-primary)',
              cursor: 'pointer'
            }}
          >
            Telah Disetujui ({koreksiList.length - pendingApprovalCount})
          </button>
        </div>
      </div>

      {/* 4. Tabel Daftar Revisi yang Terkait dengan Penguji */}
      <Panel>
        <Table
          columns={columns}
          data={filteredRevisi}
          emptyContent="Tidak ada catatan revisi pada kriteria ini."
        />
      </Panel>

      {/* MODAL MINTA PERBAIKAN ULANG MAHASISWA */}
      <Modal
        isOpen={modalFeedbackOpen}
        onClose={() => setModalFeedbackOpen(false)}
        title="Kembalikan untuk Perbaikan Ulang"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={() => setModalFeedbackOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleKirimFeedbackRevisi}>
              Kirim Arahan Perbaikan
            </Button>
          </div>
        }
      >
        <form onSubmit={handleKirimFeedbackRevisi} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', borderRadius: 'var(--radius-xs)', fontSize: '12px' }}>
            <div>Mahasiswa: <strong>{selectedKoreksi?.namaMahasiswa}</strong> ({selectedKoreksi?.nim})</div>
            <div style={{ marginTop: '2px' }}>Bagian: {selectedKoreksi?.bab} ({selectedKoreksi?.halaman})</div>
            <div style={{ marginTop: '2px', color: 'var(--color-text-muted)' }}>Catatan Awal: "{selectedKoreksi?.catatanKoreksi}"</div>
          </div>

          <FormField label="Catatan Kekurangan & Arahan Perbaikan Tambahan" required>
            <Textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Jelaskan alasan mengapa perbaikan belum memenuhi syarat dan poin apa yang masih harus disempurnakan..."
              required
            />
          </FormField>
        </form>
      </Modal>

    </div>
  );
}
