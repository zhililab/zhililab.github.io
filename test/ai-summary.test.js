'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  AiSummaryValidationError,
  computeSourceHash,
  extractFrontmatterAndBody,
  generateSummaryForPost,
  normalizeBody,
  requestGeminiSummary,
  validateSummary
} = require('../scripts/lib/ai-summary');

function validSummary(overrides = {}) {
  return {
    schema_version: 1,
    slug: 'platform-engineering-map',
    source_hash: computeSourceHash('一段经过规范化的文章正文。'),
    provider: 'google',
    model: 'gemini-3.6-flash',
    generated_at: '2026-07-30T08:00:00.000Z',
    status: 'draft',
    general: '本文从统一抽象切入平台工程实践，说明团队如何根据正文中的背景、证据与边界，把分散的交付活动收敛为可审查、可恢复的工程流程。',
    bullets: [
      '识别正文提出的核心问题和适用范围',
      '提炼文章给出的主要工程方法和证据',
      '保留作者写明的限制、风险与人工判断边界'
    ],
    explainer: '可以把文中的方法理解为一张工程地图：先明确目标和约束，再沿着正文给出的证据与步骤行动，并在失败时保留人工判断和恢复路径。',
    ...overrides
  };
}

function response(status, payload) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async json() {
      return payload;
    }
  };
}

function sequenceFetch(responses) {
  const fetchImpl = async (...args) => {
    fetchImpl.calls.push(args);
    const next = responses.shift();
    if (!next) throw new Error('Unexpected fetch call');
    return next;
  };
  fetchImpl.calls = [];
  return fetchImpl;
}

function geminiPayload(summary) {
  return {
    candidates: [{
      content: {
        parts: [{ text: JSON.stringify(summary) }]
      }
    }]
  };
}

function modelSummary() {
  const summary = validSummary();
  return {
    general: summary.general,
    bullets: summary.bullets,
    explainer: summary.explainer
  };
}

test('hash ignores frontmatter but changes with normalized body text', () => {
  const first = extractFrontmatterAndBody('---\ndate: 1\n---\n正文  \r\n');
  const second = extractFrontmatterAndBody('---\ndate: 2\n---\n正文\n');

  assert.equal(computeSourceHash(first.body), computeSourceHash(second.body));
  assert.notEqual(computeSourceHash(first.body), computeSourceHash('正文变化'));
  assert.equal(normalizeBody('\r\n正文  \r\n\r\n'), '正文');
});

test('validator rejects draft HTML and accepts three plain bullets', () => {
  assert.throws(
    () => validateSummary(validSummary({ general: '<script>x</script>' })),
    AiSummaryValidationError
  );
  assert.equal(validateSummary(validSummary()).bullets.length, 3);
});

test('validator rejects unexpected fields and malformed metadata', () => {
  assert.throws(
    () => validateSummary(validSummary({ unexpected: true })),
    AiSummaryValidationError
  );
  assert.throws(
    () => validateSummary(validSummary({ source_hash: 'sha256:uppercase' })),
    AiSummaryValidationError
  );
  assert.throws(
    () => validateSummary(validSummary({ status: 'published' })),
    AiSummaryValidationError
  );
});

test('retries 429 once and returns a validated model summary', async () => {
  const fetchImpl = sequenceFetch([
    response(429, {}),
    response(200, geminiPayload(modelSummary()))
  ]);

  const result = await requestGeminiSummary({
    fetchImpl,
    apiKey: 'secret',
    model: 'gemini-3.6-flash',
    title: '标题',
    body: '正文',
    retries: 2
  });

  assert.equal(fetchImpl.calls.length, 2);
  assert.equal(result.bullets.length, 3);
  assert.match(fetchImpl.calls[0][0], /gemini-3\.6-flash:generateContent$/);
  assert.equal(fetchImpl.calls[0][1].headers['x-goog-api-key'], 'secret');
  assert.match(JSON.parse(fetchImpl.calls[0][1].body).contents[0].parts[0].text, /正文/);
});

test('failed generation leaves an existing output unchanged', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-summary-'));
  const postPath = path.join(tempRoot, 'platform-engineering-map.md');
  const outputDir = path.join(tempRoot, 'summaries');
  const outputPath = path.join(outputDir, 'platform-engineering-map.json');
  const original = '{"keep":"this byte-for-byte"}\n';

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, original);
  fs.writeFileSync(postPath, '---\ntitle: 平台工程地图\n---\n文章正文。\n');

  await assert.rejects(
    () => generateSummaryForPost({
      postPath,
      outputDir,
      fetchImpl: sequenceFetch([response(401, {})]),
      apiKey: 'secret',
      model: 'gemini-3.6-flash',
      now: () => new Date('2026-07-30T08:00:00.000Z')
    })
  );
  assert.equal(fs.readFileSync(outputPath, 'utf8'), original);
});

test('generation writes a draft summary with post-derived metadata', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-summary-'));
  const postPath = path.join(tempRoot, 'platform-engineering-map.md');
  const outputDir = path.join(tempRoot, 'summaries');
  fs.writeFileSync(postPath, '---\ntitle: 平台工程地图\n---\n文章正文。\n');

  const result = await generateSummaryForPost({
    postPath,
    outputDir,
    fetchImpl: sequenceFetch([response(200, geminiPayload(modelSummary()))]),
    apiKey: 'secret',
    model: 'gemini-3.6-flash',
    now: () => new Date('2026-07-30T08:00:00.000Z')
  });

  assert.equal(result.path, path.join(outputDir, 'platform-engineering-map.json'));
  assert.equal(result.summary.status, 'draft');
  assert.equal(result.summary.slug, 'platform-engineering-map');
  assert.equal(result.summary.generated_at, '2026-07-30T08:00:00.000Z');
  assert.deepEqual(JSON.parse(fs.readFileSync(result.path, 'utf8')), result.summary);
});
