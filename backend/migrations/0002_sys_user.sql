-- Stage 3 / FB-3: sys_user 表
-- 与 docs/dev-harness/schema.md 已冻结 DDL 一致。
-- 灌入命令（本机）：
--   mysql -u pp_app -ppp_dev_pwd personal_profile < backend/migrations/0002_sys_user.sql
-- 幂等：使用 CREATE TABLE IF NOT EXISTS。

CREATE TABLE IF NOT EXISTS sys_user (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username        VARCHAR(64)     NOT NULL              COMMENT '登录用户名',
  password_hash   VARCHAR(255)    NOT NULL              COMMENT 'bcrypt 哈希',
  role            VARCHAR(32)     NOT NULL DEFAULT 'owner' COMMENT '角色：owner',
  display_name    VARCHAR(64)     NOT NULL DEFAULT ''   COMMENT '显示名称',
  email           VARCHAR(255)    NOT NULL DEFAULT ''   COMMENT '邮箱',
  status          TINYINT(1)      NOT NULL DEFAULT 1    COMMENT '1 启用 0 禁用',
  last_login_at   DATETIME(3)     NULL                  COMMENT '最后登录时间',
  created_at      DATETIME(3)     NOT NULL,
  updated_at      DATETIME(3)     NOT NULL,
  deleted_at      DATETIME(3)     NULL,
  UNIQUE KEY uk_username (username),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户';
