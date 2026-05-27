# 前端 Harness 阶段计划（Track B）

> 后端 Harness 由 `stage-plan.md` 管理（Track A）。本文件管理前端 Next.js 工作台与公开页改造。
> 启动时机：后端 Stage 2 完成（4 张表 API 跑通）后启动前端 Track。

## 使用原则

- 与后端 Track 共用 `progress-log.md` / `pitfalls.md`（按日期写在一起即可）。
- 与后端 Track 解耦推进：前端 FB-X 不依赖后端 BB-Y 时可并行。
- 不允许一次性大范围重构现有前端（沿用 AGENTS.md 限制条款）。
- 公开页迁移到 API 之前，前端静态数据（`data/*.ts`）保留只读不动。

## 当前阶段：FB-1：公开页切 API

### 阶段目标

把现有 Next.js 公开页（个人信息 / 联系方式 / 技能 / 站点配置）从读 `data/*.ts` 静态数据改为调用后端 `/api/public/*`，移除对应静态数据文件，保持页面表现完全不变。

### 本阶段做什么

- 在前端新增 `lib/api/client.ts`：统一 fetch 封装（处理 baseURL、错误码、`{code,message,data,traceId}` 解包）。
- 在 `lib/api/public.ts` 实现 4 个读接口的 typed client。
- 用 Next.js Server Component 直接 `await` 调用，避免引入 SWR/React Query。
- 把现有读取静态数据的 4 处页面切到 API 调用。
- 删除已迁移完毕的 `data/*.ts` 静态文件。
- 加 `loading.tsx` / `error.tsx` 兜底 UI。

### 本阶段不做什么

- 不做 owner 后台管理 UI（FB-2 再做）。
- 不引入 Zustand（公开页是 Server Component，无客户端状态）。
- 不引入 SWR / React Query / Tanstack。
- 不做 ISR / 缓存策略调整（先用默认 SSR，性能优化留后）。
- 不动博客（Notion）相关页面。

### 闸门检查

#### Gate A：需求闸门
- [x] 是否确认本阶段只做公开页 4 个数据源切 API？
- [x] 是否确认 owner 后台不在本阶段？
- [x] 是否确认博客页不动？

#### Gate B：设计闸门
- [x] API client 错误处理策略是否明确（401 跳登录？接口 4xx 显示什么？）？
- [x] Server Component vs Client Component 边界是否清晰？
- [x] 后端 dev 时 `NEXT_PUBLIC_API_BASE` 如何配置（本地 8080 / 生产域名）？
- [x] 与现有静态数据类型如何过渡（先用 `data/types.ts` 类型，逐步替换为 API 类型）？

#### Gate C：学习闸门
- [x] 是否只学 Next.js 14 Server Component 中 `fetch` 的缓存语义？
- [x] 是否只学 `loading.tsx` / `error.tsx` 文件级 boundary？
- [x] 是否只学最小 fetch 错误处理模式？

#### Gate D：编码闸门
- [x] 工具链验证：`node v24.14.1` / `npm 11.11.0` 已验证；后端 `/api/health` 启动后验。
- [x] 是否明确 API client 文件位置：`lib/api/client.ts`、`lib/api/public.ts`？
- [x] 是否确认不破坏现有页面 SEO（meta、title 仍由页面 export）？

#### Gate E：验证闸门
- [ ] `npm run build` 通过，无类型错误。
- [ ] 4 个公开页本地访问与切前完全一致（视觉、内容）。
- [ ] 后端关停时 4 个公开页显示 error.tsx 兜底，不白屏。
- [ ] `data/*.ts` 已迁移项已被删除，未迁移项保留。

#### Gate F：沉淀闸门
- [ ] `progress-log.md` 已更新。
- [ ] 踩坑写入 `pitfalls.md`（特别是 SSR fetch / 环境变量类）。
- [ ] 是否明确 FB-2 范围。

### 降级策略

- 后端未就绪：先用 `mock` 中间层（`lib/api/mock.ts`）返回与 API 一致的结构，保证前端可独立推进。
- Server Component fetch 缓存语义复杂：先全部 `cache: 'no-store'`，性能优化留后。
- 类型重复维护：前后端类型暂用前端手写 TS interface，OpenAPI 生成留后。

---

## FB-2（占位）：Owner 后台管理 UI

> 进入前再补 Gate A-F。候选范围：
> - `/admin` 路由组，登录页（调用 `POST /api/auth/login`）。
> - 4 张表的 Antd Table + Form 编辑面板。
> - Zustand 管理登录态（`lib/stores/auth.ts`）。
> - 路由级守卫（未登录跳 `/admin/login`）。

## FB-3（占位）：sys_user 与权限

> 进入前提：后端引入 `sys_user` 表后启动。

## FB-4（占位）：私有学习工作台

> 与后端 LangChain 接入阶段对齐启动。

---

## Track 协同规则

- 前端 FB-X 与后端 Stage-Y 在 `progress-log.md` 同日同条记录，用 `[FB-1] / [BE-Stage2]` 前缀区分。
- 跨 Track 决策（如改接口字段、改错误码）必须双向同步 `api-contract.md`，并在两边 progress-log 留痕。
- 任一 Track 触发降级时，另一 Track 必须评估是否受影响。
