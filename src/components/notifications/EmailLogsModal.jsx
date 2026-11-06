import React, { useState, useEffect } from 'react';
import {
  Mail,
  Clock,
  CheckCircle,
  ExternalLink,
  Send,
  Eye,
  RefreshCw,
  AlertTriangle,
  Building2,
  Calendar,
  User
} from 'lucide-react';
import { Modal, Button, Badge, Alert, FormField, Input, Select } from '../ui';
import { notify } from '../feedback';
import { notificationApi } from '../../services/api';

/**
 * Modal Log Pengiriman Email & SLA Komunikasi - SIM TA FEB UTM
 * Menampilkan riwayat email resmi yang terkirim berdasarkan alur persetujuan PRD:
 * 1. Pendaftaran Ujian Baru (SLA 48 Jam)
 * 2. Persetujuan Naskah / ACC Promotor
 * 3. Catatan Revisi & Koreksi Penguji (SLA 14 Hari)
 * 4. Penerbitan SK Dekan FEB UTM
 */
export default function EmailLogsModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isSendFormOpen, setIsSendFormOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState(null);

  // Form State Pengiriman Email Uji Coba
  const [eventType, setEventType] = useState('PENDAFTARAN_UJIAN_BARU');
  const [recipientEmail, setRecipientEmail] = useState('subbag.akademik@feb.trunojoyo.ac.id');
  const [recipientName, setRecipientName] = useState('Subbag Akademik FEB UTM');
  const [mhsNama, setMhsNama] = useState('Ilham Maulana');
  const [nim, setNim] = useState('210211100142');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getEmailLogs();
      if (res && res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.warn('Gagal memuat log email:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendSuccessMsg(null);

    try {
      const res = await notificationApi.sendEmail(eventType, {
        recipientEmail,
        recipientName,
        mhsNama,
        nim,
        jenjang: 'S1',
        prodi: 'S-1 Manajemen',
        tahap: 'Sidang Skripsi'
      });

      if (res && res.success) {
        setSendSuccessMsg('Email formal berhasil dikirimkan via Nodemailer dan dicatat pada log SLA!');
        fetchLogs();
        setIsSendFormOpen(false);
      }
    } catch (err) {
      notify('Gagal mengirim email: ' + err.message, { variant: 'warning' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pusat Komunikasi Email & Pemantauan SLA Akademik"
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            Nodemailer Engine &bull; Terhubung ke Database SQLite Log
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={onClose}>
              Tutup
            </Button>
            <Button
              variant="primary"
              icon={Send}
              onClick={() => setIsSendFormOpen(!isSendFormOpen)}
            >
              {isSendFormOpen ? 'Batal Uji Coba' : 'Uji Kirim Email Baru'}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {sendSuccessMsg && (
          <Alert type="success" title="Pengiriman Sukses">
            {sendSuccessMsg}
          </Alert>
        )}

        {/* Form Uji Kirim Email */}
        {isSendFormOpen && (
          <form
            onSubmit={handleSendTestEmail}
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-default)',
              backgroundColor: 'var(--color-surface-panel-alt)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)'
            }}
          >
            <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '13px', color: 'var(--primitive-navy-950)' }}>
              Simulasi Pemicu Pengiriman Email SLA
            </div>

            <FormField label="Pilih Jenis Notifikasi / Skenario PRD" required>
              <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                <option value="PENDAFTARAN_UJIAN_BARU">1. Pendaftaran Ujian Baru (SLA 48 Jam Verifikasi Berkas)</option>
                <option value="PROMOTOR_SETUJU_NASKAH">2. Persetujuan Naskah / ACC Promotor (Notifikasi ke Mahasiswa)</option>
                <option value="CATATAN_REVISI_BARU">3. Catatan Revisi Ujian Sidang (SLA 14 Hari Kalender Penguji)</option>
                <option value="SK_UJIAN_TERBIT">4. Penerbitan Nomor SK Dekan FEB UTM</option>
              </Select>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <FormField label="Email Tujuan" required>
                <Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
              </FormField>
              <FormField label="Nama Penerima" required>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
              </FormField>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button type="submit" variant="primary" disabled={sending} icon={sending ? RefreshCw : Send}>
                {sending ? 'Mengirim...' : 'Kirim Email Sekarang'}
              </Button>
            </div>
          </form>
        )}

        {/* Modal Pratinjau Email HTML */}
        {selectedEmail && (
          <div
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              border: '2px solid var(--color-brand-primary)',
              backgroundColor: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '13px', color: 'var(--primitive-navy-950)' }}>
                Pratinjau Email: {selectedEmail.subject}
              </span>
              <Button variant="secondary" size="sm" onClick={() => setSelectedEmail(null)}>
                Tutup Pratinjau
              </Button>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
              Kepada: <strong>{selectedEmail.recipientName}</strong> &lt;{selectedEmail.recipientEmail}&gt; | Terkirim: {selectedEmail.sentAt}
            </div>

            {/* Pratinjau email dirender di iframe ber-sandbox (tanpa allow-scripts)
                sebagai pertahanan berlapis terhadap XSS tersimpan pada konten email. */}
            <iframe
              title={`Pratinjau email: ${selectedEmail.subject}`}
              sandbox=""
              srcDoc={selectedEmail.htmlContent}
              style={{
                width: '100%',
                minHeight: '380px',
                maxHeight: '380px',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        )}

        {/* Daftar Log Email */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: '13px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
              Riwayat Email Terkirim ({logs.length} Email)
            </span>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchLogs}>
              Refresh Log
            </Button>
          </div>

          {loading ? (
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Memuat riwayat pengiriman...</p>
          ) : logs.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Belum ada email yang terkirim.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    backgroundColor: 'var(--color-surface-panel)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Mail size={20} color="var(--color-brand-primary)" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: '12.5px', color: 'var(--primitive-navy-950)' }}>
                        {log.subject}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Penerima: <strong>{log.recipientName}</strong> &bull; {log.sentAt}
                      </div>
                      {log.slaDeadline && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: 'var(--primitive-amber-700)', fontWeight: 'bold', marginTop: '2px' }}>
                          <Clock size={12} aria-hidden="true" />
                          <span>Batas SLA: {log.slaDeadline}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <Badge variant="success">Terkirim</Badge>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                      onClick={() => setSelectedEmail(log)}
                    >
                      Buka Pesan
                    </Button>

                    {log.previewUrl && (
                      <a
                        href={log.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        <Button variant="secondary" size="sm" icon={ExternalLink}>
                          Web Inbox
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
