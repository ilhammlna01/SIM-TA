import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { PROGRAM_STUDI_INFO } from '../../data/pedomanRules';
import { FileCheck, CheckCircle2, AlertTriangle, ShieldCheck, Download, Award } from 'lucide-react';

export default function PersyaratanModule({ student }) {
  const infoProdi = PROGRAM_STUDI_INFO[student.jenjang];

  // Build requirements array based on degree and stage
  const getRequirements = () => {
    const list = [
      {
        nama: 'Kelulusan Beban Mata Kuliah (SKS)',
        standar: infoProdi?.sksMin || 'Selesai seluruh mata kuliah',
        aktual: `${student.sksLulus} SKS Terpenuhi`,
        status: 'Terpenuhi',
        dokumen: 'Transkrip_Nilai_Akademik_Resmi.pdf',
        verifikasi: 'Terverifikasi Koorprodi'
      },
      {
        nama: 'Indeks Prestasi Kumulatif (IPK)',
        standar: `IPK Minimal ${infoProdi?.ipkMin.toFixed(2)}`,
        aktual: `IPK ${student.ipk.toFixed(2)}`,
        status: student.ipk >= infoProdi?.ipkMin ? 'Terpenuhi' : 'Belum Memenuhi',
        dokumen: 'KHS_Kumulatif_Semester_Terakhir.pdf',
        verifikasi: 'Terverifikasi SIAKAD'
      },
      {
        nama: 'Standar Kemampuan Bahasa Inggris (TOEFL)',
        standar: `Skor Minimal ${infoProdi?.toeflMin} PBT/ITP`,
        aktual: `Skor ${student.toefl}`,
        status: student.toefl >= infoProdi?.toeflMin ? 'Terpenuhi' : 'Belum Memenuhi',
        dokumen: 'Sertifikat_TOEFL_Pusat_Bahasa_UTM.pdf',
        verifikasi: 'Terverifikasi UPT Bahasa'
      },
      {
        nama: 'Uji Kemiripan Naskah (Turnitin Similarity Index)',
        standar: `Maksimal ${infoProdi?.turnitinSimilarityMax}% (Eksklusi Daftar Pustaka & Lampiran)`,
        aktual: `${student.turnitin.similarity}% Similarity Index`,
        status: student.turnitin.similarity <= infoProdi?.turnitinSimilarityMax ? 'Terpenuhi' : 'Melebihi Batas',
        dokumen: student.turnitin.file || 'SK_Turnitin_Pemeriksaan.pdf',
        verifikasi: 'Disahkan Dosen & Koorprodi'
      },
      {
        nama: 'Uji Deteksi Konten Kecerdasan Buatan (AI Detection)',
        standar: `Maksimal ${infoProdi?.turnitinAiMax}% (Peraturan Rektor No. 46/2025)`,
        aktual: `${student.turnitin.aiDetection}% AI Detection`,
        status: student.turnitin.aiDetection <= infoProdi?.turnitinAiMax ? 'Terpenuhi' : 'Melebihi Batas',
        dokumen: 'Laporan_Turnitin_AI_Score.pdf',
        verifikasi: 'Disahkan Koorprodi'
      },
      {
        nama: 'Persetujuan Tertulis Naskah oleh Pembimbing / Promotor',
        standar: student.jenjang === 'S3' ? 'Persetujuan Promotor & Kopromotor' : 'Persetujuan Dosen Pembimbing',
        aktual: 'Telah ditandatangani lembar persetujuan maju ujian',
        status: 'Terpenuhi',
        dokumen: 'Lembar_Persetujuan_Naskah_Pembimbing.pdf',
        verifikasi: 'Tanda Tangan Dosen Valid'
      }
    ];

    // Syarat Publikasi khusus S2 & S3
    if (student.jenjang === 'S2') {
      list.push({
        nama: 'Publikasi Ilmiah Magister',
        standar: 'Minimal 1 publikasi jurnal internasional terindeks atau SINTA 1-3 (atau SINTA 4 + 1 prosiding)',
        aktual: 'Published di Jurnal Manajemen dan Kewirausahaan (SINTA 2)',
        status: 'Terpenuhi',
        dokumen: 'Artikel_Jurnal_Sinta2_Rahmat.pdf',
        verifikasi: 'Terverifikasi Tim Validasi'
      });
    }

    if (student.jenjang === 'S3') {
      list.push({
        nama: 'Publikasi Internasional Bereputasi (Scopus/WoS Q4)',
        standar: 'Accepted/LoA minimal Q4 Scopus/WoS, first author, afiliasi UTM, non-discontinued',
        aktual: 'Accepted di Journal of Open Innovation (Elsevier, Scopus Q1)',
        status: 'Terpenuhi',
        dokumen: 'LoA_Journal_Open_Innovation_Scopus.pdf',
        verifikasi: 'Terverifikasi Tim Validasi Disertasi'
      });
    }

    return list;
  };

  const requirements = getRequirements();
  const fulfilledCount = requirements.filter(r => r.status === 'Terpenuhi').length;

  return (
    <div className="module-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Persyaratan Ujian {infoProdi?.istilahTA}</h1>
          <p className="page-subtitle">
            Verifikasi menyeluruh prasyarat akademis dan administratif jenjang {infoProdi?.jenjang} (Pedoman BAB X)
          </p>
        </div>
      </div>

      {/* Ringkasan Status Verifikasi Berkas */}
      <div className="admin-panel" style={{ borderLeft: '4px solid var(--color-success)' }}>
        <div className="panel-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="metadata-label">Kelayakan Pendaftaran Ujian</span>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--utm-navy-950)', marginTop: '2px' }}>
                {fulfilledCount} dari {requirements.length} Persyaratan Terpenuhi
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Seluruh berkas fisik dan administratif telah diperiksa oleh staf akademik dan disahkan Koordinator Program Studi.
              </div>
            </div>
            <div>
              <StatusBadge status="Memenuhi Syarat Maju Ujian" type="success" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Checklist Persyaratan */}
      <div className="admin-panel">
        <div className="panel-header">
          <span className="panel-title">
            <FileCheck size={16} />
            Checklist Rincian Persyaratan Ujian ({student.tahapAktifNama})
          </span>
          <span className="panel-subtitle">Jenjang: {infoProdi?.jenjang}</span>
        </div>
        <div className="panel-body no-padding">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Nama Persyaratan</th>
                  <th style={{ width: '25%' }}>Standar Minimal Pedoman</th>
                  <th style={{ width: '20%' }}>Capaian Aktual</th>
                  <th style={{ width: '12%' }} className="text-center">Status</th>
                  <th style={{ width: '15%' }}>Verifikasi</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--utm-navy-950)' }}>{req.nama}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <span>Berkas: {req.dokumen}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {req.standar}
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--utm-navy-900)' }}>
                      {req.aktual}
                    </td>
                    <td className="text-center">
                      <StatusBadge status={req.status} />
                    </td>
                    <td>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-success)', fontWeight: '600' }}>
                        {req.verifikasi}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
