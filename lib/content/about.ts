import fs from 'fs'
import path from 'path'

export interface SkillCategory {
  name: string
  category: 'framework' | 'language' | 'tool' | 'soft-skill'
  proficiency: number
  description?: string
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

export interface ContactLink {
  platform: string
  url: string
  icon: string
  label?: string
  order?: number
}

export interface ProfileData {
  skills: SkillCategory[]
  timeline: TimelineEntry[]
  contact: ContactLink[]
}

const aboutDirectory = path.join(process.cwd(), 'content/about')

export function getProfileData(): ProfileData {
  const defaultData: ProfileData = {
    skills: [],
    timeline: [],
    contact: [],
  }

  if (!fs.existsSync(aboutDirectory)) {
    return defaultData
  }

  try {
    const skillsPath = path.join(aboutDirectory, 'skills.json')
    const timelinePath = path.join(aboutDirectory, 'timeline.json')
    const contactPath = path.join(aboutDirectory, 'contact.json')

    const skills = fs.existsSync(skillsPath)
      ? (JSON.parse(fs.readFileSync(skillsPath, 'utf8')) as SkillCategory[])
      : []

    const timeline = fs.existsSync(timelinePath)
      ? (JSON.parse(fs.readFileSync(timelinePath, 'utf8')) as TimelineEntry[])
      : []

    const contact = fs.existsSync(contactPath)
      ? (JSON.parse(fs.readFileSync(contactPath, 'utf8')) as ContactLink[])
      : []

    return {
      skills,
      timeline: timeline.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return b.order - a.order
        }
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      }),
      contact: contact.sort((a, b) => (a.order || 0) - (b.order || 0)),
    }
  } catch (error) {
    console.error('Error reading profile data:', error)
    return defaultData
  }
}

