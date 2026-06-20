'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { NotionBlockRenderer } from '@/components/blog/NotionBlockRenderer'
import type { NotionBlockNode, NotionDailyEntry } from '@/lib/notion'

interface DailyEntryWithBlocks extends NotionDailyEntry {
  blocks: NotionBlockNode[]
}

interface DailyClientProps {
  entries: DailyEntryWithBlocks[]
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function monthLabel(date: Date) {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`
}

function buildMonthCells(monthDate: Date) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingEmptyCells = (firstDay.getDay() + 6) % 7
  const cells: Array<{ key: string; day?: number; dateKey?: string }> = []

  for (let index = 0; index < leadingEmptyCells; index += 1) {
    cells.push({ key: `empty-start-${index}` })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    cells.push({ key: toDateKey(date), day, dateKey: toDateKey(date) })
  }

  const trailingEmptyCells = (7 - (cells.length % 7)) % 7
  for (let index = 0; index < trailingEmptyCells; index += 1) {
    cells.push({ key: `empty-end-${index}` })
  }

  return cells
}

function moveMonth(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

function formatDisplayDate(dateKey?: string) {
  if (!dateKey) return '未设置日期'
  const date = parseDateKey(dateKey)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

export function DailyClient({ entries }: DailyClientProps) {
  const latestEntry = entries[0]
  const initialDate = latestEntry?.date
    ? parseDateKey(latestEntry.date)
    : new Date()
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  )
  const [selectedDateKey, setSelectedDateKey] = useState(
    () => latestEntry?.date || toDateKey(new Date())
  )

  const entriesByDate = useMemo(() => {
    const map = new Map<string, DailyEntryWithBlocks>()
    entries.forEach((entry) => {
      if (entry.date && !map.has(entry.date)) {
        map.set(entry.date, entry)
      }
    })
    return map
  }, [entries])

  const monthCells = useMemo(
    () => buildMonthCells(visibleMonth),
    [visibleMonth]
  )
  const selectedEntry = selectedDateKey
    ? entriesByDate.get(selectedDateKey)
    : undefined

  if (entries.length === 0) {
    return (
      <section className="rounded-lg border border-white/15 bg-white/5 p-6 text-gray-300">
        <h2 className="mb-2 text-xl font-semibold text-white">
          暂时没有碎碎念
        </h2>
        <p className="text-sm leading-7">
          Daily 数据库还没有可公开展示的记录，或 Notion 配置暂时不可用。
        </p>
      </section>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="rounded-lg border border-white/15 bg-white/5 p-4 backdrop-blur-sm md:p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">
            {monthLabel(visibleMonth)}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setVisibleMonth((current) => moveMonth(current, -1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-200 transition hover:border-white/30 hover:bg-white/10"
              aria-label="上个月"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() =>
                setVisibleMonth((current) => moveMonth(current, 1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-200 transition hover:border-white/30 hover:bg-white/10"
              aria-label="下个月"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday}>{weekday}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthCells.map((cell) => {
            if (!cell.dateKey || !cell.day) {
              return (
                <div
                  key={cell.key}
                  className="aspect-square rounded-md border border-transparent"
                />
              )
            }

            const entry = entriesByDate.get(cell.dateKey)
            const isSelected = selectedDateKey === cell.dateKey

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDateKey(cell.dateKey!)}
                className={`relative flex aspect-square min-h-10 flex-col items-start justify-between rounded-md border p-2 text-left transition ${
                  isSelected
                    ? 'border-purple-200 bg-purple-300/20 text-white shadow-lg shadow-purple-500/10'
                    : entry
                      ? 'border-white/20 bg-white/10 text-white hover:border-purple-200/60 hover:bg-purple-300/10'
                      : 'border-white/10 bg-white/[0.02] text-gray-500 hover:border-white/20 hover:bg-white/[0.04]'
                }`}
                aria-label={`${cell.dateKey}${entry ? ` ${entry.title}` : ' 暂无内容'}`}
              >
                <span className="text-sm font-medium">{cell.day}</span>
                {entry ? (
                  <span
                    className="h-1.5 w-8 max-w-full rounded-full bg-cyan-200"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      </section>

      <section className="min-h-[420px] rounded-lg border border-white/15 bg-white/5 p-5 backdrop-blur-sm md:p-6">
        {selectedEntry ? (
          <article>
            <div className="mb-4">
              <p className="mb-2 text-sm text-gray-400">
                {formatDisplayDate(selectedEntry.date)}
              </p>
              <h2 className="text-2xl font-semibold text-white md:text-3xl">
                {selectedEntry.title}
              </h2>
            </div>

            {selectedEntry.tags.length > 0 ? (
              <div className="mb-6 flex flex-wrap gap-2">
                {selectedEntry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-cyan-200/10 px-2 py-1 text-sm text-cyan-50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {selectedEntry.blocks.length > 0 ? (
              <NotionBlockRenderer blocks={selectedEntry.blocks} />
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-gray-300">
                这一天的正文暂时不可用。
              </div>
            )}
          </article>
        ) : (
          <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-gray-300">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-white">
                这一天暂时没有记录
              </h2>
              <p className="text-sm leading-7">
                选择日历中有标记的日期查看碎碎念。
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
