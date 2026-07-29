'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { computeSourceHash } = require('../scripts/lib/ai-summary');
const {
  escapeHtml,
  renderAiSummary,
  createAiSummaryFilter
} = require('../scripts/lib/ai-summary-render');

function validApprovedSummary(overrides = {}) {
  return {
    schema_version: 1,
    slug: 'new-post',
    source_hash: computeSourceHash('正文内容'),
    provider: 'google',
    model: 'gemini-3.6-flash',
    generated_at: '2026-07-30T00:00:00.000Z',
    status: 'approved',
    general: '本文从统一抽象切入平台工程实践，说明团队如何根据正文中的背景、证据与边界，把分散的交付活动收敛为可审查、可恢复的工程流程。',
    bullets: [
      '先识别正文要解决的问题与适用范围',
      '再理解文章给出的工程方法与取舍',
      '最后保留作者明确说明的风险边界'
    ],
    explainer: '可以把文中的方法理解为一张工程地图：先明确目标和约束，再沿着正文给出的证据与步骤行动，并在失败时保留人工判断和恢复路径。',
    ...overrides
  };
}

function post(overrides = {}) {
  return {
    layout: 'post',
    slug: 'new-post',
    date: '2026-07-31',
    raw: '---\ntitle: 新文章\n---\n正文内容',
    content: '<p>正文内容</p>',
    ...overrides
  };
}

function withSummaries(run) {
  const summariesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-summary-render-'));
  try {
    return run(summariesDir);
  } finally {
    fs.rmSync(summariesDir, { recursive: true, force: true });
  }
}

function writeSummary(summariesDir, summary) {
  fs.writeFileSync(
    path.join(summariesDir, `${summary.slug}.json`),
    `${JSON.stringify(summary)}\n`
  );
}

test('renders approved content as an accessible collapsed component', () => {
  const html = renderAiSummary(validApprovedSummary());

  assert.match(html, /<details[^>]*class="ai-summary"/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /AI 生成 · 已由作者审核/);
  assert.match(html, /role="tabpanel"[^>]*aria-label="概览"/);
  assert.match(html, /role="tabpanel"[^>]*hidden/);
});

test('escapes model text instead of rendering HTML', () => {
  const html = renderAiSummary(validApprovedSummary({ general: '<img onerror=x>' }));

  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img onerror=x&gt;/);
});

test('escapes all HTML-significant characters', () => {
  assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
});

test('prepends an approved current summary to a required post', () => {
  withSummaries(summariesDir => {
    writeSummary(summariesDir, validApprovedSummary());
    const filter = createAiSummaryFilter({
      summariesDir,
      cutoffDate: '2026-07-30',
      backfillSlugs: []
    });
    const data = post();

    assert.equal(filter(data), data);
    assert.match(data.content, /^<details class="ai-summary"/);
    assert.match(data.content, /<p>正文内容<\/p>$/);
  });
});

test('rejects a draft summary for a required post', () => {
  withSummaries(summariesDir => {
    writeSummary(summariesDir, validApprovedSummary({ status: 'draft' }));
    const filter = createAiSummaryFilter({ summariesDir, cutoffDate: '2026-07-30', backfillSlugs: [] });

    assert.throws(() => filter(post()), /approved/i);
  });
});

test('rejects a stale summary for a required post', () => {
  withSummaries(summariesDir => {
    writeSummary(summariesDir, validApprovedSummary({ source_hash: computeSourceHash('旧正文') }));
    const filter = createAiSummaryFilter({ summariesDir, cutoffDate: '2026-07-30', backfillSlugs: [] });

    assert.throws(() => filter(post()), /current|hash/i);
  });
});

test('rejects malformed JSON for a required post', () => {
  withSummaries(summariesDir => {
    fs.writeFileSync(path.join(summariesDir, 'new-post.json'), '{not json');
    const filter = createAiSummaryFilter({ summariesDir, cutoffDate: '2026-07-30', backfillSlugs: [] });

    assert.throws(() => filter(post()), /invalid|JSON/i);
  });
});

test('leaves an explicit AI-summary opt-out unchanged', () => {
  const filter = createAiSummaryFilter({ summariesDir: os.tmpdir(), cutoffDate: '2026-07-30', backfillSlugs: [] });
  const data = post({ ai_summary: false });

  assert.equal(filter(data), data);
  assert.equal(data.content, '<p>正文内容</p>');
});

test('leaves unrelated historical posts unchanged', () => {
  const filter = createAiSummaryFilter({ summariesDir: os.tmpdir(), cutoffDate: '2026-07-30', backfillSlugs: ['backfill-post'] });
  const data = post({ slug: 'historical-post', date: '2026-07-29' });

  assert.equal(filter(data), data);
  assert.equal(data.content, '<p>正文内容</p>');
});

test('requires a summary for an explicitly selected backfill post', () => {
  const filter = createAiSummaryFilter({ summariesDir: os.tmpdir(), cutoffDate: '2026-07-30', backfillSlugs: ['backfill-post'] });

  assert.throws(() => filter(post({ slug: 'backfill-post', date: '2026-07-01' })), /missing/i);
});

test('requires a summary for a new post after the cutoff date', () => {
  const filter = createAiSummaryFilter({ summariesDir: os.tmpdir(), cutoffDate: '2026-07-30', backfillSlugs: [] });

  assert.throws(() => filter(post({ date: '2026-07-31' })), /missing/i);
});
