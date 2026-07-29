'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const post = fs.readFileSync(
  path.join(root, 'source/_posts/2026-07-29-why-google-adsense.md'),
  'utf8'
);
const css = fs.readFileSync(
  path.join(root, 'source/css/blog-reading-experience.css'),
  'utf8'
);
const cover = path.join(
  root,
  'source/assets/images/cover/why-google-adsense.webp'
);

test('AdSense reflection uses one dedicated card and banner cover', async () => {
  assert.match(
    post,
    /^index_img: \/assets\/images\/cover\/why-google-adsense\.webp$/m
  );
  assert.match(
    post,
    /^banner_img: \/assets\/images\/cover\/why-google-adsense\.webp$/m
  );
  assert.ok(fs.existsSync(cover));

  const metadata = await sharp(cover).metadata();
  assert.equal(metadata.width, 1920);
  assert.equal(metadata.height, 818);
  assert.equal(metadata.format, 'webp');
});

test('enhanced post pictures preserve their full original composition', () => {
  assert.match(css, /\.blog-post-enhanced \.markdown-body p > picture/);
  assert.match(
    css,
    /\.blog-post-enhanced \.markdown-body p > picture > a > img/
  );
  assert.match(css, /object-fit:\s*contain/);
  assert.match(css, /width:\s*auto/);
  assert.match(css, /height:\s*auto/);
  assert.match(css, /max-width:\s*100%/);
  assert.match(css, /max-height:\s*none/);
});
