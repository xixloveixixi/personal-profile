package model

import (
	"time"

	"gorm.io/gorm"
)

// LearningGoal 对应 learning_goal 表。
type LearningGoal struct {
	ID              uint64         `gorm:"column:id;primaryKey;autoIncrement"`
	OwnerID         uint64         `gorm:"column:owner_id;not null"`
	Title           string         `gorm:"column:title;size:128;not null"`
	Description     *string        `gorm:"column:description;type:text"`
	GoalType        string         `gorm:"column:goal_type;size:64;not null;default:'skill'"`
	Priority        int            `gorm:"column:priority;not null;default:0"`
	Deadline        *string        `gorm:"column:deadline;type:date"`
	Status          string         `gorm:"column:status;size:32;not null;default:'not_started'"`
	ProgressPercent int            `gorm:"column:progress_percent;not null;default:0"`
	CreatedAt       time.Time      `gorm:"column:created_at;not null"`
	UpdatedAt       time.Time      `gorm:"column:updated_at;not null"`
	DeletedAt       gorm.DeletedAt `gorm:"column:deleted_at;index:idx_deleted_at"`
}

func (LearningGoal) TableName() string { return "learning_goal" }
