'use strict';

function hasClass(element, className) {
  if (!element) return false;
  if (element.classList && element.classList.contains(className)) return true;
  return String(element.className || '').split(/\s+/).includes(className);
}

function normalizeSelection(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 280);
}

function buildTextFragmentUrl(locationObject, text) {
  const base = `${locationObject.origin}${locationObject.pathname}`;
  return `${base}#:~:text=${encodeURIComponent(normalizeSelection(text))}`;
}

function buildSharePayload(documentObject, locationObject, text) {
  const selected = normalizeSelection(text);
  return {
    title: documentObject.title,
    text: `“${selected}”`,
    url: buildTextFragmentUrl(locationObject, selected)
  };
}

async function copyText(text, documentObject, navigatorObject) {
  if (
    navigatorObject &&
    navigatorObject.clipboard &&
    typeof navigatorObject.clipboard.writeText === 'function'
  ) {
    try {
      await navigatorObject.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Continue with the browser-compatible fallback below.
    }
  }
  if (
    !documentObject ||
    !documentObject.body ||
    typeof documentObject.createElement !== 'function' ||
    typeof documentObject.execCommand !== 'function'
  ) {
    return false;
  }

  const textarea = documentObject.createElement('textarea');
  textarea.value = text;
  textarea.readOnly = true;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  documentObject.body.appendChild(textarea);
  textarea.select();
  const copied = documentObject.execCommand('copy');
  textarea.remove();
  return copied;
}

function initSelectionShare(documentObject, windowObject) {
  if (
    !documentObject ||
    typeof documentObject.querySelector !== 'function' ||
    !documentObject.body ||
    typeof documentObject.createElement !== 'function' ||
    !windowObject ||
    typeof windowObject.getSelection !== 'function'
  ) {
    return false;
  }

  const article = documentObject.querySelector('.markdown-body');
  if (!article) return false;

  const toolbar = documentObject.createElement('div');
  toolbar.id = 'selection-share-toolbar';
  toolbar.hidden = true;
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', '分享选中的正文');

  const shareButton = documentObject.createElement('button');
  shareButton.type = 'button';
  shareButton.textContent = '分享';
  shareButton.dataset.action = 'share';

  const copyButton = documentObject.createElement('button');
  copyButton.type = 'button';
  copyButton.textContent = '复制引用';
  copyButton.dataset.action = 'copy';

  toolbar.appendChild(shareButton);
  toolbar.appendChild(copyButton);
  documentObject.body.appendChild(toolbar);

  let payload = null;
  let feedbackTimer = null;
  const hide = () => {
    toolbar.hidden = true;
    payload = null;
  };
  const copyPayload = async () => {
    if (!payload) return false;
    const value = `${payload.text}\n\n— ${payload.title}\n${payload.url}`;
    const copied = await copyText(
      value,
      documentObject,
      windowObject.navigator || {}
    );
    toolbar.dataset.state = copied ? 'copied' : 'copy-failed';
    copyButton.textContent = copied ? '已复制' : '请手动复制';
    if (feedbackTimer && typeof windowObject.clearTimeout === 'function') {
      windowObject.clearTimeout(feedbackTimer);
    }
    if (typeof windowObject.setTimeout === 'function') {
      feedbackTimer = windowObject.setTimeout(() => {
        toolbar.dataset.state = '';
        copyButton.textContent = '复制引用';
      }, 1800);
    }
    return copied;
  };
  const show = () => {
    const selection = windowObject.getSelection();
    const anchorNode = selection && selection.anchorNode;
    const anchorElement = anchorNode && (
      anchorNode.nodeType === 1 ? anchorNode : anchorNode.parentElement
    );
    const selected = normalizeSelection(selection && selection.toString());
    if (
      !selection ||
      selection.isCollapsed ||
      !selection.rangeCount ||
      !selected ||
      !anchorElement ||
      typeof anchorElement.closest !== 'function' ||
      !anchorElement.closest('.markdown-body') ||
      !article.contains(anchorNode)
    ) {
      hide();
      return;
    }

    payload = buildSharePayload(
      documentObject,
      windowObject.location,
      selected
    );
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const left = Math.min(
      Math.max((rect.left + rect.right) / 2, 88),
      windowObject.innerWidth - 88
    );
    const top = Math.max(rect.top - 56, 8);
    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
    toolbar.hidden = false;
  };

  shareButton.addEventListener('click', async () => {
    if (!payload) return;
    if (
      windowObject.navigator &&
      typeof windowObject.navigator.share === 'function'
    ) {
      try {
        await windowObject.navigator.share(payload);
        hide();
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') {
          hide();
          return;
        }
      }
    }
    await copyPayload();
  });
  copyButton.addEventListener('click', copyPayload);

  documentObject.addEventListener('mouseup', show);
  documentObject.addEventListener('touchend', show);
  documentObject.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide();
  });
  documentObject.addEventListener('pointerdown', (event) => {
    if (!toolbar.hidden && !toolbar.contains(event.target)) hide();
  });
  windowObject.addEventListener('scroll', hide, { passive: true });
  return true;
}

function enhanceTables(root) {
  root.querySelectorAll('.markdown-body table').forEach((table) => {
    if (typeof table.closest === 'function' && table.closest('figure.highlight')) return;
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

function prefetchResponsiveImages(documentObject, windowObject) {
  if (
    !documentObject ||
    typeof documentObject.querySelectorAll !== 'function' ||
    !windowObject ||
    typeof windowObject.addEventListener !== 'function' ||
    typeof windowObject.Image !== 'function'
  ) {
    return false;
  }

  const activate = (image) => {
    const source = image.parentNode && image.parentNode.querySelector
      ? image.parentNode.querySelector('source[data-srcset]')
      : null;
    if (source && source.dataset && source.dataset.srcset) {
      source.srcset = source.dataset.srcset;
    }
    image.src = image.dataset.src;
    image.srcset = image.dataset.srcset;
    image.removeAttribute('data-blog-deferred-image');
  };
  const prefetch = () => {
    const images = Array.from(documentObject.querySelectorAll(
      '.markdown-body img[data-blog-deferred-image]'
    )).slice(0, 2);
    const requests = images.map((image) => {
      const request = new windowObject.Image();
      request.onload = () => activate(image);
      request.onerror = () => activate(image);
      request.sizes = image.sizes;
      request.srcset = image.dataset.srcset;
      return request;
    });
    windowObject.__blogImagePrefetches = requests;
  };
  const schedule = () => {
    if (typeof windowObject.IntersectionObserver === 'function') {
      const observer = new windowObject.IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          activate(entry.target);
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '200px 0px' });
      documentObject.querySelectorAll(
        '.markdown-body img[data-blog-deferred-image]'
      ).forEach((image) => observer.observe(image));
    }
    if (typeof windowObject.requestIdleCallback === 'function') {
      windowObject.requestIdleCallback(prefetch, { timeout: 2000 });
      return;
    }
    windowObject.setTimeout(prefetch, 500);
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

function initAiSummaries(documentObject) {
  if (!documentObject || typeof documentObject.querySelectorAll !== 'function') {
    return 0;
  }

  return Array.from(documentObject.querySelectorAll('[data-ai-summary]')).reduce(
    (initialized, summary) => {
      if (summary.dataset.aiSummaryInitialized === 'true') return initialized;

      const tabs = Array.from(summary.querySelectorAll('[role="tab"]'));
      const panels = Array.from(summary.querySelectorAll('[role="tabpanel"]'));
      if (!tabs.length || tabs.length !== panels.length) return initialized;

      const select = (index, focus) => {
        tabs.forEach((tab, tabIndex) => {
          const active = tabIndex === index;
          tab.setAttribute('aria-selected', String(active));
          tab.setAttribute('tabindex', active ? '0' : '-1');
          panels[tabIndex].hidden = !active;
        });
        if (focus) tabs[index].focus();
      };
      const selectedIndex = tabs.findIndex(
        (tab) => tab.getAttribute('aria-selected') === 'true'
      );
      select(selectedIndex === -1 ? 0 : selectedIndex, false);

      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => select(index, false));
        tab.addEventListener('keydown', (event) => {
          let nextIndex = null;
          if (event.key === 'ArrowLeft') {
            nextIndex = (index + tabs.length - 1) % tabs.length;
          } else if (event.key === 'ArrowRight') {
            nextIndex = (index + 1) % tabs.length;
          } else if (event.key === 'Home') {
            nextIndex = 0;
          } else if (event.key === 'End') {
            nextIndex = tabs.length - 1;
          }
          if (nextIndex === null) return;
          event.preventDefault();
          select(nextIndex, true);
        });
      });

      summary.dataset.aiSummaryInitialized = 'true';
      return initialized + 1;
    },
    0
  );
}

function boot(documentObject, windowObject) {
  enhanceTables(documentObject);
  enhanceImages(documentObject);
  initMermaid(documentObject, windowObject);
  initPet(documentObject, windowObject);
  initAiSummaries(documentObject);
  initSelectionShare(documentObject, windowObject);
  deferAnalytics(documentObject, windowObject);
  prefetchResponsiveImages(documentObject, windowObject);
}

const api = {
  buildSharePayload,
  buildTextFragmentUrl,
  boot,
  copyText,
  deferAnalytics,
  enhanceImages,
  enhanceTables,
  initMermaid,
  initAiSummaries,
  initPet,
  initSelectionShare,
  normalizeSelection,
  prefetchResponsiveImages
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
