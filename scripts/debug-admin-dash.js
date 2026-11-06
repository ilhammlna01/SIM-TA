import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tempDir = path.join(os.tmpdir(), `edge_admin_dash_${Date.now()}`);

const proc = spawn(EDGE_PATH, [
  '--headless=new',
  '--remote-debugging-port=9344',
  `--user-data-dir=${tempDir}`,
  '--disable-gpu',
  '--no-sandbox',
  'http://localhost:5173/?role=admin&nav=dashboard'
]);

async function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  await wait(1500);
  try {
    const raw = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9344/json', (r) => {
        let d = '';
        r.on('data', (c) => (d += c));
        r.on('end', () => res(JSON.parse(d)));
      }).on('error', rej);
    });

    const target = raw.find((t) => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    ws.onopen = async () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));

      await wait(3500);

      ws.send(JSON.stringify({
        id: 3,
        method: 'Runtime.evaluate',
        params: {
          expression: `JSON.stringify({
            innerHTML: document.getElementById('root')?.innerHTML || '',
            text: document.body.innerText
          })`
        }
      }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === 3) {
        const val = JSON.parse(msg.result.result.value);
        console.log('INNER HTML LENGTH:', val.innerHTML.length);
        console.log('PAGE TEXT (FIRST 300 CHARS):', val.text.substring(0, 300));
        ws.close();
        proc.kill();
        process.exit(0);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION:', JSON.stringify(msg.params.exceptionDetails, null, 2));
      }
    };
  } catch (e) {
    console.error('Error:', e);
    proc.kill();
    process.exit(1);
  }
}

run();
