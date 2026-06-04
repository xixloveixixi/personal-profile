# 数据库 Schema 契约

> 业务后端开发前必须先在此文件中冻结表结构。
> 权威源：`tech_design/ai-learning-platform/SDD-AI学习规划与成长记录平台.md` 第 10 章。
> 本文件是"将进入实现"的子集，必须先于 GORM model / migration 存在。

## 使用规则

- **未在本文件冻结表结构的表，禁止编写 GORM model 与 migration**（见 `AGENTS.md` 限制条款）。
- 字段类型、长度、索引、外键与 SDD 10.x 不一致时，以本文件为准并同步回 SDD。
- 表定稿后才允许进入 Gate D（编码闸门）。
- 字段删除/重命名必须在本文件保留 deprecated 说明，并在 migration 中走两步迁移（先兼容后清理）。

## 通用约定

参考 SDD 10.1，本仓库 Stage 2 实际落地版本：

- 主键：`id BIGINT UNSIGNED AUTO_INCREMENT`
- 软删除：`deleted_at DATETIME(3) NULL`（GORM 默认软删字段，与 SDD 10.1 的 `deleted` 字段统一为 `deleted_at`，更符合 GORM 习惯）
- 时间字段：`created_at DATETIME(3) NOT NULL`，`updated_at DATETIME(3) NOT NULL`
- 字符集：`utf8mb4`，排序规则 `utf8mb4_unicode_ci`
- 引擎：InnoDB
- 命名：表名小写蛇形（如 `public_profile`），字段同。
- 外键：先用应用层约束，不强制建 DB 外键（迁移友好）。
- `owner_id` 字段：Stage 2 不引入 `sys_user`，所有写入固定使用 `owner_id = 1`（从 `internal/config` 读取 `OWNER_ID`，默认 1）；Stage 3 引入 `sys_user` 后再建立 FK 关系。
- Stage 2 不落地 SDD 10.1 中的 `created_by` / `updated_by`（因没有 `sys_user`），Stage 3 再补。

## 已冻结表（Stage 2）

> 状态：✅ 已冻结于 2026-05-19，对应 SDD 10.3-10.6。

### public_profile

- **用途**：owner 公开个人信息（单条，按 owner_id 唯一）。
- **DDL**：
  ```sql
  CREATE TABLE public_profile (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    owner_id        BIGINT UNSIGNED NOT NULL              COMMENT '所属用户，Stage 2 固定为 1',
    display_name    VARCHAR(64)     NOT NULL              COMMENT '展示名称',
    headline        VARCHAR(255)    NOT NULL DEFAULT ''   COMMENT '首页主标题',
    bio             TEXT            NULL                  COMMENT '个人简介',
    avatar_url      VARCHAR(512)    NOT NULL DEFAULT ''   COMMENT '头像 URL',
    current_focus   VARCHAR(255)    NOT NULL DEFAULT ''   COMMENT '当前定位',
    location        VARCHAR(128)    NOT NULL DEFAULT ''   COMMENT '所在城市',
    visibility      VARCHAR(32)     NOT NULL DEFAULT 'public' COMMENT 'public/private/hidden',
    created_at      DATETIME(3)     NOT NULL,
    updated_at      DATETIME(3)     NOT NULL,
    deleted_at      DATETIME(3)     NULL,
    UNIQUE KEY uk_owner (owner_id),
    KEY idx_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公开个人信息';
  ```
- **索引**：
  - `uk_owner(owner_id)`：保证一个 owner 仅一条 profile，支撑 `GET /api/public/profile` 与 `PUT /api/admin/profile` 的 upsert 语义。
  - `idx_deleted_at`：GORM 软删除查询过滤。
- **关联接口**：`GET /api/public/profile`、`GET /api/admin/profile`、`PUT /api/admin/profile`。
- **备注**：单 owner 模型下 upsert 实现为"先按 owner_id First，无则 Create，有则 Save"。

### public_contact

- **用途**：owner 公开联系方式列表。
- **DDL**：
  ```sql
  CREATE TABLE public_contact (
    id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    owner_id    BIGINT UNSIGNED NOT NULL,
    platform    VARCHAR(64)     NOT NULL              COMMENT '平台标识：github/wechat/email 等',
    label       VARCHAR(128)    NOT NULL DEFAULT ''   COMMENT '展示文案',
    url         VARCHAR(512)    NOT NULL DEFAULT ''   COMMENT '链接（可为空，如微信号）',
    icon        VARCHAR(64)     NOT NULL DEFAULT ''   COMMENT '图标标识',
    is_public   TINYINT(1)      NOT NULL DEFAULT 1    COMMENT '1 公开 0 隐藏',
    sort_order  INT             NOT NULL DEFAULT 0    COMMENT '排序，升序',
    created_at  DATETIME(3)     NOT NULL,
    updated_at  DATETIME(3)     NOT NULL,
    deleted_at  DATETIME(3)     NULL,
    KEY idx_owner_public_sort (owner_id, is_public, sort_order),
    KEY idx_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公开联系方式';
  ```
- **索引**：
  - `idx_owner_public_sort`：支撑 `GET /api/public/contacts` 按 (owner_id, is_public=1) 过滤后按 sort_order 升序输出。
- **关联接口**：`GET /api/public/contacts`、`GET/POST/PUT/DELETE /api/admin/contacts(/:id)`。
- **备注**：`platform + label` 不强制唯一，允许同平台多账号。

### public_skill

- **用途**：owner 公开技能列表（含分类、熟练度）。
- **DDL**：
  ```sql
  CREATE TABLE public_skill (
    id                 BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    owner_id           BIGINT UNSIGNED NOT NULL,
    name               VARCHAR(64)     NOT NULL              COMMENT '技能名称',
    category           VARCHAR(64)     NOT NULL DEFAULT ''   COMMENT '技能类别：frontend/backend/ai 等',
    proficiency_level  VARCHAR(32)     NOT NULL DEFAULT ''   COMMENT '熟练 / 掌握 / 了解',
    description        VARCHAR(512)    NOT NULL DEFAULT ''   COMMENT '描述',
    is_public          TINYINT(1)      NOT NULL DEFAULT 1    COMMENT '1 公开 0 隐藏',
    sort_order         INT             NOT NULL DEFAULT 0    COMMENT '排序，升序',
    created_at         DATETIME(3)     NOT NULL,
    updated_at         DATETIME(3)     NOT NULL,
    deleted_at         DATETIME(3)     NULL,
    KEY idx_owner_public_cat_sort (owner_id, is_public, category, sort_order),
    KEY idx_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公开技能';
  ```
- **索引**：
  - `idx_owner_public_cat_sort`：支撑公开列表按 (owner_id, is_public=1, category) 过滤后 sort_order 升序输出。
- **关联接口**：`GET /api/public/skills`、`GET/POST/PUT/DELETE /api/admin/skills(/:id)`。
- **备注**：`category` 不在本阶段强约束枚举值，由前端写入约定决定。

### site_config

- **用途**：站点级 K-V 配置（导航、SEO、社交链接等结构化或非结构化值）。
- **DDL**：
  ```sql
  CREATE TABLE site_config (
    id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    config_key    VARCHAR(128)    NOT NULL              COMMENT '配置键',
    config_value  TEXT            NULL                  COMMENT '配置值（按 value_type 解释）',
    value_type    VARCHAR(32)     NOT NULL DEFAULT 'string' COMMENT 'string / json / boolean / number',
    description   VARCHAR(255)    NOT NULL DEFAULT ''   COMMENT '说明',
    created_at    DATETIME(3)     NOT NULL,
    updated_at    DATETIME(3)     NOT NULL,
    deleted_at    DATETIME(3)     NULL,
    UNIQUE KEY uk_config_key (config_key),
    KEY idx_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站点配置';
  ```
- **索引**：
  - `uk_config_key`：保证 key 全局唯一，支撑按 key upsert 与 `GET /api/public/site-config` 全量返回。
- **关联接口**：`GET /api/public/site-config`、`GET /api/admin/site-config`、`PUT /api/admin/site-config/:key`。
- **备注**：`value_type=json` 时 `config_value` 内容须是合法 JSON；handler 不做强校验，前端按 `value_type` 自行解析。

## 待冻结表（Stage 3 / FB-3）

> 状态：✅ 已冻结于 2026-06-02。

### sys_user

- **用途**：系统用户表，支撑登录 DB 校验与 admin 接口 role 鉴权；Stage 3 仅有单条 owner 记录，不做多用户注册。
- **DDL**：
  ```sql
  CREATE TABLE sys_user (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    username        VARCHAR(64)     NOT NULL              COMMENT '登录用户名',
    password_hash   VARCHAR(255)    NOT NULL              COMMENT 'bcrypt 哈希',
    role            VARCHAR(32)     NOT NULL DEFAULT 'owner' COMMENT '角色：owner（Stage 3 仅支持 owner）',
    display_name    VARCHAR(64)     NOT NULL DEFAULT ''   COMMENT '显示名称',
    email           VARCHAR(255)    NOT NULL DEFAULT ''   COMMENT '邮箱',
    status          TINYINT(1)      NOT NULL DEFAULT 1    COMMENT '1 启用 0 禁用',
    last_login_at   DATETIME(3)     NULL                  COMMENT '最后登录时间',
    created_at      DATETIME(3)     NOT NULL,
    updated_at      DATETIME(3)     NOT NULL,
    deleted_at      DATETIME(3)     NULL,
    UNIQUE KEY uk_username (username),
    KEY idx_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户';
  ```
- **索引**：
  - `uk_username`：保证用户名唯一，支撑登录时 `WHERE username = ?` 查询。
  - `idx_deleted_at`：GORM 软删除查询过滤。
- **关联接口**：`POST /api/auth/login`（改为 DB 校验）、`GET /api/auth/me`（从 DB 读取用户信息）。
- **备注**：
  - 密码存储使用 bcrypt（cost=10），handler 不得存储明文。
  - Stage 3 不做注册接口，`sys_user` 通过种子 SQL 预灌 owner 记录。
  - `owner_id` 字段在其他表（public_profile 等）与 `sys_user.id` 形成应用层 FK。
  - Stage 3 admin 接口从"仅校验有效 Token"升级为"校验 Token 中 role=owner"。

## 待冻结表（Stage 6 / FB-4）

> 状态：✅ 已冻结于 2026-06-02。

### portfolio_project

- **用途**：owner 项目展示列表（对标前端 `content/projects/*.json`），含技术栈（JSON 数组）、gallery（JSON 数组）、详情文案。
- **DDL**：
  ```sql
  CREATE TABLE IF NOT EXISTS portfolio_project (
    id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    owner_id          BIGINT UNSIGNED NOT NULL              COMMENT '所属用户',
    slug              VARCHAR(128)    NOT NULL              COMMENT 'URL 友好标识',
    title             VARCHAR(255)    NOT NULL              COMMENT '项目标题',
    short_description VARCHAR(512)    NOT NULL DEFAULT ''   COMMENT '短描述（卡片展示）',
    long_description  TEXT            NULL                  COMMENT '长描述（详情页）',
    problem           TEXT            NULL                  COMMENT '解决的问题',
    solution          TEXT            NULL                  COMMENT '解决方案',
    challenges        TEXT            NULL                  COMMENT '技术挑战',
    results           TEXT            NULL                  COMMENT '成果',
    technologies      JSON            NOT NULL              COMMENT '技术栈 JSON 数组 ["React","Go"]',
    github_url        VARCHAR(512)    NOT NULL DEFAULT ''   COMMENT 'GitHub 仓库链接',
    demo_url          VARCHAR(512)    NOT NULL DEFAULT ''   COMMENT '演示地址',
    featured_image    VARCHAR(512)    NOT NULL DEFAULT ''   COMMENT '封面图 URL',
    gallery           JSON            NULL                  COMMENT '图库 JSON 数组 ["/img/1.png"]',
    published_at      DATE            NULL                  COMMENT '发布日期',
    featured          TINYINT(1)      NOT NULL DEFAULT 0    COMMENT '1 精选 0 普通',
    is_public         TINYINT(1)      NOT NULL DEFAULT 1    COMMENT '1 公开 0 隐藏',
    sort_order        INT             NOT NULL DEFAULT 0    COMMENT '排序，升序',
    created_at        DATETIME(3)     NOT NULL,
    updated_at        DATETIME(3)     NOT NULL,
    deleted_at        DATETIME(3)     NULL,
    UNIQUE KEY uk_owner_slug (owner_id, slug),
    KEY idx_owner_public_sort (owner_id, is_public, sort_order),
    KEY idx_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目展示';
  ```
- **索引**：
  - `uk_owner_slug(owner_id, slug)`：同一 owner 下 slug 唯一，支撑 `GET /api/public/projects/:slug` 路由。
  - `idx_owner_public_sort`：支撑公开列表按 sort_order 排序。
  - `idx_deleted_at`：GORM 软删除。
- **关联接口**：`GET /api/public/projects`、`GET /api/public/projects/:slug`、`GET/POST/PUT/DELETE /api/admin/projects(/:id)`。
- **备注**：
  - `technologies` 和 `gallery` 用 JSON 字段存储，不拆子表（SDD 10.8 `portfolio_project_tech` 简化），降低 JOIN 复杂度，数据量小无性能问题。
  - 与前端 `PortfolioProject` 接口完全对齐：`slug / title / shortDescription / longDescription / problem / solution / challenges / results / technologies / githubUrl / demoUrl / featuredImage / gallery / publishedAt / featured / order`。

## 待冻结表（Stage 7 / FB-5）

> 状态：✅ 已冻结于 2026-06-03。

### learning_profile

- **用途**：owner 学习画像（单条，按 owner_id 唯一）。
- **DDL**：
  ```sql
  CREATE TABLE learning_profile (
    id                  BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    owner_id            BIGINT UNSIGNED NOT NULL              COMMENT '所属用户，FK sys_user.id',
    target_role         VARCHAR(128)    NOT NULL DEFAULT ''   COMMENT '目标岗位',
    background_summary  TEXT            NULL                  COMMENT '背景摘要',
    skill_summary       TEXT            NULL                  COMMENT '技能摘要',
    weakness_summary    TEXT            NULL                  COMMENT '短板摘要',
    learning_preference TEXT            NULL                  COMMENT '学习偏好',
    resume_snapshot     TEXT            NULL                  COMMENT '简历快照',
    created_at          DATETIME(3)     NOT NULL,
    updated_at          DATETIME(3)     NOT NULL,
    deleted_at          DATETIME(3)     NULL,
    UNIQUE KEY uk_owner (owner_id),
    KEY idx_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习画像';
  ```
- **索引**：
  - `uk_owner(owner_id)`：保证一个 owner 仅一条学习画像，支撑 `GET /api/private/learning/profile` 与 `PUT /api/private/learning/profile` 的 upsert 语义。
  - `idx_deleted_at`：GORM 软删除查询过滤。
- **关联接口**：`GET /api/private/learning/profile`、`PUT /api/private/learning/profile`。
- **备注**：单 owner 模型下 upsert 实现为"先按 owner_id First，无则 Create，有则 Save"。

### learning_goal

- **用途**：owner 学习目标列表。
- **DDL**：
  ```sql
  CREATE TABLE learning_goal (
    id               BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    owner_id         BIGINT UNSIGNED NOT NULL              COMMENT '所属用户，FK sys_user.id',
    title            VARCHAR(128)    NOT NULL              COMMENT '目标标题',
    description      TEXT            NULL                  COMMENT '目标描述',
    goal_type        VARCHAR(64)     NOT NULL DEFAULT 'skill' COMMENT '目标类型：interview / project / skill',
    priority         INT             NOT NULL DEFAULT 0    COMMENT '优先级，升序',
    deadline         DATE            NULL                  COMMENT '截止日期',
    status           VARCHAR(32)     NOT NULL DEFAULT 'not_started' COMMENT '状态：not_started / active / completed / paused',
    progress_percent INT             NOT NULL DEFAULT 0    COMMENT '进度 0-100',
    created_at       DATETIME(3)     NOT NULL,
    updated_at       DATETIME(3)     NOT NULL,
    deleted_at       DATETIME(3)     NULL,
    KEY idx_owner_status (owner_id, status),
    KEY idx_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习目标';
  ```
- **索引**：
  - `idx_owner_status(owner_id, status)`：支撑按 owner 和状态过滤目标列表。
  - `idx_deleted_at`：GORM 软删除查询过滤。
- **关联接口**：`GET /api/private/learning/goals`、`POST /api/private/learning/goals`、`PUT /api/private/learning/goals/:id`、`DELETE /api/private/learning/goals/:id`。
- **备注**：`goal_type` 枚举值 `interview` / `project` / `skill`；`status` 枚举值 `not_started` / `active` / `completed` / `paused`。

## 已冻结表（Pipeline 验证 / REQ-20260603-01）

> 状态：✅ 已冻结于 2026-06-03。

### health_check_log

- **用途**：记录 `/api/health` 接口调用日志，支撑健康检查统计。
- **DDL**：
  ```sql
  CREATE TABLE health_check_log (
    id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    called_at   DATETIME(3)     NOT NULL COMMENT '调用时间',
    created_at  DATETIME(3)     NOT NULL,
    KEY idx_called_at (called_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='健康检查日志';
  ```
- **索引**：
  - `idx_called_at`：支撑按时间范围统计查询。
- **关联接口**：`GET /api/health`（写入）、`GET /api/admin/health-stats`（读取统计）。
- **备注**：不做软删除，日志表轻量化；未来可加定时清理。

## 本阶段不做

- 不做学习/Agent 相关表（SDD 10.9-10.17）。
- 不做用户注册接口 / 多用户体系。
- 不做 `portfolio_project_tech` 子表（technologies 用 JSON 字段存储）。

## 变更记录

| 日期 | 变更 | 触发原因 |
|------|------|----------|
| 2026-05-17 | 初始化文件，列出 Stage 2 候选表清单 | Harness 优化 P0 |
| 2026-05-19 | 冻结 4 张公开表 DDL；将 SDD 10.1 的 `deleted` 统一为 `deleted_at`（GORM 习惯）；明确 Stage 2 单 owner 模型下 `owner_id` 固定为 1；Stage 2 暂不落地 `created_by` / `updated_by` | Stage 2 Day 2 进入 Gate B |
