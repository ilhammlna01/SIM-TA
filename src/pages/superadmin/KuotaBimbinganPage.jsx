import React, { useState } from 'react';
import {
  Activity,
  Edit,
  Search,
  CheckCircle,
  AlertTriangle,
  Award,
  Users,
  Sliders,
  Save,
  ShieldAlert
} from 'lucide-react';
import { Card, Badge, Button, Modal, FormField, Input, Alert, Table } from '../../components/ui';
import { PageHeader } from '../../components/shell';
import { KUOTA_RULE_DEFAULTS } from '../../data/superadminData';

export default function KuotaBimbinganPage({
  kuotaDosen = [],
  onUpdateKuota
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editUtama, setEditUtama] = useState(8);
  const [editPendamping, setEditPendamping] = useState(10);
  const [notification, setNotification] = useState(null);

  const filteredDosen = kuotaDosen.filter(
    (d) =>
      d.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.nip.includes(searchQuery) ||
      d.jabatan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditUtama(item.kuotaUtama);
    setEditPendamping(item.kuotaPendamping);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    let changed = null;
    const updated = kuotaDosen.map((d) => {
      if (d.id === editingItem.id) {
        const nextStatus =
          d.terisiUtama >= editUtama || d.terisiPendamping >= editPendamping
            ? 'Penuh'
            : d.terisiUtama / editUtama >= 0.8 || d.terisiPendamping / editPendamping >= 0.8
            ? 'Hampir Penuh'
            : 'Aman';

        changed = {
          ...d,
          kuotaUtama: Number(editUtama),
          kuotaPendamping: Number(editPendamping),
          status: nextStatus
        };
        return changed;
      }
      return d;
    });

    const result = onUpdateKuota ? await onUpdateKuota(updated, changed) : { success: true };
    if (result && result.success === false) {
      setNotification({
        type: 'danger',
        message: result.message || 'Gagal menyimpan batas kuota ke basis data.'
      });
      return;
    }

    setNotification({
      type: 'success',
      message: `Batas kuota bimbingan untuk ${editingItem.nama} berhasil disesuaikan.`
    });

    setEditingItem(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM' },
          { label: 'Super Administrator' },
          { label: 'Distribusi Kuota Bimbingan' }
        ]}
        title="Manajemen Kuota Bimbingan Dosen"
        description="Distribusi beban pembimbing utama (Promotor) dan pendamping (Kopromotor) berdasarkan jabatan fungsional akademik."
        statusBadge={<Badge variant="primary">{kuotaDosen.length} Dosen Terdata</Badge>}
      />

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          dismissible
          onDismiss={() => setNotification(null)}
        />
      )}

      {/* 2. Standar Batas Kuota Berdasarkan Jabatan Fungsional */}
      <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-panel-alt)' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--primitive-navy-950)' }}>
          Standar Kuota Institusi per Jabatan Akademik (Keputusan Dekan FEB UTM):
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
          {Object.entries(KUOTA_RULE_DEFAULTS).map(([jabatan, r]) => (
            <div key={jabatan} style={{ padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-subtle)', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--primitive-navy-900)' }}>{jabatan}</div>
              <div style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Utama: <strong>Max {r.maxUtama}</strong> · Pendamping: <strong>Max {r.maxPendamping}</strong>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Toolbar Pencarian */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Cari nama dosen, NIP, atau jabatan..."
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

          <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>
            Menampilkan: <strong>{filteredDosen.length}</strong> dosen aktif
          </div>
        </div>
      </Card>

      {/* 4. Tabel Monitoring Kuota Bimbingan (Terstandarisasi Table Component) */}
      <Table
        columns={[
          {
            key: 'nama',
            label: 'Dosen & Jabatan',
            sortable: true,
            render: (val, d) => (
              <div>
                <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
                  {val}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  NIP: {d.nip} · <strong>{d.jabatan}</strong>
                </div>
              </div>
            )
          },
          {
            key: 'prodi',
            label: 'Program Studi',
            sortable: true,
            render: (val) => <span style={{ fontSize: '13px' }}>{val}</span>
          },
          {
            key: 'bebanUtama',
            label: 'Beban Pembimbing Utama',
            render: (_, d) => {
              const pctUtama = Math.round((d.terisiUtama / d.kuotaUtama) * 100);
              return (
                <div style={{ minWidth: '150px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>Terisi: <strong>{d.terisiUtama}</strong> / {d.kuotaUtama}</span>
                    <span style={{ fontWeight: 'bold', color: pctUtama >= 90 ? 'var(--primitive-red-600)' : 'var(--primitive-navy-800)' }}>{pctUtama}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--primitive-neutral-200)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(pctUtama, 100)}%`, backgroundColor: pctUtama >= 90 ? 'var(--primitive-red-600)' : pctUtama >= 75 ? 'var(--primitive-amber-500)' : 'var(--primitive-green-600)' }} />
                  </div>
                </div>
              );
            }
          },
          {
            key: 'bebanPendamping',
            label: 'Beban Pendamping',
            render: (_, d) => {
              const pctPendamping = Math.round((d.terisiPendamping / d.kuotaPendamping) * 100);
              return (
                <div style={{ minWidth: '150px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>Terisi: <strong>{d.terisiPendamping}</strong> / {d.kuotaPendamping}</span>
                    <span style={{ fontWeight: 'bold' }}>{pctPendamping}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--primitive-neutral-200)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(pctPendamping, 100)}%`, backgroundColor: pctPendamping >= 90 ? 'var(--primitive-red-600)' : pctPendamping >= 75 ? 'var(--primitive-amber-500)' : 'var(--primitive-navy-700)' }} />
                  </div>
                </div>
              );
            }
          },
          {
            key: 'status',
            label: 'Status Beban',
            sortable: true,
            render: (val) => (
              <Badge variant={val === 'Penuh' ? 'error' : val === 'Hampir Penuh' ? 'warning' : 'success'}>
                {val}
              </Badge>
            )
          },
          {
            key: 'aksi',
            label: 'Aksi',
            align: 'right',
            render: (_, d) => (
              <Button
                size="sm"
                variant="outline"
                icon={Sliders}
                onClick={() => handleOpenEdit(d)}
              >
                Atur Kuota
              </Button>
            )
          }
        ]}
        data={filteredDosen}
        density="normal"
        striped
        emptyContent="Tidak ada data dosen yang sesuai kriteria pencarian."
      />

      {/* 5. Modal Atur Kuota Custom */}
      {editingItem && (
        <Modal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          title={`Penyesuaian Batas Kuota: ${editingItem.nama}`}
          size="sm"
        >
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Jabatan Fungsional: <strong>{editingItem.jabatan}</strong>
            </div>

            <div>
              <label
                htmlFor="kuota-edit-utama"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '4px' }}
              >
                Batas Maksimal Pembimbing Utama (Promotor):
              </label>
              <input
                id="kuota-edit-utama"
                type="number"
                value={editUtama}
                onChange={(e) => setEditUtama(e.target.value)}
                min={editingItem.terisiUtama}
                required
                style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Saat ini membimbing: {editingItem.terisiUtama} mahasiswa
              </span>
            </div>

            <div>
              <label
                htmlFor="kuota-edit-pendamping"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '4px' }}
              >
                Batas Maksimal Pembimbing Pendamping (Kopromotor):
              </label>
              <input
                id="kuota-edit-pendamping"
                type="number"
                value={editPendamping}
                onChange={(e) => setEditPendamping(e.target.value)}
                min={editingItem.terisiPendamping}
                required
                style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Saat ini membimbing: {editingItem.terisiPendamping} mahasiswa
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: '8px' }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setEditingItem(null)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                type="submit"
              >
                Simpan Kuota
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
