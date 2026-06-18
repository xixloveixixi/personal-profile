// Package model 存放 GORM model 定义。
package model

import (
	"encoding/json"
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// AboutTimeline 对应 about_timeline 表。
type AboutTimeline struct {
	ID           uint64         `gorm:"column:id;primaryKey;autoIncrement"`
	OwnerID      uint64         `gorm:"column:owner_id;not null"`
	EntryID      string         `gorm:"column:entry_id;size:128;not null"`
	EntryType    string         `gorm:"column:entry_type;size:32;not null"`
	Title        string         `gorm:"column:title;size:128;not null"`
	Organization string         `gorm:"column:organization;size:128;not null"`
	Location     string         `gorm:"column:location;size:128;not null;default:''"`
	StartDate    time.Time      `gorm:"column:start_date;type:date;not null"`
	EndDate      *time.Time     `gorm:"column:end_date;type:date"`
	Description  string         `gorm:"column:description;type:text"`
	Achievements datatypes.JSON `gorm:"column:achievements;type:json"`
	Technologies datatypes.JSON `gorm:"column:technologies;type:json"`
	IsPublic     bool           `gorm:"column:is_public;not null;default:1"`
	SortOrder    int            `gorm:"column:sort_order;not null;default:0"`
	CreatedAt    time.Time      `gorm:"column:created_at;not null"`
	UpdatedAt    time.Time      `gorm:"column:updated_at;not null"`
	DeletedAt    gorm.DeletedAt `gorm:"column:deleted_at;index:idx_deleted_at"`
}

// TableName 强制使用单数表名 about_timeline。
func (AboutTimeline) TableName() string { return "about_timeline" }

// StringsToJSONArray 将 []string 序列化为 GORM JSON 类型。
func StringsToJSONArray(strs []string) datatypes.JSON {
	if len(strs) == 0 {
		return datatypes.JSON(`[]`)
	}
	bs, _ := json.Marshal(strs)
	return datatypes.JSON(bs)
}
