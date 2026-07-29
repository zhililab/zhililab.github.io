'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  injectPrivacyLink,
  injectControlledAd,
  normalizeAdsenseConfig
} = require('../scripts/blog-monetization');

const validClient = ['ca-pub-', '4821', '7059', '3164', '8273'].join('');
const validSlot = ['84', '295', '173', '60'].join('');
const zeroClient = ['ca-pub-', '0000', '0000', '0000', '0000'].join('');
const zeroSlot = ['000', '000', '0000'].join('');
const shortSlot = ['82', '731'].join('');

test('keeps monetization disabled until all real public identifiers are valid', () => {
  assert.deepEqual(normalizeAdsenseConfig(), {
    enabled: false,
    client: '',
    slot: '',
    ready: false
  });
  assert.equal(normalizeAdsenseConfig({
    enabled: true,
    client: zeroClient,
    slot: ''
  }).ready, false);
  assert.equal(normalizeAdsenseConfig({
    enabled: true,
    client: validClient,
    slot: validSlot
  }).ready, true);
});

test('rejects obvious publisher and slot placeholders even when enabled', () => {
  assert.equal(normalizeAdsenseConfig({
    enabled: true,
    client: zeroClient,
    slot: validSlot
  }).ready, false);
  assert.equal(normalizeAdsenseConfig({
    enabled: true,
    client: validClient,
    slot: zeroSlot
  }).ready, false);
  assert.equal(normalizeAdsenseConfig({
    enabled: true,
    client: validClient,
    slot: shortSlot
  }).ready, false);
});

test('adds one privacy link to a generated footer', () => {
  const html = '<html><body><footer><div class="footer-inner"></div></footer></body></html>';
  const output = injectPrivacyLink(html);

  assert.equal((output.match(/href="\/privacy\/"/g) || []).length, 1);
  assert.match(output, />隐私与 Cookie 政策</);
  assert.equal(injectPrivacyLink(output), output);
});

const active = {
  enabled: true,
  client: validClient,
  slot: validSlot,
  ready: true
};
const postHtml = [
  '<html><head></head><body><main>',
  '<article class="post-content"><div class="markdown-body">正文</div>',
  '<article id="comments"></article></article>',
  '</main><footer></footer></body></html>'
].join('');

test('injects one ad after post content and before comments', () => {
  const output = injectControlledAd(postHtml, {
    page: { layout: 'post' }
  }, active);

  assert.equal((output.match(/id="blog-controlled-ad"/g) || []).length, 1);
  assert.ok(output.indexOf('正文') < output.indexOf('id="blog-controlled-ad"'));
  assert.ok(output.indexOf('id="blog-controlled-ad"') < output.indexOf('id="comments"'));
  assert.equal(injectControlledAd(output, {
    page: { layout: 'post' }
  }, active), output);
});

test('does not inject without active valid configuration', () => {
  const output = injectControlledAd(postHtml, {
    page: { layout: 'post' }
  }, normalizeAdsenseConfig());

  assert.doesNotMatch(output, /blog-controlled-ad|adsbygoogle|pagead2/);
});

test('does not inject on non-post pages or explicit opt-out posts', () => {
  assert.doesNotMatch(
    injectControlledAd(postHtml, { page: { layout: 'index' } }, active),
    /blog-controlled-ad/
  );
  assert.doesNotMatch(
    injectControlledAd(postHtml, {
      page: { layout: 'post', ads: false }
    }, active),
    /blog-controlled-ad/
  );
});
