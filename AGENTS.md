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
5. 完成后更新 `progress-log.md`。
6. 如果出现可复用踩坑，更新 `pitfalls.md`。

## 限制
- 不允许跳过阶段直接开发后续功能。
- 不允许在未确认接口和表结构前写业务后端。
- 不允许把博客迁移出 Notion。
- 不允许一次性大范围重构现有前端。