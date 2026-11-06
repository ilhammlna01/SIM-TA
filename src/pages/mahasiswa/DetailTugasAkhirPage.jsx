import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import { 
  Panel, 
  Button, 
  StatusBadge, 
  Badge, 
  Alert, 
  FormField, 
  Input, 
  Textarea, 
  Select, 
  RadioGroup, 
  Modal,
  StatCard
} from '../../components/ui';
import { PROGRAM_STUDI_INFO, TAKK_RULES, getIstilahTA } from '../../data/pedomanRules';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Sparkles, 
  Edit3, 
  CheckCircle2, 
  Info, 
  Scale,
  Download 
} from 'lucide-react';
import { downloadLembarPengesahan } from '../../utils/pdfDownloader';

/**
 * Halaman 2: Detail Tugas Akhir
 * 
 * Menampilkan rincian administratif lengkap:
 * - Identitas mahasiswa (Nama, NIM, Prodi, Jenjang)
 * - Judul tugas akhir
 * - Bentuk tugas akhir
 * - Dosen pembimbing / Promotor
 * - Ketentuan TAKT vs TAKK (HANYA untuk D3 / S1 sesuai Buku Pedoman 2026)
 * - Sistematika penulisan laporan resmi Bab I-V
 */
export default function DetailTugasAkhirPage({ 
  student, 
  onUpdateStudent, 
  onNavigate 
}) {
  const prodiInfo = PROGRAM_STUDI_INFO[student.jenjang] || PROGRAM_STUDI_INFO.S1;
  const istilahTA = getIstilahTA(student, prodiInfo);
  const isD3orS1 = student.jenjang === 'D3' || student.jenjang === 'S1';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [judulInput, setJudulInput] = useState(student.judul);
  const [jenisInput, setJenisInput] = useState(student.jenisTA || 'TAKT');
  const [skemaInput, setSkemaInput] = useState(student.skemaTAKK || 'Konversi Tidak Langsung (Portofolio)');

  const handleSaveEdit = () => {
    if (onUpdateStudent) {
      onUpdateStudent({
        ...student,
        judul: judulInput,
        jenisTA: isD3orS1 ? jenisInput : 'TAKT',
        skemaTAKK: (isD3orS1 && jenisInput === 'TAKK') ? skemaInput : null
      });
    }
    setIsEditModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Portal Mahasiswa' },
          { label: `Portal ${prodiInfo.jenjang}` },
          { label: 'Detail Tugas Akhir' }
        ]}
        title={`Spesifikasi ${istilahTA}`}
        description={`Dokumen penetapan spesifikasi dan identitas karya ilmiah ${prodiInfo.namaProdi}.`}
        statusBadge={<StatusBadge status={student.statusTahap} />}
        primaryAction={
          <Button 
            variant="primary" 
            icon={Edit3}
            onClick={() => setIsEditModalOpen(true)}
          >
            Ajukan Perubahan Judul
          </Button>
        }
        secondaryAction={
          <Button 
            variant="secondary" 
            icon={Download}
            onClick={() => downloadLembarPengesahan(student)}
          >
            Unduh Lembar Pengesahan (PDF)
          </Button>
        }
      />

      {/* 1. Panel Identitas Pokok Tugas Akhir */}
      <Panel
        title="Identitas Resmi Tugas Akhir"
        subtitle={`Terdaftar secara resmi pada semester ${student.semester}`}
        icon={BookOpen}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <StatCard
            label="Nama Mahasiswa"
            value={student.nama}
            icon={Users}
            tone="navy"
          />
          <StatCard
            label="Nomor Induk Mahasiswa"
            value={student.nim}
            icon={Scale}
            tone="sky"
          />
          <StatCard
            label="Program Studi &amp; Jenjang"
            value={`${student.programStudi} (${prodiInfo.jenjang})`}
            icon={BookOpen}
            tone="amber"
          />
          <StatCard
            label="Bentuk Tugas Akhir"
            value={student.bentukTA || istilahTA}
            icon={FileText}
            tone="green"
          />
        </div>

        {/* Kotak Judul Lengkap */}
        <div style={{ padding: '18px 20px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', borderLeft: '5px solid #1e3a8a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#e0f2fe', padding: '3px 10px', borderRadius: 'var(--radius-md)' }}>
                Judul Tugas Akhir Ditetapkan
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>• Terdaftar resmi di SIM-TA FEB UTM</span>
            </div>
            <Badge variant="navy">Status: Ditetapkan Koorprodi</Badge>
          </div>
          <div style={{ fontSize: '16.5px', fontWeight: '700', color: '#0f172a', lineHeight: '1.55', fontStyle: 'italic' }}>
            "{student.judul}"
          </div>
        </div>
      </Panel>

      {/* 2. KHUSUS D3 & S1: DETAIL BENTUK TAKT vs TAKK */}
      {isD3orS1 && (
        <Panel
          title="Klasifikasi Bentuk: TAKT vs TAKK"
          subtitle="Buku Pedoman 2026 Bab II membedakan Tugas Akhir Tradisional (TAKT) dan Tugas Akhir Kontributif-Kreatif (TAKK)."
          icon={Scale}
        >
          <div className="grid-2col-responsive" style={{ gap: 'var(--space-4)' }}>
            
            {/* Kartu TAKT */}
            <div 
              style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid',
                borderColor: student.jenisTA === 'TAKT' ? '#1e3a8a' : '#e2e8f0',
                backgroundColor: student.jenisTA === 'TAKT' ? '#f0f7ff' : '#ffffff',
                boxShadow: student.jenisTA === 'TAKT' ? '0 2px 6px rgba(30,58,138,0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-lg)', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={16} color="#1e3a8a" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    1. Skema TAKT (Tradisional)
                  </span>
                </div>
                {student.jenisTA === 'TAKT' ? <Badge variant="navy">Skema Terpilih</Badge> : <Badge variant="neutral">Tersedia</Badge>}
              </div>
              <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.5', margin: '0 0 14px' }}>
                Penyusunan naskah laporan penelitian ilmiah empiris/konseptual secara mandiri yang diuji melalui Seminar Proposal dan Ujian Sidang.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#334155' }}>
                  <CheckCircle2 size={14} style={{ color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                  <span>Menempuh Seminar Proposal (D3/S1)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#334155' }}>
                  <CheckCircle2 size={14} style={{ color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                  <span>Menempuh Sidang Tugas Akhir / Skripsi</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#334155' }}>
                  <CheckCircle2 size={14} style={{ color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                  <span>Publikasi artikel ilmiah bersifat opsional / anjuran diseminasi</span>
                </div>
              </div>
            </div>

            {/* Kartu TAKK */}
            <div 
              style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid',
                borderColor: student.jenisTA === 'TAKK' ? '#d97706' : '#e2e8f0',
                backgroundColor: student.jenisTA === 'TAKK' ? '#fffbeb' : '#ffffff',
                boxShadow: student.jenisTA === 'TAKK' ? '0 2px 6px rgba(217,119,6,0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-lg)', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={16} color="#d97706" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    2. Skema TAKK (Kontributif-Kreatif)
                  </span>
                </div>
                {student.jenisTA === 'TAKK' ? <Badge variant="gold">Skema Terpilih</Badge> : <Badge variant="neutral">Tersedia</Badge>}
              </div>
              <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.5', margin: '0 0 14px' }}>
                Bentuk tugas akhir berfokus pada penciptaan karya nyata, prestasi kompetisi, atau konversi portofolio rekognisi.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#334155' }}>
                  <CheckCircle2 size={14} style={{ color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
                  <span><strong>Skema 1 (Langsung):</strong> SINTA 2 / Scopus / Juara Nasional (Konversi Nilai A)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#334155' }}>
                  <CheckCircle2 size={14} style={{ color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
                  <span><strong>Skema 2 (Portofolio):</strong> Akumulasi NA ≥ 70 + publikasi SINTA 5/6; NA ≥ 80 untuk konversi Nilai A langsung</span>
                </div>
              </div>
            </div>

          </div>

          {student.jenisTA === 'TAKK' && student.portofolioData && (
            <div style={{ marginTop: 'var(--space-4)', padding: '16px 18px', backgroundColor: '#fefce8', border: '1px solid #fef08a', borderLeft: '5px solid #ca8a04', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#fef9c3', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
                  Rincian Portofolio Mahasiswa (Skema 2)
                </span>
                <span style={{ fontSize: '12px', color: '#713f12' }}>• Status Kelayakan: <strong>{student.portofolioData.statusKelayakan}</strong></span>
              </div>
              <div style={{ fontSize: '13.5px', color: '#1e293b' }}>
                Total Poin Akumulasi: <strong style={{ color: '#854d0e' }}>{student.portofolioData.totalPoin} Poin</strong> (Nilai Akhir: <strong>{student.portofolioData.nilaiAkhir}</strong>)
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                Kewajiban Luaran: {student.portofolioData.kewajibanPublikasi} • Rekomendasi: <strong>{student.portofolioData.hasilKonversi}</strong>
              </div>

              {/* Rincian Item Bukti Portofolio & Jalur Pengunggahan */}
              {Array.isArray(student.portofolioData.items) && student.portofolioData.items.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#854d0e', textTransform: 'uppercase' }}>
                    Dokumen Bukti Portofolio & Jalur Unggah:
                  </div>
                  {student.portofolioData.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '10px 12px', 
                        backgroundColor: '#ffffff', 
                        borderRadius: 'var(--radius-sm)', 
                        border: '1px solid #fde68a',
                        fontSize: '12px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.nama}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Berkas: <strong>{item.berkas}</strong> • <span style={{ color: '#0369a1', fontWeight: '500' }}>Diunggah di: {item.lokasiUnggah}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{ fontWeight: '700', color: '#b45309' }}>+{item.poin} Poin</span>
                        {onNavigate && (
                          <Button 
                            variant="secondary" 
                            size="xs" 
                            onClick={() => onNavigate(item.menuKey || 'persyaratan')}
                          >
                            Buka Menu
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Panel>
      )}

      {/* 3. Panel Susunan Dosen Pembimbing / Promotor */}
      <Panel
        title={student.jenjang === 'S3' ? 'Susunan Promotor & Kopromotor' : 'Susunan Dosen Pembimbing'}
        subtitle="Ditetapkan berdasarkan Surat Keputusan (SK) Dekan Fakultas Ekonomi dan Bisnis UTM."
        icon={Users}
      >
        <div className="grid-2col-responsive" style={{ gap: '14px' }}>
          {student.pembimbing.map((p, idx) => (
            <div 
              key={idx}
              style={{
                padding: '16px 18px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #0284c7',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={20} color="#0284c7" />
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: '#1e3a8a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {p.peran}
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                    {p.nama}
                  </div>
                  {p.nip && (
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      NIP. {p.nip}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <StatusBadge status={p.statusSetuju ? 'Disetujui' : 'Menunggu Persetujuan'} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* 4. Panel Sistematika Penulisan Naskah Bab I-V */}
      <Panel
        title={`Sistematika Penulisan Naskah ${istilahTA}`}
        subtitle="Struktur wajib bab dan sub-bab sesuai pedoman penulisan Jurusan Manajemen 2026."
        icon={FileText}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {prodiInfo.sistematika?.map((bab, idx) => (
            <div 
              key={idx}
              style={{
                padding: '14px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderTop: 'var(--border-width-medium) solid #1e3a8a',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#1e3a8a', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                  {bab.no}
                </span>
                <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                  {bab.judul}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {bab.sub?.map((s, sIdx) => (
                  <div key={sIdx} style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#0284c7', flexShrink: 0 }}></span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Modal Form Pengajuan Perubahan Judul */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Formulir Perubahan Judul & Bentuk Tugas Akhir"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              Simpan Perubahan
            </Button>
          </>
        }
      >
        <FormField id="edit-judul" label="Usulan Judul Tugas Akhir Baru" required helperText="Gunakan huruf kapital di awal kata sesuai kaidah EYD.">
          <Textarea 
            value={judulInput} 
            onChange={(e) => setJudulInput(e.target.value)} 
            rows={3}
          />
        </FormField>

        {isD3orS1 && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <FormField id="edit-jenis" label="Pilihan Skema Tugas Akhir">
              <RadioGroup
                name="jenis-ta-edit"
                value={jenisInput}
                onChange={setJenisInput}
                options={[
                  { value: 'TAKT', label: 'TAKT (Tugas Akhir Tradisional Empiris)' },
                  { value: 'TAKK', label: 'TAKK (Tugas Akhir Kontributif-Kreatif)' }
                ]}
              />
            </FormField>

            {jenisInput === 'TAKK' && (
              <FormField id="edit-skema-takk" label="Kategori Skema TAKK" helperText="Mengacu Halaman 13-15 Buku Pedoman 2026.">
                <Select
                  value={skemaInput}
                  onChange={(e) => setSkemaInput(e.target.value)}
                  options={[
                    { value: 'Konversi Langsung', label: 'Skema 1: Konversi Langsung (SINTA 2 / Scopus / Juara Lomba)' },
                    { value: 'Konversi Tidak Langsung (Portofolio)', label: 'Skema 2: Konversi Portofolio Prestasi (NA >= 70)' }
                  ]}
                />
              </FormField>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
