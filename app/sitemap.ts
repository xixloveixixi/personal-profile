import { MetadataRoute } from 'next'
import { getAllArticles } from '@/lib/content/blog'

function safeDate(value?: string): Date {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'
  
  const articles = getAllArticles().map((article) => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: article.updatedAt ? safeDate(article.updatedAt) : safeDate(article.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Note: projects are fetched dynamically via API, not included in static sitemap
  // The portfolio/[slug] pages use generateStaticParams with dynamic fetching

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...articles,
  ]
}