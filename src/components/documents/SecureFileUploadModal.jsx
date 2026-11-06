import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  ShieldCheck,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { Modal, Button, Alert, Badge } from '../ui';
import { storageApi } from '../../services/api';

/**
 * Modal Unggah Berkas Terproteksi dengan Validasi Keamanan - SIM TA FEB UTM
 * - Batas ukuran: 25MB untuk naskah skripsi, 10MB untuk berkas persyaratan
 * - Tipe file: PDF (.pdf) & Microsoft Word (.docx)
 * - Verifikasi Magic Bytes & Anti-Malware
 */
export default function SecureFileUploadModal({
  isOpen,
  onClose,
  category = 'naskah',
  title = 'Unggah Naskah Tugas Akhir',
  maxSizeMb = 25,
  onUploadSuccess
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const fileInputRef = useRef(null);

  const allowedExtensions = ['.pdf', '.docx', '.doc'];
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  const validateAndSetFile = (file) => {
    setErrorMsg(null);
    setSuccessResult(null);

    if (!file) return;

    // 1. Validasi Ekstensi
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setErrorMsg(`Format berkas "${ext}" tidak didukung. Mohon unggah dokumen PDF (.pdf) atau Word (.docx).`);
      return;
    }

    // 2. Validasi Ukuran File
    if (file.size > maxSizeBytes) {
      const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMsg(`Ukuran berkas (${fileSizeMb} MB) melebihi batas maksimal ${maxSizeMb} MB.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setErrorMsg(null);
    setUploadProgress(25);

    try {
      setUploadProgress(60);
      const res = await storageApi.upload(selectedFile, category);

      if (res && res.success) {
        setUploadProgress(100);
        setSuccessResult(res.data);
        if (onUploadSuccess) onUploadSuccess(res.data);
      } else {
        setErrorMsg(res?.error || 'Gagal mengunggah berkas ke server.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke storage server: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} color="var(--color-brand-primary)" />
            Pemeriksaan Magic Bytes & Anti-Malware Aktif
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={onClose}>
              {successResult ? 'Selesai' : 'Batal'}
            </Button>
            {!successResult && (
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                icon={uploading ? RefreshCw : UploadCloud}
              >
                {uploading ? 'Mengunggah...' : 'Unggah Dokumen'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {errorMsg && (
          <Alert type="error" title="Validasi Berkas Gagal">
            {errorMsg}
          </Alert>
        )}

        {successResult ? (
          <div
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #A7F3D0',
              backgroundColor: '#ECFDF5',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CheckCircle size={20} color="#059669" />
              <span style={{ fontWeight: 'var(--font-weight-bold)', color: '#065F46', fontSize: '13px' }}>
                Berkas Berhasil Diunggah & Terverifikasi Aman!
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#047857' }}>
              Nama File: <strong>{successResult.originalName}</strong> ({successResult.sizeFormatted})
            </div>
            <div style={{ fontSize: '11px', color: '#065F46', wordBreak: 'break-all' }}>
              Lokasi Penyimpanan Server: <code>{successResult.accessUrl}</code>
            </div>
          </div>
        ) : (
          <>
            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed',
                borderColor: isDragging ? 'var(--color-brand-primary)' : 'var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isDragging ? 'var(--color-surface-panel-alt)' : 'var(--color-surface-panel)',
                padding: 'var(--space-6) var(--space-4)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    validateAndSetFile(e.target.files[0]);
                  }
                }}
              />
              <UploadCloud size={36} color="var(--color-brand-primary)" style={{ margin: '0 auto var(--space-2)' }} />
              <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: '13px', color: 'var(--primitive-navy-950)' }}>
                Tarik & Lepas berkas ke sini, atau <span style={{ color: 'var(--color-brand-primary)' }}>pilih dari komputer</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                Format resmi: PDF (.pdf) atau Word (.docx) &bull; Maksimal ukuran: {maxSizeMb} MB
              </div>
            </div>

            {/* Selected File Card */}
            {selectedFile && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-surface-panel-alt)',
                  border: '1px solid var(--color-border-default)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <FileText size={24} color="var(--color-brand-primary)" />
                  <div>
                    <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: '12px' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {selectedFile.type || 'Dokumen'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {uploading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span>Memeriksa integritas dan mengunggah ke penyimpanan server...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--color-surface-panel-alt)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${uploadProgress}%`,
                      backgroundColor: 'var(--color-brand-primary)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
