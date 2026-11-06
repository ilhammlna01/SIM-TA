import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tempDir = path.join(os.tmpdir(), `edge_bimbingan_test_${Date.now()}`);
const artifactDir = 'C:\\Users\\Ilham Maulana\\.gemini\\antigravity-ide\\brain\\9d4418d1-d12b-4653-be42-baaa1b959132\\screenshots';

if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

const proc = spawn(EDGE_PATH, [
  '--headless=new',
  '--remote-debugging-port=9360',
  `--user-data-dir=${tempDir}`,
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=1440,900',
  'about:blank'
]);

async function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  await wait(2500);
  try {
    const raw = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9360/json', (r) => {
        let d = '';
        r.on('data', (c) => (d += c));
        r.on('end', () => res(JSON.parse(d)));
      }).on('error', rej);
    });

    const target = raw.find((t) => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let msgId = 1;
    function send(method, params = {}) {
      const id = msgId++;
      ws.send(JSON.stringify({ id, method, params }));
      return id;
    }

    await new Promise((resolve) => {
      if (ws.readyState === WebSocket.OPEN) return resolve();
      ws.onopen = resolve;
    });

    send('Page.enable');
    send('Runtime.enable');

    // TEST 1: Mahasiswa Bimbingan Page
    console.log('Navigating to Mahasiswa Bimbingan Page...');
    send('Page.navigate', { url: 'http://localhost:5173/?role=mahasiswa&nav=bimbingan' });
    await wait(3500);

    // Capture screenshot of Mahasiswa Bimbingan Page
    let shotId = send('Page.captureScreenshot', { format: 'png' });
    await new Promise((resolve) => {
      const h = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === shotId) {
          ws.removeEventListener('message', h);
          fs.writeFileSync(path.join(artifactDir, 'mhs_bimbingan_offline_list.png'), Buffer.from(msg.result.data, 'base64'));
          console.log('Saved mhs_bimbingan_offline_list.png');
          resolve();
        }
      };
      ws.addEventListener('message', h);
    });

    // Open Modal Tambah Bimbingan Mahasiswa
    await new Promise((resolve) => {
      const evalId = send('Runtime.evaluate', {
        expression: `
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Catat Sesi Bimbingan'));
          if (btn) btn.click();
          true;
        `
      });
      const h = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === evalId) {
          ws.removeEventListener('message', h);
          resolve();
        }
      };
      ws.addEventListener('message', h);
    });

    await wait(1500);

    // Capture screenshot of Modal Tambah Bimbingan (Moda Luring + Scan Upload)
    shotId = send('Page.captureScreenshot', { format: 'png' });
    await new Promise((resolve) => {
      const h = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === shotId) {
          ws.removeEventListener('message', h);
          fs.writeFileSync(path.join(artifactDir, 'mhs_modal_catat_luring.png'), Buffer.from(msg.result.data, 'base64'));
          console.log('Saved mhs_modal_catat_luring.png');
          resolve();
        }
      };
      ws.addEventListener('message', h);
    });

    // TEST 2: Dosen Bimbingan Page
    console.log('Navigating to Dosen Bimbingan Page...');
    send('Page.navigate', { url: 'http://localhost:5173/?role=dosen&nav=bimbingan' });
    await wait(3500);

    // Capture screenshot of Dosen Bimbingan Page
    shotId = send('Page.captureScreenshot', { format: 'png' });
    await new Promise((resolve) => {
      const h = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === shotId) {
          ws.removeEventListener('message', h);
          fs.writeFileSync(path.join(artifactDir, 'dosen_bimbingan_verification_list.png'), Buffer.from(msg.result.data, 'base64'));
          console.log('Saved dosen_bimbingan_verification_list.png');
          resolve();
        }
      };
      ws.addEventListener('message', h);
    });

    // Click on "Scan Lembar Kendali" button to open Full Document Preview Modal
    await new Promise((resolve) => {
      const evalId = send('Runtime.evaluate', {
        expression: `
          const scanBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Scan_') || b.title?.includes('Periksa foto scan'));
          if (scanBtn) scanBtn.click();
          true;
        `
      });
      const h = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === evalId) {
          ws.removeEventListener('message', h);
          resolve();
        }
      };
      ws.addEventListener('message', h);
    });

    await wait(1500);

    // Capture screenshot of Scan Modal Preview
    shotId = send('Page.captureScreenshot', { format: 'png' });
    await new Promise((resolve) => {
      const h = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === shotId) {
          ws.removeEventListener('message', h);
          fs.writeFileSync(path.join(artifactDir, 'dosen_modal_preview_scan_fisik.png'), Buffer.from(msg.result.data, 'base64'));
          console.log('Saved dosen_modal_preview_scan_fisik.png');
          resolve();
        }
      };
      ws.addEventListener('message', h);
    });

    console.log('All verification screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    proc.kill();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    process.exit(0);
  }
}

run();
