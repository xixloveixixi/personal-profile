'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ExternalLink, Github, ChevronLeft, ChevronRight } from 'lucide-react'
import type { PortfolioProject } from '@/lib/content/projects'

interface PortfolioClientProps {
  initialProjects: PortfolioProject[]
}

function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [images.length])

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-purple-900/50 to-violet-900/30">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {images[currentIndex] ? (
            <Image
              src={images[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl font-bold text-white/10">{title[0]}</span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCurrentIndex(idx)
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ProjectCard({ project }: { project: PortfolioProject }) {
  const images = project.gallery?.length 
    ? project.gallery 
    : project.featuredImage 
      ? [project.featuredImage] 
      : []

  return (
    <motion.a
      href={project.githubUrl || project.demoUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group block h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300"
    >
      <ImageCarousel images={images} title={project.title} />

      <div className="p-5 flex h-[200px] flex-col">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {project.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {project.githubUrl && (
              <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-white group-hover:border-purple-500/30 group-hover:bg-purple-500/10 transition-all">
                <Github className="w-3.5 h-3.5" />
              </span>
            )}
            {project.demoUrl && (
              <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-white group-hover:border-purple-500/30 group-hover:bg-purple-500/10 transition-all">
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>

        <div className="relative mb-4">
          <p className="text-sm text-white/50 line-clamp-2 min-h-[44px] leading-relaxed cursor-help">
            {project.shortDescription}
          </p>
          <div className="pointer-events-none absolute left-0 right-0 bottom-full mb-2 z-20 rounded-lg border border-white/10 bg-black/85 px-3 py-2 text-xs text-white/90 leading-relaxed opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
            {project.shortDescription}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 min-h-[48px] max-h-[48px] overflow-hidden">
          {project.technologies.map((tech, idx) => (
            <motion.span
              key={tech}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-300/80 border border-purple-500/20"
            >
              {tech}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.a>
  )
}

export function PortfolioClient({ initialProjects }: PortfolioClientProps) {
  const sortedProjects = [...initialProjects].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order
    }
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  return (
    <div className="space-y-12">

      {sortedProjects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-2xl">📂</span>
          </div>
          <p className="text-white/40">暂无项目展示</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map((project, idx) => (
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="h-full"
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-8 border-t border-white/[0.06]"
      >
        <p className="text-xs text-white/30">
          共 {sortedProjects.length} 个项目 · 持续更新中
        </p>
      </motion.div>
    </div>
  )
}
