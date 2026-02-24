import { searchSimilarVectors } from './vector-store'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase 客户端（延迟初始化，避免构建时缺少环境变量导致报错）
let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        '缺少 Supabase 环境变量。请在 Vercel 项目设置中配置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY'
      )
    }
    _supabase = createClient(supabaseUrl, supabaseServiceKey)
  }
  return _supabase
}

/**
 * 混合搜索：向量搜索 + 关键词搜索 + 子查询
 */
export async function hybridSearch(
  query: string,
  limit = 5
): Promise<Array<{ content: string; metadata: any; similarity: number }>> {
  // 1. 先尝试完整查询的向量搜索
  const vectorResults = await searchSimilarVectors(query, limit)
  
  // 2. 总是尝试关键词搜索（即使向量搜索有结果，也补充关键词结果）
  let keywordResults: Array<{ content: string; metadata: any; similarity: number }> = []
  keywordResults = await searchByKeywords(query, limit)
  
  // 3. 如果关键词搜索结果较少，尝试提取关键词进行子查询
  if (keywordResults.length < 2) {
    // 提取关键实体词
    const keyTerms = extractKeyTerms(query)
    for (const term of keyTerms.slice(0, 3)) { // 只尝试前3个关键词，避免过多查询
      const termResults = await searchByKeywords(term, 2)
      keywordResults.push(...termResults)
    }
  }
  
  // 合并结果，去重，并优先返回作品集项目
  const seen = new Set<string>()
  const combined: Array<{ content: string; metadata: any; similarity: number }> = []
  
  // 分离作品集项目和其他内容
  const portfolioProjects: Array<{ content: string; metadata: any; similarity: number }> = []
  const others: Array<{ content: string; metadata: any; similarity: number }> = []
  
  for (const r of [...vectorResults, ...keywordResults]) {
    if (seen.has(r.content)) continue
    seen.add(r.content)
    
    // 判断是否为作品集项目（source 包含 /portfolio/）
    const source = r.metadata?.source || ''
    if (source.includes('/portfolio/')) {
      // 作品集项目：提升优先级（相似度 +0.3）
      portfolioProjects.push({
        ...r,
        similarity: r.similarity + 0.3,
      })
    } else {
      others.push(r)
    }
  }
  
  // 按优先级排序：作品集项目 > 其他
  const sorted = [
    ...portfolioProjects.sort((a, b) => b.similarity - a.similarity),
    ...others.sort((a, b) => b.similarity - a.similarity),
  ]
  
  return sorted.slice(0, limit)
}

/**
 * 提取查询中的关键实体词
 */
function extractKeyTerms(query: string): string[] {
  const terms: string[] = []
  const queryLower = query.toLowerCase()
  
  // 技术栈相关 - 优先提取技术名称
  const techKeywords = ['react', 'vue', 'typescript', 'javascript', 'next.js', 'node.js', 'python', 'java']
  for (const tech of techKeywords) {
    if (queryLower.includes(tech)) {
      terms.push(tech)
      // 如果提到技术栈，也添加"项目"作为搜索词
      if (queryLower.includes('技术栈') || queryLower.includes('技术')) {
        terms.push('项目')
      }
    }
  }
  
  // 教育相关
  if (queryLower.includes('学校') || queryLower.includes('毕业') || queryLower.includes('大学')) {
    terms.push('学校', '毕业', '教育', '本科')
  }
  
  // 工作/实习相关
  if (queryLower.includes('实习') || queryLower.includes('工作') || queryLower.includes('公司') || queryLower.includes('经历')) {
    terms.push('实习', '工作', '公司', '经历', '时间线')
    // 如果提到实习，也添加相关关键词
    if (queryLower.includes('实习')) {
      terms.push('前端开发', '开发', '实习生')
    }
  }
  
  // 项目相关
  if (queryLower.includes('项目') || queryLower.includes('作品')) {
    terms.push('项目', '作品')
  }
  
  // 技能相关
  if (queryLower.includes('技术') || queryLower.includes('技能') || queryLower.includes('会什么')) {
    terms.push('技术', '技能')
  }
  
  // 联系方式/个人信息相关
  if (queryLower.includes('联系方式') || queryLower.includes('联系') || queryLower.includes('电话') || 
      queryLower.includes('email') || queryLower.includes('邮箱') || queryLower.includes('github') ||
      queryLower.includes('个人信息') || queryLower.includes('个人简介') || queryLower.includes('简介')) {
    terms.push('联系方式', '联系', '个人信息', '个人简介', '电话', '邮箱', 'github')
  }
  
  // 提取2-6个字的词（包括技术名称）
  const words = queryLower.split(/[\s，,、]+/)
  for (const word of words) {
    if (word.length >= 2 && word.length <= 8 && !terms.includes(word)) {
      terms.push(word)
    }
  }
  
  // 去重并返回
  return [...new Set(terms)].slice(0, 8) // 最多8个关键词
}

/**
 * 关键词搜索
 */
async function searchByKeywords(
  query: string,
  limit = 5
): Promise<Array<{ content: string; metadata: any; similarity: number }>> {
  const queryLower = query.toLowerCase()
  
  // 提取关键词（包括单字）
  const keywords = queryLower.split(/\s+/).filter(w => w.length > 0)
  
  // 获取所有内容
  const { data, error } = await getSupabase()
    .from('knowledge_vectors')
    .select('content, metadata')
    .limit(100)

  if (error || !data) {
    return []
  }

  // 计算匹配分数
  const results = data.map((item) => {
    const contentLower = item.content.toLowerCase()
    let score = 0
    
    // 完整短语匹配
    if (contentLower.includes(queryLower)) {
      score += 10
    }
    
    // 关键词匹配
    for (const keyword of keywords) {
      const count = (contentLower.match(new RegExp(keyword, 'g')) || []).length
      score += count * 2
    }
    
    // 标题匹配
    const titleLower = (item.metadata?.title || '').toLowerCase()
    if (titleLower.includes(queryLower)) {
      score += 5
    }
    
    return {
      content: item.content,
      metadata: item.metadata,
      similarity: Math.min(score / 10, 1), // 归一化到 0-1
    }
  })
  
  return results
    .filter((item) => item.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}
