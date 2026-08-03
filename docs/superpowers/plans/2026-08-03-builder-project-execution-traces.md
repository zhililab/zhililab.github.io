# Builder Project Execution Traces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Tutorial-to-Template and Python Learning Resources GitHub screenshots with responsive, animated, code-grounded execution diagrams in the existing Projects page media column.

**Architecture:** Keep the diagrams as semantic HTML inside `source/projects/index.md`, style them through the route-scoped Projects stylesheet, and extend the existing Projects client module with one independent execution-trace controller. CSS owns the visual trace and reduced-motion state; JavaScript owns viewport activation, pause, focus, pin, detail text, and teardown without affecting the existing DevOps carousel.

**Tech Stack:** Hexo page source, semantic HTML, scoped CSS, CommonJS-testable browser JavaScript, Node.js test runner, `css` parser, local static preview.

## Global Constraints

- Only Tutorial-to-Template and Python Learning Resources media change in this iteration.
- Keep DevOps Agent Control Plane's real two-slide interface and ZHILILAB ContentOps's real website screenshot unchanged.
- Preserve the approved 1180px page width, 36/64 desktop grid, 16:9 media slot, and single-column mobile layout.
- Every visible stage must map to the reviewed public repository code as of 2026-08-03.
- Do not claim source ranking, quality scoring, deduplication, human approval, or other absent behavior.
- Use cyan for the primary path, amber for decisions and fallback, and green for outputs.
- Without JavaScript, every stage, branch, and output remains visible and readable.
- `prefers-reduced-motion: reduce` shows the complete static state without tracing.
- Do not add dependencies, a diagram framework, raster diagram screenshots, SVG illustrations, or a new route.
- Keep all new styles and behavior scoped to `.builder-projects-page` and `[data-project-trace]`.
- Do not deploy or push in this implementation pass.
- Do not modify `source/assets/images/cover/HelloWorld_Cover.jpg` or the Fluid submodule.

---

## File Map

- Modify `source/projects/index.md`: replace two screenshot figures with semantic execution-trace markup and real project stages.
- Modify `source/js/blog-projects.js`: add the execution-trace controller and document initializer while preserving carousel exports.
- Modify `source/css/blog-projects.css`: add trace layout, state, animation, responsive, focus, and reduced-motion rules.
- Modify `test/blog-projects-page.test.js`: verify real stages, outputs, fallback, removed screenshot references, and CSS contracts.
- Modify `test/blog-projects-client.test.js`: verify activation, pause, pin, Escape, detail text, initialization, and teardown.
- Modify `test/site-identity.test.js`: verify the generated Projects page contains both diagrams and no obsolete screenshot references.
- Create `design-qa-execution-traces.md`: record source-target comparison, viewport checks, interactions, console state, and final result.
- Retain the four old WebP files unreferenced in this pass; asset deletion is outside this bounded visual change.

---

### Task 1: Publish Code-Grounded Diagram Markup

**Files:**
- Modify: `source/projects/index.md`
- Modify: `test/blog-projects-page.test.js`

**Interfaces:**
- Consumes: existing `.builder-project__media` 16:9 slot and the real repository evidence recorded in the design spec.
- Produces: two roots matching `[data-project-trace]`, stage controls matching `[data-trace-stage]`, a detail node matching `[data-trace-detail]`, and stable `data-trace-kind` values consumed by Tasks 2 and 3.

- [ ] **Step 1: Replace image-centric expectations with failing trace contracts**

In `test/blog-projects-page.test.js`, narrow the high-resolution image list to the three retained real interface captures and add explicit content tests:

```js
test('non-UI projects use code-grounded execution traces instead of GitHub screenshots', () => {
  const source = read('source/projects/index.md');
  const tutorial = source.match(/<div class="builder-project__media builder-trace" data-project-trace data-trace-kind="tutorial">[\s\S]*?<\/div>\s*<\/article>/)?.[0];
  const python = source.match(/<div class="builder-project__media builder-trace" data-project-trace data-trace-kind="python-resources">[\s\S]*?<\/div>\s*<\/article>/)?.[0];

  assert.ok(tutorial, 'Tutorial-to-Template execution trace must exist');
  assert.ok(python, 'Python Learning Resources execution trace must exist');
  assert.doesNotMatch(source, /tutorial-to-template-(?:960|1600)\.webp/);
  assert.doesNotMatch(source, /python-learning-resources-(?:960|1600)\.webp/);

  for (const label of ['Source', 'Resolve', 'Classify', 'Extract', 'Validate', 'Write']) {
    assert.match(tutorial, new RegExp(`data-trace-stage[^>]*>[\\s\\S]*?${label}`));
  }
  for (const output of ['PROJECT_TEMPLATE.md', 'TASKS.md', 'OBSIDIAN_NOTE.md', 'AGENT_CONTEXT.md', 'TEMPLATE.json', 'README.md']) {
    assert.match(tutorial, new RegExp(output.replace('.', '\\.')));
  }

  for (const label of ['Trigger', 'Prepare', 'Fetch', 'Generate', 'Write', 'Commit']) {
    assert.match(python, new RegExp(`data-trace-stage[^>]*>[\\s\\S]*?${label}`));
  }
  assert.match(python, /data-trace-fallback[\s\S]*FALLBACK_PROJECTS/);
  assert.doesNotMatch(python, /quality score|deduplicat|human approv/i);
});
```

Update `project media has desktop and mobile high-resolution variants` to use:

```js
const bases = ['devops-control-plane-home', 'devops-control-plane-quality', 'zhililab-contentops'];
```

Update `project desktop images declare their real source dimensions` to retain only those three image tuples.

- [ ] **Step 2: Run the page contract test and verify RED**

Run:

```bash
node --test test/blog-projects-page.test.js
```

Expected: FAIL because the two `[data-project-trace]` roots do not exist and the old WebP references remain.

- [ ] **Step 3: Replace Tutorial-to-Template's `<figure>` with semantic trace markup**

Use this stable structure in `source/projects/index.md`:

```html
<div class="builder-project__media builder-trace" data-project-trace data-trace-kind="tutorial" aria-label="Tutorial-to-Template 执行流程">
  <div class="builder-trace__header">
    <p><span>Build 02</span> CLI pipeline</p>
    <span data-trace-status aria-hidden="true">Trace 01 / 06</span>
  </div>
  <ol class="builder-trace__stages">
    <li><button type="button" data-trace-stage data-stage-detail="读取 YouTube URL 或本地文字稿。"><span>Source</span><small>URL / transcript</small></button></li>
    <li><button type="button" data-trace-stage data-stage-detail="resolveTranscript 读取本地文件，或下载并保存文字稿。"><span>Resolve</span><small>transcript.ts</small></button></li>
    <li><button type="button" data-trace-stage data-stage-detail="classifySource 在五种来源类型中进行信号评分。"><span>Classify</span><small>5 source types</small></button></li>
    <li><button type="button" data-trace-stage data-stage-detail="extractTemplate 分离来源事实、缺失字段与推荐默认值。"><span>Extract</span><small>facts vs defaults</small></button></li>
    <li><button type="button" data-trace-stage data-stage-detail="validateTemplate 在写文件前验证结构化模板。"><span>Validate</span><small>JSON schema</small></button></li>
    <li><button type="button" data-trace-stage data-stage-detail="writeOutput 写出六类产物，并可复制 Obsidian 笔记。"><span>Write</span><small>output + vault</small></button></li>
  </ol>
  <div class="builder-trace__outputs" aria-label="生成产物">
    <span>PROJECT_TEMPLATE.md</span><span>TASKS.md</span><span>OBSIDIAN_NOTE.md</span>
    <span>AGENT_CONTEXT.md</span><span>TEMPLATE.json</span><span>README.md</span>
  </div>
  <p class="builder-trace__detail" data-trace-detail aria-live="polite">选择一个阶段查看对应代码职责。</p>
  <p class="builder-trace__rule">Unsupported source details → <code>not_specified</code></p>
</div>
```

- [ ] **Step 4: Replace Python Learning Resources's `<figure>` with the real scheduled workflow**

Use the same root, header, ordered stage list, and detail interface with `data-trace-kind="python-resources"`. The six stages and details are:

```html
<li><button type="button" data-trace-stage data-stage-detail="GitHub Actions 每日 00:00 UTC 运行，也支持手动触发。"><span>Trigger</span><small>cron / manual</small></button></li>
<li><button type="button" data-trace-stage data-stage-detail="工作流检出仓库、设置 Python，并安装 requests 与 BeautifulSoup。"><span>Prepare</span><small>checkout + deps</small></button></li>
<li><button type="button" data-trace-stage data-stage-detail="fetch_trending_projects 请求并解析 GitHub Python Trending。"><span>Fetch</span><small>HTTP + parser</small></button></li>
<li><button type="button" data-trace-stage data-stage-detail="generate_readme 合并固定学习内容、趋势项目和更新日期。"><span>Generate</span><small>README content</small></button></li>
<li><button type="button" data-trace-stage data-stage-detail="脚本以 UTF-8 覆盖写入 README.md。"><span>Write</span><small>README.md</small></button></li>
<li><button type="button" data-trace-stage data-stage-detail="git-auto-commit-action 提交并推送更新后的文档。"><span>Commit</span><small>auto-commit</small></button></li>
```

Add the explicit fallback and outputs:

```html
<p class="builder-trace__fallback" data-trace-fallback><span>Fetch failed</span> → FALLBACK_PROJECTS → Generate</p>
<div class="builder-trace__outputs" aria-label="README 内容">
  <span>Tutorials & Courses</span><span>Best Practices</span><span>Trending Projects</span>
</div>
```

- [ ] **Step 5: Run the page contract test and verify GREEN**

Run:

```bash
node --test test/blog-projects-page.test.js
```

Expected: PASS with the new trace test and retained real-image checks.

- [ ] **Step 6: Commit the semantic diagrams**

```bash
git add source/projects/index.md test/blog-projects-page.test.js
git commit -m "feat: add code-grounded project traces"
```

---

### Task 2: Add Viewport, Pause, Pin, and Detail Behavior

**Files:**
- Modify: `source/js/blog-projects.js`
- Modify: `test/blog-projects-client.test.js`

**Interfaces:**
- Consumes: `[data-project-trace]`, `[data-trace-stage]`, `[data-trace-detail]`, and each stage's `data-stage-detail` value from Task 1.
- Produces: `createProjectTrace(root, options)`, `initProjectTraces(doc, options)`, and root states `is-trace-active`, `is-trace-paused`, and `is-trace-pinned` for Task 3.

- [ ] **Step 1: Add a fake trace fixture and failing controller tests**

Extend the existing test helpers with concrete class-list, root, observer, and trace fixtures:

```js
function fakeClassList() {
  const values = new Set();
  return {
    add(...names) { names.forEach((name) => values.add(name)); },
    remove(...names) { names.forEach((name) => values.delete(name)); },
    contains(name) { return values.has(name); },
    toggle(name, force) {
      const enabled = force === undefined ? !values.has(name) : Boolean(force);
      if (enabled) values.add(name);
      else values.delete(name);
      return enabled;
    }
  };
}

function fakeRoot({ all = {}, one = {} } = {}) {
  const listeners = {};
  return {
    classList: fakeClassList(),
    dataset: {},
    listeners,
    querySelectorAll(selector) { return all[selector] || []; },
    querySelector(selector) { return one[selector] || null; },
    addEventListener(type, fn) { listeners[type] = fn; },
    removeEventListener(type) { delete listeners[type]; },
    removeAttribute(name) {
      if (name === 'data-trace-ready') delete this.dataset.traceReady;
    }
  };
}

function immediateObserver(callback) {
  return {
    observe(target) { callback([{ target, isIntersecting: true }]); },
    disconnect() {}
  };
}

function traceFixture() {
  const stages = [fakeItem(0), fakeItem(1), fakeItem(2)];
  stages.forEach((stage, index) => {
    stage.classList = fakeClassList();
    stage.dataset.stageDetail = `Stage ${index + 1} detail`;
    stage.textContent = `Stage ${index + 1}`;
  });
  const detail = fakeItem(0);
  detail.textContent = '选择一个阶段查看对应代码职责。';
  const root = fakeRoot({
    all: { '[data-trace-stage]': stages },
    one: { '[data-trace-detail]': detail }
  });
  root.contains = (target) => target === root || stages.includes(target) || target === detail;
  return { root, stages, detail };
}
```

Add tests for the public behavior:

```js
test('activates traces only while they intersect', () => {
  const { root } = traceFixture();
  let callback;
  const trace = createProjectTrace(root, {
    createObserver(handler) { callback = handler; return { observe() {}, disconnect() {} }; }
  });
  callback([{ target: root, isIntersecting: true }]);
  assert.equal(root.classList.contains('is-trace-active'), true);
  callback([{ target: root, isIntersecting: false }]);
  assert.equal(root.classList.contains('is-trace-active'), false);
  trace.destroy();
});

test('pauses on hover and focus without pinning', () => {
  const { root, stages, detail } = traceFixture();
  createProjectTrace(root, { createObserver: immediateObserver });
  root.listeners.pointerenter();
  assert.equal(root.classList.contains('is-trace-paused'), true);
  root.listeners.pointerleave();
  assert.equal(root.classList.contains('is-trace-paused'), false);
  root.listeners.focusin({ target: stages[0] });
  assert.equal(root.classList.contains('is-trace-paused'), true);
  assert.equal(detail.textContent, 'Stage 1 detail');
  root.listeners.focusout({ relatedTarget: null });
  assert.equal(root.classList.contains('is-trace-paused'), false);
  assert.match(detail.textContent, /选择一个阶段/);
});

test('pins stage details and Escape restores the default state', () => {
  const { root, stages, detail } = traceFixture();
  createProjectTrace(root, { createObserver: immediateObserver });
  stages[1].listeners.click();
  assert.equal(root.classList.contains('is-trace-pinned'), true);
  assert.equal(stages[1].attributes['aria-pressed'], 'true');
  assert.equal(detail.textContent, 'Stage 2 detail');
  root.listeners.keydown({ key: 'Escape' });
  assert.equal(root.classList.contains('is-trace-pinned'), false);
  assert.equal(stages[1].attributes['aria-pressed'], 'false');
  assert.match(detail.textContent, /选择一个阶段/);
});
```

Also add initialization and teardown coverage so traces initialize once, observer `disconnect()` is called, listeners are removed, classes are cleared, and `data-trace-ready` is removed.

- [ ] **Step 2: Run the client test and verify RED**

Run:

```bash
node --test test/blog-projects-client.test.js
```

Expected: FAIL because `createProjectTrace` and `initProjectTraces` are not exported.

- [ ] **Step 3: Implement the trace controller beside the carousel controller**

Add these functions inside `initBuilderProjectsModule`:

```js
function defaultCreateObserver(callback) {
  if (typeof IntersectionObserver === 'undefined') {
    return { observe(target) { callback([{ target, isIntersecting: true }]); }, disconnect() {} };
  }
  return new IntersectionObserver(callback, { threshold: 0.35 });
}

function createProjectTrace(root, options = {}) {
  const stages = Array.from(root.querySelectorAll('[data-trace-stage]'));
  const detail = root.querySelector('[data-trace-detail]');
  const cleanups = [];
  const defaultDetail = detail?.textContent || '选择一个阶段查看对应代码职责。';
  let pinnedStage = null;
  let hoverPaused = false;
  let focusPaused = false;

  function listen(target, type, handler) {
    if (!target) return;
    target.addEventListener(type, handler);
    cleanups.push(() => target.removeEventListener(type, handler));
  }

  function updatePaused() {
    root.classList.toggle('is-trace-paused', hoverPaused || focusPaused || Boolean(pinnedStage));
  }

  function showDetail(stage) {
    if (detail) detail.textContent = stage.dataset.stageDetail || defaultDetail;
  }

  function clearPin() {
    pinnedStage = null;
    root.classList.remove('is-trace-pinned');
    stages.forEach((stage) => stage.setAttribute('aria-pressed', 'false'));
    if (detail) detail.textContent = defaultDetail;
    updatePaused();
  }

  function pin(stage) {
    pinnedStage = stage;
    root.classList.add('is-trace-pinned');
    stages.forEach((item) => item.setAttribute('aria-pressed', String(item === stage)));
    showDetail(stage);
    updatePaused();
  }

  const observer = (options.createObserver || defaultCreateObserver)((entries) => {
    entries.forEach((entry) => {
      if (entry.target === root) root.classList.toggle('is-trace-active', entry.isIntersecting);
    });
  });
  observer.observe(root);

  listen(root, 'pointerenter', () => { hoverPaused = true; updatePaused(); });
  listen(root, 'pointerleave', () => { hoverPaused = false; updatePaused(); });
  listen(root, 'focusin', (event) => {
    focusPaused = true;
    if (stages.includes(event.target) && event.target !== pinnedStage) {
      clearPin();
      showDetail(event.target);
    }
    updatePaused();
  });
  listen(root, 'focusout', (event) => {
    if (!root.contains(event.relatedTarget)) {
      focusPaused = false;
      clearPin();
      updatePaused();
    }
  });
  listen(root, 'keydown', (event) => {
    if (event.key === 'Escape') clearPin();
  });
  stages.forEach((stage) => {
    stage.setAttribute('aria-pressed', 'false');
    listen(stage, 'click', () => pinnedStage === stage ? clearPin() : pin(stage));
  });

  root.dataset.traceReady = 'true';
  return {
    clearPin,
    destroy() {
      observer.disconnect();
      cleanups.splice(0).forEach((cleanup) => cleanup());
      clearPin();
      root.classList.remove('is-trace-active', 'is-trace-paused');
      root.removeAttribute('data-trace-ready');
    }
  };
}

function initProjectTraces(doc, options = {}) {
  const roots = Array.from(doc.querySelectorAll('[data-project-trace]'))
    .filter((root) => root.dataset.traceReady !== 'true');
  roots.forEach((root) => createProjectTrace(root, options));
  return roots.length;
}
```

Update exports and browser initialization:

```js
module.exports = { createProjectCarousel, initProjectCarousels, createProjectTrace, initProjectTraces };
```

Call both initializers from one `initProjects(doc)` helper on DOM ready so the asset still installs a single startup handler.

- [ ] **Step 4: Run the client test and verify GREEN**

Run:

```bash
node --test test/blog-projects-client.test.js
```

Expected: PASS for all carousel and trace controller tests.

- [ ] **Step 5: Commit the trace behavior**

```bash
git add source/js/blog-projects.js test/blog-projects-client.test.js
git commit -m "feat: animate accessible project traces"
```

---

### Task 3: Style the Responsive Execution Trace

**Files:**
- Modify: `source/css/blog-projects.css`
- Modify: `test/blog-projects-page.test.js`

**Interfaces:**
- Consumes: Task 1 classes under `.builder-trace` and Task 2 state classes `is-trace-active`, `is-trace-paused`, and `is-trace-pinned`.
- Produces: a stable 16:9 diagram, six-stage desktop flow, readable mobile wrapping, trace animations, visible focus, fallback styling, paused animation state, and static reduced-motion state.

- [ ] **Step 1: Add failing parsed-CSS assertions**

Extend `projects CSS rules own the approved layout and interaction declarations` using the existing `css.parse` and `declarationsFor` helpers:

```js
const trace = declarationsFor(rules, '.builder-trace');
const stages = declarationsFor(rules, '.builder-trace__stages');
const stage = declarationsFor(rules, '.builder-trace__stages button');
const paused = declarationsFor(rules, '.builder-trace.is-trace-paused *');
const traceFocus = declarationsFor(rules, '.builder-trace__stages button:focus-visible');
const activeStage = declarationsFor(rules, '.builder-trace.is-trace-active .builder-trace__stages li');

assert.equal(trace['aspect-ratio'], '16 / 9');
assert.equal(stages['grid-template-columns'], 'repeat(6, minmax(0, 1fr))');
assert.equal(stage['min-width'], '0');
assert.equal(paused['animation-play-state'], 'paused !important');
assert.equal(traceFocus.outline, '3px solid var(--projects-cyan)');
assert.match(activeStage.animation, /builder-trace-stage/);

const mobileTraceStages = declarationsFor(mobile.rules, '.builder-trace__stages');
assert.equal(mobileTraceStages['grid-template-columns'], 'repeat(3, minmax(0, 1fr))');

const reducedTrace = declarationsFor(reducedMotion.rules, '.builder-trace *');
assert.equal(reducedTrace['animation-name'], 'none !important');
```

- [ ] **Step 2: Run the page test and verify RED**

Run:

```bash
node --test test/blog-projects-page.test.js
```

Expected: FAIL because trace selectors and keyframe bindings are absent.

- [ ] **Step 3: Add the visual system under the existing media styles**

Implement scoped rules with these required declarations:

```css
.builder-trace {
  aspect-ratio: 16 / 9;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 22px;
}

.builder-trace__stages {
  display: grid;
  gap: 7px;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
}

.builder-trace__stages button {
  background: #101e2d;
  border: 1px solid #34536e;
  color: var(--projects-text);
  min-height: 74px;
  min-width: 0;
  padding: 8px 5px;
  width: 100%;
}

.builder-trace.is-trace-active .builder-trace__stages li {
  animation: builder-trace-stage 9s ease-in-out infinite;
  animation-delay: calc(var(--trace-order, 0) * 1.2s);
}

.builder-trace.is-trace-paused *,
.builder-trace.is-trace-pinned * {
  animation-play-state: paused !important;
}

.builder-trace__stages button:focus-visible {
  outline: 3px solid var(--projects-cyan);
  outline-offset: 3px;
}
```

Set `--trace-order` on `li:nth-child(1)` through `li:nth-child(6)`. Add `builder-trace-stage`, primary rail, fallback pulse, and output reveal keyframes. Use only transform, opacity, border-color, background-color, and box-shadow so layout never shifts.

Use `.builder-trace__fallback` with an amber left border and text label. Use `.builder-trace__outputs span` with a green top border. Keep all text labels visible before `.is-trace-active` is applied.

- [ ] **Step 4: Add mobile and reduced-motion contracts**

Inside the existing `(max-width: 767px)` block:

```css
.builder-trace {
  min-height: 300px;
  padding: 14px;
}

.builder-trace__stages {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.builder-trace__stages button {
  min-height: 58px;
}
```

Inside the existing reduced-motion block:

```css
.builder-trace *,
.builder-trace *::before,
.builder-trace *::after {
  animation-name: none !important;
  transform: none !important;
}
```

Use `clamp()` only for trace-local text, with a fixed minimum and maximum; do not scale the site typography by viewport width.

- [ ] **Step 5: Run the page test and verify GREEN**

Run:

```bash
node --test test/blog-projects-page.test.js
```

Expected: PASS, including desktop, mobile, paused, focus, and reduced-motion CSS contracts.

- [ ] **Step 6: Commit the responsive visual system**

```bash
git add source/css/blog-projects.css test/blog-projects-page.test.js
git commit -m "feat: style responsive project execution traces"
```

---

### Task 4: Verify Generated Output and Visual Fidelity

**Files:**
- Modify: `test/site-identity.test.js`
- Create: `design-qa-execution-traces.md`

**Interfaces:**
- Consumes: the complete trace markup, controller, and CSS from Tasks 1 through 3.
- Produces: generated-output regression coverage, visual QA evidence, and a local prototype ready for user inspection.

- [ ] **Step 1: Add failing generated-page assertions before rebuilding**

Extend `generated personal pages contain their current route content`:

```js
assert.equal((projects.match(/data-project-trace/g) || []).length, 2);
assert.match(projects, /data-trace-kind="tutorial"/);
assert.match(projects, /data-trace-kind="python-resources"/);
assert.match(projects, /FALLBACK_PROJECTS/);
assert.doesNotMatch(projects, /tutorial-to-template-(?:960|1600)\.webp/);
assert.doesNotMatch(projects, /python-learning-resources-(?:960|1600)\.webp/);
assert.match(projectsCss, /\.builder-trace\.is-trace-active/);
```

- [ ] **Step 2: Verify the stale generated page fails the new test**

Run:

```bash
node --test test/site-identity.test.js
```

Expected: FAIL because `public/projects/index.html` still contains the old screenshot markup.

- [ ] **Step 3: Run the source checks and clean build**

Run:

```bash
npm run summary:check
npm run clean
npm run build
```

Expected: AI summaries are current, build exits 0, and Hexo generates the Projects route and route-scoped assets.

- [ ] **Step 4: Verify focused and full tests**

Run:

```bash
node --test test/blog-projects-*.test.js test/site-identity.test.js
npm test
git diff --check
```

Expected: all focused tests pass, the full suite has zero failures, and `git diff --check` produces no output.

- [ ] **Step 5: Start the local static preview**

Run:

```bash
npm run serve:public
```

Expected: the server reports a local URL and `/projects/` returns HTTP 200. If port 4018 is occupied, use the server helper's next supported port rather than stopping an unrelated process.

- [ ] **Step 6: Perform desktop and mobile visual QA in the approved browser**

Use the user's selected in-app browser. Capture:

- desktop at 1440 × 1100;
- mobile at 390 × 844;
- Tutorial-to-Template with a middle stage pinned;
- Python Learning Resources with its fallback branch visible;
- reduced-motion static state.

For each viewport verify:

- media remains on the right on desktop and below the story on mobile;
- 16:9 frames are not cropped or stretched;
- labels fit without horizontal overflow;
- the trace pauses on hover/focus and Escape clears a pin;
- keyboard focus is visible;
- only one stage is emphasized at a time;
- reduced motion shows all content without animation;
- existing DevOps carousel still changes slides;
- no console errors or warnings originate from Projects assets.

Compare the approved Execution Trace mockup and each implementation screenshot in the same visual review input. Do not treat screenshots alone as comparison evidence.

- [ ] **Step 7: Write the QA record**

Create `design-qa-execution-traces.md` with:

```markdown
# Execution Trace Design QA

- Source target: `.superpowers/brainstorm/1619-1785766156/content/execution-trace-detail.html`
- Route: `/projects/`
- Desktop evidence: `output/playwright/execution-traces/desktop-1440x1100-full.png`
- Mobile evidence: `output/playwright/execution-traces/mobile-390x844-full.png`
- Tutorial pinned-stage evidence: `output/playwright/execution-traces/tutorial-pinned.png`
- Python fallback evidence: `output/playwright/execution-traces/python-fallback.png`
- Reduced-motion evidence: `output/playwright/execution-traces/reduced-motion.png`
- Interaction observations: record the actual pause, pin, Escape, and carousel results
- Console observations: record the measured error and warning counts
- Deviations: record `none` or the exact visible differences
- Final result: record `passed` only when every required check succeeds; otherwise record `failed` and the blocking differences
```

Do not claim a result that was not observed in the browser session.

- [ ] **Step 8: Commit generated integration coverage and QA evidence**

```bash
git add test/site-identity.test.js design-qa-execution-traces.md
git commit -m "test: verify project execution traces"
```

Do not add `public/`, `.playwright-cli/`, `.superpowers/`, or `output/` unless they are already intentionally tracked.

---

## Final Review Gate

- [ ] Generate a whole-branch review package from `40f3799` through `HEAD`.
- [ ] Request a read-only final review against the design spec and this plan.
- [ ] Fix every Critical and Important issue in one bounded correction pass.
- [ ] Re-run `npm run summary:check`, a clean build, focused tests, `npm test`, and `git diff --check` after any correction.
- [ ] Keep the branch and worktree intact; do not merge, push, deploy, or clean up without a separate user decision.
