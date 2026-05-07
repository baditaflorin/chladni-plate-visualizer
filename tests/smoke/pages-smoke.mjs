import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('docs');
const base = '/chladni-plate-visualizer/';
const port = 4183;
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json'
};

function resolvePath(url) {
  const parsed = new URL(url ?? '/', `http://127.0.0.1:${port}`);
  let pathname = parsed.pathname;
  if (pathname === '/') pathname = base;
  if (pathname.startsWith(base)) pathname = pathname.slice(base.length);
  const target = normalize(join(root, pathname));
  if (!target.startsWith(root)) return resolve(root, '404.html');
  if (!existsSync(target)) return resolve(root, 'index.html');
  if (statSync(target).isDirectory()) return resolve(target, 'index.html');
  return target;
}

const server = createServer((req, res) => {
  const file = resolvePath(req.url);
  res.writeHead(existsSync(file) ? 200 : 404, {
    'content-type': types[extname(file)] ?? 'application/octet-stream'
  });
  createReadStream(file).pipe(res);
});

await new Promise((resolveListen) => server.listen(port, '127.0.0.1', resolveListen));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
const consoleErrors = [];
page.on('console', (entry) => {
  if (entry.type() === 'error') {
    consoleErrors.push(entry.text());
  }
});

try {
  await page.goto(`http://127.0.0.1:${port}${base}`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /chladni plate/i }).waitFor();
  await page.getByRole('button', { name: /start/i }).click();
  await page.getByTestId('visualizer-canvas').waitFor();
  await page.getByLabel(/frequency/i).fill('432');
  await page.getByText(/v0\.1\.0/i).waitFor();
  if (consoleErrors.length > 0) {
    throw new Error(`Unexpected console errors:\n${consoleErrors.join('\n')}`);
  }
} finally {
  await browser.close();
  server.close();
}
