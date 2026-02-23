import { searchSimilarVectors } from '@/lib/ai/vector-store'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 })
    }

    const userMessage = messages[messages.length - 1].content

    // 1. 向量检索相关上下文
    let context = ''
    try {
      const similarChunks = await searchSimilarVectors(userMessage, 3)
      if (similarChunks.length > 0) {
        context = similarChunks
          .map((chunk) => `[来源: ${chunk.metadata.title || chunk.metadata.type}]\n${chunk.content}`)
          .join('\n\n---\n\n')
      }
    } catch (error) {
      console.error('Vector search error:', error)
    }

    // 2. 构建系统提示词
    const systemPrompt = `你是阿菥的个人AI助手。你的任务是基于以下知识库信息，友好、准确地回答关于阿菥的问题。

${context ? `相关上下文信息：\n${context}\n\n` : ''}

回答要求：
1. 基于提供的上下文信息回答，不要编造信息
2. 如果问题超出知识库范围，礼貌地说明
3. 语气友好、自然，像朋友聊天一样
4. 可以适当补充一些合理的建议或观点
5. 用中文回答

如果用户问的问题在知识库中没有相关信息，你可以说："这个问题超出了我的知识范围，但你可以通过以下方式了解更多：
- 查看我的项目作品集
- 阅读我的技术博客
- 通过联系方式直接联系我"`

    // 3. 格式化消息
    const formattedMessages = messages.slice(-10).map((msg: any) => {
      let content = ''
      
      if (typeof msg.content === 'string') {
        content = msg.content
      } else if (Array.isArray(msg.content)) {
        const textPart = msg.content.find((item: any) => item.type === 'text')
        content = textPart?.text || ''
      } else {
        content = String(msg.content || '')
      }
      
      return {
        role: msg.role,
        content: content,
      }
    })

    // 4. 调用 DeepSeek API
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY 未配置')
    }
    
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
        temperature: 0.7,
        stream: true,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API 请求失败: ${response.status} ${errorText}`)
    }
    
    // 5. 转换为 AI SDK 兼容的数据流格式 (v1.x)
    // 格式: 0:"文本内容" 或 0:{"type":"text","text":"内容"}
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    const stream = response.body!
    
    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader()
        let buffer = ''
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith('data: ')) continue
              
              const dataStr = trimmed.slice(6)
              if (dataStr === '[DONE]') continue
              
              try {
                const chunk = JSON.parse(dataStr)
                const content = chunk.choices?.[0]?.delta?.content
                
                if (content && typeof content === 'string') {
                  // AI SDK v1.x 格式: 0:{"text":"内容"} - text 字段必须是字符串
                  const data = JSON.stringify({ text: content })
                  controller.enqueue(encoder.encode(`0:${data}\n`))
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
          
          // 发送结束标记
          controller.enqueue(encoder.encode('0:{"finishReason":"stop"}\n'))
        } catch (error) {
          console.error('Stream error:', error)
        } finally {
          controller.close()
        }
      },
    })
    
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1',
      },
    })
    
  } catch (error: any) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
