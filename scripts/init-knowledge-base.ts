// 这个脚本需要在 Next.js 环境中运行，使用 tsx 或直接编译运行
import { buildKnowledgeBase, splitIntoChunks } from '@/lib/ai/knowledge-base'
import { storeVectors } from '@/lib/ai/vector-store'

async function main() {
  console.log('开始构建知识库...')
  
  // 1. 构建知识库内容
  const chunks = await buildKnowledgeBase()
  console.log(`收集到 ${chunks.length} 个知识块`)

  // 2. 分割成更小的chunks
  const splitChunks = splitIntoChunks(chunks, 500)
  console.log(`分割后共 ${splitChunks.length} 个chunks`)

  // 3. 转换为向量并存储
  const vectorChunks = splitChunks.map((chunk) => ({
    id: chunk.id,
    content: chunk.content,
    metadata: chunk.metadata,
  }))

  console.log('开始存储向量...')
  await storeVectors(vectorChunks)
  console.log('知识库初始化完成！')
}

main().catch(console.error)
