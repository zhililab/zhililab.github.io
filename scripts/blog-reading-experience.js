'use strict';

const CSS_PATH = '/css/blog-reading-experience.css';
const JS_PATH = '/js/blog-reading-experience.js';
const MARKER = 'data-blog-reading-experience';

function isPost(data) {
  return Boolean(
    data &&
    (
      (data.page && data.page.layout === 'post') ||
      data.layout === 'post'
    )
  );
}

function enablePostComments(data) {
  if (data && data.comments !== false) {
    data.comments = true;
  }
  return data;
}

function addBodyClass(html) {
  return html.replace(/<body(?:\s+class="([^"]*)")?([^>]*)>/i, (match, classes, rest) => {
    const classNames = new Set((classes || '').split(/\s+/).filter(Boolean));
    classNames.add('blog-post-enhanced');
    return `<body class="${Array.from(classNames).join(' ')}"${rest}>`;
  });
}

function removePostOnlyTypedScript(html) {
  return html.replace(
    /[ \t]*<script\b[^>]*\bsrc=(["'])[^"']*typed\.js[^"']*\1[^>]*>\s*<\/script>\s*/gi,
    ''
  );
}

function guardMermaidRefreshCallback(html) {
  return html.replace(
    /(Fluid\.utils\.createScript\(['"][^'"]*mermaid\.min\.js['"][\s\S]*?)Fluid\.events\.registerRefreshCallback\(/g,
    '$1Fluid.events?.registerRefreshCallback?.('
  );
}

function petMarkup() {
  return [
    `<button id="blog-pet" type="button" aria-label="和博客机器人打个招呼" aria-describedby="blog-pet-message" ${MARKER}>`,
    '  <span class="blog-pet__bubble" id="blog-pet-message" role="status" aria-live="polite">今天也在持续进化</span>',
    '  <svg class="blog-pet__robot" viewBox="0 0 128 144" aria-hidden="true" focusable="false">',
    '    <defs>',
    '      <linearGradient id="pet-body-gradient" x1="0" y1="0" x2="1" y2="1">',
    '        <stop offset="0" stop-color="#78a7ff"/>',
    '        <stop offset="1" stop-color="#315ddc"/>',
    '      </linearGradient>',
    '    </defs>',
    '    <path class="blog-pet__antenna" d="M64 18v-8m-7 0h14" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>',
    '    <rect x="22" y="20" width="84" height="62" rx="28" fill="url(#pet-body-gradient)" stroke="#17377d" stroke-width="5"/>',
    '    <rect x="34" y="36" width="60" height="30" rx="13" fill="#102b62"/>',
    '    <circle cx="51" cy="51" r="5" fill="#80ecff"/>',
    '    <circle cx="77" cy="51" r="5" fill="#80ecff"/>',
    '    <path d="M54 60h20" stroke="#80ecff" stroke-width="3" stroke-linecap="round"/>',
    '    <rect x="35" y="76" width="58" height="50" rx="20" fill="url(#pet-body-gradient)" stroke="#17377d" stroke-width="5"/>',
    '    <path d="M50 99h28" stroke="#d9e7ff" stroke-width="5" stroke-linecap="round"/>',
    '    <path class="blog-pet__arm blog-pet__arm--left" d="M36 88 18 104" fill="none" stroke="#315ddc" stroke-width="12" stroke-linecap="round"/>',
    '    <path class="blog-pet__arm blog-pet__arm--right" d="M92 88 112 72" fill="none" stroke="#315ddc" stroke-width="12" stroke-linecap="round"/>',
    '    <path d="M52 124v12m24-12v12" stroke="#17377d" stroke-width="10" stroke-linecap="round"/>',
    '  </svg>',
    '</button>'
  ].join('\n');
}

function enhancePostHtml(html, data) {
  if (!isPost(data)) {
    return html;
  }

  let output = guardMermaidRefreshCallback(html);
  if (output.includes(`href="${CSS_PATH}"`)) {
    return output;
  }

  output = removePostOnlyTypedScript(output);
  output = addBodyClass(output);
  output = output.replace(
    /<\/head>/i,
    `  <link rel="stylesheet" href="${CSS_PATH}" ${MARKER}>\n</head>`
  );
  output = output.replace(
    /<\/body>/i,
    `${petMarkup()}\n<script src="${JS_PATH}" defer ${MARKER}></script>\n</body>`
  );
  return output;
}

function register(hexoInstance) {
  hexoInstance.extend.filter.register('before_post_render', enablePostComments);
  hexoInstance.extend.filter.register('after_render:html', enhancePostHtml);
}

if (typeof hexo !== 'undefined') {
  register(hexo);
}

module.exports = {
  enablePostComments,
  enhancePostHtml,
  guardMermaidRefreshCallback,
  register
};
