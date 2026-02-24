#!/usr/bin/env node

/**
 * 重新构建知识库
 * 
 * 使用方法:
 * 1. 确保本地开发服务器在运行: npm run dev
 * 2. 运行: node scripts/rebuild-knowledge.js
 * 
 * 或者直接访问: http://localhost:3000/api/init-knowledge
 */

async function rebuildKnowledge() {
  console.log('开始重新构建知识库...\n')
  console.log('调用初始化 API...\n')
  
  try {
    const response = await fetch('http://localhost:3000/api/init-knowledge')
    const result = await response.json()
    
    if (result.success) {
      console.log('✓ 知识库重建成功!')
      console.log(`  - 总块数: ${result.totalChunks}`)
      console.log(`  - 生成向量: ${result.generated}`)
      console.log(`  - 存储成功: ${result.stored}`)
    } else {
      console.error('✗ 重建失败:', result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error('✗ 请求失败:', error.message)
    console.log('\n请确保:')
    console.log('1. 本地开发服务器已启动 (npm run dev)')
    console.log('2. 或者访问: http://localhost:3000/api/init-knowledge')
    process.exit(1)
  }
}

rebuildKnowledge().catch(console.error)
