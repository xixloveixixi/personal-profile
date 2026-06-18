#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

const ROOT = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(ROOT, '.env.local') })
dotenv.config({ path: path.join(ROOT, '.env') })

const DEFAULT_SAMPLE_PATH = path.join(ROOT, 'docs/evals/public-chat-retrieval-fuzzy.json')
const RRF_K = 60
const GUARDED_CLAIM_TERMS = ['Java', '电商', 'ACM', '金牌', '清华', '北大', '大厂', '正式工作']

function parseArgs(argv) {
  const args = {
    samplePath: DEFAULT_SAMPLE_PATH,
    limit: 5,
    threshold: 0,
    maxCases: Infinity,
    strategy: 'baseline',
    rerank: 'rule',
    includeContent: false,
    json: false,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--json') {
      args.json = true
    } else if (arg === '--include-content') {
      args.includeContent = true
    } else if (arg === '--sample' && argv[i + 1]) {
      args.samplePath = path.resolve(ROOT, argv[i + 1])
      i += 1
    } else if (arg === '--limit' && argv[i + 1]) {
      args.limit = Number(argv[i + 1])
      i += 1
    } else if (arg === '--threshold' && argv[i + 1]) {
      args.threshold = Number(argv[i + 1])
      i += 1
    } else if (arg === '--max-cases' && argv[i + 1]) {
      args.maxCases = Number(argv[i + 1])
      i += 1
    } else if (arg === '--strategy' && argv[i + 1]) {
      args.strategy = argv[i + 1]
      i += 1
    } else if (arg === '--rerank' && argv[i + 1]) {
      args.rerank = argv[i + 1]
      i += 1
    }
  }

  if (!['baseline', 'fusion', 'llm-fusion'].includes(args.strategy)) {
    throw new Error('--strategy must be "baseline", "fusion", or "llm-fusion"')
  }
  if (!['rule', 'none'].includes(args.rerank)) {
    throw new Error('--rerank must be "rule" or "none"')
  }

  return args
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

async function generateEmbedding(text) {
  const apiKey = requireEnv('ALIBABA_API_KEY')
  const baseURL = process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1'
  const response = await fetch(`${baseURL}/services/embeddings/text-embedding/text-embedding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-v1',
      input: {
        texts: [text],
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Alibaba embedding failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const rawEmbedding = data.output?.embeddings?.[0]?.embedding

  if (Array.isArray(rawEmbedding)) {
    return rawEmbedding.map(Number)
  }

  if (typeof rawEmbedding === 'string') {
    try {
      const parsed = JSON.parse(rawEmbedding)
      if (Array.isArray(parsed)) {
        return parsed.map(Number)
      }
    } catch {
      return rawEmbedding.split(',').map(Number)
    }
  }

  throw new Error(`Unexpected embedding format: ${typeof rawEmbedding}`)
}

function createSupabaseClient() {
  return createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
      },
    },
  )
}

async function searchSimilarVectors(supabase, query, limit, threshold) {
  const queryEmbedding = await generateEmbedding(query)
  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    throw new Error(`Supabase match_knowledge failed: ${error.message}`)
  }

  return data || []
}

function includesAny(query, patterns) {
  return patterns.some((pattern) => pattern.test(query))
}

function unique(items) {
  return [...new Set(items)]
}

function classifyIntent(query) {
  const normalized = query.toLowerCase()
  const hasContact = includesAny(normalized, [/联系|联系方式|邮箱|email|社交|账号|平台|找她|聊聊|主页链接|github/])
  const hasProject = includesAny(normalized, [/项目|作品|demo|组件库|管理后台|大屏|全栈|agent.*作品|项目里|相关项目|写过.*项目|做过哪些项目|拿得出手/])
  const hasSkill = includesAny(normalized, [/技能|技术栈|技术|会什么|会哪些|熟悉|掌握|框架|前端怎么样|工程化|react|typescript|next|后端|ai 相关|ai相关/])
  const hasTimeline = includesAny(normalized, [/实习|工作经历|工作|学校|大学|毕业|专业|公司|经历|时间线/])
  const hasProfile = includesAny(normalized, [/是谁|干嘛|介绍|方向|定位|哪里|城市|背景|个人简介|小菥/])
  const explicitHits = []
  if (hasContact) explicitHits.push('contact')
  if (hasProject) explicitHits.push('project')
  if (hasTimeline) explicitHits.push('timeline')
  const hasExplicitMulti = /顺便|以及|和.*都|都给我|项目和技术|项目、|、联系方式|背景、/.test(query)

  if (explicitHits.length > 1 && hasExplicitMulti) return 'multi'
  if (hasProject) return 'project'
  if (hasTimeline) return 'timeline'
  if (hasContact) return hasSkill && hasExplicitMulti ? 'multi' : 'contact'
  if (hasSkill) return 'skill'
  if (hasProfile) return 'profile'
  return 'unknown'
}

function extractTechTerms(query) {
  const terms = []
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

function getIntentTypes(intent) {
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

function buildRetrievalPlan(userQuery) {
  const intent = classifyIntent(userQuery)
  const techTerms = extractTechTerms(userQuery)
  const { preferredTypes, strictTypes } = getIntentTypes(intent)
  const queries = [{ query: userQuery, targetTypes: preferredTypes }]

  const add = (query, targetTypes) => {
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
    if (techTerms.length > 0) addProjectQueries()
  } else if (intent === 'project') {
    addProjectQueries()
    if (techTerms.length > 0) add(`${techTerms.join(' ')} 项目`, ['project'])
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
  }
}

function compactText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function extractJsonObject(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('LLM planner did not return JSON')
  }
  return JSON.parse(jsonMatch[0])
}

function normalizeIntent(value) {
  const allowed = ['profile', 'contact', 'skill', 'project', 'timeline', 'multi', 'unknown']
  return allowed.includes(value) ? value : 'unknown'
}

function normalizeTypes(value, fallback) {
  const allowed = ['profile', 'contact', 'skill', 'project', 'timeline']
  if (!Array.isArray(value)) return fallback
  const types = value.map((item) => String(item)).filter((item) => allowed.includes(item))
  return unique(types).slice(0, 5)
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return []
  return unique(value.map((item) => compactText(item)).filter(Boolean)).slice(0, 8)
}

function containsExactTerm(text, term) {
  const normalizedText = text.toLowerCase()
  const normalizedTerm = term.toLowerCase()
  if (/^[a-z0-9.+#-]+$/i.test(term)) {
    const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(normalizedText)
  }
  return normalizedText.includes(normalizedTerm)
}

function sanitizeMustContainAny(value) {
  return normalizeStringArray(value).filter((term) => {
    return GUARDED_CLAIM_TERMS.some((guardedTerm) => containsExactTerm(term, guardedTerm))
  })
}

function sanitizeLLMPlan(raw, userQuery, fallback) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('LLM planner JSON is not an object')
  }

  const rawIntent = normalizeIntent(raw.intent)
  const intent = rawIntent === 'unknown' && fallback.intent !== 'unknown' ? fallback.intent : rawIntent
  const baseTypes = getIntentTypes(intent)
  const preferredTypes = normalizeTypes(
    raw.targetTypes,
    baseTypes.preferredTypes.length > 0 ? baseTypes.preferredTypes : fallback.preferredTypes,
  )
  const strictTypes = typeof raw.strictTypes === 'boolean' ? raw.strictTypes : baseTypes.strictTypes
  const semanticQueries = normalizeStringArray(raw.queries)
  const mustContainAny = sanitizeMustContainAny(raw.mustContainAny)
  const rawAnswerPolicy = raw.answerPolicy === 'refuse' ? 'refuse' : 'answer'
  const answerPolicy = rawAnswerPolicy === 'refuse' && fallback.intent !== 'unknown' ? 'answer' : rawAnswerPolicy
  const queries = []

  const add = (query, targetTypes) => {
    const normalized = compactText(query)
    if (!normalized || queries.some((item) => item.query === normalized)) return
    queries.push({ query: normalized, targetTypes })
  }

  add(userQuery, preferredTypes)
  for (const query of semanticQueries) add(query, preferredTypes)
  for (const query of fallback.queries) add(query.query, query.targetTypes)

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

function buildPlannerPrompt(userQuery) {
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

async function callDeepSeekPlanner(query) {
  const apiKey = requireEnv('DEEPSEEK_API_KEY')
  const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [{ role: 'user', content: buildPlannerPrompt(query) }],
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

async function buildLLMRetrievalPlan(query) {
  const fallback = buildRetrievalPlan(query)
  try {
    return sanitizeLLMPlan(await callDeepSeekPlanner(query), query, fallback)
  } catch (error) {
    process.stderr.write(`  LLM planner fallback: ${error.message}\n`)
    return fallback
  }
}

function getChunkKey(chunk) {
  const type = getResultType(chunk)
  const title = getResultTitle(chunk)
  const entityId = chunk.metadata?.entryId || chunk.metadata?.category || chunk.metadata?.source || chunk.id
  return `${type}:${String(entityId || title)}`
}

function tokenize(text) {
  const lower = text.toLowerCase()
  const ascii = lower.match(/[a-z0-9.+#-]{2,}/g) || []
  const cjk = lower.match(/[\u4e00-\u9fa5]{2,}/g) || []
  const cjkBigrams = cjk.flatMap((token) => {
    const grams = []
    for (let i = 0; i < token.length - 1; i += 1) {
      grams.push(token.slice(i, i + 2))
    }
    return grams
  })
  return unique([...ascii, ...cjk, ...cjkBigrams])
}

function keywordScore(query, chunk) {
  const haystack = `${getResultTitle(chunk)}\n${chunk.content || ''}\n${JSON.stringify(chunk.metadata || {})}`.toLowerCase()
  const tokens = tokenize(query).filter((token) => token.length >= 2)
  if (tokens.length === 0) return 0
  const matched = tokens.filter((token) => haystack.includes(token)).length
  return Math.min(matched / Math.max(tokens.length, 1), 1)
}

function isPreferredType(type, preferredTypes) {
  return preferredTypes.length === 0 || preferredTypes.includes(type)
}

function fuseResults(userQuery, plan, queryResults, options = {}) {
  const fused = new Map()
  const useRuleRerank = options.rerank !== 'none'

  queryResults.forEach((results, queryIndex) => {
    const query = plan.queries[queryIndex]
    const targetTypes = query?.targetTypes || []

    results.forEach((chunk, index) => {
      const type = getResultType(chunk)
      const allowedByPlan = isPreferredType(type, plan.preferredTypes)
      const allowedByQuery = targetTypes.length === 0 || targetTypes.includes(type)
      if (plan.strictTypes && !allowedByPlan) return

      const rrf = 1 / (RRF_K + index + 1)
      const typeScore = useRuleRerank ? (allowedByQuery ? 0.22 : allowedByPlan ? 0.12 : -0.18) : 0
      const exactScore = useRuleRerank ? keywordScore(userQuery, chunk) * 0.16 : 0
      const contribution = rrf * 8 + Number(chunk.similarity || 0) + typeScore + exactScore
      const key = getChunkKey(chunk)
      const existing = fused.get(key)

      if (existing) {
        existing.score += contribution
        existing.maxRawSimilarity = Math.max(existing.maxRawSimilarity, Number(chunk.similarity || 0))
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
          maxRawSimilarity: Number(chunk.similarity || 0),
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

function extractClaimTerms(query) {
  const terms = []
  for (const term of GUARDED_CLAIM_TERMS) {
    if (containsExactTerm(query, term)) terms.push(term)
  }
  for (const term of extractTechTerms(query)) {
    if (!['AI', 'Agent', 'Git'].includes(term)) terms.push(term)
  }
  return unique(terms)
}

function isClaimQuestion(query) {
  return /是不是|有没有|有.*吗|会.*吗|做过.*吗|写过.*吗|拿过.*吗|毕业.*吗/.test(query)
}

function shouldAnswerQuery(query, results) {
  if (results.length === 0) return false
  const maxScore = Math.max(...results.map((result) => Number(result.score ?? result.similarity ?? 0)))
  const maxRaw = Math.max(...results.map((result) => Number(result.maxRawSimilarity ?? 0)))
  if (isClaimQuestion(query)) {
    const claimTerms = extractClaimTerms(query)
    if (claimTerms.length > 0) {
      const resultText = results.map((result) => `${getResultTitle(result)}\n${result.content || ''}\n${JSON.stringify(result.metadata || {})}`).join('\n')
      if (claimTerms.some((term) => !containsExactTerm(resultText, term))) return false
    }
  }
  return !(maxRaw < 0.18 && maxScore < 0.35)
}

function shouldAnswerPlannedQuery(plan, results) {
  if (plan.answerPolicy === 'refuse') return false
  if (plan.mustContainAny && plan.mustContainAny.length > 0) {
    const resultText = results.map((result) => `${getResultTitle(result)}\n${result.content || ''}\n${JSON.stringify(result.metadata || {})}`).join('\n')
    return plan.mustContainAny.some((term) => containsExactTerm(resultText, term))
  }
  return true
}

function diversifyResults(results, intent, limit) {
  if (intent !== 'multi') return results.slice(0, limit)

  const selected = []
  const selectedKeys = new Set()
  const preferredOrder = ['contact', 'project', 'timeline', 'profile', 'skill']

  for (const type of preferredOrder) {
    const best = results.find((result) => getResultType(result) === type && !selectedKeys.has(getChunkKey(result)))
    if (best) {
      selected.push(best)
      selectedKeys.add(getChunkKey(best))
    }
    if (selected.length >= limit) return selected
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

async function searchFusion(supabase, query, limit, threshold, useLLMPlanner = false, options = {}) {
  const plan = useLLMPlanner ? await buildLLMRetrievalPlan(query) : buildRetrievalPlan(query)
  const queryLimit = Math.max(limit * 3, 12)
  const queryResults = []

  for (const planned of plan.queries) {
    try {
      queryResults.push(await searchSimilarVectors(supabase, planned.query, queryLimit, threshold))
    } catch (error) {
      process.stderr.write(`  子查询失败: ${planned.query} (${error.message})\n`)
      queryResults.push([])
    }
  }

  const fused = diversifyResults(fuseResults(query, plan, queryResults, options), plan.intent, limit)
  if (!shouldAnswerQuery(query, fused) || !shouldAnswerPlannedQuery(plan, fused)) {
    return []
  }
  return fused
}

function normalizeText(value) {
  return String(value || '').toLowerCase()
}

function getResultType(result) {
  return String(result.metadata?.type || '')
}

function getResultTitle(result) {
  return String(result.metadata?.title || result.metadata?.type || '')
}

function resultMatchesCase(result, sample) {
  const type = getResultType(result)
  const title = getResultTitle(result)
  const content = String(result.content || '')
  const allText = normalizeText(`${title}\n${content}\n${JSON.stringify(result.metadata || {})}`)

  const expectedTypes = sample.expectedTypes || []
  const expectedTitlesAny = sample.expectedTitlesAny || []
  const expectedKeywordsAny = sample.expectedKeywordsAny || []

  const typeOk = expectedTypes.length === 0 || expectedTypes.includes(type)
  const titleOk =
    expectedTitlesAny.length === 0 ||
    expectedTitlesAny.some((expectedTitle) => title.includes(expectedTitle))
  const keywordOk =
    expectedKeywordsAny.length === 0 ||
    expectedKeywordsAny.some((keyword) => allText.includes(normalizeText(keyword)))

  return typeOk && (titleOk || keywordOk)
}

function hasDisallowedHit(results, sample) {
  const disallowedTypes = sample.disallowedTypes || []
  const disallowedKeywords = sample.disallowedKeywords || []

  return results.some((result) => {
    const type = getResultType(result)
    const allText = normalizeText(`${getResultTitle(result)}\n${result.content || ''}`)
    return (
      disallowedTypes.includes(type) ||
      disallowedKeywords.some((keyword) => allText.includes(normalizeText(keyword)))
    )
  })
}

function evaluateCase(sample, results, limit, options = {}) {
  const isNegative = Boolean(sample.shouldNotAnswer)
  const matchedRank = isNegative
    ? -1
    : results.findIndex((result) => resultMatchesCase(result, sample))
  const hitRank = matchedRank >= 0 ? matchedRank + 1 : null
  const maxSimilarity = results.reduce((max, result) => Math.max(max, Number(result.similarity || 0)), 0)

  return {
    id: sample.id,
    query: sample.query,
    intent: sample.intent,
    isNegative,
    hitRank,
    hitAt1: !isNegative && hitRank === 1,
    hitAt3: !isNegative && hitRank !== null && hitRank <= 3,
    hitAtK: !isNegative && hitRank !== null && hitRank <= limit,
    reciprocalRank: !isNegative && hitRank !== null ? 1 / hitRank : 0,
    negativePass: isNegative ? results.length === 0 || maxSimilarity < 0.2 : null,
    disallowedHit: hasDisallowedHit(results, sample),
    maxSimilarity,
    topResults: results.map((result, index) => {
      const content = String(result.content || '')
      const item = {
        rank: index + 1,
        type: getResultType(result),
        title: getResultTitle(result),
        similarity: Number(result.similarity || 0),
        preview: content.replace(/\s+/g, ' ').slice(0, 120),
      }
      if (options.includeContent) {
        item.content = content
        item.metadata = result.metadata || {}
      }
      return item
    }),
  }
}

function summarize(evaluations) {
  const positive = evaluations.filter((item) => !item.isNegative)
  const negative = evaluations.filter((item) => item.isNegative)
  const ratio = (count, total) => (total === 0 ? 0 : count / total)

  return {
    total: evaluations.length,
    positive: positive.length,
    negative: negative.length,
    hitAt1: ratio(positive.filter((item) => item.hitAt1).length, positive.length),
    hitAt3: ratio(positive.filter((item) => item.hitAt3).length, positive.length),
    hitAtK: ratio(positive.filter((item) => item.hitAtK).length, positive.length),
    mrr: ratio(
      positive.reduce((sum, item) => sum + item.reciprocalRank, 0),
      positive.length,
    ),
    wrongTypeRate: ratio(
      evaluations.filter((item) => item.disallowedHit).length,
      evaluations.length,
    ),
    negativePassRate: ratio(
      negative.filter((item) => item.negativePass).length,
      negative.length,
    ),
  }
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`
}

function printReport(args, summary, evaluations) {
  const label = args.strategy === 'llm-fusion' ? 'LLM Fusion' : args.strategy === 'fusion' ? 'Fusion' : 'Baseline'
  console.log(`\n=== Public Chat Retrieval ${label} ===`)
  console.log(`sample: ${path.relative(ROOT, args.samplePath)}`)
  console.log(`strategy: ${args.strategy}`)
  console.log(`rerank: ${args.rerank}`)
  console.log(`limit: ${args.limit}`)
  console.log(`threshold: ${args.threshold}`)
  console.log(`cases: ${summary.total} (${summary.positive} positive, ${summary.negative} negative)`)
  console.log('')
  console.log(`Hit@1: ${formatPercent(summary.hitAt1)}`)
  console.log(`Hit@3: ${formatPercent(summary.hitAt3)}`)
  console.log(`Hit@${args.limit}: ${formatPercent(summary.hitAtK)}`)
  console.log(`MRR: ${summary.mrr.toFixed(3)}`)
  console.log(`WrongTypeRate: ${formatPercent(summary.wrongTypeRate)}`)
  console.log(`NegativePassRate: ${formatPercent(summary.negativePassRate)}`)

  const failures = evaluations.filter((item) => {
    if (item.isNegative) return !item.negativePass || item.disallowedHit
    return !item.hitAtK || item.disallowedHit
  })

  console.log(`\nFailures: ${failures.length}`)
  for (const failure of failures.slice(0, 12)) {
    console.log(`\n- ${failure.id} [${failure.intent}] ${failure.query}`)
    console.log(
      `  hitRank=${failure.hitRank ?? '-'} maxSimilarity=${failure.maxSimilarity.toFixed(3)} disallowed=${failure.disallowedHit}`,
    )
    for (const result of failure.topResults.slice(0, 3)) {
      console.log(
        `  ${result.rank}. ${result.type}/${result.title} sim=${result.similarity.toFixed(3)} ${result.preview}`,
      )
    }
  }
}

async function main() {
  const args = parseArgs(process.argv)
  const samples = JSON.parse(fs.readFileSync(args.samplePath, 'utf8')).slice(0, args.maxCases)
  const supabase = createSupabaseClient()
  const evaluations = []

  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i]
    process.stderr.write(`[${i + 1}/${samples.length}] ${sample.id} ${sample.query}\n`)
    const results = args.strategy === 'fusion' || args.strategy === 'llm-fusion'
      ? await searchFusion(supabase, sample.query, args.limit, args.threshold, args.strategy === 'llm-fusion', { rerank: args.rerank })
      : await searchSimilarVectors(supabase, sample.query, args.limit, args.threshold)
    evaluations.push(evaluateCase(sample, results, args.limit, { includeContent: args.includeContent }))
  }

  const summary = summarize(evaluations)
  if (args.json) {
    console.log(JSON.stringify({
      config: {
        samplePath: path.relative(ROOT, args.samplePath),
        strategy: args.strategy,
        rerank: args.rerank,
        limit: args.limit,
        threshold: args.threshold,
      },
      summary,
      evaluations,
    }, null, 2))
    return
  }

  printReport(args, summary, evaluations)
}

main().catch((error) => {
  console.error(`\nRetrieval evaluation failed: ${error.message}`)
  process.exit(1)
})
