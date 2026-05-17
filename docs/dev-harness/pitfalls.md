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
