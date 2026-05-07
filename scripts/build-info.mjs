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

const fullCommit = git(
  ['log', '--format=%H', '--invert-grep', '--grep', '^ops: publish pages build$', '-n', '1'],
  git(['rev-parse', 'HEAD'], 'dev'),
);
const commit = fullCommit === 'dev' ? 'dev' : fullCommit.slice(0, 12);
const builtAt =
  fullCommit === 'dev'
    ? new Date().toISOString()
    : git(['show', '-s', '--format=%cI', fullCommit], new Date().toISOString());
const build = {
  schemaVersion: 1,
  version: pkg.version,
  commit,
  fullCommit,
  builtAt,
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
