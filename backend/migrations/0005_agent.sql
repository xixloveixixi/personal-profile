-- Stage 9 / FB-7: Agent 对话表
-- 与 docs/dev-harness/schema.md 已冻结 DDL 一致。
-- 灌入命令：
--   mysql -u pp_app -p --default-character-set=utf8mb4 personal_profile < backend/migrations/0005_agent.sql

CREATE TABLE IF NOT EXISTS agent_conversation (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id        BIGINT UNSIGNED NOT NULL              COMMENT '所属用户，FK sys_user.id',
  title           VARCHAR(255)    NOT NULL DEFAULT ''   COMMENT '对话标题（自动生成或用户设置）',
  status          VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT '状态：active/archived',
  metadata        JSON            NULL                  COMMENT '扩展元数据（如意图分类结果）',
  created_at      DATETIME(3)     NOT NULL,
  updated_at      DATETIME(3)     NOT NULL,
  KEY idx_owner_status (owner_id, status),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent 对话会话';

CREATE TABLE IF NOT EXISTS agent_message (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  conversation_id   BIGINT UNSIGNED NOT NULL              COMMENT '所属对话，FK agent_conversation.id',
  role              VARCHAR(32)     NOT NULL              COMMENT '角色：user/assistant/system/tool',
  content           TEXT            NOT NULL              COMMENT '消息内容',
  tool_calls        JSON            NULL                  COMMENT 'Tool 调用记录（assistant 消息）',
  tool_call_id      VARCHAR(64)     NULL                  COMMENT 'Tool 调用 ID（tool 消息）',
  tokens_used       INT             NOT NULL DEFAULT 0    COMMENT 'Token 消耗',
  created_at        DATETIME(3)     NOT NULL,
  KEY idx_conversation (conversation_id),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent 对话消息';
