'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  initControlledAd,
  loadAdsenseScript,
  watchAdStatus
} = require('../source/js/blog-monetization');

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

  const first = loadAdsenseScript(documentObject, 'ca-pub-1234567890123456');
  const second = loadAdsenseScript(documentObject, 'ca-pub-1234567890123456');

  assert.equal(first, second);
  assert.equal(appended.length, 1);
  assert.equal(
    appended[0].src,
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456'
  );
  assert.equal(appended[0].crossOrigin, 'anonymous');
});

test('does nothing when no active slot exists', () => {
  assert.equal(initControlledAd({
    querySelector() { return null; }
  }, {}), false);
});

test('waits for the slot to approach the viewport before requesting an ad', async () => {
  const { appended, documentObject } = createDocument();
  const unit = {
    getAttribute() { return null; }
  };
  const container = {
    dataset: {
      adClient: 'ca-pub-1234567890123456',
      adSlot: '1234567890'
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
