---
title: "为什么我要接入 Google AdSense：AI 时代，从会做产品到会获得用户"
author: "Zhi Li"
tags:
  - Google AdSense
  - AI
  - 个人成长
categories:
  - 思考
index_img: /assets/images/cover/why-google-adsense.webp
banner_img: /assets/images/cover/why-google-adsense.webp
date: 2026-07-29 23:17:00
---

最近，我开始尝试为自己的博客接入 Google AdSense。

最直接的原因，是希望博客在持续积累内容的同时，也能带来一些被动收入。但这只是第一层目标。对我来说，更重要的是借这次实践，主动训练过去关注较少的一项能力：**如何传播内容、触达用户，并长期运营一个属于自己的产品。**

AI 让实现一个功能、开发一个应用变得越来越容易，但它并没有自动解决另外几个问题：谁会看到它？用户为什么愿意使用？如何建立信任？怎样让一次访问变成持续关注？

这些问题，可能比“能不能把功能做出来”更难。

<!-- more -->

## 被动收入只是起点

博客是我长期积累知识、记录实践和输出思考的地方。每篇文章都是一份可以反复被搜索、阅读和分享的内容资产。我希望它逐渐形成一个正向循环：创作带来访问，访问带来反馈，反馈帮助我改善内容；当流量和信任积累到一定程度，再产生合理的收入。

但我并不认为接入 AdSense 就等于拥有了“躺赚”的被动收入。没有有价值的内容、稳定的访问和读者信任，广告代码本身不会创造价值。收入只是长期运营产生的滞后结果，而不是在网页中加入一段脚本后的即时奖励。

## AI 时代，稀缺的不只是开发能力

过去做技术工作时，我更习惯关注功能、性能和发布是否稳定。这些仍然重要，但当 AI 大幅降低实现成本后，我越来越意识到：

> 能做出产品，只是起点；能让正确的用户看见它、理解它并愿意留下来，才是更完整的能力。

获客和营销并不等于制造噱头。对个人开发者而言，它首先是清楚地表达价值，并主动把内容或产品带到需要它的人面前。没有接触真实用户，功能就很难获得有效反馈；一篇文章如果只停留在“发布完成”，也很难形成持续影响。

这也是我选择 Google AdSense 的深层原因：它不是终点，而是一个足够小、又足够真实的商业化练习。

## 我选择先保护阅读体验

在设计广告方案时，我没有直接开启自动广告，而是选择了一个更克制的方案：每篇博文最多保留一个受控广告位，放在正文结束之后、评论区之前。

首屏、正文段落、代码块和移动端浮层都不放广告。网站尚未通过审核时，也不加载广告脚本，不留下空白广告框。

这种方式可能不是收入最高的方案，但它符合我对博客的判断：**技术文章首先要保证连续、专注的阅读体验。** 运营不是让某个数字最大化，而是在收入、体验、性能和信任之间建立适合自己的边界。

## 配置过程带给我的一个提醒

通用流程并不复杂：注册 AdSense、补充隐私说明、发布 `ads.txt`、验证网站，然后提交审核。

实践中，`www.zhililab.cn/ads.txt` 已经可以访问，AdSense 却始终无法验证。排查后才发现，Google 会从根域名开始抓取文件，而当时 `zhililab.cn` 没有指向 GitHub Pages。补齐根域名 DNS、等待解析和 HTTPS 生效后，验证才通过。

![alt text](/assets/images/posts/google-adsense-dns-records.png)

这再次提醒我：**代码写完，不代表产品工作已经完成。** 平台规则、域名、证书、抓取链路和用户最终看到的页面，都是交付的一部分(目前网站 Google Adsense 已进入审核流程，预期最近可以正式上线)。

![alt text](/assets/images/posts/google-adsense-review-status.png)

## 当前只是一个开始

目前，网站所有权和 `ads.txt` 已完成验证，AdSense 审核申请已经提交，仍在等待结果。网站尚未开始展示广告，也还没有产生广告收入。

这篇文章不是为了证明 AdSense 有多容易，也不是展示一个成功的变现案例，而是记录我开始补齐另一类能力的过程。

接下来，我更关注的是建立一个持续循环：

> 持续创作 → 主动传播 → 触达用户 → 观察反馈 → 调整内容与产品

Google AdSense 只是这个循环中的一个小节点。真正值得积累的，不是一段广告代码，而是理解内容如何被发现、用户为什么留下，以及如何在不牺牲体验的前提下持续运营。

在 AI 时代，我希望自己不仅能快速做出产品，也能让产品走向真实用户，在一次次实践中形成自己的传播、获客和运营能力。

## 参考资料

- [Google AdSense 的工作原理](https://adsense.google.com/intl/zh-CN_cn/start/how-adsense-works/)
- [Google AdSense：ads.txt 指南](https://support.google.com/adsense/answer/12171612?hl=zh-Hans)
- [Google AdSense：确保 ads.txt 文件可被抓取](https://support.google.com/adsense/answer/7679060?hl=zh-Hans)
- [GitHub Pages：管理网站的自定义域](https://docs.github.com/zh/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
