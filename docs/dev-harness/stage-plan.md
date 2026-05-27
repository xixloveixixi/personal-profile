# 研发 Harness 阶段计划

## 使用原则

- 每次只推进一个可验证小闭环。
- 每个阶段先明确“不做什么”，再明确“做什么”。
- 编码前必须确认影响范围、依赖关系、验收标准。
- 每个阶段只学习当前功能所需的最小知识。
- 卡住超过 2 天时，必须降级方案。

## 阶段 1 Go 后端最小底座（已完成）

### 阶段目标

跑通一个可启动、可调试、可鉴权的 Go 后端最小服务，为后续公开数据后端化、私有学习工作台和 LangChain 接入打基础。

### 本阶段做什么

- 初始化 Go 后端项目。
- 接入 Gin 路由框架。
- 实现统一响应结构。
- 实现全局错误处理。
- 实现健康检查接口。
- 实现登录接口雏形。
- 实现 JWT 中间件和未登录拦截。
- 接入 Swagger，或先用手写接口文档 / Postman 验证。

### 本阶段不做什么

- 不做复杂 RBAC。
- 不做后台低代码页面。
- 不做项目、个人信息、学习数据等业务 CRUD。
- 不接 LangChain。
- 不迁移 Notion 博客。
- 不一次性设计完整后端工程最佳实践。

### 闸门检查

#### Gate A：需求闸门

- [ ] 当前阶段目标是否明确？
- [ ] 是否确认本阶段只做 Go 后端底座？
- [ ] 是否确认不做业务 CRUD 和 LangChain？

#### Gate B：设计闸门

- [ ] 是否明确最小接口？
- [ ] 是否明确统一响应格式？
- [ ] 是否明确登录态校验方式？
- [ ] 是否明确错误码？

#### Gate C：学习闸门

- [ ] 是否只学习 Go module、`main.go`、Gin 路由最小结构？
- [ ] 是否只学习 Handler / Service / DTO 基础？
- [ ] 是否只学习 JWT 中间件基础？

#### Gate D：编码闸门
- [ ] 工具链验证：`go version` / `node -v` / `mysql --version` 已通过
- [ ] 是否明确新增后端目录位置？
- [ ] 是否明确不会影响当前 Next.js 公开页面？
- [ ] 是否明确本阶段验收方式？

#### Gate E：验证闸门

- [x] Go 服务能本地启动。
- [x] `GET /api/health` 返回成功。
- [x] `POST /api/auth/login` 能返回 token。
- [x] JWT 中间件能拦截未登录请求并返回 401。
- [x] Swagger 能访问，或已用手写接口文档 / Postman 完成验证。

#### Gate F：沉淀闸门

- [x] 是否更新 `progress-log.md`？
- [x] 是否把踩坑写入 `pitfalls.md`？
- [x] 是否明确下一阶段是否可以开始？

## 第一周建议节奏

| 天数 | 目标 | 产出 |
| --- | --- | --- |
| Day 1 | 确认后端项目位置与阶段目标 | 阶段计划确认 |
| Day 2 | 学 Go module、Gin 最小结构并初始化项目 | 可启动项目 |
| Day 3 | 实现健康检查和统一响应 | `GET /api/health` |
| Day 4 | 实现登录接口雏形 | `POST /api/auth/login` |
| Day 5 | 实现 JWT 中间件与 401 拦截 | 私有接口保护 |
| Day 6 | 补接口文档和错误处理 | Swagger 或手写接口文档 |
| Day 7 | 阶段复盘 | 进入阶段 2 或降级调整 |

## 降级策略

- 如果 Go 项目初始化卡住：先使用最小 Gin Web 项目，不接 MySQL。
- 如果 JWT 卡住：先用固定 owner token 模拟登录态。
- 如果接口文档卡住：先用 Postman / curl 手测，Swagger 后补。
- 如果工程结构纠结：先采用 `cmd / internal/handler / internal/service / internal/middleware` 最小结构。

---

## 阶段 2 公开数据后端化（profile 最小集）（已完成）

### 阶段目标

把 4 张公开数据表（`public_profile` / `public_contact` / `public_skill` / `site_config`）从前端静态数据迁移到 Go API + MySQL，跑通 GORM + 一套读写 CRUD 模式，为 Stage 3 前端接入打好基础。

### 本阶段做什么

- Homebrew 本地安装 MySQL 8/9（实际安装 9.6.0），建库建用户。
- 引入 GORM，封装 DB 连接（DSN 从 env 读）。
- 在 `docs/dev-harness/schema.md` 冻结 4 张表 DDL，编写 migration（手写 SQL 或 GORM AutoMigrate 二选一）。
- 在 `docs/dev-harness/api-contract.md` 冻结读写接口契约。
- 实现公开读接口（guest 可访问）：4 张表的 `GET /api/public/...`。
- 实现 owner 写接口（JWT + owner role）：4 张表的 `POST/PUT/DELETE /api/admin/...`。
- 准备种子数据 SQL（从前端静态数据 dump），便于本机/部署环境初始化。
- 用 curl 完成全接口验证，更新 `backend/docs/api.md`。

### 本阶段不做什么

- 不碰前端：公开页继续读静态数据，前端切 API 留 Stage 3。
- 不做 `sys_user` 表：登录仍走 Stage 1 硬编码 owner 凭据。
- 不碰学习数据相关表（SDD 10.9-10.14）。
- 不接 LangChain / Agent 相关表（10.15-10.17）。
- 不做后台管理 UI、不做权限分组、不做软删除恢复界面。
- 不做缓存、不做分页排序高级特性（`GET` 全量返回即可）。

### 闸门检查

#### Gate A：需求闸门

- [x] 是否确认本阶段只做 4 张公开数据表的后端化？
- [x] 是否确认前端不变、登录不动 `sys_user`？
- [x] 是否确认验收标准是 curl 全通 + 种子数据可灌入？

#### Gate B：设计闸门

- [x] `docs/dev-harness/schema.md` 中 4 张表 DDL 是否已冻结？
- [x] `docs/dev-harness/api-contract.md` 中读 + 写接口是否已冻结？
- [x] DB 连接配置（DSN、连接池上限）是否已确定？
- [x] migration 方式（手写 SQL vs GORM AutoMigrate）是否已选定？
- [x] owner 写接口的鉴权策略（JWT + role 字段）是否已明确？

#### Gate C：学习闸门

- [x] 是否只学 GORM 最小 API（`Open` / `AutoMigrate` / `Create` / `First` / `Find` / `Save` / `Delete`）？
- [x] 是否只学 `database/sql` driver 注册和连接池基础？
- [x] 是否只学 MySQL 8 本机安装、建库建用户、`mysql -u` 登录？

#### Gate D：编码闸门

- [x] 工具链验证：`go version` / `mysql --version` / `mysql -u root -p` 登录均通过。
- [x] DB 连接配置项已加入 `internal/config/config.go`，且本地已能 `Ping` 成功。
- [x] 是否明确新增 package 位置：`internal/repository`（GORM 操作层）、`internal/model`（GORM model 定义）？
- [x] 是否确认 handler 不直接调 GORM，必须通过 repository？
- [x] 是否明确本阶段验收方式（curl 全通 + 种子数据可重复灌入）？

#### Gate E：验证闸门

- [x] MySQL 本机服务可启动，库表已建。
- [x] 全部 4 张表的读接口 curl 返回正确 JSON。
- [x] 全部 4 张表的写接口需 Bearer Token，无 token 返回 401。
- [x] 种子 SQL 在空库上一次执行成功，幂等可重复执行。
- [x] `backend/docs/api.md` 已更新，含新接口的 curl 验证命令。

#### Gate F：沉淀闸门

- [ ] 是否更新 `progress-log.md`？
- [ ] 是否把踩坑写入 `pitfalls.md`？
- [ ] 是否同步更新 `schema.md` / `api-contract.md` 的"已冻结"区块？
- [ ] 是否明确 Stage 3 范围（前端切 API or 引入 sys_user）？

### Stage 2 设计决策（Day 2 冻结）

- **DB 连接配置**：DSN 从 env 读取，键名 `BACKEND_DB_DSN`，默认值 `pp_app:pp_dev_pwd@tcp(127.0.0.1:3306)/personal_profile?charset=utf8mb4&parseTime=True&loc=Local`。`internal/config` 增加 `DB.DSN`、`DB.MaxOpenConns=20`、`DB.MaxIdleConns=5`、`DB.ConnMaxLifetime=1h`。本机开发凭据沿用 Day 1 创建的 `pp_app@localhost / pp_dev_pwd`。
- **Migration 方式**：采用 **手写 SQL**（`backend/migrations/NNNN_*.sql`），简单顺序号命名，启动时不自动执行；通过本地命令 `mysql -u pp_app -p personal_profile < backend/migrations/0001_init.sql` 灌入。GORM AutoMigrate 仅作开发期辅助，不进 main 启动路径，避免 schema 漂移。
- **种子数据**：`backend/migrations/seed_*.sql`（与 schema migration 分目录或仅前缀区分），可在空库上重复执行（`INSERT ... ON DUPLICATE KEY UPDATE` 或 `INSERT IGNORE`）。
- **owner 校验策略**：`/api/admin/*` 接入 Stage 1 已实现的 `JWTAuth` 中间件，仅校验"有效 Token"；不校验 `role` 字段。Stage 3 引入 `sys_user` 后再加 `RequireOwnerRole` 中间件包裹 `/api/admin/*` 路由组。
- **owner_id 模型**：Stage 2 没有 `sys_user`，所有写入固定 `owner_id = 1`；从 `internal/config` 暴露常量 `OwnerID=1`，handler/repository 不做参数化。
- **包结构新增**：`internal/model`（GORM model）、`internal/repository`（GORM 操作层）。Handler 不直接调 GORM，必须通过 repository。

### 节奏建议

| 天数 | 目标 | 产出 |
| --- | --- | --- |
| Day 1 | 装 MySQL，建库建用户，过 Gate A/B 部分项 | 本机 mysql 可登录 |
| Day 2 | 冻结 schema.md 4 表 DDL + api-contract.md 接口 | 两份契约文档 |
| Day 3 | 引入 GORM，封装连接，完成 `public_profile` CRUD | 单表跑通 |
| Day 4 | 复用模式完成 `public_contact` / `public_skill` | 多表打通 |
| Day 5 | 完成 `site_config` + 种子 SQL + 路由整合 | 全接口可用 |
| Day 6 | 鉴权策略落地 + curl 全通 | Gate E 主要项 |
| Day 7 | 阶段复盘 + 更新文档 | 进入 Stage 3 |

### 降级策略

- 如果 Homebrew 装 MySQL 卡住：切换到 Docker `mysql:8` 镜像。
- 如果 GORM 学习成本超预期：先用 `database/sql` + `sqlx`，GORM 留 Stage 3。
- 如果 owner role 字段设计纠结：本阶段所有 `/api/admin/*` 只校验"有效 token"，role 校验留到引入 `sys_user` 时。
- 如果 migration 方式选不定：先用手写 SQL（`backend/migrations/*.sql`），AutoMigrate 留作纯本地辅助。

### 进入前置条件

- [x] Stage 1 Gate E/F 全部通过。
- [x] MySQL 本机可用（Homebrew 安装方式已选定，实际版本 9.6.0）。
- [x] 范围已确认（4 张表 profile/contact/skill/site_config）。
- [x] `schema.md` / `api-contract.md` 的 Stage 2 候选清单已按 SDD 10.x / 9.x 填齐为待冻结状态。

---

## 当前阶段：阶段 3 前端公开页切 API (FB-1)

### 阶段目标

把现有 Next.js 公开页（个人信息 / 联系方式 / 技能 / 站点配置）从读 `data/*.ts` 静态数据改为调用后端 `/api/public/*`，移除对应静态数据文件，保持页面表现完全不变。

### 本阶段做什么

- 新增 `lib/api/client.ts`：统一 fetch 封装（baseURL、错误码、`{code,message,data,traceId}` 解包）。
- 新增 `lib/api/public.ts`：4 个读接口的 typed client。
- 用 Next.js Server Component 直接 `await` 调用，不引入 SWR/React Query。
- 把现有读静态数据的 4 处页面切到 API 调用。
- 删除已迁移完毕的 `content/about/contact.json` / `content/about/skills.json` 静态文件（`content/about/timeline.json` 暂留，无对应 API）。
- 加 `loading.tsx` / `error.tsx` 兜底 UI。

### 本阶段不做什么

- 不做 owner 后台管理 UI（FB-2 再做）。
- 不引入 Zustand（公开页是 Server Component，无客户端状态）。
- 不引入 SWR / React Query / Tanstack。
- 不做 ISR / 缓存策略调整（先全量 `cache: 'no-store'`）。
- 不动博客（Notion）相关页面。
- 不做 sys_user 表（登录仍走 Stage 1/2 硬编码 owner 凭据）。

### 闸门检查

#### Gate A：需求闸门

- [x] 是否确认本阶段只做公开页 4 个数据源切 API？
- [x] 是否确认 owner 后台不在本阶段？
- [x] 是否确认博客页不动、sys_user 不动？

#### Gate B：设计闸门

- [x] API client 错误处理策略是否明确（接口 4xx 显示 error.tsx，无 401 跳转）？
- [x] Server Component vs Client Component 边界是否清晰（公开页全 Server Component）？
- [x] 本地开发 `NEXT_PUBLIC_API_BASE=http://localhost:8080` 配置方式是否确认？
- [x] 类型策略是否确认（前端手写 TS interface，对齐 api-contract.md）？

#### Gate C：学习闸门

- [x] 是否只学 Next.js 14 Server Component 中 `fetch` 的缓存语义？
- [x] 是否只学 `loading.tsx` / `error.tsx` 文件级 boundary？
- [x] 是否只学最小 fetch 错误处理模式？

#### Gate D：编码闸门

- [x] 工具链验证：`node v24.14.1` / `npm 11.11.0` 已验证；后端启动后再验 `/api/health`。
- [x] 是否明确 API client 文件位置：`lib/api/client.ts`、`lib/api/public.ts`？
- [x] 是否确认不破坏现有页面 SEO（meta、title 仍由页面 export）？

#### Gate E：验证闸门

- [x] `npm run build` 通过，无类型错误。
- [x] 4 个公开页本地访问与切前完全一致（视觉、内容）。
- [x] 后端关停时 4 个公开页显示 error.tsx 兜底，不白屏。
- [x] `content/about/contact.json` / `content/about/skills.json` 已迁移项已被删除，`timeline.json` 保留。

#### Gate F：沉淀闸门

- [ ] 是否更新 `progress-log.md`？
- [ ] 踩坑写入 `pitfalls.md`（特别是 SSR fetch / 环境变量类）？
- [ ] 是否明确 FB-2 范围（owner 后台管理 UI）？

### 节奏建议

| 天数 | 目标 | 产出 |
| --- | --- | --- |
| Day 1 | 确认 Gate A/B/D，新增 `lib/api/client.ts` + `lib/api/public.ts` | API client 可调通 |
| Day 2 | 切 profile + contact 公开页到 API | 2 页切换完成 |
| Day 3 | 切 skill + site_config 公开页，删静态文件 | 4 页全切完 |
| Day 4 | 加 loading.tsx / error.tsx + `npm run build` 验收 | Gate E 全通 |
| Day 5 | 阶段复盘 + 文档更新 | 进入 FB-2 |

### 降级策略

- 后端未就绪：先用 `lib/api/mock.ts` 返回与 API 一致的结构，保证前端可独立推进。
- Server Component fetch 缓存语义复杂：先全部 `cache: 'no-store'`，性能优化留后。
- 类型重复维护：前端手写 TS interface，OpenAPI 生成留后。

### 进入前置条件

- [x] Stage 2 Gate E/F 全部通过。
- [x] 后端 4 张表 API 可用（`curl /api/public/profile` 等返回正确 JSON）。
- [x] 范围已确认（4 张公开页切 API，不做后台、不动博客）。

