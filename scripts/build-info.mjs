import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

function git(args, fallback) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return fallback;
  }
}

const commit = git(['rev-parse', '--short=12', 'HEAD'], 'dev');
const fullCommit = git(['rev-parse', 'HEAD'], 'dev');
const build = {
  schemaVersion: 1,
  version: pkg.version,
  commit,
  fullCommit,
  builtAt: new Date().toISOString(),
  repositoryUrl:
    process.env.VITE_REPOSITORY_URL ?? 'https://github.com/baditaflorin/chladni-plate-visualizer',
  paypalUrl: process.env.VITE_PAYPAL_URL ?? 'https://www.paypal.com/paypalme/florinbadita',
  pagesUrl: 'https://baditaflorin.github.io/chladni-plate-visualizer/',
};

mkdirSync(resolve(root, 'src/generated'), { recursive: true });
writeFileSync(
  resolve(root, 'src/generated/build-info.ts'),
  `export const buildInfo = ${JSON.stringify(build, null, 2)} as const;\n`,
);
writeFileSync(resolve(root, 'docs/version.json'), `${JSON.stringify(build, null, 2)}\n`);
