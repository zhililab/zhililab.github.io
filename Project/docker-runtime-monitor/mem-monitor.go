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
		if memStats.Alloc > 100*1024*1024 { // 例如，当内存分配超过 100 MiB 时
			fmt.Println("Triggering GC...")
			runtime.GC()
		}
	}
}

// 将 runtime.MemStats 结构体中的内存分配量（Alloc）和总内存分配量（TotalAlloc）从字节转换为兆字节
// 这种转换在监控和分析内存使用时，可以快速了解内存的消耗情况。
func bToMb(b uint64) uint64 {
	return b / 1024 / 1024
}

