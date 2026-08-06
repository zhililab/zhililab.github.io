'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  AI_SUMMARY_BACKFILL_SLUGS,
  AI_SUMMARY_CUTOFF,
  isAiSummaryRequired
} = require('../scripts/lib/ai-summary-eligibility');

test('uses one Asia/Shanghai midnight cutoff and the three approved backfills', () => {
  assert.equal(AI_SUMMARY_CUTOFF, '2026-07-30T00:00:00+08:00');
  assert.deepEqual(AI_SUMMARY_BACKFILL_SLUGS, [
    '2026-07-22-agentic-devops-practice-report',
    '2026-07-23-kubernetes-pod-creation-workflow',
    '2026-07-27-from-graph-platform-to-devops-agent-control-plane'
  ]);
});

test('requires summaries at the exact cutoff, early July 30 Shanghai, and July 31', () => {
  assert.equal(
    isAiSummaryRequired({ slug: 'before-cutoff', date: '2026-07-29T23:59:59+08:00' }),
    false
  );
  assert.equal(
    isAiSummaryRequired({ slug: 'exact-cutoff', date: '2026-07-30T00:00:00+08:00' }),
    true
  );
  assert.equal(
    isAiSummaryRequired({ slug: 'early-july-30', date: '2026-07-30T00:01:00+08:00' }),
    true
  );
  assert.equal(
    isAiSummaryRequired({ slug: 'july-31', date: '2026-07-31T00:00:00+08:00' }),
    true
  );
});

test('keeps backfills required before the cutoff and honors explicit opt-out', () => {
  assert.equal(
    isAiSummaryRequired({
      slug: AI_SUMMARY_BACKFILL_SLUGS[0],
      date: '2026-07-22T12:00:00+08:00'
    }),
    true
  );
  assert.equal(
    isAiSummaryRequired({
      slug: AI_SUMMARY_BACKFILL_SLUGS[0],
      date: '2026-07-22T12:00:00+08:00',
      aiSummary: false
    }),
    false
  );
});
