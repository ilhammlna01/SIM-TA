import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { PROGRAM_STUDI_INFO } from '../../data/pedomanRules';
import { 
  User, 
  BookOpen, 
  GitBranch, 
  MessageSquare, 
  FileText, 
  GraduationCap, 
  CheckSquare, 
  BookMarked, 
  FolderArchive,
  ArrowLeft
} from 'lucide-react';

export default function MahasiswaDetailView({ 
  student, 
  bimbinganList = [], 
  revisiList = [], 
  dokumenList = [],
  onBack 
}) {
  const infoProdi = PROGRAM_STUDI_INFO[student.jenjang];
  const [activeTab, setActiveTab] = useState('ringkasan');

  const studentBim = bimbinganList.filter(b => b.mhsId === student.id);
  const studentRev = revisiList.filter(r => r.mhsId === student.id);
  const studentDoc = dokumenList.filter(d => d.mhsId === student.id);

  return (
    <div className="module-content">
      <div className="page-header">
        <div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={onBack}
            style={{ marginBottom: '8px' }}
          >
            <ArrowLeft size={13} /> Kembali ke Daftar Monitoring
          </button>
          <h1 className="page-title">Dossier Akademik Terpadu Mahasiswa (360°)</h1>
          <p className="page-subtitle">
            Ringkasan menyeluruh perjalanan tugas akhir mahasiswa untuk Koordinator Program Studi & Dosen
          </p>
        </div>
      </div>

      {/* Profil Header Card */}
      <div className="admin-panel" style={{ borderLeft: '4px solid var(--utm-navy-900)' }}>
        <div className="panel-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="status-badge neutral" style={{ fontSize: '11px', fontWeight: 'bold' }}>
                  {infoProdi?.jenjang}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{student.programStudi}</span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--utm-navy-950)' }}>
                {student.nama}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                NIM: <strong>{student.nim}</strong> • Semester: {student.semester} • IPK: <strong>{student.ipk.toFixed(2)}</strong> • SKS: <strong>{student.sksLulus}</strong> • TOEFL: <strong>{student.toefl}</strong>
              </div>
            </div>
            <div>
              <StatusBadge status={student.statusTahap} />
            </div>
          </div>

          <div style={{ marginTop: '14px', padding: '12px 14px', background: '#f8fafc', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            <span className="metadata-label">Judul {infoProdi?.istilahTA}</span>
            <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--utm-navy-950)', marginTop: '2px' }}>
              {student.judul}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigasi Dossier */}
      <div className="admin-tabs" style={{ marginBottom: '16px' }}>
        <button 
          type="button" 
          className={`admin-tab ${activeTab === 'ringkasan' ? 'active' : ''}`}
          onClick={() => setActiveTab('ringkasan')}
        >
          Ringkasan & Tahapan
        </button>
        <button 
          type="button" 
          className={`admin-tab ${activeTab === 'bimbingan' ? 'active' : ''}`}
          onClick={() => setActiveTab('bimbingan')}
        >
          Riwayat Bimbingan ({studentBim.length})
        </button>
        <button 
          type="button" 
          className={`admin-tab ${activeTab === 'revisi' ? 'active' : ''}`}
          onClick={() => setActiveTab('revisi')}
        >
          Matriks Revisi ({studentRev.length})
        </button>
        <button 
          type="button" 
          className={`admin-tab ${activeTab === 'publikasi' ? 'active' : ''}`}
          onClick={() => setActiveTab('publikasi')}
        >
          Publikasi & Plagiasi
        </button>
        <button 
          type="button" 
          className={`admin-tab ${activeTab === 'dokumen' ? 'active' : ''}`}
          onClick={() => setActiveTab('dokumen')}
        >
          Berkas Dokumen ({studentDoc.length})
        </button>
      </div>

      {/* Konten Berdasarkan Tab */}
      {activeTab === 'ringkasan' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Panel Pembimbing */}
          <div className="admin-panel">
            <div className="panel-header">
              <span className="panel-title">
                <User size={16} />
                Susunan Tim Pembimbing / Promotor
              </span>
            </div>
            <div className="panel-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {student.pembimbing.map((p, idx) => (
                  <div key={idx} style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '3px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--utm-navy-900)' }}>{p.peran}</div>
                    <div style={{ fontSize: '12.5px', fontWeight: '600' }}>{p.nama}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NIP. {p.nip}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel Status Tahapan */}
          <div className="admin-panel">
            <div className="panel-header">
              <span className="panel-title">
                <GitBranch size={16} />
                Status Tahapan Akademik
              </span>
            </div>
            <div className="panel-body">
              <div className="metadata-item" style={{ marginBottom: '12px' }}>
                <span className="metadata-label">Tahapan Saat Ini</span>
                <span className="metadata-value highlight">{student.tahapAktifNama}</span>
              </div>
              <div className="metadata-item" style={{ marginBottom: '12px' }}>
                <span className="metadata-label">Bentuk Karya</span>
                <span className="metadata-value">{student.bentukTA} {student.skemaTAKK ? `(${student.skemaTAKK})` : ''}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Status Tindak Lanjut</span>
                <span className="metadata-value">{student.statusTahap}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bimbingan' && (
        <div className="admin-panel">
          <div className="panel-header">
            <span className="panel-title"><MessageSquare size={16} /> Log Bimbingan</span>
          </div>
          <div className="panel-body no-padding">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Dosen</th>
                  <th>Topik</th>
                  <th>Hasil & Arahan</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {studentBim.map((b) => (
                  <tr key={b.id}>
                    <td>{b.tanggal}</td>
                    <td><strong>{b.dosenNama}</strong></td>
                    <td>{b.topik}</td>
                    <td>{b.hasil}</td>
                    <td className="text-center"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'revisi' && (
        <div className="admin-panel">
          <div className="panel-header">
            <span className="panel-title"><CheckSquare size={16} /> Matriks Catatan Revisi Pasca Ujian</span>
          </div>
          <div className="panel-body no-padding">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="text-center">No</th>
                  <th>Bagian</th>
                  <th>Penguji</th>
                  <th>Catatan Perbaikan</th>
                  <th>Tindak Lanjut</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {studentRev.map((r) => (
                  <tr key={r.id}>
                    <td className="text-center">{r.no}</td>
                    <td><strong>{r.bagian}</strong></td>
                    <td>{r.namaPenguji}</td>
                    <td>{r.catatanPenguji}</td>
                    <td>{r.tindakLanjut || '-'}</td>
                    <td className="text-center"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'publikasi' && (
        <div className="admin-panel">
          <div className="panel-header">
            <span className="panel-title"><BookMarked size={16} /> Data Publikasi & Surat Turnitin</span>
          </div>
          <div className="panel-body">
            <div style={{ marginBottom: '16px' }}>
              <span className="metadata-label">Pemeriksaan Turnitin & Deteksi AI</span>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>
                Similarity: <strong>{student.turnitin.similarity}%</strong> • Deteksi AI: <strong>{student.turnitin.aiDetection}%</strong>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                No Surat: {student.turnitin.suratKeteranganNo} • Tgl Periksa: {student.turnitin.tanggalPeriksa}
              </div>
            </div>

            {student.publikasi?.judulArtikel && (
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                <span className="metadata-label">Artikel Publikasi Ilmiah</span>
                <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '2px' }}>
                  "{student.publikasi.judulArtikel}"
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {student.publikasi.jurnal} ({student.publikasi.statusArtikel})
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'dokumen' && (
        <div className="admin-panel">
          <div className="panel-header">
            <span className="panel-title"><FolderArchive size={16} /> Arsip Dokumen Mahasiswa</span>
          </div>
          <div className="panel-body no-padding">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nama Dokumen</th>
                  <th>Kategori</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {studentDoc.map((d) => (
                  <tr key={d.id}>
                    <td><strong>{d.namaDokumen}</strong></td>
                    <td>{d.jenis}</td>
                    <td>{d.tanggal}</td>
                    <td><StatusBadge status={d.statusVerifikasi} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
