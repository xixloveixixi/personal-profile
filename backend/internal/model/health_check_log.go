package model

import "time"

// HealthCheckLog 对应 health_check_log 表（无软删除）。
type HealthCheckLog struct {
	ID        uint64    `gorm:"column:id;primaryKey;autoIncrement"`
	CalledAt  time.Time `gorm:"column:called_at;not null"`
	CreatedAt time.Time `gorm:"column:created_at;not null"`
}

// TableName 强制使用单数表名。
func (HealthCheckLog) TableName() string { return "health_check_log" }
