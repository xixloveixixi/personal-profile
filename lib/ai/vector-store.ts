import { createClient } from '@supabase/supabase-js'
import { KnowledgeChunk } from './knowledge-base'

// Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * 使用阿里云生成向量嵌入
 */
async function generateEmbeddingAlibaba(text: string): Promise<number[]> {
  const apiKey = process.env.ALIBABA_API_KEY
  if (!apiKey) {
    throw new Error('ALIBABA_API_KEY 未设置')
  }

  const baseURL = process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1'

  const response = await fetch(`${baseURL}/services/embeddings/text-embedding/text-embedding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-v1',
      input: {
        texts: [text],
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`阿里云 API 错误: ${response.status} ${errorText}`)
  }

  const data = await response.json()

  if (!data.output?.embeddings?.[0]?.embedding) {
    throw new Error('阿里云 API 返回格式错误：未找到 embedding')
  }

  const rawEmbedding = data.output.embeddings[0].embedding
  
  // 确保返回的是数字数组
  if (typeof rawEmbedding === 'string') {
    try {
      const parsed = JSON.parse(rawEmbedding)
      if (Array.isArray(parsed)) {
        return parsed.map(Number)
      }
    } catch {
      return rawEmbedding.split(',').map(Number)
    }
  }
  
  if (Array.isArray(rawEmbedding)) {
    return rawEmbedding.map(Number)
  }
  
  throw new Error(`阿里云 API 返回的 embedding 格式不正确: ${typeof rawEmbedding}`)
}

/**
 * 生成向量嵌入（带重试机制）
 */
export async function generateEmbedding(text: string, retries = 3): Promise<number[]> {
  for (let i = 0; i < retries; i++) {
    try {
      return await generateEmbeddingAlibaba(text)
    } catch (error: any) {
      if (i === retries - 1) throw error
      console.warn(`生成向量失败（重试 ${i + 1}/${retries}）:`, error.message)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error(`生成向量失败（已重试 ${retries} 次）`)
}

// 输入类型（不需要 embedding）
export interface VectorChunkInput {
  id: string
  content: string
  metadata: {
    type: 'personal' | 'skill' | 'project' | 'blog' | 'timeline'
    source?: string
    title?: string
  }
}

/**
 * 存储向量到数据库
 */
export async function storeVectors(chunks: VectorChunkInput[]) {
  console.log(`开始生成并存储 ${chunks.length} 个向量...`)

  // 为每个 chunk 生成向量
  const vectors = []
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    try {
      const embedding = await generateEmbedding(chunk.content)
      vectors.push({
        id: chunk.id,
        content: chunk.content,
        embedding,
        metadata: chunk.metadata,
      })
      console.log(`✓ 完成 ${i + 1}/${chunks.length}: ${chunk.id}`)
    } catch (error) {
      console.error(`✗ 失败 ${chunk.id}:`, error)
    }
  }

  console.log(`成功生成 ${vectors.length} 个向量，开始存储到数据库...`)

  // 使用 RPC 函数批量插入
  for (let i = 0; i < vectors.length; i++) {
    const v = vectors[i]
    
    const { error } = await supabase.rpc('insert_vector', {
      p_content: v.content,
      p_embedding: v.embedding,
      p_id: v.id,
      p_metadata: v.metadata,
    })

    if (error) {
      console.error(`Error storing vector ${v.id}:`, error)
      throw error
    }
    
    console.log(`✓ 已存储 ${i + 1}/${vectors.length}: ${v.id}`)
  }
  
  console.log('✓ 所有向量存储完成！')
}

/**
 * 向量相似度搜索
 */
export async function searchSimilarVectors(
  query: string,
  limit = 5
): Promise<Array<{ content: string; metadata: any; similarity: number }>> {
  try {
    // 生成查询向量
    const queryEmbedding = await generateEmbedding(query)
    
    // 使用 RPC 函数进行向量搜索
    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.0,  // 降低阈值，返回所有结果
      match_count: limit,
    })

    if (error) {
      console.error('RPC error:', error)
      // 降级到文本搜索
      return await searchByText(query, limit)
    }

    return data || []
  } catch (error: any) {
    console.warn('向量搜索失败，使用文本搜索:', error.message)
    return await searchByText(query, limit)
  }
}

/**
 * 文本搜索（降级方案，当没有向量时使用）
 */
async function searchByText(
  query: string,
  limit = 5
): Promise<Array<{ content: string; metadata: any; similarity: number }>> {
  console.log('使用文本搜索（向量不可用）...')
  
  // 获取所有文本内容
  const { data, error } = await supabase
    .from('knowledge_vectors')
    .select('content, metadata')
    .limit(100) // 限制查询数量

  if (error || !data) {
    console.error('Error fetching text data:', error)
    return []
  }

  // 改进的文本搜索：支持同义词和语义匹配
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1)
  
  // 同义词映射（用于提高搜索准确性）
  const synonymMap: Record<string, string[]> = {
    '学校': ['大学', '院校', '高校', '毕业', '就读', '教育'],
    '项目': ['作品', '作品集', '开发', '开发项目', '项目经验', '项目经历'],
    '实习': ['工作', '工作经历', '工作经验', '公司'],
    '技能': ['技术', '能力', '擅长', '掌握'],
    '专业': ['学科', '方向', '领域'],
  }
  
  // 扩展查询词（包含同义词）
  const expandedWords = new Set(queryWords)
  queryWords.forEach(word => {
    Object.entries(synonymMap).forEach(([key, synonyms]) => {
      if (word.includes(key) || synonyms.some(s => word.includes(s))) {
        synonyms.forEach(syn => expandedWords.add(syn))
        expandedWords.add(key)
      }
    })
  })
  
  const results = data
    .map((item) => {
      const contentLower = item.content.toLowerCase()
      const metadataStr = JSON.stringify(item.metadata || {}).toLowerCase()
      const fullText = `${contentLower} ${metadataStr}`
      
      // 计算匹配的关键词数量（使用扩展后的词）
      const matchCount = Array.from(expandedWords).filter(word => 
        fullText.includes(word)
      ).length
      
      // 计算完整短语匹配（更高的权重）
      const phraseMatch = queryLower.length > 2 && fullText.includes(queryLower) ? 2 : 0
      
      // 计算相似度（考虑匹配词数量和短语匹配）
      const similarity = (matchCount + phraseMatch) / Math.max(expandedWords.size, 1)
      
      // 根据 metadata.type 提升相关类型的权重
      let typeBoost = 1.0
      if (queryLower.includes('学校') || queryLower.includes('毕业') || queryLower.includes('专业')) {
        if (item.metadata?.type === 'personal' || item.metadata?.type === 'education') {
          typeBoost = 1.5
        }
      } else if (queryLower.includes('项目') || queryLower.includes('作品')) {
        if (item.metadata?.type === 'project') {
          typeBoost = 1.5
        }
      } else if (queryLower.includes('实习') || queryLower.includes('工作')) {
        if (item.metadata?.type === 'timeline' || item.metadata?.type === 'work') {
          typeBoost = 1.5
        }
      }
      
      return {
        content: item.content,
        metadata: item.metadata,
        similarity: similarity * typeBoost,
      }
    })
    .filter((item) => item.similarity > 0.1) // 提高阈值，只返回相关性较高的结果
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  return results
}

/**
 * 清空所有向量
 */
export async function clearAllVectors() {
  const { error } = await supabase.from('knowledge_vectors').delete().neq('id', '')
  if (error) throw error
}
