# AdSense Site Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the AdSense-reviewed root domain consistently crawlable, canonical, indexable, and ready for Search Console submission without rewriting existing articles.

**Architecture:** Hexo owns the canonical `www` origin and generates discovery files during every build. The existing site-identity module owns canonical metadata, while GitHub Pages owns TLS and the apex-to-www redirect. A separate read-only audit script summarizes editorial readiness without mutating posts.

**Tech Stack:** Hexo 6, `hexo-generator-sitemap` 3.0.1, Node.js built-in test runner, GitHub Pages, DNSPod, Google Search Console.

## Global Constraints

- Canonical origin: `https://www.zhililab.cn`.
- Pages `CNAME`: exactly one line, `www.zhililab.cn`.
- Keep `zhililab.cn` as the apex alias; do not delete its GitHub Pages A records.
- Publish `robots.txt` and `sitemap.xml` at the site root.
- Do not rewrite, delete, unpublish, or add `noindex` to existing posts.
- Do not resubmit AdSense during this implementation.
- Do not modify Waline behavior, advertisements, reading layout, images, or pet logic.
- Exclude the pre-existing `HelloWorld_Cover.jpg` and `.playwright-cli/` changes.

> **Integration amendment (2026-08-07):** `origin/dev-optimize` added a newer
> site-identity architecture while this plan was in progress. It intentionally
> establishes `www.zhililab.cn` as canonical. That architecture supersedes the
> earlier apex-canonical snippets below: keep `www` in Hexo and `CNAME`, reuse
> `scripts/blog-site-identity.js`, and make the apex host a strict-HTTPS redirect.

---

### Task 1: Lock the canonical and discovery contract

**Files:**
- Create: `test/site-discovery.test.js`
- Modify: `test/blog-reading-experience-rendered.test.js`
- Read: `_config.yml`
- Read: `source/CNAME`
- Read: `source/privacy/index.md`

**Interfaces:**
- Consumes: source configuration and generated `public/` files.
- Produces: failing tests for canonical origin, robots, Sitemap, and Pages CNAME.

- [ ] **Step 1: Add source-level failing tests**

Create `test/site-discovery.test.js`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('source preserves the established www canonical origin', () => {
  assert.match(read('_config.yml'), /^url: https:\/\/zhililab\.cn$/m);
  assert.equal(read('source/CNAME').trim(), 'www.zhililab.cn');
  assert.match(
    read('source/privacy/index.md'),
    /\[zhililab\.cn\]\(https:\/\/zhililab\.cn\/\)/
  );
});

test('source publishes crawler discovery files', () => {
  const robots = read('source/robots.txt');
  const pkg = JSON.parse(read('package.json'));

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(
    robots,
    /^Sitemap: https:\/\/zhililab\.cn\/sitemap\.xml$/m
  );
  assert.equal(pkg.dependencies['hexo-generator-sitemap'], '3.0.1');
});
```

- [ ] **Step 2: Extend rendered-output tests**

Replace the current CNAME expectation and add a discovery test in
`test/blog-reading-experience-rendered.test.js`:

```js
test('generated Pages CNAME contains one canonical domain', () => {
  const domains = read(path.join(publicRoot, 'CNAME'))
    .split(/\r?\n/)
    .map((domain) => domain.trim())
    .filter(Boolean);

  assert.deepEqual(domains, ['zhililab.cn']);
});

test('generated site exposes canonical crawler discovery files', () => {
  const home = read(path.join(publicRoot, 'index.html'));
  const robots = read(path.join(publicRoot, 'robots.txt'));
  const sitemap = read(path.join(publicRoot, 'sitemap.xml'));

  assert.match(home, /<link rel="canonical" href="https:\/\/zhililab\.cn\/">/);
  assert.match(robots, /Sitemap: https:\/\/zhililab\.cn\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/zhililab\.cn\//);
  assert.doesNotMatch(sitemap, /https:\/\/github\.com\/zhililab/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.zhililab\.cn/);
});
```

Update the privacy-link expectation from `www.zhililab.cn` to `zhililab.cn`.

- [ ] **Step 3: Run the focused tests**

Run:

```bash
node --test test/site-discovery.test.js
node --test --test-name-pattern="canonical domain|crawler discovery" test/blog-reading-experience-rendered.test.js
```

Expected: source tests fail on the old URL/CNAME, and rendered tests fail because
`public/robots.txt` and `public/sitemap.xml` do not exist.

- [ ] **Step 4: Commit the failing tests**

```bash
git add test/site-discovery.test.js test/blog-reading-experience-rendered.test.js
git commit -m "test: define canonical discovery contract"
```

### Task 2: Fix the canonical origin and crawler entry points

**Files:**
- Modify: `_config.yml`
- Modify: `source/CNAME`
- Modify: `source/privacy/index.md`
- Modify: `ops/waline/docker-compose.yml`
- Create: `source/robots.txt`
- Test: `test/site-discovery.test.js`

**Interfaces:**
- Consumes: the canonical contract from Task 1.
- Produces: canonical Hexo metadata, Pages domain source, robots policy, and consistent site links.

- [ ] **Step 1: Change the Hexo canonical URL**

Replace:

```yaml
url: https://github.com/zhililab
```

with:

```yaml
url: https://www.zhililab.cn
```

- [ ] **Step 2: Change the Pages CNAME source**

Set `source/CNAME` to exactly:

```text
zhililab.cn
```

- [ ] **Step 3: Add robots.txt**

Create `source/robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://www.zhililab.cn/sitemap.xml
```

- [ ] **Step 4: Align public site identity references**

Change the privacy-policy site link to:

```markdown
[zhililab.cn](https://www.zhililab.cn/)
```

Change Waline `SITE_URL` to:

```yaml
SITE_URL: https://www.zhililab.cn
```

Keep `SECURE_DOMAINS` unchanged so both apex and www remain accepted.

- [ ] **Step 5: Run source tests**

Run:

```bash
node --test test/site-discovery.test.js
```

Expected: canonical-source assertions pass; dependency assertion still fails.

- [ ] **Step 6: Commit canonical configuration**

```bash
git add _config.yml source/CNAME source/robots.txt source/privacy/index.md \
  ops/waline/docker-compose.yml
git commit -m "fix: align blog canonical domain"
```

### Task 3: Generate and verify the XML Sitemap

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Verify: `public/sitemap.xml`
- Verify: `public/robots.txt`
- Test: `test/site-discovery.test.js`
- Test: `test/blog-reading-experience-rendered.test.js`

**Interfaces:**
- Consumes: `sitemap.path: sitemap.xml` from `_config.yml` and canonical URL from Task 2.
- Produces: deterministic Sitemap generation in every clean Hexo build.

- [ ] **Step 1: Install the pinned generator**

Run:

```bash
npm install --save-exact hexo-generator-sitemap@3.0.1
```

Expected: `package.json` and lockfile contain exact version `3.0.1`.

- [ ] **Step 2: Run source tests**

Run:

```bash
node --test test/site-discovery.test.js
```

Expected: all source-discovery tests pass.

- [ ] **Step 3: Perform a clean build**

Run:

```bash
npm run clean
npm run build
```

Expected: `public/robots.txt` and `public/sitemap.xml` exist.

- [ ] **Step 4: Run rendered and full tests**

Run:

```bash
node --test --test-name-pattern="canonical domain|crawler discovery" test/blog-reading-experience-rendered.test.js
npm test
```

Expected: all tests pass and Sitemap URLs use only `https://www.zhililab.cn`.

- [ ] **Step 5: Commit Sitemap generation**

```bash
git add package.json package-lock.json
git commit -m "feat: generate canonical XML sitemap"
```

### Task 4: Produce a non-destructive content-readiness audit

**Files:**
- Create: `tools/audit-blog-content.js`
- Create: `test/content-readiness-audit.test.js`
- Generate: `docs/audits/2026-08-07-adsense-content-readiness.md`

**Interfaces:**
- Consumes: Markdown files under `source/_posts/`.
- Produces: `auditPosts(postsDir: string): AuditRow[]` and a Markdown report; never writes to posts.

- [ ] **Step 1: Write the failing unit test**

Create `test/content-readiness-audit.test.js` with a temporary fixture containing
one short post and one substantial post. Require the exported `auditPosts`
function and assert each row contains `file`, `title`, `words`, `hasCover`, and
`signals`, with the short post including `thin`.

- [ ] **Step 2: Run the test to verify failure**

Run:

```bash
node --test test/content-readiness-audit.test.js
```

Expected: FAIL because `tools/audit-blog-content.js` does not exist.

- [ ] **Step 3: Implement the read-only audit**

Implement `auditPosts(postsDir)` using `fs.readdirSync`, simple YAML-frontmatter
extraction, Markdown stripping, and Chinese-character/Latin-word counting.
Assign only these transparent signals:

```text
thin             fewer than 600 Chinese characters/Latin words
missing-cover    neither index_img nor banner_img exists
missing-summary  no <!-- more --> marker
```

The CLI renders a table sorted by word count and a section recommending review;
it must not modify any source post.

- [ ] **Step 4: Run the audit tests**

Run:

```bash
node --test test/content-readiness-audit.test.js
```

Expected: PASS.

- [ ] **Step 5: Generate the dated report**

Run:

```bash
node tools/audit-blog-content.js \
  source/_posts \
  docs/audits/2026-08-07-adsense-content-readiness.md
```

Expected: report lists measurable signals and explicitly states that they are
editorial-review cues, not Google policy determinations.

- [ ] **Step 6: Commit the audit tool and report**

```bash
git add tools/audit-blog-content.js test/content-readiness-audit.test.js \
  docs/audits/2026-08-07-adsense-content-readiness.md
git commit -m "docs: audit AdSense content readiness"
```

### Task 5: Build, publish, and verify Pages

**Files:**
- Verify: `public/CNAME`
- Verify: `public/robots.txt`
- Verify: `public/sitemap.xml`
- Verify: `public/index.html`
- Verify: representative article output

**Interfaces:**
- Consumes: source commits from Tasks 2–4.
- Produces: verified `dev-optimize` and Pages `master` commits.

- [ ] **Step 1: Run final clean verification**

Run:

```bash
npm run clean
npm run build
npm test
```

Expected: build and complete suite pass.

- [ ] **Step 2: Inspect canonical output**

Run:

```bash
rg -n "canonical|og:url|sitemap" public/index.html public/robots.txt
rg -n "<loc>https://www.zhililab.cn" public/sitemap.xml
```

Expected: canonical origin is the `www` domain; no generated page URL uses the
old GitHub or www origins.

- [ ] **Step 3: Preserve unrelated generated assets**

Restore the exact `HelloWorld_Cover.jpg` path and hash from current
`origin/master` into `public/`. Do not alter the user-owned source file.

- [ ] **Step 4: Push source and deploy Pages**

Fetch remote heads, confirm `origin/dev-optimize` remains an ancestor, push HEAD
to `dev-optimize`, then run:

```bash
npm run deploy
```

Record both remote commit hashes.

- [ ] **Step 5: Update GitHub Pages custom domain**

In repository Settings → Pages, set Custom domain to:

```text
zhililab.cn
```

Do not enable "Enforce HTTPS" until GitHub reports the new certificate ready.

- [ ] **Step 6: Verify DNS, TLS, redirects, and routes**

Require:

```text
https://www.zhililab.cn/                     strict TLS, HTTP 200
https://zhililab.cn/                         strict TLS, redirect to www
https://www.zhililab.cn/robots.txt               HTTP 200, text/plain
https://www.zhililab.cn/sitemap.xml              HTTP 200, XML
representative recent article routes         HTTP 200
```

Verify live canonical HTML and Sitemap content, not only status codes.

### Task 6: Complete Search Console readiness

**Files:**
- Update: `docs/audits/2026-08-07-adsense-content-readiness.md`

**Interfaces:**
- Consumes: live canonical domain, robots, and Sitemap from Task 5.
- Produces: recorded Search Console submission state and next review gate.

- [ ] **Step 1: Open the domain property**

Use the logged-in Google Search Console session to select or create the
`zhililab.cn` domain property. If ownership verification is missing, stop before
adding a new DNS token and report the exact record Google requests.

- [ ] **Step 2: Submit the Sitemap**

Submit:

```text
https://www.zhililab.cn/sitemap.xml
```

Record whether Search Console reports Success, processing, or a concrete error.

- [ ] **Step 3: Request representative indexing**

Request indexing for the homepage and at most four recent original articles:

```text
Kubernetes Pod creation workflow
Agentic DevOps practice report
DevOps Agent Control Plane reflection
Google AdSense reflection
```

Do not request every URL or bypass Search Console quotas.

- [ ] **Step 4: Record the review gate**

Append the observed Search Console status and this explicit rule to the audit:

```text
Do not resubmit AdSense until the Sitemap is readable and multiple representative
URLs are discovered or indexed in Search Console.
```

- [ ] **Step 5: Commit evidence-only documentation if it changed**

```bash
git add docs/audits/2026-08-07-adsense-content-readiness.md
git commit -m "docs: record Search Console readiness"
git push origin HEAD:dev-optimize
```
