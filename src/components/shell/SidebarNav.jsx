import React from 'react';

/**
 * SidebarNav
 * Komponen navigasi list sederhana dan institusional.
 * Mendukung status:
 * - active
 * - hover
 * - focus-visible
 * - disabled
 * - notification badge
 * - collapsed mode (icon only)
 */
export default function SidebarNav({ 
  items = [], 
  activeId, 
  onSelect, 
  collapsed = false 
}) {
  return (
    <nav className="sidebar-nav-container" aria-label="Navigasi Menu Shell">
      <ul className="sidebar-nav-list" role="list">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          const isDisabled = Boolean(item.disabled);

          return (
            <li key={item.id} className="sidebar-nav-item">
              <button
                type="button"
                className={`sidebar-nav-btn ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && onSelect && onSelect(item.id)}
                disabled={isDisabled}
                aria-current={isActive ? 'page' : undefined}
                aria-disabled={isDisabled ? 'true' : undefined}
                title={collapsed ? item.label : undefined}
              >
                {Icon && (
                  <span className="sidebar-nav-icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                )}
                {!collapsed && (
                  <span className="sidebar-nav-label">{item.label}</span>
                )}
                {typeof item.badge !== 'undefined' && item.badge !== null && (typeof item.badge === 'string' ? item.badge.length > 0 : item.badge > 0) && (
                  <span 
                    className="sidebar-nav-badge" 
                    aria-label={`${item.badge} notifikasi`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
