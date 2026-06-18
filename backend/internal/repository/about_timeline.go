// Package repository 封装 GORM 操作层，handler 不直接调 GORM。
package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
)

// AboutTimelineRepo about_timeline 表操作。
type AboutTimelineRepo struct {
	db *gorm.DB
}

// NewAboutTimelineRepo 构造函数，注入 *gorm.DB。
func NewAboutTimelineRepo(db *gorm.DB) *AboutTimelineRepo {
	return &AboutTimelineRepo{db: db}
}

// FindPublicByOwnerID 查询 is_public=1 的记录，按 sort_order ASC, id ASC 排序。
func (r *AboutTimelineRepo) FindPublicByOwnerID(ownerID uint64) ([]model.AboutTimeline, error) {
	var items []model.AboutTimeline
	err := r.db.
		Where("owner_id = ? AND is_public = 1", ownerID).
		Order("sort_order ASC, id ASC").
		Find(&items).Error
	if err != nil {
		return nil, err
	}
	return items, nil
}

// FindAllByOwnerID 查询全量记录（含隐藏），按 sort_order ASC, id ASC 排序。
func (r *AboutTimelineRepo) FindAllByOwnerID(ownerID uint64) ([]model.AboutTimeline, error) {
	var items []model.AboutTimeline
	err := r.db.
		Where("owner_id = ?", ownerID).
		Order("sort_order ASC, id ASC").
		Find(&items).Error
	if err != nil {
		return nil, err
	}
	return items, nil
}

// Create 插入新 timeline 条目。
func (r *AboutTimelineRepo) Create(item *model.AboutTimeline) error {
	return r.db.Create(item).Error
}

// FindByID 按主键查询，不存在返回 ErrNotFound。
func (r *AboutTimelineRepo) FindByID(id uint64) (*model.AboutTimeline, error) {
	var item model.AboutTimeline
	err := r.db.First(&item, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// Update 全量 Save timeline 条目（所有字段均被替换）。
func (r *AboutTimelineRepo) Update(item *model.AboutTimeline) error {
	return r.db.Save(item).Error
}

// Delete 软删：GORM 自动写入 deleted_at。
func (r *AboutTimelineRepo) Delete(id uint64) error {
	return r.db.Delete(&model.AboutTimeline{}, id).Error
}
