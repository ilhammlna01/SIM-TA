import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Search,
  Award,
  Users,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Card, Badge, Button, Modal, FormField, Input, Select, Alert, EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/shell';

export default function MasterProdiPage({
  masterProdi = [],
  onUpdateProdi
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProdi, setEditingProdi] = useState(null);

  // Form State
  const [formKode, setFormKode] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formJenjang, setFormJenjang] = useState('S1');
  const [formAkreditasi, setFormAkreditasi] = useState('Unggul');
  const [formNoSk, setFormNoSk] = useState('');
  const [formKaprodi, setFormKaprodi] = useState('');
  const [formNipKaprodi, setFormNipKaprodi] = useState('');
  const [formKuota, setFormKuota] = useState(100);
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [notification, setNotification] = useState(null);

  const filteredProdi = masterProdi.filter((p) =>
    p.namaProdi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.kodeProdi.includes(searchQuery) ||
    p.kaprodi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingProdi(null);
    setFormKode('');
    setFormNama('');
    setFormJenjang('S1');
    setFormAkreditasi('Unggul');
    setFormNoSk('');
    setFormKaprodi('');
    setFormNipKaprodi('');
    setFormKuota(100);
    setFormDeskripsi('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prodi) => {
    setEditingProdi(prodi);
    setFormKode(prodi.kodeProdi);
    setFormNama(prodi.namaProdi);
    setFormJenjang(prodi.jenjang);
    setFormAkreditasi(prodi.akreditasi);
    setFormNoSk(prodi.noSkAkreditasi || '');
    setFormKaprodi(prodi.kaprodi);
    setFormNipKaprodi(prodi.nipKaprodi || '');
    setFormKuota(prodi.kuotaMahasiswa || 100);
    setFormDeskripsi(prodi.deskripsi || '');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (prodiId) => {
    let changed = null;
    const updated = masterProdi.map((p) => {
      if (p.id === prodiId) {
        changed = { ...p, status: p.status === 'Aktif' ? 'Nonaktif' : 'Aktif' };
        return changed;
      }
      return p;
    });

    const result = onUpdateProdi
      ? await onUpdateProdi(updated, { action: 'status', prodi: changed })
      : { success: true };

    setNotification(
      result && result.success === false
        ? { type: 'danger', message: result.message || 'Gagal memperbarui status program studi.' }
        : { type: 'info', message: 'Status program studi berhasil diperbarui.' }
    );
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();

    if (editingProdi) {
      // Update
      let changed = null;
      const updated = masterProdi.map((p) => {
        if (p.id === editingProdi.id) {
          changed = {
            ...p,
            kodeProdi: formKode,
            namaProdi: formNama,
            jenjang: formJenjang,
            akreditasi: formAkreditasi,
            noSkAkreditasi: formNoSk,
            kaprodi: formKaprodi,
            nipKaprodi: formNipKaprodi,
            kuotaMahasiswa: Number(formKuota),
            deskripsi: formDeskripsi
          };
          return changed;
        }
        return p;
      });
      const result = onUpdateProdi
        ? await onUpdateProdi(updated, { action: 'update', prodi: changed })
        : { success: true };
      if (result && result.success === false) {
        setNotification({ type: 'danger', message: result.message || 'Gagal memperbarui data program studi.' });
        return;
      }
      setNotification({
        type: 'success',
        message: `Program Studi ${formNama} berhasil diperbarui.`
      });
    } else {
      // Tambah baru
      const newProdi = {
        id: `prodi-${Date.now()}`,
        kodeProdi: formKode,
        namaProdi: formNama,
        jenjang: formJenjang,
        akreditasi: formAkreditasi,
        noSkAkreditasi: formNoSk,
        kaprodi: formKaprodi,
        nipKaprodi: formNipKaprodi,
        kuotaMahasiswa: Number(formKuota),
        mahasiswaAktif: 0,
        status: 'Aktif',
        deskripsi: formDeskripsi
      };
      const updated = [...masterProdi, newProdi];
      const result = onUpdateProdi
        ? await onUpdateProdi(updated, { action: 'create', prodi: newProdi })
        : { success: true };
      if (result && result.success === false) {
        setNotification({ type: 'danger', message: result.message || 'Gagal menambahkan program studi baru.' });
        return;
      }
      setNotification({
        type: 'success',
        message: `Program Studi baru ${formNama} berhasil ditambahkan.`
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM' },
          { label: 'Super Administrator' },
          { label: 'Master Program Studi' }
        ]}
        title="Master Data Program Studi Multi-Jenjang"
        description="Konfigurasi prodi D3 Entrepreneurship, S1 Manajemen, S2 Magister Manajemen, dan S3 Doktor Ilmu Manajemen FEB UTM."
        statusBadge={<Badge variant="primary">{masterProdi.length} Program Studi</Badge>}
        primaryAction={
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            Tambah Program Studi
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

      {/* 2. Pencarian */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
            <input
              id="prodi-search-input"
              aria-label="Cari nama prodi, kode, atau Kaprodi"
              type="text"
              placeholder="Cari nama prodi, kode, atau Kaprodi..."
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
            Terdaftar: <strong>{filteredProdi.length}</strong> Program Studi
          </div>
        </div>
      </Card>

      {/* 3. Grid Kartu Program Studi */}
      {filteredProdi.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="Tidak Ada Program Studi"
            description={
              searchQuery
                ? 'Tidak ada program studi yang cocok dengan kata kunci pencarian Anda.'
                : 'Belum ada program studi terdaftar. Tambahkan program studi baru untuk memulai.'
            }
          />
        </Card>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-5)' }}>
        {filteredProdi.map((p) => (
          <Card key={p.id} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', borderTop: `4px solid ${p.jenjang === 'S3' ? 'var(--primitive-red-600)' : p.jenjang === 'S2' ? 'var(--primitive-amber-500)' : 'var(--primitive-navy-800)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-brand-primary)' }}>
                  KODE PRODI: {p.kodeProdi}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0', color: 'var(--primitive-navy-950)' }}>
                  {p.namaProdi}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Badge variant={p.jenjang === 'S3' ? 'error' : p.jenjang === 'S2' ? 'warning' : 'info'}>
                  {p.jenjang}
                </Badge>
                <Badge variant={p.akreditasi === 'Unggul' ? 'success' : 'neutral'}>
                  {p.akreditasi}
                </Badge>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {p.deskripsi}
            </p>

            <div style={{ backgroundColor: 'var(--color-surface-panel-alt)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong>Koordinator / Kaprodi:</strong> {p.kaprodi}</div>
              <div style={{ color: 'var(--color-text-muted)' }}>NIP: {p.nipKaprodi || '-'}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                <strong>SK Akreditasi:</strong> {p.noSkAkreditasi || '-'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)' }}>
              <div>
                Mahasiswa Aktif: <strong>{p.mahasiswaAktif}</strong> / Kuota: <strong>{p.kuotaMahasiswa}</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Button
                  size="sm"
                  variant={p.status === 'Aktif' ? 'success' : 'danger'}
                  onClick={() => handleToggleStatus(p.id)}
                  style={{ padding: '2px 8px', fontSize: '11px', height: 'auto' }}
                >
                  {p.status}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Edit}
                  onClick={() => handleOpenEdit(p)}
                  style={{ padding: '2px 8px', fontSize: '11px', height: 'auto' }}
                >
                  Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* 4. Modal Tambah / Edit Prodi */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title={editingProdi ? `Edit Program Studi: ${editingProdi.namaProdi}` : 'Tambah Program Studi Baru'}
          size="md"
        >
          <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {notification && (notification.type === 'danger' || notification.type === 'error') && (
              <Alert type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-3)' }}>
              <div>
                <label htmlFor="prodi-form-kode" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Kode Prodi:</label>
                <input
                  id="prodi-form-kode"
                  type="text"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value)}
                  placeholder="Misal: 61201"
                  required
                  style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label htmlFor="prodi-form-nama" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Nama Program Studi:</label>
                <input
                  id="prodi-form-nama"
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Misal: S-1 Manajemen"
                  required
                  style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label htmlFor="prodi-form-jenjang" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Jenjang:</label>
                <select
                  id="prodi-form-jenjang"
                  value={formJenjang}
                  onChange={(e) => setFormJenjang(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)' }}
                >
                  <option value="D3">D3 (Diploma Tiga)</option>
                  <option value="S1">S1 (Sarjana)</option>
                  <option value="S2">S2 (Magister)</option>
                  <option value="S3">S3 (Doktor)</option>
                </select>
              </div>
              <div>
                <label htmlFor="prodi-form-akreditasi" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Akreditasi:</label>
                <select
                  id="prodi-form-akreditasi"
                  value={formAkreditasi}
                  onChange={(e) => setFormAkreditasi(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)' }}
                >
                  <option value="Unggul">Unggul (A)</option>
                  <option value="Baik Sekali">Baik Sekali (B)</option>
                  <option value="Baik">Baik (C)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="prodi-form-no-sk" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Nomor SK Akreditasi BAN-PT / LAMEMBA:</label>
              <input
                id="prodi-form-no-sk"
                type="text"
                value={formNoSk}
                onChange={(e) => setFormNoSk(e.target.value)}
                placeholder="Misal: SK LAMEMBA No. 341/DE/A.5/AR.10/XI/2023"
                style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label htmlFor="prodi-form-kaprodi" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Nama Ketua Program Studi (Kaprodi):</label>
                <input
                  id="prodi-form-kaprodi"
                  type="text"
                  value={formKaprodi}
                  onChange={(e) => setFormKaprodi(e.target.value)}
                  placeholder="Misal: Dr. Hj. Siti Aminah, S.E., M.Si."
                  required
                  style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label htmlFor="prodi-form-kuota" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Kuota Mahasiswa:</label>
                <input
                  id="prodi-form-kuota"
                  type="number"
                  value={formKuota}
                  onChange={(e) => setFormKuota(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="prodi-form-deskripsi" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Deskripsi Singkat:</label>
              <textarea
                id="prodi-form-deskripsi"
                rows={2}
                value={formDeskripsi}
                onChange={(e) => setFormDeskripsi(e.target.value)}
                placeholder="Fokus dan keunggulan program studi..."
                style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: '8px' }}>
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
              >
                Simpan Data Prodi
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
