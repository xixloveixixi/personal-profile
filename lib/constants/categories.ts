export type CategoryId = 'technical' | 'essays' | 'tutorials'

export interface Category {
  id: CategoryId
  name: string
  description?: string
  color?: string
}

export const CATEGORIES: Record<CategoryId, Category> = {
  technical: {
    id: 'technical',
    name: 'Technical',
    description: 'Technical articles and deep dives',
    color: 'blue',
  },
  essays: {
    id: 'essays',
    name: 'Essays',
    description: 'Personal thoughts and reflections',
    color: 'purple',
  },
  tutorials: {
    id: 'tutorials',
    name: 'Tutorials',
    description: 'Step-by-step guides and tutorials',
    color: 'green',
  },
}

export function getCategoryById(id: CategoryId): Category {
  return CATEGORIES[id]
}

export function getAllCategories(): Category[] {
  return Object.values(CATEGORIES)
}

