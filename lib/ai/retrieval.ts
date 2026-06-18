import { searchSimilarVectors } from './vector-store'

export type RetrievalIntent =
  | 'profile'
  | 'contact'
  | 'skill'
  | 'project'
  | 'timeline'
  | 'multi'
  | 'unknown'

export type RetrievalPlannerMode = 'rule' | 'llm' | 'auto'
export type RetrievalPlanner = 'rule' | 'llm'

export interface RetrievedChunk {
  id?: string
  content: string
  metadata: {
    type?: string
    title?: string
    source?: string
    entryId?: string
    category?: string
    [key: string]: unknown
  }
  similarity: number
  score?: number
}

export interface RetrievalSource {
  type: string
  id: string
  title: string
  source?: string
  score: number
}

export interface RetrievalResult {
  context: string
  sources: RetrievalSource[]
  results: RetrievedChunk[]
  shouldAnswer: boolean
  debug: {
    intent: RetrievalIntent
    planner: RetrievalPlanner
    queries: string[]
    blockReason?: string
    maxSimilarity: number
  }
}

export interface RetrievalQuery {
  query: string
  targetTypes: string[]
}

export interface RetrievalPlan {
  intent: RetrievalIntent
  queries: RetrievalQuery[]
  preferredTypes: string[]
  strictTypes: boolean
  planner?: RetrievalPlanner
  answerPolicy?: 'answer' | 'refuse'
  mustContainAny?: string[]
}

export interface RetrieveAnswerContextOptions {
  limit?: number
  queryLimit?: number
  maxContextChars?: number
  plannerMode?: RetrievalPlannerMode
  vectorSearch?: (query: string, limit: number) => Promise<RetrievedChunk[]>
  queryPlanner?: (userQuery: string) => Promise<RetrievalPlan>
}

const RRF_K = 60
const ALLOWED_INTENTS: RetrievalIntent[] = ['profile', 'contact', 'skill', 'project', 'timeline', 'multi', 'unknown']
const ALLOWED_TYPES = ['profile', 'contact', 'skill', 'project', 'timeline']
const ALLOWED_PLANNER_MODES: RetrievalPlannerMode[] = ['rule', 'llm', 'auto']
const GUARDED_CLAIM_TERMS = ['Java', '电商', 'ACM', '金牌', '清华', '北大', '大厂', '正式工作']

function includesAny(query: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(query))
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function compactText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function extractJsonObject(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('LLM planner did not return JSON')
  }
  return JSON.parse(jsonMatch[0])
}

function getConfiguredPlannerMode(explicitMode?: RetrievalPlannerMode): RetrievalPlannerMode {
  if (explicitMode) {
    return explicitMode
  }

  const configured = process.env.RETRIEVAL_PLANNER_MODE
  if (ALLOWED_PLANNER_MODES.includes(configured as RetrievalPlannerMode)) {
    return configured as RetrievalPlannerMode
  }

  if (configured) {
    console.warn(`Invalid RETRIEVAL_PLANNER_MODE="${configured}", fallback to rule planner`)
  }

  return 'rule'
}

export function classifyRetrievalIntent(query: string): RetrievalIntent {
  const normalized = query.toLowerCase()

  const hasContact = includesAny(normalized, [/联系|联系方式|邮箱|email|社交|账号|平台|找她|聊聊|主页链接|github/])
  const hasProject = includesAny(normalized, [/项目|作品|demo|组件库|管理后台|大屏|全栈|agent.*作品|项目里|相关项目|写过.*项目|做过哪些项目|拿得出手/])
  const hasSkill = includesAny(normalized, [/技能|技术栈|技术|会什么|会哪些|熟悉|掌握|框架|前端怎么样|工程化|react|typescript|next|后端|ai 相关|ai相关/])
  const hasTimeline = includesAny(normalized, [/实习|工作经历|工作|学校|大学|毕业|专业|公司|经历|时间线/])
  const hasProfile = includesAny(normalized, [/是谁|干嘛|介绍|方向|定位|哪里|城市|背景|个人简介|小菥/])

  const explicitHits: RetrievalIntent[] = []
  if (hasContact) explicitHits.push('contact')
  if (hasProject) explicitHits.push('project')
  if (hasTimeline) explicitHits.push('timeline')

  const hasExplicitMulti =
    /顺便|以及|和.*都|都给我|项目和技术|项目、|、联系方式|背景、/.test(query)

  if (explicitHits.length > 1 && hasExplicitMulti) {
    return 'multi'
  }

  // Domain intent wins over incidental technology/profile words.
  if (hasProject) return 'project'
  if (hasTimeline) return 'timeline'
  if (hasContact) return hasSkill && hasExplicitMulti ? 'multi' : 'contact'
  if (hasSkill) return 'skill'
  if (hasProfile) return 'profile'

  return 'unknown'
}

function extractTechTerms(query: string): string[] {
  const terms: string[] = []
  const knownTerms = [
    'React',
    'TypeScript',
    'JavaScript',
    'Next.js',
    'Next',
    'Vue',
    'AI',
    'Agent',
    'MCP',
    'LangGraph',
    'DeepSeek',
    'Go',
    'Python',
    'MySQL',
    'GitHub',
    'Git',
  ]
  const lower = query.toLowerCase()

  for (const term of knownTerms) {
    if (lower.includes(term.toLowerCase())) {
      terms.push(term)
    }
  }

  return unique(terms)
}

function getIntentTypes(intent: RetrievalIntent): { preferredTypes: string[]; strictTypes: boolean } {
  switch (intent) {
    case 'contact':
      return { preferredTypes: ['contact', 'profile'], strictTypes: true }
    case 'profile':
      return { preferredTypes: ['profile', 'timeline'], strictTypes: true }
    case 'skill':
      return { preferredTypes: ['skill', 'project'], strictTypes: true }
    case 'project':
      return { preferredTypes: ['project'], strictTypes: true }
    case 'timeline':
      return { preferredTypes: ['timeline', 'profile'], strictTypes: true }
    case 'multi':
      return { preferredTypes: ['profile', 'contact', 'skill', 'project', 'timeline'], strictTypes: false }
    default:
      return { preferredTypes: [], strictTypes: false }
  }
}

export function buildRetrievalPlan(userQuery: string): RetrievalPlan {
  const intent = classifyRetrievalIntent(userQuery)
  const techTerms = extractTechTerms(userQuery)
  const { preferredTypes, strictTypes } = getIntentTypes(intent)
  const queries: RetrievalQuery[] = [{ query: userQuery, targetTypes: preferredTypes }]

  const add = (query: string, targetTypes: string[]) => {
    if (!queries.some((item) => item.query === query)) {
      queries.push({ query, targetTypes })
    }
  }

  const addSkillQueries = () => {
    add(`${techTerms.join(' ')} 技能 技术栈`.trim() || '技能 技术栈 前端框架', ['skill'])
    add(`${techTerms.join(' ')} 前端 能力 熟练度`.trim() || '前端 能力 熟练度', ['skill'])
  }

  const addProjectQueries = () => {
    add(`${techTerms.join(' ')} 项目 作品 技术栈`.trim() || '项目 作品 技术栈', ['project'])
    add(`${techTerms.join(' ')} 项目经历 Demo GitHub 成果`.trim() || '项目经历 Demo GitHub 成果', ['project'])
  }

  if (intent === 'contact') {
    add('公开联系方式 邮箱 GitHub 社交账号', ['contact'])
    add('联系方式 平台 链接 邮箱', ['contact'])
  } else if (intent === 'profile') {
    add('公开个人信息 简介 当前关注 所在地', ['profile'])
    add('个人定位 背景 介绍 城市', ['profile'])
  } else if (intent === 'skill') {
    addSkillQueries()
    if (techTerms.length > 0) {
      addProjectQueries()
    }
  } else if (intent === 'project') {
    addProjectQueries()
    if (techTerms.length > 0) {
      add(`${techTerms.join(' ')} 项目`, ['project'])
    }
  } else if (intent === 'timeline') {
    add('工作经历 实习经历 教育经历 时间线', ['timeline'])
    add('学校 大学 毕业 专业 公司 经历', ['timeline'])
  } else if (intent === 'multi') {
    add('公开个人信息 简介 背景', ['profile'])
    add('公开联系方式 邮箱 GitHub', ['contact'])
    addSkillQueries()
    addProjectQueries()
    add('工作经历 实习经历 教育经历', ['timeline'])
  } else {
    add('个人信息 项目 技能 经历 联系方式', ['profile', 'project', 'skill', 'timeline', 'contact'])
  }

  return {
    intent,
    queries: queries.slice(0, 6),
    preferredTypes,
    strictTypes,
    planner: 'rule',
  }
}

function normalizeIntent(value: unknown): RetrievalIntent {
  return ALLOWED_INTENTS.includes(value as RetrievalIntent) ? (value as RetrievalIntent) : 'unknown'
}

function normalizeTypes(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback
  }

  const types = value
    .map((item) => String(item))
    .filter((item) => ALLOWED_TYPES.includes(item))

  return unique(types).slice(0, 5)
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return unique(
    value
      .map((item) => compactText(String(item || '')))
    .filter(Boolean),
  ).slice(0, 8)
}

function sanitizeMustContainAny(value: unknown): string[] {
  return normalizeStringArray(value).filter((term) => {
    return GUARDED_CLAIM_TERMS.some((guardedTerm) => containsExactTerm(term, guardedTerm))
  })
}

function sanitizeLLMRetrievalPlan(raw: unknown, userQuery: string, fallback: RetrievalPlan): RetrievalPlan {
  if (!raw || typeof raw !== 'object') {
    throw new Error('LLM planner JSON is not an object')
  }

  const obj = raw as Record<string, unknown>
  const rawIntent = normalizeIntent(obj.intent)
  const intent = rawIntent === 'unknown' && fallback.intent !== 'unknown' ? fallback.intent : rawIntent
  const baseTypes = getIntentTypes(intent)
  const preferredTypes = normalizeTypes(
    obj.targetTypes,
    baseTypes.preferredTypes.length > 0 ? baseTypes.preferredTypes : fallback.preferredTypes,
  )
  const strictTypes = typeof obj.strictTypes === 'boolean' ? obj.strictTypes : baseTypes.strictTypes
  const semanticQueries = normalizeStringArray(obj.queries)
  const mustContainAny = sanitizeMustContainAny(obj.mustContainAny)
  const rawAnswerPolicy = obj.answerPolicy === 'refuse' ? 'refuse' : 'answer'
  const answerPolicy = rawAnswerPolicy === 'refuse' && fallback.intent !== 'unknown' ? 'answer' : rawAnswerPolicy

  const queries: RetrievalQuery[] = []
  const add = (query: string, targetTypes: string[]) => {
    const normalized = compactText(query)
    if (!normalized || queries.some((item) => item.query === normalized)) return
    queries.push({ query: normalized, targetTypes })
  }

  add(userQuery, preferredTypes)
  for (const query of semanticQueries) {
    add(query, preferredTypes)
  }

  for (const query of fallback.queries) {
    add(query.query, query.targetTypes)
  }

  if (queries.length < 2) {
    throw new Error('LLM planner returned too few queries')
  }

  return {
    intent,
    queries: queries.slice(0, 6),
    preferredTypes,
    strictTypes,
    planner: 'llm',
    answerPolicy,
    mustContainAny,
  }
}

function buildPlannerPrompt(userQuery: string): string {
  return `你是公开个人站 RAG 检索规划器。请把用户问题转成结构化检索计划，只返回 JSON，不要 Markdown。

可用知识类型:
- profile: 公开个人信息、简介、当前关注、所在地
- contact: 公开联系方式、邮箱、GitHub、社交平台
- skill: 技能、技术栈、熟练度、框架、工程化能力
- project: 项目、作品、Demo、项目成果、项目技术栈
- timeline: 教育经历、工作经历、实习经历、学校、毕业、公司

JSON Schema:
{
  "intent": "profile|contact|skill|project|timeline|multi|unknown",
  "queries": ["用于向量检索的查询1", "查询2", "查询3"],
  "targetTypes": ["profile|contact|skill|project|timeline"],
  "strictTypes": true,
  "mustContainAny": ["用户明确要求必须被证据支持的关键词"],
  "answerPolicy": "answer|refuse"
}

规则:
1. queries 写成适合向量检索的中文短语，不要照抄口语问法。
2. 如果用户问多个方面，intent 用 multi，targetTypes 覆盖所有需要的数据类型。
3. 如果用户问“是不是/有没有/做过吗/毕业吗”等断言问题，把断言关键词放入 mustContainAny。
4. 不要凭空添加用户没问的公司、学校、奖项或技术。
5. 如果问题明显不是关于个人公开资料，answerPolicy 用 refuse。

用户问题: ${userQuery}`
}

async function callDeepSeekPlanner(userQuery: string): Promise<unknown> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: buildPlannerPrompt(userQuery),
        },
      ],
      temperature: 0,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek planner failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw new Error('DeepSeek planner returned empty content')
  }

  return extractJsonObject(content)
}

export async function planRetrievalWithLLM(userQuery: string): Promise<RetrievalPlan> {
  const fallback = buildRetrievalPlan(userQuery)
  const rawPlan = await callDeepSeekPlanner(userQuery)
  return sanitizeLLMRetrievalPlan(rawPlan, userQuery, fallback)
}

async function resolveRetrievalPlan(
  userQuery: string,
  mode: RetrievalPlannerMode,
  queryPlanner?: (userQuery: string) => Promise<RetrievalPlan>,
): Promise<RetrievalPlan> {
  if (mode === 'rule') {
    return buildRetrievalPlan(userQuery)
  }

  try {
    return queryPlanner ? await queryPlanner(userQuery) : await planRetrievalWithLLM(userQuery)
  } catch (error) {
    if (mode === 'llm') {
      console.warn('LLM retrieval planner failed, fallback to rule planner:', error)
    }
    return buildRetrievalPlan(userQuery)
  }
}

export function shouldSkipKeywordFallback(blockReason?: string): boolean {
  if (!blockReason) {
    return false
  }

  return (
    blockReason.startsWith('unsupported_claim') ||
    blockReason.startsWith('planner_missing_terms') ||
    blockReason === 'planner_refuse' ||
    blockReason === 'low_confidence'
  )
}

function getChunkType(chunk: RetrievedChunk): string {
  return String(chunk.metadata?.type || '')
}

function getChunkTitle(chunk: RetrievedChunk): string {
  return String(chunk.metadata?.title || chunk.metadata?.type || '公开资料')
}

function getChunkKey(chunk: RetrievedChunk): string {
  const type = getChunkType(chunk)
  const title = getChunkTitle(chunk)
  const entityId = chunk.metadata?.entryId || chunk.metadata?.category || chunk.metadata?.source || chunk.id
  return `${type}:${String(entityId || title)}`
}

function tokenize(text: string): string[] {
  const lower = text.toLowerCase()
  const ascii = lower.match(/[a-z0-9.+#-]{2,}/g) ?? []
  const cjk = lower.match(/[\u4e00-\u9fa5]{2,}/g) ?? []
  const cjkBigrams = cjk.flatMap((token) => {
    const grams: string[] = []
    for (let i = 0; i < token.length - 1; i += 1) {
      grams.push(token.slice(i, i + 2))
    }
    return grams
  })
  return unique([...ascii, ...cjk, ...cjkBigrams])
}

function keywordScore(userQuery: string, chunk: RetrievedChunk): number {
  const haystack = `${getChunkTitle(chunk)}\n${chunk.content}\n${JSON.stringify(chunk.metadata || {})}`.toLowerCase()
  const tokens = tokenize(userQuery).filter((token) => token.length >= 2)
  if (tokens.length === 0) return 0

  const matched = tokens.filter((token) => haystack.includes(token)).length
  return Math.min(matched / Math.max(tokens.length, 1), 1)
}

function isPreferredType(type: string, preferredTypes: string[]): boolean {
  return preferredTypes.length === 0 || preferredTypes.includes(type)
}

export function fuseRetrievalResults(
  userQuery: string,
  plan: RetrievalPlan,
  queryResults: RetrievedChunk[][],
): RetrievedChunk[] {
  const fused = new Map<string, RetrievedChunk & { score: number; maxSimilarity: number }>()

  queryResults.forEach((results, queryIndex) => {
    const query = plan.queries[queryIndex]
    const targetTypes = query?.targetTypes ?? []

    results.forEach((chunk, index) => {
      const type = getChunkType(chunk)
      const allowedByPlan = isPreferredType(type, plan.preferredTypes)
      const allowedByQuery = targetTypes.length === 0 || targetTypes.includes(type)

      if (plan.strictTypes && !allowedByPlan) {
        return
      }

      const rrf = 1 / (RRF_K + index + 1)
      const typeScore = allowedByQuery ? 0.22 : allowedByPlan ? 0.12 : -0.18
      const exactScore = keywordScore(userQuery, chunk) * 0.16
      const contribution = rrf * 8 + Number(chunk.similarity || 0) + typeScore + exactScore
      const key = getChunkKey(chunk)
      const existing = fused.get(key)

      if (existing) {
        existing.score += contribution
        existing.maxSimilarity = Math.max(existing.maxSimilarity, Number(chunk.similarity || 0))
        if (Number(chunk.similarity || 0) > Number(existing.similarity || 0)) {
          existing.content = chunk.content
          existing.metadata = chunk.metadata
          existing.similarity = chunk.similarity
          existing.id = chunk.id
        }
      } else {
        fused.set(key, {
          ...chunk,
          score: contribution,
          maxSimilarity: Number(chunk.similarity || 0),
        })
      }
    })
  })

  return [...fused.values()]
    .filter((chunk) => Number(chunk.score || 0) > 0)
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .map((chunk) => ({
      ...chunk,
      similarity: Number(chunk.score || 0),
    }))
}

function containsExactTerm(text: string, term: string): boolean {
  const normalizedText = text.toLowerCase()
  const normalizedTerm = term.toLowerCase()

  if (/^[a-z0-9.+#-]+$/i.test(term)) {
    const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(normalizedText)
  }

  return normalizedText.includes(normalizedTerm)
}

function extractClaimTerms(query: string): string[] {
  const terms: string[] = []

  for (const term of GUARDED_CLAIM_TERMS) {
    if (containsExactTerm(query, term)) {
      terms.push(term)
    }
  }

  for (const term of extractTechTerms(query)) {
    if (!['AI', 'Agent', 'Git'].includes(term)) {
      terms.push(term)
    }
  }

  return unique(terms)
}

function isClaimQuestion(query: string): boolean {
  return /是不是|有没有|有.*吗|会.*吗|做过.*吗|写过.*吗|拿过.*吗|毕业.*吗/.test(query)
}

function assessAnswerability(userQuery: string, results: RetrievedChunk[]): { shouldAnswer: boolean; reason?: string } {
  if (results.length === 0) {
    return { shouldAnswer: false, reason: 'no_results' }
  }

  const maxScore = Math.max(...results.map((result) => Number(result.score ?? result.similarity ?? 0)))
  const maxRawSimilarity = Math.max(
    ...results.map((result) => Number((result as RetrievedChunk & { maxSimilarity?: number }).maxSimilarity ?? 0)),
  )

  if (isClaimQuestion(userQuery)) {
    const claimTerms = extractClaimTerms(userQuery)
    if (claimTerms.length > 0) {
      const resultText = results
        .map((result) => `${getChunkTitle(result)}\n${result.content}\n${JSON.stringify(result.metadata || {})}`)
        .join('\n')
      const missingTerms = claimTerms.filter((term) => !containsExactTerm(resultText, term))
      if (missingTerms.length > 0) {
        return { shouldAnswer: false, reason: `unsupported_claim:${missingTerms.join(',')}` }
      }
    }
  }

  if (maxRawSimilarity < 0.18 && maxScore < 0.35) {
    return { shouldAnswer: false, reason: 'low_confidence' }
  }

  return { shouldAnswer: true }
}

function assessPlanAnswerability(plan: RetrievalPlan, results: RetrievedChunk[]): { shouldAnswer: boolean; reason?: string } {
  if (plan.answerPolicy === 'refuse') {
    return { shouldAnswer: false, reason: 'planner_refuse' }
  }

  if (plan.mustContainAny && plan.mustContainAny.length > 0) {
    const resultText = results
      .map((result) => `${getChunkTitle(result)}\n${result.content}\n${JSON.stringify(result.metadata || {})}`)
      .join('\n')
    const hasAny = plan.mustContainAny.some((term) => containsExactTerm(resultText, term))
    if (!hasAny) {
      return { shouldAnswer: false, reason: `planner_missing_terms:${plan.mustContainAny.join(',')}` }
    }
  }

  return { shouldAnswer: true }
}

function packContext(results: RetrievedChunk[], maxContextChars: number): RetrievedChunk[] {
  const packed: RetrievedChunk[] = []
  let total = 0

  for (const result of results) {
    const nextSize = result.content.length + getChunkTitle(result).length + 16
    if (packed.length > 0 && total + nextSize > maxContextChars) {
      break
    }
    packed.push(result)
    total += nextSize
  }

  return packed
}

function diversifyResults(results: RetrievedChunk[], intent: RetrievalIntent, limit: number): RetrievedChunk[] {
  if (intent !== 'multi') {
    return results.slice(0, limit)
  }

  const selected: RetrievedChunk[] = []
  const selectedKeys = new Set<string>()
  const preferredOrder = ['contact', 'project', 'timeline', 'profile', 'skill']

  for (const type of preferredOrder) {
    const best = results.find((result) => getChunkType(result) === type && !selectedKeys.has(getChunkKey(result)))
    if (best) {
      selected.push(best)
      selectedKeys.add(getChunkKey(best))
    }
    if (selected.length >= limit) {
      return selected
    }
  }

  for (const result of results) {
    const key = getChunkKey(result)
    if (selectedKeys.has(key)) continue
    selected.push(result)
    selectedKeys.add(key)
    if (selected.length >= limit) break
  }

  return selected
}

export function formatRetrievalContext(results: RetrievedChunk[]): string {
  return results
    .map((chunk) => `[来源: ${getChunkTitle(chunk)}]\n${chunk.content}`)
    .join('\n\n---\n\n')
}

function toSources(results: RetrievedChunk[]): RetrievalSource[] {
  return results.map((chunk, index) => ({
    type: getChunkType(chunk) || 'public',
    id: String(chunk.id || chunk.metadata?.source || chunk.metadata?.entryId || getChunkTitle(chunk) || `chunk-${index}`),
    title: getChunkTitle(chunk),
    source: typeof chunk.metadata?.source === 'string' ? chunk.metadata.source : undefined,
    score: Number(chunk.score ?? chunk.similarity ?? 0),
  }))
}

export async function retrieveAnswerContext(
  userQuery: string,
  options: RetrieveAnswerContextOptions = {},
): Promise<RetrievalResult> {
  const limit = options.limit ?? 5
  const queryLimit = options.queryLimit ?? Math.max(limit * 3, 12)
  const maxContextChars = options.maxContextChars ?? 3200
  const plannerMode = getConfiguredPlannerMode(options.plannerMode)
  const vectorSearch = options.vectorSearch ?? searchSimilarVectors
  const plan = await resolveRetrievalPlan(userQuery, plannerMode, options.queryPlanner)

  const settled = await Promise.allSettled(
    plan.queries.map((query) => vectorSearch(query.query, queryLimit)),
  )
  const queryResults = settled.map((result) => (result.status === 'fulfilled' ? result.value : []))
  const fused = fuseRetrievalResults(userQuery, plan, queryResults)
  const selected = packContext(diversifyResults(fused, plan.intent, limit), maxContextChars)
  const ruleAnswerability = assessAnswerability(userQuery, selected)
  const planAnswerability = assessPlanAnswerability(plan, selected)
  const answerability = !ruleAnswerability.shouldAnswer
    ? ruleAnswerability
    : planAnswerability

  return {
    context: answerability.shouldAnswer ? formatRetrievalContext(selected) : '',
    sources: answerability.shouldAnswer ? toSources(selected) : [],
    results: selected,
    shouldAnswer: answerability.shouldAnswer,
    debug: {
      intent: plan.intent,
      planner: plan.planner ?? 'rule',
      queries: plan.queries.map((query) => query.query),
      blockReason: answerability.reason,
      maxSimilarity: Math.max(...selected.map((result) => Number(result.score ?? result.similarity ?? 0)), 0),
    },
  }
}
