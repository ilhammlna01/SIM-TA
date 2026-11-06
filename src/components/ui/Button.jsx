import React from 'react';

/**
 * Button Component
 * Varian: primary, secondary, outline, danger, success, ghost
 * Ukuran: sm, md, lg
 * Status: idle, loading, disabled
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  className = '',
  onClick,
  ...props
}) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      className={`ui-btn ui-btn--${variant} ui-btn--${size} ${className}`.trim()}
      disabled={isDisabled}
      aria-busy={isLoading ? 'true' : undefined}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <span className="ui-btn-spinner" aria-hidden="true" />
      ) : (
        Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} aria-hidden="true" />
      )}
      <span>{children}</span>
      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} aria-hidden="true" />
      )}
    </button>
  );
}

/**
 * IconButton Component
 * Khusus tombol dengan ikon tunggal dengan aria-label yang dapat diakses
 */
export function IconButton({
  icon: Icon,
  label,
  size = 'md',
  bordered = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  return (
    <button
      type="button"
      className={`ui-icon-btn ui-icon-btn--${size} ${bordered ? 'ui-icon-btn--bordered' : ''} ${className}`.trim()}
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
      {...props}
    >
      <Icon size={size === 'sm' ? 15 : size === 'lg' ? 20 : 17} aria-hidden="true" />
    </button>
  );
}
