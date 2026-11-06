import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cocokkan paket di dalam node_modules berdasarkan segmen path (bukan sekadar
// substring), agar tidak salah menandai berkas aplikasi (mis. `src/utils/react-*`).
const inNodeModules = (id, pkg) =>
  new RegExp(`[\\\\/]node_modules[\\\\/]${pkg}[\\\\/]`).test(id);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Audit 21 Oktober 2026 — Jaring pengaman untuk mode pengembangan.
    //
    // Frontend pada mode dev memanggil API pada origin absolut
    // (http://localhost:5001/api) sehingga tidak memerlukan proxy. Namun
    // URL yang relatif (mis. aliran SSE notifikasi) akan terselesaikan ke
    // origin :5173 dan berakhir 404. Proxy ini membuat setiap permintaan
    // /api/* pada :5173 diteruskan ke backend :5001, sehingga perilaku
    // dev server IDENTIK dengan produksi.
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: false
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    // Audit 21 Oktober 2026 — Saat `vite build --watch` berjalan (mode
    // convenience saat pengembangan), Vite mengosongkan outDir di awal tiap
    // rebuild. Akibatnya dist/index.html sempat HILANG dan server produksi
    // pada :5001 membalas HTTP 500 untuk seluruh route antarmuka selama
    // jendela rebuild. Pada mode watch, outDir TIDAK dikosongkan sehingga
    // aset lama tetap tersedia sampai aset baru selesai ditulis.
    // Build normal (`npm run build`) tetap Membersihkan outDir sepenuhnya.
    emptyOutDir: !process.argv.includes('--watch'),
    rollupOptions: {
      output: {
        // Hanya pisahkan pustaka pihak ketiga yang besar & stabil.
        // Halaman aplikasi sudah dimuat secara lazy (React.lazy + dynamic import)
        // sehingga Vite/Rollup membuat chunk per-halaman secara otomatis. Memaksa
        // pemisahan berbasis folder `src/pages/*` membuat modul bersama (mis.
        // src/utils/pdfDownloader.js) terpecah lintas chunk dan memicu siklus
        // ("Circular chunk: vendor-pdf -> module-koorprodi -> vendor-pdf").
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (inNodeModules(id, 'react') || inNodeModules(id, 'react-dom') || inNodeModules(id, 'scheduler')) {
            return 'vendor-react';
          }
          if (inNodeModules(id, 'lucide-react')) {
            return 'vendor-icons';
          }
          if (inNodeModules(id, 'xlsx')) {
            return 'vendor-excel';
          }
          if (
            inNodeModules(id, 'jspdf') ||
            inNodeModules(id, 'qrcode') ||
            inNodeModules(id, 'fflate')
          ) {
            return 'vendor-pdf';
          }
          return 'vendor-libs';
        }
      }
    }
  }
});
