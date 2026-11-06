import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { MessageSquare, Plus, FileText, CheckCircle, Clock } from 'lucide-react';

export default function BimbinganModule({ 
  student, 
  bimbinganList = [], 
  onAddBimbingan,
  currentRole 
}) {
  const isS3 = student.jenjang === 'S3';
  const labelDosen = isS3 ? 'Promotor / Kopromotor' : 'Dosen Pembimbing';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    dosenNama: student.pembimbing[0]?.nama || '',
    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    topik: '',
    hasil: '',
    catatan: '',
    dokumen: ''
  });

  const studentBimbingan = bimbinganList.filter(b => b.mhsId === student.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.topik.trim()) return;

    onAddBimbingan({
      id: 'bim-' + Date.now(),
      mhsId: student.id,
      dosenNama: formData.dosenNama,
      peranDosen: isS3 ? 'Promotor' : 'Dosen Pembimbing',
      tanggal: formData.tanggal,
      topik: formData.topik,
      hasil: formData.hasil || 'Menunggu verifikasi konsultasi oleh dosen.',
      catatan: formData.catatan || '-',
      dokumen: formData.dokumen || 'Draf_Konsultasi_Mahasiswa.pdf',
      status: currentRole === 'dosen' ? 'Disetujui' : 'Menunggu Verifikasi'
    });

    setIsModalOpen(false);
    setFormData({
      dosenNama: student.pembimbing[0]?.nama || '',
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      topik: '',
      hasil: '',
      catatan: '',
      dokumen: ''
    });
  };

  return (
    <div className="module-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Log & Riwayat Bimbingan Akademik</h1>
          <p className="page-subtitle">
            Pencatatan sesi konsultasi resmi bersama {labelDosen} Jurusan Manajemen FEB UTM
          </p>
        </div>
        <div className="page-header-actions">
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={14} /> Catat Sesi Bimbingan
          </button>
        </div>
      </div>

      {/* Ringkasan Status Pembimbing */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <MessageSquare size={16} />
            Susunan {labelDosen} Resmi
          </span>
          <span className="panel-subtitle">Total: {studentBimbingan.length} Sesi Tercatat</span>
        </div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {student.pembimbing.map((p, idx) => (
              <div key={idx} style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
                <span className="metadata-label">{p.peran}</span>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--utm-navy-950)', marginTop: '2px' }}>
                  {p.nama}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NIP. {p.nip}</div>
                <div style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--color-success)', fontWeight: '600' }}>
                  Status: Aktif Membimbing
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Sesi Bimbingan */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            Daftar Catatan Konsultasi & Log Bimbingan
          </span>
          <span className="panel-subtitle">Diurutkan berdasarkan tanggal pelaksanaan</span>
        </div>
        <div className="panel-body no-padding">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Tanggal</th>
                  <th style={{ width: '180px' }}>{labelDosen}</th>
                  <th>Topik Bimbingan</th>
                  <th>Hasil & Arahan Konsultasi</th>
                  <th>Dokumen Lampiran</th>
                  <th style={{ width: '130px' }} className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {studentBimbingan.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      Belum ada sesi bimbingan yang tercatat. Silakan klik tombol "Catat Sesi Bimbingan".
                    </td>
                  </tr>
                ) : (
                  studentBimbingan.map((bim) => (
                    <tr key={bim.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {bim.tanggal}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '12px' }}>{bim.dosenNama}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{bim.peranDosen}</div>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--utm-navy-950)' }}>
                        {bim.topik}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <div>{bim.hasil}</div>
                        {bim.catatan && bim.catatan !== '-' && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                            Catatan tambahan: {bim.catatan}
                          </div>
                        )}
                      </td>
                      <td>
                        {bim.dokumen ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--color-info)' }}>
                            <FileText size={13} />
                            <span>{bim.dokumen}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-light)' }}>-</span>
                        )}
                      </td>
                      <td className="text-center">
                        <StatusBadge status={bim.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tambah Sesi Bimbingan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Catat Sesi Konsultasi ${labelDosen}`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              Simpan Sesi
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Pilih {labelDosen}</label>
            <select 
              className="form-control"
              value={formData.dosenNama}
              onChange={(e) => setFormData({ ...formData, dosenNama: e.target.value })}
              required
            >
              {student.pembimbing.map((p, idx) => (
                <option key={idx} value={p.nama}>
                  {p.peran}: {p.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Tanggal Bimbingan</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Materi / Topik Pembahasan</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Contoh: Konsultasi BAB III Metodologi Penelitian..."
              value={formData.topik}
              onChange={(e) => setFormData({ ...formData, topik: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hasil & Arahan Pembimbing</label>
            <textarea 
              className="form-control"
              placeholder="Ringkasan poin koreksi dan arahan perbaikan dari dosen..."
              value={formData.hasil}
              onChange={(e) => setFormData({ ...formData, hasil: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nama Dokumen Draft yang Dikonsultasikan</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Contoh: Draf_BAB3_Metodologi_Revisi.pdf"
              value={formData.dokumen}
              onChange={(e) => setFormData({ ...formData, dokumen: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
