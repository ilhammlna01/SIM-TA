import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { 
  Scale, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  FileText, 
  BookOpen,
  Calculator,
  RotateCcw
} from 'lucide-react';

export default function UjianKelayakanS3({ student }) {
  const defaultPenilai = student.ujianKelayakan?.penilai || [
    { nama: 'Prof. Dr. Pribanus Wantara, Drs., M.M.', peran: 'Penilai I (Promotor)', nilai: 78, rekomendasi: 'Layak Revisi Minor', catatan: 'Perjelas keterkaitan proposisi 3 dengan grand theory resource-based view.' },
    { nama: 'Dr. Dra. Hj. Iriani Ismail, M.M.', peran: 'Penilai II (Kopromotor/DPA)', nilai: 75, rekomendasi: 'Layak Revisi Minor', catatan: 'Perbaiki konsistensi operasionalisasi variabel dynamic capability di BAB III.' },
    { nama: 'Dr. Faidal, S.E., M.M.', peran: 'Penilai III (Dewan Pertimbangan Akademik)', nilai: 74, rekomendasi: 'Layak Revisi Minor', catatan: 'Penyajian tabel matriks sintesis literatur terdahulu perlu diringkas.' }
  ];

  const [penilaiList, setPenilaiList] = useState(defaultPenilai);

  // Calculate stats
  const nilaiAkhir = (penilaiList.reduce((acc, curr) => acc + Number(curr.nilai), 0) / penilaiList.length).toFixed(2);
  const layakCount = penilaiList.filter(p => p.rekomendasi.includes('Layak')).length;
  const isMemenuhiSyarat = layakCount >= 2 && Number(nilaiAkhir) >= 70;

  // Determine final status
  let statusKeputusan = 'Tidak Layak';
  let badgeType = 'danger';
  if (isMemenuhiSyarat) {
    const hasMayor = penilaiList.some(p => p.rekomendasi.includes('Mayor'));
    if (hasMayor) {
      statusKeputusan = 'Layak Revisi Mayor';
      badgeType = 'warning';
    } else {
      statusKeputusan = 'Layak Revisi Minor';
      badgeType = 'success';
    }
  }

  const handleUpdatePenilai = (index, field, value) => {
    const updated = [...penilaiList];
    updated[index] = { ...updated[index], [field]: value };
    setPenilaiList(updated);
  };

  const handleReset = () => {
    setPenilaiList(defaultPenilai);
  };

  return (
    <div className="module-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ujian Kelayakan Disertasi (Desk Review)</h1>
          <p className="page-subtitle">
            Evaluasi naskah disertasi Program Doktor (S-3) oleh Dewan Pertimbangan Akademik dan Promotor (Pedoman Hal. 64–65)
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleReset}>
            <RotateCcw size={13} /> Reset Data Penilaian
          </button>
        </div>
      </div>

      {/* Box Keputusan Formal Kelayakan Berdasarkan Aturan Buku Pedoman */}
      <div className="admin-panel" style={{ borderLeft: `4px solid ${isMemenuhiSyarat ? 'var(--color-success)' : 'var(--color-danger)'}` }}>
        <div className="panel-header" style={{ background: isMemenuhiSyarat ? 'var(--bg-success)' : 'var(--bg-danger)' }}>
          <span className="panel-title" style={{ color: isMemenuhiSyarat ? 'var(--color-success)' : 'var(--color-danger)' }}>
            <Scale size={18} />
            Keputusan Dewan Penilai Ujian Kelayakan Disertasi
          </span>
          <StatusBadge status={statusKeputusan} type={badgeType} />
        </div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '12px', background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
              <div className="metadata-label">Nilai Akhir (NA) Rata-Rata</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: Number(nilaiAkhir) >= 70 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '2px' }}>
                {nilaiAkhir}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Syarat Minimal Kelulusan: NA ≥ 70.00
              </div>
            </div>

            <div style={{ padding: '12px', background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
              <div className="metadata-label">Konsensus Tim Penilai (Desk Review)</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: layakCount >= 2 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '2px' }}>
                {layakCount} dari {penilaiList.length} Penguji
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Syarat Minimal: Sekurang-kurangnya 2 dari 3 menyatakan layak
              </div>
            </div>

            <div style={{ padding: '12px', background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
              <div className="metadata-label">Status Kelayakan Administratif</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: isMemenuhiSyarat ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '6px' }}>
                {isMemenuhiSyarat ? 'MEMENUHI SYARAT KELAYAKAN' : 'TIDAK MEMENUHI SYARAT'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {isMemenuhiSyarat 
                  ? 'Mahasiswa berhak mendaftar Ujian Tertutup setelah merampungkan revisi.' 
                  : 'Diberikan waktu revisi paling lama 3 bulan untuk uji kelayakan ulang.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Penilaian Desk Review & Interactive Simulator */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <Calculator size={16} />
            Lembar Penilaian Tim Desk Review (Dewan Pertimbangan Akademik & Promotor)
          </span>
          <span className="panel-subtitle">Nilai & rekomendasi dapat disimulasikan secara real-time</span>
        </div>
        <div className="panel-body no-padding">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }} className="text-center">No</th>
                <th style={{ width: '280px' }}>Nama & Kedudukan Penilai</th>
                <th style={{ width: '130px' }} className="text-center">Nilai Angka (0-100)</th>
                <th style={{ width: '200px' }}>Rekomendasi Kelayakan</th>
                <th>Catatan Telaah Naskah</th>
              </tr>
            </thead>
            <tbody>
              {penilaiList.map((p, index) => (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--utm-navy-950)' }}>{p.nama}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.peran}</div>
                  </td>
                  <td className="text-center">
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      className="form-control text-center"
                      style={{ width: '80px', display: 'inline-block', fontWeight: 'bold' }}
                      value={p.nilai}
                      onChange={(e) => handleUpdatePenilai(index, 'nilai', Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <select 
                      className="form-control"
                      value={p.rekomendasi}
                      onChange={(e) => handleUpdatePenilai(index, 'rekomendasi', e.target.value)}
                    >
                      <option value="Layak Revisi Minor">Layak Revisi Minor</option>
                      <option value="Layak Revisi Mayor">Layak Revisi Mayor</option>
                      <option value="Tidak Layak">Tidak Layak</option>
                    </select>
                  </td>
                  <td>
                    <textarea 
                      className="form-control"
                      style={{ minHeight: '44px', fontSize: '11.5px' }}
                      value={p.catatan}
                      onChange={(e) => handleUpdatePenilai(index, 'catatan', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel-footer">
          <span>Formula: <strong>Nilai Akhir = (P1 + P2 + P3) / 3</strong></span>
          <span>Ambang Batas Kelayakan: <strong>Layak jika ≥ 2 penilai setuju & NA ≥ 70</strong></span>
        </div>
      </div>

      {/* Persyaratan Pendaftaran Ujian Kelayakan */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <FileCheck size={16} />
            Verifikasi Persyaratan Pendaftaran Ujian Kelayakan (Pedoman Hal. 64)
          </span>
          <StatusBadge status="Berkas Lengkap & Terverifikasi" type="success" />
        </div>
        <div className="panel-body no-padding">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Persyaratan Resmi</th>
                <th>Keterangan Verifikasi</th>
                <th style={{ width: '130px' }} className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Lulus Ujian Proposal Disertasi</strong></td>
                <td>Didukung dengan Berita Acara Ujian Proposal bertanggal 15 Juli 2026</td>
                <td className="text-center"><StatusBadge status="Terpenuhi" type="success" /></td>
              </tr>
              <tr>
                <td><strong>Telah Melaksanakan Seminar Hasil</strong></td>
                <td>Seminar hasil terbuka umum terlaksana pada 28 Agustus 2026</td>
                <td className="text-center"><StatusBadge status="Terpenuhi" type="success" /></td>
              </tr>
              <tr>
                <td><strong>Menyerahkan 7 Rangkap Draf Laporan Disertasi</strong></td>
                <td>7 rangkap fisik telah disetujui Promotor & Kopromotor dan diserahkan ke Koorprodi</td>
                <td className="text-center"><StatusBadge status="Terpenuhi" type="success" /></td>
              </tr>
              <tr>
                <td><strong>Surat Keterangan Bebas Plagiasi Turnitin ≤ 20%</strong></td>
                <td>Hasil pemeriksaan similarity index 16% dan deteksi AI 18% (disahkan Koorprodi)</td>
                <td className="text-center"><StatusBadge status="Terpenuhi" type="success" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
