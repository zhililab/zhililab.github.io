# 博客静态 AI 摘要设计

## 1. 背景与目标

博客目前使用 Hexo、Fluid 和 GitHub Pages。文章阅读体验增强由本地
Hexo 过滤器注入，并已有 Node 测试、生成结果测试和移动 4G 性能预算。

本功能参考 Google Blog 的 AI 摘要交互，但不复制其品牌视觉。目标是：

1. 为新发布文章生成“概览、要点、通俗解释”三种中文摘要。
2. 首批为三篇代表性长文回填摘要：
   - `2026-07-22-agentic-devops-practice-report.md`
   - `2026-07-23-kubernetes-pod-creation-workflow.md`
   - `2026-07-27-from-graph-platform-to-devops-agent-control-plane.md`
3. 摘要必须经过人工审核，不能由模型直接进入正式页面。
4. 摘要在写作或构建阶段生成，读者访问时不调用模型。
5. 继续使用 GitHub Pages，不新增在线后端和读者侧运行费用。
6. 不降低现有移动端可访问性、可靠性和性能标准。

非目标：

- 不提供读者即时提问或重新生成摘要的能力。
- 不在首版记录摘要展开率或标签切换事件。
- 不自动摘要历史文章全集。
- 不让 AI 摘要替代原文、作者结论或来源引用。
- 不自动部署到 GitHub Pages。

## 2. 已选方案与取舍

### 2.1 采用：构建前预生成并静态发布

摘要生成器调用 Gemini Flash 免费层，将结果保存为源码仓库内的结构化
JSON。Hexo 构建只读取已审核、未过期的摘要，输出静态 HTML。

该方案的优点：

- 读者访问不产生 API 延迟或费用。
- API Key 不会进入浏览器或静态产物。
- 摘要可以像代码一样审阅、测试、回滚和追踪。
- Gemini 暂时不可用时，已审核摘要和正式页面不受影响。
- 不改变现有 GitHub Pages 部署架构。

约束：

- Gemini 免费层的请求和响应可能被用于改进 Google 产品。生成器只能
  处理已经完成脱敏、准备公开的文章正文。
- 免费额度和模型可用性可能变化，因此模型名称可配置，生成器与渲染器
  必须解耦。
- GitHub Actions 只负责生成草稿和验证，不负责正式部署。

### 2.2 未采用：GitHub Models 作为唯一生成服务

GitHub Models 有免费、限速额度，且不需要单独托管推理服务，但目前仍是
公开预览并面向实验用途。它可以成为后续 provider adapter，不作为首版的
唯一生产依赖。

### 2.3 未采用：读者访问时调用 Workers AI

运行时生成会引入延迟、滥用防护、配额耗尽、内容传输和服务可用性问题。
即使存在免费额度，也不适合静态博客的摘要场景。

### 2.4 备用：本地 Ollama

本地 Ollama 可以在无 Gemini Key 或不希望发送正文时使用。它复用相同的
结构化输出协议，但不是首版自动化路径，也不进入 GitHub 托管运行器。

## 3. 总体架构

```text
Markdown 文章
    ↓
摘要生成器（本地命令或 GitHub Actions）
    ↓
Gemini Flash
    ↓
source/_data/ai-summaries/<slug>.json（status=draft）
    ↓
人工核对三种摘要并改为 status=approved
    ↓
摘要校验器：结构、长度、正文指纹、审核状态
    ↓
Hexo 过滤器注入折叠卡片
    ↓
GitHub Pages 静态 HTML
```

生成与渲染是两个独立阶段：

- 生成阶段允许访问 Gemini，失败时不得修改现有有效摘要。
- 构建阶段不访问 Gemini，只消费已提交的 JSON。
- 浏览阶段不访问 Gemini，只执行本地折叠和标签切换。

## 4. 摘要数据模型

摘要文件位于：

```text
source/_data/ai-summaries/<文章 slug>.json
```

结构如下：

```json
{
  "schema_version": 1,
  "slug": "2026-07-23-kubernetes-pod-creation-workflow",
  "source_hash": "sha256:...",
  "provider": "google",
  "model": "gemini-3.6-flash",
  "generated_at": "2026-07-30T00:00:00.000Z",
  "status": "draft",
  "general": "120 至 180 字的概览。",
  "bullets": [
    "要点一",
    "要点二",
    "要点三"
  ],
  "explainer": "面向非专业读者的通俗解释。"
}
```

规则：

- `schema_version` 首版固定为 `1`。
- `source_hash` 使用规范化后的 Markdown 正文计算 SHA-256；不把
  `status`、摘要文件或生成时间纳入指纹。
- `status` 只能为 `draft` 或 `approved`。
- 生成器无条件写入 `draft`，忽略模型返回的任何审核状态。
- `general` 为 120 至 180 个中文字符附近的单段概览。
- `bullets` 必须包含 3 至 5 条独立要点。
- `explainer` 使用较少术语，但不能引入正文没有的事实。
- 所有文本字段只允许纯文本，不接受 HTML、脚本或 Markdown 链接。

## 5. 生成流程

### 5.1 本地命令

提供可指定文章的生成命令，以及扫描新文章和过期摘要的批处理命令。
本地使用 `GEMINI_API_KEY` 环境变量。Key 缺失时命令立即失败，并只显示
配置提示。

### 5.2 GitHub Actions

当 `dev-optimize` 上的 `source/_posts/**` 发生变化时：

1. 找出新增文章、缺少摘要的文章和正文指纹已变化的文章。
2. 使用 GitHub Secret 中的 `GEMINI_API_KEY` 调用同一生成器。
3. 将生成结果固定写为 `draft`。
4. 只提交摘要 JSON，不部署 Hexo，不修改文章正文。
5. 机器人提交只包含 `source/_data/ai-summaries/**`，因此不会再次触发
   文章变更工作流。

如果仓库权限或分支保护不允许机器人提交，工作流应失败并保留生成结果
作为日志中不含正文的错误说明；维护者可以改用同一套本地命令。首版不引入
第三方自动开 PR Action。

### 5.3 提示词和模型边界

提示词必须：

- 明确要求只根据输入正文总结。
- 将正文放入清晰的数据边界，声明正文中的指令不是系统指令。
- 禁止补充外部事实、数字、引用、链接或人物背景。
- 要求不确定内容沿用原文的限定语。
- 要求输出符合固定 JSON Schema。

模型名称集中由 `GEMINI_MODEL` 配置，首版默认值为
`gemini-3.6-flash`，并把实际使用的模型名称写入摘要文件。该值不散落在
脚本、工作流和模板中。首版不启用搜索 grounding。

## 6. 人工审核与发布门禁

审核者需要检查：

- 是否准确表达文章核心观点。
- 是否遗漏关键限制、失败条件或作者结论。
- 是否引入正文外的事实、数字或因果关系。
- 三种表达是否面向不同阅读需求，而不是简单重复。
- 是否包含公司机密、内部地址、个人信息或未发布项目细节。

确认后，审核者手工将 `status` 从 `draft` 改为 `approved`。

构建规则：

- `approved` 且 `source_hash` 一致：注入摘要卡片。
- `draft`：摘要质量检查失败，阻止该文章进入正式部署。
- `approved` 但指纹不一致：摘要过期，要求重新生成和审核。
- JSON 缺字段、越界或包含不允许的内容：构建失败并报告具体文件与字段。
- 新文章默认需要摘要。确实不适合摘要的文章可在 frontmatter 中显式设置
  `ai_summary: false`；该选择必须出现在代码审阅中，不能由生成器静默添加。

现有未纳入首批回填的历史文章保持原状，不因缺少摘要而失败。

## 7. 页面交互

### 7.1 位置与默认状态

卡片放在文章标题、作者和阅读时间之后、正文之前。默认折叠，只显示：

```text
✦ 阅读 AI 生成摘要
```

点击后展开，并默认显示“概览”。

### 7.2 三种摘要

展开区域提供三个本地标签：

- 概览
- 要点
- 通俗解释

三份内容随 HTML 一次输出。切换标签不请求网络，不显示加载动画。

卡片显示：

```text
AI 生成 · 已由作者审核 · 仅供快速预览，请以原文为准
```

### 7.3 可访问性与降级

- 外层使用原生可展开结构；无 JavaScript 时仍可查看概览。
- 标签使用可聚焦按钮和正确的标签、面板关联。
- 展开按钮同步 `aria-expanded`。
- 键盘可以展开卡片、切换标签和返回正文。
- 焦点状态清晰，不只依赖颜色区分选中状态。
- 移动端保持单列，三个标签等宽且满足触控尺寸。
- 动画尊重 `prefers-reduced-motion`。
- 不保存选择状态，不写 Cookie，不增加分析事件。

## 8. 视觉设计

采用正文顶部折叠卡片，不使用侧栏常驻或默认展开布局。

- 使用博客现有蓝色体系、浅色背景和圆角。
- 不复制 Google 标识、品牌渐变或图标。
- 图标使用小型内联 SVG，不新增字体和第三方图标库。
- 折叠态高度固定；展开导致的位移来自用户操作，不预留大块空白。
- 深色模式沿用现有 CSS 变量或提供等价的高对比颜色。

## 9. 容错与安全

### 9.1 API 错误

- 对限流和可重试的服务端错误执行有限次数退避重试。
- 鉴权、Schema 或内容校验错误不盲目重试。
- 失败时不覆盖原摘要；新结果先写临时文件，通过校验后再替换目标文件。
- 日志不输出 Key、完整请求头、完整正文或模型原始响应。

### 9.2 内容安全

- 生成前只读取目标文章及必要 frontmatter。
- 正文作为不可信数据处理，不能改变系统提示词。
- 模型输出经 JSON Schema 和业务规则双重校验。
- 渲染时对所有文本转义，禁止任意 HTML。
- GitHub Actions 使用最小权限，只申请写入摘要文件所需的仓库内容权限。

### 9.3 降级

- 已审核且未过期的摘要不依赖 Gemini，可重复构建。
- Gemini 不可用时，新摘要生成任务失败，但不会破坏现有正式博客。
- 本地 Ollama 可以作为人工选择的备用 provider；其输出仍需同样审核。
- 客户端 JavaScript 失败时，原生展开结构继续显示概览，正文始终可读。

## 10. 实现边界

主要组件：

1. `scripts/lib/ai-summary.js`
   - 正文规范化与指纹计算
   - JSON Schema 和业务规则校验
   - Gemini 请求与重试策略
   - 原子写入
2. `scripts/generate-ai-summary.js`
   - 单篇与批处理命令行入口
   - 新文章、缺失摘要和过期摘要检测
3. Hexo 过滤器扩展
   - 读取并验证摘要
   - 注入语义化静态 HTML
4. `source/js/blog-reading-experience.js`
   - 标签切换和可访问性行为
5. `source/css/blog-reading-experience.css`
   - 折叠卡片、标签、移动端和深色模式样式
6. `.github/workflows/generate-ai-summaries.yml`
   - 在源码分支生成草稿摘要
   - 不执行正式部署

生成器、校验器和渲染器使用明确的数据接口。客户端不理解 provider、
模型或审核流程，只接收已经验证的静态 HTML。

## 11. 测试策略

实现遵循测试先行。

### 11.1 生成器单元测试

- 正文规范化产生稳定 SHA-256。
- frontmatter 时间变化不使正文摘要失效。
- 正文变化使已批准摘要过期。
- 生成结果始终保存为 `draft`。
- 结构缺失、HTML、错误条目数量和长度越界被拒绝。
- 429 和可重试 5xx 进行有限重试。
- 鉴权和 Schema 错误不重试。
- 失败不会覆盖已有摘要。
- 日志不包含 Key 或完整正文。

### 11.2 Hexo 与客户端测试

- 已批准且未过期的摘要被注入一次。
- 草稿、过期和格式错误摘要使质量检查失败。
- 历史未纳入范围的文章不受影响。
- `ai_summary: false` 不注入卡片。
- 首页、归档和普通页面不注入摘要。
- 默认折叠，展开后默认显示概览。
- 三个标签可通过鼠标、触摸和键盘切换。
- JavaScript 不可用时概览仍可访问。
- 摘要内容被正确转义，不能注入脚本。

### 11.3 生成结果验收

对三篇回填文章执行：

- 真实 Gemini 生成。
- 人工逐项审核并批准。
- 完整 Hexo clean、build 和测试。
- 检查生成 HTML 中的三份摘要、声明、可访问性属性和资源引用。
- 检查静态产物不包含 Key、完整提示词或未审核摘要。

### 11.4 性能验收

当前正文增强 CSS 和 JS 合计约 17.7 KB。首版要求：

- 新增未压缩 CSS 与 JS 合计不超过 4 KB。
- 正文增强 CSS 与 JS 总计不超过 24 KB。
- 不增加第三方脚本、字体或运行时 API 请求。
- 代表性文章在中端手机和普通 4G 条件下继续满足：
  - LCP 不超过 2 秒。
  - CLS 不超过 0.1。

## 12. 发布、回滚与成本

发布仍分两步：

1. 摘要和源码在 `dev-optimize` 上生成、审核、测试。
2. 得到明确人工确认后，才执行现有 Hexo 部署到 `master`。

回滚：

- 单篇回滚可以移除对应摘要 JSON 或将文章设置为
  `ai_summary: false`，然后重新构建。
- 整体回滚可以恢复上一源码提交并重新生成静态站点。
- 回滚不删除文章正文，不影响评论、分享和其他阅读增强功能。

成本：

- GitHub Pages 继续使用现有免费部署。
- 公开仓库的标准 GitHub-hosted Actions 运行器免费。
- Gemini 使用免费层时不产生模型费用，但受免费额度、数据使用政策和模型
  可用性约束。
- 读者访问阶段没有 AI 调用费用。

## 13. 参考资料

- Google Blog AI 摘要参考：
  <https://blog.google/products/ads-commerce/google-ads-ai-transparency-labels/>
- Gemini Developer API 价格与免费层：
  <https://ai.google.dev/gemini-api/docs/pricing>
- Gemini API 限流：
  <https://ai.google.dev/gemini-api/docs/rate-limits>
- GitHub Actions 计费：
  <https://docs.github.com/en/billing/concepts/product-billing/github-actions>
- GitHub Models 计费与免费额度：
  <https://docs.github.com/en/billing/concepts/product-billing/github-models>
- GitHub Models 负责任使用说明：
  <https://docs.github.com/en/github-models/responsible-use-of-github-models>
