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

test('wide tables use a bounded readable canvas instead of intrinsic max-content width', () => {
  const css = read('source/css/blog-reading-experience.css');
  const tableRule = css.match(/\.markdown-body \.table-scroll > table\s*\{([^}]*)\}/);
  const cellRule = css.match(/\.table-scroll td\s*\{([^}]*)\}/);

  assert.ok(tableRule, 'missing scroll table rule');
  assert.ok(cellRule, 'missing table cell rule');
  assert.match(tableRule[1], /width:\s*100%/);
  assert.doesNotMatch(tableRule[1], /max-content/);
  assert.match(cellRule[1], /overflow-wrap:\s*anywhere/);
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

test('pet animation keeps the clickable button stationary', () => {
  const css = read('source/css/blog-reading-experience.css');
  const buttonRule = css.match(/#blog-pet\s*\{([^}]*)\}/);
  const robotRule = css.match(/\.blog-pet__robot\s*\{([^}]*)\}/);

  assert.ok(buttonRule, 'missing #blog-pet rule');
  assert.ok(robotRule, 'missing .blog-pet__robot rule');
  assert.doesNotMatch(buttonRule[1], /animation:/);
  assert.match(robotRule[1], /animation:\s*blog-pet-idle/);
});

test('pet uses a compact size at the narrow desktop breakpoint', () => {
  const css = read('source/css/blog-reading-experience.css');

  assert.match(
    css,
    /@media \(min-width:\s*992px\) and \(max-width:\s*1199\.98px\)[\s\S]*#blog-pet[\s\S]*width:\s*3\.25rem/
  );
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
