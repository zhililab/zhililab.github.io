# ZHILILAB Site Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship locally verified P0 security/SEO fixes and a focused Reading Desk identity upgrade without changing article bodies or deploying production.

**Architecture:** Keep Hexo and the pinned Fluid theme. Use root configuration overrides for theme settings, one idempotent `after_render:html` filter for canonical/JSON-LD/homepage markup, one scoped stylesheet for presentation, and Markdown pages for About, Field Notes, and Projects.

**Tech Stack:** Hexo 6, Fluid 1.9.4, Node.js built-in test runner, EJS-generated HTML, CSS.

## Global Constraints

- Do not modify files under `themes/hexo-theme-fluid`.
- Do not rewrite post bodies under `source/_posts`.
- Do not enable AdSense.
- Do not deploy, push, rotate external credentials, or rewrite Git history.
- Keep all publication actions behind human confirmation.
- Run `npm run build` before rendered-output tests.

---

### Task 1: Protect configuration and correct public identity metadata

**Files:**
- Modify: `_config.yml`
- Create: `_config.fluid.yml`
- Create: `test/site-identity.test.js`

**Interfaces:**
- Consumes: Hexo's standard site config and Fluid override merge behavior.
- Produces: canonical public identity configuration used by every generated route.

- [ ] **Step 1: Write failing source-configuration tests**

Add tests that assert `_config.yml` contains `url: https://www.zhililab.cn`, a scalar `author: Walker`, no `clientSecret`, no `password_hash`, and no active `hexo_admin` or `gitTalk` block. Assert `_config.fluid.yml` contains the Walker nav label, approved slogan, Projects route, and experience-first footer copy.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/site-identity.test.js`

Expected: failures for the current GitHub URL, object author, tracked credential fields, and missing Fluid override.

- [ ] **Step 3: Apply minimal configuration changes**

Update `_config.yml` to use the custom domain and current Walker identity. Remove the obsolete GitTalk and Hexo Admin authentication blocks. Create `_config.fluid.yml` with only the supported keys needed for navbar, homepage banner/slogan, navigation, and footer.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test test/site-identity.test.js`

Expected: source-configuration tests pass.

- [ ] **Step 5: Commit**

Run: `git add _config.yml _config.fluid.yml test/site-identity.test.js && git commit -m "fix: harden blog identity configuration"`

### Task 2: Generate canonical metadata and structured data

**Files:**
- Create: `scripts/blog-site-identity.js`
- Modify: `test/site-identity.test.js`

**Interfaces:**
- Consumes: `html`, render `data`, and `hexo.config.url`.
- Produces: `enhanceSiteHtml(html, data, options) -> string` and `register(hexoInstance)`.

- [ ] **Step 1: Write failing transformation tests**

Add tests that require exactly one canonical link, valid homepage `Person` JSON-LD, valid post `BlogPosting` JSON-LD, correct absolute image URLs, HTML-safe JSON payloads, and idempotent repeated enhancement.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/site-identity.test.js`

Expected: module-not-found or missing-export failure for `scripts/blog-site-identity.js`.

- [ ] **Step 3: Implement the minimal site identity filter**

Implement URL normalization, JSON escaping, schema selection, head injection, idempotency markers, and Hexo registration. Do not modify article body HTML.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test test/site-identity.test.js`

Expected: transformation tests pass.

- [ ] **Step 5: Commit**

Run: `git add scripts/blog-site-identity.js test/site-identity.test.js && git commit -m "feat: add canonical site identity metadata"`

### Task 3: Add the Reading Desk homepage section

**Files:**
- Modify: `scripts/blog-site-identity.js`
- Create: `source/css/blog-site-identity.css`
- Modify: `test/site-identity.test.js`

**Interfaces:**
- Consumes: generated homepage HTML and existing Fluid CSS variables.
- Produces: one homepage introduction, one writing map, and one featured-card marker.

- [ ] **Step 1: Write failing homepage tests**

Require homepage output to contain one `data-site-identity` stylesheet, one `walker-intro`, the approved headline and automation boundary, two action links, four topic links, and one featured first article. Require non-home HTML to omit the homepage section.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/site-identity.test.js`

Expected: missing homepage section and stylesheet failures.

- [ ] **Step 3: Implement homepage markup and scoped CSS**

Inject semantic homepage markup before the Fluid article board. Add responsive CSS with restrained green accents, readable line lengths, visible focus states, no nested cards, no gradients, and no mobile overflow.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test test/site-identity.test.js`

Expected: homepage and non-home behavior passes.

- [ ] **Step 5: Commit**

Run: `git add scripts/blog-site-identity.js source/css/blog-site-identity.css test/site-identity.test.js && git commit -m "feat: add Reading Desk homepage identity"`

### Task 4: Refresh About, Field Notes, and Projects

**Files:**
- Modify: `source/about/index.md`
- Modify: `source/notes/index.md`
- Create: `source/projects/index.md`
- Modify: `test/site-identity.test.js`

**Interfaces:**
- Consumes: verified capabilities already present in the repository.
- Produces: three trustworthy content routes with explicit frontmatter titles and descriptions.

- [ ] **Step 1: Write failing page-source tests**

Assert About includes current role, focus, workflow, and contact path; Notes uses the Field Notes title and preserves historical notes under an archive heading; Projects lists ContentOps, reviewed AI summaries, and the blog publication system without invented metrics.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/site-identity.test.js`

Expected: outdated About/Notes content and missing Projects page failures.

- [ ] **Step 3: Update the pages**

Write concise Chinese copy with clear headings, practical language, and no unverifiable claims. Preserve the existing historical Notes text under an archive section.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test test/site-identity.test.js`

Expected: page-source tests pass.

- [ ] **Step 5: Commit**

Run: `git add source/about/index.md source/notes/index.md source/projects/index.md test/site-identity.test.js && git commit -m "content: refresh personal site pages"`

### Task 5: Verify generated routes and regression safety

**Files:**
- Modify: `test/site-identity.test.js`

**Interfaces:**
- Consumes: freshly generated `public/` output.
- Produces: evidence that source configuration becomes correct rendered HTML.

- [ ] **Step 1: Add rendered-output assertions**

Assert generated homepage, a representative post, About, Notes, and Projects contain the expected title, canonical URL, schema, homepage scope, and route content. Assert no output contains `[object Object]` in author metadata.

- [ ] **Step 2: Build and verify focused rendered tests**

Run: `npm run clean && npm run build && node --test test/site-identity.test.js`

Expected: build succeeds and focused tests pass.

- [ ] **Step 3: Run the complete regression suite**

Run: `npm test`

Expected: all existing tests plus the new site identity tests pass with zero failures.

- [ ] **Step 4: Inspect generated route signals**

Run focused `rg` checks against `public/index.html`, `public/about/index.html`, `public/notes/index.html`, `public/projects/index.html`, and one representative post. Confirm the canonical domain, schema type, Reading Desk text, and absence of tracked credential strings.

- [ ] **Step 5: Commit**

Run: `git add test/site-identity.test.js && git commit -m "test: verify generated personal site identity"`

### Task 6: Handoff without deployment

**Files:**
- No production files.

**Interfaces:**
- Consumes: local branch diff, test output, build output, and known external follow-ups.
- Produces: a concise implementation summary and safe next actions.

- [ ] **Step 1: Review the final diff**

Run: `git status --short && git diff --check && git log --oneline --decorate -6`.

- [ ] **Step 2: Record external follow-ups**

List credential rotation, optional Git history cleanup, dependency vulnerability review, screenshot-based desktop/mobile QA, and production deployment as separate actions requiring explicit follow-up.

- [ ] **Step 3: Do not deploy**

Leave the verified branch local and report its path and branch name.
