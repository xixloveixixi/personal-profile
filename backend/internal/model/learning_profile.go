package model

import (
	"time"

	"gorm.io/gorm"
)

// LearningProfile 对应 learning_profile 表。
type LearningProfile struct {
	ID                 uint64         `gorm:"column:id;primaryKey;autoIncrement"`
	OwnerID            uint64         `gorm:"column:owner_id;uniqueIndex:uk_owner;not null"`
	TargetRole         string         `gorm:"column:target_role;size:128;not null;default:''"`
	BackgroundSummary  *string        `gorm:"column:background_summary;type:text"`
	SkillSummary       *string        `gorm:"column:skill_summary;type:text"`
	WeaknessSummary    *string        `gorm:"column:weakness_summary;type:text"`
	LearningPreference *string        `gorm:"column:learning_preference;type:text"`
	ResumeSnapshot     *string        `gorm:"column:resume_snapshot;type:text"`
	CreatedAt          time.Time      `gorm:"column:created_at;not null"`
	UpdatedAt          time.Time      `gorm:"column:updated_at;not null"`
	DeletedAt          gorm.DeletedAt `gorm:"column:deleted_at;index:idx_deleted_at"`
}

func (LearningProfile) TableName() string { return "learning_profile" }
