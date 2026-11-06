import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  Mail,
  Check
} from 'lucide-react';
import { notificationApi } from '../../services/api';
import { formatWaktu } from '../../utils/format';
import { notify } from '../feedback';
import EmailLogsModal from './EmailLogsModal';

/**
 * Institutional Real-Time Notification Bell - SIM TA FEB UTM
 * - Koneksi stream real-time Server-Sent Events (SSE)
 * - Tampilan dropdown notifikasi terstruktur dengan filter tab & badge
 * - Integrasi log email SLA dan simulator pemicu notifikasi live
 */
export default function NotificationBell({ currentRole = 'semua', currentUser = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('semua');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const userId = currentUser?.nomorInduk || currentUser?.id || '';

  // Ambil data notifikasi terisolasi per pengguna/role
  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications(currentRole, userId);
      if (res && res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.warn('Gagal memuat notifikasi:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentRole, userId]);

  // Koneksi Real-Time SSE Stream
  //
  // Audit 21 Oktober 2026: EventSource tidak dapat menyertakan header
  // Authorization, sehingga server menerbitkan TOKEN SCOPED berumur pendek
  // khusus aliran notifikasi (?st=) — bukan token sesi penuh di URL.
  useEffect(() => {
    let eventSource;
    let cancelled = false;

    const connect = async () => {
      try {
        const streamUrl = await notificationApi.getStreamUrl();
        if (!streamUrl || cancelled) return;

        eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'NEW_NOTIFICATION') {
              const newNotif = data.notification;
              setNotifications((prev) => [newNotif, ...prev]);
              setUnreadCount((c) => c + 1);

              // Tampilkan notifikasi singkat melalui tumpukan toast bersama
              // (FeedbackHost) agar tidak ada dua sistem toast yang tumpang tindih.
              notify(newNotif.message, {
                title: newNotif.title,
                variant: 'info',
                duration: 5000
              });
            }
          } catch {}
        };

        eventSource.onerror = () => {
          // Fallback polling jika SSE reconnect
        };
      } catch (err) {
        console.warn('Gagal membuka aliran notifikasi real-time:', err);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (eventSource) eventSource.close();
    };
  }, []);

  // Klik di luar dropdown untuk menutup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await notificationApi.markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await notificationApi.markAllAsRead(currentRole);
  };

  // Trigger demo broadcast
  const handleTriggerSimulasi = async (title, message, type = 'info', eventCategory = 'umum') => {
    await notificationApi.broadcast({
      role: currentRole,
      title,
      message,
      type,
      eventCategory
    });
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'action') return n.type === 'action_required';
    return true;
  });

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Tombol Lonceng Notifikasi */}
      <button
        type="button"
        className="topbar-icon-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifikasi sistem, terdapat ${unreadCount} pesan baru`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Notifikasi Real-Time Sistem"
        style={{ position: 'relative', cursor: 'pointer' }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            className="topbar-notification-badge"
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              borderRadius: 'var(--radius-md)',
              padding: '1px 5px',
              fontSize: '10px',
              fontWeight: 'bold',
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              animation: 'pulse 2s infinite'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Notifikasi */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--color-border-default)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          {/* Header Dropdown */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--primitive-navy-950)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} color="#f97316" />
              <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Notifikasi & Action Item</span>
              {unreadCount > 0 && (
                <span style={{ backgroundColor: '#ef4444', color: '#ffffff', padding: '1px 6px', borderRadius: 'var(--radius-md)', fontSize: '10px', fontWeight: 'bold' }}>
                  {unreadCount} Baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Tab Filter */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--color-border-subtle)',
              backgroundColor: 'var(--primitive-neutral-50)',
              fontSize: '11.5px'
            }}
          >
            {[
              { id: 'semua', label: `Semua (${notifications.length})` },
              { id: 'unread', label: `Belum Dibaca (${unreadCount})` },
              { id: 'action', label: 'Action Item' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Daftar Item Notifikasi */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                Tidak ada notifikasi dalam kategori ini.
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Notifikasi: ${item.title}${item.isRead ? '' : ' (belum dibaca)'}`}
                  onClick={(e) => handleMarkAsRead(item.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleMarkAsRead(item.id, e);
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    backgroundColor: item.isRead ? '#ffffff' : 'var(--primitive-navy-50)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  {/* Icon Tipe */}
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>
                    {item.type === 'success' ? (
                      <CheckCircle size={16} color="#16a34a" />
                    ) : item.type === 'action_required' ? (
                      <AlertTriangle size={16} color="#ea580c" />
                    ) : (
                      <Info size={16} color="#0284c7" />
                    )}
                  </div>

                  {/* Isi Pesan */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: item.isRead ? '600' : 'bold', fontSize: '12px', color: 'var(--primitive-navy-950)' }}>
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-brand-primary)' }} />
                      )}
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      {item.message}
                    </p>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
                      {formatWaktu(item.createdAt)}
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'inline-block',
                          width: '3px',
                          height: '3px',
                          borderRadius: '50%',
                          backgroundColor: 'currentColor',
                          margin: '0 6px',
                          verticalAlign: 'middle'
                        }}
                      />
                      SIM-TA
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Aksi Khusus: Log Email & Simulasi */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--primitive-neutral-50)',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsEmailModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                color: 'var(--color-brand-primary)',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <Mail size={13} /> Log Email SLA
            </button>

            {/* Tombol Simulasi Live */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() =>
                  handleTriggerSimulasi(
                    'Persetujuan Naskah Baru (ACC)',
                    'Dosen Pembimbing telah menyetujui naskah untuk Sidang Skripsi.',
                    'success',
                    'persetujuan_naskah'
                  )
                }
                title="Kirim simulasi notifikasi real-time via SSE"
                style={{
                  padding: '2px 6px',
                  fontSize: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-default)',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                + Test Notif
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Log Email SLA */}
      <EmailLogsModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </div>
  );
}
