package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/jiangyixi/personal-profile/backend/internal/config"
	"github.com/jiangyixi/personal-profile/backend/internal/repository"
)

// AuthHandler 认证相关 handler。
type AuthHandler struct {
	userRepo *repository.SysUserRepo
}

func NewAuthHandler(userRepo *repository.SysUserRepo) *AuthHandler {
	return &AuthHandler{userRepo: userRepo}
}

// LoginReq 登录请求体。
type LoginReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Login 登录接口，从 DB 校验用户名密码。
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, 40001, "参数错误")
		return
	}

	if req.Username == "" || req.Password == "" {
		Fail(c, http.StatusBadRequest, 40001, "用户名和密码不能为空")
		return
	}

	user, err := h.userRepo.FindByUsername(req.Username)
	if err != nil {
		Fail(c, http.StatusUnauthorized, 40100, "用户名或密码错误")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		Fail(c, http.StatusUnauthorized, 40100, "用户名或密码错误")
		return
	}

	// 更新最后登录时间
	_ = h.userRepo.UpdateLastLogin(user.ID)

	// 签发 JWT
	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":     user.Username,
		"role":    user.Role,
		"user_id": user.ID,
		"iat":     now.Unix(),
		"exp":     now.Add(time.Duration(config.TokenExpiry) * time.Hour).Unix(),
	})

	signed, err := token.SignedString([]byte(config.JWTSecret))
	if err != nil {
		Fail(c, http.StatusInternalServerError, 50000, "Token 签发失败")
		return
	}

	OK(c, gin.H{
		"accessToken": signed,
		"expiresIn":   config.TokenExpiry * 3600,
		"user": gin.H{
			"id":          user.ID,
			"username":    user.Username,
			"role":        user.Role,
			"displayName": user.DisplayName,
		},
	})
}

// Me 获取当前登录用户信息。
func (h *AuthHandler) Me(c *gin.Context) {
	claims, exists := c.Get("claims")
	if !exists {
		Fail(c, http.StatusUnauthorized, 40100, "未登录")
		return
	}

	mapClaims, _ := claims.(jwt.MapClaims)
	userIDFloat, _ := mapClaims["user_id"].(float64)
	userID := uint64(userIDFloat)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		Fail(c, http.StatusNotFound, 40400, "用户不存在")
		return
	}

	OK(c, gin.H{
		"id":          user.ID,
		"username":    user.Username,
		"role":        user.Role,
		"displayName": user.DisplayName,
		"email":       user.Email,
	})
}
