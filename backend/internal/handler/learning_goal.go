package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
	"github.com/jiangyixi/personal-profile/backend/internal/repository"
)

// LearningGoalHandler 学习目标接口。
type LearningGoalHandler struct {
	repo *repository.LearningGoalRepo
}

func NewLearningGoalHandler(repo *repository.LearningGoalRepo) *LearningGoalHandler {
	return &LearningGoalHandler{repo: repo}
}

type learningGoalDTO struct {
	ID              uint64  `json:"id"`
	Title           string  `json:"title"`
	Description     *string `json:"description"`
	GoalType        string  `json:"goalType"`
	Priority        int     `json:"priority"`
	Deadline        *string `json:"deadline"`
	Status          string  `json:"status"`
	ProgressPercent int     `json:"progressPercent"`
}

func toLearningGoalDTO(g *model.LearningGoal) learningGoalDTO {
	return learningGoalDTO{
		ID:              g.ID,
		Title:           g.Title,
		Description:     g.Description,
		GoalType:        g.GoalType,
		Priority:        g.Priority,
		Deadline:        g.Deadline,
		Status:          g.Status,
		ProgressPercent: g.ProgressPercent,
	}
}

type learningGoalReq struct {
	Title           string  `json:"title"`
	Description     *string `json:"description"`
	GoalType        string  `json:"goalType"`
	Priority        int     `json:"priority"`
	Deadline        *string `json:"deadline"`
	Status          string  `json:"status"`
	ProgressPercent int     `json:"progressPercent"`
}

// GetLearningGoals GET /api/private/learning/goals
func (h *LearningGoalHandler) GetLearningGoals(c *gin.Context) {
	ownerID := getOwnerIDFromContext(c)
	goals, err := h.repo.FindAllByOwnerID(ownerID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	list := make([]learningGoalDTO, len(goals))
	for i := range goals {
		list[i] = toLearningGoalDTO(&goals[i])
	}
	OK(c, list)
}

// CreateLearningGoal POST /api/private/learning/goals
func (h *LearningGoalHandler) CreateLearningGoal(c *gin.Context) {
	var req learningGoalReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}
	if req.Title == "" {
		Fail(c, http.StatusBadRequest, 40001, "title 不能为空")
		return
	}
	ownerID := getOwnerIDFromContext(c)
	goal := &model.LearningGoal{
		OwnerID:         ownerID,
		Title:           req.Title,
		Description:     req.Description,
		GoalType:        defaultStr(req.GoalType, "skill"),
		Priority:        req.Priority,
		Deadline:        req.Deadline,
		Status:          defaultStr(req.Status, "not_started"),
		ProgressPercent: req.ProgressPercent,
	}
	if err := h.repo.Create(goal); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "创建失败")
		return
	}
	OK(c, toLearningGoalDTO(goal))
}

// UpdateLearningGoal PUT /api/private/learning/goals/:id
func (h *LearningGoalHandler) UpdateLearningGoal(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 格式错误")
		return
	}
	goal, err := h.repo.FindByID(id)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "目标不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	var req learningGoalReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}
	if req.Title != "" {
		goal.Title = req.Title
	}
	goal.Description = req.Description
	if req.GoalType != "" {
		goal.GoalType = req.GoalType
	}
	goal.Priority = req.Priority
	goal.Deadline = req.Deadline
	if req.Status != "" {
		goal.Status = req.Status
	}
	goal.ProgressPercent = req.ProgressPercent

	if err := h.repo.Update(goal); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "更新失败")
		return
	}
	OK(c, toLearningGoalDTO(goal))
}

// DeleteLearningGoal DELETE /api/private/learning/goals/:id
func (h *LearningGoalHandler) DeleteLearningGoal(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 格式错误")
		return
	}
	if err := h.repo.Delete(id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			Fail(c, http.StatusNotFound, 40400, "目标不存在")
			return
		}
		Fail(c, http.StatusInternalServerError, 50000, "删除失败")
		return
	}
	OK(c, gin.H{"id": id})
}

func defaultStr(v, def string) string {
	if v == "" {
		return def
	}
	return v
}
