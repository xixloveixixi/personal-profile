package router

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/handler"
	"github.com/jiangyixi/personal-profile/backend/internal/middleware"
	"github.com/jiangyixi/personal-profile/backend/internal/repository"
)

// Setup 注册所有路由。db 为 nil 时跳过依赖 DB 的路由组（仅用于早期阶段调试）。
func Setup(r *gin.Engine, db *gorm.DB) {
	api := r.Group("/api")

	// Stage 1 公开接口
	api.GET("/health", handler.Health)
	api.POST("/auth/login", handler.Login)

	// Stage 1 受保护接口（需登录）
	private := api.Group("")
	private.Use(middleware.Auth())
	private.GET("/auth/me", handler.Me)

	if db == nil {
		return
	}

	// Stage 2 业务路由

	// -- public_profile --
	profileRepo := repository.NewPublicProfileRepo(db)
	profileHandler := handler.NewProfileHandler(profileRepo)

	// -- public_contact --
	contactRepo := repository.NewPublicContactRepo(db)
	contactHandler := handler.NewContactHandler(contactRepo)

	// -- public_skill --
	skillRepo := repository.NewPublicSkillRepo(db)
	skillHandler := handler.NewSkillHandler(skillRepo)

	// -- site_config --
	siteConfigRepo := repository.NewSiteConfigRepo(db)
	siteConfigHandler := handler.NewSiteConfigHandler(siteConfigRepo)

	public := api.Group("/public")
	public.GET("/profile", profileHandler.GetPublic)
	public.GET("/contacts", contactHandler.GetPublicContacts)
	public.GET("/skills", skillHandler.GetPublicSkills)
	public.GET("/site-config", siteConfigHandler.GetPublicSiteConfig)

	admin := api.Group("/admin")
	admin.Use(middleware.Auth())
	admin.GET("/profile", profileHandler.GetAdmin)
	admin.PUT("/profile", profileHandler.Put)
	admin.GET("/contacts", contactHandler.GetAdminContacts)
	admin.POST("/contacts", contactHandler.CreateContact)
	admin.PUT("/contacts/:id", contactHandler.UpdateContact)
	admin.DELETE("/contacts/:id", contactHandler.DeleteContact)
	admin.GET("/skills", skillHandler.GetAdminSkills)
	admin.POST("/skills", skillHandler.CreateSkill)
	admin.PUT("/skills/:id", skillHandler.UpdateSkill)
	admin.DELETE("/skills/:id", skillHandler.DeleteSkill)
	admin.GET("/site-config", siteConfigHandler.GetAdminSiteConfig)
	admin.PUT("/site-config/:key", siteConfigHandler.UpsertSiteConfig)
}
