// Package model 存放 GORM model 定义。
package model

import (
	"time"

	"gorm.io/gorm"
)

// PublicProfile 对应 public_profile 表。
type PublicProfile struct {
	ID           uint64         `gorm:"column:id;primaryKey;autoIncrement"`
	OwnerID      uint64         `gorm:"column:owner_id;uniqueIndex:uk_owner;not null"`
	DisplayName  string         `gorm:"column:display_name;size:64;not null"`
	Headline     string         `gorm:"column:headline;size:255;not null;default:''"`
	Bio          string         `gorm:"column:bio;type:text"`
	AvatarURL    string         `gorm:"column:avatar_url;size:512;not null;default:''"`
	CurrentFocus string         `gorm:"column:current_focus;size:255;not null;default:''"`
	Location     string         `gorm:"column:location;size:128;not null;default:''"`
	Visibility   string         `gorm:"column:visibility;size:32;not null;default:'public'"`
	CreatedAt    time.Time      `gorm:"column:created_at;not null"`
	UpdatedAt    time.Time      `gorm:"column:updated_at;not null"`
	DeletedAt    gorm.DeletedAt `gorm:"column:deleted_at;index:idx_deleted_at"`
}

// TableName 强制使用单数表名 public_profile。
func (PublicProfile) TableName() string { return "public_profile" }
