import Link from 'next/link'

export function Navigation() {
  return (
    <nav className="flex items-center justify-between p-4 ">
      <Link
        href="/"
        className="text-xl font-bold uppercase tracking-wider text-accent-gray"
      >
        axiguagua&apos;s Portfolio
      </Link>
      <div className="flex items-center gap-6">
        <div className="flex gap-4">
          <Link href="/about" className="font-medium text-accent-gray ">
            About
          </Link>
          <span className="text-accent-gray">|</span>
          <Link href="/portfolio" className="font-medium text-accent-gray">
            Projects
          </Link>
          <span className="text-accent-gray">|</span>
          <Link href="/blog" className="font-medium text-accent-gray">
            Blog
          </Link>
          <span className="text-accent-gray">|</span>
          <Link href="/daily" className="font-medium text-accent-gray">
            Daily
          </Link>
          <span className="text-accent-gray">|</span>
          <Link href="/admin/login" className="font-medium text-accent-gray">
            Background
          </Link>
        </div>
      </div>
    </nav>
  )
}
