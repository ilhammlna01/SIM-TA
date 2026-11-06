import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { RUBRIK_PENILAIAN, KONVERSI_NILAI_UTM } from '../../data/pedomanRules';
import { ClipboardCheck, Calculator, AlertTriangle, CheckCircle, Scale, RotateCcw } from 'lucide-react';

export default function PenilaianModule({ student }) {
  // Determine appropriate rubric key
  let rubricKey = 'D3_S1';
  if (student.jenjang === 'S2') rubricKey = 'S2';
  if (student.jenjang === 'S3') {
    rubricKey = student.tahapAktifId === 'tahap-4' ? 'S3_KELAYAKAN' : 'S3_TERTUTUP';
  }

  const rubric = RUBRIK_PENILAIAN[rubricKey] || RUBRIK_PENILAIAN.D3_S1;

  // Initial scores state
  const initialScores = rubric.reduce((acc, curr) => {
    acc[curr.id] = 80;
    return acc;
  }, {});

  const [scores, setScores] = useState(initialScores);
  const [catatan, setCatatan] = useState('Naskah telah memenuhi kaidah akademik penulisan tugas akhir FEB UTM.');
  const [isSaved, setIsSaved] = useState(false);

  // Calculate weighted total score
  const totalScore = rubric.reduce((acc, curr) => {
    const raw = Number(scores[curr.id]) || 0;
    return acc + (raw * (curr.bobot / 100));
  }, 0).toFixed(2);

  const konversi = KONVERSI_NILAI_UTM(Number(totalScore));

  const handleScoreChange = (id, val) => {
    setScores(prev => ({ ...prev, [id]: Number(val) }));
    setIsSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
  };

  return (
    <div className="module-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Formulir Penilaian Ujian Resmi</h1>
          <p className="page-subtitle">
            Instrumen penilaian akademik sesuai ketentuan Buku Pedoman Tugas Akhir UTM 2026 (Rentang 0–100)
          </p>
        </div>
        <div className="page-header-actions">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => setScores(initialScores)}
          >
            <RotateCcw size={13} /> Reset Nilai Standar
          </button>
        </div>
      </div>

      {/* Ringkasan Skor Akhir & Konversi Huruf Mutu UTM */}
      <div className="admin-panel" style={{ borderLeft: '4px solid var(--utm-navy-900)' }}>
        <div className="panel-header">
          <span className="panel-title">
            <Calculator size={16} />
            Rekapitulasi Nilai Akhir (NA) & Predikat Kelulusan
          </span>
          <StatusBadge status={konversi.predikat} type={Number(totalScore) >= 56 ? 'success' : 'danger'} />
        </div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
              <div className="metadata-label">Nilai Angka (0-100)</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--utm-navy-950)', marginTop: '2px' }}>
                {totalScore}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Bobot Terakumulasi: 100%
              </div>
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
              <div className="metadata-label">Nilai Huruf Mutu UTM</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--utm-gold-500)', marginTop: '2px' }}>
                {konversi.huruf}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Bobot Indeks: {konversi.bobot.toFixed(2)}
              </div>
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
              <div className="metadata-label">Ambang Kelulusan Jenjang {student.jenjang}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '6px' }}>
                {student.jenjang === 'S3' ? 'NA ≥ 70.00' : student.jenjang === 'S2' ? 'Minimal Huruf B' : 'Minimal Huruf C (≥ 56.00)'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '600', marginTop: '4px' }}>
                Nilai saat ini memenuhi batas kelulusan
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ketentuan Khusus Selisih Nilai Penguji */}
      <div className="alert-banner info" style={{ marginBottom: '16px' }}>
        <Scale size={16} />
        <div>
          <strong>Aturan Selisih Nilai Penguji (Pedoman Hal. 75):</strong> Perbedaan penilaian antara penguji satu dengan lainnya tidak boleh lebih dari 10 poin. Jika terdapat selisih lebih dari 10 poin, ketua penguji wajib mendiskusikannya dengan para penguji untuk menentukan nilai mufakat baru.
        </div>
      </div>

      {/* Form Rubrik Penilaian Terinci */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <ClipboardCheck size={16} />
            Komponen & Aspek Penilaian Ujian ({student.tahapAktifNama})
          </span>
          <span className="panel-subtitle">Mahasiswa: {student.nama} (NIM: {student.nim})</span>
        </div>
        <div className="panel-body no-padding">
          <form onSubmit={handleSave}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }} className="text-center">No</th>
                  <th style={{ width: '32%' }}>Aspek yang Dinilai</th>
                  <th style={{ width: '12%' }} className="text-center">Bobot (%)</th>
                  <th style={{ width: '20%' }} className="text-center">Skor Angka (0-100)</th>
                  <th style={{ width: '16%' }} className="text-right">Skor Terbobot</th>
                </tr>
              </thead>
              <tbody>
                {rubric.map((item, index) => {
                  const currentVal = Number(scores[item.id]) || 0;
                  const weighted = (currentVal * (item.bobot / 100)).toFixed(2);
                  return (
                    <tr key={item.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--utm-navy-950)' }}>{item.aspek}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.deskripsi}
                        </div>
                      </td>
                      <td className="text-center" style={{ fontWeight: '600' }}>
                        {item.bobot}%
                      </td>
                      <td className="text-center">
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          className="form-control text-center"
                          style={{ width: '85px', display: 'inline-block', fontWeight: 'bold' }}
                          value={scores[item.id]}
                          onChange={(e) => handleScoreChange(item.id, e.target.value)}
                          required
                        />
                      </td>
                      <td className="text-right" style={{ fontWeight: '700', color: 'var(--utm-navy-900)' }}>
                        {weighted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                  <td colSpan="2" className="text-right">TOTAL NILAI AKHIR (NA):</td>
                  <td className="text-center">100%</td>
                  <td></td>
                  <td className="text-right" style={{ fontSize: '15px', color: 'var(--utm-navy-950)' }}>
                    {totalScore}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label required">Catatan Perbaikan & Masukan untuk Mahasiswa</label>
                <textarea 
                  className="form-control"
                  style={{ minHeight: '60px' }}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11.5px', color: isSaved ? 'var(--color-success)' : 'var(--text-muted)', fontWeight: isSaved ? '600' : 'normal' }}>
                  {isSaved ? 'Formulir Penilaian Berhasil Disimpan & Diteruskan ke Berita Acara.' : 'Pastikan seluruh skor telah sesuai sebelum menyimpan.'}
                </span>
                <button type="submit" className="btn btn-primary">
                  Simpan & Sahkan Nilai Ujian
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
