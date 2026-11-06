import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Reusable Breadcrumb Component
 * Mengikuti pola terstandarisasi untuk navigasi hierarki halaman.
 * Struktur: items = [{ label: 'Portal', onClick: () => {} }, { label: 'Tugas Akhir' }]
 * Item terakhir ditandai dengan aria-current="page" dan visual tebal/jelas.
 */
export default function Breadcrumb({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="header-breadcrumb" aria-label="Breadcrumb">
      <ol style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)', listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const label = typeof item === 'string' ? item : item.label;
          const onClick = typeof item === 'object' ? item.onClick : undefined;
          const href = typeof item === 'object' ? item.href : undefined;

          return (
            <li key={index} className="breadcrumb-crumb" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
              {index > 0 && (
                <ChevronRight 
                  size={12} 
                  strokeWidth={2}
                  style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} 
                  aria-hidden="true" 
                />
              )}
              {isLast ? (
                <span 
                  className="breadcrumb-crumb active"
                  aria-current="page"
                >
                  {label}
                </span>
              ) : onClick ? (
                <button
                  type="button"
                  onClick={onClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    font: 'inherit',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primitive-navy-900)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                >
                  {label}
                </button>
              ) : href ? (
                <a
                  href={href}
                  style={{
                    color: 'var(--color-text-secondary)',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primitive-navy-900)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                >
                  {label}
                </a>
              ) : (
                <span>{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
