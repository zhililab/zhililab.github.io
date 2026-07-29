'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  AiSummaryValidationError,
  buildSummaryPrompt,
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
    general: '本文从统一抽象切入平台工程实践，说明团队如何根据正文中的背景、证据与边界，把分散的交付活动收敛为可审查、可恢复的工程流程。'.repeat(2),
    bullets: [
      '识别正文提出的核心问题和适用范围',
      '提炼文章给出的主要工程方法和证据',
      '保留作者写明的限制、风险与人工判断边界'
    ],
    explainer: '可以把文中的方法理解为一张工程地图：先明确目标和约束，再沿着正文给出的证据与步骤行动，并在失败时保留人工判断和恢复路径。',
    ...overrides
  };
}

function response(status, payload, headers = {}) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value])
  );
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get(name) {
        return normalizedHeaders[name.toLowerCase()] ?? null;
      }
    },
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

function createCliFixture(posts) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-summary-cli-'));
  const scriptsDir = path.join(fixtureRoot, 'scripts');
  const libraryDir = path.join(scriptsDir, 'lib');
  const postsDir = path.join(fixtureRoot, 'source', '_posts');

  fs.mkdirSync(libraryDir, { recursive: true });
  fs.mkdirSync(postsDir, { recursive: true });
  fs.copyFileSync(
    path.join(__dirname, '..', 'scripts', 'generate-ai-summary.js'),
    path.join(scriptsDir, 'generate-ai-summary.js')
  );
  fs.copyFileSync(
    path.join(__dirname, '..', 'scripts', 'lib', 'ai-summary.js'),
    path.join(libraryDir, 'ai-summary.js')
  );
  fs.copyFileSync(
    path.join(__dirname, '..', 'scripts', 'lib', 'ai-summary-eligibility.js'),
    path.join(libraryDir, 'ai-summary-eligibility.js')
  );
  Object.entries(posts).forEach(([name, markdown]) => {
    fs.writeFileSync(path.join(postsDir, name), markdown);
  });
  return fixtureRoot;
}

function runCli(fixtureRoot, args, env = {}) {
  return spawnSync(
    process.execPath,
    [path.join(fixtureRoot, 'scripts', 'generate-ai-summary.js'), ...args],
    {
      cwd: fixtureRoot,
      encoding: 'utf8',
      env: { ...process.env, ...env }
    }
  );
}

test('hash ignores frontmatter but changes with normalized body text', () => {
  const first = extractFrontmatterAndBody('---\ndate: 1\n---\n正文  \r\n');
  const second = extractFrontmatterAndBody('---\ndate: 2\n---\n正文\n');

  assert.equal(computeSourceHash(first.body), computeSourceHash(second.body));
  assert.notEqual(computeSourceHash(first.body), computeSourceHash('正文变化'));
  assert.equal(normalizeBody('\r\n正文  \r\n\r\n'), '正文');
});

test('post parser rejects absent and unterminated frontmatter', () => {
  assert.throws(
    () => extractFrontmatterAndBody('title: 没有分隔符\ndate: 2026-07-31\n正文'),
    /frontmatter/i
  );
  assert.throws(
    () => extractFrontmatterAndBody('---\ntitle: 没有结束分隔符\ndate: 2026-07-31\n正文'),
    /frontmatter/i
  );
});

test('generation rejects missing required post metadata before calling Gemini', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-summary-post-'));
  const postPath = path.join(tempRoot, 'missing-date.md');
  const fetchImpl = sequenceFetch([]);
  fs.writeFileSync(postPath, '---\ntitle: 缺少日期\n---\n正文内容。\n');

  await assert.rejects(
    () => generateSummaryForPost({
      postPath,
      outputDir: path.join(tempRoot, 'summaries'),
      fetchImpl,
      apiKey: 'secret'
    }),
    /date/i
  );
  assert.equal(fetchImpl.calls.length, 0);
});

test('validator rejects draft HTML and accepts three plain bullets', () => {
  assert.throws(
    () => validateSummary(validSummary({ general: '<script>x</script>' })),
    AiSummaryValidationError
  );
  assert.equal(validateSummary(validSummary()).bullets.length, 3);
});

test('validator enforces the inclusive 120-180 character general range', () => {
  assert.equal(validateSummary(validSummary({ general: '摘'.repeat(120) })).general.length, 120);
  assert.equal(validateSummary(validSummary({ general: '摘'.repeat(180) })).general.length, 180);
  assert.throws(
    () => validateSummary(validSummary({ general: '摘'.repeat(119) })),
    /general must contain 120-180 characters/
  );
  assert.throws(
    () => validateSummary(validSummary({ general: '摘'.repeat(181) })),
    /general must contain 120-180 characters/
  );
});

test('validator conservatively rejects common Markdown markup', () => {
  const examples = [
    '# 标题',
    '标题\n===',
    '**加粗**',
    '*强调*',
    '__加粗__',
    '_强调_',
    '~~删除线~~',
    '[链接](https://example.test)',
    '[链接][reference]\n\n[reference]: https://example.test',
    '![图片](https://example.test/image.png)',
    '![图片][reference]\n\n[reference]: https://example.test/image.png',
    '`内联代码`',
    '```js\ncode\n```',
    '~~~js\ncode\n~~~',
    '> 引用',
    '- 列表项',
    '1. 列表项'
  ];

  for (const markup of examples) {
    assert.throws(
      () => validateSummary(validSummary({
        general: `${markup}\n${'这是用于补足长度的纯文本内容。'.repeat(5)}`
      })),
      AiSummaryValidationError,
      `expected markup to be rejected: ${markup}`
    );
  }
});

test('validator allows ordinary Chinese punctuation in plain text', () => {
  const summary = validSummary({
    general: '本文说明“统一抽象”如何落地：先回答问题（为什么？），再比较方案 A／B；范围、风险与结论都以正文为准。'.repeat(3)
  });

  assert.equal(validateSummary(summary), summary);
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

test('validator requires a canonical UTC ISO timestamp', () => {
  assert.equal(
    validateSummary(validSummary({ generated_at: '2026-07-30T08:00:00.000Z' })).generated_at,
    '2026-07-30T08:00:00.000Z'
  );
  for (const generatedAt of [
    'July 30, 2026 08:00:00 UTC',
    '2026-07-30',
    '2026-07-30T08:00:00Z',
    '2026-07-30T16:00:00.000+08:00',
    '2026-07-30T08:00:00.000Z trailing'
  ]) {
    assert.throws(
      () => validateSummary(validSummary({ generated_at: generatedAt })),
      AiSummaryValidationError,
      `expected non-canonical timestamp to be rejected: ${generatedAt}`
    );
  }
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
    retries: 2,
    sleepImpl: async () => {}
  });

  assert.equal(fetchImpl.calls.length, 2);
  assert.equal(result.bullets.length, 3);
  assert.match(fetchImpl.calls[0][0], /gemini-3\.6-flash:generateContent$/);
  assert.equal(fetchImpl.calls[0][1].headers['x-goog-api-key'], 'secret');
  assert.match(JSON.parse(fetchImpl.calls[0][1].body).contents[0].parts[0].text, /正文/);
});

test('prompt and Gemini request constrain the exact structured summary shape', async () => {
  const fetchImpl = sequenceFetch([
    response(200, geminiPayload(modelSummary()))
  ]);
  const prompt = buildSummaryPrompt({ title: '标题', body: '正文' });

  await requestGeminiSummary({
    fetchImpl,
    apiKey: 'secret',
    model: 'gemini-3.6-flash',
    title: '标题',
    body: '正文'
  });

  const body = JSON.parse(fetchImpl.calls[0][1].body);
  const textFormat = body.generationConfig.responseFormat.text;
  const schema = textFormat.schema;
  assert.match(prompt, /general.*120 至 180 个字符/);
  assert.equal(textFormat.mimeType, 'application/json');
  assert.equal(body.generationConfig.responseSchema, undefined);
  assert.equal(body.generationConfig.responseMimeType, undefined);
  assert.equal(schema.type, 'object');
  assert.deepEqual(Object.keys(schema.properties), ['general', 'bullets', 'explainer']);
  assert.deepEqual(schema.required, ['general', 'bullets', 'explainer']);
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.bullets.type, 'array');
  assert.equal(schema.properties.bullets.minItems, 3);
  assert.equal(schema.properties.bullets.maxItems, 5);
  assert.deepEqual(schema.properties.bullets.items, { type: 'string' });
});

test('retries a 5xx response once and then succeeds', async () => {
  const fetchImpl = sequenceFetch([
    response(503, {}),
    response(200, geminiPayload(modelSummary()))
  ]);

  const result = await requestGeminiSummary({
    fetchImpl,
    apiKey: 'secret',
    model: 'gemini-3.6-flash',
    title: '标题',
    body: '正文',
    retries: 2,
    sleepImpl: async () => {}
  });

  assert.equal(fetchImpl.calls.length, 2);
  assert.equal(result.general, modelSummary().general);
});

test('uses exponential backoff and honors Retry-After without real waiting', async () => {
  const waits = [];
  const fetchImpl = sequenceFetch([
    response(429, {}, { 'Retry-After': '2' }),
    response(503, {}),
    response(200, geminiPayload(modelSummary()))
  ]);

  await requestGeminiSummary({
    fetchImpl,
    apiKey: 'secret',
    title: '标题',
    body: '正文',
    retries: 2,
    retryBaseDelayMs: 500,
    maxRetryDelayMs: 3_000,
    sleepImpl: async delay => waits.push(delay)
  });

  assert.deepEqual(waits, [2_000, 1_000]);
});

test('uses injected time and caps an HTTP-date Retry-After value', async () => {
  const waits = [];
  const fetchImpl = sequenceFetch([
    response(429, {}, { 'Retry-After': 'Wed, 30 Jul 2026 00:02:00 GMT' }),
    response(200, geminiPayload(modelSummary()))
  ]);

  await requestGeminiSummary({
    fetchImpl,
    apiKey: 'secret',
    title: '标题',
    body: '正文',
    retries: 1,
    retryBaseDelayMs: 500,
    maxRetryDelayMs: 5_000,
    now: () => Date.parse('2026-07-30T00:00:00.000Z'),
    sleepImpl: async delay => waits.push(delay)
  });

  assert.deepEqual(waits, [5_000]);
});

test('bounds each Gemini request with injected timeout and abort controls', async () => {
  const timers = [];
  const cleared = [];
  let aborted = false;
  const createAbortController = () => ({
    signal: {
      get aborted() {
        return aborted;
      }
    },
    abort() {
      aborted = true;
    }
  });
  const fetchImpl = async (url, options) => {
    assert.equal(options.signal.aborted, true);
    const error = new Error('aborted');
    error.name = 'AbortError';
    throw error;
  };

  await assert.rejects(
    () => requestGeminiSummary({
      fetchImpl,
      apiKey: 'secret',
      title: '标题',
      body: '正文',
      retries: 0,
      requestTimeoutMs: 1_234,
      createAbortController,
      setTimeoutImpl(callback, delay) {
        timers.push(delay);
        callback();
        return 7;
      },
      clearTimeoutImpl(handle) {
        cleared.push(handle);
      }
    }),
    /timed out after 1234 ms/
  );

  assert.deepEqual(timers, [1_234]);
  assert.deepEqual(cleared, [7]);
  assert.equal(aborted, true);
});

test('retries when the request times out while reading the response body', async () => {
  const waits = [];
  const timeoutCallbacks = [];
  let attempt = 0;
  const fetchImpl = async () => {
    attempt += 1;
    if (attempt === 1) {
      return {
        status: 200,
        ok: true,
        headers: { get: () => null },
        async json() {
          timeoutCallbacks.shift()();
          const error = new Error('aborted while reading response');
          error.name = 'AbortError';
          throw error;
        }
      };
    }
    return response(200, geminiPayload(modelSummary()));
  };

  const result = await requestGeminiSummary({
    fetchImpl,
    apiKey: 'secret',
    title: '标题',
    body: '正文',
    retries: 1,
    retryBaseDelayMs: 500,
    sleepImpl: async delay => waits.push(delay),
    setTimeoutImpl(callback) {
      timeoutCallbacks.push(callback);
      return timeoutCallbacks.length;
    },
    clearTimeoutImpl() {}
  });

  assert.equal(attempt, 2);
  assert.deepEqual(waits, [500]);
  assert.equal(result.general, modelSummary().general);
});

test('failed generation leaves an existing output unchanged', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-summary-'));
  const postPath = path.join(tempRoot, 'platform-engineering-map.md');
  const outputDir = path.join(tempRoot, 'summaries');
  const outputPath = path.join(outputDir, 'platform-engineering-map.json');
  const original = '{"keep":"this byte-for-byte"}\n';

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, original);
  fs.writeFileSync(
    postPath,
    '---\ntitle: 平台工程地图\ndate: 2026-07-31 08:00:00\n---\n文章正文。\n'
  );

  const fetchImpl = sequenceFetch([response(401, {})]);
  await assert.rejects(
    () => generateSummaryForPost({
      postPath,
      outputDir,
      fetchImpl,
      apiKey: 'never-print-this-key',
      model: 'gemini-3.6-flash',
      now: () => new Date('2026-07-30T08:00:00.000Z')
    }),
    error => {
      assert.equal(error.message, 'Gemini request failed with HTTP 401');
      assert.doesNotMatch(error.message, /never-print-this-key|文章正文|keep/);
      return true;
    }
  );
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(fs.readFileSync(outputPath, 'utf8'), original);
});

test('atomic write failure preserves existing output and removes temporary files', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-summary-write-'));
  const postPath = path.join(tempRoot, 'platform-engineering-map.md');
  const outputDir = path.join(tempRoot, 'summaries');
  const outputPath = path.join(outputDir, 'platform-engineering-map.json');
  const original = '{"keep":"this byte-for-byte"}\n';
  const originalRenameSync = fs.renameSync;

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, original);
  fs.writeFileSync(
    postPath,
    '---\ntitle: 平台工程地图\ndate: 2026-07-31 08:00:00\n---\n文章正文。\n'
  );

  fs.renameSync = () => {
    throw new Error('simulated rename failure');
  };
  try {
    await assert.rejects(
      () => generateSummaryForPost({
        postPath,
        outputDir,
        fetchImpl: sequenceFetch([response(200, geminiPayload(modelSummary()))]),
        apiKey: 'secret',
        model: 'gemini-3.6-flash',
        now: () => new Date('2026-07-30T08:00:00.000Z')
      }),
      /simulated rename failure/
    );
  } finally {
    fs.renameSync = originalRenameSync;
  }

  assert.equal(fs.readFileSync(outputPath, 'utf8'), original);
  assert.deepEqual(fs.readdirSync(outputDir), ['platform-engineering-map.json']);
});

test('generation writes a draft summary with post-derived metadata', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-summary-'));
  const postPath = path.join(tempRoot, 'platform-engineering-map.md');
  const outputDir = path.join(tempRoot, 'summaries');
  fs.writeFileSync(
    postPath,
    '---\ntitle: 平台工程地图\ndate: 2026-07-31 08:00:00\n---\n文章正文。\n'
  );

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

test('scan and check CLI modes report every malformed post before API use', () => {
  const secret = 'never-print-this-cli-key';
  const fixtureRoot = createCliFixture({
    '2026-08-01-missing-frontmatter.md': 'title: 无分隔符\ndate: 2026-08-01\n绝不能出现在日志中的正文。',
    '2026-08-02-invalid-metadata.md': '---\ntitle: \ndate: not-a-date\n---\n另一段绝不能出现在日志中的正文。',
    'malformed-frontmatter.md': '---\ntitle: 非日期文件也必须校验\ndate: not-a-date\n---\n不能被扫描器忽略的正文。',
    'legacy-note.md': '旧文章没有 frontmatter，但不在摘要迁移范围内。'
  });

  for (const mode of ['--scan', '--check']) {
    const result = runCli(fixtureRoot, [mode], { GEMINI_API_KEY: secret });
    assert.equal(result.status, 1, `${mode} should fail`);
    assert.match(result.stderr, /2026-08-01-missing-frontmatter\.md/);
    assert.match(result.stderr, /2026-08-02-invalid-metadata\.md/);
    assert.match(result.stderr, /malformed-frontmatter\.md/);
    assert.doesNotMatch(result.stderr, /legacy-note\.md/);
    assert.match(result.stderr, /frontmatter|metadata|title|date/i);
    assert.doesNotMatch(
      `${result.stdout}\n${result.stderr}`,
      new RegExp(`${secret}|绝不能出现在日志中的正文`)
    );
  }
});

test('check CLI consumes the shared Shanghai cutoff at every boundary', () => {
  const fixtureRoot = createCliFixture({
    'exact-cutoff.md': '---\ntitle: 精确截点\ndate: 2026-07-30 00:00:00\n---\n正文内容。',
    'early-july-30.md': '---\ntitle: 七月三十日凌晨\ndate: 2026-07-30 00:01:00\n---\n正文内容。',
    'july-31.md': '---\ntitle: 七月三十一日\ndate: 2026-07-31 00:00:00\n---\n正文内容。'
  });

  const result = runCli(fixtureRoot, ['--check']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /exact-cutoff: missing, invalid, or stale summary/);
  assert.match(result.stderr, /early-july-30: missing, invalid, or stale summary/);
  assert.match(result.stderr, /july-31: missing, invalid, or stale summary/);
});
