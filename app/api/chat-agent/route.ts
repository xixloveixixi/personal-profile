import { PersonalAIAgent } from '@/lib/ai/agent-core'
import { agentErrorHandler } from '@/lib/ai/error-handler'

/**
 * LLM 生成函数（非流式，带错误处理）
 */
async function generateLLMResponse(prompt: string): Promise<string> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 未配置')
  }

  // 使用错误处理器的安全执行和重试机制
  return await agentErrorHandler.withRetry(
    async () => {
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
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`DeepSeek API 请求失败: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || ''
    },
    2, // 最多重试2次
    1000 // 初始延迟1秒
  ).catch(async (error) => {
    // 如果重试后仍然失败，使用错误处理
    return await agentErrorHandler.handleLLMError(error)
  })
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

    // 运行 Agent
    const result = await agent.run(userMessage, generateLLMResponse)

    return new Response(
      JSON.stringify({
        content: result,
        type: 'agent', // 标识这是 Agent 模式
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Agent API error:', error)
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

