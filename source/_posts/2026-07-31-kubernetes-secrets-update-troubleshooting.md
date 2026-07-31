---
title: "一次 Kubernetes 环境变量残留故障：为什么重启 Pod 也没有解决问题？"
author: "Zhi Li"
tags:
  - Kubernetes
  - DevOps
  - troubleshooting
categories:
  - 技术
date: 2026-07-31 22:30:00
updated: 2026-07-31 22:30:00
index_img: /assets/images/cover/Kubernetes-logo.webp
banner_img: /assets/images/cover/Kubernetes-logo.webp
---

最近在 Kubernetes 集群中遇到了一次环境变量残留问题。我明明已经重新部署，旧环境变量为什么还在？本篇博客将总结复盘本次 troubleshooting 全过程包括思路和定位方法，希望可以帮助到其他遇到类似问题的人。

## 一、问题背景

### 1. 现象描述

构建服务完成重新部署后，新的 Pod 已经生成并正常运行，但容器内仍然存在一个旧的环境变量，导致构建任务持续使用旧的 Build Service Key 并且开启了调试模式（DEBUG=true）。

```text
BUILD_SERVICE_KEY=<legacy-value>
```

我最初的直觉是 Deployment 没有真正更新，或者 Pod 仍然运行了旧版本。但继续排查后发现，问题并不在 Rollout，也不在镜像，而在 Kubernetes Secret 的更新方式。

### 2. 业务影响

残留的硬编码配置可能导致 CI/CD 构建任务继续使用错误的凭证或参数，带来安全合规风险，也让构建结果的可信度受到影响。

因此，不能只确认 Pod 是否启动，还需要继续追踪变量究竟来自哪里。

> **Pod 重建成功，不代表它依赖的配置已经按预期完成清理。**

## 二、排查思路

整个排查过程按照“先确认现象，再向上追踪配置来源”的思路展开。

### 1. 确认 Pod 内变量存在

首先进入容器检查运行时环境：

```bash
kubectl exec deploy/build-service -n tools -c build-service-node -- env | grep BUILD_SERVICE_KEY
```

结果确认：新 Pod 中仍然存在旧变量。

这一步只能证明旧的 BUILD_SERVICE_KEY 确实还在，但还不能确定来自镜像、Deployment，还是外部配置对象。下一步我需要排查定位到具体是哪个配置对象导致。很好，我就喜欢 debug 🐛，开干开干～～

### 2. 检查 Deployment 的变量来源

继续检查 Deployment 中的环境变量声明：

```bash
kubectl get deploy build-service -n tools -o yaml | grep -A10 envFrom
```

结果显示，容器通过 `envFrom` 引用了一个 Secret：

```yaml
envFrom:
  - secretRef:
      name: build-service-secrets
```

到这里，排查范围已经从 Pod 和 Deployment 缩小到 Secret。

### 3. 检查 Secret 的实际内容

接下来检查集群中现存 Secret：

```bash
# 查看 Secret 资源对象本身
[xxxx@server01 ~]$ kubectl get secret build-service-secrets -n tools
NAME                    TYPE     DATA   AGE
build-service-secrets   Opaque   12     109d
[xxxx@server01 ~]$

# 查看 Secret 内容
kubectl get secret build-service-secrets -n tools -o yaml
```

结果发现，Secret 当前包含的 key 数量多于声明文件，其中仍有已经从当前 YAML 删除的旧 key。

这也解释了为什么 Pod 重建后，旧环境变量仍然存在：

> Deployment 每次都会通过 `envFrom` 读取当前 Secret；只要旧 key 还在 Secret 中，新 Pod 就会继续注入这个变量。

### 4. 对比 `last-applied-configuration`

最后对比 Secret 当前的 `.data` 与 annotation 中记录的 `kubectl.kubernetes.io/last-applied-configuration`。

结果发现，当前声明文件只记录了部分 key，而下面这些历史 key 不在 `last-applied-configuration` 中，却仍然存在于 Secret 的 `.data`：

```text
BUILD_SERVICE_KEY
DEBUG_MODE
BUILD_MATRIX_DEFAULT
BUILD_MATRIX_MAIN
BUILD_MATRIX_RELEASE
LEGACY_ACCESS_TOKEN
```

这一步最终解释了旧 key 为什么没有随着 YAML 变更而消失。

## 三、根因分析

根因不是 Deployment 没有重启或者镜像没有更新，而是：

> **`kubectl apply` 是合并更新，不是全量覆盖。对于不在当前 `last-applied-configuration` 管理范围内的旧 Secret key，仅从当前 YAML 中删除，并不会保证它自动从现存 Secret 的 `.data` 中消失。**

在本次场景中，旧 key 仍然保留在 Secret 中。执行 `rollout restart` 后，新 Pod 重新读取的依然是这个包含旧 key 的 Secret，因此变量继续出现在容器环境中。

这里我执行了两个动作：

- `kubectl apply`：更新 Kubernetes 对象的声明内容；
- `kubectl rollout restart`：触发工作负载重建 Pod。

`rollout restart` 只负责重建 Pod，不会修改或清理 Secret 本身。只要 Secret 中的旧数据没有被删除，重启 Pod 也无法解决问题。

### 1. 故障链路

把整个过程串起来，可以看到旧变量是如何重新进入新 Pod 的：

![Secret 旧 key 残留并重新注入 Pod 的故障链路](/assets/images/posts/kubernetes-secret-stale-key-flow.png)

这里真正需要更新的是集群中的 Secret，而不是反复重启 Deployment。

### 2. Kubernetes 底层发生了什么

执行 `rollout restart` 时，Kubernetes 执行背后的收敛过程（reconciliation process）：

1. 命令更新 Deployment 的 Pod Template annotation；
2. kube-apiserver 保存新的期望状态；
3. Deployment Controller 创建新的 ReplicaSet；
4. Scheduler 为新 Pod 选择工作节点；
5. 目标节点上的 kubelet 同步 Pod；
6. kubelet 根据 Pod Spec 读取 `envFrom` 引用的 Secret；
7. CSI 容器运行时创建并启动容器；
8. kubelet 持续更新 Pod Status，直到满足就绪条件。

controller 负责让 Pod 完成重建，但不会删除 Secret 中的历史字段。这正是“Pod 已经是新的，变量却还是旧的”这一现象背后的原因。

## 四、解决方案

### 1. 临时修复

命令行删除 Secret 中不应继续存在的旧 key，或者在确认影响范围后（例如，仅影响当前 Pod），考虑重新创建 Secret。

Secret 清理完成后，再重建 Pod，让容器读取更新后的配置：

```bash
kubectl rollout restart deployment/build-service -n tools
kubectl rollout status deployment/build-service -n tools
```

最后进入新 Pod 验证旧变量是否已经消失：

```bash
kubectl exec deploy/build-service -n tools -c build-service-node -- env | grep BUILD_SERVICE_KEY
```

结果是命令无输出，给自己一个赞 👍 

### 2. 使用不可变镜像标签完善发布链路

虽然镜像不是本次 Secret 残留问题的根因，但原来的发布方式如果长期复用可变标签（如 `latest`），仍然可能引入另一类版本漂移问题。

可以在 Jenkins 流水线中使用“构建号 + Git Commit 短哈希”生成不可变标签，并在部署阶段显式更新 Deployment 的镜像：

```groovy
stage('Deploy to Kubernetes') {
    echo 'Deploy to Kubernetes'

    // Use an immutable tag: build number + short Git commit.
    def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'local'}"

    sh 'kubectl apply -f k8s-deploy.yaml'
    sh "kubectl set image deployment/build-service " +
       "build-service-node=${IMAGE_NAME}:${imageTag} " +
       "-n ${K8S_NAMESPACE}"
    sh "kubectl rollout status deployment/build-service " +
       "--timeout=180s -n ${K8S_NAMESPACE}"
}
```

示例中的服务名和变量名均为脱敏后的通用名称。实际流水线还应确保前面的构建与推送阶段使用同一个 `imageTag`。

从流水线到新 Pod 就绪，底层链路可以概括为：

![不可变镜像标签从 Jenkins 构建到 Kubernetes Pod 就绪的发布链路](/assets/images/posts/kubernetes-immutable-image-deployment-flow.png)

这条链路解决的是“构建产物能否被唯一标识并准确部署”的问题；Secret 清理解决的是“运行配置是否与声明一致”的问题。两者都需要验证，但不能混为同一个根因。

### 3. 长期改进

1. **明确 Secret 的唯一管理来源**  
   避免同一个 Secret 同时被脚本、人工命令和多个 YAML 文件更新。

2. **对比期望状态与集群实际状态**  
   不仅检查代码仓库中的 YAML，还要检查集群中 Secret 的实际 key 集合。

3. **将删除旧 key 纳入变更验证**  
   配置变更不能只验证新增和修改，也要验证应该删除的内容确实已经消失。

4. **分开验证配置更新与 Pod 重建**  
   先确认 Secret 已正确更新，再确认新 Pod 读取了正确配置。

## 五、可复用的排查路径

以后再遇到“配置明明删除了，Pod 中为什么还存在”的问题，可以按下面的顺序检查：

```text
确认 Pod 内实际环境变量
        ↓
检查 Pod / Deployment 的 env、envFrom
        ↓
定位 ConfigMap 或 Secret
        ↓
检查集群对象的实际 data
        ↓
对比 last-applied-configuration
        ↓
修正配置对象并重建 Pod
        ↓
再次验证运行时状态
```

这条排查路径的重点是：不要停留在代码仓库或 YAML 文件中，而要沿着引用关系，一直检查到集群中的实际对象和容器运行状态（注：理解 k8s 底层工作原理，deployment controller 如何更新 Pod 配置非常重要）

## 六、经验总结

这次问题最容易产生的误判是：

> Deployment 已经 Rollout 成功，所以新 Pod 的配置一定是新的。

但 Rollout 成功只说明 Pod 完成了重建，并不能证明它依赖的 Secret 已经被正确清理。

对 Kubernetes 配置变更而言，完整的验证链路应该是：

```text
声明文件已更新
      ↓
集群对象实际内容正确
      ↓
Pod 已重新创建
      ↓
容器运行时配置符合预期
```

我从这次故障的收获的经验是：

> **不要把“执行过更新命令”当成配置已经生效，也不要把“Pod 已重启”当成旧配置已经消失。最终结论必须由集群对象和容器运行时的实际状态共同证明。**
