package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
)

// LearningGoalRepo learning_goal 表操作。
type LearningGoalRepo struct {
	db *gorm.DB
}

func NewLearningGoalRepo(db *gorm.DB) *LearningGoalRepo {
	return &LearningGoalRepo{db: db}
}

func (r *LearningGoalRepo) FindAllByOwnerID(ownerID uint64) ([]model.LearningGoal, error) {
	var goals []model.LearningGoal
	err := r.db.Where("owner_id = ?", ownerID).Order("priority ASC, id ASC").Find(&goals).Error
	return goals, err
}

func (r *LearningGoalRepo) Create(goal *model.LearningGoal) error {
	return r.db.Create(goal).Error
}

func (r *LearningGoalRepo) FindByID(id uint64) (*model.LearningGoal, error) {
	var g model.LearningGoal
	err := r.db.First(&g, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &g, err
}

func (r *LearningGoalRepo) Update(goal *model.LearningGoal) error {
	return r.db.Save(goal).Error
}

func (r *LearningGoalRepo) Delete(id uint64) error {
	result := r.db.Delete(&model.LearningGoal{}, id)
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}
