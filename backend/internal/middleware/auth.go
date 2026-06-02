package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"github.com/jiangyixi/personal-profile/backend/internal/config"
	"github.com/jiangyixi/personal-profile/backend/internal/response"
)

// Auth 校验 JWT，未登录或 Token 无效时返回 401 统一响应并中断请求。
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从 Authorization header 提取 Bearer token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			response.Abort(c, http.StatusUnauthorized, 40100, "未登录或Token失效")
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		// 解析并校验 token
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(config.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			response.Abort(c, http.StatusUnauthorized, 40100, "未登录或Token失效")
			return
		}

		// 将 claims 写入 context，后续 handler 可通过 c.Get("claims") 获取
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			c.Set("claims", claims)
			c.Set("role", claims["role"])
			c.Set("sub", claims["sub"])
			c.Set("user_id", claims["user_id"])
		}

		c.Next()
	}
}
