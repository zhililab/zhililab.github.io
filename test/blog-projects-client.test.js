const assert = require('node:assert/strict');
const test = require('node:test');
const {
  createProjectCarousel,
  initProjectCarousels,
  createProjectTrace,
  initProjectTraces
} = require('../source/js/blog-projects');

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

test('keeps one deterministic slide visible for invalid and large-negative indices', () => {
  const { root, slides, dots } = fixture();
  const carousel = createProjectCarousel(root);
  carousel.show(-1000001);
  assert.deepEqual(slides.map((slide) => slide.hidden), [true, false, true]);
  dots[1].dataset.slideIndex = 'not-a-number';
  dots[1].listeners.click();
  assert.deepEqual(slides.map((slide) => slide.hidden), [false, true, true]);
  carousel.show(1.5);
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

test('cancels an interrupted swipe before it can change slides', () => {
  const { root, slides } = fixture();
  createProjectCarousel(root);
  root.listeners.pointerdown({ clientX: 140 });
  root.listeners.pointercancel();
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

test('destroys listeners and readiness so the carousel can be initialized again', () => {
  const fixtureData = fixture();
  const { root, nextButton, slides } = fixtureData;
  const doc = { querySelectorAll: () => [root] };
  const carousel = createProjectCarousel(root);
  assert.equal(root.dataset.carouselReady, 'true');
  carousel.destroy();
  assert.equal(root.dataset.carouselReady, undefined);
  assert.equal(root.listeners.keydown, undefined);
  assert.equal(root.listeners.pointerdown, undefined);
  assert.equal(root.listeners.pointercancel, undefined);
  assert.equal(root.listeners.pointerup, undefined);
  assert.equal(nextButton.listeners.click, undefined);
  assert.equal(initProjectCarousels(doc), 1);
  nextButton.listeners.click();
  assert.equal(slides[1].hidden, false);
});

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

test('activates traces immediately without IntersectionObserver', () => {
  const { root } = traceFixture();
  const trace = createProjectTrace(root);
  assert.equal(root.classList.contains('is-trace-active'), true);
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

test('initializes each trace once', () => {
  const first = traceFixture().root;
  const second = traceFixture().root;
  const doc = { querySelectorAll: () => [first, second] };
  assert.equal(initProjectTraces(doc, { createObserver: immediateObserver }), 2);
  assert.equal(initProjectTraces(doc, { createObserver: immediateObserver }), 0);
});

test('destroys trace listeners, classes, observer, and readiness', () => {
  const { root, stages } = traceFixture();
  let disconnected = false;
  const trace = createProjectTrace(root, {
    createObserver(callback) {
      return {
        observe(target) { callback([{ target, isIntersecting: true }]); },
        disconnect() { disconnected = true; }
      };
    }
  });
  stages[0].listeners.click();
  trace.destroy();
  assert.equal(disconnected, true);
  assert.equal(root.dataset.traceReady, undefined);
  assert.equal(root.listeners.pointerenter, undefined);
  assert.equal(root.listeners.pointerleave, undefined);
  assert.equal(root.listeners.focusin, undefined);
  assert.equal(root.listeners.focusout, undefined);
  assert.equal(root.listeners.keydown, undefined);
  assert.equal(stages[0].listeners.click, undefined);
  assert.equal(root.classList.contains('is-trace-active'), false);
  assert.equal(root.classList.contains('is-trace-paused'), false);
  assert.equal(root.classList.contains('is-trace-pinned'), false);
});
