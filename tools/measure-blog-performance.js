#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright-core');
const {
  evaluateBudget,
  parseArguments
} = require('../scripts/lib/performance-budget');

const DEFAULT_CHROME = process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  : undefined;

async function measureUrl(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    serviceWorkers: 'block'
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.url()} (${request.failure()?.errorText || 'failed'})`);
  });
  await page.addInitScript(() => {
    window.__blogPerformance = { cls: 0, lcp: 0 };
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        const element = last.element;
        window.__blogPerformance.lcp = last.startTime;
        window.__blogPerformance.lcpElement = element ? {
          tag: element.tagName,
          id: element.id,
          className: String(element.className || ''),
          text: String(element.textContent || '').trim().slice(0, 120),
          url: last.url || ''
        } : null;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__blogPerformance.cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: Math.floor(1.6 * 1024 * 1024 / 8),
    uploadThroughput: Math.floor(750 * 1024 / 8),
    connectionType: 'cellular4g'
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(1500);
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const sequenceImage = document.querySelector(
      'img[src*="kubernetes-pod-creation-sequence-diagram"]'
    );
    return {
      lcp: Math.round(window.__blogPerformance.lcp),
      cls: Number(window.__blogPerformance.cls.toFixed(4)),
      ttfb: Math.round(navigation.responseStart),
      domContentLoaded: Math.round(navigation.domContentLoadedEventEnd),
      load: Math.round(navigation.loadEventEnd),
      transferBytes: resources.reduce(
        (total, resource) => total + (resource.transferSize || 0),
        navigation.transferSize || 0
      ),
      resourceCount: resources.length,
      largestResources: resources
        .map((resource) => ({
          url: resource.name,
          type: resource.initiatorType,
          duration: Math.round(resource.duration),
          bytes: resource.transferSize || resource.encodedBodySize || 0
        }))
        .sort((left, right) => right.bytes - left.bytes)
        .slice(0, 12),
      lcpElement: window.__blogPerformance.lcpElement || null,
      sequenceImage: sequenceImage ? sequenceImage.currentSrc : null
    };
  });
  const imageResult = await page.evaluate(async () => {
    const image = document.querySelector(
      'img[src*="kubernetes-pod-creation-sequence-diagram"]'
    );
    if (!image) return null;

    const startedAt = performance.now();
    image.scrollIntoView({ block: 'center' });
    if (!image.complete || !image.currentSrc || !image.naturalWidth) {
      await new Promise((resolve, reject) => {
        const timeout = window.setTimeout(
          () => reject(new Error('Timed out waiting for responsive image')),
          5000
        );
        image.addEventListener('load', () => {
          window.clearTimeout(timeout);
          resolve();
        }, { once: true });
        image.addEventListener('error', () => {
          window.clearTimeout(timeout);
          reject(new Error('Responsive image failed to load'));
        }, { once: true });
      });
    }
    return {
      loadMs: Math.round(performance.now() - startedAt),
      currentSrc: image.currentSrc,
      naturalWidth: image.naturalWidth
    };
  });

  metrics.consoleErrors = consoleErrors;
  metrics.failedRequests = failedRequests.filter(
    (failure) => !failure.includes('busuanzi.ibruce.info')
  );
  metrics.url = url;
  metrics.imageLoadMs = imageResult ? imageResult.loadMs : null;
  metrics.sequenceImage = imageResult
    ? imageResult.currentSrc
    : metrics.sequenceImage;
  metrics.sequenceImageNaturalWidth = imageResult
    ? imageResult.naturalWidth
    : null;
  metrics.budget = evaluateBudget(metrics);
  await context.close();
  return metrics;
}

async function main() {
  const { urls } = parseArguments(process.argv.slice(2));
  const browser = await chromium.launch({
    executablePath: process.env.BLOG_CHROME_PATH || DEFAULT_CHROME,
    headless: true,
    args: ['--disable-background-networking']
  });

  try {
    const results = [];
    for (const url of urls) {
      results.push(await measureUrl(browser, url));
    }
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
    if (results.some((result) => !result.budget.passed)) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { measureUrl };
