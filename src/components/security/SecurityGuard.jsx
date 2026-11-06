import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, FileWarning } from 'lucide-react';
import { Button, Alert, Badge } from '../ui';

/**
 * SecurityGuard Component
 * Melindungi antarmuka sensitif dari akses tidak sah (Unauthorized Access Control)
 * Memastikan mahasiswa tidak dapat melihat atau memanipulasi form penilaian dewan penguji
 */
export default function SecurityGuard({
  currentRole,
  requiredRoles = [],
  resourceName = 'Form Penilaian Dewan Penguji',
  onReturnDashboard,
  children
}) {
  const isAuthorized = requiredRoles.includes(currentRole);

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        padding: 'var(--space-6)',
        maxWidth: '800px',
        margin: '0 auto',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div
        style={{
          backgroundColor: '#FEF2F2',
          border: '2px solid #FCA5A5',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#EF4444',
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ShieldAlert size={32} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
              <Badge variant="navy" style={{ backgroundColor: '#991B1B', color: '#ffffff' }}>
                403 FORBIDDEN
              </Badge>
              <span style={{ fontSize: '12px', color: '#B91C1C', fontWeight: 'bold' }}>
                SECURITY & CONFIDENTIALITY VIOLATION BLOCKED
              </span>
            </div>

            <h3 style={{ margin: '0 0 var(--space-2)', color: '#991B1B', fontSize: '18px' }}>
              Akses Ditolak: Hak Akses Tidak Memenuhi Syarat
            </h3>

            <p style={{ color: '#7F1D1D', fontSize: '13.5px', lineHeight: 1.6, margin: '0 0 var(--space-4)' }}>
              Anda sedang masuk dengan peran <strong>{currentRole.toUpperCase()}</strong>. Sesuai dengan 
              <strong> Buku Pedoman Tugas Akhir Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura (2026)</strong>, 
              halaman <strong>{resourceName}</strong> bersifat rahasia akademik dan hanya dapat diakses oleh dewan penguji atau koordinator akademik yang berwenang.
            </p>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #FECACA',
                borderRadius: 'var(--radius-xs)',
                padding: 'var(--space-3)',
                fontSize: '12px',
                color: '#4B5563',
                marginBottom: 'var(--space-4)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 'bold', color: '#1F2937', marginBottom: '4px' }}>
                <Lock size={14} color="#EF4444" />
                Catatan Keamanan Sistem:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
                <li>Mahasiswa dilarang keras membuka, mengisi, atau merubah rubrik penilaian sidang ujian.</li>
                <li>Seluruh upaya navigasi ilegal dicatat ke dalam basis data <code>audit_log</code> FEB UTM.</li>
                <li>Hasil kelulusan resmi akan diumumkan secara transparan setelah penandatanganan Berita Acara.</li>
              </ul>
            </div>

            {onReturnDashboard && (
              <Button
                variant="primary"
                onClick={onReturnDashboard}
                icon={ArrowLeft}
                style={{ backgroundColor: '#DC2626', borderColor: '#B91C1C' }}
              >
                Kembali ke Dashboard Mahasiswa
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
