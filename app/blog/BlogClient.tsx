'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { NotionPost } from '@/lib/notion'

const BLOG_CATEGORIES = ['技术实践', 'AI/Agent', '项目复盘', '学习笔记'] as const
const UNCATEGORIZED = '未分类'

function getPostCategory(post: NotionPost) {
  return post.category?.trim() || UNCATEGORIZED
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function getTagStats(posts: NotionPost[]) {
  const counts = new Map<string, number>()

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    })
  })

  return Array.from(counts.entries())
    .sort(([tagA, countA], [tagB, countB]) => {
      if (countA !== countB) return countB - countA
      return tagA.localeCompare(tagB, 'zh-CN')
    })
    .map(([tag, count]) => ({ tag, count }))
}

interface BlogClientProps {
  posts: NotionPost[]
}

export function BlogClient({ posts }: BlogClientProps) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const categoryFilteredPosts = useMemo(() => {
    if (!selectedCategory) return posts
    return posts.filter((post) => getPostCategory(post) === selectedCategory)
  }, [posts, selectedCategory])

  const tagStats = useMemo(() => getTagStats(categoryFilteredPosts), [categoryFilteredPosts])

  const visiblePosts = useMemo(() => {
    const keyword = normalizeText(query)

    return categoryFilteredPosts.filter((post) => {
      if (selectedTag && !post.tags.includes(selectedTag)) return false

      if (!keyword) return true

      const searchable = [
        post.title,
        getPostCategory(post),
        post.publishedDate || '',
        ...post.tags,
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(keyword)
    })
  }, [categoryFilteredPosts, query, selectedTag])

  const hasFilters = Boolean(query.trim() || selectedCategory || selectedTag)

  const clearFilters = () => {
    setQuery('')
    setSelectedCategory(null)
    setSelectedTag(null)
  }

  const chooseCategory = (category: string | null) => {
    setSelectedCategory(category)
    if (!category) return

    const nextPosts = posts.filter((post) => getPostCategory(post) === category)
    const nextTags = new Set(nextPosts.flatMap((post) => post.tags))
    if (selectedTag && !nextTags.has(selectedTag)) {
      setSelectedTag(null)
    }
  }

  return (
    <div>
      <div className="mb-8 space-y-4">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、分类或标签"
            className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-400 outline-none transition focus:border-purple-300 focus:bg-white/15"
            aria-label="搜索博客文章"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => chooseCategory(null)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              selectedCategory === null
                ? 'border-purple-300 bg-purple-300/25 text-white'
                : 'border-white/15 bg-white/5 text-gray-300 hover:border-white/30 hover:text-white'
            }`}
          >
            全部
          </button>
          {BLOG_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => chooseCategory(category)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                selectedCategory === category
                  ? 'border-purple-300 bg-purple-300/25 text-white'
                  : 'border-white/15 bg-white/5 text-gray-300 hover:border-white/30 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {tagStats.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tagStats.map(({ tag, count }) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag((current) => (current === tag ? null : tag))}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  selectedTag === tag
                    ? 'border-cyan-200 bg-cyan-200/20 text-cyan-50'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/25 hover:text-white'
                }`}
              >
                {tag}
                <span className="ml-1 text-gray-400">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {visiblePosts.length === 0 ? (
        <div className="rounded-lg border border-white/15 bg-white/5 p-6 text-gray-300">
          <p className="mb-4">没有匹配的博客文章。</p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-white/20 px-3 py-2 text-sm text-white transition hover:bg-white/10"
            >
              清空筛选
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {visiblePosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${encodeURIComponent(post.id)}`}
              className="block rounded-lg border border-white/15 bg-white/5 p-6 transition hover:shadow-lg hover:shadow-purple-500/20"
            >
              <article>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full border border-purple-200/30 bg-purple-200/15 px-2.5 py-1 text-purple-50">
                    {getPostCategory(post)}
                  </span>
                  <span className="text-gray-400">{post.publishedDate || '未设置发布日期'}</span>
                </div>
                <h2 className="mb-3 text-xl font-semibold text-white transition-colors hover:text-purple-200">
                  {post.title}
                </h2>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-cyan-200/10 px-2 py-1 text-sm text-cyan-50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
