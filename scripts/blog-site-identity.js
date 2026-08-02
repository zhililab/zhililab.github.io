'use strict';

const MARKER = 'data-site-identity';
const HOME_CSS_PATH = '/css/blog-site-identity.css';

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

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeAuthorMeta(html, author) {
  return html.replace(
    /<meta\b(?=[^>]*\bname=["']author["'])[^>]*>/gi,
    (tag) => tag.replace(
      /\bcontent=(["'])[^"']*\1/i,
      `content="${escapeAttribute(author)}"`
    )
  );
}

function normalizePostAuthor(data, fallbackAuthor) {
  if (data && data.author && typeof data.author === 'object') {
    data.author = data.author.nick || data.author.name || fallbackAuthor;
  }
  return data;
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

function homepageMarkup() {
  return [
    '<section class="walker-intro" aria-labelledby="walker-intro-title" data-site-identity-home>',
    '  <div class="walker-intro__copy">',
    '    <p class="walker-intro__eyebrow">Walker · Reading Desk</p>',
    '    <h1 id="walker-intro-title">把实践写成可复用的系统</h1>',
    '    <p class="walker-intro__lead">这里记录 DevOps、Kubernetes、AI 原生工作流与内容工程中的真实问题、证据链和可执行方法。</p>',
    '    <p class="walker-intro__boundary">内容由 Walker 创作与确认，自动化负责整理、检查和发布准备。</p>',
    '    <div class="walker-intro__actions">',
    '      <a class="walker-action walker-action--primary" href="#board">阅读最新文章</a>',
    '      <a class="walker-action" href="/projects/">查看项目</a>',
    '    </div>',
    '  </div>',
    '  <nav class="walker-topics" aria-label="长期写作主题">',
    '    <a class="walker-topic" href="/tags/DevOps/"><span>01</span>DevOps 与 SRE</a>',
    '    <a class="walker-topic" href="/tags/Kubernetes/"><span>02</span>Kubernetes</a>',
    '    <a class="walker-topic" href="/tags/AI/"><span>03</span>AI 原生工作流</a>',
    '    <a class="walker-topic" href="/categories/技术/"><span>04</span>内容工程</a>',
    '  </nav>',
    '</section>'
  ].join('\n');
}

function enhanceHomepage(html, data) {
  if (canonicalPath(data) !== '/') {
    return html;
  }

  let output = html.replace(
    /<\/head>/i,
    `<link rel="stylesheet" href="${HOME_CSS_PATH}" data-site-identity-home>\n</head>`
  );
  output = output.replace(/<div id="board"/i, `${homepageMarkup()}\n<div id="board"`);
  return output.replace(
    /class="row mx-auto index-card"/i,
    'class="row mx-auto index-card walker-featured"'
  );
}

function enhanceSiteHtml(html, data, options) {
  if (!html) {
    return html;
  }
  const normalizedHtml = normalizeAuthorMeta(html, options.author);
  if (normalizedHtml.includes(MARKER)) {
    return normalizedHtml;
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

  const withoutCanonical = normalizedHtml.replace(
    /\s*<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi,
    ''
  );
  const withMetadata = withoutCanonical.replace(
    /<\/head>/i,
    `${metadata.join('\n')}\n</head>`
  );
  return enhanceHomepage(withMetadata, data);
}

function register(hexoInstance) {
  const options = {
    author: String(hexoInstance.config.author || 'Walker'),
    defaultImage: hexoInstance.config.header_cover || '/assets/images/cover/header_cover.jpg',
    description: hexoInstance.config.description || '',
    siteUrl: hexoInstance.config.url
  };

  hexoInstance.extend.filter.register(
    'before_post_render',
    (data) => normalizePostAuthor(data, options.author)
  );
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
  enhanceHomepage,
  enhanceSiteHtml,
  homepageMarkup,
  normalizeAuthorMeta,
  normalizePostAuthor,
  register,
  safeJson,
  structuredData
};
