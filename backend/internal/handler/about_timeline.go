package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"

	"github.com/jiangyixi/personal-profile/backend/internal/config"
	"github.com/jiangyixi/personal-profile/backend/internal/model"
	"github.com/jiangyixi/personal-profile/backend/internal/repository"
)

const timelineDateLayout = "2006-01-02"

// AboutTimelineHandler about timeline 接口集合。
type AboutTimelineHandler struct {
	repo *repository.AboutTimelineRepo
}

// NewAboutTimelineHandler 构造函数。
func NewAboutTimelineHandler(repo *repository.AboutTimelineRepo) *AboutTimelineHandler {
	return &AboutTimelineHandler{repo: repo}
}

// aboutTimelinePublicDTO 公开接口出参（不含 isPublic）。
type aboutTimelinePublicDTO struct {
	ID           uint64   `json:"id"`
	EntryID      string   `json:"entryId"`
	Type         string   `json:"type"`
	Title        string   `json:"title"`
	Organization string   `json:"organization"`
	Location     string   `json:"location"`
	StartDate    string   `json:"startDate"`
	EndDate      *string  `json:"endDate"`
	Description  string   `json:"description"`
	Achievements []string `json:"achievements"`
	Technologies []string `json:"technologies"`
	SortOrder    int      `json:"sortOrder"`
}

// aboutTimelineAdminDTO 管理接口出参（含 isPublic）。
type aboutTimelineAdminDTO struct {
	ID           uint64   `json:"id"`
	EntryID      string   `json:"entryId"`
	Type         string   `json:"type"`
	Title        string   `json:"title"`
	Organization string   `json:"organization"`
	Location     string   `json:"location"`
	StartDate    string   `json:"startDate"`
	EndDate      *string  `json:"endDate"`
	Description  string   `json:"description"`
	Achievements []string `json:"achievements"`
	Technologies []string `json:"technologies"`
	IsPublic     bool     `json:"isPublic"`
	SortOrder    int      `json:"sortOrder"`
}

type nullableStringField struct {
	Set   bool
	Value *string
}

func (f *nullableStringField) UnmarshalJSON(data []byte) error {
	f.Set = true
	if string(data) == "null" {
		f.Value = nil
		return nil
	}
	var value string
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	f.Value = &value
	return nil
}

// aboutTimelineWriteReq POST / PUT 请求体。
type aboutTimelineWriteReq struct {
	EntryID      *string             `json:"entryId"`
	Type         *string             `json:"type"`
	Title        *string             `json:"title"`
	Organization *string             `json:"organization"`
	Location     *string             `json:"location"`
	StartDate    *string             `json:"startDate"`
	EndDate      nullableStringField `json:"endDate"`
	Description  *string             `json:"description"`
	Achievements []string            `json:"achievements"`
	Technologies []string            `json:"technologies"`
	IsPublic     *bool               `json:"isPublic"`
	SortOrder    *int                `json:"sortOrder"`
}

func toTimelineStringSlice(data datatypes.JSON) []string {
	if len(data) == 0 {
		return []string{}
	}
	var out []string
	if err := json.Unmarshal(data, &out); err != nil {
		return []string{}
	}
	if out == nil {
		return []string{}
	}
	return out
}

func formatTimelineDate(date time.Time) string {
	return date.Format(timelineDateLayout)
}

func formatTimelineNullableDate(date *time.Time) *string {
	if date == nil {
		return nil
	}
	formatted := date.Format(timelineDateLayout)
	return &formatted
}

func parseRequiredDate(value string) (time.Time, error) {
	return time.Parse(timelineDateLayout, value)
}

func parseOptionalDate(value string) (*time.Time, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil, nil
	}
	parsed, err := time.Parse(timelineDateLayout, trimmed)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

func toAboutTimelinePublicDTO(item *model.AboutTimeline) aboutTimelinePublicDTO {
	return aboutTimelinePublicDTO{
		ID:           item.ID,
		EntryID:      item.EntryID,
		Type:         item.EntryType,
		Title:        item.Title,
		Organization: item.Organization,
		Location:     item.Location,
		StartDate:    formatTimelineDate(item.StartDate),
		EndDate:      formatTimelineNullableDate(item.EndDate),
		Description:  item.Description,
		Achievements: toTimelineStringSlice(item.Achievements),
		Technologies: toTimelineStringSlice(item.Technologies),
		SortOrder:    item.SortOrder,
	}
}

func toAboutTimelineAdminDTO(item *model.AboutTimeline) aboutTimelineAdminDTO {
	return aboutTimelineAdminDTO{
		ID:           item.ID,
		EntryID:      item.EntryID,
		Type:         item.EntryType,
		Title:        item.Title,
		Organization: item.Organization,
		Location:     item.Location,
		StartDate:    formatTimelineDate(item.StartDate),
		EndDate:      formatTimelineNullableDate(item.EndDate),
		Description:  item.Description,
		Achievements: toTimelineStringSlice(item.Achievements),
		Technologies: toTimelineStringSlice(item.Technologies),
		IsPublic:     item.IsPublic,
		SortOrder:    item.SortOrder,
	}
}

func validateTimelineType(value string) bool {
	return value == "education" || value == "work"
}

func (h *AboutTimelineHandler) applyCreateReq(req *aboutTimelineWriteReq) (*model.AboutTimeline, string) {
	if req.EntryID == nil || strings.TrimSpace(*req.EntryID) == "" {
		return nil, "entryId 不能为空"
	}
	entryID := strings.TrimSpace(*req.EntryID)
	if len([]rune(entryID)) > 128 {
		return nil, "entryId 长度不能超过 128"
	}

	if req.Type == nil || strings.TrimSpace(*req.Type) == "" {
		return nil, "type 不能为空"
	}
	entryType := strings.TrimSpace(*req.Type)
	if !validateTimelineType(entryType) {
		return nil, "type 仅支持 education 或 work"
	}

	if req.Title == nil || strings.TrimSpace(*req.Title) == "" {
		return nil, "title 不能为空"
	}
	title := strings.TrimSpace(*req.Title)
	if len([]rune(title)) > 128 {
		return nil, "title 长度不能超过 128"
	}

	if req.Organization == nil || strings.TrimSpace(*req.Organization) == "" {
		return nil, "organization 不能为空"
	}
	organization := strings.TrimSpace(*req.Organization)
	if len([]rune(organization)) > 128 {
		return nil, "organization 长度不能超过 128"
	}

	location := ""
	if req.Location != nil {
		location = strings.TrimSpace(*req.Location)
		if len([]rune(location)) > 128 {
			return nil, "location 长度不能超过 128"
		}
	}

	if req.StartDate == nil || strings.TrimSpace(*req.StartDate) == "" {
		return nil, "startDate 不能为空"
	}
	startDate, err := parseRequiredDate(strings.TrimSpace(*req.StartDate))
	if err != nil {
		return nil, "startDate 格式必须为 YYYY-MM-DD"
	}

	var endDate *time.Time
	if req.EndDate.Set {
		if req.EndDate.Value == nil {
			endDate = nil
		} else {
			endDate, err = parseOptionalDate(*req.EndDate.Value)
			if err != nil {
				return nil, "endDate 格式必须为 YYYY-MM-DD"
			}
		}
	}

	description := ""
	if req.Description != nil {
		description = *req.Description
		if len([]rune(description)) > 5000 {
			return nil, "description 长度不能超过 5000"
		}
	}

	isPublic := true
	if req.IsPublic != nil {
		isPublic = *req.IsPublic
	}

	sortOrder := 0
	if req.SortOrder != nil {
		sortOrder = *req.SortOrder
	}

	return &model.AboutTimeline{
		OwnerID:      config.OwnerID,
		EntryID:      entryID,
		EntryType:    entryType,
		Title:        title,
		Organization: organization,
		Location:     location,
		StartDate:    startDate,
		EndDate:      endDate,
		Description:  description,
		Achievements: model.StringsToJSONArray(req.Achievements),
		Technologies: model.StringsToJSONArray(req.Technologies),
		IsPublic:     isPublic,
		SortOrder:    sortOrder,
	}, ""
}

func (h *AboutTimelineHandler) applyUpdateReq(item *model.AboutTimeline, req *aboutTimelineWriteReq) string {
	if req.EntryID != nil {
		entryID := strings.TrimSpace(*req.EntryID)
		if entryID == "" {
			return "entryId 不能为空"
		}
		if len([]rune(entryID)) > 128 {
			return "entryId 长度不能超过 128"
		}
		item.EntryID = entryID
	}

	if req.Type != nil {
		entryType := strings.TrimSpace(*req.Type)
		if entryType == "" {
			return "type 不能为空"
		}
		if !validateTimelineType(entryType) {
			return "type 仅支持 education 或 work"
		}
		item.EntryType = entryType
	}

	if req.Title != nil {
		title := strings.TrimSpace(*req.Title)
		if title == "" {
			return "title 不能为空"
		}
		if len([]rune(title)) > 128 {
			return "title 长度不能超过 128"
		}
		item.Title = title
	}

	if req.Organization != nil {
		organization := strings.TrimSpace(*req.Organization)
		if organization == "" {
			return "organization 不能为空"
		}
		if len([]rune(organization)) > 128 {
			return "organization 长度不能超过 128"
		}
		item.Organization = organization
	}

	if req.Location != nil {
		location := strings.TrimSpace(*req.Location)
		if len([]rune(location)) > 128 {
			return "location 长度不能超过 128"
		}
		item.Location = location
	}

	if req.StartDate != nil {
		startDate := strings.TrimSpace(*req.StartDate)
		if startDate == "" {
			return "startDate 不能为空"
		}
		parsed, err := parseRequiredDate(startDate)
		if err != nil {
			return "startDate 格式必须为 YYYY-MM-DD"
		}
		item.StartDate = parsed
	}

	if req.EndDate.Set {
		if req.EndDate.Value == nil {
			item.EndDate = nil
		} else {
			parsed, err := parseOptionalDate(*req.EndDate.Value)
			if err != nil {
				return "endDate 格式必须为 YYYY-MM-DD"
			}
			item.EndDate = parsed
		}
	}

	if req.Description != nil {
		if len([]rune(*req.Description)) > 5000 {
			return "description 长度不能超过 5000"
		}
		item.Description = *req.Description
	}

	if req.Achievements != nil {
		item.Achievements = model.StringsToJSONArray(req.Achievements)
	}
	if req.Technologies != nil {
		item.Technologies = model.StringsToJSONArray(req.Technologies)
	}
	if req.IsPublic != nil {
		item.IsPublic = *req.IsPublic
	}
	if req.SortOrder != nil {
		item.SortOrder = *req.SortOrder
	}

	return ""
}

// GetPublicTimeline GET /api/public/about/timeline。
func (h *AboutTimelineHandler) GetPublicTimeline(c *gin.Context) {
	items, err := h.repo.FindPublicByOwnerID(config.OwnerID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	result := make([]aboutTimelinePublicDTO, 0, len(items))
	for i := range items {
		result = append(result, toAboutTimelinePublicDTO(&items[i]))
	}
	OK(c, result)
}

// GetAdminTimeline GET /api/admin/about/timeline。
func (h *AboutTimelineHandler) GetAdminTimeline(c *gin.Context) {
	items, err := h.repo.FindAllByOwnerID(config.OwnerID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	result := make([]aboutTimelineAdminDTO, 0, len(items))
	for i := range items {
		result = append(result, toAboutTimelineAdminDTO(&items[i]))
	}
	OK(c, result)
}

// CreateTimeline POST /api/admin/about/timeline。
func (h *AboutTimelineHandler) CreateTimeline(c *gin.Context) {
	var req aboutTimelineWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}

	item, msg := h.applyCreateReq(&req)
	if msg != "" {
		Fail(c, http.StatusBadRequest, 40001, msg)
		return
	}

	if err := h.repo.Create(item); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "创建失败")
		return
	}
	OK(c, toAboutTimelineAdminDTO(item))
}

// UpdateTimeline PUT /api/admin/about/timeline/:id。
func (h *AboutTimelineHandler) UpdateTimeline(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 参数无效")
		return
	}

	item, err := h.repo.FindByID(id)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "timeline 不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}

	var req aboutTimelineWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}

	if msg := h.applyUpdateReq(item, &req); msg != "" {
		Fail(c, http.StatusBadRequest, 40001, msg)
		return
	}

	if err := h.repo.Update(item); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "更新失败")
		return
	}
	OK(c, toAboutTimelineAdminDTO(item))
}

// DeleteTimeline DELETE /api/admin/about/timeline/:id。
func (h *AboutTimelineHandler) DeleteTimeline(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 参数无效")
		return
	}

	if _, err := h.repo.FindByID(id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			Fail(c, http.StatusNotFound, 40400, "timeline 不存在")
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
