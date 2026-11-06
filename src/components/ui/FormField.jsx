import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * FormField Component
 * Pembungkus kontrol formulir standar akademik.
 * Memuat:
 * - Label dengan required asterisk (*) atau optional badge
 * - Helper text
 * - Error state & pesan validasi
 * - Aksesibilitas: htmlFor, aria-describedby
 *
 * `controlId`: id elemen kontrol sebenarnya ketika anak langsung bukan kontrolnya
 * (mis. dibungkus <div> untuk tombol toggle). Bila diisi, FormField TIDAK menyuntikkan
 * `id` ke anak (mencegah id ganda) dan mengarahkan `label htmlFor` ke `controlId`.
 */
export default function FormField({
  id,
  controlId,
  label,
  required = false,
  optional = false,
  helperText,
  hint,
  error,
  children,
  className = ''
}) {
  // `hint` adalah alias kompatibilitas untuk `helperText`.
  const helper = helperText ?? hint;
  // Id yang menjadi target label/aria (kontrol sebenarnya bila controlId diberikan).
  const targetId = controlId || id;
  const helperId = helper ? `${targetId}-helper` : undefined;
  const errorId = error ? `${targetId}-error` : undefined;

  return (
    <div className={`ui-form-field ${className}`.trim()}>
      {label && (
        <div className="ui-form-label-row">
          <label htmlFor={targetId} className="ui-form-label">
            {label}
            {required && <span className="ui-form-required-star" aria-hidden="true">*</span>}
          </label>
          {optional && <span className="ui-form-optional-badge">(Opsional)</span>}
        </div>
      )}

      {/* Kontrol Form (Input / Select / Textarea) */}
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            // Jangan suntikkan `id` bila target label ditentukan eksplisit (controlId),
            // agar tidak terjadi id ganda antara pembungkus dan kontrol di dalamnya.
            ...(controlId ? {} : { id: children.props?.id || id }),
            'aria-invalid': error ? 'true' : undefined,
            'aria-describedby': [errorId, helperId].filter(Boolean).join(' ') || undefined,
            ...(typeof children.type !== 'string' ? { error: Boolean(error) } : {})
          })
        : children}

      {/* Pesan Error Validasi */}
      {error && (
        <div id={errorId} className="ui-form-error" role="alert">
          <AlertCircle size={13} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper Text */}
      {!error && helper && (
        <div id={helperId} className="ui-form-helper">
          {helper}
        </div>
      )}
    </div>
  );
}
