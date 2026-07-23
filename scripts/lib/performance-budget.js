'use strict';

const BUDGET = Object.freeze({
  lcp: 2000,
  cls: 0.1,
  imageLoadMs: 300
});

function parseArguments(args) {
  const urls = args.filter((argument) => /^https?:\/\//.test(argument));
  if (!urls.length) {
    throw new Error('At least one URL is required');
  }
  return { urls };
}

function evaluateBudget(metrics) {
  const failures = [];
  if (!Number.isFinite(metrics.lcp) || metrics.lcp > BUDGET.lcp) {
    failures.push(`LCP ${metrics.lcp}ms exceeds ${BUDGET.lcp}ms`);
  }
  if (!Number.isFinite(metrics.cls) || metrics.cls > BUDGET.cls) {
    failures.push(`CLS ${metrics.cls} exceeds ${BUDGET.cls}`);
  }
  if (
    metrics.imageLoadMs != null
    && (
      !Number.isFinite(metrics.imageLoadMs)
      || metrics.imageLoadMs > BUDGET.imageLoadMs
    )
  ) {
    failures.push(
      `Image display ${metrics.imageLoadMs}ms exceeds ${BUDGET.imageLoadMs}ms`
    );
  }
  if (metrics.consoleErrors && metrics.consoleErrors.length) {
    failures.push(`Console errors: ${metrics.consoleErrors.join(' | ')}`);
  }
  if (metrics.failedRequests && metrics.failedRequests.length) {
    failures.push(`Failed requests: ${metrics.failedRequests.join(' | ')}`);
  }
  return { failures, passed: failures.length === 0 };
}

module.exports = {
  BUDGET,
  evaluateBudget,
  parseArguments
};
