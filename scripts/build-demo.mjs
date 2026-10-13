// Builds a single self-contained HTML page (CSS + JS inlined) for hosting the
// live demo as a Claude Artifact. Printing is disabled because the artifact
// viewer blocks window.print().
//
//   npm run build:demo   ->   dist-demo/gains-demo.html
import { build } from 'vite';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = 'dist-demo/.build';
process.env.VITE_DISABLE_PRINT = '1';
await build({ build: { outDir, emptyOutDir: true }, logLevel: 'warn' });

const assets = join(outDir, 'assets');
const files = readdirSync(assets);
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const html = readFileSync(join(outDir, 'index.html'), 'utf8');

const keepHead = [...html.matchAll(/<(title|link)\b[^>]*>(?:[^<]*<\/title>)?/g)]
  .map((m) => m[0])
  .filter((tag) => !/assets\//.test(tag));

const page = [
  ...keepHead,
  `<style>html,body{background:#f1f5f9;color:#0f172a}</style>`,
  `<style>${css}</style>`,
  `<div id="root"></div>`,
  `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`,
].join('\n');

mkdirSync('dist-demo', { recursive: true });
writeFileSync('dist-demo/gains-demo.html', page);
console.log(`dist-demo/gains-demo.html  ${(page.length / 1024).toFixed(1)} kB`);
