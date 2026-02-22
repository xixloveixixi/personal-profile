import { BlogArticle } from '@/lib/content/blog'

interface StructuredDataProps {
  article: BlogArticle
  siteUrl: string
}

export function StructuredData({ article, siteUrl }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    image: article.featuredImage ? `${siteUrl}${article.featuredImage}` : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: 'Personal Portfolio',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Personal Portfolio',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${article.slug}`,
    },
    articleSection: article.category,
    keywords: article.tags,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

