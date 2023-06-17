title: Conan 包管理
author: Zhi Li
tags:
  - Conan
  - CM
categories:
  - 技术
index_img: /assets/images/cover/jfrog_conan2_conver.jpg
date: 2023-06-18 09:23:34
---

Conan是一个用于C++项目的包管理器，它可以帮助您管理项目所需的依赖项和库。它可以提高构建速度和可靠性，并使您的项目更易于维护。在本文中，我们将探讨Conan的使用、Conan recipe以及踩坑经验。

### 1. Conan是什么以及为什么要使用它？

Conan是一个开源的C++包管理器，它可以帮助您管理项目所需的依赖项和库。Conan可以自动下载和构建依赖项，并将它们编译成二进制文件，这可以提高构建速度和可靠性。Conan还提供了一种简单的方法来共享代码和依赖项，并使您的项目更易于维护。

### 2. 如何安装和配置Conan？

您可以使用pip或安装程序来安装Conan，并使用`conan config`命令来配置Conan。您还可以使用`conan remote`命令添加远程存储库，以便获取和分发包。配置Conan是很容易的，只需运行以下命令：

```
pip install conan
conan config install <path-to-config-file>
```

在配置文件中，您可以指定默认的编译器、构建类型和其他设置。

### 3. 如何创建和使用Conan recipe？

Conan recipe是一个描述如何构建和打包C++库或应用程序的文件。您可以使用`conan new`命令创建新的Conan recipe，并使用`conan create`命令构建和上传包。您还可以使用`conan install`命令安装包，并使用`conan info`命令查看有关包的信息。

创建一个新的Conan recipe非常简单，只需运行以下命令：

```
conan new <package-name>/<version>
```

这将创建一个名为`<package-name>`的目录，其中包含一个名为`conanfile.py`的文件。在此文件中，您可以指定依赖项、构建设置和其他选项，以及如何构建和打包代码。

要构建和上传包，请运行以下命令：

```
conan create . <user>/<channel>
```

这将自动下载、构建和上传包到指定的远程存储库。


#### 4. 更新社区 patch


针对 grpc 1.41.1 版本的问题，我们需要一个社区 patch 进行修复。如何快速纳入 patch，制作 Conan 包。

4.1 准备好 grpc 1.41.1 源码包 

```bash
git clone git@github.com:conan-io/conan-center-index.git
```

4.2 社区 patch 

(针对问题 [InsecureChannelCredentials stuck on call](https://github.com/grpc/grpc/issues/22803))

```bash
shasum -a 256 grpc-1.41.1.tar
```

![](https://user-images.githubusercontent.com/11768073/246641079-fc4a103c-064c-4dd5-8353-2b3c2191c527.png)


4.3 grpc conan recipie

[grpc-1.41.1-recipe](https://conan.io/center/grpc?version=1.41.1&tab=recipe)

```python
from conan.tools.microsoft.visual import msvc_version_to_vs_ide_version
from conan.tools.files import rename
from conans import ConanFile, CMake, tools
from conans.errors import ConanInvalidConfiguration
import os

required_conan_version = ">=1.43.0"


class grpcConan(ConanFile):
    name = "grpc"
    description = "Google's RPC (remote procedure call) library and framework."
    topics = ("grpc", "rpc")
    url = "https://github.com/conan-io/conan-center-index"
    homepage = "https://github.com/grpc/grpc"
    license = "Apache-2.0"
    .....

```

下面列出 conan recipe 常见函数和用途
| 函数 | 用途 |
| --- | --- |
| def configure(self) | 配置构建环境，例如设置编译器、编译选项等。 |
| def requirements(self) | 定义依赖项，例如其他库或工具。 |
| def build(self) | 构建软件包，例如编译、链接等。 |
| def package(self) | 打包软件包，例如创建二进制文件、库文件等。 |
| def package_info(self) | 配置链接和运行时依赖项，例如设置库路径、头文件路径等。 |
| def source(self) | 下载源代码，并可选地对其进行解压缩和修补。 |
| def build_requirements(self) | 定义构建时依赖项，例如构建工具或编译器插件。 |
| def test(self) | 运行测试套件，例如使用 CTest 运行测试用例。 |
| def package_id(self) | 定义软件包的唯一标识符，例如版本号、ABI 等。 |

4.4 构建制作 grpc with patch 

(1) 确保在 conanfile.py 中正确修改目标版本号 e.g 1.41.1
![](https://user-images.githubusercontent.com/11768073/246630032-acc19648-428e-448f-8119-4917bd425db3.png)
(2) 安装依赖项
```bash
conan install . --building=missing
```
(3) 本地构建
```bash
conan create . <username>/<chanel>
```

![conan create](https://user-images.githubusercontent.com/11768073/246641149-5c9e44a7-4706-412d-bdc3-7ff40ec6fe83.png)


### 5. 踩坑经验和解决方案

在使用Conan时，可能会遇到一些问题。以下是一些常见问题及其解决方案：

- 问题：无法找到依赖项。
  解决方案：确保已正确指定依赖项，并将其添加到`conanfile.py`文件中。

- 问题：构建失败。
  解决方案：检查构建设置是否正确，并确保已正确安装所有依赖项。

- 问题：无法上传包。
  解决方案：确保已正确配置远程存储库，并使用正确的用户名和密码进行身份验证。

### 6. 优化

Conan是一个用于C++项目的包管理器，可以帮助您管理项目所需的依赖项和库。在使用Conan时，可以通过指定不同的选项和设置来优化Conan的行为，以提高构建速度和可靠性。

以下是一些优化Conan的方法：

（1）缓存Conan包：Conan包可以被缓存到本地，以便在需要时快速访问。可以使用`conan install`命令的`--build`选项来控制是否重新构建包。例如，使用`conan install -s build_type=Release --build missing`命令可以缓存Release版本的包，并在需要时重新构建缺失的包。

（2）使用远程存储库：Conan支持使用远程存储库来获取和分发包。您可以使用`conan remote add`命令添加远程存储库，并使用`conan install`命令的`--remote`选项指定要使用的远程存储库。这有助于加快包的下载速度和分发速度。

（3）指定Conanfile位置：如果您的项目中有多个Conanfile文件，则可以使用`-if`选项指定要使用的Conanfile文件。这有助于避免不必要的构建，并加快构建速度。

（4）并行构建：Conan支持并行构建，可以使用`-j`选项指定要使用的并行任务数。这有助于加快构建速度。

总体而言，优化Conan的方法取决于项目的具体情况和需求。您可以根据需要选择不同的选项和设置来优化Conan的行为。

### 7. 总结

Conan是一个非常有用的工具，它可以帮助C++开发人员管理项目所需的依赖项和库，提高构建速度和可靠性，并使项目更易于维护。在本文中，我们介绍了如何安装和配置Conan，创建和使用Conan recipe，并分享了一些踩坑经验和解决方案。希望这些信息能对您有所帮助！


