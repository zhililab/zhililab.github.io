'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  evaluateBudget,
  parseArguments
} = require('../scripts/lib/performance-budget');

test('accepts one or more URLs and rejects missing targets', () => {
  assert.deepEqual(
    parseArguments(['https://example.com/a', 'https://example.com/b']),
    { urls: ['https://example.com/a', 'https://example.com/b'] }
  );
  assert.throws(() => parseArguments([]), /at least one URL/i);
});

test('passes metrics inside the mobile 4G budget', () => {
  const result = evaluateBudget({
    lcp: 1780,
    cls: 0.03,
    imageLoadMs: 240,
    consoleErrors: [],
    failedRequests: []
  });

  assert.equal(result.passed, true);
  assert.deepEqual(result.failures, []);
});

test('reports every violated performance threshold', () => {
  const result = evaluateBudget({
    lcp: 2450,
    cls: 0.18,
    imageLoadMs: 420,
    consoleErrors: ['ReferenceError: broken'],
    failedRequests: ['https://example.com/missing.css']
  });

  assert.equal(result.passed, false);
  assert.equal(result.failures.length, 5);
  assert.match(result.failures.join('\n'), /LCP/);
  assert.match(result.failures.join('\n'), /CLS/);
  assert.match(result.failures.join('\n'), /console/i);
  assert.match(result.failures.join('\n'), /request/i);
  assert.match(result.failures.join('\n'), /image/i);
});
