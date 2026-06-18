import { Metadata } from 'next'
import { AboutPageClient } from '@/components/about/AboutPageClient'
import { getPublicProfile, getPublicProjects, getPublicSkills, getPublicTimeline } from '@/lib/api/public'
import { mapPublicTimelineEntry, sortTimelineEntries } from '@/lib/content/about'

export const metadata: Metadata = {
  title: 'About | 阿菥的个人主页',
  description: '蒋乙薪 - AI应用研发工程师，聚焦智能应用构建、性能优化与工程效率提升',
  openGraph: {
    title: '关于我 | 蒋乙薪 - AI应用研发工程师',
    description: '蒋乙薪 - AI应用研发工程师，聚焦智能应用构建、性能优化与工程效率提升',
    type: 'profile',
  },
}

export default async function AboutPage() {
  const [timelineEntries, projects, profile, skills] = await Promise.all([
    getPublicTimeline(),
    getPublicProjects(),
    getPublicProfile().catch(() => null),
    getPublicSkills().catch(() => []),
  ])

  const timeline = sortTimelineEntries(timelineEntries.map(mapPublicTimelineEntry))

  return <AboutPageClient timeline={timeline} projectCount={projects.length} profile={profile} skills={skills} />
}
