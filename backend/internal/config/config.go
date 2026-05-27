package config

import (
	"os"
	"strconv"
	"time"
)

// JWTSecret 签名密钥，生产环境必须通过环境变量 JWT_SECRET 配置。
var JWTSecret = getEnv("JWT_SECRET", "dev-secret-change-me")

const (
	// OwnerUsername 降级阶段硬编码 owner 凭据，Stage 2 接 DB 后移除。
	OwnerUsername = "owner"
	// OwnerPassword 降级阶段硬编码 owner 密码。
	OwnerPassword = "owner123"
	// TokenExpiry Token 有效期（小时）。
	TokenExpiry = 24
	// OwnerID Stage 2 单 owner 模型固定 ID，写入数据时使用。
	OwnerID uint64 = 1
)

// DBConfig 数据库连接配置（Stage 2 起）。
type DBConfig struct {
	DSN             string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

// DB 全局数据库配置，启动时由 main 读取。
var DB = DBConfig{
	DSN: getEnv(
		"BACKEND_DB_DSN",
		"pp_app:pp_dev_pwd@tcp(127.0.0.1:3306)/personal_profile?charset=utf8mb4&parseTime=True&loc=Local",
	),
	MaxOpenConns:    getEnvInt("BACKEND_DB_MAX_OPEN", 20),
	MaxIdleConns:    getEnvInt("BACKEND_DB_MAX_IDLE", 5),
	ConnMaxLifetime: time.Hour,
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
