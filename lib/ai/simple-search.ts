import { buildKnowledgeBase, KnowledgeChunk } from './knowledge-base'

// 缓存知识库内容
let knowledgeCache: KnowledgeChunk[] | null = null

/**
 * 简单的关键词搜索（不使用向量）
 */
export async function searchKnowledge(query: string, limit: number = 3): Promise<Array<{ content: string; metadata: any; similarity: number }>> {
  // 加载知识库
  if (!knowledgeCache) {
    knowledgeCache = await buildKnowledgeBase()
  }
  
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1)
  
  // 计算每个 chunk 的匹配分数
  const scored = knowledgeCache.map(chunk => {
    const contentLower = chunk.content.toLowerCase()
    let score = 0
    
    // 完整匹配加分
    if (contentLower.includes(queryLower)) {
      score += 10
    }
    
    // 关键词匹配
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        score += 3
      }
    }
    
    // 标题匹配额外加分
    const titleLower = (chunk.metadata.title || '').toLowerCase()
    if (titleLower.includes(queryLower)) {
      score += 5
    }
    for (const word of queryWords) {
      if (titleLower.includes(word)) {
        score += 2
      }
    }
    
    return {
      content: chunk.content,
      metadata: chunk.metadata,
      similarity: score / 100, // 归一化到 0-1
    }
  })
  
  // 按分数排序，返回前 N 个
  return scored
    .filter(item => item.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}

/**
 * 清空缓存（用于重新加载）
 */
export function clearKnowledgeCache() {
  knowledgeCache = null
}
