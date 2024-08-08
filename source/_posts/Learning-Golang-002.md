title: Go 语言学习 —— 字典查找判断
author: Zhi Li
tags:
  - Go
  - Programming
categories:
  - 技术
index_img: /assets/images/cover/golang_cover.png
date: 2024-07-17 22:30:00
---

这两天学习 go 语言字典特性 ，突然想到之前 C++ 和 Python 的字典各有特点，特此写一篇短文总结，对比学习一下三种编程语言字典处理。

C++ 和 Python 中字典查找和条件判断的简洁方式，在 C++ 和 Python 中，虽然没有像 Go 语言那样的短变量声明语法，但两者都有自己处理字典查找和条件判断的简洁方式。

1. 在 C++ 中，使用 `std::map` 或 `std::unordered_map` 进行字典查找时，可以使用 `find` 方法来检查键是否存在。这里是一个示例：

2. 在 Python 中，可以使用 `in` 运算符来检查键是否存在于字典中，并直接访问键值。这里是一个示例：

## 解释和对比

### C++

- **查找键**：使用 `find` 方法查找键，返回一个迭代器。
- **检查键是否存在**：通过比较迭代器和 `end()` 来判断键是否存在。
- **处理结果**：如果键存在，可以通过迭代器访问对应的值；如果不存在，执行其他操作。

### Python

- **查找键**：使用 `in` 运算符直接检查键是否在字典中。
- **处理结果**：如果键存在，可以直接访问对应的值；如果不存在，执行其他操作。

### Go

- **查找键**：使用 `if` 语句中的短变量声明，同时检查键是否存在并获取值。
- **处理结果**：键存在时，可以直接使用获取的值；键不存在时，进入 `else` 分支处理。

## 示例对比

### C++ 示例

```cpp
#include <iostream>
#include <unordered_map>

int main() {
    std::unordered_map<std::string, std::string> ci_cd_status = {
        {"build1", "success"},
        {"build2", "failure"}
    };

    auto it = ci_cd_status.find("build3");
    if (it != ci_cd_status.end()) {
        std::cout << "build3 status: " << it->second << std::endl;
    } else {
        std::cout << "build3 not found" << std::endl;
    }

    it = ci_cd_status.find("build2");
    if (it != ci_cd_status.end()) {
        std::cout << "build2 status: " << it->second << std::endl;
    } else {
        std::cout << "build2 not found" << std::endl;
    }

    return 0;
}
```

### Python 示例

```python
ci_cd_status = {
    "build1": "success",
    "build2": "failure",
}

if "build3" in ci_cd_status:
    print(f"build3 status: {ci_cd_status['build3']}")
else:
    print("build3 not found")

if "build2" in ci_cd_status:
    print(f"build2 status: {ci_cd_status['build2']}")
else:
    print("build2 not found")

if "build1" in ci_cd_status:
    print(f"build1 status: {ci_cd_status['build1']}")
else:
    print("build1 not found")

if "build4" in ci_cd_status:
    print("build4 not found")
```

### Go 示例

```go
package main

import "fmt"

func main() {
    // 字典初始化
    var ci_cd_status = map[string]string{
        "build1":      "success",
        "build2": "failure",
    }

    // 查找 "build3" 键并处理键不存在的情况
    if status, ok := ci_cd_status["build3"]; ok {
        fmt.Printf("build3 status: %s\n", status)
    } else {
        fmt.Printf("build3 not found\n")
    }

    // 查找 "build2" 键并处理键存在的情况
    if status, ok := ci_cd_status["build2"]; ok {
        fmt.Printf("build2 status: %s\n", status)
    } else {
        fmt.Printf("build2 not found\n")
    }

    // 查找 "build1" 键并处理键存在的情况
    if status, ok := ci_cd_status["build1"]; ok {
        fmt.Printf("build1 status: %s\n", status)
    } else {
        fmt.Printf("build1 not found\n")
    }

    // 查找一个不存在的键 "build4"
    if status, ok := ci_cd_status["build4"]; ok {
        fmt.Printf("build4 status: %s\n", status)
    } else {
        fmt.Printf("build4 not found\n")
    }
}
```

## 总结

Go 语言的 `if` 语句中的短变量声明极大地提高了代码的可读性和简洁性，而 C++ 和 Python 也提供了各自简洁的实现方式。

Go 语言的字典（map）是一种键值对数据结构。Go 语言的 map 实现是一个哈希表。在 Go 的源码中，map 的实现相对复杂，涉及哈希函数、碰撞处理和内存管理等机制。在 Go 的源码中，map 的实现位于 `src/runtime/map_siwss.go` （基于SwissTable算法的哈希表）文件中。map 的底层结构主要由以下几个部分组成：
    • `bucket`：存储键值对的基本单元。
	• `hmap`：代表整个哈希表的结构体。

感兴趣的朋友可以去 go 源代码库详细查看，链接如 [map_swiss.go](https://github.com/golang/go/blob/e705a2d16e4ece77e08e80c168382cdb02890f5b/src/runtime/map_swiss.go#L113)