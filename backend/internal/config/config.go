package config

import "os"

// JWTSecret 签名密钥，生产环境必须通过环境变量 JWT_SECRET 配置。
var JWTSecret = getEnv("JWT_SECRET", "dev-secret-change-me")

const (
	// OwnerUsername 降级阶段硬编码 owner 凭据，Stage 2 接 DB 后移除。
	OwnerUsername = "owner"
	// OwnerPassword 降级阶段硬编码 owner 密码。
	OwnerPassword = "owner123"
	// TokenExpiry Token 有效期（小时）。
	TokenExpiry = 24
)

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
