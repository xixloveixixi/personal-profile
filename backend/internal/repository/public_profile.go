// Package repository 封装 GORM 操作层，handler 不直接调 GORM。
package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
)

// PublicProfileRepo public_profile 表操作。
type PublicProfileRepo struct {
	db *gorm.DB
}

// NewPublicProfileRepo 构造函数。
func NewPublicProfileRepo(db *gorm.DB) *PublicProfileRepo {
	return &PublicProfileRepo{db: db}
}

// ErrNotFound 资源不存在。
var ErrNotFound = errors.New("resource not found")

// FindByOwnerID 按 owner_id 查询单条 profile。
func (r *PublicProfileRepo) FindByOwnerID(ownerID uint64) (*model.PublicProfile, error) {
	var p model.PublicProfile
	err := r.db.Where("owner_id = ?", ownerID).First(&p).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// Upsert 按 owner_id upsert：无则 Create，有则用入参更新可写字段。
// 选择字段进行更新，OnConflict是全量更新
func (r *PublicProfileRepo) Upsert(p *model.PublicProfile) (*model.PublicProfile, error) {
	existing, err := r.FindByOwnerID(p.OwnerID)
	if err != nil && !errors.Is(err, ErrNotFound) {
		return nil, err
	}
	if existing == nil {
		if err := r.db.Create(p).Error; err != nil {
			return nil, err
		}
		return p, nil
	}
	existing.DisplayName = p.DisplayName
	existing.Headline = p.Headline
	existing.Bio = p.Bio
	existing.AvatarURL = p.AvatarURL
	existing.CurrentFocus = p.CurrentFocus
	existing.Location = p.Location
	existing.Visibility = p.Visibility
	if err := r.db.Save(existing).Error; err != nil {
		return nil, err
	}
	return existing, nil
}
