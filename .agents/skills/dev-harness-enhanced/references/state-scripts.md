# 状态话术模板

各 FSM 状态的标准输出格式和话术模板。

## REQUIREMENT 话术

```
[FSM: REQUIREMENT]

本阶段：[阶段名称]
做什么：[列表]
不做什么：[列表]
验收标准：[列表]

请确认以上范围是否正确？（回复"确认"进入 DESIGN）
```

## DESIGN 话术

```
[FSM: DESIGN]

当前阶段需要冻结以下契约：
- api-contract.md：[接口列表]
- schema.md：[表结构列表]

请确认是否已完成冻结？（回复"确认冻结"进入 LEARNING）
```

## LEARNING 话术

```
[FSM: LEARNING]

本阶段涉及 [技术点]：
- [API 或模式示例，3-5 行]

已了解？回复"继续"进入编码。
```

## CODING 闭环话术

```
[FSM: CODING]

基线检查：go build ./... → 通过 ✓
开始实现 [模块]...

闭环完成：
文件变更：
- 新增 [文件路径]
- 修改 [文件路径]

构建验证：go build ./... → 通过 ✓

进入 GUARD_CHECK 状态。
```

## HARD_FAIL 话术

```
[FSM: HARD_FAIL]

门禁失败项：[检查项]
错误输出：[...]

建议修复方向：[...]

请确认：修复 / 忽略继续？
```

## ACCEPTANCE 话术

```
[FSM: ACCEPTANCE]

Gate E 验收清单：
- [ ] [验收项 1]：[验证命令] → [结果]
- [ ] [验收项 2]：[验证命令] → [结果]

请确认验收结果：通过 / 不对
```

## SPEC_GAP 话术

```
[FSM: SPEC_GAP]

差异分析结果：
- 预期行为：[...]
- 实际行为：[...]
- 根因定位：[需求/设计/编码] 阶段

建议回退到：[目标状态]
受影响文件：[清单]

确认回退？
```

## WRAP_UP 话术

```
[FSM: WRAP_UP]

归档清单：
- progress-log.md 已更新
- pitfalls.md [有/无] 新增
- stage-plan.md 游标待挪动

确认完成本阶段？
```
