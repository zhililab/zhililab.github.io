'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  enhancePostHtml,
  register
} = require('../scripts/blog-reading-experience');

test('injects enhancement assets and pet once into a post', () => {
  const html = '<html><head></head><body><main></main></body></html>';
  const output = enhancePostHtml(html, { page: { layout: 'post' } });

  assert.match(output, /blog-post-enhanced/);
  assert.equal((output.match(/blog-reading-experience\.css/g) || []).length, 1);
  assert.equal((output.match(/blog-reading-experience\.js/g) || []).length, 1);
  assert.equal((output.match(/id="blog-pet"/g) || []).length, 1);
  assert.equal(enhancePostHtml(output, { page: { layout: 'post' } }), output);
});

test('preserves an existing body class when enhancing a post', () => {
  const html = '<html><head></head><body class="theme-dark"><main></main></body></html>';
  const output = enhancePostHtml(html, { page: { layout: 'post' } });

  assert.match(output, /class="theme-dark blog-post-enhanced"/);
});

test('does not inject post enhancements into non-post pages', () => {
  const html = '<html><head></head><body><main></main></body></html>';

  assert.equal(enhancePostHtml(html, { page: { layout: 'index' } }), html);
});

test('removes typed.js from post output only', () => {
  const html = [
    '<html><head></head><body>',
    '<script src="https://cdn.example/typed.js/2.0.12/typed.min.js"></script>',
    '</body></html>'
  ].join('');

  assert.doesNotMatch(
    enhancePostHtml(html, { page: { layout: 'post' } }),
    /typed\.min\.js/
  );
  assert.match(
    enhancePostHtml(html, { page: { layout: 'index' } }),
    /typed\.min\.js/
  );
});

test('registers one after_render:html filter', () => {
  const calls = [];
  const hexo = {
    extend: {
      filter: {
        register(name, handler) {
          calls.push({ name, handler });
        }
      }
    }
  };

  register(hexo);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'after_render:html');
  assert.equal(calls[0].handler, enhancePostHtml);
});
