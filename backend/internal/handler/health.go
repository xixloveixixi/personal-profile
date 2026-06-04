package handler

import (
	"time"

	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/repository"
)

// HealthHandler 健康检查 handler（支持记录日志）。
type HealthHandler struct {
	repo *repository.HealthCheckLogRepo
}

// NewHealthHandler 构造函数。
func NewHealthHandler(repo *repository.HealthCheckLogRepo) *HealthHandler {
	return &HealthHandler{repo: repo}
}

// Check 健康检查接口（记录调用日志）。
func (h *HealthHandler) Check(c *gin.Context) {
	now := time.Now()
	// 异步写入日志，不阻塞响应
	go func() { _ = h.repo.Create(now) }()
	OK(c, gin.H{"status": "ok"})
}

// Health 无 DB 依赖的健康检查（保留旧接口兼容）。
func Health(c *gin.Context) {
	OK(c, gin.H{"status": "ok"})
}
