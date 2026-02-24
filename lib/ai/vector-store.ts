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
 * 延迟函数（避免 API 限流）
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 存储向量到数据库（带批处理和错误处理）
 * 基于 Hello-Agents 的可靠性设计
 */
export async function storeVectors(chunks: VectorChunkInput[]) {
  console.log(`开始生成并存储 ${chunks.length} 个向量...`)

  // 1. 为每个 chunk 生成向量（带错误处理）
  const vectors = []
  const failedChunks: string[] = []

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
      console.log(`✓ [${i + 1}/${chunks.length}] 生成向量: ${chunk.id}`)
      
      // 添加延迟，避免 API 限流（每 10 个延迟一次）
      if ((i + 1) % 10 === 0) {
        await sleep(500)
      }
    } catch (error: any) {
      console.error(`✗ [${i + 1}/${chunks.length}] 生成向量失败 ${chunk.id}:`, error.message)
      failedChunks.push(chunk.id)
      // 单个失败不影响其他，继续处理
    }
  }

  if (vectors.length === 0) {
    throw new Error('所有向量生成都失败了，无法继续存储')
  }

  console.log(`成功生成 ${vectors.length}/${chunks.length} 个向量，开始存储到数据库...`)
  if (failedChunks.length > 0) {
    console.warn(`⚠ 有 ${failedChunks.length} 个 chunk 的向量生成失败: ${failedChunks.join(', ')}`)
  }

  // 2. 批量存储到数据库（真正的批处理）
  const BATCH_SIZE = 10 // 每批插入 10 个
  const storedIds: string[] = []
  const failedStores: string[] = []

  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE)
    
    try {
      // 尝试批量插入
      const batchData = batch.map((v) => ({
        id: v.id,
        content: v.content,
        embedding: v.embedding,
        metadata: v.metadata,
      }))

      // 使用 Supabase 的批量插入
      const { data, error } = await getSupabase()
        .from('knowledge_vectors')
        .insert(batchData)
        .select('id')

      if (error) {
        // 如果批量插入失败，降级到逐个插入
        console.warn(`批量插入失败，降级到逐个插入:`, error.message)
        
        for (const v of batch) {
          try {
            const { error: singleError } = await getSupabase()
              .from('knowledge_vectors')
              .insert({
                id: v.id,
                content: v.content,
                embedding: v.embedding,
                metadata: v.metadata,
              })

            if (singleError) {
              console.error(`✗ 存储失败 ${v.id}:`, singleError.message)
              failedStores.push(v.id)
            } else {
              storedIds.push(v.id)
              console.log(`✓ 已存储: ${v.id}`)
            }
          } catch (singleErr: any) {
            console.error(`✗ 存储异常 ${v.id}:`, singleErr.message)
            failedStores.push(v.id)
          }
        }
      } else {
        // 批量插入成功
        const insertedIds = data?.map((d) => d.id) || []
        storedIds.push(...insertedIds)
        console.log(`✓ [${i + 1}-${Math.min(i + BATCH_SIZE, vectors.length)}/${vectors.length}] 批量存储成功`)
      }

      // 批次间延迟，避免数据库压力
      if (i + BATCH_SIZE < vectors.length) {
        await sleep(200)
      }
    } catch (batchError: any) {
      console.error(`批次 ${i + 1}-${i + BATCH_SIZE} 存储失败:`, batchError.message)
      // 记录失败的批次
      batch.forEach((v) => failedStores.push(v.id))
    }
  }

  // 3. 结果统计
  console.log('\n=== 存储完成统计 ===')
  console.log(`✓ 成功存储: ${storedIds.length}/${vectors.length}`)
  if (failedChunks.length > 0) {
    console.log(`⚠ 向量生成失败: ${failedChunks.length} 个`)
  }
  if (failedStores.length > 0) {
    console.log(`⚠ 存储失败: ${failedStores.length} 个`)
    console.warn(`失败的 ID: ${failedStores.join(', ')}`)
  }
  console.log('===================\n')

  if (storedIds.length === 0) {
    throw new Error('所有向量存储都失败了')
  }

  return {
    total: chunks.length,
    generated: vectors.length,
    stored: storedIds.length,
    failedGeneration: failedChunks.length,
    failedStorage: failedStores.length,
  }
}

/**
 * 只存储文本内容（不生成向量）
 * 用于 SKIP_EMBEDDING=true 的情况
 */
export async function storeTextOnly(chunks: VectorChunkInput[]) {
  console.log(`开始存储 ${chunks.length} 个文本块（不生成向量）...`)

  const BATCH_SIZE = 10
  const storedIds: string[] = []
  const failedStores: string[] = []

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)
    
    try {
      const batchData = batch.map((chunk) => ({
        id: chunk.id,
        content: chunk.content,
        embedding: null, // 不生成向量，设置为 null
        metadata: chunk.metadata,
      }))

      const { data, error } = await getSupabase()
        .from('knowledge_vectors')
        .insert(batchData)
        .select('id')

      if (error) {
        console.warn(`批量插入失败，降级到逐个插入:`, error.message)
        
        for (const chunk of batch) {
          try {
            const { error: singleError } = await getSupabase()
              .from('knowledge_vectors')
              .insert({
                id: chunk.id,
                content: chunk.content,
                embedding: null,
                metadata: chunk.metadata,
              })

            if (singleError) {
              console.error(`✗ 存储失败 ${chunk.id}:`, singleError.message)
              failedStores.push(chunk.id)
            } else {
              storedIds.push(chunk.id)
            }
          } catch (singleErr: any) {
            console.error(`✗ 存储异常 ${chunk.id}:`, singleErr.message)
            failedStores.push(chunk.id)
          }
        }
      } else {
        const insertedIds = data?.map((d) => d.id) || []
        storedIds.push(...insertedIds)
        console.log(`✓ [${i + 1}-${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}] 批量存储成功`)
      }

      if (i + BATCH_SIZE < chunks.length) {
        await sleep(200)
      }
    } catch (batchError: any) {
      console.error(`批次 ${i + 1}-${i + BATCH_SIZE} 存储失败:`, batchError.message)
      batch.forEach((chunk) => failedStores.push(chunk.id))
    }
  }

  console.log(`\n=== 存储完成统计 ===`)
  console.log(`✓ 成功存储: ${storedIds.length}/${chunks.length}`)
  if (failedStores.length > 0) {
    console.log(`⚠ 存储失败: ${failedStores.length} 个`)
  }
  console.log('===================\n')

  if (storedIds.length === 0) {
    throw new Error('所有文本块存储都失败了')
  }

  return {
    total: chunks.length,
    stored: storedIds.length,
    failed: failedStores.length,
  }
}

/**
 * 向量相似度搜索
 */
export async function searchSimilarVectors(
  query: string,
  limit = 10
): Promise<Array<{ content: string; metadata: any; similarity: number }>> {
  try {
    // 生成查询向量
    const queryEmbedding = await generateEmbedding(query)
    
    // 使用 RPC 函数进行向量搜索
    const { data, error } = await getSupabase().rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.0,  // 降低阈值，返回所有结果
      match_count: limit,
    })

    if (error) {
      console.error('RPC error:', error)
      // 降级到文本搜索
      return await searchByText(query, limit)
    }

    // 如果查询实习/工作经历，确保返回所有相关记录
    const queryLower = query.toLowerCase()
    const isWorkQuery = queryLower.includes('实习') || queryLower.includes('工作') || 
                        queryLower.includes('公司') || queryLower.includes('经历')
    
    if (isWorkQuery && data && data.length > 0) {
      // 获取所有工作经历（timeline 类型）
      const { data: allWorkData, error: workError } = await getSupabase()
        .from('knowledge_vectors')
        .select('content, metadata')
        .eq('metadata->>type', 'timeline')
      
      if (!workError && allWorkData && allWorkData.length > 0) {
        console.log(`[Vector Search] 工作查询: 返回 ${allWorkData.length} 条工作经历`)
        return allWorkData.map((item: any) => ({
          content: item.content,
          metadata: item.metadata,
          similarity: 1.0,
        }))
      }
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
  const { data, error } = await getSupabase()
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
    '实习': ['工作', '工作经历', '工作经验', '公司', '实习经历', '实习经验', '实习生', '维搭', '莉莉丝'],
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
      } else if (queryLower.includes('联系方式') || queryLower.includes('联系') || queryLower.includes('电话') || 
                 queryLower.includes('email') || queryLower.includes('邮箱') || queryLower.includes('github') ||
                 queryLower.includes('个人信息') || queryLower.includes('个人简介') || queryLower.includes('简介')) {
        // 联系方式查询：大幅提升个人信息类型的权重
        if (item.metadata?.type === 'personal') {
          typeBoost = 2.0 // 更高的权重，确保个人信息优先返回
        }
      } else if (queryLower.includes('项目') || queryLower.includes('作品')) {
        if (item.metadata?.type === 'project') {
          typeBoost = 1.5
        }
      } else if (queryLower.includes('实习') || queryLower.includes('工作') || queryLower.includes('公司')) {
        // 实习/工作查询：提升 timeline 类型权重，确保返回所有实习经历
        if (item.metadata?.type === 'timeline' || item.metadata?.type === 'work') {
          typeBoost = 2.0 // 提高权重
        }
      }
      
      return {
        content: item.content,
        metadata: item.metadata,
        similarity: similarity * typeBoost,
      }
    })
    .filter((item) => item.similarity > 0.05) // 降低阈值，确保返回更多相关结果
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  return results
}

/**
 * 清空所有向量
 */
export async function clearAllVectors() {
  const { error } = await getSupabase().from('knowledge_vectors').delete().neq('id', '')
  if (error) throw error
}
