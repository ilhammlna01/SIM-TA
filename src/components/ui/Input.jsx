import React from 'react';
import { X } from 'lucide-react';

/**
 * Input Component
 * Mendukung icon prefix/suffix, tombol clear, status error, dan disabled.
 */
export default function Input({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  error = false,
  prefixIcon: PrefixIcon,
  suffixIcon: SuffixIcon,
  onClear,
  className = '',
  ...props
}) {
  const hasPrefix = Boolean(PrefixIcon);
  const hasSuffix = Boolean(SuffixIcon || (onClear && value));

  return (
    <div className="ui-input-wrapper">
      {PrefixIcon && (
        <span className="ui-input-icon-prefix" aria-hidden="true">
          <PrefixIcon size={16} />
        </span>
      )}

      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={`ui-input ${hasPrefix ? 'has-prefix' : ''} ${hasSuffix ? 'has-suffix' : ''} ${error ? 'is-error' : ''} ${className}`.trim()}
        {...props}
      />

      {onClear && value && !disabled && (
        <button
          type="button"
          onClick={onClear}
          className="ui-input-clear-btn"
          aria-label="Hapus input"
        >
          <X size={14} />
        </button>
      )}

      {SuffixIcon && !onClear && (
        <span className="ui-input-icon-suffix" aria-hidden="true">
          <SuffixIcon size={16} />
        </span>
      )}
    </div>
  );
}
