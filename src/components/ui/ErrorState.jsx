import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import Button from './Button';

/**
 * ErrorState Component
 * Menampilkan pesan kegagalan pengambilan data atau kesalahan sistem beserta opsi coba lagi.
 */
export default function ErrorState({
  title = 'Gagal Memuat Data',
  message = 'Terjadi kendala saat menghubungi server akademik. Silakan periksa koneksi Anda dan coba lagi.',
  onRetry,
  className = ''
}) {
  return (
    <div className={`ui-error-state ${className}`.trim()} role="alert">
      <div style={{ color: 'var(--primitive-red-700)', marginBottom: 'var(--space-2)' }}>
        <AlertOctagon size={32} />
      </div>
      <h3 style={{ fontSize: 'var(--type-section-title-size)', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-red-900)', margin: '0 0 var(--space-1)' }}>
        {title}
      </h3>
      <p style={{ fontSize: 'var(--type-caption-size)', color: 'var(--primitive-red-700)', maxWidth: '420px', margin: '0 0 var(--space-4)', lineHeight: 'var(--line-height-normal)' }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry} icon={RotateCcw}>
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
