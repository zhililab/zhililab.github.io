title: Kubernetes 学习 —— node 🆚 pod
author: Zhi Li
tags:
  - Kubernetes
categories:
  - 技术
index_img: /assets/images/cover/Kubernetes-logo.webp
date: 2024-08-22 10:30:00
---

上一篇，我们介绍了 kubernetes 的控制面板组件、节点组件和其他附加组件，这一篇我们将针对资源对象 Pod 和 Node 进行辨析，理清二者关系。

### 1. **Pod**
#### 定义
- **Pod** 是 Kubernetes 中最小的可部署单元，它封装了一个或多个容器（通常是 Docker 容器），以及这些容器共享的存储、网络和配置信息。
- 一个 Pod 内的所有容器共享相同的网络命名空间，可以通过 `localhost` 相互通信。

#### 作用
- Pod 是 Kubernetes 调度的基本单位，每个 Pod 都运行在一个 Node 上。
- Pod 内的容器共同协作完成某个任务，通常一个 Pod 会包含一个主容器，可能还有一些辅助容器（如日志处理容器）。

#### 特点
- **短生命周期**: Pod 通常是短暂的，当 Pod 被删除、崩溃或被替换时，会由控制器（如 Deployment）自动创建新的 Pod 来代替。
- **不可变性**: 在 Kubernetes 中，Pod 是不可变的，更新 Pod 会创建一个新的 Pod 来替换旧的。

> pods 在 kubernetes 中主要有两种使用方式：运行单个容器和运行多个需要协同工作的容器。

### 2. **Node**
#### 定义
- **Node** 是 Kubernetes 集群中的一个工作节点，代表一台物理机或虚拟机。每个 Node 都包含多个 Pod，并负责运行这些 Pod 的容器。
- Node 上运行着 Kubernetes 的关键组件，如 `kubelet`、`kube-proxy` 和容器运行时（如 Docker）。

#### 作用
- **资源管理**: Node 管理其上的计算资源（CPU、内存、存储等），并将这些资源分配给运行的 Pod。
- **Pod 运行环境**: Node 提供了容器运行时环境和必要的系统资源，确保 Pod 能正常运行。

#### 特点
- **集群组成部分**: 一个 Kubernetes 集群由多个 Node 组成，集群中的 Node 数量可以动态伸缩。
- **节点状态**: Node 可能处于不同的状态，如 `Ready`（就绪）、`NotReady`（未就绪）等，这些状态会影响 Pod 的调度。

### 3. **Worker Node**
#### 定义
- **Worker Node** 通常是指用于运行应用负载的 Node。Kubernetes 中的 Worker Node 和 Node 在概念上是相同的，Worker Node 是 Node 的一种类型或角色。

#### 作用
- Worker Node 专门负责运行用户的应用容器（Pod），处理工作负载。相比之下，Master Node（控制节点）负责管理和调度整个集群，而不运行应用负载。
- 每个 Worker Node 都报告其状态和资源使用情况到 Kubernetes 控制平面（如 API Server），并接受调度指令。

#### 特点
- **Pod 承载**: Worker Node 是实际承载和运行 Pod 的节点。
- **集群扩展**: 集群扩展时，通常会增加 Worker Node 的数量，以增加集群的计算资源和负载能力。

### 4. **Pod、Node 和 Worker Node 的关系**
- **Pod 与 Node 的关系**:
  - Pod 是 Kubernetes 中的基本运行单元，Pod 在 Node 上运行。
  - 每个 Node 上可以运行多个 Pod，不同的 Pod 可以在同一个 Node 上，也可以分布在不同的 Node 上。
  - Pod 由调度器（Scheduler）决定在哪个 Node 上运行，调度的依据是资源需求和 Node 的资源状况。

- **Node 与 Worker Node 的关系**:
  - Node 是 Kubernetes 集群的构成元素，Worker Node 是专门用于运行用户工作负载的 Node。
  - 集群的 Worker Node 越多，能够承载的 Pod 数量越多，因此集群的负载能力也越强。

- **集群管理**:
  - 集群中的 Master Node 管理 Worker Node，Master Node 不直接运行工作负载，而是管理调度、控制、监控等功能。
  - Worker Node 接受 Master Node 的指令，运行实际的 Pod，并通过 kubelet 与 Master Node 保持通信。

### 总结
- **Pod** 是最小的运行单元，包含一个或多个容器。
- **Node** 是运行 Pod 的物理或虚拟机，提供必要的计算资源。
- **Worker Node** 是运行应用负载的 Node，实际承载了集群中的 Pod。

这三者构成了 Kubernetes 集群中基本的运行和调度体系，Pod 依赖于 Node 的资源，而 Node 又是由 Kubernetes 控制平面管理的基础设施单元。

### 参考资料

[Kubernetes Doc: nodes](https://kubernetes.io/docs/concepts/architecture/nodes/)
[Kubernetes Doc: pods](https://kubernetes.io/docs/concepts/workloads/pods/)
