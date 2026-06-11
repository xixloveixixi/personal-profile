-- FB-6 学习计划功能表结构
-- 执行时间：2026-06-04
-- 关联需求：Stage 8 / FB-6

-- learning_plan 学习计划表
CREATE TABLE IF NOT EXISTS learning_plan (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id          BIGINT UNSIGNED NOT NULL              COMMENT '所属用户，FK sys_user.id',
  goal_id           BIGINT UNSIGNED NULL                  COMMENT '关联目标，FK learning_goal.id，可为空',
  title             VARCHAR(255)    NOT NULL              COMMENT '计划标题',
  description       TEXT            NULL                  COMMENT '计划描述',
  source            VARCHAR(32)     NOT NULL DEFAULT 'manual' COMMENT '来源：manual / ai_generated',
  status            VARCHAR(32)     NOT NULL DEFAULT 'draft' COMMENT '状态：draft / active / completed / archived',
  start_date        DATE            NULL                  COMMENT '计划开始日期',
  end_date          DATE            NULL                  COMMENT '计划结束日期',
  total_tasks       INT             NOT NULL DEFAULT 0    COMMENT '任务总数（冗余）',
  completed_tasks   INT             NOT NULL DEFAULT 0    COMMENT '已完成任务数（冗余）',
  created_at        DATETIME(3)     NOT NULL,
  updated_at        DATETIME(3)     NOT NULL,
  deleted_at        DATETIME(3)     NULL,
  KEY idx_owner_status (owner_id, status),
  KEY idx_goal (goal_id),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习计划';

-- learning_task 学习任务表
CREATE TABLE IF NOT EXISTS learning_task (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id          BIGINT UNSIGNED NOT NULL              COMMENT '所属用户，FK sys_user.id',
  plan_id           BIGINT UNSIGNED NOT NULL              COMMENT '关联计划，FK learning_plan.id',
  title             VARCHAR(255)    NOT NULL              COMMENT '任务标题',
  description       TEXT            NULL                  COMMENT '任务描述',
  task_type         VARCHAR(64)     NOT NULL DEFAULT 'learning' COMMENT '任务类型：learning / practice / review / project',
  status            VARCHAR(32)     NOT NULL DEFAULT 'pending' COMMENT '状态：pending / in_progress / completed / skipped',
  priority          INT             NOT NULL DEFAULT 0    COMMENT '优先级，升序',
  estimated_minutes INT             NOT NULL DEFAULT 0    COMMENT '预估耗时（分钟）',
  actual_minutes    INT             NOT NULL DEFAULT 0    COMMENT '实际耗时（分钟）',
  due_date          DATE            NULL                  COMMENT '截止日期',
  completed_at      DATETIME(3)     NULL                  COMMENT '完成时间',
  sort_order        INT             NOT NULL DEFAULT 0    COMMENT '排序',
  created_at        DATETIME(3)     NOT NULL,
  updated_at        DATETIME(3)     NOT NULL,
  deleted_at        DATETIME(3)     NULL,
  KEY idx_plan_status (plan_id, status),
  KEY idx_owner_status (owner_id, status),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习任务';

-- learning_progress 学习进度日志表
CREATE TABLE IF NOT EXISTS learning_progress (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id          BIGINT UNSIGNED NOT NULL              COMMENT '所属用户，FK sys_user.id',
  task_id           BIGINT UNSIGNED NOT NULL              COMMENT '关联任务，FK learning_task.id',
  minutes_spent     INT             NOT NULL DEFAULT 0    COMMENT '本次耗时（分钟）',
  note              TEXT            NULL                  COMMENT '学习笔记',
  logged_at         DATETIME(3)     NOT NULL              COMMENT '记录时间',
  created_at        DATETIME(3)     NOT NULL,
  KEY idx_task (task_id),
  KEY idx_owner_logged (owner_id, logged_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习进度日志';
