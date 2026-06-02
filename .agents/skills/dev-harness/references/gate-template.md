# Gate 模板集合

## stage-plan.md 阶段模板

新建阶段时复制此模板，填入具体内容：

```markdown
## 当前阶段：阶段 N <阶段名称>

### 阶段目标

<一句话描述本阶段要跑通什么>

### 本阶段做什么

- 

### 本阶段不做什么

- 

### 闸门检查

#### Gate A：需求闸门

- [ ] 当前阶段目标是否明确？
- [ ] 是否确认本阶段只做 <范围>？
- [ ] 是否确认不做 <排除项>？

#### Gate B：设计闸门

- [ ] 接口契约是否已在 api-contract.md 冻结？（有后端时）
- [ ] 表结构是否已在 schema.md 冻结？（有 DB 时）
- [ ] 关键架构决策是否已明确？

#### Gate C：学习闸门（只能用户自己勾）

- [ ] 是否只学习本阶段所需的最小知识点 1？
- [ ] 是否只学习本阶段所需的最小知识点 2？

#### Gate D：编码闸门

- [ ] 工具链验证：<命令> 已通过
- [ ] 是否明确新增文件/目录位置？
- [ ] 是否确认不影响现有功能？
- [ ] 是否明确本阶段验收方式？
- [ ] 并行检查：本阶段任务是否可拆分给多个 subagent？如果是，先用 git-worktree-flow 创建 worktree 再分配。

#### Gate E：验证闸门

- [ ] <验收项 1>
- [ ] <验收项 2>

#### Gate F：沉淀闸门

- [ ] 是否更新 progress-log.md？
- [ ] 是否把踩坑写入 pitfalls.md？
- [ ] 是否明确下一阶段是否可以开始？

### 节奏建议

| 天数 | 目标 | 产出 |
| --- | --- | --- |
| Day 1 | | |
| Day 2 | | |

### 降级策略

- 如果 <风险点> 卡住：<降级方案>

### 进入前置条件

- [ ] 上一阶段 Gate E/F 全部通过
```

---

## progress-log.md 日志模板

```markdown
## YYYY-MM-DD（Day N）

### 今日目标
- 

### 今日完成
- 

### 当前阻塞
- 无 / <描述>

### 关键决策
- 

### 明日第一步
- 
```

---

## pitfalls.md 记录模板

```markdown
## <问题标题>

### 场景

<什么情况下遇到的>

### 原因

<为什么会发生>

### 解决方案

<怎么解决的>

### 下次如何避免

<具体的操作规则>
```

---

## api-contract.md 接口模板

```markdown
## <接口名称>

- **路径**：`METHOD /api/xxx`
- **作用**：
- **鉴权**：无 / Bearer Token
- **请求体**：
  ```json
  {}
  ```
- **响应**：
  ```json
  {"code": 0, "message": "ok", "data": {}}
  ```
- **错误码**：
- **关联表**：
```

---

## schema.md 表结构模板

```markdown
## <表名>

**用途**：

```sql
CREATE TABLE IF NOT EXISTS `<table_name>` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3)     NULL,
  -- 业务字段
  PRIMARY KEY (`id`),
  INDEX `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT UNSIGNED | 主键 |
```
