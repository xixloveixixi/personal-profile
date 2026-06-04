package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
)

// LearningProfileRepo learning_profile 表操作。
type LearningProfileRepo struct {
	db *gorm.DB
}

func NewLearningProfileRepo(db *gorm.DB) *LearningProfileRepo {
	return &LearningProfileRepo{db: db}
}

func (r *LearningProfileRepo) FindByOwnerID(ownerID uint64) (*model.LearningProfile, error) {
	var p model.LearningProfile
	err := r.db.Where("owner_id = ?", ownerID).First(&p).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &p, err
}

func (r *LearningProfileRepo) Upsert(p *model.LearningProfile) (*model.LearningProfile, error) {
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
	existing.TargetRole = p.TargetRole
	existing.BackgroundSummary = p.BackgroundSummary
	existing.SkillSummary = p.SkillSummary
	existing.WeaknessSummary = p.WeaknessSummary
	existing.LearningPreference = p.LearningPreference
	existing.ResumeSnapshot = p.ResumeSnapshot
	if err := r.db.Save(existing).Error; err != nil {
		return nil, err
	}
	return existing, nil
}
