import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { BookMarked, Award, CheckCircle, ExternalLink, AlertCircle, FileText } from 'lucide-react';

export default function PublikasiModule({ student }) {
  const isD3orS1 = student.jenjang === 'D3' || student.jenjang === 'S1';
  const isTAKK = student.jenisTA === 'TAKK';

  return (
    <div className="module-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Publikasi Karya Ilmiah Mahasiswa</h1>
          <p className="page-subtitle">
            Ketentuan pemenuhan luaran publikasi ilmiah sesuai Buku Pedoman Tugas Akhir UTM 2026 BAB VIII
          </p>
        </div>
      </div>

      {/* Ketentuan Umum Sesuai Bentuk & Jenjang */}
      <div className="admin-panel" style={{ borderLeft: '4px solid var(--utm-navy-900)' }}>
        <div className="panel-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="metadata-label">Ketentuan Regulasi Publikasi (BAB VIII)</span>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--utm-navy-950)', marginTop: '2px' }}>
                {student.jenjang === 'S3' 
                  ? 'Kewajiban Jurnal Internasional Bereputasi (Scopus / WoS Q4)' 
                  : student.jenjang === 'S2'
                    ? 'Kewajiban Jurnal Terindeks DOAJ/Copernicus atau SINTA 1–3'
                    : isTAKK 
                      ? `Kewajiban Publikasi TAKK — Skema ${student.skemaTAKK}`
                      : 'Publikasi Skema TAKT Bersifat Opsional (Tidak Diwajibkan)'}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>
                {student.jenjang === 'S3' && 'Mahasiswa Doktor wajib memiliki sekurang-kurangnya satu artikel accepted/LoA pada jurnal internasional bereputasi minimal setara Q4 Scopus/WoS, berstatus first author, afiliasi UTM, dan mencantumkan dosen S3.'}
                {student.jenjang === 'S2' && 'Mahasiswa Magister wajib memiliki minimal satu publikasi ilmiah jurnal internasional terindeks (DOAJ/Copernicus), prosiding Scopus, atau jurnal nasional terindeks SINTA 1 sampai SINTA 3.'}
                {isD3orS1 && !isTAKK && 'Mengacu BAB VIII Huruf A Poin 1 Pedoman: Hasil karya akademik yang telah disusun mahasiswa Diploma dan Sarjana pada jalur TAKT bersifat opsional (tidak diwajibkan).'}
                {isD3orS1 && isTAKK && (student.skemaTAKK === 'Konversi Langsung' 
                  ? 'Mahasiswa TAKK Konversi Langsung mempublikasikan artikel pada jurnal nasional minimal SINTA 2 atau Scopus minimal Q4/WoS, atau berprestasi juara lomba nasional/internasional.'
                  : 'Mahasiswa TAKK Skema Portofolio wajib publikasi artikel disesuaikan perolehan NA: NA 70 (SINTA 5), NA 80 (SINTA 6), NA 90 (non-SINTA).')}
              </p>
            </div>
            <div>
              <StatusBadge 
                status={student.publikasi?.status || 'Opsional'} 
                type={student.publikasi?.status?.includes('Terpenuhi') ? 'success' : 'info'} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Publikasi Mahasiswa Terunggah */}
      {student.publikasi && student.publikasi.judulArtikel ? (
        <div className="admin-panel">
          <div className="panel-header">
            <span className="panel-title">
              <BookMarked size={16} />
              Rincian Artikel Ilmiah Terpublikasi / Accepted
            </span>
            <span className="panel-subtitle">Verifikasi Kelayakan Luaran</span>
          </div>
          <div className="panel-body">
            <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '4px', marginBottom: '16px' }}>
              <div className="metadata-label">Judul Artikel Ilmiah</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--utm-navy-950)', marginTop: '4px', lineHeight: '1.4' }}>
                "{student.publikasi.judulArtikel}"
              </div>
            </div>

            <div className="metadata-grid" style={{ marginBottom: '16px' }}>
              <div className="metadata-item">
                <span className="metadata-label">Nama Jurnal & Penerbit</span>
                <span className="metadata-value highlight">{student.publikasi.jurnal}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Urutan Penulis (Kepengarangan)</span>
                <span className="metadata-value">{student.publikasi.penulis}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Afiliasi Institusi Penulis</span>
                <span className="metadata-value">Universitas Trunojoyo Madura</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Status Artikel</span>
                <span className="metadata-value" style={{ color: 'var(--color-success)', fontWeight: '600' }}>
                  {student.publikasi.statusArtikel}
                </span>
              </div>
            </div>

            {student.jenjang === 'S3' && (
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                <span className="metadata-label" style={{ marginBottom: '8px', display: 'block' }}>
                  Kesesuaian dengan Ketentuan Khusus Doktor (Pedoman Hal. 46–47 & 66)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid var(--border-success)', borderRadius: '3px', fontSize: '12px' }}>
                    <strong>Penulis Pertama:</strong> {student.nama}
                  </div>
                  <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid var(--border-success)', borderRadius: '3px', fontSize: '12px' }}>
                    <strong>Keikutsertaan Dosen S3:</strong> Promotor & Kopromotor Terdaftar
                  </div>
                  <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid var(--border-success)', borderRadius: '3px', fontSize: '12px' }}>
                    <strong>Status Jurnal:</strong> Tidak Terindikasi Predatory / Non-Discontinued
                  </div>
                  <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid var(--border-success)', borderRadius: '3px', fontSize: '12px' }}>
                    <strong>Linearitas Riset:</strong> Sesuai Tema Disertasi
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="admin-panel">
          <div className="panel-body" style={{ textAlign: 'center', padding: '32px' }}>
            <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Tidak Ada Beban Wajib Publikasi pada Skema Ini
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '480px', margin: '4px auto 0' }}>
              Untuk mahasiswa {student.jenjang} pada skema Tugas Akhir Kontributif-Teoretis (TAKT), artikel publikasi bersifat opsional dan tidak menjadi syarat mutlak pendaftaran sidang.
            </p>
          </div>
        </div>
      )}

      {/* Ketentuan Jumlah Referensi Minimal Berdasarkan Pedoman BAB VIII Huruf C */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <BookMarked size={16} />
            Standar Minimal Referensi Naskah & Sitasi (Pedoman Hal. 47)
          </span>
        </div>
        <div className="panel-body no-padding">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Jenjang Program</th>
                <th style={{ width: '45%' }}>Ketentuan Standar Referensi Sumber</th>
                <th style={{ width: '30%' }}>Ketentuan Khusus Afiliasi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Magister & Doktor</strong></td>
                <td>
                  Minimal <strong>20 artikel jurnal internasional</strong> dan minimal <strong>10 artikel jurnal nasional</strong> dalam rumpun keilmuan sebidang.
                </td>
                <td>
                  Wajib memuat minimal <strong>5 sitasi artikel dosen/mahasiswa terafiliasi UTM</strong>.
                </td>
              </tr>
              <tr>
                <td><strong>Diploma & Sarjana</strong></td>
                <td>
                  Buku: Paling sedikit 5 buku kurun waktu 10 tahun terakhir.<br />
                  Jurnal: SINTA 1–2 min 5 artikel, Non-SINTA 1–2 min 5 artikel, Scopus (Q1–Q4)/WoS min 5 artikel.
                </td>
                <td>
                  Menggunakan rujukan primer muktahir.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
