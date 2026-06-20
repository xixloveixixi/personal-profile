import type { Metadata } from 'next'
import { getDailyEntryBlocks, getPublishedDailyEntries } from '@/lib/notion'
import { DailyClient } from './DailyClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Daily | 阿菥的个人主页',
  description: '碎碎念日历',
  openGraph: {
    title: 'Daily | 阿菥的个人主页',
    description: '碎碎念日历',
    type: 'website',
  },
}

export default async function DailyPage() {
  const entries = await getPublishedDailyEntries().catch(() => [])

  const entriesWithBlocks = await Promise.all(
    entries.map(async (entry) => ({
      ...entry,
      blocks: await getDailyEntryBlocks(entry.id).catch(() => []),
    }))
  )

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 md:py-12">
      <div className="mb-8">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-purple-200/80">
          Daily
        </p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">碎碎念</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300 md:text-base">
          一些按日期散落的短想法、牢骚和当日状态。
        </p>
      </div>

      <DailyClient entries={entriesWithBlocks} />
    </main>
  )
}
