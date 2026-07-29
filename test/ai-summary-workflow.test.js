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

  assert.match(workflow, /on:\s*\n\s*push:\s*\n\s*branches:\s*\n\s*-\s*dev-optimize/m);
  assert.match(workflow, /paths:\s*\n\s*-\s*['\"]?source\/_posts\/\*\*['\"]?/m);
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*write/m);
  assert.doesNotMatch(workflow, /^\s{4}env:/m);
  assert.ok(generatorStep, 'missing named generator step');
  assert.match(
    generatorStep[0],
    /GEMINI_API_KEY:\s*\$\{\{\s*secrets\.GEMINI_API_KEY\s*\}\}/
  );
  assert.match(
    generatorStep[0],
    /GEMINI_MODEL:\s*\$\{\{\s*vars\.GEMINI_MODEL\s*\}\}/
  );
  assert.match(workflow, /actions\/setup-node@v\d+/);
  assert.match(workflow, /node-version:\s*['\"]?20['\"]?/);
  assert.match(workflow, /- name: Install dependencies\s*\n\s*run: npm ci/);
  assert.doesNotMatch(
    workflow,
    /- name: Install dependencies\s*\n\s*env:/
  );
  assert.match(generatorStep[0], /run: npm run summary:generate -- --scan/);
  assert.match(workflow, /git add source\/_data\/ai-summaries/);
  assert.match(workflow, /git config user\.name/);
  assert.match(workflow, /git config user\.email/);
  assert.match(workflow, /git diff --cached --quiet/);
  assert.match(workflow, /chore: generate draft AI summaries \[skip ci\]/);
  assert.match(workflow, /git push/);
  assert.doesNotMatch(workflow, /hexo deploy/i);
  assert.doesNotMatch(workflow, /npm run deploy/i);
});
