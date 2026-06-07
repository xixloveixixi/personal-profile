# Learning Coach Agent 系统设计

> 创建日期：2026-06-07
> 状态：已确认，待实现

## 概述

构建一个个性化学习教练 Agent，基于用户的学习画像、目标和进度，提供智能学习计划生成、面试复盘分析、进度跟踪和周复盘功能。

## 核心能力

1. **学习计划生成**：基于画像和目标生成个性化学习计划
2. **面试复盘分析**：分析面试反馈，识别优缺点，调整学习方向
3. **进度跟踪**：主动跟踪学习进度，提供反馈
4. **周复盘**：生成周复盘报告，调整计划建议

## 技术选型

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 技术栈 | Python 微服务 | LangGraph 生态最成熟 |
| Agent 框架 | LangGraph | 原生支持状态机、中断恢复、持久化 |
| LLM 供应商 | DeepSeek | 性价比高，OpenAI 兼容，中文好 |
| 存储方案 | MySQL + LangGraph Checkpoint | 业务数据统一，工作流状态独立 |
| 通信方式 | Go 代理（短任务）+ 前端直连（流式） | 兼顾鉴权统一和流式体验 |
| 部署方式 | Docker Compose | 环境一致，易于部署 |
| Agent 模式 | 单 Agent + 多工具 | MVP 简单，后续按需用 Subgraph 扩展 |

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Next.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 学习工作台   │  │ 对话界面    │  │ 计划/任务管理        │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │ SSE/WebSocket      │
          │                ▼                    │
          │    ┌───────────────────────┐        │
          │    │   Python Agent 服务    │        │
          │    │   (LangGraph + FastAPI)│        │
          │    │  ┌─────────────────┐  │        │
          │    │  │  Learning Coach │  │        │
          │    │  │     Agent       │  │        │
          │    │  └────────┬────────┘  │        │
          │    │           │ Tools     │        │
          │    └───────────┼───────────┘        │
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      Go 后端 (Gin)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ /api/private │  │ /api/admin   │  │ /api/public      │   │
│  │ (学习数据)    │  │ (后台管理)    │  │ (公开数据)       │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                        MySQL                                 │
│  learning_profile | learning_goal | learning_plan | ...      │
│  agent_conversation | agent_message (新增)                   │
└─────────────────────────────────────────────────────────────┘
```

## Python Agent 服务

### 目录结构

```
agent-service/
├── app/
│   ├── main.py              # FastAPI 入口
│   ├── config.py            # 配置（DeepSeek API Key 等）
│   ├── agents/
│   │   ├── learning_coach.py   # LangGraph 学习教练 Agent
│   │   └── nodes/              # Graph 节点
│   │       ├── analyze.py      # 分析节点（画像、面试复盘）
│   │       ├── plan.py         # 计划生成节点
│   │       └── review.py       # 周复盘节点
│   ├── tools/
│   │   ├── data_reader.py      # 读取学习数据的 Tools
│   │   ├── data_writer.py      # 写入学习数据的 Tools
│   │   └── analyzer.py         # 分析工具
│   ├── models/
│   │   └── schemas.py          # Pydantic 数据模型
│   ├── api/
│   │   ├── chat.py             # 对话接口（流式）
│   │   └── generate.py         # 计划生成接口（短任务）
│   └── db/
│       └── mysql.py            # MySQL 连接
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```

### LangGraph 状态机

```
                    ┌─────────────┐
                    │   START     │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  classify   │ ← 意图分类
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ plan_gen    │   │ interview   │   │ progress    │
│ (生成计划)   │   │ (面试分析)   │   │ (进度查询)   │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       │    ┌────────────┘                 │
       │    │                              │
       ▼    ▼                              ▼
┌─────────────┐                    ┌─────────────┐
│ confirm     │ ← 用户确认          │ weekly_rev  │
│ (需要确认)   │   (interrupt)      │ (周复盘)     │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       ▼                                  │
┌─────────────┐                           │
│ execute     │ ← 执行写入操作             │
│ (保存数据)   │                           │
└──────┬──────┘                           │
       │                                  │
       └─────────────────┬────────────────┘
                         ▼
                  ┌─────────────┐
                  │  respond    │ ← 生成回复
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │    END      │
                  └─────────────┘
```

## 数据库设计（新增表）

### agent_conversation

```sql
CREATE TABLE agent_conversation (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id        BIGINT UNSIGNED NOT NULL              COMMENT '所属用户',
  title           VARCHAR(255)    NOT NULL DEFAULT ''   COMMENT '对话标题（自动生成）',
  status          VARCHAR(32)     NOT NULL DEFAULT 'active' COMMENT 'active/archived',
  metadata        JSON            NULL                  COMMENT '扩展元数据',
  created_at      DATETIME(3)     NOT NULL,
  updated_at      DATETIME(3)     NOT NULL,
  KEY idx_owner_status (owner_id, status),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent 对话会话';
```

### agent_message

```sql
CREATE TABLE agent_message (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  conversation_id   BIGINT UNSIGNED NOT NULL              COMMENT '所属对话',
  role              VARCHAR(32)     NOT NULL              COMMENT 'user/assistant/system/tool',
  content           TEXT            NOT NULL              COMMENT '消息内容',
  tool_calls        JSON            NULL                  COMMENT 'Tool 调用记录（assistant 消息）',
  tool_call_id      VARCHAR(64)     NULL                  COMMENT 'Tool 调用 ID（tool 消息）',
  tokens_used       INT             NOT NULL DEFAULT 0    COMMENT 'Token 消耗',
  created_at        DATETIME(3)     NOT NULL,
  KEY idx_conversation (conversation_id),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent 对话消息';
```

## API 接口设计

### Python Agent 服务（FastAPI）

#### POST /chat（流式对话）

```json
// Request
{
  "conversation_id": 123,
  "message": "帮我分析一下这次面试复盘..."
}

// Response (SSE)
data: {"type": "token", "content": "好"}
data: {"type": "token", "content": "的"}
data: {"type": "tool_call", "name": "get_learning_profile", "args": {}}
data: {"type": "tool_result", "name": "get_learning_profile", "result": {...}}
data: {"type": "token", "content": "根据你的画像..."}
data: {"type": "done", "conversation_id": 123}
```

#### POST /generate/plan

```json
// Request
{
  "goal_id": 1,
  "preferences": "每天学习1小时"
}

// Response
{
  "plan": {
    "title": "React Server Components 学习计划",
    "description": "...",
    "startDate": "2026-06-08",
    "endDate": "2026-07-08"
  },
  "tasks": [...]
}
```

### Go 后端变更

| 接口 | 变更 | 说明 |
|------|------|------|
| `POST /api/private/learning/plans/generate` | 修改 | 代理调用 Python `/generate/plan` |
| `GET /api/private/agent/conversations` | 新增 | 获取对话列表 |
| `DELETE /api/private/agent/conversations/:id` | 新增 | 删除对话 |

## Agent 工具列表

| 工具 | 类型 | 作用 |
|------|------|------|
| `get_learning_profile` | 读取 | 读取学习画像 |
| `get_learning_goals` | 读取 | 读取学习目标列表 |
| `get_learning_plans` | 读取 | 读取学习计划和任务 |
| `get_learning_progress` | 读取 | 读取学习进度日志 |
| `create_learning_plan` | 写入 | 创建学习计划 |
| `create_learning_task` | 写入 | 创建学习任务 |
| `update_learning_progress` | 写入 | 更新学习进度 |
| `update_learning_profile` | 写入 | 更新学习画像 |
| `analyze_interview_feedback` | 分析 | 分析面试复盘 |
| `generate_weekly_review` | 分析 | 生成周复盘报告 |

## Prompt 设计

### System Prompt

```
你是一位专业的学习教练，帮助用户制定和执行个性化学习计划。

## 你的能力
- 分析用户的学习画像（背景、技能、弱点）
- 根据学习目标生成详细的学习计划和任务
- 分析面试复盘，识别优缺点，调整学习方向
- 跟踪学习进度，生成周复盘报告

## 工作原则
1. 始终基于用户的真实数据（画像、目标、进度）做分析，不凭空假设
2. 计划要具体可执行，包含明确的时间和产出
3. 任务拆解遵循 SMART 原则（具体、可衡量、可达成、相关、有时限）
4. 发现用户新的弱点或进步时，主动建议更新学习画像
5. 用中文回复，语气专业但友好

## 工具使用
在需要时调用工具获取或更新数据，不要凭记忆回答关于用户数据的问题。
```

## Docker 部署

### docker-compose.yml

```yaml
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE=http://backend:8080
      - NEXT_PUBLIC_AGENT_BASE=http://agent:8000
    depends_on:
      - backend
      - agent

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - BACKEND_DB_DSN=pp_app:pp_dev_pwd@tcp(mysql:3306)/personal_profile
      - AGENT_SERVICE_URL=http://agent:8000
    depends_on:
      - mysql

  agent:
    build: ./agent-service
    ports:
      - "8000:8000"
    environment:
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - DATABASE_URL=mysql+pymysql://pp_app:pp_dev_pwd@mysql:3306/personal_profile
      - CHECKPOINT_DB=sqlite:///checkpoints.db
    depends_on:
      - mysql

  mysql:
    image: mysql:8
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=root_pwd
      - MYSQL_DATABASE=personal_profile
      - MYSQL_USER=pp_app
      - MYSQL_PASSWORD=pp_dev_pwd
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

## 分阶段交付

| 阶段 | 能力 | 预估工作量 |
|------|------|------------|
| Phase 1 | Python 服务搭建 + LangGraph 基础 + DeepSeek 调用 + 简单对话 | 2-3 天 |
| Phase 2 | 读取画像 + 目标 → 生成计划（替换现有 mock） | 2 天 |
| Phase 3 | 面试复盘分析 → 更新画像/生成改进计划 | 2-3 天 |
| Phase 4 | 进度跟踪 → 周复盘 → 调整计划建议 | 2-3 天 |
| Phase 5 | 对话历史持久化 + 历史回顾 UI | 2 天 |
| Phase 6 | Agent 长期记忆 + 个性化响应 | 3 天 |

## 暂不实现

- 发送提醒（`send_reminder`）
- 搜索外部学习资源
- 多 Agent 协作（MVP 用单 Agent + 多工具）
