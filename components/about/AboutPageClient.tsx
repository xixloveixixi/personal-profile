'use client'

import { useEffect, useRef, useState } from 'react'
import { Phone, Mail, Github, ExternalLink, Calendar, Star, Zap, Code2, Award } from 'lucide-react'
import { motion } from 'framer-motion'

// MagicUI Components
import { BlurFade } from '@/components/magicui/blur-fade'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { MagicCard } from '@/components/magicui/magic-card'
import { Meteors } from '@/components/magicui/meteors'
import { Particles } from '@/components/magicui/particles'
import AnimatedShinyText from '@/components/magicui/animated-shiny-text'

/* ─── Intersection Observer Hook ───────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ─── Animated Section Wrapper ──────────────────────────────── */
function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <BlurFade delay={delay * 0.001} inView>
      {children}
    </BlurFade>
  )
}

/* ─── Section Title ──────────────────────────────────────────── */
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

/* ─── Tech Badge ─────────────────────────────────────────────── */
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

/* ─── Metric Badge ───────────────────────────────────────────── */
function MetricBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-bold text-purple-300">{children}</span>
  )
}

/* ─────────────────────────────────────────────────────────────── */
/*                       MAIN COMPONENT                           */
/* ─────────────────────────────────────────────────────────────── */
export function AboutPageClient() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-full px-4 py-12 md:py-16 relative">
      {/* Background Particles */}
      {mounted && (
        <Particles
          className="absolute inset-0 z-0 pointer-events-none"
          quantity={50}
          ease={80}
          color="#a855f7"
          size={0.3}
          staticity={50}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-16 relative z-10">

        {/* ── HERO ────────────────────────────────────────────── */}
        <Section>
          <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm p-5 md:p-8 overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* 左侧：主要内容 */}
              <div className="lg:col-span-7 space-y-6 md:space-y-7">
                {/* 名字 - 大字体 */}
                <div className="space-y-3">
                  <BlurFade delay={0.2}>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-none">
                      蒋乙菥
                    </h1>
                  </BlurFade>
                  <BlurFade delay={0.3}>
                    <div className="flex flex-wrap items-center gap-2 text-base md:text-xl">
                      <span className="text-purple-200 font-medium">前端工程师</span>
                      <span className="hidden md:block text-white/20">·</span>
                      <span className="text-white/50 text-sm md:text-base">持续学习，不断探索</span>
                    </div>
                  </BlurFade>
                </div>

                <BlurFade delay={0.45}>
                  <div className="flex flex-wrap gap-2">
                    {["React", "Next.js", "TypeScript", "AI + 前端"].map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 py-1 text-xs text-purple-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </BlurFade>

                {/* 简介 */}
                <BlurFade delay={0.6}>
                  <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-xl">
                    有技术追求的前端工程师，专注<span className="text-purple-300">性能优化与工程化实践</span>，
                    持续<span className="text-purple-300">探索前沿领域</span>，坚持<span className="text-purple-300">输出原创技术文章</span>。
                  </p>
                </BlurFade>

                {/* 联系方式 - 图标形式 */}
                <BlurFade delay={0.7}>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    {[
                      { href: "https://github.com/xixloveixixi", icon: Github, label: "GitHub" },
                      { href: "mailto:3186932737@qq.com", icon: Mail, label: "Email" },
                      { href: "https://juejin.cn/user/1373741800227131", icon: ExternalLink, label: "掘金" },
                      { href: "https://blog.csdn.net/2403_88913721?spm=1000.2115.3001.5343", icon: ExternalLink, label: "CSDN" },
                      { icon: Phone, label: "电话", tooltip: "18723832290" },
                    ].map((link) =>
                      link.href ? (
                        <motion.a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/10 transition-all shadow-sm"
                          aria-label={link.label}
                        >
                          <link.icon className="w-4 h-4" />
                          <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/80 px-2 py-1 text-xs text-white opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                            {link.tooltip ?? link.label}
                          </span>
                        </motion.a>
                      ) : (
                        <motion.div
                          key={link.label}
                          whileHover={{ scale: 1.1, y: -2 }}
                          className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/10 transition-all cursor-default shadow-sm"
                          aria-label={link.label}
                        >
                          <link.icon className="w-4 h-4" />
                          <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/80 px-2 py-1 text-xs text-white opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                            {link.tooltip ?? link.label}
                          </span>
                        </motion.div>
                      )
                    )}
                  </div>
                </BlurFade>
              </div>

              {/* 右侧：数据卡片网格 */}
              <div className="lg:col-span-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 7, suffix: "w+", label: "博客访问", desc: "持续增长", color: "from-purple-500 to-violet-600" },
                    { value: 400, suffix: "+", label: "技术粉丝", desc: "多平台沉淀", color: "from-violet-500 to-purple-600" },
                    { value: 2, suffix: "", label: "实习经历", desc: "真实业务实践", color: "from-pink-500 to-rose-600" },
                    { value: 10, suffix: "+", label: "项目作品", desc: "含可视化与组件库", color: "from-orange-500 to-amber-600" },
                  ].map((stat, idx) => (
                    <BlurFade key={stat.label} delay={0.3 + idx * 0.1}>
                      <motion.div
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 hover:border-purple-500/30 transition-all group min-h-[118px]"
                      >
                        {/* 渐变背景 */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

                        <div className="relative">
                          <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                            <NumberTicker
                              value={stat.value}
                              suffix={stat.suffix}
                              className="text-white"
                            />
                          </div>
                          <div className="text-xs text-white/45">{stat.label}</div>
                          <div className="mt-1 text-[11px] text-white/30 leading-relaxed">{stat.desc}</div>
                        </div>

                        {/* 装饰角 */}
                        <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-2xl" />
                      </motion.div>
                    </BlurFade>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── INTERNSHIP ──────────────────────────────────────── */}
        <Section delay={100}>
          <SectionTitle icon={Zap}>实习经历</SectionTitle>
          <div className="space-y-5">

            {/* 莉莉丝 */}
            <MagicCard
              className="group relative rounded-2xl border border-purple-500/20 bg-white/[0.03] backdrop-blur-sm p-6 hover:border-purple-500/45 hover:bg-white/[0.06] transition-all duration-300"
              gradientFrom="#a855f7"
              gradientTo="#7c3aed"
              gradientOpacity={0.15}
            >
              {/* Meteors effect on hover */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <Meteors number={5} />
              </div>

              {/* Header */}
              <div className="w-full flex items-center justify-between gap-6 md:gap-10 mb-5 pb-3 border-b border-white/[0.06] relative z-10">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-white truncate">上海莉莉丝科技有限公司</h3>
                </div>
                <span className="flex items-center gap-1 text-xs md:text-sm text-purple-300/90 font-medium whitespace-nowrap shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  2025.11 — 2026.2
                </span>
              </div>

              {/* Achievements */}
              <div className="space-y-4 relative z-10 w-full max-w-[680px]">
                {[
                  {
                    title: "大数据表字段渲染性能优化",
                    desc: "虚拟滚动 + 按需懒加载 + 智能滚动检测，首屏渲染",
                    metric: "2.3s → 0.5s",
                    extra: "，内存占用降低",
                    metric2: "95%+",
                    extra2: "，支撑万级字段流畅渲染"
                  },
                  {
                    title: "Figma-MCP 使用指南文档沉淀",
                    desc: "通过优化 AI 提示规则，解决样式还原与组件复用问题，使新功能迭代周期缩短",
                    metric: "15%–20%",
                    extra: ""
                  },
                  {
                    title: "DAP 移动端性能优化 — HTTP 层请求去重",
                    desc: "Map 管理 pending 队列 + 拦截器自动 abort 重复请求，解决筛选条件快速切换导致的接口竞态问题",
                    metric: "",
                    extra: ""
                  }
                ].map((item, idx) => (
                  <BlurFade key={idx} delay={0.1 * (idx + 1)} className="w-full">
                    <div className="flex w-full gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                      <span className="text-purple-400 shrink-0 mt-0.5">✦</span>
                      <div className="text-left">
                        <p className="text-white/90 text-sm font-medium mb-1">{item.title}</p>
                        <p className="text-white/55 text-xs leading-relaxed">
                          {item.desc}
                          {item.metric && <MetricBadge>{item.metric}</MetricBadge>}
                          {item.extra}
                          {item.metric2 && <MetricBadge>{item.metric2}</MetricBadge>}
                          {item.extra2}
                        </p>
                      </div>
                    </div>
                  </BlurFade>
                ))}
              </div>
            </MagicCard>
            {/* 维搭 */}
            <MagicCard
              className="group relative rounded-2xl border border-purple-500/20 bg-white/[0.03] backdrop-blur-sm p-6 hover:border-purple-500/45 hover:bg-white/[0.06] transition-all duration-300"
              gradientFrom="#a855f7"
              gradientTo="#7c3aed"
              gradientOpacity={0.15}
            >
              {/* Meteors effect on hover */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <Meteors number={5} />
              </div>

              {/* Header */}
              <div className="w-full flex items-center justify-between gap-6 md:gap-10 mb-5 pb-3 border-b border-white/[0.06] relative z-10">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-white truncate">上海维搭信息科技有限公司</h3>
                </div>
                <span className="flex items-center gap-1 text-xs md:text-sm text-purple-300/90 font-medium whitespace-nowrap shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  2025.7 — 2025.10
                </span>
              </div>

              {/* Achievements */}
              <div className="space-y-4 relative z-10 w-full max-w-[680px]">
                {[
                  { title: "自适应布局算法设计", desc: "实时检测视口与元素边界，动态优化弹窗位置，解决 3D 场景 UI 溢出问题" },
                  { title: "定制化业务组件开发", desc: "针对复杂交互需求设计并实现", metric: "10+", extra: "个定制组件（图表、浮动卡片、弹窗等）" },
                  { title: "标准化组件资产沉淀", desc: "为公司统一物料库贡献", metric: "7 个", extra: "标准化组件，被", metric2: "3 个", extra2: "项目复用" }
                ].map((item, idx) => (
                  <BlurFade key={idx} delay={0.1 * (idx + 1)} className="w-full">
                    <div className="flex w-full gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                      <span className="text-purple-400 shrink-0 mt-0.5">✦</span>
                      <div className="text-left">
                        <p className="text-white/90 text-sm font-medium mb-1">{item.title}</p>
                        <p className="text-white/55 text-xs leading-relaxed">
                          {item.desc}
                          {item.metric && <MetricBadge>{item.metric}</MetricBadge>}
                          {item.extra}
                          {item.metric2 && <MetricBadge>{item.metric2}</MetricBadge>}
                          {item.extra2}
                        </p>
                      </div>
                    </div>
                  </BlurFade>
                ))}
              </div>
            </MagicCard>


          </div>
        </Section>

        {/* ── PROJECTS ────────────────────────────────────────── */}
        <Section delay={150}>
          <SectionTitle icon={Code2}>项目经历</SectionTitle>
          <div className="space-y-4">

            {/* 农交中心 */}
            <MagicCard
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 hover:border-purple-500/35 hover:bg-white/[0.05] transition-all duration-300"
              gradientFrom="#6366f1"
              gradientTo="#a855f7"
              gradientOpacity={0.1}
            >
              <div className="w-full grid grid-cols-3 items-center gap-x-3 mb-3 relative z-10">
                <h3 className="text-base font-bold text-white truncate min-w-0 justify-self-start w-full">湘潭农交中心 · 农田项目大屏</h3>
                <span className="text-[11px] md:text-xs text-purple-300/80 whitespace-nowrap justify-self-center">前端核心开发成员</span>
                <span className="text-xs text-purple-400 whitespace-nowrap justify-self-end">2024.12 — 2025.2</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3 relative z-10">
                {['Vue3', 'Vue Router', 'Pinia', 'TypeScript', 'Echarts', '天地图', 'Vite', 'Axios'].map((t, idx) => (
                  <BlurFade key={t} delay={0.03 * idx}>
                    <TechBadge>{t}</TechBadge>
                  </BlurFade>
                ))}
              </div>
              <div className="h-px bg-white/[0.06] mb-3 relative z-10" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs relative z-10">
                {[
                  { title: "核心地图功能", desc: "天地图 GIS 可视化，底图加载·图层叠加·交互控制" },
                  { title: "大数据性能优化", desc: "万级坐标数据，渲染时间", metric: "3s → 1.5s" },
                  { title: "Axios 二次封装", desc: "统一拦截器·请求头配置·异常处理" }
                ].map((item, idx) => (
                  <BlurFade key={idx} delay={0.1 * (idx + 1)} className="h-full">
                    <div className="h-full min-h-[76px] rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-2">
                      <p className="text-purple-300 font-medium mb-0.5">{item.title}</p>
                      <p className="text-white/50">
                        {item.desc}
                        {item.metric && <span className="text-purple-300 font-bold">{item.metric}</span>}
                      </p>
                    </div>
                  </BlurFade>
                ))}
              </div>
            </MagicCard>

            {/* Cream Design */}
            <MagicCard
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 hover:border-purple-500/35 hover:bg-white/[0.05] transition-all duration-300"
              gradientFrom="#ec4899"
              gradientTo="#f97316"
              gradientOpacity={0.1}
            >
              <div className="w-full grid grid-cols-3 items-center gap-x-3 mb-3 relative z-10">
                <h3 className="text-base font-bold text-white truncate min-w-0 justify-self-start w-full">Cream-Design 组件库</h3>
                  <span className="text-[11px] md:text-xs text-purple-300/80 whitespace-nowrap justify-self-center">
                    前端开发负责人
                </span>
                <span className="text-xs text-purple-400 whitespace-nowrap justify-self-end">2025.5 — 2025.7</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3 relative z-10">
                {['React', 'TypeScript', 'SCSS', 'Storybook', 'Rollup', 'Jest', 'ESLint'].map((t, idx) => (
                  <BlurFade key={t} delay={0.03 * idx}>
                    <TechBadge>{t}</TechBadge>
                  </BlurFade>
                ))}
              </div>
              <div className="h-px bg-white/[0.06] mb-3 relative z-10" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs relative z-10">
                {[
                  { title: "虚拟滚动优化", desc: "万级数据流畅渲染，初始 DOM 节点减少", metric: "80.3%" },
                  { title: "大文件分片上传", desc: "Web Worker + IndexedDB 断点续传，吞吐提升", metric: "81%" },
                  { title: "表单验证引擎", desc: "useReducer + async-validator，跨字段联动校验" }
                ].map((item, idx) => (
                  <BlurFade key={idx} delay={0.1 * (idx + 1)} className="h-full">
                    <div className="h-full min-h-[76px] rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-2">
                      <p className="text-purple-300 font-medium mb-0.5">{item.title}</p>
                      <p className="text-white/50">
                        {item.desc}
                        {item.metric && <span className="text-purple-300 font-bold">{item.metric}</span>}
                      </p>
                    </div>
                  </BlurFade>
                ))}
              </div>
            </MagicCard>
          </div>
        </Section>

        {/* ── SKILLS ──────────────────────────────────────────── */}
        <Section delay={200}>
          <SectionTitle icon={Star}>技能矩阵</SectionTitle>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6 space-y-5">
            {[
              {
                label: '前端框架',
                tags: ['React', 'Vue3', 'Next.js', 'TypeScript', 'JavaScript', 'HTML5 / CSS3'],
              },
              {
                label: '工程化',
                tags: ['Webpack', 'Vite', 'Rollup', 'Git', 'ESLint / Prettier'],
              },
              {
                label: 'UI & 可视化',
                tags: ['Ant Design', 'Element UI', 'Echarts', 'Tailwind CSS', 'SCSS'],
              },
              {
                label: '前沿技术',
                tags: ['MCP 协议', 'Prompt Engineering', 'Agent 开发', 'Web Worker',],
              },
            ].map(({ label, tags }, sectionIdx) => (
              <BlurFade key={label} delay={0.1 * sectionIdx}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <span className="text-xs font-semibold text-purple-400/80 w-20 shrink-0 pt-0.5">{label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t, idx) => (
                      <motion.div
                        key={t}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * idx + 0.1 * sectionIdx }}
                      >
                        <TechBadge>{t}</TechBadge>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>
        </Section>

        {/* ── EDUCATION ───────────────────────────────────────── */}
        <Section delay={250}>
          <SectionTitle icon={Award}>教育背景 &amp; 荣誉</SectionTitle>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">湖南科技大学</h3>
                <p className="text-sm text-white/55 mt-0.5">数据科学与大数据技术 · 2023 — 2027</p>
              </div>
              <div className="flex items-center gap-2">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/25 text-purple-300 text-sm font-bold"
                >
                  GPA 3.78 / 4.0
                </motion.span>
                <span className="text-xs text-white/40">专业第四</span>
              </div>
            </div>

            <div className="h-px bg-white/[0.06] mb-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                '🏅 国家励志奖学金',
                '🥇 校一等奖学金',
                '🏆 湖南省计算机作品赛三等奖',
                '📋 湖南省大学生创新创业省级立项',
                '📜 CET-4 英语四级',
                '💻 中级软件设计师',
              ].map((honor, idx) => (
                <BlurFade key={idx} delay={0.05 * idx}>
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-center gap-2 text-sm text-white/65 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 hover:bg-purple-500/5 transition-all cursor-default"
                  >
                    {honor}
                  </motion.div>
                </BlurFade>
              ))}
            </div>

            <BlurFade delay={0.4}>
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <AnimatedShinyText className="text-xs text-white/40 text-center justify-center">
                  以组长身份主导&quot;忆伴&quot;项目，协调跨职能团队完成开发与落地，获批省级立项，收获 10 余项奖项
                </AnimatedShinyText>
              </div>
            </BlurFade>
          </div>
        </Section>

      </div>
    </div>
  )
}
