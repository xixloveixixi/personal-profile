export interface TechStackTag {
  name: string
  slug: string
  category?: 'framework' | 'language' | 'tool' | 'library'
  icon?: string
  color?: string
}

export const TECH_STACK: TechStackTag[] = [
  { name: 'React', slug: 'react', category: 'framework' },
  { name: 'Next.js', slug: 'nextjs', category: 'framework' },
  { name: 'TypeScript', slug: 'typescript', category: 'language' },
  { name: 'Tailwind CSS', slug: 'tailwindcss', category: 'framework' },
  { name: 'Framer Motion', slug: 'framer-motion', category: 'library' },
]

export function getTechStackBySlug(slug: string): TechStackTag | undefined {
  return TECH_STACK.find((tech) => tech.slug === slug)
}

export function getAllTechStack(): TechStackTag[] {
  return TECH_STACK
}

