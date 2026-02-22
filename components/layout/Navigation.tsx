import Link from 'next/link'

export function Navigation() {
  return (
    <nav className="flex items-center justify-between p-4 ">
      <Link href="/" className="text-xl font-bold uppercase tracking-wider text-accent-gray"> 
        axiguagua&apos;s Portfolio
      </Link>
      <div className="flex items-center gap-6">
        <div className="flex gap-4">
          <Link href="/about" className="text-accent-gray font-medium ">
            About
          </Link>
          <span className="text-accent-gray">|</span>
          <Link href="/portfolio" className="text-accent-gray font-medium">
            Projects
          </Link>
          <span className="text-accent-gray">|</span>
          <Link href="/blog" className="text-accent-gray font-medium">
            Blog
          </Link>
        </div>
      </div>
    </nav>
  )
}

