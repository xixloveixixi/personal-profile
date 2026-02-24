# ReAct Agent 使用说明

## 概述

现在你的项目已经实现了基于 ReAct 范式的 AI Agent！Agent 可以：
- 自主思考并决定下一步行动
- 调用工具获取信息
- 多步推理解决复杂问题
- 透明展示思考过程

## 架构说明

### 核心组件

1. **`lib/ai/agent-core.ts`** - ReAct Agent 核心逻辑
   - `PersonalAIAgent` 类：实现 Thought-Action-Observation 循环
   - 支持流式和非流式两种模式

2. **`lib/ai/tools.ts`** - 工具定义
   - `search_knowledge`: 搜索知识库
   - `get_project_detail`: 获取项目详情
   - `get_skill_info`: 获取技能信息

3. **`app/api/chat-agent/route.ts`** - Agent API 路由

### ReAct 循环流程

```
用户问题
  ↓
Thought: 分析问题，决定需要什么工具
  ↓
Action: 调用工具（如 search_knowledge）
  ↓
Observation: 获取工具返回结果
  ↓
Thought: 基于结果继续思考
  ↓
Action: finish(answer="最终答案")
  ↓
返回答案
```

## API 使用

### 非流式模式（当前实现）

```typescript
POST /api/chat-agent
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "介绍一下你的 React 项目经验"
    }
  ]
}

// 响应
{
  "content": "我有多个 React 项目经验...",
  "type": "agent"
}
```

### 与简单 RAG 模式对比

| 特性 | `/api/chat-simple` | `/api/chat-agent` |
|------|-------------------|-------------------|
| 模式 | 简单 RAG | ReAct Agent |
| 推理能力 | 单步 | 多步 |
| 工具调用 | ❌ | ✅ |
| 思考过程 | ❌ | ✅ |
| 适用场景 | 简单问答 | 复杂查询 |

## 工具说明

### 1. search_knowledge

搜索个人知识库，支持向量搜索和关键词搜索。

**参数：**
- `query` (必需): 搜索关键词
- `limit` (可选): 返回结果数量，默认 3

**示例：**
```
Action: search_knowledge(query="React项目", limit=3)
```

### 2. get_project_detail

获取特定项目的详细信息。

**参数：**
- `projectName` (必需): 项目名称

**示例：**
```
Action: get_project_detail(projectName="CQ Web")
```

### 3. get_skill_info

获取特定技能的详细信息。

**参数：**
- `skillName` (必需): 技能名称

**示例：**
```
Action: get_skill_info(skillName="React")
```

## 前端集成

### 方式1: 修改现有 ChatWindow

在 `components/chat/ChatWindow.tsx` 中，可以添加一个开关来选择使用 Agent 模式：

```typescript
const [useAgent, setUseAgent] = useState(false)

const apiEndpoint = useAgent ? '/api/chat-agent' : '/api/chat-simple'
```

### 方式2: 创建新的 AgentChatWindow

创建一个专门使用 Agent 的聊天组件，可以展示思考过程。

## 测试

### 测试简单问题
```
问题: "你好"
预期: Agent 直接使用 finish 回答，不需要工具
```

### 测试需要搜索的问题
```
问题: "你有哪些项目？"
预期: 
1. Thought: 需要搜索项目信息
2. Action: search_knowledge(query="项目")
3. Observation: [搜索结果]
4. Thought: 基于结果整理回答
5. Action: finish(answer="...")
```

### 测试复杂问题
```
问题: "你的 React 项目用了什么技术栈？"
预期:
1. Thought: 需要先找到 React 项目
2. Action: search_knowledge(query="React项目")
3. Observation: [找到项目列表]
4. Thought: 需要获取具体项目的技术栈
5. Action: get_project_detail(projectName="...")
6. Observation: [项目详情]
7. Action: finish(answer="...")
```

## 配置

### 环境变量

需要配置 `DEEPSEEK_API_KEY`（与简单模式相同）

### Agent 参数

在 `app/api/chat-agent/route.ts` 中可以调整：
- `maxIterations`: 最大迭代次数（默认 5）

## 优势

1. **多步推理**: 可以处理需要多个步骤的复杂问题
2. **工具调用**: 可以主动调用工具获取信息
3. **透明性**: 可以看到 Agent 的思考过程
4. **可扩展**: 可以轻松添加新工具

## 注意事项

1. **响应时间**: Agent 模式可能需要多次 LLM 调用，响应时间较长
2. **成本**: 每次迭代都会调用 LLM，成本较高
3. **错误处理**: 如果工具调用失败，Agent 会如实反馈

## 下一步

可以考虑：
1. 实现流式输出，实时展示思考过程
2. 添加更多工具（如 GitHub API、Notion API）
3. 实现记忆功能，记住对话历史
4. 添加工具调用的可视化界面

