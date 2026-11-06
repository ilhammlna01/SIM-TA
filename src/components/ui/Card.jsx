import React from 'react';

/**
 * Card / Panel Component
 * Wadah struktural berwibawa untuk blok administrasi dan dossier akademik.
 */
export default function Panel({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  footer,
  noPadding = false,
  className = '',
  ...props
}) {
  return (
    <section className={`ui-panel ${className}`.trim()} {...props}>
      {(title || actions) && (
        <header className="ui-panel-header">
          <div className="ui-panel-title-group">
            {title && (
              <h2 className="ui-panel-title">
                {Icon && <Icon size={16} aria-hidden="true" style={{ color: 'var(--color-brand-primary)' }} />}
                <span>{title}</span>
              </h2>
            )}
            {subtitle && <span className="ui-panel-subtitle">{subtitle}</span>}
          </div>
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>{actions}</div>}
        </header>
      )}

      <div className={`ui-panel-body ${noPadding ? 'no-padding' : ''}`}>
        {children}
      </div>

      {footer && <footer className="ui-panel-footer">{footer}</footer>}
    </section>
  );
}

// Alias Card ke Panel
export const Card = Panel;
