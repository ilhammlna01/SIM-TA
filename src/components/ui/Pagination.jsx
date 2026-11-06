import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination Component
 * Kontrol pemilahan halaman untuk tabel data akademik besar.
 */
export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
  className = ''
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  // Generate page numbers
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <nav className={`ui-pagination ${className}`.trim()} aria-label="Navigasi Halaman Data">
      <div className="ui-pagination-summary">
        Menampilkan <strong>{startItem}</strong>-<strong>{endItem}</strong> dari <strong>{totalItems}</strong> data
        {onPageSizeChange && (
          <span style={{ marginLeft: 'var(--space-3)' }}>
            <label htmlFor="ui-page-size-select" style={{ marginRight: 'var(--space-1)', color: 'var(--color-text-muted)' }}>
              Baris per halaman:
            </label>
            <select
              id="ui-page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                fontFamily: 'inherit',
                fontSize: 'var(--type-caption-size)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                backgroundColor: 'var(--color-surface-panel)',
                cursor: 'pointer'
              }}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </span>
        )}
      </div>

      <div className="ui-pagination-controls">
        <button
          type="button"
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="ui-pagination-btn"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} style={{ padding: '0 4px', color: 'var(--color-text-muted)' }}>
                ...
              </span>
            );
          }
          return (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPageChange && onPageChange(p)}
              className={`ui-pagination-btn ${currentPage === p ? 'is-active' : ''}`}
              aria-current={currentPage === p ? 'page' : undefined}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="ui-pagination-btn"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </nav>
  );
}
