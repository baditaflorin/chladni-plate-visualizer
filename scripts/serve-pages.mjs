import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const port = Number(process.env.PORT ?? 4173);
const base = '/chladni-plate-visualizer/';
const root = resolve('docs');

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
  if (pathname === '/') {
    pathname = base;
  }
  if (pathname.startsWith(base)) {
    pathname = pathname.slice(base.length);
  }
  const target = normalize(join(root, pathname));
  if (!target.startsWith(root)) {
    return resolve(root, '404.html');
  }
  if (!existsSync(target)) {
    return resolve(root, 'index.html');
  }
  if (statSync(target).isDirectory()) {
    return resolve(target, 'index.html');
  }
  return target;
}

const server = createServer((req, res) => {
  const file = resolvePath(req.url);
  const type = types[extname(file)] ?? 'application/octet-stream';
  res.writeHead(existsSync(file) ? 200 : 404, { 'content-type': type });
  createReadStream(file).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}${base}`);
});
