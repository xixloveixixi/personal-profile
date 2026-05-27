// Package model 存放 GORM model 定义。
package model

import (
	"time"

	"gorm.io/gorm"
)

// PublicSkill 对应 public_skill 表。
type PublicSkill struct {
	ID               uint64         `gorm:"column:id;primaryKey;autoIncrement"`
	OwnerID          uint64         `gorm:"column:owner_id;not null"`
	Name             string         `gorm:"column:name;size:64;not null"`
	Category         string         `gorm:"column:category;size:64;not null;default:''"`
	ProficiencyLevel string         `gorm:"column:proficiency_level;size:32;not null;default:''"`
	Description      string         `gorm:"column:description;size:512;not null;default:''"`
	IsPublic         bool           `gorm:"column:is_public;not null;default:1"`
	SortOrder        int            `gorm:"column:sort_order;not null;default:0"`
	CreatedAt        time.Time      `gorm:"column:created_at;not null"`
	UpdatedAt        time.Time      `gorm:"column:updated_at;not null"`
	DeletedAt        gorm.DeletedAt `gorm:"column:deleted_at;index:idx_deleted_at"`
}

// TableName 强制使用单数表名 public_skill。
func (PublicSkill) TableName() string { return "public_skill" }
