---
title: Git 使用入门（3）
subtitle: Git 使用入门（3）
date: 2020-12-06 22:40:08
index_img: /assets/images/cover/GitFirstImpression_cover.png
author: Zhi Li
categories:
- 技术
tags:
- Git
comments: false
---

Cover Photo by Ashley Harpp on beanstalk Guides

> 上一篇已经介绍本篇主要介绍 Git 常用的命令,本片介绍本地操作相关，看完这篇你将对本地文件修改如何撤销比较清楚 Let`s begin 😎

### 目录

【Git 使用入门（1）】[什么是 Git](https://zhililab.github.io/2018/03/19/GitFirstImpression/)
【Git 使用入门（2）】[Git 常用命令](https://zhililab.github.io/2018/04/07/GitSecondImpression/)



#### 本地文件修改撤销

1. 查看本地文件修改内容

```bash
#查看本地文件修改内容）
git diff fileName.xxx
```

2. 撤销本地文件修改

```bash
# 撤销本地所有文件修改
git check . 
# 撤销本地文件 fileName.xxx 的修改
git check fileName.xxx 
```

3. 本地修改了一些文件，且已提交到暂缓区

```bash
# 撤销本地所有文件修改和add操作
git reset HEAD .
# 撤销本地 fileName.xxx 的修改和add操作
git reset HEAD fileName.xxx
```

例如，我在工程里对两个头文件做了修改，还未提交到暂缓区，这时如果想撤销修改，可以运行下面的命令：

```bash
# 当前目录只有2个头文件，采用通配符
git checkout Learn-To-Program-With-CPP/SimpleClasses/*.h
```