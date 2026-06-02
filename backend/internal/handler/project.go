package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/config"
	"github.com/jiangyixi/personal-profile/backend/internal/model"
	"github.com/jiangyixi/personal-profile/backend/internal/repository"
	"gorm.io/datatypes"
)

// ProjectHandler 项目接口集合。
type ProjectHandler struct {
	repo *repository.PortfolioProjectRepo
}

// NewProjectHandler 构造函数。
func NewProjectHandler(repo *repository.PortfolioProjectRepo) *ProjectHandler {
	return &ProjectHandler{repo: repo}
}

// projectPublicDTO 公开接口出参。
type projectPublicDTO struct {
	ID               uint64   `json:"id"`
	Slug             string   `json:"slug"`
	Title            string   `json:"title"`
	ShortDescription string   `json:"shortDescription"`
	LongDescription  string   `json:"longDescription"`
	Problem          string   `json:"problem"`
	Solution         string   `json:"solution"`
	Challenges       string   `json:"challenges"`
	Results          string   `json:"results"`
	GithubURL        string   `json:"githubUrl"`
	DemoURL          string   `json:"demoUrl"`
	FeaturedImage    string   `json:"featuredImage"`
	Technologies     []string `json:"technologies"`
	Gallery          []string `json:"gallery"`
	Featured         bool     `json:"featured"`
	SortOrder        int      `json:"sortOrder"`
	PublishedAt      string   `json:"publishedAt"`
}

// projectAdminDTO 管理接口出参（含 isPublic）。
type projectAdminDTO struct {
	ID               uint64   `json:"id"`
	Slug             string   `json:"slug"`
	Title            string   `json:"title"`
	ShortDescription string   `json:"shortDescription"`
	LongDescription  string   `json:"longDescription"`
	Problem          string   `json:"problem"`
	Solution         string   `json:"solution"`
	Challenges       string   `json:"challenges"`
	Results          string   `json:"results"`
	GithubURL        string   `json:"githubUrl"`
	DemoURL          string   `json:"demoUrl"`
	FeaturedImage    string   `json:"featuredImage"`
	Technologies     []string `json:"technologies"`
	Gallery          []string `json:"gallery"`
	Featured         bool     `json:"featured"`
	IsPublic         bool     `json:"isPublic"`
	SortOrder        int      `json:"sortOrder"`
	PublishedAt      string   `json:"publishedAt"`
}

// projectWriteReq POST / PUT 请求体。
type projectWriteReq struct {
	Slug             *string  `json:"slug"`
	Title            *string  `json:"title"`
	ShortDescription *string  `json:"shortDescription"`
	LongDescription  *string  `json:"longDescription"`
	Problem          *string  `json:"problem"`
	Solution         *string  `json:"solution"`
	Challenges       *string  `json:"challenges"`
	Results          *string  `json:"results"`
	GithubURL        *string  `json:"githubUrl"`
	DemoURL          *string  `json:"demoUrl"`
	FeaturedImage    *string  `json:"featuredImage"`
	Technologies     []string `json:"technologies"`
	Gallery          []string `json:"gallery"`
	Featured         *bool    `json:"featured"`
	IsPublic         *bool    `json:"isPublic"`
	SortOrder        *int     `json:"sortOrder"`
	PublishedAt      *string  `json:"publishedAt"`
}

// jsonStrings 将 datatypes.JSON 解析为 []string。
func jsonStrings(data datatypes.JSON) []string {
	if len(data) == 0 {
		return nil
	}
	var out []string
	if err := json.Unmarshal(data, &out); err != nil {
		return nil
	}
	return out
}

// dateString 将 *time.Time 转为 "2006-01-02" 字符串。
func dateString(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format("2006-01-02")
}

// stringsToJSON 将 []string 序列化为 datatypes.JSON。
func stringsToJSON(strs []string) datatypes.JSON {
	if len(strs) == 0 {
		return datatypes.JSON(`[]`)
	}
	bs, _ := json.Marshal(strs)
	return datatypes.JSON(bs)
}

// modelToPublicDTO 将 model 转为公开 DTO。
func modelToPublicDTO(p *model.PortfolioProject) projectPublicDTO {
	return projectPublicDTO{
		ID:               p.ID,
		Slug:             p.Slug,
		Title:            p.Title,
		ShortDescription: p.ShortDescription,
		LongDescription:  p.LongDescription,
		Problem:          p.Problem,
		Solution:         p.Solution,
		Challenges:       p.Challenges,
		Results:          p.Results,
		GithubURL:        p.GithubURL,
		DemoURL:          p.DemoURL,
		FeaturedImage:    p.FeaturedImage,
		Technologies:     jsonStrings(p.Technologies),
		Gallery:          jsonStrings(p.Gallery),
		Featured:         p.Featured,
		SortOrder:        p.SortOrder,
		PublishedAt:      dateString(p.PublishedAt),
	}
}

// modelToAdminDTO 将 model 转为管理 DTO。
func modelToAdminDTO(p *model.PortfolioProject) projectAdminDTO {
	return projectAdminDTO{
		ID:               p.ID,
		Slug:             p.Slug,
		Title:            p.Title,
		ShortDescription: p.ShortDescription,
		LongDescription:  p.LongDescription,
		Problem:          p.Problem,
		Solution:         p.Solution,
		Challenges:       p.Challenges,
		Results:          p.Results,
		GithubURL:        p.GithubURL,
		DemoURL:          p.DemoURL,
		FeaturedImage:    p.FeaturedImage,
		Technologies:     jsonStrings(p.Technologies),
		Gallery:          jsonStrings(p.Gallery),
		Featured:         p.Featured,
		IsPublic:         p.IsPublic,
		SortOrder:        p.SortOrder,
		PublishedAt:      dateString(p.PublishedAt),
	}
}

// applyProjectWriteReq 将请求体应用到 model。
func applyProjectWriteReq(p *model.PortfolioProject, req *projectWriteReq) {
	if req.Slug != nil {
		p.Slug = *req.Slug
	}
	if req.Title != nil {
		p.Title = *req.Title
	}
	if req.ShortDescription != nil {
		p.ShortDescription = *req.ShortDescription
	}
	if req.LongDescription != nil {
		p.LongDescription = *req.LongDescription
	}
	if req.Problem != nil {
		p.Problem = *req.Problem
	}
	if req.Solution != nil {
		p.Solution = *req.Solution
	}
	if req.Challenges != nil {
		p.Challenges = *req.Challenges
	}
	if req.Results != nil {
		p.Results = *req.Results
	}
	if req.GithubURL != nil {
		p.GithubURL = *req.GithubURL
	}
	if req.DemoURL != nil {
		p.DemoURL = *req.DemoURL
	}
	if req.FeaturedImage != nil {
		p.FeaturedImage = *req.FeaturedImage
	}
	if len(req.Technologies) > 0 {
		p.Technologies = stringsToJSON(req.Technologies)
	}
	if len(req.Gallery) > 0 {
		p.Gallery = stringsToJSON(req.Gallery)
	}
	if req.Featured != nil {
		p.Featured = *req.Featured
	}
	if req.IsPublic != nil {
		p.IsPublic = *req.IsPublic
	}
	if req.SortOrder != nil {
		p.SortOrder = *req.SortOrder
	}
}

// GetPublicProjects GET /api/public/projects。
// 仅返回 is_public=1 的记录；空时返回 []。
func (h *ProjectHandler) GetPublicProjects(c *gin.Context) {
	projects, err := h.repo.FindPublicByOwnerID(config.OwnerID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	result := make([]projectPublicDTO, 0, len(projects))
	for i := range projects {
		result = append(result, modelToPublicDTO(&projects[i]))
	}
	OK(c, result)
}

// GetProjectBySlug GET /api/public/projects/:slug。
// 按 slug 查找公开项目，不存在返回 40400。
func (h *ProjectHandler) GetProjectBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		Fail(c, http.StatusBadRequest, 40001, "slug 参数无效")
		return
	}

	p, err := h.repo.FindByOwnerIDAndSlug(config.OwnerID, slug)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "项目不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	OK(c, modelToPublicDTO(p))
}

// GetAdminProjects GET /api/admin/projects。
// 返回全量（含隐藏），额外含 isPublic 字段。
func (h *ProjectHandler) GetAdminProjects(c *gin.Context) {
	projects, err := h.repo.FindAllByOwnerID(config.OwnerID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	result := make([]projectAdminDTO, 0, len(projects))
	for i := range projects {
		result = append(result, modelToAdminDTO(&projects[i]))
	}
	OK(c, result)
}

// CreateProject POST /api/admin/projects。
// title 必填（≤255 字）；slug 必填（≤128 字，唯一）。
func (h *ProjectHandler) CreateProject(c *gin.Context) {
	var req projectWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}

	// 必填校验
	if req.Title == nil || strings.TrimSpace(*req.Title) == "" {
		Fail(c, http.StatusBadRequest, 40001, "title 不能为空")
		return
	}
	if req.Slug == nil || strings.TrimSpace(*req.Slug) == "" {
		Fail(c, http.StatusBadRequest, 40001, "slug 不能为空")
		return
	}

	title := strings.TrimSpace(*req.Title)
	if len([]rune(title)) > 255 {
		Fail(c, http.StatusBadRequest, 40001, "title 长度不能超过 255")
		return
	}
	slug := strings.TrimSpace(*req.Slug)
	if len([]rune(slug)) > 128 {
		Fail(c, http.StatusBadRequest, 40001, "slug 长度不能超过 128")
		return
	}

	p := &model.PortfolioProject{
		OwnerID: config.OwnerID,
		Slug:    slug,
		Title:   title,
	}
	applyProjectWriteReq(p, &req)

	if err := h.repo.Create(p); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "创建失败")
		return
	}
	OK(c, modelToAdminDTO(p))
}

// UpdateProject PUT /api/admin/projects/:id。
// 先 FindByID（不存在返回 40400），再全量 Save。
func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 参数无效")
		return
	}

	existing, err := h.repo.FindByID(id)
	if errors.Is(err, repository.ErrNotFound) {
		Fail(c, http.StatusNotFound, 40400, "项目不存在")
		return
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}

	var req projectWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}

	// slug 长度校验
	if req.Slug != nil {
		slug := strings.TrimSpace(*req.Slug)
		if len([]rune(slug)) > 128 {
			Fail(c, http.StatusBadRequest, 40001, "slug 长度不能超过 128")
			return
		}
	}
	// title 长度校验
	if req.Title != nil {
		title := strings.TrimSpace(*req.Title)
		if len([]rune(title)) > 255 {
			Fail(c, http.StatusBadRequest, 40001, "title 长度不能超过 255")
			return
		}
	}

	applyProjectWriteReq(existing, &req)

	if err := h.repo.Update(existing); err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "更新失败")
		return
	}
	OK(c, modelToAdminDTO(existing))
}

// DeleteProject DELETE /api/admin/projects/:id。
// 先 FindByID（不存在返回 40400），再软删。
func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		Fail(c, http.StatusBadRequest, 40001, "id 参数无效")
		return
	}

	if _, err := h.repo.FindByID(id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			Fail(c, http.StatusNotFound, 40400, "项目不存在")
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
