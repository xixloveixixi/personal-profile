package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/router"
)

// main用于启动HTTP服务。
func main() {
	r := gin.Default()
	router.Setup(r)

	addr := ":8080"
	log.Printf("server listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server exited: %v", err)
	}
}
