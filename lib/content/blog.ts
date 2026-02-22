import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { CategoryId, getCategoryById } from '@/lib/constants/categories'
import { calculateReadingTime } from '@/lib/utils/reading-time'

export interface BlogArticle {
  slug: string
  title: string
  description: string
  content: string
  publishedAt: string
  updatedAt?: string
  category: CategoryId
  tags: string[]
  readingTime: number
  featuredImage?: string
  draft?: boolean
}

const contentDirectory = path.join(process.cwd(), 'content/blog')

export function getAllArticles(): BlogArticle[] {
  if (!fs.existsSync(contentDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(contentDirectory)
  const articles = fileNames
    .filter((name) => name.endsWith('.mdx'))
    .map((fileName) => {
      const fullPath = path.join(contentDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)

      const article: BlogArticle = {
        slug: data.slug || fileName.replace(/\.mdx$/, ''),
        title: data.title || '',
        description: data.description || '',
        content,
        publishedAt: data.publishedAt || '',
        updatedAt: data.updatedAt,
        category: data.category || 'technical',
        tags: data.tags || [],
        readingTime: calculateReadingTime(content),
        featuredImage: data.featuredImage,
        draft: data.draft || false,
      }

      return article
    })
    .filter((article) => !article.draft)
    .sort((a, b) => {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })

  return articles
}

export function getArticleBySlug(slug: string): BlogArticle | null {
  try {
    const fullPath = path.join(contentDirectory, `${slug}.mdx`)
    if (!fs.existsSync(fullPath)) {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug: data.slug || slug,
      title: data.title || '',
      description: data.description || '',
      content,
      publishedAt: data.publishedAt || '',
      updatedAt: data.updatedAt,
      category: data.category || 'technical',
      tags: data.tags || [],
      readingTime: calculateReadingTime(content),
      featuredImage: data.featuredImage,
      draft: data.draft || false,
    }
  } catch (error) {
    console.error(`Error reading article ${slug}:`, error)
    return null
  }
}

export function getArticlesByCategory(category: CategoryId): BlogArticle[] {
  return getAllArticles().filter((article) => article.category === category)
}

export function getArticlesByTag(tag: string): BlogArticle[] {
  return getAllArticles().filter((article) =>
    article.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  )
}

