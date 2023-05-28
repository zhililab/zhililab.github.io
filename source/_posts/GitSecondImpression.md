---
title: Git 使用入门（2）
subtitle: Git 使用入门（2）
date: 2018-04-07 16:23:08
index_img: /assets/images/cover/GitFirstImpression_cover.png
author: 
  nick: Zhi Li
  link: https://www.github.com/zhililab
categories:
- 技术
tags:
- Git
comments: false
---

Cover Photo by Ashley Harpp on beanstalk Guides

> 上次已经介绍了 git 的基本概念和知识，这里我们接着进行学习，本篇主要介绍 git 常用的命令 ，相信你看完之后可以使用 git 创建自己的仓库（或者克隆别人的仓库）、文件上传、提交更改、进行协作... Let`s begin 😎

### 目录

【Git 使用入门（1）】[什么是 Git](https://zhililab.github.io/2018/03/19/GitFirstImpression/)
【Git 使用入门（2）】[Git 常用命令](https://zhililab.github.io/2018/04/07/GitSecondImpression/)

### 初始化配置

正式开始使用之前，需要配置好 git 的基本信息，例如：用户名、e-mail 地址、颜色等等。

**$ git config --global [user.name][user.email][color.ui][color.status][color.diff]...**

### 开始使用

我们可以新创建一个仓库或者克隆别人的仓库到本地，命令如下：

1.新建仓库

**$ git init [myprojectname]**

![enter image description here](http://f.cl.ly/items/432K2L2y462Z3p2s2a2H/Snipaste_2018-04-07_17-25-07.png)

2.克隆仓库

**$ git clone [url]**

![enter image description here](http://f.cl.ly/items/3C0V31211K0K2T1q0V1M/Snipaste_2018-04-07_17-37-16.png)

### 协作

1.查看当前版本状态（是否修改）

- **$ git status**

![git status](https://cl.ly/3e1T0v3Q2n3l/Snipaste_2018-04-08_08-48-39.png)

2.列出分支

- **$ git branch**（列出所有本地分支）

![列出所有本地分支](https://cl.ly/2u0u0t0x2o1R/Image%202018-04-08%20at%208.55.57%20AM.png)

- **$ git branch -r**（列出所有远程分支）

![列出所有远程分支](http://f.cl.ly/items/3y0j3L2P1x3N3w3b0y3K/Image%202018-04-08%20at%209.17.39%20AM.png)

- **$ git branch -a**（列出所有本地和远程分支）

![列出所有本地和远程分支](http://f.cl.ly/items/1R460K1H3U290a3q0707/Image%202018-04-08%20at%209.18.41%20AM.png)

3.切换到指定分支

- **$ git checkout [x_brach]**

![切换到指定分支](http://f.cl.ly/items/0z1X3k3a052p3h1k1j1M/Image%202018-04-08%20at%209.48.08%20AM.png)

4.新建一个分支，并切换到该分支

- **$ git checkout -b [new_branch]**

![新建一个分支，并切换到该分支](http://f.cl.ly/items/3B3O3X1G0X1e2R3T083N/Image%202018-04-08%20at%208.59.41%20AM.png)

### 查看

1.查看当前版本状态（是否修改）

- **$ git status**

![查看当前版本状态](https://cl.ly/3e1T0v3Q2n3l/Snipaste_2018-04-08_08-48-39.png)

2.显示提交日志

- **$ git log**

![显示提交日志](http://f.cl.ly/items/0p0k2P3U11302n3E0P1v/Snipaste_2018-04-08_09-03-18.png)

3.显示提交日志及相关变动文件

- **$ git log --stat**

![显示提交日志及相关变动文件](https://cl.ly/041p0g0g2f37/Image%202018-04-08%20at%209.11.38%20AM.png)

熟话说的好，Practice Makes Perfect ~ 快速下载 git，练练基本的 git 用法吧 🤸‍
  
### 参考资料

- [常用 Git 命令清单](http://www.ruanyifeng.com/blog/2015/12/git-cheat-sheet.html)
- [git命令大全](https://gist.github.com/guweigang/9848271)
- [Git Basics Episode 2](https://git-scm.com/video/what-is-git)
  
***

预告：下次将会介绍一些好用的 git 客户端 😝