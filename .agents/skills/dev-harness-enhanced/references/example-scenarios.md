# 示例场景

FSM 流转的完整示例。

## 场景 1：用户说"推进 Day 2"

**初始状态**：CODING 前

```
[FSM: REQUIREMENT → 检查中]

前置条件检查：
- stage-plan.md 中当前阶段为 FB-5 ✓
- 契约文件存在 ✓（api-contract.md + schema.md）

但 Gate C 尚未确认学习。先确认 LEARNING 状态：
```

```
[FSM: LEARNING]

本阶段涉及 GORM upsert 模式：
- db.Clauses(clause.OnConflict{...}).Create(&profile)

已了解？回复"继续"进入编码。
```

**用户**：继续

```
[FSM: CODING]

基线检查：go build ./... → 通过 ✓
开始实现 learning_profile model + repository...

闭环完成：
文件变更：
- 新增 backend/internal/model/learning_profile.go
- 新增 backend/internal/repository/learning_profile.go

构建验证：go build ./... → 通过 ✓

进入 GUARD_CHECK 状态。
```

---

## 场景 2：门禁失败 → 自动修复

```
[FSM: GUARD_CHECK]

软门禁检查：
- gofmt → 失败（2 个文件需格式化）

进入 AUTO_FIX...
```

```
[FSM: AUTO_FIX → 第 1 轮]

调用 code-formatter skill...
格式化完成。

重新检查软门禁：
- gofmt → 通过 ✓

继续硬门禁检查：
- go build ./... → 通过 ✓

进入 ACCEPTANCE 状态。
```

---

## 场景 3：验收不通过 → Spec Gap 分析

**用户**：不对，列表应该按时间倒序排列

```
[FSM: SPEC_GAP]

差异分析：
- 预期：列表按时间倒序排列
- 实际：列表按 ID 升序排列

根因定位：编码阶段
- repository 层查询未指定 ORDER BY

建议：回退到 CODING，修改 repository 查询逻辑
受影响文件：backend/internal/repository/learning_goal.go

确认回退？
```

**用户**：确认

```
[FSM: CODING]

修改 learning_goal.go，添加 ORDER BY created_at DESC...
```

---

## 场景 4：Spec Gap 发现设计问题

**用户**：不对，这个接口应该支持分页

```
[FSM: SPEC_GAP]

差异分析：
- 预期：接口支持分页参数
- 实际：接口返回全量数据

根因定位：设计阶段
- api-contract.md 中未定义分页参数

建议：回退到 DESIGN，补充分页契约
受影响文件：
- docs/dev-harness/api-contract.md
- backend/internal/handler/learning_goal.go

确认回退？
```
