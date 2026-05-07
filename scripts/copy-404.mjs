import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const index = resolve('docs/index.html');
const fallback = resolve('docs/404.html');

if (existsSync(index)) {
  copyFileSync(index, fallback);
}
