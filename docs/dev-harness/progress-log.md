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

