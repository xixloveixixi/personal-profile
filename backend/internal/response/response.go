package response

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Body 统一响应结构，对齐 SDD 9.1。
type Body struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data"`
	TraceID string `json:"traceId"`
}

func traceID(c *gin.Context) string {
	if id := c.GetHeader("X-Trace-Id"); id != "" {
		return id
	}
	return uuid.NewString()
}

// OK 返回成功响应。
func OK(c *gin.Context, data any) {
	c.JSON(200, Body{
		Code:    0,
		Message: "ok",
		Data:    data,
		TraceID: traceID(c),
	})
}

// Fail 返回错误响应。
func Fail(c *gin.Context, httpCode int, bizCode int, message string) {
	c.JSON(httpCode, Body{
		Code:    bizCode,
		Message: message,
		Data:    nil,
		TraceID: traceID(c),
	})
}

// Abort 返回错误响应并中断请求链（用于中间件）。
func Abort(c *gin.Context, httpCode int, bizCode int, message string) {
	c.AbortWithStatusJSON(httpCode, Body{
		Code:    bizCode,
		Message: message,
		Data:    nil,
		TraceID: traceID(c),
	})
}
