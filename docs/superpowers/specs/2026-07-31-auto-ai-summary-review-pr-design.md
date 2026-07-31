# AI Summary 自动审核 PR 设计

## 1. 背景与目标

现有 `Generate draft AI summaries` 工作流已经在 `dev-optimize` 的文章发生
变化时自动触发，但生成结果只会直接提交到源码分支。它没有创建 Pull
Request、Issue 或 Review Request，因此即使产生新草稿，也不会形成明确的
人工审核待办。

本次变更目标是把摘要生成与人工审核连成一个可见、可追踪的闭环：

1. 新文章进入 `dev-optimize` 后自动生成摘要草稿。
2. 草稿写入独立自动化分支，不直接写回 `dev-optimize`。
3. 工作流自动创建面向 `dev-optimize` 的 Pull Request。
4. PR 自动请求 `zhililab` 审核，并提供摘要审核清单。
5. 只有人工将摘要状态改为 `approved` 并合并后，摘要才具备发布资格。
6. 工作流不部署 GitHub Pages，不改变现有静态发布边界。

## 2. 已选方案

采用“每次有新草稿时创建审核 PR”的方案。

未采用的方案：

- 直接提交草稿后创建 Issue：摘要变更和审核讨论分离，容易遗漏状态修改。
- 只写 GitHub Actions Job Summary：只能在运行详情中看到，不会形成可靠的
  Review Request。

仓库当前允许 GitHub Actions 写入内容、创建 Pull Request，并允许
`zhililab` 作为仓库管理员处理审核请求。

## 3. 工作流

```text
dev-optimize 上文章发生变化
        ↓
扫描新增或过期摘要
        ↓
Gemini 生成 status=draft 的 JSON
        ↓
是否存在摘要文件差异？
   ├─ 否 → 成功结束，不创建空 PR
   └─ 是
        ↓
创建 ai-summary/run-<run_id> 分支
        ↓
只提交 source/_data/ai-summaries/**
        ↓
创建 PR 到 dev-optimize
        ↓
请求 zhililab Review
        ↓
人工核对并改为 status=approved
        ↓
人工合并；后续仍走现有构建和发布流程
```

为当前的周报文章移除 `ai_summary: false` 后，文章变更会触发上述流程。线上
页面在摘要 PR 审核、合并和后续部署前保持不变。

## 4. 权限与安全边界

顶层权限继续保持 `contents: read`。只有创建草稿 PR 的 Job 获得：

- `contents: write`：创建自动化分支并提交摘要 JSON。
- `pull-requests: write`：创建 PR 和请求 Reviewer。

`GEMINI_API_KEY` 仍只暴露给生成步骤，不进入提交、PR 正文或日志。PR Job 不
安装依赖、不调用 Gemini，也不能修改文章 Markdown、主题、脚本或部署配置。

提交前使用明确的路径限制，只允许：

```text
source/_data/ai-summaries/**
```

如果暂存区出现其他文件，Job 必须失败，不能扩大提交范围。

## 5. 分支、PR 与防循环策略

- 自动分支命名为 `ai-summary/run-${{ github.run_id }}`，避免并发运行覆盖。
- PR 基础分支固定为 `dev-optimize`。
- PR 标题包含 `AI Summary drafts require review`。
- PR 正文链接到来源 Workflow Run，并列出审核清单。
- Reviewer 固定为 `zhililab`。
- 如果没有摘要差异，不推送分支、不创建 PR。
- 自动化分支的 push 不匹配 `dev-optimize` 触发条件。
- 摘要 PR 合并只改变 `source/_data/ai-summaries/**`，不匹配当前
  `source/_posts/**` 路径条件，因此不会再次生成摘要。
- 保留 `workflow_dispatch`，便于故障恢复和手工重跑。

## 6. 审核体验

PR 正文提供以下清单：

- 摘要是否准确表达文章核心观点。
- 是否保留原文中的证据边界和限定语。
- 是否引入正文之外的事实、数字或因果关系。
- 是否包含敏感信息或未发布内容。
- `general`、`bullets` 和 `explainer` 是否各自满足阅读目的。
- 确认后是否已把 `status` 从 `draft` 改为 `approved`。

GitHub 会产生 Review Request 站内通知；邮件或移动端推送是否出现取决于用户
自己的 GitHub Notifications 设置。

## 7. 失败处理

- Gemini 生成失败：工作流失败，不创建 PR，不修改现有摘要。
- 没有摘要变化：工作流成功结束，并在 Job Summary 中说明无需审核。
- 分支推送失败：工作流失败，artifact 保留，可下载恢复。
- PR 创建或 Reviewer 请求失败：工作流失败，并输出不含正文和密钥的诊断。
- 同一提交重跑：使用新的 `run_id` 分支；如果目标摘要已存在且有效，则不会
  产生差异或重复 PR。

## 8. 验证标准

自动化测试必须验证：

1. `dev-optimize` 的文章变更仍会自动触发工作流。
2. 无差异时不会推送分支或创建 PR。
3. 有差异时只提交摘要目录。
4. PR 指向 `dev-optimize`，Reviewer 为 `zhililab`。
5. 生成 Job 仍为只读，Gemini Secret 只出现一次。
6. workflow 不包含 Hexo 或 Pages 部署命令。
7. 自动化分支和摘要合并不会形成生成循环。
8. 当前周报文章恢复默认摘要要求，其他文章正文与资源不变。

实施完成后先运行聚焦 workflow 测试，再运行完整测试和静态构建。只有用户另行
确认发布时，才推送源码或部署 Pages。
