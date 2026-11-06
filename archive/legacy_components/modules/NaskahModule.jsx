import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { PROGRAM_STUDI_INFO } from '../../data/pedomanRules';
import { FileText, Download, CheckCircle, AlertCircle, Clock, BookOpen, Layers } from 'lucide-react';

export default function NaskahModule({ student }) {
  const infoProdi = PROGRAM_STUDI_INFO[student.jenjang];
  const sistematika = infoProdi?.sistematika || [];

  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'sistematika'
  const [selectedBab, setSelectedBab] = useState(sistematika[1] || sistematika[0]);

  return (
    <div className="module-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Naskah {infoProdi?.istilahTA}</h1>
          <p className="page-subtitle">
            Pusat penelaahan dokumen naskah akademik sesuai format resmi Jurusan Manajemen FEB UTM (2026)
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => alert('Mengunduh draft naskah resmi...')}>
            <Download size={14} /> Unduh Naskah Final (PDF)
          </button>
        </div>
      </div>

      {/* Baris Tab Navigasi Naskah */}
      <div className="admin-tabs" style={{ marginBottom: '18px' }}>
        <button 
          type="button" 
          className={`admin-tab ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          Penelaahan Naskah (Split Preview)
        </button>
        <button 
          type="button" 
          className={`admin-tab ${activeTab === 'sistematika' ? 'active' : ''}`}
          onClick={() => setActiveTab('sistematika')}
        >
          Sistematika Penulisan Resmi Jenjang {student.jenjang}
        </button>
      </div>

      {activeTab === 'review' ? (
        <>
          {/* Metadata Berkas Naskah */}
          <div className="admin-panel" style={{ marginBottom: '16px' }}>
            <div className="panel-body" style={{ padding: '12px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={24} style={{ color: 'var(--utm-navy-800)' }} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--utm-navy-950)' }}>
                      Draf_Naskah_{student.jenjang}_{student.nim}_Versi_Final.pdf
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Versi: 2.4 • Diunggah: 26 September 2026 • Ukuran: 4.8 MB • Pengunggah: {student.nama}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StatusBadge status="Disetujui Pembimbing" type="success" />
                </div>
              </div>
            </div>
          </div>

          {/* Split Review Layout */}
          <div className="split-review-container">
            {/* Panel Kiri: Document Sheet Preview */}
            <div className="doc-preview-panel">
              <div className="academic-paper-sheet">
                <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' }}>
                  UNIVERSITAS TRUNOJOYO MADURA<br />
                  FAKULTAS EKONOMI DAN BISNIS — JURUSAN MANAJEMEN
                </div>
                <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '8px 0 16px' }} />
                
                <div className="paper-title">
                  {student.judul}
                </div>

                <div className="paper-author">
                  Oleh:<br />
                  <strong>{student.nama}</strong><br />
                  NIM. {student.nim}<br />
                  Program Studi {student.programStudi}
                </div>

                <div className="paper-abstract">
                  <strong>ABSTRAK</strong><br />
                  Penelitian ini bertujuan untuk menganalisis dan menguji model determinan kapabilitas dinamis (dynamic capabilities) dalam memperkuat ketahanan usaha mikro, kecil, dan menengah (UMKM) di wilayah Madura. Dengan mengintegrasikan orientasi inovasi digital sebagai variabel mediasi serta nilai-nilai kearifan lokal (local wisdom), riset ini menyajikan kontribusi epistemologis dan praktis terhadap literatur manajemen stratejik. Data empiris dikumpulkan melalui survei terstruktur dan dianalisis menggunakan pemodelan persamaan struktural berbasis varian (PLS-SEM).
                </div>

                <div className="paper-body-text">
                  <strong>BAB I PENDAHULUAN</strong><br />
                  <strong>1.1 Latar Belakang</strong><br />
                  Lanskap persaingan bisnis pada era ekonomi digital menuntut entitas usaha untuk secara lincah mengkonfigurasi ulang sumber daya internal mereka. Pada konteks perekonomian lokal Madura, sektor usaha mikro menghadapi tantangan ganda berupa disrupsi teknologi dan ketidakpastian pasar. Teori berbasis sumber daya (Resource-Based View) dan pendekatan Dynamic Capabilities dari Teece (2018) menegaskan bahwa keunggulan bersaing berkelanjutan hanya dapat dicapai melalui kapasitas penginderaan (sensing), perebutan peluang (seizing), serta transformasi berkala.
                </div>
              </div>
            </div>

            {/* Panel Kanan: Catatan Telaah Akademik & Riwayat Versi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="admin-panel">
                <div className="panel-header">
                  <span className="panel-title">
                    <BookOpen size={16} />
                    Catatan Telaah Tim Pembimbing / Penguji
                  </span>
                </div>
                <div className="panel-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '10px 12px', background: '#f8fafc', borderLeft: '3px solid var(--utm-navy-800)', borderRadius: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <strong>{student.pembimbing[0]?.nama}</strong>
                        <span>22 Sept 2026</span>
                      </div>
                      <div style={{ fontSize: '12.5px', marginTop: '4px', color: 'var(--text-primary)' }}>
                        Sistematika BAB IV telah memadukan temuan kualitatif dengan output estimasi model statistik. Format sitasi Mendeley telah rapi.
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', background: '#f8fafc', borderLeft: '3px solid var(--utm-gold-500)', borderRadius: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <strong>Dr. Dra. Hj. Iriani Ismail, M.M.</strong>
                        <span>24 Sept 2026</span>
                      </div>
                      <div style={{ fontSize: '12.5px', marginTop: '4px', color: 'var(--text-primary)' }}>
                        Pastikan tabel 3.1 mengenai profil sampel perusahaan dan matriks uji validitas diskriminan dipertahankan sesuai pedoman.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Riwayat Versi Naskah */}
              <div className="admin-panel">
                <div className="panel-header">
                  <span className="panel-title">
                    <Layers size={16} />
                    Riwayat Versi Naskah Terunggah
                  </span>
                </div>
                <div className="panel-body no-padding">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Versi</th>
                        <th>Tanggal Unggah</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>v2.4 (Terbaru)</strong></td>
                        <td>26 Sept 2026</td>
                        <td><StatusBadge status="Aktif Digunakan" type="success" /></td>
                      </tr>
                      <tr>
                        <td>v2.1</td>
                        <td>12 Sept 2026</td>
                        <td><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Arsip Draft</span></td>
                      </tr>
                      <tr>
                        <td>v1.0 (Proposal Awal)</td>
                        <td>15 Agu 2026</td>
                        <td><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Arsip Proposal</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Tab Sistematika Penulisan Resmi Berdasarkan Jenjang */
        <div className="admin-panel">
          <div className="panel-header">
            <span className="panel-title">
              <BookOpen size={16} />
              Struktur & Sistematika Penulisan {infoProdi?.istilahTA} ({infoProdi?.jenjang})
            </span>
            <span className="panel-subtitle">Buku Pedoman BAB III - VI</span>
          </div>
          <div className="panel-body">
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Pedoman Tugas Akhir Jurusan Manajemen FEB UTM menetapkan struktur penulisan yang spesifik untuk setiap jenjang. Mahasiswa wajib mematuhi susunan bab berikut:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
              {sistematika.map((item, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '14px',
                    background: '#f8fafc',
                    border: '1px solid var(--border-light)',
                    borderLeft: '4px solid var(--utm-navy-800)',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--utm-navy-900)' }}>
                    {item.no}: {item.judul}
                  </div>
                  <ul style={{ paddingLeft: '18px', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {item.sub.map((sub, sIdx) => (
                      <li key={sIdx} style={{ marginBottom: '3px' }}>{sub}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
