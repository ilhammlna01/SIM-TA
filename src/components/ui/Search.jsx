import React from 'react';
import { Search as SearchIcon, X } from 'lucide-react';

/**
 * Search Component
 * Input pencarian filter tabel dan data administrasi.
 */
export default function Search({
  value,
  onChange,
  onSearch,
  placeholder = 'Cari data...',
  disabled = false,
  className = '',
  ...props
}) {
  const handleClear = () => {
    if (onChange) onChange({ target: { value: '' } });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={`ui-input-wrapper ${className}`.trim()} style={{ maxWidth: '320px' }}>
      <span className="ui-input-icon-prefix" aria-hidden="true">
        <SearchIcon size={15} />
      </span>
      <input
        type="search"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="ui-input has-prefix has-suffix"
        aria-label={placeholder}
        {...props}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="ui-input-clear-btn"
          aria-label="Bersihkan pencarian"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
