import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import { 
  Panel, 
  Button, 
  StatusBadge, 
  Badge, 
  Alert, 
  Modal, 
  FormField, 
  Input, 
  Select, 
  FileUpload,
  StatCard
} from '../../components/ui';
import { notify } from '../../components/feedback';
import { PROGRAM_STUDI_INFO, getIstilahTA } from '../../data/pedomanRules';
import { 
  BookMarked, 
  Award, 
  ExternalLink, 
  CheckCircle2, 
  FileText, 
  Plus, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

/**
 * Halaman 9: Publikasi Ilmiah
 * 
 * Menampilkan data publikasi ilmiah yang relevan per jenjang:
 * - D3/S1 TAKT: Status opsional / diseminasi karya
 * - S1 TAKK: Persyaratan SINTA 2 (Skema 1) atau SINTA 5/6 (Skema 2)
 * - S2: Wajib SINTA 2 / Jurnal Internasional Bereputasi
 * - S3: Wajib Scopus minimal Q4 / WoS (Linearitas & Non-predatory check)
 */
export default function PublikasiPage({ 
  student, 
  onNavigate 
}) {
  const prodiInfo = PROGRAM_STUDI_INFO[student.jenjang] || PROGRAM_STUDI_INFO.S1;
  const istilahTA = getIstilahTA(student, prodiInfo);
  const pub = student.publikasi;

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Regulasi spesifik jenjang
  const getPublikasiRegulation = () => {
    switch (student.jenjang) {
      case 'S3':
        return {
          wajib: true,
          target: 'Jurnal Internasional Bereputasi (Scopus min. Q4 atau Web of Science)',
          deskripsi: 'Wajib dipenuhi dengan status minimal Accepted (LoA) sebelum mendaftar Ujian Tertutup/Kelayakan. Mahasiswa sebagai penulis pertama dengan afiliasi Universitas Trunojoyo Madura.',
          insentif: 'Mahasiswa yang memiliki 2 artikel Scopus bereputasi dapat dibebaskan dari Ujian Terbuka (Promosi Doktor).'
        };
      case 'S2':
        return {
          wajib: true,
          target: 'Jurnal Nasional Terakreditasi minimal SINTA 2 atau Jurnal Internasional Bereputasi',
          deskripsi: 'Wajib dipenuhi sebelum pelaksanaan Yudisium kelulusan program magister. Mahasiswa sebagai penulis pertama dengan afiliasi UTM bersama Dosen Pembimbing.',
          insentif: null
        };
      case 'S1':
        if (student.jenisTA === 'TAKK') {
          return {
            wajib: true,
            target: student.skemaTAKK === 'Konversi Langsung' ? 'Jurnal Nasional minimal SINTA 2 / Scopus Q4' : 'Jurnal Nasional minimal SINTA 5 / SINTA 6',
            deskripsi: 'Merupakan luaran wajib pemenuhan skema Tugas Akhir Kontributif-Kreatif (TAKK) sesuai Halaman 13-15 Buku Pedoman 2026.',
            insentif: 'Konversi Nilai A Langsung melalui SK Dekan (untuk Skema 1 Konversi Langsung).'
          };
        }
        return {
          wajib: false,
          target: 'Jurnal Ilmiah Nasional / Prosiding (Opsional)',
          deskripsi: 'Berdasarkan BAB VIII Buku Pedoman 2026, publikasi artikel ilmiah pada jalur Skripsi Reguler (TAKT) bersifat opsional / anjuran diseminasi.',
          insentif: 'Mendapat poin SKK dan apresiasi akademik.'
        };
      case 'D3':
      default:
        return {
          wajib: false,
          target: 'Prosiding / Jurnal Terapan (Opsional)',
          deskripsi: 'Program Diploma III Entrepreneurship tidak mewajibkan publikasi artikel ilmiah sebagai syarat kelulusan.',
          insentif: null
        };
    }
  };

  const reg = getPublikasiRegulation();

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Portal Mahasiswa' },
          { label: `Portal ${prodiInfo.jenjang}` },
          { label: 'Publikasi Ilmiah' }
        ]}
        title={`Publikasi Ilmiah & Luaran ${istilahTA}`}
        description={`Pencatatan artikel ilmiah resmi civitas akademika ${prodiInfo.namaProdi} FEB UTM.`}
        statusBadge={<StatusBadge status={pub?.status?.includes('Terpenuhi') ? 'Selesai' : pub?.status || 'Opsional'} />}
        primaryAction={
          <Button 
            variant="primary" 
            icon={Plus}
            onClick={() => setIsClaimModalOpen(true)}
          >
            Daftarkan Publikasi Baru
          </Button>
        }
      />

      {/* 1. Ketentuan Regulasi Jenjang */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Alert 
          variant={reg.wajib ? 'info' : 'success'}
          title={`Ketentuan Publikasi Program ${prodiInfo.namaProdi} (${prodiInfo.jenjang})`}
        >
          <div style={{ fontSize: 'var(--type-body-compact-size)', lineHeight: 'var(--line-height-normal)' }}>
            <div><strong>Standar Target:</strong> {reg.target}</div>
            <div style={{ marginTop: '2px' }}>{reg.deskripsi}</div>
            {reg.insentif && (
              <div style={{ marginTop: '4px', color: 'var(--primitive-navy-950)', fontWeight: 'var(--font-weight-medium)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Award size={13} aria-hidden="true" style={{ color: 'var(--primitive-gold-600)' }} />
                <em>{reg.insentif}</em>
              </div>
            )}
          </div>
        </Alert>
      </div>

      {/* 2. Dossier Artikel Ilmiah Mahasiswa */}
      {pub && pub.judulArtikel ? (
        <Panel
          title="Data Artikel Ilmiah Terdaftar"
          subtitle={`Status Luaran: ${pub.status}`}
          icon={BookMarked}
          actions={<StatusBadge status="Disetujui" />}
        >
          <div style={{ padding: '18px 20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '5px solid #1e3a8a', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: '#e0f2fe', padding: '3px 10px', borderRadius: 'var(--radius-md)' }}>
                Judul Artikel Ilmiah Terdaftar
              </span>
              <Badge variant="navy">Status: Terbit / Accepted (LoA)</Badge>
            </div>
            <h3 style={{ fontSize: '16.5px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px', lineHeight: '1.5', fontStyle: 'italic' }}>
              "{pub.judulArtikel}"
            </h3>
            <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <strong>Jurnal Penerbit:</strong> <span>{pub.jurnal}</span>
              {pub.url && (
                <a href={pub.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#0284c7', textDecoration: 'none', fontWeight: '600', marginLeft: '6px' }}>
                  <span>Tautan DOI / Web</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <StatCard
              label="Susunan Penulis"
              value={pub.penulis}
              tone="navy"
            />
            <StatCard
              label="Afiliasi Penulis"
              value={pub.afiliasi || 'Universitas Trunojoyo Madura'}
              tone="sky"
            />
            <StatCard
              label="Status Penerbitan"
              value={pub.statusArtikel}
              tone="green"
            />
            <StatCard
              label="ISSN / Identitas Jurnal"
              value={pub.issn || '-'}
              tone="amber"
            />
          </div>

          {/* Validasi Khusus S3 / S2: Linearitas & Non-Predatory */}
          {student.jenjang === 'S3' && (
            <div style={{ padding: '16px 18px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderLeft: '5px solid #16a34a', borderRadius: 'var(--radius-md)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <ShieldCheck size={18} color="#16a34a" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>
                  Hasil Validasi Tim Pemeriksa Publikasi Program Doktor UTM:
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12.5px', color: '#14532d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: 'var(--radius-lg)', border: '1px solid #dcfce7' }}>
                  <CheckCircle2 size={16} color="#16a34a" /> <span>Linearitas: <strong>{pub.linearitas || 'Linear dengan Disertasi'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: 'var(--radius-lg)', border: '1px solid #dcfce7' }}>
                  <CheckCircle2 size={16} color="#16a34a" /> <span>Status Jurnal: <strong>{pub.discontinuedStatus || 'Aktif Scopus'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: 'var(--radius-lg)', border: '1px solid #dcfce7' }}>
                  <CheckCircle2 size={16} color="#16a34a" /> <span>Integritas: <strong>{pub.predatoryStatus || 'Non-Predatory'}</strong></span>
                </div>
              </div>
            </div>
          )}
        </Panel>
      ) : (
        <Panel
          title="Status Publikasi Mahasiswa"
          subtitle="Belum ada artikel ilmiah yang didaftarkan."
          icon={BookMarked}
        >
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--type-body-size)' }}>
              {reg.wajib 
                ? 'Anda belum mendaftarkan artikel publikasi ilmiah wajib untuk persyaratan ujian/yudisium.' 
                : 'Publikasi artikel ilmiah pada jalur ini bersifat opsional / anjuran diseminasi prodi.'}
            </p>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setIsClaimModalOpen(true)}
            >
              Daftarkan Publikasi Baru
            </Button>
          </div>
        </Panel>
      )}

      {/* Modal Pendaftaran Publikasi Baru */}
      <Modal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        title="Formulir Pendaftaran Publikasi Ilmiah"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsClaimModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={() => { notify('Publikasi berhasil didaftarkan untuk verifikasi!', { variant: 'success' }); setIsClaimModalOpen(false); }}>
              Kirim untuk Verifikasi
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <FormField id="pub-judul" label="Judul Artikel Ilmiah" required>
            <Input placeholder="Judul artikel ilmiah lengkap..." />
          </FormField>

          <FormField id="pub-jurnal" label="Nama Jurnal / Prosiding" required>
            <Input placeholder="Nama jurnal penerbit..." />
          </FormField>

          <FormField id="pub-indeks" label="Indeks / Akreditasi Jurnal" required>
            <Select
              options={[
                { value: 'scopus-q1', label: 'Scopus Q1 (Internasional Bereputasi)' },
                { value: 'scopus-q2', label: 'Scopus Q2 (Internasional Bereputasi)' },
                { value: 'scopus-q3', label: 'Scopus Q3 (Internasional Bereputasi)' },
                { value: 'scopus-q4', label: 'Scopus Q4 (Internasional Bereputasi)' },
                { value: 'sinta-2', label: 'Jurnal Nasional Terakreditasi SINTA 2' },
                { value: 'sinta-3', label: 'Jurnal Nasional Terakreditasi SINTA 3' },
                { value: 'sinta-4', label: 'Jurnal Nasional Terakreditasi SINTA 4' },
                { value: 'sinta-5-6', label: 'Jurnal Nasional Terakreditasi SINTA 5 / 6' }
              ]}
            />
          </FormField>

          <FormField id="pub-url" label="Tautan / URL Artikel Terbit" helperText="Tautan DOI atau tautan laman web resmi jurnal.">
            <Input placeholder="https://doi.org/10.xxxx/..." />
          </FormField>

          <FormField id="pub-file" label="Unggah Berkas Letter of Acceptance (LoA) / Artikel Terbit (PDF)" required>
            <FileUpload accept=".pdf" maxSizeMB={10} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
