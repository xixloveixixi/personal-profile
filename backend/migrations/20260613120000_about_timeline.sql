-- Migration: about_timeline 表
-- 对齐 schema.md about_timeline DDL
-- owner_id 字段当前固定为 1

CREATE TABLE IF NOT EXISTS about_timeline (
    id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    owner_id       BIGINT UNSIGNED NOT NULL,
    entry_id       VARCHAR(128)    NOT NULL              COMMENT '业务标识，如 education-hnust',
    entry_type     VARCHAR(32)     NOT NULL              COMMENT '类型：education / work',
    title          VARCHAR(128)    NOT NULL              COMMENT '标题',
    organization   VARCHAR(128)    NOT NULL              COMMENT '组织 / 学校 / 公司',
    location       VARCHAR(128)    NOT NULL DEFAULT ''   COMMENT '地点',
    start_date     DATE            NOT NULL              COMMENT '开始日期',
    end_date       DATE            NULL                  COMMENT '结束日期，可空表示至今',
    description    TEXT            NULL                  COMMENT '描述',
    achievements   JSON            NULL                  COMMENT '亮点数组',
    technologies   JSON            NULL                  COMMENT '技术栈数组',
    is_public      TINYINT(1)      NOT NULL DEFAULT 1    COMMENT '1 公开 0 隐藏',
    sort_order     INT             NOT NULL DEFAULT 0    COMMENT '排序，升序',
    created_at     DATETIME(3)     NOT NULL,
    updated_at     DATETIME(3)     NOT NULL,
    deleted_at     DATETIME(3)     NULL,
    UNIQUE KEY uk_owner_entry (owner_id, entry_id),
    KEY idx_owner_public_sort (owner_id, is_public, sort_order),
    KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='About 时间线';
