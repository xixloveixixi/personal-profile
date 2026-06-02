import { notFound } from 'next/navigation'
import { getPublicProjectBySlug, getPublicProjects, type PublicProjectDetail } from '@/lib/api/public'
import { ProjectDetail } from '@/components/portfolio/ProjectDetail'
import { generateMetadata } from './metadata'
import { StructuredData } from './structured-data'

export { generateMetadata }

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const projects = await getPublicProjects()
  return projects.map((project) => ({
    slug: project.slug,
  }))
}
interface ProjectPageProps {
  params: {
    slug: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  let project: PublicProjectDetail | null = null
  try {
    project = await getPublicProjectBySlug(params.slug)
  } catch {
    // API returns error for non-existent slug
  }

  if (!project) {
    notFound()
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'

  return (
    <div className="container mx-auto px-4 py-8">
      <StructuredData project={project} siteUrl={siteUrl} />
      <ProjectDetail project={project} />
    </div>
  )
}