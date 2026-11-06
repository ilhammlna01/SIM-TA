import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { 
  ClipboardCheck, 
  FileText, 
  CheckSquare, 
  Calendar, 
  ArrowRight,
  Scale
} from 'lucide-react';

export default function PengujiDashboard({ 
  onSelectStudent, 
  onNavigate 
}) {
  return (
    <div className="dashboard-content">
      {/* Banner Dosen Penguji */}
      <div className="admin-panel" style={{ borderLeft: '4px solid var(--utm-navy-900)' }}>
        <div className="panel-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="metadata-label">Portal Dewan Penguji Ujian</span>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--utm-navy-950)', margin: '4px 0' }}>
                Dr. Dra. Hj. Iriani Ismail, M.M.
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                NIP. 196201081987032001 • Dewan Penguji & Dewan Pertimbangan Akademik Pascasarjana FEB UTM
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tugas Ujian Aktif</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--utm-navy-900)' }}>
                2 Sidang / Ujian
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Utama: Daftar Ujian & Mahasiswa yang Diuji */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <ClipboardCheck size={16} />
            Daftar Ujian Tugas Akhir yang Ditugaskan
          </span>
          <span className="panel-subtitle">Berdasarkan SK Dekan / Penetapan Koorprodi</span>
        </div>
        <div className="panel-body no-padding">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Jadwal & Ruang</th>
                <th>Mahasiswa & Jenjang</th>
                <th>Jenis Ujian</th>
                <th>Peran dalam Dewan</th>
                <th>Status Berkas Naskah</th>
                <th style={{ width: '150px' }} className="text-center">Form Penilaian</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ fontWeight: '600', color: 'var(--utm-navy-950)' }}>Senin, 14 Okt 2026</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>09.00 - 10.30 WIB (90 Menit)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Ruang Sidang Lt. 2</div>
                </td>
                <td>
                  <div style={{ fontWeight: '600' }}>Dinda Ayu Larasati (S1)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NIM: 210211100142 • S-1 Manajemen</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    "Pengaruh Live Commerce Interactive Features..."
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: '600' }}>Seminar Proposal Skripsi</span>
                </td>
                <td>
                  <span className="status-badge info">Penguji Utama</span>
                </td>
                <td>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-success)', fontWeight: '600' }}>
                    Naskah BAB I–III Lengkap
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Turnitin: 19% • AI: 24%</div>
                </td>
                <td className="text-center">
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      onSelectStudent('mhs-s1-takt');
                      onNavigate('penilaian-ujian');
                    }}
                  >
                    Buka Form Nilai
                  </button>
                </td>
              </tr>

              <tr>
                <td>
                  <div style={{ fontWeight: '600', color: 'var(--utm-navy-950)' }}>Desk Review Selesai</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Penetapan: 24 Sept 2026</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>S-3 Pascasarjana</div>
                </td>
                <td>
                  <div style={{ fontWeight: '600' }}>Bambang Suryo Utomo, S.E., M.M. (S3)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NIM: 220231600004 • S-3 Ilmu Manajemen</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    "Model Determinan Dynamic Capabilities..."
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: '600' }}>Ujian Kelayakan Disertasi</span>
                </td>
                <td>
                  <span className="status-badge info">Penilai II (Kopromotor/DPA)</span>
                </td>
                <td>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-success)', fontWeight: '600' }}>
                    Nilai Kelayakan: 75.00
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Layak Revisi Minor</div>
                </td>
                <td className="text-center">
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onSelectStudent('mhs-s3');
                      onNavigate('revisi-penguji');
                    }}
                  >
                    Cek Revisi
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Catatan dan Kode Etik Penilai */}
      <div className="admin-panel" style={{ background: '#f8fafc' }}>
        <div className="panel-body">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Scale size={18} style={{ color: 'var(--utm-navy-800)', marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: '600', color: 'var(--utm-navy-950)', marginBottom: '3px' }}>
                Kaidah Penilaian Sesuai Buku Pedoman Tugas Akhir 2026
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Perbedaan penilaian antara penguji satu dengan lainnya tidak boleh lebih dari 10 poin. Jika ada perbedaan lebih dari 10 poin, ketua penguji harus mendiskusikannya dengan para penguji untuk menentukan nilai baru. Masing-masing penguji wajib membuat catatan perbaikan naskah laporan tugas akhir pada lembar yang disediakan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
