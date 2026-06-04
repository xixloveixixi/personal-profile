-- 健康检查日志表
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS health_check_log (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  called_at   DATETIME(3)     NOT NULL COMMENT '调用时间',
  created_at  DATETIME(3)     NOT NULL,
  KEY idx_called_at (called_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='健康检查日志';
