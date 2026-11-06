module.exports = {
  apps: [
    {
      name: 'sim-ta-feb-utm',
      script: 'server/index.js',
      instances: 1, // Node:sqlite DatabaseSync operates with 1 instance or cluster with wal
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
        // WAJIB: setel domain resmi kampus (bukan '*') agar API tidak terbuka lintas situs.
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://sim-ta.feb.utm.ac.id',
        // Jumlah hop reverse proxy di depan aplikasi (1 bila di belakang nginx/LB).
        TRUST_PROXY_HOPS: process.env.TRUST_PROXY_HOPS || '1',
        // WAJIB: ekspor JWT_SECRET (min. 32 karakter) di environment sebelum `pm2 start`.
        // Contoh: JWT_SECRET="$(openssl rand -hex 32)" pm2 start ecosystem.config.cjs
        JWT_SECRET: process.env.JWT_SECRET,
        // WAJIB: URL publik resmi (bukan localhost) agar QR Code pada dokumen
        // resmi dapat diverifikasi dari perangkat di luar server.
        APP_PUBLIC_URL: process.env.APP_PUBLIC_URL || 'https://sim-ta.feb.utm.ac.id',
        EMAIL_ALLOWED_DOMAINS: process.env.EMAIL_ALLOWED_DOMAINS || 'trunojoyo.ac.id'
      }
    }
  ]
};
