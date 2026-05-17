# 研发 Harness 踩坑记录

## 使用原则

只记录未来会复用或需要避免的问题，不记录一次性琐事。

## 记录模板

```md
## 问题标题

### 场景

### 原因

### 解决方案

### 下次如何避免
```

## 范围控制：Harness 不等于产品内 Agent 框架

### 场景

在讨论 Harness 时，最开始容易把它理解成产品里的 Agent 运行框架，例如 `ContextLoader`、`ToolRegistry`、`OutputParser` 等。

### 原因

Harness 一词既可以指 Agent 运行外壳，也可以指研发流程控制系统。当前阶段真正需要的是开发过程中的研发 Harness。

### 解决方案

将当前 Harness 明确定义为“研发过程控制系统”，用于约束需求、学习、设计、编码、验证和沉淀。

### 下次如何避免

每次提到 Harness 时先确认语境：
- 产品内 Harness：服务于 Agent 运行。
- 研发 Harness：服务于开发过程控制。

当前项目优先落地研发 Harness。

## 学习范围发散风险

### 场景

项目同时涉及 Go、Gin、MySQL、权限、后台管理、LangChain、Next.js，容易陷入“先系统学完再开发”的状态。

### 原因

技术栈跨度大，且部分内容此前没有系统学习经验。

### 解决方案

采用项目驱动学习，每个阶段只学当前闭环所需的最小知识。

### 下次如何避免

编码前先回答：
- 当前小闭环是什么？
- 它缺哪 1-2 个最小知识点？
- 哪些知识先不学？

## 技术栈切换后的文档同步风险

### 场景

后端技术栈从 Java / Spring Boot 调整为 Go / Gin 后，如果只改实现计划，不同步 SDD 和研发 Harness 文档，后续 Agent 可能继续按 Java 路线推进。

### 原因

研发 Harness 依赖文档作为执行入口，技术栈信息分散在 SDD、阶段计划、进度日志、踩坑记录中。

### 解决方案

技术栈变更时必须同步更新：
- `tech_design/ai-learning-platform/SDD-AI学习规划与成长记录平台.md`
- `docs/dev-harness/stage-plan.md`
- `docs/dev-harness/progress-log.md`
- `docs/dev-harness/pitfalls.md`

### 下次如何避免

任何技术栈变更都先做一次全局搜索，确认旧技术栈关键词不再出现在当前执行文档中。

## 进入新技术栈阶段前未做工具链前置检查

### 场景

Stage 1 Day 1 决定后端走 Go，准备 Day 2 初始化 `go.mod` 时才发现本机 `go` 命令不存在，导致 Day 2 第一步必须先去安装 Go 才能继续。

### 原因

Harness 阶段计划只列了"做什么"，未把"工具链可用性"作为进入闸门的前置项。

### 解决方案

进入任何涉及新技术栈的阶段前，先在终端验证关键命令可用：
- Go 阶段：`go version`、`gofmt`。
- Node / 前端：`node -v`、`npm -v`。
- 数据库：`mysql --version` 或确认容器可启动。

### 下次如何避免

把"工具链验证"写进每个阶段的 Gate D（编码闸门）：编码前必须先在终端跑通对应命令，未通过则在 progress-log 中先记录工具链准备步骤，再进入 Day 2。

## monorepo 中 `go.mod` 误放在仓库根目录

### 场景

Stage 1 Day 2 初始化 Go 后端时，`go mod init` 在仓库根目录执行，导致 `go.mod` 出现在 `/personal-profile/go.mod`，而不是 `/personal-profile/backend/go.mod`。

### 原因

monorepo 下既有 Next.js（前端）又有 Go（后端），`go mod init` 默认在当前目录创建 `go.mod`，没有先 `cd backend/`。

### 解决方案

将 `go.mod` 移动到 `backend/` 内，确保 Go 工具链只扫描 `backend/`，不污染前端 `node_modules`、`scripts/*.ts` 等文件。

### 下次如何避免

涉及多技术栈的子目录（`backend/`、`worker/` 等）初始化时，**先 `cd <子目录>` 再执行 `go mod init` / `npm init` / `cargo init`**，并在 PR 自检里检查根目录是否多出语言级配置文件（`go.mod`、`Cargo.toml`、`pom.xml` 等）。

## 国内网络下 Go 模块下载超时

### 场景

Stage 1 Day 2 执行 `go get github.com/gin-gonic/gin` 时报 `Get "https://sum.golang.org/lookup/...": dial tcp ... i/o timeout`，依赖无法下载。

### 原因

Go 默认的 `GOPROXY=https://proxy.golang.org` 与 `GOSUMDB=sum.golang.org` 在国内网络下不可达。

### 解决方案

```bash
go env -w GOPROXY=https://goproxy.cn,direct
go env -w GOSUMDB=sum.golang.google.cn
```

设置后 `go get` 走七牛代理，校验走 `sum.golang.google.cn`，无需关闭 GOSUMDB。

### 下次如何避免

新机器或新阶段第一次 `go get` 之前，先用 `go env GOPROXY GOSUMDB` 检查代理配置；如果是国内网络且仍是默认值，先按上述命令切换，再开始拉依赖。

## middleware 与 handler 响应构造重复导致维护隐患

### 场景

Stage 1 Day 5 实现 JWT 中间件时，`middleware/auth.go` 的 `abortUnauthorized` 函数手动用 `gin.H{...}` 拼装统一响应结构，而 `handler/response.go` 已经有 `Fail()` 做同样的事。两处代码结构相同但互不引用。

### 原因

Go 不允许循环 import。middleware 包无法直接 import handler 包（handler 未来可能 import middleware 下的工具），所以中间件里"另起炉灶"手动拼了响应 JSON。

### 解决方案

提取公共 `internal/response` 包，暴露 `OK()`、`Fail()`、`Abort()` 三个函数：
- `OK` / `Fail`：写响应但不中断请求链（handler 用）。
- `Abort`：写响应并调用 `c.Abort()`（middleware 用）。

handler 包的 `response.go` 改为代理层，内部转发调用 `internal/response`。middleware 直接 import `internal/response`。

### 下次如何避免

涉及多包共用的工具函数（响应构造、错误码、traceID 生成等），第一次写时就放在独立的公共包中，不要先写在业务包里再事后提取。判断标准：如果这个函数未来可能被 handler 和 middleware 同时调用，直接放 `internal/response` 或 `internal/pkg`。
