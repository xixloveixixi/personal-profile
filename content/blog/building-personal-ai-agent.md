---
title: 从零到一：为个人作品集网站构建AI聊天助手
date: 2025-01-XX
tags: ['Next.js', 'AI', 'RAG', 'DeepSeek', 'Supabase']
description: 记录如何为个人作品集网站添加一个基于RAG的AI聊天助手，包括技术选型、实现过程和踩坑经验
---

## 前言

作为一个前端开发者，我一直想为自己的个人作品集网站添加一个AI助手，让访客可以通过对话了解我的技术背景、项目经验和博客内容。经过一番折腾，终于实现了一个基于RAG（检索增强生成）的聊天助手。这篇文章将详细记录整个实现过程，特别是那些让人头疼的坑。

## 项目目标

- 创建一个浮动聊天窗口，访客可以随时打开
- AI助手能够基于我的个人信息、项目经验、技能和博客内容回答问题
- 使用向量数据库实现语义搜索，提高回答准确性
- 不依赖OpenAI（因为地区限制），使用DeepSeek和阿里云服务

## 技术栈选择

### 前端框架
- **Next.js 14** (App Router) - 服务端渲染和API路由
- **React 18** - UI组件
- **Ant Design** - UI组件库
- **Framer Motion** - 动画效果

### AI相关
- **DeepSeek Chat API** - 对话模型（替代OpenAI）
- **阿里云通义千问** - 向量嵌入服务（替代OpenAI Embeddings）
- **Vercel AI SDK** (`@ai-sdk/react`) - 流式响应处理

### 数据存储
- **Supabase** - PostgreSQL数据库 + pgvector扩展（向量数据库）
- **Notion API** - 博客内容同步

## 架构设计

```
┌─────────────┐
│  前端界面   │  ChatWindow组件 (Ant Design Drawer)
└──────┬──────┘
       │ HTTP POST
       ▼
┌─────────────┐
│  API路由    │  /api/chat (流式响应)
└──────┬──────┘
       │
       ├─► 向量搜索 (Supabase)
       │   └─► 语义相似度匹配
       │
       ├─► DeepSeek API
       │   └─► 流式对话生成
       │
       └─► 知识库
           ├─► 个人信息 (JSON)
           ├─► 项目经验 (JSON)
           ├─► 技能列表 (JSON)
           └─► 博客内容 (Notion API)
```

## 实现步骤

### 1. 知识库构建

首先需要将各种数据源整合成统一的知识库：

```typescript
// lib/ai/knowledge-base.ts
export async function buildKnowledgeBase() {
  const chunks: KnowledgeChunk[] = []
  
  // 1. 个人信息
  const personalInfo = await loadPersonalInfo()
  chunks.push(...splitIntoChunks(personalInfo, 'personal'))
  
  // 2. 项目经验
  const projects = await loadProjects()
  chunks.push(...splitIntoChunks(projects, 'project'))
  
  // 3. 技能列表
  const skills = await loadSkills()
  chunks.push(...splitIntoChunks(skills, 'skill'))
  
  // 4. Notion博客
  const blogPosts = await fetchNotionPosts()
  chunks.push(...splitIntoChunks(blogPosts, 'blog'))
  
  return chunks
}
```

### 2. 向量化存储

使用阿里云通义千问生成向量嵌入，存储到Supabase：

```typescript
// lib/ai/vector-store.ts
async function generateEmbeddingAlibaba(text: string): Promise<number[]> {
  const response = await fetch(`${baseURL}/services/embeddings/text-embedding/text-embedding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-v1',
      input: { texts: [text] },
    }),
  })
  
  const data = await response.json()
  return data.output.embeddings[0].embedding
}

async function storeVectors(chunks: KnowledgeChunk[]) {
  for (const chunk of chunks) {
    const embedding = await generateEmbeddingAlibaba(chunk.content)
    await supabase.from('knowledge_vectors').insert({
      content: chunk.content,
      metadata: chunk.metadata,
      embedding: embedding,
    })
  }
}
```

### 3. 向量搜索

使用Supabase的pgvector扩展进行相似度搜索：

```typescript
export async function searchSimilarVectors(
  query: string,
  limit = 5
) {
  // 生成查询向量
  const queryEmbedding = await generateEmbedding(query)
  
  // 使用RPC函数进行向量搜索
  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: queryEmbedding,
    match_threshold: 0.0,
    match_count: limit,
  })
  
  if (error) {
    // 降级到文本搜索
    return await searchByText(query, limit)
  }
  
  return data || []
}
```

**注意**：这里有一个坑！Supabase的RPC函数名是 `match_knowledge`，不是 `match_knowledge_sql`。如果函数名不对，会报错：
```
Could not find the function public.match_knowledge_sql(...)
```

### 4. 聊天API实现

这是最复杂的部分，需要处理流式响应：

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json()
  const userMessage = messages[messages.length - 1].content
  
  // 1. 向量检索相关上下文
  const similarChunks = await searchSimilarVectors(userMessage, 3)
  const context = similarChunks
    .map((chunk) => `[来源: ${chunk.metadata.title}]\n${chunk.content}`)
    .join('\n\n---\n\n')
  
  // 2. 构建系统提示词
  const systemPrompt = `你是阿菥的个人AI助手...
${context ? `相关上下文信息：\n${context}\n\n` : ''}`
  
  // 3. 调用DeepSeek API
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedMessages,
      ],
      stream: true,
    }),
  })
  
  // 4. 转换流式响应格式...
}
```

### 5. 前端聊天界面

使用Ant Design的Drawer组件创建浮动聊天窗口：

```typescript
// components/chat/ChatWindow.tsx
export default function ChatWindow() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  
  const handleSubmit = async (e?: React.FormEvent) => {
    const response = await fetch('/api/chat-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })
    
    const data = await response.json()
    setMessages((prev) => [...prev, {
      role: 'assistant',
      content: data.content,
    }])
  }
  
  return (
    <>
      <Button
        type="primary"
        shape="circle"
        icon={<MessageOutlined />}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6"
      />
      <Drawer
        title="阿菥的AI助手"
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
      >
        {/* 消息列表和输入框 */}
      </Drawer>
    </>
  )
}
```

## 踩坑记录

### 坑1: "text" parts expect a string value

这是最让人头疼的错误！在使用Vercel AI SDK的 `useChat` hook时，一直报这个错误：

```
Chat error: Error: "text" parts expect a string value.
```

**问题原因**：
- DeepSeek API返回的是标准的Chat Completions流格式（SSE格式）
- Vercel AI SDK的 `useChat` 期望的是特定的Data Stream Protocol格式
- 两者格式不兼容

**尝试过的方案**：

1. **使用 `@ai-sdk/openai` 包装DeepSeek**
   ```typescript
   const deepseekProvider = createOpenAI({
     baseURL: 'https://api.deepseek.com/v1',
     apiKey: process.env.DEEPSEEK_API_KEY,
   })
   ```
   问题：`@ai-sdk/openai` 期望Responses API格式，而DeepSeek返回的是Chat Completions格式

2. **使用 `textDelta` 字段**
   ```typescript
   const data = JSON.stringify({ 
     type: 'text-delta', 
     textDelta: content 
   })
   ```
   问题：仍然报错

3. **使用 `delta` 字段**
   ```typescript
   const data = JSON.stringify({ 
     type: 'text-delta', 
     delta: content 
   })
   ```
   问题：仍然报错

4. **使用 `text` 字段**
   ```typescript
   const data = JSON.stringify({ text: content })
   ```
   问题：仍然报错

**最终解决方案**：

经过多次尝试，发现正确的格式应该是：

```typescript
// AI SDK v1.x 格式
const data = JSON.stringify({ text: content })
controller.enqueue(encoder.encode(`0:${data}\n`))
```

但关键是要确保：
1. 使用 `text` 字段（不是 `textDelta` 或 `delta`）
2. 格式为 `0:{"text":"内容"}\n`（不是 `0:{"type":"text-delta","text":"内容"}\n`）
3. 添加正确的响应头：`'x-vercel-ai-data-stream': 'v1'`

完整代码：

```typescript
const readableStream = new ReadableStream({
  async start(controller) {
    const reader = stream.getReader()
    let buffer = ''
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        if (line.trim().startsWith('data: ')) {
          const dataStr = line.trim().slice(6)
          if (dataStr === '[DONE]') continue
          
          try {
            const chunk = JSON.parse(dataStr)
            const content = chunk.choices?.[0]?.delta?.content
            
            if (content && typeof content === 'string') {
              // 关键：使用 text 字段，格式为 0:{"text":"内容"}\n
              const data = JSON.stringify({ text: content })
              controller.enqueue(encoder.encode(`0:${data}\n`))
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
    
    controller.enqueue(encoder.encode('0:{"finishReason":"stop"}\n'))
    controller.close()
  },
})

return new Response(readableStream, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'x-vercel-ai-data-stream': 'v1', // 关键：添加这个响应头
  },
})
```

### 坑2: Supabase RPC函数名错误

错误信息：
```
Could not find the function public.match_knowledge_sql(...)
```

**解决方案**：
将函数名从 `match_knowledge_sql` 改为 `match_knowledge`（Supabase提示的正确函数名）

### 坑3: Edge Runtime不支持Node.js模块

错误信息：
```
Module not found: Can't resolve 'http'
```

**原因**：
Edge Runtime不支持Node.js内置模块（如 `http`、`https`、`net`等），而代理库（`https-proxy-agent`、`socks-proxy-agent`）依赖这些模块。

**解决方案**：
移除 `export const runtime = 'edge'`，使用Node.js Runtime：

```typescript
// 不要使用 Edge Runtime
// export const runtime = 'edge'
```

### 坑4: 文本搜索准确性不足

**问题**：
当向量搜索失败时，降级到文本搜索，但简单的关键词匹配准确性不高。

**解决方案**：
实现改进的文本搜索算法，包括：
- 同义词映射（如"学校"匹配"大学"、"毕业"等）
- 类型权重提升（问"学校"时优先返回教育相关内容）
- 短语匹配（完整查询短语匹配权重更高）

```typescript
// 同义词映射
const synonymMap: Record<string, string[]> = {
  '学校': ['大学', '院校', '高校', '毕业', '就读', '教育'],
  '项目': ['作品', '作品集', '开发', '开发项目'],
  // ...
}

// 扩展查询词
const expandedWords = new Set(queryWords)
queryWords.forEach(word => {
  Object.entries(synonymMap).forEach(([key, synonyms]) => {
    if (word.includes(key)) {
      synonyms.forEach(syn => expandedWords.add(syn))
    }
  })
})
```

### 坑5: API URL错误

**问题**：
DeepSeek API的URL应该是 `https://api.deepseek.com/v1/chat/completions`，不是 `https://api.deepseek.com/chat/completions`

**解决方案**：
确保使用正确的API路径，包含 `/v1` 前缀。

## 最终效果

经过一系列调试和优化，最终实现了一个功能完整的AI聊天助手：

1. ✅ 浮动聊天按钮，随时可以打开
2. ✅ 基于向量数据库的语义搜索
3. ✅ 准确的回答（基于知识库，不编造信息）
4. ✅ 流式响应（实时显示AI回复）
5. ✅ 优雅的UI（Ant Design + Framer Motion动画）

## 总结

这个项目让我深刻体会到了几个关键点：

1. **API格式兼容性很重要**：不同AI服务提供商的API格式可能不同，需要仔细处理
2. **错误信息要仔细看**：`"text" parts expect a string value` 这个错误提示其实已经说明了问题所在
3. **降级方案很重要**：向量搜索失败时，文本搜索作为降级方案保证了功能的可用性
4. **调试要有耐心**：遇到复杂问题时，需要逐步排查，不能急躁

希望这篇文章能帮助到想要实现类似功能的朋友们！如果遇到问题，欢迎在评论区讨论。

## 相关资源

- [Vercel AI SDK 文档](https://sdk.vercel.ai/docs)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs/)
- [Supabase pgvector 文档](https://supabase.com/docs/guides/database/extensions/pgvector)
- [阿里云通义千问文档](https://help.aliyun.com/zh/model-studio/)

---

**作者**：阿菥  
**日期**：2025年1月  
**标签**：Next.js, AI, RAG, DeepSeek, Supabase

