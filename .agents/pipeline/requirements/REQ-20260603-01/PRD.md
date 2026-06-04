# PRD: 健康检查统计 API

## 需求 ID
REQ-20260603-01

## 背景与目标
为了监控系统运行状态和验证 6-Agent 开发流水线，需要新增健康检查统计功能。该功能记录每次健康检查接口被调用的时间，并提供管理接口查询调用频次，帮助运维了解系统被探活的情况。

## 用户故事
作为系统管理员，我希望查看健康检查接口的调用统计，以便了解监控系统的探活频率和系统可用性。

## 功能范围

### 必须实现（P0）
- [ ] 每次 `/api/health` 被调用时记录调用时间到数据库
- [ ] 提供 admin 接口 `GET /api/admin/health-stats` 查询最近 24 小时的调用次数

### 可选实现（P1）
- [ ] 支持查询指定时间范围的统计
- [ ] 返回按小时分组的调用次数分布

### 不做
- 不做实时推送/WebSocket 通知
- 不做历史数据清理（本期不考虑数据量过大问题）
- 不做前端可视化页面

## 接口设计（草案）

### 后端 API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查（现有，需增加记录逻辑） |
| GET | /api/admin/health-stats | 查询最近 24 小时调用次数（需鉴权） |

### 请求/响应示例

**GET /api/admin/health-stats**
```json
// Response
{
  "code": 0,
  "data": {
    "total_count": 1440,
    "start_time": "2026-06-02T11:15:00Z",
    "end_time": "2026-06-03T11:15:00Z"
  }
}
```

### 数据模型
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 主键 |
| called_at | timestamp | 调用时间 |
| created_at | timestamp | 记录创建时间 |

## 验收标准
1. 调用 `GET /api/health` 后，数据库中新增一条记录
2. 调用 `GET /api/admin/health-stats` 返回最近 24 小时的调用总次数
3. admin 接口需要登录态鉴权，未登录返回 401

## 技术约束
- 遵循 `docs/dev-harness/` 契约冻结流程
- 后端使用 Go + Gin + GORM
- 接口契约需先在 `docs/dev-harness/api-contract.md` 冻结
- 表结构需先在 `docs/dev-harness/schema.md` 冻结
