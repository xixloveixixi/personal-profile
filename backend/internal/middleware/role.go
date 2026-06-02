package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/jiangyixi/personal-profile/backend/internal/response"
)

// RequireOwnerRole 校验 JWT claims 中 role=owner，需在 Auth() 之后使用。
func RequireOwnerRole() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if role != "owner" {
			response.Abort(c, http.StatusForbidden, 40300, "权限不足")
			return
		}
		c.Next()
	}
}
