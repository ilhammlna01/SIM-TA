import React from 'react';

/**
 * LoadingState Component
 * Status pemuatan data menggunakan animasi skeleton atau spinner institusional.
 */
export default function LoadingState({
  variant = 'spinner', // 'spinner' | 'skeleton'
  text = 'Memuat data akademik...',
  lines = 3,
  className = ''
}) {
  if (variant === 'skeleton') {
    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2-5)', width: '100%', padding: 'var(--space-4)' }} role="status" aria-label={text}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="ui-skeleton"
            style={{
              height: i === 0 ? '20px' : '14px',
              width: i === 0 ? '40%' : `${90 - i * 15}%`
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        gap: 'var(--space-3)'
      }}
      role="status"
    >
      <div className="ui-btn-spinner" style={{ width: '24px', height: '24px', color: 'var(--color-brand-primary)' }} />
      <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
        {text}
      </span>
    </div>
  );
}
