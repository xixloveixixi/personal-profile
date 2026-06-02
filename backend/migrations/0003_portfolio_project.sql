-- Migration: portfolio_project 表
-- 对齐 schema.md portfolio_project DDL
-- owner_id 字段 Stage 2 固定为 1

CREATE TABLE IF NOT EXISTS portfolio_project (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    owner_id        BIGINT UNSIGNED NOT NULL              COMMENT '所属用户，Stage 2 固定为 1',
    slug            VARCHAR(128)    NOT NULL              COMMENT 'URL slug，唯一索引',
    title           VARCHAR(255)    NOT NULL DEFAULT ''   COMMENT '项目标题',
    short_description VARCHAR(512)  NOT NULL DEFAULT ''   COMMENT '一句话简介',
    long_description TEXT           NULL                  COMMENT '完整描述',
    problem         TEXT            NULL                  COMMENT '解决的痛点问题',
    solution        TEXT            NULL                  COMMENT '解决方案',
    challenges     TEXT            NULL                  COMMENT '技术挑战',
    results        TEXT            NULL                  COMMENT '成果/收益',
    github_url      VARCHAR(512)    NOT NULL DEFAULT ''   COMMENT 'GitHub 仓库地址',
    demo_url        VARCHAR(512)    NOT NULL DEFAULT ''   COMMENT '线上演示地址',
    featured_image  VARCHAR(512)    NOT NULL DEFAULT ''   COMMENT '封面图 URL',
    technologies    JSON            NULL                  COMMENT '技术栈数组',
    gallery         JSON            NULL                  COMMENT '展示图数组',
    featured        TINYINT(1)      NOT NULL DEFAULT 0    COMMENT '1 精选 0 普通',
    is_public       TINYINT(1)      NOT NULL DEFAULT 1    COMMENT '1 公开 0 隐藏',
    sort_order      INT             NOT NULL DEFAULT 0    COMMENT '排序，升序',
    published_at    DATE            NULL                  COMMENT '发布日期',
    created_at      DATETIME(3)     NOT NULL,
    updated_at      DATETIME(3)     NOT NULL,
    deleted_at      DATETIME(3)     NULL,
    UNIQUE KEY uk_owner_slug (owner_id, slug),
    KEY idx_owner_public_sort (owner_id, is_public, sort_order),
    KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='作品集项目';