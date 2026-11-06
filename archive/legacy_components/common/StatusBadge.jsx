import React from 'react';

/**
 * StatusBadge Component
 * Mengimplementasikan 10 Status Tokens Resmi Akademik UTM 2026
 * Status didesain dengan kontras tinggi bebas dari emoji dan simbol raw.
 */
export default function StatusBadge({ status, type }) {
  if (!status) return null;

  const s = String(status).trim().toLowerCase();

  // Mapping 10 Status Resmi
  let statusClass = 'neutral';

  if (s === 'draft' || s.includes('draft')) {
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
  } else if (type) {
    statusClass = type;
  }

  return (
    <span className={`status-badge ${statusClass}`} role="status" aria-label={`Status: ${status}`}>
      <span className="status-dot" aria-hidden="true"></span>
      <span className="status-label">{status}</span>
    </span>
  );
}
