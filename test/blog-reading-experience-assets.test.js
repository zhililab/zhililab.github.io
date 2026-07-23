'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(projectRoot, file), 'utf8');
}

function stat(file) {
  return fs.statSync(path.join(projectRoot, file));
}

test('CSS contains required desktop breakpoints and reduced-motion fallback', () => {
  const css = read('source/css/blog-reading-experience.css');

  assert.match(css, /min-width:\s*992px/);
  assert.match(css, /min-width:\s*1200px/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('CSS contains scoped table overflow and mobile pet hiding', () => {
  const css = read('source/css/blog-reading-experience.css');

  assert.match(css, /\.blog-post-enhanced[\s\S]*\.table-scroll/);
  assert.match(css, /max-width:\s*991\.98px[\s\S]*#blog-pet[\s\S]*display:\s*none/);
});

test('CSS gives the post and sidebar the specified responsive widths', () => {
  const css = read('source/css/blog-reading-experience.css');

  assert.match(css, /75%/);
  assert.match(css, /25%/);
  assert.match(css, /83\.333333%/);
  assert.match(css, /16\.666667%/);
});

test('CSS contains print-safe table and pet behavior', () => {
  const css = read('source/css/blog-reading-experience.css');

  assert.match(css, /@media print/);
  assert.match(css, /@media print[\s\S]*#blog-pet[\s\S]*display:\s*none/);
  assert.match(css, /@media print[\s\S]*\.table-scroll[\s\S]*overflow:\s*visible/);
});

test('added production assets stay below 30 KB uncompressed', () => {
  const files = [
    'scripts/blog-reading-experience.js',
    'source/js/blog-reading-experience.js',
    'source/css/blog-reading-experience.css'
  ];
  const bytes = files.reduce((sum, file) => sum + stat(file).size, 0);

  assert.ok(bytes < 30 * 1024, `enhancement assets are ${bytes} bytes`);
});
