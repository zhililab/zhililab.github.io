# Weekly AI Engineering Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a source-faithful Chinese weekly AI engineering radar article with a dedicated SVG cover, verified primary-source links, and independent Hexo, GitHub Pages, and live-route evidence.

**Architecture:** Add one Hexo Markdown post and one self-contained SVG cover without changing theme or runtime code. Verify the six referenced reports against primary sources, build and test locally, commit only the two release files, push `dev-optimize`, deploy the built output to Pages `master`, and verify the live article and asset separately.

**Tech Stack:** Hexo 6.3, Fluid theme, Markdown/YAML front matter, SVG, Node.js test runner, GitHub Pages via `hexo-deployer-git`

## Global Constraints

- Article title: `本周 AI 工程雷达：Agent 进入复杂迁移，RAG 回归朴素工程`.
- Article path: `source/_posts/2026-07-31-weekly-ai-engineering-radar.md`.
- Cover path: `source/assets/images/cover/weekly-ai-engineering-radar.svg`.
- Author: `Codex`.
- Category: `技术`.
- Tags, in order: `Reports`, `TechRadar`, `AI`.
- Preserve the user's core conclusions, figures, evidence boundaries, EDA context, experiment, and AI Engineering Control Plane conclusion.
- Remove copied `⁠￼` artifacts and replace them with primary-source links.
- Do not add claims that are not supported by a primary source.
- Do not stage or modify the existing `source/assets/images/cover/HelloWorld_Cover.jpg`, `.playwright-cli/`, or `.superpowers/` paths.
- Treat source commit, Pages commit, generated HTML, cover asset, and live route as independent verification layers.

---

## File Structure

- Create `source/_posts/2026-07-31-weekly-ai-engineering-radar.md`: complete reader-facing article, front matter, six report summaries, evidence boundaries, EDA/platform implications, experiment, conclusion, and source list.
- Create `source/assets/images/cover/weekly-ai-engineering-radar.svg`: self-contained visual cover with no external font, script, or raster-image dependency.
- Read only `docs/superpowers/specs/2026-07-31-weekly-ai-engineering-radar-design.md`: approved requirements.
- Read only `source/_posts/2026-07-27-from-graph-platform-to-devops-agent-control-plane.md`: current Hexo/Fluid article convention.
- Generated `public/2026/07/31/2026-07-31-weekly-ai-engineering-radar/index.html`: build artifact used for validation and deployment; never stage it on `dev-optimize`.

### Task 1: Verify the six primary sources and freeze the factual boundary

**Files:**
- Read: `docs/superpowers/specs/2026-07-31-weekly-ai-engineering-radar-design.md`
- Create later in Task 2: `source/_posts/2026-07-31-weekly-ai-engineering-radar.md`

**Interfaces:**
- Consumes: the user's supplied six summaries and evidence-boundary paragraphs.
- Produces: a verified source matrix containing canonical URL, publication date, supported figures, and limitation text for each article section.

- [ ] **Step 1: Open the six primary sources**

Use these canonical starting points:

```text
OpenAI — Scientific Computing in the Age of Agentic AI
https://openai.com/ (resolve the exact canonical article URL from the OpenAI title)

arXiv — Which RAG Paradigm Wins at Scale?
https://arxiv.org/abs/2607.26497

arXiv — Cross-Model Cross-Language AI Coding Agent Performance
https://arxiv.org/abs/2607.26083

JetBrains — Ponytail Skill for Claude Code
https://blog.jetbrains.com/ai/2026/07/ponytail-skill-claude-tested/

METR — Metrics of Agent Ability
https://metr.org/notes/2026-07-24-metrics-of-model-ability/

arXiv — TriShieldRAG
https://arxiv.org/abs/2607.23838
```

Expected: all six sources resolve to the named publisher or arXiv record; the OpenAI article's canonical URL is captured from an official OpenAI page.

- [ ] **Step 2: Check the exact claims used in the article**

Verify and retain only the following source-supported claims:

```text
Scientific computing:
- eight projects
- legacy build modernization, language migration, performance work, and GPU-native work
- external correctness criteria and retrospective/life-science-heavy evidence boundary

RAG scaling:
- 28 nested tiers from roughly 1,000 to 512,000 documents
- Agent+BM25 69.4, raw-file agent 36.9, native BM25 54.8 at full scale
- graph builders stopping within the first 2% for the heaviest schemes
- one reader/judge protocol and 150 questions

Parallel coding agents:
- 12 algorithms across C++, Python, and Julia
- GPT-5.4 produced no measurable speedup in the tested setup
- C++ graph-algorithm speedups of about 1.09–1.47x
- one CPU server and three timing runs

Ponytail:
- 80 paired tasks
- typical code reduction about 15%, median cost reduction 10.3%, time reduction about 11%
- 65 equal, 9 lower, 6 higher quality scores
- no detected quality difference is not proof of equivalence

METR:
- score as a function of expenditure
- fixed-budget success, expenditure for fixed quality, marginal returns, and human-relative expenditure
- note is a metric taxonomy, not an enterprise standard

TriShieldRAG:
- Ingest Guard, Retrieval Scorer, Cross-LLM Consensus
- about 91% to about 13% attack success
- 5,000 documents and 10 target questions
- non-adaptive attacker, minority-poison assumption, provenance-tag assumption, no completed poison-fraction sweep
```

Expected: every retained number appears in the primary source. If an exact claim cannot be found, use the weaker wording already allowed by the approved design instead of inventing support.

- [ ] **Step 3: Confirm no secondary-source URL is needed**

Run after drafting the reference list in Task 2:

```bash
rg -n 'reddit\.com|cuppa\.today|stacktrace\.news|tdd\.cat' \
  source/_posts/2026-07-31-weekly-ai-engineering-radar.md
```

Expected after Task 2: no output and exit status 1, because the article links directly to primary sources.

### Task 2: Create the Hexo article

**Files:**
- Create: `source/_posts/2026-07-31-weekly-ai-engineering-radar.md`

**Interfaces:**
- Consumes: the verified source matrix from Task 1 and the approved design.
- Produces: one complete Hexo post referenced by the cover and local build tasks.

- [ ] **Step 1: Verify the article does not already exist**

Run:

```bash
test -f source/_posts/2026-07-31-weekly-ai-engineering-radar.md
```

Expected: exit status 1.

- [ ] **Step 2: Create the article with exact front matter**

Start the file with:

```yaml
---
title: "本周 AI 工程雷达：Agent 进入复杂迁移，RAG 回归朴素工程"
author: "Codex"
tags:
  - Reports
  - TechRadar
  - AI
categories:
  - 技术
index_img: /assets/images/cover/weekly-ai-engineering-radar.svg
banner_img: /assets/images/cover/weekly-ai-engineering-radar.svg
date: 2026-07-31 12:00:00
---
```

Follow it with the three engineering signals from the approved design, then `<!-- more -->`, then these exact second-level sections:

```markdown
## 本周精选
## 本周 Top 3
## 下周可以做的一个小实验
## 值得长期建设的平台能力
## 参考资料
```

Within `## 本周精选`, use six numbered third-level headings in this order:

```markdown
### 1. Scientific Computing in the Age of Agentic AI
### 2. Which RAG Paradigm Wins at Scale?
### 3. Cross-Model Cross-Language AI Coding Agent Performance
### 4. Ponytail Skill A/B Benchmark
### 5. Metrics of Agent Ability
### 6. TriShieldRAG：面向知识库投毒的纵深防御
```

For every item, keep the sequence `发布日期与来源 → 核心发现 → 证据边界 → 对 EDA/平台工程的启发`. Preserve the user's ASCII flows as fenced `text` blocks. End with six direct Markdown links under `## 参考资料`.

- [ ] **Step 3: Run focused source checks**

Run:

```bash
rg -n '^author: "Codex"$|^  - (Reports|TechRadar|AI|技术)$|<!-- more -->|^### [1-6]\.' \
  source/_posts/2026-07-31-weekly-ai-engineering-radar.md
```

Expected: author, all three tags, category, summary marker, and six numbered source headings are present.

Run:

```bash
test "$(rg -o 'https?://[^)] ]+' source/_posts/2026-07-31-weekly-ai-engineering-radar.md | wc -l | tr -d ' ')" -ge 6
```

Expected: exit status 0.

Run:

```bash
rg -n '⁠￼|OpenAI 原始报告|论文与完整数据|论文及实验表格|JetBrains A/B 测试|METR 研究笔记|论文原文' \
  source/_posts/2026-07-31-weekly-ai-engineering-radar.md
```

Expected: no output and exit status 1; copied placeholders and unlinked source labels are gone.

### Task 3: Create the self-contained SVG cover

**Files:**
- Create: `source/assets/images/cover/weekly-ai-engineering-radar.svg`

**Interfaces:**
- Consumes: article title and the cover requirements from the approved design.
- Produces: `/assets/images/cover/weekly-ai-engineering-radar.svg` for both `index_img` and `banner_img`.

- [ ] **Step 1: Verify the cover does not already exist**

Run:

```bash
test -f source/assets/images/cover/weekly-ai-engineering-radar.svg
```

Expected: exit status 1.

- [ ] **Step 2: Create the SVG**

Use an SVG with:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title desc">
  <title id="title">AI Engineering Radar</title>
  <desc id="desc">A technical radar cover representing agents, retrieval, and verification.</desc>
```

Required visible text:

```text
AI ENGINEERING RADAR
WEEKLY REPORT · 2026.07.31
AGENTS · RETRIEVAL · VERIFICATION
```

Required construction:

- dark navy gradient background;
- concentric radar circles centered in the right half;
- three or more connected signal nodes;
- title block inside the center-safe region from x=120 to x=900;
- only system font-family fallbacks;
- no `<script>`, `<image>`, external URL, or embedded raster payload.

- [ ] **Step 3: Validate SVG safety and required text**

Run:

```bash
rg -n 'AI ENGINEERING RADAR|WEEKLY REPORT · 2026\.07\.31|AGENTS · RETRIEVAL · VERIFICATION' \
  source/assets/images/cover/weekly-ai-engineering-radar.svg
```

Expected: all three text lines are present.

Run:

```bash
rg -n '<script|<image|https?://|data:image' \
  source/assets/images/cover/weekly-ai-engineering-radar.svg
```

Expected: no output and exit status 1.

### Task 4: Build and validate the generated site

**Files:**
- Read: `themes/hexo-theme-fluid/layout/layout.ejs`
- Generate: `public/2026/07/31/2026-07-31-weekly-ai-engineering-radar/index.html`
- Generate: `public/assets/images/cover/weekly-ai-engineering-radar.svg`

**Interfaces:**
- Consumes: the post and SVG created in Tasks 2 and 3.
- Produces: a tested static site artifact ready for deployment.

- [ ] **Step 1: Confirm the Fluid theme has actual layout files**

Run:

```bash
test -f themes/hexo-theme-fluid/layout/layout.ejs
```

Expected: exit status 0. If it fails, restore the configured theme submodule at its pinned commit before building; do not accept a `No layout` build.

- [ ] **Step 2: Clean and build**

Run:

```bash
npm run clean
npm run build
```

Expected: both commands exit 0; Hexo reports the article route and cover as generated or copied without `No layout` or `Script load failed`.

- [ ] **Step 3: Run the full test suite**

Run:

```bash
npm test
```

Expected: exit status 0 with every test passing.

- [ ] **Step 4: Validate generated article content**

Run:

```bash
test -f public/2026/07/31/2026-07-31-weekly-ai-engineering-radar/index.html
test -f public/assets/images/cover/weekly-ai-engineering-radar.svg
```

Expected: both commands exit 0.

Run:

```bash
rg -n '本周 AI 工程雷达|Codex|Reports|TechRadar|Scientific Computing|TriShieldRAG|AI Engineering Control Plane' \
  public/2026/07/31/2026-07-31-weekly-ai-engineering-radar/index.html
```

Expected: all key metadata and content markers appear in generated HTML.

- [ ] **Step 5: Check source diff and formatting**

Run:

```bash
git diff --check -- \
  source/_posts/2026-07-31-weekly-ai-engineering-radar.md \
  source/assets/images/cover/weekly-ai-engineering-radar.svg
git status --short
```

Expected: no whitespace errors. Status shows the two intended untracked files plus the pre-existing unrelated changes; no unrelated file has been edited by this implementation.

### Task 5: Commit, push, deploy, and verify production

**Files:**
- Commit: `source/_posts/2026-07-31-weekly-ai-engineering-radar.md`
- Commit: `source/assets/images/cover/weekly-ai-engineering-radar.svg`
- Do not commit: `public/`
- Do not commit: `source/assets/images/cover/HelloWorld_Cover.jpg`
- Do not commit: `.playwright-cli/`
- Do not commit: `.superpowers/`

**Interfaces:**
- Consumes: the verified static site from Task 4.
- Produces: one scoped source commit on `dev-optimize`, one Pages deployment commit on `master`, and live HTTP/content evidence.

- [ ] **Step 1: Stage only the release files**

Run:

```bash
git add \
  source/_posts/2026-07-31-weekly-ai-engineering-radar.md \
  source/assets/images/cover/weekly-ai-engineering-radar.svg
git diff --cached --name-only
```

Expected:

```text
source/_posts/2026-07-31-weekly-ai-engineering-radar.md
source/assets/images/cover/weekly-ai-engineering-radar.svg
```

- [ ] **Step 2: Commit the source release**

Run:

```bash
git commit -m "feat: publish weekly AI engineering radar"
```

Expected: one new commit containing exactly the two release files.

- [ ] **Step 3: Push the source branch**

Run:

```bash
git push origin dev-optimize
```

Expected: remote `dev-optimize` advances to the new source commit.

- [ ] **Step 4: Deploy the already verified static artifact**

Run:

```bash
npm run deploy
```

Expected: deploy exits 0 and the Pages repository `master` branch advances. Record the resulting Pages commit separately from the source commit.

- [ ] **Step 5: Verify the live article and cover**

Expected URLs:

```text
https://www.zhililab.cn/2026/07/31/2026-07-31-weekly-ai-engineering-radar/
https://www.zhililab.cn/assets/images/cover/weekly-ai-engineering-radar.svg
```

Run:

```bash
curl -sS -o /tmp/weekly-ai-engineering-radar.html -w '%{http_code}\n' \
  https://www.zhililab.cn/2026/07/31/2026-07-31-weekly-ai-engineering-radar/
curl -sS -o /tmp/weekly-ai-engineering-radar.svg -w '%{http_code}\n' \
  https://www.zhililab.cn/assets/images/cover/weekly-ai-engineering-radar.svg
```

Expected: both commands print `200`. If the article initially returns `404`, wait for Pages/custom-domain propagation and retry before reporting failure.

Run:

```bash
rg -n '本周 AI 工程雷达|Codex|Reports|TechRadar|Which RAG Paradigm|TriShieldRAG|AI Engineering Control Plane' \
  /tmp/weekly-ai-engineering-radar.html
rg -n 'AI ENGINEERING RADAR|WEEKLY REPORT · 2026\.07\.31' \
  /tmp/weekly-ai-engineering-radar.svg
```

Expected: all article and cover markers are present in the downloaded production files.

- [ ] **Step 6: Record layered release evidence**

Report these independently:

```text
Source file and source commit:
Build result:
Test result:
Remote dev-optimize commit:
Pages master commit:
Live article HTTP/content result:
Live cover HTTP/content result:
Unrelated local changes preserved:
```

Expected: no layer is inferred from another; every reported result has direct command output or remote evidence.
