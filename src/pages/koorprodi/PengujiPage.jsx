import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/shell';
import { notify } from '../../components/feedback';
import {
  Panel,
  Button,
  Table,
  Badge,
  StatusBadge,
  Modal,
  FormField,
  Select,
  Input
} from '../../components/ui';

import {
  Scale,
  Users,
  ShieldCheck,
  CheckCircle,
  Plus,
  BookOpen,
  Calendar,
  AlertCircle,
  UserCheck,
  Award,
  Clock,
  MapPin,
  Network
} from 'lucide-react';

import { KOMPOSISI_PENGUJI } from '../../data/pedomanRules';
import { INITIAL_PENETAPAN_PENGUJI } from '../../data/koorprodiData';
import { pengujiApi } from '../../services/api';

/**
 * Memetakan rekam ujian dari backend (tabel ujian_penguji) ke bentuk data
 * yang dipakai antarmuka Penetapan Dewan Penguji.
 * Audit 21 Oktober 2026 (temuan AZ-A1).
 */
function mapUjianKePenetapan(u) {
  const susunan = Array.isArray(u?.susunanPenguji) ? u.susunanPenguji : [];
  return {
    id: u?.id,
    sidangId: u?.id,
    jenjang: u?.jenjang || 'S1',
    programStudi: u?.programStudi || 'S-1 Manajemen',
    prodi: u?.programStudi || 'S-1 Manajemen',
    jenisUjian: u?.jenisUjian || 'Seminar Proposal Skripsi',
    mahasiswa: u?.namaMahasiswa
      ? `${u.namaMahasiswa} (${u.nim})`
      : 'Mahasiswa Tugas Akhir FEB UTM',
    nim: u?.nim || '',
    judul: u?.judul || '',
    pedomanRule: `${u?.jenjang || 'S1'}: Komposisi Penguji Sesuai Pedoman Bab VI`,
    jadwal: u?.tanggalUjian
      ? `${u.tanggalUjian}${u.jamUjian ? ` ${u.jamUjian}` : ''}`
      : 'Waktu Sidang Segera Dikonfirmasi Subbag Akademik',
    tanggalUjian: u?.tanggalUjian || '',
    jamUjian: u?.jamUjian || '',
    ruang: u?.ruang || 'R. Sidang FEB UTM',
    susunanPenguji: susunan.map((p, i) => ({
      nomor: i + 1,
      peran: p.peran || 'Anggota Penguji',
      nama: p.nama || '-',
      nip: p.nip || '-',
      homebase: p.homebase || 'FEB UTM',
      statusKonfirmasi: 'Bersedia'
    })),
    statusSK: u?.statusUjian === 'Terjadwal' ? 'SK Ditetapkan Koorprodi' : u?.statusUjian || 'Ditetapkan',
    statusUjian: u?.statusUjian || 'Terjadwal',
    nilaiFinal: u?.nilaiFinal ?? null,
    persistensi: 'database'
  };
}

/**
 * Memetakan daftar penetapan dari backend ke bentuk simpan-an (payload API).
 */
function mapPenetapanKeUjian(entry) {
  return {
    nim: entry.nim,
    namaMahasiswa: (entry.mahasiswa || '').replace(/\s*\([^)]*\)\s*$/, '').trim(),
    jenjang: entry.jenjang,
    programStudi: entry.programStudi || entry.prodi,
    jenisUjian: entry.jenisUjian,
    judul: entry.judul,
    tanggalUjian: entry.tanggalUjian,
    jamUjian: entry.jamUjian,
    ruang: entry.ruang,
    susunanPenguji: (entry.susunanPenguji || []).map((p) => ({
      peran: p.peran,
      nama: p.nama,
      nip: p.nip,
      homebase: p.homebase
    }))
  };
}

/**
 * HALAMAN 6: PENGUJI (FASE F) — ELEVATED INSTITUTIONAL DESIGN
 * Penetapan & Komposisi Tim Penguji Resmi (Halaman 68-71 Buku Pedoman FEB UTM 2026):
 * - Data mahasiswa terisolasi pada Program Studi Koorprodi
 * - Dewan penguji ahli dapat melibatkan dosen lintas program studi di lingkungan FEB UTM
 * - D3 & S1: 3 Penguji (Ketua Pembimbing, Penguji Utama, Anggota Penguji)
 * - S2 Magister: 4 Penguji (Pembimbing II Pemimpin Sidang, Pembimbing I, 2 Penguji Ahli bukan pembimbing)
 * - S3 Doktor: Komposisi spesifik per tahapan
 */
export default function PengujiPage({
  penetapanList = INITIAL_PENETAPAN_PENGUJI,
  mahasiswaList = [],
  dosenList = [],
  onNavigate,
  currentProdi = 'S-1 Manajemen'
}) {
  // Audit 21 Oktober 2026 (temuan AZ-A1): data penetapan DIMUAT dari
  // backend (tabel ujian_penguji) sehingga tidak hilang saat halaman dimuat
  // ulang. Fallback ke data lokal hanya dipakai ketika backend sedang offline.
  const [dataPenetapan, setDataPenetapan] = useState(penetapanList);
  const [activeJenjangFilter, setActiveJenjangFilter] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [backendAktif, setBackendAktif] = useState(true);

  // Form State Penetapan Baru
  const [newMhsId, setNewMhsId] = useState(mahasiswaList[0]?.id || '');
  const [newJenisUjian, setNewJenisUjian] = useState('Seminar Proposal Skripsi');
  const [newKetuaPenguji, setNewKetuaPenguji] = useState(dosenList[0]?.nama || 'Dra. Hj. S. Anugrahini Irawati, M.M.');
  const [newPenguji1, setNewPenguji1] = useState(dosenList[1]?.id || '');
  const [newPenguji2, setNewPenguji2] = useState(dosenList[2]?.id || '');
  const [newJadwalRuang, setNewJadwalRuang] = useState('');

  // Muat penetapan dewan penguji dari backend saat halaman dibuka.
  useEffect(() => {
    let dibatalkan = false;

    (async () => {
      setIsLoading(true);
      try {
        const data = await pengujiApi.getUjian();
        if (dibatalkan) return;
        const daftar = (Array.isArray(data) ? data : []).map(mapUjianKePenetapan);
        setDataPenetapan(daftar.length > 0 ? daftar : penetapanList);
        setBackendAktif(true);
      } catch (err) {
        if (dibatalkan) return;
        // Backend tidak aktif -> gunakan data lokal sebagai tampilan cadangan.
        setDataPenetapan(penetapanList);
        setBackendAktif(false);
      } finally {
        if (!dibatalkan) setIsLoading(false);
      }
    })();

    return () => { dibatalkan = true; };
  }, []);

  // Sync selected student fallback
  useEffect(() => {
    if (mahasiswaList.length > 0 && !mahasiswaList.some(m => m.id === newMhsId)) {
      setNewMhsId(mahasiswaList[0]?.id || '');
    }
  }, [mahasiswaList, newMhsId]);

  // Filter Data
  const filteredPenetapan = dataPenetapan.filter(p =>
    activeJenjangFilter === 'Semua' || p.jenjang === activeJenjangFilter
  );

  const handleSahkanPenguji = async () => {
    const targetMhs = mahasiswaList.find(m => m.id === newMhsId);
    const p1Dosen = dosenList.find(d => d.id === newPenguji1) || dosenList[1];
    const p2Dosen = dosenList.find(d => d.id === newPenguji2) || dosenList[2];

    const mhsLabel = targetMhs
      ? `${targetMhs.nama} (${targetMhs.nim})`
      : 'Mahasiswa Tugas Akhir FEB UTM';

    const susunanPenguji = [
      { nomor: 1, peran: 'Ketua Penguji (Pembimbing)', nama: newKetuaPenguji, statusKonfirmasi: 'Bersedia' },
      {
        nomor: 2,
        peran: 'Anggota Penguji I (Penguji Utama)',
        nama: p1Dosen?.nama || 'Dr. Faidal, S.E., M.M.',
        nip: p1Dosen?.nip || '-',
        homebase: p1Dosen?.prodiHomebase ? `${p1Dosen.prodiHomebase}${p1Dosen.prodiHomebase !== currentProdi ? ' (Lintas Prodi)' : ''}` : 'FEB UTM',
        statusKonfirmasi: 'Bersedia'
      },
      {
        nomor: 3,
        peran: 'Anggota Penguji II (Penguji Ahli)',
        nama: p2Dosen?.nama || 'Aprilina Susandini, S.E., M.SM.',
        nip: p2Dosen?.nip || '-',
        homebase: p2Dosen?.prodiHomebase ? `${p2Dosen.prodiHomebase}${p2Dosen.prodiHomebase !== currentProdi ? ' (Lintas Prodi)' : ''}` : 'FEB UTM',
        statusKonfirmasi: 'Bersedia'
      }
    ];

    // Audit 21 Oktober 2026 (temuan AZ-A1): penetapan HARUS tersimpan di
    // basis data. Sebelumnya hanya state lokal peramban sehingga seluruh
    // penetapan hilang begitu halaman dimuat ulang dan tidak pernah masuk ke
    // tabel ujian_penguji (akibatnya validasi penugasan penguji tidak pernah
    // berlaku). Field tanggal/jam diturunkan dari input jadwal.
    const jadwal = (newJadwalRuang || '').trim();
    const [tanggalPart, jamPart] = jadwal.includes(',')
      ? jadwal.split(',').map((x) => x.trim())
      : [jadwal, '09:00'];

    const payload = {
      nim: targetMhs?.nim || '',
      namaMahasiswa: targetMhs?.nama || '',
      jenjang: targetMhs?.jenjang || 'S1',
      programStudi: targetMhs?.programStudi || currentProdi,
      jenisUjian: newJenisUjian,
      judul: targetMhs?.judul || 'Penyusunan Tugas Akhir Mahasiswa',
      tanggalUjian: tanggalPart,
      jamUjian: jamPart,
      ruang: 'R. Sidang FEB UTM',
      susunanPenguji: susunanPenguji.map((p) => ({
        peran: p.peran,
        nama: p.nama,
        nip: p.nip,
        homebase: p.homebase
      }))
    };

    setIsSaving(true);
    try {
      const hasil = await pengujiApi.createUjian(payload);
      const tersimpan = mapUjianKePenetapan({
        ...hasil?.data,
        susunanPenguji: hasil?.data?.susunanPenguji || susunanPenguji
      });
      setDataPenetapan(prev => [tersimpan, ...prev]);
      notify(
        `Susunan dewan penguji untuk ${targetMhs?.nama || 'mahasiswa'} berhasil disahkan ke dalam SK Koorprodi dan tersimpan di basis data.`,
        { variant: 'success' }
      );
      setIsModalOpen(false);
    } catch (err) {
      notify(
        `Gagal menyimpan penetapan: ${err.message || 'terjadi kesalahan pada server'}`,
        { variant: 'danger' }
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* 1. Header Resmi */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM', onClick: () => onNavigate('dashboard') },
          { label: 'Koorprodi' },
          { label: 'Penetapan Dewan Penguji' }
        ]}
        title="Penetapan & Komposisi Dewan Penguji"
        description="Pengangkatan susunan dewan penguji seminar proposal, sidang skripsi, tesis, dan disertasi berpedoman pada Bab VI Buku Pedoman FEB UTM 2026."
        statusBadge={
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Badge variant="navy">Prodi: {currentProdi}</Badge>
            <Badge variant="purple">Penguji Ahli: Lintas Prodi FEB UTM Diizinkan</Badge>
          </div>
        }
        primaryAction={
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Tetapkan Tim Penguji Baru
          </Button>
        }
      />

      {/* Callout Penugasan Dewan Penguji Lintas Prodi */}
      <div
        style={{
          padding: '12px 18px',
          backgroundColor: '#F5F3FF',
          border: '1px solid #DDD6FE',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <Network size={22} color="#6D28D9" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '12.5px', color: '#4C1D95', lineHeight: 1.5 }}>
          <strong>Kebijakan Penetapan Dewan Penguji Lintas Program Studi:</strong> Koorprodi <strong>{currentProdi}</strong> berwenang mengangkat Dosen Penguji Utama dan Penguji Anggota (khususnya Penguji Ahli bukan pembimbing) dari dosen program studi lain di lingkungan Fakultas Ekonomi dan Bisnis UTM yang memiliki kepakaran serumpun dengan topik tugas akhir mahasiswa.
        </div>
      </div>

      {/* 2. Banner Rujukan Komposisi Resmi Berdasarkan Pedoman 2026 */}
      <div style={{ marginBottom: '20px' }}>
        <Panel
          title="Standar Komposisi Dewan Penguji Resmi (Buku Pedoman 2026)"
          subtitle="Ketentuan mutlak susunan penguji tanpa kompromi untuk menjaga integritas akademik."
          icon={BookOpen}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {/* Card Komposisi S1 / D3 */}
            <div style={{ border: '1px solid #E2E8F0', borderTop: 'var(--border-width-medium) solid #1E3A8A', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '13.5px' }}>
                  Sarjana (S1) &amp; Diploma (D3)
                </span>
                <Badge variant="navy">3 Penguji</Badge>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                Seminar Proposal &amp; Sidang Skripsi (90 Menit)
              </div>
              <ol style={{ paddingLeft: '16px', margin: 0, fontSize: '11.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Ketua Penguji:</strong> Dosen Pembimbing</li>
                <li><strong>Penguji Utama:</strong> Penguji Ahli (Bukan Pembimbing, Lintas Prodi Diizinkan)</li>
                <li><strong>Anggota Penguji:</strong> Penguji Ahli (Bukan Pembimbing, Lintas Prodi Diizinkan)</li>
              </ol>
            </div>

            {/* Card Komposisi S2 Magister */}
            <div style={{ border: '1px solid #E2E8F0', borderTop: 'var(--border-width-medium) solid #6D28D9', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '13.5px' }}>
                  Magister Manajemen (S2)
                </span>
                <Badge variant="purple">4 Penguji</Badge>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                Sidang Tesis Magister (Pedoman Hal. 69)
              </div>
              <ol style={{ paddingLeft: '16px', margin: 0, fontSize: '11.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Pembimbing II:</strong> Pemimpin Sidang</li>
                <li><strong>Pembimbing I:</strong> Anggota Penguji</li>
                <li><strong>Penguji Ahli I:</strong> Dosen Relevan (Bukan Pembimbing)</li>
                <li><strong>Penguji Ahli II:</strong> Dosen Relevan (Bukan Pembimbing)</li>
              </ol>
            </div>

            {/* Card Komposisi S3 Doktor */}
            <div style={{ border: '1px solid #E2E8F0', borderTop: 'var(--border-width-medium) solid #D97706', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '13.5px' }}>
                  Doktor Ilmu Manajemen (S3)
                </span>
                <Badge variant="gold">3 s/d 7 Penguji</Badge>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                Komposisi Berbeda Menurut Jenis Ujian
              </div>
              <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '11.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Kualifikasi:</strong> 3 Penguji (Promotor, Kopromotor, 1 Dosen Ahli)</li>
                <li><strong>Kelayakan (Desk Review):</strong> 3 Penilai (DPA I, DPA II, Promotor)</li>
                <li><strong>Ujian Tertutup:</strong> 7 Penguji (1 Pemimpin Dekan/Wadek, Promotor, Kopromotor, 3 Internal, 1 Eksternal Luar UTM)</li>
              </ul>
            </div>
          </div>
        </Panel>
      </div>

      {/* 3. Filter Jenjang */}
      <div 
        style={{ 
          padding: '12px 18px', 
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
            Filter Jenjang:
          </span>
          {['Semua', 'S3', 'S2', 'S1', 'D3'].map((j) => (
            <button
              key={j}
              type="button"
              onClick={() => setActiveJenjangFilter(j)}
              style={{
                padding: '4px 10px',
                fontSize: '11.5px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid',
                borderColor: activeJenjangFilter === j ? '#1E3A8A' : '#CBD5E1',
                backgroundColor: activeJenjangFilter === j ? '#1E3A8A' : '#FFFFFF',
                color: activeJenjangFilter === j ? '#FFFFFF' : '#475569',
                fontWeight: activeJenjangFilter === j ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {j === 'Semua' ? 'Semua Jenjang' : j}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '12px', color: '#64748B' }}>
          Menampilkan <strong>{filteredPenetapan.length}</strong> penetapan dewan penguji resmi di prodi {currentProdi}
        </span>
      </div>

      {/* 4. Daftar Penetapan Dewan Penguji Terdaftar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {isLoading ? (
          <Panel>
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              Memuat penetapan dewan penguji dari basis data...
            </div>
          </Panel>
        ) : !backendAktif ? (
          <Panel>
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: 'var(--radius-md)',
                color: '#92400E',
                fontSize: '12.5px',
                lineHeight: 1.5
              }}
            >
              <strong>Backend sedang tidak aktif.</strong> Data yang tampil berasal dari cache lokal
              dan <strong>tidak akan tersimpan</strong>. Aktifkan server SIM-TA (npm start) sebelum
              menetapkan dewan penguji.
            </div>
          </Panel>
        ) : filteredPenetapan.length === 0 ? (
          <Panel>
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              Belum ada penetapan dewan penguji untuk Program Studi {currentProdi}. Silakan klik tombol "Tetapkan Tim Penguji Baru" di atas.
            </div>
          </Panel>
        ) : (
          filteredPenetapan.map((item) => (
            <Panel
              key={item.id}
              title={item.jenisUjian}
              subtitle={`${item.mahasiswa} • Jadwal: ${item.jadwal} (${item.ruang})`}
              icon={Scale}
              actions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Badge variant={item.jenjang === 'S3' ? 'gold' : item.jenjang === 'S2' ? 'purple' : 'navy'}>
                    {item.jenjang}
                  </Badge>
                  <Badge variant="neutral">{item.statusSK}</Badge>
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', color: '#1E3A8A', backgroundColor: '#EFF6FF', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE' }}>
                  Pedoman Komposisi: <strong>{item.pedomanRule}</strong>
                </div>

                {/* Roster Dewan Penguji */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 14px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'grid', gridTemplateColumns: '40px 1.5fr 2fr 130px' }}>
                    <span>No</span>
                    <span>Peran Penguji</span>
                    <span>Nama Dosen / Afiliasi Homebase</span>
                    <span>Konfirmasi</span>
                  </div>
                  {item.susunanPenguji.map((p) => (
                    <div
                      key={p.nomor}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid #F1F5F9',
                        display: 'grid',
                        gridTemplateColumns: '40px 1.5fr 2fr 130px',
                        alignItems: 'center',
                        fontSize: '12px',
                        backgroundColor: p.nomor % 2 === 0 ? '#FAFAFA' : '#FFFFFF'
                      }}
                    >
                      <span style={{ fontWeight: '800', color: '#64748B' }}>{p.nomor}</span>
                      <span style={{ fontWeight: '700', color: '#0F172A' }}>{p.peran}</span>
                      <div>
                        <div style={{ color: '#1E293B', fontWeight: '600' }}>{p.nama}</div>
                        {p.homebase && (
                          <div style={{ fontSize: '11px', color: '#6D28D9', marginTop: '2px', fontWeight: '500' }}>
                            {p.homebase}
                          </div>
                        )}
                        {p.nip && <div style={{ fontSize: '10.5px', color: '#64748B' }}>NIP: {p.nip}</div>}
                      </div>
                      <div>
                        <Badge variant={p.statusKonfirmasi.includes('Bersedia') || p.statusKonfirmasi.includes('Selesai') ? 'green' : 'gold'}>
                          {p.statusKonfirmasi}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          ))
        )}
      </div>

      {/* Modal Penetapan Penguji Baru */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Penetapan Susunan Dewan Penguji Baru"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSahkanPenguji}>
              Sahkan Dewan Penguji
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: '12.5px', color: '#475569', marginBottom: '14px', lineHeight: 1.45 }}>
          Pastikan susunan dewan penguji memenuhi ketentuan Bab VI Buku Pedoman Tugas Akhir FEB UTM 2026. Penguji Ahli dapat berasal dari program studi lain di FEB UTM.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <FormField 
            id="mhs-penguji" 
            label="Mahasiswa Teruji" 
            required
            helperText={`Mahasiswa terdaftar di Program Studi ${currentProdi}.`}
          >
            <Select
              value={newMhsId}
              onChange={(e) => {
                setNewMhsId(e.target.value);
                const match = mahasiswaList.find(m => m.id === e.target.value);
                if (match?.pembimbingUtama) {
                  setNewKetuaPenguji(match.pembimbingUtama);
                }
              }}
              options={
                mahasiswaList.length > 0
                  ? mahasiswaList.map(m => ({
                      value: m.id,
                      label: `${m.nama} — ${m.nim} (${m.jenjang} ${m.programStudi})`
                    }))
                  : [{ value: '', label: `-- Tidak ada mahasiswa di ${currentProdi} --` }]
              }
            />
          </FormField>

          <FormField id="jenis-ujian-tetap" label="Jenis Ujian Sidang" required>
            <Select
              value={newJenisUjian}
              onChange={(e) => setNewJenisUjian(e.target.value)}
              options={[
                { value: 'Seminar Proposal Skripsi', label: 'Seminar Proposal Skripsi (S1)' },
                { value: 'Sidang Skripsi', label: 'Sidang Skripsi Akhir (S1)' },
                { value: 'Diseminasi Tugas Akhir TAKK', label: 'Diseminasi Tugas Akhir TAKK (S1)' },
                { value: 'Sidang Tugas Akhir Vokasi', label: 'Sidang Tugas Akhir Vokasi (D3)' },
                { value: 'Sidang Tesis Magister', label: 'Sidang Tesis Magister (S2)' },
                { value: 'Ujian Kelayakan Disertasi', label: 'Ujian Kelayakan Disertasi (S3)' },
                { value: 'Ujian Tertutup Disertasi', label: 'Ujian Tertutup Disertasi (S3)' }
              ]}
            />
          </FormField>

          <FormField id="ketua-penguji-input" label="Ketua Penguji (Pembimbing / Promotor)" required>
            <Input
              value={newKetuaPenguji}
              onChange={(e) => setNewKetuaPenguji(e.target.value)}
              placeholder="Nama Ketua Penguji / Dosen Pembimbing"
            />
          </FormField>

          <FormField 
            id="penguji-utama-select" 
            label="Penguji Utama / Ahli I (Lintas Prodi Diizinkan)" 
            required
            helperText="Dapat dipilih dari seluruh dosen FEB UTM sesuai kepakaran topik riset."
          >
            <Select
              value={newPenguji1}
              onChange={(e) => setNewPenguji1(e.target.value)}
              options={dosenList.map(d => {
                const isHb = String(d.prodiHomebase || '').toLowerCase().includes(String(currentProdi || '').toLowerCase());
                const tag = d.prodiHomebase ? (isHb ? `[${d.prodiHomebase}]` : `[${d.prodiHomebase} - Lintas Prodi]`) : '';
                return {
                  value: d.id,
                  label: `${d.nama} ${tag} (${d.keahlian})`
                };
              })}
            />
          </FormField>

          <FormField 
            id="penguji-anggota-select" 
            label="Anggota Penguji / Ahli II (Lintas Prodi Diizinkan)" 
            required
            helperText="Dapat dipilih dari seluruh dosen FEB UTM sesuai kepakaran topik riset."
          >
            <Select
              value={newPenguji2}
              onChange={(e) => setNewPenguji2(e.target.value)}
              options={dosenList.map(d => {
                const isHb = String(d.prodiHomebase || '').toLowerCase().includes(String(currentProdi || '').toLowerCase());
                const tag = d.prodiHomebase ? (isHb ? `[${d.prodiHomebase}]` : `[${d.prodiHomebase} - Lintas Prodi]`) : '';
                return {
                  value: d.id,
                  label: `${d.nama} ${tag} (${d.keahlian})`
                };
              })}
            />
          </FormField>

          <FormField id="jadwal-sidang" label="Waktu & Ruangan Ujian" required>
            <Input 
              value={newJadwalRuang}
              onChange={(e) => setNewJadwalRuang(e.target.value)}
              placeholder="Contoh: Senin, 19 Oktober 2026 (09.00 WIB) - R. Sidang 204 FEB" 
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
