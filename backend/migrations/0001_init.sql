-- Stage 2 init: 4 张公开数据表
-- 与 docs/dev-harness/schema.md 已冻结 DDL 一致。
-- 灌入命令（本机）：
--   mysql -u pp_app -p personal_profile < backend/migrations/0001_init.sql
-- 幂等：使用 CREATE TABLE IF NOT EXISTS，便于重复执行。

CREATE TABLE IF NOT EXISTS public_profile (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id        BIGINT UNSIGNED NOT NULL              COMMENT '所属用户，Stage 2 固定为 1',
  display_name    VARCHAR(64)     NOT NULL              COMMENT '展示名称',
  headline        VARCHAR(255)    NOT NULL DEFAULT ''   COMMENT '首页主标题',
  bio             TEXT            NULL                  COMMENT '个人简介',
  avatar_url      VARCHAR(512)    NOT NULL DEFAULT ''   COMMENT '头像 URL',
  current_focus   VARCHAR(255)    NOT NULL DEFAULT ''   COMMENT '当前定位',
  location        VARCHAR(128)    NOT NULL DEFAULT ''   COMMENT '所在城市',
  visibility      VARCHAR(32)     NOT NULL DEFAULT 'public' COMMENT 'public/private/hidden',
  created_at      DATETIME(3)     NOT NULL,
  updated_at      DATETIME(3)     NOT NULL,
  deleted_at      DATETIME(3)     NULL,
  UNIQUE KEY uk_owner (owner_id),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公开个人信息';

CREATE TABLE IF NOT EXISTS public_contact (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id    BIGINT UNSIGNED NOT NULL,
  platform    VARCHAR(64)     NOT NULL              COMMENT '平台标识：github/wechat/email 等',
  label       VARCHAR(128)    NOT NULL DEFAULT ''   COMMENT '展示文案',
  url         VARCHAR(512)    NOT NULL DEFAULT ''   COMMENT '链接（可为空，如微信号）',
  icon        VARCHAR(64)     NOT NULL DEFAULT ''   COMMENT '图标标识',
  is_public   TINYINT(1)      NOT NULL DEFAULT 1    COMMENT '1 公开 0 隐藏',
  sort_order  INT             NOT NULL DEFAULT 0    COMMENT '排序，升序',
  created_at  DATETIME(3)     NOT NULL,
  updated_at  DATETIME(3)     NOT NULL,
  deleted_at  DATETIME(3)     NULL,
  KEY idx_owner_public_sort (owner_id, is_public, sort_order),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公开联系方式';

CREATE TABLE IF NOT EXISTS public_skill (
  id                 BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id           BIGINT UNSIGNED NOT NULL,
  name               VARCHAR(64)     NOT NULL              COMMENT '技能名称',
  category           VARCHAR(64)     NOT NULL DEFAULT ''   COMMENT '技能类别：frontend/backend/ai 等',
  proficiency_level  VARCHAR(32)     NOT NULL DEFAULT ''   COMMENT '熟练 / 掌握 / 了解',
  description        VARCHAR(512)    NOT NULL DEFAULT ''   COMMENT '描述',
  is_public          TINYINT(1)      NOT NULL DEFAULT 1    COMMENT '1 公开 0 隐藏',
  sort_order         INT             NOT NULL DEFAULT 0    COMMENT '排序，升序',
  created_at         DATETIME(3)     NOT NULL,
  updated_at         DATETIME(3)     NOT NULL,
  deleted_at         DATETIME(3)     NULL,
  KEY idx_owner_public_cat_sort (owner_id, is_public, category, sort_order),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公开技能';

CREATE TABLE IF NOT EXISTS site_config (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  config_key    VARCHAR(128)    NOT NULL              COMMENT '配置键',
  config_value  TEXT            NULL                  COMMENT '配置值（按 value_type 解释）',
  value_type    VARCHAR(32)     NOT NULL DEFAULT 'string' COMMENT 'string / json / boolean / number',
  description   VARCHAR(255)    NOT NULL DEFAULT ''   COMMENT '说明',
  created_at    DATETIME(3)     NOT NULL,
  updated_at    DATETIME(3)     NOT NULL,
  deleted_at    DATETIME(3)     NULL,
  UNIQUE KEY uk_config_key (config_key),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站点配置';
