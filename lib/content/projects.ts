import fs from 'fs'
import path from 'path'

export interface PortfolioProject {
  slug: string
  title: string
  shortDescription: string
  longDescription: string
  problem: string
  solution: string
  challenges?: string
  results?: string
  technologies: string[]
  githubUrl?: string
  demoUrl?: string
  featuredImage: string
  gallery?: string[]
  publishedAt: string
  featured?: boolean
  order?: number
}

const contentDirectory = path.join(process.cwd(), 'content/projects')

export function getAllProjects(): PortfolioProject[] {
  if (!fs.existsSync(contentDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(contentDirectory)
  const projects = fileNames
    .filter((name) => name.endsWith('.json'))
    .map((fileName) => {
      const fullPath = path.join(contentDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const project = JSON.parse(fileContents) as PortfolioProject
      return project
    })
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })

  return projects
}

export function getProjectBySlug(slug: string): PortfolioProject | null {
  try {
    const fullPath = path.join(contentDirectory, `${slug}.json`)
    if (!fs.existsSync(fullPath)) {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8')
    return JSON.parse(fileContents) as PortfolioProject
  } catch (error) {
    console.error(`Error reading project ${slug}:`, error)
    return null
  }
}

export function getFeaturedProjects(): PortfolioProject[] {
  return getAllProjects().filter((project) => project.featured)
}

