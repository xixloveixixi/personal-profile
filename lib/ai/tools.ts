import { z } from 'zod'
import { hybridSearch } from './hybrid-search'
import { getAllProjects } from '@/lib/content/projects'
import skillsData from '@/content/about/skills.json'
import { agentErrorHandler } from './error-handler'
import { formatToolResponseWithSource } from './hallucination-prevention'

/**
 * 工具接口定义
 */
export interface Tool {
  name: string
  description: string
  parameters: z.ZodSchema
  execute: (params: any) => Promise<string>
}

/**
 * 格式化搜索结果
 * 优先展示作品集项目
 */
function formatSearchResults(
  results: Array<{ content: string; metadata: any; similarity: number }>,
  query?: string
): string {
  if (results.length === 0) {
    return '未找到相关信息'
  }

  // 分离作品集项目和其他内容
  const portfolioProjects: Array<{ content: string; metadata: any; similarity: number }> = []
  const others: Array<{ content: string; metadata: any; similarity: number }> = []
  
  for (const result of results) {
    const source = result.metadata?.source || ''
    if (source.includes('/portfolio/')) {
      portfolioProjects.push(result)
    } else {
      others.push(result)
    }
  }
  
  // 优先返回作品集项目
  let finalResults = [...portfolioProjects, ...others]
  
  // 限制结果数量（如果查询包含"所有"、"全部"，使用更大的限制）
  const queryLower = (query || '').toLowerCase()
  const isAllQuery = (queryLower.includes('所有') || queryLower.includes('全部') || queryLower.includes('还有')) && 
                     (queryLower.includes('项目') || queryLower.includes('作品'))
  const maxResults = isAllQuery ? 20 : 5
  finalResults = finalResults.slice(0, maxResults)

  return finalResults
    .map((result, index) => {
      const source = result.metadata.title || result.metadata.type || '未知来源'
      const sourceUrl = result.metadata.source || ''
      // 如果是作品集项目，标注为"作品集项目"
      const sourceLabel = sourceUrl.includes('/portfolio/') 
        ? `作品集项目: ${source}` 
        : `来源: ${source}`
      return `[${index + 1}] ${sourceLabel}\n相似度: ${(result.similarity * 100).toFixed(1)}%\n内容: ${result.content}\n`
    })
    .join('\n---\n\n')
}

/**
 * 工具 1: 知识库搜索
 */
export const searchKnowledgeTool: Tool = {
  name: 'search_knowledge',
  description: '搜索个人知识库，查询项目经验、技能、教育背景、博客等内容。这是最常用的工具，用于获取关于阿菥的各种信息。支持多种搜索方式：可以搜索技术名称（如"React"、"TypeScript"）、项目名称、技能名称等。如果第一次搜索没结果，尝试更宽泛或更具体的关键词。**重要**：当用户询问"所有项目"、"还有哪些项目"、"全部项目"时，应该使用较大的 limit（如 10 或 20）来获取所有项目信息。',
  parameters: z.object({
    query: z.string().describe('搜索关键词。可以是：技术名称（如"React"、"TypeScript"）、项目相关（如"React项目"、"技术栈"、"所有项目"、"全部项目"）、技能名称等。如果第一次搜索没结果，尝试不同的关键词组合。**重要**：如果用户问"所有项目"或"还有哪些项目"，使用"项目"作为关键词，并设置较大的 limit。'),
    limit: z.number().optional().default(5).describe('返回结果数量。默认5条。**重要**：当用户询问"所有项目"、"还有哪些项目"、"全部项目"时，应该使用 10 或 20 来获取所有项目。'),
  }),
  execute: async ({ query, limit = 5 }) => {
    // 如果查询包含"所有"、"全部"、"还有"等词，自动增加 limit
    const queryLower = query.toLowerCase()
    if ((queryLower.includes('所有') || queryLower.includes('全部') || queryLower.includes('还有')) && 
        (queryLower.includes('项目') || queryLower.includes('作品'))) {
      limit = Math.max(limit, 10) // 至少返回10个结果
    }
    // 使用错误处理器：向量搜索失败时降级到文本搜索
    const result = await agentErrorHandler.safeExecute(
      async () => {
        const results = await hybridSearch(query, limit)
        // 第一层防护：formatSearchResults 已经包含了来源信息
        // 每个结果都标注了来源，符合防幻觉要求
        // 传入 query 参数以便优先展示作品集项目
        return formatSearchResults(results, query)
      },
      formatSearchResults(
        await agentErrorHandler.handleVectorSearchError(query, limit),
        query
      ),
      `搜索 "${query}" 失败`
    )
    
    return result
  },
}

/**
 * 工具 2: 项目详情查询
 */
export const getProjectDetailTool: Tool = {
  name: 'get_project_detail',
  description: '获取特定项目的详细信息，包括技术栈、解决的问题、挑战、成果等。',
  parameters: z.object({
    projectName: z.string().describe('项目名称，例如："CQ Web"、"Cream Design"等'),
  }),
  execute: async ({ projectName }) => {
    try {
      const projects = getAllProjects()
      const project = projects.find(
        (p) =>
          p.title.toLowerCase().includes(projectName.toLowerCase()) ||
          p.slug.toLowerCase().includes(projectName.toLowerCase())
      )

      if (!project) {
        return `错误: 未找到项目 "${projectName}"。可用项目: ${projects.map((p) => p.title).join(', ')}`
      }

      const answer = `项目名称: ${project.title}
简介: ${project.shortDescription}
${project.longDescription ? `详细介绍: ${project.longDescription}\n` : ''}
${project.problem ? `解决的问题: ${project.problem}\n` : ''}
${project.solution ? `解决方案: ${project.solution}\n` : ''}
${project.challenges ? `技术挑战: ${project.challenges}\n` : ''}
${project.results ? `项目成果: ${project.results}\n` : ''}
技术栈: ${project.technologies.join(', ')}
${project.githubUrl ? `GitHub: ${project.githubUrl}\n` : ''}
${project.demoUrl ? `Demo: ${project.demoUrl}\n` : ''}`
      
      // 第一层防护：添加来源信息
      return formatToolResponseWithSource(answer, [
        `项目数据: ${project.title}`,
        project.githubUrl || '',
        project.demoUrl || '',
      ].filter(Boolean))
    } catch (error: any) {
      return `错误: 获取项目详情失败 - ${error.message}`
    }
  },
}

/**
 * 工具 3: 技能详情查询
 */
export const getSkillInfoTool: Tool = {
  name: 'get_skill_info',
  description: '获取特定技能的详细信息，包括熟练程度、相关描述等。',
  parameters: z.object({
    skillName: z.string().describe('技能名称，例如："React"、"TypeScript"、"Next.js"等'),
  }),
  execute: async ({ skillName }) => {
    try {
      const skill = skillsData.find(
        (s) =>
          s.name.toLowerCase().includes(skillName.toLowerCase()) ||
          skillName.toLowerCase().includes(s.name.toLowerCase())
      )

      if (!skill) {
        return `错误: 未找到技能 "${skillName}"。可用技能: ${skillsData.map((s) => s.name).join(', ')}`
      }

      const answer = `技能名称: ${skill.name}
分类: ${skill.category}
熟练程度: ${skill.proficiency}%
描述: ${skill.description}`
      
      // 第一层防护：添加来源信息
      return formatToolResponseWithSource(answer, [
        `技能数据: ${skill.name}`,
        `分类: ${skill.category}`,
      ])
    } catch (error: any) {
      return `错误: 获取技能信息失败 - ${error.message}`
    }
  },
}

/**
 * 所有可用工具
 */
export const allTools: Tool[] = [
  searchKnowledgeTool,
  getProjectDetailTool,
  getSkillInfoTool,
]

/**
 * 根据名称获取工具
 */
export function getToolByName(name: string): Tool | undefined {
  return allTools.find((tool) => tool.name === name)
}

/**
 * 解析工具调用参数
 */
export function parseToolParams(rawParams: string): Record<string, any> {
  try {
    // 尝试解析 JSON 格式
    if (rawParams.trim().startsWith('{')) {
      return JSON.parse(rawParams)
    }

    // 解析 key="value" 格式
    const params: Record<string, any> = {}
    const regex = /(\w+)="([^"]+)"/g
    let match

    while ((match = regex.exec(rawParams)) !== null) {
      const key = match[1]
      const stringValue = match[2]

      // 尝试转换为数字
      let value: string | number = stringValue
      if (!isNaN(Number(stringValue))) {
        value = Number(stringValue)
      }

      params[key] = value
    }

    return params
  } catch (error) {
    throw new Error(`参数解析失败: ${rawParams}`)
  }
}

