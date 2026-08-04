const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
test('notes source keeps a banner and preserves the historical entries', () => {
  const source = read('source/notes/index.md');

  assert.match(source, /^banner_img: https:\/\/i\.imgtg\.com\/2023\/05\/28\/OoZhHB\.png$/m);
  assert.match(source, /^banner_img_height: 60$/m);
  assert.match(source, /^banner_mask_alpha: 0\.3$/m);
  assert.doesNotMatch(source, /avatar_casual|Walker \/ Field Log|持续记录，延迟定论/);
  assert.equal((source.match(/^> /gm) || []).length, 3);
  assert.match(source, /做事要么做到位，要么干脆不做/);
  assert.match(source, /热练春天，是为了盛夏更加睛彩夺目/);
  assert.match(source, /不要害怕遇到不会的、难以理解的事物/);
});

test('rendered notes page uses the standard theme banner and page layout', () => {
  const html = read('public/notes/index.html');

  assert.match(html, /OoZhHB\.png/);
  assert.match(html, /id="banner"/);
  assert.match(html, /class="page-content"/);
  assert.doesNotMatch(html, /field-notes-page|blog-notes\.css|avatar_casual/);
  assert.equal((html.match(/<blockquote>/g) || []).length, 3);
});
