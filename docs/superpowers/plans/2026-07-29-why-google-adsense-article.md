# Why Google AdSense Article Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a concise Chinese Hexo draft that explains the author's personal motivation and learning from the Google AdSense practice without turning into a generic setup tutorial.

**Architecture:** The article uses a first-person reflection as the main narrative, supported by one compact practice timeline and one short reusable checklist. Current repository evidence and Google/GitHub primary documentation constrain factual claims; the draft ends at the real “review requested” state.

**Tech Stack:** Chinese Markdown, Hexo frontmatter, Fluid theme conventions, Google AdSense and GitHub Pages primary documentation.

## Global Constraints

- Target length is 1,500–2,000 Chinese characters before sources.
- Personal judgment, motivation, and learning occupy about 70% of the article.
- Practice details occupy about 25%; generic setup instructions occupy no more than 5%.
- Do not claim that the site is approved, serving ads, or earning revenue.
- Do not publish the draft or modify existing posts.
- Do not include login, identity, address, tax, or payment information.
- Keep the current public publisher identifier out of the prose because it adds no reader value.

---

### Task 1: Verify the factual practice boundary

**Files:**
- Read: `docs/superpowers/specs/2026-07-29-google-adsense-controlled-placement-design.md`
- Read: `docs/operations/google-adsense-onboarding.md`
- Read: `source/ads.txt`
- Read: `_config.yml`

**Interfaces:**
- Consumes: the current AdSense review preparation and live authorization state.
- Produces: a factual checklist containing the chosen placement, verification path, DNS issue, and current review status.

- [ ] **Step 1: Confirm the controlled-placement decision**

Run:

```bash
rg -n "一个响应式广告|正文结束之后|不启用 Auto ads" \
  docs/superpowers/specs/2026-07-29-google-adsense-controlled-placement-design.md
```

Expected: the design confirms one post-end responsive slot and no Auto ads.

- [ ] **Step 2: Confirm the public authorization and disabled production state**

Run:

```bash
test -s source/ads.txt
rg -n "^adsense:|enabled: false|client: ''|slot: ''" _config.yml
```

Expected: `source/ads.txt` exists while production advertising remains disabled.

- [ ] **Step 3: Collect primary sources**

Use only official Google AdSense and GitHub Pages pages for technical statements:

```text
https://support.google.com/adsense/answer/12171612
https://support.google.com/adsense/answer/7679060
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
```

Expected: sources support `ads.txt` publication/crawling and GitHub Pages apex-domain DNS configuration.

### Task 2: Write the review draft

**Files:**
- Create: `source/_drafts/2026-07-29-why-google-adsense.md`

**Interfaces:**
- Consumes: the verified checklist from Task 1 and the approved article design.
- Produces: a complete, unpublished Hexo Markdown draft.

- [ ] **Step 1: Add Hexo frontmatter**

Write these fields:

```yaml
---
title: "为什么我要接入 Google AdSense：AI 时代，从会做产品到会获得用户"
author: "Zhi Li"
tags:
  - Google AdSense
  - AI
  - 个人成长
categories:
  - 思考
date: 2026-07-29 16:00:00
---
```

- [ ] **Step 2: Write the personal thesis**

The opening must state within three paragraphs:

```text
被动收入是直接动机，但不是全部。
AI 降低了功能实现门槛，却没有自动解决传播、获客、信任和运营。
接入 AdSense 是一次真实的小型商业化练习。
```

- [ ] **Step 3: Add only the essential practice evidence**

Cover these facts without expanding them into a tutorial:

```text
选择正文结束、评论区之前的唯一受控广告位。
审核阶段不加载广告脚本，不展示空广告。
www 下 ads.txt 可访问但根域名未解析，导致验证失败。
补齐 GitHub Pages 根域名 A 记录后，ads.txt 验证通过并提交审核。
当前尚未获批、展示广告或获得收入。
```

- [ ] **Step 4: End with the next capability loop**

Close with:

```text
持续创作 -> 主动传播 -> 触达用户 -> 观察反馈 -> 调整内容与产品
```

Explain that revenue is a lagging signal; the immediate goal is to practice distribution, acquisition, feedback, and operations.

### Task 3: Compress and verify the draft

**Files:**
- Modify: `source/_drafts/2026-07-29-why-google-adsense.md`

**Interfaces:**
- Consumes: the complete draft from Task 2.
- Produces: a concise review copy with honest status and valid source links.

- [ ] **Step 1: Check the length and configuration weight**

Run:

```bash
wc -m source/_drafts/2026-07-29-why-google-adsense.md
rg -n "^## " source/_drafts/2026-07-29-why-google-adsense.md
```

Expected: roughly 1,500–2,000 Chinese characters before references and no configuration-heavy section sequence.

- [ ] **Step 2: Check prohibited claims and sensitive fields**

Run:

```bash
if rg -n "已经盈利|开始赚钱|稳定收入|身份证|银行卡|税号|家庭住址|pub-[0-9]{8,}" \
  source/_drafts/2026-07-29-why-google-adsense.md; then
  exit 1
fi
```

Expected: exit status 0 with no matches.

- [ ] **Step 3: Check required current-state language**

Run:

```bash
rg -n "被动收入|获客|运营|审核|尚未|受控广告位" \
  source/_drafts/2026-07-29-why-google-adsense.md
```

Expected: every core theme appears in the draft.

- [ ] **Step 4: Review the diff**

Run:

```bash
git diff --check -- source/_drafts/2026-07-29-why-google-adsense.md
git status --short
```

Expected: only the new draft and pre-existing user-owned files are uncommitted; the draft has no whitespace errors.

- [ ] **Step 5: Hand off without publishing**

Provide a clickable path to the draft and summarize the main thesis, current-state boundary, and areas where the author can add more personal detail. Do not commit or publish the draft before the author's review.
