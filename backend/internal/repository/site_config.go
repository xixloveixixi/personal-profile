// Package repository 封装 GORM 操作层，handler 不直接调 GORM。
package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
)

// SiteConfigRepo site_config 表操作（全局 K-V，无 owner_id）。
type SiteConfigRepo struct {
	db *gorm.DB
}

// NewSiteConfigRepo 构造函数，注入 *gorm.DB。
func NewSiteConfigRepo(db *gorm.DB) *SiteConfigRepo {
	return &SiteConfigRepo{db: db}
}

// FindAll 查询全量配置，按 config_key ASC 排序。
func (r *SiteConfigRepo) FindAll() ([]model.SiteConfig, error) {
	var cfgs []model.SiteConfig
	err := r.db.Order("config_key ASC").Find(&cfgs).Error
	if err != nil {
		return nil, err
	}
	return cfgs, nil
}

// Upsert 按 config_key upsert 单条配置：
//   - 不存在则 Create；valueType 为空时默认 "string"。
//   - 已存在则更新 ConfigValue / ValueType / Description；
//     valueType 为空时保留原有值。
//
// 返回写入后的最终对象。
func (r *SiteConfigRepo) Upsert(key, value, valueType, description string) (*model.SiteConfig, error) {
	var cfg model.SiteConfig
	err := r.db.Where("config_key = ?", key).First(&cfg).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		// 新建
		if valueType == "" {
			valueType = "string"
		}
		cfg = model.SiteConfig{
			ConfigKey:   key,
			ConfigValue: value,
			ValueType:   valueType,
			Description: description,
		}
		if err := r.db.Create(&cfg).Error; err != nil {
			return nil, err
		}
		return &cfg, nil
	}

	if err != nil {
		return nil, err
	}

	// 更新已有记录
	cfg.ConfigValue = value
	if valueType != "" {
		cfg.ValueType = valueType
	}
	// description 始终覆盖（允许传空字符串清空描述）
	cfg.Description = description
	if err := r.db.Save(&cfg).Error; err != nil {
		return nil, err
	}
	return &cfg, nil
}
