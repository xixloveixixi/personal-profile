---
name: next-admin-crud-ui
description: "personal-profile 项目 Next.js 后台管理 CRUD UI 生成工作流。当用户说「给这张表生成后台页面」「做 admin CRUD UI」「基于后端交接清单生成前端」「为 xxx 资源加后台管理页面」「Table/Form/Modal 管理页」时，必须使用此 Skill。该 Skill 消费 go-table-crud 输出的前端后台 UI 交接清单，按 Next.js App Router + Ant Design + 现有 admin auth/API 模式实现页面，并完成登录态、CORS、CRUD 浏览器 Gate E 验收清单。"
---

# next-admin-crud-ui

为 personal-profile 项目基于已冻结、已验收的后端 CRUD 接口生成 Next.js 后台管理 UI。此 skill 只负责前端后台页面，不修改 Go 后端接口契约；如果接口或字段不清楚，回到 `go-table-crud` 或契约文档补齐，不在前端猜测。

## 硬性前置条件（缺一不可）

开始写前端代码前，确认以下信息已存在：

1. **后端交接清单**：来自 `go-table-crud` Step 9，包含 API、字段、特殊语义、验收点
2. **接口契约**：`docs/dev-harness/api-contract.md` 中目标资源 admin API 已冻结
3. **后端验收**：后端 `go build ./...` 通过，关键 admin API curl 验收通过
4. **现有后台骨架**：项目已有 `/admin/login`、`/admin/*` layout、`lib/api/admin.ts` 与 auth store

如果缺少后端交接清单，但契约和后端代码已经存在，可以先读取 `api-contract.md`、`backend/docs/api.md`、现有 handler 和 `lib/api/admin.ts` 反推一版清单；反推内容必须标注为“待确认”，不要擅自扩大接口语义。

---

## 执行步骤

按以下顺序推进，保持小闭环：先类型/API，再页面，再验证。

### Step 1：读取前端上下文

必须读取：
- `docs/dev-harness/stage-plan.md`
- `docs/dev-harness/stage-plan-frontend.md`
- `docs/dev-harness/progress-log.md`
- `docs/dev-harness/pitfalls.md`
- `lib/api/admin.ts`
- `lib/stores/auth.ts`
- `app/admin/layout.tsx`
- 一个最相近的现有后台页，例如 `app/admin/contacts/page.tsx`、`app/admin/skills/page.tsx`、`app/admin/site-config/page.tsx` 或 `app/admin/profile/page.tsx`

理解当前模式：
- admin API 如何拼接 `NEXT_PUBLIC_API_BASE_URL`
- Bearer token 如何从 Zustand/cookie 获取
- Ant Design Table/Form/Modal/Popconfirm/message 的现有写法
- `/admin` 路由受 middleware/cookie 保护的方式

### Step 2：解析后端交接清单

从交接清单提取：
- 资源名和页面路径：`/admin/<resource>`
- API 形态：标准 CRUD、单条 upsert、Key-Value upsert、只读列表
- 字段：JSON key、类型、必填、枚举、默认值、可编辑性、Table 展示性
- 特殊语义：`isPublic`、`sortOrder`、软删、owner 过滤、readonly、危险删除
- 浏览器验收点：登录态、CORS、刷新保持、CRUD 或 upsert 操作

如果交接清单和契约冲突，以 `api-contract.md` 和实际后端 handler 为准，并把冲突反馈给用户。

### Step 3：补齐 admin API client

文件路径：`lib/api/admin.ts`

按现有风格新增或复用：
- TypeScript DTO 类型：响应 DTO、创建请求、更新请求；字段命名保持 camelCase
- list/detail/create/update/delete 或 get/upsert 方法
- 标准 CRUD 使用资源复数路径，如 `/api/admin/<resource>` 与 `/api/admin/<resource>/:id`
- 单条记录或 Key-Value 表遵循后端契约，不强行套 `id`
- 使用现有 `adminFetch`/鉴权封装，不重复写 fetch/token 逻辑
- 保持零值可提交：数字 0、布尔 false、空字符串的处理不要被误删

不要修改无关 API；如果需要重构 `adminFetch`，只做最小改动，并确认不会破坏现有后台页。

### Step 4：创建后台页面

文件路径：`app/admin/<resource>/page.tsx`

按资源形态选择页面模式：
- **标准 CRUD**：Table + 新增按钮 + Modal Form + 编辑 + Popconfirm 删除
- **单条 upsert**：单页 Form + 保存按钮，不使用 Table/Modal
- **Key-Value upsert**：Table + 编辑 Modal，不做删除，key 通常不可编辑
- **只读资源**：Table + 刷新/筛选，不出现新增、编辑、删除按钮

实现要求：
- 页面是 Client Component：顶部加 `'use client'`
- 初次进入加载列表/详情，loading 状态清晰
- 表单字段与交接清单一致：Input/TextArea/Select/Switch/InputNumber 等控件按字段类型选择
- 必填校验、枚举选项、长度限制与契约一致
- 创建/编辑成功后刷新数据并关闭弹窗或保留在表单页
- 删除使用 `Popconfirm`，危险操作文案明确
- 错误处理沿用项目现有 message 模式，不吞掉异常
- 不移除看似多余的 JSX 包装，尤其在 children 可能被 `cloneElement` 或 Antd 组件处理时保持原结构

### Step 5：接入后台导航

如果现有后台导航/菜单集中配置，按现有模式加入新入口；如果后台菜单直接写在 `app/admin/layout.tsx`，只追加目标资源菜单项，不重排现有菜单。

检查：
- 菜单路径与页面路径一致
- 菜单文案与资源名一致
- 不影响 `/admin/login` 和已有 4 个后台页

### Step 6：本地验证

优先运行最小验证，再扩大范围：

```bash
npm run type-check
npm run build
```

如果项目已存在 lint 且当前改动涉及明显 lint 风险，可运行：

```bash
npm run lint
```

验证失败时只修复与本次前端页面相关的问题；已有无关 warning 记录在最终说明中即可。

### Step 7：浏览器 Gate E 验收清单

后端和前端服务启动后，要求或协助用户完成浏览器验证。至少覆盖：
- `/admin/login` 登录成功后跳转 `/admin/dashboard`
- 未登录访问新页面 `/admin/<resource>` 自动跳 `/admin/login`
- 登录后刷新 `/admin/<resource>` 登录态保持，API 带 Bearer token
- `localhost:3000-3009` 任一开发端口访问后端不触发 CORS preflight 错误
- 标准 CRUD：列表、新增、编辑、删除均成功，刷新后数据符合预期
- 单条 upsert：加载、修改、保存、刷新后保持
- Key-Value upsert：列表、编辑、保存、刷新后保持
- 只读资源：列表加载成功，无写入按钮

浏览器验证是前端后台 UI 的关键验收，不要只用 curl/build 代替。

### Step 8：更新 Harness 文档

完成并通过验证后，按当前阶段要求更新：
- `docs/dev-harness/progress-log.md`：记录实现内容、验证命令、浏览器验收状态
- `docs/dev-harness/pitfalls.md`：仅记录本次出现且可复用的踩坑，不写流水账
- `docs/dev-harness/stage-plan-frontend.md`：只在 Gate E/F 确认后更新对应勾选项；Gate C 不代勾

---

## 产出物检查（每个后台资源完成后输出）

1. **文件变更清单**：
   - 修改：`lib/api/admin.ts`（如新增 API client）
   - 新增/修改：`app/admin/<resource>/page.tsx`
   - 修改：`app/admin/layout.tsx` 或菜单配置（如新增入口）
   - 修改：Harness 文档（如进入 Gate F）

2. **验证结果**：
   - `npm run type-check` 结果
   - `npm run build` 结果
   - `npm run lint` 结果（如运行）

3. **浏览器 Gate E 结果**：列表格，每行含「场景 | 预期 | 实际 | 状态 ✅/❌」。未实测的项目必须标注“待用户手动验证”。

4. **后端交接反馈**：如果发现 API/字段/错误码与交接清单不一致，列出差异并建议回写到 `api-contract.md` 或后端 skill。

---

## 常见页面模式

**标准 CRUD：** 适合 contacts/skills/project-tag 这类多记录资源。Table 展示关键字段，Modal Form 负责新增和编辑，删除必须二次确认。

**单条 upsert：** 适合 profile/about 这类单记录资源。页面直接是 Form，保存按钮调用 PUT/upsert，不提供删除。

**Key-Value upsert：** 适合 site-config。Table 展示 key/value/type/description，编辑时 key 通常只读，value 根据 type 做基础校验。

**只读列表：** 适合日志、统计或外部同步数据。不要为了统一 UI 添加无后端支持的写按钮。

## 与 go-table-crud 的边界

- `go-table-crud` 负责冻结契约、实现 Go 后端、curl 验收、输出前端交接清单。
- `next-admin-crud-ui` 负责消费交接清单、实现 Next.js 后台页面、浏览器 Gate E 验收。
- 如果前端实现时发现契约缺字段或语义不清，暂停前端扩展，先补齐后端交接清单或契约。
