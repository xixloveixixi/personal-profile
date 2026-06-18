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
  (1, 'HTML5', '前端基础', '熟练', '与 CSS3 / JavaScript ES6+ / TypeScript 同属前端基础', 1, 1, NOW(3), NOW(3)),
  (1, 'CSS3', '前端基础', '熟练', '与 HTML5 / JavaScript ES6+ / TypeScript 同属前端基础', 1, 2, NOW(3), NOW(3)),
  (1, 'JavaScript ES6+', '前端基础', '熟练', '与 HTML5 / CSS3 / TypeScript 同属前端基础', 1, 3, NOW(3), NOW(3)),
  (1, 'TypeScript', '前端基础', '熟练', '与 HTML5 / CSS3 / JavaScript ES6+ 同属前端基础', 1, 4, NOW(3), NOW(3)),
  (1, 'Axios', '前端基础', '项目实践', '与 SCSS 同属前端基础', 1, 5, NOW(3), NOW(3)),
  (1, 'SCSS', '前端基础', '项目实践', '与 Axios 同属前端基础', 1, 6, NOW(3), NOW(3)),
  (1, 'React', '前端框架与生态', '熟练', '与 Vue / Element UI / Ant Design 同属前端框架与生态', 1, 7, NOW(3), NOW(3)),
  (1, 'Vue', '前端框架与生态', '了解', '与 React / Element UI / Ant Design 同属前端框架与生态', 1, 8, NOW(3), NOW(3)),
  (1, 'Element UI', '前端框架与生态', '熟练', '与 React / Vue / Ant Design 同属前端框架与生态', 1, 9, NOW(3), NOW(3)),
  (1, 'Ant Design', '前端框架与生态', '熟练', '与 React / Vue / Element UI 同属前端框架与生态', 1, 10, NOW(3), NOW(3)),
  (1, 'ECharts', '数据可视化', '项目实践', '与 天地图 / GIS 可视化 同属数据可视化', 1, 11, NOW(3), NOW(3)),
  (1, '天地图', '数据可视化', '项目实践', '与 ECharts / GIS 可视化 同属数据可视化', 1, 12, NOW(3), NOW(3)),
  (1, 'GIS 可视化', '数据可视化', '项目实践', '与 ECharts / 天地图 同属数据可视化', 1, 13, NOW(3), NOW(3)),
  (1, 'Monorepo', '前端工程化', '项目实践', '与 pnpm workspace / Vite / Webpack / Rollup / ESLint / Prettier 同属前端工程化', 1, 14, NOW(3), NOW(3)),
  (1, 'pnpm workspace', '前端工程化', '项目实践', '与 Monorepo / Vite / Webpack / Rollup / ESLint / Prettier 同属前端工程化', 1, 15, NOW(3), NOW(3)),
  (1, 'Vite', '前端工程化', '项目实践', '与 Monorepo / pnpm workspace / Webpack / Rollup / ESLint / Prettier 同属前端工程化', 1, 16, NOW(3), NOW(3)),
  (1, 'Webpack', '前端工程化', '项目实践', '与 Monorepo / pnpm workspace / Vite / Rollup / ESLint / Prettier 同属前端工程化', 1, 17, NOW(3), NOW(3)),
  (1, 'Rollup', '前端工程化', '项目实践', '与 Monorepo / pnpm workspace / Vite / Webpack / ESLint / Prettier 同属前端工程化', 1, 18, NOW(3), NOW(3)),
  (1, 'ESLint / Prettier', '前端工程化', '项目实践', '与 Monorepo / pnpm workspace / Vite / Webpack / Rollup 同属前端工程化', 1, 19, NOW(3), NOW(3)),
  (1, 'Go', '后端开发', '项目实践', '与 Python / Gin / GORM / MySQL / FastAPI 同属后端开发', 1, 20, NOW(3), NOW(3)),
  (1, 'Python', '后端开发', '项目实践', '与 Go / Gin / GORM / MySQL / FastAPI 同属后端开发', 1, 21, NOW(3), NOW(3)),
  (1, 'Gin', '后端开发', '项目实践', '与 Go / Python / GORM / MySQL / FastAPI 同属后端开发', 1, 22, NOW(3), NOW(3)),
  (1, 'GORM', '后端开发', '项目实践', '与 Go / Python / Gin / MySQL / FastAPI 同属后端开发', 1, 23, NOW(3), NOW(3)),
  (1, 'MySQL', '后端开发', '项目实践', '与 Go / Python / Gin / GORM / FastAPI 同属后端开发', 1, 24, NOW(3), NOW(3)),
  (1, 'FastAPI', '后端开发', '项目实践', '与 Go / Python / Gin / GORM / MySQL 同属后端开发', 1, 25, NOW(3), NOW(3)),
  (1, 'Prompt Engineering', 'AI 工程实践', '项目实践', '与 MCP / AI Skill 工作流 / LangGraph / DeepSeek API 同属 AI 工程实践', 1, 26, NOW(3), NOW(3)),
  (1, 'MCP', 'AI 工程实践', '项目实践', '与 Prompt Engineering / AI Skill 工作流 / LangGraph / DeepSeek API 同属 AI 工程实践', 1, 27, NOW(3), NOW(3)),
  (1, 'AI Skill 工作流', 'AI 工程实践', '项目实践', '与 Prompt Engineering / MCP / LangGraph / DeepSeek API 同属 AI 工程实践', 1, 28, NOW(3), NOW(3)),
  (1, 'LangGraph', 'AI 工程实践', '项目实践', '与 Prompt Engineering / MCP / AI Skill 工作流 / DeepSeek API 同属 AI 工程实践', 1, 29, NOW(3), NOW(3)),
  (1, 'DeepSeek API', 'AI 工程实践', '项目实践', '与 Prompt Engineering / MCP / AI Skill 工作流 / LangGraph 同属 AI 工程实践', 1, 30, NOW(3), NOW(3)),
  (1, 'Git', '开发工具与协作', '熟悉', '', 1, 31, NOW(3), NOW(3)),
  (1, '中级软件设计师', '技能证书', '已获证书', '', 1, 32, NOW(3), NOW(3));

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
