package model

import (
	"time"

	"gorm.io/gorm"
)

// LearningTask 对应 learning_task 表。
type LearningTask struct {
	ID               uint64         `gorm:"column:id;primaryKey;autoIncrement"`
	OwnerID          uint64         `gorm:"column:owner_id;not null"`
	PlanID           uint64         `gorm:"column:plan_id;not null"`
	Title            string         `gorm:"column:title;size:255;not null"`
	Description      *string        `gorm:"column:description;type:text"`
	TaskType         string         `gorm:"column:task_type;size:64;not null;default:'learning'"`
	Status           string         `gorm:"column:status;size:32;not null;default:'pending'"`
	Priority         int            `gorm:"column:priority;not null;default:0"`
	EstimatedMinutes int            `gorm:"column:estimated_minutes;not null;default:0"`
	ActualMinutes    int            `gorm:"column:actual_minutes;not null;default:0"`
	DueDate          *string        `gorm:"column:due_date;type:date"`
	CompletedAt      *time.Time     `gorm:"column:completed_at"`
	SortOrder        int            `gorm:"column:sort_order;not null;default:0"`
	CreatedAt        time.Time      `gorm:"column:created_at;not null"`
	UpdatedAt        time.Time      `gorm:"column:updated_at;not null"`
	DeletedAt        gorm.DeletedAt `gorm:"column:deleted_at;index:idx_deleted_at"`
}

func (LearningTask) TableName() string { return "learning_task" }
