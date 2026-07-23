'use strict';

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const {
  addBannerPreload,
  rewritePostDependencies,
  rewriteSharedDependencies,
  rewritePostImages,
  variantWidths
} = require('./lib/post-performance');

const VENDOR_ASSETS = new Map([
  ['vendor/blog/bootstrap.min.css', 'bootstrap/dist/css/bootstrap.min.css'],
  ['vendor/blog/bootstrap.min.js', 'bootstrap/dist/js/bootstrap.min.js'],
  ['vendor/blog/github-markdown.min.css', 'github-markdown-css/github-markdown.css'],
  ['vendor/blog/hint.min.css', 'hint.css/hint.min.css'],
  ['vendor/blog/jquery.fancybox.min.css', '@fancyapps/fancybox/dist/jquery.fancybox.min.css'],
  ['vendor/blog/jquery.fancybox.min.js', '@fancyapps/fancybox/dist/jquery.fancybox.min.js'],
  ['vendor/blog/jquery.min.js', 'jquery/dist/jquery.min.js'],
  ['vendor/blog/tocbot.min.js', 'tocbot/dist/tocbot.min.js'],
  ['vendor/blog/anchor.min.js', 'anchor-js/anchor.min.js'],
  ['vendor/blog/clipboard.min.js', 'clipboard/dist/clipboard.min.js']
]);

const LOCAL_VENDOR_ASSETS = new Map([
  ['vendor/blog/fluid-icons.css', 'source/vendor/blog/fluid-icons.css'],
  ['vendor/blog/site-icons.css', 'source/vendor/blog/site-icons.css'],
  ['vendor/blog/fluid-icons.woff2', 'source/vendor/blog/fluid-icons.woff2'],
  ['vendor/blog/site-icons.woff2', 'source/vendor/blog/site-icons.woff2']
]);

function isPost(data) {
  return Boolean(
    data &&
    (
      (data.page && data.page.layout === 'post') ||
      data.layout === 'post'
    )
  );
}

function vendorRoutes(hexoInstance) {
  const routes = Array.from(VENDOR_ASSETS, ([route, modulePath]) => ({
    path: route,
    data: fs.readFileSync(require.resolve(modulePath))
  }));

  for (const [route, relativePath] of LOCAL_VENDOR_ASSETS) {
    const sourcePath = path.join(hexoInstance.base_dir, relativePath);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Missing local vendor asset: ${relativePath}`);
    }
    routes.push({ path: route, data: fs.readFileSync(sourcePath) });
  }
  return routes;
}

function sourcePathForUrl(hexoInstance, url) {
  const relativePath = decodeURIComponent(url).replace(/^\/+/, '');
  const sourcePath = path.resolve(hexoInstance.source_dir, relativePath);
  const sourceRoot = path.resolve(hexoInstance.source_dir);
  if (!sourcePath.startsWith(`${sourceRoot}${path.sep}`)) {
    throw new Error(`Image path escapes source directory: ${url}`);
  }
  return sourcePath;
}

function optimizedRoute(url, width) {
  const relative = url
    .replace(/^\/assets\/images\//, '')
    .replace(/\.[^.\/]+$/, '');
  return `assets/images/optimized/${relative}-${width}.webp`;
}

function walkMarkdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkMarkdownFiles(absolute);
    return entry.isFile() && /\.md$/i.test(entry.name) ? [absolute] : [];
  });
}

function discoverReferencedPostImages(sourceDirectory) {
  const postDirectory = path.join(sourceDirectory, '_posts');
  const urls = new Set();
  const patterns = [
    /!\[[^\]]*\]\((\/assets\/images\/[^)\s]+)\)/g,
    /<img\b[^>]*\ssrc=(["'])(\/assets\/images\/[^"']+)\1/gi
  ];

  for (const markdownPath of walkMarkdownFiles(postDirectory)) {
    const markdown = fs.readFileSync(markdownPath, 'utf8');
    for (const pattern of patterns) {
      for (const match of markdown.matchAll(pattern)) {
        urls.add(match[2] || match[1]);
      }
    }
  }
  return Array.from(urls).sort();
}

function createAssetPipeline(hexoInstance) {
  const imageManifest = new Map();

  async function generateImageRoutes() {
    const routes = [];
    const urls = discoverReferencedPostImages(hexoInstance.source_dir);

    for (const url of urls) {
      const sourcePath = sourcePathForUrl(hexoInstance, url);
      const metadata = await sharp(sourcePath).metadata();
      const format = String(metadata.format || '').toLowerCase();
      if (!['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff'].includes(format)) {
        imageManifest.set(url, metadata);
        continue;
      }

      const variants = new Map();
      for (const width of variantWidths(metadata.width)) {
        const route = optimizedRoute(url, width);
        const buffer = await sharp(sourcePath)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 82, effort: 4 })
          .toBuffer();
        routes.push({ path: route, data: buffer });
        variants.set(width, `/${route}`);
      }
      imageManifest.set(url, { ...metadata, variants });
    }
    return routes;
  }

  const imageApi = {
    async inspectImage(url) {
      return imageManifest.get(url) || { format: 'passthrough' };
    },
    async emitVariant(url, width) {
      const entry = imageManifest.get(url);
      const route = entry && entry.variants && entry.variants.get(width);
      if (!route) {
        throw new Error(`Missing generated image variant for ${url} at ${width}px`);
      }
      return route;
    }
  };

  return {
    async generateRoutes() {
      const imageRoutes = await generateImageRoutes();
      return [...vendorRoutes(hexoInstance), ...imageRoutes];
    },
    imageApi
  };
}

function register(hexoInstance, options = {}) {
  const pipelineFactory = options.createAssetPipeline || createAssetPipeline;
  const pipeline = pipelineFactory(hexoInstance);

  hexoInstance.extend.generator.register(
    'blog-performance-assets',
    () => pipeline.generateRoutes()
  );

  hexoInstance.extend.filter.register(
    'after_render:html',
    async (html, data) => {
      if (!isPost(data)) return rewriteSharedDependencies(html);

      let output = rewritePostDependencies(html);
      output = addBannerPreload(output);
      output = await rewritePostImages(output, pipeline.imageApi);
      return output;
    },
    20
  );
}

if (typeof hexo !== 'undefined') {
  register(hexo);
}

module.exports = {
  VENDOR_ASSETS,
  createAssetPipeline,
  discoverReferencedPostImages,
  optimizedRoute,
  register,
  sourcePathForUrl,
  vendorRoutes
};
