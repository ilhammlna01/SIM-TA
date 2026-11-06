import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
  Bell,
  ChevronDown,
  KeyRound,
  LogOut,
  ShieldCheck,
  Shield,
  BookOpen,
  User,
  CheckCircle2,
  Building2,
  GraduationCap,
  Scale
} from 'lucide-react';
import { NotificationBell } from '../notifications';
import { notify } from '../feedback';

/**
 * Institutional Topbar
 * Restrained, tenang, formal, bebas dari gaya SaaS/marketing.
 * Menampilkan: branding UTM, toggle navigasi, konteks semester, notifikasi, indikator role,
 * dan avatar profile interaktif dengan menu sesi, ganti sandi, dan logout.
 */
export default function Topbar({
  sidebarCollapsed = false,
  onToggleSidebar,
  onOpenMobileDrawer,
  currentRole = 'mahasiswa',
  onRoleChange,
  notificationCount = 3,
  userProfile = {
    initials: 'IM',
    name: 'Ilham Maulana',
    roleLabel: 'Mahasiswa'
  },
  currentUser = null,
  onLogout,
  onOpenChangePassword,
  semesterContext = 'Semester Ganjil 2026/2027'
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleChangePasswordClick = () => {
    setIsMenuOpen(false);
    if (onOpenChangePassword) {
      onOpenChangePassword();
    }
  };

  // Menentukan daftar peran yang sah bagi pengguna saat ini
  // Sesuai standar institusional: Setiap akun HANYA bisa mengakses peran yang sah diberikan padanya
  const roleLabels = {
    koorprodi: 'Koordinator Prodi',
    dosen: 'Dosen Pembimbing',
    penguji: 'Dewan Penguji',
    mahasiswa: 'Mahasiswa',
    admin: 'Admin Akademik',
    superadmin: 'Super Admin'
  };

  const ROLE_ICONS = {
    koorprodi: Building2,
    dosen: GraduationCap,
    penguji: Scale,
    superadmin: ShieldCheck,
    admin: Shield,
    mahasiswa: User
  };

  let availableRoleOptions = [];
  if (currentUser?.eligibleRoles && Array.isArray(currentUser.eligibleRoles) && currentUser.eligibleRoles.length > 0) {
    availableRoleOptions = currentUser.eligibleRoles.map(r => ({
      value: r,
      label: roleLabels[r] || r
    }));
  } else {
    const singleRole = currentUser?.role || currentRole;
    if (singleRole) {
      availableRoleOptions = [
        { value: singleRole, label: roleLabels[singleRole] || singleRole }
      ];
    }
  }

  const canSwitchRole = availableRoleOptions.length > 1;

  return (
    <header className="shell-topbar" aria-label="Header Aplikasi Utama">
      <div className="topbar-left">
        {/* Mobile Toggle Button (< 768px) */}
        <button
          type="button"
          className="topbar-toggle-btn mobile-only-toggle"
          onClick={onOpenMobileDrawer}
          aria-label="Buka menu navigasi mobile"
          style={{ display: 'none' }} /* controlled via CSS media query */
        >
          <Menu size={18} />
        </button>

        {/* Desktop Sidebar Collapse Toggle Button (>= 768px) */}
        <button
          type="button"
          className="topbar-toggle-btn desktop-only-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Perluas bilah navigasi' : 'Ciutkan bilah navigasi'}
          title={sidebarCollapsed ? 'Perluas sidebar (250px)' : 'Ciutkan sidebar (64px)'}
        >
          {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Branding Kampus */}
        <div className="topbar-brand">
          <img 
            src="/logo-utm.png" 
            alt="Logo Universitas Trunojoyo Madura" 
            className="topbar-brand-logo" 
          />
          <div className="topbar-brand-text">
            <span className="topbar-title">Sistem Pengelolaan Tugas Akhir</span>
            <span className="topbar-subtitle">Jurusan Manajemen FEB UTM (2026)</span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Page & Academic Context */}
        <div className="topbar-context-tag" aria-label="Konteks Semester Aktif">
          <span>Konteks:</span>
          <strong>{semesterContext}</strong>
        </div>


        {/* Tombol Notifikasi Real-Time Berbasis SSE (Terisolasi per Akun Pengguna) */}
        <NotificationBell currentRole={currentRole} currentUser={currentUser} />

        {/* Profil & Dropdown Menu Akun */}
        <div className="topbar-user-container" ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="topbar-user-badge"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
            aria-label="Menu profil akun"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-md)',
              transition: 'background-color 0.15s ease'
            }}
          >
            <div className="topbar-avatar" aria-hidden="true">
              {currentUser?.nama?.charAt(0) || userProfile.initials || 'U'}
            </div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">
                {currentUser?.nama || userProfile.name}
              </span>
              <span className="topbar-user-role">
                {currentUser?.role?.toUpperCase() || userProfile.roleLabel}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--color-text-secondary, #627D98)', marginLeft: '2px' }} />
          </button>

          {/* Dropdown Menu Popover */}
          {isMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '280px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border-subtle, #e2e8f0)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                padding: '8px',
                zIndex: 1000,
                color: '#1e293b',
                fontFamily: 'var(--font-family-sans, sans-serif)'
              }}
            >
              {/* Header Info Akun */}
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--primitive-navy-50, #f8fafc)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '6px'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', lineHeight: 1.3 }}>
                  {currentUser?.nama || userProfile.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {currentUser?.nomorInduk ? `NIM/NIP. ${currentUser.nomorInduk}` : userProfile.subtext || ''}
                </div>
                <div style={{ fontSize: '11px', color: '#0F766E', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} color="#10B981" />
                  <span>Sesi Login Aktif</span>
                </div>
              </div>

              {/* Pilihan Peran Kerja Cepat (Khusus Dosen Multi-Peran) */}
              {canSwitchRole && (
                <div style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', paddingLeft: '4px' }}>
                    Tugas Akademik Aktif:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {availableRoleOptions.map(opt => {
                      const RoleOptionIcon = ROLE_ICONS[opt.value] || User;
                      const isSelected = currentRole === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            if (onRoleChange && currentRole !== opt.value) {
                              onRoleChange(opt.value);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '6px 8px',
                            fontSize: '12px',
                            borderRadius: '5px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                            color: isSelected ? '#1d4ed8' : '#334155',
                            fontWeight: isSelected ? '700' : '500',
                            textAlign: 'left',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RoleOptionIcon
                              size={15}
                              style={{ color: isSelected ? '#2563eb' : '#64748b' }}
                              aria-hidden="true"
                            />
                            <span>{opt.label}</span>
                          </div>
                          {isSelected && <CheckCircle2 size={13} color="#2563eb" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Menu Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={handleChangePasswordClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12.5px',
                    color: '#334155',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <KeyRound size={15} color="#4338CA" />
                  <span>Ganti Kata Sandi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    notify('Pedoman Tugas Akhir Jurusan Manajemen FEB UTM 2026 tersedia pada menu Dokumen & Informasi Akademik.');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12.5px',
                    color: '#334155',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <BookOpen size={15} color="#D97706" />
                  <span>Pedoman & SOP TA 2026</span>
                </button>

                <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />

                <button
                  type="button"
                  onClick={handleLogoutClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    color: '#dc2626',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <LogOut size={15} color="#dc2626" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
