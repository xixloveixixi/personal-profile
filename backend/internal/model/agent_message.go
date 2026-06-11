package model

import "time"

// AgentMessage 对应 agent_message 表。
type AgentMessage struct {
	ID             uint64    `gorm:"column:id;primaryKey;autoIncrement"`
	ConversationID uint64    `gorm:"column:conversation_id;not null"`
	Role           string    `gorm:"column:role;size:32;not null"`
	Content        string    `gorm:"column:content;type:text;not null"`
	ToolCalls      *string   `gorm:"column:tool_calls;type:json"`
	ToolCallID     *string   `gorm:"column:tool_call_id;size:64"`
	TokensUsed     int       `gorm:"column:tokens_used;not null;default:0"`
	CreatedAt      time.Time `gorm:"column:created_at;not null"`
}

func (AgentMessage) TableName() string { return "agent_message" }
