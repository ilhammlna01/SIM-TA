import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  GitBranch,
  ListChecks,
  MessageSquare,
  FileText,
  GraduationCap,
  CheckSquare,
  BookMarked,
  FolderArchive,
  Users,
  CalendarCheck,
  ClipboardCheck,
  Scale,
  Archive,
  Edit3,
  FileCheck2,
  FileBadge2,
  DoorOpen,
  Building2,
  Sliders,
  ShieldCheck,
  Calendar,
  Printer,
  Award
} from 'lucide-react';

import Topbar from './Topbar';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import ContentContainer from './ContentContainer';
// Impor langsung dari modul komponen (bukan barrel '../ui') untuk menghindari
// siklus modul ui/index -> shell/index -> AppShell -> ui/index.
import Alert from '../ui/Alert';

/**
 * Master AppShell Component
 * Menyatukan seluruh kerangka visual aplikasi:
 * - Topbar institusional
 * - Desktop sidebar (permanen & collapsible)
 * - Mobile navigation drawer
 * - Content container terkontrol
 * - Penyesuaian struktur menu berdasarkan role (mock role state)
 */
export default function AppShell({
  currentRole: controlledRole,
  onRoleChange: controlledOnRoleChange,
  activeNavId: controlledActiveId,
  onNavSelect: controlledOnNavSelect,
  userProfile: propUserProfile,
  currentUser = null,
  onLogout,
  onOpenChangePassword,
  badgeCounts = {},
  isBackendOnline = null,
  isSyncingBackend = false,
  children
}) {
  // Internal state jika tidak dikontrol secara eksternal
  const [internalRole, setInternalRole] = useState('dosen');
  const [internalActiveId, setInternalActiveId] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const role = controlledRole || internalRole;
  const activeId = controlledActiveId || internalActiveId;

  const handleRoleChange = (newRole) => {
    if (controlledOnRoleChange) {
      controlledOnRoleChange(newRole);
    } else {
      setInternalRole(newRole);
      setInternalActiveId('dashboard');
    }
  };

  const handleNavSelect = (id) => {
    if (controlledOnNavSelect) {
      controlledOnNavSelect(id);
    } else {
      setInternalActiveId(id);
    }
  };

  // Nav items per mock role
  const getRoleNavConfig = () => {
    switch (role) {
      case 'dosen':
        return {
          userProfile: propUserProfile || {
            roleLabel: 'Dosen Pembimbing / Promotor',
            name: 'Dr. Dra. Hj. Iriani Ismail, M.M.',
            subtext: 'NIP. 196206231988112001 — Lektor Kepala (IV/a)',
            initials: 'II'
          },
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'mahasiswa', label: 'Mahasiswa Bimbingan', icon: Users, badge: badgeCounts?.mahasiswaTotal },
            { id: 'bimbingan', label: 'Bimbingan', icon: MessageSquare, badge: badgeCounts?.bimbinganCount },
            { id: 'naskah', label: 'Naskah Masuk', icon: FileText, badge: badgeCounts?.naskahPending },
            { id: 'review', label: 'Review Naskah', icon: Edit3 },
            { id: 'persetujuan', label: 'Persetujuan', icon: CheckSquare, badge: badgeCounts?.approvalPending },
            { id: 'revisi', label: 'Pemantauan Revisi', icon: ClipboardCheck },
            { id: 'ujian', label: 'Jadwal Ujian', icon: CalendarCheck, badge: badgeCounts?.ujianMendatang }
          ]
        };

      case 'koorprodi':
        return {
          userProfile: propUserProfile || {
            roleLabel: 'Koorprodi Manajemen',
            name: 'Dr. Hj. Siti Aminah, S.E., M.Si.',
            subtext: 'NIP. 197802142003122001 — Lektor Kepala',
            initials: 'SA'
          },
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'mahasiswa', label: 'Daftar Mahasiswa', icon: Users, badge: badgeCounts?.mahasiswaTotal },
            { id: 'pengajuan', label: 'Pengajuan Masuk', icon: CheckSquare, badge: badgeCounts?.pengajuanPending },
            { id: 'pembimbing', label: 'Plotting Pembimbing', icon: BookOpen },
            { id: 'penguji', label: 'Dewan Penguji', icon: Scale },
            { id: 'penerbitan-massal', label: 'Penerbitan Dokumen Kolektif', icon: Printer, badge: 'Kolektif' },
            { id: 'ujian', label: 'Jadwal Ujian & Sidang', icon: CalendarCheck, badge: badgeCounts?.ujianMendatang },
            { id: 'persyaratan', label: 'Matriks Persyaratan', icon: ListChecks },
            { id: 'revisi', label: 'Pemantauan Revisi', icon: ClipboardCheck },
            { id: 'dokumen', label: 'Arsip Dokumen Prodi', icon: FolderArchive }
          ]
        };

      case 'penguji':
        return {
          userProfile: propUserProfile || {
            roleLabel: 'Dewan Penguji',
            name: 'Dr. Faidal, S.E., M.M.',
            subtext: 'NIP. 197703032003121002 — Lektor',
            initials: 'FD'
          },
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'daftar-ujian', label: 'Daftar Ujian', icon: CalendarCheck, badge: badgeCounts?.ujianMendatang },
            { id: 'naskah', label: 'Naskah Ujian', icon: FileText },
            { id: 'penilaian', label: 'Form Penilaian', icon: ClipboardCheck, badge: badgeCounts?.penilaianPending },
            { id: 'koreksi', label: 'Catatan / Koreksi', icon: Edit3 },
            { id: 'revisi', label: 'Verifikasi Revisi', icon: CheckSquare, badge: badgeCounts?.revisiPending }
          ]
        };

      case 'admin':
        return {
          userProfile: propUserProfile || {
            roleLabel: 'Admin Akademik',
            name: 'Ahmad Fauzi, S.Kom., M.T.',
            subtext: 'NIP. 198104122008121002 — Subbag Tata Usaha',
            initials: 'AF'
          },
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'jadwal-tahapan', label: 'Jadwal Tahapan', icon: Calendar, badge: badgeCounts?.jadwalAktif },
            { id: 'otomasi-dokumen', label: 'Otomasi Dokumen', icon: FileBadge2, badge: 'Auto' },
            { id: 'verifikasi', label: 'Verifikasi Berkas', icon: FileCheck2, badge: badgeCounts?.berkasPending },
            { id: 'sk', label: 'Penerbitan SK', icon: BookMarked },
            { id: 'ruangan', label: 'Alokasi Ruang Sidang', icon: DoorOpen }
          ]
        };

      case 'superadmin':
        return {
          userProfile: propUserProfile || {
            roleLabel: 'Super Administrator',
            name: 'Ir. Supriyanto, M.Kom.',
            subtext: 'NIP. 197405102000031001 — Pusat Data FEB',
            initials: 'SP'
          },
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'prodi', label: 'Master Data Prodi', icon: Building2 },
            { id: 'tahapan', label: 'Tahapan & Regulasi', icon: GitBranch },
            { id: 'kuota', label: 'Kuota Bimbingan', icon: Sliders },
            { id: 'users', label: 'Manajemen Pengguna', icon: Users, badge: badgeCounts?.totalUsers }
          ]
        };

      case 'mahasiswa':
      default:
        return {
          userProfile: propUserProfile || {
            roleLabel: 'Mahasiswa S1',
            name: 'Ilham Maulana',
            subtext: 'NIM. 22021110001 — Manajemen Keuangan',
            initials: 'IM'
          },
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'detail-ta', label: 'Detail Tugas Akhir', icon: BookOpen },
            { id: 'tahapan', label: 'Tahapan', icon: GitBranch },
            { id: 'persyaratan', label: 'Persyaratan', icon: ListChecks },
            { id: 'bimbingan', label: 'Bimbingan', icon: MessageSquare, badge: badgeCounts?.bimbingan },
            { id: 'naskah', label: 'Naskah', icon: FileText },
            { id: 'ujian', label: 'Ujian', icon: GraduationCap },
            { id: 'revisi', label: 'Revisi', icon: CheckSquare, badge: badgeCounts?.revisi },
            { id: 'portofolio', label: 'Portofolio', icon: Award },
            { id: 'dokumen', label: 'Dokumen', icon: FolderArchive }
          ]
        };
    }
  };

  const { userProfile, items: navItems } = getRoleNavConfig();

  return (
    <div className="shell-root">
      {/* 1. Topbar Institusional */}
      <Topbar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        currentRole={role}
        onRoleChange={handleRoleChange}
        userProfile={userProfile}
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenChangePassword={onOpenChangePassword}
        notificationCount={3}
      />

      {/* 2. Desktop Sidebar (Permanen / Collapsible) */}
      <Sidebar
        navItems={navItems}
        activeId={activeId}
        onSelect={handleNavSelect}
        collapsed={sidebarCollapsed}
        userProfile={userProfile}
      />

      {/* 3. Mobile Navigation Drawer (< 768px) */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        navItems={navItems}
        activeId={activeId}
        onSelect={handleNavSelect}
        userProfile={userProfile}
      />

      {/* 4. Main Content Area */}
      <main 
        id="main-content"
        className={`shell-main ${sidebarCollapsed ? 'collapsed' : ''}`}
        tabIndex={-1}
      >
        <ContentContainer>
          {isSyncingBackend && (
            <div style={{ marginBottom: 'var(--space-4)' }} role="status" aria-live="polite">
              <Alert variant="info" title="Menyinkronkan Data Akademik">
                Sedang memuat data terbaru dari pangkalan data akademik FEB UTM. Mohon tunggu sejenak.
              </Alert>
            </div>
          )}
          {isBackendOnline === false && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <Alert variant="warning" title="Mode Data Lokal (Server Tidak Terhubung)">
                Perubahan Anda disimpan sementara di perangkat ini dan belum tersinkronisasi ke pangkalan data
                akademik. Periksa koneksi jaringan Anda; data akan disinkronkan saat server kembali terhubung.
              </Alert>
            </div>
          )}
          {children}
        </ContentContainer>
      </main>
    </div>
  );
}
