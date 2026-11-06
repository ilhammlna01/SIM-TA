import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { PROGRAM_STUDI_INFO, TAKK_RULES } from '../../data/pedomanRules';
import { BookOpen, CheckCircle, Info, Sparkles, Scale, AlertCircle } from 'lucide-react';

export default function ProfilTugasAkhir({ student, onUpdateStudent }) {
  const infoProdi = PROGRAM_STUDI_INFO[student.jenjang];
  const allowsTAKK = infoProdi?.ketentuanTAKK;

  const [isEditing, setIsEditing] = useState(false);
  const [selectedJenis, setSelectedJenis] = useState(student.jenisTA || 'TAKT');
  const [selectedSkema, setSelectedSkema] = useState(student.skemaTAKK || 'Konversi Langsung');
  const [judulInput, setJudulInput] = useState(student.judul);

  const handleSave = () => {
    onUpdateStudent({
      ...student,
      jenisTA: selectedJenis,
      skemaTAKK: selectedJenis === 'TAKK' ? selectedSkema : null,
      bentukTA: selectedJenis === 'TAKK' ? 'Tugas Akhir Kontributif-Kreatif' : infoProdi.istilahTA,
      judul: judulInput
    });
    setIsEditing(false);
  };

  return (
    <div className="module-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profil & Spesifikasi {infoProdi?.istilahTA}</h1>
          <p className="page-subtitle">
            Pusat administrasi identitas karya akademik mahasiswa Jurusan Manajemen FEB UTM
          </p>
        </div>
        <div className="page-header-actions">
          {isEditing ? (
            <>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>
                Batal
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
                Simpan Perubahan
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setIsEditing(true)}>
              Ubah Data Pengajuan
            </button>
          )}
        </div>
      </div>

      {/* Grid Informasi Pokok */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <BookOpen size={16} />
            Identitas Karya Ilmiah Mahasiswa
          </span>
          <StatusBadge status={student.statusTahap} />
        </div>
        <div className="panel-body">
          <div className="metadata-grid" style={{ marginBottom: '20px' }}>
            <div className="metadata-item">
              <span className="metadata-label">Nama Lengkap</span>
              <span className="metadata-value highlight">{student.nama}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">NIM (Nomor Induk Mahasiswa)</span>
              <span className="metadata-value">{student.nim}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Program Studi & Jenjang</span>
              <span className="metadata-value">{student.programStudi} ({infoProdi?.jenjang})</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Semester / Tahun Akademik</span>
              <span className="metadata-value">{student.semester}</span>
            </div>
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '4px', marginBottom: '20px' }}>
            <span className="metadata-label">Judul Resmi Tugas Akhir / Disertasi</span>
            {isEditing ? (
              <textarea 
                className="form-control"
                style={{ marginTop: '6px' }}
                value={judulInput}
                onChange={(e) => setJudulInput(e.target.value)}
              />
            ) : (
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--utm-navy-950)', marginTop: '4px', lineHeight: '1.4' }}>
                {student.judul}
              </div>
            )}
          </div>

          {/* Pengaturan Bentuk Tugas Akhir: TAKT vs TAKK (Khusus D3 & S1) */}
          {allowsTAKK ? (
            <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="metadata-label">Bentuk Karya Akademik (Sesuai Buku Pedoman 2026 BAB II)</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Berlaku untuk Diploma & Sarjana</span>
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="jenisTA" 
                      value="TAKT" 
                      checked={selectedJenis === 'TAKT'}
                      onChange={(e) => setSelectedJenis(e.target.value)}
                    />
                    <strong>TAKT:</strong> Tugas Akhir Kontributif-Teoretis (Skripsi/Laporan)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="jenisTA" 
                      value="TAKK" 
                      checked={selectedJenis === 'TAKK'}
                      onChange={(e) => setSelectedJenis(e.target.value)}
                    />
                    <strong>TAKK:</strong> Tugas Akhir Kontributif-Kreatif (Inovasi/Prestasi/Publikasi)
                  </label>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="status-badge neutral" style={{ fontSize: '12px', padding: '4px 10px' }}>
                    {student.jenisTA === 'TAKK' ? 'Tugas Akhir Kontributif-Kreatif (TAKK)' : 'Tugas Akhir Kontributif-Teoretis (TAKT)'}
                  </span>
                  {student.skemaTAKK && (
                    <span className="status-badge info" style={{ fontSize: '12px', padding: '4px 10px' }}>
                      Skema: {student.skemaTAKK}
                    </span>
                  )}
                </div>
              )}

              {/* Rincian Skema TAKK jika dipilih */}
              {(isEditing ? selectedJenis === 'TAKK' : student.jenisTA === 'TAKK') && (
                <div style={{ marginTop: '14px', padding: '14px', background: '#fffbeb', border: '1px solid var(--border-warning)', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400e', fontWeight: '600', marginBottom: '8px', fontSize: '12.5px' }}>
                    <Sparkles size={15} />
                    Skema Pelaksanaan TAKK (Pedoman Hal. 13–15)
                  </div>

                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="skemaTAKK" 
                          value="Konversi Langsung"
                          checked={selectedSkema === 'Konversi Langsung'}
                          onChange={(e) => setSelectedSkema(e.target.value)}
                        />
                        Skema 1: Konversi Langsung (SINTA 2 / Scopus Q4 / Juara Nasional)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="skemaTAKK" 
                          value="Konversi Tidak Langsung (Portofolio)"
                          checked={selectedSkema === 'Konversi Tidak Langsung (Portofolio)'}
                          onChange={(e) => setSelectedSkema(e.target.value)}
                        />
                        Skema 2: Konversi Tidak Langsung (Portofolio Akumulasi NA &ge; 70)
                      </label>
                    </div>
                  ) : null}

                  <div style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.5' }}>
                    <strong>Ketentuan Skema Terpilih:</strong>
                    {student.skemaTAKK === 'Konversi Langsung' ? (
                      <ul style={{ paddingLeft: '18px', marginTop: '4px' }}>
                        <li>Publikasi artikel SINTA 2 / Scopus minimal Q4 / WoS sebagai first author ATAU Prestasi Juara lomba bereputasi.</li>
                        <li>Ditetapkan melalui SK Dekan berdasarkan verifikasi Koorprodi.</li>
                        <li>Bebas ujian Skripsi dan bebas publikasi tambahan, cukup diseminasi prodi.</li>
                      </ul>
                    ) : (
                      <ul style={{ paddingLeft: '18px', marginTop: '4px' }}>
                        <li>Akumulasi poin prestasi dan publikasi mencapai Nilai Akhir (NA) minimal 70.</li>
                        <li>Kewajiban publikasi: NA 70 (minimal SINTA 5), NA 80 (minimal SINTA 6), NA 90 (minimal non-SINTA).</li>
                        <li>Jika terpenuhi, dikonversi sebagai Tugas Akhir dengan Nilai A.</li>
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Untuk S2 dan S3 */
            <div style={{ marginBottom: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
              <span className="metadata-label">Format Penulisan Akademik</span>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--utm-navy-950)', marginTop: '4px' }}>
                {infoProdi?.istilahTA} — {student.subBentuk ? `Metode ${student.subBentuk}` : 'Karya Akademik Pascasarjana'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Mengacu pada format BAB I sampai BAB V penulisan karya ilmiah pascasarjana FEB UTM 2026.
              </div>
            </div>
          )}

          {/* Tim Pembimbing / Promotor */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <span className="metadata-label">
              {student.jenjang === 'S3' ? 'Susunan Promotor & Kopromotor' : 'Susunan Dosen Pembimbing'}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '8px' }}>
              {student.pembimbing.map((p, index) => (
                <div key={index} style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--utm-navy-900)', textTransform: 'uppercase' }}>
                    {p.peran}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--utm-navy-950)', marginTop: '2px' }}>
                    {p.nama}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NIP. {p.nip}</div>
                  <div style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--color-success)', fontWeight: '600' }}>
                    Status: Pembimbing Resmi
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
