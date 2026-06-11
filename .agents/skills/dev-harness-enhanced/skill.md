---
name: dev-harness-enhanced
description: |
  研发 Harness FSM 对话协调器。**本项目所有开发任务必须通过此 skill 的 FSM 状态机驱动**。
  触发场景：用户说"开始/开启/进入 下一阶段"、"推进 Day N"、"过 Gate"、"新需求"、"状态"、
  "继续开发"、"写代码"、"实现功能"，或任何涉及编码的请求。
version: v3.4.0
type: 工作流型
trigger: 显式（触发词）+ 隐式（检测到编码意图时主动确认当前 FSM 状态）
dependencies: docs/dev-harness/stage-plan.md, docs/dev-harness/api-contract.md, docs/dev-harness/schema.md, docs/dev-harness/progress-log.md, docs/dev-harness/pitfalls.md
---

# 研发 Harness v3 — FSM 驱动开发流程

## 状态图

```
                    ┌───────────────────────────────────────┐
                    │          用户确认驱动                  │
                    │  (AI 不主动推进非自动状态)              │
                    └───────────────────────────────────────┘

[*] → REQUIREMENT ──用户确认范围──→ DESIGN ──用户确认冻结──→ LEARNING ──用户确认已学──→ CODING
 ↑       ↑                        ↑                          │                      │
 │       │                        │                          │                      │
 │       │                        └── spec-gap 发现设计问题 ──┘                      │
 │       └── spec-gap 发现需求问题 ──────────────────────────────────────┐            │
 │                                                                      │            │
 └───────────────────────────────────────────────────────────────────────┘            │
                                                                                      ▼
                                                                               GUARD_CHECK
                                                                                  │
                                                                     ┌──────────┼──────────┐
                                                                     ▼          ▼          ▼
                                                                  AUTO_FIX  HARD_FAIL  ACCEPTANCE
                                                                     │          │          │
                                                                     └──→←──────┘     ┌──┴──┐
                                                                                      ▼    ▼
                                                                                  WRAP_UP SPEC_GAP
                                                                                     │    │    │
                                                                                     │    ▼    ▼
                                                                                     │  REQUIREMENT DESIGN CODING
                                                                                     ▼
                                                                              WORKFLOW_REVIEW (自动)
                                                                                     │
                                                                         ┌───────────┴───────────┐
                                                                         ▼                       ▼
                                                                      无问题                  发现问题
                                                                         ▼                       ▼
                                                                        [*]              修改 workflow 定义
                                                                                               ↓
                                                                                         记录变更理由
                                                                                               ↓
                                                                                        下次流程生效
```

## FSM 状态定义

| 状态 | 含义 | 谁有权触发离开 | 离开条件 |
|------|------|--------------|---------| 
| REQUIREMENT | 需求确认中 | **用户** | 用户回复"确认" |
| DESIGN | 设计与契约冻结中 | **用户** | 契约已冻结 + 用户说"确认冻结" |
| LEARNING | 学习确认中 | **用户** | 用户说"了解了/继续" |
| CODING | 编码执行中 | AI（代码写完后自动） | 代码写完，自动进入 GUARD_CHECK |
| GUARD_CHECK | 门禁自动检查中 | AI（自动执行） | 全部通过 → ACCEPTANCE；软门禁失败 → AUTO_FIX；硬门禁失败 → HARD_FAIL |
| AUTO_FIX | 自动修复门禁问题 | AI（触发修复 skill） | 修复成功 → GUARD_CHECK；连续 2 轮相同错误 → HARD_FAIL |
| HARD_FAIL | 硬门禁失败 | **用户** | 用户说"修复"或"忽略" |
| ACCEPTANCE | 验收中 | **用户** | 用户说"通过" → WRAP_UP；用户说"不对" → SPEC_GAP |
| SPEC_GAP | 差异分析中 | AI（分析给出结论） + **用户确认回退目标** | 用户同意回退目标 |
| WRAP_UP | 归档沉淀中 | AI 执行 + **用户确认** | 归档完成 → WORKFLOW_REVIEW |
| WORKFLOW_REVIEW | 流程自检中 | AI（自动执行） | 无问题 → 结束；有问题 → 修改 workflow 定义后结束 |

**核心规则**：只有用户能驱动非自动状态的离开。AI 检查完条件后必须等待用户确认才能推进。

## FSM 状态输出

每个对话响应开头输出当前 FSM 状态：

```
[FSM: REQUIREMENT → 等待用户确认范围]
[FSM: DESIGN → 等待用户冻结契约]
[FSM: LEARNING → 等待用户确认已学习]
[FSM: CODING → 编码推进中]
[FSM: GUARD_CHECK → 门禁检查中]
[FSM: AUTO_FIX → 自动修复中（第 N 轮）]
[FSM: HARD_FAIL → 硬门禁失败，等待用户决策]
[FSM: ACCEPTANCE → 等待用户验收]
[FSM: SPEC_GAP → 分析完成，建议回退到 X]
[FSM: WRAP_UP → 归档中]
[FSM: WORKFLOW_REVIEW → 流程自检中]
```

## 前置条件

| 条件 | 检查方式 | 不通过时 |
|------|---------|---------| 
| `stage-plan.md` 存在且有当前阶段标记 | 读取文件，搜索 `## 当前阶段：` | 提示用户确认当前阶段 |
| 当前阶段的 Gate 状态可读 | 读取对应段落的 checkbox | 提示文件可能损坏 |
| 契约文件存在（进入 CODING 前） | 读取 api-contract.md + schema.md | 阻断编码，提示先完成 DESIGN |

## 各状态行为

### REQUIREMENT
- **触发词**："新需求"、"开始阶段 X"、"开启下一阶段"
- **进入前置检查**：
  1. 读取 stage-plan.md 找到当前阶段
  2. 检查当前阶段 Gate E/F 是否全通
  3. **如果 Gate F 未全通，阻断进入**，输出未完成项，提示用户先完成当前阶段
  4. 只有 Gate F 全通后，才允许进入下一阶段的 REQUIREMENT
- **进入**：Gate F 全通 → 读取/起草下一阶段定义
- **离开**：用户回复"确认"
- **话术**：见 `references/state-scripts.md`

### DESIGN
- **进入**：REQUIREMENT 确认后
- **离开**：文件有冻结标记 + 用户说"确认冻结"
- **话术**：见 `references/state-scripts.md`

### LEARNING
- **进入**：DESIGN 冻结后
- **离开**：用户说"了解了"或"继续"
- **AI 不代勾 Gate C**

### CODING
- **进入**：DESIGN 已冻结 + LEARNING 已确认
- **行为**：先 `go build ./...` 确认基线，按小闭环推进
- **离开**：代码写完自动进入 GUARD_CHECK
- **节奏**：一次对话最多推进 2 个 Day

#### 并行开发（契约冻结后自动启用）
Gate A/B 契约冻结后，**必须**使用 subagent 并行开发：
- `go-api-implementer` — 后端 API 实现
- `frontend-engineer` — 前端页面实现

两个 subagent 在同一条消息中并行启动。AI 不应串行等待后端完成再启动前端。

**Subagent 交接清单**：subagent 可能遗漏全局注册（router.go、layout.tsx menu），主 agent 合并时必须检查并补齐。

#### 数据库命令直接执行
migration SQL 和 seed SQL 由 AI 直接执行，不输出让用户手动跑：
```bash
mysql -u root personal_profile --default-character-set=utf8mb4 < backend/migrations/xxxx.sql
mysql -u root personal_profile --default-character-set=utf8mb4 < backend/migrations/seed_xxxx.sql
```
注意：始终使用 `--default-character-set=utf8mb4` 避免中文乱码。

#### 验收前预检（避免常见踩坑）
Gate E 浏览器验收前，AI 自动执行：
1. **Next.js 缓存清理**：`rm -rf .next && npm run dev` — 避免 middleware module not found
2. **端口占用检查**：`lsof -ti:8080 | xargs kill -9` — 后端端口冲突
3. **数据库中文验证**：curl 一个返回中文的接口，确认无乱码后再让用户验收

### GUARD_CHECK → AUTO_FIX → HARD_FAIL
详见 `references/guard-gates.md`。

### ACCEPTANCE
- **进入**：门禁全部通过
- **离开**："通过" → WRAP_UP；"不对" → SPEC_GAP
- **快路径**：拼写/文案/样式微调直接修，不走 spec-gap

### SPEC_GAP
详见 `references/spec-gap.md`。

### WRAP_UP
- **行为**：更新 progress-log.md，协助起草 pitfalls.md，提醒挪动游标
- **离开**：用户确认完成 → WORKFLOW_REVIEW

### WORKFLOW_REVIEW
- **进入**：WRAP_UP 完成后自动进入
- **行为**：自检本次流程执行中的问题
- **检查项**：
  - 状态转换是否有卡顿（同一状态停留 >3 轮对话）
  - spec-gap 回退是否频繁（同一阶段回退 >2 次）
  - 门禁失败模式是否重复（相同错误类型 >2 次）
  - 用户是否多次要求跳过某环节
- **发现问题时**：直接修改流程定义，记录变更理由
- **无问题时**：静默结束
- **详见** `references/workflow-review.md`

## 状态查询

**触发词**："状态"、"阶段进度"

详见 `references/status-query-format.md`。

## 阶段游标管理

AI 的职责是提醒，不主动挪动。详见 `references/stage-cursor.md`。

## 快速通道

当契约已冻结且用户说"走快速通道"时，跳过 LEARNING 直接进入 CODING。

## 错误处理

详见 `references/error-handling.md`。

## 示例

详见 `references/example-scenarios.md`。

## 与 AGENTS.md 的关系

- AGENTS.md = 硬性规则
- 本 Skill = FSM 驱动的对话行为
- AGENTS.md 的 Gate 勾选权规则在本 FSM 中体现为：只有用户能触发状态离开

## 变更记录

| 版本 | 日期 | 内容 |
|------|------|------|
| v3.4.0 | 2026-06-04 | REQUIREMENT 进入前置检查：Gate F 未全通时阻断，防止跳过阶段 |
| v3.3.0 | 2026-06-04 | CODING 阶段新增：契约冻结后自动并行 subagent 开发 + MySQL 命令直接执行 |
| v3.2.0 | 2026-06-04 | 新增 WORKFLOW_REVIEW 自动阶段，允许 AI 自检并修改流程定义 |
| v3.1.0 | 2026-06-04 | 拆分 references：话术、示例、错误处理独立文件 |
| v3.0.0 | 2026-06-04 | FSM 重构：状态机驱动 + 用户确认推进 + 软硬门禁分离 + spec-gap 回退 |
| v2.1.0 | 2026-06-04 | 补全 5 个缺口：状态查询、游标管理、状态收敛、快速通道、踩坑触发 |
| v2.0.0 | 2026-06-04 | 从模板驱动改为意图驱动 |
| v1.0.0 | 2026-05 | 初版（过度承诺自动化） |
