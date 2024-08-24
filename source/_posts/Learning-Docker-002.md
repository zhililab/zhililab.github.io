title: Docker 学习 —— 常用 docker 镜像总结（优化）
author: Zhi Li
tags:
  - Docker
categories:
  - 技术
index_img: /assets/images/cover/Docker_Cover.png
date: 2024-08-24 10:54:00
---

在 DevOps 和软件开发领域，Docker 镜像是构建、测试、部署应用的基础。在日常开发中，掌握常用的 Docker 镜像以及相应的最佳实践能够显著提升工作效率。本文将简要介绍一些常用的 Docker 镜像，并提供相应的拉取命令及高级优化使用技巧。我们开始吧！

## 常用镜像介绍

### 1. **操作系统基础镜像**
- **Ubuntu**: 
  - **介绍**: Ubuntu 是一个稳定且广泛使用的 Linux 发行版，适合大多数 Linux 环境下的应用开发和部署。基于 Ubuntu 的镜像通常作为开发和生产环境的基石，特别适合在 CI/CD 流水线中使用。
  - **高级技巧**: 可以基于 Ubuntu 镜像定制自己的基础镜像，预装常用的开发工具，如 `curl`、`git` 等，减少 CI 构建时间。
  - **拉取命令**: `docker pull ubuntu:latest`

- **Alpine**: 
  - **介绍**: Alpine 是一个极为轻量级的 Linux 发行版，镜像体积通常在 5MB 左右，非常适合需要最小化容器大小的场景。由于其小巧的体积和安全性，Alpine 镜像在生产环境中广受欢迎。
  - **高级技巧**: 在使用 Alpine 时，建议根据需求选择合适的 `glibc` 兼容包，以避免与常见 C 库的兼容性问题。
  - **拉取命令**: `docker pull alpine:latest`

- **CentOS**: 
  - **介绍**: CentOS 是基于 Red Hat 的企业级 Linux 发行版，具有长期支持和企业级稳定性，常用于企业级应用的生产环境，特别是在需要与 RHEL 保持兼容性的场景中。
  - **高级技巧**: 对于需要 RHEL 兼容的开发者，可以通过 CentOS Stream 获取更新的功能，同时测试与 RHEL 的兼容性。
  - **拉取命令**: `docker pull centos:latest`

### 2. **编程语言运行时镜像**
- **Java**: 
  - **介绍**: OpenJDK 是 Java 的开源实现。`jre-slim` 版本适用于运行 Java 应用，而 HotSpot JVM 是默认的虚拟机，具备较好的性能和稳定性。
  - **高级技巧**: 对于高性能需求的应用，可以考虑使用 GraalVM 来进一步优化运行时性能。建议定期检查 Java 镜像的安全更新，以确保运行时的安全性。
  - **拉取命令**: 
    - `docker pull openjdk:11-jre-slim`
    - `docker pull adoptopenjdk:11-jre-hotspot`

- **Python**: 
  - **介绍**: Python 是一种非常流行的编程语言，广泛应用于数据科学、自动化和 Web 开发领域。`slim` 版本的镜像适用于轻量级的应用场景。
  - **高级技巧**: 使用 `multi-stage builds` 技术构建镜像，减少最终镜像的体积；结合 `pipenv` 或 `poetry` 等工具管理 Python 依赖，确保环境一致性。
  - **拉取命令**: `docker pull python:3.9-slim`

- **Node.js**: 
  - **介绍**: Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行环境，适合构建高效的服务器端应用。`alpine` 版本的 Node.js 镜像具备轻量和快速启动的优势。
  - **高级技巧**: 结合 `multi-stage builds` 优化生产镜像，将应用的依赖独立安装至特定路径，避免冗余文件。
  - **拉取命令**: `docker pull node:14-alpine`

- **Go**: 
  - **介绍**: Go 是一种高效、静态类型的编程语言，适合构建高并发的服务器端应用。`alpine` 版本的 Go 镜像在性能与镜像体积间取得了良好平衡。
  - **高级技巧**: 使用 `CGO_ENABLED=0` 环境变量禁用 Cgo，生成更加轻量级的静态二进制文件，并且通过 `multi-stage builds` 将构建和运行分离，进一步缩小最终镜像的体积。
  - **拉取命令**: `docker pull golang:1.16-alpine`

### 3. **数据库镜像**
- **MySQL**: 
  - **介绍**: MySQL 是一个流行的关系型数据库管理系统，广泛用于 Web 和企业级应用。`8.0` 版本具备了更好的性能和扩展性。
  - **高级技巧**: 在使用 MySQL 镜像时，建议使用挂载卷的方式存储数据库文件，以避免数据丢失。此外，可以配置多主节点模式提升高可用性。
  - **拉取命令**: `docker pull mysql:8.0`

- **PostgreSQL**: 
  - **介绍**: PostgreSQL 是一个功能强大的开源关系型数据库系统，支持复杂查询、数据分析和高级功能（如 JSONB 支持和窗口函数）。
  - **高级技巧**: 可以使用 `pg_cron` 扩展来调度数据库任务，或通过 `pg_stat_statements` 扩展来监控查询性能。此外，建议开启 `pgbackrest` 或 `WAL` 归档以实现更好的数据备份和恢复。
  - **拉取命令**: `docker pull postgres:13`

- **Redis**: 
  - **介绍**: Redis 是一个高性能的内存数据库，支持多种数据结构，常用于缓存、会话管理和消息队列。
  - **高级技巧**: Redis 镜像中支持主从复制和哨兵机制，可以构建高可用的 Redis 集群。此外，考虑使用 Redis 6 新增的 ACL（访问控制列表）功能来提升安全性。
  - **拉取命令**: `docker pull redis:6-alpine`

### 4. **Web 服务器镜像**
- **Nginx**: 
  - **介绍**: Nginx 是一个高性能的 Web 服务器，广泛用于静态内容服务、反向代理和负载均衡。`alpine` 版本的 Nginx 镜像在性能与体积间达到良好平衡。
  - **高级技巧**: 使用 `nginx.conf` 文件进行细粒度的性能调优，如开启 gzip 压缩、优化缓存策略和连接池配置。还可以通过 `ngx_brotli` 扩展进一步提升页面加载速度。
  - **拉取命令**: `docker pull nginx:alpine`

- **Apache HTTP Server**: 
  - **介绍**: Apache 是一个流行的 Web 服务器软件，支持静态和动态内容的托管。适用于复杂应用场景，尤其是需要使用 .htaccess 或集成多种模块的场景。
  - **高级技巧**: Apache 支持 MPM（多处理模块），通过配置 `event MPM` 提升高并发场景下的性能表现。建议根据应用需求开启/禁用特定模块以优化资源使用。
  - **拉取命令**: `docker pull httpd:2.4`

### 5. **CI/CD 工具镜像**
- **Jenkins**: 
  - **介绍**: Jenkins 是一个广泛使用的开源自动化服务器，常用于构建、测试和部署应用。`LTS` 版本具备更好的稳定性，适合在生产环境中使用。
  - **高级技巧**: 通过 Jenkins 的 `Pipeline` 配置文件（如 `Jenkinsfile`）实现复杂的 CI/CD 流水线，建议启用 `Blue Ocean` 插件提供更加直观的流水线视图。此外，可以将 Jenkins 主节点与执行节点分离，提升整体执行效率。
  - **拉取命令**: `docker pull jenkins/jenkins:lts`

- **GitLab CI**: 
  - **介绍**: GitLab CI 是 GitLab 集成的持续集成和交付工具，提供强大的流水线功能，支持自动化软件的构建和部署。`alpine` 版本适合轻量级 CI 环境。
  - **高级技巧**: 建议使用 `GitLab Runner` 执行不同环境的流水线任务，并通过 `Cache` 和 `Artifacts` 功能提升构建速度和任务间的数据传递效率。此外，配置多执行节点以分担任务负载。
  - **拉取命令**: `docker pull gitlab/gitlab-runner:alpine`

- **Docker**: 
  - **介绍**: Docker-in-Docker 镜像用于在容器内运行 Docker，非常适合在 CI/CD 管道中进行容器化构建和测试。
 

## Docker 镜像大小调优

对 Docker 容器镜像大小进行调优可以显著提供镜像构建效率和资源部署效率。以下是针对不同方面的调优策略：

### 1. 使用小型基础镜像

**原理(WHY)**:
- 基础镜像体积：小型基础镜像（如 alpine）默认包含较少的系统组件和库，相比于完整的操作系统镜像（如 ubuntu），它们的体积要小很多。
- 减小体积：减少了不必要的系统组件，降低了整个镜像的体积，从而节省了磁盘空间和带宽。

**操作(HOW)**:
- 尽量选择小型基础镜像如 `alpine`，它仅包含最基本的功能，从而减少镜像体积。例如：`FROM alpine` 替代 `FROM ubuntu`。

```Dockerfile
# 使用 alpine 作为基础镜像，它的体积非常小（约 5 MB）
FROM alpine:latest
RUN apk add --no-cache curl
CMD ["curl", "--version"]
```

<img src="https://img.picui.cn/free/2024/08/24/66c958d85223b.png" alt="Description" style="width: 100%; height: auto;">

### 2. 多阶段构建

**原理(WHY)**:
- 分离构建和运行环境：通过多阶段构建，可以在前期阶段使用较大的镜像进行编译和构建，而最终镜像中只包含运行时所需的最小文件。
- 减少最终镜像体积：将构建工具和临时文件排除在最终镜像之外，从而减少最终镜像的体积。

**操作(HOW)**:
- 使用多阶段构建可以在构建过程中使用较大的镜像进行编译，而最终镜像中只包含运行时所需的文件。
- 例如：在开发阶段使用 `maven` 构建应用，然后在第二阶段使用 `openjdk` 来运行构建好的应用。

```Dockerfile
# 构建阶段
FROM maven:3.8.1-jdk-11 AS build
WORKDIR /app
COPY . .
RUN mvn clean package

# 运行阶段
FROM openjdk:11-jre-slim
COPY --from=build /website/target/mywebsite.jar /website/mywebsite.jar
CMD ["java", "-jar", "/website/mywebsite.jar"]
```

### 3. 清理临时文件

**原理(WHY)**:
- 减少缓存和临时文件：安装包时会下载缓存和临时文件，这些文件在安装完成后通常是不必要的，删除它们可以减少镜像体积。
- 减少层的大小：每个 RUN 指令会创建一个新的镜像层，清理临时文件可以减少层的体积。

**操作(HOW)**:
- 在 Dockerfile 中使用 `RUN` 指令安装包后，紧跟着 `rm -rf /var/lib/apt/lists/*` 或 `yum clean all` 清理安装过程中产生的临时文件。示例如下：

```Dockerfile
RUN apt-get update && apt-get install -y \
curl \
&& rm -rf /var/lib/apt/lists/*
```

### 4. 合并指令

**原理(WHY)**:
- 减少镜像层数：每个 RUN 指令都会创建一个新的镜像层。合并多个指令可以减少这些中间层，从而减少镜像的体积。
- 减少重复操作：将相关操作合并到一个层中，避免了中间层的冗余和重复操作。

**操作(HOW)**:
- 合并多个 `RUN` 指令为一个，减少中间层数，降低镜像大小。
- 示例：

```Dockerfile
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
```