import React from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';

/**
 * AcademicPageLoading
 * Fallback loading transisi halus saat modul React.lazy dimuat secara dinamis.
 * Didesain dengan estetika institusional formal FEB UTM.
 */
export default function AcademicPageLoading({
  message = 'Memuat Modul Akademik...',
  subtext = 'Sistem Informasi Manajemen Tugas Akhir FEB UTM'
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '380px',
        width: '100%',
        padding: '32px 16px',
        color: '#1e293b',
        fontFamily: 'var(--font-family-sans, sans-serif)'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#f0f4f8',
          border: '2px solid #D97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#D97706',
          marginBottom: '16px',
          position: 'relative',
          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)'
        }}
      >
        <GraduationCap size={28} />
        <div
          style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: '#0B192C',
            animation: 'spin 1s linear infinite'
          }}
        />
      </div>

      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0B192C', marginBottom: '4px' }}>
        {message}
      </div>

      <div style={{ fontSize: '11.5px', color: '#627D98', maxWidth: '300px', textAlign: 'center', lineHeight: 1.4 }}>
        {subtext}
      </div>

      {/* Shimmer loading bar */}
      <div
        style={{
          width: '160px',
          height: '3px',
          backgroundColor: '#e2e8f0',
          borderRadius: '999px',
          marginTop: '16px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '40%',
            backgroundColor: '#D97706',
            borderRadius: '999px',
            animation: 'shimmer 1.4s ease-in-out infinite'
          }}
        />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
