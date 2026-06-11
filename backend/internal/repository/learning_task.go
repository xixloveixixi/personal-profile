package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
)

// LearningTaskRepo learning_task 表操作。
type LearningTaskRepo struct {
	db *gorm.DB
}

func NewLearningTaskRepo(db *gorm.DB) *LearningTaskRepo {
	return &LearningTaskRepo{db: db}
}

func (r *LearningTaskRepo) FindByPlanID(planID uint64) ([]model.LearningTask, error) {
	var tasks []model.LearningTask
	err := r.db.Where("plan_id = ?", planID).Order("sort_order ASC, id ASC").Find(&tasks).Error
	return tasks, err
}

func (r *LearningTaskRepo) FindByID(id uint64) (*model.LearningTask, error) {
	var t model.LearningTask
	err := r.db.First(&t, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &t, err
}

func (r *LearningTaskRepo) Create(task *model.LearningTask) error {
	return r.db.Create(task).Error
}

func (r *LearningTaskRepo) Update(task *model.LearningTask) error {
	return r.db.Save(task).Error
}

func (r *LearningTaskRepo) Delete(id uint64) error {
	result := r.db.Delete(&model.LearningTask{}, id)
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}

// DeleteByPlanID 软删除计划下的所有任务。
func (r *LearningTaskRepo) DeleteByPlanID(planID uint64) error {
	return r.db.Where("plan_id = ?", planID).Delete(&model.LearningTask{}).Error
}

// IncrementActualMinutes 增加任务的实际耗时。
func (r *LearningTaskRepo) IncrementActualMinutes(taskID uint64, minutes int) error {
	return r.db.Model(&model.LearningTask{}).Where("id = ?", taskID).
		UpdateColumn("actual_minutes", gorm.Expr("actual_minutes + ?", minutes)).Error
}
