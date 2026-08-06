#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function splitPost(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return match
    ? { frontmatter: match[1], body: markdown.slice(match[0].length) }
    : { frontmatter: '', body: markdown };
}

function field(frontmatter, name) {
  const match = frontmatter.match(
    new RegExp(`^${name}:\\s*(?:"([^"]*)"|'([^']*)'|(.+))$`, 'm')
  );
  return match ? String(match[1] || match[2] || match[3] || '').trim() : '';
}

function countWords(markdown) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ');
  const chineseCharacters = text.match(/[\u3400-\u9fff]/g) || [];
  const latinWords = text.match(/[A-Za-z0-9][A-Za-z0-9_-]*/g) || [];
  return chineseCharacters.length + latinWords.length;
}

function auditPosts(postsDir) {
  return fs.readdirSync(postsDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const markdown = fs.readFileSync(path.join(postsDir, file), 'utf8');
      const { frontmatter, body } = splitPost(markdown);
      const words = countWords(body);
      const hasCover = Boolean(
        field(frontmatter, 'index_img') || field(frontmatter, 'banner_img')
      );
      const signals = [];
      if (words < 600) signals.push('thin');
      if (!hasCover) signals.push('missing-cover');
      if (!markdown.includes('<!-- more -->')) signals.push('missing-summary');
      return {
        file,
        title: field(frontmatter, 'title') || path.basename(file, '.md'),
        words,
        hasCover,
        signals
      };
    })
    .sort((left, right) => left.words - right.words || left.file.localeCompare(right.file));
}

function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function renderReport(rows) {
  const flagged = rows.filter((row) => row.signals.length > 0).length;
  const lines = [
    '# AdSense Content Readiness Audit',
    '',
    '> This is a mechanical editorial review aid, not a Google policy determination.',
    '> It does not modify, hide, delete, or add `noindex` to any article.',
    '',
    `- Posts scanned: ${rows.length}`,
    `- Posts with review signals: ${flagged}`,
    '- Signals: `thin` (<600 Chinese characters/Latin words), `missing-cover`, `missing-summary`.',
    '',
    '| File | Title | Count | Cover | Review signals |',
    '| --- | --- | ---: | :---: | --- |'
  ];
  for (const row of rows) {
    lines.push(
      `| ${escapeCell(row.file)} | ${escapeCell(row.title)} | ${row.words} | ${row.hasCover ? 'yes' : 'no'} | ${row.signals.join(', ') || 'none'} |`
    );
  }
  lines.push(
    '',
    '## Recommended review order',
    '',
    '1. Add first-hand experience, real troubleshooting evidence, and updated sources to posts marked `thin`.',
    '2. Add a meaningful cover and explicit summary only when they improve discovery and navigation.',
    '3. Review old or generic introductions manually before deciding whether to consolidate or update them.',
    '4. Do not resubmit AdSense until the Sitemap is readable and multiple representative URLs are discovered or indexed in Search Console.',
    ''
  );
  return lines.join('\n');
}

function main(args = process.argv.slice(2)) {
  if (args.length !== 2) {
    throw new Error('Usage: audit-blog-content <posts-dir> <output-file>');
  }
  const postsDir = path.resolve(args[0]);
  const output = path.resolve(args[1]);
  const report = renderReport(auditPosts(postsDir));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, report, 'utf8');
  process.stdout.write(`${output}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  auditPosts,
  countWords,
  renderReport
};
