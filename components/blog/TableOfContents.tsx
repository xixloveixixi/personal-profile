'use client'

import { useEffect, useState } from 'react'

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract headings from content
    const headingRegex = /^(#{1,3})\s+(.+)$/gm
    const matches = Array.from(content.matchAll(headingRegex))
    const extractedHeadings: Heading[] = matches.map((match, index) => {
      const level = match[1].length
      const text = match[2]
      const id = `heading-${index}`
      return { id, text, level }
    })
    setHeadings(extractedHeadings)
  }, [content])

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = headings.map((h) => document.getElementById(h.id))
      const scrollPosition = window.scrollY + 100

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i]
        if (element && element.offsetTop <= scrollPosition) {
          setActiveId(headings[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  if (headings.length === 0) {
    return null
  }

  return (
    <nav className="sticky top-8 bg-white">
      <h2 className="text-lg font-semibold mb-4 text-primary-600">
        <span className="w-1 h-5 bg-gradient-to-b from-primary-600 to-primary-600 rounded-full"></span>
        Table of Contents
      </h2>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={`${
              heading.level === 2 ? 'ml-0' : heading.level === 3 ? 'ml-4' : 'ml-8'
            }`}
          >
            <a
              href={`#${heading.id}`}
              className={`block text-sm transition-colors hover:text-primary-600
                activeId === heading.id 
                  ? 'text-primary-600' 
                  : 'text-gray-600'
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

