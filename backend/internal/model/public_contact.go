// Package model 存放 GORM model 定义。
package model

import (
	"time"

	"gorm.io/gorm"
)

// PublicContact 对应 public_contact 表。
type PublicContact struct {
	ID        uint64         `gorm:"column:id;primaryKey;autoIncrement"`
	OwnerID   uint64         `gorm:"column:owner_id;not null"`
	Platform  string         `gorm:"column:platform;size:64;not null"`
	Label     string         `gorm:"column:label;size:128;not null;default:''"`
	URL       string         `gorm:"column:url;size:512;not null;default:''"`
	Icon      string         `gorm:"column:icon;size:64;not null;default:''"`
	IsPublic  bool           `gorm:"column:is_public;not null;default:1"`
	SortOrder int            `gorm:"column:sort_order;not null;default:0"`
	CreatedAt time.Time      `gorm:"column:created_at;not null"`
	UpdatedAt time.Time      `gorm:"column:updated_at;not null"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index:idx_deleted_at"`
}

// TableName 强制使用单数表名 public_contact。
func (PublicContact) TableName() string { return "public_contact" }
