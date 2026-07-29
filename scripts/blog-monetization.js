'use strict';

const PRIVACY_PATH = '/privacy/';
const PRIVACY_MARKER = 'data-blog-privacy-link';
const CLIENT_PATTERN = /^ca-pub-\d{16}$/;
const SLOT_PATTERN = /^\d{5,20}$/;
const AD_MARKER = 'data-blog-controlled-ad';
const AD_CSS_PATH = '/css/blog-monetization.css';
const AD_JS_PATH = '/js/blog-monetization.js';

function normalizeAdsenseConfig(value = {}) {
  const client = String(value.client || '').trim();
  const slot = String(value.slot || '').trim();
  const enabled = value.enabled === true;
  return {
    enabled,
    client,
    slot,
    ready: enabled && CLIENT_PATTERN.test(client) && SLOT_PATTERN.test(slot)
  };
}

function injectPrivacyLink(html) {
  if (!html.includes('<footer') || html.includes(PRIVACY_MARKER)) return html;
  return html.replace(
    /<\/footer>/i,
    `  <p class="blog-privacy-link" ${PRIVACY_MARKER}><a href="${PRIVACY_PATH}">隐私与 Cookie 政策</a></p>\n</footer>`
  );
}

function isPost(data) {
  return Boolean(
    data &&
    (
      (data.page && data.page.layout === 'post') ||
      data.layout === 'post'
    )
  );
}

function buildAdMarkup(config) {
  return [
    `<aside id="blog-controlled-ad" class="blog-ad-shell" ${AD_MARKER}`,
    `  data-ad-client="${config.client}" data-ad-slot="${config.slot}"`,
    '  data-state="pending" aria-label="广告">',
    '  <span class="blog-ad-label" aria-hidden="true">广告</span>',
    '  <ins class="adsbygoogle" style="display:block"',
    `    data-ad-client="${config.client}"`,
    `    data-ad-slot="${config.slot}"`,
    '    data-ad-format="auto" data-full-width-responsive="true"></ins>',
    '</aside>'
  ].join('\n');
}

function injectControlledAd(html, data, config) {
  if (
    !config.ready ||
    !isPost(data) ||
    (data.page && data.page.ads === false) ||
    html.includes(AD_MARKER) ||
    !/<article id="comments"(?=[\s>])/i.test(html)
  ) {
    return html;
  }

  let output = html.replace(
    /<article id="comments"(?=[\s>])/i,
    `${buildAdMarkup(config)}\n<article id="comments"`
  );
  output = output.replace(
    /<\/head>/i,
    `  <link rel="stylesheet" href="${AD_CSS_PATH}" ${AD_MARKER}>\n</head>`
  );
  return output.replace(
    /<\/body>/i,
    `<script src="${AD_JS_PATH}" defer ${AD_MARKER}></script>\n</body>`
  );
}

function createMonetizationFilter(config) {
  const normalized = normalizeAdsenseConfig(config);
  return (html, data) => injectControlledAd(
    injectPrivacyLink(html),
    data,
    normalized
  );
}

function register(hexoInstance) {
  hexoInstance.extend.filter.register(
    'after_render:html',
    createMonetizationFilter(hexoInstance.config.adsense)
  );
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = {
  buildAdMarkup,
  createMonetizationFilter,
  injectControlledAd,
  injectPrivacyLink,
  normalizeAdsenseConfig,
  register
};
