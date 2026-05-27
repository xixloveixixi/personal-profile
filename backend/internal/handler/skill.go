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

// SkillHandler 技能接口集合。
type SkillHandler struct {
	repo *repository.PublicSkillRepo
}

// NewSkillHandler 构造函数。
func NewSkillHandler(repo *repository.PublicSkillRepo) *SkillHandler {
	return &SkillHandler{repo: repo}
}

// skillPublicDTO 公开接口出参（不含 isPublic）。
type skillPublicDTO struct {
	ID               uint64 `json:"id"`
	Name             string `json:"name"`
	Category         string `json:"category"`
	ProficiencyLevel string `json:"proficiencyLevel"`
	Description      string `json:"description"`
	SortOrder        int    `json:"sortOrder"`
}

// skillAdminDTO 管理接口出参（含 isPublic）。
type skillAdminDTO struct {
	ID               uint64 `json:"id"`
	Name             string `json:"name"`
	Category         string `json:"category"`
	ProficiencyLevel string `json:"proficiencyLevel"`
	Description      string `json:"description"`
	IsPublic         bool   `json:"isPublic"`
	SortOrder        int    `json:"sortOrder"`
}

func toSkillPublicDTO(s *model.PublicSkill) skillPublicDTO {
	return skillPublicDTO{
		ID:               s.ID,
		Name:             s.Name,
		Category:         s.Category,
		ProficiencyLevel: s.ProficiencyLevel,
		Description:      s.Description,
		SortOrder:        s.SortOrder,
	}
}

func toSkillAdminDTO(s *model.PublicSkill) skillAdminDTO {
	return skillAdminDTO{
		ID:               s.ID,
		Name:             s.Name,
		Category:         s.Category,
		ProficiencyLevel: s.ProficiencyLevel,
		Description:      s.Description,
		IsPublic:         s.IsPublic,
		SortOrder:        s.SortOrder,
	}
}

// skillWriteReq POST / PUT 请求体。
// IsPublic 用指针区分"未传"（nil）与"传 false"。
type skillWriteReq struct {
	Name             string `json:"name"`
	Category         string `json:"category"`
	ProficiencyLevel string `json:"proficiencyLevel"`
	Description      string `json:"description"`
	IsPublic         *bool  `json:"isPublic"`
	SortOrder        int    `json:"sortOrder"`
}

// GetPublicSkills GET /api/public/skills。
// 仅返回 is_public=1 的记录；空时返回 []，不返回 null。
func (h *SkillHandler) GetPublicSkills(c *gin.Context) {
	skills, err := h.repo.FindPublicByOwnerID(config.OwnerID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	result := make([]skillPublicDTO, 0, len(skills))
	for i := range skills {
		result = append(result, toSkillPublicDTO(&skills[i]))
	}
	OK(c, result)
}

// GetAdminSkills GET /api/admin/skills。
// 返回全量（含隐藏），额外含 isPublic 字段。
func (h *SkillHandler) GetAdminSkills(c *gin.Context) {
	skills, err := h.repo.FindAllByOwnerID(config.OwnerID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	result := make([]skillAdminDTO, 0, len(skills))
	for i := range skills {
		result = append(result, toSkillAdminDTO(&skills[i]))
	}
	OK(c, result)
}

// CreateSkill POST /api/admin/skills。
// name 必填（≤64 字）；isPublic 未传时默认 true。
func (h *SkillHandler) CreateSkill(c *gin.Context) {
	var req skillWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		Fail(c, http.StatusBadRequest, 40001, "name 不能为空")
		return
	}
	if len([]rune(name)) > 64 {
		Fail(c, http.StatusBadRequest, 40001, "name 长度不能超过 64")
		return
	}

	isPublic := true
	if req.IsPublic != nil {
		isPublic = *req.IsPublic
	}

	skill := &model.PublicSkill{
		OwnerID:          config.OwnerID,
		Name:             name,
		Category:         req.Category,
		ProficiencyLevel: req.ProficiencyLevel,
		Description:      req.Description,
		IsPublic:         isPublic,
		SortOrder:        req.SortOrder,
	}
	if err := h.repo.Create(skill); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "创建失败")
		return
	}
	OK(c, toSkillAdminDTO(skill))
}

// UpdateSkill PUT /api/admin/skills/:id。
// 先 FindByID（不存在返回 40400），再全量 Save。
// name 若请求体中传入非空则更新，否则保留原值。
func (h *SkillHandler) UpdateSkill(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 参数无效")
		return
	}

	existing, err := h.repo.FindByID(id)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "skill 不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}

	var req skillWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}

	// name：若请求中提供了非空值则更新，否则保留原值
	name := strings.TrimSpace(req.Name)
	if name != "" {
		if len([]rune(name)) > 64 {
			Fail(c, http.StatusBadRequest, 40001, "name 长度不能超过 64")
			return
		}
		existing.Name = name
	}

	// 其余字段全量覆盖（前端需先 GET 全量再回传）
	existing.Category = req.Category
	existing.ProficiencyLevel = req.ProficiencyLevel
	existing.Description = req.Description
	existing.SortOrder = req.SortOrder
	if req.IsPublic != nil {
		existing.IsPublic = *req.IsPublic
	}

	if err := h.repo.Update(existing); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "更新失败")
		return
	}
	OK(c, toSkillAdminDTO(existing))
}

// DeleteSkill DELETE /api/admin/skills/:id。
// 先 FindByID（不存在返回 40400），再软删。
func (h *SkillHandler) DeleteSkill(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 参数无效")
		return
	}

	if _, err := h.repo.FindByID(id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			Fail(c, http.StatusNotFound, 40400, "skill 不存在")
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
