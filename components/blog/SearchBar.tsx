'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { createSearchIndex, search } from '@/lib/utils/search'
import type { BlogArticle } from '@/lib/content/blog'

interface SearchBarProps {
  articles: BlogArticle[]
  onSearchResults: (results: BlogArticle[]) => void
}

export function SearchBar({ articles, onSearchResults }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const searchIndex = useMemo(() => {
    return createSearchIndex(articles, {
      keys: ['title', 'description', 'tags'],
      threshold: 0.4,
    })
  }, [articles])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    if (searchQuery.trim()) {
      const results = search(searchIndex, searchQuery)
      onSearchResults(results)
    } else {
      onSearchResults(articles)
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
      <input
        type="text"
        placeholder="Search articles..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300"
        aria-label="Search articles"
      />
    </div>
  )
}

