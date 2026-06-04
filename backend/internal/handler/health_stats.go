package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/repository"
)

// HealthStatsHandler 健康检查统计 handler。
type HealthStatsHandler struct {
	repo *repository.HealthCheckLogRepo
}

// NewHealthStatsHandler 构造函数。
func NewHealthStatsHandler(repo *repository.HealthCheckLogRepo) *HealthStatsHandler {
	return &HealthStatsHandler{repo: repo}
}

// GetStats 查询最近 24 小时健康检查调用次数。
func (h *HealthStatsHandler) GetStats(c *gin.Context) {
	stats, err := h.repo.CountRecent24h()
	if err != nil {
		Fail(c, 500, 50000, "数据库错误")
		return
	}
	OK(c, gin.H{
		"totalCount": stats.TotalCount,
		"startTime":  stats.StartTime.UTC().Format("2006-01-02T15:04:05Z"),
		"endTime":    stats.EndTime.UTC().Format("2006-01-02T15:04:05Z"),
	})
}
