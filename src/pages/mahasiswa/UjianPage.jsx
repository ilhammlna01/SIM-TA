import React, { useState } from 'react';
import { PageHeader } from '../../components/shell';
import { 
  Panel, 
  Button, 
  StatusBadge, 
  Badge, 
  Table, 
  Alert, 
  Modal, 
  FormField, 
  Input, 
  Select, 
  FileUpload,
  StatCard
} from '../../components/ui';
import { notify } from '../../components/feedback';
import { PROGRAM_STUDI_INFO, KOMPOSISI_PENGUJI, RUBRIK_PENILAIAN, KONVERSI_NILAI_UTM, getIstilahTA } from '../../data/pedomanRules';
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  Award, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Clock3,
  CheckCircle,
  AlertCircle,
  FileCheck,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { downloadBeritaAcara, downloadJadwalUjian } from '../../utils/pdfDownloader';

/**
 * Halaman 7: Ujian & Sidang Tugas Akhir
 * Terintegrasi penuh dengan siklus hidup akademik (Tahap Aktif & Prasyarat Mahasiswa)
 */
export default function UjianPage({ 
  student, 
  onNavigate,
  onUpdateStudent
}) {
  const prodiInfo = PROGRAM_STUDI_INFO[student.jenjang] || PROGRAM_STUDI_INFO.S1;
  const istilahTA = getIstilahTA(student, prodiInfo);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Pendaftaran ujian tersimpan di state lokal atau objek student
  const [localPendaftaran, setLocalPendaftaran] = useState(student?.pendaftaranUjian || null);
  const [daftarForm, setDaftarForm] = useState({
    jenisUjian: student?.jenisTA === 'TAKK' ? 'diseminasi_takk' : student?.jenjang === 'D3' ? 'sidang_d3' : 'sempro',
    catatan: '',
    naskahName: student?.jenisTA === 'TAKK' ? `Portofolio_Lengkap_TAKK_${(student.nama || 'Mhs').replace(/\s+/g, '_')}.pdf` : `Draf_Naskah_${(student.nama || 'Mhs').replace(/\s+/g, '_')}.pdf`
  });

  // Penentuan jenis dan status ujian dinamis berdasarkan tahap aktual student
  const getUjianData = () => {
    const stageNum = parseInt(String(student?.tahapAktifId || 'tahap-1').replace('tahap-', ''), 10) || 1;
    const isTAKK = student?.jenisTA === 'TAKK';
    const hasJadwal = Boolean(student?.jadwalUjian);
    const pendaftaran = student?.pendaftaranUjian || localPendaftaran;

    // Label jenis ujian default sesuai jenjang & skema
    let defaultJenis = 'Seminar Proposal Skripsi';
    if (isTAKK) {
      defaultJenis = 'Diseminasi & Uji Kelayakan Portofolio TAKK';
    } else if (student.jenjang === 'D3') {
      defaultJenis = 'Sidang Tugas Akhir Diploma (D-III)';
    } else if (student.jenjang === 'S2') {
      defaultJenis = stageNum >= 5 ? 'Sidang Tesis Magister Manajemen' : 'Seminar Proposal Tesis';
    } else if (student.jenjang === 'S3') {
      defaultJenis = stageNum >= 4 ? 'Ujian Tertutup Disertasi' : stageNum >= 3 ? 'Ujian Kelayakan Disertasi (Desk Review)' : 'Ujian Kualifikasi Disertasi';
    } else if (student.jenjang === 'S1') {
      defaultJenis = stageNum >= 5 ? 'Ujian Sidang Skripsi' : 'Seminar Proposal Skripsi';
    }

    // 1. KASUS TAHAP AWAL: Mahasiswa baru memulai proses dan belum masuk tahap sidang/ujian
    // Untuk TAKK: Tahap 1 (Pengajuan & Unggah Portofolio), Tahap 2 (Bimbingan), Tahap 3 (Turnitin)
    // Untuk S1 TAKT: Tahap 1 (Penyusunan Proposal belum Sempro), Tahap 3-4 (Riset & Bimbingan sebelum Sidang)
    // Untuk D3: Tahap 1-2 (Penyusunan awal sebelum Sidang)
    // Untuk S2: Tahap 1 (sebelum Sempro), Tahap 3-4 (sebelum Semhas/Sidang)
    // Untuk S3: Tahap 1-2 (sebelum Desk Review/Ujian)
    const isEarlyStage = isTAKK 
      ? stageNum < 4 
      : student.jenjang === 'D3' 
        ? stageNum < 3 
        : student.jenjang === 'S2'
          ? (stageNum === 1 || stageNum === 3 || stageNum === 4)
          : student.jenjang === 'S3'
            ? stageNum < 3
            : (stageNum === 1 || stageNum === 3 || stageNum === 4);

    if (!pendaftaran && !hasJadwal && isEarlyStage) {
      return {
        jenis: defaultJenis,
        status: 'Belum Terdaftar',
        badgeVariant: 'warning',
        jadwal: 'Belum Dijadwalkan (Tahap Prasyarat Masih Berjalan)',
        ruang: 'Belum Dialokasikan',
        alokasi: prodiInfo.alokasiWaktuUjian || '90 Menit',
        naskahFile: 'Draf Naskah / Portofolio Belum Diajukan',
        penguji: [],
        hasil: null,
        isClean: true,
        isEarlyStage: true
      };
    }

    // 2. KASUS PENDAFTARAN SEDANG DIVERIFIKASI (Sudah mendaftar / Tahap Verifikasi Berkas)
    if (pendaftaran && !hasJadwal) {
      return {
        jenis: pendaftaran.jenis || defaultJenis,
        status: 'Menunggu Verifikasi Koorprodi',
        badgeVariant: 'amber',
        jadwal: 'Dalam Proses Penjadwalan oleh Koorprodi',
        ruang: 'Menunggu Alokasi Ruang Sidang',
        alokasi: prodiInfo.alokasiWaktuUjian || '90 Menit',
        naskahFile: pendaftaran.berkasNaskah || (isTAKK ? `Portofolio_Lengkap_TAKK_${(student.nama || 'Mhs').replace(/\s+/g, '_')}.pdf` : `Draf_Naskah_${(student.nama || 'Mhs').replace(/\s+/g, '_')}.pdf`),
        penguji: [],
        hasil: null,
        pendaftaranDate: pendaftaran.tanggalDaftar || 'Hari Ini',
        isPendingVerification: true
      };
    }

    // 3. KASUS UJIAN SELESAI & TELAH DINILAI (Hanya mahasiswa pasca-ujian)
    const isCompleted = isTAKK
      ? stageNum >= 6 || Boolean(student?.statusTahap?.includes('Nilai') && !student?.statusTahap?.includes('Menunggu'))
      : student.jenjang === 'S3'
        ? (stageNum === 3 && Boolean(student?.statusTahap?.includes('Layak')))
        : (stageNum >= 6 || Boolean(student?.statusTahap?.includes('Disetujui 100%')) || Boolean(student?.statusTahap?.includes('SK Kelulusan')));

    if (isCompleted) {
      if (isTAKK) {
        return {
          jenis: 'Diseminasi & Uji Kelayakan Portofolio TAKK',
          status: 'Terverifikasi Layak (Menunggu SK Dekan)',
          badgeVariant: 'navy',
          jadwal: student.jadwalUjian?.hariTanggal || 'Jumat, 18 Oktober 2026 (09.00 - 10.30 WIB)',
          ruang: student.jadwalUjian?.ruang || 'Ruang Rapat Koorprodi S-1 Manajemen',
          alokasi: '90 Menit (Verifikasi Bukti Portofolio & Luaran Jurnal)',
          naskahFile: `Portofolio_Lengkap_TAKK_${(student.nama || 'Mhs').replace(/\s+/g, '_')}.pdf`,
          penguji: [
            { peran: 'Dosen Pembimbing', nama: student.pembimbing[0]?.nama || 'Dr. Mochammad Isa Anshori, S.E., M.Si.', status: 'Disetujui' },
            { peran: 'Koordinator Program Studi', nama: 'Dr. Hj. Siti Aminah, S.E., M.Si.', status: 'Verifikasi Berkas Sah' }
          ],
          hasil: {
            nilaiAngka: student.portofolioData?.totalPoin && student.portofolioData.totalPoin >= 70 ? student.portofolioData.totalPoin : 82.00,
            huruf: 'A',
            keterangan: 'Memenuhi Ambang Batas Poin (>= 70) dan Luaran Jurnal SINTA Sesuai Pedoman Bab VI',
            rekomendasi: 'Diusulkan penerbitan Surat Keputusan (SK) Dekan untuk penetapan Nilai A Portofolio.'
          }
        };
      }

      if (student.jenjang === 'S3') {
        return {
          jenis: 'Ujian Kelayakan Disertasi (Desk Review)',
          status: 'Selesai (Layak Revisi Minor)',
          badgeVariant: 'navy',
          jadwal: '10-24 September 2026',
          ruang: 'Sekretariat Program Doktor FEB UTM',
          alokasi: 'Penelaahan Dokumen (Desk Review)',
          naskahFile: 'Disertasi_Lengkap_Rangkap_7.pdf',
          penguji: [
            { peran: 'Penilai I (Promotor)', nama: student.pembimbing[0]?.nama || 'Prof. Dr. Pribanus Wantara, Drs., M.M.', status: 'Nilai: 78 (Layak)' },
            { peran: 'Penilai II (Kopromotor)', nama: student.pembimbing[1]?.nama || 'Dr. Dra. Hj. Iriani Ismail, M.M.', status: 'Nilai: 75 (Layak)' },
            { peran: 'Penilai III', nama: 'Dr. Faidal, S.E., M.M.', status: 'Nilai: 74 (Layak)' }
          ],
          hasil: {
            nilaiAngka: 75.67,
            huruf: 'B+',
            keterangan: 'Dinyatakan Layak Revisi Minor (3 dari 3 Penguji Menyatakan Layak & Nilai Akhir >= 70)',
            rekomendasi: 'Diberikan waktu menyelesaikan revisi minor sebelum pengajuan pendaftaran Ujian Tertutup.'
          }
        };
      }

      // S1 TAKT Pasca Sidang
      return {
        jenis: 'Ujian Sidang Skripsi',
        status: 'Lulus (SK Diterbitkan)',
        badgeVariant: 'navy',
        jadwal: student.jadwalUjian?.hariTanggal || 'Kamis, 08 Oktober 2026 (09.00 - 10.30 WIB)',
        ruang: student.jadwalUjian?.ruang || 'Ruang Sidang Jurusan Manajemen FEB Lantai 2',
        alokasi: prodiInfo.alokasiWaktuUjian || '90 Menit',
        naskahFile: `Naskah_Final_Skripsi_${(student.nama || 'Mhs').replace(/\s+/g, '_')}.pdf`,
        penguji: [
          { peran: 'Ketua Penguji (Dosen Pembimbing)', nama: student.pembimbing[0]?.nama || 'Dra. Hj. S. Anugrahini Irawati, M.M.', status: 'Konfirmasi Hadir & Nilai Sah' },
          { peran: 'Penguji Utama', nama: 'Dr. Faidal, S.E., M.M.', status: 'Konfirmasi Hadir & Nilai Sah' },
          { peran: 'Anggota Penguji', nama: 'Aprilina Susandini, S.E., M.SM.', status: 'Konfirmasi Hadir & Nilai Sah' }
        ],
        hasil: {
          nilaiAngka: 85.50,
          huruf: 'A',
          keterangan: 'Dinyatakan Lulus Ujian Sidang Skripsi dengan Kualifikasi Sangat Memuaskan',
          rekomendasi: 'Revisi naskah telah disahkan dewan penguji 100%. Telah diterbitkan SK Dekan.'
        }
      };
    }

    // 4. KASUS UJIAN TERJADWAL: Menunggu pelaksanaan sidang
    if (isTAKK) {
      return {
        jenis: 'Diseminasi & Uji Kelayakan Portofolio TAKK',
        status: 'Terjadwal (Menunggu Pelaksanaan)',
        badgeVariant: 'green',
        jadwal: student.jadwalUjian?.hariTanggal || 'Jumat, 25 Oktober 2026 (09.00 - 10.30 WIB)',
        ruang: student.jadwalUjian?.ruang || 'Ruang Rapat Koorprodi S-1 Manajemen',
        alokasi: '90 Menit (Verifikasi Bukti Portofolio & Luaran Jurnal)',
        naskahFile: `Portofolio_Lengkap_TAKK_${(student.nama || 'Mhs').replace(/\s+/g, '_')}.pdf`,
        penguji: [
          { peran: 'Dosen Pembimbing', nama: student.pembimbing[0]?.nama || 'Dr. Mochammad Isa Anshori, S.E., M.Si.', status: 'Konfirmasi Hadir' },
          { peran: 'Koordinator Program Studi', nama: 'Dr. Hj. Siti Aminah, S.E., M.Si.', status: 'Konfirmasi Hadir' }
        ],
        hasil: null
      };
    }

    if (student.jenjang === 'D3') {
      return {
        jenis: 'Sidang Tugas Akhir Diploma (D-III)',
        status: student.jadwalUjian?.status || 'Menunggu Sidang',
        badgeVariant: 'green',
        jadwal: student.jadwalUjian?.hariTanggal || 'Kamis, 17 Oktober 2026 (10.00 - 11.30 WIB)',
        ruang: student.jadwalUjian?.ruang || 'Lab Komputer & Pemasaran FEB Lantai 1',
        alokasi: prodiInfo.alokasiWaktuUjian || '90 Menit',
        naskahFile: 'Laporan_Tugas_Akhir_D3_SitiNurHaliza.pdf',
        penguji: [
          { peran: 'Ketua Penguji (Pembimbing)', nama: student.pembimbing[0]?.nama || 'Moh. Faizal, S.E., M.M.', status: 'Konfirmasi Hadir' },
          { peran: 'Penguji Utama', nama: 'Aprilina Susandini, S.E., M.SM.', status: 'Konfirmasi Hadir' },
          { peran: 'Anggota Penguji', nama: 'Dr. Mochammad Isa Anshori, S.E., M.Si.', status: 'Konfirmasi Hadir' }
        ],
        hasil: null
      };
    }

    if (student.jenjang === 'S2') {
      return {
        jenis: 'Sidang Tesis Magister Manajemen',
        status: 'Terjadwal',
        badgeVariant: 'green',
        jadwal: student.jadwalUjian?.hariTanggal || 'Rabu, 16 Oktober 2026 (13.00 - 15.00 WIB)',
        ruang: student.jadwalUjian?.ruang || 'Ruang Ujian Pascasarjana Lantai 3',
        alokasi: prodiInfo.alokasiWaktuUjian,
        naskahFile: 'Draf_Lengkap_Tesis_Magister.pdf',
        penguji: [
          { peran: 'Pembimbing I', nama: student.pembimbing[0]?.nama, status: 'Konfirmasi Hadir' },
          { peran: 'Pembimbing II (Pemimpin Sidang)', nama: student.pembimbing[1]?.nama || 'Dr. Rita Mutiarni, S.E., M.M.', status: 'Konfirmasi Hadir' },
          { peran: 'Penguji Ahli I', nama: 'Dr. Faidal, S.E., M.M.', status: 'Konfirmasi Hadir' },
          { peran: 'Penguji Ahli II', nama: 'Dr. Mochammad Isa Anshori, S.E., M.Si.', status: 'Konfirmasi Hadir' }
        ],
        hasil: null
      };
    }

    // Default S1 TAKT Terjadwal
    return {
      jenis: stageNum >= 5 ? 'Ujian Sidang Skripsi' : 'Seminar Proposal Skripsi',
      status: student.jadwalUjian?.status || 'Terjadwal',
      badgeVariant: 'green',
      jadwal: student.jadwalUjian?.hariTanggal || 'Senin, 14 Oktober 2026 (09.00 - 10.30 WIB)',
      ruang: student.jadwalUjian?.ruang || 'Ruang Sidang Jurusan Manajemen FEB Lantai 2',
      alokasi: prodiInfo.alokasiWaktuUjian,
      naskahFile: stageNum >= 5 ? 'Draf_Lengkap_Skripsi_Final.pdf' : 'Proposal_Skripsi_Final_Sempro.pdf',
      penguji: [
        { peran: 'Ketua Penguji (Dosen Pembimbing)', nama: student.pembimbing[0]?.nama, status: 'Konfirmasi Hadir' },
        { peran: 'Penguji Utama', nama: 'Dr. Faidal, S.E., M.M.', status: 'Konfirmasi Hadir' },
        { peran: 'Anggota Penguji', nama: 'Aprilina Susandini, S.E., M.SM.', status: 'Konfirmasi Hadir' }
      ],
      hasil: null
    };
  };

  const ujianData = getUjianData();
  const isTAKK = student?.jenisTA === 'TAKK';
  const portofolioPoin = Number(student?.portofolioData?.totalPoin || 0);

  // Aksi kirim pendaftaran ujian
  const handleKirimPendaftaran = () => {
    let jenisNama = 'Seminar Proposal Tugas Akhir';
    if (daftarForm.jenisUjian === 'diseminasi_takk') jenisNama = 'Diseminasi & Uji Kelayakan Portofolio TAKK';
    else if (daftarForm.jenisUjian === 'sidang') jenisNama = 'Ujian Sidang Akhir Skripsi';
    else if (daftarForm.jenisUjian === 'semhas') jenisNama = 'Seminar Hasil Penelitian';
    else if (daftarForm.jenisUjian === 'sidang_d3') jenisNama = 'Sidang Tugas Akhir Diploma (D-III)';
    else if (daftarForm.jenisUjian === 'sidang_s2') jenisNama = 'Sidang Tesis Magister Manajemen';

    const pendaftaranData = {
      jenis: jenisNama,
      tanggalDaftar: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'Menunggu Verifikasi Koorprodi',
      berkasNaskah: daftarForm.naskahName,
      catatan: daftarForm.catatan
    };

    setLocalPendaftaran(pendaftaranData);

    if (onUpdateStudent) {
      onUpdateStudent({
        ...student,
        pendaftaranUjian: pendaftaranData
      });
    }

    notify(`Pendaftaran ${jenisNama} berhasil dikirimkan! Berkas sedang diverifikasi Koorprodi.`, { variant: 'success' });
    setIsRegisterModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Portal Mahasiswa' },
          { label: `Portal ${prodiInfo.jenjang}` },
          { label: 'Ujian & Sidang' }
        ]}
        title={`Ujian & Sidang ${istilahTA}`}
        description={`Penyelenggaraan ujian akademik resmi Jurusan Manajemen FEB UTM.`}
        statusBadge={
          ujianData.badgeVariant ? (
            <Badge variant={ujianData.badgeVariant}>{ujianData.status}</Badge>
          ) : (
            <StatusBadge status={ujianData.status} />
          )
        }
        primaryAction={
          ujianData.status === 'Belum Terdaftar' ? (
            <Button 
              variant="primary" 
              icon={GraduationCap}
              onClick={() => setIsRegisterModalOpen(true)}
            >
              Pendaftaran Ujian
            </Button>
          ) : ujianData.isPendingVerification ? (
            <Button 
              variant="secondary" 
              icon={Clock3}
              onClick={() => setIsRegisterModalOpen(true)}
            >
              Ubah Berkas Pendaftaran
            </Button>
          ) : (
            <Button 
              variant="primary" 
              icon={GraduationCap}
              onClick={() => setIsRegisterModalOpen(true)}
            >
              Pendaftaran Ujian
            </Button>
          )
        }
        secondaryAction={
          ujianData.hasil ? (
            <Button 
              variant="secondary" 
              icon={Download}
              onClick={() => downloadBeritaAcara(student, ujianData)}
            >
              Unduh Berita Acara (PDF)
            </Button>
          ) : (ujianData.jadwal && !ujianData.jadwal.includes('Belum') && !ujianData.jadwal.includes('Dalam Proses')) ? (
            <Button 
              variant="secondary" 
              icon={Download}
              onClick={() => downloadJadwalUjian(ujianData, student)}
            >
              Unduh Jadwal Resmi (PDF)
            </Button>
          ) : null
        }
      />

      {/* BANNER STATUS KELENGKAPAN TAHAP AWAL */}
      {ujianData.isEarlyStage && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            padding: '18px 22px', 
            backgroundColor: '#ffffff', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid #e2e8f0', 
            borderLeft: '5px solid #0284c7',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.05)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#e0f2fe', padding: '3px 9px', borderRadius: 'var(--radius-sm)' }}>
                    Tahap Berjalan: {student.tahapAktifNama || 'Tahap Awal'}
                  </span>
                  <Badge variant="warning">Ujian Belum Dimulai</Badge>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px' }}>
                  Proses Ujian Menunggu Penyelesaian Tahap Prasyarat
                </h3>
                <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.55', margin: 0, maxWidth: '780px' }}>
                  {isTAKK ? (
                    <>Anda saat ini berada pada tahap awal pengajuan jalur TAKK (<strong>{student.statusTahap}</strong>). Sesuai Buku Pedoman 2026 Bab VI, pendaftaran Sidang Diseminasi dan Uji Kelayakan Portofolio dibuka setelah pengunggahan berkas portofolio mencapai minimal <strong>70 Poin</strong> serta diverifikasi oleh Dosen Pembimbing.</>
                  ) : (
                    <>Anda saat ini berada pada tahap awal penyusunan (<strong>{student.statusTahap}</strong>). Jadwal ujian dan susunan Dewan Penguji akan diterbitkan secara resmi oleh Koordinator Program Studi setelah naskah dan log bimbingan disetujui.</>
                  )}
                </p>
              </div>

              <Button 
                variant="primary" 
                size="sm"
                icon={GraduationCap}
                onClick={() => setIsRegisterModalOpen(true)}
              >
                Ajukan Pendaftaran Ujian
              </Button>
            </div>

            {/* Checklist Indikator Kesiapan Ujian */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              {isTAKK ? (
                <>
                  <div style={{ padding: '12px 14px', backgroundColor: portofolioPoin >= 70 ? '#f0fdf4' : '#fffbeb', borderRadius: 'var(--radius-md)', border: `1px solid ${portofolioPoin >= 70 ? '#bbf7d0' : '#fde68a'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>1. Poin Portofolio</span>
                      <Badge variant={portofolioPoin >= 70 ? 'green' : 'amber'}>{portofolioPoin} / 70 Poin</Badge>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: '1.4' }}>
                      {portofolioPoin >= 70 ? 'Memenuhi batas minimal kelayakan sidang' : 'Belum mencapai syarat minimal 70 poin'}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <Button variant="ghost" size="sm" onClick={() => onNavigate('portofolio')} style={{ padding: '2px 0', fontSize: '11px', color: '#0284c7' }}>
                        Kelola Portofolio &rarr;
                      </Button>
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', backgroundColor: (student.bimbinganCount || 0) >= 4 ? '#f0fdf4' : '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>2. Bimbingan Laporan</span>
                      <Badge variant={(student.bimbinganCount || 0) >= 4 ? 'green' : 'navy'}>{student.bimbinganCount || 0} Sesi</Badge>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: '1.4' }}>
                      {(student.bimbinganCount || 0) >= 4 ? 'Konsultasi berkala telah terpenuhi' : 'Konsultasikan laporan bersama pembimbing'}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <Button variant="ghost" size="sm" onClick={() => onNavigate('bimbingan')} style={{ padding: '2px 0', fontSize: '11px', color: '#0284c7' }}>
                        Buka Log Bimbingan &rarr;
                      </Button>
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', backgroundColor: student.turnitin ? '#f0fdf4' : '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>3. Uji Bebas Plagiasi</span>
                      <Badge variant={student.turnitin ? 'green' : 'gray'}>{student.turnitin?.similarity !== undefined ? `${student.turnitin.similarity}%` : 'Belum Uji'}</Badge>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: '1.4' }}>
                      {student.turnitin ? student.turnitin.status : 'Lampirkan bukti Turnitin pada naskah'}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <Button variant="ghost" size="sm" onClick={() => onNavigate('naskah')} style={{ padding: '2px 0', fontSize: '11px', color: '#0284c7' }}>
                        Cek Berkas Naskah &rarr;
                      </Button>
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>4. Berkas Persyaratan</span>
                      <Badge variant="navy">Skema TAKK</Badge>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: '1.4' }}>
                      Syarat khusus skema terhubung otomatis
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <Button variant="ghost" size="sm" onClick={() => onNavigate('persyaratan')} style={{ padding: '2px 0', fontSize: '11px', color: '#0284c7' }}>
                        Lihat Persyaratan &rarr;
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>1. Naskah Tugas Akhir</span>
                      <Badge variant="navy">Draf Awal</Badge>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: '1.4' }}>
                      Penyusunan naskah laporan tugas akhir
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>2. Bimbingan Dosen</span>
                      <Badge variant="navy">{student.bimbinganCount || 0} Sesi</Badge>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: '1.4' }}>
                      Minimal sesi bimbingan terpenuhi
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>3. Turnitin</span>
                      <Badge variant="gray">{student.turnitin?.similarity !== undefined ? `${student.turnitin.similarity}%` : 'Belum Uji'}</Badge>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: '1.4' }}>
                      Uji bebas plagiasi naskah resmi
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BANNER STATUS PENDAFTARAN SEDANG DIVERIFIKASI */}
      {ujianData.isPendingVerification && (
        <div style={{ marginBottom: '20px' }}>
          <Alert variant="warning" title="Pendaftaran Ujian Sedang Dalam Proses Verifikasi">
            Berkas pendaftaran untuk <strong>{ujianData.jenis}</strong> telah berhasil dikirimkan pada tanggal <strong>{ujianData.pendaftaranDate}</strong>. Berkas saat ini sedang diverifikasi oleh Koordinator Program Studi untuk alokasi ruang sidang dan penerbitan susunan Dewan Penguji.
          </Alert>
        </div>
      )}

      {/* 1. Panel Jadwal & Rincian Ujian */}
      <Panel
        title={`Jadwal & Spesifikasi: ${ujianData.jenis}`}
        subtitle={
          ujianData.isEarlyStage 
            ? 'Menunggu pemenuhan prasyarat akademik dan pendaftaran ujian' 
            : ujianData.isPendingVerification 
              ? 'Menunggu penetapan resmi jadwal dari Koordinator Program Studi' 
              : 'Ditetapkan secara resmi oleh Koordinator Program Studi'
        }
        icon={Calendar}
        actions={
          ujianData.badgeVariant ? (
            <Badge variant={ujianData.badgeVariant}>{ujianData.status}</Badge>
          ) : (
            <StatusBadge status={ujianData.status} />
          )
        }
      >
        {/* Info Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <StatCard
            label="Hari & Tanggal"
            value={ujianData.jadwal}
            icon={Calendar}
            tone={ujianData.isEarlyStage ? 'gray' : 'navy'}
          />
          <StatCard
            label="Ruang / Lokasi"
            value={ujianData.ruang}
            icon={MapPin}
            tone={ujianData.isEarlyStage ? 'gray' : 'sky'}
          />
          <StatCard
            label="Alokasi Waktu"
            value={ujianData.alokasi}
            icon={Clock}
            tone="amber"
          />
          <StatCard
            label="Naskah Diujikan"
            value={ujianData.naskahFile}
            icon={FileText}
            tone={ujianData.isEarlyStage ? 'gray' : 'green'}
          />
        </div>

        {/* Judul Naskah */}
        <div style={{ padding: '16px 18px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '4px solid #1e3a8a', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
              Judul Naskah yang Dipertahankan
            </span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', lineHeight: '1.5' }}>
            "{student.judul}"
          </div>
        </div>
      </Panel>

      {/* 2. Panel Dewan Penguji & Pembimbing */}
      <Panel
        title="Susunan Dewan Penguji & Pembimbing"
        subtitle={
          ujianData.penguji.length > 0 
            ? `Komposisi resmi ${ujianData.penguji.length} orang penguji sesuai ketentuan Buku Pedoman 2026` 
            : 'Diterbitkan melalui SK Dekan setelah berkas pendaftaran ujian diverifikasi'
        }
        icon={Users}
      >
        {ujianData.penguji.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {ujianData.penguji.map((p, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderLeft: '4px solid #1e3a8a',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  transition: 'box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,58,138,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)', 
                    backgroundColor: '#eff6ff', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a' }}>
                      {idx + 1}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {p.peran}
                    </span>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                      {p.nama}
                    </div>
                  </div>
                </div>
                <Badge variant="navy">{p.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            padding: '28px 16px', textAlign: 'center', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
            backgroundColor: '#f8fafc', borderRadius: 'var(--radius-lg)', border: '1px dashed #cbd5e1' 
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} color="#1e3a8a" />
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
              Dewan Penguji Belum Ditetapkan
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '440px', lineHeight: '1.5' }}>
              Susunan Dewan Penguji belum ditetapkan oleh Koordinator Program Studi. Dewan penguji akan diterbitkan bersamaan dengan Surat Keputusan (SK) Dekan setelah pendaftaran ujian disetujui.
            </div>
            {student?.pembimbing?.[0]?.nama && (
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#1e3a8a', backgroundColor: '#eff6ff', padding: '6px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe' }}>
                Dosen Pembimbing Terdaftar: <strong>{student.pembimbing[0].nama}</strong>
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* 3. Panel Hasil Ujian & Nilai Akhir (HANYA DITAMPILKAN JIKA UJIAN SUDAH SELESAI DILAKSANAKAN) */}
      {ujianData.hasil ? (
        <Panel
          title="Hasil Penilaian & Kelulusan Ujian"
          subtitle="Penetapan nilai berdasarkan Berita Acara Dewan Penguji"
          icon={Award}
          actions={<StatusBadge status="Lulus" />}
        >
          <div className="grid-2col-responsive" style={{ gap: '20px', alignItems: 'center', marginBottom: '16px' }}>
            {/* Score Card */}
            <div style={{ 
              textAlign: 'center', padding: '24px', 
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', 
              border: '1.5px solid #bbf7d0', borderRadius: 'var(--radius-lg)' 
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nilai Akhir Ujian</div>
              <div style={{ fontSize: '42px', fontWeight: '800', color: '#15803d', margin: '8px 0', lineHeight: 1 }}>{ujianData.hasil.nilaiAngka}</div>
              <Badge variant="success">Huruf Mutu: {ujianData.hasil.huruf}</Badge>
            </div>

            {/* Keterangan */}
            <div style={{ padding: '18px 20px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', lineHeight: '1.4' }}>
                {ujianData.hasil.keterangan}
              </div>
              <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.55', margin: '0 0 14px' }}>
                {ujianData.hasil.rekomendasi}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button 
                  variant="primary" 
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => onNavigate('revisi')}
                >
                  Lihat Catatan Revisi Ujian
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  onClick={() => downloadBeritaAcara(student, ujianData)}
                >
                  Unduh Berita Acara (PDF)
                </Button>
              </div>
            </div>
          </div>
        </Panel>
      ) : ujianData.status === 'Belum Terdaftar' ? (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="info" title="Belum Terdaftar pada Jadwal Ujian">
            {isTAKK ? (
              <>Anda saat ini belum terdaftar pada jadwal sidang diseminasi TAKK. Silakan lengkapi berkas portofolio (minimal 70 poin) dan pemenuhan sesi bimbingan terlebih dahulu, lalu klik tombol <strong>Pendaftaran Ujian</strong> di atas untuk mengajukan verifikasi berkas.</>
            ) : (
              <>Anda saat ini belum terdaftar pada jadwal ujian atau sidang apa pun. Silakan lengkapi berkas persyaratan dan pemenuhan sesi bimbingan terlebih dahulu, lalu klik tombol <strong>Pendaftaran Ujian</strong> di atas untuk mengajukan jadwal.</>
            )}
          </Alert>
        </div>
      ) : ujianData.isPendingVerification ? (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="info" title="Pendaftaran Sedang Diverifikasi">
            Berkas pendaftaran ujian telah diterima oleh sistem pada <strong>{ujianData.pendaftaranDate}</strong>. Anda akan menerima notifikasi penetapan jadwal dan ruang sidang setelah Koordinator Program Studi menyetujui berkas.
          </Alert>
        </div>
      ) : (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="info" title="Pelaksanaan Ujian Masuk Terjadwal">
            Ujian dijadwalkan berlangsung pada <strong>{ujianData.jadwal}</strong> bertempat di <strong>{ujianData.ruang}</strong>. Draf naskah rangkap fisik telah diterima oleh masing-masing penguji.
          </Alert>
        </div>
      )}

      {/* Modal Pendaftaran Ujian */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Formulir Pendaftaran Ujian / Sidang"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsRegisterModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleKirimPendaftaran}>
              Kirim Berkas Pendaftaran
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {isTAKK && portofolioPoin < 70 && (
            <div style={{ padding: '12px 14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
              <strong>Perhatian Prasyarat Poin:</strong> Total capaian portofolio Anda saat ini tercatat <strong>{portofolioPoin} Poin</strong>. Berdasarkan Buku Pedoman 2026 Bab VI, batas minimal kelayakan sidang diseminasi adalah <strong>70 Poin</strong>. Anda tetap dapat mengirimkan draf pendaftaran, namun verifikasi Koorprodi mensyaratkan kelengkapan portofolio.
            </div>
          )}

          <FormField id="daftar-jenis" label="Pilih Jenis Ujian yang Didaftarkan" required>
            <Select
              value={daftarForm.jenisUjian}
              onChange={(e) => setDaftarForm(prev => ({ ...prev, jenisUjian: e.target.value }))}
              options={
                isTAKK ? [
                  { value: 'diseminasi_takk', label: 'Sidang Diseminasi & Portofolio TAKK (Bab VI Pedoman)' }
                ] : student.jenjang === 'D3' ? [
                  { value: 'sidang_d3', label: 'Sidang Tugas Akhir Diploma (D-III)' }
                ] : student.jenjang === 'S2' ? [
                  { value: 'sempro_s2', label: 'Seminar Proposal Tesis' },
                  { value: 'semhas_s2', label: 'Seminar Hasil Tesis' },
                  { value: 'sidang_s2', label: 'Sidang Ujian Tesis Magister' }
                ] : student.jenjang === 'S3' ? [
                  { value: 'kualifikasi_s3', label: 'Ujian Kualifikasi Disertasi' },
                  { value: 'proposal_s3', label: 'Ujian Proposal Disertasi' },
                  { value: 'kelayakan_s3', label: 'Ujian Kelayakan Disertasi (Desk Review)' },
                  { value: 'tertutup_s3', label: 'Ujian Tertutup Disertasi' },
                  { value: 'terbuka_s3', label: 'Ujian Terbuka Disertasi (Promosi Doktor)' }
                ] : [
                  { value: 'sempro', label: 'Seminar Proposal Skripsi' },
                  { value: 'semhas', label: 'Seminar Hasil Penelitian' },
                  { value: 'sidang', label: 'Ujian Sidang Akhir Skripsi' }
                ]
              }
            />
          </FormField>

          <FormField 
            id="daftar-naskah" 
            label={isTAKK ? 'Unggah Berkas Portofolio Lengkap (PDF)' : 'Unggah Berkas Naskah Lengkap (PDF)'} 
            required 
            helperText={isTAKK ? 'Laporan komprehensif portofolio karya mandiri & bukti sertifikat.' : 'Naskah final yang telah disetujui dosen pembimbing.'}
          >
            <FileUpload 
              accept=".pdf" 
              maxSizeMB={15} 
              onFileSelect={(file) => {
                if (file?.name) {
                  setDaftarForm(prev => ({ ...prev, naskahName: file.name }));
                }
              }}
            />
          </FormField>

          <FormField id="daftar-turnitin" label="Unggah Bukti Bebas Plagiasi Turnitin" required helperText="Surat Keterangan Turnitin resmi yang disahkan Koorprodi.">
            <FileUpload accept=".pdf" maxSizeMB={5} />
          </FormField>

          <FormField id="daftar-catatan" label="Catatan Tambahan untuk Koorprodi (Opsional)">
            <Input 
              placeholder="Misal: Sudah berkonsultasi dengan pembimbing dan melengkapi berkas pendukung." 
              value={daftarForm.catatan}
              onChange={(e) => setDaftarForm(prev => ({ ...prev, catatan: e.target.value }))}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
