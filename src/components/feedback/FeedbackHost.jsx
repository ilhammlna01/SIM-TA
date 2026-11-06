import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';
import ConfirmationDialog from '../ui/ConfirmationDialog';
import { registerFeedback } from './feedbackBus';

const TOAST_ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertOctagon,
  info: Info
};

let toastSeq = 0;

/**
 * FeedbackHost
 * Komponen tunggal di akar aplikasi yang menyediakan:
 * 1. Tumpukan toast (notifikasi non-blokir) — menggantikan `alert()`.
 * 2. Dialog konfirmasi terpusat — menggantikan `window.confirm()`.
 *
 * Komponen ini mendaftarkan handler ke `feedbackBus` sehingga kode mana pun
 * dapat memanggil `notify()` / `confirmDialog()` tanpa prop drilling.
 */
export default function FeedbackHost() {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const resolveRef = useRef(null);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (message, options = {}) => {
      const id = `toast-${++toastSeq}`;
      const duration = options.duration ?? 4500;
      const toast = {
        id,
        message,
        title: options.title,
        variant: options.variant || 'info'
      };
      setToasts((prev) => [...prev, toast]);
      if (duration > 0) {
        setTimeout(() => dismissToast(id), duration);
      }
      return id;
    },
    [dismissToast]
  );

  const requestConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      // Jika sudah ada permintaan konfirmasi yang tertunda, selesaikan
      // permintaan sebelumnya dengan "batal" agar promise-nya tidak
      // menggantung, lalu tampilkan permintaan terbaru.
      if (resolveRef.current) {
        resolveRef.current(false);
      }
      resolveRef.current = resolve;
      setConfirmState({
        title: options.title || 'Konfirmasi Tindakan',
        message: options.message,
        confirmLabel: options.confirmLabel || 'Ya, Lanjutkan',
        cancelLabel: options.cancelLabel || 'Batal',
        variant: options.variant || 'warning'
      });
    });
  }, []);

  const settleConfirm = useCallback((result) => {
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
    setConfirmState(null);
  }, []);

  useEffect(() => {
    registerFeedback({ notify: pushToast, confirm: requestConfirm });
  }, [pushToast, requestConfirm]);

  return (
    <>
      <div className="ui-toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => {
          const Icon = TOAST_ICONS[t.variant] || Info;
          return (
            <div key={t.id} className={`ui-toast ui-toast--${t.variant}`} role="status">
              <span className="ui-toast-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <div className="ui-toast-content">
                {t.title && <div className="ui-toast-title">{t.title}</div>}
                <div className="ui-toast-message">{t.message}</div>
              </div>
              <button
                type="button"
                className="ui-toast-close"
                onClick={() => dismissToast(t.id)}
                aria-label="Tutup notifikasi"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <ConfirmationDialog
        isOpen={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        variant={confirmState?.variant}
        onClose={() => settleConfirm(false)}
        onConfirm={() => settleConfirm(true)}
      />
    </>
  );
}
