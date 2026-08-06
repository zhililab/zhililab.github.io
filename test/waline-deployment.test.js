'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('Waline stays internal and persists SQLite data', () => {
  const compose = read('ops/waline/docker-compose.yml');

  assert.match(compose, /lizheming\/waline:1\.41\.3/);
  assert.match(compose, /SQLITE_PATH:\s*\/app\/data/);
  assert.match(compose, /SITE_URL:\s*https:\/\/zhililab\.cn/);
  assert.match(compose, /\.\/data:\/app\/data/);
  assert.doesNotMatch(compose, /8360:8360/);
});

test('Caddy owns HTTPS only and proxies the comment hostname', () => {
  const compose = read('ops/waline/docker-compose.yml');
  const caddyfile = read('ops/waline/Caddyfile');

  assert.match(compose, /["']443:443["']/);
  assert.doesNotMatch(compose, /["']80:80["']/);
  assert.match(caddyfile, /comments\.zhililab\.cn/);
  assert.match(caddyfile, /reverse_proxy waline:8360/);
});

test('deployment example contains no production secret', () => {
  const envExample = read('ops/waline/.env.example');

  assert.match(envExample, /^JWT_TOKEN=development-only-/m);
  assert.doesNotMatch(envExample, /^[A-Fa-f0-9]{64}$/m);
});

test('SQLite bootstrap downloads and verifies the official schema template', () => {
  const bootstrap = read('ops/waline/init-sqlite.sh');

  assert.match(bootstrap, /assets\/waline\.sqlite/);
  assert.match(
    bootstrap,
    /ac08959a80b2756701742d97ad445fab24597428b3bc56e0c87541c4ea8b1b37/
  );
  assert.match(bootstrap, /sha256sum/);
  assert.match(bootstrap, /waline\.sqlite/);
  assert.doesNotMatch(bootstrap, /rm\s+-rf/);
});
