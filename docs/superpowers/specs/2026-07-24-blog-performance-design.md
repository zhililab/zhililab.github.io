# Hexo 博客性能极致优化设计

## 目标

在不改变 Hexo、Fluid 与 GitHub Pages 架构的前提下，让博文页在中端手机和普通 4G 网络下达到：

- 首屏 LCP 不高于 2.0 秒；
- CLS 不高于 0.1；
- HTML 首包继续保持 0.6 秒以内；
- 正文图片在进入预加载视口后约 300 毫秒内完成显示；
- 高清技术图仍可打开原图查看。

桌面宽带同时验收，但不能代替移动 4G 验收。

## 当前基线

- 三篇代表文章的线上 HTML 总耗时约 0.44–0.56 秒，源站响应不是主要瓶颈。
- 博文页包含约 23 个 CSS/JS 引用，其中约 11 个来自第三方域名。
- Kubernetes 时序图为 4558×3602、约 834 KB 的 PNG，页面没有响应式尺寸。
- 当前客户端增强仅设置 `decoding="async"`；没有 `srcset`、固有尺寸、首图优先级或原生懒加载策略。
- Fluid 自带懒加载通过临时 `srcset` 占位图实现，会与标准响应式图片的 `srcset` 语义冲突。

## 方案对比

### A. 轻量调参

增加 `preconnect`、`defer` 与原生懒加载。改动小，但不能消除第三方阻塞样式，也不能减少大图字节量，无法稳定保证移动 4G 两秒目标。

### B. 构建期资源优化（采用）

在 Hexo 构建阶段生成响应式 WebP，把阻塞资源改为同源，按页面能力延迟非关键脚本，并为首屏横幅设置高优先级。对首次访问和重复访问都有效，且不改变部署架构。

### C. Service Worker 预缓存

重复访问收益大，但首次访问没有收益；当前自定义域名 HTTPS 状态也会限制 Service Worker。留作后续可选项，不纳入本轮关键路径。

## 设计

### 1. 响应式图片流水线

新增 Hexo 构建插件，处理博文正文中的本地位图：

- 从 `source/assets/images/` 读取原图；
- 使用 Sharp 生成不超过原图宽度的 640、960、1440 像素 WebP；
- 通过 Hexo route 输出到 `/assets/images/optimized/`，不污染内容源目录；
- 将正文 `<img>` 包装为 `<picture>`，写入 WebP `srcset` 和准确 `sizes`；
- 原始图片继续作为 `<img src>` 回退和放大查看目标；
- 写入准确 `width`、`height`、`loading="lazy"`、`decoding="async"` 和 `fetchpriority="low"`；
- 移除 Fluid 旧式 `srcset="/img/loading.gif"` 与 `lazyload` 属性，避免覆盖响应式图片。

SVG、GIF、远程图片和小于最小阈值的图片不转换，只补安全的加载属性。

### 2. 首屏关键路径

- 从博文横幅样式中提取本地 `banner_img`，在 `<head>` 添加唯一的 `preload as="image"`；
- 横幅资源设置高优先级，正文图保持低优先级；
- 保持现有 Fluid 布局和视觉，不引入新的首屏占位动画；
- 用固有尺寸和 `aspect-ratio` 消除图片加载后的布局跳动。

### 3. 主题依赖同源化与延迟加载

- 把 Bootstrap、GitHub Markdown、Hint、Fancybox 等阻塞样式映射为同源静态资源；
- 把 jQuery、Bootstrap、Tocbot、Anchor、Clipboard、Fancybox 映射为同源资源；
- 删除博文页的 NProgress 资源和初始化代码，因为它在页尾加载，不改善真实加载感知；
- 将不蒜子统计延迟到 `load` 后的浏览器空闲时间，不参与首屏和 DOMContentLoaded；
- 保留目录、复制按钮、图片放大、搜索与动态宠物功能。

资源版本固定在 `package-lock.json`，构建插件从 `node_modules` 暴露精确文件，避免运行时依赖公共 CDN。

### 4. 缓存与失败策略

- 生成文件名包含尺寸，原图修改后由 GitHub Pages 内容校验与浏览器缓存重新获取；
- 同一原图在一次构建中只处理一次；
- Sharp 处理失败时构建直接失败，避免发布引用不存在的派生图；
- 不对用户现有内容文件做就地覆盖。

### 5. 验收

本地：

- 纯函数测试验证 HTML 重写、资源去重和异常边界；
- 渲染测试验证代表文章的 `<picture>`、固有尺寸、横幅预加载和无阻塞外部样式；
- 全量 Hexo 构建与全部 Node 测试通过；
- `git diff --check` 通过。

线上：

- `dev-optimize` 源分支与 Pages `master` 部署提交分别核对；
- 三篇代表文章和派生图片均为 HTTP 200；
- 移动 4G 浏览器采集 LCP、CLS、DOMContentLoaded、总传输量与图片加载状态；
- Kubernetes 大图实际下载响应式 WebP，原始 PNG 仍可打开；
- 页面功能与控制台无新增错误。

## 非目标

- 不迁移到其他静态站点框架或托管商；
- 不在本轮引入 Service Worker；
- 不改写文章正文；
- 不降低或删除高清原始技术图；
- 不把现有无关工作区修改纳入提交。
