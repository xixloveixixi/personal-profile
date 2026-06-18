# Learning Knowledge Graph 设计

> 创建日期：2026-06-15
> 状态：设计已初步确认，待用户复核

## 背景

当前 Learning Coach 的生成依据主要来自学习画像、学习目标、学习计划和用户输入偏好。为了让 AI 教练的目标制定、学习路径规划和能力分析更有结构化依据，需要在学习工作台内增加私有知识图谱能力。

第一版知识图谱不做公开展示，不做复杂图谱画布，优先让 AI Coach 能读取图谱并把它作为计划生成和聊天分析的依据。

## 目标

第一版覆盖三个核心目标：

1. 学习路径规划：根据目标、依赖关系、薄弱点和下一步关系，推导学习顺序。
2. 能力画像分析：展示当前掌握的技能、知识点、项目证据和薄弱点。
3. AI 教练上下文：让 Learning Coach 在生成计划和聊天建议时读取目标相关子图。

## 非目标

第一版明确不做：

- 不做公开个人站展示。
- 不做复杂图谱画布或拖拽编辑。
- 不做 AI 直接写入图谱。
- 不做多 Agent 协作。
- 不替代现有学习画像、学习目标、学习计划，只作为补充依据。

## 方案选择

采用“CRUD + 目标相关子图 + 简单路径推荐”方案。

原因：

- 比纯 CRUD 更能服务 AI Coach 的生成依据。
- 比完整图谱平台范围更可控。
- 能复用当前 Go 后端、MySQL、Next.js Admin、Python Agent tools 的既有模式。

## 导航与页面位置

复用当前后台左侧菜单的“学习工作台”分组，不新增独立一级入口。

建议新增子页面：

- 路由：`/admin/learning/knowledge-graph`
- 菜单文案：`知识图谱`
- 所属分组：`学习工作台`

页面第一版采用管理优先布局：

- 节点管理：列表、筛选、新增、编辑、删除。
- 关系管理：列表、源节点、目标节点、关系类型、新增、编辑、删除。
- 初始化数据：从现有学习目标、学习计划/任务、公开技能、项目数据生成初始节点和关系。
- AI 使用预览：选择目标后查看 Agent 将读取的目标相关子图和推荐路径摘要。

## 数据模型

### knowledge_node

表示图谱中的节点。

核心字段：

- `id`：主键。
- `owner_id`：所属用户，当前单 owner 默认为 1。
- `node_type`：节点类型。
- `name`：节点名称。
- `slug`：稳定标识，用于初始化幂等 upsert。
- `description`：说明。
- `status`：状态，如 `active` / `archived`。
- `mastery_level`：掌握程度，可选，用于技能和知识点。
- `importance`：重要度，可选，用于目标相关排序。
- `metadata`：JSON 扩展字段，用于来源、外部链接、关联业务 ID。
- `created_at` / `updated_at` / `deleted_at`。

第一版节点类型：

- `skill`：技能，如 React、Next.js、Go、MySQL。
- `concept`：知识点，如 Server Components、JWT、GORM、SSE。
- `project`：项目/作品，如 personal-profile、Learning Coach。
- `goal`：学习或职业目标。
- `weakness`：薄弱点。
- `resource`：资料、课程、文章。

### knowledge_edge

表示两个节点之间的关系。

核心字段：

- `id`：主键。
- `owner_id`：所属用户。
- `source_node_id`：源节点。
- `target_node_id`：目标节点。
- `edge_type`：关系类型。
- `weight`：权重，可选，用于排序和推荐。
- `description`：关系说明。
- `metadata`：JSON 扩展字段。
- `created_at` / `updated_at` / `deleted_at`。

第一版关系类型：

- `depends_on`：A 依赖 B。
- `contains`：A 包含 B。
- `supports_goal`：A 支撑目标。
- `used_in_project`：A 用在项目中。
- `has_weakness`：A 存在薄弱点。
- `recommended_resource`：A 推荐资料。
- `next_step`：从 A 下一步学习 B。
- `proves`：项目或证据证明掌握某技能或知识点。

## 初始化策略

第一版采用“从现有数据初始化 + 手动维护”。

初始化来源：

- 学习目标：生成 `goal` 节点。
- 学习计划和任务：生成 `concept` 或 `resource` 候选节点，并可建立 `supports_goal` / `next_step` 关系。
- 公开技能：生成 `skill` 节点。
- 项目数据：生成 `project` 节点，并可建立 `used_in_project` / `proves` 关系。

初始化规则：

- 使用 `slug` 和来源标识做幂等 upsert。
- 初始化只追加或更新系统生成的数据，不删除用户手动维护的数据。
- 用户手动编辑后的节点保留用户版本，除非用户主动重新初始化并确认覆盖。

## 后端接口

接口需先写入 `docs/dev-harness/api-contract.md` 冻结后再实现。

建议接口分三类。

节点管理：

- `GET /api/private/learning/knowledge/nodes`
- `POST /api/private/learning/knowledge/nodes`
- `PUT /api/private/learning/knowledge/nodes/:id`
- `DELETE /api/private/learning/knowledge/nodes/:id`

关系管理：

- `GET /api/private/learning/knowledge/edges`
- `POST /api/private/learning/knowledge/edges`
- `PUT /api/private/learning/knowledge/edges/:id`
- `DELETE /api/private/learning/knowledge/edges/:id`

Agent 读取与初始化：

- `POST /api/private/learning/knowledge/initialize`
- `GET /api/private/learning/knowledge/summary`
- `GET /api/private/learning/knowledge/goals/:goalId/graph`
- `GET /api/private/learning/knowledge/goals/:goalId/next-path`

## Agent 工具

Python Agent 第一版新增只读工具，不允许直接写图谱。

建议工具：

- `get_knowledge_graph_summary()`：读取整体能力图谱摘要。
- `get_goal_related_graph(goal_id)`：读取某个目标相关的技能、知识点、薄弱点、资源和项目证据。
- `suggest_next_learning_path(goal_id)`：基于 `depends_on`、`next_step`、`has_weakness` 和 `recommended_resource` 生成候选学习路径。

计划生成逻辑调整：

- 当前计划生成依据是学习画像、选中学习目标和用户偏好。
- 新增目标相关知识子图作为第四类上下文。
- Prompt 需要要求模型解释计划与图谱依据之间的关系，例如“为什么先学这个”“它解决哪个薄弱点”“它支撑哪个目标”。

聊天逻辑调整：

- 当用户询问目标差距、学习路径、技能薄弱点、项目证明点时，Agent 应优先读取图谱工具。
- 当图谱数据缺失时，Agent 应说明依据不足，并建议用户补充图谱节点或关系。

## 前端页面设计

页面路径：`/admin/learning/knowledge-graph`。

页面区域：

1. 顶部概览：节点数、关系数、目标覆盖数、薄弱点数。
2. 节点管理 Tab：按类型筛选，支持新增、编辑、删除。
3. 关系管理 Tab：按关系类型筛选，选择源节点和目标节点。
4. 初始化 Tab：展示可初始化来源和执行结果。
5. AI 使用预览 Tab：选择学习目标后，展示目标相关子图摘要、推荐路径和缺失信息。

第一版不做复杂图谱画布。若需要简单可视化，仅做只读摘要卡片或轻量关系列表。

## 权限与安全

- 所有接口走 `/api/private/*`，必须登录。
- 所有数据按 `owner_id` 隔离。
- 删除采用软删除。
- AI 第一版只有读取权限，不直接创建、更新、删除节点和关系。
- 后续若做 AI 建议变更，必须进入“建议草稿 → 用户确认 → 保存”的流程。

## 验收标准

第一版完成后应满足：

- 可以在学习工作台左侧菜单进入 `知识图谱` 页面。
- 可以手动维护节点和关系。
- 可以从现有学习目标、学习计划/任务、公开技能、项目数据初始化图谱。
- 可以按目标查看相关子图摘要和推荐学习路径。
- AI Coach 计划生成会读取目标相关子图，并在计划中体现依据。
- AI Coach 聊天时能基于图谱回答目标差距、薄弱点、项目证明和下一步学习建议。
- `npm run build` 通过。
- 后端接口 curl 验证通过。
- agent-service 导入或启动验证通过。

## 分阶段落地建议

### Day 1：契约冻结

- 在 `schema.md` 冻结 `knowledge_node` 和 `knowledge_edge`。
- 在 `api-contract.md` 冻结节点、关系、初始化、摘要、目标子图、路径推荐接口。
- 更新 `stage-plan.md` 增加知识图谱阶段。

### Day 2：后端闭环

- 实现 migration、model、repository、handler 和路由。
- 完成节点/关系 CRUD、初始化、summary、goal graph、next path。
- 用 curl 验证接口。

### Day 3：前端管理页

- 在学习工作台菜单增加 `知识图谱` 子页面。
- 实现节点管理、关系管理、初始化、AI 使用预览。
- 完成登录态下浏览器验证。

### Day 4：Agent 接入

- Python tools 新增图谱读取工具。
- 计划生成 prompt 增加目标相关知识子图。
- Learning Coach 系统提示词补充图谱使用原则。
- 验证聊天和计划生成能引用图谱依据。

## 开放问题

- `mastery_level` 是否使用固定枚举，建议初版使用 `unknown/learning/familiar/proficient`。
- 初始化项目数据时，是否从公开项目表读取，需以当前已落地项目表为准。
- 推荐路径第一版采用规则排序，不引入图数据库或复杂图算法。
