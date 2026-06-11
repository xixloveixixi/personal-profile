package handler

import (
	"errors"
	"io"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/repository"
)

// AgentConversationHandler Agent 对话接口。
type AgentConversationHandler struct {
	convRepo *repository.AgentConversationRepo
	msgRepo  *repository.AgentMessageRepo
}

func NewAgentConversationHandler(convRepo *repository.AgentConversationRepo, msgRepo *repository.AgentMessageRepo) *AgentConversationHandler {
	return &AgentConversationHandler{convRepo: convRepo, msgRepo: msgRepo}
}

type agentConversationDTO struct {
	ID        uint64 `json:"id"`
	Title     string `json:"title"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

// GetConversations GET /api/private/agent/conversations
func (h *AgentConversationHandler) GetConversations(c *gin.Context) {
	ownerID := getOwnerIDFromContext(c)
	convs, err := h.convRepo.FindByOwnerID(ownerID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	list := make([]agentConversationDTO, len(convs))
	for i := range convs {
		list[i] = agentConversationDTO{
			ID:        convs[i].ID,
			Title:     convs[i].Title,
			Status:    convs[i].Status,
			CreatedAt: convs[i].CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
			UpdatedAt: convs[i].UpdatedAt.UTC().Format("2006-01-02T15:04:05Z"),
		}
	}
	OK(c, list)
}

// DeleteConversation DELETE /api/private/agent/conversations/:id
func (h *AgentConversationHandler) DeleteConversation(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 格式错误")
		return
	}
	// 验证存在
	_, err = h.convRepo.FindByID(id)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "对话不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	// 级联删除消息
	_ = h.msgRepo.DeleteByConversationID(id)
	if err := h.convRepo.Delete(id); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "删除失败")
		return
	}
	OK(c, gin.H{"id": id})
}

// agentServiceURL 返回 Python Agent 服务地址。
func agentServiceURL() string {
	if v := os.Getenv("AGENT_SERVICE_URL"); v != "" {
		return v
	}
	return "http://localhost:8000"
}

// ProxyGeneratePlan 代理调用 Python agent-service 的 generate plan 接口。
func ProxyGeneratePlan(c *gin.Context) {
	url := agentServiceURL() + "/api/generate/plan"

	req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, url, c.Request.Body)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "构建请求失败")
		return
	}
	req.Header.Set("Content-Type", "application/json")
	if auth := c.GetHeader("Authorization"); auth != "" {
		req.Header.Set("Authorization", auth)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		Fail(c, http.StatusBadGateway, 50200, "Agent 服务不可用")
		return
	}
	defer resp.Body.Close()

	c.Status(resp.StatusCode)
	for k, vs := range resp.Header {
		for _, v := range vs {
			c.Header(k, v)
		}
	}
	io.Copy(c.Writer, resp.Body)
}
