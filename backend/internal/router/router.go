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

	// 公开接口（无 DB 时使用简化版健康检查）
	if db == nil {
		api.GET("/health", handler.Health)
		return
	}

	// 健康检查（带日志记录）
	healthLogRepo := repository.NewHealthCheckLogRepo(db)
	healthHandler := handler.NewHealthHandler(healthLogRepo)
	api.GET("/health", healthHandler.Check)

	// Stage 3 认证（DB 校验）
	userRepo := repository.NewSysUserRepo(db)
	authHandler := handler.NewAuthHandler(userRepo)
	api.POST("/auth/login", authHandler.Login)

	// 受保护接口（需登录）
	private := api.Group("")
	private.Use(middleware.Auth())
	private.GET("/auth/me", authHandler.Me)

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

	// -- portfolio_project --
	projectRepo := repository.NewPortfolioProjectRepo(db)
	projectHandler := handler.NewProjectHandler(projectRepo)

	public := api.Group("/public")
	public.GET("/profile", profileHandler.GetPublic)
	public.GET("/contacts", contactHandler.GetPublicContacts)
	public.GET("/skills", skillHandler.GetPublicSkills)
	public.GET("/site-config", siteConfigHandler.GetPublicSiteConfig)
	public.GET("/projects", projectHandler.GetPublicProjects)
	public.GET("/projects/:slug", projectHandler.GetProjectBySlug)

	admin := api.Group("/admin")
	admin.Use(middleware.Auth(), middleware.RequireOwnerRole())
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
	admin.GET("/projects", projectHandler.GetAdminProjects)
	admin.POST("/projects", projectHandler.CreateProject)
	admin.PUT("/projects/:id", projectHandler.UpdateProject)
	admin.DELETE("/projects/:id", projectHandler.DeleteProject)

	// 健康检查统计
	healthStatsHandler := handler.NewHealthStatsHandler(healthLogRepo)
	admin.GET("/health-stats", healthStatsHandler.GetStats)

	// Stage 7 私有学习工作台
	learningProfileRepo := repository.NewLearningProfileRepo(db)
	learningProfileHandler := handler.NewLearningProfileHandler(learningProfileRepo)
	learningGoalRepo := repository.NewLearningGoalRepo(db)
	learningGoalHandler := handler.NewLearningGoalHandler(learningGoalRepo)

	privateGroup := api.Group("/private")
	privateGroup.Use(middleware.Auth(), middleware.RequireOwnerRole())
	privateGroup.GET("/learning/profile", learningProfileHandler.GetLearningProfile)
	privateGroup.PUT("/learning/profile", learningProfileHandler.UpsertLearningProfile)
	privateGroup.GET("/learning/goals", learningGoalHandler.GetLearningGoals)
	privateGroup.POST("/learning/goals", learningGoalHandler.CreateLearningGoal)
	privateGroup.PUT("/learning/goals/:id", learningGoalHandler.UpdateLearningGoal)
	privateGroup.DELETE("/learning/goals/:id", learningGoalHandler.DeleteLearningGoal)
}
