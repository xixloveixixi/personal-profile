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

### 今日完成
- 重写 `.agents/rules/` 11 个规则文件 + README，对齐 Next.js 14 + Tailwind + Antd + Zustand + Notion + 计划中的 Go/Gin。
- 决定 Go 后端采用 monorepo：在当前仓库新增顶层 `backend/`，与 `app/`、`components/` 平级。
- 约定 Stage 1 最小接口：`GET /api/health`、`POST /api/auth/login`，统一响应 `{code,message,data,traceId}`，错误码沿用 SDD 9.1。

### 当前阻塞
- 本机未安装 Go（`go: command not found`），Day 2 起的初始化需先安装 Go 1.22+。

### 关键决策
- Gate A 通过：本阶段只做 Go 后端底座，不碰业务 CRUD、LangChain、博客迁移。
- Gate B 通过：最小接口、统一响应、JWT 登录态、错误码均已与 SDD 对齐。
- Gate D 通过：后端目录定为 `backend/`，与前端解耦，不影响现有 Next.js 公开页。
- 客户端全局状态规范统一使用 Zustand（`lib/stores/<feature>.ts`），但 `zustand` 依赖待 Stage 2 起前端工作台开发时再安装。

### 明日第一步
- 安装 Go 1.22+ 并验证 `go version`。
- 在 `backend/` 内执行 `go mod init` + 引入 `gin`，跑通 `GET /api/health` 返回统一响应结构（对齐 Gate E 第一项）。

