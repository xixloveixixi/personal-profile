import { hybridSearch } from '@/lib/ai/hybrid-search'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 })
    }

    const userMessage = messages[messages.length - 1].content

    // 1. 搜索相关知识
    let context = ''
    try {
      const similarChunks = await hybridSearch(userMessage, 3)
      if (similarChunks.length > 0) {
        context = similarChunks
          .map((chunk) => `[来源: ${chunk.metadata.title || chunk.metadata.type}]\n${chunk.content}`)
          .join('\n\n---\n\n')
      }
    } catch (error) {
      console.error('Knowledge search error:', error)
    }

    // 2. 构建系统提示词
    const systemPrompt = `你是阿菥的个人AI助手，名字叫"小菥"。你只能基于下面提供的背景信息回答问题，绝对不能编造、推测或使用任何背景信息之外的内容。

${context ? `背景信息（这是唯一的信息来源，请严格遵循，一个字都不能编造）：\n${context}\n\n` : '（没有检索到相关信息）\n\n'}

回答要求（必须严格遵守）：
1. 只能使用上面背景信息中的内容回答，绝对不要编造、推测或使用任何背景信息之外的内容
2. 如果背景信息中没有答案，必须说"这个问题我不太清楚呢，你可以查看我的项目作品集或通过联系方式直接问我"
3. 直接回答问题，不要说"根据信息""资料显示""根据背景信息"这类话
4. 不要用 markdown 格式（如 **加粗**、*斜体*），用纯文本回答
5. 语气要像朋友聊天一样自然、亲切
6. 用中文回答，可以适当加一些表情符号让对话更生动

重要提示（请特别注意）：
- 如果用户问"毕业于哪个学校"或"就读于哪个大学"，必须在背景信息中查找"教育经历"、"学历"或"学校"相关的内容，如果找不到就说"不太清楚"
- 如果用户问"做过什么项目"或"有什么作品"，必须在背景信息中查找"项目经历"、"项目"或"作品"相关的内容，不要回答实习经历
- 如果用户问"实习经历"或"工作经历"，在背景信息中查找"工作经历"、"实习"或"timeline"相关的内容
- 如果背景信息中有相关内容，请直接回答，不要说"不太清楚"
- 如果背景信息中没有相关内容，绝对不要编造，必须说"不太清楚"`

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
        stream: false,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API 请求失败: ${response.status} ${errorText}`)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    return new Response(
      JSON.stringify({ content }), 
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error: any) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
