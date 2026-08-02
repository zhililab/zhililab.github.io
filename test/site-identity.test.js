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

function identityOptions() {
  return {
    author: 'Walker',
    defaultImage: '/assets/images/cover/header_cover.jpg',
    description: 'Walker 的个人博客',
    siteUrl: 'https://www.zhililab.cn'
  };
}

function extractStructuredData(html) {
  const match = html.match(
    /<script type="application\/ld\+json" data-site-identity>([\s\S]*?)<\/script>/
  );
  assert.ok(match, 'expected site identity JSON-LD');
  return JSON.parse(match[1]);
}

test('homepage receives one canonical URL and Person structured data', () => {
  const { enhanceSiteHtml } = require('../scripts/blog-site-identity');
  const html = '<html><head><title>Walker</title></head><body></body></html>';
  const data = { page: { layout: 'index', path: 'index.html' } };
  const output = enhanceSiteHtml(html, data, identityOptions());
  const schema = extractStructuredData(output);

  assert.equal((output.match(/rel="canonical"/g) || []).length, 1);
  assert.match(output, /href="https:\/\/www\.zhililab\.cn\/"/);
  assert.equal(schema['@type'], 'Person');
  assert.equal(schema.name, 'Walker');
  assert.equal(schema.url, 'https://www.zhililab.cn/');
  assert.equal(
    schema.image,
    'https://www.zhililab.cn/assets/images/cover/header_cover.jpg'
  );
  assert.equal(enhanceSiteHtml(output, data, identityOptions()), output);
});

test('post receives canonical BlogPosting data with HTML-safe JSON', () => {
  const { enhanceSiteHtml } = require('../scripts/blog-site-identity');
  const html = '<html><head></head><body><article>Body</article></body></html>';
  const data = {
    page: {
      cover: '/assets/images/cover/post.jpg',
      date: new Date('2026-08-01T12:00:00.000Z'),
      description: '一次真实的工程复盘 </script><script>alert(1)</script>',
      layout: 'post',
      path: '2026/08/01/engineering-review/index.html',
      title: '工程复盘',
      updated: new Date('2026-08-02T12:00:00.000Z')
    }
  };
  const output = enhanceSiteHtml(html, data, identityOptions());
  const schema = extractStructuredData(output);

  assert.match(
    output,
    /href="https:\/\/www\.zhililab\.cn\/2026\/08\/01\/engineering-review\/"/
  );
  assert.equal(schema['@type'], 'BlogPosting');
  assert.equal(schema.headline, '工程复盘');
  assert.equal(schema.author.name, 'Walker');
  assert.equal(
    schema.image,
    'https://www.zhililab.cn/assets/images/cover/post.jpg'
  );
  assert.equal(schema.datePublished, '2026-08-01T12:00:00.000Z');
  assert.equal(schema.dateModified, '2026-08-02T12:00:00.000Z');
  assert.doesNotMatch(output, /<\/script><script>alert/);
  assert.match(output, /\\u003c\/script\\u003e/);
});

test('root homepage receives the Reading Desk introduction and writing map', () => {
  const { enhanceSiteHtml } = require('../scripts/blog-site-identity');
  const html = [
    '<html><head></head><body>',
    '<main><div class="container nopadding-x-md">',
    '<div id="board"><div class="row mx-auto index-card">Latest</div></div>',
    '</div></main></body></html>'
  ].join('');
  const data = { page: { layout: 'index', path: 'index.html' } };
  const output = enhanceSiteHtml(html, data, identityOptions());

  assert.equal((output.match(/blog-site-identity\.css/g) || []).length, 1);
  assert.equal((output.match(/class="walker-intro"/g) || []).length, 1);
  assert.match(output, /把实践写成可复用的系统/);
  assert.match(output, /内容由 Walker 创作与确认/);
  assert.match(output, /href="#board"/);
  assert.match(output, /href="\/projects\/"/);
  assert.equal((output.match(/class="walker-topic"/g) || []).length, 4);
  assert.equal((output.match(/walker-featured/g) || []).length, 1);
});

test('inner routes do not receive the homepage introduction', () => {
  const { enhanceSiteHtml } = require('../scripts/blog-site-identity');
  const html = [
    '<html><head></head><body><main>',
    '<div id="board"><div class="row mx-auto index-card">Post</div></div>',
    '</main></body></html>'
  ].join('');
  const data = {
    page: {
      layout: 'post',
      path: '2026/08/01/engineering-review/index.html',
      title: '工程复盘'
    }
  };
  const output = enhanceSiteHtml(html, data, identityOptions());

  assert.doesNotMatch(output, /walker-intro/);
  assert.doesNotMatch(output, /blog-site-identity\.css/);
  assert.doesNotMatch(output, /walker-featured/);
});
