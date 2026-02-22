import { Metadata } from 'next'
import { getPostById } from '@/lib/notion'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await getPostById(decodeURIComponent(params.slug))

  if (!post) {
    return {
      title: '文章未找到',
    }
  }

  return {
    title: `${post.title} | 博客`,
    description: `${post.title} - Notion 博客文章`,
    openGraph: {
      title: post.title,
      description: `${post.title} - Notion 博客文章`,
      type: 'article',
      publishedTime: post.publishedDate,
      authors: ['阿菥'],
      tags: post.tags,
    },
  }
}

