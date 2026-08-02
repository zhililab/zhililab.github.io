const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('public site configuration uses the production identity', () => {
  const config = read('_config.yml');

  assert.match(config, /^url:\s+https:\/\/www\.zhililab\.cn\s*$/m);
  assert.match(config, /^author:\s+Walker\s*$/m);
  assert.doesNotMatch(config, /clientSecret\s*:/i);
  assert.doesNotMatch(config, /password_hash\s*:/i);
  assert.doesNotMatch(config, /^gitTalk\s*:/m);
  assert.doesNotMatch(config, /^hexo_admin\s*:/m);
});

test('Fluid override presents the Walker Reading Desk navigation', () => {
  const fluid = read('_config.fluid.yml');

  assert.match(fluid, /blog_title:\s*["']?Walker["']?/);
  assert.match(fluid, /把实践写成可复用的系统/);
  assert.match(fluid, /\/projects\//);
  assert.match(fluid, /Walker · Content as Code/);
});
