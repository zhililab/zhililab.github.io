(function initBuilderProjectsModule() {
  'use strict';

  function createProjectCarousel(root) {
    const slides = Array.from(root.querySelectorAll('[data-project-slide]'));
    const dots = Array.from(root.querySelectorAll('[data-carousel-dot]'));
    const previousButton = root.querySelector('[data-carousel-prev]');
    const nextButton = root.querySelector('[data-carousel-next]');
    const cleanups = [];
    let activeIndex = 0;
    let pointerStartX = null;

    function listen(target, type, handler) {
      if (!target) return;
      target.addEventListener(type, handler);
      cleanups.push(() => target.removeEventListener(type, handler));
    }

    function show(index) {
      if (!slides.length) return;
      const numericIndex = Number(index);
      const validIndex = Number.isFinite(numericIndex) && Number.isInteger(numericIndex)
        ? numericIndex
        : 0;
      activeIndex = ((validIndex % slides.length) + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const inactive = slideIndex !== activeIndex;
        slide.hidden = inactive;
        slide.setAttribute('aria-hidden', String(inactive));
      });
      dots.forEach((dot, dotIndex) => {
        dot.setAttribute('aria-current', String(dotIndex === activeIndex));
      });
    }

    function next() { show(activeIndex + 1); }
    function previous() { show(activeIndex - 1); }

    function onKeydown(event) {
      const actions = {
        ArrowLeft: previous,
        ArrowRight: next,
        Home: () => show(0),
        End: () => show(slides.length - 1)
      };
      if (!actions[event.key]) return;
      event.preventDefault();
      actions[event.key]();
    }

    function onPointerDown(event) {
      pointerStartX = event.clientX;
    }

    function onPointerUp(event) {
      if (pointerStartX === null) return;
      const delta = event.clientX - pointerStartX;
      pointerStartX = null;
      if (Math.abs(delta) < 48) return;
      if (delta < 0) next();
      else previous();
    }

    function onPointerCancel() {
      pointerStartX = null;
    }

    listen(root, 'keydown', onKeydown);
    listen(root, 'pointerdown', onPointerDown);
    listen(root, 'pointercancel', onPointerCancel);
    listen(root, 'pointerup', onPointerUp);
    listen(previousButton, 'click', previous);
    listen(nextButton, 'click', next);
    dots.forEach((dot, dotIndex) => {
      listen(dot, 'click', () => show(Number(dot.dataset.slideIndex || dotIndex)));
    });

    root.dataset.carouselReady = 'true';
    show(0);

    return {
      show,
      next,
      previous,
      destroy() {
        cleanups.splice(0).forEach((cleanup) => cleanup());
        root.removeAttribute('data-carousel-ready');
      }
    };
  }

  function initProjectCarousels(doc) {
    const roots = Array.from(doc.querySelectorAll('[data-project-carousel]'))
      .filter((root) => root.dataset.carouselReady !== 'true');
    roots.forEach(createProjectCarousel);
    return roots.length;
  }

  function defaultCreateObserver(callback) {
    if (typeof IntersectionObserver === 'undefined') {
      return {
        observe(target) { callback([{ target, isIntersecting: true }]); },
        disconnect() {}
      };
    }
    return new IntersectionObserver(callback, { threshold: 0.35 });
  }

  function createProjectTrace(root, options = {}) {
    const stages = Array.from(root.querySelectorAll('[data-trace-stage]'));
    const detail = root.querySelector('[data-trace-detail]');
    const cleanups = [];
    const defaultDetail = detail?.textContent || '选择一个阶段查看对应代码职责。';
    let pinnedStage = null;
    let hoverPaused = false;
    let focusPaused = false;

    function listen(target, type, handler) {
      if (!target) return;
      target.addEventListener(type, handler);
      cleanups.push(() => target.removeEventListener(type, handler));
    }

    function updatePaused() {
      root.classList.toggle('is-trace-paused', hoverPaused || focusPaused || Boolean(pinnedStage));
    }

    function showDetail(stage) {
      if (detail) detail.textContent = stage.dataset.stageDetail || defaultDetail;
    }

    function clearPin() {
      pinnedStage = null;
      root.classList.remove('is-trace-pinned');
      stages.forEach((stage) => stage.setAttribute('aria-pressed', 'false'));
      if (detail) detail.textContent = defaultDetail;
      updatePaused();
    }

    function pin(stage) {
      pinnedStage = stage;
      root.classList.add('is-trace-pinned');
      stages.forEach((item) => item.setAttribute('aria-pressed', String(item === stage)));
      showDetail(stage);
      updatePaused();
    }

    const observer = (options.createObserver || defaultCreateObserver)((entries) => {
      entries.forEach((entry) => {
        if (entry.target === root) root.classList.toggle('is-trace-active', entry.isIntersecting);
      });
    });
    observer.observe(root);

    listen(root, 'pointerenter', () => { hoverPaused = true; updatePaused(); });
    listen(root, 'pointerleave', () => { hoverPaused = false; updatePaused(); });
    listen(root, 'focusin', (event) => {
      focusPaused = true;
      if (stages.includes(event.target) && event.target !== pinnedStage) {
        clearPin();
        showDetail(event.target);
      }
      updatePaused();
    });
    listen(root, 'focusout', (event) => {
      if (!root.contains(event.relatedTarget)) {
        focusPaused = false;
        clearPin();
        updatePaused();
      }
    });
    listen(root, 'keydown', (event) => {
      if (event.key === 'Escape') clearPin();
    });
    stages.forEach((stage) => {
      stage.setAttribute('aria-pressed', 'false');
      listen(stage, 'click', () => (pinnedStage === stage ? clearPin() : pin(stage)));
    });

    root.dataset.traceReady = 'true';
    return {
      clearPin,
      destroy() {
        observer.disconnect();
        cleanups.splice(0).forEach((cleanup) => cleanup());
        clearPin();
        root.classList.remove('is-trace-active', 'is-trace-paused');
        root.removeAttribute('data-trace-ready');
      }
    };
  }

  function initProjectTraces(doc, options = {}) {
    const roots = Array.from(doc.querySelectorAll('[data-project-trace]'))
      .filter((root) => root.dataset.traceReady !== 'true');
    roots.forEach((root) => createProjectTrace(root, options));
    return roots.length;
  }

  function initProjects(doc) {
    initProjectCarousels(doc);
    initProjectTraces(doc);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      createProjectCarousel,
      initProjectCarousels,
      createProjectTrace,
      initProjectTraces
    };
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initProjects(document), { once: true });
    } else {
      initProjects(document);
    }
  }
})();
