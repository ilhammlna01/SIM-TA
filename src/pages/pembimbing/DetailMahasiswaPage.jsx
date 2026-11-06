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
  RequirementItem,
  DocumentItem
} from '../../components/ui';

import {
  User,
  BookOpen,
  GitBranch,
  MessageSquare,
  FileText,
  ClipboardCheck,
  GraduationCap,
  FolderArchive,
  ArrowLeft,
  Clock,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { downloadUniversalDoc, downloadSKDekan, downloadSKBebasPlagiasi } from '../../utils/pdfDownloader';

/**
 * HALAMAN 3: DETAIL MAHASISWA (FASE E)
 * Pola Detail Konsisten Sesuai Instruksi Wajib:
 * Identitas → Tugas Akhir → Tahap → Bimbingan → Naskah → Revisi → Ujian → Dokumen
 */
export default function DetailMahasiswaPage({
  mahasiswa,
  bimbinganList = [],
  revisiList = [],
  naskahList = [],
  ujianList = [],
  dokumenList = [],
  onNavigate,
  onOpenReview
}) {
  const [activeTab, setActiveTab] = useState('identitas');

  if (!mahasiswa) {
    return (
      <div>
        <PageHeader
          breadcrumbs={[
            { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
            { label: 'Dosen Pembimbing', onClick: () => onNavigate('mahasiswa') },
            { label: 'Detail Mahasiswa' }
          ]}
          title="Detail Mahasiswa Bimbingan"
        />
        <Panel>
          <p>Mahasiswa tidak dipilih. Silakan kembali ke daftar mahasiswa bimbingan.</p>
          <Button variant="secondary" onClick={() => onNavigate('mahasiswa')}>
            Kembali ke Daftar Mahasiswa
          </Button>
        </Panel>
      </div>
    );
  }

  // Filter Data Terkait Mahasiswa Ini
  const studentBimbingan = bimbinganList.filter(b => b.mhsId === mahasiswa.id || (b.nim && b.nim === mahasiswa.nim));
  const studentRevisi = revisiList.filter(r => r.mhsId === mahasiswa.id || (r.nim && r.nim === mahasiswa.nim));
  const studentNaskah = naskahList.filter(n => n.mhsId === mahasiswa.id || (n.nim && n.nim === mahasiswa.nim));
  const studentUjian = ujianList.filter(u => u.mhsId === mahasiswa.id || (u.nim && u.nim === mahasiswa.nim));
  const studentDokumen = dokumenList.filter(d => d.mhsId === mahasiswa.id || (d.nim && d.nim === mahasiswa.nim));

  const tabsConfig = [
    { id: 'identitas', label: '1. Identitas', icon: User },
    { id: 'tugas-akhir', label: '2. Tugas Akhir', icon: BookOpen },
    { id: 'tahap', label: '3. Tahap', icon: GitBranch },
    { id: 'bimbingan', label: '4. Bimbingan', icon: MessageSquare, badge: `${mahasiswa.sesiCount}/${mahasiswa.sesiMin}` },
    { id: 'naskah', label: '5. Naskah', icon: FileText },
    { id: 'revisi', label: '6. Revisi', icon: ClipboardCheck },
    { id: 'ujian', label: '7. Ujian', icon: GraduationCap },
    { id: 'dokumen', label: '8. Dokumen', icon: FolderArchive }
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Mahasiswa Bimbingan', onClick: () => onNavigate('mahasiswa') },
          { label: mahasiswa.nama }
        ]}
        title={`${mahasiswa.nama} (${mahasiswa.nim})`}
        description={`${mahasiswa.programStudi} — Jenjang ${mahasiswa.jenjang} | Peran Dosen: ${mahasiswa.peranDosen}`}
        statusBadge={
          <Badge variant={mahasiswa.peranDosen.includes('motor') ? 'gold' : 'navy'}>
            {mahasiswa.peranDosen}
          </Badge>
        }
        primaryAction={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => onNavigate('mahasiswa')}>
            Kembali ke Daftar
          </Button>
        }
      />

      {/* Tabs Pola Detail Konsisten */}
      <Tabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* =========================================================================
          1. IDENTITAS
          ========================================================================= */}
      <TabPanel id="identitas" activeTab={activeTab}>
        <Panel title="Identitas Mahasiswa & Data Akademik Utama" icon={User}>
          <div className="grid-2col-responsive" style={{ gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Nama Lengkap:</span>
                <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>{mahasiswa.nama}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>NIM:</span>
                <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{mahasiswa.nim}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Program Studi:</span>
                <div>{mahasiswa.programStudi}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Jenjang Pendidikan:</span>
                <div><strong>{mahasiswa.jenjang}</strong> ({mahasiswa.jenjang === 'S3' ? 'Doktor' : mahasiswa.jenjang === 'S2' ? 'Magister' : mahasiswa.jenjang === 'S1' ? 'Sarjana' : 'Diploma'})</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Indeks Prestasi Kumulatif (IPK):</span>
                <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-brand-primary)' }}>{mahasiswa.ipk}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Beban SKS Telah Lulus:</span>
                <div>{mahasiswa.sks} SKS</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Skor Bahasa Inggris (TOEFL):</span>
                <div><strong>{mahasiswa.toefl}</strong> (Standar Min: {mahasiswa.jenjang === 'S3' ? 500 : mahasiswa.jenjang === 'S2' ? 475 : 450})</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Mitra Pembimbing / Promotor:</span>
                <div>{mahasiswa.pasanganDosen || 'Pembimbing Tunggal'}</div>
              </div>
            </div>
          </div>
        </Panel>
      </TabPanel>

      {/* =========================================================================
          2. TUGAS AKHIR
          ========================================================================= */}
      <TabPanel id="tugas-akhir" activeTab={activeTab}>
        <Panel title="Rincian Judul & Bentuk Tugas Akhir" icon={BookOpen}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--primitive-neutral-50)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                Judul Resmi Disetujui:
              </span>
              <div style={{ fontSize: '15px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)', marginTop: '4px', lineHeight: 1.4 }}>
                {mahasiswa.judul}
              </div>
            </div>

            <div className="grid-2col-responsive" style={{ gap: 'var(--space-3)' }}>
              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Bentuk Tugas Akhir:</span>
                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{mahasiswa.bentukTA}</div>
              </div>
              {(mahasiswa.jenjang === 'D3' || mahasiswa.jenjang === 'S1') && (
                <div>
                  <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Kategori Bentuk (Pedoman Bab II/III):</span>
                  <div>
                    <Badge variant={mahasiswa.jenisTA === 'TAKK' ? 'gold' : 'navy'}>
                      {mahasiswa.jenisTA === 'TAKK' ? 'TAKK (Kontributif-Kreatif)' : 'TAKT (Konvensional-Teoretis)'}
                    </Badge>
                  </div>
                </div>
              )}
              <div>
                <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Status Dokumen Naskah:</span>
                <div style={{ color: 'var(--color-brand-primary)', fontWeight: 'var(--font-weight-medium)' }}>{mahasiswa.statusNaskah}</div>
              </div>
            </div>
          </div>
        </Panel>
      </TabPanel>

      {/* =========================================================================
          3. TAHAP
          ========================================================================= */}
      <TabPanel id="tahap" activeTab={activeTab}>
        <Panel title="Progres Tahapan Akademik Mahasiswa" icon={GitBranch}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', backgroundColor: 'var(--primitive-navy-50)', border: '1px solid var(--primitive-navy-200)', borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle size={20} color="var(--color-brand-primary)" />
              <div>
                <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>Tahapan Aktif Saat Ini:</div>
                <div style={{ fontSize: '15px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
                  {mahasiswa.tahapAktifNama}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Keterangan: {mahasiswa.statusTahap}
                </div>
              </div>
            </div>

            {mahasiswa.jenjang === 'S3' && (
              <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)' }}>
                <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: '13px', color: 'var(--primitive-navy-950)' }}>
                  Alur 6 Tahapan S3 Doktor Ilmu Manajemen (Buku Pedoman 2026):
                </span>
                <ol style={{ paddingLeft: 'var(--space-4)', margin: 'var(--space-2) 0 0', fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Ujian Kualifikasi — Selesai</li>
                  <li>Ujian Proposal — Selesai</li>
                  <li>Seminar Hasil — Selesai</li>
                  <li><strong>Ujian Kelayakan (Desk Review) — Sedang Berjalan (NA ≥ 70)</strong></li>
                  <li>Ujian Tertutup (Sidang 7 Penguji) — Menunggu Kelayakan</li>
                  <li>Ujian Terbuka (Promosi Doktor) — Tahap Akhir</li>
                </ol>
              </div>
            )}
          </div>
        </Panel>
      </TabPanel>

      {/* =========================================================================
          4. BIMBINGAN
          ========================================================================= */}
      <TabPanel id="bimbingan" activeTab={activeTab}>
        <Panel
          title="Riwayat Bimbingan Mahasiswa"
          subtitle={`Target minimal: ${mahasiswa.sesiMin} sesi. Telah terlaksana: ${mahasiswa.sesiCount} sesi.`}
          icon={MessageSquare}
          actions={
            <Button variant="primary" size="sm" onClick={() => onNavigate('bimbingan')}>
              Tambah Sesi Konsultasi
            </Button>
          }
          noPadding
        >
          <Table
            density="compact"
            columns={[
              { key: 'tanggal', label: 'Tanggal', width: '130px' },
              { key: 'peranDosen', label: 'Pembimbing/Promotor', width: '150px' },
              { key: 'topik', label: 'Materi Pembahasan Substantif' },
              { key: 'status', label: 'Status', width: '130px', render: (val) => <StatusBadge status={val || 'Disetujui'} /> }
            ]}
            data={studentBimbingan.length > 0 ? studentBimbingan : [
              { id: '1', tanggal: mahasiswa.sesiTerakhir, peranDosen: mahasiswa.peranDosen, topik: `Konsultasi materi naskah ${mahasiswa.bentukTA} dan persiapan tahapan ${mahasiswa.tahapAktifNama}`, status: 'Disetujui' }
            ]}
          />
        </Panel>
      </TabPanel>

      {/* =========================================================================
          5. NASKAH
          ========================================================================= */}
      <TabPanel id="naskah" activeTab={activeTab}>
        <Panel
          title="Naskah & Pemeriksaan Plagiasi"
          icon={FileText}
          actions={
            <Button variant="primary" size="sm" onClick={() => onNavigate('review')}>
              Buka Layar Review Naskah
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primitive-neutral-50)' }}>
              <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-navy-950)' }}>
                Draf Terkini: {mahasiswa.statusNaskah}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Similarity Turnitin: <strong>{mahasiswa.turnitinSimilarity}%</strong> • AI Score: <strong>{mahasiswa.turnitinAI}%</strong>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Ambang batas Pedoman 2026: {mahasiswa.jenjang === 'S3' || mahasiswa.jenjang === 'S2' ? 'Maks 20% Similarity & 30% AI' : 'Maks 30% Similarity & 40% AI'} (Status: Terpenuhi)
              </div>
            </div>

            <DocumentItem
              title={`Naskah_Lengkap_${mahasiswa.nim}_${mahasiswa.bentukTA}.pdf`}
              meta="PDF • 4.8 MB • Diunggah Mahasiswa"
              status="Disahkan"
              onDownload={() => downloadUniversalDoc({ namaDokumen: `Naskah_Lengkap_${mahasiswa.nim}_${mahasiswa.bentukTA}.pdf`, jenis: 'Draf Naskah Tugas Akhir' }, mahasiswa)}
            />
          </div>
        </Panel>
      </TabPanel>

      {/* =========================================================================
          6. REVISI
          ========================================================================= */}
      <TabPanel id="revisi" activeTab={activeTab}>
        <Panel title="Catatan Revisi Pasca Ujian" icon={ClipboardCheck} noPadding>
          <Table
            density="compact"
            columns={[
              { key: 'jenisUjian', label: 'Jenis Ujian', width: '180px' },
              { key: 'catatanPenguji', label: 'Catatan Dewan Penguji' },
              { key: 'responsMahasiswa', label: 'Tindak Lanjut Mahasiswa' },
              { key: 'statusRevisi', label: 'Status', width: '160px', render: (val) => <StatusBadge status={val.includes('Disetujui') ? 'Disetujui' : 'Dalam Revisi'} /> }
            ]}
            data={studentRevisi.length > 0 ? studentRevisi : [
              { id: '1', jenisUjian: mahasiswa.tahapAktifNama, catatanPenguji: 'Menunggu ujian berlangsung atau perbaikan telah disahkan dewan penguji.', responsMahasiswa: '-', statusRevisi: 'Selesai' }
            ]}
          />
        </Panel>
      </TabPanel>

      {/* =========================================================================
          7. UJIAN
          ========================================================================= */}
      <TabPanel id="ujian" activeTab={activeTab}>
        <Panel title="Jadwal & Riwayat Sidang Ujian" icon={GraduationCap}>
          {studentUjian.length > 0 ? (
            studentUjian.map((uj) => (
              <div key={uj.id} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>{uj.jenisUjian}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Waktu: {uj.hariTanggal} ({uj.waktu}) • Ruang: {uj.ruang}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-brand-primary)', marginTop: '2px' }}>
                  Peran Dosen: {uj.peranDosenSidang}
                </div>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 'var(--type-body-size)', color: 'var(--color-text-secondary)' }}>
              Mahasiswa belum memiliki jadwal sidang yang dijadwalkan Koorprodi atau berkas sedang dalam proses pendaftaran.
            </p>
          )}
        </Panel>
      </TabPanel>

      {/* =========================================================================
          8. DOKUMEN
          ========================================================================= */}
      <TabPanel id="dokumen" activeTab={activeTab}>
        <Panel title="Arsip Berkas Digital & Berita Acara" icon={FolderArchive}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <DocumentItem
              title={`SK_Penetapan_${mahasiswa.peranDosen.replace(/ /g, '_')}_2026.pdf`}
              meta="PDF • 1.2 MB • Dikeluarkan Dekan FEB UTM"
              status="Disahkan"
              onDownload={() => downloadSKDekan({ nomorSK: `B/389/UN46.1.4/PK.02.01/2026`, jenisSK: `Penetapan ${mahasiswa.peranDosen || 'Dosen Pembimbing'}`, mahasiswaNama: mahasiswa.nama, mahasiswaNIM: mahasiswa.nim, programStudi: mahasiswa.prodi, jenjang: mahasiswa.jenjang, judulTA: mahasiswa.judul }, mahasiswa)}
            />
            <DocumentItem
              title={`Surat_Keterangan_Bebas_Plagiasi_Turnitin_${mahasiswa.nim}.pdf`}
              meta="PDF • 780 KB • UPT Perpustakaan / Prodi"
              status="Disahkan"
              onDownload={() => downloadSKBebasPlagiasi(mahasiswa)}
            />
          </div>
        </Panel>
      </TabPanel>

    </div>
  );
}
