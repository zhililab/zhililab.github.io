'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const publicRoot = path.resolve(
  process.env.BLOG_PUBLIC_DIR || path.join(__dirname, '..', 'public')
);
const articlePath = path.join(
  publicRoot,
  '2026',
  '07',
  '22',
  '2026-07-22-agentic-devops-practice-report',
  'index.html'
);

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

test('rendered article contains one complete enhancement injection', () => {
  const html = read(articlePath);

  assert.equal((html.match(/blog-post-enhanced/g) || []).length, 1);
  assert.equal((html.match(/blog-reading-experience\.css/g) || []).length, 1);
  assert.equal((html.match(/blog-reading-experience\.js/g) || []).length, 1);
  assert.equal((html.match(/id="blog-pet"/g) || []).length, 1);
  assert.equal((html.match(/data-blog-reading-experience/g) || []).length, 3);
  assert.doesNotMatch(html, /typed\.min\.js/);
  assert.match(html, /可复现项目清单/);
  assert.match(html, /发布守门 Agent/);
});

test('rendered enhancement assets exist and remain compact', () => {
  const css = path.join(publicRoot, 'css', 'blog-reading-experience.css');
  const js = path.join(publicRoot, 'js', 'blog-reading-experience.js');

  assert.ok(fs.statSync(css).size > 0);
  assert.ok(fs.statSync(js).size > 0);
  assert.ok(fs.statSync(css).size + fs.statSync(js).size < 20 * 1024);
});

test('rendered home page does not contain the post pet', () => {
  const html = read(path.join(publicRoot, 'index.html'));

  assert.doesNotMatch(html, /id="blog-pet"/);
  assert.doesNotMatch(html, /blog-post-enhanced/);
});
