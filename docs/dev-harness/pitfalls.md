# 研发 Harness 踩坑记录
## 索引
- 流程类：范围控制、学习发散、文档同步、阶段切换标题、Gate C 勾选权、多 Track 当前阶段游标
- Go 工程：go.mod 位置、GOPROXY、response 包
- 工具链：进入新栈前置检查、MySQL formula 版本、前后端开发端口 CORS
- 前后端联调：API 响应字段命名风格变更

## 使用原则

只记录未来会复用或需要避免的问题，不记录一次性琐事。

## 记录模板

```md
## 问题标题

### 场景

### 原因

### 解决方案

### 下次如何避免
```

## 范围控制：Harness 不等于产品内 Agent 框架

### 场景

在讨论 Harness 时，最开始容易把它理解成产品里的 Agent 运行框架，例如 `ContextLoader`、`ToolRegistry`、`OutputParser` 等。

### 原因

Harness 一词既可以指 Agent 运行外壳，也可以指研发流程控制系统。当前阶段真正需要的是开发过程中的研发 Harness。

### 解决方案

将当前 Harness 明确定义为“研发过程控制系统”，用于约束需求、学习、设计、编码、验证和沉淀。

### 下次如何避免

每次提到 Harness 时先确认语境：
- 产品内 Harness：服务于 Agent 运行。
- 研发 Harness：服务于开发过程控制。

当前项目优先落地研发 Harness。

## 学习范围发散风险

### 场景

项目同时涉及 Go、Gin、MySQL、权限、后台管理、LangChain、Next.js，容易陷入“先系统学完再开发”的状态。

### 原因

技术栈跨度大，且部分内容此前没有系统学习经验。

### 解决方案

采用项目驱动学习，每个阶段只学当前闭环所需的最小知识。

### 下次如何避免

编码前先回答：
- 当前小闭环是什么？
- 它缺哪 1-2 个最小知识点？
- 哪些知识先不学？

## 技术栈切换后的文档同步风险

### 场景

后端技术栈从 Java / Spring Boot 调整为 Go / Gin 后，如果只改实现计划，不同步 SDD 和研发 Harness 文档，后续 Agent 可能继续按 Java 路线推进。

### 原因

研发 Harness 依赖文档作为执行入口，技术栈信息分散在 SDD、阶段计划、进度日志、踩坑记录中。

### 解决方案

技术栈变更时必须同步更新：
- `tech_design/ai-learning-platform/SDD-AI学习规划与成长记录平台.md`
- `docs/dev-harness/stage-plan.md`
- `docs/dev-harness/progress-log.md`
- `docs/dev-harness/pitfalls.md`

### 下次如何避免

任何技术栈变更都先做一次全局搜索，确认旧技术栈关键词不再出现在当前执行文档中。

## 进入新技术栈阶段前未做工具链前置检查

### 场景

Stage 1 Day 1 决定后端走 Go，准备 Day 2 初始化 `go.mod` 时才发现本机 `go` 命令不存在，导致 Day 2 第一步必须先去安装 Go 才能继续。

### 原因

Harness 阶段计划只列了"做什么"，未把"工具链可用性"作为进入闸门的前置项。

### 解决方案

进入任何涉及新技术栈的阶段前，先在终端验证关键命令可用：
- Go 阶段：`go version`、`gofmt`。
- Node / 前端：`node -v`、`npm -v`。
- 数据库：`mysql --version` 或确认容器可启动。

### 下次如何避免

把"工具链验证"写进每个阶段的 Gate D（编码闸门）：编码前必须先在终端跑通对应命令，未通过则在 progress-log 中先记录工具链准备步骤，再进入 Day 2。

## monorepo 中 `go.mod` 误放在仓库根目录

### 场景

Stage 1 Day 2 初始化 Go 后端时，`go mod init` 在仓库根目录执行，导致 `go.mod` 出现在 `/personal-profile/go.mod`，而不是 `/personal-profile/backend/go.mod`。

### 原因

monorepo 下既有 Next.js（前端）又有 Go（后端），`go mod init` 默认在当前目录创建 `go.mod`，没有先 `cd backend/`。

### 解决方案

将 `go.mod` 移动到 `backend/` 内，确保 Go 工具链只扫描 `backend/`，不污染前端 `node_modules`、`scripts/*.ts` 等文件。

### 下次如何避免

涉及多技术栈的子目录（`backend/`、`worker/` 等）初始化时，**先 `cd <子目录>` 再执行 `go mod init` / `npm init` / `cargo init`**，并在 PR 自检里检查根目录是否多出语言级配置文件（`go.mod`、`Cargo.toml`、`pom.xml` 等）。

## 国内网络下 Go 模块下载超时

### 场景

Stage 1 Day 2 执行 `go get github.com/gin-gonic/gin` 时报 `Get "https://sum.golang.org/lookup/...": dial tcp ... i/o timeout`，依赖无法下载。

### 原因

Go 默认的 `GOPROXY=https://proxy.golang.org` 与 `GOSUMDB=sum.golang.org` 在国内网络下不可达。

### 解决方案

```bash
go env -w GOPROXY=https://goproxy.cn,direct
go env -w GOSUMDB=sum.golang.google.cn
```

设置后 `go get` 走七牛代理，校验走 `sum.golang.google.cn`，无需关闭 GOSUMDB。

### 下次如何避免

新机器或新阶段第一次 `go get` 之前，先用 `go env GOPROXY GOSUMDB` 检查代理配置；如果是国内网络且仍是默认值，先按上述命令切换，再开始拉依赖。

## Homebrew 默认 mysql formula 版本与计划文档不一致

### 场景

Stage 2 Day 1 执行 `brew install mysql`，预期装 MySQL 8（stage-plan 写的是 MySQL 8），实际装到了 9.6.0。

### 原因

Homebrew 的 `mysql` formula 始终跟随上游最新主版本，目前已经是 9.x。要锁定 8.x 必须显式装 `mysql@8.4`（且 9 → 8 是降级，不能直接切换，需先停服务并迁移 datadir）。

### 解决方案

评估对项目的实际影响：

- GORM 默认 driver `go-sql-driver/mysql` 完全兼容 8.0+/9.x（协议未变）。
- 9.x 默认认证插件 `caching_sha2_password`，driver 自动协商，无需特殊处理。
- 9.x 移除了一些 deprecated 关键字 / SQL 模式，本项目 4 张表未触发。
- 影响可忽略时，直接采用 9.x，并把计划中"MySQL 8"统一改为"MySQL 8/9"。

### 下次如何避免

涉及 DB / 运行时大版本时，stage-plan 不要写死单一主版本号；写"≥8.0"或"8/9"等区间。安装前先 `brew info <formula>` 确认实际默认版本，再决定是否锁版本。

## middleware 与 handler 响应构造重复导致维护隐患

### 场景

Stage 1 Day 5 实现 JWT 中间件时，`middleware/auth.go` 的 `abortUnauthorized` 函数手动用 `gin.H{...}` 拼装统一响应结构，而 `handler/response.go` 已经有 `Fail()` 做同样的事。两处代码结构相同但互不引用。

### 原因

Go 不允许循环 import。middleware 包无法直接 import handler 包（handler 未来可能 import middleware 下的工具），所以中间件里"另起炉灶"手动拼了响应 JSON。

### 解决方案

提取公共 `internal/response` 包，暴露 `OK()`、`Fail()`、`Abort()` 三个函数：
- `OK` / `Fail`：写响应但不中断请求链（handler 用）。
- `Abort`：写响应并调用 `c.Abort()`（middleware 用）。

handler 包的 `response.go` 改为代理层，内部转发调用 `internal/response`。middleware 直接 import `internal/response`。

### 下次如何避免

涉及多包共用的工具函数（响应构造、错误码、traceID 生成等），第一次写时就放在独立的公共包中，不要先写在业务包里再事后提取。判断标准：如果这个函数未来可能被 handler 和 middleware 同时调用，直接放 `internal/response` 或 `internal/pkg`。

## Gate C（学习闸门）的责任主体是用户，AI 不得代勾

### 场景

Stage 2 Day 3 编码前只显式过了 Gate A/B/D，跳过了 Gate C 直接写 GORM/连接池代码。Day 3 结束后用户问"是不是漏过了 Gate C"，AI 把"代码里已经用到了 GORM `Open/First/Create/Save` 等 API"等同于"Gate C 已通过"，把三项勾上。用户随即指出"我自己还没完成学习"，AI 才意识到搞错了主体。

### 原因

两层错误叠加：
1. **流程层**：Gate A/B/D 偏决策（范围、契约、目录），容易被当成"必过"项；Gate C 偏学习清单，AI 主观感觉"代码能跑就行"于是跳过，未在编码前显式确认。
2. **主体层**：Gate C 的目的是确保**用户**能看懂、能维护、能独立写下一段代码，主体是用户。AI 写出可运行代码 ≠ 用户学过这些知识；AI 没有勾选 Gate C 的权限。

### 解决方案

- Gate C 只能由用户自己勾选，AI 不得代勾。
- AI 推进每个 Day 编码前必须先问"Gate C 这几条你学过/查过文档了吗？"用户没确认就停下，可以提供精简学习材料（API 列表 + 一段最小可运行示例 + 几行解释），但不替用户走完学习。
- Day 编码完成后，AI 可以在产出物里列出"本 Day 实际用到了 Gate C 的哪些 API、出现在哪个文件哪行"，作为用户对照学习的索引；勾选动作仍由用户完成。

### 下次如何避免

把 Gate 勾选权显式记入工作流：
- A / B / D：AI 协助起草、用户确认勾选。
- **C：AI 不得勾选，必须由用户在学习后自己勾。**
- E：由 curl / 测试结果共同确认。
- F：AI 起草 progress-log 与 pitfalls，用户复核。

每次进入新 Stage 时，复制一份当 Stage 的 Gate A-D 到 progress-log 第一天开头作为硬阻断；中途引入新依赖或新工具，先停下来补一条 Gate C 再继续。

## Next.js Server Component 调用外部 API 时后端未启动导致白屏

### 场景

FB-1 Day 2 把首页 `app/page.tsx` 改为 Server Component 后，`await getPublicContacts()` 在服务端执行。后端未启动时 fetch 抛出 `fetch failed`，Next.js 将错误传递给客户端，触发全局 error boundary，整个首页白屏。

### 原因

Server Component 的 fetch 失败会向上冒泡，如果没有 try/catch 或 `.catch()` 兜底，Next.js 会把错误传给最近的 error boundary（全局 `app/error.tsx`），导致整页替换为错误 UI。

### 解决方案

对"后端不可用时页面仍应正常渲染"的接口调用加 `.catch(() => [])` 降级：

```ts
const contacts = await getPublicContacts().catch(() => [])
```

### 下次如何避免

公开展示页的 API 调用一律加降级默认值，后端挂了不应影响页面基本可访问性。只有"无数据则页面无意义"的场景才允许让错误冒泡到 error boundary。

## Next.js 博客页构建时调用 Notion API 失败

### 场景

FB-1 Day 4 `npm run build` 时，`/blog/page.tsx` 和 `/blog/[slug]/page.tsx` 在构建阶段被静态预渲染，调用了 `getPublishedPosts()`，但构建环境没有 `NOTION_TOKEN`，导致 build 失败。

### 原因

Next.js 默认会尝试静态预渲染所有 Server Component 页面。依赖运行时外部 API（Notion、数据库）的页面必须显式声明为动态渲染，否则构建时会实际发起请求。

### 解决方案

在依赖运行时 API 的页面顶部加：

```ts
export const dynamic = 'force-dynamic'
```

同时给 `generateStaticParams` 加环境变量守卫，避免构建时调用：

```ts
export async function generateStaticParams() {
  if (!process.env.NOTION_TOKEN) return []
  ...
}
```

### 下次如何避免

任何依赖运行时环境变量（Notion、数据库 DSN、第三方 API Key）的页面，在创建时就加 `export const dynamic = 'force-dynamic'`，不要等到 build 失败再加。

### 场景

Stage 1 全部 Gate 通过、已实际进入 Stage 2 后，`stage-plan.md` 第 11 行的标题仍是 `## 当前阶段：阶段 1 ...`。`scripts/harness-check.js` 通过这个标题正则定位"当前阶段"块，再读其 Gate E 勾选率。结果脚本一直读到 Stage 1 的 Gate E（5/5 全勾），输出 "可进入下一阶段"，掩盖了 Stage 2 实际只完成 0-1/5 的真实进度。

### 原因

`stage-plan.md` 用一个特殊的 `## 当前阶段：xxx` 标题作为"游标"，其它阶段则是 `## 阶段 N: xxx`。阶段切换时必须手动把游标从旧阶段挪到新阶段，但流程清单里没显式列这一步。

### 解决方案

切换时同时改两行标题：
- 旧阶段：`## 当前阶段：阶段 N ...` → `## 阶段 N ...（已完成）`
- 新阶段：`## 阶段 N+1 ...` → `## 当前阶段：阶段 N+1 ...`

之后立即跑 `npm run harness:check`，确认报告里 `阶段 [...]` 的名字变成了新阶段，Gate E 进度也变成新阶段的真实分子分母。

### 下次如何避免

把"挪动 `## 当前阶段：` 游标"写进阶段切换 SOP（progress-log "进入下一阶段" 的检查项里），并在 `harness-check.js` 后续考虑增强：当 Gate E 全勾且 stage-plan 中存在下一阶段段落时，输出 WARN 提示"该挪游标了"，而不是单纯报喜。

## 多 Track 文档同时维护时当前阶段游标不同步

### 场景

前端 Track 启动后，`stage-plan.md`、`stage-plan-frontend.md`、`progress-log.md` 同时记录阶段状态。FB-2 已经开始开发，但主计划仍停在 FB-1，前端计划里同时存在两个 `## 当前阶段：` 标题，progress-log 则已经记录 FB-2 小闭环。

### 原因

阶段切换只更新了部分文档，没有把"主计划游标、Track 计划游标、progress-log 事实记录"作为一个原子操作一起维护。`harness:check` 当前只扫描 `stage-plan.md`，无法发现 `stage-plan-frontend.md` 中的双当前阶段问题。

### 解决方案

切换前端或后端 Track 阶段时，同步检查三类文件：
- `stage-plan.md`：全局当前阶段必须指向实际推进中的阶段。
- `stage-plan-frontend.md`：只能有一个 `## 当前阶段：`。
- `progress-log.md`：最近日志的"明日第一步"必须与计划游标一致。

### 下次如何避免

阶段切换后立即搜索 `## 当前阶段：`，确认每个计划文件最多只有一个当前阶段，且多个计划文件之间没有互相矛盾。跑 `npm run harness:check` 之外，还要人工核对 Track 计划文件；后续可增强脚本，把 `stage-plan-frontend.md` 也纳入当前阶段数量检查。

## 前后端开发端口不一致导致 CORS 预检失败

### 场景

FB-2 浏览器验收后台登录时，前端 dev server 实际运行在 `http://localhost:3001`，但后端 CORS 只允许 `http://localhost:3000`。浏览器调用 `POST http://localhost:8080/api/auth/login` 时先发 OPTIONS preflight，后端响应缺少 `Access-Control-Allow-Origin`，登录请求被浏览器拦截。

### 原因

Next.js 默认端口 3000 被占用时会自动切到 3001，但后端 CORS 白名单写死为单一 origin。curl 能成功不代表浏览器能成功，因为 curl 不执行浏览器 CORS 策略。

### 解决方案

后端 CORS 使用动态 origin 判断：
- 明确白名单：优先匹配 `BACKEND_CORS_ALLOWED_ORIGINS`，多个 origin 用逗号分隔。
- 本地开发兜底：允许 `http://localhost:3000-3009` 与 `http://127.0.0.1:3000-3009`。
- 不使用 `AllowAllOrigins`，避免把带 `Authorization` 的后台接口暴露给任意来源。

### 下次如何避免

前后端联调前先确认浏览器地址栏中的实际 origin，并把它加入后端 CORS 白名单。凡是后台接口需要 Authorization header，都必须验证 OPTIONS preflight，而不能只用 POST curl 验证。

## 后端 API 响应字段命名风格变更导致前端运行时错误

### 场景

FB-3 改造 login 接口时，后端新 handler 返回 camelCase 字段（`accessToken`、`expiresIn`），但前端 `lib/api/admin.ts` 的 `LoginResponse` 仍定义为 snake_case（`access_token`、`expires_in`）。TypeScript 类型检查不会报错（类型是手写 interface，与运行时 JSON 无关），但运行时 `res.access_token` 为 `undefined`，导致登录后 token 为空、后续所有 admin 请求 401。

### 原因

Go 的 `gin.H{}` 返回 JSON 时 key 是代码里写的字面量；Stage 1 用的是 snake_case（`access_token`），Stage 3 重写时改为 camelCase 与前端命名习惯对齐，但忘记同步更新前端类型定义。TS 编译不会检查运行时 JSON 字段名是否匹配 interface。

### 解决方案

改后端响应字段时，必须全局搜索前端中对旧字段名的引用并同步更新。

### 下次如何避免

改造涉及请求/响应结构变更的接口时，执行以下检查：
1. `grep -r "旧字段名" app/ lib/ components/` 确认没有残留。
2. 前端 `LoginResponse` 类型字段名必须与后端实际返回的 JSON key 严格一致。
3. 如果有 OpenAPI / Swagger 文件，以它为唯一真相源生成前端类型。

## Antd Modal 使用 `destroyOnClose` 时 `form.setFieldsValue` 失效

### 场景

Stage 6 的 `/admin/projects` 页面，点击"编辑"按钮后 Modal 弹出，但表单所有字段都是空的。同样的问题出现在 `/admin/contacts`、`/admin/skills`、`/admin/site-config` 页面。

### 原因

Modal 使用了 `destroyOnClose`（关闭时销毁内部 DOM 节点），而 `form.setFieldsValue()` 在 Modal 打开动画完成**之前**就被调用。此时 Form 还未挂载到 DOM，`setFieldsValue` 直接失效，Form 保持 initialValues 状态，导致所有字段为空。

### 解决方案

将 `form.setFieldsValue()` 移入 Modal 的 `afterOpenChange` 回调中执行：

```tsx
const handleAfterOpenChange = useCallback((open: boolean) => {
  if (!open) return
  const project = editingProject
  if (!project) {
    form.setFieldsValue({ slug: '', title: '', ... })
    return
  }
  form.setFieldsValue({
    slug: project.slug,
    title: project.title,
    ...
  })
}, [form, editingProject])

<Modal afterOpenChange={handleAfterOpenChange} destroyOnClose>
```

### 下次如何避免

任何使用了 `destroyOnClose` 的 Modal，且有"点击行数据后弹出编辑"逻辑时，必须用 `afterOpenChange` 而非在 `setModalOpen(true)` 之前调用 `setFieldsValue`。如果 Modal 只用于新建（无需预填数据），则不受此问题影响。
