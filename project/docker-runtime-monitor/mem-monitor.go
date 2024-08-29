package main

import (
	"fmt"
	"runtime"
	"time"
	"math/rand"
)

func main() {
	var memStats runtime.MemStats
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	// 模拟的内存分配
	var allocations [][]byte

	for range ticker.C {
		// 随机分配 5-15 MiB 内存，更接近实际情况
		allocSize := 5 + rand.Intn(11)
		allocations = append(allocations, make([]byte, allocSize*1024*1024))

		// 模拟内存释放，随机释放一些内存
		if len(allocations) > 10 && rand.Float32() < 0.3 {
			releaseCount := rand.Intn(len(allocations) / 2)
			allocations = allocations[releaseCount:]
		}

		// 读取当前内存状态
		runtime.ReadMemStats(&memStats)
		fmt.Printf("Alloc = %v MiB\tTotalAlloc = %v MiB\tSys = %v MiB\tNumGC = %v\n",
			bToMb(memStats.Alloc), bToMb(memStats.TotalAlloc), bToMb(memStats.Sys), memStats.NumGC)

		// 当内存使用超过阈值时，模拟OOM情况
		if memStats.Alloc > 500*1024*1024 {
			fmt.Println("模拟OOM情况，程序退出")
			return
		}

		// 可选：如果某个条件成立，主动触发垃圾回收
		if memStats.Alloc > 300*1024*1024 {
			fmt.Println("触发GC...")
			runtime.GC()
		}
	}
}

func bToMb(b uint64) uint64 {
	return b / 1024 / 1024
}