package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
	"github.com/jiangyixi/personal-profile/backend/internal/repository"
)

// SiteConfigHandler 站点配置接口集合。
type SiteConfigHandler struct {
	repo *repository.SiteConfigRepo
}

// NewSiteConfigHandler 构造函数。
func NewSiteConfigHandler(repo *repository.SiteConfigRepo) *SiteConfigHandler {
	return &SiteConfigHandler{repo: repo}
}

// siteConfigDTO 公开/管理接口出参。
type siteConfigDTO struct {
	Key         string `json:"key"`
	Value       string `json:"value"`
	ValueType   string `json:"valueType"`
	Description string `json:"description"`
}

func toSiteConfigDTO(c *model.SiteConfig) siteConfigDTO {
	return siteConfigDTO{
		Key:         c.ConfigKey,
		Value:       c.ConfigValue,
		ValueType:   c.ValueType,
		Description: c.Description,
	}
}

// siteConfigWriteReq PUT 请求体。
type siteConfigWriteReq struct {
	Value       string `json:"value"`
	ValueType   string `json:"valueType"`
	Description string `json:"description"`
}

// GetPublicSiteConfig GET /api/public/site-config。
// 返回全量配置数组；空时返回 []，不返回 null。
func (h *SiteConfigHandler) GetPublicSiteConfig(c *gin.Context) {
	cfgs, err := h.repo.FindAll()
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	result := make([]siteConfigDTO, 0, len(cfgs))
	for i := range cfgs {
		result = append(result, toSiteConfigDTO(&cfgs[i]))
	}
	OK(c, result)
}

// GetAdminSiteConfig GET /api/admin/site-config。
// 与公开接口结构相同，便于后台列出全部 key 进行编辑。
func (h *SiteConfigHandler) GetAdminSiteConfig(c *gin.Context) {
	cfgs, err := h.repo.FindAll()
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "查询失败")
		return
	}
	result := make([]siteConfigDTO, 0, len(cfgs))
	for i := range cfgs {
		result = append(result, toSiteConfigDTO(&cfgs[i]))
	}
	OK(c, result)
}

// UpsertSiteConfig PUT /api/admin/site-config/:key。
// 按 path 中的 key upsert 单条配置；value 为必填字段。
func (h *SiteConfigHandler) UpsertSiteConfig(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		Fail(c, http.StatusBadRequest, 40001, "key 不能为空")
		return
	}

	var req siteConfigWriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}

	cfg, err := h.repo.Upsert(key, req.Value, req.ValueType, req.Description)
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "写入失败")
		return
	}
	OK(c, toSiteConfigDTO(cfg))
}
