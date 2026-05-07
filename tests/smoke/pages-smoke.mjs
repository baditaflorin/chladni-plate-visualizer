import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { PNG } from 'pngjs';

const root = resolve('docs');
const results = resolve('test-results');
const base = '/chladni-plate-visualizer/';
const port = 4183;
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
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
    'content-type': types[extname(file)] ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(res);
});

await new Promise((resolveListen) => server.listen(port, '127.0.0.1', resolveListen));
mkdirSync(results, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  await exerciseViewport({ width: 1280, height: 820 }, 'desktop');
  await exerciseViewport({ width: 390, height: 844 }, 'mobile');
} finally {
  await browser.close();
  server.close();
}

async function exerciseViewport(viewport, name) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  page.on('console', (entry) => {
    if (entry.type() === 'error') {
      consoleErrors.push(entry.text());
    }
  });

  await page.goto(`http://127.0.0.1:${port}${base}`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /chladni plate/i }).waitFor();
  await page.getByRole('button', { name: /start/i }).click();
  const canvas = page.getByTestId('visualizer-canvas');
  await canvas.waitFor();
  await page.waitForTimeout(1200);
  await page.getByRole('spinbutton', { name: 'Frequency' }).fill('432');
  await page.getByText(/v0\.1\.0/i).waitFor();

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 2,
  );
  if (hasOverflow) {
    throw new Error(`${name} viewport has horizontal overflow.`);
  }

  const screenshot = await canvas.screenshot({
    path: join(results, `smoke-${name}.png`),
  });
  assertNonBlank(screenshot, name);

  if (consoleErrors.length > 0) {
    throw new Error(`Unexpected console errors in ${name}:\n${consoleErrors.join('\n')}`);
  }
  await page.close();
}

function assertNonBlank(buffer, name) {
  const image = PNG.sync.read(buffer);
  const colors = new Set();
  let brightPixels = 0;
  for (let offset = 0; offset < image.data.length; offset += 4 * 97) {
    const r = image.data[offset];
    const g = image.data[offset + 1];
    const b = image.data[offset + 2];
    colors.add(`${r}:${g}:${b}`);
    if (r + g + b > 90) {
      brightPixels += 1;
    }
  }
  if (colors.size < 8 || brightPixels < 10) {
    throw new Error(`${name} canvas screenshot appears blank.`);
  }
}
