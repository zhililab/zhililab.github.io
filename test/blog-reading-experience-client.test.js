'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  deferAnalytics,
  enhanceImages,
  enhanceTables,
  initMermaid,
  initPet
} = require('../source/js/blog-reading-experience');

function makeClassList(initial = []) {
  const values = new Set(initial);
  return {
    add(value) {
      values.add(value);
    },
    remove(value) {
      values.delete(value);
    },
    contains(value) {
      return values.has(value);
    }
  };
}

function makeTableFixture(columnCount = 7) {
  const root = {
    wrapperCount: 0,
    querySelectorAll() {
      return [table];
    }
  };
  const parent = {
    insertBefore(wrapper, node) {
      assert.equal(node, table);
      root.wrapperCount += 1;
      wrapper.parentNode = parent;
      table.parentNode = wrapper;
    }
  };
  const document = {
    createElement(tagName) {
      assert.equal(tagName, 'div');
      return {
        className: '',
        classList: makeClassList(),
        tabIndex: -1,
        attributes: {},
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
        appendChild(node) {
          node.parentNode = this;
        }
      };
    }
  };
  const table = {
    ownerDocument: document,
    parentNode: parent,
    rows: [{ cells: Array.from({ length: columnCount }) }]
  };

  return { root, table };
}

function makeImageFixture() {
  return {
    decoding: 'auto',
    loading: 'lazy'
  };
}

function makePetFixture({ desktop, reducedMotion }) {
  const listeners = [];
  const timers = [];
  const pet = {
    dataset: {},
    classList: makeClassList(),
    addEventListener(name, handler) {
      listeners.push({ name, handler });
    },
    click() {
      const listener = listeners.find((item) => item.name === 'click');
      if (listener) listener.handler();
    },
    get listenerCount() {
      return listeners.length;
    }
  };
  const document = {
    getElementById(id) {
      return id === 'blog-pet' ? pet : null;
    }
  };
  const window = {
    matchMedia(query) {
      if (query.includes('min-width')) return { matches: desktop };
      if (query.includes('prefers-reduced-motion')) return { matches: reducedMotion };
      return { matches: false };
    },
    setTimeout(handler) {
      timers.push(handler);
      return timers.length;
    },
    clearTimeout() {},
    runTimer() {
      const handler = timers.shift();
      if (handler) handler();
    }
  };

  return { document, window, pet, runTimer: window.runTimer };
}

test('wraps each table once and preserves the table node', () => {
  const { root, table } = makeTableFixture();

  enhanceTables(root);
  enhanceTables(root);

  assert.equal(table.parentNode.className, 'table-scroll table-scroll--wide');
  assert.equal(table.parentNode.tabIndex, 0);
  assert.equal(table.parentNode.attributes.role, 'region');
  assert.equal(table.parentNode.attributes['aria-label'], '可横向滚动的数据表格');
  assert.equal(root.wrapperCount, 1);
});

test('does not mark a short table as wide', () => {
  const { root, table } = makeTableFixture(2);

  enhanceTables(root);

  assert.equal(table.parentNode.className, 'table-scroll');
});

test('adds async decoding without replacing existing image loading behavior', () => {
  const image = makeImageFixture();

  enhanceImages({ querySelectorAll: () => [image] });

  assert.equal(image.decoding, 'async');
  assert.equal(image.loading, 'lazy');
});

test('renders pending Mermaid diagrams when the library is available', () => {
  const diagrams = [{ dataset: {} }];
  const calls = [];
  const document = {
    querySelectorAll(selector) {
      assert.equal(selector, '.mermaid:not([data-processed="true"])');
      return diagrams;
    }
  };
  const window = {
    mermaid: {
      init(config, nodes) {
        calls.push({ config, nodes });
      }
    }
  };

  assert.equal(initMermaid(document, window), true);
  assert.deepEqual(calls, [{ config: undefined, nodes: diagrams }]);
});

test('does not initialize pet below desktop width', () => {
  const fixture = makePetFixture({ desktop: false, reducedMotion: false });

  assert.equal(initPet(fixture.document, fixture.window), false);
  assert.equal(fixture.pet.listenerCount, 0);
});

test('clicking the desktop pet reveals then hides its status bubble', () => {
  const fixture = makePetFixture({ desktop: true, reducedMotion: false });

  assert.equal(initPet(fixture.document, fixture.window), true);
  assert.equal(initPet(fixture.document, fixture.window), true);
  assert.equal(fixture.pet.listenerCount, 1);

  fixture.pet.click();
  assert.equal(fixture.pet.classList.contains('is-speaking'), true);

  fixture.runTimer();
  assert.equal(fixture.pet.classList.contains('is-speaking'), false);
});

test('loads visitor analytics only after page load and browser idle time', () => {
  const listeners = [];
  const idleCallbacks = [];
  const appended = [];
  const document = {
    createElement(tagName) {
      assert.equal(tagName, 'script');
      return { async: false, src: '' };
    },
    head: {
      appendChild(node) {
        appended.push(node);
      }
    }
  };
  const window = {
    addEventListener(name, handler, options) {
      listeners.push({ name, handler, options });
    },
    requestIdleCallback(handler, options) {
      idleCallbacks.push({ handler, options });
    }
  };

  assert.equal(deferAnalytics(document, window), true);
  assert.equal(appended.length, 0);
  assert.equal(listeners.length, 1);
  assert.equal(listeners[0].name, 'load');
  assert.deepEqual(listeners[0].options, { once: true });

  listeners[0].handler();
  assert.equal(appended.length, 0);
  assert.equal(idleCallbacks.length, 1);
  assert.equal(idleCallbacks[0].options.timeout, 3000);

  idleCallbacks[0].handler();
  assert.equal(appended.length, 1);
  assert.equal(appended[0].async, true);
  assert.equal(
    appended[0].src,
    'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
  );
});
