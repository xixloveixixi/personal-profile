package router

import (
	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/handler"
	"github.com/jiangyixi/personal-profile/backend/internal/middleware"
)

// Setup 注册所有路由。
func Setup(r *gin.Engine) {
	api := r.Group("/api")

	// 公开接口
	api.GET("/health", handler.Health)
	api.POST("/auth/login", handler.Login)

	// 受保护接口（需登录）
	private := api.Group("")
	private.Use(middleware.Auth())
	private.GET("/auth/me", handler.Me)
}
