import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal Component
 * Dialog pop-up yang dapat diakses dengan berbagai ukuran.
 *
 * Aksesibilitas:
 * - Fokus dipindahkan ke kontrol pertama di dalam dialog saat dibuka.
 * - Fokus terperangkap di dalam dialog selama terbuka (focus trap).
 * - Fokus dikembalikan ke elemen pemicu saat dialog ditutup.
 * - ESC menutup dialog; id judul unik via useId (aman untuk multi-modal).
 */
export default function Modal({
  isOpen = false,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
  closeOnBackdrop = true
}) {
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const titleId = useId();

  // Simpan onClose terbaru di ref agar efek fokus tidak perlu bergantung pada
  // identitas onClose (yang biasanya berupa arrow function inline dan berubah
  // setiap render induk). Tanpa ini, setiap ketikan pada input terkendali di
  // dalam modal akan memicu ulang efek dan merebut kembali fokus.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    // Simpan elemen yang sedang fokus agar dapat dikembalikan saat ditutup.
    previouslyFocusedRef.current = document.activeElement;

    const node = dialogRef.current;
    const getFocusables = () =>
      node ? Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR)) : [];

    const initialFocusables = getFocusables();
    if (initialFocusables.length > 0) {
      initialFocusables[0].focus();
    } else if (node) {
      node.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onCloseRef.current) onCloseRef.current();
        return;
      }

      // Focus trap: fokus tidak boleh keluar dari dialog.
      if (e.key === 'Tab') {
        const focusables = getFocusables();
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        // Jika fokus berada di luar dialog (mis. body/kontainer yang diklik),
        // paksa kembali masuk ke siklus dialog.
        if (!node || !node.contains(active)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
          return;
        }
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      // Kembalikan fokus ke elemen pemicu.
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="ui-modal-backdrop"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`ui-modal-dialog ui-modal-dialog--${size} ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="ui-modal-header">
          <h2 id={titleId} className="ui-modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="ui-icon-btn ui-icon-btn--sm"
            onClick={onClose}
            aria-label="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ui-modal-body">
          {children}
        </div>

        {footer && (
          <div className="ui-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
