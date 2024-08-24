title: Kubernetes 学习 —— 基础组件和概念梳理
author: Zhi Li
tags:
  - Kubernetes
categories:
  - 技术
index_img: /assets/images/cover/Kubernetes-logo.webp
date: 2024-08-19 00:06:00
---

Kubernetes 的架构由多个关键组件组成，这些组件共同协作，确保容器化应用的部署、管理和扩展能够顺利进行。以下是官方文档中对 Kubernetes 核心组件的总结和梳理：

![1724004427650.png](https://img.picui.cn/free/2024/08/19/66c2384c71ee5.png)

### 1. 控制平面组件（Control Plane Components）

存在的意义（WHY）: Kubernetes 的控制平面持续且主动地管理每个对象的实际状态，匹配用户提供的期望状态。 

- kube-apiserver
  - 作为 Kubernetes 控制平面的核心组件，API 服务器负责处理 REST 操作，并提供集群状态数据的入口。所有资源操作（如 Pod、Service 的创建、更新、删除）都通过 kube-apiserver 进行。
- etcd
  - 一个强一致性和高可用的分布式键值存储，主要用于保存 Kubernetes 的所有集群数据，包括配置信息、状态信息等。etcd 是 Kubernetes 的核心数据库。
- kube-scheduler
  - 负责监控未分配到节点的 Pod，并将这些 Pod 分配到合适的节点上。调度器会根据资源需求、策略、数据位置等因素来决定 Pod 的调度位置。
- kube-controller-manager
  - 包含了多个控制器的集合，如节点控制器、复制控制器、端点控制器和服务控制器等。它们负责维护集群的期望状态与实际状态的一致性，例如在节点失效时重建 Pod。
- cloud-controller-manager
  - 在云环境中运行，负责与底层云平台的交互，如负载均衡器的管理、节点的添加和删除等。它将云供应商特定的控制逻辑与 Kubernetes 控制平面分离。

### 2. 节点组件（Node Components）
- kubelet
  - 运行在每个节点上，负责确保容器在 Pod 中运行良好。它通过 API 服务器获取 Pod 的定义，并负责容器的创建、启动、停止等操作。
> 简单来说，kubectl 用于管理运行中的集群，而 kubeadm 用于集群的初始设置和升级等基础架构方面的操作。
- kube-proxy
  - 负责为 Kubernetes 服务提供网络代理服务，维护集群的网络规则，确保集群内的网络通信能够正确路由。它支持基于 IPVS 或 iptables 的流量转发。
- Container Runtime
  - Kubernetes 支持的容器运行时（如 Docker、containerd），用于实际运行和管理容器。容器运行时负责拉取镜像、创建和运行容器等。

### 3. 附加组件（Addons）
- DNS
  - Kubernetes 默认部署的 DNS 服务，负责为集群内的服务提供 DNS 名称解析。通常，Pod 可以通过服务名称直接访问其他 Pod。
- Web UI（Dashboard）
  - 提供 Kubernetes 的图形化用户界面，用户可以通过它来管理和查看集群的资源和状态。
- 容器资源监控
  - 提供对容器和节点的资源使用情况的监控，常用的工具如 Prometheus、Grafana 等，用于可视化和报警。
- 日志记录
  - 集群的日志收集和管理，确保应用程序和系统组件的日志能够被存储和查询。

### 总结
Kubernetes 通过控制平面组件来协调整个集群的状态，确保应用程序的部署、扩展和管理得以实现。每个节点上运行的节点组件则负责实际的工作负载管理和网络通信。这些组件协同工作，使 Kubernetes 能够有效地管理分布式的容器化应用程序。