// Package model 存放 GORM model 定义。
package model

import (
	"encoding/json"
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// PortfolioProject 对应 portfolio_project 表。
type PortfolioProject struct {
	ID               uint64         `gorm:"column:id;primaryKey;autoIncrement"`
	OwnerID          uint64         `gorm:"column:owner_id;not null"`
	Slug             string         `gorm:"column:slug;size:128;not null"`
	Title            string         `gorm:"column:title;size:255;not null;default:''"`
	ShortDescription string         `gorm:"column:short_description;size:512;not null;default:''"`
	LongDescription  string         `gorm:"column:long_description;type:text"`
	Problem          string         `gorm:"column:problem;type:text"`
	Solution         string         `gorm:"column:solution;type:text"`
	Challenges       string         `gorm:"column:challenges;type:text"`
	Results          string         `gorm:"column:results;type:text"`
	GithubURL        string         `gorm:"column:github_url;size:512;not null;default:''"`
	DemoURL          string         `gorm:"column:demo_url;size:512;not null;default:''"`
	FeaturedImage    string         `gorm:"column:featured_image;size:512;not null;default:''"`
	Technologies     datatypes.JSON `gorm:"column:technologies;type:json"`
	Gallery          datatypes.JSON `gorm:"column:gallery;type:json"`
	Featured         bool           `gorm:"column:featured;not null;default:0"`
	IsPublic         bool           `gorm:"column:is_public;not null;default:1"`
	SortOrder        int            `gorm:"column:sort_order;not null;default:0"`
	PublishedAt      *time.Time     `gorm:"column:published_at;type:date"`
	CreatedAt        time.Time      `gorm:"column:created_at;not null"`
	UpdatedAt        time.Time      `gorm:"column:updated_at;not null"`
	DeletedAt        gorm.DeletedAt `gorm:"column:deleted_at;index:idx_deleted_at"`
}

// TableName 强制使用单数表名 portfolio_project。
func (PortfolioProject) TableName() string { return "portfolio_project" }

// StringsToJSON 将 []string 序列化为 GORM JSON 类型。
func StringsToJSON(strs []string) datatypes.JSON {
	if len(strs) == 0 {
		return datatypes.JSON(`[]`)
	}
	bs, _ := json.Marshal(strs)
	return datatypes.JSON(bs)
}

// getJSONStrings 从 GORM JSON 字段解析出 []string。
func getJSONStrings(data datatypes.JSON) []string {
	if len(data) == 0 {
		return nil
	}
	var out []string
	if err := json.Unmarshal(data, &out); err != nil {
		return nil
	}
	return out
}

// dateToString 将 *time.Time 转为 "2006-01-02" 字符串。
func dateToString(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format("2006-01-02")
}
