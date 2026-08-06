'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('source declares the apex domain as the canonical origin', () => {
  assert.match(read('_config.yml'), /^url: https:\/\/zhililab\.cn$/m);
  assert.equal(read('source/CNAME').trim(), 'zhililab.cn');
  assert.match(
    read('source/privacy/index.md'),
    /\[zhililab\.cn\]\(https:\/\/zhililab\.cn\/\)/
  );
});

test('source publishes crawler discovery files', () => {
  assert.ok(
    fs.existsSync(path.join(root, 'source/robots.txt')),
    'source/robots.txt must exist'
  );
  const robots = read('source/robots.txt');
  const pkg = JSON.parse(read('package.json'));

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(
    robots,
    /^Sitemap: https:\/\/zhililab\.cn\/sitemap\.xml$/m
  );
  assert.equal(pkg.dependencies['hexo-generator-sitemap'], '3.0.1');
});
