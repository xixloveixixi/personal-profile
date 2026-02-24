import { z } from 'zod'
import { allTools, getToolByName, parseToolParams, Tool } from './tools'
import { agentErrorHandler } from './error-handler'
import { HALLUCINATION_PREVENTION_PROMPT } from './hallucination-prevention'

/**
 * Agent 步骤记录
 */
export interface AgentStep {
  thought: string // 思考过程
  action: string // 行动指令
  observation?: string // 观察结果
}

/**
 * 解析后的 Action
 */
interface ParsedAction {
  type: 'tool' | 'finish'
  toolName?: string
  toolParams?: string
  answer?: string
  raw: string
}

/**
 * 个人 AI Agent - 基于 ReAct 范式
 */
export class PersonalAIAgent {
  private tools: Map<string, Tool>
  private maxIterations: number

  constructor(maxIterations = 5) {
    this.maxIterations = maxIterations
    this.tools = new Map()
    allTools.forEach((tool) => {
      this.tools.set(tool.name, tool)
    })
  }

  /**
   * 运行 Agent（非流式）
   */
  async run(userQuery: string, llmGenerate: (prompt: string) => Promise<string>): Promise<string> {
    const history: AgentStep[] = []

    for (let i = 0; i < this.maxIterations; i++) {
      // 1. Thought: LLM 分析当前状态，决定下一步
      const thought = await this.think(userQuery, history, llmGenerate)

      // 2. Action: 解析并执行工具调用
      const action = this.parseAction(thought)

      // 检查是否完成任务
      if (action.type === 'finish') {
        return action.answer || '任务完成'
      }

      // 3. Observation: 执行工具，获取结果
      const observation = await this.executeTool(action)

      // 记录步骤
      history.push({
        thought,
        action: action.raw,
        observation,
      })

      // 如果工具执行失败，提前结束
      if (observation.startsWith('错误:')) {
        return `工具执行失败: ${observation}`
      }
    }

    return '达到最大迭代次数，任务未完成。请尝试更具体的问题。'
  }

  /**
   * 流式运行 Agent
   */
  async *runStreaming(
    userQuery: string,
    llmGenerateStream: (prompt: string) => AsyncGenerator<string>
  ): AsyncGenerator<{ type: 'thought' | 'action' | 'observation' | 'final'; content: string }> {
    const history: AgentStep[] = []

    for (let i = 0; i < this.maxIterations; i++) {
      // 1. Thought
      let thought = ''
      for await (const chunk of llmGenerateStream(this.buildSystemPrompt(userQuery, history))) {
        thought += chunk
        yield { type: 'thought', content: chunk }
      }

      // 2. Action
      const action = this.parseAction(thought)

      if (action.type === 'finish') {
        yield { type: 'final', content: action.answer || '任务完成' }
        return
      }

      yield { type: 'action', content: action.raw }

      // 3. Observation
      const observation = await this.executeTool(action)
      yield { type: 'observation', content: observation }

      history.push({
        thought,
        action: action.raw,
        observation,
      })

      if (observation.startsWith('错误:')) {
        yield { type: 'final', content: `工具执行失败: ${observation}` }
        return
      }
    }

    yield { type: 'final', content: '达到最大迭代次数，任务未完成。' }
  }

  /**
   * 思考：生成下一步行动
   */
  private async think(
    query: string,
    history: AgentStep[],
    llmGenerate: (prompt: string) => Promise<string>
  ): Promise<string> {
    const prompt = this.buildSystemPrompt(query, history)
    
    // 使用错误处理器：带重试和超时保护
    return await agentErrorHandler.withRetry(
      async () => {
        return await agentErrorHandler.withTimeout(
          llmGenerate(prompt),
          60000, // 60秒超时
          '抱歉，思考过程超时，请稍后重试。'
        )
      },
      2, // 最多重试2次
      1000 // 初始延迟1秒
    ).catch(async (error) => {
      // 如果重试后仍然失败，使用错误处理
      return await agentErrorHandler.handleLLMError(error)
    })
  }

  /**
   * 构建系统提示词
   * 基于 Hello-Agents 的最佳实践设计
   */
  private buildSystemPrompt(query: string, history: AgentStep[]): string {
    const toolsDescription = allTools
      .map(
        (tool) => `
${tool.name}(${this.getToolParamsDescription(tool)}): ${tool.description}
   - 参数: ${this.formatToolParameters(tool)}`
      )
      .join('\n')

    const historyText =
      history.length > 0
        ? history
            .map(
              (step, i) => `
步骤 ${i + 1}:
Thought: ${step.thought}
Action: ${step.action}
Observation: ${step.observation || '等待执行...'}`
            )
            .join('\n\n')
        : '（这是第一步）'

    return `你是阿菥的个人 AI 助手，基于 ReAct 范式运行。

## 重要：你的身份
- **你的名字**：你是"阿菥的个人AI助手"或"阿菥的AI助手"
- **你不是**：你不是"小菥"，也不是"阿菥"本人，而是帮助用户了解阿菥信息的AI助手
- **你的职责**：帮助用户了解关于阿菥的信息，包括项目经验、技能、教育背景、博客内容等
- **回答方式**：当用户问"你是谁"时，你应该回答："我是阿菥的个人AI助手，可以帮助你了解关于阿菥的信息，比如项目经验、技能、教育背景等。有什么想了解的吗？"

## 你的任务
分析用户的请求，并使用可用工具一步步地解决问题。

       ## 项目信息优先级（重要！）
       当用户询问"写过什么项目"、"有哪些项目"、"项目作品"、"还有其他的项目吗"、"所有项目"等问题时：
       1. **使用作品集项目**：搜索时返回作品集中展示的项目（如 CQ Web、Cream Design 等）
       2. **获取所有项目**：当用户问"所有项目"或"还有哪些项目"时，必须使用 search_knowledge 工具，query 参数设置为"项目"，limit 参数设置为 10 或更大，以获取所有项目信息
       3. **回答格式**：列出所有找到的项目，包括项目名称、简介、技术栈等关键信息
       4. **完整性**：如果用户问"还有其他的项目吗"，说明之前可能只提到了部分项目，此时必须搜索获取所有项目并完整列出

## 经历信息搜索（重要！）
当用户询问"实习经历"、"工作经历"、"教育背景"等问题时：
1. **使用时间线数据**：这些信息存储在时间线（timeline）中，搜索时使用关键词如"实习"、"工作"、"经历"、"时间线"
2. **积极尝试搜索**：如果第一次搜索没结果，尝试不同的关键词组合：
   - "实习" → 尝试 "工作经历"、"实习经历"、"时间线"
   - "工作" → 尝试 "实习"、"工作经历"、"公司"
3. **不要过早放弃**：至少尝试 2-3 次不同的关键词组合

## 个人信息搜索（重要！）
当用户询问"联系方式"、"电话"、"邮箱"、"GitHub"、"个人信息"、"个人简介"等问题时：
1. **使用个人信息数据**：这些信息存储在个人信息（personal）中，搜索时使用关键词如"联系方式"、"联系"、"个人信息"、"个人简介"
2. **积极尝试搜索**：如果第一次搜索没结果，尝试不同的关键词组合：
   - "联系方式" → 尝试 "联系"、"个人信息"、"个人简介"
   - "电话" → 尝试 "联系方式"、"联系"、"个人信息"
   - "邮箱" → 尝试 "联系方式"、"email"、"联系"
3. **不要过早放弃**：至少尝试 2-3 次不同的关键词组合

## 可用工具
${toolsDescription}

4. finish(answer: string): 任务完成，输出最终答案
   - 当且仅当通过工具获得真实数据后，才能调用此工具
   - 参数: 你的最终答案

## ReAct 格式要求
每次回复必须严格遵循以下格式：

Thought: [分析当前状态，决定下一步行动]
Action: [工具调用，格式为 tool_name(param="value")]

## 示例
示例1: 用户: "你是谁"

Thought: 用户问我的身份。我应该直接回答我是阿菥的个人AI助手，不需要使用工具。
Action: finish(answer="我是阿菥的个人AI助手，可以帮助你了解关于阿菥的信息，比如项目经验、技能、教育背景、博客内容等。有什么想了解的吗？")

示例2: 用户: "介绍一下你的 React 项目经验" 或 "介绍一下阿菥的 React 项目经验"

Thought: 用户想了解阿菥的 React 项目经验。我需要先搜索知识库中关于 React 的项目信息。
Action: search_knowledge(query="React 项目")

Observation: [知识库返回结果...]

Thought: 已获取到 React 相关项目信息，可以给出完整回答。
Action: finish(answer="根据知识库信息，阿菥有多个 React 项目经验，包括...")

示例3: 用户: "介绍一下他的 React 项目的技术栈"

Thought: 用户想了解 React 项目的技术栈。我应该先搜索 React 相关的项目信息。
Action: search_knowledge(query="React")

Observation: [如果没找到结果或结果不完整...]

Thought: 第一次搜索可能关键词不够准确，尝试更具体的关键词。
Action: search_knowledge(query="React 技术栈")

Observation: [如果还是没找到...]

Thought: 尝试搜索项目相关的信息，可能技术栈信息在项目详情中。
Action: search_knowledge(query="项目 技术")

Observation: [获取到结果...]

Thought: 已获取到相关信息，可以给出回答。
Action: finish(answer="根据知识库中的项目信息，阿菥的 React 项目技术栈包括...")

## 当前状态
用户问题: ${query}

${history.length > 0 ? `历史步骤:\n${historyText}\n\n` : ''}## 重要约束
- **身份约束**：你始终是"阿菥的个人AI助手"，不是"小菥"，也不是"阿菥"本人。回答时使用第三人称"阿菥"或"他/她"，不要使用第一人称"我"来指代阿菥
- **工具使用**：你只能使用列出的工具，不能编造工具
- **错误处理**：如果工具返回错误，必须如实反馈给用户
- **禁止编造**：不得编造或猜测工具调用的结果
- **数据验证**：当且仅当通过工具获得真实数据后，才能给出最终答案

## 搜索策略（重要！）
- **必须积极尝试搜索**：如果第一次搜索没有找到相关信息，必须尝试不同的关键词
- **关键词变体**：尝试同义词、相关词、更具体或更宽泛的查询
  - 例如：如果搜索"React 项目"没结果，尝试"React"、"React技术栈"、"前端项目"、"组件库"等
  - 例如：如果搜索"技术栈"没结果，尝试具体技术名称如"React"、"TypeScript"、"Next.js"等
- **多次尝试**：至少尝试 2-3 次不同的关键词组合，不要过早放弃
- **组合搜索**：可以结合多个关键词，如"React 技术栈"、"React 项目 技术"
- **只有在多次尝试（至少3次）都失败后**，才使用 finish(answer="这个问题我不太清楚呢，你可以查看我的项目作品集或通过联系方式直接问我")

${HALLUCINATION_PREVENTION_PROMPT}

现在请开始思考并行动：`
  }

  /**
   * 解析 Action
   */
  private parseAction(thought: string): ParsedAction {
    // 提取 Action 行
    const actionMatch = thought.match(/Action:\s*(.+)/i)
    if (!actionMatch) {
      return {
        type: 'finish',
        answer: '未找到有效的 Action，直接回答用户问题',
        raw: thought,
      }
    }

    const actionStr = actionMatch[1].trim()

    // 检查是否是 finish
    const finishMatch = actionStr.match(/finish\(answer="([^"]+)"\)/i)
    if (finishMatch) {
      return {
        type: 'finish',
        answer: finishMatch[1],
        raw: actionStr,
      }
    }

    // 解析工具调用: tool_name(param="value")
    const toolMatch = actionStr.match(/(\w+)\((.*)\)/)
    if (!toolMatch) {
      return {
        type: 'finish',
        answer: 'Action 格式错误，无法解析工具调用',
        raw: actionStr,
      }
    }

    const toolName = toolMatch[1]
    const toolParams = toolMatch[2]

    return {
      type: 'tool',
      toolName,
      toolParams,
      raw: actionStr,
    }
  }

  /**
   * 执行工具（带多层防护）
   * 基于 Hello-Agents 的可靠性设计
   */
  private async executeTool(action: ParsedAction): Promise<string> {
    if (action.type !== 'tool' || !action.toolName) {
      return '错误: 无效的工具调用'
    }

    const tool = getToolByName(action.toolName)
    if (!tool) {
      return `错误: 未找到工具 "${action.toolName}"。可用工具: ${allTools.map((t) => t.name).join(', ')}`
    }

    return await this.executeToolWithValidation(tool, action.toolParams || '{}')
  }

  /**
   * 带多层防护的工具执行
   * 1. 解析参数
   * 2. Schema 验证
   * 3. 执行工具（带超时和重试）
   * 4. 结果验证
   * 5. 错误日志记录
   */
  private async executeToolWithValidation(
    tool: Tool,
    rawParams: string
  ): Promise<string> {
    return await agentErrorHandler.safeExecute(
      async () => {
        // 1. 解析参数
        const params = parseToolParams(rawParams)

        // 2. Schema 验证
        const validated = tool.parameters.parse(params)

        // 3. 执行工具（带超时保护，30秒超时）
        const result = await agentErrorHandler.withTimeout(
          tool.execute(validated),
          30000, // 30秒超时
          `错误: 工具 "${tool.name}" 执行超时`
        )

        // 4. 结果验证
        if (result.startsWith('错误:')) {
          this.logToolError(tool.name, result)
        }

        return result
      },
      await agentErrorHandler.handleToolError(
        new Error('工具执行失败'),
        tool.name
      ),
      `工具 "${tool.name}" 执行失败`
    )
  }

  /**
   * 记录工具错误日志（使用统一的错误处理器）
   */
  private logToolError(toolName: string, errorMessage: string, error?: any): void {
    const err = error || new Error(errorMessage)
    agentErrorHandler.handleToolError(err, toolName)
  }

  /**
   * 获取工具参数描述
   */
  private getToolParamsDescription(tool: Tool): string {
    if (tool.parameters instanceof z.ZodObject) {
      const shape = tool.parameters.shape
      return Object.keys(shape)
        .map((key) => {
          const field = shape[key]
          const isOptional = field.isOptional()
          return isOptional ? `${key}?` : key
        })
        .join(', ')
    }
    return '...'
  }

  /**
   * 格式化工具参数说明
   */
  private formatToolParameters(tool: Tool): string {
    if (tool.parameters instanceof z.ZodObject) {
      const shape = tool.parameters.shape
      return Object.entries(shape)
        .map(([key, schema]: [string, any]) => {
          const description = schema._def?.description || '无描述'
          const isOptional = schema.isOptional()
          return `  - ${key}${isOptional ? ' (可选)' : ''}: ${description}`
        })
        .join('\n')
    }
    return '无参数'
  }
}

