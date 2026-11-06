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
  Search,
  Select,
  Modal,
  FormField,
  Input,
  Textarea,
  DateInput,
  Alert
} from '../../components/ui';

import {
  MessageSquare,
  Plus,
  CheckCircle,
  Eye,
  FileText,
  Clock,
  Filter,
  MapPin,
  Globe,
  FileImage,
  Check,
  X,
  Download,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { SAMPLE_SCAN_KARTU_BIMBINGAN } from '../../utils/bimbinganScanSample';

/**
 * HALAMAN 4: BIMBINGAN (FASE E - DOSEN PEMBIMBING / PROMOTOR)
 * Menampilkan riwayat logbook bimbingan dengan struktur administratif formal:
 * - Dukungan verifikasi 1-klik untuk bimbingan tatap muka (luring) dengan scan kartu kendali fisik
 * - Filter mahasiswa, moda konsultasi (luring vs daring), dan status validasi
 * - Form pencatatan / pengesahan sesi konsultasi baru
 */
export default function BimbinganPage({
  dosenProfile,
  mahasiswaList = [],
  bimbinganList = [],
  onAddBimbingan,
  onApproveBimbingan,
  onNavigate
}) {
  const [selectedMhsFilter, setSelectedMhsFilter] = useState('Semua');
  const [selectedModaFilter, setSelectedModaFilter] = useState('Semua'); // 'Semua' | 'Luring' | 'Daring'
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBimbinganDetail, setSelectedBimbinganDetail] = useState(null);
  const [previewScanItem, setPreviewScanItem] = useState(null);

  // Form State untuk Sesi Baru oleh Dosen
  const [targetMhsId, setTargetMhsId] = useState(mahasiswaList[0]?.id || '');
  const [modaInput, setModaInput] = useState('Luring');
  const [lokasiInput, setLokasiInput] = useState('Ruang Dosen Jurusan Manajemen FEB Lantai 2');
  const [tanggalInput, setTanggalInput] = useState(new Date().toISOString().split('T')[0]);
  const [topikInput, setTopikInput] = useState('');
  const [catatanInput, setCatatanInput] = useState('');
  const [lampiranInput, setLampiranInput] = useState('Draf_Bab_Revisi_Terkini.pdf');

  // Filter Data
  const filteredBimbingan = bimbinganList.filter((b) => {
    const matchMhs = selectedMhsFilter === 'Semua' || b.mhsId === selectedMhsFilter;
    const matchModa = selectedModaFilter === 'Semua' || (b.moda || 'Luring') === selectedModaFilter;
    const safeQuery = (searchQuery || '').toLowerCase();
    const matchSearch =
      (b.topik && b.topik.toLowerCase().includes(safeQuery)) ||
      (b.catatan && b.catatan.toLowerCase().includes(safeQuery)) ||
      (b.dosenNama && b.dosenNama.toLowerCase().includes(safeQuery));
    return matchMhs && matchModa && matchSearch;
  });

  const pendingCount = bimbinganList.filter(b => b.status === 'Menunggu Persetujuan').length;

  const handleApprove = (bimbinganId) => {
    if (onApproveBimbingan) {
      onApproveBimbingan(bimbinganId);
    }
    if (selectedBimbinganDetail && selectedBimbinganDetail.id === bimbinganId) {
      setSelectedBimbinganDetail(prev => prev ? { ...prev, status: 'Disetujui' } : null);
    }
  };

  const handleSaveKonsultasi = () => {
    if (!topikInput.trim()) {
      notify('Materi pembahasan substantif wajib diisi.', { variant: 'warning' });
      return;
    }

    const targetStudent = mahasiswaList.find(m => m.id === targetMhsId) || mahasiswaList[0];
    if (!targetStudent) {
      notify('Anda belum memiliki mahasiswa bimbingan yang terdaftar untuk mencatat konsultasi.');
      return;
    }
    const newEntry = {
      id: `bim-${Date.now()}`,
      mhsId: targetStudent.id,
      dosenNama: dosenProfile.nama,
      peranDosen: targetStudent.peranDosen || 'Dosen Pembimbing',
      tanggal: tanggalInput,
      moda: modaInput,
      lokasi: modaInput === 'Luring' ? lokasiInput : 'Daring via SIM-TA FEB UTM',
      topik: topikInput,
      catatan: catatanInput,
      hasil: 'Sesi konsultasi dicatat dan disahkan oleh Dosen Pembimbing/Promotor.',
      dokumen: lampiranInput,
      buktiScan: modaInput === 'Luring' ? 'Scan_Kartu_Bimbingan_Dosen.jpg' : null,
      buktiScanUrl: modaInput === 'Luring' ? SAMPLE_SCAN_KARTU_BIMBINGAN : null,
      status: 'Disetujui'
    };

    if (onAddBimbingan) onAddBimbingan(newEntry);
    setIsModalOpen(false);
    setTopikInput('');
    setCatatanInput('');
  };

  const columns = [
    {
      key: 'tanggal',
      label: 'Tanggal',
      width: '120px',
      sortable: true,
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
          <Calendar size={13} style={{ color: 'var(--color-text-muted)' }} />
          <span>{val}</span>
        </div>
      )
    },
    {
      key: 'moda',
      label: 'Moda',
      width: '135px',
      render: (_, row) => (
        row.moda === 'Luring' ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '999px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: '11px',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            <MapPin size={11} /> Luring (Fisik)
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '999px',
              backgroundColor: '#e0f2fe',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              fontSize: '11px',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            <Globe size={11} /> Daring
          </span>
        )
      )
    },
    {
      key: 'mhsId',
      label: 'Mahasiswa Bimbingan',
      width: '210px',
      render: (mhsId) => {
        const student = mahasiswaList.find(m => m.id === mhsId);
        if (!student) return <span>Mahasiswa #{mhsId}</span>;
        return (
          <div>
            <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-navy-950)', fontSize: '13px' }}>
              {student.nama}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              NIM. {student.nim} • <Badge variant={student.peranDosen.includes('motor') ? 'gold' : 'navy'}>{student.jenjang}</Badge>
            </div>
          </div>
        );
      }
    },
    {
      key: 'topik',
      label: 'Materi Pembahasan Substantif',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--primitive-navy-900)', fontSize: '13px' }}>
            {val}
          </div>
          {row.lokasi && row.moda === 'Luring' && (
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MapPin size={11} /> {row.lokasi}
            </div>
          )}
          {row.catatan && (
            <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '3px', fontStyle: 'italic' }}>
              Arahan: {row.catatan}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'buktiScan',
      label: 'Bukti Fisik (Scan)',
      width: '180px',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {row.buktiScan ? (
            <button
              type="button"
              onClick={() => setPreviewScanItem(row)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                border: '1px solid #f59e0b',
                color: '#b45309',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                width: 'fit-content'
              }}
              title="Periksa foto scan kartu bimbingan berparaf"
            >
              <FileImage size={13} />
              <span style={{ maxWidth: '125px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.buktiScan}
              </span>
            </button>
          ) : (
            <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>-</span>
          )}

          {row.dokumen && (
            <span style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <FileText size={10} /> {row.dokumen}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status & Aksi',
      width: '190px',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <StatusBadge status={val || 'Disetujui'} />
          {val === 'Menunggu Persetujuan' && (
            <button
              type="button"
              onClick={() => handleApprove(row.id)}
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#10B981',
                color: '#ffffff',
                border: 'none',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
              title="Sahkan sesi bimbingan luring ini"
            >
              <Check size={12} /> Sahkan
            </button>
          )}
        </div>
      )
    },
    {
      key: 'aksi',
      label: 'Detail',
      width: '70px',
      align: 'center',
      render: (_, row) => (
        <IconButton
          icon={Eye}
          label="Lihat Rincian Logbook"
          size="sm"
          bordered
          onClick={() => setSelectedBimbinganDetail(row)}
        />
      )
    }
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate && onNavigate('dashboard') },
          { label: 'Dosen Pembimbing' },
          { label: 'Bimbingan & Logbook' }
        ]}
        title="Administrasi Logbook Bimbingan"
        description="Pencatatan resmi riwayat konsultasi substantif, pengesahan bukti scan lembar kendali luring bertanda tangan, dan evaluasi berkala tugas akhir mahasiswa."
        statusBadge={
          pendingCount > 0 ? (
            <Badge variant="warning">{pendingCount} Menunggu Pengesahan</Badge>
          ) : (
            <Badge variant="navy">Semua Bimbingan Terverifikasi</Badge>
          )
        }
        primaryAction={
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Catat Sesi Bimbingan Baru
          </Button>
        }
      />

      <Panel noPadding>
        {/* Toolbar Filter */}
        <div 
          style={{ 
            padding: 'var(--space-3) var(--space-4)', 
            borderBottom: '1px solid var(--color-border-subtle)', 
            backgroundColor: 'var(--primitive-neutral-50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--type-caption-size)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}>
              Filter Mahasiswa:
            </span>
            <select
              value={selectedMhsFilter}
              onChange={(e) => setSelectedMhsFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                backgroundColor: 'var(--color-surface-panel)'
              }}
            >
              <option value="Semua">Semua Mahasiswa Bimbingan</option>
              {mahasiswaList.map((mhs) => (
                <option key={mhs.id} value={mhs.id}>
                  {mhs.nama} ({mhs.jenjang} — {mhs.peranDosen})
                </option>
              ))}
            </select>

            <span style={{ fontSize: 'var(--type-caption-size)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
              Moda:
            </span>
            <select
              value={selectedModaFilter}
              onChange={(e) => setSelectedModaFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                backgroundColor: 'var(--color-surface-panel)'
              }}
            >
              <option value="Semua">Semua Moda</option>
              <option value="Luring">Tatap Muka (Luring - Bukti Scan)</option>
              <option value="Daring">Konsultasi Daring (SIM-TA)</option>
            </select>
          </div>

          <Search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari topik atau catatan bimbingan..."
          />
        </div>

        {/* Tabel Logbook Bimbingan */}
        <Table
          density="normal"
          columns={columns}
          data={filteredBimbingan}
          striped
        />
      </Panel>

      {/* Modal Pencatatan Sesi Bimbingan Baru oleh Dosen */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat & Sahkan Sesi Bimbingan Baru"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            {mahasiswaList.length > 0 && (
              <Button variant="primary" onClick={handleSaveKonsultasi}>
                Sahkan Sesi Bimbingan
              </Button>
            )}
          </div>
        }
      >
        {mahasiswaList.length === 0 ? (
          <div style={{ padding: '16px 8px' }}>
            <Alert variant="warning" title="Belum Ada Mahasiswa Bimbingan">
              Anda saat ini belum memiliki mahasiswa bimbingan yang di-SK-kan oleh Koorprodi. Form pencatatan konsultasi baru akan aktif setelah Anda dialokasikan mahasiswa bimbingan.
            </Alert>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <FormField id="target-mhs" label="Pilih Mahasiswa Bimbingan" required>
            <Select
              value={targetMhsId}
              onChange={(e) => setTargetMhsId(e.target.value)}
              options={mahasiswaList.map(m => ({
                value: m.id,
                label: `${m.nama} — ${m.jenjang} (${m.peranDosen})`
              }))}
            />
          </FormField>

          <FormField id="moda-sesi" label="Moda Pelaksanaan Bimbingan" required>
            <Select
              value={modaInput}
              onChange={(e) => setModaInput(e.target.value)}
              options={[
                { value: 'Luring', label: 'Tatap Muka / Luring (Kartu Bimbingan Fisik)' },
                { value: 'Daring', label: 'Konsultasi Daring via SIM-TA' }
              ]}
            />
          </FormField>

          <FormField id="tanggal-sesi" label="Tanggal Konsultasi" required>
            <DateInput
              value={tanggalInput}
              onChange={(e) => setTanggalInput(e.target.value)}
            />
          </FormField>

          {modaInput === 'Luring' && (
            <FormField id="lokasi-sesi" label="Lokasi Pertemuan Fisik">
              <Input
                value={lokasiInput}
                onChange={(e) => setLokasiInput(e.target.value)}
                placeholder="Contoh: Ruang Dosen Manajemen FEB, RKB Lt. 2..."
              />
            </FormField>
          )}

          <FormField id="topik-sesi" label="Materi Pembahasan Substantif" required helperText="Uraikan bab, variabel, atau instrumen metodologi yang dibahas.">
            <Input
              value={topikInput}
              onChange={(e) => setTopikInput(e.target.value)}
              placeholder="Contoh: Pembahasan Matriks Grand Theory & Hipotesis Bab II"
            />
          </FormField>

          <FormField id="catatan-arahan" label="Catatan & Arahan Pembimbing" helperText="Tindak lanjut yang harus diselesaikan mahasiswa pada sesi berikutnya.">
            <Textarea
              value={catatanInput}
              onChange={(e) => setCatatanInput(e.target.value)}
              rows={3}
              placeholder="Tuliskan arahan perbaikan substantif..."
            />
          </FormField>
        </div>
        )}
      </Modal>

      {/* Modal Detail & Pengesahan Sesi Terpilih */}
      {selectedBimbinganDetail && (
        <Modal
          isOpen={!!selectedBimbinganDetail}
          onClose={() => setSelectedBimbinganDetail(null)}
          title="Rincian Resmi Sesi Bimbingan"
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div>
                {selectedBimbinganDetail.status === 'Menunggu Persetujuan' && (
                  <Button
                    variant="primary"
                    icon={Check}
                    onClick={() => {
                      handleApprove(selectedBimbinganDetail.id);
                      setSelectedBimbinganDetail(prev => prev ? { ...prev, status: 'Disetujui' } : null);
                    }}
                  >
                    Sahkan Sesi Bimbingan
                  </Button>
                )}
              </div>
              <Button variant="secondary" onClick={() => setSelectedBimbinganDetail(null)}>
                Tutup
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '14px 16px', 
                backgroundColor: '#ffffff', 
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #e2e8f0',
                borderTop: 'var(--border-width-medium) solid #1e3a8a',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                  Mahasiswa Bimbingan
                </span>
                <div style={{ fontWeight: '800', fontSize: '14.5px', color: '#0f172a', marginTop: '2px' }}>
                  {mahasiswaList.find(m => m.id === selectedBimbinganDetail.mhsId)?.nama || 'Mahasiswa FEB'}
                </div>
                <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: '600', marginTop: '2px' }}>
                  {selectedBimbinganDetail.peranDosen || 'Dosen Pembimbing'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end', fontSize: '12px', color: '#475569' }}>
                  <Calendar size={13} style={{ color: '#64748b' }} /> {selectedBimbinganDetail.tanggal}
                </div>
                <div style={{ marginTop: '4px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <Badge variant={selectedBimbinganDetail.moda === 'Luring' ? 'warning' : 'info'}>
                    {selectedBimbinganDetail.moda || 'Luring'}
                  </Badge>
                  <StatusBadge status={selectedBimbinganDetail.status || 'Disetujui'} />
                </div>
              </div>
            </div>

            {selectedBimbinganDetail.lokasi && (
              <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                  Lokasi Tatap Muka:
                </span>
                <div style={{ fontSize: '12.5px', color: '#0f172a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} style={{ color: '#d97706' }} /> {selectedBimbinganDetail.lokasi}
                </div>
              </div>
            )}

            <div style={{ padding: '12px 14px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Materi Pembahasan Substantif:
              </span>
              <div style={{ fontWeight: '600', color: '#0f172a', marginTop: '3px', fontSize: '13px', lineHeight: '1.45' }}>
                {selectedBimbinganDetail.topik}
              </div>
            </div>

            <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: 'var(--border-width-medium) solid #1e3a8a', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#1e3a8a', textTransform: 'uppercase' }}>
                Arahan &amp; Catatan Pembimbing:
              </span>
              <div style={{ fontSize: '12.5px', color: '#334155', marginTop: '3px', lineHeight: '1.5' }}>
                {selectedBimbinganDetail.catatan || selectedBimbinganDetail.hasil || 'Catatan bimbingan tatap muka.'}
              </div>
            </div>

            {/* Bukti Scan Berkas Fisik Mahasiswa */}
            {selectedBimbinganDetail.buktiScan && (
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileImage size={15} style={{ color: '#b45309' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                      Scan Lembar Kendali Bimbingan: {selectedBimbinganDetail.buktiScan}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewScanItem(selectedBimbinganDetail)}
                  >
                    Buka Ukuran Penuh
                  </Button>
                </div>

                {selectedBimbinganDetail.buktiScanUrl && (
                  <div 
                    onClick={() => setPreviewScanItem(selectedBimbinganDetail)}
                    style={{ cursor: 'pointer', maxHeight: '180px', overflow: 'hidden', display: 'flex', justifyContent: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', padding: '6px' }}
                  >
                    <img
                      src={selectedBimbinganDetail.buktiScanUrl}
                      alt="Scan Kartu Bimbingan Fisik"
                      style={{ maxHeight: '170px', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>STATUS VALIDASI:</span>
              <div style={{ marginTop: '4px' }}>
                <StatusBadge status={selectedBimbinganDetail.status || 'Disetujui'} />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Pratinjau Penuh Scan Berkas */}
      {previewScanItem && (
        <Modal
          isOpen={Boolean(previewScanItem)}
          onClose={() => setPreviewScanItem(null)}
          title={`Bukti Fisik Konsultasi Tatap Muka: ${previewScanItem.buktiScan || 'Scan Lembar Kendali'}`}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {previewScanItem.status === 'Menunggu Persetujuan' ? 'Status: Menunggu Pengesahan Dosen' : 'Status: Telah Disahkan'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {previewScanItem.status === 'Menunggu Persetujuan' && (
                  <Button
                    variant="primary"
                    icon={Check}
                    onClick={() => {
                      handleApprove(previewScanItem.id);
                      setPreviewScanItem(null);
                    }}
                  >
                    Sahkan Sesi Bimbingan
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setPreviewScanItem(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', backgroundColor: '#334155', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ width: '100%', maxWidth: '720px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-sm)', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
              <img
                src={previewScanItem.buktiScanUrl || SAMPLE_SCAN_KARTU_BIMBINGAN}
                alt="Scan Kartu Kendali Bimbingan Resmi"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
