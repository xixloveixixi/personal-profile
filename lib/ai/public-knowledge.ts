import {
  getPublicContacts,
  getPublicProfile,
  getPublicSkills,
  getPublicTimeline,
  type PublicContact,
  type PublicProfile,
  type PublicSkill,
  type PublicTimelineEntry,
} from '@/lib/api/public'

export type PublicKnowledgeType = 'profile' | 'contact' | 'skill' | 'project' | 'timeline'

export interface PublicKnowledgeChunk {
  id: string
  type: PublicKnowledgeType
  title: string
  content: string
  source?: string
  score?: number
  metadata?: Record<string, unknown>
}

export interface PublicKnowledgeData {
  profile: PublicProfile | null
  contacts: PublicContact[]
  skills: PublicSkill[]
  timeline: PublicTimelineEntry[]
}

export interface PublicKnowledgeSearchResult extends PublicKnowledgeChunk {
  score: number
}

const CONTACT_KEYWORDS = ['联系', '联系方式', '邮箱', 'email', 'github', '电话', '微信', '掘金', 'csdn']

async function safeLoad<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch (error) {
    console.warn('Public knowledge load failed:', error)
    return fallback
  }
}

export async function loadPublicKnowledgeData(): Promise<PublicKnowledgeData> {
  const [profile, contacts, skills, timeline] = await Promise.all([
    safeLoad(() => getPublicProfile(), null),
    safeLoad(() => getPublicContacts(), []),
    safeLoad(() => getPublicSkills(), []),
    safeLoad(() => getPublicTimeline(), []),
  ])

  return {
    profile,
    contacts,
    skills,
    timeline,
  }
}

function compactLines(lines: Array<string | false | null | undefined>): string {
  return lines.filter(Boolean).join('\n')
}

function buildProfileChunk(profile: PublicProfile): PublicKnowledgeChunk {
  return {
    id: `profile-${profile.id}`,
    type: 'profile',
    title: '公开个人信息',
    content: compactLines([
      `姓名：${profile.displayName}`,
      profile.headline && `标题：${profile.headline}`,
      profile.currentFocus && `当前关注：${profile.currentFocus}`,
      profile.location && `所在地：${profile.location}`,
      profile.bio && `简介：${profile.bio}`,
    ]),
    metadata: {
      visibility: profile.visibility,
    },
  }
}

function buildContactChunk(contacts: PublicContact[]): PublicKnowledgeChunk | null {
  if (contacts.length === 0) {
    return null
  }

  return {
    id: 'contacts-public',
    type: 'contact',
    title: '公开联系方式',
    content: compactLines([
      '公开联系方式：',
      ...contacts.map((contact) => {
        const url = contact.url ? `：${contact.url}` : ''
        return `- ${contact.label || contact.platform}${url}`
      }),
    ]),
  }
}

function formatSkillLine(skill: PublicSkill): string {
  const details = [skill.proficiencyLevel, skill.description].filter(Boolean).join('，')
  return details ? `${skill.name}（${details}）` : skill.name
}

function groupSkillsByCategory(skills: PublicSkill[]): Map<string, PublicSkill[]> {
  return skills.reduce((groups, skill) => {
    const category = skill.category || '其他技能'
    const categorySkills = groups.get(category) ?? []
    categorySkills.push(skill)
    groups.set(category, categorySkills)
    return groups
  }, new Map<string, PublicSkill[]>())
}

function buildSkillChunks(skills: PublicSkill[]): PublicKnowledgeChunk[] {
  if (skills.length === 0) {
    return []
  }

  const groupedSkills = groupSkillsByCategory(skills)
  const categorySections = Array.from(groupedSkills.entries()).map(([category, categorySkills]) => (
    `${category}：${categorySkills.map(formatSkillLine).join('；')}`
  ))

  const summaryChunk: PublicKnowledgeChunk = {
    id: 'skill-summary',
    type: 'skill',
    title: '技能总览',
    content: compactLines([
      '技能总览：',
      ...categorySections,
    ]),
    metadata: {
      category: 'summary',
      isSummary: true,
    },
  }

  const categoryChunks: PublicKnowledgeChunk[] = Array.from(groupedSkills.entries()).map(([category, categorySkills]) => ({
    id: `skill-category-${category}`,
    type: 'skill' as const,
    title: `技能分类：${category}`,
    content: compactLines([
      `技能分类：${category}`,
      `包含技能：${categorySkills.map(formatSkillLine).join('；')}`,
    ]),
    metadata: {
      category,
      isCategorySummary: true,
    },
  }))

  const detailChunks = skills.map((skill) => ({
    id: `skill-${skill.id}`,
    type: 'skill' as const,
    title: `技能：${skill.name}`,
    content: compactLines([
      `技能名称：${skill.name}`,
      skill.category && `分类：${skill.category}`,
      skill.proficiencyLevel && `熟练度：${skill.proficiencyLevel}`,
      skill.description && `描述：${skill.description}`,
    ]),
    metadata: {
      category: skill.category,
      sortOrder: skill.sortOrder,
      isDetail: true,
    },
  }))

  return [summaryChunk, ...categoryChunks, ...detailChunks]
}

function isProjectTimelineEntry(entry: PublicTimelineEntry): boolean {
  return entry.entryId.startsWith('project-') || entry.organization === '项目经历'
}

function formatTimelineDateRange(entry: PublicTimelineEntry): string {
  return entry.endDate ? `${entry.startDate} 至 ${entry.endDate}` : `${entry.startDate} 至今`
}

function buildProjectChunksFromTimeline(timeline: PublicTimelineEntry[]): PublicKnowledgeChunk[] {
  return timeline.filter(isProjectTimelineEntry).map((entry) => ({
    id: `project-${entry.entryId}`,
    type: 'project' as const,
    title: `项目经历：${entry.title}`,
    content: compactLines([
      `项目名称：${entry.title}`,
      `角色：${entry.location}`,
      `时间：${formatTimelineDateRange(entry)}`,
      entry.description && `简介：${entry.description}`,
      entry.achievements.length > 0 && `成果：${entry.achievements.join('；')}`,
      entry.technologies.length > 0 && `技术栈：${entry.technologies.join(', ')}`,
    ]),
    metadata: {
      entryId: entry.entryId,
      source: 'timeline',
      role: entry.location,
      technologies: entry.technologies,
    },
  }))
}

function buildTimelineChunks(timeline: PublicTimelineEntry[]): PublicKnowledgeChunk[] {
  return timeline.filter((entry) => !isProjectTimelineEntry(entry)).map((entry) => {
    const typeLabel = entry.type === 'education' ? '教育经历' : '工作经历'

    return {
      id: `timeline-${entry.id}`,
      type: 'timeline' as const,
      title: `${typeLabel}：${entry.title}`,
      content: compactLines([
        `${typeLabel}：${entry.title}`,
        `组织：${entry.organization}`,
        `时间：${formatTimelineDateRange(entry)}`,
        entry.location && `地点：${entry.location}`,
        entry.description && `描述：${entry.description}`,
        entry.achievements.length > 0 && `成果：${entry.achievements.join('；')}`,
        entry.technologies.length > 0 && `技术：${entry.technologies.join(', ')}`,
      ]),
      metadata: {
        entryId: entry.entryId,
        entryType: entry.type,
        organization: entry.organization,
        technologies: entry.technologies,
      },
    }
  })
}

export function buildPublicKnowledgeChunks(data: PublicKnowledgeData): PublicKnowledgeChunk[] {
  const chunks: PublicKnowledgeChunk[] = []

  if (data.profile) {
    chunks.push(buildProfileChunk(data.profile))
  }

  const contactChunk = buildContactChunk(data.contacts)
  if (contactChunk) {
    chunks.push(contactChunk)
  }

  chunks.push(...buildSkillChunks(data.skills))
  chunks.push(...buildProjectChunksFromTimeline(data.timeline))
  chunks.push(...buildTimelineChunks(data.timeline))

  return chunks
}

function tokenize(text: string): string[] {
  const lower = text.toLowerCase()
  const asciiTokens = lower.match(/[a-z0-9.+#-]{2,}/g) ?? []
  const cjkTokens = lower.match(/[\u4e00-\u9fa5]{2,}/g) ?? []
  const cjkBigrams = cjkTokens.flatMap((token) => {
    const grams: string[] = []
    for (let i = 0; i < token.length - 1; i += 1) {
      grams.push(token.slice(i, i + 2))
    }
    return grams
  })

  return [...new Set([...asciiTokens, ...cjkTokens, ...cjkBigrams])]
}

function getTypeBoost(query: string, chunk: PublicKnowledgeChunk): number {
  const normalized = query.toLowerCase()

  if (chunk.type === 'contact') {
    return CONTACT_KEYWORDS.some((keyword) => normalized.includes(keyword)) ? 8 : -4
  }

  if (chunk.type === 'project' && /项目|作品|portfolio|demo|github|技术栈|实现|挑战|结果/.test(normalized)) {
    return 5
  }

  if (chunk.type === 'skill' && /技能|技术|会什么|会哪些|擅长|熟悉|掌握|技术栈/.test(normalized)) {
    if (chunk.metadata?.isSummary) {
      return 9
    }
    if (chunk.metadata?.isCategorySummary) {
      return 7
    }
    return 5
  }

  if (chunk.type === 'timeline' && /经历|工作|实习|教育|学校|大学|毕业|时间/.test(normalized)) {
    return 5
  }

  if (chunk.type === 'profile' && /介绍|是谁|个人|简介|定位|哪里|城市/.test(normalized)) {
    return 4
  }

  return 0
}

export function retrievePublicKnowledgeChunks(
  query: string,
  chunks: PublicKnowledgeChunk[],
  limit = 5,
): PublicKnowledgeSearchResult[] {
  const queryTokens = tokenize(query)
  const exactQuery = query.toLowerCase().trim()

  return chunks
    .map((chunk) => {
      const title = chunk.title.toLowerCase()
      const content = chunk.content.toLowerCase()
      let score = getTypeBoost(query, chunk)

      if (exactQuery && content.includes(exactQuery)) {
        score += 10
      }
      if (exactQuery && title.includes(exactQuery)) {
        score += 8
      }

      for (const token of queryTokens) {
        if (title.includes(token)) {
          score += 4
        }
        if (content.includes(token)) {
          score += 2
        }
      }

      return {
        ...chunk,
        score,
      }
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export async function searchPublicKnowledge(
  query: string,
  limit = 5,
): Promise<PublicKnowledgeSearchResult[]> {
  const data = await loadPublicKnowledgeData()
  const chunks = buildPublicKnowledgeChunks(data)
  return retrievePublicKnowledgeChunks(query, chunks, limit)
}
