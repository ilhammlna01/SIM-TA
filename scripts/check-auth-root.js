import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tempDir = path.join(os.tmpdir(), `edge_test_auth_${Date.now()}`);

const proc = spawn(EDGE_PATH, [
  '--headless=new',
  '--remote-debugging-port=9354',
  `--user-data-dir=${tempDir}`,
  '--disable-gpu',
  '--no-sandbox',
  'about:blank'
]);

async function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  await wait(2500);
  try {
    const raw = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9354/json', (r) => {
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

    // Pre-populate localStorage with Admin session before loading root URL
    send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.localStorage.setItem('sim_ta_feb_utm_auth_session', JSON.stringify({
          id: 'usr-admin-1',
          nomorInduk: '198104122008121002',
          nama: 'Ahmad Fauzi, S.Kom., M.T.',
          role: 'admin',
          jenjang: 'S1',
          prodi: 'Subbag Pascasarjana & Akademik'
        }));
        window.localStorage.setItem('sim_ta_feb_utm_current_role', 'admin');
        window.localStorage.setItem('sim_ta_feb_utm_active_nav', 'jadwal-tahapan');
      `
    });

    send('Page.navigate', { url: 'http://localhost:5173/' });

    await wait(3500);

    const evalId = send('Runtime.evaluate', {
      expression: `JSON.stringify({
        url: window.location.href,
        rootHtmlLength: document.getElementById('root')?.innerHTML?.length || 0,
        hasErrorCard: !!document.querySelector('.lucide-alert-triangle'),
        h1: document.querySelector('h1')?.innerText || '',
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText.trim()).filter(Boolean).slice(0, 5),
        bodySnippet: document.body.innerText.substring(0, 300).replace(/\\s+/g, ' ')
      })`
    });

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === evalId) {
        console.log('=== LOGGED-IN ADMIN AT http://localhost:5173/ ===');
        console.log(JSON.parse(msg.result.result.value));
        ws.close();
        proc.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error('Error:', err);
    proc.kill();
    process.exit(1);
  }
}

run();
