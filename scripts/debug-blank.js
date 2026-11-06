import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tempDir = path.join(os.tmpdir(), `edge_blank_debug_${Date.now()}`);

const proc = spawn(EDGE_PATH, [
  '--headless=new',
  '--remote-debugging-port=9339',
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
      http.get('http://127.0.0.1:9339/json', (r) => {
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
    }

    ws.onopen = async () => {
      send('Page.enable');
      send('Runtime.enable');
      send('Log.enable');

      // Inject error catcher before navigation
      send('Page.addScriptToEvaluateOnNewDocument', {
        source: `
          window.__ERRORS = [];
          window.addEventListener('error', (e) => {
            window.__ERRORS.push({ type: 'error', message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno, error: e.error ? e.error.stack : null });
          });
          window.addEventListener('unhandledrejection', (e) => {
            window.__ERRORS.push({ type: 'unhandledrejection', reason: String(e.reason) });
          });
        `
      });

      send('Page.navigate', { url: 'http://localhost:5173/' });
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION THROWN:', msg.params.exceptionDetails);
      }
    };

    await wait(3500);

    send('Runtime.evaluate', {
      expression: `JSON.stringify({
        errors: window.__ERRORS,
        rootHtml: document.getElementById('root')?.innerHTML,
        bodyHtml: document.body.innerHTML
      })`
    });

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.result?.result?.value) {
        console.log('PAGE INSPECTION RESULT:', JSON.parse(msg.result.result.value));
      }
    };

    await wait(2000);
    ws.close();
  } catch (e) {
    console.error('Error:', e);
  } finally {
    proc.kill();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    process.exit(0);
  }
}

run();
