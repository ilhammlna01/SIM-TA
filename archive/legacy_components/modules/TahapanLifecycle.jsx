import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { PROGRAM_STUDI_INFO } from '../../data/pedomanRules';
import { 
  GitBranch, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  Users, 
  ArrowRight,
  ShieldAlert,
  Scale
} from 'lucide-react';

export default function TahapanLifecycle({ student, onNavigate }) {
  const infoProdi = PROGRAM_STUDI_INFO[student.jenjang];
  const tahapanList = infoProdi?.tahapan || [];
  
  const [selectedTahapId, setSelectedTahapId] = useState(student.tahapAktifId);
  const currentIdx = tahapanList.findIndex(t => t.id === student.tahapAktifId);
  const selectedTahap = tahapanList.find(t => t.id === selectedTahapId) || tahapanList[0];
  const selectedIdx = tahapanList.findIndex(t => t.id === selectedTahapId);

  const getStatusOfStep = (idx) => {
    if (idx < currentIdx) return { label: 'Selesai & Disahkan', type: 'success' };
    if (idx === currentIdx) return { label: student.statusTahap, type: 'warning' };
    return { label: 'Menunggu Tahap Sebelumnya', type: 'neutral' };
  };

  return (
    <div className="module-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alur & Tahapan Akademik {infoProdi?.istilahTA}</h1>
          <p className="page-subtitle">
            Lifecycle resmi berdasarkan Buku Pedoman Tugas Akhir Jurusan Manajemen FEB UTM (2026)
          </p>
        </div>
      </div>

      {/* Progress Timeline Header */}
      <div className="admin-panel">
        <div className="panel-body">
          <ol className="academic-timeline">
            {tahapanList.map((step, idx) => {
              const isCompleted = idx < currentIdx;
              const isActive = idx === currentIdx;
              const isSelected = step.id === selectedTahapId;
              return (
                <li 
                  key={step.id} 
                  className={`timeline-step ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}
                  onClick={() => setSelectedTahapId(step.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div 
                    className="timeline-node" 
                    style={isSelected ? { outline: '2px solid var(--utm-navy-900)', outlineOffset: '2px' } : {}}
                  >
                    {isCompleted ? <CheckCircle2 size={14} /> : idx + 1}
                  </div>
                  <span className="timeline-label" style={isSelected ? { color: 'var(--utm-navy-900)', textDecoration: 'underline' } : {}}>
                    {step.nama}
                  </span>
                  <span className="timeline-subtext">
                    {isCompleted ? 'Selesai' : isActive ? 'Aktif' : 'Menunggu'}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Detail Tahap Terpilih */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <GitBranch size={16} />
            Rincian Tahap {selectedIdx + 1}: {selectedTahap.nama}
          </span>
          <StatusBadge {...getStatusOfStep(selectedIdx)} />
        </div>
        <div className="panel-body">
          <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '4px', marginBottom: '20px' }}>
            <div className="metadata-label">Deskripsi & Tujuan Tahapan</div>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1.5' }}>
              {selectedTahap.deskripsi}
            </p>
          </div>

          <div className="metadata-grid" style={{ marginBottom: '20px' }}>
            <div className="metadata-item">
              <span className="metadata-label">Pihak yang Terlibat</span>
              <span className="metadata-value">
                {student.jenjang === 'S3' 
                  ? selectedTahap.nama.includes('Kelayakan') 
                    ? 'Dewan Pertimbangan Akademik (DPA) & Promotor (3 Penilai Desk Review)'
                    : selectedTahap.nama.includes('Tertutup')
                      ? '7 Orang Dewan Penguji (1 Pemimpin, 2 Promotor, 3 Penguji UTM, 1 Penguji Luar)'
                      : 'Promotor, Kopromotor & Dewan Penguji Disertasi'
                  : selectedTahap.nama.includes('Seminar') || selectedTahap.nama.includes('Sidang')
                    ? `${infoProdi?.pengujiCount || 3} Orang Dewan Penguji (Ketua/Pembimbing + Penguji Ahli)`
                    : 'Mahasiswa dan Dosen Pembimbing'}
              </span>
            </div>

            <div className="metadata-item">
              <span className="metadata-label">Format Evaluasi & Waktu</span>
              <span className="metadata-value">
                {selectedTahap.isDeskReview 
                  ? 'Desk Review (Penelaahan Dokumen Fisik 7 Rangkap)' 
                  : infoProdi?.alokasiWaktuUjian 
                    ? `Sidang Lisan / Presentasi (${infoProdi.alokasiWaktuUjian})` 
                    : 'Bimbingan Berkala'}
              </span>
            </div>

            <div className="metadata-item">
              <span className="metadata-label">Standar Kelulusan & Nilai</span>
              <span className="metadata-value highlight">
                {student.jenjang === 'S3'
                  ? selectedTahap.nama.includes('Kelayakan')
                    ? 'Sekurang-kurangnya 2 dari 3 penguji menyatakan layak & NA >= 70'
                    : 'Nilai Akhir (NA) >= 70'
                  : student.jenjang === 'S2'
                    ? 'Minimal Nilai B (Sesuai Berita Acara)'
                    : 'Minimal Nilai C (Rentang 0-100 dikonversi)'}
              </span>
            </div>

            <div className="metadata-item">
              <span className="metadata-label">Batas Waktu Perbaikan / Revisi</span>
              <span className="metadata-value">
                {student.jenjang === 'S3' && selectedTahap.nama.includes('Tertutup')
                  ? 'Maksimal 6 Bulan sejak Ujian Tertutup'
                  : 'Maksimal 3 Bulan sejak tanggal ujian'}
              </span>
            </div>
          </div>

          {/* Persyaratan Khusus Tahapan Berdasarkan Pedoman */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <span className="metadata-label" style={{ marginBottom: '8px', display: 'block' }}>
              Dokumen & Persyaratan Resmi Tahap Ini
            </span>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Nama Persyaratan / Dokumen</th>
                  <th style={{ width: '45%' }}>Ketentuan Sumber (Pedoman 2026)</th>
                  <th style={{ width: '20%' }} className="text-center">Status Pemenuhan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600' }}>Naskah Draft Laporan / Proposal</td>
                  <td>
                    {student.jenjang === 'S3' 
                      ? 'Draf naskah 7 rangkap yang telah disetujui Promotor & Kopromotor' 
                      : student.jenjang === 'S2' 
                        ? 'Draf tesis 5 rangkap disetujui kedua pembimbing & Koorprodi'
                        : 'Naskah laporan yang disetujui tertulis oleh pembimbing'}
                  </td>
                  <td className="text-center">
                    <StatusBadge status="Terpenuhi" type="success" />
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Surat Keterangan Pemeriksaan Plagiasi</td>
                  <td>
                    {student.jenjang === 'S3' || student.jenjang === 'S2'
                      ? 'Tingkat kemiripan (Turnitin) <= 20% dan AI <= 30% (Peraturan Rektor No. 46/2025)'
                      : 'Tingkat kemiripan (Turnitin) <= 30% dan AI <= 40%'}
                  </td>
                  <td className="text-center">
                    <StatusBadge status="Terpenuhi" type="success" />
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Persetujuan Pembimbing / Promotor</td>
                  <td>Tanda tangan persetujuan resmi maju tahapan oleh seluruh pembimbing</td>
                  <td className="text-center">
                    <StatusBadge status="Disetujui" type="success" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Contextual */}
          {selectedTahap.id === student.tahapAktifId && (
            <div style={{ marginTop: '20px', padding: '12px 16px', background: '#eff6ff', border: '1px solid var(--border-info)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12.5px', color: '#1e40af' }}>
                Ini adalah tahapan aktif mahasiswa saat ini. Seluruh progres dan dokumen diproses pada tahap ini.
              </div>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate(student.jenjang === 'S3' && selectedTahap.id === 'tahap-4' ? 'kelayakan-s3' : 'ujian')}
              >
                Buka Modul {selectedTahap.nama} <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
