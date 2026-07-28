# Comments and Selection Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add anonymous moderated Waline comments and first-party text-selection sharing to Hexo post pages without changing the Hexo/Fluid/GitHub Pages architecture or regressing the mobile performance budget.

**Architecture:** Run Waline 1.41.3 with SQLite behind a dedicated Caddy HTTPS reverse proxy on the existing server. Enable Fluid's native lazy-loaded Waline integration in the Hexo override config. Add an isolated selection-sharing module to the existing post enhancement script; it creates Text Fragment links and uses Web Share with a clipboard fallback.

**Tech Stack:** Hexo 6.3, Fluid 1.9.4, Node.js test runner, browser Clipboard/Web Share APIs, Docker Compose, Waline 1.41.3, SQLite, Caddy 2.

## Global Constraints

- Keep Hexo + Fluid + GitHub Pages unchanged.
- Do not modify or restart the existing `personal-agent` Compose project.
- Caddy may bind only the currently unused public port 443; Waline port 8360 remains internal.
- Anonymous comments are enabled, but every new comment requires moderation.
- Server secrets remain only in `/root/services/zhililab-comments/.env` with mode `600`.
- Existing posts with `comments: false` remain disabled.
- Comments remain lazy-loaded and do not enter the LCP path.
- Selection sharing loads no third-party SDK and sends selected text nowhere unless the user explicitly shares it.
- Representative mobile 4G LCP must remain at or below 2 seconds and CLS at or below 0.1.

---

### Task 1: Add reproducible Waline service manifests

**Files:**
- Create: `ops/waline/docker-compose.yml`
- Create: `ops/waline/Caddyfile`
- Create: `ops/waline/.env.example`
- Create: `test/waline-deployment.test.js`

**Interfaces:**
- Consumes: DNS name `comments.zhililab.cn` and server port 443.
- Produces: a two-service Compose application with Caddy proxying to internal service `waline:8360`.

- [ ] **Step 1: Write the failing manifest tests**

```js
test('Waline stays internal and persists SQLite data', () => {
  const compose = read('ops/waline/docker-compose.yml');
  assert.match(compose, /lizheming\/waline:1\.41\.3/);
  assert.match(compose, /SQLITE_PATH:\s*\/app\/data/);
  assert.match(compose, /\.\/data:\/app\/data/);
  assert.doesNotMatch(compose, /8360:8360/);
});

test('Caddy owns HTTPS only and proxies the comment hostname', () => {
  const compose = read('ops/waline/docker-compose.yml');
  const caddyfile = read('ops/waline/Caddyfile');
  assert.match(compose, /"443:443"/);
  assert.doesNotMatch(compose, /"80:80"/);
  assert.match(caddyfile, /comments\.zhililab\.cn/);
  assert.match(caddyfile, /reverse_proxy waline:8360/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test test/waline-deployment.test.js
```

Expected: FAIL because `ops/waline/docker-compose.yml` does not exist.

- [ ] **Step 3: Add the minimal manifests**

`ops/waline/docker-compose.yml`:

```yaml
services:
  waline:
    image: lizheming/waline:1.41.3
    restart: unless-stopped
    env_file: .env
    environment:
      SQLITE_PATH: /app/data
      SITE_NAME: ZHILI
      SITE_URL: http://www.zhililab.cn
      SERVER_URL: https://comments.zhililab.cn
      SECURE_DOMAINS: www.zhililab.cn,zhililab.cn,comments.zhililab.cn
      COMMENT_AUDIT: "true"
      IPQPS: "60"
      DISABLE_USERAGENT: "true"
      DISABLE_REGION: "true"
    volumes:
      - ./data:/app/data
    networks: [comments]

  caddy:
    image: caddy:2.10.0-alpine
    restart: unless-stopped
    depends_on: [waline]
    ports:
      - "443:443"
      - "443:443/udp"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./caddy-data:/data
      - ./caddy-config:/config
    networks: [comments]

networks:
  comments:
    name: zhililab-comments
```

`ops/waline/Caddyfile`:

```caddyfile
comments.zhililab.cn {
  encode zstd gzip
  reverse_proxy waline:8360
}
```

`ops/waline/.env.example`:

```dotenv
JWT_TOKEN=development-only-example-token-0000000000000000000000000000
```

- [ ] **Step 4: Run the manifest tests and Compose validation**

Run:

```bash
node --test test/waline-deployment.test.js
docker compose -f ops/waline/docker-compose.yml --env-file ops/waline/.env.example config --quiet
```

Expected: PASS and exit 0.

- [ ] **Step 5: Commit**

```bash
git add ops/waline test/waline-deployment.test.js
git commit -m "ops: define private Waline comment service"
```

---

### Task 2: Implement text-selection share primitives

**Files:**
- Modify: `source/js/blog-reading-experience.js`
- Modify: `test/blog-reading-experience-client.test.js`

**Interfaces:**
- Produces:
  - `normalizeSelection(text: string): string`
  - `buildTextFragmentUrl(location: LocationLike, text: string): string`
  - `buildSharePayload(document: DocumentLike, location: LocationLike, text: string): {title, text, url}`
  - `copyText(text: string, document: DocumentLike, navigator: NavigatorLike): Promise<boolean>`
  - `initSelectionShare(document: DocumentLike, window: WindowLike): boolean`

- [ ] **Step 1: Write failing pure-function tests**

```js
test('builds a bounded Text Fragment share payload', () => {
  const text = '  Agentic DevOps  '.repeat(40);
  const payload = buildSharePayload(
    { title: 'Agentic DevOps 调研报告' },
    { origin: 'http://www.zhililab.cn', pathname: '/post/', search: '' },
    text
  );
  assert.equal(payload.title, 'Agentic DevOps 调研报告');
  assert.equal(payload.text.length <= 280, true);
  assert.match(payload.url, /\/post\/#:~:text=/);
  assert.doesNotMatch(payload.url, /\?/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test test/blog-reading-experience-client.test.js
```

Expected: FAIL because `buildSharePayload` is not exported.

- [ ] **Step 3: Implement pure helpers**

```js
function normalizeSelection(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 280);
}

function buildTextFragmentUrl(locationObject, text) {
  const base = `${locationObject.origin}${locationObject.pathname}`;
  return `${base}#:~:text=${encodeURIComponent(normalizeSelection(text))}`;
}

function buildSharePayload(documentObject, locationObject, text) {
  const selected = normalizeSelection(text);
  return {
    title: documentObject.title,
    text: `“${selected}”`,
    url: buildTextFragmentUrl(locationObject, selected)
  };
}
```

- [ ] **Step 4: Add failing behavior tests**

Cover:

- selection outside `.markdown-body` is ignored;
- empty selection is ignored;
- toolbar has `分享` and `复制引用` buttons;
- `navigator.share(payload)` is preferred;
- absent/rejected Web Share falls back to clipboard;
- Escape, scroll and outside pointer events close the toolbar.

Run the focused test after each assertion is added and verify it fails for the missing behavior.

- [ ] **Step 5: Implement the selection toolbar**

Add a single `#selection-share-toolbar` element at boot. Use `selectionchange`,
`mouseup`, `touchend`, `keydown`, `scroll`, and `pointerdown` listeners. Position
it from `Range.getBoundingClientRect()` with viewport clamping. Implement
clipboard fallback with a temporary readonly textarea and `document.execCommand('copy')`.

- [ ] **Step 6: Run focused tests and commit**

```bash
node --test test/blog-reading-experience-client.test.js
git add source/js/blog-reading-experience.js test/blog-reading-experience-client.test.js
git commit -m "feat: add text selection sharing"
```

Expected: all focused tests PASS.

---

### Task 3: Style and inject the share toolbar

**Files:**
- Modify: `source/css/blog-reading-experience.css`
- Modify: `scripts/blog-reading-experience.js`
- Modify: `test/blog-reading-experience-assets.test.js`
- Modify: `test/blog-reading-experience-rendered.test.js`

**Interfaces:**
- Consumes: `#selection-share-toolbar` created by `initSelectionShare`.
- Produces: accessible desktop/mobile toolbar styling without additional assets.

- [ ] **Step 1: Write failing CSS and rendered-output tests**

Assert that:

```js
assert.match(css, /#selection-share-toolbar/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
assert.match(html, /blog-reading-experience\.js/);
assert.doesNotMatch(homeHtml, /selection-share-toolbar/);
```

- [ ] **Step 2: Verify RED**

```bash
node --test test/blog-reading-experience-assets.test.js test/blog-reading-experience-rendered.test.js
```

Expected: FAIL because toolbar styling is absent.

- [ ] **Step 3: Add minimal scoped styles**

Add fixed-position styling with `z-index: 110`, 44px touch targets, light/dark
CSS variables, visible focus rings, success/error states, a mobile maximum width,
and no animation under reduced motion. Keep all selectors scoped to
`.blog-post-enhanced`.

- [ ] **Step 4: Verify GREEN and commit**

```bash
npm run clean
npm run build
node --test test/blog-reading-experience-assets.test.js test/blog-reading-experience-rendered.test.js
git add source/css/blog-reading-experience.css scripts/blog-reading-experience.js test/blog-reading-experience-assets.test.js test/blog-reading-experience-rendered.test.js
git commit -m "style: add accessible selection share toolbar"
```

---

### Task 4: Enable Fluid Waline comments

**Files:**
- Modify: `_config.yml`
- Modify: `test/blog-reading-experience-rendered.test.js`

**Interfaces:**
- Consumes: `https://comments.zhililab.cn`.
- Produces: lazy-loaded Waline container on posts without `comments: false`.

- [ ] **Step 1: Write failing rendered tests**

```js
assert.match(articleHtml, /id="comments"/);
assert.match(articleHtml, /id="waline"/);
assert.match(articleHtml, /https:\/\/comments\.zhililab\.cn/);
assert.match(articleHtml, /评论提交后需审核/);
assert.doesNotMatch(homeHtml, /id="waline"/);
```

- [ ] **Step 2: Verify RED**

```bash
npm run clean
npm run build
node --test test/blog-reading-experience-rendered.test.js
```

Expected: FAIL because Waline is not configured.

- [ ] **Step 3: Add Fluid override configuration**

Merge into the existing `theme_config`:

```yaml
theme_config:
  post:
    mermaid:
      enable: true
      specific: true
      options:
        theme: default
    comments:
      enable: true
      type: waline
  waline:
    serverURL: https://comments.zhililab.cn
    path: window.location.pathname
    meta: [nick, mail, link]
    requiredMeta: [nick]
    lang: zh-cn
    dark: 'html[data-user-color-scheme="dark"]'
    pageSize: 10
    placeholder: 评论提交后需审核，审核通过后公开显示
  lazyload:
    enable: true
    onlypost: false
    offset_factor: 1
```

- [ ] **Step 4: Build, verify and commit**

```bash
npm run clean
npm run build
npm test
git diff --check
git add _config.yml test/blog-reading-experience-rendered.test.js
git commit -m "feat: enable moderated Waline comments"
```

Expected: complete test suite PASS.

---

### Task 5: Deploy and verify the Waline backend

**Files:**
- Source: `ops/waline/*`
- Remote destination: `/root/services/zhililab-comments`

**Interfaces:**
- Produces: `https://comments.zhililab.cn` and persistent SQLite data.

- [ ] **Step 1: Verify prerequisites**

```bash
dig @otter.dnspod.net comments.zhililab.cn A +short
ssh root@1.117.63.81 'ss -lnt | grep -E ":(443|8360) " || true'
```

Expected: DNS returns `1.117.63.81`; ports 443 and 8360 are unused.

- [ ] **Step 2: Upload manifests without secrets**

Create `/root/services/zhililab-comments`, upload `docker-compose.yml` and
`Caddyfile`, create `data`, `caddy-data`, and `caddy-config`.

- [ ] **Step 3: Create the secret file on the server**

Generate `JWT_TOKEN` with `openssl rand -hex 32` directly on the server. Write
only `JWT_TOKEN=<value>` to `.env`, set mode `600`, and never print the value.

- [ ] **Step 4: Validate and start**

```bash
docker compose config --quiet
docker compose pull
docker compose up -d
docker compose ps
```

Expected: `waline` and `caddy` are running; Waline has no published host port.

- [ ] **Step 5: Verify HTTPS and API**

```bash
curl --fail --silent --show-error https://comments.zhililab.cn/
curl --fail --silent --show-error 'https://comments.zhililab.cn/api/comment?path=%2Fhealth-check%2F&pageSize=1'
```

Expected: trusted HTTPS and valid Waline response. Confirm the SQLite file exists
under the persistent `data` directory.

---

### Task 6: Browser QA, source publish, Pages deploy and live verification

**Files:**
- All files committed by Tasks 1-4.

- [ ] **Step 1: Run full local verification**

```bash
npm run clean
npm run build
npm test
git diff --check
```

Expected: zero failures.

- [ ] **Step 2: Browser-test the local build**

At desktop and mobile widths verify:

- article comments container exists;
- comment network request does not start before the comment region approaches;
- selecting正文 shows the toolbar;
- system-share stub receives title, quote, and Text Fragment URL;
- clipboard fallback copies the same payload;
- no console errors.

- [ ] **Step 3: Re-run mobile 4G performance measurement**

```bash
npm run measure:performance -- \
  'http://127.0.0.1:4018/2026/07/23/2026-07-23-kubernetes-pod-creation-workflow/' \
  'http://127.0.0.1:4018/2026/07/22/2026-07-22-agentic-devops-practice-report/'
```

Expected: every page passes LCP ≤ 2000ms and CLS ≤ 0.1.

- [ ] **Step 4: Push source branch**

Fast-forward the isolated branch into `dev-optimize`, preserving unrelated
working-tree changes. Push `dev-optimize` and verify the remote commit.

- [ ] **Step 5: Deploy Hexo Pages**

Deploy the already-tested `public/` through `npx hexo deploy`. Verify remote
`master` advances to the generated deployment commit.

- [ ] **Step 6: Verify production**

Check representative post HTML, CSS, JS, Waline API, trusted HTTPS, comment lazy
load, selection toolbar behavior, copy/share payload, console errors, and mobile
4G performance. Confirm no server secret appears in generated files or Git.

- [ ] **Step 7: Hand off administrator registration**

Provide `https://comments.zhililab.cn/ui/register` to the user. Do not create or
store the administrator password. Explain that the first registered account is
the administrator and must approve anonymous comments before they appear.
