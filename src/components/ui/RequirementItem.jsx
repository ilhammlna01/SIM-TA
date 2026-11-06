import React from 'react';
import StatusBadge from './StatusBadge';
import Button from './Button';

/**
 * RequirementItem Component
 * Baris item persyaratan kelayakan ujian/sidang (TOEFL, SKS, SK Pembimbing, dsb.)
 */
export default function RequirementItem({
  title,
  rule,
  status = 'Belum Diverifikasi',
  actionLabel,
  onAction,
  verifiedInfo,
  className = ''
}) {
  return (
    <div className={`ui-req-item ${className}`.trim()}>
      <div className="ui-req-info">
        <span className="ui-req-title">{title}</span>
        {rule && <span className="ui-req-rule">{rule}</span>}
        {verifiedInfo && (
          <span style={{ fontSize: '10.5px', color: 'var(--color-brand-primary)', marginTop: '2px' }}>
            {verifiedInfo}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <StatusBadge status={status} />
        {actionLabel && (
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
