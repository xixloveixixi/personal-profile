# 研发 Harness 阶段计划

## 使用原则

- 每次只推进一个可验证小闭环。
- 每个阶段先明确“不做什么”，再明确“做什么”。
- 编码前必须确认影响范围、依赖关系、验收标准。
- 每个阶段只学习当前功能所需的最小知识。
- 卡住超过 2 天时，必须降级方案。

## 轻量 Harness 架构

- `stage-plan.md`：给人看的阶段计划和 Gate A-F 清单。
- `state.json`：给脚本读的当前阶段状态；当前阶段必须和本文件的 `## 当前阶段：...` 保持一致。
- `api-contract.md` / `schema.md`：业务后端和前端联调前的契约源。
- `progress-log.md`：事实日志，只记录完成、阻塞、决策和下一步。
- `pitfalls.md`：可复用踩坑库，只记录未来可能复发的问题。
- `npm run harness:check`：轻量自检。硬错误只用于明显漂移；未完成 Gate 默认提示为 warning，不阻断日常小闭环。

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

- [x] 是否更新 `progress-log.md`？
- [x] 是否把踩坑写入 `pitfalls.md`？
- [x] 是否同步更新 `schema.md` / `api-contract.md` 的"已冻结"区块？
- [x] 是否明确 Stage 3 范围（前端切 API or 引入 sys_user）？

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

## 阶段 3 前端公开页切 API (FB-1)（已完成）

### 阶段目标

把现有 Next.js 公开页（个人信息 / 联系方式 / 技能 / 站点配置）从读 `data/*.ts` 静态数据改为调用后端 `/api/public/*`，移除对应静态数据文件，保持页面表现完全不变。

### 本阶段做什么

- 新增 `lib/api/client.ts`：统一 fetch 封装（baseURL、错误码、`{code,message,data,traceId}` 解包）。
- 新增 `lib/api/public.ts`：4 个读接口的 typed client。
- 用 Next.js Server Component 直接 `await` 调用，不引入 SWR/React Query。
- 把现有读静态数据的 4 处页面切到 API 调用。
- 删除已迁移完毕的 `content/about/contact.json` / `content/about/skills.json` 静态文件（`content/about/timeline.json` 当时暂留，无对应 API；本轮补齐后端化缺口）。
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
- [x] `content/about/contact.json` / `content/about/skills.json` 已迁移项已被删除；`timeline.json` 为后续补齐后端化预留。 

#### Gate F：沉淀闸门

- [x] 是否更新 `progress-log.md`？
- [x] 踩坑写入 `pitfalls.md`（特别是 SSR fetch / 环境变量类）？
- [x] 是否明确 FB-2 范围（owner 后台管理 UI）？

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

---

## 阶段 4 Owner 后台管理 UI (FB-2)（已完成）

### 阶段目标

实现 `/admin` 后台管理界面：登录页 + 4 张表（profile / contact / skill / site_config）的 CRUD 管理面板，Zustand 管理登录态，middleware 路由守卫。

### 本阶段做什么

- 创建 `/admin/login` 登录页，调用 `POST /api/auth/login` 获取 token。
- Zustand + persist 保存登录态（token / username）。
- Next.js middleware 路由守卫：未登录跳 `/admin/login`。
- 4 张表的 Antd Table 列表 + Form 编辑（Modal 形式）。
- 复用 `lib/api/client.ts`，新增 `lib/api/admin.ts`（带 Bearer token）。

### 本阶段不做什么

- 不做 sys_user / 权限系统（FB-3 再做）。
- 不动公开页（FB-1 已完成）。
- 不做博客管理。
- 不做 ISR / 缓存优化。

### 闸门检查

#### Gate A：需求闸门

- [x] 本阶段只做 `/admin` 后台管理 UI，不动公开页。
- [x] 做的范围：登录页 + 4 张表的 Table + Form 编辑面板。
- [x] 不做权限系统、博客管理。
- [x] 验收标准：登录后能增删改查 4 张表，刷新后登录态保持。

#### Gate B：设计闸门

- [x] 路由结构：`/admin/login`、`/admin/dashboard`、`/admin/profile`、`/admin/contacts`、`/admin/skills`、`/admin/site-config`。
- [x] 登录态：Zustand + persist（localStorage），store key = `admin-auth`。
- [x] 路由守卫：`middleware.ts`，matcher 覆盖 `/admin` 与 `/admin/*`，排除 `/admin/login`。
- [x] UI 组件库：Antd 5（已安装）。
- [x] API 调用：复用 `lib/api/client.ts`，新增 `lib/api/admin.ts`（带 Bearer token）。

#### Gate C：学习闸门

- [x] Next.js middleware 路由守卫基本用法。
- [x] Zustand + persist 基本用法。
- [x] Antd Table + Form 最小用法。

#### Gate D：编码闸门

- [x] `antd` 5.29.3 已在 package.json。
- [x] 后端 `POST /api/auth/login` 已实现（router.go 已注册）。
- [x] 4 张表 admin CRUD 接口已在 `api-contract.md` 冻结。

#### Gate E：验证闸门

- [x] `/admin/login` 登录成功后跳转 `/admin/dashboard`。
- [x] 未登录访问 `/admin/profile` 自动跳 `/admin/login`。
- [x] 刷新页面后登录态保持。
- [x] 4 张表 CRUD 操作正常（新增 / 编辑 / 删除 / 列表）。
- [x] `npm run build` 通过。

#### Gate F：沉淀闸门

- [x] `progress-log.md` 已更新。
- [x] 踩坑写入 `pitfalls.md`。
- [x] FB-3 范围已明确。

### 进入前置条件

- [x] FB-1 Gate E/F 全部通过。
- [x] 后端 Stage 2 admin CRUD 接口可用。
- [x] FB-2 Gate A-D 已确认。

---

## 阶段 5 sys_user 与权限 (FB-3)（已完成）

### 阶段目标

引入 `sys_user` 表，登录改为 DB 校验（bcrypt），admin 接口增加 `RequireOwnerRole` 中间件；前端做最小兼容（登录响应新增 `user.id`），不新增复杂权限 UI。

### 本阶段做什么

- 新增 `sys_user` 表（DDL + migration + 种子 SQL）。
- 改造 `POST /api/auth/login`：从 DB 查用户 + bcrypt 校验密码。
- 改造 `GET /api/auth/me`：从 DB 查 sys_user 返回用户信息。
- 新增 `RequireOwnerRole` 中间件，挂到 `/api/admin/*` 路由组。
- 删除 `config.go` 中的硬编码 `OwnerUsername` / `OwnerPassword`。
- JWT claims 增加 `user_id` 字段。
- 前端 `lib/stores/auth.ts` 适配登录响应 `user.id` 字段。
- 种子 SQL 灌入初始 owner 用户（username=owner, password=bcrypt("owner123")）。

### 本阶段不做什么

- 不做用户注册/邀请接口。
- 不做 RBAC 多角色（仅 owner）。
- 不动公开页、后台 CRUD UI、博客。
- 不做修改密码接口（留后续）。
- 不做多用户体系。

### 闸门检查

#### Gate A：需求闸门

- [x] 是否确认本阶段只做 sys_user + 登录改 DB + admin role 校验？
- [x] 是否确认不做用户注册/多角色/修改密码？
- [x] 验收标准：旧硬编码凭据删除后，种子用户能登录并操作 admin 接口；错误 role 返回 403。

#### Gate B：设计闸门

- [x] `schema.md` 中 `sys_user` DDL 是否已冻结？
- [x] `api-contract.md` 中 login/me 改造 + RequireOwnerRole 中间件是否已冻结？
- [x] 密码哈希策略是否确认（bcrypt, cost=10）？
- [x] JWT claims 结构是否确认（增加 `user_id`）？
- [x] 种子 SQL 策略是否确认（INSERT ... ON DUPLICATE KEY UPDATE）？

#### Gate C：学习闸门

- [x] 是否只学 `golang.org/x/crypto/bcrypt` 最小 API（`GenerateFromPassword` / `CompareHashAndPassword`）？
- [x] 是否只学 Gin middleware 链式调用（Auth → RequireOwnerRole → handler）？

#### Gate D：编码闸门

- [ ] `go build ./...` 当前通过？
- [ ] 是否明确新增文件位置：`internal/model/sys_user.go`、`internal/repository/sys_user.go`、`internal/middleware/role.go`？
- [ ] 是否确认不影响公开页和后台 CRUD 现有功能？
- [ ] 验收方式：curl 全通 + 种子数据可灌入 + `npm run build` 通过。

#### Gate E：验证闸门

- [x] `sys_user` 表已建，种子 owner 用户可灌入。
- [x] `POST /api/auth/login` 使用 DB 校验，旧硬编码已删除。
- [x] 正确密码登录成功返回 token + user info；错误密码返回 `40100`。
- [x] `GET /api/auth/me` 从 DB 返回用户信息。
- [x] `/api/admin/*` 接口：有效 token + role=owner 正常访问；role 不匹配返回 `40300`。
- [x] 前端 `npm run build` 通过，登录流程不受影响。
- [x] `go build ./...` 通过。

#### Gate F：沉淀闸门

- [x] `progress-log.md` 已更新。
- [x] 踩坑写入 `pitfalls.md`。
- [x] 下一阶段范围已明确。

### 节奏建议

| 天数 | 目标 | 产出 |
| --- | --- | --- |
| Day 1 | 确认 Gate A/B，冻结契约，写 migration + 种子 SQL | sys_user 表可用 |
| Day 2 | 实现 sys_user model + repository + 改造 login handler | bcrypt 登录跑通 |
| Day 3 | 改造 /auth/me + 新增 RequireOwnerRole + 删硬编码 | admin 全链路跑通 |
| Day 4 | 前端适配 + npm run build + 全量 curl 验收 | Gate E 全通 |
| Day 5 | 阶段复盘 + 文档更新 | 进入下一阶段 |

### 降级策略

- bcrypt 引入卡住：先用 SHA256+salt（安全性稍低但可快速推进），后续补 bcrypt。
- RequireOwnerRole 影响面大：先仅在 router 中加空中间件占位，验收时手动确认 role claim 存在。
- 前端适配复杂：先不存 userId，仅确保登录响应字段向后兼容。

### 进入前置条件

- [x] FB-2 Gate E/F 全部通过。
- [x] `schema.md` 中 `sys_user` DDL 已冻结。
- [x] `api-contract.md` 中 login/me 改造接口已冻结。

---

## 阶段 6：项目展示后端化 + 前端切 API + 后台 CRUD (FB-4)（已完成）

### 阶段目标

把项目展示数据从前端静态 JSON（`content/projects/*.json`）迁移到 Go API + MySQL，实现公开读 + admin CRUD，前端切 API 后删除静态数据文件。

### 本阶段做什么

- 新增 `portfolio_project` 表（DDL + migration + 种子 SQL）。
- 实现公开读接口：`GET /api/public/projects`（列表）、`GET /api/public/projects/:slug`（详情）。
- 实现 owner 写接口：`GET/POST/PUT/DELETE /api/admin/projects(/:id)`。
- 前端 `lib/api/public.ts` 新增 `getPublicProjects` / `getPublicProjectBySlug`。
- 前端 portfolio 页面从 `fs.readFileSync` 改为调用后端 API。
- 后台新增 `/admin/projects` 管理页面（Antd Table + Form）。
- 删除 `content/projects/*.json` 静态数据文件和 `lib/content/projects.ts`。
- 种子 SQL 灌入当前 5 个项目数据。

### 本阶段不做什么

- 不做图片上传（继续用 `public/images/` 静态引用）。
- 不做分页、排序参数、模糊搜索（全量返回）。
- 不做学习工作台、LangChain。
- 不动博客。
- 不拆 `portfolio_project_tech` 子表。

### 闸门检查

#### Gate A：需求闸门

- [x] 是否确认本阶段只做 portfolio_project 单表的后端化 + 前端切 API + 后台 CRUD？
- [x] 是否确认不做图片上传、不拆技术栈子表、不做学习工作台？
- [x] 验收标准：curl 全通 + 前端 portfolio 页面表现不变 + 后台可增删改查 + `npm run build` 通过？

#### Gate B：设计闸门

- [x] `schema.md` 中 `portfolio_project` DDL 是否已冻结？
- [x] `api-contract.md` 中 6 个接口（2 公开读 + 4 admin 写）是否已冻结？
- [x] JSON 数组字段（technologies/gallery）存储与序列化方式是否确认？
- [x] 前端 API client 新增函数位置是否确认（`lib/api/public.ts`）？
- [x] 后台页面路由是否确认（`/admin/projects`）？

#### Gate C：学习闸门

- [x] 是否了解 GORM JSON 字段的读写方式（`datatypes.JSON` 或自定义 Scanner/Valuer）？
- [x] 是否了解 Next.js Server Component 中 `generateStaticParams` 的动态化改造？

#### Gate D：编码闸门

- [x] `go build ./...` 当前通过。
- [x] `npm run build` 当前通过。
- [x] 新增文件位置已确认（model/repo/handler）。
- [x] 前端切 API 不影响 SEO（slug 路由保持、meta 保持）。

#### Gate E：验证闸门

- [x] `portfolio_project` 表已建，种子数据（5 个项目）可灌入。
- [x] 公开 API：`GET /api/public/projects` 返回列表；`GET /api/public/projects/:slug` 返回详情。
- [x] Admin API：6 个接口 curl 全通（带 token + role=owner）。
- [x] 前端 portfolio 列表页 + 详情页表现与迁移前一致（用户浏览器验收通过）。
- [x] 后台 `/admin/projects` CRUD 操作正常（用户浏览器验收通过）。
- [x] `content/projects/*.json` 与 `lib/content/projects.ts` 已删除。
- [x] `npm run build` 通过。
- [x] `go build ./...` 通过。

#### Gate F：沉淀闸门

- [x] `progress-log.md` 已更新。
- [x] 踩坑写入 `pitfalls.md`。
- [x] 下一阶段范围已明确。

### 节奏建议

| 天数 | 目标 | 产出 |
| --- | --- | --- |
| Day 1 | 确认 Gate A/B，冻结契约，写 migration + 种子 SQL | portfolio_project 表可用 |
| Day 2 | 实现 model + repository + 6 个 handler + 路由注册 | 后端 curl 全通 |
| Day 3 | 前端切 API：portfolio 列表页 + 详情页 | 前端不读本地 JSON |
| Day 4 | 后台 /admin/projects CRUD 页面 | 后台可管理项目 |
| Day 5 | 删静态文件 + build 验收 + Gate F | 阶段完成 |

### 降级策略

- GORM JSON 字段卡住：改用 TEXT 字段 + handler 层 json.Marshal/Unmarshal。
- generateStaticParams 改造复杂：portfolio 详情页改 `force-dynamic`。
- 后台 CRUD 页面耗时：先只实现列表 + 新增，编辑/删除后补。

### 进入前置条件

- [x] FB-3 Gate E/F 全部通过。
- [x] `schema.md` 中 `portfolio_project` DDL 已冻结。
- [x] `api-contract.md` 中 6 个接口已冻结。

---

## 当前阶段：阶段 11 Learning Coach 体验增强（FB-8）

### 阶段目标

在已完成 Agent 对话、历史回放和计划生成的基础上，增强 Learning Coach 的可用性与稳定性：补齐消息状态反馈和更稳定的多轮体验，让 AI 教练从“能用”提升到“更顺手”。

### 本阶段做什么

- 保持兼容消费 Tool 调用事件（不在本阶段展示 Tool 状态）。
- 增强消息状态反馈（发送中、流式生成中、失败重试）。
- 优化多轮对话体验：切换会话、续聊、删除会话后的状态一致性。
- 优化历史加载体验：更早消息加载中的占位、去重、防重复请求。
- 视需要补最小后端/Agent 接口字段，支撑前端展示更完整的事件信息。

### 本阶段不做什么

- 不做多 Agent 协作。
- 不做长期记忆表（`agent_memory`）。
- 不做外部搜索或资料抓取。
- 不做复杂数据分析看板。
- 不做 Tool 调用过程可视化。
- 不重构现有学习计划 / 学习目标主流程。

### 闸门检查

#### Gate A：需求闸门

- [x] 是否确认本阶段只做 Learning Coach 体验增强，不扩展到新业务域？
- [x] 是否确认优先级聚焦在消息状态反馈、多轮会话稳定性和历史加载稳定性？
- [x] 是否确认验收标准是：聊天体验更可感知、历史/续聊更稳定、现有构建与接口不回退？

#### Gate B：设计闸门

- [x] 是否明确前端展示哪些 Agent 事件类型（本阶段展示 `token` / `done` / `error`；`tool_call` / `tool_result` 仅消费以保持流稳定，不展示状态）？
- [x] 是否明确是否需要新增或调整 Python SSE 事件字段（优先不改协议；仅当失败态无法区分时，才最小补充 `retryable` 或等价字段）？
- [x] 是否明确前端状态机（最小方案：`idle → sending → streaming → done | error`，不引入全局 store）？
- [x] 是否明确失败恢复策略（仅支持“重发上一条用户消息”，不做断点续流）？
- [x] 是否明确空状态区分（无历史会话 vs 当前会话暂无消息）？

#### Gate C：学习闸门

- [x] 是否了解当前聊天页 SSE 消费链路与消息状态管理方式？
- [x] 是否了解 Python Agent SSE 事件结构与落库链路？

#### Gate D：编码闸门

- [x] 是否明确影响范围仅限 `app/admin/learning/chat`、相关 API client 与必要的 agent-service 事件结构？
- [x] 是否明确验收方式（浏览器实测 + `npm run build` + agent-service 启动/导入验证）？

#### Gate E：验证闸门

- [x] Tool 调用事件可被前端兼容消费，且不会打断现有流式回复。
- [x] 会话切换 / 删除 / 续聊行为稳定，无重复消息或错乱状态。
- [x] 历史加载更早消息时无重复请求、无重复渲染。
- [x] `npm run build` 通过。
- [x] agent-service 导入 / 启动验证通过。

#### Gate F：沉淀闸门

- [x] `progress-log.md` 已更新。
- [x] 新踩坑已写入 `pitfalls.md`（如有）。
- [x] 下一阶段范围已明确。

### 进入前置条件

- [x] 阶段 10 Gate E/F 已通过（见 `progress-log.md` 2026-06-13）。
- [x] 现有 Agent 对话、历史回放、计划生成链路可用。

---

## 下一阶段候选：阶段 12 私有学习知识图谱（FB-9）（草案）

> 状态：已完成设计草案，等待阶段 11 Gate E/F 完成后进入 REQUIREMENT。
> 设计文档：`docs/superpowers/specs/2026-06-15-learning-knowledge-graph-design.md`

### 阶段目标

在现有学习画像、学习目标、学习计划和 AI Coach 之上，新增私有学习知识图谱，作为 AI 教练制定目标、生成计划、分析能力差距和解释推荐依据的结构化上下文。

### 本阶段做什么

- 新增 `knowledge_node` / `knowledge_edge` 两张图谱表，支持技能、知识点、项目、目标、薄弱点、资源等节点。
- 冻结知识图谱 CRUD、初始化、摘要、目标相关子图、下一步路径推荐等私有接口。
- 在学习工作台左侧菜单分组下新增 `知识图谱` 子页面，采用管理优先形态。
- 支持从现有学习目标、学习计划/任务、公开技能、项目数据初始化图谱。
- 为 Python Agent 新增只读图谱工具：整体摘要、目标相关子图、下一步学习路径。
- 将目标相关知识子图接入计划生成 prompt 和 Learning Coach 聊天依据。

### 本阶段不做什么

- 不做公开个人站展示。
- 不做复杂图谱画布或拖拽编辑。
- 不允许 AI 直接写入图谱；后续再做“AI 建议变更 + 用户确认”。
- 不做多 Agent 协作。
- 不替代现有学习画像、学习目标、学习计划，只作为补充依据。

### 闸门检查

#### Gate A：需求闸门

- [ ] 是否确认本阶段聚焦私有学习知识图谱，不做公开展示？
- [ ] 是否确认第一版采用“CRUD + 目标相关子图 + 简单路径推荐”？
- [ ] 是否确认 AI 第一版只读图谱，不直接写入节点和关系？
- [ ] 是否确认验收标准是：图谱可维护、可初始化、AI Coach 生成计划和聊天能引用图谱依据？

#### Gate B：设计闸门

- [ ] `schema.md` 中 `knowledge_node` / `knowledge_edge` DDL 是否已冻结？
- [ ] `api-contract.md` 中节点/关系 CRUD、初始化、summary、goal graph、next path 接口是否已冻结？
- [ ] 是否确认节点类型：`skill` / `concept` / `project` / `goal` / `weakness` / `resource`？
- [ ] 是否确认关系类型：`depends_on` / `contains` / `supports_goal` / `used_in_project` / `has_weakness` / `recommended_resource` / `next_step` / `proves`？
- [ ] 是否确认前端入口复用 `学习工作台` 菜单分组，新增 `/admin/learning/knowledge-graph` 子页面？
- [ ] 是否确认 Agent 图谱工具均为只读工具？

#### Gate C：学习闸门

- [ ] 是否了解当前学习工作台菜单与页面组织方式？
- [ ] 是否了解 GORM 自关联表 / edge 表的基本建模方式？
- [ ] 是否了解 Python Agent tools 如何透传 token 调用 Go private API？
- [ ] 是否了解计划生成 prompt 当前如何拼接画像、目标和偏好？

#### Gate D：编码闸门

- [ ] 是否明确影响范围：`schema.md`、`api-contract.md`、backend model/repository/handler/router、`lib/api/private.ts`、`app/admin/layout.tsx`、`app/admin/learning/knowledge-graph`、`agent-service/app/tools/learning.py`、`agent-service/app/api/generate.py`、`agent-service/app/agents/learning_coach.py`？
- [ ] 是否明确本阶段验收方式：migration/seed 执行、curl 接口验证、浏览器工作台验证、AI 计划生成验证、`go build ./...`、`npm run build`、agent-service 导入/启动验证？
- [ ] 是否确认不新增图数据库，继续使用 MySQL 表结构表达图谱？

#### Gate E：验证闸门

- [ ] `knowledge_node` / `knowledge_edge` 表已建，migration 可执行。
- [ ] 节点 CRUD curl 全通。
- [ ] 关系 CRUD curl 全通。
- [ ] 初始化接口可从现有数据生成图谱节点和关系，且幂等执行不重复造脏数据。
- [ ] summary / goal graph / next path 接口返回结构正确。
- [ ] `/admin/learning/knowledge-graph` 页面可在学习工作台菜单进入，并可维护节点和关系。
- [ ] AI 使用预览能展示目标相关子图和推荐路径。
- [ ] AI Coach 计划生成会读取目标相关子图，并在计划中体现依据。
- [ ] AI Coach 聊天能基于图谱回答目标差距、薄弱点、项目证明和下一步学习建议。
- [ ] `go build ./...` 通过。
- [ ] `npm run build` 通过。
- [ ] agent-service 导入 / 启动验证通过。

#### Gate F：沉淀闸门

- [ ] `progress-log.md` 已更新。
- [ ] 新踩坑已写入 `pitfalls.md`（如有）。
- [ ] 下一阶段范围已明确。

### 节奏建议

| 天数 | 目标 | 产出 |
| --- | --- | --- |
| Day 1 | 冻结 schema 与 API 契约 | `knowledge_node` / `knowledge_edge` DDL + 私有接口契约 |
| Day 2 | 后端图谱 CRUD 与初始化 | migration + model/repo/handler/router + curl 基础验证 |
| Day 3 | 目标子图与路径推荐接口 | summary / goal graph / next path 可用 |
| Day 4 | 前端知识图谱管理页 | 节点/关系管理 + 初始化 + AI 使用预览 |
| Day 5 | Agent 只读工具接入 | 图谱工具 + 计划生成 prompt + 聊天依据 |
| Day 6 | 联调验收与沉淀 | build / curl / 浏览器 / agent-service 验收 |

### 降级策略

- 自关联查询复杂：先限制 goal graph 为一跳关系，二跳关系后补。
- 初始化规则复杂：先只从学习目标、公开技能、项目生成节点，计划/任务来源后补。
- 路径推荐复杂：先按 `next_step` 和 `has_weakness` 排序，不做复杂图算法。
- 前端页面耗时：先实现节点/关系表格和 AI 使用预览，初始化 UI 可简化为单按钮 + 结果摘要。

### 进入前置条件

- [ ] 阶段 11 Gate E/F 全部通过。
- [x] 设计文档已确认：`docs/superpowers/specs/2026-06-15-learning-knowledge-graph-design.md`。
- [ ] 用户确认进入阶段 12 REQUIREMENT。

---

## 阶段 10 历史对话列表与回放（FB-7.5）（已完成）

### 阶段目标

在 Learning Coach Agent MVP 基础上，补齐历史对话列表、回放与超长消息场景下的分页加载能力，让用户可以继续旧对话，而不是只能单次新聊。

### 本阶段做什么

- Python agent-service：为历史接口增加 `limit` / `before_id` 分页参数。
- Python agent-service：历史响应补充 `messages` / `hasMore` / `nextBeforeId`。
- 前端聊天页新增左侧历史对话列表、点击回放、删除会话、新建会话。
- 前端支持“加载更早消息”，并保持现有 Markdown / 流式体验不回退。

### 本阶段不做什么

- 不做 Tool 调用可视化。
- 不做多 Agent 会话编排。
- 不做额外缓存层或搜索能力。

### 闸门检查

#### Gate A：需求闸门

- [x] 是否确认本阶段只做历史对话列表、回放与超长消息分页？
- [x] 是否确认不扩展到新业务能力，只补会话体验？
- [x] 是否确认验收标准是：能回放历史、能分页加载更早消息、构建与服务验证通过？

#### Gate B：设计闸门

- [x] 是否明确历史接口分页参数与响应结构？
- [x] 是否明确前端历史列表 / 回放 / 删除的最小交互？
- [x] 是否明确继续沿用现有 MySQL 历史存储，不引入新缓存层？

#### Gate C：学习闸门

- [x] 是否了解聊天页当前 SSE 消费方式与消息列表状态？
- [x] 是否了解 Python 3.9 环境下类型注解兼容要求？

#### Gate D：编码闸门

- [x] 是否明确影响范围：`agent-service/app/api/chat.py`、`agent-service/app/models/schemas.py`、`app/admin/learning/chat/page.tsx`、`lib/api/private.ts`？
- [x] 是否明确验收方式：接口实测 + `npm run build` + agent-service 导入验证？

#### Gate E：验证闸门

- [x] `GET /api/chat/history/:conversation_id` 支持 `limit` / `before_id`。
- [x] 历史响应包含 `messages` / `hasMore` / `nextBeforeId`。
- [x] 新对话发送后可落库，并能通过历史接口回放验证。
- [x] 前端历史对话列表 / 回放 / 加载更早消息代码已接入并构建通过。
- [x] `npm run build` 通过。
- [x] agent-service 导入与启动验证通过。

#### Gate F：沉淀闸门

- [x] `progress-log.md` 已更新。
- [x] `pitfalls.md` 已补充 Python 版本兼容踩坑。
- [x] 阶段 10 用户浏览器验收已通过。

### 进入前置条件

- [x] 阶段 9 Gate E/F 已通过。
- [x] 现有 Learning Coach 对话链路可用。

---

## 阶段 9 Learning Coach Agent (FB-7)（已完成）

### 阶段目标

构建个性化学习教练 Agent 系统：基于 Python + LangGraph 实现智能对话，支持学习计划生成、面试复盘分析、进度跟踪和周复盘功能。

### 本阶段做什么

- 新增 Python Agent 微服务（`agent-service/`）：
  - FastAPI + LangGraph + DeepSeek 调用
  - 单 Agent + 多工具架构
  - 流式对话接口（SSE）
- 新增 `agent_conversation` 表 —— 对话会话。
- 新增 `agent_message` 表 —— 对话消息历史。
- 实现 Agent Tools：
  - 数据读取：`get_learning_profile` / `get_learning_goals` / `get_learning_plans` / `get_learning_progress`
  - 数据写入：`create_learning_plan` / `create_learning_task` / `update_learning_progress` / `update_learning_profile`
  - 分析工具：`analyze_interview_feedback` / `generate_weekly_review`
- Go 后端代理调用 Python `/generate/plan` 接口（替换现有 mock）。
- Go 后端新增对话管理接口：`GET /api/private/agent/conversations`、`DELETE /api/private/agent/conversations/:id`。
- 前端新增对话界面（流式接收）。
- Docker Compose 编排（frontend + backend + agent + mysql）。

### 本阶段不做什么

- 不做发送提醒功能（`send_reminder`）。
- 不做外部学习资源搜索。
- 不做多 Agent 协作（MVP 用单 Agent + 多工具）。
- 不做进度可视化图表。

### 闸门检查

#### Gate A：需求闸门

- [ ] 是否确认本阶段做 Python Agent 微服务 + 对话历史 + 替换 mock？
- [ ] 是否确认 Agent 架构为单 Agent + 多工具？
- [ ] 验收标准：对话可流式返回 + Tools 可调用 + Docker Compose 可启动？

#### Gate B：设计闸门

- [ ] `schema.md` 中 `agent_conversation` / `agent_message` DDL 是否已冻结？
- [ ] `api-contract.md` 中 Python 服务接口 + Go 代理接口是否已冻结？
- [ ] LangGraph 状态机设计是否确认（classify → plan_gen/interview/progress → confirm → execute → respond）？
- [ ] Docker Compose 服务编排是否确认（4 个服务）？
- [ ] System Prompt 是否已设计？

#### Gate C：学习闸门

- [ ] 是否了解 LangGraph 基本概念（State、Node、Edge、Checkpoint）？
- [ ] 是否了解 FastAPI + SSE 流式响应？
- [ ] 是否了解 DeepSeek API 调用（OpenAI 兼容）？
- [ ] 是否了解 Docker Compose 基本用法？

#### Gate D：编码闸门

- [ ] Python 3.11+ 环境已准备。
- [ ] Docker / Docker Compose 已安装。
- [ ] `DEEPSEEK_API_KEY` 环境变量配置方式已确认。
- [ ] 新增目录位置已确认（`agent-service/`）。

#### Gate E：验证闸门

- [ ] Python Agent 服务可独立启动。
- [ ] `POST /chat` 流式对话正常返回。
- [ ] `POST /generate/plan` 调用 DeepSeek 返回计划（替代 mock）。
- [ ] Tools 可正常调用（读取画像、创建计划等）。
- [ ] Go 后端代理调用 Python 服务正常。
- [ ] `agent_conversation` / `agent_message` 表可写入。
- [ ] Docker Compose 一键启动 4 个服务。
- [ ] 前端对话界面可流式接收。
- [ ] `npm run build` 通过。
- [ ] `go build ./...` 通过。

#### Gate F：沉淀闸门

- [ ] `progress-log.md` 已更新。
- [ ] 踩坑写入 `pitfalls.md`。
- [ ] 下一阶段范围已明确。

### 分阶段交付（Phase）

| Phase | 能力 | 预估工作量 |
| --- | --- | --- |
| Phase 1 | Python 服务搭建 + LangGraph 基础 + DeepSeek 调用 + 简单对话 | 2-3 天 |
| Phase 2 | 读取画像 + 目标 → 生成计划（替换现有 mock） | 2 天 |
| Phase 3 | 面试复盘分析 → 更新画像/生成改进计划 | 2-3 天 |
| Phase 4 | 进度跟踪 → 周复盘 → 调整计划建议 | 2-3 天 |
| Phase 5 | 对话历史持久化 + 历史回顾 UI | 2 天 |
| Phase 6 | Agent 长期记忆 + 个性化响应 | 3 天 |

### 降级策略

- LangGraph 学习成本高：先用简单 Chain，后续再迁移到 Graph。
- DeepSeek 调用不稳定：先返回 mock，LLM 后补。
- Docker Compose 配置复杂：先本地多进程启动。
- 流式对话复杂：先实现同步响应。

### 进入前置条件

- [x] FB-6 Gate E 全部通过。
- [ ] `schema.md` 中 `agent_conversation` / `agent_message` DDL 已冻结。
- [ ] `api-contract.md` 中相关接口已冻结。
- [ ] 设计文档已确认：`docs/superpowers/specs/2026-06-07-learning-coach-agent-design.md`。

---

## 阶段 8 学习计划功能 (FB-6)（已完成）

### 阶段目标

实现学习计划管理功能：目标可拆解为计划（learning_plan），计划可拆解为任务（learning_task），任务可记录进度（learning_progress）；并提供 AI 单次生成计划的能力。

### 本阶段做什么

- 新增 `learning_plan` 表（DDL + migration + 种子 SQL）—— 学习计划，可关联 learning_goal。
- 新增 `learning_task` 表（DDL + migration + 种子 SQL）—— 学习任务，关联 learning_plan。
- 新增 `learning_progress` 表（DDL + migration + 种子 SQL）—— 学习进度日志，关联 learning_task。
- 实现私有 CRUD 接口（owner only）：
  - Plans：`GET/POST/PUT/DELETE /api/private/learning/plans`
  - Tasks：`GET/POST /api/private/learning/plans/:planId/tasks`、`PUT/DELETE /api/private/learning/tasks/:id`
  - Progress：`GET/POST /api/private/learning/tasks/:taskId/progress`
- 实现 AI 生成计划接口：`POST /api/private/learning/plans/generate`（单次 LLM 调用，返回计划草稿）。
- 前端新增学习计划管理页面（`/admin/learning/plans`）。
- 前端新增任务管理页面（`/admin/learning/plans/:id`）。

### 本阶段不做什么

- 不做 Agent 对话历史表（`agent_conversation` / `agent_message` / `agent_memory`）。
- 不做多轮对话、上下文记忆。
- 不做 `weekly_review` 周复盘表。
- 不做进度可视化图表。
- 不做任务提醒/通知功能。

### 闸门检查

#### Gate A：需求闸门

- [x] 是否确认本阶段只做 `learning_plan` + `learning_task` + `learning_progress` 三张表？
- [x] 是否确认 AI 生成计划为单次 LLM 调用，不做 Agent 对话？
- [x] 验收标准：curl 全通 + 前端计划/任务管理页面可用 + AI 生成计划返回草稿 + `npm run build` 通过？

#### Gate B：设计闸门

- [x] `schema.md` 中 `learning_plan` / `learning_task` / `learning_progress` DDL 是否已冻结？
- [x] `api-contract.md` 中 12 个私有接口是否已冻结？
- [x] AI 生成计划的 LLM 调用方式是否确认（后端 Go 调用 DeepSeek API）？
- [x] 前端 API client 新增函数位置是否确认（`lib/api/private.ts`）？
- [x] 前端页面路由是否确认（`/admin/learning/plans`、`/admin/learning/plans/:id`）？

#### Gate C：学习闸门

- [x] 是否了解 GORM 关联查询（plan → tasks）的基本用法？
- [x] 是否了解 Go 调用 DeepSeek API 的基本用法？
- [x] 是否了解 Next.js 动态路由 `[id]` 的用法？

#### Gate D：编码闸门

- [x] `go build ./...` 当前通过。
- [x] `npm run build` 当前通过。
- [x] 新增文件位置已确认（model/repo/handler）。
- [x] LLM API Key 配置方式已确认（env 变量）。

#### Gate E：验证闸门

- [x] `learning_plan` 表已建，种子数据可灌入。
- [x] `learning_task` 表已建，种子数据可灌入。
- [x] `learning_progress` 表已建。
- [x] 私有 API：Plans CRUD 4 个接口 curl 全通。
- [x] 私有 API：Tasks CRUD 4 个接口 curl 全通。
- [x] 私有 API：Progress GET/POST 2 个接口 curl 全通。
- [x] 私有 API：`POST /api/private/learning/plans/generate` 返回计划草稿（mock）。
- [x] 前端 `/admin/learning/plans` 页面可增删改查计划。
- [x] 前端 `/admin/learning/plans/:id` 页面可管理任务。
- [x] `npm run build` 通过。
- [x] `go build ./...` 通过。

#### Gate F：沉淀闸门

- [x] `progress-log.md` 已更新。
- [x] 踩坑写入 `pitfalls.md`（subagent 漏路由注册、MySQL 中文编码）。
- [x] 下一阶段范围已明确。

### 节奏建议

| 天数 | 目标 | 产出 |
| --- | --- | --- |
| Day 1 | 确认 Gate A/B，冻结契约，写 migration + 种子 SQL | 3 张表可用 |
| Day 2 | 实现 model + repository + Plans CRUD handler | 计划接口 curl 全通 |
| Day 3 | 实现 Tasks CRUD + Progress handler | 任务和进度接口 curl 全通 |
| Day 4 | 实现 AI 生成计划接口 | generate 接口返回草稿 |
| Day 5 | 前端 /admin/learning/plans 页面 | 计划管理 UI |
| Day 6 | 前端 /admin/learning/plans/:id 任务页面 | 任务管理 UI |
| Day 7 | build 验收 + Gate F | 阶段完成 |

### 降级策略

- GORM 关联查询复杂：先不做级联，手动两次查询。
- AI 生成计划 LLM 不可用：先返回 mock 数据，LLM 后补。
- 前端页面耗时：先只实现列表 + 新增，编辑/删除后补。

### 进入前置条件

- [x] FB-5 Gate E/F 全部通过。
- [x] `schema.md` 中 3 张表 DDL 已冻结。
- [x] `api-contract.md` 中私有接口已冻结。

---

## 阶段 7 学习工作台最小集 (FB-5)（已完成）

### 阶段目标

实现学习工作台的最小闭环：学习画像（单条 upsert）+ 学习目标（多条 CRUD），前端私有页面展示和管理。

### 本阶段做什么

- 新增 `learning_profile` 表（DDL + migration + 种子 SQL）—— 学习画像，单条 upsert。
- 新增 `learning_goal` 表（DDL + migration + 种子 SQL）—— 学习目标，多条 CRUD。
- 实现私有读写接口（owner only）：
  - `GET /api/private/learning/profile` —— 获取学习画像。
  - `PUT /api/private/learning/profile` —— upsert 学习画像。
  - `GET /api/private/learning/goals` —— 获取学习目标列表。
  - `POST /api/private/learning/goals` —— 新增学习目标。
  - `PUT /api/private/learning/goals/:id` —— 更新学习目标。
  - `DELETE /api/private/learning/goals/:id` —— 删除学习目标。
- 前端新增 `/dashboard` 私有学习工作台首页（显示画像和目标列表）。
- 前端新增 `/profile` 学习画像管理页面。
- 前端新增 `/goals` 学习目标管理页面。

### 本阶段不做什么

- 不做 `learning_plan` / `learning_task` / `learning_progress` / `weekly_review` 表。
- 不做 AI 生成计划功能。
- 不做 `agent_conversation` / `agent_message` / `agent_memory` 表。
- 不做公开读接口（仅 owner 可见）。
- 不做复杂的目标进度追踪。

### 闸门检查

#### Gate A：需求闸门

- [x] 是否确认本阶段只做 `learning_profile` + `learning_goal` 两张表的后端 + 前端私有页面？
- [x] 是否确认不做 AI 生成计划、不做其他学习相关表？
- [x] 验收标准：curl 全通 + 前端三个私有页面可用 + `npm run build` 通过？

#### Gate B：设计闸门

- [x] `schema.md` 中 `learning_profile` DDL 是否已冻结？
- [x] `schema.md` 中 `learning_goal` DDL 是否已冻结？
- [x] `api-contract.md` 中 6 个私有接口是否已冻结？
- [x] 前端 API client 新增函数位置是否确认（`lib/api/private.ts`）？
- [x] 前端页面路由是否确认（`/dashboard`、`/profile`、`/goals`）？

#### Gate C：学习闸门

- [ ] 是否了解 upsert 模式在 GORM 中的实现方式（`ON DUPLICATE KEY UPDATE` 或 `Clauses`）？
- [ ] 是否了解 Next.js App Router 私有页面的鉴权模式（middleware + session）？

#### Gate D：编码闸门

- [ ] `go build ./...` 当前通过。
- [ ] `npm run build` 当前通过。
- [ ] 新增文件位置已确认（model/repo/handler）。
- [ ] 私有页面鉴权方案已确认。

#### Gate E：验证闸门

- [x] `learning_profile` 表已建，种子数据可灌入。
- [x] `learning_goal` 表已建，种子数据可灌入。
- [x] 私有 API：`GET/PUT /api/private/learning/profile` curl 全通（带 token）。
- [x] 私有 API：`GET/POST/PUT/DELETE /api/private/learning/goals` curl 全通（带 token）。
- [x] 前端 `/admin/learning` 页面显示画像和目标列表。
- [x] 前端 `/admin/learning/profile` 页面可编辑学习画像。
- [x] 前端 `/admin/learning/goals` 页面可增删改查学习目标。
- [x] `npm run build` 通过。
- [x] `go build ./...` 通过。

#### Gate F：沉淀闸门

- [x] `progress-log.md` 已更新。
- [x] 踩坑写入 `pitfalls.md`（本阶段无新踩坑）。
- [x] 下一阶段范围已明确。

### 节奏建议

| 天数 | 目标 | 产出 |
| --- | --- | --- |
| Day 1 | 确认 Gate A/B，冻结契约，写 migration + 种子 SQL | learning_profile + learning_goal 表可用 |
| Day 2 | 实现 model + repository + 6 个 handler + 路由注册 | 后端 curl 全通 |
| Day 3 | 前端 /dashboard 首页 + /profile 画像页 | 画像可查看和编辑 |
| Day 4 | 前端 /goals 目标管理页面 | 目标可增删改查 |
| Day 5 | build 验收 + Gate F | 阶段完成 |

### 降级策略

- GORM upsert 复杂：改用先查后插/更新的两步操作。
- 私有页面鉴权卡住：先硬编码 owner 检查，后续再抽象中间件。
- 前端页面耗时：先只实现 /dashboard 展示，/profile 和 /goals 编辑后补。

### 进入前置条件

- [x] FB-4 Gate E/F 全部通过。
- [x] `schema.md` 中 `learning_profile` + `learning_goal` DDL 已冻结。
- [x] `api-contract.md` 中私有接口已冻结。
