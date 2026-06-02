package config

import (
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

// JWTSecret 签名密钥，生产环境必须通过环境变量 JWT_SECRET 配置。
var JWTSecret = getEnv("JWT_SECRET", "dev-secret-change-me")

const (
	// TokenExpiry Token 有效期（小时）。
	TokenExpiry = 24
	// OwnerID Stage 2 单 owner 模型固定 ID，写入数据时使用。
	OwnerID uint64 = 1
)

// CORSAllowedOrigins 允许访问后端 API 的明确前端源。
var CORSAllowedOrigins = getEnvList("BACKEND_CORS_ALLOWED_ORIGINS", nil)

// IsAllowedCORSOrigin 判断请求来源是否允许访问后端 API。
func IsAllowedCORSOrigin(origin string) bool {
	for _, allowedOrigin := range CORSAllowedOrigins {
		if origin == allowedOrigin {
			return true
		}
	}

	return isAllowedDevOrigin(origin)
}

func isAllowedDevOrigin(origin string) bool {
	parsedOrigin, err := url.Parse(origin)
	if err != nil {
		return false
	}
	if parsedOrigin.Scheme != "http" {
		return false
	}
	if parsedOrigin.Hostname() != "localhost" && parsedOrigin.Hostname() != "127.0.0.1" {
		return false
	}

	port, err := strconv.Atoi(parsedOrigin.Port())
	if err != nil {
		return false
	}
	return port >= 3000 && port <= 3009
}

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

func getEnvList(key string, fallback []string) []string {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}

	parts := strings.Split(v, ",")
	values := make([]string, 0, len(parts))
	for _, part := range parts {
		value := strings.TrimSpace(part)
		if value != "" {
			values = append(values, value)
		}
	}
	if len(values) == 0 {
		return fallback
	}
	return values
}
