'use client'

import { useState, useMemo } from 'react'
import { ArticleList } from '@/components/blog/ArticleList'
import { SearchBar } from '@/components/blog/SearchBar'
import type { BlogArticle } from '@/lib/content/blog'

interface BlogClientProps {
  initialArticles: BlogArticle[]
}

export function BlogClient({ initialArticles }: BlogClientProps) {
  const [searchResults, setSearchResults] = useState<BlogArticle[]>(initialArticles)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredArticles = useMemo(() => {
    let articles = searchResults

    // Apply category filter
    if (selectedCategory) {
      articles = articles.filter((article) => article.category === selectedCategory)
    }

    return articles
  }, [searchResults, selectedCategory])

  const handleSearch = (results: BlogArticle[]) => {
    setSearchResults(results)
  }

  const categories = ['technical', 'essays', 'tutorials']

  return (
    <div>
      <div className="mb-8 space-y-4">
        <SearchBar articles={initialArticles} onSearchResults={handleSearch} />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-md transition-all ${
              selectedCategory === null
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 hover:bg-primary-600'
                : 'bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-md capitalize transition-all ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 hover:bg-primary-600'
                  : 'bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <ArticleList articles={filteredArticles} />
    </div>
  )
}

