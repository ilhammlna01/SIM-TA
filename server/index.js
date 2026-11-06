import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// AUDIT 21 OKTOBER 2026 — WAJIB IMPORT PERTAMA.
// Pada ES Module seluruh import statis dievaluasi SEBELUM badan modul. Jika
// pemuatan .env diletakkan setelah import lain, `process.env.JWT_SECRET` &
// `process.env.NODE_ENV` belum tersedia saat modul yang membacanya
// dievaluasi -> nilai .env DIABAIKAN dan server memakai secret acak
// per-proses (seluruh token mati tiap restart).
import './config/env.js';
import { assertProductionJwtSecret } from './config/jwtSecret.js';

import { initSchema, db } from './database/db.js';
import { seedInitialData } from './database/seed.js';
import { startAutoBackupScheduler, stopAutoBackupScheduler } from './database/backup.js';
import { initPinOtorisasi } from './database/pinSeed.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import superadminRoutes from './routes/superadminRoutes.js';
import pengujiRoutes from './routes/pengujiRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import akademikRoutes from './routes/akademikRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy: menentukan bagaimana req.ip diturunkan saat berada di belakang reverse proxy
// (nginx/PM2/load balancer). Tanpa ini, seluruh pengguna di belakang proxy berbagi satu IP,
// sehingga rate limiter per-IP dapat mengunci akses login secara massal.
//   - TRUST_PROXY_HOPS = jumlah hop proxy yang dipercaya (mis. 1 untuk satu nginx).
//   - Default: 1 di produksi (topologi reverse-proxy yang didokumentasikan), 0 selain itu.
//   - Setel 0 bila aplikasi terekspos langsung (tanpa proxy) agar X-Forwarded-For tidak dapat dipalsukan.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Fail-closed: pada mode produksi, JWT_SECRET yang tidak valid HARUS membuat
// server berhenti SEBELUM listen. Pemeriksaan dilakukan di sini (setelah .env
// termuat) agar jaminan "produksi tanpa JWT_SECRET -> server menolak start"
// benar-benar berlaku pada deployment berbasis berkas .env.
assertProductionJwtSecret();

const trustProxyEnv = process.env.TRUST_PROXY_HOPS;
const trustProxyHops = trustProxyEnv !== undefined && String(trustProxyEnv).trim() !== ''
  ? Number(trustProxyEnv)
  : (IS_PRODUCTION ? 1 : 0);
app.set('trust proxy', Number.isFinite(trustProxyHops) ? trustProxyHops : 1);

// Middleware
// CORS: gunakan allowlist dari CORS_ORIGIN (dapat berupa beberapa domain dipisah koma).
// Jika tidak disetel, TIDAK mengizinkan origin lintas-situs (deny-by-default),
// kecuali di mode non-produksi yang membolehkan localhost untuk pengembangan.
//
// Audit 21 Oktober 2026: penolakan origin semula melempar Error biasa sehingga
// BERJALAN ke global error handler dan dibalas HTTP 500 "Internal Server Error" —
// menyamar sebagai kegagalan server, bukan penolakan kebijakan. Sekarang
// penolakan memakai status 403 yang eksplisit (CORS_ORIGIN_DENIED).
function buildCorsOptions() {
  const raw = process.env.CORS_ORIGIN;

  const deny = (origin) => {
    const err = new Error('Origin tidak diizinkan oleh kebijakan CORS.');
    err.status = 403;
    err.code = 'CORS_ORIGIN_DENIED';
    err.expose = true;
    return err;
  };

  if (raw && raw.trim() && raw.trim() !== '*') {
    const list = raw.split(',').map((o) => o.trim()).filter(Boolean);
    return {
      origin(origin, callback) {
        if (!origin || list.includes(origin)) return callback(null, true);
        return callback(deny(origin));
      }
    };
  }

  if (raw && raw.trim() === '*') {
    console.warn('[Security Warning] CORS_ORIGIN=* membuka akses lintas-origin ke seluruh situs. Setel domain resmi pada produksi.');
    return { origin: '*' };
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('[Security] CORS_ORIGIN tidak disetel. Akses lintas-origin DITOLAK (deny-by-default).');
    return { origin: false };
  }

  return { origin: true };
}

app.use(cors(buildCorsOptions()));

// HTTP Security Headers
// Catatan: aplikasi memakai set header yang DISESUAIKAN (bukan default `helmet`)
// karena kebutuhan spesifik SPA: SSE (connect-src), Google Fonts, gambar blob/data,
// dan atribut style inline React. Header di bawah menutup permukaan yang relevan.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // X-XSS-Protection dipertahankan nonaktif: filter lama dapat menimbulkan
  // kerentanan sendiri; CSP + sanitasi yang menjadi pertahanan utama.
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Batasi fitur perangkat yang tidak dipakai aplikasi.
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  // Isolasi lintas-origin (mitigasi Spectre/XS-Leaks) tanpa memutus Google Fonts.
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Origin-Agent-Cluster', '?1');
  // HSTS: hanya bermakna via HTTPS. Dikirim pada produksi (asumsi di balik TLS/reverse proxy).
  if (IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  // Content-Security-Policy: defense-in-depth terhadap XSS.
  // 'unsafe-inline' pada style diperlukan karena React memakai atribut style inline.
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'"
    ].join('; ')
  );
  next();
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Inisialisasi Database SQLite & Seeder
try {
  initSchema();
// Otorisasi PIN Dekanat (Audit 22 Oktober 2026 — butir #1).
initPinOtorisasi();
  seedInitialData();
} catch (err) {
  console.error('[Backend Server] Gagal menginisialisasi database:', err);
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/penguji', pengujiRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/akademik', akademikRoutes);

// Root & Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'SIM Tugas Akhir FEB UTM Backend API',
    database: 'SQLite Relational Database (node:sqlite)',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

// Production Static SPA Serving (Single-Port Deployment - Express 5 Compatible)
//
// Audit 21 Oktober 2026 (C-1): pemeriksaan sebelumnya hanya mengecek KEBERADAAN
// DIREKTORI dist/. Bila dist/ ada tetapi hasil build (index.html) tidak ada —
// misalnya folder build terhapus sebagian — seluruh route non-API akan jatuh ke
// res.sendFile() dan mengembalikan HTTP 500 (server tetap start & /api/health
// hijau, tetapi aplikasi mati total). Karena itu sekarang diperiksa berkas
// index.html secara spesifik, dan kegagalan build Buildsers ChirpStop.
const distIndexPath = path.join(distPath, 'index.html');
const hasProductionBuild = fs.existsSync(distIndexPath);

if (hasProductionBuild) {
  console.log(`[Static Serving] Menyajikan berkas produksi SPA dari: ${distPath}`);
  app.use(express.static(distPath));

  // SPA Fallback for client-side routing (Express 5 safe, supports GET & HEAD)
  app.use((req, res, next) => {
    if ((req.method === 'GET' || req.method === 'HEAD') && !req.path.startsWith('/api')) {
      return res.sendFile(distIndexPath);
    }
    next();
  });
} else if (fs.existsSync(distPath)) {
  console.warn(
    '[Static Serving] PERINGATAN: dist/ ada tetapi dist/index.html tidak ditemukan. ' +
    'Build produksi belum dijalankan (`npm run build`). Antarmuka web akan TIDAK dapat diakses; ' +
    'API tetap berfungsi. Jalankan `npm run build` sebelum deployment.'
  );
}

// Global Error Handler Middleware (Mencegah crash dari SyntaxError body-parser atau unhandled errors)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Format payload JSON tidak valid atau body kosong.'
    });
  }

  // Audit 21 Oktober 2026: penolakan kebijakan (mis. CORS) harus dibalas dengan
  // status yang benar (403), bukan 500 yang menyamar sebagai kegagalan server.
  const status = Number(err.status || err.statusCode || 0);
  if (status >= 400 && status < 500) {
    return res.status(status).json({
      success: false,
      code: err.code || undefined,
      message: err.expose ? err.message : 'Permintaan ditolak oleh kebijakan server.'
    });
  }

  console.error('[Unhandled Server Error]:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server internal.'
  });
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SIM-TA FEB UTM Production-Ready Server Berjalan!`);
  console.log(`📡 URL API: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`💾 Database: data/sim_ta_feb_utm.db (SQLite Node 24)`);
  // Audit 21 Oktober 2026: build produksi yang hilang harus menjadi kegagalan
  // yang JELAS, bukan server yang hidup tetapi 500 di setiap route antarmuka.
  console.log(`🌐 Mode: ${hasProductionBuild ? 'Fullstack Single-Port (SPA + API)' : 'API-Only (build SPA belum tersedia)'}`);
  console.log(`====================================================`);

  // Audit 21 Oktober 2026: build produksi yang hilang harus menjadi kegagalan
  // yang JELAS, bukan server yang hidup tetapi 500 di setiap route antarmuka.
  if (IS_PRODUCTION && !hasProductionBuild) {
    console.error(
      '[Fatal] NODE_ENV=production tetapi build SPA (dist/index.html) tidak ditemukan. ' +
      'Jalankan `npm run build` sebelum menjalankan server produksi.'
    );
    process.exit(1);
  }

  // Aktifkan scheduler pencadangan berkala otomatis (siklus 24 jam)
  try {
    startAutoBackupScheduler();
  } catch (err) {
    console.warn('[Backup Engine Warning] Gagal menginisialisasi scheduler otomatis:', err.message);
  }
});

server.on('error', (err) => {
  console.error(`[Backend Server Error]:`, err.message);
});

// Graceful Shutdown
const shutdown = () => {
  console.log('\n[Backend Server] Menutup server secara aman (graceful shutdown)...');
  stopAutoBackupScheduler();
  server.close(() => {
    console.log('[Backend Server] HTTP Server dimatikan.');
    try {
      db.close();
      console.log('[Database] Koneksi SQLite berhasil ditutup.');
    } catch {
      // ignore
    }
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ---------------------------------------------------------------------------
// PENANGANAN KESALAHAN TINGKAT PROSES (Resilience Audit 21 Oktober 2026)
//
// Tanpa penjaga di bawah ini, satu rejection yang tidak tertangani pada
// salah satu route async akan MENGAKIR seluruh proses Node (perilaku default
// Node >= 15), sehingga seluruh pengguna kehilangan layanan secara mendadak.
// ---------------------------------------------------------------------------

// Rejection tak tertangani: dicatat penuh, server TETAP melayani.
// Kesalahan ini sudah lepas dari konteks request sehingga tidak berbahaya
// untuk terus melayani permintaan berikutnya.
process.on('unhandledRejection', (reason) => {
  console.error(
    '[Unhandled Promise Rejection]:',
    reason instanceof Error ? (reason.stack || reason.message) : reason
  );
});

// Uncaught exception: dicatat penuh lalu server melakukan graceful shutdown
// agar supervisor (PM2 / Docker restart policy) dapat menghidupkannya kembali.
// Melanjutkan proses dengan keadaan internal yang tidak diketahui berisiko
// menghasilkan data yang tidak konsisten; berhenti lebih aman.
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err instanceof Error ? (err.stack || err.message) : err);
  console.error('[Backend Server] Melakukan graceful shutdown setelah uncaught exception.');
  try {
    stopAutoBackupScheduler();
  } catch (_) {}
  server.close(() => {
    try {
      db.close();
    } catch (_) {}
    process.exit(1);
  });
  // Jaring pengaman: bila server.close() menggantung, paksa keluar.
  setTimeout(() => process.exit(1), 5000).unref();
});
