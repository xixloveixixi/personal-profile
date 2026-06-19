import { notFound } from 'next/navigation'
import { getPostBlocks, getPostById, getPublishedPosts } from '@/lib/notion'
import { NotionBlockRenderer } from '@/components/blog/NotionBlockRenderer'
import { generateMetadata } from './metadata'

export const dynamic = 'force-dynamic'
export { generateMetadata }

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

function getPostCategory(category?: string) {
  return category?.trim() || '未分类'
}

export async function generateStaticParams() {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) return []
  const posts = await getPublishedPosts()
  return posts.map((post) => ({ slug: post.id }))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const postId = decodeURIComponent(params.slug)
  const post = await getPostById(postId).catch(() => null)

  if (!post) {
    notFound()
  }

  const blocks = await getPostBlocks(postId).catch(() => [])

  return (
    <article className="max-w-3xl mx-auto py-12 px-4 relative z-10">
      <h1 className="text-3xl font-bold mb-4 text-white">{post.title}</h1>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-purple-200/30 bg-purple-200/15 px-2.5 py-1 text-sm text-purple-50">
          {getPostCategory(post.category)}
        </span>
        <span className="text-sm text-gray-400">{post.publishedDate || '未设置发布日期'}</span>
      </div>
      <div className="flex gap-2 mb-8 flex-wrap">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-cyan-200/10 px-2 py-1 text-sm text-cyan-50"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="max-w-none">
        <NotionBlockRenderer blocks={blocks} />
      </div>
    </article>
  )
}
