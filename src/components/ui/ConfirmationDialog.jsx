import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, AlertOctagon, Info } from 'lucide-react';

/**
 * ConfirmationDialog Component
 * Dialog konfirmasi tindakan kritis (penolakan naskah, pembatalan jadwal, dsb.)
 */
export default function ConfirmationDialog({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'warning',
  isLoading = false
}) {
  const icons = {
    warning: { icon: AlertTriangle, class: 'ui-confirm-icon--warning' },
    danger: { icon: AlertOctagon, class: 'ui-confirm-icon--danger' },
    info: { icon: Info, class: 'ui-confirm-icon--info' }
  };

  const current = icons[variant] || icons.warning;
  const Icon = current.icon;

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={isLoading}>
        {cancelLabel}
      </Button>
      <Button 
        variant={variant === 'danger' ? 'danger' : 'primary'} 
        onClick={onConfirm}
        isLoading={isLoading}
      >
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={footer}
    >
      <div className="ui-confirm-content">
        <div className={`ui-confirm-icon-wrapper ${current.class}`} aria-hidden="true">
          <Icon size={20} />
        </div>
        <div style={{ flex: 1, fontSize: 'var(--type-body-size)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-normal)' }}>
          {message}
        </div>
      </div>
    </Modal>
  );
}
