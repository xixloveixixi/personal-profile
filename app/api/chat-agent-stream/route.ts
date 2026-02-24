import { PersonalAIAgent } from '@/lib/ai/agent-core'

/**
 * 流式 LLM 生成函数
 */
async function* generateLLMStream(prompt: string): AsyncGenerator<string> {
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
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      stream: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek API 请求失败: ${response.status} ${errorText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法获取响应流')
  }

  const decoder = new TextDecoder()
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
            yield content
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * 格式化流式数据
 */
function formatStreamData(data: {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'answer'
  content?: string
  tool?: string
  params?: string
  preview?: string
}): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 })
    }

    const userMessage = messages[messages.length - 1].content

    // 创建 Agent 实例
    const agent = new PersonalAIAgent(5) // 最多5次迭代

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          // 流式返回每个步骤
          for await (const step of agent.runStreaming(userMessage, generateLLMStream)) {
            if (step.type === 'thought') {
              // 思考过程
              controller.enqueue(
                encoder.encode(
                  formatStreamData({
                    type: 'thinking',
                    content: step.content,
                  })
                )
              )
            } else if (step.type === 'action') {
              // 工具调用
              // 解析工具名称和参数
              const actionMatch = step.content.match(/(\w+)\((.*)\)/)
              const toolName = actionMatch ? actionMatch[1] : 'unknown'
              const params = actionMatch ? actionMatch[2] : ''

              controller.enqueue(
                encoder.encode(
                  formatStreamData({
                    type: 'tool_call',
                    tool: toolName,
                    params: params,
                    content: step.content,
                  })
                )
              )
            } else if (step.type === 'observation') {
              // 工具执行结果
              controller.enqueue(
                encoder.encode(
                  formatStreamData({
                    type: 'tool_result',
                    preview: step.content.slice(0, 200), // 预览前200字符
                    content: step.content,
                  })
                )
              )
            } else if (step.type === 'final') {
              // 最终答案
              controller.enqueue(
                encoder.encode(
                  formatStreamData({
                    type: 'answer',
                    content: step.content,
                  })
                )
              )
            }
          }

          // 发送结束标记
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (error: any) {
          console.error('Stream error:', error)
          controller.enqueue(
            encoder.encode(
              formatStreamData({
                type: 'answer',
                content: `错误: ${error.message || '未知错误'}`,
              })
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Agent Stream API error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

