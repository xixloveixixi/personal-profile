package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/config"
	"github.com/jiangyixi/personal-profile/backend/internal/db"
	"github.com/jiangyixi/personal-profile/backend/internal/router"
)

// main用于启动HTTP服务。
func main() {
	gormDB, err := db.New(config.DB)
	if err != nil {
		log.Fatalf("db init: %v", err)
	}

	r := gin.Default()
	router.Setup(r, gormDB)

	addr := ":8080"
	log.Printf("server listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server exited: %v", err)
	}
}
