import { Badge } from '@/components/ui/Badge'

interface TechStackProps {
  technologies: string[]
}

export function TechStack({ technologies }: TechStackProps) {
  if (technologies.length === 0) {
    return null
  }

  return (
    <div className="bg-white">
      <h3 className="text-lg font-semibold mb-4 text-primary-600">
        <span className="w-1 h-5 bg-gradient-to-b from-primary-600 to-primary-600 rounded-full"></span>
        Daily Use Technology Stack
      </h3>
      <div className="flex flex-wrap gap-2">
        {technologies.map((tech) => (
          <Badge key={tech} variant="outline" className="text-sm border-primary-600">
            {tech}
          </Badge>
        ))}
      </div>
    </div>
  )
}

