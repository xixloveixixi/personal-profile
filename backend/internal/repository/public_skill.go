// Package repository 封装 GORM 操作层，handler 不直接调 GORM。
package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
)

// PublicSkillRepo public_skill 表操作。
// ErrNotFound 复用同包中 public_profile.go 已定义的哨兵错误。
type PublicSkillRepo struct {
	db *gorm.DB
}

// NewPublicSkillRepo 构造函数，注入 *gorm.DB。
func NewPublicSkillRepo(db *gorm.DB) *PublicSkillRepo {
	return &PublicSkillRepo{db: db}
}

// FindPublicByOwnerID 查询 is_public=1 的记录，
// 按 category ASC, sort_order ASC, id ASC 排序。
func (r *PublicSkillRepo) FindPublicByOwnerID(ownerID uint64) ([]model.PublicSkill, error) {
	var skills []model.PublicSkill
	err := r.db.
		Where("owner_id = ? AND is_public = 1", ownerID).
		Order("category ASC, sort_order ASC, id ASC").
		Find(&skills).Error
	if err != nil {
		return nil, err
	}
	return skills, nil
}

// FindAllByOwnerID 查询全量记录（含隐藏），
// 按 category ASC, sort_order ASC, id ASC 排序。
func (r *PublicSkillRepo) FindAllByOwnerID(ownerID uint64) ([]model.PublicSkill, error) {
	var skills []model.PublicSkill
	err := r.db.
		Where("owner_id = ?", ownerID).
		Order("category ASC, sort_order ASC, id ASC").
		Find(&skills).Error
	if err != nil {
		return nil, err
	}
	return skills, nil
}

// Create 插入新 skill。
func (r *PublicSkillRepo) Create(skill *model.PublicSkill) error {
	return r.db.Create(skill).Error
}

// FindByID 按主键查询，不存在返回 ErrNotFound（复用同包哨兵）。
func (r *PublicSkillRepo) FindByID(id uint64) (*model.PublicSkill, error) {
	var s model.PublicSkill
	err := r.db.First(&s, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// Update 全量 Save skill（所有字段均被替换）。
func (r *PublicSkillRepo) Update(skill *model.PublicSkill) error {
	return r.db.Save(skill).Error
}

// Delete 软删：GORM 自动写入 deleted_at。
func (r *PublicSkillRepo) Delete(id uint64) error {
	return r.db.Delete(&model.PublicSkill{}, id).Error
}
