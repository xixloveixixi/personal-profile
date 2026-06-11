package model

import "time"

// AgentConversation 对应 agent_conversation 表。
type AgentConversation struct {
	ID        uint64    `gorm:"column:id;primaryKey;autoIncrement"`
	OwnerID   uint64    `gorm:"column:owner_id;not null"`
	Title     string    `gorm:"column:title;size:255;not null;default:''"`
	Status    string    `gorm:"column:status;size:32;not null;default:'active'"`
	Metadata  *string   `gorm:"column:metadata;type:json"`
	CreatedAt time.Time `gorm:"column:created_at;not null"`
	UpdatedAt time.Time `gorm:"column:updated_at;not null"`
}

func (AgentConversation) TableName() string { return "agent_conversation" }
