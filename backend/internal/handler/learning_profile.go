package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
	"github.com/jiangyixi/personal-profile/backend/internal/repository"
)

// LearningProfileHandler 学习画像接口。
type LearningProfileHandler struct {
	repo *repository.LearningProfileRepo
}

func NewLearningProfileHandler(repo *repository.LearningProfileRepo) *LearningProfileHandler {
	return &LearningProfileHandler{repo: repo}
}

type learningProfileDTO struct {
	ID                 uint64  `json:"id"`
	TargetRole         string  `json:"targetRole"`
	BackgroundSummary  *string `json:"backgroundSummary"`
	SkillSummary       *string `json:"skillSummary"`
	WeaknessSummary    *string `json:"weaknessSummary"`
	LearningPreference *string `json:"learningPreference"`
	ResumeSnapshot     *string `json:"resumeSnapshot"`
}

func toLearningProfileDTO(p *model.LearningProfile) learningProfileDTO {
	return learningProfileDTO{
		ID:                 p.ID,
		TargetRole:         p.TargetRole,
		BackgroundSummary:  p.BackgroundSummary,
		SkillSummary:       p.SkillSummary,
		WeaknessSummary:    p.WeaknessSummary,
		LearningPreference: p.LearningPreference,
		ResumeSnapshot:     p.ResumeSnapshot,
	}
}

type learningProfileReq struct {
	TargetRole         string  `json:"targetRole"`
	BackgroundSummary  *string `json:"backgroundSummary"`
	SkillSummary       *string `json:"skillSummary"`
	WeaknessSummary    *string `json:"weaknessSummary"`
	LearningPreference *string `json:"learningPreference"`
	ResumeSnapshot     *string `json:"resumeSnapshot"`
}

// GetLearningProfile GET /api/private/learning/profile
func (h *LearningProfileHandler) GetLearningProfile(c *gin.Context) {
	ownerID := getOwnerIDFromContext(c)
	p, err := h.repo.FindByOwnerID(ownerID)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "学习画像尚未配置")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	OK(c, toLearningProfileDTO(p))
}

// UpsertLearningProfile PUT /api/private/learning/profile
func (h *LearningProfileHandler) UpsertLearningProfile(c *gin.Context) {
	var req learningProfileReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}
	ownerID := getOwnerIDFromContext(c)
	p := &model.LearningProfile{
		OwnerID:            ownerID,
		TargetRole:         req.TargetRole,
		BackgroundSummary:  req.BackgroundSummary,
		SkillSummary:       req.SkillSummary,
		WeaknessSummary:    req.WeaknessSummary,
		LearningPreference: req.LearningPreference,
		ResumeSnapshot:     req.ResumeSnapshot,
	}
	saved, err := h.repo.Upsert(p)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "保存失败")
		return
	}
	OK(c, toLearningProfileDTO(saved))
}

// getOwnerIDFromContext 从 JWT context 中获取 user_id（float64 → uint64）。
func getOwnerIDFromContext(c *gin.Context) uint64 {
	v, _ := c.Get("user_id")
	if f, ok := v.(float64); ok {
		return uint64(f)
	}
	return 0
}
