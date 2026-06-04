---
name: dev-harness-enhanced
description: 增强版研发 Harness，统一协调 6-Agent 流水线与 Gate 流程。当用户说"开始新阶段"、"推进 Day N"、"过 Gate"、"新需求"、"启动流水线"时触发。
---

# 增强版研发 Harness

统一入口，协调 6-Agent 流水线与 Gate 检查流程。

## 核心架构

```
Gate A (需求) → Gate B (设计) → Gate C (学习) → Gate D (编码) → Gate E (验收) → Gate F (沉淀)
     ↓              ↓              ↓              ↓              ↓              ↓
  pipeline      契约冻结       强制学习      6-Agent 流水线   测试报告       产出物归档
```

## 当前阶段判断

读取 `docs/dev-harness/stage-plan.md` 和 `.comate/pipeline/PIPELINE.md` 判断当前状态。

## Gate 流程

### Gate A: 需求闸门
**触发词**: "新需求"、"启动流水线"、"开始阶段 X"

**动作**:
1. 检查 `.comate/pipeline/PIPELINE.md` 是否 idle
2. 调用 `requirement-designer` agent 生成 PRD
3. 输出 PRD 摘要，等待用户确认
4. 用户确认后，标记 Gate A 完成

**输出**:
- `requirements/REQ-XXX/PRD.md`
- 人工确认记录

### Gate B: 设计闸门
**触发词**: "冻结契约"、"确认设计"

**动作**:
1. 读取 PRD.md
2. 引导用户设计接口 + 表结构
3. 写入/更新 `docs/dev-harness/api-contract.md`（冻结标记）
4. 写入/更新 `docs/dev-harness/schema.md`（冻结标记）
5. 标记 Gate B 完成

**输出**:
- api-contract.md 更新（冻结标记）
- schema.md 更新（冻结标记）

### Gate C: 学习闸门
**触发词**: "开始学习"、"过 Gate C"

**动作**:
1. 判断是否涉及新技术栈
2. 如需学习，提供最小学习材料（API 列表 + 示例）
3. 等待用户确认已学习
4. **AI 不得代勾 Gate C**，必须用户自己勾

**学习材料格式**:
```markdown
## 最小学习材料

### GORM Upsert 模式
- API: `db.Where("owner_id = ?", ownerID).FirstOrCreate(&profile)`
- 示例：...（3-5 行代码）

### Next.js Server Component
- fetch 默认缓存
- cache: 'no-store' 禁用缓存
```

### Gate D: 编码闸门
**触发词**: "开始编码"、"推进"、"跑流水线"

**动作**:
1. 确认 Gate B 已冻结（契约存在）
2. 启动 6-Agent 流水线：
   - `go-api-implementer` 实现后端
   - `frontend-engineer` 实现前端（如有）
   - `test-case-designer` 设计测试
   - `integration-test-runner` 执行测试
3. 流水线产出写入 `.comate/pipeline/requirements/REQ-XXX/`
4. 标记 Gate D 完成

**流水线监控**:
- 每阶段完成后报告产出物
- 测试失败时提示修复
- 用户输入"继续"推进下一阶段

### Gate E: 验收闸门
**触发词**: "验收"、"过 Gate E"、"测试通过"

**动作**:
1. 读取流水线测试报告（`integration-test-report.md`）
2. 对比 api-contract.md 契约
3. 人工抽检核心场景
4. 输出验收清单：
   - [ ] 代码符合契约
   - [ ] 测试全部通过
   - [ ] `go build ./...` 通过
   - [ ] `npm run build` 通过
5. 用户确认后标记 Gate E 完成

### Gate F: 沉淀闸门
**触发词**: "完成"、"归档"、"更新日志"

**动作**:
1. 更新 `docs/dev-harness/progress-log.md`
2. 更新 `docs/dev-harness/pitfalls.md`（如有踩坑）
3. 归档 PRD 到 `requirements/REQ-XXX/` 持久化
4. 重置 `.comate/pipeline/PIPELINE.md` 为 idle
5. **AI 反思：检查是否有可复用经验沉淀为 Skill**
6. 输出阶段总结

**AI 反思检查清单**:
- [ ] 本次开发中是否有重复出现的模式？（如 CRUD 模板、API 调用模式）
- [ ] 是否有踩坑可以抽象为通用解决方案？
- [ ] 当前流程是否有卡点可以优化？
- [ ] 是否有可抽取为 Skill 的通用能力？

**反思输出格式**:
```markdown
## Skill 建议

### 可沉淀为 Skill 的模式
- [ ] 场景: "当遇到 xxx 时" → 建议创建 "xxx-skill"
- [ ] ...

### 建议优化
- [ ] 流程优化: ...
- [ ] 文档补充: ...
```

如有可沉淀的 Skill，AI 主动提示用户：
```
💡 发现可复用模式：xxx，建议创建 Skill？
操作：使用 create-skill skill 创建
```

## 快速通道

对于**简单需求**（已冻结契约、熟悉技术栈）可跳过 Gate B/C：

```
新需求：实现 xxx 表 CRUD（契约已冻结）
↓
Gate D 直接启动流水线
↓
Gate E 验收
↓
Gate F 沉淀
```

## 状态查询

**触发词**: "状态"、"阶段进度"、"harness check"

**输出**:
```markdown
## 当前状态

### Stage X: [阶段名称]
- Gate A: ✅ 已完成
- Gate B: ✅ 已冻结（api-contract.md / schema.md）
- Gate C: ✅ 已学习
- Gate D: ⏳ 进行中（流水线阶段 3/6）
- Gate E: ⏳ 待验收
- Gate F: ⏳ 待沉淀

### 流水线状态
- 活跃需求: REQ-XXX
- 当前阶段: fe_impl_done
- 下一步: 调用 test-case-designer
```

## 异常处理

### 流水线测试失败
1. 状态回退到对应实现阶段
2. 输出失败原因 + 修复建议
3. 用户修复后输入"重试测试"继续

### 契约变更需求
1. 暂停流水线
2. 回到 Gate B 重新冻结契约
3. 继续流水线

## 输出格式

### 阶段完成摘要
```markdown
## 阶段完成

- **需求**: REQ-XXX
- **Gate 状态**: A ✅ B ✅ C ✅ D ✅ E ✅ F ✅
- **代码变更**: [文件列表]
- **测试结果**: X/Y 通过
- **产出物**: [PRD.md / api-summary.md / test-report.md]
- **下一步**: 进入 Stage X 或完成
```

## 与现有体系的关系

- 兼容 `docs/dev-harness/stage-plan.md` 的阶段定义
- 兼容 `docs/dev-harness/progress-log.md` 的进度追踪
- 兼容 `docs/dev-harness/pitfalls.md` 的踩坑记录
- 流水线产出物统一归档到 `.comate/pipeline/requirements/`