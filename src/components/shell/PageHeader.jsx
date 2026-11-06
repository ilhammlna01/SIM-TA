import React from 'react';
import Breadcrumb from './Breadcrumb';

/**
 * Reusable PageHeader Component
 * 
 * Pola terstandarisasi untuk seluruh halaman aplikasi:
 * 1. Breadcrumb: Jejak hierarki navigasi
 * 2. Page Title: Judul halaman h1
 * 3. Status Badge (opsional): Indikator status tahapan/dokumen
 * 4. Description: Penjelasan ringkas halaman
 * 5. Primary Action: Tombol aksi utama halaman
 * 6. Secondary Action: Tombol aksi pendukung/sekunder
 */
export default function PageHeader({
  breadcrumbs,
  breadcrumb,
  title,
  description,
  subtitle,
  statusBadge,
  primaryAction,
  secondaryAction,
  actions
}) {
  const resolvedBreadcrumbs = breadcrumbs || breadcrumb || [];
  const resolvedDescription = description || subtitle;

  return (
    <header className="page-header-wrapper" aria-label={`Header Halaman ${title}`}>
      {/* 1. Breadcrumb */}
      {resolvedBreadcrumbs && resolvedBreadcrumbs.length > 0 && (
        <Breadcrumb items={resolvedBreadcrumbs} />
      )}

      {/* Main Title Row */}
      <div className="header-main-row">
        <div className="header-text-block">
          <div className="header-title-badge-group">
            <h1 className="header-title">{title}</h1>
            {statusBadge && (
              <div className="header-status-slot" aria-label="Status Halaman">
                {statusBadge}
              </div>
            )}
          </div>

          {resolvedDescription && (
            <p className="header-description">{resolvedDescription}</p>
          )}
        </div>

        {/* Action Buttons Group (Primary & Secondary Actions) */}
        {(primaryAction || secondaryAction || actions) && (
          <div className="header-actions-group">
            {secondaryAction && (
              typeof secondaryAction === 'string' ? (
                <button type="button" className="btn-shell-secondary">
                  {secondaryAction}
                </button>
              ) : (
                secondaryAction
              )
            )}

            {primaryAction && (
              typeof primaryAction === 'string' ? (
                <button type="button" className="btn-shell-primary">
                  {primaryAction}
                </button>
              ) : (
                primaryAction
              )
            )}

            {!primaryAction && !secondaryAction && actions && actions}
          </div>
        )}
      </div>
    </header>
  );
}
