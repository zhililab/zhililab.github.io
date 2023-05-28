---
title: 威胁情报漫谈
subtitle: 什么是威胁情报？威胁情报有什么用？有哪些常用的威胁情报框架/标准？
date: 2018-04-08 17:42:58
index_img: /assets/images/cover/CyberThreatenIntelligence_cover.jpg
author: Zhi Li
categories:
- 技术
tags:
- 威胁情报
- CTI
- STIX
- TAXII
comments: false
---



### 威胁情报、分类及其作用

#### 什么是威胁情报

威胁情报，又被称为安全威胁情报，是一种关于潜在或正在发生的威胁组织安全的信息，是一种关于攻击对手自身、使用工具及相关技术的情报。威胁情报的核心目的在于帮助组织机构理解常见的、严重外部威胁的风险，提前做好预判，准备相应防范措施，最大程度的避免或减少由于外部网络威胁给组织机构带来的损失。

#### 威胁情报分类

同时，威胁情报一词涵盖范围太广，无法准确传递，我们需要对威胁情报进行分类，这里列举两种——基于用途的分类和基于数据类型的分类。

![威胁情报分类](http://f.cl.ly/items/132G08270226343M3F1I/Image%202018-04-08%20at%207.04.08%20PM.png)

- 基于用途的分类

  - 归属指标：指向一个或多个(分布式、大规模）网络攻击的来源，是 A 发起了攻击或入侵。
  - 检测指标：指向一个网络攻击事件，例如 “这个网页脚本包含一个注入攻击”
  - 指向指标：指向一个或多个可能会被列为攻击目标的用户、设备等。
  - 预测指标：指向一个或多个预测的可能发生的后续攻击事件。例如，安全数据分析工作职责之一是需要负责网络与系统的安全监控，安全日志分析,利用大数据技术，对黑客攻击行为的分析。


- 基于数据类型的分类(级别：一级 --> 六级， 价值：低 --> 高）

  - HASH 值(一级）：SHA1 或 MD5 是比较常见的 Hash 值例子。这里威胁情报的 Hash 值主要对应于入侵相关的特定样本/文件。
  - IP 地址(二级）：IP 地址是比较常见的指标，但也是最容易被改变或伪装的指标。例如：一场大型 DDoS 攻击可能会产生成千上万个 IP 地址，单纯利用 IP 地址追溯源头效果甚微。 
  - 域名(三级）：域名指标相对 IP 地址较为固定，若想要更改则需要付出相对于 IP 地址高很多的代价(e.g. 域名变更、域名注册）
  - 网络或主机特征(四级）：当获取到这个层面的威胁情报信息会让攻击对手感到一定程度的不适，因为他们往往需要重新配置或编译他们的攻击工具/脚本。
  - 攻击工具(五级）：感知到这个层面的威胁情报相当获取攻击者们使用“武器”的具体信息(e.g. 攻击技术、攻击工具），安全工程师可以提前/立刻采取相对应的防范措施，部署防御工具/策略，进一步推测类似的攻击工具/手段，提前做制定响应预案和应对措施。
  - TTPs(六级）：TTPs 是 Tactics / Techniques / Procedures 的对应缩写组合，这个级别的威胁情报也是等级最高、价值最大的。这时候，威胁情报分析师、安全工程师等关注的不在如何获取攻击者的攻击工具或是应对相应的攻击工具，而是直接、明确、果断、快速应对攻击者的技能集(Skills Sets）。一旦到达了这个级别，攻击者为了继续发动有效的攻击、产生破坏，往往不得不去 get√ 新的技能(e.g. 工具/技术/攻击手法），无疑会耗费大量时间/精力。

> 威胁情报基于不同用途、数据类型划分了不同的类别，但威胁情报划分远不止这些。就个人而言，威胁情报基于组织机构相关程度，可以划分为无关情报、相关情报、密切相关情报；基于时间周期，还可以划分为初期情报、阶段性情报(中前期、中期、中后期）、总结性情报...

#### 作用/价值

威胁情报的价值：

✔ 以可视化的方式为企业提前审视系统漏洞提供参考

✔ 提高组织应对潜在威胁的响应速度，减少损失

✔ 帮助企业决策针对即将发生或当下发生的威胁，部署风险管理策略和资源分配



### 常用协议、标准和框架

为了便于各大白帽、安全公司、安全联盟等组织/机构/个人，共享威胁情报，形成自动化、智能化的安全威胁情景感知、实时网络攻击/威胁和复杂威胁分析的情报平台/系统，逐渐出现了一些威胁情报框架和标准，这里列举若干主流的、代表的、使用多的威胁情报框架或标准。

#### STIX™ (Structured Threat Information Expression)

**介绍**

下面是翻译自 [OASIS-OPEN](https://oasis-open.github.io/cti-documentation/) 官网的关于 STIX™ 的介绍：

STIX 是一种用于交换(exchange）安全威胁情报的语言和序列化格式。STIX 是完全开源的、任何相关人员都可以参与进行一起完善 STIX 标准本身 ➿

STIX 使得组织机构之间以一种持续不间断、自动机读方式共享安全威胁情报，安全社区更好的了解他们最有可能遇到的电脑攻击类型，从而更快速、更高效地处理应对攻击 🤖

STIX 设计之初是为了提高威胁情报方面的各项机能，例如：协同威胁分析、自动威胁情报共享、自动检测和应对等等 🎯

**内容和构成**

STIX 2 对象类化了拥有详细属性的每条情报，通过关系连接后的多个对象允许安全威胁情报可以以简单或复杂的形式表征。下面的列表是通过 STIX 可以表示的信息。

首先，STIX 2 定义了 12 种 STIX 域对象 (SDOs):

|            名称             |                             描述                             |
| :-------------------------: | :----------------------------------------------------------: |
|  攻击模式 (Attack Pattern)  |       一类 TTP ，用来描述威胁发动者尝试破坏目标的方式        |
|       活动 (Campaign)       | 一组对抗行为，用来描述一段时间内针对一系列特定目标发动的一连串恶意活动或攻击 |
| 行动内容 (Course of Action) |               一种用来预防攻击或应对攻击的行动               |
|       主体 (Identity)       |       个人、组织或团体，也可以是个人、组织或团体的派别       |
|      指标 (Indicator)       |         包含一个可以用来检测可以或恶意安全活动的特诊         |
|   入侵集 (Intrusion Set)    | 一系列抱团形式的对抗行为和资源，它们具有一些被认为是由单个威胁者精心策划的显著特征 |
|     恶意软件 (Malware)      | 一类 TTP，也叫恶意代码或恶意软件，用于破坏受害者数据或系统的保密性、完整性和可用性 |
|  监测数据 (Observed Data)   |         传递关于攻击系统的网络的信息 (e.g. IP 地址)          |
|        报告 (Report)        | 聚焦单一或更多主题的威胁情报聚合，例如关于威胁者、恶意软件或攻击技术，包括上下文细节的一个描述 |
|    威胁者 (Threat Actor)    |                怀揣恶意目的的个人、团体或组织                |
|         工具 (Tool)         |               威胁者发动攻击可以使用的正当软件               |
|    漏洞 (Vulnerability)     |           黑客可以用以获得系统或网络权限的软件缺陷           |

其次，STIX 2 定义了 2 种 STIX 关系对象 (SROs):

|        名称         |                          描述                           |
| :-----------------: | :-----------------------------------------------------: |
| 关系 (Relationship) |            用于连接两个 SDOs ，描述连接方式             |
|   见证 (Sighting)   | 表示 CTI 的一个元素被监测到的信念 (e.g. 指标、恶意软件) |

STIX 2 对象以 **JSON** 格式表示，下面是一个 STIX 2 活动对象示例:

```json
{
    "type": "campaign",  
    "id": "campaign--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f",  
    "created": "2016-04-06T20:03:00.000Z",  
    "name": "Green Group Attacks Against Finance",  
    "description": "Campaign by Green Group against targets in the financial services sector."  
}
```

这个 STIX 2 活动对象，清晰的展示了攻击活动的类型、名称等字段，其中类型和名称属性是必须有的 (required)，其他属性选择性添加 (optional)。

最后，这里放出一个 [FreeTAXII Project](https://www.youtube.com/channel/UCmW_oi_zce3On4LyK9KDnfg) 制作的 STIX 2 对象介绍视频:

<iframe width="560" height="315" src="//player.bilibili.com/player.html?aid=22063175&cid=36472059&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

#### TAXII™ (Trusted Automated Exchange of Intelligence Information)

**介绍**

下面是翻译自 [OASIS-OPEN](https://oasis-open.github.io/cti-documentation/) 官网的关于 TAXII™ 的介绍：

TAXII 是一种简单、可拓展的安全威胁情报交流 (communication) 的应用层协议 📜

TAXII 协议用于在 HTTPS 交换安全威胁情报。使用 TAXII 协议，组织机构可以通过定义符合通用共享模型的 API 方便高效地共享安全威胁情报 👌

TAXII 协议专为支持以 STIX 语言表示的安全威胁情报交换设计 ⛽

**内容和构成**

TAXII 定义了 RESTful API (一系列服务和消息交换) 和一系列 TAXII 客户端和服务器的要求。如下图，TAXII 定义了两个主要服务以支持多种多样的通用共享模型:

- **集合(Collection)** — 一个集合是 CTI 对象的逻辑库的接口，它由 TAXII 服务器提供，允许情报生产者握持一系列可以由情报消费者获取的 CTI 数据: TAXII 客户端和服务器通过“请求-响应”模型交换信息。
- **通道 (Channel)** — 一个通道允许情报生产者推送给大量消费者数据，消费者也可以从大量生产者那里接收数据，这个通道由 TAXII 服务器负责维护: TAXII 客户端和其他客户端通过“发布-订阅”模型交换信息。注意: TAXII 2.0 说明书保留了通道必须的关键字，但并未指定通道的服务。通道和他们的服务将会在 TAXII 稍后版本中的明确。

![TAXII Architecture](http://f.cl.ly/items/2f1X1D1M172J202d3N23/taxii_diagram2.png)

集合和通道可以用不同的方式组织。例如：它们可以组合在一起以支持某一特定信赖团体的需求。

一个 TAXII 服务器实例可以支持一个或多个 API Roots。API Roots 是 TAXII 通道和集合的逻辑组合，可以被认为是在不同 URL 可用时的 TAXII API 的实例 (这里每个 API Root 是TAXII API 的特定实例的"根" URL) 。

TAXII 尽可能的依赖现有的协议，尤其当通过 DNS 服务记录发现 TAXII 服务器在同一网络内时。此外，TAXII 使用 HTTPS 作为所有通信的传输协议，并使用 HTTP 作为内容协商和认证的协议。

TAXII 经过精心设计，支持 STIX 格式的 CTI 交换，并且支持 STIX 2.0 内容交换是强制要求实现的。然而，TAXII 也可以共享以其他格式记录的数据。STIX 和 TAXII 是相互独立的标准：STIX 的结构和序列化不需要以来任何特定的传输机制，而且 TAXII 可以用于传输非 TAXII 数据 (**这里划重点！这里划重点！这里划重点！**)

**TAXII 设计原则**

1. 包括采纳需要最小化修改原则
2. 便于与现有共享协议集成原则
3. 支持所有广泛使用的威胁共享模式: hub-and-spoke, peer-to-peer, source-subscriber

Plus: 关于 TAXII 2.0 详细介绍和使用说明，可以参阅 ☞ [TAXII 2.0 官方说明文档](https://oasis-open.github.io/cti-documentation/resources.html#taxii-20-specification)

### 总结

本篇我们了解威胁情报的基本概念、分类和作用，然后介绍了威胁情报常用表示标准 (e.g. STIX) 和 传输协议 (e.g. TAXII) ，感兴趣的小伙伴们可以自行搜索相关资料深入阅读。

- CTI -- Cyber Threat Intelligence 安全威胁情报
- STIX™ -- Structured Threat Information Expression 结构化威胁情报交换语言
- TAXII™ -- Trusted Automated Exchange of Intelligence Information 可信赖自动威胁情报交换协议

📢 预告 —— 下次我们将介绍一些国内外知名的威胁情报服务提供商/企业。


### 参考资料

- [TechTarget - Threat Intelligence (Cyber Threat Intelligence)](https://whatis.techtarget.com/definition/threat-intelligence-cyber-threat-intelligence)
- [小议安全威胁情报之分类和使用场景](http://netsecurity.51cto.com/art/201507/483312.htm)
- [Introduction to TAXII](https://oasis-open.github.io/cti-documentation/taxii/intro.html)

***

