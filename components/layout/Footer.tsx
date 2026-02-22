import Link from 'next/link'
import { Rss } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-primary-200/50 mt-auto py-8 bg-gradient-to-b from-transparent to-primary-50/30">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center">
          <Link
            href="/blog/rss.xml"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors group"
            aria-label="RSS Feed"
          >
            <Rss className="h-4 w-4 group-hover:rotate-12 transition-transform" />
            RSS Feed
          </Link>
        </div>
      </div>
    </footer>
  )
}

