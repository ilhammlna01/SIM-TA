/**
 * Peluncur server terpisah (detached) untuk verifikasi lokal.
 *
 * Server dijalankan sebagai proses yang benar-benar independen dari shell
 * induk sehingga tetap hidup meski proses induk berakhir. Output ditulis ke
 * `server_runtime.log` untuk keperluan audit.
 *
 * Jalankan: node scripts/run_server_detached.mjs   lalu tutup dengan: node scripts/stop_server.mjs
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const LOG = path.resolve('server_runtime.log');
const PID_FILE = path.resolve('.server.pid');

const out = fs.openSync(LOG, 'w');
const child = spawn(process.execPath, ['server/index.js'], {
  stdio: ['ignore', out, out],
  detached: true,
  windowsHide: true
});

child.unref();
fs.writeFileSync(PID_FILE, String(child.pid));
console.log(`Server dijalankan pada PID ${child.pid} (detached). Log: ${LOG}`);

child.on('exit', (code, signal) => {
  fs.appendFileSync(LOG, `\n[LAUNCHER] Server berhenti. code=${code} signal=${signal}\n`);
});
