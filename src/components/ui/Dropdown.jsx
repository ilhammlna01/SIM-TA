import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Dropdown Component
 * Menu popover untuk aksi kontekstual (Cetak, Export, Ubah Status, dsb.)
 */
export default function Dropdown({
  trigger,
  items = [],
  align = 'right',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (item) => {
    if (item.disabled) return;
    setIsOpen(false);
    if (item.onClick) item.onClick();
  };

  return (
    <div ref={containerRef} className={`ui-dropdown-wrapper ${className}`.trim()}>
      {trigger ? (
        <span onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
          {trigger}
        </span>
      ) : (
        <button
          type="button"
          className="ui-btn ui-btn--secondary ui-btn--sm"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span>Pilihan</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <ul 
          className="ui-dropdown-menu"
          style={{ [align]: 0 }}
          role="menu"
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return <li key={`div-${idx}`} className="ui-dropdown-divider" role="separator" />;
            }

            const Icon = item.icon;

            return (
              <li key={item.id || idx} role="none">
                <button
                  type="button"
                  className={`ui-dropdown-item ${item.danger ? 'is-danger' : ''}`}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  role="menuitem"
                >
                  {Icon && <Icon size={14} aria-hidden="true" />}
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
