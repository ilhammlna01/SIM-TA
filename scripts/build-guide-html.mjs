/**
 * build-guide-html.mjs
 * ------------------------------------------------------------------
 * Mengubah docs/pedoman-penggunaan/PEDOMAN-PENGGUNAAN.md menjadi versi
 * HTML siap cetak/ekspor PDF: docs/pedoman-penggunaan/PEDOMAN-PENGGUNAAN.html
 *
 * Sekaligus memvalidasi bahwa seluruh tautan gambar valid (tidak ada
 * gambar rusak) dan tidak ada berkas gambar yang tidak dirujuk.
 *
 * Jalankan:  node scripts/build-guide-html.mjs
 * ------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DOC_DIR = path.join(ROOT, 'docs', 'pedoman-penggunaan');
const MD_PATH = path.join(DOC_DIR, 'PEDOMAN-PENGGUNAAN.md');
const HTML_PATH = path.join(DOC_DIR, 'PEDOMAN-PENGGUNAAN.html');
const PDF_PATH = path.join(DOC_DIR, 'PEDOMAN-PENGGUNAAN.pdf');
const IMG_DIR = path.join(DOC_DIR, 'img');

const md = fs.readFileSync(MD_PATH, 'utf8');

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(text) {
  let out = esc(text);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) => `<img src="${src}" alt="${alt}">`);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

function slug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const lines = md.split(/\r?\n/);
const html = [];
let i = 0;
let inList = null; // 'ul' | 'ol'

const closeList = () => {
  if (inList) {
    html.push(`</${inList}>`);
    inList = null;
  }
};

while (i < lines.length) {
  const line = lines[i];

  // Fenced code block
  const fence = line.match(/^```(\w*)\s*$/);
  if (fence) {
    closeList();
    const lang = fence[1] || '';
    const buf = [];
    i++;
    while (i < lines.length && !/^```\s*$/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    i++;
    const body = esc(buf.join('\n'));
    if (lang === 'mermaid') {
      html.push(`<div class="mermaid-wrap"><pre class="mermaid">${body}</pre></div>`);
    } else {
      html.push(`<pre class="code"><code>${body}</code></pre>`);
    }
    continue;
  }

  // Table
  if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
    closeList();
    const parseRow = (l) =>
      l
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());
    const header = parseRow(line);
    i += 2;
    const rows = [];
    while (i < lines.length && /^\s*\|/.test(lines[i])) {
      rows.push(parseRow(lines[i]));
      i++;
    }
    html.push('<table>');
    html.push('<thead><tr>' + header.map((h) => `<th>${inline(h)}</th>`).join('') + '</tr></thead>');
    html.push('<tbody>');
    for (const r of rows) {
      html.push('<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>');
    }
    html.push('</tbody></table>');
    continue;
  }

  // Horizontal rule
  if (/^---+\s*$/.test(line)) {
    closeList();
    html.push('<hr>');
    i++;
    continue;
  }

  // Heading
  const h = line.match(/^(#{1,6})\s+(.*)$/);
  if (h) {
    closeList();
    const level = h[1].length;
    const text = h[2].trim();
    html.push(`<h${level} id="${slug(text)}">${inline(text)}</h${level}>`);
    i++;
    continue;
  }

  // Blockquote
  if (/^>\s?/.test(line)) {
    closeList();
    const buf = [];
    while (i < lines.length && /^>\s?/.test(lines[i])) {
      buf.push(lines[i].replace(/^>\s?/, ''));
      i++;
    }
    html.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`);
    continue;
  }

  // Unordered list
  if (/^\s*-\s+/.test(line)) {
    if (inList !== 'ul') {
      closeList();
      html.push('<ul>');
      inList = 'ul';
    }
    html.push(`<li>${inline(line.replace(/^\s*-\s+/, ''))}</li>`);
    i++;
    continue;
  }

  // Ordered list
  if (/^\s*\d+\.\s+/.test(line)) {
    if (inList !== 'ol') {
      closeList();
      html.push('<ol>');
      inList = 'ol';
    }
    html.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
    i++;
    continue;
  }

  // Blank
  if (/^\s*$/.test(line)) {
    closeList();
    i++;
    continue;
  }

  // Paragraph
  closeList();
  html.push(`<p>${inline(line.trim())}</p>`);
  i++;
}
closeList();

const bodyHtml = html.join('\n');

const doc = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pedoman Penggunaan SIM-TA FEB UTM</title>
<style>
  :root { --ink:#0B192C; --muted:#4A5568; --line:#cbd5e1; --accent:#B8860B; }
  * { box-sizing: border-box; }
  body { margin:0; color:var(--ink); background:#fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    font-size: 13px; line-height: 1.6; }
  .sheet { max-width: 1000px; margin: 0 auto; padding: 28px 34px 60px; }
  h1 { font-size: 24px; border-bottom: 3px solid var(--accent); padding-bottom: 8px; margin-top: 34px; }
  h2 { font-size: 19px; margin-top: 30px; border-bottom: 1px solid var(--line); padding-bottom: 5px; page-break-after: avoid; }
  h3 { font-size: 16px; margin-top: 22px; page-break-after: avoid; }
  h4 { font-size: 14px; margin-top: 18px; page-break-after: avoid; }
  p, li { color: #1f2937; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0 18px; page-break-inside: auto; }
  th, td { border: 1px solid var(--line); padding: 6px 9px; text-align: left; vertical-align: top; font-size: 12px; }
  th { background: #f1f5f9; font-weight: 700; }
  tr { page-break-inside: avoid; }
  code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-size: 12px; }
  pre.code { background:#0f172a; color:#e2e8f0; padding:12px 14px; border-radius:6px; overflow:auto; font-size:12px; }
  blockquote { margin: 12px 0; padding: 10px 14px; background:#fffbeb; border-left: 4px solid var(--accent); color:#4b3a08; }
  img { display:block; max-width:100%; height:auto; margin: 10px auto 4px; border:1px solid var(--line); border-radius:6px;
        page-break-inside: avoid; }
  hr { border:none; border-top:1px solid var(--line); margin: 26px 0; }
  a { color:#1d4ed8; text-decoration:none; }
  .mermaid-wrap { border:1px solid var(--line); border-radius:6px; padding:12px; margin:14px 0; background:#fafafa; page-break-inside: avoid; }
  .mermaid { margin:0; white-space: pre-wrap; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; }
  .mermaid svg { max-width: 100%; height: auto; display:block; margin: 0 auto; }
  @media print {
    body { font-size: 11.5px; }
    .sheet { max-width: none; padding: 0; }
    h1 { page-break-before: always; }
    h1:first-of-type { page-break-before: avoid; }
    img { page-break-inside: avoid; page-break-after: avoid; }
    table { page-break-inside: auto; }
    @page { size: A4; margin: 16mm 14mm; }
  }
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head>
<body>
<div class="sheet">
${bodyHtml}
</div>
<script>
  if (window.mermaid) {
    try { mermaid.initialize({ startOnLoad: true, theme: 'neutral', flowchart: { htmlLabels: true } }); } catch (e) {}
  }
</script>
</body>
</html>
`;

fs.writeFileSync(HTML_PATH, doc, 'utf8');

/* --------------------------- Validasi gambar --------------------------- */
const imgRefs = Array.from(md.matchAll(/!\[[^\]]*\]\((img\/[^)]+)\)/g)).map((m) => m[1]);
const uniqueRefs = Array.from(new Set(imgRefs));
const onDisk = fs.existsSync(IMG_DIR)
  ? fs.readdirSync(IMG_DIR).filter((f) => f.toLowerCase().endsWith('.png')).sort()
  : [];

const missing = uniqueRefs.filter((r) => !fs.existsSync(path.join(DOC_DIR, r)));
const referencedNames = new Set(uniqueRefs.map((r) => path.basename(r)));
const unreferenced = onDisk.filter((f) => !referencedNames.has(f));

console.log('HTML ditulis :', path.relative(ROOT, HTML_PATH));
console.log('Total gambar dirujuk :', uniqueRefs.length);
console.log('Total gambar di disk  :', onDisk.length);
console.log('Gambar rusak (missing):', missing.length, missing);
console.log('Gambar tak dirujuk    :', unreferenced.length, unreferenced);

/* ---------------------- Ekspor PDF (opsional) ------------------------- */
async function exportPdf() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.log('PDF: Playwright tidak terpasang, ekspor PDF dilewati.');
    return;
  }
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('file:///' + HTML_PATH.replace(/\\/g, '/'), { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1500);

  // Tunggu seluruh diagram Mermaid selesai dirender menjadi SVG sebelum mencetak PDF.
  const mermaidBlocks = await page.locator('pre.mermaid').count();
  if (mermaidBlocks > 0) {
    await page
      .waitForFunction(
        () => {
          const blocks = Array.from(document.querySelectorAll('pre.mermaid'));
          return blocks.length > 0 && blocks.every((b) => b.querySelector('svg'));
        },
        null,
        { timeout: 30000 }
      )
      .catch(() => console.warn('Peringatan: sebagian diagram Mermaid belum selesai dirender.'));
  }

  const badImages = await page.evaluate(
    () => Array.from(document.images).filter((img) => !(img.complete && img.naturalWidth > 0)).length
  );
  const renderedDiagrams = await page.evaluate(
    () => Array.from(document.querySelectorAll('pre.mermaid')).filter((b) => b.querySelector('svg')).length
  );
  await page.pdf({
    path: PDF_PATH,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' }
  });
  await browser.close();
  console.log(
    'PDF ditulis  :',
    path.relative(ROOT, PDF_PATH),
    '| gambar gagal dimuat:',
    badImages,
    '| diagram dirender:',
    renderedDiagrams + '/' + mermaidBlocks
  );
}

await exportPdf().catch((e) => console.warn('PDF gagal dibuat:', e.message));

if (missing.length > 0) process.exitCode = 1;
