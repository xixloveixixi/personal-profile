-- Seed: portfolio_project 初始数据
-- 来源 content/projects/*.json（cq/cream-design/farmland-dashboard/vue3-big-event/zhangyuan）
-- 幂等：DELETE + INSERT

DELETE FROM portfolio_project WHERE owner_id = 1;

INSERT INTO portfolio_project (owner_id, slug, title, short_description, long_description, problem, solution, challenges, results, github_url, demo_url, featured_image, technologies, gallery, featured, is_public, sort_order, published_at, created_at, updated_at) VALUES
(1, 'chongqing-city-showcase', '重庆城市文化展示网站', '一个以重庆城市文化为主题的沉浸式交互展示网站，涵盖山水地貌、美食文化、历史底蕴、江湖气息和未来发展五大板块，运用视差滚动、Canvas 星空动画、瀑布流布局、菱形相册等丰富的前端视觉效果，呈现重庆的立体魅力。', '', '', '', '', '', 'https://github.com/xixloveixixi/webPractice', '', '', '["Vue 3","Vite 6","Vue Router 4","Pinia","SCSS","Element Plus","Animate.css","WOW.js","Canvas API"]', '["/images/cq-web1.png","/images/cq-web2.png","/images/cq-web3.png"]', 0, 1, 3, NULL, NOW(), NOW()),

(1, 'cream-design', 'Cream-Design 组件库', 'Cream-Design 是一个从零构建的 React 组件库，专注于性能优化和开发体验。', '', '', '', '', '', 'https://github.com/xixloveixixi/creamdesign', '', '', '["React 19","TypeScript","Rollup","Storybook 8","Jest","async-validator","Web Worker","ESLint","Prettier","Husky"]', '["/images/cream-design-1.png","/images/cream-design-2.png"]', 0, 1, 1, NULL, NOW(), NOW()),

(1, 'farmland-dashboard', '高标准农田数据大屏', '基于 Vue3 + 天地图 GIS 的可视化大屏，实现地块信息、交易数据、统计图表的多维度展示。', '为湘潭农交中心开发的高标准农田项目数据可视化大屏，集成天地图 GIS 服务，实现地块信息、交易数据、统计图表的多维度展示。', '农田数据量大，传统地图渲染方式性能差，交互体验不佳', '采用 Canvas 图层叠加、数据分片加载、视口裁剪等技术优化渲染性能', '万级坐标点渲染优化、地图层级切换流畅度、实时数据更新', '渲染时间从 3s 优化到 1.5s，支持 10万+ 数据点流畅展示', '', '', '/images/big-data-watch-1.png', '["Vue3","TypeScript","ECharts","天地图","Vite","Axios","Element UI","Vue Router","Pinia"]', '["/images/big-data-watch-1.png","/images/big-data-watch-2.png"]', 1, 1, 2, '2025-02-20', NOW(), NOW()),

(1, 'vue3-big-event', '大事件文章管理系统', '一个基于 Vue 3 的前后端分离文章管理后台系统，涵盖用户认证、文章发布与管理、分类管理、个人中心等核心模块，采用 Token 鉴权机制、Axios 拦截器、Pinia 持久化状态管理及富文本编辑器，提供完整的内容管理工作流。', '本项目是一个功能完备的文章内容管理后台系统（CMS），基于 Vue 3 Composition API 构建。系统包含用户注册与登录（含表单校验与 Token 鉴权）、文章 CRUD（支持富文本编辑、封面图上传、分类筛选、分页查询、草稿/发布状态管理）、文章分类管理（增删改查）、以及个人中心（基本资料修改、头像上传预览与更换、密码重置）等功能模块。项目采用 Axios 请求/响应拦截器统一处理 Token 注入与异常响应，使用 Pinia 进行全局状态管理并配合持久化插件实现登录态保持，通过 Vue Router 导航守卫实现路由权限控制，整体架构清晰、模块化程度高。', '', '', '', '', 'https://github.com/xixloveixixi/vueBigEvent', '', '', '["Vue 3","Vite 5","Vue Router 4","Pinia","Element Plus","SCSS","Axios","Vue Quill 富文本编辑器","Pinia Plugin Persistedstate"]', '["/images/big-event-1.png","/images/big-event-2.png"]', 0, 1, 4, NULL, NOW(), NOW()),

(1, 'zhangyuan-fan-showcase', '代码情书网站', '一个以歌手张远为主题的沉浸式交互展示网站，涵盖出道历程、歌词打字机、表白情书、烟花特效和音乐播放器五大板块，运用钢琴手风琴相册、卡片悬停动画、时间线组件、Canvas 烟花动画、iframe 嵌套页面等丰富的前端视觉效果，呈现张远从快男出道到披荆斩棘的完整成长轨迹。', '', '', '', '', '', 'https://github.com/xixloveixixi/daimaqingshu', '', '', '["Vue 3","Vite 5","Vue Router 4","Less","SCSS","Element Plus","vue3-typed-js","Canvas API"]', '["/images/dmqs-1.png","/images/dmqs-2.png"]', 0, 1, 5, NULL, NOW(), NOW());