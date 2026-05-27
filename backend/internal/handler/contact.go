package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/config"
	"github.com/jiangyixi/personal-profile/backend/internal/model"
	"github.com/jiangyixi/personal-profile/backend/internal/repository"
)

// ContactHandler 联系方式接口集合。
type ContactHandler struct {
	repo *repository.PublicContactRepo
}

// NewContactHandler 构造函数。
func NewContactHandler(repo *repository.PublicContactRepo) *ContactHandler {
	return &ContactHandler{repo: repo}
}

// contactPublicDTO 公开接口出参（不含 isPublic）。
type contactPublicDTO struct {
	ID        uint64 `json:"id"`
	Platform  string `json:"platform"`
	Label     string `json:"label"`
	URL       string `json:"url"`
	Icon      string `json:"icon"`
	SortOrder int    `json:"sortOrder"`
}

// contactAdminDTO 管理接口出参（含 isPublic）。
type contactAdminDTO struct {
	ID        uint64 `json:"id"`
	Platform  string `json:"platform"`
	Label     string `json:"label"`
	URL       string `json:"url"`
	Icon      string `json:"icon"`
	IsPublic  bool   `json:"isPublic"`
	SortOrder int    `json:"sortOrder"`
}

func toContactPublicDTO(c *model.PublicContact) contactPublicDTO {
	return contactPublicDTO{
		ID:        c.ID,
		Platform:  c.Platform,
		Label:     c.Label,
		URL:       c.URL,
		Icon:      c.Icon,
		SortOrder: c.SortOrder,
	}
}

func toContactAdminDTO(c *model.PublicContact) contactAdminDTO {
	return contactAdminDTO{
		ID:        c.ID,
		Platform:  c.Platform,
		Label:     c.Label,
		URL:       c.URL,
		Icon:      c.Icon,
		IsPublic:  c.IsPublic,
		SortOrder: c.SortOrder,
	}
}

// contactWriteReq POST / PUT 请求体。
// IsPublic 用指针区分"未传"（nil）与"传 false"。
type contactWriteReq struct {
	Platform  string `json:"platform"`
	Label     string `json:"label"`
	URL       string `json:"url"`
	Icon      string `json:"icon"`
	IsPublic  *bool  `json:"isPublic"`
	SortOrder int    `json:"sortOrder"`
}

// GetPublicContacts GET /api/public/contacts。
// 仅返回 is_public=1 的记录；空时返回 []，不返回 null。
func (h *ContactHandler) GetPublicContacts(c *gin.Context) {
	contacts, err := h.repo.FindPublicByOwnerID(config.OwnerID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	result := make([]contactPublicDTO, 0, len(contacts))
	for i := range contacts {
		result = append(result, toContactPublicDTO(&contacts[i]))
	}
	OK(c, result)
}

// GetAdminContacts GET /api/admin/contacts。
// 返回全量（含隐藏），额外含 isPublic 字段。
func (h *ContactHandler) GetAdminContacts(c *gin.Context) {
	contacts, err := h.repo.FindAllByOwnerID(config.OwnerID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	result := make([]contactAdminDTO, 0, len(contacts))
	for i := range contacts {
		result = append(result, toContactAdminDTO(&contacts[i]))
	}
	OK(c, result)
}

// CreateContact POST /api/admin/contacts。
// platform 必填（≤64 字）；isPublic 未传时默认 true。
func (h *ContactHandler) CreateContact(c *gin.Context) {
	var req contactWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}

	platform := strings.TrimSpace(req.Platform)
	if platform == "" {
		Fail(c, http.StatusBadRequest, 40001, "platform 不能为空")
		return
	}
	if len(platform) > 64 {
		Fail(c, http.StatusBadRequest, 40001, "platform 长度不能超过 64")
		return
	}

	isPublic := true
	if req.IsPublic != nil {
		isPublic = *req.IsPublic
	}

	contact := &model.PublicContact{
		OwnerID:   config.OwnerID,
		Platform:  platform,
		Label:     req.Label,
		URL:       req.URL,
		Icon:      req.Icon,
		IsPublic:  isPublic,
		SortOrder: req.SortOrder,
	}
	if err := h.repo.Create(contact); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "创建失败")
		return
	}
	OK(c, toContactAdminDTO(contact))
}

// UpdateContact PUT /api/admin/contacts/:id。
// 先 FindByID（不存在返回 40400），再全量 Save。
// platform 若请求体中未传（空串），保留原值；最终不能为空。
func (h *ContactHandler) UpdateContact(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 参数无效")
		return
	}

	existing, err := h.repo.FindByID(id)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "contact 不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}

	var req contactWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}

	// platform：若请求中提供了非空值则更新，否则保留原值
	platform := strings.TrimSpace(req.Platform)
	if platform != "" {
		if len(platform) > 64 {
			Fail(c, http.StatusBadRequest, 40001, "platform 长度不能超过 64")
			return
		}
		existing.Platform = platform
	}

	// 其余字段全量覆盖（前端需先 GET 全量再回传）
	existing.Label = req.Label
	existing.URL = req.URL
	existing.Icon = req.Icon
	existing.SortOrder = req.SortOrder
	if req.IsPublic != nil {
		existing.IsPublic = *req.IsPublic
	}

	if err := h.repo.Update(existing); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "更新失败")
		return
	}
	OK(c, toContactAdminDTO(existing))
}

// DeleteContact DELETE /api/admin/contacts/:id。
// 先 FindByID（不存在返回 40400），再软删。
func (h *ContactHandler) DeleteContact(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 参数无效")
		return
	}

	if _, err := h.repo.FindByID(id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			Fail(c, http.StatusNotFound, 40400, "contact 不存在")
			return
		}
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}

	if err := h.repo.Delete(id); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "删除失败")
		return
	}
	OK(c, gin.H{"id": id})
}
