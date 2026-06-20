import { Metadata } from 'next'
import { getPublicProjects } from '@/lib/api/public'
import { PortfolioClient } from './PortfolioClient'

export const metadata: Metadata = {
  title: '项目展示 | 阿菥的个人主页',
  description: '我的技术项目作品集',
  openGraph: {
    title: '项目展示 | 蒋乙薪',
    description: '技术项目作品集',
    type: 'website',
  },
}

export default async function PortfolioPage() {
  const projects = await getPublicProjects().catch(() => [])

  return (
    <div className="min-h-full px-4 py-12 md:py-16 relative">
      <div className="max-w-6xl mx-auto">
        <PortfolioClient initialProjects={projects} />
      </div>
    </div>
  )
}
