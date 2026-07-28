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
  assert.ok(fs.statSync(css).size + fs.statSync(js).size < 20 * 1024);
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

  assert.deepEqual(domains, ['www.zhililab.cn']);
});
