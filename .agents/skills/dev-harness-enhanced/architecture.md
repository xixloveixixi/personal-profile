# 6-Agent 流水线架构设计（未来方向）

> **状态**: 设计文档，非当前实现。当前 Skill 仅做对话层提醒，不做自动编排。

## 愿景

当 Skill 具备可靠的编排能力后，可实现以下自动化流水线：

```
Gate D 触发
    ↓
requirement-designer → PRD.md
    ↓
go-api-implementer → 后端代码 + api-summary.md
    ↓
frontend-engineer → 前端页面代码
    ↓
test-case-designer → api-test-cases.json + e2e-test-cases.json
    ↓
integration-test-runner → integration-test-report.md
    ↓
e2e-test-executor → 截图 + e2e-result.md
```

## 前置条件（实现此架构所需）

1. **编排协议**: 定义 agent 之间的输入/输出契约（文件路径、格式、错误码）
2. **状态管理**: 结构化状态文件（YAML/JSON），而非自由格式 markdown
3. **错误恢复**: 每个 agent 失败后的回退策略和重试机制
4. **并发控制**: 多需求同时进行时的隔离（git worktree 或目录隔离）

## 当前可用 Agent

以下 agent 已定义为 `delegate_subagent` 目标，可手动调用：

| Agent | 用途 | 输入 | 输出 |
|-------|------|------|------|
| requirement-designer | 需求转 PRD | 一句话需求 | PRD.md |
| go-api-implementer | 后端实现 | PRD + 契约 | Go 代码 |
| frontend-engineer | 前端实现 | PRD + api-summary | Next.js 代码 |
| test-case-designer | 测试设计 | PRD + 代码 | 测试用例 JSON |
| integration-test-runner | 集成测试 | 测试用例 + 启动服务 | 测试报告 |
| e2e-test-executor | E2E 测试 | 测试用例 + 浏览器 | 截图 + 报告 |

## 从当前到未来的路径

### Phase 1（当前）
- Skill 做对话提醒
- 用户手动决定何时调用哪个 agent
- AI 给出建议但不自动执行

### Phase 2（下一步）
- 定义结构化状态文件格式（替代 PIPELINE.md）
- 定义 agent 间的文件契约
- 实现单 agent 调用的标准化流程

### Phase 3（未来）
- 实现多 agent 串行编排
- 加入错误恢复和重试
- 支持并行分支（前后端同时推进）

## 状态文件格式草案（Phase 2）

```yaml
# .comate/pipeline/state.yaml
pipeline:
  id: REQ-007
  status: in_progress  # idle | in_progress | blocked | done
  current_gate: D
  stages:
    - name: backend_impl
      status: done
      agent: go-api-implementer
      output: backend/internal/handler/learning.go
    - name: frontend_impl
      status: in_progress
      agent: frontend-engineer
      output: null
    - name: test_design
      status: pending
      agent: test-case-designer
      output: null
```

## 决策记录

- 2026-06-04: 将 Skill 定位从"自动编排器"收敛为"对话协调器"，自动化编排作为未来方向保留在本文档。
