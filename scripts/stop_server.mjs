import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const PID_FILE = path.resolve('.server.pid');
const ROOT = path.resolve('.');

if (!fs.existsSync(PID_FILE)) {
  console.log('Tidak ada server detached yang tercatat.');
  process.exit(0);
}

const pid = Number(fs.readFileSync(PID_FILE, 'utf8').trim());
if (!pid) {
  console.log('PID tidak valid.');
  process.exit(0);
}

// Verifikasi proses adalah node.exe (berkas PID ditulis oleh skrip kita sendiri,
// sehingga relatif aman; verifikasi nama proses mencegah Manufacturer salah).
let executable = '';
let cmdline = '';
try {
  cmdline = execFileSync(
    'powershell.exe',
    ['-NoProfile', '-Command', `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").CommandLine`],
    { encoding: 'utf8' }
  ).trim();
  executable = execFileSync(
    'powershell.exe',
    ['-NoProfile', '-Command', `(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).ProcessName`],
    { encoding: 'utf8' }
  ).trim();
} catch (_) {
  // ignore
}

if (executable && executable.toLowerCase() !== 'node') {
  console.log(`PID ${pid} bukan proses node (${executable}) — tidak dihentikan.`);
  process.exit(0);
}

const cocokRepo =
  !cmdline ||
  cmdline.includes('server/index.js') ||
  cmdline.includes('server\\index.js');

if (!cocokRepo) {
  console.log(`PID ${pid} bukan server SIM-TA repositori ini — tidak dihentikan.`);
  console.log(`  CommandLine: ${cmdline}`);
  process.exit(0);
}

try {
  process.kill(pid, 'SIGTERM');
  console.log(`Sinyal SIGTERM dikirim ke PID ${pid}.`);
} catch (err) {
  console.log(`Tidak dapat menghentikan PID ${pid}: ${err.message}`);
}

try { fs.unlinkSync(PID_FILE); } catch (_) {}
