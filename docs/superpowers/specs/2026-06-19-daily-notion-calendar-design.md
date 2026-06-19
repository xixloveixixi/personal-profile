# Daily Notion 日历设计

## 背景

站点需要新增一个轻量的「碎碎念」模块，用来记录每天的短想法、牢骚或情绪片段。这个内容会高频发布，写作入口应该足够自然，因此数据源选择 Notion，而不是 Go/MySQL 后台 CRUD。

本设计新增一个公开的 `Daily` 页面，数据来自独立的 Notion Daily 数据库。该设计不改动现有 Notion 博客数据库，也不迁移博客内容。

## 目标

- 新增公开页面 `/daily`，展示形式为「日历 + 当日详情」。
- 使用独立 Notion Daily 数据库作为唯一内容源。
- 内容默认公开，同时支持通过 Notion checkbox 隐藏单条记录。
- 第一版约束为每天最多一条记录。
- 正文从 Notion 页面正文读取和渲染。
- 第一版只做纯文字内容，不做图片、评论、点赞、标签筛选。

## 非目标

- 不新增 Go backend handler、GORM model、migration 或 MySQL 表。
- 不做 Daily 的后台 CRUD UI。
- 不复用现有博客 Notion 数据库。
- 第一版不做 RSS、搜索、标签筛选或归档页。
- 不改变现有 Notion 博客同步逻辑。

## 用户体验

公开导航新增 `Daily`，指向 `/daily`。

`/daily` 页面使用「日历 + 详情」布局：

- 日历展示当前选中月份。
- 有公开 Daily 记录的日期需要有可识别标记。
- 页面默认选中最近一条公开记录所在日期。
- 点击其他有记录的日期后，详情区域切换到对应内容。
- 点击没有记录的日期时不报错，详情区域展示该日暂无内容的空状态。
- 详情区域展示标题、日期、标签和 Notion 页面正文。

视觉风格沿用当前公开站点：深色背景、白色文字、半透明边框和克制的圆角，不单独引入新的视觉体系。

## Notion 数据库

Daily 使用独立 Notion 数据库，通过环境变量配置：

```env
NOTION_DAILY_DATABASE_ID=<daily database id>
```

`NOTION_TOKEN` 继续复用现有 Notion integration token。

必需字段：

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `标题` | Title | 碎碎念标题 |
| `日期` | Date | 日历定位和排序依据 |
| `标签` | Multi-select | 可选的心情 / 主题 badge |
| `公开` | Checkbox | 只有勾选的记录展示在公开页 |

正文写在 Notion 页面正文中，不放在单独的 rich text 属性里。这样写作体验更接近日记，也避免属性长度限制。

## 数据模型

前端类型：

```ts
export interface NotionDailyEntry {
  id: string
  title: string
  date?: string
  tags: string[]
  isPublic: boolean
}
```

只有 `isPublic === true` 且 `date` 有效的记录会进入日历。

如果 Notion 中意外出现同一天多条公开记录，UI 需要保持确定性：第一版可以在按日期倒序排序后选择其中一条展示，但产品规则仍然是「每天最多一条」。

## 架构设计

`lib/notion.ts` 保持现有博客行为不变，在此基础上新增 Daily 专用读取函数：

- `getPublishedDailyEntries()`：查询 Daily 数据库，映射字段，过滤公开记录，按日期倒序排序。
- `getDailyEntryBlocks(pageId)`：读取选中记录的 Notion 页面正文 blocks，用于详情渲染。

Notion 查询 helper 需要支持传入 database id，不能只依赖博客使用的 `NOTION_DATABASE_ID`。现有博客函数继续使用 `NOTION_DATABASE_ID`，Daily 函数使用 `NOTION_DAILY_DATABASE_ID`。

`/daily` 路由需要捕获 Notion 错误并展示空状态，不能让公开页面崩溃。

## 前端组件

新增：

- `app/daily/page.tsx`：Server Component，拉取公开 Daily 列表并传给客户端组件。
- `app/daily/DailyClient.tsx`：Client Component，负责月份切换、日期选择、日历格子和详情状态。

复用：

- 现有 Notion block renderer，用于渲染页面正文。
- 现有布局和导航约定。

不需要新增全局 store。日历月份和选中日期状态放在 `DailyClient` 局部状态中即可。

## 错误处理

- 缺少 `NOTION_DAILY_DATABASE_ID`：展示 Daily 空状态，不抛运行时错误。
- Notion 查询失败：在页面层 catch，展示空状态。
- 详情正文 blocks 读取失败：仍展示标题、日期和标签，正文区域展示不可用状态。
- Daily 数据库为空：展示空状态。

## 验收标准

- `/daily` 能正常渲染，且不影响 `/blog`。
- 公开导航出现 `Daily`。
- 公开 Notion Daily 记录会在对应日期上显示标记。
- 页面默认选中最近一条公开记录。
- 点击有记录的日期后，详情面板切换到对应内容。
- `公开=false` 的 Notion 页面不会出现在日历中。
- 详情正文来自 Notion 页面正文内容。
- Daily Notion 配置缺失或拉取失败时，页面不会崩溃。
- `npm run build` 通过。

## 实现注意事项

- 优先按本 spec 的中文字段名读取 Notion 属性，只有实现时确实需要再加英文 fallback。
- 日期按本地日期字符串处理，避免时区转换导致日期前后偏移。
- 第一版只做单月日历视图和每天最多一条记录。
