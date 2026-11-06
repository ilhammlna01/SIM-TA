import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import SidebarNav from './SidebarNav';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Mobile Navigation Drawer
 * Aktif pada viewport < 768px.
 * Dilengkapi backdrop overlay, tombol tutup, event handler keyboard (ESC),
 * focus trap, dan pengembalian fokus ke pemicu saat ditutup.
 */
export default function MobileDrawer({
  isOpen = false,
  onClose,
  navItems = [],
  activeId,
  onSelect,
  userProfile = {
    roleLabel: 'Mahasiswa S1',
    name: 'Ilham Maulana',
    subtext: 'NIM. 22021110001'
  }
}) {
  const panelRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Simpan handler onClose terbaru di ref agar efek fokus tidak perlu bergantung
  // pada identitas onClose (yang sering berupa arrow function inline dari AppShell).
  // Tanpa ini, setiap render ulang parent akan mengulang efek dan mencuri fokus.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // ESC menutup drawer; Tab terperangkap di dalam drawer selama terbuka.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onCloseRef.current && onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement;
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      const node = panelRef.current;
      if (node) {
        const focusables = node.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusables.length > 0) focusables[0].focus();
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === 'function') prev.focus();
    };
  }, [isOpen]);

  const handleItemSelect = (id) => {
    if (onSelect) onSelect(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className={`drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside 
        ref={panelRef}
        className={`drawer-panel ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigasi Menu Mobile"
      >
        <div className="drawer-header">
          <div className="topbar-brand">
            <img 
              src="/logo-utm.png" 
              alt="Logo UTM" 
              className="topbar-brand-logo" 
            />
            <div className="topbar-brand-text">
              <span className="topbar-title">SIM-TA FEB UTM</span>
              <span className="topbar-subtitle">Jurusan Manajemen</span>
            </div>
          </div>
          <button 
            type="button" 
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Tutup menu navigasi"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="sidebar-user-header">
          <span className="sidebar-user-label">{userProfile.roleLabel}</span>
          <div className="sidebar-user-fullname">{userProfile.name}</div>
          {userProfile.subtext && (
            <div className="sidebar-user-subtext">{userProfile.subtext}</div>
          )}
        </div>

        {/* Navigation List */}
        <SidebarNav
          items={navItems}
          activeId={activeId}
          onSelect={handleItemSelect}
          collapsed={false}
        />
      </aside>
    </>
  );
}
