'use strict';

const AI_SUMMARY_CUTOFF = '2026-07-30T00:00:00+08:00';
const AI_SUMMARY_CUTOFF_TIME = Date.parse(AI_SUMMARY_CUTOFF);
const AI_SUMMARY_BACKFILL_SLUGS = Object.freeze([
  '2026-07-22-agentic-devops-practice-report',
  '2026-07-23-kubernetes-pod-creation-workflow',
  '2026-07-27-from-graph-platform-to-devops-agent-control-plane'
]);
const AI_SUMMARY_BACKFILLS = new Set(AI_SUMMARY_BACKFILL_SLUGS);

function isAiSummaryRequired({ slug, date, aiSummary } = {}) {
  if (aiSummary === false) return false;
  if (AI_SUMMARY_BACKFILLS.has(slug)) return true;

  const postTime = date instanceof Date ? date.valueOf() : Date.parse(date);
  return Number.isFinite(postTime) && postTime >= AI_SUMMARY_CUTOFF_TIME;
}

module.exports = {
  AI_SUMMARY_BACKFILL_SLUGS,
  AI_SUMMARY_CUTOFF,
  isAiSummaryRequired
};
