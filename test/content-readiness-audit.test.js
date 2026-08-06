'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('content audit reports transparent readiness signals without editing posts', () => {
  const modulePath = path.resolve(__dirname, '../tools/audit-blog-content.js');
  assert.ok(fs.existsSync(modulePath), 'content audit tool must exist');
  const { auditPosts } = require(modulePath);
  const postsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'content-audit-'));

  fs.writeFileSync(
    path.join(postsDir, 'short.md'),
    '---\ntitle: Short\n---\n很短的内容',
    'utf8'
  );
  fs.writeFileSync(
    path.join(postsDir, 'substantial.md'),
    [
      '---',
      'title: Substantial',
      'index_img: /cover.webp',
      '---',
      '<!-- more -->',
      Array.from({ length: 650 }, () => 'practice').join(' ')
    ].join('\n'),
    'utf8'
  );

  const before = fs.readFileSync(path.join(postsDir, 'short.md'), 'utf8');
  const rows = auditPosts(postsDir);

  assert.equal(rows.length, 2);
  assert.deepEqual(
    Object.keys(rows[0]).sort(),
    ['file', 'hasCover', 'signals', 'title', 'words'].sort()
  );
  assert.ok(rows.find((row) => row.file === 'short.md').signals.includes('thin'));
  assert.deepEqual(
    rows.find((row) => row.file === 'substantial.md').signals,
    []
  );
  assert.equal(
    fs.readFileSync(path.join(postsDir, 'short.md'), 'utf8'),
    before
  );
});
