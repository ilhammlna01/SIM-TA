import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import { 
  Panel, 
  Button, 
  IconButton, 
  StatusBadge, 
  Table, 
  Modal, 
  FormField, 
  Input, 
  Textarea, 
  Select, 
  DateInput, 
  FileUpload, 
  ProgressIndicator, 
  Alert,
  Badge
} from '../../components/ui';
import { notify } from '../../components/feedback';
import { PROGRAM_STUDI_INFO, getIstilahTA } from '../../data/pedomanRules';
import { 
  MessageSquare, 
  Plus, 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Eye, 
  User,
  MapPin,
  Globe,
  FileImage,
  Upload,
  Calendar,
  Sparkles,
  Paperclip,
  Check,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { SAMPLE_SCAN_KARTU_BIMBINGAN, readFileAsDataUrl } from '../../utils/bimbinganScanSample';
import { downloadKartuBimbingan, downloadUniversalDoc } from '../../utils/pdfDownloader';

/**
 * Halaman 5: Bimbingan Akademik (Portal Mahasiswa)
 * 
 * Mendukung Bimbingan Hybrid:
 * - Konsultasi Daring (Online via SIM-TA)
 * - Konsultasi Tatap Muka / Luring (Offline) dengan unggah scan bukti fisik bertanda tangan dosen
 * - Perhitungan kuota pemenuhan syarat ujian (min. 8 sesi S1, 10 sesi S2, 12 sesi S3)
 */
export default function BimbinganPage({ 
  student, 
  bimbinganList = [], 
  onAddBimbingan 
}) {
  const prodiInfo = PROGRAM_STUDI_INFO[student.jenjang] || PROGRAM_STUDI_INFO.S1;
  const istilahTA = getIstilahTA(student, prodiInfo);
  const minBimbingan = student.jenjang === 'S3' ? 12 : student.jenjang === 'S2' ? 10 : 8;

  const studentBimbingan = bimbinganList.filter(b => b.mhsId === student.id);
  const approvedCount = studentBimbingan.filter(b => b.status === 'Disetujui').length;
  const isTargetAchieved = approvedCount >= minBimbingan;
  const luringCount = studentBimbingan.filter(b => b.moda === 'Luring' || !b.moda).length;
  const daringCount = studentBimbingan.filter(b => b.moda === 'Daring').length;
  const pendingCount = studentBimbingan.filter(b => b.status === 'Menunggu Persetujuan').length;
  const progressPercent = Math.min(100, Math.round((approvedCount / minBimbingan) * 100));

  // State untuk modal bimbingan baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedModa, setSelectedModa] = useState('Luring'); // 'Luring' | 'Daring'
  const [selectedDosen, setSelectedDosen] = useState(student.pembimbing?.[0]?.nama || '');

  React.useEffect(() => {
    if (student?.pembimbing?.[0]?.nama) {
      setSelectedDosen(student.pembimbing[0].nama);
    }
  }, [student]);
  const [tanggalInput, setTanggalInput] = useState(new Date().toISOString().split('T')[0]);
  const [lokasiInput, setLokasiInput] = useState('Ruang Dosen Jurusan Manajemen FEB Lantai 2');
  const [topikInput, setTopikInput] = useState('');
  const [hasilInput, setHasilInput] = useState('');
  const [dokumenDrafName, setDokumenDrafName] = useState('Draf_Naskah_Revisi.pdf');

  // State file scan bukti fisik (PDF/JPG/PNG)
  const [buktiScanFile, setBuktiScanFile] = useState(null);
  const [buktiScanName, setBuktiScanName] = useState('Scan_Kartu_Kendali_Bimbingan.jpg');
  const [buktiScanUrl, setBuktiScanUrl] = useState(SAMPLE_SCAN_KARTU_BIMBINGAN);

  // State untuk detail bimbingan & preview modal
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [previewScanItem, setPreviewScanItem] = useState(null);

  // Handler Unggah Berkas Scan Nyata
  const handleScanFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBuktiScanFile(file);
    setBuktiScanName(file.name);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setBuktiScanUrl(dataUrl);
    } catch (err) {
      console.warn('Gagal membaca file data URL:', err);
    }
  };

  const handleUseSampleScan = () => {
    setBuktiScanName('Scan_Kartu_Bimbingan_FEB_UTM.jpg');
    setBuktiScanUrl(SAMPLE_SCAN_KARTU_BIMBINGAN);
  };

  const handleSaveBimbingan = () => {
    if (!topikInput.trim()) {
      notify('Mohon isi materi atau bab yang dikonsultasikan.', { variant: 'warning' });
      return;
    }

    const newSesiNumber = studentBimbingan.length + 1;
    const newEntry = {
      id: `bim-${Date.now()}`,
      mhsId: student.id,
      sesi: `Sesi ${newSesiNumber}`,
      tanggal: tanggalInput,
      moda: selectedModa,
      lokasi: selectedModa === 'Luring' ? (lokasiInput || 'Ruang Dosen FEB UTM') : 'Daring via SIM-TA FEB UTM',
      dosenNama: selectedDosen,
      peranDosen: student.pembimbing.find(p => p.nama === selectedDosen)?.peran || 'Dosen Pembimbing',
      topik: topikInput,
      hasil: hasilInput || (selectedModa === 'Luring' ? 'Catatan dan arahan bimbingan tatap muka tertulis pada lembar kendali fisik.' : 'Menunggu tanggapan dari dosen pembimbing.'),
      catatan: selectedModa === 'Luring' ? 'Bimbingan tatap muka dengan bukti scan kartu kendali fisik berparaf.' : 'Catatan konsultasi daring diajukan mahasiswa.',
      dokumen: dokumenDrafName || `Draf_Bimbingan_Sesi_${newSesiNumber}.pdf`,
      buktiScan: selectedModa === 'Luring' ? buktiScanName : null,
      buktiScanUrl: selectedModa === 'Luring' ? buktiScanUrl : null,
      status: 'Menunggu Persetujuan'
    };

    if (onAddBimbingan) {
      onAddBimbingan(newEntry);
    }

    setIsAddModalOpen(false);
    setTopikInput('');
    setHasilInput('');
  };

  const columns = [
    { 
      key: 'sesi', 
      label: 'Sesi', 
      width: '95px', 
      sortable: true,
      render: (val) => (
        <span 
          style={{ 
            display: 'inline-block',
            fontWeight: '700', 
            color: '#1e3a8a', 
            backgroundColor: '#eff6ff', 
            padding: '3px 8px', 
            borderRadius: 'var(--radius-sm)', 
            fontSize: '11.5px',
            border: '1px solid #dbeafe'
          }}
        >
          {val}
        </span>
      )
    },
    { 
      key: 'tanggal', 
      label: 'Tanggal', 
      width: '125px', 
      sortable: true,
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#334155' }}>
          <Calendar size={13} style={{ color: '#64748b' }} />
          <span>{val}</span>
        </div>
      )
    },
    {
      key: 'moda',
      label: 'Moda',
      width: '150px',
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
            <MapPin size={11} /> Tatap Muka (Luring)
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
            <Globe size={11} /> Daring (SIM-TA)
          </span>
        )
      )
    },
    { 
      key: 'dosen', 
      label: 'Dosen Pembimbing', 
      width: '210px',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '12.5px' }}>
            {row.dosenNama}
          </div>
          <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: '500' }}>
            {row.peranDosen}
          </div>
        </div>
      )
    },
    { 
      key: 'topik', 
      label: 'Materi Pembahasan Substantif',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: '500', color: '#1e293b', fontSize: '12.5px', lineHeight: '1.4' }}>
            {val}
          </div>
          {row.lokasi && row.moda === 'Luring' && (
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MapPin size={11} style={{ color: '#d97706' }} /> {row.lokasi}
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'bukti', 
      label: 'Bukti & Berkas', 
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
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#b45309',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                width: 'fit-content',
                transition: 'all 0.15s ease'
              }}
              title="Klik untuk melihat scan kartu bimbingan fisik"
            >
              <FileImage size={12} />
              <span style={{ maxWidth: '125px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.buktiScan}
              </span>
            </button>
          ) : null}

          {row.dokumen ? (
            <span style={{ fontSize: '11px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <FileText size={11} style={{ color: '#0284c7' }} /> {row.dokumen}
            </span>
          ) : null}
          {!row.buktiScan && !row.dokumen && (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>-</span>
          )}
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Verifikasi', 
      width: '145px',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '75px',
      align: 'center',
      render: (_, row) => (
        <IconButton
          icon={Eye}
          label="Lihat detail bimbingan"
          size="sm"
          bordered
          onClick={() => setDetailModalItem(row)}
        />
      )
    }
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Portal Mahasiswa' },
          { label: `Portal ${prodiInfo.jenjang}` },
          { label: 'Bimbingan Tugas Akhir' }
        ]}
        title={`Logbook Bimbingan ${istilahTA}`}
        description={`Pencatatan resmi rekam jejak konsultasi daring dan bimbingan tatap muka (luring) dengan bukti scan lembar kendali bertanda tangan dosen.`}
        statusBadge={<StatusBadge status={isTargetAchieved ? 'Disetujui' : (student.pembimbing?.length > 0 ? 'Dalam Proses' : 'Belum Ditetapkan')} />}
        primaryAction={
          <Button 
            variant="primary" 
            icon={Plus}
            disabled={!student.pembimbing || student.pembimbing.length === 0}
            onClick={() => {
              if (!student.pembimbing || student.pembimbing.length === 0) {
                notify('Dosen pembimbing belum ditetapkan oleh Koorprodi.', { variant: 'warning' });
                return;
              }
              setSelectedModa('Luring');
              setIsAddModalOpen(true);
            }}
          >
            Catat Sesi Bimbingan
          </Button>
        }
        secondaryAction={
          <Button 
            variant="secondary" 
            icon={Download}
            onClick={() => downloadKartuBimbingan(student, studentBimbingan)}
          >
            Unduh Kartu Bimbingan (PDF)
          </Button>
        }
      />

      {/* Peringatan Pembimbing Belum Ditetapkan */}
      {(!student.pembimbing || student.pembimbing.length === 0) && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert
            variant="warning"
            title="Dosen Pembimbing Belum Ditetapkan"
          >
            Dosen pembimbing belum ditetapkan oleh Koordinator Program Studi (Koorprodi). Anda belum dapat mencatat atau mengajukan logbook sesi bimbingan sampai SK Pembimbing resmi diterbitkan.
          </Alert>
        </div>
      )}

      {/* 1. Ringkasan Ketercapaian Bimbingan (3 Kartu Eksekutif Berimbang) */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: 'var(--space-3)', 
          marginBottom: 'var(--space-4)' 
        }}
      >
        {/* Kartu 1: Status Kelayakan Ujian */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #e2e8f0',
            borderTop: `3px solid ${isTargetAchieved ? '#16a34a' : '#d97706'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                Syarat Kelayakan Ujian
              </span>
              <Badge variant={isTargetAchieved ? 'green' : 'warning'}>
                {isTargetAchieved ? 'MEMENUHI SYARAT' : `KURANG ${minBimbingan - approvedCount} SESI`}
              </Badge>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '6px 0 10px' }}>
              <span style={{ fontSize: '26px', fontWeight: '800', color: isTargetAchieved ? '#15803d' : '#0f172a', lineHeight: 1 }}>
                {approvedCount}
              </span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
                / minimal {minBimbingan} sesi disahkan
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                <span>Progres Akumulasi</span>
                <span style={{ fontWeight: '700', color: isTargetAchieved ? '#15803d' : '#0f172a' }}>{progressPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${progressPercent}%`, 
                    height: '100%', 
                    backgroundColor: isTargetAchieved ? '#16a34a' : '#d97706',
                    borderRadius: '999px',
                    transition: 'width 0.3s ease'
                  }} 
                />
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: '#64748b', paddingTop: '8px', borderTop: '1px solid #f1f5f9', lineHeight: '1.4' }}>
            Pedoman FEB UTM ({student.jenjang || 'S1'}): Minimal <strong>{minBimbingan} sesi</strong> bimbingan sebelum pendaftaran ujian.
          </div>
        </div>

        {/* Kartu 2: Rekapitulasi Sesi Konsultasi */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #e2e8f0',
            borderTop: 'var(--border-width-medium) solid #0284c7',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                Rekapitulasi Logbook
              </span>
              <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                Total {studentBimbingan.length} Sesi
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} style={{ color: '#16a34a' }} /> Disetujui Pembimbing
                </span>
                <strong style={{ color: '#15803d' }}>{approvedCount} sesi</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} style={{ color: '#d97706' }} /> Menunggu Verifikasi
                </span>
                <strong style={{ color: pendingCount > 0 ? '#b45309' : '#64748b' }}>{pendingCount} sesi</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} style={{ color: '#b45309' }} /> Tatap Muka (Luring)
                </span>
                <strong style={{ color: '#0f172a' }}>{luringCount} sesi</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={13} style={{ color: '#0284c7' }} /> Konsultasi Daring
                </span>
                <strong style={{ color: '#0f172a' }}>{daringCount} sesi</strong>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: '#64748b', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
            Mendukung bimbingan hybrid (luring berparaf & daring via sistem).
          </div>
        </div>

        {/* Kartu 3: Tim Pembimbing Terdaftar */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #e2e8f0',
            borderTop: 'var(--border-width-medium) solid #1e3a8a',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                Dosen Pembimbing Akademik
              </span>
              <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#1e3a8a', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                {student.pembimbing?.length || 0} Dosen
              </span>
            </div>

            {student.pembimbing && student.pembimbing.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {student.pembimbing.map((p, idx) => (
                  <div 
                    key={idx}
                    style={{ 
                      padding: '8px 10px', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a8a', flexShrink: 0 }}>
                      <User size={14} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.nama}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        {p.peran} {p.nip ? `• NIP. ${p.nip}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px 12px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                Dosen pembimbing belum ditetapkan oleh Koorprodi.
              </div>
            )}
          </div>

          <div style={{ fontSize: '11px', color: '#64748b', paddingTop: '8px', borderTop: '1px solid #f1f5f9', marginTop: '8px' }}>
            SK Penetapan resmi diterbitkan oleh Koordinator Program Studi.
          </div>
        </div>
      </div>

      {/* 2. Tabel Logbook Bimbingan */}
      <Panel
        title="Tabel Rekam Jejak Bimbingan"
        subtitle={`Daftar sesi konsultasi daring dan tatap muka (luring) yang tercatat dalam sistem informasi akademik.`}
        icon={FileText}
        noPadding
        actions={
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
            Total: {studentBimbingan.length} Sesi
          </span>
        }
      >
        <Table
          columns={columns}
          data={studentBimbingan}
          density="normal"
          striped
          emptyContent={
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              Belum ada logbook sesi bimbingan yang tercatat.
            </div>
          }
        />
      </Panel>

      {/* Modal Form Tambah Bimbingan (Mendukung Moda Daring & Tatap Muka Luring) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Pencatatan Sesi Bimbingan Tugas Akhir"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveBimbingan}>
              Kirim ke Dosen Pembimbing
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Pilihan Moda Konsultasi */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.4px' }}>
              PILIH MODA PELAKSANAAN BIMBINGAN:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedModa('Luring')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: selectedModa === 'Luring' ? '2px solid #d97706' : '1px solid #e2e8f0',
                  backgroundColor: selectedModa === 'Luring' ? '#fffdf5' : '#ffffff',
                  color: selectedModa === 'Luring' ? '#92400e' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: selectedModa === 'Luring' ? '0 1px 3px rgba(217, 119, 6, 0.1)' : 'none'
                }}
              >
                <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: selectedModa === 'Luring' ? '#fde68a' : '#f1f5f9', flexShrink: 0 }}>
                  <MapPin size={16} style={{ color: selectedModa === 'Luring' ? '#b45309' : '#64748b' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '12.5px' }}>Tatap Muka (Luring)</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Unggah scan paraf lembar fisik</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedModa('Daring')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: selectedModa === 'Daring' ? '2px solid #1e3a8a' : '1px solid #e2e8f0',
                  backgroundColor: selectedModa === 'Daring' ? '#eff6ff' : '#ffffff',
                  color: selectedModa === 'Daring' ? '#1e3a8a' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: selectedModa === 'Daring' ? '0 1px 3px rgba(30, 58, 138, 0.1)' : 'none'
                }}
              >
                <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: selectedModa === 'Daring' ? '#bfdbfe' : '#f1f5f9', flexShrink: 0 }}>
                  <Globe size={16} style={{ color: selectedModa === 'Daring' ? '#1e40af' : '#64748b' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '12.5px' }}>Konsultasi Daring</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Konsultasi via SIM-TA</div>
                </div>
              </button>
            </div>
          </div>

          <FormField id="bimb-dosen" label="Pilih Dosen Pembimbing / Promotor" required>
            <Select
              value={selectedDosen}
              onChange={(e) => setSelectedDosen(e.target.value)}
              options={student.pembimbing.map(p => ({
                value: p.nama,
                label: `${p.peran}: ${p.nama}`
              }))}
            />
          </FormField>

          <FormField 
            id="bimb-tgl" 
            label="Tanggal Pelaksanaan Bimbingan" 
            required 
            helperText="Pilih tanggal pelaksanaan konsultasi (dapat berupa tanggal lampau sesuai pertemuan fisik yang telah berlangsung)."
          >
            <DateInput
              value={tanggalInput}
              onChange={(e) => setTanggalInput(e.target.value)}
            />
          </FormField>

          {selectedModa === 'Luring' && (
            <FormField id="bimb-lokasi" label="Lokasi Pertemuan Tatap Muka" helperText="Contoh: Ruang Dosen Manajemen FEB, Gedung RKB, Laboratorium.">
              <Input
                value={lokasiInput}
                onChange={(e) => setLokasiInput(e.target.value)}
                placeholder="Masukkan lokasi pertemuan fisik..."
              />
            </FormField>
          )}

          <FormField id="bimb-topik" label="Materi / Bab yang Dikonsultasikan" required helperText="Contoh: Konsultasi Pembahasan Bab IV Hasil Penelitian dan Uji Validitas.">
            <Input
              value={topikInput}
              onChange={(e) => setTopikInput(e.target.value)}
              placeholder="Masukkan topik substantif bimbingan..."
            />
          </FormField>

          <FormField 
            id="bimb-hasil" 
            label={selectedModa === 'Luring' ? "Ringkasan Arahan / Catatan Tulis Tangan Pembimbing" : "Catatan / Pertanyaan Mahasiswa"} 
            helperText="Tuliskan poin-poin saran dan perbaikan yang disampaikan oleh pembimbing."
          >
            <Textarea
              value={hasilInput}
              onChange={(e) => setHasilInput(e.target.value)}
              rows={3}
              placeholder="Poin-poin perbaikan dari coretan atau arahan pembimbing..."
            />
          </FormField>

          {/* Bagian Khusus Bimbingan Luring: Unggah Scan PDF/JPG Bukti Tanda Tangan */}
          {selectedModa === 'Luring' && (
            <div style={{ padding: '14px 16px', backgroundColor: '#fffdf5', border: '1px solid #fef08a', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileImage size={15} style={{ color: '#b45309' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>
                    Unggah Bukti Scan / Foto Lembar Bimbingan *
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleUseSampleScan}
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#b45309',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px 8px',
                    cursor: 'pointer'
                  }}
                >
                  Pakai Contoh Scan FEB
                </button>
              </div>

              <p style={{ fontSize: '11.5px', color: '#78350f', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                Unggah foto atau hasil pindai kartu kendali bimbingan / lembar coretan revisi yang memuat tanda tangan atau paraf asli dosen pembimbing.
              </p>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  id="scan-upload-input"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleScanFileSelected}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Upload}
                  onClick={() => document.getElementById('scan-upload-input')?.click()}
                >
                  Pilih Berkas Scan (JPG/PDF)
                </Button>
                <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: '500' }}>
                  {buktiScanName}
                </span>
              </div>

              {/* Pratinjau Bukti Scan */}
              {buktiScanUrl && (
                <div style={{ marginTop: '12px', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                  <div style={{ padding: '6px 10px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155' }}>
                      Pratinjau Bukti Fisik: {buktiScanName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewScanItem({ buktiScan: buktiScanName, buktiScanUrl })}
                      style={{ fontSize: '11px', color: '#1e3a8a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                    >
                      Perbesar
                    </button>
                  </div>
                  <div style={{ maxHeight: '150px', overflow: 'hidden', display: 'flex', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '6px' }}>
                    <img
                      src={buktiScanUrl}
                      alt="Pratinjau Scan Lembar Bimbingan"
                      style={{ maxHeight: '140px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Opsi Lampiran Draf Naskah Bab PDF */}
          <FormField id="bimb-draf" label="Lampiran Draf Naskah Bab (Opsional)" helperText="Draf bab skripsi yang dikonsultasikan.">
            <Input
              value={dokumenDrafName}
              onChange={(e) => setDokumenDrafName(e.target.value)}
              placeholder="Nama file draf bab (misal: Draf_Bab4_Revisi.pdf)"
            />
          </FormField>
        </div>
      </Modal>

      {/* Modal Detail Sesi Bimbingan */}
      {detailModalItem && (
        <Modal
          isOpen={Boolean(detailModalItem)}
          onClose={() => setDetailModalItem(null)}
          title={`Detail ${detailModalItem.sesi} Bimbingan`}
          size="md"
          footer={
            <Button variant="secondary" onClick={() => setDetailModalItem(null)}>
              Tutup
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Header Ringkasan Sesi */}
            <div 
              style={{ 
                padding: '14px 16px', 
                backgroundColor: '#ffffff', 
                borderRadius: 'var(--radius-lg)', 
                border: '1px solid #e2e8f0',
                borderTop: 'var(--border-width-medium) solid #1e3a8a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Rekam Sesi Logbook
                </span>
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0' }}>
                  {detailModalItem.sesi}
                </h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} style={{ color: '#64748b' }} /> {detailModalItem.tanggal}
                </span>
                <StatusBadge status={detailModalItem.status} />
              </div>
            </div>

            {/* Grid 2 Kolom: Dosen & Moda Pertemuan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Dosen Pembimbing
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                  {detailModalItem.dosenNama}
                </div>
                <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: '600', marginTop: '2px' }}>
                  {detailModalItem.peranDosen}
                </div>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Moda & Lokasi Pertemuan
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <Badge variant={detailModalItem.moda === 'Luring' ? 'warning' : 'info'}>
                    {detailModalItem.moda || 'Luring'}
                  </Badge>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={11} style={{ color: '#d97706', flexShrink: 0 }} />
                  <span>{detailModalItem.lokasi || 'SIM-TA FEB UTM'}</span>
                </div>
              </div>
            </div>

            {/* Materi Pembahasan */}
            <div style={{ padding: '12px 14px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Materi Substantif yang Dikonsultasikan
              </div>
              <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600', lineHeight: '1.45' }}>
                {detailModalItem.topik}
              </div>
            </div>

            {/* Catatan / Arahan Pembimbing */}
            <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', borderLeft: 'var(--border-width-medium) solid #1e3a8a' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#1e3a8a', textTransform: 'uppercase', marginBottom: '4px' }}>
                Arahan & Catatan Dosen Pembimbing
              </div>
              <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.5' }}>
                {detailModalItem.hasil || detailModalItem.catatan || 'Belum ada catatan tambahan dari pembimbing.'}
              </div>
            </div>

            {/* Berkas Lampiran Draf jika ada */}
            {detailModalItem.dokumen && (
              <div style={{ padding: '10px 14px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155' }}>
                  <FileText size={14} style={{ color: '#0284c7' }} />
                  <span>Lampiran Draf: <strong>{detailModalItem.dokumen}</strong></span>
                </div>
                <Button size="sm" variant="ghost" icon={Download} onClick={() => downloadUniversalDoc({ namaDokumen: detailModalItem.dokumen || 'Lampiran Naskah Bimbingan', jenis: 'Lampiran Bimbingan' }, student)}>
                  Unduh
                </Button>
              </div>
            )}

            {/* Bukti Scan Berkas Fisik */}
            {detailModalItem.buktiScan && (
              <div style={{ padding: '14px', backgroundColor: '#fffdf5', border: '1px solid #fef08a', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileImage size={15} style={{ color: '#b45309' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#854d0e' }}>
                      Bukti Scan Lembar Kendali Fisik Berparaf: {detailModalItem.buktiScan}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewScanItem(detailModalItem)}
                  >
                    Buka Ukuran Penuh
                  </Button>
                </div>

                {detailModalItem.buktiScanUrl && (
                  <div 
                    role="button"
                    tabIndex={0}
                    aria-label="Buka pratinjau ukuran penuh scan kartu bimbingan"
                    onClick={() => setPreviewScanItem(detailModalItem)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setPreviewScanItem(detailModalItem);
                      }
                    }}
                    style={{ cursor: 'pointer', maxHeight: '180px', overflow: 'hidden', display: 'flex', justifyContent: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '6px' }}
                  >
                    <img
                      src={detailModalItem.buktiScanUrl}
                      alt="Scan Kartu Bimbingan"
                      style={{ maxHeight: '170px', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Pratinjau Bukti Scan Dokumen Penuh */}
      {previewScanItem && (
        <Modal
          isOpen={Boolean(previewScanItem)}
          onClose={() => setPreviewScanItem(null)}
          title={`Bukti Fisik Bimbingan: ${previewScanItem.buktiScan || 'Scan Lembar Kendali'}`}
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {previewScanItem.dosenNama ? `Diparaf oleh: ${previewScanItem.dosenNama}` : 'Dokumen Bukti Scan FEB UTM'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                  variant="secondary" 
                  icon={Download}
                  onClick={() => downloadUniversalDoc({ namaDokumen: previewScanItem.buktiScan || 'Salinan Lembar Kendali Bimbingan', jenis: 'Bukti Fisik Bimbingan' }, student)}
                >
                  Unduh Berkas
                </Button>
                <Button variant="primary" onClick={() => setPreviewScanItem(null)}>
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
