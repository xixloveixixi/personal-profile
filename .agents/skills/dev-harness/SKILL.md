---
name: dev-harness
description: 研发 Harness 工作流引导 skill。当用户说"开始新阶段"、"推进 Day N"、"过 Gate"、"初始化 harness"、"新项目搭 harness"、"更新 progress-log"、"记录踩坑"、"harness check"，或者接到新功能/Bug 修复任务准备开始编码时，必须使用此 skill。它同时覆盖两个场景：(1) 在新项目里从零搭建 harness 文档体系；(2) 在已有 harness 的项目里按 Gate 流程推进开发。
---

# 研发 Harness 工作流

研发 Harness 是一套**开发过程控制系统**，不是产品内的 Agent 运行框架。它的核心价值是：把"做什么、学什么、怎么验收、踩了什么坑"显式化，让每次开发都是一个可验证的小闭环。

## 两种使用场景

### 场景 A：新项目初始化 harness

用户说"帮我搭 harness"或"新项目怎么用这套流程"时，执行以下步骤：

1. 在项目根目录创建 `docs/dev-harness/` 目录。
2. 创建以下文件（内容见 `references/gate-template.md`）：
   - `stage-plan.md` — 阶段计划与 Gate 检查清单
   - `progress-log.md` — 每日进度日志
   - `pitfalls.md` — 踩坑记录
3. 如果项目有后端业务接口，还需创建：
   - `api-contract.md` — 接口契约（编写 handler 前必须冻结）
   - `schema.md` — 数据库表结构（编写 model 前必须冻结）
4. 在项目根目录创建或更新 `AGENTS.md`，写入 harness 必读文件列表和工作流规则（参考本 skill 的"AGENTS.md 模板"章节）。
5. 可选：在 `package.json` 的 `scripts` 里加 `"harness:check": "node scripts/harness-check.js"`，用于自检 Gate 进度。

### 场景 B：在已有 harness 的项目里推进开发

每次开始工作前，先读取：
- `docs/dev-harness/stage-plan.md` — 确认当前阶段和 Gate 状态
- `docs/dev-harness/progress-log.md` — 了解上次停在哪里
- `docs/dev-harness/pitfalls.md` — 避免重复踩坑

涉及后端业务时，还需读取 `api-contract.md` 和 `schema.md`。

---

## Gate 流程

每个阶段有 6 道闸门，按顺序过，不允许跳过：

| Gate | 名称 | 核心问题 | 勾选权 |
|------|------|----------|--------|
| A | 需求闸门 | 本阶段做什么、不做什么？ | AI 起草，用户确认 |
| B | 设计闸门 | 接口/表结构/架构决策是否冻结？ | AI 起草，用户确认 |
| C | 学习闸门 | 用户是否学过本阶段所需的最小知识？ | **只能用户自己勾** |
| D | 编码闸门 | 工具链可用？目录结构确认？ | AI 起草，用户确认 |
| E | 验证闸门 | curl / 测试是否全通？ | 共同确认 |
| F | 沉淀闸门 | progress-log / pitfalls 是否更新？ | AI 起草，用户复核 |

**Gate C 特别说明**：AI 不得代勾 Gate C。每个 Day 编码前必须先问用户"Gate C 这几条你学过了吗？"用户未确认则停下。

根据当前阶段实际用到的技术，从 `references/learn-cards.md` 中找到对应卡片直接呈现给用户（不要让用户自己去找）：

| 技术 | 对应卡片 |
|------|----------|
| Go module / Gin | 卡片：Go module 与 Gin 最小结构 |
| GORM | 卡片：GORM 最小 API |
| MySQL 首次安装 | 卡片：MySQL 本机安装与基础操作 |
| database/sql 连接池 | 卡片：database/sql driver 与连接池 |
| JWT 鉴权 | 卡片：JWT 中间件基础 |
| Next.js App Router | 卡片：Next.js App Router 数据获取 |
| Zustand | 卡片：Zustand 状态管理基础 |

用户读完卡片、跑通最小示例后，自己勾选 Gate C。

---

## 每日工作节奏

1. 读 `stage-plan.md` 确认当前阶段和 Gate 状态。
2. 确认 Gate C（向用户提问，不代勾）。
3. **并行检查（Gate D）**：当前任务是否可以拆分给多个 subagent 并行推进？判断标准：任务之间没有文件级依赖。如果可以并行，先用 `git-worktree-flow` skill 为每个任务创建独立 worktree，再分配给 subagent；否则顺序推进。
4. 只推进**一个可验证小闭环**（顺序模式）或分配 worktree 后并行启动（并行模式）。
5. 修改代码前说明：影响范围、依赖关系、验收方式。
5. 闭环完成后输出产出物检查（见下方），等待用户确认再推进下一个。
6. 更新 `progress-log.md`。
7. 有可复用踩坑时更新 `pitfalls.md`。

### 闭环产出物检查格式

每个闭环结束后必须输出：

```
## 产出物检查

### 文件变更
- 新增：xxx
- 修改：xxx

### 验收结果
- curl / 测试输出（关键行）

### Gate 状态
- Gate E [x/y] 已完成：xxx
```

---

## 节奏控制

- 一次对话最多推进 **2 个 Day**，推进完毕后暂停等待用户发起下一步。
- 用户主动要求连续推进时可以继续，但每个 Day 结束仍需输出产出物检查。

---

## 硬性限制

- 不允许跳过阶段直接开发后续功能。
- 后端业务接口：必须先在 `api-contract.md` 冻结接口，在 `schema.md` 冻结表结构，才能写 handler / model / migration。
- 阶段切换时必须同时挪动 `stage-plan.md` 里的 `## 当前阶段：` 游标，并立即跑 `harness:check` 验证。

---

## 阶段切换 SOP

当 Gate E 全部勾选、准备进入下一阶段时，按以下顺序逐步执行，不允许跳过：

1. **挪游标**：把 `stage-plan.md` 中旧阶段标题从 `## 当前阶段：阶段 N ...` 改为 `## 阶段 N ...（已完成）`；把新阶段标题从 `## 阶段 N+1 ...` 改为 `## 当前阶段：阶段 N+1 ...`。
2. **跑自检**：执行 `npm run harness:check`，确认报告里阶段名已变成新阶段，Gate E 进度变成新阶段的 `0/N`。
3. **更新 progress-log**：在 progress-log 新增一条日志，写明"进入阶段 N+1，Gate F 复盘完成"。
4. **起草新阶段 Gate A**：在 `stage-plan.md` 新阶段段落里填写 Gate A 三项（做什么、不做什么、验收标准），等待用户确认后勾选。
5. **确认前置条件**：检查新阶段的"进入前置条件"清单，全部满足后才开始 Day 1。

输出格式：

```
## 阶段切换检查

- [x] 游标已挪动：阶段 N → 阶段 N+1
- [x] harness:check 通过：Gate E 进度 0/N
- [x] progress-log 已更新
- [ ] Gate A 待用户确认
- [ ] 前置条件待确认
```

---

## AGENTS.md 模板

新项目初始化时，在根目录创建 `AGENTS.md`，内容如下（根据项目实际情况调整文件路径和限制项）：

```markdown
# Agent 开发规则

## 研发 Harness 必读
在本项目执行任何开发任务前，必须先读取：

- `docs/dev-harness/stage-plan.md`
- `docs/dev-harness/progress-log.md`
- `docs/dev-harness/pitfalls.md`

## 工作流程

1. 先根据 `stage-plan.md` 判断当前阶段。
2. 编码前检查当前阶段的 Gate A-D。
3. 只推进一个可验证小闭环。
4. 修改代码前说明影响范围、依赖关系和验收方式。
5. 每个闭环完成后输出产出物检查，等待用户确认后再推进下一个闭环。
6. 完成后更新 `progress-log.md`。
7. 如果出现可复用踩坑，更新 `pitfalls.md`。

## Gate 勾选权

- Gate A / B / D：AI 协助起草，用户确认后勾选。
- Gate C（学习闸门）：AI 不得代勾，必须由用户学习后自己勾。
- Gate E：由 curl / 测试结果与用户共同确认。
- Gate F：AI 起草，用户复核。

## 节奏控制

- 一次对话最多推进 2 个 Day，推进完毕后必须暂停等待用户发起下一步。
```

---

## 详细模板

Gate 检查清单模板、progress-log 日志模板、pitfalls 记录模板见 `references/gate-template.md`。
