import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { FolderArchive, Upload, Download, Eye, FileText, Plus } from 'lucide-react';

export default function DokumenModule({ student, dokumenList = [], onAddDokumen }) {
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formDoc, setFormDoc] = useState({
    namaDokumen: '',
    jenis: 'Naskah Tugas Akhir',
    kategori: 'Naskah',
    fileMock: 'Draf_Baru_Mahasiswa.pdf'
  });

  const studentDocs = dokumenList.filter(d => d.mhsId === student.id);
  const filteredDocs = studentDocs.filter(d => {
    if (filterKategori === 'ALL') return true;
    return d.kategori === filterKategori;
  });

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!formDoc.namaDokumen.trim()) return;

    onAddDokumen({
      id: 'doc-' + Date.now(),
      mhsId: student.id,
      namaDokumen: formDoc.namaDokumen,
      jenis: formDoc.jenis,
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      ukuran: '1.4 MB',
      statusVerifikasi: 'Menunggu Verifikasi Staf Prodi',
      kategori: formDoc.kategori
    });

    setIsModalOpen(false);
    setFormDoc({
      namaDokumen: '',
      jenis: 'Naskah Tugas Akhir',
      kategori: 'Naskah',
      fileMock: 'Draf_Baru_Mahasiswa.pdf'
    });
  };

  return (
    <div className="module-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pusat Dokumen Akademik Resmi</h1>
          <p className="page-subtitle">
            Repository berkas naskah, berita acara, lembar pengesahan, dan bukti plagiasi Jurusan Manajemen FEB UTM
          </p>
        </div>
        <div className="page-header-actions">
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Upload size={14} /> Unggah Berkas Baru
          </button>
        </div>
      </div>

      {/* Filter Kategori Dokumen */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <FolderArchive size={16} />
            Daftar Arsip Dokumen Mahasiswa
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Kategori:</span>
            <select 
              className="form-control"
              style={{ width: '160px', padding: '3px 8px', fontSize: '12px' }}
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Proposal">Proposal</option>
              <option value="Naskah">Naskah</option>
              <option value="Bukti Plagiasi">Bukti Plagiasi</option>
              <option value="Publikasi">Publikasi</option>
              <option value="Berita Acara">Berita Acara</option>
            </select>
          </div>
        </div>
        <div className="panel-body no-padding">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Nama Dokumen Resmi</th>
                  <th style={{ width: '18%' }}>Jenis / Kategori</th>
                  <th style={{ width: '16%' }}>Tanggal Terdaftar</th>
                  <th style={{ width: '16%' }}>Status Verifikasi</th>
                  <th style={{ width: '15%' }} className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      Tidak ada dokumen ditemukan pada kategori ini.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} style={{ color: 'var(--utm-navy-800)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--utm-navy-950)' }}>{doc.namaDokumen}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ukuran: {doc.ukuran}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="status-badge neutral">{doc.jenis}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {doc.tanggal}
                      </td>
                      <td>
                        <StatusBadge status={doc.statusVerifikasi} />
                      </td>
                      <td className="text-center">
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            onClick={() => alert(`Mengunduh berkas: ${doc.namaDokumen}`)}
                            title="Unduh Berkas"
                          >
                            <Download size={13} /> Unduh
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Unggah Berkas Baru */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Unggah Berkas Dokumen Akademik"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button type="button" className="btn btn-primary" onClick={handleUploadSubmit}>
              Unggah & Simpan
            </button>
          </>
        }
      >
        <form onSubmit={handleUploadSubmit}>
          <div className="form-group">
            <label className="form-label required">Nama Dokumen</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="Contoh: Draf_Revisi_Ujian_Bab_I_III.pdf"
              value={formDoc.namaDokumen}
              onChange={(e) => setFormDoc({ ...formDoc, namaDokumen: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Kategori Berkas</label>
            <select 
              className="form-control"
              value={formDoc.kategori}
              onChange={(e) => setFormDoc({ ...formDoc, kategori: e.target.value, jenis: e.target.value })}
            >
              <option value="Naskah">Naskah Tugas Akhir / Skripsi / Tesis / Disertasi</option>
              <option value="Proposal">Proposal Tugas Akhir</option>
              <option value="Bukti Plagiasi">Surat Bebas Plagiasi Turnitin</option>
              <option value="Publikasi">Bukti Publikasi / LoA Jurnal</option>
              <option value="Persetujuan">Lembar Persetujuan Pembimbing</option>
              <option value="Berita Acara">Berita Acara Ujian</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Pilih Berkas PDF</label>
            <div style={{ padding: '20px', border: '2px dashed var(--border-mid)', borderRadius: '4px', textAlign: 'center', background: '#f8fafc' }}>
              <Upload size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Format didukung: <strong>PDF (Maksimal 20 MB)</strong>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Simulasi unggah dokumen akademik terverifikasi UTM
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
