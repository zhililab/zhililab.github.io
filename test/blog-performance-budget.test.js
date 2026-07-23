'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const publicRoot = path.resolve(
  process.env.BLOG_PUBLIC_DIR || path.join(__dirname, '..', 'public')
);

function stat(relativePath) {
  return fs.statSync(path.join(publicRoot, relativePath));
}

test('Kubernetes responsive variants exist within transfer budgets', () => {
  const base = 'assets/images/optimized/posts/kubernetes-pod-creation-sequence-diagram';
  const budgets = new Map([
    [`${base}-640.webp`, 100 * 1024],
    [`${base}-960.webp`, 180 * 1024],
    [`${base}-1440.webp`, 300 * 1024]
  ]);

  for (const [file, maxBytes] of budgets) {
    const bytes = stat(file).size;
    assert.ok(bytes > 0, `${file} must not be empty`);
    assert.ok(bytes <= maxBytes, `${file} is ${bytes} bytes; budget is ${maxBytes}`);
  }
});

test('same-origin post dependencies and icon fonts are emitted', () => {
  const files = [
    'vendor/blog/bootstrap.min.css',
    'vendor/blog/github-markdown.min.css',
    'vendor/blog/hint.min.css',
    'vendor/blog/jquery.fancybox.min.css',
    'vendor/blog/fluid-icons.css',
    'vendor/blog/site-icons.css',
    'vendor/blog/fluid-icons.woff2',
    'vendor/blog/site-icons.woff2',
    'vendor/blog/jquery.min.js',
    'vendor/blog/bootstrap.min.js',
    'vendor/blog/tocbot.min.js',
    'vendor/blog/anchor.min.js',
    'vendor/blog/clipboard.min.js',
    'vendor/blog/jquery.fancybox.min.js'
  ];

  for (const file of files) {
    assert.ok(stat(file).size > 0, `${file} must exist and contain data`);
  }
});
