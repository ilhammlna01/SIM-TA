import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Drawer Component
 * Panel geser dari sisi samping untuk inspeksi detail dossier, berkas verifikasi, atau formulir panjang.
 */
export default function Drawer({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className = ''
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`ui-drawer-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`ui-drawer-panel ${isOpen ? 'is-open' : ''} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ui-drawer-title"
      >
        <div className="ui-drawer-header">
          <div>
            <h2 id="ui-drawer-title" style={{ fontSize: 'var(--type-section-title-size)', fontWeight: 'var(--font-weight-bold)', margin: 0, color: 'var(--primitive-navy-950)' }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            className="ui-icon-btn ui-icon-btn--sm"
            onClick={onClose}
            aria-label="Tutup panel detail"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ui-drawer-body">
          {children}
        </div>

        {footer && (
          <div className="ui-drawer-footer">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}
