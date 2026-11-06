import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { PROGRAM_STUDI_INFO } from '../../data/pedomanRules';
import { 
  AlertTriangle, 
  Clock, 
  FileText, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function MahasiswaDashboard({ 
  student, 
  bimbinganList = [], 
  activities = [], 
  onNavigate 
}) {
  const infoProdi = PROGRAM_STUDI_INFO[student.jenjang];
  const tahapanList = infoProdi?.tahapan || [];
  
  // Find current step index
  const currentIndex = tahapanList.findIndex(t => t.id === student.tahapAktifId);
  const activeStep = tahapanList[currentIndex] || { nama: student.tahapAktifNama, deskripsi: student.statusTahap };
  const prevStep = currentIndex > 0 ? tahapanList[currentIndex - 1] : null;
  const nextStep = currentIndex < tahapanList.length - 1 ? tahapanList[currentIndex + 1] : null;

  return (
    <div className="dashboard-content">
      {/* 1. Header Ringkasan Identitas & Judul */}
      <div className="admin-panel" style={{ borderLeft: '4px solid var(--utm-navy-900)' }}>
        <div className="panel-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--utm-gold-500)', letterSpacing: '0.5px' }}>
                  {infoProdi?.istilahTA} — {infoProdi?.jenjang}
                </span>
                <span style={{ color: 'var(--text-light)' }}>•</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{student.programStudi}</span>
              </div>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--utm-navy-950)', marginBottom: '8px', lineHeight: '1.3' }}>
                {student.judul}
              </h1>
              <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span><strong>NIM:</strong> {student.nim}</span>
                <span><strong>Nama:</strong> {student.nama}</span>
                <span><strong>Bentuk:</strong> {student.bentukTA} {student.skemaTAKK ? `(${student.skemaTAKK})` : ''}</span>
              </div>
            </div>
            <div>
              <StatusBadge status={student.statusTahap} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Progress Indicator Alur Tahapan Akademik */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <Clock size={16} />
            Perjalanan Tahapan Akademik {infoProdi?.istilahTA}
          </span>
          <span className="panel-subtitle">
            Tahap {currentIndex + 1} dari {tahapanList.length}: {activeStep.nama}
          </span>
        </div>
        <div className="panel-body">
          {/* Linear Timeline Node */}
          <ol className="academic-timeline">
            {tahapanList.map((step, idx) => {
              const isCompleted = idx < currentIndex;
              const isActive = idx === currentIndex;
              return (
                <li 
                  key={step.id} 
                  className={`timeline-step ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}
                >
                  <div className="timeline-node">
                    {isCompleted ? <CheckCircle2 size={14} /> : idx + 1}
                  </div>
                  <span className="timeline-label">{step.nama}</span>
                  <span className="timeline-subtext">
                    {isCompleted ? 'Selesai' : isActive ? 'Sedang Aktif' : 'Berikutnya'}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* Structured Triad Overview: Tahap Sebelumnya, Saat Ini, Berikutnya */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginTop: '16px', background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tahap Sebelumnya</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: prevStep ? 'var(--utm-navy-900)' : 'var(--text-light)', marginTop: '2px' }}>
                {prevStep ? prevStep.nama : 'Awal Proses'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {prevStep ? 'Telah diselesaikan dan disahkan' : 'Memulai pendaftaran tugas akhir'}
              </div>
            </div>

            <div style={{ borderLeft: '2px solid var(--utm-gold-500)', paddingLeft: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--utm-gold-500)', textTransform: 'uppercase' }}>Tahap Saat Ini (Aktif)</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--utm-navy-950)', marginTop: '2px' }}>
                {activeStep.nama}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                {activeStep.deskripsi}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tahap Berikutnya</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: nextStep ? 'var(--utm-navy-900)' : 'var(--text-light)', marginTop: '2px' }}>
                {nextStep ? nextStep.nama : 'Selesai & Wisuda'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {nextStep ? nextStep.deskripsi : 'Seluruh proses akademik tuntas'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Area Perlu Perhatian (Action Items Mahasiswa) */}
      {student.perluPerhatian && student.perluPerhatian.length > 0 && (
        <div className="admin-panel" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div className="panel-header" style={{ background: 'var(--bg-warning)' }}>
            <span className="panel-title" style={{ color: '#78350f' }}>
              <AlertTriangle size={16} />
              Perlu Perhatian & Tindak Lanjut Mahasiswa
            </span>
            <span style={{ fontSize: '11.5px', color: '#92400e' }}>
              {student.perluPerhatian.length} tindakan diperlukan
            </span>
          </div>
          <div className="panel-body" style={{ padding: '12px 18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {student.perluPerhatian.map((act) => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertCircle size={15} style={{ color: act.tipe === 'warning' ? 'var(--color-warning)' : 'var(--color-info)' }} />
                    <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: '500' }}>{act.deskripsi}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Batas: <strong>{act.deadline}</strong></span>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => onNavigate(student.jenjang === 'S3' ? 'kelayakan-s3' : 'revisi')}
                    >
                      Buka Rincian
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Grid 2 Kolom: Bimbingan & Pemeriksaan Turnitin / Plagiasi */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* Panel Bimbingan */}
        <div className="admin-panel">
          <div className="panel-header">
            <span className="panel-title">
              <MessageSquare size={16} />
              Bimbingan Akademik
            </span>
            <button 
              type="button" 
              className="btn btn-outline-primary btn-sm"
              onClick={() => onNavigate('bimbingan')}
            >
              Log Bimbingan <ArrowRight size={13} />
            </button>
          </div>
          <div className="panel-body">
            <div style={{ marginBottom: '12px' }}>
              <div className="metadata-label">
                {student.jenjang === 'S3' ? 'Promotor & Kopromotor' : 'Dosen Pembimbing'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                {student.pembimbing.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', padding: '6px 8px', background: '#f8fafc', borderRadius: '3px', border: '1px solid var(--border-light)' }}>
                    <div>
                      <strong>{p.peran}:</strong> {p.nama}
                    </div>
                    <span style={{ color: 'var(--color-success)', fontSize: '11.5px', fontWeight: '600' }}>
                      {p.statusSetuju ? 'Disetujui' : 'Menunggu'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '10px 0', borderTop: '1px solid var(--border-light)' }}>
              <div>
                <span className="metadata-label">Total Sesi Bimbingan</span>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--utm-navy-900)' }}>
                  {student.bimbinganCount} Pertemuan
                </div>
              </div>
              <div>
                <span className="metadata-label">Sesi Terakhir</span>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {student.sesiTerakhirBimbingan}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Turnitin & Deteksi AI (Ketentuan Rektor No 46/2025) */}
        <div className="admin-panel">
          <div className="panel-header">
            <span className="panel-title">
              <ShieldCheck size={16} />
              Pemeriksaan Plagiasi & AI (Turnitin)
            </span>
            <StatusBadge status="Terverifikasi" type="success" />
          </div>
          <div className="panel-body">
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Mengacu Peraturan Rektor UTM No. 46 Tahun 2025 (Pengecekan di Jurusan Manajemen, tidak mencakup daftar pustaka & lampiran).
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                <span className="metadata-label">Similarity Index</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: student.turnitin.similarity <= infoProdi?.turnitinSimilarityMax ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {student.turnitin.similarity}%
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Maks {infoProdi?.turnitinSimilarityMax}%
                  </span>
                </div>
              </div>

              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                <span className="metadata-label">Deteksi Konten AI</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: student.turnitin.aiDetection <= infoProdi?.turnitinAiMax ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {student.turnitin.aiDetection}%
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Maks {infoProdi?.turnitinAiMax}%
                  </span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <div><strong>No. Surat:</strong> {student.turnitin.suratKeteranganNo}</div>
              <div><strong>Tanggal Pemeriksaan:</strong> {student.turnitin.tanggalPeriksa}</div>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Riwayat Aktivitas Akademik Chronological */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <Calendar size={16} />
            Catatan Kronologis Aktivitas Akademik
          </span>
          <span className="panel-subtitle">Berdasarkan proses resmi di Jurusan Manajemen</span>
        </div>
        <div className="panel-body no-padding">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>Tanggal</th>
                <th style={{ width: '280px' }}>Aktivitas / Kejadian</th>
                <th>Keterangan Resmi</th>
              </tr>
            </thead>
            <tbody>
              {activities
                .filter(a => a.mhsId === student.id)
                .map((act, index) => (
                  <tr key={index}>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {act.tanggal}
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--utm-navy-950)' }}>
                      {act.judul}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {act.deskripsi}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
