import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import { notify } from '../../components/feedback';
import {
  Panel,
  Button,
  Badge,
  StatusBadge,
  Modal,
  ConfirmationDialog,
  FormField,
  Textarea,
  Alert,
  StatCard,
  EmptyState
} from '../../components/ui';

import {
  CheckSquare,
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  Clock,
  AlertTriangle
} from 'lucide-react';

/**
 * HALAMAN 7: PERSETUJUAN / APPROVAL (FASE E)
 * Aksi Jelas: Setujui, Tolak, Kembalikan untuk Perbaikan
 * Dilengkapi Confirmation State pada setiap aksi
 * S3 otomatis menggunakan Promotor / Kopromotor, jenjang lain menggunakan istilah Pembimbing
 */
export default function PersetujuanPage({
  approvalQueue = [],
  onUpdateApproval,
  onNavigate
}) {
  const [items, setItems] = useState(approvalQueue);
  const [activeItem, setActiveItem] = useState(null);
  const [actionType, setActionType] = useState(null); // 'setujui' | 'tolak' | 'kembalikan'
  const [catatanPerbaikan, setCatatanPerbaikan] = useState('');

  const handleOpenAction = (item, type) => {
    setActiveItem(item);
    setActionType(type);
    setCatatanPerbaikan('');
  };

  const handleConfirmAction = async () => {
    if (!activeItem) return;

    let updatedStatus = 'Disetujui';
    if (actionType === 'tolak') updatedStatus = 'Ditolak';
    if (actionType === 'kembalikan') updatedStatus = 'Dalam Revisi';

    const updatedItem = {
      ...activeItem,
      status: updatedStatus,
      catatanKeputusan: catatanPerbaikan || (actionType === 'setujui' ? 'Permohonan disetujui tanpa catatan.' : 'Permohonan ditolak.')
    };

    const newItems = items.map(it => it.id === activeItem.id ? updatedItem : it);
    setItems(newItems);

    setActiveItem(null);
    setActionType(null);

    const result = onUpdateApproval ? await onUpdateApproval(updatedItem) : { success: true };
    if (result && result.success === false) {
      notify(result.message || 'Gagal menyinkronkan keputusan ke basis data.', { variant: 'danger' });
      return;
    }
    notify(
      updatedStatus === 'Disetujui'
        ? 'Permohonan berhasil disetujui dan diteruskan ke verifikasi administrasi.'
        : updatedStatus === 'Ditolak'
        ? 'Permohonan ditolak.'
        : 'Permohonan dikembalikan untuk perbaikan.',
      { variant: updatedStatus === 'Disetujui' ? 'success' : 'warning' }
    );
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Dosen Pembimbing' },
          { label: 'Antrean Persetujuan (Approval)' }
        ]}
        title="Antrean Persetujuan Ujian & Berkas"
        description="Otorisasi resmi pembimbing/promotor untuk izin maju seminar proposal, ujian kelayakan, sidang tugas akhir, dan pengesahan berkas akademik."
        statusBadge={<Badge variant="navy">Menunggu: {items.filter(i => i.status === 'Menunggu Persetujuan').length} Permohonan</Badge>}
      />

      {/* Ringkasan Antrean Approval */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard
          label="Total Permohonan"
          value={items.length}
          unit="Berkas"
          icon={CheckSquare}
          tone="navy"
        />
        <StatCard
          label="Menunggu Respon"
          value={items.filter(i => i.status === 'Menunggu Persetujuan').length}
          unit="Antrean"
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Telah Disetujui"
          value={items.filter(i => i.status === 'Disetujui').length}
          unit="Maju Ujian"
          icon={CheckCircle}
          tone="green"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {items.length === 0 ? (
          <Panel noPadding>
            <EmptyState
              icon={CheckSquare}
              title="Tidak Ada Permohonan Persetujuan"
              description="Saat ini tidak ada pengajuan ujian atau berkas dari mahasiswa bimbingan yang menunggu persetujuan Anda. Permohonan baru akan muncul di sini secara otomatis."
            />
          </Panel>
        ) : items.map((item) => {
          const isPending = item.status === 'Menunggu Persetujuan';

          return (
            <Panel
              key={item.id}
              title={item.jenisPermohonan}
              subtitle={`Diajukan oleh ${item.namaMahasiswa} (${item.nim}) — Jenjang ${item.jenjang}`}
              icon={CheckSquare}
              actions={
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Badge variant={item.peranDosen.includes('motor') ? 'gold' : 'navy'}>
                    Peran: {item.peranDosen}
                  </Badge>
                  <StatusBadge status={item.status} />
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '13.5px', color: '#0f172a', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid #1e3a8a' }}>
                  <strong>Uraian Permohonan:</strong> {item.keterangan}
                </div>

                {/* Checklist Kelengkapan Dokumen */}
                <div style={{ padding: '14px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                    Verifikasi Kelengkapan Syarat Berdasarkan Buku Pedoman 2026:
                  </div>
                  <div className="grid-cards-responsive" style={{ gap: '10px' }}>
                    {item.kelengkapan.map((syarat, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0' }}>
                        <CheckCircle size={15} style={{ color: '#16a34a', flexShrink: 0 }} aria-hidden="true" />
                        <span style={{ color: '#334155' }}>{syarat.item}:</span>
                        <Badge variant="neutral">{syarat.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {item.catatanKeputusan && (
                  <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 'var(--radius-xs)', fontSize: '12px', color: '#92400E' }}>
                    <strong>Catatan Keputusan Pembimbing:</strong> {item.catatanKeputusan}
                  </div>
                )}

                {/* 3 Action Buttons Wajib: Setujui, Kembalikan untuk Perbaikan, Tolak */}
                {isPending && (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-subtle)', flexWrap: 'wrap' }}>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      onClick={() => handleOpenAction(item, 'tolak')}
                    >
                      Tolak Permohonan
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={RotateCcw}
                      onClick={() => handleOpenAction(item, 'kembalikan')}
                    >
                      Kembalikan untuk Perbaikan
                    </Button>

                    <Button
                      variant="success"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() => handleOpenAction(item, 'setujui')}
                    >
                      Setujui Maju Ujian
                    </Button>
                  </div>
                )}
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Confirmation State 1: SETUJUI */}
      <ConfirmationDialog
        isOpen={actionType === 'setujui' && !!activeItem}
        onClose={() => setActionType(null)}
        onConfirm={handleConfirmAction}
        variant="primary"
        title="Konfirmasi Persetujuan Akademik"
        message={`Apakah Anda yakin menyetujui permohonan "${activeItem?.jenisPermohonan}" dari mahasiswa ${activeItem?.namaMahasiswa}? Persetujuan ini akan diteruskan ke Koorprodi untuk penjadwalan ujian resmi.`}
        confirmLabel="Ya, Setujui Permohonan"
        cancelLabel="Batal"
      />

      {/* Confirmation State 2: KEMBALIKAN UNTUK PERBAIKAN */}
      <Modal
        isOpen={actionType === 'kembalikan' && !!activeItem}
        onClose={() => setActionType(null)}
        title="Kembalikan Berkas untuk Perbaikan Mahasiswa"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setActionType(null)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleConfirmAction}>
              Kirimkan Arahan Perbaikan
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: 'var(--type-body-size)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
          Berkas akan dikembalikan ke status perbaikan. Mahasiswa wajib melengkapi catatan pembimbing sebelum dapat mengajukan kembali.
        </p>
        <FormField id="catatan-kembalikan" label="Uraian Kekurangan & Arahan Perbaikan" required>
          <Textarea
            value={catatanPerbaikan}
            onChange={(e) => setCatatanPerbaikan(e.target.value)}
            rows={4}
            placeholder="Tuliskan alasan pengembalian dan bagian yang harus diperbaiki mahasiswa..."
          />
        </FormField>
      </Modal>

      {/* Confirmation State 3: TOLAK */}
      <ConfirmationDialog
        isOpen={actionType === 'tolak' && !!activeItem}
        onClose={() => setActionType(null)}
        onConfirm={handleConfirmAction}
        variant="danger"
        title="Tolak Pengajuan Berkas Ujian?"
        message={`Apakah Anda yakin menolak pengajuan "${activeItem?.jenisPermohonan}" dari mahasiswa ${activeItem?.namaMahasiswa}? Penolakan ini bersifat final untuk periode pengajuan ini.`}
        confirmLabel="Ya, Tolak Permohonan"
        cancelLabel="Batal"
      />
    </div>
  );
}
