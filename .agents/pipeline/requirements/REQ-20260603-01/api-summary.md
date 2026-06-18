# API 实现摘要

## 需求 ID
REQ-20260603-01

## 已实现接口

| 方法 | 路径 | Handler | 说明 |
|------|------|---------|------|
| GET | /api/public/about/timeline | handler.(*AboutTimelineHandler).GetPublicTimeline | 获取公开时间线列表 |
| GET | /api/admin/about/timeline | handler.(*AboutTimelineHandler).GetAdminTimeline | 获取后台时间线列表 |
| POST | /api/admin/about/timeline | handler.(*AboutTimelineHandler).CreateTimeline | 新增时间线条目 |
| PUT | /api/admin/about/timeline/:id | handler.(*AboutTimelineHandler).UpdateTimeline | 更新时间线条目 |
| DELETE | /api/admin/about/timeline/:id | handler.(*AboutTimelineHandler).DeleteTimeline | 删除时间线条目 |

## 数据模型

| 表名 | Model | 说明 |
|------|-------|------|
| about_timeline | model.AboutTimeline | About 时间线，含 achievements/technologies JSON 数组 |

## 文件变更
- `backend/internal/model/about_timeline.go` — 新增
- `backend/internal/repository/about_timeline.go` — 新增
- `backend/internal/handler/about_timeline.go` — 新增
- `backend/internal/router/router.go` — 修改
- `backend/migrations/20260613120000_about_timeline.sql` — 新增
- `backend/migrations/seed_005_about_timeline.sql` — 新增
- `backend/docs/api.md` — 修改

## 验证命令
```bash
curl -X GET http://localhost:8080/api/public/about/timeline
```
