import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import {
  Modal,
  Button,
  FormField,
  Input,
  Alert
} from '../ui';
import { authApi } from '../../services/api';

/**
 * ChangePasswordModal
 * Dialog mandiri untuk mengganti kata sandi pengguna secara resmi.
 * Terintegrasi dengan endpoint /api/auth/change-password dan sinkronisasi lokal.
 */
export default function ChangePasswordModal({
  isOpen,
  onClose,
  currentUser,
  onPasswordChanged,
  forced = false
}) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  // Dalam mode wajib (kata sandi sementara), dialog tidak dapat ditutup
  // sebelum kata sandi diganti — mencegah pengguna melewati gerbang keamanan.
  const handleClose = () => {
    if (forced) return;
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Kata sandi baru harus minimal 8 karakter demi keamanan akun.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    if (oldPassword === newPassword) {
      setErrorMessage('Kata sandi baru tidak boleh sama dengan kata sandi lama.');
      return;
    }

    setLoading(true);
    try {
      if (currentUser?.id) {
        const res = await authApi.changePassword({
          userId: currentUser.id,
          oldPassword,
          newPassword
        });
        if (res && res.success === false) {
          throw new Error(res.message || 'Gagal mengubah kata sandi.');
        }
      }

      setSuccessMessage('Kata sandi Anda berhasil diperbarui! Silakan gunakan sandi baru untuk login selanjutnya.');
      if (onPasswordChanged) {
        onPasswordChanged(newPassword);
      }

      setTimeout(() => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMessage('');
        onClose();
      }, 1600);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal mengubah kata sandi. Pastikan kata sandi lama Anda benar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={forced ? 'Wajib Ganti Kata Sandi Sementara' : 'Pembaruan Kata Sandi Akun'}
      size="md"
    >
      <div style={{ padding: '4px 0' }}>
        {forced && (
          <div style={{ marginBottom: '14px' }}>
            <Alert variant="warning" title="Ganti Kata Sandi Diperlukan">
              Akun Anda menggunakan kata sandi sementara (hasil reset administrator).
              Demi keamanan, Anda <strong>wajib</strong> menetapkan kata sandi baru sebelum
              melanjutkan. Masukkan kata sandi sementara pada kolom "Kata Sandi Saat Ini".
            </Alert>
          </div>
        )}
        {/* Banner Identitas Pengguna */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            backgroundColor: 'var(--primitive-navy-50, #f0f4f8)',
            border: '1px solid var(--primitive-navy-200, #d9e2ec)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primitive-navy-950, #0B192C)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '13px'
            }}
          >
            {currentUser?.nama?.charAt(0) || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--primitive-navy-950, #0B192C)' }}>
              {currentUser?.nama || 'Pengguna SIM-TA'}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary, #627D98)' }}>
              {currentUser?.nomorInduk ? `NIM/NIP: ${currentUser.nomorInduk}` : ''} • Peran: {currentUser?.role?.toUpperCase()}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div style={{ marginBottom: '14px' }}>
            <Alert variant="danger" title="Gagal Memperbarui Kata Sandi">
              {errorMessage}
            </Alert>
          </div>
        )}

        {successMessage && (
          <div style={{ marginBottom: '14px' }}>
            <Alert variant="success" title="Berhasil">
              {successMessage}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Kata Sandi Lama */}
          <FormField label="Kata Sandi Saat Ini" required>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan kata sandi lama"
                required
                style={{ paddingRight: '40px', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#627D98',
                  cursor: 'pointer'
                }}
                title={showOld ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          {/* Kata Sandi Baru */}
          <FormField label="Kata Sandi Baru (Min. 6 Karakter)" required>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kombinasi huruf dan angka..."
                required
                style={{ paddingRight: '40px', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#627D98',
                  cursor: 'pointer'
                }}
                title={showNew ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          {/* Konfirmasi Kata Sandi Baru */}
          <FormField label="Ulangi Kata Sandi Baru" required>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru..."
                required
                style={{ paddingRight: '40px', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#627D98',
                  cursor: 'pointer'
                }}
                title={showConfirm ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          {/* Notice Kebijakan Keamanan */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: 'var(--radius-md)',
              fontSize: '11.5px',
              color: '#92400e',
              lineHeight: 1.4
            }}
          >
            <strong>Ketentuan Keamanan Sandi Kampus:</strong>
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              <li>Gunakan minimal 8 karakter, kombinasikan huruf dan angka.</li>
              <li>Jangan bagikan kata sandi akun Anda kepada pihak lain atau joki skripsi.</li>
              <li>Kata sandi sementara hasil reset wajib segera diganti.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--color-border-subtle, #e2e8f0)'
            }}
          >
            {!forced && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Batal
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              icon={KeyRound}
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? 'Menyimpan Sandi...' : 'Simpan Kata Sandi'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
