import React from 'react';

/**
 * StatusBadge Component
 * Mengimplementasikan 10 Status Tokens Resmi Akademik UTM 2026.
 * Didesain dengan kontras tinggi, bebas dari emoji dan simbol raw,
 * menggunakan shape dot semantik yang tenang dan terbaca jelas.
 *
 * API yang didukung (backward & forward compatible):
 * - status  : teks status utama (mis. "Disetujui", "Dalam Revisi").
 * - children: alias dari `status` (mis. <StatusBadge>Draft</StatusBadge>).
 * - variant : alias palet warna umum (success | warning | danger | error | info | neutral).
 * - type    : alias dari `variant`, atau kelas status eksplisit (mis. "disetujui").
 *
 * Prioritas pemetaan:
 * 1. Jika teks status cocok dengan salah satu 10 token status resmi -> gunakan kelas status tersebut.
 * 2. Jika tidak cocok -> gunakan `variant`/`type` eksplisit (dipetakan ke kelas palet).
 * 3. Default -> "neutral".
 */
const PALETTE_ALIASES = {
  error: 'danger',
  threat: 'danger',
  ok: 'success',
  warn: 'warning'
};

export default function StatusBadge({ status, type, variant, wrap = false, className = '', children }) {
  // `status` diutamakan; `children` menjadi alias agar pemakaian
  // <StatusBadge>{text}</StatusBadge> tidak lagi merender kosong.
  const label = status ?? (typeof children === 'string' || typeof children === 'number' ? children : null);
  if (label === null || label === undefined || label === '') return null;

  const s = String(label).trim().toLowerCase();

  // Palet eksplisit (success/warning/danger/info/neutral) dari variant atau type.
  const explicit = variant || type;
  const explicitKey = typeof explicit === 'string' ? explicit.trim().toLowerCase() : '';
  const paletteFallback = explicitKey
    ? (PALETTE_ALIASES[explicitKey] || explicitKey)
    : 'neutral';

  let statusClass = 'neutral';
  let matched = true;

  // Audit 21 Oktober 2026 (BP-3): "Draft" tidak lagi dipakai karena ambigu
  // (dipakai untuk naskah, ujian, maupun berkas persyaratan). Label status
  // yang berawalan "Belum" digtreated sebagai status awal (netral).
  if (s === 'draft' || s.includes('draft') || s.startsWith('belum')) {
    statusClass = 'status-badge--draft';
  } else if (s === 'diajukan' || s.includes('diajukan')) {
    statusClass = 'status-badge--diajukan';
  } else if (s.includes('menunggu verifikasi')) {
    statusClass = 'status-badge--menunggu-verifikasi';
  } else if (s.includes('menunggu persetujuan') || s.includes('menunggu') || s.includes('proses')) {
    statusClass = 'status-badge--menunggu-persetujuan';
  } else if (s.includes('disetujui') || s.includes('terverifikasi') || s.includes('disahkan')) {
    statusClass = 'status-badge--disetujui';
  } else if (s.includes('tidak lulus') || s.includes('gugur')) {
    statusClass = 'status-badge--tidak-lulus';
  } else if (s.includes('ditolak') || s.includes('batal')) {
    statusClass = 'status-badge--ditolak';
  } else if (s.includes('revisi') || s.includes('dalam revisi')) {
    statusClass = 'status-badge--dalam-revisi';
  } else if (s.includes('lulus') || s.includes('layak')) {
    statusClass = 'status-badge--lulus';
  } else if (s.includes('selesai') || s.includes('terpenuhi') || s.includes('published') || s.includes('accepted')) {
    statusClass = 'status-badge--selesai';
  } else {
    matched = false;
  }

  // Jika teks tidak cocok dengan token status resmi, gunakan palet eksplisit.
  if (!matched) {
    statusClass = `status-badge--${paletteFallback}`;
  }

  return (
    <span className={`status-badge ${statusClass}${wrap ? ' status-badge--wrap' : ''} ${className}`.trim()} role="status" aria-label={`Status: ${label}`}>
      <span className="status-dot" aria-hidden="true" />
      <span className="status-label">{label}</span>
    </span>
  );
}
