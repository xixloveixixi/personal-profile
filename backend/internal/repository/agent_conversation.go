package repository

import (
	"github.com/jiangyixi/personal-profile/backend/internal/model"
	"gorm.io/gorm"
)

type AgentConversationRepo struct{ db *gorm.DB }

func NewAgentConversationRepo(db *gorm.DB) *AgentConversationRepo {
	return &AgentConversationRepo{db: db}
}

func (r *AgentConversationRepo) FindByOwnerID(ownerID uint64) ([]model.AgentConversation, error) {
	var list []model.AgentConversation
	err := r.db.Where("owner_id = ?", ownerID).Order("updated_at DESC").Find(&list).Error
	return list, err
}

func (r *AgentConversationRepo) FindByID(id uint64) (*model.AgentConversation, error) {
	var conv model.AgentConversation
	if err := r.db.First(&conv, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &conv, nil
}

func (r *AgentConversationRepo) Delete(id uint64) error {
	result := r.db.Delete(&model.AgentConversation{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}
