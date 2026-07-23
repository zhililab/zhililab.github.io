#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(process.env.BLOG_PUBLIC_DIR || 'public');
const port = Number(process.env.BLOG_PORT || 4018);
const compressible = new Set(['.css', '.html', '.js', '.json', '.svg', '.xml']);
const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8']
]);

function resolveRequest(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const filePath = path.resolve(root, relative.replace(/^\/+/, ''));
  if (!filePath.startsWith(`${root}${path.sep}`)) return null;
  return filePath;
}

const server = http.createServer((request, response) => {
  const filePath = resolveRequest(request.url);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const headers = {
    'cache-control': 'no-store',
    'content-type': contentTypes.get(extension) || 'application/octet-stream',
    vary: 'Accept-Encoding'
  };
  const source = fs.createReadStream(filePath);
  if (
    compressible.has(extension)
    && /\bgzip\b/.test(request.headers['accept-encoding'] || '')
  ) {
    headers['content-encoding'] = 'gzip';
    response.writeHead(200, headers);
    source.pipe(zlib.createGzip({ level: 6 })).pipe(response);
    return;
  }

  headers['content-length'] = fs.statSync(filePath).size;
  response.writeHead(200, headers);
  source.pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});
