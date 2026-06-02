-- Stage 3 / FB-3: 种子 owner 用户
-- 密码: owner123 (bcrypt cost=10)
-- 灌入命令（本机）：
--   mysql -u pp_app -ppp_dev_pwd personal_profile < backend/migrations/seed_002_owner.sql
-- 幂等：INSERT ... ON DUPLICATE KEY UPDATE。

INSERT INTO sys_user (username, password_hash, role, display_name, email, status, created_at, updated_at)
VALUES ('owner', '$2a$10$9062jqSbQRPLGEZkTRiFruVPu0RKHDuaTjKRueNBfTBakMa1..bci', 'owner', 'Yixi Jiang', '', 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  display_name  = VALUES(display_name),
  updated_at    = NOW(3);
