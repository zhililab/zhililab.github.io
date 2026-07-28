# 博客评论与划线分享设计

## 目标

在不改变 Hexo + Fluid + GitHub Pages 架构的前提下，为博客正文增加：

1. 支持免登录发表评论、后台审核和基础反垃圾的评论区。
2. 选中正文后出现轻量操作条，可一键系统分享或复制带引用的文章链接。
3. 评论和分享功能不进入首屏关键加载路径，不破坏现有移动 4G 性能预算。

## 评论方案

### 架构

- 评论前端使用 Fluid 原生支持的 Waline 组件。
- Waline 服务部署到现有服务器 `1.117.63.81`，使用独立目录
  `/root/services/zhililab-comments`，不进入 `/root/blog` 或
  `personal-agent` 的 Compose 项目。
- `comments.zhililab.cn` 指向该服务器。
- 独立 Docker Compose 运行两个容器：
  - Caddy：只占用当前空闲的 `443` 端口，负责 TLS-ALPN 证书申请、
    HTTPS 和反向代理。
  - Waline：仅在 Compose 内部网络暴露 `8360`，不直接映射公网端口。
- Caddy 和 Waline 使用独立持久化卷。Waline 数据存入 SQLite，
  数据目录为 `/root/services/zhililab-comments/data`。
- 现有占用 80 端口的 `personal-agent-gateway` 不修改、不重启。

### 安全与匿名策略

- 不设置 `LOGIN=force`，访客只需填写昵称即可评论。
- 开启 `COMMENT_AUDIT=true`，新评论经管理员审核后才公开。
- 保持每个 IP 60 秒内最多发布一条评论。
- `SECURE_DOMAINS` 仅允许 `www.zhililab.cn` 和
  `comments.zhililab.cn`。
- 隐藏评论者的 User-Agent 和地域信息。
- Waline 的 `JWT_TOKEN` 随机生成，只写入服务器 `.env`；
  `.env` 权限设为 `600`，不提交 Git、不回显到聊天或日志。
- SQLite 数据和 Caddy 证书目录纳入服务器侧持久化，不随容器删除。
- 部署后由站长访问 `/ui/register` 完成首次管理员注册。Codex 不创建、
  保存或代填管理员密码。

### Hexo/Fluid 接入

- 在根 `_config.yml` 的 `theme_config` 中启用：
  - `post.comments.enable: true`
  - `post.comments.type: waline`
  - `waline.serverURL: https://comments.zhililab.cn`
- 评论线程以 `window.location.pathname` 为唯一键，避免查询参数产生重复线程。
- 沿用 Fluid 评论懒加载机制，评论脚本仅在评论区接近视口时加载。
- 已显式设置 `comments: false` 的历史文章继续保持关闭；其他正文默认开启。
- 评论区显示“评论提交后需审核”的中文提示。

## 划线分享方案

### 交互

- 仅监听 `.markdown-body` 内的文本选择，代码复制按钮、导航、目录、
  评论区和页面其他区域不触发。
- 桌面端在选择结束后显示靠近选区的浮动操作条。
- 移动端在选区附近显示相同操作条，并保证按钮尺寸满足触控需要。
- 操作条包含：
  - `分享`：优先调用 Web Share API。
  - `复制引用`：复制“选中文本 + 文章标题 + 深链接”。
- 深链接使用浏览器 Text Fragments：
  `文章地址#:~:text=<编码后的选中文本>`。支持该标准的浏览器打开后会自动
  高亮原文；不支持的浏览器仍能正常打开文章。
- 选区为空、仅空白、超出正文、用户按 Escape、滚动或点击页面其他位置时，
  操作条关闭。
- 分享文本最长取 280 个字符；不修改正文 DOM，不创建永久批注。

### 降级与错误处理

- `navigator.share` 不可用时，“分享”自动退化为复制引用。
- 优先使用 Clipboard API；不可用时使用受控的临时文本框复制。
- 用户取消系统分享不显示错误。
- 复制成功显示短暂中文反馈，失败时提示用户手动复制。
- 不加载第三方分享 SDK，不发送选中文本到评论服务或其他统计服务。

## 性能约束

- 分享功能只增加现有本地 CSS/JS，不增加首屏网络请求。
- 评论脚本保持懒加载，不参与 LCP。
- 新增本地 CSS + JS 的未压缩增量目标不超过 12 KB。
- 移动 4G 验收继续要求代表性文章 LCP 不超过 2 秒、CLS 不超过 0.1。

## 测试与验收

### 自动化测试

- Hexo 生成结果包含 Waline 评论容器、服务地址和审核提示。
- 首页不注入评论或划线分享组件。
- 正文选择边界、Text Fragment 链接、Web Share、复制降级、关闭行为都有单元测试。
- 现有代码块、宽表格、响应式图片、宠物和性能测试全部继续通过。
- 构建产物不包含 JWT、数据库路径或其他服务端密钥。

### 服务器验收

- DNS 权威解析返回 `1.117.63.81`。
- `https://comments.zhililab.cn` 使用可信证书并返回 Waline 服务。
- Waline 容器不映射公网 `8360`，SQLite 文件位于持久化目录。
- 匿名评论可以提交但默认不公开。
- 管理员审核后评论可见。

### 正式博客验收

- 代表性文章评论区可见且按接近视口时加载。
- 桌面和移动视口选择正文后都能显示分享工具条。
- 系统分享或复制引用包含选中文本、标题和 Text Fragment 深链接。
- 正式文章、评论 API、CSS 和 JS 均返回成功状态。
- 使用真实浏览器确认无控制台错误，并复测移动 4G 性能预算。

## 发布与回滚

- 博客源码提交到 `dev-optimize`，Hexo 静态产物部署到 `master`。
- Waline Compose 文件保存在服务器独立目录。
- 回滚博客功能：恢复上一源码提交并重新部署 Hexo。
- 回滚评论后端：停止独立 Waline Compose，不删除 `data` 与 Caddy 持久化目录。
- 任一阶段失败时不重复覆盖数据；保留 SQLite 和证书卷并报告精确阻塞点。
