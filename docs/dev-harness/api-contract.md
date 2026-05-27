# API 契约文档

> 业务后端开发前必须先在此文件中冻结接口契约。
> 当前阶段：Stage 2 已冻结 4 张公开表的读写接口（2026-05-19）。
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

## 待冻结接口

> 当前无。Stage 2 范围已全部冻结。

## 本阶段不做

- 不做 `sys_user` 相关接口（登录仍走 Stage 1 硬编码）。
- 不做 `portfolio_project` / `portfolio_project_tech`（留 Stage 3 或后续阶段）。
- 不做分页、排序参数、模糊搜索（`GET` 全量返回即可）。
- 不做资源上传 `POST /api/admin/assets/upload`（SDD 9.6，留后续阶段）。

## 变更记录

| 日期 | 变更 | 触发原因 |
|------|------|----------|
| 2026-05-17 | 初始化文件，纳入 Stage 1 已冻结接口 | Harness 优化 P0 |
| 2026-05-19 | 冻结 Stage 2 全部公开读 + owner 写接口（profile / contacts / skills / site-config）；将 site-config 路径从候选清单的 `/api/site/config` 修正为 SDD 9.3 的 `/api/public/site-config`；admin 写路径统一到 `/api/admin/site-config(/:key)`；明确 Stage 2 owner 校验降级为"有效 Token" | Stage 2 Day 2 进入 Gate B |
