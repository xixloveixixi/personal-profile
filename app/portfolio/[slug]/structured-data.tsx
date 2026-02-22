import { PortfolioProject } from '@/lib/content/projects'

interface StructuredDataProps {
  project: PortfolioProject
  siteUrl: string
}

export function StructuredData({ project, siteUrl }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.shortDescription,
    image: project.featuredImage ? `${siteUrl}${project.featuredImage}` : undefined,
    datePublished: project.publishedAt,
    creator: {
      '@type': 'Person',
      name: 'Personal Portfolio',
    },
    keywords: project.technologies,
    ...(project.githubUrl && {
      codeRepository: project.githubUrl,
    }),
    ...(project.demoUrl && {
      url: project.demoUrl,
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

