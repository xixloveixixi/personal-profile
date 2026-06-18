import type { PublicTimelineEntry } from '@/lib/api/public'

export interface SkillCategory {
  name: string
  category: 'framework' | 'language' | 'tool' | 'soft-skill'
  proficiency: number
  description?: string
}

export interface ContactLink {
  platform: string
  url: string
  icon: string
  label?: string
  order?: number
}

export interface TimelineEntry {
  id: string
  type: 'education' | 'work'
  title: string
  organization: string
  location?: string
  startDate: string
  endDate?: string | null
  description?: string
  achievements?: string[]
  technologies?: string[]
  order?: number
}

export function mapPublicTimelineEntry(entry: PublicTimelineEntry): TimelineEntry {
  return {
    id: entry.entryId,
    type: entry.type,
    title: entry.title,
    organization: entry.organization,
    location: entry.location || undefined,
    startDate: entry.startDate,
    endDate: entry.endDate,
    description: entry.description || undefined,
    achievements: entry.achievements ?? [],
    technologies: entry.technologies ?? [],
    order: entry.sortOrder,
  }
}

export function sortTimelineEntries(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries]
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    })
    .reverse()
}
