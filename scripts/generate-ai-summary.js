#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  computeSourceHash,
  extractFrontmatterAndBody,
  generateSummaryForPost,
  validateSummary
} = require('./lib/ai-summary');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'source', '_posts');
const OUTPUT_DIR = path.join(ROOT, 'source', '_data', 'ai-summaries');
const CUTOFF = new Date('2026-07-30T00:00:00+08:00');
const BACKFILLS = new Set([
  '2026-07-22-agentic-devops-practice-report',
  '2026-07-23-kubernetes-pod-creation-workflow',
  '2026-07-27-from-graph-platform-to-devops-agent-control-plane'
]);

function readPostInfo(postPath) {
  const markdown = fs.readFileSync(postPath, 'utf8');
  const { frontmatter, body } = extractFrontmatterAndBody(markdown);
  const slug = path.basename(postPath, path.extname(postPath));
  const optedOut = /^ai_summary:\s*false\s*$/m.test(frontmatter);
  const dateMatch = frontmatter.match(/^date:\s*(.+)$/m);
  const date = dateMatch ? new Date(dateMatch[1].trim()) : null;
  return { postPath, slug, body, optedOut, date };
}

function requiredPosts() {
  return fs.readdirSync(POSTS_DIR)
    .filter(name => name.endsWith('.md'))
    .map(name => readPostInfo(path.join(POSTS_DIR, name)))
    .filter(post => !post.optedOut && (
      BACKFILLS.has(post.slug) ||
      (post.date && !Number.isNaN(post.date.valueOf()) && post.date > CUTOFF)
    ));
}

function summaryFile(slug) {
  return path.join(OUTPUT_DIR, `${slug}.json`);
}

function currentSummary(post) {
  const filePath = summaryFile(post.slug);
  if (!fs.existsSync(filePath)) return null;
  try {
    return validateSummary(JSON.parse(fs.readFileSync(filePath, 'utf8')), {
      slug: post.slug,
      sourceHash: computeSourceHash(post.body)
    });
  } catch {
    return null;
  }
}

function checkRequiredPosts() {
  const failures = [];
  for (const post of requiredPosts()) {
    const summary = currentSummary(post);
    if (!summary) {
      failures.push(`${post.slug}: missing, invalid, or stale summary`);
    } else if (summary.status !== 'approved') {
      failures.push(`${post.slug}: summary awaits approval`);
    }
  }
  if (failures.length) {
    failures.forEach(message => console.error(message));
    process.exitCode = 1;
  } else {
    console.log('AI summaries are approved and current.');
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--check')) {
    checkRequiredPosts();
    return;
  }

  let postPaths = args.filter(arg => !arg.startsWith('--')).map(arg => path.resolve(arg));
  if (args.includes('--scan')) {
    postPaths = requiredPosts()
      .filter(post => !currentSummary(post))
      .map(post => post.postPath);
  }
  if (!postPaths.length) {
    console.log('No AI summaries need generation.');
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required; configure it locally or as a GitHub Secret.');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  for (const postPath of postPaths) {
    const result = await generateSummaryForPost({
      postPath,
      outputDir: OUTPUT_DIR,
      apiKey: process.env.GEMINI_API_KEY,
      model
    });
    console.log(path.relative(ROOT, result.path));
  }
}

main().catch(error => {
  console.error(`AI summary generation failed: ${error.message}`);
  process.exitCode = 1;
});
