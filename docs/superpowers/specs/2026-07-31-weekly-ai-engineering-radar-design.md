# 本周 AI 工程雷达文章发布设计

## 目标

将用户提供的 2026-07-31 AI 工程周报整理为一篇 Hexo 博客文章，并按现有 `zhililab-blog` 发布流程上线。

文章保持原始观点、数据、证据边界和 EDA 工程语境，重点表达三个工程信号：

1. Agent 的价值正从生成代码转向迁移、验证和维护复杂工程。
2. 正确运行只是下限，性能、成本、安全和长期可维护性必须进入验收标准。
3. RAG 与 Agent 正回归可靠检索、可信来源、可观测轨迹和外部验证器。

## 交付范围

新增以下文件：

- `source/_posts/2026-07-31-weekly-ai-engineering-radar.md`
- `source/assets/images/cover/weekly-ai-engineering-radar.svg`

文章 Front Matter：

```yaml
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
date: 2026-07-31
```

## 内容结构

正文采用“来源忠实的周报型文章”：

1. 开篇列出三个稳定工程信号。
2. 使用 `<!-- more -->` 控制首页摘要长度。
3. 依次呈现六篇本周精选，每篇包含发布日期、来源、核心发现、证据边界和 EDA/平台工程启发。
4. 汇总本周 Top 3。
5. 给出一个可在 CMake/UPR Install 场景执行的 Agent A/B 小实验。
6. 以 AI Engineering Control Plane 作为长期平台能力结论。
7. 文末集中列出六篇材料的原始来源。

## 编辑边界

- 保留用户提供的核心判断、数值、证据边界、实验建议和 Control Plane 结论。
- 只做 Markdown 层级、标点、列表和代码块等博客化整理。
- 删除复制过程中产生的 `⁠￼` 等无意义占位符，并替换为可访问的原始来源链接。
- 发布前核对每篇材料的标题、机构、日期、关键数字和原始链接。
- 如果原始来源无法支持某项精确表述，弱化或明确标注不确定性，不扩写未经来源支持的结论。
- 不使用长篇受版权保护的原文引用。

## 封面

新增一张不依赖外部字体或图片资源的 SVG 封面：

- 深色技术背景和克制的雷达/节点元素。
- 主标题突出 `AI ENGINEERING RADAR`。
- 副标题表达 `Agents · Retrieval · Verification`。
- 保持桌面和移动端裁切后仍能辨识标题。

## 验证与发布

1. 确认 Fluid 主题目录和依赖可用。
2. 执行 `npm run clean`、`npm run build` 和 `npm test`。
3. 检查生成的文章 HTML、标题、作者、分类、标签、六个来源链接和封面资源。
4. 仅暂存并提交本篇文章和封面；设计文档保留为此前独立提交。
5. 不纳入现有 `HelloWorld_Cover.jpg`、`.playwright-cli/`、`.superpowers/` 等无关改动。
6. 推送源分支 `dev-optimize`。
7. 使用已验证静态产物部署 GitHub Pages `master`。
8. 独立验证源分支提交、Pages 提交、正式文章 URL、封面 URL 和线上关键内容。
9. 如果 Pages 或正式域名短暂未同步，等待传播后复验，不把构建成功等同于线上发布成功。

## 成功标准

- Hexo 构建和仓库测试全部通过。
- 文章与封面进入限定范围的源提交，其他本地改动未被纳入。
- `dev-optimize` 和 Pages `master` 均更新到对应发布结果。
- 正式文章与封面返回 HTTP 200。
- 线上页面显示正确标题、作者 `Codex`、分类 `技术`、标签 `Reports / TechRadar / AI`。
- 六篇材料均有可访问的原始来源链接，正文不存在复制残留占位符。
