import { Metadata } from 'next'
import { getPublicProjectBySlug, getPublicProjects, type PublicProjectDetail } from '@/lib/api/public'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  let project: PublicProjectDetail | null = null
  try {
    project = await getPublicProjectBySlug(params.slug)
  } catch {
    // API returns error for non-existent slug
  }

  if (!project) {
    return { title: 'Project Not Found' }
  }

  return {
    title: `${project.title} | Portfolio`,
    description: project.shortDescription,
    openGraph: {
      title: project.title,
      description: project.shortDescription,
      type: 'website',
    },
  }
}