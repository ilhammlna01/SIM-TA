import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  QrCode,
  Calendar,
  Building2,
  Award,
  RefreshCw,
  FileText
} from 'lucide-react';
import { Modal, Button, Badge, Alert, FormField, Input } from '../ui';
import { documentApi, openProtectedFile } from '../../services/api';

/**
 * Modal Verifikasi Keaslian Dokumen & Sertifikat Digital FEB UTM
 * Memungkinkan sivitas akademika atau pihak eksternal memverifikasi keabsahan dokumen via QR Code
 */
export default function DocumentVerificationModal({
  isOpen,
  onClose,
  initialCode = ''
}) {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await documentApi.verify(code.trim());
      if (res && res.verified) {
        setResult(res.data);
      } else {
        setErrorMsg(res?.message || 'Kode verifikasi tidak ditemukan dalam basis data arsip resmi.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server verifikasi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Layanan Verifikasi Keabsahan Dokumen Digital FEB UTM"
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', width: '100%' }}>
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          <Button
            variant="primary"
            onClick={handleVerify}
            disabled={loading || !code.trim()}
            icon={loading ? RefreshCw : Search}
          >
            {loading ? 'Memverifikasi...' : 'Cek Keabsahan'}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Masukkan kode sertifikat atau pindai (scan) QR Code yang tertera pada lembar dokumen Berita Acara, Lembar Pengesahan, atau Kartu Kendali Bimbingan FEB UTM.
        </p>

        <form onSubmit={handleVerify}>
          <FormField label="Kode Verifikasi Dokumen Digital" required>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Input
                placeholder="Contoh: UTM-FEB-BA-2026-R9VR1622"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button type="submit" variant="primary" disabled={loading || !code.trim()}>
                Cari
              </Button>
            </div>
          </FormField>
        </form>

        {errorMsg && (
          <Alert type="error" title="Verifikasi Gagal">
            {errorMsg}
          </Alert>
        )}

        {result && (
          <div
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              border: '2px solid #10B981',
              backgroundColor: '#F0FDF4'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <CheckCircle size={22} color="#059669" />
              <div>
                <div style={{ fontWeight: 'var(--font-weight-bold)', color: '#065F46', fontSize: '14px' }}>
                  DOKUMEN RESMI TERVERIFIKASI SAH
                </div>
                <div style={{ fontSize: '11px', color: '#047857' }}>
                  Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: '12px', marginBottom: 'var(--space-3)' }}>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Jenis Dokumen:</span>
                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{result.jenisDokumen}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Nomor Registrasi:</span>
                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{result.nomorDokumen}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Nama Mahasiswa:</span>
                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{result.namaMahasiswa} ({result.nim})</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Program Studi:</span>
                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{result.prodi} ({result.jenjang})</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Tanggal Penerbitan:</span>
                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{result.tanggalTerbit}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Status Dokumen:</span>
                <div>
                  <Badge variant="success">Tersertifikasi Digital</Badge>
                </div>
              </div>
            </div>

            {result.fileUrl && (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  openProtectedFile(result.fileUrl);
                }}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <Button variant="primary" icon={ExternalLink} style={{ width: '100%' }}>
                  Unduh Salinan Asli Berkas PDF
                </Button>
              </a>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
