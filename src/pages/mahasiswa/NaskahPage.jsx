import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import { 
  Panel, 
  Button, 
  IconButton, 
  StatusBadge, 
  Badge, 
  Table, 
  Tabs, 
  TabPanel, 
  Modal, 
  FormField, 
  Input, 
  Textarea, 
  FileUpload, 
  Alert 
} from '../../components/ui';
import { notify } from '../../components/feedback';
import { PROGRAM_STUDI_INFO, TURNITIN_RULES, getIstilahTA } from '../../data/pedomanRules';
import { 
  FileText, 
  Download, 
  Upload, 
  CheckCircle2, 
  History, 
  ShieldCheck, 
  Eye, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';
import { downloadSKBebasPlagiasi, downloadUniversalDoc } from '../../utils/pdfDownloader';

/**
 * Halaman 6: Manajemen Berkas Naskah
 * 
 * Menggunakan Document-Oriented Layout:
 * - Dossier Naskah Terkini (Versi aktif, ukuran berkas, halaman, tanggal submit)
 * - Hasil uji Turnitin & AI Content Detection resmi (Peraturan Rektor No. 46/2025)
 * - Riwayat versi draf naskah (Version History)
 * - Pengunggahan versi naskah baru
 */
export default function NaskahPage({ 
  student, 
  onUploadNaskah,
  onNavigate 
}) {
  const prodiInfo = PROGRAM_STUDI_INFO[student.jenjang] || PROGRAM_STUDI_INFO.S1;
  const istilahTA = getIstilahTA(student, prodiInfo);
  const [activeTab, setActiveTab] = useState('dossier');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [naskahCatatan, setNaskahCatatan] = useState('');
  const [naskahFileName, setNaskahFileName] = useState('');

  const handleSaveNaskah = async () => {
    if (!naskahCatatan.trim()) {
      notify('Catatan perubahan versi wajib diisi.', { variant: 'warning' });
      return;
    }
    const result = onUploadNaskah
      ? await onUploadNaskah({
          keterangan: naskahCatatan,
          fileUrl: naskahFileName || `Naskah_${student.nim || 'mhs'}_${Date.now()}.pdf`
        })
      : { success: true };

    if (result && result.success === false) {
      notify(result.message || 'Gagal mengunggah naskah ke basis data.', { variant: 'danger' });
      return;
    }
    notify('Naskah berhasil diunggah!', { variant: 'success' });
    setNaskahCatatan('');
    setNaskahFileName('');
    setIsUploadModalOpen(false);
  };

  const hasDemoVersions = !student.isNewStudent && Boolean(student.turnitin);

  // Versi naskah draf mahasiswa
  const [userVersions, setUserVersions] = useState([]);

  const versionHistory = hasDemoVersions ? [
    {
      id: 'v-3',
      versi: 'Versi 2.1 (Terkini)',
      keterangan: 'Draf Naskah Lengkap Bab I-V Siap Sidang / Ujian Kelayakan',
      tanggal: '18 September 2026',
      ukuran: '4.8 MB',
      turnitin: `${student.turnitin?.similarity || 16}% Similarity`,
      status: 'Disetujui Pembimbing',
      file: `${student.bentukTA || 'Skripsi'}_Final_v2.1.pdf`
    },
    {
      id: 'v-2',
      versi: 'Versi 2.0',
      keterangan: 'Draf Pertama Hasil Pengolahan Data Lapangan',
      tanggal: '02 Agustus 2026',
      ukuran: '4.2 MB',
      turnitin: '22% Similarity',
      status: 'Revisi Pembimbing',
      file: `${student.bentukTA || 'Skripsi'}_Draf_v2.0.pdf`
    },
    {
      id: 'v-1',
      versi: 'Versi 1.0',
      keterangan: 'Naskah Proposal Bab I-III Pasca Seminar Proposal',
      tanggal: '15 Mei 2026',
      ukuran: '2.4 MB',
      turnitin: '18% Similarity',
      status: 'Disahkan',
      file: 'Proposal_Disahkan_v1.0.pdf'
    }
  ] : userVersions;

  const currentVersion = versionHistory.length > 0 ? versionHistory[0] : null;

  const versionColumns = [
    { key: 'versi', label: 'Versi Naskah', width: '150px', render: (val) => <strong>{val}</strong> },
    { key: 'keterangan', label: 'Catatan Perubahan / Tahapan' },
    { key: 'tanggal', label: 'Tanggal Unggah', width: '130px' },
    { key: 'ukuran', label: 'Ukuran', width: '90px' },
    { key: 'turnitin', label: 'Turnitin', width: '120px', render: (val) => <Badge variant="neutral">{val}</Badge> },
    { key: 'status', label: 'Status', width: '160px', render: (val) => <StatusBadge status={val} /> },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '80px',
      align: 'center',
      render: (_, row) => (
        <IconButton
          icon={Download}
          label={`Unduh ${row.file}`}
          size="sm"
          bordered
          onClick={() => downloadUniversalDoc({ namaDokumen: row.file || `Naskah Versi ${row.versi}`, jenis: 'Naskah Tugas Akhir' }, student)}
        />
      )
    }
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Portal Mahasiswa' },
          { label: `Portal ${prodiInfo.jenjang}` },
          { label: 'Manajemen Naskah' }
        ]}
        title={`Manajemen Naskah ${istilahTA}`}
        description={`Dokumen naskah akademik terverifikasi bebas plagiasi dan disahkan oleh dosen pembimbing.`}
        statusBadge={<StatusBadge status={currentVersion ? currentVersion.status : 'Belum Diunggah'} />}
        primaryAction={
          <Button 
            variant="primary" 
            icon={Upload}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Unggah Versi Baru
          </Button>
        }
        secondaryAction={
          currentVersion ? (
            <Button 
              variant="secondary" 
              icon={Download}
              onClick={() => downloadUniversalDoc({ namaDokumen: currentVersion.file || `Naskah Terkini Versi ${currentVersion.versi}`, jenis: 'Naskah Tugas Akhir' }, student)}
            >
              Unduh Naskah Terkini
            </Button>
          ) : null
        }
      />

      {/* Tabs Layout Dokumen */}
      <Tabs
        tabs={[
          { id: 'dossier', label: 'Dossier Naskah Aktif', icon: FileText },
          { id: 'turnitin', label: 'Uji Plagiasi Turnitin', icon: ShieldCheck },
          { id: 'history', label: 'Riwayat Versi Naskah', icon: History, badge: versionHistory.length }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* =========================================================================
          TAB 1: DOSSIER NASKAH AKTIF
          ========================================================================= */}
      <TabPanel id="dossier" activeTab={activeTab}>
        <div className="grid-2col-responsive" style={{ gap: 'var(--space-4)', alignItems: 'stretch' }}>
          
          {/* Kolom Kiri: Lembar Dokumen Naskah */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {currentVersion ? (
              <Panel
                title={currentVersion.file}
                subtitle={`${currentVersion.versi} • Diunggah pada ${currentVersion.tanggal} • Ukuran ${currentVersion.ukuran}`}
                icon={FileText}
                actions={
                  <StatusBadge status={currentVersion.status} />
                }
              >
                {/* Kotak Judul Naskah Terdaftar */}
                <div 
                  style={{ 
                    padding: '16px', 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e2e8f0', 
                    borderTop: 'var(--border-width-medium) solid var(--primitive-navy-800, #1e3a8a)', 
                    borderRadius: 'var(--radius-lg)', 
                    marginBottom: '16px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      Judul Naskah Resmi Terdaftar
                    </span>
                    <Badge variant="primary">
                      {student.bentukTA || 'Skripsi'} {student.jenisTA ? `(${student.jenisTA})` : ''}
                    </Badge>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px', lineHeight: '1.5' }}>
                    {student.judul}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#334155', backgroundColor: '#f8fafc', padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                      <FileText size={12} style={{ color: '#0284c7' }} />
                      <span>{currentVersion.keterangan}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Penulis: <strong>{student.nama}</strong> ({student.nim})
                    </span>
                  </div>
                </div>

                {/* Kelengkapan Bagian Naskah */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                      Kelengkapan Struktur Format Naskah
                    </h4>
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>
                      8 dari 8 Komponen Lengkap
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                    Format standar penulisan naskah mengacu pada Buku Pedoman Tugas Akhir FEB UTM 2026:
                  </p>
                </div>

                {/* Checklist Elegan 2 Kolom */}
                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                    gap: '6px' 
                  }}
                >
                  {[
                    { label: 'Halaman Sampul & Judul', bab: 'Awal' },
                    { label: 'Lembar Persetujuan Pembimbing', bab: 'Awal' },
                    { label: 'Surat Orisinalitas Bermaterai', bab: 'Awal' },
                    { label: 'Abstrak Bahasa Indonesia & Inggris', bab: 'Awal' },
                    { label: 'Daftar Isi, Tabel, & Lampiran', bab: 'Awal' },
                    { label: 'Naskah Lengkap BAB I sampai BAB V', bab: 'Inti' },
                    { label: 'Daftar Pustaka APA Style (Mendeley)', bab: 'Akhir' },
                    { label: 'Lampiran Olah Data & Kuesioner', bab: 'Akhir' }
                  ].map((item, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '8px 10px', 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: 'var(--radius-md)',
                        transition: 'border-color 0.15s ease'
                      }}
                    >
                      <CheckCircle2 size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', color: '#1e293b', fontWeight: '500', lineHeight: '1.3' }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : (
              <Panel
                title="Draf Naskah Tugas Akhir"
                subtitle="Repositori penyimpanan naskah akademik aktif"
                icon={FileText}
                actions={<StatusBadge status="Belum Diunggah" />}
              >
                <div 
                  style={{ 
                    padding: '36px 20px', 
                    textAlign: 'center', 
                    backgroundColor: '#ffffff', 
                    border: '1.5px dashed #cbd5e1', 
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>
                      Belum Ada Draf Naskah yang Diunggah
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', maxWidth: '440px', margin: '0 auto', lineHeight: '1.45' }}>
                      Silakan unggah draf naskah {istilahTA} Bab I-V dalam format PDF (maksimal 15 MB) untuk memulai bimbingan dan uji plagiasi Turnitin.
                    </p>
                  </div>
                  <Button 
                    variant="primary" 
                    icon={Upload} 
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    Unggah Draf Pertama
                  </Button>
                </div>
              </Panel>
            )}
          </div>

          {/* Kolom Kanan: Status Pemeriksaan & Integritas */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Panel
              title="Integritas & Validasi Naskah"
              subtitle="Pemeriksaan plagiasi Turnitin dan pengesahan resmi"
              icon={ShieldCheck}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Banner Status Kelulusan Plagiasi */}
                {student.turnitin ? (
                  <div 
                    style={{ 
                      padding: '14px', 
                      backgroundColor: '#f0fdf4', 
                      border: '1px solid #bbf7d0', 
                      borderRadius: 'var(--radius-lg)' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#14532d' }}>
                          Status Uji Plagiasi: Lolos
                        </span>
                      </div>
                      <Badge variant="green">
                        MEMENUHI SYARAT
                      </Badge>
                    </div>

                    {/* Grid 2 Kartu Metrik Persentase Lengkap dengan Visual Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div 
                        style={{ 
                          padding: '10px 12px', 
                          backgroundColor: '#ffffff', 
                          borderRadius: 'var(--radius-md)', 
                          border: '1px solid #dcfce7',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                          Similarity Index
                        </span>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#15803d', lineHeight: 1 }}>
                          {student.turnitin.similarity}%
                        </div>
                        <div style={{ width: '100%', height: '5px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', margin: '4px 0 2px' }}>
                          <div 
                            style={{ 
                              width: `${Math.min(100, (student.turnitin.similarity / prodiInfo.turnitinSimilarityMax) * 100)}%`, 
                              height: '100%', 
                              backgroundColor: '#16a34a',
                              borderRadius: '999px' 
                            }} 
                          />
                        </div>
                        <span style={{ fontSize: '10px', color: '#475569' }}>
                          Batas Maksimal: <strong>≤ {prodiInfo.turnitinSimilarityMax}%</strong>
                        </span>
                      </div>

                      <div 
                        style={{ 
                          padding: '10px 12px', 
                          backgroundColor: '#ffffff', 
                          borderRadius: 'var(--radius-md)', 
                          border: '1px solid #dcfce7',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                          AI Generated
                        </span>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#0369a1', lineHeight: 1 }}>
                          {student.turnitin.aiDetection}%
                        </div>
                        <div style={{ width: '100%', height: '5px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', margin: '4px 0 2px' }}>
                          <div 
                            style={{ 
                              width: `${Math.min(100, (student.turnitin.aiDetection / prodiInfo.turnitinAiMax) * 100)}%`, 
                              height: '100%', 
                              backgroundColor: '#0284c7',
                              borderRadius: '999px' 
                            }} 
                          />
                        </div>
                        <span style={{ fontSize: '10px', color: '#475569' }}>
                          Batas Maksimal: <strong>≤ {prodiInfo.turnitinAiMax}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    style={{ 
                      padding: '16px', 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: 'var(--radius-lg)' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} style={{ color: '#64748b' }} />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                          Status Uji Plagiasi: Belum Dilakukan
                        </span>
                      </div>
                      <Badge variant="neutral">
                        BELUM DIUJI
                      </Badge>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.45' }}>
                      Pemeriksaan orisinalitas naskah belum dilaksanakan. Hasil uji Turnitin akan diterbitkan setelah draf diajukan untuk verifikasi ujian.
                    </div>
                  </div>
                )}

                {/* Rincian Sertifikasi / Legalitas Naskah */}
                {student.turnitin && (
                  <div 
                    style={{ 
                      padding: '12px 14px', 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '11.5px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Nomor Surat Keterangan:</span>
                      <strong style={{ color: '#0f172a' }}>{student.turnitin.suratKeteranganNo || 'SK-PLAG/FEB-UTM/2026'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Tanggal Uji Resmi:</span>
                      <strong style={{ color: '#0f172a' }}>{student.turnitin.tanggalPeriksa || '18 September 2026'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Status Kelayakan:</span>
                      <span style={{ color: '#16a34a', fontWeight: '700' }}>Siap Pendaftaran Sidang</span>
                    </div>
                  </div>
                )}

                {/* Kotak Dasar Hukum / SOP */}
                <div 
                  style={{ 
                    padding: '10px 12px', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid #e2e8f0', 
                    fontSize: '11.5px', 
                    color: '#475569', 
                    lineHeight: '1.45' 
                  }}
                >
                  <strong style={{ color: '#0f172a' }}>Peraturan Rektor UTM No. 46 Tahun 2025:</strong> Pemeriksaan kemiripan tidak mencakup penghitungan daftar pustaka, kutipan langsung bertanda petik, dan lampiran data kuesioner.
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    icon={ShieldCheck}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setActiveTab('turnitin')}
                  >
                    Buka Rincian Turnitin
                  </Button>
                  {student.turnitin && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      icon={Download}
                      onClick={() => downloadSKBebasPlagiasi(student)}
                    >
                      Unduh SK
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          </div>

        </div>
      </TabPanel>

      {/* =========================================================================
          TAB 2: UJI PLAGIASI TURNITIN
          ========================================================================= */}
      <TabPanel id="turnitin" activeTab={activeTab}>
        <Panel
          title="Laporan Pemeriksaan Turnitin & AI Detection"
          subtitle={TURNITIN_RULES.dasarHukum}
          icon={ShieldCheck}
        >
          <div className="grid-cards-responsive" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            
            <div 
              style={{ 
                padding: '16px', 
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderTop: `3px solid ${student.turnitin ? '#16a34a' : '#94a3b8'}`,
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                Similarity Index (Kemiripan)
              </span>
              <div style={{ fontSize: '26px', fontWeight: '800', color: student.turnitin ? '#15803d' : '#64748b', margin: '2px 0' }}>
                {student.turnitin ? `${student.turnitin.similarity}%` : '-'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Batas Toleransi Maksimal: <strong style={{ color: '#0f172a' }}>≤ {prodiInfo.turnitinSimilarityMax}%</strong>
              </div>
            </div>

            <div 
              style={{ 
                padding: '16px', 
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderTop: `3px solid ${student.turnitin ? '#0284c7' : '#94a3b8'}`,
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                AI Content Detection
              </span>
              <div style={{ fontSize: '26px', fontWeight: '800', color: student.turnitin ? '#0369a1' : '#64748b', margin: '2px 0' }}>
                {student.turnitin ? `${student.turnitin.aiDetection}%` : '-'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Batas Toleransi Maksimal: <strong style={{ color: '#0f172a' }}>≤ {prodiInfo.turnitinAiMax}%</strong>
              </div>
            </div>

            <div 
              style={{ 
                padding: '16px', 
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderTop: 'var(--border-width-medium) solid #475569',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                Surat Keterangan Bebas Plagiasi
              </span>
              <div style={{ fontSize: '14.5px', fontWeight: '700', color: student.turnitin ? '#0f172a' : '#64748b', margin: '4px 0 2px' }}>
                {student.turnitin?.suratKeteranganNo || 'Belum Diterbitkan'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Tanggal Periksa: <strong style={{ color: '#334155' }}>{student.turnitin?.tanggalPeriksa || 'Belum Dilakukan'}</strong>
              </div>
            </div>

          </div>

          <div 
            style={{ 
              padding: '14px 16px', 
              backgroundColor: '#f0fdf4', 
              border: '1px solid #bbf7d0', 
              borderRadius: 'var(--radius-lg)' 
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} style={{ color: '#16a34a' }} />
              Ketentuan Pelaksanaan Uji Plagiasi Turnitin (Pedoman 2026):
            </div>
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '12px', color: '#15803d', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: '1.4' }}>
              <li>Pemeriksaan dilakukan sebelum pendaftaran ujian proposal dan ujian sidang akhir.</li>
              <li>Filter pengecualian (<em>exclude</em>) diaktifkan untuk daftar pustaka, kutipan langsung bertanda petik, dan lampiran data mentah kuesioner.</li>
              <li>Surat Keterangan wajib ditandatangani oleh Dosen Pembimbing/Promotor dan disahkan oleh Koorprodi.</li>
            </ul>
          </div>
        </Panel>
      </TabPanel>

      {/* =========================================================================
          TAB 3: RIWAYAT VERSI DRAF
          ========================================================================= */}
      <TabPanel id="history" activeTab={activeTab}>
        <Panel
          title="Riwayat Versi Naskah Akademik"
          subtitle="Arsip seluruh draf naskah yang pernah diunggah selama masa studi."
          icon={History}
          noPadding
        >
          <Table
            columns={versionColumns}
            data={versionHistory}
            density="normal"
            striped
            emptyContent={
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                Belum ada riwayat versi naskah yang diunggah.
              </div>
            }
          />
        </Panel>
      </TabPanel>

      {/* Modal Upload Naskah Baru */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Unggah Versi Naskah Baru"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveNaskah}>
              Simpan Versi Baru
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <FormField id="naskah-catatan" label="Catatan Perubahan Versi Baru" required helperText="Misal: Perbaikan Bab IV dan penyesuaian matriks regresi hasil bimbingan Sesi 12.">
            <Input
              placeholder="Ringkasan poin revisi..."
              value={naskahCatatan}
              onChange={(e) => setNaskahCatatan(e.target.value)}
            />
          </FormField>

          <FormField id="naskah-file" label="Berkas Naskah Lengkap (PDF)" required helperText="Format PDF maks. 15 MB mencakup Bab I sampai Bab V.">
            <FileUpload
              accept=".pdf"
              maxSizeMB={15}
              onUploadComplete={(file) => setNaskahFileName(file?.name || '')}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
