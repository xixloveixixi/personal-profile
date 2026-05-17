---
alwaysApply: false
description: 项目的 API 规范，覆盖 Next.js Route Handlers、Go 后端调用封装、统一响应、函数命名与错误处理。当新增或修改接口时读取此规则。
---

# API 规范

项目存在两类「接口」，必须分清：

1. **Next.js Route Handlers**：位于 `app/api/<feature>/route.ts`，对前端暴露，可对接 Notion、Supabase、AI SDK、Go 后端。
2. **Go 后端 REST API**：独立服务（处于 Harness Stage 1），由 Next.js 通过 `lib/` 下的封装调用。

## 路由命名（NON-NEGOTIABLE）

- 公开数据：`app/api/public/<feature>/route.ts`，对应 Go `/api/public/*`。
- 私有学习数据：`app/api/private/<feature>/route.ts`，对应 Go `/api/private/*`，必须带 JWT。
- AI 流式：`app/api/chat-agent-stream/route.ts` 等保持现状。
- 博客：继续走 `lib/notion.ts`，**禁止**将博客 CRUD 落到 Go 或 Route Handler。

## 统一响应（按 SDD 9.1）

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "traceId": "20260517120000-xxxx"
}
```

分页响应：

```json
{
  "code": 0,
  "message": "success",
  "data": { "list": [], "pageNo": 1, "pageSize": 10, "total": 100 }
}
```

常见错误码：`40001` 参数错误、`40100` 未登录、`40300` 无权限、`40400` 不存在、`40900` 状态冲突、`50000` 服务端错误。

## 调用封装

- 所有外部调用（Go API / Notion / Supabase / LLM）统一在 `lib/<feature>.ts` 内封装，组件层禁止直接 `fetch` 第三方。
- 私有接口请求必须携带 `Authorization: Bearer <token>`，Token 由 Zustand `useAuthStore` 维护。
- 入参与返回类型用 TS 接口 + `zod` schema 双重校验，schema 与封装函数同文件或相邻文件。
- 私有接口必须按 owner 维度查询，禁止接受外部传入的 `userId`。

## 接口函数命名（NON-NEGOTIABLE）

| 操作 | 命名规则 | 示例 |
|------|----------|------|
| 获取列表 | `getXxxList` | `getProjectList` |
| 获取详情 | `getXxxDetail` | `getProjectDetail` |
| 创建 | `createXxx` | `createGoal` |
| 更新 | `updateXxx` | `updateGoal` |
| 删除 | `deleteXxx` | `deleteGoal` |

**禁止**使用 `fetch` 前缀或匈牙利命名法。

## 错误处理（NON-NEGOTIABLE）

- 统一在 `lib/` 封装层处理 HTTP 状态码与 `code` 字段映射，并抛出业务错误或返回兜底。
- 业务代码只关心成功逻辑与业务校验，**禁止**重复 `message.error` / `toast.error` 提示同一个 HTTP 错误。
- 表单校验错误、业务逻辑错误（如「目标已完成不可修改」）可在业务层提示。
- 成功反馈（如「保存成功」）由业务层负责。
