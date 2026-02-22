import { notFound } from 'next/navigation'
import { getProjectBySlug, getAllProjects } from '@/lib/content/projects'
import { ProjectDetail } from '@/components/portfolio/ProjectDetail'
import { generateMetadata } from './metadata'
import { StructuredData } from './structured-data'

export { generateMetadata }

interface ProjectPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const projects = getAllProjects()
  return projects.map((project) => ({
    slug: project.slug,
  }))
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const project = getProjectBySlug(params.slug)

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

