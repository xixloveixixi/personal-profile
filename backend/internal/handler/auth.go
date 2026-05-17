package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"github.com/jiangyixi/personal-profile/backend/internal/config"
)

// LoginReq 登录请求体。
type LoginReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Login 登录接口，降级阶段使用硬编码 owner 凭据签发 JWT。
func Login(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}

	if req.Username == "" || req.Password == "" {
		Fail(c, http.StatusBadRequest, 40001, "用户名和密码不能为空")
		return
	}

	// 降级策略：比对硬编码 owner 凭据
	if req.Username != config.OwnerUsername || req.Password != config.OwnerPassword {
		Fail(c, http.StatusUnauthorized, 40100, "用户名或密码错误")
		return
	}

	// 签发 JWT
	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  "owner",
		"role": "owner",
		"iat":  now.Unix(),
		"exp":  now.Add(time.Duration(config.TokenExpiry) * time.Hour).Unix(),
	})

	signed, err := token.SignedString([]byte(config.JWTSecret))
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "Token 签发失败")
		return
	}

	OK(c, gin.H{
		"access_token": signed,
		"expires_in":   config.TokenExpiry * 3600,
		"user": gin.H{
			"username": config.OwnerUsername,
			"role":     "owner",
		},
	})
}
