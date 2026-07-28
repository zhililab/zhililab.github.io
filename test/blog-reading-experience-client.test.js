'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildSharePayload,
  buildTextFragmentUrl,
  copyText,
  deferAnalytics,
  enhanceImages,
  enhanceTables,
  initMermaid,
  initPet,
  initSelectionShare,
  normalizeSelection,
  prefetchResponsiveImages
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

test('does not wrap syntax-highlight layout tables as data tables', () => {
  const { root, table } = makeTableFixture();
  table.closest = (selector) => selector === 'figure.highlight' ? {} : null;

  enhanceTables(root);

  assert.equal(root.wrapperCount, 0);
  assert.equal(table.parentNode.className, undefined);
});

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

test('loads at most two deferred responsive post images after page load', () => {
  const listeners = [];
  const idleCallbacks = [];
  const created = [];
  const images = Array.from({ length: 3 }, (_, index) => ({
    dataset: {
      src: `/assets/images/posts/image-${index}.png`,
      srcset: `/assets/images/optimized/image-${index}-640.webp 640w`
    },
    sizes: '100vw',
    parentNode: {
      querySelector() {
        return {
          dataset: {
            srcset: `/assets/images/optimized/image-${index}-640.webp 640w`
          },
          srcset: ''
        };
      }
    },
    removeAttribute(name) {
      this.removedAttribute = name;
    }
  }));
  const document = {
    querySelectorAll(selector) {
      assert.equal(
        selector,
        '.markdown-body img[data-blog-deferred-image]'
      );
      return images;
    }
  };
  const window = {
    Image: class {
      constructor() {
        created.push(this);
      }
      set srcset(value) {
        this._srcset = value;
        if (typeof this.onload === 'function') this.onload();
      }
      get srcset() {
        return this._srcset;
      }
    },
    addEventListener(name, handler) {
      listeners.push({ name, handler });
    },
    requestIdleCallback(handler) {
      idleCallbacks.push(handler);
    }
  };

  assert.equal(prefetchResponsiveImages(document, window), true);
  listeners[0].handler();
  idleCallbacks[0]();

  assert.equal(created.length, 2);
  assert.equal(created[0].srcset, images[0].dataset.srcset);
  assert.equal(created[1].sizes, images[1].sizes);
  assert.equal(images[0].src, images[0].dataset.src);
  assert.equal(images[0].srcset, images[0].dataset.srcset);
  assert.equal(images[0].removedAttribute, 'data-blog-deferred-image');
  assert.equal(images[2].src, undefined);
});

test('builds a bounded Text Fragment share payload without query parameters', () => {
  const text = '  Agentic DevOps  '.repeat(40);
  const location = {
    origin: 'http://www.zhililab.cn',
    pathname: '/2026/07/22/article/',
    search: '?tracking=1'
  };
  const payload = buildSharePayload(
    { title: 'Agentic DevOps 调研报告' },
    location,
    text
  );

  assert.equal(payload.title, 'Agentic DevOps 调研报告');
  assert.equal(normalizeSelection(text).length <= 280, true);
  assert.equal(payload.text, `“${normalizeSelection(text)}”`);
  assert.match(payload.url, /\/2026\/07\/22\/article\/#:~:text=/);
  assert.doesNotMatch(payload.url, /\?/);
  assert.equal(
    payload.url,
    buildTextFragmentUrl(location, normalizeSelection(text))
  );
});

test('copies text with the Clipboard API when available', async () => {
  const writes = [];

  assert.equal(
    await copyText(
      'quoted text',
      {},
      { clipboard: { writeText: async (value) => writes.push(value) } }
    ),
    true
  );
  assert.deepEqual(writes, ['quoted text']);
});

function makeSelectionShareFixture({ insideArticle = true, share } = {}) {
  const documentListeners = new Map();
  const windowListeners = new Map();
  const appended = [];
  const clipboardWrites = [];

  class Element {
    constructor(tagName) {
      this.tagName = tagName;
      this.children = [];
      this.listeners = new Map();
      this.style = {};
      this.dataset = {};
      this.hidden = false;
      this.attributes = {};
      this.classList = makeClassList();
    }
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }
    addEventListener(name, handler) {
      this.listeners.set(name, handler);
    }
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
    contains(node) {
      return node === this || this.children.includes(node);
    }
  }

  const article = new Element('article');
  article.contains = () => insideArticle;
  const anchorElement = {
    closest(selector) {
      return selector === '.markdown-body' && insideArticle ? article : null;
    }
  };
  const selection = {
    anchorNode: { parentElement: anchorElement },
    isCollapsed: false,
    rangeCount: 1,
    toString: () => '  状态收敛是 Agentic DevOps 的核心  ',
    getRangeAt: () => ({
      getBoundingClientRect: () => ({
        left: 120,
        right: 420,
        top: 300,
        bottom: 330,
        width: 300,
        height: 30
      })
    })
  };
  const document = {
    title: 'Agentic DevOps 调研报告',
    body: {
      appendChild(node) {
        appended.push(node);
      }
    },
    createElement: (tagName) => new Element(tagName),
    querySelector: (selector) => selector === '.markdown-body' ? article : null,
    addEventListener(name, handler) {
      documentListeners.set(name, handler);
    }
  };
  const window = {
    innerWidth: 1024,
    innerHeight: 768,
    scrollX: 0,
    scrollY: 0,
    location: {
      origin: 'http://www.zhililab.cn',
      pathname: '/2026/07/22/article/'
    },
    navigator: {
      share,
      clipboard: {
        async writeText(value) {
          clipboardWrites.push(value);
        }
      }
    },
    getSelection: () => selection,
    addEventListener(name, handler) {
      windowListeners.set(name, handler);
    },
    setTimeout(handler) {
      handler();
      return 1;
    },
    clearTimeout() {}
  };

  return {
    article,
    appended,
    clipboardWrites,
    document,
    documentListeners,
    selection,
    window,
    windowListeners
  };
}

test('shows a selection toolbar and uses Web Share for article text', async () => {
  const shares = [];
  const fixture = makeSelectionShareFixture({
    share: async (payload) => shares.push(payload)
  });

  assert.equal(initSelectionShare(fixture.document, fixture.window), true);
  fixture.documentListeners.get('mouseup')();

  const toolbar = fixture.appended[0];
  assert.equal(toolbar.id, 'selection-share-toolbar');
  assert.equal(toolbar.hidden, false);
  assert.deepEqual(toolbar.children.map((button) => button.textContent), [
    '分享',
    '复制引用'
  ]);

  await toolbar.children[0].listeners.get('click')();
  assert.equal(shares.length, 1);
  assert.match(shares[0].url, /#:~:text=/);
  assert.match(shares[0].text, /状态收敛/);
});

test('falls back to copying the quote when Web Share is unavailable', async () => {
  const fixture = makeSelectionShareFixture();

  initSelectionShare(fixture.document, fixture.window);
  fixture.documentListeners.get('mouseup')();
  const toolbar = fixture.appended[0];
  await toolbar.children[0].listeners.get('click')();

  assert.equal(fixture.clipboardWrites.length, 1);
  assert.match(fixture.clipboardWrites[0], /状态收敛/);
  assert.match(fixture.clipboardWrites[0], /Agentic DevOps 调研报告/);
  assert.match(fixture.clipboardWrites[0], /#:~:text=/);
});

test('ignores selection outside the article and closes on Escape', () => {
  const outside = makeSelectionShareFixture({ insideArticle: false });
  initSelectionShare(outside.document, outside.window);
  outside.documentListeners.get('mouseup')();
  assert.equal(outside.appended[0].hidden, true);

  const inside = makeSelectionShareFixture();
  initSelectionShare(inside.document, inside.window);
  inside.documentListeners.get('mouseup')();
  assert.equal(inside.appended[0].hidden, false);
  inside.documentListeners.get('keydown')({ key: 'Escape' });
  assert.equal(inside.appended[0].hidden, true);
});
