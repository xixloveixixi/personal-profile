'use client'

import { useEffect, useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language, className = '' }: CodeBlockProps) {
  const [highlightedCode, setHighlightedCode] = useState(code)

  useEffect(() => {
    // In a real implementation, you would use rehype-highlight here
    // For now, we'll just display the code with basic formatting
    setHighlightedCode(code)
  }, [code])

  return (
    <pre
      className={`overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100 ${className}`}
    >
      <code className={language ? `language-${language}` : ''}>{highlightedCode}</code>
    </pre>
  )
}

