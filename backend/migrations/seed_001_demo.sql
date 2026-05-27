-- 种子数据：公开联系方式（owner_id = 1）
--
-- 用途：本地开发 / CI 初始化演示数据，不适用于已有真实数据的生产环境。
-- 幂等策略：先删除 owner_id=1 的现有记录，再批量插入。
--   由于 public_contact 无唯一键（允许同平台多账号），
--   INSERT ... ON DUPLICATE KEY UPDATE 无法去重，故采用 DELETE + INSERT。
--
-- 执行命令（在 backend/ 目录下）：
--   mysql -u pp_app -p personal_profile < migrations/seed_001_demo.sql
--

-- 清空 owner_id=1 的联系方式（首次执行前不影响其他 owner）
DELETE FROM public_contact WHERE owner_id = 1;

-- 插入演示数据
INSERT INTO public_contact
  (owner_id, platform, label, url, icon, is_public, sort_order, created_at, updated_at)
VALUES
  (1, 'github',   'GitHub',
   'https://github.com/jiangyixi',         'github',   1, 1, NOW(3), NOW(3)),
  (1, 'email',    'Email',
   'mailto:me@example.com',                'email',    1, 2, NOW(3), NOW(3)),
  (1, 'linkedin', 'LinkedIn',
   'https://linkedin.com/in/jiangyixi',    'linkedin', 1, 3, NOW(3), NOW(3));

-- 种子数据：技能（public_skill）
--
-- 幂等策略：先删除 owner_id=1 的现有记录，再批量插入。
-- public_skill 无唯一键，无法用 ON DUPLICATE KEY UPDATE，故采用 DELETE + INSERT。
--
DELETE FROM public_skill WHERE owner_id = 1;
INSERT INTO public_skill
  (owner_id, name, category, proficiency_level, description, is_public, sort_order, created_at, updated_at)
VALUES
  (1, 'React',      'frontend', '熟练', 'Hooks/Server Components', 1, 1, NOW(3), NOW(3)),
  (1, 'TypeScript', 'frontend', '熟练', '类型系统 / 泛型',           1, 2, NOW(3), NOW(3)),
  (1, 'Go',         'backend',  '掌握', 'Gin / GORM / 并发',        1, 3, NOW(3), NOW(3)),
  (1, 'Next.js',    'frontend', '熟练', 'App Router / RSC',         1, 4, NOW(3), NOW(3));

-- 种子数据：站点配置（site_config）
--
-- 幂等策略：site_config 有 uk_config_key 唯一索引，使用 ON DUPLICATE KEY UPDATE。
--
INSERT INTO site_config
  (config_key, config_value, value_type, description, created_at, updated_at)
VALUES
  ('site.title',
   'Yixi Jiang - Personal Profile',
   'string', '站点标题', NOW(3), NOW(3)),
  ('site.description',
   '前端 × AI Agent 工程师的个人主页',
   'string', '站点描述', NOW(3), NOW(3)),
  ('nav.items',
   '[{"label":"关于","href":"/"},{"label":"项目","href":"/projects"}]',
   'json', '导航菜单', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  description  = VALUES(description),
  updated_at   = NOW(3);
