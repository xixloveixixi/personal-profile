# API 契约文档

> 业务后端开发前必须先在此文件中冻结接口契约。
> 当前阶段：Stage 3 / FB-3 sys_user 与权限 — 已冻结（2026-06-02）。
> 权威源：`tech_design/ai-learning-platform/SDD-AI学习规划与成长记录平台.md` 第 9 章。
> 本文件是"将进入实现"的子集，必须先于 handler 代码存在。

## 使用规则

- **未在本文件冻结契约的接口，禁止编写 handler / service 代码**（见 `AGENTS.md` 限制条款）。
- 接口字段、错误码、鉴权要求与 SDD 9.x 不一致时，以本文件为准并同步回 SDD。
- 一个接口在本文件定稿后才允许进入 Gate D（编码闸门）。
- 删除/重命名接口必须在本文件保留一行 deprecated 说明，避免前端误调。

## 全局约定

- Base URL：`http://localhost:8080`
- Content-Type：`application/json`
- 鉴权：`Authorization: Bearer <token>`，token 由 `POST /api/auth/login` 颁发。
- 统一响应：`{ code, message, data, traceId }`（详见 `backend/docs/api.md`）。
- 错误码：沿用 SDD 9.1（0 / 40001 / 40100 / 40300 / 40400 / 50000）。
- Stage 2 鉴权降级：`/api/admin/*` 仅校验"有效 Bearer Token"，不校验 role；待 Stage 3 引入 `sys_user` 后再校验 `role=owner`。

## 已冻结接口（Stage 1）

详见 `backend/docs/api.md`，本文件不再重复：

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`

## 已冻结接口（Stage 2）

> 状态：✅ 已冻结于 2026-05-19。下列接口允许进入 Gate D 编码。

### 公开读接口（`/api/public/*`）

#### GET /api/public/profile

- **作用**：获取 owner 公开个人信息（单条）。
- **鉴权**：公开。
- **请求参数**：无。
- **成功响应 data**：
  ```json
  {
    "id": 1,
    "displayName": "Yixi Jiang",
    "headline": "Frontend × AI Agent Engineer",
    "bio": "...",
    "avatarUrl": "https://...",
    "currentFocus": "前端 Agent 工程师",
    "location": "Beijing",
    "visibility": "public"
  }
  ```
- **错误码**：`40400` 当 owner 尚未配置 profile 时返回（data 为空对象 `{}` 或 `null`，由 handler 统一返回 `40400`）。
- **关联表**：`public_profile`。
- **备注**：`visibility != "public"` 时仍返回（前端根据字段决定渲染），Stage 2 不做服务端过滤。

#### GET /api/public/contacts

- **作用**：获取 owner 公开联系方式列表。
- **鉴权**：公开。
- **请求参数**：无。
- **成功响应 data**：
  ```json
  [
    {
      "id": 10,
      "platform": "github",
      "label": "GitHub",
      "url": "https://github.com/jiangyixi",
      "icon": "github",
      "sortOrder": 1
    }
  ]
  ```
- **错误码**：`50000` DB 异常。
- **关联表**：`public_contact`。
- **备注**：仅返回 `is_public=1` 的记录；按 `sort_order ASC, id ASC` 排序；不分页，全量返回。

#### GET /api/public/skills

- **作用**：获取 owner 公开技能列表（含分类、熟练度）。
- **鉴权**：公开。
- **请求参数**：无。
- **成功响应 data**：
  ```json
  [
    {
      "id": 20,
      "name": "React",
      "category": "frontend",
      "proficiencyLevel": "熟练",
      "description": "Hooks/Server Components",
      "sortOrder": 1
    }
  ]
  ```
- **错误码**：`50000` DB 异常。
- **关联表**：`public_skill`。
- **备注**：仅返回 `is_public=1`；按 `category ASC, sort_order ASC, id ASC` 排序；不分页。

#### GET /api/public/site-config

- **作用**：获取站点配置（K-V 全集）。
- **鉴权**：公开。
- **请求参数**：无。
- **成功响应 data**：
  ```json
  [
    {
      "key": "site.title",
      "value": "Yixi's Personal Profile",
      "valueType": "string",
      "description": "站点标题"
    },
    {
      "key": "nav.items",
      "value": "[{\"label\":\"项目\",\"href\":\"/projects\"}]",
      "valueType": "json",
      "description": "导航菜单"
    }
  ]
  ```
- **错误码**：`50000` DB 异常。
- **关联表**：`site_config`。
- **备注**：返回数组（非字典），便于前端按需查找；`value` 始终为字符串，前端按 `valueType` 解析。

### Owner 写接口（`/api/admin/*`）

> 共同要求：必须携带有效 Bearer Token，否则返回 `40100`。

#### GET /api/admin/profile

- **作用**：获取后台个人信息（同 public，但允许返回非 public 字段，便于编辑回显）。
- **鉴权**：Bearer Token。
- **请求参数**：无。
- **成功响应 data**：同 `GET /api/public/profile`。
- **错误码**：`40100` 未登录；`40400` 未初始化 profile。
- **关联表**：`public_profile`。

#### PUT /api/admin/profile

- **作用**：更新（upsert）owner 个人信息。
- **鉴权**：Bearer Token。
- **请求参数**：JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | displayName  | string | 是 | 展示名称，1-64 字 |
  | headline     | string | 否 | 首页主标题，<=255 字 |
  | bio          | string | 否 | 简介，<=10000 字 |
  | avatarUrl    | string | 否 | 头像 URL，<=512 字 |
  | currentFocus | string | 否 | <=255 字 |
  | location     | string | 否 | <=128 字 |
  | visibility   | string | 否 | `public`/`private`/`hidden`，默认 `public` |
- **成功响应 data**：更新后的完整 profile（同 GET）。
- **错误码**：`40001` 字段校验失败；`40100` 未登录；`50000` DB 异常。
- **关联表**：`public_profile`。
- **备注**：按 `owner_id` upsert（无则 Create，有则 Save），始终单条。

#### GET /api/admin/contacts

- **作用**：获取联系方式列表（含非公开项）。
- **鉴权**：Bearer Token。
- **请求参数**：无。
- **成功响应 data**：数组，结构在 public 基础上额外含 `isPublic`。
  ```json
  [{ "id": 10, "platform": "github", "label": "GitHub", "url": "...", "icon": "github", "isPublic": true, "sortOrder": 1 }]
  ```
- **错误码**：`40100` 未登录；`50000` DB 异常。
- **关联表**：`public_contact`。
- **备注**：按 `sort_order ASC, id ASC` 全量返回。

#### POST /api/admin/contacts

- **作用**：新增联系方式。
- **鉴权**：Bearer Token。
- **请求参数**：JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | platform   | string | 是 | <=64 字 |
  | label      | string | 否 | <=128 字 |
  | url        | string | 否 | <=512 字 |
  | icon       | string | 否 | <=64 字 |
  | isPublic   | bool   | 否 | 默认 true |
  | sortOrder  | int    | 否 | 默认 0 |
- **成功响应 data**：新增后的完整 contact 对象。
- **错误码**：`40001` 校验失败；`40100` 未登录；`50000` DB 异常。
- **关联表**：`public_contact`。

#### PUT /api/admin/contacts/:id

- **作用**：更新联系方式。
- **鉴权**：Bearer Token。
- **请求参数**：path `id`；body 字段同 POST，全部可选（仅更新传入字段）。
- **成功响应 data**：更新后的完整 contact 对象。
- **错误码**：`40001` 校验失败；`40100` 未登录；`40400` 资源不存在；`50000` DB 异常。
- **关联表**：`public_contact`。

#### DELETE /api/admin/contacts/:id

- **作用**：删除联系方式（软删）。
- **鉴权**：Bearer Token。
- **请求参数**：path `id`。
- **成功响应 data**：`{ "id": 10 }`。
- **错误码**：`40100` 未登录；`40400` 资源不存在；`50000` DB 异常。
- **关联表**：`public_contact`。
- **备注**：GORM 软删，写入 `deleted_at`。

#### GET /api/admin/skills

- **作用**：获取技能列表（含非公开项）。
- **鉴权**：Bearer Token。
- **请求参数**：无。
- **成功响应 data**：数组，含 `isPublic` 字段。
- **错误码**：`40100` 未登录；`50000` DB 异常。
- **关联表**：`public_skill`。

#### POST /api/admin/skills

- **作用**：新增技能。
- **鉴权**：Bearer Token。
- **请求参数**：JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | name             | string | 是 | <=64 字 |
  | category         | string | 否 | <=64 字 |
  | proficiencyLevel | string | 否 | 熟练 / 掌握 / 了解 |
  | description      | string | 否 | <=512 字 |
  | isPublic         | bool   | 否 | 默认 true |
  | sortOrder        | int    | 否 | 默认 0 |
- **成功响应 data**：新增后的完整 skill 对象。
- **错误码**：`40001` / `40100` / `50000`。
- **关联表**：`public_skill`。

#### PUT /api/admin/skills/:id

- **作用**：更新技能。
- **鉴权**：Bearer Token。
- **请求参数**：path `id`；body 字段同 POST，全部可选。
- **成功响应 data**：更新后的完整 skill 对象。
- **错误码**：`40001` / `40100` / `40400` / `50000`。
- **关联表**：`public_skill`。

#### DELETE /api/admin/skills/:id

- **作用**：删除技能（软删）。
- **鉴权**：Bearer Token。
- **请求参数**：path `id`。
- **成功响应 data**：`{ "id": 20 }`。
- **错误码**：`40100` / `40400` / `50000`。
- **关联表**：`public_skill`。

#### GET /api/admin/site-config

- **作用**：获取站点配置全集（同 public，便于后台编辑列出 key）。
- **鉴权**：Bearer Token。
- **请求参数**：无。
- **成功响应 data**：同 `GET /api/public/site-config`。
- **错误码**：`40100` / `50000`。
- **关联表**：`site_config`。

#### PUT /api/admin/site-config/:key

- **作用**：按 key upsert 单条配置。
- **鉴权**：Bearer Token。
- **请求参数**：path `key`；JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | value       | string | 是 | 配置值（按 valueType 序列化后的字符串） |
  | valueType   | string | 否 | `string`/`json`/`boolean`/`number`，默认沿用已有值或 `string` |
  | description | string | 否 | <=255 字 |
- **成功响应 data**：写入后的完整 config 对象。
- **错误码**：`40001` 校验失败；`40100` 未登录；`50000` DB 异常。
- **关联表**：`site_config`。
- **备注**：按 `config_key` 唯一索引 upsert。

## 待冻结接口（Stage 3 / FB-3）

> 状态：✅ 已冻结于 2026-06-02。

### 变更接口（原 Stage 1 接口改造）

#### POST /api/auth/login（改造）

- **作用**：登录认证，从 DB 校验用户名密码（替代硬编码）。
- **鉴权**：公开。
- **请求参数**：JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | username | string | 是 | 登录用户名 |
  | password | string | 是 | 明文密码（HTTPS 传输） |
- **成功响应 data**：
  ```json
  {
    "accessToken": "eyJ...",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "owner",
      "role": "owner",
      "displayName": "Yixi Jiang"
    }
  }
  ```
- **错误码**：`40001` 参数缺失/空；`40100` 用户名或密码错误；`50000` DB 异常。
- **关联表**：`sys_user`。
- **备注**：
  - 密码校验使用 `bcrypt.CompareHashAndPassword`。
  - 登录成功时更新 `sys_user.last_login_at`。
  - JWT claims 增加 `user_id` 字段（从 DB 读取 `sys_user.id`）。
  - 硬编码 `OwnerUsername` / `OwnerPassword` 常量删除。

#### GET /api/auth/me（改造）

- **作用**：获取当前登录用户信息（从 DB 读取）。
- **鉴权**：Bearer Token。
- **请求参数**：无。
- **成功响应 data**：
  ```json
  {
    "id": 1,
    "username": "owner",
    "role": "owner",
    "displayName": "Yixi Jiang",
    "email": "contact@example.com"
  }
  ```
- **错误码**：`40100` 未登录/Token 无效；`40400` 用户不存在（DB 中 ID 匹配失败）；`50000` DB 异常。
- **关联表**：`sys_user`。
- **备注**：从 JWT claims 中取 `user_id`，查 `sys_user` 表返回。

### 新增中间件

#### RequireOwnerRole 中间件

- **作用**：在 `middleware.Auth()` 之后追加 role 校验，确保只有 `role=owner` 的用户能访问 `/api/admin/*`。
- **实现**：从 Gin context 读取 `role`（Auth 中间件已注入），非 `owner` 返回 `40300`。
- **影响范围**：`/api/admin/*` 全部路由组。
- **错误码**：`40300` 权限不足。

### 前端兼容变更

- `lib/api/admin.ts`：无需改动（Bearer token 格式不变）。
- `lib/stores/auth.ts`：登录响应中 `user` 字段新增 `id`，store 可选存储 `userId`。
- `middleware.ts`：无需改动（仍判断 cookie 是否存在）。

## 待冻结接口（Stage 7 / FB-5：学习工作台）

> 状态：✅ 已冻结于 2026-06-03。

### 私有接口（`/api/private/*`）

> 共同要求：Bearer Token + role=owner，否则返回 `40100` / `40300`。
> 与 `/api/admin/*` 区别：admin 是后台管理，private 是私有学习工作台。

#### GET /api/private/learning/profile

- **作用**：获取学习画像（单条）。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：无。
- **成功响应 data**：
  ```json
  {
    "id": 1,
    "targetRole": "前端架构师",
    "backgroundSummary": "...",
    "skillSummary": "...",
    "weaknessSummary": "...",
    "learningPreference": "...",
    "resumeSnapshot": "..."
  }
  ```
- **错误码**：`40100` 未登录；`40300` 权限不足；`40400` 未初始化画像；`50000` DB 异常。
- **关联表**：`learning_profile`。

#### PUT /api/private/learning/profile

- **作用**：更新（upsert）学习画像。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | targetRole        | string | 否 | 目标角色 |
  | backgroundSummary | string | 否 | 背景摘要 |
  | skillSummary      | string | 否 | 技能摘要 |
  | weaknessSummary   | string | 否 | 弱点摘要 |
  | learningPreference| string | 否 | 学习偏好 |
  | resumeSnapshot    | string | 否 | 简历快照 |
- **成功响应 data**：更新后完整 profile。
- **错误码**：`40001` 校验失败；`40100` / `40300` / `50000`。
- **关联表**：`learning_profile`。

#### GET /api/private/learning/goals

- **作用**：获取学习目标列表。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：无。
- **成功响应 data**：
  ```json
  [
    {
      "id": 1,
      "title": "掌握 React Server Components",
      "description": "...",
      "goalType": "skill",
      "priority": 1,
      "deadline": "2026-07-01",
      "status": "in_progress",
      "progressPercent": 30
    }
  ]
  ```
- **错误码**：`40100` / `40300` / `50000`。
- **关联表**：`learning_goal`。
- **备注**：按 `priority ASC, id ASC` 全量返回。

#### POST /api/private/learning/goals

- **作用**：新增学习目标。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | title           | string | 是 | 目标标题 |
  | description     | string | 否 | 目标描述 |
  | goalType        | string | 否 | 目标类型 |
  | priority        | int    | 否 | 优先级，默认 0 |
  | deadline        | string | 否 | 截止日期 `YYYY-MM-DD` |
  | status          | string | 否 | 状态，默认 `pending` |
  | progressPercent | int    | 否 | 进度百分比，默认 0 |
- **成功响应 data**：新增后完整 goal。
- **错误码**：`40001` / `40100` / `40300` / `50000`。
- **关联表**：`learning_goal`。

#### PUT /api/private/learning/goals/:id

- **作用**：更新学习目标。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：path `id`；body 字段同 POST，全部可选。
- **成功响应 data**：更新后完整 goal。
- **错误码**：`40001` / `40100` / `40300` / `40400` / `50000`。
- **关联表**：`learning_goal`。

#### DELETE /api/private/learning/goals/:id

- **作用**：删除学习目标（软删）。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：path `id`。
- **成功响应 data**：`{ "id": 1 }`。
- **错误码**：`40100` / `40300` / `40400` / `50000`。
- **关联表**：`learning_goal`。
- **备注**：GORM 软删，写入 `deleted_at`。

## 已冻结接口（Pipeline 验证 / REQ-20260603-01）

> 状态：✅ 已冻结于 2026-06-03。

### GET /api/health（改造）

- **作用**：健康检查 + 记录调用日志。
- **鉴权**：公开。
- **请求参数**：无。
- **成功响应 data**：
  ```json
  { "status": "ok" }
  ```
- **副作用**：写入一条 `health_check_log` 记录。
- **关联表**：`health_check_log`。

### GET /api/admin/health-stats

- **作用**：查询最近 24 小时健康检查调用次数。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：无。
- **成功响应 data**：
  ```json
  {
    "totalCount": 1440,
    "startTime": "2026-06-02T11:15:00Z",
    "endTime": "2026-06-03T11:15:00Z"
  }
  ```
- **错误码**：`40100` 未登录；`40300` 权限不足。
- **关联表**：`health_check_log`。

## 待冻结接口（Stage 8 / FB-6：学习计划功能）

> 状态：✅ 已冻结于 2026-06-04。
> AI 调用方式：后端 Go 调用 DeepSeek API（OpenAI 兼容），SDK 使用 `github.com/sashabaranov/go-openai`。

### 私有接口（`/api/private/*`）

> 共同要求：Bearer Token + role=owner，否则返回 `40100` / `40300`。

#### GET /api/private/learning/plans

- **作用**：获取学习计划列表。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：无。
- **成功响应 data**：
  ```json
  [
    {
      "id": 1,
      "goalId": 1,
      "title": "React Server Components 学习计划",
      "description": "...",
      "source": "ai_generated",
      "status": "active",
      "startDate": "2026-06-01",
      "endDate": "2026-06-30",
      "totalTasks": 10,
      "completedTasks": 3
    }
  ]
  ```
- **错误码**：`40100` / `40300` / `50000`。
- **关联表**：`learning_plan`。
- **备注**：按 `created_at DESC` 全量返回。

#### POST /api/private/learning/plans

- **作用**：新增学习计划。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | goalId      | int    | 否 | 关联目标 ID |
  | title       | string | 是 | 计划标题 |
  | description | string | 否 | 计划描述 |
  | source      | string | 否 | 来源，默认 `manual` |
  | status      | string | 否 | 状态，默认 `draft` |
  | startDate   | string | 否 | 开始日期 `YYYY-MM-DD` |
  | endDate     | string | 否 | 结束日期 `YYYY-MM-DD` |
- **成功响应 data**：新增后完整 plan。
- **错误码**：`40001` / `40100` / `40300` / `50000`。
- **关联表**：`learning_plan`。

#### PUT /api/private/learning/plans/:id

- **作用**：更新学习计划。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：path `id`；body 字段同 POST，全部可选。
- **成功响应 data**：更新后完整 plan。
- **错误码**：`40001` / `40100` / `40300` / `40400` / `50000`。
- **关联表**：`learning_plan`。

#### DELETE /api/private/learning/plans/:id

- **作用**：删除学习计划（软删）。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：path `id`。
- **成功响应 data**：`{ "id": 1 }`。
- **错误码**：`40100` / `40300` / `40400` / `50000`。
- **关联表**：`learning_plan`。
- **备注**：级联软删关联的 `learning_task`。

#### POST /api/private/learning/plans/generate

- **作用**：AI 生成学习计划草稿。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | goalId      | int    | 是 | 目标 ID，用于获取目标信息 |
  | preferences | string | 否 | 额外偏好说明 |
- **成功响应 data**：
  ```json
  {
    "plan": {
      "title": "AI 生成的计划标题",
      "description": "计划描述...",
      "startDate": "2026-06-05",
      "endDate": "2026-06-30"
    },
    "tasks": [
      {
        "title": "学习 RSC 基础概念",
        "description": "阅读官方文档...",
        "taskType": "learning",
        "estimatedMinutes": 60,
        "sortOrder": 1
      }
    ]
  }
  ```
- **错误码**：`40001` goalId 缺失或目标不存在；`40100` / `40300` / `50000`。
- **关联表**：`learning_goal`、`learning_profile`（读取画像作为上下文）。
- **备注**：返回草稿，不自动保存；用户确认后调 `POST /plans` + `POST /plans/:id/tasks` 批量保存。

#### GET /api/private/learning/plans/:planId/tasks

- **作用**：获取计划下的任务列表。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：path `planId`。
- **成功响应 data**：
  ```json
  [
    {
      "id": 1,
      "planId": 1,
      "title": "学习 RSC 基础概念",
      "description": "...",
      "taskType": "learning",
      "status": "completed",
      "priority": 1,
      "estimatedMinutes": 60,
      "actualMinutes": 75,
      "dueDate": "2026-06-10",
      "completedAt": "2026-06-08T14:30:00Z",
      "sortOrder": 1
    }
  ]
  ```
- **错误码**：`40100` / `40300` / `40400` plan 不存在 / `50000`。
- **关联表**：`learning_task`。
- **备注**：按 `sort_order ASC, id ASC` 返回。

#### POST /api/private/learning/plans/:planId/tasks

- **作用**：新增任务。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：path `planId`；JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | title            | string | 是 | 任务标题 |
  | description      | string | 否 | 任务描述 |
  | taskType         | string | 否 | 类型，默认 `learning` |
  | status           | string | 否 | 状态，默认 `pending` |
  | priority         | int    | 否 | 优先级，默认 0 |
  | estimatedMinutes | int    | 否 | 预估耗时，默认 0 |
  | dueDate          | string | 否 | 截止日期 `YYYY-MM-DD` |
  | sortOrder        | int    | 否 | 排序，默认 0 |
- **成功响应 data**：新增后完整 task。
- **错误码**：`40001` / `40100` / `40300` / `40400` / `50000`。
- **关联表**：`learning_task`。
- **备注**：新增时自动更新 `learning_plan.total_tasks`。

#### PUT /api/private/learning/tasks/:id

- **作用**：更新任务。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：path `id`；body 字段同 POST，全部可选。
- **成功响应 data**：更新后完整 task。
- **错误码**：`40001` / `40100` / `40300` / `40400` / `50000`。
- **关联表**：`learning_task`。
- **备注**：状态改为 `completed` 时自动更新 `completed_at` 和 `learning_plan.completed_tasks`。

#### DELETE /api/private/learning/tasks/:id

- **作用**：删除任务（软删）。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：path `id`。
- **成功响应 data**：`{ "id": 1 }`。
- **错误码**：`40100` / `40300` / `40400` / `50000`。
- **关联表**：`learning_task`。
- **备注**：删除时自动更新 `learning_plan.total_tasks`。

#### POST /api/private/learning/tasks/:taskId/progress

- **作用**：记录学习进度。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：path `taskId`；JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | minutesSpent | int    | 是 | 本次耗时（分钟） |
  | note         | string | 否 | 学习笔记 |
- **成功响应 data**：新增后完整 progress 记录。
- **错误码**：`40001` / `40100` / `40300` / `40400` / `50000`。
- **关联表**：`learning_progress`、`learning_task`。
- **备注**：自动累加 `learning_task.actual_minutes`。

#### GET /api/private/learning/tasks/:taskId/progress

- **作用**：获取任务的进度历史。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：path `taskId`。
- **成功响应 data**：
  ```json
  [
    {
      "id": 1,
      "taskId": 1,
      "minutesSpent": 30,
      "note": "完成了基础概念的学习",
      "loggedAt": "2026-06-05T10:30:00Z"
    }
  ]
  ```
- **错误码**：`40100` / `40300` / `40400` / `50000`。
- **关联表**：`learning_progress`。
- **备注**：按 `logged_at DESC` 返回。

## 待冻结接口（Stage 9 / FB-7：Learning Coach Agent）

> 状态：✅ 已冻结于 2026-06-07。
> 设计文档：`docs/superpowers/specs/2026-06-07-learning-coach-agent-design.md`。
> 技术栈：Python 微服务（FastAPI + LangGraph + DeepSeek）。

### Python Agent 服务接口（FastAPI）

> Base URL：`http://localhost:8000`
> Content-Type：`application/json`
> 鉴权：`Authorization: Bearer <token>`（前端直连时校验，Go 代理时透传）

#### POST /chat（流式对话）

- **作用**：与 Learning Coach Agent 进行流式对话。
- **鉴权**：Bearer Token（owner role）。
- **请求参数**：JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | conversation_id | int | 否 | 对话 ID，空则新建对话 |
  | message | string | 是 | 用户消息 |
- **成功响应**：SSE 流
  ```
  data: {"type": "token", "content": "好"}
  data: {"type": "token", "content": "的"}
  data: {"type": "tool_call", "name": "get_learning_profile", "args": {}, "id": "call_xxx"}
  data: {"type": "tool_result", "name": "get_learning_profile", "result": {...}}
  data: {"type": "token", "content": "根据你的画像..."}
  data: {"type": "done", "conversation_id": 123, "tokens_used": 150}
  ```
- **错误码**：`40100` 未登录；`40300` 权限不足；`50000` LLM 调用失败。
- **关联表**：`agent_conversation`、`agent_message`。
- **备注**：流式响应，前端需处理 SSE；Tool 调用过程对用户可见。

#### POST /generate/plan

- **作用**：生成学习计划（替换 Go 后端 mock，Go 代理调用此接口）。
- **鉴权**：Bearer Token（owner role）。
- **请求参数**：JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | goal_id | int | 是 | 目标 ID |
  | preferences | string | 否 | 额外偏好说明 |
- **成功响应 data**：
  ```json
  {
    "plan": {
      "title": "React Server Components 学习计划",
      "description": "基于你的画像和目标...",
      "startDate": "2026-06-08",
      "endDate": "2026-07-08"
    },
    "tasks": [
      {
        "title": "学习 RSC 基础概念",
        "description": "阅读官方文档...",
        "taskType": "learning",
        "estimatedMinutes": 60,
        "sortOrder": 1
      }
    ]
  }
  ```
- **错误码**：`40001` goal_id 缺失或目标不存在；`40100` / `40300` / `50000`。
- **关联表**：`learning_goal`、`learning_profile`（读取画像作为上下文）。
- **备注**：返回草稿，不自动保存；用户确认后调 Go `POST /api/private/learning/plans` + `POST /api/private/learning/plans/:planId/tasks` 保存。

#### GET /chat/history/:conversation_id

- **作用**：获取对话历史。
- **鉴权**：Bearer Token（owner role）。
- **请求参数**：path `conversation_id`。
- **成功响应 data**：
  ```json
  [
    {
      "id": 1,
      "role": "user",
      "content": "帮我生成一个学习计划",
      "createdAt": "2026-06-07T10:00:00Z"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "好的，让我先看一下你的学习画像...",
      "toolCalls": [{"name": "get_learning_profile", "args": {}, "id": "call_xxx"}],
      "createdAt": "2026-06-07T10:00:05Z"
    }
  ]
  ```
- **错误码**：`40100` / `40300` / `40400` / `50000`。
- **关联表**：`agent_message`。

### Go 后端接口（代理 + 对话管理）

#### POST /api/private/learning/plans/generate（改造）

- **作用**：代理调用 Python `/generate/plan`，替换现有 mock 实现。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：同 Python `/generate/plan`。
- **成功响应 data**：同 Python `/generate/plan`。
- **错误码**：同 Python `/generate/plan`（代理透传）。
- **备注**：Go 后端不处理 LLM 调用，仅做代理。

#### GET /api/private/agent/conversations

- **作用**：获取用户的对话列表。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：无。
- **成功响应 data**：
  ```json
  [
    {
      "id": 1,
      "title": "React 学习计划",
      "status": "active",
      "createdAt": "2026-06-07T10:00:00Z",
      "updatedAt": "2026-06-07T10:30:00Z"
    }
  ]
  ```
- **错误码**：`40100` / `40300` / `50000`。
- **关联表**：`agent_conversation`。
- **备注**：按 `updated_at DESC` 返回。

#### DELETE /api/private/agent/conversations/:id

- **作用**：删除对话（物理删除）。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：path `id`。
- **成功响应 data**：`{ "id": 1 }`。
- **错误码**：`40100` / `40300` / `40400` / `50000`。
- **关联表**：`agent_conversation`、`agent_message`（级联删除）。
- **备注**：删除对话时同时删除关联的所有消息。

---

## 待冻结接口（Stage 6 / FB-4：portfolio_project）

> 状态：✅ 已冻结于 2026-06-02。下列接口允许进入 Gate D 编码。

### 公开读接口

#### GET /api/public/projects

- **作用**：获取公开项目列表。
- **鉴权**：公开。
- **请求参数**：无。
- **成功响应 data**：
  ```json
  [
    {
      "id": 1,
      "slug": "cream-design",
      "title": "Cream-Design 组件库",
      "shortDescription": "从零构建的 React 组件库...",
      "technologies": ["React 19", "TypeScript", "Rollup"],
      "githubUrl": "https://github.com/...",
      "demoUrl": "",
      "featuredImage": "/images/cream-design-1.png",
      "gallery": ["/images/cream-design-1.png", "/images/cream-design-2.png"],
      "publishedAt": "2025-01-15",
      "featured": true,
      "sortOrder": 1
    }
  ]
  ```
- **错误码**：`50000` DB 异常。
- **关联表**：`portfolio_project`。
- **备注**：仅返回 `is_public=1`；按 `sort_order ASC, id ASC` 排序；不分页。列表不返回 longDescription/problem/solution/challenges/results（体积控制）。

#### GET /api/public/projects/:slug

- **作用**：获取单个项目详情（含完整描述字段）。
- **鉴权**：公开。
- **请求参数**：path `slug`。
- **成功响应 data**：
  ```json
  {
    "id": 1,
    "slug": "cream-design",
    "title": "Cream-Design 组件库",
    "shortDescription": "...",
    "longDescription": "详细介绍...",
    "problem": "...",
    "solution": "...",
    "challenges": "...",
    "results": "...",
    "technologies": ["React 19", "TypeScript"],
    "githubUrl": "https://...",
    "demoUrl": "",
    "featuredImage": "/images/cream-design-1.png",
    "gallery": ["/images/cream-design-1.png"],
    "publishedAt": "2025-01-15",
    "featured": true,
    "sortOrder": 1
  }
  ```
- **错误码**：`40400` slug 对应项目不存在或非公开；`50000` DB 异常。
- **关联表**：`portfolio_project`。
- **备注**：仅返回 `is_public=1` 的记录，非公开项目返回 40400。

### Owner 写接口

> 共同要求：Bearer Token + role=owner，否则返回 `40100` / `40300`。

#### GET /api/admin/projects

- **作用**：获取全部项目列表（含非公开项）。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：无。
- **成功响应 data**：数组，在公开列表基础上额外含 `isPublic`、`longDescription` 等全字段。
- **错误码**：`40100` / `40300` / `50000`。
- **关联表**：`portfolio_project`。
- **备注**：按 `sort_order ASC, id ASC` 全量返回。

#### POST /api/admin/projects

- **作用**：新增项目。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：JSON Body
  | 字段 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | slug             | string   | 是 | URL 友好标识，<=128 字，仅 `[a-z0-9-]` |
  | title            | string   | 是 | <=255 字 |
  | shortDescription | string   | 否 | <=512 字 |
  | longDescription  | string   | 否 | 无限制 |
  | problem          | string   | 否 | 无限制 |
  | solution         | string   | 否 | 无限制 |
  | challenges       | string   | 否 | 无限制 |
  | results          | string   | 否 | 无限制 |
  | technologies     | string[] | 否 | 技术栈数组，默认 [] |
  | githubUrl        | string   | 否 | <=512 字 |
  | demoUrl          | string   | 否 | <=512 字 |
  | featuredImage    | string   | 否 | <=512 字 |
  | gallery          | string[] | 否 | 图库数组，默认 [] |
  | publishedAt      | string   | 否 | ISO date `YYYY-MM-DD` |
  | featured         | bool     | 否 | 默认 false |
  | isPublic         | bool     | 否 | 默认 true |
  | sortOrder        | int      | 否 | 默认 0 |
- **成功响应 data**：新增后的完整 project 对象。
- **错误码**：`40001` 校验失败（slug/title 缺失或格式不合法）；`40100` / `40300` / `50000`。
- **关联表**：`portfolio_project`。
- **备注**：slug 重复返回 `40001`。

#### PUT /api/admin/projects/:id

- **作用**：更新项目。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：path `id`；body 字段同 POST，全部可选（仅更新传入字段）。
- **成功响应 data**：更新后的完整 project 对象。
- **错误码**：`40001` / `40100` / `40300` / `40400` / `50000`。
- **关联表**：`portfolio_project`。
- **备注**：slug 更新时若与其他记录冲突返回 `40001`。

#### DELETE /api/admin/projects/:id

- **作用**：删除项目（软删）。
- **鉴权**：Bearer Token + owner role。
- **请求参数**：path `id`。
- **成功响应 data**：`{ "id": 1 }`。
- **错误码**：`40100` / `40300` / `40400` / `50000`。
- **关联表**：`portfolio_project`。
- **备注**：GORM 软删，写入 `deleted_at`。

## 变更记录

| 日期 | 变更 | 触发原因 |
|------|------|----------|
| 2026-05-17 | 初始化文件，纳入 Stage 1 已冻结接口 | Harness 优化 P0 |
| 2026-05-19 | 冻结 Stage 2 全部公开读 + owner 写接口（profile / contacts / skills / site-config）；将 site-config 路径从候选清单的 `/api/site/config` 修正为 SDD 9.3 的 `/api/public/site-config`；admin 写路径统一到 `/api/admin/site-config(/:key)`；明确 Stage 2 owner 校验降级为"有效 Token" | Stage 2 Day 2 进入 Gate B |
