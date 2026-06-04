SET NAMES utf8mb4;

DELETE FROM learning_profile WHERE owner_id = 1;
INSERT INTO learning_profile (owner_id, target_role, background_summary, skill_summary, weakness_summary, learning_preference, resume_snapshot, created_at, updated_at)
VALUES (1, '前端架构师', '3年前端开发经验，熟悉 React 生态', 'React / TypeScript / Next.js / Go', '系统设计、分布式架构', '项目驱动学习，每次只学一个小闭环', NULL, NOW(3), NOW(3));

DELETE FROM learning_goal WHERE owner_id = 1;
INSERT INTO learning_goal (owner_id, title, description, goal_type, priority, deadline, status, progress_percent, created_at, updated_at)
VALUES
(1, '掌握 React Server Components', '深入理解 RSC 渲染模型和数据流', 'skill', 1, '2026-07-01', 'active', 30, NOW(3), NOW(3)),
(1, '完成个人网站后端化', '把所有静态数据迁移到 Go API', 'project', 2, '2026-06-30', 'active', 70, NOW(3), NOW(3)),
(1, '准备系统设计面试', '学习常见分布式系统设计题', 'interview', 3, '2026-08-01', 'not_started', 0, NOW(3), NOW(3));
