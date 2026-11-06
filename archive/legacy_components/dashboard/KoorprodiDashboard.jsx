import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { 
  Users, 
  Filter, 
  CalendarCheck, 
  Scale, 
  FileCheck, 
  Search, 
  ArrowRight,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

export default function KoorprodiDashboard({ 
  students, 
  onSelectStudent, 
  onOpenDetailModal,
  onNavigate 
}) {
  const [filterJenjang, setFilterJenjang] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = students.filter(st => {
    const matchJenjang = filterJenjang === 'ALL' || st.jenjang === filterJenjang;
    const matchSearch = st.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        st.nim.includes(searchQuery) ||
                        st.judul.toLowerCase().includes(searchQuery.toLowerCase());
    return matchJenjang && matchSearch;
  });

  return (
    <div className="dashboard-content">
      {/* Header Institusional Koorprodi */}
      <div className="admin-panel" style={{ borderLeft: '4px solid var(--utm-navy-900)' }}>
        <div className="panel-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="metadata-label">Pengawasan Akademik Program Studi</span>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--utm-navy-950)', margin: '4px 0' }}>
                Koordinator Program Studi — Jurusan Manajemen FEB UTM
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Pejabat: Dr. Faidal, S.E., M.M. • NIP. 197405102008121001 • Mengawasi D-III, S-1, S-2, dan S-3
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Mahasiswa Terdaftar</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--utm-navy-900)' }}>
                  {students.length} Mahasiswa
                </div>
              </div>
              <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-light)', paddingLeft: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pengajuan Ujian Menunggu</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-warning)' }}>
                  3 Pengajuan
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan Administrasi Ujian Masuk */}
      <div className="admin-panel" style={{ borderLeft: '4px solid var(--color-info)' }}>
        <div className="panel-header" style={{ background: 'var(--bg-info)' }}>
          <span className="panel-title" style={{ color: '#1e3a8a' }}>
            <CalendarCheck size={16} />
            Antrean Pengajuan Ujian & Penetapan Susunan Dewan Penguji
          </span>
          <span className="panel-subtitle" style={{ color: '#1e40af' }}>
            Berdasarkan Buku Pedoman 2026: Koorprodi menentukan susunan penguji dan mengusulkan SK Dekan
          </span>
        </div>
        <div className="panel-body no-padding">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mahasiswa & Jenjang</th>
                <th>Jenis Ujian Diajukan</th>
                <th>Status Persyaratan</th>
                <th>Komposisi Dewan Penguji</th>
                <th style={{ width: '130px' }} className="text-center">Aksi Koorprodi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ fontWeight: '600' }}>Dinda Ayu Larasati (S1)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NIM: 210211100142 • S-1 Manajemen</div>
                </td>
                <td>
                  <span style={{ fontWeight: '600' }}>Seminar Proposal Skripsi</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Draft BAB I - III Disetujui Pembimbing</div>
                </td>
                <td>
                  <StatusBadge status="Lengkap (IPK 3.65, TOEFL 480, Turnitin 19%)" type="success" />
                </td>
                <td>
                  <div style={{ fontSize: '11.5px' }}>
                    3 Orang: Pembimbing (Ketua) + 2 Penguji Utama
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '600' }}>
                    Jadwal Ditetapkan (14 Okt 2026)
                  </div>
                </td>
                <td className="text-center">
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectStudent('mhs-s1-takt')}
                  >
                    Detail Berkas
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <div style={{ fontWeight: '600' }}>Rahmat Hidayat, S.E. (S2)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NIM: 230221600018 • S-2 Magister Manajemen</div>
                </td>
                <td>
                  <span style={{ fontWeight: '600' }}>Sidang Tesis</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Draft 5 Rangkap Diserahkan</div>
                </td>
                <td>
                  <StatusBadge status="Lengkap (38 SKS, TOEFL 510, SINTA 2)" type="success" />
                </td>
                <td>
                  <div style={{ fontSize: '11.5px' }}>
                    4 Orang: Pembimbing I, Pembimbing II (Pemimpin Sidang), 2 Penguji
                  </div>
                </td>
                <td className="text-center">
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectStudent('mhs-s2')}
                  >
                    Verifikasi SK
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <div style={{ fontWeight: '600' }}>Bambang Suryo Utomo (S3)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NIM: 220231600004 • S-3 Ilmu Manajemen</div>
                </td>
                <td>
                  <span style={{ fontWeight: '600' }}>Hasil Ujian Kelayakan Disertasi</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Desk Review DPA & Pembimbing Selesai</div>
                </td>
                <td>
                  <StatusBadge status="Layak Revisi Minor (NA = 75.67)" type="success" />
                </td>
                <td>
                  <div style={{ fontSize: '11.5px' }}>
                    3 Orang Penilai Kelayakan (2 dari 3 Layak &amp; NA &ge; 70)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '600' }}>
                    Syarat Kelayakan Terpenuhi
                  </div>
                </td>
                <td className="text-center">
                  <button 
                    type="button" 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => onSelectStudent('mhs-s3')}
                  >
                    Buka Hasil
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel Pengawasan Seluruh Mahasiswa dengan Filter */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <Users size={16} />
            Daftar Seluruh Mahasiswa Tugas Akhir
          </span>
          <span className="panel-subtitle">Monitoring Status & Beban Studi</span>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-group">
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Jenjang:</span>
            <select 
              className="form-control" 
              style={{ width: '130px', padding: '4px 8px' }}
              value={filterJenjang}
              onChange={(e) => setFilterJenjang(e.target.value)}
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="D3">Diploma (D-III)</option>
              <option value="S1">Sarjana (S-1)</option>
              <option value="S2">Magister (S-2)</option>
              <option value="S3">Doktor (S-3)</option>
            </select>
          </div>

          <div className="search-input-wrapper">
            <Search size={14} className="search-input-icon" />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari nama, NIM, atau judul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="panel-body no-padding">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Jenjang</th>
                  <th>NIM & Mahasiswa</th>
                  <th>Judul Tugas Akhir</th>
                  <th>Pembimbing / Promotor</th>
                  <th>Tahap Aktif</th>
                  <th>Status Akademik</th>
                  <th style={{ width: '130px' }} className="text-center">Detail 360°</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <span className="status-badge neutral">{st.jenjang}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--utm-navy-950)' }}>{st.nama}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{st.nim}</div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '320px', fontSize: '12px' }} title={st.judul}>
                        {st.judul}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {st.bentukTA} {st.skemaTAKK ? `• ${st.skemaTAKK}` : ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {st.pembimbing.map(p => p.nama.split(',')[0]).join(', ')}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{st.tahapAktifNama}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{st.bimbinganCount}x bimbingan</div>
                    </td>
                    <td>
                      <StatusBadge status={st.statusTahap} />
                    </td>
                    <td className="text-center">
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          onSelectStudent(st.id);
                          onNavigate('mhs-detail-360');
                        }}
                      >
                        Buka Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
