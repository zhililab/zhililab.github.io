---
title: 项目
date: 2026-08-02 00:00:00
description: Walker 正在维护的内容工程与个人网站实践。
layout: page
comments: false
lazyload: false
---

<section class="builder-projects" aria-labelledby="builder-projects-title">
  <header class="builder-projects__intro">
    <p class="builder-projects__eyebrow">Studio Casebook</p>
    <h1 id="builder-projects-title">Selected Builds</h1>
    <p>项目不是陈列品，是判断、实现与验证留下的证据。</p>
    <time datetime="2026-08-05">Updated 2026-08-05</time>
  </header>

  <article class="builder-project" id="devops-agent-control-plane">
    <div class="builder-project__story">
      <p class="builder-project__number">Build 01</p>
      <h2>DevOps Agent Control Plane</h2>
      <p class="builder-project__status">已部署 · 持续验证</p>
      <p class="builder-project__stack">Python · FastAPI · Next.js · TypeScript</p>
      <dl class="builder-project__evidence">
        <dt>动机</dt><dd>让 PR/CI 与事件处置中的 AI 决策具备策略门、人工确认、可回放记录与可审计证据。</dd>
        <dt>方法</dt><dd>用确定性编排、签名权限、队列生命周期、检查点和追加式历史账本约束代理工作流。</dd>
        <dt>结果</dt><dd>公开仓库已包含可部署前后端、工作流回放、证据导出、25 例固定评估集与人工反馈链路。</dd>
        <dt>当前边界</dt><dd>当前仍是单环境 MVP；耐久队列、多租户隔离和更完整的外部系统集成尚未完成。</dd>
      </dl>
      <nav class="builder-project__links" aria-label="DevOps Agent Control Plane 项目链接">
        <a href="https://github.com/zhililab/DevOps-Agent-Control-Plane" target="_blank" rel="noopener"><i class="iconfont icon-github-fill" aria-hidden="true"></i>GitHub 仓库</a>
        <a href="/2026/07/22/2026-07-22-agentic-devops-practice-report/"><i class="iconfont icon-articles" aria-hidden="true"></i>实践记录</a>
      </nav>
    </div>
    <div class="builder-project__media" data-project-carousel tabindex="0" aria-label="DevOps Agent Control Plane 截图">
      <figure data-project-slide>
        <picture>
          <source media="(max-width: 767px)" srcset="/assets/images/projects/devops-control-plane-home-960.webp">
          <img src="/assets/images/projects/devops-control-plane-home-1600.webp" width="1280" height="720" alt="DevOps Agent Control Plane 工作流首页">
        </picture>
      </figure>
      <figure data-project-slide hidden>
        <picture>
          <source media="(max-width: 767px)" srcset="/assets/images/projects/devops-control-plane-quality-960.webp">
          <img src="/assets/images/projects/devops-control-plane-quality-1600.webp" width="1280" height="720" alt="DevOps Agent Control Plane Quality Lab">
        </picture>
      </figure>
      <button type="button" data-carousel-prev aria-label="上一张截图"><i class="iconfont icon-arrowleft" aria-hidden="true"></i></button>
      <button type="button" data-carousel-next aria-label="下一张截图"><i class="iconfont icon-arrowright" aria-hidden="true"></i></button>
      <div class="builder-carousel__dots" aria-label="选择截图">
        <button type="button" data-carousel-dot data-slide-index="0" aria-label="显示首页截图"></button>
        <button type="button" data-carousel-dot data-slide-index="1" aria-label="显示 Quality Lab 截图"></button>
      </div>
    </div>
  </article>

  <article class="builder-project" id="tutorial-to-template">
    <div class="builder-project__story">
      <p class="builder-project__number">Build 02</p>
      <h2>Tutorial-to-Template</h2>
      <p class="builder-project__status">MVP · 公开仓库</p>
      <p class="builder-project__stack">TypeScript · CLI · JSON Schema</p>
      <dl class="builder-project__evidence">
        <dt>动机</dt><dd>把收藏的视频和演讲从被动阅读材料转成可以继续执行的项目输入。</dd>
        <dt>方法</dt><dd>先分类内容类型，再提取可验证事实，最后渲染项目模板、任务清单、Obsidian 笔记和 Agent 上下文。</dd>
        <dt>结果</dt><dd>公开仓库包含可运行 CLI、Karpathy 演讲回归样例、结构化模板与自动化测试。</dd>
        <dt>当前边界</dt><dd>当前输入仍依赖已获取的文字稿；多来源抓取、质量评分和批量处理尚未完成。</dd>
      </dl>
      <nav class="builder-project__links" aria-label="Tutorial-to-Template 项目链接"><a href="https://github.com/zhililab/tutorial-to-template" target="_blank" rel="noopener"><i class="iconfont icon-github-fill" aria-hidden="true"></i>GitHub 仓库</a></nav>
    </div>
    <div class="builder-project__media builder-trace" data-project-trace data-trace-kind="tutorial" role="group" aria-label="Tutorial-to-Template 执行流程">
      <div class="builder-trace__header">
        <p><span>Build 02</span> CLI pipeline</p>
        <span data-trace-status aria-hidden="true">Trace 01 / 06</span>
      </div>
      <ol class="builder-trace__stages">
        <li><button type="button" data-trace-stage data-stage-detail="读取 YouTube URL 或本地文字稿。"><span>Source</span><small>URL / transcript</small></button></li>
        <li><button type="button" data-trace-stage data-stage-detail="resolveTranscript 读取本地文件，或下载并保存文字稿。"><span>Resolve</span><small>transcript.ts</small></button></li>
        <li><button type="button" data-trace-stage data-stage-detail="classifySource 在五种来源类型中进行信号评分。"><span>Classify</span><small>5 source types</small></button></li>
        <li><button type="button" data-trace-stage data-stage-detail="extractTemplate 分离来源事实、缺失字段与推荐默认值。"><span>Extract</span><small>facts vs defaults</small></button></li>
        <li><button type="button" data-trace-stage data-stage-detail="validateTemplate 在写文件前验证结构化模板。"><span>Validate</span><small>JSON schema</small></button></li>
        <li><button type="button" data-trace-stage data-stage-detail="writeOutput 写出六类产物，并可复制 Obsidian 笔记。"><span>Write</span><small>output + vault</small></button></li>
      </ol>
      <div class="builder-trace__outputs" role="group" aria-label="生成产物">
        <span>PROJECT_TEMPLATE.md</span><span>TASKS.md</span><span>OBSIDIAN_NOTE.md</span>
        <span>AGENT_CONTEXT.md</span><span>TEMPLATE.json</span><span>README.md</span>
      </div>
      <p class="builder-trace__detail" data-trace-detail aria-live="polite">选择一个阶段查看对应代码职责。</p>
      <p class="builder-trace__rule">Unsupported source details → <code>not_specified</code></p>
    </div>
  </article>

  <article class="builder-project" id="kubernetes-production-field">
    <div class="builder-project__story">
      <p class="builder-project__number">Build 03</p>
      <h2>Kubernetes 生产现场</h2>
      <p class="builder-project__status">线上运行 · 生产工程学习站</p>
      <p class="builder-project__stack">Kubernetes · 发布治理 · 可观测性 · Runbook</p>
      <dl class="builder-project__evidence">
        <dt>动机</dt><dd>把 Kubernetes 知识从组件记忆，转成能在生产场景中提出判断、收集证据并执行可逆处置的能力。</dd>
        <dt>方法</dt><dd>围绕调度、网络、存储、发布与安全建立学习路径；用故障图谱、发布门禁、架构决策和证据链串起现场动作。</dd>
        <dt>结果</dt><dd>在线站点提供可展开的故障演练、发布控制步骤、决策卡片、证据链与本机进度保存的实战清单。</dd>
        <dt>最新工程落地</dt><dd>在学习站基础上，进一步完成 Jenkins Controller + Kubernetes 动态 Pod Agent 的真实云端部署，并通过 Pipeline 验证。</dd>
        <dt>当前边界</dt><dd>页面中的集群状态、故障对象和指标用于学习演练，不代表实时生产集群数据或操作指令。</dd>
      </dl>
      <nav class="builder-project__links" aria-label="Kubernetes 生产现场 项目链接"><a href="https://kubernetes-production-field.zhili1993.chatgpt.site/" target="_blank" rel="noopener">查看学习站</a><a href="https://kubernetes-production-field.zhili1993.chatgpt.site/#jenkins-case" target="_blank" rel="noopener">阅读 Jenkins 工程案例</a><a href="https://github.com/zhililab/kubernetes-production-field" target="_blank" rel="noopener">查看源码</a></nav>
    </div>
    <figure class="builder-project__media">
      <picture><source media="(max-width: 767px)" srcset="/assets/images/projects/kubernetes-production-field-960.webp"><img src="/assets/images/projects/kubernetes-production-field-1600.webp" width="1600" height="900" alt="Kubernetes 生产现场首页，展示集群状态与生产工程学习路径"></picture>
    </figure>
  </article>

  <article class="builder-project" id="zhililab-contentops">
    <div class="builder-project__story">
      <p class="builder-project__number">Build 04</p>
      <h2>ZHILILAB ContentOps</h2>
      <p class="builder-project__status">持续维护 · 线上运行</p>
      <p class="builder-project__stack">Hexo · Fluid · Node.js · GitHub Pages</p>
      <dl class="builder-project__evidence">
        <dt>动机</dt><dd>让内容创作、事实审核、构建验证和网站发布形成一条可复现且可回退的工作流。</dd>
        <dt>方法</dt><dd>以 Markdown 为内容源，结合静态 AI 摘要、结构检查、性能优化、评论服务和多层上线验证。</dd>
        <dt>结果</dt><dd>个人网站已持续发布技术文章，并具备构建测试、人工审核、静态摘要和线上路由验证。</dd>
        <dt>当前边界</dt><dd>内容判断和最终发布仍由人工确认；自动化不会替代事实责任和安全审查。</dd>
      </dl>
      <nav class="builder-project__links" aria-label="ZHILILAB ContentOps 项目链接"><a href="https://github.com/zhililab/zhililab.github.io" target="_blank" rel="noopener"><i class="iconfont icon-github-fill" aria-hidden="true"></i>GitHub 仓库</a><a href="/2023/05/28/%E7%BD%91%E7%AB%99%E6%9B%B4%E6%96%B0%E5%B0%8F%E8%AE%B0/"><i class="iconfont icon-articles" aria-hidden="true"></i>实践记录</a></nav>
    </div>
    <figure class="builder-project__media">
      <picture><source media="(max-width: 767px)" srcset="/assets/images/projects/zhililab-contentops-960.webp"><img src="/assets/images/projects/zhililab-contentops-1600.webp" width="1440" height="810" alt="ZHILILAB ContentOps 网站首页"></picture>
    </figure>
  </article>

  <article class="builder-project" id="python-learning-resources">
    <div class="builder-project__story">
      <p class="builder-project__number">Build 05</p>
      <h2>Python Learning Resources</h2>
      <p class="builder-project__status">自动更新 · 公开仓库</p>
      <p class="builder-project__stack">Python · GitHub Actions · Markdown</p>
      <dl class="builder-project__evidence">
        <dt>动机</dt><dd>把分散的 Python 学习资料整理成可以持续维护、快速浏览和复用的学习入口。</dd>
        <dt>方法</dt><dd>按教程、实践、最佳实践和开源项目组织内容，并通过自动化每日刷新仓库文档。</dd>
        <dt>结果</dt><dd>公开仓库形成持续更新的 Python 学习资源索引，并保留可审阅的 Markdown 记录。</dd>
        <dt>当前边界</dt><dd>自动收集结果仍需要人工抽查来源质量；它是学习索引，不替代完整课程或官方文档。</dd>
      </dl>
      <nav class="builder-project__links" aria-label="Python Learning Resources 项目链接"><a href="https://github.com/zhililab/Python-Learning-Resources" target="_blank" rel="noopener"><i class="iconfont icon-github-fill" aria-hidden="true"></i>GitHub 仓库</a></nav>
    </div>
    <div class="builder-project__media builder-trace" data-project-trace data-trace-kind="python-resources" role="group" aria-label="Python Learning Resources 执行流程">
      <div class="builder-trace__header">
        <p><span>Build 05</span> scheduled workflow</p>
        <span data-trace-status aria-hidden="true">Trace 01 / 06</span>
      </div>
      <ol class="builder-trace__stages">
        <li><button type="button" data-trace-stage data-stage-detail="GitHub Actions 每日 00:00 UTC 运行，也支持手动触发。"><span>Trigger</span><small>cron / manual</small></button></li>
        <li><button type="button" data-trace-stage data-stage-detail="工作流检出仓库、设置 Python，并安装 requests 与 BeautifulSoup。"><span>Prepare</span><small>checkout + deps</small></button></li>
        <li><button type="button" data-trace-stage data-stage-detail="fetch_trending_projects 请求并解析 GitHub Python Trending。"><span>Fetch</span><small>HTTP + parser</small></button></li>
        <li><button type="button" data-trace-stage data-stage-detail="generate_readme 合并固定学习内容、趋势项目和更新日期。"><span>Generate</span><small>README content</small></button></li>
        <li><button type="button" data-trace-stage data-stage-detail="脚本以 UTF-8 覆盖写入 README.md。"><span>Write</span><small>README.md</small></button></li>
        <li><button type="button" data-trace-stage data-stage-detail="git-auto-commit-action 提交并推送更新后的文档。"><span>Commit</span><small>auto-commit</small></button></li>
      </ol>
      <p class="builder-trace__fallback" data-trace-fallback><span>Fetch failed</span> → FALLBACK_PROJECTS → Generate</p>
      <div class="builder-trace__outputs" role="group" aria-label="README 内容">
        <span>Tutorials &amp; Courses</span><span>Best Practices</span><span>Trending Projects</span>
      </div>
      <p class="builder-trace__detail" data-trace-detail aria-live="polite">选择一个阶段查看对应代码职责。</p>
    </div>
  </article>

</section>
