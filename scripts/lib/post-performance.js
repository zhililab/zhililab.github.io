'use strict';

const RESPONSIVE_WIDTHS = [640, 960, 1440];
const LOCAL_IMAGE_PATTERN = /^\/assets\/images\//;
const RASTER_FORMATS = new Set(['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff']);
const IMAGE_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E';

const DEPENDENCY_REPLACEMENTS = new Map([
  [
    'https://lib.baomitu.com/twitter-bootstrap/4.6.1/css/bootstrap.min.css',
    '/vendor/blog/bootstrap.min.css'
  ],
  [
    'https://lib.baomitu.com/github-markdown-css/4.0.0/github-markdown.min.css',
    '/vendor/blog/github-markdown.min.css'
  ],
  [
    'https://lib.baomitu.com/hint.css/2.7.0/hint.min.css',
    '/vendor/blog/hint.min.css'
  ],
  [
    'https://lib.baomitu.com/fancybox/3.5.7/jquery.fancybox.min.css',
    '/vendor/blog/jquery.fancybox.min.css'
  ],
  [
    '//at.alicdn.com/t/font_1749284_hj8rtnfg7um.css',
    '/vendor/blog/fluid-icons.css'
  ],
  [
    '//at.alicdn.com/t/font_1736178_lbnruvf0jn.css',
    '/vendor/blog/site-icons.css'
  ],
  [
    'https://lib.baomitu.com/jquery/3.6.0/jquery.min.js',
    '/vendor/blog/jquery.min.js'
  ],
  [
    'https://lib.baomitu.com/twitter-bootstrap/4.6.1/js/bootstrap.min.js',
    '/vendor/blog/bootstrap.min.js'
  ],
  [
    'https://lib.baomitu.com/tocbot/4.18.2/tocbot.min.js',
    '/vendor/blog/tocbot.min.js'
  ],
  [
    'https://lib.baomitu.com/clipboard.js/2.0.11/clipboard.min.js',
    '/vendor/blog/clipboard.min.js'
  ],
  [
    'https://lib.baomitu.com/anchor-js/4.3.1/anchor.min.js',
    '/vendor/blog/anchor.min.js'
  ],
  [
    'https://lib.baomitu.com/fancybox/3.5.7/jquery.fancybox.min.js',
    '/vendor/blog/jquery.fancybox.min.js'
  ]
]);

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}=(["'])(.*?)\\1`, 'i'));
  return match ? match[2] : null;
}

function removeAttribute(tag, name) {
  return tag.replace(
    new RegExp(`\\s${name}(?:=(["']).*?\\1)?`, 'gi'),
    ''
  );
}

function setAttribute(tag, name, value) {
  const cleaned = removeAttribute(tag, name);
  return cleaned.replace(
    /\s*\/?>$/,
    ` ${name}="${escapeAttribute(value)}">`
  );
}

function withLoadingHints(tag) {
  let output = removeAttribute(tag, 'lazyload');
  if (getAttribute(output, 'srcset') === '/img/loading.gif') {
    output = removeAttribute(output, 'srcset');
  }
  output = setAttribute(output, 'loading', 'lazy');
  output = setAttribute(output, 'decoding', 'async');
  return output;
}

function variantWidths(originalWidth) {
  const widths = RESPONSIVE_WIDTHS.filter((width) => width < originalWidth);
  widths.push(Math.min(originalWidth, RESPONSIVE_WIDTHS.at(-1)));
  return Array.from(new Set(widths)).sort((a, b) => a - b);
}

async function asyncReplace(input, pattern, replacer) {
  const matches = Array.from(input.matchAll(pattern));
  if (!matches.length) return input;

  const replacements = await Promise.all(
    matches.map((match) => replacer(match[0], match))
  );
  let offset = 0;
  let output = input;

  matches.forEach((match, index) => {
    const start = match.index + offset;
    output = output.slice(0, start)
      + replacements[index]
      + output.slice(start + match[0].length);
    offset += replacements[index].length - match[0].length;
  });
  return output;
}

async function rewritePostImages(html, options) {
  const inspectImage = options && options.inspectImage;
  const emitVariant = options && options.emitVariant;
  if (typeof inspectImage !== 'function' || typeof emitVariant !== 'function') {
    throw new TypeError('rewritePostImages requires inspectImage and emitVariant');
  }

  return asyncReplace(html, /<img\b[^>]*>/gi, async (tag) => {
    const source = getAttribute(tag, 'src');
    if (!source || !LOCAL_IMAGE_PATTERN.test(source)) {
      return withLoadingHints(tag);
    }

    const metadata = await inspectImage(source);
    if (!metadata || !RASTER_FORMATS.has(String(metadata.format).toLowerCase())) {
      return withLoadingHints(tag);
    }

    const widths = variantWidths(metadata.width);
    const variants = await Promise.all(
      widths.map(async (width) => ({
        width,
        url: await emitVariant(source, width)
      }))
    );
    const sourceSet = variants
      .map((variant) => `${variant.url} ${variant.width}w`)
      .join(', ');

    let image = withLoadingHints(tag);
    image = removeAttribute(image, 'srcset');
    image = setAttribute(image, 'width', metadata.width);
    image = setAttribute(image, 'height', metadata.height);
    image = setAttribute(image, 'fetchpriority', 'low');
    image = setAttribute(
      image,
      'sizes',
      '(max-width: 767px) calc(100vw - 32px), (max-width: 1199px) 83vw, 1000px'
    );
    const fallback = image;
    image = setAttribute(image, 'data-blog-deferred-image', 'true');
    image = setAttribute(image, 'data-src', source);
    image = setAttribute(image, 'data-srcset', sourceSet);
    image = setAttribute(image, 'src', IMAGE_PLACEHOLDER);
    return [
      '<picture>',
      `<source type="image/webp" data-srcset="${sourceSet}" sizes="${getAttribute(image, 'sizes')}">`,
      image,
      '</picture>',
      `<noscript>${fallback}</noscript>`
    ].join('');
  });
}

function extractLocalBanner(html) {
  const match = html.match(
    /id=(["'])banner\1[\s\S]{0,500}?background(?:-image)?:\s*url\((["']?)(\/assets\/images\/[^"')]+)\2\)/i
  );
  return match ? match[3] : null;
}

function addBannerPreload(html) {
  if (/data-post-banner-preload/i.test(html)) return html;
  const banner = extractLocalBanner(html);
  if (!banner) return html;

  const preload = [
    '<link rel="preload" as="image"',
    ` href="${escapeAttribute(banner)}"`,
    ' fetchpriority="high" data-post-banner-preload>'
  ].join('');
  return html.replace(/<\/head>/i, `  ${preload}\n</head>`);
}

async function optimizePostBanner(html, options = {}) {
  const banner = extractLocalBanner(html);
  if (!banner || typeof options.loadBanner !== 'function') {
    return addBannerPreload(html);
  }

  const asset = await options.loadBanner(banner);
  if (!asset || !asset.buffer || !asset.mime) {
    return addBannerPreload(html);
  }

  const dataUrl = `data:${asset.mime};base64,${asset.buffer.toString('base64')}`;
  const escapedBanner = banner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let output = html.replace(
    new RegExp(`url\\((["']?)${escapedBanner}\\1\\)`, 'i'),
    `url('${dataUrl}')`
  );
  output = output.replace(
    /id=(["'])banner\1/i,
    'id="banner" data-post-banner-inline'
  );
  return output;
}

function removeNprogress(html) {
  let output = html.replace(
    /\s*<(?:script|link)\b[^>]*(?:src|href)=(["'])https:\/\/lib\.baomitu\.com\/nprogress\/0\.2\.0\/[^"']+\1[^>]*>(?:\s*<\/script>)?/gi,
    ''
  );
  output = output.replace(
    /\s*<script>\s*NProgress\.configure\([\s\S]*?NProgress\.done\(\);[\s\S]*?<\/script>/gi,
    ''
  );
  return output;
}

function rewriteSharedDependencies(html) {
  let output = html;
  for (const [remote, local] of DEPENDENCY_REPLACEMENTS) {
    output = output.split(remote).join(local);
  }
  return output;
}

function rewritePostDependencies(html) {
  let output = removeNprogress(rewriteSharedDependencies(html));
  output = output.replace(
    /\s*<script\b[^>]*src=(["'])https:\/\/busuanzi\.ibruce\.info\/busuanzi\/2\.3\/busuanzi\.pure\.mini\.js\1[^>]*>\s*<\/script>/gi,
    ''
  );
  return output;
}

module.exports = {
  DEPENDENCY_REPLACEMENTS,
  addBannerPreload,
  extractLocalBanner,
  optimizePostBanner,
  rewritePostDependencies,
  rewriteSharedDependencies,
  rewritePostImages,
  variantWidths
};
