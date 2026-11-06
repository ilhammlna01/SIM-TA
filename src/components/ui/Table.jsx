import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Checkbox from './Checkbox';

/**
 * Table Component (Komponen Utama Akademik)
 * 
 * Mendukung:
 * - Kepadatan (Density): 'compact', 'normal', 'spacious'
 * - Pengurutan (Sorting): kolom sortable dengan icon indikator
 * - Seleksi baris (Row selection): multiple checkbox dengan select all
 * - Sticky header
 * - Baris belang (Striped)
 * - Status kosong (Empty state slot)
 * - Status pemuatan (Loading skeleton)
 * - Aksesibilitas semantis: <table>, <thead>, <tbody>, th[scope="col"]
 */
export default function Table({
  columns = [],
  data = [],
  keyField = 'id',
  density = 'normal',
  striped = false,
  stickyHeader = false,
  selectable = false,
  selectedKeys = [],
  onSelectChange,
  sortColumn,
  sortDirection,
  onSort,
  emptyContent,
  isLoading = false,
  responsiveStacked = true,
  className = ''
}) {
  const [internalSortCol, setInternalSortCol] = useState(null);
  const [internalSortDir, setInternalSortDir] = useState('asc');

  const activeSortCol = sortColumn !== undefined ? sortColumn : internalSortCol;
  const activeSortDir = sortDirection !== undefined ? sortDirection : internalSortDir;

  const handleHeaderClick = (col) => {
    if (!col.sortable) return;

    let newDir = 'asc';
    if (activeSortCol === col.key) {
      newDir = activeSortDir === 'asc' ? 'desc' : 'asc';
    }

    if (onSort) {
      onSort(col.key, newDir);
    } else {
      setInternalSortCol(col.key);
      setInternalSortDir(newDir);
    }
  };

  // Selection handlers
  const allSelected = data.length > 0 && data.every(row => selectedKeys.includes(row[keyField]));
  const someSelected = selectedKeys.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (!onSelectChange) return;
    if (allSelected) {
      onSelectChange([]);
    } else {
      onSelectChange(data.map(row => row[keyField]));
    }
  };

  const handleSelectRow = (key) => {
    if (!onSelectChange) return;
    if (selectedKeys.includes(key)) {
      onSelectChange(selectedKeys.filter(k => k !== key));
    } else {
      onSelectChange([...selectedKeys, key]);
    }
  };

  return (
    <div className={`ui-table-wrapper ${responsiveStacked ? 'ui-table-wrapper--stacked-responsive' : ''} ${className}`.trim()}>
      <table className={`ui-table ui-table--${density} ${striped ? 'ui-table--striped' : ''} ${stickyHeader ? 'ui-table--sticky-header' : ''} ${responsiveStacked ? 'ui-table--stacked' : ''}`}>
        <thead className="ui-table-header">
          <tr>
            {selectable && (
              <th style={{ width: '40px', textAlign: 'center' }}>
                <Checkbox
                  id="table-select-all"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSelectAll}
                  aria-label="Pilih semua baris"
                />
              </th>
            )}
            {columns.map((col) => {
              const isSorted = activeSortCol === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                  className={`${col.sortable ? 'is-sortable' : ''} ui-table-th--${col.key}`}
                  onClick={() => handleHeaderClick(col)}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="ui-table-sort-icon" aria-hidden="true">
                        {isSorted ? (
                          activeSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        ) : (
                          <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            // Skeleton loader row
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {selectable && <td style={{ textAlign: 'center' }}><div className="ui-skeleton" style={{ width: '16px', height: '16px', margin: '0 auto' }} /></td>}
                {columns.map((col) => (
                  <td key={`skeleton-col-${col.key}`}>
                    <div className="ui-skeleton" style={{ height: '14px', width: '75%' }} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                {emptyContent || <span style={{ color: 'var(--color-text-muted)' }}>Belum ada data tersedia.</span>}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const rowKey = row[keyField];
              const isRowSelected = selectedKeys.includes(rowKey);

              return (
                <tr key={rowKey} className={isRowSelected ? 'is-selected' : ''}>
                  {selectable && (
                    <td style={{ textAlign: 'center' }} data-label="Pilih">
                      <Checkbox
                        id={`select-row-${rowKey}`}
                        checked={isRowSelected}
                        onChange={() => handleSelectRow(rowKey)}
                        aria-label={`Pilih baris ${rowKey}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => {
                    const value = row[col.key];
                    return (
                      <td
                        key={`${rowKey}-${col.key}`}
                        data-label={col.label}
                        className={`ui-table-cell ui-table-cell--${col.key}`}
                        style={{ textAlign: col.align || 'left' }}
                      >
                        <div className="ui-table-cell-content">
                          {col.render ? col.render(value, row) : value}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
