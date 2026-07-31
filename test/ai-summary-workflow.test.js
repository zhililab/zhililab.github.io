'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const workflowPath = path.join(root, '.github/workflows/generate-ai-summaries.yml');
const radarPostPath = path.join(
  root,
  'source/_posts/2026-07-31-weekly-ai-engineering-radar.md'
);

test('weekly AI engineering radar uses automatic summary generation', () => {
  const markdown = fs.readFileSync(radarPostPath, 'utf8');
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/);

  assert.ok(frontmatter, 'missing radar post frontmatter');
  assert.doesNotMatch(frontmatter[1], /^ai_summary:\s*false\s*$/m);
});

test('AI summary workflow generates draft summaries only for changed posts on dev-optimize', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  const generatorStep = workflow.match(
    /^\s{6}- name: Generate draft AI summaries\n(?:^\s{8,}.*\n)*/m
  );
  const generateJob = workflow.match(
    /^\s{2}generate:\n(?:^(?!\s{2}\S).*\n|^\s{4,}.*\n)*/m
  );
  const reviewJob = workflow.match(
    /^\s{2}review:\n(?:^(?!\s{2}\S).*\n|^\s{4,}.*\n)*/m
  );

  assert.match(workflow, /^\s{2}push:\s*\n\s*branches:\s*\n\s*-\s*dev-optimize/m);
  assert.match(workflow, /on:\s*\n\s*workflow_dispatch:\s*\n\s*push:/m);
  assert.match(workflow, /paths:\s*\n\s*-\s*['\"]?source\/_posts\/\*\*['\"]?/m);
  assert.match(workflow, /-\s*['\"]?\.gitmodules['\"]?/);
  assert.match(workflow, /-\s*['\"]?\.github\/workflows\/generate-ai-summaries\.yml['\"]?/);
  assert.match(workflow, /-\s*['\"]?tools\/generate-ai-summary\.js['\"]?/);
  assert.match(workflow, /-\s*['\"]?scripts\/lib\/ai-summary\*\.js['\"]?/);
  assert.match(workflow, /^permissions:\s*\n\s{2}contents:\s*read/m);
  assert.doesNotMatch(workflow, /^\s{4}env:/m);
  assert.ok(generateJob, 'missing read-only generation job');
  assert.ok(reviewJob, 'missing review PR job');
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
  assert.match(reviewJob[0], /needs:\s*generate/);
  assert.match(
    reviewJob[0],
    /permissions:\s*\n\s{6}contents:\s*write\s*\n\s{6}pull-requests:\s*write/
  );
  assert.match(reviewJob[0], /actions\/download-artifact@v4/);
  assert.doesNotMatch(reviewJob[0], /npm ci/);
  assert.match(reviewJob[0], /id:\s*prepare/);
  assert.match(reviewJob[0], /git add source\/_data\/ai-summaries/);
  assert.match(reviewJob[0], /source\/_data\/ai-summaries\/\[\^\/\]\\\+\\\.json/);
  assert.match(reviewJob[0], /git config user\.name/);
  assert.match(reviewJob[0], /git config user\.email/);
  assert.match(reviewJob[0], /git diff --cached --quiet/);
  assert.match(reviewJob[0], /has_changes=false/);
  assert.match(reviewJob[0], /GITHUB_STEP_SUMMARY/);
  assert.match(reviewJob[0], /ai-summary\/run-\$\{GITHUB_RUN_ID\}/);
  assert.match(reviewJob[0], /chore: generate draft AI summaries \[skip ci\]/);
  assert.match(reviewJob[0], /git push --set-upstream origin/);
  assert.match(reviewJob[0], /steps\.prepare\.outputs\.has_changes == 'true'/);
  assert.match(reviewJob[0], /gh pr create/);
  assert.match(reviewJob[0], /--base dev-optimize/);
  assert.match(reviewJob[0], /--reviewer zhililab/);
  assert.match(
    reviewJob[0],
    /github\.com\/\$\{\{ github\.repository \}\}\/actions\/runs\/\$\{\{ github\.run_id \}\}/
  );
  assert.match(reviewJob[0], /status.*draft.*approved/is);
  assert.doesNotMatch(reviewJob[0], /^\s*git push\s*$/m);
  assert.doesNotMatch(workflow, /hexo deploy/i);
  assert.doesNotMatch(workflow, /npm run deploy/i);
});
