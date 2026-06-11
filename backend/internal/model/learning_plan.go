package model

import (
	"time"

	"gorm.io/gorm"
)

// LearningPlan 对应 learning_plan 表。
type LearningPlan struct {
	ID             uint64         `gorm:"column:id;primaryKey;autoIncrement"`
	OwnerID        uint64         `gorm:"column:owner_id;not null"`
	GoalID         *uint64        `gorm:"column:goal_id"`
	Title          string         `gorm:"column:title;size:255;not null"`
	Description    *string        `gorm:"column:description;type:text"`
	Source         string         `gorm:"column:source;size:32;not null;default:'manual'"`
	Status         string         `gorm:"column:status;size:32;not null;default:'draft'"`
	StartDate      *string        `gorm:"column:start_date;type:date"`
	EndDate        *string        `gorm:"column:end_date;type:date"`
	TotalTasks     int            `gorm:"column:total_tasks;not null;default:0"`
	CompletedTasks int            `gorm:"column:completed_tasks;not null;default:0"`
	CreatedAt      time.Time      `gorm:"column:created_at;not null"`
	UpdatedAt      time.Time      `gorm:"column:updated_at;not null"`
	DeletedAt      gorm.DeletedAt `gorm:"column:deleted_at;index:idx_deleted_at"`
}

func (LearningPlan) TableName() string { return "learning_plan" }
