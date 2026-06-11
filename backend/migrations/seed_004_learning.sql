-- FB-6: Learning Plan Seed Data
-- 种子数据：1 个计划 + 3 个任务
-- 仅适用于本地开发，不适用于生产环境

-- 清理旧数据（仅开发环境）
DELETE FROM learning_progress WHERE owner_id = 1;
DELETE FROM learning_task WHERE owner_id = 1;
DELETE FROM learning_plan WHERE owner_id = 1;

-- 插入学习计划（关联 learning_goal id=1，假设已有目标）
INSERT INTO learning_plan (owner_id, goal_id, title, description, source, status, start_date, end_date, total_tasks, completed_tasks, created_at, updated_at)
VALUES (1, 1, 'React Server Components 学习计划', '系统学习 RSC 的核心概念和实践应用', 'manual', 'active', '2026-06-01', '2026-06-30', 3, 1, NOW(), NOW());

SET @plan_id = LAST_INSERT_ID();

-- 插入学习任务
INSERT INTO learning_task (owner_id, plan_id, title, description, task_type, status, priority, estimated_minutes, actual_minutes, due_date, completed_at, sort_order, created_at, updated_at)
VALUES 
  (1, @plan_id, '阅读 RSC 官方文档', '理解 RSC 的基础概念、与传统 CSR 的区别', 'learning', 'completed', 1, 60, 75, '2026-06-07', NOW(), 1, NOW(), NOW()),
  (1, @plan_id, '实践：将现有组件改为 Server Component', '选择一个数据获取组件进行改造', 'practice', 'in_progress', 2, 120, 30, '2026-06-14', NULL, 2, NOW(), NOW()),
  (1, @plan_id, '学习 RSC 与 Suspense 配合使用', '理解 streaming 渲染和 loading 状态', 'learning', 'pending', 3, 90, 0, '2026-06-21', NULL, 3, NOW(), NOW());

-- 插入进度记录
SET @task_id = (SELECT id FROM learning_task WHERE owner_id = 1 AND sort_order = 1 LIMIT 1);

INSERT INTO learning_progress (owner_id, task_id, minutes_spent, note, logged_at, created_at)
VALUES 
  (1, @task_id, 45, '完成了 RSC 基础概念的学习，理解了 Server 和 Client 的边界', NOW() - INTERVAL 2 DAY, NOW()),
  (1, @task_id, 30, '补充学习了 use client 和 use server 指令的用法', NOW() - INTERVAL 1 DAY, NOW());
