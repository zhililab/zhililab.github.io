#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  computeSourceHash,
  generateSummaryForPost,
  parsePost,
  validateSummary
} = require('../scripts/lib/ai-summary');
const { isAiSummaryRequired } = require('../scripts/lib/ai-summary-eligibility');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'source', '_posts');
const OUTPUT_DIR = path.join(ROOT, 'source', '_data', 'ai-summaries');

function readPostInfo(postPath) {
  try {
    const markdown = fs.readFileSync(postPath, 'utf8');
    const { body, optedOut, date } = parsePost(markdown);
    const slug = path.basename(postPath, path.extname(postPath));
    return { postPath, slug, body, optedOut, date };
  } catch (error) {
    throw new Error(`${path.basename(postPath)}: malformed post metadata (${error.message})`);
  }
}

function requiredPosts() {
  const posts = [];
  const failures = [];
  for (const name of fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md')).sort()) {
    const postPath = path.join(POSTS_DIR, name);
    const slug = path.basename(name, path.extname(name));
    const filenameDate = name.match(/^(\d{4}-\d{2}-\d{2})-/);
    const namedAsRequired = isAiSummaryRequired({
      slug,
      date: filenameDate ? `${filenameDate[1]}T00:00:00+08:00` : undefined
    });
    const markdown = fs.readFileSync(postPath, 'utf8');
    const hasFrontmatter = markdown.replace(/^\uFEFF/, '').startsWith('---');
    if (!namedAsRequired && !hasFrontmatter) {
      continue;
    }
    try {
      const post = readPostInfo(postPath);
      if (isAiSummaryRequired({
        slug: post.slug,
        date: post.date,
        aiSummary: post.optedOut ? false : undefined
      })) {
        posts.push(post);
      }
    } catch (error) {
      if (namedAsRequired || hasFrontmatter) failures.push(error.message);
    }
  }
  if (failures.length) {
    throw new Error(`Malformed posts:\n${failures.map(message => `- ${message}`).join('\n')}`);
  }
  return posts;
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
  if (!args.includes('--scan')) {
    postPaths.forEach(readPostInfo);
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
