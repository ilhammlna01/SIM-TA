import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { PROGRAM_STUDI_INFO, KOMPOSISI_PENGUJI } from '../../data/pedomanRules';
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  Scale, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function UjianModule({ student, onNavigate }) {
  const infoProdi = PROGRAM_STUDI_INFO[student.jenjang];
  const [isModalDaftarOpen, setIsModalDaftarOpen] = useState(false);
  const [isSuccessAlert, setIsSuccessAlert] = useState(false);

  // Get official examiner composition key
  let pengujiKey = 'D3_S1_SIDANG';
  if (student.jenjang === 'S1') pengujiKey = 'D3_S1_SEMPRO';
  if (student.jenjang === 'S2') pengujiKey = 'S2_TESIS';
  if (student.jenjang === 'S3') {
    if (student.tahapAktifId === 'tahap-1') pengujiKey = 'S3_KUALIFIKASI';
    else if (student.tahapAktifId === 'tahap-2') pengujiKey = 'S3_PROPOSAL';
    else if (student.tahapAktifId === 'tahap-4') pengujiKey = 'S3_KELAYAKAN';
    else if (student.tahapAktifId === 'tahap-5') pengujiKey = 'S3_TERTUTUP';
    else pengujiKey = 'S3_TERBUKA';
  }

  const susunanDewan = KOMPOSISI_PENGUJI[pengujiKey] || KOMPOSISI_PENGUJI.D3_S1_SIDANG;

  const handleDaftarUjian = (e) => {
    e.preventDefault();
    setIsModalDaftarOpen(false);
    setIsSuccessAlert(true);
    setTimeout(() => setIsSuccessAlert(false), 5000);
  };

  return (
    <div className="module-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pelaksanaan Ujian & Sidang {infoProdi?.istilahTA}</h1>
          <p className="page-subtitle">
            Tata cara pelaksanaan, jadwal resmi, dan susunan dewan penguji berdasarkan Buku Pedoman 2026
          </p>
        </div>
        <div className="page-header-actions">
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => setIsModalDaftarOpen(true)}
          >
            <Calendar size={14} /> Ajukan Pendaftaran Ujian
          </button>
        </div>
      </div>

      {isSuccessAlert && (
        <div className="alert-banner success">
          <CheckCircle size={16} />
          <div>
            <strong>Pendaftaran Ujian Berhasil Diajukan:</strong> Berkas permohonan telah diteruskan ke Koordinator Program Studi untuk diverifikasi dan diterbitkan SK Dewan Penguji oleh Dekan FEB UTM.
          </div>
        </div>
      )}

      {/* Informasi Jadwal & Pelaksanaan Aktif */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <Calendar size={16} />
            Jadwal & Ruang Pelaksanaan Ujian Terkini
          </span>
          <StatusBadge status="Terjadwal Resmi" type="success" />
        </div>
        <div className="panel-body">
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="metadata-label">Jenis Ujian</span>
              <span className="metadata-value highlight">
                {student.tahapAktifNama} {infoProdi?.istilahTA}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Hari & Tanggal</span>
              <span className="metadata-value">
                {student.jadwalUjian?.hariTanggal || 'Senin, 14 Oktober 2026'}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Alokasi Waktu Ujian</span>
              <span className="metadata-value">
                {student.jadwalUjian?.waktu || `${infoProdi?.alokasiWaktuUjian} (Maksimum Sesuai Pedoman)`}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Ruang Sidang / Media</span>
              <span className="metadata-value">
                {student.jadwalUjian?.ruang || 'Ruang Sidang Jurusan Manajemen Lantai 2'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Alokasi Waktu Resmi Berdasarkan Buku Pedoman (Tabel 1, 2, atau 3) */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <Clock size={16} />
            Struktur Alokasi Waktu Ujian Resmi (Buku Pedoman Hal. 72–74)
          </span>
          <span className="panel-subtitle">Total Durasi: {infoProdi?.alokasiWaktuUjian}</span>
        </div>
        <div className="panel-body no-padding">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }} className="text-center">No</th>
                <th>Sesi / Kegiatan Ujian</th>
                <th style={{ width: '160px' }} className="text-right">Alokasi Waktu (Menit)</th>
              </tr>
            </thead>
            <tbody>
              {student.jenjang === 'S3' ? (
                <>
                  <tr><td className="text-center">1</td><td>Pembukaan oleh Ketua Penguji</td><td className="text-right">5 menit</td></tr>
                  <tr><td className="text-center">2</td><td>Pemaparan Hasil oleh Promovendus</td><td className="text-right">15 menit</td></tr>
                  <tr><td className="text-center">3</td><td>Tanya Jawab Penguji Luar / Penguji Utama</td><td className="text-right">60 menit (4 x 15 menit)</td></tr>
                  <tr><td className="text-center">4</td><td>Tanya Jawab Ketua Penguji</td><td className="text-right">10 menit</td></tr>
                  <tr><td className="text-center">5</td><td>Tanya Jawab Promotor & Kopromotor</td><td className="text-right">20 menit (2 x 10 menit)</td></tr>
                  <tr><td className="text-center">6</td><td>Sidang Dewan Penguji Penentuan Hasil</td><td className="text-right">5 menit</td></tr>
                  <tr><td className="text-center">7</td><td>Penutupan & Pembacaan Hasil Ujian</td><td className="text-right">5 menit</td></tr>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                    <td colSpan="2" className="text-right">TOTAL ALOKASI WAKTU MAKSIMUM</td>
                    <td className="text-right">120 - 150 menit</td>
                  </tr>
                </>
              ) : (
                <>
                  <tr><td className="text-center">1</td><td>Pembukaan Ujian oleh Ketua Penguji</td><td className="text-right">5 menit</td></tr>
                  <tr><td className="text-center">2</td><td>Pemaparan Hasil oleh Mahasiswa</td><td className="text-right">15 menit</td></tr>
                  <tr><td className="text-center">3</td><td>Tanya Jawab Penguji Utama (Bukan Pembimbing)</td><td className="text-right">20 menit</td></tr>
                  <tr><td className="text-center">4</td><td>Tanya Jawab Ketua Penguji</td><td className="text-right">20 menit</td></tr>
                  <tr><td className="text-center">5</td><td>Tanya Jawab Anggota Penguji (Pembimbing)</td><td className="text-right">20 menit</td></tr>
                  <tr><td className="text-center">6</td><td>Sidang Penentuan Hasil Kelulusan</td><td className="text-right">5 menit</td></tr>
                  <tr><td className="text-center">7</td><td>Penutupan dan Pengumuman Keputusan</td><td className="text-right">5 menit</td></tr>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                    <td colSpan="2" className="text-right">TOTAL ALOKASI WAKTU MAKSIMUM</td>
                    <td className="text-right">90 menit</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Susunan Dewan Penguji Resmi */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <Users size={16} />
            Susunan Dewan Penguji (Ketentuan Pedoman Hal. 68–71)
          </span>
          <span className="panel-subtitle">Jumlah Penguji: {susunanDewan.length} Orang</span>
        </div>
        <div className="panel-body no-padding">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }} className="text-center">No</th>
                <th style={{ width: '220px' }}>Kedudukan dalam Tim</th>
                <th>Nama Dosen Penguji</th>
                <th>Keterangan Resmi Sumber</th>
                <th style={{ width: '120px' }} className="text-center">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              {susunanDewan.map((item, idx) => (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td style={{ fontWeight: '700', color: 'var(--utm-navy-950)' }}>{item.peran}</td>
                  <td style={{ fontWeight: '600' }}>
                    {idx === 0 
                      ? student.pembimbing[0]?.nama 
                      : idx === 1 && student.pembimbing[1]
                        ? student.pembimbing[1]?.nama 
                        : idx === 1
                          ? 'Dr. Faidal, S.E., M.M.'
                          : idx === 2
                            ? 'Aprilina Susandini, S.E., M.SM.'
                            : 'Dr. Mochammad Isa Anshori, S.E., M.Si.'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{item.keterangan}</td>
                  <td className="text-center">
                    <StatusBadge status="Siap Hadir" type="success" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pengajuan Pendaftaran Ujian */}
      <Modal
        isOpen={isModalDaftarOpen}
        onClose={() => setIsModalDaftarOpen(false)}
        title={`Formulir Pendaftaran Ujian ${infoProdi?.istilahTA}`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalDaftarOpen(false)}>
              Batal
            </button>
            <button type="button" className="btn btn-primary" onClick={handleDaftarUjian}>
              Kirimkan Permohonan Ujian
            </button>
          </>
        }
      >
        <form onSubmit={handleDaftarUjian}>
          <div className="form-group">
            <label className="form-label">Nama Mahasiswa & NIM</label>
            <input type="text" className="form-control" value={`${student.nama} (${student.nim})`} disabled />
          </div>

          <div className="form-group">
            <label className="form-label">Program Studi & Jenjang</label>
            <input type="text" className="form-control" value={`${student.programStudi} - ${infoProdi?.jenjang}`} disabled />
          </div>

          <div className="form-group">
            <label className="form-label required">Jenis Ujian yang Diajukan</label>
            <select className="form-control" required>
              <option>{student.tahapAktifNama} {infoProdi?.istilahTA}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Konfirmasi Kelengkapan Dokumen</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" defaultChecked required />
                Naskah draft lengkap telah disetujui tertulis oleh seluruh Dosen Pembimbing/Promotor
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" defaultChecked required />
                Surat Keterangan Bebas Plagiasi Turnitin (similarity index & AI) terlampir
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" defaultChecked required />
                Transkrip nilai memenuhi syarat SKS & IPK minimal
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" defaultChecked required />
                Sertifikat TOEFL memenuhi skor minimal ({infoProdi?.toeflMin})
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
