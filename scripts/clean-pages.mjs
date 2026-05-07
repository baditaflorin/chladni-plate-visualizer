import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const generated = [
  'docs/assets',
  'docs/index.html',
  'docs/404.html',
  'docs/sw.js',
  'docs/icon.svg',
  'docs/manifest.webmanifest',
  'docs/version.json',
];

for (const path of generated) {
  rmSync(resolve(path), { recursive: true, force: true });
}
