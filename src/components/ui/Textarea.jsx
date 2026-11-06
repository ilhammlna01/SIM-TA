import React from 'react';

/**
 * Textarea Component
 * Input teks multibaris standar dengan indikator batas karakter opsional.
 */
export default function Textarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  readOnly = false,
  error = false,
  maxLength,
  showCharCount = false,
  className = '',
  ...props
}) {
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div style={{ width: '100%' }}>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={readOnly}
        className={`ui-textarea ${error ? 'is-error' : ''} ${className}`.trim()}
        {...props}
      />
      {showCharCount && maxLength && (
        <div style={{ textAlign: 'right', fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          {currentLength} / {maxLength}
        </div>
      )}
    </div>
  );
}
