'use strict';

const MARKER = 'data-site-identity';

function pageData(data) {
  return (data && data.page) || data || {};
}

function cleanSiteUrl(siteUrl) {
  return String(siteUrl || '').replace(/\/+$/, '');
}

function canonicalPath(data) {
  const page = pageData(data);
  const rawPath = String(page.path || (data && data.path) || '').replace(/^\/+/, '');
  const withoutIndex = rawPath.replace(/index\.html?$/i, '');
  if (!withoutIndex) {
    return '/';
  }
  return `/${withoutIndex.replace(/\/+$/, '')}/`;
}

function absoluteUrl(value, siteUrl) {
  if (!value) {
    return undefined;
  }
  return new URL(String(value), `${cleanSiteUrl(siteUrl)}/`).href;
}

function isoDate(value) {
  if (!value) {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function isHome(page) {
  return page.layout === 'index' || !page.path || /^index\.html?$/i.test(page.path);
}

function isPost(page) {
  return page.layout === 'post';
}

function structuredData(page, canonicalUrl, options) {
  const image = absoluteUrl(page.cover || options.defaultImage, options.siteUrl);

  if (isHome(page)) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: options.author,
      url: canonicalUrl,
      description: options.description,
      image
    };
  }

  if (isPost(page)) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: page.title,
      description: page.description || page.excerpt || options.description,
      image,
      datePublished: isoDate(page.date),
      dateModified: isoDate(page.updated || page.date),
      author: {
        '@type': 'Person',
        name: options.author,
        url: `${cleanSiteUrl(options.siteUrl)}/`
      },
      mainEntityOfPage: canonicalUrl
    };
  }

  return null;
}

function enhanceSiteHtml(html, data, options) {
  if (!html || html.includes(MARKER)) {
    return html;
  }

  const page = pageData(data);
  const canonicalUrl = `${cleanSiteUrl(options.siteUrl)}${canonicalPath(data)}`;
  const schema = structuredData(page, canonicalUrl, options);
  const metadata = [
    `<link rel="canonical" href="${canonicalUrl}" ${MARKER}>`
  ];

  if (schema) {
    metadata.push(
      `<script type="application/ld+json" ${MARKER}>${safeJson(schema)}</script>`
    );
  }

  const withoutCanonical = html.replace(
    /\s*<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi,
    ''
  );
  return withoutCanonical.replace(/<\/head>/i, `${metadata.join('\n')}\n</head>`);
}

function register(hexoInstance) {
  const options = {
    author: String(hexoInstance.config.author || 'Walker'),
    defaultImage: hexoInstance.config.header_cover || '/assets/images/cover/header_cover.jpg',
    description: hexoInstance.config.description || '',
    siteUrl: hexoInstance.config.url
  };

  hexoInstance.extend.filter.register(
    'after_render:html',
    (html, data) => enhanceSiteHtml(html, data, options)
  );
}

if (typeof hexo !== 'undefined') {
  register(hexo);
}

module.exports = {
  absoluteUrl,
  canonicalPath,
  enhanceSiteHtml,
  register,
  safeJson,
  structuredData
};
