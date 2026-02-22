import { Calendar, MapPin, Briefcase, GraduationCap } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { TimelineEntry } from '@/lib/content/about'

interface TimelineProps {
  entries: TimelineEntry[]
}

export function Timeline({ entries }: TimelineProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    })
  }

  return (
      <div className="relative">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300 via-primary-600 to-primary-300" />
      <div className="space-y-8">
        {entries.map((entry, index) => (
          <div key={entry.id} className="relative flex gap-6 group">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200">
                {entry.type === 'work' ? (
                  <Briefcase className="h-6 w-6 text-primary-600" />
                ) : (
                  <GraduationCap className="h-6 w-6 text-primary-600" />
                )}
              </div>
            </div>
            <div className="flex-1 pb-8 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{entry.title}</h3>
                <Badge variant="outline" className="text-xs border-primary-600">
                  {entry.type === 'work' ? 'Work' : 'Education'}
                </Badge>
              </div>
              <p className="text-lg text-gray-600">
                {entry.organization}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(entry.startDate)} -{' '}
                    {entry.endDate ? formatDate(entry.endDate) : 'Present'}
                  </span>
                </div>
                {entry.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{entry.location}</span>
                  </div>
                )}
              </div>
              {entry.description && (
                <p className="text-gray-700">
                  {entry.description}
                </p>
              )}
              {entry.achievements && entry.achievements.length > 0 && (
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {entry.achievements.map((achievement, idx) => (
                    <li key={idx}>{achievement}</li>
                  ))}
                </ul>
              )}
              {entry.technologies && entry.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

