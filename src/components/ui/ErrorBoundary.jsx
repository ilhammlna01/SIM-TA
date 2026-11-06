import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Home, Terminal, ShieldAlert } from 'lucide-react';
import { resetAllStorage, removeFromStorage, STORAGE_KEYS } from '../../utils/storage';

/**
 * ErrorBoundary - Komponen Penangkar Kesalahan Global FEB UTM
 * Mencegah aplikasi mengalami layar putih (blank screen) jika terjadi exception runtime.
 * Memberikan antarmuka pemulihan formal dengan tombol reset cache & muat ulang.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[SIM-TA FEB UTM ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    try {
      resetAllStorage();
    } catch (e) {
      console.warn('Gagal reset storage otomatis:', e);
    }
    // Arahkan ke root bersih
    window.location.href = '/';
  };

  handleBackToLogin = () => {
    try {
      removeFromStorage(STORAGE_KEYS.AUTH_SESSION);
      removeFromStorage(STORAGE_KEYS.CURRENT_ROLE);
      removeFromStorage(STORAGE_KEYS.ACTIVE_NAV);
    } catch (e) {
      console.warn('Gagal hapus sesi login:', e);
    }
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Kesalahan runtime tidak terduga pada komponen aplikasi.';
      const errorStack = this.state.error?.stack || '';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            backgroundColor: '#071324',
            backgroundImage: 'radial-gradient(ellipse at top, #0f2744 0%, #071324 70%)',
            color: '#f8fafc',
            fontFamily: 'var(--font-family-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Header Institusional */}
          <header
            style={{
              height: '60px',
              backgroundColor: 'rgba(7, 19, 36, 0.9)',
              backdropFilter: 'blur(10px)',
              borderBottom: '2px solid #D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src="/logo-utm.png"
                alt="Logo UTM"
                style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
                  SIM-TA FEB UTM
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.1 }}>
                  Fakultas Ekonomi dan Bisnis — Universitas Trunojoyo Madura
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  fontSize: '11.5px',
                  fontWeight: '600'
                }}
              >
                <ShieldAlert size={14} />
                Recovery Mode
              </span>
            </div>
          </header>

          {/* Konten Utama Pemulihan */}
          <main
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '620px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                color: '#1e293b'
              }}
            >
              {/* Header Card Pemulihan */}
              <div
                style={{
                  padding: '24px 28px',
                  backgroundColor: '#0B192C',
                  color: '#ffffff',
                  borderBottom: 'var(--border-width-medium) solid #D97706',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1.5px solid #ef4444',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}
                >
                  <AlertTriangle size={30} />
                </div>
                <h1 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px', color: '#ffffff' }}>
                  Terjadi Kendala Memuat Halaman
                </h1>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Sistem Informasi Manajemen Tugas Akhir mendeteksi gangguan sesi browser.
                </p>
              </div>

              {/* Body Card */}
              <div style={{ padding: '24px 28px' }}>
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b', marginBottom: '4px' }}>
                    Penyebab Potensial:
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f1d1d', lineHeight: 1.5 }}>
                    Data cache/sesi peramban sebelumnya (LocalStorage) mungkin belum sinkron dengan pembaruan kode aplikasi terbaru. Data utama di database server aman.
                  </div>
                </div>

                {/* Tombol Tindakan Pemulihan */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={this.handleResetStorage}
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      backgroundColor: '#D97706',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <RotateCcw size={16} />
                    Bersihkan Cache & Reset Sesi Browser (Sangat Direkomendasikan)
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={this.handleReload}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#f1f5f9',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw size={15} />
                      Muat Ulang (F5)
                    </button>

                    <button
                      type="button"
                      onClick={this.handleBackToLogin}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#0B192C',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Home size={15} />
                      Halaman Login
                    </button>
                  </div>
                </div>

                {/* Collapsible Error Trace */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={this.toggleDetails}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: 0
                    }}
                  >
                    <Terminal size={14} />
                    {this.state.showDetails ? 'Sembunyikan Rincian Teknis' : 'Tampilkan Rincian Teknis Error (Untuk Developer)'}
                  </button>

                  {this.state.showDetails && (
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '12px',
                        backgroundColor: '#0f172a',
                        borderRadius: 'var(--radius-md)',
                        color: '#f8fafc',
                        fontSize: '11px',
                        fontFamily: 'Consolas, Monaco, monospace',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        lineHeight: 1.4
                      }}
                    >
                      <div style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '6px' }}>
                        {errorMessage}
                      </div>
                      {errorStack && (
                        <div style={{ color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {errorStack}
                        </div>
                      )}
                      {componentStack && (
                        <div style={{ color: '#64748b', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                          {componentStack}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Footer Institusional */}
          <footer
            style={{
              padding: '16px 24px',
              textAlign: 'center',
              fontSize: '11.5px',
              color: 'rgba(255, 255, 255, 0.6)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            © 2026 Jurusan Manajemen — Fakultas Ekonomi dan Bisnis, Universitas Trunojoyo Madura.
          </footer>
        </div>
      );
    }

    return this.props.children;
  }
}
