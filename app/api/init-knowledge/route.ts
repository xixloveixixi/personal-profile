import { buildPublicKnowledgeChunks, loadPublicKnowledgeData } from '@/lib/ai/public-knowledge'
import { storeVectors, clearAllVectors } from '@/lib/ai/vector-store'
import { NextResponse } from 'next/server'

async function initKnowledge() {
  console.log('开始构建知识库...')
  
  try {
    // 0. 先清空现有数据（避免重复键错误）
    console.log('清空现有知识库数据...')
    try {
      await clearAllVectors()
      console.log('✓ 已清空现有数据')
    } catch (clearError: any) {
      console.warn('⚠ 清空数据时出错（可能表为空）:', clearError.message)
      // 继续执行，不影响初始化
    }
    
    // 1. 从后台公开接口读取数据，并构建动态语义分块
    const publicData = await loadPublicKnowledgeData()
    const chunks = buildPublicKnowledgeChunks(publicData)
    console.log(`✓ 基于后台公开数据生成 ${chunks.length} 个动态知识块`)

    if (chunks.length === 0) {
      throw new Error('没有收集到任何公开知识块，请检查后台公开数据接口')
    }

    // 2. 转换为向量存储输入。这里保留语义分块，不再统一按字符数机械切分。
    const vectorChunks = chunks.map((chunk) => ({
      id: chunk.id,
      content: chunk.content,
      metadata: {
        type: chunk.type,
        title: chunk.title,
        source: chunk.source,
        ...(chunk.metadata ?? {}),
      },
    }))

    // 检查是否跳过向量生成
    const skipEmbedding = process.env.SKIP_EMBEDDING === 'true'
    const embeddingProvider = process.env.EMBEDDING_PROVIDER || 'alibaba'
    const hasAlibabaKey = !!process.env.ALIBABA_API_KEY
    
    console.log('环境变量检查:')
    console.log(`  SKIP_EMBEDDING: ${process.env.SKIP_EMBEDDING}`)
    console.log(`  EMBEDDING_PROVIDER: ${embeddingProvider}`)
    console.log(`  ALIBABA_API_KEY: ${hasAlibabaKey ? '已设置' : '未设置'}`)
    
    if (skipEmbedding) {
      console.log('⚠ 跳过向量生成，只存储文本内容...')
      const { storeTextOnly } = await import('@/lib/ai/vector-store')
      await storeTextOnly(vectorChunks)
      console.log('✓ 知识库初始化完成（仅文本，无向量）！')
      
      return {
        success: true,
        message: `动态公开知识库初始化完成！共存储 ${vectorChunks.length} 个文本块（未生成向量）`,
        warning: '向量生成已跳过，聊天功能将回退到动态关键词检索',
        stats: {
          totalChunks: chunks.length,
          totalVectors: vectorChunks.length,
          byType: chunks.reduce((acc, chunk) => {
            acc[chunk.type] = (acc[chunk.type] || 0) + 1
            return acc
          }, {} as Record<string, number>),
        },
      }
    }

    console.log('开始存储动态公开知识向量到数据库...')
    const storageStats = await storeVectors(vectorChunks)
    console.log('✓ 动态公开知识库初始化完成！')

    return {
      success: true,
      message: `动态公开知识库初始化完成！共存储 ${storageStats.stored}/${storageStats.generated} 个向量`,
      stats: {
        totalChunks: chunks.length,
        totalVectors: vectorChunks.length,
        generated: storageStats.generated,
        stored: storageStats.stored,
        failedGeneration: storageStats.failedGeneration,
        failedStorage: storageStats.failedStorage,
        byType: chunks.reduce((acc, chunk) => {
          acc[chunk.type] = (acc[chunk.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      },
    }
  } catch (error: any) {
    console.error('初始化过程出错:', error)
    
    // 如果是向量生成超时，提供降级方案
    if (error.message?.includes('超时') || error.message?.includes('timeout')) {
      return {
        success: false,
        error: error.message,
        suggestion: '向量生成超时。可以在 .env.local 中设置 SKIP_EMBEDDING=true 来跳过向量生成，先存储文本内容',
      }
    }
    
    throw error
  }
}

export async function GET() {
  try {
    const result = await initKnowledge()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('初始化知识库失败:', error)
    const errorMessage = error.message || error.toString() || '初始化失败'
    console.error('详细错误信息:', {
      message: errorMessage,
      status: error.status,
      response: error.response?.data,
    })
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error.status ? `HTTP ${error.status}` : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const result = await initKnowledge()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('初始化知识库失败:', error)
    const errorMessage = error.message || error.toString() || '初始化失败'
    console.error('详细错误信息:', {
      message: errorMessage,
      status: error.status,
      response: error.response?.data,
    })
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error.status ? `HTTP ${error.status}` : undefined,
      },
      { status: 500 }
    )
  }
}

