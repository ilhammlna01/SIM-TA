import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import {
  Panel,
  Button,
  Badge,
  StatusBadge,
  DocumentItem,
  StatCard
} from '../../components/ui';

import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  ClipboardCheck,
  ArrowLeft,
  CheckCircle,
  Download,
  BookOpen,
  Printer,
  Edit3
} from 'lucide-react';
import { DocumentGeneratorModal } from '../../components/documents';
import { downloadUniversalDoc, downloadFormPenilaian, downloadLembarRevisi } from '../../utils/pdfDownloader';

/**
 * HALAMAN 3: DETAIL UJIAN PENGUJI (FASE G)
 * Informasi Lengkap Sesuai Permintaan Spesifik:
 * Mahasiswa, Judul, Program Studi, Jenjang, Jenis Ujian, Jadwal, Tempat, Tim Penguji, Naskah, Dokumen.
 */
export default function DetailUjianPage({
  ujian,
  onNavigate,
  onOpenPenilaian,
  onOpenNaskah
}) {
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  if (!ujian) {
    return (
      <div>
        <PageHeader
          breadcrumbs={[
            { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
            { label: 'Dewan Penguji', onClick: () => onNavigate('daftar-ujian') },
            { label: 'Detail Ujian' }
          ]}
          title="Detail Ujian Tugas Akhir"
        />
        <Panel>
          <p>Sidang ujian belum dipilih. Silakan kembali ke daftar agenda sidang.</p>
          <Button variant="secondary" onClick={() => onNavigate('daftar-ujian')}>
            Kembali ke Daftar Sidang
          </Button>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      {/* 1. Header Resmi */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Daftar Sidang', onClick: () => onNavigate('daftar-ujian') },
          { label: ujian.namaMahasiswa }
        ]}
        title={`${ujian.jenisUjian || 'Sidang Ujian'}: ${ujian.namaMahasiswa || 'Mahasiswa'}`}
        description={`NIM. ${ujian.nim || '-'} — ${ujian.programStudi || ujian.prodi || 'Program Studi'} (${ujian.jenjang || 'S1'}) | Peran Penguji: ${ujian.peranPenguji || ujian.peranDosen || 'Dewan Penguji'}`}
        statusBadge={<Badge variant={(ujian.jenjang || 'S1') === 'S3' ? 'gold' : 'navy'}>{ujian.jenjang || 'S1'}</Badge>}
        primaryAction={
          <Button
            variant="primary"
            icon={ClipboardCheck}
            onClick={() => {
              if (onOpenPenilaian) onOpenPenilaian(ujian.id);
              else onNavigate('penilaian');
            }}
          >
            {ujian.penilaianSubmitted ? 'Lihat Lembar Nilai' : 'Buka Form Penilaian'}
          </Button>
        }
        secondaryAction={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              icon={Edit3}
              onClick={() => onNavigate('koreksi')}
            >
              Catatan Koreksi
            </Button>
            {ujian.penilaianSubmitted && (
              <Button
                variant="secondary"
                icon={Printer}
                onClick={() => setIsDocModalOpen(true)}
              >
                Cetak Berita Acara PDF
              </Button>
            )}
            <Button variant="secondary" icon={ArrowLeft} onClick={() => onNavigate('daftar-ujian')}>
              Kembali
            </Button>
          </div>
        }
      />

      <div className="grid-2col-responsive" style={{ alignItems: 'start' }}>
        
        {/* Kolom Kiri: Mahasiswa, Judul, Waktu, Tempat, Naskah */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          
          {/* Identitas Mahasiswa & Judul */}
          <Panel title="Identitas Mahasiswa & Tugas Akhir" icon={GraduationCap}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '16px 18px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '5px solid #1e3a8a', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '10.5px', color: '#1e3a8a', textTransform: 'uppercase', fontWeight: '700', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                  Judul Naskah yang Diujikan:
                </span>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '6px', lineHeight: '1.5', fontStyle: 'italic' }}>
                  "{ujian.judul}"
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <StatCard
                  label="Mahasiswa Teruji"
                  value={ujian.namaMahasiswa}
                  caption={`NIM: ${ujian.nim}`}
                  tone="navy"
                />

                <StatCard
                  label="Program Studi & Jenjang"
                  value={`${ujian.programStudi} (${ujian.jenjang})`}
                  caption={`Bentuk: ${ujian.bentukTA} (${ujian.jenisTA || 'TAKT'})`}
                  tone="sky"
                />

                <StatCard
                  label="Pembimbing / Promotor"
                  value={ujian.pembimbing}
                  tone="amber"
                />

                <StatCard
                  label="Peran Penugasan Anda"
                  value={<Badge variant="gold">{ujian.peranPenguji}</Badge>}
                  tone="green"
                />
              </div>
            </div>
          </Panel>

          {/* Jadwal & Tempat Sidang */}
          <Panel title="Jadwal Waktu & Tempat Pelaksanaan Ujian" icon={Calendar}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <StatCard
                label="Hari & Tanggal"
                value={ujian.jadwal}
                caption={`Waktu: ${ujian.waktu}`}
                tone="navy"
              />

              <StatCard
                label="Ruangan Sidang"
                value={ujian.ruang}
                caption="Status: Terjadwal Resmi di SIAKAD"
                tone="sky"
              />
            </div>
          </Panel>

          {/* Berkas Naskah Ujian */}
          <Panel
            title="Draf Naskah Tugas Akhir yang Diujikan"
            icon={FileText}
            actions={
              <Button
                variant="secondary"
                size="sm"
                icon={BookOpen}
                onClick={() => {
                  if (onOpenNaskah) onOpenNaskah(ujian.id);
                  else onNavigate('naskah');
                }}
              >
                Baca Naskah Digital
              </Button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-3)', backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>
                  Pemeriksaan Bebas Plagiasi Turnitin Terverifikasi Sah
                </div>
                <div style={{ fontSize: '11.5px', color: '#15803D', marginTop: '2px' }}>
                  Similarity Index: <strong>{ujian.turnitinSim}%</strong> • AI Detection Score: <strong>{ujian.turnitinAI}%</strong>
                </div>
              </div>

              <DocumentItem
                title={ujian.fileNaskah}
                meta={`PDF • ${ujian.ukuranNaskah} • Draf Lengkap untuk Dewan Penguji`}
                status="Siap Diuji"
                onDownload={() => downloadUniversalDoc({ namaDokumen: ujian.fileNaskah || 'Naskah_Lengkap.pdf', jenis: 'Draf Naskah Tugas Akhir' }, { nama: ujian.mahasiswa, nim: ujian.nim })}
              />
            </div>
          </Panel>

        </div>

        {/* Kolom Kanan: Tim Penguji & Dokumen Sidang */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          
          {/* Tim Penguji */}
          <Panel title="Susunan Dewan Penguji (Pedoman 2026)" icon={Users}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ padding: '8px', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xs)', fontSize: '12px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', display: 'block' }}>Penguji 1 (Ketua / Pembimbing):</span>
                <strong>{ujian.pembimbing.split('(')[0]}</strong>
              </div>

              <div style={{ padding: '8px', border: '1px solid var(--color-brand-primary)', backgroundColor: 'var(--primitive-navy-50)', borderRadius: 'var(--radius-xs)', fontSize: '12px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--color-brand-primary)', fontWeight: 'bold', display: 'block' }}>Penguji 2 (Anda):</span>
                <strong>Dr. Faidal, S.E., M.M.</strong> ({ujian.peranPenguji})
              </div>

              <div style={{ padding: '8px', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xs)', fontSize: '12px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', display: 'block' }}>Penguji 3 (Anggota Penguji):</span>
                <strong>Aprilina Susandini, S.E., M.SM.</strong>
              </div>
            </div>
          </Panel>

          {/* Dokumen Sidang */}
          <Panel title="Dokumen Berkas Sidang Resmi" icon={FileText}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <DocumentItem
                title={`Form_Penilaian_${ujian.jenjang}_Pedoman_2026.pdf`}
                meta="Lembar Penilaian Resmi Ujian"
                status="Tersedia"
                onDownload={() => downloadFormPenilaian(ujian, { nama: 'Dr. Faidal, S.E., M.M.', nip: '197205102005011002' })}
              />
              <DocumentItem
                title={`Lembar_Catatan_Revisi_Ujian_${ujian.nim}.pdf`}
                meta="Lembar Perbaikan Pasca Ujian"
                status="Tersedia"
                onDownload={() => downloadLembarRevisi([], { nama: ujian.mahasiswa, nim: ujian.nim, judul: ujian.judul }, ujian)}
              />
            </div>
          </Panel>

        </div>

      </div>

      {/* Modal Cetak Berita Acara Digital */}
      {ujian && (
        <DocumentGeneratorModal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          initialDocType="berita_acara"
          prefillData={{
            namaMahasiswa: ujian.namaMahasiswa,
            nim: ujian.nim,
            jenjang: ujian.jenjang,
            prodi: ujian.programStudi,
            judul: ujian.judulNaskah,
            tahap: ujian.jenisUjian,
            ruang: ujian.ruang,
            nilaiFinal: ujian.nilaiFinal,
            grade: ujian.grade,
            rekomendasiKelayakan: ujian.rekomendasiKelayakan
          }}
        />
      )}
    </div>
  );
}
