import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ARTIFACT_DIR = 'C:\\Users\\Ilham Maulana\\.gemini\\antigravity-ide\\brain\\9d4418d1-d12b-4653-be42-baaa1b959132\\screenshots';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TEMP_USER_DATA_DIR = path.join(os.tmpdir(), `edge_profile_${Date.now()}`);

console.log('[Capture] Meluncurkan Microsoft Edge Headless (1440x1200)...');
const edgeProcess = spawn(EDGE_PATH, [
  '--headless=new',
  '--remote-debugging-port=9333',
  `--user-data-dir=${TEMP_USER_DATA_DIR}`,
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=1440,1200',
  'http://localhost:5173/?role=admin&nav=otomasi-dokumen'
]);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    let wsUrl = null;
    for (let i = 0; i < 20; i++) {
      await wait(500);
      try {
        const targets = await fetchJson('http://127.0.0.1:9333/json');
        const pageTarget = targets.find((t) => t.type === 'page');
        if (pageTarget && pageTarget.webSocketDebuggerUrl) {
          wsUrl = pageTarget.webSocketDebuggerUrl;
          break;
        }
      } catch {}
    }

    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise((resolve) => ws.onopen = resolve);
    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');

    await wait(3500);

    // 1. Klik Generate Paket Kilat
    await sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Generate Paket Dokumen'));
          if (btn) btn.click();
        })()
      `,
      awaitPromise: true
    });

    await wait(3000);

    // Ambil screenshot hasil paket lengkap (dengan tinggi 1200px)
    const resPaket = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'admin_otomasi_paket_lengkap.png'), Buffer.from(resPaket.data, 'base64'));
    console.log('[Capture] admin_otomasi_paket_lengkap.png berhasil disimpan!');

    // 2. Klik Tab Arsip Dokumen Resmi
    await sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Arsip Dokumen Resmi'));
          if (tab) tab.click();
        })()
      `,
      awaitPromise: true
    });

    await wait(1500);

    const resArsip = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'admin_otomasi_arsip_terbit.png'), Buffer.from(resArsip.data, 'base64'));
    console.log('[Capture] admin_otomasi_arsip_terbit.png berhasil disimpan!');

    // 3. Klik Tab Format & Nomor Urut Dinas
    await sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Format & Nomor Urut Dinas'));
          if (tab) tab.click();
        })()
      `,
      awaitPromise: true
    });

    await wait(1500);

    const resCounters = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'admin_otomasi_format_counters.png'), Buffer.from(resCounters.data, 'base64'));
    console.log('[Capture] admin_otomasi_format_counters.png berhasil disimpan!');

    ws.close();
  } catch (err) {
    console.error('[Capture] Error:', err);
  } finally {
    edgeProcess.kill();
    try {
      fs.rmSync(TEMP_USER_DATA_DIR, { recursive: true, force: true });
    } catch {}
    process.exit(0);
  }
}

run();
