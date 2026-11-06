import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  Eye,
  Check,
  X,
  ChevronRight,
  Download,
  AlertCircle,
  ScanLine,
  GraduationCap,
  Award
} from 'lucide-react';
import { Card, Badge, Button, Modal, FormField, Textarea, Input, Alert, Table, StatusBadge } from '../../components/ui';
import { PageHeader } from '../../components/shell';
import { notify } from '../../components/feedback';
import { adminApi } from '../../services/api';

// Helper: cek apakah daftar berkas mengandung item dengan metrik.
function hasMetrikBerkas(berkasList) {
  return Array.isArray(berkasList) && berkasList.some((b) => b && b.metrik && Object.keys(b.metrik).length > 0);
}

// Helper: render label & nilai untuk satu pasangan metrik (tampilkan '—' bila kosong).
const metrikItem = (label, icon, value, key) => (
  <div
    key={key}
    style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '6px',
      padding: '4px 8px',
      backgroundColor: '#ffffff',
      border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-sm)',
      minWidth: 0
    }}
  >
    <span style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '11px' }}>
      {icon}
      {label}
    </span>
    <span
      style={{
        fontWeight: 'var(--font-weight-semibold)',
        fontSize: '12.5px',
        color: value === null || value === undefined || value === '' ? 'var(--color-text-muted)' : 'var(--primitive-navy-950)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
      title={value === null || value === undefined || value === '' ? 'Tidak diisi' : String(value)}
    >
      {value === null || value === undefined || value === '' ? '—' : String(value)}
    </span>
  </div>
);

// Komponen grid metrik verifikasi: menampilkan IPK, SKS, TOEFL, similarity, AI, sertifikat.
function MetrikGrid({ metrik, compact = false }) {
  if (!metrik) return null;
  const gap = compact ? '4px' : '6px';
  const gridStyle = { display: 'flex', flexWrap: 'wrap', gap };
  return (
    <div style={gridStyle} data-testid="grid-metrik">
      {metrik.ipk !== undefined && metrikItem('IPK', <GraduationCap size={11} />, metrik.ipk?.toFixed?.(2) ?? metrik.ipk, 'ipk')}
      {metrik.sksLulus !== undefined && metrikItem('SKS Lulus', null, metrik.sksLulus, 'sks')}
      {metrik.toeflScore !== undefined && metrikItem('TOEFL', <Award size={11} />, metrik.toeflScore, 'toefl')}
      {metrik.similarity !== undefined && metrikItem('Similarity', null, `${metrik.similarity}%`, 'sim')}
      {metrik.aiDetection !== undefined && metrikItem('AI Detection', null, `${metrik.aiDetection}%`, 'ai')}
      {metrik.sertifikatNo !== undefined && metrikItem('No. Sertifikat', null, metrik.sertifikatNo, 'sno')}
      {metrik.sertifikatTgl !== undefined && metrikItem('Tgl Sertifikat', null, metrik.sertifikatTgl, 'stgl')}
    </div>
  );
}

export default function VerifikasiBerkasPage({
  verifikasiList = [],
  onUpdateVerifikasi,
  onSync
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [catatanDraft, setCatatanDraft] = useState('');
  const [notification, setNotification] = useState(null);

  // Sinkronisasi data verifikasi dari backend saat halaman dibuka,
  // agar admin selalu melihat data terbaru (termasuk unggahan mahasiswa
  // yang dilakukan setelah admin login).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Beberapa endpoint (getVerifikasi, getKoreksi) mengembalikan array
        // secara langsung, sementara endpoint lain mengembalikan envelope { data }.
        // Tangani kedua bentuk tersebut.
        const res = await adminApi.getVerifikasi();
        const data = Array.isArray(res) ? res : (res && res.success && Array.isArray(res.data) ? res.data : null);
        if (!cancelled && data && onSync) {
          onSync(data);
        }
      } catch (e) {
        // Abaikan: fallback ke data lokal dari prop.
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter List
  const filteredList = verifikasiList.filter((item) => {
    const q = (searchQuery || '').toLowerCase();
    const matchSearch =
      !q ||
      String(item.namaMahasiswa || '').toLowerCase().includes(q) ||
      String(item.nim || '').includes(q) ||
      String(item.jenisUjian || '').toLowerCase().includes(q);
    const matchJenjang = selectedJenjang === 'Semua' || item.jenjang === selectedJenjang;
    const matchStatus = selectedStatus === 'Semua' || item.statusVerifikasi === selectedStatus;
    return matchSearch && matchJenjang && matchStatus;
  });

  const handleOpenDetail = (item) => {
    setActiveModalItem(item);
    setCatatanDraft(item.catatanAdmin || '');
  };

  const handleActionVerifikasi = (statusBaru) => {
    if (!activeModalItem) return;

    const updated = {
      ...activeModalItem,
      statusVerifikasi: statusBaru,
      catatanAdmin: catatanDraft
    };

    if (onUpdateVerifikasi) {
      onUpdateVerifikasi(updated);
    }

    setNotification({
      type: statusBaru === 'Terverifikasi Lolos' ? 'success' : 'warning',
      message: `Status berkas ${activeModalItem.namaMahasiswa} berhasil diperbarui menjadi "${statusBaru}".`
    });

    setActiveModalItem(null);
  };

  const handleToggleBerkasStatus = (berkasId, newStatus) => {
    if (!activeModalItem) return;
    const updatedBerkasList = activeModalItem.berkasList.map(b => {
      if (b.id === berkasId) {
        return {
          ...b,
          status: newStatus,
          catatan: newStatus === 'Lengkap' ? (b.catatan || 'Terverifikasi sah oleh Admin Akademik') : (b.catatan || 'Perlu perbaikan kelengkapan berkas')
        };
      }
      return b;
    });

    const allLengkap = updatedBerkasList.every(b => b.status === 'Lengkap');
    const hasPerbaikan = updatedBerkasList.some(b => b.status === 'Perlu Perbaikan');
    const newOverallStatus = allLengkap ? 'Terverifikasi Lolos' : hasPerbaikan ? 'Perlu Perbaikan' : 'Menunggu Verifikasi';

    const updatedItem = {
      ...activeModalItem,
      berkasList: updatedBerkasList,
      statusVerifikasi: newOverallStatus
    };

    setActiveModalItem(updatedItem);
    if (onUpdateVerifikasi) {
      onUpdateVerifikasi(updatedItem);
    }
  };

  const tableColumns = [
    {
      key: 'mahasiswa',
      label: 'Mahasiswa & NIM',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-navy-950)' }}>
            {row.namaMahasiswa}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            NIM: {row.nim} · Daftar: {row.tanggalDaftar}
          </div>
        </div>
      )
    },
    {
      key: 'jenjang',
      label: 'Jenjang & Prodi',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Badge variant={row.jenjang === 'S3' ? 'error' : row.jenjang === 'S2' ? 'warning' : 'info'}>
            {row.jenjang}
          </Badge>
          <span style={{ fontSize: '13px' }}>{row.programStudi}</span>
        </div>
      )
    },
    {
      key: 'jenisUjian',
      label: 'Tahap / Ujian',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--primitive-navy-900)' }}>
            {row.jenisUjian}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.judul}
          </div>
        </div>
      )
    },
    {
      key: 'kelengkapan',
      label: 'Kelengkapan Dokumen',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
            {row.berkasList?.filter(b => b.status === 'Lengkap').length || 0} / {row.berkasList?.length || 0}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Berkas Terunggah</span>
        </div>
      )
    },
    {
      key: 'metrik',
      label: 'Metrik Akademik',
      render: (_, row) => {
        // Ringkasan metrik yang diisikan mahasiswa (agregat, atau dari berkas terbaru).
        const m = row.metrikAkademik
          || (Array.isArray(row.berkasList) ? row.berkasList.find(b => b && b.metrik)?.metrik : null);
        if (!m) return <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>;
        const chip = (label, val) => (
          <span key={label} style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            padding: '1px 6px', borderRadius: '999px',
            backgroundColor: 'var(--primitive-navy-50, #f0f4f8)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: '10.5px', fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--primitive-navy-950)', whiteSpace: 'nowrap'
          }}>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: '400' }}>{label}</span>{val}
          </span>
        );
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
            {m.ipk !== undefined && chip('IPK', m.ipk)}
            {m.sksLulus !== undefined && chip('SKS', m.sksLulus)}
            {m.toeflScore !== undefined && chip('TOEFL', m.toeflScore)}
            {m.similarity !== undefined && chip('Sim', `${m.similarity}%`)}
            {m.aiDetection !== undefined && chip('AI', `${m.aiDetection}%`)}
            {m.sertifikatNo && chip('Sert', 'ada')}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status Verifikasi',
      render: (_, row) => <StatusBadge status={row.statusVerifikasi} />
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          icon={FileCheck2}
          onClick={() => handleOpenDetail(row)}
        >
          Periksa Berkas
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header Halaman Terstandarisasi */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM' },
          { label: 'Admin Akademik' },
          { label: 'Verifikasi Berkas Ujian' }
        ]}
        title="Verifikasi Berkas Pendaftaran Ujian"
        description="Pemeriksaan kelengkapan dokumen administratif, syarat SKS, sertifikat bahasa Inggris (TOEFL), uji bebas plagiasi Turnitin, dan luaran publikasi per jenjang."
        statusBadge={<Badge variant="primary">{filteredList.length} Pengajuan Terdata</Badge>}
      />

      {/* Notifikasi feedback */}
      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          dismissible
          onDismiss={() => setNotification(null)}
        />
      )}

      {/* 2. Toolbar Filter & Pencarian */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
              <input
                id="verifikasi-search-input"
                aria-label="Cari nama mahasiswa, NIM, atau jenis ujian"
                type="text"
                placeholder="Cari nama mahasiswa, NIM, atau jenis ujian..."
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

            {/* Filter Jenjang */}
            <select
              id="verifikasi-filter-jenjang"
              aria-label="Filter jenjang pendidikan"
              value={selectedJenjang}
              onChange={(e) => setSelectedJenjang(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                fontSize: 'var(--type-body-size)',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="Semua">Semua Jenjang</option>
              <option value="D3">D3 Entrepreneurship</option>
              <option value="S1">S1 Manajemen</option>
              <option value="S2">S2 Magister Manajemen</option>
              <option value="S3">S3 Doktor Ilmu Manajemen</option>
            </select>

            {/* Filter Status */}
            <select
              id="verifikasi-filter-status"
              aria-label="Filter status berkas"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                fontSize: 'var(--type-body-size)',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Terverifikasi Lolos">Terverifikasi Lolos</option>
              <option value="Perlu Perbaikan">Perlu Perbaikan</option>
            </select>
          </div>

          <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>
            Ditemukan: <strong>{filteredList.length}</strong> pengajuan
          </div>
        </div>
      </Card>

      {/* 3. Tabel Daftar Pengajuan Verifikasi Berkas (Terstandarisasi) */}
      <Table
        columns={tableColumns}
        data={filteredList}
        density="normal"
        striped
        emptyContent="Tidak ada berkas pendaftaran yang cocok dengan kriteria filter."
      />

      {/* 4. Modal Verifikasi Berkas Lengkap */}
      {activeModalItem && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModalItem(null)}
          title={`Verifikasi Dokumen: ${activeModalItem.namaMahasiswa} (${activeModalItem.nim})`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Rincian Pendaftaran */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-panel-alt)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)', fontSize: '13px' }}>
                <div><strong>Program Studi:</strong> {activeModalItem.programStudi} ({activeModalItem.jenjang})</div>
                <div><strong>Ujian:</strong> {activeModalItem.jenisUjian}</div>
                <div><strong>Pembimbing:</strong> {activeModalItem.pembimbingUtama}</div>
                <div><strong>Tanggal Daftar:</strong> {activeModalItem.tanggalDaftar}</div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <strong>Judul:</strong> "{activeModalItem.judul}"
              </div>
            </div>

            {/* Panel Data Verifikasi Akademik (diisikan mahasiswa saat unggah) */}
            {(activeModalItem.metrikAkademik || hasMetrikBerkas(activeModalItem.berkasList)) && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-default)',
                  backgroundColor: 'var(--primitive-navy-50, #f0f4f8)'
                }}
                data-testid="panel-metrik-verifikasi"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primitive-navy-950)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '8px', fontSize: '12.5px' }}>
                  <ScanLine size={14} color="var(--color-brand-primary)" />
                  <span>Data Verifikasi Akademik (diisikan oleh Mahasiswa)</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  Verifikasi independen — cocokkan dengan dokumen fisik/unduhan.
                </div>
                {activeModalItem.metrikAkademik && (
                  <MetrikGrid metrik={activeModalItem.metrikAkademik} />
                )}
                {/* Tampilkan metrik per-berkas (jika ada) */}
                {activeModalItem.berkasList?.some(b => b.metrik) && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-navy-950)', marginBottom: '4px' }}>
                      Metrik per Berkas Unggahan:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {activeModalItem.berkasList.filter(b => b.metrik).map((b, idx) => (
                        <div key={idx} style={{ padding: '6px 10px', backgroundColor: '#ffffff', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-navy-950)' }}>{b.nama}</div>
                          <MetrikGrid metrik={b.metrik} compact />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Daftar Checklist Berkas */}
            <div>
              {/* Notifikasi Khusus Verifikasi Portofolio TAKK */}
              {(activeModalItem.jenisTA === 'TAKK' || 
                activeModalItem.jenisUjian?.toLowerCase().includes('portofolio') || 
                activeModalItem.berkasList?.some(b => b.nama?.toLowerCase().includes('portofolio'))) && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '12px',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: 'var(--space-3)'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, color: '#b45309' }} />
                  <span>
                    <strong>Verifikasi Administratif Portofolio TAKK:</strong> Verifikasi Subbag Akademik ini sebatas keabsahan fisik/kelengkapan dokumen. Nilai yang diberikan <em>tidak otomatis penuh</em>, melainkan akan disidangkan secara offline oleh Tim Dosen dan nilai sesungguhnya akan diinput oleh Koorprodi (syarat kelayakan: &gt; 70 Poin).
                  </span>
                </div>
              )}

              <h4 style={{ fontSize: '14px', margin: '0 0 var(--space-2) 0', color: 'var(--primitive-navy-950)' }}>
                Checklist Dokumen Persyaratan Akademik:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {activeModalItem.berkasList?.map((berkas, idx) => (
                  <div
                    key={berkas.id || idx}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--color-border-subtle)',
                      backgroundColor: berkas.status === 'Perlu Perbaikan' ? 'var(--primitive-red-50)' : '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 'var(--space-3)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="var(--color-brand-primary)" />
                        <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: '13px', color: 'var(--primitive-navy-950)' }}>
                          {berkas.nama}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginLeft: '24px', marginTop: '2px' }}>
                        Berkas: <code>{berkas.file}</code> {berkas.catatan && `— Catatan: ${berkas.catatan}`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Badge variant={berkas.status === 'Lengkap' ? 'success' : berkas.status === 'Menunggu Verifikasi' ? 'warning' : 'error'}>
                        {berkas.status}
                      </Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => notify(`Membuka pratinjau berkas: ${berkas.file}`)}
                        style={{ padding: '2px 8px', fontSize: '11px', height: 'auto' }}
                      >
                        Pratinjau
                      </Button>
                      {berkas.status !== 'Lengkap' ? (
                        <Button
                          type="button"
                          variant="success"
                          size="sm"
                          icon={Check}
                          onClick={() => handleToggleBerkasStatus(berkas.id, 'Lengkap')}
                          style={{ padding: '2px 8px', fontSize: '11px', height: 'auto' }}
                        >
                          ACC Berkas
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          icon={X}
                          onClick={() => handleToggleBerkasStatus(berkas.id, 'Perlu Perbaikan')}
                          style={{ padding: '2px 8px', fontSize: '11px', height: 'auto', color: 'var(--primitive-red-600)' }}
                        >
                          Minta Revisi
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Catatan Admin */}
            <div>
              <label
                htmlFor="catatan-verifikasi-admin"
                style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
              >
                Catatan Verifikasi Subbag Akademik:
              </label>
              <textarea
                id="catatan-verifikasi-admin"
                rows={3}
                value={catatanDraft}
                onChange={(e) => setCatatanDraft(e.target.value)}
                placeholder="Tuliskan catatan verifikasi, rekomendasi jadwal, atau instruksi perbaikan jika ada dokumen yang belum memenuhi syarat..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--color-border-default)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Tombol Aksi Verifikasi */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setActiveModalItem(null)}
              >
                Tutup
              </Button>

              <Button
                type="button"
                variant="danger"
                size="md"
                icon={XCircle}
                onClick={() => handleActionVerifikasi('Perlu Perbaikan')}
              >
                Minta Perbaikan Berkas
              </Button>

              <Button
                type="button"
                variant="success"
                size="md"
                icon={CheckCircle2}
                onClick={() => handleActionVerifikasi('Terverifikasi Lolos')}
              >
                Setujui & Terverifikasi Lolos
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
