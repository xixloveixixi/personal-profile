package handler

import "github.com/gin-gonic/gin"

// Me 获取当前登录用户信息（受 Auth 中间件保护）。
func Me(c *gin.Context) {
	OK(c, gin.H{
		"username": c.GetString("sub"),
		"role":     c.GetString("role"),
	})
}
