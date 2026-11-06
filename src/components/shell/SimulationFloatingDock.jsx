import React, { useState } from 'react';
import {
  UserCheck,
  ShieldAlert,
  QrCode,
  RotateCcw,
  Database,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  X,
  Layers,
  Sliders,
  LogOut
} from 'lucide-react';

/**
 * SimulationFloatingDock Component
 * Menampilkan kontrol simulasi multi-peran dan pengujian QA dalam panel datar institusional
 * yang terkendali (restrained) di pojok kanan-bawah pada mode development.
 * Bebas efek glassmorphism, menggunakan design tokens resmi SIM-TA FEB UTM.
 */
export default function SimulationFloatingDock({
  currentRole,
  currentUser,
  onRoleChange,
  selectedStudentId,
  onSelectStudent,
  students = [],
  isBackendOnline,
  isSyncingBackend,
  backendSyncTime,
  onSyncBackend,
  onOpenQAModal,
  onOpenVerifier,
  onResetDemoData,
  onLogout
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const roles = [
    { id: 'superadmin', label: 'Super Admin', color: 'var(--primitive-red-700)' },
    { id: 'admin', label: 'Admin Akademik', color: 'var(--primitive-amber-700)' },
    { id: 'penguji', label: 'Dewan Penguji', color: 'var(--primitive-navy-900)' },
    { id: 'koorprodi', label: 'Koorprodi', color: '#0f766e' },
    { id: 'dosen', label: 'Pembimbing', color: 'var(--primitive-navy-800)' },
    { id: 'mahasiswa', label: 'Mahasiswa', color: 'var(--primitive-blue-700)' }
  ];

  // Batasi pilihan peran hanya untuk peran yang sah dimiliki oleh akun yang sedang login
  const authorizedRoleIds = currentUser?.eligibleRoles && Array.isArray(currentUser.eligibleRoles) && currentUser.eligibleRoles.length > 0
    ? currentUser.eligibleRoles
    : (currentUser?.role ? [currentUser.role] : null);

  const availableRoles = authorizedRoleIds
    ? roles.filter(r => authorizedRoleIds.includes(r.id))
    : roles;

  const currentRoleInfo = roles.find(r => r.id === currentRole) || {
    label: (currentRole || '').toUpperCase(),
    color: 'var(--primitive-navy-900)'
  };

  return (
    <aside
      aria-label="Panel Demonstrasi & Simulasi Peran Sistem"
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        fontFamily: 'var(--font-family-sans, sans-serif)',
        pointerEvents: 'auto'
      }}
    >
      {/* Popover Card Saat Diperluas (Panel Datar Institusional) */}
      {isExpanded && (
        <div
          role="dialog"
          aria-label="Pengaturan Simulasi dan Pengujian Sistem"
          style={{
            marginBottom: '8px',
            width: '340px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
            backgroundColor: 'var(--color-surface-panel)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-default)',
            boxShadow: 'var(--shadow-dropdown)',
            padding: 'var(--space-4)',
            boxSizing: 'border-box'
          }}
        >
          {/* Header Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-3)',
              paddingBottom: 'var(--space-2)',
              borderBottom: '1px solid var(--color-border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--primitive-navy-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-brand-primary)'
                }}
              >
                <Layers size={14} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
                  Simulasi & Pengujian Sistem
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)' }}>
                  Kontrol Multi-Peran & QA SIM-TA FEB UTM
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label="Tutup panel kontrol simulasi"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primitive-neutral-400)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Tutup panel"
            >
              <X size={15} />
            </button>
          </div>

          {/* Switcher / Status Peran Resmi */}
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px'
              }}
            >
              {availableRoles.length > 1 ? 'PILIH PERAN PENGGUNA (MULTI-ROLE):' : 'PERAN RESMI AKUN AKTIF:'}
            </div>
            {availableRoles.length > 1 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '6px'
                }}
              >
                {availableRoles.map((r) => {
                  const isActive = currentRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        onRoleChange(r.id);
                        setIsExpanded(false);
                      }}
                      style={{
                        padding: '6px 10px',
                        fontSize: '11.5px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid',
                        borderColor: isActive ? r.color : 'var(--color-border-subtle)',
                        backgroundColor: isActive ? r.color : 'var(--primitive-neutral-50)',
                        color: isActive ? '#ffffff' : 'var(--color-text-primary)',
                        fontWeight: isActive ? 'var(--font-weight-bold)' : 'var(--font-weight-regular)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease'
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: isActive ? '#ffffff' : r.color,
                          flexShrink: 0
                        }}
                      />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primitive-neutral-50)',
                  border: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: currentRoleInfo.color,
                    flexShrink: 0
                  }}
                />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-navy-950)' }}>
                    {currentRoleInfo.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    Otorisasi tunggal terkunci untuk akun ini.
                  </div>
                </div>
              </div>
            )}

            {/* Selector Akun Mahasiswa Simulasi (Khusus Peran Mahasiswa) */}
            {currentRole === 'mahasiswa' && Array.isArray(students) && students.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '6px'
                  }}
                >
                  PILIH PROFIL MAHASISWA SIMULASI:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {students.map((s) => {
                    const isSelected = selectedStudentId === s.id;
                    const isTakk = s.jenisTA === 'TAKK';
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (onSelectStudent) onSelectStudent(s.id);
                        }}
                        style={{
                          padding: '6px 8px',
                          fontSize: '11px',
                          textAlign: 'left',
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--color-brand-primary)' : 'var(--color-border-subtle)',
                          backgroundColor: isSelected ? 'var(--primitive-navy-50)' : '#ffffff',
                          color: isSelected ? 'var(--color-brand-primary)' : 'var(--primitive-navy-950)',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {s.nama}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            {s.jenjang} • NIM {s.nim}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '9.5px',
                            padding: '2px 6px',
                            borderRadius: '9999px',
                            backgroundColor: isTakk ? '#FEF3C7' : '#F1F5F9',
                            color: isTakk ? '#92400E' : '#475569',
                            fontWeight: 'bold',
                            flexShrink: 0
                          }}
                        >
                          {isTakk ? 'TAKK' : 'TAKT'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Status Database & Alat Pengujian */}
          <div
            style={{
              paddingTop: 'var(--space-2)',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              {/* Database indicator */}
              <button
                type="button"
                onClick={onSyncBackend}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: isBackendOnline ? 'var(--primitive-green-200)' : 'var(--primitive-amber-200)',
                  backgroundColor: isBackendOnline ? 'var(--primitive-green-50)' : 'var(--primitive-amber-50)',
                  color: isBackendOnline ? 'var(--primitive-green-700)' : 'var(--primitive-amber-700)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                title={isBackendOnline ? `SQLite DB Online (Port 5001). Sinkronisasi: ${backendSyncTime || 'Terkoneksi'}` : 'Offline (LocalStorage)'}
              >
                <Database size={11} />
                <span>{isBackendOnline ? 'SQLite Online' : 'LocalStorage'}</span>
                <RefreshCw size={10} style={{ animation: isSyncingBackend ? 'spin 1s linear infinite' : 'none' }} />
              </button>

              {/* Shortcut Portal Login */}
              <button
                type="button"
                onClick={() => {
                  onRoleChange('login');
                  setIsExpanded(false);
                }}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-default)',
                  backgroundColor: 'var(--primitive-neutral-50)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer'
                }}
              >
                Portal Login
              </button>
            </div>

            {/* Tombol Fitur QA & Dokumen */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
              <button
                type="button"
                onClick={() => {
                  onOpenQAModal();
                  setIsExpanded(false);
                }}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--primitive-blue-200)',
                  backgroundColor: 'var(--primitive-blue-50)',
                  color: 'var(--primitive-blue-700)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <ShieldAlert size={12} /> QA Suite
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenVerifier();
                  setIsExpanded(false);
                }}
                style={{
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-default)',
                  backgroundColor: 'var(--primitive-neutral-50)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Cek keabsahan QR code Berita Acara / SK"
              >
                <QrCode size={12} /> Cek QR
              </button>

              <button
                type="button"
                onClick={() => {
                  onResetDemoData();
                  setIsExpanded(false);
                }}
                style={{
                  padding: '6px 8px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--primitive-red-200)',
                  backgroundColor: 'var(--primitive-red-50)',
                  color: 'var(--primitive-red-700)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Reset simulasi ke kondisi awal FEB UTM"
              >
                <RotateCcw size={11} /> Reset
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    onLogout();
                  }}
                  style={{
                    padding: '6px 8px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-default)',
                    backgroundColor: 'var(--primitive-neutral-50)',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Kembali ke Halaman Login Resmi"
                >
                  <LogOut size={11} /> Keluar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tombol Dock Kontrol Simulasi (Restrained Institutional Standard) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="Buka panel simulasi peran dan pengujian QA"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          height: '34px',
          padding: '0 12px',
          backgroundColor: 'var(--primitive-navy-950)',
          color: '#ffffff',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--primitive-navy-700)',
          boxShadow: 'var(--shadow-dropdown)',
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
          fontSize: '12px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--primitive-navy-900)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--primitive-navy-950)';
        }}
        title="Buka panel simulasi peran, pengujian QA, dan status database"
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: isBackendOnline ? 'var(--primitive-green-600)' : 'var(--primitive-amber-600)',
            flexShrink: 0
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sliders size={13} style={{ color: 'var(--primitive-gold-400)' }} />
          <span style={{ fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--primitive-neutral-300)' }}>
            Simulasi:
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'var(--font-weight-bold)',
              color: '#ffffff',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-xs)'
            }}
          >
            {currentRoleInfo.label}
          </span>
        </div>

        {isExpanded ? (
          <ChevronDown size={14} style={{ color: 'var(--primitive-neutral-400)' }} />
        ) : (
          <ChevronUp size={14} style={{ color: 'var(--primitive-neutral-400)' }} />
        )}
      </button>
    </aside>
  );
}
