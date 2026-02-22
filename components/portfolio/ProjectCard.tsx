import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ExternalLink, Github } from 'lucide-react'
import { motion } from 'framer-motion'
import type { PortfolioProject } from '@/lib/content/projects'

interface ProjectCardProps {
  project: PortfolioProject
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Link href={`/portfolio/${project.slug}`} className="block h-full">
        <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl hover:shadow-primary-600/10 border-gray-200">
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-gray-100">
            {project.featuredImage ? (
              <Image
                src={project.featuredImage}
                alt={`${project.title} featured image`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                暂无封面
              </div>
            )}
          </div>
          <CardHeader className="pb-4">
            <CardTitle className="group-hover:text-primary-600 line-clamp-2 min-h-[3.5rem]">
              {project.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-full flex-col">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                {project.shortDescription}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.technologies.slice(0, 4).map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
                {project.technologies.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{project.technologies.length - 4}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-4 mt-auto pt-4">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-sm text-primary-600"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-sm text-primary-600"
                >
                  <ExternalLink className="h-4 w-4" />
                  Demo
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

