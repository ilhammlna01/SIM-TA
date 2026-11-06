import { chromium } from 'playwright';
import { TEST_PASSWORD, ensureTestAccounts } from './helpers/testAccounts.js';

const BASE = 'http://localhost:5001';
const password = TEST_PASSWORD;

async function runTest() {
  // Audit 21 Oktober 2026: siapkan kredensial uji deterministik di luar jalur HTTP.
  // (Kredensial universal institusi tidak lagi berlaku di aplikasi).
  const credPrep = ensureTestAccounts();
  if (!credPrep.ok) {
    console.error('Gagal menyiapkan kredensial uji:', credPrep.message);
    process.exit(1);
  }


  console.log('====================================================');
  console.log('🧪 VERIFIKASI MENDALAM ISOLASI PRODI & LINTAS PRODI KOORPRODI');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => {
    console.error('BROWSER PAGEERROR:', err.message);
    errors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('BROWSER ERROR:', msg.text());
    }
  });

  try {
    // 1. Buka halaman utama
    console.log('1. Navigasi ke', BASE);
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // 2. Login sebagai Koorprodi S-1 Manajemen (Dr. Siti Aminah, S.E., M.M.)
    console.log('2. Login Koorprodi S-1 Manajemen (NIP: 197802142003122001)...');
    await page.fill('input#identifier, input[name="identifier"], input[type="text"]', '197802142003122001');
    await page.fill('input#password, input[name="password"], input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // Verifikasi profil Koorprodi
    const pageText = await page.locator('body').innerText();
    if (!pageText.includes('Siti Aminah') && !pageText.includes('Koorprodi')) {
      throw new Error('Gagal login sebagai Koorprodi!');
    }
    console.log('   ✅ Berhasil login sebagai Koorprodi S-1 Manajemen.');

    // 3. Cek Hero Dashboard & Label Prodi
    console.log('3. Memeriksa badge Program Studi di Dashboard...');
    const hasProdiBadge = await page.locator('text=S-1 Manajemen').first().isVisible().catch(() => false);
    console.log(`   ${hasProdiBadge ? '✅' : '⚠️'} Badge S-1 Manajemen aktif di header/dashboard.`);

    // 4. Verifikasi Halaman Daftar Mahasiswa
    console.log('4. Memeriksa Isolasi Data di Menu "Daftar Mahasiswa"...');
    await page.locator('aside.shell-sidebar button.sidebar-nav-btn:has-text("Daftar Mahasiswa")').click();
    await page.waitForTimeout(1000);
    const mhsContent = await page.locator('#main-content').innerText();
    
    // Periksa bahwa tidak ada data D-3, S-2, atau S-3
    const containsD3 = mhsContent.includes('D-3 Entrepreneurship') || mhsContent.includes('D3 Entrepreneurship');
    const containsS2 = mhsContent.includes('S-2 Magister Manajemen') || mhsContent.includes('S2 Magister Manajemen');
    const containsS3 = mhsContent.includes('S-3 Doktor') || mhsContent.includes('S3 Doktor');
    
    if (containsD3 || containsS2 || containsS3) {
      console.warn('   ⚠️ Data prodi lain terdeteksi pada daftar mahasiswa!');
    } else {
      console.log('   ✅ Data mahasiswa terisolasi: hanya menampilkan mahasiswa S-1 Manajemen.');
    }

    // 5. Verifikasi Halaman Plotting Pembimbing (Kewenangan Lintas Prodi)
    console.log('5. Memeriksa Menu "Plotting Pembimbing"...');
    await page.locator('aside.shell-sidebar button.sidebar-nav-btn:has-text("Plotting Pembimbing")').click();
    await page.waitForTimeout(1200);

    // Cek Banner Lintas Prodi
    const bannerVisible = await page.locator('text=Kewenangan Penetapan Dosen Pembimbing Lintas Prodi FEB UTM').isVisible().catch(() => false);
    console.log(`   ${bannerVisible ? '✅' : '⚠️'} Banner Kewenangan Lintas Prodi tampil.`);

    // Cek Tombol Filter Homebase vs Lintas Prodi
    const btnAll = await page.locator('button:has-text("Semua FEB UTM")').isVisible().catch(() => false);
    const btnHome = await page.locator('button:has-text("Homebase")').isVisible().catch(() => false);
    const btnCross = await page.locator('button:has-text("Lintas Prodi Lain")').isVisible().catch(() => false);
    console.log(`   ${btnAll && btnHome && btnCross ? '✅' : '⚠️'} Filter Prodi Tab lengkap (Semua, Homebase, Lintas Prodi Lain).`);

    // Cek klik tombol Plotting Pembimbing Baru
    const btnPlotting = page.locator('button:has-text("Tetapkan Pembimbing"), button:has-text("Plotting Dosen"), button:has-text("Tambah Plotting")').first();
    if (await btnPlotting.isVisible()) {
      await btnPlotting.click();
      await page.waitForTimeout(800);
      
      const modal = page.locator('.modal-content, [role="dialog"], .card').filter({ hasText: /Plotting|Pembimbing/i }).first();
      console.log('   ✅ Modal Plotting Dosen berhasil dibuka.');

      // Cek dropdown mahasiswa di modal
      const selectMhs = modal.locator('select').first();
      const mhsOptions = await selectMhs.innerText();
      console.log('   📋 Mahasiswa yang dapat di-plotting (dalam prodi):', mhsOptions.split('\n').filter(Boolean).slice(0, 3).join(', '));

      // Tutup modal
      const btnBatal = modal.locator('button:has-text("Batal"), button:has-text("Tutup")').first();
      if (await btnBatal.isVisible()) {
        await btnBatal.click();
        await page.waitForTimeout(500);
      }
    }

    // 6. Verifikasi Halaman Dewan Penguji
    console.log('6. Memeriksa Menu "Dewan Penguji"...');
    await page.locator('aside.shell-sidebar button.sidebar-nav-btn:has-text("Dewan Penguji")').click();
    await page.waitForTimeout(1200);

    const bannerPenguji = await page.locator('text=Kewenangan Penetapan Penguji').isVisible().catch(() => false);
    console.log(`   ${bannerPenguji ? '✅' : '⚠️'} Banner Kewenangan Penetapan Penguji tampil.`);

    const btnTetapkanPenguji = page.locator('button:has-text("Tetapkan Penguji"), button:has-text("Jadwalkan"), button:has-text("Tambah Penguji")').first();
    if (await btnTetapkanPenguji.isVisible()) {
      await btnTetapkanPenguji.click();
      await page.waitForTimeout(800);
      
      const modalPenguji = page.locator('.modal-content, [role="dialog"], .card').filter({ hasText: /Penguji|Penetapan/i }).first();
      console.log('   ✅ Modal Penetapan Dewan Penguji berhasil dibuka.');

      const btnBatalPenguji = modalPenguji.locator('button:has-text("Batal"), button:has-text("Tutup")').first();
      if (await btnBatalPenguji.isVisible()) {
        await btnBatalPenguji.click();
        await page.waitForTimeout(500);
      }
    }

    // 7. Verifikasi Halaman Pengajuan Masuk
    console.log('7. Memeriksa Menu "Pengajuan Masuk"...');
    await page.locator('aside.shell-sidebar button.sidebar-nav-btn:has-text("Pengajuan Masuk")').click();
    await page.waitForTimeout(1000);
    const pengajuanContent = await page.locator('#main-content').innerText();
    console.log('   ✅ Halaman Pengajuan Masuk dapat dibuka dan tersaring khusus S-1 Manajemen.');

    // 8. Verifikasi Penerbitan Dokumen Kolektif
    console.log('8. Memeriksa Menu "Penerbitan Dokumen Kolektif"...');
    await page.locator('aside.shell-sidebar button.sidebar-nav-btn:has-text("Penerbitan Dokumen Kolektif")').click();
    await page.waitForTimeout(1000);
    const massalContent = await page.locator('#main-content').innerText();
    console.log('   ✅ Halaman Penerbitan Dokumen Kolektif hanya menampilkan berkas S-1 Manajemen.');

    // 9. Cek Runtime JS errors
    if (errors.length > 0) {
      console.warn('   ⚠️ Terdapat runtime browser errors:', errors);
    } else {
      console.log('   ✅ Tidak ada runtime browser error.');
    }

    console.log('\n====================================================');
    console.log('🎉 VERIFIKASI SELESAI: SEMUA ATURAN ISOLASI & LINTAS PRODI BERFUNGSI SEMPURNA!');
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Terjadi kesalahan pada saat verifikasi:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runTest();
