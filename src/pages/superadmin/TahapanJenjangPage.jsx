import React, { useState } from 'react';
import {
  GitBranch,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Settings2,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { Card, Badge, Button, Alert } from '../../components/ui';
import { PageHeader } from '../../components/shell';

export default function TahapanJenjangPage({
  tahapanJenjang = {},
  onUpdateTahapan
}) {
  const [activeTab, setActiveTab] = useState('S1');
  const [notification, setNotification] = useState(null);

  // Local draft state for current selected tab
  const currentConfig = tahapanJenjang[activeTab] || {
    jenjangLabel: 'Sarjana (S1)',
    totalTahap: 4,
    tahapanList: [],
    rules: { minBimbingan: 8, minSKS: 120, minToefl: 450, maxTurnitin: 25, syaratPublikasi: '', skorKelulusanMin: 70 }
  };

  const [formRules, setFormRules] = useState(currentConfig.rules);

  // Sync draft when activeTab changes
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setFormRules(tahapanJenjang[tabKey]?.rules || {});
  };

  const handleRuleChange = (field, value) => {
    setFormRules((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveConfig = async () => {
    const updated = {
      ...tahapanJenjang,
      [activeTab]: {
        ...currentConfig,
        rules: formRules
      }
    };

    let result = { success: true };
    if (onUpdateTahapan) {
      result = await onUpdateTahapan(updated, activeTab);
    }

    if (result && result.success === false) {
      setNotification({
        type: 'danger',
        message: result.message || `Gagal menyimpan konfigurasi jenjang ${activeTab} ke basis data.`
      });
      return;
    }

    setNotification({
      type: 'success',
      message: `Konfigurasi aturan akademik jenjang ${activeTab} berhasil disimpan dan diperbarui di sistem!`
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'SIM-TA FEB UTM' },
          { label: 'Super Administrator' },
          { label: 'Konfigurasi Tahapan Jenjang' }
        ]}
        title="Konfigurasi Alur Tahapan & Aturan Multi-Jenjang"
        description="Penetapan standar siklus tugas akhir, beban bimbingan, ambang Turnitin, dan syarat kelulusan D3, S1, S2, dan S3."
        statusBadge={<Badge variant="primary">Regulasi 2026/2027</Badge>}
        primaryAction={
          <Button
            variant="primary"
            icon={Save}
            onClick={handleSaveConfig}
          >
            Simpan Konfigurasi {activeTab}
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

      {/* 2. Tabs Jenjang */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '2px solid var(--color-border-default)', paddingBottom: '2px' }}>
        {['D3', 'S1', 'S2', 'S3'].map((jKey) => {
          const isActive = activeTab === jKey;
          return (
            <button
              key={jKey}
              type="button"
              onClick={() => handleTabChange(jKey)}
              style={{
                padding: '10px 20px',
                fontSize: '13.5px',
                fontWeight: isActive ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--color-brand-primary)' : '3px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                marginBottom: '-2px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <GraduationCap size={16} />
              {jKey === 'D3' ? 'D3 Entrepreneurship' : jKey === 'S1' ? 'S1 Manajemen' : jKey === 'S2' ? 'S2 Magister' : 'S3 Doktor'}
              <Badge variant={isActive ? 'primary' : 'neutral'}>
                {tahapanJenjang[jKey]?.totalTahap || 4} Tahap
              </Badge>
            </button>
          );
        })}
      </div>

      {/* 3. Dua Bagian: Visual Alur Tahapan & Form Parameter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 'var(--space-6)' }}>
        
        {/* Kolom Kiri: Visualisasi Alur Tahapan Akademik */}
        <Card style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
            <Layers size={18} color="var(--primitive-navy-800)" />
            <h2 style={{ fontSize: 'var(--type-title-size)', margin: 0, color: 'var(--primitive-navy-950)' }}>
              Siklus Alur {currentConfig.jenjangLabel}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentConfig.tahapanList?.map((t, idx) => (
              <div
                key={t.kode || idx}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  padding: '12px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'var(--color-surface-panel-alt)'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primitive-navy-900)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    flexShrink: 0
                  }}
                >
                  {t.nomor}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '13.5px', color: 'var(--primitive-navy-950)' }}>
                      {t.nama}
                    </span>
                    <Badge variant="neutral">{t.kode}</Badge>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {t.deskripsi}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Kolom Kanan: Parameter & Regulasi Syarat Kelulusan */}
        <Card style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
            <Settings2 size={18} color="var(--color-brand-primary)" />
            <h2 style={{ fontSize: 'var(--type-title-size)', margin: 0, color: 'var(--primitive-navy-950)' }}>
              Parameter Aturan Kelayakan ({activeTab})
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* Audit 21 Oktober 2026 (P1-3): aturan di bawah kini DITEGAKKAN
                sistem — bukan sekadar data display. */}
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 'var(--radius-md)',
                color: '#1E40AF',
                fontSize: '11.5px',
                lineHeight: 1.55
              }}
            >
              <strong>Aturan ini ditegakkan sistem.</strong> Beban SKS minimal, skor TOEFL
              minimal, batas similaritas, dan skor kelulusan minimum menjadi syarat pada
              checklist pengajuan tahapan; skor kelulusan minimum juga menjadi gerbang saat
              dewan penguji menyimpan rekomendasi kelayakan.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  htmlFor="rule-min-bimbingan"
                  style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}
                >
                  Minimal Sesi Bimbingan:
                </label>
                <input
                  id="rule-min-bimbingan"
                  type="number"
                  value={formRules.minBimbingan || 8}
                  onChange={(e) => handleRuleChange('minBimbingan', Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Minimal tatap muka dosen</span>
              </div>

              <div>
                <label
                  htmlFor="rule-min-sks"
                  style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}
                >
                  Beban SKS Tempuh Minimal:
                </label>
                <input
                  id="rule-min-sks"
                  type="number"
                  value={formRules.minSKS || 120}
                  onChange={(e) => handleRuleChange('minSKS', Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Syarat KRS kelayakan ujian</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  htmlFor="rule-min-toefl"
                  style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}
                >
                  Batas Skor TOEFL Minimal:
                </label>
                <input
                  id="rule-min-toefl"
                  type="number"
                  value={formRules.minToefl || 450}
                  onChange={(e) => handleRuleChange('minToefl', Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Pusat Bahasa UTM</span>
              </div>

              <div>
                <label
                  htmlFor="rule-max-turnitin"
                  style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}
                >
                  Maksimal Turnitin Similarity (%):
                </label>
                <input
                  id="rule-max-turnitin"
                  type="number"
                  value={formRules.maxTurnitin || 25}
                  onChange={(e) => handleRuleChange('maxTurnitin', Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Ambang batas bebas plagiasi</span>
              </div>
            </div>

            <div>
              <label
                htmlFor="rule-skor-kelulusan-min"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}
              >
                Nilai Akhir Kelulusan Minimal (Skala 100):
              </label>
              <input
                id="rule-skor-kelulusan-min"
                type="number"
                value={formRules.skorKelulusanMin || 70}
                onChange={(e) => handleRuleChange('skorKelulusanMin', Number(e.target.value))}
                style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Nilai angka dewan penguji sidang</span>
            </div>

            <div>
              <label
                htmlFor="rule-syarat-publikasi"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '2px' }}
              >
                Kriteria Kewajiban Publikasi Ilmiah:
              </label>
              <textarea
                id="rule-syarat-publikasi"
                rows={3}
                value={formRules.syaratPublikasi || ''}
                onChange={(e) => handleRuleChange('syaratPublikasi', e.target.value)}
                style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Contoh: Wajib minimal 1 Scopus Q1/Q2 atau Sinta 2</span>
            </div>

            <div style={{ marginTop: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={handleSaveConfig}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'var(--color-brand-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Save size={15} /> Simpan Perubahan Regulasi {activeTab}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
