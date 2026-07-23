# ZHILI Blog Reading Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight animated robot, widen Fluid post pages, make wide tables usable, and reduce unnecessary post-page work without modifying the Fluid submodule.

**Architecture:** A root-level Hexo `after_render:html` filter adds post-scoped CSS, deferred JavaScript, body class, and semantic pet markup to generated post HTML. A small dependency-free browser module wraps tables idempotently, adds asynchronous image decoding, and handles the pet interaction. All presentation remains in one post-scoped CSS file.

**Tech Stack:** Hexo 6.3, Node.js built-in test runner, browser JavaScript, CSS, Fluid 1.9.4 generated HTML.

## Global Constraints

- Do not modify the Fluid theme submodule.
- Do not commit the existing `source/assets/images/cover/HelloWorld_Cover.jpg` case-collision change.
- Do not add npm runtime dependencies or third-party pet requests.
- Show the pet only at viewport widths of at least `992px`.
- Disable continuous pet motion under `prefers-reduced-motion: reduce`.
- Keep added CSS, JavaScript, and inline pet markup below 30 KB total uncompressed.
- Preserve native table semantics and prevent document-level horizontal overflow.
- Verify source commit, deploy commit, live HTML, and live assets separately.

---

### Task 1: Post-only Hexo injection

**Files:**
- Create: `scripts/blog-reading-experience.js`
- Create: `test/blog-reading-experience-filter.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: Hexo `after_render:html` filter input `(html: string, data: object)`.
- Produces: `enhancePostHtml(html, data): string` and `register(hexo): void`.

- [ ] **Step 1: Write the failing filter tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { enhancePostHtml } = require('../scripts/blog-reading-experience');

test('injects enhancement assets and pet once into a post', () => {
  const html = '<html><head></head><body><main></main></body></html>';
  const output = enhancePostHtml(html, { page: { layout: 'post' } });
  assert.match(output, /blog-post-enhanced/);
  assert.equal((output.match(/blog-reading-experience\.css/g) || []).length, 1);
  assert.equal((output.match(/blog-reading-experience\.js/g) || []).length, 1);
  assert.equal((output.match(/id="blog-pet"/g) || []).length, 1);
  assert.equal(enhancePostHtml(output, { page: { layout: 'post' } }), output);
});

test('does not inject post enhancements into non-post pages', () => {
  const html = '<html><head></head><body><main></main></body></html>';
  assert.equal(enhancePostHtml(html, { page: { layout: 'index' } }), html);
});

test('removes typed.js from post output only', () => {
  const html = '<html><head></head><body><script src="https://cdn/typed.js/2/typed.min.js"></script></body></html>';
  assert.doesNotMatch(enhancePostHtml(html, { page: { layout: 'post' } }), /typed\.min\.js/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test test/blog-reading-experience-filter.test.js`

Expected: FAIL because `scripts/blog-reading-experience.js` does not exist.

- [ ] **Step 3: Implement the minimum filter**

Implement a pure `enhancePostHtml` function that:

- returns the input unchanged when `data.page.layout !== 'post'`;
- adds `blog-post-enhanced` to the `<body>` class list;
- injects `/css/blog-reading-experience.css` before `</head>`;
- removes only script tags whose `src` contains `typed.js`;
- injects an accessible `#blog-pet` button containing inline robot SVG and a hidden status bubble;
- injects `/js/blog-reading-experience.js` with `defer` before `</body>`;
- returns unchanged output when the CSS marker already exists.

Register it with:

```js
function register(hexo) {
  hexo.extend.filter.register('after_render:html', enhancePostHtml);
}

if (typeof hexo !== 'undefined') register(hexo);
module.exports = { enhancePostHtml, register };
```

- [ ] **Step 4: Add and run the test command**

Add to `package.json`:

```json
"test": "node --test test/*.test.js"
```

Run: `npm test`

Expected: 3 passing tests, 0 failures.

- [ ] **Step 5: Commit the filter**

```bash
git add package.json scripts/blog-reading-experience.js test/blog-reading-experience-filter.test.js
git commit -m "feat: inject post reading enhancements"
```

### Task 2: Table, image, and pet browser behavior

**Files:**
- Create: `source/js/blog-reading-experience.js`
- Create: `test/blog-reading-experience-client.test.js`

**Interfaces:**
- Consumes: a DOM-like document with `.markdown-body`, `table`, `img`, and `#blog-pet`.
- Produces: `enhanceTables(root)`, `enhanceImages(root)`, `initPet(document, window)`, and `boot(document, window)`.

- [ ] **Step 1: Write failing client behavior tests**

Use dependency-free fake elements in the test file to verify:

```js
test('wraps each table once and preserves the table node', () => {
  const { root, table } = makeTableFixture();
  enhanceTables(root);
  enhanceTables(root);
  assert.equal(table.parentNode.className, 'table-scroll');
  assert.equal(table.parentNode.tabIndex, 0);
  assert.equal(root.wrapperCount, 1);
});

test('adds async decoding without replacing existing image attributes', () => {
  const image = makeImageFixture();
  enhanceImages({ querySelectorAll: () => [image] });
  assert.equal(image.decoding, 'async');
});

test('does not initialize pet below desktop width', () => {
  const fixture = makePetFixture({ desktop: false, reducedMotion: false });
  assert.equal(initPet(fixture.document, fixture.window), false);
  assert.equal(fixture.pet.listenerCount, 0);
});

test('clicking the desktop pet reveals then hides its status bubble', () => {
  const fixture = makePetFixture({ desktop: true, reducedMotion: false });
  assert.equal(initPet(fixture.document, fixture.window), true);
  fixture.pet.click();
  assert.equal(fixture.pet.classList.contains('is-speaking'), true);
  fixture.runTimer();
  assert.equal(fixture.pet.classList.contains('is-speaking'), false);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test test/blog-reading-experience-client.test.js`

Expected: FAIL because `source/js/blog-reading-experience.js` does not exist.

- [ ] **Step 3: Implement the browser module**

Implement:

```js
function enhanceTables(root) {
  root.querySelectorAll('.markdown-body table').forEach((table) => {
    if (table.parentNode && table.parentNode.classList.contains('table-scroll')) return;
    const wrapper = table.ownerDocument.createElement('div');
    wrapper.className = 'table-scroll';
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', '可横向滚动的数据表格');
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

function enhanceImages(root) {
  root.querySelectorAll('.markdown-body img').forEach((image) => {
    image.decoding = 'async';
  });
}
```

`initPet` must check `(min-width: 992px)`, attach one click listener, toggle `is-speaking`, and clear the class after 3200 ms. `boot` calls all three behaviors after DOM readiness. Export functions through CommonJS for tests and attach browser boot without a dependency.

- [ ] **Step 4: Run client and full tests**

Run: `npm test`

Expected: all filter and client tests pass with 0 failures.

- [ ] **Step 5: Commit browser behavior**

```bash
git add source/js/blog-reading-experience.js test/blog-reading-experience-client.test.js
git commit -m "feat: improve post tables and pet interaction"
```

### Task 3: Responsive layout and lightweight robot presentation

**Files:**
- Create: `source/css/blog-reading-experience.css`
- Create: `test/blog-reading-experience-assets.test.js`

**Interfaces:**
- Consumes: `.blog-post-enhanced`, Fluid’s three post columns, `.table-scroll`, and `#blog-pet`.
- Produces: responsive post layout, table overflow containment, and robot animation.

- [ ] **Step 1: Write failing asset-contract tests**

```js
test('CSS contains required desktop breakpoints and reduced-motion fallback', () => {
  const css = read('source/css/blog-reading-experience.css');
  assert.match(css, /min-width:\s*992px/);
  assert.match(css, /min-width:\s*1200px/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('CSS contains scoped table overflow and mobile pet hiding', () => {
  const css = read('source/css/blog-reading-experience.css');
  assert.match(css, /\.blog-post-enhanced[\s\S]*\.table-scroll/);
  assert.match(css, /max-width:\s*991\.98px[\s\S]*#blog-pet[\s\S]*display:\s*none/);
});

test('added production assets stay below 30 KB uncompressed', () => {
  const files = [
    'scripts/blog-reading-experience.js',
    'source/js/blog-reading-experience.js',
    'source/css/blog-reading-experience.css'
  ];
  const bytes = files.reduce((sum, file) => sum + stat(file).size, 0);
  assert.ok(bytes < 30 * 1024, `enhancement assets are ${bytes} bytes`);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test test/blog-reading-experience-assets.test.js`

Expected: FAIL because the CSS file does not exist.

- [ ] **Step 3: Implement scoped CSS**

The CSS must:

- hide the first `.side-col` and assign center/right columns to `75% / 25%` at `992px`;
- assign center/right columns to `83.333333% / 16.666667%` at `1200px`;
- replace post padding with `clamp(1.5rem, 3vw, 3.5rem)`;
- keep `.table-scroll` at `max-width: 100%` with `overflow-x: auto`;
- give wide tables `min-width: 52rem` while allowing tables marked by natural narrow content to remain readable;
- position `#blog-pet` above and left of the return-to-top button area;
- animate only `transform` and `opacity`;
- stop animations under reduced motion;
- hide the pet below `992px`;
- remove overflow restrictions only inside `.table-scroll`, not on the page root;
- include print rules that remove fixed pet and scrolling constraints.

- [ ] **Step 4: Run all tests and static checks**

Run: `npm test && git diff --check`

Expected: all tests pass and `git diff --check` prints nothing.

- [ ] **Step 5: Commit responsive presentation**

```bash
git add source/css/blog-reading-experience.css test/blog-reading-experience-assets.test.js
git commit -m "style: widen posts and add lightweight robot"
```

### Task 4: Build and rendered-output verification

**Files:**
- Modify only if a failing regression requires it: files created in Tasks 1–3.
- Create: `test/blog-reading-experience-rendered.test.js`

**Interfaces:**
- Consumes: `public/` generated by Hexo.
- Produces: rendered-page assertions for the target article and non-post routes.

- [ ] **Step 1: Write rendered-output tests**

The test must assert that the generated target article:

- contains one `blog-post-enhanced` body class;
- references one enhancement CSS and one deferred enhancement JS;
- contains one `#blog-pet`;
- does not reference `typed.min.js`;
- includes the seven-column table content;
- has generated CSS and JS files under `public/`.

It must assert that `public/index.html` does not contain `#blog-pet`.

- [ ] **Step 2: Run before build and verify RED**

Run: `node --test test/blog-reading-experience-rendered.test.js`

Expected: FAIL because current `public/` lacks the new rendered output.

- [ ] **Step 3: Build with the exact server theme**

On the server, create a clean worktree from the implementation commit, populate the Fluid gitlink with exact commit `83a3945`, reuse the installed dependencies and Node 20 runtime, then run:

```bash
hexo clean
hexo generate
```

Copy only the generated target HTML, CSS, and JavaScript needed for local rendered tests, or run the rendered test against an explicit generated directory.

- [ ] **Step 4: Run rendered tests and build checks**

Run: `npm test`

Expected: all unit, asset, and rendered tests pass.

Check generated HTML for duplicate injection markers and verify asset byte sizes.

- [ ] **Step 5: Commit rendered verification**

```bash
git add test/blog-reading-experience-rendered.test.js
git commit -m "test: verify rendered blog enhancements"
```

### Task 5: Publish and live verification

**Files:**
- No new production files expected.

**Interfaces:**
- Consumes: verified source branch commit.
- Produces: pushed `dev-optimize`, updated Pages `master`, and live route evidence.

- [ ] **Step 1: Run final local verification**

Run:

```bash
npm test
git diff --check
git status --short
```

Expected: tests pass, no whitespace errors, and only the known case-collision image remains unstaged.

- [ ] **Step 2: Push the source branch**

Push `dev-optimize` and verify `origin/dev-optimize` resolves to the implementation commit.

- [ ] **Step 3: Deploy from an isolated server worktree**

Generate and deploy from the verified source commit without reading unrelated server working-tree changes. If Hexo creates a deployment commit but does not push it, verify the deploy repository state and perform only the missing native push.

- [ ] **Step 4: Verify remote state and live routes**

Verify:

- GitHub `master` moved to the new deploy commit;
- the target article returns HTTP 200;
- `/css/blog-reading-experience.css` returns HTTP 200;
- `/js/blog-reading-experience.js` returns HTTP 200;
- live HTML contains one pet marker and no `typed.min.js`;
- desktop and mobile screenshots match the responsive acceptance criteria;
- table wrapper, pet interaction, TOC, and return-to-top behavior work in a browser.

- [ ] **Step 5: Record performance comparison**

Report before/after:

- target HTML bytes;
- CSS and JS request count parsed from HTML;
- added enhancement asset bytes;
- external request count;
- any metric that could not be measured reliably as `unverified`.
