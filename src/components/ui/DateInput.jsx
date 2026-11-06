import React from 'react';
import { Calendar } from 'lucide-react';

/**
 * DateInput Component
 * Input tanggal standar akademik dilengkapi ikon kalender dan format batas.
 */
export default function DateInput({
  id,
  value,
  onChange,
  min,
  max,
  disabled = false,
  error = false,
  className = '',
  ...props
}) {
  return (
    <div className="ui-input-wrapper">
      <span className="ui-input-icon-prefix" aria-hidden="true">
        <Calendar size={16} />
      </span>
      <input
        id={id}
        type="date"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        className={`ui-input has-prefix ${error ? 'is-error' : ''} ${className}`.trim()}
        {...props}
      />
    </div>
  );
}
