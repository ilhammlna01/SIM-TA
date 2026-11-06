import React, { useState, useMemo } from 'react';
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
import { PROGRAM_STUDI_INFO, TAKK_RULES, TAKK_AMBANG, getKewajibanPublikasiTAKK } from '../../data/pedomanRules';
import { confirmDialog, notify } from '../../components/feedback';
import { 
  Award, 
  BookMarked, 
  ExternalLink, 
  CheckCircle2, 
  FileText, 
  Plus, 
  ShieldCheck, 
  AlertCircle,
  Download,
  Trash2,
  TrendingUp,
  Layers,
  Sparkles,
  Search,
  Filter,
  CheckCircle,
  Info,
  Clock,
  ArrowRight,
  Send,
  FileCheck
} from 'lucide-react';
import { downloadRekapPortofolio, downloadUniversalDoc } from '../../utils/pdfDownloader';

/**
 * Halaman Portofolio & Luaran Tugas Akhir (Pengganti & Penyempurnaan Halaman Publikasi)
 * 
 * Portofolio sebagai syarat mutlak mengambil & menyelesaikan skema TAKK (Tugas Akhir Kontributif-Kreatif):
 * - Ambang Batas Minimal: 70 Poin untuk kelayakan mengikuti tahapan TAKK
 * - Ambang Konversi Nilai A Langsung: 80 Poin (bebas ujian sidang skripsi reguler)
 * - Beragam jenis portofolio:
 *   1. Prestasi Kompetisi & Kejuaraan Bisnis / Kewirausahaan (KIBM, PKM-K, Business Plan, dll.)
 *   2. Publikasi Artikel Jurnal Ilmiah (Scopus, SINTA 1-6)
 *   3. Prosiding Seminar / Konferensi Ilmiah
 *   4. Hak Kekayaan Intelektual (HKI / Paten / Hak Cipta)
 *   5. Unit Usaha / Wirausaha Mahasiswa (Startup UMKM Aktif)
 *   6. Sertifikasi Profesi & Kompetensi Mandiri (BNSP, CFA, dll.)
 *   7. Rekognisi Akademik & Penghargaan Lainnya
 */
export default function PortofolioPage({ 
  student, 
  portofolioList = [], 
  onAddPortofolio,
  onDeletePortofolio,
  onNavigate 
}) {
  const prodiInfo = PROGRAM_STUDI_INFO[student.jenjang] || PROGRAM_STUDI_INFO.S1;
  const isTAKK = student.jenisTA === 'TAKK' || 
    student.skemaTAKK?.includes('Portofolio') || 
    student.bentukTA === 'Portofolio' || 
    student.bentukTA?.includes('Kontributif') ||
    student.subBentuk?.includes('Portofolio') ||
    student.judul?.toLowerCase().includes('portofolio') ||
    student.portofolioData !== undefined ||
    student.nim === '210211100219';

  // State navigasi tab dalam halaman (bila student terdaftar Skema 1, default ke 'skema1')
  const isSkema1Student = student?.skemaTAKK === 'Konversi Langsung';
  const [activeTab, setActiveTab] = useState(isSkema1Student ? 'skema1' : 'daftar'); // 'skema1' | 'daftar' | 'rubrik' | 'publikasi-info'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // State Pengajuan Skema 1: Konversi Langsung (Nilai A Otomatis)
  const [skema1Pengajuan, setSkema1Pengajuan] = useState(() => {
    const saved = localStorage.getItem(`skema1_takk_${student?.nim || student?.id}`);
    if (saved === 'CANCELLED' || saved === 'null') {
      return null;
    }
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    // Jika data mahasiswa ada profil publikasi SINTA 2 atau berstatus Konversi Langsung dan belum dibatalkan
    if (isSkema1Student || student?.publikasi?.indeks?.includes('SINTA 2')) {
      return {
        id: 'sk1-fikri',
        jalur: 'Artikel Jurnal Nasional Terakreditasi SINTA 1 atau SINTA 2 (Penulis Pertama)',
        judul: student?.publikasi?.judulArtikel || 'Model Determinan Digital Payment Adoption pada Klaster UMKM Garam Rakyat Madura',
        jurnal: student?.publikasi?.jurnal || 'Jurnal Manajemen Teori dan Terapan (JMTT) Terakreditasi SINTA 2 Kemdikbudristek',
        url: student?.publikasi?.url || 'https://doi.org/10.20473/jmtt.v17i2.2026',
        penulis: `${student?.nama || 'Moh. Fikri Haikal'} (Penulis Pertama), Dosen Pembimbing (Co-Author)`,
        berkas: 'Naskah_Lengkap_Artikel_SINTA2.pdf',
        berkasBukti: 'Letter_of_Acceptance_dan_Sertifikat_SINTA2.pdf',
        tanggalPengajuan: '28 September 2026',
        status: 'Menunggu Verifikasi Koorprodi',
        tahap: 2,
        catatan: 'Pengajuan hak konversi langsung melalui jalur publikasi SINTA 2 sesuai Pedoman FEB 2026 Bab IV.'
      };
    }
    return null;
  });

  const [isSkema1ModalOpen, setIsSkema1ModalOpen] = useState(false);
  const [skema1Form, setSkema1Form] = useState({
    jalur: 'Artikel Jurnal Nasional Terakreditasi SINTA 1 atau SINTA 2 (Penulis Pertama)',
    judul: '',
    penerbit: '',
    url: '',
    penulis: `${student?.nama || 'Mahasiswa'} (Penulis Pertama)`,
    berkas: 'Naskah_Lengkap_Publikasi_SINTA2.pdf',
    berkasBukti: 'Bukti_Terbit_LoA_Sertifikat.pdf',
    catatan: ''
  });

  const handleSkema1Submit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!skema1Form.judul.trim() || !skema1Form.penerbit.trim()) {
      notify('Mohon lengkapi Judul dan Nama Jurnal / Ajang Kompetisi.', { variant: 'warning' });
      return;
    }

    const newPengajuan = {
      id: `sk1-${Date.now()}`,
      jalur: skema1Form.jalur,
      judul: skema1Form.judul,
      jurnal: skema1Form.penerbit,
      url: skema1Form.url,
      penulis: skema1Form.penulis,
      berkas: skema1Form.berkas || 'Naskah_Lengkap_Skema1.pdf',
      berkasBukti: skema1Form.berkasBukti || 'Bukti_Sah_Skema1.pdf',
      tanggalPengajuan: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'Menunggu Verifikasi Koorprodi',
      tahap: 2,
      catatan: skema1Form.catatan || 'Pengajuan Konversi Langsung Skema 1.'
    };

    setSkema1Pengajuan(newPengajuan);
    localStorage.setItem(`skema1_takk_${student?.nim || student?.id}`, JSON.stringify(newPengajuan));
    setIsSkema1ModalOpen(false);
    notify('Pengajuan Skema 1 (Konversi Langsung) berhasil dikirim! Berkas akan diverifikasi oleh Koorprodi dan Tim Validasi TAKK untuk penerbitan SK Dekan.', { variant: 'success' });
  };

  const handleBatalSkema1 = async () => {
    const ok = await confirmDialog({
      title: 'Batalkan Pengajuan Skema 1?',
      message: 'Apakah Anda yakin ingin membatalkan berkas pengajuan Konversi Langsung ini? Anda dapat mengajukan kembali sewaktu-waktu.',
      confirmLabel: 'Ya, Batalkan',
      variant: 'danger'
    });

    if (ok) {
      setSkema1Pengajuan(null);
      localStorage.setItem(`skema1_takk_${student?.nim || student?.id}`, 'CANCELLED');
      notify('Pengajuan Skema 1 telah berhasil dibatalkan.', { variant: 'info' });
    }
  };

  // Ambil data portofolio aktif mahasiswa (baik dari props atau student.portofolioData.items)
  const currentItems = useMemo(() => {
    if (Array.isArray(portofolioList) && portofolioList.length > 0) {
      return portofolioList;
    }
    if (Array.isArray(student?.portofolioData?.items)) {
      return student.portofolioData.items;
    }
    return [];
  }, [portofolioList, student?.portofolioData?.items]);

  // Perhitungan Akumulasi Poin Klaim (Estimasi Mahasiswa) vs Nilai Riil Sidang Dosen (Input Koorprodi)
  const totalPoinKlaim = useMemo(() => {
    return currentItems.reduce((acc, item) => acc + (Number(item.poinKlaim ?? item.poin) || 0), 0);
  }, [currentItems]);

  const itemsWithPoinRiil = useMemo(() => {
    return currentItems.filter(item => item.poinRiil !== null && item.poinRiil !== undefined);
  }, [currentItems]);

  const totalPoinRiil = useMemo(() => {
    return itemsWithPoinRiil.reduce((acc, item) => acc + (Number(item.poinRiil) || 0), 0);
  }, [itemsWithPoinRiil]);

  const isAssessedByKoorprodi = itemsWithPoinRiil.length > 0;

  // Sesuai aturan akademik: Kelayakan mengambil skema TAKK dihitung dari Nilai Riil Sidang (> 70 Poin)
  const minSyaratPoin = TAKK_AMBANG.minLayak; // 70
  const minNilaiAPoin = TAKK_AMBANG.minNilaiA; // 80
  const isEligibleTAKK = isAssessedByKoorprodi && totalPoinRiil > minSyaratPoin;
  const isDirectGradeA = isAssessedByKoorprodi && totalPoinRiil >= minNilaiAPoin;
  const progressPercent = Math.min(100, Math.round(((isAssessedByKoorprodi ? totalPoinRiil : totalPoinKlaim) / TAKK_AMBANG.maksPoin) * 100));

  // Form State untuk Unggah Portofolio Baru
  const [formData, setFormData] = useState({
    nama: '',
    kategori: 'Prestasi Kompetisi Bisnis & Kewirausahaan',
    tingkat: 'Nasional',
    capaian: 'Juara 1 / Medali Emas',
    penyelenggara: 'Kemdikbudristek RI / Puspresnas',
    tahun: '2026',
    poin: 45,
    nomorDokumen: '',
    urlValidasi: '',
    berkas: 'Berkas_Sertifikat_Portofolio.pdf',
    catatan: ''
  });

  // Otomatisasi estimasi poin berdasarkan pedoman resmi FEB UTM
  const handleKategoriTingkatChange = (newKategori, newTingkat, newCapaian) => {
    let calculatedPoin = 25;
    const kat = newKategori || formData.kategori;
    const ting = newTingkat || formData.tingkat;
    const cap = newCapaian || formData.capaian;

    if (kat.includes('Kompetisi') || kat.includes('Kejuaraan')) {
      if (ting === 'Internasional') {
        calculatedPoin = cap.includes('1') ? 50 : cap.includes('2') ? 45 : cap.includes('3') ? 40 : 30;
      } else if (ting === 'Nasional') {
        calculatedPoin = cap.includes('1') ? 45 : cap.includes('2') ? 40 : cap.includes('3') ? 35 : 25;
      } else if (ting === 'Regional / Provinsi') {
        calculatedPoin = cap.includes('1') ? 30 : cap.includes('2') ? 25 : 20;
      } else {
        calculatedPoin = cap.includes('1') ? 20 : 15;
      }
    } else if (kat.includes('Publikasi') || kat.includes('Jurnal')) {
      if (ting === 'Internasional' || cap.includes('Scopus') || cap.includes('SINTA 2')) {
        calculatedPoin = 45;
      } else if (cap.includes('SINTA 3') || cap.includes('SINTA 4')) {
        calculatedPoin = 35;
      } else {
        calculatedPoin = 25;
      }
    } else if (kat.includes('Hak Kekayaan Intelektual') || kat.includes('HKI') || kat.includes('Paten')) {
      calculatedPoin = ting === 'Internasional' ? 45 : 35;
    } else if (kat.includes('Unit Usaha') || kat.includes('Wirausaha') || kat.includes('Startup')) {
      calculatedPoin = ting === 'Nasional' ? 40 : 35;
    } else if (kat.includes('Sertifikasi')) {
      calculatedPoin = ting === 'Internasional' ? 35 : 25;
    } else {
      calculatedPoin = 20;
    }

    setFormData(prev => ({
      ...prev,
      kategori: kat,
      tingkat: ting,
      capaian: cap,
      poin: calculatedPoin
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      notify('Mohon isi Judul / Nama Portofolio Prestasi.', { variant: 'warning' });
      return;
    }

    const calculatedPoin = Number(formData.poin) || 25;
    const newItem = {
      id: `porto-${Date.now()}`,
      nama: formData.nama,
      kategori: formData.kategori,
      tingkat: formData.tingkat,
      capaian: formData.capaian,
      penyelenggara: formData.penyelenggara,
      tahun: formData.tahun,
      poinKlaim: calculatedPoin,
      poin: calculatedPoin, // Backward compatibility
      poinRiil: null, // Menunggu sidang offline dosen & input Koorprodi
      nomorDokumen: formData.nomorDokumen || `REG-${Date.now().toString().slice(-6)}`,
      urlValidasi: formData.urlValidasi,
      berkas: formData.berkas || 'Berkas_Portofolio.pdf',
      tanggalUnggah: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      lokasiUnggah: 'Menu Portofolio',
      status: 'Menunggu Verifikasi Berkas (Admin)',
      catatan: formData.catatan
    };

    if (onAddPortofolio) {
      onAddPortofolio(newItem);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsUploadModalOpen(false);
      // Reset form
      setFormData({
        nama: '',
        kategori: 'Prestasi Kompetisi Bisnis & Kewirausahaan',
        tingkat: 'Nasional',
        capaian: 'Juara 1 / Medali Emas',
        penyelenggara: 'Kemdikbudristek RI / Puspresnas',
        tahun: '2026',
        poin: 45,
        nomorDokumen: '',
        urlValidasi: '',
        berkas: 'Berkas_Sertifikat_Portofolio.pdf',
        catatan: ''
      });
      notify(`Portofolio "${newItem.nama}" (${newItem.poinKlaim} Poin Klaim) berhasil diajukan! Berkas akan diverifikasi oleh Admin, lalu disidangkan offline bersama Tim Dosen sebelum penetapan nilai akhir oleh Koorprodi.`, { variant: 'success' });
    }, 400);
  };

  // Handler Download Rekap PDF Resmi
  const handleDownloadRekap = async () => {
    setDownloadingId('rekap');
    try {
      await downloadRekapPortofolio(student, currentItems);
    } catch (err) {
      console.error('Gagal mengunduh rekap portofolio:', err);
      notify('Terjadi kesalahan saat membuat berkas PDF rekap portofolio.', { variant: 'warning' });
    } finally {
      setDownloadingId(null);
    }
  };

  // Handler Download Bukti Item Individual
  const handleDownloadItemProof = async (item) => {
    setDownloadingId(item.id);
    try {
      await downloadUniversalDoc({
        namaDokumen: item.nama,
        jenis: `Dokumen Bukti Portofolio (${item.kategori})`,
        tanggal: item.tanggalUnggah || '10 Oktober 2026',
        ukuran: '1.8 MB'
      }, student);
    } catch (err) {
      console.error('Gagal unduh bukti portofolio:', err);
      notify('Gagal mengunduh berkas bukti.', { variant: 'warning' });
    } finally {
      setDownloadingId(null);
    }
  };

  // Filter Portofolio Items
  const filteredItems = useMemo(() => {
    return currentItems.filter(item => {
      const matchSearch = (item.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.kategori || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.penyelenggara || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchKategori = filterKategori === 'Semua' || item.kategori === filterKategori;
      return matchSearch && matchKategori;
    });
  }, [currentItems, searchQuery, filterKategori]);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Portal Mahasiswa' },
          { label: `Portal ${prodiInfo.jenjang}` },
          { label: 'Portofolio & Luaran Prestasi' }
        ]}
        title="Portofolio Prestasi & Syarat Skema TAKK"
        description="Pusat pengelolaan dan validasi dokumen portofolio mandiri mahasiswa sebagai syarat pemenuhan kelayakan Tugas Akhir Kontributif-Kreatif (TAKK) FEB UTM."
        statusBadge={
          <StatusBadge 
            status={
              isDirectGradeA 
                ? 'Selesai' 
                : isEligibleTAKK 
                ? 'Disetujui' 
                : (isAssessedByKoorprodi ? totalPoinRiil : totalPoinKlaim) > 0 
                ? 'Menunggu Persetujuan' 
                : 'Belum Lengkap'
            } 
          />
        }
        primaryAction={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant="secondary" 
              icon={Download}
              onClick={handleDownloadRekap}
              isLoading={downloadingId === 'rekap'}
            >
              Unduh Rekap Portofolio (PDF)
            </Button>
            <Button 
              variant="primary" 
              icon={Plus}
              onClick={() => setIsUploadModalOpen(true)}
            >
              Unggah Portofolio Baru
            </Button>
          </div>
        }
      />

      {/* 1. HERO BANNER: STATUS KELAYAKAN SKEMA TAKK & AKUMULASI POIN */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        {isTAKK ? (
          <div style={{
            padding: '20px 22px',
            backgroundColor: isDirectGradeA ? '#f0fdf4' : isEligibleTAKK ? '#eff6ff' : '#fffbeb',
            border: `1.5px solid ${isDirectGradeA ? '#86efac' : isEligibleTAKK ? '#93c5fd' : '#fde68a'}`,
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    backgroundColor: isDirectGradeA ? '#dcfce7' : isEligibleTAKK ? '#dbeafe' : '#fef3c7', 
                    color: isDirectGradeA ? '#166534' : isEligibleTAKK ? '#1e40af' : '#92400e', 
                    padding: '3px 10px', 
                    borderRadius: 'var(--radius-md)' 
                  }}>
                    Skema TAKK — Penilaian Portofolio Karya Mandiri
                  </span>
                  <Badge variant={isDirectGradeA ? 'green' : isEligibleTAKK ? 'navy' : isAssessedByKoorprodi ? 'error' : 'amber'}>
                    {isDirectGradeA 
                      ? 'Konversi Nilai A Langsung' 
                      : isEligibleTAKK 
                      ? 'Layak Skema TAKK (> 70 Poin)' 
                      : isAssessedByKoorprodi 
                      ? 'Belum Layak (≤ 70 Poin)' 
                      : 'Menunggu Sidang Dosen'}
                  </Badge>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
                  {isDirectGradeA 
                    ? 'Selamat! Akumulasi Nilai Riil Sidang Memenuhi Syarat Konversi Nilai A Langsung' 
                    : isEligibleTAKK 
                    ? `Selamat! Nilai Riil Sidang Dosen (${totalPoinRiil} Poin) Memenuhi Syarat Kelayakan TAKK (> 70 Poin)` 
                    : isAssessedByKoorprodi
                    ? `Hasil Sidang Dosen (${totalPoinRiil} Poin) Belum Memenuhi Ambang Batas Minimal 70 Poin`
                    : totalPoinKlaim > 0
                    ? `Portofolio Diajukan (${totalPoinKlaim} Poin Klaim) — Menunggu Sidang Penilaian Dosen & Input Koorprodi`
                    : 'Belum Ada Portofolio Diunggah — Syarat Skema TAKK Belum Terpenuhi (0 Poin)'}
                </h2>
                <p style={{ fontSize: '13px', color: '#475569', margin: 0, maxWidth: '800px', lineHeight: '1.5' }}>
                  {isDirectGradeA
                    ? `Berdasarkan Berita Acara Sidang Portofolio Dosen yang telah diinput resmi oleh Koorprodi, Anda memperoleh akumulasi nilai riil sebesar ${totalPoinRiil} Poin (≥ 80 Poin). Anda dibebaskan dari Ujian Sidang Skripsi reguler dan berhak atas konversi Nilai A Langsung.`
                    : isEligibleTAKK
                    ? `Berdasarkan Berita Acara Sidang Portofolio Dosen yang telah diinput resmi oleh Koorprodi, akumulasi nilai riil Anda telah mencapai ${totalPoinRiil} Poin. Nilai ini melampaui batas minimal 70 Poin (> 70), sehingga Anda resmi dinyatakan LAYAK mengambil dan menyelesaikan Skema TAKK.`
                    : isAssessedByKoorprodi
                    ? `Tim Dosen telah menyidangkan portofolio Anda dan Koorprodi telah menginput nilai riil sebesar ${totalPoinRiil} Poin. Karena nilai belum melampaui 70 Poin (> 70), Anda belum layak mengambil skema TAKK. Silakan lengkapi berkas portofolio prestasi tambahan atau alihkan ke skripsi reguler (TAKT).`
                    : totalPoinKlaim > 0
                    ? `Anda telah mengajukan portofolio dengan estimasi ${totalPoinKlaim} Poin klaim. Sesuai prosedur akademik, nilai yang diberikan tidak otomatis penuh: berkas akan diverifikasi administratif oleh Admin, disidangkan secara offline bersama Tim Dosen, dan nilai sesungguhnya akan diinput resmi oleh Koorprodi (syarat kelayakan: > 70 Poin).`
                    : 'Mahasiswa yang memilih skema TAKK (Tugas Akhir Kontributif-Kreatif) WAJIB mengunggah portofolio mandiri (kejuaraan bisnis, artikel ilmiah, HKI, wirausaha, sertifikasi) dengan batas minimal > 70 Poin yang telah disahkan melalui Sidang Dosen untuk dapat mengambil dan lulus jalur ini.'}
                </p>
              </div>

              {/* Angka Total Poin Riil & Klaim */}
              <div style={{
                textAlign: 'right',
                padding: '12px 18px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(0,0,0,0.08)',
                minWidth: '200px'
              }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                  Nilai Riil Sidang Dosen
                </div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: isDirectGradeA ? '#15803d' : isEligibleTAKK ? '#1e40af' : isAssessedByKoorprodi ? '#b45309' : '#64748b', lineHeight: '1.1' }}>
                  {isAssessedByKoorprodi ? totalPoinRiil : '—'} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>/ 100</span>
                </div>
                <div style={{ fontSize: '11px', color: isEligibleTAKK ? '#16a34a' : isAssessedByKoorprodi ? '#dc2626' : '#d97706', fontWeight: '700', marginTop: '4px' }}>
                  {isDirectGradeA ? 'Predikat Nilai A (4.00)' : isEligibleTAKK ? 'Layak Skema TAKK (> 70)' : isAssessedByKoorprodi ? `Belum Layak (Kurang ${71 - totalPoinRiil} Poin)` : `Klaim: ${totalPoinKlaim} Poin (Belum Sidang)`}
                </div>
              </div>
            </div>

            {/* Visual Milestone Progress Bar */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                <span>0 Poin (Mulai)</span>
                <span style={{ color: (isAssessedByKoorprodi ? totalPoinRiil : totalPoinKlaim) > 70 ? '#15803d' : '#b45309' }}>
                  Syarat Layak TAKK: &gt; 70 Poin {(isAssessedByKoorprodi ? totalPoinRiil : totalPoinKlaim) > 70 ? ' (tercapai)' : ''}
                </span>
                <span style={{ color: (isAssessedByKoorprodi ? totalPoinRiil : totalPoinKlaim) >= 80 ? '#15803d' : '#64748b' }}>
                  Ambang Konversi Nilai A: ≥ 80 Poin {(isAssessedByKoorprodi ? totalPoinRiil : totalPoinKlaim) >= 80 ? ' (tercapai)' : ''}
                </span>
                <span>100 Poin (Maksimal)</span>
              </div>
              <div style={{ width: '100%', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                <div 
                  style={{ 
                    width: `${progressPercent}%`, 
                    height: '100%', 
                    background: isDirectGradeA 
                      ? 'linear-gradient(90deg, #22c55e, #15803d)' 
                      : isEligibleTAKK 
                      ? 'linear-gradient(90deg, #3b82f6, #1d4ed8)' 
                      : 'linear-gradient(90deg, #f59e0b, #d97706)',
                    borderRadius: '10px',
                    transition: 'width 0.4s ease'
                  }} 
                />
                {/* Marker 70 */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '70%', width: '2px', backgroundColor: '#ffffff', opacity: 0.9 }} title="Batas Minimal > 70 Poin" />
                {/* Marker 80 */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '80%', width: '2px', backgroundColor: '#ffffff', opacity: 0.9 }} title="Batas Nilai A 80 Poin" />
              </div>
            </div>
          </div>
        ) : (
          <Alert 
            variant="info" 
            title="Informasi Portofolio & Luaran Tugas Akhir Non-TAKK"
          >
            <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
              Anda saat ini terdaftar pada skema <strong>{student.jenisTA} ({student.bentukTA || 'Skripsi Reguler'})</strong>. 
              Dokumen portofolio, publikasi ilmiah, dan sertifikat yang Anda unggah di halaman ini akan diakui sebagai 
              <strong> Surat Keterangan Pendamping Ijazah (SKPI)</strong>, diseminasi karya ilmiah, dan rekam jejak prestasi akademik FEB UTM.
              Bila Anda ingin beralih ke skema <strong>TAKK (Portofolio Mandiri)</strong>, Anda dapat mengajukannya melalui Koorprodi dengan syarat minimal &gt; 70 Poin portofolio hasil sidang tim dosen.
            </div>
          </Alert>
        )}
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: 'var(--space-4)' }}>
        <StatCard
          label="Total Portofolio Diunggah"
          value={`${currentItems.length} Dokumen`}
          tone="navy"
          icon={Layers}
        />
        <StatCard
          label="Nilai Riil Sidang Dosen"
          value={isAssessedByKoorprodi ? `${totalPoinRiil} Poin` : 'Menunggu Sidang'}
          caption={isAssessedByKoorprodi ? (totalPoinRiil > 70 ? 'Layak TAKK (>70)' : 'Belum Layak (≤70)') : `Klaim: ${totalPoinKlaim} Poin`}
          tone={isEligibleTAKK ? 'green' : isAssessedByKoorprodi ? 'red' : 'amber'}
          icon={Award}
        />
        <StatCard
          label="Status Kelayakan TAKK"
          value={isDirectGradeA ? 'Konversi Nilai A' : isEligibleTAKK ? 'Layak Mengambil TAKK' : isAssessedByKoorprodi ? 'Belum Layak (≤ 70)' : 'Menunggu Sidang'}
          caption="Syarat kelayakan resmi: > 70 Poin"
          tone={isDirectGradeA ? 'green' : isEligibleTAKK ? 'sky' : 'amber'}
          icon={ShieldCheck}
        />
        <StatCard
          label="Kewajiban Luaran Pendukung"
          value={isTAKK ? getKewajibanPublikasiTAKK(isAssessedByKoorprodi ? totalPoinRiil : totalPoinKlaim) : (prodiInfo.jenjang === 'S3' ? 'Scopus Q4' : prodiInfo.jenjang === 'S2' ? 'SINTA 2' : 'Opsional')}
          tone="sky"
          icon={BookMarked}
        />
      </div>

      {/* 3. SUB-NAV TABS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '18px', paddingBottom: '2px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('skema1')}
          style={{
            padding: '8px 16px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'skema1' ? '700' : '500',
            color: activeTab === 'skema1' ? '#b45309' : '#64748b',
            borderBottom: activeTab === 'skema1' ? '3px solid #b45309' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Sparkles size={16} color="#d97706" />
          <span>Skema 1: Konversi Langsung</span>
          <Badge variant="gold">Jalur Cepat</Badge>
        </button>

        <button
          onClick={() => setActiveTab('daftar')}
          style={{
            padding: '8px 16px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'daftar' ? '700' : '500',
            color: activeTab === 'daftar' ? '#1e3a8a' : '#64748b',
            borderBottom: activeTab === 'daftar' ? '3px solid #1e3a8a' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Layers size={16} />
          <span>Skema 2: Portofolio Kumulatif ({currentItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rubrik')}
          style={{
            padding: '8px 16px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'rubrik' ? '700' : '500',
            color: activeTab === 'rubrik' ? '#1e3a8a' : '#64748b',
            borderBottom: activeTab === 'rubrik' ? '3px solid #1e3a8a' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Award size={16} />
          <span>Pedoman & Rubrik Poin TAKK FEB UTM</span>
        </button>

        <button
          onClick={() => setActiveTab('publikasi-info')}
          style={{
            padding: '8px 16px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'publikasi-info' ? '700' : '500',
            color: activeTab === 'publikasi-info' ? '#1e3a8a' : '#64748b',
            borderBottom: activeTab === 'publikasi-info' ? '3px solid #1e3a8a' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <BookMarked size={16} />
          <span>Ketentuan Publikasi Ilmiah ({prodiInfo.jenjang})</span>
        </button>
      </div>

      {/* 4. TAB CONTENT */}

      {/* TAB KHUSUS: SKEMA 1 (KONVERSI LANGSUNG — NILAI A) */}
      {activeTab === 'skema1' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Hero Banner Skema 1 */}
          <div style={{
            padding: '22px 24px',
            backgroundColor: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderLeft: '6px solid #d97706',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: 'var(--radius-md)' }}>
                    Buku Pedoman FEB UTM 2026 Bab IV (Hal 13-15)
                  </span>
                  <Badge variant="gold">Konversi Nilai A Langsung</Badge>
                </div>
                <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                  Skema 1: Konversi Langsung (Direct Conversion)
                </h2>
                <p style={{ fontSize: '13.5px', color: '#475569', margin: 0, lineHeight: '1.6', maxWidth: '850px' }}>
                  Mahasiswa yang berhasil menerbitkan artikel ilmiah pada <strong>Jurnal Nasional Terakreditasi SINTA 1 atau SINTA 2</strong>, <strong>Jurnal Internasional Bereputasi Scopus (min. Q4) / Web of Science (WoS)</strong>, atau meraih <strong>Juara 1–3 Lomba Bereputasi Nasional (Puspresnas Kemdikbudristek) / Internasional</strong> sebagai penulis pertama/ketua tim:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '12px', fontSize: '12.5px', color: '#1e3a8a', fontWeight: '600' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={15} color="#16a34a" /> Konversi Nilai A Langsung via SK Dekan
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={15} color="#16a34a" /> Tidak Perlu Publikasi Tambahan
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={15} color="#16a34a" /> Diseminasi Terbuka di Prodi
                  </span>
                </div>
              </div>

              {!skema1Pengajuan && (
                <Button
                  variant="gold"
                  icon={Sparkles}
                  onClick={() => setIsSkema1ModalOpen(true)}
                  style={{ alignSelf: 'center', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)' }}
                >
                  Ajukan Berkas Skema 1
                </Button>
              )}
            </div>
          </div>

          {/* Kondisi 1: Mahasiswa Sudah Mengajukan Berkas Skema 1 */}
          {skema1Pengajuan ? (
            <Panel
              title="Dossier Pengajuan Konversi Langsung Mahasiswa"
              subtitle={`Status Berkas: ${skema1Pengajuan.status}`}
              icon={FileCheck}
              actions={
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSkema1Form({
                        jalur: skema1Pengajuan.jalur,
                        judul: skema1Pengajuan.judul,
                        penerbit: skema1Pengajuan.jurnal,
                        url: skema1Pengajuan.url,
                        penulis: skema1Pengajuan.penulis,
                        berkas: skema1Pengajuan.berkas,
                        berkasBukti: skema1Pengajuan.berkasBukti,
                        catatan: skema1Pengajuan.catatan || ''
                      });
                      setIsSkema1ModalOpen(true);
                    }}
                  >
                    Perbarui Berkas
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={handleBatalSkema1}
                  >
                    Batalkan
                  </Button>
                </div>
              }
            >
              {/* Stepper / Timeline 4 Langkah */}
              <div style={{ marginBottom: '24px', padding: '18px 20px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                  Alur Prosedur Pengesahan Skema 1 (Konversi Langsung FEB UTM)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {/* Step 1 */}
                  <div style={{ padding: '12px 14px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0', borderLeft: '4px solid #16a34a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <CheckCircle2 size={16} color="#16a34a" />
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#166534' }}>1. Pengajuan Berkas</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#475569' }}>
                      Diajukan oleh Mahasiswa tgl <strong>{skema1Pengajuan.tanggalPengajuan}</strong>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div style={{ padding: '12px 14px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a', borderLeft: '4px solid #d97706' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Clock size={16} color="#d97706" />
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#b45309' }}>2. Verifikasi Koorprodi</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#475569' }}>
                      Status: <strong>Sedang Diverifikasi</strong> oleh Koorprodi &amp; Tim TAKK
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ padding: '12px 14px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', borderLeft: '4px solid #94a3b8', opacity: 0.85 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <ShieldCheck size={16} color="#64748b" />
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>3. Penerbitan SK Dekan</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Penetapan Konversi <strong>Nilai A Langsung</strong>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div style={{ padding: '12px 14px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', borderLeft: '4px solid #94a3b8', opacity: 0.85 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Award size={16} color="#64748b" />
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>4. Diseminasi Terbuka</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Presentasi poster/karya di Program Studi sebelum Yudisium
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Artikel / Prestasi Terdaftar */}
              <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: '#e0f2fe', padding: '3px 10px', borderRadius: 'var(--radius-sm)' }}>
                    {skema1Pengajuan.jalur}
                  </span>
                  <Badge variant="amber">Status: {skema1Pengajuan.status}</Badge>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px', lineHeight: '1.5' }}>
                  "{skema1Pengajuan.judul}"
                </h3>
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong>Penerbit / Jurnal / Penyelenggara:</strong>
                  <span>{skema1Pengajuan.jurnal}</span>
                  {skema1Pengajuan.url && (
                    <a href={skema1Pengajuan.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}>
                      <span>Tautan Validasi DOI/Web</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #f1f5f9' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Susunan Penulis:</span>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{skema1Pengajuan.penulis}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Berkas Naskah Lengkap:</span>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e3a8a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} />
                      <span>{skema1Pengajuan.berkas}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Bukti Sah (LoA / Sertifikat):</span>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#16a34a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} />
                      <span>{skema1Pengajuan.berkasBukti}</span>
                    </div>
                  </div>
                </div>

                {skema1Pengajuan.catatan && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                    Catatan Pengaju: "{skema1Pengajuan.catatan}"
                  </div>
                )}
              </div>
            </Panel>
          ) : (
            /* Kondisi 2: Belum Mengajukan Skema 1 */
            <Panel
              title="Formulir &amp; Pintu Pengajuan Skema 1 (Konversi Langsung)"
              subtitle="Pendaftaran mandiri capaian publikasi SINTA 1-2 / Scopus / Juara Nasional untuk pembebasan ujian sidang skripsi."
              icon={Sparkles}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '18px 20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#166534', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={18} /> Apakah Anda Memenuhi Syarat Skema 1?
                  </h4>
                  <p style={{ fontSize: '13px', color: '#14532d', lineHeight: '1.6', margin: '0 0 14px' }}>
                    Jika Anda memiliki salah satu bukti sah di bawah ini, Anda <strong>TIDAK PERLU</strong> mengumpulkan 70–100 poin portofolio pada Skema 2. Anda dapat langsung mengunggah berkas untuk diterbitkan <strong>Surat Keputusan (SK) Dekan Penetapan Konversi Langsung</strong>:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '14px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #dcfce7' }}>
                      <div style={{ fontWeight: '800', color: '#166534', fontSize: '13px', marginBottom: '4px' }}>
                        Jalur A: Publikasi Artikel Ilmiah
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#334155', lineHeight: '1.5' }}>
                        <li>Jurnal Nasional Terakreditasi <strong>SINTA 1 atau SINTA 2</strong></li>
                        <li>Jurnal Internasional Bereputasi <strong>Scopus (min. Q4)</strong> atau <strong>WoS</strong></li>
                        <li>Prosiding Internasional Bereputasi Scopus</li>
                        <li>Wajib Penulis Pertama dengan afiliasi FEB UTM</li>
                      </ul>
                    </div>

                    <div style={{ padding: '14px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #dcfce7' }}>
                      <div style={{ fontWeight: '800', color: '#166534', fontSize: '13px', marginBottom: '4px' }}>
                        Jalur B: Juara Kompetisi Bereputasi
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#334155', lineHeight: '1.5' }}>
                        <li><strong>Juara 1, 2, atau 3</strong> Ajang Puspresnas / Kemdikbudristek (KIBM, PKM, PIMNAS, Gemastik, dll.)</li>
                        <li><strong>Juara 1, 2, atau 3</strong> Kompetisi Mahasiswa Tingkat Internasional</li>
                        <li>Dilengkapi Surat Tugas Rektor/Dekan &amp; SK Pemenang</li>
                      </ul>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <Button
                      variant="gold"
                      size="lg"
                      icon={Sparkles}
                      onClick={() => setIsSkema1ModalOpen(true)}
                    >
                      Unggah Berkas Bukti &amp; Ajukan Skema 1
                    </Button>
                  </div>
                </div>

                {/* Perbandingan Skema 1 vs Skema 2 */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ padding: '10px 12px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Aspek Pembeda</th>
                        <th style={{ padding: '10px 12px', border: '1px solid #cbd5e1', textAlign: 'left', color: '#b45309' }}>Skema 1: Konversi Langsung (Halaman 13-15)</th>
                        <th style={{ padding: '10px 12px', border: '1px solid #cbd5e1', textAlign: 'left', color: '#1e3a8a' }}>Skema 2: Portofolio Kumulatif (Lampiran 2)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: '700' }}>Kriteria Capaian</td>
                        <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', backgroundColor: '#fffbeb' }}>1 Capaian Utama: SINTA 2 / Scopus / Juara Nasional</td>
                        <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Akumulasi beragam sertifikat hingga minimal 70 Poin</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: '700' }}>Pelaksanaan Tugas Akhir</td>
                        <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', backgroundColor: '#fffbeb', fontWeight: '700', color: '#16a34a' }}>Diseminasi Terbuka (Tanpa Ujian Lisan)</td>
                        <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Disidangkan offline oleh Tim Dosen Penilai</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: '700' }}>Kewajiban Publikasi Lain</td>
                        <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', backgroundColor: '#fffbeb', color: '#16a34a' }}>Tidak diwajibkan publikasi tambahan</td>
                        <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Wajib Jurnal SINTA 5 / SINTA 6</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: '700' }}>Penetapan Nilai Akhir</td>
                        <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', backgroundColor: '#fffbeb', fontWeight: '800', color: '#166534' }}>Otomatis Nilai A melalui SK Dekan</td>
                        <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Nilai A jika nilai riil sidang ≥ 80 Poin</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* TAB 2: DAFTAR PORTOFOLIO SKEMA 2 */}
      {activeTab === 'daftar' && (
        <div>
          {/* Callout ke Skema 1 jika mahasiswa punya karya SINTA 2 / Juara Nasional */}
          <div style={{ marginBottom: '16px', padding: '14px 18px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={22} color="#d97706" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#92400e', lineHeight: '1.4' }}>
                <strong>Punya Publikasi SINTA 2 / Scopus atau Juara Nasional?</strong> Anda tidak perlu mengumpulkan akumulasi 70–100 poin portofolio biasa. Anda berhak mengajukan <strong>Skema 1 (Konversi Langsung)</strong> untuk langsung memperoleh Nilai A via SK Dekan.
              </div>
            </div>
            <Button
              size="sm"
              variant="gold"
              onClick={() => setActiveTab('skema1')}
            >
              Buka Pengajuan Skema 1
            </Button>
          </div>

          {/* Controls: Search, Filter, Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Input
                  placeholder="Cari portofolio prestasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                />
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              </div>

              <div style={{ width: '220px' }}>
                <Select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  options={[
                    { value: 'Semua', label: 'Semua Kategori' },
                    { value: 'Prestasi Kompetisi Bisnis & Kewirausahaan', label: 'Kompetisi Bisnis' },
                    { value: 'Publikasi Artikel Jurnal Ilmiah', label: 'Publikasi Jurnal' },
                    { value: 'Hak Kekayaan Intelektual (HKI)', label: 'HKI / Paten / Cipta' },
                    { value: 'Unit Usaha / Wirausaha Mahasiswa', label: 'Wirausaha / Startup' },
                    { value: 'Sertifikasi Profesi', label: 'Sertifikasi Profesi' },
                    { value: 'Prosiding Konferensi', label: 'Prosiding Konferensi' }
                  ]}
                />
              </div>
            </div>

            <Button 
              variant="primary" 
              icon={Plus}
              onClick={() => setIsUploadModalOpen(true)}
            >
              Unggah Portofolio Baru
            </Button>
          </div>

          {/* List Portofolio Items */}
          {filteredItems.length === 0 ? (
            <Panel
              title="Daftar Dokumen Portofolio Mahasiswa"
              subtitle="Belum ada dokumen portofolio yang sesuai kriteria pencarian."
              icon={Award}
            >
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Award size={28} color="#94a3b8" />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px' }}>
                  {currentItems.length === 0 ? 'Belum Ada Portofolio yang Diunggah' : 'Portofolio Tidak Ditemukan'}
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto 16px', lineHeight: '1.5' }}>
                  {currentItems.length === 0 
                    ? 'Anda belum mengunggah berkas portofolio mandiri. Silakan unggah sertifikat juara kompetisi, artikel ilmiah, HKI, sertifikat profesi, atau bukti unit usaha wirausaha untuk mengumpulkan poin syarat skema TAKK.' 
                    : 'Tidak ada dokumen yang cocok dengan kata kunci atau filter kategori yang Anda pilih.'}
                </p>
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  Unggah Portofolio Sekarang
                </Button>
              </div>
            </Panel>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredItems.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    transition: 'border-color 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: item.poin >= 40 ? '#fef3c7' : '#e0f2fe',
                      color: item.poin >= 40 ? '#b45309' : '#0369a1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Award size={22} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#f1f5f9',
                          color: '#334155'
                        }}>
                          {item.kategori || 'Portofolio Mandiri'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>• Tingkat {item.tingkat || 'Nasional'}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>• {item.tahun || '2026'}</span>
                        <Badge variant={
                          item.status?.includes('Dinilai') || item.status?.includes('Sah')
                            ? 'green'
                            : item.status?.includes('Berkas Sah')
                            ? 'navy'
                            : item.status?.includes('Tolak')
                            ? 'error'
                            : 'amber'
                        }>
                          {item.status || 'Menunggu Verifikasi Berkas (Admin)'}
                        </Badge>
                      </div>

                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px', lineHeight: '1.4' }}>
                        {item.nama || item.judul}
                      </h3>

                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {item.capaian && (
                          <span>Capaian: <strong style={{ color: '#1e293b' }}>{item.capaian}</strong></span>
                        )}
                        {item.penyelenggara && (
                          <span>Penyelenggara: <strong style={{ color: '#1e293b' }}>{item.penyelenggara}</strong></span>
                        )}
                        <span>Berkas: <strong style={{ color: '#0369a1' }}>{item.berkas || 'Berkas_Bukti.pdf'}</strong></span>
                        {item.urlValidasi && (
                          <a 
                            href={item.urlValidasi} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}
                          >
                            <span>Tautan Verifikasi</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>

                      {/* Info Hasil Sidang Offline Dosen (Jika sudah dinilai oleh Koorprodi) */}
                      {item.poinRiil !== null && item.poinRiil !== undefined && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '11.5px',
                          color: '#166534',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldCheck size={13} color="#16a34a" />
                            <span>Hasil Sidang Dosen: Disahkan Koorprodi {item.poinRiil} Poin (dari Pagu {item.poinKlaim || item.poin} Poin)</span>
                          </div>
                          {item.beritaAcaraSidang && (
                            <div style={{ color: '#15803d' }}>
                              No. Berita Acara: <strong>{item.beritaAcaraSidang}</strong> {item.tanggalSidang && `(${item.tanggalSidang})`}
                            </div>
                          )}
                          {item.catatanSidang && (
                            <div style={{ color: '#4b5563', fontStyle: 'italic', marginTop: '2px' }}>
                              "{item.catatanSidang}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Poin */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      {item.poinRiil !== null && item.poinRiil !== undefined ? (
                        <>
                          <div style={{ fontSize: '18px', fontWeight: '900', color: '#15803d' }}>
                            +{item.poinRiil} Poin
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600' }}>
                            Nilai Riil Sidang
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            Klaim: {item.poinKlaim || item.poin} Poin
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: '18px', fontWeight: '900', color: '#b45309' }}>
                            +{item.poinKlaim || item.poin} Poin
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#b45309', fontWeight: '600' }}>
                            Klaim Mahasiswa
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            Menunggu Sidang
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={Download}
                        isLoading={downloadingId === item.id}
                        onClick={() => handleDownloadItemProof(item)}
                        title="Unduh Berkas Bukti Resmi"
                      >
                        Unduh Bukti
                      </Button>

                      {onDeletePortofolio && (
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={Trash2}
                          onClick={async () => {
                            const ok = await confirmDialog({
                              title: 'Hapus Portofolio',
                              message: `Hapus portofolio "${item.nama}"? Poin akan disesuaikan kembali.`,
                              confirmLabel: 'Ya, Hapus',
                              variant: 'danger'
                            });
                            if (ok) {
                              onDeletePortofolio(item.id);
                            }
                          }}
                          style={{ color: '#dc2626' }}
                          title="Hapus Dokumen Portofolio"
                        >
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MATRIKS BOBOT POIN PEDOMAN FEB UTM */}
      {activeTab === 'rubrik' && (
        <Panel
          title="Pedoman & Matriks Rubrik Penilaian Portofolio TAKK FEB UTM 2026"
          subtitle="Dasar hukum: Buku Pedoman Penulisan & Ujian Tugas Akhir FEB UTM Bab IV Halaman 13-15 dan Lampiran 2."
          icon={Award}
          actions={
            <Button variant="secondary" size="sm" icon={Download} onClick={handleDownloadRekap}>
              Cetak Dokumen Portofolio (PDF)
            </Button>
          }
        >
          <div style={{ marginBottom: '18px' }}>
            <Alert variant="info" title="Ketentuan Penilaian Portofolio (Skema 2 TAKK)">
              <div style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                1. <strong>Batas Kelayakan Minimal:</strong> Portofolio dinyatakan LAYAK sebagai pengganti Tugas Akhir apabila memperoleh Nilai Akhir paling rendah sebesar <strong>70 Poin</strong>.<br />
                2. <strong>Konversi Nilai A Langsung:</strong> Mahasiswa dengan akumulasi capaian <strong>≥ 80 Poin</strong> berhak memperoleh Nilai A langsung dan dibebaskan dari ujian sidang skripsi reguler.<br />
                3. <strong>Diseminasi Karya:</strong> Mahasiswa wajib melakukan diseminasi publik/pameran karya terapan yang dikoordinasikan oleh Koordinator Program Studi.
              </div>
            </Alert>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                  <th style={{ padding: '10px 12px', border: '1px solid #1e3a8a', width: '50px' }}>No</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #1e3a8a' }}>Kategori Portofolio Capaian</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #1e3a8a', width: '130px' }}>Tingkat</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #1e3a8a' }}>Capaian / Kedudukan</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #1e3a8a', width: '90px', textAlign: 'center' }}>Bobot Poin</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>1</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Kompetisi Inovasi Bisnis / Kewirausahaan (KIBM, PKM-K, Business Plan)</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}><Badge variant="navy">Nasional</Badge></td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Juara 1 / Medali Emas</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#b45309' }}>+45 Poin</td>
                </tr>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>2</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Kompetisi Inovasi Bisnis / Kewirausahaan (KIBM, PKM-K, Business Plan)</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}><Badge variant="navy">Nasional</Badge></td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Juara 2 / Juara 3</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#b45309' }}>+35-40 Poin</td>
                </tr>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>3</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Kompetisi Mahasiswa Internasional Bereputasi</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}><Badge variant="green">Internasional</Badge></td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Juara 1 / Top 3 / Gold Medal</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#b45309' }}>+50 Poin</td>
                </tr>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>4</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Artikel Ilmiah Jurnal Nasional Terakreditasi SINTA 1 atau SINTA 2</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}><Badge variant="navy">Nasional</Badge></td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Penulis Pertama (First Author)</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#b45309' }}>+45 Poin</td>
                </tr>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>5</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Artikel Ilmiah Jurnal Nasional Terakreditasi SINTA 3 atau SINTA 4</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}><Badge variant="navy">Nasional</Badge></td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Penulis Pertama / Korespondensi</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#b45309' }}>+35 Poin</td>
                </tr>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>6</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Artikel Ilmiah Jurnal Nasional Terakreditasi SINTA 5 atau SINTA 6</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}><Badge variant="navy">Nasional</Badge></td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Penulis Pertama / Korespondensi</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#b45309' }}>+25-30 Poin</td>
                </tr>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>7</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Hak Kekayaan Intelektual (Paten / Hak Cipta Karya Terapan Kemenkumham)</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}><Badge variant="navy">Nasional</Badge></td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Pencipta / Inventor Utama</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#b45309' }}>+35 Poin</td>
                </tr>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>8</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Unit Usaha / Startup Mahasiswa Aktif Berbadan Hukum / NIB</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}><Badge variant="navy">Nasional</Badge></td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Founder / Owner (Omzet terverifikasi)</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#b45309' }}>+35-40 Poin</td>
                </tr>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: '600' }}>9</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Sertifikasi Profesi Kompetensi Mandiri (BNSP / Lembaga Internasional)</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}><Badge variant="sky">Regional/Nas</Badge></td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0' }}>Certified Professional (Sesuai Bidang)</td>
                  <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#b45309' }}>+25 Poin</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* TAB 3: KETENTUAN PUBLIKASI ILMIAH PER JENJANG */}
      {activeTab === 'publikasi-info' && (
        <Panel
          title={`Regulasi Publikasi Ilmiah Program ${prodiInfo.namaProdi} (${prodiInfo.jenjang})`}
          subtitle="Standar kewajiban publikasi artikel ilmiah resmi civitas akademika FEB UTM."
          icon={BookMarked}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '16px 18px', backgroundColor: '#f8fafc', borderLeft: '4px solid #1e3a8a', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px' }}>
                Ketentuan Publikasi Program {student.jenjang}:
              </h4>
              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px', lineHeight: '1.5' }}>
                {student.jenjang === 'S3' 
                  ? 'Wajib memiliki artikel berstatus minimal Accepted (LoA) pada Jurnal Internasional Bereputasi (Scopus min. Q4 atau Web of Science) sebagai penulis pertama dengan afiliasi Universitas Trunojoyo Madura sebelum mendaftar Ujian Tertutup.' 
                  : student.jenjang === 'S2'
                  ? 'Wajib memiliki publikasi pada Jurnal Nasional Terakreditasi minimal SINTA 2 atau Jurnal Internasional Bereputasi sebelum pelaksanaan Yudisium kelulusan program magister.'
                  : isTAKK
                  ? 'Merupakan luaran wajib TAKK: Skema 2 (Portofolio) mensyaratkan Jurnal Nasional Terakreditasi (SINTA 5 untuk NA ≥ 70, SINTA 6 untuk NA ≥ 80), sedangkan Skema 1 (Konversi Langsung) mensyaratkan SINTA 2 / Scopus / Juara Nasional.'
                  : 'Berdasarkan BAB VIII Buku Pedoman 2026, publikasi artikel ilmiah pada jalur Skripsi Reguler (TAKT) bersifat opsional / anjuran diseminasi dengan insentif poin SKK.'}
              </p>

              {student.publikasi && student.publikasi.judulArtikel ? (
                <div style={{ padding: '12px 14px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700', marginBottom: '2px' }}>
                    Data Publikasi Terdaftar Pada Sistem:
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                    "{student.publikasi.judulArtikel}"
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Jurnal: <strong>{student.publikasi.jurnal}</strong> ({student.publikasi.indeks}) • Penulis: {student.publikasi.penulis}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                  Belum ada artikel publikasi ilmiah mandiri yang didaftarkan pada profil mahasiswa ini.
                </div>
              )}
            </div>

            {/* Tim Pemeriksa Integritas Khusus S3 / S2 */}
            {student.jenjang === 'S3' && (
              <div style={{ padding: '14px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ShieldCheck size={18} color="#16a34a" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>
                    Pemeriksaan Standar Mutu Publikasi Doktor (S3):
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#14532d', lineHeight: '1.5' }}>
                  Setiap artikel ilmiah wajib melewati verifikasi Linearitas Topik Disertasi, verifikasi status aktif Scopus (bukan jurnal discontinued), dan uji integritas Non-Predatory oleh Tim Validasi Pascasarjana FEB UTM.
                </div>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* 5. MODAL UNGGAH PORTOFOLIO BARU */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Formulir Pendaftaran & Unggah Portofolio Prestasi"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
              Batal
            </Button>
            <Button 
              variant="primary" 
              onClick={handleFormSubmit}
              isLoading={isSubmitting}
            >
              Simpan & Daftarkan Portofolio
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Alert variant="info" title="Prosedur Penilaian Portofolio Skema TAKK">
            <span style={{ fontSize: '12px', lineHeight: '1.4' }}>
              Pilihlah kategori, tingkat prestasi, dan peran yang sesuai dengan bukti dokumen resmi Anda. Nilai yang tertera merupakan <strong>estimasi poin klaim (pagu maksimal)</strong>. Nilai tidak otomatis penuh setelah berkas diverifikasi Admin. Portofolio akan disidangkan secara offline bersama Tim Dosen, dan nilai sesungguhnya akan diinput resmi oleh Koordinator Program Studi (Koorprodi). Mahasiswa dinyatakan layak mengambil skema TAKK jika akumulasi nilai riil <strong>&gt; 70 Poin</strong>.
            </span>
          </Alert>

          <FormField id="porto-nama" label="Nama / Judul Prestasi / Karya Portofolio" required helperText="Contoh: Juara 1 Kompetisi Inovasi Bisnis Mahasiswa (KIBM) Nasional Kemdikbud, Artikel SINTA 5, Sertifikat BNSP, dll.">
            <Input 
              placeholder="Masukkan judul prestasi atau nama karya..." 
              value={formData.nama}
              onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
              required
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <FormField id="porto-kategori" label="Kategori Portofolio" required>
              <Select
                value={formData.kategori}
                onChange={(e) => handleKategoriTingkatChange(e.target.value, formData.tingkat, formData.capaian)}
                options={[
                  { value: 'Prestasi Kompetisi Bisnis & Kewirausahaan', label: '1. Kompetisi Bisnis & Wirausaha' },
                  { value: 'Publikasi Artikel Jurnal Ilmiah', label: '2. Publikasi Jurnal Ilmiah' },
                  { value: 'Prosiding Seminar / Konferensi Ilmiah', label: '3. Prosiding Konferensi' },
                  { value: 'Hak Kekayaan Intelektual (HKI)', label: '4. HKI / Paten / Hak Cipta' },
                  { value: 'Unit Usaha / Wirausaha Mahasiswa', label: '5. Unit Usaha / Startup UMKM' },
                  { value: 'Sertifikasi Profesi & Kompetensi Mandiri', label: '6. Sertifikasi Profesi Mandiri' },
                  { value: 'Rekognisi Akademik / Penghargaan Lainnya', label: '7. Penghargaan Akademik Lainnya' }
                ]}
              />
            </FormField>

            <FormField id="porto-tingkat" label="Tingkat / Skala Wilayah" required>
              <Select
                value={formData.tingkat}
                onChange={(e) => handleKategoriTingkatChange(formData.kategori, e.target.value, formData.capaian)}
                options={[
                  { value: 'Internasional', label: 'Internasional' },
                  { value: 'Nasional', label: 'Nasional' },
                  { value: 'Regional / Provinsi', label: 'Regional / Wilayah / Provinsi' },
                  { value: 'Universitas / Lokal', label: 'Universitas / Lokal' }
                ]}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <FormField id="porto-capaian" label="Capaian / Peringkat / Peran" required>
              <Select
                value={formData.capaian}
                onChange={(e) => handleKategoriTingkatChange(formData.kategori, formData.tingkat, e.target.value)}
                options={[
                  { value: 'Juara 1 / Medali Emas', label: 'Juara 1 / Medali Emas' },
                  { value: 'Juara 2 / Medali Perak', label: 'Juara 2 / Medali Perak' },
                  { value: 'Juara 3 / Medali Perunggu', label: 'Juara 3 / Medali Perunggu' },
                  { value: 'Juara Harapan / Finalis Didanai', label: 'Juara Harapan / Finalis Didanai' },
                  { value: 'Penulis Pertama (First Author)', label: 'Penulis Pertama (First Author)' },
                  { value: 'Penulis Pendamping (Co-Author)', label: 'Penulis Pendamping (Co-Author)' },
                  { value: 'Pemegang Paten / Hak Cipta Utama', label: 'Pemegang Paten / Hak Cipta' },
                  { value: 'Founder / Pemilik Usaha Aktif', label: 'Founder / Owner Usaha' },
                  { value: 'Pemegang Sertifikat Kompetensi', label: 'Pemegang Sertifikat Profesi' }
                ]}
              />
            </FormField>

            <FormField id="porto-poin" label="Estimasi Poin Klaim (Pagu Maksimal)" required helperText="Klaim estimasi mandiri. Nilai akhir ditentukan melalui Sidang Dosen & diinput Koorprodi.">
              <Input
                type="number"
                min="5"
                max="50"
                value={formData.poin}
                onChange={(e) => setFormData(prev => ({ ...prev, poin: e.target.value }))}
                style={{ fontWeight: '800', color: '#b45309' }}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <FormField id="porto-penyelenggara" label="Lembaga Penyelenggara / Penerbit">
              <Input 
                placeholder="Contoh: Kemdikbudristek, UI, Kemenkumham, BNSP..." 
                value={formData.penyelenggara}
                onChange={(e) => setFormData(prev => ({ ...prev, penyelenggara: e.target.value }))}
              />
            </FormField>

            <FormField id="porto-tahun" label="Tahun Perolehan">
              <Input 
                placeholder="2026" 
                value={formData.tahun}
                onChange={(e) => setFormData(prev => ({ ...prev, tahun: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField id="porto-url" label="Tautan / URL Validasi (Opsional)" helperText="Tautan pengumuman lomba, laman DOI artikel, atau pangkalan data HKI.">
            <Input 
              placeholder="https://..." 
              value={formData.urlValidasi}
              onChange={(e) => setFormData(prev => ({ ...prev, urlValidasi: e.target.value }))}
            />
          </FormField>

          <FormField id="porto-file" label="Unggah Berkas Bukti Sah (PDF Sertifikat / LoA / NIB / Surat Keputusan)" required>
            <FileUpload 
              accept=".pdf,.jpg,.jpeg,.png" 
              maxSizeMB={15} 
              onFileSelect={(file) => {
                if (file) {
                  setFormData(prev => ({ ...prev, berkas: file.name }));
                }
              }}
            />
          </FormField>

          <FormField id="porto-catatan" label="Catatan Tambahan / Deskripsi Singkat">
            <Input 
              placeholder="Keterangan tambahan untuk tim verifikator Koorprodi..." 
              value={formData.catatan}
              onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
            />
          </FormField>
        </form>
      </Modal>

      {/* 6. MODAL PENGAJUAN SKEMA 1 (KONVERSI LANGSUNG — NILAI A) */}
      <Modal
        isOpen={isSkema1ModalOpen}
        onClose={() => setIsSkema1ModalOpen(false)}
        title="Formulir Pengajuan Skema 1: Konversi Langsung (Nilai A)"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSkema1ModalOpen(false)}>
              Batal
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSkema1Submit}
            >
              Kirim Pengajuan Konversi Langsung
            </Button>
          </>
        }
      >
        <form onSubmit={handleSkema1Submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Alert variant="warning" title="Ketentuan Resmi Halaman 13-15 Buku Pedoman FEB UTM">
            <span style={{ fontSize: '12px', lineHeight: '1.4' }}>
              Pengajuan ini khusus bagi mahasiswa yang memiliki <strong>Artikel SINTA 1–2 / Scopus / WoS (Penulis Pertama)</strong> atau <strong>Juara 1–3 Lomba Bereputasi Nasional Puspresnas / Internasional</strong>. Setelah diverifikasi oleh Koorprodi, Anda akan diterbitkan SK Dekan dan ditetapkan memperoleh <strong>Nilai A Langsung</strong>.
            </span>
          </Alert>

          <FormField id="sk1-jalur" label="Jalur Capaian Unggulan" required>
            <Select
              value={skema1Form.jalur}
              onChange={(e) => setSkema1Form(prev => ({ ...prev, jalur: e.target.value }))}
              options={[
                { value: 'Artikel Jurnal Nasional Terakreditasi SINTA 1 atau SINTA 2 (Penulis Pertama)', label: '1. Jurnal Nasional Akreditasi SINTA 1 / SINTA 2 (Penulis Pertama)' },
                { value: 'Artikel Jurnal Internasional Bereputasi Scopus Q1-Q4 / Web of Science (Penulis Pertama)', label: '2. Jurnal Internasional Scopus / WoS (Penulis Pertama)' },
                { value: 'Prosiding Internasional Bereputasi Scopus (Penulis Pertama)', label: '3. Prosiding Internasional Scopus (Penulis Pertama)' },
                { value: 'Prestasi Juara 1/2/3 Kompetisi Nasional Puspresnas Kemdikbudristek (KIBM/PKM/PIMNAS)', label: '4. Juara 1–3 Lomba Nasional Puspresnas (KIBM, PKM, dll.)' },
                { value: 'Prestasi Juara 1/2/3 Kompetisi Mahasiswa Internasional Bereputasi', label: '5. Juara 1–3 Kompetisi Mahasiswa Internasional' }
              ]}
            />
          </FormField>

          <FormField id="sk1-judul" label="Judul Artikel Ilmiah / Judul Karya Juara" required helperText="Tuliskan judul lengkap sesuai yang tertera pada naskah atau piagam lomba.">
            <Input 
              placeholder="Contoh: Model Determinan Digital Payment Adoption pada Klaster UMKM..." 
              value={skema1Form.judul}
              onChange={(e) => setSkema1Form(prev => ({ ...prev, judul: e.target.value }))}
              required
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <FormField id="sk1-penerbit" label="Nama Jurnal Penerbit / Lembaga Penyelenggara Lomba" required>
              <Input 
                placeholder="Contoh: Jurnal Manajemen Teori dan Terapan / Puspresnas Kemdikbud" 
                value={skema1Form.penerbit}
                onChange={(e) => setSkema1Form(prev => ({ ...prev, penerbit: e.target.value }))}
                required
              />
            </FormField>

            <FormField id="sk1-penulis" label="Susunan Penulis / Tim (Wajib Penulis Pertama)" required>
              <Input 
                value={skema1Form.penulis}
                onChange={(e) => setSkema1Form(prev => ({ ...prev, penulis: e.target.value }))}
                required
              />
            </FormField>
          </div>

          <FormField id="sk1-url" label="Tautan / URL Validasi (DOI Jurnal / Pengumuman Puspresnas)" helperText="Tautan DOI resmi jurnal atau pengumuman pemenang resmi Kemdikbudristek.">
            <Input 
              placeholder="https://doi.org/... atau https://puspresnas.kemdikbud.go.id/..." 
              value={skema1Form.url}
              onChange={(e) => setSkema1Form(prev => ({ ...prev, url: e.target.value }))}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <FormField id="sk1-berkas" label="Unggah Naskah Lengkap PDF / Laporan Karya" required>
              <FileUpload 
                accept=".pdf" 
                maxSizeMB={20} 
                onFileSelect={(file) => {
                  if (file) {
                    setSkema1Form(prev => ({ ...prev, berkas: file.name }));
                  }
                }}
              />
            </FormField>

            <FormField id="sk1-bukti" label="Unggah Bukti Sah (Letter of Acceptance / Sertifikat Juara / Surat Tugas)" required>
              <FileUpload 
                accept=".pdf,.jpg,.jpeg,.png" 
                maxSizeMB={15} 
                onFileSelect={(file) => {
                  if (file) {
                    setSkema1Form(prev => ({ ...prev, berkasBukti: file.name }));
                  }
                }}
              />
            </FormField>
          </div>

          <FormField id="sk1-catatan" label="Catatan Tambahan untuk Koorprodi & Tim TAKK">
            <Input 
              placeholder="Contoh: Mengajukan konversi langsung pembebasan sidang skripsi sesuai Pedoman FEB 2026..." 
              value={skema1Form.catatan}
              onChange={(e) => setSkema1Form(prev => ({ ...prev, catatan: e.target.value }))}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
