package repository

import (
	"time"

	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
)

// HealthCheckLogRepo health_check_log 表操作。
type HealthCheckLogRepo struct {
	db *gorm.DB
}

// NewHealthCheckLogRepo 构造函数。
func NewHealthCheckLogRepo(db *gorm.DB) *HealthCheckLogRepo {
	return &HealthCheckLogRepo{db: db}
}

// Create 写入一条调用日志。
func (r *HealthCheckLogRepo) Create(calledAt time.Time) error {
	log := model.HealthCheckLog{CalledAt: calledAt, CreatedAt: calledAt}
	return r.db.Create(&log).Error
}

// HealthStats 统计结果。
type HealthStats struct {
	TotalCount int64
	StartTime  time.Time
	EndTime    time.Time
}

// CountRecent24h 统计最近 24 小时调用次数。
func (r *HealthCheckLogRepo) CountRecent24h() (*HealthStats, error) {
	end := time.Now()
	start := end.Add(-24 * time.Hour)
	var count int64
	if err := r.db.Model(&model.HealthCheckLog{}).
		Where("called_at BETWEEN ? AND ?", start, end).
		Count(&count).Error; err != nil {
		return nil, err
	}
	return &HealthStats{TotalCount: count, StartTime: start, EndTime: end}, nil
}
