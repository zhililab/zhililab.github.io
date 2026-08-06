# Static AI Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add author-reviewed, build-time Gemini summaries to new Hexo posts and three selected long-form posts while keeping the published site fully static.

**Architecture:** A dependency-free Node library normalizes post bodies, computes source hashes, validates structured summaries, calls Gemini, and writes draft JSON atomically. A separate Hexo render module accepts only approved, current summaries and emits accessible static markup; the existing local client and CSS provide tabs and styling. GitHub Actions may generate draft JSON on `dev-optimize`, but only the existing manual deployment path can publish it.

**Tech Stack:** Node.js built-ins, Node test runner, Hexo 6, existing Fluid post filter, browser DOM APIs, GitHub Actions, Gemini REST `generateContent`.

## Global Constraints

- Do not publish or run `npm run deploy` without a new explicit user confirmation.
- Gemini runs only during authoring; generated pages make zero model requests.
- `GEMINI_API_KEY` may come only from the environment or GitHub Secrets and must never be logged or committed.
- The generator always writes `status: "draft"`; only the user may approve generated summaries.
- First backfills are the 2026-07-22 Agentic DevOps, 2026-07-23 Kubernetes, and 2026-07-27 graph-platform posts.
- New posts require summaries unless frontmatter explicitly sets `ai_summary: false`; unrelated historical posts remain optional.
- Summary text is plain text, source-faithful, and contains no HTML or Markdown links.
- Existing user changes, including `source/assets/images/cover/HelloWorld_Cover.jpg`, remain untouched.
- Added uncompressed client CSS plus JS is at most 4 KB; total enhancement assets are at most 24 KB.
- Representative mobile acceptance remains LCP <= 2 seconds and CLS <= 0.1.

---

## File Structure and Parallel Ownership

- Worker A owns `scripts/lib/ai-summary.js`, `scripts/generate-ai-summary.js`, `test/ai-summary.test.js`, and the AI-summary entries in `package.json`.
- Worker B owns `scripts/lib/ai-summary-render.js`, the AI-summary changes in `scripts/blog-reading-experience.js`, and `test/ai-summary-render.test.js`.
- Worker C owns the AI-summary changes in `source/js/blog-reading-experience.js`, `source/css/blog-reading-experience.css`, `test/ai-summary-client.test.js`, and the related asset-budget assertion.
- Worker D is not started until one slot frees; it owns `.github/workflows/generate-ai-summaries.yml` and `test/ai-summary-workflow.test.js`.
- The primary agent integrates all workers, resolves interface mismatches, generates the three draft JSON files, requests user review, and performs final build/browser/performance verification.

### Shared summary shape

```js
{
  schema_version: 1,
  slug: '2026-07-23-kubernetes-pod-creation-workflow',
  source_hash: 'sha256:<64 lowercase hex characters>',
  provider: 'google',
  model: 'gemini-3.6-flash',
  generated_at: '<ISO 8601 timestamp>',
  status: 'draft' | 'approved',
  general: '<plain text>',
  bullets: ['<plain text>', '<plain text>', '<plain text>'],
  explainer: '<plain text>'
}
```

---

### Task 1: Summary Domain Library and Gemini Generator

**Files:**
- Create: `scripts/lib/ai-summary.js`
- Create: `scripts/generate-ai-summary.js`
- Create: `test/ai-summary.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces `extractFrontmatterAndBody(markdown) -> { frontmatter: string, body: string }`.
- Produces `normalizeBody(body) -> string`.
- Produces `computeSourceHash(body) -> "sha256:<hex>"`.
- Produces `validateSummary(summary, options) -> summary`, throwing `AiSummaryValidationError`.
- Produces `buildSummaryPrompt({ title, body }) -> string`.
- Produces `requestGeminiSummary({ fetchImpl, apiKey, model, title, body, retries }) -> Promise<{general, bullets, explainer}>`.
- Produces `generateSummaryForPost({ postPath, outputDir, fetchImpl, apiKey, model, now }) -> Promise<{path, summary}>`.
- CLI accepts one or more post paths and `--scan`; default model is `process.env.GEMINI_MODEL || "gemini-3.6-flash"`.

- [ ] **Step 1: Write failing normalization, hash, and validation tests**

```js
test('hash ignores frontmatter but changes with normalized body text', () => {
  const first = extractFrontmatterAndBody('---\ndate: 1\n---\n正文  \\r\\n');
  const second = extractFrontmatterAndBody('---\ndate: 2\n---\n正文\n');
  assert.equal(computeSourceHash(first.body), computeSourceHash(second.body));
  assert.notEqual(computeSourceHash(first.body), computeSourceHash('正文变化'));
});

test('validator rejects draft HTML and accepts three plain bullets', () => {
  assert.throws(() => validateSummary(validSummary({ general: '<script>x</script>' })));
  assert.equal(validateSummary(validSummary()).bullets.length, 3);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test test/ai-summary.test.js`

Expected: FAIL because `../scripts/lib/ai-summary` does not exist.

- [ ] **Step 3: Implement normalization, hash, and validation**

Use `node:crypto`; normalize CRLF, trailing spaces, and outer blank lines. Validate exact keys, schema version, slug/hash/provider/model/timestamp/status, 3-5 bullets, plain text, and practical length bounds. Export the interfaces listed above.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test test/ai-summary.test.js`

Expected: normalization and validation tests PASS.

- [ ] **Step 5: Write failing Gemini retry and atomic-write tests**

```js
test('retries 429 once and forces draft status', async () => {
  const fetchImpl = sequenceFetch([
    response(429, {}),
    response(200, geminiPayload({
      general: '文章围绕平台工程中的统一抽象展开，并严格依据正文概括关键背景、主要论点、工程迁移方式与适用边界，帮助读者在阅读全文前建立准确的内容地图。'.repeat(2),
      bullets: ['识别正文的核心问题和适用范围', '提炼文章给出的主要工程方法', '保留作者写明的限制与风险边界'],
      explainer: '可以把文章讨论的方法理解为一张工程地图：先明确目标，再沿着正文给出的证据和步骤行动，同时保留人工判断与失败时的恢复路径。'
    }))
  ]);
  const result = await requestGeminiSummary({ fetchImpl, apiKey: 'secret', model: 'gemini-3.6-flash', title: '标题', body: '正文', retries: 2 });
  assert.equal(fetchImpl.calls.length, 2);
  assert.equal(result.bullets.length, 3);
});

test('failed generation leaves an existing output unchanged', async () => {
  // Seed output, make fetch return 401, then assert byte-for-byte equality.
});
```

- [ ] **Step 6: Verify the new tests fail for missing request behavior**

Run: `node --test test/ai-summary.test.js`

Expected: FAIL because request and atomic generation are not implemented.

- [ ] **Step 7: Implement prompt, Gemini request, retry, and atomic output**

POST to `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent` with `x-goog-api-key`, `system_instruction`, a delimited post body, and `generationConfig.responseMimeType = "application/json"`. Retry only 429 and 5xx up to the configured count. Parse `candidates[0].content.parts[0].text`, validate, force metadata and `draft`, write a sibling temporary file, then rename.

- [ ] **Step 8: Add the CLI and package commands**

```json
{
  "summary:generate": "node scripts/generate-ai-summary.js",
  "summary:check": "node scripts/generate-ai-summary.js --check"
}
```

The CLI must return nonzero for a missing key, malformed post, API failure, draft/expired required summary in `--check`, or write failure. It must not print article bodies, raw model responses, or request headers.

- [ ] **Step 9: Run Task 1 tests**

Run: `node --test test/ai-summary.test.js`

Expected: all Task 1 tests PASS with no network access.

- [ ] **Step 10: Commit Task 1**

```bash
git add scripts/lib/ai-summary.js scripts/generate-ai-summary.js test/ai-summary.test.js package.json
git commit -m "feat: add static AI summary generator"
```

---

### Task 2: Hexo Summary Quality Gate and Static Markup

**Files:**
- Create: `scripts/lib/ai-summary-render.js`
- Create: `test/ai-summary-render.test.js`
- Modify: `scripts/blog-reading-experience.js`

**Interfaces:**
- Consumes `computeSourceHash(body)` and `validateSummary(summary, options)` from Task 1.
- Produces `escapeHtml(text) -> string`.
- Produces `renderAiSummary(summary) -> string`.
- Produces `createAiSummaryFilter({ summariesDir, cutoffDate, backfillSlugs }) -> data => data`.
- Exported filter prepends markup to `data.content` only for posts with an approved current summary.

- [ ] **Step 1: Write failing render and eligibility tests**

```js
test('renders approved content as an accessible collapsed component', () => {
  const html = renderAiSummary(validApprovedSummary());
  assert.match(html, /<details[^>]*class="ai-summary"/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /AI 生成 · 已由作者审核/);
});

test('escapes model text instead of rendering HTML', () => {
  assert.doesNotMatch(renderAiSummary(validApprovedSummary({ general: '<img onerror=x>' })), /<img/);
});
```

- [ ] **Step 2: Run Task 2 tests and verify RED**

Run: `node --test test/ai-summary-render.test.js`

Expected: FAIL because `ai-summary-render.js` does not exist.

- [ ] **Step 3: Implement pure rendering**

Render one `<details class="ai-summary" data-ai-summary>` with a native `<summary>`, a disclosure line, three tab buttons, and three labelled panels. Only the overview panel is visible initially. Every generated string passes through `escapeHtml`.

- [ ] **Step 4: Add failing filter tests**

Cover approved/current, draft, stale hash, malformed JSON, `ai_summary: false`, an unrelated historical post, one backfill slug, and one new post after `2026-07-30`.

- [ ] **Step 5: Implement the filter and register it**

Register the filter with `after_post_render`. Required posts throw an error for missing, draft, stale, or invalid summaries. Historical posts outside the backfill set remain unchanged. Preserve `enablePostComments` and the existing final HTML injection.

- [ ] **Step 6: Run Task 2 and existing filter tests**

Run: `node --test test/ai-summary-render.test.js test/blog-reading-experience-filter.test.js`

Expected: all tests PASS.

- [ ] **Step 7: Commit Task 2**

```bash
git add scripts/lib/ai-summary-render.js scripts/blog-reading-experience.js test/ai-summary-render.test.js
git commit -m "feat: render approved AI summaries"
```

---

### Task 3: Accessible Client Tabs and Responsive Styling

**Files:**
- Create: `test/ai-summary-client.test.js`
- Modify: `source/js/blog-reading-experience.js`
- Modify: `source/css/blog-reading-experience.css`
- Modify: `test/blog-reading-experience-assets.test.js`

**Interfaces:**
- Produces `initAiSummaries(documentObject) -> number`.
- Operates only on `[data-ai-summary]`, `[role="tab"]`, and `[role="tabpanel"]`.
- Reuses the existing client bootstrap and CommonJS export pattern.

- [ ] **Step 1: Write failing client behavior tests**

```js
test('activates one tab and updates aria-selected, tabindex, and hidden panels', () => {
  const fixture = createSummaryFixture();
  assert.equal(initAiSummaries(fixture.document), 1);
  fixture.tabs[1].click();
  assert.equal(fixture.tabs[1].getAttribute('aria-selected'), 'true');
  assert.equal(fixture.panels[0].hidden, true);
  assert.equal(fixture.panels[1].hidden, false);
});
```

Also test ArrowLeft, ArrowRight, Home, End, no component, and idempotent initialization.

- [ ] **Step 2: Run client tests and verify RED**

Run: `node --test test/ai-summary-client.test.js`

Expected: FAIL because `initAiSummaries` is not exported.

- [ ] **Step 3: Implement minimal tabs**

Initialize each component once, update tab/panel state, focus the newly keyboard-selected tab, and leave native `<details>` behavior untouched. Do not add storage, analytics, timers, or network requests.

- [ ] **Step 4: Add responsive, dark-mode, focus, and reduced-motion CSS**

Scope every rule below `.blog-post-enhanced .ai-summary`. Use existing color variables with high-contrast fallbacks. Keep buttons at least 44px high on touch layouts and ensure long text wraps.

- [ ] **Step 5: Add failing and passing asset-budget assertions**

Update the existing source-asset test to assert total enhancement CSS plus JS is `< 24 * 1024` bytes and that the Task 3 delta from the recorded 17,739-byte baseline is `<= 4 * 1024`.

- [ ] **Step 6: Run Task 3 and existing client/assets tests**

Run: `node --test test/ai-summary-client.test.js test/blog-reading-experience-client.test.js test/blog-reading-experience-assets.test.js`

Expected: all tests PASS and the budget assertions report no overflow.

- [ ] **Step 7: Commit Task 3**

```bash
git add source/js/blog-reading-experience.js source/css/blog-reading-experience.css test/ai-summary-client.test.js test/blog-reading-experience-assets.test.js
git commit -m "feat: add accessible AI summary tabs"
```

---

### Task 4: Free Draft-Generation Workflow

**Files:**
- Create: `.github/workflows/generate-ai-summaries.yml`
- Create: `test/ai-summary-workflow.test.js`

**Interfaces:**
- Consumes `npm run summary:generate -- --scan`.
- Workflow triggers only for pushes to `dev-optimize` changing `source/_posts/**`.
- Workflow uses `secrets.GEMINI_API_KEY`, optional repository variable `GEMINI_MODEL`, Node 20, and `contents: write`.

- [ ] **Step 1: Write a failing static workflow contract test**

Assert the workflow has the exact branch/path trigger, least required permission, secret-to-environment mapping, Node 20, `npm ci`, generator command, summary-only `git add`, and no deploy command.

- [ ] **Step 2: Verify RED**

Run: `node --test test/ai-summary-workflow.test.js`

Expected: FAIL because the workflow does not exist.

- [ ] **Step 3: Implement the workflow**

Use only first-party `actions/checkout` and `actions/setup-node`. Configure the bot identity, run the generator, stage only `source/_data/ai-summaries`, and commit/push only when the staged diff is non-empty. The commit message is `chore: generate draft AI summaries [skip ci]`.

- [ ] **Step 4: Run Task 4 test**

Run: `node --test test/ai-summary-workflow.test.js`

Expected: PASS and the test confirms no `hexo deploy` or `npm run deploy`.

- [ ] **Step 5: Commit Task 4**

```bash
git add .github/workflows/generate-ai-summaries.yml test/ai-summary-workflow.test.js
git commit -m "ci: generate draft AI summaries"
```

---

### Task 5: Generate and Review the Three Backfill Drafts

**Files:**
- Create: `source/_data/ai-summaries/2026-07-22-agentic-devops-practice-report.json`
- Create: `source/_data/ai-summaries/2026-07-23-kubernetes-pod-creation-workflow.json`
- Create: `source/_data/ai-summaries/2026-07-27-from-graph-platform-to-devops-agent-control-plane.json`

**Interfaces:**
- Consumes Task 1 CLI and the three post files.
- Produces three schema-valid files with `status: "draft"`.

- [ ] **Step 1: Check for the API key without printing it**

Run: `test -n "$GEMINI_API_KEY"`

Expected: exit 0. If absent, stop only this task and request that the user configure a local environment variable or GitHub Secret; other tasks continue.

- [ ] **Step 2: Generate the three drafts**

Run:

```bash
npm run summary:generate -- \
  source/_posts/2026-07-22-agentic-devops-practice-report.md \
  source/_posts/2026-07-23-kubernetes-pod-creation-workflow.md \
  source/_posts/2026-07-27-from-graph-platform-to-devops-agent-control-plane.md
```

Expected: three JSON paths printed, with no article body, raw response, or API key.

- [ ] **Step 3: Validate drafts locally**

Run: `node --test test/ai-summary.test.js`

Run: `npm run summary:check`

Expected: schema/hash validation passes, while the publishability check reports the three files as awaiting approval rather than corrupt.

- [ ] **Step 4: Present all three summaries to the user**

Do not change `status` to `approved`. Show the three complete summary variants and request explicit approval or corrections.

- [ ] **Step 5: Apply only user-approved corrections and status changes**

After explicit approval, change only reviewed JSON text and `status`. Re-run `npm run summary:check`; expected exit 0.

- [ ] **Step 6: Commit approved summaries**

```bash
git add source/_data/ai-summaries
git commit -m "content: add reviewed AI summaries"
```

---

### Task 6: Integration, Build, Browser, and Performance Verification

**Files:**
- Modify if required by verified failures: `test/blog-reading-experience-rendered.test.js`
- Generated only: `public/**`

**Interfaces:**
- Consumes all earlier tasks and approved summary JSON.
- Produces no deployment; produces fresh local verification evidence.

- [ ] **Step 1: Add rendered-output assertions before building**

Assert each of the three generated article pages contains exactly one summary component, three tabs, the reviewed disclosure, escaped content, and no Gemini endpoint or key marker. Assert the home page contains no summary component.

- [ ] **Step 2: Verify rendered tests fail against old output**

Run: `node --test test/blog-reading-experience-rendered.test.js`

Expected: FAIL because old `public/` lacks the component.

- [ ] **Step 3: Clean and build**

Run: `npm run clean`

Run: `npm run build`

Expected: both exit 0 with no draft/stale/invalid summary error.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`

Expected: all tests PASS with zero failures.

- [ ] **Step 5: Run local browser verification**

Start `npm run serve:public`, inspect one backfill article at desktop and mobile widths, expand the card, switch all tabs by pointer and keyboard, disable JavaScript to confirm overview access, and inspect the console. Expected: correct focus/state, readable mobile layout, and zero console errors.

- [ ] **Step 6: Measure performance**

Run the existing performance measurement command against the representative Kubernetes article using the repository's supported browser.

Expected: LCP <= 2000 ms, CLS <= 0.1, no new third-party request, and enhancement assets <= 24 KB.

- [ ] **Step 7: Inspect secrets and source diff**

Run:

```bash
rg -n "GEMINI_API_KEY|generativelanguage.googleapis.com" public
git status --short
git diff --check
```

Expected: no secret/API match in `public`; only intended source/test/workflow/summary changes plus the user's pre-existing unrelated files appear.

- [ ] **Step 8: Commit integration assertions if changed**

```bash
git add test/blog-reading-experience-rendered.test.js
git commit -m "test: verify rendered AI summaries"
```

- [ ] **Step 9: Stop before deployment**

Report source commits, tests, build, browser behavior, performance, uncommitted user files, and the missing production deployment. Ask for explicit deployment confirmation; do not run `npm run deploy`.
