import { Feed } from 'feed'
import type { BlogArticle } from '@/lib/content/blog'

export function generateRSSFeed(articles: BlogArticle[], siteUrl: string) {
  const feed = new Feed({
    title: 'Personal Portfolio Blog',
    description: 'Technical articles, tutorials, and essays',
    id: `${siteUrl}/blog`,
    link: `${siteUrl}/blog`,
    language: 'en',
    copyright: `Copyright ${new Date().getFullYear()}`,
    updated: articles.length > 0 ? new Date(articles[0].publishedAt) : new Date(),
    generator: 'Next.js RSS Generator',
  })

  articles.forEach((article) => {
    feed.addItem({
      title: article.title,
      id: `${siteUrl}/blog/${article.slug}`,
      link: `${siteUrl}/blog/${article.slug}`,
      description: article.description,
      date: new Date(article.publishedAt),
      category: [
        {
          term: article.category,
          scheme: 'https://example.com/categories',
        },
      ],
      ...(article.tags.map((tag) => ({
        term: tag,
        scheme: 'https://example.com/tags',
      })) as any),
    })
  })

  return feed.rss2()
}

