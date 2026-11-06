import React from 'react';

/**
 * Radio Component
 * Pilihan eksklusif nilai tunggal.
 */
export default function Radio({
  id,
  name,
  value,
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
      className={`ui-radio-label ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
      htmlFor={id}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="ui-radio-input"
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

/**
 * RadioGroup Component
 * Wadah pengelompokan opsi radio dengan arah tata letak
 */
export function RadioGroup({
  name,
  value,
  onChange,
  options = [],
  direction = 'column',
  disabled = false,
  className = ''
}) {
  return (
    <div 
      role="radiogroup"
      style={{
        display: 'flex',
        flexDirection: direction,
        gap: direction === 'row' ? 'var(--space-4)' : 'var(--space-1)',
        flexWrap: 'wrap'
      }}
      className={className}
    >
      {options.map((opt) => (
        <Radio
          key={opt.value}
          id={`${name}-${opt.value}`}
          name={name}
          value={opt.value}
          checked={value === opt.value}
          onChange={() => onChange && onChange(opt.value)}
          disabled={disabled || opt.disabled}
          label={opt.label}
          description={opt.description}
        />
      ))}
    </div>
  );
}
