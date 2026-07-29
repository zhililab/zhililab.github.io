'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { initAiSummaries } = require('../source/js/blog-reading-experience');

function makeElement(attributes = {}) {
  const listeners = new Map();
  return {
    attributes: { ...attributes },
    hidden: false,
    focusCount: 0,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    getAttribute(name) {
      return this.attributes[name] || null;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    click() {
      listeners.get('click')();
    },
    keydown(key) {
      let prevented = false;
      listeners.get('keydown')({
        key,
        preventDefault() {
          prevented = true;
        }
      });
      return prevented;
    },
    focus() {
      this.focusCount += 1;
    }
  };
}

function createSummaryFixture() {
  const tabs = ['概览', '要点', '行动'].map((label, index) => makeElement({
    role: 'tab',
    'aria-selected': index === 0 ? 'true' : 'false',
    tabindex: index === 0 ? '0' : '-1',
    'aria-controls': `summary-panel-${index}`,
    'aria-label': label
  }));
  const panels = tabs.map((tab, index) => makeElement({
    role: 'tabpanel',
    id: tab.getAttribute('aria-controls'),
    'aria-labelledby': `summary-tab-${index}`
  }));
  panels.forEach((panel, index) => {
    panel.hidden = index !== 0;
  });
  const component = {
    dataset: {},
    querySelectorAll(selector) {
      if (selector === '[role="tab"]') return tabs;
      if (selector === '[role="tabpanel"]') return panels;
      throw new Error(`unexpected selector: ${selector}`);
    }
  };
  return {
    document: {
      querySelectorAll(selector) {
        assert.equal(selector, '[data-ai-summary]');
        return [component];
      }
    },
    component,
    tabs,
    panels
  };
}

test('activates one tab and updates aria-selected, tabindex, and hidden panels', () => {
  const fixture = createSummaryFixture();

  assert.equal(initAiSummaries(fixture.document), 1);
  fixture.tabs[1].click();

  assert.equal(fixture.tabs[0].getAttribute('aria-selected'), 'false');
  assert.equal(fixture.tabs[0].getAttribute('tabindex'), '-1');
  assert.equal(fixture.tabs[1].getAttribute('aria-selected'), 'true');
  assert.equal(fixture.tabs[1].getAttribute('tabindex'), '0');
  assert.equal(fixture.panels[0].hidden, true);
  assert.equal(fixture.panels[1].hidden, false);
  assert.equal(fixture.panels[2].hidden, true);
});

test('moves keyboard selection with ArrowLeft, ArrowRight, Home, and End', () => {
  const fixture = createSummaryFixture();
  initAiSummaries(fixture.document);

  assert.equal(fixture.tabs[0].keydown('ArrowLeft'), true);
  assert.equal(fixture.tabs[2].getAttribute('aria-selected'), 'true');
  assert.equal(fixture.tabs[2].focusCount, 1);

  assert.equal(fixture.tabs[2].keydown('ArrowRight'), true);
  assert.equal(fixture.tabs[0].getAttribute('aria-selected'), 'true');
  assert.equal(fixture.tabs[0].focusCount, 1);

  fixture.tabs[1].keydown('Home');
  assert.equal(fixture.tabs[0].getAttribute('aria-selected'), 'true');
  fixture.tabs[0].keydown('End');
  assert.equal(fixture.tabs[2].getAttribute('aria-selected'), 'true');
});

test('returns zero when the page has no AI summary component', () => {
  assert.equal(initAiSummaries({ querySelectorAll: () => [] }), 0);
});

test('initializes each summary component only once', () => {
  const fixture = createSummaryFixture();

  assert.equal(initAiSummaries(fixture.document), 1);
  assert.equal(initAiSummaries(fixture.document), 0);
  fixture.tabs[1].click();

  assert.equal(fixture.tabs[1].getAttribute('aria-selected'), 'true');
  assert.equal(fixture.component.dataset.aiSummaryInitialized, 'true');
});
