// Package model 存放 GORM model 定义。
package model

import (
	"time"

	"gorm.io/gorm"
)

// SiteConfig 对应 site_config 表（全局单例 K-V 表，无 owner_id）。
type SiteConfig struct {
	ID          uint64         `gorm:"column:id;primaryKey;autoIncrement"`
	ConfigKey   string         `gorm:"column:config_key;size:128;not null;uniqueIndex:uk_config_key"`
	ConfigValue string         `gorm:"column:config_value;type:text"`
	ValueType   string         `gorm:"column:value_type;size:32;not null;default:'string'"`
	Description string         `gorm:"column:description;size:255;not null;default:''"`
	CreatedAt   time.Time      `gorm:"column:created_at;not null"`
	UpdatedAt   time.Time      `gorm:"column:updated_at;not null"`
	DeletedAt   gorm.DeletedAt `gorm:"column:deleted_at;index:idx_deleted_at"`
}

// TableName 强制使用单数表名 site_config。
func (SiteConfig) TableName() string { return "site_config" }
