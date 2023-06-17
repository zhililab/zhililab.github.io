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

### FAQ

**1. conan install 报错，gnu 版本过低** 

![image](https://github.com/zhililab/Znotes/assets/11768073/85fdd80a-f386-4aed-b2a6-910a2fde4ced)


**解决方法：**

两个软件包要求使用C++11标准进行编译，而当前系统的C++标准版本（cppstd）为gnu98，低于所需版本 。当前使用 cent 7.9 机器，gcc 4.8.5 ，该如何解决这个问题

由于您当前使用的是CentOS 7.9操作系统，它默认安装的GCC版本为4.8.5，这个版本的C++标准版本最高只支持到C++03，因此需要升级GCC到支持C++11标准的版本。

有几种方法可以升级GCC，其中一种是使用DevToolSet软件集。DevToolSet是一个由Red Hat提供的软件集，其中包含了最新版本的GCC和其他开发工具。您可以使用以下命令安装DevToolSet：

```bahs
sudo yum install centos-release-scl
sudo yum install devtoolset-9-gcc devtoolset-9-gcc-c++ devtoolset-9-binutils
```
安装完成后，您可以使用以下命令启用DevToolSet中的GCC版本：

```bash
scl enable devtoolset-9 bash
```
然后，您可以再次运行Conan以安装这些软件包。如果您仍然遇到问题，请确保在Conan命令中使用-s cppstd=11选项来设置所需的C++标准版本。

**2. conan 依赖包 下载** 

`conan install .`
![image](https://github.com/zhililab/Znotes/assets/11768073/ca25340e-70f4-4791-a79b-d654d229ab1c)

**解决方法：**

```bash
# 使用本地模式
conan install . --build=missing
```

**3.conan** 下载失败

```bash
abseil/20220623.0: Sources downloaded from 'conancenter'
abseil/20220623.0: Calling source() in /root/.conan2/p/absei4eff9c73765e3/s/src
abseil/20220623.0: ERROR: Error downloading file https://github.com/abseil/abseil-cpp/archive/20220623.0.tar.gz: 'HTTPSConnectionPool(host='github.com', port=443): Read timed out. (read timeout=30)'
abseil/20220623.0: Waiting 5 seconds to retry...
abseil/20220623.0: ERROR: Error downloading file https://github.com/abseil/abseil-cpp/archive/20220623.0.tar.gz: 'HTTPSConnectionPool(host='github.com', port=443): Read timed out. (read timeout=30)'
abseil/20220623.0: Waiting 5 seconds to retry...
ERROR: abseil/20220623.0: Error in source() method, line 81
        get(self, **self.conan_data["sources"][self.version], strip_root=True)
        ConanException: Error downloading file https://github.com/abseil/abseil-cpp/archive/20220623.0.tar.gz: 'HTTPSConnectionPool(host='github.com', port=443): Max retries exceeded with url: /abseil/abseil-cpp/archive/20220623.0.tar.gz (Caused by ConnectTimeoutError(<urllib3.connection.HTTPSConnection object at 0x7f7add706c88>, 'Connection to github.com timed out. (connect timeout=30)'))

```

4.编译缺失对应依赖

```bash
/root/.conan/data/protobuf/3.21.9/_/_/package/37dd8aae630726607d9d4108fefd2f59c8f7e9db/bin/protoc: /lib64/libstdc++.so.6: version `GLIBCXX_3.4.20' not found (required by /root/.conan/data/protobuf/3.21.9/_/_/package/37dd8aae630726607d9d4108fefd2f59c8f7e9db/bin/protoc)
/root/.conan/data/protobuf/3.21.9/_/_/package/37dd8aae630726607d9d4108fefd2f59c8f7e9db/bin/protoc: /lib64/libstdc++.so.6: version `CXXABI_1.3.8' not found (required by /root/.conan/data/protobuf/3.21.9/_/_/package/37dd8aae630726607d9d4108fefd2f59c8f7e9db/bin/protoc)
gmake[2]: *** [gens/src/proto/grpc/channelz/channelz.grpc.pb.cc] Error 1
gmake[1]: *** [CMakeFiles/grpcpp_channelz.dir/all] Error 2
gmake[1]: *** Waiting for unfinished jobs....
/root/.conan/data/protobuf/3.21.9/_/_/package/37dd8aae630726607d9d4108fefd2f59c8f7e9db/bin/protoc: /lib64/libstdc++.so.6: version `GLIBCXX_3.4.20' not found (required by /root/.conan/data/protobuf/3.21.9/_/_/package/37dd8aae630726607d9d4108fefd2f59c8f7e9db/bin/protoc)
/root/.conan/data/protobuf/3.21.9/_/_/package/37dd8aae630726607d9d4108fefd2f59c8f7e9db/bin/protoc: /lib64/libstdc++.so.6: version `CXXABI_1.3.8' not found (required by /root/.conan/data/protobuf/3.21.9/_/_/package/37dd8aae630726607d9d4108fefd2f59c8f7e9db/bin/protoc)
gmake[2]: *** [gens/src/proto/grpc/reflection/v1alpha/reflection.grpc.pb.cc] Error 1
gmake[1]: *** [CMakeFiles/grpc++_reflection.dir/all] Error 2
gmake: *** [all] Error 2
```

**解决方法：**

GLIBCXX_3.4.20 和 CXXABI_1.3.8 都是 GNU C++ 标准库的版本。在 CentOS 7.9 中，这些版本可能已经过时或不可用。您可以尝试使用以下命令来安装最新版本的 GNU C++ 标准库：

```bash
sudo yum install libstdc++-devel
```

这个命令会安装最新版本的 libstdc++ 库和相关的开发工具。安装完成后，您可以尝试重新运行出现错误的程序，看看是否还会报错。

如果您仍然需要使用旧版本的 GNU C++ 标准库，您可以尝试手动安装这些版本。以下是一些可能有用的资源：

- GLIBCXX_3.4.20: 可能需要从源代码编译安装，具体步骤可以参考 GNU C++ 标准库的官方文档：https://gcc.gnu.org/onlinedocs/libstdc++/faq.html#faq.how_to_install

- CXXABI_1.3.8: 这个版本通常包含在 libstdc++ 库中，因此您可以尝试使用上面提到的命令来安装最新版本的 libstdc++ 库。如果您仍然需要手动安装这个版本，具体步骤可以参考这个 Stack Overflow 的帖子：https://stackoverflow.com/questions/33394996/how-to-install-libstdc-so-6-0-21cxxabi-1-3-8-in-centos-6-7


❤️ made with ChatGPT