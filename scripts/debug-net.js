import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tempDir = path.join(os.tmpdir(), `edge_net_debug_${Date.now()}`);

const proc = spawn(EDGE_PATH, [
  '--headless=new',
  '--remote-debugging-port=9350',
  `--user-data-dir=${tempDir}`,
  '--disable-gpu',
  '--no-sandbox',
  'about:blank'
]);

async function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  await wait(1500);
  try {
    const raw = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9350/json', (r) => {
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

    const networkFails = [];
    const consoleEntries = [];

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.method === 'Network.loadingFailed') {
        networkFails.push(msg.params);
      }
      if (msg.method === 'Log.entryAdded') {
        consoleEntries.push(msg.params.entry);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        consoleEntries.push({
          type: msg.params.type,
          args: msg.params.args.map(a => a.value || a.description || '')
        });
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION DETAIL:', JSON.stringify(msg.params.exceptionDetails, null, 2));
      }
    };

    ws.onopen = async () => {
      send('Page.enable');
      send('Runtime.enable');
      send('Log.enable');
      send('Network.enable');

      send('Page.navigate', { url: 'http://localhost:5173/' });
    };

    await wait(4000);

    console.log('NETWORK FAILS:', networkFails);
    console.log('CONSOLE ENTRIES:', consoleEntries);

    const docHtml = await new Promise((resolve) => {
      const id = send('Runtime.evaluate', {
        expression: 'document.documentElement.outerHTML'
      });
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result?.result?.value);
        }
      };
      ws.addEventListener('message', handler);
    });

    console.log('DOC HTML LENGTH:', docHtml?.length);
    console.log('DOC HTML (FIRST 500 CHARS):', docHtml?.substring(0, 500));

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    proc.kill();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    process.exit(0);
  }
}

run();
