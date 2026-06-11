package repository

import (
	"github.com/jiangyixi/personal-profile/backend/internal/model"
	"gorm.io/gorm"
)

type AgentMessageRepo struct{ db *gorm.DB }

func NewAgentMessageRepo(db *gorm.DB) *AgentMessageRepo {
	return &AgentMessageRepo{db: db}
}

func (r *AgentMessageRepo) Create(msg *model.AgentMessage) error {
	return r.db.Create(msg).Error
}

func (r *AgentMessageRepo) FindByConversationID(conversationID uint64) ([]model.AgentMessage, error) {
	var list []model.AgentMessage
	err := r.db.Where("conversation_id = ?", conversationID).Order("created_at ASC").Find(&list).Error
	return list, err
}

func (r *AgentMessageRepo) DeleteByConversationID(conversationID uint64) error {
	return r.db.Where("conversation_id = ?", conversationID).Delete(&model.AgentMessage{}).Error
}
