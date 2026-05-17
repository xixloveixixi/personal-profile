package handler

import (
	"time"

	"github.com/gin-gonic/gin"
)

// Health 健康检查接口。
func Health(c *gin.Context) {
	OK(c, gin.H{
		"status": "up",
		"time":   time.Now().Format(time.RFC3339),
	})
}
