'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  addBannerPreload,
  extractLocalBanner,
  rewritePostDependencies,
  rewritePostImages
} = require('../scripts/lib/post-performance');
const { register: registerPerformance } = require('../scripts/blog-performance');

const LARGE_IMAGE = '/assets/images/posts/kubernetes-pod-creation-sequence-diagram.png';

test('rewrites a local raster image as responsive WebP with stable dimensions', async () => {
  const emitted = [];
  const html = [
    '<p><img src="', LARGE_IMAGE,
    '" srcset="/img/loading.gif" lazyload ',
    'alt="Kubernetes Pod 时序图"></p>'
  ].join('');

  const output = await rewritePostImages(html, {
    inspectImage: async (url) => {
      assert.equal(url, LARGE_IMAGE);
      return { width: 4558, height: 3602, format: 'png' };
    },
    emitVariant: async (url, width) => {
      emitted.push({ url, width });
      return `/assets/images/optimized/kubernetes-pod-creation-sequence-diagram-${width}.webp`;
    }
  });

  assert.match(output, /<picture>/);
  assert.match(output, /type="image\/webp"/);
  assert.match(
    output,
    /<img\b[^>]*srcset="[^"]*kubernetes-pod-creation-sequence-diagram-640\.webp 640w/
  );
  assert.match(output, /-640\.webp 640w/);
  assert.match(output, /-960\.webp 960w/);
  assert.match(output, /-1440\.webp 1440w/);
  assert.match(output, /width="4558"/);
  assert.match(output, /height="3602"/);
  assert.match(output, /loading="lazy"/);
  assert.match(output, /decoding="async"/);
  assert.match(output, /fetchpriority="low"/);
  assert.match(output, new RegExp(`src="${LARGE_IMAGE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.doesNotMatch(output, /srcset="\/img\/loading\.gif"/);
  assert.doesNotMatch(output, /\slazyload(?:\s|>)/);
  assert.deepEqual(emitted.map((item) => item.width), [640, 960, 1440]);
});

test('does not upscale a local raster image', async () => {
  const widths = [];
  const output = await rewritePostImages(
    '<img src="/assets/images/posts/small.png" alt="small">',
    {
      inspectImage: async () => ({ width: 720, height: 480, format: 'png' }),
      emitVariant: async (url, width) => {
        widths.push(width);
        return `/assets/images/optimized/small-${width}.webp`;
      }
    }
  );

  assert.deepEqual(widths, [640, 720]);
  assert.match(output, /small-720\.webp 720w/);
  assert.doesNotMatch(output, /960w|1440w/);
});

test('leaves SVG and remote images unconverted while adding safe loading hints', async () => {
  const output = await rewritePostImages(
    '<img src="/assets/images/cover/diagram.svg"><img src="https://example.com/remote.png">',
    {
      inspectImage: async (url) => ({
        width: url.includes('diagram') ? 800 : 640,
        height: 400,
        format: url.includes('diagram') ? 'svg' : 'png'
      }),
      emitVariant: async () => {
        throw new Error('should not emit variants');
      }
    }
  );

  assert.doesNotMatch(output, /<picture>/);
  assert.equal((output.match(/decoding="async"/g) || []).length, 2);
  assert.equal((output.match(/loading="lazy"/g) || []).length, 2);
});

test('extracts and preloads one local post banner', () => {
  const html = [
    '<html><head></head><body>',
    '<div id="banner" style="background: url(\'/assets/images/cover/Kubernetes-logo.webp\') no-repeat center">',
    '</div></body></html>'
  ].join('');

  assert.equal(
    extractLocalBanner(html),
    '/assets/images/cover/Kubernetes-logo.webp'
  );

  const once = addBannerPreload(html);
  const twice = addBannerPreload(once);
  assert.match(once, /rel="preload" as="image"/);
  assert.match(once, /fetchpriority="high"/);
  assert.equal((twice.match(/data-post-banner-preload/g) || []).length, 1);
});

test('rewrites blocking post dependencies to same-origin assets', () => {
  const html = [
    '<html><head>',
    '<link rel="stylesheet" href="https://lib.baomitu.com/twitter-bootstrap/4.6.1/css/bootstrap.min.css">',
    '<link rel="stylesheet" href="https://lib.baomitu.com/github-markdown-css/4.0.0/github-markdown.min.css">',
    '<link rel="stylesheet" href="//at.alicdn.com/t/font_1749284_hj8rtnfg7um.css">',
    '</head><body>',
    '<script src="https://lib.baomitu.com/nprogress/0.2.0/nprogress.min.js"></script>',
    '<link rel="stylesheet" href="https://lib.baomitu.com/nprogress/0.2.0/nprogress.min.css">',
    '<script>NProgress.configure({}); NProgress.start(); window.addEventListener("load", function(){NProgress.done();});</script>',
    '<script src="https://lib.baomitu.com/jquery/3.6.0/jquery.min.js"></script>',
    '<script defer src="https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>',
    '</body></html>'
  ].join('');

  const output = rewritePostDependencies(html);

  assert.match(output, /\/vendor\/blog\/bootstrap\.min\.css/);
  assert.match(output, /\/vendor\/blog\/github-markdown\.min\.css/);
  assert.match(output, /\/vendor\/blog\/fluid-icons\.css/);
  assert.match(output, /\/vendor\/blog\/jquery\.min\.js/);
  assert.doesNotMatch(output, /lib\.baomitu\.com/);
  assert.doesNotMatch(output, /at\.alicdn\.com/);
  assert.doesNotMatch(output, /busuanzi\.ibruce\.info/);
  assert.doesNotMatch(output, /NProgress/);
});

test('registers an asset generator before the async post-performance filter', async () => {
  const filters = [];
  const generators = [];
  const hexo = {
    source_dir: '/virtual/source/',
    extend: {
      filter: {
        register(name, handler, priority) {
          filters.push({ name, handler, priority });
        }
      },
      generator: {
        register(name, handler) {
          generators.push({ name, handler });
        }
      }
    }
  };

  registerPerformance(hexo, {
    createAssetPipeline() {
      return {
        generateRoutes: async () => [
          { path: 'vendor/blog/test.js', data: Buffer.from('vendor') },
          { path: 'assets/images/optimized/workflow-960.webp', data: Buffer.from('image') }
        ],
        imageApi: {
          inspectImage: async () => ({ width: 1280, height: 691, format: 'png' }),
          emitVariant: async (url, width) => `/assets/images/optimized/workflow-${width}.webp`
        }
      };
    }
  });

  assert.equal(generators.length, 1);
  assert.equal(generators[0].name, 'blog-performance-assets');
  const routes = await generators[0].handler();
  assert.ok(routes.some((item) => item.path === 'vendor/blog/test.js'));
  assert.ok(routes.some((item) => item.path.endsWith('workflow-960.webp')));

  assert.equal(filters.length, 1);
  assert.equal(filters[0].name, 'after_render:html');
  assert.equal(filters[0].priority > 10, true);

  const output = await filters[0].handler(
    '<html><head></head><body><img src="/assets/images/posts/workflow.png"></body></html>',
    { page: { layout: 'post' } }
  );

  assert.match(output, /<picture>/);
});

test('rewrites shared dependencies on non-post pages without removing their runtime features', async () => {
  const filters = [];
  const generators = [];
  const hexo = {
    extend: {
      filter: {
        register(name, handler) {
          filters.push({ name, handler });
        }
      },
      generator: {
        register(name, handler) {
          generators.push({ name, handler });
        }
      }
    }
  };
  registerPerformance(hexo, {
    createAssetPipeline() {
      return {
        generateRoutes: async () => [],
        imageApi: {
          inspectImage: async () => {
            throw new Error('should not inspect');
          },
          emitVariant: async () => {
            throw new Error('should not emit');
          }
        },
      };
    }
  });

  assert.equal(generators.length, 1);
  const html = [
    '<html><head>',
    '<link rel="stylesheet" href="https://lib.baomitu.com/twitter-bootstrap/4.6.1/css/bootstrap.min.css">',
    '</head><body>',
    '<img src="/assets/images/posts/workflow.png">',
    '<script src="https://lib.baomitu.com/nprogress/0.2.0/nprogress.min.js"></script>',
    '</body></html>'
  ].join('');
  const output = await filters[0].handler(html, { page: { layout: 'index' } });

  assert.match(output, /\/vendor\/blog\/bootstrap\.min\.css/);
  assert.match(output, /nprogress\.min\.js/);
  assert.doesNotMatch(output, /<picture>/);
});
