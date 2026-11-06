/**
 * Feedback Bus — Imperative API untuk Notifikasi & Konfirmasi Global
 *
 * Latar belakang:
 * Sebelumnya umpan balik pengguna menggunakan `alert()` dan `window.confirm()`
 * yang memblokir UI, tidak dapat ditata, dan memutus alur fokus aksesibilitas.
 *
 * Modul ini menyediakan API imperatif (`notify`, `confirmDialog`) yang dapat
 * dipanggil dari mana saja (termasuk utilitas non-React) tanpa memerlukan hook.
 * Sebuah komponen tunggal <FeedbackHost /> yang dipasang di akar aplikasi
 * mendaftarkan handler render sesungguhnya melalui `registerFeedback`.
 */

const handlers = {
  notify: () => {},
  confirm: async () => false
};

/**
 * Dipanggil sekali oleh <FeedbackHost /> saat komponen ter-mount.
 * @param {{ notify: Function, confirm: Function }} next
 */
export function registerFeedback(next) {
  if (next && typeof next.notify === 'function') handlers.notify = next.notify;
  if (next && typeof next.confirm === 'function') handlers.confirm = next.confirm;
}

/**
 * Tampilkan notifikasi singkat (toast) non-blokir.
 * @param {string} message
 * @param {{ variant?: 'info'|'success'|'warning'|'danger', title?: string, duration?: number }} [options]
 */
export function notify(message, options = {}) {
  return handlers.notify(message, options);
}

/**
 * Tampilkan dialog konfirmasi dan tunggu keputusan pengguna.
 * @param {string|{ title?: string, message: string, confirmLabel?: string, cancelLabel?: string, variant?: 'warning'|'danger'|'info' }} options
 * @returns {Promise<boolean>}
 */
export function confirmDialog(options) {
  return handlers.confirm(typeof options === 'string' ? { message: options } : options);
}
