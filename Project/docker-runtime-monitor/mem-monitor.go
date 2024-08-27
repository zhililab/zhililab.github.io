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
		 if memStats.Alloc > 100*1024*1024 { // 这里设置当内存分配超过 100 MiB 时，主动触发垃圾回收
			 fmt.Println("Triggering GC...")
			 runtime.GC()
		 }
	}
}

func bToMb(b uint64) uint64 {
	return b / 1024 / 1024
}