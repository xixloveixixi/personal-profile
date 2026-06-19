import type { Metadata } from 'next'
import { getPublishedPosts } from '@/lib/notion'
import { BlogClient } from './BlogClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '博客 | 阿菥的个人主页',
  description: 'Notion 同步的博客文章',
  openGraph: {
    title: '博客 | 阿菥的个人主页',
    description: 'Notion 同步的博客文章',
    type: 'website',
  },
}

export default async function BlogPage() {
  const posts = await getPublishedPosts().catch(() => [])

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 relative z-10">
      <h1 className="text-3xl font-bold mb-8 text-white">博客文章</h1>
      {posts.length === 0 ? (
        <div className="border border-white/15 bg-white/5 rounded-lg p-6 text-gray-300">
          暂时没有可展示的博客文章。
        </div>
      ) : (
        <BlogClient posts={posts} />
      )}
    </div>
  )
}
