/**
 * ============================================================================
 * SKRIP INI SUDAH DIGANTIKAN — TIDAK LAGI DIGUNAKAN
 * ============================================================================
 *
 * Simulasi A–Z yang SESUNGGUHNYA — memanggil API, memverifikasi efek samping di
 * basis data, menguji guard RBAC, membersihkan data uji, dan menghasilkan laporan
 * Markdown + JSON — berada di:
 *
 *     scripts/simulate_process_az.mjs          (jalankan: npm run simulasi:az)
 *
 * Alasan skrip ini tidak dipakai lagi:
 *   1. Isinya HANYA mencetak keluaran naratif HARDCODE (mis. "8 dari 8 sesi
 *      bimbingan selesai") tanpa pernah memanggil API, sehingga tidak dapat
 *      dipakai sebagai bukti kebenaran alur proses.
 *   2. Masih memakai kata sandi universal institusi yang telah dihapus pada
 *      remediasi 21 Oktober 2026, sehingga skrip ini gagal pada login pertama
 *      dan tidak dapat dijalankan sama sekali.
 *
 * Laporan hasil simulasi:
 *     docs/laporan-simulasi-proses-az.md        (analisis & rekomendasi)
 *     reports/laporan-simulasi-proses-az.md     (laporan otomatis per fase)
 *     reports/simulasi-proses-az.json           (rekam mesin 167 langkah)
 *
 * Dipertahankan sebagai catatan riwayat proses audit. JANGAN dipakai sebagai
 * bukti — gunakan scripts/simulate_process_az.mjs.
 * ============================================================================
 */

const PETUNJUK = {
  replacement: 'scripts/simulate_process_az.mjs',
  perintah: 'npm run simulasi:az',
  laporan: 'docs/laporan-simulasi-proses-az.md',
  alasan:
    'Skrip lama hanya mencetak keluaran hardcoded tanpa memanggil API, serta memakai ' +
    'kata sandi universal yang telah dihapus sehingga tidak dapat dijalankan.'
};

console.log('='.repeat(78));
console.log('  SKRIP INI SUDAH DIGANTIKAN');
console.log('='.repeat(78));
console.log(`  Pengganti  : ${PETUNJUK.replacement}`);
console.log(`  Perintah   : ${PETUNJUK.perintah}`);
console.log(`  Laporan    : ${PETUNJUK.laporan}`);
console.log(`  Alasan     : ${PETUNJUK.alasan}`);
console.log('='.repeat(78));
console.log('');
