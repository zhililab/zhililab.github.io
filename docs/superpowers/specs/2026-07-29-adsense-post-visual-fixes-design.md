# Google AdSense 文章封面与正文图片展示优化设计

日期：2026-07-29
状态：待用户审阅

## 目标

修复《为什么我要接入 Google AdSense：AI 时代，从会做产品到会获得用户》的两个视觉问题：

1. 首页文章卡片和详情页没有专属封面。
2. 正文响应式图片继承了 Fluid 的裁剪规则，不能稳定按原始宽高比完整展示。

正文内容保持不变。本次只增加封面、补充 frontmatter 图片字段，并修复全站博文正文图片的默认展示规则。

## 根因

### 封面

目标文章 frontmatter 未配置 `index_img` 和 `banner_img`。Fluid 因此使用默认横幅背景，首页卡片没有文章专属视觉。

### 正文图片

Fluid 的通用文章样式为 `.page-content img, .post-content img` 设置了 `object-fit: cover`。博客性能管线又把本地正文图片改写为 `<picture><source><img></picture>`；Fluid 原本针对 `p > img` 的完整图片样式没有覆盖 `p > picture > img`。两个规则叠加后，响应式图片可能继承裁剪行为，且 `<picture>` 的间距、居中和尺寸约束不稳定。

## 封面设计

创建一张 `1920×818` 的横向插画，与现有 Fluid 横幅比例一致。

视觉要求：

- 深蓝色技术博客背景。
- 使用少量蓝、红、黄、绿作为 Google 产品色彩提示，但不直接复制 Google 或 AdSense 标志。
- 从左到右表达“内容创作 → 主动传播 → 用户触达 → 反馈与增长”。
- 主体集中在画面中部安全区域，兼容首页卡片的 `object-fit: cover` 裁切。
- 不使用 AdSense 后台截图、账号信息或大段文字。
- 不在图片中重复完整文章标题，避免与页面标题叠加。
- 画面克制、清晰，适合技术与个人成长主题。

封面保存为：

`source/assets/images/cover/why-google-adsense.webp`

文章 frontmatter 同时配置：

```yaml
index_img: /assets/images/cover/why-google-adsense.webp
banner_img: /assets/images/cover/why-google-adsense.webp
```

## 正文图片展示

正文图片默认完整显示原始画面，不进行视觉裁剪：

```css
object-fit: contain;
width: auto;
height: auto;
max-width: 100%;
max-height: none;
```

同时为性能管线生成的 `<picture>` 增加稳定布局：

- `<picture>` 为块级元素。
- 宽度不超过正文容器。
- 图片水平居中。
- 保留现有圆角、阴影和上下间距。
- 移动端不得产生页面级横向溢出。

“显示原图”指完整保留原始画面比例和内容，不代表每次强制下载原始 PNG。现有响应式 WebP、`srcset`、懒加载和异步解码继续保留；浏览器按设备宽度选择较小文件。点击图片时，Fancybox 仍使用原始 PNG 地址查看高清图。

## 影响范围

正文图片规则作用于所有启用 `.blog-post-enhanced` 的博文，修复性能管线输出的 `<picture>`，同时兼容未经过性能管线的普通 `<img>`。

以下图片不受影响：

- 首页文章封面。
- 详情页横幅。
- 关于页、链接页等非博文图片。
- 动态宠物、评论头像和站点图标。

## 测试

自动化测试需要证明：

- 目标文章同时配置 `index_img` 和 `banner_img`。
- 封面资源存在且尺寸为 `1920×818`。
- 正文增强 CSS 对普通 `<img>` 和 `<picture> > img` 使用 `object-fit: contain`。
- 正文图片保持 `height: auto`、`max-width: 100%`、`max-height: none`。
- 现有响应式 WebP 和原图回退继续生成。

构建与浏览器验收需要证明：

- 首页卡片显示新封面，标题仍清晰。
- 详情页横幅显示新封面。
- 两张 AdSense 截图完整显示，没有截掉左右或上下内容。
- 桌面端和移动端均无页面级横向溢出。
- 正文图片仍选择响应式 WebP，点击可打开原始 PNG。
- 现有自动化测试和移动性能预算无回归。

## 发布与回滚

发布只包含：

- 新封面资源。
- 目标文章的两个 frontmatter 字段。
- 正文图片展示 CSS。
- 对应自动化测试。

发布后分别验证源分支、Pages `master`、正式首页、文章路由、封面和正文图片资源。

若正文布局或性能回归，回滚 CSS 和 frontmatter 提交即可；文章正文、两张原始截图、评论、广告配置和 `ads.txt` 不做修改。
