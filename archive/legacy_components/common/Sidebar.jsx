import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  GitBranch, 
  MessageSquare, 
  FileText, 
  GraduationCap, 
  CheckSquare, 
  FileCheck, 
  BookMarked, 
  FolderArchive,
  Users,
  CalendarCheck,
  ClipboardCheck,
  Scale
} from 'lucide-react';

export default function Sidebar({ 
  currentRole, 
  activePage, 
  onPageChange, 
  activeStudent, 
  counts = {} 
}) {
  const jenjang = activeStudent?.jenjang || 'S1';
  const istilahTA = jenjang === 'D3' ? 'Laporan Tugas Akhir' 
                  : jenjang === 'S1' ? 'Skripsi' 
                  : jenjang === 'S2' ? 'Tesis' 
                  : 'Disertasi';

  // Define navigation items per role
  const getNavItems = () => {
    if (currentRole === 'mahasiswa') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'profil-ta', label: istilahTA, icon: BookOpen },
        { id: 'tahapan', label: 'Tahapan Akademik', icon: GitBranch },
        { id: 'bimbingan', label: 'Bimbingan', icon: MessageSquare, badge: counts.bimbingan || 0 },
        { id: 'naskah', label: 'Naskah ' + (jenjang === 'S3' ? 'Disertasi' : istilahTA), icon: FileText },
        { id: 'ujian', label: jenjang === 'S3' ? 'Ujian & Sidang' : 'Sidang ' + istilahTA, icon: GraduationCap },
        ...(jenjang === 'S3' ? [{ id: 'kelayakan-s3', label: 'Ujian Kelayakan (Desk Review)', icon: Scale }] : []),
        { id: 'revisi', label: 'Matriks Revisi', icon: CheckSquare, badge: counts.revisiPending || 0 },
        { id: 'persyaratan', label: 'Persyaratan Ujian', icon: FileCheck },
        { id: 'publikasi', label: 'Publikasi Ilmiah', icon: BookMarked },
        { id: 'dokumen', label: 'Pusat Dokumen', icon: FolderArchive }
      ];
    }

    if (currentRole === 'dosen') {
      const istilahDosen = jenjang === 'S3' ? 'Promotor' : 'Pembimbing';
      return [
        { id: 'dashboard-dosen', label: 'Dashboard ' + istilahDosen, icon: LayoutDashboard },
        { id: 'bimbingan-dosen', label: 'Mahasiswa Bimbingan', icon: Users, badge: 4 },
        { id: 'naskah-dosen', label: 'Review Naskah', icon: FileText, badge: 2 },
        { id: 'revisi-dosen', label: 'Approval Revisi', icon: CheckSquare, badge: 1 },
        { id: 'dokumen-dosen', label: 'Dokumen & Pengesahan', icon: FolderArchive }
      ];
    }

    if (currentRole === 'koorprodi') {
      return [
        { id: 'dashboard-koorprodi', label: 'Dashboard Koorprodi', icon: LayoutDashboard },
        { id: 'daftar-mahasiswa', label: 'Monitoring Mahasiswa', icon: Users },
        { id: 'pengajuan-ujian', label: 'Pengajuan Ujian & Sidang', icon: CalendarCheck, badge: 3 },
        { id: 'penetapan-penguji', label: 'Susunan Dewan Penguji', icon: Scale },
        { id: 'verifikasi-kelayakan', label: 'Verifikasi Kelayakan / TAKK', icon: FileCheck },
        { id: 'dokumen-koorprodi', label: 'Arsip Berita Acara', icon: FolderArchive }
      ];
    }

    if (currentRole === 'penguji') {
      return [
        { id: 'dashboard-penguji', label: 'Dashboard Penguji', icon: LayoutDashboard },
        { id: 'jadwal-ujian-penguji', label: 'Jadwal Ujian Masuk', icon: CalendarCheck, badge: 2 },
        { id: 'penilaian-ujian', label: 'Form Penilaian Ujian', icon: ClipboardCheck },
        { id: 'revisi-penguji', label: 'Verifikasi Catatan Revisi', icon: CheckSquare, badge: 1 }
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <aside className="app-sidebar" aria-label="Navigasi Menu Utama">
      <div className="sidebar-user-card">
        {currentRole === 'mahasiswa' && activeStudent && (
          <>
            <span className="sidebar-user-role">Mahasiswa {activeStudent.jenjang}</span>
            <div className="sidebar-user-name" title={activeStudent.nama}>{activeStudent.nama}</div>
            <div className="sidebar-user-sub">NIM. {activeStudent.nim}</div>
            <div className="sidebar-user-sub">{activeStudent.programStudi}</div>
          </>
        )}

        {currentRole === 'dosen' && (
          <>
            <span className="sidebar-user-role">Dosen Pembimbing / Promotor</span>
            <div className="sidebar-user-name">Prof. Dr. Pribanus Wantara, Drs., M.M.</div>
            <div className="sidebar-user-sub">NIP. 196306231989031002</div>
            <div className="sidebar-user-sub">Jurusan Manajemen FEB UTM</div>
          </>
        )}

        {currentRole === 'koorprodi' && (
          <>
            <span className="sidebar-user-role">Koordinator Program Studi</span>
            <div className="sidebar-user-name">Dr. Faidal, S.E., M.M.</div>
            <div className="sidebar-user-sub">NIP. 197405102008121001</div>
            <div className="sidebar-user-sub">Koorprodi Jurusan Manajemen</div>
          </>
        )}

        {currentRole === 'penguji' && (
          <>
            <span className="sidebar-user-role">Dewan Penguji Ujian</span>
            <div className="sidebar-user-name">Dr. Dra. Hj. Iriani Ismail, M.M.</div>
            <div className="sidebar-user-sub">NIP. 196201081987032001</div>
            <div className="sidebar-user-sub">Penguji Ujian / DPA FEB UTM</div>
          </>
        )}
      </div>

      <div className="sidebar-nav-section-title">Menu Utama</div>
      <ul className="sidebar-nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <li key={item.id} className="sidebar-nav-item">
              <button
                type="button"
                className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => onPageChange(item.id)}
                style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="sidebar-nav-badge">{item.badge}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
