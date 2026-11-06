import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  User,
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  Sparkles,
  LogIn,
  AlertCircle
} from 'lucide-react';

import {
  Button,
  FormField,
  Input,
  Alert,
  Badge
} from '../../components/ui';

import { ForgotPasswordModal } from '../../components/auth';
import { authApi, checkBackendOnline } from '../../services/api';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../../utils/storage';

/**
 * HALAMAN LOGIN INSTITUSIONAL RESMI: PORTAL SIM-TA FEB UNIVERSITAS TRUNOJOYO MADURA
 * 
 * Standar Web Production-Ready:
 * 1. Universal Smart Login: Pengguna cukup memasukkan NIM / NIP / Email institusi dan kata sandi.
 *    Sistem secara otomatis mendeteksi peran (Mahasiswa, Dosen, Penguji, Koorprodi, Admin Akademik, Super Admin).
 * 2. Backend SQLite sebagai satu-satunya sumber kebenaran autentikasi (scrypt hash & JWT).
 *    Tidak ada jalur fallback kredensial di sisi klien.
 * 3. Quick Demo Switcher: Bilah akses cepat pengujian bagi asesor & penguji untuk mencoba peran resmi.
 */
export default function LoginPage({
  onLogin,
  initialRole = 'penguji'
}) {
  const remembered = loadFromStorage(STORAGE_KEYS.AUTH_REMEMBER, null);

  const [identifier, setIdentifier] = useState(remembered?.identifier || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  // Status koneksi backend nyata (bukan indikator statis).
  // null = sedang diperiksa, true = terhubung, false = tidak terhubung.
  const [isServerOnline, setIsServerOnline] = useState(null);

  // Preset Pengujian Cepat Institusional (hanya dibangun pada mode pengembangan)
  const demoPresets = useMemo(() => {
    if (!import.meta.env.DEV) return [];
    return [
    {
      id: 'demo-mhs-takt',
      role: 'mahasiswa',
      nomorInduk: '210211100142',
      label: 'Dinda Ayu (S1 • TAKT)',
      sub: 'Mahasiswa S1 Skripsi Reguler'
    },
    {
      id: 'demo-mhs-takk',
      role: 'mahasiswa',
      nomorInduk: '210211100219',
      label: 'Moh. Fikri Haikal (S1 • TAKK)',
      sub: 'Mahasiswa S1 Portofolio Bisnis'
    },
    {
      id: 'demo-mhs-s2',
      role: 'mahasiswa',
      nomorInduk: '230221600018',
      label: 'Rahmat H. (S2 • Tesis)',
      sub: 'Mahasiswa Magister S2'
    },
    {
      id: 'demo-mhs-d3',
      role: 'mahasiswa',
      nomorInduk: '230201100055',
      label: 'Siti Nur (D3 • Laporan TA)',
      sub: 'Mahasiswa Diploma D3'
    },
    {
      id: 'demo-mhs-s3',
      role: 'mahasiswa',
      nomorInduk: '220231600004',
      label: 'Bambang S. (S3 • Disertasi)',
      sub: 'Mahasiswa Program Doktor S3'
    },
    {
      id: 'demo-dosen',
      role: 'dosen',
      nomorInduk: '196201081987032001',
      label: 'Dr. Dra. Hj. Iriani Ismail',
      sub: 'Dosen Pembimbing / Promotor'
    },
    {
      id: 'demo-dosen-alan',
      role: 'dosen',
      nomorInduk: '22',
      label: 'Alan (Dosen • Multi-Peran)',
      sub: 'Dosen Baru (Eligible Multi-Peran)'
    },
    {
      id: 'demo-penguji',
      role: 'penguji',
      nomorInduk: '197703032003121002',
      label: 'Dr. Faidal, S.E., M.M.',
      sub: 'Dewan Penguji Sidang'
    },
    {
      id: 'demo-koorprodi',
      role: 'koorprodi',
      nomorInduk: '197802142003122001',
      label: 'Dr. Hj. Siti Aminah',
      sub: 'Koorprodi S-1 Manajemen'
    },
    {
      id: 'demo-admin',
      role: 'admin',
      nomorInduk: '198104122008121002',
      label: 'Ahmad Fauzi, S.Kom.',
      sub: 'Admin Akademik & TU'
    },
    {
      id: 'demo-superadmin',
      role: 'superadmin',
      nomorInduk: '197405102000031001',
      label: 'Ir. Supriyanto, M.Kom.',
      sub: 'Super Administrator'
    }
    ];
  }, []);

  // Periksa konektivitas backend secara nyata untuk indikator status server.
  useEffect(() => {
    let cancelled = false;
    checkBackendOnline()
      .then((online) => { if (!cancelled) setIsServerOnline(Boolean(online)); })
      .catch(() => { if (!cancelled) setIsServerOnline(false); });
    return () => { cancelled = true; };
  }, []);

  const getRoleLabelDisplay = (role, jenjang) => {
    switch (role) {
      case 'mahasiswa': return `Mahasiswa (${jenjang || 'S1'})`;
      case 'dosen': return 'Dosen Pembimbing / Promotor';
      case 'penguji': return 'Dewan Penguji Sidang';
      case 'koorprodi': return 'Koordinator Program Studi (Koorprodi)';
      case 'admin': return 'Admin Akademik';
      case 'superadmin': return 'Super Administrator';
      default: return 'Pengguna Terdaftar';
    }
  };

  const handleApplyPreset = (preset) => {
    setIdentifier(preset.nomorInduk);
    // Kata sandi akun demo TIDAK pernah tertanam di kode sumber. Nilai diambil
    // dari variabel lingkungan build-time (VITE_DEMO_PASSWORD) yang hanya
    // tersedia di lingkungan pengembangan/verifikasi lokal.
    setPassword(import.meta.env.VITE_DEMO_PASSWORD || '');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const cleanIdentifier = (identifier || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanIdentifier) {
      setErrorMessage('Nomor Induk (NIM / NIP) atau email institusi wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Kata sandi akun wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    try {
      let authResult = null;

      // 1. Autentikasi ke Backend SQLite (satu-satunya sumber kebenaran kredensial)
      let backendFailed = false;
      let backendErrorMsg = '';
      try {
        const res = await authApi.login({
          identifier: cleanIdentifier,
          password: cleanPassword
        });
        if (res && res.success && res.user) {
          authResult = res.user;
        }
      } catch (backendError) {
        backendFailed = true;
        backendErrorMsg = backendError.message || '';
      }

      // Backend adalah SATU-SATUNYA sumber kebenaran autentikasi.
      // Tidak ada jalur fallback lokal: bila backend gagal/tolak, login gagal.
      if (!authResult) {
        if (backendFailed && backendErrorMsg) {
          throw new Error(backendErrorMsg);
        }
        throw new Error('Kredensial tidak valid. Periksa NIM/NIP/email dan kata sandi Anda.');
      }

      // 3. Simpan preferensi "Ingat Saya"
      if (rememberMe) {
        saveToStorage(STORAGE_KEYS.AUTH_REMEMBER, {
          identifier: cleanIdentifier,
          role: authResult.role
        });
      }

      const greetingRole = getRoleLabelDisplay(authResult.role, authResult.jenjang);
      setSuccessMessage(`Autentikasi berhasil. Mengarahkan ke Portal ${greetingRole}: ${authResult.nama}...`);

      setTimeout(() => {
        try {
          if (onLogin) {
            onLogin(authResult);
          }
        } finally {
          setIsSubmitting(false);
        }
      }, 600);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal melakukan verifikasi kredensial.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: 'var(--primitive-navy-950)',
        color: 'var(--primitive-neutral-100)',
        fontFamily: 'var(--font-family-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)'
      }}
    >
      {/* Top Banner Institusional Resmi */}
      <header
        style={{
          height: '60px',
          backgroundColor: 'var(--primitive-navy-900)',
          borderBottom: '2px solid var(--color-brand-accent)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '13px',
              color: 'var(--color-text-inverse)'
            }}
          >
            UTM
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.2px', color: 'var(--primitive-neutral-50)' }}>
              UNIVERSITAS TRUNOJOYO MADURA
            </div>
            <div style={{ fontSize: '11px', color: 'var(--primitive-neutral-400)' }}>
              Fakultas Ekonomi dan Bisnis • Portal SIM-TA
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor:
                isServerOnline === true
                  ? 'rgba(34, 197, 94, 0.15)'
                  : isServerOnline === false
                  ? 'rgba(220, 38, 38, 0.15)'
                  : 'rgba(148, 163, 184, 0.15)',
              border: `1px solid ${
                isServerOnline === true
                  ? 'var(--primitive-green-700)'
                  : isServerOnline === false
                  ? 'var(--primitive-red-700)'
                  : 'var(--primitive-neutral-500)'
              }`,
              fontSize: '11px',
              color:
                isServerOnline === true
                  ? 'var(--primitive-green-400)'
                  : isServerOnline === false
                  ? 'var(--primitive-red-200)'
                  : 'var(--primitive-neutral-300)',
              fontWeight: '500'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor:
                  isServerOnline === true
                    ? 'var(--primitive-green-500)'
                    : isServerOnline === false
                    ? 'var(--primitive-red-600)'
                    : 'var(--primitive-neutral-400)'
              }}
            />
            {isServerOnline === true
              ? 'T.A. 2026/2027 Ganjil • Server Aktif'
              : isServerOnline === false
              ? 'T.A. 2026/2027 Ganjil • Server Tidak Terhubung'
              : 'T.A. 2026/2027 Ganjil • Memeriksa Server…'}
          </span>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '28px 16px',
          position: 'relative'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: 'var(--color-surface-panel)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-default)',
            boxShadow: 'var(--shadow-panel)',
            overflow: 'hidden',
            color: 'var(--color-text-primary)',
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* Header Card Formal */}
          <div
            style={{
              padding: '22px 28px 18px',
              backgroundColor: 'var(--primitive-navy-900)',
              color: 'var(--color-text-inverse)',
              textAlign: 'center',
              borderBottom: '2px solid var(--color-brand-accent)',
              position: 'relative'
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'rgba(184, 134, 11, 0.15)',
                border: '1.5px solid var(--color-brand-accent)',
                color: 'var(--color-brand-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px'
              }}
            >
              <GraduationCap size={24} />
            </div>

            <h1
              style={{
                fontSize: '18px',
                fontWeight: '700',
                margin: '0 0 4px 0',
                color: 'var(--color-text-inverse)',
                letterSpacing: '0.2px'
              }}
            >
              Masuk ke Akun SIM-TA
            </h1>

            <p style={{ fontSize: '12px', color: 'var(--primitive-neutral-400)', margin: 0, lineHeight: 1.4 }}>
              Sistem Informasi Manajemen Tugas Akhir, Tesis & Disertasi FEB UTM
            </p>
          </div>

          {/* Form Body */}
          <div style={{ padding: '24px 28px' }}>

            {/* Error & Success Feedback Alerts */}
            {errorMessage && (
              <div style={{ marginBottom: '16px' }}>
                <Alert variant="danger" title="Autentikasi Gagal">
                  {errorMessage}
                </Alert>
              </div>
            )}

            {successMessage && (
              <div style={{ marginBottom: '16px' }}>
                <Alert variant="success" title="Berhasil">
                  {successMessage}
                </Alert>
              </div>
            )}

            {/* Universal Login Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormField 
                id="login-identifier" 
                controlId="login-identifier"
                label="Nomor Induk (NIM / NIP) atau Email Institusi" 
                required
                helperText="Mahasiswa: gunakan NIM • Dosen / Tenaga Kependidikan: gunakan NIP"
              >
                <div style={{ position: 'relative' }}>
                  <Input
                    id="login-identifier"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Contoh: 210211100142 atau ahmad.fauzi@trunojoyo.ac.id"
                    required
                    style={{ width: '100%', fontSize: '13px' }}
                    autoComplete="username"
                  />
                </div>
              </FormField>

              <FormField 
                id="login-password" 
                controlId="login-password"
                label="Kata Sandi (Password Akun)" 
                required
                helperText={
                  import.meta.env.DEV && import.meta.env.VITE_DEMO_PASSWORD
                    ? 'Mode pengembangan: gunakan akses cepat akun demo di bawah halaman.'
                    : 'Masukkan kata sandi akun Anda. Hubungi Subbag Akademik bila lupa.'
                }
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Masukkan kata sandi..."
                    required
                    style={{ width: '100%', paddingRight: '40px', fontSize: '13px' }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FormField>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)'
                }}
              >
                <label htmlFor="login-remember-me" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    id="login-remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Ingat sesi saya di perangkat ini</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-link)',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Lupa kata sandi?
                </button>
              </div>

              <Button
                variant="primary"
                type="submit"
                icon={LogIn}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontWeight: '600',
                  fontSize: '14px',
                  marginTop: '4px'
                }}
              >
                {isSubmitting ? 'Memverifikasi Kredensial...' : 'Masuk ke Portal SIM-TA'}
              </Button>
            </form>

            {/* Quick Demo Switcher Toolbar — HANYA tersedia di mode pengembangan.
                Pada produksi, jalur ini tidak dirender agar tidak membocorkan
                akun demo maupun kata sandi default ke pengguna nyata. */}
            {import.meta.env.DEV && (
              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '18px',
                  borderTop: '1px solid var(--color-border-subtle)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Akses Cepat Pengujian / Akun Demo:
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--color-brand-primary)' }}>
                    1-Klik Masuk
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {demoPresets.map((p) => {
                    const isSelected = identifier === p.nomorInduk;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className="login-demo-preset"
                        onClick={() => handleApplyPreset(p)}
                        style={{
                          padding: '6px 8px',
                          fontSize: '11px',
                          borderRadius: 'var(--radius-xs)',
                          border: isSelected ? '1px solid var(--color-brand-primary)' : '1px solid var(--color-border-default)',
                          backgroundColor: isSelected ? 'var(--primitive-navy-50)' : 'var(--color-surface-panel-alt)',
                          color: isSelected ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={`${p.label} (${p.sub})`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Card */}
          <div
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--primitive-neutral-50)',
              borderTop: '1px solid var(--color-border-subtle)',
              textAlign: 'center',
              fontSize: '11px',
              color: 'var(--color-text-muted)'
            }}
          >
            Kendala teknis akun? Hubungi Subbag Akademik & Kemahasiswaan FEB UTM Gedung RKB Lt. 1
          </div>
        </div>
      </main>

      {/* Footer Halaman Institusional */}
      <footer
        style={{
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '11.5px',
          color: 'var(--primitive-neutral-400)',
          borderTop: '1px solid var(--primitive-navy-800)',
          backgroundColor: 'var(--primitive-navy-950)'
        }}
      >
        <div>
          © 2026 Jurusan Manajemen Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura.
        </div>
        <div style={{ marginTop: '4px', fontSize: '10.5px', color: 'var(--primitive-neutral-400)' }}>
          Jl. Raya Telang, PO. BOX 2 Kamal, Bangkalan, Madura 69162 • Layanan Pangkalan Data Akademik Terpadu
        </div>
      </footer>

      {/* Modal Lupa Kata Sandi */}
      {isForgotModalOpen && (
        <ForgotPasswordModal
          isOpen={isForgotModalOpen}
          onClose={() => setIsForgotModalOpen(false)}
        />
      )}
    </div>
  );
}
