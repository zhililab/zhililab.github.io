(function () {
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
  const slot = container.dataset.adSlot;
  if (
    !/^ca-pub-\d{16}$/.test(client || '') ||
    !/^\d{5,20}$/.test(slot || '')
  ) return false;

  container.dataset.initialized = 'true';
  watchAdStatus(container, windowObject);

  let activated = false;
  const activate = () => {
    if (activated) return;
    activated = true;
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

  if (
    typeof windowObject.addEventListener !== 'function' ||
    typeof container.getBoundingClientRect !== 'function'
  ) return true;

  const checkViewportProximity = () => {
    const viewportHeight = windowObject.innerHeight;
    const bounds = container.getBoundingClientRect();
    if (
      !Number.isFinite(viewportHeight) ||
      !bounds ||
      !Number.isFinite(bounds.top) ||
      !Number.isFinite(bounds.bottom) ||
      bounds.top > viewportHeight + 320 ||
      bounds.bottom < -320
    ) return;

    if (typeof windowObject.removeEventListener === 'function') {
      windowObject.removeEventListener('scroll', checkViewportProximity);
      windowObject.removeEventListener('resize', checkViewportProximity);
    }
    activate();
  };

  let fallbackStarted = false;
  const startFallback = () => {
    if (fallbackStarted) return;
    fallbackStarted = true;
    windowObject.addEventListener(
      'scroll',
      checkViewportProximity,
      { passive: true }
    );
    windowObject.addEventListener(
      'resize',
      checkViewportProximity,
      { passive: true }
    );
    checkViewportProximity();
  };

  if (documentObject.readyState === 'complete') {
    startFallback();
  } else {
    windowObject.addEventListener('load', startFallback, { once: true });
  }
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
}());
