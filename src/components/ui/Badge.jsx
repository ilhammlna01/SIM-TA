import React from 'react';

/**
 * Badge Component
 * Label penanda kategori, peran, atau atribut umum.
 */
export default function Badge({
  children,
  variant = 'neutral',
  dot = false,
  className = ''
}) {
  return (
    <span className={`ui-badge ui-badge--${variant} ${className}`.trim()}>
      {dot && (
        <span 
          style={{
            width: '6px',
            height: '6px',
            borderRadius: 'var(--radius-circle)',
            backgroundColor: 'currentColor'
          }} 
          aria-hidden="true" 
        />
      )}
      <span>{children}</span>
    </span>
  );
}
