'use client'

import { useEffect, useMemo, useState } from 'react'
import { Phone, Mail, Github, ExternalLink, Calendar, Star, Zap, Code2, Award } from 'lucide-react'
import { motion } from 'framer-motion'
import type { TimelineEntry } from '@/lib/content/about'
import type { PublicProfile, PublicSkill } from '@/lib/api/public'

import { BlurFade } from '@/components/magicui/blur-fade'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { MagicCard } from '@/components/magicui/magic-card'
import { Meteors } from '@/components/magicui/meteors'
import { Particles } from '@/components/magicui/particles'

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <BlurFade delay={delay * 0.001} inView>
      {children}
    </BlurFade>
  )
}

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30">
        <Icon className="w-5 h-5 text-purple-400" />
      </div>
      <h2 className="text-2xl font-bold text-white tracking-tight">{children}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
    </div>
  )
}

function TechBadge({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/25 hover:bg-purple-500/30 hover:border-purple-400/50 hover:shadow-[0_0_8px_rgba(168,85,247,0.35)] transition-all duration-200 cursor-default"
    >
      {children}
    </motion.span>
  )
}

interface AboutPageClientProps {
  timeline: TimelineEntry[]
  projectCount: number
  profile: PublicProfile | null
  skills: PublicSkill[]
}

function formatDateRange(startDate: string, endDate?: string | null) {
  const start = new Date(startDate).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
  })
  const end = endDate
    ? new Date(endDate).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'numeric',
      })
    : '至今'

  return `${start} — ${end}`
}

export function AboutPageClient({ timeline, projectCount, profile, skills }: AboutPageClientProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const internshipEntries = timeline.filter((entry) => entry.type === 'work' && entry.organization !== '项目经历')
  const projectEntries = timeline.filter((entry) => entry.type === 'work' && entry.organization === '项目经历')
  const educationEntry = timeline.find((entry) => entry.type === 'education')
  const skillGroups = useMemo(() => {
    const groups = new Map<string, string[]>()

    for (const skill of skills) {
      const category = skill.category?.trim() || '未分类'
      const name = skill.name?.trim()
      if (!name) continue

      const tags = groups.get(category)
      if (tags) {
        tags.push(name)
      } else {
        groups.set(category, [name])
      }
    }

    return Array.from(groups.entries()).map(([label, tags]) => ({ label, tags }))
  }, [skills])

  return (
    <div className="min-h-full px-4 py-12 md:py-16 relative">
      {mounted ? (
        <Particles
          className="absolute inset-0 z-0 pointer-events-none"
          quantity={50}
          ease={80}
          color="#a855f7"
          size={0.3}
          staticity={50}
        />
      ) : null}

      <div className="max-w-3xl mx-auto space-y-16 relative z-10">
        <Section>
          <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm p-5 md:p-8 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              <div className="lg:col-span-7 space-y-6 md:space-y-7">
                <div className="space-y-3">
                  <BlurFade delay={0.2}>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-none">
                      {profile?.displayName || '蒋乙菥'}
                    </h1>
                  </BlurFade>
                  <BlurFade delay={0.3}>
                    <div className="flex flex-wrap items-center gap-2 text-base md:text-xl">
                      <span className="text-purple-200 font-medium">{profile?.headline || 'AI应用研发工程师'}</span>
                    </div>
                  </BlurFade>
                </div>
                <BlurFade delay={0.6}>
                  <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-xl">
                    {profile?.bio || '有技术追求的AI应用研发工程师，专注聚焦智能应用构建、性能优化与工程效率提升，持续探索前沿领域，坚持输出原创技术文章。'}
                  </p>
                </BlurFade>
              </div>

              <div className="lg:col-span-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 7, suffix: 'w+', label: '博客访问', desc: '持续增长', color: 'from-purple-500 to-violet-600' },
                    { value: 400, suffix: '+', label: '技术粉丝', desc: '多平台沉淀', color: 'from-violet-500 to-purple-600' },
                    { value: internshipEntries.length, suffix: '', label: '实习经历', desc: '真实业务实践', color: 'from-pink-500 to-rose-600' },
                    { value: projectCount, suffix: '', label: '项目作品', desc: '含可视化与组件库', color: 'from-orange-500 to-amber-600' },
                  ].map((stat, idx) => (
                    <BlurFade key={stat.label} delay={0.3 + idx * 0.1}>
                      <motion.div
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 hover:border-purple-500/30 transition-all group min-h-[118px]"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                        <div className="relative">
                          <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                            <NumberTicker value={stat.value} suffix={stat.suffix} className="text-white" />
                          </div>
                          <div className="text-xs text-white/45">{stat.label}</div>
                          <div className="mt-1 text-[11px] text-white/30 leading-relaxed">{stat.desc}</div>
                        </div>
                        <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-2xl" />
                      </motion.div>
                    </BlurFade>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section delay={100}>
          <SectionTitle icon={Zap}>实习经历</SectionTitle>
          <div className="space-y-5">
            {internshipEntries.map((entry) => (
              <MagicCard
                key={entry.id}
                className="group relative rounded-2xl border border-purple-500/20 bg-white/[0.03] backdrop-blur-sm p-6 hover:border-purple-500/45 hover:bg-white/[0.06] transition-all duration-300"
                gradientFrom="#a855f7"
                gradientTo="#7c3aed"
                gradientOpacity={0.15}
              >
                <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <Meteors number={5} />
                </div>
                <div className="w-full flex items-center justify-between gap-6 md:gap-10 mb-5 pb-3 border-b border-white/[0.06] relative z-10">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-white truncate">{entry.organization}</h3>
                  </div>
                  <span className="flex items-center gap-1 text-xs md:text-sm text-purple-300/90 font-medium whitespace-nowrap shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateRange(entry.startDate, entry.endDate)}
                  </span>
                </div>
                {entry.description ? <p className="relative z-10 text-white/60 text-sm leading-relaxed mb-4">{entry.description}</p> : null}
                <div className="space-y-4 relative z-10 w-full max-w-[680px]">
                  {(entry.achievements ?? []).map((achievement, idx) => (
                    <BlurFade key={`${entry.id}-${idx}`} delay={0.1 * (idx + 1)} className="w-full">
                      <div className="flex w-full items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                        <span className="mt-[1px] inline-flex h-4 w-4 shrink-0 items-center justify-center text-purple-400">✦</span>
                        <div className="flex-1 text-left">
                          <p className="text-white/55 text-xs leading-relaxed">{achievement}</p>
                        </div>
                      </div>
                    </BlurFade>
                  ))}
                  {(entry.technologies ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.technologies?.map((tech, idx) => (
                        <BlurFade key={`${entry.id}-${tech}`} delay={0.03 * idx}>
                          <TechBadge>{tech}</TechBadge>
                        </BlurFade>
                      ))}
                    </div>
                  ) : null}
                </div>
              </MagicCard>
            ))}
          </div>
        </Section>

        <Section delay={150}>
          <SectionTitle icon={Code2}>项目经历</SectionTitle>
          <div className="space-y-4">
            {projectEntries.map((entry, entryIdx) => (
              <MagicCard
                key={entry.id}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 hover:border-purple-500/35 hover:bg-white/[0.05] transition-all duration-300"
                gradientFrom={entryIdx % 2 === 0 ? '#6366f1' : '#ec4899'}
                gradientTo="#a855f7"
                gradientOpacity={0.1}
              >
                <div className="w-full grid grid-cols-1 md:grid-cols-3 items-center gap-x-3 gap-y-2 mb-3 relative z-10">
                  <h3 className="text-base font-bold text-white truncate min-w-0 justify-self-start w-full">{entry.title}</h3>
                  <span className="text-[11px] md:text-xs text-purple-300/80 whitespace-nowrap justify-self-center">{entry.location || '项目经历'}</span>
                  <span className="text-xs text-purple-400 whitespace-nowrap justify-self-end">{formatDateRange(entry.startDate, entry.endDate)}</span>
                </div>
                {(entry.technologies ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-3 relative z-10">
                    {entry.technologies?.map((tech, idx) => (
                      <BlurFade key={`${entry.id}-${tech}`} delay={0.03 * idx}>
                        <TechBadge>{tech}</TechBadge>
                      </BlurFade>
                    ))}
                  </div>
                ) : null}
                <div className="h-px bg-white/[0.06] mb-3 relative z-10" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs relative z-10">
                  {(entry.achievements ?? []).map((achievement, idx) => (
                    <BlurFade key={`${entry.id}-${idx}`} delay={0.1 * (idx + 1)} className="h-full">
                      <div className="h-full min-h-[76px] rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-2">
                        <p className="text-white/50">{achievement}</p>
                      </div>
                    </BlurFade>
                  ))}
                </div>
              </MagicCard>
            ))}
          </div>
        </Section>

        {skillGroups.length > 0 ? (
          <Section delay={200}>
            <SectionTitle icon={Star}>技能矩阵</SectionTitle>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6 space-y-5">
              {skillGroups.map(({ label, tags }, sectionIdx) => (
                <BlurFade key={label} delay={0.1 * sectionIdx}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <span className="text-xs font-semibold text-purple-400/80 w-20 shrink-0 pt-0.5">{label}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag, idx) => (
                        <motion.div
                          key={`${label}-${tag}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 * idx + 0.1 * sectionIdx }}
                        >
                          <TechBadge>{tag}</TechBadge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </BlurFade>
              ))}
            </div>
          </Section>
        ) : null}

        <Section delay={250}>
          <SectionTitle icon={Award}>教育背景 &amp; 荣誉</SectionTitle>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-base font-bold text-white">{educationEntry?.organization || '教育背景'}</h3>
              <p className="text-sm text-right text-white/55">
                {educationEntry?.title || '学习经历'} · {educationEntry ? formatDateRange(educationEntry.startDate, educationEntry.endDate) : '—'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(educationEntry?.achievements ?? []).map((achievement, idx) => (
                <BlurFade key={idx} delay={0.05 * idx}>
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-center gap-2 text-sm text-white/65 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 hover:bg-purple-500/5 transition-all cursor-default"
                  >
                    {achievement}
                  </motion.div>
                </BlurFade>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
