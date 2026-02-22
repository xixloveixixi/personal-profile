import { notFound } from 'next/navigation'
import { getPostBlocks, getPostById, getPublishedPosts } from '@/lib/notion'
import { NotionBlockRenderer } from '@/components/blog/NotionBlockRenderer'
import { generateMetadata } from './metadata'

export { generateMetadata }

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  return posts.map((post) => ({
    slug: post.id,
  }))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const postId = decodeURIComponent(params.slug)
  const post = await getPostById(postId)

  if (!post) {
    notFound()
  }

  const blocks = await getPostBlocks(postId)

  return (
    <article className="max-w-3xl mx-auto py-12 px-4 relative z-10">
      <h1 className="text-3xl font-bold mb-4 text-white">{post.title}</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-purple-200/20 text-purple-100 text-sm rounded"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="text-gray-300 text-sm mb-8">{post.publishedDate || '未设置发布日期'}</div>
      <div className="max-w-none">
        <NotionBlockRenderer blocks={blocks} />
      </div>
    </article>
  )
}
