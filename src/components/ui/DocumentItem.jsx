import React from 'react';
import { FileText, Download, Eye, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { IconButton } from './Button';

/**
 * DocumentItem Component
 * Kartu/baris arsip berkas naskah dan dokumen legal akademik.
 */
export default function DocumentItem({
  title,
  meta,
  status,
  onDownload,
  onPreview,
  onDelete,
  className = ''
}) {
  return (
    <div className={`ui-doc-item ${className}`.trim()}>
      <div className="ui-doc-icon" aria-hidden="true">
        <FileText size={18} />
      </div>

      <div className="ui-doc-info">
        <div className="ui-doc-title" title={title}>
          {title}
        </div>
        {meta && <div className="ui-doc-meta">{meta}</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {status && <StatusBadge status={status} />}
        {onPreview && (
          <IconButton 
            icon={Eye} 
            label="Lihat pratinjau dokumen" 
            size="sm" 
            bordered 
            onClick={onPreview} 
          />
        )}
        {onDownload && (
          <IconButton 
            icon={Download} 
            label="Unduh dokumen" 
            size="sm" 
            bordered 
            onClick={onDownload} 
          />
        )}
        {onDelete && (
          <IconButton 
            icon={Trash2} 
            label="Hapus berkas" 
            size="sm" 
            onClick={onDelete} 
          />
        )}
      </div>
    </div>
  );
}
