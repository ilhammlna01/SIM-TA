import React, { useState } from 'react';
import { formatTanggal } from '../../utils/format';
import {
  FileBadge2,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  CheckCircle,
  FileText,
  Calendar,
  Building,
  UserCheck,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { Card, Badge, Button, Modal, FormField, Input, Select, Alert, Table } from '../../components/ui';
import { PageHeader } from '../../components/shell';
import { DOSEN_FEB_UTM } from '../../data/dosenData';
import { PEJABAT_DEKANAT, DEFAULT_PEJABAT_ID, getPejabatById, pejabatLabel } from '../../data/pejabatDekanat';
import { downloadSKDekan } from '../../utils/pdfDownloader';

export default function PenerbitanSKPage({
  skList = [],
  onCreateSK
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('Semua');
  const [selectedJenjang, setSelectedJenjang] = useState('Semua');
  
  // State Modal Buat SK
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formJenisSK, setFormJenisSK] = useState('SK Dewan Penguji Ujian');
  const [formJenjang, setFormJenjang] = useState('S1');
  const [formNim, setFormNim] = useState('210211100142');
  const [formNamaMhs, setFormNamaMhs] = useState('Dinda Ayu Larasati');
  const [formProdi, setFormProdi] = useState('S-1 Manajemen');
  const [formJudul, setFormJudul] = useState('Pengaruh Live Commerce Interactive Features dan Emotional Value Terhadap Keputusan Pembelian Spontan Produk Batik Madura');
  const [formPenandatangan, setFormPenandatangan] = useState('Dr. Dra. Hj. Iriani Ismail, M.M. (Dekan FEB UTM)');
  const [formDosen1, setFormDosen1] = useState('Dr. Faidal, S.E., M.M.');
  const [formDosen2, setFormDosen2] = useState('Dra. Hj. S. Anugrahini Irawati, M.M.');
  const [formDosen3, setFormDosen3] = useState('Aprilina Susandini, S.E., M.SM.');

  // State Modal Preview SK
  const [previewSK, setPreviewSK] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filter SK
  const filteredSK = skList.filter((sk) => {
    const matchSearch =
      sk.nomorSK.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sk.mahasiswaNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sk.mahasiswaNIM.includes(searchQuery);
    const matchJenis = selectedJenis === 'Semua' || sk.jenisSK === selectedJenis;
    const matchJenjang = selectedJenjang === 'Semua' || sk.jenjang === selectedJenjang;
    return matchSearch && matchJenis && matchJenjang;
  });

  const handleGenerateSKSubmit = (e) => {
    e.preventDefault();
    const nextNomorUrut = 160 + skList.length + 1;
    const nomorSKBaru = `${nextNomorUrut}/UN46.1.4/PK.01.03/2026`;

    const dosenTerkait =
      formJenisSK === 'SK Dewan Penguji Ujian'
        ? [
            { peran: 'Ketua Penguji', nama: formDosen1, nip: '197703032003121002' },
            { peran: 'Sekretaris / Penguji', nama: formDosen2, nip: '196203031988032001' },
            { peran: 'Anggota Penguji', nama: formDosen3, nip: '198704162015042005' }
          ]
        : [
            { peran: 'Pembimbing Utama / Promotor', nama: formDosen1, nip: '196306231989031002' },
            { peran: 'Pembimbing Pendamping / Kopromotor', nama: formDosen2, nip: '196201081987032001' }
          ];

    const newSK = {
      id: `sk-${Date.now()}`,
      nomorSK: nomorSKBaru,
      jenisSK: formJenisSK,
      jenjang: formJenjang,
      programStudi: formProdi,
      mahasiswaNIM: formNim,
      mahasiswaNama: formNamaMhs,
      judulTA: formJudul,
      dosenTerkait,
      tanggalTerbit: formatTanggal(new Date()),
      penandatangan: formPenandatangan,
      status: 'Diterbitkan',
      filePdf: `SK_${formJenisSK.replace(/\s+/g, '_')}_${formNim}.pdf`
    };

    if (onCreateSK) {
      onCreateSK(newSK);
    }

    setNotification({
      type: 'success',
      message: `Surat Keputusan Nomor ${nomorSKBaru} berhasil diterbitkan secara resmi!`
    });

    setIsCreateModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header Institusional */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM' },
          { label: 'Admin Akademik' },
          { label: 'Penerbitan SK Dekan' }
        ]}
        title="Penerbitan Nomor SK Ujian & Pembimbing"
        description="Tata kelola penerbitan Surat Keputusan (SK) Dekan FEB UTM untuk penetapan dosen pembimbing dan dewan penguji sidang."
        statusBadge={<Badge variant="primary">{skList.length} SK Diterbitkan</Badge>}
        primaryAction={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Buat SK Baru
          </Button>
        }
      />

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          dismissible
          onDismiss={() => setNotification(null)}
        />
      )}

      {/* 2. Filter Bar */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
              <input
                id="sk-search-input"
                aria-label="Cari nomor SK, nama mahasiswa, atau NIM"
                type="text"
                placeholder="Cari nomor SK, nama mahasiswa, atau NIM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 34px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--color-border-default)',
                  fontSize: 'var(--type-body-size)',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>

            <select
              id="sk-filter-jenis"
              aria-label="Filter jenis surat keputusan"
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                fontSize: 'var(--type-body-size)',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="Semua">Semua Jenis SK</option>
              <option value="SK Pembimbing / Promotor">SK Pembimbing / Promotor</option>
              <option value="SK Dewan Penguji Ujian">SK Dewan Penguji Ujian</option>
            </select>

            <select
              id="sk-filter-jenjang"
              aria-label="Filter jenjang program studi"
              value={selectedJenjang}
              onChange={(e) => setSelectedJenjang(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                fontSize: 'var(--type-body-size)',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="Semua">Semua Jenjang</option>
              <option value="S1">S1 Sarjana</option>
              <option value="S2">S2 Magister</option>
              <option value="S3">S3 Doktor</option>
              <option value="D3">D3 Diploma</option>
            </select>
          </div>

          <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>
            Total SK Terbit: <strong>{filteredSK.length}</strong> dokumen
          </div>
        </div>
      </Card>

      {/* 3. Daftar SK (Terstandarisasi Table Component) */}
      <Table
        columns={[
          {
            key: 'nomorSK',
            label: 'Nomor SK Resmi',
            sortable: true,
            render: (val, item) => (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileBadge2 size={16} color="var(--color-brand-primary)" />
                  <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)', fontFamily: 'monospace' }}>
                    {val}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '24px' }}>
                  {item.penandatangan}
                </div>
              </div>
            )
          },
          {
            key: 'jenisSK',
            label: 'Jenis Dokumen',
            sortable: true,
            render: (val) => (
              <Badge variant={val.includes('Penguji') ? 'info' : 'success'}>
                {val}
              </Badge>
            )
          },
          {
            key: 'mahasiswaNama',
            label: 'Mahasiswa & Jenjang',
            sortable: true,
            render: (val, item) => (
              <div>
                <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--primitive-navy-950)' }}>
                  {val}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  NIM: {item.mahasiswaNIM} · ({item.jenjang})
                </div>
              </div>
            )
          },
          {
            key: 'dosenTerkait',
            label: 'Susunan Dosen Ditetapkan',
            render: (val) => (
              <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                {val?.map((d, i) => (
                  <div key={i} style={{ marginBottom: '2px' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>{d.peran}: </span>
                    <strong>{d.nama.split(',')[0]}</strong>
                  </div>
                ))}
              </div>
            )
          },
          {
            key: 'tanggalTerbit',
            label: 'Tanggal Terbit',
            sortable: true,
            render: (val) => (
              <span style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                {val}
              </span>
            )
          },
          {
            key: 'aksi',
            label: 'Aksi',
            align: 'right',
            render: (_, item) => (
              <div style={{ display: 'inline-flex', gap: '6px' }}>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Eye}
                  onClick={() => setPreviewSK(item)}
                >
                  Lihat SK
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Download}
                  onClick={() => downloadSKDekan(item)}
                >
                  PDF
                </Button>
              </div>
            )
          }
        ]}
        data={filteredSK}
        density="normal"
        striped
        emptyContent="Tidak ada arsip SK yang cocok dengan pencarian."
      />

      {/* 4. Modal Buat SK Baru */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          title="Penerbitan Surat Keputusan (SK) Baru"
          size="lg"
        >
          <form onSubmit={handleGenerateSKSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              <div>
                <label
                  htmlFor="sk-form-jenis"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
                >
                  Jenis Surat Keputusan:
                </label>
                <select
                  id="sk-form-jenis"
                  value={formJenisSK}
                  onChange={(e) => setFormJenisSK(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px' }}
                >
                  <option value="SK Dewan Penguji Ujian">SK Dewan Penguji Ujian / Sidang</option>
                  <option value="SK Pembimbing / Promotor">SK Penetapan Pembimbing / Promotor</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sk-form-jenjang"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
                >
                  Jenjang Program Studi:
                </label>
                <select
                  id="sk-form-jenjang"
                  value={formJenjang}
                  onChange={(e) => {
                    setFormJenjang(e.target.value);
                    if (e.target.value === 'S3') setFormProdi('S-3 Ilmu Manajemen');
                    else if (e.target.value === 'S2') setFormProdi('S-2 Magister Manajemen');
                    else if (e.target.value === 'D3') setFormProdi('D-3 Entrepreneurship');
                    else setFormProdi('S-1 Manajemen');
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px' }}
                >
                  <option value="S1">S1 Manajemen</option>
                  <option value="S2">S2 Magister Manajemen</option>
                  <option value="S3">S3 Doktor Ilmu Manajemen</option>
                  <option value="D3">D3 Entrepreneurship</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  htmlFor="sk-form-nim"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
                >
                  NIM Mahasiswa:
                </label>
                <input
                  id="sk-form-nim"
                  type="text"
                  value={formNim}
                  onChange={(e) => setFormNim(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label
                  htmlFor="sk-form-nama-mhs"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
                >
                  Nama Lengkap Mahasiswa:
                </label>
                <input
                  id="sk-form-nama-mhs"
                  type="text"
                  value={formNamaMhs}
                  onChange={(e) => setFormNamaMhs(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="sk-form-judul"
                style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
              >
                Judul Tugas Akhir / Skripsi / Tesis / Disertasi:
              </label>
              <textarea
                id="sk-form-judul"
                rows={2}
                value={formJudul}
                onChange={(e) => setFormJudul(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Susunan Dosen Terkait */}
            <div style={{ backgroundColor: 'var(--color-surface-panel-alt)', padding: 'var(--space-3)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '8px', color: 'var(--primitive-navy-950)' }}>
                {formJenisSK === 'SK Dewan Penguji Ujian' ? 'Susunan Dewan Penguji:' : 'Susunan Dosen Pembimbing:'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                <div>
                  <label
                    htmlFor="sk-form-dosen-1"
                    style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}
                  >
                    {formJenisSK === 'SK Dewan Penguji Ujian' ? 'Ketua Penguji:' : 'Pembimbing Utama / Promotor:'}
                  </label>
                  <select
                    id="sk-form-dosen-1"
                    value={formDosen1}
                    onChange={(e) => setFormDosen1(e.target.value)}
                    style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: 'var(--radius-xs)' }}
                  >
                    {DOSEN_FEB_UTM.slice(0, 10).map((d) => (
                      <option key={d.id} value={d.nama}>{d.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sk-form-dosen-2"
                    style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}
                  >
                    {formJenisSK === 'SK Dewan Penguji Ujian' ? 'Sekretaris / Penguji:' : 'Pembimbing Pendamping / Kopromotor:'}
                  </label>
                  <select
                    id="sk-form-dosen-2"
                    value={formDosen2}
                    onChange={(e) => setFormDosen2(e.target.value)}
                    style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: 'var(--radius-xs)' }}
                  >
                    {DOSEN_FEB_UTM.slice(1, 11).map((d) => (
                      <option key={d.id} value={d.nama}>{d.nama}</option>
                    ))}
                  </select>
                </div>

                {formJenisSK === 'SK Dewan Penguji Ujian' && (
                  <div>
                    <label
                      htmlFor="sk-form-dosen-3"
                      style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}
                    >
                      Anggota Penguji:
                    </label>
                    <select
                      id="sk-form-dosen-3"
                      value={formDosen3}
                      onChange={(e) => setFormDosen3(e.target.value)}
                      style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: 'var(--radius-xs)' }}
                    >
                      {DOSEN_FEB_UTM.slice(2, 12).map((d) => (
                        <option key={d.id} value={d.nama}>{d.nama}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="sk-form-penandatangan"
                style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}
              >
                Pejabat Penandatangan SK (Ketik Manual):
              </label>
              <input
                id="sk-form-penandatangan"
                type="text"
                value={formPenandatangan}
                onChange={(e) => setFormPenandatangan(e.target.value)}
                placeholder="e.g. Dr. Dra. Hj. Iriani Ismail, M.M. (Dekan FEB UTM)"
                style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-default)', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                type="submit"
              >
                Terbitkan & Simpan SK
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. Modal Pratinjau Dokumen SK Resmi */}
      {previewSK && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewSK(null)}
          title={`Dokumen Resmi: ${previewSK.nomorSK}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Kop Surat Resmi */}
            <div
              style={{
                border: '2px solid var(--primitive-navy-900)',
                padding: 'var(--space-5)',
                backgroundColor: '#ffffff',
                fontFamily: 'serif',
                lineHeight: 1.6,
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ textAlign: 'center', borderBottom: '3px double var(--primitive-navy-950)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
                </div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  UNIVERSITAS TRUNOJOYO MADURA
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  FAKULTAS EKONOMI DAN BISNIS
                </div>
                <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#444444', marginTop: '2px' }}>
                  Jl. Raya Telang, PO BOX 2 Kamal, Bangkalan - Madura | Telp. (031) 3011146 | Laman: feb.trunojoyo.ac.id
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', textDecoration: 'underline' }}>
                  KEPUTUSAN DEKAN FAKULTAS EKONOMI DAN BISNIS UNIVERSITAS TRUNOJOYO MADURA
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  Nomor: {previewSK.nomorSK}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  TENTANG: PENETAPAN {previewSK.jenisSK.toUpperCase()}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  PROGRAM STUDI {previewSK.programStudi.toUpperCase()} SEMESTER GANJIL TAHUN AKADEMIK 2026/2027
                </div>
              </div>

              <div style={{ fontSize: '12px', textAlign: 'justify', marginBottom: '14px' }}>
                <strong>Menetapkan:</strong> Menugaskan dosen yang tercantum di bawah ini sebagai {previewSK.jenisSK} bagi mahasiswa:
              </div>

              <div style={{ fontSize: '12px', marginLeft: '16px', marginBottom: '16px' }}>
                <div>Nama Mahasiswa : <strong>{previewSK.mahasiswaNama}</strong></div>
                <div>NIM : <strong>{previewSK.mahasiswaNIM}</strong></div>
                <div>Jenjang / Prodi : {previewSK.programStudi} ({previewSK.jenjang})</div>
                <div>Judul Naskah : <em>"{previewSK.judulTA}"</em></div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', border: '1px solid #000000' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '1px solid #000000' }}>
                      <th style={{ border: '1px solid #000000', padding: '6px' }}>No</th>
                      <th style={{ border: '1px solid #000000', padding: '6px' }}>Nama Dosen & Gelar</th>
                      <th style={{ border: '1px solid #000000', padding: '6px' }}>NIP</th>
                      <th style={{ border: '1px solid #000000', padding: '6px' }}>Kedudukan Dalam Tim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewSK.dosenTerkait?.map((d, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000000', padding: '6px', fontWeight: 'bold' }}>{d.nama}</td>
                        <td style={{ border: '1px solid #000000', padding: '6px' }}>{d.nip}</td>
                        <td style={{ border: '1px solid #000000', padding: '6px' }}>{d.peran}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tanda Tangan & QR Code */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed #666666', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <QrCode size={36} color="#000000" />
                  <div style={{ fontSize: '9px', lineHeight: 1.2 }}>
                    <strong>VERIFIKASI DIGITAL UTM</strong><br />
                    Dokumen sah diterbitkan sistem.<br />
                    UUID: {previewSK.id}
                  </div>
                </div>

                <div style={{ textAlign: 'center', minWidth: '220px' }}>
                  <div style={{ fontSize: '11px' }}>Ditetapkan di: Bangkalan</div>
                  <div style={{ fontSize: '11px' }}>Pada tanggal: {previewSK.tanggalTerbit}</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>
                    {previewSK.penandatangan?.includes('(')
                      ? previewSK.penandatangan.split('(')[1]?.replace(')', '')
                      : 'Dekan FEB UTM'}
                  </div>
                  <div style={{ height: '40px' }} />
                  <div style={{ fontSize: '11.5px', fontWeight: 'bold', textDecoration: 'underline' }}>
                    {previewSK.penandatangan?.split('(')[0]?.trim() || 'Prof. Dr. Pribanus Wantara, Drs., M.M.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Cetak, Unduh PDF & Tutup */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setPreviewSK(null)}
              >
                Tutup
              </Button>
              <Button
                variant="outline"
                type="button"
                icon={Printer}
                onClick={() => window.print()}
              >
                Cetak Dokumen
              </Button>
              <Button
                variant="primary"
                type="button"
                icon={Download}
                onClick={() => downloadSKDekan(previewSK)}
              >
                Unduh PDF Resmi (.pdf)
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
