package repository

import (
	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
)

// LearningProgressRepo learning_progress 表操作。
type LearningProgressRepo struct {
	db *gorm.DB
}

func NewLearningProgressRepo(db *gorm.DB) *LearningProgressRepo {
	return &LearningProgressRepo{db: db}
}

func (r *LearningProgressRepo) FindByTaskID(taskID uint64) ([]model.LearningProgress, error) {
	var logs []model.LearningProgress
	err := r.db.Where("task_id = ?", taskID).Order("logged_at DESC").Find(&logs).Error
	return logs, err
}

func (r *LearningProgressRepo) Create(progress *model.LearningProgress) error {
	return r.db.Create(progress).Error
}
