import React from 'react';

export default function Topbar({ 
  currentRole, 
  onRoleChange, 
  currentStudentId, 
  onStudentChange, 
  students 
}) {
  return (
    <header className="app-topbar">
      <div className="topbar-branding">
        <img 
          src="/logo-utm.png" 
          alt="Logo Universitas Trunojoyo Madura" 
          className="topbar-logo" 
        />
        <div className="topbar-title-group">
          <span className="topbar-system-name">Sistem Pengelolaan Tugas Akhir</span>
          <span className="topbar-institution-name">
            Jurusan Manajemen — Fakultas Ekonomi dan Bisnis UTM (2026)
          </span>
        </div>
      </div>

      <div className="topbar-controls">
        {/* Role Demo Switcher */}
        <div className="role-switcher-box">
          <span className="role-label">Lihat Sebagai:</span>
          <select 
            className="role-select" 
            value={currentRole} 
            onChange={(e) => onRoleChange(e.target.value)}
            aria-label="Pilih Role Pengguna"
          >
            <option value="mahasiswa">Mahasiswa</option>
            <option value="dosen">Dosen Pembimbing / Promotor</option>
            <option value="koorprodi">Koorprodi</option>
            <option value="penguji">Dewan Penguji</option>
          </select>
        </div>

        {/* Student Persona Switcher (visible for student role or for testing student contexts) */}
        {currentRole === 'mahasiswa' && (
          <div className="role-switcher-box">
            <span className="role-label">Data Demo:</span>
            <select 
              className="student-persona-select"
              value={currentStudentId}
              onChange={(e) => onStudentChange(e.target.value)}
              aria-label="Pilih Data Demo Mahasiswa"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  [{st.jenjang}] {st.nama.split(',')[0]} — {st.tahapAktifNama}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ fontSize: '11px', color: '#94a3b8', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '12px' }}>
          Semester Ganjil 2026/2027
        </div>
      </div>
    </header>
  );
}
