package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jiangyixi/personal-profile/backend/internal/model"
)

// SysUserRepo sys_user 表操作。
type SysUserRepo struct {
	db *gorm.DB
}

func NewSysUserRepo(db *gorm.DB) *SysUserRepo {
	return &SysUserRepo{db: db}
}

// FindByUsername 按用户名查找（含 status 校验）。
func (r *SysUserRepo) FindByUsername(username string) (*model.SysUser, error) {
	var u model.SysUser
	err := r.db.Where("username = ? AND status = 1", username).First(&u).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// FindByID 按 ID 查找。
func (r *SysUserRepo) FindByID(id uint64) (*model.SysUser, error) {
	var u model.SysUser
	err := r.db.Where("id = ? AND status = 1", id).First(&u).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// UpdateLastLogin 更新最后登录时间。
func (r *SysUserRepo) UpdateLastLogin(id uint64) error {
	return r.db.Model(&model.SysUser{}).Where("id = ?", id).Update("last_login_at", gorm.Expr("NOW(3)")).Error
}
