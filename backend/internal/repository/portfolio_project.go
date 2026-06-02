// Package repository 封装 GORM 操作层，handler 不直接调 GORM。
package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
)

// PortfolioProjectRepo portfolio_project 表操作。
type PortfolioProjectRepo struct {
	db *gorm.DB
}

// NewPortfolioProjectRepo 构造函数，注入 *gorm.DB。
func NewPortfolioProjectRepo(db *gorm.DB) *PortfolioProjectRepo {
	return &PortfolioProjectRepo{db: db}
}

// FindPublicByOwnerID 查询 is_public=1 的记录，
// 按 sort_order ASC 排序。
func (r *PortfolioProjectRepo) FindPublicByOwnerID(ownerID uint64) ([]model.PortfolioProject, error) {
	var projects []model.PortfolioProject
	err := r.db.
		Where("owner_id = ? AND is_public = 1", ownerID).
		Order("sort_order ASC, id ASC").
		Find(&projects).Error
	if err != nil {
		return nil, err
	}
	return projects, nil
}

// FindByOwnerIDAndSlug 按 owner_id + slug 查询公开详情。
func (r *PortfolioProjectRepo) FindByOwnerIDAndSlug(ownerID uint64, slug string) (*model.PortfolioProject, error) {
	var p model.PortfolioProject
	err := r.db.
		Where("owner_id = ? AND slug = ? AND is_public = 1", ownerID, slug).
		First(&p).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// FindAllByOwnerID 查询全量记录（含隐藏），
// 按 sort_order ASC, id ASC 排序。
func (r *PortfolioProjectRepo) FindAllByOwnerID(ownerID uint64) ([]model.PortfolioProject, error) {
	var projects []model.PortfolioProject
	err := r.db.
		Where("owner_id = ?", ownerID).
		Order("sort_order ASC, id ASC").
		Find(&projects).Error
	if err != nil {
		return nil, err
	}
	return projects, nil
}

// FindByID 按主键查询，不存在返回 ErrNotFound。
func (r *PortfolioProjectRepo) FindByID(id uint64) (*model.PortfolioProject, error) {
	var p model.PortfolioProject
	err := r.db.First(&p, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// Create 插入新 project。
func (r *PortfolioProjectRepo) Create(p *model.PortfolioProject) error {
	return r.db.Create(p).Error
}

// Update 全量 Save project（所有字段均被替换）。
func (r *PortfolioProjectRepo) Update(p *model.PortfolioProject) error {
	return r.db.Save(p).Error
}

// Delete 软删：GORM 自动写入 deleted_at。
func (r *PortfolioProjectRepo) Delete(id uint64) error {
	return r.db.Delete(&model.PortfolioProject{}, id).Error
}