import { searchSimilarVectors } from './vector-store'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * 混合搜索：向量搜索 + 关键词搜索 + 子查询
 */
export async function hybridSearch(
  query: string,
  limit = 5
): Promise<Array<{ content: string; metadata: any; similarity: number }>> {
  // 1. 先尝试完整查询的向量搜索
  const vectorResults = await searchSimilarVectors(query, limit)
  
  // 2. 如果向量搜索没有结果，尝试关键词搜索
  let keywordResults: Array<{ content: string; metadata: any; similarity: number }> = []
  if (vectorResults.length === 0) {
    keywordResults = await searchByKeywords(query, limit)
  }
  
  // 3. 如果还是没有结果，尝试提取关键词进行子查询
  if (vectorResults.length === 0 && keywordResults.length === 0) {
    // 提取关键实体词
    const keyTerms = extractKeyTerms(query)
    for (const term of keyTerms) {
      const termResults = await searchByKeywords(term, 2)
      keywordResults.push(...termResults)
    }
  }
  
  // 合并结果，去重
  const seen = new Set<string>()
  const combined: Array<{ content: string; metadata: any; similarity: number }> = []
  
  for (const r of [...vectorResults, ...keywordResults]) {
    if (!seen.has(r.content)) {
      combined.push(r)
      seen.add(r.content)
    }
  }
  
  return combined.slice(0, limit)
}

/**
 * 提取查询中的关键实体词
 */
function extractKeyTerms(query: string): string[] {
  const terms: string[] = []
  
  // 教育相关
  if (query.includes('学校') || query.includes('毕业') || query.includes('大学')) {
    terms.push('学校', '毕业', '教育', '本科')
  }
  
  // 工作/项目相关
  if (query.includes('项目') || query.includes('工作') || query.includes('公司')) {
    terms.push('项目', '工作', '公司')
  }
  
  // 技能相关
  if (query.includes('技术') || query.includes('技能') || query.includes('会什么')) {
    terms.push('技术', '技能')
  }
  
  // 提取2-4个字的词
  const words = query.split(/\s+/)
  for (const word of words) {
    if (word.length >= 2 && word.length <= 6 && !terms.includes(word)) {
      terms.push(word)
    }
  }
  
  return terms.slice(0, 5) // 最多5个关键词
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
  const { data, error } = await supabase
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
