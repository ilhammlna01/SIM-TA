import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tempDir = path.join(os.tmpdir(), `edge_test_nav_${Date.now()}`);

const proc = spawn(EDGE_PATH, [
  '--headless=new',
  '--remote-debugging-port=9352',
  `--user-data-dir=${tempDir}`,
  '--disable-gpu',
  '--no-sandbox',
  'http://localhost:5173/'
]);

async function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  await wait(2500);
  try {
    const raw = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9352/json', (r) => {
        let d = '';
        r.on('data', (c) => (d += c));
        r.on('end', () => res(JSON.parse(d)));
      }).on('error', rej);
    });

    const target = raw.find((t) => t.type === 'page');
    console.log('Target URL:', target.url);
    console.log('Target Title:', target.title);

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

    send('Runtime.enable');

    await wait(2000);

    const evalId = send('Runtime.evaluate', {
      expression: `JSON.stringify({
        url: window.location.href,
        rootHtmlLength: document.getElementById('root')?.innerHTML?.length || 0,
        h1: document.querySelector('h1')?.innerText || '',
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean).slice(0, 8),
        bodyText: document.body.innerText.substring(0, 250).replace(/\\s+/g, ' ')
      })`
    });

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === evalId) {
        console.log('=== REAL INSPECTION OF http://localhost:5173/ ===');
        console.log(JSON.parse(msg.result.result.value));
        ws.close();
        proc.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error('Test error:', err);
    proc.kill();
    process.exit(1);
  }
}

run();
