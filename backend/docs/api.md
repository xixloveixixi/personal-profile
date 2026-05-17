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
```
