---
title: Git 使用入门（1）
subtitle: Git 是一个当下十分流行的分布式版本控制工具，可以帮助我们有效管理项目开发/文档写作中的版本管理/更新/维护等多种问题，极大的提高了我们的开发效
date: 2018-03-19 08:46:32
index_img: /assets/images/cover/GitFirstImpression_cover.png
author: Zhi Li
categories:
- 技术
tags:
- Git
comments: false
---

Cover Photo by  Ashley Harpp on beanstalk Guides

# 什么是 Git

Git 是一个当下十分流行的分布式版本控制工具，可以帮助我们有效管理项目开发/文档写作中的版本管理/更新/维护等多种问题，极大的提高了我们的开发效率，同时适用多人协作模式，在我看来，不管是程序员、工程师、作家、学生等等职业，学习、使用 Git 都将会对你的工作/学习/创作起到极大的效率提升作用。

现在版本控制可以分为三大类：

* LVCS-本地版本控制 e.g. RCS
* CVCS-集中化的版本控制系统  e.g. CVCS / Subversion / Perfoce
* DVCS-分布式版本管理系统 e.g. Git / Bazaar

# 使用 Git 的好处

Git 的几大优点：

* 简答易学，容易上手 （这里推荐新手阅读 Scott Chacon 和 Ben Straub 撰写的 [Pro Git](https://git-scm.com/book/zh/v2) 手册，现在已经有在线中文版 ）

* 完全分布式

* 速度快

* 保证数据完整性。所有数据在更改前都使用 [SHA-1](https://baike.baidu.com/item/sha-1)校验和，保证了所有更改 Git 都知悉。

* 可以高效管理超大规模项目

# 基本概念

正式上手之前，需要明白并记录 Git 的三个文件状态（states）和三个概念（concepts），这对之后地理解、使用 Git 十分重要！

## 3 个状态

* comitted: 是“已提交”，这表示所有更改的文件已经安全地存储在你的本地库。

* modified: 意思是“已修改”，这意味着你已经更改了你的文件，但还没有提交到你的本地库中。

* staged: 意思是“已暂存”，你已经在当前版本库中标记了修改地文件，将在出现在。

## 3 个概念

* Git directory: “Git 仓库”，用来保存项目的元素据（metadata）和对象数据库的地方。Git 体系中最核心的部分。

* working tree: “工作目录” ，对项目（project）的某个版本（version）单独拷贝、提取。

* staging area: “暂存区域”，本质上一个文件（file），保存了下词将提交的文件列表信息，一般存放在 Git 仓库中。

![](https://cl.ly/261D2F3g2H1V/Image%202018-03-19%20at%2012.05.42%20PM.png)

参考资料：

[1] [Chacon S. Pro Git[J]. 2014](https://git-scm.com/book/en/v2)

[2] [廖雪峰-Git教程](https://www.liaoxuefeng.com/wiki/0013739516305929606dd18361248578c67b8067c8c017b000)

*** 

预告：下篇将会介绍 Git 的基本安装、使用命令 ; )


