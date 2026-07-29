'use strict';

const scriptPromises = new WeakMap();

function loadAdsenseScript(documentObject, client) {
  if (scriptPromises.has(documentObject)) {
    return scriptPromises.get(documentObject);
  }
  const scriptPromise = new Promise((resolve, reject) => {
    const script = documentObject.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', reject, { once: true });
    documentObject.head.appendChild(script);
  });
  scriptPromises.set(documentObject, scriptPromise);
  return scriptPromise;
}

function watchAdStatus(container, windowObject) {
  const unit = container.querySelector('.adsbygoogle');
  if (!unit || typeof windowObject.MutationObserver !== 'function') return false;
  const observer = new windowObject.MutationObserver(() => {
    const status = unit.getAttribute('data-ad-status');
    if (status === 'filled') container.dataset.state = 'filled';
    if (status === 'unfilled') {
      container.dataset.state = 'unfilled';
      observer.disconnect();
    }
  });
  observer.observe(unit, {
    attributes: true,
    attributeFilter: ['data-ad-status']
  });
  return true;
}

function initControlledAd(documentObject, windowObject) {
  const container = documentObject.querySelector('#blog-controlled-ad');
  if (!container || container.dataset.initialized === 'true') return false;
  const client = container.dataset.adClient;
  if (!/^ca-pub-\d{16}$/.test(client || '')) return false;

  container.dataset.initialized = 'true';
  watchAdStatus(container, windowObject);

  const activate = () => {
    container.dataset.state = 'loading';
    loadAdsenseScript(documentObject, client)
      .then(() => {
        windowObject.adsbygoogle = windowObject.adsbygoogle || [];
        windowObject.adsbygoogle.push({});
      })
      .catch(() => {
        container.dataset.state = 'failed';
      });
  };

  if (typeof windowObject.IntersectionObserver === 'function') {
    const observer = new windowObject.IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      activate();
    }, { rootMargin: '320px 0px' });
    observer.observe(container);
    return true;
  }

  windowObject.addEventListener('load', activate, { once: true });
  return true;
}

const api = {
  initControlledAd,
  loadAdsenseScript,
  watchAdStatus
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => initControlledAd(document, window),
      { once: true }
    );
  } else {
    initControlledAd(document, window);
  }
}
