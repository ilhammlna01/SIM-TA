import React from 'react';
import SidebarNav from './SidebarNav';

/**
 * Desktop Sidebar
 * Karakter: Sederhana, tenang, institusional, tanpa gradient atau dekorasi berlebih.
 * Mendukung mode normal (250px) dan collapsed (64px).
 */
export default function Sidebar({
  navItems = [],
  activeId,
  onSelect,
  collapsed = false,
  userProfile = {
    roleLabel: 'Mahasiswa S1',
    name: 'Ilham Maulana',
    subtext: 'NIM. 22021110001'
  }
}) {
  return (
    <aside 
      className={`shell-sidebar ${collapsed ? 'collapsed' : ''}`}
      aria-label="Navigasi Utama Desktop"
    >
      {/* Profil Ringkas Pengguna (Institutional Card) */}
      <div className="sidebar-user-header">
        <span className="sidebar-user-label">{userProfile.roleLabel}</span>
        {!collapsed && (
          <>
            <div className="sidebar-user-fullname" title={userProfile.name}>
              {userProfile.name}
            </div>
            {userProfile.subtext && (
              <div className="sidebar-user-subtext">{userProfile.subtext}</div>
            )}
          </>
        )}
      </div>

      {/* Navigasi Utama */}
      <SidebarNav
        items={navItems}
        activeId={activeId}
        onSelect={onSelect}
        collapsed={collapsed}
      />
    </aside>
  );
}
