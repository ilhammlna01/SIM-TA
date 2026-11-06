import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tempDir = path.join(os.tmpdir(), `edge_shot_${Date.now()}`);
const artifactDir = 'C:\\Users\\Ilham Maulana\\.gemini\\antigravity-ide\\brain\\9d4418d1-d12b-4653-be42-baaa1b959132\\screenshots';

if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

const proc = spawn(EDGE_PATH, [
  '--headless=new',
  '--remote-debugging-port=9356',
  `--user-data-dir=${tempDir}`,
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=1440,900',
  'http://localhost:5173/'
]);

async function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  await wait(2500);
  try {
    const raw = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9356/json', (r) => {
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

    await wait(2000);

    const shotId = send('Page.captureScreenshot', { format: 'png' });

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === shotId) {
        const buf = Buffer.from(msg.result.data, 'base64');
        const outPath = path.join(artifactDir, 'root_page_verified.png');
        fs.writeFileSync(outPath, buf);
        console.log('Saved screenshot to:', outPath);
        ws.close();
        proc.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error('Screenshot error:', err);
    proc.kill();
    process.exit(1);
  }
}

run();
