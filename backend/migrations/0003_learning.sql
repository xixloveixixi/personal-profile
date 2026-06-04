SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS learning_profile (
  id                  BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id            BIGINT UNSIGNED NOT NULL              COMMENT '所属用户，FK sys_user.id',
  target_role         VARCHAR(128)    NOT NULL DEFAULT ''   COMMENT '目标岗位',
  background_summary  TEXT            NULL                  COMMENT '背景摘要',
  skill_summary       TEXT            NULL                  COMMENT '技能摘要',
  weakness_summary    TEXT            NULL                  COMMENT '短板摘要',
  learning_preference TEXT            NULL                  COMMENT '学习偏好',
  resume_snapshot     TEXT            NULL                  COMMENT '简历快照',
  created_at          DATETIME(3)     NOT NULL,
  updated_at          DATETIME(3)     NOT NULL,
  deleted_at          DATETIME(3)     NULL,
  UNIQUE KEY uk_owner (owner_id),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习画像';

CREATE TABLE IF NOT EXISTS learning_goal (
  id               BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id         BIGINT UNSIGNED NOT NULL              COMMENT '所属用户，FK sys_user.id',
  title            VARCHAR(128)    NOT NULL              COMMENT '目标标题',
  description      TEXT            NULL                  COMMENT '目标描述',
  goal_type        VARCHAR(64)     NOT NULL DEFAULT 'skill' COMMENT '目标类型：interview / project / skill',
  priority         INT             NOT NULL DEFAULT 0    COMMENT '优先级，升序',
  deadline         DATE            NULL                  COMMENT '截止日期',
  status           VARCHAR(32)     NOT NULL DEFAULT 'not_started' COMMENT '状态：not_started / active / completed / paused',
  progress_percent INT             NOT NULL DEFAULT 0    COMMENT '进度 0-100',
  created_at       DATETIME(3)     NOT NULL,
  updated_at       DATETIME(3)     NOT NULL,
  deleted_at       DATETIME(3)     NULL,
  KEY idx_owner_status (owner_id, status),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习目标';
