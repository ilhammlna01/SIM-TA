import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const tests = [
  'http://localhost:5173/',
  'http://localhost:5173/?role=admin&nav=dashboard',
  'http://localhost:5173/?role=admin&nav=jadwal-tahapan',
  'http://localhost:5173/?role=admin&nav=otomasi-dokumen',
  'http://localhost:5173/?role=penguji&nav=daftar-ujian',
  'http://localhost:5173/?role=superadmin&nav=dashboard'
];

async function runTest(url) {
  const tempDir = path.join(os.tmpdir(), `edge_test_${Date.now()}`);
  const proc = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9341',
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--no-sandbox',
    url
  ]);

  await new Promise((r) => setTimeout(r, 1200));

  try {
    const raw = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9341/json', (r) => {
        let d = '';
        r.on('data', (c) => (d += c));
        r.on('end', () => res(JSON.parse(d)));
      }).on('error', rej);
    });

    const target = raw.find((t) => t.type === 'page');
    if (!target) {
      console.log(url, '-> No page target');
      proc.kill();
      return;
    }

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let errorFound = null;

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        errorFound = msg.params.exceptionDetails.text + ': ' + (msg.params.exceptionDetails.exception?.description || '');
      }
    };

    await new Promise((r) => setTimeout(r, 2500));

    const evalRes = await new Promise((resolve) => {
      let resolved = false;
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === 2 && !resolved) {
          resolved = true;
          resolve(msg.result?.result?.value);
        }
      };
      ws.send(JSON.stringify({
        id: 2,
        method: 'Runtime.evaluate',
        params: {
          expression: `JSON.stringify({
            htmlLength: document.getElementById('root')?.innerHTML?.length || 0,
            hasHeading: !!document.querySelector('h1, h2'),
            title: document.title
          })`
        }
      }));
      setTimeout(() => {
        if (!resolved) resolve(null);
      }, 1500);
    });

    ws.close();
    proc.kill();

    console.log(url, '-->', {
      error: errorFound,
      dom: evalRes ? JSON.parse(evalRes) : null
    });
  } catch (err) {
    console.log(url, '--> Failed:', err.message);
    proc.kill();
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

async function main() {
  for (const u of tests) {
    await runTest(u);
  }
}

main();
