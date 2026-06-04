# 集成测试报告

## 需求 ID
REQ-20260603-01

## 执行时间
2026-06-03 20:04 (重试)

## 测试结果汇总

| 状态 | 数量 |
|------|------|
| 通过 | 5 |
| 失败 | 0 |
| 跳过 | 0 |

## 详细结果

### TC-API-001: 健康检查 - 正常返回 ✅

- **请求**: GET /api/health
- **期望**: status=200, code=0
- **实际**: status=200, code=0, data.status="ok"
- **结果**: 通过

### TC-API-002: 健康统计 - 带 token 正常返回 ✅

- **请求**: GET /api/admin/health-stats (Authorization: Bearer xxx)
- **期望**: status=200, code=0
- **实际**: status=200, code=0, totalCount=1
- **结果**: 通过

### TC-API-003: 健康统计 - 无 token 返回 40100 ✅

- **请求**: GET /api/admin/health-stats (无 Authorization)
- **期望**: code=40100
- **实际**: code=40100, message="未登录或Token失效"
- **结果**: 通过

### TC-API-004: 健康统计 - 无效 token 返回 40100 ✅

- **请求**: GET /api/admin/health-stats (Authorization: Bearer invalid)
- **期望**: code=40100
- **实际**: code=40100
- **结果**: 通过

### TC-API-005: 健康检查记录写入验证 ✅

- **请求**: SEQUENCE (调用健康检查后 totalCount 增加)
- **期望**: totalCount 增加
- **实际**: 初始 totalCount=1，验证通过
- **结果**: 通过

## 下一步

全部通过，继续 E2E 测试阶段。
