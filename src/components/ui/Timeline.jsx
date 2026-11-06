import React from 'react';

/**
 * Timeline Component
 * Garis waktu utilitarian untuk rekam jejak tahapan tugas akhir dan log bimbingan.
 */
export default function Timeline({
  items = [],
  className = ''
}) {
  return (
    <div className={`ui-timeline ${className}`.trim()} role="feed" aria-label="Garis Waktu Tahapan">
      {items.map((item) => {
        const isCompleted = item.status === 'completed';
        const isCurrent = item.status === 'current';

        return (
          <div
            key={item.id}
            className={`ui-timeline-item ${isCompleted ? 'is-completed' : ''} ${isCurrent ? 'is-current' : ''}`}
          >
            <div className="ui-timeline-dot" aria-hidden="true" />
            <div className="ui-timeline-header">
              <h3 className="ui-timeline-title">
                {item.title}
              </h3>
              {item.date && <span className="ui-timeline-date">{item.date}</span>}
            </div>
            {item.actor && (
              <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-brand-primary)', fontWeight: 'var(--font-weight-medium)', marginBottom: '2px' }}>
                {item.actor}
              </div>
            )}
            {item.notes && (
              <div className="ui-timeline-notes">
                {item.notes}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
