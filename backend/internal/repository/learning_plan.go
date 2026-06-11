package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
)

// LearningPlanRepo learning_plan 表操作。
type LearningPlanRepo struct {
	db *gorm.DB
}

func NewLearningPlanRepo(db *gorm.DB) *LearningPlanRepo {
	return &LearningPlanRepo{db: db}
}

func (r *LearningPlanRepo) FindAllByOwnerID(ownerID uint64) ([]model.LearningPlan, error) {
	var plans []model.LearningPlan
	err := r.db.Where("owner_id = ?", ownerID).Order("created_at DESC").Find(&plans).Error
	return plans, err
}

func (r *LearningPlanRepo) FindByID(id uint64) (*model.LearningPlan, error) {
	var p model.LearningPlan
	err := r.db.First(&p, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &p, err
}

func (r *LearningPlanRepo) Create(plan *model.LearningPlan) error {
	return r.db.Create(plan).Error
}

func (r *LearningPlanRepo) Update(plan *model.LearningPlan) error {
	return r.db.Save(plan).Error
}

func (r *LearningPlanRepo) Delete(id uint64) error {
	result := r.db.Delete(&model.LearningPlan{}, id)
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}

// IncrementTotalTasks 增加计划的任务总数。
func (r *LearningPlanRepo) IncrementTotalTasks(planID uint64) error {
	return r.db.Model(&model.LearningPlan{}).Where("id = ?", planID).
		UpdateColumn("total_tasks", gorm.Expr("total_tasks + 1")).Error
}

// DecrementTotalTasks 减少计划的任务总数。
func (r *LearningPlanRepo) DecrementTotalTasks(planID uint64) error {
	return r.db.Model(&model.LearningPlan{}).Where("id = ?", planID).
		UpdateColumn("total_tasks", gorm.Expr("total_tasks - 1")).Error
}

// IncrementCompletedTasks 增加计划的已完成任务数。
func (r *LearningPlanRepo) IncrementCompletedTasks(planID uint64) error {
	return r.db.Model(&model.LearningPlan{}).Where("id = ?", planID).
		UpdateColumn("completed_tasks", gorm.Expr("completed_tasks + 1")).Error
}

// DecrementCompletedTasks 减少计划的已完成任务数。
func (r *LearningPlanRepo) DecrementCompletedTasks(planID uint64) error {
	return r.db.Model(&model.LearningPlan{}).Where("id = ?", planID).
		UpdateColumn("completed_tasks", gorm.Expr("completed_tasks - 1")).Error
}
