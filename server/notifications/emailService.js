/**
 * Email Notification Service - SIM Tugas Akhir FEB UTM
 * Mengirimkan email formal akademik otomatis mengacu pada SLA dan alur persetujuan PRD:
 * 1. Pendaftaran Ujian Baru (SLA Verifikasi Berkas Subbag Akademik/Pascasarjana)
 * 2. Persetujuan Naskah / ACC Promotor (Notifikasi ke Mahasiswa)
 * 3. Catatan Revisi & Koreksi Pasca-Ujian (SLA 14 Hari Kalender sesuai Pedoman)
 * 4. Penerbitan Nomor SK Dekan FEB UTM
 */

import nodemailer from 'nodemailer';
import { db } from '../database/db.js';

// Konfigurasi Transporter Nodemailer (Mendukung SMTP nyata atau Simulated Transport)
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    // Mode SMTP Riil (Gmail / SendGrid / Resend SMTP / UTM Server)
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    });
  } else {
    // Mode Simulasi Development Cerdas (Menghasilkan Ethereal test account atau log simulator)
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('[Email Service] Menggunakan simulated Ethereal test inbox:', testAccount.user);
    } catch {
      // Fallback in-memory logger jika offline dari internet
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
      console.log('[Email Service] Berjalan dalam mode local JSON transport simulator.');
    }
  }

  return transporter;
}

function getAppBaseUrl() {
  return process.env.APP_PUBLIC_URL || (process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:5001');
}

/**
 * Escape nilai dinamis sebelum disisipkan ke HTML email.
 * Mencegah XSS tersimpan pada pratinjau email di UI admin (dangerouslySetInnerHTML).
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validasi domain email penerima terhadap allowlist institusi.
 * Mencegah penyalahgunaan endpoint email untuk phishing ke alamat eksternal.
 */
export function isAllowedRecipientEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return false;

  const allowed = (process.env.EMAIL_ALLOWED_DOMAINS || 'trunojoyo.ac.id')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) return true;
  const domain = trimmed.split('@')[1];
  return allowed.some((d) => domain === d || domain.endsWith(`.${d}`));
}

/**
 * Template Kop Surat Email Resmi FEB UTM
 */
function renderEmailWrapper({ subject, headerTitle, badgeText, badgeColor = '#0284c7', contentHtml, actionButton, footerNote }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
            <!-- Header Resmi FEB UTM -->
            <tr>
              <td style="background-color: #182b49; padding: 20px 24px; text-align: left;">
                <table width="100%">
                  <tr>
                    <td>
                      <div style="color: #ea580c; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
                        FAKULTAS EKONOMI DAN BISNIS
                      </div>
                      <div style="color: #ffffff; font-size: 18px; font-weight: bold; margin-top: 2px;">
                        UNIVERSITAS TRUNOJOYO MADURA
                      </div>
                      <div style="color: #94a3b8; font-size: 11px; margin-top: 2px;">
                        SIM Tugas Akhir Multi-Jenjang (D3, S1, S2, S3)
                      </div>
                    </td>
                    <td align="right" valign="top">
                      <span style="display: inline-block; padding: 4px 10px; background-color: ${badgeColor}; color: #ffffff; border-radius: 4px; font-size: 11px; font-weight: bold;">
                        ${badgeText}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Judul Email -->
            <tr>
              <td style="padding: 24px 24px 12px 24px; border-bottom: 1px solid #f1f5f9;">
                <h2 style="margin: 0; color: #0f172a; font-size: 17px; font-weight: 700;">
                  ${headerTitle}
                </h2>
              </td>
            </tr>

            <!-- Konten Isi -->
            <tr>
              <td style="padding: 20px 24px; color: #334155; font-size: 13.5px; line-height: 1.6;">
                ${contentHtml}

                ${actionButton ? `
                <div style="margin: 24px 0; text-align: center;">
                  <a href="${actionButton.url}" style="display: inline-block; padding: 10px 24px; background-color: #182b49; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold;">
                    ${actionButton.label}
                  </a>
                </div>
                ` : ''}

                ${footerNote ? `
                <div style="margin-top: 20px; padding: 12px; background-color: #f8fafc; border-left: 3px solid #f97316; border-radius: 4px; font-size: 12px; color: #475569;">
                  ${footerNote}
                </div>
                ` : ''}
              </td>
            </tr>

            <!-- Footer Resmi -->
            <tr>
              <td style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px;">
                Email ini dikirim secara otomatis oleh Sistem Informasi Manajemen Tugas Akhir (SIM-TA) FEB UTM.<br>
                Jl. Raya Telang PO. Box 2 Kamal, Bangkalan - Madura 69162 | Layanan Bantuan: sim-ta@feb.trunojoyo.ac.id
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Helper Pencatatan Log Email ke SQLite
 */
function recordEmailLog({ recipientEmail, recipientName, subject, eventType, htmlContent, previewUrl, slaDeadline }) {
  try {
    const id = `eml-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO email_logs (
        id, recipient_email, recipient_name, subject, event_type,
        html_content, status, preview_url, sla_deadline, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      id,
      recipientEmail,
      recipientName,
      subject,
      eventType,
      htmlContent,
      'Terkirim',
      previewUrl || null,
      slaDeadline || null
    );
    return id;
  } catch (err) {
    console.error('[Email Service] Gagal mencatat log email ke database:', err);
    return null;
  }
}

export const EmailService = {
  /**
   * 1. Notifikasi Pendaftaran Ujian Baru (Kepada Admin Akademik & Koorprodi)
   */
  async sendPendaftaranUjianEmail({
    recipientEmail = 'subbag.akademik@feb.trunojoyo.ac.id',
    recipientName = 'Subbag Akademik & Tata Usaha FEB UTM',
    mhsNama = 'Ilham Maulana',
    nim = '210211100142',
    jenjang = 'S1',
    prodi = 'S-1 Manajemen',
    tahap = 'Sidang Skripsi',
    slaHours = 48
  }) {
    const subject = `[SIM-TA FEB UTM] Pendaftaran Baru ${tahap} - ${mhsNama} (${nim})`;
    const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000).toLocaleString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const contentHtml = `
      <p>Yth. <strong>${escapeHtml(recipientName)}</strong>,</p>
      <p>Telah diterima berkas pendaftaran ujian tugas akhir baru pada portal SIM-TA FEB UTM dengan rincian sebagai berikut:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px;">
        <tr><td style="padding: 6px; width: 140px; color: #64748b;">Nama Mahasiswa</td><td>: <strong>${escapeHtml(mhsNama)}</strong></td></tr>
        <tr><td style="padding: 6px; color: #64748b;">NIM</td><td>: ${escapeHtml(nim)}</td></tr>
        <tr><td style="padding: 6px; color: #64748b;">Program Studi</td><td>: ${escapeHtml(prodi)} (${escapeHtml(jenjang)})</td></tr>
        <tr><td style="padding: 6px; color: #64748b;">Tahap Ujian</td><td>: <span style="color: #0369a1; font-weight: bold;">${escapeHtml(tahap)}</span></td></tr>
        <tr><td style="padding: 6px; color: #64748b;">Waktu Pengajuan</td><td>: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
      </table>
      <p>Mohon segera melakukan <strong>Verifikasi Berkas Persyaratan</strong> (KRS, Transkrip Nilai, Bukti Bebas Plagiasi, LoA Jurnal/TOEFL) sebelum batas SLA berakhir.</p>
    `;

    const html = renderEmailWrapper({
      subject,
      headerTitle: `Permohonan Verifikasi Berkas: ${escapeHtml(tahap)}`,
      badgeText: `SLA ${slaHours} JAM`,
      badgeColor: '#ea580c',
      contentHtml,
      actionButton: {
        label: 'Verifikasi Berkas Sekarang',
        url: `${getAppBaseUrl()}/`
      },
      footerNote: `<strong>Ketentuan SLA Akademik:</strong> Batas waktu verifikasi berkas ujian adalah <strong>${slaDeadline}</strong>. Keterlambatan verifikasi dapat memengaruhi penjadwalan ruang sidang.`
    });

    const mailClient = await getTransporter();
    const info = await mailClient.sendMail({
      from: '"SIM Tugas Akhir FEB UTM" <no-reply@feb.trunojoyo.ac.id>',
      to: recipientEmail,
      subject,
      html
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    recordEmailLog({
      recipientEmail,
      recipientName,
      subject,
      eventType: 'PENDAFTARAN_UJIAN_BARU',
      htmlContent: html,
      previewUrl,
      slaDeadline
    });

    return { success: true, messageId: info.messageId, previewUrl };
  },

  /**
   * 2. Notifikasi Persetujuan Naskah / ACC Promotor (Kepada Mahasiswa)
   */
  async sendPersetujuanNaskahEmail({
    recipientEmail = 'ilham.maulana@student.trunojoyo.ac.id',
    recipientName = 'Ilham Maulana',
    pembimbingNama = 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    judulTA = 'Analisis Efisiensi dan Kinerja Keuangan Perbankan Syariah di Madura',
    tahapBerikutnya = 'Pendaftaran Sidang Skripsi'
  }) {
    const subject = `[SIM-TA FEB UTM] Selamat! Naskah Tugas Akhir Telah Disetujui (ACC) oleh Dosen Pembimbing`;

    const contentHtml = `
      <p>Halo, <strong>${escapeHtml(recipientName)}</strong>,</p>
      <p>Kabar gembira! Dosen Pembimbing / Promotor Anda, <strong>${escapeHtml(pembimbingNama)}</strong>, telah resmi menyetujui (ACC) draf naskah tugas akhir Anda:</p>
      <div style="padding: 12px; background-color: #f1f5f9; border-radius: 6px; font-style: italic; color: #1e293b; margin: 10px 0;">
        "${escapeHtml(judulTA)}"
      </div>
      <p>Dengan disetujuinya naskah ini, Anda telah memenuhi prasyarat akademik untuk melangkah ke tahapan berikutnya: <strong>${escapeHtml(tahapBerikutnya)}</strong>.</p>
      <p>Silakan segera mengunggah dokumen persyaratan ujian dan melengkapi berkas pendaftaran melalui portal SIM-TA.</p>
    `;

    const html = renderEmailWrapper({
      subject,
      headerTitle: 'Persetujuan Naskah Tugas Akhir (ACC)',
      badgeText: 'NASKAH DISETUJUI',
      badgeColor: '#16a34a',
      contentHtml,
      actionButton: {
        label: 'Buka Portal & Daftar Ujian',
        url: `${getAppBaseUrl()}/`
      },
      footerNote: '<strong>Langkah Selanjutnya:</strong> Cetak Lembar Pengesahan dan Kartu Kendali Bimbingan melalui menu Dokumen pada portal mahasiswa untuk kelengkapan administrasi.'
    });

    const mailClient = await getTransporter();
    const info = await mailClient.sendMail({
      from: '"SIM Tugas Akhir FEB UTM" <no-reply@feb.trunojoyo.ac.id>',
      to: recipientEmail,
      subject,
      html
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    recordEmailLog({
      recipientEmail,
      recipientName,
      subject,
      eventType: 'PROMOTOR_SETUJU_NASKAH',
      htmlContent: html,
      previewUrl
    });

    return { success: true, messageId: info.messageId, previewUrl };
  },

  /**
   * 3. Notifikasi Catatan Revisi & Koreksi Penguji Pasca-Ujian (Kepada Mahasiswa)
   */
  async sendCatatanRevisiEmail({
    recipientEmail = 'ilham.maulana@student.trunojoyo.ac.id',
    recipientName = 'Ilham Maulana',
    pengujiNama = 'Dr. Faidal, S.E., M.M.',
    daftarKoreksi = 'Perbaiki teknik sampling pada Bab III dan tambahkan pembahasan teori keagenan pada Bab IV.',
    tenggatHari = 14
  }) {
    const subject = `[SIM-TA FEB UTM] Pemberitahuan Catatan Revisi Ujian Sidang (Tenggat: ${tenggatHari} Hari Kalender)`;
    const batasRevisi = new Date(Date.now() + tenggatHari * 24 * 3600 * 1000).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const contentHtml = `
      <p>Yth. <strong>${escapeHtml(recipientName)}</strong>,</p>
      <p>Dewan Penguji Ujian Sidang, <strong>${escapeHtml(pengujiNama)}</strong>, telah mengunggah catatan evaluasi dan koreksi naskah tugas akhir Anda.</p>
      <div style="padding: 12px; background-color: #fff7ed; border-left: 3px solid #ea580c; border-radius: 4px; margin: 12px 0;">
        <strong style="color: #9a3412;">Ringkasan Arahan Penguji:</strong><br>
        <span style="color: #431407;">${escapeHtml(daftarKoreksi)}</span>
      </div>
      <p>Sesuai dengan <strong>Pedoman Akademik FEB UTM (SLA 14 Hari Kalender)</strong>, batas waktu penyelesaian revisi dan persetujuan penguji adalah selambat-lambatnya pada <strong>${batasRevisi}</strong>.</p>
    `;

    const html = renderEmailWrapper({
      subject,
      headerTitle: 'Catatan Koreksi & Perbaikan Naskah',
      badgeText: `TENGGAT ${tenggatHari} HARI`,
      badgeColor: '#dc2626',
      contentHtml,
      actionButton: {
        label: 'Lihat Detail & Unggah Hasil Revisi',
        url: `${getAppBaseUrl()}/`
      },
      footerNote: '<strong>Peringatan Akademik:</strong> Keterlambatan pengesahan revisi melebihi batas 14 hari kalender dapat berakibat pada penundaan yudisium kelulusan.'
    });

    const mailClient = await getTransporter();
    const info = await mailClient.sendMail({
      from: '"SIM Tugas Akhir FEB UTM" <no-reply@feb.trunojoyo.ac.id>',
      to: recipientEmail,
      subject,
      html
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    recordEmailLog({
      recipientEmail,
      recipientName,
      subject,
      eventType: 'CATATAN_REVISI_BARU',
      htmlContent: html,
      previewUrl,
      slaDeadline: batasRevisi
    });

    return { success: true, messageId: info.messageId, previewUrl };
  },

  /**
   * 4. Notifikasi Penerbitan SK Dekan FEB UTM (Kepada Dosen & Mahasiswa)
   */
  async sendSKTerbitEmail({
    recipientEmail = 'dosen.pembimbing@feb.trunojoyo.ac.id',
    recipientName = 'Dr. Dra. Hj. Iriani Ismail, M.M.',
    nomorSK = 'SK.DEKAN/089/FEB-UTM/X/2026',
    perihal = 'Penetapan Dosen Pembimbing Skripsi Semester Gasal 2026/2027',
    namaMahasiswa = 'Ilham Maulana'
  }) {
    const subject = `[SIM-TA FEB UTM] Penerbitan Surat Keputusan Dekan: ${nomorSK}`;

    const contentHtml = `
      <p>Yth. <strong>${escapeHtml(recipientName)}</strong>,</p>
      <p>Diberitahukan bahwa Dekan Fakultas Ekonomi dan Bisnis Universitas Trunojoyo Madura telah resmi menerbitkan Surat Keputusan (SK) terkait:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px;">
        <tr><td style="padding: 6px; width: 130px; color: #64748b;">Nomor SK</td><td>: <strong>${escapeHtml(nomorSK)}</strong></td></tr>
        <tr><td style="padding: 6px; color: #64748b;">Perihal</td><td>: ${escapeHtml(perihal)}</td></tr>
        <tr><td style="padding: 6px; color: #64748b;">Mahasiswa Terkait</td><td>: ${escapeHtml(namaMahasiswa)}</td></tr>
        <tr><td style="padding: 6px; color: #64748b;">Tanggal Penetapan</td><td>: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
      </table>
      <p>Salinan berkas SK digital berstempel sah dapat diunduh langsung melalui arsip dokumen SIM-TA.</p>
    `;

    const html = renderEmailWrapper({
      subject,
      headerTitle: 'Penerbitan Surat Keputusan (SK) Dekan',
      badgeText: 'SK RESMI',
      badgeColor: '#182b49',
      contentHtml,
      actionButton: {
        label: 'Unduh Salinan SK Digital',
        url: `${getAppBaseUrl()}/`
      }
    });

    const mailClient = await getTransporter();
    const info = await mailClient.sendMail({
      from: '"SIM Tugas Akhir FEB UTM" <no-reply@feb.trunojoyo.ac.id>',
      to: recipientEmail,
      subject,
      html
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    recordEmailLog({
      recipientEmail,
      recipientName,
      subject,
      eventType: 'SK_UJIAN_TERBIT',
      htmlContent: html,
      previewUrl
    });

    return { success: true, messageId: info.messageId, previewUrl };
  }
};

export default EmailService;
