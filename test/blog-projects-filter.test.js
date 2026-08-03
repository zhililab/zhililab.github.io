'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  enhanceProjectsHtml,
  isProjectsPage,
  register
} = require('../scripts/blog-projects');

test('recognizes the exact projects routes and rejects near matches', () => {
  assert.equal(isProjectsPage({ page: { path: 'projects/index.html' } }), true);
  assert.equal(isProjectsPage({ path: '/projects/' }), true);
  assert.equal(isProjectsPage({ path: 'projects' }), true);
  assert.equal(isProjectsPage({ path: 'projects/index.html?preview=1#casebook' }), true);
  assert.equal(isProjectsPage({ page: { path: 'projects/index.htm' } }), false);
  assert.equal(isProjectsPage({ page: { path: 'about/index.html' } }), false);
});

test('injects project assets and body class exactly once', () => {
  const input = '<html><head></head><body class="page-body"><main></main></body></html>';
  const data = { page: { path: 'projects/index.html' } };
  const output = enhanceProjectsHtml(input, data);

  assert.match(output, /class="page-body builder-projects-page"/);
  assert.equal((output.match(/blog-projects\.css/g) || []).length, 1);
  assert.equal((output.match(/blog-projects\.js/g) || []).length, 1);
  assert.match(output, /<script src="\/js\/blog-projects\.js" defer data-builder-projects>/);
  assert.equal(enhanceProjectsHtml(output, data), output);
});

test('adds the page class to the actual body class attribute only', () => {
  const input = '<html><head></head><body id="projects" data-class="preview" class=\'page-body\'><main></main></body></html>';
  const output = enhanceProjectsHtml(input, { page: { path: 'projects/index.html' } });

  assert.match(output, /<body id="projects" data-class="preview" class='page-body builder-projects-page'>/);
  assert.equal((output.match(/builder-projects-page/g) || []).length, 1);
});

test('does not touch non-project routes', () => {
  const input = '<html><head></head><body><main></main></body></html>';
  assert.equal(
    enhanceProjectsHtml(input, { page: { path: 'about/index.html' } }),
    input
  );
});

test('registers one final HTML filter', () => {
  const calls = [];
  register({
    extend: {
      filter: { register: (name, fn) => calls.push({ name, fn }) }
    }
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'after_render:html');
});
