# AdSense Post Visual Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated AdSense reflection cover and make enhanced post images display their complete original composition without visual cropping.

**Architecture:** One source test locks the article frontmatter and generated cover dimensions. The existing reading-experience stylesheet owns post-only image presentation, while the existing performance pipeline continues to own responsive WebP generation, lazy loading, and original-image fallback.

**Tech Stack:** Hexo 6, Fluid theme, Node.js built-in test runner, Sharp 0.34, CSS, OpenAI image generation, GitHub Pages.

## Global Constraints

- Do not modify the article body text.
- Generate one `1920×818` cover at `source/assets/images/cover/why-google-adsense.webp`.
- Use the cover for both `index_img` and `banner_img`.
- Post images must use `object-fit: contain`, `width: auto`, `height: auto`, `max-width: 100%`, and `max-height: none`.
- Keep responsive WebP, `srcset`, lazy loading, asynchronous decoding, and original PNG fallback.
- Do not affect home-page covers, page banners, non-post images, the pet, comments, or site icons.
- Exclude the pre-existing `HelloWorld_Cover.jpg` and `.playwright-cli/` changes.

---

### Task 1: Lock the visual contract with failing tests

**Files:**
- Create: `test/adsense-post-visuals.test.js`
- Read: `source/_posts/2026-07-29-why-google-adsense.md`
- Read: `source/css/blog-reading-experience.css`

**Interfaces:**
- Consumes: article frontmatter, cover file metadata, and post enhancement CSS.
- Produces: source-level regression tests for cover configuration and uncropped body images.

- [ ] **Step 1: Add the failing tests**

Create:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const post = fs.readFileSync(
  path.join(root, 'source/_posts/2026-07-29-why-google-adsense.md'),
  'utf8'
);
const css = fs.readFileSync(
  path.join(root, 'source/css/blog-reading-experience.css'),
  'utf8'
);
const cover = path.join(
  root,
  'source/assets/images/cover/why-google-adsense.webp'
);

test('AdSense reflection uses one dedicated card and banner cover', async () => {
  assert.match(
    post,
    /^index_img: \/assets\/images\/cover\/why-google-adsense\.webp$/m
  );
  assert.match(
    post,
    /^banner_img: \/assets\/images\/cover\/why-google-adsense\.webp$/m
  );
  assert.ok(fs.existsSync(cover));

  const metadata = await sharp(cover).metadata();
  assert.equal(metadata.width, 1920);
  assert.equal(metadata.height, 818);
  assert.equal(metadata.format, 'webp');
});

test('enhanced post pictures preserve their full original composition', () => {
  assert.match(css, /\.blog-post-enhanced \.markdown-body p > picture/);
  assert.match(css, /object-fit:\s*contain/);
  assert.match(css, /width:\s*auto/);
  assert.match(css, /height:\s*auto/);
  assert.match(css, /max-width:\s*100%/);
  assert.match(css, /max-height:\s*none/);
});
```

- [ ] **Step 2: Run the focused tests**

Run:

```bash
node --test test/adsense-post-visuals.test.js
```

Expected: both tests fail because the cover/frontmatter and post-picture CSS do not yet exist.

- [ ] **Step 3: Commit only the failing tests**

```bash
git add test/adsense-post-visuals.test.js
git commit -m "test: define AdSense post visual contract"
```

### Task 2: Generate and connect the cover

**Files:**
- Create: `source/assets/images/cover/why-google-adsense.webp`
- Modify: `source/_posts/2026-07-29-why-google-adsense.md`
- Test: `test/adsense-post-visuals.test.js`

**Interfaces:**
- Consumes: the approved cover concept and target `1920×818` geometry.
- Produces: one card/banner cover and two frontmatter references.

- [ ] **Step 1: Generate the source artwork**

Use image generation with this prompt:

```text
Create a polished cinematic horizontal editorial illustration for a Chinese
technology blog article about learning product distribution through Google
AdSense. Dark navy technical background. A clear left-to-right story:
an article/document being created, flowing through an abstract distribution
network, reaching diverse user nodes, then returning as feedback and a subtle
growth signal. Use restrained blue, red, yellow, and green accent lights as an
indirect reference to the Google color palette, but do not include the Google
or AdSense logo, currency symbols, dashboards, screenshots, or readable text.
Keep the main visual elements inside the central 60% safe area so both a wide
banner and a cropped home-page card remain legible. Premium, minimal, modern,
high contrast, no watermark.
```

Expected: one wide source image with all key subjects inside the central safe area.

- [ ] **Step 2: Normalize and encode the cover**

Center-crop the generated source to the approved `1920×818` canvas, then encode it with Sharp:

```js
await sharp(generatedSource)
  .resize(1920, 818, { fit: 'cover', position: 'centre' })
  .webp({ quality: 86 })
  .toFile('source/assets/images/cover/why-google-adsense.webp');
```

Expected: WebP metadata reports exactly `1920×818`.

- [ ] **Step 3: Add the two frontmatter fields**

Insert below `categories` and before `date`:

```yaml
index_img: /assets/images/cover/why-google-adsense.webp
banner_img: /assets/images/cover/why-google-adsense.webp
```

Do not change article body text.

- [ ] **Step 4: Run the cover test**

Run:

```bash
node --test --test-name-pattern="dedicated card and banner cover" test/adsense-post-visuals.test.js
```

Expected: the cover test passes.

- [ ] **Step 5: Commit the cover**

```bash
git add source/_posts/2026-07-29-why-google-adsense.md \
  source/assets/images/cover/why-google-adsense.webp
git commit -m "feat: add AdSense reflection cover"
```

### Task 3: Make post pictures uncropped

**Files:**
- Modify: `source/css/blog-reading-experience.css`
- Test: `test/adsense-post-visuals.test.js`

**Interfaces:**
- Consumes: `<picture>` markup emitted by `rewritePostImages`.
- Produces: post-scoped full-composition image layout without changing the image pipeline.

- [ ] **Step 1: Add the minimal post-scoped CSS**

Add after `.blog-post-enhanced .post-content`:

```css
.blog-post-enhanced .markdown-body p > picture {
  display: block;
  max-width: 100%;
  margin: 1.5rem auto;
}

.blog-post-enhanced .markdown-body p > picture > img,
.blog-post-enhanced .markdown-body p > img,
.blog-post-enhanced .markdown-body figure > img,
.blog-post-enhanced .markdown-body figure > a > img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: none;
  margin: 1.5rem auto;
  object-fit: contain;
}
```

- [ ] **Step 2: Run the focused tests**

Run:

```bash
node --test test/adsense-post-visuals.test.js
```

Expected: both tests pass.

- [ ] **Step 3: Run the complete source suite**

Run:

```bash
npm test
```

Expected: all existing tests plus the two new tests pass.

- [ ] **Step 4: Commit the CSS fix**

```bash
git add source/css/blog-reading-experience.css test/adsense-post-visuals.test.js
git commit -m "fix: preserve full post images"
```

### Task 4: Build, inspect, and publish

**Files:**
- Verify: `public/index.html`
- Verify: `public/2026/07/29/2026-07-29-why-google-adsense/index.html`
- Verify: `public/assets/images/cover/why-google-adsense.webp`
- Verify: `public/css/blog-reading-experience.css`

**Interfaces:**
- Consumes: the source commits from Tasks 2 and 3.
- Produces: verified source and Pages commits plus live route evidence.

- [ ] **Step 1: Rebuild from a clean generated state**

```bash
npm run clean
npm run build
npm test
```

Expected: build succeeds and the complete suite passes.

- [ ] **Step 2: Verify generated markup and assets**

```bash
rg -n "why-google-adsense\\.webp" public/index.html \
  public/2026/07/29/2026-07-29-why-google-adsense/index.html
rg -n "object-fit: contain|max-height: none" \
  public/css/blog-reading-experience.css
```

Expected: the home card and detail banner reference the cover; generated CSS contains uncropped image rules.

- [ ] **Step 3: Perform desktop and mobile browser checks**

Verify:

```text
Home card shows the new cover.
Detail banner shows the new cover.
Both body screenshots display all four edges.
No page-level horizontal overflow.
Responsive WebP remains the selected currentSrc.
Fancybox original href remains the PNG.
```

- [ ] **Step 4: Preserve unrelated generated assets**

Restore the current Pages `HelloWorld_Cover.jpg` path and hash in `public/` before deployment. Do not modify the user-owned source file.

- [ ] **Step 5: Push and deploy**

Push the verified source state to `dev-optimize`, deploy the exact `public/` state to Pages `master`, and record both commit hashes.

- [ ] **Step 6: Verify production**

Require HTTPS 200 for:

```text
/
/2026/07/29/2026-07-29-why-google-adsense/
/assets/images/cover/why-google-adsense.webp
/assets/images/posts/google-adsense-dns-records.png
/assets/images/posts/google-adsense-review-status.png
```

Verify the live home and article HTML reference the new cover and the live CSS contains the uncropped picture rules.
