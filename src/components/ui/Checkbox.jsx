import React, { useEffect, useRef } from 'react';

/**
 * Checkbox Component
 * Mendukung status checked, indeterminate (mis. pilih semua baris tabel), dan disabled.
 */
export default function Checkbox({
  id,
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  label,
  description,
  className = '',
  ...props
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label 
      className={`ui-checkbox-label ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
      htmlFor={id}
    >
      <input
        ref={inputRef}
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="ui-checkbox-input"
        {...props}
      />
      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && <span>{label}</span>}
          {description && (
            <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}
