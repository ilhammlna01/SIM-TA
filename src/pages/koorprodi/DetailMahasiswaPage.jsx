import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import {
  Panel,
  Button,
  Badge,
  StatusBadge,
  Tabs,
  TabPanel,
  Table,
  Timeline,
  DocumentItem
} from '../../components/ui';

import {
  User,
  GitBranch,
  MessageSquare,
  FileText,
  GraduationCap,
  ClipboardCheck,
  FolderArchive,
  ArrowLeft,
  Scale,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { downloadUniversalDoc, downloadSKDekan, downloadSKBebasPlagiasi } from '../../utils/pdfDownloader';

/**
 * HALAMAN 3: DETAIL MAHASISWA KOORPRODI (FASE F)
 * Memungkinkan Koorprodi memahami kondisi mahasiswa secara komprehensif dalam satu tempat:
 * 1. Overview
 * 2. Timeline
 * 3. Bimbingan
 * 4. Naskah
 * 5. Ujian
 * 6. Revisi
 * 7. Dokumen
 */
export default function DetailMahasiswaPage({
  mahasiswa,
  bimbinganList = [],
  revisiList = [],
  naskahList = [],
  ujianList = [],
  dokumenList = [],
  onNavigate,
  onTetapkanPenguji
}) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!mahasiswa) {
    return (
      <div>
        <PageHeader
          breadcrumbs={[
            { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
            { label: 'Koorprodi', onClick: () => onNavigate('mahasiswa') },
            { label: 'Detail Mahasiswa' }
          ]}
          title="Detail Mahasiswa Tugas Akhir"
        />
        <Panel>
          <p>Mahasiswa belum dipilih. Silakan kembali ke daftar mahasiswa.</p>
          <Button variant="secondary" onClick={() => onNavigate('mahasiswa')}>
            Kembali ke Daftar Mahasiswa
          </Button>
        </Panel>
      </div>
    );
  }

  // Filter Data Terkait
  const studentBimbingan = bimbinganList.filter(b => b.mhsId === mahasiswa.id);
  const studentRevisi = revisiList.filter(r => r.mhsId === mahasiswa.id);
  const studentDokumen = dokumenList.filter(d => !d.mhsId || d.mhsId === mahasiswa.id);

  const tabsConfig = [
    { id: 'overview', label: '1. Overview', icon: User },
    { id: 'timeline', label: '2. Timeline', icon: GitBranch },
    { id: 'bimbingan', label: '3. Bimbingan', icon: MessageSquare, badge: `${mahasiswa.sesiCount || 8} Sesi` },
    { id: 'naskah', label: '4. Naskah', icon: FileText },
    { id: 'ujian', label: '5. Ujian', icon: GraduationCap },
    { id: 'revisi', label: '6. Revisi', icon: ClipboardCheck },
    { id: 'dokumen', label: '7. Dokumen', icon: FolderArchive }
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Daftar Mahasiswa', onClick: () => onNavigate('mahasiswa') },
          { label: mahasiswa.nama }
        ]}
        title={`${mahasiswa.nama} (${mahasiswa.nim})`}
        description={`${mahasiswa.programStudi} — Jenjang ${mahasiswa.jenjang} | Tahap: ${mahasiswa.tahapAktifNama}`}
        statusBadge={<Badge variant="navy">{mahasiswa.jenjang}</Badge>}
        primaryAction={
          <Button variant="primary" icon={Scale} onClick={() => onNavigate('penguji')}>
            Penetapan Dewan Penguji
          </Button>
        }
        secondaryAction={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => onNavigate('mahasiswa')}>
            Kembali ke Daftar
          </Button>
        }
      />

      {/* Navigation Tabs Wajib: Overview, Timeline, Bimbingan, Naskah, Ujian, Revisi, Dokumen */}
      <Tabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* =========================================================================
          1. OVERVIEW
          ========================================================================= */}
      <TabPanel id="overview" activeTab={activeTab}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Identitas Akademik & Status */}
          <Panel title="Ikhtisar Akademik & Kelayakan Mahasiswa" icon={User}>
            <div className="grid-2col-responsive" style={{ gap: 'var(--space-4)' }}>
              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Nama Mahasiswa:</span>
                <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>{mahasiswa.nama}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>NIM: {mahasiswa.nim}</div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Program Studi & Jenjang:</span>
                <div><strong>{mahasiswa.programStudi}</strong> ({mahasiswa.jenjang})</div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Capaian Akademik:</span>
                <div>IPK: <strong>{mahasiswa.ipk}</strong> • SKS Lulus: <strong>{mahasiswa.sks || mahasiswa.sksLulus}</strong> SKS</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Skor TOEFL: {mahasiswa.toefl} (Standar Terpenuhi)</div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Dosen Pembimbing / Promotor:</span>
                <div style={{ color: 'var(--primitive-navy-950)', fontWeight: 'var(--font-weight-medium)' }}>
                  {mahasiswa.pasanganDosen 
                    ? `${mahasiswa.peranDosen}: Dr. Iriani Ismail | Mitra: ${mahasiswa.pasanganDosen}`
                    : (mahasiswa.pembimbing?.[0]?.nama || 'Dra. Hj. S. Anugrahini Irawati, M.M.')
                  }
                </div>
              </div>
            </div>
          </Panel>

          {/* Rincian Judul Tugas Akhir */}
          <Panel title="Judul & Anatomi Tugas Akhir" icon={FileText}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)' }}>
                  Judul Resmi Disetujui Koorprodi:
                </span>
                <div style={{ fontSize: '14.5px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)', marginTop: '4px', lineHeight: 1.4 }}>
                  {mahasiswa.judul}
                </div>
              </div>

              <div className="grid-cards-responsive" style={{ gap: 'var(--space-3)' }}>
                <div>
                  <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Bentuk Tugas Akhir:</span>
                  <div><strong>{mahasiswa.bentukTA}</strong> {mahasiswa.jenisTA ? `(${mahasiswa.jenisTA})` : ''}</div>
                </div>

                <div>
                  <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Tahapan Saat Ini:</span>
                  <div><StatusBadge status={mahasiswa.statusTahap.includes('Disetujui') ? 'Disetujui' : 'Menunggu Verifikasi'} /> <span style={{ fontSize: '11px', marginLeft: '4px' }}>{mahasiswa.tahapAktifNama}</span></div>
                </div>

                <div>
                  <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Status Turnitin:</span>
                  <div>Similarity: <strong>{mahasiswa.turnitinSimilarity || mahasiswa.turnitin?.similarity || 18}%</strong> (Lolos Ambang Batas)</div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </TabPanel>

      {/* =========================================================================
          2. TIMELINE
          ========================================================================= */}
      <TabPanel id="timeline" activeTab={activeTab}>
        <Panel title="Rekam Jejak Garis Waktu Akademik (Timeline)" icon={GitBranch}>
          <Timeline
            items={[
              {
                id: 't-1',
                title: 'Pengajuan & Penetapan Judul Tugas Akhir',
                date: 'Awal Semester',
                actor: 'Koorprodi & Dosen Pembimbing',
                status: 'completed',
                notes: 'Judul disahkan secara resmi dalam buku agenda pendaftaran jurusan.'
              },
              {
                id: 't-2',
                title: mahasiswa.jenjang === 'S3' ? 'Ujian Kualifikasi & Ujian Proposal' : 'Seminar Proposal Skripsi/Tesis',
                date: 'Bulan ke-2',
                actor: 'Dewan Penguji',
                status: 'completed',
                notes: 'Dinyatakan Lulus dan berhak melanjutkan ke pengumpulan data lapangan.'
              },
              {
                id: 't-3',
                title: 'Penelitian Lapangan & Konsultasi Logbook Bimbingan',
                date: 'Berkelanjutan',
                actor: mahasiswa.peranDosen || 'Dosen Pembimbing',
                status: 'completed',
                notes: 'Memenuhi batas minimal sesi konsultasi mandatori sesuai Buku Pedoman 2026.'
              },
              {
                id: 't-4',
                title: `Tahap Saat Ini: ${mahasiswa.tahapAktifNama}`,
                date: 'Oktober 2026',
                actor: 'Koorprodi & Dewan Penguji',
                status: 'current',
                notes: mahasiswa.statusTahap
              },
              {
                id: 't-5',
                title: 'Sidang Akhir, Yudisium & Pengesahan Naskah Final',
                date: 'Periode Yudisium Ganjil 2026/2027',
                status: 'pending'
              }
            ]}
          />
        </Panel>
      </TabPanel>

      {/* =========================================================================
          3. BIMBINGAN
          ========================================================================= */}
      <TabPanel id="bimbingan" activeTab={activeTab}>
        <Panel
          title="Verifikasi Logbook Konsultasi Bimbingan"
          subtitle="Koorprodi memastikan pemenuhan target minimal bimbingan (D3/S1: 8, S2: 10, S3: 12) sebelum mengizinkan sidang."
          icon={MessageSquare}
          noPadding
        >
          <Table
            density="compact"
            columns={[
              { key: 'tanggal', label: 'Tanggal', width: '130px' },
              { key: 'dosenNama', label: 'Dosen Pembimbing / Promotor', width: '220px' },
              { key: 'topik', label: 'Materi Pembahasan Substantif' },
              { key: 'catatan', label: 'Arahan Pembimbing' },
              { key: 'status', label: 'Status Validasi', width: '130px', render: (val) => <StatusBadge status={val || 'Disetujui'} /> }
            ]}
            data={studentBimbingan.length > 0 ? studentBimbingan : [
              { id: '1', tanggal: '28 September 2026', dosenNama: 'Dra. Hj. S. Anugrahini Irawati, M.M.', topik: 'Finalisasi Draf Naskah Bab I–III dan persiapan maju ujian', catatan: 'Naskah disetujui untuk dijadwalkan sidang oleh Koorprodi.', status: 'Disetujui' }
            ]}
          />
        </Panel>
      </TabPanel>

      {/* =========================================================================
          4. NASKAH
          ========================================================================= */}
      <TabPanel id="naskah" activeTab={activeTab}>
        <Panel title="Dossier Naskah & Hasil Uji Plagiasi" icon={FileText}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-neutral-50)' }}>
              <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
                Hasil Pemeriksaan Turnitin & Deteksi AI (Peraturan Rektor No. 46/2025):
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Similarity Index: <strong>{mahasiswa.turnitinSimilarity || 19}%</strong> (Batas Maks: {mahasiswa.jenjang === 'S3' || mahasiswa.jenjang === 'S2' ? '20%' : '30%'}) • AI Score: <strong>{mahasiswa.turnitinAI || 24}%</strong>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--primitive-green-700)', marginTop: '2px', fontWeight: 'bold' }}>
                <CheckCircle size={12} aria-hidden="true" />
                <span>Memenuhi Syarat Kelayakan Bebas Plagiasi</span>
              </div>
            </div>

            <DocumentItem
              title={`Naskah_Lengkap_${mahasiswa.nim}.pdf`}
              meta="Draf Naskah Resmi Terdaftar"
              status="Disahkan Pembimbing"
              onDownload={() => downloadUniversalDoc({ namaDokumen: `Naskah_Lengkap_${mahasiswa.nim}.pdf`, jenis: 'Naskah Tugas Akhir' }, mahasiswa)}
            />
          </div>
        </Panel>
      </TabPanel>

      {/* =========================================================================
          5. UJIAN
          ========================================================================= */}
      <TabPanel id="ujian" activeTab={activeTab}>
        <Panel
          title="Status Pelaksanaan Sidang & Ujian"
          icon={GraduationCap}
          actions={
            <Button variant="primary" size="sm" icon={Scale} onClick={() => onNavigate('penguji')}>
              Kelola Penguji & Jadwal
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Ujian Aktif:</span>
              <div style={{ fontSize: '14px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
                {mahasiswa.tahapAktifNama}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Status: {mahasiswa.statusTahap}
              </div>
            </div>
          </div>
        </Panel>
      </TabPanel>

      {/* =========================================================================
          6. REVISI
          ========================================================================= */}
      <TabPanel id="revisi" activeTab={activeTab}>
        <Panel title="Pemantauan Catatan Revisi Pasca Ujian" icon={ClipboardCheck} noPadding>
          <Table
            density="compact"
            columns={[
              { key: 'catatanPenguji', label: 'Catatan Dewan Penguji' },
              { key: 'responsMahasiswa', label: 'Tindak Lanjut Mahasiswa' },
              { key: 'batasTenggat', label: 'Batas Waktu (30 Hari)', width: '160px' },
              { key: 'statusRevisi', label: 'Status', width: '140px', render: (val) => <StatusBadge status={val || 'Disetujui'} /> }
            ]}
            data={studentRevisi.length > 0 ? studentRevisi : [
              { id: '1', catatanPenguji: 'Lengkapi data rujukan tabel matriks literatur dan pengujian asumsi.', responsMahasiswa: 'Telah disempurnakan pada Bab IV halaman 88-92.', batasTenggat: '14 November 2026', statusRevisi: 'Disetujui' }
            ]}
          />
        </Panel>
      </TabPanel>

      {/* =========================================================================
          7. DOKUMEN
          ========================================================================= */}
      <TabPanel id="dokumen" activeTab={activeTab}>
        <Panel title="Arsip Berkas Digital & Berita Acara Resmi" icon={FolderArchive}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <DocumentItem
              title={`SK_Dekan_Pembimbing_${mahasiswa.nim}.pdf`}
              meta="Surat Keputusan Dekan FEB UTM"
              status="Disahkan"
              onDownload={() => downloadSKDekan({ nomorSK: `B/412/UN46.1.4/PK.02.01/2026`, jenisSK: 'Penetapan Dosen Pembimbing', mahasiswaNama: mahasiswa.nama, mahasiswaNIM: mahasiswa.nim, programStudi: mahasiswa.prodi, jenjang: mahasiswa.jenjang, judulTA: mahasiswa.judul }, mahasiswa)}
            />
            <DocumentItem
              title={`Surat_Keterangan_Bebas_Plagiasi_Turnitin_${mahasiswa.nim}.pdf`}
              meta="Surat Pengesahan Uji Turnitin Prodi"
              status="Disahkan"
              onDownload={() => downloadSKBebasPlagiasi(mahasiswa)}
            />
          </div>
        </Panel>
      </TabPanel>

    </div>
  );
}
