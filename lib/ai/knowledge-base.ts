import { getAllProjects } from '@/lib/content/projects'
import { getPublishedPosts, getPostContent } from '@/lib/notion'
import contactData from '@/content/about/contact.json'
import skillsData from '@/content/about/skills.json'
import timelineData from '@/content/about/timeline.json'

export interface KnowledgeChunk {
  id: string
  content: string
  metadata: {
    type: 'personal' | 'skill' | 'project' | 'blog' | 'timeline'
    source?: string
    title?: string
  }
}

/**
 * 构建完整的知识库内容
 */
export async function buildKnowledgeBase(): Promise<KnowledgeChunk[]> {
  const chunks: KnowledgeChunk[] = []

  // 1. 个人信息 - 从 about 页面提取
  const personalInfo = `
我是阿菥（蒋乙菥），一名前端工程师。

个人简介：
- 有技术追求的前端工程师
- 专注性能优化与工程化实践
- 持续探索前沿领域（如MCP协议等）
- 坚持输出原创技术文章

性格特点：ISFJ，喜欢逛公园、旅游、追综艺、享受生活。

技术标签：React、Next.js、TypeScript、AI + 前端

联系方式：
- GitHub: https://github.com/xixloveixixi
- Email: 3186932737@qq.com
- 掘金: https://juejin.cn/user/1373741800227131
- CSDN: https://blog.csdn.net/2403_88913721
- 电话: 18723832290
  `.trim()

  chunks.push({
    id: 'personal-info',
    content: personalInfo,
    metadata: {
      type: 'personal',
      title: '个人信息',
    },
  })

  // 2. 技能信息
  const skillsInfo = `
我的技能栈：
${skillsData.map(s => `- ${s.name} (${s.category}): ${s.proficiency}% - ${s.description}`).join('\n')}
  `.trim()

  chunks.push({
    id: 'skills-info',
    content: skillsInfo,
    metadata: {
      type: 'skill',
      title: '技能栈',
    },
  })

  // 3. 时间线/经历（教育 + 工作 + 项目经历）
  const timelineInfo = timelineData
    .map((item) => {
      const dateRange =
        item.endDate
          ? `${item.startDate} 至 ${item.endDate}`
          : `${item.startDate} 至今`
      const typeLabel = item.type === 'work' ? '工作经历' : item.type === 'education' ? '教育经历' : '项目经历'
      return `
${typeLabel}：
- ${item.title} @ ${item.organization} (${dateRange})
  地点：${item.location || '远程'}
  描述：${item.description}
  ${item.achievements ? `成就：\n${item.achievements.map(a => `  - ${a}`).join('\n')}` : ''}
  技术栈：${item.technologies?.join(', ') || ''}
      `.trim()
    })
    .join('\n\n')

  chunks.push({
    id: 'timeline-info',
    content: timelineInfo,
    metadata: {
      type: 'timeline',
      title: '经历时间线',
    },
  })

  // 4. 项目详情（从 portfolio 页面）
  try {
    const projects = getAllProjects()
    console.log(`✓ 找到 ${projects.length} 个项目`)

    for (const project of projects) {
      const projectContent = `
项目名称：${project.title}
简介：${project.shortDescription}
${project.longDescription ? `详细介绍：${project.longDescription}` : ''}
${project.problem ? `解决的问题：${project.problem}` : ''}
${project.solution ? `解决方案：${project.solution}` : ''}
${project.challenges ? `技术挑战：${project.challenges}` : ''}
${project.results ? `项目成果：${project.results}` : ''}
技术栈：${project.technologies.join(', ')}
${project.githubUrl ? `GitHub：${project.githubUrl}` : ''}
${project.demoUrl ? `Demo：${project.demoUrl}` : ''}
      `.trim()

      chunks.push({
        id: `project-${project.slug}`,
        content: projectContent,
        metadata: {
          type: 'project',
          source: `/portfolio/${project.slug}`,
          title: project.title,
        },
      })
    }
    console.log(`✓ 项目信息处理完成，共添加 ${projects.length} 个项目`)
  } catch (error: any) {
    console.warn(`⚠ 项目信息读取失败: ${error.message || error}`)
  }

  // 5. Notion 博文
  try {
    const posts = await getPublishedPosts()
    console.log(`✓ 找到 ${posts.length} 篇 Notion 博文`)

    // 限制处理的博文数量，避免请求过多
    const postsToProcess = posts.slice(0, 10)

    for (const post of postsToProcess) {
      try {
        // 获取博文完整内容
        const content = await getPostContent(post.id)

        const blogContent = `
博文标题：${post.title}
发布时间：${post.publishedAt}
标签：${post.tags?.join(', ') || '无'}
摘要：${post.excerpt || ''}

正文内容：
${content}
        `.trim()

        chunks.push({
          id: `blog-${post.id}`,
          content: blogContent,
          metadata: {
            type: 'blog',
            source: `/blog/${post.slug}`,
            title: post.title,
          },
        })
      } catch (postError) {
        // 单个博文失败不影响其他
        console.warn(`⚠ 获取博文 "${post.title}" 内容失败，跳过`)
      }
    }
    console.log(`✓ Notion 博文处理完成，共添加 ${chunks.filter(c => c.metadata.type === 'blog').length} 篇`)
  } catch (error: any) {
    console.warn(`⚠ Notion API 调用失败，跳过博文内容: ${error.message || error}`)
    console.warn('提示：这不会影响其他知识库内容的初始化，可以稍后重试')
    // Notion 失败不影响其他数据，继续处理
  }

  return chunks
}

/**
 * 将知识库内容分割成更小的chunks（用于向量化）
 */
export function splitIntoChunks(
  chunks: KnowledgeChunk[],
  maxChunkSize = 500
): KnowledgeChunk[] {
  const splitChunks: KnowledgeChunk[] = []

  for (const chunk of chunks) {
    if (chunk.content.length <= maxChunkSize) {
      splitChunks.push(chunk)
    } else {
      // 按段落分割
      const paragraphs = chunk.content.split('\n\n')
      let currentChunk = ''
      let chunkIndex = 0

      for (const paragraph of paragraphs) {
        if (currentChunk.length + paragraph.length > maxChunkSize) {
          if (currentChunk) {
            splitChunks.push({
              id: `${chunk.id}-${chunkIndex}`,
              content: currentChunk.trim(),
              metadata: chunk.metadata,
            })
            chunkIndex++
          }
          currentChunk = paragraph
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph
        }
      }

      if (currentChunk) {
        splitChunks.push({
          id: `${chunk.id}-${chunkIndex}`,
          content: currentChunk.trim(),
          metadata: chunk.metadata,
        })
      }
    }
  }

  return splitChunks
}
