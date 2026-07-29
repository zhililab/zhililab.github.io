'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {
  initControlledAd,
  loadAdsenseScript,
  watchAdStatus
} = require('../source/js/blog-monetization');

const TEST_CLIENT = `ca-pub-${'1234'.repeat(4)}`;
const TEST_SLOT = `${'12345'}${'67890'}`;

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

  const first = loadAdsenseScript(documentObject, TEST_CLIENT);
  const second = loadAdsenseScript(documentObject, TEST_CLIENT);

  assert.equal(first, second);
  assert.equal(appended.length, 1);
  assert.equal(
    appended[0].src,
    `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${TEST_CLIENT}`
  );
  assert.equal(appended[0].crossOrigin, 'anonymous');
});

test('co-loads both classic browser scripts in one global context', () => {
  const context = vm.createContext({});
  const readingExperienceSource = fs.readFileSync(
    require.resolve('../source/js/blog-reading-experience'),
    'utf8'
  );
  const monetizationSource = fs.readFileSync(
    require.resolve('../source/js/blog-monetization'),
    'utf8'
  );

  assert.doesNotThrow(() => {
    vm.runInContext(readingExperienceSource, context);
    vm.runInContext(monetizationSource, context);
  });
});

test('does nothing when no active slot exists', () => {
  assert.equal(initControlledAd({
    querySelector() { return null; }
  }, {}), false);
});

test('rejects a missing ad slot before initialization', () => {
  const { appended, documentObject } = createDocument();
  const container = {
    dataset: {
      adClient: TEST_CLIENT
    },
    querySelector() { return null; }
  };
  documentObject.querySelector = () => container;

  assert.equal(initControlledAd(documentObject, {
    addEventListener() {}
  }), false);
  assert.equal(container.dataset.initialized, undefined);
  assert.equal(appended.length, 0);
});

test('rejects an invalid ad slot before initialization', () => {
  const { appended, documentObject } = createDocument();
  const container = {
    dataset: {
      adClient: TEST_CLIENT,
      adSlot: 'not-a-slot'
    },
    querySelector() { return null; }
  };
  documentObject.querySelector = () => container;

  assert.equal(initControlledAd(documentObject, {
    addEventListener() {}
  }), false);
  assert.equal(container.dataset.initialized, undefined);
  assert.equal(appended.length, 0);
});

test('waits for the slot to approach the viewport before requesting an ad', async () => {
  const { appended, documentObject } = createDocument();
  const unit = {
    getAttribute() { return null; }
  };
  const container = {
    dataset: {
      adClient: TEST_CLIENT,
      adSlot: TEST_SLOT
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

test('fallback waits for viewport proximity before requesting an ad', () => {
  const { appended, documentObject } = createDocument();
  let top = 1600;
  const container = {
    dataset: {
      adClient: TEST_CLIENT,
      adSlot: TEST_SLOT
    },
    getBoundingClientRect() {
      return { top, bottom: top + 120 };
    },
    querySelector() { return null; }
  };
  documentObject.querySelector = () => container;

  const listeners = {};
  const windowObject = {
    innerHeight: 800,
    addEventListener(type, handler, options) {
      listeners[type] = { handler, options };
    }
  };

  assert.equal(initControlledAd(documentObject, windowObject), true);
  assert.equal(appended.length, 0);
  assert.equal(listeners.scroll, undefined);
  assert.equal(listeners.resize, undefined);
  assert.deepEqual(listeners.load.options, { once: true });
  listeners.load.handler();
  assert.equal(appended.length, 0);
  assert.deepEqual(listeners.scroll.options, { passive: true });
  assert.deepEqual(listeners.resize.options, { passive: true });

  top = 1000;
  listeners.scroll.handler();
  assert.equal(appended.length, 1);

  listeners.scroll.handler();
  assert.equal(appended.length, 1);
});

test('fallback checks viewport proximity immediately after window load', () => {
  const { appended, documentObject } = createDocument();
  const container = {
    dataset: {
      adClient: TEST_CLIENT,
      adSlot: TEST_SLOT
    },
    getBoundingClientRect() {
      return { top: 1000, bottom: 1120 };
    },
    querySelector() { return null; }
  };
  documentObject.querySelector = () => container;

  const listeners = {};
  assert.equal(initControlledAd(documentObject, {
    innerHeight: 800,
    addEventListener(type, handler, options) {
      listeners[type] = { handler, options };
    }
  }), true);
  assert.equal(appended.length, 0);

  listeners.load.handler();
  assert.equal(appended.length, 1);
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
