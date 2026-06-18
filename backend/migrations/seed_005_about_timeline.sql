-- about_timeline 种子数据
-- 数据来源：content/about/timeline.json
-- 执行方式：mysql -u pp_app -p personal_profile --default-character-set=utf8mb4 < backend/migrations/seed_005_about_timeline.sql
-- 幂等：使用 INSERT ... ON DUPLICATE KEY UPDATE（基于 uk_owner_entry 唯一索引）

INSERT INTO about_timeline (
  owner_id, entry_id, entry_type, title, organization, location,
  start_date, end_date, description, achievements, technologies,
  is_public, sort_order, created_at, updated_at
) VALUES
(1, 'education-hnust', 'education', '本科', '湖南科技大学', '湖南湘潭',
 '2021-09-01', '2027-06-30', '数据科学与大数据技术专业，本科毕业院校，学校位于湖南湘潭，2027年6月毕业',
 '["系统学习计算机基础课程","参与多个项目开发实践"]',
 '["数据科学","大数据技术","软件工程","数据结构","算法"]',
 1, 0, NOW(3), NOW(3)),

(1, 'work-lilith-2025', 'work', '前端开发实习生', '上海莉莉丝科技有限公司', '上海',
 '2025-11-01', NULL, '负责大数据表字段渲染性能优化、Figma-MCP 工作流集成与 DAP 移动端性能优化',
 '["虚拟滚动 + 按需懒加载 + 智能滚动检测，首屏渲染速度从 2.3s 降至 0.5s，内存降低 95%+","Figma-MCP 使用指南文档沉淀，优化 AI 提示规则，迭代周期缩短 15%-20%","HTTP 层请求去重方案，Map 管理 pending 队列 + 拦截器自动 abort 重复请求，解决接口竞态问题"]',
 '["React","TypeScript","虚拟滚动","MCP协议","性能优化"]',
 1, 1, NOW(3), NOW(3)),

(1, 'work-weida-2025', 'work', '前端开发实习生', '上海维搭信息科技有限公司', '上海',
 '2025-07-01', '2025-10-31', '负责华刚铜矿项目大屏的前端开发与公司物料库的设计开发',
 '["设计自适应布局算法：实时检测视口与元素边界，动态优化弹窗位置，解决 3D 场景 UI 溢出问题","开发 10+ 定制化业务组件（图表、浮动卡片、弹窗等）","为公司统一物料库贡献 7 个标准化组件，被 3 个项目复用"]',
 '["Vue3","TypeScript","Echarts","3D可视化","组件库"]',
 1, 2, NOW(3), NOW(3)),

(1, 'project-farm-2024', 'work', '湘潭农交中心-高标准农田项目大屏（前端核心开发成员）', '项目经历', '湘潭',
 '2024-12-01', '2025-02-28', '负责开发高标准农田数据可视化大屏，融合地理与农业数据，动态监测 20+ 核心指标',
 '["基于天地图的地理信息可视化系统，实现底图加载、图层叠加与交互控制","分批次并发请求与流式渲染，万级地理坐标数据渲染时间从 3 秒缩短至 1.5 秒","二次封装 Axios，统一请求头配置和各种异常情况处理"]',
 '["Vue3","TypeScript","Echarts","天地图","Axios","Vite","Element UI"]',
 1, 3, NOW(3), NOW(3)),

(1, 'project-cream-2025', 'work', 'Cream-Design 组件库（前端开发负责人）', '项目经历', '',
 '2025-05-01', '2025-07-31', '主导 CreamDesign 组件库整体架构设计，开发 Table、Form、Menu、Upload 等十余个高频业务组件',
 '["虚拟滚动优化：Table 组件支持万级数据流畅滚动，初始渲染 DOM 节点减少 80.3%","大文件分片上传：Web Worker 异步计算 MD5 实现秒传，IndexedDB 持久化支持断点续传，吞吐提升 81%","基于 useReducer + async-validator 构建表单验证引擎，支持跨字段联动校验"]',
 '["React","TypeScript","SCSS","Storybook","Rollup","Jest"]',
 1, 4, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  entry_type = VALUES(entry_type),
  title = VALUES(title),
  organization = VALUES(organization),
  location = VALUES(location),
  start_date = VALUES(start_date),
  end_date = VALUES(end_date),
  description = VALUES(description),
  achievements = VALUES(achievements),
  technologies = VALUES(technologies),
  is_public = VALUES(is_public),
  sort_order = VALUES(sort_order),
  updated_at = NOW(3);
