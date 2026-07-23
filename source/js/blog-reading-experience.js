'use strict';

function hasClass(element, className) {
  if (!element) return false;
  if (element.classList && element.classList.contains(className)) return true;
  return String(element.className || '').split(/\s+/).includes(className);
}

function enhanceTables(root) {
  root.querySelectorAll('.markdown-body table').forEach((table) => {
    if (hasClass(table.parentNode, 'table-scroll')) return;

    const wrapper = table.ownerDocument.createElement('div');
    const columnCount = table.rows && table.rows[0] ? table.rows[0].cells.length : 0;
    wrapper.className = columnCount >= 4
      ? 'table-scroll table-scroll--wide'
      : 'table-scroll';
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

function deferAnalytics(documentObject, windowObject) {
  if (
    !documentObject ||
    !documentObject.head ||
    typeof documentObject.createElement !== 'function' ||
    !windowObject ||
    typeof windowObject.addEventListener !== 'function'
  ) {
    return false;
  }

  const loadScript = () => {
    const script = documentObject.createElement('script');
    script.async = true;
    script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
    documentObject.head.appendChild(script);
  };
  const schedule = () => {
    if (typeof windowObject.requestIdleCallback === 'function') {
      windowObject.requestIdleCallback(loadScript, { timeout: 3000 });
      return;
    }
    windowObject.setTimeout(loadScript, 1500);
  };

  windowObject.addEventListener('load', schedule, { once: true });
  return true;
}

function initMermaid(documentObject, windowObject, attempt = 0) {
  const diagrams = documentObject.querySelectorAll(
    '.mermaid:not([data-processed="true"])'
  );
  if (!diagrams.length) return false;

  if (windowObject.mermaid && typeof windowObject.mermaid.init === 'function') {
    windowObject.mermaid.init(undefined, diagrams);
    return true;
  }

  if (attempt < 30 && typeof windowObject.setTimeout === 'function') {
    windowObject.setTimeout(
      () => initMermaid(documentObject, windowObject, attempt + 1),
      200
    );
  }
  return false;
}

function isDesktop(windowObject) {
  if (typeof windowObject.matchMedia === 'function') {
    return windowObject.matchMedia('(min-width: 992px)').matches;
  }
  return windowObject.innerWidth >= 992;
}

function initPet(documentObject, windowObject) {
  const pet = documentObject.getElementById('blog-pet');
  if (!pet || !isDesktop(windowObject)) return false;
  if (pet.dataset.initialized === 'true') return true;

  let messageTimer;
  pet.dataset.initialized = 'true';
  pet.addEventListener('click', () => {
    pet.classList.add('is-speaking');
    if (messageTimer) windowObject.clearTimeout(messageTimer);
    messageTimer = windowObject.setTimeout(() => {
      pet.classList.remove('is-speaking');
    }, 3200);
  });
  return true;
}

function boot(documentObject, windowObject) {
  enhanceTables(documentObject);
  enhanceImages(documentObject);
  initMermaid(documentObject, windowObject);
  initPet(documentObject, windowObject);
  deferAnalytics(documentObject, windowObject);
}

const api = {
  boot,
  deferAnalytics,
  enhanceImages,
  enhanceTables,
  initMermaid,
  initPet
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => boot(document, window), { once: true });
  } else {
    boot(document, window);
  }
}
