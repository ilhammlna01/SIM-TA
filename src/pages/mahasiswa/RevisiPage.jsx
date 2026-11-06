import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import { 
  Panel, 
  Button, 
  StatusBadge, 
  Table, 
  Modal, 
  FormField, 
  Input, 
  Textarea, 
  FileUpload, 
  Alert,
  Badge,
  StatCard
} from '../../components/ui';
import { notify } from '../../components/feedback';
import { PROGRAM_STUDI_INFO } from '../../data/pedomanRules';
import { 
  CheckSquare, 
  Clock, 
  Printer, 
  Edit3, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Download 
} from 'lucide-react';
import { downloadLembarRevisi } from '../../utils/pdfDownloader';

/**
 * Halaman 8: Matriks Revisi Ujian
 * 
 * Menggunakan Structured Table dengan kolom wajib:
 * 1. Bagian / Bab
 * 2. Catatan Penguji
 * 3. Status Verifikasi
 * 4. Tindak Lanjut Mahasiswa
 * Dilengkapi batas waktu penyelesaian revisi (Pedoman 2026).
 */
export default function RevisiPage({ 
  student, 
  revisiList = [], 
  onUpdateRevisi 
}) {
  const prodiInfo = PROGRAM_STUDI_INFO[student.jenjang] || PROGRAM_STUDI_INFO.S1;
  const studentRevisi = revisiList.filter(r => r.mhsId === student.id);

  const [activeItemToEdit, setActiveItemToEdit] = useState(null);
  const [tindakLanjutInput, setTindakLanjutInput] = useState('');
  const [halamanInput, setHalamanInput] = useState('');

  const handleOpenEdit = (item) => {
    setActiveItemToEdit(item);
    setTindakLanjutInput(item.tindakLanjut || '');
    setHalamanInput(item.halamanPerbaikan || '');
  };

  const handleSaveTindakLanjut = () => {
    if (!tindakLanjutInput.trim()) {
      notify('Mohon uraikan tindak lanjut perbaikan yang telah dilakukan.', { variant: 'warning' });
      return;
    }

    if (onUpdateRevisi && activeItemToEdit) {
      onUpdateRevisi({
        ...activeItemToEdit,
        tindakLanjut: tindakLanjutInput,
        halamanPerbaikan: halamanInput,
        status: 'Menunggu Approval Penguji'
      });
    }

    setActiveItemToEdit(null);
  };

  const columns = [
    { 
      key: 'bagian', 
      label: 'Bagian / Bab', 
      width: '180px',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: '700', color: '#1e3a8a', fontSize: '12.5px' }}>
            {val}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Edit3 size={10} color="#1e3a8a" />
            </div>
            {row.namaPenguji}
          </div>
        </div>
      )
    },
    { 
      key: 'catatanPenguji', 
      label: 'Catatan Koreksi Penguji',
      render: (val) => (
        <div style={{ 
          fontSize: '12px', color: '#334155', lineHeight: '1.45',
          padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)',
          borderLeft: 'var(--border-width-medium) solid #e2e8f0', fontStyle: 'italic'
        }}>
          "{val}"
        </div>
      )
    },
    { 
      key: 'tindakLanjut', 
      label: 'Tindak Lanjut Mahasiswa',
      render: (val, row) => val ? (
        <div>
          <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
            {val}
          </div>
          {row.halamanPerbaikan && (
            <div style={{ 
              fontSize: '11px', color: '#0284c7', marginTop: '4px', fontWeight: '600',
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 6px', backgroundColor: '#f0f9ff', borderRadius: 'var(--radius-sm)'
            }}>
              <FileText size={10} />
              {row.halamanPerbaikan}
            </div>
          )}
        </div>
      ) : (
        <span style={{ 
          fontSize: '11.5px', color: '#d97706', fontStyle: 'italic',
          display: 'inline-flex', alignItems: 'center', gap: '4px'
        }}>
          <AlertTriangle size={12} />
          Belum ditindaklanjuti
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      width: '160px',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '130px',
      align: 'center',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          icon={Edit3}
          onClick={() => handleOpenEdit(row)}
        >
          Tindak Lanjuti
        </Button>
      )
    }
  ];

  const pendingCount = studentRevisi.filter(r => r.status !== 'Disetujui').length;
  const completedCount = studentRevisi.filter(r => r.status === 'Disetujui').length;
  const totalCount = studentRevisi.length;

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Portal Mahasiswa' },
          { label: `Portal ${prodiInfo.jenjang}` },
          { label: 'Matriks Revisi Ujian' }
        ]}
        title="Matriks Revisi Pasca Ujian"
        description={`Pencatatan resmi perbaikan naskah berdasarkan catatan koreksi Dewan Penguji sesuai Buku Pedoman 2026.`}
        statusBadge={<StatusBadge status={pendingCount === 0 ? 'Disetujui' : 'Dalam Revisi'} />}
        primaryAction={
          <Button 
            variant="primary" 
            icon={Download}
            onClick={() => downloadLembarRevisi(studentRevisi, student)}
          >
            Unduh Pengesahan Revisi (PDF)
          </Button>
        }
      />

      {/* Progress Summary Cards */}
      {totalCount > 0 && (
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', 
          marginBottom: '20px' 
        }} className="grid-stats-responsive">
          <StatCard
            label="Total Butir Revisi"
            value={totalCount}
            caption="dari Dewan Penguji"
            tone="navy"
          />
          <StatCard
            label="Disahkan Penguji"
            value={completedCount}
            caption="butir selesai diverifikasi"
            tone="green"
          />
          <StatCard
            label="Sisa Tertunda"
            value={pendingCount}
            caption="butir perlu perbaikan"
            tone={pendingCount > 0 ? 'amber' : 'green'}
          />
        </div>
      )}

      {/* Alert Peringatan Batas Waktu Revisi */}
      <div style={{ marginBottom: '20px' }}>
        <Alert 
          variant={pendingCount > 0 ? 'warning' : 'success'}
          title={`Regulasi Batas Waktu Revisi (${prodiInfo.revisiBatasWaktu})`}
        >
          {pendingCount > 0 ? (
            <span>
              Tersisa <strong>{pendingCount} butir catatan revisi</strong> yang belum disahkan oleh dewan penguji. Batas waktu penyelesaian revisi maksimal adalah <strong>{prodiInfo.revisiBatasWaktu}</strong> sejak tanggal pelaksanaan ujian. Keterlambatan melebihi batas waktu mewajibkan mahasiswa menempuh ujian ulang sesuai ketentuan Buku Pedoman 2026.
            </span>
          ) : (
            <span>
              Seluruh catatan revisi dewan penguji telah dinyatakan selesai dan disetujui. Anda dapat mencetak lembar pengesahan revisi untuk persyaratan yudisium kelulusan.
            </span>
          )}
        </Alert>
      </div>

      {/* Structured Table Revisi */}
      <Panel
        title="Daftar Catatan Koreksi & Tindak Lanjut"
        subtitle={`Total ${studentRevisi.length} butir masukan dari Dewan Penguji`}
        icon={CheckSquare}
        noPadding
      >
        <Table
          columns={columns}
          data={studentRevisi}
          density="normal"
          striped
        />
      </Panel>

      {/* Modal Form Tindak Lanjut Revisi */}
      {activeItemToEdit && (
        <Modal
          isOpen={Boolean(activeItemToEdit)}
          onClose={() => setActiveItemToEdit(null)}
          title={`Tindak Lanjut: ${activeItemToEdit.bagian}`}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setActiveItemToEdit(null)}>
                Batal
              </Button>
              <Button variant="primary" onClick={handleSaveTindakLanjut}>
                Simpan & Ajukan Verifikasi
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ 
              padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', 
              border: '1px solid #e2e8f0', borderLeft: '4px solid #1e3a8a' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                  Catatan Penguji
                </span>
                <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: '600' }}>
                  • {activeItemToEdit.namaPenguji}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#0f172a', marginTop: '4px', fontStyle: 'italic', lineHeight: '1.45' }}>
                "{activeItemToEdit.catatanPenguji}"
              </div>
            </div>

            <FormField 
              id="rev-tindak-lanjut" 
              label="Uraian Perbaikan yang Dilakukan Mahasiswa" 
              required 
              helperText="Jelaskan secara spesifik perbaikan teori, data, atau tata tulis yang telah dilakukan."
            >
              <Textarea
                value={tindakLanjutInput}
                onChange={(e) => setTindakLanjutInput(e.target.value)}
                rows={4}
                placeholder="Tuliskan tindakan perbaikan substantif..."
              />
            </FormField>

            <FormField 
              id="rev-halaman" 
              label="Nomor Halaman Perbaikan pada Naskah Baru" 
              required 
              helperText="Contoh: Halaman 47-50 pada Bab II."
            >
              <Input
                value={halamanInput}
                onChange={(e) => setHalamanInput(e.target.value)}
                placeholder="Halaman..."
              />
            </FormField>

            <FormField 
              id="rev-file" 
              label="Unggah Berkas Naskah Bukti Perbaikan (PDF)" 
              helperText="Tandai bagian yang direvisi dengan highlight kuning pada naskah."
            >
              <FileUpload accept=".pdf" maxSizeMB={10} />
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
}
