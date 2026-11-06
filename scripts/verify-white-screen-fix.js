import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tempDir = path.join(os.tmpdir(), `edge_verify_fix_${Date.now()}`);

const proc = spawn(EDGE_PATH, [
  '--headless=new',
  '--remote-debugging-port=9348',
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
      http.get('http://127.0.0.1:9348/json', (r) => {
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

    const consoleLogs = [];
    const runtimeErrors = [];

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        consoleLogs.push(text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        runtimeErrors.push(msg.params.exceptionDetails);
      }
    };

    ws.onopen = async () => {
      send('Page.enable');
      send('Runtime.enable');
      send('Log.enable');

      // Navigate to root http://localhost:5173/
      send('Page.navigate', { url: 'http://localhost:5173/' });
    };

    await wait(3500);

    // Evaluate root DOM
    const result1 = await new Promise((resolve) => {
      const evalId = send('Runtime.evaluate', {
        expression: `JSON.stringify({
          url: window.location.href,
          title: document.title,
          rootLength: document.getElementById('root')?.innerHTML?.length || 0,
          hasH1: !!document.querySelector('h1'),
          h1Text: document.querySelector('h1')?.innerText || '',
          bodyTextSnippet: document.body.innerText.substring(0, 200).replace(/\\n/g, ' ')
        })`
      });

      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === evalId) {
          ws.removeEventListener('message', handler);
          resolve(JSON.parse(msg.result?.result?.value || '{}'));
        }
      };
      ws.addEventListener('message', handler);
    });

    console.log('--- TEST 1: ROOT URL (NO SESSION) ---');
    console.log(result1);
    console.log('Runtime Errors:', runtimeErrors.length);

    // TEST 2: Set auth session in localStorage and reload to test authenticated root render
    await new Promise((resolve) => {
      const evalId = send('Runtime.evaluate', {
        expression: `
          window.localStorage.setItem('sim_ta_feb_utm_auth_session', JSON.stringify({
            id: 'usr-admin-1',
            nomorInduk: '198104122008121002',
            nama: 'Ahmad Fauzi, S.Kom., M.T.',
            role: 'admin',
            jenjang: 'S1',
            prodi: 'Subbag Pascasarjana & Akademik'
          }));
          window.localStorage.setItem('sim_ta_feb_utm_current_role', 'admin');
          window.localStorage.setItem('sim_ta_feb_utm_active_nav', 'dashboard');
          location.reload();
          true;
        `
      });
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === evalId) {
          ws.removeEventListener('message', handler);
          resolve();
        }
      };
      ws.addEventListener('message', handler);
    });

    await wait(3500);

    const result2 = await new Promise((resolve) => {
      const evalId = send('Runtime.evaluate', {
        expression: `JSON.stringify({
          url: window.location.href,
          title: document.title,
          rootLength: document.getElementById('root')?.innerHTML?.length || 0,
          hasH1: !!document.querySelector('h1'),
          h1Text: document.querySelector('h1')?.innerText || '',
          bodyTextSnippet: document.body.innerText.substring(0, 200).replace(/\\n/g, ' ')
        })`
      });

      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === evalId) {
          ws.removeEventListener('message', handler);
          resolve(JSON.parse(msg.result?.result?.value || '{}'));
        }
      };
      ws.addEventListener('message', handler);
    });

    console.log('--- TEST 2: ROOT URL (WITH ADMIN SESSION) ---');
    console.log(result2);
    console.log('Total Runtime Errors across tests:', runtimeErrors.length);

    ws.close();
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    proc.kill();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    process.exit(0);
  }
}

run();
