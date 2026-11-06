import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { CheckSquare, AlertTriangle, Clock, Check, Plus, FileText } from 'lucide-react';

export default function RevisiModule({ 
  student, 
  revisiList = [], 
  onUpdateRevisi, 
  currentRole 
}) {
  const isS3 = student.jenjang === 'S3';
  const batasRevisi = isS3 ? '6 Bulan (Ujian Tertutup)' : '3 Bulan sejak tanggal ujian';

  const [items, setItems] = useState(revisiList);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tindakLanjutInput, setTindakLanjutInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const studentRevisi = items.filter(r => r.mhsId === student.id);

  const handleOpenTindakLanjut = (item) => {
    setSelectedItem(item);
    setTindakLanjutInput(item.tindakLanjut || '');
    setIsModalOpen(true);
  };

  const handleSaveTindakLanjut = () => {
    if (!selectedItem) return;
    const updated = items.map(r => {
      if (r.id === selectedItem.id) {
        return {
          ...r,
          tindakLanjut: tindakLanjutInput,
          status: 'Telah Ditindaklanjuti'
        };
      }
      return r;
    });
    setItems(updated);
    onUpdateRevisi(updated);
    setIsModalOpen(false);
  };

  const handleApprove = (id) => {
    const updated = items.map(r => {
      if (r.id === id) {
        return { ...r, status: 'Disetujui' };
      }
      return r;
    });
    setItems(updated);
    onUpdateRevisi(updated);
  };

  return (
    <div className="module-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Matriks Perbaikan & Revisi Pasca Ujian</h1>
          <p className="page-subtitle">
            Format resmi pemantauan penyelesaian catatan revisi oleh Dewan Penguji & Pembimbing/Promotor
          </p>
        </div>
      </div>

      {/* Box Batas Waktu & Sanksi Akademik */}
      <div className="alert-banner warning">
        <Clock size={16} />
        <div>
          <strong>Batas Waktu Revisi Resmi (Pedoman 2026):</strong> {batasRevisi}. Apabila mahasiswa tidak menyelesaikan revisi dan tidak memperoleh persetujuan penguji hingga batas waktu ini, maka status kelulusan dibatalkan dan mahasiswa wajib mengikuti ujian ulang.
        </div>
      </div>

      {/* Tabel Matriks Revisi Resmi */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <CheckSquare size={16} />
            Matriks Catatan & Tindak Lanjut Revisi
          </span>
          <span className="panel-subtitle">Total: {studentRevisi.length} Poin Perbaikan</span>
        </div>
        <div className="panel-body no-padding">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }} className="text-center">No.</th>
                  <th style={{ width: '220px' }}>Bagian / Halaman Naskah</th>
                  <th style={{ width: '200px' }}>Sumber / Nama Penguji</th>
                  <th>Catatan Perbaikan Penguji</th>
                  <th>Tindak Lanjut Mahasiswa</th>
                  <th style={{ width: '130px' }} className="text-center">Status</th>
                  <th style={{ width: '130px' }} className="text-center">Aksi / Approval</th>
                </tr>
              </thead>
              <tbody>
                {studentRevisi.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      Tidak ada catatan revisi tertunda untuk mahasiswa ini.
                    </td>
                  </tr>
                ) : (
                  studentRevisi.map((rev) => (
                    <tr key={rev.id}>
                      <td className="text-center" style={{ fontWeight: '600' }}>
                        {rev.no}
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--utm-navy-950)' }}>
                        {rev.bagian}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '12px' }}>{rev.namaPenguji}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{rev.sumberRevisi}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {rev.catatanPenguji}
                      </td>
                      <td>
                        {rev.tindakLanjut ? (
                          <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                            {rev.tindakLanjut}
                            {rev.halamanPerbaikan && (
                              <div style={{ fontSize: '10.5px', color: 'var(--color-info)', marginTop: '2px' }}>
                                Ref: {rev.halamanPerbaikan}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Belum diisi</span>
                        )}
                      </td>
                      <td className="text-center">
                        <StatusBadge status={rev.status} />
                      </td>
                      <td className="text-center">
                        {currentRole === 'mahasiswa' ? (
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenTindakLanjut(rev)}
                          >
                            Tindak Lanjuti
                          </button>
                        ) : (
                          rev.status !== 'Disetujui' ? (
                            <button 
                              type="button" 
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(rev.id)}
                            >
                              <Check size={12} /> Setujui
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '600' }}>
                              Terverifikasi
                            </span>
                          )
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tindak Lanjut Revisi */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Input Tindak Lanjut Perbaikan Naskah"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveTindakLanjut}>
              Simpan Tindak Lanjut
            </button>
          </>
        }
      >
        {selectedItem && (
          <div>
            <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '4px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Catatan dari: <strong>{selectedItem.namaPenguji}</strong> ({selectedItem.sumberRevisi})</div>
              <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--utm-navy-950)', marginTop: '4px' }}>
                {selectedItem.bagian}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                "{selectedItem.catatanPenguji}"
              </p>
            </div>

            <div className="form-group">
              <label className="form-label required">Uraian Tindak Lanjut / Perbaikan yang Dilakukan</label>
              <textarea 
                className="form-control"
                style={{ minHeight: '80px' }}
                placeholder="Jelaskan secara spesifik perbaikan yang telah diterapkan pada naskah..."
                value={tindakLanjutInput}
                onChange={(e) => setTindakLanjutInput(e.target.value)}
                required
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
