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
const kubernetesArticlePath = path.join(
  publicRoot,
  '2026',
  '07',
  '23',
  '2026-07-23-kubernetes-pod-creation-workflow',
  'index.html'
);
const graphArticlePath = path.join(
  publicRoot,
  '2026',
  '07',
  '27',
  '2026-07-27-from-graph-platform-to-devops-agent-control-plane',
  'index.html'
);
const claudeArticlePath = path.join(
  publicRoot,
  '2026',
  '06',
  '27',
  '2026-06-27-claude-code-token-economy',
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
  assert.ok(fs.statSync(css).size + fs.statSync(js).size < 24 * 1024);
});

test('all three backfills render one static reviewed AI summary and home renders none', () => {
  const disclosure = 'AI 生成 · 已由作者审核 · 仅供快速预览，请以原文为准';
  const forbiddenRuntimeMarkers = /generativelanguage\.googleapis\.com|GEMINI_API_KEY|x-goog-api-key/i;

  for (const file of [articlePath, kubernetesArticlePath, graphArticlePath]) {
    const html = read(file);
    const componentMatch = html.match(
      /<details class="ai-summary" data-ai-summary>[\s\S]*?<\/details>/
    );
    const metaDescriptions = html.match(
      /<meta\b[^>]*(?:name="description"|property="og:description")[^>]*>/g
    ) || [];

    assert.equal(
      (html.match(/<details class="ai-summary" data-ai-summary>/g) || []).length,
      1,
      `${file} must contain exactly one AI summary component`
    );
    assert.ok(componentMatch, `${file} must contain the complete AI summary component`);
    const component = componentMatch[0];
    assert.equal(
      (component.match(/role="tab"/g) || []).length,
      3,
      `${file} must contain exactly three AI summary tabs`
    );
    assert.equal(
      (component.match(/✦ 阅读 AI 生成摘要/g) || []).length,
      1,
      `${file} must contain the collapsed summary copy once`
    );
    assert.equal(
      (component.match(/>通俗解释<\/button>/g) || []).length,
      1,
      `${file} must contain the exact third-tab copy once`
    );
    assert.equal(
      component.split(disclosure).length - 1,
      1,
      `${file} must contain the disclosure once`
    );
    assert.doesNotMatch(
      metaDescriptions.join('\n'),
      /✦ 阅读 AI 生成摘要|AI 生成 · 已由作者审核/,
      `${file} must keep AI summary copy out of SEO descriptions`
    );
    assert.doesNotMatch(html, forbiddenRuntimeMarkers);
  }

  const home = read(path.join(publicRoot, 'index.html'));
  assert.doesNotMatch(home, /data-ai-summary|✦ 阅读 AI 生成摘要|通俗解释/);
  assert.doesNotMatch(home, forbiddenRuntimeMarkers);
});

test('Kubernetes article uses the cached sequence diagram image', () => {
  const html = read(kubernetesArticlePath);

  assert.match(
    html,
    /<picture>[\s\S]*data-src="\/assets\/images\/posts\/kubernetes-pod-creation-sequence-diagram\.png"/
  );
  assert.match(html, /kubernetes-pod-creation-sequence-diagram-640\.webp 640w/);
  assert.match(html, /kubernetes-pod-creation-sequence-diagram-960\.webp 960w/);
  assert.match(html, /kubernetes-pod-creation-sequence-diagram-1440\.webp 1440w/);
  assert.match(
    html,
    /<img\b[^>]*data-src="\/assets\/images\/posts\/kubernetes-pod-creation-sequence-diagram\.png"[^>]*data-srcset="[^"]*kubernetes-pod-creation-sequence-diagram-640\.webp/
  );
  assert.match(html, /data-blog-deferred-image/);
  assert.match(html, /src="data:image\/svg\+xml,/);
  assert.match(html, /width="4558"/);
  assert.match(html, /height="3602"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /alt="Kubernetes Pod 从创建到 Ready 的完整时序图"/);
  assert.doesNotMatch(html, /srcset="\/img\/loading\.gif"/);
  assert.doesNotMatch(html, /mermaid\.min\.js/);
  assert.doesNotMatch(html, /sequenceDiagram/);
});

test('rendered post inlines its compact banner and has no blocking CDN styles', () => {
  const html = read(kubernetesArticlePath);
  const externalStyles = Array.from(
    html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/gi)
  ).map((match) => match[1]).filter((url) => /^https?:|^\/\//.test(url));

  assert.equal((html.match(/data-post-banner-inline/g) || []).length, 1);
  assert.match(html, /data:image\/webp;base64,/);
  assert.doesNotMatch(html, /data-post-banner-preload/);
  assert.deepEqual(externalStyles, []);
  assert.doesNotMatch(html, /NProgress/);
  assert.doesNotMatch(html, /busuanzi\.pure\.mini\.js/);
});

test('Claude article uses its compact SVG as the detail-page banner', () => {
  const html = read(claudeArticlePath);

  assert.match(
    html,
    /data-post-banner-inline/
  );
  assert.match(
    html,
    /id="banner"[\s\S]{0,500}data:image\/svg\+xml;base64,/
  );
  assert.doesNotMatch(
    html,
    /id="banner"[\s\S]{0,500}\/img\/default\.png/
  );
});

test('rendered home page does not contain the post pet', () => {
  const html = read(path.join(publicRoot, 'index.html'));

  assert.doesNotMatch(html, /id="blog-pet"/);
  assert.doesNotMatch(html, /blog-post-enhanced/);
});

test('rendered article lazy-loads moderated Waline comments', () => {
  const html = read(articlePath);

  assert.match(html, /<article id="comments"[^>]*>/);
  assert.match(html, /<div id="waline"><\/div>/);
  assert.match(html, /https:\/\/comments\.zhililab\.cn/);
  assert.match(html, /评论提交后需审核，审核通过后公开显示/);
  assert.match(html, /Fluid\.utils\.loadComments\('#waline'/);
});

test('rendered home page does not load Waline assets', () => {
  const html = read(path.join(publicRoot, 'index.html'));

  assert.doesNotMatch(html, /id="waline"/);
  assert.doesNotMatch(html, /waline\.min\.(?:css|js)/);
  assert.doesNotMatch(html, /comments\.zhililab\.cn/);
});

test('generated Pages CNAME contains one canonical domain', () => {
  const domains = read(path.join(publicRoot, 'CNAME'))
    .split(/\r?\n/)
    .map((domain) => domain.trim())
    .filter(Boolean);

  assert.deepEqual(domains, ['zhililab.cn']);
});

test('generated site exposes canonical crawler discovery files', () => {
  const home = read(path.join(publicRoot, 'index.html'));
  assert.ok(fs.existsSync(path.join(publicRoot, 'robots.txt')));
  assert.ok(fs.existsSync(path.join(publicRoot, 'sitemap.xml')));
  const robots = read(path.join(publicRoot, 'robots.txt'));
  const sitemap = read(path.join(publicRoot, 'sitemap.xml'));

  assert.match(home, /<link rel="canonical" href="https:\/\/zhililab\.cn\/"/);
  assert.match(robots, /Sitemap: https:\/\/zhililab\.cn\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/zhililab\.cn\//);
  assert.doesNotMatch(sitemap, /https:\/\/github\.com\/zhililab/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.zhililab\.cn/);
});

test('generated site exposes the privacy policy from every footer', () => {
  const home = read(path.join(publicRoot, 'index.html'));
  const article = read(articlePath);
  const privacyPath = path.join(publicRoot, 'privacy', 'index.html');
  const privacy = read(privacyPath);

  assert.match(home, /href="\/privacy\/"[^>]*>隐私与 Cookie 政策</);
  assert.match(article, /href="\/privacy\/"[^>]*>隐私与 Cookie 政策</);
  assert.match(privacy, /隐私与 Cookie 政策/);
  assert.match(privacy, /Google/);
  assert.match(privacy, /Cookie/);
  assert.match(privacy, /Waline/);
  assert.match(
    privacy,
    /href="https:\/\/zhililab\.cn\/">zhililab\.cn<\/a>/
  );
  assert.doesNotMatch(privacy, /id="waline"/);
});

test('first-stage build makes zero AdSense requests and renders no empty slot', () => {
  const article = read(articlePath);
  const home = read(path.join(publicRoot, 'index.html'));

  for (const html of [article, home]) {
    assert.doesNotMatch(html, /blog-controlled-ad/);
    assert.doesNotMatch(html, /adsbygoogle/);
    assert.doesNotMatch(html, /pagead2\.googlesyndication\.com/);
  }
});

test('publishes the owner-provided AdSense authorization at the site root', () => {
  const adsTxt = read(path.join(publicRoot, 'ads.txt'));

  assert.equal(
    adsTxt,
    'google.com, pub-1413124948160145, DIRECT, f08c47fec0942fa0\n'
  );
});
