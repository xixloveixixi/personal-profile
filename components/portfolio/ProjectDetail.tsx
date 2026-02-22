import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { ExternalLink, Github } from 'lucide-react'
import type { PortfolioProject } from '@/lib/content/projects'

interface ProjectDetailProps {
  project: PortfolioProject
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
        <p className="text-xl text-gray-600">
          {project.longDescription}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.technologies.map((tech) => (
            <Badge key={tech} variant="secondary">
              {tech}
            </Badge>
          ))}
        </div>
        <div className="flex gap-4">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900"
            >
              <Github className="h-5 w-5" />
              View on GitHub
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-600 transition-colors shadow-md shadow-primary-600/30 hover:shadow-lg hover:shadow-primary-600/40"
            >
              <ExternalLink className="h-5 w-5" />
              Live Demo
            </a>
          )}
        </div>
      </header>

      {project.featuredImage && (
        <div className="mb-8 relative w-full h-96">
          <Image
            src={project.featuredImage}
            alt={`${project.title} featured image`}
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
            priority
          />
        </div>
      )}

      <div className="prose prose-lg">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Problem</h2>
          <p className="text-gray-700">
            {project.problem}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Solution</h2>
          <p className="text-gray-700">
            {project.solution}
          </p>
        </section>

        {project.challenges && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Challenges</h2>
            <p className="text-gray-700">
              {project.challenges}
            </p>
          </section>
        )}

        {project.results && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Results</h2>
            <p className="text-gray-700">
              {project.results}
            </p>
          </section>
        )}

        {project.gallery && project.gallery.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.gallery.map((image, index) => (
                <div key={index} className="relative w-full h-64">
                  <Image
                    src={image}
                    alt={`${project.title} screenshot ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}

