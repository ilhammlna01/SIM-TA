import React from 'react';

/**
 * ProgressIndicator Component
 * Indikator progres capaian tahapan bimbingan atau kelengkapan berkas akademik.
 */
export default function ProgressIndicator({
  value = 0,
  max = 100,
  label,
  helper,
  variant = 'primary',
  showPercentage = true,
  className = ''
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={`ui-progress-wrapper ${className}`.trim()} role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
      {(label || showPercentage || helper) && (
        <div className="ui-progress-header">
          <span>{label || 'Kemajuan Tahapan'}</span>
          <span>
            {helper ? `${helper} (${percentage}%)` : showPercentage ? `${percentage}%` : null}
          </span>
        </div>
      )}
      <div className="ui-progress-track">
        <div 
          className={`ui-progress-fill ui-progress-fill--${variant}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
