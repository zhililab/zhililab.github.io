# Hexo Blog Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Hexo/Fluid post pages meet a 2.0-second mobile-4G LCP target while preserving original images and current site behavior.

**Architecture:** A Hexo build plugin exposes pinned theme dependencies as same-origin routes, generates responsive WebP variants with Sharp, and rewrites post HTML after Fluid rendering. The existing client enhancement keeps table and pet behavior while deferring non-critical analytics.

**Tech Stack:** Hexo 6.3, Fluid 1.9.4, Node.js 20, Sharp, Node test runner, Playwright/Chromium, GitHub Pages.

## Global Constraints

- Keep Hexo, Fluid, and GitHub Pages.
- Mobile mid-range device on ordinary 4G: LCP <= 2.0 s and CLS <= 0.1.
- HTML response <= 0.6 s.
- Preserve original high-resolution images and current post content.
- Do not stage `source/assets/images/cover/HelloWorld_cover.jpg` or browser artifacts.

---

### Task 1: Post image transformation contract

**Files:**
- Create: `scripts/lib/post-performance.js`
- Create: `test/blog-performance-filter.test.js`

**Interfaces:**
- Produces: `rewritePostImages(html, options) -> Promise<string>`
- Produces: `extractLocalBanner(html) -> string | null`
- Consumes: `options.inspectImage(sourcePath)` and `options.emitVariant(route, buffer)`

- [ ] **Step 1: Write failing tests**

Add tests that require:

```js
const output = await rewritePostImages(html, {
  sourceRoot,
  routeRoot: '/assets/images/optimized/',
  inspectImage
});
assert.match(output, /<picture>/);
assert.match(output, /640w/);
assert.match(output, /width="4558" height="3602"/);
assert.match(output, /loading="lazy"/);
assert.doesNotMatch(output, /srcset="\/img\/loading\.gif"/);
```

Also test SVG/remote-image passthrough, duplicate-image reuse, banner extraction and unique preload markup.

- [ ] **Step 2: Run RED**

Run: `node --test test/blog-performance-filter.test.js`

Expected: FAIL because `scripts/lib/post-performance.js` does not exist.

- [ ] **Step 3: Implement minimal transformation**

Implement attribute parsing and deterministic `<picture>` generation. Keep image I/O behind injected functions so unit tests use real temporary images without a Hexo instance.

- [ ] **Step 4: Run GREEN**

Run: `node --test test/blog-performance-filter.test.js`

Expected: all new tests pass.

### Task 2: Hexo route integration and responsive WebP generation

**Files:**
- Create: `scripts/blog-performance.js`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `test/blog-performance-filter.test.js`

**Interfaces:**
- Consumes: `rewritePostImages`
- Produces: Hexo `after_render:html` filter and `/assets/images/optimized/*` routes

- [ ] **Step 1: Add a failing registration test**

Require a fake Hexo instance and assert exactly one async HTML filter is registered and generated variant buffers are passed to `hexo.route.set`.

- [ ] **Step 2: Run RED**

Run: `node --test test/blog-performance-filter.test.js`

Expected: FAIL because the Hexo integration is absent.

- [ ] **Step 3: Add pinned dependencies**

Install exact compatible versions of `sharp`, `bootstrap`, `jquery`, `github-markdown-css`, `hint.css`, `@fancyapps/fancybox`, `tocbot`, `anchor-js`, `clipboard`, and `nprogress`.

- [ ] **Step 4: Implement route integration**

Use Sharp metadata for dimensions and generate WebP variants at 640, 960 and 1440 pixels with quality 82. Cache each source/width promise for the duration of a build and fail loudly on transform errors.

- [ ] **Step 5: Run GREEN**

Run: `node --test test/blog-performance-filter.test.js`

Expected: all tests pass.

### Task 3: Same-origin critical assets and deferred analytics

**Files:**
- Modify: `scripts/lib/post-performance.js`
- Modify: `scripts/blog-performance.js`
- Modify: `source/js/blog-reading-experience.js`
- Modify: `test/blog-performance-filter.test.js`
- Modify: `test/blog-reading-experience-client.test.js`

**Interfaces:**
- Produces: `rewritePostDependencies(html) -> string`
- Produces: `deferAnalytics(documentObject, windowObject) -> boolean`

- [ ] **Step 1: Write failing tests**

Assert that post output contains no blocking stylesheet from `lib.baomitu.com`, removes NProgress and its initializer, rewrites pinned runtime files to `/vendor/blog/`, and does not directly include the Busuanzi script. Assert that analytics injection only happens after `load` and an idle callback.

- [ ] **Step 2: Run RED**

Run:

`node --test test/blog-performance-filter.test.js test/blog-reading-experience-client.test.js`

Expected: FAIL on dependency rewriting and deferred analytics.

- [ ] **Step 3: Implement same-origin routes and analytics deferral**

Expose exact files from installed packages with `hexo.route.set`. Reuse the existing post-only filter and load Busuanzi after `load` through `requestIdleCallback`, with a timeout fallback.

- [ ] **Step 4: Run GREEN**

Run:

`node --test test/blog-performance-filter.test.js test/blog-reading-experience-client.test.js`

Expected: all selected tests pass.

### Task 4: Rendered-site regression and performance budget

**Files:**
- Modify: `test/blog-reading-experience-rendered.test.js`
- Create: `test/blog-performance-budget.test.js`

**Interfaces:**
- Consumes: generated `public/`
- Produces: static performance-budget assertions

- [ ] **Step 1: Write failing rendered assertions**

Require the Kubernetes article to contain responsive WebP routes, explicit image dimensions, native lazy loading, a single banner preload, no old Fluid lazy marker, no blocking external stylesheet, and no NProgress. Require optimized 960-pixel output below 180 KB and all referenced local assets to exist.

- [ ] **Step 2: Run RED against current public output**

Run:

`node --test test/blog-reading-experience-rendered.test.js test/blog-performance-budget.test.js`

Expected: FAIL on the new performance requirements.

- [ ] **Step 3: Generate the full site**

Run:

`npm run clean`

`npm run build`

- [ ] **Step 4: Run GREEN**

Run: `npm test`

Expected: all source and rendered tests pass with zero failures.

### Task 5: Local browser acceptance

**Files:**
- Create: `scripts/measure-blog-performance.js`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: JSON metrics for LCP, CLS, navigation timing, transfer bytes and selected image URL

- [ ] **Step 1: Write a failing CLI contract test**

Test argument validation and metric threshold evaluation without launching a browser.

- [ ] **Step 2: Run RED**

Run: `node --test test/blog-performance-measure.test.js`

Expected: FAIL because the measurement module is absent.

- [ ] **Step 3: Implement measurement**

Use Chromium CDP network emulation for ordinary 4G, a 390×844 viewport and reduced CPU. Capture LCP, CLS, HTML timing, resources, console errors and the Kubernetes sequence image `currentSrc`.

- [ ] **Step 4: Run local acceptance**

Serve generated `public/` locally, then run the measurement against the three representative article routes. Expected: each route meets the global constraints and selects a WebP derivative where applicable.

### Task 6: Final verification, source publication and Pages deployment

**Files:**
- Modify: `docs/superpowers/plans/2026-07-24-blog-performance.md` only to mark completed checkboxes

**Interfaces:**
- Produces: source commit on `dev-optimize`, Pages commit on `master`, live verification evidence

- [ ] **Step 1: Verify repository scope**

Run: `git status -sb`, `git diff --check`, and inspect the full diff. Confirm the unrelated case-colliding HelloWorld cover is not staged.

- [ ] **Step 2: Run fresh verification**

Run: `npm run clean`, `npm run build`, `npm test`, and local mobile-4G measurement.

Expected: build succeeds, all tests pass, and all performance thresholds pass.

- [ ] **Step 3: Commit and push source**

Commit only planned files, merge the isolated branch into `dev-optimize`, and push `dev-optimize`.

- [ ] **Step 4: Deploy generated Pages output**

Build from the exact source commit in an isolated clean directory, deploy `public/` to `master`, and verify the remote commit actually moves.

- [ ] **Step 5: Verify production**

Check all three article routes, optimized image routes, page signals and original image routes over HTTP. Run the mobile-4G browser measurement against production and confirm no new console errors.
