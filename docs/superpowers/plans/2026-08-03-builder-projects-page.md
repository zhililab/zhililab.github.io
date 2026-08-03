# Builder Projects Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive evidence-first `/projects/` page with clear Builder narratives, high-resolution project media, and an accessible DevOps Agent Control Plane slideshow.

**Architecture:** Keep Hexo and Fluid unchanged. Source-controlled HTML in `source/projects/index.md` owns reviewed project content; a route-scoped Hexo filter injects the page class, CSS, and client script; a small browser module owns only slideshow state and input handling. Project screenshots are real captures stored under `source/assets/images/projects/` and rendered with stable dimensions.

**Tech Stack:** Hexo 6, Fluid theme override, CommonJS Hexo scripts, vanilla JavaScript, CSS Grid, Node test runner, Playwright browser verification, Sharp for image optimization.

## Global Constraints

- Preserve the selected Studio Casebook direction: tall editorial page, near-black surface, thin dividers, cyan build markers, and amber status text.
- Desktop project rows use approximately 36% narrative on the left and 64% media on the right.
- No screenshot or video may appear in the left column.
- Mobile source and visual order is narrative first, media second, with no horizontal scrolling.
- Body text is 15-16px on desktop and at least 15px on mobile.
- Production media must be a real project capture, never an ImageGen mock or upscaled low-resolution image.
- DevOps uses one media viewport, no autoplay, and keeps the first image visible without JavaScript.
- Do not modify the Fluid submodule, article bodies, homepage identity, comments, monetization, or publication automation.
- Do not deploy or push remote changes in this implementation pass.

---

## File Structure

- `source/projects/index.md`: reviewed Builder project content and semantic project/media markup.
- `scripts/blog-projects.js`: route detection and idempotent injection of project-only body class, CSS, and JavaScript.
- `source/css/blog-projects.css`: Studio Casebook presentation and responsive layout.
- `source/js/blog-projects.js`: accessible slideshow state, buttons, indicators, keyboard input, and touch/pointer swipe.
- `source/assets/images/projects/`: real optimized project screenshots with intrinsic-dimension metadata in markup.
- `test/blog-projects-filter.test.js`: Hexo route filter behavior and idempotence.
- `test/blog-projects-client.test.js`: slideshow behavior in a minimal fake DOM.
- `test/blog-projects-page.test.js`: source content, media quality, and generated HTML contracts.

---

### Task 1: Add Route-Scoped Project Assets

**Files:**
- Create: `scripts/blog-projects.js`
- Create: `test/blog-projects-filter.test.js`

**Interfaces:**
- Consumes: Hexo `after_render:html` filter data with `data.page.path` or `data.path`.
- Produces: `isProjectsPage(data): boolean`, `enhanceProjectsHtml(html, data): string`, and `register(hexoInstance): void`.

- [ ] **Step 1: Write the failing route-filter tests**

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const {
  enhanceProjectsHtml,
  isProjectsPage,
  register
} = require('../scripts/blog-projects');

test('recognizes only the projects route', () => {
  assert.equal(isProjectsPage({ page: { path: 'projects/index.html' } }), true);
  assert.equal(isProjectsPage({ path: '/projects/' }), true);
  assert.equal(isProjectsPage({ page: { path: 'about/index.html' } }), false);
});

test('injects project assets and body class exactly once', () => {
  const input = '<html><head></head><body class="page-body"><main></main></body></html>';
  const data = { page: { path: 'projects/index.html' } };
  const output = enhanceProjectsHtml(input, data);

  assert.match(output, /class="page-body builder-projects-page"/);
  assert.equal((output.match(/blog-projects\.css/g) || []).length, 1);
  assert.equal((output.match(/blog-projects\.js/g) || []).length, 1);
  assert.match(output, /<script src="\/js\/blog-projects\.js" defer data-builder-projects>/);
  assert.equal(enhanceProjectsHtml(output, data), output);
});

test('does not touch non-project routes', () => {
  const input = '<html><head></head><body><main></main></body></html>';
  assert.equal(
    enhanceProjectsHtml(input, { page: { path: 'about/index.html' } }),
    input
  );
});

test('registers one final HTML filter', () => {
  const calls = [];
  register({
    extend: {
      filter: { register: (name, fn) => calls.push({ name, fn }) }
    }
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'after_render:html');
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test test/blog-projects-filter.test.js`

Expected: FAIL with `Cannot find module '../scripts/blog-projects'`.

- [ ] **Step 3: Implement the minimal route enhancer**

```js
'use strict';

const MARKER = 'data-builder-projects';

function routePath(data) {
  return String((data && data.page && data.page.path) || (data && data.path) || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

function isProjectsPage(data) {
  return /^(projects(?:\/index\.html?)?)$/i.test(routePath(data));
}

function enhanceProjectsHtml(html, data) {
  if (!html || !isProjectsPage(data) || html.includes(MARKER)) return html;

  const withClass = html.replace(/<body([^>]*)class="([^"]*)"/i, (tag, attrs, classes) =>
    `<body${attrs}class="${classes} builder-projects-page"`
  ).replace(/<body(?![^>]*class=)/i, '<body class="builder-projects-page"');

  return withClass
    .replace('</head>', '<link rel="stylesheet" href="/css/blog-projects.css" data-builder-projects>\n</head>')
    .replace('</body>', '<script src="/js/blog-projects.js" defer data-builder-projects></script>\n</body>');
}

function register(hexoInstance) {
  hexoInstance.extend.filter.register('after_render:html', enhanceProjectsHtml);
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = { enhanceProjectsHtml, isProjectsPage, register, routePath };
```

- [ ] **Step 4: Run the focused test and verify pass**

Run: `node --test test/blog-projects-filter.test.js`

Expected: 4 tests pass.

- [ ] **Step 5: Commit the bounded route integration**

```bash
git add scripts/blog-projects.js test/blog-projects-filter.test.js
git commit -m "feat: scope builder assets to projects page"
```

---

### Task 2: Build The Accessible DevOps Slideshow

**Files:**
- Create: `source/js/blog-projects.js`
- Create: `test/blog-projects-client.test.js`

**Interfaces:**
- Consumes: `[data-project-carousel]` containing `[data-project-slide]`, `[data-carousel-prev]`, `[data-carousel-next]`, and `[data-carousel-dot]`.
- Produces: `createProjectCarousel(root): { show(index), next(), previous(), destroy() }` and `initProjectCarousels(doc): number`.

- [ ] **Step 1: Write failing tests for state and interaction**

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const { createProjectCarousel, initProjectCarousels } = require('../source/js/blog-projects');

function fakeItem(index) {
  const listeners = {};
  return {
    dataset: { slideIndex: String(index) },
    hidden: false,
    attributes: {},
    listeners,
    setAttribute(name, value) { this.attributes[name] = String(value); },
    addEventListener(type, fn) { listeners[type] = fn; },
    removeEventListener(type) { delete listeners[type]; }
  };
}

function fixture() {
  const slides = [fakeItem(0), fakeItem(1), fakeItem(2)];
  const dots = [fakeItem(0), fakeItem(1), fakeItem(2)];
  const previousButton = fakeItem(0);
  const nextButton = fakeItem(0);
  const listeners = {};
  return {
    slides,
    dots,
    previousButton,
    nextButton,
    root: {
      dataset: {},
      querySelectorAll(selector) {
        return selector === '[data-project-slide]' ? slides : dots;
      },
      querySelector(selector) {
        if (selector === '[data-carousel-prev]') return previousButton;
        if (selector === '[data-carousel-next]') return nextButton;
        return null;
      },
      addEventListener(type, fn) { listeners[type] = fn; },
      removeEventListener(type) { delete listeners[type]; },
      removeAttribute(name) {
        if (name === 'data-carousel-ready') delete this.dataset.carouselReady;
      },
      listeners
    }
  };
}

test('shows one slide and exposes the active indicator', () => {
  const { root, slides, dots } = fixture();
  const carousel = createProjectCarousel(root);
  carousel.show(1);
  assert.deepEqual(slides.map((slide) => slide.hidden), [true, false, true]);
  assert.deepEqual(dots.map((dot) => dot.attributes['aria-current']), ['false', 'true', 'false']);
});

test('wraps previous and next navigation', () => {
  const { root, slides } = fixture();
  const carousel = createProjectCarousel(root);
  carousel.previous();
  assert.deepEqual(slides.map((slide) => slide.hidden), [true, true, false]);
  carousel.next();
  assert.deepEqual(slides.map((slide) => slide.hidden), [false, true, true]);
});

test('supports ArrowLeft, ArrowRight, Home, and End', () => {
  const { root, slides } = fixture();
  createProjectCarousel(root);
  root.listeners.keydown({ key: 'End', preventDefault() {} });
  assert.equal(slides[2].hidden, false);
  root.listeners.keydown({ key: 'Home', preventDefault() {} });
  assert.equal(slides[0].hidden, false);
  root.listeners.keydown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(slides[1].hidden, false);
  root.listeners.keydown({ key: 'ArrowLeft', preventDefault() {} });
  assert.equal(slides[0].hidden, false);
});

test('supports buttons, indicators, and horizontal swipe', () => {
  const { root, slides, dots, previousButton, nextButton } = fixture();
  createProjectCarousel(root);
  nextButton.listeners.click();
  assert.equal(slides[1].hidden, false);
  previousButton.listeners.click();
  assert.equal(slides[0].hidden, false);
  dots[2].listeners.click();
  assert.equal(slides[2].hidden, false);
  root.listeners.pointerdown({ clientX: 140 });
  root.listeners.pointerup({ clientX: 80 });
  assert.equal(slides[0].hidden, false);
});

test('initializes each carousel once', () => {
  const first = fixture().root;
  const second = fixture().root;
  const doc = { querySelectorAll: () => [first, second] };
  assert.equal(initProjectCarousels(doc), 2);
  assert.equal(initProjectCarousels(doc), 0);
});
```

- [ ] **Step 2: Run the client test and verify failure**

Run: `node --test test/blog-projects-client.test.js`

Expected: FAIL with `Cannot find module '../source/js/blog-projects'`.

- [ ] **Step 3: Implement the complete zero-dependency carousel module**

```js
(function initBuilderProjectsModule() {
  'use strict';

  function createProjectCarousel(root) {
    const slides = Array.from(root.querySelectorAll('[data-project-slide]'));
    const dots = Array.from(root.querySelectorAll('[data-carousel-dot]'));
    const previousButton = root.querySelector('[data-carousel-prev]');
    const nextButton = root.querySelector('[data-carousel-next]');
    const cleanups = [];
    let activeIndex = 0;
    let pointerStartX = null;

    function listen(target, type, handler) {
      if (!target) return;
      target.addEventListener(type, handler);
      cleanups.push(() => target.removeEventListener(type, handler));
    }

    function show(index) {
      if (!slides.length) return;
      activeIndex = (Number(index) + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const inactive = slideIndex !== activeIndex;
        slide.hidden = inactive;
        slide.setAttribute('aria-hidden', String(inactive));
      });
      dots.forEach((dot, dotIndex) => {
        dot.setAttribute('aria-current', String(dotIndex === activeIndex));
      });
    }

    function next() { show(activeIndex + 1); }
    function previous() { show(activeIndex - 1); }

    function onKeydown(event) {
      const actions = {
        ArrowLeft: previous,
        ArrowRight: next,
        Home: () => show(0),
        End: () => show(slides.length - 1)
      };
      if (!actions[event.key]) return;
      event.preventDefault();
      actions[event.key]();
    }

    function onPointerDown(event) {
      pointerStartX = event.clientX;
    }

    function onPointerUp(event) {
      if (pointerStartX === null) return;
      const delta = event.clientX - pointerStartX;
      pointerStartX = null;
      if (Math.abs(delta) < 48) return;
      if (delta < 0) next();
      else previous();
    }

    listen(root, 'keydown', onKeydown);
    listen(root, 'pointerdown', onPointerDown);
    listen(root, 'pointerup', onPointerUp);
    listen(previousButton, 'click', previous);
    listen(nextButton, 'click', next);
    dots.forEach((dot, dotIndex) => {
      listen(dot, 'click', () => show(Number(dot.dataset.slideIndex || dotIndex)));
    });

    root.dataset.carouselReady = 'true';
    show(0);

    return {
      show,
      next,
      previous,
      destroy() {
        cleanups.splice(0).forEach((cleanup) => cleanup());
        root.removeAttribute('data-carousel-ready');
      }
    };
  }

  function initProjectCarousels(doc) {
    const roots = Array.from(doc.querySelectorAll('[data-project-carousel]'))
      .filter((root) => root.dataset.carouselReady !== 'true');
    roots.forEach(createProjectCarousel);
    return roots.length;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createProjectCarousel, initProjectCarousels };
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initProjectCarousels(document), { once: true });
    } else {
      initProjectCarousels(document);
    }
  }
})();
```

- [ ] **Step 4: Run tests and verify pass**

Run: `node --test test/blog-projects-client.test.js`

Expected: carousel state, wraparound, and keyboard tests pass.

- [ ] **Step 5: Commit the interaction module**

```bash
git add source/js/blog-projects.js test/blog-projects-client.test.js
git commit -m "feat: add accessible project slideshow"
```

---

### Task 3: Add Reviewed Project Content And Real Media

**Files:**
- Modify: `source/projects/index.md`
- Create: `source/assets/images/projects/devops-control-plane-home-1600.webp`
- Create: `source/assets/images/projects/devops-control-plane-quality-1600.webp`
- Create: `source/assets/images/projects/devops-control-plane-home-960.webp`
- Create: `source/assets/images/projects/devops-control-plane-quality-960.webp`
- Create: `source/assets/images/projects/tutorial-to-template-1600.webp`
- Create: `source/assets/images/projects/tutorial-to-template-960.webp`
- Create: `source/assets/images/projects/zhililab-contentops-1600.webp`
- Create: `source/assets/images/projects/zhililab-contentops-960.webp`
- Create: `source/assets/images/projects/python-learning-resources-1600.webp`
- Create: `source/assets/images/projects/python-learning-resources-960.webp`
- Create: `test/blog-projects-page.test.js`

**Interfaces:**
- Consumes: the slideshow DOM contract from Task 2 and public repository facts reviewed on 2026-08-03.
- Produces: `.builder-projects`, four `.builder-project` sections, and one `[data-project-carousel]` with two real DevOps slides.

- [ ] **Step 1: Write failing source and media tests**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('projects source contains four evidence-first builds in order', () => {
  const source = read('source/projects/index.md');
  const names = ['DevOps Agent Control Plane', 'Tutorial-to-Template', 'ZHILILAB ContentOps', 'Python Learning Resources'];
  const positions = names.map((name) => source.indexOf(name));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.equal((source.match(/class="builder-project"/g) || []).length, 4);
  assert.equal((source.match(/<dt>动机<\/dt>/g) || []).length, 4);
  assert.equal((source.match(/<dt>方法<\/dt>/g) || []).length, 4);
  assert.equal((source.match(/<dt>结果<\/dt>/g) || []).length, 4);
  assert.equal((source.match(/<dt>当前边界<\/dt>/g) || []).length, 4);
  assert.doesNotMatch(source, /用户量|收入|节省了?\s*\d+|提升了?\s*\d+/);
});

test('DevOps uses one media viewport with two real slides', () => {
  const source = read('source/projects/index.md');
  assert.equal((source.match(/data-project-carousel/g) || []).length, 1);
  assert.equal((source.match(/data-project-slide/g) || []).length, 2);
  assert.match(source, /data-carousel-prev/);
  assert.match(source, /data-carousel-next/);
  assert.equal((source.match(/data-carousel-dot/g) || []).length, 2);
});

test('project media has desktop and mobile high-resolution variants', async () => {
  const bases = ['devops-control-plane-home', 'devops-control-plane-quality', 'tutorial-to-template', 'zhililab-contentops', 'python-learning-resources'];
  for (const base of bases) {
    const desktop = path.join(root, `source/assets/images/projects/${base}-1600.webp`);
    const mobile = path.join(root, `source/assets/images/projects/${base}-960.webp`);
    assert.ok(fs.existsSync(desktop), desktop);
    assert.ok(fs.existsSync(mobile), mobile);
    const desktopMeta = await sharp(desktop).metadata();
    const mobileMeta = await sharp(mobile).metadata();
    assert.ok(desktopMeta.width >= 1280);
    assert.ok(mobileMeta.width >= 900);
  }
});
```

- [ ] **Step 2: Run the page test and verify failure**

Run: `node --test test/blog-projects-page.test.js`

Expected: FAIL because the current source has no `.builder-project` sections or media variants.

- [ ] **Step 3: Capture only real source surfaces at high resolution**

Capture at a 1600x1000 CSS viewport with device scale factor 1 or higher:

- DevOps homepage/dashboard from the local `personal-agent` app or the existing 2400x1350 product-proof asset.
- DevOps Quality Lab from the existing 1280x720 tested screenshot or a fresh higher-resolution local capture.
- Tutorial-to-Template from the public GitHub repository README at `https://github.com/zhililab/tutorial-to-template`.
- ZHILILAB ContentOps from the freshly built local homepage or `/projects/` predecessor at `https://www.zhililab.cn/` only as a source reference.
- Python Learning Resources from `https://github.com/zhililab/Python-Learning-Resources`.

Do not copy generated visual-option images into `source/assets/`.

- [ ] **Step 4: Generate bounded WebP variants from the real captures**

Put the reviewed captures at `/tmp/devops-control-plane-home.png`, `/tmp/devops-control-plane-quality.png`, `/tmp/tutorial-to-template.png`, `/tmp/zhililab-contentops.png`, and `/tmp/python-learning-resources.png`, then run:

```bash
node -e "const sharp=require('sharp');const path=require('path');const fs=require('fs');const names=['devops-control-plane-home','devops-control-plane-quality','tutorial-to-template','zhililab-contentops','python-learning-resources'];const out='source/assets/images/projects';fs.mkdirSync(out,{recursive:true});Promise.all(names.flatMap((name)=>[1600,960].map(async(width)=>{const target=path.join(out,name+'-'+width+'.webp');await sharp('/tmp/'+name+'.png').resize({width,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toFile(target);const meta=await sharp(target).metadata();if(width===1600&&meta.width<1280)throw new Error(name+' source is below 1280px');if(width===960&&meta.width<900)throw new Error(name+' mobile output is below 900px');}))).catch((error)=>{console.error(error);process.exit(1);});"
```

Expected: five 1600 variants at least 1280px wide and five 960 variants at least 900px wide. A dimension error means a fresh source capture is required; do not upscale it.

- [ ] **Step 5: Replace the project Markdown with semantic Studio Casebook markup**

Use this complete hierarchy for each of the four `<article class="builder-project">` sections:

```html
<section class="builder-projects" aria-labelledby="builder-projects-title">
  <header class="builder-projects__intro">
    <p class="builder-projects__eyebrow">Studio Casebook</p>
    <h1 id="builder-projects-title">Selected Builds</h1>
    <p>项目不是陈列品，是判断、实现与验证留下的证据。</p>
    <time datetime="2026-08-03">Updated 2026-08-03</time>
  </header>

  <article class="builder-project" id="devops-agent-control-plane">
    <div class="builder-project__story">
      <p class="builder-project__number">Build 01</p>
      <h2>DevOps Agent Control Plane</h2>
      <p class="builder-project__status">已部署 · 持续验证</p>
      <p class="builder-project__stack">Python · FastAPI · Next.js · TypeScript</p>
      <dl class="builder-project__evidence">
        <dt>动机</dt><dd>让 PR/CI 与事件处置中的 AI 决策具备策略门、人工确认、可回放记录与可审计证据。</dd>
        <dt>方法</dt><dd>用确定性编排、签名权限、队列生命周期、检查点和追加式历史账本约束代理工作流。</dd>
        <dt>结果</dt><dd>公开仓库已包含可部署前后端、工作流回放、证据导出、25 例固定评估集与人工反馈链路。</dd>
        <dt>当前边界</dt><dd>当前仍是单环境 MVP；耐久队列、多租户隔离和更完整的外部系统集成尚未完成。</dd>
      </dl>
      <nav class="builder-project__links" aria-label="DevOps Agent Control Plane 项目链接">
        <a href="https://github.com/zhililab/DevOps-Agent-Control-Plane" target="_blank" rel="noopener">GitHub 仓库</a>
        <a href="/2026/07/22/2026-07-22-agentic-devops-practice-report/">实践记录</a>
      </nav>
    </div>
    <div class="builder-project__media" data-project-carousel tabindex="0" aria-label="DevOps Agent Control Plane 截图">
      <figure data-project-slide>
        <picture>
          <source media="(max-width: 767px)" srcset="/assets/images/projects/devops-control-plane-home-960.webp">
          <img src="/assets/images/projects/devops-control-plane-home-1600.webp" width="1600" height="900" alt="DevOps Agent Control Plane 工作流首页">
        </picture>
      </figure>
      <figure data-project-slide hidden>
        <picture>
          <source media="(max-width: 767px)" srcset="/assets/images/projects/devops-control-plane-quality-960.webp">
          <img src="/assets/images/projects/devops-control-plane-quality-1600.webp" width="1600" height="900" alt="DevOps Agent Control Plane Quality Lab">
        </picture>
      </figure>
      <button type="button" data-carousel-prev aria-label="上一张截图"><i class="iconfont icon-arrowleft" aria-hidden="true"></i></button>
      <button type="button" data-carousel-next aria-label="下一张截图"><i class="iconfont icon-arrowright" aria-hidden="true"></i></button>
      <div class="builder-carousel__dots" aria-label="选择截图">
        <button type="button" data-carousel-dot data-slide-index="0" aria-label="显示首页截图"></button>
        <button type="button" data-carousel-dot data-slide-index="1" aria-label="显示 Quality Lab 截图"></button>
      </div>
    </div>
  </article>

  <article class="builder-project" id="tutorial-to-template">
    <div class="builder-project__story">
      <p class="builder-project__number">Build 02</p>
      <h2>Tutorial-to-Template</h2>
      <p class="builder-project__status">MVP · 公开仓库</p>
      <p class="builder-project__stack">TypeScript · CLI · JSON Schema</p>
      <dl class="builder-project__evidence">
        <dt>动机</dt><dd>把收藏的视频和演讲从被动阅读材料转成可以继续执行的项目输入。</dd>
        <dt>方法</dt><dd>先分类内容类型，再提取可验证事实，最后渲染项目模板、任务清单、Obsidian 笔记和 Agent 上下文。</dd>
        <dt>结果</dt><dd>公开仓库包含可运行 CLI、Karpathy 演讲回归样例、结构化模板与自动化测试。</dd>
        <dt>当前边界</dt><dd>当前输入仍依赖已获取的文字稿；多来源抓取、质量评分和批量处理尚未完成。</dd>
      </dl>
      <nav class="builder-project__links" aria-label="Tutorial-to-Template 项目链接"><a href="https://github.com/zhililab/tutorial-to-template" target="_blank" rel="noopener">GitHub 仓库</a></nav>
    </div>
    <figure class="builder-project__media">
      <picture><source media="(max-width: 767px)" srcset="/assets/images/projects/tutorial-to-template-960.webp"><img src="/assets/images/projects/tutorial-to-template-1600.webp" width="1600" height="900" alt="Tutorial-to-Template 公开仓库与生成物"></picture>
    </figure>
  </article>

  <article class="builder-project" id="zhililab-contentops">
    <div class="builder-project__story">
      <p class="builder-project__number">Build 03</p>
      <h2>ZHILILAB ContentOps</h2>
      <p class="builder-project__status">持续维护 · 线上运行</p>
      <p class="builder-project__stack">Hexo · Fluid · Node.js · GitHub Pages</p>
      <dl class="builder-project__evidence">
        <dt>动机</dt><dd>让内容创作、事实审核、构建验证和网站发布形成一条可复现且可回退的工作流。</dd>
        <dt>方法</dt><dd>以 Markdown 为内容源，结合静态 AI 摘要、结构检查、性能优化、评论服务和多层上线验证。</dd>
        <dt>结果</dt><dd>个人网站已持续发布技术文章，并具备构建测试、人工审核、静态摘要和线上路由验证。</dd>
        <dt>当前边界</dt><dd>内容判断和最终发布仍由人工确认；自动化不会替代事实责任和安全审查。</dd>
      </dl>
      <nav class="builder-project__links" aria-label="ZHILILAB ContentOps 项目链接"><a href="https://github.com/zhililab/zhililab.github.io" target="_blank" rel="noopener">GitHub 仓库</a><a href="/2023/05/28/%E7%BD%91%E7%AB%99%E6%9B%B4%E6%96%B0%E5%B0%8F%E8%AE%B0/">实践记录</a></nav>
    </div>
    <figure class="builder-project__media">
      <picture><source media="(max-width: 767px)" srcset="/assets/images/projects/zhililab-contentops-960.webp"><img src="/assets/images/projects/zhililab-contentops-1600.webp" width="1600" height="900" alt="ZHILILAB ContentOps 网站首页"></picture>
    </figure>
  </article>

  <article class="builder-project" id="python-learning-resources">
    <div class="builder-project__story">
      <p class="builder-project__number">Build 04</p>
      <h2>Python Learning Resources</h2>
      <p class="builder-project__status">自动更新 · 公开仓库</p>
      <p class="builder-project__stack">Python · GitHub Actions · Markdown</p>
      <dl class="builder-project__evidence">
        <dt>动机</dt><dd>把分散的 Python 学习资料整理成可以持续维护、快速浏览和复用的学习入口。</dd>
        <dt>方法</dt><dd>按教程、实践、最佳实践和开源项目组织内容，并通过自动化每日刷新仓库文档。</dd>
        <dt>结果</dt><dd>公开仓库形成持续更新的 Python 学习资源索引，并保留可审阅的 Markdown 记录。</dd>
        <dt>当前边界</dt><dd>自动收集结果仍需要人工抽查来源质量；它是学习索引，不替代完整课程或官方文档。</dd>
      </dl>
      <nav class="builder-project__links" aria-label="Python Learning Resources 项目链接"><a href="https://github.com/zhililab/Python-Learning-Resources" target="_blank" rel="noopener">GitHub 仓库</a></nav>
    </div>
    <figure class="builder-project__media">
      <picture><source media="(max-width: 767px)" srcset="/assets/images/projects/python-learning-resources-960.webp"><img src="/assets/images/projects/python-learning-resources-1600.webp" width="1600" height="900" alt="Python Learning Resources 公开仓库 README"></picture>
    </figure>
  </article>
</section>
```

The source file must use the four concrete article blocks above without adding generated usage claims or extra project cards.

- [ ] **Step 6: Run the focused page tests**

Run: `node --test test/blog-projects-page.test.js`

Expected: project order, narrative fields, carousel structure, and media-dimension tests pass.

- [ ] **Step 7: Commit reviewed content and real media**

```bash
git add source/projects/index.md source/assets/images/projects test/blog-projects-page.test.js
git commit -m "content: publish builder project casebook"
```

---

### Task 4: Implement Studio Casebook Presentation

**Files:**
- Create: `source/css/blog-projects.css`
- Modify: `test/blog-projects-page.test.js`

**Interfaces:**
- Consumes: `.builder-projects`, `.builder-project`, `.builder-project__story`, `.builder-project__media`, and `.builder-carousel__*` from Task 3.
- Produces: consistent 36/64 desktop rows, stacked mobile rows, visible focus, and stable 16:9 media.

- [ ] **Step 1: Add failing CSS contract tests**

```js
test('projects CSS preserves the approved desktop and mobile layout', () => {
  const css = read('source/css/blog-projects.css');
  assert.match(css, /grid-template-columns:\s*minmax\(280px,\s*0\.36fr\)\s+minmax\(0,\s*0\.64fr\)/);
  assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(css, /@media\s*\(max-width:\s*767px\)/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test test/blog-projects-page.test.js`

Expected: FAIL because `source/css/blog-projects.css` does not exist.

- [ ] **Step 3: Implement scoped CSS**

Create `source/css/blog-projects.css` with the complete scoped presentation:

```css
.builder-projects-page {
  --projects-bg: #07090d;
  --projects-surface: #0d1118;
  --projects-line: #2a313d;
  --projects-text: #f3f5f7;
  --projects-muted: #a6afbb;
  --projects-cyan: #35d4ff;
  --projects-amber: #f2a524;
  background: var(--projects-bg);
  color: var(--projects-text);
}

.builder-projects-page main > .container,
.builder-projects-page #board,
.builder-projects-page #board > .container,
.builder-projects-page #board .row,
.builder-projects-page #board .page-content {
  max-width: none;
  width: 100%;
}

.builder-projects-page main > .container,
.builder-projects-page #board > .container,
.builder-projects-page #board .row,
.builder-projects-page #board .page-content {
  margin: 0;
  padding: 0;
}

.builder-projects-page #board {
  background: var(--projects-bg);
  border-radius: 0;
  box-shadow: none;
  margin: 0;
}

.builder-projects-page #board .col-12 {
  flex: 0 0 100%;
  max-width: 100%;
}

.builder-projects {
  box-sizing: border-box;
  margin: 0 auto;
  max-width: 1180px;
  padding: 56px 28px 96px;
}

.builder-projects__intro {
  border-bottom: 1px solid var(--projects-line);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  padding-bottom: 40px;
}

.builder-projects__eyebrow {
  color: var(--projects-cyan);
  font-size: 13px;
  font-weight: 700;
  grid-column: 1 / -1;
  margin: 0 0 12px;
  text-transform: uppercase;
}

.builder-projects__intro h1 {
  color: var(--projects-text);
  font-size: 48px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.08;
  margin: 0 0 14px;
}

.builder-projects__intro > p:not(.builder-projects__eyebrow) {
  color: var(--projects-muted);
  font-size: 16px;
  line-height: 1.75;
  margin: 0;
}

.builder-projects__intro time {
  align-self: end;
  color: var(--projects-muted);
  font-size: 12px;
  grid-column: 2;
  grid-row: 2 / 4;
  text-transform: uppercase;
}

.builder-project {
  border-bottom: 1px solid var(--projects-line);
  display: grid;
  gap: 48px;
  grid-template-columns: minmax(280px, 0.36fr) minmax(0, 0.64fr);
  padding: 68px 0;
}

.builder-project__story {
  min-width: 0;
}

.builder-project__number {
  color: var(--projects-cyan);
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 20px;
  text-transform: uppercase;
}

.builder-project__number::after {
  background: var(--projects-cyan);
  content: "";
  display: block;
  height: 3px;
  margin-top: 10px;
  width: 22px;
}

.builder-project__story h2 {
  color: var(--projects-text);
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.2;
  margin: 0 0 12px;
  overflow-wrap: anywhere;
}

.builder-project__status {
  color: var(--projects-amber);
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 8px;
}

.builder-project__stack {
  color: var(--projects-muted);
  font-size: 13px;
  line-height: 1.6;
  margin: 0 0 28px;
}

.builder-project__evidence {
  margin: 0;
}

.builder-project__evidence dt,
.builder-project__evidence dd {
  border-top: 1px solid var(--projects-line);
  box-sizing: border-box;
  display: inline-block;
  margin: 0;
  padding-top: 16px;
  vertical-align: top;
}

.builder-project__evidence dt {
  color: var(--projects-text);
  font-size: 15px;
  font-weight: 700;
  padding-right: 12px;
  width: 24%;
}

.builder-project__evidence dd {
  color: var(--projects-muted);
  font-size: 15px;
  line-height: 1.75;
  padding-bottom: 16px;
  width: 76%;
}

.builder-project__links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 22px;
  margin-top: 18px;
}

.builder-project__links a {
  color: var(--projects-text);
  font-size: 15px;
  text-decoration: underline;
  text-decoration-color: var(--projects-cyan);
  text-underline-offset: 5px;
}

.builder-project__media {
  align-self: start;
  aspect-ratio: 16 / 9;
  background: var(--projects-surface);
  border: 1px solid var(--projects-line);
  box-shadow: none;
  margin: 0;
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.builder-project__media figure,
.builder-project__media picture {
  display: block;
  height: 100%;
  margin: 0;
  width: 100%;
}

.builder-project__media [hidden] {
  display: none !important;
}

.builder-project__media img {
  display: block;
  height: 100%;
  object-fit: contain;
  width: 100%;
}

.builder-project__media [data-carousel-prev],
.builder-project__media [data-carousel-next] {
  align-items: center;
  background: rgba(7, 9, 13, 0.82);
  border: 1px solid var(--projects-line);
  color: var(--projects-text);
  display: flex;
  height: 42px;
  justify-content: center;
  padding: 0;
  position: absolute;
  top: calc(50% - 21px);
  width: 42px;
  z-index: 2;
}

.builder-project__media [data-carousel-prev] { left: 12px; }
.builder-project__media [data-carousel-next] { right: 12px; }

.builder-carousel__dots {
  bottom: 12px;
  display: flex;
  gap: 8px;
  left: 50%;
  position: absolute;
  transform: translateX(-50%);
  z-index: 2;
}

.builder-carousel__dots button {
  background: var(--projects-muted);
  border: 0;
  border-radius: 50%;
  height: 10px;
  padding: 0;
  width: 10px;
}

.builder-carousel__dots button[aria-current="true"] {
  background: var(--projects-cyan);
}

.builder-projects a:focus-visible,
.builder-projects button:focus-visible,
.builder-projects [data-project-carousel]:focus-visible {
  outline: 3px solid var(--projects-cyan);
  outline-offset: 4px;
}

@media (max-width: 767px) {
  .builder-projects {
    padding: 36px 18px 64px;
  }

  .builder-projects__intro {
    display: block;
    padding-bottom: 30px;
  }

  .builder-projects__intro h1 {
    font-size: 36px;
  }

  .builder-projects__intro time {
    display: block;
    margin-top: 18px;
  }

  .builder-project {
    gap: 28px;
    grid-template-columns: minmax(0, 1fr);
    padding: 48px 0;
  }

  .builder-project__story h2 {
    font-size: 27px;
  }

  .builder-project__evidence dt,
  .builder-project__evidence dd {
    display: block;
    width: 100%;
  }

  .builder-project__evidence dt {
    padding-bottom: 4px;
  }

  .builder-project__evidence dd {
    border-top: 0;
    font-size: 15px;
    padding-top: 0;
  }

  .builder-project__media [data-carousel-prev],
  .builder-project__media [data-carousel-next] {
    height: 40px;
    top: calc(50% - 20px);
    width: 40px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .builder-projects *,
  .builder-projects *::before,
  .builder-projects *::after {
    animation-duration: 0.01ms !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Run focused tests and verify pass**

Run: `node --test test/blog-projects-page.test.js test/blog-projects-filter.test.js test/blog-projects-client.test.js`

Expected: all project page tests pass.

- [ ] **Step 5: Commit the presentation layer**

```bash
git add source/css/blog-projects.css test/blog-projects-page.test.js
git commit -m "feat: style builder project casebook"
```

---

### Task 5: Build, Integrate, And Visually Verify

**Files:**
- Modify: `test/site-identity.test.js`
- Verify: `public/projects/index.html`
- Verify: `public/css/blog-projects.css`
- Verify: `public/js/blog-projects.js`

**Interfaces:**
- Consumes: Tasks 1-4.
- Produces: a fresh static build that passes the full suite and matches the approved desktop/mobile direction.

- [ ] **Step 1: Update generated-page assertions**

Replace the old Projects assertions with:

```js
assert.match(projects, /class="builder-projects"/);
assert.equal((projects.match(/class="builder-project"/g) || []).length, 4);
assert.match(projects, /DevOps Agent Control Plane/);
assert.match(projects, /Tutorial-to-Template/);
assert.match(projects, /ZHILILAB ContentOps/);
assert.match(projects, /Python Learning Resources/);
assert.match(projects, /href="\/css\/blog-projects\.css"/);
assert.match(projects, /src="\/js\/blog-projects\.js"/);
assert.match(projects, /data-project-carousel/);
```

- [ ] **Step 2: Run summary and clean build gates**

Run: `npm run summary:check`

Expected: `AI summaries are approved and current.`

Run: `npm run clean`

Expected: Hexo removes generated files without errors.

Run: `npm run build`

Expected: Hexo generates `/projects/index.html` and the new CSS, JavaScript, and project media.

- [ ] **Step 3: Run focused and full tests**

Run: `node --test test/blog-projects-*.test.js test/site-identity.test.js`

Expected: all focused tests pass.

Run: `npm test`

Expected: the entire existing suite plus new project tests passes with zero failures.

- [ ] **Step 4: Start a local static preview**

Run: `npm run serve:public`

Expected: local server prints a reachable URL and remains running for browser verification.

- [ ] **Step 5: Capture desktop and mobile screenshots**

Use browser viewports 1440x1100 and 390x844. Capture full-page `/projects/` images after fonts and all project media load. Verify:

- all four desktop rows are left-text/right-media;
- no media appears in the left column;
- DevOps shows one active slide in one viewport;
- the screenshot remains sharp at 100% browser zoom;
- Chinese labels and descriptions are not clipped;
- mobile is narrative-first then media with no horizontal overflow;
- slideshow buttons, dots, ArrowLeft, ArrowRight, Home, End, and swipe change exactly one slide;
- reduced-motion mode does not animate slide changes.

- [ ] **Step 6: Compare against the approved visual target**

Place the final generated direction and each implementation screenshot in one visual comparison input. Correct visible mismatches in width, proportions, typography, dividers, image fitting, spacing, focus states, and responsive order, then capture again at the same viewports.

- [ ] **Step 7: Run final repository checks**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git status --short`

Expected: only intended project-page changes and pre-existing ignored/untracked visual artifacts; no unrelated source changes staged.

- [ ] **Step 8: Commit final rendered contracts**

```bash
git add test/site-identity.test.js
git commit -m "test: verify rendered builder projects page"
```

Do not deploy or push. Report the local preview, screenshot paths, build result, full test count, and any remaining media or accessibility caveat to the user.
