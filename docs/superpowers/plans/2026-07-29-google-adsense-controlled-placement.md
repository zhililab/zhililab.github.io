# Google AdSense Controlled Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a disabled-by-default Google AdSense integration, a Chinese privacy and cookie policy, and one lazy-loaded post-end ad slot that can be enabled only after the site is approved.

**Architecture:** A focused Hexo script owns configuration validation, footer-policy-link injection, and post-only ad markup. A small browser module owns viewport-triggered loading and failure collapse; a separate CSS file reserves stable space only while an active ad is loading. This plan ends with the review-preparation deployment containing the privacy page and dormant integration with zero Google ad requests; approved-account activation receives a separate exact-value plan after the owner has real AdSense identifiers.

**Tech Stack:** Hexo 6, Fluid theme generated HTML, Node.js built-in test runner, browser-native IntersectionObserver and MutationObserver, Google AdSense manual responsive display unit, GitHub Pages.

## Global Constraints

- Keep the Hexo + Fluid + GitHub Pages architecture unchanged.
- Show at most one ad, only on post detail pages, after post content and before comments.
- Do not enable Auto ads, anchor ads, interstitial ads, or full-screen ads.
- Do not load Google ad code or render an empty ad placeholder until all production settings are valid and explicitly enabled.
- Never commit a fake Publisher ID, fake slot ID, fake `ads.txt` record, password, identity document, tax detail, address, or payment detail.
- Preserve `ads: false` as a per-post opt-out.
- Keep mobile normal-4G cold-cache LCP at or below 2 seconds and CLS at or below 0.1.
- Keep body-image display near 300 ms after it enters the viewport.
- Preserve the existing uncommitted `source/assets/images/cover/HelloWorld_Cover.jpg` and browser-preview files.

---

## File Structure

- Create `scripts/blog-monetization.js`: validate public AdSense identifiers, inject the global privacy link, and inject one active post-end ad unit.
- Create `source/js/blog-monetization.js`: load the official AdSense script once when the slot approaches the viewport, initialize one unit, and collapse failed or unfilled slots.
- Create `source/css/blog-monetization.css`: identify the ad as advertising, reserve stable loading space, and collapse failure states.
- Create `source/privacy/index.md`: Chinese privacy and cookie policy for Google ads, Waline comments, visitor choices, and update dates.
- Create `test/blog-monetization-filter.test.js`: unit tests for disabled state, identifier validation, page scope, order, opt-out, and footer-link idempotence.
- Create `test/blog-monetization-client.test.js`: browser-module tests for lazy loading, deduplication, initialization, and failure collapse.
- Modify `test/blog-reading-experience-rendered.test.js`: generated-site assertions for the privacy route, footer link, and zero-request first-stage output.
- Modify `_config.yml`: add disabled AdSense configuration with empty public identifiers.
- Create `docs/operations/google-adsense-onboarding.md`: exact owner-only registration, review, CMP, ad-unit, and handoff procedure.

---

### Task 1: Dormant Configuration and Global Privacy Link

**Files:**
- Create: `scripts/blog-monetization.js`
- Create: `test/blog-monetization-filter.test.js`
- Modify: `_config.yml`

**Interfaces:**
- Consumes: `hexo.config.adsense` with `{ enabled, client, slot }`.
- Produces: `normalizeAdsenseConfig(value)`, `injectPrivacyLink(html)`, `createMonetizationFilter(config)`, and `register(hexoInstance)`.

- [ ] **Step 1: Write failing configuration and footer-link tests**

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  injectPrivacyLink,
  normalizeAdsenseConfig
} = require('../scripts/blog-monetization');

test('keeps monetization disabled until all real public identifiers are valid', () => {
  assert.deepEqual(normalizeAdsenseConfig(), {
    enabled: false,
    client: '',
    slot: '',
    ready: false
  });
  assert.equal(normalizeAdsenseConfig({
    enabled: true,
    client: 'ca-pub-0000000000000000',
    slot: ''
  }).ready, false);
  assert.equal(normalizeAdsenseConfig({
    enabled: true,
    client: 'ca-pub-1234567890123456',
    slot: '1234567890'
  }).ready, true);
});

test('adds one privacy link to a generated footer', () => {
  const html = '<html><body><footer><div class="footer-inner"></div></footer></body></html>';
  const output = injectPrivacyLink(html);

  assert.equal((output.match(/href="\/privacy\/"/g) || []).length, 1);
  assert.match(output, />隐私与 Cookie 政策</);
  assert.equal(injectPrivacyLink(output), output);
});
```

- [ ] **Step 2: Run the filter test to verify it fails**

Run:

```bash
npm test -- --test-name-pattern='monetization|privacy link'
```

Expected: FAIL because `scripts/blog-monetization.js` does not exist.

- [ ] **Step 3: Add disabled configuration**

Append to `_config.yml`:

```yaml
adsense:
  enabled: false
  client: ''
  slot: ''
```

- [ ] **Step 4: Implement validation and idempotent footer injection**

Create `scripts/blog-monetization.js` with:

```js
'use strict';

const PRIVACY_PATH = '/privacy/';
const PRIVACY_MARKER = 'data-blog-privacy-link';
const CLIENT_PATTERN = /^ca-pub-\d{16}$/;
const SLOT_PATTERN = /^\d{5,20}$/;

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
  createMonetizationFilter,
  injectPrivacyLink,
  normalizeAdsenseConfig,
  register
};
```

Temporarily define this dormant function above `createMonetizationFilter` so Task 1 is independently runnable:

```js
function injectControlledAd(html) {
  return html;
}
```

- [ ] **Step 5: Run the focused tests**

Run:

```bash
node --test test/blog-monetization-filter.test.js
```

Expected: 2 tests PASS.

- [ ] **Step 6: Commit the dormant configuration boundary**

```bash
git add _config.yml scripts/blog-monetization.js test/blog-monetization-filter.test.js
git commit -m "feat: add dormant AdSense configuration"
```

---

### Task 2: Chinese Privacy and Cookie Policy

**Files:**
- Create: `source/privacy/index.md`
- Modify: `test/blog-reading-experience-rendered.test.js`

**Interfaces:**
- Consumes: the `/privacy/` footer URL from Task 1.
- Produces: a generated `/privacy/index.html` policy route with `comments: false` and `ads: false`.

- [ ] **Step 1: Write the failing generated-route assertions**

Append to `test/blog-reading-experience-rendered.test.js`:

```js
test('generated site exposes the privacy policy from every footer', () => {
  const home = read(path.join(publicRoot, 'index.html'));
  const article = read(articlePath);
  const privacyPath = path.join(publicRoot, 'privacy', 'index.html');
  const privacy = read(privacyPath);

  assert.match(home, /href="\/privacy\/"[^>]*>隐私与 Cookie 政策</);
  assert.match(article, /href="\/privacy\/"[^>]*>隐私与 Cookie 政策</);
  assert.match(privacy, /隐私与 Cookie 政策/);
  assert.match(privacy, /Google/);
  assert.match(privacy, /Cookie/);
  assert.match(privacy, /Waline/);
  assert.doesNotMatch(privacy, /id="waline"/);
});
```

- [ ] **Step 2: Run the rendered test to verify it fails**

Run:

```bash
npm run clean
npm run build
node --test test/blog-reading-experience-rendered.test.js
```

Expected: FAIL because `public/privacy/index.html` does not exist.

- [ ] **Step 3: Create the policy page**

Create `source/privacy/index.md`:

```markdown
---
title: 隐私与 Cookie 政策
date: 2026-07-29
layout: page
comments: false
ads: false
---

## 适用范围

本政策适用于 ZHILI 博客（www.zhililab.cn），说明本站在提供文章、评论和广告服务时如何处理访客信息。

## Google 广告与 Cookie

本站计划使用 Google AdSense 展示广告。Google 及其合作伙伴可能使用 Cookie、Web Beacon、IP 地址或其他标识来提供、衡量和改进广告。个性化广告可能参考访客对本站或其他网站的访问活动。

访客可以通过 [Google 广告设置](https://adssettings.google.com/) 管理或关闭个性化广告。有关 Google 如何使用合作伙伴网站数据的信息，请参阅 [Google 合作伙伴网站或应用的数据使用说明](https://policies.google.com/technologies/partner-sites)。

在需要征得同意的地区，本站使用 Google 提供的同意管理消息收集和记录广告相关选择。

## 评论服务

本站使用独立部署的 Waline 提供评论。访客提交评论时填写的昵称、可选邮箱、可选网址、评论内容以及服务安全运行所需的网络信息由评论服务处理。评论数据与 Google 广告数据由不同服务分别处理。

## 访客选择

访客可以拒绝或限制浏览器 Cookie、使用广告拦截功能、在 Google 广告设置中关闭个性化广告，或不使用评论功能。禁用部分功能不会影响文章正文阅读。

## 政策更新

本站会在服务或规则发生变化时更新本政策，并在本页标记生效日期。

生效日期：2026-07-29。
```

- [ ] **Step 4: Rebuild and run rendered tests**

Run:

```bash
npm run clean
npm run build
node --test test/blog-reading-experience-rendered.test.js
```

Expected: all rendered tests PASS.

- [ ] **Step 5: Commit the policy**

```bash
git add source/privacy/index.md test/blog-reading-experience-rendered.test.js
git commit -m "feat: add privacy and cookie policy"
```

---

### Task 3: One Controlled Post-End Ad Slot

**Files:**
- Modify: `scripts/blog-monetization.js`
- Modify: `test/blog-monetization-filter.test.js`

**Interfaces:**
- Consumes: normalized `{ enabled, client, slot, ready }` from Task 1 and Hexo `data.page.layout` plus `data.page.ads`.
- Produces: `injectControlledAd(html, data, config)` and `buildAdMarkup(config)`.

- [ ] **Step 1: Write failing scope, ordering, opt-out, and deduplication tests**

Append to `test/blog-monetization-filter.test.js`:

```js
const {
  injectControlledAd
} = require('../scripts/blog-monetization');

const active = {
  enabled: true,
  client: 'ca-pub-1234567890123456',
  slot: '1234567890',
  ready: true
};
const postHtml = [
  '<html><head></head><body><main>',
  '<article class="post-content"><div class="markdown-body">正文</div>',
  '<article id="comments"></article></article>',
  '</main><footer></footer></body></html>'
].join('');

test('injects one ad after post content and before comments', () => {
  const output = injectControlledAd(postHtml, {
    page: { layout: 'post' }
  }, active);

  assert.equal((output.match(/id="blog-controlled-ad"/g) || []).length, 1);
  assert.ok(output.indexOf('正文') < output.indexOf('id="blog-controlled-ad"'));
  assert.ok(output.indexOf('id="blog-controlled-ad"') < output.indexOf('id="comments"'));
  assert.equal(injectControlledAd(output, {
    page: { layout: 'post' }
  }, active), output);
});

test('does not inject without active valid configuration', () => {
  const output = injectControlledAd(postHtml, {
    page: { layout: 'post' }
  }, normalizeAdsenseConfig());

  assert.doesNotMatch(output, /blog-controlled-ad|adsbygoogle|pagead2/);
});

test('does not inject on non-post pages or explicit opt-out posts', () => {
  assert.doesNotMatch(
    injectControlledAd(postHtml, { page: { layout: 'index' } }, active),
    /blog-controlled-ad/
  );
  assert.doesNotMatch(
    injectControlledAd(postHtml, {
      page: { layout: 'post', ads: false }
    }, active),
    /blog-controlled-ad/
  );
});
```

- [ ] **Step 2: Run the filter test to verify the new assertions fail**

Run:

```bash
node --test test/blog-monetization-filter.test.js
```

Expected: FAIL because the dormant `injectControlledAd` does not add a slot.

- [ ] **Step 3: Implement the post-only slot**

Replace the dormant function in `scripts/blog-monetization.js` with:

```js
const AD_MARKER = 'data-blog-controlled-ad';
const AD_CSS_PATH = '/css/blog-monetization.css';
const AD_JS_PATH = '/js/blog-monetization.js';

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
    !/<article id="comments"\b/i.test(html)
  ) {
    return html;
  }

  let output = html.replace(
    /<article id="comments"\b/i,
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
```

Export `buildAdMarkup` and `injectControlledAd`.

- [ ] **Step 4: Run focused tests**

Run:

```bash
node --test test/blog-monetization-filter.test.js
```

Expected: all filter tests PASS.

- [ ] **Step 5: Commit the controlled HTML boundary**

```bash
git add scripts/blog-monetization.js test/blog-monetization-filter.test.js
git commit -m "feat: add controlled post-end ad slot"
```

---

### Task 4: Lazy Ad Loading and Failure Collapse

**Files:**
- Create: `source/js/blog-monetization.js`
- Create: `source/css/blog-monetization.css`
- Create: `test/blog-monetization-client.test.js`

**Interfaces:**
- Consumes: `#blog-controlled-ad[data-ad-client][data-ad-slot]`.
- Produces: `loadAdsenseScript(documentObject, client)`, `watchAdStatus(container, windowObject)`, and `initControlledAd(documentObject, windowObject)`.

- [ ] **Step 1: Write failing browser-module tests**

Create `test/blog-monetization-client.test.js`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  initControlledAd,
  loadAdsenseScript,
  watchAdStatus
} = require('../source/js/blog-monetization');

function createDocument() {
  const appended = [];
  const documentObject = {
    head: { appendChild(node) { appended.push(node); } },
    createElement() {
      return {
        dataset: {},
        listeners: {},
        addEventListener(type, handler) {
          this.listeners[type] = handler;
        }
      };
    },
    querySelector() { return null; }
  };
  return { appended, documentObject };
}

test('loads the official script once with the configured client', () => {
  const { appended, documentObject } = createDocument();

  const first = loadAdsenseScript(documentObject, 'ca-pub-1234567890123456');
  const second = loadAdsenseScript(documentObject, 'ca-pub-1234567890123456');

  assert.equal(first, second);
  assert.equal(appended.length, 1);
  assert.equal(
    appended[0].src,
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456'
  );
  assert.equal(appended[0].crossOrigin, 'anonymous');
});

test('does nothing when no active slot exists', () => {
  assert.equal(initControlledAd({
    querySelector() { return null; }
  }, {}), false);
});

test('waits for the slot to approach the viewport before requesting an ad', async () => {
  const { appended, documentObject } = createDocument();
  const unit = {
    getAttribute() { return null; }
  };
  const container = {
    dataset: {
      adClient: 'ca-pub-1234567890123456',
      adSlot: '1234567890'
    },
    querySelector() { return unit; }
  };
  documentObject.querySelector = () => container;

  let intersectionCallback;
  const windowObject = {
    adsbygoogle: [],
    addEventListener() {},
    IntersectionObserver: class {
      constructor(callback) {
        intersectionCallback = callback;
      }
      observe() {}
      disconnect() {}
    }
  };

  assert.equal(initControlledAd(documentObject, windowObject), true);
  assert.equal(appended.length, 0);

  intersectionCallback([{ isIntersecting: true, target: container }]);
  assert.equal(appended.length, 1);
  appended[0].listeners.load();
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(windowObject.adsbygoogle.length, 1);
  assert.equal(container.dataset.state, 'loading');
});

test('collapses an unfilled ad', () => {
  let status = null;
  let mutationCallback;
  const unit = {
    getAttribute() { return status; }
  };
  const container = {
    dataset: {},
    querySelector() { return unit; }
  };
  const windowObject = {
    MutationObserver: class {
      constructor(callback) {
        mutationCallback = callback;
      }
      observe() {}
      disconnect() {}
    }
  };

  assert.equal(watchAdStatus(container, windowObject), true);
  status = 'unfilled';
  mutationCallback();

  assert.equal(container.dataset.state, 'unfilled');
});
```

- [ ] **Step 2: Run the client test to verify it fails**

Run:

```bash
node --test test/blog-monetization-client.test.js
```

Expected: FAIL because `source/js/blog-monetization.js` does not exist.

- [ ] **Step 3: Implement lazy loading and status handling**

Create `source/js/blog-monetization.js`:

```js
'use strict';

const scriptPromises = new WeakMap();

function loadAdsenseScript(documentObject, client) {
  if (scriptPromises.has(documentObject)) {
    return scriptPromises.get(documentObject);
  }
  const scriptPromise = new Promise((resolve, reject) => {
    const script = documentObject.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', reject, { once: true });
    documentObject.head.appendChild(script);
  });
  scriptPromises.set(documentObject, scriptPromise);
  return scriptPromise;
}

function watchAdStatus(container, windowObject) {
  const unit = container.querySelector('.adsbygoogle');
  if (!unit || typeof windowObject.MutationObserver !== 'function') return false;
  const observer = new windowObject.MutationObserver(() => {
    const status = unit.getAttribute('data-ad-status');
    if (status === 'filled') container.dataset.state = 'filled';
    if (status === 'unfilled') {
      container.dataset.state = 'unfilled';
      observer.disconnect();
    }
  });
  observer.observe(unit, {
    attributes: true,
    attributeFilter: ['data-ad-status']
  });
  return true;
}

function initControlledAd(documentObject, windowObject) {
  const container = documentObject.querySelector('#blog-controlled-ad');
  if (!container || container.dataset.initialized === 'true') return false;
  const client = container.dataset.adClient;
  if (!/^ca-pub-\d{16}$/.test(client || '')) return false;

  container.dataset.initialized = 'true';
  watchAdStatus(container, windowObject);

  const activate = () => {
    container.dataset.state = 'loading';
    loadAdsenseScript(documentObject, client)
      .then(() => {
        windowObject.adsbygoogle = windowObject.adsbygoogle || [];
        windowObject.adsbygoogle.push({});
      })
      .catch(() => {
        container.dataset.state = 'failed';
      });
  };

  if (typeof windowObject.IntersectionObserver === 'function') {
    const observer = new windowObject.IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      activate();
    }, { rootMargin: '320px 0px' });
    observer.observe(container);
    return true;
  }

  windowObject.addEventListener('load', activate, { once: true });
  return true;
}

const api = {
  initControlledAd,
  loadAdsenseScript,
  watchAdStatus
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => initControlledAd(document, window),
      { once: true }
    );
  } else {
    initControlledAd(document, window);
  }
}
```

- [ ] **Step 4: Add stable and collapsible styles**

Create `source/css/blog-monetization.css`:

```css
.blog-ad-shell {
  width: 100%;
  min-height: 7.5rem;
  margin: 2.5rem 0 2rem;
  padding-top: 1.25rem;
  overflow: hidden;
  border-top: 1px solid var(--line-color, rgba(127, 127, 127, 0.22));
}

.blog-ad-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--sec-text-color, #78818d);
  font-size: 0.72rem;
  line-height: 1;
  text-align: center;
  letter-spacing: 0.08em;
}

.blog-ad-shell[data-state='failed'],
.blog-ad-shell[data-state='unfilled'] {
  display: none;
}

@media (max-width: 575.98px) {
  .blog-ad-shell {
    min-height: 6.25rem;
    margin: 2rem 0 1.75rem;
  }
}
```

- [ ] **Step 5: Run the client and asset tests**

Run:

```bash
node --test test/blog-monetization-client.test.js test/blog-monetization-filter.test.js
```

Expected: all monetization tests PASS.

- [ ] **Step 6: Commit the lazy client**

```bash
git add source/js/blog-monetization.js source/css/blog-monetization.css test/blog-monetization-client.test.js
git commit -m "feat: lazy-load controlled AdSense unit"
```

---

### Task 5: First-Stage Generated-Site Safety

**Files:**
- Modify: `test/blog-reading-experience-rendered.test.js`
- Create: `docs/operations/google-adsense-onboarding.md`

**Interfaces:**
- Consumes: disabled `_config.yml`, generated privacy page, and dormant monetization module.
- Produces: proof that the review-preparation deployment emits zero Google ad requests and an owner-facing registration checklist.

- [ ] **Step 1: Add disabled-production rendered assertions**

Append to `test/blog-reading-experience-rendered.test.js`:

```js
test('first-stage build makes zero AdSense requests and renders no empty slot', () => {
  const article = read(articlePath);
  const home = read(path.join(publicRoot, 'index.html'));

  for (const html of [article, home]) {
    assert.doesNotMatch(html, /blog-controlled-ad/);
    assert.doesNotMatch(html, /adsbygoogle/);
    assert.doesNotMatch(html, /pagead2\.googlesyndication\.com/);
  }
});
```

- [ ] **Step 2: Create the owner onboarding runbook**

Create `docs/operations/google-adsense-onboarding.md` with these exact sections:

```markdown
# Google AdSense 注册与启用操作

## 1. 注册

1. 打开 https://www.google.com/adsense/start/。
2. 使用站长自己的 Google 账号登录。
3. 添加网站 `www.zhililab.cn`。
4. 如实填写姓名、地址、电话、身份、税务和收款信息。
5. 密码、验证码、身份证件、税务和银行卡资料不要发送给实施人员或提交到 Git。

## 2. 网站验证与审核

优先选择 AdSense 后台提供的 meta 标签或 `ads.txt` 验证方式，把后台原始内容交给实施人员。不要自行复制 Auto ads 代码到主题。提交审核后，以 AdSense 后台的站点状态为准。

## 3. 隐私与消息

在 AdSense 的“隐私权和消息”中启用 Google CMP，至少覆盖欧洲经济区、英国和瑞士，并提供“同意”“不同意”“管理选项”。

## 4. 获批后的广告单元

1. 创建一个“展示广告”单元。
2. 类型选择“响应式”。
3. 不启用 Auto ads、锚定广告、插页广告或全屏广告。
4. 记录 `ca-pub-...` Publisher ID、数字广告位 ID，以及后台生成的完整 `ads.txt` 行。
5. 只把以上三个公开发布标识交给实施人员。

## 5. 安全规则

- 不点击自己的广告。
- 不邀请他人点击广告。
- 不制造刷新、曝光或点击。
- 不把广告做成导航、下载按钮或正文内容。
```

- [ ] **Step 3: Run the complete test and build suite**

Run:

```bash
npm test
npm run clean
npm run build
npm test
```

Expected: all source tests and rendered-site tests PASS; generated articles contain no `pagead2.googlesyndication.com`.

- [ ] **Step 4: Run repository hygiene checks**

Run:

```bash
git diff --check
git status --short
git diff --name-only HEAD
```

Expected: only the planned monetization, policy, config, test, and runbook files are changed; `HelloWorld_Cover.jpg`, `.playwright-cli/`, and `.superpowers/` are not staged.

- [ ] **Step 5: Commit first-stage safety evidence**

```bash
git add test/blog-reading-experience-rendered.test.js docs/operations/google-adsense-onboarding.md
git commit -m "test: verify dormant AdSense deployment"
```

---

### Task 6: First-Stage Browser and Performance Verification

**Files:**
- Verify: `public/index.html`
- Verify: `public/privacy/index.html`
- Verify: `public/2026/07/22/2026-07-22-agentic-devops-practice-report/index.html`
- Verify: `public/2026/07/23/2026-07-23-kubernetes-pod-creation-workflow/index.html`

**Interfaces:**
- Consumes: the complete disabled first-stage build.
- Produces: browser and performance evidence suitable for deployment.

- [ ] **Step 1: Start the production-equivalent compressed static server**

Run:

```bash
npm run serve:public
```

Expected: the local generated site is served with production-equivalent compression.

- [ ] **Step 2: Verify visible privacy navigation and normal article interaction**

Using the existing browser validation workflow, verify:

```text
Homepage footer -> “隐私与 Cookie 政策” opens /privacy/
Privacy page -> no comments and no ad placeholder
Article -> text selection share still appears
Article footer -> privacy link is present
Article comments -> Waline remains lazy-loaded
Network -> no request to pagead2.googlesyndication.com
Console -> no errors
```

- [ ] **Step 3: Rerun mobile 4G performance budgets**

Run the existing measurement command against the Kubernetes and Agentic DevOps routes:

```bash
npm run measure:performance -- \
  --base-url http://127.0.0.1:4000 \
  --path /2026/07/23/2026-07-23-kubernetes-pod-creation-workflow/
npm run measure:performance -- \
  --base-url http://127.0.0.1:4000 \
  --path /2026/07/22/2026-07-22-agentic-devops-practice-report/
```

Expected: each route reports LCP <= 2000 ms and CLS <= 0.1; the Kubernetes body image remains near 300 ms or faster after viewport entry.

- [ ] **Step 4: Stop the local server and record results**

Stop only the server process started in Step 1. Record measured LCP, CLS, body-image display time, console errors, failed requests, and the confirmed count of Google ad requests.

---

### Task 7: Deploy Review Preparation

**Files:**
- Deploy: exact source commit produced by Tasks 1-6.
- Publish: generated `public/` from that exact source commit.

**Interfaces:**
- Consumes: all tests, build, browser checks, and performance budgets passing.
- Produces: a live privacy page and dormant AdSense integration with zero live ad requests.

- [ ] **Step 1: Run completion verification on the exact commit**

Run:

```bash
git status --short
git log -1 --oneline
npm test
npm run clean
npm run build
npm test
```

Expected: all tests PASS; unrelated local files remain unstaged.

- [ ] **Step 2: Push the source branch**

Push the exact `dev-optimize` implementation commit without force:

```bash
git push origin dev-optimize
```

Expected: remote `dev-optimize` advances to the verified commit.

- [ ] **Step 3: Publish the exact generated source state**

Use the existing isolated GitHub Pages publication workflow. Preserve the existing case-sensitive `HelloWorld` cover variants and publish only the `public/` tree generated from the verified source commit.

Expected: remote Pages `master` advances once; no repeated deployment while CDN propagation is pending.

- [ ] **Step 4: Verify live propagation**

Verify:

```text
https://www.zhililab.cn/ -> HTTPS 200 and footer privacy link
https://www.zhililab.cn/privacy/ -> HTTPS 200 and policy content
Representative article -> HTTPS 200, comments and selection share still work
Representative article network -> zero Google ad requests
```

Expected: source, Pages, CDN, and live browser evidence are reported separately.

- [ ] **Step 5: Hand off AdSense registration**

Give the owner the link to `docs/operations/google-adsense-onboarding.md`. Stop before adding a Publisher ID, slot ID, verification value, or `ads.txt` record that has not come from the owner's actual AdSense dashboard.

---

## Approved-Account Activation Boundary

This plan deliberately ends after the review-preparation deployment. Production activation cannot be specified safely until the owner supplies the real Publisher ID, responsive slot ID, exact `ads.txt` line, confirms that the AdSense site status is “Ready,” and publishes the Google CMP message.

When those values exist, create a separate activation plan from the same approved design. That plan must contain the exact supplied public values, add `source/ads.txt`, turn on `_config.yml` only after tests are red, rerun the active-slot browser and performance acceptance, and deploy the exact verified source state once. It must report “ad serving enabled” separately from “revenue observed” and must not manufacture an impression or click for testing.
