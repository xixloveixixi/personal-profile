import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedPosts } from '@/lib/notion'

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
  const posts = await getPublishedPosts()

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 relative z-10">
      <h1 className="text-3xl font-bold mb-8 text-white">博客文章</h1>
      <div className="space-y-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${encodeURIComponent(post.id)}`}
            className="block border border-white/15 bg-white/5 rounded-lg p-6 hover:shadow-lg hover:shadow-purple-500/20 transition-shadow cursor-pointer"
          >
            <article>
              <h2 className="text-xl font-semibold mb-2 text-white hover:text-purple-200 transition-colors">
                {post.title}
              </h2>
              <div className="flex gap-2 mb-2 flex-wrap">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-purple-200/20 text-purple-100 text-sm rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-gray-300 text-sm">{post.publishedDate || '未设置发布日期'}</p>
            </article>
          </Link>
        ))}
      </div>
    </div>
  )
}

