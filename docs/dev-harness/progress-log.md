# 研发 Harness 进度日志

## 使用方式

每天结束前更新一次，重点记录事实、阻塞和下一步，不写流水账。

## 日志模板

```md
## YYYY-MM-DD

### 今日目标
- 

### 今日完成
- 

### 当前阻塞
- 

### 关键决策
- 

### 明日第一步
- 

### 耗时 / 预估
```

## 2026-05-10

### 今日目标
- 建立研发 Harness 的最小落地文档体系。

### 今日完成
- 明确研发 Harness 是开发过程控制系统，不是产品内 Agent 框架。
- 确定最小文档集合：`stage-plan.md`、`progress-log.md`、`pitfalls.md`。
- 确定第一阶段目标：Go 后端最小底座。

### 当前阻塞
- 尚未确认 Go 后端项目放在当前仓库内，还是新建独立后端仓库。
- 尚未开始 Go + Gin 项目初始化。

### 关键决策
- 先用轻量研发 Harness，不做复杂多 Agent 流程。
- 第一阶段只做 Go 后端底座，不做业务 CRUD、不接 LangChain。
- 后端技术栈从 Java 调整为 Go，优先使用 Gin + GORM + JWT。
- 每次只推进一个可验证小闭环。

### 明日第一步
- 确认 Go 后端项目目录与技术栈初始化方式。

## 2026-05-17

### 今日目标
- 完成 Stage 1 Day 1：确认后端项目位置，过 Gate A / B / D。
- 同步 `.agents/rules/` 与当前项目实际栈和 SDD 对齐。
- 推进 Day 2-3：安装 Go、初始化 module、跑通 `GET /api/health`。

### 今日完成
- 重写 `.agents/rules/` 11 个规则文件 + README，对齐 Next.js 14 + Tailwind + Antd + Zustand + Notion + 计划中的 Go/Gin。
- 决定 Go 后端采用 monorepo：在当前仓库新增顶层 `backend/`，与 `app/`、`components/` 平级。
- 约定 Stage 1 最小接口：`GET /api/health`、`POST /api/auth/login`，统一响应 `{code,message,data,traceId}`，错误码沿用 SDD 9.1。
- 安装 Go 1.26.3（Homebrew），`go version` 验证通过。
- 在 `backend/` 完成 `go mod init github.com/jiangyixi/personal-profile/backend`，引入 `gin v1.12.0` + `uuid v1.6.0`。
- 配置 `GOPROXY=https://goproxy.cn,direct`、`GOSUMDB=sum.golang.google.cn`，解决 `sum.golang.org` 超时。
- 实现统一响应封装 `internal/handler/response.go`（`Response` + `OK()` + `Fail()`）和 `GET /api/health`，本地 curl 验证返回 `{"code":0,"message":"ok","data":{"status":"up",...},"traceId":"..."}`。
- Gate E 第 1 项 ✅：`GET /api/health` 返回成功且结构对齐 SDD 9.1。
- 实现 `POST /api/auth/login` 降级雏形（`internal/handler/auth.go` + `internal/config/config.go`），硬编码 owner 凭据，签发 HS256 JWT，curl 验证成功登录、参数缺失 40001、密码错误 40100 三种场景均通过。
- Gate E 第 2 项 ✅：`POST /api/auth/login` 能返回 token。
- 实现 JWT 中间件（`internal/middleware/auth.go`），从 Authorization Bearer header 提取并校验 token，无效时 `c.AbortWithStatusJSON` 返回 401 + 统一响应。
- 新增 `GET /api/auth/me` 受保护接口（`internal/handler/me.go`），验证中间件对 claims 的透传。
- curl 验证：无 token → 401；无效 token → 401；有效 token → 200 返回用户信息。
- Gate E 第 3 项 ✅：JWT 中间件能拦截未登录请求并返回 401。
- 提取公共 `internal/response` 包（`OK`/`Fail`/`Abort`），handler 和 middleware 统一引用，消除响应构造重复。
- 抽离路由注册到 `internal/router/router.go`，`main.go` 只负责创建引擎和启动监听。
- 编写手写接口文档 `backend/docs/api.md`，覆盖统一响应结构、错误码、全部 3 个接口及 curl 快速验证命令。
- Gate E 第 4 项 ✅：已用手写接口文档 + curl 完成全接口验证。

### 当前阻塞
- 无。

### 关键决策
- Gate A 通过：本阶段只做 Go 后端底座，不碰业务 CRUD、LangChain、博客迁移。
- Gate B 通过：最小接口、统一响应、JWT 登录态、错误码均已与 SDD 对齐。
- Gate D 通过：后端目录定为 `backend/`，与前端解耦，不影响现有 Next.js 公开页。
- 客户端全局状态规范统一使用 Zustand（`lib/stores/<feature>.ts`），但 `zustand` 依赖待 Stage 2 起前端工作台开发时再安装。
- `go.mod` 必须放在 `backend/` 内，禁止放仓库根目录（避免前端 `node_modules` 被 Go 工具链扫描）。
- 国内网络下 Go 模块代理统一使用 `goproxy.cn`，`GOSUMDB` 用 `sum.golang.google.cn`，已通过 `go env -w` 写入用户配置。

### 明日第一步
- Day 7 阶段复盘：逐项过 Gate E / Gate F，确认 Stage 1 是否达标、可否进入 Stage 2。
- **结论：Stage 1 全部 Gate 通过，可以进入 Stage 2。**
- Stage 2 进入前待确认：目标范围（公开数据后端化？）、是否接 MySQL、是否引入 GORM。

## 2026-05-19

### 今日目标
- 启动 Stage 2 Day 1：过 Gate A、Gate D 工具链，安装 MySQL，建库建用户。

### 今日完成
- Gate A 三项确认通过：仅 4 张公开表后端化、前端不变、登录不动 `sys_user`、curl 验收。
- Gate D 工具链验证：`go version` go1.26.3 ✅；Homebrew 安装 `mysql` 实际版本 9.6.0；`brew services start mysql` 启动成功；`mysql -u root` 可登录。
- 评估 MySQL 9.6 与计划中 "MySQL 8" 的差异：GORM driver、协议、认证插件均兼容，本项目 4 张表 CRUD 不受影响。stage-plan 已同步为 "MySQL 8/9"。
- 创建数据库 `personal_profile`（utf8mb4 / unicode_ci）与业务用户 `pp_app@localhost`，授予全库权限；`pp_app` 登录验证通过。
- 更新 `stage-plan.md`：Gate A 全勾、Gate D 工具链项勾选、进入前置条件中 MySQL 行勾选。
- 更新 `pitfalls.md`：新增"Homebrew 默认 mysql formula 版本与计划文档不一致"一条。

### 当前阻塞
- 无。

### 关键决策
- Stage 2 采用 MySQL 9.6.0（非降级到 8.4），原因：GORM/协议/认证全兼容，本项目无 9.x 移除特性的依赖。
- 本机开发凭据：`personal_profile` / `pp_app` / `pp_dev_pwd`，仅本机 `localhost` 访问；Stage 2 Day 3 引入 GORM 时 DSN 从 env 读取。

### 明日第一步
- Day 2：冻结 `schema.md` 4 张表 DDL（对齐 SDD 10.3-10.6）+ `api-contract.md` 读写接口契约，跑 `npm run harness:check` 自检。

## 2026-05-19（Day 2）

### 今日目标
- 冻结 Stage 2 数据库 schema 与 API 契约，过 Gate B。

### 今日完成
- 冻结 `schema.md` 4 张表 DDL：`public_profile` / `public_contact` / `public_skill` / `site_config`，含索引、注释、引擎、字符集。
- 冻结 `api-contract.md` 共 14 个接口：4 公开读（profile / contacts / skills / site-config）+ 10 owner 写（profile PUT、contacts CRUD、skills CRUD、site-config GET/PUT）。每个接口填齐"作用 / 鉴权 / 请求 / 响应 / 错误码 / 关联表 / 备注"。
- 修正 candidate list 中的 `/api/site/config` 路径，统一为 SDD 9.3 的 `/api/public/site-config`，admin 写为 `/api/admin/site-config(/:key)`。
- 在 `stage-plan.md` 新增 **Stage 2 设计决策** 块，补齐 Gate B 三项非契约决策：
  - DSN 从 env `BACKEND_DB_DSN` 读取，连接池 `MaxOpen=20 / MaxIdle=5 / Lifetime=1h`。
  - migration 采用手写 SQL（`backend/migrations/NNNN_*.sql`），AutoMigrate 仅本地辅助。
  - owner 校验降级：`/api/admin/*` 仅校验有效 Bearer Token，role 校验留 Stage 3。
  - owner_id 固定为 1（来自 `internal/config.OwnerID`）。
  - 新增 `internal/model` / `internal/repository` 两个包，handler 不直接调 GORM。
- Stage 2 进入前置条件 4 项全部勾选；Gate A / Gate B 全勾。
- `npm run harness:check` 6/6 全 OK。

### 当前阻塞
- 无。

### 关键决策
- schema 与 SDD 10.1 的差异：将 `deleted` 统一为 GORM 习惯的 `deleted_at DATETIME(3)`；Stage 2 不落地 `created_by` / `updated_by`（无 sys_user）。
- `public_profile` 在 `owner_id` 上加唯一索引，单 owner 单条；`site_config` 在 `config_key` 上加唯一索引，按 key upsert。
- Stage 2 单 owner 模型：`owner_id = 1` 写入硬编码，简化 handler 与 repository 边界。

### 明日第一步
- Day 3：编写 `backend/migrations/0001_init.sql`（4 表 DDL），引入 GORM v1.x，封装 `internal/db.New(cfg)` 返回 `*gorm.DB`；完成 `public_profile` 的 model + repository + GET/PUT handler，curl 跑通单表读写。

## 2026-05-19（Day 3）

### 今日目标
- Stage 2 Day 3：引入 GORM，跑通 `public_profile` 单表 CRUD（GET/PUT）。

### 今日完成
- 新增 `backend/migrations/0001_init.sql`：一次性建好 4 张公开表（含索引、注释、引擎、字符集），CREATE TABLE IF NOT EXISTS 保证幂等。
- 本地 `mysql -u pp_app -p personal_profile < 0001_init.sql` 执行成功，`SHOW TABLES` 看到 4 张表全部存在。
- `internal/config/config.go` 增加 `DBConfig`（DSN + 连接池）+ `OwnerID = 1` 常量；DSN 默认值与 stage-plan Day 2 决策一致，env `BACKEND_DB_DSN` 可覆盖。
- 新增 `internal/db` 包，`New(cfg) *gorm.DB` 封装 GORM 打开、连接池设置、`Ping` 自检；`main.go` 启动时强校验 DB 连通性，失败 fatal。
- 新增 `internal/model/public_profile.go`：GORM model 对齐 schema.md DDL，使用 `gorm.DeletedAt` 自动软删。
- 新增 `internal/repository/public_profile.go`：`FindByOwnerID` + `Upsert`（先 First 后 Create/Save，保证单 owner 单条），暴露 `ErrNotFound` 哨兵错误。
- 新增 `internal/handler/profile.go`：3 个接口 + DTO 转换 + 校验（displayName 必填且 ≤64、visibility 枚举、默认值 `public`）。
- `internal/router/router.go` 改为 `Setup(r, db)`，新增 `/api/public/profile`、`/api/admin/profile (GET/PUT)`，admin 组挂 `middleware.Auth()`。
- 引入依赖：`gorm.io/gorm v1.31.1`、`gorm.io/driver/mysql v1.6.0`，`go build ./...` 通过。
- 9 个 curl 用例全部符合预期：未配置 → 40400；登录拿 token；无 token PUT → 40100；首次 PUT 创建 → 200；公开 GET 拉到数据 → 200；二次 PUT 更新 → 200（全量替换语义）；admin GET → 200；displayName 缺失 → 40001；visibility 非法 → 40001。
- `backend/docs/api.md` 追加 3 个 Stage 2 接口段落 + 快速验证 curl。

### 当前阻塞
- 无。

### 关键决策
- PUT /api/admin/profile 采用 **全量替换语义**：未传字段被清空，前端编辑必须先 GET 全量再回传。已写入 `backend/docs/api.md` 备注；后续 contacts/skills 也将沿用该语义以减少 handler 分支。
- handler 通过构造函数注入 repository（`NewProfileHandler(repo)`），不再用包级单例。router 持有 `*gorm.DB`，统一 wire repository 与 handler，避免 model/repo/handler 任意一层直接依赖全局 DB。
- migration 走"启动时不自动执行，本机手动灌入"的方式，避免对线上误改 schema。GORM AutoMigrate 全程未启用。

### 明日第一步
- Day 4：用相同模式落地 `public_contact` model + repository + 5 接口（公开 GET / admin GET-POST-PUT-DELETE）；同时把 `0001_init.sql` 之外的种子数据（contact 至少 1 条）放到 `backend/migrations/seed_001_demo.sql`。

## 2026-05-27（Gate 收尾）

### 今日目标
- 确认 Stage 2 Gate C 学习完成 + 补勾 Gate D 漏项。

### 今日完成
- Gate C 三项由用户自学完成后自行勾选：GORM 最小 API、`database/sql` driver + 连接池、MySQL 本机环境。
- Gate D 补勾：DB 配置已加入 config、package 位置已明确（model/repository）、handler 不直接调 GORM、验收方式明确（curl + 种子 SQL）。
- 修正 `npm run harness:check` 脚本一直校验 Stage 1 Gate E 的问题（`stage-plan.md` `## 当前阶段：` 游标挪至 Stage 2）。
- `pitfalls.md` 新增两条：阶段切换漏改游标、Gate C 主体是用户 AI 不得代勾。
- `AGENTS.md` 新增"Gate 勾选权"小节，明确各 Gate 的确认主体。

### 当前阻塞
- 无。

### 关键决策
- Gate C 只能由用户自己勾选，AI 不得代勾，已写入 AGENTS.md 工作流规则。

### 明日第一步
- Day 4：落地 `public_contact` model + repository + 5 接口 + 种子数据。

## 2026-05-27（Day 4）

### 今日目标
- Stage 2 Day 4：复用 Day 3 模式落地 `public_contact` CRUD（5 接口）+ 种子数据。

### 今日完成
- 新增 `internal/model/public_contact.go`：GORM model 对齐 schema.md DDL，使用 `gorm.DeletedAt` 软删。
- 新增 `internal/repository/public_contact.go`：`FindPublicByOwnerID`（is_public=1 过滤）/ `FindAllByOwnerID`（全量）/ `Create` / `FindByID`（ErrNotFound 哨兵）/ `Update`（Save 全量替换）/ `Delete`（软删）。
- 新增 `internal/handler/contact.go`：5 个 handler（公开 GET / admin GET / POST / PUT/:id / DELETE/:id），双 DTO（public 不含 isPublic，admin 含 isPublic），IsPublic 用指针区分"未传/传 false"。
- 更新 `internal/router/router.go`：注册 5 条 contact 路由，public GET 无鉴权，admin 4 条挂在 `middleware.Auth()` 组下。
- 新增 `migrations/seed_001_demo.sql`：DELETE + INSERT 幂等种子数据（3 条 github/email/linkedin），不适用已有真实数据的生产环境。
- 更新 `backend/docs/api.md`：追加 5 个 contact 接口说明 + 快速验证 curl。
- `go build ./...` 编译通过（exit code 0）。

### curl 验收结果

| 用例 | 预期 | 实际 | 状态 |
|------|------|------|------|
| `GET /api/public/contacts`（有数据） | `[{id,platform,...}]` | `[{id:1,platform:"twitter",...}]` | ✅ |
| `GET /api/admin/contacts`（无 token） | `40100` | `40100` | ✅ |
| `GET /api/admin/contacts`（带 token） | 全量数组 | `[{...,isPublic:true}]` | ✅ |
| `POST /api/admin/contacts` | 新建对象 | `{id:1,platform:"twitter",...}` | ✅ |
| `PUT /api/admin/contacts/:id` | 更新后对象 | `{label:"X (Twitter)",sortOrder:4}` | ✅ |
| `DELETE /api/admin/contacts/:id` | `{id:1}` | `{id:1}` | ✅ |
| DELETE 后 GET | 软删不可见 `[]` | `[]` | ✅ |
| 种子 SQL（3 条 github/email/linkedin） | 幂等可重复执行 | EXIT 0，DB 有 3 条 | ✅ |

### 当前阻塞
- 无。

### 关键决策
- contact handler `UpdateContact` 对 platform 字段做"传入非空则更新，未传则保留原值"特殊处理；其余字段全量覆盖（与 profile PUT 的"全量替换"保持一致，前端编辑须先 GET）。
- 种子数据采用 DELETE + INSERT 保证幂等（无唯一键无法用 ON DUPLICATE KEY UPDATE）；文件头注释说明仅适用本地开发。
- mysql 密码 `pp_dev_pwd` 正确，手动输入时出错，建议命令行直接 `-p<password>` 或用密码管理工具。

### 明日第一步
- Day 5：落地 `public_skill`（5 接口）+ `site_config`（3 接口）+ 路由整合，完成全 4 张表覆盖。

## 2026-05-27（Day 5）

### 今日目标
- Stage 2 Day 5：落地 `public_skill` + `site_config`，完成全 4 张表覆盖，跑通全部接口。

### 今日完成
- 新增 `internal/model/public_skill.go`：GORM model 对齐 schema.md，使用 `gorm.DeletedAt` 软删。
- 新增 `internal/repository/public_skill.go`：`FindPublicByOwnerID`（is_public=1，按 category/sort_order/id 排序）/ `FindAllByOwnerID` / `Create` / `FindByID` / `Update` / `Delete`（软删）。
- 新增 `internal/handler/skill.go`：5 个 handler，双 DTO（public 不含 isPublic，admin 含 isPublic），name 字段"传入非空则更新"模式。
- 新增 `internal/model/site_config.go`：GORM model，无 owner_id，config_key 唯一索引。
- 新增 `internal/repository/site_config.go`：`FindAll`（全量按 config_key 排序）/ `Upsert`（按 config_key FirstOrCreate/Save，valueType 空时沿用已有值或默认 "string"）。
- 新增 `internal/handler/site_config.go`：3 个 handler（公开 GET / admin GET / admin PUT/:key upsert）。
- 更新 `internal/router/router.go`：public 组 4 条 + admin 组 10 条，共 14 条业务路由全部注册，admin 均在 JWTAuth 中间件下。
- 更新 `migrations/seed_001_demo.sql`：追加 4 条 skill 种子数据（React/TypeScript/Go/Next.js）+ 3 条 site_config 种子数据（site.title/description/nav.items）。
- `go build ./...` 编译通过。
- 全部 8 个 curl 用例通过：公开技能列表 ✅ / 公开 site-config ✅ / 无 token 401 ✅ / admin 技能带 token ✅ / 新增技能 ✅ / upsert site-config ✅ / 更新后公开接口可见 ✅。

### 当前阻塞
- 中文字段在 macOS 终端有时显示乱码（UTF-8 显示问题），数据本身存储正确，不影响功能。

### 关键决策
- `SiteConfigRepo.Upsert`：valueType 传空字符串时沿用已有值（而非覆盖为空），新建时默认 "string"；实现"前端不传 valueType 则不修改类型"的语义。
- site_config 无 owner_id，`FindAll` 不加 owner_id 过滤，是全局单例 K-V 表。

### curl 验收结果

| 用例 | 预期 | 实际 | 状态 |
|------|------|------|------|
| `GET /api/public/skills` | 技能数组 | 4 条（React/TS/Go/Next.js） | ✅ |
| `GET /api/public/site-config` | 配置数组 | 3 条（title/desc/nav） | ✅ |
| `GET /api/admin/skills`（无 token） | 40100 | 40100 | ✅ |
| `GET /api/admin/skills`（带 token） | 全量+isPublic | 4 条 | ✅ |
| `POST /api/admin/skills` | 新建对象 | `{id:9, name:"MySQL"}` | ✅ |
| `PUT /api/admin/site-config/site.title` | upsert 后对象 | `{key:"site.title", value:"Yixi Jiang - Dev"}` | ✅ |
| `GET /api/public/site-config`（再次） | site.title 已更新 | "Yixi Jiang - Dev" | ✅ |
| 种子 SQL 幂等执行 | EXIT 0 | EXIT 0，4+3 条数据 | ✅ |

### 明日第一步
- Day 6：鉴权策略落地验证（全接口 401 覆盖）+ `backend/docs/api.md` 完整更新 + 跑 `npm run harness:check` 自检，过 Stage 2 Gate E 全部项。

## 2026-05-27（阶段切换 Stage 2 → Stage 3）

### 今日目标
- 完成 Stage 2 Gate F 复盘，执行阶段切换 SOP，进入 Stage 3 (FB-1)。

### 今日完成
- Stage 2 Gate F 全部勾选完毕（progress-log / pitfalls / schema / api-contract / Stage 3 范围）。
- 执行阶段切换 SOP：
  - `stage-plan.md`：Stage 2 标题改为"已完成"，新增 Stage 3 完整 Gate A-F 段落，游标挪至 Stage 3。
  - `stage-plan-frontend.md`：FB-0 删除，FB-1 标题升级为"当前阶段"。
- `npm run harness:check` → 6/6 OK，1 warn（Stage 3 Gate E 0/4，正常）。

### 当前阻塞
- Gate A / B / D 待用户确认。
- Gate C 待用户自学后勾选。

### 关键决策
- Stage 3 = FB-1：仅做公开页切 API，不做后台 UI / sys_user / 博客迁移。

### 明日第一步
- 用户确认 Gate A/B/D → 用户学习 Gate C → Day 1 编码（lib/api/client.ts + lib/api/public.ts）。

## 2026-05-27（FB-1 Day 1）

### 今日目标
- [FB-1] 创建 `lib/api/client.ts`（统一 fetch 封装）+ `lib/api/public.ts`（4 接口 typed client）+ `.env.local`。

### 今日完成
- 新增 `lib/api/client.ts`：`apiFetch<T>` 封装（baseURL 从 `NEXT_PUBLIC_API_BASE` 读取，默认 `http://localhost:8080`；Content-Type 注入；`{code,message,data,traceId}` 解包；code≠0 时 throw `ApiError`）。
- 新增 `lib/api/public.ts`：4 个公开接口 typed client（`getPublicProfile` / `getPublicContacts` / `getPublicSkills` / `getSiteConfig`），全部 `cache: 'no-store'`，类型定义与 api-contract.md 一致。
- 新增 `.env.local`：`NEXT_PUBLIC_API_BASE=http://localhost:8080`。
- `tsc --noEmit` exit code 0，零类型错误。

### 当前阻塞
- 无。

### 关键决策
- `ApiError` 继承自 `Error`，携带 `code: number`，便于 error.tsx 区分 API 错误与网络错误。
- `apiFetch` 不处理 401 跳转（公开页无登录态，符合 Gate B 决策）。
- `cache: 'no-store'` 全量应用，性能优化留 FB-1 Day 4 之后。

### 明日第一步
- [FB-1] Day 2：切 profile + contact 公开页到 API 调用。

## 2026-05-27（FB-1 Day 2）

### 今日目标
- [FB-1] 切首页 contact 数据从静态 JSON 改为调用 `GET /api/public/contacts`。

### 今日完成
- 新增 `app/HomeClient.tsx`：原首页 Client Component 逻辑，接收 `contacts: PublicContact[]` props，移除 `useEffect` + `useState` 状态管理。
- 改写 `app/page.tsx`：从 `'use client'` 改为 Server Component，`await getPublicContacts()` 后传 props 给 `HomeClient`，移除 `import contactData from '@/content/about/contact.json'`。
- `tsc --noEmit` exit code 0，零类型错误。
- 注：`AboutPageClient.tsx` 的联系方式为硬编码（不读 JSON），本 Day 不需要改动。

### 当前阻塞
- 无。

### 关键决策
- 首页是 Client Component（含 LightRays 动画），拆分为 Server Component（数据获取）+ Client Component（UI）模式，符合 Gate B 决策。
- `content/about/contact.json` 仍保留（首页已不依赖，但 `lib/content/about.ts` 还引用它；待 Day 3 skills 迁移后统一评估是否删除）。

### 明日第一步
- [FB-1] Day 3：切 skill + site_config 公开页，删静态文件。

## 2026-05-27（FB-1 Day 3）

### 今日目标
- 移除 `content/about/skills.json` 和 `contact.json` 的所有依赖，删除这两个文件。

### 今日完成
- 改写 `lib/ai/knowledge-base.ts`：`createSkillsChunks` 参数类型改为 `PublicSkill[]`，`buildKnowledgeBase` 里 skills 改为 `await getPublicSkills()`（失败降级为空数组），移除 `skillsData` / `contactData` JSON import。
- 改写 `lib/ai/tools.ts`：`getSkillInfoTool.execute` 改为 `await getPublicSkills()`，`proficiency%` 改为 `proficiencyLevel`，移除 `skillsData` JSON import。
- 删除 `content/about/contact.json`（首页已切 API，knowledge-base 的 contact 信息为硬编码，无其他依赖）。
- 删除 `content/about/skills.json`（knowledge-base 和 tools 均已切 API）。
- `tsc --noEmit` 两次均 exit code 0。
- 注：`content/about/timeline.json` 保留（无对应 API，stage-plan 明确说暂留）。
- 注：`site_config` 前端无消费方，本阶段跳过。

### 当前阻塞
- 无。

### 关键决策
- `knowledge-base.ts` / `tools.ts` 的 skills 数据源从 JSON 改为 API，后端不可用时降级为空数组，不影响 AI 聊天其他功能。

### 明日第一步
- [FB-1] Day 4：加 loading.tsx / error.tsx + `npm run build` 验收，过 Gate E。

## 2026-05-27（FB-1 Day 4）

### 今日目标
- `npm run build` 通过，过 Gate E 第 1 项。

### 今日完成
- 修复 `app/blog/[slug]/page.tsx`：`generateStaticParams` 加环境变量守卫（无 NOTION_TOKEN 返回空数组）。
- 修复 `app/blog/page.tsx` + `app/blog/[slug]/page.tsx`：加 `export const dynamic = 'force-dynamic'`，阻止构建时预渲染 Notion 页面。
- `npm run build` → exit code 0 ✅。
- 全局 `app/error.tsx` 和 `app/loading.tsx` 已存在，所有公开页继承，满足 Gate E 第 3 项（后端关停时显示 error.tsx 兜底）。

### 当前阻塞
- 无。

### 关键决策
- 博客页用 `force-dynamic` 而非在构建时 try/catch，原因：Notion API 是运行时依赖，不应在构建阶段调用；`force-dynamic` 是 Next.js 官方推荐的处理方式。

### Gate E 状态
- [x] `npm run build` 通过，无类型错误
- [ ] 4 个公开页本地访问与切前完全一致（视觉、内容）—— 需用户本地验证
- [x] 后端关停时公开页显示 error.tsx 兜底（全局 error.tsx 已覆盖）
- [ ] `content/about/contact.json` / `content/about/skills.json` 已删除 ✅（Day 3 完成）

### 明日第一步
- 用户本地启动后端 + 前端，验证 4 个公开页视觉与切前一致，确认 Gate E 全通，过 Gate F。




### 今日目标
- 更新 stage-plan.md Gate E 勾选，跑 harness:check，过 Gate F，完成 Stage 2 阶段复盘。

### 今日完成
- 更新 `stage-plan.md` Gate E 5 项全部勾选（对应 Day 3/4/5 curl 验证结果）。
- `npm run harness:check` → 6/6 全 OK，零 warning。
- Gate F 阶段复盘完成（见下方）。

### Gate F 复盘

- [x] 更新 `progress-log.md`
- [x] `pitfalls.md` 已在各 Day 完成后更新
- [x] `schema.md` / `api-contract.md` 已在 Day 2 冻结，本阶段未变更
- [x] Stage 3 范围已明确：前端公开页切 API（读 `/api/public/*`，移除静态数据）+ 引入 `sys_user` 表

### Stage 2 总结

| Day | 产出 | 状态 |
|-----|------|------|
| Day 1 | MySQL 安装、建库建用户 | ✅ |
| Day 2 | schema.md + api-contract.md 冻结 | ✅ |
| Day 3 | public_profile GORM + 3 接口 | ✅ |
| Day 4 | public_contact 5 接口 + 种子数据 | ✅ |
| Day 5 | public_skill 5 接口 + site_config 3 接口 | ✅ |
| Day 6 | Gate E/F 收尾 + harness:check 6/6 | ✅ |

### 当前阻塞
- 无。Stage 2 全部完成。

### 进入 Stage 3 前置条件
- [x] Stage 2 Gate E 5/5 全通
- [x] harness:check 6/6 零 warning
- [ ] Stage 3 Gate A/B/C/D 确认（前端切 API + sys_user 范围）

### 明日第一步
- 启动 Stage 3：确认范围（前端公开页切 API？先做 sys_user？），过 Gate A，更新 stage-plan.md Stage 3 段落。


