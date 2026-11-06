import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, X } from 'lucide-react';

/**
 * Alert Component
 * Spanduk notifikasi penting status atau peringatan administratif.
 *
 * API kanonik: `variant` (info | success | warning | danger), `title`, `children`, `onClose`.
 * Alias kompatibilitas (agar seluruh pemanggilan lama tetap tampil benar):
 * - `type`      -> alias `variant` (nilai `error` dipetakan ke `danger`).
 * - `message`   -> alias `children`.
 * - `onDismiss` -> alias `onClose`.
 */
export default function Alert({
  variant,
  type,
  title,
  children,
  message,
  onClose,
  onDismiss,
  actions,
  className = ''
}) {
  const resolvedVariant = variant || (type === 'error' ? 'danger' : type) || 'info';
  const body = children ?? message;
  const handleClose = onClose || onDismiss;

  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertOctagon
  };

  const Icon = icons[resolvedVariant] || Info;

  return (
    <div className={`ui-alert ui-alert--${resolvedVariant} ${className}`.trim()} role="alert">
      <span className="ui-alert-icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div className="ui-alert-content">
        {title && <div className="ui-alert-title">{title}</div>}
        {body && <div className="ui-alert-message">{body}</div>}
        {actions && (
          <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-2)' }}>
            {actions}
          </div>
        )}
      </div>
      {handleClose && (
        <button
          type="button"
          onClick={handleClose}
          className="ui-alert-close"
          aria-label="Tutup pemberitahuan"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
