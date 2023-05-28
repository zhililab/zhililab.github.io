---
layout: post
title: 机器学习算法之【线性模型】
subtitle: 机器学习算法之【线性模型】
date: 2017-12-10
index_img: /assets/images/cover/MachineLearning-SupervisedLearning-LinearModel_cover.png
author: 
  nick: Zhi Li
  link: https://www.github.com/zhililab
categories:
- 技术
tags:
- 线性模型
- 回归
- 预测
---


### 一、介绍

线性模型是大家日常学习和工程应用中广泛应用到的一种基本模型，用户刻画数据的规律和趋势。通过线性模型，我们可以对连续变量的值进行预测。此外对于那些非连续型数据，我们也可以通过一些方式将其转化成适合线性拟合的数据形式（如何甄别转换场景）。

> 基本形式：y = w1x1 + w2x2 + ··· + wnxn + b 
    
其中 xi (i = 1,2,...n) 为变量（属性）， wi (i = 1,2,...n) 变量的权重值

最简单的线性回归为 —— y = kx + b 

k 称为回归直线的斜率（slope），b 称为回归直线的截距（intercept）


<!-- more -->

### 二、核心思想

核心思想：linear regression 试图学得一个线性模型以尽可能准确地预测输出变量y的实值，为未来进行预测。

那么问题来了，如何学习并最终确定这条直线呢？

一般来说，我们会采用最小化均方误差（SSE）和来确定 w 和 b 的值，因为一旦这俩种值确定，整条直线也就确定下来了。

SSE具体求解有2种方法：

1. 最小二乘法（Ordinary Least Square，OLS）

    在线性回归中，最小二乘法就是试图找到一条直线，使得所有样本到直线的欧式距离之和最小。

2. 梯度下降法（Gradient descent）

    梯度下降法是一个最优化算法，通常也称为最速下降法。最速下降法是求解无约束优化问题最简单和最古老的方法之一，虽然现已不具有实用性，但是许多有效算法都是以它为基础进行改进和修正而得到的。最速下降法是用负梯度方向为搜索方向的，最速下降法越接近目标值，步长越小，前进越慢。
    可以用于求解非线性方程组。



典型场景：

- 电力使用预测
- 交通流量预测
- 在线商铺访问预测
- ...

> 周志华老师还在🍉西瓜书中提到：“线性模式形式简答、易于建模，但却蕴含着机器学习一些重要的基本思想。许多功能强大的非线性模型（nonlinear model）可以在线性模型的基础上通过引入层级结构或高维映射而得”

### 三、实例

这里给出一个 scikit-learn 官方文档的例子

``` python
## 导入线性模型包
>>> from sklearn import linear_model 
## 生成实例 
>>> reg = linear_model.LinearRegression()
## 训练
>>> reg.fit([[0, 0], [1, 1], [2, 2]], [0, 1, 2])
LinearRegression(copy_X=True, fit_intercept=True, n_jobs=1, normalize=False)
## 求相关系数
>>> reg.coef_
array([0.5, 0.5])
```
这个例子虽然简单，但十分清晰了展现如何利用 scikit-learn 从零到一搭建线性模型。

### 四、线性模型的 pros and cons 
pros:
- 适合刻画变量之间线性或类线性关系
- 擅长连续值预测

cons:
- 线性模型的能力被局限在线性函数里

---

参考资料：
1. Udacity Machine Learning
2. 周志华 《机器学习》