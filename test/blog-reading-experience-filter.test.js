'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  enablePostComments,
  enhancePostHtml,
  guardMermaidRefreshCallback,
  injectAiSummary,
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

test('guards Mermaid refresh registration from Fluid script load races', () => {
  const html = [
    '<html><head></head><body>',
    '<script>',
    "Fluid.utils.createScript('https://cdn.example/mermaid.min.js', function() {",
    'Fluid.events.registerRefreshCallback(function() {});',
    '});',
    '</script>',
    '</body></html>'
  ].join('');
  const output = enhancePostHtml(html, { page: { layout: 'post' } });

  assert.match(output, /Fluid\.events\?\.registerRefreshCallback\?\.\(/);
  assert.doesNotMatch(output, /Fluid\.events\.registerRefreshCallback\(/);
  assert.match(
    guardMermaidRefreshCallback(html),
    /Fluid\.events\?\.registerRefreshCallback\?\.\(/
  );
});

test('enables comments by default while preserving an explicit opt-out', () => {
  assert.equal(enablePostComments({ title: '默认文章' }).comments, true);
  assert.equal(
    enablePostComments({ title: '关闭评论', comments: false }).comments,
    false
  );
});

test('registers post defaults, AI summaries, and one final HTML filter', () => {
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

  assert.equal(calls.length, 3);
  assert.equal(calls[0].name, 'before_post_render');
  assert.equal(calls[0].handler, enablePostComments);
  assert.equal(calls[1].name, 'after_post_render');
  assert.equal(calls[1].handler, injectAiSummary);
  assert.equal(calls[2].name, 'after_render:html');
  assert.equal(calls[2].handler, enhancePostHtml);
});
