'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const workflowPath = path.join(root, '.github/workflows/generate-ai-summaries.yml');

test('AI summary workflow generates draft summaries only for changed posts on dev-optimize', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  const generatorStep = workflow.match(
    /^\s{6}- name: Generate draft AI summaries\n(?:^\s{8,}.*\n)*/m
  );
  const generateJob = workflow.match(
    /^\s{2}generate:\n(?:^(?!\s{2}\S).*\n|^\s{4,}.*\n)*/m
  );
  const commitJob = workflow.match(
    /^\s{2}commit:\n(?:^(?!\s{2}\S).*\n|^\s{4,}.*\n)*/m
  );

  assert.match(workflow, /^\s{2}push:\s*\n\s*branches:\s*\n\s*-\s*dev-optimize/m);
  assert.match(workflow, /on:\s*\n\s*workflow_dispatch:\s*\n\s*push:/m);
  assert.match(workflow, /paths:\s*\n\s*-\s*['\"]?source\/_posts\/\*\*['\"]?/m);
  assert.match(workflow, /-\s*['\"]?\.github\/workflows\/generate-ai-summaries\.yml['\"]?/);
  assert.match(workflow, /-\s*['\"]?scripts\/generate-ai-summary\.js['\"]?/);
  assert.match(workflow, /-\s*['\"]?scripts\/lib\/ai-summary\*\.js['\"]?/);
  assert.match(workflow, /^permissions:\s*\n\s{2}contents:\s*read/m);
  assert.doesNotMatch(workflow, /^\s{4}env:/m);
  assert.ok(generateJob, 'missing read-only generation job');
  assert.ok(commitJob, 'missing write-only commit job');
  assert.ok(generatorStep, 'missing named generator step');
  assert.match(
    generatorStep[0],
    /GEMINI_API_KEY:\s*\$\{\{\s*secrets\.GEMINI_API_KEY\s*\}\}/
  );
  assert.match(
    generatorStep[0],
    /GEMINI_MODEL:\s*\$\{\{\s*vars\.GEMINI_MODEL\s*\}\}/
  );
  assert.equal(
    (workflow.match(/GEMINI_API_KEY:/g) || []).length,
    1,
    'GEMINI_API_KEY must appear only in the generator step'
  );
  assert.equal(
    (workflow.match(/\$\{\{\s*secrets\.GEMINI_API_KEY\s*\}\}/g) || []).length,
    1,
    'the Gemini secret reference must appear only in the generator step'
  );
  assert.equal(
    (workflow.match(/GEMINI_MODEL:/g) || []).length,
    1,
    'GEMINI_MODEL must appear only in the generator step'
  );
  assert.equal(
    (workflow.match(/\$\{\{\s*vars\.GEMINI_MODEL\s*\}\}/g) || []).length,
    1,
    'the Gemini model variable reference must appear only in the generator step'
  );
  assert.match(workflow, /actions\/setup-node@v\d+/);
  assert.match(workflow, /node-version:\s*['\"]?20['\"]?/);
  assert.match(workflow, /- name: Install dependencies\s*\n\s*run: npm ci/);
  assert.match(generateJob[0], /actions\/checkout@v4[\s\S]*persist-credentials:\s*false/);
  assert.doesNotMatch(generateJob[0], /contents:\s*write/);
  assert.match(generateJob[0], /actions\/upload-artifact@v4/);
  assert.doesNotMatch(
    workflow,
    /- name: Install dependencies\s*\n\s*env:/
  );
  assert.match(generatorStep[0], /run: npm run summary:generate -- --scan/);
  assert.match(commitJob[0], /needs:\s*generate/);
  assert.match(commitJob[0], /permissions:\s*\n\s{6}contents:\s*write/);
  assert.match(commitJob[0], /actions\/download-artifact@v4/);
  assert.doesNotMatch(commitJob[0], /npm ci/);
  assert.match(commitJob[0], /git add source\/_data\/ai-summaries/);
  assert.match(commitJob[0], /git config user\.name/);
  assert.match(commitJob[0], /git config user\.email/);
  assert.match(commitJob[0], /git diff --cached --quiet/);
  assert.match(commitJob[0], /chore: generate draft AI summaries \[skip ci\]/);
  assert.match(commitJob[0], /git push/);
  assert.doesNotMatch(workflow, /hexo deploy/i);
  assert.doesNotMatch(workflow, /npm run deploy/i);
});
