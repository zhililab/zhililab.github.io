title: 使用 Go `runtime` 包监控和优化容器内存使用
author: Zhi Li
tags:
  - Go
  - Programming
  - Mini-task
categories:
  - 技术
index_img: /assets/images/cover/golang_cover.png
date: 2024-08-27 12:10:00
---

Talk is cheap, show me the code. 本篇目标是通过 mini-task ，掌握如何使用 Go 语言的 `runtime` 包来监控和优化容器内存使用。Let's go!

#### 一、背景介绍

`runtime` 包在 Go 语言中提供了与运行时系统交互的功能，允许开发者访问和控制 Go 程序的运行时环境。它主要的作用包括：

1. 并发控制：管理和控制 goroutine 的并发执行，例如通过 GOMAXPROCS 函数设置或查询逻辑处理器的数量。
2. 内存管理：提供垃圾回收（Garbage Collection, GC）相关的函数和调优参数，帮助开发者优化内存使用。
3. 调度器控制：允许开发者干预调度器的行为，例如设置或查询线程的抢占策略。
4. 堆栈跟踪：提供获取当前 goroutine 的堆栈跟踪信息的函数，有助于调试和错误处理。

#### 二、任务目标：

通过这个任务，实践使用 Go 语言的 `runtime` 包来监控和调整应用程序的内存使用情况。最终目标是编写一个简单的 Go 程序，能够在容器化环境中运行，定期打印当前的内存使用情况，并根据使用量进行优化（e.g proactive garbage collection）。mini-task 计划如下：

1. **了解 Go `runtime` 包的基本功能**：通过官方文档查询与内存管理相关的函数。
2. **编写监控内存使用的 Go 程序**：使用 `runtime` 包中的 `MemStats` 结构体和 `ReadMemStats` 方法，实时监控内存使用情况。
3. **在容器中运行该程序**：通过 `Docker` 将程序容器化，并观察在容器中运行时的内存使用情况。

#### 四、操作记录：

1. **初步学习 `runtime` 包内存管理功能**：
   - 阅读并理解 Go 官方文档中关于 `runtime` 包的介绍，本次 mini-task 主要是与内存管理相关的部分：
     - `runtime.MemStats` 结构体：包含了 Go 程序的各种内存统计数据。
     - `runtime.ReadMemStats(&memStats)`：获取当前的内存统计数据。
     - `runtime.GC()`：手动触发垃圾回收。

> 想要深入了解 runtime 可以阅读官方文档 https://pkg.go.dev/runtime

2. **编写 Go 程序**：
   - 编写一个简单的程序，定期（如每秒）调用 `runtime.ReadMemStats` 获取内存使用情况，并打印输出到标准输出。还可以在某个条件下调用 `runtime.GC()` 主动进行垃圾回收。
   - 示例代码：
     ```go
     package main

     import (
         "fmt"
         "runtime"
         "time"
     )

     func main() {
         var memStats runtime.MemStats
         ticker := time.NewTicker(1 * time.Second)

         for range ticker.C {
             runtime.ReadMemStats(&memStats)
             fmt.Printf("Alloc = %v MiB", bToMb(memStats.Alloc))
             fmt.Printf("\tTotalAlloc = %v MiB", bToMb(memStats.TotalAlloc))
             fmt.Printf("\tSys = %v MiB", bToMb(memStats.Sys))
             fmt.Printf("\tNumGC = %v\n", memStats.NumGC)

             // 可选：如果某个条件成立，主动触发垃圾回收
             if memStats.Alloc > 100*1024*1024 { 
                // 这里设置当内存分配超过 100 MiB 时，主动触发垃圾回收
                fmt.Println("Triggering GC...")
                runtime.GC()
             }
         }
     }

     func bToMb(b uint64) uint64 {
         return b / 1024 / 1024
     }
     ```

3. **容器化并运行程序**：
   - 编写一个简单的 Dockerfile 将该程序容器化：
     ```dockerfile
     FROM golang:latest
     WORKDIR /app
     COPY . .
     RUN go build -o mem-monitor .
     CMD ["./mem-monitor"]
     ```
   - **构建和运行容器**：
     ```bash
     docker build -t mem-monitor .
     docker run --rm mem-monitor
     ```
   - **观察容器内的内存使用情况**，并调整容器的内存限制、CPU 配额等，查看程序的运行表现。

   （1）构建镜像
   
   ![1724737873596.png](https://img.picui.cn/free/2024/08/27/66cd692c54adc.png)
   
   （2）观察容器的内存使用情况
   
   ![1724738055726.png](https://img.picui.cn/free/2024/08/27/66cd69e213b67.png)
   可以上图发现 alloc、TotalAlloc、Sys、NumGC 等内存使用情况，我们可以对代码做一些小修改，增加波动。
   
   （3）修改代码

    ```go
    package main

    import (
        "fmt"
        "runtime"
        "time"
    )

    func main() {
        var memStats runtime.MemStats
        ticker := time.NewTicker(1 * time.Second)

        // 模拟的内存分配
        var allocations [][]byte

        for range ticker.C {
            // 分配 10 MiB 内存
            allocations = append(allocations, make([]byte, 10*1024*1024))

            // 每隔 5 次释放一部分内存
            if len(allocations) > 5 {
                allocations = allocations[2:]  // 保留最近三次的分配
            }

            // 读取当前内存状态
            runtime.ReadMemStats(&memStats)
            fmt.Printf("Alloc = %v MiB", bToMb(memStats.Alloc))
            fmt.Printf("\tTotalAlloc = %v MiB", bToMb(memStats.TotalAlloc))
            fmt.Printf("\tSys = %v MiB", bToMb(memStats.Sys))
            fmt.Printf("\tNumGC = %v\n", memStats.NumGC)

            // 可选：如果某个条件成立，主动触发垃圾回收
             if memStats.Alloc > 100*1024*1024 { 
                // 这里设置当内存分配超过 100 MiB 时，主动触发垃圾回收
                fmt.Println("Triggering GC...")
                runtime.GC()
             }
        }
    }

    func bToMb(b uint64) uint64 {
        return b / 1024 / 1024
    }
    ```
    （4）更新镜像、重新运行容器
    ![rebuild_image.png](https://img.picui.cn/free/2024/08/27/66cd6c0aee5e7.png)

    ![rerun_image.png](https://img.picui.cn/free/2024/08/27/66cd6c538f052.png)

    通过这个修改，你应该能看到内存使用情况在每次分配和释放操作时产生波动，Alloc、TotalAlloc、Sys 等字段的值会有明显变化，并且 NumGC 的值会随着垃圾回收的触发而增加。这样可以更直观地观察 Go 程序的内存管理行为。

#### 五、任务总结和思考

通过这个任务，我们了解到 Go 语言的 `runtime` 包的基本功能，以及如何使用它来编写和运行 Go 程序。同时，我们还可以通过容器化和运行程序来观察容器内的内存使用情况，并根据需要进行优化。

#### 附录1 基础环境工具配置 

docker desktop(macos) 4.31.0 (153195)
go version go1.23.0 darwin/arm64

#### 附录2 完整代码示例

[docker-runtime-monitor](https://github.com/zhililab/zhililab.github.io/tree/code-samples/Project/docker-runtime-monitor)