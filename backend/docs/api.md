# API 接口文档

> Stage 1 最小底座接口，后续 Stage 2 起可接入 Swagger 自动生成。

## 基础信息

- Base URL: `http://localhost:8080`
- Content-Type: `application/json`
- 认证方式: Bearer Token（通过 `Authorization: Bearer <token>` header 传递）

## 统一响应结构

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "traceId": "uuid"
}
```

### 错误码

| code | HTTP | 说明 |
|------|------|------|
| 0 | 200 | 成功 |
| 40001 | 400 | 参数错误 |
| 40100 | 401 | 未登录或 Token 失效 |
| 40300 | 403 | 无权限 |
| 40400 | 404 | 资源不存在 |
| 50000 | 500 | 服务端错误 |

---

## 公开接口

### GET /api/health

健康检查。

**请求**: 无参数

**响应示例**:

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "status": "up",
    "time": "2026-05-17T10:00:00+08:00"
  },
  "traceId": "ce84fb78-d508-4fd3-b47f-bca7f0637a59"
}
```

---

### POST /api/auth/login

登录并获取 JWT Token。

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例**:

```json
{
  "username": "owner",
  "password": "owner123"
}
```

**成功响应**:

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 86400,
    "user": {
      "username": "owner",
      "role": "owner"
    }
  },
  "traceId": "ce84fb78-d508-4fd3-b47f-bca7f0637a59"
}
```

**错误响应**:

| 场景 | HTTP | code | message |
|------|------|------|---------|
| 参数缺失 | 400 | 40001 | 用户名和密码不能为空 |
| 凭据错误 | 401 | 40100 | 用户名或密码错误 |

---

## 受保护接口

> 以下接口需在请求 header 中携带 `Authorization: Bearer <token>`，否则返回 401。

### GET /api/auth/me

获取当前登录用户信息。

**请求**: 无参数（需 Bearer Token）

**成功响应**:

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "username": "owner",
    "role": "owner"
  },
  "traceId": "fbcde3a1-4fb8-4ec4-a6d4-e7afc0ddd97f"
}
```

**错误响应**:

| 场景 | HTTP | code | message |
|------|------|------|---------|
| 未携带 Token | 401 | 40100 | 未登录或Token失效 |
| Token 无效/过期 | 401 | 40100 | 未登录或Token失效 |

---

## Stage 2 业务接口

### GET /api/public/profile

获取 owner 公开个人信息。

**请求**：无参数。

**成功响应 data**：

```json
{
  "id": 1,
  "displayName": "Yixi Jiang",
  "headline": "Frontend x AI",
  "bio": "...",
  "avatarUrl": "https://...",
  "currentFocus": "前端 Agent",
  "location": "Beijing",
  "visibility": "public"
}
```

**错误响应**：

| 场景 | HTTP | code | message |
|------|------|------|---------|
| 未配置 profile | 404 | 40400 | profile 尚未配置 |
| DB 异常 | 500 | 50000 | 查询失败 |

### GET /api/admin/profile

后台获取个人信息（结构同 public，鉴权升级为 Bearer Token）。

| 场景 | HTTP | code |
|------|------|------|
| 未携带 Token | 401 | 40100 |
| 未配置 profile | 404 | 40400 |

### PUT /api/admin/profile

按 owner_id upsert 个人信息（**全量替换语义**：未传字段会被清空，前端编辑前须先 GET 全量再回传）。

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| displayName  | string | 是 | 1-64 字 |
| headline     | string | 否 | <=255 字 |
| bio          | string | 否 | <=10000 字 |
| avatarUrl    | string | 否 | <=512 字 |
| currentFocus | string | 否 | <=255 字 |
| location     | string | 否 | <=128 字 |
| visibility   | string | 否 | `public`/`private`/`hidden`，默认 `public` |

**成功响应 data**：写入后的完整 profile（同 GET）。

**错误响应**：

| 场景 | HTTP | code | message |
|------|------|------|---------|
| displayName 缺失 | 400 | 40001 | displayName 不能为空 |
| visibility 非法 | 400 | 40001 | visibility 取值非法 |
| 未携带 Token | 401 | 40100 | 未登录或Token失效 |
| DB 异常 | 500 | 50000 | 保存失败 |

---

### GET /api/public/contacts

获取 owner 公开联系方式列表（仅 `is_public=1`，按 `sort_order ASC, id ASC` 排序）。

**请求**：无参数。

**成功响应 data**（空时返回 `[]`）：

```json
[
  { "id": 1, "platform": "github", "label": "GitHub", "url": "https://github.com/jiangyixi", "icon": "github", "sortOrder": 1 }
]
```

### GET /api/admin/contacts

后台获取全量联系方式（含隐藏项，额外含 `isPublic` 字段）。需 Bearer Token。

### POST /api/admin/contacts

新增联系方式。需 Bearer Token。

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| platform  | string | 是 | <=64 字 |
| label     | string | 否 | <=128 字 |
| url       | string | 否 | <=512 字 |
| icon      | string | 否 | <=64 字 |
| isPublic  | bool   | 否 | 默认 true |
| sortOrder | int    | 否 | 默认 0 |

**成功响应 data**：新建的完整 contact 对象（含 `isPublic`）。

### PUT /api/admin/contacts/:id

更新联系方式。需 Bearer Token。请求体字段同 POST（全部可选，未传字段保留 platform 原值，其余字段全量替换）。

| 场景 | HTTP | code |
|------|------|------|
| id 不存在 | 404 | 40400 |

### DELETE /api/admin/contacts/:id

软删联系方式（写 `deleted_at`）。需 Bearer Token。

**成功响应 data**：`{ "id": 1 }`

| 场景 | HTTP | code |
|------|------|------|
| id 不存在 | 404 | 40400 |

---

### GET /api/public/skills

获取技能列表（仅 `is_public=1`，按 `category ASC, sort_order ASC, id ASC` 排序）。

**成功响应 data**：
```json
[{ "id": 5, "name": "React", "category": "frontend", "proficiencyLevel": "熟练", "description": "...", "sortOrder": 1 }]
```

### GET /api/admin/skills

后台获取全量技能（含隐藏项，额外含 `isPublic`）。需 Bearer Token。

### POST /api/admin/skills

新增技能。需 Bearer Token。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name             | string | 是 | <=64 字 |
| category         | string | 否 | <=64 字 |
| proficiencyLevel | string | 否 | 熟练/掌握/了解 |
| description      | string | 否 | <=512 字 |
| isPublic         | bool   | 否 | 默认 true |
| sortOrder        | int    | 否 | 默认 0 |

### PUT /api/admin/skills/:id

更新技能。需 Bearer Token。字段同 POST（name 传入非空则更新，其余全量覆盖）。`40400` 当 id 不存在。

### DELETE /api/admin/skills/:id

软删技能。需 Bearer Token。返回 `{"id": xxx}`。`40400` 当 id 不存在。

---

### GET /api/public/about/timeline

获取公开时间线列表（仅 `is_public=1`，按 `sort_order ASC, id ASC` 排序）。

**成功响应 data**：
```json
[
  {
    "id": 1,
    "entryId": "education-hnust",
    "type": "education",
    "title": "本科",
    "organization": "湖南科技大学",
    "location": "湖南湘潭",
    "startDate": "2021-09-01",
    "endDate": "2027-06-30",
    "description": "数据科学与大数据技术专业...",
    "achievements": ["系统学习计算机基础课程"],
    "technologies": ["数据科学", "大数据技术"],
    "sortOrder": 0
  }
]
```

### GET /api/admin/about/timeline

后台获取全量时间线（含隐藏项，额外含 `isPublic`）。需 Bearer Token。

### POST /api/admin/about/timeline

新增时间线条目。需 Bearer Token。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| entryId      | string   | 是 | <=128 字 |
| type         | string   | 是 | `education` / `work` |
| title        | string   | 是 | <=128 字 |
| organization | string   | 是 | <=128 字 |
| location     | string   | 否 | <=128 字 |
| startDate    | string   | 是 | `YYYY-MM-DD` |
| endDate      | string   | 否 | `YYYY-MM-DD`，可传 `null` |
| description  | string   | 否 | <=5000 字 |
| achievements | string[] | 否 | 默认 `[]` |
| technologies | string[] | 否 | 默认 `[]` |
| isPublic     | bool     | 否 | 默认 true |
| sortOrder    | int      | 否 | 默认 0 |

### PUT /api/admin/about/timeline/:id

更新时间线条目。需 Bearer Token。字段同 POST，全部可选；`endDate` 支持传 `null` 清空。`40400` 当 id 不存在。

### DELETE /api/admin/about/timeline/:id

软删时间线条目。需 Bearer Token。返回 `{"id": xxx}`。`40400` 当 id 不存在。

---

### GET /api/public/site-config

获取站点配置全集（K-V 数组，按 `config_key ASC` 排序）。

**成功响应 data**：
```json
[{ "key": "site.title", "value": "Yixi Jiang", "valueType": "string", "description": "站点标题" }]
```

### GET /api/admin/site-config

后台获取站点配置（结构同 public）。需 Bearer Token。

### PUT /api/admin/site-config/:key

按 key upsert 单条配置。需 Bearer Token。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| value       | string | 是 | 配置值 |
| valueType   | string | 否 | string/json/boolean/number，不传则沿用已有值或默认 string |
| description | string | 否 | <=255 字 |

**成功响应 data**：写入后的完整 config 对象。

---

## 快速验证

```bash
# 健康检查
curl http://localhost:8080/api/health

# 登录
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"owner","password":"owner123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_token'])")

# 访问受保护接口
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/auth/me

# 无 token 访问（应返回 401）
curl http://localhost:8080/api/auth/me

# Stage 2: 公开 profile（首次未配置返回 40400）
curl http://localhost:8080/api/public/profile

# Stage 2: 写入 profile（需 Bearer Token）
curl -X PUT http://localhost:8080/api/admin/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Yixi Jiang","headline":"Frontend x AI Agent","visibility":"public"}'

# Stage 2: 灌入联系方式种子数据（在 backend/ 目录下）
# mysql -u pp_app -p personal_profile < migrations/seed_001_demo.sql

# Stage 2: 公开联系方式列表（无 token）
curl http://localhost:8080/api/public/contacts

# Stage 2: 后台联系方式列表（含隐藏项）
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/admin/contacts

# Stage 2: 公开时间线列表（无 token）
curl http://localhost:8080/api/public/about/timeline

# Stage 2: 后台时间线列表（含隐藏项）
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/admin/about/timeline

# Stage 2: 新增时间线条目
curl -X POST http://localhost:8080/api/admin/about/timeline \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entryId":"work-demo","type":"work","title":"Demo","organization":"Example Org","startDate":"2026-01-01","endDate":null,"achievements":[],"technologies":["Go"],"isPublic":true,"sortOrder":99}'

# Stage 2: 新增联系方式
curl -X POST http://localhost:8080/api/admin/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform":"twitter","label":"X (Twitter)","url":"https://x.com/jiangyixi","icon":"twitter"}'

# Stage 2: 更新联系方式（id 替换为实际值）
curl -X PUT http://localhost:8080/api/admin/contacts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform":"github","label":"GitHub","url":"https://github.com/jiangyixi","icon":"github","isPublic":true,"sortOrder":1}'

# Stage 2: 删除联系方式（软删）
curl -X DELETE http://localhost:8080/api/admin/contacts/4 \
  -H "Authorization: Bearer $TOKEN"

# Stage 2: 无 token 访问 admin 接口（应返回 401）
curl http://localhost:8080/api/admin/contacts
```
