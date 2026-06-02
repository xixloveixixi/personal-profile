---
name: go-table-crud
description: "personal-profile 项目 Go 后端新增一张表的完整 CRUD 实现工作流。当用户说「为 xxx 表实现后端」「落地这张表的接口」「新增 model/repo/handler」「这张表需要 CRUD」时，必须使用此 Skill。该 Skill 按固定顺序创建 model → repository → handler → 路由注册 → 种子 SQL → curl 验收，并在后端闭环完成后输出前端后台 UI 交接清单；如果用户还要生成后台页面，应把交接清单交给 next-admin-crud-ui skill，而不是在本 skill 中直接写前端 UI。"
---

# go-table-crud

为 personal-profile 项目新增一张表的 Go 后端 CRUD，从读取契约到 curl 验收的完整工作流。此 skill 只负责后端闭环；后端验收完成后，输出一份可直接交给 `next-admin-crud-ui` 使用的前端交接清单。

## 硬性前置条件（缺一不可）

在开始任何代码之前，确认以下两项都已完成：

1. **`docs/dev-harness/schema.md`** 中包含目标表的完整 DDL（字段、类型、索引、注释）
2. **`docs/dev-harness/api-contract.md`** 中包含目标表的所有接口契约（路径、方法、请求体、响应、错误码）

如果任一项缺失，**停下来**，告知用户需要先冻结对应文档，不要猜测字段或接口。这不是流程上的繁文缛节——接口一旦冻结再改会造成 migration 和 handler 的连锁返工。

---

## 执行步骤

按以下顺序推进，每步完成后确认再进入下一步。

### Step 1：读取契约

同时读取：
- `docs/dev-harness/schema.md` 中目标表的 DDL
- `docs/dev-harness/api-contract.md` 中目标表的所有接口

提取关键信息：
- 表名（用于 `TableName()`）
- 字段列表 + 类型（用于 model）
- 是否有 `owner_id`、`is_public`、`deleted_at` 字段（决定 repository 方法集）
- 接口清单：路径、HTTP 方法、是否需要 Bearer Token

### Step 2：创建 model

文件路径：`backend/internal/model/<table_name>.go`

遵循以下规范（参考已有的 `public_contact.go`）：
- `package model`
- struct 字段用 `gorm:"column:xxx;..."` tag 对齐 DDL
- 每个字段的 not null / default 约束都要在 tag 中体现
- 软删除字段用 `gorm.DeletedAt`（不是 `*time.Time`）
- `TableName()` 方法返回准确的单数表名字符串
- 时间字段用 `time.Time`，主键用 `uint64`

### Step 3：创建 repository

文件路径：`backend/internal/repository/<table_name>.go`

遵循以下规范（参考已有的 `public_contact.go`）：
- `package repository`
- Struct 只持有 `db *gorm.DB`，不持有全局状态
- 构造函数 `NewXxxRepo(db *gorm.DB) *XxxRepo`
- `ErrNotFound` 哨兵只在 `public_profile.go` 中定义一次，其他文件直接用，不要重复 `var ErrNotFound = errors.New(...)`
- 方法集根据表特征决定：
  - 有 `is_public` 字段 → 提供 `FindPublicByOwnerID`（过滤 is_public=1）和 `FindAllByOwnerID`（全量）
  - 无 `is_public` 字段 → 只提供 `FindAllByOwnerID` 或 `FindByOwnerID`
  - 有 `owner_id` 字段 → 所有查询加 `owner_id = ?` 过滤
  - 无 `owner_id`（如 site_config）→ 按其他唯一键（如 config_key）查询
- `FindByID` 需将 `gorm.ErrRecordNotFound` 转换为 `ErrNotFound` 哨兵
- `Update` 用 `db.Save()` 做全量替换，不要用 `db.Updates()`（会跳过零值）
- `Delete` 用 `db.Delete(&Model{}, id)` 触发 GORM 软删（`deleted_at` 自动填充）

### Step 4：创建 handler

文件路径：`backend/internal/handler/<table_name>.go`

遵循以下规范（参考已有的 `contact.go`）：
- `package handler`
- Struct 只持有 repo，通过构造函数注入：`NewXxxHandler(repo *XxxRepo) *XxxHandler`
- **handler 不直接调用 GORM**，所有 DB 操作必须通过 repository 方法
- 双 DTO 模式（如果接口有公开/admin 区分）：
  - `xxxPublicDTO`：不含 `isPublic` 等内部字段
  - `xxxAdminDTO`：含 `isPublic`，JSON key 用 camelCase
- 写请求体中的可选布尔字段用 `*bool` 指针（区分"未传"和"传 false"）
- 空列表返回 `[]`，不返回 `null`：`make([]DTO, 0, len(items))`
- 错误码规范：
  - 参数错误：HTTP 400 + code 40001
  - 记录不存在：HTTP 404 + code 40400
  - 服务器内部错误：HTTP 500 + code 50000
  - 未登录/token 无效：HTTP 401 + code 40100（由 middleware 处理，handler 不用管）
- `config.OwnerID` 是常量 1，所有 ownerID 都从这里取，不要硬编码 `1`

### Step 5：注册路由

文件路径：`backend/internal/router/router.go`

在 `Setup(r, db)` 函数的 Stage 2 业务路由区块中：
1. 实例化 repo：`xxxRepo := repository.NewXxxRepo(db)`
2. 实例化 handler：`xxxHandler := handler.NewXxxHandler(xxxRepo)`
3. 公开读接口注册到 `public` 路由组（`/api/public/...`）
4. 写接口和管理读接口注册到 `admin` 路由组（已挂载 `middleware.Auth()`，无需重复加中间件）

### Step 6：添加种子数据

文件路径：`backend/migrations/seed_001_demo.sql`

在文件末尾追加新表的种子数据：
- 格式：先 `DELETE FROM <table> WHERE <条件>;` 清空，再 `INSERT INTO`
- 必须幂等：同一 SQL 重复执行结果相同
- 至少 2-3 条真实感的示例数据
- 如果表有 `created_at`/`updated_at`，在 INSERT 中显式给 NOW()

### Step 7：更新接口文档

文件路径：`backend/docs/api.md`

追加新表的接口段落，每个接口包含：
- 路径 + 方法
- 鉴权要求
- 请求体示例（如适用）
- 响应示例（成功 + 常见错误）
- 可直接运行的 curl 命令

### Step 8：编译 + 验收

**编译：**
```bash
cd backend && go build ./...
```
编译必须零错误才能继续。如果报错，先修复再验收。

**curl 验收：**
对照 `api-contract.md` 中该表的接口，逐一跑 curl。最低限度要覆盖：
- 公开 GET（无 token）
- admin GET（有 token）→ 如需 token 先跑 `POST /api/auth/login`
- POST 创建（有 token）
- PUT/:id 更新（有 token，先存在的 id）
- DELETE/:id 软删（有 token，验证删后公开 GET 不可见）
- 无 token 访问 admin 接口 → 必须返回 40100

### Step 9：输出前端后台 UI 交接清单

后端 CRUD 验收通过后，不直接写前端页面，而是输出给 `next-admin-crud-ui` 使用的交接清单。交接清单要足够具体，让前端 skill 不需要反向猜测接口语义。

交接清单必须包含：
- **资源与路由**：资源名、后台页面建议路径 `/admin/<resource>`、菜单文案、是否需要公开页联动
- **API 清单**：每个 admin API 的方法、路径、鉴权、请求体、响应体、错误码；标注 `GET/POST/PUT/DELETE` 或 `upsert/readonly` 变体
- **字段契约**：字段名、JSON key、类型、是否必填、长度/枚举/默认值、是否可编辑、是否展示在 Table
- **字段展示建议**：Table 列、Form 控件类型（Input/TextArea/Select/Switch/InputNumber）、排序字段、状态字段、危险操作
- **特殊语义**：`owner_id` 过滤、`isPublic` 发布态、`sortOrder` 排序、软删、单条记录、Key-Value、只读、upsert
- **验收数据**：curl 验收通过的样例 token 获取方式、可复用的示例请求体、至少 1 条可编辑记录的识别方式
- **前端 Gate E 验收点**：登录成功跳转、未登录跳转、刷新保持、CORS preflight、列表/新增/编辑/删除或 upsert 浏览器实测

如果用户要求继续生成前端后台页面，明确建议下一步调用 `next-admin-crud-ui`，并把这份交接清单作为输入。

---

## 产出物检查（每张表完成后输出）

1. **文件变更清单**：
   - 新增：`internal/model/<table>.go`
   - 新增：`internal/repository/<table>.go`
   - 新增：`internal/handler/<table>.go`
   - 修改：`internal/router/router.go`
   - 修改：`migrations/seed_001_demo.sql`
   - 修改：`docs/api.md`

2. **编译结果**：`go build ./...` exit code 0

3. **curl 验收结果**：列表格，每行含「接口 | 预期 | 实际 | 状态 ✅/❌」

4. **前端后台 UI 交接清单**：按 Step 9 输出完整清单；如果该资源不需要后台 UI，说明原因。

---

## 常见变体

**只读表（无写接口）：** 跳过 Step 4 中的 POST/PUT/DELETE handler，repo 只需 Find 方法；Step 9 标注前端只能做列表/详情，不生成写入表单。

**Key-Value 类型表（如 site_config）：** 没有 owner_id，没有 is_public，repository 用 Upsert 替代 Create+Update，路由用 `/:key` 而不是 `/:id`；Step 9 标注前端按 key 编辑，不做删除。

**单条记录表（如 public_profile）：** 没有 id-based 的增删，只有 GET + PUT（全量替换），Upsert 实现（先 First 后 Create/Save）；Step 9 标注前端使用单页 Form，不使用 Table + Modal。

**布尔字段"传空保留原值"：** 参考 contact 的 `platform` 字段处理方式——用 `strings.TrimSpace` 判空，非空时才覆盖；Step 9 标注前端对应字段是否允许留空。
