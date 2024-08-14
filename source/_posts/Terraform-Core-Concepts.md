title: Terraform —— 核心概念
author: Zhi Li
tags:
  - Terraform
  - IaC
  - DevOps
categories:
  - 技术
index_img: /assets/images/cover/Terraform_Cover.png
date: 2024-08-08 20:30:00
---

在现代 DevOps 和云计算的背景下，基础设施即代码（Infrastructure as Code, IaC）已经成为管理和部署基础设施的标准方式。Terraform 作为一种广受欢迎的 IaC 工具，因其多云支持和灵活性受到了广泛的青睐，更有很多 DevOps 岗位招聘的 JD 更是明确要求了解/熟悉 Terraform。本文将会梳理 Terraform 的基本概念，通过学习、实践掌握这个强大的工具。

### 一、核心概念（Core Concepts）

#### 1. **Infrastructure as Code (IaC)**
Infrastructure as Code（IaC）是一种通过编写代码来定义和管理基础设施的方法。传统上，基础设施的管理依赖于手动操作和点击界面，效率低下且容易出错。而 IaC 允许你使用类似编程的方式来描述基础设施，这意味着你可以像管理应用程序代码一样管理基础设施——通过版本控制系统跟踪更改、进行代码审查和测试。这种方法不仅提高了基础设施管理的效率，还减少了人为错误，增强了可重复性和可扩展性。

Terraform 作为一种 IaC 工具，使用 HCL（HashiCorp Configuration Language）来定义基础设施配置。你可以在代码中描述你需要的云资源、网络配置、数据库等，然后使用 Terraform 来创建、修改或销毁这些资源。

#### 2. **Providers**
Terraform 的 [Providers](https://registry.terraform.io/browse/providers) 是一种插件机制，用于与不同的云服务和 API 进行交互。每个 Provider 负责与特定的服务平台通信，例如 AWS、Azure、Google Cloud、Kubernetes、GitHub 等（如下图所示）。通过 Providers，Terraform 可以管理几乎任何基础设施资源。

每个 Provider 都需要进行配置，通常包括访问凭据和目标服务的地址等信息。Terraform 使用这些配置与云服务 API 交互，创建或管理资源。一个 Terraform 配置文件可以同时使用多个 Providers，这样你可以在多个云平台上管理你的基础设施。

![terraform_provider](https://imgos.cn/2024/08/08/66b4d34c29d78.png)

#### 3. **Resources**
Resources 是 Terraform 中的核心概念，它代表了基础设施中的一个组件。例如，在 AWS 中，资源可以是 EC2 实例、S3 存储桶、RDS 数据库实例等。在 Terraform 配置中，每个资源都使用一个特定的 Provider，并需要指定资源类型和相应的配置属性。

资源的定义包含在 Terraform 配置文件中，通常以如下形式表示：
```hcl
resource "aws_instance" "example" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
}
```
在这个例子中，`aws_instance` 是资源类型，`example` 是资源名称。这个资源配置了一个 AWS EC2 实例。

#### 4. **Modules**
Modules 是 Terraform 的一项强大功能，用于组织和封装 Terraform 配置文件。通过 Modules，你可以将相关资源的配置组合在一起，从而提高配置的可重用性和可维护性。

模块可以是本地模块（位于项目目录内）或远程模块（如存储在 GitHub 上）。使用模块时，你可以通过参数化模块配置，实现不同环境下的资源配置。例如，你可以使用同一个模块在开发环境中创建一个较小的数据库实例，而在生产环境中创建一个更大、更强的数据库实例。

#### 5. **State**
State（状态文件）是 Terraform 用来跟踪实际基础设施与配置文件之间关系的关键机制。Terraform 在初始化和执行操作时，会读取和更新状态文件。状态文件保存了 Terraform 管理的所有资源的当前状态信息，通常以 JSON 格式存储。

Terraform 使用状态文件来对比基础设施的当前状态和配置文件中描述的期望状态，从而生成一个变更计划。状态文件可以保存在本地，也可以保存在远程（如使用 Terraform Cloud 或者 S3 ）。

#### 6. **Plan 和 Apply**
`terraform plan` 和 `terraform apply` 是 Terraform 中的两个核心命令：

- **Plan**：`terraform plan` 命令用于生成并展示 Terraform 将对基础设施执行的更改计划。这个命令不会对实际的基础设施做任何改动，而是用于预览配置的影响，从而避免潜在的错误和意外更改。
  
- **Apply**：`terraform apply` 命令根据 `terraform plan` 的输出，实际对基础设施进行更改。执行这个命令时，Terraform 会创建、更新或删除配置中描述的资源，以使实际基础设施与配置文件描述的状态保持一致。

#### 7. **Variables**
Variables（变量）是 Terraform 配置中的动态元素。通过使用变量，你可以让配置更加灵活和可配置，避免硬编码。Terraform 支持输入变量和输出变量：

- **输入变量**：用于在执行 `terraform plan` 或 `terraform apply` 时动态传递值，允许你根据不同的环境或需求修改资源配置。

- **输出变量**：用于从 Terraform 配置中导出值，这些值可以用于其他模块或命令行输出，帮助你更好地理解 Terraform 执行的结果。

#### 8. **Terraform Configuration Files**
Terraform 配置文件是用 HCL（HashiCorp Configuration Language）编写的，通常以 `.tf` 后缀命名。这些配置文件定义了 Terraform 管理的所有资源、提供者、变量等内容。一个典型的 Terraform 配置文件包括：

- **Provider 配置**：定义使用的云服务提供商。
- **Resource 定义**：定义资源类型和配置属性。
- **Variable 声明**：定义可在配置中使用的变量。
- **Output 定义**：定义从配置中导出的值。

#### 9. **Terraform CLI**
Terraform 提供了一个功能强大的命令行接口（CLI），用于管理和执行 Terraform 配置。常用命令包括：

- `terraform init`：初始化 Terraform 工作目录，下载所需的 Providers 插件。
- `terraform plan`：生成并显示将要对基础设施执行的更改计划。
- `terraform apply`：应用配置文件中的更改到实际基础设施。
- `terraform destroy`：销毁配置中定义的所有资源。
- `terraform validate`：验证 Terraform 配置文件的语法和逻辑是否正确。

### 二、部署（Deploy）

以下是使用 Terraform 部署基础设施的步骤：

1. 审查（Scope）- 确定项目所需的基础设施。这一步涉及明确你需要管理的基础设施组件，确定项目中的哪些资源需要被创建、修改或删除。

> 这里需要注意，如果没有明确提供程序版本的范围（scope provider version），Terraform 将下载满足版本约束的`最新提供程序版本`。这可能会导致意外的基础设施更改。通过仔细指定范围明确的提供程序版本并使用依赖项锁定文件，可以确保 Terraform 使用正确的提供程序版本，从而使项目的配置保持一致。
	
2. 编写（Author） - 为基础设施编写配置文件。在这一步，使用 HCL 语言编写 Terraform 配置文件，定义`基础设施资源`、`提供者`、`变量`等内容。

3. 初始化（Initialize） - 安装 Terraform 管理基础设施所需的插件。使用 terraform init 命令初始化 Terraform 工作目录，并下载所需的 Providers 插件。

4. 规划（Plan） - 预览 Terraform 将根据配置进行的更改。通过 terraform plan 命令生成变更计划，查看 Terraform 将如何调整基础设施以匹配配置文件中的描述。

5. 应用（Apply） - 执行规划的更改。使用 terraform apply 命令实际应用配置中的更改，使基础设施达到配置文件中的期望状态。

### 三、结语
Terraform 通过提供强大的 IaC 功能，极大地简化了基础设施管理和部署。理解和掌握 Terraform 是云行业从业者（DevOps）必不可少的，后面我们会展开介绍。

### 四、附录

#### 示例 1 官方教材

官方教材实践 https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli

1.安装并查看 terraform 版本
 
```bash
terraform --help
```

2.编写 nginx docker 配置文件

```hcl
terraform {
    required_providers {
        docker = {
            source  = "kreuzwerker/docker"
            version = "~> 3.0.1"
        }
    }
}

provider "docker" {}

resource "docker_image" "nginx" {
  name          = "nginx"
  keep_locally  = false
}

resource "docker_container" "nginx" {
  image = docker_image.nginx.image_id
  name = "tutorial"  
 
  ports {
    internal = 80
    external = 8081
  }
}
```

3.terraform 部署步骤

```bash
terraform init # 初始化
terraform plan # 检查变化修改
terraform apply # 部署应用
```

4.验证部署结果
  
  ![docker 客户端控制面板](https://imgos.cn/2024/08/09/66b4ec4418c8e.png)

  ![打开网站实际效果](https://imgos.cn/2024/08/08/66b4eb72b241b.png)

5.其他

在 local 进行部署测试中，可以发现 `terraform apply` 后，自动化生成了 `terraform.tfstate`，它是 Terraform 用于管理和存储状态的文件，记录了 Terraform 管理的基础设施的当前状态。

  ![terraform.tfstate](https://imgos.cn/2024/08/09/66b4f10a4dd7e.png)

#### 示例 2 复合配置

下面一个例子定义一个 aws 使用云环境 —— Autoware是一个基于ROS的开源软件项目，专为自动驾驶车辆设计，涵盖了感知、定位、规划、控制等所有功能模块，并支持多种车辆类型和应用场景（感兴趣的朋友可以阅读我之前写的一篇文章 ——  [AutoWare 初探](http://www.zhililab.cn/2024/08/07/AutoWare-Intro/)）。这里为了配置文件将自动部署一个集成了高性能计算和存储资源的Kubernetes集群，并支持Autoware的核心模块。

```hcl
provider "aws" {
  region = "us-west-2"
}

resource "aws_vpc" "autoware_vpc" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "autoware_subnet" {
  vpc_id     = aws_vpc.autoware_vpc.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_eks_cluster" "autoware_cluster" {
  name     = "autoware-cluster"
  role_arn = aws_iam_role.eks_role.arn

  vpc_config {
    subnet_ids = [aws_subnet.autoware_subnet.id]
  }

  # 设置Kubernetes版本和节点组
  version    = "1.23"
  node_group {
    instance_type = "m5.large"
    desired_size  = 3
  }
}

resource "aws_efs_file_system" "autoware_storage" {
  encrypted = true
}

resource "aws_efs_mount_target" "autoware_efs_mount" {
  file_system_id = aws_efs_file_system.autoware_storage.id
  subnet_id      = aws_subnet.autoware_subnet.id
}

# Autoware核心模块的配置
module "autoware_core" {
  source = "git::https://github.com/autowarefoundation/autoware"
  
  eks_cluster_name = aws_eks_cluster.autoware_cluster.name
  efs_file_system_id = aws_efs_file_system.autoware_storage.id
}

# 输出集群信息
output "cluster_endpoint" {
  value = aws_eks_cluster.autoware_cluster.endpoint
}

output "efs_dns_name" {
  value = aws_efs_file_system.autoware_storage.dns_name
}
```

> Kubernetes 从 V1.24.x 开始，把 containerd 作为了主要的容器运行方式，不再使用 Docker

这个配置文件包括了以下关键组件：

1. **VPC和子网**：为Autoware项目定义了网络环境。
2. **EKS集群**：创建一个用于部署Autoware模块的Kubernetes集群。
3. **EFS存储**：为高效处理自动驾驶数据提供弹性文件存储。
4. **Autoware核心模块**：通过模块化的方式部署Autoware核心软件包。

这将提供一个完整的基础设施环境，支持Autoware的部署和扩展，后续我们就可以根据项目需求进一步调整配置文件。