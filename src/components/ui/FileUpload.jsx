import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * FileUpload Component
 * Mendukung 5 status resmi:
 * 1. idle: Menunggu pemilihan berkas
 * 2. selected: Berkas siap diunggah
 * 3. uploading: Simulasi proses unggah dengan progress bar
 * 4. uploaded: Berhasil diunggah dengan opsi preview/ganti/hapus
 * 5. error: Gagal validasi atau unggah dengan pesan kesalahan
 */
export default function FileUpload({
  accept = '.pdf',
  maxSizeMB = 10,
  initialState = 'idle',
  onUploadComplete,
  className = ''
}) {
  const [state, setState] = useState(initialState); // 'idle' | 'selected' | 'uploading' | 'uploaded' | 'error'
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validasi ukuran
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setFile(selectedFile);
      setErrorMessage(`Ukuran berkas (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimum ${maxSizeMB} MB.`);
      setState('error');
      return;
    }

    setFile(selectedFile);
    setState('selected');
    setErrorMessage('');
  };

  const handleStartUpload = () => {
    setState('uploading');
    setProgress(0);

    // Simulasi progres pengunggahan
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            setProgress(100);
            setState('uploaded');
            if (onUploadComplete) onUploadComplete(file);
          }, 300);
          return 90;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleReset = () => {
    setState('idle');
    setFile(null);
    setProgress(0);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className={`ui-upload-wrapper ${className}`.trim()} style={{ width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="file-upload-input"
      />

      {/* 1. STATE: IDLE */}
      {state === 'idle' && (
        <div 
          className="ui-upload-dropzone"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        >
          <UploadCloud size={32} style={{ color: 'var(--primitive-navy-800)' }} aria-hidden="true" />
          <div style={{ fontSize: 'var(--type-table-size)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
            Klik atau seret berkas ke area ini
          </div>
          <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)' }}>
            Format didukung: <strong>{accept.toUpperCase()}</strong> (Maks. {maxSizeMB} MB)
          </div>
        </div>
      )}

      {/* 2. STATE: SELECTED */}
      {state === 'selected' && file && (
        <div className="ui-upload-file-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
            <FileText size={28} style={{ color: 'var(--primitive-navy-800)', flexShrink: 0 }} aria-hidden="true" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 'var(--type-table-size)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {file.name}
              </div>
              <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)' }}>
                {formatSize(file.size)} — Siap diunggah
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" size="sm" onClick={handleReset}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleStartUpload}>
              Mulai Unggah
            </Button>
          </div>
        </div>
      )}

      {/* 3. STATE: UPLOADING SIMULATION */}
      {state === 'uploading' && (
        <div className="ui-upload-file-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <RefreshCw size={16} className="ui-btn-spinner" style={{ color: 'var(--primitive-navy-800)' }} />
              <span style={{ fontSize: 'var(--type-table-size)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                Mengunggah berkas...
              </span>
            </div>
            <span style={{ fontSize: 'var(--type-caption-size)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}>
              {progress}%
            </span>
          </div>
          <div className="ui-upload-progress-bar-bg">
            <div className="ui-upload-progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* 4. STATE: UPLOADED */}
      {state === 'uploaded' && (
        <div className="ui-upload-file-card" style={{ borderColor: 'var(--primitive-green-200)', backgroundColor: 'var(--primitive-green-50)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
            <CheckCircle2 size={24} style={{ color: 'var(--primitive-green-700)', flexShrink: 0 }} aria-hidden="true" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 'var(--type-table-size)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-green-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {file ? file.name : 'berkas_terverifikasi.pdf'}
              </div>
              <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--primitive-green-700)' }}>
                {file ? formatSize(file.size) : '1.8 MB'} — Berhasil diunggah & terverifikasi
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-1-5)' }}>
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Ganti
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* 5. STATE: ERROR */}
      {state === 'error' && (
        <div className="ui-upload-file-card" style={{ borderColor: 'var(--primitive-red-200)', backgroundColor: 'var(--primitive-red-50)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <AlertCircle size={24} style={{ color: 'var(--primitive-red-700)', flexShrink: 0 }} aria-hidden="true" />
            <div>
              <div style={{ fontSize: 'var(--type-table-size)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-red-900)' }}>
                Pengunggahan Gagal
              </div>
              <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--primitive-red-700)' }}>
                {errorMessage || 'Berkas tidak memenuhi kriteria validasi akademik.'}
              </div>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={handleReset}>
            Coba Lagi
          </Button>
        </div>
      )}
    </div>
  );
}
