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
  const fluid = read('source/_data/fluid_config.yml');

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
      description: `<p>一次真实的工程复盘 &amp; 验证。</p><script>alert(1)</script>${'<p>后续分析与改进。</p>'.repeat(40)}`,
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
  assert.match(schema.description, /^一次真实的工程复盘 & 验证。/);
  assert.ok(schema.description.length <= 200);
  assert.doesNotMatch(schema.description, /<[^>]+>|alert\(1\)/);
  assert.equal(
    schema.image,
    'https://www.zhililab.cn/assets/images/cover/post.jpg'
  );
  assert.equal(schema.datePublished, '2026-08-01T12:00:00.000Z');
  assert.equal(schema.dateModified, '2026-08-02T12:00:00.000Z');
  assert.doesNotMatch(output, /<\/script><script>alert/);
});

test('JSON-LD serialization escapes HTML-significant characters', () => {
  const { safeJson } = require('../scripts/blog-site-identity');
  assert.equal(safeJson({ value: '<tag>&' }), '{"value":"\\u003ctag\\u003e\\u0026"}');
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

test('legacy object author metadata is normalized without changing article HTML', () => {
  const {
    enhanceSiteHtml,
    normalizePostAuthor
  } = require('../scripts/blog-site-identity');
  const html = [
    '<html><head><meta name="author" content="[object Object]"></head>',
    '<body><article>Keep [object Object] as written.</article></body></html>'
  ].join('');
  const data = { page: { layout: 'post', path: 'legacy/index.html' } };
  const output = enhanceSiteHtml(html, data, identityOptions());

  assert.match(output, /<meta name="author" content="Walker">/);
  assert.match(output, /<article>Keep \[object Object\] as written\.<\/article>/);

  const post = { author: { link: 'https://example.com', nick: 'Zhi Li' } };
  assert.equal(normalizePostAuthor(post, 'Walker').author, 'Zhi Li');
  assert.equal(normalizePostAuthor({ author: {} }, 'Walker').author, 'Walker');
});

test('About source explains the current role, focus, and publishing boundary', () => {
  const about = read('source/about/index.md');

  assert.match(about, /^title:\s+关于 Walker$/m);
  assert.match(about, /DevOps 实践者/);
  assert.match(about, /AI 原生/);
  assert.match(about, /内容即代码/);
  assert.match(about, /人工确认/);
  assert.match(about, /^layout:\s+page$/m);
  assert.match(about, /https:\/\/github\.com\/zhililab/);
});

test('Field Notes has a clear identity and preserves the historical notes', () => {
  const notes = read('source/notes/index.md');

  assert.match(notes, /^title:\s+Field Notes \| 随记$/m);
  assert.match(notes, /历史摘录（2018）/);
  assert.match(notes, /做事要么做到位，要么干脆不做/);
  assert.match(notes, /Yes I can/);
  assert.match(notes, /^layout:\s+page$/m);
});

test('Projects source lists only grounded ContentOps capabilities', () => {
  const projects = read('source/projects/index.md');

  assert.match(projects, /^title:\s+项目$/m);
  assert.match(projects, /ContentOps/);
  assert.match(projects, /AI 摘要/);
  assert.match(projects, /人工审核/);
  assert.match(projects, /Hexo/);
  assert.match(projects, /GitHub Pages/);
  assert.doesNotMatch(projects, /用户量|访问量|提升了?\s*\d+|节省了?\s*\d+/);
});

function readPublic(relativePath) {
  return read(path.join('public', relativePath));
}

function publicHtmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return publicHtmlFiles(absolutePath);
    }
    return entry.isFile() && entry.name.endsWith('.html') ? [absolutePath] : [];
  });
}

test('generated homepage renders the Reading Desk identity and Person schema', () => {
  const html = readPublic('index.html');

  assert.match(html, /<title>Walker \| ZHILILAB<\/title>/);
  assert.match(html, /href="https:\/\/www\.zhililab\.cn\/" data-site-identity/);
  assert.match(html, /"@type":"Person"/);
  assert.match(html, /class="walker-intro"/);
  assert.match(html, /把实践写成可复用的系统/);
  assert.match(html, /<strong>Walker<\/strong>/);
  assert.match(html, /href="\/projects\/"/);
  assert.match(html, /assets\/images\/cover\/header_cover\.jpg/);
  assert.equal((html.match(/walker-featured/g) || []).length, 1);
});

test('generated post renders canonical BlogPosting metadata', () => {
  const html = readPublic(
    '2026/07/31/2026-07-31-weekly-ai-engineering-radar/index.html'
  );

  assert.match(
    html,
    /href="https:\/\/www\.zhililab\.cn\/2026\/07\/31\/2026-07-31-weekly-ai-engineering-radar\/"/
  );
  assert.match(html, /"@type":"BlogPosting"/);
  assert.match(html, /"name":"Walker"/);
  assert.doesNotMatch(html, /walker-intro/);
});

test('generated long-form post keeps structured description concise', () => {
  const html = readPublic(
    '2026/07/31/2026-07-31-kubernetes-secrets-update-troubleshooting/index.html'
  );
  const schema = extractStructuredData(html);

  assert.equal(schema['@type'], 'BlogPosting');
  assert.ok(schema.description.length <= 200);
  assert.doesNotMatch(schema.description, /<[^>]+>/);
  assert.match(schema.description, /^最近在 Kubernetes 集群中遇到了一次环境变量残留问题/);
});

test('generated personal pages contain their current route content', () => {
  const about = readPublic('about/index.html');
  const notes = readPublic('notes/index.html');
  const projects = readPublic('projects/index.html');

  assert.match(about, /关于 Walker/);
  assert.match(about, /内容即代码/);
  assert.match(about, /href="https:\/\/www\.zhililab\.cn\/about\/"/);
  assert.match(notes, /Field Notes \| 随记/);
  assert.match(notes, /历史摘录（2018）/);
  assert.match(projects, /class="builder-projects"/);
  assert.equal((projects.match(/class="builder-project"/g) || []).length, 4);
  assert.match(projects, /DevOps Agent Control Plane/);
  assert.match(projects, /Tutorial-to-Template/);
  assert.match(projects, /ZHILILAB ContentOps/);
  assert.match(projects, /Python Learning Resources/);
  assert.match(projects, /href="\/css\/blog-projects\.css"/);
  assert.match(projects, /src="\/js\/blog-projects\.js"/);
  assert.match(projects, /data-project-carousel/);
  assert.equal((projects.match(/data-project-trace/g) || []).length, 2);
  assert.match(
    projects,
    /data-trace-kind="tutorial" role="group" aria-label="Tutorial-to-Template 执行流程"/
  );
  assert.match(
    projects,
    /data-trace-kind="python-resources" role="group" aria-label="Python Learning Resources 执行流程"/
  );
  assert.match(
    projects,
    /class="builder-trace__outputs" role="group" aria-label="生成产物"/
  );
  assert.match(
    projects,
    /class="builder-trace__outputs" role="group" aria-label="README 内容"/
  );
  assert.match(projects, /FALLBACK_PROJECTS/);
  assert.doesNotMatch(projects, /tutorial-to-template-(?:960|1600)\.webp/);
  assert.doesNotMatch(projects, /python-learning-resources-(?:960|1600)\.webp/);
  assert.match(projects, /<body[^>]*\bclass="[^"]*\bbuilder-projects-page\b/);

  const projectsCss = readPublic('css/blog-projects.css');
  assert.match(projectsCss, /\.builder-projects-page \.header-inner\s*\{[^}]*height:\s*64px !important;/);
  assert.match(projectsCss, /\.builder-projects-page #navbar\s*\{[^}]*background-color:\s*var\(--projects-bg\) !important;/);
  assert.match(projectsCss, /\.builder-trace\.is-trace-active/);
});

test('generated HTML contains no object-form author output', () => {
  const html = publicHtmlFiles(path.join(root, 'public'))
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');

  assert.doesNotMatch(html, /\[object Object\]/);
});
