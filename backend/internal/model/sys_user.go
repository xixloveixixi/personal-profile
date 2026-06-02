package model

import (
	"time"

	"gorm.io/gorm"
)

// SysUser 对应 sys_user 表。
type SysUser struct {
	ID           uint64         `gorm:"column:id;primaryKey;autoIncrement"`
	Username     string         `gorm:"column:username;size:64;uniqueIndex:uk_username;not null"`
	PasswordHash string         `gorm:"column:password_hash;size:255;not null"`
	Role         string         `gorm:"column:role;size:32;not null;default:'owner'"`
	DisplayName  string         `gorm:"column:display_name;size:64;not null;default:''"`
	Email        string         `gorm:"column:email;size:255;not null;default:''"`
	Status       int8           `gorm:"column:status;not null;default:1"`
	LastLoginAt  *time.Time     `gorm:"column:last_login_at"`
	CreatedAt    time.Time      `gorm:"column:created_at;not null"`
	UpdatedAt    time.Time      `gorm:"column:updated_at;not null"`
	DeletedAt    gorm.DeletedAt `gorm:"column:deleted_at;index:idx_deleted_at"`
}

func (SysUser) TableName() string { return "sys_user" }
