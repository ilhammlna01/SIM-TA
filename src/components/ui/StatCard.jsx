import React from 'react';

/**
 * StatCard Component
 *
 * Kartu ringkasan metrik terstandarisasi untuk dashboard seluruh jenjang.
 * Menggantikan pola kartu statistik yang sebelumnya disalin-tempel dengan
 * inline style dan warna hex hardcoded di banyak halaman.
 *
 * Menggunakan design token secara penuh (warna, radius, spasi, tipografi)
 * sehingga tampilan seluruh dashboard konsisten dan mudah dirawat.
 *
 * Props:
 * - label    : Judul metrik (huruf kapital kecil).
 * - value    : Nilai utama metrik (angka/teks).
 * - unit     : Satuan pendamping setelah nilai (mis. "Mahasiswa").
 * - caption  : Keterangan tambahan di bawah nilai (opsional).
 * - icon     : Komponen ikon lucide-react (opsional).
 * - tone     : Aksen warna -> navy | gold | sky | green | amber | violet | red | neutral.
 * - onClick  : Menjadikan kartu interaktif (opsional).
 */
export default function StatCard({
  label,
  value,
  unit,
  caption,
  icon: Icon,
  tone = 'navy',
  className = '',
  onClick,
  ...props
}) {
  const isInteractive = typeof onClick === 'function';
  const Tag = isInteractive ? 'button' : 'div';

  return (
    <Tag
      type={isInteractive ? 'button' : undefined}
      onClick={onClick}
      className={`ui-stat-card ui-stat-card--${tone} ${className}`.trim()}
      {...props}
    >
      <div className="ui-stat-card-label">
        {Icon && <Icon size={14} aria-hidden="true" className="ui-stat-card-icon" />}
        <span>{label}</span>
      </div>
      <div className="ui-stat-card-value">
        <span className="ui-stat-card-number">{value}</span>
        {unit && <span className="ui-stat-card-unit">{unit}</span>}
      </div>
      {caption && <div className="ui-stat-card-caption">{caption}</div>}
    </Tag>
  );
}
