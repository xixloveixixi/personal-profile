// Package db 封装 GORM 连接初始化。
package db

import (
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/config"
)

// New 根据 config.DBConfig 创建 *gorm.DB，并设置连接池上限。
func New(cfg config.DBConfig) (*gorm.DB, error) {
	g, err := gorm.Open(mysql.Open(cfg.DSN), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("gorm open: %w", err)
	}
	sqlDB, err := g.DB()
	if err != nil {
		return nil, fmt.Errorf("gorm raw db: %w", err)
	}
	// 如果不设置这三行，在生产环境下可能会爆炸
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("db ping: %w", err)
	}
	return g, nil
}
