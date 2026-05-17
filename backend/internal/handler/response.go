package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/response"
)

// OK 返回成功响应（代理 response 包）。
func OK(c *gin.Context, data any) {
	response.OK(c, data)
}

// Fail 返回错误响应（代理 response 包）。
func Fail(c *gin.Context, httpCode int, bizCode int, message string) {
	response.Fail(c, httpCode, bizCode, message)
}
