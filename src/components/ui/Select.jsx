import React from 'react';

/**
 * Select Component
 * Kontrol dropdown seleksi institusional standar akademik.
 */
export default function Select({
  id,
  value,
  onChange,
  options = [],
  placeholder,
  disabled = false,
  error = false,
  children,
  className = '',
  ...props
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`ui-select ${error ? 'is-error' : ''} ${className}`.trim()}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.length > 0
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );
}
