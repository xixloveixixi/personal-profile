package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/config"
	"github.com/jiangyixi/personal-profile/backend/internal/model"
	"github.com/jiangyixi/personal-profile/backend/internal/repository"
)

// ProfileHandler 公开个人信息接口集合。
type ProfileHandler struct {
	repo *repository.PublicProfileRepo
}

// NewProfileHandler 构造函数。
func NewProfileHandler(repo *repository.PublicProfileRepo) *ProfileHandler {
	return &ProfileHandler{repo: repo}
}

// profileDTO 出参 DTO（与 api-contract.md 对齐）。
type profileDTO struct {
	ID           uint64 `json:"id"`
	DisplayName  string `json:"displayName"`
	Headline     string `json:"headline"`
	Bio          string `json:"bio"`
	AvatarURL    string `json:"avatarUrl"`
	CurrentFocus string `json:"currentFocus"`
	Location     string `json:"location"`
	Visibility   string `json:"visibility"`
}

func toProfileDTO(p *model.PublicProfile) profileDTO {
	return profileDTO{
		ID:           p.ID,
		DisplayName:  p.DisplayName,
		Headline:     p.Headline,
		Bio:          p.Bio,
		AvatarURL:    p.AvatarURL,
		CurrentFocus: p.CurrentFocus,
		Location:     p.Location,
		Visibility:   p.Visibility,
	}
}

// profileUpsertReq PUT /api/admin/profile 请求体。
type profileUpsertReq struct {
	DisplayName  string `json:"displayName"`
	Headline     string `json:"headline"`
	Bio          string `json:"bio"`
	AvatarURL    string `json:"avatarUrl"`
	CurrentFocus string `json:"currentFocus"`
	Location     string `json:"location"`
	Visibility   string `json:"visibility"`
}

// GetPublic GET /api/public/profile。
func (h *ProfileHandler) GetPublic(c *gin.Context) {
	h.get(c)
}

// GetAdmin GET /api/admin/profile（同 public，鉴权由路由层控制）。
func (h *ProfileHandler) GetAdmin(c *gin.Context) {
	h.get(c)
}

func (h *ProfileHandler) get(c *gin.Context) {
	p, err := h.repo.FindByOwnerID(config.OwnerID)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "profile 尚未配置")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	OK(c, toProfileDTO(p))
}

// Put PUT /api/admin/profile：按 owner_id upsert。
func (h *ProfileHandler) Put(c *gin.Context) {
	var req profileUpsertReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}
	displayName := strings.TrimSpace(req.DisplayName)
	if displayName == "" {
		Fail(c, http.StatusBadRequest, 40001, "displayName 不能为空")
		return
	}
	if len(displayName) > 64 {
		Fail(c, http.StatusBadRequest, 40001, "displayName 长度不能超过 64")
		return
	}
	visibility := req.Visibility
	if visibility == "" {
		visibility = "public"
	}
	switch visibility {
	case "public", "private", "hidden":
	default:
		Fail(c, http.StatusBadRequest, 40001, "visibility 取值非法")
		return
	}

	p := &model.PublicProfile{
		OwnerID:      config.OwnerID,
		DisplayName:  displayName,
		Headline:     req.Headline,
		Bio:          req.Bio,
		AvatarURL:    req.AvatarURL,
		CurrentFocus: req.CurrentFocus,
		Location:     req.Location,
		Visibility:   visibility,
	}
	saved, err := h.repo.Upsert(p)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "保存失败")
		return
	}
	OK(c, toProfileDTO(saved))
}
