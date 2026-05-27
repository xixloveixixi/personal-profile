// Package repository 封装 GORM 操作层，handler 不直接调 GORM。
package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
)

// PublicContactRepo public_contact 表操作。
// ErrNotFound 复用同包中 public_profile.go 已定义的哨兵错误。
type PublicContactRepo struct {
	db *gorm.DB
}

// NewPublicContactRepo 构造函数，注入 *gorm.DB。
func NewPublicContactRepo(db *gorm.DB) *PublicContactRepo {
	return &PublicContactRepo{db: db}
}

// FindPublicByOwnerID 查询 is_public=1 的记录，按 sort_order ASC, id ASC 排序。
func (r *PublicContactRepo) FindPublicByOwnerID(ownerID uint64) ([]model.PublicContact, error) {
	var contacts []model.PublicContact
	err := r.db.
		Where("owner_id = ? AND is_public = 1", ownerID).
		Order("sort_order ASC, id ASC").
		Find(&contacts).Error
	if err != nil {
		return nil, err
	}
	return contacts, nil
}

// FindAllByOwnerID 查询全量记录（含隐藏），按 sort_order ASC, id ASC 排序。
func (r *PublicContactRepo) FindAllByOwnerID(ownerID uint64) ([]model.PublicContact, error) {
	var contacts []model.PublicContact
	err := r.db.
		Where("owner_id = ?", ownerID).
		Order("sort_order ASC, id ASC").
		Find(&contacts).Error
	if err != nil {
		return nil, err
	}
	return contacts, nil
}

// Create 插入新 contact。
func (r *PublicContactRepo) Create(contact *model.PublicContact) error {
	return r.db.Create(contact).Error
}

// FindByID 按主键查询，不存在返回 ErrNotFound（复用同包哨兵）。
func (r *PublicContactRepo) FindByID(id uint64) (*model.PublicContact, error) {
	var c model.PublicContact
	err := r.db.First(&c, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// Update 全量 Save contact（所有字段均被替换）。
func (r *PublicContactRepo) Update(contact *model.PublicContact) error {
	return r.db.Save(contact).Error
}

// Delete 软删：GORM 自动写入 deleted_at。
func (r *PublicContactRepo) Delete(id uint64) error {
	return r.db.Delete(&model.PublicContact{}, id).Error
}
