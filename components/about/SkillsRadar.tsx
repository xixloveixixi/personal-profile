'use client'

import { useMemo } from 'react'
import type { SkillCategory } from '@/lib/content/about'

interface SkillsRadarProps {
  skills: SkillCategory[]
}

export function SkillsRadar({ skills }: SkillsRadarProps) {
  const categories = useMemo(() => {
    const categoryMap = new Map<
      'framework' | 'language' | 'tool' | 'soft-skill',
      SkillCategory[]
    >()
    skills.forEach((skill) => {
      const existing = categoryMap.get(skill.category) || []
      categoryMap.set(skill.category, [...existing, skill])
    })
    return categoryMap
  }, [skills])

  const categoryLabels = {
    framework: 'Frameworks',
    language: 'Languages',
    tool: 'Tools',
    'soft-skill': 'Soft Skills',
  }

  return (
    <div className="space-y-8">
      {Array.from(categories.entries()).map(([category, categorySkills]) => (
        <div key={category} className="bg-white">
          <h3 className="text-xl font-bold mb-6 text-primary-600">
            <span className="w-1 h-6 bg-gradient-to-b from-primary-600 to-primary-600 rounded-full"></span>
            {categoryLabels[category]}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categorySkills.map((skill) => (
              <div key={skill.name} className="space-y-3 group">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">
                    {skill.name}
                  </span>
                  <span className="text-sm font-bold text-primary-600">
                    {skill.proficiency}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-primary-600 via-primary-900 to-primary-600 h-3 rounded-full transition-all duration-700 ease-out shadow-lg shadow-primary-600/50 relative overflow-hidden"
                    style={{ width: `${skill.proficiency}%` }}
                    role="progressbar"
                    aria-valuenow={skill.proficiency}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

