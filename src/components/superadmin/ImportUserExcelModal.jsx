import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  RefreshCw,
  Info,
  ChevronRight,
  ArrowLeft,
  X,
  UserCheck
} from 'lucide-react';
import { Modal, Badge } from '../ui';
import { notify } from '../feedback';
import {
  downloadUserImportTemplate,
  parseAndValidateUserExcel,
  VALID_ROLES
} from '../../utils/excelUserImport';

export default function ImportUserExcelModal({
  isOpen,
  onClose,
  existingUsers = [],
  onImportSuccess
}) {
  const [activeStep, setActiveStep] = useState('upload'); // 'upload' | 'preview'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [duplicateHandling, setDuplicateHandling] = useState('update'); // 'update' | 'skip'
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'valid' | 'duplicate' | 'invalid'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setActiveStep('upload');
    setSelectedFile(null);
    setIsParsing(false);
    setParseError(null);
    setParseResult(null);
    setDuplicateHandling('update');
    setFilterTab('all');
    setIsSubmitting(false);
    setIsDragOver(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const processFile = async (file) => {
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExt) {
      setParseError('Format berkas tidak didukung. Harap unggah berkas Excel berformat .xlsx, .xls, atau .csv.');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);

    try {
      const result = await parseAndValidateUserExcel(file, existingUsers);
      setParseResult(result);
      setActiveStep('preview');
    } catch (err) {
      setParseError(err.message || 'Gagal memproses berkas Excel.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadUserImportTemplate();
    } catch (err) {
      notify(`Gagal mengunduh template Excel: ${err.message}`, { variant: 'warning' });
    }
  };

  const handleExecuteImport = async () => {
    if (!parseResult) return;

    setIsSubmitting(true);

    try {
      // Siapkan item yang akan diimpor berdasarkan kebijakan duplikat
      let accountsToImport = [];

      if (duplicateHandling === 'update') {
        // Impor semua yang valid (baik yang baru maupun yang sudah ada)
        accountsToImport = parseResult.validRows;
      } else {
        // Hanya impor yang baru (lewati yang sudah terdaftar)
        accountsToImport = parseResult.validRows.filter(r => !r.isExisting);
      }

      if (accountsToImport.length === 0) {
        notify('Tidak ada akun valid yang dapat diimpor.', { variant: 'warning' });
        setIsSubmitting(false);
        return;
      }

      if (onImportSuccess) {
        await onImportSuccess(accountsToImport, {
          totalImported: accountsToImport.length,
          duplicateHandling,
          fileName: selectedFile?.name
        });
      }

      handleClose();
    } catch (err) {
      notify(`Terjadi kesalahan saat mengimpor akun: ${err.message}`, { variant: 'warning' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter baris yang ditampilkan di tabel pratinjau
  const getFilteredRows = () => {
    if (!parseResult) return [];
    const all = [...parseResult.validRows, ...parseResult.invalidRows].sort((a, b) => a.rowNumber - b.rowNumber);

    if (filterTab === 'valid') {
      return all.filter(r => r.isValid && !r.isExisting);
    }
    if (filterTab === 'duplicate') {
      return all.filter(r => r.isValid && r.isExisting);
    }
    if (filterTab === 'invalid') {
      return all.filter(r => !r.isValid);
    }
    return all;
  };

  const filteredDisplayRows = getFilteredRows();

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'superadmin':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: 'Super Admin' };
      case 'admin':
        return { bg: '#FEFCE8', text: '#B45309', border: '#FEF08A', label: 'Admin Akademik' };
      case 'penguji':
        return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', label: 'Dewan Penguji' };
      case 'koorprodi':
        return { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4', label: 'Koorprodi' };
      case 'dosen':
        return { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', label: 'Dosen' };
      case 'mahasiswa':
        return { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD', label: 'Mahasiswa' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', label: role || 'Unknown' };
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', margin: '-10px 0 0 0' }}>
        {/* Header Modal Custom */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-lg)', backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
                Import Akun Pengguna via Excel (.xlsx)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Pendaftaran massal akun Mahasiswa, Dosen, Penguji, Koorprodi, dan Tendik FEB UTM.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: UPLOAD & TEMPLATE */}
        {activeStep === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Download Template Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', backgroundColor: '#E0F2FE', borderRadius: 'var(--radius-md)', color: '#0369A1' }}>
                  <Download size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#0F172A' }}>
                    Unduh Format Template Resmi
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                    Gunakan template terstandarisasi untuk menghindari kesalahan nama kolom dan enum sistem.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#0284C7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Download size={15} /> Unduh Template Excel (.xlsx)
              </button>
            </div>

            {/* Error Banner jika ada */}
            {parseError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-lg)', color: '#DC2626', fontSize: '13px' }}>
                <XCircle size={18} style={{ flexShrink: 0 }} />
                <span>{parseError}</span>
              </div>
            )}

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragOver ? '2px dashed #2563EB' : '2px dashed #CBD5E1',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 24px',
                textAlign: 'center',
                backgroundColor: isDragOver ? '#EFF6FF' : '#FAFAFA',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB'
                }}
              >
                {isParsing ? (
                  <RefreshCw size={26} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <UploadCloud size={28} />
                )}
              </div>

              <div>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#1E293B' }}>
                  {isParsing ? 'Sedang Memvalidasi Berkas Excel...' : 'Tarik & Lepaskan Berkas Excel di Sini'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                  atau <span style={{ color: '#2563EB', fontWeight: '600' }}>Pilih berkas dari komputer</span> (Maks. 15 MB)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: '#E2E8F0', color: '#475569' }}>
                  .XLSX
                </span>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: '#E2E8F0', color: '#475569' }}>
                  .XLS
                </span>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: '#E2E8F0', color: '#475569' }}>
                  .CSV
                </span>
              </div>
            </div>

            {/* Panduan Ketentuan Kolom */}
            <div style={{ padding: '14px', borderRadius: 'var(--radius-lg)', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Info size={16} color="#475569" />
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                  Ketentuan Kolom Template Excel:
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
                <li><strong>Nomor_Induk:</strong> NIM (12 digit angka) atau NIP (18 digit angka) sebagai identitas unik utama.</li>
                <li><strong>Nama_Lengkap:</strong> Nama resmi beserta gelar lengkap untuk dosen dan pejabat.</li>
                <li><strong>Email:</strong> Alamat email institusi (@student.trunojoyo.ac.id atau @feb.trunojoyo.ac.id).</li>
                <li><strong>Peran:</strong> Wajib salah satu dari: <code style={{ color: '#1D4ED8' }}>mahasiswa</code>, <code style={{ color: '#1D4ED8' }}>dosen</code>, <code style={{ color: '#1D4ED8' }}>penguji</code>, <code style={{ color: '#1D4ED8' }}>koorprodi</code>, <code style={{ color: '#1D4ED8' }}>admin</code>, <code style={{ color: '#1D4ED8' }}>superadmin</code>.</li>
                <li><strong>Jenjang:</strong> Pilih antara <code style={{ color: '#1D4ED8' }}>D3</code>, <code style={{ color: '#1D4ED8' }}>S1</code>, <code style={{ color: '#1D4ED8' }}>S2</code>, atau <code style={{ color: '#1D4ED8' }}>S3</code>.</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & VALIDATION */}
        {activeStep === 'preview' && parseResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* File Info Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#F1F5F9', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={16} color="#059669" />
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1E293B' }}>
                  {selectedFile?.name}
                </span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  ({(selectedFile?.size / 1024).toFixed(1)} KB)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveStep('upload')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  color: '#2563EB',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={13} /> Ganti Berkas
              </button>
            </div>

            {/* KPI Cards Ringkasan Validasi */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Total Baris</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1E293B' }}>{parseResult.summary.total}</span>
              </div>

              <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#166534', display: 'block' }}>Valid & Baru</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#15803D' }}>{parseResult.summary.valid}</span>
              </div>

              <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', backgroundColor: '#FEFCE8', border: '1px solid #FEF08A', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#854D0E', display: 'block' }}>Sudah Terdaftar</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#B45309' }}>{parseResult.summary.duplicate}</span>
              </div>

              <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#991B1B', display: 'block' }}>Format Error</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#DC2626' }}>{parseResult.summary.invalid}</span>
              </div>
            </div>

            {/* Opsi Kebijakan Duplikat jika ada akun yang sudah ada */}
            {parseResult.summary.duplicate > 0 && (
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-lg)', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={15} color="#D97706" />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400E' }}>
                    Tindakan untuk {parseResult.summary.duplicate} Akun yang Sudah Terdaftar Sebelumnya:
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginLeft: '21px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#78350F', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="duplicateOption"
                      value="update"
                      checked={duplicateHandling === 'update'}
                      onChange={() => setDuplicateHandling('update')}
                    />
                    <strong>Perbarui Data Akun</strong> (Perbarui nama, prodi, dan jenjang sesuai Excel)
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#78350F', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="duplicateOption"
                      value="skip"
                      checked={duplicateHandling === 'skip'}
                      onChange={() => setDuplicateHandling('skip')}
                    />
                    <strong>Lewati Baris Duplikat</strong> (Hanya simpan akun yang benar-benar baru)
                  </label>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: filterTab === 'all' ? 'bold' : 'normal',
                  color: filterTab === 'all' ? '#1D4ED8' : '#64748B',
                  borderBottom: filterTab === 'all' ? '2px solid #1D4ED8' : 'none',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer'
                }}
              >
                Semua Baris ({parseResult.summary.total})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('valid')}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: filterTab === 'valid' ? 'bold' : 'normal',
                  color: filterTab === 'valid' ? '#15803D' : '#64748B',
                  borderBottom: filterTab === 'valid' ? '2px solid #15803D' : 'none',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer'
                }}
              >
                Siap Diimpor ({parseResult.summary.valid})
              </button>
              {parseResult.summary.duplicate > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterTab('duplicate')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: filterTab === 'duplicate' ? 'bold' : 'normal',
                    color: filterTab === 'duplicate' ? '#B45309' : '#64748B',
                    borderBottom: filterTab === 'duplicate' ? '2px solid #B45309' : 'none',
                    background: 'none',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Sudah Terdaftar ({parseResult.summary.duplicate})
                </button>
              )}
              {parseResult.summary.invalid > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterTab('invalid')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: filterTab === 'invalid' ? 'bold' : 'normal',
                    color: filterTab === 'invalid' ? '#DC2626' : '#64748B',
                    borderBottom: filterTab === 'invalid' ? '2px solid #DC2626' : 'none',
                    background: 'none',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Format Error ({parseResult.summary.invalid})
                </button>
              )}
            </div>

            {/* Tabel Pratinjau Interaktif */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-lg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#F8FAFC', position: 'sticky', top: 0, zIndex: 1, borderBottom: '1px solid #E2E8F0' }}>
                  <tr>
                    <th style={{ padding: '8px 10px', color: '#475569', fontWeight: '600' }}>Baris</th>
                    <th style={{ padding: '8px 10px', color: '#475569', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '8px 10px', color: '#475569', fontWeight: '600' }}>Nomor Induk</th>
                    <th style={{ padding: '8px 10px', color: '#475569', fontWeight: '600' }}>Nama Lengkap</th>
                    <th style={{ padding: '8px 10px', color: '#475569', fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '8px 10px', color: '#475569', fontWeight: '600' }}>Peran</th>
                    <th style={{ padding: '8px 10px', color: '#475569', fontWeight: '600' }}>Jenjang / Prodi</th>
                    <th style={{ padding: '8px 10px', color: '#475569', fontWeight: '600' }}>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDisplayRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                        Tidak ada data yang sesuai dengan filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredDisplayRows.map((item, idx) => {
                      const roleStyle = getRoleBadgeStyle(item.role);
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            backgroundColor: !item.isValid ? '#FEF2F2' : item.isExisting ? '#FFFBEB' : '#ffffff'
                          }}
                        >
                          <td style={{ padding: '8px 10px', color: '#64748B' }}>#{item.rowNumber}</td>
                          <td style={{ padding: '8px 10px' }}>
                            {!item.isValid ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#DC2626', fontWeight: 'bold', fontSize: '11px' }}>
                                <XCircle size={13} /> Gagal
                              </span>
                            ) : item.isExisting ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#B45309', fontWeight: 'bold', fontSize: '11px' }}>
                                <AlertTriangle size={13} /> Terdaftar
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#16A34A', fontWeight: 'bold', fontSize: '11px' }}>
                                <CheckCircle2 size={13} /> Siap
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: '600' }}>
                            {item.nomorInduk || <span style={{ color: '#DC2626' }}>Kosong</span>}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: '500' }}>
                            {item.nama || <span style={{ color: '#DC2626' }}>Kosong</span>}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#475569' }}>
                            {item.email || <span style={{ color: '#DC2626' }}>Kosong</span>}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: roleStyle.bg,
                                color: roleStyle.text,
                                border: `1px solid ${roleStyle.border}`
                              }}
                            >
                              {roleStyle.label}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', color: '#475569' }}>
                            {item.jenjang} — {item.prodi}
                          </td>
                          <td style={{ padding: '8px 10px', fontSize: '11px' }}>
                            {!item.isValid ? (
                              <span style={{ color: '#DC2626' }}>{item.errors.join(', ')}</span>
                            ) : item.isExisting ? (
                              <span style={{ color: '#B45309' }}>
                                {duplicateHandling === 'update' ? 'Akan diperbarui' : 'Akan dilewati'}
                              </span>
                            ) : (
                              <span style={{ color: '#16A34A' }}>Data baru valid</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Ganti Berkas
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#ffffff',
                    color: '#64748B',
                    border: '1px solid #CBD5E1',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isSubmitting || (duplicateHandling === 'update' ? parseResult.validRows.length === 0 : parseResult.summary.valid === 0)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 20px',
                    backgroundColor: isSubmitting ? '#93C5FD' : '#1D4ED8',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Memproses Impor...
                    </>
                  ) : (
                    <>
                      <UserCheck size={16} />
                      Impor {duplicateHandling === 'update' ? parseResult.validRows.length : parseResult.summary.valid} Akun Pengguna
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
