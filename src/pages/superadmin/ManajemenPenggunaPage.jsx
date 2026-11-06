import React, { useState } from 'react';
import {
  Users2,
  Plus,
  Search,
  KeyRound,
  Trash2,
  Edit,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Mail,
  UserCheck,
  RotateCcw,
  FileSpreadsheet,
  Download,
  GraduationCap,
  Scale,
  Building2,
  Shield,
  Check
} from 'lucide-react';
import { Card, Badge, Button, Modal, FormField, Input, Select, Alert, Table } from '../../components/ui';
import { PageHeader } from '../../components/shell';
import ImportUserExcelModal from '../../components/superadmin/ImportUserExcelModal';
import { downloadUserImportTemplate } from '../../utils/excelUserImport';
import { superadminApi, checkBackendOnline } from '../../services/api';
import { confirmDialog } from '../../components/feedback';

export default function ManajemenPenggunaPage({
  userAccounts = [],
  onUpdateUsers
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [formNomorInduk, setFormNomorInduk] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('dosen');
  const [formEligibleRoles, setFormEligibleRoles] = useState(['dosen', 'penguji']);
  const [formJenjang, setFormJenjang] = useState('Multi');
  const [formProdi, setFormProdi] = useState('Jurusan Manajemen');
  const [notification, setNotification] = useState(null);

  const handleDownloadTemplate = () => {
    try {
      downloadUserImportTemplate();
      setNotification({
        type: 'info',
        message: 'Template Excel (Template_Import_Akun_Pengguna_SIMTA_FEB_UTM.xlsx) berhasil diunduh. Silakan isi data sesuai kolom yang telah disediakan.'
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Gagal mengunduh template Excel: ${err.message}`
      });
    }
  };

  const handleImportSuccess = async (importedAccounts, meta) => {
    let updated = [];
    if (meta.duplicateHandling === 'update') {
      const importedMap = new Map(importedAccounts.map(u => [u.nomorInduk?.toString().trim(), u]));
      const existingUpdated = userAccounts.map(u => {
        const key = u.nomorInduk?.toString().trim();
        if (importedMap.has(key)) {
          const imp = importedMap.get(key);
          importedMap.delete(key);
          return {
            ...u,
            nama: imp.nama,
            email: imp.email,
            role: imp.role,
            jenjang: imp.jenjang,
            prodi: imp.prodi,
            status: imp.status || u.status
          };
        }
        return u;
      });
      const newAccounts = Array.from(importedMap.values());
      updated = [...newAccounts, ...existingUpdated];
    } else {
      const existingNims = new Set(userAccounts.map(u => u.nomorInduk?.toString().trim()));
      const trulyNew = importedAccounts.filter(u => !existingNims.has(u.nomorInduk?.toString().trim()));
      updated = [...trulyNew, ...userAccounts];
    }

    if (onUpdateUsers) {
      onUpdateUsers(updated);
    }

    // Sinkronisasi otomatis ke basis data SQLite jika backend aktif
    try {
      const isOnline = await checkBackendOnline();
      if (isOnline) {
        await superadminApi.importUsersBulk(importedAccounts);
      }
    } catch (err) {
      console.warn('Gagal menyinkronkan impor Excel ke SQLite backend:', err);
    }

    setNotification({
      type: 'success',
      message: `Berhasil mengimpor ${importedAccounts.length} akun pengguna dari berkas "${meta.fileName || 'Excel'}". Data akun tersimpan aman di sistem.`
    });
  };

  const filteredUsers = userAccounts.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      u.nama.toLowerCase().includes(q) ||
      u.nomorInduk.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.prodi && u.prodi.toLowerCase().includes(q));

    const matchRole =
      selectedRole === 'Semua' ||
      u.role === selectedRole ||
      (Array.isArray(u.eligibleRoles) && u.eligibleRoles.includes(selectedRole));

    const matchStatus = selectedStatus === 'Semua' || u.status === selectedStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormNomorInduk('');
    setFormNama('');
    setFormEmail('');
    setFormRole('dosen');
    setFormEligibleRoles(['dosen', 'penguji']);
    setFormJenjang('Multi');
    setFormProdi('Jurusan Manajemen');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormNomorInduk(user.nomorInduk);
    setFormNama(user.nama);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormEligibleRoles(
      user.eligibleRoles && Array.isArray(user.eligibleRoles) && user.eligibleRoles.length > 0
        ? user.eligibleRoles
        : [user.role]
    );
    setFormJenjang(user.jenjang || 'S1');
    setFormProdi(user.prodi || 'Jurusan Manajemen');
    setIsModalOpen(true);
  };

  const handleRoleSelectChange = (newRole) => {
    setFormRole(newRole);
    if (newRole === 'mahasiswa') {
      setFormEligibleRoles(['mahasiswa']);
      setFormJenjang('S1');
    } else if (newRole === 'dosen') {
      setFormEligibleRoles(prev => {
        const set = new Set([...prev.filter(r => r !== 'mahasiswa'), 'dosen', 'penguji']);
        return Array.from(set);
      });
      if (formJenjang === 'S1') setFormJenjang('Multi');
    } else if (newRole === 'penguji') {
      setFormEligibleRoles(prev => {
        const set = new Set([...prev.filter(r => r !== 'mahasiswa'), 'penguji', 'dosen']);
        return Array.from(set);
      });
      if (formJenjang === 'S1') setFormJenjang('Multi');
    } else if (newRole === 'koorprodi') {
      setFormEligibleRoles(prev => {
        const set = new Set([...prev.filter(r => r !== 'mahasiswa'), 'koorprodi', 'dosen', 'penguji']);
        return Array.from(set);
      });
    } else if (newRole === 'admin') {
      setFormEligibleRoles(['admin']);
    } else if (newRole === 'superadmin') {
      setFormEligibleRoles(['superadmin', 'admin']);
    }
  };

  const handleToggleEligibleRole = (roleKey) => {
    setFormEligibleRoles(prev => {
      if (prev.includes(roleKey)) {
        // Cegah uncheck jika peran tersebut adalah peran utama
        if (roleKey === formRole) return prev;
        return prev.filter(r => r !== roleKey);
      } else {
        return [...prev, roleKey];
      }
    });
  };

  const handleToggleStatus = async (userId) => {
    const target = userAccounts.find(u => u.id === userId);
    const nextStatus = target?.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const updated = userAccounts.map((u) => {
      if (u.id === userId) {
        return { ...u, status: nextStatus };
      }
      return u;
    });

    if (onUpdateUsers) onUpdateUsers(updated);

    try {
      const isOnline = await checkBackendOnline();
      if (isOnline) {
        await superadminApi.updateUser(userId, { status: nextStatus });
      }
    } catch (err) {
      console.warn('Gagal mengubah status di SQLite:', err);
    }

    setNotification({
      type: 'info',
      message: `Status akun pengguna berhasil diubah menjadi "${nextStatus}".`
    });
  };

  const handleResetPassword = async (user) => {
    const ok = await confirmDialog({
      title: 'Reset Kata Sandi',
      message: `Terbitkan kata sandi sementara acak untuk akun "${user.nama}" (${user.nomorInduk})? Pengguna wajib menggantinya pada login berikutnya.`,
      confirmLabel: 'Ya, Reset Sandi',
      variant: 'warning'
    });
    if (ok) {
      let temporaryPassword = null;
      try {
        const isOnline = await checkBackendOnline();
        if (isOnline) {
          const result = await superadminApi.resetPassword(user.id);
          temporaryPassword = result?.temporaryPassword || null;
        }
      } catch (err) {
        console.warn('Gagal reset password di SQLite:', err);
      }

      setNotification({
        type: 'success',
        message: temporaryPassword
          ? `Kata sandi sementara untuk ${user.nama}: ${temporaryPassword}. Sampaikan sekali kepada pengguna dan minta segera menggantinya.`
          : `Kata sandi akun ${user.nama} berhasil direset. Sampaikan kata sandi sementara kepada pengguna dan minta segera menggantinya.`
      });
    }
  };

  const handleDeleteUser = async (userId, nama) => {
    const ok = await confirmDialog({
      title: 'Hapus Akun Pengguna',
      message: `Hapus akun "${nama}" secara permanen dari sistem?`,
      confirmLabel: 'Ya, Hapus Akun',
      variant: 'danger'
    });
    if (ok) {
      const updated = userAccounts.filter((u) => u.id !== userId);
      if (onUpdateUsers) onUpdateUsers(updated);

      try {
        const isOnline = await checkBackendOnline();
        if (isOnline) {
          await superadminApi.deleteUser(userId);
        }
      } catch (err) {
        console.warn('Gagal menghapus akun di SQLite:', err);
      }

      setNotification({
        type: 'warning',
        message: `Akun pengguna ${nama} berhasil dihapus dari sistem.`
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const rolesToSave = formRole === 'mahasiswa'
      ? ['mahasiswa']
      : Array.from(new Set([formRole, ...(Array.isArray(formEligibleRoles) ? formEligibleRoles : [])]));

    if (editingUser) {
      // Edit pengguna
      const updatedUserPayload = {
        nomorInduk: formNomorInduk.trim(),
        nama: formNama.trim(),
        email: formEmail.trim(),
        role: formRole,
        eligibleRoles: rolesToSave,
        jenjang: formJenjang,
        prodi: formProdi
      };

      const updated = userAccounts.map((u) => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            ...updatedUserPayload
          };
        }
        return u;
      });

      if (onUpdateUsers) onUpdateUsers(updated);

      try {
        const isOnline = await checkBackendOnline();
        if (isOnline) {
          await superadminApi.updateUser(editingUser.id, updatedUserPayload);
        }
      } catch (err) {
        console.warn('Gagal memperbarui akun di SQLite:', err);
      }

      setNotification({
        type: 'success',
        message: `Data akun ${formNama} berhasil diperbarui di pangkalan data.`
      });
    } else {
      // Tambah pengguna baru
      // CATATAN KEAMANAN: TIDAK ada kata sandi default seragam yang dikirim ke
      // server. Server menerbitkan kata sandi sementara ACAK per akun dan
      // mengembalikannya satu kali kepada superadmin.
      const newUser = {
        id: `usr-${Date.now()}`,
        nomorInduk: formNomorInduk.trim(),
        nama: formNama.trim(),
        email: formEmail.trim(),
        role: formRole,
        eligibleRoles: rolesToSave,
        jenjang: formJenjang,
        prodi: formProdi,
        status: 'Aktif',
        lastLogin: 'Belum pernah login'
      };

      const updated = [newUser, ...userAccounts];
      if (onUpdateUsers) onUpdateUsers(updated);

      // Sinkronkan langsung ke basis data SQLite
      let temporaryPassword = null;
      try {
        const isOnline = await checkBackendOnline();
        if (isOnline) {
          const result = await superadminApi.createUser(newUser);
          temporaryPassword = result?.temporaryPassword || null;
        }
      } catch (err) {
        console.warn('Gagal menyimpan akun baru ke SQLite:', err);
      }

      setNotification({
        type: 'success',
        message: temporaryPassword
          ? `Akun pengguna baru ${formNama} (${formNomorInduk}) berhasil dibuat! Kata sandi sementara: ${temporaryPassword}. Pengguna wajib menggantinya saat login pertama.`
          : `Akun pengguna baru ${formNama} (${formNomorInduk}) berhasil dibuat! Gunakan menu "Reset Kata Sandi" untuk menerbitkan kata sandi sementara.`
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM' },
          { label: 'Super Administrator' },
          { label: 'Tata Kelola Pengguna' }
        ]}
        title="Manajemen Akun Pengguna Multi-Role"
        description="Pengelolaan kredensial akses seluruh stakeholder: Mahasiswa, Dosen, Koorprodi, Penguji, Admin Akademik, dan Super Admin."
        statusBadge={<Badge variant="primary">{userAccounts.length} Akun Terdaftar</Badge>}
        secondaryAction={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              icon={Download}
              onClick={handleDownloadTemplate}
              title="Unduh berkas template Excel (.xlsx) terstandarisasi untuk impor massal"
            >
              Unduh Template Excel
            </Button>
            <Button
              variant="secondary"
              icon={FileSpreadsheet}
              onClick={() => setIsImportModalOpen(true)}
              title="Import data banyak akun pengguna sekaligus dari berkas Excel"
            >
              Import dari Excel
            </Button>
          </div>
        }
        primaryAction={
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            Tambah Akun Pengguna
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

      {/* 2. Toolbar Filter */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
              <input
                id="users-search-input"
                aria-label="Cari nama, NIM, NIP, atau email"
                type="text"
                placeholder="Cari nama, NIM, NIP, atau email..."
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
              id="users-filter-role"
              aria-label="Filter peran akun"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                fontSize: 'var(--type-body-size)',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="Semua">Semua Peran (Role)</option>
              <option value="mahasiswa">Mahasiswa</option>
              <option value="dosen">Dosen Pembimbing / Promotor</option>
              <option value="koorprodi">Koorprodi</option>
              <option value="penguji">Dewan Penguji</option>
              <option value="admin">Admin Akademik</option>
              <option value="superadmin">Super Admin</option>
            </select>

            <select
              id="users-filter-status"
              aria-label="Filter status keaktifan akun"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                fontSize: 'var(--type-body-size)',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>

          <div style={{ fontSize: 'var(--type-caption-size)', color: 'var(--color-text-secondary)' }}>
            Total Akun: <strong>{filteredUsers.length}</strong> pengguna
          </div>
        </div>
      </Card>

      {/* 3. Tabel Master Pengguna (Terstandarisasi Table Component) */}
      <Table
        columns={[
          {
            key: 'nama',
            label: 'Nama & Nomor Induk',
            sortable: true,
            render: (val, u) => (
              <div>
                <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--primitive-navy-950)' }}>
                  {val}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  NIM/NIP: <strong>{u.nomorInduk}</strong> · {u.email}
                </div>
              </div>
            )
          },
          {
            key: 'role',
            label: 'Peran & Hak Akses',
            sortable: true,
            render: (val, u) => {
              const roles = u.eligibleRoles && Array.isArray(u.eligibleRoles) && u.eligibleRoles.length > 0
                ? u.eligibleRoles
                : [val];
              const otherRoles = roles.filter(r => r !== val);

              const roleLabelMap = {
                mahasiswa: 'Mahasiswa',
                dosen: 'Dosen Pembimbing',
                koorprodi: 'Koorprodi',
                penguji: 'Dewan Penguji',
                admin: 'Admin Akademik',
                superadmin: 'Super Admin'
              };

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                  <Badge variant={val === 'superadmin' ? 'error' : val === 'admin' ? 'warning' : val === 'koorprodi' ? 'primary' : val === 'dosen' ? 'info' : val === 'penguji' ? 'primary' : 'neutral'}>
                    {roleLabelMap[val] || val.toUpperCase()} (UTAMA)
                  </Badge>
                  {otherRoles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
                      {otherRoles.map(r => (
                        <span
                          key={r}
                          style={{
                            fontSize: '10.5px',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            fontWeight: '600'
                          }}
                        >
                          + {roleLabelMap[r] || r.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
          },
          {
            key: 'prodi',
            label: 'Program Studi / Unit',
            sortable: true,
            render: (val, u) => (
              <div>
                <span style={{ fontSize: '13px' }}>{val}</span>
                {u.jenjang && u.jenjang !== 'Multi' && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>({u.jenjang})</span>
                )}
              </div>
            )
          },
          {
            key: 'status',
            label: 'Status Akun',
            sortable: true,
            render: (val, u) => (
              <Button
                size="sm"
                variant={val === 'Aktif' ? 'success' : 'danger'}
                onClick={() => handleToggleStatus(u.id)}
                style={{ padding: '2px 8px', fontSize: '11px', height: 'auto' }}
              >
                {val}
              </Button>
            )
          },
          {
            key: 'lastLogin',
            label: 'Aktivitas Terakhir',
            sortable: true,
            render: (val) => (
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {val || '-'}
              </span>
            )
          },
          {
            key: 'aksi',
            label: 'Aksi',
            align: 'right',
            render: (_, u) => (
              <div style={{ display: 'inline-flex', gap: '6px' }}>
                <Button
                  size="sm"
                  variant="outline"
                  icon={KeyRound}
                  onClick={() => handleResetPassword(u)}
                  title="Reset Password Pengguna"
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Edit}
                  aria-label={`Edit data pengguna ${u.nama}`}
                  onClick={() => handleOpenEdit(u)}
                  title="Edit Data Pengguna"
                />
                <Button
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  aria-label={`Hapus akun pengguna ${u.nama}`}
                  onClick={() => handleDeleteUser(u.id, u.nama)}
                  title="Hapus Akun Pengguna"
                />
              </div>
            )
          }
        ]}
        data={filteredUsers}
        density="normal"
        striped
        emptyContent="Tidak ada akun pengguna yang cocok dengan kriteria."
      />

      {/* 4. Modal Tambah / Edit Pengguna */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? `Edit Akun: ${editingUser.nama}` : 'Tambah Akun Pengguna Baru'}
          size="md"
        >
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <label htmlFor="user-form-nama" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Nama Lengkap & Gelar:</label>
              <input
                id="user-form-nama"
                type="text"
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                required
                style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label htmlFor="user-form-nomor-induk" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Nomor Induk (NIM / NIP):</label>
                <input
                  id="user-form-nomor-induk"
                  type="text"
                  value={formNomorInduk}
                  onChange={(e) => setFormNomorInduk(e.target.value)}
                  required
                  style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label htmlFor="user-form-email" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Email Kampus UTM:</label>
                <input
                  id="user-form-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label htmlFor="user-form-role" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Peran Utama (Primary Role):</label>
                <select
                  id="user-form-role"
                  value={formRole}
                  onChange={(e) => handleRoleSelectChange(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)' }}
                >
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="dosen">Dosen Pembimbing / Promotor</option>
                  <option value="koorprodi">Koorprodi</option>
                  <option value="penguji">Dewan Penguji</option>
                  <option value="admin">Admin Akademik</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <div>
                <label htmlFor="user-form-jenjang" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Jenjang:</label>
                <select
                  id="user-form-jenjang"
                  value={formJenjang}
                  onChange={(e) => setFormJenjang(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)' }}
                >
                  <option value="S1">S1 (Sarjana)</option>
                  <option value="S2">S2 (Magister)</option>
                  <option value="S3">S3 (Doktor)</option>
                  <option value="D3">D3 (Diploma)</option>
                  <option value="Multi">Multi-Jenjang</option>
                </select>
              </div>
            </div>

            {/* Bagian Hak Akses Multi-Peran (Khusus Dosen / Staf Akademik) */}
            {formRole !== 'mahasiswa' && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #cbd5e1'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--primitive-navy-950)' }}>
                    Hak Akses Multi-Peran (Dapat Beralih di Topbar):
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Peran Aktif Utama: <strong>{formRole.toUpperCase()}</strong>
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: '#475569', marginBottom: '10px', lineHeight: '1.4' }}>
                  Dosen/staf dengan multi-peran dapat langsung beralih dashboard kerja secara instan melalui pemilih 'Peran' di bilah atas aplikasi (Topbar) tanpa perlu login ulang.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'dosen', label: 'Dosen Pembimbing / Promotor', icon: GraduationCap },
                    { id: 'penguji', label: 'Dewan Penguji Ujian Sidang', icon: Scale },
                    { id: 'koorprodi', label: 'Koordinator Prodi (Koorprodi)', icon: Building2 },
                    { id: 'admin', label: 'Admin Akademik & TU', icon: Shield }
                  ].map((item) => {
                    const isChecked = formEligibleRoles.includes(item.id);
                    const isPrimary = formRole === item.id;
                    const ItemIcon = item.icon;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleEligibleRole(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          border: isChecked ? '1.5px solid var(--color-brand-primary, #0284c7)' : '1px solid #e2e8f0',
                          backgroundColor: isChecked ? '#f0f9ff' : '#ffffff',
                          cursor: isPrimary ? 'default' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`multi-role-${item.id}`}
                          checked={isChecked}
                          disabled={isPrimary}
                          onChange={() => handleToggleEligibleRole(item.id)}
                          style={{ cursor: isPrimary ? 'default' : 'pointer' }}
                        />
                        <ItemIcon size={15} style={{ color: isChecked ? 'var(--color-brand-primary, #0284c7)' : '#64748b' }} />
                        <label
                          htmlFor={`multi-role-${item.id}`}
                          style={{
                            fontSize: '11.5px',
                            fontWeight: isChecked ? '600' : '400',
                            color: isChecked ? 'var(--primitive-navy-900, #0f172a)' : '#475569',
                            cursor: isPrimary ? 'default' : 'pointer',
                            flex: 1
                          }}
                        >
                          {item.label} {isPrimary && <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: 'bold' }}>(Utama)</span>}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="user-form-prodi" style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}>Program Studi / Unit Kerja:</label>
              <input
                id="user-form-prodi"
                type="text"
                value={formProdi}
                onChange={(e) => setFormProdi(e.target.value)}
                required
                style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
              />
            </div>

            {!editingUser && (
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-panel-alt)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                Password awal akun baru diterbitkan otomatis sebagai <strong>kata sandi sementara acak</strong> (ditampilkan satu kali setelah akun tersimpan) dan wajib diganti pengguna saat login pertama.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: '8px' }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                type="submit"
              >
                Simpan Akun
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Import Akun Pengguna via Excel */}
      <ImportUserExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingUsers={userAccounts}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
