import React from 'react';

/**
 * Switch Component
 * Kontrol sakelar on/off untuk konfigurasi atau aktivasi mode administratif.
 */
export default function Switch({
  id,
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  className = '',
  ...props
}) {
  return (
    <label 
      className={`ui-switch-wrapper ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
      htmlFor={id}
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="ui-switch-input"
        {...props}
      />
      <div className="ui-switch-track">
        <div className="ui-switch-thumb" />
      </div>
      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && <span style={{ fontSize: 'var(--type-body-size)', color: 'var(--color-text-primary)' }}>{label}</span>}
          {description && (
            <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)' }}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}
