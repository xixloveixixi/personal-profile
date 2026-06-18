package handler

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
	"github.com/jiangyixi/personal-profile/backend/internal/repository"
)

// LearningPlanHandler 学习计划接口。
type LearningPlanHandler struct {
	planRepo     *repository.LearningPlanRepo
	taskRepo     *repository.LearningTaskRepo
	progressRepo *repository.LearningProgressRepo
	goalRepo     *repository.LearningGoalRepo
	profileRepo  *repository.LearningProfileRepo
}

func NewLearningPlanHandler(
	planRepo *repository.LearningPlanRepo,
	taskRepo *repository.LearningTaskRepo,
	progressRepo *repository.LearningProgressRepo,
	goalRepo *repository.LearningGoalRepo,
	profileRepo *repository.LearningProfileRepo,
) *LearningPlanHandler {
	return &LearningPlanHandler{
		planRepo:     planRepo,
		taskRepo:     taskRepo,
		progressRepo: progressRepo,
		goalRepo:     goalRepo,
		profileRepo:  profileRepo,
	}
}

func (h *LearningPlanHandler) syncPlanStatus(planID uint64) {
	plan, err := h.planRepo.FindByID(planID)
	if err != nil {
		return
	}

	nextStatus := plan.Status
	switch {
	case plan.TotalTasks > 0 && plan.CompletedTasks >= plan.TotalTasks:
		nextStatus = "completed"
	case plan.CompletedTasks > 0:
		nextStatus = "active"
	case plan.TotalTasks > 0 && plan.Status == "completed":
		nextStatus = "active"
	}

	if nextStatus == plan.Status {
		return
	}

	plan.Status = nextStatus
	_ = h.planRepo.Update(plan)
}

// ==================== Plan DTOs ====================

type learningPlanDTO struct {
	ID             uint64  `json:"id"`
	GoalID         *uint64 `json:"goalId"`
	Title          string  `json:"title"`
	Description    *string `json:"description"`
	Source         string  `json:"source"`
	Status         string  `json:"status"`
	StartDate      *string `json:"startDate"`
	EndDate        *string `json:"endDate"`
	TotalTasks     int     `json:"totalTasks"`
	CompletedTasks int     `json:"completedTasks"`
}

func toLearningPlanDTO(p *model.LearningPlan) learningPlanDTO {
	return learningPlanDTO{
		ID:             p.ID,
		GoalID:         p.GoalID,
		Title:          p.Title,
		Description:    p.Description,
		Source:         p.Source,
		Status:         p.Status,
		StartDate:      p.StartDate,
		EndDate:        p.EndDate,
		TotalTasks:     p.TotalTasks,
		CompletedTasks: p.CompletedTasks,
	}
}

type createPlanReq struct {
	GoalID      *uint64 `json:"goalId"`
	Title       string  `json:"title"`
	Description *string `json:"description"`
	Source      string  `json:"source"`
	Status      string  `json:"status"`
	StartDate   *string `json:"startDate"`
	EndDate     *string `json:"endDate"`
}

// ==================== Task DTOs ====================

type learningTaskDTO struct {
	ID               uint64  `json:"id"`
	PlanID           uint64  `json:"planId"`
	Title            string  `json:"title"`
	Description      *string `json:"description"`
	TaskType         string  `json:"taskType"`
	Status           string  `json:"status"`
	Priority         int     `json:"priority"`
	EstimatedMinutes int     `json:"estimatedMinutes"`
	ActualMinutes    int     `json:"actualMinutes"`
	DueDate          *string `json:"dueDate"`
	CompletedAt      *string `json:"completedAt"`
	SortOrder        int     `json:"sortOrder"`
}

func toLearningTaskDTO(t *model.LearningTask) learningTaskDTO {
	var completedAt *string
	if t.CompletedAt != nil {
		s := t.CompletedAt.Format(time.RFC3339)
		completedAt = &s
	}
	return learningTaskDTO{
		ID:               t.ID,
		PlanID:           t.PlanID,
		Title:            t.Title,
		Description:      t.Description,
		TaskType:         t.TaskType,
		Status:           t.Status,
		Priority:         t.Priority,
		EstimatedMinutes: t.EstimatedMinutes,
		ActualMinutes:    t.ActualMinutes,
		DueDate:          t.DueDate,
		CompletedAt:      completedAt,
		SortOrder:        t.SortOrder,
	}
}

type createTaskReq struct {
	Title            string  `json:"title"`
	Description      *string `json:"description"`
	TaskType         string  `json:"taskType"`
	Status           string  `json:"status"`
	Priority         int     `json:"priority"`
	EstimatedMinutes int     `json:"estimatedMinutes"`
	DueDate          *string `json:"dueDate"`
	SortOrder        int     `json:"sortOrder"`
}

// ==================== Progress DTOs ====================

type learningProgressDTO struct {
	ID           uint64  `json:"id"`
	TaskID       uint64  `json:"taskId"`
	MinutesSpent int     `json:"minutesSpent"`
	Note         *string `json:"note"`
	LoggedAt     string  `json:"loggedAt"`
}

func toLearningProgressDTO(p *model.LearningProgress) learningProgressDTO {
	return learningProgressDTO{
		ID:           p.ID,
		TaskID:       p.TaskID,
		MinutesSpent: p.MinutesSpent,
		Note:         p.Note,
		LoggedAt:     p.LoggedAt.Format(time.RFC3339),
	}
}

type createProgressReq struct {
	MinutesSpent int     `json:"minutesSpent"`
	Note         *string `json:"note"`
}

// ==================== Plan Handlers ====================

// GetPlans GET /api/private/learning/plans
func (h *LearningPlanHandler) GetPlans(c *gin.Context) {
	ownerID := getOwnerIDFromContext(c)
	plans, err := h.planRepo.FindAllByOwnerID(ownerID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	list := make([]learningPlanDTO, len(plans))
	for i := range plans {
		list[i] = toLearningPlanDTO(&plans[i])
	}
	OK(c, list)
}

// CreatePlan POST /api/private/learning/plans
func (h *LearningPlanHandler) CreatePlan(c *gin.Context) {
	var req createPlanReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}
	if req.Title == "" {
		Fail(c, http.StatusBadRequest, 40001, "title 不能为空")
		return
	}
	ownerID := getOwnerIDFromContext(c)
	plan := &model.LearningPlan{
		OwnerID:     ownerID,
		GoalID:      req.GoalID,
		Title:       req.Title,
		Description: req.Description,
		Source:      defaultStr(req.Source, "manual"),
		Status:      defaultStr(req.Status, "draft"),
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
	}
	if err := h.planRepo.Create(plan); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "创建失败")
		return
	}
	OK(c, toLearningPlanDTO(plan))
}

// UpdatePlan PUT /api/private/learning/plans/:id
func (h *LearningPlanHandler) UpdatePlan(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 格式错误")
		return
	}
	plan, err := h.planRepo.FindByID(id)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "计划不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	var req createPlanReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}
	if req.Title != "" {
		plan.Title = req.Title
	}
	plan.GoalID = req.GoalID
	plan.Description = req.Description
	if req.Source != "" {
		plan.Source = req.Source
	}
	if req.Status != "" {
		plan.Status = req.Status
	}
	plan.StartDate = req.StartDate
	plan.EndDate = req.EndDate

	if err := h.planRepo.Update(plan); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "更新失败")
		return
	}
	OK(c, toLearningPlanDTO(plan))
}

// DeletePlan DELETE /api/private/learning/plans/:id
func (h *LearningPlanHandler) DeletePlan(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 格式错误")
		return
	}
	// 级联软删关联的 learning_task
	_ = h.taskRepo.DeleteByPlanID(id)

	if err := h.planRepo.Delete(id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			Fail(c, http.StatusNotFound, 40400, "计划不存在")
			return
		}
		Fail(c, http.StatusInternalServerError, 50000, "删除失败")
		return
	}
	OK(c, gin.H{"id": id})
}

// GeneratePlan POST /api/private/learning/plans/generate（返回 mock 数据，AI 调用后续单独实现）
func (h *LearningPlanHandler) GeneratePlan(c *gin.Context) {
	type genReq struct {
		GoalID      uint64  `json:"goalId"`
		Preferences *string `json:"preferences"`
	}
	var req genReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}
	if req.GoalID == 0 {
		Fail(c, http.StatusBadRequest, 40001, "goalId 不能为空")
		return
	}

	// 验证 goal 存在
	_, err := h.goalRepo.FindByID(req.GoalID)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusBadRequest, 40001, "目标不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询目标失败")
		return
	}

	// 返回 mock 数据（AI 调用后续单独实现）
	mockPlan := gin.H{
		"title":       "AI 生成的学习计划（Mock）",
		"description": "这是一个 mock 计划，后续会接入 DeepSeek API 生成真实计划。",
		"startDate":   time.Now().Format("2006-01-02"),
		"endDate":     time.Now().AddDate(0, 1, 0).Format("2006-01-02"),
	}
	mockTasks := []gin.H{
		{
			"title":            "学习基础概念",
			"description":      "阅读官方文档，理解核心概念",
			"taskType":         "learning",
			"estimatedMinutes": 60,
			"sortOrder":        1,
		},
		{
			"title":            "动手实践",
			"description":      "完成一个小型练习项目",
			"taskType":         "practice",
			"estimatedMinutes": 120,
			"sortOrder":        2,
		},
	}
	OK(c, gin.H{
		"plan":  mockPlan,
		"tasks": mockTasks,
	})
}

// ==================== Task Handlers ====================

// GetTasks GET /api/private/learning/plans/:planId/tasks
func (h *LearningPlanHandler) GetTasks(c *gin.Context) {
	planID, err := strconv.ParseUint(c.Param("planId"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "planId 格式错误")
		return
	}
	// 验证 plan 存在
	_, err = h.planRepo.FindByID(planID)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "计划不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询计划失败")
		return
	}

	tasks, err := h.taskRepo.FindByPlanID(planID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	list := make([]learningTaskDTO, len(tasks))
	for i := range tasks {
		list[i] = toLearningTaskDTO(&tasks[i])
	}
	OK(c, list)
}

// CreateTask POST /api/private/learning/plans/:planId/tasks
func (h *LearningPlanHandler) CreateTask(c *gin.Context) {
	planID, err := strconv.ParseUint(c.Param("planId"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "planId 格式错误")
		return
	}
	// 验证 plan 存在
	_, err = h.planRepo.FindByID(planID)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "计划不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询计划失败")
		return
	}

	var req createTaskReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}
	if req.Title == "" {
		Fail(c, http.StatusBadRequest, 40001, "title 不能为空")
		return
	}
	ownerID := getOwnerIDFromContext(c)
	task := &model.LearningTask{
		OwnerID:          ownerID,
		PlanID:           planID,
		Title:            req.Title,
		Description:      req.Description,
		TaskType:         defaultStr(req.TaskType, "learning"),
		Status:           defaultStr(req.Status, "pending"),
		Priority:         req.Priority,
		EstimatedMinutes: req.EstimatedMinutes,
		DueDate:          req.DueDate,
		SortOrder:        req.SortOrder,
	}
	if err := h.taskRepo.Create(task); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "创建失败")
		return
	}
	// 更新计划的任务总数
	_ = h.planRepo.IncrementTotalTasks(planID)
	if task.Status == "completed" {
		now := time.Now()
		task.CompletedAt = &now
		_ = h.planRepo.IncrementCompletedTasks(planID)
	}
	h.syncPlanStatus(planID)

	OK(c, toLearningTaskDTO(task))
}

// UpdateTask PUT /api/private/learning/tasks/:id
func (h *LearningPlanHandler) UpdateTask(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 格式错误")
		return
	}
	task, err := h.taskRepo.FindByID(id)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "任务不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	oldStatus := task.Status

	var req createTaskReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}
	if req.Title != "" {
		task.Title = req.Title
	}
	task.Description = req.Description
	if req.TaskType != "" {
		task.TaskType = req.TaskType
	}
	if req.Status != "" {
		task.Status = req.Status
	}
	task.Priority = req.Priority
	task.EstimatedMinutes = req.EstimatedMinutes
	task.DueDate = req.DueDate
	task.SortOrder = req.SortOrder

	// 状态改为 completed 时自动更新 completed_at
	if req.Status == "completed" && oldStatus != "completed" {
		now := time.Now()
		task.CompletedAt = &now
		// 更新计划的已完成任务数
		_ = h.planRepo.IncrementCompletedTasks(task.PlanID)
	}
	// 从 completed 改为其他状态时清除 completed_at 并减少计数
	if req.Status != "completed" && oldStatus == "completed" {
		task.CompletedAt = nil
		_ = h.planRepo.DecrementCompletedTasks(task.PlanID)
	}

	if err := h.taskRepo.Update(task); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "更新失败")
		return
	}
	h.syncPlanStatus(task.PlanID)
	OK(c, toLearningTaskDTO(task))
}

// DeleteTask DELETE /api/private/learning/tasks/:id
func (h *LearningPlanHandler) DeleteTask(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 格式错误")
		return
	}
	task, err := h.taskRepo.FindByID(id)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "任务不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	planID := task.PlanID
	wasCompleted := task.Status == "completed"

	if err := h.taskRepo.Delete(id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			Fail(c, http.StatusNotFound, 40400, "任务不存在")
			return
		}
		Fail(c, http.StatusInternalServerError, 50000, "删除失败")
		return
	}
	// 更新计划的任务总数
	_ = h.planRepo.DecrementTotalTasks(planID)
	// 如果删除的是已完成任务，还需减少已完成数
	if wasCompleted {
		_ = h.planRepo.DecrementCompletedTasks(planID)
	}
	h.syncPlanStatus(planID)

	OK(c, gin.H{"id": id})
}

// ==================== Progress Handlers ====================

// GetProgress GET /api/private/learning/tasks/:taskId/progress
func (h *LearningPlanHandler) GetProgress(c *gin.Context) {
	taskID, err := strconv.ParseUint(c.Param("taskId"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "taskId 格式错误")
		return
	}
	// 验证 task 存在
	_, err = h.taskRepo.FindByID(taskID)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "任务不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询任务失败")
		return
	}

	logs, err := h.progressRepo.FindByTaskID(taskID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	list := make([]learningProgressDTO, len(logs))
	for i := range logs {
		list[i] = toLearningProgressDTO(&logs[i])
	}
	OK(c, list)
}

// CreateProgress POST /api/private/learning/tasks/:taskId/progress
func (h *LearningPlanHandler) CreateProgress(c *gin.Context) {
	taskID, err := strconv.ParseUint(c.Param("taskId"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "taskId 格式错误")
		return
	}
	// 验证 task 存在
	_, err = h.taskRepo.FindByID(taskID)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "任务不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询任务失败")
		return
	}

	var req createProgressReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}
	if req.MinutesSpent <= 0 {
		Fail(c, http.StatusBadRequest, 40001, "minutesSpent 必须大于 0")
		return
	}
	ownerID := getOwnerIDFromContext(c)
	progress := &model.LearningProgress{
		OwnerID:      ownerID,
		TaskID:       taskID,
		MinutesSpent: req.MinutesSpent,
		Note:         req.Note,
		LoggedAt:     time.Now(),
	}
	if err := h.progressRepo.Create(progress); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "创建失败")
		return
	}
	// 累加 learning_task.actual_minutes
	_ = h.taskRepo.IncrementActualMinutes(taskID, req.MinutesSpent)

	OK(c, toLearningProgressDTO(progress))
}
