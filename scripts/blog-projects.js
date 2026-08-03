'use strict';

const MARKER = 'data-builder-projects';

function routePath(data) {
  return String((data && data.page && data.page.path) || (data && data.path) || '')
    .replace(/[?#].*$/, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

function isProjectsPage(data) {
  return /^(projects(?:\/index\.html)?)$/i.test(routePath(data));
}

function enhanceProjectsHtml(html, data) {
  if (!html || !isProjectsPage(data) || html.includes(MARKER)) return html;

  const withClass = html.replace(/<body\b([^>]*)>/i, (bodyTag, attrs) => {
    const classAttribute = /(\sclass\s*=\s*)(["'])(.*?)\2/i;
    if (!classAttribute.test(attrs)) return `<body class="builder-projects-page"${attrs}>`;
    return `<body${attrs.replace(classAttribute, (attribute, prefix, quote, classes) =>
      `${prefix}${quote}${classes} builder-projects-page${quote}`
    )}>`;
  });

  return withClass
    .replace('</head>', '<link rel="stylesheet" href="/css/blog-projects.css" data-builder-projects>\n</head>')
    .replace('</body>', '<script src="/js/blog-projects.js" defer data-builder-projects></script>\n</body>');
}

function register(hexoInstance) {
  hexoInstance.extend.filter.register('after_render:html', enhanceProjectsHtml);
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = { enhanceProjectsHtml, isProjectsPage, register, routePath };
