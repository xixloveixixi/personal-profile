import { Metadata } from 'next'
import { AboutPageClient } from '@/components/about/AboutPageClient'

export const metadata: Metadata = {
  title: 'About | 阿菥的个人主页',
  description: '蒋乙薪 - 前端工程师，专注性能优化与工程化实践，持续探索 MCP 协议等前沿领域',
  openGraph: {
    title: '关于我 | 蒋乙薪 - 前端工程师',
    description: '蒋乙薪 - 前端工程师，专注性能优化与工程化实践',
    type: 'profile',
  },
}

export default function AboutPage() {
  return <AboutPageClient />
}
