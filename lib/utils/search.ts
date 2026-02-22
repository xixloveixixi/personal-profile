import Fuse from 'fuse.js'

export interface SearchableItem {
  title: string
  content?: string
  tags?: string[]
}

export interface SearchOptions {
  keys: string[]
  threshold?: number
  minMatchCharLength?: number
}

const defaultOptions: SearchOptions = {
  keys: ['title', 'content', 'tags'],
  threshold: 0.4,
  minMatchCharLength: 2,
}

export function createSearchIndex<T extends SearchableItem>(
  items: T[],
  options: SearchOptions = defaultOptions
): Fuse<T> {
  return new Fuse(items, {
    keys: options.keys,
    threshold: options.threshold ?? 0.4,
    minMatchCharLength: options.minMatchCharLength ?? 2,
    includeScore: true,
  })
}

export function search<T extends SearchableItem>(
  index: Fuse<T>,
  query: string
): T[] {
  if (!query.trim()) {
    return []
  }

  const results = index.search(query)
  return results.map((result) => result.item)
}

