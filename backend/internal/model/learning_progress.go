package model

import (
	"time"
)

// LearningProgress 对应 learning_progress 表（日志表，不做软删除）。
type LearningProgress struct {
	ID           uint64    `gorm:"column:id;primaryKey;autoIncrement"`
	OwnerID      uint64    `gorm:"column:owner_id;not null"`
	TaskID       uint64    `gorm:"column:task_id;not null"`
	MinutesSpent int       `gorm:"column:minutes_spent;not null;default:0"`
	Note         *string   `gorm:"column:note;type:text"`
	LoggedAt     time.Time `gorm:"column:logged_at;not null"`
	CreatedAt    time.Time `gorm:"column:created_at;not null"`
}

func (LearningProgress) TableName() string { return "learning_progress" }
