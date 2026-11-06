import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { 
  Users, 
  FileText, 
  CheckSquare, 
  ArrowRight, 
  Check, 
  MessageSquare,
  Clock
} from 'lucide-react';

export default function DosenDashboard({ 
  students, 
  onSelectStudent, 
  onNavigate,
  onApproveUjian 
}) {
  return (
    <div className="dashboard-content">
      {/* Banner Selamat Datang Dosen */}
      <div className="admin-panel" style={{ borderLeft: '4px solid var(--utm-navy-900)' }}>
        <div className="panel-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="metadata-label">Portal Dosen Pembimbing & Promotor</span>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--utm-navy-950)', margin: '4px 0' }}>
                Prof. Dr. Pribanus Wantara, Drs., M.M.
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                NIP. 196306231989031002 • Bidang Keahlian: Manajemen Pemasaran & Strategik • Jurusan Manajemen FEB UTM
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Beban Bimbingan Aktif</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--utm-navy-900)' }}>
                {students.length} Mahasiswa
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Utama: Daftar Mahasiswa Bimbingan */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <Users size={16} />
            Daftar Mahasiswa Bimbingan Tugas Akhir
          </span>
          <span className="panel-subtitle">Multi-Jenjang (D3, S1, S2, S3)</span>
        </div>
        <div className="panel-body no-padding">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Jenjang</th>
                  <th>NIM & Nama Mahasiswa</th>
                  <th>Judul Tugas Akhir / Disertasi</th>
                  <th>Tahap Saat Ini</th>
                  <th style={{ width: '90px' }} className="text-center">Sesi</th>
                  <th>Persetujuan Maju Ujian</th>
                  <th style={{ width: '120px' }} className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <span className="status-badge neutral">{st.jenjang}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--utm-navy-950)' }}>{st.nama}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NIM: {st.nim}</div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '340px', fontSize: '12px' }} title={st.judul}>
                        {st.judul}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {st.bentukTA} {st.skemaTAKK ? `• ${st.skemaTAKK}` : ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{st.tahapAktifNama}</div>
                      <StatusBadge status={st.statusTahap} />
                    </td>
                    <td className="text-center">
                      <span style={{ fontWeight: '700', color: 'var(--utm-navy-900)' }}>{st.bimbinganCount}x</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11.5px', color: 'var(--color-success)', fontWeight: '600' }}>
                          Disetujui
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectStudent(st.id)}
                      >
                        Buka Detail <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grid 2 Kolom: Naskah Masuk untuk Review & Tindak Lanjut Revisi */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Naskah Menunggu Review */}
        <div className="admin-panel">
          <div className="panel-header">
            <span className="panel-title">
              <FileText size={16} />
              Naskah Menunggu Review Dosen
            </span>
            <span className="panel-subtitle">2 Draft Baru</span>
          </div>
          <div className="panel-body no-padding">
            <table className="admin-table">
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: '600' }}>Bambang Suryo Utomo, S.E., M.M. (S3)</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Draf Disertasi Revisi Minor Ujian Kelayakan</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-light)', marginTop: '2px' }}>Diunggah: 26 Sept 2026 • 7 Rangkap Fisik di Prodi</div>
                  </td>
                  <td className="text-right">
                    <button 
                      type="button" 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => onNavigate('naskah-dosen')}
                    >
                      Buka Review
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style={{ fontWeight: '600' }}>Dinda Ayu Larasati (S1)</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Proposal Skripsi BAB I - III (Persiapan Sempro)</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-light)', marginTop: '2px' }}>Diunggah: 28 Sept 2026 • Turnitin 19% Terlampir</div>
                  </td>
                  <td className="text-right">
                    <button 
                      type="button" 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => onNavigate('naskah-dosen')}
                    >
                      Buka Review
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tindak Lanjut Revisi Pasca Ujian */}
        <div className="admin-panel">
          <div className="panel-header">
            <span className="panel-title">
              <CheckSquare size={16} />
              Approval Matriks Revisi Mahasiswa
            </span>
            <span className="panel-subtitle">Pasca Ujian / Desk Review</span>
          </div>
          <div className="panel-body no-padding">
            <table className="admin-table">
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: '600' }}>Bambang Suryo Utomo (S3 Disertasi)</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      Revisi BAB II: Teori Resource-Based View & Dinamika UMKM Madura
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '2px' }}>
                      Menunggu verifikasi Promotor sebelum diajukan Ujian Tertutup
                    </div>
                  </td>
                  <td className="text-right">
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => onNavigate('revisi-dosen')}
                    >
                      Verifikasi
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
