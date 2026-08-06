'use strict';

function buildCanonicalUrl(baseUrl, data = {}) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const rawPath = String(data.path || (data.page && data.page.path) || '')
    .replace(/^\/+/, '');
  const route = rawPath.replace(/(?:^|\/)index\.html$/, '');
  if (!route) return `${base}/`;
  return rawPath.endsWith('index.html')
    ? `${base}/${route}/`
    : `${base}/${route}`;
}

function injectCanonicalLink(html, data, baseUrl) {
  if (!/<head[\s>]/i.test(html)) return html;

  const canonical = buildCanonicalUrl(baseUrl, data);
  let output = html.replace(
    /<meta property="og:url" content="[^"]*">/i,
    `<meta property="og:url" content="${canonical}">`
  );

  if (/<link\b[^>]*rel=["']canonical["']/i.test(output)) {
    return output.replace(
      /<link\b[^>]*rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${canonical}">`
    );
  }

  return output.replace(
    /<\/head>/i,
    `  <link rel="canonical" href="${canonical}">\n</head>`
  );
}

function register(hexoInstance) {
  hexoInstance.extend.filter.register(
    'after_render:html',
    (html, data) => injectCanonicalLink(html, data, hexoInstance.config.url)
  );
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = {
  buildCanonicalUrl,
  injectCanonicalLink,
  register
};
