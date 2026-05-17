# 项目规范索引

本目录包含「AI 学习规划与成长记录平台」前端的开发规范，按模块分类组织。配合 `AGENTS.md` 与 `docs/dev-harness/` 一起使用。

## 规范模块列表

### [01-项目概述](./01-项目概述.md)

- 项目定位（公开作品集 + 私有学习工作台）
- 技术栈（Next.js 14 + Tailwind + Antd + Notion + AI SDK + Zustand + 计划中的 Go/Gin）
- 关键边界（Notion 博客只读、私有数据走 JWT、Harness 推进 Go 后端）

### [02-编码规范](./02-编码规范.md)

- TypeScript 强制使用、`any` 限制、`zod` 校验外部输入
- 命名规范（文件、变量、组件、Hook、Store）
- Server / Client Component 边界

### [03-项目结构](./03-项目结构.md)

- 顶层目录（`app/`、`components/`、`content/`、`lib/`、`docs/`、`tech_design/`、`scripts/`、`specs/`、`supabase/`）
- `app/` 路由权限划分
- `components/` 与 `lib/` 分层
- 禁止新增 `src/` 顶层目录

### [04-组件规范](./04-组件规范.md)

- 分层：`ui` / `shared` / `layout` / `<domain>` / `magicui`
- Tailwind + shadcn + Antd 协作方式
- Children 修改安全规则

### [05-API规范](./05-API规范.md)

- Next.js Route Handlers vs Go REST API
- `/api/public/*` 与 `/api/private/*` 划分
- 统一响应、错误码、函数命名（`getXxxList` / `getXxxDetail` / `createXxx` 等）

### [06-路由规范](./06-路由规范.md)

- App Router 文件式约定（`page.tsx`、`layout.tsx`、`loading.tsx`、`error.tsx` 等）
- 公开 / 私有路由权限表
- 私有学习区共享布局 `LearningWorkspaceLayout`

### [07-状态管理](./07-状态管理.md)

- 状态优先级：Server 数据 > URL > 局部 state > Zustand
- Zustand store 统一放在 `lib/stores/<feature>.ts`
- 持久化与主题切换

### [08-通用约束](./08-通用约束.md)

- 中文注释、Harness 必读
- 项目核心边界（Notion、`owner_id`、不大重构）
- 可观测性与占位元素

### [09-样式规范](./09-样式规范.md)

- Tailwind 优先 + shadcn + Antd
- 主题变量、暗色模式、禁止硬编码颜色
- 设计稿颜色提取流程

### [10-文档规范](./10-文档规范.md)

- JSDoc + 中文注释
- Route Handler 数据源标注
- 与 SDD / Harness 的联动

### [11-测试规范](./11-测试规范.md)

- 当前质量门禁：`type-check` + `lint` + `build`
- 后续按 SDD 14 章分阶段落地，引入需经 Harness 评审

## 使用说明

1. 修改任何代码前，先按 `AGENTS.md` 阅读 Harness 三件套，再查对应规则模块。
2. 所有规则使用 `alwaysApply: false`，按需匹配；通用约束类规则可在 IDE 中常驻。
3. 详细示例与落地步骤见 `.agents/skills/`（如存在）。

## 快速查找

| 需求 | 规范文件 |
|------|----------|
| 项目背景 / 技术栈 | 01-项目概述 |
| 如何命名 / TS 规范 / Server vs Client | 02-编码规范 |
| 代码放哪个目录 | 03-项目结构 |
| 如何创建 / 拆分组件 | 04-组件规范 |
| 如何调用接口 / 错误处理 | 05-API规范 |
| 如何配置路由 / 私有工作台布局 | 06-路由规范 |
| 如何使用 Zustand | 07-状态管理 |
| Harness 流程 / 项目核心边界 | 08-通用约束 |
| Tailwind / 主题 / 设计稿提取 | 09-样式规范 |
| 如何写注释 | 10-文档规范 |
| 测试要求 / 质量门禁 | 11-测试规范 |
