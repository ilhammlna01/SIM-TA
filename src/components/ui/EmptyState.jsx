import React from 'react';
import { FolderOpen } from 'lucide-react';

/**
 * EmptyState Component
 * Tampilan status kosong saat tidak ada data tabel atau entri modul.
 */
export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'Belum Ada Data',
  description = 'Data untuk kategori ini belum tersedia atau belum pernah diajukan.',
  action,
  className = ''
}) {
  return (
    <div className={`ui-empty-state ${className}`.trim()} role="status">
      <div className="ui-empty-icon" aria-hidden="true">
        <Icon size={26} />
      </div>
      <h3 className="ui-empty-title">
        {title}
      </h3>
      {description && <p className="ui-empty-desc">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
