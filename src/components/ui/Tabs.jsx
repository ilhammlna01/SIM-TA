import React from 'react';

/**
 * Tabs Component
 * Navigasi tab untuk pengelompokan tampilan modul akademik.
 */
export default function Tabs({
  tabs = [],
  activeTab,
  onTabChange,
  className = ''
}) {
  return (
    <ul className={`ui-tabs-list ${className}`.trim()} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <li key={tab.id} role="presentation">
            <button
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              disabled={tab.disabled}
              className={`ui-tab-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => !tab.disabled && onTabChange && onTabChange(tab.id)}
            >
              {Icon && <Icon size={14} aria-hidden="true" />}
              <span>{tab.label}</span>
              {typeof tab.badge !== 'undefined' && tab.badge !== null && (
                <span className="ui-tab-badge">{tab.badge}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * TabPanel Component
 * Konten panel berpasangan dengan tab aktif
 */
export function TabPanel({
  id,
  activeTab,
  children,
  className = ''
}) {
  if (activeTab !== id) return null;

  return (
    <div
      id={`tabpanel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={className}
      style={{ padding: 'var(--space-4) 0' }}
    >
      {children}
    </div>
  );
}
